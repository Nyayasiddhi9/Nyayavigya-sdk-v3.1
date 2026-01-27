/**
 * Voice Synthesis Tool
 * Production-ready text-to-speech with ElevenLabs
 * Supports voice cloning, 30+ languages, and multiple quality models
 */

import axios from 'axios';
import { Tool, ToolExecutor } from '@wai/protocols/mcp';

/**
 * Voice Synthesis Tool Definition
 */
export const voiceSynthesisTool: Tool = {
  id: 'voice_synthesis',
  name: 'Voice Synthesis (Text-to-Speech)',
  description: 'Generate natural speech from text using ElevenLabs TTS. Supports voice cloning, 30+ languages, and multiple quality models.',
  parameters: [
    {
      name: 'text',
      type: 'string',
      description: 'Text to convert to speech',
      required: true,
    },
    {
      name: 'voiceId',
      type: 'string',
      description: 'ElevenLabs voice ID (default: 21m00Tcm4TlvDq8ikWAM)',
      required: false,
      default: '21m00Tcm4TlvDq8ikWAM',
    },
    {
      name: 'model',
      type: 'string',
      description: 'TTS model to use',
      required: false,
      default: 'eleven_multilingual_v2',
      enum: ['eleven_multilingual_v2', 'eleven_turbo_v2', 'eleven_monolingual_v1'],
    },
    {
      name: 'language',
      type: 'string',
      description: 'Language code (e.g., en, es, fr, de, ja, zh)',
      required: false,
      default: 'en',
    },
    {
      name: 'stability',
      type: 'number',
      description: 'Voice stability (0.0-1.0, default: 0.5)',
      required: false,
      default: 0.5,
    },
    {
      name: 'similarityBoost',
      type: 'number',
      description: 'Similarity boost (0.0-1.0, default: 0.75)',
      required: false,
      default: 0.75,
    },
    {
      name: 'style',
      type: 'number',
      description: 'Style exaggeration (0.0-1.0, default: 0)',
      required: false,
      default: 0,
    },
    {
      name: 'useSpeakerBoost',
      type: 'boolean',
      description: 'Enable speaker boost for clarity (default: true)',
      required: false,
      default: true,
    },
  ],
  returns: {
    type: 'object',
    description: 'Voice synthesis result with audio URL (base64 data URI)',
  },
  examples: [
    {
      input: { 
        text: 'Hello, welcome to the WAI SDK voice synthesis system.',
        model: 'eleven_multilingual_v2',
      },
      output: { 
        id: 'voice-1234567890',
        status: 'completed',
        audioUrl: 'data:audio/mpeg;base64,...',
        language: 'en',
      },
    },
  ],
};

/**
 * Voice Synthesis Executor
 */
export const voiceSynthesisExecutor: ToolExecutor = async (params) => {
  const {
    text,
    voiceId = '21m00Tcm4TlvDq8ikWAM',
    model = 'eleven_multilingual_v2',
    language = 'en',
    stability = 0.5,
    similarityBoost = 0.75,
    style = 0,
    useSpeakerBoost = true,
  } = params;

  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return {
      id: `error-${Date.now()}`,
      status: 'failed',
      error: 'ELEVENLABS_API_KEY not configured. Please set the API key in environment variables.',
    };
  }

  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text,
        model_id: model,
        voice_settings: {
          stability,
          similarity_boost: similarityBoost,
          style,
          use_speaker_boost: useSpeakerBoost,
        },
      },
      {
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
      }
    );

    const audioBuffer = Buffer.from(response.data);
    const base64Audio = audioBuffer.toString('base64');
    const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;

    return {
      id: `voice-${Date.now()}`,
      status: 'completed',
      audioUrl,
      language,
      metadata: {
        voiceId,
        model,
        textLength: text.length,
      },
    };
  } catch (error: any) {
    return {
      id: `error-${Date.now()}`,
      status: 'failed',
      error: error.response?.data?.error || error.message,
    };
  }
};

/**
 * Get Available Voices Tool Definition
 */
export const getVoicesTool: Tool = {
  id: 'get_voices',
  name: 'Get Available Voices',
  description: 'Retrieve list of available ElevenLabs voices',
  parameters: [],
  returns: {
    type: 'array',
    description: 'List of available voices with metadata',
  },
  examples: [
    {
      input: {},
      output: [
        {
          voiceId: '21m00Tcm4TlvDq8ikWAM',
          name: 'Rachel',
          category: 'premade',
          labels: { gender: 'female', age: 'young' },
        },
      ],
    },
  ],
};

/**
 * Get Voices Executor
 */
export const getVoicesExecutor: ToolExecutor = async () => {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY not configured');
  }

  try {
    const response = await axios.get('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': apiKey,
      },
    });

    return response.data.voices.map((voice: any) => ({
      voiceId: voice.voice_id,
      name: voice.name,
      category: voice.category,
      labels: voice.labels,
      previewUrl: voice.preview_url,
    }));
  } catch (error: any) {
    throw new Error(`Failed to fetch voices: ${error.message}`);
  }
};

/**
 * Available TTS Models
 */
export const VOICE_SYNTHESIS_MODELS = [
  {
    id: 'eleven_multilingual_v2',
    name: 'Multilingual v2',
    languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'pl', 'tr', 'ru', 'nl', 'cs', 'ar', 'zh', 'ja', 'hi', 'ko'],
    description: 'High-quality multilingual text-to-speech supporting 30+ languages',
  },
  {
    id: 'eleven_turbo_v2',
    name: 'Turbo v2',
    languages: ['en'],
    description: 'Ultra-fast English text-to-speech with minimal latency',
  },
  {
    id: 'eleven_monolingual_v1',
    name: 'Monolingual v1',
    description: 'English-only high-quality voice with maximum expressiveness',
  },
];
