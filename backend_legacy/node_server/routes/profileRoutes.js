const express = require('express');
const {
  getMyProfiles,
  createDependentProfile,
  updateDependentProfile,
  removeDependentProfile
} = require('../controllers/profileController');
const { authenticateToken } = require('../middleware/authMiddleware');
const router = express.Router();

router.use(authenticateToken);

router.get('/profiles', getMyProfiles);
router.post('/profiles', createDependentProfile);
router.put('/profiles/:id', updateDependentProfile);
router.delete('/profiles/:id', removeDependentProfile);

module.exports = router;