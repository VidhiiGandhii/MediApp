const mongoose = require('mongoose');

// Document Metadata Schema (stores reference to GridFS file)
const documentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileName: { type: String, required: true },
  fileId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Reference to GridFS file
  fileType: { type: String },
  fileSize: { type: Number },
  category: { type: String, enum: ['Prescription', 'Report', 'Bill', 'Other'] },
  description: { type: String },
  uploadedAt: { type: Date, default: Date.now },
});

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;