const express = require('express');
const {
  getSymptomList,
  checkSymptoms,
  saveHealthRecord,
  getHealthRecords
} = require('../controllers/healthController');
const { authenticateToken } = require('../middleware/authMiddleware');
const router = express.Router();

/**
 * @route   GET /api/symptoms
 * @desc    Get the list of all possible symptoms
 * @access  Public
 */
router.get('/symptoms', getSymptomList);

/**
 * @route   POST /api/symptom-check
 * @desc    Send symptoms to AI service for prediction
 * @access  Public
 */
router.post('/symptom-check', checkSymptoms);

/**
 * @route   POST /api/health-records
 * @desc    Save a health record (prediction) for a user
 * @access  Private
 */
router.post('/health-records', authenticateToken, saveHealthRecord);

/**
 * @route   GET /api/health-records
 * @desc    Get all health records for the logged-in user
 * @access  Private
 */
router.get('/health-records', authenticateToken, getHealthRecords);

module.exports = router;