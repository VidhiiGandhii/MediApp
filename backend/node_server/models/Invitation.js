const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema({
  familyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Family', 
    required: true 
  },
  inviterId: { // The user who sent the invite (admin)
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  inviteeEmail: { // The email of the person being invited
    type: String, 
    required: true, 
    lowercase: true, 
    trim: true 
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending'
  }
}, { timestamps: true });

const Invitation = mongoose.model('Invitation', invitationSchema);
module.exports = Invitation;