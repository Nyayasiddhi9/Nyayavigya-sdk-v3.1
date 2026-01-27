/**
 * Production Configuration & Environment Validation
 * WAI SDK v1.0 - Wizards Incubator Platform
 */

export interface ProductionConfig {
  // Server Configuration
  nodeEnv: string;
  port: number;
  host: string;
  
  // Database Configuration
  databaseUrl: string;
  pgHost?: string;
  pgPort?: number;
  pgUser?: string;
  pgPassword?: string;
  pgDatabase?: string;
  
  // Security & Authentication
  sessionSecret: string;
  jwtSecret: string;
  
  // LLM Provider API Keys (23+ providers)
  openaiApiKey?: string;
  anthropicApiKey?: string;
  geminiApiKey?: string;
  xaiApiKey?: string;
  perplexityApiKey?: string;
  cohereApiKey?: string;
  kieAiApiKey?: string;
  moonshotApiKey?: string;
  
  // Feature Flags
  enableCaching: boolean;
  enableRateLimiting: boolean;
  enableMetrics: boolean;
  enableHealthChecks: boolean;
  
  // Performance Tuning
  maxConnections: number;
  requestTimeout: number;
  keepAliveTimeout: number;
}

/**
 * Required environment variables for production deployment
 */
const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'SESSION_SECRET',
  'JWT_SECRET',
];

/**
 * Optional but recommended environment variables
 */
const RECOMMENDED_ENV_VARS = [
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'GEMINI_API_KEY',
  'XAI_API_KEY',
  'PERPLEXITY_API_KEY',
];

/**
 * Validate environment variables and throw error if missing required ones
 */
export function validateEnvironment(): void {
  const missing: string[] = [];
  const warnings: string[] = [];
  
  // Check required variables
  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }
  
  // Check recommended variables
  for (const envVar of RECOMMENDED_ENV_VARS) {
    if (!process.env[envVar]) {
      warnings.push(envVar);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(
      `❌ Missing required environment variables:\n${missing.map(v => `  - ${v}`).join('\n')}\n` +
      `Please set these variables before starting the application.`
    );
  }
  
  if (warnings.length > 0 && process.env.NODE_ENV === 'production') {
    console.warn(
      `⚠️  Missing recommended environment variables:\n${warnings.map(v => `  - ${v}`).join('\n')}\n` +
      `Some features may be limited without these API keys.`
    );
  }
  
  console.log('✅ Environment validation passed');
}

/**
 * Load and validate production configuration
 */
export function loadProductionConfig(): ProductionConfig {
  // Validate environment first
  validateEnvironment();
  
  const config: ProductionConfig = {
    // Server
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5000', 10),
    host: process.env.HOST || '0.0.0.0',
    
    // Database
    databaseUrl: process.env.DATABASE_URL!,
    pgHost: process.env.PGHOST,
    pgPort: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : undefined,
    pgUser: process.env.PGUSER,
    pgPassword: process.env.PGPASSWORD,
    pgDatabase: process.env.PGDATABASE,
    
    // Security
    sessionSecret: process.env.SESSION_SECRET!,
    jwtSecret: process.env.JWT_SECRET!,
    
    // LLM Providers
    openaiApiKey: process.env.OPENAI_API_KEY,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    geminiApiKey: process.env.GEMINI_API_KEY,
    xaiApiKey: process.env.XAI_API_KEY,
    perplexityApiKey: process.env.PERPLEXITY_API_KEY,
    cohereApiKey: process.env.COHERE_API_KEY,
    kieAiApiKey: process.env.KIE_AI_API_KEY,
    moonshotApiKey: process.env.MOONSHOT_API_KEY,
    
    // Feature Flags
    enableCaching: process.env.ENABLE_CACHING !== 'false',
    enableRateLimiting: process.env.ENABLE_RATE_LIMITING !== 'false',
    enableMetrics: process.env.ENABLE_METRICS !== 'false',
    enableHealthChecks: process.env.ENABLE_HEALTH_CHECKS !== 'false',
    
    // Performance
    maxConnections: parseInt(process.env.MAX_DB_CONNECTIONS || '20', 10),
    requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '30000', 10),
    keepAliveTimeout: parseInt(process.env.KEEP_ALIVE_TIMEOUT || '65000', 10),
  };
  
  // Log configuration summary (without secrets)
  console.log('📋 Production Configuration Loaded:');
  console.log(`   Environment: ${config.nodeEnv}`);
  console.log(`   Server: ${config.host}:${config.port}`);
  console.log(`   Database: ${config.databaseUrl ? '✅ Connected' : '❌ Not configured'}`);
  console.log(`   LLM Providers: ${countConfiguredProviders(config)} configured`);
  console.log(`   Features: Cache=${config.enableCaching}, RateLimit=${config.enableRateLimiting}, Metrics=${config.enableMetrics}`);
  
  return config;
}

/**
 * Count configured LLM providers
 */
function countConfiguredProviders(config: ProductionConfig): number {
  const providers = [
    config.openaiApiKey,
    config.anthropicApiKey,
    config.geminiApiKey,
    config.xaiApiKey,
    config.perplexityApiKey,
    config.cohereApiKey,
    config.kieAiApiKey,
    config.moonshotApiKey,
  ];
  return providers.filter(Boolean).length;
}

/**
 * Get configuration for specific cloud platform
 */
export function getCloudPlatformConfig(): {
  platform: 'aws' | 'gcp' | 'azure' | 'local';
  region?: string;
  instanceId?: string;
} {
  // Detect cloud platform from environment
  if (process.env.AWS_REGION || process.env.AWS_EXECUTION_ENV) {
    return {
      platform: 'aws',
      region: process.env.AWS_REGION,
      instanceId: process.env.AWS_INSTANCE_ID,
    };
  }
  
  if (process.env.GOOGLE_CLOUD_PROJECT || process.env.K_SERVICE) {
    return {
      platform: 'gcp',
      region: process.env.GOOGLE_CLOUD_REGION,
      instanceId: process.env.K_REVISION,
    };
  }
  
  if (process.env.WEBSITE_INSTANCE_ID || process.env.WEBSITE_SITE_NAME) {
    return {
      platform: 'azure',
      region: process.env.WEBSITE_LOCATION,
      instanceId: process.env.WEBSITE_INSTANCE_ID,
    };
  }
  
  return { platform: 'local' };
}

export const productionConfig = loadProductionConfig();
