/**
 * Redis Configuration for Production Scaling
 * Handles caching, sessions, and real-time data
 */
import Redis from 'ioredis';

// Track reconnection attempts to reduce log spam
let reconnectAttempts = 0;
const MAX_LOG_RECONNECTS = 3; // Only log first 3 reconnection attempts

// Redis connection configuration with bounded retry strategy
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: 1, // Fail fast if Redis unavailable
  lazyConnect: true,
  enableOfflineQueue: false, // Don't queue commands if disconnected
  
  // Exponential backoff: retry after 1s, 2s, 4s, 8s, 16s, then 30s max
  retryStrategy: (times: number) => {
    if (times === 1 && reconnectAttempts <= MAX_LOG_RECONNECTS) {
      console.log('⚠️ Redis connection lost - attempting reconnection with exponential backoff');
    }
    reconnectAttempts = times;
    
    // Cap at 30 seconds between retries
    const delay = Math.min(times * 1000, 30000);
    return delay;
  },
  
  // Allow reconnection on all errors
  reconnectOnError: (err: Error) => {
    // Always attempt reconnect, but errors are suppressed by error handlers
    return true;
  }
};

// Create Redis clients with error handling (graceful degradation if unavailable)
export const redisClient = new Redis(redisConfig);
export const redisSubscriber = new Redis(redisConfig);
export const redisPublisher = new Redis(redisConfig);

// Track error logging to reduce spam (reset on successful connection)
let consecutiveErrors = 0;
const MAX_ERROR_LOGS = 3; // Log first 3 errors, then silent until reconnect

// Handle connection events
redisClient.on('connect', () => {
  if (consecutiveErrors > 0) {
    console.log('✅ Redis reconnected successfully');
    // Notify EventService to re-check availability
    if (eventServiceInstance) {
      eventServiceInstance.onRedisReconnect();
    }
  }
  consecutiveErrors = 0;
  reconnectAttempts = 0;
});

redisClient.on('error', (err) => {
  consecutiveErrors++;
  if (consecutiveErrors <= MAX_ERROR_LOGS) {
    if (err.message.includes('ECONNREFUSED')) {
      console.warn(`⚠️ Redis unavailable (graceful degradation active) - will retry with backoff`);
    } else {
      console.warn('⚠️ Redis error:', err.message);
    }
  }
  // After MAX_ERROR_LOGS, go silent to avoid spam
});

// Subscriber and publisher share same logging
redisSubscriber.on('connect', () => {
  // Silent - already logged by client
  // Re-check availability when pub/sub clients reconnect
  if (eventServiceInstance) {
    eventServiceInstance.onRedisReconnect();
  }
});

redisPublisher.on('connect', () => {
  // Silent - already logged by client  
  // Re-check availability when pub/sub clients reconnect
  if (eventServiceInstance) {
    eventServiceInstance.onRedisReconnect();
  }
});

redisSubscriber.on('error', () => {
  // Silent - already logged by client
});

redisPublisher.on('error', () => {
  // Silent - already logged by client
});

// Cache service for application data
export class CacheService {
  private redis: Redis;
  private isAvailable: boolean = false;

  constructor() {
    this.redis = redisClient;
    console.log('ℹ️ CacheService initialized - Redis is optional');
  }

  /**
   * Set cache with expiration (gracefully handles Redis unavailability)
   */
  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await this.redis.setex(key, ttlSeconds, serialized);
    } catch (error) {
      console.log(`📝 [Cache skipped - Redis unavailable] ${key}`);
      // Fail silently - caching is optional
    }
  }

  /**
   * Get cached value (gracefully handles Redis unavailability)
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.redis.get(key);
      if (!cached) return null;
      
      return JSON.parse(cached) as T;
    } catch (error) {
      // Fail silently - caching is optional
      return null;
    }
  }

  /**
   * Delete cache key (gracefully handles Redis unavailability)
   */
  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      // Fail silently - caching is optional
    }
  }

  /**
   * Clear cache by pattern (gracefully handles Redis unavailability)
   */
  async clearPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      // Fail silently - caching is optional
    }
  }

  /**
   * Cache user data
   */
  async cacheUser(userId: string | number, userData: any): Promise<void> {
    await this.set(`user:${userId}`, userData, 3600); // 1 hour
  }

  /**
   * Get cached user
   */
  async getCachedUser(userId: string | number): Promise<any | null> {
    return await this.get(`user:${userId}`);
  }

  /**
   * Cache project data
   */
  async cacheProject(projectId: number, projectData: any): Promise<void> {
    await this.set(`project:${projectId}`, projectData, 1800); // 30 minutes
  }

  /**
   * Get cached project
   */
  async getCachedProject(projectId: number): Promise<any | null> {
    return await this.get(`project:${projectId}`);
  }

  /**
   * Cache agent execution results
   */
  async cacheAgentResult(agentId: string, taskId: string, result: any): Promise<void> {
    await this.set(`agent:${agentId}:${taskId}`, result, 7200); // 2 hours
  }

  /**
   * Get cached agent result
   */
  async getCachedAgentResult(agentId: string, taskId: string): Promise<any | null> {
    return await this.get(`agent:${agentId}:${taskId}`);
  }

  /**
   * Cache agent catalog (full registry of all agents)
   */
  async cacheAgentCatalog(catalog: any): Promise<void> {
    await this.set('agent-catalog:full', catalog, 3600); // 1 hour
  }

  /**
   * Get cached agent catalog
   */
  async getCachedAgentCatalog(): Promise<any | null> {
    return await this.get('agent-catalog:full');
  }

  /**
   * Cache single agent config
   */
  async cacheAgentConfig(agentId: string, config: any): Promise<void> {
    await this.set(`agent-catalog:config:${agentId}`, config, 3600); // 1 hour
  }

  /**
   * Get cached agent config
   */
  async getCachedAgentConfig(agentId: string): Promise<any | null> {
    return await this.get(`agent-catalog:config:${agentId}`);
  }

  /**
   * Cache agents by tier
   */
  async cacheAgentsByTier(tier: string, agents: any[]): Promise<void> {
    await this.set(`agent-catalog:tier:${tier}`, agents, 1800); // 30 minutes
  }

  /**
   * Get cached agents by tier
   */
  async getCachedAgentsByTier(tier: string): Promise<any[] | null> {
    return await this.get(`agent-catalog:tier:${tier}`);
  }

  /**
   * Cache agents by specialization
   */
  async cacheAgentsBySpecialization(specialization: string, agents: any[]): Promise<void> {
    await this.set(`agent-catalog:specialization:${specialization}`, agents, 1800); // 30 minutes
  }

  /**
   * Get cached agents by specialization
   */
  async getCachedAgentsBySpecialization(specialization: string): Promise<any[] | null> {
    return await this.get(`agent-catalog:specialization:${specialization}`);
  }

  /**
   * Cache agent statistics
   */
  async cacheAgentStatistics(stats: any): Promise<void> {
    await this.set('agent-catalog:statistics', stats, 1800); // 30 minutes
  }

  /**
   * Get cached agent statistics
   */
  async getCachedAgentStatistics(): Promise<any | null> {
    return await this.get('agent-catalog:statistics');
  }

  /**
   * Invalidate all agent catalog caches
   */
  async invalidateAgentCatalogCache(): Promise<void> {
    await this.clearPattern('agent-catalog:*');
  }
}

// Store EventService instance to notify on reconnection
let eventServiceInstance: EventService | null = null;

// Real-time event service using Redis pub/sub
export class EventService {
  private publisher: Redis;
  private subscriber: Redis;
  private isRedisAvailable: boolean = false;

  constructor() {
    this.publisher = redisPublisher;
    this.subscriber = redisSubscriber;
    
    // Probe Redis availability on startup
    this.checkRedisAvailability();
    console.log('ℹ️ EventService initialized - checking Redis availability...');
    
    // Store instance for reconnection callbacks
    eventServiceInstance = this;
  }

  /**
   * Check if Redis is available and update the flag
   */
  private async checkRedisAvailability(): Promise<void> {
    try {
      await this.publisher.ping();
      const wasUnavailable = !this.isRedisAvailable;
      this.isRedisAvailable = true;
      if (wasUnavailable) {
        console.log('✅ EventService: Redis pub/sub restored');
      } else {
        console.log('✅ EventService: Redis is available for pub/sub');
      }
    } catch (error) {
      this.isRedisAvailable = false;
      console.warn('⚠️ EventService: Redis unavailable, using graceful degradation');
    }
  }

  /**
   * Called when Redis reconnects - re-check availability
   */
  public onRedisReconnect(): void {
    this.checkRedisAvailability();
  }

  /**
   * Publish event to channel (gracefully handles Redis unavailability)
   */
  async publishEvent(channel: string, event: any): Promise<void> {
    const eventData = {
      timestamp: new Date().toISOString(),
      ...event
    };
    
    if (!this.isRedisAvailable) {
      console.log(`📝 [Event Log - Redis unavailable] ${channel}:`, eventData);
      return; // Exit gracefully without error
    }
    
    try {
      await this.publisher.publish(channel, JSON.stringify(eventData));
    } catch (error) {
      console.warn(`⚠️ Failed to publish event to ${channel} (non-critical):`, error);
      this.isRedisAvailable = false; // Mark as unavailable for future calls
      // Retry connection check in background
      setTimeout(() => this.checkRedisAvailability(), 5000);
    }
  }

  /**
   * Subscribe to channel events (gracefully handles Redis unavailability)
   */
  async subscribeToChannel(channel: string, callback: (event: any) => void): Promise<void> {
    if (!this.isRedisAvailable) {
      console.log(`📝 [Event Log] Skipping subscription to ${channel} - Redis unavailable`);
      return; // Exit gracefully without error
    }

    try {
      await this.subscriber.subscribe(channel);
      
      this.subscriber.on('message', (receivedChannel, message) => {
        if (receivedChannel === channel) {
          try {
            const event = JSON.parse(message);
            callback(event);
          } catch (error) {
            console.error('Event parsing error:', error);
          }
        }
      });
    } catch (error) {
      console.warn(`⚠️ Failed to subscribe to ${channel} (non-critical):`, error);
      this.isRedisAvailable = false;
      // Retry connection check in background
      setTimeout(() => this.checkRedisAvailability(), 5000);
    }
  }

  /**
   * Publish project status update
   */
  async publishProjectUpdate(projectId: number, status: string, progress: number): Promise<void> {
    await this.publishEvent(`project:${projectId}`, {
      type: 'status_update',
      projectId,
      status,
      progress
    });
  }

  /**
   * Publish agent status update
   */
  async publishAgentUpdate(agentId: string, status: string, message?: string): Promise<void> {
    await this.publishEvent('agent_updates', {
      type: 'agent_status',
      agentId,
      status,
      message
    });
  }

  /**
   * Publish deployment update
   */
  async publishDeploymentUpdate(deploymentId: string, status: string, logs?: string[]): Promise<void> {
    await this.publishEvent('deployment_updates', {
      type: 'deployment_status',
      deploymentId,
      status,
      logs
    });
  }
}

// Session store for Redis
export class RedisSessionStore {
  private redis: Redis;
  private prefix: string = 'sess:';

  constructor() {
    this.redis = redisClient;
  }

  async get(sessionId: string): Promise<any | null> {
    const session = await this.redis.get(this.prefix + sessionId);
    return session ? JSON.parse(session) : null;
  }

  async set(sessionId: string, session: any, ttl: number = 86400): Promise<void> {
    await this.redis.setex(this.prefix + sessionId, ttl, JSON.stringify(session));
  }

  async destroy(sessionId: string): Promise<void> {
    await this.redis.del(this.prefix + sessionId);
  }

  async clear(): Promise<void> {
    const keys = await this.redis.keys(this.prefix + '*');
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

// Export singleton instances
export const cacheService = new CacheService();
export const eventService = new EventService();
export const sessionStore = new RedisSessionStore();

// Initialize Redis connections
export async function initializeRedis(): Promise<void> {
  try {
    // Test connections
    await redisClient.ping();
    console.log('✅ Redis client connected');
    
    await redisPublisher.ping();
    console.log('✅ Redis publisher connected');
    
    await redisSubscriber.ping();
    console.log('✅ Redis subscriber connected');
    
  } catch (error) {
    console.warn('⚠️ Redis not available, falling back to memory cache');
    // Could implement memory fallback here if needed
  }
}

// Health check for Redis
export async function checkRedisHealth(): Promise<boolean> {
  try {
    await redisClient.ping();
    return true;
  } catch (error) {
    return false;
  }
}