/**
 * Universal Chat Service
 * Central testing system for all WAI SDK agents and features
 */

import { EventEmitter } from 'events';

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  agentId?: string;
  attachments?: ChatAttachment[];
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export interface ChatAttachment {
  id: string;
  type: 'image' | 'pdf' | 'document' | 'audio' | 'video';
  name: string;
  mimeType: string;
  size: number;
  url?: string;
  data?: string;
}

export interface ChatConfig {
  agentId?: string;
  agentGroup?: string;
  language: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  workflowMode?: boolean;
  voiceEnabled?: boolean;
  promptStyle?: 'detailed' | 'concise' | 'technical' | 'creative' | 'step-by-step';
}

export interface ChatResponse {
  messageId: string;
  content: string;
  agentId: string;
  tokensUsed: number;
  latency: number;
  metadata?: Record<string, unknown>;
}

export const AGENT_GROUPS = [
  { id: 'auto', name: 'Auto-Select', description: 'Automatically select best agent', count: 267 },
  { id: 'development', name: 'Development', description: 'Software development agents', count: 160 },
  { id: 'creative', name: 'Creative', description: 'Content and design agents', count: 17 },
  { id: 'research', name: 'Research', description: 'Research and analysis agents', count: 38 },
  { id: 'executive', name: 'Executive', description: 'Leadership and strategy agents', count: 34 },
  { id: 'qa', name: 'QA', description: 'Quality assurance agents', count: 7 },
  { id: 'devops', name: 'DevOps', description: 'Infrastructure and operations agents', count: 11 },
  { id: 'content', name: 'Content', description: 'Content creation agents', count: 10 },
  { id: 'social', name: 'Social', description: 'Social media agents', count: 5 }
] as const;

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'it', name: 'Italian' },
  { code: 'ru', name: 'Russian' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'bn', name: 'Bengali' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'mr', name: 'Marathi' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'kn', name: 'Kannada' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'or', name: 'Odia' },
  { code: 'as', name: 'Assamese' },
  { code: 'ne', name: 'Nepali' }
] as const;

export class UniversalChatService extends EventEmitter {
  private static instance: UniversalChatService;
  private sessions: Map<string, { config: ChatConfig; messages: ChatMessage[] }> = new Map();

  private constructor() {
    super();
    console.log('💬 UniversalChatService initialized');
  }

  public static getInstance(): UniversalChatService {
    if (!UniversalChatService.instance) {
      UniversalChatService.instance = new UniversalChatService();
    }
    return UniversalChatService.instance;
  }

  public async createSession(config: ChatConfig): Promise<string> {
    const sessionId = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    this.sessions.set(sessionId, {
      config: {
        language: 'en',
        workflowMode: false,
        voiceEnabled: false,
        promptStyle: 'detailed',
        ...config
      },
      messages: []
    });

    this.emit('session-created', sessionId);
    
    return sessionId;
  }

  public async sendMessage(
    sessionId: string, 
    content: string, 
    attachments?: ChatAttachment[]
  ): Promise<ChatResponse> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      role: 'user',
      content,
      attachments,
      timestamp: new Date()
    };

    session.messages.push(userMessage);
    this.emit('message-sent', userMessage);

    const startTime = Date.now();
    
    const selectedAgent = session.config.agentId || 'fullstack-developer';
    
    const responseContent = await this.generateResponse(session.config, session.messages);
    
    const assistantMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      role: 'assistant',
      content: responseContent,
      agentId: selectedAgent,
      timestamp: new Date()
    };

    session.messages.push(assistantMessage);

    const response: ChatResponse = {
      messageId: assistantMessage.id,
      content: responseContent,
      agentId: selectedAgent,
      tokensUsed: Math.floor(responseContent.length / 4),
      latency: Date.now() - startTime
    };

    this.emit('message-received', response);
    
    return response;
  }

  private async generateResponse(config: ChatConfig, messages: ChatMessage[]): Promise<string> {
    const lastMessage = messages[messages.length - 1];
    
    return `I received your message: "${lastMessage.content.substring(0, 100)}..." ` +
           `Processing with ${config.agentId || 'auto-selected'} agent in ${config.language} language. ` +
           `Workflow mode: ${config.workflowMode ? 'enabled' : 'disabled'}.`;
  }

  public async streamMessage(
    sessionId: string,
    content: string,
    onChunk: (chunk: string) => void
  ): Promise<ChatResponse> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      role: 'user',
      content,
      timestamp: new Date()
    };

    session.messages.push(userMessage);

    const startTime = Date.now();
    const responseContent = await this.generateResponse(session.config, session.messages);
    
    const words = responseContent.split(' ');
    for (const word of words) {
      onChunk(word + ' ');
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    const assistantMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      role: 'assistant',
      content: responseContent,
      timestamp: new Date()
    };

    session.messages.push(assistantMessage);

    return {
      messageId: assistantMessage.id,
      content: responseContent,
      agentId: session.config.agentId || 'auto',
      tokensUsed: Math.floor(responseContent.length / 4),
      latency: Date.now() - startTime
    };
  }

  public async enhancePrompt(prompt: string, style: ChatConfig['promptStyle']): Promise<string> {
    const enhancements: Record<string, string> = {
      detailed: `Please provide a comprehensive and detailed response to: ${prompt}`,
      concise: `Briefly: ${prompt}`,
      technical: `From a technical perspective: ${prompt}`,
      creative: `Be creative and innovative in answering: ${prompt}`,
      'step-by-step': `Please provide step-by-step instructions for: ${prompt}`
    };

    return enhancements[style || 'detailed'] || prompt;
  }

  public async getSession(sessionId: string): Promise<{ config: ChatConfig; messages: ChatMessage[] } | null> {
    return this.sessions.get(sessionId) || null;
  }

  public async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    const session = this.sessions.get(sessionId);
    return session?.messages || [];
  }

  public async updateSessionConfig(sessionId: string, config: Partial<ChatConfig>): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.config = { ...session.config, ...config };
    this.emit('session-config-updated', { sessionId, config: session.config });
    
    return true;
  }

  public async deleteSession(sessionId: string): Promise<boolean> {
    const deleted = this.sessions.delete(sessionId);
    if (deleted) {
      this.emit('session-deleted', sessionId);
    }
    return deleted;
  }

  public async clearSessionMessages(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.messages = [];
    this.emit('session-cleared', sessionId);
    
    return true;
  }

  public getAgentGroups(): typeof AGENT_GROUPS {
    return AGENT_GROUPS;
  }

  public getSupportedLanguages(): typeof SUPPORTED_LANGUAGES {
    return SUPPORTED_LANGUAGES;
  }

  public getStats(): {
    totalSessions: number;
    totalMessages: number;
    activeAgents: string[];
  } {
    let totalMessages = 0;
    const activeAgents = new Set<string>();

    for (const session of this.sessions.values()) {
      totalMessages += session.messages.length;
      if (session.config.agentId) {
        activeAgents.add(session.config.agentId);
      }
    }

    return {
      totalSessions: this.sessions.size,
      totalMessages,
      activeAgents: Array.from(activeAgents)
    };
  }
}

export const universalChatService = UniversalChatService.getInstance();
export default UniversalChatService;
