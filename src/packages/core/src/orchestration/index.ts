/**
 * WAI SDK - Core Orchestration
 * 
 * Standalone orchestration API and request builder.
 * Full orchestration core (Facade, Routing, Wiring Services) requires Incubator Platform integration.
 * See INCUBATOR_INTEGRATION_NEEDED.md for integration details.
 */

// Standalone orchestration API
export * from './standalone-api';

// Wiring services (minimal stubs for standalone SDK)
export * from './wiring-services-stub';

// Framework-agnostic services (no DB dependencies)
export * from './parallel-processing-wiring-service';
export * from './error-recovery-wiring-service';

// Note: Full orchestration core (facade.ts, core.ts, routing.ts) and wiring services
// are in .incubator-only files. They will be activated in Phase 2 when integrating
// back into Incubator Platform with proper database and schema dependencies.
