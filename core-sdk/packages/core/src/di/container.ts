/**
 * Dependency Injection Container
 * Lightweight DI implementation for WAI SDK
 * Enables framework-agnostic architecture with clean dependency management
 */

type Constructor<T = any> = new (...args: any[]) => T;
type Factory<T = any> = (container: DIContainer) => T;
type Lifecycle = 'singleton' | 'transient' | 'scoped';

interface ServiceRegistration<T = any> {
  factory: Factory<T>;
  lifecycle: Lifecycle;
  instance?: T;
}

export class DIContainer {
  private services = new Map<string | symbol, ServiceRegistration>();
  private scopedInstances = new Map<string | symbol, any>();

  /**
   * Register a service
   * @param token - Service identifier (string, symbol, or class)
   * @param factory - Factory function or class constructor
   * @param lifecycle - Service lifecycle (singleton, transient, scoped)
   */
  register<T>(
    token: string | symbol | Constructor<T>,
    factory: Factory<T> | Constructor<T>,
    lifecycle: Lifecycle = 'singleton'
  ): this {
    const serviceToken = typeof token === 'function' ? token.name : token;
    
    const normalizedFactory: Factory<T> = 
      typeof factory === 'function' && factory.prototype
        ? (container: DIContainer) => new (factory as Constructor<T>)(container)
        : factory as Factory<T>;

    this.services.set(serviceToken, {
      factory: normalizedFactory,
      lifecycle,
    });

    return this;
  }

  /**
   * Register a singleton service
   */
  singleton<T>(
    token: string | symbol | Constructor<T>,
    factory: Factory<T> | Constructor<T>
  ): this {
    return this.register(token, factory, 'singleton');
  }

  /**
   * Register a transient service (new instance every time)
   */
  transient<T>(
    token: string | symbol | Constructor<T>,
    factory: Factory<T> | Constructor<T>
  ): this {
    return this.register(token, factory, 'transient');
  }

  /**
   * Register a scoped service (one instance per scope)
   */
  scoped<T>(
    token: string | symbol | Constructor<T>,
    factory: Factory<T> | Constructor<T>
  ): this {
    return this.register(token, factory, 'scoped');
  }

  /**
   * Register an instance directly
   */
  instance<T>(token: string | symbol | Constructor<T>, instance: T): this {
    const serviceToken = typeof token === 'function' ? token.name : token;
    
    this.services.set(serviceToken, {
      factory: () => instance,
      lifecycle: 'singleton',
      instance,
    });

    return this;
  }

  /**
   * Resolve a service
   */
  resolve<T>(token: string | symbol | Constructor<T>): T {
    const serviceToken = typeof token === 'function' ? token.name : token;
    const registration = this.services.get(serviceToken);

    if (!registration) {
      throw new Error(
        `Service not registered: ${String(serviceToken)}\n` +
        `Available services: ${Array.from(this.services.keys()).join(', ')}`
      );
    }

    switch (registration.lifecycle) {
      case 'singleton':
        if (!registration.instance) {
          registration.instance = registration.factory(this);
        }
        return registration.instance as T;

      case 'scoped':
        if (!this.scopedInstances.has(serviceToken)) {
          this.scopedInstances.set(serviceToken, registration.factory(this));
        }
        return this.scopedInstances.get(serviceToken) as T;

      case 'transient':
        return registration.factory(this) as T;

      default:
        throw new Error(`Unknown lifecycle: ${registration.lifecycle}`);
    }
  }

  /**
   * Check if a service is registered
   */
  has(token: string | symbol | Constructor): boolean {
    const serviceToken = typeof token === 'function' ? token.name : token;
    return this.services.has(serviceToken);
  }

  /**
   * Clear scoped instances (for request-scoped services)
   */
  clearScope(): void {
    this.scopedInstances.clear();
  }

  /**
   * Create a child container (inherits parent services)
   */
  createChild(): DIContainer {
    const child = new DIContainer();
    
    // Copy parent services to child
    for (const [token, registration] of this.services) {
      child.services.set(token, { ...registration });
    }
    
    return child;
  }

  /**
   * Get all registered service tokens
   */
  getRegisteredServices(): (string | symbol)[] {
    return Array.from(this.services.keys());
  }

  /**
   * Clear all services
   */
  clear(): void {
    this.services.clear();
    this.scopedInstances.clear();
  }
}

/**
 * Service tokens (for type-safe dependency injection)
 */
export const ServiceTokens = {
  // Core services
  StorageAdapter: Symbol('IStorageAdapter'),
  EventBus: Symbol('IEventBus'),
  JobQueue: Symbol('IJobQueue'),
  ToolRegistry: Symbol('IToolRegistry'),
  ProviderRegistry: Symbol('IProviderRegistry'),
  
  // Orchestration
  OrchestrationCore: Symbol('OrchestrationCore'),
  OrchestrationFacade: Symbol('OrchestrationFacade'),
  RoutingRegistry: Symbol('RoutingRegistry'),
  RequestBuilder: Symbol('RequestBuilder'),
  
  // Protocols
  MCPServer: Symbol('MCPServer'),
  ROMAManager: Symbol('ROMAManager'),
  BMADFramework: Symbol('BMADFramework'),
  ParlantStandards: Symbol('ParlantStandards'),
  A2ACollaborationBus: Symbol('A2ACollaborationBus'),
  AGUIEventBridge: Symbol('AGUIEventBridge'),
  
  // Memory
  Mem0Client: Symbol('Mem0Client'),
  CAMMonitoring: Symbol('CAMMonitoring'),
  VectorStore: Symbol('VectorStore'),
  
  // Agents
  AgentCatalog: Symbol('AgentCatalog'),
  AgentCoordinator: Symbol('AgentCoordinator'),
  
  // Workflows
  WorkflowScheduler: Symbol('WorkflowScheduler'),
  WorkflowExecutor: Symbol('WorkflowExecutor'),
};

/**
 * Global container instance (optional)
 */
export const globalContainer = new DIContainer();
