/**
 * Chat Session Manager
 * Manages chat sessions with persistence and history
 */

import { EventEmitter } from 'events';
import { ChatMessage, ChatConfig } from './chat-service';

export interface SessionState {
  id: string;
  config: ChatConfig;
  messages: ChatMessage[];
  context: Record<string, unknown>;
  createdAt: Date;
  lastActivityAt: Date;
  status: 'active' | 'idle' | 'completed';
}

export interface SessionSummary {
  totalMessages: number;
  userMessages: number;
  assistantMessages: number;
  tokensUsed: number;
  duration: number;
  agentsUsed: string[];
}

export class ChatSessionManager extends EventEmitter {
  private static instance: ChatSessionManager;
  private sessions: Map<string, SessionState> = new Map();
  private sessionHistory: Map<string, SessionState[]> = new Map();

  private constructor() {
    super();
    console.log('📋 ChatSessionManager initialized');
  }

  public static getInstance(): ChatSessionManager {
    if (!ChatSessionManager.instance) {
      ChatSessionManager.instance = new ChatSessionManager();
    }
    return ChatSessionManager.instance;
  }

  public async createSession(config: ChatConfig): Promise<SessionState> {
    const id = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const session: SessionState = {
      id,
      config: {
        language: 'en',
        workflowMode: false,
        voiceEnabled: false,
        promptStyle: 'detailed',
        ...config
      },
      messages: [],
      context: {},
      createdAt: new Date(),
      lastActivityAt: new Date(),
      status: 'active'
    };

    this.sessions.set(id, session);
    this.emit('session-created', session);
    
    return session;
  }

  public async getSession(id: string): Promise<SessionState | null> {
    return this.sessions.get(id) || null;
  }

  public async getAllSessions(): Promise<SessionState[]> {
    return Array.from(this.sessions.values());
  }

  public async getActiveSessions(): Promise<SessionState[]> {
    return Array.from(this.sessions.values()).filter(s => s.status === 'active');
  }

  public async addMessage(sessionId: string, message: ChatMessage): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.messages.push(message);
    session.lastActivityAt = new Date();
    
    this.emit('message-added', { sessionId, message });
    
    return true;
  }

  public async updateContext(sessionId: string, context: Record<string, unknown>): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.context = { ...session.context, ...context };
    session.lastActivityAt = new Date();
    
    return true;
  }

  public async completeSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.status = 'completed';
    
    const history = this.sessionHistory.get(sessionId) || [];
    history.push({ ...session });
    this.sessionHistory.set(sessionId, history);
    
    this.emit('session-completed', sessionId);
    
    return true;
  }

  public async getSessionSummary(sessionId: string): Promise<SessionSummary | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const agentsUsed = new Set<string>();
    let tokensUsed = 0;

    for (const message of session.messages) {
      if (message.agentId) {
        agentsUsed.add(message.agentId);
      }
      tokensUsed += Math.floor(message.content.length / 4);
    }

    return {
      totalMessages: session.messages.length,
      userMessages: session.messages.filter(m => m.role === 'user').length,
      assistantMessages: session.messages.filter(m => m.role === 'assistant').length,
      tokensUsed,
      duration: Date.now() - session.createdAt.getTime(),
      agentsUsed: Array.from(agentsUsed)
    };
  }

  public async exportSession(sessionId: string): Promise<string | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    return JSON.stringify({
      ...session,
      exportedAt: new Date()
    }, null, 2);
  }

  public async importSession(json: string): Promise<SessionState | null> {
    try {
      const data = JSON.parse(json);
      const newId = `session-${Date.now()}-imported`;
      
      const session: SessionState = {
        id: newId,
        config: data.config,
        messages: data.messages || [],
        context: data.context || {},
        createdAt: new Date(data.createdAt) || new Date(),
        lastActivityAt: new Date(),
        status: 'active'
      };

      this.sessions.set(newId, session);
      this.emit('session-imported', session);
      
      return session;
    } catch (error) {
      console.error('Failed to import session:', error);
      return null;
    }
  }

  public async deleteSession(sessionId: string): Promise<boolean> {
    const deleted = this.sessions.delete(sessionId);
    if (deleted) {
      this.emit('session-deleted', sessionId);
    }
    return deleted;
  }

  public getStats(): {
    totalSessions: number;
    activeSessions: number;
    completedSessions: number;
    totalMessages: number;
  } {
    const sessions = Array.from(this.sessions.values());
    
    return {
      totalSessions: sessions.length,
      activeSessions: sessions.filter(s => s.status === 'active').length,
      completedSessions: sessions.filter(s => s.status === 'completed').length,
      totalMessages: sessions.reduce((sum, s) => sum + s.messages.length, 0)
    };
  }
}

export const chatSessionManager = ChatSessionManager.getInstance();
export default ChatSessionManager;
