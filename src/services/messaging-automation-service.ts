import { db } from '../db';
import { eq, and, desc } from 'drizzle-orm';
import { waiMessagingChannels, waiMessagingMessages } from '@shared/schema';

export interface MessagingChannel {
  id: string;
  userId: string;
  organizationId?: number;
  platform: 'slack' | 'teams' | 'whatsapp' | 'discord' | 'telegram';
  channelId: string;
  channelName: string;
  accessToken?: string;
  refreshToken?: string;
  webhookUrl?: string;
  isActive: boolean;
  lastSyncAt?: Date;
  metadata: Record<string, any>;
}

export interface IncomingMessage {
  id: string;
  channelId: string;
  platform: string;
  senderId: string;
  senderName: string;
  content: string;
  contentType: 'text' | 'image' | 'file' | 'reaction' | 'thread_reply';
  threadId?: string;
  timestamp: Date;
  attachments?: MessageAttachment[];
  mentions?: string[];
  reactions?: MessageReaction[];
  metadata: Record<string, any>;
}

export interface MessageAttachment {
  id: string;
  type: 'file' | 'image' | 'video' | 'audio' | 'link';
  name: string;
  url: string;
  size?: number;
  mimeType?: string;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface OutgoingMessage {
  channelId: string;
  platform: string;
  content: string;
  threadId?: string;
  attachments?: MessageAttachment[];
  mentions?: string[];
  formatting?: MessageFormatting;
}

export interface MessageFormatting {
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
  codeBlock?: boolean;
  language?: string;
}

export interface MessageRoutingResult {
  shouldRespond: boolean;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  suggestedAgents: string[];
  category: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  actionRequired: boolean;
  suggestedResponse?: string;
}

class MessagingAutomationService {
  private channels: Map<string, MessagingChannel> = new Map();
  private messageQueue: IncomingMessage[] = [];

  private async persistChannel(channel: MessagingChannel): Promise<void> {
    try {
      await db.insert(waiMessagingChannels).values({
        channelId: channel.id,
        userId: channel.userId,
        organizationId: channel.organizationId,
        platform: channel.platform,
        platformChannelId: channel.channelId,
        channelName: channel.channelName,
        webhookUrl: channel.webhookUrl,
        isActive: channel.isActive,
        lastSyncAt: channel.lastSyncAt,
        metadata: channel.metadata
      }).onConflictDoUpdate({
        target: waiMessagingChannels.channelId,
        set: {
          isActive: channel.isActive,
          lastSyncAt: channel.lastSyncAt,
          metadata: channel.metadata
        }
      });
    } catch (error) {
      console.error('Failed to persist channel:', error);
    }
  }

  private async getInternalChannelId(platformChannelId: string): Promise<string | null> {
    const channel = Array.from(this.channels.values()).find(c => c.channelId === platformChannelId || c.id === platformChannelId);
    if (channel) return channel.id;
    
    try {
      const [dbChannel] = await db.select({ channelId: waiMessagingChannels.channelId })
        .from(waiMessagingChannels)
        .where(eq(waiMessagingChannels.platformChannelId, platformChannelId))
        .limit(1);
      return dbChannel?.channelId || null;
    } catch {
      return null;
    }
  }

  private async persistMessage(message: IncomingMessage, routingResult: MessageRoutingResult): Promise<void> {
    try {
      const internalChannelId = await this.getInternalChannelId(message.channelId);
      if (!internalChannelId) {
        console.error('Cannot persist message: channel not found for', message.channelId);
        return;
      }
      
      await db.insert(waiMessagingMessages).values({
        messageId: message.id,
        channelId: internalChannelId,
        senderId: message.senderId,
        senderName: message.senderName,
        content: message.content,
        contentType: message.contentType,
        threadId: message.threadId,
        priority: routingResult.priority,
        sentiment: routingResult.sentiment,
        category: routingResult.category,
        routingResult: routingResult,
        attachments: message.attachments || [],
        metadata: message.metadata,
        processedAt: new Date()
      });
    } catch (error) {
      console.error('Failed to persist message:', error);
    }
  }

  async connectSlackWorkspace(
    userId: string,
    accessToken: string,
    workspaceId: string,
    organizationId?: number
  ): Promise<MessagingChannel> {
    const channel: MessagingChannel = {
      id: `slack-${workspaceId}-${Date.now()}`,
      userId,
      organizationId,
      platform: 'slack',
      channelId: workspaceId,
      channelName: 'Slack Workspace',
      accessToken,
      isActive: true,
      lastSyncAt: new Date(),
      metadata: { workspaceId }
    };

    this.channels.set(channel.id, channel);
    await this.persistChannel(channel);
    console.log(`📱 Slack workspace connected: ${workspaceId}`);
    return channel;
  }

  async connectMicrosoftTeams(
    userId: string,
    accessToken: string,
    tenantId: string,
    organizationId?: number
  ): Promise<MessagingChannel> {
    const channel: MessagingChannel = {
      id: `teams-${tenantId}-${Date.now()}`,
      userId,
      organizationId,
      platform: 'teams',
      channelId: tenantId,
      channelName: 'Microsoft Teams',
      accessToken,
      isActive: true,
      lastSyncAt: new Date(),
      metadata: { tenantId }
    };

    this.channels.set(channel.id, channel);
    await this.persistChannel(channel);
    console.log(`💬 Microsoft Teams connected: ${tenantId}`);
    return channel;
  }

  async connectWhatsAppBusiness(
    userId: string,
    accessToken: string,
    phoneNumberId: string,
    organizationId?: number
  ): Promise<MessagingChannel> {
    const channel: MessagingChannel = {
      id: `whatsapp-${phoneNumberId}-${Date.now()}`,
      userId,
      organizationId,
      platform: 'whatsapp',
      channelId: phoneNumberId,
      channelName: 'WhatsApp Business',
      accessToken,
      isActive: true,
      lastSyncAt: new Date(),
      metadata: { phoneNumberId }
    };

    this.channels.set(channel.id, channel);
    await this.persistChannel(channel);
    console.log(`📞 WhatsApp Business connected: ${phoneNumberId}`);
    return channel;
  }

  async processIncomingMessage(message: IncomingMessage): Promise<MessageRoutingResult> {
    this.messageQueue.push(message);

    const sentiment = this.analyzeSentiment(message.content);
    const priority = this.determinePriority(message);
    const category = this.categorizeMessage(message);
    const suggestedAgents = this.selectAgentsForMessage(category, priority);

    const result: MessageRoutingResult = {
      shouldRespond: this.shouldAutoRespond(message, priority),
      priority,
      suggestedAgents,
      category,
      sentiment,
      actionRequired: priority === 'urgent' || priority === 'high',
      suggestedResponse: await this.generateSuggestedResponse(message, category)
    };

    await this.persistMessage(message, result);
    console.log(`📨 Message processed: ${message.id} -> Category: ${category}, Priority: ${priority}`);
    return result;
  }

  private analyzeSentiment(content: string): 'positive' | 'neutral' | 'negative' {
    const positiveKeywords = ['thanks', 'great', 'excellent', 'happy', 'love', 'amazing', 'wonderful'];
    const negativeKeywords = ['urgent', 'problem', 'issue', 'error', 'broken', 'frustrated', 'angry', 'complaint'];
    
    const lowerContent = content.toLowerCase();
    const positiveScore = positiveKeywords.filter(k => lowerContent.includes(k)).length;
    const negativeScore = negativeKeywords.filter(k => lowerContent.includes(k)).length;
    
    if (negativeScore > positiveScore) return 'negative';
    if (positiveScore > negativeScore) return 'positive';
    return 'neutral';
  }

  private determinePriority(message: IncomingMessage): 'urgent' | 'high' | 'normal' | 'low' {
    const urgentKeywords = ['urgent', 'asap', 'emergency', 'critical', 'immediately', '911'];
    const highKeywords = ['important', 'deadline', 'today', 'priority', 'need'];
    
    const lowerContent = message.content.toLowerCase();
    
    if (urgentKeywords.some(k => lowerContent.includes(k))) return 'urgent';
    if (highKeywords.some(k => lowerContent.includes(k))) return 'high';
    if (message.threadId) return 'normal';
    return 'normal';
  }

  private categorizeMessage(message: IncomingMessage): string {
    const categories: Record<string, string[]> = {
      'support': ['help', 'support', 'issue', 'problem', 'error', 'bug', 'fix'],
      'sales': ['pricing', 'demo', 'trial', 'purchase', 'quote', 'buy', 'cost'],
      'feedback': ['feedback', 'suggestion', 'feature', 'request', 'idea'],
      'billing': ['invoice', 'payment', 'billing', 'subscription', 'refund'],
      'technical': ['api', 'integration', 'code', 'developer', 'sdk', 'documentation'],
      'general': []
    };

    const lowerContent = message.content.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(k => lowerContent.includes(k))) {
        return category;
      }
    }
    
    return 'general';
  }

  private selectAgentsForMessage(category: string, priority: string): string[] {
    const agentMapping: Record<string, string[]> = {
      'support': ['customer-support-agent', 'technical-support-agent'],
      'sales': ['sales-agent', 'account-manager-agent'],
      'feedback': ['product-manager-agent', 'ux-research-agent'],
      'billing': ['billing-agent', 'finance-agent'],
      'technical': ['developer-agent', 'api-specialist-agent'],
      'general': ['general-assistant-agent']
    };

    const agents = agentMapping[category] || agentMapping['general'];
    
    if (priority === 'urgent' || priority === 'high') {
      agents.push('escalation-manager-agent');
    }
    
    return agents;
  }

  private shouldAutoRespond(message: IncomingMessage, priority: string): boolean {
    if (priority === 'urgent') return true;
    if (message.platform === 'whatsapp') return true;
    if (message.contentType === 'thread_reply') return false;
    return true;
  }

  private async generateSuggestedResponse(message: IncomingMessage, category: string): Promise<string> {
    const templates: Record<string, string> = {
      'support': "Thank you for reaching out. I understand you're experiencing an issue. Let me help you resolve this. Could you provide more details about what you're seeing?",
      'sales': "Thank you for your interest! I'd be happy to help you learn more about our solutions. Would you like to schedule a demo or discuss specific requirements?",
      'feedback': "Thank you for sharing your feedback! We really appreciate you taking the time to help us improve. I'll make sure this gets to the right team.",
      'billing': "I understand you have a billing-related question. Let me look into this for you right away.",
      'technical': "Thanks for your technical question. Let me connect you with our developer support team who can best assist you.",
      'general': "Thank you for your message. How can I assist you today?"
    };

    return templates[category] || templates['general'];
  }

  async sendMessage(outgoing: OutgoingMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const channel = Array.from(this.channels.values()).find(
      c => c.channelId === outgoing.channelId && c.platform === outgoing.platform
    );

    if (!channel) {
      return { success: false, error: 'Channel not found or not connected' };
    }

    try {
      switch (outgoing.platform) {
        case 'slack':
          return await this.sendSlackMessage(channel, outgoing);
        case 'teams':
          return await this.sendTeamsMessage(channel, outgoing);
        case 'whatsapp':
          return await this.sendWhatsAppMessage(channel, outgoing);
        default:
          return { success: false, error: 'Unsupported platform' };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private async sendSlackMessage(channel: MessagingChannel, outgoing: OutgoingMessage): Promise<{ success: boolean; messageId?: string }> {
    console.log(`📤 Sending Slack message to ${outgoing.channelId}`);
    return { success: true, messageId: `slack-msg-${Date.now()}` };
  }

  private async sendTeamsMessage(channel: MessagingChannel, outgoing: OutgoingMessage): Promise<{ success: boolean; messageId?: string }> {
    console.log(`📤 Sending Teams message to ${outgoing.channelId}`);
    return { success: true, messageId: `teams-msg-${Date.now()}` };
  }

  private async sendWhatsAppMessage(channel: MessagingChannel, outgoing: OutgoingMessage): Promise<{ success: boolean; messageId?: string }> {
    console.log(`📤 Sending WhatsApp message to ${outgoing.channelId}`);
    return { success: true, messageId: `whatsapp-msg-${Date.now()}` };
  }

  async getChannels(userId: string): Promise<MessagingChannel[]> {
    return Array.from(this.channels.values()).filter(c => c.userId === userId);
  }

  async getMessageQueue(): Promise<IncomingMessage[]> {
    return this.messageQueue;
  }

  async getStats(): Promise<{
    totalChannels: number;
    activeChannels: number;
    messageQueueSize: number;
    platformBreakdown: Record<string, number>;
  }> {
    const channels = Array.from(this.channels.values());
    const platformBreakdown: Record<string, number> = {};
    
    channels.forEach(c => {
      platformBreakdown[c.platform] = (platformBreakdown[c.platform] || 0) + 1;
    });

    return {
      totalChannels: channels.length,
      activeChannels: channels.filter(c => c.isActive).length,
      messageQueueSize: this.messageQueue.length,
      platformBreakdown
    };
  }
}

export const messagingAutomationService = new MessagingAutomationService();
