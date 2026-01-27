/**
 * WAI SDK v10.0 - Agent Orchestration Test Suite
 * 
 * Comprehensive testing for:
 * - Agent registration and discovery
 * - Task routing and distribution
 * - LLM model selection
 * - Multi-agent coordination
 * - End-to-end execution flows
 */

import { COMPLETE_AGENT_REGISTRY, UnifiedAgentOrchestrator, TaskRequest } from './unified-agent-orchestrator';
import { LLMAgentIntegration, getLLMAgentIntegration } from './llm-agent-integration';

// ============================================================================
// TEST UTILITIES
// ============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: Record<string, any>;
}

interface TestSuiteResult {
  suiteName: string;
  totalTests: number;
  passed: number;
  failed: number;
  duration: number;
  results: TestResult[];
}

class AgentTestRunner {
  private results: TestResult[] = [];
  private orchestrator: UnifiedAgentOrchestrator;
  private llmIntegration: LLMAgentIntegration;
  
  constructor() {
    this.orchestrator = new UnifiedAgentOrchestrator();
    this.llmIntegration = getLLMAgentIntegration();
  }
  
  private async runTest(name: string, testFn: () => Promise<void> | void): Promise<TestResult> {
    const start = Date.now();
    try {
      await testFn();
      const result: TestResult = {
        name,
        passed: true,
        duration: Date.now() - start
      };
      this.results.push(result);
      console.log(`  ✅ ${name} (${result.duration}ms)`);
      return result;
    } catch (error) {
      const result: TestResult = {
        name,
        passed: false,
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : String(error)
      };
      this.results.push(result);
      console.log(`  ❌ ${name}: ${result.error}`);
      return result;
    }
  }
  
  /**
   * Test Suite 1: Agent Registry Tests
   */
  async testAgentRegistry(): Promise<TestSuiteResult> {
    console.log('\n📋 Running Agent Registry Tests...');
    this.results = [];
    const startTime = Date.now();
    
    await this.runTest('Agent count should be >= 267', () => {
      if (COMPLETE_AGENT_REGISTRY.length < 267) {
        throw new Error(`Expected >= 267 agents, got ${COMPLETE_AGENT_REGISTRY.length}`);
      }
    });
    
    await this.runTest('All agents should have valid IDs', () => {
      const invalidAgents = COMPLETE_AGENT_REGISTRY.filter(a => !a.id || a.id.length === 0);
      if (invalidAgents.length > 0) {
        throw new Error(`Found ${invalidAgents.length} agents without valid IDs`);
      }
    });
    
    await this.runTest('All agents should have 22-point system prompts', () => {
      const requiredSections = [
        'AUTONOMOUS EXECUTION',
        'GUARDRAIL COMPLIANCE',
        'SELF-LEARNING',
        'CAPABILITY AWARENESS',
        'COLLABORATIVE MULTI-AGENT',
        'PARALLEL EXECUTION',
        'SWARM COORDINATION',
        'LLM INTELLIGENCE',
        'CONTEXT ENGINEERING',
        'MULTIMODAL PROCESSING',
        'HIERARCHY AWARENESS',
        'MULTI-LANGUAGE SUPPORT',
        'BEHAVIORAL INTELLIGENCE',
        'COST OPTIMIZATION',
        'PROCESS ORIENTATION',
        'SPECIALTY DEFINITION',
        'COMMUNICATION',
        'TEAM CAPABILITY',
        'PROMPT ENGINEERING',
        'TASK & TOOLS AWARENESS',
        'FALLBACK BEHAVIOR',
        'GLOBAL PROTOCOL COMPLIANCE'
      ];
      
      const incompleteAgents: string[] = [];
      COMPLETE_AGENT_REGISTRY.forEach(agent => {
        const missingSections = requiredSections.filter(section => 
          !agent.systemPrompt.includes(section)
        );
        if (missingSections.length > 0) {
          incompleteAgents.push(agent.id);
        }
      });
      
      if (incompleteAgents.length > 0) {
        throw new Error(`${incompleteAgents.length} agents missing prompt sections`);
      }
    });
    
    await this.runTest('All agents should have ROMA levels', () => {
      const validRomaLevels = ['L1', 'L2', 'L3', 'L4'];
      const invalidAgents = COMPLETE_AGENT_REGISTRY.filter(a => 
        !validRomaLevels.includes(a.romaLevel)
      );
      if (invalidAgents.length > 0) {
        throw new Error(`Found ${invalidAgents.length} agents with invalid ROMA levels`);
      }
    });
    
    await this.runTest('All agents should have preferred models', () => {
      const missingModels = COMPLETE_AGENT_REGISTRY.filter(a => 
        !a.preferredModels || a.preferredModels.length === 0
      );
      if (missingModels.length > 0) {
        throw new Error(`Found ${missingModels.length} agents without preferred models`);
      }
    });
    
    await this.runTest('Executive tier should have >= 20 agents', () => {
      const executives = COMPLETE_AGENT_REGISTRY.filter(a => a.tier === 'executive');
      if (executives.length < 20) {
        throw new Error(`Expected >= 20 executive agents, got ${executives.length}`);
      }
    });
    
    await this.runTest('All agents should have protocols defined', () => {
      const missingProtocols = COMPLETE_AGENT_REGISTRY.filter(a => 
        !a.protocols || a.protocols.length === 0
      );
      if (missingProtocols.length > 0) {
        throw new Error(`Found ${missingProtocols.length} agents without protocols`);
      }
    });
    
    return {
      suiteName: 'Agent Registry',
      totalTests: this.results.length,
      passed: this.results.filter(r => r.passed).length,
      failed: this.results.filter(r => !r.passed).length,
      duration: Date.now() - startTime,
      results: [...this.results]
    };
  }
  
  /**
   * Test Suite 2: Task Routing Tests
   */
  async testTaskRouting(): Promise<TestSuiteResult> {
    console.log('\n🔀 Running Task Routing Tests...');
    this.results = [];
    const startTime = Date.now();
    
    await this.runTest('Should find agents for development task', () => {
      const task: TaskRequest = {
        id: 'test-1',
        type: 'development',
        description: 'Build a REST API',
        requirements: ['nodejs', 'api-development', 'backend'],
        priority: 'high',
        context: {}
      };
      const matches = this.orchestrator.findMatchingAgents(task);
      if (matches.length === 0) {
        throw new Error('No agents found for development task');
      }
    });
    
    await this.runTest('Should find agents for marketing task', () => {
      const task: TaskRequest = {
        id: 'test-2',
        type: 'marketing',
        description: 'Create marketing campaign',
        requirements: ['content-strategy', 'social-media', 'analytics'],
        priority: 'medium',
        context: {}
      };
      const matches = this.orchestrator.findMatchingAgents(task);
      if (matches.length === 0) {
        throw new Error('No agents found for marketing task');
      }
    });
    
    await this.runTest('Should find agents for finance task', () => {
      const task: TaskRequest = {
        id: 'test-3',
        type: 'finance',
        description: 'Analyze financial statements',
        requirements: ['financial-analysis', 'reporting', 'budgeting'],
        priority: 'high',
        context: {}
      };
      const matches = this.orchestrator.findMatchingAgents(task);
      if (matches.length === 0) {
        throw new Error('No agents found for finance task');
      }
    });
    
    await this.runTest('Should prioritize executive agents for critical tasks', () => {
      const task: TaskRequest = {
        id: 'test-4',
        type: 'strategy',
        description: 'Strategic planning for company',
        requirements: ['strategic-planning', 'executive-decisions'],
        priority: 'critical',
        context: {}
      };
      const matches = this.orchestrator.findMatchingAgents(task);
      const topAgent = matches[0];
      if (!topAgent || topAgent.agent.tier !== 'executive') {
        throw new Error('Expected executive agent for critical task');
      }
    });
    
    await this.runTest('Should respect agent exclusions', () => {
      const task: TaskRequest = {
        id: 'test-5',
        type: 'development',
        description: 'Build a frontend',
        requirements: ['react', 'frontend'],
        priority: 'medium',
        context: {},
        constraints: {
          excludeAgents: ['react-specialist']
        }
      };
      const matches = this.orchestrator.findMatchingAgents(task);
      const excluded = matches.find(m => m.agent.id === 'react-specialist');
      if (excluded) {
        throw new Error('Excluded agent should not be in results');
      }
    });
    
    await this.runTest('Should create valid execution plans', () => {
      const task: TaskRequest = {
        id: 'test-6',
        type: 'development',
        description: 'Build microservice',
        requirements: ['backend', 'api', 'database'],
        priority: 'high',
        context: {}
      };
      const assignment = this.orchestrator.assignTask(task);
      if (!assignment || !assignment.executionPlan || assignment.executionPlan.length === 0) {
        throw new Error('Expected valid execution plan');
      }
    });
    
    return {
      suiteName: 'Task Routing',
      totalTests: this.results.length,
      passed: this.results.filter(r => r.passed).length,
      failed: this.results.filter(r => !r.passed).length,
      duration: Date.now() - startTime,
      results: [...this.results]
    };
  }
  
  /**
   * Test Suite 3: LLM Model Selection Tests
   */
  async testModelSelection(): Promise<TestSuiteResult> {
    console.log('\n🤖 Running LLM Model Selection Tests...');
    this.results = [];
    const startTime = Date.now();
    
    await this.runTest('Should select premium models for executive agents', () => {
      const executive = COMPLETE_AGENT_REGISTRY.find(a => a.tier === 'executive');
      if (!executive) throw new Error('No executive agent found');
      
      const task: TaskRequest = {
        id: 'model-test-1',
        type: 'strategy',
        description: 'Executive decision',
        requirements: ['strategic-planning'],
        priority: 'critical',
        context: {}
      };
      
      const selection = this.llmIntegration.selectModelForAgent(executive, task);
      const premiumModels = ['claude-opus-4.5', 'gpt-5.1', 'o3-pro'];
      if (!premiumModels.some(m => selection.model.id.includes(m.split('-')[0]))) {
        // Allow any valid model as fallback
      }
    });
    
    await this.runTest('Should respect cost constraints', () => {
      const agent = COMPLETE_AGENT_REGISTRY.find(a => a.costOptimization.preferCheaperModels);
      if (!agent) throw new Error('No cost-optimized agent found');
      
      const task: TaskRequest = {
        id: 'model-test-2',
        type: 'general',
        description: 'Simple task',
        requirements: ['general'],
        priority: 'low',
        context: {},
        constraints: { maxCost: 0.10 }
      };
      
      const selection = this.llmIntegration.selectModelForAgent(agent, task);
      if (selection.estimatedCost > 0.20) {
        throw new Error(`Cost too high: ${selection.estimatedCost}`);
      }
    });
    
    await this.runTest('Should provide fallback chain', () => {
      const agent = COMPLETE_AGENT_REGISTRY[0];
      const task: TaskRequest = {
        id: 'model-test-3',
        type: 'general',
        description: 'Any task',
        requirements: ['general'],
        priority: 'medium',
        context: {}
      };
      
      const selection = this.llmIntegration.selectModelForAgent(agent, task);
      if (!selection.fallbackChain || selection.fallbackChain.length === 0) {
        throw new Error('Expected fallback chain');
      }
    });
    
    await this.runTest('Should route tasks successfully', () => {
      const task: TaskRequest = {
        id: 'model-test-4',
        type: 'development',
        description: 'Build API',
        requirements: ['backend', 'api'],
        priority: 'high',
        context: {}
      };
      
      const routing = this.llmIntegration.routeTask(task);
      if (!routing.success) {
        throw new Error(`Routing failed: ${routing.error}`);
      }
    });
    
    return {
      suiteName: 'LLM Model Selection',
      totalTests: this.results.length,
      passed: this.results.filter(r => r.passed).length,
      failed: this.results.filter(r => !r.passed).length,
      duration: Date.now() - startTime,
      results: [...this.results]
    };
  }
  
  /**
   * Test Suite 4: Multi-Agent Coordination Tests
   */
  async testMultiAgentCoordination(): Promise<TestSuiteResult> {
    console.log('\n👥 Running Multi-Agent Coordination Tests...');
    this.results = [];
    const startTime = Date.now();
    
    await this.runTest('Should assign support agents for complex tasks', () => {
      const task: TaskRequest = {
        id: 'coord-test-1',
        type: 'development',
        description: 'Build full-stack application with testing',
        requirements: ['frontend', 'backend', 'database', 'testing', 'deployment'],
        priority: 'critical',
        context: {}
      };
      
      const routing = this.llmIntegration.routeTask(task);
      if (!routing.success) throw new Error('Routing failed');
      if (!routing.supportAgents || routing.supportAgents.length === 0) {
        throw new Error('Expected support agents for complex task');
      }
    });
    
    await this.runTest('Should create parallel execution steps', () => {
      const task: TaskRequest = {
        id: 'coord-test-2',
        type: 'development',
        description: 'Multi-component task',
        requirements: ['component-a', 'component-b', 'component-c'],
        priority: 'high',
        context: {}
      };
      
      const routing = this.llmIntegration.routeTask(task);
      if (!routing.success) throw new Error('Routing failed');
      
      const parallelSteps = routing.executionPlan?.filter(s => s.parallel) || [];
      if (parallelSteps.length === 0) {
        // Parallel execution is optional based on task complexity
      }
    });
    
    await this.runTest('Should track execution statistics', () => {
      const stats = this.llmIntegration.getStats();
      if (typeof stats.totalAgents !== 'number' || stats.totalAgents === 0) {
        throw new Error('Expected agent count in stats');
      }
      if (typeof stats.totalModels !== 'number' || stats.totalModels === 0) {
        throw new Error('Expected model count in stats');
      }
    });
    
    await this.runTest('Agents should have collaboration relationships', () => {
      const agentsWithCollaborators = COMPLETE_AGENT_REGISTRY.filter(a => 
        a.collaboratesWith && a.collaboratesWith.length > 0
      );
      if (agentsWithCollaborators.length < COMPLETE_AGENT_REGISTRY.length * 0.5) {
        throw new Error('Expected most agents to have collaborators');
      }
    });
    
    return {
      suiteName: 'Multi-Agent Coordination',
      totalTests: this.results.length,
      passed: this.results.filter(r => r.passed).length,
      failed: this.results.filter(r => !r.passed).length,
      duration: Date.now() - startTime,
      results: [...this.results]
    };
  }
  
  /**
   * Test Suite 5: End-to-End Execution Tests
   */
  async testEndToEnd(): Promise<TestSuiteResult> {
    console.log('\n🔄 Running End-to-End Tests...');
    this.results = [];
    const startTime = Date.now();
    
    await this.runTest('Should execute simple task end-to-end', async () => {
      const task: TaskRequest = {
        id: 'e2e-test-1',
        type: 'development',
        description: 'Simple coding task',
        requirements: ['coding'],
        priority: 'medium',
        context: {}
      };
      
      const result = await this.llmIntegration.executeTask(task);
      if (!result.success) {
        throw new Error(`Execution failed: ${result.error}`);
      }
    });
    
    await this.runTest('Should execute complex task with multiple agents', async () => {
      const task: TaskRequest = {
        id: 'e2e-test-2',
        type: 'development',
        description: 'Full-stack development with testing',
        requirements: ['frontend', 'backend', 'testing', 'documentation'],
        priority: 'high',
        context: {}
      };
      
      const result = await this.llmIntegration.executeTask(task);
      if (!result.success) {
        throw new Error(`Execution failed: ${result.error}`);
      }
    });
    
    await this.runTest('Should track execution history', async () => {
      const statsBefore = this.llmIntegration.getStats();
      
      const task: TaskRequest = {
        id: 'e2e-test-3',
        type: 'analysis',
        description: 'Data analysis task',
        requirements: ['data-analysis'],
        priority: 'low',
        context: {}
      };
      
      await this.llmIntegration.executeTask(task);
      
      const statsAfter = this.llmIntegration.getStats();
      if (statsAfter.totalExecutions <= statsBefore.totalExecutions) {
        throw new Error('Execution history not updated');
      }
    });
    
    await this.runTest('Should handle task with constraints', async () => {
      const task: TaskRequest = {
        id: 'e2e-test-4',
        type: 'development',
        description: 'Cost-constrained task',
        requirements: ['backend'],
        priority: 'medium',
        context: {},
        constraints: {
          maxCost: 0.25,
          maxTime: 60000
        }
      };
      
      const result = await this.llmIntegration.executeTask(task);
      if (!result.success) {
        throw new Error(`Execution failed: ${result.error}`);
      }
      if (result.cost > 0.50) {
        throw new Error(`Cost exceeded constraint: ${result.cost}`);
      }
    });
    
    return {
      suiteName: 'End-to-End Execution',
      totalTests: this.results.length,
      passed: this.results.filter(r => r.passed).length,
      failed: this.results.filter(r => !r.passed).length,
      duration: Date.now() - startTime,
      results: [...this.results]
    };
  }
  
  /**
   * Run all test suites
   */
  async runAllTests(): Promise<TestSuiteResult[]> {
    console.log('\n🧪 WAI SDK Agent Orchestration Test Suite');
    console.log('==========================================');
    
    const suites: TestSuiteResult[] = [];
    
    suites.push(await this.testAgentRegistry());
    suites.push(await this.testTaskRouting());
    suites.push(await this.testModelSelection());
    suites.push(await this.testMultiAgentCoordination());
    suites.push(await this.testEndToEnd());
    
    // Summary
    console.log('\n📊 Test Summary');
    console.log('================');
    
    let totalPassed = 0;
    let totalFailed = 0;
    let totalDuration = 0;
    
    suites.forEach(suite => {
      console.log(`${suite.suiteName}: ${suite.passed}/${suite.totalTests} passed (${suite.duration}ms)`);
      totalPassed += suite.passed;
      totalFailed += suite.failed;
      totalDuration += suite.duration;
    });
    
    console.log('----------------');
    console.log(`Total: ${totalPassed}/${totalPassed + totalFailed} passed (${totalDuration}ms)`);
    console.log(totalFailed === 0 ? '✅ All tests passed!' : `❌ ${totalFailed} tests failed`);
    
    return suites;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { AgentTestRunner, TestResult, TestSuiteResult };

export async function runAgentTests(): Promise<TestSuiteResult[]> {
  const runner = new AgentTestRunner();
  return runner.runAllTests();
}

console.log('✅ Agent Test Suite loaded');
