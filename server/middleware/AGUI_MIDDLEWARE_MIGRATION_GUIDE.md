# AG-UI Middleware Migration Guide
**Phase 2A Stage 0 - Centralizing AG-UI Session Management**

---

## Overview

The AG-UI Orchestration Middleware centralizes AG-UI session management across all streaming routes, replacing scattered session creation patterns with unified middleware.

**Benefits:**
- ✅ Automatic session lifecycle management
- ✅ Standardized SSE configuration
- ✅ Consistent error handling
- ✅ Automatic cleanup on disconnect
- ✅ Type-safe AG-UI context
- ✅ Reduced boilerplate (60-80% code reduction)

---

## Migration Patterns

### Pattern 1: Studio Routes with SSE Streaming

**BEFORE (❌ Manual session management):**
```typescript
// server/routes/wizards-ideation-lab-routes.ts
import { sharedAGUIService } from '../services/shared-agui-service';

router.post('/api/ideation/validate', authenticateToken, authorizeStartupAccess, async (req, res) => {
  try {
    const { startupId, ideaDescription } = req.body;
    
    // Manual session creation
    const aguiSession = sharedAGUIService.createSession(
      startupId,
      randomUUID(),
      'ideation-lab',
      req.user?.id
    );

    // Manual SSE setup
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.write(`data: ${JSON.stringify({ type: 'connection', sessionId: aguiSession.id })}\n\n`);

    // Manual event listening
    const eventHandler = (event: AGUIEvent) => {
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }
    };
    sharedAGUIService.on(`event:${aguiSession.id}`, eventHandler);

    // Manual cleanup
    req.on('close', () => {
      sharedAGUIService.off(`event:${aguiSession.id}`, eventHandler);
      sharedAGUIService.closeSession(aguiSession.id);
      res.end();
    });

    // Emit events manually
    sharedAGUIService.emitEvent(aguiSession.id, { type: 'status_change', status: 'validating' });
    
    // ... business logic
    
    sharedAGUIService.emitEvent(aguiSession.id, { type: 'status_change', status: 'completed' });
  } catch (error) {
    // Manual error handling
    res.status(500).json({ success: false, error: error.message });
  }
});
```

**AFTER (✅ Using middleware):**
```typescript
// server/routes/wizards-ideation-lab-routes.ts
import { aguiOrchestrationMiddleware, type AGUIRequest } from '../middleware/agui-orchestration-middleware';

router.post('/api/ideation/validate',
  authenticateToken,
  authorizeStartupAccess,
  aguiOrchestrationMiddleware({ studioId: 'ideation-lab', enableStreaming: true }),
  async (req: AGUIRequest, res) => {
    try {
      const { ideaDescription } = req.body;
      const { aguiSession, emitEvent } = req.agui;

      // Session already created, SSE already configured
      emitEvent({ type: 'status_change', status: 'validating' });
      
      // ... business logic
      
      emitEvent({ type: 'status_change', status: 'completed' });
      
      // No manual cleanup needed - handled by middleware
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);
```

**Code Reduction: ~35 lines → ~10 lines (71% reduction)**

---

### Pattern 2: Routes with AG-UI Context (No SSE)

Some routes need to emit AG-UI events but don't stream responses via SSE.

**BEFORE (❌ Session creation without streaming):**
```typescript
router.post('/api/tasks/create', authenticateToken, async (req, res) => {
  const { startupId, taskData } = req.body;
  
  // Create session just for events
  const aguiSession = sharedAGUIService.createSession(startupId, randomUUID(), 'task-manager');
  
  try {
    sharedAGUIService.emitEvent(aguiSession.id, { type: 'task_created', taskId: task.id });
    
    const task = await createTask(taskData);
    
    res.json({ success: true, task });
  } finally {
    sharedAGUIService.closeSession(aguiSession.id);
  }
});
```

**AFTER (✅ Using context middleware):**
```typescript
import { aguiContextMiddleware, type AGUIRequest } from '../middleware/agui-orchestration-middleware';

router.post('/api/tasks/create',
  authenticateToken,
  aguiContextMiddleware({ studioId: 'task-manager' }),
  async (req: AGUIRequest, res) => {
    const { taskData } = req.body;
    const { emitEvent, closeSession } = req.agui;
    
    try {
      const task = await createTask(taskData);
      emitEvent({ type: 'task_created', taskId: task.id });
      
      res.json({ success: true, task });
    } finally {
      closeSession();
    }
  }
);
```

---

### Pattern 3: Long-Running Workflows

**BEFORE (❌ Complex SSE management):**
```typescript
router.post('/api/workflow/execute', authenticateToken, async (req, res) => {
  const { startupId, workflowId } = req.body;
  
  const aguiSession = sharedAGUIService.createSession(startupId, randomUUID(), 'workflow-engine');
  
  // Setup SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.write(`data: ${JSON.stringify({ type: 'connection', sessionId: aguiSession.id })}\n\n`);
  
  const eventHandler = (event: AGUIEvent) => {
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }
  };
  
  sharedAGUIService.on(`event:${aguiSession.id}`, eventHandler);
  
  req.on('close', () => {
    sharedAGUIService.off(`event:${aguiSession.id}`, eventHandler);
    sharedAGUIService.closeSession(aguiSession.id);
    res.end();
  });
  
  try {
    // Step 1
    sharedAGUIService.emitEvent(aguiSession.id, { type: 'progress', step: 1, total: 5 });
    await step1();
    
    // Step 2
    sharedAGUIService.emitEvent(aguiSession.id, { type: 'progress', step: 2, total: 5 });
    await step2();
    
    // ... more steps
    
    sharedAGUIService.emitEvent(aguiSession.id, { type: 'completed', result: {...} });
  } catch (error) {
    sharedAGUIService.emitEvent(aguiSession.id, { type: 'error', error: error.message });
    res.status(500).json({ success: false });
  }
});
```

**AFTER (✅ Clean workflow):**
```typescript
router.post('/api/workflow/execute',
  authenticateToken,
  aguiOrchestrationMiddleware({ studioId: 'workflow-engine', enableStreaming: true }),
  async (req: AGUIRequest, res) => {
    const { workflowId } = req.body;
    const { emitEvent } = req.agui;
    
    try {
      emitEvent({ type: 'progress', step: 1, total: 5 });
      await step1();
      
      emitEvent({ type: 'progress', step: 2, total: 5 });
      await step2();
      
      // ... more steps
      
      emitEvent({ type: 'completed', result: {...} });
    } catch (error) {
      emitEvent({ type: 'error', error: error.message });
      res.status(500).json({ success: false });
    }
  }
);
```

---

## API Reference

### `aguiOrchestrationMiddleware(config)`

Creates middleware for routes needing AG-UI with SSE streaming.

**Config Options:**
```typescript
{
  studioId?: string;              // Studio context for session
  enableStreaming?: boolean;      // Enable SSE (default: true)
  includeHistory?: boolean;       // Include event history in SSE (default: false)
  sessionIdGenerator?: () => string; // Custom session ID generator
}
```

**Adds to Request:**
```typescript
req.agui = {
  aguiSession: {
    id: string;
    startupId: number;
    studioId?: string;
    userId?: number;
    createdAt: Date;
  };
  emitEvent: (event: Omit<AGUIEvent, 'sessionId' | 'timestamp'>) => void;
  closeSession: () => void;
};
```

### `aguiContextMiddleware(config)`

Lightweight middleware for AG-UI context without SSE streaming.

**Config Options:**
```typescript
{
  studioId?: string;
  includeHistory?: boolean;
  sessionIdGenerator?: () => string;
}
```

---

## Migration Checklist

For each route using `sharedAGUIService.createSession`:

### 1. Identify Route Pattern
- [ ] Does it use SSE streaming? → Use `aguiOrchestrationMiddleware`
- [ ] Only emits events (no streaming)? → Use `aguiContextMiddleware`

### 2. Add Middleware
- [ ] Import middleware: `import { aguiOrchestrationMiddleware, type AGUIRequest } from '../middleware/agui-orchestration-middleware'`
- [ ] Add middleware to route chain (after auth middleware)
- [ ] Update request type to `AGUIRequest`

### 3. Remove Manual Code
- [ ] Remove `sharedAGUIService.createSession()` call
- [ ] Remove SSE header setup (`res.setHeader(...)`)
- [ ] Remove event listener setup (`sharedAGUIService.on(...)`)
- [ ] Remove cleanup handlers (`req.on('close', ...)`)

### 4. Update Event Emission
- [ ] Replace `sharedAGUIService.emitEvent(sessionId, event)` with `req.agui.emitEvent(event)`
- [ ] Remove `sessionId` and `timestamp` from event objects (middleware adds them)

### 5. Test
- [ ] Verify SSE connection works
- [ ] Verify events stream correctly
- [ ] Verify cleanup on disconnect
- [ ] Check error handling

---

## Priority Migration Order

### Phase 1: High-Traffic Studio Routes (Week 1)
1. `wizards-ideation-lab-routes.ts` - Ideation workflows
2. `wizards-engineering-forge-routes.ts` - Code generation
3. `wizards-product-blueprint-routes.ts` - Product planning
4. `wizards-market-intelligence-routes.ts` - Market research
5. `wizards-quality-assurance-lab-routes.ts` - Testing workflows

### Phase 2: Remaining Studio Routes (Week 2)
6. `wizards-deployment-studio-routes.ts` - Deployment workflows
7. `wizards-operations-hub-routes.ts` - Operations management
8. `wizards-launch-command-routes.ts` - Launch workflows
9. `wizards-growth-engine-routes.ts` - Growth strategies
10. `wizards-experience-design-routes.ts` - UX/UI workflows

### Phase 3: Specialized Routes (Week 3)
11. `agui-streaming-routes.ts` - Generic AG-UI routes
12. `demo-agui-routes.ts` - Demo routes
13. `voice-streaming-routes.ts` - Voice streaming
14. All remaining routes using `sharedAGUIService`

---

## Common Issues & Solutions

### Issue 1: "startupId is required"
**Cause:** Middleware can't extract startupId from request
**Solution:**
```typescript
// Ensure startupId is in req.body or req.params
router.post('/api/task/:startupId/create', ... // ← startupId in params
// OR
router.post('/api/task/create', ... // ← startupId in body
```

### Issue 2: SSE not working
**Cause:** Response already sent before middleware
**Solution:** Ensure middleware comes BEFORE route handler:
```typescript
router.post('/path',
  authenticateToken,
  aguiOrchestrationMiddleware({ ... }), // ← Must be before handler
  async (req, res) => { ... }
);
```

### Issue 3: Events not streaming
**Cause:** Using `emitEvent` but `enableStreaming: false`
**Solution:**
```typescript
aguiOrchestrationMiddleware({ 
  enableStreaming: true  // ← Enable streaming
})
```

---

## Success Metrics

Track these metrics during migration:

1. **Code Reduction**: Target 60-80% reduction in AG-UI setup code
2. **Error Rate**: Should decrease due to standardized error handling
3. **Session Leaks**: Should eliminate (automatic cleanup)
4. **Consistency**: 100% of routes using same AG-UI pattern
5. **Developer Experience**: Faster route development, fewer bugs

---

## Completion Criteria

Migration complete when:
- [ ] All studio routes use middleware (10 routes)
- [ ] All specialized routes use middleware (4+ routes)
- [ ] Zero manual `sharedAGUIService.createSession()` calls in routes
- [ ] All routes have consistent SSE streaming behavior
- [ ] Test coverage ≥80% for middleware
- [ ] Documentation complete
- [ ] Performance benchmarks meet targets (latency < 50ms overhead)
