const HealthRecord = require('../models/HealthRecord');
const { getSymptoms } = require('../services/symptomService');
const { predictDisease } = require('../services/aiService');

/**
 * @route   GET /api/symptoms
 * @desc    Get the list of all possible symptoms
 * @access  Public
 */
const getSymptomList = (req, res, next) => {
  try {
    const symptomsList = getSymptoms();
    console.log(`✅ Loaded ${symptomsList.length} symptoms`);
    res.json(symptomsList);
  } catch (error) {
    console.error('Error reading symptoms file:', error);
    res.status(500).json({
      error: 'Could not load symptom list',
      details: error.message
    });
  }
};

/**
 * @route   POST /api/symptom-check
 * @desc    Send symptoms to AI service for prediction
 * @access  Public
 */
const checkSymptoms = async (req, res, next) => {
  try {
    const { symptoms, user_id } = req.body;

    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({ error: 'Valid symptoms array required' });
    }

    console.log(`🔍 Symptom check: ${symptoms.length} symptoms`);

    const predictionData = await predictDisease(symptoms, user_id);

    console.log(`✅ Prediction: ${predictionData.predicted_disease}`);
    res.json(predictionData);

  } catch (error) {
    console.error('Error calling Python AI:', error.message);

    if (error.message.includes('timed out')) {
      return res.status(504).json({ error: 'AI service request timed out' });
    }
    if (error.message.includes('AI server error')) {
      return res.status(502).json({ error: 'AI service returned an error' });
    }

    res.status(500).json({
      error: 'Failed to get prediction',
      details: error.message
    });
  }
};

/**
 * @route   POST /api/health-records
 * @desc    Save a health record (prediction) for a user
 * @access  Private
 */
const saveHealthRecord = async (req, res, next) => {
  try {
    const { predicted_disease, confidence_score, symptoms } = req.body;

    if (!predicted_disease || confidence_score === undefined || !symptoms) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const record = new HealthRecord({
      userId: req.user.id,
      predicted_disease,
      confidence_score,
      symptoms,
      timestamp: new Date()
    });

    await record.save();
    console.log(`💾 Health record saved for user: ${req.user.username}`);
    res.status(201).json({ success: true, record });
  } catch (error) {
    console.error('Error saving health record:', error);
    res.status(500).json({ success: false, message: 'Failed to save record' });
  }
};

/**
 * @route   GET /api/health-records
 * @desc    Get all health records for the logged-in user
 * @access  Private
 */
const getHealthRecords = async (req, res, next) => {
  try {
    const records = await HealthRecord.find({ userId: req.user.id }).sort({ timestamp: -1 });

    console.log(`📋 Retrieved ${records.length} health records for user: ${req.user.username}`);
    res.json({ success: true, records });
  } catch (error) {
    console.error('Error fetching health records:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch records' });
  }
};

module.exports = {
  getSymptomList,
  checkSymptoms,
  saveHealthRecord,
  getHealthRecords
};