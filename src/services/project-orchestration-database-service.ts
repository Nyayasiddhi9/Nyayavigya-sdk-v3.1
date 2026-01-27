/**
 * Project Orchestration Database Service
 * Database-backed service for project orchestration runs, metrics, and cost tracking
 */

import { db } from '../db';
import { 
  waiOrchestrationRequestsV9, 
  workflowExecutionsV9, 
  waiPerformanceMetrics,
  projects 
} from '@shared/schema';
import { eq, and, desc, sql, count, sum, avg } from 'drizzle-orm';

export class ProjectOrchestrationDatabaseService {
  
  // ============================================================================
  // Orchestration Requests (Run Headers)
  // ============================================================================
  
  /**
   * Create a new orchestration request
   */
  async createOrchestrationRequest(data: {
    id: string;
    userId?: number;
    projectId?: string;
    sessionId: string;
    requestType: string;
    task: string;
    priority?: string;
    status?: string;
    orchestrationMode?: string;
    agentEnforcement?: string;
    selectedAgents?: any;
    selectedProviders?: any;
  }) {
    const [request] = await db.insert(waiOrchestrationRequestsV9).values({
      ...data,
      priority: data.priority || 'medium',
      status: data.status || 'pending',
      orchestrationMode: data.orchestrationMode || 'auto',
      agentEnforcement: data.agentEnforcement || 'strict'
    }).returning();
    
    return request;
  }

  /**
   * Get orchestration request by ID
   */
  async getOrchestrationRequest(id: string) {
    const [request] = await db
      .select()
      .from(waiOrchestrationRequestsV9)
      .where(eq(waiOrchestrationRequestsV9.id, id))
      .limit(1);
    
    return request;
  }

  /**
   * List orchestration requests with optional filtering
   */
  async listOrchestrationRequests(filters?: {
    userId?: number;
    projectId?: string;
    status?: string;
    requestType?: string;
    limit?: number;
    offset?: number;
  }) {
    let query = db.select().from(waiOrchestrationRequestsV9);
    
    const conditions = [];
    if (filters?.userId) conditions.push(eq(waiOrchestrationRequestsV9.userId, filters.userId));
    if (filters?.projectId) conditions.push(eq(waiOrchestrationRequestsV9.projectId, filters.projectId));
    if (filters?.status) conditions.push(eq(waiOrchestrationRequestsV9.status, filters.status));
    if (filters?.requestType) conditions.push(eq(waiOrchestrationRequestsV9.requestType, filters.requestType));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    query = query.orderBy(desc(waiOrchestrationRequestsV9.createdAt)) as any;
    
    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }
    if (filters?.offset) {
      query = query.offset(filters.offset) as any;
    }
    
    const requests = await query;
    return requests;
  }

  /**
   * Update orchestration request
   */
  async updateOrchestrationRequest(id: string, updates: {
    status?: string;
    routingDecision?: any;
    bmadCoordination?: any;
    result?: any;
    intermediateResults?: any;
    executionPlan?: any;
    executionTimeMs?: number;
    totalCost?: string;
    costBreakdown?: any;
    tokensUsed?: number;
    qualityScore?: string;
    qualityMetrics?: any;
    performanceMetrics?: any;
    errorMessage?: string;
    errorDetails?: any;
    routedAt?: Date;
    startedAt?: Date;
    completedAt?: Date;
  }) {
    const [updated] = await db
      .update(waiOrchestrationRequestsV9)
      .set(updates)
      .where(eq(waiOrchestrationRequestsV9.id, id))
      .returning();
    
    return updated;
  }

  /**
   * Delete orchestration request
   */
  async deleteOrchestrationRequest(id: string) {
    await db
      .delete(waiOrchestrationRequestsV9)
      .where(eq(waiOrchestrationRequestsV9.id, id));
  }

  // ============================================================================
  // Workflow Executions (Individual Runs/Steps)
  // ============================================================================
  
  /**
   * Create workflow execution
   */
  async createWorkflowExecution(data: {
    executionId: string;
    patternId: string;
    userId?: number;
    organizationId?: number;
    sessionId?: string;
    inputData: any;
    config?: any;
    customParameters?: any;
  }) {
    const [execution] = await db.insert(workflowExecutionsV9).values({
      ...data,
      config: data.config || {},
      customParameters: data.customParameters || {}
    }).returning();
    
    return execution;
  }

  /**
   * Get workflow execution by ID
   */
  async getWorkflowExecution(executionId: string) {
    const [execution] = await db
      .select()
      .from(workflowExecutionsV9)
      .where(eq(workflowExecutionsV9.executionId, executionId))
      .limit(1);
    
    return execution;
  }

  /**
   * List workflow executions with filtering
   */
  async listWorkflowExecutions(filters?: {
    userId?: number;
    patternId?: string;
    status?: string;
    sessionId?: string;
    limit?: number;
    offset?: number;
  }) {
    let query = db.select().from(workflowExecutionsV9);
    
    const conditions = [];
    if (filters?.userId) conditions.push(eq(workflowExecutionsV9.userId, filters.userId));
    if (filters?.patternId) conditions.push(eq(workflowExecutionsV9.patternId, filters.patternId));
    if (filters?.status) conditions.push(eq(workflowExecutionsV9.status, filters.status));
    if (filters?.sessionId) conditions.push(eq(workflowExecutionsV9.sessionId, filters.sessionId));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    query = query.orderBy(desc(workflowExecutionsV9.createdAt)) as any;
    
    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }
    if (filters?.offset) {
      query = query.offset(filters.offset) as any;
    }
    
    return await query;
  }

  /**
   * Update workflow execution
   */
  async updateWorkflowExecution(executionId: string, updates: {
    status?: string;
    progress?: any;
    currentStep?: string;
    result?: any;
    outputs?: any;
    executionMetrics?: any;
    errors?: any;
    startedAt?: Date;
    completedAt?: Date;
    duration?: number;
  }) {
    const [updated] = await db
      .update(workflowExecutionsV9)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(workflowExecutionsV9.executionId, executionId))
      .returning();
    
    return updated;
  }

  // ============================================================================
  // Performance Metrics
  // ============================================================================
  
  /**
   * Record performance metric
   */
  async recordMetric(data: {
    metricType: string;
    component: string;
    value: string;
    unit: string;
    metadata?: any;
    userId?: number;
    requestId?: string;
  }) {
    const [metric] = await db.insert(waiPerformanceMetrics).values({
      ...data,
      metadata: data.metadata || {}
    }).returning();
    
    return metric;
  }

  /**
   * Get metrics with filtering
   */
  async getMetrics(filters: {
    component?: string;
    metricType?: string;
    userId?: number;
    requestId?: string;
    startTime?: Date;
    endTime?: Date;
    limit?: number;
  }) {
    let query = db.select().from(waiPerformanceMetrics);
    
    const conditions = [];
    if (filters.component) conditions.push(eq(waiPerformanceMetrics.component, filters.component));
    if (filters.metricType) conditions.push(eq(waiPerformanceMetrics.metricType, filters.metricType));
    if (filters.userId) conditions.push(eq(waiPerformanceMetrics.userId, filters.userId));
    if (filters.requestId) conditions.push(eq(waiPerformanceMetrics.requestId, filters.requestId));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    query = query.orderBy(desc(waiPerformanceMetrics.timestamp)) as any;
    
    if (filters.limit) {
      query = query.limit(filters.limit) as any;
    }
    
    return await query;
  }

  /**
   * Get metric aggregations
   */
  async getMetricAggregates(filters: {
    component?: string;
    metricType?: string;
    userId?: number;
    startTime?: Date;
    endTime?: Date;
  }) {
    let query = db
      .select({
        component: waiPerformanceMetrics.component,
        metricType: waiPerformanceMetrics.metricType,
        avgValue: avg(waiPerformanceMetrics.value),
        minValue: sql`MIN(${waiPerformanceMetrics.value})`,
        maxValue: sql`MAX(${waiPerformanceMetrics.value})`,
        count: count()
      })
      .from(waiPerformanceMetrics);
    
    const conditions = [];
    if (filters.component) conditions.push(eq(waiPerformanceMetrics.component, filters.component));
    if (filters.metricType) conditions.push(eq(waiPerformanceMetrics.metricType, filters.metricType));
    if (filters.userId) conditions.push(eq(waiPerformanceMetrics.userId, filters.userId));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    query = query.groupBy(waiPerformanceMetrics.component, waiPerformanceMetrics.metricType) as any;
    
    return await query;
  }

  // ============================================================================
  // Project Cost Tracking
  // ============================================================================
  
  /**
   * Get project basic info
   */
  async getProjectInfo(projectId: number) {
    const [project] = await db
      .select({
        id: projects.id,
        name: projects.name,
        status: projects.status,
        progress: projects.progress,
        estimatedHours: projects.estimatedHours,
        actualHours: projects.actualHours
      })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);
    
    return project;
  }

  /**
   * Update project progress
   */
  async updateProjectProgress(projectId: number, data: {
    progress?: number;
    actualHours?: number;
    status?: string;
  }) {
    const [updated] = await db
      .update(projects)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(projects.id, projectId))
      .returning();
    
    return updated;
  }

  /**
   * Get orchestration costs summary for a project
   */
  async getProjectOrchestrationCosts(projectId: string) {
    const result = await db
      .select({
        totalCost: sum(waiOrchestrationRequestsV9.totalCost),
        totalTokens: sum(waiOrchestrationRequestsV9.tokensUsed),
        totalRequests: count(),
        avgExecutionTime: avg(waiOrchestrationRequestsV9.executionTimeMs)
      })
      .from(waiOrchestrationRequestsV9)
      .where(eq(waiOrchestrationRequestsV9.projectId, projectId));
    
    return result[0] || {
      totalCost: '0',
      totalTokens: 0,
      totalRequests: 0,
      avgExecutionTime: 0
    };
  }
}

// Export singleton instance
export const projectOrchestrationService = new ProjectOrchestrationDatabaseService();
