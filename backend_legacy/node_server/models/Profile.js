const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  // The main user account that 'owns' this profile
  adminId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  relationship: {
    type: String,
    required: true
  },
  age: {
    type: Number
  },
  // 'self' for the main user, 'dependent' for family members
  type: {
    type: String,
    enum: ['self', 'dependent'],
    default: 'dependent'
  }
}, { timestamps: true });

const Profile = mongoose.model('Profile', profileSchema);
module.exports = Profile;