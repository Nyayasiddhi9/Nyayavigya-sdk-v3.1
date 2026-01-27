# Wiring Services Requiring Incubator Integration

The following wiring services have dependencies on the Wizards Incubator Platform's database and schema.
They are exported as minimal stubs in the standalone NyayaVighya SDK and will be fully wired when the SDK is integrated back into the Incubator.

## Services with DB Dependencies

1. **parlant-wiring-service.ts** - Requires: db, wizardsOrchestrationJobs schema
2. **dynamic-model-selection-wiring-service.ts** - Requires: db, schema
3. **cost-optimization-wiring-service.ts** - Requires: db, schema
4. **semantic-caching-wiring-service.ts** - Requires: db, schema
5. **continuous-learning-wiring-service.ts** - Requires: db, schema
6. **real-time-optimization-wiring-service.ts** - Requires: db, schema
7. **context-engineering-wiring-service.ts** - Requires: db, schema
8. **context-engineering-service.ts** - Requires: db, schema
9. **a2a-wiring-service.ts** - Requires: db, schema
10. **quantum-security-wiring-service.ts** - Requires: db, schema
11. **provider-arbitrage-wiring-service.ts** - Requires: db, schema
12. **bmad-wiring-service.ts** - Requires: db, schema
13. **multi-clock-wiring-service.ts** - Requires: StudioType from schema
14. **agent-collaboration-network-wiring-service.ts** - Requires: db, schema
15. **intelligent-routing-wiring-service.ts** - Requires: db, schema
16. **grpo-wiring-service.ts** - Requires: db, schema
17. **claude-extended-thinking-wiring-service.ts** - Requires: sub-agent orchestration

## Integration Strategy

When integrating the NyayaVighya SDK back into the Incubator (Phase 2):

1. **Create Incubator Adapter** (`@wai/adapters/incubator`)
   - Provides db connection via IStorageAdapter
   - Maps Incubator schema to NyayaVighya SDK interfaces
   - Wires all services with proper dependencies

2. **Dependency Injection**
   - Use NyayaVighya SDK's DI container to inject db and schema dependencies
   - Each wiring service will receive dependencies via constructor injection

3. **Configuration**
   - Use WAI Config system to enable/disable wiring services
   - Set up Incubator-specific configuration values

## Current Status

- ✅ Minimal stubs created for standalone builds
- ✅ Clean package architecture established
- ⏭️ Full implementation when integrated with Incubator (Phase 2, Week 14-15)
