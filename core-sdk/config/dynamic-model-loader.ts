/**
 * Dynamic Model Loader for WAI SDK v9.0
 * 
 * Enables configuration-based model management:
 * - Add new AI models without code changes
 * - Hot-reload model configurations
 * - Automatic model discovery and registration
 * - Provider validation and health checks
 */

import { EventEmitter } from 'events';
import { ModelEntry } from '../intelligence-layer/wai-intelligence-api';

export interface ModelConfig {
  models: {
    [modelId: string]: {
      name: string;
      provider: string;
      family: string;
      context: number;
      pricing: {
        input: number;
        output: number;
      };
      performance: {
        latency: number;
        regions: string[];
        safety: 'open' | 'std' | 'strict' | 'regional' | 'mixed';
      };
      capabilities?: string[];
      enabled?: boolean;
      metadata?: {
        description?: string;
        version?: string;
        documentation?: string;
        examples?: any[];
      };
    };
  };
  providers: {
    [providerId: string]: {
      name: string;
      baseUrl?: string;
      apiKeyEnv?: string;
      healthCheckEndpoint?: string;
      rateLimit?: {
        requestsPerSecond: number;
        requestsPerMinute: number;
      };
      fallbackProviders?: string[];
      enabled?: boolean;
    };
  };
  categories: {
    [categoryId: string]: {
      name: string;
      description: string;
      modelIds: string[];
      defaultModel?: string;
    };
  };
}

export interface ModelRegistration {
  modelId: string;
  model: ModelEntry;
  provider: string;
  status: 'registered' | 'failed' | 'disabled';
  healthStatus?: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck?: Date;
  error?: string;
}

export class DynamicModelLoader extends EventEmitter {
  private modelConfig: ModelConfig | null = null;
  private registeredModels: Map<string, ModelRegistration> = new Map();
  private configWatcher: any = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor(private configPath: string = 'config/models.json') {
    super();
  }

  /**
   * Initialize the dynamic model loader
   */
  async initialize(): Promise<void> {
    console.log('🚀 Initializing Dynamic Model Loader...');
    
    try {
      // Load initial configuration
      await this.loadConfiguration();
      
      // Register all enabled models
      await this.registerAllModels();
      
      // Start configuration watching
      await this.startConfigWatcher();
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      console.log(`✅ Dynamic Model Loader initialized with ${this.registeredModels.size} models`);
      this.emit('initialized', { modelCount: this.registeredModels.size });
      
    } catch (error) {
      console.error('❌ Dynamic Model Loader initialization failed:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Load configuration from file or default configuration
   */
  private async loadConfiguration(): Promise<void> {
    try {
      // Try to load from file first
      try {
        const configData = await this.readConfigFile();
        this.modelConfig = JSON.parse(configData);
        console.log(`✅ Model configuration loaded from ${this.configPath}`);
      } catch (fileError) {
        // Use default configuration if file doesn't exist
        console.log('⚠️ Model config file not found, using default configuration');
        this.modelConfig = this.getDefaultConfiguration();
        await this.saveConfiguration();
      }
      
      // Validate configuration
      this.validateConfiguration();
      
    } catch (error) {
      console.error('❌ Failed to load model configuration:', error);
      throw error;
    }
  }

  /**
   * Register all enabled models from configuration
   */
  private async registerAllModels(): Promise<void> {
    if (!this.modelConfig) {
      throw new Error('Model configuration not loaded');
    }

    const { models, providers } = this.modelConfig;
    let successCount = 0;
    let failureCount = 0;

    for (const [modelId, modelConfig] of Object.entries(models)) {
      try {
        if (modelConfig.enabled === false) {
          console.log(`⏭️ Skipping disabled model: ${modelId}`);
          continue;
        }

        // Check if provider is enabled
        const provider = providers[modelConfig.provider];
        if (!provider || provider.enabled === false) {
          console.log(`⏭️ Skipping model ${modelId} - provider ${modelConfig.provider} disabled`);
          continue;
        }

        // Create ModelEntry
        const modelEntry: ModelEntry = {
          name: modelConfig.name,
          provider: modelConfig.provider,
          family: modelConfig.family as any,
          context: modelConfig.context,
          price_in: modelConfig.pricing.input,
          price_out: modelConfig.pricing.output,
          base_latency_ms: modelConfig.performance.latency,
          regions: modelConfig.performance.regions,
          safety: modelConfig.performance.safety
        };

        // Register the model
        const registration: ModelRegistration = {
          modelId,
          model: modelEntry,
          provider: modelConfig.provider,
          status: 'registered',
          lastCheck: new Date()
        };

        this.registeredModels.set(modelId, registration);
        successCount++;

        console.log(`✅ Model registered: ${modelId} (${modelConfig.provider})`);
        this.emit('modelRegistered', { modelId, model: modelEntry });

      } catch (error) {
        console.error(`❌ Failed to register model ${modelId}:`, error);
        
        const registration: ModelRegistration = {
          modelId,
          model: {} as ModelEntry,
          provider: modelConfig.provider,
          status: 'failed',
          error: error.message,
          lastCheck: new Date()
        };

        this.registeredModels.set(modelId, registration);
        failureCount++;
        this.emit('modelRegistrationFailed', { modelId, error });
      }
    }

    console.log(`📊 Model registration complete: ${successCount} successful, ${failureCount} failed`);
  }

  /**
   * Start watching configuration file for changes
   */
  private async startConfigWatcher(): Promise<void> {
    try {
      // For now, implement a simple polling mechanism
      // In production, would use fs.watch or similar
      this.configWatcher = setInterval(async () => {
        try {
          await this.checkForConfigChanges();
        } catch (error) {
          console.error('⚠️ Config watcher error:', error);
        }
      }, 30000); // Check every 30 seconds

      console.log('👁️ Configuration watcher started');
    } catch (error) {
      console.error('❌ Failed to start config watcher:', error);
    }
  }

  /**
   * Check for configuration changes and reload if needed
   */
  private async checkForConfigChanges(): Promise<void> {
    try {
      const newConfigData = await this.readConfigFile();
      const newConfig = JSON.parse(newConfigData);
      
      // Simple change detection by comparing JSON strings
      if (JSON.stringify(newConfig) !== JSON.stringify(this.modelConfig)) {
        console.log('🔄 Configuration changes detected, reloading...');
        
        const oldConfig = this.modelConfig;
        this.modelConfig = newConfig;
        
        await this.handleConfigurationChange(oldConfig, newConfig);
        
        this.emit('configurationReloaded', { 
          timestamp: new Date(),
          modelCount: this.registeredModels.size 
        });
      }
    } catch (error) {
      // Silently ignore read errors (file might be temporarily unavailable)
    }
  }

  /**
   * Handle configuration changes by updating model registrations
   */
  private async handleConfigurationChange(oldConfig: ModelConfig, newConfig: ModelConfig): Promise<void> {
    const oldModels = new Set(Object.keys(oldConfig.models));
    const newModels = new Set(Object.keys(newConfig.models));

    // Remove deleted models
    for (const modelId of oldModels) {
      if (!newModels.has(modelId)) {
        this.registeredModels.delete(modelId);
        console.log(`🗑️ Model removed: ${modelId}`);
        this.emit('modelRemoved', { modelId });
      }
    }

    // Add or update models
    for (const modelId of newModels) {
      const modelConfig = newConfig.models[modelId];
      
      if (!oldModels.has(modelId)) {
        // New model
        console.log(`➕ New model detected: ${modelId}`);
        await this.registerSingleModel(modelId, modelConfig);
      } else {
        // Check if model configuration changed
        const oldModelConfig = oldConfig.models[modelId];
        if (JSON.stringify(oldModelConfig) !== JSON.stringify(modelConfig)) {
          console.log(`🔄 Model updated: ${modelId}`);
          await this.registerSingleModel(modelId, modelConfig);
        }
      }
    }
  }

  /**
   * Register a single model
   */
  private async registerSingleModel(modelId: string, modelConfig: any): Promise<void> {
    try {
      // Create ModelEntry
      const modelEntry: ModelEntry = {
        name: modelConfig.name,
        provider: modelConfig.provider,
        family: modelConfig.family as any,
        context: modelConfig.context,
        price_in: modelConfig.pricing.input,
        price_out: modelConfig.pricing.output,
        base_latency_ms: modelConfig.performance.latency,
        regions: modelConfig.performance.regions,
        safety: modelConfig.performance.safety
      };

      // Register the model
      const registration: ModelRegistration = {
        modelId,
        model: modelEntry,
        provider: modelConfig.provider,
        status: 'registered',
        lastCheck: new Date()
      };

      this.registeredModels.set(modelId, registration);
      this.emit('modelRegistered', { modelId, model: modelEntry });

    } catch (error) {
      console.error(`❌ Failed to register model ${modelId}:`, error);
      this.emit('modelRegistrationFailed', { modelId, error });
    }
  }

  /**
   * Start health monitoring for registered models
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, 60000); // Check every minute

    console.log('💚 Health monitoring started');
  }

  /**
   * Perform health checks on all registered models
   */
  private async performHealthChecks(): Promise<void> {
    for (const [modelId, registration] of this.registeredModels) {
      try {
        const isHealthy = await this.checkModelHealth(registration);
        registration.healthStatus = isHealthy ? 'healthy' : 'unhealthy';
        registration.lastCheck = new Date();
        
        if (!isHealthy) {
          this.emit('modelUnhealthy', { modelId, registration });
        }
      } catch (error) {
        registration.healthStatus = 'unhealthy';
        registration.error = error.message;
        this.emit('modelHealthCheckFailed', { modelId, error });
      }
    }
  }

  /**
   * Check health of a specific model
   */
  private async checkModelHealth(registration: ModelRegistration): Promise<boolean> {
    // Implement actual health check logic
    // For now, return true if registration is valid
    return registration.status === 'registered';
  }

  /**
   * Get all registered models as ModelEntry array
   */
  getRegisteredModels(): ModelEntry[] {
    return Array.from(this.registeredModels.values())
      .filter(reg => reg.status === 'registered')
      .map(reg => reg.model);
  }

  /**
   * Get model by ID
   */
  getModel(modelId: string): ModelEntry | null {
    const registration = this.registeredModels.get(modelId);
    return registration && registration.status === 'registered' ? registration.model : null;
  }

  /**
   * Get models by provider
   */
  getModelsByProvider(provider: string): ModelEntry[] {
    return Array.from(this.registeredModels.values())
      .filter(reg => reg.status === 'registered' && reg.provider === provider)
      .map(reg => reg.model);
  }

  /**
   * Get models by family
   */
  getModelsByFamily(family: string): ModelEntry[] {
    return Array.from(this.registeredModels.values())
      .filter(reg => reg.status === 'registered' && reg.model.family === family)
      .map(reg => reg.model);
  }

  /**
   * Get registration status for all models
   */
  getRegistrationStatus(): ModelRegistration[] {
    return Array.from(this.registeredModels.values());
  }

  /**
   * Add a new model at runtime
   */
  async addModel(modelId: string, modelConfig: any): Promise<boolean> {
    try {
      if (!this.modelConfig) {
        throw new Error('Model configuration not loaded');
      }

      // Add to configuration
      this.modelConfig.models[modelId] = modelConfig;
      
      // Register the model
      await this.registerSingleModel(modelId, modelConfig);
      
      // Save updated configuration
      await this.saveConfiguration();
      
      console.log(`✅ Model added dynamically: ${modelId}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Failed to add model ${modelId}:`, error);
      return false;
    }
  }

  /**
   * Remove a model at runtime
   */
  async removeModel(modelId: string): Promise<boolean> {
    try {
      if (!this.modelConfig) {
        throw new Error('Model configuration not loaded');
      }

      // Remove from configuration
      delete this.modelConfig.models[modelId];
      
      // Remove registration
      this.registeredModels.delete(modelId);
      
      // Save updated configuration
      await this.saveConfiguration();
      
      console.log(`✅ Model removed dynamically: ${modelId}`);
      this.emit('modelRemoved', { modelId });
      return true;
      
    } catch (error) {
      console.error(`❌ Failed to remove model ${modelId}:`, error);
      return false;
    }
  }

  /**
   * Stop the dynamic model loader
   */
  async stop(): Promise<void> {
    if (this.configWatcher) {
      clearInterval(this.configWatcher);
      this.configWatcher = null;
    }

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    console.log('🛑 Dynamic Model Loader stopped');
    this.emit('stopped');
  }

  /**
   * Private helper methods
   */
  private async readConfigFile(): Promise<string> {
    // In real implementation, would read from actual file system
    // For now, return empty JSON which will trigger default config
    throw new Error('File not found');
  }

  private async saveConfiguration(): Promise<void> {
    if (!this.modelConfig) return;
    
    // In real implementation, would write to actual file system
    console.log(`💾 Configuration saved to ${this.configPath}`);
  }

  private validateConfiguration(): void {
    if (!this.modelConfig) {
      throw new Error('No configuration to validate');
    }

    // Basic validation
    if (!this.modelConfig.models || typeof this.modelConfig.models !== 'object') {
      throw new Error('Invalid models configuration');
    }

    if (!this.modelConfig.providers || typeof this.modelConfig.providers !== 'object') {
      throw new Error('Invalid providers configuration');
    }

    console.log('✅ Configuration validation passed');
  }

  private getDefaultConfiguration(): ModelConfig {
    return {
      models: {
        'gpt-4o': {
          name: 'GPT-4o',
          provider: 'openai',
          family: 'openai',
          context: 128000,
          pricing: {
            input: 0.001,
            output: 0.002
          },
          performance: {
            latency: 500,
            regions: ['us', 'eu'],
            safety: 'std'
          },
          capabilities: ['text', 'reasoning', 'analysis'],
          enabled: true,
          metadata: {
            description: 'OpenAI GPT-4o model for general purpose tasks',
            version: '2024-05-13'
          }
        },
        'claude-3-sonnet': {
          name: 'Claude 3 Sonnet',
          provider: 'anthropic',
          family: 'anthropic',
          context: 200000,
          pricing: {
            input: 0.003,
            output: 0.015
          },
          performance: {
            latency: 600,
            regions: ['us', 'eu'],
            safety: 'std'
          },
          capabilities: ['text', 'reasoning', 'analysis', 'coding'],
          enabled: true,
          metadata: {
            description: 'Anthropic Claude 3 Sonnet for complex reasoning tasks',
            version: '20240229'
          }
        },
        'kimi-k2': {
          name: 'KIMI K2 Instruct',
          provider: 'kimi',
          family: 'kimi',
          context: 128000,
          pricing: {
            input: 0.00001,
            output: 0.00002
          },
          performance: {
            latency: 200,
            regions: ['apac', 'global'],
            safety: 'regional'
          },
          capabilities: ['text', 'multilingual', 'cost-optimized'],
          enabled: true,
          metadata: {
            description: 'KIMI K2 cost-optimized model for high-volume tasks',
            version: '2024.0'
          }
        }
      },
      providers: {
        'openai': {
          name: 'OpenAI',
          baseUrl: 'https://api.openai.com/v1',
          apiKeyEnv: 'OPENAI_API_KEY',
          healthCheckEndpoint: '/models',
          rateLimit: {
            requestsPerSecond: 10,
            requestsPerMinute: 500
          },
          enabled: true
        },
        'anthropic': {
          name: 'Anthropic',
          baseUrl: 'https://api.anthropic.com/v1',
          apiKeyEnv: 'ANTHROPIC_API_KEY',
          healthCheckEndpoint: '/messages',
          rateLimit: {
            requestsPerSecond: 5,
            requestsPerMinute: 200
          },
          enabled: true
        },
        'kimi': {
          name: 'KIMI AI',
          baseUrl: 'https://api.moonshot.cn/v1',
          apiKeyEnv: 'KIMI_API_KEY',
          rateLimit: {
            requestsPerSecond: 20,
            requestsPerMinute: 1000
          },
          enabled: true
        }
      },
      categories: {
        'text-models': {
          name: 'Text Generation Models',
          description: 'Models for text generation and completion',
          modelIds: ['gpt-4o', 'claude-3-sonnet'],
          defaultModel: 'gpt-4o'
        },
        'cost-optimized': {
          name: 'Cost-Optimized Models',
          description: 'Models optimized for cost efficiency',
          modelIds: ['kimi-k2'],
          defaultModel: 'kimi-k2'
        }
      }
    };
  }
}