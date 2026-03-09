/**
 * TTS Routes - Text-to-Speech and Translation endpoints
 * These routes proxy calls to the Python TTS service
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { PYTHON_API_URL } = require('../config/env');

if (!PYTHON_API_URL) {
  console.warn('Warning: PYTHON_API_URL is not set. TTS routes will return 503.');
}

/**
 * POST /api/tts/translate
 * Translate text to a target language
 * Body: { text: string, targetLang: string (e.g., 'hi' for Hindi) }
 */
router.post('/translate', authenticateToken, async (req, res) => {
  try {
    const { text, targetLang = 'hi' } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (!PYTHON_API_URL) return res.status(503).json({ success: false, error: 'TTS service not configured' });

    const pythonResponse = await fetch(`${PYTHON_API_URL}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text.trim(),
        target_lang: targetLang,
      }),
    });

    if (!pythonResponse.ok) {
      const error = await pythonResponse.json().catch(() => ({}));
      return res.status(pythonResponse.status).json(error);
    }

    const data = await pythonResponse.json();
    res.json({
      success: true,
      translatedText: data.translated_text || data.text,
    });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({
      success: false,
      error: 'Translation service error',
    });
  }
});

/**
 * POST /api/tts/generate
 * Generate speech audio from text
 * Body: { text: string, lang: string (e.g., 'en', 'hi') }
 */
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { text, lang = 'en' } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (!PYTHON_API_URL) return res.status(503).json({ success: false, error: 'TTS service not configured' });

    const pythonResponse = await fetch(`${PYTHON_API_URL}/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text.trim(),
        lang: lang,
      }),
    });

    if (!pythonResponse.ok) {
      const error = await pythonResponse.json().catch(() => ({}));
      return res.status(pythonResponse.status).json(error);
    }

    // If response is audio (binary), send it directly
    const contentType = pythonResponse.headers.get('content-type');
    if (contentType && contentType.includes('audio')) {
      res.setHeader('Content-Type', 'audio/mpeg');
      return res.send(await pythonResponse.buffer());
    }

    // Otherwise, return JSON with audio URL/data
    const data = await pythonResponse.json();
    res.json({
      success: true,
      audioUrl: data.audio_url || data.url,
    });
  } catch (error) {
    console.error('TTS generation error:', error);
    res.status(500).json({
      success: false,
      error: 'TTS service error',
    });
  }
});

/**
 * POST /api/tts/translate-and-speak
 * Combined endpoint: translate to Hindi and generate speech
 * Body: { text: string }
 */
router.post('/translate-and-speak', authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Step 1: Translate to Hindi
    if (!PYTHON_API_URL) return res.status(503).json({ success: false, error: 'TTS service not configured' });

    const translateResponse = await fetch(`${PYTHON_API_URL}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text.trim(),
        target_lang: 'hi',
      }),
    });

    if (!translateResponse.ok) {
      throw new Error('Translation failed');
    }

    const translateData = await translateResponse.json();
    const hindiText = translateData.translated_text || translateData.text;

    // Step 2: Generate speech in Hindi
    const ttsResponse = await fetch(`${PYTHON_API_URL}/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: hindiText,
        lang: 'hi',
      }),
    });

    if (!ttsResponse.ok) {
      throw new Error('TTS generation failed');
    }

    const ttsData = await ttsResponse.json();

    res.json({
      success: true,
      hindiText: hindiText,
      audioUrl: ttsData.audio_url || ttsData.url,
    });
  } catch (error) {
    console.error('Translate and speak error:', error);
    res.status(500).json({
      success: false,
      error: 'Operation failed',
    });
  }
});

module.exports = router;
