/**
 * Music Generation Tool
 * Production-ready AI music generation with multiple providers
 * Supports Suno v4, Suno v4.5 (via Kie.ai), and Udio
 */

import axios from 'axios';
import { Tool, ToolExecutor } from '@wai/protocols/mcp';

/**
 * Music Generation Tool Definition
 */
export const musicGenerationTool: Tool = {
  id: 'music_generation',
  name: 'AI Music Generation',
  description: 'Generate AI music from text prompts using Suno v4/v4.5 or Udio. Supports genre, mood, and instrumental controls.',
  parameters: [
    {
      name: 'provider',
      type: 'string',
      description: 'Music generation provider',
      required: true,
      enum: ['suno-v4', 'suno-v4.5', 'udio'],
    },
    {
      name: 'prompt',
      type: 'string',
      description: 'Detailed text description of the music to generate',
      required: true,
    },
    {
      name: 'duration',
      type: 'number',
      description: 'Music duration in seconds (default: 120, max varies by provider)',
      required: false,
      default: 120,
    },
    {
      name: 'genre',
      type: 'string',
      description: 'Music genre (e.g., pop, rock, jazz, classical, electronic, auto)',
      required: false,
      default: 'auto',
    },
    {
      name: 'mood',
      type: 'string',
      description: 'Music mood (e.g., happy, sad, energetic, calm, auto)',
      required: false,
      default: 'auto',
    },
    {
      name: 'instrumentalOnly',
      type: 'boolean',
      description: 'Generate instrumental-only music without vocals (default: false)',
      required: false,
      default: false,
    },
  ],
  returns: {
    type: 'object',
    description: 'Music generation result with audio URL and metadata',
  },
  examples: [
    {
      input: {
        provider: 'suno-v4.5',
        prompt: 'Upbeat electronic dance music with tropical vibes',
        duration: 180,
        genre: 'electronic',
        mood: 'energetic',
        instrumentalOnly: true,
      },
      output: {
        id: 'suno-1234567890',
        status: 'completed',
        audioUrl: 'https://api.kie.ai/music/...',
        duration: 180,
        genre: 'electronic',
      },
    },
  ],
};

/**
 * Music Generation Executor
 */
export const musicGenerationExecutor: ToolExecutor = async (params) => {
  const {
    provider,
    prompt,
    duration = 120,
    genre = 'auto',
    mood = 'auto',
    instrumentalOnly = false,
  } = params;

  switch (provider) {
    case 'suno-v4':
      return generateWithSunoV4({ prompt, duration, genre, mood, instrumentalOnly });
    case 'suno-v4.5':
      return generateWithSunoV45({ prompt, duration, genre, mood, instrumentalOnly });
    case 'udio':
      return generateWithUdio({ prompt, duration, genre, instrumentalOnly });
    default:
      return {
        id: `error-${Date.now()}`,
        status: 'failed',
        error: `Unknown provider: ${provider}. Use 'suno-v4', 'suno-v4.5', or 'udio'.`,
      };
  }
};

/**
 * Suno v4 Music Generation (via Kie.ai)
 */
async function generateWithSunoV4(params: {
  prompt: string;
  duration: number;
  genre: string;
  mood: string;
  instrumentalOnly: boolean;
}) {
  const apiKey = process.env.KIE_AI_API_KEY;

  if (!apiKey) {
    return {
      id: `error-${Date.now()}`,
      status: 'failed',
      error: 'KIE_AI_API_KEY not configured. Suno v4 requires KIE AI API key.',
    };
  }

  try {
    const response = await axios.post(
      'https://api.kie.ai/api/v1/generate',
      {
        prompt: params.prompt,
        customMode: false,
        instrumental: params.instrumentalOnly,
        model: 'V4',
        callBackUrl: 'https://example.com/callback', // Required by KIE AI API
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const taskId = response.data?.data?.taskId;
    if (!taskId) {
      throw new Error(`Failed to get task ID from response: ${JSON.stringify(response.data)}`);
    }

    return {
      id: taskId,
      status: 'processing',
      audioUrl: undefined,
      duration: params.duration,
      genre: params.genre,
      metadata: {
        provider: 'suno-v4',
        quality: 'standard',
        promptLength: params.prompt.length,
      },
    };
  } catch (error: any) {
    return {
      id: `error-${Date.now()}`,
      status: 'failed',
      error: error.response?.data?.error || error.message,
      metadata: { provider: 'suno-v4' },
    };
  }
}

/**
 * Suno v4.5 Music Generation (via Kie.ai) - Premium Quality
 */
async function generateWithSunoV45(params: {
  prompt: string;
  duration: number;
  genre: string;
  mood: string;
  instrumentalOnly: boolean;
}) {
  const apiKey = process.env.KIE_AI_API_KEY;

  if (!apiKey) {
    return {
      id: `error-${Date.now()}`,
      status: 'failed',
      error: 'KIE_AI_API_KEY not configured. Suno v4.5 requires KIE AI API key.',
    };
  }

  try {
    const response = await axios.post(
      'https://api.kie.ai/api/v1/generate',
      {
        prompt: params.prompt,
        customMode: false,
        instrumental: params.instrumentalOnly,
        model: 'V4_5',
        callBackUrl: 'https://example.com/callback', // Required by KIE AI API
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const taskId = response.data?.data?.taskId;
    if (!taskId) {
      throw new Error(`Failed to get task ID from response: ${JSON.stringify(response.data)}`);
    }

    return {
      id: taskId,
      status: 'processing',
      audioUrl: undefined,
      duration: params.duration,
      genre: params.genre,
      metadata: {
        provider: 'suno-v4.5',
        quality: 'premium',
        promptLength: params.prompt.length,
      },
    };
  } catch (error: any) {
    return {
      id: `error-${Date.now()}`,
      status: 'failed',
      error: error.response?.data?.error || error.message,
      metadata: { provider: 'suno-v4.5' },
    };
  }
}

/**
 * Udio Music Generation
 */
async function generateWithUdio(params: {
  prompt: string;
  duration: number;
  genre: string;
  instrumentalOnly: boolean;
}) {
  const apiKey = process.env.UDIO_API_KEY;

  if (!apiKey) {
    return {
      id: `error-${Date.now()}`,
      status: 'failed',
      error: 'UDIO_API_KEY not configured. Please set the API key in environment variables.',
    };
  }

  try {
    const response = await axios.post(
      'https://api.udio.com/v1',
      {
        prompt: params.prompt,
        duration: Math.min(params.duration, 300), // Max 5 minutes
        style: params.genre || 'experimental',
        mode: params.instrumentalOnly ? 'instrumental' : 'vocal',
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      id: response.data.id,
      status: response.data.status,
      audioUrl: response.data.audio_url,
      duration: response.data.duration,
      genre: response.data.style,
      metadata: {
        provider: 'udio',
        quality: 'experimental',
        promptLength: params.prompt.length,
      },
    };
  } catch (error: any) {
    return {
      id: `error-${Date.now()}`,
      status: 'failed',
      error: error.response?.data?.error || error.message,
      metadata: { provider: 'udio' },
    };
  }
}

/**
 * Music Status Tool Definition
 */
export const getMusicStatusTool: Tool = {
  id: 'get_music_status',
  name: 'Get Music Generation Status',
  description: 'Check the status of an async music generation job',
  parameters: [
    {
      name: 'provider',
      type: 'string',
      description: 'Music generation provider',
      required: true,
      enum: ['suno-v4', 'suno-v4.5', 'udio'],
    },
    {
      name: 'musicId',
      type: 'string',
      description: 'Music generation job ID',
      required: true,
    },
  ],
  returns: {
    type: 'object',
    description: 'Music generation status and result',
  },
  examples: [
    {
      input: { provider: 'suno-v4.5', musicId: 'suno-1234567890' },
      output: { id: 'suno-1234567890', status: 'completed', audioUrl: 'https://...' },
    },
  ],
};

/**
 * Music Status Executor
 */
export const getMusicStatusExecutor: ToolExecutor = async (params) => {
  const { provider, musicId } = params;

  if (provider === 'suno-v4' || provider === 'suno-v4.5') {
    const apiKey = process.env.KIE_AI_API_KEY;
    if (!apiKey) {
      return {
        id: musicId,
        status: 'failed',
        error: 'KIE_AI_API_KEY not configured',
      };
    }

    try {
      const response = await axios.get(
        `https://api.kie.ai/api/v1/generate/record-info?taskId=${musicId}`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        }
      );

      const taskData = response.data?.data;
      const sunoData = taskData?.response?.sunoData?.[0];

      return {
        id: musicId,
        status: taskData?.status === 'SUCCESS' ? 'completed' : 'processing',
        audioUrl: sunoData?.audioUrl || undefined,
        duration: sunoData?.duration || undefined,
        genre: sunoData?.tags || undefined,
        metadata: { provider, taskStatus: taskData?.status },
      };
    } catch (error: any) {
      return {
        id: musicId,
        status: 'failed',
        error: error.response?.data?.msg || error.message,
        metadata: { provider },
      };
    }
  }

  if (provider === 'udio') {
    const apiKey = process.env.UDIO_API_KEY;
    if (!apiKey) {
      return {
        id: musicId,
        status: 'failed',
        error: 'UDIO_API_KEY not configured',
      };
    }

    try {
      const response = await axios.get(`https://api.udio.com/v1/${musicId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      return {
        id: response.data.id,
        status: response.data.status,
        audioUrl: response.data.audio_url,
        duration: response.data.duration,
        genre: response.data.style,
        metadata: { provider: 'udio' },
      };
    } catch (error: any) {
      return {
        id: musicId,
        status: 'failed',
        error: error.response?.data?.error || error.message,
        metadata: { provider: 'udio' },
      };
    }
  }

  return {
    id: musicId,
    status: 'failed',
    error: `Unknown provider: ${provider}`,
  };
};

/**
 * Music Generation Providers
 */
export const MUSIC_PROVIDERS = [
  {
    id: 'suno-v4',
    name: 'Suno v4 (via Kie.ai)',
    maxDuration: 480,
    quality: 'standard',
    description: 'Cost-effective standard quality (up to 8 minutes)',
  },
  {
    id: 'suno-v4.5',
    name: 'Suno v4.5 (via Kie.ai)',
    maxDuration: 480,
    quality: 'premium',
    description: 'Premium quality music generation (up to 8 minutes)',
  },
  {
    id: 'udio',
    name: 'Udio',
    maxDuration: 300,
    quality: 'experimental',
    description: 'Experimental/creative music generation (up to 5 minutes)',
  },
];
