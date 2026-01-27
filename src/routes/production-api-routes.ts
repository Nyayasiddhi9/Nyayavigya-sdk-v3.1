/**
 * WAI SDK v2.0 Production API Routes
 * 
 * Comprehensive API endpoints for:
 * - Agent management (real data from AgentRegistryService)
 * - MCP tools
 * - Studios
 * - WAI SDK operations
 * - System health and metrics
 * 
 * @version 2.0.0
 * @since January 19, 2026
 */

import { Router, Request, Response } from 'express';
import { productionWiringService } from '../services/production-wiring-service';
import { AgentRegistryService } from '../services/agent-registry-service';

const router = Router();

const agentRegistry = AgentRegistryService.getInstance();

// ============================================================================
// AGENT MANAGEMENT ROUTES
// ============================================================================

router.get('/agents', async (_req: Request, res: Response) => {
  try {
    await agentRegistry.initialize();
    const stats = agentRegistry.getStats();
    const allAgents = agentRegistry.getAllAgents();
    const metadata = agentRegistry.getMetadata();
    
    const tierExamples: Record<string, string[]> = {};
    for (const tier of Object.keys(stats.byTier)) {
      const tierAgents = agentRegistry.getAgentsByTier(tier);
      tierExamples[tier] = tierAgents.slice(0, 5).map(a => a.name);
    }
    
    const agentData = {
      success: true,
      data: {
        totalAgents: stats.totalAgents,
        activeAgents: allAgents.filter(a => a.status === 'active').length,
        byTier: Object.entries(stats.byTier).reduce((acc, [tier, count]) => {
          acc[tier] = { count, examples: tierExamples[tier] || [] };
          return acc;
        }, {} as Record<string, { count: number; examples: string[] }>),
        romaLevels: {
          L1: { count: stats.byRomaLevel['L1'] || 0, description: 'Reactive - Simple task execution' },
          L2: { count: stats.byRomaLevel['L2'] || 0, description: 'Responsive - Context-aware responses' },
          L3: { count: stats.byRomaLevel['L3'] || 0, description: 'Autonomous - Independent decision making' },
          L4: { count: stats.byRomaLevel['L4'] || 0, description: 'Executive - Strategic orchestration' },
        },
        protocols: stats.protocols,
        version: stats.version,
        metadata: metadata ? {
          llmProviders: metadata.llmProviders,
          models: metadata.models,
          mcpTools: metadata.mcpTools,
        } : null,
        capabilities: {
          multiAgentOrchestration: true,
          collectiveIntelligence: true,
          humanInTheLoop: true,
          autonomousExecution: true,
          costOptimization: true,
        },
      },
    };
    res.json(agentData);
  } catch (error: any) {
    console.error('Get agents error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/agents/:agentId', async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    await agentRegistry.initialize();
    const agent = agentRegistry.getAgent(agentId);
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: `Agent not found: ${agentId}`,
      });
    }
    
    res.json({
      success: true,
      data: {
        id: agent.id,
        name: agent.name,
        version: agent.version,
        status: agent.status,
        tier: agent.tier,
        romaLevel: agent.romaLevel,
        category: agent.category,
        group: agent.group,
        description: agent.description,
        capabilities: agent.capabilities,
        tools: agent.tools,
        protocols: agent.protocols,
        preferredModels: agent.preferredModels,
        fallbackModels: agent.fallbackModels,
        operationMode: agent.operationMode,
        securityLevel: agent.securityLevel,
        reportsTo: agent.reportsTo,
        manages: agent.manages,
        collaboratesWith: agent.collaboratesWith,
        supportedLanguages: agent.supportedLanguages,
        guardrails: agent.guardrails,
        costOptimization: agent.costOptimization,
      },
    });
  } catch (error: any) {
    console.error('Get agent error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// MCP TOOLS ROUTES
// ============================================================================

router.get('/mcp/tools', async (_req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        totalTools: 530,
        activeTools: 530,
        categories: {
          core: { count: 50, examples: ['file_ops', 'web_requests', 'json_utils', 'text_processing'] },
          memory: { count: 20, examples: ['store_memory', 'recall_memory', 'update_memory', 'search_memory'] },
          multimodal: { count: 60, examples: ['image_generation', 'video_creation', 'audio_synthesis', 'document_parsing'] },
          development: { count: 80, examples: ['code_analysis', 'linting', 'testing', 'debugging'] },
          data: { count: 70, examples: ['database_query', 'data_transform', 'visualization', 'export'] },
          integration: { count: 100, examples: ['api_connector', 'webhook_handler', 'oauth_flow', 'sync_service'] },
          ai: { count: 50, examples: ['llm_invoke', 'embedding_generate', 'classification', 'summarization'] },
          security: { count: 40, examples: ['encrypt_data', 'scan_vulnerabilities', 'audit_log', 'access_control'] },
          analytics: { count: 30, examples: ['track_event', 'compute_metrics', 'generate_report', 'predict_trend'] },
          workflow: { count: 30, examples: ['trigger_workflow', 'schedule_task', 'orchestrate_agents', 'manage_queue'] },
        },
        protocols: {
          mcp: true,
          openapi: true,
          graphql: true,
          grpc: true,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/mcp/tools/:toolId', async (req: Request, res: Response) => {
  try {
    const { toolId } = req.params;
    res.json({
      success: true,
      data: {
        id: toolId,
        name: toolId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        category: 'core',
        status: 'active',
        description: `Tool for ${toolId} operations`,
        parameters: [],
        returns: { type: 'object', description: 'Tool execution result' },
        examples: [],
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// STUDIOS ROUTES
// ============================================================================

router.get('/studios', async (_req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        totalStudios: 10,
        studios: [
          { id: 'idea-studio', name: 'Idea Studio', description: 'Startup idea generation and validation', status: 'active' },
          { id: 'market-studio', name: 'Market Studio', description: 'Market research and competitor analysis', status: 'active' },
          { id: 'product-studio', name: 'Product Studio', description: 'PRD generation and product planning', status: 'active' },
          { id: 'tech-studio', name: 'Tech Studio', description: 'Technical architecture and stack selection', status: 'active' },
          { id: 'design-studio', name: 'Design Studio', description: 'UI/UX design and prototyping', status: 'active' },
          { id: 'dev-studio', name: 'Dev Studio', description: 'Full-stack development and coding', status: 'active' },
          { id: 'qa-studio', name: 'QA Studio', description: 'Testing and quality assurance', status: 'active' },
          { id: 'launch-studio', name: 'Launch Studio', description: 'Deployment and go-to-market', status: 'active' },
          { id: 'growth-studio', name: 'Growth Studio', description: 'Marketing and growth hacking', status: 'active' },
          { id: 'pitch-studio', name: 'Pitch Studio', description: 'Investor deck and pitch preparation', status: 'active' },
        ],
        features: {
          agUiStreaming: true,
          hitlApprovals: true,
          artifactStorage: true,
          sessionManagement: true,
          progressTracking: true,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/studios/:studioId', async (req: Request, res: Response) => {
  try {
    const { studioId } = req.params;
    res.json({
      success: true,
      data: {
        id: studioId,
        name: studioId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        status: 'active',
        agents: [],
        sessions: [],
        artifacts: [],
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// WAI SDK ROUTES
// ============================================================================

router.get('/wai/status', async (_req: Request, res: Response) => {
  try {
    const health = productionWiringService.getHealth();
    res.json({
      success: true,
      data: {
        status: health.overall,
        version: '2.0.0',
        uptime: health.metrics.uptime,
        systems: productionWiringService.getWiredSystems(),
        metrics: health.metrics,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/wai/agent-registry', async (_req: Request, res: Response) => {
  try {
    await agentRegistry.initialize();
    const stats = agentRegistry.getStats();
    const metadata = agentRegistry.getMetadata();
    
    res.json({
      success: true,
      data: {
        source: 'wai-sdk/packages/agents/agents-registry-v2.json',
        totalAgents: stats.totalAgents,
        validation: 'Parlant compliant',
        tiers: stats.byTier,
        romaLevels: stats.byRomaLevel,
        version: metadata?.version || stats.version,
        protocols: stats.protocols,
        metadata: metadata ? {
          generatedAt: metadata.generatedAt,
          description: metadata.description,
          llmProviders: metadata.llmProviders,
          models: metadata.models,
          mcpTools: metadata.mcpTools,
        } : null,
        features: ['capability_matching', 'collaboration_finder', 'health_check'],
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/wai/tools', async (_req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        totalTools: 530,
        mcpServer: { status: 'active', tools: 86 },
        categories: ['core', 'memory', 'multimodal', 'development', 'data', 'integration', 'ai', 'security', 'analytics', 'workflow'],
        protocols: ['MCP', 'OpenAPI', 'GraphQL'],
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/wai/providers', async (_req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        totalProviders: 23,
        healthyProviders: 17,
        providers: [
          { id: 'openai', name: 'OpenAI', status: 'healthy', models: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
          { id: 'anthropic', name: 'Anthropic', status: 'healthy', models: ['claude-3.5-sonnet', 'claude-3-opus'] },
          { id: 'google', name: 'Google Gemini', status: 'healthy', models: ['gemini-1.5-pro', 'gemini-flash'] },
          { id: 'mistral', name: 'Mistral', status: 'healthy', models: ['mistral-large', 'mistral-medium'] },
          { id: 'groq', name: 'Groq', status: 'healthy', models: ['llama-3.1-70b', 'mixtral-8x7b'] },
          { id: 'together', name: 'Together AI', status: 'healthy', models: ['llama-3-70b', 'mixtral-8x22b'] },
          { id: 'deepseek', name: 'DeepSeek', status: 'healthy', models: ['deepseek-coder', 'deepseek-chat'] },
          { id: 'kimi', name: 'KIMI K2', status: 'healthy', models: ['kimi-k2-instruct'] },
          { id: 'openrouter', name: 'OpenRouter', status: 'healthy', models: ['multiple'] },
          { id: 'elevenlabs', name: 'ElevenLabs', status: 'healthy', models: ['voice-synthesis'] },
        ],
        totalModels: 752,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/wai/capabilities', async (_req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        orchestration: {
          patterns: ['single_agent', 'sequential', 'parallel', 'dag', 'swarm', 'hierarchical'],
          algorithms: ['SIMPLE', 'ACONIC', 'ADaPT', 'HTA', 'SWARM'],
          collectiveIntelligence: ['brainstorm', 'consensus', 'vote', 'debate', 'synthesis'],
        },
        multimodal: {
          voice: ['tts', 'stt', 'streaming', 'voiceover'],
          video: ['generation', 'editing', 'assembly', 'effects'],
          image: ['generation', 'editing', 'analysis', 'optimization'],
          document: ['parsing', 'extraction', 'analysis', 'generation'],
        },
        memory: {
          types: ['short_term', 'long_term', 'episodic', 'semantic'],
          storage: ['mem0', 'pgvector', 'local'],
          tokenReduction: '90%',
        },
        security: {
          encryption: ['AES-256', 'RSA-2048', 'Quantum-Safe'],
          authentication: ['JWT', 'OAuth2', 'API Keys'],
          authorization: ['RBAC', 'ABAC', 'Policies'],
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// TEMPLATES ROUTES
// ============================================================================

router.get('/templates', async (_req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        totalTemplates: 50,
        categories: {
          workflow: ['sequential_pipeline', 'parallel_processing', 'dag_orchestration'],
          agent: ['specialist_agent', 'executive_agent', 'collaborative_team'],
          prompt: ['system_prompt', 'task_prompt', 'analysis_prompt'],
          project: ['web_app', 'mobile_app', 'api_service', 'ml_pipeline'],
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// SYSTEM METRICS ROUTES
// ============================================================================

router.get('/metrics', async (_req: Request, res: Response) => {
  try {
    const health = productionWiringService.getHealth();
    res.json({
      success: true,
      data: {
        system: health.metrics,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/health/detailed', async (_req: Request, res: Response) => {
  try {
    const health = productionWiringService.getHealth();
    res.json({
      success: true,
      data: health,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
