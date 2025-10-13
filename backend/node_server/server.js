const express = require('express');
const fetch = require('node-fetch');
const app = express();
const port = process.env.PORT || 3000;
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

app.use(cors());
app.use(express.json());

// MongoDB Connection
const uri = process.env.MONGO_URI || "mongodb+srv://vidhigandhii:vidhi0042@cluster0.kxtzs.mongodb.net/mediapp?retryWrites=true&w=majority";
mongoose.connect(uri)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// User Schema & Model
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  password: { type: String, required: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Health Record Schema & Model
const healthRecordSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  predicted_disease: String,
  confidence_score: Number,
  symptoms: [String],
  timestamp: Date,
});
const HealthRecord = mongoose.model('HealthRecord', healthRecordSchema);

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Default Route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Hello from the MediApp Backend!',
    status: 'running',
    endpoints: {
      signup: 'POST /api/signup',
      login: 'POST /api/login',
      symptoms: 'GET /api/symptoms',
      symptomCheck: 'POST /api/symptom-check',
      healthRecords: 'POST /api/health-records'
    }
  });
});

// Signup Route
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, username, password } = req.body;
    console.log("📝 Signup request received:", { name, email, username });

    if (!name || !email || !username || !password) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }]
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return res.status(409).json({ success: false, message: "User with this email already exists." });
      } else {
        return res.status(409).json({ success: false, message: "This username is already taken." });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, username, password: hashedPassword });
    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, username: newUser.username }, 
      process.env.JWT_SECRET || 'your-secret-key-change-this', 
      { expiresIn: "7d" }
    );

    console.log("✅ Signup successful for:", username);
    
    res.status(201).json({
      success: true,
      message: "Signup successful!",
      token,
      user: { 
        id: newUser._id,
        name: newUser.name, 
        email: newUser.email, 
        username: newUser.username 
      }
    });
  } catch (error) {
    console.error("❌ Signup route error:", error);
    res.status(500).json({ success: false, message: "Server error during signup." });
  }
});

// Login Route
app.post('/api/login', async (req, res) => {
  try {
    const { email: identifier, password } = req.body;
    console.log("🔐 Login attempt for:", identifier);

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: "Email/Username and password are required." });
    }

    const loginIdentifier = identifier.toLowerCase().trim();
    const user = await User.findOne({
      $or: [{ email: loginIdentifier }, { username: loginIdentifier }]
    });

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, username: user.username }, 
      process.env.JWT_SECRET || 'your-secret-key-change-this', 
      { expiresIn: "7d" }
    );

    console.log("✅ Login successful for:", user.username);

    res.json({
      success: true,
      message: "Login successful!",
      token,
      user: { 
        id: user._id,
        name: user.name, 
        email: user.email, 
        username: user.username 
      }
    });
  } catch (error) {
    console.error("❌ Login route error:", error);
    res.status(500).json({ success: false, message: "Server error during login." });
  }
});

// Get Symptoms List
app.get('/api/symptoms', (req, res) => {
  try {
    // Try multiple possible paths
    const possiblePaths = [
      path.join(__dirname, '..', 'python_server', 'models', 'symptom_index.json'),
      path.join(__dirname, 'models', 'symptom_index.json'),
      path.join(__dirname, '..', '..', 'python_server', 'models', 'symptom_index.json')
    ];

    let symptomsPath = null;
    
    // Find the first path that exists
    for (const testPath of possiblePaths) {
      console.log(`📂 Checking path: ${testPath}`);
      if (fs.existsSync(testPath)) {
        symptomsPath = testPath;
        console.log(`✅ Found symptoms file at: ${symptomsPath}`);
        break;
      }
    }

    if (!symptomsPath) {
      console.error(`❌ Symptom file not found in any of these locations:`);
      possiblePaths.forEach(p => console.error(`   - ${p}`));
      return res.status(404).json({ 
        error: 'Symptom index file not found',
        searched: possiblePaths,
        help: 'Please ensure symptom_index.json exists in backend/python_server/models/'
      });
    }

    const symptomsData = fs.readFileSync(symptomsPath, 'utf8');
    const symptomsJson = JSON.parse(symptomsData);
    const symptomsList = Object.keys(symptomsJson);
    
    console.log(`✅ Successfully loaded ${symptomsList.length} symptoms`);
    res.json(symptomsList);
    
  } catch (error) {
    console.error('❌ Error reading symptoms file:', error);
    res.status(500).json({ 
      error: 'Could not load symptom list',
      details: error.message
    });
  }
});

// Symptom Checker Route
app.post('/api/symptom-check', async (req, res) => {
  const { symptoms, user_id } = req.body;
  const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

  console.log(`🔍 Symptom check request - Symptoms: ${symptoms?.length || 0}, User: ${user_id || 'anonymous'}`);

  if (!symptoms || !Array.isArray(symptoms)) {
    return res.status(400).json({ error: 'Invalid symptoms format. Expected an array.' });
  }

  if (symptoms.length === 0) {
    return res.status(400).json({ error: 'No symptoms provided.' });
  }

  try {
    console.log(`📤 Forwarding to Python AI at ${PYTHON_API_URL}/predict`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(`${PYTHON_API_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        symptoms,
        user_id: user_id || 'anonymous'
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Python AI error (${response.status}): ${errorText}`);
      throw new Error(`AI server responded with status: ${response.status}`);
    }

    const predictionData = await response.json();
    console.log(`✅ Prediction: ${predictionData.predicted_disease} (${(predictionData.confidence_score * 100).toFixed(1)}%)`);
    
    res.json(predictionData);
  } catch (error) {
    console.error('❌ Error calling Python AI server:', error.message);
    
    if (error.name === 'AbortError') {
      return res.status(504).json({ 
        error: 'Request to AI service timed out. Please try again.' 
      });
    }
    
    res.status(500).json({ 
      error: 'Could not get a prediction from the AI service.',
      details: error.message,
      help: 'Please ensure the Python server is running on port 8000'
    });
  }
});

// Health Record Route (Protected)
app.post('/api/health-records', authenticateToken, async (req, res) => {
  try {
    const { predicted_disease, confidence_score, symptoms, timestamp } = req.body;
    
    console.log(`💾 Saving health record for user: ${req.user.username}`);
    
    const record = new HealthRecord({
      userId: req.user.id,
      predicted_disease,
      confidence_score,
      symptoms,
      timestamp: timestamp || new Date(),
    });
    
    await record.save();
    console.log(`✅ Health record saved successfully`);
    
    res.status(201).json({ success: true, record });
  } catch (error) {
    console.error("❌ Error saving health record:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get Health Records (Protected)
app.get('/api/health-records', authenticateToken, async (req, res) => {
  try {
    const records = await HealthRecord.find({ userId: req.user.id }).sort({ timestamp: -1 });
    console.log(`📋 Retrieved ${records.length} health records for user: ${req.user.username}`);
    res.json({ success: true, records });
  } catch (error) {
    console.error("❌ Error fetching health records:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 404 Handler
app.use((req, res) => {
  console.log(`⚠️  404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ 
    error: 'Route not found',
    method: req.method,
    path: req.url,
    availableEndpoints: [
      'GET /',
      'POST /api/signup',
      'POST /api/login',
      'GET /api/symptoms',
      'POST /api/symptom-check',
      'POST /api/health-records',
      'GET /api/health-records'
    ]
  });
});

// Error Handler
app.use((error, req, res, next) => {
  console.error("💥 Unhandled error:", error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
});

// Start Server
app.listen(port, '0.0.0.0', () => {
  const networkInterfaces = require('os').networkInterfaces();
  const ipAddress = Object.values(networkInterfaces)
    .flat()
    .find(i => i.family === 'IPv4' && !i.internal)?.address || 'localhost';
  
  console.log('\n' + '='.repeat(60));
  console.log('🚀 MediApp Node.js Server Started Successfully!');
  console.log('='.repeat(60));
  console.log(`📍 Local:   http://localhost:${port}`);
  console.log(`📍 Network: http://${ipAddress}:${port}`);
  console.log('='.repeat(60));
  console.log('📱 Use the Network URL in your Expo app');
  console.log('🔗 API Documentation: http://localhost:' + port);
  console.log('='.repeat(60) + '\n');
});