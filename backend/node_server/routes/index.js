const express = require('express');
const router = express.Router();

// Import all route modules
const authRoutes = require('./authRoutes');
const documentRoutes = require('./documentRoutes');
const healthRoutes = require('./healthRoutes');
const inventoryRoutes = require('./inventoryRoutes');
const medicineRoutes = require('./medicineRoutes');
const userMedicationRoutes = require('./userMedicationRoutes');

// Mount all routes onto the main router
// The path prefix (e.g., '/api') is handled in app.js
router.use(authRoutes);
router.use(documentRoutes);
router.use(healthRoutes);
router.use(inventoryRoutes);
router.use(medicineRoutes);
router.use(userMedicationRoutes);

module.exports = router;