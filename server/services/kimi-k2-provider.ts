/**
 * Kimi K2 LLM Provider Integration
 * 12th LLM provider with agentic intelligence and 3D capabilities
 */

import OpenAI from 'openai';

export interface KimiK2Config {
  apiKey: string;
  baseURL?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  agenticFeatures?: boolean;
  multilingualMode?: boolean;
}

export interface KimiK2Request {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  tools?: Array<{
    type: 'function';
    function: {
      name: string;
      description: string;
      parameters: any;
    };
  }>;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface KimiK2Response {
  content: string;
  toolCalls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: number;
  responseTime: number;
  provider: 'kimi-k2';
}

class KimiK2Provider {
  private client: OpenAI;
  private config: KimiK2Config;
  
  constructor(config: KimiK2Config) {
    this.config = {
      baseURL: 'https://api.moonshot.ai/v1',
      model: 'kimi-k2-instruct',
      temperature: 0.6,
      agenticFeatures: true,
      multilingualMode: true,
      ...config
    };
    
    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseURL,
      dangerouslyAllowBrowser: true
    });
  }

  async generateResponse(request: KimiK2Request): Promise<KimiK2Response> {
    const startTime = Date.now();
    
    try {
      const completion = await this.client.chat.completions.create({
        model: this.config.model!,
        messages: request.messages,
        temperature: request.temperature || this.config.temperature,
        max_tokens: request.maxTokens || this.config.maxTokens,
        tools: request.tools,
        tool_choice: request.tools ? 'auto' : undefined,
        stream: false // Force non-streaming for type safety
      });

      const responseTime = Date.now() - startTime;
      
      // Type guard to ensure we have a non-stream response
      if ('usage' in completion && 'choices' in completion) {
        const usage = completion.usage!;
        
        // Calculate cost based on Kimi K2 pricing: $0.15 input, $2.50 output per 1M tokens
        const cost = (usage.prompt_tokens * 0.00000015) + (usage.completion_tokens * 0.0000025);

        return {
          content: completion.choices[0].message.content || '',
          toolCalls: completion.choices[0].message.tool_calls?.map((tc: any) => ({
            id: tc.id,
            type: tc.type as 'function',
            function: {
              name: tc.function.name,
              arguments: tc.function.arguments
            }
          })),
          usage: {
            promptTokens: usage.prompt_tokens,
            completionTokens: usage.completion_tokens,
            totalTokens: usage.total_tokens
          },
          cost,
          responseTime,
          provider: 'kimi-k2'
        };
      } else {
        throw new Error('Unexpected response format from OpenAI API');
      }
    } catch (error) {
      console.error('Kimi K2 API Error:', error);
      throw new Error(`Kimi K2 request failed: ${error}`);
    }
  }

  async generate3DCode(prompt: string, type: '3d-scene' | 'webxr' | 'game-logic' | 'spatial-ui'): Promise<KimiK2Response> {
    const systemPrompt = this.get3DSystemPrompt(type);
    
    return this.generateResponse({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7, // Slightly higher for creative 3D generation
      maxTokens: 4000
    });
  }

  async generateMultilingualContent(
    prompt: string, 
    targetLanguages: string[], 
    contentType: 'chat' | 'voice-script' | 'ui-text'
  ): Promise<KimiK2Response> {
    const multilingualPrompt = `
Generate content in the following languages: ${targetLanguages.join(', ')}

Content Type: ${contentType}
Request: ${prompt}

Please provide natural, culturally appropriate responses for each language.
For Indian languages (Hindi, Tamil, Telugu, Bengali), ensure proper cultural context.

Format your response as JSON:
{
  "responses": {
    "en": "English response",
    "hi": "Hindi response (Devanagari script)",
    "ta": "Tamil response (Tamil script)",
    "te": "Telugu response (Telugu script)",
    "bn": "Bengali response (Bengali script)"
  },
  "metadata": {
    "culturalNotes": "Any important cultural considerations",
    "pronunciation": "Phonetic guides if needed"
  }
}`;

    return this.generateResponse({
      messages: [
        { role: 'system', content: 'You are a multilingual AI assistant expert in global and Indian languages.' },
        { role: 'user', content: multilingualPrompt }
      ],
      temperature: 0.6
    });
  }

  async generateAgenticWorkflow(
    task: string, 
    tools: Array<{ name: string; description: string; parameters: any }>
  ): Promise<KimiK2Response> {
    return this.generateResponse({
      messages: [
        {
          role: 'system',
          content: `You are an agentic AI with autonomous execution capabilities. 
          Break down complex tasks into executable steps and use available tools effectively.
          Focus on practical implementation and provide detailed execution plans.`
        },
        { role: 'user', content: task }
      ],
      tools: tools.map(tool => ({
        type: 'function' as const,
        function: tool
      })),
      temperature: 0.6
    });
  }

  private get3DSystemPrompt(type: string): string {
    const prompts = {
      '3d-scene': `You are an expert 3D developer specializing in Three.js, WebGL, and immersive experiences.
      Create professional 3D scenes with proper lighting, materials, and interactive elements.
      Focus on performance optimization and responsive design.
      Include proper camera controls, lighting setups, and asset management.`,
      
      'webxr': `You are a WebXR specialist creating immersive AR/VR experiences.
      Generate code for WebXR APIs, spatial tracking, and immersive interfaces.
      Include proper controller handling, spatial audio, and cross-platform compatibility.
      Focus on accessibility and performance for various headsets and devices.`,
      
      'game-logic': `You are a game development expert creating interactive 3D experiences.
      Generate game mechanics, physics systems, and player interactions.
      Include proper state management, collision detection, and performance optimization.
      Focus on engaging gameplay and smooth user experiences.`,
      
      'spatial-ui': `You are a spatial UI/UX expert creating 3D user interfaces.
      Design intuitive 3D interactions, spatial navigation, and immersive controls.
      Include gesture recognition, voice commands, and accessibility features.
      Focus on natural interaction patterns and user comfort.`
    };
    
    return prompts[type as keyof typeof prompts] || prompts['3d-scene'];
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.generateResponse({
        messages: [{ role: 'user', content: 'Test connection - respond with OK' }],
        maxTokens: 10
      });
      return response.content.includes('OK') || response.content.length > 0;
    } catch (error) {
      console.error('Kimi K2 connection test failed:', error);
      return false;
    }
  }

  getProviderInfo() {
    return {
      name: 'Kimi K2',
      model: this.config.model,
      capabilities: [
        'Agentic Intelligence',
        'Tool Calling',
        'Multilingual Support',
        '3D Development',
        'WebXR/AR/VR',
        'Game Development',
        'Spatial Computing'
      ],
      pricing: {
        input: '$0.15 per 1M tokens',
        output: '$2.50 per 1M tokens',
        contextWindow: '128K tokens'
      },
      advantages: [
        '95% cost reduction vs GPT-4/Claude',
        '65.8% SWE-bench coding performance',
        '47.3% multilingual coding capability',
        'Native 3D/AR/VR development',
        'Open-source with MIT license'
      ]
    };
  }
}

export default KimiK2Provider;