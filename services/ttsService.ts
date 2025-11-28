/**
 * TTS Service with Translation Support
 * Handles text-to-speech generation and language translation
 * Uses backend Python TTS service for audio generation
 */

import { API_URL } from '../config/api';
import { secureStorageHelper } from '../utils/secureStorage';

export interface TTSResponse {
  success: boolean;
  audioUrl?: string;
  error?: string;
}

export interface TranslationResponse {
  success: boolean;
  translatedText?: string;
  error?: string;
}

class TTSService {
  /**
   * Translate text to Hindi using backend service
   */
  async translateToHindi(text: string, token?: string): Promise<TranslationResponse> {
    try {
      const authToken = token || (await secureStorageHelper.getItem('userToken'));
      if (!authToken) {
        return { success: false, error: 'Authentication required' };
      }

      const response = await fetch(`${API_URL}/api/tts/translate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          targetLang: 'hi', // Hindi
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return { success: false, error: error.error || 'Translation failed' };
      }

      const data = await response.json();
      return {
        success: true,
        translatedText: data.translatedText || data.text,
      };
    } catch (error) {
      console.error('Translation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Translation service error',
      };
    }
  }

  /**
   * Generate speech from text
   * Can generate in English or other languages
   */
  async generateSpeech(
    text: string,
    language: string = 'en',
    token?: string
  ): Promise<TTSResponse> {
    try {
      const authToken = token || (await secureStorageHelper.getItem('userToken'));
      if (!authToken) {
        return { success: false, error: 'Authentication required' };
      }

      const response = await fetch(`${API_URL}/api/tts/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          lang: language,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return { success: false, error: error.error || 'TTS generation failed' };
      }

      const data = await response.json();
      return {
        success: true,
        audioUrl: data.audioUrl || data.url,
      };
    } catch (error) {
      console.error('TTS generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'TTS service error',
      };
    }
  }

  /**
   * Generate speech from Hindi text (convenience method)
   */
  async generateHindiSpeech(hindiText: string, token?: string): Promise<TTSResponse> {
    return this.generateSpeech(hindiText, 'hi', token);
  }

  /**
   * Translate to Hindi and generate speech (combined operation)
   */
  async translateAndSpeak(
    englishText: string,
    token?: string
  ): Promise<{
    success: boolean;
    hindiText?: string;
    audioUrl?: string;
    error?: string;
  }> {
    try {
      // First translate
      const translationResult = await this.translateToHindi(englishText, token);
      if (!translationResult.success) {
        return { success: false, error: translationResult.error };
      }

      const hindiText = translationResult.translatedText || englishText;

      // Then generate speech
      const speechResult = await this.generateHindiSpeech(hindiText, token);
      if (!speechResult.success) {
        return { success: false, error: speechResult.error };
      }

      return {
        success: true,
        hindiText,
        audioUrl: speechResult.audioUrl,
      };
    } catch (error) {
      console.error('Translate and speak error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Operation failed',
      };
    }
  }
}

export default new TTSService();
