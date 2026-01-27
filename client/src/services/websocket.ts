/**
 * WebSocket Client for Real-time Updates
 */

import { EventEmitter } from 'events';

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: Date;
}

export interface WebSocketOptions {
  url?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

export class WAIWebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectInterval: number;
  private maxReconnectAttempts: number;
  private heartbeatInterval: number;
  private reconnectAttempts = 0;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isConnected = false;
  private shouldReconnect = true;

  constructor(options: WebSocketOptions = {}) {
    super();
    this.url = options.url || 'ws://localhost:5000/api/ws';
    this.reconnectInterval = options.reconnectInterval || 3000;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
    this.heartbeatInterval = options.heartbeatInterval || 30000;
  }

  connect(): void {
    try {
      this.ws = new WebSocket(this.url);
      this.setupEventHandlers();
    } catch (error) {
      this.emit('error', error);
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.clearHeartbeat();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.isConnected = false;
    this.emit('disconnected');
  }

  send(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.emit('error', new Error('WebSocket is not connected'));
    }
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.emit('connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        this.emit('error', new Error('Failed to parse WebSocket message'));
      }
    };

    this.ws.onclose = (event) => {
      this.isConnected = false;
      this.clearHeartbeat();
      this.emit('disconnected', event);
      
      if (this.shouldReconnect && !event.wasClean) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      this.emit('error', error);
    };
  }

  private handleMessage(message: WebSocketMessage): void {
    // Handle different message types
    switch (message.type) {
      case 'agent_status_update':
        this.emit('agentStatusUpdate', message.payload);
        break;
      case 'system_metrics':
        this.emit('systemMetrics', message.payload);
        break;
      case 'llm_provider_update':
        this.emit('llmProviderUpdate', message.payload);
        break;
      case 'orchestration_progress':
        this.emit('orchestrationProgress', message.payload);
        break;
      case 'cost_alert':
        this.emit('costAlert', message.payload);
        break;
      case 'health_check_update':
        this.emit('healthUpdate', message.payload);
        break;
      case 'pipeline_execution':
        this.emit('pipelineExecution', message.payload);
        break;
      case 'experiment_update':
        this.emit('experimentUpdate', message.payload);
        break;
      case 'notification':
        this.emit('notification', message.payload);
        break;
      case 'heartbeat':
        // Respond to server heartbeat
        this.send({
          type: 'heartbeat_response',
          payload: { timestamp: new Date() },
          timestamp: new Date(),
        });
        break;
      default:
        this.emit('message', message);
        break;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        if (this.shouldReconnect) {
          this.connect();
        }
      }, this.reconnectInterval * this.reconnectAttempts);
    } else {
      this.emit('error', new Error('Maximum reconnect attempts reached'));
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.send({
          type: 'heartbeat',
          payload: { timestamp: new Date() },
          timestamp: new Date(),
        });
      }
    }, this.heartbeatInterval);
  }

  private clearHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  get connected(): boolean {
    return this.isConnected;
  }

  get connectionState(): string {
    if (!this.ws) return 'closed';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'open';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'closed';
      default:
        return 'unknown';
    }
  }
}

// React hook for WebSocket integration
export const useWebSocket = (options?: WebSocketOptions) => {
  const [client] = useState(() => new WAIWebSocketClient(options));
  const [connected, setConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('closed');

  useEffect(() => {
    const handleConnect = () => {
      setConnected(true);
      setConnectionState('open');
    };

    const handleDisconnect = () => {
      setConnected(false);
      setConnectionState('closed');
    };

    client.on('connected', handleConnect);
    client.on('disconnected', handleDisconnect);

    client.connect();

    return () => {
      client.off('connected', handleConnect);
      client.off('disconnected', handleDisconnect);
      client.disconnect();
    };
  }, [client]);

  return {
    client,
    connected,
    connectionState,
    send: (message: WebSocketMessage) => client.send(message),
    subscribe: (event: string, handler: (...args: any[]) => void) => {
      client.on(event, handler);
      return () => client.off(event, handler);
    },
  };
};

// Default WebSocket client instance
export const waiWebSocketClient = new WAIWebSocketClient();