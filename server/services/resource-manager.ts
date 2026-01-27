/**
 * Resource Manager - Intelligent Resource Allocation and Optimization
 * Manages compute resources, memory, and agent workloads across projects
 */

import { EventEmitter } from 'events';

export interface ResourceRequirements {
  cpu: number;
  memory: number;
  storage: number;
  network: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedDuration: number;
}

export interface ResourceAllocation {
  allocationId: string;
  projectId: number;
  agentId: string;
  resources: ResourceRequirements;
  allocatedAt: Date;
  expiresAt: Date;
  status: 'allocated' | 'active' | 'released';
  actualUsage?: ResourceUsage;
}

export interface ResourceUsage {
  cpu: number;
  memory: number;
  storage: number;
  network: number;
  duration: number;
  efficiency: number;
  timestamp: Date;
}

export interface ResourcePool {
  totalCpu: number;
  totalMemory: number;
  totalStorage: number;
  totalNetwork: number;
  availableCpu: number;
  availableMemory: number;
  availableStorage: number;
  availableNetwork: number;
  utilizationRate: number;
  activeAllocations: number;
}

export interface OptimizationResult {
  optimizationId: string;
  projectId: number;
  originalCost: number;
  optimizedCost: number;
  savings: number;
  savingsPercentage: number;
  recommendations: OptimizationRecommendation[];
  implementedAt?: Date;
}

export interface OptimizationRecommendation {
  type: 'agent_reallocation' | 'resource_scaling' | 'priority_adjustment' | 'load_balancing';
  description: string;
  impact: 'low' | 'medium' | 'high';
  estimatedSavings: number;
  implementationComplexity: 'simple' | 'moderate' | 'complex';
  action: any;
}

export interface LoadBalancingResult {
  balancingId: string;
  totalAgents: number;
  rebalancedAgents: number;
  averageLoadBefore: number;
  averageLoadAfter: number;
  efficiency: number;
  timestamp: Date;
}

export class ResourceManager extends EventEmitter {
  private resourcePool: ResourcePool;
  private allocations: Map<string, ResourceAllocation> = new Map();
  private usageHistory: ResourceUsage[] = [];
  private optimizationHistory: OptimizationResult[] = [];
  private loadBalancingHistory: LoadBalancingResult[] = [];

  constructor() {
    super();
    this.initializeResourcePool();
    this.startResourceMonitoring();
    console.log('💾 Resource Manager initialized');
  }

  private initializeResourcePool() {
    this.resourcePool = {
      totalCpu: 1000, // CPU cores
      totalMemory: 2048, // GB
      totalStorage: 10240, // GB
      totalNetwork: 1000, // Gbps
      availableCpu: 1000,
      availableMemory: 2048,
      availableStorage: 10240,
      availableNetwork: 1000,
      utilizationRate: 0,
      activeAllocations: 0
    };
  }

  async allocateResources(projectId: number, agentId: string, requirements: ResourceRequirements): Promise<ResourceAllocation> {
    try {
      // Check if resources are available
      if (!this.canAllocateResources(requirements)) {
        throw new Error('Insufficient resources available');
      }

      // Create allocation
      const allocation: ResourceAllocation = {
        allocationId: `alloc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        projectId,
        agentId,
        resources: requirements,
        allocatedAt: new Date(),
        expiresAt: new Date(Date.now() + requirements.estimatedDuration * 60 * 60 * 1000),
        status: 'allocated'
      };

      // Reserve resources
      this.reserveResources(requirements);
      
      // Store allocation
      this.allocations.set(allocation.allocationId, allocation);
      
      // Update pool stats
      this.updateResourcePoolStats();

      console.log(`📊 Resources allocated for agent ${agentId}: ${JSON.stringify(requirements)}`);
      
      this.emit('resources.allocated', { allocation, projectId, agentId });
      
      return allocation;
    } catch (error) {
      console.error('Failed to allocate resources:', error);
      throw error;
    }
  }

  async releaseResources(allocationId: string): Promise<void> {
    const allocation = this.allocations.get(allocationId);
    if (!allocation) {
      throw new Error('Allocation not found');
    }

    // Release resources back to pool
    this.releaseResourcesFromPool(allocation.resources);
    
    // Update allocation status
    allocation.status = 'released';
    
    // Update pool stats
    this.updateResourcePoolStats();

    console.log(`🔄 Resources released for allocation ${allocationId}`);
    
    this.emit('resources.released', { allocation });
  }

  async monitorResourceUsage(projectId: number): Promise<ResourceUsage[]> {
    return this.usageHistory.filter(usage => 
      Array.from(this.allocations.values()).some(alloc => 
        alloc.projectId === projectId && alloc.allocatedAt <= usage.timestamp
      )
    );
  }

  async optimizeResourceDistribution(projectId?: number): Promise<OptimizationResult> {
    const optimizationId = `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const targetAllocations = projectId 
      ? Array.from(this.allocations.values()).filter(alloc => alloc.projectId === projectId)
      : Array.from(this.allocations.values());

    // Analyze current resource usage
    const currentCost = this.calculateResourceCost(targetAllocations);
    const recommendations = this.generateOptimizationRecommendations(targetAllocations);
    
    // Calculate potential savings
    const potentialSavings = recommendations.reduce((sum, rec) => sum + rec.estimatedSavings, 0);
    const optimizedCost = currentCost - potentialSavings;
    const savingsPercentage = (potentialSavings / currentCost) * 100;

    const result: OptimizationResult = {
      optimizationId,
      projectId: projectId || 0,
      originalCost: currentCost,
      optimizedCost,
      savings: potentialSavings,
      savingsPercentage,
      recommendations
    };

    this.optimizationHistory.push(result);
    
    console.log(`⚡ Resource optimization completed: ${savingsPercentage.toFixed(1)}% savings`);
    
    this.emit('resources.optimized', { result });
    
    return result;
  }

  async implementOptimization(optimizationId: string): Promise<void> {
    const optimization = this.optimizationHistory.find(opt => opt.optimizationId === optimizationId);
    if (!optimization) {
      throw new Error('Optimization not found');
    }

    // Implement recommendations
    for (const recommendation of optimization.recommendations) {
      await this.implementRecommendation(recommendation);
    }

    optimization.implementedAt = new Date();
    
    console.log(`✅ Optimization ${optimizationId} implemented`);
    
    this.emit('optimization.implemented', { optimization });
  }

  async balanceLoad(): Promise<LoadBalancingResult> {
    const activeAllocations = Array.from(this.allocations.values())
      .filter(alloc => alloc.status === 'active');

    // Calculate current load distribution
    const agentLoads = this.calculateAgentLoads(activeAllocations);
    const averageLoadBefore = agentLoads.reduce((sum, load) => sum + load.utilization, 0) / agentLoads.length;

    // Perform load balancing
    const rebalancedAgents = await this.performLoadBalancing(agentLoads);

    // Calculate new load distribution
    const newAgentLoads = this.calculateAgentLoads(activeAllocations);
    const averageLoadAfter = newAgentLoads.reduce((sum, load) => sum + load.utilization, 0) / newAgentLoads.length;

    const result: LoadBalancingResult = {
      balancingId: `balance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      totalAgents: agentLoads.length,
      rebalancedAgents,
      averageLoadBefore,
      averageLoadAfter,
      efficiency: (averageLoadAfter / averageLoadBefore) * 100,
      timestamp: new Date()
    };

    this.loadBalancingHistory.push(result);
    
    console.log(`⚖️ Load balancing completed: ${result.efficiency.toFixed(1)}% efficiency`);
    
    this.emit('load.balanced', { result });
    
    return result;
  }

  private canAllocateResources(requirements: ResourceRequirements): boolean {
    return (
      this.resourcePool.availableCpu >= requirements.cpu &&
      this.resourcePool.availableMemory >= requirements.memory &&
      this.resourcePool.availableStorage >= requirements.storage &&
      this.resourcePool.availableNetwork >= requirements.network
    );
  }

  private reserveResources(requirements: ResourceRequirements): void {
    this.resourcePool.availableCpu -= requirements.cpu;
    this.resourcePool.availableMemory -= requirements.memory;
    this.resourcePool.availableStorage -= requirements.storage;
    this.resourcePool.availableNetwork -= requirements.network;
  }

  private releaseResourcesFromPool(requirements: ResourceRequirements): void {
    this.resourcePool.availableCpu += requirements.cpu;
    this.resourcePool.availableMemory += requirements.memory;
    this.resourcePool.availableStorage += requirements.storage;
    this.resourcePool.availableNetwork += requirements.network;
  }

  private updateResourcePoolStats(): void {
    const usedCpu = this.resourcePool.totalCpu - this.resourcePool.availableCpu;
    const usedMemory = this.resourcePool.totalMemory - this.resourcePool.availableMemory;
    const usedStorage = this.resourcePool.totalStorage - this.resourcePool.availableStorage;
    const usedNetwork = this.resourcePool.totalNetwork - this.resourcePool.availableNetwork;

    this.resourcePool.utilizationRate = (
      (usedCpu / this.resourcePool.totalCpu) +
      (usedMemory / this.resourcePool.totalMemory) +
      (usedStorage / this.resourcePool.totalStorage) +
      (usedNetwork / this.resourcePool.totalNetwork)
    ) / 4 * 100;

    this.resourcePool.activeAllocations = Array.from(this.allocations.values())
      .filter(alloc => alloc.status === 'active').length;
  }

  private calculateResourceCost(allocations: ResourceAllocation[]): number {
    return allocations.reduce((cost, alloc) => {
      const hourlyRate = this.calculateHourlyRate(alloc.resources);
      const duration = (Date.now() - alloc.allocatedAt.getTime()) / (1000 * 60 * 60);
      return cost + (hourlyRate * duration);
    }, 0);
  }

  private calculateHourlyRate(resources: ResourceRequirements): number {
    const cpuCost = resources.cpu * 0.05; // $0.05 per CPU core per hour
    const memoryCost = resources.memory * 0.01; // $0.01 per GB per hour
    const storageCost = resources.storage * 0.001; // $0.001 per GB per hour
    const networkCost = resources.network * 0.02; // $0.02 per Gbps per hour
    
    return cpuCost + memoryCost + storageCost + networkCost;
  }

  private generateOptimizationRecommendations(allocations: ResourceAllocation[]): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Find over-allocated resources
    const overAllocated = allocations.filter(alloc => 
      alloc.actualUsage && this.isOverAllocated(alloc)
    );

    overAllocated.forEach(alloc => {
      recommendations.push({
        type: 'resource_scaling',
        description: `Reduce resource allocation for agent ${alloc.agentId}`,
        impact: 'medium',
        estimatedSavings: this.calculateOverAllocationSavings(alloc),
        implementationComplexity: 'simple',
        action: {
          type: 'scale_down',
          allocationId: alloc.allocationId,
          newResources: this.calculateOptimalResources(alloc)
        }
      });
    });

    // Find agents with high load
    const highLoadAgents = this.findHighLoadAgents(allocations);
    
    if (highLoadAgents.length > 0) {
      recommendations.push({
        type: 'load_balancing',
        description: 'Redistribute load among agents',
        impact: 'high',
        estimatedSavings: highLoadAgents.length * 50, // $50 per agent optimization
        implementationComplexity: 'moderate',
        action: {
          type: 'rebalance_load',
          agents: highLoadAgents
        }
      });
    }

    return recommendations;
  }

  private isOverAllocated(allocation: ResourceAllocation): boolean {
    if (!allocation.actualUsage) return false;
    
    const cpuEfficiency = allocation.actualUsage.cpu / allocation.resources.cpu;
    const memoryEfficiency = allocation.actualUsage.memory / allocation.resources.memory;
    
    return cpuEfficiency < 0.5 || memoryEfficiency < 0.5;
  }

  private calculateOverAllocationSavings(allocation: ResourceAllocation): number {
    const currentCost = this.calculateHourlyRate(allocation.resources);
    const optimalResources = this.calculateOptimalResources(allocation);
    const optimalCost = this.calculateHourlyRate(optimalResources);
    
    return currentCost - optimalCost;
  }

  private calculateOptimalResources(allocation: ResourceAllocation): ResourceRequirements {
    if (!allocation.actualUsage) return allocation.resources;
    
    const buffer = 1.2; // 20% buffer
    
    return {
      cpu: Math.ceil(allocation.actualUsage.cpu * buffer),
      memory: Math.ceil(allocation.actualUsage.memory * buffer),
      storage: Math.ceil(allocation.actualUsage.storage * buffer),
      network: Math.ceil(allocation.actualUsage.network * buffer),
      priority: allocation.resources.priority,
      estimatedDuration: allocation.resources.estimatedDuration
    };
  }

  private findHighLoadAgents(allocations: ResourceAllocation[]): string[] {
    const agentLoads = this.calculateAgentLoads(allocations);
    return agentLoads
      .filter(load => load.utilization > 85)
      .map(load => load.agentId);
  }

  private calculateAgentLoads(allocations: ResourceAllocation[]): Array<{agentId: string, utilization: number}> {
    const agentGroups = new Map<string, ResourceAllocation[]>();
    
    allocations.forEach(alloc => {
      if (!agentGroups.has(alloc.agentId)) {
        agentGroups.set(alloc.agentId, []);
      }
      agentGroups.get(alloc.agentId)!.push(alloc);
    });

    return Array.from(agentGroups.entries()).map(([agentId, agentAllocs]) => {
      const totalLoad = agentAllocs.reduce((sum, alloc) => {
        return sum + alloc.resources.cpu + alloc.resources.memory;
      }, 0);
      
      return {
        agentId,
        utilization: Math.min(totalLoad, 100)
      };
    });
  }

  private async performLoadBalancing(agentLoads: Array<{agentId: string, utilization: number}>): Promise<number> {
    let rebalancedCount = 0;
    
    const overloadedAgents = agentLoads.filter(load => load.utilization > 85);
    const underloadedAgents = agentLoads.filter(load => load.utilization < 50);
    
    // Redistribute tasks from overloaded to underloaded agents
    for (const overloaded of overloadedAgents) {
      for (const underloaded of underloadedAgents) {
        if (underloaded.utilization < 70) {
          // Simulate task redistribution
          await this.redistributeTask(overloaded.agentId, underloaded.agentId);
          rebalancedCount++;
          break;
        }
      }
    }
    
    return rebalancedCount;
  }

  private async redistributeTask(fromAgentId: string, toAgentId: string): Promise<void> {
    // Simulate task redistribution
    console.log(`🔄 Redistributing task from ${fromAgentId} to ${toAgentId}`);
    
    // In a real implementation, this would:
    // 1. Find active tasks for overloaded agent
    // 2. Select suitable tasks for redistribution
    // 3. Reassign tasks to underloaded agent
    // 4. Update resource allocations
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async implementRecommendation(recommendation: OptimizationRecommendation): Promise<void> {
    switch (recommendation.type) {
      case 'resource_scaling':
        await this.implementResourceScaling(recommendation.action);
        break;
      case 'load_balancing':
        await this.implementLoadBalancing(recommendation.action);
        break;
      case 'agent_reallocation':
        await this.implementAgentReallocation(recommendation.action);
        break;
      case 'priority_adjustment':
        await this.implementPriorityAdjustment(recommendation.action);
        break;
    }
  }

  private async implementResourceScaling(action: any): Promise<void> {
    const allocation = this.allocations.get(action.allocationId);
    if (allocation) {
      // Release old resources
      this.releaseResourcesFromPool(allocation.resources);
      
      // Allocate new resources
      allocation.resources = action.newResources;
      this.reserveResources(allocation.resources);
      
      this.updateResourcePoolStats();
      
      console.log(`📈 Resource scaling implemented for ${action.allocationId}`);
    }
  }

  private async implementLoadBalancing(action: any): Promise<void> {
    await this.balanceLoad();
    console.log(`⚖️ Load balancing implemented for ${action.agents.length} agents`);
  }

  private async implementAgentReallocation(action: any): Promise<void> {
    console.log(`🔄 Agent reallocation implemented`);
  }

  private async implementPriorityAdjustment(action: any): Promise<void> {
    console.log(`🎯 Priority adjustment implemented`);
  }

  private startResourceMonitoring(): void {
    setInterval(() => {
      this.collectResourceUsage();
      this.cleanupExpiredAllocations();
    }, 30000); // Every 30 seconds
  }

  private collectResourceUsage(): void {
    const usage: ResourceUsage = {
      cpu: this.resourcePool.totalCpu - this.resourcePool.availableCpu,
      memory: this.resourcePool.totalMemory - this.resourcePool.availableMemory,
      storage: this.resourcePool.totalStorage - this.resourcePool.availableStorage,
      network: this.resourcePool.totalNetwork - this.resourcePool.availableNetwork,
      duration: 30, // 30 seconds
      efficiency: this.resourcePool.utilizationRate,
      timestamp: new Date()
    };

    this.usageHistory.push(usage);
    
    // Keep only last 24 hours of data
    const cutoff = Date.now() - (24 * 60 * 60 * 1000);
    this.usageHistory = this.usageHistory.filter(u => u.timestamp.getTime() > cutoff);
  }

  private cleanupExpiredAllocations(): void {
    const now = Date.now();
    const expiredAllocations = Array.from(this.allocations.values())
      .filter(alloc => alloc.expiresAt.getTime() < now);

    expiredAllocations.forEach(alloc => {
      this.releaseResources(alloc.allocationId).catch(console.error);
    });
  }

  // Public API methods
  getResourcePool(): ResourcePool {
    return { ...this.resourcePool };
  }

  getActiveAllocations(): ResourceAllocation[] {
    return Array.from(this.allocations.values()).filter(alloc => alloc.status === 'active');
  }

  getUsageHistory(hours: number = 24): ResourceUsage[] {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return this.usageHistory.filter(usage => usage.timestamp.getTime() > cutoff);
  }

  getOptimizationHistory(): OptimizationResult[] {
    return [...this.optimizationHistory];
  }

  getResourceUtilization(): number {
    return this.resourcePool.utilizationRate;
  }
}

export const resourceManager = new ResourceManager();