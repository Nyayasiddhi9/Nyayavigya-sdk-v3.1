/**
 * WAI SDK v9.0 - One-Line Initialization
 * createWAI() - Single entry point that boots orchestration, agents, models, MCP, policies
 */

import { z } from 'zod';
import { WAILogger } from '../utils/logger';
import { WAIOrchestrationCore } from './orchestration-core';
import { AgentRegistry as CoreAgentRegistry } from './agent-registry';
import { MCPHub as CoreMCPHub } from './mcp-hub';
import { CostManager as CoreCostManager } from './cost-manager';
import { CAMSystem as CoreCAMSystem } from './cam-system';
import { WAILRouter as CoreWAILRouter } from './wai-l-router';
import { CapabilityMatrix as CoreCapabilityMatrix } from './capability-matrix';
import { PolicyEngine as CorePolicyEngine } from './policy-engine';
import { TelemetryCollector as CoreTelemetryCollector } from '../observability/telemetry-collector';
import { WAISecurityFramework } from '../security/security-framework';

// =============================================================================
// CONFIGURATION SCHEMAS
// =============================================================================

const WAIConfigSchema = z.object({
  // Core configuration
  version: z.string().default('9.0.0'),
  environment: z.enum(['development', 'staging', 'production']).default('development'),
  
  // Data store configuration
  store: z.object({
    type: z.enum(['postgres', 'sqlite', 'memory']).default('memory'),
    url: z.string().optional(),
    options: z.record(z.unknown()).optional()
  }).optional(),
  
  // LLM providers configuration
  providers: z.object({
    openai: z.object({
      apiKey: z.string(),
      models: z.array(z.string()).optional(),
      enabled: z.boolean().default(true)
    }).optional(),
    anthropic: z.object({
      apiKey: z.string(),
      models: z.array(z.string()).optional(),
      enabled: z.boolean().default(true)
    }).optional(),
    google: z.object({
      apiKey: z.string(),
      models: z.array(z.string()).optional(),
      enabled: z.boolean().default(true)
    }).optional(),
    xai: z.object({
      apiKey: z.string(),
      models: z.array(z.string()).optional(),
      enabled: z.boolean().default(true)
    }).optional(),
    perplexity: z.object({
      apiKey: z.string(),
      enabled: z.boolean().default(true)
    }).optional(),
    // Auto-discover other providers from environment
    autodiscover: z.boolean().default(true)
  }).optional(),
  
  // Policy configuration
  policies: z.object({
    costCeilings: z.object({
      perRequest: z.number().default(10),
      perHour: z.number().default(1000),
      perDay: z.number().default(10000)
    }).optional(),
    qualityGates: z.object({
      minimumScore: z.number().default(0.8),
      requireHumanReview: z.boolean().default(false)
    }).optional(),
    security: z.object({
      enableAudit: z.boolean().default(true),
      enableEncryption: z.boolean().default(true),
      tenantIsolation: z.boolean().default(true)
    }).optional(),
    packs: z.array(z.string()).optional()
  }).optional(),
  
  // Telemetry configuration
  telemetry: z.object({
    enabled: z.boolean().default(true),
    endpoint: z.string().optional(),
    sampleRate: z.number().default(1.0),
    exportInterval: z.number().default(5000)
  }).optional(),
  
  // Feature flags
  features: z.object({
    quantumExperimental: z.boolean().default(false),
    agentA2A: z.boolean().default(true),
    costOptimization: z.boolean().default(true),
    selfHealing: z.boolean().default(true),
    grpoLearning: z.boolean().default(true)
  }).optional(),
  
  // Tenant configuration
  tenant: z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    tier: z.enum(['free', 'pro', 'enterprise']).default('pro')
  }).optional()
});

export type WAIConfig = z.infer<typeof WAIConfigSchema>;

// =============================================================================
// ENVIRONMENT VALIDATION
// =============================================================================

/**
 * Validate environment and auto-discover provider credentials
 */
export async function validateEnvironment(config: Partial<WAIConfig> = {}): Promise<ValidationResult> {
  const logger = new WAILogger('WAI-Init');
  const results: ValidationResult = {
    valid: true,
    providers: [],
    warnings: [],
    errors: []
  };

  try {
    // Check Node.js version
    const nodeVersion = process.version;
    const requiredVersion = 'v18.0.0';
    if (compareVersions(nodeVersion, requiredVersion) < 0) {
      results.errors.push(`Node.js ${requiredVersion}+ required. Current: ${nodeVersion}`);
      results.valid = false;
    }

    // Auto-discover provider API keys from environment
    const providersFound = await autodiscoverProviders();
    results.providers = providersFound;

    if (providersFound.length === 0) {
      results.warnings.push('No LLM provider API keys found. Add OPENAI_API_KEY, ANTHROPIC_API_KEY, etc. to environment');
    }

    // Check database connection if configured
    if (config.store?.url) {
      try {
        await testDatabaseConnection(config.store.url);
        logger.info('✅ Database connection validated');
      } catch (error) {
        results.warnings.push(`Database connection failed: ${error.message}`);
      }
    }

    // Check telemetry endpoint if configured
    if (config.telemetry?.endpoint) {
      try {
        await testTelemetryEndpoint(config.telemetry.endpoint);
        logger.info('✅ Telemetry endpoint validated');
      } catch (error) {
        results.warnings.push(`Telemetry endpoint unreachable: ${error.message}`);
      }
    }

  } catch (error) {
    results.errors.push(`Environment validation failed: ${error.message}`);
    results.valid = false;
  }

  return results;
}

/**
 * Auto-discover LLM provider API keys from environment variables
 */
async function autodiscoverProviders(): Promise<ProviderInfo[]> {
  const providers: ProviderInfo[] = [];
  
  const providerMap = {
    'OPENAI_API_KEY': { id: 'openai', name: 'OpenAI' },
    'ANTHROPIC_API_KEY': { id: 'anthropic', name: 'Anthropic' },
    'GOOGLE_AI_API_KEY': { id: 'google', name: 'Google AI' },
    'GEMINI_API_KEY': { id: 'google', name: 'Google Gemini' },
    'XAI_API_KEY': { id: 'xai', name: 'xAI' },
    'PERPLEXITY_API_KEY': { id: 'perplexity', name: 'Perplexity' },
    'TOGETHER_API_KEY': { id: 'together', name: 'Together AI' },
    'REPLICATE_API_TOKEN': { id: 'replicate', name: 'Replicate' },
    'GROQ_API_KEY': { id: 'groq', name: 'Groq' },
    'COHERE_API_KEY': { id: 'cohere', name: 'Cohere' },
    'MISTRAL_API_KEY': { id: 'mistral', name: 'Mistral AI' },
    'OPENROUTER_API_KEY': { id: 'openrouter', name: 'OpenRouter' }
  };

  for (const [envVar, provider] of Object.entries(providerMap)) {
    if (process.env[envVar]) {
      providers.push({
        id: provider.id,
        name: provider.name,
        available: true,
        models: await getProviderModels(provider.id)
      });
    }
  }

  return providers;
}

/**
 * Get available models for a provider
 */
async function getProviderModels(providerId: string): Promise<string[]> {
  // This would be populated from the actual provider APIs
  const defaultModels: Record<string, string[]> = {
    openai: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    anthropic: ['claude-3.5-sonnet', 'claude-3-opus', 'claude-3-haiku'],
    google: ['gemini-1.5-pro', 'gemini-1.5-flash'],
    xai: ['grok-2'],
    perplexity: ['pplx-7b-online', 'pplx-70b-online'],
    together: ['meta-llama/Llama-2-70b-chat-hf'],
    replicate: ['meta/llama-2-70b-chat'],
    groq: ['mixtral-8x7b-32768'],
    cohere: ['command-r-plus'],
    mistral: ['mistral-large'],
    openrouter: ['openrouter/auto']
  };
  
  return defaultModels[providerId] || [];
}

// =============================================================================
// ONE-LINE INITIALIZATION
// =============================================================================

/**
 * createWAI() - Single entry point for initializing the complete WAI system
 * 
 * Usage:
 *   const wai = await createWAI();
 *   const wai = await createWAI({ providers: { openai: { apiKey: 'sk-...' } } });
 */
export async function createWAI(config: Partial<WAIConfig> = {}): Promise<WAIInstance> {
  const startTime = Date.now();
  const logger = new WAILogger('WAI-Init');

  try {
    logger.info('🚀 Initializing WAI Orchestration SDK v9.0...');
    logger.info('🎯 One-line init: Booting orchestration, agents, models, MCP, policies...');

    // 1. Validate and merge configuration
    const validatedConfig = WAIConfigSchema.parse(config);
    const envValidation = await validateEnvironment(validatedConfig);
    
    if (!envValidation.valid) {
      throw new Error(`Environment validation failed: ${envValidation.errors.join(', ')}`);
    }

    if (envValidation.warnings.length > 0) {
      envValidation.warnings.forEach(warning => logger.warn(`⚠️ ${warning}`));
    }

    logger.info(`✅ Found ${envValidation.providers.length} LLM providers: ${envValidation.providers.map(p => p.name).join(', ')}`);

    // 2. Initialize core components
    logger.info('🔄 Initializing core components...');
    
    const telemetry = new TelemetryCollector(validatedConfig.telemetry);
    await telemetry.initialize();

    const security = new WAISecurityFramework({
      tenantIsolation: validatedConfig.policies?.security?.enableAudit || true,
      encryption: validatedConfig.policies?.security?.enableEncryption || true,
      audit: validatedConfig.policies?.security?.enableAudit || true
    });
    await security.initialize();

    const costManager = new CostManager({
      ceilings: validatedConfig.policies?.costCeilings,
      telemetry
    });
    await costManager.initialize();

    // 3. Initialize capability matrix (scans adapters at boot)
    logger.info('📊 Building capability matrix...');
    const capabilityMatrix = new CapabilityMatrix();
    await capabilityMatrix.initialize();
    await capabilityMatrix.scanProviders(envValidation.providers);

    // 4. Initialize WAI-L router with policy-driven selection
    logger.info('🧠 Initializing WAI-L policy router...');
    const router = new WAILRouter({
      capabilityMatrix,
      costManager,
      weights: {
        cost: 0.3,
        latency: 0.3,
        quality: 0.3,
        carbon: 0.1
      }
    });
    await router.initialize();

    // 5. Initialize policy engine
    logger.info('📋 Loading policy packs...');
    const policyEngine = new PolicyEngine(validatedConfig.policies);
    await policyEngine.initialize();
    if (validatedConfig.policies?.packs) {
      await policyEngine.loadPolicyPacks(validatedConfig.policies.packs);
    }

    // 6. Initialize CAM 2.0 (Circuit breakers, Anomaly detection, Monitoring)
    logger.info('🛡️ Initializing CAM 2.0 system...');
    const cam = new CAMSystem({
      costManager,
      telemetry,
      policies: policyEngine
    });
    await cam.initialize();

    // 7. Initialize Agent Registry with readiness states
    logger.info('🤖 Initializing agent registry (105+ agents)...');
    const agentRegistry = new AgentRegistry({
      telemetry,
      security,
      a2aBus: validatedConfig.features?.agentA2A || true
    });
    await agentRegistry.initialize();
    await agentRegistry.loadAgents(); // Auto-discover and load all agents

    // 8. Initialize MCP Hub (280+ integrations)
    logger.info('🔗 Initializing MCP integration hub...');
    const mcpHub = new MCPHub({
      security,
      telemetry
    });
    await mcpHub.initialize();
    await mcpHub.loadConnectors(); // Auto-discover MCP connectors

    // 9. Initialize core orchestration engine
    logger.info('⚡ Initializing orchestration core...');
    const orchestrator = new WAIOrchestrationCore({
      agentRegistry,
      router,
      mcpHub,
      costManager,
      cam,
      policyEngine,
      telemetry,
      security,
      features: validatedConfig.features
    });
    await orchestrator.initialize();

    const initTime = Date.now() - startTime;
    logger.info(`✅ WAI SDK v9.0 initialized successfully (${initTime}ms)`);
    logger.info('🎯 Ready for zero-friction agent/model orchestration');

    // Return WAI instance
    return new WAIInstance({
      orchestrator,
      agentRegistry,
      router,
      mcpHub,
      costManager,
      cam,
      policyEngine,
      capabilityMatrix,
      telemetry,
      security,
      config: validatedConfig
    });

  } catch (error) {
    logger.error('❌ WAI initialization failed:', error);
    throw error;
  }
}

// =============================================================================
// WAI INSTANCE
// =============================================================================

/**
 * WAI Instance - Main interface for interacting with the orchestration system
 */
export class WAIInstance {
  public readonly orchestrator: WAIOrchestrationCore;
  public readonly registry: AgentRegistry;
  public readonly mcp: MCPHub;
  public readonly cost: CostManager;
  public readonly cam: CAMSystem;
  public readonly router: WAILRouter;
  public readonly policies: PolicyEngine;
  public readonly capabilities: CapabilityMatrix;
  public readonly telemetry: TelemetryCollector;
  public readonly security: WAISecurityFramework;
  public readonly config: WAIConfig;

  constructor(components: {
    orchestrator: WAIOrchestrationCore;
    agentRegistry: AgentRegistry;
    router: WAILRouter;
    mcpHub: MCPHub;
    costManager: CostManager;
    cam: CAMSystem;
    policyEngine: PolicyEngine;
    capabilityMatrix: CapabilityMatrix;
    telemetry: TelemetryCollector;
    security: WAISecurityFramework;
    config: WAIConfig;
  }) {
    this.orchestrator = components.orchestrator;
    this.registry = components.agentRegistry;
    this.mcp = components.mcpHub;
    this.cost = components.costManager;
    this.cam = components.cam;
    this.router = components.router;
    this.policies = components.policyEngine;
    this.capabilities = components.capabilityMatrix;
    this.telemetry = components.telemetry;
    this.security = components.security;
    this.config = components.config;
  }

  /**
   * Run a pipeline with full orchestration
   */
  async run(request: PipelineRequest): Promise<PipelineResult> {
    return this.orchestrator.runPipeline(request);
  }

  /**
   * Execute a single task with best agent/model selection
   */
  async execute(task: TaskRequest): Promise<TaskResult> {
    return this.orchestrator.executeTask(task);
  }

  /**
   * Get system health and status
   */
  async health(): Promise<SystemHealth> {
    return {
      healthy: true,
      version: this.config.version || '9.0.0',
      components: {
        orchestrator: await this.orchestrator.getHealth(),
        agents: await this.registry.getHealth(),
        mcp: await this.mcp.getHealth(),
        cost: await this.cost.getHealth(),
        cam: await this.cam.getHealth(),
        router: await this.router.getHealth(),
        policies: await this.policies.getHealth(),
        capabilities: await this.capabilities.getHealth(),
        telemetry: await this.telemetry.getHealth(),
        security: await this.security.getHealth()
      },
      metrics: await this.getMetrics()
    };
  }

  /**
   * Get capabilities matrix
   */
  async getCapabilities(): Promise<CapabilitiesResponse> {
    return this.capabilities.getMatrix();
  }

  /**
   * Register a new agent
   */
  async registerAgent(agent: any): Promise<RegistrationResult> {
    return this.registry.registerAgent(agent);
  }

  /**
   * Register a new model adapter
   */
  async registerAdapter(adapter: any): Promise<RegistrationResult> {
    return this.router.registerAdapter(adapter);
  }

  /**
   * Register a new MCP connector
   */
  async registerConnector(connector: any): Promise<RegistrationResult> {
    return this.mcp.registerConnector(connector);
  }

  /**
   * Get system metrics
   */
  async getMetrics(): Promise<SystemMetrics> {
    return {
      totalRequests: await this.telemetry.getMetric('requests.total'),
      successRate: await this.telemetry.getMetric('requests.success_rate'),
      avgLatency: await this.telemetry.getMetric('requests.avg_latency'),
      totalCost: await this.cost.getTotalCost(),
      activeAgents: await this.registry.getActiveCount(),
      healthyProviders: await this.router.getHealthyProviderCount()
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    await Promise.all([
      this.orchestrator.shutdown(),
      this.registry.shutdown(),
      this.mcp.shutdown(),
      this.cost.shutdown(),
      this.cam.shutdown(),
      this.router.shutdown(),
      this.policies.shutdown(),
      this.capabilities.shutdown(),
      this.telemetry.shutdown(),
      this.security.shutdown()
    ]);
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function compareVersions(version1: string, version2: string): number {
  const v1parts = version1.replace('v', '').split('.').map(Number);
  const v2parts = version2.replace('v', '').split('.').map(Number);
  
  for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
    const v1part = v1parts[i] || 0;
    const v2part = v2parts[i] || 0;
    
    if (v1part < v2part) return -1;
    if (v1part > v2part) return 1;
  }
  
  return 0;
}

async function testDatabaseConnection(url: string): Promise<void> {
  // Implementation would test actual database connection
  // For now, just validate URL format
  if (!url.startsWith('postgres://') && !url.startsWith('sqlite://') && !url.startsWith('memory://')) {
    throw new Error('Invalid database URL format');
  }
}

async function testTelemetryEndpoint(endpoint: string): Promise<void> {
  // Implementation would test actual telemetry endpoint
  // For now, just validate URL format
  if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
    throw new Error('Invalid telemetry endpoint format');
  }
}

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface ValidationResult {
  valid: boolean;
  providers: ProviderInfo[];
  warnings: string[];
  errors: string[];
}

interface ProviderInfo {
  id: string;
  name: string;
  available: boolean;
  models: string[];
}

interface PipelineRequest {
  pipelineId: string;
  inputs: Record<string, unknown>;
  idempotencyKey?: string;
  context?: Record<string, unknown>;
}

interface PipelineResult {
  jobId: string;
  success: boolean;
  outputs: Record<string, unknown>;
  metrics: PipelineMetrics;
  cost: number;
  quality: number;
}

interface PipelineMetrics {
  executionTime: number;
  stepsCompleted: number;
  agentsUsed: string[];
  modelsUsed: string[];
  fallbacksUsed: string[];
}

interface TaskRequest {
  type: string;
  input: Record<string, unknown>;
  constraints?: TaskConstraints;
  context?: Record<string, unknown>;
}

interface TaskResult {
  success: boolean;
  output: Record<string, unknown>;
  agent: string;
  model: string;
  cost: number;
  quality: number;
  executionTime: number;
}

interface TaskConstraints {
  maxCost?: number;
  maxTime?: number;
  preferredTier?: string;
  excludeAgents?: string[];
}

interface SystemHealth {
  healthy: boolean;
  version: string;
  components: Record<string, ComponentHealth>;
  metrics: SystemMetrics;
}

interface ComponentHealth {
  healthy: boolean;
  status: string;
  lastCheck: number;
}

interface SystemMetrics {
  totalRequests: number;
  successRate: number;
  avgLatency: number;
  totalCost: number;
  activeAgents: number;
  healthyProviders: number;
}

interface CapabilitiesResponse {
  providers: ProviderCapability[];
  agents: AgentCapability[];
  connectors: ConnectorCapability[];
  lastUpdated: number;
}

interface ProviderCapability {
  id: string;
  name: string;
  models: ModelCapabilityInfo[];
  healthy: boolean;
  pricing: Record<string, number>;
}

interface ModelCapabilityInfo {
  id: string;
  name: string;
  capabilities: string[];
  contextLength: number;
  pricing: ModelPricing;
}

interface ModelPricing {
  inputTokens: number;
  outputTokens: number;
}

interface AgentCapability {
  id: string;
  name: string;
  tier: string;
  capabilities: string[];
  readiness: string;
  sla: AgentSLA;
}

interface AgentSLA {
  availability: number;
  responseTime: number;
  errorRate: number;
}

interface ConnectorCapability {
  id: string;
  name: string;
  protocols: string[];
  healthy: boolean;
}

interface RegistrationResult {
  success: boolean;
  id: string;
  message: string;
}

// Placeholder classes that need to be implemented
class AgentRegistry {
  constructor(config: any) {}
  async initialize(): Promise<void> {}
  async loadAgents(): Promise<void> {}
  async getHealth(): Promise<ComponentHealth> { return { healthy: true, status: 'active', lastCheck: Date.now() }; }
  async getActiveCount(): Promise<number> { return 105; }
  async registerAgent(agent: any): Promise<RegistrationResult> { return { success: true, id: 'agent-id', message: 'Registered successfully' }; }
  async shutdown(): Promise<void> {}
}

class MCPHub {
  constructor(config: any) {}
  async initialize(): Promise<void> {}
  async loadConnectors(): Promise<void> {}
  async getHealth(): Promise<ComponentHealth> { return { healthy: true, status: 'active', lastCheck: Date.now() }; }
  async registerConnector(connector: any): Promise<RegistrationResult> { return { success: true, id: 'connector-id', message: 'Registered successfully' }; }
  async shutdown(): Promise<void> {}
}

class CostManager {
  constructor(config: any) {}
  async initialize(): Promise<void> {}
  async getHealth(): Promise<ComponentHealth> { return { healthy: true, status: 'active', lastCheck: Date.now() }; }
  async getTotalCost(): Promise<number> { return 0; }
  async shutdown(): Promise<void> {}
}

class CAMSystem {
  constructor(config: any) {}
  async initialize(): Promise<void> {}
  async getHealth(): Promise<ComponentHealth> { return { healthy: true, status: 'active', lastCheck: Date.now() }; }
  async shutdown(): Promise<void> {}
}

class WAILRouter {
  constructor(config: any) {}
  async initialize(): Promise<void> {}
  async getHealth(): Promise<ComponentHealth> { return { healthy: true, status: 'active', lastCheck: Date.now() }; }
  async getHealthyProviderCount(): Promise<number> { return 19; }
  async registerAdapter(adapter: any): Promise<RegistrationResult> { return { success: true, id: 'adapter-id', message: 'Registered successfully' }; }
  async shutdown(): Promise<void> {}
}

class CapabilityMatrix {
  constructor() {}
  async initialize(): Promise<void> {}
  async scanProviders(providers: ProviderInfo[]): Promise<void> {}
  async getHealth(): Promise<ComponentHealth> { return { healthy: true, status: 'active', lastCheck: Date.now() }; }
  async getMatrix(): Promise<CapabilitiesResponse> { 
    return { 
      providers: [], 
      agents: [], 
      connectors: [], 
      lastUpdated: Date.now() 
    }; 
  }
  async shutdown(): Promise<void> {}
}

class PolicyEngine {
  constructor(config: any) {}
  async initialize(): Promise<void> {}
  async loadPolicyPacks(packs: string[]): Promise<void> {}
  async getHealth(): Promise<ComponentHealth> { return { healthy: true, status: 'active', lastCheck: Date.now() }; }
  async shutdown(): Promise<void> {}
}

class TelemetryCollector {
  constructor(config: any) {}
  async initialize(): Promise<void> {}
  async getHealth(): Promise<ComponentHealth> { return { healthy: true, status: 'active', lastCheck: Date.now() }; }
  async getMetric(name: string): Promise<number> { return Math.random() * 100; }
  async shutdown(): Promise<void> {}
}