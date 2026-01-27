/**
 * Phase 2A Stage 0 - Compliance Testing (Smoke Tests)
 * 
 * Basic validation that Stage 0 infrastructure works:
 * 1. OrchestrationFacade instantiates correctly
 * 2. Unified Routing Registry registers plugins
 * 3. Infrastructure is properly integrated
 */

import { describe, it, expect } from 'vitest';
import { OrchestrationFacade } from '../orchestration-facade';
import { UnifiedRoutingRegistry } from '../unified-routing-registry';
import type { IRoutingPlugin } from '../unified-routing-registry';

describe('Stage 0 Compliance Tests - Smoke Tests', () => {
  describe('OrchestrationFacade', () => {
    it('should instantiate with default config', () => {
      const facade = new OrchestrationFacade();
      expect(facade).toBeDefined();
      expect(typeof facade.executeWorkflow).toBe('function');
    });

    it('should instantiate with custom config', () => {
      const facade = new OrchestrationFacade({
        startupId: 123,
        userId: 456,
        studioId: 'test-studio',
        enableStreaming: false,
        enableMonitoring: false,
        enableRetries: false,
      });
      expect(facade).toBeDefined();
    });

    it('should create separate instances per request', () => {
      const facade1 = new OrchestrationFacade({ sessionId: 'session-1' });
      const facade2 = new OrchestrationFacade({ sessionId: 'session-2' });
      
      expect(facade1).not.toBe(facade2);
    });
  });

  describe('Unified Routing Registry', () => {
    it('should instantiate successfully', () => {
      const registry = new UnifiedRoutingRegistry();
      expect(registry).toBeDefined();
    });

    it('should register plugin successfully', () => {
      const registry = new UnifiedRoutingRegistry();
      
      const testPlugin: IRoutingPlugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        description: 'Test plugin for compliance testing',
        onPreOrchestration: async (request) => request,
      };

      // Should not throw
      expect(() => {
        registry.registerPlugin('test-plugin', testPlugin, {
          priority: 100,
          enabled: true,
        });
      }).not.toThrow();
    });

    it('should handle plugin registration with minimal config', () => {
      const registry = new UnifiedRoutingRegistry();
      
      const minimalPlugin: IRoutingPlugin = {
        id: 'minimal-plugin',
        name: 'Minimal Plugin',
        description: 'Minimal test plugin',
      };

      // Should not throw with defaults
      expect(() => {
        registry.registerPlugin('minimal-plugin', minimalPlugin);
      }).not.toThrow();
    });
  });

  describe('Integration', () => {
    it('should work together - facade + registry', () => {
      const facade = new OrchestrationFacade({
        enableMonitoring: true,
        enableRetries: true,
      });

      const registry = new UnifiedRoutingRegistry();
      
      const plugin: IRoutingPlugin = {
        id: 'integration-test',
        name: 'Integration Test Plugin',
        description: 'Integration test plugin',
        onPreOrchestration: async (request) => request,
      };

      registry.registerPlugin('integration-test', plugin, {
        priority: 100,
        enabled: true,
      });

      expect(facade).toBeDefined();
      expect(registry).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should instantiate facade quickly', () => {
      const start = Date.now();
      const facade = new OrchestrationFacade();
      const duration = Date.now() - start;

      expect(facade).toBeDefined();
      // Should instantiate in less than 100ms
      expect(duration).toBeLessThan(100);
    });

    it('should register plugin quickly', () => {
      const registry = new UnifiedRoutingRegistry();
      
      const plugin: IRoutingPlugin = {
        id: 'perf-test',
        name: 'Performance Test',
        description: 'Performance test plugin',
      };

      const start = Date.now();
      registry.registerPlugin('perf-test', plugin);
      const duration = Date.now() - start;

      // Should register in less than 10ms
      expect(duration).toBeLessThan(10);
    });
  });
});
