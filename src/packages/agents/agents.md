# NyayaVighya SDK v3.1 - Legal Agent Definition Guide

## Overview

This document provides comprehensive guidance for defining, modifying, and adding new agents to the NyayaVighya 275-agent legal ecosystem. All agents must follow the **22-point system prompt framework** and adhere to ROMA (L1-L4) autonomy levels.

---

## Agent Architecture

### Tier Structure

| Tier | Count | ROMA Level | Description |
|------|-------|------------|-------------|
| **Executive** | 25 | L3-L4 | C-Suite, Directors, Orchestrators |
| **Development** | 70 | L2-L3 | Engineers, Specialists, Architects |
| **Domain** | 120 | L1-L3 | Business, Operations, Industry experts |
| **Creative** | 20 | L1-L2 | Design, Content, Multimedia |
| **QA** | 15 | L2-L3 | Testing, Security, Performance |
| **DevOps** | 17 | L2-L3 | Infrastructure, CI/CD, SRE |

### ROMA Autonomy Levels

| Level | Autonomy | Max Steps | Description |
|-------|----------|-----------|-------------|
| **L1** | Limited | 3 | Reactive, task-focused, requires supervision |
| **L2** | Moderate | 5 | Independent execution within defined scope |
| **L3** | High | 8 | Proactive, can suggest improvements |
| **L4** | Full | 12 | Self-initiating, can spawn sub-agents |

---

## Agent Definition Schema

### Required Fields

```typescript
interface AgentDefinition {
  // Identity
  id: string;                    // Unique identifier (kebab-case)
  name: string;                  // Display name
  version: string;               // Semantic version (e.g., "10.0.0")
  
  // Classification
  tier: AgentTier;               // 'executive' | 'development' | 'domain' | 'creative' | 'qa' | 'devops'
  romaLevel: RomaLevel;          // 'L1' | 'L2' | 'L3' | 'L4'
  category: string;              // Functional category
  group: string;                 // Team/department grouping
  
  // Core
  description: string;           // Brief description (1-2 sentences)
  systemPrompt: string;          // Full 22-point system prompt
  capabilities: string[];        // Core capabilities (5-10 items)
  tools: string[];               // Available tools
  
  // Protocols
  protocols: string[];           // ['A2A', 'MCP', 'AG-UI', 'OpenAgent', 'ROMA']
  
  // LLM Configuration
  preferredModels: string[];     // Primary model choices
  fallbackModels: string[];      // Backup models
  
  // Behavior
  operationMode: OperationMode;  // 'autonomous' | 'supervised' | 'collaborative' | 'reactive'
  securityLevel: SecurityLevel;  // 'low' | 'medium' | 'high' | 'critical'
  
  // Relationships
  reportsTo: string[];           // Supervisor agent IDs
  manages: string[];             // Subordinate agent IDs
  collaboratesWith: string[];    // Peer agent IDs
  
  // Internationalization
  supportedLanguages: string[];  // ISO 639-1 codes
  
  // Safety
  guardrails: {
    parlantCompliant: boolean;   // Follows Parlant prompt standards
    antiHallucination: boolean;  // Has hallucination prevention
    piiProtection: boolean;      // Protects personal information
    requiresCitation: boolean;   // Must cite sources
  };
  
  // Cost
  costOptimization: {
    maxCostPerTask: number;      // Maximum $ per task
    preferCheaperModels: boolean; // Use budget models when possible
  };
  
  // Status
  status: 'active' | 'beta' | 'deprecated';
}
```

---

## 22-Point System Prompt Framework

Every agent must implement all 22 points in their system prompt:

### 1. Autonomous Execution
```markdown
## 1. AUTONOMOUS EXECUTION
Autonomy Level: [FULL/HIGH/MODERATE/LIMITED]
- Execute tasks independently with up to [N] autonomous steps
- [Self-initiate and spawn sub-agents / Execute assigned tasks within scope]
- Verify outputs before delivery, iterate until quality threshold met
```

### 2. Guardrail Compliance
```markdown
## 2. GUARDRAIL COMPLIANCE
- [Domain-specific guardrails]
- NEVER fabricate data or sources - state uncertainty explicitly
- NEVER expose secrets, API keys, or PII
- Maintain compliance with all applicable regulations
```

### 3. Self-Learning
```markdown
## 3. SELF-LEARNING
- Track performance metrics and adapt strategies
- Integrate feedback loops for continuous improvement
- Report learning insights to supervisors
```

### 4. Capability Awareness
```markdown
## 4. CAPABILITY AWARENESS
### Core Capabilities
- [Capability 1]
- [Capability 2]
- Acknowledge limitations, refer to specialists when needed
- Confidence threshold: 70% before independent execution
```

### 5. Collaborative Multi-Agent
```markdown
## 5. COLLABORATIVE MULTI-AGENT
- Reports To: [Supervisor agents]
- Manages: [Subordinate agents]
- Collaborates With: [Peer agents]
```

### 6. Parallel Execution
```markdown
## 6. PARALLEL EXECUTION
- Execute independent operations simultaneously (max [N])
- Batch operations for efficiency
- Track dependencies appropriately
```

### 7. Swarm Coordination
```markdown
## 7. SWARM COORDINATION
- Participate in collective intelligence when beneficial
- Contribute specialized expertise to team goals
```

### 8. LLM Intelligence
```markdown
## 8. LLM INTELLIGENCE
Preferred: [Primary models]
Fallback: [Backup models]
```

### 9. Context Engineering
```markdown
## 9. CONTEXT ENGINEERING
- Gather complete context before execution
- Maintain critical context across interactions
- Compress non-critical information to save tokens
```

### 10. Multimodal Processing
```markdown
## 10. MULTIMODAL PROCESSING
- Process text, images, documents, audio as needed
- Use specialized models for multimodal tasks
```

### 11. Hierarchy Awareness
```markdown
## 11. HIERARCHY AWARENESS
Tier: [1/2/3]
Escalation: [Supervisor] → [Executive]
```

### 12. Multi-Language Support
```markdown
## 12. MULTI-LANGUAGE SUPPORT
23+ languages: English, Spanish, French, German, Chinese, Japanese, Korean, Hindi, Portuguese, Arabic, Italian, Dutch, Russian, Polish, Turkish, Thai, Vietnamese, Indonesian, Malay, Bengali, Tamil, Telugu, Kannada
```

### 13. Behavioral Intelligence
```markdown
## 13. BEHAVIORAL INTELLIGENCE
- Professional, clear communication
- Adapt tone to audience and context
- Show expertise without condescension
```

### 14. Cost Optimization
```markdown
## 14. COST OPTIMIZATION
Max cost per task: $[N]
- Use appropriate model for task complexity
- Batch operations, cache results
```

### 15. Process Orientation
```markdown
## 15. PROCESS ORIENTATION
- Follow Agile/iterative methodology
- Quality gates at each milestone
```

### 16. Specialty Definition
```markdown
## 16. SPECIALTY DEFINITION
[Domain-specific expertise and instructions]
```

### 17. Communication
```markdown
## 17. COMMUNICATION
- Use Markdown, code blocks, tables appropriately
- Cite sources for factual claims
- Be direct and actionable
```

### 18. Team Capability
```markdown
## 18. TEAM CAPABILITY
- Work autonomously or in teams as needed
- Share knowledge and coordinate effectively
```

### 19. Prompt Engineering
```markdown
## 19. PROMPT ENGINEERING
- Understand requirements before implementing
- Clarify ambiguities when critical
- Execute minimal but correct approach
```

### 20. Task & Tools Awareness
```markdown
## 20. TASK & TOOLS AWARENESS
Tools: [Available tools list]
```

### 21. Fallback Behavior
```markdown
## 21. FALLBACK BEHAVIOR
- Try alternatives if primary approach fails
- Escalate when outside capability
- Provide partial results with clear gaps
```

### 22. Global Protocol Compliance
```markdown
## 22. GLOBAL PROTOCOL COMPLIANCE
Protocols: A2A, MCP, ROMA [Level], AG-UI, OpenAgent
```

---

## Adding a New Agent

### Step 1: Define Agent Identity

```typescript
const newAgent: AgentDefinition = {
  id: 'my-specialist-agent',
  name: 'My Specialist Agent',
  version: '10.0.0',
  tier: 'domain',
  romaLevel: 'L2',
  category: 'specialty',
  group: 'team-name',
  description: 'Expert in [domain] with [key capabilities]',
  // ... other fields
};
```

### Step 2: Generate System Prompt

Use the `generateFullPrompt` function:

```typescript
const systemPrompt = generateFullPrompt({
  name: 'My Specialist Agent',
  role: 'Expert in [domain] responsible for [responsibilities]',
  tier: 'domain',
  romaLevel: 'L2',
  category: 'specialty',
  capabilities: ['capability-1', 'capability-2', 'capability-3'],
  tools: ['tool-1', 'tool-2'],
  reportsTo: ['supervisor-agent'],
  manages: [],
  collaboratesWith: ['peer-agent-1', 'peer-agent-2'],
  specialInstructions: 'Detailed domain-specific instructions...',
  guardrails: [
    'Domain-specific safety rule 1',
    'Domain-specific safety rule 2'
  ],
  outputFormats: ['Format 1', 'Format 2', 'Format 3']
});
```

### Step 3: Configure LLM Models

Select appropriate models based on task complexity:

| Tier | Preferred Models | Fallback Models |
|------|-----------------|-----------------|
| Premium | claude-opus-4.5, gpt-5.1, o3-pro | claude-sonnet-4.5, gpt-4o |
| Standard | claude-sonnet-4.5, gpt-4o, gemini-2.5-pro | claude-haiku-4, gpt-4o-mini |
| Budget | claude-haiku-4, gpt-4o-mini, deepseek-r1 | llama-3.3-70b |

### Step 4: Define Relationships

```typescript
reportsTo: ['direct-supervisor-id'],
manages: ['subordinate-1', 'subordinate-2'],
collaboratesWith: ['peer-1', 'peer-2', 'peer-3']
```

### Step 5: Add to Registry

Add the agent to the appropriate definition file:
- **Executive**: `all-267-agents-v10.ts`
- **Development**: `extended-agents-v10.ts`
- **Domain**: `extended-agents-v10.ts`
- **Creative/QA/DevOps**: `complete-agent-categories.ts`

---

## Modifying an Existing Agent

### Locate the Agent

```bash
# Find agent definition
grep -r "id: 'agent-id'" nyayavighya-sdk/packages/agents/src/definitions/
```

### Update Fields

1. **Capabilities**: Add/remove from `capabilities` array
2. **Models**: Update `preferredModels` and `fallbackModels`
3. **Relationships**: Modify `reportsTo`, `manages`, `collaboratesWith`
4. **System Prompt**: Regenerate using `generateFullPrompt`

### Version Bump

Always increment the version when making changes:
- **Patch** (10.0.1): Bug fixes, minor updates
- **Minor** (10.1.0): New capabilities, model changes
- **Major** (11.0.0): Breaking changes, major restructure

---

## Best Practices

### Naming Conventions

- **ID**: kebab-case, descriptive (e.g., `nodejs-specialist`)
- **Name**: Title case with "Agent" suffix (e.g., `Node.js Specialist Agent`)
- **Category**: lowercase, single word (e.g., `backend`, `marketing`)

### Capability Design

- Use action-oriented names (`data-analysis`, not `data`)
- Be specific (`react-development`, not `frontend`)
- Include 5-10 core capabilities per agent

### Security Levels

| Level | Use Case |
|-------|----------|
| `low` | Content creation, design, general queries |
| `medium` | Code execution, data processing |
| `high` | Financial data, PII, system access |
| `critical` | Security operations, executive decisions |

### Cost Optimization

```typescript
costOptimization: {
  maxCostPerTask: tier === 'executive' ? 1.0 : tier === 'development' ? 0.5 : 0.25,
  preferCheaperModels: tier !== 'executive'
}
```

---

## Protocol Support

### A2A (Agent-to-Agent)
- All agents must support A2A for inter-agent communication
- Use structured message formats

### MCP (Model Context Protocol)
- Required for LLM interactions
- Supports context window management

### ROMA (Autonomy Levels)
- L1-L4 define execution boundaries
- Higher levels have more autonomous capabilities

### AG-UI (Agent-UI)
- For agents with user-facing interactions
- Streaming support for real-time responses

### OpenAgent
- Open protocol for external integrations
- Optional for internal-only agents

---

## Testing New Agents

### Unit Tests

```typescript
import { AgentTestRunner } from './orchestration/agent-test-suite';

const runner = new AgentTestRunner();
const results = await runner.testAgentRegistry();
console.log(`${results.passed}/${results.totalTests} tests passed`);
```

### Integration Tests

```typescript
import { getLLMAgentIntegration } from './orchestration/llm-agent-integration';

const integration = getLLMAgentIntegration();
const task = {
  id: 'test-1',
  type: 'domain',
  description: 'Test task for new agent',
  requirements: ['capability-1'],
  priority: 'medium',
  context: {}
};

const result = await integration.executeTask(task);
console.log('Execution result:', result);
```

---

## Export and Distribution

### JSON Export

The complete agent registry is available at:
```
nyayavighya-sdk/packages/agents/all-267-agents.json
```

### Programmatic Access

```typescript
import { ALL_AGENTS, AGENT_STATISTICS } from 'nyayavighya-sdk/packages/agents';

console.log(`Total agents: ${AGENT_STATISTICS.total}`);
console.log(`By tier:`, AGENT_STATISTICS.bySource);
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 10.0.0 | 2026-01-15 | Initial 267-agent release with 22-point prompts |

---

## Support

For questions or issues with agent definitions:
1. Check the documentation in `AGENT-IMPLEMENTATION-STATUS.md`
2. Review test suite in `agent-test-suite.ts`
3. Consult the LLM integration in `llm-agent-integration.ts`
