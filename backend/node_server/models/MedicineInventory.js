const mongoose = require('mongoose');

// Medicine Inventory Schema
const medicineInventorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  genericName: { type: String },
  category: { type: String, required: true },
  description: { type: String },
  commonDosage: [String],
  sideEffects: [String],
  imageUrl: { type: String },
  requiresPrescription: { type: Boolean, default: false }
}, { timestamps: true });

const MedicineInventory = mongoose.model('MedicineInventory', medicineInventorySchema);

module.exports = MedicineInventory;