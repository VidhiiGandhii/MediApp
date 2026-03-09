// Use global fetch (Node 18+) or require node-fetch v2 as fallback
let fetchFn = global.fetch;
if (!fetchFn) {
  try {
    fetchFn = require('node-fetch');
  } catch (e) {
    console.error('ERROR: fetch is not available. Ensure Node 18+ or install node-fetch v2.');
    process.exit(1);
  }
}

// Try to use built-in FormData (Node 18.10+), fall back to form-data library
let FormDataImpl;
try {
  FormDataImpl = global.FormData;
} catch (e) {
  FormDataImpl = require('form-data');
}
const FormData = FormDataImpl;
const Document = require('../models/Document');
const ChatMessage = require('../models/ChatMessage');
const { getBucket } = require('../config/db');
const { createWorker } = require('tesseract.js');
const SummarizerManager = require('node-summarizer').SummarizerManager;

// Config: OCR service URL (adjust via env var)
const OCR_SERVICE_URL = process.env.OCR_SERVICE_URL || 'http://localhost:8001';

/**
 * Upload file to GridFS, perform OCR (PDF -> Python, images -> tesseract.js), summarize,
 * request TTS audio from Python, store audio in GridFS and create a ChatMessage entry.
 */
const uploadWithOCR = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const filesBucket = getBucket();
    const readable = require('stream').Readable.from(req.file.buffer);
    const uniqueFileName = `${Date.now()}_${req.file.originalname}`;
    const uploadStream = filesBucket.openUploadStream(uniqueFileName, {
      metadata: { userId: req.user.id, originalName: req.file.originalname }
    });

    readable.pipe(uploadStream);

    uploadStream.on('error', (err) => {
      console.error('GridFS upload error:', err);
      return res.status(500).json({ success: false, message: 'File upload failed' });
    });

    uploadStream.on('finish', async () => {
      try {
        let extractedText = '';
        let summary = '';

        // Decide OCR approach based on file type
        if (req.file.mimetype === 'application/pdf' || req.file.originalname.toLowerCase().endsWith('.pdf')) {
          // Call Python PDF extractor
          const form = new FormData();

          // Create a Blob-like object for fetch FormData (if using native FormData)
          if (typeof form.append === 'function' && FormDataImpl === global.FormData) {
            // Native FormData - convert buffer to Blob
            const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
            form.append('file', blob, req.file.originalname);
            const ocrResp = await fetchFn(`${OCR_SERVICE_URL}/ocr`, {
              method: 'POST',
              body: form
            });
            if (ocrResp.ok) {
              const ocrJson = await ocrResp.json().catch(() => ({}));
              extractedText = ocrJson.extracted_text || '';
              summary = ocrJson.summary || (extractedText || '').slice(0, 800);
              console.log(`✅ PDF OCR successful: extracted ${extractedText.length} characters`);
            } else {
              const errText = await ocrResp.text();
              console.error('OCR service error for PDF:', errText);
            }
          } else {
            // form-data library (Node 18.0-18.9 or older)
            form.append('file', req.file.buffer, { filename: req.file.originalname, contentType: req.file.mimetype });
            const ocrResp = await fetchFn(`${OCR_SERVICE_URL}/ocr`, {
              method: 'POST',
              body: form,
              headers: form.getHeaders()
            });
            if (ocrResp.ok) {
              const ocrJson = await ocrResp.json().catch(() => ({}));
              extractedText = ocrJson.extracted_text || '';
              summary = ocrJson.summary || (extractedText || '').slice(0, 800);
              console.log(`✅ PDF OCR successful: extracted ${extractedText.length} characters`);
            } else {
              const errText = await ocrResp.text();
              console.error('OCR service error for PDF:', errText);
            }
          }
        } else {
          // Use tesseract.js for images (no external Tesseract binary required)
          const worker = await createWorker();
          await worker.load();
          await worker.loadLanguage('eng');
          await worker.initialize('eng');
          const { data: { text } } = await worker.recognize(req.file.buffer);
          await worker.terminate();
          extractedText = text || '';
          // Summarize
          try {
            const summarizer = new SummarizerManager(extractedText, 5);
            summary = summarizer.getSummaryByFrequency().summary;
          } catch (sErr) {
            summary = extractedText.slice(0, 800);
          }
        }

        // Save document metadata + OCR results
        const document = new Document({
          userId: req.user.id,
          fileName: req.file.originalname,
          fileId: uploadStream.id,
          fileType: req.file.mimetype,
          fileSize: req.file.size,
          category: req.body.category || 'Other',
          description: req.body.description || '',
          ocrText: extractedText,
          ocrSummary: summary
        });

        await document.save();

        // Request TTS from Python for the summary (if available)
        let audioFileId = null;
        if (summary && summary.trim()) {
          try {
            const ttsResp = await fetchFn(`${OCR_SERVICE_URL}/tts`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: summary, lang: 'hi', translate: false })
            });

            if (ttsResp.ok) {
              // Save audio into GridFS. Some fetch implementations return a WHATWG stream
              // that is not a Node.js Readable, so read the full arrayBuffer and write that.
              const audioFilename = `${Date.now()}_${req.file.originalname}.mp3`;
              const audioUploadStream = filesBucket.openUploadStream(audioFilename, {
                metadata: { userId: req.user.id, originalName: audioFilename },
                contentType: 'audio/mpeg'
              });

              try {
                const arrayBuffer = await ttsResp.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                await new Promise((resolve, reject) => {
                  audioUploadStream.end(buffer, (err) => {
                    if (err) return reject(err);
                    resolve();
                  });
                });
                audioFileId = audioUploadStream.id;
                console.log(`✅ Saved TTS audio to GridFS with id: ${audioFileId}`);
              } catch (streamErr) {
                console.error('Failed to write TTS audio to GridFS:', streamErr);
              }
            } else {
              console.error('TTS service error:', await ttsResp.text());
            }
          } catch (ttsErr) {
            console.error('TTS request failed:', ttsErr);
          }
        }

        // Create chat message referencing document + audio
        const chat = new ChatMessage({
          userId: req.user.id,
          documentId: document._id,
          summary: summary,
          fullText: extractedText,
          audioFileId: audioFileId || null
        });
        await chat.save();

        res.status(201).json({ success: true, document, chat });
      } catch (err) {
        console.error('Error saving document with OCR:', err);
        res.status(500).json({ success: false, message: 'Failed during OCR processing' });
      }
    });
  } catch (err) {
    console.error('uploadWithOCR error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Delete a document and its associated chat messages and files
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteDocument = async (req, res) => {
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
};

module.exports = {
  uploadWithOCR,
  deleteDocument
};
