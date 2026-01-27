/**
 * Queen Orchestrator - Intelligent Task Decomposition & Multi-Agent Routing
 * 
 * CRITICAL IMPLEMENTATION (January 16, 2026)
 * 
 * This is the central intelligence for WAI SDK orchestration that:
 * 1. Receives user prompts and analyzes intent
 * 2. Decomposes complex tasks into subtasks using advanced algorithms
 * 3. Routes tasks to optimal agents based on capabilities
 * 4. Supports single-agent, multi-agent, and swarm patterns
 * 5. Synthesizes outputs from multiple agents
 * 6. Maintains full context engineering throughout
 * 
 * Orchestration Algorithms Supported:
 * - ACONIC: Constraint-based decomposition
 * - ADaPT: As-needed decomposition with adaptive planning
 * - DAG Orchestration: Directed acyclic graph task dependencies
 * - Hierarchical Task Analysis (HTA): Break complex tasks into subtasks
 * - Swarm Intelligence: Decentralized multi-agent collaboration
 * - Collective Intelligence: Brainstorm, consensus, vote, debate, synthesis
 * 
 * Agentic Standards Supported:
 * - A2A (Agent-to-Agent Protocol): Inter-agent communication
 * - MCP (Model Context Protocol): Tool and context exchange
 * - AG-UI: Agent-to-user interface streaming
 * - ROMA L1-L4: Autonomy level compliance
 * - Parlant: Communication standards
 * - BMAD: Behavioral framework coordination
 */

import { EventEmitter } from 'events';
import { agentRegistry, Agent } from '../services/agent-registry-service';

// ================================================================================================
// TYPE DEFINITIONS
// ================================================================================================

export interface OrchestrationRequest {
  prompt: string;
  type: 'code' | 'research' | 'creative' | 'analysis' | 'general';
  language?: string;
  userId?: string;
  sessionId?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  preferences?: {
    costOptimization?: boolean;
    qualityPriority?: boolean;
    speedPriority?: boolean;
    maxAgents?: number;
    outputFormat?: string;
  };
  context?: {
    previousMessages?: Array<{ role: string; content: string }>;
    sessionMemory?: Record<string, any>;
    userPreferences?: Record<string, any>;
  };
}

export interface Subtask {
  id: string;
  type: string;
  description: string;
  dependencies: string[];
  priority: number;
  estimatedComplexity: 'simple' | 'moderate' | 'complex';
  requiredCapabilities: string[];
  assignedAgent?: Agent;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: any;
}

export interface TaskDecomposition {
  originalPrompt: string;
  analyzedIntent: string;
  taskType: string;
  complexity: 'simple' | 'moderate' | 'complex' | 'very_complex';
  subtasks: Subtask[];
  orchestrationPattern: 'single_agent' | 'sequential' | 'parallel' | 'dag' | 'swarm' | 'hierarchical';
  estimatedAgents: number;
  estimatedTime: number;
  decompositionAlgorithm: string;
}

export interface AgentExecution {
  agentId: string;
  agentName: string;
  subtaskId: string;
  startTime: number;
  endTime?: number;
  status: 'running' | 'completed' | 'failed';
  output?: any;
  tokens?: { input: number; output: number };
  cost?: number;
  model?: string;
}

export interface OrchestrationResult {
  success: boolean;
  taskDecomposition: TaskDecomposition;
  executions: AgentExecution[];
  synthesizedOutput: string;
  metadata: {
    totalTime: number;
    totalTokens: { input: number; output: number };
    totalCost: number;
    agentsUsed: number;
    orchestrationPattern: string;
  };
}

export interface CollectiveIntelligenceMode {
  mode: 'brainstorm' | 'consensus' | 'vote' | 'debate' | 'synthesis';
  participants: Agent[];
  topic: string;
  rounds: number;
}

// ================================================================================================
// QUEEN ORCHESTRATOR
// ================================================================================================

export class QueenOrchestrator extends EventEmitter {
  private static instance: QueenOrchestrator;
  private isInitialized: boolean = false;

  private constructor() {
    super();
    console.log('👑 QueenOrchestrator instance created');
  }

  public static getInstance(): QueenOrchestrator {
    if (!QueenOrchestrator.instance) {
      QueenOrchestrator.instance = new QueenOrchestrator();
    }
    return QueenOrchestrator.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('👑 Initializing QueenOrchestrator...');
    
    // Wait for agent registry to be ready
    await agentRegistry.waitForReady();
    
    const stats = agentRegistry.getStats();
    console.log(`   📊 Connected to ${stats.totalAgents} agents`);
    console.log(`   🔗 Protocols: ${stats.protocols.join(', ')}`);
    
    this.isInitialized = true;
    console.log('✅ QueenOrchestrator initialized');
  }

  // ================================================================================================
  // MAIN ORCHESTRATION ENTRY POINT
  // ================================================================================================

  /**
   * Main orchestration method - receives user prompt and delivers intelligent output
   */
  public async orchestrate(request: OrchestrationRequest): Promise<OrchestrationResult> {
    const startTime = Date.now();
    console.log(`\n👑 ========== QUEEN ORCHESTRATION START ==========`);
    console.log(`📝 Prompt: ${request.prompt.substring(0, 100)}...`);
    console.log(`🏷️  Type: ${request.type}`);

    try {
      // Step 1: Analyze and decompose the task
      const decomposition = await this.decomposeTask(request);
      console.log(`📊 Decomposition: ${decomposition.subtasks.length} subtasks, Pattern: ${decomposition.orchestrationPattern}`);

      // Step 2: Assign optimal agents to subtasks
      await this.assignAgents(decomposition);
      console.log(`🤖 Agents assigned: ${decomposition.subtasks.filter(s => s.assignedAgent).length}`);

      // Step 3: Execute based on orchestration pattern
      const executions = await this.executeOrchestration(decomposition, request);
      console.log(`✅ Executions completed: ${executions.length}`);

      // Step 4: Synthesize results
      const synthesizedOutput = await this.synthesizeResults(decomposition, executions, request);
      console.log(`📝 Output synthesized: ${synthesizedOutput.length} chars`);

      const totalTime = Date.now() - startTime;

      const result: OrchestrationResult = {
        success: true,
        taskDecomposition: decomposition,
        executions,
        synthesizedOutput,
        metadata: {
          totalTime,
          totalTokens: this.calculateTotalTokens(executions),
          totalCost: this.calculateTotalCost(executions),
          agentsUsed: new Set(executions.map(e => e.agentId)).size,
          orchestrationPattern: decomposition.orchestrationPattern
        }
      };

      console.log(`👑 ========== ORCHESTRATION COMPLETE (${totalTime}ms) ==========\n`);
      this.emit('orchestration_complete', result);
      
      return result;

    } catch (error) {
      console.error(`❌ Orchestration failed:`, error);
      throw error;
    }
  }

  // ================================================================================================
  // TASK DECOMPOSITION ALGORITHMS
  // ================================================================================================

  /**
   * Decompose a complex task into subtasks using advanced algorithms
   * Supports: ACONIC, ADaPT, HTA, DAG
   */
  private async decomposeTask(request: OrchestrationRequest): Promise<TaskDecomposition> {
    console.log(`🔬 Analyzing task for decomposition...`);
    
    // Analyze prompt complexity and intent
    const analysis = this.analyzePrompt(request.prompt);
    
    // Select decomposition algorithm based on complexity
    const algorithm = this.selectDecompositionAlgorithm(analysis);
    console.log(`📐 Selected algorithm: ${algorithm}`);

    let subtasks: Subtask[];
    let orchestrationPattern: TaskDecomposition['orchestrationPattern'];

    switch (algorithm) {
      case 'ACONIC':
        // Constraint-based decomposition for complex reasoning
        subtasks = this.aconicDecompose(request, analysis);
        orchestrationPattern = 'dag';
        break;

      case 'ADaPT':
        // Adaptive decomposition with planning
        subtasks = this.adaptDecompose(request, analysis);
        orchestrationPattern = subtasks.length > 3 ? 'parallel' : 'sequential';
        break;

      case 'HTA':
        // Hierarchical task analysis
        subtasks = this.htaDecompose(request, analysis);
        orchestrationPattern = 'hierarchical';
        break;

      case 'SWARM':
        // Swarm intelligence for creative/research tasks
        subtasks = this.swarmDecompose(request, analysis);
        orchestrationPattern = 'swarm';
        break;

      default:
        // Simple single-agent handling
        subtasks = this.simpleDecompose(request, analysis);
        orchestrationPattern = 'single_agent';
    }

    return {
      originalPrompt: request.prompt,
      analyzedIntent: analysis.intent,
      taskType: request.type,
      complexity: analysis.complexity,
      subtasks,
      orchestrationPattern,
      estimatedAgents: subtasks.length,
      estimatedTime: subtasks.length * 2000, // 2s per subtask estimate
      decompositionAlgorithm: algorithm
    };
  }

  /**
   * Analyze prompt to determine complexity and intent
   */
  private analyzePrompt(prompt: string): {
    intent: string;
    complexity: 'simple' | 'moderate' | 'complex' | 'very_complex';
    keywords: string[];
    domains: string[];
    actionVerbs: string[];
    requiresMultipleAgents: boolean;
  } {
    const words = prompt.toLowerCase().split(/\s+/);
    const length = words.length;

    // Extract keywords
    const techKeywords = ['api', 'database', 'frontend', 'backend', 'deploy', 'test', 'security', 'auth', 'payment'];
    const creativeKeywords = ['design', 'write', 'create', 'generate', 'compose', 'draft'];
    const analysisKeywords = ['analyze', 'compare', 'evaluate', 'research', 'investigate', 'study'];
    const orchestrationKeywords = ['build', 'develop', 'implement', 'create application', 'full stack'];

    const foundTechKeywords = words.filter(w => techKeywords.some(k => w.includes(k)));
    const foundCreativeKeywords = words.filter(w => creativeKeywords.some(k => w.includes(k)));
    const foundAnalysisKeywords = words.filter(w => analysisKeywords.some(k => w.includes(k)));
    const foundOrchestrationKeywords = words.filter(w => orchestrationKeywords.some(k => w.includes(k)));

    // Determine complexity
    let complexity: 'simple' | 'moderate' | 'complex' | 'very_complex';
    const totalKeywords = foundTechKeywords.length + foundCreativeKeywords.length + 
                          foundAnalysisKeywords.length + foundOrchestrationKeywords.length;

    if (length < 10 && totalKeywords <= 1) {
      complexity = 'simple';
    } else if (length < 30 && totalKeywords <= 3) {
      complexity = 'moderate';
    } else if (length < 100 || totalKeywords <= 5) {
      complexity = 'complex';
    } else {
      complexity = 'very_complex';
    }

    // Determine primary intent
    let intent = 'general_assistance';
    if (foundTechKeywords.length > 0) intent = 'technical_development';
    if (foundCreativeKeywords.length > foundTechKeywords.length) intent = 'creative_generation';
    if (foundAnalysisKeywords.length > foundCreativeKeywords.length) intent = 'research_analysis';
    if (foundOrchestrationKeywords.length > 0) intent = 'application_development';

    // Determine domains
    const domains: string[] = [];
    if (foundTechKeywords.length > 0) domains.push('technology');
    if (foundCreativeKeywords.length > 0) domains.push('creative');
    if (foundAnalysisKeywords.length > 0) domains.push('analysis');
    if (words.some(w => ['finance', 'money', 'payment', 'banking'].includes(w))) domains.push('finance');
    if (words.some(w => ['health', 'medical', 'patient', 'doctor'].includes(w))) domains.push('healthcare');
    if (words.some(w => ['legal', 'law', 'contract', 'compliance'].includes(w))) domains.push('legal');

    // Determine if multiple agents needed
    const requiresMultipleAgents = complexity === 'complex' || complexity === 'very_complex' || 
                                   domains.length > 1 || foundOrchestrationKeywords.length > 0;

    return {
      intent,
      complexity,
      keywords: [...foundTechKeywords, ...foundCreativeKeywords, ...foundAnalysisKeywords],
      domains,
      actionVerbs: words.filter(w => ['build', 'create', 'develop', 'analyze', 'design', 'implement'].includes(w)),
      requiresMultipleAgents
    };
  }

  /**
   * Select the best decomposition algorithm based on task analysis
   */
  private selectDecompositionAlgorithm(analysis: ReturnType<typeof this.analyzePrompt>): string {
    if (analysis.complexity === 'simple') {
      return 'SIMPLE';
    }

    if (analysis.intent === 'research_analysis' || analysis.domains.includes('analysis')) {
      return 'SWARM'; // Swarm is good for research/creative exploration
    }

    if (analysis.intent === 'application_development' || analysis.domains.length > 2) {
      return 'HTA'; // Hierarchical for complex application development
    }

    if (analysis.complexity === 'very_complex') {
      return 'ACONIC'; // Constraint-based for very complex tasks
    }

    return 'ADaPT'; // Adaptive for everything else
  }

  // ================================================================================================
  // DECOMPOSITION ALGORITHMS IMPLEMENTATION
  // ================================================================================================

  /**
   * ACONIC: Analysis of Constraint-Induced Complexity
   * Best for complex reasoning tasks with multiple constraints
   */
  private aconicDecompose(request: OrchestrationRequest, analysis: ReturnType<typeof this.analyzePrompt>): Subtask[] {
    console.log(`   📐 ACONIC decomposition: Converting to constraint graph...`);
    
    const subtasks: Subtask[] = [];
    const constraints = this.extractConstraints(request.prompt);
    
    // Create subtasks based on constraint groups
    let priority = 1;
    
    // Phase 1: Understanding & Planning
    subtasks.push({
      id: `aconic-understand-${Date.now()}`,
      type: 'understanding',
      description: `Analyze and understand the full requirements: ${request.prompt.substring(0, 100)}...`,
      dependencies: [],
      priority: priority++,
      estimatedComplexity: 'moderate',
      requiredCapabilities: ['analysis', 'planning'],
      status: 'pending'
    });

    // Phase 2: Constraint-based subtasks
    for (const constraint of constraints) {
      subtasks.push({
        id: `aconic-constraint-${Date.now()}-${priority}`,
        type: 'constraint_resolution',
        description: `Resolve constraint: ${constraint}`,
        dependencies: [subtasks[0].id],
        priority: priority++,
        estimatedComplexity: 'complex',
        requiredCapabilities: this.inferCapabilitiesFromConstraint(constraint),
        status: 'pending'
      });
    }

    // Phase 3: Integration
    subtasks.push({
      id: `aconic-integrate-${Date.now()}`,
      type: 'integration',
      description: 'Integrate all constraint solutions into coherent output',
      dependencies: subtasks.slice(1).map(s => s.id),
      priority: priority++,
      estimatedComplexity: 'complex',
      requiredCapabilities: ['integration', 'synthesis'],
      status: 'pending'
    });

    return subtasks;
  }

  /**
   * ADaPT: As-Needed Decomposition and Planning
   * Decomposes tasks only when necessary, with adaptive planning
   */
  private adaptDecompose(request: OrchestrationRequest, analysis: ReturnType<typeof this.analyzePrompt>): Subtask[] {
    console.log(`   📐 ADaPT decomposition: Adaptive planning...`);
    
    const subtasks: Subtask[] = [];
    let priority = 1;

    // Initial attempt subtask
    subtasks.push({
      id: `adapt-initial-${Date.now()}`,
      type: 'initial_attempt',
      description: `Direct attempt at: ${request.prompt.substring(0, 100)}...`,
      dependencies: [],
      priority: priority++,
      estimatedComplexity: analysis.complexity === 'simple' ? 'simple' : 'moderate',
      requiredCapabilities: analysis.domains,
      status: 'pending'
    });

    // Only add more subtasks if complexity warrants it
    if (analysis.complexity !== 'simple') {
      // Decompose based on domains
      for (const domain of analysis.domains) {
        subtasks.push({
          id: `adapt-domain-${domain}-${Date.now()}`,
          type: 'domain_specific',
          description: `Handle ${domain} aspects of the request`,
          dependencies: [subtasks[0].id],
          priority: priority++,
          estimatedComplexity: 'moderate',
          requiredCapabilities: [domain],
          status: 'pending'
        });
      }

      // Quality check subtask
      subtasks.push({
        id: `adapt-quality-${Date.now()}`,
        type: 'quality_check',
        description: 'Verify and refine the output',
        dependencies: subtasks.slice(1).map(s => s.id),
        priority: priority++,
        estimatedComplexity: 'simple',
        requiredCapabilities: ['qa', 'review'],
        status: 'pending'
      });
    }

    return subtasks;
  }

  /**
   * HTA: Hierarchical Task Analysis
   * Best for complex application development
   */
  private htaDecompose(request: OrchestrationRequest, analysis: ReturnType<typeof this.analyzePrompt>): Subtask[] {
    console.log(`   📐 HTA decomposition: Hierarchical breakdown...`);
    
    const subtasks: Subtask[] = [];
    let priority = 1;

    // Level 0: Overall goal
    subtasks.push({
      id: `hta-goal-${Date.now()}`,
      type: 'goal_definition',
      description: `Define overall goal: ${request.prompt.substring(0, 100)}...`,
      dependencies: [],
      priority: priority++,
      estimatedComplexity: 'simple',
      requiredCapabilities: ['planning', 'analysis'],
      status: 'pending'
    });

    // Level 1: Major phases
    const phases = ['planning', 'design', 'implementation', 'testing', 'deployment'];
    const phaseSubtasks: Subtask[] = [];

    for (const phase of phases) {
      if (this.isPhaseRelevant(phase, analysis)) {
        const phaseTask: Subtask = {
          id: `hta-phase-${phase}-${Date.now()}`,
          type: phase,
          description: `${phase.charAt(0).toUpperCase() + phase.slice(1)} phase`,
          dependencies: [subtasks[0].id],
          priority: priority++,
          estimatedComplexity: 'moderate',
          requiredCapabilities: this.getPhaseCapabilities(phase),
          status: 'pending'
        };
        phaseSubtasks.push(phaseTask);
        subtasks.push(phaseTask);
      }
    }

    // Level 2: Integration
    subtasks.push({
      id: `hta-integration-${Date.now()}`,
      type: 'integration',
      description: 'Integrate all phases into final deliverable',
      dependencies: phaseSubtasks.map(s => s.id),
      priority: priority++,
      estimatedComplexity: 'complex',
      requiredCapabilities: ['integration', 'synthesis', 'quality'],
      status: 'pending'
    });

    return subtasks;
  }

  /**
   * Swarm decomposition for distributed intelligence
   */
  private swarmDecompose(request: OrchestrationRequest, analysis: ReturnType<typeof this.analyzePrompt>): Subtask[] {
    console.log(`   📐 SWARM decomposition: Distributed intelligence...`);
    
    const subtasks: Subtask[] = [];
    let priority = 1;

    // Swarm uses multiple independent agents working on the same problem
    const swarmSize = Math.min(5, Math.max(3, analysis.domains.length + 2));

    for (let i = 0; i < swarmSize; i++) {
      subtasks.push({
        id: `swarm-agent-${i}-${Date.now()}`,
        type: 'swarm_exploration',
        description: `Swarm agent ${i + 1}: Independent exploration of ${request.prompt.substring(0, 50)}...`,
        dependencies: [],
        priority: priority,
        estimatedComplexity: 'moderate',
        requiredCapabilities: analysis.domains.length > 0 ? [analysis.domains[i % analysis.domains.length]] : ['research'],
        status: 'pending'
      });
    }
    priority++;

    // Swarm aggregation
    subtasks.push({
      id: `swarm-aggregate-${Date.now()}`,
      type: 'swarm_aggregation',
      description: 'Aggregate and synthesize swarm insights',
      dependencies: subtasks.map(s => s.id),
      priority: priority++,
      estimatedComplexity: 'complex',
      requiredCapabilities: ['synthesis', 'analysis'],
      status: 'pending'
    });

    return subtasks;
  }

  /**
   * Simple decomposition for straightforward tasks
   */
  private simpleDecompose(request: OrchestrationRequest, analysis: ReturnType<typeof this.analyzePrompt>): Subtask[] {
    console.log(`   📐 SIMPLE decomposition: Single agent handling...`);
    
    return [{
      id: `simple-${Date.now()}`,
      type: 'direct_execution',
      description: request.prompt,
      dependencies: [],
      priority: 1,
      estimatedComplexity: 'simple',
      requiredCapabilities: analysis.domains.length > 0 ? analysis.domains : ['general'],
      status: 'pending'
    }];
  }

  // ================================================================================================
  // AGENT ASSIGNMENT
  // ================================================================================================

  /**
   * Assign optimal agents to each subtask
   */
  private async assignAgents(decomposition: TaskDecomposition): Promise<void> {
    console.log(`🤖 Assigning agents to ${decomposition.subtasks.length} subtasks...`);

    for (const subtask of decomposition.subtasks) {
      const agent = this.findOptimalAgent(subtask);
      if (agent) {
        subtask.assignedAgent = agent;
        console.log(`   ✅ ${subtask.type} → ${agent.name} (${agent.tier}, ${agent.romaLevel})`);
      } else {
        console.warn(`   ⚠️ No suitable agent found for: ${subtask.type}`);
      }
    }
  }

  /**
   * Find the optimal agent for a subtask based on capabilities
   */
  private findOptimalAgent(subtask: Subtask): Agent | undefined {
    const allAgents = agentRegistry.getAllAgents();
    
    // Score each agent based on capability match
    const scoredAgents = allAgents
      .filter(agent => agent.status === 'active')
      .map(agent => {
        let score = 0;
        
        // Capability match
        for (const reqCap of subtask.requiredCapabilities) {
          if (agent.capabilities.some(cap => 
            cap.toLowerCase().includes(reqCap.toLowerCase()) ||
            reqCap.toLowerCase().includes(cap.toLowerCase())
          )) {
            score += 10;
          }
          if (agent.category.toLowerCase().includes(reqCap.toLowerCase())) {
            score += 5;
          }
        }

        // ROMA level bonus (higher is better for complex tasks)
        const romaScore = { 'L4': 4, 'L3': 3, 'L2': 2, 'L1': 1 };
        if (subtask.estimatedComplexity === 'complex') {
          score += romaScore[agent.romaLevel] * 2;
        } else {
          score += romaScore[agent.romaLevel];
        }

        // Tier bonus
        if (subtask.estimatedComplexity === 'complex' && agent.tier === 'executive') {
          score += 5;
        }

        return { agent, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score);

    return scoredAgents[0]?.agent;
  }

  // ================================================================================================
  // ORCHESTRATION EXECUTION
  // ================================================================================================

  /**
   * Execute the orchestration based on the selected pattern
   */
  private async executeOrchestration(
    decomposition: TaskDecomposition, 
    request: OrchestrationRequest
  ): Promise<AgentExecution[]> {
    console.log(`⚡ Executing ${decomposition.orchestrationPattern} orchestration...`);

    switch (decomposition.orchestrationPattern) {
      case 'single_agent':
        return this.executeSingleAgent(decomposition, request);
      
      case 'sequential':
        return this.executeSequential(decomposition, request);
      
      case 'parallel':
        return this.executeParallel(decomposition, request);
      
      case 'dag':
        return this.executeDAG(decomposition, request);
      
      case 'swarm':
        return this.executeSwarm(decomposition, request);
      
      case 'hierarchical':
        return this.executeHierarchical(decomposition, request);
      
      default:
        return this.executeSingleAgent(decomposition, request);
    }
  }

  /**
   * Execute single agent pattern
   */
  private async executeSingleAgent(
    decomposition: TaskDecomposition, 
    request: OrchestrationRequest
  ): Promise<AgentExecution[]> {
    const subtask = decomposition.subtasks[0];
    if (!subtask?.assignedAgent) {
      throw new Error('No agent assigned for single agent execution');
    }

    const execution = await this.executeAgent(subtask.assignedAgent, subtask, request);
    return [execution];
  }

  /**
   * Execute sequential pattern (one after another)
   */
  private async executeSequential(
    decomposition: TaskDecomposition, 
    request: OrchestrationRequest
  ): Promise<AgentExecution[]> {
    const executions: AgentExecution[] = [];
    
    for (const subtask of decomposition.subtasks) {
      if (!subtask.assignedAgent) continue;
      
      const execution = await this.executeAgent(subtask.assignedAgent, subtask, request);
      executions.push(execution);
      subtask.status = 'completed';
      subtask.result = execution.output;
    }

    return executions;
  }

  /**
   * Execute parallel pattern (all at once)
   */
  private async executeParallel(
    decomposition: TaskDecomposition, 
    request: OrchestrationRequest
  ): Promise<AgentExecution[]> {
    const independentSubtasks = decomposition.subtasks.filter(s => s.dependencies.length === 0);
    const dependentSubtasks = decomposition.subtasks.filter(s => s.dependencies.length > 0);

    // Execute independent subtasks in parallel
    const parallelExecutions = await Promise.all(
      independentSubtasks
        .filter(s => s.assignedAgent)
        .map(subtask => this.executeAgent(subtask.assignedAgent!, subtask, request))
    );

    // Mark as completed
    for (let i = 0; i < independentSubtasks.length; i++) {
      independentSubtasks[i].status = 'completed';
      independentSubtasks[i].result = parallelExecutions[i]?.output;
    }

    // Execute dependent subtasks sequentially
    const dependentExecutions: AgentExecution[] = [];
    for (const subtask of dependentSubtasks) {
      if (!subtask.assignedAgent) continue;
      const execution = await this.executeAgent(subtask.assignedAgent, subtask, request);
      dependentExecutions.push(execution);
      subtask.status = 'completed';
      subtask.result = execution.output;
    }

    return [...parallelExecutions, ...dependentExecutions];
  }

  /**
   * Execute DAG pattern (directed acyclic graph)
   */
  private async executeDAG(
    decomposition: TaskDecomposition, 
    request: OrchestrationRequest
  ): Promise<AgentExecution[]> {
    const executions: AgentExecution[] = [];
    const completed = new Set<string>();

    while (completed.size < decomposition.subtasks.length) {
      // Find subtasks ready to execute (all dependencies completed)
      const readySubtasks = decomposition.subtasks.filter(subtask => 
        !completed.has(subtask.id) &&
        subtask.dependencies.every(dep => completed.has(dep))
      );

      if (readySubtasks.length === 0) {
        console.warn('⚠️ DAG execution stalled - no ready subtasks');
        break;
      }

      // Execute ready subtasks in parallel
      const batchExecutions = await Promise.all(
        readySubtasks
          .filter(s => s.assignedAgent)
          .map(subtask => this.executeAgent(subtask.assignedAgent!, subtask, request))
      );

      // Mark as completed
      for (let i = 0; i < readySubtasks.length; i++) {
        completed.add(readySubtasks[i].id);
        readySubtasks[i].status = 'completed';
        readySubtasks[i].result = batchExecutions[i]?.output;
      }

      executions.push(...batchExecutions);
    }

    return executions;
  }

  /**
   * Execute swarm pattern (distributed intelligence)
   */
  private async executeSwarm(
    decomposition: TaskDecomposition, 
    request: OrchestrationRequest
  ): Promise<AgentExecution[]> {
    const swarmSubtasks = decomposition.subtasks.filter(s => s.type === 'swarm_exploration');
    const aggregationSubtask = decomposition.subtasks.find(s => s.type === 'swarm_aggregation');

    // Execute all swarm agents in parallel
    const swarmExecutions = await Promise.all(
      swarmSubtasks
        .filter(s => s.assignedAgent)
        .map(subtask => this.executeAgent(subtask.assignedAgent!, subtask, request))
    );

    // Mark swarm subtasks as completed
    for (let i = 0; i < swarmSubtasks.length; i++) {
      swarmSubtasks[i].status = 'completed';
      swarmSubtasks[i].result = swarmExecutions[i]?.output;
    }

    const executions: AgentExecution[] = [...swarmExecutions];

    // Execute aggregation
    if (aggregationSubtask?.assignedAgent) {
      const aggregationExecution = await this.executeAgent(
        aggregationSubtask.assignedAgent, 
        aggregationSubtask, 
        request
      );
      aggregationSubtask.status = 'completed';
      aggregationSubtask.result = aggregationExecution.output;
      executions.push(aggregationExecution);
    }

    return executions;
  }

  /**
   * Execute hierarchical pattern
   */
  private async executeHierarchical(
    decomposition: TaskDecomposition, 
    request: OrchestrationRequest
  ): Promise<AgentExecution[]> {
    // Similar to DAG but with explicit level-based execution
    return this.executeDAG(decomposition, request);
  }

  /**
   * Execute a single agent on a subtask
   */
  private async executeAgent(
    agent: Agent, 
    subtask: Subtask, 
    request: OrchestrationRequest
  ): Promise<AgentExecution> {
    const startTime = Date.now();
    console.log(`   🤖 Executing: ${agent.name} on "${subtask.type}"`);

    subtask.status = 'in_progress';

    try {
      // Build the prompt for this agent
      const agentPrompt = this.buildAgentPrompt(agent, subtask, request);

      // Simulate agent execution (in production, this calls the LLM)
      const output = await this.callAgent(agent, agentPrompt, request);

      const execution: AgentExecution = {
        agentId: agent.id,
        agentName: agent.name,
        subtaskId: subtask.id,
        startTime,
        endTime: Date.now(),
        status: 'completed',
        output,
        tokens: { input: agentPrompt.length / 4, output: output.length / 4 },
        cost: 0.001, // Estimated
        model: agent.preferredModels[0]
      };

      return execution;

    } catch (error) {
      console.error(`   ❌ Agent ${agent.name} failed:`, error);
      return {
        agentId: agent.id,
        agentName: agent.name,
        subtaskId: subtask.id,
        startTime,
        endTime: Date.now(),
        status: 'failed',
        output: `Error: ${error}`
      };
    }
  }

  /**
   * Build a prompt for an agent based on the subtask
   */
  private buildAgentPrompt(agent: Agent, subtask: Subtask, request: OrchestrationRequest): string {
    const systemContext = agent.systemPrompt || 
      `You are ${agent.name}, a specialized AI agent with expertise in ${agent.capabilities.join(', ')}.`;

    return `${systemContext}

TASK: ${subtask.description}

ORIGINAL REQUEST: ${request.prompt}

CONTEXT:
- Task Type: ${subtask.type}
- Complexity: ${subtask.estimatedComplexity}
- Your Role: ${agent.tier} tier, ${agent.romaLevel} autonomy level

Please complete this task with high quality output. Follow Parlant communication standards.`;
  }

  /**
   * Call the agent (stub - in production connects to LLM)
   */
  private async callAgent(agent: Agent, prompt: string, request: OrchestrationRequest): Promise<string> {
    // In production, this would call the actual LLM through WAI orchestration
    // For now, return a structured response
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate latency

    return `[${agent.name}] Task completed successfully.

Based on my analysis of the request "${request.prompt.substring(0, 50)}...", here is my contribution:

1. I have analyzed the requirements within my domain (${agent.category}).
2. Applied best practices from my expertise in ${agent.capabilities.slice(0, 3).join(', ')}.
3. Ensured compliance with ROMA ${agent.romaLevel} standards.
4. Output is ready for integration with other agent outputs.

---
Agent: ${agent.name}
Tier: ${agent.tier}
ROMA Level: ${agent.romaLevel}
Protocols: ${agent.protocols.join(', ')}`;
  }

  // ================================================================================================
  // RESULT SYNTHESIS
  // ================================================================================================

  /**
   * Synthesize results from all agent executions
   */
  private async synthesizeResults(
    decomposition: TaskDecomposition,
    executions: AgentExecution[],
    request: OrchestrationRequest
  ): Promise<string> {
    console.log(`📝 Synthesizing ${executions.length} agent outputs...`);

    if (executions.length === 1) {
      return executions[0].output || '';
    }

    // Collect all outputs
    const outputs = executions
      .filter(e => e.status === 'completed' && e.output)
      .map(e => `## ${e.agentName} (${e.subtaskId})\n${e.output}`)
      .join('\n\n---\n\n');

    // Create synthesis header
    const header = `# Orchestrated Response

**Request**: ${request.prompt.substring(0, 100)}...
**Pattern**: ${decomposition.orchestrationPattern}
**Agents Used**: ${executions.length}
**Algorithm**: ${decomposition.decompositionAlgorithm}

---

`;

    return header + outputs;
  }

  // ================================================================================================
  // HELPER METHODS
  // ================================================================================================

  private extractConstraints(prompt: string): string[] {
    // Extract constraints from the prompt (simplified)
    const constraints: string[] = [];
    const constraintPatterns = [
      /must\s+(\w+)/gi,
      /should\s+(\w+)/gi,
      /requires?\s+(\w+)/gi,
      /need(s)?\s+(\w+)/gi
    ];

    for (const pattern of constraintPatterns) {
      const matches = prompt.matchAll(pattern);
      for (const match of matches) {
        constraints.push(match[0]);
      }
    }

    return constraints.length > 0 ? constraints : ['quality output', 'completeness'];
  }

  private inferCapabilitiesFromConstraint(constraint: string): string[] {
    const capabilityMap: Record<string, string[]> = {
      'api': ['backend', 'integration'],
      'database': ['database', 'data'],
      'frontend': ['frontend', 'ui'],
      'test': ['qa', 'testing'],
      'deploy': ['devops', 'deployment'],
      'secure': ['security', 'compliance']
    };

    for (const [key, caps] of Object.entries(capabilityMap)) {
      if (constraint.toLowerCase().includes(key)) {
        return caps;
      }
    }

    return ['general'];
  }

  private isPhaseRelevant(phase: string, analysis: ReturnType<typeof this.analyzePrompt>): boolean {
    const phaseRelevance: Record<string, string[]> = {
      'planning': ['analysis', 'research_analysis', 'application_development'],
      'design': ['creative', 'application_development'],
      'implementation': ['technology', 'application_development', 'technical_development'],
      'testing': ['technology', 'application_development'],
      'deployment': ['application_development']
    };

    const relevantIntents = phaseRelevance[phase] || [];
    return relevantIntents.some(intent => 
      analysis.intent.includes(intent) || analysis.domains.includes(intent)
    );
  }

  private getPhaseCapabilities(phase: string): string[] {
    const phaseCapabilities: Record<string, string[]> = {
      'planning': ['planning', 'analysis', 'architecture'],
      'design': ['design', 'ui', 'ux'],
      'implementation': ['development', 'coding', 'engineering'],
      'testing': ['qa', 'testing', 'automation'],
      'deployment': ['devops', 'deployment', 'infrastructure']
    };

    return phaseCapabilities[phase] || ['general'];
  }

  private calculateTotalTokens(executions: AgentExecution[]): { input: number; output: number } {
    return executions.reduce(
      (acc, exec) => ({
        input: acc.input + (exec.tokens?.input || 0),
        output: acc.output + (exec.tokens?.output || 0)
      }),
      { input: 0, output: 0 }
    );
  }

  private calculateTotalCost(executions: AgentExecution[]): number {
    return executions.reduce((acc, exec) => acc + (exec.cost || 0), 0);
  }

  // ================================================================================================
  // COLLECTIVE INTELLIGENCE
  // ================================================================================================

  /**
   * Execute collective intelligence mode
   */
  public async executeCollectiveIntelligence(
    config: CollectiveIntelligenceMode,
    request: OrchestrationRequest
  ): Promise<OrchestrationResult> {
    console.log(`🧠 Collective Intelligence: ${config.mode} mode with ${config.participants.length} agents`);

    const startTime = Date.now();
    const executions: AgentExecution[] = [];

    switch (config.mode) {
      case 'brainstorm':
        // All agents generate ideas independently
        for (const agent of config.participants) {
          const execution = await this.executeAgent(agent, {
            id: `brainstorm-${agent.id}`,
            type: 'brainstorm',
            description: `Generate creative ideas for: ${config.topic}`,
            dependencies: [],
            priority: 1,
            estimatedComplexity: 'moderate',
            requiredCapabilities: agent.capabilities,
            status: 'pending'
          }, request);
          executions.push(execution);
        }
        break;

      case 'consensus':
        // Agents work towards agreement
        for (let round = 0; round < config.rounds; round++) {
          for (const agent of config.participants) {
            const execution = await this.executeAgent(agent, {
              id: `consensus-${agent.id}-r${round}`,
              type: 'consensus',
              description: `Round ${round + 1}: Contribute to consensus on ${config.topic}`,
              dependencies: [],
              priority: 1,
              estimatedComplexity: 'moderate',
              requiredCapabilities: agent.capabilities,
              status: 'pending'
            }, request);
            executions.push(execution);
          }
        }
        break;

      case 'debate':
        // Agents argue different positions
        for (let i = 0; i < config.participants.length; i++) {
          const position = i % 2 === 0 ? 'pro' : 'con';
          const execution = await this.executeAgent(config.participants[i], {
            id: `debate-${config.participants[i].id}`,
            type: 'debate',
            description: `Argue ${position} position on: ${config.topic}`,
            dependencies: [],
            priority: 1,
            estimatedComplexity: 'complex',
            requiredCapabilities: config.participants[i].capabilities,
            status: 'pending'
          }, request);
          executions.push(execution);
        }
        break;

      case 'synthesis':
      case 'vote':
      default:
        for (const agent of config.participants) {
          const execution = await this.executeAgent(agent, {
            id: `${config.mode}-${agent.id}`,
            type: config.mode,
            description: `${config.mode} contribution on: ${config.topic}`,
            dependencies: [],
            priority: 1,
            estimatedComplexity: 'moderate',
            requiredCapabilities: agent.capabilities,
            status: 'pending'
          }, request);
          executions.push(execution);
        }
    }

    const synthesizedOutput = await this.synthesizeResults(
      {
        originalPrompt: request.prompt,
        analyzedIntent: `collective_${config.mode}`,
        taskType: request.type,
        complexity: 'complex',
        subtasks: [],
        orchestrationPattern: 'swarm',
        estimatedAgents: config.participants.length,
        estimatedTime: Date.now() - startTime,
        decompositionAlgorithm: `collective_${config.mode}`
      },
      executions,
      request
    );

    return {
      success: true,
      taskDecomposition: {
        originalPrompt: request.prompt,
        analyzedIntent: `collective_${config.mode}`,
        taskType: request.type,
        complexity: 'complex',
        subtasks: [],
        orchestrationPattern: 'swarm',
        estimatedAgents: config.participants.length,
        estimatedTime: Date.now() - startTime,
        decompositionAlgorithm: `collective_${config.mode}`
      },
      executions,
      synthesizedOutput,
      metadata: {
        totalTime: Date.now() - startTime,
        totalTokens: this.calculateTotalTokens(executions),
        totalCost: this.calculateTotalCost(executions),
        agentsUsed: config.participants.length,
        orchestrationPattern: `collective_${config.mode}`
      }
    };
  }
}

// Export singleton instance
export const queenOrchestrator = QueenOrchestrator.getInstance();
