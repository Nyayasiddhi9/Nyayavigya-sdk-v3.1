/**
 * WAI SDK Configuration
 * Type-safe configuration with validation
 */

import { z } from 'zod';

/**
 * Configuration schema
 */
export const WAIConfigSchema = z.object({
  // Core settings
  studioId: z.string().min(1),
  environment: z.enum(['development', 'staging', 'production']).default('development'),
  
  // Features
  features: z.object({
    monitoring: z.boolean().default(true),
    caching: z.boolean().default(true),
    streaming: z.boolean().default(true),
    multiModal: z.boolean().default(false),
  }).default({}),
  
  // Storage configuration
  storage: z.object({
    type: z.enum(['memory', 'postgresql', 'redis']).default('memory'),
    connectionString: z.string().optional(),
    ttl: z.number().optional(),
  }).default({ type: 'memory' }),
  
  // Event bus configuration
  eventBus: z.object({
    type: z.enum(['memory', 'redis', 'kafka']).default('memory'),
    connectionString: z.string().optional(),
  }).default({ type: 'memory' }),
  
  // Job queue configuration
  jobQueue: z.object({
    type: z.enum(['memory', 'postgresql', 'redis']).default('memory'),
    connectionString: z.string().optional(),
    concurrency: z.number().min(1).max(100).default(10),
  }).default({ type: 'memory', concurrency: 10 }),
  
  // Orchestration settings
  orchestration: z.object({
    maxRetries: z.number().min(0).max(10).default(3),
    timeout: z.number().min(1000).default(30000),
    costOptimization: z.boolean().default(true),
    qualityThreshold: z.number().min(0).max(1).default(0.8),
  }).default({}),
  
  // Logging
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    format: z.enum(['json', 'text']).default('text'),
  }).default({}),
  
  // API keys (optional, can be provided separately)
  apiKeys: z.record(z.string()).optional(),
});

export type WAIConfig = z.infer<typeof WAIConfigSchema>;

/**
 * Default configuration
 */
export const defaultConfig: WAIConfig = {
  studioId: 'default',
  environment: 'development',
  features: {
    monitoring: true,
    caching: true,
    streaming: true,
    multiModal: false,
  },
  storage: {
    type: 'memory',
  },
  eventBus: {
    type: 'memory',
  },
  jobQueue: {
    type: 'memory',
    concurrency: 10,
  },
  orchestration: {
    maxRetries: 3,
    timeout: 30000,
    costOptimization: true,
    qualityThreshold: 0.8,
  },
  logging: {
    level: 'info',
    format: 'text',
  },
};

/**
 * Create validated configuration
 */
export function createConfig(config: Partial<WAIConfig>): WAIConfig {
  const merged = {
    ...defaultConfig,
    ...config,
    features: { ...defaultConfig.features, ...config.features },
    storage: { ...defaultConfig.storage, ...config.storage },
    eventBus: { ...defaultConfig.eventBus, ...config.eventBus },
    jobQueue: { ...defaultConfig.jobQueue, ...config.jobQueue },
    orchestration: { ...defaultConfig.orchestration, ...config.orchestration },
    logging: { ...defaultConfig.logging, ...config.logging },
  };

  return WAIConfigSchema.parse(merged);
}

/**
 * Load configuration from environment variables
 */
export function loadConfigFromEnv(): Partial<WAIConfig> {
  return {
    studioId: process.env.WAI_STUDIO_ID,
    environment: (process.env.WAI_ENVIRONMENT || process.env.NODE_ENV) as any,
    
    storage: process.env.DATABASE_URL ? {
      type: 'postgresql',
      connectionString: process.env.DATABASE_URL,
    } : undefined,
    
    eventBus: process.env.REDIS_URL ? {
      type: 'redis',
      connectionString: process.env.REDIS_URL,
    } : undefined,
    
    jobQueue: process.env.DATABASE_URL ? {
      type: 'postgresql',
      connectionString: process.env.DATABASE_URL,
      concurrency: 10,
    } : undefined,
    
    apiKeys: {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
      RUNWAY_API_KEY: process.env.RUNWAY_API_KEY,
    } as Record<string, string>,
  };
}
