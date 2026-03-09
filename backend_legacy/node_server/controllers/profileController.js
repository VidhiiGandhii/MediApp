const Profile = require('../models/Profile');

// @desc    Get all profiles managed by the logged-in user
// @route   GET /api/profiles
// @access  Private
const getMyProfiles = async (req, res) => {
  try {
    const profiles = await Profile.find({ adminId: req.user.id });
    res.json({ success: true, profiles });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Create a new dependent profile
// @route   POST /api/profiles
// @access  Private
const createDependentProfile = async (req, res) => {
  try {
    const { name, relationship, age } = req.body;
    if (!name || !relationship || !age) {
      return res.status(400).json({ success: false, message: 'Name, relationship, and age are required' });
    }
    const newProfile = new Profile({
      adminId: req.user.id,
      name,
      relationship,
      age,
      type: 'dependent'
    });
    await newProfile.save();
    res.status(201).json({ success: true, profile: newProfile });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update a dependent profile
// @route   PUT /api/profiles/:id
// @access  Private
const updateDependentProfile = async (req, res) => {
  try {
    const { name, relationship, age } = req.body;
    const profile = await Profile.findOne({
      _id: req.params.id,
      adminId: req.user.id
    });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }
    
    profile.name = name || profile.name;
    profile.relationship = relationship || profile.relationship;
    profile.age = age || profile.age;
    
    await profile.save();
    res.json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Remove a dependent profile
// @route   DELETE /api/profiles/:id
// @access  Private
const removeDependentProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({
      _id: req.params.id,
      adminId: req.user.id
    });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }
    if (profile.type === 'self') {
      return res.status(400).json({ success: false, message: 'Cannot delete your own profile' });
    }
    
    // TODO: Also delete all linked data (meds, appointments)
    
    await profile.deleteOne();
    res.json({ success: true, message: 'Profile removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getMyProfiles,
  createDependentProfile,
  updateDependentProfile,
  removeDependentProfile
};