import { Router, Request, Response } from 'express';
import { waiAdminService } from '../services/wai-admin-service';
import { domainVerticalAgentRegistry } from '../services/domain-vertical-agents';
import { z } from 'zod';
import { 
  WAIUniversalSystemPrompt, 
  waiUniversalPromptService,
  createExecutiveTierPrompt,
  createDevelopmentTierPrompt,
  createCreativeTierPrompt,
  createDefaultROMAConfig,
  createDefaultGuardrails,
  createDefaultContextEngineering,
  createDefaultLLMIntelligence,
  createDefaultBehavioralIntelligence,
  createDefaultMultimodal,
  createDefaultMultiLanguage,
  createDefaultSelfLearning,
  createDefaultCostOptimization,
  type WAIUniversalPromptConfig
} from '../services/wai-universal-system-prompt';
import { agenticGroupsService } from '../services/agentic-groups-service';
import { llmModelRegistry } from '../services/llm-model-registry';
import { enhancedAgentConfigService } from '../services/enhanced-agent-config-service';

const router = Router();

const AgentConfigUpdateSchema = z.object({
  systemPrompt: z.string().optional(),
  communicationMode: z.enum(['standard', 'verbose', 'minimal', 'technical']).optional(),
  collaborationMode: z.enum(['autonomous', 'swarm', 'hybrid', 'supervised']).optional(),
  enabled: z.boolean().optional(),
  assignedTools: z.array(z.string()).optional(),
  behaviors: z.record(z.any()).optional(),
  workflows: z.array(z.any()).optional(),
  preferredProvider: z.string().optional(),
  preferredModel: z.string().optional(),
  maxTokens: z.number().optional(),
  temperature: z.number().min(0).max(2).optional()
});

const ProviderConfigUpdateSchema = z.object({
  enabled: z.boolean().optional(),
  defaultModel: z.string().optional(),
  globalRateLimitPerMinute: z.number().optional(),
  fallbackPriority: z.number().min(1).max(100).optional(),
  monthlyBudget: z.number().optional()
});

const ToolConfigUpdateSchema = z.object({
  enabled: z.boolean().optional(),
  rateLimitPerMinute: z.number().optional(),
  rateLimitPerHour: z.number().optional(),
  rateLimitPerDay: z.number().optional(),
  accessLevel: z.enum(['public', 'standard', 'restricted', 'admin']).optional()
});

const CustomAgentSchema = z.object({
  agentId: z.string().min(3).max(100),
  agentName: z.string().min(2).max(200),
  tier: z.enum(['executive', 'development', 'creative', 'qa', 'devops', 'domain']),
  romaLevel: z.enum(['L1', 'L2', 'L3', 'L4']),
  systemPrompt: z.string().min(10),
  communicationMode: z.enum(['standard', 'verbose', 'minimal', 'technical']).default('standard'),
  collaborationMode: z.enum(['autonomous', 'swarm', 'hybrid', 'supervised']).default('autonomous'),
  assignedTools: z.array(z.string()).default([]),
  behaviors: z.record(z.any()).default({}),
  personality: z.record(z.any()).default({}),
  workflows: z.array(z.any()).default([]),
  triggers: z.array(z.any()).default([]),
  canCollaborateWith: z.array(z.string()).default([]),
  preferredProvider: z.string().optional(),
  preferredModel: z.string().optional(),
  maxTokens: z.number().default(4096),
  temperature: z.number().min(0).max(2).default(0.7),
  description: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).default([])
});

router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const summary = await waiAdminService.getDashboardSummary();
    res.json({
      success: true,
      data: summary
    });
  } catch (error: any) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/agents', async (req: Request, res: Response) => {
  try {
    const agents = await waiAdminService.getAllAgents();
    res.json({
      success: true,
      data: agents,
      count: agents.length
    });
  } catch (error: any) {
    console.error('Get agents error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/agents/:agentId', async (req: Request, res: Response) => {
  try {
    const config = await waiAdminService.getAgentConfig(req.params.agentId);
    res.json({
      success: true,
      data: config
    });
  } catch (error: any) {
    console.error('Get agent config error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.patch('/agents/:agentId', async (req: Request, res: Response) => {
  try {
    const update = AgentConfigUpdateSchema.parse(req.body);
    const userId = (req as any).user?.id || 'system';
    const updated = await waiAdminService.updateAgentConfig(req.params.agentId, update, userId);
    res.json({
      success: true,
      data: updated
    });
  } catch (error: any) {
    console.error('Update agent config error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/agents/custom', async (req: Request, res: Response) => {
  try {
    const agentData = CustomAgentSchema.parse(req.body);
    const userId = (req as any).user?.id || 'system';
    const created = await waiAdminService.createCustomAgent(agentData, userId);
    res.status(201).json({
      success: true,
      data: created
    });
  } catch (error: any) {
    console.error('Create custom agent error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/providers', async (req: Request, res: Response) => {
  try {
    const providers = await waiAdminService.getAllProviders();
    res.json({
      success: true,
      data: providers,
      count: providers.length
    });
  } catch (error: any) {
    console.error('Get providers error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.patch('/providers/:providerId', async (req: Request, res: Response) => {
  try {
    const update = ProviderConfigUpdateSchema.parse(req.body);
    const userId = (req as any).user?.id || 'system';
    const updated = await waiAdminService.updateProviderConfig(req.params.providerId, update, userId);
    res.json({
      success: true,
      data: updated
    });
  } catch (error: any) {
    console.error('Update provider config error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/tools', async (req: Request, res: Response) => {
  try {
    const tools = await waiAdminService.getAllMcpTools();
    res.json({
      success: true,
      data: tools,
      count: tools.length
    });
  } catch (error: any) {
    console.error('Get tools error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.patch('/tools/:toolId', async (req: Request, res: Response) => {
  try {
    const update = ToolConfigUpdateSchema.parse(req.body);
    const userId = (req as any).user?.id || 'system';
    const updated = await waiAdminService.updateMcpToolConfig(req.params.toolId, update, userId);
    res.json({
      success: true,
      data: updated
    });
  } catch (error: any) {
    console.error('Update tool config error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/analytics/tokens', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, providerId, modelId, agentId, groupBy } = req.query;
    
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();
    
    const analytics = await waiAdminService.getTokenUsageAnalytics({
      startDate: start,
      endDate: end,
      providerId: providerId as string,
      modelId: modelId as string,
      agentId: agentId as string,
      groupBy: groupBy as 'provider' | 'model' | 'agent' | 'day'
    });
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error: any) {
    console.error('Get token analytics error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/audit-logs', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    const logs = await waiAdminService.getAuditLogs(limit, offset);
    res.json({
      success: true,
      data: logs,
      count: logs.length
    });
  } catch (error: any) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/system-prompts/templates', async (req: Request, res: Response) => {
  try {
    const templates = [
      {
        id: 'coding-assistant',
        name: 'Coding Assistant',
        category: 'development',
        template: `You are an expert software development assistant with deep knowledge of modern programming languages, frameworks, and best practices.

## Core Competencies
- Code generation, review, and optimization
- Debugging and problem-solving
- Architecture design and patterns
- Test-driven development

## Communication Style
- Be precise and technical
- Provide code examples
- Explain reasoning behind suggestions
- Follow best practices

## Guidelines
- Write clean, maintainable code
- Consider performance implications
- Suggest appropriate design patterns
- Include error handling`
      },
      {
        id: 'creative-writer',
        name: 'Creative Writer',
        category: 'creative',
        template: `You are a creative content specialist with expertise in crafting compelling narratives, marketing copy, and engaging content.

## Core Competencies
- Storytelling and narrative design
- Marketing and advertising copy
- Content strategy
- Brand voice development

## Communication Style
- Adapt tone to audience
- Use vivid, engaging language
- Balance creativity with clarity
- Consider emotional impact

## Guidelines
- Understand the target audience
- Maintain brand consistency
- Create memorable content
- Optimize for engagement`
      },
      {
        id: 'data-analyst',
        name: 'Data Analyst',
        category: 'domain',
        template: `You are a data analysis expert specializing in extracting insights from complex datasets and communicating findings effectively.

## Core Competencies
- Statistical analysis and modeling
- Data visualization
- Pattern recognition
- Business intelligence

## Communication Style
- Present data-driven insights
- Use clear visualizations
- Quantify findings
- Make actionable recommendations

## Guidelines
- Validate data quality
- Consider statistical significance
- Explain methodology
- Highlight key insights`
      },
      {
        id: 'qa-engineer',
        name: 'QA Engineer',
        category: 'qa',
        template: `You are a quality assurance specialist focused on ensuring software reliability, performance, and user experience.

## Core Competencies
- Test strategy and planning
- Automated testing
- Performance testing
- Security testing

## Communication Style
- Be thorough and methodical
- Document findings clearly
- Prioritize by severity
- Suggest fixes when possible

## Guidelines
- Cover edge cases
- Test across environments
- Consider user scenarios
- Track regression issues`
      },
      {
        id: 'devops-engineer',
        name: 'DevOps Engineer',
        category: 'devops',
        template: `You are a DevOps expert specializing in CI/CD, infrastructure automation, and site reliability engineering.

## Core Competencies
- Infrastructure as Code
- Container orchestration
- Monitoring and observability
- Security and compliance

## Communication Style
- Focus on reliability
- Document procedures
- Consider scalability
- Emphasize automation

## Guidelines
- Follow security best practices
- Implement proper monitoring
- Design for failure
- Automate repetitive tasks`
      }
    ];
    
    res.json({
      success: true,
      data: templates
    });
  } catch (error: any) {
    console.error('Get system prompt templates error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Platform Settings Routes
router.get('/settings', async (req: Request, res: Response) => {
  try {
    const settings = await waiAdminService.getAllSettings();
    res.json({ success: true, data: settings });
  } catch (error: any) {
    console.error('Get settings error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/settings/category/:category', async (req: Request, res: Response) => {
  try {
    const settings = await waiAdminService.getSettingsByCategory(req.params.category);
    res.json({ success: true, data: settings });
  } catch (error: any) {
    console.error('Get settings by category error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.patch('/settings/:settingKey', async (req: Request, res: Response) => {
  try {
    const { value } = req.body;
    const userId = (req as any).user?.id || 'system';
    const updated = await waiAdminService.updateSetting(req.params.settingKey, value, userId);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Update setting error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/settings/bulk', async (req: Request, res: Response) => {
  try {
    const { settings } = req.body;
    const userId = (req as any).user?.id || 'system';
    const updated = await waiAdminService.bulkUpdateSettings(settings, userId);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Bulk update settings error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// API Gateway - Client Management Routes
router.get('/api-gateway/clients', async (req: Request, res: Response) => {
  try {
    const clients = await waiAdminService.getAllApiClients();
    res.json({ success: true, data: clients, count: clients.length });
  } catch (error: any) {
    console.error('Get API clients error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const CreateApiClientSchema = z.object({
  clientName: z.string().min(2).max(200),
  clientDescription: z.string().optional(),
  clientType: z.enum(['application', 'service', 'integration', 'testing']).default('application'),
  environment: z.enum(['development', 'staging', 'production']).default('development'),
  allowedEndpoints: z.array(z.string()).default(['*']),
  allowedAgents: z.array(z.string()).default(['*']),
  allowedProviders: z.array(z.string()).default(['*']),
  allowedTools: z.array(z.string()).default(['*']),
  scopes: z.array(z.string()).default(['read', 'execute']),
  rateLimitPerMinute: z.number().default(60),
  rateLimitPerHour: z.number().default(1000),
  rateLimitPerDay: z.number().default(10000),
  monthlyQuota: z.number().default(100000),
  webhookUrl: z.string().url().optional(),
  ipWhitelist: z.array(z.string()).default([])
});

router.post('/api-gateway/clients', async (req: Request, res: Response) => {
  try {
    const data = CreateApiClientSchema.parse(req.body);
    const userId = (req as any).user?.id || 'system';
    const client = await waiAdminService.createApiClient(data, userId);
    res.status(201).json({ success: true, data: client });
  } catch (error: any) {
    console.error('Create API client error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.patch('/api-gateway/clients/:clientId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'system';
    const updated = await waiAdminService.updateApiClient(req.params.clientId, req.body, userId);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Update API client error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/api-gateway/clients/:clientId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'system';
    await waiAdminService.deleteApiClient(req.params.clientId, userId);
    res.json({ success: true, message: 'API client deleted' });
  } catch (error: any) {
    console.error('Delete API client error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// API Key Management Routes
router.post('/api-gateway/clients/:clientId/keys', async (req: Request, res: Response) => {
  try {
    const { keyName, expiresInDays } = req.body;
    const userId = (req as any).user?.id || 'system';
    const apiKey = await waiAdminService.generateApiKey(req.params.clientId, keyName, expiresInDays, userId);
    res.status(201).json({ success: true, data: apiKey });
  } catch (error: any) {
    console.error('Generate API key error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/api-gateway/keys/:keyId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'system';
    await waiAdminService.revokeApiKey(req.params.keyId, userId);
    res.json({ success: true, message: 'API key revoked' });
  } catch (error: any) {
    console.error('Revoke API key error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api-gateway/usage', async (req: Request, res: Response) => {
  try {
    const { clientId, days } = req.query;
    const stats = await waiAdminService.getApiUsageStats(
      clientId as string | undefined,
      days ? parseInt(days as string) : 30
    );
    res.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('Get API usage error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API Documentation Routes
router.get('/documentation', async (req: Request, res: Response) => {
  try {
    const documentation = waiAdminService.getApiDocumentation();
    res.json({ success: true, data: documentation });
  } catch (error: any) {
    console.error('Get API documentation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Guides Routes
router.get('/guides', async (req: Request, res: Response) => {
  try {
    const guides = waiAdminService.getGuides();
    res.json({ success: true, data: guides });
  } catch (error: any) {
    console.error('Get guides error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/guides/:guideId/download', async (req: Request, res: Response) => {
  try {
    const content = waiAdminService.generateGuideContent(req.params.guideId);
    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.guideId}.md"`);
    res.send(content);
  } catch (error: any) {
    console.error('Download guide error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// DOMAIN VERTICAL AGENTS ROUTES
// Finance, Education, Marketing verticals with Domain Head orchestrators
// ============================================================================

router.get('/domain-agents', async (req: Request, res: Response) => {
  try {
    await domainVerticalAgentRegistry.initialize();
    const agents = domainVerticalAgentRegistry.getAllAgents();
    const statistics = domainVerticalAgentRegistry.getStatistics();
    res.json({
      success: true,
      data: agents,
      statistics,
      count: agents.length
    });
  } catch (error: any) {
    console.error('Get domain agents error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/domain-agents/heads', async (req: Request, res: Response) => {
  try {
    await domainVerticalAgentRegistry.initialize();
    const heads = domainVerticalAgentRegistry.getDomainHeads();
    res.json({
      success: true,
      data: heads,
      count: heads.length,
      description: 'Domain Head Agents (L4 Executive) - CFO, Chief Education Officer, CMO'
    });
  } catch (error: any) {
    console.error('Get domain heads error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/domain-agents/vertical/:vertical', async (req: Request, res: Response) => {
  try {
    const vertical = req.params.vertical as 'financial' | 'education' | 'marketing';
    if (!['financial', 'education', 'marketing'].includes(vertical)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid vertical. Must be one of: financial, education, marketing'
      });
    }
    await domainVerticalAgentRegistry.initialize();
    const agents = domainVerticalAgentRegistry.getAgentsByVertical(vertical);
    res.json({
      success: true,
      data: agents,
      vertical,
      count: agents.length
    });
  } catch (error: any) {
    console.error('Get vertical agents error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/domain-agents/roma-level/:level', async (req: Request, res: Response) => {
  try {
    const level = req.params.level as 'L1' | 'L2' | 'L3' | 'L4';
    if (!['L1', 'L2', 'L3', 'L4'].includes(level)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ROMA level. Must be one of: L1, L2, L3, L4'
      });
    }
    await domainVerticalAgentRegistry.initialize();
    const agents = domainVerticalAgentRegistry.getAgentsByRomaLevel(level);
    res.json({
      success: true,
      data: agents,
      romaLevel: level,
      count: agents.length
    });
  } catch (error: any) {
    console.error('Get agents by ROMA level error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/domain-agents/:agentId', async (req: Request, res: Response) => {
  try {
    await domainVerticalAgentRegistry.initialize();
    const agent = domainVerticalAgentRegistry.getAgent(req.params.agentId);
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: `Domain agent not found: ${req.params.agentId}`
      });
    }
    res.json({
      success: true,
      data: agent
    });
  } catch (error: any) {
    console.error('Get domain agent error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/domain-agents/statistics/summary', async (req: Request, res: Response) => {
  try {
    await domainVerticalAgentRegistry.initialize();
    const statistics = domainVerticalAgentRegistry.getStatistics();
    res.json({
      success: true,
      data: {
        ...statistics,
        verticals: {
          financial: {
            description: 'Complete financial operations with CFO Domain Head',
            capabilities: ['FP&A', 'Treasury', 'Tax', 'Audit', 'AR/AP', 'Risk', 'Payments', 'Subscriptions', 'Compliance', 'Investment', 'Controller', 'Cost Accounting']
          },
          education: {
            description: 'Complete education management with Chief Education Officer Domain Head',
            capabilities: ['Curriculum', 'Instructional Design', 'Course Creation', 'Tutoring', 'Mentorship', 'Assessment', 'Student Success', 'Content Creation', 'Research', 'Faculty', 'LMS', 'Analytics']
          },
          marketing: {
            description: 'Complete marketing operations with CMO Domain Head',
            capabilities: ['SEO', 'GEO', 'Content Strategy', 'Social Media', 'Performance Marketing', 'Email', 'Copywriting', 'Creative Direction', 'Video', 'Influencer', 'PR', 'Brand', 'Analytics', 'Growth', 'Web']
          }
        },
        standards: ['ROMA L1-L4', 'A2A Collaboration', 'BMAD Methodology', 'Parlant Prompt Engineering']
      }
    });
  } catch (error: any) {
    console.error('Get domain statistics error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// SYSTEM PROMPT MANAGEMENT ROUTES
// ============================================================================

const SystemPromptConfigSchema = z.object({
  identity: z.object({
    id: z.string(),
    name: z.string(),
    codeName: z.string().optional(),
    tier: z.enum(['executive', 'development', 'creative', 'qa', 'devops', 'domain']),
    vertical: z.string().optional(),
    sector: z.string().optional(),
    romaLevel: z.enum(['L1', 'L2', 'L3', 'L4']),
    version: z.string().default('2.0.0'),
    status: z.enum(['active', 'ready', 'idle', 'busy', 'error']).default('active'),
    description: z.string(),
    specialization: z.array(z.string())
  }),
  customInstructions: z.string().optional()
}).passthrough();

router.get('/system-prompts/template', async (req: Request, res: Response) => {
  try {
    const templateStructure = {
      sections: [
        'identity', 'core_instructions', 'agent_loop', 'task_management',
        'context_engineering', 'roma_standards', 'a2a_protocol', 'hierarchy',
        'mcp_tools', 'guardrails', 'llm_intelligence', 'multimodal_capabilities',
        'multi_language', 'self_learning', 'cost_optimization', 'communication',
        'quality_standards', 'custom_instructions', 'summary'
      ],
      capabilities: [
        'Autonomous Execution', 'Self-Learning Intelligence', 'Collaborative Multi-Agent',
        'Swarm Coordination', 'Context Engineering', 'Hierarchy Awareness',
        'Behavioral Intelligence', 'Process Orientation', 'Guardrail Compliance',
        'Capability Awareness', 'Parallel Execution', 'LLM Intelligence',
        'Multimodal Processing', 'Multi-Language Support', 'Cost Optimization'
      ],
      romaLevels: {
        L1: 'Execute with explicit approval',
        L2: 'Execute routine tasks autonomously',
        L3: 'Execute most tasks autonomously within boundaries',
        L4: 'Full autonomous decision-making with strategic oversight'
      },
      tiers: ['executive', 'development', 'creative', 'qa', 'devops', 'domain'],
      defaults: {
        romaStandards: createDefaultROMAConfig('L2'),
        guardrails: createDefaultGuardrails(),
        contextEngineering: createDefaultContextEngineering(),
        llmIntelligence: createDefaultLLMIntelligence(),
        behavioralIntelligence: createDefaultBehavioralIntelligence(),
        multimodal: createDefaultMultimodal(),
        multiLanguage: createDefaultMultiLanguage(),
        selfLearning: createDefaultSelfLearning(),
        costOptimization: createDefaultCostOptimization()
      }
    };
    
    res.json({
      success: true,
      data: templateStructure
    });
  } catch (error: any) {
    console.error('Get system prompt template error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/system-prompts/generate', async (req: Request, res: Response) => {
  try {
    const config = SystemPromptConfigSchema.parse(req.body);
    const prompt = waiUniversalPromptService.generatePromptForAgent(
      config.identity.id,
      config as Partial<WAIUniversalPromptConfig>
    );
    
    res.json({
      success: true,
      data: {
        agentId: config.identity.id,
        agentName: config.identity.name,
        tier: config.identity.tier,
        romaLevel: config.identity.romaLevel,
        promptLength: prompt.length,
        tokenEstimate: Math.ceil(prompt.length / 4),
        generatedPrompt: prompt
      }
    });
  } catch (error: any) {
    console.error('Generate system prompt error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/system-prompts/generate-by-tier', async (req: Request, res: Response) => {
  try {
    const { tier, params } = req.body;
    let config: WAIUniversalPromptConfig;
    
    switch (tier) {
      case 'executive':
        config = createExecutiveTierPrompt({
          id: params.id || 'custom-executive',
          name: params.name || 'Custom Executive Agent',
          sector: params.sector || 'general',
          description: params.description || 'Executive-tier agent with strategic capabilities.',
          specializations: params.specializations || ['Strategic Planning', 'Leadership'],
          tools: params.tools || [],
          directReports: params.directReports || []
        });
        break;
      case 'development':
        config = createDevelopmentTierPrompt({
          id: params.id || 'custom-developer',
          name: params.name || 'Custom Development Agent',
          romaLevel: params.romaLevel || 'L3',
          description: params.description || 'Development-tier agent with coding capabilities.',
          specializations: params.specializations || ['Full-Stack Development'],
          tools: params.tools || [],
          reportsTo: params.reportsTo
        });
        break;
      case 'creative':
        config = createCreativeTierPrompt({
          id: params.id || 'custom-creative',
          name: params.name || 'Custom Creative Agent',
          romaLevel: params.romaLevel || 'L3',
          description: params.description || 'Creative-tier agent with content capabilities.',
          specializations: params.specializations || ['Content Creation'],
          tools: params.tools || [],
          reportsTo: params.reportsTo
        });
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Unsupported tier. Use: executive, development, creative'
        });
    }
    
    const generator = new WAIUniversalSystemPrompt(config);
    const prompt = generator.generate();
    
    res.json({
      success: true,
      data: {
        tier,
        config,
        promptLength: prompt.length,
        tokenEstimate: Math.ceil(prompt.length / 4),
        generatedPrompt: prompt
      }
    });
  } catch (error: any) {
    console.error('Generate prompt by tier error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/system-prompts/validate', async (req: Request, res: Response) => {
  try {
    const config = req.body as WAIUniversalPromptConfig;
    const validation = waiUniversalPromptService.validateConfig(config);
    
    res.json({
      success: true,
      data: validation
    });
  } catch (error: any) {
    console.error('Validate system prompt error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/system-prompts/defaults/:section', async (req: Request, res: Response) => {
  try {
    const { section } = req.params;
    const romaLevel = (req.query.romaLevel as string) || 'L2';
    
    const defaults: Record<string, any> = {
      romaStandards: createDefaultROMAConfig(romaLevel as 'L1' | 'L2' | 'L3' | 'L4'),
      guardrails: createDefaultGuardrails(),
      contextEngineering: createDefaultContextEngineering(),
      llmIntelligence: createDefaultLLMIntelligence(),
      behavioralIntelligence: createDefaultBehavioralIntelligence(),
      multimodal: createDefaultMultimodal(),
      multiLanguage: createDefaultMultiLanguage(),
      selfLearning: createDefaultSelfLearning(),
      costOptimization: createDefaultCostOptimization()
    };
    
    if (!defaults[section]) {
      return res.status(404).json({
        success: false,
        error: `Unknown section: ${section}. Available: ${Object.keys(defaults).join(', ')}`
      });
    }
    
    res.json({
      success: true,
      data: defaults[section]
    });
  } catch (error: any) {
    console.error('Get defaults error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// AGENTIC GROUPS & COMPANY OF AGENTS ROUTES
// ============================================================================

router.get('/agentic-groups/sectors', async (req: Request, res: Response) => {
  try {
    const sectors = agenticGroupsService.getAllSectorGroups();
    res.json({
      success: true,
      count: sectors.length,
      data: sectors
    });
  } catch (error: any) {
    console.error('Get sectors error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/agentic-groups/sectors/:sectorId', async (req: Request, res: Response) => {
  try {
    const sector = agenticGroupsService.getSectorGroup(req.params.sectorId);
    if (!sector) {
      return res.status(404).json({
        success: false,
        error: `Sector not found: ${req.params.sectorId}`
      });
    }
    res.json({
      success: true,
      data: sector
    });
  } catch (error: any) {
    console.error('Get sector error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/agentic-groups/sectors/:sectorId/agents', async (req: Request, res: Response) => {
  try {
    const sector = agenticGroupsService.getSectorGroup(req.params.sectorId);
    if (!sector) {
      return res.status(404).json({
        success: false,
        error: `Sector not found: ${req.params.sectorId}`
      });
    }
    const agents = [sector.headAgent, ...sector.specialistAgents, ...sector.supportAgents];
    res.json({
      success: true,
      count: agents.length,
      data: agents
    });
  } catch (error: any) {
    console.error('Get sector agents error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/agentic-groups/stats', async (req: Request, res: Response) => {
  try {
    const stats = agenticGroupsService.getSectorStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Get agentic groups stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const CompanyOfAgentsSchema = z.object({
  name: z.string().min(3),
  description: z.string(),
  coordinationMode: z.enum(['centralized', 'distributed', 'hybrid']).default('hybrid'),
  sectorIds: z.array(z.string()).optional(),
  standaloneAgentIds: z.array(z.string()).optional(),
  customAgentConfigs: z.array(z.any()).optional(),
  memorySharing: z.enum(['full', 'selective', 'none']).default('selective'),
  a2aEnabled: z.boolean().default(true),
  primaryObjective: z.string().optional(),
  constraints: z.array(z.string()).optional()
});

router.post('/agentic-groups/companies', async (req: Request, res: Response) => {
  try {
    const companyData = CompanyOfAgentsSchema.parse(req.body);
    const company = agenticGroupsService.createCompanyOfAgents(companyData);
    
    res.status(201).json({
      success: true,
      data: company
    });
  } catch (error: any) {
    console.error('Create company of agents error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/agentic-groups/companies', async (req: Request, res: Response) => {
  try {
    const companies = agenticGroupsService.getAllCompanies();
    res.json({
      success: true,
      count: companies.length,
      data: companies
    });
  } catch (error: any) {
    console.error('Get companies error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/agentic-groups/companies/:companyId', async (req: Request, res: Response) => {
  try {
    const company = agenticGroupsService.getCompany(req.params.companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        error: `Company not found: ${req.params.companyId}`
      });
    }
    res.json({
      success: true,
      data: company
    });
  } catch (error: any) {
    console.error('Get company error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/agentic-groups/companies/:companyId', async (req: Request, res: Response) => {
  try {
    const company = agenticGroupsService.getCompany(req.params.companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        error: `Company not found: ${req.params.companyId}`
      });
    }
    res.json({
      success: true,
      message: 'Company would be deleted (deletion not yet implemented)'
    });
  } catch (error: any) {
    console.error('Delete company error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// LLM MODELS MANAGEMENT ROUTES
// ============================================================================

router.get('/llm-models', async (req: Request, res: Response) => {
  try {
    const { provider, capability, taskType, limit } = req.query;
    let models = llmModelRegistry.getAllModels();
    
    if (provider) {
      models = models.filter(m => m.provider === provider);
    }
    if (capability) {
      models = models.filter(m => m.capabilities.includes(capability as string));
    }
    if (taskType) {
      // Use existing specialized methods based on taskType
      const taskTypeStr = taskType as string;
      const taskModels = 
        taskTypeStr === 'coding' ? llmModelRegistry.getCodingModels() :
        taskTypeStr === 'reasoning' ? llmModelRegistry.getReasoningModels() :
        taskTypeStr === 'agents' ? llmModelRegistry.getAgentModels() :
        llmModelRegistry.getStableModels();
      const taskModelIds = new Set(taskModels.map(m => m.id));
      models = models.filter(m => taskModelIds.has(m.id));
    }
    if (limit) {
      models = models.slice(0, parseInt(limit as string));
    }
    
    res.json({
      success: true,
      count: models.length,
      data: models
    });
  } catch (error: any) {
    console.error('Get LLM models error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/llm-models/providers', async (req: Request, res: Response) => {
  try {
    const providers = llmModelRegistry.getAllProviders();
    res.json({
      success: true,
      count: providers.length,
      data: providers
    });
  } catch (error: any) {
    console.error('Get LLM providers error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/llm-models/recommended', async (req: Request, res: Response) => {
  try {
    const { taskType } = req.query;
    
    // Use existing specialized methods for recommendations
    const forCoding = llmModelRegistry.getCodingModels().slice(0, 5);
    const forReasoning = llmModelRegistry.getReasoningModels().slice(0, 5);
    const forAgents = llmModelRegistry.getAgentModels().slice(0, 5);
    const stable = llmModelRegistry.getStableModels().slice(0, 10);
    
    const recommendations = {
      forCoding,
      forReasoning,
      forAgents,
      stable,
      byTaskType: taskType ? 
        (taskType === 'coding' ? forCoding : 
         taskType === 'reasoning' ? forReasoning :
         taskType === 'agents' ? forAgents : stable) : stable
    };
    
    res.json({
      success: true,
      taskType: taskType || 'general',
      data: recommendations
    });
  } catch (error: any) {
    console.error('Get recommended models error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/llm-models/stats', async (req: Request, res: Response) => {
  try {
    const stats = llmModelRegistry.getModelStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Get LLM stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// ENHANCED CUSTOM AGENT CREATION WITH SYSTEM PROMPTS
// ============================================================================

const EnhancedCustomAgentSchema = z.object({
  agentId: z.string().min(3).max(100),
  agentName: z.string().min(2).max(200),
  tier: z.enum(['executive', 'development', 'creative', 'qa', 'devops', 'domain']),
  romaLevel: z.enum(['L1', 'L2', 'L3', 'L4']),
  sector: z.string().optional(),
  vertical: z.string().optional(),
  description: z.string().min(10),
  specializations: z.array(z.string()).default([]),
  assignedTools: z.array(z.string()).default([]),
  reportsTo: z.string().optional(),
  directReports: z.array(z.string()).optional(),
  preferredModels: z.array(z.string()).optional(),
  costPriority: z.enum(['lowest', 'balanced', 'quality-first']).default('balanced'),
  customInstructions: z.string().optional(),
  autoGeneratePrompt: z.boolean().default(true)
});

router.post('/agents/enhanced-create', async (req: Request, res: Response) => {
  try {
    const data = EnhancedCustomAgentSchema.parse(req.body);
    
    let generatedPrompt: string | undefined;
    let promptConfig: Partial<WAIUniversalPromptConfig> | undefined;
    
    if (data.autoGeneratePrompt) {
      promptConfig = {
        identity: {
          id: data.agentId,
          name: data.agentName,
          tier: data.tier,
          sector: data.sector,
          vertical: data.vertical,
          romaLevel: data.romaLevel,
          version: '2.0.0',
          status: 'active',
          description: data.description,
          specialization: data.specializations
        },
        mcpTools: {
          assignedTools: data.assignedTools,
          toolCategories: [],
          toolInvocationRules: ['Validate inputs', 'Handle errors gracefully'],
          toolChaining: true,
          parallelToolExecution: true,
          toolErrorHandling: 'Retry with fallback'
        },
        hierarchy: {
          reportsTo: data.reportsTo || null,
          peers: [],
          directReports: data.directReports || [],
          crossDomainCollaborators: [],
          escalationPath: [data.reportsTo || 'Domain Head']
        },
        costOptimization: {
          tokenBudget: 100000,
          costPriority: data.costPriority,
          batchingStrategy: 'Batch similar requests',
          cachingPolicy: 'Cache frequently used responses',
          routingOptimization: 'Route based on task complexity'
        },
        customInstructions: data.customInstructions
      };
      
      generatedPrompt = waiUniversalPromptService.generatePromptForAgent(
        data.agentId,
        promptConfig
      );
    }
    
    const userId = (req as any).user?.id || 'system';
    const agentData = {
      agentId: data.agentId,
      agentName: data.agentName,
      tier: data.tier,
      romaLevel: data.romaLevel,
      systemPrompt: generatedPrompt || data.customInstructions || '',
      communicationMode: 'standard' as const,
      collaborationMode: 'autonomous' as const,
      assignedTools: data.assignedTools,
      behaviors: {},
      personality: {},
      workflows: [],
      triggers: [],
      canCollaborateWith: [],
      preferredProvider: undefined,
      preferredModel: data.preferredModels?.[0],
      maxTokens: 4096,
      temperature: 0.7,
      description: data.description,
      category: data.sector || data.vertical,
      tags: data.specializations
    };
    
    const created = await waiAdminService.createCustomAgent(agentData, userId);
    
    res.status(201).json({
      success: true,
      data: {
        ...created,
        generatedPrompt: generatedPrompt ? {
          length: generatedPrompt.length,
          tokenEstimate: Math.ceil(generatedPrompt.length / 4),
          sections: [
            'identity', 'core_instructions', 'agent_loop', 'task_management',
            'context_engineering', 'roma_standards', 'a2a_protocol', 'hierarchy',
            'mcp_tools', 'guardrails', 'llm_intelligence', 'multimodal_capabilities',
            'multi_language', 'self_learning', 'cost_optimization', 'communication',
            'quality_standards', 'summary'
          ]
        } : null
      }
    });
  } catch (error: any) {
    console.error('Enhanced create agent error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/agents/:agentId/regenerate-prompt', async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    const overrides = req.body;
    
    const agentConfig = await waiAdminService.getAgentConfig(agentId);
    if (!agentConfig) {
      return res.status(404).json({
        success: false,
        error: `Agent not found: ${agentId}`
      });
    }
    
    const promptConfig: Partial<WAIUniversalPromptConfig> = {
      identity: {
        id: agentConfig.agentId,
        name: agentConfig.agentName,
        tier: agentConfig.tier as any,
        romaLevel: agentConfig.romaLevel as any,
        version: '2.0.0',
        status: 'active',
        description: agentConfig.description || 'WAI SDK Agent',
        specialization: agentConfig.tags || []
      },
      mcpTools: {
        assignedTools: agentConfig.assignedTools || [],
        toolCategories: [],
        toolInvocationRules: ['Validate inputs', 'Handle errors gracefully'],
        toolChaining: true,
        parallelToolExecution: true,
        toolErrorHandling: 'Retry with fallback'
      },
      customInstructions: overrides.customInstructions,
      ...overrides
    };
    
    const generatedPrompt = waiUniversalPromptService.generatePromptForAgent(
      agentId,
      promptConfig
    );
    
    const userId = (req as any).user?.id || 'system';
    const updated = await waiAdminService.updateAgentConfig(agentId, {
      systemPrompt: generatedPrompt
    }, userId);
    
    res.json({
      success: true,
      data: {
        agentId,
        promptLength: generatedPrompt.length,
        tokenEstimate: Math.ceil(generatedPrompt.length / 4),
        updated: true
      }
    });
  } catch (error: any) {
    console.error('Regenerate prompt error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// ============================================================================
// ENHANCED AGENT CONFIGURATION API ENDPOINTS
// ============================================================================

// Initialize service on first request
let enhancedServiceInitialized = false;
async function ensureEnhancedServiceInit() {
  if (!enhancedServiceInitialized) {
    await enhancedAgentConfigService.initialize();
    enhancedServiceInitialized = true;
  }
}

// Validation schemas for enhanced agent config
const ModelSelectionUpdateSchema = z.object({
  mode: z.enum(['auto', 'defined', 'selected']).optional(),
  autoRules: z.record(z.string()).optional(),
  autoFallbackChain: z.array(z.string()).optional(),
  definedModels: z.record(z.object({ provider: z.string(), model: z.string() })).optional(),
  selectedProvider: z.string().optional(),
  selectedModel: z.string().optional(),
  costPriority: z.enum(['lowest', 'balanced', 'quality-first']).optional(),
  maxCostPerRequest: z.number().optional(),
  monthlyBudget: z.number().optional(),
  minQualityScore: z.number().min(0).max(100).optional(),
  preferredCapabilities: z.array(z.string()).optional(),
});

const GroupAssignmentUpdateSchema = z.object({
  primaryGroup: z.string().optional(),
  secondaryGroups: z.array(z.string()).optional(),
  role: z.enum(['head', 'specialist', 'support', 'member']).optional(),
  hierarchyLevel: z.number().min(1).max(10).optional(),
  coordinationMode: z.enum(['hierarchical', 'swarm', 'collaborative', 'pipeline']).optional(),
  decisionAuthority: z.enum(['autonomous', 'escalate', 'approve-required', 'head-decides']).optional(),
  swarmRole: z.enum(['coordinator', 'participant', 'observer']).optional(),
  swarmWeight: z.number().min(1).max(10).optional(),
});

const ProtocolsUpdateSchema = z.object({
  a2a: z.object({
    enabled: z.boolean().optional(),
    discoveryMethod: z.string().optional(),
    negotiationRules: z.array(z.string()).optional(),
  }).optional(),
  mcp: z.object({
    enabled: z.boolean().optional(),
    assignedTools: z.array(z.string()).optional(),
    contextPreservation: z.string().optional(),
  }).optional(),
  agui: z.object({
    enabled: z.boolean().optional(),
    streamingEnabled: z.boolean().optional(),
  }).optional(),
  openAgent: z.object({
    enabled: z.boolean().optional(),
  }).optional(),
  messaging: z.object({
    format: z.enum(['structured', 'natural', 'json', 'xml']).optional(),
    responseFormat: z.string().optional(),
  }).optional(),
});

const GuardrailsUpdateSchema = z.object({
  parlant: z.object({
    enabled: z.boolean().optional(),
    standards: z.array(z.string()).optional(),
  }).optional(),
  antiHallucination: z.object({
    enabled: z.boolean().optional(),
    rules: z.array(z.string()).optional(),
  }).optional(),
  security: z.object({
    rules: z.array(z.string()).optional(),
    maxTokens: z.number().optional(),
    allowedDomains: z.array(z.string()).optional(),
  }).optional(),
  content: z.object({
    filteringLevel: z.enum(['none', 'minimal', 'standard', 'strict']).optional(),
    piiProtection: z.boolean().optional(),
  }).optional(),
  quality: z.object({
    requireCitations: z.boolean().optional(),
    factCheckLevel: z.string().optional(),
    confidenceThreshold: z.number().min(0).max(100).optional(),
  }).optional(),
  behavioral: z.object({
    escalationRules: z.array(z.string()).optional(),
    approvalRequired: z.array(z.string()).optional(),
  }).optional(),
});

const OperationModeUpdateSchema = z.object({
  defaultMode: z.enum(['autonomous', 'standalone', 'group', 'supervised']).optional(),
  allowedModes: z.array(z.string()).optional(),
  autonomous: z.object({
    level: z.string().optional(),
    capabilities: z.array(z.string()).optional(),
    limits: z.record(z.any()).optional(),
  }).optional(),
  standalone: z.object({
    enabled: z.boolean().optional(),
    contextRetention: z.boolean().optional(),
  }).optional(),
  group: z.object({
    enabled: z.boolean().optional(),
    preferredGroups: z.array(z.string()).optional(),
    collaborationStyle: z.string().optional(),
  }).optional(),
  supervised: z.object({
    actions: z.array(z.string()).optional(),
    supervisorIds: z.array(z.string()).optional(),
  }).optional(),
  availability: z.object({
    forAllTasks: z.boolean().optional(),
    restrictedTo: z.array(z.string()).optional(),
    blacklisted: z.array(z.string()).optional(),
  }).optional(),
  priority: z.number().min(1).max(10).optional(),
});

const LanguageUpdateSchema = z.object({
  supported: z.array(z.string()).optional(),
  default: z.string().optional(),
  autoDetection: z.boolean().optional(),
  autoTranslation: z.boolean().optional(),
  culturalAdaptation: z.boolean().optional(),
});

const OutcomeUpdateSchema = z.object({
  supported: z.array(z.string()).optional(),
  primary: z.string().optional(),
  multimodal: z.boolean().optional(),
  formattingRules: z.record(z.string()).optional(),
});

// GET /api/wai-admin/enhanced-configs - Get all enhanced agent configurations
router.get('/enhanced-configs', async (req: Request, res: Response) => {
  try {
    await ensureEnhancedServiceInit();
    
    const { tier, group, romaLevel, modelMode, operationMode } = req.query;
    
    let configs = enhancedAgentConfigService.getAllAgentConfigs();
    
    if (tier && typeof tier === 'string') {
      configs = configs.filter(c => c.tier === tier);
    }
    if (group && typeof group === 'string') {
      configs = configs.filter(c => c.groupAssignment.primaryGroup === group);
    }
    if (romaLevel && typeof romaLevel === 'string') {
      configs = configs.filter(c => c.romaLevel === romaLevel);
    }
    if (modelMode && typeof modelMode === 'string') {
      configs = configs.filter(c => c.modelSelection.mode === modelMode);
    }
    if (operationMode && typeof operationMode === 'string') {
      configs = configs.filter(c => c.operationMode.defaultMode === operationMode);
    }
    
    res.json({
      success: true,
      data: {
        total: configs.length,
        configs: configs.map(c => ({
          agentId: c.agentId,
          agentName: c.agentName,
          tier: c.tier,
          romaLevel: c.romaLevel,
          modelSelectionMode: c.modelSelection.mode,
          primaryGroup: c.groupAssignment.primaryGroup,
          role: c.groupAssignment.role,
          operationMode: c.operationMode.defaultMode,
          enabled: c.enabled,
          status: c.status,
        })),
      },
    });
  } catch (error: any) {
    console.error('Get enhanced configs error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/wai-admin/enhanced-configs/stats - Get configuration statistics
router.get('/enhanced-configs/stats', async (req: Request, res: Response) => {
  try {
    await ensureEnhancedServiceInit();
    const stats = enhancedAgentConfigService.getAgentStats();
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Get enhanced config stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/wai-admin/enhanced-configs/:agentId - Get single agent enhanced config
router.get('/enhanced-configs/:agentId', async (req: Request, res: Response) => {
  try {
    await ensureEnhancedServiceInit();
    const { agentId } = req.params;
    
    const config = enhancedAgentConfigService.getAgentConfig(agentId);
    if (!config) {
      return res.status(404).json({
        success: false,
        error: `Agent configuration not found: ${agentId}`,
      });
    }
    
    res.json({
      success: true,
      data: config,
    });
  } catch (error: any) {
    console.error('Get enhanced config error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/wai-admin/enhanced-configs/:agentId/model-selection - Update model selection
router.put('/enhanced-configs/:agentId/model-selection', async (req: Request, res: Response) => {
  try {
    await ensureEnhancedServiceInit();
    const { agentId } = req.params;
    const updates = ModelSelectionUpdateSchema.parse(req.body);
    
    const success = enhancedAgentConfigService.updateModelSelection(agentId, updates);
    if (!success) {
      return res.status(404).json({
        success: false,
        error: `Agent not found: ${agentId}`,
      });
    }
    
    const config = enhancedAgentConfigService.getAgentConfig(agentId);
    res.json({
      success: true,
      data: config?.modelSelection,
    });
  } catch (error: any) {
    console.error('Update model selection error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// PUT /api/wai-admin/enhanced-configs/:agentId/group-assignment - Update group assignment
router.put('/enhanced-configs/:agentId/group-assignment', async (req: Request, res: Response) => {
  try {
    await ensureEnhancedServiceInit();
    const { agentId } = req.params;
    const updates = GroupAssignmentUpdateSchema.parse(req.body);
    
    const success = enhancedAgentConfigService.updateGroupAssignment(agentId, updates);
    if (!success) {
      return res.status(404).json({
        success: false,
        error: `Agent not found: ${agentId}`,
      });
    }
    
    const config = enhancedAgentConfigService.getAgentConfig(agentId);
    res.json({
      success: true,
      data: config?.groupAssignment,
    });
  } catch (error: any) {
    console.error('Update group assignment error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// PUT /api/wai-admin/enhanced-configs/:agentId/protocols - Update protocols
router.put('/enhanced-configs/:agentId/protocols', async (req: Request, res: Response) => {
  try {
    await ensureEnhancedServiceInit();
    const { agentId } = req.params;
    const updates = ProtocolsUpdateSchema.parse(req.body);
    
    const success = enhancedAgentConfigService.updateProtocols(agentId, updates as any);
    if (!success) {
      return res.status(404).json({
        success: false,
        error: `Agent not found: ${agentId}`,
      });
    }
    
    const config = enhancedAgentConfigService.getAgentConfig(agentId);
    res.json({
      success: true,
      data: config?.protocols,
    });
  } catch (error: any) {
    console.error('Update protocols error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// PUT /api/wai-admin/enhanced-configs/:agentId/guardrails - Update guardrails
router.put('/enhanced-configs/:agentId/guardrails', async (req: Request, res: Response) => {
  try {
    await ensureEnhancedServiceInit();
    const { agentId } = req.params;
    const updates = GuardrailsUpdateSchema.parse(req.body);
    
    const success = enhancedAgentConfigService.updateGuardrails(agentId, updates as any);
    if (!success) {
      return res.status(404).json({
        success: false,
        error: `Agent not found: ${agentId}`,
      });
    }
    
    const config = enhancedAgentConfigService.getAgentConfig(agentId);
    res.json({
      success: true,
      data: config?.guardrails,
    });
  } catch (error: any) {
    console.error('Update guardrails error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// PUT /api/wai-admin/enhanced-configs/:agentId/operation-mode - Update operation mode
router.put('/enhanced-configs/:agentId/operation-mode', async (req: Request, res: Response) => {
  try {
    await ensureEnhancedServiceInit();
    const { agentId } = req.params;
    const updates = OperationModeUpdateSchema.parse(req.body);
    
    const success = enhancedAgentConfigService.updateOperationMode(agentId, updates as any);
    if (!success) {
      return res.status(404).json({
        success: false,
        error: `Agent not found: ${agentId}`,
      });
    }
    
    const config = enhancedAgentConfigService.getAgentConfig(agentId);
    res.json({
      success: true,
      data: config?.operationMode,
    });
  } catch (error: any) {
    console.error('Update operation mode error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /api/wai-admin/enhanced-configs/:agentId/select-model - Get recommended model for task
router.post('/enhanced-configs/:agentId/select-model', async (req: Request, res: Response) => {
  try {
    await ensureEnhancedServiceInit();
    const { agentId } = req.params;
    const { taskType } = req.body;
    
    const recommendation = enhancedAgentConfigService.selectBestModelForAgent(agentId, taskType || 'general');
    if (!recommendation) {
      return res.status(404).json({
        success: false,
        error: `Agent not found: ${agentId}`,
      });
    }
    
    res.json({
      success: true,
      data: {
        agentId,
        taskType: taskType || 'general',
        recommendation,
      },
    });
  } catch (error: any) {
    console.error('Select model error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/wai-admin/enhanced-configs/by-group/:groupId - Get agents by group
router.get('/enhanced-configs/by-group/:groupId', async (req: Request, res: Response) => {
  try {
    await ensureEnhancedServiceInit();
    const { groupId } = req.params;
    
    const configs = enhancedAgentConfigService.getAgentsByGroup(groupId);
    
    // Sort by hierarchy level (heads first, then specialists, then support)
    configs.sort((a, b) => a.groupAssignment.hierarchyLevel - b.groupAssignment.hierarchyLevel);
    
    res.json({
      success: true,
      data: {
        groupId,
        total: configs.length,
        agents: configs.map(c => ({
          agentId: c.agentId,
          agentName: c.agentName,
          tier: c.tier,
          romaLevel: c.romaLevel,
          role: c.groupAssignment.role,
          hierarchyLevel: c.groupAssignment.hierarchyLevel,
          reportsTo: c.hierarchy.reportsTo,
          directReports: c.hierarchy.directReports,
        })),
      },
    });
  } catch (error: any) {
    console.error('Get agents by group error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/wai-admin/model-selection-modes - Get model selection mode options
router.get('/model-selection-modes', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        modes: [
          {
            id: 'auto',
            name: 'Auto (Intelligent Routing)',
            description: 'Automatically selects the best model based on task type, cost priority, and agent capabilities',
            features: [
              'Task-based model selection (coding, reasoning, creative, general)',
              'Cost optimization (lowest, balanced, quality-first)',
              'Automatic fallback chain',
              'Capability matching',
            ],
          },
          {
            id: 'defined',
            name: 'Defined (Admin-Specified)',
            description: 'Admin pre-defines which models to use for each task type',
            features: [
              'Explicit model assignment per task type',
              'Custom fallback configurations',
              'Full control over model selection',
              'Predictable costs',
            ],
          },
          {
            id: 'selected',
            name: 'Selected (Fixed Model)',
            description: 'Always uses a single specified model for all tasks',
            features: [
              'Single model for all requests',
              'Maximum predictability',
              'Consistent behavior',
              'Simplified configuration',
            ],
          },
        ],
        costPriorities: [
          { id: 'lowest', name: 'Lowest Cost', description: 'Prefer cheapest capable model' },
          { id: 'balanced', name: 'Balanced', description: 'Balance between cost and quality' },
          { id: 'quality-first', name: 'Quality First', description: 'Prefer highest quality model' },
        ],
        taskTypes: [
          { id: 'codeGeneration', name: 'Code Generation', description: 'Writing, debugging, and refactoring code' },
          { id: 'reasoning', name: 'Reasoning', description: 'Complex analysis and problem-solving' },
          { id: 'creative', name: 'Creative', description: 'Content creation and creative writing' },
          { id: 'general', name: 'General', description: 'General-purpose tasks' },
          { id: 'costOptimized', name: 'Cost Optimized', description: 'Simple tasks requiring minimal resources' },
        ],
      },
    });
  } catch (error: any) {
    console.error('Get model selection modes error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/wai-admin/operation-mode-options - Get operation mode options
router.get('/operation-mode-options', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        modes: [
          {
            id: 'autonomous',
            name: 'Autonomous',
            description: 'Agent operates independently on tasks without supervision',
            romaLevels: ['L3', 'L4'],
            features: ['Independent execution', 'Self-correction', 'Proactive optimization'],
          },
          {
            id: 'standalone',
            name: 'Standalone',
            description: 'Agent handles single requests without collaboration',
            romaLevels: ['L1', 'L2', 'L3'],
            features: ['Single-request processing', 'Optional context retention', 'Isolated operation'],
          },
          {
            id: 'group',
            name: 'Group',
            description: 'Agent works as part of a team within a sector group',
            romaLevels: ['L2', 'L3', 'L4'],
            features: ['Team collaboration', 'Hierarchy awareness', 'Swarm participation'],
          },
          {
            id: 'supervised',
            name: 'Supervised',
            description: 'Agent requires human approval for certain actions',
            romaLevels: ['L1', 'L2'],
            features: ['Human oversight', 'Approval workflows', 'Audit trail'],
          },
        ],
        collaborationStyles: [
          { id: 'proactive', name: 'Proactive', description: 'Actively seeks collaboration opportunities' },
          { id: 'reactive', name: 'Reactive', description: 'Collaborates when requested' },
          { id: 'observer', name: 'Observer', description: 'Monitors but rarely initiates' },
        ],
        coordinationModes: [
          { id: 'hierarchical', name: 'Hierarchical', description: 'Head-led coordination' },
          { id: 'swarm', name: 'Swarm', description: 'Distributed decision-making' },
          { id: 'collaborative', name: 'Collaborative', description: 'Peer-based coordination' },
          { id: 'pipeline', name: 'Pipeline', description: 'Sequential task processing' },
        ],
      },
    });
  } catch (error: any) {
    console.error('Get operation mode options error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/wai-admin/guardrails-options - Get guardrails options
router.get('/guardrails-options', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        parlantStandards: [
          { id: 'no-hallucination', name: 'No Hallucination', description: 'Must not fabricate facts' },
          { id: 'cite-sources', name: 'Cite Sources', description: 'Reference information sources' },
          { id: 'acknowledge-uncertainty', name: 'Acknowledge Uncertainty', description: 'Admit when unsure' },
          { id: 'stay-in-scope', name: 'Stay in Scope', description: 'Stay within capability boundaries' },
          { id: 'verify-before-action', name: 'Verify Before Action', description: 'Confirm before irreversible actions' },
        ],
        antiHallucinationRules: [
          { id: 'verify-facts', name: 'Verify Facts', description: 'Cross-check factual claims' },
          { id: 'cite-sources', name: 'Cite Sources', description: 'Provide references for claims' },
          { id: 'acknowledge-limits', name: 'Acknowledge Limits', description: 'Recognize knowledge limitations' },
          { id: 'use-hedging', name: 'Use Hedging', description: 'Qualify uncertain statements' },
          { id: 'no-fabrication', name: 'No Fabrication', description: 'Never invent information' },
        ],
        contentFilteringLevels: [
          { id: 'none', name: 'None', description: 'No content filtering' },
          { id: 'minimal', name: 'Minimal', description: 'Basic safety filtering only' },
          { id: 'standard', name: 'Standard', description: 'Balanced filtering' },
          { id: 'strict', name: 'Strict', description: 'Maximum content filtering' },
        ],
        securityRules: [
          { id: 'no-secrets', name: 'No Secrets', description: 'Never expose API keys or credentials' },
          { id: 'no-pii-exposure', name: 'No PII Exposure', description: 'Protect personal information' },
          { id: 'safe-execution', name: 'Safe Execution', description: 'Validate before code execution' },
          { id: 'input-validation', name: 'Input Validation', description: 'Sanitize all inputs' },
          { id: 'output-sanitization', name: 'Output Sanitization', description: 'Clean all outputs' },
        ],
        factCheckLevels: [
          { id: 'none', name: 'None', description: 'No fact-checking' },
          { id: 'basic', name: 'Basic', description: 'Simple plausibility checks' },
          { id: 'standard', name: 'Standard', description: 'Verify key claims' },
          { id: 'rigorous', name: 'Rigorous', description: 'Thorough verification' },
        ],
      },
    });
  } catch (error: any) {
    console.error('Get guardrails options error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/wai-admin/protocol-options - Get protocol options
router.get('/protocol-options', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        protocols: [
          {
            id: 'a2a',
            name: 'A2A (Agent-to-Agent)',
            description: 'Communication protocol between AI agents',
            features: ['Discovery', 'Negotiation', 'Handoff', 'Conflict Resolution'],
          },
          {
            id: 'mcp',
            name: 'MCP (Model Context Protocol)',
            description: 'Protocol for tool invocation and context management',
            features: ['Tool Access', 'Context Preservation', 'Resource Management'],
          },
          {
            id: 'agui',
            name: 'AG-UI (Agent-User Interface)',
            description: 'Protocol for streaming agent responses to UI',
            features: ['Real-time Streaming', 'Progress Updates', 'Interactive UI'],
          },
          {
            id: 'openAgent',
            name: 'OpenAgent',
            description: 'Open standard for agent interoperability',
            features: ['Cross-platform', 'Standard Messages', 'Extensible'],
          },
        ],
        messagingFormats: [
          { id: 'structured', name: 'Structured', description: 'Organized sections and formatting' },
          { id: 'natural', name: 'Natural', description: 'Conversational style' },
          { id: 'json', name: 'JSON', description: 'Machine-readable JSON format' },
          { id: 'xml', name: 'XML', description: 'XML-based format' },
        ],
        responseFormats: [
          { id: 'markdown', name: 'Markdown', description: 'Rich text with formatting' },
          { id: 'plain', name: 'Plain', description: 'Plain text without formatting' },
          { id: 'html', name: 'HTML', description: 'HTML markup' },
          { id: 'json', name: 'JSON', description: 'JSON data structure' },
        ],
        discoveryMethods: [
          { id: 'registry', name: 'Registry', description: 'Centralized agent registry lookup' },
          { id: 'broadcast', name: 'Broadcast', description: 'Broadcast capability discovery' },
          { id: 'direct', name: 'Direct', description: 'Direct agent addressing' },
        ],
        negotiationRules: [
          { id: 'capability-match', name: 'Capability Match', description: 'Match agent capabilities to task' },
          { id: 'load-balance', name: 'Load Balance', description: 'Distribute across available agents' },
          { id: 'cost-optimize', name: 'Cost Optimize', description: 'Minimize operational costs' },
          { id: 'quality-first', name: 'Quality First', description: 'Prioritize output quality' },
        ],
      },
    });
  } catch (error: any) {
    console.error('Get protocol options error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/wai-admin/language-options - Get language options
router.get('/language-options', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        supportedLanguages: [
          { code: 'en', name: 'English', native: 'English' },
          { code: 'es', name: 'Spanish', native: 'Español' },
          { code: 'fr', name: 'French', native: 'Français' },
          { code: 'de', name: 'German', native: 'Deutsch' },
          { code: 'pt', name: 'Portuguese', native: 'Português' },
          { code: 'zh', name: 'Chinese', native: '中文' },
          { code: 'ja', name: 'Japanese', native: '日本語' },
          { code: 'ko', name: 'Korean', native: '한국어' },
          { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
          { code: 'ar', name: 'Arabic', native: 'العربية' },
          { code: 'ru', name: 'Russian', native: 'Русский' },
          { code: 'it', name: 'Italian', native: 'Italiano' },
          { code: 'nl', name: 'Dutch', native: 'Nederlands' },
          { code: 'pl', name: 'Polish', native: 'Polski' },
          { code: 'tr', name: 'Turkish', native: 'Türkçe' },
          { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt' },
          { code: 'th', name: 'Thai', native: 'ไทย' },
          { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia' },
          { code: 'ms', name: 'Malay', native: 'Bahasa Melayu' },
          { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
          { code: 'te', name: 'Telugu', native: 'తెలుగు' },
          { code: 'bn', name: 'Bengali', native: 'বাংলা' },
          { code: 'mr', name: 'Marathi', native: 'मराठी' },
        ],
        indianLanguages: [
          { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
          { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
          { code: 'te', name: 'Telugu', native: 'తెలుగు' },
          { code: 'bn', name: 'Bengali', native: 'বাংলা' },
          { code: 'mr', name: 'Marathi', native: 'मराठी' },
          { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
          { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
          { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
          { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
          { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ' },
        ],
      },
    });
  } catch (error: any) {
    console.error('Get language options error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/wai-admin/outcome-options - Get outcome type options
router.get('/outcome-options', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        outcomeTypes: [
          { id: 'text', name: 'Text', description: 'Plain text response' },
          { id: 'code', name: 'Code', description: 'Source code generation' },
          { id: 'analysis', name: 'Analysis', description: 'Structured analysis report' },
          { id: 'decision', name: 'Decision', description: 'Decision recommendation' },
          { id: 'action', name: 'Action', description: 'Executable action' },
          { id: 'report', name: 'Report', description: 'Formatted report' },
          { id: 'strategy', name: 'Strategy', description: 'Strategic plan' },
          { id: 'documentation', name: 'Documentation', description: 'Technical documentation' },
          { id: 'content', name: 'Content', description: 'Creative content' },
          { id: 'design-spec', name: 'Design Spec', description: 'Design specification' },
          { id: 'multimedia', name: 'Multimedia', description: 'Multimodal content' },
          { id: 'test-results', name: 'Test Results', description: 'Testing outcomes' },
          { id: 'script', name: 'Script', description: 'Automation script' },
          { id: 'configuration', name: 'Configuration', description: 'Configuration file' },
          { id: 'recommendation', name: 'Recommendation', description: 'Expert recommendation' },
        ],
        formattingRules: {
          code: ['markdown-fenced', 'syntax-highlighted', 'plain'],
          analysis: ['structured-sections', 'bullet-points', 'tables'],
          report: ['executive-summary', 'detailed', 'technical'],
        },
      },
    });
  } catch (error: any) {
    console.error('Get outcome options error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
