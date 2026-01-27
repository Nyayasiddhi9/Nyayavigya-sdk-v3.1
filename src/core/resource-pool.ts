/**
 * Resource Pool Implementation
 * Provides concrete resource management for BMAD orchestration
 */

import { EventEmitter } from 'events';
import { WAILogger } from '../utils/logger';

export class ResourcePool extends EventEmitter {
  private logger: WAILogger;
  private resources: Map<string, ResourceAllocation> = new Map();
  private allocations: Map<string, ActiveAllocation> = new Map();
  private config: ResourcePoolConfig;

  constructor(config: ResourcePoolConfig) {
    super();
    this.config = config;
    this.logger = new WAILogger('ResourcePool');
  }

  async initialize(): Promise<void> {
    this.logger.info('🎯 Initializing Resource Pool...');

    // Initialize CPU resources
    this.resources.set('cpu', {
      id: 'cpu',
      type: 'cpu',
      total: this.config.maxCPU || 16,
      available: this.config.maxCPU || 16,
      allocated: 0,
      unit: 'cores'
    });

    // Initialize Memory resources  
    this.resources.set('memory', {
      id: 'memory',
      type: 'memory',
      total: this.config.maxMemory || 32000,
      available: this.config.maxMemory || 32000,
      allocated: 0,
      unit: 'MB'
    });

    // Initialize Agent slots
    this.resources.set('agents', {
      id: 'agents',
      type: 'agents',
      total: this.config.maxAgents || 50,
      available: this.config.maxAgents || 50,
      allocated: 0,
      unit: 'slots'
    });

    this.logger.info(`✅ Resource Pool initialized: ${this.resources.size} resource types`);
  }

  async checkAvailability(requirements: ResourceRequirements): Promise<boolean> {
    for (const [resourceType, amount] of Object.entries(requirements)) {
      if (amount === undefined) continue;
      const resource = this.resources.get(resourceType);
      if (!resource || resource.available < amount) {
        return false;
      }
    }
    return true;
  }

  async allocateResources(requirements: ResourceRequirements): Promise<ResourceLease> {
    const leaseId = `lease_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

    // Check availability first
    const available = await this.checkAvailability(requirements);
    if (!available) {
      throw new Error('Insufficient resources available');
    }

    // Allocate resources
    const allocatedResources: Record<string, number> = {};
    for (const [resourceType, amount] of Object.entries(requirements)) {
      if (amount === undefined) continue;
      const resource = this.resources.get(resourceType);
      if (resource) {
        resource.available -= amount;
        resource.allocated += amount;
        allocatedResources[resourceType] = amount;
      }
    }

    // Create lease
    const lease: ResourceLease = {
      id: leaseId,
      allocatedAt: Date.now(),
      resources: allocatedResources,
      status: 'active'
    };

    // Track allocation
    const allocation: ActiveAllocation = {
      leaseId,
      requirements,
      allocatedAt: Date.now(),
      status: 'active'
    };

    this.allocations.set(leaseId, allocation);

    this.emit('resourcesAllocated', { leaseId, requirements });
    this.logger.debug(`📦 Resources allocated: ${leaseId}`);

    return lease;
  }

  async releaseResources(leaseId: string): Promise<void> {
    const allocation = this.allocations.get(leaseId);
    if (!allocation) {
      throw new Error(`Lease not found: ${leaseId}`);
    }

    // Release resources back to pool
    for (const [resourceType, amount] of Object.entries(allocation.requirements)) {
      if (amount === undefined) continue;
      const resource = this.resources.get(resourceType);
      if (resource) {
        resource.available += amount;
        resource.allocated -= amount;
      }
    }

    // Remove allocation
    this.allocations.delete(leaseId);

    this.emit('resourcesReleased', { leaseId, requirements: allocation.requirements });
    this.logger.debug(`📦 Resources released: ${leaseId}`);
  }

  async getHealth(): Promise<ResourcePoolHealth> {
    const resourceStats = Array.from(this.resources.values()).map(resource => ({
      type: resource.type,
      utilization: resource.total > 0 ? resource.allocated / resource.total : 0,
      allocated: resource.allocated,
      available: resource.available,
      total: resource.total
    }));

    const overallUtilization = resourceStats.reduce((sum, stat) => sum + stat.utilization, 0) / resourceStats.length;

    return {
      healthy: overallUtilization < 0.9,
      utilization: overallUtilization,
      resources: resourceStats,
      activeAllocations: this.allocations.size,
      lastCheck: Date.now()
    };
  }

  async shutdown(): Promise<void> {
    this.logger.info('🔄 Shutting down Resource Pool...');
    
    // Release all active allocations
    for (const leaseId of this.allocations.keys()) {
      await this.releaseResources(leaseId);
    }
  }
}

export class PriorityQueue<T> {
  private items: QueueItem<T>[] = [];

  enqueue(item: T, priority: number = 0): void {
    const queueItem: QueueItem<T> = { item, priority, enqueuedAt: Date.now() };
    
    // Insert based on priority (higher priority first)
    let inserted = false;
    for (let i = 0; i < this.items.length; i++) {
      if (queueItem.priority > this.items[i].priority) {
        this.items.splice(i, 0, queueItem);
        inserted = true;
        break;
      }
    }
    
    if (!inserted) {
      this.items.push(queueItem);
    }
  }

  dequeue(): T | undefined {
    const item = this.items.shift();
    return item?.item;
  }

  peek(): T | undefined {
    return this.items[0]?.item;
  }

  size(): number {
    return this.items.length;
  }

  getStatus(): { length: number; avgWaitTime: number } {
    const now = Date.now();
    const avgWaitTime = this.items.length > 0 
      ? this.items.reduce((sum, item) => sum + (now - item.enqueuedAt), 0) / this.items.length
      : 0;

    return {
      length: this.items.length,
      avgWaitTime
    };
  }
}

export class PerformanceTracker {
  private metrics: Map<string, AgentMetrics> = new Map();
  private logger: WAILogger;

  constructor() {
    this.logger = new WAILogger('PerformanceTracker');
  }

  recordAgentStep(agentId: string, stepMetrics: AgentStepMetrics): void {
    let metrics = this.metrics.get(agentId);
    if (!metrics) {
      metrics = {
        agentId,
        totalSteps: 0,
        successfulSteps: 0,
        failedSteps: 0,
        totalDuration: 0,
        avgDuration: 0,
        lastStepAt: 0,
        resourceUsage: {}
      };
      this.metrics.set(agentId, metrics);
    }

    // Update metrics
    metrics.totalSteps++;
    if (stepMetrics.success) {
      metrics.successfulSteps++;
    } else {
      metrics.failedSteps++;
    }

    metrics.totalDuration += stepMetrics.duration;
    metrics.avgDuration = metrics.totalDuration / metrics.totalSteps;
    metrics.lastStepAt = Date.now();

    // Track resource usage
    for (const [resource, usage] of Object.entries(stepMetrics.resourceUsage)) {
      if (!metrics.resourceUsage[resource]) {
        metrics.resourceUsage[resource] = 0;
      }
      metrics.resourceUsage[resource] += usage;
    }
  }

  getOverallScore(): number {
    if (this.metrics.size === 0) return 0;

    const scores = Array.from(this.metrics.values()).map(metric => {
      const successRate = metric.totalSteps > 0 ? metric.successfulSteps / metric.totalSteps : 0;
      const efficiencyScore = metric.avgDuration > 0 ? Math.min(1, 5000 / metric.avgDuration) : 0; // Target 5s per step
      return (successRate + efficiencyScore) / 2;
    });

    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  getAgentMetrics(agentId: string): AgentMetrics | undefined {
    return this.metrics.get(agentId);
  }
}

// Type definitions
export interface ResourcePoolConfig {
  maxCPU?: number;
  maxMemory?: number;
  maxAgents?: number;
}

export interface ResourceRequirements {
  cpu?: number;
  memory?: number;
  agents?: number;
  [key: string]: number | undefined;
}

export interface ResourceAllocation {
  id: string;
  type: string;
  total: number;
  available: number;
  allocated: number;
  unit: string;
}

export interface ResourceLease {
  id: string;
  allocatedAt: number;
  resources: Record<string, number>;
  status: 'active' | 'expired';
}

export interface ActiveAllocation {
  leaseId: string;
  requirements: ResourceRequirements;
  allocatedAt: number;
  status: 'active' | 'completed';
}

export interface ResourcePoolHealth {
  healthy: boolean;
  utilization: number;
  resources: Array<{
    type: string;
    utilization: number;
    allocated: number;
    available: number;
    total: number;
  }>;
  activeAllocations: number;
  lastCheck: number;
}

interface QueueItem<T> {
  item: T;
  priority: number;
  enqueuedAt: number;
}

export interface AgentMetrics {
  agentId: string;
  totalSteps: number;
  successfulSteps: number;
  failedSteps: number;
  totalDuration: number;
  avgDuration: number;
  lastStepAt: number;
  resourceUsage: Record<string, number>;
}

export interface AgentStepMetrics {
  iteration: number;
  duration: number;
  success: boolean;
  resourceUsage: Record<string, number>;
}