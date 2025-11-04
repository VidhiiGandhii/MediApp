const express = require('express');
const {
  getAllDoctors,
  getDoctorById,
  populateDoctors
} = require('../controllers/doctorController');
const router = express.Router();

// Public routes
router.get('/doctors', getAllDoctors);
router.get('/doctors/:id', getDoctorById);

// Utility route to add your mock data
router.post('/doctors/populate', populateDoctors);

module.exports = router;