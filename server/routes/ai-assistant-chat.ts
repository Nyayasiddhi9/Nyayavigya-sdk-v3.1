/**
 * AI Assistant Chat API Routes
 * Handles real AI assistant conversations with proper LLM integration
 */

import { Router } from 'express';
import { waiOrchestrator } from '../services/unified-orchestration-client';
import { z } from 'zod';

const router = Router();

// Chat request validation schema
const chatRequestSchema = z.object({
  assistantId: z.string().min(1),
  message: z.string().min(1),
  config: z.object({
    basic: z.object({
      name: z.string(),
      description: z.string().optional(),
      category: z.string().optional()
    }),
    ai: z.object({
      model: z.string().optional(),
      provider: z.string().optional(),
      temperature: z.number().optional(),
      maxTokens: z.number().optional()
    }).optional(),
    behavior: z.object({
      personality: z.string().optional(),
      responseStyle: z.string().optional(),
      creativity: z.number().optional()
    }).optional(),
    capabilities: z.object({
      textGeneration: z.boolean().optional(),
      imageAnalysis: z.boolean().optional(),
      voiceInteraction: z.boolean().optional(),
      codeGeneration: z.boolean().optional(),
      webSearch: z.boolean().optional()
    }).optional()
  }),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    message: z.string(),
    timestamp: z.union([z.date(), z.string()]).optional()
  })).optional()
});

/**
 * Chat with AI Assistant
 */
router.post('/chat', async (req, res) => {
  try {
    const chatData = chatRequestSchema.parse(req.body);
    const { assistantId, message, config, conversationHistory = [] } = chatData;

    // Build system prompt based on assistant configuration
    const systemPrompt = buildSystemPrompt(config);
    
    // Build conversation context
    const conversationContext = conversationHistory.map(msg => 
      `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.message}`
    ).join('\n');

    // Create enhanced WAI request
    const waiRequest = {
      id: `chat_${assistantId}_${Date.now()}`,
      type: 'analysis' as const,
      operation: 'ai_assistant_chat',
      content: `${systemPrompt}\n\nConversation History:\n${conversationContext}\n\nHuman: ${message}\n\nAssistant:`,
      projectId: 1, // Default project for assistant chat
      priority: 'medium' as const,
      userId: 1,
      metadata: {
        assistantId,
        assistantName: config.basic.name,
        model: config.ai?.model || 'claude-sonnet-4',
        provider: config.ai?.provider || 'anthropic',
        personality: config.behavior?.personality || 'professional',
        capabilities: config.capabilities || {}
      }
    };

    // Process through enhanced WAI orchestration
    const response = await waiOrchestrator.processRequest(waiRequest);

    if (response.success && response.content) {
      res.json({
        success: true,
        response: response.content,
        metadata: {
          model: response.metadata?.model || 'claude-sonnet-4',
          provider: response.metadata?.provider || 'anthropic',
          processingTime: response.metadata?.processingTime || 0,
          tokens: response.metadata?.tokens || 0
        }
      });
    } else {
      throw new Error(response.error || 'Failed to generate response');
    }

  } catch (error) {
    console.error('Error in AI assistant chat:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request format',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to process chat message'
    });
  }
});

/**
 * Build system prompt based on assistant configuration
 */
function buildSystemPrompt(config: any): string {
  const { basic, behavior, capabilities } = config;
  
  let prompt = `You are ${basic.name}, an AI assistant.`;
  
  if (basic.description) {
    prompt += ` ${basic.description}`;
  }
  
  // Add personality traits
  if (behavior?.personality) {
    const personalityMap = {
      professional: 'You are professional, clear, and focused on providing accurate information.',
      friendly: 'You are warm, approachable, and conversational in your responses.',
      creative: 'You are imaginative, innovative, and enjoy exploring creative solutions.',
      analytical: 'You are logical, data-driven, and systematic in your approach.'
    };
    const validPersonality = behavior.personality as keyof typeof personalityMap;
    prompt += ` ${personalityMap[validPersonality] || personalityMap.professional}`;
  }
  
  // Add response style
  if (behavior?.responseStyle) {
    const styleMap = {
      concise: 'Keep your responses brief and to the point.',
      detailed: 'Provide comprehensive, detailed explanations.',
      conversational: 'Use a natural, conversational tone.'
    } as const;
    const validStyle = behavior.responseStyle as keyof typeof styleMap;
    prompt += ` ${styleMap[validStyle] || styleMap.detailed}`;
  }
  
  // Add capabilities
  if (capabilities) {
    const enabledCapabilities = Object.entries(capabilities)
      .filter(([_, enabled]) => enabled)
      .map(([capability, _]) => capability);
    
    if (enabledCapabilities.length > 0) {
      const capabilityDescriptions: Record<string, string> = {
        textGeneration: 'text generation and writing',
        imageAnalysis: 'image analysis and description',
        voiceInteraction: 'voice interaction',
        codeGeneration: 'code generation and programming assistance',
        webSearch: 'web search and research',
        realTimeData: 'real-time data access'
      };
      
      const capabilities_list = enabledCapabilities
        .map(cap => capabilityDescriptions[cap] || cap)
        .join(', ');
      
      prompt += ` You have capabilities in: ${capabilities_list}.`;
    }
  }
  
  prompt += ' Always be helpful, accurate, and stay in character. Respond naturally as if you are having a conversation.';
  
  return prompt;
}

export default router;