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

// --- NO GLOBAL AUTHENTICATION ---
// router.use(authenticateToken); // <-- DELETE THIS LINE

// --- PUBLIC ROUTES (for searching and viewing) ---
router.get('/inventory', getInventory);
router.get('/inventory/:id', getInventoryItem);

// --- PRIVATE ROUTES (for managing) ---
router.get('/inventory/stats/summary', authenticateToken, getInventorySummary);
router.post('/inventory/import', authenticateToken, importInventory);
router.get('/inventory/export', authenticateToken, exportInventory);
router.post('/inventory', authenticateToken, addInventoryItem);
router.put('/inventory/:id', authenticateToken, updateInventoryItem);
router.patch('/inventory/:id/stock', authenticateToken, updateStock);
router.delete('/inventory/:id', authenticateToken, deleteInventoryItem);

module.exports = router;