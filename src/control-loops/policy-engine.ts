/**
 * WAI Policy Engine v9.0
 * Policy management, evaluation, and enforcement
 * Implements policy packs, RBAC, and compliance frameworks
 */

import { EventEmitter } from 'events';
import { WAILogger } from '../utils/logger';
import { Policy, PolicyDecision, PolicyContext } from '../types/spi-contracts';

export class PolicyEngine extends EventEmitter {
  private logger: WAILogger;
  private initialized = false;
  private policies: Map<string, Policy> = new Map();
  private policyPacks: Map<string, PolicyPack> = new Map();
  private evaluationHistory: PolicyEvaluation[] = [];
  
  constructor(private config: PolicyEngineConfig = {}) {
    super();
    this.logger = new WAILogger('PolicyEngine');
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.logger.info('📋 Initializing Policy Engine...');

      // Load default policies
      await this.loadDefaultPolicies();

      // Initialize policy evaluation engine
      await this.initializePolicyEvaluator();

      // Start policy monitoring
      this.startPolicyMonitoring();

      this.initialized = true;
      this.logger.info('✅ Policy Engine initialized');

    } catch (error) {
      this.logger.error('❌ Policy Engine initialization failed:', error);
      throw error;
    }
  }

  /**
   * Load policy packs
   */
  async loadPolicyPacks(packIds: string[]): Promise<void> {
    this.logger.info(`📦 Loading ${packIds.length} policy packs...`);

    for (const packId of packIds) {
      try {
        const pack = await this.loadPolicyPack(packId);
        this.policyPacks.set(packId, pack);
        
        // Load individual policies from pack
        for (const policy of pack.policies) {
          this.policies.set(policy.id, policy);
        }
        
        this.logger.info(`✅ Loaded policy pack: ${pack.name} (${pack.policies.length} policies)`);
        
      } catch (error) {
        this.logger.error(`❌ Failed to load policy pack ${packId}:`, error);
      }
    }
  }

  /**
   * Evaluate policies for a given context
   */
  async evaluatePolicy(context: PolicyContext): Promise<PolicyDecision> {
    const startTime = Date.now();
    
    try {
      // Get applicable policies for this context
      const applicablePolicies = this.getApplicablePolicies(context);
      
      if (applicablePolicies.length === 0) {
        return {
          allowed: true,
          reason: 'No applicable policies found',
          appliedPolicies: [],
          modifications: {}
        };
      }

      // Evaluate each policy
      const evaluationResults: PolicyEvaluationResult[] = [];
      
      for (const policy of applicablePolicies) {
        const result = await this.evaluateIndividualPolicy(policy, context);
        evaluationResults.push(result);
      }

      // Combine results (all must pass)
      const decision = this.combineEvaluationResults(evaluationResults);
      
      // Record evaluation for auditing
      const evaluation: PolicyEvaluation = {
        context,
        decision,
        appliedPolicies: applicablePolicies.map(p => p.id),
        evaluationTime: Date.now() - startTime,
        timestamp: Date.now()
      };
      
      this.evaluationHistory.push(evaluation);
      this.emit('policyEvaluated', evaluation);

      return decision;

    } catch (error) {
      this.logger.error('❌ Policy evaluation failed:', error);
      
      // Default to deny on evaluation error
      return {
        allowed: false,
        reason: `Policy evaluation failed: ${error.message}`,
        appliedPolicies: [],
        modifications: {}
      };
    }
  }

  /**
   * Check if an action is allowed
   */
  async canExecute(action: string, context: PolicyContext): Promise<boolean> {
    const decision = await this.evaluatePolicy({
      ...context,
      action
    });
    
    return decision.allowed;
  }

  /**
   * Add or update a policy
   */
  async addPolicy(policy: Policy): Promise<void> {
    // Validate policy structure
    this.validatePolicy(policy);
    
    this.policies.set(policy.id, policy);
    this.logger.info(`✅ Added policy: ${policy.name}`);
    
    this.emit('policyAdded', policy);
  }

  /**
   * Remove a policy
   */
  async removePolicy(policyId: string): Promise<void> {
    const policy = this.policies.get(policyId);
    if (policy) {
      this.policies.delete(policyId);
      this.logger.info(`🗑️ Removed policy: ${policy.name}`);
      this.emit('policyRemoved', policy);
    }
  }

  /**
   * Enable or disable a policy
   */
  async setPolicyStatus(policyId: string, enabled: boolean): Promise<void> {
    const policy = this.policies.get(policyId);
    if (policy) {
      policy.enabled = enabled;
      this.logger.info(`${enabled ? '✅' : '❌'} ${enabled ? 'Enabled' : 'Disabled'} policy: ${policy.name}`);
      this.emit('policyStatusChanged', { policy, enabled });
    }
  }

  /**
   * Get all policies
   */
  getPolicies(): Policy[] {
    return Array.from(this.policies.values());
  }

  /**
   * Get policies by type
   */
  getPoliciesByType(type: string): Policy[] {
    return Array.from(this.policies.values()).filter(p => p.type === type);
  }

  /**
   * Get policy evaluation history
   */
  getEvaluationHistory(limit: number = 100): PolicyEvaluation[] {
    return this.evaluationHistory
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Load default policies
   */
  private async loadDefaultPolicies(): Promise<void> {
    const defaultPolicies = [
      this.createCostCeilingPolicy(),
      this.createRateLimitPolicy(),
      this.createSecurityPolicy(),
      this.createCompliancePolicy(),
      this.createQualityGatePolicy()
    ];

    for (const policy of defaultPolicies) {
      this.policies.set(policy.id, policy);
    }

    this.logger.info(`✅ Loaded ${defaultPolicies.length} default policies`);
  }

  /**
   * Create cost ceiling policy
   */
  private createCostCeilingPolicy(): Policy {
    return {
      id: 'cost-ceiling-default',
      name: 'Cost Ceiling Policy',
      type: 'cost',
      rules: [
        {
          condition: 'context.requestCost > 10.0',
          action: 'deny',
          parameters: {
            message: 'Request exceeds per-request cost ceiling of $10.00'
          }
        },
        {
          condition: 'context.dailyCost + context.requestCost > 10000.0',
          action: 'deny',
          parameters: {
            message: 'Request would exceed daily cost ceiling of $10,000'
          }
        }
      ],
      priority: 100,
      enabled: true
    };
  }

  /**
   * Create rate limiting policy
   */
  private createRateLimitPolicy(): Policy {
    return {
      id: 'rate-limit-default',
      name: 'Rate Limiting Policy',
      type: 'performance',
      rules: [
        {
          condition: 'context.requestsPerMinute > 1000',
          action: 'throttle',
          parameters: {
            delay: 1000,
            message: 'Rate limit exceeded, throttling requests'
          }
        }
      ],
      priority: 90,
      enabled: true
    };
  }

  /**
   * Create security policy
   */
  private createSecurityPolicy(): Policy {
    return {
      id: 'security-default',
      name: 'Security Policy',
      type: 'security',
      rules: [
        {
          condition: 'context.containsSensitiveData === true',
          action: 'require-encryption',
          parameters: {
            encryptionLevel: 'AES-256'
          }
        },
        {
          condition: 'context.userRole === "anonymous"',
          action: 'deny',
          parameters: {
            message: 'Anonymous access not allowed for this resource'
          }
        }
      ],
      priority: 95,
      enabled: true
    };
  }

  /**
   * Create compliance policy
   */
  private createCompliancePolicy(): Policy {
    return {
      id: 'compliance-default',
      name: 'Compliance Policy',
      type: 'compliance',
      rules: [
        {
          condition: 'context.dataRegion === "EU" && context.gdprCompliance !== true',
          action: 'deny',
          parameters: {
            message: 'GDPR compliance required for EU data processing'
          }
        },
        {
          condition: 'context.dataType === "healthcare" && context.hipaaCompliance !== true',
          action: 'deny',
          parameters: {
            message: 'HIPAA compliance required for healthcare data'
          }
        }
      ],
      priority: 98,
      enabled: true
    };
  }

  /**
   * Create quality gate policy
   */
  private createQualityGatePolicy(): Policy {
    return {
      id: 'quality-gate-default',
      name: 'Quality Gate Policy',
      type: 'quality',
      rules: [
        {
          condition: 'context.qualityScore < 0.8',
          action: 'flag-for-review',
          parameters: {
            reviewType: 'quality-check',
            message: 'Quality score below threshold, flagged for review'
          }
        }
      ],
      priority: 70,
      enabled: true
    };
  }

  /**
   * Initialize policy evaluator
   */
  private async initializePolicyEvaluator(): Promise<void> {
    // Initialize the policy evaluation engine
    this.logger.info('⚙️ Policy evaluation engine initialized');
  }

  /**
   * Start policy monitoring
   */
  private startPolicyMonitoring(): void {
    // Monitor policy performance and compliance
    setInterval(async () => {
      await this.monitorPolicyCompliance();
    }, 60000); // Every minute
  }

  /**
   * Get applicable policies for context
   */
  private getApplicablePolicies(context: PolicyContext): Policy[] {
    return Array.from(this.policies.values())
      .filter(policy => policy.enabled)
      .filter(policy => this.isPolicyApplicable(policy, context))
      .sort((a, b) => b.priority - a.priority); // Higher priority first
  }

  /**
   * Check if policy is applicable to context
   */
  private isPolicyApplicable(policy: Policy, context: PolicyContext): boolean {
    // Policies are applicable by default unless they have specific scope restrictions
    // This could be enhanced with more sophisticated scoping logic
    return true;
  }

  /**
   * Evaluate individual policy
   */
  private async evaluateIndividualPolicy(
    policy: Policy, 
    context: PolicyContext
  ): Promise<PolicyEvaluationResult> {
    const startTime = Date.now();
    
    try {
      for (const rule of policy.rules) {
        const ruleResult = await this.evaluateRule(rule, context);
        
        if (!ruleResult.passed) {
          return {
            policy,
            passed: false,
            action: rule.action,
            reason: ruleResult.reason,
            parameters: rule.parameters,
            evaluationTime: Date.now() - startTime
          };
        }
      }

      return {
        policy,
        passed: true,
        action: 'allow',
        reason: 'All rules passed',
        parameters: {},
        evaluationTime: Date.now() - startTime
      };

    } catch (error) {
      return {
        policy,
        passed: false,
        action: 'deny',
        reason: `Policy evaluation error: ${error.message}`,
        parameters: {},
        evaluationTime: Date.now() - startTime
      };
    }
  }

  /**
   * Evaluate individual rule
   */
  private async evaluateRule(rule: any, context: PolicyContext): Promise<RuleEvaluationResult> {
    try {
      // Simple rule evaluation using condition strings
      // In a production system, this would use a proper rule engine
      const passed = !this.evaluateCondition(rule.condition, context);
      
      return {
        passed,
        reason: passed ? 'Rule condition not met' : rule.parameters?.message || 'Rule condition met'
      };
      
    } catch (error) {
      return {
        passed: false,
        reason: `Rule evaluation error: ${error.message}`
      };
    }
  }

  /**
   * Evaluate condition string against context
   */
  private evaluateCondition(condition: string, context: PolicyContext): boolean {
    try {
      // This is a simplified condition evaluator
      // In production, use a proper expression evaluator like jsonata or similar
      
      // Handle simple comparisons
      if (condition.includes(' > ')) {
        const [left, right] = condition.split(' > ');
        const leftValue = this.getContextValue(left.trim(), context);
        const rightValue = parseFloat(right.trim());
        return leftValue > rightValue;
      }
      
      if (condition.includes(' === ')) {
        const [left, right] = condition.split(' === ');
        const leftValue = this.getContextValue(left.trim(), context);
        const rightValue = right.trim().replace(/['"]/g, '');
        return leftValue === rightValue;
      }
      
      if (condition.includes(' !== ')) {
        const [left, right] = condition.split(' !== ');
        const leftValue = this.getContextValue(left.trim(), context);
        const rightValue = right.trim().replace(/['"]/g, '');
        return leftValue !== rightValue;
      }

      return false;
      
    } catch (error) {
      this.logger.warn(`⚠️ Condition evaluation failed: ${condition}`, error);
      return false;
    }
  }

  /**
   * Get value from context using dot notation
   */
  private getContextValue(path: string, context: any): any {
    if (path.startsWith('context.')) {
      path = path.substring(8); // Remove 'context.' prefix
    }
    
    const parts = path.split('.');
    let value = context;
    
    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  /**
   * Combine evaluation results from multiple policies
   */
  private combineEvaluationResults(results: PolicyEvaluationResult[]): PolicyDecision {
    const failedResults = results.filter(r => !r.passed);
    
    if (failedResults.length > 0) {
      // If any policy fails, the request is denied
      const primaryFailure = failedResults[0];
      
      return {
        allowed: false,
        reason: primaryFailure.reason,
        appliedPolicies: results.map(r => r.policy.id),
        modifications: this.collectModifications(results)
      };
    }

    return {
      allowed: true,
      reason: 'All policies passed',
      appliedPolicies: results.map(r => r.policy.id),
      modifications: this.collectModifications(results)
    };
  }

  /**
   * Collect modifications from policy results
   */
  private collectModifications(results: PolicyEvaluationResult[]): Record<string, unknown> {
    const modifications: Record<string, unknown> = {};
    
    for (const result of results) {
      if (result.action === 'throttle' && result.parameters?.delay) {
        modifications.throttleDelay = result.parameters.delay;
      }
      
      if (result.action === 'require-encryption' && result.parameters?.encryptionLevel) {
        modifications.requireEncryption = result.parameters.encryptionLevel;
      }
      
      if (result.action === 'flag-for-review') {
        modifications.flagForReview = true;
        modifications.reviewType = result.parameters?.reviewType;
      }
    }
    
    return modifications;
  }

  /**
   * Validate policy structure
   */
  private validatePolicy(policy: Policy): void {
    if (!policy.id) throw new Error('Policy must have an ID');
    if (!policy.name) throw new Error('Policy must have a name');
    if (!policy.type) throw new Error('Policy must have a type');
    if (!policy.rules || !Array.isArray(policy.rules)) throw new Error('Policy must have rules array');
    if (typeof policy.priority !== 'number') throw new Error('Policy must have numeric priority');
    if (typeof policy.enabled !== 'boolean') throw new Error('Policy must have boolean enabled flag');
    
    for (const rule of policy.rules) {
      if (!rule.condition) throw new Error('Rule must have condition');
      if (!rule.action) throw new Error('Rule must have action');
    }
  }

  /**
   * Load a policy pack
   */
  private async loadPolicyPack(packId: string): Promise<PolicyPack> {
    // This would load from database or file system
    // For now, return a default pack structure
    
    const defaultPacks: Record<string, PolicyPack> = {
      'cost-guardrails': {
        id: 'cost-guardrails',
        name: 'Cost Guardrails',
        version: '1.0.0',
        description: 'Enforces cost ceilings and budget limits',
        policies: [
          this.createCostCeilingPolicy()
        ]
      },
      'security-baseline': {
        id: 'security-baseline',
        name: 'Security Baseline',
        version: '1.0.0',
        description: 'Basic security policies for data protection',
        policies: [
          this.createSecurityPolicy()
        ]
      },
      'compliance-pack': {
        id: 'compliance-pack',
        name: 'Compliance Pack',
        version: '1.0.0',
        description: 'GDPR, HIPAA, and SOC2 compliance policies',
        policies: [
          this.createCompliancePolicy()
        ]
      }
    };

    const pack = defaultPacks[packId];
    if (!pack) {
      throw new Error(`Policy pack not found: ${packId}`);
    }

    return pack;
  }

  /**
   * Monitor policy compliance
   */
  private async monitorPolicyCompliance(): Promise<void> {
    try {
      const recentEvaluations = this.evaluationHistory.slice(-1000);
      const deniedRequests = recentEvaluations.filter(e => !e.decision.allowed);
      
      if (deniedRequests.length > 0) {
        const denyRate = deniedRequests.length / recentEvaluations.length;
        
        if (denyRate > 0.1) { // More than 10% denied
          this.emit('highDenyRate', {
            denyRate: denyRate * 100,
            deniedCount: deniedRequests.length,
            totalEvaluations: recentEvaluations.length
          });
        }
      }
      
    } catch (error) {
      this.logger.warn('⚠️ Policy compliance monitoring failed:', error);
    }
  }

  async getHealth(): Promise<ComponentHealth> {
    return {
      healthy: this.initialized,
      status: this.initialized ? 'active' : 'inactive',
      lastCheck: Date.now(),
      details: {
        totalPolicies: this.policies.size,
        enabledPolicies: Array.from(this.policies.values()).filter(p => p.enabled).length,
        policyPacks: this.policyPacks.size,
        recentEvaluations: this.evaluationHistory.length
      }
    };
  }

  async shutdown(): Promise<void> {
    this.logger.info('🔄 Shutting down policy engine...');
    this.initialized = false;
  }
}

// Type definitions
interface PolicyEngineConfig {
  defaultPolicies?: boolean;
}

interface PolicyPack {
  id: string;
  name: string;
  version: string;
  description: string;
  policies: Policy[];
}

interface PolicyEvaluation {
  context: PolicyContext;
  decision: PolicyDecision;
  appliedPolicies: string[];
  evaluationTime: number;
  timestamp: number;
}

interface PolicyEvaluationResult {
  policy: Policy;
  passed: boolean;
  action: string;
  reason: string;
  parameters: Record<string, unknown>;
  evaluationTime: number;
}

interface RuleEvaluationResult {
  passed: boolean;
  reason: string;
}

interface ComponentHealth {
  healthy: boolean;
  status: string;
  lastCheck: number;
  details?: Record<string, unknown>;
}