const User = require('../models/User');
const Family = require('../models/Family');
const Invitation = require('../models/Invitation');
const Appointment = require('../models/Appointment'); // For data sharing

// We need to register all models that will be populated

// @desc    Get the user's current family and its members
// @route   GET /api/family
// @access  Private
const getMyFamily = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.familyId) {
      return res.json({ success: true, family: null, members: [] });
    }

    const family = await Family.findById(user.familyId).populate('adminId', 'name username');
    const members = await User.find({ familyId: user.familyId }).select('name username email');
    
    res.json({ success: true, family, members });
  } catch (error) {
    console.error('Error getting family:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Create a new family
// @route   POST /api/family
// @access  Private
const createFamily = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Family name is required' });
    }

    const user = await User.findById(req.user.id);
    if (user.familyId) {
      return res.status(400).json({ success: false, message: 'You are already in a family' });
    }

    // 1. Create the new family
    const newFamily = new Family({
      name,
      adminId: req.user.id
    });
    await newFamily.save();

    // 2. Add the admin to this family
    user.familyId = newFamily._id;
    await user.save();

    res.status(201).json({ success: true, family: newFamily });
  } catch (error) {
    console.error('Error creating family:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Send an invitation to a user
// @route   POST /api/family/invite
// @access  Private
const inviteToFamily = async (req, res) => {
  try {
    const { inviteeEmail } = req.body;
    const inviter = await User.findById(req.user.id);

    // 1. Check if inviter is in a family
    if (!inviter.familyId) {
      return res.status(400).json({ success: false, message: 'You must create a family first' });
    }

    // 2. Check if inviter is the admin
    const family = await Family.findById(inviter.familyId);
    if (family.adminId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the family admin can send invites' });
    }

    // 3. Find the user being invited
    const invitee = await User.findOne({ email: inviteeEmail.toLowerCase() });
    if (!invitee) {
      return res.status(404).json({ success: false, message: 'User with that email not found' });
    }

    // 4. Check if invitee is already in a family
    if (invitee.familyId) {
      return res.status(400).json({ success: false, message: 'User is already in a family' });
    }
    
    // 5. Check for an existing pending invite
    const existingInvite = await Invitation.findOne({
      familyId: inviter.familyId,
      inviteeEmail: invitee.email,
      status: 'pending'
    });
    if (existingInvite) {
      return res.status(400).json({ success: false, message: 'Invitation already pending' });
    }

    // 6. Create and send invite
    const invitation = new Invitation({
      familyId: inviter.familyId,
      inviterId: req.user.id,
      inviteeEmail: invitee.email
    });
    await invitation.save();

    res.status(201).json({ success: true, message: 'Invitation sent' });

  } catch (error) {
    console.error('Error inviting to family:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get all pending invites for the logged-in user
// @route   GET /api/family/invites
// @access  Private
const getMyInvites = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const invites = await Invitation.find({ 
      inviteeEmail: user.email, 
      status: 'pending' 
    }).populate('familyId', 'name'); // Show the family name
    
    res.json({ success: true, invites });
  } catch (error) {
    console.error('Error getting invites:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Respond to an invitation (accept or decline)
// @route   POST /api/family/invites/:id
// @access  Private
const respondToInvite = async (req, res) => {
  try {
    const { id } = req.params;
    const { response } = req.body; // 'accept' or 'decline'
    const user = await User.findById(req.user.id);

    const invite = await Invitation.findById(id);

    // 1. Validate invite
    if (!invite) {
      return res.status(404).json({ success: false, message: 'Invitation not found' });
    }
    if (invite.inviteeEmail !== user.email || invite.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Invalid invitation' });
    }
    if (user.familyId) {
      return res.status(400).json({ success: false, message: 'You are already in a family' });
    }

    if (response === 'accept') {
      // 2. Add user to family
      user.familyId = invite.familyId;
      await user.save();

      // 3. Update invite status
      invite.status = 'accepted';
      await invite.save();

      // 4. (Optional) Decline all other pending invites for this user
      await Invitation.updateMany(
        { inviteeEmail: user.email, status: 'pending' },
        { status: 'declined' }
      );
      
      res.json({ success: true, message: 'Invitation accepted' });
    } else {
      // 3. Decline invite
      invite.status = 'declined';
      await invite.save();
      res.json({ success: true, message: 'Invitation declined' });
    }
  } catch (error) {
    console.error('Error responding to invite:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Remove a member from the family (admin only)
// @route   DELETE /api/family/members/:memberId
// @access  Private
const removeFamilyMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const adminUser = await User.findById(req.user.id);
    const family = await Family.findById(adminUser.familyId);

    // 1. Check if user is admin
    if (!family || family.adminId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You are not the admin of this family' });
    }
    // 2. Admin cannot remove themselves
    if (memberId === req.user.id) {
      return res.status(400).json({ success: false, message: "Admin cannot be removed. Please delete the family instead." });
    }

    // 3. Find and remove the user
    const member = await User.findById(memberId);
    if (!member || member.familyId?.toString() !== family._id.toString()) {
      return res.status(404).json({ success: false, message: 'Member not found in this family' });
    }

    member.familyId = null;
    await member.save();

    res.json({ success: true, message: 'Member removed' });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get all appointments for all family members
// @route   GET /api/family/appointments
// @access  Private
const getFamilyAppointments = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.familyId) {
      return res.status(400).json({ success: false, message: 'You are not in a family' });
    }
    
    // 1. Find all member IDs in the family
    const members = await User.find({ familyId: user.familyId }).select('_id');
    const memberIds = members.map(m => m._id);

    // 2. Find all appointments where userId is one of the family members
    const appointments = await Appointment.find({
      userId: { $in: memberIds },
      status: 'upcoming'
    })
    .populate('userId', 'name') // Add the name of the person
    .sort({ appointmentTime: 1 });

    res.json({ success: true, appointments });

  } catch (error) {
    console.error('Error getting family appointments:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


module.exports = {
  getMyFamily,
  createFamily,
  inviteToFamily,
  getMyInvites,
  respondToInvite,
  removeFamilyMember,
  getFamilyAppointments
};