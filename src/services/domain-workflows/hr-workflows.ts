/**
 * HR Domain Workflows
 * Recruitment Pipeline, Onboarding, Performance Review, Offboarding
 */

import { EventEmitter } from 'events';

export interface HRWorkflowStep {
  id: string;
  name: string;
  type: 'agent_task' | 'approval' | 'integration' | 'notification' | 'interview';
  agent?: string;
  config?: Record<string, any>;
  timeout?: number;
  onSuccess?: string;
  onFailure?: string;
}

export interface HRWorkflow {
  id: string;
  name: string;
  description: string;
  category: 'recruitment' | 'onboarding' | 'performance' | 'offboarding';
  romaLevel: 1 | 2 | 3 | 4;
  steps: HRWorkflowStep[];
  triggers: string[];
  estimatedDuration: number;
}

const hrWorkflows: HRWorkflow[] = [
  {
    id: 'recruitment-pipeline',
    name: 'Recruitment Pipeline',
    description: 'End-to-end candidate sourcing, screening, and hiring',
    category: 'recruitment',
    romaLevel: 3,
    estimatedDuration: 168,
    triggers: ['job_posted', 'application_received', 'referral_submitted'],
    steps: [
      {
        id: 'rp-1',
        name: 'Source Candidates',
        type: 'agent_task',
        agent: 'recruiter-agent',
        config: { platforms: ['linkedin', 'indeed', 'glassdoor'], matchScore: 0.7 },
        onSuccess: 'rp-2'
      },
      {
        id: 'rp-2',
        name: 'Screen Resumes',
        type: 'agent_task',
        agent: 'recruiter-agent',
        config: { useAI: true, extractSkills: true, scoreThreshold: 70 },
        onSuccess: 'rp-3',
        onFailure: 'rp-reject'
      },
      {
        id: 'rp-3',
        name: 'Initial Screening Call',
        type: 'agent_task',
        agent: 'recruiter-agent',
        config: { duration: 30, questions: 'screening_template' },
        onSuccess: 'rp-4',
        onFailure: 'rp-reject'
      },
      {
        id: 'rp-4',
        name: 'Technical Assessment',
        type: 'integration',
        config: { platform: 'hackerrank', testType: 'role_specific' },
        timeout: 72,
        onSuccess: 'rp-5',
        onFailure: 'rp-reject'
      },
      {
        id: 'rp-5',
        name: 'Schedule Interviews',
        type: 'agent_task',
        agent: 'onboarding-agent',
        config: { calendar: 'google', interviewers: ['hiring_manager', 'team_lead'] },
        onSuccess: 'rp-6'
      },
      {
        id: 'rp-6',
        name: 'Hiring Manager Interview',
        type: 'interview',
        config: { type: 'behavioral', duration: 60 },
        onSuccess: 'rp-7',
        onFailure: 'rp-reject'
      },
      {
        id: 'rp-7',
        name: 'Team Fit Interview',
        type: 'interview',
        config: { type: 'culture', duration: 45 },
        onSuccess: 'rp-8',
        onFailure: 'rp-reject'
      },
      {
        id: 'rp-8',
        name: 'Reference Check',
        type: 'agent_task',
        agent: 'recruiter-agent',
        config: { minReferences: 2, verifyEmployment: true },
        onSuccess: 'rp-9'
      },
      {
        id: 'rp-9',
        name: 'Hiring Decision',
        type: 'approval',
        agent: 'chro-agent',
        config: { requireConsensus: true, escalateToExec: true },
        timeout: 48,
        onSuccess: 'rp-10',
        onFailure: 'rp-reject'
      },
      {
        id: 'rp-10',
        name: 'Generate Offer',
        type: 'agent_task',
        agent: 'recruiter-agent',
        config: { template: 'offer_letter', includeBenefits: true },
        onSuccess: 'rp-11'
      },
      {
        id: 'rp-11',
        name: 'Send Offer',
        type: 'notification',
        config: { channel: 'email', template: 'offer_delivery', signatureRequired: true },
        onSuccess: 'rp-complete'
      }
    ]
  },
  {
    id: 'onboarding-workflow',
    name: 'Employee Onboarding',
    description: 'Comprehensive new hire onboarding process',
    category: 'onboarding',
    romaLevel: 2,
    estimatedDuration: 336,
    triggers: ['offer_accepted', 'start_date_approaching'],
    steps: [
      {
        id: 'ob-1',
        name: 'Pre-boarding Setup',
        type: 'agent_task',
        agent: 'onboarding-agent',
        config: { setupIT: true, createAccounts: true, orderEquipment: true },
        onSuccess: 'ob-2'
      },
      {
        id: 'ob-2',
        name: 'Welcome Package',
        type: 'notification',
        config: { channel: 'email', template: 'welcome_package', attachments: ['handbook', 'policies'] },
        onSuccess: 'ob-3'
      },
      {
        id: 'ob-3',
        name: 'Day 1 Orientation',
        type: 'agent_task',
        agent: 'onboarding-agent',
        config: { meetTeam: true, officeIntro: true, cultureSession: true },
        onSuccess: 'ob-4'
      },
      {
        id: 'ob-4',
        name: 'IT Setup & Training',
        type: 'agent_task',
        agent: 'onboarding-agent',
        config: { toolTraining: true, securityTraining: true, accessProvisioning: true },
        onSuccess: 'ob-5'
      },
      {
        id: 'ob-5',
        name: 'Role-Specific Training',
        type: 'agent_task',
        agent: 'onboarding-agent',
        config: { assignMentor: true, trainingPlan: 'role_specific', milestones: true },
        onSuccess: 'ob-6'
      },
      {
        id: 'ob-6',
        name: 'Week 1 Check-in',
        type: 'agent_task',
        agent: 'hr-analytics-agent',
        config: { survey: true, feedbackCollection: true },
        onSuccess: 'ob-7'
      },
      {
        id: 'ob-7',
        name: '30-Day Review',
        type: 'approval',
        config: { role: 'hiring_manager', metrics: ['performance', 'integration', 'satisfaction'] },
        timeout: 720,
        onSuccess: 'ob-8'
      },
      {
        id: 'ob-8',
        name: '90-Day Review',
        type: 'approval',
        config: { role: 'hiring_manager', metrics: ['goals', 'culture_fit', 'feedback'] },
        timeout: 2160,
        onSuccess: 'ob-complete'
      }
    ]
  },
  {
    id: 'performance-review',
    name: 'Performance Review Cycle',
    description: 'Quarterly/annual performance evaluation process',
    category: 'performance',
    romaLevel: 2,
    estimatedDuration: 168,
    triggers: ['quarter_end', 'annual_review', 'promotion_request'],
    steps: [
      {
        id: 'pr-1',
        name: 'Self Assessment',
        type: 'notification',
        config: { channel: 'email', template: 'self_assessment_request', deadline: 7 },
        onSuccess: 'pr-2'
      },
      {
        id: 'pr-2',
        name: 'Collect 360 Feedback',
        type: 'agent_task',
        agent: 'hr-analytics-agent',
        config: { peers: true, directReports: true, crossFunctional: true },
        timeout: 120,
        onSuccess: 'pr-3'
      },
      {
        id: 'pr-3',
        name: 'Analyze Performance Data',
        type: 'agent_task',
        agent: 'hr-analytics-agent',
        config: { metrics: ['goals', 'competencies', 'values'], trends: true },
        onSuccess: 'pr-4'
      },
      {
        id: 'pr-4',
        name: 'Manager Review',
        type: 'approval',
        config: { role: 'direct_manager', calibration: true },
        timeout: 72,
        onSuccess: 'pr-5'
      },
      {
        id: 'pr-5',
        name: 'Calibration Session',
        type: 'agent_task',
        agent: 'chro-agent',
        config: { crossTeam: true, fairnessCheck: true, ratingDistribution: true },
        onSuccess: 'pr-6'
      },
      {
        id: 'pr-6',
        name: 'Review Meeting',
        type: 'notification',
        config: { channel: 'calendar', template: 'review_meeting', duration: 60 },
        onSuccess: 'pr-7'
      },
      {
        id: 'pr-7',
        name: 'Document & Archive',
        type: 'integration',
        config: { system: 'hris', action: 'record_review' },
        onSuccess: 'pr-complete'
      }
    ]
  },
  {
    id: 'offboarding-workflow',
    name: 'Employee Offboarding',
    description: 'Structured employee exit process',
    category: 'offboarding',
    romaLevel: 2,
    estimatedDuration: 48,
    triggers: ['resignation_submitted', 'termination_initiated'],
    steps: [
      {
        id: 'of-1',
        name: 'Acknowledge Resignation',
        type: 'notification',
        config: { channel: 'email', template: 'resignation_acknowledgment' },
        onSuccess: 'of-2'
      },
      {
        id: 'of-2',
        name: 'Knowledge Transfer Plan',
        type: 'agent_task',
        agent: 'onboarding-agent',
        config: { documentTasks: true, identifySuccessor: true, transitionPlan: true },
        onSuccess: 'of-3'
      },
      {
        id: 'of-3',
        name: 'Exit Interview',
        type: 'agent_task',
        agent: 'hr-analytics-agent',
        config: { survey: true, feedbackAnalysis: true, trends: true },
        onSuccess: 'of-4'
      },
      {
        id: 'of-4',
        name: 'Revoke Access',
        type: 'integration',
        config: { systems: ['email', 'slack', 'github', 'aws'], immediate: false },
        onSuccess: 'of-5'
      },
      {
        id: 'of-5',
        name: 'Final Payroll',
        type: 'integration',
        config: { system: 'payroll', action: 'final_settlement', includePTO: true },
        onSuccess: 'of-6'
      },
      {
        id: 'of-6',
        name: 'Return Equipment',
        type: 'agent_task',
        agent: 'onboarding-agent',
        config: { trackAssets: true, shippingLabel: true },
        onSuccess: 'of-7'
      },
      {
        id: 'of-7',
        name: 'Alumni Network',
        type: 'notification',
        config: { channel: 'email', template: 'alumni_welcome', optIn: true },
        onSuccess: 'of-complete'
      }
    ]
  }
];

class HRWorkflowService extends EventEmitter {
  private static instance: HRWorkflowService;
  private workflows: Map<string, HRWorkflow> = new Map();
  private activeExecutions: Map<string, any> = new Map();

  private constructor() {
    super();
    hrWorkflows.forEach(w => this.workflows.set(w.id, w));
    console.log(`👥 HR Workflow Service initialized with ${hrWorkflows.length} workflows`);
  }

  static getInstance(): HRWorkflowService {
    if (!HRWorkflowService.instance) {
      HRWorkflowService.instance = new HRWorkflowService();
    }
    return HRWorkflowService.instance;
  }

  getWorkflows(): HRWorkflow[] {
    return Array.from(this.workflows.values());
  }

  getWorkflow(id: string): HRWorkflow | undefined {
    return this.workflows.get(id);
  }

  async executeWorkflow(workflowId: string, context: Record<string, any>): Promise<any> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const execution = {
      id: executionId,
      workflowId,
      status: 'running',
      currentStep: 0,
      context,
      startedAt: new Date().toISOString(),
      steps: workflow.steps.map(s => ({ ...s, status: 'pending' })),
    };

    this.activeExecutions.set(executionId, execution);
    this.emit('workflow:started', execution);

    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      execution.currentStep = i;
      execution.steps[i].status = 'running';
      this.emit('step:started', { executionId, step });

      try {
        await this.executeStep(step, context);
        execution.steps[i].status = 'completed';
        this.emit('step:completed', { executionId, step });
      } catch (error: any) {
        execution.steps[i].status = 'failed';
        execution.status = 'failed';
        this.emit('step:failed', { executionId, step, error: error.message });
        throw error;
      }
    }

    execution.status = 'completed';
    execution.completedAt = new Date().toISOString();
    this.emit('workflow:completed', execution);

    return execution;
  }

  private async executeStep(step: HRWorkflowStep, context: Record<string, any>): Promise<void> {
    switch (step.type) {
      case 'agent_task':
        console.log(`  → Executing agent task: ${step.name} with ${step.agent}`);
        await new Promise(resolve => setTimeout(resolve, 100));
        break;
      case 'approval':
        console.log(`  → Requesting approval: ${step.name}`);
        await new Promise(resolve => setTimeout(resolve, 50));
        break;
      case 'integration':
        console.log(`  → Integration: ${step.name}`);
        await new Promise(resolve => setTimeout(resolve, 100));
        break;
      case 'notification':
        console.log(`  → Notification: ${step.name} via ${step.config?.channel}`);
        await new Promise(resolve => setTimeout(resolve, 50));
        break;
      case 'interview':
        console.log(`  → Interview scheduled: ${step.name}`);
        await new Promise(resolve => setTimeout(resolve, 50));
        break;
    }
  }

  getActiveExecutions(): any[] {
    return Array.from(this.activeExecutions.values());
  }
}

export const hrWorkflowService = HRWorkflowService.getInstance();
