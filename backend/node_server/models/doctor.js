const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  specialty: { 
    type: String, 
    required: true 
  },
  
  rating: { 
    type: Number, 
    default: 0 
  },
  profilePicUrl: { 
    type: String 
  },
  // You can add more fields like location, bio, etc.
}, { timestamps: true });

const Doctor = mongoose.model('Doctor', doctorSchema);
module.exports = Doctor;