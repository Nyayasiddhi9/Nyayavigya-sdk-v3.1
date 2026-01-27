/**
 * WAI SDK v2.1 Integration Registry
 * 
 * Centralized registry for all 39 third-party integrations
 * Provides unified access to external services with:
 * - Standardized authentication
 * - Health monitoring
 * - Capability discovery
 * - Agent/LLM binding
 */

export interface IntegrationConfig {
  id: string;
  name: string;
  description: string;
  category: IntegrationCategory;
  provider: string;
  version: string;
  status: 'active' | 'degraded' | 'inactive' | 'maintenance';
  authType: 'api_key' | 'oauth2' | 'bearer' | 'basic' | 'none';
  capabilities: string[];
  supportedAgentTiers: ('executive' | 'development' | 'domain' | 'creative' | 'qa' | 'devops')[];
  requiredSecrets: string[];
  endpoints: Record<string, string>;
  healthCheck?: {
    endpoint: string;
    interval: number;
    timeout: number;
  };
  rateLimit?: {
    requests: number;
    window: number;
  };
  metadata: Record<string, unknown>;
}

export type IntegrationCategory = 
  | 'ai_ml'           // AI/ML services (OpenAI, Anthropic, etc.)
  | 'code_analysis'   // Code analysis tools (DeepCode, SonarQube)
  | 'version_control' // VCS integrations (GitHub, GitLab)
  | 'design'          // Design tools (Figma, Canva)
  | 'workflow'        // Workflow automation (LangChain, CrewAI)
  | 'memory'          // Memory systems (Mem0, Redis)
  | 'search'          // Search engines (SurfSense, Perplexity)
  | 'communication'   // Messaging (Slack, Discord)
  | 'analytics'       // Analytics (Qlib, Opik)
  | 'security'        // Security tools (Warp, TMUX)
  | 'terminal'        // Terminal tools (Warp Terminal)
  | 'ui_components'   // UI libraries (ReactBits, ShadCN)
  | 'orchestration'   // Orchestration (BMAD, MCP)
  | 'avatar'          // Avatar systems (ChatDollKit, Unity)
  | 'multimedia'      // Media generation (Fai.ai, Replicate)
  | 'enterprise';     // Enterprise tools (Toolhouse, OpenSWE)

export const INTEGRATION_REGISTRY: IntegrationConfig[] = [
  // AI/ML Integrations (10)
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4, GPT-5, DALL-E, Whisper AI models',
    category: 'ai_ml',
    provider: 'OpenAI',
    version: '4.0.0',
    status: 'active',
    authType: 'bearer',
    capabilities: ['text_generation', 'image_generation', 'embeddings', 'speech_to_text', 'text_to_speech'],
    supportedAgentTiers: ['executive', 'development', 'domain', 'creative', 'qa', 'devops'],
    requiredSecrets: ['OPENAI_API_KEY'],
    endpoints: { base: 'https://api.openai.com/v1' },
    healthCheck: { endpoint: '/models', interval: 60000, timeout: 5000 },
    rateLimit: { requests: 10000, window: 60000 },
    metadata: { models: ['gpt-4o', 'gpt-4-turbo', 'gpt-5', 'dall-e-3', 'whisper-1'] }
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    description: 'Claude 3.5, Claude 4 AI models with extended thinking',
    category: 'ai_ml',
    provider: 'Anthropic',
    version: '1.0.0',
    status: 'active',
    authType: 'bearer',
    capabilities: ['text_generation', 'code_generation', 'extended_thinking', 'vision'],
    supportedAgentTiers: ['executive', 'development', 'domain', 'creative', 'qa', 'devops'],
    requiredSecrets: ['ANTHROPIC_API_KEY'],
    endpoints: { base: 'https://api.anthropic.com/v1' },
    healthCheck: { endpoint: '/models', interval: 60000, timeout: 5000 },
    rateLimit: { requests: 4000, window: 60000 },
    metadata: { models: ['claude-3-5-sonnet', 'claude-3-opus', 'claude-4-sonnet'] }
  },
  {
    id: 'google_gemini',
    name: 'Google Gemini',
    description: 'Gemini Pro, Ultra, and Flash models',
    category: 'ai_ml',
    provider: 'Google',
    version: '1.0.0',
    status: 'active',
    authType: 'api_key',
    capabilities: ['text_generation', 'multimodal', 'code_generation', 'vision'],
    supportedAgentTiers: ['executive', 'development', 'domain', 'creative', 'qa', 'devops'],
    requiredSecrets: ['GEMINI_API_KEY'],
    endpoints: { base: 'https://generativelanguage.googleapis.com/v1' },
    healthCheck: { endpoint: '/models', interval: 60000, timeout: 5000 },
    metadata: { models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-ultra'] }
  },
  {
    id: 'kimi_k2',
    name: 'KIMI K2',
    description: 'Trillion parameter agentic AI with 384 experts',
    category: 'ai_ml',
    provider: 'Moonshot',
    version: '2.0.0',
    status: 'active',
    authType: 'bearer',
    capabilities: ['text_generation', 'agentic_reasoning', 'tool_use', '128k_context'],
    supportedAgentTiers: ['executive', 'development', 'domain'],
    requiredSecrets: ['MOONSHOT_API_KEY'],
    endpoints: { base: 'https://api.moonshot.cn/v1' },
    metadata: { parameters: '1T', activated: '32B', experts: 384 }
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'DeepSeek Coder and V3 models',
    category: 'ai_ml',
    provider: 'DeepSeek',
    version: '1.0.0',
    status: 'active',
    authType: 'bearer',
    capabilities: ['text_generation', 'code_generation', 'reasoning'],
    supportedAgentTiers: ['development', 'domain', 'qa'],
    requiredSecrets: ['DEEPSEEK_API_KEY'],
    endpoints: { base: 'https://api.deepseek.com/v1' },
    metadata: { models: ['deepseek-chat', 'deepseek-coder', 'deepseek-v3'] }
  },
  {
    id: 'groq',
    name: 'Groq',
    description: 'Ultra-fast LLM inference with LPU',
    category: 'ai_ml',
    provider: 'Groq',
    version: '1.0.0',
    status: 'active',
    authType: 'bearer',
    capabilities: ['text_generation', 'fast_inference'],
    supportedAgentTiers: ['development', 'domain', 'qa', 'devops'],
    requiredSecrets: ['GROQ_API_KEY'],
    endpoints: { base: 'https://api.groq.com/openai/v1' },
    metadata: { models: ['llama-3.3-70b', 'mixtral-8x7b'] }
  },
  {
    id: 'xai_grok',
    name: 'xAI Grok',
    description: 'Grok AI models from xAI',
    category: 'ai_ml',
    provider: 'xAI',
    version: '1.0.0',
    status: 'active',
    authType: 'bearer',
    capabilities: ['text_generation', 'real_time_knowledge'],
    supportedAgentTiers: ['executive', 'development', 'domain'],
    requiredSecrets: ['XAI_API_KEY'],
    endpoints: { base: 'https://api.x.ai/v1' },
    metadata: { models: ['grok-3', 'grok-3-mini'] }
  },
  {
    id: 'together_ai',
    name: 'Together AI',
    description: 'Open-source model hosting and inference',
    category: 'ai_ml',
    provider: 'Together',
    version: '1.0.0',
    status: 'active',
    authType: 'bearer',
    capabilities: ['text_generation', 'image_generation', 'embeddings'],
    supportedAgentTiers: ['development', 'domain', 'creative'],
    requiredSecrets: ['TOGETHER_API_KEY'],
    endpoints: { base: 'https://api.together.xyz/v1' },
    metadata: { models: ['llama-3.3-70b', 'qwen-2.5-72b', 'mixtral-8x22b'] }
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    description: 'AI-powered search with real-time information',
    category: 'search',
    provider: 'Perplexity',
    version: '1.0.0',
    status: 'active',
    authType: 'bearer',
    capabilities: ['search', 'real_time_info', 'citations'],
    supportedAgentTiers: ['executive', 'development', 'domain'],
    requiredSecrets: ['PERPLEXITY_API_KEY'],
    endpoints: { base: 'https://api.perplexity.ai' },
    metadata: { models: ['sonar', 'sonar-pro', 'sonar-reasoning'] }
  },
  {
    id: 'replicate',
    name: 'Replicate',
    description: 'Run open-source ML models in the cloud',
    category: 'ai_ml',
    provider: 'Replicate',
    version: '1.0.0',
    status: 'active',
    authType: 'bearer',
    capabilities: ['image_generation', 'video_generation', 'audio_generation'],
    supportedAgentTiers: ['creative', 'development'],
    requiredSecrets: ['REPLICATE_API_KEY'],
    endpoints: { base: 'https://api.replicate.com/v1' },
    metadata: { models: ['stable-diffusion-xl', 'flux-1.1-pro'] }
  },

  // Code Analysis Integrations (3)
  {
    id: 'deepcode',
    name: 'DeepCode',
    description: 'AI-powered code analysis and security scanning',
    category: 'code_analysis',
    provider: 'Snyk',
    version: '1.0.0',
    status: 'active',
    authType: 'api_key',
    capabilities: ['code_review', 'vulnerability_detection', 'performance_analysis'],
    supportedAgentTiers: ['development', 'qa', 'devops'],
    requiredSecrets: [],
    endpoints: { base: 'https://api.deepcode.ai' },
    metadata: { languages: ['typescript', 'python', 'java', 'go'] }
  },
  {
    id: 'open_swe',
    name: 'OpenSWE',
    description: 'Open-source software engineering automation',
    category: 'code_analysis',
    provider: 'OpenSWE',
    version: '1.0.0',
    status: 'active',
    authType: 'none',
    capabilities: ['code_generation', 'bug_fixing', 'refactoring'],
    supportedAgentTiers: ['development', 'qa'],
    requiredSecrets: [],
    endpoints: {},
    metadata: {}
  },
  {
    id: 'screencoder',
    name: 'ScreenCoder',
    description: 'Visual code generation from screenshots',
    category: 'code_analysis',
    provider: 'ScreenCoder',
    version: '1.0.0',
    status: 'active',
    authType: 'none',
    capabilities: ['ui_to_code', 'screenshot_analysis'],
    supportedAgentTiers: ['development', 'creative'],
    requiredSecrets: [],
    endpoints: {},
    metadata: {}
  },

  // Version Control Integrations (2)
  {
    id: 'github',
    name: 'GitHub',
    description: 'GitHub repository management and CI/CD',
    category: 'version_control',
    provider: 'GitHub',
    version: '1.0.0',
    status: 'active',
    authType: 'oauth2',
    capabilities: ['repo_management', 'pr_review', 'ci_cd', 'issues'],
    supportedAgentTiers: ['development', 'devops', 'qa'],
    requiredSecrets: ['GITHUB_TOKEN'],
    endpoints: { base: 'https://api.github.com' },
    healthCheck: { endpoint: '/rate_limit', interval: 60000, timeout: 5000 },
    metadata: {}
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    description: 'GitLab DevOps platform integration',
    category: 'version_control',
    provider: 'GitLab',
    version: '1.0.0',
    status: 'active',
    authType: 'bearer',
    capabilities: ['repo_management', 'ci_cd', 'security_scanning'],
    supportedAgentTiers: ['development', 'devops'],
    requiredSecrets: ['GITLAB_TOKEN'],
    endpoints: { base: 'https://gitlab.com/api/v4' },
    metadata: {}
  },

  // Design Integrations (3)
  {
    id: 'figma',
    name: 'Figma',
    description: 'Figma design platform integration',
    category: 'design',
    provider: 'Figma',
    version: '1.0.0',
    status: 'active',
    authType: 'bearer',
    capabilities: ['design_export', 'component_extraction', 'design_tokens'],
    supportedAgentTiers: ['creative', 'development'],
    requiredSecrets: ['FIGMA_TOKEN'],
    endpoints: { base: 'https://api.figma.com/v1' },
    metadata: {}
  },
  {
    id: 'canva',
    name: 'Claude Canva',
    description: 'Canva design integration with Claude AI',
    category: 'design',
    provider: 'Canva',
    version: '1.0.0',
    status: 'active',
    authType: 'oauth2',
    capabilities: ['design_generation', 'template_editing', 'asset_management'],
    supportedAgentTiers: ['creative'],
    requiredSecrets: [],
    endpoints: {},
    metadata: {}
  },
  {
    id: 'reactbits',
    name: 'ReactBits',
    description: 'React UI component library integration',
    category: 'ui_components',
    provider: 'ReactBits',
    version: '1.0.0',
    status: 'active',
    authType: 'none',
    capabilities: ['component_generation', 'ui_patterns', 'animations'],
    supportedAgentTiers: ['development', 'creative'],
    requiredSecrets: [],
    endpoints: {},
    metadata: { components: 50 }
  },

  // Workflow Integrations (5)
  {
    id: 'langchain',
    name: 'LangChain',
    description: 'LLM application framework',
    category: 'workflow',
    provider: 'LangChain',
    version: '0.3.0',
    status: 'active',
    authType: 'none',
    capabilities: ['chain_execution', 'agent_orchestration', 'rag'],
    supportedAgentTiers: ['executive', 'development', 'domain'],
    requiredSecrets: [],
    endpoints: {},
    metadata: {}
  },
  {
    id: 'crewai',
    name: 'CrewAI',
    description: 'Multi-agent orchestration framework',
    category: 'workflow',
    provider: 'CrewAI',
    version: '1.0.0',
    status: 'active',
    authType: 'none',
    capabilities: ['multi_agent', 'task_delegation', 'collaboration'],
    supportedAgentTiers: ['executive', 'development'],
    requiredSecrets: [],
    endpoints: {},
    metadata: {}
  },
  {
    id: 'bmad',
    name: 'BMAD',
    description: 'Business Model Alignment & Development methodology',
    category: 'orchestration',
    provider: 'WAI',
    version: '2.0.0',
    status: 'active',
    authType: 'none',
    capabilities: ['personality_modeling', 'behavioral_patterns', 'emotional_intelligence'],
    supportedAgentTiers: ['executive', 'development', 'domain', 'creative', 'qa', 'devops'],
    requiredSecrets: [],
    endpoints: {},
    metadata: {}
  },
  {
    id: 'flowmaker',
    name: 'FlowMaker',
    description: 'Visual workflow builder integration',
    category: 'workflow',
    provider: 'FlowMaker',
    version: '1.0.0',
    status: 'active',
    authType: 'none',
    capabilities: ['visual_workflows', 'automation', 'triggers'],
    supportedAgentTiers: ['development', 'devops'],
    requiredSecrets: [],
    endpoints: {},
    metadata: {}
  },
  {
    id: 'motia',
    name: 'Motia Backend',
    description: 'Backend automation and orchestration',
    category: 'workflow',
    provider: 'Motia',
    version: '1.0.0',
    status: 'active',
    authType: 'none',
    capabilities: ['backend_automation', 'api_orchestration'],
    supportedAgentTiers: ['development', 'devops'],
    requiredSecrets: [],
    endpoints: {},
    metadata: {}
  },

  // Memory Integrations (2)
  {
    id: 'mem0',
    name: 'Mem0',
    description: 'AI memory management system',
    category: 'memory',
    provider: 'Mem0',
    version: '1.0.0',
    status: 'active',
    authType: 'api_key',
    capabilities: ['memory_storage', 'context_retrieval', 'semantic_search'],
    supportedAgentTiers: ['executive', 'development', 'domain', 'creative', 'qa', 'devops'],
    requiredSecrets: [],
    endpoints: {},
    metadata: {}
  },
  {
    id: 'opik',
    name: 'Opik',
    description: 'AI observability and evaluation platform',
    category: 'analytics',
    provider: 'Comet',
    version: '1.0.0',
    status: 'active',
    authType: 'api_key',
    capabilities: ['tracing', 'evaluation', 'debugging'],
    supportedAgentTiers: ['development', 'qa'],
    requiredSecrets: [],
    endpoints: {},
    metadata: {}
  },

  // Terminal & Security Integrations (4)
  {
    id: 'warp_terminal',
    name: 'Warp Terminal',
    description: 'AI-powered terminal with command suggestions',
    category: 'terminal',
    provider: 'Warp',
    version: '1.0.0',
    status: 'active',
    authType: 'none',
    capabilities: ['terminal_ai', 'command_suggestions', 'workflow_automation'],
    supportedAgentTiers: ['development', 'devops'],
    requiredSecrets: [],
    endpoints: {},
    metadata: {}
  },
  {
    id: 'tmux_orchestration',
    name: 'TMUX Orchestrator',
    description: 'TMUX session management and orchestration',
    category: 'terminal',
    provider: 'WAI',
    version: '1.0.0',
    status: 'active',
    authType: 'none',
    capabilities: ['session_management', 'window_orchestration', 'pane_control'],
    supportedAgentTiers: ['devops'],
    requiredSecrets: [],
    endpoints: {},
    metadata: {}
  },
  {
    id: 'toolhouse',
    name: 'Toolhouse AI',
    description: 'AI tool ecosystem and management',
    category: 'enterprise',
    provider: 'Toolhouse',
    version: '1.0.0',
    status: 'active',
    authType: 'api_key',
    capabilities: ['tool_management', 'ai_tools', 'automation'],
    supportedAgentTiers: ['development', 'devops'],
    requiredSecrets: [],
    endpoints: {},
    metadata: {}
  },
  {
    id: 'goose_mcp',
    name: 'Goose MCP',
    description: 'Goose Model Context Protocol integration',
    category: 'orchestration',
    provider: 'Goose',
    version: '1.0.0',
    status: 'active',
    authType: 'none',
    capabilities: ['mcp_tools', 'context_injection'],
    supportedAgentTiers: ['development'],
    requiredSecrets: [],
    endpoints: {},
    metadata: {}
  },

  // Analytics Integrations (2)
  {
    id: 'qlib',
    name: 'Qlib',
    description: 'Quantitative investment platform',
    category: 'analytics',
    provider: 'Microsoft',
    version: '1.0.0',
    status: 'active',
    authType: 'none',
    capabilities: ['financial_analysis', 'trading_strategies', 'backtesting'],
    supportedAgentTiers: ['domain'],
    requiredSecrets: [],
    endpoints: {},
    metadata: {}
  },
  {
    id: 'surfsense',
    name: 'SurfSense',
    description: 'AI-powered web content analysis',
    category: 'search',
    provider: 'SurfSense',
    version: '1.0.0',
    status: 'active',
    authType: 'none',
    capabilities: ['web_scraping', 'content_analysis', 'trend_detection'],
    supportedAgentTiers: ['domain', 'creative'],
    requiredSecrets: [],
    endpoints: {},
    metadata: {}
  },

  // Avatar & Multimedia Integrations (4)
  {
    id: 'chatdollkit',
    name: 'ChatDollKit',
    description: '3D avatar animation and interaction',
    category: 'avatar',
    provider: 'ChatDollKit',
    version: '1.0.0',
    status: 'active',
    authType: 'none',
    capabilities: ['avatar_animation', 'lip_sync', 'gesture_control'],
    supportedAgentTiers: ['creative'],
    requiredSecrets: [],
    endpoints: {},
    metadata: {}
  },
  {
    id: 'unity_avatars',
    name: 'Unity Avatars',
    description: 'Unity 3D avatar system integration',
    category: 'avatar',
    provider: 'Unity',
    version: '1.0.0',
    status: 'active',
    authType: 'none',
    capabilities: ['3d_avatars', 'real_time_rendering', 'animation'],
    supportedAgentTiers: ['creative'],
    requiredSecrets: [],
    endpoints: {},
    metadata: {}
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    description: 'AI voice synthesis and cloning',
    category: 'multimedia',
    provider: 'ElevenLabs',
    version: '1.0.0',
    status: 'active',
    authType: 'bearer',
    capabilities: ['voice_synthesis', 'voice_cloning', 'multilingual'],
    supportedAgentTiers: ['creative'],
    requiredSecrets: ['ELEVENLABS_API_KEY'],
    endpoints: { base: 'https://api.elevenlabs.io/v1' },
    metadata: {}
  },
  {
    id: 'fai_ai',
    name: 'Fai.ai',
    description: 'AI video and multimedia generation',
    category: 'multimedia',
    provider: 'Fai.ai',
    version: '1.0.0',
    status: 'active',
    authType: 'api_key',
    capabilities: ['video_generation', 'image_generation', 'audio_generation'],
    supportedAgentTiers: ['creative'],
    requiredSecrets: [],
    endpoints: {},
    metadata: {}
  },

  // Enterprise Integrations (4)
  {
    id: 'deepagents',
    name: 'DeepAgents',
    description: 'Enterprise agent orchestration platform',
    category: 'enterprise',
    provider: 'DeepAgents',
    version: '1.0.0',
    status: 'active',
    authType: 'api_key',
    capabilities: ['agent_deployment', 'enterprise_scale', 'monitoring'],
    supportedAgentTiers: ['executive', 'development'],
    requiredSecrets: [],
    endpoints: {},
    metadata: {}
  },
  {
    id: 'evoagentx',
    name: 'EvoAgentX',
    description: 'Evolutionary agent optimization',
    category: 'enterprise',
    provider: 'EvoAgentX',
    version: '0.1.0',
    status: 'active',
    authType: 'none',
    capabilities: ['agent_evolution', 'genetic_optimization', 'self_improvement'],
    supportedAgentTiers: ['executive', 'development'],
    requiredSecrets: [],
    endpoints: {},
    metadata: {}
  },
  {
    id: 'magic',
    name: 'Magic',
    description: 'Magic AI code generation',
    category: 'enterprise',
    provider: 'Magic',
    version: '1.0.0',
    status: 'active',
    authType: 'api_key',
    capabilities: ['code_generation', 'code_understanding'],
    supportedAgentTiers: ['development'],
    requiredSecrets: [],
    endpoints: {},
    metadata: {}
  },
  {
    id: 'serena',
    name: 'Serena',
    description: 'AI conversation and dialogue management',
    category: 'enterprise',
    provider: 'Serena',
    version: '1.0.0',
    status: 'active',
    authType: 'none',
    capabilities: ['conversation_management', 'dialogue_flows'],
    supportedAgentTiers: ['creative', 'domain'],
    requiredSecrets: [],
    endpoints: {},
    metadata: {}
  },

  // Additional Integrations (3)
  {
    id: 'xpander',
    name: 'Xpander.ai',
    description: 'AI agent expansion and scaling',
    category: 'enterprise',
    provider: 'Xpander',
    version: '1.0.0',
    status: 'active',
    authType: 'api_key',
    capabilities: ['agent_scaling', 'load_balancing', 'distributed_execution'],
    supportedAgentTiers: ['executive', 'development', 'devops'],
    requiredSecrets: [],
    endpoints: {},
    metadata: {}
  },
  {
    id: 'crush',
    name: 'Crush',
    description: 'Data compression and optimization',
    category: 'analytics',
    provider: 'Crush',
    version: '1.0.0',
    status: 'active',
    authType: 'none',
    capabilities: ['data_compression', 'optimization', 'storage_efficiency'],
    supportedAgentTiers: ['devops'],
    requiredSecrets: [],
    endpoints: {},
    metadata: {}
  },
  {
    id: 'sarvam',
    name: 'Sarvam AI',
    description: 'Indian language AI services (22 languages)',
    category: 'ai_ml',
    provider: 'Sarvam',
    version: '1.0.0',
    status: 'active',
    authType: 'bearer',
    capabilities: ['translation', 'speech_to_text', 'text_to_speech', 'transliteration'],
    supportedAgentTiers: ['domain', 'creative'],
    requiredSecrets: ['SARVAM_API_KEY'],
    endpoints: { base: 'https://api.sarvam.ai' },
    metadata: { languages: 22 }
  }
];

export class IntegrationRegistry {
  private integrations: Map<string, IntegrationConfig> = new Map();
  private healthStatus: Map<string, { healthy: boolean; lastCheck: Date; latency?: number }> = new Map();

  constructor() {
    INTEGRATION_REGISTRY.forEach(integration => {
      this.integrations.set(integration.id, integration);
    });
  }

  get(id: string): IntegrationConfig | undefined {
    return this.integrations.get(id);
  }

  getAll(): IntegrationConfig[] {
    return Array.from(this.integrations.values());
  }

  getByCategory(category: IntegrationCategory): IntegrationConfig[] {
    return this.getAll().filter(i => i.category === category);
  }

  getByAgentTier(tier: string): IntegrationConfig[] {
    return this.getAll().filter(i => 
      i.supportedAgentTiers.includes(tier as any)
    );
  }

  getActive(): IntegrationConfig[] {
    return this.getAll().filter(i => i.status === 'active');
  }

  getStats(): {
    total: number;
    active: number;
    byCategory: Record<string, number>;
    byAuthType: Record<string, number>;
  } {
    const all = this.getAll();
    return {
      total: all.length,
      active: all.filter(i => i.status === 'active').length,
      byCategory: all.reduce((acc, i) => {
        acc[i.category] = (acc[i.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byAuthType: all.reduce((acc, i) => {
        acc[i.authType] = (acc[i.authType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  updateHealth(id: string, healthy: boolean, latency?: number): void {
    this.healthStatus.set(id, {
      healthy,
      lastCheck: new Date(),
      latency
    });
  }

  getHealth(id: string): { healthy: boolean; lastCheck: Date; latency?: number } | undefined {
    return this.healthStatus.get(id);
  }
}

export const integrationRegistry = new IntegrationRegistry();
