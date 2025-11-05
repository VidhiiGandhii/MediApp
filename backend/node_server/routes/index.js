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

// Mount all routes onto the main router
router.use(authRoutes);
router.use(documentRoutes);
router.use(healthRoutes);
router.use(inventoryRoutes);
router.use(medicineRoutes);
router.use(userMedicationRoutes);
router.use(doctorRoutes);
router.use(appointmentRoutes);

// NO authenticateToken middleware should be here

// Mount all routes onto the main router with their resource prefixes.
// CRITICAL: The string argument specifies the base path for each router.
// The final URL structure for appointments is: /api + /appointments
router.use( authRoutes);
router.use( documentRoutes);
router.use( healthRoutes);
router.use( inventoryRoutes);
router.use( medicineRoutes);
router.use( userMedicationRoutes);
router.use( appointmentRoutes); // FIX: /appointments prefix add
router.use(doctorRoutes);


module.exports = router;
