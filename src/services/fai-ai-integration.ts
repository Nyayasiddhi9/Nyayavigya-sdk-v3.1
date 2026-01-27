/**
 * Fai.ai Integration Service
 * 
 * Provides content and video generation capabilities through Fai.ai API
 * - Text-to-Video generation
 * - Image-to-Video transformation
 * - AI content creation and enhancement
 * - Multi-modal generation pipelines
 * 
 * API Documentation: https://fai.ai/docs
 */

import axios, { AxiosInstance } from 'axios';

export interface FaiVideoGenerationRequest {
  prompt: string;
  duration?: number; // seconds (5-60)
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3';
  quality?: 'standard' | 'high' | 'ultra';
  style?: 'realistic' | 'animated' | 'cinematic' | 'artistic';
  fps?: 24 | 30 | 60;
  seed?: number;
}

export interface FaiImageToVideoRequest {
  imageUrl: string;
  prompt: string;
  duration?: number;
  motionStrength?: 'low' | 'medium' | 'high';
  quality?: 'standard' | 'high' | 'ultra';
}

export interface FaiContentGenerationRequest {
  type: 'article' | 'script' | 'social' | 'marketing' | 'blog';
  topic: string;
  length?: 'short' | 'medium' | 'long';
  tone?: 'professional' | 'casual' | 'creative' | 'informative';
  language?: string;
  keywords?: string[];
}

export interface FaiGenerationResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  type: 'video' | 'content' | 'image';
  outputUrl?: string;
  content?: string;
  thumbnailUrl?: string;
  duration?: number;
  progress?: number;
  createdAt: string;
  completedAt?: string;
  error?: string;
  simulated?: boolean; // True when API key not configured - response is mock data
}

export interface FaiApiStatus {
  isAvailable: boolean;
  apiVersion: string;
  modelsAvailable: string[];
  creditsRemaining?: number;
}

export class FaiAIIntegrationService {
  private apiClient: AxiosInstance;
  private apiKey: string | undefined;
  private baseUrl = 'https://api.fai.ai/v1';
  private isConfigured = false;

  constructor() {
    this.apiKey = process.env.FAI_AI_API_KEY;
    this.isConfigured = !!this.apiKey;

    this.apiClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 120000, // 2 minute timeout for generation
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : '',
      },
    });

    console.log(`🎬 Fai.ai Integration Service initialized (configured: ${this.isConfigured})`);
  }

  /**
   * Check if Fai.ai service is available
   */
  public async checkStatus(): Promise<FaiApiStatus> {
    if (!this.isConfigured) {
      return {
        isAvailable: false,
        apiVersion: 'v1',
        modelsAvailable: [],
      };
    }

    try {
      const response = await this.apiClient.get('/status');
      return {
        isAvailable: true,
        apiVersion: response.data.version || 'v1',
        modelsAvailable: response.data.models || ['fai-video-v1', 'fai-content-v1'],
        creditsRemaining: response.data.credits,
      };
    } catch (error) {
      console.error('❌ Fai.ai status check failed:', error);
      return {
        isAvailable: false,
        apiVersion: 'v1',
        modelsAvailable: [],
      };
    }
  }

  /**
   * Generate video from text prompt
   */
  public async generateVideo(request: FaiVideoGenerationRequest): Promise<FaiGenerationResponse> {
    if (!this.isConfigured) {
      console.log('⚠️ Fai.ai not configured - returning simulated response');
      return this.simulateVideoGeneration(request);
    }

    try {
      const response = await this.apiClient.post('/generate/video', {
        prompt: request.prompt,
        duration: request.duration || 5,
        aspect_ratio: request.aspectRatio || '16:9',
        quality: request.quality || 'high',
        style: request.style || 'realistic',
        fps: request.fps || 30,
        seed: request.seed,
      });

      return {
        id: response.data.id,
        status: response.data.status,
        type: 'video',
        outputUrl: response.data.output_url,
        thumbnailUrl: response.data.thumbnail_url,
        duration: response.data.duration,
        progress: response.data.progress || 0,
        createdAt: response.data.created_at,
        completedAt: response.data.completed_at,
      };
    } catch (error: any) {
      console.error('❌ Video generation failed:', error?.message || error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Video generation failed';
      throw new Error(`Fai.ai API Error: ${errorMessage}`);
    }
  }

  /**
   * Generate video from image (image-to-video)
   */
  public async imageToVideo(request: FaiImageToVideoRequest): Promise<FaiGenerationResponse> {
    if (!this.isConfigured) {
      console.log('⚠️ Fai.ai not configured - returning simulated response');
      return this.simulateImageToVideo(request);
    }

    try {
      const response = await this.apiClient.post('/generate/image-to-video', {
        image_url: request.imageUrl,
        prompt: request.prompt,
        duration: request.duration || 5,
        motion_strength: request.motionStrength || 'medium',
        quality: request.quality || 'high',
      });

      return {
        id: response.data.id,
        status: response.data.status,
        type: 'video',
        outputUrl: response.data.output_url,
        thumbnailUrl: response.data.thumbnail_url,
        duration: response.data.duration,
        progress: response.data.progress || 0,
        createdAt: response.data.created_at,
      };
    } catch (error: any) {
      console.error('❌ Image-to-video generation failed:', error?.message || error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Image-to-video generation failed';
      throw new Error(`Fai.ai API Error: ${errorMessage}`);
    }
  }

  /**
   * Generate content (articles, scripts, social posts)
   */
  public async generateContent(request: FaiContentGenerationRequest): Promise<FaiGenerationResponse> {
    if (!this.isConfigured) {
      console.log('⚠️ Fai.ai not configured - returning simulated response');
      return this.simulateContentGeneration(request);
    }

    try {
      const response = await this.apiClient.post('/generate/content', {
        type: request.type,
        topic: request.topic,
        length: request.length || 'medium',
        tone: request.tone || 'professional',
        language: request.language || 'en',
        keywords: request.keywords,
      });

      return {
        id: response.data.id,
        status: 'completed',
        type: 'content',
        content: response.data.content,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('❌ Content generation failed:', error?.message || error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Content generation failed';
      throw new Error(`Fai.ai API Error: ${errorMessage}`);
    }
  }

  /**
   * Check generation status
   */
  public async getGenerationStatus(generationId: string): Promise<FaiGenerationResponse> {
    if (!this.isConfigured) {
      return {
        id: generationId,
        status: 'completed',
        type: 'video',
        outputUrl: `https://cdn.fai.ai/simulated/${generationId}.mp4`,
        progress: 100,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        simulated: true,
      };
    }

    try {
      const response = await this.apiClient.get(`/generations/${generationId}`);
      return {
        id: response.data.id,
        status: response.data.status,
        type: response.data.type,
        outputUrl: response.data.output_url,
        content: response.data.content,
        thumbnailUrl: response.data.thumbnail_url,
        duration: response.data.duration,
        progress: response.data.progress,
        createdAt: response.data.created_at,
        completedAt: response.data.completed_at,
        error: response.data.error,
      };
    } catch (error) {
      console.error('❌ Failed to get generation status:', error);
      throw new Error('Failed to get generation status');
    }
  }

  /**
   * List available models
   */
  public getAvailableModels(): string[] {
    return [
      'fai-video-v1',        // Text-to-video
      'fai-video-v2',        // Advanced text-to-video
      'fai-i2v-v1',          // Image-to-video
      'fai-content-v1',      // Content generation
      'fai-script-v1',       // Script writing
      'fai-social-v1',       // Social media content
    ];
  }

  /**
   * Get supported capabilities
   */
  public getCapabilities(): {
    video: string[];
    content: string[];
    image: string[];
  } {
    return {
      video: [
        'text-to-video',
        'image-to-video',
        'video-upscaling',
        'video-interpolation',
        'style-transfer',
      ],
      content: [
        'article-generation',
        'script-writing',
        'social-media-posts',
        'marketing-copy',
        'blog-posts',
        'product-descriptions',
      ],
      image: [
        'image-enhancement',
        'style-transfer',
        'background-removal',
        'upscaling',
      ],
    };
  }

  // Simulation methods for when API is not configured

  private simulateVideoGeneration(request: FaiVideoGenerationRequest): FaiGenerationResponse {
    const id = `fai-sim-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    console.log(`🎬 [Simulation] Video generation request for: "${request.prompt.substring(0, 50)}..."`);
    
    return {
      id,
      status: 'completed',
      type: 'video',
      outputUrl: `https://cdn.fai.ai/simulated/videos/${id}.mp4`,
      thumbnailUrl: `https://cdn.fai.ai/simulated/thumbnails/${id}.jpg`,
      duration: request.duration || 5,
      progress: 100,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      simulated: true,
    };
  }

  private simulateImageToVideo(request: FaiImageToVideoRequest): FaiGenerationResponse {
    const id = `fai-i2v-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    console.log(`🎬 [Simulation] Image-to-video for: "${request.prompt.substring(0, 50)}..."`);
    
    return {
      id,
      status: 'completed',
      type: 'video',
      outputUrl: `https://cdn.fai.ai/simulated/videos/${id}.mp4`,
      thumbnailUrl: `https://cdn.fai.ai/simulated/thumbnails/${id}.jpg`,
      duration: request.duration || 5,
      progress: 100,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      simulated: true,
    };
  }

  private simulateContentGeneration(request: FaiContentGenerationRequest): FaiGenerationResponse {
    const id = `fai-content-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    console.log(`📝 [Simulation] Content generation for: "${request.topic}"`);
    
    const contentTemplates: Record<string, string> = {
      article: `# ${request.topic}\n\nThis is a simulated article about ${request.topic}. In a production environment, this would contain AI-generated content based on your specifications.\n\n## Key Points\n\n1. Point one about ${request.topic}\n2. Point two about ${request.topic}\n3. Point three about ${request.topic}\n\n## Conclusion\n\nThe topic of ${request.topic} is comprehensive and covers multiple aspects.`,
      script: `[SCENE 1]\n\nNARRATOR: Welcome to our exploration of ${request.topic}.\n\n[TRANSITION]\n\n[SCENE 2]\n\nHOST: Today we'll be discussing the key aspects of ${request.topic}...`,
      social: `🚀 Exciting insights about ${request.topic}!\n\nHere's what you need to know:\n\n✅ Key insight 1\n✅ Key insight 2\n✅ Key insight 3\n\n#${request.topic.replace(/\s+/g, '')} #AIContent #FaiAI`,
      marketing: `Discover the power of ${request.topic}.\n\nOur solution helps you:\n• Benefit 1\n• Benefit 2\n• Benefit 3\n\nGet started today and transform your results!`,
      blog: `# ${request.topic}: A Comprehensive Guide\n\nIn this blog post, we explore ${request.topic} in detail.\n\n## Introduction\n\n${request.topic} has become increasingly important...\n\n## Main Content\n\nLet's dive into the details...\n\n## Conclusion\n\nWe've covered the essentials of ${request.topic}.`,
    };
    
    return {
      id,
      status: 'completed',
      type: 'content',
      content: contentTemplates[request.type] || contentTemplates.article,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      simulated: true,
    };
  }
}

export const faiAIService = new FaiAIIntegrationService();
