// models/Document.js
const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    name: { type: String, required: true }, // The filename from the client
    category: { 
        type: String, 
        required: true,
        enum: ["Prescription", "Report", "Bill", "Other"] // Matches your frontend categories
    },
    fileUrl: { type: String, required: true }, // URL/Path to the file in cloud storage (S3/Firebase)
    fileMimeType: { type: String }, // e.g., application/pdf, image/jpeg
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);
