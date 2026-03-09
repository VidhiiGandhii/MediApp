const express = require('express');
const {
  getUserMedications,
  addUserMedication,
  updateUserMedication,
  deactivateUserMedication,
  recordMedicationIntake,
  getMedicationHistory,
  getTodaySchedule
} = require('../controllers/userMedicationController');
const { authenticateToken } = require('../middleware/authMiddleware');
const router = express.Router();

// Apply authentication middleware to all user medication routes
router.use(authenticateToken);

/**
 * @route   GET /api/medications/history/:userId
 * @desc    Get medication history for a user
 * @access  Private
 */
router.get('/medications/history/:userId', getMedicationHistory);

/**
 * @route   GET /api/medications/today/:userId
 * @desc    Get today's medication schedule for a user
 * @access  Private
 */
router.get('/medications/today/:userId', getTodaySchedule);

/**
 * @route   GET /api/medications/:userId
 * @desc    Get all medications for a user
 * @access  Private (user must match)
 */
router.get('/medications/:userId', getUserMedications);

/**
 * @route   POST /api/medications
 * @desc    Add a new medication for a user
 * @access  Private
 */
router.post('/medications', addUserMedication);

/**
 * @route   POST /api/medications/intake
 * @desc    Record a medication intake (taken, skipped)
 * @access  Private
 */
router.post('/medications/intake', recordMedicationIntake);

/**
 * @route   PUT /api/medications/:id
 * @desc    Update a user's medication
 * @access  Private
 */
router.put('/medications/:id', updateUserMedication);

/**
 * @route   DELETE /api/medications/:id
 * @desc    Deactivate a user's medication (soft delete)
 * @access  Private
 */
router.delete('/medications/:id', deactivateUserMedication);

module.exports = router;