/**
 * WAI SDK v2.1 Integrations Package
 * 
 * Centralized integration management for 39 third-party services:
 * - 10 AI/ML providers (OpenAI, Anthropic, Google, etc.)
 * - 3 Code analysis tools (DeepCode, OpenSWE, ScreenCoder)
 * - 2 Version control systems (GitHub, GitLab)
 * - 3 Design tools (Figma, Canva, ReactBits)
 * - 5 Workflow frameworks (LangChain, CrewAI, BMAD, etc.)
 * - 2 Memory systems (Mem0, Opik)
 * - 4 Terminal/Security tools (Warp, TMUX, Toolhouse, Goose)
 * - 2 Analytics platforms (Qlib, SurfSense)
 * - 4 Avatar/Multimedia (ChatDollKit, Unity, ElevenLabs, Fai.ai)
 * - 4 Enterprise tools (DeepAgents, EvoAgentX, Magic, Serena)
 */

export { 
  IntegrationRegistry, 
  integrationRegistry,
  INTEGRATION_REGISTRY,
  type IntegrationConfig,
  type IntegrationCategory
} from './integration-registry';

export {
  IntegrationManager,
  integrationManager,
  type IntegrationBinding,
  type IntegrationExecutionContext,
  type IntegrationResult
} from './integration-manager';

export const integrationsPackageInfo = {
  name: 'wai-sdk-integrations',
  version: '2.1.0',
  totalIntegrations: 39,
  categories: [
    'ai_ml',
    'code_analysis',
    'version_control',
    'design',
    'workflow',
    'memory',
    'search',
    'communication',
    'analytics',
    'security',
    'terminal',
    'ui_components',
    'orchestration',
    'avatar',
    'multimedia',
    'enterprise'
  ]
};
