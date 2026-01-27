'use strict';

var zod = require('zod');
var crypto = require('crypto');
var events = require('events');

// src/interfaces/storage-adapter.ts
var MemoryStorageAdapter = class {
  store = /* @__PURE__ */ new Map();
  async get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expires && Date.now() > entry.expires) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }
  async set(key, value, options) {
    const entry = { value };
    if (options?.ttl) {
      entry.expires = Date.now() + options.ttl * 1e3;
    }
    this.store.set(key, entry);
  }
  async delete(key) {
    return this.store.delete(key);
  }
  async query(filter, options) {
    let results = [];
    for (const [, entry] of this.store) {
      if (entry.expires && Date.now() > entry.expires) continue;
      const matches = Object.entries(filter).every(([key, value]) => {
        const obj = entry.value;
        return obj[key] === value;
      });
      if (matches) {
        results.push(entry.value);
      }
    }
    if (options?.limit) {
      const start = options.offset || 0;
      results = results.slice(start, start + options.limit);
    }
    return results;
  }
  async exists(key) {
    return this.store.has(key);
  }
  async clear(confirm) {
    if (!confirm) {
      throw new Error("Must confirm clear operation");
    }
    this.store.clear();
  }
  async mget(keys) {
    return Promise.all(keys.map((key) => this.get(key)));
  }
  async mset(entries) {
    await Promise.all(
      entries.map(([key, value]) => this.set(key, value))
    );
  }
  async increment(key, amount = 1) {
    const current = await this.get(key);
    const newValue = (current || 0) + amount;
    await this.set(key, newValue);
    return newValue;
  }
  async expire(key, ttl) {
    const entry = this.store.get(key);
    if (entry) {
      entry.expires = Date.now() + ttl * 1e3;
    }
  }
};

// src/interfaces/event-bus.ts
var MemoryEventBus = class {
  listeners = /* @__PURE__ */ new Map();
  async emit(event, data) {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    await Promise.all(
      Array.from(handlers).map((handler) => handler(data))
    );
  }
  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, /* @__PURE__ */ new Set());
    }
    this.listeners.get(event).add(handler);
    return () => this.off(event, handler);
  }
  once(event, handler) {
    const onceWrapper = async (data) => {
      this.off(event, onceWrapper);
      await handler(data);
    };
    this.on(event, onceWrapper);
  }
  off(event, handler) {
    if (!handler) {
      this.listeners.delete(event);
      return;
    }
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.listeners.delete(event);
      }
    }
  }
  removeAllListeners() {
    this.listeners.clear();
  }
  listenerCount(event) {
    return this.listeners.get(event)?.size || 0;
  }
};

// src/interfaces/job-queue.ts
var MemoryJobQueue = class {
  jobs = /* @__PURE__ */ new Map();
  handlers = /* @__PURE__ */ new Map();
  processing = false;
  concurrency = 1;
  async enqueue(job) {
    const id = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullJob = {
      id,
      ...job,
      status: {
        id,
        status: "pending",
        createdAt: /* @__PURE__ */ new Date(),
        attempt: 0,
        maxAttempts: job.retry?.maxAttempts || 1
      }
    };
    this.jobs.set(id, fullJob);
    return id;
  }
  async dequeue() {
    const pendingJob = Array.from(this.jobs.values()).find(
      (j) => j.status.status === "pending"
    );
    if (!pendingJob) return null;
    const handler = this.handlers.get(pendingJob.type);
    if (!handler) {
      throw new Error(`No handler registered for job type: ${pendingJob.type}`);
    }
    pendingJob.status.status = "running";
    pendingJob.status.startedAt = /* @__PURE__ */ new Date();
    pendingJob.status.attempt = (pendingJob.status.attempt || 0) + 1;
    const startTime = Date.now();
    try {
      const result = await handler(pendingJob);
      pendingJob.status.status = "completed";
      pendingJob.status.completedAt = /* @__PURE__ */ new Date();
      pendingJob.status.result = result;
      return {
        jobId: pendingJob.id,
        status: "completed",
        result,
        executionTime: Date.now() - startTime,
        attempt: pendingJob.status.attempt
      };
    } catch (error) {
      const shouldRetry = pendingJob.status.attempt < (pendingJob.status.maxAttempts || 1);
      if (shouldRetry) {
        pendingJob.status.status = "pending";
      } else {
        pendingJob.status.status = "failed";
        pendingJob.status.completedAt = /* @__PURE__ */ new Date();
        pendingJob.status.error = error instanceof Error ? error.message : String(error);
      }
      return {
        jobId: pendingJob.id,
        status: "failed",
        error: error instanceof Error ? error : new Error(String(error)),
        executionTime: Date.now() - startTime,
        attempt: pendingJob.status.attempt
      };
    }
  }
  async getStatus(jobId) {
    const job = this.jobs.get(jobId);
    return job?.status || null;
  }
  async cancel(jobId) {
    const job = this.jobs.get(jobId);
    if (!job || job.status.status === "completed") return false;
    job.status.status = "cancelled";
    job.status.completedAt = /* @__PURE__ */ new Date();
    return true;
  }
  registerHandler(type, handler) {
    this.handlers.set(type, handler);
  }
  async startProcessing(concurrency = 1) {
    this.processing = true;
    this.concurrency = concurrency;
    const processLoop = async () => {
      while (this.processing) {
        const result = await this.dequeue();
        if (!result) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
    };
    const workers = Array.from({ length: concurrency }, () => processLoop());
    await Promise.all(workers);
  }
  async stopProcessing() {
    this.processing = false;
  }
  async getStats() {
    const jobs = Array.from(this.jobs.values());
    return {
      pending: jobs.filter((j) => j.status.status === "pending").length,
      running: jobs.filter((j) => j.status.status === "running").length,
      completed: jobs.filter((j) => j.status.status === "completed").length,
      failed: jobs.filter((j) => j.status.status === "failed").length,
      cancelled: jobs.filter((j) => j.status.status === "cancelled").length
    };
  }
  async clearJobs(olderThan) {
    let cleared = 0;
    for (const [id, job] of this.jobs) {
      const isDone = ["completed", "failed", "cancelled"].includes(job.status.status);
      const isOld = !olderThan || job.status.completedAt && job.status.completedAt < olderThan;
      if (isDone && isOld) {
        this.jobs.delete(id);
        cleared++;
      }
    }
    return cleared;
  }
};

// src/interfaces/tool-registry.ts
var MemoryToolRegistry = class {
  tools = /* @__PURE__ */ new Map();
  register(tool) {
    if (this.tools.has(tool.id)) {
      throw new Error(`Tool with ID "${tool.id}" already registered`);
    }
    this.tools.set(tool.id, tool);
  }
  get(id) {
    return this.tools.get(id);
  }
  list(category, tags) {
    let tools = Array.from(this.tools.values());
    if (category) {
      tools = tools.filter((t) => t.category === category);
    }
    if (tags && tags.length > 0) {
      tools = tools.filter(
        (t) => tags.some((tag) => t.tags?.includes(tag))
      );
    }
    return tools;
  }
  search(query) {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.tools.values()).filter(
      (tool) => tool.name.toLowerCase().includes(lowerQuery) || tool.description.toLowerCase().includes(lowerQuery) || tool.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }
  async execute(id, input, context) {
    const tool = this.get(id);
    if (!tool) {
      return {
        toolId: id,
        status: "error",
        error: {
          message: `Tool not found: ${id}`,
          code: "TOOL_NOT_FOUND"
        },
        executionTime: 0
      };
    }
    const validation = tool.inputSchema.safeParse(input);
    if (!validation.success) {
      return {
        toolId: id,
        status: "error",
        error: {
          message: "Invalid input",
          code: "VALIDATION_ERROR",
          details: validation.error.format()
        },
        executionTime: 0
      };
    }
    const startTime = Date.now();
    try {
      const timeout = context?.timeout || 3e4;
      const result = await Promise.race([
        tool.execute(validation.data),
        new Promise(
          (_, reject) => setTimeout(() => reject(new Error("Timeout")), timeout)
        )
      ]);
      return {
        toolId: id,
        status: "success",
        data: result,
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      const isTimeout = error instanceof Error && error.message === "Timeout";
      return {
        toolId: id,
        status: isTimeout ? "timeout" : "error",
        error: {
          message: error instanceof Error ? error.message : String(error),
          code: isTimeout ? "TIMEOUT" : "EXECUTION_ERROR"
        },
        executionTime: Date.now() - startTime
      };
    }
  }
  unregister(id) {
    return this.tools.delete(id);
  }
  getCategories() {
    const categories = new Set(
      Array.from(this.tools.values()).map((t) => t.category)
    );
    return Array.from(categories).sort();
  }
  getByCategory(category) {
    return this.list(category);
  }
};

// src/interfaces/provider-registry.ts
var MemoryProviderRegistry = class {
  providers = /* @__PURE__ */ new Map();
  stats = /* @__PURE__ */ new Map();
  registerProvider(provider) {
    if (this.providers.has(provider.id)) {
      throw new Error(`Provider with ID "${provider.id}" already registered`);
    }
    this.providers.set(provider.id, provider);
    this.stats.set(provider.id, {
      providerId: provider.id,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      avgResponseTime: 0,
      totalTokens: 0,
      totalCost: 0,
      last24hRequests: 0
    });
  }
  getProvider(id) {
    return this.providers.get(id);
  }
  listProviders() {
    return Array.from(this.providers.values());
  }
  getModel(modelId) {
    for (const provider of this.providers.values()) {
      const model = provider.models.find((m) => m.id === modelId);
      if (model) {
        return { model, provider };
      }
    }
    return void 0;
  }
  listModels(filters) {
    let models = [];
    for (const provider of this.providers.values()) {
      if (filters?.providerId && provider.id !== filters.providerId) {
        continue;
      }
      models.push(...provider.models);
    }
    if (filters?.capabilities) {
      models = models.filter((model) => {
        return Object.entries(filters.capabilities).every(([key, value]) => {
          const capability = model.capabilities[key];
          return capability === value;
        });
      });
    }
    if (filters?.maxCost !== void 0) {
      models = models.filter((model) => {
        if (!model.pricing) return true;
        return model.pricing.output <= filters.maxCost;
      });
    }
    return models;
  }
  async execute(request, credentials) {
    const modelInfo = this.getModel(request.model);
    if (!modelInfo) {
      throw new Error(`Model not found: ${request.model}`);
    }
    throw new Error("Execute must be implemented by provider adapters");
  }
  async checkHealth(providerId) {
    const provider = this.getProvider(providerId);
    if (!provider) {
      return {
        providerId,
        status: "down",
        lastChecked: /* @__PURE__ */ new Date(),
        error: "Provider not found"
      };
    }
    return {
      providerId,
      status: "healthy",
      responseTime: 100,
      lastChecked: /* @__PURE__ */ new Date()
    };
  }
  async getStats(providerId) {
    const stats = this.stats.get(providerId);
    if (!stats) {
      throw new Error(`Provider not found: ${providerId}`);
    }
    return stats;
  }
};
var WAIConfigSchema = zod.z.object({
  // Core settings
  studioId: zod.z.string().min(1),
  environment: zod.z.enum(["development", "staging", "production"]).default("development"),
  // Features
  features: zod.z.object({
    monitoring: zod.z.boolean().default(true),
    caching: zod.z.boolean().default(true),
    streaming: zod.z.boolean().default(true),
    multiModal: zod.z.boolean().default(false)
  }).default({}),
  // Storage configuration
  storage: zod.z.object({
    type: zod.z.enum(["memory", "postgresql", "redis"]).default("memory"),
    connectionString: zod.z.string().optional(),
    ttl: zod.z.number().optional()
  }).default({ type: "memory" }),
  // Event bus configuration
  eventBus: zod.z.object({
    type: zod.z.enum(["memory", "redis", "kafka"]).default("memory"),
    connectionString: zod.z.string().optional()
  }).default({ type: "memory" }),
  // Job queue configuration
  jobQueue: zod.z.object({
    type: zod.z.enum(["memory", "postgresql", "redis"]).default("memory"),
    connectionString: zod.z.string().optional(),
    concurrency: zod.z.number().min(1).max(100).default(10)
  }).default({ type: "memory", concurrency: 10 }),
  // Orchestration settings
  orchestration: zod.z.object({
    maxRetries: zod.z.number().min(0).max(10).default(3),
    timeout: zod.z.number().min(1e3).default(3e4),
    costOptimization: zod.z.boolean().default(true),
    qualityThreshold: zod.z.number().min(0).max(1).default(0.8)
  }).default({}),
  // Logging
  logging: zod.z.object({
    level: zod.z.enum(["debug", "info", "warn", "error"]).default("info"),
    format: zod.z.enum(["json", "text"]).default("text")
  }).default({}),
  // API keys (optional, can be provided separately)
  apiKeys: zod.z.record(zod.z.string()).optional()
});
var defaultConfig = {
  studioId: "default",
  environment: "development",
  features: {
    monitoring: true,
    caching: true,
    streaming: true,
    multiModal: false
  },
  storage: {
    type: "memory"
  },
  eventBus: {
    type: "memory"
  },
  jobQueue: {
    type: "memory",
    concurrency: 10
  },
  orchestration: {
    maxRetries: 3,
    timeout: 3e4,
    costOptimization: true,
    qualityThreshold: 0.8
  },
  logging: {
    level: "info",
    format: "text"
  }
};
function createConfig(config) {
  const merged = {
    ...defaultConfig,
    ...config,
    features: { ...defaultConfig.features, ...config.features },
    storage: { ...defaultConfig.storage, ...config.storage },
    eventBus: { ...defaultConfig.eventBus, ...config.eventBus },
    jobQueue: { ...defaultConfig.jobQueue, ...config.jobQueue },
    orchestration: { ...defaultConfig.orchestration, ...config.orchestration },
    logging: { ...defaultConfig.logging, ...config.logging }
  };
  return WAIConfigSchema.parse(merged);
}
function loadConfigFromEnv() {
  return {
    studioId: process.env.WAI_STUDIO_ID,
    environment: process.env.WAI_ENVIRONMENT || process.env.NODE_ENV,
    storage: process.env.DATABASE_URL ? {
      type: "postgresql",
      connectionString: process.env.DATABASE_URL
    } : void 0,
    eventBus: process.env.REDIS_URL ? {
      type: "redis",
      connectionString: process.env.REDIS_URL
    } : void 0,
    jobQueue: process.env.DATABASE_URL ? {
      type: "postgresql",
      connectionString: process.env.DATABASE_URL,
      concurrency: 10
    } : void 0,
    apiKeys: {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
      RUNWAY_API_KEY: process.env.RUNWAY_API_KEY
    }
  };
}

// src/di/container.ts
var DIContainer = class _DIContainer {
  services = /* @__PURE__ */ new Map();
  scopedInstances = /* @__PURE__ */ new Map();
  /**
   * Register a service
   * @param token - Service identifier (string, symbol, or class)
   * @param factory - Factory function or class constructor
   * @param lifecycle - Service lifecycle (singleton, transient, scoped)
   */
  register(token, factory, lifecycle = "singleton") {
    const serviceToken = typeof token === "function" ? token.name : token;
    const normalizedFactory = typeof factory === "function" && factory.prototype ? (container) => new factory(container) : factory;
    this.services.set(serviceToken, {
      factory: normalizedFactory,
      lifecycle
    });
    return this;
  }
  /**
   * Register a singleton service
   */
  singleton(token, factory) {
    return this.register(token, factory, "singleton");
  }
  /**
   * Register a transient service (new instance every time)
   */
  transient(token, factory) {
    return this.register(token, factory, "transient");
  }
  /**
   * Register a scoped service (one instance per scope)
   */
  scoped(token, factory) {
    return this.register(token, factory, "scoped");
  }
  /**
   * Register an instance directly
   */
  instance(token, instance) {
    const serviceToken = typeof token === "function" ? token.name : token;
    this.services.set(serviceToken, {
      factory: () => instance,
      lifecycle: "singleton",
      instance
    });
    return this;
  }
  /**
   * Resolve a service
   */
  resolve(token) {
    const serviceToken = typeof token === "function" ? token.name : token;
    const registration = this.services.get(serviceToken);
    if (!registration) {
      throw new Error(
        `Service not registered: ${String(serviceToken)}
Available services: ${Array.from(this.services.keys()).join(", ")}`
      );
    }
    switch (registration.lifecycle) {
      case "singleton":
        if (!registration.instance) {
          registration.instance = registration.factory(this);
        }
        return registration.instance;
      case "scoped":
        if (!this.scopedInstances.has(serviceToken)) {
          this.scopedInstances.set(serviceToken, registration.factory(this));
        }
        return this.scopedInstances.get(serviceToken);
      case "transient":
        return registration.factory(this);
      default:
        throw new Error(`Unknown lifecycle: ${registration.lifecycle}`);
    }
  }
  /**
   * Check if a service is registered
   */
  has(token) {
    const serviceToken = typeof token === "function" ? token.name : token;
    return this.services.has(serviceToken);
  }
  /**
   * Clear scoped instances (for request-scoped services)
   */
  clearScope() {
    this.scopedInstances.clear();
  }
  /**
   * Create a child container (inherits parent services)
   */
  createChild() {
    const child = new _DIContainer();
    for (const [token, registration] of this.services) {
      child.services.set(token, { ...registration });
    }
    return child;
  }
  /**
   * Get all registered service tokens
   */
  getRegisteredServices() {
    return Array.from(this.services.keys());
  }
  /**
   * Clear all services
   */
  clear() {
    this.services.clear();
    this.scopedInstances.clear();
  }
};
var ServiceTokens = {
  // Core services
  StorageAdapter: Symbol("IStorageAdapter"),
  EventBus: Symbol("IEventBus"),
  JobQueue: Symbol("IJobQueue"),
  ToolRegistry: Symbol("IToolRegistry"),
  ProviderRegistry: Symbol("IProviderRegistry"),
  // Orchestration
  OrchestrationCore: Symbol("OrchestrationCore"),
  OrchestrationFacade: Symbol("OrchestrationFacade"),
  RoutingRegistry: Symbol("RoutingRegistry"),
  RequestBuilder: Symbol("RequestBuilder"),
  // Protocols
  MCPServer: Symbol("MCPServer"),
  ROMAManager: Symbol("ROMAManager"),
  BMADFramework: Symbol("BMADFramework"),
  ParlantStandards: Symbol("ParlantStandards"),
  A2ACollaborationBus: Symbol("A2ACollaborationBus"),
  AGUIEventBridge: Symbol("AGUIEventBridge"),
  // Memory
  Mem0Client: Symbol("Mem0Client"),
  CAMMonitoring: Symbol("CAMMonitoring"),
  VectorStore: Symbol("VectorStore"),
  // Agents
  AgentCatalog: Symbol("AgentCatalog"),
  AgentCoordinator: Symbol("AgentCoordinator"),
  // Workflows
  WorkflowScheduler: Symbol("WorkflowScheduler"),
  WorkflowExecutor: Symbol("WorkflowExecutor")
};
var globalContainer = new DIContainer();
var orchestrationTypeSchema = zod.z.enum([
  "development",
  "creative",
  "analysis",
  "enterprise",
  "hybrid"
]);
var prioritySchema = zod.z.enum([
  "low",
  "medium",
  "high",
  "critical",
  "quantum"
]);
var orchestrationPreferencesSchema = zod.z.object({
  costOptimization: zod.z.boolean().optional(),
  qualityThreshold: zod.z.number().min(0).max(1).optional(),
  timeConstraint: zod.z.number().positive().optional(),
  preferredProviders: zod.z.array(zod.z.string()).optional(),
  prohibitedProviders: zod.z.array(zod.z.string()).optional()
}).optional();
var waiOrchestrationRequestSchema = zod.z.object({
  id: zod.z.string().uuid().optional(),
  type: orchestrationTypeSchema,
  task: zod.z.string().min(1, "Task description is required"),
  priority: prioritySchema.default("medium"),
  parameters: zod.z.record(zod.z.unknown()).optional(),
  context: zod.z.record(zod.z.unknown()).optional(),
  preferences: orchestrationPreferencesSchema,
  metadata: zod.z.record(zod.z.unknown()).optional()
});
var WAIRequestBuilder = class _WAIRequestBuilder {
  request = {
    priority: "medium"
  };
  aguiSessionId;
  waiCore;
  aguiService;
  /**
   * Set the orchestration type
   */
  setType(type) {
    this.request.type = type;
    return this;
  }
  /**
   * Set the task description (required)
   */
  setTask(task) {
    this.request.task = task;
    return this;
  }
  /**
   * Set the priority level (default: medium)
   */
  setPriority(priority) {
    this.request.priority = priority;
    return this;
  }
  /**
   * Set request parameters
   */
  setParameters(parameters) {
    this.request.parameters = parameters;
    return this;
  }
  /**
   * Add a single parameter
   */
  addParameter(key, value) {
    if (!this.request.parameters) {
      this.request.parameters = {};
    }
    this.request.parameters[key] = value;
    return this;
  }
  /**
   * Set request context
   */
  setContext(context) {
    this.request.context = context;
    return this;
  }
  /**
   * Add a single context value
   */
  addContext(key, value) {
    if (!this.request.context) {
      this.request.context = {};
    }
    this.request.context[key] = value;
    return this;
  }
  /**
   * Set orchestration preferences
   */
  setPreferences(preferences) {
    this.request.preferences = preferences;
    return this;
  }
  /**
   * Enable cost optimization
   */
  enableCostOptimization(enable = true) {
    if (!this.request.preferences) {
      this.request.preferences = {};
    }
    this.request.preferences.costOptimization = enable;
    return this;
  }
  /**
   * Set quality threshold (0-1)
   */
  setQualityThreshold(threshold) {
    if (threshold < 0 || threshold > 1) {
      throw new Error("Quality threshold must be between 0 and 1");
    }
    if (!this.request.preferences) {
      this.request.preferences = {};
    }
    this.request.preferences.qualityThreshold = threshold;
    return this;
  }
  /**
   * Set time constraint in milliseconds
   */
  setTimeConstraint(milliseconds) {
    if (milliseconds <= 0) {
      throw new Error("Time constraint must be positive");
    }
    if (!this.request.preferences) {
      this.request.preferences = {};
    }
    this.request.preferences.timeConstraint = milliseconds;
    return this;
  }
  /**
   * Set preferred LLM providers
   */
  setPreferredProviders(providers) {
    if (!this.request.preferences) {
      this.request.preferences = {};
    }
    this.request.preferences.preferredProviders = providers;
    return this;
  }
  /**
   * Set prohibited LLM providers
   */
  setProhibitedProviders(providers) {
    if (!this.request.preferences) {
      this.request.preferences = {};
    }
    this.request.preferences.prohibitedProviders = providers;
    return this;
  }
  /**
   * Set request metadata
   */
  setMetadata(metadata) {
    this.request.metadata = metadata;
    return this;
  }
  /**
   * Add a single metadata value
   */
  addMetadata(key, value) {
    if (!this.request.metadata) {
      this.request.metadata = {};
    }
    this.request.metadata[key] = value;
    return this;
  }
  /**
   * Enable AG-UI real-time streaming for this orchestration
   * 
   * @param sessionId AG-UI session ID for real-time event streaming
   * @param aguiService Optional AG-UI service instance (uses global if not provided)
   * @returns this for method chaining
   * 
   * @example
   * const result = await new WAIRequestBuilder()
   *   .setType('development')
   *   .setTask('Build a login component')
   *   .withAGUISession(sessionId, aguiService)
   *   .execute();
   */
  withAGUISession(sessionId, aguiService) {
    this.aguiSessionId = sessionId;
    if (aguiService) {
      this.aguiService = aguiService;
    }
    return this;
  }
  /**
   * Set WAI Core instance for orchestration execution
   * 
   * @param waiCore WAI Orchestration Core instance
   * @returns this for method chaining
   */
  withWAICore(waiCore) {
    this.waiCore = waiCore;
    return this;
  }
  /**
   * Execute the orchestration with full WAI SDK + AG-UI integration
   * 
   * This method:
   * 1. Validates the request
   * 2. Emits AG-UI start event (if session configured)
   * 3. Executes WAI orchestration
   * 4. Emits thinking steps and tool calls (if session configured)
   * 5. Emits completion/error events (if session configured)
   * 
   * @returns Promise<OrchestrationResult> WAI orchestration result
   * @throws {Error} If validation fails or orchestration errors
   * 
   * @example
   * const result = await new WAIRequestBuilder()
   *   .setType('development')
   *   .setTask('Create authentication system')
   *   .withAGUISession(sessionId)
   *   .withWAICore(waiCore)
   *   .execute();
   */
  async execute() {
    const validatedRequest = this.build();
    if (!this.waiCore) {
      throw new Error("WAI Core not configured. Use withWAICore() before calling execute()");
    }
    const agentId = this.request.metadata?.agentId || "wai-orchestrator";
    const startTime = Date.now();
    try {
      if (this.aguiSessionId && this.aguiService) {
        this.aguiService.emitAgentStart(
          this.aguiSessionId,
          agentId,
          validatedRequest.task,
          {
            type: validatedRequest.type,
            priority: validatedRequest.priority,
            preferences: validatedRequest.preferences
          }
        );
        this.aguiService.emitThinking(
          this.aguiSessionId,
          "initialization",
          "Initializing WAI SDK orchestration...",
          agentId,
          0.95,
          `Starting ${validatedRequest.type} orchestration with priority: ${validatedRequest.priority}`
        );
      }
      const result = await this.waiCore.processRequest({
        type: validatedRequest.type,
        task: validatedRequest.task,
        priority: validatedRequest.priority,
        preferences: validatedRequest.preferences,
        context: validatedRequest.context,
        metadata: validatedRequest.metadata
      });
      if (this.aguiSessionId && this.aguiService) {
        this.aguiService.emitAgentComplete(
          this.aguiSessionId,
          agentId,
          result.result || "Orchestration completed successfully",
          {
            providersUsed: result.providersUsed || [],
            modelsUsed: result.modelsUsed || [],
            creditsUsed: result.creditsUsed || 0,
            tokensUsed: result.tokensUsed || 0,
            duration: Date.now() - startTime,
            qualityScore: result.qualityScore
          }
        );
      }
      return result;
    } catch (error) {
      if (this.aguiSessionId && this.aguiService) {
        this.aguiService.emitAgentError(
          this.aguiSessionId,
          agentId,
          error instanceof Error ? error.message : "Unknown orchestration error",
          {
            errorType: error instanceof Error ? error.constructor.name : "UnknownError",
            stack: error instanceof Error ? error.stack : void 0,
            duration: Date.now() - startTime
          }
        );
      }
      throw error;
    }
  }
  /**
   * Build and validate the orchestration request
   * 
   * @throws {z.ZodError} If validation fails
   * @returns Validated WAI Orchestration Request
   */
  build() {
    if (!this.request.id) {
      this.request.id = crypto.randomUUID();
    }
    const validated = waiOrchestrationRequestSchema.parse(this.request);
    return validated;
  }
  /**
   * Build with safe parsing (returns result or error)
   */
  safeBuild() {
    if (!this.request.id) {
      this.request.id = crypto.randomUUID();
    }
    return waiOrchestrationRequestSchema.safeParse(this.request);
  }
  /**
   * Reset the builder to initial state
   */
  reset() {
    this.request = {
      priority: "medium"
    };
    return this;
  }
  /**
   * Clone the current builder state
   */
  clone() {
    const cloned = new _WAIRequestBuilder();
    cloned.request = { ...this.request };
    return cloned;
  }
};
function createDevelopmentRequest(task) {
  return new WAIRequestBuilder().setType("development").setTask(task);
}
function createCreativeRequest(task) {
  return new WAIRequestBuilder().setType("creative").setTask(task);
}
function createAnalysisRequest(task) {
  return new WAIRequestBuilder().setType("analysis").setTask(task);
}
function createEnterpriseRequest(task) {
  return new WAIRequestBuilder().setType("enterprise").setTask(task);
}
function createHybridRequest(task) {
  return new WAIRequestBuilder().setType("hybrid").setTask(task);
}
function validateOrchestrationRequest(request) {
  return waiOrchestrationRequestSchema.parse(request);
}
function safeValidateOrchestrationRequest(request) {
  return waiOrchestrationRequestSchema.safeParse(request);
}

// src/orchestration/standalone-api.ts
var StandaloneOrchestrationClient = class {
  config;
  constructor(config = {}) {
    this.config = config;
  }
  async execute(request) {
    return {
      success: false,
      error: "Standalone orchestration not yet implemented. Use @wai/providers directly or integrate with Incubator platform."
    };
  }
};

// src/orchestration/wiring-services-stub.ts
var ParlantWiringService = class {
  async applyStandards(agentId, prompt) {
    return prompt;
  }
};
var DynamicModelSelectionWiringService = class {
  async selectModel(requirements) {
    return "gpt-4o";
  }
};
var CostOptimizationWiringService = class {
  async optimizeRequest(request) {
    return request;
  }
};
var SemanticCachingWiringService = class {
  async getCached(key) {
    return null;
  }
};
var ContinuousLearningWiringService = class {
  async recordFeedback(data) {
  }
};
var RealTimeOptimizationWiringService = class {
  async optimize(request) {
    return request;
  }
};
var ContextEngineeringWiringService = class {
  async optimizeContext(context) {
    return context;
  }
};
var A2AWiringService = class {
  async facilitateCollaboration(agents) {
    return { agents, status: "stub" };
  }
};
var ProviderArbitrageWiringService = class {
  async selectProvider(requirements) {
    return "openai";
  }
};
var BMADWiringService = class {
  async applyBehaviors(agent) {
    return agent;
  }
};
var AgentCollaborationNetworkWiringService = class {
  async createNetwork(agents) {
    return { network: agents };
  }
};
var IntelligentRoutingWiringService = class {
  async routeRequest(request) {
    return "default-agent";
  }
};
var GRPOWiringService = class {
  async applyLearning(data) {
  }
};
var ClaudeExtendedThinkingWiringService = class {
  async processWithThinking(task) {
    return { task, result: "stub" };
  }
};
var MultiClockWiringService = class {
  getPrimaryTime() {
    return /* @__PURE__ */ new Date();
  }
};
var QuantumSecurityWiringService = class {
  async encrypt(data) {
    return data;
  }
};
var ParallelProcessingWiringService = class extends events.EventEmitter {
  metrics;
  activeProcesses = /* @__PURE__ */ new Map();
  maxParallelTasks = 20;
  processHistory = [];
  maxHistorySize = 100;
  isInitialized = false;
  constructor() {
    super();
    this.metrics = {
      totalProcessesExecuted: 0,
      totalTasksProcessed: 0,
      averageExecutionTime: 0,
      averageTasksPerProcess: 0,
      totalParallelTime: 0,
      averageConcurrency: 0,
      successRate: 0
    };
    this.initialize();
  }
  /**
   * Initialize parallel processing system
   */
  initialize() {
    try {
      this.isInitialized = true;
      console.log("\u2705 Parallel Processing Wiring Service initialized");
      console.log(`\u26A1 Max concurrent tasks: ${this.maxParallelTasks}`);
      console.log("\u{1F504} Batch processing enabled for large queues");
      console.log("\u2696\uFE0F Intelligent load balancing active");
    } catch (error) {
      console.error("\u274C Parallel Processing initialization failed:", error);
      this.isInitialized = false;
    }
  }
  /**
   * Process multiple tasks in parallel
   */
  async processInParallel(tasks, options) {
    if (!this.isInitialized) {
      throw new Error("Parallel processing not initialized");
    }
    const maxConcurrency = options?.maxConcurrency || this.maxParallelTasks;
    const timeoutMs = options?.timeoutMs || 3e5;
    const processId = `parallel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    console.log(`\u26A1 Starting parallel processing: ${processId}`);
    console.log(`  Tasks: ${tasks.length}`);
    console.log(`  Max concurrency: ${maxConcurrency}`);
    this.activeProcesses.set(processId, {
      id: processId,
      startTime: /* @__PURE__ */ new Date(),
      taskCount: tasks.length,
      status: "running",
      progress: 0
    });
    const sortedTasks = options?.prioritySort ? [...tasks].sort((a, b) => b.priority - a.priority) : tasks;
    try {
      const batches = this.createBatches(sortedTasks, maxConcurrency);
      const allResults = [];
      let completedTasks = 0;
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const batchPromises = batch.map(
          (task) => this.executeTaskWithTimeout(task, timeoutMs)
        );
        const batchResults = await Promise.allSettled(batchPromises);
        allResults.push(...batchResults);
        completedTasks += batch.length;
        const progress = completedTasks / tasks.length * 100;
        const activeProcess2 = this.activeProcesses.get(processId);
        if (activeProcess2) {
          activeProcess2.progress = progress;
        }
        this.emit("progress", {
          processId,
          progress,
          completedTasks,
          totalTasks: tasks.length,
          batch: i + 1,
          totalBatches: batches.length
        });
        console.log(`  Progress: ${completedTasks}/${tasks.length} tasks (${progress.toFixed(1)}%)`);
      }
      const successCount = allResults.filter((r) => r.status === "fulfilled").length;
      const executionTime = Date.now() - startTime;
      const result = {
        processId,
        success: true,
        results: allResults,
        executionTime,
        tasksProcessed: tasks.length
      };
      const activeProcess = this.activeProcesses.get(processId);
      if (activeProcess) {
        activeProcess.status = "completed";
        activeProcess.progress = 100;
      }
      this.updateMetrics(result, successCount, tasks.length);
      this.addToHistory(result);
      console.log(`\u2705 Parallel processing complete: ${processId}`);
      console.log(`  Execution time: ${executionTime}ms`);
      console.log(`  Success rate: ${successCount}/${tasks.length} (${(successCount / tasks.length * 100).toFixed(1)}%)`);
      console.log(`  Average task time: ${(executionTime / tasks.length).toFixed(2)}ms`);
      this.emit("completed", result);
      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const result = {
        processId,
        success: false,
        error,
        executionTime,
        tasksProcessed: 0
      };
      const activeProcess = this.activeProcesses.get(processId);
      if (activeProcess) {
        activeProcess.status = "failed";
      }
      console.error(`\u274C Parallel processing failed: ${processId}`, error);
      this.emit("failed", { processId, error });
      return result;
    } finally {
      setTimeout(() => {
        this.activeProcesses.delete(processId);
      }, 6e4);
    }
  }
  /**
   * Execute a single task with timeout
   */
  async executeTaskWithTimeout(task, timeoutMs) {
    return Promise.race([
      this.executeTask(task),
      this.createTimeout(timeoutMs, task.id)
    ]);
  }
  /**
   * Execute a single agent task
   */
  async executeTask(task) {
    const startTime = Date.now();
    try {
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 500 + 50));
      const executionTime = Date.now() - startTime;
      return {
        taskId: task.id,
        agentId: task.agentId,
        type: task.type,
        result: `Task ${task.id} completed by agent ${task.agentId}`,
        executionTime,
        timestamp: /* @__PURE__ */ new Date(),
        success: true
      };
    } catch (error) {
      return {
        taskId: task.id,
        agentId: task.agentId,
        type: task.type,
        error: error instanceof Error ? error.message : "Unknown error",
        executionTime: Date.now() - startTime,
        timestamp: /* @__PURE__ */ new Date(),
        success: false
      };
    }
  }
  /**
   * Create timeout promise
   */
  createTimeout(timeoutMs, taskId) {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Task ${taskId} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });
  }
  /**
   * Split tasks into batches
   */
  createBatches(items, batchSize) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }
  /**
   * Update metrics after process completion
   */
  updateMetrics(result, successCount, totalTasks) {
    this.metrics.totalProcessesExecuted++;
    this.metrics.totalTasksProcessed += result.tasksProcessed;
    this.metrics.totalParallelTime += result.executionTime;
    this.metrics.averageExecutionTime = this.metrics.totalParallelTime / this.metrics.totalProcessesExecuted;
    this.metrics.averageTasksPerProcess = this.metrics.totalTasksProcessed / this.metrics.totalProcessesExecuted;
    if (this.metrics.totalParallelTime > 0) {
      this.metrics.averageConcurrency = this.metrics.totalTasksProcessed * 1e3 / this.metrics.totalParallelTime;
    }
    const currentSuccessRate = successCount / totalTasks;
    this.metrics.successRate = this.metrics.successRate === 0 ? currentSuccessRate : this.metrics.successRate * 0.7 + currentSuccessRate * 0.3;
  }
  /**
   * Add result to history (with size limit)
   */
  addToHistory(result) {
    this.processHistory.unshift(result);
    if (this.processHistory.length > this.maxHistorySize) {
      this.processHistory.pop();
    }
  }
  /**
   * Get active processes
   */
  getActiveProcesses() {
    return Array.from(this.activeProcesses.values());
  }
  /**
   * Get process history
   */
  getProcessHistory(limit = 10) {
    return this.processHistory.slice(0, limit);
  }
  /**
   * Get process by ID
   */
  getProcess(processId) {
    return this.activeProcesses.get(processId);
  }
  /**
   * Get metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }
  /**
   * Get status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      maxParallelTasks: this.maxParallelTasks,
      activeProcesses: this.activeProcesses.size,
      metrics: this.metrics,
      recentHistory: this.processHistory.slice(0, 5).map((r) => ({
        processId: r.processId,
        success: r.success,
        tasksProcessed: r.tasksProcessed,
        executionTime: r.executionTime
      }))
    };
  }
  /**
   * Health check
   */
  healthCheck() {
    if (!this.isInitialized) {
      return {
        status: "not-ready",
        details: { error: "Parallel processing not initialized" }
      };
    }
    return {
      status: "healthy",
      details: {
        initialized: this.isInitialized,
        maxParallelTasks: this.maxParallelTasks,
        activeProcesses: this.activeProcesses.size,
        totalProcessed: this.metrics.totalProcessesExecuted,
        successRate: (this.metrics.successRate * 100).toFixed(2) + "%",
        averageConcurrency: this.metrics.averageConcurrency.toFixed(2)
      }
    };
  }
  /**
   * Reset metrics (for testing)
   */
  resetMetrics() {
    this.metrics = {
      totalProcessesExecuted: 0,
      totalTasksProcessed: 0,
      averageExecutionTime: 0,
      averageTasksPerProcess: 0,
      totalParallelTime: 0,
      averageConcurrency: 0,
      successRate: 0
    };
    this.processHistory = [];
  }
  /**
   * Set max parallel tasks
   */
  setMaxParallelTasks(max) {
    if (max < 1 || max > 100) {
      throw new Error("Max parallel tasks must be between 1 and 100");
    }
    this.maxParallelTasks = max;
    console.log(`\u26A1 Max parallel tasks updated: ${max}`);
  }
};
var parallelProcessingWiringService = new ParallelProcessingWiringService();

// src/orchestration/error-recovery-wiring-service.ts
var ErrorRecoveryWiringService = class {
  circuitBreakers = /* @__PURE__ */ new Map();
  stats = {
    totalErrors: 0,
    recoveredErrors: 0,
    recoveryRate: 0,
    errorsByType: {},
    fallbacksUsed: 0
  };
  constructor() {
    console.log("\u{1F6E1}\uFE0F Error Recovery & Fallback Wiring Service initialized");
    console.log("\u{1F3AF} Features: Retry strategies, Circuit breaker, Fallback chains, Error analysis");
  }
  /**
   * Execute with retry logic
   */
  async executeWithRetry(operation, operationId, config = {}) {
    const fullConfig = {
      maxRetries: 3,
      initialDelay: 1e3,
      maxDelay: 3e4,
      backoffMultiplier: 2,
      retryableErrors: ["TIMEOUT", "RATE_LIMIT", "SERVER_ERROR"],
      ...config
    };
    let attempts = 0;
    let lastError = null;
    while (attempts <= fullConfig.maxRetries) {
      try {
        if (this.isCircuitOpen(operationId)) {
          throw new Error("Circuit breaker is OPEN");
        }
        const result = await operation();
        this.recordSuccess(operationId);
        if (attempts > 0) {
          this.stats.recoveredErrors++;
          this.updateRecoveryRate();
          console.log(`\u{1F6E1}\uFE0F [Recovery SUCCESS] ${operationId} recovered after ${attempts} retries`);
        }
        return { success: true, result, attempts };
      } catch (error) {
        attempts++;
        lastError = error;
        this.stats.totalErrors++;
        this.recordFailure(operationId);
        const errorType = this.categorizeError(error);
        this.stats.errorsByType[errorType] = (this.stats.errorsByType[errorType] || 0) + 1;
        if (!this.isRetryable(error, fullConfig) || attempts > fullConfig.maxRetries) {
          console.log(`\u{1F6E1}\uFE0F [Recovery FAIL] ${operationId} failed after ${attempts} attempts: ${lastError.message}`);
          this.updateRecoveryRate();
          return { success: false, error: lastError, attempts };
        }
        const delay = Math.min(
          fullConfig.initialDelay * Math.pow(fullConfig.backoffMultiplier, attempts - 1),
          fullConfig.maxDelay
        );
        console.log(`\u{1F6E1}\uFE0F [Retry] ${operationId} attempt ${attempts}/${fullConfig.maxRetries} failed, retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }
    this.updateRecoveryRate();
    return { success: false, error: lastError, attempts };
  }
  /**
   * Execute with fallback chain
   */
  async executeWithFallback(operations, operationName) {
    for (let i = 0; i < operations.length; i++) {
      const { id, fn } = operations[i];
      try {
        const result = await fn();
        if (i > 0) {
          this.stats.fallbacksUsed++;
          console.log(`\u{1F6E1}\uFE0F [Fallback] ${operationName} succeeded using fallback level ${i}`);
        }
        return {
          success: true,
          result,
          usedFallback: i > 0,
          fallbackLevel: i
        };
      } catch (error) {
        console.log(`\u{1F6E1}\uFE0F [Fallback] ${operationName} fallback ${i} failed: ${error.message}`);
        if (i === operations.length - 1) {
          return {
            success: false,
            usedFallback: true,
            fallbackLevel: i
          };
        }
      }
    }
    return { success: false, usedFallback: false, fallbackLevel: -1 };
  }
  /**
   * Check if circuit breaker is open
   */
  isCircuitOpen(operationId) {
    const breaker = this.circuitBreakers.get(operationId);
    if (!breaker) return false;
    if (breaker.status === "open") {
      if (breaker.nextRetryTime && Date.now() >= breaker.nextRetryTime.getTime()) {
        breaker.status = "half-open";
        console.log(`\u{1F6E1}\uFE0F [Circuit Breaker] ${operationId} transitioned to HALF-OPEN`);
        return false;
      }
      return true;
    }
    return false;
  }
  /**
   * Record successful operation
   */
  recordSuccess(operationId) {
    let breaker = this.circuitBreakers.get(operationId);
    if (!breaker) {
      breaker = {
        status: "closed",
        failureCount: 0,
        successCount: 0,
        lastFailureTime: null,
        nextRetryTime: null
      };
      this.circuitBreakers.set(operationId, breaker);
    }
    breaker.successCount++;
    breaker.failureCount = 0;
    if (breaker.status === "half-open") {
      breaker.status = "closed";
      console.log(`\u{1F6E1}\uFE0F [Circuit Breaker] ${operationId} CLOSED after successful recovery`);
    }
  }
  /**
   * Record failed operation
   */
  recordFailure(operationId) {
    let breaker = this.circuitBreakers.get(operationId);
    if (!breaker) {
      breaker = {
        status: "closed",
        failureCount: 0,
        successCount: 0,
        lastFailureTime: null,
        nextRetryTime: null
      };
      this.circuitBreakers.set(operationId, breaker);
    }
    breaker.failureCount++;
    breaker.lastFailureTime = /* @__PURE__ */ new Date();
    if (breaker.failureCount >= 5) {
      breaker.status = "open";
      breaker.nextRetryTime = new Date(Date.now() + 6e4);
      console.log(`\u{1F6E1}\uFE0F [Circuit Breaker] ${operationId} OPENED due to repeated failures`);
    }
  }
  /**
   * Categorize error type
   */
  categorizeError(error) {
    const message = error.message.toLowerCase();
    if (message.includes("timeout")) return "TIMEOUT";
    if (message.includes("rate limit")) return "RATE_LIMIT";
    if (message.includes("unauthorized") || message.includes("forbidden")) return "AUTH_ERROR";
    if (message.includes("not found")) return "NOT_FOUND";
    if (message.includes("server") || message.includes("500")) return "SERVER_ERROR";
    if (message.includes("network")) return "NETWORK_ERROR";
    return "UNKNOWN";
  }
  /**
   * Check if error is retryable
   */
  isRetryable(error, config) {
    const errorType = this.categorizeError(error);
    return config.retryableErrors.includes(errorType);
  }
  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  /**
   * Update recovery rate
   */
  updateRecoveryRate() {
    this.stats.recoveryRate = this.stats.totalErrors > 0 ? this.stats.recoveredErrors / this.stats.totalErrors : 0;
  }
  /**
   * Get error recovery statistics
   */
  getRecoveryStats() {
    return { ...this.stats };
  }
  /**
   * Get health status
   */
  getHealthStatus() {
    return {
      status: this.stats.recoveryRate > 0.7 ? "healthy" : "degraded",
      recoveryRate: this.stats.recoveryRate,
      totalErrors: this.stats.totalErrors,
      recoveredErrors: this.stats.recoveredErrors,
      features: {
        retryStrategies: true,
        circuitBreaker: true,
        fallbackChains: true,
        errorAnalysis: true
      }
    };
  }
};
var errorRecoveryWiringService = new ErrorRecoveryWiringService();

exports.A2AWiringService = A2AWiringService;
exports.AgentCollaborationNetworkWiringService = AgentCollaborationNetworkWiringService;
exports.BMADWiringService = BMADWiringService;
exports.ClaudeExtendedThinkingWiringService = ClaudeExtendedThinkingWiringService;
exports.ContextEngineeringWiringService = ContextEngineeringWiringService;
exports.ContinuousLearningWiringService = ContinuousLearningWiringService;
exports.CostOptimizationWiringService = CostOptimizationWiringService;
exports.DIContainer = DIContainer;
exports.DynamicModelSelectionWiringService = DynamicModelSelectionWiringService;
exports.GRPOWiringService = GRPOWiringService;
exports.IntelligentRoutingWiringService = IntelligentRoutingWiringService;
exports.MemoryEventBus = MemoryEventBus;
exports.MemoryJobQueue = MemoryJobQueue;
exports.MemoryProviderRegistry = MemoryProviderRegistry;
exports.MemoryStorageAdapter = MemoryStorageAdapter;
exports.MemoryToolRegistry = MemoryToolRegistry;
exports.MultiClockWiringService = MultiClockWiringService;
exports.ParallelProcessingWiringService = ParallelProcessingWiringService;
exports.ParlantWiringService = ParlantWiringService;
exports.ProviderArbitrageWiringService = ProviderArbitrageWiringService;
exports.QuantumSecurityWiringService = QuantumSecurityWiringService;
exports.RealTimeOptimizationWiringService = RealTimeOptimizationWiringService;
exports.SemanticCachingWiringService = SemanticCachingWiringService;
exports.ServiceTokens = ServiceTokens;
exports.StandaloneOrchestrationClient = StandaloneOrchestrationClient;
exports.WAIConfigSchema = WAIConfigSchema;
exports.WAIRequestBuilder = WAIRequestBuilder;
exports.createAnalysisRequest = createAnalysisRequest;
exports.createConfig = createConfig;
exports.createCreativeRequest = createCreativeRequest;
exports.createDevelopmentRequest = createDevelopmentRequest;
exports.createEnterpriseRequest = createEnterpriseRequest;
exports.createHybridRequest = createHybridRequest;
exports.defaultConfig = defaultConfig;
exports.errorRecoveryWiringService = errorRecoveryWiringService;
exports.globalContainer = globalContainer;
exports.loadConfigFromEnv = loadConfigFromEnv;
exports.orchestrationPreferencesSchema = orchestrationPreferencesSchema;
exports.orchestrationTypeSchema = orchestrationTypeSchema;
exports.parallelProcessingWiringService = parallelProcessingWiringService;
exports.prioritySchema = prioritySchema;
exports.safeValidateOrchestrationRequest = safeValidateOrchestrationRequest;
exports.validateOrchestrationRequest = validateOrchestrationRequest;
exports.waiOrchestrationRequestSchema = waiOrchestrationRequestSchema;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map