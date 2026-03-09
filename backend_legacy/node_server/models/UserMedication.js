const mongoose = require('mongoose');

// User Medication Schema
const userMedicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
  medicineName: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
  times: [{
    hour: { type: Number, required: true, min: 0, max: 23 },
    minute: { type: Number, required: true, min: 0, max: 59 }
  }],
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  instructions: { type: String },
  reminderEnabled: { type: Boolean, default: true },
  stock: { type: Number, default: 0 },
  refillReminder: { type: Boolean, default: true },
  refillThreshold: { type: Number, default: 7 },
  notes: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const UserMedication = mongoose.model('UserMedication', userMedicationSchema);

module.exports = UserMedication;