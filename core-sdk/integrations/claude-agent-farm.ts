/**
 * Claude Agent Farm
 * Scalable Claude agent management and orchestration system
 * Based on: https://github.com/Dicklesworthstone/claude_code_agent_farm
 * 
 * Features:
 * - Large-scale Claude agent management
 * - Distributed agent processing
 * - Intelligent load balancing
 * - Agent health monitoring
 * - Performance optimization
 */

import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';

export interface ClaudeAgent {
  id: string;
  name: string;
  model: string;
  specialty: string;
  status: 'idle' | 'busy' | 'maintenance' | 'error' | 'offline';
  configuration: {
    temperature: number;
    maxTokens: number;
    topP: number;
    systemPrompt: string;
    tools: string[];
  };
  performance: {
    requestsProcessed: number;
    averageResponseTime: number;
    successRate: number;
    currentLoad: number;
    maxConcurrentRequests: number;
    totalUptime: number;
  };
  resources: {
    cpuUsage: number;
    memoryUsage: number;
    tokenQuotaUsed: number;
    tokenQuotaLimit: number;
  };
  metadata: {
    createdAt: Date;
    lastActive: Date;
    version: string;
    region: string;
    priority: number;
  };
}

export interface AgentCluster {
  id: string;
  name: string;
  purpose: string;
  agents: Map<string, ClaudeAgent>;
  loadBalancer: LoadBalancer;
  healthChecker: HealthChecker;
  metrics: ClusterMetrics;
  configuration: ClusterConfiguration;
}

export interface LoadBalancer {
  algorithm: 'round-robin' | 'least-connections' | 'weighted' | 'performance-based';
  currentIndex: number;
  weights: Map<string, number>;
  connectionCounts: Map<string, number>;
}

export interface HealthChecker {
  interval: number;
  timeout: number;
  failureThreshold: number;
  successThreshold: number;
  endpoints: string[];
}

export interface ClusterMetrics {
  totalRequests: number;
  activeRequests: number;
  averageLatency: number;
  throughput: number;
  errorRate: number;
  utilizationRate: number;
}

export interface ClusterConfiguration {
  minAgents: number;
  maxAgents: number;
  autoScaling: boolean;
  scalingThreshold: number;
  region: string;
  redundancyLevel: number;
}

export interface AgentTask {
  id: string;
  type: 'code' | 'analysis' | 'generation' | 'review' | 'translation' | 'custom';
  input: string;
  context: Record<string, any>;
  requirements: {
    model?: string;
    specialty?: string;
    priority: number;
    timeout: number;
    retries: number;
  };
  assignment: {
    agentId?: string;
    clusterId: string;
    assignedAt?: Date;
    estimatedDuration?: number;
  };
  status: 'queued' | 'assigned' | 'processing' | 'completed' | 'failed' | 'cancelled';
  result?: {
    output: string;
    metadata: Record<string, any>;
    processingTime: number;
    tokensUsed: number;
  };
  error?: {
    code: string;
    message: string;
    retryCount: number;
    stackTrace?: string;
  };
}

export interface FarmConfiguration {
  maxConcurrentTasks: number;
  taskTimeout: number;
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
    baseDelay: number;
  };
  scaling: {
    enabled: boolean;
    minClusters: number;
    maxClusters: number;
    targetUtilization: number;
  };
  monitoring: {
    metricsRetention: number;
    alertThresholds: Record<string, number>;
    healthCheckInterval: number;
  };
}

export class ClaudeAgentFarm extends EventEmitter {
  private clusters: Map<string, AgentCluster> = new Map();
  private taskQueue: AgentTask[] = [];
  private activeTasks: Map<string, AgentTask> = new Map();
  private completedTasks: AgentTask[] = [];
  private configuration: FarmConfiguration;
  
  private scheduler: NodeJS.Timeout | null = null;
  private healthMonitor: NodeJS.Timeout | null = null;
  private metricsCollector: NodeJS.Timeout | null = null;
  private autoScaler: NodeJS.Timeout | null = null;

  constructor(config?: Partial<FarmConfiguration>) {
    super();
    
    this.configuration = {
      maxConcurrentTasks: 1000,
      taskTimeout: 300000, // 5 minutes
      retryPolicy: {
        maxRetries: 3,
        backoffMultiplier: 2,
        baseDelay: 1000
      },
      scaling: {
        enabled: true,
        minClusters: 1,
        maxClusters: 10,
        targetUtilization: 70
      },
      monitoring: {
        metricsRetention: 86400000, // 24 hours
        alertThresholds: {
          errorRate: 5,
          responseTime: 10000,
          utilizationRate: 90
        },
        healthCheckInterval: 30000
      },
      ...config
    };

    this.initializeFarm();
  }

  private initializeFarm(): void {
    // Create default cluster
    this.createCluster({
      name: 'default',
      purpose: 'General purpose Claude agents',
      minAgents: 3,
      maxAgents: 10,
      region: 'us-east-1'
    });

    // Start farm processes
    this.scheduler = setInterval(() => {
      this.processTasks();
    }, 1000);

    this.healthMonitor = setInterval(() => {
      this.performHealthChecks();
    }, this.configuration.monitoring.healthCheckInterval);

    this.metricsCollector = setInterval(() => {
      this.collectMetrics();
    }, 10000);

    if (this.configuration.scaling.enabled) {
      this.autoScaler = setInterval(() => {
        this.performAutoScaling();
      }, 60000); // Every minute
    }

    console.log('🚜 Claude Agent Farm initialized');
  }

  /**
   * Create new agent cluster
   */
  public createCluster(config: {
    name: string;
    purpose: string;
    minAgents: number;
    maxAgents: number;
    region: string;
    specialty?: string;
  }): string {
    const cluster: AgentCluster = {
      id: randomUUID(),
      name: config.name,
      purpose: config.purpose,
      agents: new Map(),
      loadBalancer: {
        algorithm: 'performance-based',
        currentIndex: 0,
        weights: new Map(),
        connectionCounts: new Map()
      },
      healthChecker: {
        interval: 30000,
        timeout: 5000,
        failureThreshold: 3,
        successThreshold: 2,
        endpoints: []
      },
      metrics: {
        totalRequests: 0,
        activeRequests: 0,
        averageLatency: 0,
        throughput: 0,
        errorRate: 0,
        utilizationRate: 0
      },
      configuration: {
        minAgents: config.minAgents,
        maxAgents: config.maxAgents,
        autoScaling: true,
        scalingThreshold: 80,
        region: config.region,
        redundancyLevel: 2
      }
    };

    // Store cluster first before adding agents
    this.clusters.set(cluster.id, cluster);

    // Initialize with minimum number of agents
    for (let i = 0; i < config.minAgents; i++) {
      this.addAgentToCluster(cluster.id, {
        specialty: config.specialty || 'general',
        model: 'claude-3-sonnet-20240229'
      });
    }
    this.emit('cluster-created', cluster);
    
    console.log(`🏭 Created cluster: ${cluster.name} with ${config.minAgents} agents`);
    return cluster.id;
  }

  /**
   * Add agent to cluster
   */
  public addAgentToCluster(
    clusterId: string,
    config: {
      specialty: string;
      model: string;
      systemPrompt?: string;
    }
  ): string {
    const cluster = this.clusters.get(clusterId);
    if (!cluster) {
      throw new Error(`Cluster not found: ${clusterId}`);
    }

    const agent: ClaudeAgent = {
      id: randomUUID(),
      name: `claude-${config.specialty}-${Math.random().toString(36).substr(2, 5)}`,
      model: config.model,
      specialty: config.specialty,
      status: 'idle',
      configuration: {
        temperature: 0.7,
        maxTokens: 4000,
        topP: 1.0,
        systemPrompt: config.systemPrompt || this.getDefaultSystemPrompt(config.specialty),
        tools: this.getDefaultTools(config.specialty)
      },
      performance: {
        requestsProcessed: 0,
        averageResponseTime: 0,
        successRate: 100,
        currentLoad: 0,
        maxConcurrentRequests: 5,
        totalUptime: 0
      },
      resources: {
        cpuUsage: 0,
        memoryUsage: 0,
        tokenQuotaUsed: 0,
        tokenQuotaLimit: 100000
      },
      metadata: {
        createdAt: new Date(),
        lastActive: new Date(),
        version: '1.0.0',
        region: cluster.configuration.region,
        priority: 1
      }
    };

    cluster.agents.set(agent.id, agent);
    cluster.loadBalancer.weights.set(agent.id, 1.0);
    cluster.loadBalancer.connectionCounts.set(agent.id, 0);

    console.log(`🤖 Added agent to cluster ${cluster.name}: ${agent.name}`);
    this.emit('agent-added', { clusterId, agent });
    
    return agent.id;
  }

  /**
   * Submit task to agent farm
   */
  public async submitTask(
    taskConfig: {
      type: AgentTask['type'];
      input: string;
      context?: Record<string, any>;
      requirements?: Partial<AgentTask['requirements']>;
      clusterId?: string;
    }
  ): Promise<string> {
    const task: AgentTask = {
      id: randomUUID(),
      type: taskConfig.type,
      input: taskConfig.input,
      context: taskConfig.context || {},
      requirements: {
        priority: 1,
        timeout: this.configuration.taskTimeout,
        retries: this.configuration.retryPolicy.maxRetries,
        ...taskConfig.requirements
      },
      assignment: {
        clusterId: taskConfig.clusterId || this.selectOptimalCluster(taskConfig)
      },
      status: 'queued'
    };

    this.taskQueue.push(task);
    
    console.log(`📋 Task submitted: ${task.type} (${task.id})`);
    this.emit('task-submitted', task);
    
    return task.id;
  }

  /**
   * Process queued tasks
   */
  private processTasks(): void {
    // Sort queue by priority
    this.taskQueue.sort((a, b) => b.requirements.priority - a.requirements.priority);

    const availableCapacity = this.configuration.maxConcurrentTasks - this.activeTasks.size;
    const tasksToProcess = this.taskQueue.splice(0, Math.min(availableCapacity, 10));

    for (const task of tasksToProcess) {
      this.assignTask(task);
    }
  }

  /**
   * Assign task to optimal agent
   */
  private async assignTask(task: AgentTask): Promise<void> {
    const cluster = this.clusters.get(task.assignment.clusterId);
    if (!cluster) {
      task.status = 'failed';
      task.error = {
        code: 'CLUSTER_NOT_FOUND',
        message: `Cluster not found: ${task.assignment.clusterId}`,
        retryCount: 0
      };
      return;
    }

    const agent = this.selectAgent(cluster, task);
    if (!agent) {
      // No agents available, put back in queue
      this.taskQueue.unshift(task);
      return;
    }

    task.assignment.agentId = agent.id;
    task.assignment.assignedAt = new Date();
    task.status = 'assigned';
    
    this.activeTasks.set(task.id, task);
    agent.status = 'busy';
    agent.performance.currentLoad++;
    cluster.loadBalancer.connectionCounts.set(agent.id, 
      (cluster.loadBalancer.connectionCounts.get(agent.id) || 0) + 1
    );

    console.log(`🎯 Task assigned: ${task.id} → ${agent.name}`);
    
    // Execute task
    this.executeTask(task, agent);
  }

  /**
   * Execute task on agent
   */
  private async executeTask(task: AgentTask, agent: ClaudeAgent): Promise<void> {
    const startTime = Date.now();
    task.status = 'processing';

    try {
      // Simulate Claude API call with agent specialization
      const result = await this.callClaudeAPI(agent, task);
      
      const processingTime = Date.now() - startTime;
      
      task.result = {
        output: result.output,
        metadata: result.metadata,
        processingTime,
        tokensUsed: result.tokensUsed
      };
      
      task.status = 'completed';
      
      // Update agent performance
      agent.performance.requestsProcessed++;
      agent.performance.averageResponseTime = 
        (agent.performance.averageResponseTime * (agent.performance.requestsProcessed - 1) + processingTime) 
        / agent.performance.requestsProcessed;
      
      agent.resources.tokenQuotaUsed += result.tokensUsed;
      agent.metadata.lastActive = new Date();

      console.log(`✅ Task completed: ${task.id} (${processingTime}ms)`);
      this.emit('task-completed', { task, agent });

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      task.error = {
        code: 'EXECUTION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        retryCount: (task.error?.retryCount || 0) + 1
      };

      if (task.error.retryCount < task.requirements.retries) {
        // Retry task
        task.status = 'queued';
        setTimeout(() => {
          this.taskQueue.unshift(task);
        }, this.configuration.retryPolicy.baseDelay * 
           Math.pow(this.configuration.retryPolicy.backoffMultiplier, task.error!.retryCount));
      } else {
        task.status = 'failed';
      }

      // Update agent error rate
      const totalRequests = agent.performance.requestsProcessed + 1;
      const currentErrors = totalRequests - (agent.performance.requestsProcessed * agent.performance.successRate / 100);
      agent.performance.successRate = ((totalRequests - currentErrors - 1) / totalRequests) * 100;

      console.log(`❌ Task failed: ${task.id} - ${task.error.message}`);
    } finally {
      // Cleanup
      agent.performance.currentLoad--;
      if (agent.performance.currentLoad === 0) {
        agent.status = 'idle';
      }

      const cluster = this.clusters.get(task.assignment.clusterId)!;
      cluster.loadBalancer.connectionCounts.set(agent.id, 
        Math.max(0, (cluster.loadBalancer.connectionCounts.get(agent.id) || 0) - 1)
      );

      this.activeTasks.delete(task.id);
      this.completedTasks.push(task);

      // Keep completed tasks limited
      if (this.completedTasks.length > 1000) {
        this.completedTasks = this.completedTasks.slice(-500);
      }
    }
  }

  /**
   * Select optimal cluster for task
   */
  private selectOptimalCluster(taskConfig: any): string {
    let bestCluster: AgentCluster | null = null;
    let bestScore = -1;

    for (const cluster of this.clusters.values()) {
      // Calculate cluster suitability score
      let score = 0;
      
      // Availability score (idle agents)
      const idleAgents = Array.from(cluster.agents.values()).filter(a => a.status === 'idle').length;
      score += (idleAgents / cluster.agents.size) * 40;
      
      // Performance score
      score += (100 - cluster.metrics.averageLatency / 100) * 20;
      
      // Utilization score (prefer less utilized)
      score += (100 - cluster.metrics.utilizationRate) * 20;
      
      // Error rate score
      score += (100 - cluster.metrics.errorRate) * 20;

      if (score > bestScore) {
        bestScore = score;
        bestCluster = cluster;
      }
    }

    return bestCluster?.id || Array.from(this.clusters.keys())[0];
  }

  /**
   * Select optimal agent from cluster
   */
  private selectAgent(cluster: AgentCluster, task: AgentTask): ClaudeAgent | null {
    const availableAgents = Array.from(cluster.agents.values()).filter(
      agent => agent.status === 'idle' && 
               agent.performance.currentLoad < agent.performance.maxConcurrentRequests &&
               (!task.requirements.specialty || agent.specialty === task.requirements.specialty) &&
               (!task.requirements.model || agent.model === task.requirements.model)
    );

    if (availableAgents.length === 0) {
      return null;
    }

    // Performance-based selection
    switch (cluster.loadBalancer.algorithm) {
      case 'round-robin':
        const index = cluster.loadBalancer.currentIndex % availableAgents.length;
        cluster.loadBalancer.currentIndex++;
        return availableAgents[index];

      case 'least-connections':
        return availableAgents.reduce((best, current) => 
          (cluster.loadBalancer.connectionCounts.get(current.id) || 0) < 
          (cluster.loadBalancer.connectionCounts.get(best.id) || 0) ? current : best
        );

      case 'performance-based':
      default:
        // Select based on performance score
        return availableAgents.reduce((best, current) => {
          const currentScore = this.calculateAgentScore(current);
          const bestScore = this.calculateAgentScore(best);
          return currentScore > bestScore ? current : best;
        });
    }
  }

  /**
   * Calculate agent performance score
   */
  private calculateAgentScore(agent: ClaudeAgent): number {
    let score = 0;
    
    // Response time score (lower is better)
    score += Math.max(0, 100 - agent.performance.averageResponseTime / 100) * 30;
    
    // Success rate score
    score += agent.performance.successRate * 25;
    
    // Load score (lower load is better)
    score += Math.max(0, 100 - (agent.performance.currentLoad / agent.performance.maxConcurrentRequests) * 100) * 25;
    
    // Resource utilization score
    score += Math.max(0, 100 - agent.resources.cpuUsage) * 20;
    
    return score;
  }

  /**
   * Simulate Claude API call
   */
  private async callClaudeAPI(agent: ClaudeAgent, task: AgentTask): Promise<{
    output: string;
    metadata: Record<string, any>;
    tokensUsed: number;
  }> {
    // Simulate API latency based on task complexity
    const baseLatency = 1000;
    const complexityMultiplier = task.input.length / 100;
    const latency = baseLatency + (complexityMultiplier * 100) + (Math.random() * 500);
    
    await new Promise(resolve => setTimeout(resolve, latency));

    // Simulate occasional failures (2% failure rate)
    if (Math.random() < 0.02) {
      throw new Error('Simulated API failure');
    }

    // Generate contextual response based on agent specialty and task type
    const output = this.generateSpecializedResponse(agent, task);
    const tokensUsed = Math.ceil(task.input.length / 4) + Math.ceil(output.length / 4);

    return {
      output,
      metadata: {
        model: agent.model,
        specialty: agent.specialty,
        processingApproach: this.getProcessingApproach(task.type),
        confidence: 0.85 + Math.random() * 0.15
      },
      tokensUsed
    };
  }

  /**
   * Generate specialized response based on agent and task
   */
  private generateSpecializedResponse(agent: ClaudeAgent, task: AgentTask): string {
    const responses: Record<string, Record<string, string>> = {
      code: {
        general: `Here's the code solution for your request:\n\n\`\`\`\n// Generated code based on: ${task.input}\nfunction solution() {\n  // Implementation here\n  return result;\n}\n\`\`\`\n\nThis code follows best practices and includes error handling.`,
        frontend: `Here's a React component solution:\n\n\`\`\`jsx\nimport React from 'react';\n\nconst Component = () => {\n  // Component logic based on: ${task.input}\n  return (\n    <div>\n      {/* Generated UI */}\n    </div>\n  );\n};\n\nexport default Component;\n\`\`\``,
        backend: `Here's a backend API solution:\n\n\`\`\`javascript\nconst express = require('express');\nconst router = express.Router();\n\n// API endpoint based on: ${task.input}\nrouter.post('/api/endpoint', async (req, res) => {\n  // Implementation here\n  res.json({ success: true });\n});\n\nmodule.exports = router;\n\`\`\``
      },
      analysis: {
        general: `Based on my analysis of your request: "${task.input}"\n\n**Key Insights:**\n- Primary factor analysis shows significant patterns\n- Data correlation indicates strong relationships\n- Recommended approach involves strategic implementation\n\n**Recommendations:**\n1. Focus on high-impact areas first\n2. Implement monitoring and feedback loops\n3. Consider scalability and maintenance`,
        data: `**Data Analysis Results:**\n\nInput analyzed: ${task.input}\n\n**Statistical Summary:**\n- Sample size: Comprehensive\n- Confidence interval: 95%\n- Key metrics identified and validated\n\n**Insights:**\n- Trend analysis shows positive correlation\n- Outlier detection completed\n- Predictive modeling suggests optimal outcomes\n\n**Action Items:**\n1. Implement recommended changes\n2. Monitor key performance indicators\n3. Schedule regular review cycles`
      }
    };

    const taskResponses = responses[task.type];
    if (taskResponses) {
      return taskResponses[agent.specialty] || taskResponses.general;
    }

    return `Task completed successfully. I've processed your request: "${task.input}" using my ${agent.specialty} expertise with the ${agent.model} model. The result addresses your requirements comprehensively.`;
  }

  /**
   * Get processing approach for task type
   */
  private getProcessingApproach(taskType: string): string {
    const approaches = {
      code: 'Structured code analysis and generation',
      analysis: 'Multi-dimensional analytical framework',
      generation: 'Creative synthesis with contextual awareness',
      review: 'Comprehensive quality assessment',
      translation: 'Contextual language processing',
      custom: 'Specialized domain-specific processing'
    } as any;

    return approaches[taskType] || 'General-purpose processing';
  }

  /**
   * Get default system prompt for specialty
   */
  private getDefaultSystemPrompt(specialty: string): string {
    const prompts = {
      general: 'You are a helpful AI assistant with broad knowledge across many domains.',
      code: 'You are an expert software engineer specializing in clean, efficient, and well-documented code.',
      frontend: 'You are a frontend development specialist with expertise in React, JavaScript, and modern web technologies.',
      backend: 'You are a backend development expert specializing in APIs, databases, and server architecture.',
      data: 'You are a data analysis expert with strong statistical and analytical capabilities.',
      creative: 'You are a creative content specialist with expertise in writing, design, and innovative thinking.'
    } as any;

    return prompts[specialty] || prompts.general;
  }

  /**
   * Get default tools for specialty
   */
  private getDefaultTools(specialty: string): string[] {
    const toolsets = {
      code: ['code_analyzer', 'syntax_checker', 'documentation_generator'],
      data: ['statistical_analyzer', 'data_visualizer', 'pattern_detector'],
      creative: ['content_generator', 'style_analyzer', 'idea_generator'],
      general: ['web_search', 'calculator', 'text_analyzer']
    } as any;

    return toolsets[specialty] || toolsets.general;
  }

  /**
   * Perform health checks on all agents
   */
  private performHealthChecks(): void {
    for (const cluster of this.clusters.values()) {
      for (const agent of cluster.agents.values()) {
        // Simulate health check
        const isHealthy = Math.random() > 0.05; // 95% healthy
        
        if (!isHealthy && agent.status !== 'error') {
          agent.status = 'error';
          console.log(`⚠️ Agent health check failed: ${agent.name}`);
          this.emit('agent-unhealthy', { clusterId: cluster.id, agent });
        } else if (isHealthy && agent.status === 'error') {
          agent.status = 'idle';
          console.log(`✅ Agent recovered: ${agent.name}`);
          this.emit('agent-recovered', { clusterId: cluster.id, agent });
        }
      }
    }
  }

  /**
   * Collect performance metrics
   */
  private collectMetrics(): void {
    for (const cluster of this.clusters.values()) {
      const agents = Array.from(cluster.agents.values());
      
      // Calculate cluster metrics
      cluster.metrics.totalRequests = agents.reduce((sum, a) => sum + a.performance.requestsProcessed, 0);
      cluster.metrics.averageLatency = agents.reduce((sum, a) => sum + a.performance.averageResponseTime, 0) / agents.length;
      cluster.metrics.errorRate = 100 - (agents.reduce((sum, a) => sum + a.performance.successRate, 0) / agents.length);
      cluster.metrics.utilizationRate = (agents.reduce((sum, a) => sum + a.performance.currentLoad, 0) / 
                                        agents.reduce((sum, a) => sum + a.performance.maxConcurrentRequests, 0)) * 100;

      // Update agent resources (simulated)
      for (const agent of agents) {
        agent.resources.cpuUsage = Math.random() * 100;
        agent.resources.memoryUsage = 20 + Math.random() * 60;
      }
    }
  }

  /**
   * Perform auto-scaling based on utilization
   */
  private performAutoScaling(): void {
    for (const cluster of this.clusters.values()) {
      if (!cluster.configuration.autoScaling) continue;

      const utilizationRate = cluster.metrics.utilizationRate;
      const currentAgentCount = cluster.agents.size;
      
      // Scale up if utilization is high
      if (utilizationRate > cluster.configuration.scalingThreshold && 
          currentAgentCount < cluster.configuration.maxAgents) {
        
        this.addAgentToCluster(cluster.id, {
          specialty: 'general',
          model: 'claude-3-sonnet-20240229'
        });
        
        console.log(`📈 Scaled up cluster ${cluster.name}: ${currentAgentCount + 1} agents`);
        this.emit('cluster-scaled-up', { clusterId: cluster.id, newSize: currentAgentCount + 1 });
      }
      
      // Scale down if utilization is low and above minimum
      else if (utilizationRate < cluster.configuration.scalingThreshold * 0.3 && 
               currentAgentCount > cluster.configuration.minAgents) {
        
        // Find least used agent to remove
        const leastUsedAgent = Array.from(cluster.agents.values())
          .filter(a => a.status === 'idle')
          .sort((a, b) => a.performance.currentLoad - b.performance.currentLoad)[0];
        
        if (leastUsedAgent) {
          cluster.agents.delete(leastUsedAgent.id);
          console.log(`📉 Scaled down cluster ${cluster.name}: ${currentAgentCount - 1} agents`);
          this.emit('cluster-scaled-down', { clusterId: cluster.id, newSize: currentAgentCount - 1 });
        }
      }
    }
  }

  /**
   * Get farm status and metrics
   */
  public getFarmStatus() {
    const clusters = Array.from(this.clusters.values());
    const totalAgents = clusters.reduce((sum, c) => sum + c.agents.size, 0);
    const activeAgents = clusters.reduce((sum, c) => 
      sum + Array.from(c.agents.values()).filter(a => a.status !== 'offline').length, 0
    );

    return {
      clusters: {
        total: clusters.length,
        healthy: clusters.filter(c => c.metrics.errorRate < 5).length,
        totalAgents,
        activeAgents,
        averageUtilization: clusters.reduce((sum, c) => sum + c.metrics.utilizationRate, 0) / clusters.length
      },
      tasks: {
        queued: this.taskQueue.length,
        active: this.activeTasks.size,
        completed: this.completedTasks.length,
        totalProcessed: this.completedTasks.filter(t => t.status === 'completed').length
      },
      performance: {
        averageResponseTime: clusters.reduce((sum, c) => sum + c.metrics.averageLatency, 0) / clusters.length,
        throughput: clusters.reduce((sum, c) => sum + c.metrics.throughput, 0),
        errorRate: clusters.reduce((sum, c) => sum + c.metrics.errorRate, 0) / clusters.length,
        successRate: this.calculateOverallSuccessRate()
      }
    };
  }

  private calculateOverallSuccessRate(): number {
    const completedTasks = this.completedTasks.filter(t => t.status === 'completed' || t.status === 'failed');
    if (completedTasks.length === 0) return 100;
    
    const successfulTasks = completedTasks.filter(t => t.status === 'completed').length;
    return (successfulTasks / completedTasks.length) * 100;
  }

  /**
   * Shutdown agent farm
   */
  public shutdown(): void {
    if (this.scheduler) clearInterval(this.scheduler);
    if (this.healthMonitor) clearInterval(this.healthMonitor);
    if (this.metricsCollector) clearInterval(this.metricsCollector);
    if (this.autoScaler) clearInterval(this.autoScaler);
    
    console.log('🔴 Claude Agent Farm shutdown');
  }
}

// Singleton instance for global access
export const claudeAgentFarm = new ClaudeAgentFarm();

// Default export
export default claudeAgentFarm;