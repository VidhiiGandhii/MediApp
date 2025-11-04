const mongoose = require('mongoose');

// Medication History Schema
const medicationHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  medicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserMedication', required: true },
  scheduledTime: { type: Date, required: true },
  takenTime: { type: Date },
  status: {
    type: String,
    enum: ['pending', 'taken', 'skipped', 'missed'],
    default: 'pending'
  },
  notes: { type: String }
}, { timestamps: true });

const MedicationHistory = mongoose.model('MedicationHistory', medicationHistorySchema);

module.exports = MedicationHistory;