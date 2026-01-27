import { db } from '../db';
import { eq, and, desc, sql } from 'drizzle-orm';
import { waiVoiceAgents, waiVoiceCalls } from '@shared/schema';

export interface VoiceAgent {
  id: string;
  userId?: string;
  organizationId?: number;
  name: string;
  description?: string;
  voiceProvider: 'elevenlabs' | 'sarvam' | 'azure' | 'google';
  voiceId?: string;
  voiceSettings: VoiceSettings;
  language: string;
  supportedLanguages: string[];
  personality: AgentPersonality;
  systemPrompt?: string;
  greeting?: string;
  fallbackMessage?: string;
  maxCallDuration: number;
  silenceTimeout: number;
  isActive: boolean;
  phoneNumbers: string[];
  sipEndpoints: string[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface VoiceSettings {
  stability: number;
  similarityBoost: number;
  style: number;
  useSpeakerBoost: boolean;
  speed: number;
  pitch: number;
}

export interface AgentPersonality {
  tone: 'professional' | 'friendly' | 'casual' | 'formal' | 'empathetic';
  patience: number;
  verbosity: 'concise' | 'moderate' | 'detailed';
  interruptHandling: 'allow' | 'discourage' | 'prevent';
  confirmationStyle: 'explicit' | 'implicit' | 'minimal';
}

export interface VoiceCall {
  id: string;
  agentId: string;
  direction: 'inbound' | 'outbound';
  status: 'initiated' | 'ringing' | 'answered' | 'completed' | 'failed' | 'no_answer';
  callerNumber?: string;
  calledNumber?: string;
  startedAt?: Date;
  answeredAt?: Date;
  endedAt?: Date;
  duration?: number;
  recordingUrl?: string;
  transcript?: string;
  summary?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  intentDetected?: string;
  entities: ExtractedEntity[];
  agentActions: AgentAction[];
  handoffRequested: boolean;
  handoffTo?: string;
  outcome?: 'resolved' | 'escalated' | 'callback_scheduled' | 'voicemail';
  qualityScore?: number;
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface ExtractedEntity {
  type: string;
  value: string;
  confidence: number;
}

export interface AgentAction {
  type: 'speak' | 'listen' | 'transfer' | 'hold' | 'record' | 'dtmf' | 'api_call';
  timestamp: Date;
  details: Record<string, any>;
  success: boolean;
}

export interface CallTranscriptSegment {
  speaker: 'agent' | 'caller';
  text: string;
  timestamp: number;
  confidence: number;
  sentiment?: string;
}

export interface OutboundCallRequest {
  agentId: string;
  toNumber: string;
  fromNumber?: string;
  context?: Record<string, any>;
  scheduledAt?: Date;
  callbackUrl?: string;
}

class VoiceAgentService {
  private agents: Map<string, VoiceAgent> = new Map();
  private activeCalls: Map<string, VoiceCall> = new Map();

  private readonly VOICE_PROVIDERS = {
    elevenlabs: {
      name: 'ElevenLabs',
      voices: [
        { id: 'rachel', name: 'Rachel', language: 'en-US', gender: 'female' },
        { id: 'josh', name: 'Josh', language: 'en-US', gender: 'male' },
        { id: 'bella', name: 'Bella', language: 'en-US', gender: 'female' },
        { id: 'adam', name: 'Adam', language: 'en-US', gender: 'male' },
        { id: 'antoni', name: 'Antoni', language: 'en-US', gender: 'male' }
      ],
      languages: ['en-US', 'en-GB', 'es-ES', 'fr-FR', 'de-DE', 'it-IT', 'pt-BR', 'ja-JP', 'ko-KR', 'zh-CN']
    },
    sarvam: {
      name: 'Sarvam AI',
      voices: [
        { id: 'hi-female-1', name: 'Hindi Female', language: 'hi-IN', gender: 'female' },
        { id: 'hi-male-1', name: 'Hindi Male', language: 'hi-IN', gender: 'male' },
        { id: 'en-in-female', name: 'English Indian Female', language: 'en-IN', gender: 'female' },
        { id: 'ta-female-1', name: 'Tamil Female', language: 'ta-IN', gender: 'female' },
        { id: 'te-female-1', name: 'Telugu Female', language: 'te-IN', gender: 'female' }
      ],
      languages: ['hi-IN', 'en-IN', 'ta-IN', 'te-IN', 'bn-IN', 'mr-IN', 'gu-IN', 'kn-IN', 'ml-IN', 'pa-IN', 'or-IN', 'as-IN', 'ur-IN', 'ne-IN', 'si-LK', 'my-MM']
    },
    azure: {
      name: 'Azure Speech',
      voices: [
        { id: 'en-US-JennyNeural', name: 'Jenny', language: 'en-US', gender: 'female' },
        { id: 'en-US-GuyNeural', name: 'Guy', language: 'en-US', gender: 'male' },
        { id: 'en-GB-SoniaNeural', name: 'Sonia', language: 'en-GB', gender: 'female' },
        { id: 'hi-IN-SwaraNeural', name: 'Swara', language: 'hi-IN', gender: 'female' }
      ],
      languages: ['en-US', 'en-GB', 'en-AU', 'en-IN', 'hi-IN', 'es-ES', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR', 'zh-CN', 'ar-SA']
    },
    google: {
      name: 'Google Cloud TTS',
      voices: [
        { id: 'en-US-Wavenet-D', name: 'Wavenet D', language: 'en-US', gender: 'male' },
        { id: 'en-US-Wavenet-F', name: 'Wavenet F', language: 'en-US', gender: 'female' },
        { id: 'en-GB-Wavenet-A', name: 'Wavenet A', language: 'en-GB', gender: 'female' },
        { id: 'hi-IN-Wavenet-A', name: 'Hindi Wavenet', language: 'hi-IN', gender: 'female' }
      ],
      languages: ['en-US', 'en-GB', 'en-AU', 'en-IN', 'hi-IN', 'es-ES', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR', 'zh-CN', 'pt-BR', 'ru-RU']
    }
  };

  private readonly AGENT_TEMPLATES = {
    'customer-support': {
      systemPrompt: `You are a professional customer support agent. Your goals are:
1. Greet the caller warmly and professionally
2. Listen carefully to understand their issue
3. Ask clarifying questions when needed
4. Provide accurate solutions or escalate appropriately
5. Confirm resolution before ending the call
6. Thank the caller for their patience`,
      greeting: 'Hello, thank you for calling. My name is your virtual assistant. How may I help you today?',
      fallbackMessage: 'I apologize, I didn\'t quite catch that. Could you please repeat?',
      personality: {
        tone: 'professional' as const,
        patience: 0.9,
        verbosity: 'moderate' as const,
        interruptHandling: 'allow' as const,
        confirmationStyle: 'explicit' as const
      }
    },
    'sales-agent': {
      systemPrompt: `You are a friendly and knowledgeable sales representative. Your goals are:
1. Build rapport with the caller
2. Understand their needs through thoughtful questions
3. Present relevant products or services
4. Address objections professionally
5. Guide them through the decision process
6. Follow up on next steps`,
      greeting: 'Hi there! Thanks for calling. I\'m here to help you find exactly what you\'re looking for. What brings you in today?',
      fallbackMessage: 'Sorry, I missed that. Could you tell me more about what you\'re looking for?',
      personality: {
        tone: 'friendly' as const,
        patience: 0.8,
        verbosity: 'detailed' as const,
        interruptHandling: 'allow' as const,
        confirmationStyle: 'implicit' as const
      }
    },
    'appointment-scheduler': {
      systemPrompt: `You are an efficient appointment scheduling assistant. Your goals are:
1. Verify caller identity
2. Understand appointment type needed
3. Check available slots
4. Confirm date, time, and details
5. Send confirmation
6. Handle rescheduling requests`,
      greeting: 'Hello, this is the scheduling assistant. I\'m here to help you book an appointment. What type of appointment would you like to schedule?',
      fallbackMessage: 'I\'m sorry, could you please repeat that? I want to make sure I get your appointment details correct.',
      personality: {
        tone: 'professional' as const,
        patience: 0.7,
        verbosity: 'concise' as const,
        interruptHandling: 'discourage' as const,
        confirmationStyle: 'explicit' as const
      }
    },
    'technical-support': {
      systemPrompt: `You are a technical support specialist. Your goals are:
1. Identify the technical issue
2. Gather relevant system/product information
3. Walk through troubleshooting steps
4. Confirm each step is completed
5. Escalate complex issues to human agents
6. Document the resolution`,
      greeting: 'Welcome to technical support. I\'m your virtual technician ready to help you resolve any issues. What seems to be the problem?',
      fallbackMessage: 'I didn\'t quite understand. Could you describe the issue you\'re experiencing?',
      personality: {
        tone: 'professional' as const,
        patience: 0.95,
        verbosity: 'detailed' as const,
        interruptHandling: 'allow' as const,
        confirmationStyle: 'explicit' as const
      }
    }
  };

  async createVoiceAgent(config: {
    userId?: string;
    organizationId?: number;
    name: string;
    description?: string;
    template?: keyof typeof VoiceAgentService.prototype.AGENT_TEMPLATES;
    voiceProvider?: 'elevenlabs' | 'sarvam' | 'azure' | 'google';
    voiceId?: string;
    language?: string;
    customSystemPrompt?: string;
    customGreeting?: string;
    phoneNumbers?: string[];
  }): Promise<VoiceAgent> {
    const agentId = `voice-agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const template = config.template ? this.AGENT_TEMPLATES[config.template] : this.AGENT_TEMPLATES['customer-support'];
    const voiceProvider = config.voiceProvider || 'elevenlabs';
    
    const agent: VoiceAgent = {
      id: agentId,
      userId: config.userId,
      organizationId: config.organizationId,
      name: config.name,
      description: config.description,
      voiceProvider,
      voiceId: config.voiceId || this.VOICE_PROVIDERS[voiceProvider].voices[0].id,
      voiceSettings: {
        stability: 0.75,
        similarityBoost: 0.75,
        style: 0.5,
        useSpeakerBoost: true,
        speed: 1.0,
        pitch: 1.0
      },
      language: config.language || 'en-US',
      supportedLanguages: this.VOICE_PROVIDERS[voiceProvider].languages,
      personality: template.personality,
      systemPrompt: config.customSystemPrompt || template.systemPrompt,
      greeting: config.customGreeting || template.greeting,
      fallbackMessage: template.fallbackMessage,
      maxCallDuration: 3600,
      silenceTimeout: 10,
      isActive: true,
      phoneNumbers: config.phoneNumbers || [],
      sipEndpoints: [],
      metadata: {
        template: config.template || 'customer-support',
        createdVia: 'api'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.agents.set(agentId, agent);
    await this.persistAgent(agent);

    return agent;
  }

  async initiateInboundCall(agentId: string, callerNumber: string, calledNumber: string): Promise<VoiceCall> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Voice agent ${agentId} not found`);
    }

    const callId = `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const call: VoiceCall = {
      id: callId,
      agentId,
      direction: 'inbound',
      status: 'initiated',
      callerNumber,
      calledNumber,
      startedAt: new Date(),
      entities: [],
      agentActions: [],
      handoffRequested: false,
      metadata: {
        agentName: agent.name,
        language: agent.language
      },
      createdAt: new Date()
    };

    this.activeCalls.set(callId, call);

    call.agentActions.push({
      type: 'speak',
      timestamp: new Date(),
      details: { text: agent.greeting },
      success: true
    });

    return call;
  }

  async initiateOutboundCall(request: OutboundCallRequest): Promise<VoiceCall> {
    const agent = this.agents.get(request.agentId);
    if (!agent) {
      throw new Error(`Voice agent ${request.agentId} not found`);
    }

    const callId = `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const call: VoiceCall = {
      id: callId,
      agentId: request.agentId,
      direction: 'outbound',
      status: 'initiated',
      callerNumber: request.fromNumber || agent.phoneNumbers[0],
      calledNumber: request.toNumber,
      startedAt: new Date(),
      entities: [],
      agentActions: [],
      handoffRequested: false,
      metadata: {
        agentName: agent.name,
        language: agent.language,
        context: request.context || {},
        callbackUrl: request.callbackUrl
      },
      createdAt: new Date()
    };

    this.activeCalls.set(callId, call);
    await this.persistCall(call);

    console.log(`Initiating outbound call ${callId} to ${request.toNumber}`);

    return call;
  }

  async answerCall(callId: string): Promise<VoiceCall> {
    const call = this.activeCalls.get(callId);
    if (!call) {
      throw new Error(`Call ${callId} not found`);
    }

    call.status = 'answered';
    call.answeredAt = new Date();

    call.agentActions.push({
      type: 'listen',
      timestamp: new Date(),
      details: { action: 'started_listening' },
      success: true
    });

    return call;
  }

  async processCallAudio(callId: string, transcribedText: string): Promise<{
    response: string;
    shouldContinue: boolean;
    intent?: string;
    entities: ExtractedEntity[];
    sentiment: string;
  }> {
    const call = this.activeCalls.get(callId);
    if (!call) {
      throw new Error(`Call ${callId} not found`);
    }

    const agent = this.agents.get(call.agentId);
    if (!agent) {
      throw new Error(`Agent ${call.agentId} not found`);
    }

    const intent = this.detectIntent(transcribedText);
    const entities = this.extractEntities(transcribedText);
    const sentiment = this.analyzeSentiment(transcribedText);

    call.entities.push(...entities);
    call.sentiment = sentiment as 'positive' | 'neutral' | 'negative';
    call.intentDetected = intent;

    let response = '';
    let shouldContinue = true;

    if (this.shouldEscalate(intent, sentiment, transcribedText)) {
      response = 'I understand this is important to you. Let me connect you with a specialist who can better assist you. Please hold for a moment.';
      call.handoffRequested = true;
      call.handoffTo = 'human-agent';
      shouldContinue = false;
    } else if (intent === 'goodbye' || intent === 'end_call') {
      response = 'Thank you for calling. Is there anything else I can help you with before we end the call?';
      if (transcribedText.toLowerCase().includes('no') || transcribedText.toLowerCase().includes('that\'s all')) {
        response = 'Thank you for calling. Have a great day!';
        shouldContinue = false;
      }
    } else {
      response = await this.generateResponse(agent, transcribedText, intent, entities, call);
    }

    call.agentActions.push({
      type: 'speak',
      timestamp: new Date(),
      details: { 
        text: response,
        intent,
        sentiment,
        entities: entities.length
      },
      success: true
    });

    if (call.transcript) {
      call.transcript += `\nCaller: ${transcribedText}\nAgent: ${response}`;
    } else {
      call.transcript = `Agent: ${agent.greeting}\nCaller: ${transcribedText}\nAgent: ${response}`;
    }

    return {
      response,
      shouldContinue,
      intent,
      entities,
      sentiment
    };
  }

  async endCall(callId: string, outcome?: string): Promise<VoiceCall> {
    const call = this.activeCalls.get(callId);
    if (!call) {
      throw new Error(`Call ${callId} not found`);
    }

    call.status = 'completed';
    call.endedAt = new Date();
    
    if (call.answeredAt) {
      call.duration = Math.floor((call.endedAt.getTime() - call.answeredAt.getTime()) / 1000);
    }

    call.outcome = (outcome as any) || (call.handoffRequested ? 'escalated' : 'resolved');
    call.summary = await this.generateCallSummary(call);
    call.qualityScore = this.calculateQualityScore(call);

    await this.persistCall(call);
    this.activeCalls.delete(callId);

    return call;
  }

  private detectIntent(text: string): string {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('cancel') || lowerText.includes('stop') || lowerText.includes('unsubscribe')) {
      return 'cancellation';
    }
    if (lowerText.includes('refund') || lowerText.includes('money back')) {
      return 'refund';
    }
    if (lowerText.includes('speak to') || lowerText.includes('talk to') || lowerText.includes('human') || lowerText.includes('manager') || lowerText.includes('supervisor')) {
      return 'escalation';
    }
    if (lowerText.includes('schedule') || lowerText.includes('appointment') || lowerText.includes('book')) {
      return 'scheduling';
    }
    if (lowerText.includes('help') || lowerText.includes('problem') || lowerText.includes('issue') || lowerText.includes('not working')) {
      return 'support';
    }
    if (lowerText.includes('price') || lowerText.includes('cost') || lowerText.includes('how much')) {
      return 'pricing';
    }
    if (lowerText.includes('bye') || lowerText.includes('goodbye') || lowerText.includes('hang up') || lowerText.includes('end call')) {
      return 'goodbye';
    }
    if (lowerText.includes('thanks') || lowerText.includes('thank you')) {
      return 'gratitude';
    }
    if (lowerText.includes('hello') || lowerText.includes('hi ')) {
      return 'greeting';
    }
    
    return 'general_inquiry';
  }

  private extractEntities(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    
    const phoneRegex = /\+?[\d\s-()]{10,}/g;
    const phones = text.match(phoneRegex);
    if (phones) {
      phones.forEach(phone => {
        entities.push({ type: 'phone', value: phone.trim(), confidence: 0.9 });
      });
    }

    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
    const emails = text.match(emailRegex);
    if (emails) {
      emails.forEach(email => {
        entities.push({ type: 'email', value: email, confidence: 0.95 });
      });
    }

    const dateRegex = /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tomorrow|next week)\b/gi;
    const dates = text.match(dateRegex);
    if (dates) {
      dates.forEach(date => {
        entities.push({ type: 'date', value: date, confidence: 0.85 });
      });
    }

    const timeRegex = /\b\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?\b/g;
    const times = text.match(timeRegex);
    if (times) {
      times.forEach(time => {
        entities.push({ type: 'time', value: time, confidence: 0.8 });
      });
    }

    const amountRegex = /\$[\d,]+(?:\.\d{2})?/g;
    const amounts = text.match(amountRegex);
    if (amounts) {
      amounts.forEach(amount => {
        entities.push({ type: 'amount', value: amount, confidence: 0.9 });
      });
    }

    return entities;
  }

  private analyzeSentiment(text: string): string {
    const lowerText = text.toLowerCase();
    
    const positiveWords = ['great', 'thanks', 'thank you', 'wonderful', 'excellent', 'perfect', 'appreciate', 'helpful', 'amazing'];
    const negativeWords = ['angry', 'frustrated', 'terrible', 'awful', 'unacceptable', 'disappointed', 'hate', 'worst', 'ridiculous', 'upset'];
    
    let positiveScore = 0;
    let negativeScore = 0;
    
    for (const word of positiveWords) {
      if (lowerText.includes(word)) positiveScore++;
    }
    for (const word of negativeWords) {
      if (lowerText.includes(word)) negativeScore++;
    }
    
    if (negativeScore > positiveScore) return 'negative';
    if (positiveScore > negativeScore) return 'positive';
    return 'neutral';
  }

  private shouldEscalate(intent: string, sentiment: string, text: string): boolean {
    if (intent === 'escalation') return true;
    if (sentiment === 'negative' && text.toLowerCase().includes('unacceptable')) return true;
    
    const escalationPhrases = ['speak to someone', 'real person', 'human agent', 'supervisor', 'manager', 'complaint', 'not satisfied'];
    const lowerText = text.toLowerCase();
    
    for (const phrase of escalationPhrases) {
      if (lowerText.includes(phrase)) return true;
    }
    
    return false;
  }

  private async generateResponse(
    agent: VoiceAgent, 
    userText: string, 
    intent: string, 
    entities: ExtractedEntity[],
    call: VoiceCall
  ): Promise<string> {
    const responses: Record<string, string> = {
      'greeting': `Hello! I'm ${agent.name}. How can I assist you today?`,
      'support': 'I understand you\'re experiencing an issue. Could you please describe what\'s happening so I can help you resolve it?',
      'pricing': 'I\'d be happy to help you with pricing information. Could you tell me which product or service you\'re interested in?',
      'scheduling': 'I can help you schedule an appointment. What date and time works best for you?',
      'refund': 'I understand you\'d like to request a refund. Let me look into your account. Could you provide your order number or the email associated with your account?',
      'cancellation': 'I\'m sorry to hear you want to cancel. Before we proceed, may I ask what led to this decision? Perhaps I can help address any concerns.',
      'gratitude': 'You\'re welcome! Is there anything else I can help you with?',
      'general_inquiry': 'I\'d be happy to help. Could you provide more details about what you\'re looking for?'
    };

    let response = responses[intent] || agent.fallbackMessage || 'Could you please tell me more about how I can help you?';

    if (entities.length > 0) {
      const dateEntity = entities.find(e => e.type === 'date');
      const timeEntity = entities.find(e => e.type === 'time');
      
      if (intent === 'scheduling' && dateEntity) {
        response = `Great, I see you mentioned ${dateEntity.value}. ${timeEntity ? `At ${timeEntity.value}. ` : ''}Let me check our availability for that time.`;
      }
    }

    return response;
  }

  private async generateCallSummary(call: VoiceCall): Promise<string> {
    const agent = this.agents.get(call.agentId);
    const agentName = agent?.name || 'Voice Agent';
    
    let summary = `Call handled by ${agentName}. `;
    summary += `Direction: ${call.direction}. `;
    summary += `Duration: ${call.duration || 0} seconds. `;
    
    if (call.intentDetected) {
      summary += `Primary intent: ${call.intentDetected}. `;
    }
    
    if (call.sentiment) {
      summary += `Customer sentiment: ${call.sentiment}. `;
    }
    
    if (call.handoffRequested) {
      summary += `Call was escalated to ${call.handoffTo}. `;
    }
    
    summary += `Outcome: ${call.outcome || 'completed'}. `;
    
    if (call.entities.length > 0) {
      summary += `Entities captured: ${call.entities.length}. `;
    }

    return summary;
  }

  private calculateQualityScore(call: VoiceCall): number {
    let score = 0.5;

    if (call.outcome === 'resolved') score += 0.2;
    if (call.sentiment === 'positive') score += 0.15;
    if (call.sentiment === 'negative') score -= 0.1;
    if (!call.handoffRequested) score += 0.1;
    if (call.duration && call.duration > 30 && call.duration < 300) score += 0.05;

    return Math.min(Math.max(score, 0), 1);
  }

  private async persistAgent(agent: VoiceAgent): Promise<void> {
    try {
      await db.insert(waiVoiceAgents).values({
        agentId: agent.id,
        userId: agent.userId,
        organizationId: agent.organizationId,
        name: agent.name,
        description: agent.description,
        voiceProvider: agent.voiceProvider,
        voiceId: agent.voiceId,
        voiceSettings: agent.voiceSettings,
        language: agent.language,
        supportedLanguages: agent.supportedLanguages,
        personality: agent.personality,
        systemPrompt: agent.systemPrompt,
        greeting: agent.greeting,
        fallbackMessage: agent.fallbackMessage,
        maxCallDuration: agent.maxCallDuration,
        silenceTimeout: agent.silenceTimeout,
        isActive: agent.isActive,
        phoneNumbers: agent.phoneNumbers,
        sipEndpoints: agent.sipEndpoints,
        metadata: agent.metadata
      }).onConflictDoUpdate({
        target: waiVoiceAgents.agentId,
        set: {
          isActive: agent.isActive,
          voiceSettings: agent.voiceSettings,
          systemPrompt: agent.systemPrompt,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to persist voice agent:', error);
    }
  }

  private async persistCall(call: VoiceCall): Promise<void> {
    try {
      await db.insert(waiVoiceCalls).values({
        callId: call.id,
        agentId: call.agentId,
        direction: call.direction,
        status: call.status,
        callerNumber: call.callerNumber,
        calledNumber: call.calledNumber,
        startedAt: call.startedAt,
        answeredAt: call.answeredAt,
        endedAt: call.endedAt,
        duration: call.duration,
        recordingUrl: call.recordingUrl,
        transcript: call.transcript,
        summary: call.summary,
        sentiment: call.sentiment,
        intentDetected: call.intentDetected,
        entities: call.entities,
        agentActions: call.agentActions,
        handoffRequested: call.handoffRequested,
        handoffTo: call.handoffTo,
        outcome: call.outcome,
        qualityScore: call.qualityScore,
        metadata: call.metadata
      }).onConflictDoUpdate({
        target: waiVoiceCalls.callId,
        set: {
          status: call.status,
          answeredAt: call.answeredAt,
          endedAt: call.endedAt,
          duration: call.duration,
          transcript: call.transcript,
          summary: call.summary,
          sentiment: call.sentiment,
          intentDetected: call.intentDetected,
          entities: call.entities,
          agentActions: call.agentActions,
          handoffRequested: call.handoffRequested,
          handoffTo: call.handoffTo,
          outcome: call.outcome,
          qualityScore: call.qualityScore
        }
      });
    } catch (error) {
      console.error('Failed to persist voice call:', error);
    }
  }

  getAgent(agentId: string): VoiceAgent | undefined {
    return this.agents.get(agentId);
  }

  getAgents(): VoiceAgent[] {
    return Array.from(this.agents.values());
  }

  getActiveCall(callId: string): VoiceCall | undefined {
    return this.activeCalls.get(callId);
  }

  getActiveCalls(): VoiceCall[] {
    return Array.from(this.activeCalls.values());
  }

  getVoiceProviders(): typeof this.VOICE_PROVIDERS {
    return this.VOICE_PROVIDERS;
  }

  getAgentTemplates(): typeof this.AGENT_TEMPLATES {
    return this.AGENT_TEMPLATES;
  }

  getStats(): {
    totalAgents: number;
    activeAgents: number;
    activeCalls: number;
    providers: string[];
    templates: string[];
  } {
    const agents = Array.from(this.agents.values());
    
    return {
      totalAgents: agents.length,
      activeAgents: agents.filter(a => a.isActive).length,
      activeCalls: this.activeCalls.size,
      providers: Object.keys(this.VOICE_PROVIDERS),
      templates: Object.keys(this.AGENT_TEMPLATES)
    };
  }
}

export const voiceAgentService = new VoiceAgentService();
