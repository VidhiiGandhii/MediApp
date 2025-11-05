const express = require('express');
const {
  getUserAppointments,
  bookAppointment,
  cancelAppointment
} = require('../controllers/appointmentController');
const { authenticateToken } = require('../middleware/authMiddleware');
const router = express.Router();

// // --- Apply auth middleware to all appointment routes ---
// router.use(authenticateToken);

router.get('/appointments', getUserAppointments);
router.post('/appointments', bookAppointment);
router.put('/appointments/:id/cancel', cancelAppointment);

module.exports = router;