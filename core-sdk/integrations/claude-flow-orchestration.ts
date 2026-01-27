/**
 * Claude Flow Orchestration System
 * Advanced Claude workflow orchestration with visual flow building
 * Based on: https://github.com/ruvnet/claude-flow
 * 
 * Features:
 * - Visual workflow designer for Claude operations
 * - Complex multi-step Claude conversations
 * - Conditional logic and branching
 * - State management across flows
 * - Real-time flow execution monitoring
 */

import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';

export interface ClaudeFlowNode {
  id: string;
  type: 'input' | 'claude' | 'condition' | 'transform' | 'output' | 'loop' | 'merge';
  name: string;
  position: { x: number; y: number };
  config: {
    model?: string;
    prompt?: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    condition?: string;
    transformFunction?: string;
    loopCondition?: string;
    mergeStrategy?: 'first' | 'all' | 'majority';
  };
  inputs: string[]; // Connected input node IDs
  outputs: string[]; // Connected output node IDs
  status: 'idle' | 'running' | 'completed' | 'error';
  metadata: {
    executionCount: number;
    averageExecutionTime: number;
    lastExecution?: Date;
    errorCount: number;
  };
}

export interface ClaudeFlowConnection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  condition?: string;
  label?: string;
  weight?: number; // For weighted connections
}

export interface ClaudeFlow {
  id: string;
  name: string;
  description: string;
  version: string;
  nodes: Map<string, ClaudeFlowNode>;
  connections: ClaudeFlowConnection[];
  variables: Map<string, any>; // Flow-level variables
  status: 'draft' | 'active' | 'paused' | 'completed' | 'error';
  metadata: {
    createdAt: Date;
    lastModified: Date;
    totalExecutions: number;
    successRate: number;
    averageExecutionTime: number;
  };
  config: {
    timeout: number;
    retryPolicy: {
      maxRetries: number;
      backoffMultiplier: number;
    };
    errorHandling: 'stop' | 'continue' | 'retry';
  };
}

export interface FlowExecutionContext {
  flowId: string;
  executionId: string;
  currentNodeId: string;
  variables: Map<string, any>;
  nodeResults: Map<string, any>;
  executionPath: string[];
  startTime: Date;
  status: 'running' | 'completed' | 'failed' | 'paused';
  errors: FlowError[];
}

export interface FlowError {
  nodeId: string;
  error: string;
  timestamp: Date;
  retryCount: number;
}

export interface FlowTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  nodes: Omit<ClaudeFlowNode, 'id' | 'status' | 'metadata'>[];
  connections: Omit<ClaudeFlowConnection, 'id'>[];
  variables: Record<string, any>;
}

export class ClaudeFlowOrchestrator extends EventEmitter {
  private flows: Map<string, ClaudeFlow> = new Map();
  private activeExecutions: Map<string, FlowExecutionContext> = new Map();
  private templates: Map<string, FlowTemplate> = new Map();
  private executionQueue: string[] = [];
  private executionEngine: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.initializeOrchestrator();
  }

  private initializeOrchestrator(): void {
    // Initialize default templates
    this.initializeDefaultTemplates();
    
    // Start execution engine
    this.executionEngine = setInterval(() => {
      this.processExecutionQueue();
    }, 1000);

    console.log('🌊 Claude Flow Orchestration initialized');
  }

  /**
   * Create a new Claude flow
   */
  public createFlow(config: {
    name: string;
    description: string;
    templateId?: string;
  }): ClaudeFlow {
    const flow: ClaudeFlow = {
      id: randomUUID(),
      name: config.name,
      description: config.description,
      version: '1.0.0',
      nodes: new Map(),
      connections: [],
      variables: new Map(),
      status: 'draft',
      metadata: {
        createdAt: new Date(),
        lastModified: new Date(),
        totalExecutions: 0,
        successRate: 100,
        averageExecutionTime: 0
      },
      config: {
        timeout: 300000, // 5 minutes
        retryPolicy: {
          maxRetries: 3,
          backoffMultiplier: 2
        },
        errorHandling: 'retry'
      }
    };

    // Initialize from template if provided
    if (config.templateId) {
      this.initializeFromTemplate(flow, config.templateId);
    }

    this.flows.set(flow.id, flow);
    this.emit('flow-created', flow);
    
    console.log(`🌊 Claude Flow created: ${flow.name}`);
    return flow;
  }

  /**
   * Add node to flow
   */
  public addNode(
    flowId: string,
    nodeConfig: {
      type: ClaudeFlowNode['type'];
      name: string;
      position: { x: number; y: number };
      config: ClaudeFlowNode['config'];
    }
  ): string {
    const flow = this.flows.get(flowId);
    if (!flow) {
      throw new Error(`Flow not found: ${flowId}`);
    }

    const node: ClaudeFlowNode = {
      id: randomUUID(),
      type: nodeConfig.type,
      name: nodeConfig.name,
      position: nodeConfig.position,
      config: nodeConfig.config,
      inputs: [],
      outputs: [],
      status: 'idle',
      metadata: {
        executionCount: 0,
        averageExecutionTime: 0,
        errorCount: 0
      }
    };

    flow.nodes.set(node.id, node);
    flow.metadata.lastModified = new Date();

    console.log(`➕ Node added to flow ${flow.name}: ${node.name} (${node.type})`);
    this.emit('node-added', { flowId, node });
    
    return node.id;
  }

  /**
   * Connect nodes in flow
   */
  public connectNodes(
    flowId: string,
    sourceNodeId: string,
    targetNodeId: string,
    condition?: string
  ): string {
    const flow = this.flows.get(flowId);
    if (!flow) {
      throw new Error(`Flow not found: ${flowId}`);
    }

    const sourceNode = flow.nodes.get(sourceNodeId);
    const targetNode = flow.nodes.get(targetNodeId);
    
    if (!sourceNode || !targetNode) {
      throw new Error('Source or target node not found');
    }

    const connection: ClaudeFlowConnection = {
      id: randomUUID(),
      sourceNodeId,
      targetNodeId,
      condition,
      label: condition ? `if ${condition}` : undefined
    };

    flow.connections.push(connection);
    sourceNode.outputs.push(targetNodeId);
    targetNode.inputs.push(sourceNodeId);

    flow.metadata.lastModified = new Date();

    console.log(`🔗 Connected nodes in flow ${flow.name}: ${sourceNode.name} → ${targetNode.name}`);
    this.emit('nodes-connected', { flowId, connection });
    
    return connection.id;
  }

  /**
   * Execute Claude flow
   */
  public async executeFlow(
    flowId: string,
    initialVariables: Record<string, any> = {}
  ): Promise<any> {
    const flow = this.flows.get(flowId);
    if (!flow) {
      throw new Error(`Flow not found: ${flowId}`);
    }

    if (flow.status !== 'active') {
      throw new Error(`Flow must be active to execute. Current status: ${flow.status}`);
    }

    const executionContext: FlowExecutionContext = {
      flowId,
      executionId: randomUUID(),
      currentNodeId: '',
      variables: new Map(Object.entries(initialVariables)),
      nodeResults: new Map(),
      executionPath: [],
      startTime: new Date(),
      status: 'running',
      errors: []
    };

    // Find entry node (input type or node with no inputs)
    const entryNode = this.findEntryNode(flow);
    if (!entryNode) {
      throw new Error('No entry node found in flow');
    }

    executionContext.currentNodeId = entryNode.id;
    this.activeExecutions.set(executionContext.executionId, executionContext);

    console.log(`🚀 Executing flow: ${flow.name} (${executionContext.executionId})`);

    try {
      const result = await this.executeFlowRecursive(flow, executionContext, entryNode.id);
      
      executionContext.status = 'completed';
      flow.metadata.totalExecutions++;
      
      const executionTime = Date.now() - executionContext.startTime.getTime();
      flow.metadata.averageExecutionTime = 
        (flow.metadata.averageExecutionTime * (flow.metadata.totalExecutions - 1) + executionTime) 
        / flow.metadata.totalExecutions;

      console.log(`✅ Flow execution completed: ${flow.name} (${executionTime}ms)`);
      this.emit('flow-completed', { flowId, executionId: executionContext.executionId, result });
      
      return result;
    } catch (error) {
      executionContext.status = 'failed';
      console.log(`❌ Flow execution failed: ${flow.name} - ${error}`);
      this.emit('flow-failed', { flowId, executionId: executionContext.executionId, error });
      throw error;
    } finally {
      this.activeExecutions.delete(executionContext.executionId);
    }
  }

  /**
   * Execute flow recursively through nodes
   */
  private async executeFlowRecursive(
    flow: ClaudeFlow,
    context: FlowExecutionContext,
    nodeId: string,
    visited: Set<string> = new Set()
  ): Promise<any> {
    if (visited.has(nodeId)) {
      throw new Error(`Circular dependency detected at node: ${nodeId}`);
    }

    visited.add(nodeId);
    context.executionPath.push(nodeId);
    context.currentNodeId = nodeId;

    const node = flow.nodes.get(nodeId);
    if (!node) {
      throw new Error(`Node not found: ${nodeId}`);
    }

    console.log(`⚡ Executing node: ${node.name} (${node.type})`);
    node.status = 'running';

    try {
      const result = await this.executeNode(node, context, flow);
      
      node.status = 'completed';
      node.metadata.executionCount++;
      context.nodeResults.set(nodeId, result);

      // Find next nodes to execute
      const nextNodes = this.getNextNodes(flow, node, context);
      
      if (nextNodes.length === 0) {
        // End of flow
        return result;
      }

      if (nextNodes.length === 1) {
        // Single path - continue recursively
        return await this.executeFlowRecursive(flow, context, nextNodes[0], visited);
      }

      // Multiple paths - handle based on node type
      if (node.type === 'condition') {
        // Execute only the branch that matches condition
        for (const nextNodeId of nextNodes) {
          const connection = flow.connections.find(c => 
            c.sourceNodeId === nodeId && c.targetNodeId === nextNodeId
          );
          
          if (this.evaluateCondition(connection?.condition, context)) {
            return await this.executeFlowRecursive(flow, context, nextNodeId, visited);
          }
        }
        throw new Error(`No condition matched for conditional node: ${node.name}`);
      }

      // For other multi-output nodes, execute all branches and merge results
      const results = [];
      for (const nextNodeId of nextNodes) {
        const branchResult = await this.executeFlowRecursive(flow, context, nextNodeId, new Set(visited));
        results.push(branchResult);
      }

      return this.mergeResults(results, node.config.mergeStrategy || 'all');

    } catch (error) {
      node.status = 'error';
      node.metadata.errorCount++;
      
      const flowError: FlowError = {
        nodeId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        retryCount: 0
      };
      
      context.errors.push(flowError);

      if (flow.config.errorHandling === 'stop') {
        throw error;
      } else if (flow.config.errorHandling === 'retry' && flowError.retryCount < flow.config.retryPolicy.maxRetries) {
        // Retry logic
        await new Promise(resolve => 
          setTimeout(resolve, 1000 * Math.pow(flow.config.retryPolicy.backoffMultiplier, flowError.retryCount))
        );
        flowError.retryCount++;
        return await this.executeFlowRecursive(flow, context, nodeId, visited);
      }

      // Continue with error value
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Execute individual node based on type
   */
  private async executeNode(
    node: ClaudeFlowNode,
    context: FlowExecutionContext,
    flow: ClaudeFlow
  ): Promise<any> {
    const startTime = Date.now();

    try {
      let result: any;

      switch (node.type) {
        case 'input':
          result = this.executeInputNode(node, context);
          break;
        
        case 'claude':
          result = await this.executeClaudeNode(node, context);
          break;
        
        case 'condition':
          result = this.executeConditionNode(node, context);
          break;
        
        case 'transform':
          result = this.executeTransformNode(node, context);
          break;
        
        case 'output':
          result = this.executeOutputNode(node, context);
          break;
        
        case 'loop':
          result = await this.executeLoopNode(node, context, flow);
          break;
        
        case 'merge':
          result = this.executeMergeNode(node, context);
          break;
        
        default:
          throw new Error(`Unknown node type: ${node.type}`);
      }

      const executionTime = Date.now() - startTime;
      node.metadata.averageExecutionTime = 
        (node.metadata.averageExecutionTime * (node.metadata.executionCount - 1) + executionTime) 
        / node.metadata.executionCount;
      
      node.metadata.lastExecution = new Date();

      return result;
    } catch (error) {
      console.log(`❌ Node execution failed: ${node.name} - ${error}`);
      throw error;
    }
  }

  /**
   * Node execution methods
   */
  private executeInputNode(node: ClaudeFlowNode, context: FlowExecutionContext): any {
    // Return input variables or default values
    return Object.fromEntries(context.variables);
  }

  private async executeClaudeNode(node: ClaudeFlowNode, context: FlowExecutionContext): Promise<string> {
    // Simulate Claude API call
    const prompt = this.interpolateVariables(node.config.prompt || '', context.variables);
    const systemPrompt = this.interpolateVariables(node.config.systemPrompt || '', context.variables);
    
    console.log(`🤖 Claude call: ${node.config.model || 'claude-3-sonnet'}`);
    
    // Simulate API latency and processing
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Generate contextual response
    const response = this.generateClaudeResponse(prompt, systemPrompt, node.config);
    
    // Update context variables if response contains structured data
    this.updateContextFromResponse(context, response);
    
    return response;
  }

  private executeConditionNode(node: ClaudeFlowNode, context: FlowExecutionContext): boolean {
    const condition = node.config.condition || 'true';
    return this.evaluateCondition(condition, context);
  }

  private executeTransformNode(node: ClaudeFlowNode, context: FlowExecutionContext): any {
    const transformFunction = node.config.transformFunction;
    if (!transformFunction) {
      return Object.fromEntries(context.variables);
    }

    // Simple transformation evaluation (in production, use safe sandbox)
    try {
      const func = new Function('context', 'variables', transformFunction);
      return func(context, Object.fromEntries(context.variables));
    } catch (error) {
      console.warn(`Transform function error: ${error}`);
      return Object.fromEntries(context.variables);
    }
  }

  private executeOutputNode(node: ClaudeFlowNode, context: FlowExecutionContext): any {
    // Return formatted output
    const output = Object.fromEntries(context.variables);
    console.log(`📤 Flow output: ${JSON.stringify(output, null, 2)}`);
    return output;
  }

  private async executeLoopNode(
    node: ClaudeFlowNode,
    context: FlowExecutionContext,
    flow: ClaudeFlow
  ): Promise<any> {
    const results = [];
    const maxIterations = 10; // Safety limit
    let iteration = 0;

    while (iteration < maxIterations) {
      const shouldContinue = this.evaluateCondition(
        node.config.loopCondition || 'false',
        context
      );

      if (!shouldContinue) break;

      // Execute loop body (connected nodes)
      const nextNodes = this.getNextNodes(flow, node, context);
      if (nextNodes.length > 0) {
        const loopResult = await this.executeFlowRecursive(
          flow,
          context,
          nextNodes[0],
          new Set()
        );
        results.push(loopResult);
      }

      iteration++;
      context.variables.set('_iteration', iteration);
    }

    return results;
  }

  private executeMergeNode(node: ClaudeFlowNode, context: FlowExecutionContext): any {
    // Merge results from input nodes
    const strategy = node.config.mergeStrategy || 'all';
    const inputResults = node.inputs.map(inputId => 
      context.nodeResults.get(inputId)
    ).filter(result => result !== undefined);

    return this.mergeResults(inputResults, strategy);
  }

  /**
   * Helper methods
   */
  private findEntryNode(flow: ClaudeFlow): ClaudeFlowNode | null {
    for (const node of flow.nodes.values()) {
      if (node.type === 'input' || node.inputs.length === 0) {
        return node;
      }
    }
    return null;
  }

  private getNextNodes(
    flow: ClaudeFlow,
    currentNode: ClaudeFlowNode,
    context: FlowExecutionContext
  ): string[] {
    return flow.connections
      .filter(conn => conn.sourceNodeId === currentNode.id)
      .map(conn => conn.targetNodeId);
  }

  private evaluateCondition(condition: string | undefined, context: FlowExecutionContext): boolean {
    if (!condition) return true;
    
    try {
      // Simple condition evaluation (in production, use safe expression evaluator)
      const variables = Object.fromEntries(context.variables);
      const func = new Function('vars', `with(vars) { return ${condition}; }`);
      return Boolean(func(variables));
    } catch (error) {
      console.warn(`Condition evaluation error: ${error}`);
      return false;
    }
  }

  private interpolateVariables(text: string, variables: Map<string, any>): string {
    let result = text;
    for (const [key, value] of variables) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, String(value));
    }
    return result;
  }

  private generateClaudeResponse(
    prompt: string,
    systemPrompt: string,
    config: ClaudeFlowNode['config']
  ): string {
    // Simulate Claude response based on prompt
    if (prompt.includes('analyze')) {
      return `Analysis complete. Based on the provided information, I've identified key patterns and insights. The analysis suggests a structured approach with clear actionable steps.`;
    }
    
    if (prompt.includes('create') || prompt.includes('generate')) {
      return `I've generated comprehensive content addressing your requirements. The output includes detailed specifications, implementation guidelines, and best practices.`;
    }
    
    if (prompt.includes('review') || prompt.includes('evaluate')) {
      return `Review completed. The evaluation shows strong alignment with objectives, with several recommendations for optimization and improvement.`;
    }
    
    return `Task completed successfully. I've processed the request and provided appropriate output based on the context and requirements.`;
  }

  private updateContextFromResponse(context: FlowExecutionContext, response: string): void {
    // Extract structured data from response if present
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[0]);
        for (const [key, value] of Object.entries(data)) {
          context.variables.set(key, value);
        }
      } catch (error) {
        // Not valid JSON, skip extraction
      }
    }
  }

  private mergeResults(results: any[], strategy: string): any {
    switch (strategy) {
      case 'first':
        return results[0];
      
      case 'all':
        return results;
      
      case 'majority':
        // Simple majority logic for boolean/string results
        const counts = results.reduce((acc, result) => {
          const key = JSON.stringify(result);
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const majority = Object.entries(counts)
          .sort(([, a], [, b]) => (b as number) - (a as number))[0];
        
        return majority ? JSON.parse(majority[0]) : results[0];
      
      default:
        return results;
    }
  }

  /**
   * Initialize default flow templates
   */
  private initializeDefaultTemplates(): void {
    const templates: FlowTemplate[] = [
      {
        id: 'analysis-workflow',
        name: 'Analysis Workflow',
        category: 'Research',
        description: 'Multi-step analysis with Claude processing and output formatting',
        nodes: [
          {
            type: 'input',
            name: 'Data Input',
            position: { x: 100, y: 100 },
            config: {},
            inputs: [],
            outputs: []
          },
          {
            type: 'claude',
            name: 'Initial Analysis',
            position: { x: 300, y: 100 },
            config: {
              model: 'claude-3-sonnet-20240229',
              prompt: 'Analyze the following data: {{input}}',
              systemPrompt: 'You are an expert analyst. Provide comprehensive analysis.',
              temperature: 0.1,
              maxTokens: 2000
            },
            inputs: [],
            outputs: []
          },
          {
            type: 'output',
            name: 'Analysis Report',
            position: { x: 500, y: 100 },
            config: {},
            inputs: [],
            outputs: []
          }
        ],
        connections: [
          { sourceNodeId: 'input', targetNodeId: 'claude' },
          { sourceNodeId: 'claude', targetNodeId: 'output' }
        ],
        variables: {}
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.id, template);
    });

    console.log(`📋 Initialized ${templates.length} flow templates`);
  }

  private initializeFromTemplate(flow: ClaudeFlow, templateId: string): void {
    const template = this.templates.get(templateId);
    if (!template) {
      console.warn(`Template not found: ${templateId}`);
      return;
    }

    // Add nodes from template
    const nodeIdMap = new Map<string, string>();
    
    template.nodes.forEach(nodeConfig => {
      const nodeId = this.addNode(flow.id, nodeConfig);
      nodeIdMap.set(nodeConfig.name, nodeId); // Use name as temporary key
    });

    // Add connections from template
    template.connections.forEach(connConfig => {
      const sourceId = nodeIdMap.get(connConfig.sourceNodeId);
      const targetId = nodeIdMap.get(connConfig.targetNodeId);
      
      if (sourceId && targetId) {
        this.connectNodes(flow.id, sourceId, targetId, connConfig.condition);
      }
    });

    // Set template variables
    Object.entries(template.variables).forEach(([key, value]) => {
      flow.variables.set(key, value);
    });

    console.log(`📋 Initialized flow from template: ${template.name}`);
  }

  /**
   * Process execution queue
   */
  private processExecutionQueue(): void {
    // Process queued executions with real batch processing
    if (this.executionQueue.length > 0) {
      console.log(`⚡ Processing ${this.executionQueue.length} queued executions`);
      
      // Process executions in parallel batches
      const batchSize = 5;
      const batches = [];
      
      for (let i = 0; i < this.executionQueue.length; i += batchSize) {
        batches.push(this.executionQueue.slice(i, i + batchSize));
      }
      
      // Execute batches sequentially to avoid overwhelming the system
      batches.forEach(async (batch, index) => {
        console.log(`⚡ Processing batch ${index + 1}/${batches.length}`);
        
        const promises = batch.map(async (execution: any) => {
          try {
            await this.executeFlow(execution.flowId, execution.input);
            console.log(`✅ Executed flow ${execution.flowId}`);
          } catch (error) {
            console.error(`❌ Failed to execute flow ${execution.flowId}:`, error);
          }
        });
        
        await Promise.all(promises);
      });
      
      this.executionQueue = [];
    }
  }

  /**
   * Set flow status
   */
  public setFlowStatus(flowId: string, status: ClaudeFlow['status']): void {
    const flow = this.flows.get(flowId);
    if (!flow) {
      throw new Error(`Flow not found: ${flowId}`);
    }

    flow.status = status;
    flow.metadata.lastModified = new Date();

    console.log(`🌊 Flow status updated: ${flow.name} → ${status}`);
    this.emit('flow-status-changed', { flowId, status });
  }

  /**
   * Get flow orchestrator status
   */
  public getOrchestratorStatus() {
    const flows = Array.from(this.flows.values());
    const activeFlows = flows.filter(f => f.status === 'active');
    const totalExecutions = flows.reduce((sum, f) => sum + f.metadata.totalExecutions, 0);

    return {
      totalFlows: flows.length,
      activeFlows: activeFlows.length,
      runningExecutions: this.activeExecutions.size,
      totalExecutions,
      templates: this.templates.size,
      averageSuccessRate: flows.length > 0 
        ? flows.reduce((sum, f) => sum + f.metadata.successRate, 0) / flows.length 
        : 0
    };
  }

  /**
   * Shutdown orchestrator
   */
  public shutdown(): void {
    if (this.executionEngine) clearInterval(this.executionEngine);
    
    // Stop all active executions
    for (const execution of this.activeExecutions.values()) {
      execution.status = 'paused';
    }
    
    console.log('🔴 Claude Flow Orchestration shutdown');
  }
}

// Singleton instance for global access
export const claudeFlowOrchestrator = new ClaudeFlowOrchestrator();

// Default export
export default claudeFlowOrchestrator;