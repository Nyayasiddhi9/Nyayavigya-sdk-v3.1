/**
 * WAI State Tracking & Monitoring System v9.0
 * 
 * Comprehensive state persistence and real-time monitoring with:
 * - Real-time orchestration state tracking
 * - Performance metrics and analytics
 * - Agent coordination monitoring  
 * - LLM provider health and usage tracking
 * - Database persistence for all states
 * - Real-time dashboards and alerts
 * - Predictive analytics and insights
 */

import { EventEmitter } from 'events';
import { Pool } from 'pg';
import { randomUUID as uuidv4 } from 'crypto';

export interface OrchestrationState {
  id: string;
  sessionId: string;
  agentId: string;
  userId?: string;
  status: 'initializing' | 'processing' | 'completed' | 'failed' | 'cancelled';
  phase: 'planning' | 'routing' | 'execution' | 'validation' | 'cleanup';
  progress: number; // 0-100
  startTime: Date;
  endTime?: Date;
  duration?: number;
  metadata: {
    taskType: string;
    complexity: 'simple' | 'medium' | 'complex' | 'enterprise';
    priority: 'low' | 'normal' | 'high' | 'critical';
    resourcesUsed: string[];
    providersInvolved: string[];
    agentsCoordinated: string[];
    memoryOperations: number;
    securityChecks: number;
    errorCount: number;
    warningCount: number;
  };
  metrics: {
    cpuUsage: number;
    memoryUsage: number;
    networkCalls: number;
    databaseQueries: number;
    cacheHits: number;
    cacheMisses: number;
    responseTime: number;
    throughput: number;
  };
  context: Record<string, any>;
}

export interface AgentState {
  agentId: string;
  name: string;
  type: 'executive' | 'development' | 'creative' | 'qa' | 'devops' | 'domain';
  status: 'idle' | 'busy' | 'waiting' | 'error' | 'offline';
  currentTask?: string;
  orchestrationId?: string;
  capabilities: string[];
  performance: {
    tasksCompleted: number;
    averageResponseTime: number;
    successRate: number;
    currentLoad: number;
    maxConcurrency: number;
  };
  resources: {
    cpuAllocation: number;
    memoryAllocation: number;
    networkBandwidth: number;
    priority: number;
  };
  lastActivity: Date;
  healthScore: number; // 0-100
  metadata: Record<string, any>;
}

export interface ProviderState {
  providerId: string;
  name: string;
  type: 'llm' | 'memory' | 'storage' | 'compute' | 'security';
  status: 'healthy' | 'degraded' | 'unhealthy' | 'offline';
  health: {
    uptime: number;
    responseTime: number;
    successRate: number;
    errorRate: number;
    throughput: number;
    capacity: number;
    utilization: number;
  };
  quota: {
    requests: { current: number; limit: number; reset: Date };
    tokens: { current: number; limit: number; reset: Date };
    cost: { current: number; limit: number; period: string };
  };
  models?: {
    available: string[];
    activeModel: string;
    modelMetrics: Record<string, any>;
  };
  lastCheck: Date;
  metadata: Record<string, any>;
}

export interface SystemMetrics {
  timestamp: Date;
  orchestration: {
    activeSessions: number;
    completedToday: number;
    failureRate: number;
    averageResponseTime: number;
    peakThroughput: number;
    resourceUtilization: number;
  };
  agents: {
    totalAgents: number;
    activeAgents: number;
    idleAgents: number;
    errorAgents: number;
    averageLoad: number;
    topPerformers: string[];
    bottlenecks: string[];
  };
  providers: {
    totalProviders: number;
    healthyProviders: number;
    degradedProviders: number;
    offlineProviders: number;
    costToday: number;
    tokensUsed: number;
    quotaWarnings: string[];
  };
  memory: {
    totalMemories: number;
    memoriesCreatedToday: number;
    searchesPerformed: number;
    averageSearchTime: number;
    cacheHitRate: number;
    storageUtilization: number;
  };
  security: {
    authenticationsToday: number;
    failedAuthentications: number;
    activeThreats: number;
    blockedRequests: number;
    complianceScore: number;
  };
  infrastructure: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkUsage: number;
    databaseConnections: number;
    queueDepth: number;
  };
}

export interface StateAlert {
  id: string;
  type: 'performance' | 'security' | 'resource' | 'business' | 'system';
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  description: string;
  source: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata: Record<string, any>;
  actions: AlertAction[];
}

export interface AlertAction {
  id: string;
  type: 'notify' | 'scale' | 'throttle' | 'block' | 'restart' | 'escalate';
  description: string;
  executed: boolean;
  executedAt?: Date;
  result?: string;
}

export class WAIStateTrackingSystem extends EventEmitter {
  private dbPool: Pool;
  private orchestrationStates: Map<string, OrchestrationState> = new Map();
  private agentStates: Map<string, AgentState> = new Map();
  private providerStates: Map<string, ProviderState> = new Map();
  private systemMetrics: SystemMetrics;
  private activeAlerts: Map<string, StateAlert> = new Map();
  private metricsHistory: SystemMetrics[] = [];
  private isInitialized: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(databaseUrl?: string) {
    super();
    
    this.dbPool = new Pool({
      connectionString: databaseUrl || process.env.DATABASE_URL,
      max: 25,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Initialize system metrics
    this.systemMetrics = this.createInitialMetrics();

    this.setupEventHandlers();
  }

  /**
   * Initialize state tracking system and database schema
   */
  async initialize(): Promise<void> {
    try {
      console.log('📊 Initializing WAI State Tracking System v9.0...');

      // Create database tables
      await this.createTrackingTables();
      
      // Load existing states from database
      await this.loadExistingStates();
      
      // Start real-time monitoring
      this.startRealTimeMonitoring();
      
      this.isInitialized = true;
      
      console.log('✅ WAI State Tracking System v9.0 initialized successfully');
      this.emit('state-tracking-initialized', { timestamp: new Date() });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Failed to initialize WAI State Tracking System:', errorMessage);
      this.emit('tracking-error', { stage: 'initialization', error: errorMessage });
      throw error;
    }
  }

  /**
   * Track orchestration session state
   */
  async trackOrchestration(state: Partial<OrchestrationState>): Promise<string> {
    try {
      const orchestrationId = state.id || uuidv4();
      const now = new Date();

      const orchestrationState: OrchestrationState = {
        id: orchestrationId,
        sessionId: state.sessionId || uuidv4(),
        agentId: state.agentId || 'system',
        userId: state.userId,
        status: state.status || 'initializing',
        phase: state.phase || 'planning',
        progress: state.progress || 0,
        startTime: state.startTime || now,
        endTime: state.endTime,
        duration: state.duration,
        metadata: {
          taskType: state.metadata?.taskType || 'unknown',
          complexity: state.metadata?.complexity || 'medium',
          priority: state.metadata?.priority || 'normal',
          resourcesUsed: state.metadata?.resourcesUsed || [],
          providersInvolved: state.metadata?.providersInvolved || [],
          agentsCoordinated: state.metadata?.agentsCoordinated || [],
          memoryOperations: state.metadata?.memoryOperations || 0,
          securityChecks: state.metadata?.securityChecks || 0,
          errorCount: state.metadata?.errorCount || 0,
          warningCount: state.metadata?.warningCount || 0,
          ...state.metadata
        },
        metrics: {
          cpuUsage: state.metrics?.cpuUsage || 0,
          memoryUsage: state.metrics?.memoryUsage || 0,
          networkCalls: state.metrics?.networkCalls || 0,
          databaseQueries: state.metrics?.databaseQueries || 0,
          cacheHits: state.metrics?.cacheHits || 0,
          cacheMisses: state.metrics?.cacheMisses || 0,
          responseTime: state.metrics?.responseTime || 0,
          throughput: state.metrics?.throughput || 0,
          ...state.metrics
        },
        context: state.context || {}
      };

      // Store in memory
      this.orchestrationStates.set(orchestrationId, orchestrationState);

      // Persist to database
      await this.dbPool.query(`
        INSERT INTO wai_orchestration_states (
          id, session_id, agent_id, user_id, status, phase, progress,
          start_time, end_time, duration, metadata, metrics, context
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          phase = EXCLUDED.phase,
          progress = EXCLUDED.progress,
          end_time = EXCLUDED.end_time,
          duration = EXCLUDED.duration,
          metadata = EXCLUDED.metadata,
          metrics = EXCLUDED.metrics,
          context = EXCLUDED.context,
          updated_at = NOW()
      `, [
        orchestrationState.id,
        orchestrationState.sessionId,
        orchestrationState.agentId,
        orchestrationState.userId,
        orchestrationState.status,
        orchestrationState.phase,
        orchestrationState.progress,
        orchestrationState.startTime,
        orchestrationState.endTime,
        orchestrationState.duration,
        JSON.stringify(orchestrationState.metadata),
        JSON.stringify(orchestrationState.metrics),
        JSON.stringify(orchestrationState.context)
      ]);

      // Check for alerts
      await this.checkOrchestrationAlerts(orchestrationState);

      this.emit('orchestration-tracked', {
        orchestrationId,
        status: orchestrationState.status,
        phase: orchestrationState.phase,
        progress: orchestrationState.progress,
        timestamp: new Date()
      });

      return orchestrationId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('tracking-error', { stage: 'orchestration-tracking', error: errorMessage });
      throw error;
    }
  }

  /**
   * Track agent state and performance
   */
  async trackAgent(agentState: Partial<AgentState>): Promise<void> {
    try {
      const agentId = agentState.agentId!;
      const now = new Date();

      const currentState = this.agentStates.get(agentId) || {} as AgentState;
      
      const updatedState: AgentState = {
        agentId,
        name: agentState.name || currentState.name || agentId,
        type: agentState.type || currentState.type || 'development',
        status: agentState.status || currentState.status || 'idle',
        currentTask: agentState.currentTask || currentState.currentTask,
        orchestrationId: agentState.orchestrationId || currentState.orchestrationId,
        capabilities: agentState.capabilities || currentState.capabilities || [],
        performance: {
          tasksCompleted: agentState.performance?.tasksCompleted ?? currentState.performance?.tasksCompleted ?? 0,
          averageResponseTime: agentState.performance?.averageResponseTime ?? currentState.performance?.averageResponseTime ?? 0,
          successRate: agentState.performance?.successRate ?? currentState.performance?.successRate ?? 100,
          currentLoad: agentState.performance?.currentLoad ?? currentState.performance?.currentLoad ?? 0,
          maxConcurrency: agentState.performance?.maxConcurrency ?? currentState.performance?.maxConcurrency ?? 1,
          ...agentState.performance
        },
        resources: {
          cpuAllocation: agentState.resources?.cpuAllocation ?? currentState.resources?.cpuAllocation ?? 10,
          memoryAllocation: agentState.resources?.memoryAllocation ?? currentState.resources?.memoryAllocation ?? 128,
          networkBandwidth: agentState.resources?.networkBandwidth ?? currentState.resources?.networkBandwidth ?? 100,
          priority: agentState.resources?.priority ?? currentState.resources?.priority ?? 5,
          ...agentState.resources
        },
        lastActivity: agentState.lastActivity || now,
        healthScore: agentState.healthScore ?? this.calculateAgentHealth(agentState),
        metadata: { ...currentState.metadata, ...agentState.metadata }
      };

      // Store in memory
      this.agentStates.set(agentId, updatedState);

      // Persist to database
      await this.dbPool.query(`
        INSERT INTO wai_agent_states (
          agent_id, name, type, status, current_task, orchestration_id,
          capabilities, performance, resources, last_activity, health_score, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (agent_id) DO UPDATE SET
          name = EXCLUDED.name,
          type = EXCLUDED.type,
          status = EXCLUDED.status,
          current_task = EXCLUDED.current_task,
          orchestration_id = EXCLUDED.orchestration_id,
          capabilities = EXCLUDED.capabilities,
          performance = EXCLUDED.performance,
          resources = EXCLUDED.resources,
          last_activity = EXCLUDED.last_activity,
          health_score = EXCLUDED.health_score,
          metadata = EXCLUDED.metadata,
          updated_at = NOW()
      `, [
        updatedState.agentId,
        updatedState.name,
        updatedState.type,
        updatedState.status,
        updatedState.currentTask,
        updatedState.orchestrationId,
        JSON.stringify(updatedState.capabilities),
        JSON.stringify(updatedState.performance),
        JSON.stringify(updatedState.resources),
        updatedState.lastActivity,
        updatedState.healthScore,
        JSON.stringify(updatedState.metadata)
      ]);

      // Check for agent alerts
      await this.checkAgentAlerts(updatedState);

      this.emit('agent-tracked', {
        agentId,
        status: updatedState.status,
        healthScore: updatedState.healthScore,
        currentLoad: updatedState.performance.currentLoad,
        timestamp: new Date()
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('tracking-error', { stage: 'agent-tracking', error: errorMessage, agentId: agentState.agentId });
      throw error;
    }
  }

  /**
   * Track provider state and health
   */
  async trackProvider(providerState: Partial<ProviderState>): Promise<void> {
    try {
      const providerId = providerState.providerId!;
      const now = new Date();

      const currentState = this.providerStates.get(providerId) || {} as ProviderState;
      
      const updatedState: ProviderState = {
        providerId,
        name: providerState.name || currentState.name || providerId,
        type: providerState.type || currentState.type || 'llm',
        status: providerState.status || currentState.status || 'healthy',
        health: {
          uptime: providerState.health?.uptime ?? currentState.health?.uptime ?? 99.9,
          responseTime: providerState.health?.responseTime ?? currentState.health?.responseTime ?? 100,
          successRate: providerState.health?.successRate ?? currentState.health?.successRate ?? 99.5,
          errorRate: providerState.health?.errorRate ?? currentState.health?.errorRate ?? 0.5,
          throughput: providerState.health?.throughput ?? currentState.health?.throughput ?? 1000,
          capacity: providerState.health?.capacity ?? currentState.health?.capacity ?? 10000,
          utilization: providerState.health?.utilization ?? currentState.health?.utilization ?? 25,
          ...providerState.health
        },
        quota: {
          requests: providerState.quota?.requests || currentState.quota?.requests || { current: 0, limit: 10000, reset: new Date() },
          tokens: providerState.quota?.tokens || currentState.quota?.tokens || { current: 0, limit: 1000000, reset: new Date() },
          cost: providerState.quota?.cost || currentState.quota?.cost || { current: 0, limit: 1000, period: 'monthly' },
          ...providerState.quota
        },
        models: providerState.models || currentState.models,
        lastCheck: providerState.lastCheck || now,
        metadata: { ...currentState.metadata, ...providerState.metadata }
      };

      // Store in memory
      this.providerStates.set(providerId, updatedState);

      // Persist to database
      await this.dbPool.query(`
        INSERT INTO wai_provider_states (
          provider_id, name, type, status, health, quota, models, last_check, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (provider_id) DO UPDATE SET
          name = EXCLUDED.name,
          type = EXCLUDED.type,
          status = EXCLUDED.status,
          health = EXCLUDED.health,
          quota = EXCLUDED.quota,
          models = EXCLUDED.models,
          last_check = EXCLUDED.last_check,
          metadata = EXCLUDED.metadata,
          updated_at = NOW()
      `, [
        updatedState.providerId,
        updatedState.name,
        updatedState.type,
        updatedState.status,
        JSON.stringify(updatedState.health),
        JSON.stringify(updatedState.quota),
        JSON.stringify(updatedState.models),
        updatedState.lastCheck,
        JSON.stringify(updatedState.metadata)
      ]);

      // Check for provider alerts
      await this.checkProviderAlerts(updatedState);

      this.emit('provider-tracked', {
        providerId,
        status: updatedState.status,
        health: updatedState.health,
        quotaUtilization: {
          requests: (updatedState.quota.requests.current / updatedState.quota.requests.limit) * 100,
          tokens: (updatedState.quota.tokens.current / updatedState.quota.tokens.limit) * 100
        },
        timestamp: new Date()
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('tracking-error', { stage: 'provider-tracking', error: errorMessage, providerId: providerState.providerId });
      throw error;
    }
  }

  /**
   * Get real-time system metrics
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    try {
      // Update metrics with current data
      await this.updateSystemMetrics();
      return { ...this.systemMetrics };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('tracking-error', { stage: 'metrics-retrieval', error: errorMessage });
      throw error;
    }
  }

  /**
   * Get orchestration analytics
   */
  async getOrchestrationAnalytics(timeRange: { start: Date; end: Date }): Promise<any> {
    try {
      const result = await this.dbPool.query(`
        SELECT 
          status,
          phase,
          AVG(progress) as avg_progress,
          AVG(duration) as avg_duration,
          COUNT(*) as count,
          AVG((metrics->>'responseTime')::float) as avg_response_time,
          DATE_TRUNC('hour', start_time) as hour
        FROM wai_orchestration_states 
        WHERE start_time BETWEEN $1 AND $2
        GROUP BY status, phase, hour
        ORDER BY hour DESC
      `, [timeRange.start, timeRange.end]);

      const performanceResult = await this.dbPool.query(`
        SELECT 
          (metadata->>'taskType') as task_type,
          (metadata->>'complexity') as complexity,
          AVG(duration) as avg_duration,
          AVG((metrics->>'responseTime')::float) as avg_response_time,
          AVG((metrics->>'cpuUsage')::float) as avg_cpu_usage,
          AVG((metrics->>'memoryUsage')::float) as avg_memory_usage,
          COUNT(*) as count
        FROM wai_orchestration_states 
        WHERE start_time BETWEEN $1 AND $2 AND status = 'completed'
        GROUP BY task_type, complexity
        ORDER BY count DESC
      `, [timeRange.start, timeRange.end]);

      return {
        sessionAnalytics: result.rows,
        performanceAnalytics: performanceResult.rows,
        timeRange,
        generatedAt: new Date()
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('tracking-error', { stage: 'analytics-retrieval', error: errorMessage });
      throw error;
    }
  }

  /**
   * Get agent performance insights
   */
  async getAgentInsights(): Promise<any> {
    try {
      const agentStates = Array.from(this.agentStates.values());
      
      const topPerformers = agentStates
        .filter(agent => agent.performance.tasksCompleted > 0)
        .sort((a, b) => b.performance.successRate - a.performance.successRate)
        .slice(0, 10);

      const bottlenecks = agentStates
        .filter(agent => agent.performance.currentLoad > 80 || agent.healthScore < 70)
        .sort((a, b) => a.healthScore - b.healthScore);

      const typeDistribution = agentStates.reduce((acc, agent) => {
        acc[agent.type] = (acc[agent.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const statusDistribution = agentStates.reduce((acc, agent) => {
        acc[agent.status] = (acc[agent.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalAgents: agentStates.length,
        topPerformers: topPerformers.slice(0, 5),
        bottlenecks,
        typeDistribution,
        statusDistribution,
        averageHealthScore: agentStates.reduce((sum, agent) => sum + agent.healthScore, 0) / agentStates.length,
        averageLoad: agentStates.reduce((sum, agent) => sum + agent.performance.currentLoad, 0) / agentStates.length,
        generatedAt: new Date()
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('tracking-error', { stage: 'agent-insights', error: errorMessage });
      throw error;
    }
  }

  /**
   * Get provider health dashboard
   */
  async getProviderHealth(): Promise<any> {
    try {
      const providerStates = Array.from(this.providerStates.values());
      
      const healthyProviders = providerStates.filter(p => p.status === 'healthy');
      const degradedProviders = providerStates.filter(p => p.status === 'degraded');
      const unhealthyProviders = providerStates.filter(p => p.status === 'unhealthy' || p.status === 'offline');

      const quotaWarnings = providerStates.filter(provider => {
        const requestUsage = (provider.quota.requests.current / provider.quota.requests.limit) * 100;
        const tokenUsage = (provider.quota.tokens.current / provider.quota.tokens.limit) * 100;
        return requestUsage > 80 || tokenUsage > 80;
      });

      const averageResponseTime = providerStates.reduce((sum, p) => sum + p.health.responseTime, 0) / providerStates.length;
      const averageSuccessRate = providerStates.reduce((sum, p) => sum + p.health.successRate, 0) / providerStates.length;

      return {
        totalProviders: providerStates.length,
        healthyCount: healthyProviders.length,
        degradedCount: degradedProviders.length,
        unhealthyCount: unhealthyProviders.length,
        quotaWarnings: quotaWarnings.map(p => ({
          providerId: p.providerId,
          name: p.name,
          requestUsage: (p.quota.requests.current / p.quota.requests.limit) * 100,
          tokenUsage: (p.quota.tokens.current / p.quota.tokens.limit) * 100
        })),
        averageResponseTime,
        averageSuccessRate,
        topProviders: healthyProviders
          .sort((a, b) => b.health.successRate - a.health.successRate)
          .slice(0, 5),
        generatedAt: new Date()
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('tracking-error', { stage: 'provider-health', error: errorMessage });
      throw error;
    }
  }

  /**
   * Create real-time alert
   */
  async createAlert(alertData: Partial<StateAlert>): Promise<string> {
    try {
      const alertId = uuidv4();
      const now = new Date();

      const alert: StateAlert = {
        id: alertId,
        type: alertData.type || 'system',
        severity: alertData.severity || 'info',
        title: alertData.title || 'System Alert',
        description: alertData.description || '',
        source: alertData.source || 'system',
        timestamp: now,
        resolved: false,
        metadata: alertData.metadata || {},
        actions: alertData.actions || []
      };

      // Store in memory
      this.activeAlerts.set(alertId, alert);

      // Persist to database
      await this.dbPool.query(`
        INSERT INTO wai_state_alerts (
          id, type, severity, title, description, source, timestamp,
          resolved, metadata, actions
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        alert.id,
        alert.type,
        alert.severity,
        alert.title,
        alert.description,
        alert.source,
        alert.timestamp,
        alert.resolved,
        JSON.stringify(alert.metadata),
        JSON.stringify(alert.actions)
      ]);

      this.emit('alert-created', {
        alertId,
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        timestamp: now
      });

      return alertId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('tracking-error', { stage: 'alert-creation', error: errorMessage });
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private createInitialMetrics(): SystemMetrics {
    return {
      timestamp: new Date(),
      orchestration: {
        activeSessions: 0,
        completedToday: 0,
        failureRate: 0,
        averageResponseTime: 0,
        peakThroughput: 0,
        resourceUtilization: 0
      },
      agents: {
        totalAgents: 0,
        activeAgents: 0,
        idleAgents: 0,
        errorAgents: 0,
        averageLoad: 0,
        topPerformers: [],
        bottlenecks: []
      },
      providers: {
        totalProviders: 0,
        healthyProviders: 0,
        degradedProviders: 0,
        offlineProviders: 0,
        costToday: 0,
        tokensUsed: 0,
        quotaWarnings: []
      },
      memory: {
        totalMemories: 0,
        memoriesCreatedToday: 0,
        searchesPerformed: 0,
        averageSearchTime: 0,
        cacheHitRate: 0,
        storageUtilization: 0
      },
      security: {
        authenticationsToday: 0,
        failedAuthentications: 0,
        activeThreats: 0,
        blockedRequests: 0,
        complianceScore: 100
      },
      infrastructure: {
        cpuUsage: 0,
        memoryUsage: 0,
        diskUsage: 0,
        networkUsage: 0,
        databaseConnections: 0,
        queueDepth: 0
      }
    };
  }

  private calculateAgentHealth(agentState: Partial<AgentState>): number {
    let health = 100;
    
    if (agentState.performance) {
      // Reduce health based on error rate
      health -= (100 - agentState.performance.successRate);
      
      // Reduce health based on load
      if (agentState.performance.currentLoad > 90) health -= 20;
      else if (agentState.performance.currentLoad > 80) health -= 10;
    }
    
    // Check last activity
    if (agentState.lastActivity) {
      const inactiveMinutes = (Date.now() - agentState.lastActivity.getTime()) / (1000 * 60);
      if (inactiveMinutes > 30) health -= 15;
      else if (inactiveMinutes > 15) health -= 5;
    }
    
    return Math.max(0, Math.min(100, health));
  }

  private async createTrackingTables(): Promise<void> {
    // Orchestration states table
    await this.dbPool.query(`
      CREATE TABLE IF NOT EXISTS wai_orchestration_states (
        id VARCHAR PRIMARY KEY,
        session_id VARCHAR NOT NULL,
        agent_id VARCHAR NOT NULL,
        user_id VARCHAR,
        status VARCHAR NOT NULL,
        phase VARCHAR NOT NULL,
        progress INTEGER DEFAULT 0,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        duration INTEGER,
        metadata JSONB DEFAULT '{}',
        metrics JSONB DEFAULT '{}',
        context JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Agent states table
    await this.dbPool.query(`
      CREATE TABLE IF NOT EXISTS wai_agent_states (
        agent_id VARCHAR PRIMARY KEY,
        name VARCHAR NOT NULL,
        type VARCHAR NOT NULL,
        status VARCHAR NOT NULL,
        current_task VARCHAR,
        orchestration_id VARCHAR,
        capabilities JSONB DEFAULT '[]',
        performance JSONB DEFAULT '{}',
        resources JSONB DEFAULT '{}',
        last_activity TIMESTAMP NOT NULL,
        health_score INTEGER DEFAULT 100,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Provider states table
    await this.dbPool.query(`
      CREATE TABLE IF NOT EXISTS wai_provider_states (
        provider_id VARCHAR PRIMARY KEY,
        name VARCHAR NOT NULL,
        type VARCHAR NOT NULL,
        status VARCHAR NOT NULL,
        health JSONB DEFAULT '{}',
        quota JSONB DEFAULT '{}',
        models JSONB,
        last_check TIMESTAMP NOT NULL,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // System metrics table
    await this.dbPool.query(`
      CREATE TABLE IF NOT EXISTS wai_system_metrics (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        timestamp TIMESTAMP NOT NULL,
        orchestration_metrics JSONB DEFAULT '{}',
        agent_metrics JSONB DEFAULT '{}',
        provider_metrics JSONB DEFAULT '{}',
        memory_metrics JSONB DEFAULT '{}',
        security_metrics JSONB DEFAULT '{}',
        infrastructure_metrics JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Alerts table
    await this.dbPool.query(`
      CREATE TABLE IF NOT EXISTS wai_state_alerts (
        id VARCHAR PRIMARY KEY,
        type VARCHAR NOT NULL,
        severity VARCHAR NOT NULL,
        title VARCHAR NOT NULL,
        description TEXT,
        source VARCHAR NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        resolved BOOLEAN DEFAULT false,
        resolved_at TIMESTAMP,
        metadata JSONB DEFAULT '{}',
        actions JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create indexes
    await this.dbPool.query(`
      CREATE INDEX IF NOT EXISTS idx_orchestration_session_id ON wai_orchestration_states(session_id);
      CREATE INDEX IF NOT EXISTS idx_orchestration_agent_id ON wai_orchestration_states(agent_id);
      CREATE INDEX IF NOT EXISTS idx_orchestration_status ON wai_orchestration_states(status);
      CREATE INDEX IF NOT EXISTS idx_orchestration_start_time ON wai_orchestration_states(start_time);
      CREATE INDEX IF NOT EXISTS idx_agent_status ON wai_agent_states(status);
      CREATE INDEX IF NOT EXISTS idx_agent_type ON wai_agent_states(type);
      CREATE INDEX IF NOT EXISTS idx_provider_status ON wai_provider_states(status);
      CREATE INDEX IF NOT EXISTS idx_provider_type ON wai_provider_states(type);
      CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON wai_system_metrics(timestamp);
      CREATE INDEX IF NOT EXISTS idx_alerts_severity ON wai_state_alerts(severity);
      CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON wai_state_alerts(resolved);
    `);
  }

  private async loadExistingStates(): Promise<void> {
    // Load active orchestration states
    const orchestrationResult = await this.dbPool.query(`
      SELECT * FROM wai_orchestration_states 
      WHERE status IN ('initializing', 'processing') 
      ORDER BY start_time DESC 
      LIMIT 100
    `);

    for (const row of orchestrationResult.rows) {
      const state: OrchestrationState = {
        id: row.id,
        sessionId: row.session_id,
        agentId: row.agent_id,
        userId: row.user_id,
        status: row.status,
        phase: row.phase,
        progress: row.progress,
        startTime: row.start_time,
        endTime: row.end_time,
        duration: row.duration,
        metadata: JSON.parse(row.metadata || '{}'),
        metrics: JSON.parse(row.metrics || '{}'),
        context: JSON.parse(row.context || '{}')
      };
      this.orchestrationStates.set(state.id, state);
    }

    // Load agent states
    const agentResult = await this.dbPool.query('SELECT * FROM wai_agent_states');
    for (const row of agentResult.rows) {
      const state: AgentState = {
        agentId: row.agent_id,
        name: row.name,
        type: row.type,
        status: row.status,
        currentTask: row.current_task,
        orchestrationId: row.orchestration_id,
        capabilities: JSON.parse(row.capabilities || '[]'),
        performance: JSON.parse(row.performance || '{}'),
        resources: JSON.parse(row.resources || '{}'),
        lastActivity: row.last_activity,
        healthScore: row.health_score,
        metadata: JSON.parse(row.metadata || '{}')
      };
      this.agentStates.set(state.agentId, state);
    }

    // Load provider states
    const providerResult = await this.dbPool.query('SELECT * FROM wai_provider_states');
    for (const row of providerResult.rows) {
      const state: ProviderState = {
        providerId: row.provider_id,
        name: row.name,
        type: row.type,
        status: row.status,
        health: JSON.parse(row.health || '{}'),
        quota: JSON.parse(row.quota || '{}'),
        models: JSON.parse(row.models || 'null'),
        lastCheck: row.last_check,
        metadata: JSON.parse(row.metadata || '{}')
      };
      this.providerStates.set(state.providerId, state);
    }
  }

  private startRealTimeMonitoring(): void {
    // Update system metrics every minute
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.updateSystemMetrics();
        await this.persistSystemMetrics();
        await this.checkSystemAlerts();
      } catch (error) {
        console.error('Error in real-time monitoring:', error);
      }
    }, 60000); // 1 minute
  }

  private async updateSystemMetrics(): Promise<void> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Update orchestration metrics
    const orchestrationStates = Array.from(this.orchestrationStates.values());
    this.systemMetrics.orchestration.activeSessions = orchestrationStates.filter(s => 
      s.status === 'processing' || s.status === 'initializing').length;
    
    const completedToday = orchestrationStates.filter(s => 
      s.status === 'completed' && s.endTime && s.endTime >= todayStart).length;
    this.systemMetrics.orchestration.completedToday = completedToday;

    // Update agent metrics
    const agentStates = Array.from(this.agentStates.values());
    this.systemMetrics.agents.totalAgents = agentStates.length;
    this.systemMetrics.agents.activeAgents = agentStates.filter(a => a.status === 'busy').length;
    this.systemMetrics.agents.idleAgents = agentStates.filter(a => a.status === 'idle').length;
    this.systemMetrics.agents.errorAgents = agentStates.filter(a => a.status === 'error').length;

    // Update provider metrics
    const providerStates = Array.from(this.providerStates.values());
    this.systemMetrics.providers.totalProviders = providerStates.length;
    this.systemMetrics.providers.healthyProviders = providerStates.filter(p => p.status === 'healthy').length;
    this.systemMetrics.providers.degradedProviders = providerStates.filter(p => p.status === 'degraded').length;
    this.systemMetrics.providers.offlineProviders = providerStates.filter(p => p.status === 'offline').length;

    this.systemMetrics.timestamp = now;
  }

  private async persistSystemMetrics(): Promise<void> {
    await this.dbPool.query(`
      INSERT INTO wai_system_metrics (
        timestamp, orchestration_metrics, agent_metrics, provider_metrics,
        memory_metrics, security_metrics, infrastructure_metrics
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      this.systemMetrics.timestamp,
      JSON.stringify(this.systemMetrics.orchestration),
      JSON.stringify(this.systemMetrics.agents),
      JSON.stringify(this.systemMetrics.providers),
      JSON.stringify(this.systemMetrics.memory),
      JSON.stringify(this.systemMetrics.security),
      JSON.stringify(this.systemMetrics.infrastructure)
    ]);

    // Keep only last 24 hours of metrics
    await this.dbPool.query(`
      DELETE FROM wai_system_metrics 
      WHERE timestamp < NOW() - INTERVAL '24 hours'
    `);
  }

  private async checkOrchestrationAlerts(state: OrchestrationState): Promise<void> {
    // Check for long-running orchestrations
    if (state.status === 'processing' && state.startTime) {
      const duration = Date.now() - state.startTime.getTime();
      if (duration > 300000) { // 5 minutes
        await this.createAlert({
          type: 'performance',
          severity: 'warning',
          title: 'Long-Running Orchestration',
          description: `Orchestration ${state.id} has been running for ${Math.round(duration / 60000)} minutes`,
          source: `orchestration:${state.id}`,
          metadata: { orchestrationId: state.id, duration, phase: state.phase }
        });
      }
    }

    // Check for high error rates
    if (state.metadata.errorCount > 5) {
      await this.createAlert({
        type: 'system',
        severity: 'error',
        title: 'High Error Count',
        description: `Orchestration ${state.id} has ${state.metadata.errorCount} errors`,
        source: `orchestration:${state.id}`,
        metadata: { orchestrationId: state.id, errorCount: state.metadata.errorCount }
      });
    }
  }

  private async checkAgentAlerts(state: AgentState): Promise<void> {
    // Check for low health score
    if (state.healthScore < 50) {
      await this.createAlert({
        type: 'resource',
        severity: 'error',
        title: 'Agent Health Critical',
        description: `Agent ${state.name} health score is ${state.healthScore}%`,
        source: `agent:${state.agentId}`,
        metadata: { agentId: state.agentId, healthScore: state.healthScore }
      });
    }

    // Check for high load
    if (state.performance.currentLoad > 95) {
      await this.createAlert({
        type: 'performance',
        severity: 'warning',
        title: 'Agent Overloaded',
        description: `Agent ${state.name} is at ${state.performance.currentLoad}% load`,
        source: `agent:${state.agentId}`,
        metadata: { agentId: state.agentId, currentLoad: state.performance.currentLoad }
      });
    }
  }

  private async checkProviderAlerts(state: ProviderState): Promise<void> {
    // Check quota usage
    const requestUsage = (state.quota.requests.current / state.quota.requests.limit) * 100;
    const tokenUsage = (state.quota.tokens.current / state.quota.tokens.limit) * 100;

    if (requestUsage > 90 || tokenUsage > 90) {
      await this.createAlert({
        type: 'resource',
        severity: 'error',
        title: 'Provider Quota Critical',
        description: `Provider ${state.name} quota usage: ${Math.max(requestUsage, tokenUsage).toFixed(1)}%`,
        source: `provider:${state.providerId}`,
        metadata: { providerId: state.providerId, requestUsage, tokenUsage }
      });
    }

    // Check provider health
    if (state.status === 'unhealthy' || state.health.successRate < 90) {
      await this.createAlert({
        type: 'system',
        severity: 'error',
        title: 'Provider Health Issues',
        description: `Provider ${state.name} is ${state.status} with ${state.health.successRate}% success rate`,
        source: `provider:${state.providerId}`,
        metadata: { providerId: state.providerId, status: state.status, successRate: state.health.successRate }
      });
    }
  }

  private async checkSystemAlerts(): Promise<void> {
    // Check overall system health
    const totalAgents = this.systemMetrics.agents.totalAgents;
    const errorAgents = this.systemMetrics.agents.errorAgents;
    
    if (totalAgents > 0 && (errorAgents / totalAgents) > 0.2) {
      await this.createAlert({
        type: 'system',
        severity: 'critical',
        title: 'High Agent Error Rate',
        description: `${errorAgents}/${totalAgents} agents are in error state (${((errorAgents / totalAgents) * 100).toFixed(1)}%)`,
        source: 'system',
        metadata: { totalAgents, errorAgents, errorRate: (errorAgents / totalAgents) * 100 }
      });
    }
  }

  private setupEventHandlers(): void {
    this.on('orchestration-tracked', (data) => {
      console.log(`📊 State Tracking: Orchestration ${data.orchestrationId} - ${data.status} (${data.progress}%)`);
    });

    this.on('agent-tracked', (data) => {
      console.log(`🤖 State Tracking: Agent ${data.agentId} - ${data.status} (Health: ${data.healthScore}%)`);
    });

    this.on('provider-tracked', (data) => {
      console.log(`🔗 State Tracking: Provider ${data.providerId} - ${data.status}`);
    });

    this.on('alert-created', (data) => {
      console.log(`🚨 Alert [${data.severity.toUpperCase()}]: ${data.title}`);
    });

    this.on('tracking-error', (error) => {
      console.error(`❌ State Tracking Error in ${error.stage}:`, error.error);
    });
  }

  async cleanup(): Promise<void> {
    try {
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
      }
      
      await this.persistSystemMetrics();
      await this.dbPool.end();
      
      console.log('✅ WAI State Tracking System cleanup completed');
    } catch (error) {
      console.error('❌ WAI State Tracking System cleanup failed:', error);
    }
  }
}

/**
 * Factory function for creating WAI State Tracking System
 */
export function createWAIStateTrackingSystem(databaseUrl?: string): WAIStateTrackingSystem {
  return new WAIStateTrackingSystem(databaseUrl);
}