/**
 * OpenAI Provider - Real API Integration
 * 
 * Implements comprehensive OpenAI integration with:
 * - GPT-4o, GPT-5, o3, o1 model support
 * - DALL-E 3 image generation
 * - TTS (Text-to-Speech) with natural voices
 * - Whisper speech-to-text transcription
 * - Function calling and tool use
 * - Real-time streaming responses
 * - Advanced cost optimization
 * - Circuit breaker protection
 */

import OpenAI from 'openai';
import { UnifiedLLMAdapter, type LLMProvider, type LLMRequest, type LLMResponse, type ProviderCapabilities, type ProviderPricing, type ProviderLimits } from './unified-llm-adapter';
import { generateCorrelationId, createTimeoutController } from '../orchestration-utils';
import { ProviderError } from '../orchestration-errors';

export class OpenAIProvider extends UnifiedLLMAdapter {
  private client: OpenAI;
  private readonly models = {
    // Text Generation Models
    'gpt-4o': { inputCost: 2.5, outputCost: 10, contextWindow: 128000, maxOutput: 16384 },
    'gpt-4o-mini': { inputCost: 0.15, outputCost: 0.6, contextWindow: 128000, maxOutput: 16384 },
    'gpt-5': { inputCost: 5.0, outputCost: 20, contextWindow: 200000, maxOutput: 32768 }, // Expected pricing
    'o3': { inputCost: 15.0, outputCost: 60, contextWindow: 32000, maxOutput: 8192 }, // Expected pricing
    'o1': { inputCost: 15.0, outputCost: 60, contextWindow: 32000, maxOutput: 8192 },
    'o1-mini': { inputCost: 3.0, outputCost: 12, contextWindow: 128000, maxOutput: 65536 },
    'gpt-4-turbo': { inputCost: 10, outputCost: 30, contextWindow: 128000, maxOutput: 4096 },
    'gpt-3.5-turbo': { inputCost: 0.5, outputCost: 1.5, contextWindow: 16385, maxOutput: 4096 },
    
    // Multimodal Models
    'gpt-4-vision-preview': { inputCost: 10, outputCost: 30, contextWindow: 128000, maxOutput: 4096 },
    
    // Audio Models
    'whisper-1': { inputCost: 6, outputCost: 0, contextWindow: 0, maxOutput: 0 }, // $0.006 per minute
    'tts-1': { inputCost: 15, outputCost: 0, contextWindow: 0, maxOutput: 0 }, // $0.015 per 1K chars
    'tts-1-hd': { inputCost: 30, outputCost: 0, contextWindow: 0, maxOutput: 0 }, // $0.030 per 1K chars
    
    // Image Models
    'dall-e-3': { inputCost: 0, outputCost: 0, contextWindow: 0, maxOutput: 0 }, // $0.040-$0.120 per image
    'dall-e-2': { inputCost: 0, outputCost: 0, contextWindow: 0, maxOutput: 0 }, // $0.016-$0.020 per image
    
    // Embedding Models
    'text-embedding-3-large': { inputCost: 0.13, outputCost: 0, contextWindow: 8191, maxOutput: 0 },
    'text-embedding-3-small': { inputCost: 0.02, outputCost: 0, contextWindow: 8191, maxOutput: 0 },
    'text-embedding-ada-002': { inputCost: 0.1, outputCost: 0, contextWindow: 8191, maxOutput: 0 }
  };

  constructor(apiKey?: string) {
    const provider: LLMProvider = {
      id: 'openai',
      name: 'OpenAI',
      models: Object.keys(OpenAIProvider.prototype.models),
      capabilities: {
        textGeneration: true,
        codeGeneration: true,
        imageGeneration: true,
        audioGeneration: true,
        speechToText: true,
        textToSpeech: true,
        multimodal: true,
        functionCalling: true,
        streaming: true,
        embedding: true,
        reasoning: 95,
        creativity: 90,
        factualAccuracy: 92,
        codingProficiency: 94,
        multilingualSupport: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi', 'tr']
      },
      pricing: {
        inputTokenCost: 2.5, // GPT-4o base price per 1M tokens
        outputTokenCost: 10, // GPT-4o base price per 1M tokens
        imageGenerationCost: 40, // DALL-E 3 base price per image (1024x1024)
        audioGenerationCost: 15, // TTS base price per 1K characters
        embeddingCost: 0.13, // text-embedding-3-large per 1M tokens
        currency: 'USD',
        billingModel: 'pay-per-use',
        freeTierLimits: {
          tokensPerMonth: 0,
          requestsPerMinute: 3500,
          requestsPerDay: 10000
        }
      },
      limits: {
        maxTokensPerRequest: 128000,
        maxRequestsPerMinute: 3500,
        maxRequestsPerDay: 10000,
        maxConcurrentRequests: 100,
        contextWindow: 128000,
        timeoutMs: 120000
      },
      status: 'available',
      region: ['global'],
      apiVersion: 'v1',
      lastHealthCheck: new Date(),
      healthScore: 100
    };

    const key = apiKey || process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error('OpenAI API key is required');
    }

    super(provider, key);
    
    this.client = new OpenAI({
      apiKey: key,
      timeout: this.provider.limits.timeoutMs,
      maxRetries: 3
    });

    console.log('✅ OpenAI Provider initialized with real API integration');
  }

  protected getDefaultBaseUrl(): string {
    return 'https://api.openai.com/v1';
  }

  protected async validateApiKey(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch (error) {
      console.error('OpenAI API key validation failed:', error);
      return false;
    }
  }

  async generateResponse(request: LLMRequest): Promise<LLMResponse> {
    const correlationId = request.correlationId || generateCorrelationId();
    const startTime = Date.now();
    
    try {
      console.log(`🔄 [${correlationId}] OpenAI generating response with model: ${request.model || 'gpt-4o'}`);
      
      // Check rate limiting
      if (!(await this.checkRateLimit())) {
        throw new ProviderError('Rate limit exceeded', 'openai', { correlationId });
      }

      // Select optimal model if not specified
      const model = request.model || this.selectOptimalModel(request);
      const modelConfig = this.models[model as keyof typeof this.models];
      
      if (!modelConfig) {
        throw new ProviderError(`Unsupported model: ${model}`, 'openai', { correlationId, model });
      }

      // Prepare messages
      const messages = this.formatMessages(request);
      
      // Handle special models (o1, o3 series don't support system messages)
      const isReasoningModel = model.startsWith('o1') || model.startsWith('o3');
      const formattedMessages = isReasoningModel ? this.formatForReasoningModel(messages) : messages;

      // Create timeout controller
      const timeoutController = createTimeoutController(this.provider.limits.timeoutMs);

      // Generate response
      const completion = await this.client.chat.completions.create({
        model,
        messages: formattedMessages,
        temperature: isReasoningModel ? undefined : (request.temperature ?? 0.7),
        max_tokens: request.maxTokens || modelConfig.maxOutput,
        top_p: isReasoningModel ? undefined : request.topP,
        frequency_penalty: isReasoningModel ? undefined : request.frequencyPenalty,
        presence_penalty: isReasoningModel ? undefined : request.presencePenalty,
        stop: request.stopSequences,
        tools: request.tools?.map(tool => ({
          type: 'function' as const,
          function: tool.function
        })),
        tool_choice: request.tools ? 'auto' : undefined,
        stream: false
      }, {
        signal: timeoutController.signal
      });

      const responseTime = Date.now() - startTime;
      const usage = completion.usage!;
      const choice = completion.choices[0];
      
      // Calculate cost
      const cost = this.calculateModelCost(model, usage);

      const response: LLMResponse = {
        id: completion.id,
        content: choice.message.content || '',
        model,
        provider: 'openai',
        usage: {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens
        },
        cost,
        responseTime,
        finishReason: this.mapFinishReason(choice.finish_reason),
        functionCalls: choice.message.tool_calls?.filter(tc => tc.type === 'function').map(tc => ({
          name: tc.function?.name || '',
          arguments: tc.function?.arguments ? JSON.parse(tc.function.arguments) : {}
        })),
        correlationId,
        timestamp: new Date(),
        metadata: {
          model,
          openai_id: completion.id,
          system_fingerprint: completion.system_fingerprint
        }
      };

      // Track cost
      this.trackCost(response);

      console.log(`✅ [${correlationId}] OpenAI response generated: ${response.usage.totalTokens} tokens, $${cost.toFixed(6)} cost, ${responseTime}ms`);
      this.emit('response-generated', response);

      return response;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`❌ [${correlationId}] OpenAI request failed after ${responseTime}ms:`, error);
      
      if (error instanceof Error) {
        throw new ProviderError(
          `OpenAI request failed: ${error.message}`,
          'openai',
          { correlationId, responseTime, originalError: error }
        );
      }
      
      throw error;
    }
  }

  async *generateStream(request: LLMRequest): AsyncGenerator<Partial<LLMResponse>, void, unknown> {
    const correlationId = request.correlationId || generateCorrelationId();
    const startTime = Date.now();
    
    try {
      console.log(`🔄 [${correlationId}] OpenAI streaming response with model: ${request.model || 'gpt-4o'}`);
      
      const model = request.model || this.selectOptimalModel(request);
      const isReasoningModel = model.startsWith('o1') || model.startsWith('o3');
      const messages = this.formatMessages(request);
      const formattedMessages = isReasoningModel ? this.formatForReasoningModel(messages) : messages;

      const stream = await this.client.chat.completions.create({
        model,
        messages: formattedMessages,
        temperature: isReasoningModel ? undefined : (request.temperature ?? 0.7),
        max_tokens: request.maxTokens,
        top_p: isReasoningModel ? undefined : request.topP,
        frequency_penalty: isReasoningModel ? undefined : request.frequencyPenalty,
        presence_penalty: isReasoningModel ? undefined : request.presencePenalty,
        stop: request.stopSequences,
        tools: request.tools?.map(tool => ({
          type: 'function' as const,
          function: tool.function
        })),
        stream: true
      });

      let fullContent = '';
      let totalTokens = 0;
      let functionCalls: any[] = [];

      for await (const chunk of stream) {
        const choice = chunk.choices[0];
        if (!choice) continue;

        const deltaContent = choice.delta?.content || '';
        if (deltaContent) {
          fullContent += deltaContent;
          totalTokens += this.estimateTokens(deltaContent);
        }

        // Handle function calls in streaming
        if (choice.delta?.tool_calls) {
          functionCalls.push(...choice.delta.tool_calls);
        }

        const partialResponse: Partial<LLMResponse> = {
          id: chunk.id,
          content: fullContent,
          model,
          provider: 'openai',
          usage: {
            promptTokens: 0, // Will be calculated at the end
            completionTokens: totalTokens,
            totalTokens: totalTokens
          },
          responseTime: Date.now() - startTime,
          finishReason: choice.finish_reason ? this.mapFinishReason(choice.finish_reason) : 'stop',
          correlationId,
          timestamp: new Date()
        };

        yield partialResponse;

        if (choice.finish_reason) {
          break;
        }
      }

      console.log(`✅ [${correlationId}] OpenAI streaming completed: ${totalTokens} tokens`);

    } catch (error) {
      console.error(`❌ [${correlationId}] OpenAI streaming failed:`, error);
      throw new ProviderError(
        `OpenAI streaming failed: ${error}`,
        'openai',
        { correlationId }
      );
    }
  }

  async generateEmbeddings(texts: string[], model = 'text-embedding-3-large'): Promise<number[][]> {
    const correlationId = generateCorrelationId();
    const startTime = Date.now();
    
    try {
      console.log(`🔄 [${correlationId}] OpenAI generating embeddings for ${texts.length} texts`);
      
      const response = await this.client.embeddings.create({
        model,
        input: texts,
        encoding_format: 'float'
      });

      const responseTime = Date.now() - startTime;
      const totalTokens = response.usage.total_tokens;
      const cost = (totalTokens / 1000000) * (this.models[model as keyof typeof this.models]?.inputCost || 0.13);

      console.log(`✅ [${correlationId}] OpenAI embeddings generated: ${totalTokens} tokens, $${cost.toFixed(6)} cost, ${responseTime}ms`);

      return response.data.map(item => item.embedding);

    } catch (error) {
      console.error(`❌ [${correlationId}] OpenAI embeddings failed:`, error);
      throw new ProviderError(
        `OpenAI embeddings failed: ${error}`,
        'openai',
        { correlationId }
      );
    }
  }

  async generateImage(prompt: string, options: {
    model?: 'dall-e-2' | 'dall-e-3';
    size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
    quality?: 'standard' | 'hd';
    style?: 'vivid' | 'natural';
    n?: number;
  } = {}): Promise<{ url: string; cost: number }> {
    const correlationId = generateCorrelationId();
    const startTime = Date.now();
    
    try {
      console.log(`🔄 [${correlationId}] OpenAI generating image with DALL-E`);
      
      const {
        model = 'dall-e-3',
        size = '1024x1024',
        quality = 'standard',
        style = 'vivid',
        n = 1
      } = options;

      const response = await this.client.images.generate({
        model,
        prompt,
        size: size as any,
        quality: model === 'dall-e-3' ? quality : undefined,
        style: model === 'dall-e-3' ? style : undefined,
        n,
        response_format: 'url'
      });

      const responseTime = Date.now() - startTime;
      
      // Calculate cost based on model and size
      let cost = 0;
      if (model === 'dall-e-3') {
        if (size === '1024x1024') cost = quality === 'hd' ? 0.080 : 0.040;
        else if (size === '1792x1024' || size === '1024x1792') cost = quality === 'hd' ? 0.120 : 0.080;
      } else if (model === 'dall-e-2') {
        if (size === '1024x1024') cost = 0.020;
        else if (size === '512x512') cost = 0.018;
        else if (size === '256x256') cost = 0.016;
      }
      cost *= n;

      const imageUrl = response.data?.[0]?.url;
      if (!imageUrl) {
        throw new Error('No image URL returned from OpenAI');
      }

      console.log(`✅ [${correlationId}] OpenAI image generated: $${cost.toFixed(3)} cost, ${responseTime}ms`);

      return { url: imageUrl, cost };

    } catch (error) {
      console.error(`❌ [${correlationId}] OpenAI image generation failed:`, error);
      throw new ProviderError(
        `OpenAI image generation failed: ${error}`,
        'openai',
        { correlationId }
      );
    }
  }

  async generateAudio(text: string, options: {
    model?: 'tts-1' | 'tts-1-hd';
    voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
    response_format?: 'mp3' | 'opus' | 'aac' | 'flac';
    speed?: number;
  } = {}): Promise<{ url: string; cost: number }> {
    const correlationId = generateCorrelationId();
    const startTime = Date.now();
    
    try {
      console.log(`🔄 [${correlationId}] OpenAI generating speech with TTS`);
      
      const {
        model = 'tts-1',
        voice = 'nova',
        response_format = 'mp3',
        speed = 1.0
      } = options;

      const response = await this.client.audio.speech.create({
        model,
        input: text,
        voice,
        response_format,
        speed
      });

      const responseTime = Date.now() - startTime;
      
      // Calculate cost based on character count
      const charCount = text.length;
      const costPerChar = model === 'tts-1-hd' ? 0.000030 : 0.000015;
      const cost = charCount * costPerChar;

      // Convert response to blob URL
      const buffer = Buffer.from(await response.arrayBuffer());
      const base64 = buffer.toString('base64');
      const mimeType = response_format === 'mp3' ? 'audio/mpeg' : `audio/${response_format}`;
      const url = `data:${mimeType};base64,${base64}`;

      console.log(`✅ [${correlationId}] OpenAI speech generated: ${charCount} chars, $${cost.toFixed(6)} cost, ${responseTime}ms`);

      return { url, cost };

    } catch (error) {
      console.error(`❌ [${correlationId}] OpenAI TTS failed:`, error);
      throw new ProviderError(
        `OpenAI TTS failed: ${error}`,
        'openai',
        { correlationId }
      );
    }
  }

  async transcribeAudio(audioFile: File | Buffer | string, options: {
    model?: 'whisper-1';
    language?: string;
    prompt?: string;
    response_format?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
    temperature?: number;
  } = {}): Promise<{ text: string; cost: number }> {
    const correlationId = generateCorrelationId();
    const startTime = Date.now();
    
    try {
      console.log(`🔄 [${correlationId}] OpenAI transcribing audio with Whisper`);
      
      const {
        model = 'whisper-1',
        language,
        prompt,
        response_format = 'json',
        temperature = 0
      } = options;

      let file: File;
      if (typeof audioFile === 'string') {
        // If it's a URL, we'd need to fetch it first
        throw new Error('URL-based audio transcription not implemented yet');
      } else if (Buffer.isBuffer(audioFile)) {
        // Convert buffer to File-like object
        const blob = new Blob([audioFile.buffer.slice(audioFile.byteOffset, audioFile.byteOffset + audioFile.byteLength)], { type: 'audio/mpeg' });
        file = new File([blob], 'audio.mp3', { type: 'audio/mpeg' });
      } else {
        file = audioFile;
      }

      const response = await this.client.audio.transcriptions.create({
        file,
        model,
        language,
        prompt,
        response_format,
        temperature
      });

      const responseTime = Date.now() - startTime;
      
      // Calculate cost (Whisper pricing is $0.006 per minute)
      // We'll estimate duration based on file size (rough approximation)
      const fileSizeKB = file.size / 1024;
      const estimatedMinutes = Math.max(0.1, fileSizeKB / 500); // Very rough estimate
      const cost = estimatedMinutes * 0.006;

      const text = typeof response === 'string' ? response : response.text;

      console.log(`✅ [${correlationId}] OpenAI transcription completed: ~${estimatedMinutes.toFixed(1)}min, $${cost.toFixed(6)} cost, ${responseTime}ms`);

      return { text, cost };

    } catch (error) {
      console.error(`❌ [${correlationId}] OpenAI transcription failed:`, error);
      throw new ProviderError(
        `OpenAI transcription failed: ${error}`,
        'openai',
        { correlationId }
      );
    }
  }

  /**
   * Private helper methods
   */
  private selectOptimalModel(request: LLMRequest): string {
    const messageLength = request.messages.reduce((sum, msg) => sum + msg.content.length, 0);
    const hasTools = request.tools && request.tools.length > 0;
    const hasImages = request.messages.some(msg => 
      Array.isArray(msg.content) && msg.content.some(c => c.type === 'image')
    );

    // Select based on complexity and requirements
    if (hasImages) return 'gpt-4-vision-preview';
    if (hasTools) return 'gpt-4o';
    if (messageLength > 50000) return 'gpt-4o'; // Large context
    if (messageLength > 10000) return 'gpt-4o-mini'; // Medium context, cost-effective
    
    return 'gpt-4o-mini'; // Default for simple requests
  }

  private formatMessages(request: LLMRequest): any[] {
    const messages = [...request.messages];
    
    // Add system prompt if provided
    if (request.systemPrompt) {
      messages.unshift({
        role: 'system',
        content: request.systemPrompt
      });
    }

    return messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      name: msg.name,
      function_call: msg.functionCall
    }));
  }

  private formatForReasoningModel(messages: any[]): any[] {
    // o1 and o3 models don't support system messages, convert to user message
    return messages.map(msg => {
      if (msg.role === 'system') {
        return {
          role: 'user',
          content: `System Instructions: ${msg.content}`
        };
      }
      return msg;
    });
  }

  private calculateModelCost(model: string, usage: { prompt_tokens: number; completion_tokens: number }): number {
    const modelConfig = this.models[model as keyof typeof this.models];
    if (!modelConfig) return 0;

    const inputCost = (usage.prompt_tokens / 1000000) * modelConfig.inputCost;
    const outputCost = (usage.completion_tokens / 1000000) * modelConfig.outputCost;
    
    return inputCost + outputCost;
  }

  private mapFinishReason(reason: string | null): LLMResponse['finishReason'] {
    switch (reason) {
      case 'stop': return 'stop';
      case 'length': return 'length';
      case 'function_call':
      case 'tool_calls': return 'function_call';
      case 'content_filter': return 'content_filter';
      default: return 'stop';
    }
  }

  private estimateTokens(text: string): number {
    // Rough estimation: 4 characters per token
    return Math.ceil(text.length / 4);
  }
}

export default OpenAIProvider;