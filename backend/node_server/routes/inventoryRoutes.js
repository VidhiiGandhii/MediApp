const express = require('express');
const {
  getInventory,
  getInventoryItem,
  addInventoryItem,
  updateInventoryItem,
  updateStock,
  deleteInventoryItem,
  getInventorySummary,
  importInventory,
  exportInventory
} = require('../controllers/inventoryController');
const { authenticateToken } = require('../middleware/authMiddleware');
const router = express.Router();

// NOTE: You might want to add an Admin-specific middleware here
// For now, we'll just use the standard authentication
router.use(authenticateToken);

/**
 * @route   GET /api/inventory/stats/summary
 * @desc    Get inventory dashboard statistics
 * @access  Private (Admin/Staff)
 */
router.get('/inventory/stats/summary', getInventorySummary);

/**
 * @route   POST /api/inventory/import
 * @desc    Bulk import inventory items
 * @access  Private (Admin/Staff)
 */
router.post('/inventory/import', importInventory);

/**
 * @route   GET /api/inventory/export
 * @desc    Export inventory as CSV
 * @access  Private (Admin/Staff)
 */
router.get('/inventory/export', exportInventory);

/**
 * @route   GET /api/inventory
 * @desc    Get all inventory items with filtering
 * @access  Private (Admin/Staff)
 */
router.get('/inventory', getInventory);

/**
 * @route   GET /api/inventory/:id
 * @desc    Get a single inventory item
 * @access  Private (Admin/Staff)
 */
router.get('/inventory/:id', getInventoryItem);

/**
 * @route   POST /api/inventory
 * @desc    Add a new item to inventory
 * @access  Private (Admin/Staff)
 */
router.post('/inventory', addInventoryItem);

/**
 * @route   PUT /api/inventory/:id
 * @desc    Update an inventory item's details
 * @access  Private (Admin/Staff)
 */
router.put('/inventory/:id', updateInventoryItem);

/**
 * @route   PATCH /api/inventory/:id/stock
 * @desc    Update only the stock quantity of an item
 * @access  Private (Admin/Staff)
 */
router.patch('/inventory/:id/stock', updateStock);

/**
 * @route   DELETE /api/inventory/:id
 * @desc    Delete an inventory item
 * @access  Private (Admin/Staff)
 */
router.delete('/inventory/:id', deleteInventoryItem);

module.exports = router;