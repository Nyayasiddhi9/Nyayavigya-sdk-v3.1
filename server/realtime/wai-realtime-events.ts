/**
 * WAI Real-time Events System v8.0
 * WebSocket and SSE support for real-time orchestration updates
 */

import { EventEmitter } from 'events';
import { randomUUID as uuidv4 } from 'crypto';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';

// ================================================================================================
// REAL-TIME EVENTS SYSTEM V8.0
// ================================================================================================

export interface EventSubscription {
  id: string;
  userId: string;
  platform: string;
  eventTypes: string[];
  filters?: {
    taskId?: string;
    agentId?: string;
    integration?: string;
    priority?: 'low' | 'medium' | 'high';
  };
  delivery: 'websocket' | 'sse' | 'webhook';
  endpoint?: string; // For webhook delivery
  isActive: boolean;
  createdAt: Date;
  lastDelivery?: Date;
}

export interface WAIEvent {
  id: string;
  type: string;
  source: string;
  userId?: string;
  platform?: string;
  data: any;
  metadata: {
    timestamp: Date;
    correlationId?: string;
    priority: 'low' | 'medium' | 'high';
    retryCount?: number;
  };
  delivery: {
    websocket?: boolean;
    sse?: boolean;
    webhook?: boolean;
  };
}

export interface WebSocketConnection {
  id: string;
  socket: WebSocket;
  userId: string;
  platform: string;
  authenticated: boolean;
  subscriptions: string[];
  lastPing: Date;
  isAlive: boolean;
}

export interface SSEConnection {
  id: string;
  response: http.ServerResponse;
  userId: string;
  platform: string;
  authenticated: boolean;
  subscriptions: string[];
  lastKeepAlive: Date;
  isActive: boolean;
}

export class WAIRealTimeEventsSystem extends EventEmitter {
  public readonly version = '8.0.0';
  
  private wss: WebSocketServer | null = null;
  private wsConnections: Map<string, WebSocketConnection> = new Map();
  private sseConnections: Map<string, SSEConnection> = new Map();
  private subscriptions: Map<string, EventSubscription> = new Map();
  private eventQueue: Map<string, WAIEvent[]> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.initializeRealTimeSystem();
  }

  private async initializeRealTimeSystem(): Promise<void> {
    console.log('⚡ Initializing WAI Real-time Events System v8.0...');
    
    await this.setupEventTypes();
    await this.startPingInterval();
    await this.startCleanupInterval();
    
    console.log('✅ Real-time events system initialized with WebSocket and SSE support');
  }

  // ================================================================================================
  // EVENT TYPES SETUP
  // ================================================================================================

  private async setupEventTypes(): Promise<void> {
    console.log('📡 Setting up event types...');
    
    const eventTypes = [
      // Orchestration Events
      'orchestration.started',
      'orchestration.progress',
      'orchestration.completed',
      'orchestration.failed',
      'orchestration.cancelled',

      // LLM Events
      'llm.request',
      'llm.response',
      'llm.routing',
      'llm.cost_update',
      'llm.provider_switch',

      // Agent Events
      'agent.deployed',
      'agent.started',
      'agent.progress',
      'agent.completed',
      'agent.failed',
      'agent.healing',

      // Integration Events
      'integration.agentzero.team_deployed',
      'integration.agentzero.task_assigned',
      'integration.langchain.workflow_created',
      'integration.langchain.chain_executed',
      'integration.replicate.prediction_started',
      'integration.replicate.prediction_completed',
      'integration.together.request',
      'integration.openrouter.routed',

      // System Events
      'system.health_check',
      'system.scaling',
      'system.resource_alert',
      'system.performance_update',

      // Analytics Events
      'analytics.usage_update',
      'analytics.cost_alert',
      'analytics.quota_warning',
      'analytics.insights_generated',

      // Creative Events
      'creative.content_generated',
      'creative.avatar_created',
      'creative.multimedia_processed',

      // SDLC Events
      'sdlc.project_created',
      'sdlc.refinement_cycle',
      'sdlc.deployment_status',
      'sdlc.quality_check',

      // User Events
      'user.authenticated',
      'user.api_key_created',
      'user.quota_exceeded',
      'user.rate_limited'
    ];

    console.log(`✅ Configured ${eventTypes.length} event types`);
  }

  // ================================================================================================
  // WEBSOCKET SERVER SETUP
  // ================================================================================================

  public setupWebSocketServer(server: http.Server): void {
    console.log('🔌 Setting up WebSocket server...');
    
    this.wss = new WebSocketServer({ 
      server,
      path: '/api/v8/events'
    });

    this.wss.on('connection', (ws: WebSocket, request) => {
      this.handleWebSocketConnection(ws, request);
    });

    console.log('✅ WebSocket server ready at /api/v8/events');
  }

  private handleWebSocketConnection(ws: WebSocket, request: http.IncomingMessage): void {
    const connectionId = uuidv4();
    
    const connection: WebSocketConnection = {
      id: connectionId,
      socket: ws,
      userId: '',
      platform: '',
      authenticated: false,
      subscriptions: [],
      lastPing: new Date(),
      isAlive: true
    };

    this.wsConnections.set(connectionId, connection);

    // Set up message handlers
    ws.on('message', (data: Buffer) => {
      this.handleWebSocketMessage(connectionId, data);
    });

    ws.on('pong', () => {
      connection.lastPing = new Date();
      connection.isAlive = true;
    });

    ws.on('close', () => {
      this.handleWebSocketClose(connectionId);
    });

    ws.on('error', (error) => {
      console.error(`WebSocket error for connection ${connectionId}:`, error);
      this.handleWebSocketClose(connectionId);
    });

    // Send welcome message
    this.sendWebSocketMessage(connectionId, {
      type: 'system.welcome',
      data: {
        connectionId,
        version: this.version,
        timestamp: new Date().toISOString()
      }
    });

    console.log(`🔌 New WebSocket connection: ${connectionId}`);
  }

  private handleWebSocketMessage(connectionId: string, data: Buffer): void {
    try {
      const message = JSON.parse(data.toString());
      const connection = this.wsConnections.get(connectionId);
      
      if (!connection) return;

      switch (message.type) {
        case 'auth':
          this.authenticateWebSocketConnection(connectionId, message.apiKey, message.platform);
          break;
          
        case 'subscribe':
          this.handleWebSocketSubscription(connectionId, message.eventTypes, message.filters);
          break;
          
        case 'unsubscribe':
          this.handleWebSocketUnsubscription(connectionId, message.eventTypes);
          break;
          
        case 'ping':
          this.sendWebSocketMessage(connectionId, { type: 'pong', timestamp: new Date().toISOString() });
          break;
          
        default:
          this.sendWebSocketMessage(connectionId, { 
            type: 'error', 
            error: 'Unknown message type',
            receivedType: message.type 
          });
      }
    } catch (error) {
      this.sendWebSocketMessage(connectionId, { 
        type: 'error', 
        error: 'Invalid JSON message' 
      });
    }
  }

  private async authenticateWebSocketConnection(connectionId: string, apiKey: string, platform: string): Promise<void> {
    const connection = this.wsConnections.get(connectionId);
    if (!connection) return;

    try {
      // In production, validate API key against authentication system
      const isValid = await this.validateAPIKey(apiKey);
      
      if (isValid) {
        connection.authenticated = true;
        connection.userId = isValid.userId;
        connection.platform = platform || 'unknown';
        
        this.sendWebSocketMessage(connectionId, {
          type: 'auth.success',
          data: {
            userId: connection.userId,
            platform: connection.platform,
            timestamp: new Date().toISOString()
          }
        });

        this.emit('websocket.authenticated', { connectionId, userId: connection.userId, platform });
      } else {
        this.sendWebSocketMessage(connectionId, {
          type: 'auth.failed',
          error: 'Invalid API key'
        });
        
        setTimeout(() => {
          connection.socket.close(1008, 'Authentication failed');
        }, 1000);
      }
    } catch (error) {
      this.sendWebSocketMessage(connectionId, {
        type: 'auth.error',
        error: 'Authentication error'
      });
    }
  }

  private handleWebSocketSubscription(connectionId: string, eventTypes: string[], filters?: any): void {
    const connection = this.wsConnections.get(connectionId);
    if (!connection || !connection.authenticated) {
      this.sendWebSocketMessage(connectionId, {
        type: 'error',
        error: 'Not authenticated'
      });
      return;
    }

    // Create subscription
    const subscriptionId = uuidv4();
    const subscription: EventSubscription = {
      id: subscriptionId,
      userId: connection.userId,
      platform: connection.platform,
      eventTypes: eventTypes || ['*'],
      filters,
      delivery: 'websocket',
      isActive: true,
      createdAt: new Date()
    };

    this.subscriptions.set(subscriptionId, subscription);
    connection.subscriptions.push(subscriptionId);

    this.sendWebSocketMessage(connectionId, {
      type: 'subscription.success',
      data: {
        subscriptionId,
        eventTypes,
        filters
      }
    });

    this.emit('subscription.created', { type: 'websocket', subscription });
  }

  private handleWebSocketUnsubscription(connectionId: string, eventTypes: string[]): void {
    const connection = this.wsConnections.get(connectionId);
    if (!connection) return;

    // Remove subscriptions
    const removedSubscriptions = [];
    for (const subscriptionId of connection.subscriptions) {
      const subscription = this.subscriptions.get(subscriptionId);
      if (subscription && eventTypes.some(type => subscription.eventTypes.includes(type))) {
        this.subscriptions.delete(subscriptionId);
        removedSubscriptions.push(subscriptionId);
      }
    }

    connection.subscriptions = connection.subscriptions.filter(
      id => !removedSubscriptions.includes(id)
    );

    this.sendWebSocketMessage(connectionId, {
      type: 'unsubscribe.success',
      data: {
        removedSubscriptions,
        eventTypes
      }
    });
  }

  private sendWebSocketMessage(connectionId: string, message: any): void {
    const connection = this.wsConnections.get(connectionId);
    if (connection && connection.socket.readyState === WebSocket.OPEN) {
      connection.socket.send(JSON.stringify(message));
    }
  }

  private handleWebSocketClose(connectionId: string): void {
    const connection = this.wsConnections.get(connectionId);
    if (connection) {
      // Clean up subscriptions
      for (const subscriptionId of connection.subscriptions) {
        this.subscriptions.delete(subscriptionId);
      }
      
      this.wsConnections.delete(connectionId);
      console.log(`🔌 WebSocket connection closed: ${connectionId}`);
    }
  }

  // ================================================================================================
  // SERVER-SENT EVENTS (SSE) SETUP
  // ================================================================================================

  public handleSSEConnection(request: http.IncomingMessage, response: http.ServerResponse): void {
    const connectionId = uuidv4();
    
    // Set SSE headers
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Allow-Methods': 'GET'
    });

    const connection: SSEConnection = {
      id: connectionId,
      response,
      userId: '',
      platform: '',
      authenticated: false,
      subscriptions: [],
      lastKeepAlive: new Date(),
      isActive: true
    };

    this.sseConnections.set(connectionId, connection);

    // Send initial connection event
    this.sendSSEMessage(connectionId, {
      type: 'system.connected',
      data: {
        connectionId,
        version: this.version,
        timestamp: new Date().toISOString()
      }
    });

    // Handle connection close
    request.on('close', () => {
      this.handleSSEClose(connectionId);
    });

    request.on('error', () => {
      this.handleSSEClose(connectionId);
    });

    console.log(`📡 New SSE connection: ${connectionId}`);
  }

  public authenticateSSEConnection(connectionId: string, apiKey: string, platform: string): void {
    const connection = this.sseConnections.get(connectionId);
    if (!connection) return;

    // Validate API key (simplified for demo)
    if (apiKey && apiKey.startsWith('wai_')) {
      connection.authenticated = true;
      connection.userId = apiKey; // In production, resolve to actual user ID
      connection.platform = platform || 'unknown';
      
      this.sendSSEMessage(connectionId, {
        type: 'auth.success',
        data: {
          userId: connection.userId,
          platform: connection.platform
        }
      });
    } else {
      this.sendSSEMessage(connectionId, {
        type: 'auth.failed',
        error: 'Invalid API key'
      });
    }
  }

  public subscribeSSEToEvents(connectionId: string, eventTypes: string[], filters?: any): void {
    const connection = this.sseConnections.get(connectionId);
    if (!connection || !connection.authenticated) return;

    // Create subscription
    const subscriptionId = uuidv4();
    const subscription: EventSubscription = {
      id: subscriptionId,
      userId: connection.userId,
      platform: connection.platform,
      eventTypes: eventTypes || ['*'],
      filters,
      delivery: 'sse',
      isActive: true,
      createdAt: new Date()
    };

    this.subscriptions.set(subscriptionId, subscription);
    connection.subscriptions.push(subscriptionId);

    this.sendSSEMessage(connectionId, {
      type: 'subscription.success',
      data: {
        subscriptionId,
        eventTypes,
        filters
      }
    });
  }

  private sendSSEMessage(connectionId: string, event: any): void {
    const connection = this.sseConnections.get(connectionId);
    if (connection && connection.isActive) {
      const eventData = JSON.stringify(event);
      const message = `id: ${uuidv4()}\nevent: ${event.type}\ndata: ${eventData}\n\n`;
      
      try {
        connection.response.write(message);
        connection.lastKeepAlive = new Date();
      } catch (error) {
        console.error(`SSE write error for connection ${connectionId}:`, error);
        this.handleSSEClose(connectionId);
      }
    }
  }

  private handleSSEClose(connectionId: string): void {
    const connection = this.sseConnections.get(connectionId);
    if (connection) {
      connection.isActive = false;
      
      // Clean up subscriptions
      for (const subscriptionId of connection.subscriptions) {
        this.subscriptions.delete(subscriptionId);
      }
      
      this.sseConnections.delete(connectionId);
      console.log(`📡 SSE connection closed: ${connectionId}`);
    }
  }

  // ================================================================================================
  // EVENT PUBLISHING AND DISTRIBUTION
  // ================================================================================================

  public publishEvent(event: Omit<WAIEvent, 'id' | 'metadata'>): void {
    const fullEvent: WAIEvent = {
      id: uuidv4(),
      ...event,
      metadata: {
        timestamp: new Date(),
        priority: event.data?.priority || 'medium',
        correlationId: event.data?.correlationId,
        retryCount: 0
      },
      delivery: {
        websocket: true,
        sse: true,
        webhook: false
      }
    };

    // Add to event queue for reliable delivery
    this.addToEventQueue(fullEvent);

    // Distribute to connected clients
    this.distributeEvent(fullEvent);

    this.emit('event.published', fullEvent);
  }

  private distributeEvent(event: WAIEvent): void {
    // Find matching subscriptions
    const matchingSubscriptions = Array.from(this.subscriptions.values()).filter(
      subscription => this.matchesSubscription(event, subscription)
    );

    for (const subscription of matchingSubscriptions) {
      switch (subscription.delivery) {
        case 'websocket':
          this.deliverToWebSocket(event, subscription);
          break;
        case 'sse':
          this.deliverToSSE(event, subscription);
          break;
        case 'webhook':
          this.deliverToWebhook(event, subscription);
          break;
      }
    }
  }

  private matchesSubscription(event: WAIEvent, subscription: EventSubscription): boolean {
    // Check if subscription is active
    if (!subscription.isActive) return false;

    // Check event type matching
    if (!subscription.eventTypes.includes('*') && 
        !subscription.eventTypes.includes(event.type) &&
        !subscription.eventTypes.some(type => event.type.startsWith(type.replace('*', '')))) {
      return false;
    }

    // Check user/platform matching
    if (event.userId && event.userId !== subscription.userId) return false;
    if (event.platform && event.platform !== subscription.platform) return false;

    // Check filters
    if (subscription.filters) {
      const filters = subscription.filters;
      
      if (filters.taskId && event.data?.taskId !== filters.taskId) return false;
      if (filters.agentId && event.data?.agentId !== filters.agentId) return false;
      if (filters.integration && event.data?.integration !== filters.integration) return false;
      if (filters.priority && event.metadata.priority !== filters.priority) return false;
    }

    return true;
  }

  private deliverToWebSocket(event: WAIEvent, subscription: EventSubscription): void {
    // Find WebSocket connections for this subscription
    for (const [connectionId, connection] of this.wsConnections.entries()) {
      if (connection.subscriptions.includes(subscription.id)) {
        this.sendWebSocketMessage(connectionId, {
          type: 'event',
          event: {
            id: event.id,
            type: event.type,
            source: event.source,
            data: event.data,
            timestamp: event.metadata.timestamp
          }
        });
        
        subscription.lastDelivery = new Date();
      }
    }
  }

  private deliverToSSE(event: WAIEvent, subscription: EventSubscription): void {
    // Find SSE connections for this subscription
    for (const [connectionId, connection] of this.sseConnections.entries()) {
      if (connection.subscriptions.includes(subscription.id)) {
        this.sendSSEMessage(connectionId, {
          type: 'event',
          event: {
            id: event.id,
            type: event.type,
            source: event.source,
            data: event.data,
            timestamp: event.metadata.timestamp
          }
        });
        
        subscription.lastDelivery = new Date();
      }
    }
  }

  private deliverToWebhook(event: WAIEvent, subscription: EventSubscription): void {
    // Implementation for webhook delivery would go here
    // This would make HTTP POST requests to configured webhook endpoints
    console.log(`📤 Webhook delivery for subscription ${subscription.id}: ${event.type}`);
  }

  private addToEventQueue(event: WAIEvent): void {
    const queueKey = `${event.userId || 'system'}|${event.platform || 'all'}`;
    
    if (!this.eventQueue.has(queueKey)) {
      this.eventQueue.set(queueKey, []);
    }
    
    const queue = this.eventQueue.get(queueKey)!;
    queue.push(event);
    
    // Keep only last 100 events per queue
    if (queue.length > 100) {
      queue.shift();
    }
  }

  // ================================================================================================
  // PREDEFINED EVENT PUBLISHERS
  // ================================================================================================

  public publishOrchestrationEvent(type: string, data: any, userId?: string, platform?: string): void {
    this.publishEvent({
      type: `orchestration.${type}`,
      source: 'wai.orchestration',
      userId,
      platform,
      data
    });
  }

  public publishLLMEvent(type: string, data: any, userId?: string, platform?: string): void {
    this.publishEvent({
      type: `llm.${type}`,
      source: 'wai.llm',
      userId,
      platform,
      data
    });
  }

  public publishAgentEvent(type: string, data: any, userId?: string, platform?: string): void {
    this.publishEvent({
      type: `agent.${type}`,
      source: 'wai.agents',
      userId,
      platform,
      data
    });
  }

  public publishIntegrationEvent(integration: string, type: string, data: any, userId?: string, platform?: string): void {
    this.publishEvent({
      type: `integration.${integration}.${type}`,
      source: `wai.integrations.${integration}`,
      userId,
      platform,
      data
    });
  }

  public publishSystemEvent(type: string, data: any): void {
    this.publishEvent({
      type: `system.${type}`,
      source: 'wai.system',
      data
    });
  }

  // ================================================================================================
  // UTILITY METHODS
  // ================================================================================================

  private async validateAPIKey(apiKey: string): Promise<{ userId: string } | null> {
    // In production, validate against authentication system
    if (apiKey && apiKey.startsWith('wai_')) {
      return { userId: apiKey }; // Simplified for demo
    }
    return null;
  }

  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      this.pingWebSocketConnections();
      this.sendSSEKeepAlive();
    }, 30000); // Ping every 30 seconds
  }

  private pingWebSocketConnections(): void {
    for (const [connectionId, connection] of this.wsConnections.entries()) {
      if (connection.socket.readyState === WebSocket.OPEN) {
        connection.isAlive = false;
        connection.socket.ping();
        
        // Check if connection died
        setTimeout(() => {
          if (!connection.isAlive) {
            console.log(`🔌 Terminating dead WebSocket connection: ${connectionId}`);
            connection.socket.terminate();
            this.handleWebSocketClose(connectionId);
          }
        }, 5000);
      }
    }
  }

  private sendSSEKeepAlive(): void {
    for (const [connectionId, connection] of this.sseConnections.entries()) {
      if (connection.isActive) {
        this.sendSSEMessage(connectionId, {
          type: 'system.keepalive',
          data: { timestamp: new Date().toISOString() }
        });
      }
    }
  }

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredConnections();
    }, 300000); // Cleanup every 5 minutes
  }

  private cleanupExpiredConnections(): void {
    const now = new Date();
    
    // Cleanup WebSocket connections
    for (const [connectionId, connection] of this.wsConnections.entries()) {
      if (now.getTime() - connection.lastPing.getTime() > 300000) { // 5 minutes
        console.log(`🧹 Cleaning up expired WebSocket connection: ${connectionId}`);
        this.handleWebSocketClose(connectionId);
      }
    }

    // Cleanup SSE connections
    for (const [connectionId, connection] of this.sseConnections.entries()) {
      if (now.getTime() - connection.lastKeepAlive.getTime() > 300000) { // 5 minutes
        console.log(`🧹 Cleaning up expired SSE connection: ${connectionId}`);
        this.handleSSEClose(connectionId);
      }
    }
  }

  // ================================================================================================
  // STATUS AND MANAGEMENT
  // ================================================================================================

  public getRealtimeStatus(): any {
    return {
      version: this.version,
      connections: {
        websocket: this.wsConnections.size,
        sse: this.sseConnections.size,
        total: this.wsConnections.size + this.sseConnections.size
      },
      subscriptions: {
        total: this.subscriptions.size,
        active: Array.from(this.subscriptions.values()).filter(s => s.isActive).length
      },
      eventQueue: {
        totalQueues: this.eventQueue.size,
        totalEvents: Array.from(this.eventQueue.values()).reduce((sum, queue) => sum + queue.length, 0)
      },
      lastUpdated: new Date().toISOString()
    };
  }

  public destroy(): void {
    // Close all WebSocket connections
    for (const connection of this.wsConnections.values()) {
      connection.socket.close();
    }

    // Close all SSE connections
    for (const connection of this.sseConnections.values()) {
      connection.response.end();
    }

    // Clear intervals
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);

    // Close WebSocket server
    if (this.wss) {
      this.wss.close();
    }
  }
}

export const waiRealTimeEventsSystem = new WAIRealTimeEventsSystem();
export default waiRealTimeEventsSystem;