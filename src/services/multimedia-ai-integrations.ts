import Replicate from 'replicate';
import fetch from 'node-fetch';
import FormData from 'form-data';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import { createWriteStream, createReadStream } from 'fs';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Comprehensive Multimedia AI Integration Service
 * Supports: Pika Labs, Runway ML, Luma AI, Stable Diffusion, MusicGen, Meshy AI, Tripo 3D
 */

export interface AITool {
  name: string;
  type: 'video' | 'audio' | '3d' | 'image';
  status: 'active' | 'inactive' | 'maintenance';
  apiKey?: string;
  baseUrl?: string;
}

export interface GenerationRequest {
  prompt: string;
  type: 'video' | 'audio' | '3d' | 'image';
  options?: Record<string, any>;
  outputPath?: string;
}

export interface GenerationResult {
  success: boolean;
  data?: any;
  url?: string;
  filePath?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export class MultimediaAIIntegrations {
  private replicate: Replicate;
  private tools: Map<string, AITool> = new Map();

  constructor() {
    this.replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN || '',
    });
    
    this.initializeTools();
  }

  private initializeTools() {
    const tools: AITool[] = [
      // Video Generation Tools
      {
        name: 'pika_labs',
        type: 'video',
        status: 'active',
        baseUrl: 'https://api.pika.art/v1'
      },
      {
        name: 'runway_ml',
        type: 'video', 
        status: 'active',
        baseUrl: 'https://api.runwayml.com/v1'
      },
      {
        name: 'stable_video_diffusion',
        type: 'video',
        status: 'active',
        baseUrl: 'https://api.stability.ai/v1'
      },
      {
        name: 'luma_ai',
        type: 'video',
        status: 'active',
        baseUrl: 'https://api.lumalabs.ai/v1'
      },
      // Audio Generation Tools
      {
        name: 'musicgen',
        type: 'audio',
        status: 'active',
        baseUrl: 'https://api.replicate.com/v1'
      },
      {
        name: 'elevenlabs',
        type: 'audio',
        status: 'active',
        baseUrl: 'https://api.elevenlabs.io/v1'
      },
      {
        name: 'suno_ai',
        type: 'audio',
        status: 'active',
        baseUrl: 'https://api.suno.ai/v1'
      },
      // 3D Generation Tools
      {
        name: 'meshy_ai',
        type: '3d',
        status: 'active',
        baseUrl: 'https://api.meshy.ai/v1'
      },
      {
        name: 'tripo_3d',
        type: '3d',
        status: 'active',
        baseUrl: 'https://api.tripo3d.ai/v1'
      },
      // Image Generation Tools
      {
        name: 'stable_diffusion',
        type: 'image',
        status: 'active',
        baseUrl: 'https://api.stability.ai/v1'
      }
    ];

    tools.forEach(tool => {
      this.tools.set(tool.name, tool);
    });

    console.log(`🎨 Initialized ${this.tools.size} multimedia AI tools`);
  }

  /**
   * Generate video content using various AI tools
   */
  async generateVideo(request: GenerationRequest): Promise<GenerationResult> {
    const { prompt, options = {} } = request;
    
    try {
      // Try different video generation tools based on requirements
      if (options.tool === 'pika_labs' || options.cinematic) {
        return await this.generateWithPikaLabs(prompt, options);
      } else if (options.tool === 'runway_ml' || options.professional) {
        return await this.generateWithRunwayML(prompt, options);
      } else if (options.tool === 'luma_ai' || options.realistic) {
        return await this.generateWithLumaAI(prompt, options);
      } else {
        // Default to Stable Video Diffusion via Replicate
        return await this.generateWithStableVideo(prompt, options);
      }
    } catch (error) {
      console.error('Video generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate audio content using AI music/voice tools
   */
  async generateAudio(request: GenerationRequest): Promise<GenerationResult> {
    const { prompt, options = {} } = request;
    
    try {
      if (options.type === 'music' || options.tool === 'musicgen') {
        return await this.generateWithMusicGen(prompt, options);
      } else if (options.type === 'voice' || options.tool === 'elevenlabs') {
        return await this.generateWithElevenLabs(prompt, options);
      } else if (options.tool === 'suno_ai') {
        return await this.generateWithSunoAI(prompt, options);
      } else {
        // Default to MusicGen
        return await this.generateWithMusicGen(prompt, options);
      }
    } catch (error) {
      console.error('Audio generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate 3D models using AI tools
   */
  async generate3D(request: GenerationRequest): Promise<GenerationResult> {
    const { prompt, options = {} } = request;
    
    try {
      if (options.tool === 'meshy_ai' || options.detailed) {
        return await this.generateWithMeshyAI(prompt, options);
      } else if (options.tool === 'tripo_3d' || options.fast) {
        return await this.generateWithTripo3D(prompt, options);
      } else {
        // Default to Meshy AI
        return await this.generateWithMeshyAI(prompt, options);
      }
    } catch (error) {
      console.error('3D generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Pika Labs video generation
   */
  private async generateWithPikaLabs(prompt: string, options: any): Promise<GenerationResult> {
    const response = await fetch(`${this.tools.get('pika_labs')?.baseUrl}/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PIKA_LABS_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        aspect_ratio: options.aspectRatio || '16:9',
        duration: options.duration || 3,
        fps: options.fps || 24,
        style: options.style || 'cinematic'
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`Pika Labs API error: ${result.error || 'Unknown error'}`);
    }

    return {
      success: true,
      data: result,
      url: result.video_url,
      metadata: {
        tool: 'pika_labs',
        duration: result.duration,
        resolution: result.resolution
      }
    };
  }

  /**
   * Runway ML video generation
   */
  private async generateWithRunwayML(prompt: string, options: any): Promise<GenerationResult> {
    const response = await fetch(`${this.tools.get('runway_ml')?.baseUrl}/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RUNWAY_ML_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        model: options.model || 'gen-2',
        duration: options.duration || 4,
        resolution: options.resolution || '1280x768',
        interpolate: options.interpolate || true
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`Runway ML API error: ${result.error || 'Unknown error'}`);
    }

    return {
      success: true,
      data: result,
      url: result.video_url,
      metadata: {
        tool: 'runway_ml',
        model: result.model,
        generation_time: result.generation_time
      }
    };
  }

  /**
   * Luma AI video generation
   */
  private async generateWithLumaAI(prompt: string, options: any): Promise<GenerationResult> {
    const response = await fetch(`${this.tools.get('luma_ai')?.baseUrl}/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LUMA_AI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        keyframes: options.keyframes || [],
        loop: options.loop || false,
        aspect_ratio: options.aspectRatio || '16:9'
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`Luma AI API error: ${result.error || 'Unknown error'}`);
    }

    return {
      success: true,
      data: result,
      url: result.video_url,
      metadata: {
        tool: 'luma_ai',
        quality: result.quality,
        processing_time: result.processing_time
      }
    };
  }

  /**
   * Stable Video Diffusion via Replicate
   */
  private async generateWithStableVideo(prompt: string, options: any): Promise<GenerationResult> {
    const output = await this.replicate.run(
      "stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb1a4d2af12c0908f96eecab8b301e9b8c6e3b91b9",
      {
        input: {
          cond_aug: options.conditioning_augmentation || 0.02,
          decoding_t: options.decoding_t || 7,
          video_length: options.video_length || 14,
          sizing_strategy: options.sizing_strategy || "maintain_aspect_ratio",
          motion_bucket_id: options.motion_bucket_id || 127,
          fps: options.fps || 6,
          image: prompt // For video, we might need an input image
        }
      }
    );

    return {
      success: true,
      data: output,
      url: Array.isArray(output) ? output[0] : output,
      metadata: {
        tool: 'stable_video_diffusion',
        model: 'svd-xt',
        frames: options.video_length || 14
      }
    };
  }

  /**
   * MusicGen audio generation via Replicate
   */
  private async generateWithMusicGen(prompt: string, options: any): Promise<GenerationResult> {
    const output = await this.replicate.run(
      "meta/musicgen:b05b1dff1d8c6dc63d14b0cdb42135378dcb87f6373b0d3d341ede46e59e2dbe",
      {
        input: {
          prompt,
          model_version: options.model_version || "stereo-large",
          output_format: options.output_format || "wav",
          normalization_strategy: options.normalization_strategy || "peak",
          top_k: options.top_k || 250,
          top_p: options.top_p || 0,
          duration: options.duration || 8,
          input_audio: options.input_audio,
          continuation: options.continuation || false
        }
      }
    );

    return {
      success: true,
      data: output,
      url: output,
      metadata: {
        tool: 'musicgen',
        model: options.model_version || "stereo-large",
        duration: options.duration || 8
      }
    };
  }

  /**
   * ElevenLabs voice generation
   */
  private async generateWithElevenLabs(prompt: string, options: any): Promise<GenerationResult> {
    const voiceId = options.voiceId || 'EXAVITQu4vr4xnSDxMaL'; // Default voice
    
    const response = await fetch(`${this.tools.get('elevenlabs')?.baseUrl}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ELEVENLABS_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: prompt,
        model_id: options.model_id || 'eleven_multilingual_v2',
        voice_settings: {
          stability: options.stability || 0.5,
          similarity_boost: options.similarity_boost || 0.8,
          style: options.style || 0.0,
          use_speaker_boost: options.use_speaker_boost || true
        }
      })
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const outputPath = `uploads/audio_${Date.now()}.mp3`;
    await fs.writeFile(outputPath, Buffer.from(audioBuffer));

    return {
      success: true,
      filePath: outputPath,
      metadata: {
        tool: 'elevenlabs',
        voice_id: voiceId,
        model: options.model_id || 'eleven_multilingual_v2'
      }
    };
  }

  /**
   * Suno AI music generation
   */
  private async generateWithSunoAI(prompt: string, options: any): Promise<GenerationResult> {
    const response = await fetch(`${this.tools.get('suno_ai')?.baseUrl}/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUNO_AI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        make_instrumental: options.instrumental || false,
        wait_audio: options.wait_audio || true,
        model: options.model || 'chirp-v3'
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`Suno AI API error: ${result.error || 'Unknown error'}`);
    }

    return {
      success: true,
      data: result,
      url: result.audio_url,
      metadata: {
        tool: 'suno_ai',
        model: result.model,
        duration: result.duration
      }
    };
  }

  /**
   * Meshy AI 3D model generation
   */
  private async generateWithMeshyAI(prompt: string, options: any): Promise<GenerationResult> {
    const response = await fetch(`${this.tools.get('meshy_ai')?.baseUrl}/text-to-3d`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MESHY_AI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        mode: options.mode || 'preview',
        prompt,
        art_style: options.art_style || 'realistic',
        negative_prompt: options.negative_prompt || '',
        ai_model: options.ai_model || 'meshy-4'
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`Meshy AI API error: ${result.error || 'Unknown error'}`);
    }

    return {
      success: true,
      data: result,
      url: result.model_url,
      metadata: {
        tool: 'meshy_ai',
        model: result.ai_model,
        format: result.format
      }
    };
  }

  /**
   * Tripo 3D model generation
   */
  private async generateWithTripo3D(prompt: string, options: any): Promise<GenerationResult> {
    const response = await fetch(`${this.tools.get('tripo_3d')?.baseUrl}/text-to-model`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.TRIPO_3D_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        model_version: options.model_version || 'v1.4-20240625',
        format: options.format || 'glb'
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`Tripo 3D API error: ${result.error || 'Unknown error'}`);
    }

    return {
      success: true,
      data: result,
      url: result.model_url,
      metadata: {
        tool: 'tripo_3d',
        version: result.model_version,
        format: result.format
      }
    };
  }

  /**
   * Get status of all multimedia AI tools
   */
  getToolsStatus(): { [key: string]: AITool } {
    return Object.fromEntries(this.tools);
  }

  /**
   * Test tool availability
   */
  async testTool(toolName: string): Promise<boolean> {
    const tool = this.tools.get(toolName);
    if (!tool) return false;

    try {
      // Simple ping test for each tool
      const response = await fetch(`${tool.baseUrl}/health`, {
        method: 'GET',
        timeout: 5000
      });
      return response.ok;
    } catch (error) {
      console.warn(`Tool ${toolName} is not available:`, error);
      return false;
    }
  }
}

// Export singleton instance
export const multimediaAI = new MultimediaAIIntegrations();