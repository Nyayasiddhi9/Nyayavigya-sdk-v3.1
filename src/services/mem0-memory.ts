/**
 * Mem0 Context Management - Advanced memory and context handling
 * Provides persistent memory and context management for AI agents
 */
import { v4 as uuidv4 } from 'uuid';

export interface MemoryEntry {
  id: string;
  content: string;
  type: 'conversation' | 'fact' | 'preference' | 'context' | 'skill' | 'workflow';
  userId?: string;
  projectId?: string;
  agentId?: string;
  timestamp: Date;
  metadata: any;
  embedding?: number[];
  relevanceScore?: number;
}

export interface ContextWindow {
  id: string;
  memories: MemoryEntry[];
  maxSize: number;
  currentSize: number;
  lastAccessed: Date;
}

export interface SearchQuery {
  query: string;
  userId?: string;
  projectId?: string;
  agentId?: string;
  type?: string;
  limit?: number;
  threshold?: number;
}

export class Mem0Memory {
  private memories: Map<string, MemoryEntry> = new Map();
  private contextWindows: Map<string, ContextWindow> = new Map();
  private embeddings: Map<string, number[]> = new Map();
  private userProfiles: Map<string, any> = new Map();
  private projectContexts: Map<string, any> = new Map();
  private agentKnowledge: Map<string, any> = new Map();

  constructor() {
    console.log('Mem0 Memory system initialized');
  }

  /**
   * Add memory entry with automatic context management
   */
  async addMemory(content: string, type: MemoryEntry['type'], metadata: any = {}): Promise<string> {
    const id = uuidv4();
    const embedding = await this.generateEmbedding(content);
    
    const memory: MemoryEntry = {
      id,
      content,
      type,
      userId: metadata.userId,
      projectId: metadata.projectId,
      agentId: metadata.agentId,
      timestamp: new Date(),
      metadata,
      embedding,
      relevanceScore: 1.0
    };

    this.memories.set(id, memory);
    this.embeddings.set(id, embedding);

    // Update relevant contexts
    await this.updateContexts(memory);
    
    console.log(`Memory added: ${type} - ${content.substring(0, 50)}...`);
    return id;
  }

  /**
   * Search memories with semantic similarity
   */
  async searchMemories(query: SearchQuery): Promise<MemoryEntry[]> {
    const queryEmbedding = await this.generateEmbedding(query.query);
    const results: (MemoryEntry & { similarity: number })[] = [];

    for (const [id, memory] of this.memories) {
      // Filter by criteria
      if (query.userId && memory.userId !== query.userId) continue;
      if (query.projectId && memory.projectId !== query.projectId) continue;
      if (query.agentId && memory.agentId !== query.agentId) continue;
      if (query.type && memory.type !== query.type) continue;

      // Calculate similarity
      const similarity = this.calculateSimilarity(queryEmbedding, memory.embedding || []);
      
      // Use nullish coalescing to allow threshold: 0 (fixes reconciliation)
      if (similarity >= (query.threshold ?? 0.7)) {
        results.push({ ...memory, similarity });
      }
    }

    // Sort by similarity and limit results
    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, query.limit || 10);
  }

  /**
   * Get relevant context for a conversation
   */
  async getRelevantContext(userId: string, projectId?: string, agentId?: string, query?: string): Promise<MemoryEntry[]> {
    const searchQuery: SearchQuery = {
      query: query || 'relevant context',
      userId,
      projectId,
      agentId,
      limit: 20,
      threshold: 0.6
    };

    const memories = await this.searchMemories(searchQuery);
    
    // Add recent conversation history
    const recentMemories = Array.from(this.memories.values())
      .filter(m => m.userId === userId && m.type === 'conversation')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5);

    return [...memories, ...recentMemories];
  }

  /**
   * Create or update context window
   */
  async createContextWindow(id: string, maxSize: number = 50): Promise<ContextWindow> {
    const contextWindow: ContextWindow = {
      id,
      memories: [],
      maxSize,
      currentSize: 0,
      lastAccessed: new Date()
    };

    this.contextWindows.set(id, contextWindow);
    return contextWindow;
  }

  /**
   * Add memory to context window
   */
  async addToContextWindow(windowId: string, memoryId: string): Promise<void> {
    const window = this.contextWindows.get(windowId);
    const memory = this.memories.get(memoryId);

    if (!window || !memory) {
      throw new Error('Context window or memory not found');
    }

    // Remove oldest memories if at capacity
    while (window.memories.length >= window.maxSize) {
      window.memories.shift();
      window.currentSize--;
    }

    window.memories.push(memory);
    window.currentSize++;
    window.lastAccessed = new Date();
  }

  /**
   * Delete a specific memory by ID
   */
  async deleteMemory(memoryId: string): Promise<boolean> {
    try {
      this.memories.delete(memoryId);
      this.embeddings.delete(memoryId);
      
      // Remove from any context windows
      for (const [windowId, window] of this.contextWindows) {
        window.memories = window.memories.filter(m => m.id !== memoryId);
        window.currentSize = window.memories.length;
      }
      
      return true;
    } catch (error) {
      console.error(`Failed to delete memory ${memoryId}:`, error);
      return false;
    }
  }

  /**
   * Update user profile based on interactions
   */
  async updateUserProfile(userId: string, interaction: any): Promise<void> {
    let profile = this.userProfiles.get(userId) || {
      id: userId,
      preferences: {},
      skills: [],
      interests: [],
      workStyle: {},
      history: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Extract preferences and patterns
    if (interaction.type === 'preference') {
      profile.preferences[interaction.key] = interaction.value;
    } else if (interaction.type === 'skill') {
      if (!profile.skills.includes(interaction.skill)) {
        profile.skills.push(interaction.skill);
      }
    } else if (interaction.type === 'interest') {
      if (!profile.interests.includes(interaction.interest)) {
        profile.interests.push(interaction.interest);
      }
    }

    profile.history.push({
      timestamp: new Date(),
      interaction
    });

    profile.updatedAt = new Date();
    this.userProfiles.set(userId, profile);

    // Store as memory
    await this.addMemory(
      `User preference: ${JSON.stringify(interaction)}`,
      'preference',
      { userId, type: 'user_profile' }
    );
  }

  /**
   * Update project context
   */
  async updateProjectContext(projectId: string, context: any): Promise<void> {
    let projectContext = this.projectContexts.get(projectId) || {
      id: projectId,
      requirements: {},
      architecture: {},
      technologies: [],
      decisions: [],
      progress: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Merge new context
    projectContext = { ...projectContext, ...context };
    projectContext.updatedAt = new Date();
    
    this.projectContexts.set(projectId, projectContext);

    // Store as memory
    await this.addMemory(
      `Project context update: ${JSON.stringify(context)}`,
      'context',
      { projectId, type: 'project_context' }
    );
  }

  /**
   * Update agent knowledge base
   */
  async updateAgentKnowledge(agentId: string, knowledge: any): Promise<void> {
    let agentKnowledgeBase = this.agentKnowledge.get(agentId) || {
      id: agentId,
      capabilities: [],
      learned: [],
      patterns: {},
      performance: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add new knowledge
    if (knowledge.capability && !agentKnowledgeBase.capabilities.includes(knowledge.capability)) {
      agentKnowledgeBase.capabilities.push(knowledge.capability);
    }

    if (knowledge.learned) {
      agentKnowledgeBase.learned.push({
        timestamp: new Date(),
        knowledge: knowledge.learned
      });
    }

    if (knowledge.pattern) {
      agentKnowledgeBase.patterns[knowledge.pattern.name] = knowledge.pattern.data;
    }

    agentKnowledgeBase.updatedAt = new Date();
    this.agentKnowledge.set(agentId, agentKnowledgeBase);

    // Store as memory
    await this.addMemory(
      `Agent knowledge: ${JSON.stringify(knowledge)}`,
      'skill',
      { agentId, type: 'agent_knowledge' }
    );
  }

  /**
   * Get personalized recommendations
   */
  async getPersonalizedRecommendations(userId: string, context?: any): Promise<any[]> {
    const userProfile = this.userProfiles.get(userId);
    const userMemories = await this.searchMemories({
      query: 'preferences recommendations',
      userId,
      type: 'preference',
      limit: 20
    });

    const recommendations = [];

    if (userProfile) {
      // Based on user preferences
      for (const [key, value] of Object.entries(userProfile.preferences)) {
        recommendations.push({
          type: 'preference',
          suggestion: `Consider ${key}: ${value}`,
          confidence: 0.8
        });
      }

      // Based on user skills
      userProfile.skills.forEach(skill => {
        recommendations.push({
          type: 'skill_enhancement',
          suggestion: `Enhance ${skill} capabilities`,
          confidence: 0.7
        });
      });
    }

    // Based on memory patterns
    userMemories.forEach(memory => {
      recommendations.push({
        type: 'memory_based',
        suggestion: `Based on previous interaction: ${memory.content.substring(0, 100)}...`,
        confidence: memory.relevanceScore || 0.6
      });
    });

    return recommendations.slice(0, 10);
  }

  /**
   * Export context for external use
   */
  async exportContext(userId?: string, projectId?: string, agentId?: string): Promise<any> {
    const context = {
      memories: [],
      userProfile: null,
      projectContext: null,
      agentKnowledge: null,
      timestamp: new Date()
    };

    // Export relevant memories
    const searchQuery: SearchQuery = {
      query: 'export context',
      userId,
      projectId,
      agentId,
      limit: 100
    };
    
    context.memories = await this.searchMemories(searchQuery);

    // Export user profile
    if (userId) {
      context.userProfile = this.userProfiles.get(userId);
    }

    // Export project context
    if (projectId) {
      context.projectContext = this.projectContexts.get(projectId);
    }

    // Export agent knowledge
    if (agentId) {
      context.agentKnowledge = this.agentKnowledge.get(agentId);
    }

    return context;
  }

  /**
   * Import context from external source
   */
  async importContext(contextData: any): Promise<void> {
    if (contextData.memories) {
      for (const memory of contextData.memories) {
        this.memories.set(memory.id, memory);
        if (memory.embedding) {
          this.embeddings.set(memory.id, memory.embedding);
        }
      }
    }

    if (contextData.userProfile) {
      this.userProfiles.set(contextData.userProfile.id, contextData.userProfile);
    }

    if (contextData.projectContext) {
      this.projectContexts.set(contextData.projectContext.id, contextData.projectContext);
    }

    if (contextData.agentKnowledge) {
      this.agentKnowledge.set(contextData.agentKnowledge.id, contextData.agentKnowledge);
    }
  }

  /**
   * Clear old memories to manage storage
   */
  async cleanupMemories(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<number> {
    const cutoffDate = new Date(Date.now() - maxAge);
    let deletedCount = 0;

    for (const [id, memory] of this.memories) {
      if (memory.timestamp < cutoffDate && memory.type === 'conversation') {
        this.memories.delete(id);
        this.embeddings.delete(id);
        deletedCount++;
      }
    }

    console.log(`Cleaned up ${deletedCount} old memories`);
    return deletedCount;
  }

  // Private utility methods
  private async updateContexts(memory: MemoryEntry): Promise<void> {
    // Update user profile context
    if (memory.userId) {
      const profile = this.userProfiles.get(memory.userId);
      if (profile) {
        profile.updatedAt = new Date();
      }
    }

    // Update project context
    if (memory.projectId) {
      const context = this.projectContexts.get(memory.projectId);
      if (context) {
        context.updatedAt = new Date();
      }
    }

    // Update agent knowledge
    if (memory.agentId) {
      const knowledge = this.agentKnowledge.get(memory.agentId);
      if (knowledge) {
        knowledge.updatedAt = new Date();
      }
    }
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    // Simple embedding generation (in production, use OpenAI embeddings or similar)
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(384).fill(0);
    
    for (let i = 0; i < words.length && i < embedding.length; i++) {
      const word = words[i];
      let hash = 0;
      for (let j = 0; j < word.length; j++) {
        hash = ((hash << 5) - hash) + word.charCodeAt(j);
        hash = hash & hash; // Convert to 32-bit integer
      }
      embedding[i % embedding.length] += Math.sin(hash) * 0.1;
    }
    
    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / (magnitude || 1));
  }

  private calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) return 0;
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Get memory statistics
   */
  getMemoryStats(): any {
    const totalMemories = this.memories.size;
    const memoryTypes = {};
    const userCounts = {};
    const projectCounts = {};

    for (const memory of this.memories.values()) {
      memoryTypes[memory.type] = (memoryTypes[memory.type] || 0) + 1;
      if (memory.userId) {
        userCounts[memory.userId] = (userCounts[memory.userId] || 0) + 1;
      }
      if (memory.projectId) {
        projectCounts[memory.projectId] = (projectCounts[memory.projectId] || 0) + 1;
      }
    }

    return {
      totalMemories,
      memoryTypes,
      userCounts,
      projectCounts,
      contextWindows: this.contextWindows.size,
      userProfiles: this.userProfiles.size,
      projectContexts: this.projectContexts.size,
      agentKnowledge: this.agentKnowledge.size
    };
  }
}

export const mem0Memory = new Mem0Memory();