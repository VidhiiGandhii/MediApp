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
console.log('Mounting auth routes');
router.use(authRoutes);

console.log('Mounting document routes');
router.use(documentRoutes);

console.log('Mounting health routes');
router.use(healthRoutes);

console.log('Mounting inventory routes');
router.use(inventoryRoutes);

console.log('Mounting medicine routes');
router.use(medicineRoutes);

console.log('Mounting user medication routes');
router.use(userMedicationRoutes);

console.log('Mounting doctor routes');
router.use(doctorRoutes);

console.log('Mounting appointment routes');
router.use(appointmentRoutes);

// Mount chat routes with /chat prefix
console.log('Mounting chat routes at /chat');
router.use('/chat', chatRoutes);

// TTS routes with /tts prefix
console.log('Mounting TTS routes at /tts');
router.use('/tts', ttsRoutes);

module.exports = router;
