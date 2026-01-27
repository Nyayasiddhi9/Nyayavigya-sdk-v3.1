/**
 * Plugin Bootstrap
 * 
 * Registers all routing plugins with Unified Routing Registry at application startup
 * Consolidates 18 wiring services into unified plugin system
 * 
 * Phase 2A Stage 0 - Plugin Registration
 */

import { unifiedRoutingRegistry } from './unified-routing-registry';
import { ParlantPlugin } from './plugins/parlant-plugin';
import { BMADPlugin } from './plugins/bmad-plugin';
import { IntelligentRoutingPlugin } from './plugins/intelligent-routing-plugin';

/**
 * Initialize and register all plugins
 * Called once at application startup
 */
export async function bootstrapPlugins(): Promise<void> {
  console.log('🚀 Bootstrapping routing plugins...');

  try {
    // Register Parlant Standards Plugin
    unifiedRoutingRegistry.registerPlugin('parlant', new ParlantPlugin(), {
      priority: 100, // Highest priority - applies first
      enabled: true,
      tags: ['prompt-engineering', 'standards', 'core'],
      config: {
        strictMode: true,
        antiHallucination: true,
      },
    });

    // Register BMAD Behavioral Design Plugin
    unifiedRoutingRegistry.registerPlugin('bmad', new BMADPlugin(), {
      priority: 90,
      enabled: true,
      tags: ['behavioral', 'personality', 'core'],
      config: {
        enablePersonality: true,
        adaptToContext: true,
      },
    });

    // Register Intelligent Provider Routing Plugin
    unifiedRoutingRegistry.registerPlugin('intelligent-routing', new IntelligentRoutingPlugin(), {
      priority: 80,
      enabled: true,
      tags: ['routing', 'optimization', 'core'],
      config: {
        costOptimization: true,
        loadBalancing: true,
      },
    });

    // TODO: Register remaining 15 plugins:
    // - Context Engineering
    // - Multi-Clock Coordination
    // - A2A Collaboration
    // - Real-Time Optimization
    // - Semantic Caching
    // - Provider Arbitrage
    // - Dynamic Model Selection
    // - Error Recovery
    // - Cost Optimization
    // - Agent Collaboration Network
    // - Continuous Learning (GRPO)
    // - Claude Extended Thinking
    // - Quantum Security
    // - Parallel Processing
    // - [1 more TBD]

    // Initialize all registered plugins
    await unifiedRoutingRegistry.initializeAllPlugins();

    // Log registration summary
    const stats = unifiedRoutingRegistry.getPluginCount();
    console.log(`✅ Plugin bootstrap complete: ${stats.enabled}/${stats.total} plugins enabled`);

    // List all plugins
    const plugins = unifiedRoutingRegistry.listPlugins();
    console.log('📋 Registered plugins:');
    plugins
      .sort((a, b) => b.priority - a.priority) // Sort by priority
      .forEach(plugin => {
        console.log(`  ${plugin.enabled ? '✅' : '⏸️'} [${plugin.priority}] ${plugin.name} (${plugin.id})`);
      });
  } catch (error) {
    console.error('❌ Plugin bootstrap failed:', error);
    throw error;
  }
}

/**
 * Shutdown all plugins
 * Called during application graceful shutdown
 */
export async function shutdownPlugins(): Promise<void> {
  console.log('🛑 Shutting down routing plugins...');
  
  // Cleanup is handled by registry when plugins are unregistered
  // For now, just disable globally
  unifiedRoutingRegistry.setGlobalEnabled(false);
  
  console.log('✅ Plugin shutdown complete');
}
