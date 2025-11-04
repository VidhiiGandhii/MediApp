const express = require('express');
const router = express.Router();
const { getAllInventory, updateStock, getStats } = require('../controllers/inventory.controller');

router.get('/', getAllInventory);
router.patch('/:id/stock', updateStock);
router.get('/stats/summary', getStats);

module.exports = router;