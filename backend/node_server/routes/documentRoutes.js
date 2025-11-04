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

module.exports = router;