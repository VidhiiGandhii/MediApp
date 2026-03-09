const { getBucket } = require('../config/db');
const Document = require('../models/Document');
const stream = require('stream');

/**
 * @route   POST /api/upload
 * @desc    Upload a document (PDF, image)
 * @access  Private
 */
const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const filesBucket = getBucket(); // Get the initialized bucket
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
};

/**
 * @route   GET /api/documents
 * @desc    Get all documents for the logged-in user
 * @access  Private
 */
const getUserDocuments = async (req, res, next) => {
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
};

/**
 * @route   GET /api/documents/:id/download
 * @desc    Download a specific document
 * @access  Private
 */
const downloadDocument = async (req, res, next) => {
  try {
    const document = await Document.findOne({ _id: req.params.id, userId: req.user.id });

    if (!document) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const filesBucket = getBucket();
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
};

/**
 * @route   DELETE /api/documents/:id
 * @desc    Delete a specific document
 * @access  Private
 */
const deleteDocument = async (req, res, next) => {
  try {
    const document = await Document.findOne({ _id: req.params.id, userId: req.user.id });

    if (!document) {
      return res.status(440).json({ success: false, message: 'File not found' });
    }

    const filesBucket = getBucket();

    // Delete from GridFS
    await filesBucket.delete(document.fileId);

    // Delete metadata from MongoDB
    await Document.findByIdAndDelete(req.params.id);

    console.log(`🗑️ Document deleted: ${document.fileName}`);
    res.json({ success: true, message: 'Document deleted successfully' });

  } catch (error) {
    console.error('Delete error:', error);
    // Handle potential error if file not in GridFS but in DB
    if (error.message.includes('File not found')) {
      await Document.findByIdAndDelete(req.params.id); // Clean up metadata anyway
      return res.json({ success: true, message: 'Document metadata deleted (file not in storage)' });
    }
    res.status(500).json({ success: false, message: 'Failed to delete document' });
  }
};

module.exports = {
  uploadDocument,
  getUserDocuments,
  downloadDocument,
  deleteDocument
};