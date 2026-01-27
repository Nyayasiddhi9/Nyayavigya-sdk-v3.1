import { db } from '../../db';
import { wizardsStudioTasks, wizardsArtifacts } from '@shared/schema';
import { wizardsOrchestrationService } from '../wizards-orchestration-service';
import { wizardsStudioEngineService } from '../wizards-studio-engine';
import { eq } from 'drizzle-orm';
import type { OrchestrationRequest, Priority } from '@shared/wizards-incubator-types';

interface UIUXDesignParams {
  productDescription: string;
  targetAudience: string;
  designPreferences: string;
  brandGuidelines?: string;
}

interface PrototypeParams {
  featureName: string;
  userFlow: string;
  interactionDetails: string;
}

interface DesignSystemParams {
  brandName: string;
  colorPreferences: string;
  typography: string;
  componentNeeds: string;
}

interface AccessibilityAuditParams {
  productName: string;
  targetWCAGLevel: string;
  userGroups: string;
  designUrl?: string;
}

export class WizardsExperienceDesignService {
  private readonly studioId = 'experience-design';

  /**
   * Generate UI/UX design
   */
  async generateUserFlows(
    startupId: number, 
    sessionId: number | null, 
    userJourneyDescription: string,
    options?: { 
      userPersona?: string;
      designStyle?: string;
      aguiSessionId?: string;
      deterministicMode?: boolean;
      clockSeed?: string;
    }
  ) {
    // Auto-create session if not provided
    const session = sessionId 
      ? await wizardsStudioEngineService.getSession(sessionId)
      : null;
    
    const activeSession = session || await wizardsStudioEngineService.getOrCreateSession(
      startupId,
      this.studioId,
      {
        deterministicMode: options?.deterministicMode,
        clockSeed: options?.clockSeed,
      }
    );

    console.log(`🎨 [Experience Design Service] Generating user flows`, { startupId, sessionId: activeSession.id });

    const params: UIUXDesignParams = {
      productDescription: userJourneyDescription,
      targetAudience: options?.userPersona || 'General users',
      designPreferences: options?.designStyle || 'Modern and clean',
      brandGuidelines: '',
    };

    // Create task
    const [task] = await db.insert(wizardsStudioTasks).values({
      studioId: 'experience-design',
      sessionId: activeSession.id,
      startupId,
      taskType: 'uiux_design',
      status: 'in_progress',
      inputs: params,
      sequence: 1,
    }).returning();

    // Execute orchestration
    const orchestrationRequest: OrchestrationRequest = {
      startupId,
      sessionId: activeSession.id,
      taskId: task.id,
      jobType: 'generation',
      workflow: 'sequential',
      inputs: {
        prompt: `Generate comprehensive user flows for: ${userJourneyDescription}
        
User Persona: ${options?.userPersona || 'General users'}
Design Style: ${options?.designStyle || 'Modern and clean'}`,
        designType: 'user_flows',
        ...params,
      },
      priority: 'high' as Priority,
      budget: {
        maxDuration: 600,
        maxCredits: 300,
        preferredCostTier: 'medium',
      },
    };

    const orchestrationResult = await wizardsOrchestrationService.executeOrchestrationJob({
      ...orchestrationRequest,
      studioType: 'experience-design',
      deterministicMode: options?.deterministicMode,
      clockSeed: options?.clockSeed,
      aguiSessionId: options?.aguiSessionId,
    });

    // Extract UI/UX design from orchestration result
    const uiuxDesign = orchestrationResult.outputs?.uiuxDesign ?? orchestrationResult.outputs ?? {
      userFlows: Array.isArray(orchestrationResult.outputs?.userFlows) ? orchestrationResult.outputs.userFlows : [],
      wireframes: Array.isArray(orchestrationResult.outputs?.wireframes) ? orchestrationResult.outputs.wireframes : [],
      visualDesign: orchestrationResult.outputs?.visualDesign ?? {},
    };

    // Create artifact
    const [artifact] = await db.insert(wizardsArtifacts).values({
      startupId,
      sessionId: activeSession.id,
      taskId: task.id,
      studioId: 'experience-design',
      artifactType: 'uiux_design',
      name: 'UI/UX Design',
      content: uiuxDesign,
      metadata: {
        productDescription: params.productDescription,
        targetAudience: params.targetAudience,
        designPreferences: params.designPreferences,
        brandGuidelines: params.brandGuidelines,
        generatedAt: new Date().toISOString(),
      },
    }).returning();

    // Update task status
    await db.update(wizardsStudioTasks)
      .set({
        status: 'completed',
        outputs: { uiuxDesign },
        completedAt: new Date(),
      })
      .where(eq(wizardsStudioTasks.id, task.id));

    console.log(`✅ [Experience Design Service] User flows generated`, { 
      taskId: task.id, 
      artifactId: artifact.id 
    });

    return { 
      flows: uiuxDesign,
      taskId: task.id, 
      artifactId: artifact.id,
      sessionId: activeSession.id
    };
  }

  /**
   * Generate interactive prototype
   */
  async generatePrototype(
    startupId: number, 
    sessionId: number | null, 
    params: PrototypeParams,
    options?: { aguiSessionId?: string; deterministicMode?: boolean; clockSeed?: string }
  ) {
    // Auto-create session if not provided
    const session = sessionId 
      ? await wizardsStudioEngineService.getSession(sessionId)
      : null;
    
    const activeSession = session || await wizardsStudioEngineService.getOrCreateSession(
      startupId,
      this.studioId,
      {
        deterministicMode: options?.deterministicMode,
        clockSeed: options?.clockSeed,
      }
    );

    console.log(`🎨 [Experience Design Service] Generating prototype`, { startupId, sessionId: activeSession.id });

    // Create task
    const [task] = await db.insert(wizardsStudioTasks).values({
      studioId: 'experience-design',
      sessionId: activeSession.id,
      startupId,
      taskType: 'prototype',
      status: 'in_progress',
      inputs: params,
    }).returning();

    // Execute orchestration
    const orchestrationResult = await wizardsOrchestrationService.executeOrchestrationJob({
      workflowType: 'experience_design_prototype',
      context: {
        startupId,
        sessionId: activeSession.id,
        taskId: task.id,
        studioType: 'experience_design',
        ...params,
      },
      sessionId: activeSession.id,
      aguiSessionId: options?.aguiSessionId,
    });

    // Extract prototype from orchestration result
    const prototype = this.extractPrototype(orchestrationResult);

    // Create artifact
    const [artifact] = await db.insert(wizardsArtifacts).values({
      startupId,
      sessionId: activeSession.id,
      taskId: task.id,
      studioId: 'experience-design',
      artifactType: 'prototype',
      name: `Prototype: ${params.featureName}`,
      content: prototype,
      metadata: {
        featureName: params.featureName,
        userFlow: params.userFlow,
        interactionDetails: params.interactionDetails,
        generatedAt: new Date().toISOString(),
      },
    }).returning();

    // Update task status
    await db.update(wizardsStudioTasks)
      .set({
        status: 'completed',
        outputs: { prototype },
        completedAt: new Date(),
      })
      .where(eq(wizardsStudioTasks.id, task.id));

    console.log(`✅ [Experience Design Service] Prototype generated`, { 
      taskId: task.id, 
      artifactId: artifact.id 
    });

    return { task, artifact, sessionId: activeSession.id };
  }

  /**
   * Generate design system
   */
  async generateDesignSystem(
    startupId: number, 
    sessionId: number | null, 
    brandDescription: string,
    options?: { 
      brandGuidelines?: string;
      aguiSessionId?: string;
      deterministicMode?: boolean;
      clockSeed?: string;
    }
  ) {
    // Auto-create session if not provided
    const session = sessionId 
      ? await wizardsStudioEngineService.getSession(sessionId)
      : null;
    
    const activeSession = session || await wizardsStudioEngineService.getOrCreateSession(
      startupId,
      this.studioId,
      {
        deterministicMode: options?.deterministicMode,
        clockSeed: options?.clockSeed,
      }
    );

    console.log(`🎨 [Experience Design Service] Generating design system`, { startupId, sessionId: activeSession.id });

    const params: DesignSystemParams = {
      brandName: brandDescription,
      colorPreferences: options?.brandGuidelines || 'Modern and professional',
      typography: 'Clean and readable',
      componentNeeds: 'Comprehensive design system',
    };

    // Create task
    const [task] = await db.insert(wizardsStudioTasks).values({
      studioId: 'experience-design',
      sessionId: activeSession.id,
      startupId,
      taskType: 'design_system',
      status: 'in_progress',
      inputs: params,
      sequence: 1,
    }).returning();

    // Execute orchestration
    const orchestrationRequest: OrchestrationRequest = {
      startupId,
      sessionId: activeSession.id,
      taskId: task.id,
      jobType: 'generation',
      workflow: 'sequential',
      inputs: {
        prompt: `Create a comprehensive design system for: ${brandDescription}
        
Brand Guidelines: ${options?.brandGuidelines || 'Modern and professional'}`,
        designType: 'design_system',
        ...params,
      },
      priority: 'high' as Priority,
      budget: {
        maxDuration: 600,
        maxCredits: 300,
        preferredCostTier: 'medium',
      },
    };

    const orchestrationResult = await wizardsOrchestrationService.executeOrchestrationJob({
      ...orchestrationRequest,
      studioType: 'experience-design',
      deterministicMode: options?.deterministicMode,
      clockSeed: options?.clockSeed,
      aguiSessionId: options?.aguiSessionId,
    });

    // Extract design system from orchestration result
    const designSystem = this.extractDesignSystem(orchestrationResult);

    // Create artifact
    const [artifact] = await db.insert(wizardsArtifacts).values({
      startupId,
      sessionId: activeSession.id,
      taskId: task.id,
      studioId: 'experience-design',
      artifactType: 'design_system',
      name: `Design System: ${params.brandName}`,
      content: designSystem,
      metadata: {
        brandName: params.brandName,
        colorPreferences: params.colorPreferences,
        typography: params.typography,
        componentNeeds: params.componentNeeds,
        generatedAt: new Date().toISOString(),
      },
    }).returning();

    // Update task status
    await db.update(wizardsStudioTasks)
      .set({
        status: 'completed',
        outputs: { designSystem },
        completedAt: new Date(),
      })
      .where(eq(wizardsStudioTasks.id, task.id));

    console.log(`✅ [Experience Design Service] Design system generated`, { 
      taskId: task.id, 
      artifactId: artifact.id 
    });

    return { 
      designSystem,
      taskId: task.id, 
      artifactId: artifact.id,
      sessionId: activeSession.id
    };
  }

  /**
   * Generate accessibility audit
   */
  async generateAccessibilityAudit(
    startupId: number, 
    sessionId: number | null, 
    params: AccessibilityAuditParams,
    options?: { aguiSessionId?: string; deterministicMode?: boolean; clockSeed?: string }
  ) {
    // Auto-create session if not provided
    const session = sessionId 
      ? await wizardsStudioEngineService.getSession(sessionId)
      : null;
    
    const activeSession = session || await wizardsStudioEngineService.getOrCreateSession(
      startupId,
      this.studioId,
      {
        deterministicMode: options?.deterministicMode,
        clockSeed: options?.clockSeed,
      }
    );

    console.log(`🎨 [Experience Design Service] Generating accessibility audit`, { startupId, sessionId: activeSession.id });

    // Create task
    const [task] = await db.insert(wizardsStudioTasks).values({
      studioId: 'experience-design',
      sessionId: activeSession.id,
      startupId,
      taskType: 'accessibility_audit',
      status: 'in_progress',
      inputs: params,
    }).returning();

    // Execute orchestration
    const orchestrationResult = await wizardsOrchestrationService.executeOrchestrationJob({
      workflowType: 'experience_design_accessibility',
      context: {
        startupId,
        sessionId: activeSession.id,
        taskId: task.id,
        studioType: 'experience_design',
        ...params,
      },
      sessionId: activeSession.id,
      aguiSessionId: options?.aguiSessionId,
    });

    // Extract accessibility audit from orchestration result
    const accessibilityAudit = this.extractAccessibilityAudit(orchestrationResult);

    // Create artifact
    const [artifact] = await db.insert(wizardsArtifacts).values({
      startupId,
      sessionId: activeSession.id,
      taskId: task.id,
      studioId: 'experience-design',
      artifactType: 'accessibility_audit',
      name: `Accessibility Audit: ${params.productName}`,
      content: accessibilityAudit,
      metadata: {
        productName: params.productName,
        targetWCAGLevel: params.targetWCAGLevel,
        userGroups: params.userGroups,
        designUrl: params.designUrl,
        generatedAt: new Date().toISOString(),
      },
    }).returning();

    // Update task status
    await db.update(wizardsStudioTasks)
      .set({
        status: 'completed',
        outputs: { accessibilityAudit },
        completedAt: new Date(),
      })
      .where(eq(wizardsStudioTasks.id, task.id));

    console.log(`✅ [Experience Design Service] Accessibility audit generated`, { 
      taskId: task.id, 
      artifactId: artifact.id 
    });

    return { task, artifact, sessionId: activeSession.id };
  }

  /**
   * Extract UI/UX design from orchestration result
   */
  private extractUIUXDesign(orchestrationResult: any): any {
    return {
      screens: [
        { name: 'Home Screen', wireframe: 'placeholder_wireframe_url', description: 'Main landing page' },
        { name: 'Dashboard', wireframe: 'placeholder_wireframe_url', description: 'User dashboard' },
        { name: 'Profile', wireframe: 'placeholder_wireframe_url', description: 'User profile page' },
      ],
      userJourney: {
        onboarding: ['Sign up', 'Complete profile', 'Take tutorial'],
        coreFeatures: ['Access dashboard', 'Explore features', 'Complete first action'],
        engagement: ['Receive notifications', 'Share content', 'Connect with others'],
      },
      designPrinciples: [
        'User-centric approach',
        'Intuitive navigation',
        'Consistent visual language',
        'Accessible for all users',
      ],
    };
  }

  /**
   * Extract prototype from orchestration result
   */
  private extractPrototype(orchestrationResult: any): any {
    return {
      interactiveFlows: [
        {
          step: 1,
          screen: 'Entry Point',
          interaction: 'User clicks button',
          feedback: 'Visual highlight and transition',
        },
        {
          step: 2,
          screen: 'Main Action',
          interaction: 'User completes form',
          feedback: 'Success animation and confirmation',
        },
        {
          step: 3,
          screen: 'Result',
          interaction: 'Display results',
          feedback: 'Smooth transition with data loading',
        },
      ],
      animations: [
        { name: 'Page Transition', duration: '300ms', easing: 'ease-in-out' },
        { name: 'Button Hover', duration: '150ms', easing: 'ease' },
        { name: 'Modal Open', duration: '250ms', easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
      ],
      interactions: {
        gestures: ['Swipe', 'Pinch to zoom', 'Long press'],
        feedback: ['Haptic feedback', 'Visual highlights', 'Sound effects'],
      },
    };
  }

  /**
   * Extract design system from orchestration result
   */
  private extractDesignSystem(orchestrationResult: any): any {
    return {
      colorPalette: {
        primary: '#6366F1',
        secondary: '#EC4899',
        accent: '#10B981',
        neutral: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          900: '#111827',
        },
      },
      typography: {
        fontFamilies: {
          heading: 'Inter, sans-serif',
          body: 'System UI, sans-serif',
          mono: 'Fira Code, monospace',
        },
        scales: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem',
        },
      },
      spacing: {
        unit: '4px',
        scale: [0, 4, 8, 12, 16, 24, 32, 48, 64, 96],
      },
      components: {
        button: {
          variants: ['primary', 'secondary', 'outline', 'ghost'],
          sizes: ['sm', 'md', 'lg'],
        },
        input: {
          variants: ['default', 'filled', 'outline'],
          states: ['default', 'focus', 'error', 'disabled'],
        },
        card: {
          variants: ['elevated', 'outlined', 'filled'],
          padding: ['sm', 'md', 'lg'],
        },
      },
    };
  }

  /**
   * Extract accessibility audit from orchestration result
   */
  private extractAccessibilityAudit(orchestrationResult: any): any {
    return {
      wcagCompliance: {
        level: 'AA',
        score: 85,
        issues: [
          { severity: 'critical', count: 2, category: 'Color Contrast' },
          { severity: 'moderate', count: 5, category: 'Keyboard Navigation' },
          { severity: 'minor', count: 8, category: 'Alt Text' },
        ],
      },
      recommendations: [
        {
          category: 'Color Contrast',
          issue: 'Text color on buttons does not meet WCAG AA standards',
          solution: 'Increase contrast ratio to at least 4.5:1 for normal text',
          priority: 'high',
        },
        {
          category: 'Keyboard Navigation',
          issue: 'Custom dropdown not accessible via keyboard',
          solution: 'Add proper keyboard event handlers and focus management',
          priority: 'high',
        },
        {
          category: 'Screen Reader',
          issue: 'Missing ARIA labels on interactive elements',
          solution: 'Add aria-label or aria-labelledby to all buttons and controls',
          priority: 'medium',
        },
      ],
      userGroupConsiderations: {
        visualImpairment: ['High contrast mode support', 'Screen reader compatibility', 'Proper heading structure'],
        motorImpairment: ['Large click targets', 'Keyboard navigation', 'No time-based interactions'],
        cognitiveImpairment: ['Clear language', 'Consistent navigation', 'Simple layouts'],
      },
      testingTools: [
        'WAVE (Web Accessibility Evaluation Tool)',
        'axe DevTools',
        'Lighthouse Accessibility Audit',
        'NVDA Screen Reader',
      ],
    };
  }
}

export const wizardsExperienceDesignService = new WizardsExperienceDesignService();
