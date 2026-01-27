import { db } from '../db';
import { eq, and, desc, sql } from 'drizzle-orm';
import { waiDigitalTwins, waiDigitalTwinBehaviors, waiAutomationRules } from '@shared/schema';

export interface UserBehavior {
  id: string;
  userId: string;
  behaviorType: 'interaction' | 'preference' | 'pattern' | 'feedback';
  action: string;
  context: Record<string, any>;
  timestamp: Date;
  sessionId?: string;
  deviceInfo?: DeviceInfo;
  locationInfo?: LocationInfo;
}

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet';
  os: string;
  browser: string;
  screenSize?: string;
}

export interface LocationInfo {
  timezone: string;
  locale: string;
  region?: string;
}

export interface DigitalTwinProfile {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  personalityTraits: PersonalityTraits;
  preferences: UserPreferences;
  communicationStyle: CommunicationStyle;
  workPatterns: WorkPatterns;
  learningProgress: LearningProgress;
  automationRules: AutomationRule[];
  trustLevel: number;
  autonomyLevel: 'supervised' | 'assisted' | 'autonomous';
}

export interface PersonalityTraits {
  formality: number;
  verbosity: number;
  techSavviness: number;
  decisionSpeed: number;
  riskTolerance: number;
  collaborativeness: number;
}

export interface UserPreferences {
  language: string;
  timezone: string;
  responseFormat: 'concise' | 'detailed' | 'structured';
  preferredChannels: string[];
  notificationSettings: NotificationPreferences;
  uiPreferences: UIPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  slack: boolean;
  urgentOnly: boolean;
  quietHours?: { start: string; end: string };
}

export interface UIPreferences {
  theme: 'light' | 'dark' | 'system';
  density: 'comfortable' | 'compact';
  sidebar: 'expanded' | 'collapsed';
  defaultView: string;
}

export interface CommunicationStyle {
  tone: 'formal' | 'casual' | 'professional';
  emoticons: boolean;
  bulletPoints: boolean;
  codeBlocks: boolean;
  explanationLevel: 'brief' | 'moderate' | 'thorough';
}

export interface WorkPatterns {
  activeHours: { start: string; end: string };
  peakProductivityHours: string[];
  meetingPreferences: MeetingPreferences;
  taskBatchingPreference: boolean;
  focusTimeNeeded: number;
}

export interface MeetingPreferences {
  preferredDuration: number;
  preferredTimes: string[];
  bufferBetweenMeetings: number;
  maxMeetingsPerDay: number;
}

export interface LearningProgress {
  totalInteractions: number;
  accuracyScore: number;
  confidenceLevel: number;
  lastLearningUpdate: Date;
  topicExpertise: Record<string, number>;
  improvementAreas: string[];
}

export interface AutomationRule {
  id: string;
  name: string;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  isEnabled: boolean;
  executionCount: number;
  lastExecuted?: Date;
  romaLevel: 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
}

export interface AutomationTrigger {
  type: 'schedule' | 'event' | 'condition' | 'manual';
  config: Record<string, any>;
}

export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'matches';
  value: any;
}

export interface AutomationAction {
  type: 'notify' | 'execute' | 'delegate' | 'respond' | 'escalate';
  config: Record<string, any>;
  requiresApproval: boolean;
}

export interface TwinInteraction {
  userId: string;
  query: string;
  context: Record<string, any>;
  response?: string;
  agentUsed?: string;
  satisfaction?: number;
}

class DigitalTwinEngine {
  private profiles: Map<string, DigitalTwinProfile> = new Map();
  private behaviors: Map<string, UserBehavior[]> = new Map();
  private interactionHistory: Map<string, TwinInteraction[]> = new Map();

  private async persistProfile(profile: DigitalTwinProfile): Promise<void> {
    try {
      await db.insert(waiDigitalTwins).values({
        twinId: profile.id,
        userId: profile.userId,
        personalityTraits: profile.personalityTraits,
        preferences: profile.preferences,
        communicationStyle: profile.communicationStyle,
        workPatterns: profile.workPatterns,
        learningProgress: profile.learningProgress,
        trustLevel: profile.trustLevel,
        autonomyLevel: profile.autonomyLevel
      }).onConflictDoUpdate({
        target: waiDigitalTwins.twinId,
        set: {
          personalityTraits: profile.personalityTraits,
          preferences: profile.preferences,
          communicationStyle: profile.communicationStyle,
          workPatterns: profile.workPatterns,
          learningProgress: profile.learningProgress,
          trustLevel: profile.trustLevel,
          autonomyLevel: profile.autonomyLevel,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to persist digital twin:', error);
    }
  }

  private async getTwinIdForUser(userId: string, createIfMissing: boolean = true): Promise<string | null> {
    const profile = this.profiles.get(userId);
    if (profile) return profile.id;
    
    try {
      const [dbTwin] = await db.select({ twinId: waiDigitalTwins.twinId })
        .from(waiDigitalTwins)
        .where(eq(waiDigitalTwins.userId, userId))
        .limit(1);
      
      if (dbTwin?.twinId) return dbTwin.twinId;
      
      if (createIfMissing) {
        const newProfile = await this.createDigitalTwin(userId);
        return newProfile.id;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get twin ID for user:', userId, error);
      return null;
    }
  }

  private async persistBehavior(behavior: UserBehavior): Promise<void> {
    try {
      const twinId = await this.getTwinIdForUser(behavior.userId, true);
      if (!twinId) {
        console.error('Cannot persist behavior: twin not found for user', behavior.userId);
        return;
      }
      
      await db.insert(waiDigitalTwinBehaviors).values({
        behaviorId: behavior.id,
        twinId: twinId,
        behaviorType: behavior.behaviorType,
        action: behavior.action,
        context: behavior.context,
        sessionId: behavior.sessionId,
        deviceInfo: behavior.deviceInfo || {},
        locationInfo: behavior.locationInfo || {}
      });
    } catch (error) {
      console.error('Failed to persist behavior:', error);
    }
  }

  private async persistAutomationRule(userId: string, rule: AutomationRule): Promise<void> {
    try {
      const twinId = await this.getTwinIdForUser(userId, true);
      if (!twinId) {
        console.error('Cannot persist automation rule: twin not found for user', userId);
        return;
      }
      
      await db.insert(waiAutomationRules).values({
        ruleId: rule.id,
        twinId: twinId,
        name: rule.name,
        trigger: rule.trigger,
        conditions: rule.conditions,
        actions: rule.actions,
        romaLevel: rule.romaLevel,
        isEnabled: rule.isEnabled,
        executionCount: rule.executionCount,
        lastExecuted: rule.lastExecuted
      }).onConflictDoUpdate({
        target: waiAutomationRules.ruleId,
        set: {
          isEnabled: rule.isEnabled,
          executionCount: rule.executionCount,
          lastExecuted: rule.lastExecuted,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to persist automation rule:', error);
    }
  }

  async createDigitalTwin(userId: string): Promise<DigitalTwinProfile> {
    const existingProfile = this.profiles.get(userId);
    if (existingProfile) {
      return existingProfile;
    }

    const profile: DigitalTwinProfile = {
      id: `twin-${userId}-${Date.now()}`,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      personalityTraits: this.getDefaultPersonalityTraits(),
      preferences: this.getDefaultPreferences(),
      communicationStyle: this.getDefaultCommunicationStyle(),
      workPatterns: this.getDefaultWorkPatterns(),
      learningProgress: this.getInitialLearningProgress(),
      automationRules: [],
      trustLevel: 0.5,
      autonomyLevel: 'supervised'
    };

    this.profiles.set(userId, profile);
    this.behaviors.set(userId, []);
    this.interactionHistory.set(userId, []);
    await this.persistProfile(profile);

    console.log(`🤖 Digital Twin created for user: ${userId}`);
    return profile;
  }

  async getDigitalTwin(userId: string): Promise<DigitalTwinProfile | null> {
    return this.profiles.get(userId) || null;
  }

  async recordBehavior(behavior: UserBehavior): Promise<void> {
    const userBehaviors = this.behaviors.get(behavior.userId) || [];
    userBehaviors.push(behavior);
    this.behaviors.set(behavior.userId, userBehaviors);

    await this.persistBehavior(behavior);
    await this.updateProfileFromBehavior(behavior);
    console.log(`📊 Behavior recorded for ${behavior.userId}: ${behavior.action}`);
  }

  private async updateProfileFromBehavior(behavior: UserBehavior): Promise<void> {
    const profile = this.profiles.get(behavior.userId);
    if (!profile) return;

    switch (behavior.behaviorType) {
      case 'preference':
        await this.updatePreferences(profile, behavior);
        break;
      case 'interaction':
        await this.updateFromInteraction(profile, behavior);
        break;
      case 'pattern':
        await this.updatePatterns(profile, behavior);
        break;
      case 'feedback':
        await this.updateFromFeedback(profile, behavior);
        break;
    }

    profile.updatedAt = new Date();
    profile.learningProgress.totalInteractions++;
    this.profiles.set(behavior.userId, profile);
    await this.persistProfile(profile);
  }

  private async updatePreferences(profile: DigitalTwinProfile, behavior: UserBehavior): Promise<void> {
    const { context } = behavior;
    
    if (context.theme) {
      profile.preferences.uiPreferences.theme = context.theme;
    }
    if (context.responseFormat) {
      profile.preferences.responseFormat = context.responseFormat;
    }
    if (context.language) {
      profile.preferences.language = context.language;
    }
  }

  private async updateFromInteraction(profile: DigitalTwinProfile, behavior: UserBehavior): Promise<void> {
    const { context } = behavior;
    
    if (context.topic) {
      profile.learningProgress.topicExpertise[context.topic] = 
        (profile.learningProgress.topicExpertise[context.topic] || 0) + 0.1;
    }

    if (context.responseTime) {
      const speed = context.responseTime < 1000 ? 0.1 : -0.05;
      profile.personalityTraits.decisionSpeed = Math.min(1, Math.max(0, 
        profile.personalityTraits.decisionSpeed + speed
      ));
    }
  }

  private async updatePatterns(profile: DigitalTwinProfile, behavior: UserBehavior): Promise<void> {
    const { context } = behavior;
    
    if (context.activeHour) {
      const hour = new Date(behavior.timestamp).getHours().toString();
      if (!profile.workPatterns.peakProductivityHours.includes(hour)) {
        profile.workPatterns.peakProductivityHours.push(hour);
      }
    }
  }

  private async updateFromFeedback(profile: DigitalTwinProfile, behavior: UserBehavior): Promise<void> {
    const { context } = behavior;
    
    if (context.satisfaction !== undefined) {
      const delta = (context.satisfaction - 3) * 0.02;
      profile.learningProgress.accuracyScore = Math.min(1, Math.max(0,
        profile.learningProgress.accuracyScore + delta
      ));
      profile.learningProgress.confidenceLevel = Math.min(1, Math.max(0,
        profile.learningProgress.confidenceLevel + delta * 0.5
      ));
    }

    if (context.suggestion) {
      if (!profile.learningProgress.improvementAreas.includes(context.suggestion)) {
        profile.learningProgress.improvementAreas.push(context.suggestion);
      }
    }
  }

  async processInteraction(interaction: TwinInteraction): Promise<{
    personalizedResponse: string;
    agentRecommendation: string;
    contextEnhancements: Record<string, any>;
  }> {
    const profile = this.profiles.get(interaction.userId);
    
    if (!profile) {
      return {
        personalizedResponse: interaction.response || '',
        agentRecommendation: 'general-assistant-agent',
        contextEnhancements: {}
      };
    }

    const contextEnhancements = {
      userTone: profile.communicationStyle.tone,
      verbosityLevel: profile.personalityTraits.verbosity,
      expertiseAreas: Object.keys(profile.learningProgress.topicExpertise),
      preferredFormat: profile.preferences.responseFormat,
      timezone: profile.preferences.timezone,
      language: profile.preferences.language
    };

    const personalizedResponse = this.personalizeResponse(
      interaction.response || '',
      profile
    );

    const agentRecommendation = this.recommendAgent(interaction, profile);

    const history = this.interactionHistory.get(interaction.userId) || [];
    history.push(interaction);
    this.interactionHistory.set(interaction.userId, history);

    return {
      personalizedResponse,
      agentRecommendation,
      contextEnhancements
    };
  }

  private personalizeResponse(response: string, profile: DigitalTwinProfile): string {
    let personalized = response;

    if (profile.communicationStyle.tone === 'formal') {
      personalized = personalized.replace(/hey /gi, 'Hello ');
      personalized = personalized.replace(/thanks/gi, 'Thank you');
    }

    if (profile.preferences.responseFormat === 'concise' && response.length > 500) {
      const sentences = personalized.split('. ');
      personalized = sentences.slice(0, Math.min(3, sentences.length)).join('. ') + '.';
    }

    if (profile.communicationStyle.bulletPoints && response.includes(',')) {
      const parts = response.split(',').map(p => `• ${p.trim()}`);
      if (parts.length > 2) {
        personalized = parts.join('\n');
      }
    }

    return personalized;
  }

  private recommendAgent(interaction: TwinInteraction, profile: DigitalTwinProfile): string {
    const query = interaction.query.toLowerCase();
    const expertise = profile.learningProgress.topicExpertise;

    const agentMapping: Record<string, string> = {
      'code': 'developer-agent',
      'design': 'design-agent',
      'marketing': 'marketing-agent',
      'finance': 'finance-agent',
      'legal': 'compliance-agent',
      'data': 'data-analyst-agent',
      'project': 'project-manager-agent',
      'content': 'content-writer-agent'
    };

    for (const [keyword, agent] of Object.entries(agentMapping)) {
      if (query.includes(keyword)) {
        return agent;
      }
    }

    const topExpertise = Object.entries(expertise)
      .sort(([, a], [, b]) => b - a)[0];
    
    if (topExpertise && topExpertise[1] > 0.5) {
      return agentMapping[topExpertise[0]] || 'general-assistant-agent';
    }

    return 'general-assistant-agent';
  }

  async addAutomationRule(userId: string, rule: Omit<AutomationRule, 'id' | 'executionCount'>): Promise<AutomationRule> {
    const profile = this.profiles.get(userId);
    if (!profile) {
      throw new Error('Digital Twin not found for user');
    }

    const newRule: AutomationRule = {
      ...rule,
      id: `rule-${Date.now()}`,
      executionCount: 0
    };

    profile.automationRules.push(newRule);
    profile.updatedAt = new Date();
    this.profiles.set(userId, profile);
    await this.persistAutomationRule(userId, newRule);
    await this.persistProfile(profile);

    console.log(`⚡ Automation rule added for ${userId}: ${rule.name}`);
    return newRule;
  }

  async executeAutomationRule(userId: string, ruleId: string, context: Record<string, any>): Promise<{
    success: boolean;
    actionsExecuted: string[];
    requiresApproval: boolean;
  }> {
    const profile = this.profiles.get(userId);
    if (!profile) {
      return { success: false, actionsExecuted: [], requiresApproval: false };
    }

    const rule = profile.automationRules.find(r => r.id === ruleId);
    if (!rule || !rule.isEnabled) {
      return { success: false, actionsExecuted: [], requiresApproval: false };
    }

    const conditionsMet = rule.conditions.every(c => this.evaluateCondition(c, context));
    if (!conditionsMet) {
      return { success: false, actionsExecuted: [], requiresApproval: false };
    }

    const requiresApproval = rule.actions.some(a => a.requiresApproval) || 
                             (rule.romaLevel === 'L5' && profile.autonomyLevel !== 'autonomous');

    if (requiresApproval && profile.autonomyLevel !== 'autonomous') {
      return { success: true, actionsExecuted: [], requiresApproval: true };
    }

    const actionsExecuted: string[] = [];
    for (const action of rule.actions) {
      await this.executeAction(action, context);
      actionsExecuted.push(action.type);
    }

    rule.executionCount++;
    rule.lastExecuted = new Date();
    this.profiles.set(userId, profile);

    return { success: true, actionsExecuted, requiresApproval: false };
  }

  private evaluateCondition(condition: AutomationCondition, context: Record<string, any>): boolean {
    const value = context[condition.field];
    switch (condition.operator) {
      case 'equals': return value === condition.value;
      case 'contains': return String(value).includes(String(condition.value));
      case 'greaterThan': return Number(value) > Number(condition.value);
      case 'lessThan': return Number(value) < Number(condition.value);
      case 'matches': return new RegExp(condition.value).test(String(value));
      default: return false;
    }
  }

  private async executeAction(action: AutomationAction, context: Record<string, any>): Promise<void> {
    console.log(`⚡ Executing action: ${action.type}`, action.config);
  }

  async updateAutonomyLevel(userId: string, level: 'supervised' | 'assisted' | 'autonomous'): Promise<void> {
    const profile = this.profiles.get(userId);
    if (!profile) return;

    profile.autonomyLevel = level;
    profile.updatedAt = new Date();
    this.profiles.set(userId, profile);

    console.log(`🔐 Autonomy level updated for ${userId}: ${level}`);
  }

  async getStats(): Promise<{
    totalTwins: number;
    totalBehaviors: number;
    totalInteractions: number;
    averageTrustLevel: number;
    autonomyDistribution: Record<string, number>;
  }> {
    const profiles = Array.from(this.profiles.values());
    const totalBehaviors = Array.from(this.behaviors.values()).reduce((sum, b) => sum + b.length, 0);
    const totalInteractions = Array.from(this.interactionHistory.values()).reduce((sum, i) => sum + i.length, 0);
    
    const autonomyDistribution: Record<string, number> = {
      supervised: 0,
      assisted: 0,
      autonomous: 0
    };
    
    profiles.forEach(p => {
      autonomyDistribution[p.autonomyLevel]++;
    });

    return {
      totalTwins: profiles.length,
      totalBehaviors,
      totalInteractions,
      averageTrustLevel: profiles.length > 0 
        ? profiles.reduce((sum, p) => sum + p.trustLevel, 0) / profiles.length 
        : 0,
      autonomyDistribution
    };
  }

  private getDefaultPersonalityTraits(): PersonalityTraits {
    return {
      formality: 0.5,
      verbosity: 0.5,
      techSavviness: 0.5,
      decisionSpeed: 0.5,
      riskTolerance: 0.5,
      collaborativeness: 0.5
    };
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      language: 'en',
      timezone: 'UTC',
      responseFormat: 'detailed',
      preferredChannels: ['email', 'chat'],
      notificationSettings: {
        email: true,
        push: true,
        sms: false,
        slack: false,
        urgentOnly: false
      },
      uiPreferences: {
        theme: 'system',
        density: 'comfortable',
        sidebar: 'expanded',
        defaultView: 'dashboard'
      }
    };
  }

  private getDefaultCommunicationStyle(): CommunicationStyle {
    return {
      tone: 'professional',
      emoticons: false,
      bulletPoints: true,
      codeBlocks: true,
      explanationLevel: 'moderate'
    };
  }

  private getDefaultWorkPatterns(): WorkPatterns {
    return {
      activeHours: { start: '09:00', end: '18:00' },
      peakProductivityHours: ['10', '11', '14', '15'],
      meetingPreferences: {
        preferredDuration: 30,
        preferredTimes: ['10:00', '14:00', '16:00'],
        bufferBetweenMeetings: 15,
        maxMeetingsPerDay: 5
      },
      taskBatchingPreference: true,
      focusTimeNeeded: 120
    };
  }

  private getInitialLearningProgress(): LearningProgress {
    return {
      totalInteractions: 0,
      accuracyScore: 0.5,
      confidenceLevel: 0.3,
      lastLearningUpdate: new Date(),
      topicExpertise: {},
      improvementAreas: []
    };
  }
}

export const digitalTwinEngine = new DigitalTwinEngine();
