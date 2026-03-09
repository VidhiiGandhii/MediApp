const mongoose = require('mongoose');

const familySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Family name is required'] 
  },
  adminId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
}, { timestamps: true });

const Family = mongoose.model('Family', familySchema);
module.exports = Family;