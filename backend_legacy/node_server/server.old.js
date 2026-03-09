const express = require('express');
const fetch = require('node-fetch');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { GridFSBucket } = require('mongodb');
const stream = require('stream');
require('dotenv').config();

// ============================================
// ENVIRONMENT VARIABLES VALIDATION
// ============================================
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`❌ Missing required environment variable: ${varName}`);
    process.exit(1);
  }
});

const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT || 3000;
const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

// ============================================
// EXPRESS SETUP
// ============================================
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ============================================
// MONGODB CONNECTION WITH RETRY
// ============================================
let db;
let filesBucket;

const connectDB = async (retries = 5) => {
  try {
    const connection = await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    db = connection.connection.db;
    filesBucket = new GridFSBucket(db, { bucketName: 'documents' });
    
    console.log("✅ Connected to MongoDB Atlas");
    console.log("✅ GridFS bucket initialized for file storage");
  } catch (err) {
    if (retries > 0) {
      console.log(`⏳ Retrying MongoDB connection... (${retries} attempts left)`);
      setTimeout(() => connectDB(retries - 1), 3000);
    } else {
      console.error("❌ Failed to connect to MongoDB after retries:", err.message);
      process.exit(1);
    }
  }
};

connectDB();

// ============================================
// SCHEMAS & MODELS
// ============================================

// User Schema
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

// Medicine Inventory Schema
const medicineInventorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  genericName: { type: String },
  category: { type: String, required: true },
  description: { type: String },
  commonDosage: [String],
  sideEffects: [String],
  imageUrl: { type: String },
  requiresPrescription: { type: Boolean, default: false }
}, { timestamps: true });

const MedicineInventory = mongoose.model('MedicineInventory', medicineInventorySchema);

// User Medication Schema
const userMedicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'MedicineInventory', required: true },
  medicineName: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
  times: [{
    hour: { type: Number, required: true, min: 0, max: 23 },
    minute: { type: Number, required: true, min: 0, max: 59 }
  }],
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  instructions: { type: String },
  reminderEnabled: { type: Boolean, default: true },
  stock: { type: Number, default: 0 },
  refillReminder: { type: Boolean, default: true },
  refillThreshold: { type: Number, default: 7 },
  notes: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const UserMedication = mongoose.model('UserMedication', userMedicationSchema);

// Medication History Schema
const medicationHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  medicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserMedication', required: true },
  scheduledTime: { type: Date, required: true },
  takenTime: { type: Date },
  status: {
    type: String,
    enum: ['pending', 'taken', 'skipped', 'missed'],
    default: 'pending'
  },
  notes: { type: String }
}, { timestamps: true });

const MedicationHistory = mongoose.model('MedicationHistory', medicationHistorySchema);

// Document Metadata Schema (stores reference to GridFS file)
const documentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileName: { type: String, required: true },
  fileId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Reference to GridFS file
  fileType: { type: String },
  fileSize: { type: Number },
  category: { type: String, enum: ['Prescription', 'Report', 'Bill', 'Other'] },
  description: { type: String },
  uploadedAt: { type: Date, default: Date.now },
});

const Document = mongoose.model('Document', documentSchema);

// Inventory Schema
const inventorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  quantity: { type: Number, required: true, default: 0 },
  expiry: { type: Date },
  category: { type: String },
  lowStockThreshold: { type: Number, default: 20 },
  reorderLevel: { type: Number, default: 50 },
  location: { type: String },
  batchNumber: { type: String },
  supplier: { type: String },
  costPerUnit: { type: Number },
  notes: { type: String }
}, { timestamps: true });

const Inventory = mongoose.model('Inventory', inventorySchema);

// Health Record Schema
const healthRecordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  predicted_disease: String,
  confidence_score: Number,
  symptoms: [String],
  timestamp: { type: Date, default: Date.now }
});

const HealthRecord = mongoose.model('HealthRecord', healthRecordSchema);

// ============================================
// MULTER SETUP (For Memory Storage)
// ============================================
const storage = multer.memoryStorage(); // Store in memory temporarily

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and images allowed.'));
    }
  }
});

// ============================================
// MIDDLEWARE
// ============================================

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'No authentication token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
};

// Input Validation Helpers
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

// ============================================
// AUTHENTICATION ROUTES
// ============================================

// Signup Route
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, username, password, confirmPassword } = req.body;

    if (!name || !email || !username || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() }
      ]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: existingUser.email === email.toLowerCase()
          ? 'Email already registered'
          : 'Username already taken'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      password: hashedPassword
    });

    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, username: newUser.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`✅ User registered: ${newUser.username}`);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        username: newUser.username
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

// Login Route
app.post('/api/login', async (req, res) => {
  try {
    const { email: identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Email/Username and password required' });
    }

    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier.toLowerCase() }
      ]
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`✅ User logged in: ${user.username}`);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// ============================================
// MEDICINES ROUTES
// ============================================

app.get('/api/medicines', async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { genericName: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = category;
    }

    const medicines = await MedicineInventory.find(query).sort({ name: 1 });
    res.json({ success: true, medicines });
  } catch (error) {
    console.error('Error fetching medicines:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch medicines' });
  }
});

app.get('/api/medicines/categories', async (req, res) => {
  try {
    const categories = await MedicineInventory.distinct('category');
    res.json({ success: true, categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
});

app.post('/api/medicines', async (req, res) => {
  try {
    const { name, genericName, category } = req.body;

    if (!name || !category) {
      return res.status(400).json({ success: false, message: 'Name and category required' });
    }

    const medicine = new MedicineInventory(req.body);
    await medicine.save();
    res.status(201).json({ success: true, medicine });
  } catch (error) {
    console.error('Error adding medicine:', error);
    res.status(500).json({ success: false, message: 'Failed to add medicine' });
  }
});

// ============================================
// DOCUMENT UPLOAD ROUTES (GridFS) - Protected
// ============================================

// Upload document to MongoDB GridFS
app.post('/api/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    if (!filesBucket) {
      return res.status(500).json({ success: false, message: 'File storage not ready' });
    }

    const { category, description } = req.body;

    // Create readable stream from buffer
    const readableStream = new stream.Readable();
    readableStream.push(req.file.buffer);
    readableStream.push(null);

    // Create filename with timestamp for uniqueness
    const uniqueFileName = `${Date.now()}_${req.file.originalname}`;

    // Upload to GridFS
    const uploadStream = filesBucket.openUploadStream(uniqueFileName, {
      metadata: {
        userId: req.user.id,
        originalName: req.file.originalname,
        uploadedAt: new Date(),
        category: category || 'Other'
      }
    });

    readableStream.pipe(uploadStream);

    uploadStream.on('error', (error) => {
      console.error('GridFS upload error:', error);
      res.status(500).json({ success: false, message: 'File upload failed' });
    });

    uploadStream.on('finish', async () => {
      try {
        // Save document metadata to MongoDB
        const document = new Document({
          userId: req.user.id,
          fileName: req.file.originalname,
          fileId: uploadStream.id,
          fileType: req.file.mimetype,
          fileSize: req.file.size,
          category: category || 'Other',
          description: description || ''
        });

        await document.save();

        console.log(`✅ File uploaded to MongoDB: ${req.file.originalname}`);

        res.status(201).json({
          success: true,
          message: 'File uploaded successfully to MongoDB',
          document: {
            id: document._id,
            fileName: document.fileName,
            fileSize: document.fileSize,
            category: document.category,
            uploadedAt: document.uploadedAt
          }
        });
      } catch (error) {
        console.error('Error saving document metadata:', error);
        res.status(500).json({ success: false, message: 'Failed to save file metadata' });
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: 'File upload failed' });
  }
});

// Get all documents for user
app.get('/api/documents', authenticateToken, async (req, res) => {
  try {
    const documents = await Document.find({ userId: req.user.id }).sort({ uploadedAt: -1 });

    const documentsWithInfo = documents.map(doc => ({
      id: doc._id,
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      category: doc.category,
      description: doc.description,
      uploadedAt: doc.uploadedAt
    }));

    res.json({ success: true, documents: documentsWithInfo });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch documents' });
  }
});

// Download document from GridFS
app.get('/api/documents/:id/download', authenticateToken, async (req, res) => {
  try {
    const document = await Document.findOne({ _id: req.params.id, userId: req.user.id });

    if (!document) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    if (!filesBucket) {
      return res.status(500).json({ success: false, message: 'File storage not available' });
    }

    // Download from GridFS
    const downloadStream = filesBucket.openDownloadStream(document.fileId);

    downloadStream.on('error', (error) => {
      console.error('GridFS download error:', error);
      res.status(404).json({ success: false, message: 'File not found in storage' });
    });

    res.setHeader('Content-Type', document.fileType);
    res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);

    console.log(`📥 File downloaded: ${document.fileName}`);

    downloadStream.pipe(res);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ success: false, message: 'Failed to download file' });
  }
});

// Delete document from MongoDB and GridFS
app.delete('/api/documents/:id', authenticateToken, async (req, res) => {
  try {
    const document = await Document.findOne({ _id: req.params.id, userId: req.user.id });

    if (!document) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    if (!filesBucket) {
      return res.status(500).json({ success: false, message: 'File storage not available' });
    }

    // Delete from GridFS
    await filesBucket.delete(document.fileId);

    // Delete metadata from MongoDB
    await Document.findByIdAndDelete(req.params.id);

    console.log(`🗑️ Document deleted: ${document.fileName}`);

    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete document' });
  }
});

// ============================================
// MEDICATION ROUTES (Protected)
// ============================================

app.get('/api/medications/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.id !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { active } = req.query;
    let query = { userId };
    if (active !== undefined) {
      query.isActive = active === 'true';
    }

    const medications = await UserMedication.find(query)
      .populate('medicineId')
      .sort({ createdAt: -1 });

    res.json({ success: true, medications });
  } catch (error) {
    console.error('Error fetching medications:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch medications' });
  }
});

app.post('/api/medications', authenticateToken, async (req, res) => {
  try {
    const { userId, medicineId, dosage, frequency, times, startDate } = req.body;

    if (!userId || !medicineId || !dosage || !frequency || !times || !startDate) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (req.user.id !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const medication = new UserMedication(req.body);
    await medication.save();
    await medication.populate('medicineId');

    res.status(201).json({ success: true, medication });
  } catch (error) {
    console.error('Error adding medication:', error);
    res.status(500).json({ success: false, message: 'Failed to add medication' });
  }
});

app.put('/api/medications/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const medication = await UserMedication.findById(id);

    if (!medication) {
      return res.status(404).json({ success: false, message: 'Medication not found' });
    }

    if (medication.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const updated = await UserMedication.findByIdAndUpdate(id, req.body, { new: true }).populate('medicineId');
    res.json({ success: true, medication: updated });
  } catch (error) {
    console.error('Error updating medication:', error);
    res.status(500).json({ success: false, message: 'Failed to update medication' });
  }
});

app.delete('/api/medications/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const medication = await UserMedication.findById(id);

    if (!medication) {
      return res.status(404).json({ success: false, message: 'Medication not found' });
    }

    if (medication.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await UserMedication.findByIdAndUpdate(id, { isActive: false });
    res.json({ success: true, message: 'Medication deactivated' });
  } catch (error) {
    console.error('Error deleting medication:', error);
    res.status(500).json({ success: false, message: 'Failed to delete medication' });
  }
});

app.post('/api/medications/intake', authenticateToken, async (req, res) => {
  try {
    const { medicationId, status, notes } = req.body;

    if (!medicationId || !status) {
      return res.status(400).json({ success: false, message: 'Medication ID and status required' });
    }

    const medication = await UserMedication.findById(medicationId);
    if (!medication) {
      return res.status(404).json({ success: false, message: 'Medication not found' });
    }

    if (medication.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const history = new MedicationHistory({
      userId: req.user.id,
      medicationId,
      scheduledTime: new Date(),
      takenTime: status === 'taken' ? new Date() : null,
      status,
      notes
    });

    await history.save();

    if (status === 'taken' && medication.stock > 0) {
      const updated = await UserMedication.findByIdAndUpdate(
        medicationId,
        { $inc: { stock: -1 } },
        { new: true }
      );

      res.status(201).json({
        success: true,
        history,
        remainingStock: updated.stock
      });
    } else {
      res.status(201).json({ success: true, history });
    }
  } catch (error) {
    console.error('Error recording intake:', error);
    res.status(500).json({ success: false, message: 'Failed to record intake' });
  }
});

app.get('/api/medications/history/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.id !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { startDate, endDate } = req.query;
    let query = { userId };

    if (startDate || endDate) {
      query.scheduledTime = {};
      if (startDate) query.scheduledTime.$gte = new Date(startDate);
      if (endDate) query.scheduledTime.$lte = new Date(endDate);
    }

    const history = await MedicationHistory.find(query)
      .populate({
        path: 'medicationId',
        populate: { path: 'medicineId' }
      })
      .sort({ scheduledTime: -1 });

    res.json({ success: true, history });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch history' });
  }
});

app.get('/api/medications/today/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.id !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    const medications = await UserMedication.find({
      userId,
      isActive: true,
      reminderEnabled: true
    }).populate('medicineId');

    const history = await MedicationHistory.find({
      userId,
      scheduledTime: { $gte: startOfDay, $lte: endOfDay }
    });

    const schedule = [];
    medications.forEach(med => {
      med.times.forEach(time => {
        const scheduledTime = new Date(today);
        scheduledTime.setHours(time.hour, time.minute, 0, 0);

        const historyEntry = history.find(h =>
          h.medicationId.toString() === med._id.toString() &&
          Math.abs(h.scheduledTime - scheduledTime) < 60000
        );

        schedule.push({
          medication: med,
          scheduledTime,
          status: historyEntry ? historyEntry.status : 'pending',
          historyId: historyEntry?._id
        });
      });
    });

    schedule.sort((a, b) => a.scheduledTime - b.scheduledTime);

    res.json({ success: true, schedule });
  } catch (error) {
    console.error('Error fetching today schedule:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch schedule' });
  }
});

// ============================================
// INVENTORY ROUTES
// ============================================

app.get('/api/inventory', async (req, res) => {
  try {
    const { search, lowStock, expired } = req.query;
    let query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    if (lowStock === 'true') {
      query.$expr = { $lte: ['$quantity', '$lowStockThreshold'] };
    }

    let inventory = await Inventory.find(query).sort({ name: 1 });

    if (expired === 'true') {
      const now = new Date();
      inventory = inventory.filter(item => item.expiry && new Date(item.expiry) < now);
    }

    const inventoryWithStatus = inventory.map(item => {
      const itemObj = item.toObject();
      itemObj.isLowStock = item.quantity <= item.lowStockThreshold;
      itemObj.isExpired = item.expiry && new Date(item.expiry) < new Date();
      itemObj.isExpiringSoon = item.expiry &&
        new Date(item.expiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      return itemObj;
    });

    res.json({ success: true, inventory: inventoryWithStatus, total: inventory.length });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch inventory' });
  }
});

app.get('/api/inventory/:id', async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    res.json({ success: true, item });
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch item' });
  }
});

app.post('/api/inventory', async (req, res) => {
  try {
    const { name, quantity, category } = req.body;

    if (!name || quantity === undefined || !category) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const item = new Inventory(req.body);
    await item.save();

    console.log(`✅ Inventory item added: ${name}`);

    res.status(201).json({ success: true, item });
  } catch (error) {
    console.error('Error adding inventory item:', error);
    res.status(500).json({ success: false, message: 'Failed to add item' });
  }
});

app.put('/api/inventory/:id', async (req, res) => {
  try {
    const item = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    res.json({ success: true, item });
  } catch (error) {
    console.error('Error updating inventory:', error);
    res.status(500).json({ success: false, message: 'Failed to update item' });
  }
});

app.patch('/api/inventory/:id/stock', async (req, res) => {
  try {
    const { quantity, reason } = req.body;

    if (quantity === undefined) {
      return res.status(400).json({ success: false, message: 'Quantity required' });
    }

    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const newQuantity = item.quantity + quantity;
    if (newQuantity < 0) {
      return res.status(400).json({ success: false, message: 'Insufficient stock' });
    }

    const updated = await Inventory.findByIdAndUpdate(
      req.params.id,
      { $inc: { quantity } },
      { new: true }
    );

    console.log(`📦 Stock updated: ${item.name} → ${updated.quantity} (${reason || 'manual'})`);

    res.json({
      success: true,
      item: updated,
      message: `Stock updated to ${updated.quantity}`,
      isLowStock: updated.quantity <= updated.lowStockThreshold
    });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ success: false, message: 'Failed to update stock' });
  }
});

app.delete('/api/inventory/:id', async (req, res) => {
  try {
    const item = await Inventory.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    console.log(`🗑️ Inventory item deleted: ${item.name}`);

    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ success: false, message: 'Failed to delete item' });
  }
});

app.get('/api/inventory/stats/summary', async (req, res) => {
  try {
    const total = await Inventory.countDocuments();

    const lowStock = await Inventory.countDocuments({
      $expr: { $lte: ['$quantity', '$lowStockThreshold'] }
    });

    const now = new Date();
    const expired = await Inventory.countDocuments({
      expiry: { $lt: now }
    });

    const expiringSoon = await Inventory.countDocuments({
      expiry: {
        $gte: now,
        $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    const totalValue = await Inventory.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: { $multiply: ['$quantity', { $ifNull: ['$costPerUnit', 0] }] } }
        }
      }
    ]);

    res.json({
      success: true,
      stats: {
        totalItems: total,
        lowStockItems: lowStock,
        expiredItems: expired,
        expiringSoonItems: expiringSoon,
        totalInventoryValue: totalValue[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
  }
});

app.post('/api/inventory/import', async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Items array required' });
    }

    const result = await Inventory.insertMany(items, { ordered: false }).catch(err => {
      if (err.code === 11000) {
        return { insertedCount: err.result.nInserted };
      }
      throw err;
    });

    console.log(`📥 Imported ${result.length || result.insertedCount} inventory items`);

    res.json({
      success: true,
      message: `Imported ${result.length || result.insertedCount} items`,
      count: result.length || result.insertedCount
    });
  } catch (error) {
    console.error('Error importing inventory:', error);
    res.status(500).json({ success: false, message: 'Failed to import items' });
  }
});

app.get('/api/inventory/export', async (req, res) => {
  try {
    const inventory = await Inventory.find().sort({ name: 1 });

    const csv = [
      'name,quantity,expiry,category,location,batchNumber,supplier,costPerUnit',
      ...inventory.map(item =>
        `"${item.name}",${item.quantity},"${item.expiry || ''}","${item.category || ''}","${item.location || ''}","${item.batchNumber || ''}","${item.supplier || ''}",${item.costPerUnit || ''}`
      )
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=inventory_export.csv');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting inventory:', error);
    res.status(500).json({ success: false, message: 'Failed to export inventory' });
  }
});

// ============================================
// SYMPTOMS & HEALTH CHECK ROUTES
// ============================================

app.get('/api/symptoms', (req, res) => {
  try {
    const possiblePaths = [
      path.join(__dirname, '..', 'python_server', 'models', 'symptom_index.json'),
      path.join(__dirname, 'models', 'symptom_index.json'),
      path.join(__dirname, '..', '..', 'python_server', 'models', 'symptom_index.json')
    ];

    let symptomsPath = null;
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        symptomsPath = testPath;
        break;
      }
    }

    if (!symptomsPath) {
      return res.status(404).json({
        error: 'Symptom index file not found',
        searched: possiblePaths
      });
    }

    const symptomsData = fs.readFileSync(symptomsPath, 'utf8');
    const symptomsJson = JSON.parse(symptomsData);
    const symptomsList = Object.keys(symptomsJson);

    console.log(`✅ Loaded ${symptomsList.length} symptoms`);
    res.json(symptomsList);
  } catch (error) {
    console.error('Error reading symptoms file:', error);
    res.status(500).json({
      error: 'Could not load symptom list',
      details: error.message
    });
  }
});

app.post('/api/symptom-check', async (req, res) => {
  try {
    const { symptoms, user_id } = req.body;

    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({ error: 'Valid symptoms array required' });
    }

    console.log(`🔍 Symptom check: ${symptoms.length} symptoms`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${PYTHON_API_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptoms, user_id: user_id || 'anonymous' }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI error (${response.status}): ${errorText}`);
      throw new Error(`AI server error: ${response.status}`);
    }

    const predictionData = await response.json();
    console.log(`✅ Prediction: ${predictionData.predicted_disease}`);

    res.json(predictionData);
  } catch (error) {
    console.error('Error calling Python AI:', error.message);

    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'AI service request timed out' });
    }

    res.status(500).json({
      error: 'Failed to get prediction',
      details: error.message
    });
  }
});

app.post('/api/health-records', authenticateToken, async (req, res) => {
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
});

app.get('/api/health-records', authenticateToken, async (req, res) => {
  try {
    const records = await HealthRecord.find({ userId: req.user.id }).sort({ timestamp: -1 });

    console.log(`📋 Retrieved ${records.length} health records for user: ${req.user.username}`);

    res.json({ success: true, records });
  } catch (error) {
    console.error('Error fetching health records:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch records' });
  }
});

// ============================================
// DEFAULT & ERROR HANDLERS
// ============================================

app.get('/', (req, res) => {
  res.json({
    message: 'MediApp Backend API',
    status: 'running',
    version: '1.0.0',
    fileStorage: 'MongoDB GridFS',
    endpoints: {
      auth: ['POST /api/signup', 'POST /api/login'],
      documents: ['POST /api/upload', 'GET /api/documents', 'GET /api/documents/:id/download', 'DELETE /api/documents/:id'],
      medications: ['GET /api/medications/:userId', 'POST /api/medications', 'PUT /api/medications/:id'],
      inventory: ['GET /api/inventory', 'POST /api/inventory', 'PATCH /api/inventory/:id/stock'],
      health: ['POST /api/health-records', 'GET /api/health-records']
    }
  });
});

app.use((req, res) => {
  console.log(`⚠️ 404 - Not found: ${req.method} ${req.url}`);
  res.status(404).json({
    error: 'Route not found',
    method: req.method,
    path: req.url
  });
});

app.use((error, req, res, next) => {
  console.error('💥 Unhandled error:', error);
  res.status(error.status || 500).json({
    error: 'Internal server error',
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, '0.0.0.0', () => {
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  const ipAddress = Object.values(networkInterfaces)
    .flat()
    .find(i => i.family === 'IPv4' && !i.internal)?.address || 'localhost';

  console.log('\n' + '='.repeat(70));
  console.log('🚀 MediApp Node.js Backend Started Successfully!');
  console.log('='.repeat(70));
  console.log(`📍 Local:   http://localhost:${PORT}`);
  console.log(`📍 Network: http://${ipAddress}:${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('='.repeat(70));
  console.log('✅ Database: Connected to MongoDB Atlas');
  console.log('✅ File Storage: MongoDB GridFS (Files in DB)');
  console.log('✅ JWT: Authentication enabled');
  console.log('✅ Inventory: Ready');
  console.log('✅ Health Records: Ready');
  console.log('✅ Medication Tracking: Ready');
  console.log('='.repeat(70) + '\n');
});