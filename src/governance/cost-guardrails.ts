/**
 * Cost Guardrails and Global Governors
 * Implements comprehensive cost management and resource governance
 * 
 * Features:
 * - Real-time Cost Monitoring and Alerts
 * - Dynamic Budget Management
 * - Provider Cost Optimization
 * - Usage Pattern Analysis
 * - Automated Cost Controls
 * - Predictive Budget Forecasting
 * - Multi-tenant Cost Allocation
 * - Emergency Circuit Breakers
 */

import { EventEmitter } from 'events';
import { WAILogger } from '../utils/logger';

export class CostGuardrailsSystem extends EventEmitter {
  private logger: WAILogger;
  private initialized = false;
  private budgets: Map<string, Budget> = new Map();
  private costTracking: Map<string, CostTracker> = new Map();
  private costPolicies: Map<string, CostPolicy> = new Map();
  private alerts: Map<string, CostAlert> = new Map();
  private governors: Map<string, ResourceGovernor> = new Map();
  private forecaster: CostForecaster;
  private optimizer: CostOptimizer;
  
  constructor(private config: CostGuardrailsConfig) {
    super();
    this.logger = new WAILogger('CostGuardrails');
    this.forecaster = new CostForecaster(config.forecasting);
    this.optimizer = new CostOptimizer(config.optimization);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.logger.info('💰 Initializing Cost Guardrails System...');

      // Initialize cost tracking
      await this.initializeCostTracking();

      // Initialize budget management
      await this.initializeBudgetManagement();

      // Initialize cost policies
      await this.initializeCostPolicies();

      // Initialize resource governors
      await this.initializeResourceGovernors();

      // Initialize forecaster and optimizer
      await this.forecaster.initialize();
      await this.optimizer.initialize();

      // Start cost monitoring
      this.startCostMonitoring();

      // Start budget enforcement
      this.startBudgetEnforcement();

      // Start optimization monitoring
      this.startOptimizationMonitoring();

      this.initialized = true;
      this.logger.info('✅ Cost Guardrails System initialized with comprehensive controls');

    } catch (error) {
      this.logger.error('❌ Cost Guardrails System initialization failed:', error);
      throw error;
    }
  }

  /**
   * Record cost for operation
   */
  async recordCost(costEntry: CostEntry): Promise<void> {
    if (!this.initialized) {
      throw new Error('Cost Guardrails System not initialized');
    }

    try {
      // Get or create cost tracker
      const trackerId = this.getCostTrackerId(costEntry.tenantId, costEntry.category);
      let tracker = this.costTracking.get(trackerId);
      
      if (!tracker) {
        tracker = new CostTracker(trackerId, costEntry.tenantId, costEntry.category);
        this.costTracking.set(trackerId, tracker);
      }

      // Record the cost
      await tracker.recordCost(costEntry);

      // Check budget limits
      await this.checkBudgetLimits(costEntry);

      // Check cost policies
      await this.checkCostPolicies(costEntry);

      // Update real-time metrics
      await this.updateRealTimeMetrics(costEntry);

      // Check for optimization opportunities
      await this.optimizer.checkOptimizationOpportunities(costEntry);

      this.emit('costRecorded', {
        amount: costEntry.amount,
        category: costEntry.category,
        tenantId: costEntry.tenantId,
        providerId: costEntry.providerId,
        timestamp: costEntry.timestamp
      });

      this.logger.debug(`💰 Cost recorded: ${costEntry.amount} for ${costEntry.category}`);

    } catch (error) {
      this.logger.error('❌ Failed to record cost:', error);
      throw error;
    }
  }

  /**
   * Create or update budget
   */
  async createBudget(budgetDefinition: BudgetDefinition): Promise<Budget> {
    const budget: Budget = {
      id: budgetDefinition.id || `budget_${Date.now()}`,
      name: budgetDefinition.name,
      tenantId: budgetDefinition.tenantId,
      category: budgetDefinition.category,
      period: budgetDefinition.period,
      limit: budgetDefinition.limit,
      allocated: 0,
      spent: 0,
      remaining: budgetDefinition.limit,
      alerts: budgetDefinition.alerts || [
        { threshold: 0.5, type: 'warning', enabled: true },
        { threshold: 0.8, type: 'critical', enabled: true },
        { threshold: 1.0, type: 'emergency', enabled: true }
      ],
      policies: budgetDefinition.policies || [],
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      periodStart: this.calculatePeriodStart(budgetDefinition.period),
      periodEnd: this.calculatePeriodEnd(budgetDefinition.period),
      history: []
    };

    this.budgets.set(budget.id, budget);

    this.emit('budgetCreated', {
      budgetId: budget.id,
      tenantId: budget.tenantId,
      limit: budget.limit,
      category: budget.category
    });

    this.logger.info(`💰 Budget created: ${budget.name} (${budget.limit})`);
    return budget;
  }

  /**
   * Check budget status and enforce limits
   */
  async checkBudgetLimits(costEntry: CostEntry): Promise<BudgetCheckResult> {
    const relevantBudgets = this.findRelevantBudgets(costEntry);
    const results: BudgetCheckResult[] = [];

    for (const budget of relevantBudgets) {
      // Calculate projected spending after this cost
      const projectedSpent = budget.spent + costEntry.amount;
      const utilizationRate = projectedSpent / budget.limit;

      // Check alert thresholds
      const triggeredAlerts = budget.alerts.filter(alert => 
        utilizationRate >= alert.threshold && alert.enabled
      );

      // Check if budget would be exceeded
      const wouldExceed = projectedSpent > budget.limit;

      if (triggeredAlerts.length > 0) {
        await this.triggerBudgetAlerts(budget, costEntry, triggeredAlerts, utilizationRate);
      }

      if (wouldExceed) {
        const result = await this.handleBudgetExceeded(budget, costEntry, projectedSpent);
        results.push(result);
      } else {
        // Update budget spending
        budget.spent = projectedSpent;
        budget.remaining = budget.limit - projectedSpent;
        budget.updatedAt = Date.now();
        
        results.push({
          budgetId: budget.id,
          allowed: true,
          currentSpending: projectedSpent,
          remainingBudget: budget.remaining,
          utilizationRate
        });
      }
    }

    return results.length === 1 ? results[0] : {
      budgetId: 'multiple',
      allowed: results.every(r => r.allowed),
      currentSpending: Math.max(...results.map(r => r.currentSpending)),
      remainingBudget: Math.min(...results.map(r => r.remainingBudget)),
      utilizationRate: Math.max(...results.map(r => r.utilizationRate)),
      details: results
    };
  }

  /**
   * Get cost optimization recommendations
   */
  async getOptimizationRecommendations(tenantId?: string): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    try {
      // Analyze spending patterns
      const spendingAnalysis = await this.analyzeSpendingPatterns(tenantId);

      // Provider optimization opportunities
      const providerOptimizations = await this.optimizer.analyzeProviderOptimizations(spendingAnalysis);
      recommendations.push(...providerOptimizations);

      // Usage pattern optimizations
      const usageOptimizations = await this.optimizer.analyzeUsagePatterns(spendingAnalysis);
      recommendations.push(...usageOptimizations);

      // Timing optimizations
      const timingOptimizations = await this.optimizer.analyzeTimingOptimizations(spendingAnalysis);
      recommendations.push(...timingOptimizations);

      // Model selection optimizations
      const modelOptimizations = await this.optimizer.analyzeModelOptimizations(spendingAnalysis);
      recommendations.push(...modelOptimizations);

      // Budget reallocation opportunities
      const budgetOptimizations = await this.analyzeBudgetReallocation(tenantId);
      recommendations.push(...budgetOptimizations);

      // Sort by potential savings
      recommendations.sort((a, b) => (b.potentialSavings || 0) - (a.potentialSavings || 0));

      this.emit('optimizationRecommendationsGenerated', {
        tenantId,
        recommendationCount: recommendations.length,
        totalPotentialSavings: recommendations.reduce((sum, r) => sum + (r.potentialSavings || 0), 0)
      });

      return recommendations;

    } catch (error) {
      this.logger.error('❌ Failed to generate optimization recommendations:', error);
      return [];
    }
  }

  /**
   * Generate comprehensive cost report
   */
  async generateCostReport(criteria: CostReportCriteria): Promise<CostReport> {
    this.logger.info('📊 Generating comprehensive cost report...');

    try {
      // Collect cost data
      const costData = await this.collectCostData(criteria);

      // Analyze spending by category
      const categoryBreakdown = this.analyzeCostByCategory(costData);

      // Analyze spending by provider
      const providerBreakdown = this.analyzeCostByProvider(costData);

      // Analyze spending trends
      const trendAnalysis = await this.analyzeCostTrends(costData, criteria);

      // Generate budget analysis
      const budgetAnalysis = await this.analyzeBudgetPerformance(criteria);

      // Calculate cost efficiency metrics
      const efficiencyMetrics = await this.calculateEfficiencyMetrics(costData);

      // Generate forecasts
      const costForecast = await this.forecaster.generateCostForecast(costData, criteria);

      // Get optimization recommendations
      const recommendations = await this.getOptimizationRecommendations(criteria.tenantId);

      const report: CostReport = {
        id: `cost_report_${Date.now()}`,
        criteria,
        generatedAt: Date.now(),
        summary: {
          totalCost: costData.reduce((sum, entry) => sum + entry.amount, 0),
          periodStart: criteria.startDate,
          periodEnd: criteria.endDate,
          averageDailyCost: this.calculateAverageDailyCost(costData, criteria),
          costTrend: trendAnalysis.overallTrend,
          topCategory: categoryBreakdown.length > 0 ? categoryBreakdown[0] : null,
          topProvider: providerBreakdown.length > 0 ? providerBreakdown[0] : null
        },
        breakdown: {
          byCategory: categoryBreakdown,
          byProvider: providerBreakdown,
          byTenant: criteria.tenantId ? null : this.analyzeCostByTenant(costData)
        },
        trends: trendAnalysis,
        budgets: budgetAnalysis,
        efficiency: efficiencyMetrics,
        forecast: costForecast,
        recommendations
      };

      this.emit('costReportGenerated', {
        reportId: report.id,
        totalCost: report.summary.totalCost,
        recommendationCount: recommendations.length,
        tenantId: criteria.tenantId
      });

      return report;

    } catch (error) {
      this.logger.error('❌ Failed to generate cost report:', error);
      throw error;
    }
  }

  /**
   * Initialize cost tracking
   */
  private async initializeCostTracking(): Promise<void> {
    // Initialize default cost categories
    const categories = [
      'llm_inference',
      'data_storage',
      'compute_resources',
      'api_calls',
      'model_training',
      'data_processing',
      'infrastructure',
      'third_party_services'
    ];

    for (const category of categories) {
      const trackerId = this.getCostTrackerId('global', category);
      const tracker = new CostTracker(trackerId, 'global', category);
      this.costTracking.set(trackerId, tracker);
    }

    this.logger.info(`💰 Initialized cost tracking for ${categories.length} categories`);
  }

  /**
   * Initialize budget management
   */
  private async initializeBudgetManagement(): Promise<void> {
    // Create default global budgets if configured
    if (this.config.defaultBudgets) {
      for (const budgetDef of this.config.defaultBudgets) {
        await this.createBudget(budgetDef);
      }
    }

    this.logger.info('💰 Budget management initialized');
  }

  /**
   * Initialize cost policies
   */
  private async initializeCostPolicies(): Promise<void> {
    const defaultPolicies = [
      {
        id: 'high_cost_operation_approval',
        name: 'High Cost Operation Approval',
        description: 'Require approval for operations exceeding threshold',
        conditions: [
          { field: 'cost', operator: 'gt', value: 100 },
          { field: 'category', operator: 'in', value: ['llm_inference', 'model_training'] }
        ],
        actions: ['require_approval', 'notify_admin'],
        enabled: this.config.enableHighCostApproval || false
      },
      {
        id: 'budget_overspend_prevention',
        name: 'Budget Overspend Prevention',
        description: 'Block operations that would exceed budget',
        conditions: [
          { field: 'budget_utilization', operator: 'gte', value: 1.0 }
        ],
        actions: ['block_operation', 'notify_budget_owner'],
        enabled: this.config.enableBudgetEnforcement !== false
      },
      {
        id: 'unusual_spending_detection',
        name: 'Unusual Spending Detection',
        description: 'Detect and alert on unusual spending patterns',
        conditions: [
          { field: 'cost_spike', operator: 'gt', value: 5.0 },
          { field: 'time_window', operator: 'eq', value: 'hourly' }
        ],
        actions: ['investigate', 'alert_admin'],
        enabled: true
      }
    ];

    for (const policy of defaultPolicies) {
      this.costPolicies.set(policy.id, {
        ...policy,
        createdAt: Date.now()
      });
    }

    this.logger.info(`📋 Initialized ${defaultPolicies.length} cost policies`);
  }

  /**
   * Initialize resource governors
   */
  private async initializeResourceGovernors(): Promise<void> {
    const governors = [
      {
        id: 'llm_cost_governor',
        name: 'LLM Cost Governor',
        resourceType: 'llm_inference',
        limits: {
          hourlySpend: this.config.llmHourlyLimit || 1000,
          dailySpend: this.config.llmDailyLimit || 10000,
          monthlySpend: this.config.llmMonthlyLimit || 100000
        },
        actions: ['throttle', 'circuit_break', 'notify']
      },
      {
        id: 'compute_governor',
        name: 'Compute Resource Governor',
        resourceType: 'compute_resources',
        limits: {
          concurrentJobs: this.config.maxConcurrentJobs || 100,
          hourlySpend: this.config.computeHourlyLimit || 500,
          cpuHours: this.config.maxCpuHours || 1000
        },
        actions: ['queue', 'throttle', 'notify']
      }
    ];

    for (const govConfig of governors) {
      const governor = new ResourceGovernor(govConfig);
      await governor.initialize();
      this.governors.set(govConfig.id, governor);
    }

    this.logger.info(`🏛️ Initialized ${governors.length} resource governors`);
  }

  /**
   * Start cost monitoring
   */
  private startCostMonitoring(): void {
    setInterval(async () => {
      await this.performCostHealthCheck();
      await this.checkBudgetStatus();
      await this.detectAnomalousSpending();
      await this.updateCostForecasts();
    }, 60000); // Every minute
  }

  /**
   * Get comprehensive cost system status
   */
  async getCostSystemStatus(): Promise<CostSystemStatus> {
    const activeBudgets = Array.from(this.budgets.values()).filter(b => b.status === 'active');
    const totalSpending = activeBudgets.reduce((sum, b) => sum + b.spent, 0);
    const totalBudget = activeBudgets.reduce((sum, b) => sum + b.limit, 0);

    return {
      initialized: this.initialized,
      budgets: {
        total: this.budgets.size,
        active: activeBudgets.length,
        totalAllocated: totalBudget,
        totalSpent: totalSpending,
        utilizationRate: totalBudget > 0 ? totalSpending / totalBudget : 0
      },
      tracking: {
        activeTrackers: this.costTracking.size,
        categoriesTracked: new Set(Array.from(this.costTracking.values()).map(t => t.category)).size
      },
      policies: {
        total: this.costPolicies.size,
        enabled: Array.from(this.costPolicies.values()).filter(p => p.enabled).length
      },
      governors: {
        total: this.governors.size,
        active: Array.from(this.governors.values()).filter(g => g.isActive()).length
      },
      alerts: {
        active: this.alerts.size,
        critical: Array.from(this.alerts.values()).filter(a => a.severity === 'critical').length
      }
    };
  }

  /**
   * Get health status
   */
  async getHealth(): Promise<ComponentHealth> {
    const status = await this.getCostSystemStatus();
    
    return {
      healthy: this.initialized && status.alerts.critical === 0,
      status: this.initialized ? 'active' : 'inactive',
      lastCheck: Date.now(),
      details: {
        initialized: status.initialized,
        activeBudgets: status.budgets.active,
        totalSpent: status.budgets.totalSpent,
        utilizationRate: status.budgets.utilizationRate,
        criticalAlerts: status.alerts.critical,
        activeGovernors: status.governors.active
      }
    };
  }

  // Helper methods
  private getCostTrackerId(tenantId: string, category: string): string {
    return `${tenantId}_${category}`;
  }

  private calculatePeriodStart(period: BudgetPeriod): number {
    const now = new Date();
    switch (period) {
      case 'daily':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      case 'weekly':
        const dayOfWeek = now.getDay();
        const startOfWeek = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
        return new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate()).getTime();
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      case 'quarterly':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        return new Date(now.getFullYear(), quarterStart, 1).getTime();
      case 'yearly':
        return new Date(now.getFullYear(), 0, 1).getTime();
      default:
        return now.getTime();
    }
  }

  private calculatePeriodEnd(period: BudgetPeriod): number {
    const start = new Date(this.calculatePeriodStart(period));
    switch (period) {
      case 'daily':
        return new Date(start.getTime() + 24 * 60 * 60 * 1000).getTime();
      case 'weekly':
        return new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000).getTime();
      case 'monthly':
        return new Date(start.getFullYear(), start.getMonth() + 1, 1).getTime();
      case 'quarterly':
        return new Date(start.getFullYear(), start.getMonth() + 3, 1).getTime();
      case 'yearly':
        return new Date(start.getFullYear() + 1, 0, 1).getTime();
      default:
        return start.getTime() + 24 * 60 * 60 * 1000;
    }
  }

  async shutdown(): Promise<void> {
    this.logger.info('🔄 Shutting down Cost Guardrails System...');
    
    await this.forecaster.shutdown();
    await this.optimizer.shutdown();
    
    for (const governor of this.governors.values()) {
      await governor.shutdown();
    }
    
    this.initialized = false;
  }
}

// Supporting classes (simplified)
class CostTracker {
  constructor(
    public id: string,
    public tenantId: string,
    public category: string
  ) {}

  async recordCost(entry: CostEntry): Promise<void> {
    // Record cost implementation
  }
}

class CostForecaster {
  constructor(private config: any) {}
  async initialize() {}
  async generateCostForecast(costData: any[], criteria: any): Promise<any> {
    return { projected: 1000, confidence: 0.85 };
  }
  async shutdown() {}
}

class CostOptimizer {
  constructor(private config: any) {}
  async initialize() {}
  async checkOptimizationOpportunities(entry: CostEntry) {}
  async analyzeProviderOptimizations(analysis: any): Promise<OptimizationRecommendation[]> { return []; }
  async analyzeUsagePatterns(analysis: any): Promise<OptimizationRecommendation[]> { return []; }
  async analyzeTimingOptimizations(analysis: any): Promise<OptimizationRecommendation[]> { return []; }
  async analyzeModelOptimizations(analysis: any): Promise<OptimizationRecommendation[]> { return []; }
  async shutdown() {}
}

class ResourceGovernor {
  constructor(private config: any) {}
  async initialize() {}
  isActive(): boolean { return true; }
  async shutdown() {}
}

// Type definitions
export interface CostGuardrailsConfig {
  forecasting?: any;
  optimization?: any;
  defaultBudgets?: BudgetDefinition[];
  enableHighCostApproval?: boolean;
  enableBudgetEnforcement?: boolean;
  llmHourlyLimit?: number;
  llmDailyLimit?: number;
  llmMonthlyLimit?: number;
  computeHourlyLimit?: number;
  maxConcurrentJobs?: number;
  maxCpuHours?: number;
}

type BudgetPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

interface BudgetDefinition {
  id?: string;
  name: string;
  tenantId?: string;
  category: string;
  period: BudgetPeriod;
  limit: number;
  alerts?: BudgetAlert[];
  policies?: string[];
}

interface Budget {
  id: string;
  name: string;
  tenantId?: string;
  category: string;
  period: BudgetPeriod;
  limit: number;
  allocated: number;
  spent: number;
  remaining: number;
  alerts: BudgetAlert[];
  policies: string[];
  status: 'active' | 'inactive' | 'exceeded';
  createdAt: number;
  updatedAt: number;
  periodStart: number;
  periodEnd: number;
  history: BudgetHistory[];
}

interface BudgetAlert {
  threshold: number;
  type: 'warning' | 'critical' | 'emergency';
  enabled: boolean;
}

interface BudgetHistory {
  date: number;
  spent: number;
  remaining: number;
}

interface CostEntry {
  id?: string;
  amount: number;
  currency?: string;
  category: string;
  tenantId?: string;
  userId?: string;
  providerId?: string;
  resourceId?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface CostPolicy {
  id: string;
  name: string;
  description: string;
  conditions: PolicyCondition[];
  actions: string[];
  enabled: boolean;
  createdAt: number;
}

interface PolicyCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in';
  value: any;
}

interface CostAlert {
  id: string;
  budgetId?: string;
  severity: 'info' | 'warning' | 'critical' | 'emergency';
  message: string;
  createdAt: number;
  resolvedAt?: number;
}

interface BudgetCheckResult {
  budgetId: string;
  allowed: boolean;
  currentSpending: number;
  remainingBudget: number;
  utilizationRate: number;
  details?: BudgetCheckResult[];
}

interface OptimizationRecommendation {
  id: string;
  type: 'provider' | 'usage' | 'timing' | 'model' | 'budget';
  title: string;
  description: string;
  potentialSavings?: number;
  confidence: number;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  actions: string[];
}

interface CostReportCriteria {
  startDate: number;
  endDate: number;
  tenantId?: string;
  categories?: string[];
  providers?: string[];
}

interface CostReport {
  id: string;
  criteria: CostReportCriteria;
  generatedAt: number;
  summary: {
    totalCost: number;
    periodStart: number;
    periodEnd: number;
    averageDailyCost: number;
    costTrend: 'increasing' | 'decreasing' | 'stable';
    topCategory: any;
    topProvider: any;
  };
  breakdown: {
    byCategory: any[];
    byProvider: any[];
    byTenant: any[] | null;
  };
  trends: any;
  budgets: any;
  efficiency: any;
  forecast: any;
  recommendations: OptimizationRecommendation[];
}

interface CostSystemStatus {
  initialized: boolean;
  budgets: {
    total: number;
    active: number;
    totalAllocated: number;
    totalSpent: number;
    utilizationRate: number;
  };
  tracking: {
    activeTrackers: number;
    categoriesTracked: number;
  };
  policies: {
    total: number;
    enabled: number;
  };
  governors: {
    total: number;
    active: number;
  };
  alerts: {
    active: number;
    critical: number;
  };
}

interface ComponentHealth {
  healthy: boolean;
  status: string;
  lastCheck: number;
  details?: any;
}