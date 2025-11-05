const express = require('express');
const {
  getMyFamily,
  createFamily,
  inviteToFamily,
  getMyInvites,
  respondToInvite,
  removeFamilyMember,
  getFamilyAppointments
} = require('../controllers/familyController');
const { authenticateToken } = require('../middleware/authMiddleware');
const router = express.Router();

// All family routes are private
router.use(authenticateToken);

// Manage family itself
router.get('/family', getMyFamily);
router.post('/family', createFamily);

// Manage invites
router.get('/family/invites', getMyInvites);
router.post('/family/invites/:id', respondToInvite);
router.post('/family/invite', inviteToFamily);

// Manage members
router.delete('/family/members/:memberId', removeFamilyMember);

// Get shared data
router.get('/family/appointments', getFamilyAppointments);
// You can add more data routes here like /api/family/medications

module.exports = router;