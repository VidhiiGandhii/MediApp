const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  quantity: { type: Number, required: true, default: 0 },
  expiry: Date,
  category: String,
  lowStockThreshold: { type: Number, default: 20 }
}, { timestamps: true });

module.exports = mongoose.model('Inventory', inventorySchema);