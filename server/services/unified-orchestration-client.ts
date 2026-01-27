/**
 * Unified Orchestration Client
 * Provides a simple interface for making AI requests through WAI SDK
 * Returns structured JSON responses for IntelligentCodeAssistant
 */

import { realLLMService } from './real-llm-service.js';

export interface OrchestrationRequest {
  id: string;
  type: string;
  prompt: string;
  projectId?: string;
  metadata?: Record<string, any>;
}

export interface OrchestrationResponse {
  success: boolean;
  data?: string;
  content?: string;
  error?: string;
}

class UnifiedOrchestrationClient {
  async processRequest(request: OrchestrationRequest): Promise<OrchestrationResponse> {
    try {
      let systemPrompt = '';
      
      if (request.type === 'code_completion') {
        systemPrompt = `You are an expert code completion assistant. 
Always respond with ONLY a valid JSON array of completion suggestions.
Each suggestion must have: { "text": "the_completion", "description": "brief description", "confidence": 0.0-1.0 }
Example response: [{"text": "function", "description": "Declare a function", "confidence": 0.95}]
Do not include any explanatory text, just the JSON array.`;
      } else if (request.type === 'code_analysis') {
        systemPrompt = `You are an expert code analysis assistant.
Always respond with ONLY a valid JSON object containing analysis results.
Include: { "suggestions": [], "errors": [], "warnings": [], "metrics": {...}, "refactoringSuggestions": [] }`;
      } else if (request.type === 'code_generation') {
        systemPrompt = `You are an expert code generation assistant.
Generate clean, well-documented code following best practices.`;
      }

      const response = await realLLMService.generateResponse(
        request.prompt,
        'kimi-k2',
        {
          temperature: 0.3,
          max_tokens: 2000,
          systemPrompt,
        }
      );

      let content = response.content || '';
      
      if (request.type === 'code_completion') {
        content = this.extractJsonArray(content);
      } else if (request.type === 'code_analysis') {
        content = this.extractJsonObject(content);
      }

      return {
        success: true,
        data: content,
        content: content,
      };
    } catch (error: any) {
      console.error('Orchestration request failed:', error);
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  private extractJsonArray(content: string): string {
    try {
      const match = content.match(/\[[\s\S]*\]/);
      if (match) {
        JSON.parse(match[0]);
        return match[0];
      }
    } catch {}
    return '[]';
  }

  private extractJsonObject(content: string): string {
    try {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        JSON.parse(match[0]);
        return match[0];
      }
    } catch {}
    return '{}';
  }
}

export const waiOrchestrator = new UnifiedOrchestrationClient();
export default waiOrchestrator;
