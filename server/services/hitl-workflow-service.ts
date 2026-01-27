/**
 * Human-in-the-Loop Workflow Service - Phase 3
 * Approval workflows, escalation, and human-AI collaboration
 * 
 * Features:
 * - Multi-level approval workflows
 * - Confidence-based escalation
 * - Human takeover and feedback loops
 * - Visual workflow designer integration
 * - Notification and reminder system
 */

import { EventEmitter } from 'events';
import { db } from '../db';
import { hitlWorkflows, hitlWorkflowExecutions, HitlWorkflow, HitlWorkflowExecution } from '@shared/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'agent-action' | 'human-approval' | 'human-review' | 'conditional' | 'parallel';
  config: Record<string, any>;
  nextSteps: {
    onApprove?: string;
    onReject?: string;
    onTimeout?: string;
    conditions?: Array<{ condition: string; nextStep: string }>;
  };
}

export interface WorkflowCreationRequest {
  name: string;
  description?: string;
  ownerId: string;
  workflowType: 'approval' | 'review' | 'escalation' | 'delegation' | 'collaborative';
  triggerConditions?: any[];
  steps: WorkflowStep[];
  requiredApprovers?: string[];
  escalationTimeoutMinutes?: number;
  autoApproveThreshold?: number;
  requireReviewThreshold?: number;
}

export interface WorkflowExecutionRequest {
  workflowId: string;
  triggeredBy: string;
  triggerType: 'agent-request' | 'threshold-breach' | 'manual' | 'scheduled';
  triggerContext: Record<string, any>;
  agentConfidence?: number;
}

export interface ApprovalDecision {
  executionId: string;
  approverId: string;
  decision: 'approved' | 'rejected' | 'modified' | 'escalated';
  feedback?: string;
  modifiedAction?: any;
}

class HitlWorkflowService extends EventEmitter {
  private static instance: HitlWorkflowService;
  private activeExecutions: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {
    super();
    console.log('🔄 HITL Workflow Service initialized');
  }

  public static getInstance(): HitlWorkflowService {
    if (!HitlWorkflowService.instance) {
      HitlWorkflowService.instance = new HitlWorkflowService();
    }
    return HitlWorkflowService.instance;
  }

  async createWorkflow(request: WorkflowCreationRequest): Promise<HitlWorkflow> {
    const workflowId = `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const workflowData = {
      workflowId,
      name: request.name,
      description: request.description,
      ownerId: request.ownerId,
      workflowType: request.workflowType,
      triggerConditions: request.triggerConditions || [],
      steps: request.steps,
      currentStep: 0,
      requiredApprovers: request.requiredApprovers || [],
      escalationEnabled: true,
      escalationTimeoutMinutes: request.escalationTimeoutMinutes || 60,
      escalationPath: [],
      autoApproveThreshold: request.autoApproveThreshold || 0.95,
      requireReviewThreshold: request.requireReviewThreshold || 0.7,
      notificationChannels: ['email', 'in-app'],
      status: 'active',
    };

    const [workflow] = await db.insert(hitlWorkflows).values(workflowData).returning();

    this.emit('workflow-created', workflow);
    console.log(`✅ Created HITL workflow: ${workflow.name} (${workflowId})`);

    return workflow;
  }

  async getWorkflow(workflowId: string): Promise<HitlWorkflow | null> {
    const [workflow] = await db.select().from(hitlWorkflows).where(eq(hitlWorkflows.workflowId, workflowId));
    return workflow || null;
  }

  async getWorkflowsByOwner(ownerId: string): Promise<HitlWorkflow[]> {
    return db.select().from(hitlWorkflows).where(eq(hitlWorkflows.ownerId, ownerId));
  }

  async startExecution(request: WorkflowExecutionRequest): Promise<HitlWorkflowExecution> {
    const workflow = await this.getWorkflow(request.workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${request.workflowId} not found`);
    }

    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const shouldAutoApprove = request.agentConfidence && 
      request.agentConfidence >= (workflow.autoApproveThreshold || 0.95);
    
    const requiresReview = !shouldAutoApprove && request.agentConfidence && 
      request.agentConfidence >= (workflow.requireReviewThreshold || 0.7);

    const initialStatus = shouldAutoApprove ? 'approved' : 
      (requiresReview ? 'in_review' : 'pending');

    const executionData = {
      executionId,
      workflowId: request.workflowId,
      triggeredBy: request.triggeredBy,
      triggerType: request.triggerType,
      triggerContext: request.triggerContext,
      currentStep: 0,
      stepHistory: [],
      pendingApprovals: shouldAutoApprove ? [] : (workflow.requiredApprovers || []),
      receivedApprovals: [],
      agentConfidence: request.agentConfidence,
      humanDecision: shouldAutoApprove ? 'approved' : null,
      status: initialStatus,
    };

    const [execution] = await db.insert(hitlWorkflowExecutions).values(executionData).returning();

    if (initialStatus === 'pending' || initialStatus === 'in_review') {
      this.startEscalationTimer(execution, workflow);
    }

    this.emit('execution-started', { execution, shouldAutoApprove, requiresReview });
    console.log(`✅ Started workflow execution: ${executionId} (status: ${initialStatus})`);

    return execution;
  }

  private startEscalationTimer(execution: HitlWorkflowExecution, workflow: HitlWorkflow): void {
    const timeout = (workflow.escalationTimeoutMinutes || 60) * 60 * 1000;
    
    const timer = setTimeout(async () => {
      await this.escalateExecution(execution.executionId);
    }, timeout);

    this.activeExecutions.set(execution.executionId, timer);
  }

  async escalateExecution(executionId: string): Promise<HitlWorkflowExecution | null> {
    const [execution] = await db.update(hitlWorkflowExecutions)
      .set({
        status: 'escalated',
        humanDecision: 'escalated',
        updatedAt: new Date(),
      })
      .where(eq(hitlWorkflowExecutions.executionId, executionId))
      .returning();

    if (this.activeExecutions.has(executionId)) {
      clearTimeout(this.activeExecutions.get(executionId));
      this.activeExecutions.delete(executionId);
    }

    this.emit('execution-escalated', execution);
    return execution || null;
  }

  async submitDecision(decision: ApprovalDecision): Promise<HitlWorkflowExecution | null> {
    const [currentExecution] = await db.select()
      .from(hitlWorkflowExecutions)
      .where(eq(hitlWorkflowExecutions.executionId, decision.executionId));

    if (!currentExecution) {
      throw new Error(`Execution ${decision.executionId} not found`);
    }

    const receivedApprovals = (currentExecution.receivedApprovals as any[]) || [];
    receivedApprovals.push({
      approverId: decision.approverId,
      decision: decision.decision,
      feedback: decision.feedback,
      timestamp: new Date().toISOString(),
    });

    const pendingApprovals = ((currentExecution.pendingApprovals as string[]) || [])
      .filter(id => id !== decision.approverId);

    const allApproved = pendingApprovals.length === 0 && 
      receivedApprovals.every((a: any) => a.decision === 'approved' || a.decision === 'modified');

    const anyRejected = receivedApprovals.some((a: any) => a.decision === 'rejected');

    let newStatus = currentExecution.status;
    if (allApproved) {
      newStatus = 'approved';
    } else if (anyRejected) {
      newStatus = 'rejected';
    } else if (decision.decision === 'escalated') {
      newStatus = 'escalated';
    }

    const [execution] = await db.update(hitlWorkflowExecutions)
      .set({
        receivedApprovals,
        pendingApprovals,
        humanDecision: decision.decision,
        humanFeedback: decision.feedback,
        modifiedAction: decision.modifiedAction,
        status: newStatus,
        completedAt: ['approved', 'rejected'].includes(newStatus) ? new Date() : null,
        timeToDecision: Date.now() - currentExecution.startedAt!.getTime(),
        updatedAt: new Date(),
      })
      .where(eq(hitlWorkflowExecutions.executionId, decision.executionId))
      .returning();

    if (this.activeExecutions.has(decision.executionId)) {
      clearTimeout(this.activeExecutions.get(decision.executionId));
      this.activeExecutions.delete(decision.executionId);
    }

    this.emit('decision-submitted', { execution, decision });
    return execution || null;
  }

  async getExecution(executionId: string): Promise<HitlWorkflowExecution | null> {
    const [execution] = await db.select()
      .from(hitlWorkflowExecutions)
      .where(eq(hitlWorkflowExecutions.executionId, executionId));
    return execution || null;
  }

  async getPendingExecutions(approverId: string): Promise<HitlWorkflowExecution[]> {
    const allPending = await db.select()
      .from(hitlWorkflowExecutions)
      .where(eq(hitlWorkflowExecutions.status, 'pending'))
      .orderBy(desc(hitlWorkflowExecutions.startedAt));

    return allPending.filter(exec => {
      const pending = (exec.pendingApprovals as string[]) || [];
      return pending.includes(approverId);
    });
  }

  async getExecutionHistory(workflowId: string, limit: number = 50): Promise<HitlWorkflowExecution[]> {
    return db.select()
      .from(hitlWorkflowExecutions)
      .where(eq(hitlWorkflowExecutions.workflowId, workflowId))
      .orderBy(desc(hitlWorkflowExecutions.startedAt))
      .limit(limit);
  }

  async shouldRequireApproval(
    agentId: string, 
    actionType: string, 
    confidence: number, 
    context: Record<string, any>
  ): Promise<{
    requiresApproval: boolean;
    reason: string;
    suggestedWorkflowType: string;
  }> {
    if (confidence < 0.5) {
      return {
        requiresApproval: true,
        reason: 'Low confidence action requires human review',
        suggestedWorkflowType: 'review',
      };
    }

    const highRiskActions = ['delete', 'payment', 'publish', 'deploy', 'terminate'];
    if (highRiskActions.some(a => actionType.toLowerCase().includes(a))) {
      return {
        requiresApproval: true,
        reason: 'High-risk action requires explicit approval',
        suggestedWorkflowType: 'approval',
      };
    }

    if (context.amount && context.amount > 1000) {
      return {
        requiresApproval: true,
        reason: 'High-value transaction requires approval',
        suggestedWorkflowType: 'approval',
      };
    }

    return {
      requiresApproval: false,
      reason: 'Action within autonomous execution parameters',
      suggestedWorkflowType: 'none',
    };
  }

  async createQuickApprovalWorkflow(
    ownerId: string,
    name: string,
    approvers: string[],
    timeoutMinutes: number = 60
  ): Promise<HitlWorkflow> {
    return this.createWorkflow({
      name,
      ownerId,
      workflowType: 'approval',
      steps: [
        {
          id: 'approval-step',
          name: 'Approval Required',
          type: 'human-approval',
          config: { approvers },
          nextSteps: {
            onApprove: 'complete',
            onReject: 'rejected',
            onTimeout: 'escalate',
          },
        },
      ],
      requiredApprovers: approvers,
      escalationTimeoutMinutes: timeoutMinutes,
    });
  }
}

export const hitlWorkflowService = HitlWorkflowService.getInstance();
