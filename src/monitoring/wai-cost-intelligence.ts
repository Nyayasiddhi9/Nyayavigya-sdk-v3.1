/**
 * WAI Cost Intelligence System v8.0
 * Budget controls, spend analytics, and intelligent cost management
 */

import { EventEmitter } from 'events';
import { randomUUID as uuidv4 } from 'crypto';

// ================================================================================================
// COST INTELLIGENCE SYSTEM V8.0
// ================================================================================================

export interface CostBudget {
  id: string;
  name: string;
  platform: string;
  userId: string;
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'project';
  amount: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'INR' | 'JPY';
  period: {
    startDate: Date;
    endDate: Date;
    resetAutomatic: boolean;
  };
  allocation: {
    llmProviders: number; // Percentage
    agents: number;
    integrations: number;
    storage: number;
    compute: number;
    other: number;
  };
  alerts: {
    enabled: boolean;
    thresholds: number[]; // Percentage thresholds [50, 75, 90, 100]
    notifications: string[]; // email, slack, webhook
  };
  spent: number;
  remaining: number;
  projectedSpend: number;
  status: 'active' | 'exceeded' | 'suspended' | 'completed';
  createdAt: Date;
  lastUpdated: Date;
}

export interface CostEntry {
  id: string;
  budgetId?: string;
  platform: string;
  userId: string;
  service: 'llm' | 'agent' | 'integration' | 'storage' | 'compute' | 'bandwidth' | 'other';
  provider: string;
  operation: string;
  details: {
    tokens?: number;
    requests?: number;
    duration?: number;
    dataSize?: number;
    resources?: any;
  };
  cost: {
    amount: number;
    currency: string;
    unit: 'per_token' | 'per_request' | 'per_minute' | 'per_gb' | 'per_hour' | 'fixed';
    breakdown?: { [key: string]: number };
  };
  timestamp: Date;
  metadata: {
    requestId?: string;
    sessionId?: string;
    model?: string;
    region?: string;
  };
}

export interface CostOptimization {
  id: string;
  type: 'provider_switch' | 'model_downgrade' | 'caching' | 'batching' | 'resource_scaling' | 'scheduling';
  title: string;
  description: string;
  currentCost: {
    amount: number;
    period: string;
  };
  optimizedCost: {
    amount: number;
    period: string;
  };
  savings: {
    amount: number;
    percentage: number;
  };
  implementation: {
    complexity: 'low' | 'medium' | 'high';
    effort: string;
    requirements: string[];
    risks: string[];
    timeline: string;
  };
  impact: {
    performance: number; // -100 to 100 (negative is degradation)
    reliability: number;
    userExperience: number;
    features: string[]; // Affected features
  };
  recommendation: {
    priority: 'low' | 'medium' | 'high' | 'critical';
    confidence: number; // 0-100
    roi: number; // Return on investment
    paybackPeriod: string;
  };
  status: 'identified' | 'proposed' | 'approved' | 'implementing' | 'completed' | 'rejected';
  generatedAt: Date;
}

export interface CostForecast {
  id: string;
  platform: string;
  userId?: string;
  timeframe: 'week' | 'month' | 'quarter' | 'year';
  prediction: {
    amount: number;
    currency: string;
    confidence: number; // 0-100
    trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  };
  breakdown: {
    llmProviders: { [provider: string]: number };
    services: { [service: string]: number };
    regions: { [region: string]: number };
  };
  factors: {
    historicalGrowth: number;
    seasonality: number;
    userGrowth: number;
    featureAdoption: number;
    marketTrends: number;
  };
  scenarios: {
    optimistic: number;
    realistic: number;
    pessimistic: number;
  };
  recommendations: string[];
  generatedAt: Date;
  validUntil: Date;
}

export interface CostAlert {
  id: string;
  budgetId: string;
  type: 'threshold_exceeded' | 'budget_depleted' | 'anomaly_detected' | 'forecast_warning';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  details: {
    currentSpend: number;
    budgetAmount: number;
    percentage: number;
    timeRemaining: string;
    projectedOverrun?: number;
  };
  actions: {
    suggested: string[];
    automatic: string[];
    taken: string[];
  };
  timestamp: Date;
  acknowledged: boolean;
  resolvedAt?: Date;
}

export class WAICostIntelligenceSystem extends EventEmitter {
  public readonly version = '8.0.0';
  
  private budgets: Map<string, CostBudget> = new Map();
  private costEntries: CostEntry[] = [];
  private optimizations: Map<string, CostOptimization> = new Map();
  private forecasts: Map<string, CostForecast> = new Map();
  private alerts: Map<string, CostAlert> = new Map();
  private providerRates: Map<string, any> = new Map();
  private optimizationRules: Map<string, any> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private forecastInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.initializeCostIntelligenceSystem();
  }

  private async initializeCostIntelligenceSystem(): Promise<void> {
    console.log('💰 Initializing WAI Cost Intelligence System v8.0...');
    
    await this.setupProviderRates();
    await this.setupOptimizationRules();
    await this.startCostMonitoring();
    await this.startForecastGeneration();
    
    console.log('✅ Cost intelligence system initialized with comprehensive budget controls');
  }

  // ================================================================================================
  // PROVIDER RATES SETUP
  // ================================================================================================

  private async setupProviderRates(): Promise<void> {
    console.log('💸 Setting up provider cost rates...');
    
    const providerRates = {
      'kimi-k2': {
        name: 'KIMI K2',
        type: 'free_tier',
        models: {
          'kimi-free': {
            inputCost: 0.0000, // Free tier
            outputCost: 0.0000,
            unit: 'per_token',
            limits: { daily: 1000000, monthly: 25000000 }
          }
        },
        priority: 1,
        savings: 95
      },

      'deepseek-v3': {
        name: 'DeepSeek V3',
        type: 'free_tier',
        models: {
          'deepseek-coder': {
            inputCost: 0.0000, // Free tier for coding
            outputCost: 0.0000,
            unit: 'per_token',
            limits: { daily: 500000, monthly: 10000000 }
          }
        },
        priority: 2,
        savings: 90
      },

      'manus-ai': {
        name: 'Manus AI / OpenManus',
        type: 'freemium',
        models: {
          'manus-creative': {
            inputCost: 0.0001,
            outputCost: 0.0002,
            unit: 'per_token',
            limits: { daily: 100000, monthly: 2000000 }
          }
        },
        priority: 3,
        savings: 85
      },

      'openai': {
        name: 'OpenAI',
        type: 'paid',
        models: {
          'gpt-4o': {
            inputCost: 0.005,
            outputCost: 0.015,
            unit: 'per_token'
          },
          'gpt-4-turbo': {
            inputCost: 0.01,
            outputCost: 0.03,
            unit: 'per_token'
          },
          'gpt-3.5-turbo': {
            inputCost: 0.0015,
            outputCost: 0.002,
            unit: 'per_token'
          }
        },
        priority: 7,
        savings: 0
      },

      'anthropic': {
        name: 'Anthropic',
        type: 'paid',
        models: {
          'claude-3-opus': {
            inputCost: 0.015,
            outputCost: 0.075,
            unit: 'per_token'
          },
          'claude-3-sonnet': {
            inputCost: 0.003,
            outputCost: 0.015,
            unit: 'per_token'
          }
        },
        priority: 8,
        savings: -10
      },

      'google': {
        name: 'Google Gemini',
        type: 'freemium',
        models: {
          'gemini-pro': {
            inputCost: 0.00025,
            outputCost: 0.0005,
            unit: 'per_token',
            limits: { daily: 1000000, monthly: 20000000 }
          }
        },
        priority: 4,
        savings: 75
      },

      'together-ai': {
        name: 'Together AI',
        type: 'competitive',
        models: {
          'llama-3-70b': {
            inputCost: 0.0009,
            outputCost: 0.0009,
            unit: 'per_token'
          }
        },
        priority: 5,
        savings: 50
      },

      'replicate': {
        name: 'Replicate',
        type: 'per_second',
        models: {
          'various': {
            inputCost: 0.0023,
            outputCost: 0.0023,
            unit: 'per_second'
          }
        },
        priority: 6,
        savings: 25
      }
    };

    Object.entries(providerRates).forEach(([key, rates]) => {
      this.providerRates.set(key, rates);
    });

    console.log(`✅ Configured rates for ${Object.keys(providerRates).length} providers`);
  }

  // ================================================================================================
  // OPTIMIZATION RULES SETUP
  // ================================================================================================

  private async setupOptimizationRules(): Promise<void> {
    console.log('⚡ Setting up cost optimization rules...');
    
    const optimizationRules = {
      'free-tier-first': {
        name: 'Prioritize Free Tier Models',
        description: 'Always try free tier models first before paid alternatives',
        condition: 'cost > 0 AND free_tier_available = true',
        action: 'route_to_free_tier',
        savings: 95,
        priority: 1
      },

      'smart-caching': {
        name: 'Intelligent Response Caching',
        description: 'Cache responses for similar requests to avoid duplicate API calls',
        condition: 'similarity_score > 0.9 AND cache_available = true',
        action: 'serve_from_cache',
        savings: 100,
        priority: 2
      },

      'batch-processing': {
        name: 'Batch Similar Requests',
        description: 'Group similar requests together for bulk processing discounts',
        condition: 'pending_requests > 5 AND provider_supports_batching = true',
        action: 'batch_requests',
        savings: 30,
        priority: 3
      },

      'off-peak-scheduling': {
        name: 'Off-Peak Resource Scheduling',
        description: 'Schedule non-urgent tasks during off-peak hours for better rates',
        condition: 'urgency = low AND current_hour IN off_peak_hours',
        action: 'schedule_off_peak',
        savings: 40,
        priority: 4
      },

      'model-downgrade': {
        name: 'Intelligent Model Selection',
        description: 'Use smaller models for simpler tasks that don\'t require full capability',
        condition: 'task_complexity = low AND cheaper_model_available = true',
        action: 'use_smaller_model',
        savings: 60,
        priority: 5
      },

      'regional-optimization': {
        name: 'Regional Cost Optimization',
        description: 'Route requests to most cost-effective regions',
        condition: 'latency_acceptable = true AND cheaper_region_available = true',
        action: 'route_to_cheaper_region',
        savings: 25,
        priority: 6
      }
    };

    Object.entries(optimizationRules).forEach(([key, rule]) => {
      this.optimizationRules.set(key, rule);
    });

    console.log(`✅ Configured ${Object.keys(optimizationRules).length} optimization rules`);
  }

  // ================================================================================================
  // BUDGET MANAGEMENT
  // ================================================================================================

  public async createBudget(config: Omit<CostBudget, 'id' | 'spent' | 'remaining' | 'projectedSpend' | 'status' | 'createdAt' | 'lastUpdated'>): Promise<CostBudget> {
    const budgetId = uuidv4();
    
    const budget: CostBudget = {
      id: budgetId,
      ...config,
      spent: 0,
      remaining: config.amount,
      projectedSpend: 0,
      status: 'active',
      createdAt: new Date(),
      lastUpdated: new Date()
    };

    // Validate allocation percentages sum to 100
    const totalAllocation = Object.values(budget.allocation).reduce((sum, val) => sum + val, 0);
    if (Math.abs(totalAllocation - 100) > 0.01) {
      throw new Error('Budget allocation percentages must sum to 100%');
    }

    this.budgets.set(budgetId, budget);
    this.emit('budget.created', budget);

    return budget;
  }

  public async updateBudgetSpend(budgetId: string, amount: number, service: string): Promise<void> {
    const budget = this.budgets.get(budgetId);
    if (!budget) {
      throw new Error(`Budget not found: ${budgetId}`);
    }

    budget.spent += amount;
    budget.remaining = Math.max(0, budget.amount - budget.spent);
    budget.lastUpdated = new Date();

    // Update projected spend
    budget.projectedSpend = this.calculateProjectedSpend(budget);

    // Check for threshold alerts
    const percentage = (budget.spent / budget.amount) * 100;
    
    if (budget.alerts.enabled) {
      for (const threshold of budget.alerts.thresholds) {
        if (percentage >= threshold && !this.hasRecentAlert(budgetId, threshold)) {
          await this.createCostAlert(budget, 'threshold_exceeded', threshold);
        }
      }
    }

    // Update budget status
    if (budget.spent >= budget.amount) {
      budget.status = 'exceeded';
      await this.createCostAlert(budget, 'budget_depleted', 100);
    }

    this.emit('budget.updated', budget);
  }

  private calculateProjectedSpend(budget: CostBudget): number {
    const now = new Date();
    const totalPeriodMs = budget.period.endDate.getTime() - budget.period.startDate.getTime();
    const elapsedMs = now.getTime() - budget.period.startDate.getTime();
    const remainingMs = budget.period.endDate.getTime() - now.getTime();

    if (remainingMs <= 0) {
      return budget.spent;
    }

    const elapsedRatio = elapsedMs / totalPeriodMs;
    const remainingRatio = remainingMs / totalPeriodMs;

    // Simple linear projection with growth factor
    const currentRate = budget.spent / Math.max(elapsedRatio, 0.01);
    const growthFactor = 1.1; // Assume 10% growth in usage
    
    return currentRate * growthFactor;
  }

  // ================================================================================================
  // COST TRACKING
  // ================================================================================================

  public async recordCost(entry: Omit<CostEntry, 'id' | 'timestamp'>): Promise<void> {
    const costEntry: CostEntry = {
      id: uuidv4(),
      timestamp: new Date(),
      ...entry
    };

    this.costEntries.push(costEntry);

    // Update associated budget
    if (entry.budgetId) {
      await this.updateBudgetSpend(entry.budgetId, entry.cost.amount, entry.service);
    }

    // Check for cost anomalies
    await this.checkCostAnomalies(costEntry);

    this.emit('cost.recorded', costEntry);
  }

  private async checkCostAnomalies(entry: CostEntry): Promise<void> {
    // Get recent costs for the same service/provider
    const recentEntries = this.costEntries
      .filter(e => 
        e.service === entry.service &&
        e.provider === entry.provider &&
        e.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      );

    if (recentEntries.length < 10) return; // Need enough data

    const costs = recentEntries.map(e => e.cost.amount);
    const average = costs.reduce((sum, cost) => sum + cost, 0) / costs.length;
    const stdDev = Math.sqrt(costs.reduce((sum, cost) => sum + Math.pow(cost - average, 2), 0) / costs.length);

    // Check if current cost is anomalous (3 standard deviations)
    if (Math.abs(entry.cost.amount - average) > 3 * stdDev) {
      const alertId = uuidv4();
      const alert: CostAlert = {
        id: alertId,
        budgetId: entry.budgetId || 'system',
        type: 'anomaly_detected',
        severity: entry.cost.amount > average ? 'warning' : 'info',
        message: `Unusual cost detected: $${entry.cost.amount.toFixed(4)} vs average $${average.toFixed(4)}`,
        details: {
          currentSpend: entry.cost.amount,
          budgetAmount: average,
          percentage: ((entry.cost.amount - average) / average) * 100,
          timeRemaining: '24h'
        },
        actions: {
          suggested: ['Review request details', 'Check provider pricing changes'],
          automatic: [],
          taken: []
        },
        timestamp: new Date(),
        acknowledged: false
      };

      this.alerts.set(alertId, alert);
      this.emit('cost.anomaly', alert);
    }
  }

  // ================================================================================================
  // COST OPTIMIZATION
  // ================================================================================================

  public async generateOptimizations(platform: string, userId?: string): Promise<CostOptimization[]> {
    console.log('⚡ Generating cost optimizations...');
    
    const optimizations: CostOptimization[] = [];

    // Analyze recent costs for patterns
    const recentCosts = this.getRecentCosts(platform, userId, 30); // Last 30 days
    
    if (recentCosts.length === 0) {
      return optimizations;
    }

    // Provider switching opportunities
    const providerOpt = await this.analyzeProviderSwitching(recentCosts);
    if (providerOpt) optimizations.push(providerOpt);

    // Caching opportunities
    const cachingOpt = await this.analyzeCachingOpportunities(recentCosts);
    if (cachingOpt) optimizations.push(cachingOpt);

    // Batching opportunities
    const batchingOpt = await this.analyzeBatchingOpportunities(recentCosts);
    if (batchingOpt) optimizations.push(batchingOpt);

    // Model selection optimization
    const modelOpt = await this.analyzeModelSelection(recentCosts);
    if (modelOpt) optimizations.push(modelOpt);

    // Store optimizations
    optimizations.forEach(opt => {
      this.optimizations.set(opt.id, opt);
    });

    this.emit('optimizations.generated', optimizations);
    return optimizations;
  }

  private async analyzeProviderSwitching(costs: CostEntry[]): Promise<CostOptimization | null> {
    const llmCosts = costs.filter(c => c.service === 'llm');
    if (llmCosts.length < 10) return null;

    const totalCost = llmCosts.reduce((sum, c) => sum + c.cost.amount, 0);
    const totalTokens = llmCosts.reduce((sum, c) => sum + (c.details.tokens || 0), 0);

    // Calculate potential savings by switching to free tiers
    const freeProviders = Array.from(this.providerRates.values())
      .filter(p => p.type === 'free_tier')
      .sort((a, b) => a.priority - b.priority);

    if (freeProviders.length === 0) return null;

    const bestFreeProvider = freeProviders[0];
    const potentialSavings = totalCost * 0.95; // 95% savings with free tier

    return {
      id: uuidv4(),
      type: 'provider_switch',
      title: 'Switch to Free Tier Providers',
      description: `Switch primary LLM usage to ${bestFreeProvider.name} and other free tier providers`,
      currentCost: { amount: totalCost, period: '30 days' },
      optimizedCost: { amount: totalCost - potentialSavings, period: '30 days' },
      savings: { amount: potentialSavings, percentage: 95 },
      implementation: {
        complexity: 'low',
        effort: '1-2 days',
        requirements: ['Update routing configuration', 'Test free tier limits'],
        risks: ['Rate limiting on free tiers', 'Potential quality differences'],
        timeline: 'Immediate'
      },
      impact: {
        performance: -5, // Slight performance impact
        reliability: -10, // Less reliability due to limits
        userExperience: 0,
        features: ['Smart routing', 'Fallback providers']
      },
      recommendation: {
        priority: 'high',
        confidence: 90,
        roi: 950, // 950% ROI
        paybackPeriod: 'Immediate'
      },
      status: 'identified',
      generatedAt: new Date()
    };
  }

  private async analyzeCachingOpportunities(costs: CostEntry[]): Promise<CostOptimization | null> {
    // Analyze for repetitive requests that could be cached
    const requests = costs.filter(c => c.metadata.requestId);
    
    if (requests.length < 50) return null;

    // Simulate cache analysis - in production, analyze actual request patterns
    const cacheableRequests = Math.floor(requests.length * 0.3); // 30% cacheable
    const cacheableCost = requests.slice(0, cacheableRequests).reduce((sum, c) => sum + c.cost.amount, 0);

    return {
      id: uuidv4(),
      type: 'caching',
      title: 'Implement Intelligent Response Caching',
      description: 'Cache responses for similar requests to eliminate duplicate API calls',
      currentCost: { amount: cacheableCost, period: '30 days' },
      optimizedCost: { amount: cacheableCost * 0.1, period: '30 days' },
      savings: { amount: cacheableCost * 0.9, percentage: 90 },
      implementation: {
        complexity: 'medium',
        effort: '1 week',
        requirements: ['Implement cache layer', 'Configure TTL policies', 'Add cache invalidation'],
        risks: ['Stale responses', 'Cache storage costs'],
        timeline: '1-2 weeks'
      },
      impact: {
        performance: 80, // Much faster cached responses
        reliability: 10,
        userExperience: 50,
        features: ['Response caching', 'TTL management']
      },
      recommendation: {
        priority: 'high',
        confidence: 85,
        roi: 800,
        paybackPeriod: '1 week'
      },
      status: 'identified',
      generatedAt: new Date()
    };
  }

  private async analyzeBatchingOpportunities(costs: CostEntry[]): Promise<CostOptimization | null> {
    // Look for opportunities to batch requests
    const batchableServices = costs.filter(c => c.service === 'llm' || c.service === 'integration');
    
    if (batchableServices.length < 20) return null;

    const batchSavings = batchableServices.reduce((sum, c) => sum + c.cost.amount, 0) * 0.3;

    return {
      id: uuidv4(),
      type: 'batching',
      title: 'Implement Request Batching',
      description: 'Group similar requests together for bulk processing discounts',
      currentCost: { amount: batchSavings / 0.3, period: '30 days' },
      optimizedCost: { amount: (batchSavings / 0.3) - batchSavings, period: '30 days' },
      savings: { amount: batchSavings, percentage: 30 },
      implementation: {
        complexity: 'medium',
        effort: '2 weeks',
        requirements: ['Implement batching queue', 'Configure batch sizes', 'Handle batch responses'],
        risks: ['Increased latency', 'Complexity in error handling'],
        timeline: '2-3 weeks'
      },
      impact: {
        performance: -20, // Increased latency
        reliability: 5,
        userExperience: -10,
        features: ['Request batching', 'Queue management']
      },
      recommendation: {
        priority: 'medium',
        confidence: 75,
        roi: 200,
        paybackPeriod: '4 weeks'
      },
      status: 'identified',
      generatedAt: new Date()
    };
  }

  private async analyzeModelSelection(costs: CostEntry[]): Promise<CostOptimization | null> {
    const llmCosts = costs.filter(c => c.service === 'llm' && c.metadata.model);
    
    if (llmCosts.length < 10) return null;

    // Analyze if simpler tasks are using expensive models
    const expensiveCosts = llmCosts.filter(c => c.cost.amount > 0.01);
    const potentialSavings = expensiveCosts.reduce((sum, c) => sum + c.cost.amount * 0.6, 0);

    return {
      id: uuidv4(),
      type: 'model_downgrade',
      title: 'Optimize Model Selection for Task Complexity',
      description: 'Use smaller, cheaper models for simple tasks that don\'t require full capabilities',
      currentCost: { amount: potentialSavings / 0.6, period: '30 days' },
      optimizedCost: { amount: (potentialSavings / 0.6) - potentialSavings, period: '30 days' },
      savings: { amount: potentialSavings, percentage: 60 },
      implementation: {
        complexity: 'low',
        effort: '3-5 days',
        requirements: ['Task complexity analysis', 'Model routing rules', 'Quality monitoring'],
        risks: ['Reduced quality for some tasks', 'Need for quality monitoring'],
        timeline: '1 week'
      },
      impact: {
        performance: 20, // Faster smaller models
        reliability: 0,
        userExperience: -5, // Slight quality reduction
        features: ['Intelligent model routing', 'Task analysis']
      },
      recommendation: {
        priority: 'medium',
        confidence: 80,
        roi: 400,
        paybackPeriod: '2 weeks'
      },
      status: 'identified',
      generatedAt: new Date()
    };
  }

  // ================================================================================================
  // COST FORECASTING
  // ================================================================================================

  private async startForecastGeneration(): Promise<void> {
    console.log('🔮 Starting cost forecasting...');
    
    this.forecastInterval = setInterval(async () => {
      await this.generateCostForecasts();
    }, 24 * 60 * 60 * 1000); // Daily forecasts
  }

  public async generateCostForecast(platform: string, timeframe: 'week' | 'month' | 'quarter' | 'year', userId?: string): Promise<CostForecast> {
    const forecastId = uuidv4();
    
    // Get historical data
    const historicalDays = timeframe === 'week' ? 30 : timeframe === 'month' ? 90 : timeframe === 'quarter' ? 365 : 730;
    const historicalCosts = this.getRecentCosts(platform, userId, historicalDays);

    if (historicalCosts.length === 0) {
      throw new Error('Insufficient historical data for forecasting');
    }

    // Calculate prediction
    const dailyAverage = this.calculateDailyAverage(historicalCosts);
    const growthRate = this.calculateGrowthRate(historicalCosts);
    const seasonality = this.calculateSeasonality(historicalCosts);

    const daysToForecast = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : timeframe === 'quarter' ? 90 : 365;
    const basePrediction = dailyAverage * daysToForecast;
    const growthAdjustment = basePrediction * (growthRate / 100);
    const seasonalityAdjustment = basePrediction * (seasonality / 100);

    const prediction = basePrediction + growthAdjustment + seasonalityAdjustment;

    // Calculate breakdown
    const breakdown = this.calculateCostBreakdown(historicalCosts);

    const forecast: CostForecast = {
      id: forecastId,
      platform,
      userId,
      timeframe,
      prediction: {
        amount: prediction,
        currency: 'USD',
        confidence: this.calculateConfidence(historicalCosts),
        trend: growthRate > 10 ? 'increasing' : growthRate < -10 ? 'decreasing' : 'stable'
      },
      breakdown,
      factors: {
        historicalGrowth: growthRate,
        seasonality,
        userGrowth: 15, // Assumed user growth
        featureAdoption: 20, // Assumed feature adoption
        marketTrends: 5 // Assumed market trends
      },
      scenarios: {
        optimistic: prediction * 0.8,
        realistic: prediction,
        pessimistic: prediction * 1.3
      },
      recommendations: this.generateForecastRecommendations(prediction, dailyAverage),
      generatedAt: new Date(),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Valid for 1 week
    };

    this.forecasts.set(forecastId, forecast);
    this.emit('forecast.generated', forecast);

    return forecast;
  }

  private calculateDailyAverage(costs: CostEntry[]): number {
    if (costs.length === 0) return 0;
    
    const totalCost = costs.reduce((sum, c) => sum + c.cost.amount, 0);
    const firstDate = costs[costs.length - 1].timestamp;
    const lastDate = costs[0].timestamp;
    const days = Math.max(1, (lastDate.getTime() - firstDate.getTime()) / (24 * 60 * 60 * 1000));
    
    return totalCost / days;
  }

  private calculateGrowthRate(costs: CostEntry[]): number {
    if (costs.length < 14) return 0; // Need at least 2 weeks of data
    
    const sortedCosts = costs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const firstWeek = sortedCosts.slice(0, 7);
    const lastWeek = sortedCosts.slice(-7);
    
    const firstWeekTotal = firstWeek.reduce((sum, c) => sum + c.cost.amount, 0);
    const lastWeekTotal = lastWeek.reduce((sum, c) => sum + c.cost.amount, 0);
    
    if (firstWeekTotal === 0) return 0;
    
    return ((lastWeekTotal - firstWeekTotal) / firstWeekTotal) * 100;
  }

  private calculateSeasonality(costs: CostEntry[]): number {
    // Simple seasonality calculation - in production, use more sophisticated analysis
    const dayOfWeek = new Date().getDay();
    const seasonalityFactors = [0, 5, 10, 15, 20, 15, 5]; // Weekly pattern
    
    return seasonalityFactors[dayOfWeek];
  }

  private calculateCostBreakdown(costs: CostEntry[]): any {
    const breakdown = {
      llmProviders: {} as { [key: string]: number },
      services: {} as { [key: string]: number },
      regions: {} as { [key: string]: number }
    };

    costs.forEach(cost => {
      // Provider breakdown
      breakdown.llmProviders[cost.provider] = (breakdown.llmProviders[cost.provider] || 0) + cost.cost.amount;
      
      // Service breakdown
      breakdown.services[cost.service] = (breakdown.services[cost.service] || 0) + cost.cost.amount;
      
      // Region breakdown
      const region = cost.metadata.region || 'unknown';
      breakdown.regions[region] = (breakdown.regions[region] || 0) + cost.cost.amount;
    });

    return breakdown;
  }

  private calculateConfidence(costs: CostEntry[]): number {
    // Base confidence on data quantity and variance
    const dataPoints = costs.length;
    const maxConfidence = Math.min(90, dataPoints * 2); // More data = higher confidence
    
    if (dataPoints < 10) return 50;
    if (dataPoints < 50) return 70;
    
    return maxConfidence;
  }

  private generateForecastRecommendations(prediction: number, dailyAverage: number): string[] {
    const recommendations = [];
    
    if (prediction > dailyAverage * 35) { // Monthly prediction high
      recommendations.push('Consider implementing aggressive cost optimizations');
      recommendations.push('Review and optimize high-cost operations');
    }
    
    if (prediction > dailyAverage * 25) {
      recommendations.push('Set up budget alerts for early warning');
      recommendations.push('Evaluate free tier usage opportunities');
    }
    
    recommendations.push('Monitor usage patterns for optimization opportunities');
    recommendations.push('Consider implementing caching for frequent requests');
    
    return recommendations;
  }

  // ================================================================================================
  // MONITORING AND ALERTS
  // ================================================================================================

  private async startCostMonitoring(): Promise<void> {
    console.log('📊 Starting cost monitoring...');
    
    this.monitoringInterval = setInterval(async () => {
      await this.performCostMonitoring();
    }, 60000); // Check every minute
  }

  private async performCostMonitoring(): Promise<void> {
    // Check all active budgets
    for (const budget of this.budgets.values()) {
      if (budget.status === 'active') {
        await this.checkBudgetStatus(budget);
      }
    }
  }

  private async checkBudgetStatus(budget: CostBudget): Promise<void> {
    const now = new Date();
    
    // Check if budget period has ended
    if (now > budget.period.endDate) {
      budget.status = 'completed';
      
      if (budget.period.resetAutomatic) {
        // Create new budget for next period
        await this.resetBudget(budget);
      }
    }

    // Check for forecast warnings
    if (budget.projectedSpend > budget.amount * 1.1) { // 10% over budget projection
      await this.createCostAlert(budget, 'forecast_warning', 110);
    }
  }

  private async resetBudget(originalBudget: CostBudget): Promise<void> {
    const periodLength = originalBudget.period.endDate.getTime() - originalBudget.period.startDate.getTime();
    
    const newBudget: Omit<CostBudget, 'id' | 'spent' | 'remaining' | 'projectedSpend' | 'status' | 'createdAt' | 'lastUpdated'> = {
      ...originalBudget,
      period: {
        startDate: originalBudget.period.endDate,
        endDate: new Date(originalBudget.period.endDate.getTime() + periodLength),
        resetAutomatic: originalBudget.period.resetAutomatic
      }
    };

    await this.createBudget(newBudget);
  }

  private async createCostAlert(budget: CostBudget, type: string, percentage: number): Promise<void> {
    const alertId = uuidv4();
    
    const alert: CostAlert = {
      id: alertId,
      budgetId: budget.id,
      type: type as any,
      severity: percentage >= 100 ? 'critical' : percentage >= 90 ? 'warning' : 'info',
      message: this.generateAlertMessage(type, percentage, budget),
      details: {
        currentSpend: budget.spent,
        budgetAmount: budget.amount,
        percentage,
        timeRemaining: this.calculateTimeRemaining(budget),
        projectedOverrun: budget.projectedSpend > budget.amount ? budget.projectedSpend - budget.amount : undefined
      },
      actions: {
        suggested: this.generateSuggestedActions(type, percentage),
        automatic: [],
        taken: []
      },
      timestamp: new Date(),
      acknowledged: false
    };

    this.alerts.set(alertId, alert);
    this.emit('cost.alert', alert);
  }

  private generateAlertMessage(type: string, percentage: number, budget: CostBudget): string {
    switch (type) {
      case 'threshold_exceeded':
        return `Budget ${budget.name} has reached ${percentage}% of allocated amount ($${budget.spent.toFixed(2)} / $${budget.amount.toFixed(2)})`;
      case 'budget_depleted':
        return `Budget ${budget.name} has been fully consumed. Consider increasing the budget or implementing cost controls.`;
      case 'forecast_warning':
        return `Budget ${budget.name} is projected to exceed allocated amount by ${percentage - 100}% based on current usage patterns.`;
      default:
        return `Cost alert for budget ${budget.name}`;
    }
  }

  private generateSuggestedActions(type: string, percentage: number): string[] {
    const actions = [];
    
    if (percentage >= 90) {
      actions.push('Review recent high-cost operations');
      actions.push('Implement immediate cost optimizations');
      actions.push('Consider increasing budget if justified');
    }
    
    if (percentage >= 75) {
      actions.push('Enable free tier providers where possible');
      actions.push('Review and optimize LLM usage patterns');
      actions.push('Implement request caching');
    }
    
    actions.push('Monitor usage closely');
    actions.push('Consider setting up additional alerts');
    
    return actions;
  }

  private calculateTimeRemaining(budget: CostBudget): string {
    const now = new Date();
    const remainingMs = budget.period.endDate.getTime() - now.getTime();
    
    if (remainingMs <= 0) return '0 days';
    
    const days = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
    const hours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    
    return `${days} days, ${hours} hours`;
  }

  private hasRecentAlert(budgetId: string, threshold: number): boolean {
    const recentAlerts = Array.from(this.alerts.values()).filter(alert =>
      alert.budgetId === budgetId &&
      alert.details.percentage === threshold &&
      alert.timestamp > new Date(Date.now() - 60 * 60 * 1000) // Last hour
    );
    
    return recentAlerts.length > 0;
  }

  // ================================================================================================
  // UTILITY METHODS
  // ================================================================================================

  private getRecentCosts(platform: string, userId?: string, days: number = 30): CostEntry[] {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    return this.costEntries
      .filter(entry => 
        entry.platform === platform &&
        entry.timestamp > cutoffDate &&
        (!userId || entry.userId === userId)
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  private async generateCostForecasts(): Promise<void> {
    // Generate forecasts for all platforms
    const platforms = Array.from(new Set(this.costEntries.map(e => e.platform)));
    
    for (const platform of platforms) {
      try {
        await this.generateCostForecast(platform, 'month');
      } catch (error) {
        console.error(`Failed to generate forecast for platform ${platform}:`, error);
      }
    }
  }

  // ================================================================================================
  // PUBLIC API METHODS
  // ================================================================================================

  public getCostIntelligenceStatus(): any {
    const activeBudgets = Array.from(this.budgets.values()).filter(b => b.status === 'active');
    const activeAlerts = Array.from(this.alerts.values()).filter(a => !a.acknowledged);
    
    return {
      version: this.version,
      budgets: {
        total: this.budgets.size,
        active: activeBudgets.length,
        exceeded: Array.from(this.budgets.values()).filter(b => b.status === 'exceeded').length
      },
      costs: {
        entries: this.costEntries.length,
        totalSpend: this.costEntries.reduce((sum, e) => sum + e.cost.amount, 0),
        recentSpend: this.getRecentCosts('all', undefined, 7).reduce((sum, e) => sum + e.cost.amount, 0)
      },
      optimizations: {
        identified: this.optimizations.size,
        pending: Array.from(this.optimizations.values()).filter(o => o.status === 'identified').length,
        implemented: Array.from(this.optimizations.values()).filter(o => o.status === 'completed').length
      },
      forecasts: {
        active: this.forecasts.size,
        platforms: Array.from(new Set(Array.from(this.forecasts.values()).map(f => f.platform))).length
      },
      alerts: {
        total: this.alerts.size,
        active: activeAlerts.length,
        critical: activeAlerts.filter(a => a.severity === 'critical').length
      },
      providers: this.providerRates.size,
      lastUpdated: new Date().toISOString()
    };
  }

  public getBudgets(userId?: string): CostBudget[] {
    const budgets = Array.from(this.budgets.values());
    
    if (userId) {
      return budgets.filter(b => b.userId === userId);
    }
    
    return budgets;
  }

  public getOptimizations(status?: string): CostOptimization[] {
    const optimizations = Array.from(this.optimizations.values());
    
    if (status) {
      return optimizations.filter(o => o.status === status);
    }
    
    return optimizations;
  }

  public getActiveAlerts(): CostAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.acknowledged);
  }

  public getCostTrends(platform: string, days: number = 30): any {
    const costs = this.getRecentCosts(platform, undefined, days);
    
    // Group by day
    const dailyCosts: { [key: string]: number } = {};
    
    costs.forEach(cost => {
      const day = cost.timestamp.toISOString().split('T')[0];
      dailyCosts[day] = (dailyCosts[day] || 0) + cost.cost.amount;
    });

    return {
      daily: dailyCosts,
      total: Object.values(dailyCosts).reduce((sum, cost) => sum + cost, 0),
      average: Object.values(dailyCosts).reduce((sum, cost) => sum + cost, 0) / Object.keys(dailyCosts).length,
      trend: this.calculateGrowthRate(costs)
    };
  }

  public destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    if (this.forecastInterval) {
      clearInterval(this.forecastInterval);
    }
  }
}

export const waiCostIntelligenceSystem = new WAICostIntelligenceSystem();
export default waiCostIntelligenceSystem;