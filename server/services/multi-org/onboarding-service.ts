import { db } from '../../db';
import { eq } from 'drizzle-orm';
import {
  organizationOnboarding,
  organizations,
  organizationApiKeys,
  subscriptions,
  organizationConfigs,
  organizationAuditLog,
  type OrganizationOnboarding,
} from '@shared/schema';

export interface OnboardingStep {
  id: string;
  name: string;
  description: string;
  required: boolean;
  completed: boolean;
}

export interface OnboardingProgress {
  currentStep: number;
  totalSteps: number;
  completedSteps: string[];
  steps: OnboardingStep[];
  percentComplete: number;
  isComplete: boolean;
}

class OnboardingService {
  private static instance: OnboardingService;

  private readonly steps: Omit<OnboardingStep, 'completed'>[] = [
    {
      id: 'profile',
      name: 'Complete Organization Profile',
      description: 'Set up your organization name, logo, and description',
      required: true,
    },
    {
      id: 'team',
      name: 'Invite Team Members',
      description: 'Add team members to collaborate on projects',
      required: false,
    },
    {
      id: 'api_key',
      name: 'Create API Key',
      description: 'Generate an API key to integrate WAI SDK',
      required: true,
    },
    {
      id: 'first_execution',
      name: 'Execute First Agent',
      description: 'Run your first AI agent to test the integration',
      required: false,
    },
    {
      id: 'billing',
      name: 'Configure Billing',
      description: 'Set up payment method and subscription',
      required: false,
    },
    {
      id: 'integrations',
      name: 'Configure Integrations',
      description: 'Connect with external services and webhooks',
      required: false,
    },
  ];

  private constructor() {}

  public static getInstance(): OnboardingService {
    if (!OnboardingService.instance) {
      OnboardingService.instance = new OnboardingService();
    }
    return OnboardingService.instance;
  }

  async getOnboardingProgress(organizationId: number): Promise<OnboardingProgress> {
    const [onboarding] = await db.select()
      .from(organizationOnboarding)
      .where(eq(organizationOnboarding.organizationId, organizationId))
      .limit(1);

    if (!onboarding) {
      await this.initializeOnboarding(organizationId);
      return this.getOnboardingProgress(organizationId);
    }

    const completedStepIds = await this.getCompletedStepIds(onboarding);
    
    const steps: OnboardingStep[] = this.steps.map(step => ({
      ...step,
      completed: completedStepIds.includes(step.id),
    }));

    const completedCount = steps.filter(s => s.completed).length;
    const currentStep = this.calculateCurrentStep(completedStepIds);
    const isComplete = onboarding.completedAt !== null;

    return {
      currentStep,
      totalSteps: this.steps.length,
      completedSteps: completedStepIds,
      steps,
      percentComplete: Math.round((completedCount / this.steps.length) * 100),
      isComplete,
    };
  }

  async completeStep(organizationId: number, stepId: string): Promise<OnboardingProgress> {
    const [onboarding] = await db.select()
      .from(organizationOnboarding)
      .where(eq(organizationOnboarding.organizationId, organizationId))
      .limit(1);

    if (!onboarding) {
      throw new Error('Onboarding not initialized');
    }

    const completedSteps = (onboarding.completedSteps as string[]) || [];
    if (!completedSteps.includes(stepId)) {
      completedSteps.push(stepId);
    }

    const updates: any = {
      completedSteps,
      updatedAt: new Date(),
    };

    switch (stepId) {
      case 'profile':
        updates.profileCompleted = true;
        break;
      case 'team':
        updates.teamInvited = true;
        break;
      case 'api_key':
        updates.apiKeyCreated = true;
        break;
      case 'first_execution':
        updates.firstAgentExecuted = true;
        break;
      case 'billing':
        updates.billingConfigured = true;
        break;
      case 'integrations':
        updates.integrationsConfigured = true;
        break;
    }

    const allRequiredComplete = this.steps
      .filter(s => s.required)
      .every(s => completedSteps.includes(s.id));

    if (allRequiredComplete && !onboarding.completedAt) {
      updates.completedAt = new Date();
    }

    updates.currentStep = this.calculateCurrentStep(completedSteps);

    await db.update(organizationOnboarding)
      .set(updates)
      .where(eq(organizationOnboarding.organizationId, organizationId));

    await db.insert(organizationAuditLog).values({
      organizationId,
      action: 'onboarding.step_completed',
      resource: 'onboarding',
      resourceId: stepId,
      newValue: { step: stepId },
    });

    return this.getOnboardingProgress(organizationId);
  }

  async skipOnboarding(organizationId: number): Promise<void> {
    await db.update(organizationOnboarding)
      .set({
        skippedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(organizationOnboarding.organizationId, organizationId));

    await db.insert(organizationAuditLog).values({
      organizationId,
      action: 'onboarding.skipped',
      resource: 'onboarding',
    });
  }

  async resetOnboarding(organizationId: number): Promise<void> {
    await db.update(organizationOnboarding)
      .set({
        currentStep: 1,
        completedSteps: [],
        profileCompleted: false,
        teamInvited: false,
        apiKeyCreated: false,
        firstAgentExecuted: false,
        billingConfigured: false,
        integrationsConfigured: false,
        completedAt: null,
        skippedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(organizationOnboarding.organizationId, organizationId));
  }

  async checkAndAutoCompleteSteps(organizationId: number): Promise<OnboardingProgress> {
    const [org] = await db.select()
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);

    if (org && org.name && org.description) {
      await this.completeStep(organizationId, 'profile');
    }

    const apiKeys = await db.select()
      .from(organizationApiKeys)
      .where(eq(organizationApiKeys.organizationId, organizationId))
      .limit(1);

    if (apiKeys.length > 0) {
      await this.completeStep(organizationId, 'api_key');
    }

    const [subscription] = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.organizationId, organizationId))
      .limit(1);

    if (subscription && subscription.stripeCustomerId) {
      await this.completeStep(organizationId, 'billing');
    }

    const [config] = await db.select()
      .from(organizationConfigs)
      .where(eq(organizationConfigs.organizationId, organizationId))
      .limit(1);

    if (config && config.webhookUrl) {
      await this.completeStep(organizationId, 'integrations');
    }

    return this.getOnboardingProgress(organizationId);
  }

  private async initializeOnboarding(organizationId: number): Promise<void> {
    await db.insert(organizationOnboarding).values({
      organizationId,
      currentStep: 1,
      completedSteps: [],
      profileCompleted: false,
      teamInvited: false,
      apiKeyCreated: false,
      firstAgentExecuted: false,
      billingConfigured: false,
      integrationsConfigured: false,
    });
  }

  private async getCompletedStepIds(onboarding: OrganizationOnboarding): Promise<string[]> {
    const completedSteps: string[] = [];

    if (onboarding.profileCompleted) completedSteps.push('profile');
    if (onboarding.teamInvited) completedSteps.push('team');
    if (onboarding.apiKeyCreated) completedSteps.push('api_key');
    if (onboarding.firstAgentExecuted) completedSteps.push('first_execution');
    if (onboarding.billingConfigured) completedSteps.push('billing');
    if (onboarding.integrationsConfigured) completedSteps.push('integrations');

    return completedSteps;
  }

  private calculateCurrentStep(completedStepIds: string[]): number {
    for (let i = 0; i < this.steps.length; i++) {
      if (!completedStepIds.includes(this.steps[i].id)) {
        return i + 1;
      }
    }
    return this.steps.length;
  }
}

export const onboardingService = OnboardingService.getInstance();
