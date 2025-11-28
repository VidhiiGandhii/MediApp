const express = require('express');
const {
  getUserAppointments,
  bookAppointment,
  cancelAppointment,
  deleteAppointment,
  clearCancelledAppointments
} = require('../controllers/appointmentController');
const { authenticateToken } = require('../middleware/authMiddleware');
const router = express.Router();

// // --- Apply auth middleware to all appointment routes ---
router.use(authenticateToken);

router.get('/appointments', getUserAppointments);
router.post('/appointments', bookAppointment);
router.put('/appointments/:id/cancel', cancelAppointment);
// Place the static clear route before the parameterized route to avoid
// Express interpreting 'clear-cancelled' as an :id.
router.delete('/appointments/clear-cancelled', clearCancelledAppointments);
router.delete('/appointments/:id', deleteAppointment);

module.exports = router;