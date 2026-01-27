/**
 * Image Generation Tool
 * Production-ready AI image generation with multiple providers
 * Supports DALL-E 3 (OpenAI) and Stable Diffusion (via Replicate)
 */

import axios from 'axios';
import { Tool, ToolExecutor } from '@wai/protocols/mcp';

/**
 * DALL-E 3 Image Generation Tool Definition
 */
export const dalleImageGenerationTool: Tool = {
  id: 'dalle_image_generation',
  name: 'DALL-E 3 Image Generation',
  description: 'Generate high-quality images from text prompts using OpenAI DALL-E 3. Supports multiple sizes, quality levels, and styles.',
  parameters: [
    {
      name: 'prompt',
      type: 'string',
      description: 'Detailed text description of the image to generate',
      required: true,
    },
    {
      name: 'size',
      type: 'string',
      description: 'Image size',
      required: false,
      default: '1024x1024',
      enum: ['1024x1024', '1792x1024', '1024x1792'],
    },
    {
      name: 'quality',
      type: 'string',
      description: 'Image quality (standard or hd)',
      required: false,
      default: 'standard',
      enum: ['standard', 'hd'],
    },
    {
      name: 'style',
      type: 'string',
      description: 'Image style (vivid or natural)',
      required: false,
      default: 'vivid',
      enum: ['vivid', 'natural'],
    },
    {
      name: 'n',
      type: 'number',
      description: 'Number of images to generate (1-10, default: 1)',
      required: false,
      default: 1,
    },
  ],
  returns: {
    type: 'object',
    description: 'Image generation result with URL and metadata',
  },
  examples: [
    {
      input: {
        prompt: 'A serene mountain landscape at sunset with vibrant colors',
        size: '1792x1024',
        quality: 'hd',
        style: 'vivid',
      },
      output: {
        images: [
          {
            url: 'https://oaidalleapiprodscus.blob.core.windows.net/...',
            revisedPrompt: 'A serene mountain landscape at sunset...',
          },
        ],
        metadata: {
          provider: 'dalle-3',
          model: 'dall-e-3',
          quality: 'hd',
          size: '1792x1024',
        },
      },
    },
  ],
};

/**
 * DALL-E 3 Image Generation Executor
 */
export const dalleImageGenerationExecutor: ToolExecutor = async (params) => {
  const {
    prompt,
    size = '1024x1024',
    quality = 'standard',
    style = 'vivid',
    n = 1,
  } = params;

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      images: [],
      error: 'OPENAI_API_KEY not configured. Please set the API key in environment variables.',
      metadata: { provider: 'dalle-3' },
    };
  }

  // Validate n parameter
  const numImages = Math.min(Math.max(1, n), 10);

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/images/generations',
      {
        model: 'dall-e-3',
        prompt,
        n: numImages,
        size,
        quality,
        style,
        response_format: 'url',
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      images: response.data.data.map((img: any) => ({
        url: img.url,
        revisedPrompt: img.revised_prompt,
      })),
      metadata: {
        provider: 'dalle-3',
        model: 'dall-e-3',
        quality,
        size,
        style,
        created: response.data.created,
      },
    };
  } catch (error: any) {
    return {
      images: [],
      error: error.response?.data?.error?.message || error.message,
      metadata: { provider: 'dalle-3' },
    };
  }
};

/**
 * Stable Diffusion Image Generation Tool Definition
 */
export const stableDiffusionTool: Tool = {
  id: 'stable_diffusion_generation',
  name: 'Stable Diffusion Image Generation',
  description: 'Generate images from text prompts using Stable Diffusion via Replicate API. Supports various models and customization options.',
  parameters: [
    {
      name: 'prompt',
      type: 'string',
      description: 'Detailed text description of the image to generate',
      required: true,
    },
    {
      name: 'negativePrompt',
      type: 'string',
      description: 'Elements to exclude from the image',
      required: false,
    },
    {
      name: 'width',
      type: 'number',
      description: 'Image width in pixels (default: 1024)',
      required: false,
      default: 1024,
    },
    {
      name: 'height',
      type: 'number',
      description: 'Image height in pixels (default: 1024)',
      required: false,
      default: 1024,
    },
    {
      name: 'numInferenceSteps',
      type: 'number',
      description: 'Number of denoising steps (default: 50, higher = better quality but slower)',
      required: false,
      default: 50,
    },
    {
      name: 'guidanceScale',
      type: 'number',
      description: 'How closely to follow the prompt (default: 7.5, range: 1-20)',
      required: false,
      default: 7.5,
    },
    {
      name: 'seed',
      type: 'number',
      description: 'Random seed for reproducibility (optional)',
      required: false,
    },
  ],
  returns: {
    type: 'object',
    description: 'Image generation result with URL and metadata',
  },
  examples: [
    {
      input: {
        prompt: 'A futuristic city with flying cars and neon lights, cyberpunk style',
        negativePrompt: 'blurry, low quality, distorted',
        width: 1024,
        height: 1024,
        numInferenceSteps: 50,
        guidanceScale: 7.5,
      },
      output: {
        id: 'abc123xyz',
        status: 'processing',
        metadata: {
          provider: 'stable-diffusion',
          width: 1024,
          height: 1024,
        },
      },
    },
  ],
};

/**
 * Stable Diffusion Image Generation Executor
 */
export const stableDiffusionExecutor: ToolExecutor = async (params) => {
  const {
    prompt,
    negativePrompt,
    width = 1024,
    height = 1024,
    numInferenceSteps = 50,
    guidanceScale = 7.5,
    seed,
  } = params;

  const apiKey = process.env.REPLICATE_API_KEY;

  if (!apiKey) {
    return {
      id: `error-${Date.now()}`,
      status: 'failed',
      error: 'REPLICATE_API_KEY not configured. Please set the API key in environment variables.',
      metadata: { provider: 'stable-diffusion' },
    };
  }

  try {
    // Clamp dimensions to API limits
    const clampedWidth = Math.min(Math.max(256, width), 2048);
    const clampedHeight = Math.min(Math.max(256, height), 2048);
    const clampedSteps = Math.min(Math.max(1, numInferenceSteps), 100);
    const clampedGuidance = Math.min(Math.max(1, guidanceScale), 20);

    // Start the prediction
    const response = await axios.post(
      'https://api.replicate.com/v1/predictions',
      {
        version: 'ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4', // SDXL 1.0
        input: {
          prompt,
          negative_prompt: negativePrompt || '',
          width: clampedWidth,
          height: clampedHeight,
          num_inference_steps: clampedSteps,
          guidance_scale: clampedGuidance,
          ...(seed !== undefined && { seed }),
        },
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
      imageUrl: response.data.output?.[0],
      metadata: {
        provider: 'stable-diffusion',
        model: 'sdxl-1.0',
        width: clampedWidth,
        height: clampedHeight,
        steps: clampedSteps,
        guidanceScale: clampedGuidance,
        ...(seed !== undefined && { seed }),
      },
    };
  } catch (error: any) {
    return {
      id: `error-${Date.now()}`,
      status: 'failed',
      error: error.response?.data?.detail || error.message,
      metadata: { provider: 'stable-diffusion' },
    };
  }
};

/**
 * Get Stable Diffusion Status Tool Definition
 */
export const getStableDiffusionStatusTool: Tool = {
  id: 'get_stable_diffusion_status',
  name: 'Get Stable Diffusion Status',
  description: 'Check the status of a Stable Diffusion image generation job',
  parameters: [
    {
      name: 'predictionId',
      type: 'string',
      description: 'The prediction ID returned from stable_diffusion_generation',
      required: true,
    },
  ],
  returns: {
    type: 'object',
    description: 'Prediction status and result',
  },
  examples: [
    {
      input: { predictionId: 'abc123xyz' },
      output: {
        id: 'abc123xyz',
        status: 'succeeded',
        imageUrl: 'https://replicate.delivery/...',
      },
    },
  ],
};

/**
 * Get Stable Diffusion Status Executor
 */
export const getStableDiffusionStatusExecutor: ToolExecutor = async (params) => {
  const { predictionId } = params;

  const apiKey = process.env.REPLICATE_API_KEY;

  if (!apiKey) {
    return {
      id: predictionId,
      status: 'failed',
      error: 'REPLICATE_API_KEY not configured',
    };
  }

  try {
    const response = await axios.get(
      `https://api.replicate.com/v1/predictions/${predictionId}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );

    return {
      id: response.data.id,
      status: response.data.status,
      imageUrl: response.data.output?.[0],
      error: response.data.error,
      metadata: {
        provider: 'stable-diffusion',
        created_at: response.data.created_at,
        completed_at: response.data.completed_at,
      },
    };
  } catch (error: any) {
    return {
      id: predictionId,
      status: 'failed',
      error: error.response?.data?.detail || error.message,
    };
  }
};

/**
 * Image Generation Providers
 */
export const IMAGE_PROVIDERS = [
  {
    id: 'dalle-3',
    name: 'DALL-E 3 (OpenAI)',
    maxImages: 10,
    sizes: ['1024x1024', '1792x1024', '1024x1792'],
    qualities: ['standard', 'hd'],
    styles: ['vivid', 'natural'],
    description: 'High-quality, creative images with excellent prompt understanding',
  },
  {
    id: 'stable-diffusion',
    name: 'Stable Diffusion XL 1.0',
    maxSize: '2048x2048',
    customizable: true,
    description: 'Open-source, highly customizable with full control over generation parameters',
  },
];
