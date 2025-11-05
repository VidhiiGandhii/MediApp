// 1. Use 'require' for all imports
const mongoose = require('mongoose');
const Appointment = require('../models/Appointment'); // Corrected path
const Doctor = require('../models/Doctor'); // Corrected path

// @desc    Get all appointments for the logged-in user
// @route   GET /api/appointments
// @access  Private
const getUserAppointments = async (req, res) => {
  try {
    // 2. Must call 'find' on the 'Appointment' model
    const appointments = await Appointment.find({ userId: req.user.id })
      .sort({ appointmentTime: 1 }); // Sort by upcoming

    res.json({ success: true, appointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch appointments' });
  }
};

// @desc    Book a new appointment
// @route   POST /api/appointments
// @access  Private
const bookAppointment = async (req, res) => {
  try {
    const { doctorId, appointmentTime } = req.body; // Expect an ISO 8601 Date string
    const userId = req.user.id;

    if (!doctorId || !appointmentTime) {
      return res.status(400).json({ success: false, message: 'Doctor ID and appointment time are required' });
    }

    // 3. Must call 'findById' on the 'Doctor' model
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    // Create the new appointment
    const newAppointment = new Appointment({
      userId,
      doctorId,
      appointmentTime: new Date(appointmentTime), // Convert string to Date
      doctorName: doctor.name,
      specialty: doctor.specialty,
      status: 'upcoming'
    });

    await newAppointment.save();
    console.log(`✅ Appointment booked for user ${userId} with ${doctor.name}`);
    res.status(201).json({ success: true, appointment: newAppointment });

  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ success: false, message: 'Failed to book appointment' });
  }
};

// @desc    Cancel an appointment
// @route   PUT /api/appointments/:id/cancel
// @access  Private
const cancelAppointment = async (req, res) => {
  try {
    // 4. Must call 'findOne' on the 'Appointment' model
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      userId: req.user.id // Ensure the user owns this appointment
    });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appointment.status !== 'upcoming') {
      return res.status(400).json({ success: false, message: 'Only upcoming appointments can be cancelled' });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    console.log(`✅ Appointment ${req.params.id} cancelled`);
    res.json({ success: true, appointment });

  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel appointment' });
  }
};

// 5. Use 'module.exports' instead of 'export default'
module.exports = {
  getUserAppointments,
  bookAppointment,
  cancelAppointment
};