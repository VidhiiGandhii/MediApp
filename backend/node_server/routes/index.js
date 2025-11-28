// backend/routes/index.js
const express = require('express');
const router = express.Router();

// Import all route modules
const authRoutes = require('./authRoutes');
const documentRoutes = require('./documentRoutes');
const healthRoutes = require('./healthRoutes');
const inventoryRoutes = require('./inventoryRoutes');
const medicineRoutes = require('./medicineRoutes');
const userMedicationRoutes = require('./userMedicationRoutes');
const doctorRoutes = require('./doctorRoutes');
const appointmentRoutes = require('./appointmentRoutes');
const chatRoutes = require('./chatRoutes');
const ttsRoutes = require('./ttsRoutes');

// Mount all routes onto the main router
router.use(authRoutes);
router.use(documentRoutes);
router.use(healthRoutes);
router.use(inventoryRoutes);
router.use(medicineRoutes);
router.use(userMedicationRoutes);
router.use(doctorRoutes);
router.use(appointmentRoutes);
router.use(chatRoutes);
router.use('/tts', ttsRoutes); // TTS routes with /tts prefix

module.exports = router;
