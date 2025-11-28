const express = require('express');
const router = express.Router();
const ChatMessage = require('../models/ChatMessage');
const { authenticateToken } = require('../middleware/authMiddleware');
const { getBucket } = require('../config/db');

// All chat routes require authentication
router.use(authenticateToken);

/**
 * GET /api/chat/messages
 * Returns list of chat messages for the logged-in user
 */
router.get('/chat/messages', async (req, res) => {
  try {
    const chats = await ChatMessage.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, chats });
  } catch (err) {
    console.error('Error fetching chat messages:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch chat messages' });
  }
});

/**
 * GET /api/chat/:id/audio
 * Streams the audio file associated with a chat message
 */
router.get('/chat/:id/audio', async (req, res) => {
  try {
    const chat = await ChatMessage.findOne({ _id: req.params.id, userId: req.user.id });
    if (!chat || !chat.audioFileId) return res.status(404).json({ success: false, message: 'Audio not found' });

    const filesBucket = getBucket();
    const downloadStream = filesBucket.openDownloadStream(chat.audioFileId);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `inline; filename="chat_${chat._id}.mp3"`);
    downloadStream.on('error', (error) => {
      console.error('GridFS audio download error:', error);
      res.status(404).json({ success: false, message: 'Audio not found in storage' });
    });
    downloadStream.pipe(res);
  } catch (err) {
    console.error('Error streaming chat audio:', err);
    res.status(500).json({ success: false, message: 'Failed to stream audio' });
  }
});

module.exports = router;
