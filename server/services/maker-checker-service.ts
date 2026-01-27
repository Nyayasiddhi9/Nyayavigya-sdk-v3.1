/**
 * Maker-Checker Loop Service
 * 
 * Implements the Generator + Critic pattern with:
 * - Maker agent generates initial output
 * - Checker agent validates and critiques
 * - Conditional looping until quality threshold met
 * - Human escalation for stuck cases
 * - Audit trail for all decisions
 */

import { v4 as uuidv4 } from 'uuid';

export interface MakerOutput {
  id: string;
  content: string;
  metadata: Record<string, any>;
  confidence: number;
  reasoning?: string;
  alternatives?: string[];
}

export interface CheckerFeedback {
  id: string;
  makerOutputId: string;
  approved: boolean;
  score: number;
  issues: CheckerIssue[];
  suggestions: string[];
  reasoning: string;
  requiresHumanReview: boolean;
}

export interface CheckerIssue {
  type: 'accuracy' | 'completeness' | 'clarity' | 'safety' | 'relevance' | 'format';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location?: string;
  suggestedFix?: string;
}

export interface LoopIteration {
  iterationNumber: number;
  makerOutput: MakerOutput;
  checkerFeedback: CheckerFeedback;
  timestamp: Date;
  latencyMs: number;
}

export interface LoopResult {
  sessionId: string;
  originalPrompt: string;
  finalOutput: MakerOutput;
  iterations: LoopIteration[];
  totalIterations: number;
  approved: boolean;
  humanEscalated: boolean;
  humanDecision?: 'approved' | 'rejected' | 'modified';
  totalLatencyMs: number;
  qualityScore: number;
}

export interface LoopConfig {
  maxIterations: number;
  approvalThreshold: number;
  humanEscalationThreshold: number;
  criticalIssueEscalation: boolean;
  timeoutMs: number;
  enableParallelChecking: boolean;
}

export interface HumanReviewRequest {
  requestId: string;
  sessionId: string;
  prompt: string;
  makerOutput: MakerOutput;
  checkerFeedback: CheckerFeedback;
  iterations: LoopIteration[];
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
  deadline?: Date;
}

type MakerFunction = (prompt: string, feedback?: CheckerFeedback) => Promise<MakerOutput>;
type CheckerFunction = (prompt: string, output: MakerOutput) => Promise<CheckerFeedback>;

class MakerCheckerService {
  private activeSessions: Map<string, LoopResult> = new Map();
  private humanReviewQueue: Map<string, HumanReviewRequest> = new Map();
  private completedSessions: Map<string, LoopResult> = new Map();
  private auditLog: Map<string, any[]> = new Map();
  
  private config: LoopConfig = {
    maxIterations: 5,
    approvalThreshold: 0.85,
    humanEscalationThreshold: 3,
    criticalIssueEscalation: true,
    timeoutMs: 60000,
    enableParallelChecking: false
  };

  private defaultMaker: MakerFunction = async (prompt: string, feedback?: CheckerFeedback): Promise<MakerOutput> => {
    let content = `Generated response for: ${prompt}`;
    
    if (feedback && feedback.suggestions.length > 0) {
      content = `Revised response addressing feedback: ${feedback.suggestions.join(', ')}. Original: ${prompt}`;
    }
    
    return {
      id: uuidv4(),
      content,
      metadata: { generatedAt: new Date().toISOString() },
      confidence: feedback ? Math.min(0.95, 0.7 + (feedback.score * 0.3)) : 0.7,
      reasoning: feedback ? `Addressed ${feedback.issues.length} issues from previous iteration` : 'Initial generation'
    };
  };

  private defaultChecker: CheckerFunction = async (prompt: string, output: MakerOutput): Promise<CheckerFeedback> => {
    const issues: CheckerIssue[] = [];
    const suggestions: string[] = [];
    
    if (output.content.length < 50) {
      issues.push({
        type: 'completeness',
        severity: 'medium',
        description: 'Response may be too brief',
        suggestedFix: 'Provide more detailed explanation'
      });
      suggestions.push('Expand the response with more details');
    }
    
    if (!output.content.includes(prompt.split(' ')[0])) {
      issues.push({
        type: 'relevance',
        severity: 'low',
        description: 'Response may not directly address the query',
        suggestedFix: 'Reference key terms from the original prompt'
      });
    }
    
    const baseScore = 0.75;
    const issueDeduction = issues.reduce((sum, issue) => {
      const deductions = { low: 0.05, medium: 0.1, high: 0.2, critical: 0.4 };
      return sum + deductions[issue.severity];
    }, 0);
    
    const score = Math.max(0, baseScore - issueDeduction + (output.confidence * 0.2));
    
    const hasCriticalIssue = issues.some(i => i.severity === 'critical');
    
    return {
      id: uuidv4(),
      makerOutputId: output.id,
      approved: score >= this.config.approvalThreshold,
      score,
      issues,
      suggestions,
      reasoning: `Evaluated output with ${issues.length} issues found. Score: ${score.toFixed(2)}`,
      requiresHumanReview: hasCriticalIssue
    };
  };

  async runLoop(
    prompt: string,
    options: {
      makerFn?: MakerFunction;
      checkerFn?: CheckerFunction;
      config?: Partial<LoopConfig>;
      context?: Record<string, any>;
    } = {}
  ): Promise<LoopResult> {
    const sessionId = uuidv4();
    const startTime = Date.now();
    const sessionConfig = { ...this.config, ...options.config };
    
    const makerFn = options.makerFn || this.defaultMaker;
    const checkerFn = options.checkerFn || this.defaultChecker;
    
    const iterations: LoopIteration[] = [];
    let currentOutput: MakerOutput | null = null;
    let currentFeedback: CheckerFeedback | null = null;
    let approved = false;
    let humanEscalated = false;

    this.logAudit(sessionId, 'session_started', { prompt, config: sessionConfig });

    for (let i = 0; i < sessionConfig.maxIterations; i++) {
      const iterationStart = Date.now();

      if (Date.now() - startTime > sessionConfig.timeoutMs) {
        this.logAudit(sessionId, 'timeout', { iteration: i });
        break;
      }

      try {
        currentOutput = await makerFn(prompt, currentFeedback || undefined);
        this.logAudit(sessionId, 'maker_output', { iteration: i, outputId: currentOutput.id });
      } catch (error) {
        this.logAudit(sessionId, 'maker_error', { iteration: i, error: String(error) });
        throw error;
      }

      try {
        currentFeedback = await checkerFn(prompt, currentOutput);
        this.logAudit(sessionId, 'checker_feedback', { 
          iteration: i, 
          feedbackId: currentFeedback.id,
          approved: currentFeedback.approved,
          score: currentFeedback.score
        });
      } catch (error) {
        this.logAudit(sessionId, 'checker_error', { iteration: i, error: String(error) });
        throw error;
      }

      iterations.push({
        iterationNumber: i + 1,
        makerOutput: currentOutput,
        checkerFeedback: currentFeedback,
        timestamp: new Date(),
        latencyMs: Date.now() - iterationStart
      });

      if (currentFeedback.approved) {
        approved = true;
        this.logAudit(sessionId, 'approved', { iteration: i, score: currentFeedback.score });
        break;
      }

      if (currentFeedback.requiresHumanReview || 
          (sessionConfig.criticalIssueEscalation && 
           currentFeedback.issues.some(issue => issue.severity === 'critical'))) {
        humanEscalated = true;
        this.logAudit(sessionId, 'human_escalation', { 
          reason: 'critical_issue',
          iteration: i 
        });
        
        await this.createHumanReviewRequest(
          sessionId,
          prompt,
          currentOutput,
          currentFeedback,
          iterations,
          'Critical issue detected requiring human review'
        );
        break;
      }

      if (i >= sessionConfig.humanEscalationThreshold - 1 && !approved) {
        humanEscalated = true;
        this.logAudit(sessionId, 'human_escalation', { 
          reason: 'max_iterations_without_approval',
          iteration: i 
        });
        
        await this.createHumanReviewRequest(
          sessionId,
          prompt,
          currentOutput,
          currentFeedback,
          iterations,
          `Failed to achieve approval after ${i + 1} iterations`
        );
        break;
      }
    }

    const result: LoopResult = {
      sessionId,
      originalPrompt: prompt,
      finalOutput: currentOutput!,
      iterations,
      totalIterations: iterations.length,
      approved,
      humanEscalated,
      totalLatencyMs: Date.now() - startTime,
      qualityScore: currentFeedback?.score ?? 0
    };

    this.activeSessions.delete(sessionId);
    this.completedSessions.set(sessionId, result);
    this.logAudit(sessionId, 'session_completed', { 
      approved, 
      humanEscalated, 
      totalIterations: iterations.length 
    });

    return result;
  }

  private async createHumanReviewRequest(
    sessionId: string,
    prompt: string,
    output: MakerOutput,
    feedback: CheckerFeedback,
    iterations: LoopIteration[],
    reason: string
  ): Promise<HumanReviewRequest> {
    const hasCritical = feedback.issues.some(i => i.severity === 'critical');
    
    const request: HumanReviewRequest = {
      requestId: uuidv4(),
      sessionId,
      prompt,
      makerOutput: output,
      checkerFeedback: feedback,
      iterations,
      reason,
      priority: hasCritical ? 'urgent' : iterations.length >= 4 ? 'high' : 'medium',
      createdAt: new Date(),
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };

    this.humanReviewQueue.set(request.requestId, request);
    return request;
  }

  async submitHumanDecision(
    requestId: string,
    decision: 'approved' | 'rejected' | 'modified',
    modifiedContent?: string,
    notes?: string
  ): Promise<LoopResult | null> {
    const request = this.humanReviewQueue.get(requestId);
    if (!request) return null;

    const session = this.completedSessions.get(request.sessionId);
    if (!session) return null;

    session.humanDecision = decision;
    
    if (decision === 'approved') {
      session.approved = true;
    } else if (decision === 'modified' && modifiedContent) {
      session.finalOutput = {
        ...session.finalOutput,
        content: modifiedContent,
        metadata: {
          ...session.finalOutput.metadata,
          humanModified: true,
          humanNotes: notes
        }
      };
      session.approved = true;
    }

    this.logAudit(request.sessionId, 'human_decision', { 
      requestId, 
      decision, 
      notes 
    });

    this.humanReviewQueue.delete(requestId);
    return session;
  }

  getPendingHumanReviews(priority?: HumanReviewRequest['priority']): HumanReviewRequest[] {
    const reviews = Array.from(this.humanReviewQueue.values());
    
    if (priority) {
      return reviews.filter(r => r.priority === priority);
    }
    
    return reviews.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  getSession(sessionId: string): LoopResult | undefined {
    return this.completedSessions.get(sessionId) || this.activeSessions.get(sessionId);
  }

  getAuditLog(sessionId: string): any[] {
    return this.auditLog.get(sessionId) || [];
  }

  private logAudit(sessionId: string, event: string, data: Record<string, any>): void {
    if (!this.auditLog.has(sessionId)) {
      this.auditLog.set(sessionId, []);
    }
    
    this.auditLog.get(sessionId)!.push({
      timestamp: new Date().toISOString(),
      event,
      ...data
    });
  }

  updateConfig(newConfig: Partial<LoopConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getStats(): {
    activeSessions: number;
    completedSessions: number;
    pendingReviews: number;
    approvalRate: number;
    averageIterations: number;
    escalationRate: number;
  } {
    const completed = Array.from(this.completedSessions.values());
    const approved = completed.filter(s => s.approved).length;
    const escalated = completed.filter(s => s.humanEscalated).length;
    const avgIterations = completed.length > 0
      ? completed.reduce((sum, s) => sum + s.totalIterations, 0) / completed.length
      : 0;

    return {
      activeSessions: this.activeSessions.size,
      completedSessions: this.completedSessions.size,
      pendingReviews: this.humanReviewQueue.size,
      approvalRate: completed.length > 0 ? approved / completed.length : 0,
      averageIterations: avgIterations,
      escalationRate: completed.length > 0 ? escalated / completed.length : 0
    };
  }
}

export const makerCheckerService = new MakerCheckerService();
export default makerCheckerService;
