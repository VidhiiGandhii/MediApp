const express = require('express');
const {
  getMedicines,
  getMedicineCategories,
  addMedicine
} = require('../controllers/medicineController');
const { authenticateToken } = require('../middleware/authMiddleware');
const router = express.Router();

/**
 * @route   GET /api/medicines
 * @desc    Get all medicines from inventory with search/filter
 * @access  Public
 */
router.get('/medicines', getMedicines);

/**
 * @route   GET /api/medicines/categories
 * @desc    Get all unique medicine categories
 * @access  Public
 */
router.get('/medicines/categories', getMedicineCategories);

/**
 * @route   POST /api/medicines
 * @desc    Add a new medicine to the inventory (Admin/Protected)
 * @access  Private
 */
// This should probably be admin-only, but for now, it's just authenticated
router.post('/medicines', authenticateToken, addMedicine);

module.exports = router;