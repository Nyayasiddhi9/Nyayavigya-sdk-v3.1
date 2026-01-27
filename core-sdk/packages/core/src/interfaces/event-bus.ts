/**
 * Event Bus Interface
 * Provides abstraction for event-driven communication
 * Used for AG-UI protocol, monitoring, agent coordination
 */

export type EventHandler<T = unknown> = (data: T) => void | Promise<void>;

export interface IEventBus {
  /**
   * Emit an event
   * @param event - Event name
   * @param data - Event payload
   */
  emit<T = unknown>(event: string, data: T): Promise<void>;

  /**
   * Subscribe to an event
   * @param event - Event name or pattern
   * @param handler - Event handler function
   * @returns Unsubscribe function
   */
  on<T = unknown>(event: string, handler: EventHandler<T>): () => void;

  /**
   * Subscribe to an event (one-time)
   * @param event - Event name
   * @param handler - Event handler function
   */
  once<T = unknown>(event: string, handler: EventHandler<T>): void;

  /**
   * Unsubscribe from an event
   * @param event - Event name
   * @param handler - Handler to remove (optional, removes all if omitted)
   */
  off<T = unknown>(event: string, handler?: EventHandler<T>): void;

  /**
   * Remove all event listeners
   */
  removeAllListeners(): void;

  /**
   * Get listener count for an event
   * @param event - Event name
   */
  listenerCount(event: string): number;
}

/**
 * In-Memory Event Bus (for development/testing)
 */
export class MemoryEventBus implements IEventBus {
  private listeners = new Map<string, Set<EventHandler>>();

  async emit<T = unknown>(event: string, data: T): Promise<void> {
    const handlers = this.listeners.get(event);
    if (!handlers) return;

    await Promise.all(
      Array.from(handlers).map(handler => handler(data))
    );
  }

  on<T = unknown>(event: string, handler: EventHandler<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event)!.add(handler as EventHandler);
    
    // Return unsubscribe function
    return () => this.off(event, handler);
  }

  once<T = unknown>(event: string, handler: EventHandler<T>): void {
    const onceWrapper: EventHandler<T> = async (data) => {
      this.off(event, onceWrapper);
      await handler(data);
    };
    
    this.on(event, onceWrapper);
  }

  off<T = unknown>(event: string, handler?: EventHandler<T>): void {
    if (!handler) {
      this.listeners.delete(event);
      return;
    }
    
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler as EventHandler);
      if (handlers.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }

  listenerCount(event: string): number {
    return this.listeners.get(event)?.size || 0;
  }
}
