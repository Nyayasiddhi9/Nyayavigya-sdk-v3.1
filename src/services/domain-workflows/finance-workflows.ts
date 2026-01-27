/**
 * Finance Domain Workflows
 * Quote-to-Cash, Budget Approval, Expense Management, Financial Reporting
 */

import { EventEmitter } from 'events';

export interface FinanceWorkflowStep {
  id: string;
  name: string;
  type: 'agent_task' | 'approval' | 'integration' | 'notification';
  agent?: string;
  config?: Record<string, any>;
  timeout?: number;
  onSuccess?: string;
  onFailure?: string;
}

export interface FinanceWorkflow {
  id: string;
  name: string;
  description: string;
  category: 'quote-to-cash' | 'budget-approval' | 'expense-management' | 'financial-reporting';
  romaLevel: 1 | 2 | 3 | 4;
  steps: FinanceWorkflowStep[];
  triggers: string[];
  estimatedDuration: number;
}

const financeWorkflows: FinanceWorkflow[] = [
  {
    id: 'quote-to-cash',
    name: 'Quote-to-Cash Workflow',
    description: 'Automated sales quote generation to cash collection',
    category: 'quote-to-cash',
    romaLevel: 3,
    estimatedDuration: 48,
    triggers: ['new_opportunity', 'quote_request', 'contract_signed'],
    steps: [
      {
        id: 'qtc-1',
        name: 'Generate Quote',
        type: 'agent_task',
        agent: 'sales-operations-agent',
        config: { template: 'standard_quote', includePricing: true },
        onSuccess: 'qtc-2',
        onFailure: 'qtc-escalate'
      },
      {
        id: 'qtc-2',
        name: 'Legal Review',
        type: 'agent_task',
        agent: 'contract-reviewer-agent',
        config: { reviewType: 'quote_terms', complianceCheck: true },
        onSuccess: 'qtc-3',
        onFailure: 'qtc-escalate'
      },
      {
        id: 'qtc-3',
        name: 'Pricing Approval',
        type: 'approval',
        agent: 'cfo-agent',
        config: { threshold: 10000, autoApproveBelow: 5000 },
        timeout: 24,
        onSuccess: 'qtc-4',
        onFailure: 'qtc-reject'
      },
      {
        id: 'qtc-4',
        name: 'Send Quote to Customer',
        type: 'notification',
        config: { channel: 'email', template: 'quote_delivery' },
        onSuccess: 'qtc-5'
      },
      {
        id: 'qtc-5',
        name: 'Generate Invoice',
        type: 'agent_task',
        agent: 'accounting-agent',
        config: { integration: 'stripe', generatePDF: true },
        onSuccess: 'qtc-6'
      },
      {
        id: 'qtc-6',
        name: 'Record Revenue',
        type: 'integration',
        config: { system: 'erp', action: 'record_revenue' },
        onSuccess: 'qtc-complete'
      }
    ]
  },
  {
    id: 'budget-approval',
    name: 'Budget Approval Workflow',
    description: 'Multi-level budget request and approval process',
    category: 'budget-approval',
    romaLevel: 2,
    estimatedDuration: 72,
    triggers: ['budget_request', 'quarterly_planning', 'project_initiation'],
    steps: [
      {
        id: 'ba-1',
        name: 'Validate Budget Request',
        type: 'agent_task',
        agent: 'financial-analyst-agent',
        config: { validateCategories: true, checkBudgetCodes: true },
        onSuccess: 'ba-2',
        onFailure: 'ba-reject'
      },
      {
        id: 'ba-2',
        name: 'Impact Analysis',
        type: 'agent_task',
        agent: 'financial-analyst-agent',
        config: { analyzeROI: true, compareBenchmarks: true },
        onSuccess: 'ba-3'
      },
      {
        id: 'ba-3',
        name: 'Department Head Approval',
        type: 'approval',
        config: { role: 'department_head', escalateAfter: 48 },
        timeout: 48,
        onSuccess: 'ba-4',
        onFailure: 'ba-reject'
      },
      {
        id: 'ba-4',
        name: 'CFO Approval',
        type: 'approval',
        agent: 'cfo-agent',
        config: { threshold: 50000, requireJustification: true },
        timeout: 72,
        onSuccess: 'ba-5',
        onFailure: 'ba-reject'
      },
      {
        id: 'ba-5',
        name: 'Allocate Budget',
        type: 'integration',
        config: { system: 'budget_management', action: 'allocate' },
        onSuccess: 'ba-complete'
      }
    ]
  },
  {
    id: 'expense-management',
    name: 'Expense Management Workflow',
    description: 'Automated expense submission and reimbursement',
    category: 'expense-management',
    romaLevel: 3,
    estimatedDuration: 24,
    triggers: ['expense_submitted', 'receipt_uploaded', 'travel_completed'],
    steps: [
      {
        id: 'em-1',
        name: 'Validate Expense',
        type: 'agent_task',
        agent: 'accounting-agent',
        config: { validateReceipts: true, checkPolicy: true, ocrExtract: true },
        onSuccess: 'em-2',
        onFailure: 'em-reject'
      },
      {
        id: 'em-2',
        name: 'Categorize Expense',
        type: 'agent_task',
        agent: 'financial-analyst-agent',
        config: { autoCatego: true, glCodeAssignment: true },
        onSuccess: 'em-3'
      },
      {
        id: 'em-3',
        name: 'Manager Approval',
        type: 'approval',
        config: { role: 'direct_manager', autoApproveBelow: 100 },
        timeout: 24,
        onSuccess: 'em-4',
        onFailure: 'em-reject'
      },
      {
        id: 'em-4',
        name: 'Process Reimbursement',
        type: 'integration',
        config: { system: 'payroll', action: 'reimburse' },
        onSuccess: 'em-5'
      },
      {
        id: 'em-5',
        name: 'Notify Employee',
        type: 'notification',
        config: { channel: 'email', template: 'reimbursement_complete' },
        onSuccess: 'em-complete'
      }
    ]
  },
  {
    id: 'financial-reporting',
    name: 'Financial Reporting Workflow',
    description: 'Automated financial report generation and distribution',
    category: 'financial-reporting',
    romaLevel: 3,
    estimatedDuration: 8,
    triggers: ['month_end', 'quarter_end', 'report_request'],
    steps: [
      {
        id: 'fr-1',
        name: 'Gather Financial Data',
        type: 'agent_task',
        agent: 'financial-analyst-agent',
        config: { sources: ['erp', 'banking', 'invoicing'], dateRange: 'period' },
        onSuccess: 'fr-2'
      },
      {
        id: 'fr-2',
        name: 'Generate Report',
        type: 'agent_task',
        agent: 'financial-analyst-agent',
        config: { reportType: 'comprehensive', includeCharts: true },
        onSuccess: 'fr-3'
      },
      {
        id: 'fr-3',
        name: 'Compliance Check',
        type: 'agent_task',
        agent: 'compliance-agent',
        config: { standards: ['GAAP', 'SOX'], audit: true },
        onSuccess: 'fr-4',
        onFailure: 'fr-escalate'
      },
      {
        id: 'fr-4',
        name: 'CFO Review',
        type: 'approval',
        agent: 'cfo-agent',
        config: { reviewType: 'final_approval' },
        timeout: 24,
        onSuccess: 'fr-5'
      },
      {
        id: 'fr-5',
        name: 'Distribute Report',
        type: 'notification',
        config: { recipients: ['executives', 'board'], format: 'pdf' },
        onSuccess: 'fr-complete'
      }
    ]
  }
];

class FinanceWorkflowService extends EventEmitter {
  private static instance: FinanceWorkflowService;
  private workflows: Map<string, FinanceWorkflow> = new Map();
  private activeExecutions: Map<string, any> = new Map();

  private constructor() {
    super();
    financeWorkflows.forEach(w => this.workflows.set(w.id, w));
    console.log(`💰 Finance Workflow Service initialized with ${financeWorkflows.length} workflows`);
  }

  static getInstance(): FinanceWorkflowService {
    if (!FinanceWorkflowService.instance) {
      FinanceWorkflowService.instance = new FinanceWorkflowService();
    }
    return FinanceWorkflowService.instance;
  }

  getWorkflows(): FinanceWorkflow[] {
    return Array.from(this.workflows.values());
  }

  getWorkflow(id: string): FinanceWorkflow | undefined {
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

  private async executeStep(step: FinanceWorkflowStep, context: Record<string, any>): Promise<void> {
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
        console.log(`  → Integration: ${step.name} with ${step.config?.system}`);
        await new Promise(resolve => setTimeout(resolve, 100));
        break;
      case 'notification':
        console.log(`  → Notification: ${step.name} via ${step.config?.channel}`);
        await new Promise(resolve => setTimeout(resolve, 50));
        break;
    }
  }

  getActiveExecutions(): any[] {
    return Array.from(this.activeExecutions.values());
  }
}

export const financeWorkflowService = FinanceWorkflowService.getInstance();
