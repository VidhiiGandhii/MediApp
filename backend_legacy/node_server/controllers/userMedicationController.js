const UserMedication = require('../models/UserMedication');
const MedicationHistory = require('../models/MedicationHistory');
require('../models/inventory');
/**
 * @route   GET /api/medications/:userId
 * @desc    Get all medications for a user
 * @access  Private (user must match)
 */
const getUserMedications = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (req.user.id !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { active } = req.query;
    let query = { userId };
    if (active !== undefined) {
      query.isActive = active === 'true';
    }

    const medications = await UserMedication.find(query)
      .populate('medicineId') // Populates from MedicineInventory
      .sort({ createdAt: -1 });

    res.json({ success: true, medications });
  } catch (error) {
    console.error('Error fetching medications:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch medications' });
  }
};

/**
 * @route   POST /api/medications
 * @desc    Add a new medication for a user
 * @access  Private
 */
const addUserMedication = async (req, res, next) => {
  try {
    const { userId, medicineId, dosage, frequency, times, startDate } = req.body;

    if (!userId || !medicineId || !dosage || !frequency || !times || !startDate) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (req.user.id !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const medication = new UserMedication(req.body);
    await medication.save();
    await medication.populate('medicineId'); // Send back populated data

    res.status(201).json({ success: true, medication });
  } catch (error) {
    console.error('Error adding medication:', error);
    res.status(500).json({ success: false, message: 'Failed to add medication' });
  }
};

/**
 * @route   PUT /api/medications/:id
 * @desc    Update a user's medication
 * @access  Private
 */
const updateUserMedication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const medication = await UserMedication.findById(id);

    if (!medication) {
      return res.status(404).json({ success: false, message: 'Medication not found' });
    }

    if (medication.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const updated = await UserMedication.findByIdAndUpdate(id, req.body, { new: true })
      .populate('medicineId');
      
    res.json({ success: true, medication: updated });
  } catch (error) {
    console.error('Error updating medication:', error);
    res.status(500).json({ success: false, message: 'Failed to update medication' });
  }
};

/**
 * @route   DELETE /api/medications/:id
 * @desc    Deactivate a user's medication (soft delete)
 * @access  Private
 */
const deactivateUserMedication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const medication = await UserMedication.findById(id);

    if (!medication) {
      return res.status(404).json({ success: false, message: 'Medication not found' });
    }

    if (medication.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await UserMedication.findByIdAndUpdate(id, { isActive: false });
    res.json({ success: true, message: 'Medication deactivated' });
  } catch (error) {
    console.error('Error deleting medication:', error);
    res.status(500).json({ success: false, message: 'Failed to delete medication' });
  }
};

/**
 * @route   POST /api/medications/intake
 * @desc    Record a medication intake (taken, skipped)
 * @access  Private
 */
const recordMedicationIntake = async (req, res, next) => {
  try {
    const { medicationId, status, notes, scheduledTime } = req.body;

    if (!medicationId || !status) {
      return res.status(400).json({ success: false, message: 'Medication ID and status required' });
    }

    const medication = await UserMedication.findById(medicationId);
    if (!medication) {
      return res.status(404).json({ success: false, message: 'Medication not found' });
    }

    if (medication.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const history = new MedicationHistory({
      userId: req.user.id,
      medicationId,
      // Use scheduledTime from client when provided (ISO string), otherwise fall back to now
      scheduledTime: scheduledTime ? new Date(scheduledTime) : new Date(),
      takenTime: status === 'taken' ? new Date() : null,
      status,
      notes
    });

    await history.save();

    // Decrement stock if taken
    if (status === 'taken' && medication.stock > 0) {
      const updated = await UserMedication.findByIdAndUpdate(
        medicationId,
        { $inc: { stock: -1 } },
        { new: true }
      );

      // Determine if we should prompt for refill
      const shouldRefill = typeof updated.refillThreshold === 'number'
        ? updated.stock <= updated.refillThreshold
        : updated.stock <= 7;

      return res.status(201).json({
        success: true,
        history,
        remainingStock: updated.stock,
        shouldRefill,
      });
    }

    res.status(201).json({ success: true, history });

  } catch (error) {
    console.error('Error recording intake:', error);
    res.status(500).json({ success: false, message: 'Failed to record intake' });
  }
};

/**
 * @route   GET /api/medications/history/:userId
 * @desc    Get medication history for a user
 * @access  Private
 */
const getMedicationHistory = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (req.user.id !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { startDate, endDate } = req.query;
    let query = { userId };

    if (startDate || endDate) {
      query.scheduledTime = {};
      if (startDate) query.scheduledTime.$gte = new Date(startDate);
      if (endDate) query.scheduledTime.$lte = new Date(endDate);
    }

    const history = await MedicationHistory.find(query)
      .populate({
        path: 'medicationId',
        populate: { path: 'medicineId' } // Nested populate
      })
      .sort({ scheduledTime: -1 });

    res.json({ success: true, history });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch history' });
  }
};

/**
 * @route   GET /api/medications/today/:userId
 * @desc    Get today's medication schedule for a user
 * @access  Private
 */
const getTodaySchedule = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (req.user.id !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    // Get all active medications
    const medications = await UserMedication.find({
      userId,
      isActive: true,
      reminderEnabled: true
    }).populate('medicineId');

    // Get all history entries for today
    const history = await MedicationHistory.find({
      userId,
      scheduledTime: { $gte: startOfDay, $lte: endOfDay }
    });

    const schedule = [];
    medications.forEach(med => {
      med.times.forEach(time => {
        const scheduledTime = new Date(today);
        scheduledTime.setHours(time.hour, time.minute, 0, 0);

        // Find if this specific dose has been logged
        const historyEntry = history.find(h =>
          h.medicationId.toString() === med._id.toString() &&
          Math.abs(h.scheduledTime - scheduledTime) < 60000 // 1 min tolerance
        );

        schedule.push({
          medication: med,
          scheduledTime,
          status: historyEntry ? historyEntry.status : 'pending',
          historyId: historyEntry?._id
        });
      });
    });

    schedule.sort((a, b) => a.scheduledTime - b.scheduledTime);
    res.json({ success: true, schedule });

  } catch (error) {
    console.error('Error fetching today schedule:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch schedule' });
  }
};


module.exports = {
  getUserMedications,
  addUserMedication,
  updateUserMedication,
  deactivateUserMedication,
  recordMedicationIntake,
  getMedicationHistory,
  getTodaySchedule
};