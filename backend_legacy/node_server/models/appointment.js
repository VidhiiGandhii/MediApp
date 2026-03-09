const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  doctorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Doctor', 
    required: true 
  },
  // We store these to avoid having to populate the doctor every time
  doctorName: { 
    type: String, 
    required: true 
  },
  specialty: { 
    type: String, 
    required: true 
  },
  appointmentTime: { 
    type: Date, 
    required: true 
  },
  status: {
    type: String,
    enum: ['upcoming', 'completed', 'cancelled'],
    default: 'upcoming'
  },
}, { 
  timestamps: true,
  indexes: [
    { fields: { userId: 1, appointmentTime: 1 } } // Index for fast user appointment lookups
  ]
});

const Appointment = mongoose.model('Appointment', appointmentSchema);
module.exports = Appointment;