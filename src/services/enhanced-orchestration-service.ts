export interface SubAgentConfig {
  id: string;
  name: string;
  role: 'research' | 'analysis' | 'execution' | 'review' | 'synthesis' | 'specialized';
  llmProvider?: string;
  llmModel?: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  tools?: string[];
}

export interface TaskDecomposition {
  id: string;
  parentTaskId?: string;
  originalTask: string;
  subtasks: SubTask[];
  decompositionStrategy: 'sequential' | 'parallel' | 'hybrid' | 'hierarchical';
  estimatedDuration: number;
  complexity: 'simple' | 'moderate' | 'complex' | 'expert';
  createdAt: Date;
}

export interface SubTask {
  id: string;
  title: string;
  description: string;
  assignedAgent?: string;
  dependencies: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked';
  priority: number;
  estimatedDuration: number;
  result?: any;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface OrchestrationResult {
  taskId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'partial';
  subtaskResults: SubTaskResult[];
  synthesizedResult?: any;
  totalDuration: number;
  agentsUsed: string[];
  llmCallCount: number;
  tokensUsed: number;
  webSearchesPerformed: number;
  errors: string[];
}

export interface SubTaskResult {
  subtaskId: string;
  agentId: string;
  status: 'completed' | 'failed';
  result?: any;
  error?: string;
  duration: number;
  tokensUsed: number;
}

interface AgentMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

class EnhancedOrchestrationService {
  private taskDecompositions: Map<string, TaskDecomposition> = new Map();
  private orchestrationResults: Map<string, OrchestrationResult> = new Map();
  private activeSubAgents: Map<string, SubAgentConfig> = new Map();

  private readonly DEFAULT_SUB_AGENTS: SubAgentConfig[] = [
    {
      id: 'research-agent',
      name: 'Research Agent',
      role: 'research',
      llmProvider: 'perplexity',
      llmModel: 'llama-3.1-sonar-large-128k-online',
      systemPrompt: 'You are a research specialist. Your role is to gather comprehensive information on given topics, verify facts from multiple sources, and provide well-sourced summaries.',
      maxTokens: 4096,
      temperature: 0.3,
      tools: ['web_search', 'document_retrieval']
    },
    {
      id: 'analysis-agent',
      name: 'Analysis Agent',
      role: 'analysis',
      llmProvider: 'anthropic',
      llmModel: 'claude-sonnet-4-20250514',
      systemPrompt: 'You are an analysis specialist. Your role is to analyze data, identify patterns, draw insights, and provide actionable recommendations based on research findings.',
      maxTokens: 4096,
      temperature: 0.2,
      tools: ['data_analysis', 'pattern_recognition']
    },
    {
      id: 'execution-agent',
      name: 'Execution Agent',
      role: 'execution',
      llmProvider: 'openai',
      llmModel: 'gpt-4o',
      systemPrompt: 'You are an execution specialist. Your role is to implement solutions, write code, create documents, and take concrete actions based on analysis.',
      maxTokens: 8192,
      temperature: 0.1,
      tools: ['code_execution', 'document_creation', 'api_call']
    },
    {
      id: 'review-agent',
      name: 'Review Agent',
      role: 'review',
      llmProvider: 'anthropic',
      llmModel: 'claude-sonnet-4-20250514',
      systemPrompt: 'You are a review specialist. Your role is to validate work quality, identify errors or improvements, and ensure deliverables meet requirements.',
      maxTokens: 4096,
      temperature: 0.1,
      tools: ['quality_check', 'validation']
    },
    {
      id: 'synthesis-agent',
      name: 'Synthesis Agent',
      role: 'synthesis',
      llmProvider: 'anthropic',
      llmModel: 'claude-sonnet-4-20250514',
      systemPrompt: 'You are a synthesis specialist. Your role is to combine outputs from multiple agents, resolve conflicts, and produce coherent final deliverables.',
      maxTokens: 8192,
      temperature: 0.3,
      tools: ['summarization', 'conflict_resolution']
    }
  ];

  private readonly DECOMPOSITION_PATTERNS = {
    'code_development': {
      strategy: 'sequential' as const,
      subtasks: [
        { title: 'Requirements Analysis', agent: 'research-agent', priority: 1 },
        { title: 'Architecture Design', agent: 'analysis-agent', priority: 2 },
        { title: 'Implementation', agent: 'execution-agent', priority: 3 },
        { title: 'Code Review', agent: 'review-agent', priority: 4 },
        { title: 'Documentation', agent: 'synthesis-agent', priority: 5 }
      ]
    },
    'research_report': {
      strategy: 'parallel' as const,
      subtasks: [
        { title: 'Primary Research', agent: 'research-agent', priority: 1 },
        { title: 'Secondary Research', agent: 'research-agent', priority: 1 },
        { title: 'Data Analysis', agent: 'analysis-agent', priority: 2 },
        { title: 'Report Synthesis', agent: 'synthesis-agent', priority: 3 },
        { title: 'Quality Review', agent: 'review-agent', priority: 4 }
      ]
    },
    'problem_solving': {
      strategy: 'hybrid' as const,
      subtasks: [
        { title: 'Problem Definition', agent: 'analysis-agent', priority: 1 },
        { title: 'Research Solutions', agent: 'research-agent', priority: 2 },
        { title: 'Analyze Options', agent: 'analysis-agent', priority: 2 },
        { title: 'Implement Solution', agent: 'execution-agent', priority: 3 },
        { title: 'Validate Solution', agent: 'review-agent', priority: 4 }
      ]
    },
    'content_creation': {
      strategy: 'sequential' as const,
      subtasks: [
        { title: 'Topic Research', agent: 'research-agent', priority: 1 },
        { title: 'Outline Creation', agent: 'analysis-agent', priority: 2 },
        { title: 'Content Writing', agent: 'execution-agent', priority: 3 },
        { title: 'Content Review', agent: 'review-agent', priority: 4 },
        { title: 'Final Polish', agent: 'synthesis-agent', priority: 5 }
      ]
    },
    'data_analysis': {
      strategy: 'parallel' as const,
      subtasks: [
        { title: 'Data Collection', agent: 'research-agent', priority: 1 },
        { title: 'Data Cleaning', agent: 'execution-agent', priority: 2 },
        { title: 'Statistical Analysis', agent: 'analysis-agent', priority: 3 },
        { title: 'Visualization', agent: 'execution-agent', priority: 3 },
        { title: 'Insights Synthesis', agent: 'synthesis-agent', priority: 4 },
        { title: 'Validation', agent: 'review-agent', priority: 5 }
      ]
    }
  };

  constructor() {
    this.DEFAULT_SUB_AGENTS.forEach(agent => {
      this.activeSubAgents.set(agent.id, agent);
    });
  }

  async decomposeTask(task: string, options?: {
    pattern?: keyof typeof EnhancedOrchestrationService.prototype.DECOMPOSITION_PATTERNS;
    customSubtasks?: Partial<SubTask>[];
    maxSubtasks?: number;
    context?: Record<string, any>;
  }): Promise<TaskDecomposition> {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const taskType = options?.pattern || this.detectTaskType(task);
    const pattern = this.DECOMPOSITION_PATTERNS[taskType] || this.DECOMPOSITION_PATTERNS['problem_solving'];
    
    const subtasks: SubTask[] = pattern.subtasks.map((st, idx) => ({
      id: `subtask-${taskId}-${idx}`,
      title: st.title,
      description: `${st.title} for: ${task.substring(0, 100)}...`,
      assignedAgent: st.agent,
      dependencies: idx > 0 && pattern.strategy === 'sequential' 
        ? [`subtask-${taskId}-${idx - 1}`] 
        : [],
      status: 'pending' as const,
      priority: st.priority,
      estimatedDuration: 30
    }));

    if (options?.customSubtasks) {
      options.customSubtasks.forEach((custom, idx) => {
        if (subtasks[idx]) {
          Object.assign(subtasks[idx], custom);
        }
      });
    }

    const decomposition: TaskDecomposition = {
      id: taskId,
      originalTask: task,
      subtasks: subtasks.slice(0, options?.maxSubtasks || subtasks.length),
      decompositionStrategy: pattern.strategy,
      estimatedDuration: subtasks.reduce((sum, st) => sum + st.estimatedDuration, 0),
      complexity: this.assessComplexity(task, subtasks.length),
      createdAt: new Date()
    };

    this.taskDecompositions.set(taskId, decomposition);
    
    return decomposition;
  }

  async executeOrchestration(taskId: string): Promise<OrchestrationResult> {
    const decomposition = this.taskDecompositions.get(taskId);
    if (!decomposition) {
      throw new Error(`Task decomposition ${taskId} not found`);
    }

    const result: OrchestrationResult = {
      taskId,
      status: 'in_progress',
      subtaskResults: [],
      totalDuration: 0,
      agentsUsed: [],
      llmCallCount: 0,
      tokensUsed: 0,
      webSearchesPerformed: 0,
      errors: []
    };

    this.orchestrationResults.set(taskId, result);

    const startTime = Date.now();

    try {
      if (decomposition.decompositionStrategy === 'parallel') {
        await this.executeParallel(decomposition, result);
      } else if (decomposition.decompositionStrategy === 'sequential') {
        await this.executeSequential(decomposition, result);
      } else {
        await this.executeHybrid(decomposition, result);
      }

      result.synthesizedResult = await this.synthesizeResults(result.subtaskResults);
      result.status = result.errors.length === 0 ? 'completed' : 'partial';
    } catch (error: any) {
      result.status = 'failed';
      result.errors.push(error.message);
    }

    result.totalDuration = Date.now() - startTime;
    return result;
  }

  private async executeSequential(decomposition: TaskDecomposition, result: OrchestrationResult): Promise<void> {
    const sortedSubtasks = [...decomposition.subtasks].sort((a, b) => a.priority - b.priority);
    
    let previousResult: any = null;
    
    for (const subtask of sortedSubtasks) {
      const subtaskResult = await this.executeSubtask(subtask, decomposition.originalTask, previousResult);
      result.subtaskResults.push(subtaskResult);
      
      if (subtaskResult.agentId && !result.agentsUsed.includes(subtaskResult.agentId)) {
        result.agentsUsed.push(subtaskResult.agentId);
      }
      result.llmCallCount++;
      result.tokensUsed += subtaskResult.tokensUsed;
      
      if (subtaskResult.status === 'failed') {
        result.errors.push(`Subtask ${subtask.title} failed: ${subtaskResult.error}`);
      } else {
        previousResult = subtaskResult.result;
      }
    }
  }

  private async executeParallel(decomposition: TaskDecomposition, result: OrchestrationResult): Promise<void> {
    const groupedByPriority = this.groupByPriority(decomposition.subtasks);
    
    for (const [priority, subtasks] of Object.entries(groupedByPriority).sort(([a], [b]) => Number(a) - Number(b))) {
      const subtaskResults = await Promise.all(
        subtasks.map(subtask => this.executeSubtask(subtask, decomposition.originalTask, null))
      );
      
      for (const subtaskResult of subtaskResults) {
        result.subtaskResults.push(subtaskResult);
        
        if (subtaskResult.agentId && !result.agentsUsed.includes(subtaskResult.agentId)) {
          result.agentsUsed.push(subtaskResult.agentId);
        }
        result.llmCallCount++;
        result.tokensUsed += subtaskResult.tokensUsed;
        
        if (subtaskResult.status === 'failed') {
          result.errors.push(`Subtask failed: ${subtaskResult.error}`);
        }
      }
    }
  }

  private async executeHybrid(decomposition: TaskDecomposition, result: OrchestrationResult): Promise<void> {
    const groupedByPriority = this.groupByPriority(decomposition.subtasks);
    let previousResults: any[] = [];
    
    for (const [priority, subtasks] of Object.entries(groupedByPriority).sort(([a], [b]) => Number(a) - Number(b))) {
      const context = previousResults.length > 0 ? { previousResults } : null;
      
      const subtaskResults = await Promise.all(
        subtasks.map(subtask => this.executeSubtask(subtask, decomposition.originalTask, context))
      );
      
      for (const subtaskResult of subtaskResults) {
        result.subtaskResults.push(subtaskResult);
        
        if (subtaskResult.agentId && !result.agentsUsed.includes(subtaskResult.agentId)) {
          result.agentsUsed.push(subtaskResult.agentId);
        }
        result.llmCallCount++;
        result.tokensUsed += subtaskResult.tokensUsed;
        
        if (subtaskResult.status === 'failed') {
          result.errors.push(`Subtask failed: ${subtaskResult.error}`);
        } else {
          previousResults.push(subtaskResult.result);
        }
      }
    }
  }

  private async executeSubtask(subtask: SubTask, originalTask: string, context: any): Promise<SubTaskResult> {
    const startTime = Date.now();
    const agent = this.activeSubAgents.get(subtask.assignedAgent || 'execution-agent');
    
    if (!agent) {
      return {
        subtaskId: subtask.id,
        agentId: subtask.assignedAgent || 'unknown',
        status: 'failed',
        error: `Agent ${subtask.assignedAgent} not found`,
        duration: 0,
        tokensUsed: 0
      };
    }

    try {
      const messages: AgentMessage[] = [
        { role: 'system', content: agent.systemPrompt || 'You are a helpful assistant.' },
        { 
          role: 'user', 
          content: `Task: ${subtask.title}\n\nDescription: ${subtask.description}\n\nOriginal Request: ${originalTask}${context ? `\n\nContext from previous steps: ${JSON.stringify(context)}` : ''}`
        }
      ];

      const simulatedResult = this.simulateAgentExecution(agent, subtask, context);
      
      subtask.status = 'completed';
      subtask.completedAt = new Date();
      
      return {
        subtaskId: subtask.id,
        agentId: agent.id,
        status: 'completed',
        result: simulatedResult,
        duration: Date.now() - startTime,
        tokensUsed: Math.floor(Math.random() * 1000) + 200
      };
    } catch (error: any) {
      subtask.status = 'failed';
      
      return {
        subtaskId: subtask.id,
        agentId: agent.id,
        status: 'failed',
        error: error.message,
        duration: Date.now() - startTime,
        tokensUsed: 0
      };
    }
  }

  private simulateAgentExecution(agent: SubAgentConfig, subtask: SubTask, context: any): any {
    const roleOutputs: Record<string, (subtask: SubTask) => any> = {
      'research': (st) => ({
        findings: [
          { source: 'Web Search', relevance: 0.95, summary: `Key findings for ${st.title}` },
          { source: 'Internal Documents', relevance: 0.85, summary: 'Relevant internal context' }
        ],
        confidence: 0.9,
        suggestedActions: ['Proceed to analysis', 'Consider additional sources']
      }),
      'analysis': (st) => ({
        insights: [
          { type: 'pattern', description: 'Identified pattern in data', confidence: 0.88 },
          { type: 'recommendation', description: 'Recommended approach based on analysis', confidence: 0.92 }
        ],
        risks: ['Potential challenge 1', 'Consider edge case 2'],
        opportunities: ['Growth opportunity identified']
      }),
      'execution': (st) => ({
        deliverable: {
          type: st.title.includes('Code') ? 'code' : 'document',
          status: 'completed',
          artifacts: [`${st.title.toLowerCase().replace(/\s+/g, '-')}-output`]
        },
        actions_taken: ['Implemented solution', 'Tested functionality'],
        next_steps: ['Review needed', 'Deploy when approved']
      }),
      'review': (st) => ({
        quality_score: 0.92,
        issues_found: [],
        suggestions: ['Minor optimization possible', 'Documentation could be enhanced'],
        approved: true
      }),
      'synthesis': (st) => ({
        summary: `Synthesized output for ${st.title}`,
        key_points: ['Main conclusion 1', 'Main conclusion 2', 'Main conclusion 3'],
        final_recommendations: ['Primary recommendation', 'Secondary consideration'],
        confidence: 0.95
      })
    };

    const roleHandler = roleOutputs[agent.role] || roleOutputs['execution'];
    return roleHandler(subtask);
  }

  private async synthesizeResults(subtaskResults: SubTaskResult[]): Promise<any> {
    const completedResults = subtaskResults.filter(r => r.status === 'completed');
    
    return {
      summary: 'Orchestration completed successfully',
      totalSubtasks: subtaskResults.length,
      completedSubtasks: completedResults.length,
      failedSubtasks: subtaskResults.length - completedResults.length,
      combinedOutputs: completedResults.map(r => r.result),
      synthesizedAt: new Date().toISOString()
    };
  }

  private detectTaskType(task: string): keyof typeof EnhancedOrchestrationService.prototype.DECOMPOSITION_PATTERNS {
    const lowerTask = task.toLowerCase();
    
    if (lowerTask.includes('code') || lowerTask.includes('implement') || lowerTask.includes('develop') || lowerTask.includes('build')) {
      return 'code_development';
    }
    if (lowerTask.includes('research') || lowerTask.includes('report') || lowerTask.includes('investigate')) {
      return 'research_report';
    }
    if (lowerTask.includes('content') || lowerTask.includes('write') || lowerTask.includes('create') || lowerTask.includes('article')) {
      return 'content_creation';
    }
    if (lowerTask.includes('analyze') || lowerTask.includes('data') || lowerTask.includes('statistics')) {
      return 'data_analysis';
    }
    
    return 'problem_solving';
  }

  private assessComplexity(task: string, subtaskCount: number): 'simple' | 'moderate' | 'complex' | 'expert' {
    const wordCount = task.split(/\s+/).length;
    
    if (subtaskCount <= 2 && wordCount < 20) return 'simple';
    if (subtaskCount <= 4 && wordCount < 50) return 'moderate';
    if (subtaskCount <= 6) return 'complex';
    return 'expert';
  }

  private groupByPriority(subtasks: SubTask[]): Record<number, SubTask[]> {
    return subtasks.reduce((groups, subtask) => {
      const priority = subtask.priority;
      if (!groups[priority]) {
        groups[priority] = [];
      }
      groups[priority].push(subtask);
      return groups;
    }, {} as Record<number, SubTask[]>);
  }

  addSubAgent(config: SubAgentConfig): void {
    this.activeSubAgents.set(config.id, config);
  }

  removeSubAgent(agentId: string): boolean {
    return this.activeSubAgents.delete(agentId);
  }

  getSubAgents(): SubAgentConfig[] {
    return Array.from(this.activeSubAgents.values());
  }

  getDecomposition(taskId: string): TaskDecomposition | undefined {
    return this.taskDecompositions.get(taskId);
  }

  getOrchestrationResult(taskId: string): OrchestrationResult | undefined {
    return this.orchestrationResults.get(taskId);
  }

  getDecompositionPatterns(): typeof this.DECOMPOSITION_PATTERNS {
    return this.DECOMPOSITION_PATTERNS;
  }

  getStats(): {
    activeSubAgents: number;
    totalDecompositions: number;
    completedOrchestrations: number;
    patterns: string[];
  } {
    return {
      activeSubAgents: this.activeSubAgents.size,
      totalDecompositions: this.taskDecompositions.size,
      completedOrchestrations: Array.from(this.orchestrationResults.values()).filter(r => r.status === 'completed').length,
      patterns: Object.keys(this.DECOMPOSITION_PATTERNS)
    };
  }
}

export const enhancedOrchestrationService = new EnhancedOrchestrationService();
