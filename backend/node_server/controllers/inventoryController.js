const Inventory = require('../models/inventory');

/**
 * @route   GET /api/inventory
 * @desc    Get all inventory items with filtering
 * @access  Private (Admin/Staff)
 */
const getInventory = async (req, res, next) => {
  try {
    const { search, lowStock, expired } = req.query;
    let query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    if (lowStock === 'true') {
      query.$expr = { $lte: ['$quantity', '$lowStockThreshold'] };
    }

    let inventory = await Inventory.find(query).sort({ name: 1 });
    const now = new Date();

    if (expired === 'true') {
      inventory = inventory.filter(item => item.expiry && new Date(item.expiry) < now);
    }

    // Add status flags to each item
    const inventoryWithStatus = inventory.map(item => {
      const itemObj = item.toObject();
      itemObj.isLowStock = item.quantity <= item.lowStockThreshold;
      itemObj.isExpired = item.expiry && new Date(item.expiry) < now;
      itemObj.isExpiringSoon = item.expiry &&
        new Date(item.expiry) > now &&
        new Date(item.expiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      return itemObj;
    });

    res.json({ success: true, inventory: inventoryWithStatus, total: inventory.length });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch inventory' });
  }
};

/**
 * @route   GET /api/inventory/:id
 * @desc    Get a single inventory item
 * @access  Private (Admin/Staff)
 */
const getInventoryItem = async (req, res, next) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    res.json({ success: true, item });
  } catch (error)
 {
    console.error('Error fetching item:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch item' });
  }
};

/**
 * @route   POST /api/inventory
 * @desc    Add a new item to inventory
 * @access  Private (Admin/Staff)
 */
const addInventoryItem = async (req, res, next) => {
  try {
    const { name, quantity, category } = req.body;

    if (!name || quantity === undefined || !category) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const item = new Inventory(req.body);
    await item.save();
    console.log(`✅ Inventory item added: ${name}`);
    res.status(201).json({ success: true, item });
  } catch (error) {
    console.error('Error adding inventory item:', error);
    res.status(500).json({ success: false, message: 'Failed to add item' });
  }
};

/**
 * @route   PUT /api/inventory/:id
 * @desc    Update an inventory item's details
 * @access  Private (Admin/Staff)
 */
const updateInventoryItem = async (req, res, next) => {
  try {
    const item = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    res.json({ success: true, item });
  } catch (error) {
    console.error('Error updating inventory:', error);
    res.status(500).json({ success: false, message: 'Failed to update item' });
  }
};

/**
 * @route   PATCH /api/inventory/:id/stock
 * @desc    Update only the stock quantity of an item
 * @access  Private (Admin/Staff)
 */
const updateStock = async (req, res, next) => {
  try {
    const { quantity, reason } = req.body; // quantity can be positive or negative

    if (quantity === undefined) {
      return res.status(400).json({ success: false, message: 'Quantity required' });
    }

    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const newQuantity = item.quantity + Number(quantity);
    if (newQuantity < 0) {
      return res.status(400).json({ success: false, message: 'Insufficient stock' });
    }

    const updated = await Inventory.findByIdAndUpdate(
      req.params.id,
      { $inc: { quantity: Number(quantity) } },
      { new: true }
    );

    console.log(`📦 Stock updated: ${item.name} → ${updated.quantity} (${reason || 'manual'})`);

    res.json({
      success: true,
      item: updated,
      message: `Stock updated to ${updated.quantity}`,
      isLowStock: updated.quantity <= updated.lowStockThreshold
    });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ success: false, message: 'Failed to update stock' });
  }
};

/**
 * @route   DELETE /api/inventory/:id
 * @desc    Delete an inventory item
 * @access  Private (Admin/Staff)
 */
const deleteInventoryItem = async (req, res, next) => {
  try {
    const item = await Inventory.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    console.log(`🗑️ Inventory item deleted: ${item.name}`);
    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ success: false, message: 'Failed to delete item' });
  }
};

/**
 * @route   GET /api/inventory/stats/summary
 * @desc    Get inventory dashboard statistics
 * @access  Private (Admin/Staff)
 */
const getInventorySummary = async (req, res, next) => {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const total = await Inventory.countDocuments();
    const lowStock = await Inventory.countDocuments({
      $expr: { $lte: ['$quantity', '$lowStockThreshold'] }
    });
    const expired = await Inventory.countDocuments({ expiry: { $lt: now } });
    const expiringSoon = await Inventory.countDocuments({
      expiry: { $gte: now, $lte: thirtyDaysFromNow }
    });

    const totalValueAgg = await Inventory.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: { $multiply: ['$quantity', { $ifNull: ['$costPerUnit', 0] }] } }
        }
      }
    ]);

    res.json({
      success: true,
      stats: {
        totalItems: total,
        lowStockItems: lowStock,
        expiredItems: expired,
        expiringSoonItems: expiringSoon,
        totalInventoryValue: totalValueAgg[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
  }
};

/**
 * @route   POST /api/inventory/import
 * @desc    Bulk import inventory items
 * @access  Private (Admin/Staff)
 */
const importInventory = async (req, res, next) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Items array required' });
    }

    // `ordered: false` continues even if some duplicates fail
    const result = await Inventory.insertMany(items, { ordered: false }).catch(err => {
      if (err.code === 11000) { // Handle duplicate key errors gracefully
        return { insertedCount: err.result.nInserted };
      }
      throw err; // Re-throw other errors
    });

    const count = result.length || result.insertedCount || 0;
    console.log(`📥 Imported ${count} inventory items`);

    res.json({
      success: true,
      message: `Imported ${count} items`,
      count
    });
  } catch (error) {
    console.error('Error importing inventory:', error);
    res.status(500).json({ success: false, message: 'Failed to import items' });
  }
};

/**
 * @route   GET /api/inventory/export
 * @desc    Export inventory as CSV
 * @access  Private (Admin/Staff)
 */
const exportInventory = async (req, res, next) => {
  try {
    const inventory = await Inventory.find().sort({ name: 1 });
    const csvHeader = 'name,quantity,expiry,category,location,batchNumber,supplier,costPerUnit';
    
    const csvRows = inventory.map(item =>
      [
        `"${item.name}"`,
        item.quantity,
        `"${item.expiry || ''}"`,
        `"${item.category || ''}"`,
        `"${item.location || ''}"`,
        `"${item.batchNumber || ''}"`,
        `"${item.supplier || ''}"`,
        item.costPerUnit || ''
      ].join(',')
    );

    const csv = [csvHeader, ...csvRows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=inventory_export.csv');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting inventory:', error);
    res.status(500).json({ success: false, message: 'Failed to export inventory' });
  }
};

module.exports = {
  getInventory,
  getInventoryItem,
  addInventoryItem,
  updateInventoryItem,
  updateStock,
  deleteInventoryItem,
  getInventorySummary,
  importInventory,
  exportInventory
};