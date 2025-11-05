
const Doctor = require('../models/Doctor');


// @desc    Get all doctors
// @route   GET /api/doctors
// @access  Public
const getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find().sort({ rating: -1 });
    res.json({ success: true, doctors });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch doctors' });
  }
};

// @desc    Get a single doctor by ID
// @route   GET /api/doctors/:id
// @access  Public
const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    res.json({ success: true, doctor });
  } catch (error) {
    console.error('Error fetching doctor:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch doctor' });
  }
};

// @desc    (Utility) Populate doctors from your mock data
// @route   POST /api/doctors/populate
// @access  Public (for easy setup)
const populateDoctors = async (req, res) => {
  const MOCK_DOCTORS = [
    { name: 'Dr. Rishi', specialty: 'Cardiologist', rating: 4.8 },
    { name: 'Dr. Vaamana', specialty: 'Dentist', rating: 4.7 },
    { name: 'Dr. Nallarasu', specialty: 'Orthopaedic', rating: 4.9 },
    { name: 'Dr. Nihal', specialty: 'Neurologist', rating: 4.6 },
  ];

  try {
    // Clear existing doctors to avoid duplicates
    await Doctor.deleteMany({});
    const createdDoctors = await Doctor.insertMany(MOCK_DOCTORS);
    console.log('✅ Doctors populated');
    res.status(201).json({ 
      success: true, 
      message: 'Doctors populated successfully', 
      count: createdDoctors.length 
    });
  } catch (error) {
    console.error('Error populating doctors:', error);
    res.status(500).json({ success: false, message: 'Failed to populate doctors' });
  }
};

module.exports = {
  getAllDoctors,
  getDoctorById,
  populateDoctors
};