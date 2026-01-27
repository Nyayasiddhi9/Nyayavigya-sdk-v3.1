/**
 * Google Provider - Real API Integration
 * 
 * Implements comprehensive Google Gemini integration with:
 * - Gemini Pro, Gemini Ultra, Gemini Flash model support
 * - Advanced multimodal capabilities (text, image, video, audio)
 * - Function calling and tool use
 * - Real-time streaming responses
 * - Code generation and execution
 * - Advanced cost optimization
 * - Circuit breaker protection
 */

import { GoogleGenerativeAI, GenerateContentRequest, GenerationConfig } from '@google/generative-ai';
import { UnifiedLLMAdapter, type LLMProvider, type LLMRequest, type LLMResponse } from './unified-llm-adapter';
import { generateCorrelationId, createTimeoutController } from '../orchestration-utils';
import { ProviderError } from '../orchestration-errors';

export class GoogleProvider extends UnifiedLLMAdapter {
  private client: GoogleGenerativeAI;
  private readonly models = {
    // Gemini 2.0 Series (Latest)
    'gemini-2.0-flash-exp': { inputCost: 0.075, outputCost: 0.3, contextWindow: 1000000, maxOutput: 8192 },
    'gemini-2.0-flash-thinking-exp': { inputCost: 0.075, outputCost: 0.3, contextWindow: 32768, maxOutput: 8192 },
    
    // Gemini 1.5 Series
    'gemini-1.5-pro-latest': { inputCost: 1.25, outputCost: 5, contextWindow: 2000000, maxOutput: 8192 },
    'gemini-1.5-pro': { inputCost: 1.25, outputCost: 5, contextWindow: 2000000, maxOutput: 8192 },
    'gemini-1.5-pro-exp-0827': { inputCost: 1.25, outputCost: 5, contextWindow: 2000000, maxOutput: 8192 },
    'gemini-1.5-flash-latest': { inputCost: 0.075, outputCost: 0.3, contextWindow: 1000000, maxOutput: 8192 },
    'gemini-1.5-flash': { inputCost: 0.075, outputCost: 0.3, contextWindow: 1000000, maxOutput: 8192 },
    'gemini-1.5-flash-8b-latest': { inputCost: 0.0375, outputCost: 0.15, contextWindow: 1000000, maxOutput: 8192 },
    'gemini-1.5-flash-8b': { inputCost: 0.0375, outputCost: 0.15, contextWindow: 1000000, maxOutput: 8192 },
    
    // Gemini 1.0 Series
    'gemini-1.0-pro-latest': { inputCost: 0.5, outputCost: 1.5, contextWindow: 32768, maxOutput: 8192 },
    'gemini-1.0-pro': { inputCost: 0.5, outputCost: 1.5, contextWindow: 32768, maxOutput: 8192 },
    'gemini-1.0-pro-vision-latest': { inputCost: 0.5, outputCost: 1.5, contextWindow: 16384, maxOutput: 2048 },
    
    // Specialized Models
    'text-embedding-004': { inputCost: 0.000025, outputCost: 0, contextWindow: 2048, maxOutput: 0 },
    'text-embedding-preview-0409': { inputCost: 0.000025, outputCost: 0, contextWindow: 2048, maxOutput: 0 },
    'aqa': { inputCost: 0.5, outputCost: 1.5, contextWindow: 7500, maxOutput: 1024 }
  };

  constructor(apiKey?: string) {
    const provider: LLMProvider = {
      id: 'google',
      name: 'Google Gemini',
      models: Object.keys(GoogleProvider.prototype.models),
      capabilities: {
        textGeneration: true,
        codeGeneration: true,
        imageGeneration: false, // Google Imagen is separate
        audioGeneration: false,
        speechToText: false,
        textToSpeech: false,
        multimodal: true, // Excellent multimodal capabilities
        functionCalling: true,
        streaming: true,
        embedding: true,
        reasoning: 93,
        creativity: 88,
        factualAccuracy: 95,
        codingProficiency: 90,
        multilingualSupport: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi', 'bn', 'ta', 'te']
      },
      pricing: {
        inputTokenCost: 1.25, // Gemini 1.5 Pro base price per 1M tokens
        outputTokenCost: 5, // Gemini 1.5 Pro base price per 1M tokens
        embeddingCost: 0.025, // text-embedding-004 per 1M tokens
        currency: 'USD',
        billingModel: 'pay-per-use',
        freeTierLimits: {
          tokensPerMonth: 2000000, // 2M tokens per month free
          requestsPerMinute: 60,
          requestsPerDay: 1500
        }
      },
      limits: {
        maxTokensPerRequest: 2000000,
        maxRequestsPerMinute: 60,
        maxRequestsPerDay: 1500,
        maxConcurrentRequests: 10,
        contextWindow: 2000000,
        timeoutMs: 120000
      },
      status: 'available',
      region: ['global'],
      apiVersion: 'v1',
      lastHealthCheck: new Date(),
      healthScore: 100
    };

    const key = apiKey || process.env.GOOGLE_API_KEY;
    if (!key) {
      throw new Error('Google API key is required');
    }

    super(provider, key);
    
    this.client = new GoogleGenerativeAI(key);

    console.log('✅ Google Provider initialized with real API integration');
  }

  protected getDefaultBaseUrl(): string {
    return 'https://generativelanguage.googleapis.com';
  }

  protected async validateApiKey(): Promise<boolean> {
    try {
      const model = this.client.getGenerativeModel({ model: 'gemini-1.5-flash' });
      await model.generateContent('Test');
      return true;
    } catch (error) {
      console.error('Google API key validation failed:', error);
      return false;
    }
  }

  async generateResponse(request: LLMRequest): Promise<LLMResponse> {
    const correlationId = request.correlationId || generateCorrelationId();
    const startTime = Date.now();
    
    try {
      console.log(`🔄 [${correlationId}] Google generating response with model: ${request.model || 'gemini-1.5-flash'}`);
      
      // Check rate limiting
      if (!(await this.checkRateLimit())) {
        throw new ProviderError('Rate limit exceeded', 'google', { correlationId });
      }

      // Select optimal model if not specified
      const model = request.model || this.selectOptimalModel(request);
      const modelConfig = this.models[model as keyof typeof this.models];
      
      if (!modelConfig) {
        throw new ProviderError(`Unsupported model: ${model}`, 'google', { correlationId, model });
      }

      // Get model instance
      const geminiModel = this.client.getGenerativeModel({ 
        model,
        generationConfig: this.buildGenerationConfig(request, modelConfig)
      });

      // Format the request
      const contents = this.formatContents(request);
      
      // Handle function/tool declarations
      const tools = request.tools ? this.formatTools(request.tools) : undefined;

      // Create timeout controller
      const timeoutController = createTimeoutController(this.provider.limits.timeoutMs);

      // Generate response
      const generateRequest: GenerateContentRequest = {
        contents,
        tools: tools ? [{ functionDeclarations: tools }] : undefined,
        systemInstruction: request.systemPrompt ? {
          role: 'user',
          parts: [{ text: request.systemPrompt }]
        } : undefined
      };

      const result = await geminiModel.generateContent(generateRequest);
      const response = result.response;

      const responseTime = Date.now() - startTime;
      
      // Extract usage information
      const usage = response.usageMetadata;
      const promptTokens = usage?.promptTokenCount || 0;
      const completionTokens = usage?.candidatesTokenCount || 0;
      const totalTokens = usage?.totalTokenCount || (promptTokens + completionTokens);
      
      // Calculate cost
      const cost = this.calculateModelCost(model, { promptTokens, completionTokens });

      // Extract content and function calls
      const content = this.extractContent(response);
      const functionCalls = this.extractFunctionCalls(response);

      const llmResponse: LLMResponse = {
        id: generateCorrelationId(), // Google doesn't provide response ID
        content,
        model,
        provider: 'google',
        usage: {
          promptTokens,
          completionTokens,
          totalTokens
        },
        cost,
        responseTime,
        finishReason: this.mapFinishReason(response.candidates?.[0]?.finishReason),
        functionCalls,
        correlationId,
        timestamp: new Date(),
        metadata: {
          model,
          google_model_version: (response as any).modelVersion || 'unknown',
          finish_reason: response.candidates?.[0]?.finishReason,
          safety_ratings: response.candidates?.[0]?.safetyRatings
        }
      };

      // Track cost
      this.trackCost(llmResponse);

      console.log(`✅ [${correlationId}] Google response generated: ${llmResponse.usage.totalTokens} tokens, $${cost.toFixed(6)} cost, ${responseTime}ms`);
      this.emit('response-generated', llmResponse);

      return llmResponse;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`❌ [${correlationId}] Google request failed after ${responseTime}ms:`, error);
      
      if (error instanceof Error) {
        throw new ProviderError(
          `Google request failed: ${error.message}`,
          'google',
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
      console.log(`🔄 [${correlationId}] Google streaming response with model: ${request.model || 'gemini-1.5-flash'}`);
      
      const model = request.model || this.selectOptimalModel(request);
      const modelConfig = this.models[model as keyof typeof this.models];

      const geminiModel = this.client.getGenerativeModel({ 
        model,
        generationConfig: this.buildGenerationConfig(request, modelConfig)
      });

      const contents = this.formatContents(request);
      const tools = request.tools ? this.formatTools(request.tools) : undefined;

      const generateRequest: GenerateContentRequest = {
        contents,
        tools: tools ? [{ functionDeclarations: tools }] : undefined,
        systemInstruction: request.systemPrompt ? {
          role: 'user',
          parts: [{ text: request.systemPrompt }]
        } : undefined
      };

      const result = await geminiModel.generateContentStream(generateRequest);

      let fullContent = '';
      let totalTokens = 0;

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullContent += chunkText;
        totalTokens += this.estimateTokens(chunkText);

        const partialResponse: Partial<LLMResponse> = {
          content: fullContent,
          model,
          provider: 'google',
          usage: {
            promptTokens: 0, // Will be calculated at the end
            completionTokens: totalTokens,
            totalTokens: totalTokens
          },
          responseTime: Date.now() - startTime,
          correlationId,
          timestamp: new Date()
        };

        yield partialResponse;
      }

      console.log(`✅ [${correlationId}] Google streaming completed: ${totalTokens} tokens`);

    } catch (error) {
      console.error(`❌ [${correlationId}] Google streaming failed:`, error);
      throw new ProviderError(
        `Google streaming failed: ${error}`,
        'google',
        { correlationId }
      );
    }
  }

  async generateEmbeddings(texts: string[], model = 'text-embedding-004'): Promise<number[][]> {
    const correlationId = generateCorrelationId();
    const startTime = Date.now();
    
    try {
      console.log(`🔄 [${correlationId}] Google generating embeddings for ${texts.length} texts`);
      
      const embeddingModel = this.client.getGenerativeModel({ model });
      const embeddings: number[][] = [];

      // Process texts in batches (Google has batch limits)
      const batchSize = 100;
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        
        for (const text of batch) {
          const result = await embeddingModel.embedContent(text);
          embeddings.push(result.embedding.values);
        }
      }

      const responseTime = Date.now() - startTime;
      const totalTokens = texts.reduce((sum, text) => sum + this.estimateTokens(text), 0);
      const cost = (totalTokens / 1000000) * (this.models[model as keyof typeof this.models]?.inputCost || 0.025);

      console.log(`✅ [${correlationId}] Google embeddings generated: ${totalTokens} tokens, $${cost.toFixed(6)} cost, ${responseTime}ms`);

      return embeddings;

    } catch (error) {
      console.error(`❌ [${correlationId}] Google embeddings failed:`, error);
      throw new ProviderError(
        `Google embeddings failed: ${error}`,
        'google',
        { correlationId }
      );
    }
  }

  async generateImage(prompt: string, options?: any): Promise<{ url: string; cost: number }> {
    // Google Imagen is a separate service, not part of Gemini
    throw new ProviderError(
      'Google Gemini does not provide image generation. Use Google Imagen API separately or other providers for image generation.',
      'google',
      { capability: 'image_generation' }
    );
  }

  async generateAudio(text: string, options?: any): Promise<{ url: string; cost: number }> {
    // Google doesn't provide TTS through Gemini
    throw new ProviderError(
      'Google Gemini does not provide audio generation. Use Google Text-to-Speech API separately or other providers for audio generation.',
      'google',
      { capability: 'audio_generation' }
    );
  }

  async transcribeAudio(audioUrl: string): Promise<{ text: string; cost: number }> {
    // Google doesn't provide STT through Gemini
    throw new ProviderError(
      'Google Gemini does not provide speech-to-text. Use Google Speech-to-Text API separately or other providers for audio transcription.',
      'google',
      { capability: 'speech_to_text' }
    );
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
    if (hasImages || hasTools) return 'gemini-1.5-pro'; // Best for multimodal and function calling
    if (messageLength > 500000) return 'gemini-1.5-pro'; // Large context
    if (messageLength > 100000) return 'gemini-1.5-flash'; // Medium context
    if (messageLength > 20000) return 'gemini-1.5-flash-8b'; // Cost-effective for medium tasks
    
    return 'gemini-2.0-flash-exp'; // Latest and fastest for simple requests
  }

  private buildGenerationConfig(request: LLMRequest, modelConfig: any): GenerationConfig {
    return {
      temperature: request.temperature ?? 0.7,
      topP: request.topP,
      maxOutputTokens: request.maxTokens || modelConfig.maxOutput,
      stopSequences: request.stopSequences
    };
  }

  private formatContents(request: LLMRequest): any[] {
    return request.messages.map(msg => {
      if (msg.role === 'system') {
        // System messages should be handled separately in systemInstruction
        return null;
      }

      return {
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: this.formatParts(msg.content)
      };
    }).filter(Boolean);
  }

  private formatParts(content: string | any[]): any[] {
    if (typeof content === 'string') {
      return [{ text: content }];
    }

    // Handle multimodal content
    return content.map(item => {
      if (item.type === 'text') {
        return { text: item.text };
      } else if (item.type === 'image') {
        return {
          inlineData: {
            mimeType: 'image/jpeg',
            data: item.imageUrl?.split(',')[1] || item.imageUrl
          }
        };
      }
      return item;
    });
  }

  private formatTools(tools: any[]): any[] {
    return tools.map(tool => ({
      name: tool.function.name,
      description: tool.function.description,
      parameters: tool.function.parameters
    }));
  }

  private extractContent(response: any): string {
    const candidate = response.candidates?.[0];
    if (!candidate?.content?.parts) {
      return '';
    }

    return candidate.content.parts
      .filter((part: any) => part.text)
      .map((part: any) => part.text)
      .join('');
  }

  private extractFunctionCalls(response: any): Array<{ name: string; arguments: any }> | undefined {
    const candidate = response.candidates?.[0];
    if (!candidate?.content?.parts) {
      return undefined;
    }

    const functionCalls = candidate.content.parts
      .filter((part: any) => part.functionCall)
      .map((part: any) => ({
        name: part.functionCall.name,
        arguments: part.functionCall.args
      }));

    return functionCalls.length > 0 ? functionCalls : undefined;
  }

  private calculateModelCost(model: string, usage: { promptTokens: number; completionTokens: number }): number {
    const modelConfig = this.models[model as keyof typeof this.models];
    if (!modelConfig) return 0;

    const inputCost = (usage.promptTokens / 1000000) * modelConfig.inputCost;
    const outputCost = (usage.completionTokens / 1000000) * modelConfig.outputCost;
    
    return inputCost + outputCost;
  }

  private mapFinishReason(reason: string | undefined): LLMResponse['finishReason'] {
    switch (reason) {
      case 'STOP': return 'stop';
      case 'MAX_TOKENS': return 'length';
      case 'SAFETY': return 'content_filter';
      case 'RECITATION': return 'content_filter';
      default: return 'stop';
    }
  }

  private estimateTokens(text: string): number {
    // Rough estimation: 4 characters per token
    return Math.ceil(text.length / 4);
  }
}

export default GoogleProvider;