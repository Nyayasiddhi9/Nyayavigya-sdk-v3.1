# NyayaVighya SDK v3.1 - Orchestration Algorithms & Agentic Standards

**Version:** 3.1.5  
**Updated:** January 26, 2026  
**Status:** Production Ready

---

## Executive Summary

This document defines the orchestration algorithms, agentic standards, and communication protocols supported by NyayaVighya SDK v3.1. The Queen Orchestrator uses these algorithms to intelligently decompose legal tasks into subtasks, route them to optimal legal agents, and synthesize coherent outputs.

---

## 1. Orchestration Patterns Supported

### 1.1 Single Agent Pattern
**Use Case:** Simple tasks requiring one specialist

```
User Prompt → Queen Analysis → Agent Selection → Execution → Output
```

**When to Use:**
- Simple questions or requests
- Domain-specific tasks (e.g., "translate this text")
- Low complexity (< 10 words, single domain)

### 1.2 Sequential Pattern
**Use Case:** Tasks with linear dependencies

```
User Prompt → [Agent A] → [Agent B] → [Agent C] → Output
```

**When to Use:**
- Pipeline workflows (research → write → edit)
- Tasks where each step builds on previous
- Ordered processes (design → implement → test)

### 1.3 Parallel Pattern
**Use Case:** Independent subtasks that can run concurrently

```
                 ┌─→ [Agent A] ─┐
User Prompt → ───┼─→ [Agent B] ─┼─→ Synthesis → Output
                 └─→ [Agent C] ─┘
```

**When to Use:**
- Multi-domain requests (frontend + backend + database)
- Research from multiple perspectives
- Speed-critical tasks

### 1.4 DAG (Directed Acyclic Graph) Pattern
**Use Case:** Complex workflows with dependencies

```
                    ┌─→ [Agent B] ─┐
User Prompt → [A] ──┤              ├─→ [D] → Output
                    └─→ [Agent C] ─┘
```

**When to Use:**
- Application development (planning → parallel dev → integration)
- Complex analysis with dependencies
- Enterprise workflows

### 1.5 Swarm Intelligence Pattern
**Use Case:** Creative/research tasks benefiting from diverse perspectives

```
                 ┌─→ [Swarm Agent 1] ─┐
                 ├─→ [Swarm Agent 2] ─┤
User Prompt → ───┼─→ [Swarm Agent 3] ─┼─→ Aggregation → Output
                 ├─→ [Swarm Agent 4] ─┤
                 └─→ [Swarm Agent 5] ─┘
```

**When to Use:**
- Research and exploration
- Creative brainstorming
- Fault-tolerant distributed tasks
- When diverse perspectives improve output

### 1.6 Hierarchical Pattern
**Use Case:** Enterprise projects with clear phase structure

```
         ┌─────────────────────────────────────────┐
Level 0: │              Goal Definition             │
         └─────────────────────────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
Level 1: │   Planning   │   Design   │   Impl   │
         └──────────────────┼──────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
Level 2: │   Testing    │   Deploy   │   Review │
         └──────────────────┼──────────────────┘
                            │
                       Integration
```

**When to Use:**
- Full application development
- Enterprise projects
- SDLC workflows

---

## 2. Task Decomposition Algorithms

### 2.1 ACONIC (Analysis of CONstraint-Induced Complexity)
**Origin:** arXiv:2510.07772 (October 2024)

**How it works:**
1. Convert task to constraint satisfaction problem
2. Build constraint graph (nodes = subtasks, edges = dependencies)
3. Calculate graph treewidth for complexity estimation
4. Decompose into "bags" arranged in tree structure
5. Ensure global consistency while maximizing local solvability

**Best for:**
- Complex reasoning tasks
- Database queries
- Logic problems with multiple constraints

**Performance:** 10-40% accuracy improvement over standard CoT

### 2.2 ADaPT (As-Needed Decomposition & Planning)
**Type:** Recursive, adaptive algorithm

**How it works:**
1. Attempt direct execution
2. If subtask too complex → decompose recursively
3. Use Planner module for decomposition
4. Use Executor module for solving
5. Handle failures with replanning

**Best for:**
- Variable complexity tasks
- When overhead matters
- Adaptive workflows

**Advantages:**
- Decomposes only when necessary
- Resilient to execution failures
- Lower overhead for simple tasks

### 2.3 HTA (Hierarchical Task Analysis)
**Origin:** Human factors engineering

**How it works:**
1. Define overall goal (Level 0)
2. Break into major phases (Level 1)
3. Decompose phases into operations (Level 2)
4. Continue until atomic actions reached
5. Define plans for each level

**Best for:**
- Application development
- Process optimization
- Training and documentation

**Phases for Development:**
1. Planning → Architecture decisions
2. Design → UI/UX, data models
3. Implementation → Code generation
4. Testing → QA, automation
5. Deployment → DevOps, monitoring

### 2.4 Swarm Decomposition
**Origin:** Swarm intelligence theory

**How it works:**
1. Create N independent agents (swarm)
2. Each explores solution space independently
3. Agents share discoveries via message bus
4. Aggregator synthesizes best insights
5. Emergent intelligence from collective

**Best for:**
- Research and exploration
- Creative tasks
- Distributed problem solving

---

## 3. Agentic Communication Protocols

### 3.1 A2A (Agent-to-Agent Protocol)
**Origin:** Google (January 2026)

**Purpose:** Connect agents to other agents

**Key Features:**
- Modality agnostic (text, audio, video)
- Agent Cards for capability advertisement
- Enterprise-grade authentication
- Long-running task support

**Implementation in NyayaVighya SDK:**
```typescript
interface A2AMessage {
  fromAgent: string;
  toAgent: string;
  payload: any;
  modality: 'text' | 'audio' | 'video' | 'structured';
  correlationId: string;
  timestamp: number;
}
```

### 3.2 MCP (Model Context Protocol)
**Origin:** Anthropic (November 2024)

**Purpose:** Connect agents to tools and context

**Key Features:**
- Standardized tool invocation
- Context exchange between AI and external systems
- 97M+ monthly SDK downloads
- 10,000+ active public MCP servers

**Implementation in NyayaVighya SDK:**
```typescript
interface MCPToolCall {
  toolId: string;
  parameters: Record<string, any>;
  context: {
    sessionId: string;
    userId: string;
    agentId: string;
  };
}
```

### 3.3 AG-UI (Agent-User Interaction Protocol)
**Origin:** CopilotKit (May 2025)

**Purpose:** Connect agents to users through frontends

**Key Features:**
- Bidirectional event streaming
- Full event transparency
- Integrates with MCP and A2A
- Adopted by LangGraph, CrewAI, Microsoft Agent Framework

**Implementation in NyayaVighya SDK:**
```typescript
interface AGUIEvent {
  type: 'thinking' | 'tool_call' | 'output' | 'error';
  agentId: string;
  content: any;
  streamId: string;
  timestamp: number;
}
```

### 3.4 ROMA (Recursive Open Meta-Agent) L1-L4
**Origin:** NyayaVighya SDK / Sentient AI

**Purpose:** Define agent autonomy levels

| Level | Name | Description | Example Actions |
|-------|------|-------------|-----------------|
| L1 | Manual | Human-controlled | User approves each action |
| L2 | Assisted | Agent suggests, human approves | Draft → Review → Execute |
| L3 | Conditional | Agent acts within parameters | Autonomous within guardrails |
| L4 | Full Autonomous | Agent operates independently | Self-directed execution |

**Implementation in NyayaVighya SDK:**
- All 275 agents have ROMA level assigned
- Queen Orchestrator respects ROMA levels
- L4 agents can spawn L2/L3 subagents

### 3.5 Parlant Communication Standards
**Purpose:** Standardize agent communication quality

**22-Point Agent Structure:**
1. Identity: id, name, version
2. Classification: tier, romaLevel, category, group
3. Description: description
4. Capabilities: capabilities, tools, protocols
5. Model preferences: preferredModels, fallbackModels
6. Operation: operationMode, securityLevel
7. Hierarchy: reportsTo, manages, collaboratesWith
8. Languages: supportedLanguages
9. Guardrails: parlantCompliant, antiHallucination, piiProtection, requiresCitation
10. Cost: maxCostPerTask, preferCheaperModels
11. Status: status

### 3.6 BMAD (Behavioral Multi-Agent Dynamics)
**Purpose:** Coordinate agent behaviors in multi-agent scenarios

**Modes:**
- Continuous: Agents work in parallel loops
- Sequential: Ordered execution
- Reactive: Event-driven responses
- Proactive: Self-initiated actions

---

## 4. Collective Intelligence Modes

### 4.1 Brainstorm Mode
- All agents generate ideas independently
- No critique during generation
- Aggregate all ideas
- Best for: Creative tasks, ideation

### 4.2 Consensus Mode
- Agents work towards agreement
- Multiple rounds of refinement
- Convergence on shared solution
- Best for: Decision making, policy creation

### 4.3 Vote Mode
- Each agent proposes solution
- Weighted voting based on expertise
- Majority wins
- Best for: Quick decisions, preferences

### 4.4 Debate Mode
- Agents argue different positions
- Pro/con structure
- Synthesis of arguments
- Best for: Analysis, risk assessment

### 4.5 Synthesis Mode
- Each agent contributes expertise
- Aggregator combines perspectives
- Create coherent whole
- Best for: Research, documentation

---

## 5. Prompt Engineering Techniques

### 5.1 Chain-of-Thought (CoT)
```
"Let's think step-by-step..."
```
- Model articulates intermediate reasoning
- Improves transparency
- Better for complex problems

### 5.2 Tree of Thoughts (ToT)
- Explore multiple reasoning paths
- Evaluate branches
- Select best path
- For problems requiring exploration

### 5.3 ReAct (Reason + Act)
```
Thought: I need to find X
Action: Search for X
Observation: Found Y
Thought: Y is relevant because...
```
- Combines reasoning with tool use
- For tasks requiring external data

### 5.4 Recursive Self-Improvement (RSI)
```
1. Generate output
2. Critique output (different dimension each time)
3. Improve based on critique
4. Repeat
```
- 60% reduction in revision cycles
- For quality-critical tasks

### 5.5 Skeleton-of-Thought (SoT)
```
1. Create skeleton/outline
2. Fill in details in parallel
3. Integrate
```
- For structured outputs
- Enables parallelization

---

## 6. Agent Selection Algorithm

### 6.1 Capability Matching
```typescript
function findOptimalAgent(subtask: Subtask): Agent {
  return agents
    .filter(a => a.status === 'active')
    .map(a => ({
      agent: a,
      score: calculateScore(a, subtask)
    }))
    .sort((a, b) => b.score - a.score)[0]?.agent;
}

function calculateScore(agent: Agent, subtask: Subtask): number {
  let score = 0;
  
  // Capability match (+10 per match)
  for (const cap of subtask.requiredCapabilities) {
    if (agent.capabilities.includes(cap)) score += 10;
  }
  
  // ROMA level bonus
  const romaBonus = { L4: 4, L3: 3, L2: 2, L1: 1 };
  score += romaBonus[agent.romaLevel] * (subtask.complexity === 'complex' ? 2 : 1);
  
  // Tier bonus for complex tasks
  if (subtask.complexity === 'complex' && agent.tier === 'executive') {
    score += 5;
  }
  
  return score;
}
```

### 6.2 Load Balancing
- Track agent execution counts
- Prefer agents with lower load
- Round-robin for equal scores
- Fallback to general agents if specialists unavailable

---

## 7. Context Engineering

### 7.1 Context Layers
1. **User Context:** Preferences, history, session memory
2. **Task Context:** Current prompt, decomposition, subtask details
3. **Agent Context:** Capabilities, constraints, protocols
4. **System Context:** Available tools, providers, limits

### 7.2 Context Compression
- mem0 for long-term memory (90% token reduction)
- Semantic extraction of key information
- Progressive summarization
- Vector-based retrieval for relevance

### 7.3 Context Propagation
```
User Prompt
    ↓
Queen Orchestrator (adds: decomposition, routing)
    ↓
Agent (adds: capabilities, constraints)
    ↓
LLM (receives: full context)
    ↓
Output (propagates: results, metadata)
```

---

## 8. Cost Optimization Strategies

### 8.1 Model Selection Hierarchy
1. **Free models first:** Groq, DeepSeek, OpenRouter free tier
2. **Budget models:** Claude Haiku 4.5, Gemini 3.0 Flash, DeepSeek R1
3. **Standard models:** GPT-5.0, Claude Sonnet 4.5
4. **Premium models:** GPT-5.2, Claude Opus 4.5, o3-pro

### 8.2 Token Optimization
- Context compression before each call
- Output length limits
- Caching for repeated queries
- Semantic deduplication

### 8.3 Provider Arbitrage
- Real-time price comparison
- Quality-adjusted cost scoring
- Fallback cascades (5 levels)
- Health-aware routing

---

## 9. Quality Assurance

### 9.1 Guardrails
- **Parlant Compliance:** Communication standards check
- **Anti-Hallucination:** Fact-checking, uncertainty acknowledgment
- **PII Protection:** Automatic detection and redaction
- **Citation Required:** Source tracking for claims

### 9.2 Output Validation
- Schema validation for structured outputs
- Consistency checks across agent outputs
- Quality scoring (0-100)
- Human review triggers (confidence < 0.7)

---

## 10. Implementation Status

### Current Capabilities (January 2026)
| Feature | Status | Notes |
|---------|--------|-------|
| Single Agent | ✅ Production | Full support |
| Sequential | ✅ Production | Full support |
| Parallel | ✅ Production | Full support |
| DAG | ✅ Production | Full support |
| Swarm | ✅ Production | Full support |
| Hierarchical | ✅ Production | Full support |
| ACONIC | ✅ Production | Constraint-based decomposition |
| ADaPT | ✅ Production | Adaptive decomposition |
| HTA | ✅ Production | Hierarchical decomposition |
| A2A Protocol | ✅ Active | Inter-agent communication |
| MCP Protocol | ✅ Active | Tool integration |
| AG-UI Protocol | ✅ Active | UI streaming |
| ROMA L1-L4 | ✅ Enforced | All 275 agents |
| Parlant Standards | ✅ Active | 22-point structure |
| BMAD Coordination | ✅ Active | Multi-agent behaviors |
| Collective Intelligence | ✅ Production | 5 modes |

### Agent Distribution
- **Total Agents:** 275
- **Executive (L4):** 25
- **Development (L2-L3):** 71
- **Domain (L2-L3):** 127
- **Creative (L2):** 20
- **QA (L2):** 15
- **DevOps (L2-L3):** 17

---

## References

1. ACONIC: arXiv:2510.07772 (October 2024)
2. ADaPT: As-Needed Decomposition & Planning (2024)
3. A2A Protocol: Google Developers Blog (January 2026)
4. MCP: Anthropic / Agentic AI Foundation (2024-2025)
5. AG-UI: CopilotKit (May 2025)
6. ROMA: Sentient AI (October 2025)
7. Swarm Frameworks: OpenAI Swarm, kyegomez/swarms (2024-2025)
8. LangGraph, CrewAI, AutoGen documentation (2025)

---

**Document Owner:** NyayaVighya SDK Team  
**Last Updated:** January 16, 2026
