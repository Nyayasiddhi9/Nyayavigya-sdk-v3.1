# OrchestrationFacade Migration Guide
**Phase 2A Stage 0 - Refactoring Services to Use Unified Orchestration**

---

## Overview

The OrchestrationFacade provides a unified entrypoint for all NyayaVighya SDK orchestration requests, replacing direct LLM provider calls and ad-hoc orchestration patterns.

**Benefits:**
- ✅ Enforces NyayaVighya SDK as single source of truth
- ✅ Automatic AG-UI session management and streaming
- ✅ Standardized error handling with retry logic
- ✅ Centralized telemetry via CAM monitoring
- ✅ Type-safe fluent API
- ✅ Consistent ROMA autonomy enforcement

---

## Migration Patterns

### Pattern 1: Replace Direct OpenAI Calls

**BEFORE (❌ Bypasses NyayaVighya SDK):**
```typescript
// server/services/content-service.ts
import { OpenAI } from 'openai';

export class ContentService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    });
  }

  async generateContent(prompt: string) {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
      });
      
      return response.choices[0].message.content;
    } catch (error) {
      console.error('Content generation failed:', error);
      throw error;
    }
  }
}
```

**AFTER (✅ Uses OrchestrationFacade):**
```typescript
// server/services/content-service.ts
import { OrchestrationFacade } from '../orchestration/orchestration-facade';

export class ContentService {
  async generateContent(
    prompt: string,
    startupId?: number,
    userId?: number
  ) {
    const facade = new OrchestrationFacade({
      startupId,
      userId,
      studioId: 'content-generation',
    });

    try {
      const result = await facade.executeWorkflow('content-generation', {
        prompt,
      }, {
        type: 'creative',
        priority: 'medium',
        costOptimization: true,
      });

      return result.output;
    } finally {
      facade.close(); // Cleanup AG-UI session
    }
  }
}
```

**Improvements:**
- ✅ No direct OpenAI client instantiation
- ✅ Automatic fallback to other providers via NyayaVighya SDK
- ✅ AG-UI streaming enabled for real-time progress
- ✅ CAM monitoring tracks execution metrics
- ✅ Automatic retries with exponential backoff

---

### Pattern 2: Replace Direct Anthropic Calls

**BEFORE (❌ Bypasses NyayaVighya SDK):**
```typescript
// server/services/claude-code-router-integration.ts
import Anthropic from '@anthropic-ai/sdk';

export class ClaudeCodeRouter {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async analyzeCode(code: string, language: string) {
    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `Analyze this ${language} code:\n\n${code}`,
      }],
    });

    return response.content[0].text;
  }
}
```

**AFTER (✅ Uses OrchestrationFacade):**
```typescript
// server/services/claude-code-router-integration.ts
import { OrchestrationFacade } from '../orchestration/orchestration-facade';

export class ClaudeCodeRouter {
  async analyzeCode(
    code: string,
    language: string,
    startupId?: number,
    userId?: number
  ) {
    const facade = new OrchestrationFacade({
      startupId,
      userId,
      studioId: 'engineering-forge',
    });

    try {
      const result = await facade.executeWorkflow('code-analysis', {
        code,
        language,
      }, {
        type: 'analysis',
        priority: 'high',
        preferredProviders: ['anthropic'], // Can still prefer Claude
        qualityThreshold: 0.9,
      });

      return result.output;
    } finally {
      facade.close();
    }
  }
}
```

**Improvements:**
- ✅ Routes through NyayaVighya SDK (ROMA, BMAD, GRPO enabled)
- ✅ Can still prefer Claude but with automatic fallback
- ✅ Quality threshold enforcement
- ✅ Proper session lifecycle management

---

### Pattern 3: Replace LangChain Workflows

**BEFORE (❌ Custom orchestration):**
```typescript
// server/services/langchain-workflow-engine.ts
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { PromptTemplate } from 'langchain/prompts';

export class LangChainWorkflowEngine {
  private llm: ChatOpenAI;

  constructor() {
    this.llm = new ChatOpenAI({
      modelName: 'gpt-4',
      temperature: 0.7,
    });
  }

  async executeWorkflow(task: string) {
    const template = new PromptTemplate({
      template: 'Execute the following task: {task}',
      inputVariables: ['task'],
    });

    const formattedPrompt = await template.format({ task });
    const response = await this.llm.call(formattedPrompt);
    
    return response.text;
  }
}
```

**AFTER (✅ Uses OrchestrationFacade):**
```typescript
// server/services/langchain-workflow-engine.ts
import { OrchestrationFacade } from '../orchestration/orchestration-facade';

export class LangChainWorkflowEngine {
  async executeWorkflow(
    task: string,
    startupId?: number,
    userId?: number
  ) {
    const facade = new OrchestrationFacade({
      startupId,
      userId,
      studioId: 'workflow-automation',
    });

    try {
      const result = await facade.executeWorkflow('generic-task', {
        task,
        temperature: 0.7, // NyayaVighya SDK respects provider preferences
      }, {
        type: 'hybrid',
        priority: 'medium',
      });

      return result.output;
    } finally {
      facade.close();
    }
  }
}
```

---

### Pattern 4: Studio Service Migration

**BEFORE (❌ Complex orchestration logic):**
```typescript
// server/services/studios/wizards-ideation-lab.ts
import { OpenAI } from 'openai';
import { sharedAGUIService } from '../shared-agui-service';

export class WizardsIdeationLab {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async validateIdea(ideaDescription: string, startupId: number) {
    // Manually create AG-UI session
    const session = sharedAGUIService.createSession(startupId, randomUUID(), 'ideation-lab');

    try {
      // Manually emit events
      sharedAGUIService.emitEvent(session.id, {
        type: 'status_change',
        status: 'analyzing',
      });

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{
          role: 'user',
          content: `Validate this startup idea: ${ideaDescription}`,
        }],
      });

      sharedAGUIService.emitEvent(session.id, {
        type: 'status_change',
        status: 'completed',
      });

      return response.choices[0].message.content;
    } catch (error) {
      sharedAGUIService.emitEvent(session.id, {
        type: 'error',
        error: error.message,
      });
      throw error;
    } finally {
      sharedAGUIService.closeSession(session.id);
    }
  }
}
```

**AFTER (✅ Uses OrchestrationFacade - Clean & Simple):**
```typescript
// server/services/studios/wizards-ideation-lab.ts
import { OrchestrationFacade } from '../../orchestration/orchestration-facade';

export class WizardsIdeationLab {
  async validateIdea(
    ideaDescription: string,
    startupId: number,
    userId?: number
  ) {
    const facade = new OrchestrationFacade({
      startupId,
      userId,
      studioId: 'ideation-lab',
      enableStreaming: true, // AG-UI events automatic
      enableMonitoring: true, // CAM tracking automatic
      enableRetries: true, // Retry logic automatic
    });

    try {
      const result = await facade.executeWorkflow('idea-validation', {
        ideaDescription,
      }, {
        type: 'analysis',
        priority: 'high',
        qualityThreshold: 0.85,
      });

      return result.output;
    } finally {
      facade.close();
    }
  }
}
```

**Code Reduction:**
- BEFORE: ~35 lines of manual orchestration logic
- AFTER: ~20 lines using facade
- **43% code reduction** with better reliability

---

## Migration Checklist

When refactoring a service to use OrchestrationFacade:

### 1. Remove Direct Provider Imports
- [ ] Remove `import { OpenAI } from 'openai'`
- [ ] Remove `import Anthropic from '@anthropic-ai/sdk'`
- [ ] Remove `import { GoogleGenerativeAI } from '@google/generative-ai'`
- [ ] Remove any other direct LLM provider imports

### 2. Add OrchestrationFacade Import
- [ ] Add `import { OrchestrationFacade } from '../orchestration/orchestration-facade'`

### 3. Remove Manual AG-UI Session Management
- [ ] Remove manual `sharedAGUIService.createSession()` calls
- [ ] Remove manual `sharedAGUIService.emitEvent()` calls
- [ ] Remove manual `sharedAGUIService.closeSession()` calls

### 4. Remove Direct Provider Client Instantiation
- [ ] Remove `this.openai = new OpenAI({ ... })` from constructor
- [ ] Remove `this.anthropic = new Anthropic({ ... })` from constructor
- [ ] Remove similar instantiation for other providers

### 5. Replace Execution Logic
- [ ] Create `OrchestrationFacade` instance in method
- [ ] Call `facade.executeWorkflow(workflowName, params, options)`
- [ ] Always call `facade.close()` in `finally` block

### 6. Update Method Signatures
- [ ] Add `startupId?: number` parameter
- [ ] Add `userId?: number` parameter
- [ ] Keep existing business logic parameters

### 7. Test & Verify
- [ ] Verify no TypeScript errors
- [ ] Test workflow execution
- [ ] Verify AG-UI streaming works
- [ ] Check CAM monitoring integration
- [ ] Validate retry logic on failures

---

## Priority Migration Order

### Phase 1: High-Traffic Services (Week 1)
1. `server/services/openai-service.ts` - Direct OpenAI calls
2. `server/services/content-service.ts` - Content generation
3. `server/services/embedding-service.ts` - Embeddings
4. `server/services/studios/wizards-ideation-lab.ts` - Ideation workflows
5. `server/services/studios/wizards-engineering-forge.ts` - Code generation

### Phase 2: Claude Integrations (Week 2)
6. `server/services/claude-code-router-integration.ts` - Claude code routing
7. `server/services/claude-sub-agent-system.ts` - Sub-agent coordination
8. `server/services/claude-mcp.ts` - Claude MCP integration
9. `server/services/claude-canva-integration.ts` - Claude Canvas
10. `server/services/claude-flow-swarm-integration.ts` - Swarm coordination

### Phase 3: Specialized Services (Week 3)
11. `server/services/langchain-workflow-engine.ts` - LangChain workflows
12. `server/services/deepagents-integration.ts` - DeepAgents
13. `server/services/creative-content-agents.ts` - Creative agents
14. `server/services/kimi-k2-ai-service.ts` - Kimi K2
15. `server/services/real-llm-service.ts` - Real LLM service

### Phase 4: Remaining Studios (Week 4)
16-23. All remaining studio services (8 studios left)

---

## Testing Strategy

After each service migration:

```typescript
// Test file pattern: server/services/__tests__/[service-name].test.ts
import { OrchestrationFacade } from '../../orchestration/orchestration-facade';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Service Migration - OrchestrationFacade', () => {
  let facade: OrchestrationFacade;

  beforeEach(() => {
    facade = new OrchestrationFacade({
      startupId: 123,
      userId: 456,
      studioId: 'test-studio',
    });
  });

  afterEach(() => {
    facade.close();
  });

  it('should execute workflow successfully', async () => {
    const result = await facade.executeWorkflow('test-workflow', {
      param1: 'value1',
    });

    expect(result.success).toBe(true);
    expect(result.output).toBeDefined();
  });

  it('should retry on failure', async () => {
    // Force failure to test retry logic
    const result = await facade.executeWorkflow('failing-workflow', {});
    
    expect(result.retryCount).toBeGreaterThan(0);
  });

  it('should provide AG-UI session ID', () => {
    const sessionId = facade.getAGUISessionId();
    expect(sessionId).toBeTruthy();
  });
});
```

---

## Common Issues & Solutions

### Issue 1: "AG-UI events not streaming"
**Cause:** Facade not initialized with `enableStreaming: true`
**Solution:**
```typescript
const facade = new OrchestrationFacade({
  enableStreaming: true, // ← Add this
  studioId: 'your-studio',
});
```

### Issue 2: "Workflow fails without retry"
**Cause:** Retries disabled
**Solution:**
```typescript
const facade = new OrchestrationFacade({
  enableRetries: true, // ← Add this
  maxRetries: 3,
});
```

### Issue 3: "Memory leak - sessions not closing"
**Cause:** Missing `facade.close()` in finally block
**Solution:**
```typescript
try {
  const result = await facade.executeWorkflow(...);
} finally {
  facade.close(); // ← Always call this
}
```

---

## Success Metrics

Track these metrics during migration:

1. **Code Reduction**: Target 30-50% reduction in orchestration code
2. **Error Rate**: Should decrease due to standardized error handling
3. **Retry Success**: Monitor retry success rate via CAM
4. **AG-UI Adoption**: 100% of workflows streaming real-time events
5. **Provider Diversity**: NyayaVighya SDK should utilize multiple providers automatically

---

## Completion Criteria

Stage 0 Facade migration complete when:
- [ ] All 23 services with direct provider calls migrated
- [ ] Zero instances of `new OpenAI()` or `new Anthropic()` in services
- [ ] All studio services use OrchestrationFacade
- [ ] Test coverage ≥80% for migrated services
- [ ] Documentation complete for all patterns
- [ ] Performance benchmarks meet targets (latency < 500ms overhead)
