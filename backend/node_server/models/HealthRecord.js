const mongoose = require('mongoose');

// Health Record Schema
const healthRecordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  predicted_disease: String,
  confidence_score: Number,
  symptoms: [String],
  timestamp: { type: Date, default: Date.now }
});

const HealthRecord = mongoose.model('HealthRecord', healthRecordSchema);

module.exports = HealthRecord;