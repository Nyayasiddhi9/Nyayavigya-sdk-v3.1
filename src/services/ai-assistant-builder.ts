/**
 * AI Assistant Builder Service
 * Creates embeddable AI assistants with RAG, OCR, and custom agent properties
 */

import { storage } from '../storage';
import { waiComprehensiveOrchestrationBackbone as waiOrchestrator } from './wai-comprehensive-orchestration-backbone-v7';
import { mem0Memory } from './mem0-memory';
import { claudeMCP } from './claude-mcp';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface AssistantConfiguration {
  id: string;
  name: string;
  description: string;
  personality: {
    tone: 'professional' | 'friendly' | 'casual' | 'formal' | 'technical';
    expertise: string[];
    responseStyle: 'concise' | 'detailed' | 'conversational' | 'instructional';
    behaviorTraits: string[];
  };
  knowledgeBase: {
    documents: UploadedDocument[];
    ragEnabled: boolean;
    maxContextTokens: number;
    searchThreshold: number;
  };
  capabilities: {
    ocr: boolean;
    imageAnalysis: boolean;
    codeGeneration: boolean;
    webSearch: boolean;
    apiIntegrations: string[];
  };
  appearance: {
    avatar: string;
    primaryColor: string;
    theme: 'light' | 'dark' | 'auto';
    position: 'bottom-right' | 'bottom-left' | 'center' | 'custom';
    size: 'small' | 'medium' | 'large';
  };
  deployment: {
    embedCode: string;
    apiEndpoint: string;
    webhookUrl?: string;
    allowedDomains: string[];
    customCSS?: string;
  };
  settings: {
    isActive: boolean;
    isPublic: boolean;
    maxConversationLength: number;
    rateLimiting: {
      requestsPerMinute: number;
      requestsPerDay: number;
    };
  };
}

export interface UploadedDocument {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'txt' | 'image' | 'webpage' | 'api_doc';
  content: string;
  vectorized: boolean;
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface AssistantConversation {
  id: string;
  assistantId: string;
  sessionId: string;
  messages: ConversationMessage[];
  context: Record<string, any>;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: MessageAttachment[];
  metadata: Record<string, any>;
  timestamp: Date;
}

export interface MessageAttachment {
  type: 'image' | 'document' | 'code' | 'link';
  url: string;
  name: string;
  analysis?: Record<string, any>;
}

export class AIAssistantBuilder {
  private assistants: Map<string, AssistantConfiguration> = new Map();
  private conversations: Map<string, AssistantConversation> = new Map();
  private uploadsDir: string;

  constructor() {
    this.uploadsDir = path.join(process.cwd(), 'uploads', 'assistants');
    this.ensureUploadsDirectory();
  }

  private async ensureUploadsDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.uploadsDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create assistants uploads directory:', error);
    }
  }

  /**
   * Create a new AI assistant with configuration
   */
  async createAssistant(
    userId: number,
    projectId: number,
    config: Partial<AssistantConfiguration>
  ): Promise<AssistantConfiguration> {
    const assistantId = `assistant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const defaultConfig: AssistantConfiguration = {
      id: assistantId,
      name: config.name || 'AI Assistant',
      description: config.description || 'An intelligent AI assistant powered by WAI DevStudio',
      personality: {
        tone: 'professional',
        expertise: ['general'],
        responseStyle: 'conversational',
        behaviorTraits: ['helpful', 'accurate', 'responsive'],
        ...config.personality
      },
      knowledgeBase: {
        documents: [],
        ragEnabled: true,
        maxContextTokens: 4000,
        searchThreshold: 0.7,
        ...config.knowledgeBase
      },
      capabilities: {
        ocr: true,
        imageAnalysis: true,
        codeGeneration: false,
        webSearch: false,
        apiIntegrations: [],
        ...config.capabilities
      },
      appearance: {
        avatar: '/assets/default-assistant-avatar.png',
        primaryColor: '#3B82F6',
        theme: 'auto',
        position: 'bottom-right',
        size: 'medium',
        ...config.appearance
      },
      deployment: {
        embedCode: this.generateEmbedCode(assistantId),
        apiEndpoint: `/api/assistants/${assistantId}/chat`,
        allowedDomains: ['*'],
        ...config.deployment
      },
      settings: {
        isActive: true,
        isPublic: false,
        maxConversationLength: 50,
        rateLimiting: {
          requestsPerMinute: 20,
          requestsPerDay: 1000
        },
        ...config.settings
      }
    };

    // Store assistant configuration
    this.assistants.set(assistantId, defaultConfig);

    // Create knowledge base if documents provided
    if (config.knowledgeBase?.documents?.length) {
      await this.processKnowledgeBase(assistantId, config.knowledgeBase.documents);
    }

    // Store in database for persistence
    await this.saveAssistantToDatabase(userId, projectId, defaultConfig);

    return defaultConfig;
  }

  /**
   * Process and vectorize documents for the knowledge base
   */
  async processKnowledgeBase(
    assistantId: string,
    documents: UploadedDocument[]
  ): Promise<void> {
    const assistant = this.assistants.get(assistantId);
    if (!assistant) throw new Error('Assistant not found');

    for (const doc of documents) {
      try {
        // Extract text content based on document type
        let textContent = doc.content;
        
        if (doc.type === 'pdf' || doc.type === 'image') {
          // Use OCR if enabled
          if (assistant.capabilities.ocr) {
            textContent = await this.extractTextWithOCR(doc);
          }
        }

        // Process with Claude MCP for enhanced understanding
        const enhancedContent = await claudeMCP.executeEngineeringTask(
          `knowledge_${assistantId}_${doc.id}`,
          'Process and understand knowledge document',
          {
            document: doc,
            content: textContent,
            assistantContext: assistant.personality
          }
        );

        // Vectorize and store in memory system
        await mem0Memory.addMemory(
          `Knowledge: ${doc.name}`,
          'context', // Using 'context' as valid type
          {
            assistantId,
            documentId: doc.id,
            content: enhancedContent.response || enhancedContent,
            metadata: {
              ...doc.metadata
            }
          }
        );

        // Mark as vectorized
        doc.vectorized = true;
        doc.content = enhancedContent.response || textContent;

      } catch (error) {
        console.error(`Failed to process document ${doc.id}:`, error);
      }
    }

    // Update assistant knowledge base
    assistant.knowledgeBase.documents = documents;
    this.assistants.set(assistantId, assistant);
  }

  /**
   * Extract text from images and PDFs using OCR
   */
  private async extractTextWithOCR(document: UploadedDocument): Promise<string> {
    try {
      // Use Claude MCP for OCR processing
      const ocrResult = await claudeMCP.executeEngineeringTask(
        `ocr_${document.id}`,
        'Extract text from document using OCR',
        {
          documentType: document.type,
          documentPath: document.metadata?.path || document.content,
          language: 'auto'
        }
      );

      return ocrResult.response || document.content;
    } catch (error) {
      console.error('OCR extraction failed:', error);
      return document.content;
    }
  }

  /**
   * Handle chat conversation with assistant
   */
  async processAssistantChat(
    assistantId: string,
    sessionId: string,
    userMessage: string,
    attachments?: MessageAttachment[],
    context?: Record<string, any>
  ): Promise<ConversationMessage> {
    const assistant = this.assistants.get(assistantId);
    if (!assistant) throw new Error('Assistant not found');

    // Get or create conversation
    let conversation = this.conversations.get(sessionId);
    if (!conversation) {
      conversation = {
        id: sessionId,
        assistantId,
        sessionId,
        messages: [],
        context: context || {},
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.conversations.set(sessionId, conversation);
    }

    // Add user message to conversation
    const userMsg: ConversationMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content: userMessage,
      attachments,
      metadata: {},
      timestamp: new Date()
    };
    conversation.messages.push(userMsg);

    // Process attachments if present
    let processedAttachments: any[] = [];
    if (attachments?.length) {
      processedAttachments = await this.processMessageAttachments(assistantId, attachments);
    }

    // Retrieve relevant knowledge from RAG
    let relevantKnowledge = '';
    if (assistant.knowledgeBase.ragEnabled) {
      relevantKnowledge = await this.retrieveRelevantKnowledge(assistantId, userMessage, context);
    }

    // Build assistant prompt with personality and context
    const assistantPrompt = this.buildAssistantPrompt(
      assistant,
      conversation,
      userMessage,
      relevantKnowledge,
      processedAttachments
    );

    // Generate response using WAI orchestration
    const response = await waiOrchestrator.processRequest({
      id: `assistant_chat_${assistantId}_${Date.now()}`,
      type: 'analysis',
      operation: 'assistant_conversation',
      content: assistantPrompt,
      projectId: 1, // Default project for assistants
      priority: 'high',
      userId: 1 // System user for assistants
    });

    // Create assistant response message
    const assistantMsg: ConversationMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'assistant',
      content: response.result || 'I apologize, but I encountered an issue processing your request.',
      metadata: {
        componentsUsed: response.componentsUsed,
        cost: response.performanceMetrics?.cost,
        processingTime: response.executionTime
      },
      timestamp: new Date()
    };

    // Add to conversation
    conversation.messages.push(assistantMsg);
    conversation.updatedAt = new Date();

    // Trim conversation if too long
    if (conversation.messages.length > assistant.settings.maxConversationLength) {
      conversation.messages = conversation.messages.slice(-assistant.settings.maxConversationLength);
    }

    // Update conversation
    this.conversations.set(sessionId, conversation);

    // Store conversation update in memory
    await mem0Memory.addMemory(
      `Assistant conversation update`,
      'conversation', // Valid memory type
      {
        assistantId,
        sessionId,
        lastMessage: assistantMsg,
        context: conversation.context
      }
    );

    return assistantMsg;
  }

  /**
   * Process message attachments (images, documents, etc.)
   */
  private async processMessageAttachments(
    assistantId: string,
    attachments: MessageAttachment[]
  ): Promise<any[]> {
    const processedAttachments = [];

    for (const attachment of attachments) {
      try {
        let analysis: any = {};

        if (attachment.type === 'image') {
          // Analyze image content
          analysis = await claudeMCP.executeEngineeringTask(
            `image_analysis_${Date.now()}`,
            'Analyze image content and extract insights',
            {
              imageUrl: attachment.url,
              assistantId
            }
          );
        } else if (attachment.type === 'document') {
          // Process document content
          analysis = await claudeMCP.executeEngineeringTask(
            `document_analysis_${Date.now()}`,
            'Analyze document content and extract key information',
            {
              documentUrl: attachment.url,
              assistantId
            }
          );
        }

        processedAttachments.push({
          ...attachment,
          analysis
        });

      } catch (error) {
        console.error(`Failed to process attachment ${attachment.name}:`, error);
        processedAttachments.push(attachment);
      }
    }

    return processedAttachments;
  }

  /**
   * Retrieve relevant knowledge from RAG system
   */
  private async retrieveRelevantKnowledge(
    assistantId: string,
    query: string,
    context?: Record<string, any>
  ): Promise<string> {
    try {
      const relevantMemories = await mem0Memory.getRelevantContext(
        assistantId, // Using assistantId as userId string
        undefined,  // projectId
        undefined,  // agentId
        query      // query string
      );

      return relevantMemories.map(memory => memory.content).join('\n\n');
    } catch (error) {
      console.error('Failed to retrieve knowledge:', error);
      return '';
    }
  }

  /**
   * Build complete assistant prompt with personality and context
   */
  private buildAssistantPrompt(
    assistant: AssistantConfiguration,
    conversation: AssistantConversation,
    userMessage: string,
    knowledge: string,
    attachments: any[]
  ): string {
    const { personality, capabilities } = assistant;
    
    const recentMessages = conversation.messages.slice(-10)
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    return `You are "${assistant.name}", an AI assistant with the following characteristics:

PERSONALITY:
- Tone: ${personality.tone}
- Expertise: ${personality.expertise.join(', ')}
- Response Style: ${personality.responseStyle}
- Behavior Traits: ${personality.behaviorTraits.join(', ')}

DESCRIPTION: ${assistant.description}

CAPABILITIES:
${capabilities.ocr ? '- OCR and document text extraction' : ''}
${capabilities.imageAnalysis ? '- Image analysis and description' : ''}
${capabilities.codeGeneration ? '- Code generation and programming assistance' : ''}
${capabilities.webSearch ? '- Web search and real-time information' : ''}

KNOWLEDGE BASE:
${knowledge ? `Relevant information from knowledge base:\n${knowledge}\n` : ''}

CONVERSATION HISTORY:
${recentMessages}

${attachments.length > 0 ? `ATTACHMENTS: ${JSON.stringify(attachments, null, 2)}` : ''}

USER MESSAGE: ${userMessage}

Respond as ${assistant.name} with your defined personality and expertise. Be helpful, accurate, and maintain consistency with your character. If you cannot answer something, explain why and suggest alternatives.`;
  }

  /**
   * Generate embed code for assistant
   */
  private generateEmbedCode(assistantId: string): string {
    return `
<!-- WAI DevStudio AI Assistant -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://wai-devstudio.com/embed/assistant.js';
    script.setAttribute('data-assistant-id', '${assistantId}');
    script.setAttribute('data-api-endpoint', '/api/assistants/${assistantId}/chat');
    document.head.appendChild(script);
  })();
</script>
<noscript>
  <div>Please enable JavaScript to use the AI Assistant.</div>
</noscript>`;
  }

  /**
   * Save assistant configuration to database
   */
  private async saveAssistantToDatabase(
    userId: number,
    projectId: number,
    config: AssistantConfiguration
  ): Promise<void> {
    try {
      // Store in projects table as assistant configuration
      await storage.updateProject(projectId, {
        aiContext: {
          ...config,
          type: 'ai_assistant',
          createdBy: userId,
          createdAt: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to save assistant to database:', error);
    }
  }

  /**
   * Get assistant configuration
   */
  getAssistant(assistantId: string): AssistantConfiguration | undefined {
    return this.assistants.get(assistantId);
  }

  /**
   * Update assistant configuration
   */
  async updateAssistant(
    assistantId: string,
    updates: Partial<AssistantConfiguration>
  ): Promise<AssistantConfiguration | null> {
    const assistant = this.assistants.get(assistantId);
    if (!assistant) return null;

    const updatedAssistant = { ...assistant, ...updates };
    this.assistants.set(assistantId, updatedAssistant);

    return updatedAssistant;
  }

  /**
   * Delete assistant
   */
  async deleteAssistant(assistantId: string): Promise<boolean> {
    try {
      // Remove from memory
      this.assistants.delete(assistantId);
      
      // Clean up conversations
      for (const [sessionId, conversation] of this.conversations) {
        if (conversation.assistantId === assistantId) {
          this.conversations.delete(sessionId);
        }
      }

      // Clean up knowledge base (using searchMemories to find and delete memories)
      const memoriesToDelete = await mem0Memory.searchMemories({
        query: '',
        agentId: assistantId,
        type: 'context',
        limit: 1000
      });
      
      // Delete memories individually
      for (const memory of memoriesToDelete) {
        await mem0Memory.deleteMemory(memory.id);
      }

      return true;
    } catch (error) {
      console.error('Failed to delete assistant:', error);
      return false;
    }
  }

  /**
   * Get all assistants for a project
   */
  getProjectAssistants(projectId: number): AssistantConfiguration[] {
    // This would typically query the database
    return Array.from(this.assistants.values());
  }

  /**
   * Get conversation history
   */
  getConversation(sessionId: string): AssistantConversation | undefined {
    return this.conversations.get(sessionId);
  }

  /**
   * Export assistant configuration for deployment
   */
  exportAssistantConfig(assistantId: string): any {
    const assistant = this.assistants.get(assistantId);
    if (!assistant) return null;

    return {
      id: assistant.id,
      name: assistant.name,
      description: assistant.description,
      embedCode: assistant.deployment.embedCode,
      apiEndpoint: assistant.deployment.apiEndpoint,
      appearance: assistant.appearance,
      capabilities: assistant.capabilities,
      settings: assistant.settings
    };
  }
}

export const aiAssistantBuilder = new AIAssistantBuilder();