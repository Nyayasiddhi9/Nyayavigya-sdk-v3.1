/**
 * WAI SDK v9.0 - Service Provider Interfaces (SPIs)
 * Stable contracts for extensions and integrations with JSON Schema validation
 * Updated for Gap Closure runbook Phase B requirements
 * 
 * These interfaces define the stable contracts that external providers
 * must implement to plug into the WAI ecosystem with zero code changes.
 */

import { z } from 'zod';
import {
  AgentManifest,
  AgentExecutionRequest,
  AgentExecutionResponse,
  AgentHealthStatus,
  ConnectorConfig,
  ConnectorConnectionRequest,
  ConnectorConnectionResponse,
  ConnectorUploadRequest,
  ConnectorUploadResponse,
  ConnectorDownloadRequest,
  ConnectorDownloadResponse,
  ConnectorHealthCheckResponse,
  ConnectorMetricsResponse,
  OAuthProfile,
  SchemaValidator
} from '../schemas/spi-schemas';

// =============================================================================
// CORE SPI INTERFACES
// =============================================================================

/**
 * Agent SPI - Contract for implementing custom agents
 */
export interface AgentSPI {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly tier: AgentTier;
  readonly capabilities: string[];
  readonly readinessState: ReadinessState;
  readonly manifest: AgentManifest;
  
  // Core execution methods
  execute(task: AgentTask): Promise<AgentResult>;
  validate(input: unknown): Promise<ValidationResult>;
  getCapabilities(): Promise<AgentCapabilities>;
  healthCheck(): Promise<HealthStatus>;
  
  // Lifecycle methods
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  onPolicyUpdate(policies: Policy[]): Promise<void>;
}

/**
 * Model Adapter SPI - Contract for implementing LLM providers
 */
export interface ModelAdapterSPI {
  readonly providerId: string;
  readonly providerName: string;
  readonly version: string;
  readonly models: ModelInfo[];
  readonly capabilities: ModelCapability[];
  readonly pricing: PricingInfo;
  
  // Unified interface methods
  generate(request: GenerateRequest): Promise<GenerateResponse>;
  embed(request: EmbedRequest): Promise<EmbedResponse>;
  moderate(request: ModerateRequest): Promise<ModerateResponse>;
  transcribe(request: TranscribeRequest): Promise<TranscribeResponse>;
  render(request: RenderRequest): Promise<RenderResponse>;
  
  // Lifecycle and health
  initialize(): Promise<void>;
  healthCheck(): Promise<ProviderHealth>;
  getRateLimits(): Promise<RateLimitInfo>;
  getCosts(usage: UsageStats): Promise<CostCalculation>;
}

/**
 * MCP Connector SPI - Contract for implementing MCP integrations
 */
export interface MCPConnectorSPI {
  readonly connectorId: string;
  readonly connectorName: string;
  readonly version: string;
  readonly protocols: string[];
  readonly oauthProfiles: OAuthProfile[];
  
  // Connection methods
  connect(config: ConnectionConfig): Promise<ConnectionResult>;
  disconnect(): Promise<void>;
  authenticate(credentials: AuthCredentials): Promise<AuthResult>;
  
  // Data operations
  upload(request: UploadRequest): Promise<UploadResult>;
  download(request: DownloadRequest): Promise<DownloadResult>;
  webhook(event: WebhookEvent): Promise<WebhookResult>;
  
  // Health and monitoring
  healthCheck(): Promise<ConnectorHealth>;
  getMetrics(): Promise<ConnectorMetrics>;
}

/**
 * Policy Pack SPI - Contract for implementing policy packs
 */
export interface PolicyPackSPI {
  readonly packId: string;
  readonly packName: string;
  readonly version: string;
  readonly policies: Policy[];
  
  // Policy evaluation methods
  evaluate(context: PolicyContext): Promise<PolicyDecision>;
  canExecute(action: string, context: PolicyContext): Promise<boolean>;
  getApplicablePolicies(context: PolicyContext): Promise<Policy[]>;
  
  // Lifecycle methods
  activate(): Promise<void>;
  deactivate(): Promise<void>;
  update(newPolicies: Policy[]): Promise<void>;
}

/**
 * Quantum Adapter SPI - Contract for quantum computing providers
 */
export interface QuantumAdapterSPI {
  readonly providerId: string;
  readonly providerName: string;
  readonly version: string;
  readonly algorithms: QuantumAlgorithm[];
  readonly experimental: boolean;
  
  // Quantum operations
  optimize(problem: OptimizationProblem): Promise<QuantumResult>;
  simulate(circuit: QuantumCircuit): Promise<SimulationResult>;
  execute(job: QuantumJob): Promise<ExecutionResult>;
  
  // Provider capabilities
  getCapabilities(): Promise<QuantumCapabilities>;
  getQueueStatus(): Promise<QueueStatus>;
  estimateCost(job: QuantumJob): Promise<CostEstimate>;
}

// =============================================================================
// JSON SCHEMA DEFINITIONS
// =============================================================================

/**
 * Pipeline JSON Schema
 */
export const PipelineSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  description: z.string().optional(),
  steps: z.array(z.object({
    id: z.string(),
    use: z.string(),
    config: z.record(z.unknown()).optional(),
    modelHint: z.string().optional(),
    policy: z.string().optional(),
    retry: z.string().optional(),
    timeout: z.number().optional()
  })),
  policies: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional()
});

/**
 * Agent Manifest JSON Schema
 */
export const AgentManifestSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  tier: z.enum(['executive', 'development', 'creative', 'qa', 'devops', 'domain-specialist']),
  description: z.string(),
  capabilities: z.array(z.string()),
  readinessState: z.enum(['alpha', 'beta', 'ga']),
  io: z.object({
    input: z.record(z.unknown()),
    output: z.record(z.unknown())
  }),
  costs: z.object({
    baseCost: z.number(),
    perToken: z.number().optional(),
    perSecond: z.number().optional()
  }),
  safetyScopes: z.array(z.string()),
  sla: z.object({
    availability: z.number(),
    responseTime: z.number(),
    errorRate: z.number()
  }),
  metadata: z.record(z.unknown()).optional()
});

/**
 * Model Adapter JSON Schema
 */
export const ModelAdapterSchema = z.object({
  providerId: z.string(),
  providerName: z.string(),
  version: z.string(),
  models: z.array(z.object({
    id: z.string(),
    name: z.string(),
    capabilities: z.array(z.string()),
    contextLength: z.number(),
    pricing: z.object({
      inputTokens: z.number(),
      outputTokens: z.number(),
      requestCost: z.number().optional()
    }),
    rateLimits: z.object({
      requestsPerMinute: z.number(),
      tokensPerMinute: z.number()
    })
  })),
  healthEndpoint: z.string().optional(),
  authMethod: z.enum(['api-key', 'oauth', 'none']),
  metadata: z.record(z.unknown()).optional()
});

/**
 * Policy Pack JSON Schema
 */
export const PolicyPackSchema = z.object({
  packId: z.string(),
  packName: z.string(),
  version: z.string(),
  description: z.string(),
  policies: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['cost', 'security', 'compliance', 'performance', 'quality']),
    rules: z.array(z.object({
      condition: z.string(),
      action: z.string(),
      parameters: z.record(z.unknown()).optional()
    })),
    priority: z.number(),
    enabled: z.boolean()
  })),
  scope: z.object({
    tenants: z.array(z.string()).optional(),
    projects: z.array(z.string()).optional(),
    agents: z.array(z.string()).optional()
  }),
  metadata: z.record(z.unknown()).optional()
});

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type AgentTier = 'executive' | 'development' | 'creative' | 'qa' | 'devops' | 'domain-specialist';
export type ReadinessState = 'alpha' | 'beta' | 'ga';
export type ModelCapability = 'generate' | 'embed' | 'moderate' | 'transcribe' | 'render' | 'multimodal';

export interface AgentManifest {
  id: string;
  name: string;
  version: string;
  tier: AgentTier;
  description: string;
  capabilities: string[];
  readinessState: ReadinessState;
  io: {
    input: Record<string, unknown>;
    output: Record<string, unknown>;
  };
  costs: {
    baseCost: number;
    perToken?: number;
    perSecond?: number;
  };
  safetyScopes: string[];
  sla: {
    availability: number;
    responseTime: number;
    errorRate: number;
  };
}

export interface AgentTask {
  id: string;
  type: string;
  input: Record<string, unknown>;
  context: TaskContext;
  constraints: TaskConstraints;
}

export interface AgentResult {
  success: boolean;
  output: Record<string, unknown>;
  metrics: TaskMetrics;
  cost: CostBreakdown;
  quality: QualityScore;
}

export interface AgentCapabilities {
  supported: string[];
  experimental: string[];
  deprecated: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface HealthStatus {
  healthy: boolean;
  status: string;
  lastCheck: number;
  details: Record<string, unknown>;
}

export interface ModelInfo {
  id: string;
  name: string;
  capabilities: ModelCapability[];
  contextLength: number;
  pricing: ModelPricing;
  rateLimits: RateLimitInfo;
}

export interface ModelPricing {
  inputTokens: number;
  outputTokens: number;
  requestCost?: number;
}

export interface GenerateRequest {
  model: string;
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  tools?: Tool[];
}

export interface GenerateResponse {
  id: string;
  choices: Choice[];
  usage: TokenUsage;
  cost: number;
  latency: number;
}

export interface EmbedRequest {
  model: string;
  input: string | string[];
  dimensions?: number;
}

export interface EmbedResponse {
  embeddings: number[][];
  usage: TokenUsage;
  cost: number;
}

export interface ModerateRequest {
  model: string;
  input: string;
}

export interface ModerateResponse {
  flagged: boolean;
  categories: ModerationCategory[];
  scores: Record<string, number>;
}

export interface TranscribeRequest {
  model: string;
  audio: Buffer;
  format: string;
  language?: string;
}

export interface TranscribeResponse {
  text: string;
  confidence: number;
  segments: TranscriptionSegment[];
  cost: number;
}

export interface RenderRequest {
  model: string;
  prompt: string;
  resolution: string;
  style?: string;
}

export interface RenderResponse {
  images: GeneratedImage[];
  cost: number;
  metadata: Record<string, unknown>;
}

export interface Policy {
  id: string;
  name: string;
  type: string;
  rules: PolicyRule[];
  priority: number;
  enabled: boolean;
}

export interface PolicyRule {
  condition: string;
  action: string;
  parameters?: Record<string, unknown>;
}

export interface PolicyContext {
  tenant: string;
  project: string;
  user: string;
  agent: string;
  model?: string;
  cost: number;
  requestType: string;
  metadata: Record<string, unknown>;
}

export interface PolicyDecision {
  allowed: boolean;
  reason: string;
  appliedPolicies: string[];
  modifications?: Record<string, unknown>;
}

export interface QuantumAlgorithm {
  id: string;
  name: string;
  type: 'annealing' | 'gate' | 'hybrid';
  capabilities: string[];
}

export interface OptimizationProblem {
  type: string;
  parameters: Record<string, unknown>;
  constraints: Record<string, unknown>;
}

export interface QuantumResult {
  solution: Record<string, unknown>;
  energy: number;
  confidence: number;
  iterations: number;
  executionTime: number;
}

// Helper types
export interface TaskContext {
  tenant: string;
  project: string;
  user: string;
  session: string;
  metadata: Record<string, unknown>;
}

export interface TaskConstraints {
  maxCost: number;
  maxTime: number;
  quality: number;
  policies: string[];
}

export interface TaskMetrics {
  executionTime: number;
  tokensUsed: number;
  apiCalls: number;
  retries: number;
}

export interface CostBreakdown {
  total: number;
  llm: number;
  compute: number;
  storage: number;
  network: number;
}

export interface QualityScore {
  overall: number;
  accuracy: number;
  completeness: number;
  relevance: number;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

export interface RateLimitInfo {
  requestsPerMinute: number;
  tokensPerMinute: number;
  remaining: number;
  resetAt: number;
}

export interface ProviderHealth {
  available: boolean;
  latency: number;
  errorRate: number;
  quotaRemaining: number;
}

export interface UsageStats {
  requests: number;
  tokens: number;
  computeTime: number;
}

export interface CostCalculation {
  estimated: number;
  breakdown: CostBreakdown;
  currency: string;
}

export interface Message {
  role: string;
  content: string;
}

export interface Choice {
  message: Message;
  finishReason: string;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface Tool {
  type: string;
  function: ToolFunction;
}

export interface ToolFunction {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ModerationCategory {
  category: string;
  flagged: boolean;
  score: number;
}

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
  confidence: number;
}

export interface GeneratedImage {
  url: string;
  base64?: string;
  metadata: Record<string, unknown>;
}

export interface ConnectionConfig {
  endpoint: string;
  credentials: AuthCredentials;
  options?: Record<string, unknown>;
}

export interface ConnectionResult {
  connected: boolean;
  sessionId: string;
  metadata: Record<string, unknown>;
}

export interface AuthCredentials {
  type: 'api-key' | 'oauth' | 'basic';
  data: Record<string, unknown>;
}

export interface AuthResult {
  authenticated: boolean;
  token: string;
  expiresAt: number;
}

export interface UploadRequest {
  data: Buffer;
  contentType: string;
  filename: string;
  metadata?: Record<string, unknown>;
}

export interface UploadResult {
  id: string;
  url: string;
  signedUrl?: string;
  metadata: Record<string, unknown>;
}

export interface DownloadRequest {
  id: string;
  options?: Record<string, unknown>;
}

export interface DownloadResult {
  data: Buffer;
  contentType: string;
  metadata: Record<string, unknown>;
}

export interface WebhookEvent {
  type: string;
  source: string;
  data: Record<string, unknown>;
  timestamp: number;
}

export interface WebhookResult {
  processed: boolean;
  response: Record<string, unknown>;
}

export interface ConnectorHealth {
  connected: boolean;
  latency: number;
  lastCheck: number;
  errors: string[];
}

export interface ConnectorMetrics {
  requests: number;
  successRate: number;
  avgLatency: number;
  dataTransferred: number;
}

export interface OAuthProfile {
  provider: string;
  scopes: string[];
  redirectUri: string;
}

export interface PricingInfo {
  model: string;
  currency: string;
  rates: PricingRate[];
}

export interface PricingRate {
  type: 'token' | 'request' | 'time';
  rate: number;
  unit: string;
}

export interface QuantumCapabilities {
  maxQubits: number;
  algorithms: string[];
  coherenceTime: number;
  fidelity: number;
}

export interface QueueStatus {
  position: number;
  estimatedWait: number;
  queueLength: number;
}

export interface CostEstimate {
  estimated: number;
  currency: string;
  breakdown: Record<string, number>;
}

export interface QuantumCircuit {
  qubits: number;
  gates: QuantumGate[];
  measurements: QuantumMeasurement[];
}

export interface QuantumGate {
  type: string;
  qubits: number[];
  parameters?: number[];
}

export interface QuantumMeasurement {
  qubit: number;
  basis: string;
}

export interface QuantumJob {
  circuit: QuantumCircuit;
  shots: number;
  options?: Record<string, unknown>;
}

export interface SimulationResult {
  counts: Record<string, number>;
  statevector?: number[];
  metadata: Record<string, unknown>;
}

export interface ExecutionResult {
  jobId: string;
  counts: Record<string, number>;
  executionTime: number;
  cost: number;
  metadata: Record<string, unknown>;
}

// Export all schemas as types for validation
export type PipelineConfig = z.infer<typeof PipelineSchema>;
export type AgentManifestConfig = z.infer<typeof AgentManifestSchema>;
export type ModelAdapterConfig = z.infer<typeof ModelAdapterSchema>;
export type PolicyPackConfig = z.infer<typeof PolicyPackSchema>;