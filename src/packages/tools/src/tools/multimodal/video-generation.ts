/**
 * Video Generation Tool
 * Production-ready AI video generation with multiple providers
 * Supports Veo3 (Google), Kling AI, and Runway Gen-3
 */

import axios from 'axios';
import { Tool, ToolExecutor } from '@wai/protocols/mcp';

/**
 * Video Generation Tool Definition
 */
export const videoGenerationTool: Tool = {
  id: 'video_generation',
  name: 'AI Video Generation',
  description: 'Generate AI videos from text prompts using Veo3, Kling, or Runway Gen-3. Supports multiple resolutions and aspect ratios.',
  parameters: [
    {
      name: 'provider',
      type: 'string',
      description: 'Video generation provider',
      required: true,
      enum: ['veo3', 'kling', 'runway'],
    },
    {
      name: 'prompt',
      type: 'string',
      description: 'Detailed text description of the video to generate',
      required: true,
    },
    {
      name: 'duration',
      type: 'number',
      description: 'Video duration in seconds (default: 30, max varies by provider)',
      required: false,
      default: 30,
    },
    {
      name: 'resolution',
      type: 'string',
      description: 'Video resolution',
      required: false,
      default: '1080p',
      enum: ['720p', '1080p', '4K'],
    },
    {
      name: 'aspectRatio',
      type: 'string',
      description: 'Video aspect ratio',
      required: false,
      default: '16:9',
      enum: ['16:9', '9:16', '1:1'],
    },
    {
      name: 'style',
      type: 'string',
      description: 'Visual style (provider-specific)',
      required: false,
    },
  ],
  returns: {
    type: 'object',
    description: 'Video generation result with video URL and metadata',
  },
  examples: [
    {
      input: {
        provider: 'veo3',
        prompt: 'A serene ocean sunset with gentle waves, cinematic quality',
        duration: 30,
        resolution: '1080p',
      },
      output: {
        id: 'veo3-1234567890',
        status: 'completed',
        videoUrl: 'https://api.kie.ai/videos/...',
        thumbnailUrl: 'https://api.kie.ai/thumbnails/...',
        duration: 30,
        resolution: '1080p',
      },
    },
  ],
};

/**
 * Video Generation Executor
 */
export const videoGenerationExecutor: ToolExecutor = async (params) => {
  const {
    provider,
    prompt,
    duration = 30,
    resolution = '1080p',
    aspectRatio = '16:9',
    style,
  } = params;

  switch (provider) {
    case 'veo3':
      return generateWithVeo3({ prompt, duration, resolution, aspectRatio });
    case 'kling':
      return generateWithKling({ prompt, duration, style });
    case 'runway':
      return generateWithRunway({ prompt, duration, resolution });
    default:
      return {
        id: `error-${Date.now()}`,
        status: 'failed',
        error: `Unknown provider: ${provider}. Use 'veo3', 'kling', or 'runway'.`,
      };
  }
};

/**
 * Veo3 (via Kie.ai) Video Generation
 */
async function generateWithVeo3(params: {
  prompt: string;
  duration: number;
  resolution: string;
  aspectRatio: string;
}) {
  const apiKey = process.env.KIE_AI_API_KEY;

  if (!apiKey) {
    return {
      id: `error-${Date.now()}`,
      status: 'failed',
      error: 'KIE_AI_API_KEY not configured. Veo3 requires KIE AI API key.',
    };
  }

  try {
    const response = await axios.post(
      'https://api.kie.ai/api/v1/veo/generate',
      {
        prompt: params.prompt,
        model: 'veo3',
        aspectRatio: params.aspectRatio,
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
      videoUrl: undefined,
      thumbnailUrl: undefined,
      duration: params.duration,
      resolution: params.resolution,
      metadata: {
        provider: 'veo3',
        promptLength: params.prompt.length,
      },
    };
  } catch (error: any) {
    return {
      id: `error-${Date.now()}`,
      status: 'failed',
      error: error.response?.data?.error || error.message,
      metadata: { provider: 'veo3' },
    };
  }
}

/**
 * Kling AI Video Generation
 */
async function generateWithKling(params: {
  prompt: string;
  duration: number;
  style?: string;
}) {
  const apiKey = process.env.KLING_API_KEY;

  if (!apiKey) {
    return {
      id: `error-${Date.now()}`,
      status: 'failed',
      error: 'KLING_API_KEY not configured. Please set the API key in environment variables.',
    };
  }

  try {
    const response = await axios.post(
      'https://api.klingai.com/v1/videos',
      {
        prompt: params.prompt,
        duration: Math.min(params.duration, 300), // Max 5 minutes
        quality: 'high',
        style: params.style || 'realistic',
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
      videoUrl: response.data.output_url,
      thumbnailUrl: response.data.thumbnail,
      duration: response.data.duration,
      resolution: '1080p',
      metadata: {
        provider: 'kling',
        promptLength: params.prompt.length,
      },
    };
  } catch (error: any) {
    return {
      id: `error-${Date.now()}`,
      status: 'failed',
      error: error.response?.data?.error || error.message,
      metadata: { provider: 'kling' },
    };
  }
}

/**
 * Runway Gen-3 Video Generation
 */
async function generateWithRunway(params: {
  prompt: string;
  duration: number;
  resolution: string;
}) {
  const apiKey = process.env.RUNWAY_API_KEY;

  if (!apiKey) {
    return {
      id: `error-${Date.now()}`,
      status: 'failed',
      error: 'RUNWAY_API_KEY not configured. Please set the API key in environment variables.',
    };
  }

  try {
    const response = await axios.post(
      'https://api.runwayml.com/v1/generate',
      {
        prompt: params.prompt,
        duration: Math.min(params.duration, 180), // Max 3 minutes
        resolution: params.resolution,
        model: 'gen-3-alpha',
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
      videoUrl: response.data.video_url,
      thumbnailUrl: response.data.thumbnail_url,
      duration: response.data.duration,
      resolution: response.data.resolution,
      metadata: {
        provider: 'runway',
        promptLength: params.prompt.length,
      },
    };
  } catch (error: any) {
    return {
      id: `error-${Date.now()}`,
      status: 'failed',
      error: error.response?.data?.error || error.message,
      metadata: { provider: 'runway' },
    };
  }
}

/**
 * Video Status Tool Definition
 */
export const getVideoStatusTool: Tool = {
  id: 'get_video_status',
  name: 'Get Video Generation Status',
  description: 'Check the status of an async video generation job',
  parameters: [
    {
      name: 'provider',
      type: 'string',
      description: 'Video generation provider',
      required: true,
      enum: ['veo3', 'kling', 'runway'],
    },
    {
      name: 'videoId',
      type: 'string',
      description: 'Video generation job ID',
      required: true,
    },
  ],
  returns: {
    type: 'object',
    description: 'Video generation status and result',
  },
  examples: [
    {
      input: { provider: 'veo3', videoId: 'veo3-1234567890' },
      output: { id: 'veo3-1234567890', status: 'completed', videoUrl: 'https://...' },
    },
  ],
};

/**
 * Video Status Executor
 */
export const getVideoStatusExecutor: ToolExecutor = async (params) => {
  const { provider, videoId } = params;

  if (provider === 'veo3') {
    const apiKey = process.env.KIE_AI_API_KEY;
    if (!apiKey) {
      return {
        id: videoId,
        status: 'failed',
        error: 'KIE_AI_API_KEY not configured',
      };
    }

    try {
      const response = await axios.get(
        `https://api.kie.ai/api/v1/veo/record-info?taskId=${videoId}`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        }
      );

      const taskData = response.data?.data;
      const resultUrls = taskData?.resultUrls ? JSON.parse(taskData.resultUrls) : [];

      return {
        id: videoId,
        status: taskData?.successFlag === 1 ? 'completed' : 'processing',
        videoUrl: resultUrls[0] || undefined,
        thumbnailUrl: undefined,
        duration: undefined,
        resolution: undefined,
        metadata: { provider: 'veo3', successFlag: taskData?.successFlag },
      };
    } catch (error: any) {
      return {
        id: videoId,
        status: 'failed',
        error: error.response?.data?.msg || error.message,
        metadata: { provider: 'veo3' },
      };
    }
  }

  const endpoints: Record<string, string> = {
    kling: `https://api.klingai.com/v1/videos/${videoId}`,
    runway: `https://api.runwayml.com/v1/generate/${videoId}`,
  };

  const apiKeys: Record<string, string | undefined> = {
    kling: process.env.KLING_API_KEY,
    runway: process.env.RUNWAY_API_KEY,
  };

  const endpoint = endpoints[provider];
  const apiKey = apiKeys[provider];

  if (!endpoint || !apiKey) {
    return {
      id: videoId,
      status: 'failed',
      error: `Invalid provider or missing API key: ${provider}`,
    };
  }

  try {
    const response = await axios.get(endpoint, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    return {
      id: response.data.id,
      status: response.data.status,
      videoUrl: response.data.video_url || response.data.output_url,
      thumbnailUrl: response.data.thumbnail_url || response.data.thumbnail,
      duration: response.data.duration,
      resolution: response.data.resolution,
      metadata: { provider },
    };
  } catch (error: any) {
    return {
      id: videoId,
      status: 'failed',
      error: error.response?.data?.error || error.message,
      metadata: { provider },
    };
  }
};

/**
 * Video Generation Providers
 */
export const VIDEO_PROVIDERS = [
  {
    id: 'veo3',
    name: 'Veo3 (via Kie.ai)',
    maxDuration: 600,
    resolutions: ['720p', '1080p', '4K'],
    description: 'Best for long-form content (up to 10 minutes)',
  },
  {
    id: 'kling',
    name: 'Kling 2.5 (via KlingAI)',
    maxDuration: 300,
    resolutions: ['1080p'],
    description: 'Best for effects and quality (up to 5 minutes)',
  },
  {
    id: 'runway',
    name: 'Runway Gen-3',
    maxDuration: 180,
    resolutions: ['4K'],
    description: 'Best for creative control and high quality (up to 3 minutes)',
  },
];
