const express = require('express');
const {
  uploadDocument,
  getUserDocuments,
  downloadDocument,
  deleteDocument
} = require('../controllers/documentController');
const { authenticateToken } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware'); // Multer middleware
const router = express.Router();
const fs = require('fs');
const { createWorker } = require('tesseract.js');
const SummarizerManager = require('node-summarizer').SummarizerManager;

// Apply authentication middleware to all document routes
router.use(authenticateToken);

/**
 * @route   POST /api/upload
 * @desc    Upload a document (PDF, image)
 * @access  Private
 */
router.post('/upload', upload.single('file'), uploadDocument);

/**
 * @route   GET /api/documents
 * @desc    Get all documents for the logged-in user
 * @access  Private
 */
router.get('/documents', getUserDocuments);

/**
 * @route   GET /api/documents/:id/download
 * @desc    Download a specific document
 * @access  Private
 */
router.get('/documents/:id/download', downloadDocument);

/**
 * @route   DELETE /api/documents/:id
 * @desc    Delete a specific document
 * @access  Private
 */
router.delete('/documents/:id', deleteDocument);
router.post('/upload-and-analyze', upload.single('file'), async (req, res) => {
  // Check if a file was uploaded
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // --- NO 'filePath' NEEDED ---

  try {
    console.log('Starting OCR process for:', req.file.originalname);
    
    // 1. PERFORM OCR
    // Use req.file.buffer directly instead of a filePath
    const worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(req.file.buffer); // <-- THIS IS THE FIX
    await worker.terminate();
    
    console.log('OCR process finished. Extracted text length:', text.length);

    // 2. SUMMARIZE THE TEXT
    let summarizer = new SummarizerManager(text, 5); 
    const summary = summarizer.getSummaryByFrequency().summary;
    console.log('Summarization finished.');

    // 3. SEND THE RESPONSE
    res.json({
      success: true,
      originalText: text,
      summary: summary,
      fileName: req.file.originalname,
    });
  } catch (error) {
    console.error('Error during file analysis:', error);
    res.status(500).json({ error: 'Failed to analyze the document' });
  } 
  // --- NO 'finally' BLOCK NEEDED ---
});
module.exports = router;