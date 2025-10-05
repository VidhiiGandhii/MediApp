const express = require('express');
const fetch = require('node-fetch');
const app = express();
const port = 3000;
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
// Middleware
app.use(cors());
app.use(express.json());

// --- MongoDB Connection ---
const uri = "mongodb+srv://vidhigandhii:vidhi0042@cluster0.kxtzs.mongodb.net/mediapp?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// --- User Schema & Model ---
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true, 
    index: true // Improves query performance for username
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true,
    index: true // Improves query performance for email
  },
  password: { type: String, required: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_dev_only";

//const JWT_SECRET = "supersecretkey"; // put in .env for production

// --- Default Route ---
app.get('/', (req, res) => {
  res.send('Hello from the MediApp Backend!');
});

// --- Signup Route ---
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email,username, password } = req.body;
    console.log("Signup request received:", req.body);

    if (!name || !email || !username || !password) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    // Check if user already exists
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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ name, email,username, password: hashedPassword });
 await newUser.save();
  const token = jwt.sign({ id: newUser._id, email: newUser.email, username: newUser.username }, JWT_SECRET, { expiresIn: "1h" });
  res.status(201).json({
      success: true,
      message: "Signup successful!",
      token,
      user: { name: newUser.name, email: newUser.email, username: newUser.username }
    });

  } catch (error) {
    console.error("❌ Signup route error:", error);
    res.status(500).json({ success: false, message: "Server error during signup." });
  }
});
//     try {
//       await newUser.save();
//       console.log("✅ User saved successfully:", newUser);
//       res.json({ success: true, message: "Signup successful!" });
//     } catch (dbErr) {
//       console.error("❌ MongoDB save error:", dbErr);
//       res.status(500).json({ success: false, message: "Database save error." });
//     }

//   } catch (error) {
//     console.error("❌ Signup route error:", error);
//     res.status(500).json({ success: false, message: "Server error during signup." });
//   }
// });

// --- Login Route ---
app.post('/api/login', async (req, res) => {
  try {
    // The 'email' field from the frontend can be either an email or a username
    const { email: identifier, password } = req.body; 
    
    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: "Email/Username and password are required." });
    }

    const loginIdentifier = identifier.toLowerCase().trim();

    // CHANGE: Find user by either email or username
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

    const token = jwt.sign({ id: user._id, email: user.email, username: user.username }, JWT_SECRET, { expiresIn: "1h" });

    res.json({
      success: true,
      message: "Login successful!",
      token,
      user: { name: user.name, email: user.email, username: user.username }
    });
  } catch (error) {
    console.error("❌ Login route error:", error);
    res.status(500).json({ success: false, message: "Server error during login." });
  }
});

// --- Symptom Checker Route ---
app.post('/api/symptom-check', async (req, res) => {
  const { symptoms } = req.body;

  if (!symptoms || !Array.isArray(symptoms)) {
    return res.status(400).json({ error: 'Invalid symptoms format. Expected an array.' });
  }

  try {
    const pythonApiUrl = 'http://192.168.1.13:8000/predict';

    const response = await fetch(pythonApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptoms }),
    });

    if (!response.ok) {
      throw new Error(`AI server responded with status: ${response.status}`);
    }

    const predictionData = await response.json();
    res.json(predictionData);

  } catch (error) {
    console.error('❌ Error calling Python AI server:', error);
    res.status(500).json({ error: 'Could not get a prediction from the AI service.' });
  }
});

// --- Get Symptoms List ---
app.get('/api/symptoms', (req, res) => {
  try {
    const symptomsPath = path.join(__dirname, '..', 'python_ai_server', 'models', 'symptom_index.json');
    const symptomsData = fs.readFileSync(symptomsPath, 'utf8');
    const symptomsJson = JSON.parse(symptomsData);

    res.json(Object.keys(symptomsJson));
  } catch (error) {
    console.error('❌ Error reading symptoms file:', error);
    res.status(500).json({ error: 'Could not load symptom list.' });
  }
});

// --- Start Server ---
app.listen(port, () => {
  console.log(`🚀 MediApp Node.js server listening on http://localhost:${port}`);
});