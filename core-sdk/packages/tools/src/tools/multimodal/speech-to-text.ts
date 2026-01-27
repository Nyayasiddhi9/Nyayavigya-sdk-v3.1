/**
 * Speech-to-Text Tool
 * Production-ready speech recognition with OpenAI Whisper
 * Supports 50+ languages, translation, and multi-format audio input
 */

import axios from 'axios';
import { Tool, ToolExecutor } from '@wai/protocols/mcp';
import { readFileSync } from 'fs';
// Use built-in WHATWG FormData (Node 18+) - axios v1 requires this, not the form-data package

/**
 * Speech-to-Text Tool Definition
 */
export const speechToTextTool: Tool = {
  id: 'speech_to_text',
  name: 'Speech-to-Text (Whisper)',
  description: 'Transcribe audio to text using OpenAI Whisper. Supports 50+ languages, automatic language detection, and translation to English.',
  parameters: [
    {
      name: 'audioPath',
      type: 'string',
      description: 'Path to audio file (mp3, mp4, mpeg, mpga, m4a, wav, webm)',
      required: true,
    },
    {
      name: 'language',
      type: 'string',
      description: 'ISO-639-1 language code (e.g., en, es, fr, de, ja, zh). Optional - auto-detects if not provided.',
      required: false,
    },
    {
      name: 'prompt',
      type: 'string',
      description: 'Optional text to guide the model\'s style or continue a previous segment. Helps with spelling, punctuation, and context.',
      required: false,
    },
    {
      name: 'responseFormat',
      type: 'string',
      description: 'Output format',
      required: false,
      default: 'json',
      enum: ['json', 'text', 'srt', 'verbose_json', 'vtt'],
    },
    {
      name: 'temperature',
      type: 'number',
      description: 'Sampling temperature (0-1). Lower is more deterministic.',
      required: false,
      default: 0,
    },
    {
      name: 'timestampGranularities',
      type: 'array',
      description: 'Timestamp detail level (word, segment). Only with verbose_json format.',
      required: false,
      enum: ['word', 'segment'],
    },
  ],
  returns: {
    type: 'object',
    description: 'Transcribed text with metadata (language, duration, segments if requested)',
  },
  examples: [
    {
      input: {
        audioPath: '/path/to/audio.mp3',
        language: 'en',
      },
      output: {
        success: true,
        text: 'This is the transcribed text from the audio file.',
        language: 'en',
        duration: 15.5,
      },
    },
  ],
};

/**
 * Speech-to-Text Executor
 * Production implementation with OpenAI Whisper
 */
export const speechToTextExecutor: ToolExecutor = async (params) => {
  const {
    audioPath,
    language,
    prompt,
    responseFormat = 'json',
    temperature = 0,
    timestampGranularities,
  } = params;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  try {
    // Read audio file
    const audioBuffer = readFileSync(audioPath);
    const filename = audioPath.split('/').pop() || 'audio.mp3';
    
    // Create Blob from buffer (WHATWG standard)
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    
    // Create form data using built-in WHATWG FormData (Node 18+)
    const formData = new FormData();
    formData.append('file', audioBlob, filename);
    formData.append('model', 'whisper-1');
    
    if (language) {
      formData.append('language', language);
    }
    
    if (prompt) {
      formData.append('prompt', prompt);
    }
    
    formData.append('response_format', responseFormat);
    formData.append('temperature', temperature.toString());
    
    if (timestampGranularities && timestampGranularities.length > 0) {
      timestampGranularities.forEach((granularity: string) => {
        formData.append('timestamp_granularities[]', granularity);
      });
    }

    // Call OpenAI Whisper API (axios v1 uses WHATWG FormData automatically)
    const response = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }
    );

    // Parse response based on format
    if (responseFormat === 'json' || responseFormat === 'verbose_json') {
      return {
        success: true,
        text: response.data.text,
        language: response.data.language,
        duration: response.data.duration,
        segments: response.data.segments,
        words: response.data.words, // Only present with word-level timestamps
        message: 'Audio transcribed successfully',
      };
    } else {
      // text, srt, vtt formats return plain text
      return {
        success: true,
        text: response.data,
        message: `Audio transcribed successfully (${responseFormat} format)`,
      };
    }
  } catch (error: any) {
    if (error.response) {
      throw new Error(
        `Whisper API error: ${error.response.data?.error?.message || error.response.statusText}`
      );
    }
    throw new Error(`Failed to transcribe audio: ${error.message}`);
  }
};

/**
 * Translation Tool Definition (Whisper translate to English)
 */
export const speechTranslationTool: Tool = {
  id: 'speech_translation',
  name: 'Speech Translation (Whisper)',
  description: 'Transcribe and translate audio to English using OpenAI Whisper. Supports 50+ input languages.',
  parameters: [
    {
      name: 'audioPath',
      type: 'string',
      description: 'Path to audio file (mp3, mp4, mpeg, mpga, m4a, wav, webm)',
      required: true,
    },
    {
      name: 'prompt',
      type: 'string',
      description: 'Optional text to guide the translation style',
      required: false,
    },
    {
      name: 'responseFormat',
      type: 'string',
      description: 'Output format',
      required: false,
      default: 'json',
      enum: ['json', 'text', 'srt', 'verbose_json', 'vtt'],
    },
    {
      name: 'temperature',
      type: 'number',
      description: 'Sampling temperature (0-1)',
      required: false,
      default: 0,
    },
  ],
  returns: {
    type: 'object',
    description: 'Translated English text',
  },
  examples: [
    {
      input: {
        audioPath: '/path/to/spanish-audio.mp3',
      },
      output: {
        success: true,
        text: 'This is the English translation of the Spanish audio.',
      },
    },
  ],
};

/**
 * Speech Translation Executor
 */
export const speechTranslationExecutor: ToolExecutor = async (params) => {
  const {
    audioPath,
    prompt,
    responseFormat = 'json',
    temperature = 0,
  } = params;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  try {
    // Read audio file
    const audioBuffer = readFileSync(audioPath);
    const filename = audioPath.split('/').pop() || 'audio.mp3';
    
    // Create Blob from buffer (WHATWG standard)
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    
    // Create form data using built-in WHATWG FormData (Node 18+)
    const formData = new FormData();
    formData.append('file', audioBlob, filename);
    formData.append('model', 'whisper-1');
    
    if (prompt) {
      formData.append('prompt', prompt);
    }
    
    formData.append('response_format', responseFormat);
    formData.append('temperature', temperature.toString());

    // Call OpenAI Whisper Translation API
    const response = await axios.post(
      'https://api.openai.com/v1/audio/translations',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }
    );

    // Parse response
    if (responseFormat === 'json' || responseFormat === 'verbose_json') {
      return {
        success: true,
        text: response.data.text,
        language: 'en', // Always English for translations
        duration: response.data.duration,
        segments: response.data.segments,
        message: 'Audio translated successfully',
      };
    } else {
      return {
        success: true,
        text: response.data,
        message: `Audio translated successfully (${responseFormat} format)`,
      };
    }
  } catch (error: any) {
    if (error.response) {
      throw new Error(
        `Whisper API error: ${error.response.data?.error?.message || error.response.statusText}`
      );
    }
    throw new Error(`Failed to translate audio: ${error.message}`);
  }
};
