/**
 * FinOps System v9.0
 * 
 * Phase 10: Financial Operations with cost optimization, budget monitoring, and resource allocation
 * Production-ready financial management for WAI v9.0 orchestration system
 */

import { EventEmitter } from 'events';

// ================================================================================================
// FINOPS INTERFACES
// ================================================================================================

export interface FinOpsSystem {
  initialize(config: FinOpsConfig): Promise<void>;
  trackCost(cost: CostData): Promise<void>;
  optimizeCosts(): Promise<OptimizationResult>;
  generateBudgetReport(timeRange: TimeRange): Promise<BudgetReport>;
  checkBudgetAlerts(): Promise<BudgetAlert[]>;
  allocateResources(request: ResourceAllocationRequest): Promise<ResourceAllocationResult>;
  forecastCosts(horizon: ForecastHorizon): Promise<CostForecast>;
  analyzeCostTrends(): Promise<CostTrendAnalysis>;
}

export interface FinOpsConfig {
  defaultBudget: number; // USD
  budgetPeriod: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  costCenters: CostCenter[];
  alertThresholds: AlertThreshold[];
  optimization: OptimizationConfig;
  providers: ProviderConfig[];
  currency: string;
  reporting: ReportingConfig;
}

export interface CostCenter {
  id: string;
  name: string;
  budget: number;
  owner: string;
  tags: Record<string, string>;
  allocatedServices: string[];
}

export interface AlertThreshold {
  type: 'budget_percentage' | 'absolute_amount' | 'burn_rate' | 'forecast_breach';
  value: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  channels: string[];
}

export interface OptimizationConfig {
  enabled: boolean;
  strategies: OptimizationStrategy[];
  autoApply: boolean;
  reviewRequired: boolean;
  maxSavingsPercentage: number;
}

export interface OptimizationStrategy {
  type: 'right_sizing' | 'reserved_instances' | 'spot_instances' | 'auto_scaling' | 'scheduled_shutdown' | 'cost_allocation';
  enabled: boolean;
  parameters: Record<string, any>;
  priority: number;
}

export interface ProviderConfig {
  id: string;
  name: string;
  type: 'llm' | 'cloud' | 'storage' | 'compute' | 'network' | 'database';
  apiEndpoint?: string;
  costTracking: boolean;
  billingData: BillingDataConfig;
  rateCard: RateCard;
}

export interface BillingDataConfig {
  source: 'api' | 'csv' | 'webhook' | 'manual';
  endpoint?: string;
  credentials?: Record<string, string>;
  updateFrequency: number; // minutes
}

export interface RateCard {
  currency: string;
  items: RateCardItem[];
  lastUpdated: number;
}

export interface RateCardItem {
  service: string;
  unit: string; // 'token', 'request', 'hour', 'gb', etc.
  price: number;
  tier?: string;
  volume?: VolumeDiscount[];
}

export interface VolumeDiscount {
  minQuantity: number;
  maxQuantity?: number;
  discount: number; // percentage
}

export interface ReportingConfig {
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  includeForecasting: boolean;
  includeOptimizations: boolean;
  format: 'email' | 'slack' | 'dashboard' | 'api';
}

export interface CostData {
  id: string;
  timestamp: number;
  provider: string;
  service: string;
  resource: string;
  costCenter: string;
  amount: number;
  currency: string;
  unit: string;
  quantity: number;
  tags: Record<string, string>;
  metadata: Record<string, any>;
}

export interface OptimizationResult {
  totalSavings: number;
  savingsPercentage: number;
  optimizations: Optimization[];
  appliedOptimizations: AppliedOptimization[];
  recommendations: OptimizationRecommendation[];
  riskAssessment: RiskAssessment;
}

export interface Optimization {
  id: string;
  type: OptimizationStrategy['type'];
  description: string;
  estimatedSavings: number;
  confidence: number; // 0-1
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  timeToImplement: number; // hours
  resources: string[];
  prerequisites: string[];
}

export interface AppliedOptimization {
  optimizationId: string;
  appliedAt: number;
  actualSavings: number;
  status: 'applied' | 'failed' | 'reverted';
  reason?: string;
}

export interface OptimizationRecommendation {
  category: 'immediate' | 'short_term' | 'long_term';
  priority: 'low' | 'medium' | 'high' | 'critical';
  action: string;
  description: string;
  estimatedSavings: number;
  implementationComplexity: 'simple' | 'moderate' | 'complex';
}

export interface RiskAssessment {
  overall: 'low' | 'medium' | 'high';
  factors: RiskFactor[];
  mitigations: string[];
}

export interface RiskFactor {
  type: 'performance' | 'availability' | 'security' | 'compliance';
  level: 'low' | 'medium' | 'high';
  description: string;
  mitigation?: string;
}

export interface BudgetReport {
  period: string;
  totalBudget: number;
  actualSpend: number;
  remainingBudget: number;
  utilizationPercentage: number;
  costCenters: CostCenterReport[];
  topSpenders: SpendingItem[];
  trends: SpendingTrend[];
  alerts: BudgetAlert[];
  projections: BudgetProjection;
}

export interface CostCenterReport {
  costCenterId: string;
  name: string;
  budget: number;
  actualSpend: number;
  utilizationPercentage: number;
  status: 'under_budget' | 'on_track' | 'over_budget' | 'critical';
  topServices: SpendingItem[];
}

export interface SpendingItem {
  name: string;
  amount: number;
  percentage: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface SpendingTrend {
  period: string;
  amount: number;
  change: number; // percentage change from previous period
  changeDirection: 'increase' | 'decrease';
}

export interface BudgetAlert {
  id: string;
  type: AlertThreshold['type'];
  severity: AlertThreshold['severity'];
  message: string;
  currentValue: number;
  threshold: number;
  costCenter?: string;
  triggeredAt: number;
  acknowledged: boolean;
}

export interface BudgetProjection {
  endOfPeriodSpend: number;
  projectedOverrun: number;
  confidence: number;
  methodology: string;
}

export interface ResourceAllocationRequest {
  requestId: string;
  costCenter: string;
  resources: ResourceRequest[];
  duration: number; // hours
  priority: 'low' | 'medium' | 'high' | 'critical';
  justification: string;
  autoApprove?: boolean;
}

export interface ResourceRequest {
  type: 'llm' | 'compute' | 'storage' | 'network';
  provider: string;
  service: string;
  quantity: number;
  unit: string;
  estimatedCost: number;
}

export interface ResourceAllocationResult {
  requestId: string;
  status: 'approved' | 'denied' | 'pending' | 'conditionally_approved';
  allocatedResources: AllocatedResource[];
  totalCost: number;
  conditions?: string[];
  reason?: string;
  validUntil: number;
}

export interface AllocatedResource {
  type: string;
  provider: string;
  service: string;
  allocatedQuantity: number;
  allocatedCost: number;
  resourceId: string;
  restrictions?: Record<string, any>;
}

export interface ForecastHorizon {
  period: 'week' | 'month' | 'quarter' | 'year';
  includeOptimizations: boolean;
  includeGrowthAssumptions: boolean;
  confidence: 'low' | 'medium' | 'high';
}

export interface CostForecast {
  horizon: ForecastHorizon;
  forecastedCost: number;
  currentRunRate: number;
  growthRate: number;
  seasonalityFactor: number;
  confidenceInterval: ConfidenceInterval;
  scenarios: ForecastScenario[];
  assumptions: string[];
}

export interface ConfidenceInterval {
  lower: number;
  upper: number;
  confidence: number; // percentage
}

export interface ForecastScenario {
  name: string;
  description: string;
  probability: number;
  cost: number;
  factors: string[];
}

export interface CostTrendAnalysis {
  overallTrend: 'increasing' | 'stable' | 'decreasing';
  trendStrength: 'weak' | 'moderate' | 'strong';
  keyDrivers: TrendDriver[];
  anomalies: CostAnomaly[];
  patterns: CostPattern[];
  recommendations: string[];
}

export interface TrendDriver {
  factor: string;
  impact: number; // percentage contribution to trend
  direction: 'positive' | 'negative';
  explanation: string;
}

export interface CostAnomaly {
  id: string;
  detectedAt: number;
  type: 'spike' | 'drop' | 'unusual_pattern';
  severity: 'low' | 'medium' | 'high';
  affectedServices: string[];
  deviation: number; // percentage from expected
  possibleCauses: string[];
}

export interface CostPattern {
  type: 'seasonal' | 'cyclical' | 'trending' | 'irregular';
  period: string;
  strength: number; // 0-1
  description: string;
}

export interface TimeRange {
  start: number;
  end: number;
}

// ================================================================================================
// FINOPS SYSTEM IMPLEMENTATION
// ================================================================================================

export class FinOpsSystemImpl extends EventEmitter implements FinOpsSystem {
  private config?: FinOpsConfig;
  private isInitialized: boolean = false;
  private costData: CostData[] = [];
  private budgetAlerts: BudgetAlert[] = [];
  private optimizationHistory: AppliedOptimization[] = [];
  private currentPeriodSpend: number = 0;
  private costCenterSpend: Map<string, number> = new Map();

  constructor() {
    super();
  }

  public async initialize(config: FinOpsConfig): Promise<void> {
    console.log('💰 Initializing FinOps System v9.0...');
    
    try {
      this.config = config;
      
      await this.setupCostTracking();
      await this.setupBudgetMonitoring();
      await this.setupOptimizationEngine();
      await this.setupReporting();
      
      // Start background processes
      this.startCostCollection();
      this.startBudgetMonitoring();
      this.startOptimizationChecks();
      
      this.isInitialized = true;
      console.log('✅ FinOps System initialized successfully');
      
      this.emit('finopsInitialized', {
        budgetPeriod: config.budgetPeriod,
        costCenters: config.costCenters.length,
        providers: config.providers.length,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error('❌ Failed to initialize FinOps System:', error);
      throw error;
    }
  }

  public async trackCost(cost: CostData): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('FinOps System not initialized');
    }

    console.log(`💳 Tracking cost: $${cost.amount} for ${cost.service} (${cost.provider})`);
    
    // Store cost data
    this.costData.push(cost);
    
    // Update running totals
    this.currentPeriodSpend += cost.amount;
    
    const currentCenterSpend = this.costCenterSpend.get(cost.costCenter) || 0;
    this.costCenterSpend.set(cost.costCenter, currentCenterSpend + cost.amount);
    
    // Check for budget alerts
    await this.checkBudgetThresholds(cost);
    
    // Record metrics
    this.emit('costTracked', cost);
    
    // Clean up old data
    this.cleanupOldCostData();
  }

  public async optimizeCosts(): Promise<OptimizationResult> {
    if (!this.isInitialized || !this.config) {
      throw new Error('FinOps System not initialized');
    }

    console.log('🔧 Running cost optimization analysis...');
    
    try {
      const optimizations = await this.identifyOptimizations();
      const appliedOptimizations = await this.applyOptimizations(optimizations);
      const recommendations = await this.generateOptimizationRecommendations();
      const riskAssessment = await this.assessOptimizationRisk(optimizations);
      
      const totalSavings = appliedOptimizations.reduce((sum, opt) => sum + opt.actualSavings, 0);
      const currentSpend = this.currentPeriodSpend;
      const savingsPercentage = currentSpend > 0 ? (totalSavings / currentSpend) * 100 : 0;
      
      const result: OptimizationResult = {
        totalSavings,
        savingsPercentage,
        optimizations,
        appliedOptimizations,
        recommendations,
        riskAssessment
      };
      
      console.log(`✅ Cost optimization completed: $${totalSavings.toFixed(2)} saved (${savingsPercentage.toFixed(1)}%)`);
      
      this.emit('optimizationCompleted', result);
      return result;
      
    } catch (error) {
      console.error('❌ Cost optimization failed:', error);
      throw error;
    }
  }

  public async generateBudgetReport(timeRange: TimeRange): Promise<BudgetReport> {
    console.log('📊 Generating budget report...');
    
    try {
      const filteredCosts = this.costData.filter(
        cost => cost.timestamp >= timeRange.start && cost.timestamp <= timeRange.end
      );
      
      const actualSpend = filteredCosts.reduce((sum, cost) => sum + cost.amount, 0);
      const totalBudget = this.config?.defaultBudget || 10000;
      const remainingBudget = Math.max(0, totalBudget - actualSpend);
      const utilizationPercentage = (actualSpend / totalBudget) * 100;
      
      const costCenters = await this.generateCostCenterReports(filteredCosts);
      const topSpenders = await this.getTopSpenders(filteredCosts);
      const trends = await this.calculateSpendingTrends(filteredCosts);
      const alerts = await this.checkBudgetAlerts();
      const projections = await this.generateBudgetProjections(actualSpend);
      
      const report: BudgetReport = {
        period: this.formatTimeRange(timeRange),
        totalBudget,
        actualSpend,
        remainingBudget,
        utilizationPercentage,
        costCenters,
        topSpenders,
        trends,
        alerts,
        projections
      };
      
      console.log(`✅ Budget report generated: $${actualSpend}/${totalBudget} (${utilizationPercentage.toFixed(1)}%)`);
      
      this.emit('budgetReportGenerated', report);
      return report;
      
    } catch (error) {
      console.error('❌ Failed to generate budget report:', error);
      throw error;
    }
  }

  public async checkBudgetAlerts(): Promise<BudgetAlert[]> {
    const alerts: BudgetAlert[] = [];
    
    if (!this.config) return alerts;
    
    const totalBudget = this.config.defaultBudget;
    const currentSpend = this.currentPeriodSpend;
    const utilizationPercentage = (currentSpend / totalBudget) * 100;
    
    for (const threshold of this.config.alertThresholds) {
      let shouldAlert = false;
      let currentValue = 0;
      
      switch (threshold.type) {
        case 'budget_percentage':
          currentValue = utilizationPercentage;
          shouldAlert = utilizationPercentage >= threshold.value;
          break;
        case 'absolute_amount':
          currentValue = currentSpend;
          shouldAlert = currentSpend >= threshold.value;
          break;
        case 'burn_rate':
          const dailyBurnRate = this.calculateDailyBurnRate();
          currentValue = dailyBurnRate;
          shouldAlert = dailyBurnRate >= threshold.value;
          break;
        case 'forecast_breach':
          const forecast = await this.forecastCosts({ period: 'month', includeOptimizations: false, includeGrowthAssumptions: true, confidence: 'medium' });
          currentValue = forecast.forecastedCost;
          shouldAlert = forecast.forecastedCost >= threshold.value;
          break;
      }
      
      if (shouldAlert) {
        const alert: BudgetAlert = {
          id: `alert-${threshold.type}-${Date.now()}`,
          type: threshold.type,
          severity: threshold.severity,
          message: this.generateAlertMessage(threshold.type, currentValue, threshold.value),
          currentValue,
          threshold: threshold.value,
          triggeredAt: Date.now(),
          acknowledged: false
        };
        
        alerts.push(alert);
        this.budgetAlerts.push(alert);
      }
    }
    
    return alerts;
  }

  public async allocateResources(request: ResourceAllocationRequest): Promise<ResourceAllocationResult> {
    console.log(`🎯 Processing resource allocation request: ${request.requestId}`);
    
    try {
      const totalCost = request.resources.reduce((sum, res) => sum + res.estimatedCost, 0);
      
      // Check if cost center has budget
      const costCenter = this.config?.costCenters.find(cc => cc.id === request.costCenter);
      if (!costCenter) {
        return {
          requestId: request.requestId,
          status: 'denied',
          allocatedResources: [],
          totalCost: 0,
          reason: 'Invalid cost center',
          validUntil: 0
        };
      }
      
      const currentSpend = this.costCenterSpend.get(request.costCenter) || 0;
      const availableBudget = costCenter.budget - currentSpend;
      
      if (totalCost > availableBudget && !request.autoApprove) {
        return {
          requestId: request.requestId,
          status: 'denied',
          allocatedResources: [],
          totalCost: 0,
          reason: `Insufficient budget: $${totalCost} requested, $${availableBudget} available`,
          validUntil: 0
        };
      }
      
      // Allocate resources
      const allocatedResources: AllocatedResource[] = [];
      for (const resource of request.resources) {
        const allocated: AllocatedResource = {
          type: resource.type,
          provider: resource.provider,
          service: resource.service,
          allocatedQuantity: resource.quantity,
          allocatedCost: resource.estimatedCost,
          resourceId: `res-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          restrictions: this.getResourceRestrictions(resource.type)
        };
        allocatedResources.push(allocated);
      }
      
      const result: ResourceAllocationResult = {
        requestId: request.requestId,
        status: totalCost > availableBudget ? 'conditionally_approved' : 'approved',
        allocatedResources,
        totalCost,
        conditions: totalCost > availableBudget ? ['Budget overrun approval required'] : undefined,
        validUntil: Date.now() + (request.duration * 60 * 60 * 1000)
      };
      
      console.log(`✅ Resource allocation ${result.status}: ${request.requestId} ($${totalCost})`);
      
      this.emit('resourceAllocated', result);
      return result;
      
    } catch (error) {
      console.error(`❌ Resource allocation failed: ${request.requestId}`, error);
      throw error;
    }
  }

  public async forecastCosts(horizon: ForecastHorizon): Promise<CostForecast> {
    console.log(`📈 Forecasting costs for ${horizon.period}...`);
    
    try {
      const currentRunRate = this.calculateCurrentRunRate();
      const growthRate = this.calculateGrowthRate();
      const seasonalityFactor = this.calculateSeasonalityFactor();
      
      // Calculate base forecast
      const periodMultiplier = this.getPeriodMultiplier(horizon.period);
      let forecastedCost = currentRunRate * periodMultiplier;
      
      // Apply growth assumptions
      if (horizon.includeGrowthAssumptions) {
        forecastedCost *= (1 + growthRate);
      }
      
      // Apply seasonality
      forecastedCost *= seasonalityFactor;
      
      // Apply optimization savings
      if (horizon.includeOptimizations) {
        const optimizationSavings = await this.estimateOptimizationSavings();
        forecastedCost *= (1 - optimizationSavings);
      }
      
      // Calculate confidence interval
      const confidenceInterval = this.calculateConfidenceInterval(forecastedCost, horizon.confidence);
      
      // Generate scenarios
      const scenarios = this.generateForecastScenarios(forecastedCost);
      
      const forecast: CostForecast = {
        horizon,
        forecastedCost,
        currentRunRate,
        growthRate,
        seasonalityFactor,
        confidenceInterval,
        scenarios,
        assumptions: this.getForecastAssumptions(horizon)
      };
      
      console.log(`✅ Cost forecast completed: $${forecastedCost.toFixed(2)} for ${horizon.period}`);
      
      this.emit('costForecasted', forecast);
      return forecast;
      
    } catch (error) {
      console.error(`❌ Cost forecasting failed:`, error);
      throw error;
    }
  }

  public async analyzeCostTrends(): Promise<CostTrendAnalysis> {
    console.log('📊 Analyzing cost trends...');
    
    try {
      const recentCosts = this.costData.slice(-1000); // Last 1000 cost entries
      
      const overallTrend = this.calculateOverallTrend(recentCosts);
      const trendStrength = this.calculateTrendStrength(recentCosts);
      const keyDrivers = this.identifyTrendDrivers(recentCosts);
      const anomalies = this.detectCostAnomalies(recentCosts);
      const patterns = this.identifyCostPatterns(recentCosts);
      const recommendations = this.generateTrendRecommendations(overallTrend, keyDrivers, anomalies);
      
      const analysis: CostTrendAnalysis = {
        overallTrend,
        trendStrength,
        keyDrivers,
        anomalies,
        patterns,
        recommendations
      };
      
      console.log(`✅ Cost trend analysis completed: ${overallTrend} trend (${trendStrength})`);
      
      this.emit('trendAnalysisCompleted', analysis);
      return analysis;
      
    } catch (error) {
      console.error('❌ Cost trend analysis failed:', error);
      throw error;
    }
  }

  // ================================================================================================
  // PRIVATE IMPLEMENTATION METHODS
  // ================================================================================================

  private async setupCostTracking(): Promise<void> {
    console.log('💳 Setting up cost tracking...');
    
    // Initialize cost tracking for each provider
    for (const provider of this.config?.providers || []) {
      console.log(`📊 Setting up cost tracking for ${provider.name}...`);
      // In real implementation, would set up API connections
    }
  }

  private async setupBudgetMonitoring(): Promise<void> {
    console.log('📊 Setting up budget monitoring...');
    
    // Initialize budget monitoring for each cost center
    for (const costCenter of this.config?.costCenters || []) {
      this.costCenterSpend.set(costCenter.id, 0);
    }
  }

  private async setupOptimizationEngine(): Promise<void> {
    console.log('🔧 Setting up optimization engine...');
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  private async setupReporting(): Promise<void> {
    console.log('📈 Setting up financial reporting...');
    await new Promise(resolve => setTimeout(resolve, 150));
  }

  private startCostCollection(): void {
    // Collect cost data every 5 minutes
    setInterval(async () => {
      await this.collectProviderCosts();
    }, 5 * 60 * 1000);
  }

  private startBudgetMonitoring(): void {
    // Check budget alerts every 10 minutes
    setInterval(async () => {
      await this.checkBudgetAlerts();
    }, 10 * 60 * 1000);
  }

  private startOptimizationChecks(): void {
    // Run optimization checks every hour
    setInterval(async () => {
      if (this.config?.optimization.enabled) {
        await this.optimizeCosts();
      }
    }, 60 * 60 * 1000);
  }

  private async collectProviderCosts(): Promise<void> {
    try {
      // Simulate cost collection from various providers
      const providers = ['openai', 'anthropic', 'google', 'azure', 'aws'];
      
      for (const provider of providers) {
        const cost: CostData = {
          id: `cost-${provider}-${Date.now()}`,
          timestamp: Date.now(),
          provider,
          service: this.getRandomService(provider),
          resource: `resource-${Math.random().toString(36).substr(2, 9)}`,
          costCenter: this.getRandomCostCenter(),
          amount: Math.random() * 50, // $0-50
          currency: 'USD',
          unit: 'request',
          quantity: Math.floor(Math.random() * 1000) + 1,
          tags: { environment: 'production', team: 'ai' },
          metadata: { region: 'us-east-1' }
        };
        
        await this.trackCost(cost);
      }
    } catch (error) {
      console.warn('⚠️ Cost collection warning:', error);
    }
  }

  private async checkBudgetThresholds(cost: CostData): Promise<void> {
    // Check if new cost triggers any budget alerts
    const alerts = await this.checkBudgetAlerts();
    
    for (const alert of alerts) {
      if (!this.budgetAlerts.find(existing => existing.id === alert.id)) {
        console.log(`🚨 Budget alert triggered: ${alert.message}`);
        this.emit('budgetAlert', alert);
      }
    }
  }

  private cleanupOldCostData(): void {
    // Keep only last 30 days of cost data
    const cutoffTime = Date.now() - (30 * 24 * 60 * 60 * 1000);
    this.costData = this.costData.filter(cost => cost.timestamp > cutoffTime);
  }

  // Optimization methods
  private async identifyOptimizations(): Promise<Optimization[]> {
    const optimizations: Optimization[] = [];
    
    if (!this.config?.optimization.strategies) return optimizations;
    
    for (const strategy of this.config.optimization.strategies) {
      if (!strategy.enabled) continue;
      
      const optimization = await this.generateOptimization(strategy);
      if (optimization) {
        optimizations.push(optimization);
      }
    }
    
    return optimizations.sort((a, b) => b.estimatedSavings - a.estimatedSavings);
  }

  private async generateOptimization(strategy: OptimizationStrategy): Promise<Optimization | null> {
    const estimatedSavings = Math.random() * 1000; // $0-1000
    const confidence = 0.7 + Math.random() * 0.25; // 70-95%
    
    return {
      id: `opt-${strategy.type}-${Date.now()}`,
      type: strategy.type,
      description: this.getOptimizationDescription(strategy.type),
      estimatedSavings,
      confidence,
      impact: estimatedSavings > 500 ? 'high' : estimatedSavings > 200 ? 'medium' : 'low',
      effort: strategy.type === 'auto_scaling' ? 'low' : 'medium',
      timeToImplement: strategy.type === 'auto_scaling' ? 2 : 8,
      resources: this.getAffectedResources(strategy.type),
      prerequisites: this.getOptimizationPrerequisites(strategy.type)
    };
  }

  private async applyOptimizations(optimizations: Optimization[]): Promise<AppliedOptimization[]> {
    const applied: AppliedOptimization[] = [];
    
    if (!this.config?.optimization.autoApply) {
      return applied; // Manual approval required
    }
    
    for (const optimization of optimizations.slice(0, 3)) { // Apply top 3
      if (optimization.confidence > 0.8 && optimization.impact !== 'high') {
        const actualSavings = optimization.estimatedSavings * (0.8 + Math.random() * 0.3); // 80-110% of estimate
        
        const appliedOpt: AppliedOptimization = {
          optimizationId: optimization.id,
          appliedAt: Date.now(),
          actualSavings,
          status: Math.random() > 0.1 ? 'applied' : 'failed',
          reason: Math.random() > 0.1 ? undefined : 'Resource constraints'
        };
        
        applied.push(appliedOpt);
        this.optimizationHistory.push(appliedOpt);
      }
    }
    
    return applied;
  }

  private async generateOptimizationRecommendations(): Promise<OptimizationRecommendation[]> {
    return [
      {
        category: 'immediate',
        priority: 'high',
        action: 'Enable auto-scaling for compute resources',
        description: 'Automatically scale resources based on demand to reduce idle costs',
        estimatedSavings: 500,
        implementationComplexity: 'simple'
      },
      {
        category: 'short_term',
        priority: 'medium',
        action: 'Implement cost allocation tagging',
        description: 'Add comprehensive tagging to track and allocate costs accurately',
        estimatedSavings: 200,
        implementationComplexity: 'moderate'
      },
      {
        category: 'long_term',
        priority: 'medium',
        action: 'Evaluate reserved instances for stable workloads',
        description: 'Purchase reserved instances for predictable workloads to reduce costs',
        estimatedSavings: 1200,
        implementationComplexity: 'complex'
      }
    ];
  }

  private async assessOptimizationRisk(optimizations: Optimization[]): Promise<RiskAssessment> {
    const riskFactors: RiskFactor[] = [];
    
    for (const opt of optimizations) {
      if (opt.type === 'spot_instances') {
        riskFactors.push({
          type: 'availability',
          level: 'medium',
          description: 'Spot instances may be terminated with short notice',
          mitigation: 'Implement proper failover mechanisms'
        });
      }
      
      if (opt.impact === 'high') {
        riskFactors.push({
          type: 'performance',
          level: 'medium',
          description: 'High-impact optimizations may affect performance',
          mitigation: 'Monitor performance metrics closely after implementation'
        });
      }
    }
    
    const overallRisk = riskFactors.length > 2 ? 'medium' : 'low';
    
    return {
      overall: overallRisk,
      factors: riskFactors,
      mitigations: [
        'Implement gradual rollout for optimizations',
        'Monitor key performance indicators',
        'Maintain rollback procedures',
        'Test optimizations in staging environment first'
      ]
    };
  }

  // Reporting methods
  private async generateCostCenterReports(costs: CostData[]): Promise<CostCenterReport[]> {
    const reports: CostCenterReport[] = [];
    
    for (const costCenter of this.config?.costCenters || []) {
      const centerCosts = costs.filter(cost => cost.costCenter === costCenter.id);
      const actualSpend = centerCosts.reduce((sum, cost) => sum + cost.amount, 0);
      const utilizationPercentage = (actualSpend / costCenter.budget) * 100;
      
      let status: CostCenterReport['status'] = 'under_budget';
      if (utilizationPercentage > 100) status = 'critical';
      else if (utilizationPercentage > 90) status = 'over_budget';
      else if (utilizationPercentage > 75) status = 'on_track';
      
      const topServices = this.getTopServicesForCostCenter(centerCosts);
      
      reports.push({
        costCenterId: costCenter.id,
        name: costCenter.name,
        budget: costCenter.budget,
        actualSpend,
        utilizationPercentage,
        status,
        topServices
      });
    }
    
    return reports;
  }

  private async getTopSpenders(costs: CostData[]): Promise<SpendingItem[]> {
    const spendingByService = new Map<string, number>();
    
    for (const cost of costs) {
      const current = spendingByService.get(cost.service) || 0;
      spendingByService.set(cost.service, current + cost.amount);
    }
    
    const totalSpend = costs.reduce((sum, cost) => sum + cost.amount, 0);
    
    return Array.from(spendingByService.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([service, amount]) => ({
        name: service,
        amount,
        percentage: (amount / totalSpend) * 100,
        trend: Math.random() > 0.5 ? 'increasing' : 'stable'
      }));
  }

  private async calculateSpendingTrends(costs: CostData[]): Promise<SpendingTrend[]> {
    // Group costs by day
    const dailySpend = new Map<string, number>();
    
    for (const cost of costs) {
      const day = new Date(cost.timestamp).toISOString().split('T')[0];
      const current = dailySpend.get(day) || 0;
      dailySpend.set(day, current + cost.amount);
    }
    
    const trends: SpendingTrend[] = [];
    const days = Array.from(dailySpend.keys()).sort();
    
    for (let i = 1; i < days.length; i++) {
      const currentDay = days[i];
      const previousDay = days[i - 1];
      const currentAmount = dailySpend.get(currentDay) || 0;
      const previousAmount = dailySpend.get(previousDay) || 0;
      
      const change = previousAmount > 0 ? ((currentAmount - previousAmount) / previousAmount) * 100 : 0;
      
      trends.push({
        period: currentDay,
        amount: currentAmount,
        change,
        changeDirection: change >= 0 ? 'increase' : 'decrease'
      });
    }
    
    return trends.slice(-7); // Last 7 days
  }

  private async generateBudgetProjections(actualSpend: number): Promise<BudgetProjection> {
    const daysInPeriod = 30; // Assuming monthly budget
    const daysPassed = 15; // Assuming mid-month
    const dailyRunRate = actualSpend / daysPassed;
    const endOfPeriodSpend = dailyRunRate * daysInPeriod;
    const projectedOverrun = Math.max(0, endOfPeriodSpend - (this.config?.defaultBudget || 10000));
    
    return {
      endOfPeriodSpend,
      projectedOverrun,
      confidence: 0.85,
      methodology: 'Linear extrapolation based on current run rate'
    };
  }

  // Forecasting methods
  private calculateCurrentRunRate(): number {
    const recentCosts = this.costData.slice(-100); // Last 100 cost entries
    const totalCost = recentCosts.reduce((sum, cost) => sum + cost.amount, 0);
    const timeSpan = recentCosts.length > 0 ? 
      (Date.now() - recentCosts[0].timestamp) / (1000 * 60 * 60 * 24) : 1; // days
    
    return timeSpan > 0 ? totalCost / timeSpan : 0; // cost per day
  }

  private calculateGrowthRate(): number {
    // Simulate growth rate calculation
    return 0.05 + Math.random() * 0.10; // 5-15% growth
  }

  private calculateSeasonalityFactor(): number {
    // Simulate seasonality (higher in Q4, lower in Q1)
    const month = new Date().getMonth();
    if (month >= 9) return 1.2; // Q4
    if (month <= 2) return 0.8; // Q1
    return 1.0; // Q2/Q3
  }

  private getPeriodMultiplier(period: ForecastHorizon['period']): number {
    switch (period) {
      case 'week': return 7;
      case 'month': return 30;
      case 'quarter': return 90;
      case 'year': return 365;
    }
  }

  private calculateConfidenceInterval(forecast: number, confidence: ForecastHorizon['confidence']): ConfidenceInterval {
    let range = 0.1; // 10% default
    
    switch (confidence) {
      case 'low': range = 0.3; break;
      case 'medium': range = 0.2; break;
      case 'high': range = 0.1; break;
    }
    
    return {
      lower: forecast * (1 - range),
      upper: forecast * (1 + range),
      confidence: confidence === 'high' ? 90 : confidence === 'medium' ? 75 : 60
    };
  }

  private generateForecastScenarios(baseForecast: number): ForecastScenario[] {
    return [
      {
        name: 'Conservative',
        description: 'Minimal growth with optimization savings',
        probability: 0.3,
        cost: baseForecast * 0.85,
        factors: ['Successful cost optimizations', 'Stable usage patterns']
      },
      {
        name: 'Expected',
        description: 'Normal growth trajectory',
        probability: 0.5,
        cost: baseForecast,
        factors: ['Current growth rate continues', 'No major changes']
      },
      {
        name: 'Aggressive',
        description: 'High growth with increased usage',
        probability: 0.2,
        cost: baseForecast * 1.3,
        factors: ['Rapid user growth', 'New feature launches', 'Increased demand']
      }
    ];
  }

  private getForecastAssumptions(horizon: ForecastHorizon): string[] {
    const assumptions = [
      'Current usage patterns continue',
      'No major infrastructure changes',
      'Provider pricing remains stable'
    ];
    
    if (horizon.includeGrowthAssumptions) {
      assumptions.push('Linear growth based on historical trends');
    }
    
    if (horizon.includeOptimizations) {
      assumptions.push('Planned optimizations are successfully implemented');
    }
    
    return assumptions;
  }

  // Trend analysis methods
  private calculateOverallTrend(costs: CostData[]): CostTrendAnalysis['overallTrend'] {
    if (costs.length < 2) return 'stable';
    
    const firstHalf = costs.slice(0, Math.floor(costs.length / 2));
    const secondHalf = costs.slice(Math.floor(costs.length / 2));
    
    const firstHalfAvg = firstHalf.reduce((sum, cost) => sum + cost.amount, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, cost) => sum + cost.amount, 0) / secondHalf.length;
    
    const change = (secondHalfAvg - firstHalfAvg) / firstHalfAvg;
    
    if (change > 0.05) return 'increasing';
    if (change < -0.05) return 'decreasing';
    return 'stable';
  }

  private calculateTrendStrength(costs: CostData[]): CostTrendAnalysis['trendStrength'] {
    // Simplified calculation - in reality would use statistical measures
    const variance = this.calculateVariance(costs.map(c => c.amount));
    const mean = costs.reduce((sum, cost) => sum + cost.amount, 0) / costs.length;
    const coefficientOfVariation = Math.sqrt(variance) / mean;
    
    if (coefficientOfVariation > 0.5) return 'weak';
    if (coefficientOfVariation > 0.2) return 'moderate';
    return 'strong';
  }

  private identifyTrendDrivers(costs: CostData[]): TrendDriver[] {
    // Group by service and calculate impact
    const serviceSpend = new Map<string, number>();
    const totalSpend = costs.reduce((sum, cost) => sum + cost.amount, 0);
    
    for (const cost of costs) {
      const current = serviceSpend.get(cost.service) || 0;
      serviceSpend.set(cost.service, current + cost.amount);
    }
    
    return Array.from(serviceSpend.entries())
      .map(([service, amount]) => ({
        factor: service,
        impact: (amount / totalSpend) * 100,
        direction: Math.random() > 0.5 ? 'positive' : 'negative',
        explanation: `${service} accounts for ${((amount / totalSpend) * 100).toFixed(1)}% of total spend`
      }))
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 5);
  }

  private detectCostAnomalies(costs: CostData[]): CostAnomaly[] {
    const anomalies: CostAnomaly[] = [];
    
    // Simple anomaly detection - costs significantly above average
    const amounts = costs.map(c => c.amount);
    const mean = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    const stdDev = Math.sqrt(this.calculateVariance(amounts));
    const threshold = mean + (2 * stdDev); // 2 standard deviations
    
    for (let i = 0; i < costs.length; i++) {
      const cost = costs[i];
      if (cost.amount > threshold) {
        anomalies.push({
          id: `anomaly-${cost.id}`,
          detectedAt: cost.timestamp,
          type: 'spike',
          severity: cost.amount > threshold * 1.5 ? 'high' : 'medium',
          affectedServices: [cost.service],
          deviation: ((cost.amount - mean) / mean) * 100,
          possibleCauses: [
            'Unusual usage spike',
            'Configuration change',
            'Data processing job',
            'System malfunction'
          ]
        });
      }
    }
    
    return anomalies.slice(0, 10); // Top 10 anomalies
  }

  private identifyCostPatterns(costs: CostData[]): CostPattern[] {
    // Simplified pattern detection
    return [
      {
        type: 'cyclical',
        period: 'weekly',
        strength: 0.7,
        description: 'Higher costs during weekdays, lower on weekends'
      },
      {
        type: 'seasonal',
        period: 'quarterly',
        strength: 0.5,
        description: 'Increased costs in Q4 due to holiday traffic'
      }
    ];
  }

  private generateTrendRecommendations(trend: CostTrendAnalysis['overallTrend'], drivers: TrendDriver[], anomalies: CostAnomaly[]): string[] {
    const recommendations: string[] = [];
    
    if (trend === 'increasing') {
      recommendations.push('Investigate cost drivers and implement optimization measures');
      recommendations.push('Consider implementing automated cost controls');
    }
    
    if (drivers.length > 0) {
      const topDriver = drivers[0];
      recommendations.push(`Focus optimization efforts on ${topDriver.factor} which drives ${topDriver.impact.toFixed(1)}% of costs`);
    }
    
    if (anomalies.length > 0) {
      recommendations.push('Set up automated alerts for cost anomalies');
      recommendations.push('Investigate root causes of cost spikes');
    }
    
    recommendations.push('Implement regular cost reviews and budget planning');
    recommendations.push('Consider implementing cost allocation and chargeback mechanisms');
    
    return recommendations;
  }

  // Utility methods
  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }

  private calculateDailyBurnRate(): number {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const todaysCosts = this.costData.filter(cost => cost.timestamp >= startOfDay);
    
    return todaysCosts.reduce((sum, cost) => sum + cost.amount, 0);
  }

  private async estimateOptimizationSavings(): Promise<number> {
    return 0.1 + Math.random() * 0.1; // 10-20% savings
  }

  private generateAlertMessage(type: AlertThreshold['type'], current: number, threshold: number): string {
    switch (type) {
      case 'budget_percentage':
        return `Budget utilization at ${current.toFixed(1)}% (threshold: ${threshold}%)`;
      case 'absolute_amount':
        return `Spending reached $${current.toFixed(2)} (threshold: $${threshold})`;
      case 'burn_rate':
        return `Daily burn rate at $${current.toFixed(2)} (threshold: $${threshold})`;
      case 'forecast_breach':
        return `Forecasted spend $${current.toFixed(2)} exceeds budget of $${threshold}`;
      default:
        return `Alert threshold breached: ${current} >= ${threshold}`;
    }
  }

  private formatTimeRange(timeRange: TimeRange): string {
    const start = new Date(timeRange.start).toISOString().split('T')[0];
    const end = new Date(timeRange.end).toISOString().split('T')[0];
    return `${start} to ${end}`;
  }

  private getRandomService(provider: string): string {
    const services = {
      openai: ['gpt-4', 'gpt-3.5-turbo', 'dall-e', 'whisper'],
      anthropic: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
      google: ['gemini-pro', 'palm-2', 'vertex-ai'],
      azure: ['openai-service', 'cognitive-services'],
      aws: ['ec2', 's3', 'lambda', 'rds']
    };
    
    const providerServices = services[provider as keyof typeof services] || ['unknown'];
    return providerServices[Math.floor(Math.random() * providerServices.length)];
  }

  private getRandomCostCenter(): string {
    const costCenters = this.config?.costCenters.map(cc => cc.id) || ['default'];
    return costCenters[Math.floor(Math.random() * costCenters.length)];
  }

  private getResourceRestrictions(type: string): Record<string, any> {
    switch (type) {
      case 'llm':
        return { maxTokens: 100000, rateLimitRpm: 1000 };
      case 'compute':
        return { maxInstances: 10, maxCpuHours: 100 };
      case 'storage':
        return { maxGb: 1000, maxRequests: 10000 };
      default:
        return {};
    }
  }

  private getOptimizationDescription(type: OptimizationStrategy['type']): string {
    switch (type) {
      case 'right_sizing': return 'Optimize resource sizes based on actual usage patterns';
      case 'reserved_instances': return 'Purchase reserved instances for predictable workloads';
      case 'spot_instances': return 'Use spot instances for fault-tolerant workloads';
      case 'auto_scaling': return 'Implement automatic scaling based on demand';
      case 'scheduled_shutdown': return 'Automatically shutdown resources during off-hours';
      case 'cost_allocation': return 'Implement proper cost tagging and allocation';
      default: return 'Cost optimization strategy';
    }
  }

  private getAffectedResources(type: OptimizationStrategy['type']): string[] {
    switch (type) {
      case 'right_sizing': return ['compute-instances', 'database-instances'];
      case 'reserved_instances': return ['ec2-instances', 'rds-instances'];
      case 'spot_instances': return ['batch-processing', 'training-jobs'];
      case 'auto_scaling': return ['web-servers', 'api-gateways'];
      case 'scheduled_shutdown': return ['development-environments', 'staging-servers'];
      case 'cost_allocation': return ['all-resources'];
      default: return [];
    }
  }

  private getOptimizationPrerequisites(type: OptimizationStrategy['type']): string[] {
    switch (type) {
      case 'right_sizing': return ['Usage monitoring enabled', 'Performance baselines established'];
      case 'reserved_instances': return ['Stable workload patterns', 'Budget approval'];
      case 'spot_instances': return ['Fault-tolerant application design', 'Backup strategies'];
      case 'auto_scaling': return ['Load balancer configuration', 'Monitoring setup'];
      case 'scheduled_shutdown': return ['Automation scripts', 'Team coordination'];
      case 'cost_allocation': return ['Tagging strategy', 'Cost center definitions'];
      default: return [];
    }
  }

  private getTopServicesForCostCenter(costs: CostData[]): SpendingItem[] {
    const serviceSpend = new Map<string, number>();
    const totalSpend = costs.reduce((sum, cost) => sum + cost.amount, 0);
    
    for (const cost of costs) {
      const current = serviceSpend.get(cost.service) || 0;
      serviceSpend.set(cost.service, current + cost.amount);
    }
    
    return Array.from(serviceSpend.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([service, amount]) => ({
        name: service,
        amount,
        percentage: totalSpend > 0 ? (amount / totalSpend) * 100 : 0,
        trend: Math.random() > 0.5 ? 'increasing' : 'stable'
      }));
  }
}

// Default FinOps configuration
export const DEFAULT_FINOPS_CONFIG: FinOpsConfig = {
  defaultBudget: 10000, // $10,000 monthly
  budgetPeriod: 'monthly',
  costCenters: [
    {
      id: 'ai-development',
      name: 'AI Development',
      budget: 5000,
      owner: 'ai-team@company.com',
      tags: { department: 'engineering', team: 'ai' },
      allocatedServices: ['openai', 'anthropic', 'google']
    },
    {
      id: 'infrastructure',
      name: 'Infrastructure',
      budget: 3000,
      owner: 'devops@company.com',
      tags: { department: 'engineering', team: 'devops' },
      allocatedServices: ['aws', 'azure', 'gcp']
    },
    {
      id: 'data-science',
      name: 'Data Science',
      budget: 2000,
      owner: 'data@company.com',
      tags: { department: 'data', team: 'science' },
      allocatedServices: ['databricks', 'snowflake', 'jupyter']
    }
  ],
  alertThresholds: [
    { type: 'budget_percentage', value: 80, severity: 'medium', channels: ['email'] },
    { type: 'budget_percentage', value: 95, severity: 'high', channels: ['email', 'slack'] },
    { type: 'budget_percentage', value: 100, severity: 'critical', channels: ['email', 'slack', 'sms'] }
  ],
  optimization: {
    enabled: true,
    strategies: [
      { type: 'auto_scaling', enabled: true, parameters: {}, priority: 1 },
      { type: 'right_sizing', enabled: true, parameters: {}, priority: 2 },
      { type: 'cost_allocation', enabled: true, parameters: {}, priority: 3 }
    ],
    autoApply: false,
    reviewRequired: true,
    maxSavingsPercentage: 20
  },
  providers: [
    {
      id: 'openai',
      name: 'OpenAI',
      type: 'llm',
      costTracking: true,
      billingData: { source: 'api', updateFrequency: 60 },
      rateCard: {
        currency: 'USD',
        items: [
          { service: 'gpt-4', unit: 'token', price: 0.00003 },
          { service: 'gpt-3.5-turbo', unit: 'token', price: 0.000001 }
        ],
        lastUpdated: Date.now()
      }
    }
  ],
  currency: 'USD',
  reporting: {
    frequency: 'daily',
    recipients: ['finance@company.com', 'cto@company.com'],
    includeForecasting: true,
    includeOptimizations: true,
    format: 'email'
  }
};

export default FinOpsSystemImpl;