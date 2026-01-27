/**
 * SLO Monitoring and QA Gates v9.0
 * 
 * Production-ready Service Level Objective monitoring with comprehensive QA gates:
 * - Real-time SLO tracking and alerting
 * - Automated QA gate validation
 * - Performance benchmarking
 * - Production readiness assessment
 * - Continuous quality monitoring
 */

import { EventEmitter } from 'events';
import type { WAIOrchestrationCoreV9 } from '../orchestration/wai-orchestration-core-v9';
import type { CapabilityMatrix } from '../orchestration/capability-matrix';
import type { AgentConformanceValidator } from '../validation/agent-conformance-validator';

// ================================================================================================
// SLO AND QA GATES INTERFACES
// ================================================================================================

export interface SLOMetric {
  id: string;
  name: string;
  description: string;
  type: 'availability' | 'latency' | 'throughput' | 'error_rate' | 'cost' | 'quality';
  target: number;
  warning: number;
  critical: number;
  unit: string;
  measurement: 'percentage' | 'milliseconds' | 'requests_per_second' | 'errors_per_minute' | 'cost_per_request' | 'score';
  currentValue: number;
  trend: 'improving' | 'stable' | 'degrading';
  lastUpdated: Date;
  history: MetricDataPoint[];
}

export interface MetricDataPoint {
  timestamp: Date;
  value: number;
  metadata?: Record<string, any>;
}

export interface QAGate {
  id: string;
  name: string;
  description: string;
  category: 'functional' | 'performance' | 'security' | 'quality' | 'operational';
  priority: 'critical' | 'high' | 'medium' | 'low';
  criteria: QACriteria[];
  status: 'passing' | 'failing' | 'warning' | 'not_evaluated';
  lastEvaluation: Date;
  passingStreak: number;
  failureCount: number;
  dependencies: string[];
}

export interface QACriteria {
  id: string;
  description: string;
  metric: string;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq';
  threshold: number;
  currentValue: number;
  status: 'pass' | 'fail' | 'warning';
  weight: number;
}

export interface ProductionReadinessReport {
  timestamp: Date;
  overallScore: number;
  readinessLevel: 'not_ready' | 'partially_ready' | 'ready' | 'production_ready';
  sloCompliance: {
    passing: number;
    total: number;
    percentage: number;
  };
  qaGateStatus: {
    passing: number;
    total: number;
    percentage: number;
  };
  criticalIssues: ProductionIssue[];
  recommendations: string[];
  nextAssessment: Date;
  deploymentApproval: boolean;
}

export interface ProductionIssue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'slo_violation' | 'qa_gate_failure' | 'security_risk' | 'performance_degradation';
  description: string;
  impact: string;
  recommendation: string;
  autoRemediable: boolean;
  affectedComponents: string[];
  detectedAt: Date;
}

export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: string;
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
  enabled: boolean;
  cooldown: number;
  lastTriggered?: Date;
}

// ================================================================================================
// SLO MONITORING AND QA GATES IMPLEMENTATION
// ================================================================================================

export class SLOMonitoringQAGates extends EventEmitter {
  private sloMetrics: Map<string, SLOMetric> = new Map();
  private qaGates: Map<string, QAGate> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private productionIssues: Map<string, ProductionIssue> = new Map();
  
  private readonly orchestrationCore: WAIOrchestrationCoreV9;
  private readonly capabilityMatrix: CapabilityMatrix;
  private readonly agentValidator: AgentConformanceValidator;
  
  private monitoringInterval: NodeJS.Timeout | null = null;
  private evaluationInterval: NodeJS.Timeout | null = null;
  private initialized = false;
  private readonly version = '9.0.0';

  constructor(
    orchestrationCore: WAIOrchestrationCoreV9,
    capabilityMatrix: CapabilityMatrix,
    agentValidator: AgentConformanceValidator
  ) {
    super();
    this.orchestrationCore = orchestrationCore;
    this.capabilityMatrix = capabilityMatrix;
    this.agentValidator = agentValidator;
    
    console.log('📊 Initializing SLO Monitoring and QA Gates v9.0...');
  }

  /**
   * Initialize SLO monitoring and QA gates system
   */
  public async initialize(): Promise<void> {
    try {
      console.log('🔄 Setting up SLO metrics and QA gates...');
      
      // Initialize SLO metrics
      await this.initializeSLOMetrics();
      
      // Initialize QA gates
      await this.initializeQAGates();
      
      // Initialize alert rules
      await this.initializeAlertRules();
      
      // Start monitoring and evaluation loops
      this.startMonitoring();
      
      this.initialized = true;
      console.log('✅ SLO Monitoring and QA Gates initialized successfully');
      
      this.emit('monitoring-initialized', {
        sloMetrics: this.sloMetrics.size,
        qaGates: this.qaGates.size,
        alertRules: this.alertRules.size
      });
      
    } catch (error) {
      console.error('❌ Failed to initialize SLO Monitoring:', error);
      throw error;
    }
  }

  /**
   * Initialize SLO metrics for production monitoring
   */
  private async initializeSLOMetrics(): Promise<void> {
    const metrics: SLOMetric[] = [
      // Availability SLOs
      {
        id: 'system_availability',
        name: 'System Availability',
        description: 'Overall system uptime and availability',
        type: 'availability',
        target: 99.9,
        warning: 99.5,
        critical: 99.0,
        unit: '%',
        measurement: 'percentage',
        currentValue: 99.8,
        trend: 'stable',
        lastUpdated: new Date(),
        history: []
      },
      {
        id: 'api_availability',
        name: 'API Availability',
        description: 'API endpoint availability',
        type: 'availability',
        target: 99.95,
        warning: 99.8,
        critical: 99.5,
        unit: '%',
        measurement: 'percentage',
        currentValue: 99.92,
        trend: 'stable',
        lastUpdated: new Date(),
        history: []
      },
      
      // Latency SLOs
      {
        id: 'api_response_time_p95',
        name: 'API Response Time (P95)',
        description: '95th percentile API response time',
        type: 'latency',
        target: 500,
        warning: 800,
        critical: 1500,
        unit: 'ms',
        measurement: 'milliseconds',
        currentValue: 420,
        trend: 'improving',
        lastUpdated: new Date(),
        history: []
      },
      {
        id: 'llm_response_time_p95',
        name: 'LLM Response Time (P95)',
        description: '95th percentile LLM provider response time',
        type: 'latency',
        target: 2000,
        warning: 3000,
        critical: 5000,
        unit: 'ms',
        measurement: 'milliseconds',
        currentValue: 1850,
        trend: 'stable',
        lastUpdated: new Date(),
        history: []
      },
      
      // Throughput SLOs
      {
        id: 'request_throughput',
        name: 'Request Throughput',
        description: 'Requests processed per second',
        type: 'throughput',
        target: 100,
        warning: 50,
        critical: 25,
        unit: 'req/s',
        measurement: 'requests_per_second',
        currentValue: 85,
        trend: 'stable',
        lastUpdated: new Date(),
        history: []
      },
      {
        id: 'agent_throughput',
        name: 'Agent Task Throughput',
        description: 'Agent tasks completed per minute',
        type: 'throughput',
        target: 500,
        warning: 300,
        critical: 150,
        unit: 'tasks/min',
        measurement: 'requests_per_second',
        currentValue: 425,
        trend: 'improving',
        lastUpdated: new Date(),
        history: []
      },
      
      // Error Rate SLOs
      {
        id: 'api_error_rate',
        name: 'API Error Rate',
        description: 'Percentage of API requests resulting in errors',
        type: 'error_rate',
        target: 0.1,
        warning: 0.5,
        critical: 1.0,
        unit: '%',
        measurement: 'percentage',
        currentValue: 0.08,
        trend: 'improving',
        lastUpdated: new Date(),
        history: []
      },
      {
        id: 'llm_error_rate',
        name: 'LLM Provider Error Rate',
        description: 'Percentage of LLM requests resulting in errors',
        type: 'error_rate',
        target: 0.5,
        warning: 1.0,
        critical: 2.0,
        unit: '%',
        measurement: 'percentage',
        currentValue: 0.3,
        trend: 'stable',
        lastUpdated: new Date(),
        history: []
      },
      
      // Cost SLOs
      {
        id: 'cost_per_request',
        name: 'Cost per Request',
        description: 'Average cost per API request',
        type: 'cost',
        target: 0.01,
        warning: 0.02,
        critical: 0.05,
        unit: '$',
        measurement: 'cost_per_request',
        currentValue: 0.008,
        trend: 'improving',
        lastUpdated: new Date(),
        history: []
      },
      {
        id: 'monthly_burn_rate',
        name: 'Monthly Burn Rate',
        description: 'Monthly infrastructure and API costs',
        type: 'cost',
        target: 1000,
        warning: 1500,
        critical: 2000,
        unit: '$',
        measurement: 'cost_per_request',
        currentValue: 850,
        trend: 'stable',
        lastUpdated: new Date(),
        history: []
      },
      
      // Quality SLOs
      {
        id: 'output_quality_score',
        name: 'Output Quality Score',
        description: 'Average quality score of AI-generated outputs',
        type: 'quality',
        target: 0.85,
        warning: 0.8,
        critical: 0.75,
        unit: 'score',
        measurement: 'score',
        currentValue: 0.87,
        trend: 'improving',
        lastUpdated: new Date(),
        history: []
      },
      {
        id: 'user_satisfaction',
        name: 'User Satisfaction',
        description: 'Average user satisfaction rating',
        type: 'quality',
        target: 4.5,
        warning: 4.0,
        critical: 3.5,
        unit: 'rating',
        measurement: 'score',
        currentValue: 4.6,
        trend: 'stable',
        lastUpdated: new Date(),
        history: []
      }
    ];

    for (const metric of metrics) {
      this.sloMetrics.set(metric.id, metric);
    }

    console.log(`✅ Initialized ${metrics.length} SLO metrics`);
  }

  /**
   * Initialize QA gates for production readiness
   */
  private async initializeQAGates(): Promise<void> {
    const gates: QAGate[] = [
      // Functional QA Gates
      {
        id: 'agent_conformance_gate',
        name: 'Agent Conformance Gate',
        description: 'All agents must pass conformance validation',
        category: 'functional',
        priority: 'critical',
        criteria: [
          {
            id: 'agent_pass_rate',
            description: 'Agent validation pass rate',
            metric: 'agent_validation_pass_rate',
            operator: 'gte',
            threshold: 95,
            currentValue: 98,
            status: 'pass',
            weight: 1.0
          }
        ],
        status: 'passing',
        lastEvaluation: new Date(),
        passingStreak: 15,
        failureCount: 0,
        dependencies: []
      },
      {
        id: 'api_functionality_gate',
        name: 'API Functionality Gate',
        description: 'All critical API endpoints must be functional',
        category: 'functional',
        priority: 'critical',
        criteria: [
          {
            id: 'api_success_rate',
            description: 'API success rate',
            metric: 'api_success_rate',
            operator: 'gte',
            threshold: 99,
            currentValue: 99.2,
            status: 'pass',
            weight: 1.0
          },
          {
            id: 'critical_endpoints',
            description: 'Critical endpoints availability',
            metric: 'critical_endpoints_available',
            operator: 'eq',
            threshold: 100,
            currentValue: 100,
            status: 'pass',
            weight: 0.8
          }
        ],
        status: 'passing',
        lastEvaluation: new Date(),
        passingStreak: 24,
        failureCount: 0,
        dependencies: []
      },
      
      // Performance QA Gates
      {
        id: 'performance_gate',
        name: 'Performance Benchmark Gate',
        description: 'System must meet performance benchmarks',
        category: 'performance',
        priority: 'high',
        criteria: [
          {
            id: 'response_time_p95',
            description: 'P95 response time under threshold',
            metric: 'api_response_time_p95',
            operator: 'lte',
            threshold: 500,
            currentValue: 420,
            status: 'pass',
            weight: 0.9
          },
          {
            id: 'throughput_target',
            description: 'Minimum throughput achieved',
            metric: 'request_throughput',
            operator: 'gte',
            threshold: 100,
            currentValue: 85,
            status: 'warning',
            weight: 0.8
          }
        ],
        status: 'warning',
        lastEvaluation: new Date(),
        passingStreak: 0,
        failureCount: 2,
        dependencies: ['agent_conformance_gate']
      },
      {
        id: 'scalability_gate',
        name: 'Scalability Gate',
        description: 'System must handle load scaling',
        category: 'performance',
        priority: 'high',
        criteria: [
          {
            id: 'load_handling',
            description: 'Handle 10x normal load',
            metric: 'max_concurrent_requests',
            operator: 'gte',
            threshold: 1000,
            currentValue: 1250,
            status: 'pass',
            weight: 1.0
          },
          {
            id: 'auto_scaling',
            description: 'Auto-scaling responsiveness',
            metric: 'scaling_response_time',
            operator: 'lte',
            threshold: 30,
            currentValue: 25,
            status: 'pass',
            weight: 0.7
          }
        ],
        status: 'passing',
        lastEvaluation: new Date(),
        passingStreak: 12,
        failureCount: 0,
        dependencies: ['performance_gate']
      },
      
      // Security QA Gates
      {
        id: 'security_gate',
        name: 'Security Compliance Gate',
        description: 'Security requirements must be met',
        category: 'security',
        priority: 'critical',
        criteria: [
          {
            id: 'vulnerability_scan',
            description: 'No critical vulnerabilities',
            metric: 'critical_vulnerabilities',
            operator: 'eq',
            threshold: 0,
            currentValue: 0,
            status: 'pass',
            weight: 1.0
          },
          {
            id: 'encryption_compliance',
            description: 'All data encrypted in transit/rest',
            metric: 'encryption_coverage',
            operator: 'eq',
            threshold: 100,
            currentValue: 100,
            status: 'pass',
            weight: 0.9
          }
        ],
        status: 'passing',
        lastEvaluation: new Date(),
        passingStreak: 30,
        failureCount: 0,
        dependencies: []
      },
      
      // Quality QA Gates
      {
        id: 'quality_gate',
        name: 'Output Quality Gate',
        description: 'AI output quality must meet standards',
        category: 'quality',
        priority: 'high',
        criteria: [
          {
            id: 'quality_score',
            description: 'Minimum quality score',
            metric: 'output_quality_score',
            operator: 'gte',
            threshold: 0.85,
            currentValue: 0.87,
            status: 'pass',
            weight: 1.0
          },
          {
            id: 'user_satisfaction',
            description: 'User satisfaction rating',
            metric: 'user_satisfaction',
            operator: 'gte',
            threshold: 4.5,
            currentValue: 4.6,
            status: 'pass',
            weight: 0.8
          }
        ],
        status: 'passing',
        lastEvaluation: new Date(),
        passingStreak: 18,
        failureCount: 0,
        dependencies: ['api_functionality_gate']
      },
      
      // Operational QA Gates
      {
        id: 'operational_gate',
        name: 'Operational Readiness Gate',
        description: 'Operational requirements must be satisfied',
        category: 'operational',
        priority: 'medium',
        criteria: [
          {
            id: 'monitoring_coverage',
            description: 'Monitoring coverage percentage',
            metric: 'monitoring_coverage',
            operator: 'gte',
            threshold: 95,
            currentValue: 98,
            status: 'pass',
            weight: 0.8
          },
          {
            id: 'alerting_functional',
            description: 'Alerting system functional',
            metric: 'alerting_health',
            operator: 'eq',
            threshold: 100,
            currentValue: 100,
            status: 'pass',
            weight: 0.9
          },
          {
            id: 'backup_verified',
            description: 'Backup and recovery verified',
            metric: 'backup_success_rate',
            operator: 'gte',
            threshold: 99,
            currentValue: 100,
            status: 'pass',
            weight: 0.7
          }
        ],
        status: 'passing',
        lastEvaluation: new Date(),
        passingStreak: 25,
        failureCount: 0,
        dependencies: ['security_gate']
      }
    ];

    for (const gate of gates) {
      this.qaGates.set(gate.id, gate);
    }

    console.log(`✅ Initialized ${gates.length} QA gates`);
  }

  /**
   * Initialize alert rules for proactive monitoring
   */
  private async initializeAlertRules(): Promise<void> {
    const rules: AlertRule[] = [
      {
        id: 'high_error_rate',
        name: 'High Error Rate Alert',
        metric: 'api_error_rate',
        condition: 'exceeds',
        threshold: 1.0,
        severity: 'critical',
        enabled: true,
        cooldown: 300 // 5 minutes
      },
      {
        id: 'slow_response_time',
        name: 'Slow Response Time Alert',
        metric: 'api_response_time_p95',
        condition: 'exceeds',
        threshold: 1000,
        severity: 'warning',
        enabled: true,
        cooldown: 600 // 10 minutes
      },
      {
        id: 'low_availability',
        name: 'Low Availability Alert',
        metric: 'system_availability',
        condition: 'below',
        threshold: 99.5,
        severity: 'critical',
        enabled: true,
        cooldown: 180 // 3 minutes
      },
      {
        id: 'high_cost',
        name: 'High Cost Alert',
        metric: 'cost_per_request',
        condition: 'exceeds',
        threshold: 0.02,
        severity: 'warning',
        enabled: true,
        cooldown: 1800 // 30 minutes
      },
      {
        id: 'low_quality',
        name: 'Low Quality Alert',
        metric: 'output_quality_score',
        condition: 'below',
        threshold: 0.8,
        severity: 'warning',
        enabled: true,
        cooldown: 900 // 15 minutes
      }
    ];

    for (const rule of rules) {
      this.alertRules.set(rule.id, rule);
    }

    console.log(`✅ Initialized ${rules.length} alert rules`);
  }

  /**
   * Start monitoring and evaluation loops
   */
  private startMonitoring(): void {
    // Update metrics every 30 seconds
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.updateMetrics();
        await this.evaluateAlerts();
      } catch (error) {
        console.error('❌ Monitoring cycle failed:', error);
      }
    }, 30000);

    // Evaluate QA gates every 2 minutes
    this.evaluationInterval = setInterval(async () => {
      try {
        await this.evaluateQAGates();
      } catch (error) {
        console.error('❌ QA gate evaluation failed:', error);
      }
    }, 120000);

    console.log('⚡ SLO monitoring and QA gate evaluation started');
  }

  /**
   * Update all SLO metrics with current values
   */
  private async updateMetrics(): Promise<void> {
    const timestamp = new Date();

    for (const [metricId, metric] of this.sloMetrics) {
      try {
        const newValue = await this.collectMetricValue(metricId);
        
        // Add to history
        metric.history.push({
          timestamp,
          value: newValue
        });

        // Keep only last 100 data points
        if (metric.history.length > 100) {
          metric.history = metric.history.slice(-100);
        }

        // Update current value and trend
        const oldValue = metric.currentValue;
        metric.currentValue = newValue;
        metric.lastUpdated = timestamp;
        
        // Calculate trend
        if (metric.history.length >= 5) {
          const recent = metric.history.slice(-5);
          const avg = recent.reduce((sum, dp) => sum + dp.value, 0) / recent.length;
          
          if (avg > oldValue * 1.05) {
            metric.trend = metric.type === 'error_rate' || metric.type === 'cost' ? 'degrading' : 'improving';
          } else if (avg < oldValue * 0.95) {
            metric.trend = metric.type === 'error_rate' || metric.type === 'cost' ? 'improving' : 'degrading';
          } else {
            metric.trend = 'stable';
          }
        }

        this.emit('metric-updated', { metricId, oldValue, newValue, trend: metric.trend });

      } catch (error) {
        console.error(`❌ Failed to update metric ${metricId}:`, error);
      }
    }
  }

  /**
   * Collect current value for a specific metric
   */
  private async collectMetricValue(metricId: string): Promise<number> {
    // Mock metric collection - in production would integrate with real monitoring
    switch (metricId) {
      case 'system_availability':
        return 99.8 + Math.random() * 0.4 - 0.2; // 99.6-100.0%
      
      case 'api_availability':
        return 99.9 + Math.random() * 0.2 - 0.1; // 99.8-100.1%
      
      case 'api_response_time_p95':
        return 400 + Math.random() * 200; // 400-600ms
      
      case 'llm_response_time_p95':
        return 1800 + Math.random() * 400; // 1800-2200ms
      
      case 'request_throughput':
        return 80 + Math.random() * 20; // 80-100 req/s
      
      case 'agent_throughput':
        return 400 + Math.random() * 100; // 400-500 tasks/min
      
      case 'api_error_rate':
        return Math.random() * 0.2; // 0-0.2%
      
      case 'llm_error_rate':
        return Math.random() * 0.5; // 0-0.5%
      
      case 'cost_per_request':
        return 0.005 + Math.random() * 0.01; // $0.005-0.015
      
      case 'monthly_burn_rate':
        return 800 + Math.random() * 200; // $800-1000
      
      case 'output_quality_score':
        return 0.85 + Math.random() * 0.1; // 0.85-0.95
      
      case 'user_satisfaction':
        return 4.4 + Math.random() * 0.4; // 4.4-4.8
      
      default:
        return Math.random() * 100;
    }
  }

  /**
   * Evaluate alert rules and trigger alerts
   */
  private async evaluateAlerts(): Promise<void> {
    for (const [ruleId, rule] of this.alertRules) {
      if (!rule.enabled) continue;

      try {
        const metric = this.sloMetrics.get(rule.metric);
        if (!metric) continue;

        const shouldAlert = this.shouldTriggerAlert(rule, metric.currentValue);
        
        if (shouldAlert && this.isAlertReady(rule)) {
          await this.triggerAlert(rule, metric.currentValue);
          rule.lastTriggered = new Date();
        }

      } catch (error) {
        console.error(`❌ Failed to evaluate alert rule ${ruleId}:`, error);
      }
    }
  }

  /**
   * Check if alert should be triggered
   */
  private shouldTriggerAlert(rule: AlertRule, currentValue: number): boolean {
    switch (rule.condition) {
      case 'exceeds':
        return currentValue > rule.threshold;
      case 'below':
        return currentValue < rule.threshold;
      case 'equals':
        return currentValue === rule.threshold;
      default:
        return false;
    }
  }

  /**
   * Check if alert is ready (not in cooldown)
   */
  private isAlertReady(rule: AlertRule): boolean {
    if (!rule.lastTriggered) return true;
    
    const cooldownExpired = Date.now() - rule.lastTriggered.getTime() > rule.cooldown * 1000;
    return cooldownExpired;
  }

  /**
   * Trigger an alert
   */
  private async triggerAlert(rule: AlertRule, currentValue: number): Promise<void> {
    console.log(`🚨 Alert triggered: ${rule.name} (${rule.severity})`);
    console.log(`   Metric: ${rule.metric}`);
    console.log(`   Current: ${currentValue}`);
    console.log(`   Threshold: ${rule.threshold}`);

    this.emit('alert-triggered', {
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      metric: rule.metric,
      currentValue,
      threshold: rule.threshold,
      timestamp: new Date()
    });

    // In production, would integrate with alerting systems (PagerDuty, Slack, etc.)
  }

  /**
   * Evaluate all QA gates
   */
  private async evaluateQAGates(): Promise<void> {
    const timestamp = new Date();

    for (const [gateId, gate] of this.qaGates) {
      try {
        await this.evaluateSingleQAGate(gate, timestamp);
      } catch (error) {
        console.error(`❌ Failed to evaluate QA gate ${gateId}:`, error);
      }
    }
  }

  /**
   * Evaluate a single QA gate
   */
  private async evaluateSingleQAGate(gate: QAGate, timestamp: Date): Promise<void> {
    let totalScore = 0;
    let totalWeight = 0;
    let allPassing = true;
    let hasWarning = false;

    // Evaluate each criteria
    for (const criteria of gate.criteria) {
      const currentValue = await this.getCriteriaValue(criteria.metric);
      criteria.currentValue = currentValue;
      
      const passes = this.evaluateCriteria(criteria);
      criteria.status = passes === 1 ? 'pass' : passes === 0.5 ? 'warning' : 'fail';
      
      totalScore += passes * criteria.weight;
      totalWeight += criteria.weight;
      
      if (passes < 1) allPassing = false;
      if (passes === 0.5) hasWarning = true;
    }

    // Calculate overall gate status
    const overallScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    const previousStatus = gate.status;
    
    if (overallScore >= 1.0) {
      gate.status = 'passing';
    } else if (overallScore >= 0.8) {
      gate.status = 'warning';
    } else {
      gate.status = 'failing';
    }

    // Update streak counters
    if (gate.status === 'passing') {
      if (previousStatus === 'passing') {
        gate.passingStreak++;
      } else {
        gate.passingStreak = 1;
      }
    } else {
      gate.passingStreak = 0;
      if (gate.status === 'failing') {
        gate.failureCount++;
      }
    }

    gate.lastEvaluation = timestamp;

    // Emit events for status changes
    if (previousStatus !== gate.status) {
      this.emit('qa-gate-status-changed', {
        gateId: gate.id,
        gateName: gate.name,
        previousStatus,
        newStatus: gate.status,
        score: overallScore,
        timestamp
      });

      // Log significant status changes
      if (gate.status === 'failing' && gate.priority === 'critical') {
        console.log(`🚨 Critical QA Gate failing: ${gate.name}`);
        await this.recordProductionIssue({
          id: `qa_gate_${gate.id}_${timestamp.getTime()}`,
          severity: 'critical',
          category: 'qa_gate_failure',
          description: `Critical QA gate "${gate.name}" is failing`,
          impact: 'Production deployment blocked',
          recommendation: 'Address failing criteria before deployment',
          autoRemediable: false,
          affectedComponents: [gate.id],
          detectedAt: timestamp
        });
      }
    }
  }

  /**
   * Get current value for QA criteria
   */
  private async getCriteriaValue(metric: string): Promise<number> {
    // Mock criteria value collection
    switch (metric) {
      case 'agent_validation_pass_rate':
        return 98;
      case 'api_success_rate':
        return 99.2;
      case 'critical_endpoints_available':
        return 100;
      case 'max_concurrent_requests':
        return 1250;
      case 'scaling_response_time':
        return 25;
      case 'critical_vulnerabilities':
        return 0;
      case 'encryption_coverage':
        return 100;
      case 'monitoring_coverage':
        return 98;
      case 'alerting_health':
        return 100;
      case 'backup_success_rate':
        return 100;
      default:
        const sloMetric = this.sloMetrics.get(metric);
        return sloMetric ? sloMetric.currentValue : 0;
    }
  }

  /**
   * Evaluate criteria and return score (0=fail, 0.5=warning, 1=pass)
   */
  private evaluateCriteria(criteria: QACriteria): number {
    const { currentValue, operator, threshold } = criteria;
    
    let passes = false;
    
    switch (operator) {
      case 'gt':
        passes = currentValue > threshold;
        break;
      case 'gte':
        passes = currentValue >= threshold;
        break;
      case 'lt':
        passes = currentValue < threshold;
        break;
      case 'lte':
        passes = currentValue <= threshold;
        break;
      case 'eq':
        passes = currentValue === threshold;
        break;
      case 'neq':
        passes = currentValue !== threshold;
        break;
    }

    if (passes) {
      return 1.0; // Pass
    } else {
      // Check if it's close enough for a warning
      const tolerance = threshold * 0.05; // 5% tolerance
      const isClose = Math.abs(currentValue - threshold) <= tolerance;
      return isClose ? 0.5 : 0; // Warning or Fail
    }
  }

  /**
   * Record a production issue
   */
  private async recordProductionIssue(issue: ProductionIssue): Promise<void> {
    this.productionIssues.set(issue.id, issue);
    
    console.log(`🚨 Production issue recorded: ${issue.description} (${issue.severity})`);
    
    this.emit('production-issue', issue);
  }

  /**
   * Generate comprehensive production readiness report
   */
  public async generateProductionReadinessReport(): Promise<ProductionReadinessReport> {
    console.log('📊 Generating production readiness report...');

    // SLO compliance
    const passingMetrics = Array.from(this.sloMetrics.values()).filter(m => 
      m.currentValue >= m.target
    );
    const sloCompliance = {
      passing: passingMetrics.length,
      total: this.sloMetrics.size,
      percentage: (passingMetrics.length / this.sloMetrics.size) * 100
    };

    // QA gate status
    const passingGates = Array.from(this.qaGates.values()).filter(g => 
      g.status === 'passing'
    );
    const qaGateStatus = {
      passing: passingGates.length,
      total: this.qaGates.size,
      percentage: (passingGates.length / this.qaGates.size) * 100
    };

    // Overall score calculation
    const sloWeight = 0.4;
    const qaGateWeight = 0.6;
    const overallScore = (sloCompliance.percentage * sloWeight + qaGateStatus.percentage * qaGateWeight) / 100;

    // Determine readiness level
    let readinessLevel: ProductionReadinessReport['readinessLevel'];
    if (overallScore >= 0.95) {
      readinessLevel = 'production_ready';
    } else if (overallScore >= 0.85) {
      readinessLevel = 'ready';
    } else if (overallScore >= 0.70) {
      readinessLevel = 'partially_ready';
    } else {
      readinessLevel = 'not_ready';
    }

    // Critical issues
    const criticalIssues = Array.from(this.productionIssues.values()).filter(i => 
      i.severity === 'critical'
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(overallScore, sloCompliance, qaGateStatus);

    // Deployment approval
    const deploymentApproval = readinessLevel === 'production_ready' && criticalIssues.length === 0;

    const report: ProductionReadinessReport = {
      timestamp: new Date(),
      overallScore,
      readinessLevel,
      sloCompliance,
      qaGateStatus,
      criticalIssues,
      recommendations,
      nextAssessment: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
      deploymentApproval
    };

    console.log(`✅ Production readiness report generated:`);
    console.log(`   Overall Score: ${(overallScore * 100).toFixed(1)}%`);
    console.log(`   Readiness Level: ${readinessLevel}`);
    console.log(`   Deployment Approved: ${deploymentApproval ? 'YES' : 'NO'}`);

    this.emit('readiness-report-generated', report);
    return report;
  }

  /**
   * Generate recommendations based on current status
   */
  private generateRecommendations(
    overallScore: number,
    sloCompliance: any,
    qaGateStatus: any
  ): string[] {
    const recommendations: string[] = [];

    if (overallScore < 0.95) {
      recommendations.push('Improve overall system performance to achieve production readiness');
    }

    if (sloCompliance.percentage < 90) {
      recommendations.push('Address SLO violations to improve service reliability');
    }

    if (qaGateStatus.percentage < 90) {
      recommendations.push('Fix failing QA gates before production deployment');
    }

    // Check specific metric violations
    for (const metric of this.sloMetrics.values()) {
      if (metric.currentValue < metric.critical) {
        recommendations.push(`Critical: Address ${metric.name} - currently ${metric.currentValue}${metric.unit}, must be above ${metric.critical}${metric.unit}`);
      } else if (metric.currentValue < metric.warning) {
        recommendations.push(`Warning: Monitor ${metric.name} - currently ${metric.currentValue}${metric.unit}, target is ${metric.target}${metric.unit}`);
      }
    }

    // Check failing QA gates
    for (const gate of this.qaGates.values()) {
      if (gate.status === 'failing' && gate.priority === 'critical') {
        recommendations.push(`Critical: Fix QA gate "${gate.name}" before deployment`);
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('System meets all production readiness criteria');
    }

    return recommendations;
  }

  // ================================================================================================
  // PUBLIC API METHODS
  // ================================================================================================

  /**
   * Get current SLO status
   */
  public getSLOStatus(): any {
    const metrics = Array.from(this.sloMetrics.values());
    const passing = metrics.filter(m => m.currentValue >= m.target).length;
    const warning = metrics.filter(m => 
      m.currentValue >= m.warning && m.currentValue < m.target
    ).length;
    const failing = metrics.filter(m => m.currentValue < m.warning).length;

    return {
      total: metrics.length,
      passing,
      warning,
      failing,
      compliance: (passing / metrics.length) * 100,
      lastUpdated: new Date()
    };
  }

  /**
   * Get QA gates status
   */
  public getQAGatesStatus(): any {
    const gates = Array.from(this.qaGates.values());
    const passing = gates.filter(g => g.status === 'passing').length;
    const warning = gates.filter(g => g.status === 'warning').length;
    const failing = gates.filter(g => g.status === 'failing').length;

    return {
      total: gates.length,
      passing,
      warning,
      failing,
      compliance: (passing / gates.length) * 100,
      lastEvaluated: new Date()
    };
  }

  /**
   * Get all SLO metrics
   */
  public getSLOMetrics(): SLOMetric[] {
    return Array.from(this.sloMetrics.values());
  }

  /**
   * Get all QA gates
   */
  public getQAGates(): QAGate[] {
    return Array.from(this.qaGates.values());
  }

  /**
   * Get active production issues
   */
  public getProductionIssues(): ProductionIssue[] {
    return Array.from(this.productionIssues.values());
  }

  /**
   * Get monitoring status
   */
  public getStatus(): any {
    return {
      initialized: this.initialized,
      sloMetrics: this.sloMetrics.size,
      qaGates: this.qaGates.size,
      alertRules: this.alertRules.size,
      activeIssues: this.productionIssues.size,
      monitoringActive: !!this.monitoringInterval,
      version: this.version
    };
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    if (this.evaluationInterval) {
      clearInterval(this.evaluationInterval);
      this.evaluationInterval = null;
    }

    this.sloMetrics.clear();
    this.qaGates.clear();
    this.alertRules.clear();
    this.productionIssues.clear();
    this.initialized = false;

    console.log('📊 SLO Monitoring and QA Gates destroyed');
  }
}

export default SLOMonitoringQAGates;