const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/authMiddleware');
const { getBucket } = require('../config/db');
const ChatMessage = require('../models/ChatMessage');
const Document = require('../models/Document');
const axios = require('axios');
const FormData = require('form-data');

// Use environment variables for API URLs
const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf|jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, JPEG, JPG, and PNG files are allowed'));
    }
  }
});

// Apply authentication middleware to all document routes
router.use(authenticateToken);

/**
 * @route   POST /api/documents/upload
 * @desc    Upload and process a document with OCR, then save as a chat message
 * @access  Private
 */
router.post('/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Process the document with OCR
    const ocrResult = await processDocumentWithOCR(req.file);

    if (!ocrResult.success) {
      // Clean up the uploaded file if OCR processing failed
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Failed to process document with OCR',
        error: ocrResult.error
      });
    }

    // Create a new chat message with the OCR result
    const chatMessage = new ChatMessage({
      userId: req.user.id,
      summary: ocrResult.summary || 'Document processed',
      fullText: ocrResult.text || '',
      documentUrl: `/api/documents/${req.file.filename}`,
      audioFileId: ocrResult.audioFileId || null
    });

    await chatMessage.save();

    // Clean up the uploaded file after successful processing
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: 'Document processed successfully',
      chat: chatMessage
    });
  } catch (error) {
    console.error('Error processing document:', error);
    // Clean up the uploaded file in case of error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: 'Failed to process document',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Process a document with OCR and optionally generate TTS
 * @param {Object} file - Multer file object
 * @returns {Promise<Object>} - Result with success, text, and summary
 */
async function processDocumentWithOCR(file) {
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(file.path), {
      filename: file.originalname,
      contentType: file.mimetype
    });

    // Call the OCR service
    const response = await axios.post(`${PYTHON_API_URL}/ocr`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Content-Type': 'multipart/form-data'
      }
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to process document with OCR');
    }

    // If we need to generate TTS, we can do it here
    let audioFileId = null;
    if (response.data.text) {
      try {
        const ttsResponse = await axios.post(`${PYTHON_API_URL}/tts/generate`, {
          text: response.data.summary || response.data.text,
          lang: 'en' // or get from user preferences
        });

        if (ttsResponse.data.audioFileId) {
          audioFileId = ttsResponse.data.audioFileId;
        }
      } catch (ttsError) {
        console.error('TTS generation failed, continuing without audio:', ttsError);
      }
    }

    return {
      success: true,
      text: response.data.text,
      summary: response.data.summary,
      audioFileId
    };
  } catch (error) {
    console.error('OCR processing error:', error);
    return {
      success: false,
      error: error.message || 'Failed to process document with OCR'
    };
  }
}

/**
 * @route   GET /api/documents
 * @desc    Get all documents for the logged-in user
 * @access  Private
 */
router.get('/documents', async (req, res) => {
  try {
    const documents = await ChatMessage.find({
      userId: req.user.id,
      documentUrl: { $exists: true }
    }).sort({ createdAt: -1 });

    res.json({ success: true, documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch documents',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/documents/:filename
 * @desc    Download a specific document
 * @access  Private
 */
router.get('/:filename', authenticateToken, async (req, res) => {
  try {
    const filePath = path.join('uploads', req.params.filename);

    // Verify the document belongs to the user
    const document = await ChatMessage.findOne({
      userId: req.user.id,
      documentUrl: `/api/documents/${req.params.filename}`
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found or access denied'
      });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    res.download(filePath);
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download document',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   DELETE /api/documents/:id
 * @desc    Delete a document and all its associated data
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const filesBucket = getBucket();

    // 1. Find the document and verify ownership
    const document = await Document.findOne({ _id: id, userId });
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found or access denied'
      });
    }

    // 2. Find and delete associated chat messages and their audio files
    const chatMessages = await ChatMessage.find({ documentId: document._id });

    // Delete all audio files associated with these chat messages
    await Promise.all(chatMessages.map(async (chat) => {
      if (chat.audioFileId) {
        try {
          await filesBucket.delete(chat.audioFileId);
          console.log(`Deleted audio file: ${chat.audioFileId}`);
        } catch (err) {
          console.error(`Error deleting audio file ${chat.audioFileId}:`, err);
          // Continue even if audio deletion fails
        }
      }
    }));

    // 3. Delete the chat messages
    await ChatMessage.deleteMany({ documentId: document._id });

    // 4. Delete the document file from GridFS
    if (document.fileId) {
      try {
        await filesBucket.delete(document.fileId);
        console.log(`Deleted document file: ${document.fileId}`);
      } catch (err) {
        console.error(`Error deleting document file ${document.fileId}:`, err);
        // Continue even if file deletion fails
      }
    }

    // 5. Delete the document record
    await Document.findByIdAndDelete(document._id);

    res.json({
      success: true,
      message: 'Document and all associated data deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting document:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;