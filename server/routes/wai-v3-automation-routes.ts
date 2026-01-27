import { Router, Request, Response } from 'express';
import { messagingAutomationService } from '../services/messaging-automation-service';
import { digitalTwinEngine } from '../services/digital-twin-engine';
import { wizardSmithObservability } from '../services/wizardsmith-observability';
import { emailAutomationService } from '../services/email-automation-service';
import { voiceAgentService } from '../services/voice-agent-service';
import { enhancedOrchestrationService } from '../services/enhanced-orchestration-service';
import { documentIntelligenceService } from '../services/document-intelligence-service';
import { webIntelligenceService } from '../services/web-intelligence-service';
import { z, ZodError } from 'zod';

const router = Router();

router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    version: '3.0.0',
    timestamp: new Date().toISOString(),
    services: {
      email: !!emailAutomationService,
      messaging: !!messagingAutomationService,
      voice: !!voiceAgentService,
      digitalTwin: !!digitalTwinEngine,
      observability: !!wizardSmithObservability
    }
  });
});

const handleZodError = (error: ZodError, res: Response) => {
  const errors = error.errors.map(e => ({
    path: e.path.join('.'),
    message: e.message
  }));
  res.status(400).json({ 
    success: false, 
    error: 'Validation failed', 
    details: errors 
  });
};

const connectSlackSchema = z.object({
  accessToken: z.string().min(1, 'Access token is required'),
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  organizationId: z.number().int().positive().optional()
});

const connectTeamsSchema = z.object({
  accessToken: z.string().min(1, 'Access token is required'),
  tenantId: z.string().min(1, 'Tenant ID is required'),
  organizationId: z.number().int().positive().optional()
});

const connectWhatsAppSchema = z.object({
  accessToken: z.string().min(1, 'Access token is required'),
  phoneNumberId: z.string().min(1, 'Phone number ID is required'),
  organizationId: z.number().int().positive().optional()
});

const processMessageSchema = z.object({
  channelId: z.string().min(1, 'Channel ID is required'),
  platform: z.enum(['slack', 'teams', 'whatsapp', 'discord', 'telegram']),
  senderId: z.string().min(1, 'Sender ID is required'),
  senderName: z.string().min(1, 'Sender name is required'),
  content: z.string().min(1, 'Content is required'),
  contentType: z.enum(['text', 'image', 'file', 'reaction', 'thread_reply']).default('text'),
  threadId: z.string().optional(),
  attachments: z.array(z.object({
    id: z.string(),
    type: z.enum(['file', 'image', 'video', 'audio', 'link']),
    name: z.string(),
    url: z.string().url(),
    size: z.number().optional(),
    mimeType: z.string().optional()
  })).optional()
});

const sendMessageSchema = z.object({
  channelId: z.string().min(1, 'Channel ID is required'),
  platform: z.enum(['slack', 'teams', 'whatsapp', 'discord', 'telegram']),
  content: z.string().min(1, 'Content is required'),
  threadId: z.string().optional()
});

const createDigitalTwinSchema = z.object({
  userId: z.string().min(1, 'User ID is required')
});

const recordBehaviorSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  behaviorType: z.enum(['interaction', 'preference', 'pattern', 'feedback']).default('interaction'),
  action: z.string().min(1, 'Action is required'),
  context: z.record(z.any()).default({}),
  sessionId: z.string().optional()
});

const interactSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  query: z.string().min(1, 'Query is required'),
  context: z.record(z.any()).default({}),
  response: z.string().optional()
});

const automationRuleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  trigger: z.object({
    type: z.enum(['schedule', 'event', 'condition', 'manual']),
    config: z.record(z.any()).default({})
  }),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(['equals', 'contains', 'greaterThan', 'lessThan', 'matches']),
    value: z.any().default(null)
  })).default([]),
  actions: z.array(z.object({
    type: z.enum(['notify', 'execute', 'delegate', 'respond', 'escalate']),
    config: z.record(z.any()).default({}),
    requiresApproval: z.boolean().default(false)
  })).default([]),
  isEnabled: z.boolean().default(true),
  romaLevel: z.enum(['L1', 'L2', 'L3', 'L4', 'L5']).default('L2')
});

const autonomyLevelSchema = z.object({
  level: z.enum(['supervised', 'assisted', 'autonomous'])
});

const startTraceSchema = z.object({
  traceId: z.string().optional(),
  spanId: z.string().optional(),
  parentSpanId: z.string().optional(),
  operationType: z.enum(['llm_call', 'agent_execution', 'tool_invocation', 'orchestration', 'memory_access', 'embedding']).default('agent_execution'),
  name: z.string().min(1, 'Operation name is required'),
  input: z.record(z.any()).default({}),
  metadata: z.record(z.any()).default({})
});

const endTraceSchema = z.object({
  traceId: z.string().min(1, 'Trace ID is required'),
  eventId: z.string().min(1, 'Event ID is required'),
  status: z.enum(['success', 'error', 'timeout']),
  output: z.record(z.any()).optional(),
  error: z.object({
    type: z.string(),
    message: z.string(),
    stack: z.string().optional()
  }).optional(),
  tokens: z.object({
    inputTokens: z.number().int().nonnegative(),
    outputTokens: z.number().int().nonnegative(),
    totalTokens: z.number().int().nonnegative(),
    cachedTokens: z.number().int().nonnegative().optional()
  }).optional(),
  cost: z.object({
    inputCost: z.number().nonnegative(),
    outputCost: z.number().nonnegative(),
    totalCost: z.number().nonnegative(),
    currency: z.string().default('USD')
  }).optional()
});

const createPromptSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  version: z.string().default('1.0.0'),
  systemPrompt: z.string().min(1, 'System prompt is required'),
  userPromptTemplate: z.string().optional(),
  variables: z.array(z.string()).default([]),
  metadata: z.record(z.any()).default({}),
  isActive: z.boolean().default(true)
});

const createAlertRuleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  condition: z.object({
    metric: z.enum(['error_rate', 'latency', 'cost', 'token_usage', 'success_rate']),
    operator: z.enum(['gt', 'lt', 'eq', 'gte', 'lte']),
    timeWindowMinutes: z.number().int().positive().default(60),
    aggregation: z.enum(['avg', 'sum', 'max', 'min', 'count']).default('avg')
  }),
  threshold: z.number(),
  severity: z.enum(['info', 'warning', 'critical']).default('warning'),
  channels: z.array(z.string()).default([]),
  isEnabled: z.boolean().default(true),
  cooldownMinutes: z.number().int().positive().default(15)
});

const evaluationSchema = z.object({
  promptVersionId: z.string().min(1, 'Prompt version ID is required'),
  testCaseId: z.string().min(1, 'Test case ID is required'),
  input: z.record(z.any()),
  expectedOutput: z.string().min(1, 'Expected output is required'),
  actualOutput: z.string().min(1, 'Actual output is required'),
  score: z.number().min(0).max(1),
  metrics: z.object({
    relevance: z.number().min(0).max(1),
    accuracy: z.number().min(0).max(1),
    coherence: z.number().min(0).max(1),
    fluency: z.number().min(0).max(1),
    toxicity: z.number().min(0).max(1),
    hallucination: z.number().min(0).max(1),
    latency: z.number().nonnegative(),
    tokenEfficiency: z.number().nonnegative()
  })
});

router.post('/messaging/connect/slack', async (req: Request, res: Response) => {
  try {
    const data = connectSlackSchema.parse(req.body);
    const userId = (req as any).user?.id || 'anonymous';
    
    const channel = await messagingAutomationService.connectSlackWorkspace(
      userId,
      data.accessToken,
      data.workspaceId,
      data.organizationId
    );
    
    res.json({ success: true, channel });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return handleZodError(error, res);
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/messaging/connect/teams', async (req: Request, res: Response) => {
  try {
    const data = connectTeamsSchema.parse(req.body);
    const userId = (req as any).user?.id || 'anonymous';
    
    const channel = await messagingAutomationService.connectMicrosoftTeams(
      userId,
      data.accessToken,
      data.tenantId,
      data.organizationId
    );
    
    res.json({ success: true, channel });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return handleZodError(error, res);
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/messaging/connect/whatsapp', async (req: Request, res: Response) => {
  try {
    const data = connectWhatsAppSchema.parse(req.body);
    const userId = (req as any).user?.id || 'anonymous';
    
    const channel = await messagingAutomationService.connectWhatsAppBusiness(
      userId,
      data.accessToken,
      data.phoneNumberId,
      data.organizationId
    );
    
    res.json({ success: true, channel });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return handleZodError(error, res);
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/messaging/process', async (req: Request, res: Response) => {
  try {
    const data = processMessageSchema.parse(req.body);
    
    const result = await messagingAutomationService.processIncomingMessage({
      id: `msg-${Date.now()}`,
      ...data,
      timestamp: new Date(),
      metadata: {}
    });
    
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/messaging/send', async (req: Request, res: Response) => {
  try {
    const data = sendMessageSchema.parse(req.body);
    const result = await messagingAutomationService.sendMessage(data);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/messaging/channels', async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || 'anonymous';
  const channels = await messagingAutomationService.getChannels(userId);
  res.json({ success: true, channels });
});

router.get('/messaging/stats', async (req: Request, res: Response) => {
  const stats = await messagingAutomationService.getStats();
  res.json({ success: true, stats });
});

router.post('/digital-twin/create', async (req: Request, res: Response) => {
  try {
    const data = createDigitalTwinSchema.parse(req.body);
    const profile = await digitalTwinEngine.createDigitalTwin(data.userId);
    res.json({ success: true, profile });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return handleZodError(error, res);
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/digital-twin/:userId', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    if (!userId || userId.length === 0) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }
    const profile = await digitalTwinEngine.getDigitalTwin(userId);
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Digital Twin not found' });
    }
    res.json({ success: true, profile });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/digital-twin/behavior', async (req: Request, res: Response) => {
  try {
    const data = recordBehaviorSchema.parse(req.body);
    const behavior = {
      id: `behavior-${Date.now()}`,
      userId: data.userId,
      behaviorType: data.behaviorType as 'interaction' | 'preference' | 'pattern' | 'feedback',
      action: data.action,
      context: data.context,
      timestamp: new Date(),
      sessionId: data.sessionId
    };
    
    await digitalTwinEngine.recordBehavior(behavior);
    res.json({ success: true, behaviorId: behavior.id });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return handleZodError(error, res);
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/digital-twin/interact', async (req: Request, res: Response) => {
  try {
    const data = interactSchema.parse(req.body);
    const interaction = {
      userId: data.userId,
      query: data.query,
      context: data.context,
      response: data.response
    };
    
    const result = await digitalTwinEngine.processInteraction(interaction);
    res.json({ success: true, ...result });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return handleZodError(error, res);
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/digital-twin/:userId/automation-rule', async (req: Request, res: Response) => {
  try {
    const data = automationRuleSchema.parse(req.body);
    const rule = await digitalTwinEngine.addAutomationRule(req.params.userId, {
      name: data.name,
      trigger: data.trigger,
      conditions: data.conditions.map(c => ({ field: c.field, operator: c.operator, value: c.value ?? null })),
      actions: data.actions,
      isEnabled: data.isEnabled,
      romaLevel: data.romaLevel as 'L1' | 'L2' | 'L3' | 'L4' | 'L5'
    });
    
    res.json({ success: true, rule });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return handleZodError(error, res);
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/digital-twin/:userId/execute-rule/:ruleId', async (req: Request, res: Response) => {
  try {
    const result = await digitalTwinEngine.executeAutomationRule(
      req.params.userId,
      req.params.ruleId,
      req.body.context || {}
    );
    
    res.json({ result, success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/digital-twin/:userId/autonomy', async (req: Request, res: Response) => {
  try {
    const data = autonomyLevelSchema.parse(req.body);
    await digitalTwinEngine.updateAutonomyLevel(req.params.userId, data.level);
    res.json({ success: true });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return handleZodError(error, res);
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/digital-twin/stats', async (req: Request, res: Response) => {
  const stats = await digitalTwinEngine.getStats();
  res.json({ success: true, stats });
});

router.post('/observability/trace/start', async (req: Request, res: Response) => {
  try {
    const data = startTraceSchema.parse(req.body);
    const traceId = data.traceId || `trace-${Date.now()}`;
    const eventId = await wizardSmithObservability.startTrace({
      traceId,
      spanId: data.spanId || `span-${Date.now()}`,
      parentSpanId: data.parentSpanId,
      operationType: data.operationType as 'llm_call' | 'agent_execution' | 'tool_invocation' | 'orchestration' | 'memory_access' | 'embedding',
      name: data.name,
      input: data.input,
      metadata: data.metadata
    });
    
    res.json({ success: true, eventId, traceId });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return handleZodError(error, res);
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/observability/trace/end', async (req: Request, res: Response) => {
  try {
    const data = endTraceSchema.parse(req.body);
    await wizardSmithObservability.endTrace(
      data.traceId,
      data.eventId,
      {
        status: data.status,
        output: data.output,
        error: data.error,
        tokens: data.tokens,
        cost: data.cost
      }
    );
    
    res.json({ success: true });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return handleZodError(error, res);
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/observability/trace/:traceId', async (req: Request, res: Response) => {
  const events = await wizardSmithObservability.getTrace(req.params.traceId);
  res.json({ success: true, events });
});

router.post('/observability/prompt/create', async (req: Request, res: Response) => {
  try {
    const data = createPromptSchema.parse(req.body);
    const version = await wizardSmithObservability.createPromptVersion({
      name: data.name,
      version: data.version,
      systemPrompt: data.systemPrompt,
      userPromptTemplate: data.userPromptTemplate,
      variables: data.variables,
      metadata: data.metadata,
      isActive: data.isActive
    });
    
    res.json({ success: true, version });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return handleZodError(error, res);
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/observability/prompts', async (req: Request, res: Response) => {
  const versions = await wizardSmithObservability.getActivePromptVersions();
  res.json({ success: true, versions });
});

router.post('/observability/prompt/compare', async (req: Request, res: Response) => {
  try {
    const comparison = await wizardSmithObservability.comparePromptVersions(req.body.versionIds);
    res.json({ success: true, ...comparison });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/observability/evaluate', async (req: Request, res: Response) => {
  try {
    const data = evaluationSchema.parse(req.body);
    const result = await wizardSmithObservability.recordEvaluation({
      promptVersionId: data.promptVersionId,
      testCaseId: data.testCaseId,
      input: data.input,
      expectedOutput: data.expectedOutput,
      actualOutput: data.actualOutput,
      score: data.score,
      metrics: data.metrics
    });
    
    res.json({ success: true, result });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return handleZodError(error, res);
    }
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/observability/alert-rule', async (req: Request, res: Response) => {
  try {
    const data = createAlertRuleSchema.parse(req.body);
    const rule = await wizardSmithObservability.createAlertRule({
      name: data.name,
      condition: data.condition,
      threshold: data.threshold,
      severity: data.severity as 'info' | 'warning' | 'critical',
      channels: data.channels,
      isEnabled: data.isEnabled,
      cooldownMinutes: data.cooldownMinutes
    });
    
    res.json({ success: true, rule });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return handleZodError(error, res);
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/observability/alert-rules', async (req: Request, res: Response) => {
  const rules = await wizardSmithObservability.getAlertRules();
  res.json({ success: true, rules });
});

router.get('/observability/alerts', async (req: Request, res: Response) => {
  const alerts = await wizardSmithObservability.getAlerts({
    severity: req.query.severity as string,
    acknowledged: req.query.acknowledged === 'true',
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
  });
  res.json({ success: true, alerts });
});

router.post('/observability/alerts/:alertId/acknowledge', async (req: Request, res: Response) => {
  await wizardSmithObservability.acknowledgeAlert(req.params.alertId);
  res.json({ success: true });
});

router.get('/observability/dashboard', async (req: Request, res: Response) => {
  const timeRange = req.query.timeRange ? parseInt(req.query.timeRange as string) : 60;
  const metrics = await wizardSmithObservability.getDashboardMetrics(timeRange);
  res.json({ success: true, metrics });
});

router.get('/observability/tokens', async (req: Request, res: Response) => {
  const timeRange = req.query.timeRange ? parseInt(req.query.timeRange as string) : 1440;
  const analytics = await wizardSmithObservability.getTokenAnalytics(timeRange);
  res.json({ success: true, analytics });
});

router.get('/observability/stats', async (req: Request, res: Response) => {
  const stats = await wizardSmithObservability.getStats();
  res.json({ success: true, stats });
});

const connectGmailSchema = z.object({
  accessToken: z.string().min(1, 'Access token is required'),
  refreshToken: z.string().min(1, 'Refresh token is required'),
  email: z.string().email('Valid email is required'),
  userId: z.string().optional(),
  organizationId: z.number().int().positive().optional()
});

const connectOutlookSchema = z.object({
  accessToken: z.string().min(1, 'Access token is required'),
  refreshToken: z.string().min(1, 'Refresh token is required'),
  email: z.string().email('Valid email is required'),
  userId: z.string().optional(),
  organizationId: z.number().int().positive().optional()
});

const connectImapSchema = z.object({
  email: z.string().email('Valid email is required'),
  imapHost: z.string().min(1, 'IMAP host is required'),
  smtpHost: z.string().min(1, 'SMTP host is required'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  userId: z.string().optional(),
  organizationId: z.number().int().positive().optional()
});

const processEmailSchema = z.object({
  id: z.string().min(1, 'Email ID is required'),
  accountId: z.string().min(1, 'Account ID is required'),
  subject: z.string().optional(),
  fromEmail: z.string().email('Valid from email is required'),
  fromName: z.string().optional(),
  toEmails: z.array(z.string().email()).default([]),
  ccEmails: z.array(z.string().email()).default([]),
  bccEmails: z.array(z.string().email()).default([]),
  bodyText: z.string().optional(),
  bodyHtml: z.string().optional(),
  threadId: z.string().optional(),
  direction: z.enum(['inbound', 'outbound']).default('inbound'),
  labels: z.array(z.string()).default([]),
  folder: z.string().default('inbox'),
  receivedAt: z.string().optional(),
  attachments: z.array(z.object({
    id: z.string(),
    filename: z.string(),
    mimeType: z.string(),
    size: z.number(),
    url: z.string().optional()
  })).default([])
});

const createEmailRuleSchema = z.object({
  accountId: z.string().optional(),
  name: z.string().min(1, 'Rule name is required'),
  description: z.string().optional(),
  trigger: z.object({
    type: z.enum(['new_email', 'reply', 'forward', 'label_change', 'schedule']),
    config: z.record(z.any()).default({})
  }),
  conditions: z.array(z.object({
    field: z.enum(['from', 'to', 'cc', 'subject', 'body', 'labels', 'sentiment', 'priority', 'category']),
    operator: z.enum(['equals', 'contains', 'startsWith', 'endsWith', 'matches', 'in', 'notIn']),
    value: z.union([z.string(), z.array(z.string())]),
    caseSensitive: z.boolean().default(false)
  })).default([]),
  actions: z.array(z.object({
    type: z.enum(['auto_reply', 'forward', 'label', 'archive', 'star', 'mark_important', 'create_task', 'notify', 'escalate', 'agent_process']),
    config: z.record(z.any()).default({}),
    requiresApproval: z.boolean().default(false)
  })).default([]),
  romaLevel: z.enum(['L1', 'L2', 'L3', 'L4', 'L5']).default('L2'),
  requiresApproval: z.boolean().default(false),
  isEnabled: z.boolean().default(true),
  priority: z.number().int().default(100)
});

router.post('/email/connect/gmail', async (req: Request, res: Response) => {
  try {
    const data = connectGmailSchema.parse(req.body);
    const account = await emailAutomationService.connectGmail(
      data.accessToken,
      data.refreshToken,
      data.email,
      data.userId,
      data.organizationId
    );
    res.json({ success: true, account });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return handleZodError(error, res);
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/email/connect/outlook', async (req: Request, res: Response) => {
  try {
    const data = connectOutlookSchema.parse(req.body);
    const account = await emailAutomationService.connectOutlook(
      data.accessToken,
      data.refreshToken,
      data.email,
      data.userId,
      data.organizationId
    );
    res.json({ success: true, account });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return handleZodError(error, res);
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/email/connect/imap', async (req: Request, res: Response) => {
  try {
    const data = connectImapSchema.parse(req.body);
    const account = await emailAutomationService.connectCustomImap(data);
    res.json({ success: true, account });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return handleZodError(error, res);
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/email/process', async (req: Request, res: Response) => {
  try {
    const data = processEmailSchema.parse(req.body);
    const result = await emailAutomationService.processEmail({
      id: data.id,
      accountId: data.accountId,
      threadId: data.threadId,
      subject: data.subject,
      fromEmail: data.fromEmail,
      fromName: data.fromName,
      toEmails: data.toEmails,
      ccEmails: data.ccEmails,
      bccEmails: data.bccEmails,
      bodyText: data.bodyText,
      bodyHtml: data.bodyHtml,
      isRead: false,
      isStarred: false,
      isImportant: false,
      isSpam: false,
      isDraft: false,
      isSent: data.direction === 'outbound',
      direction: data.direction,
      labels: data.labels,
      folder: data.folder,
      receivedAt: data.receivedAt ? new Date(data.receivedAt) : undefined,
      attachments: data.attachments,
      metadata: {}
    });
    res.json({ success: true, result });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return handleZodError(error, res);
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/email/automation-rule', async (req: Request, res: Response) => {
  try {
    const data = createEmailRuleSchema.parse(req.body);
    const rule = await emailAutomationService.createAutomationRule({
      accountId: data.accountId,
      name: data.name,
      description: data.description,
      trigger: data.trigger as any,
      conditions: data.conditions as any,
      actions: data.actions as any,
      romaLevel: data.romaLevel as any,
      requiresApproval: data.requiresApproval,
      isEnabled: data.isEnabled,
      priority: data.priority
    });
    res.json({ success: true, rule });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return handleZodError(error, res);
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/email/accounts', async (req: Request, res: Response) => {
  const accounts = emailAutomationService.getAccounts();
  res.json({ success: true, accounts });
});

router.get('/email/accounts/:accountId', async (req: Request, res: Response) => {
  const account = emailAutomationService.getAccount(req.params.accountId);
  if (!account) {
    return res.status(404).json({ success: false, error: 'Account not found' });
  }
  res.json({ success: true, account });
});

router.get('/email/automation-rules', async (req: Request, res: Response) => {
  const rules = emailAutomationService.getAutomationRules();
  res.json({ success: true, rules });
});

router.get('/email/stats', async (req: Request, res: Response) => {
  const stats = emailAutomationService.getStats();
  res.json({ success: true, stats });
});

const createVoiceAgentSchema = z.object({
  name: z.string().min(1, 'Agent name is required'),
  description: z.string().optional(),
  template: z.enum(['customer-support', 'sales-agent', 'appointment-scheduler', 'technical-support']).optional(),
  voiceProvider: z.enum(['elevenlabs', 'sarvam', 'azure', 'google']).optional(),
  voiceId: z.string().optional(),
  language: z.string().optional(),
  customSystemPrompt: z.string().optional(),
  customGreeting: z.string().optional(),
  phoneNumbers: z.array(z.string()).optional(),
  userId: z.string().optional(),
  organizationId: z.number().int().positive().optional()
});

const initiateCallSchema = z.object({
  agentId: z.string().min(1, 'Agent ID is required'),
  callerNumber: z.string().optional(),
  calledNumber: z.string().min(1, 'Called number is required')
});

const outboundCallSchema = z.object({
  agentId: z.string().min(1, 'Agent ID is required'),
  toNumber: z.string().min(1, 'To number is required'),
  fromNumber: z.string().optional(),
  context: z.record(z.any()).optional(),
  callbackUrl: z.string().url().optional()
});

const processAudioSchema = z.object({
  transcribedText: z.string().min(1, 'Transcribed text is required')
});

router.post('/voice/agent/create', async (req: Request, res: Response) => {
  try {
    const data = createVoiceAgentSchema.parse(req.body);
    const agent = await voiceAgentService.createVoiceAgent({
      userId: data.userId,
      organizationId: data.organizationId,
      name: data.name,
      description: data.description,
      template: data.template,
      voiceProvider: data.voiceProvider,
      voiceId: data.voiceId,
      language: data.language,
      customSystemPrompt: data.customSystemPrompt,
      customGreeting: data.customGreeting,
      phoneNumbers: data.phoneNumbers
    });
    res.json({ success: true, agent });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return handleZodError(error, res);
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/voice/agents', async (req: Request, res: Response) => {
  const agents = voiceAgentService.getAgents();
  res.json({ success: true, agents });
});

router.get('/voice/agents/:agentId', async (req: Request, res: Response) => {
  const agent = voiceAgentService.getAgent(req.params.agentId);
  if (!agent) {
    return res.status(404).json({ success: false, error: 'Voice agent not found' });
  }
  res.json({ success: true, agent });
});

router.post('/voice/call/inbound', async (req: Request, res: Response) => {
  try {
    const data = initiateCallSchema.parse(req.body);
    const call = await voiceAgentService.initiateInboundCall(
      data.agentId,
      data.callerNumber || 'unknown',
      data.calledNumber
    );
    res.json({ success: true, call });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return handleZodError(error, res);
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/voice/call/outbound', async (req: Request, res: Response) => {
  try {
    const data = outboundCallSchema.parse(req.body);
    const call = await voiceAgentService.initiateOutboundCall(data);
    res.json({ success: true, call });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return handleZodError(error, res);
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/voice/call/:callId/answer', async (req: Request, res: Response) => {
  try {
    const call = await voiceAgentService.answerCall(req.params.callId);
    res.json({ success: true, call });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/voice/call/:callId/process', async (req: Request, res: Response) => {
  try {
    const data = processAudioSchema.parse(req.body);
    const result = await voiceAgentService.processCallAudio(req.params.callId, data.transcribedText);
    res.json({ success: true, ...result });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return handleZodError(error, res);
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/voice/call/:callId/end', async (req: Request, res: Response) => {
  try {
    const call = await voiceAgentService.endCall(req.params.callId, req.body.outcome);
    res.json({ success: true, call });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/voice/calls/active', async (req: Request, res: Response) => {
  const calls = voiceAgentService.getActiveCalls();
  res.json({ success: true, calls });
});

router.get('/voice/providers', async (req: Request, res: Response) => {
  const providers = voiceAgentService.getVoiceProviders();
  res.json({ success: true, providers });
});

router.get('/voice/templates', async (req: Request, res: Response) => {
  const templates = voiceAgentService.getAgentTemplates();
  res.json({ success: true, templates });
});

router.get('/voice/stats', async (req: Request, res: Response) => {
  const stats = voiceAgentService.getStats();
  res.json({ success: true, stats });
});

const decomposeTaskSchema = z.object({
  task: z.string().min(1, 'Task description is required'),
  pattern: z.enum(['code_development', 'research_report', 'problem_solving', 'content_creation', 'data_analysis']).optional(),
  maxSubtasks: z.number().int().positive().max(20).optional(),
  context: z.record(z.any()).optional()
});

router.post('/orchestration/decompose', async (req: Request, res: Response) => {
  try {
    const data = decomposeTaskSchema.parse(req.body);
    const decomposition = await enhancedOrchestrationService.decomposeTask(data.task, {
      pattern: data.pattern,
      maxSubtasks: data.maxSubtasks,
      context: data.context
    });
    res.json({ success: true, decomposition });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return handleZodError(error, res);
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/orchestration/execute/:taskId', async (req: Request, res: Response) => {
  try {
    const result = await enhancedOrchestrationService.executeOrchestration(req.params.taskId);
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/orchestration/task/:taskId', async (req: Request, res: Response) => {
  const decomposition = enhancedOrchestrationService.getDecomposition(req.params.taskId);
  if (!decomposition) {
    return res.status(404).json({ success: false, error: 'Task not found' });
  }
  res.json({ success: true, decomposition });
});

router.get('/orchestration/result/:taskId', async (req: Request, res: Response) => {
  const result = enhancedOrchestrationService.getOrchestrationResult(req.params.taskId);
  if (!result) {
    return res.status(404).json({ success: false, error: 'Result not found' });
  }
  res.json({ success: true, result });
});

router.get('/orchestration/sub-agents', async (req: Request, res: Response) => {
  const agents = enhancedOrchestrationService.getSubAgents();
  res.json({ success: true, agents });
});

router.get('/orchestration/patterns', async (req: Request, res: Response) => {
  const patterns = enhancedOrchestrationService.getDecompositionPatterns();
  res.json({ success: true, patterns });
});

router.get('/orchestration/stats', async (req: Request, res: Response) => {
  const stats = enhancedOrchestrationService.getStats();
  res.json({ success: true, stats });
});

const processDocumentSchema = z.object({
  content: z.string().min(1, 'Document content is required'),
  filename: z.string().min(1, 'Filename is required'),
  mimeType: z.string().default('text/plain'),
  userId: z.string().optional(),
  organizationId: z.number().int().positive().optional(),
  options: z.object({
    extractTables: z.boolean().optional(),
    extractImages: z.boolean().optional(),
    extractForms: z.boolean().optional(),
    performOCR: z.boolean().optional(),
    generateSummary: z.boolean().optional(),
    generateEmbeddings: z.boolean().optional(),
    chunkSize: z.number().int().positive().max(2000).optional()
  }).optional()
});

router.post('/document/process', async (req: Request, res: Response) => {
  try {
    const data = processDocumentSchema.parse(req.body);
    const result = await documentIntelligenceService.processDocument({
      content: data.content,
      filename: data.filename,
      mimeType: data.mimeType,
      userId: data.userId,
      organizationId: data.organizationId,
      options: data.options
    });
    res.json({ success: true, result });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return handleZodError(error, res);
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/document/:documentId', async (req: Request, res: Response) => {
  const document = documentIntelligenceService.getDocument(req.params.documentId);
  if (!document) {
    return res.status(404).json({ success: false, error: 'Document not found' });
  }
  res.json({ success: true, document });
});

router.get('/document/:documentId/chunks', async (req: Request, res: Response) => {
  const chunks = documentIntelligenceService.getDocumentChunks(req.params.documentId);
  res.json({ success: true, chunks });
});

const searchDocumentsSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  userId: z.string().optional(),
  organizationId: z.number().int().positive().optional(),
  category: z.string().optional(),
  limit: z.number().int().positive().max(100).optional()
});

router.post('/document/search', async (req: Request, res: Response) => {
  try {
    const data = searchDocumentsSchema.parse(req.body);
    const results = await documentIntelligenceService.searchDocuments(data.query, {
      userId: data.userId,
      organizationId: data.organizationId,
      category: data.category,
      limit: data.limit
    });
    res.json({ success: true, results });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return handleZodError(error, res);
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/document/formats/supported', async (req: Request, res: Response) => {
  const formats = documentIntelligenceService.getSupportedFormats();
  res.json({ success: true, formats });
});

router.get('/document/categories', async (req: Request, res: Response) => {
  const categories = documentIntelligenceService.getCategories();
  res.json({ success: true, categories });
});

router.get('/document/stats', async (req: Request, res: Response) => {
  const stats = documentIntelligenceService.getStats();
  res.json({ success: true, stats });
});

const webSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  provider: z.string().optional(),
  maxResults: z.number().int().positive().max(50).optional(),
  freshness: z.enum(['day', 'week', 'month', 'year']).optional(),
  domains: z.array(z.string()).optional(),
  excludeDomains: z.array(z.string()).optional(),
  language: z.string().optional(),
  region: z.string().optional()
});

router.post('/web/search', async (req: Request, res: Response) => {
  try {
    const data = webSearchSchema.parse(req.body);
    const result = await webIntelligenceService.search(data.query, data);
    res.json({ success: true, result });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return handleZodError(error, res);
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

const webScrapeSchema = z.object({
  url: z.string().url('Valid URL is required'),
  extractTables: z.boolean().optional(),
  extractImages: z.boolean().optional(),
  extractLinks: z.boolean().optional(),
  performEntityExtraction: z.boolean().optional(),
  maxContentLength: z.number().int().positive().optional()
});

router.post('/web/scrape', async (req: Request, res: Response) => {
  try {
    const data = webScrapeSchema.parse(req.body);
    const result = await webIntelligenceService.scrapeUrl(data.url, data);
    res.json({ success: true, result });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return handleZodError(error, res);
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

const dataFeedSchema = z.object({
  name: z.string().min(1, 'Feed name is required'),
  sources: z.array(z.string()).min(1, 'At least one source is required'),
  updateFrequency: z.enum(['realtime', 'hourly', 'daily', 'weekly']),
  query: z.string().optional()
});

router.post('/web/feed/create', async (req: Request, res: Response) => {
  try {
    const data = dataFeedSchema.parse(req.body);
    const feed = await webIntelligenceService.createDataFeed(data);
    res.json({ success: true, feed });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return handleZodError(error, res);
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/web/feed/:feedId', async (req: Request, res: Response) => {
  const feed = webIntelligenceService.getDataFeed(req.params.feedId);
  if (!feed) {
    return res.status(404).json({ success: false, error: 'Feed not found' });
  }
  res.json({ success: true, feed });
});

router.post('/web/feed/:feedId/refresh', async (req: Request, res: Response) => {
  try {
    const feed = await webIntelligenceService.refreshDataFeed(req.params.feedId);
    if (!feed) {
      return res.status(404).json({ success: false, error: 'Feed not found' });
    }
    res.json({ success: true, feed });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/web/feeds', async (req: Request, res: Response) => {
  const feeds = webIntelligenceService.getDataFeeds();
  res.json({ success: true, feeds });
});

const competitorAnalysisSchema = z.object({
  competitors: z.array(z.string()).min(1, 'At least one competitor is required').max(10)
});

router.post('/web/analyze/competitors', async (req: Request, res: Response) => {
  try {
    const data = competitorAnalysisSchema.parse(req.body);
    const analysis = await webIntelligenceService.analyzeCompetitors(data.competitors);
    res.json({ success: true, analysis });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return handleZodError(error, res);
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

const marketIntelligenceSchema = z.object({
  industry: z.string().min(1, 'Industry is required'),
  region: z.string().optional()
});

router.post('/web/market-intelligence', async (req: Request, res: Response) => {
  try {
    const data = marketIntelligenceSchema.parse(req.body);
    const intelligence = await webIntelligenceService.getMarketIntelligence(data.industry, data.region);
    res.json({ success: true, intelligence });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return handleZodError(error, res);
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/web/providers', async (req: Request, res: Response) => {
  const providers = webIntelligenceService.getSearchProviders();
  res.json({ success: true, providers });
});

router.get('/web/stats', async (req: Request, res: Response) => {
  const stats = webIntelligenceService.getStats();
  res.json({ success: true, stats });
});

router.get('/dashboard/overview', async (req: Request, res: Response) => {
  const [emailStats, voiceStats, messagingStats, orchestrationStats, docStats, webStats, twinStats, obsStats] = await Promise.all([
    emailAutomationService.getStats(),
    voiceAgentService.getStats(),
    messagingAutomationService.getStats(),
    enhancedOrchestrationService.getStats(),
    documentIntelligenceService.getStats(),
    webIntelligenceService.getStats(),
    digitalTwinEngine.getStats(),
    wizardSmithObservability.getStats()
  ]);

  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    platform: {
      name: 'WAI SDK v3.0',
      version: '3.0.0',
      status: 'operational'
    },
    automation: {
      email: {
        accounts: emailStats.totalAccounts,
        rules: emailStats.totalRules,
        providers: ['gmail', 'outlook', 'imap']
      },
      voice: {
        agents: voiceStats.totalAgents,
        activeCalls: voiceStats.activeCalls,
        providers: voiceStats.providers,
        templates: voiceStats.templates
      },
      messaging: {
        channels: messagingStats.totalChannels,
        activeChannels: messagingStats.activeChannels,
        platforms: ['slack', 'teams', 'whatsapp', 'telegram', 'sms']
      }
    },
    intelligence: {
      orchestration: {
        subAgents: orchestrationStats.activeSubAgents,
        patterns: orchestrationStats.patterns,
        decompositions: orchestrationStats.totalDecompositions
      },
      documents: {
        total: docStats.totalDocuments,
        chunks: docStats.totalChunks,
        formats: docStats.supportedFormats
      },
      web: {
        cachedSearches: webStats.cachedSearches,
        cachedScrapes: webStats.cachedScrapes,
        dataFeeds: webStats.activeDataFeeds,
        providers: webStats.searchProviders
      }
    },
    monitoring: {
      digitalTwins: twinStats.totalTwins,
      interactions: twinStats.totalInteractions,
      traces: obsStats.totalTraces,
      alerts: obsStats.unresolvedAlerts
    },
    capabilities: {
      llmProviders: 23,
      agents: 550,
      protocols: ['A2A', 'MCP', 'ROMA', 'AG-UI', 'BMAD', 'Parlant'],
      integrations: 22
    }
  });
});

router.get('/dashboard/integrations', async (req: Request, res: Response) => {
  res.json({
    success: true,
    integrations: {
      email: [
        { id: 'gmail', name: 'Gmail', status: 'available', oauthRequired: true },
        { id: 'outlook', name: 'Microsoft Outlook', status: 'available', oauthRequired: true },
        { id: 'imap', name: 'IMAP/SMTP', status: 'available', oauthRequired: false }
      ],
      voice: [
        { id: 'elevenlabs', name: 'ElevenLabs', status: 'configured', languages: 10 },
        { id: 'sarvam', name: 'Sarvam AI', status: 'configured', languages: 16 },
        { id: 'azure', name: 'Azure Speech', status: 'available', languages: 13 },
        { id: 'google', name: 'Google Cloud TTS', status: 'available', languages: 14 }
      ],
      messaging: [
        { id: 'slack', name: 'Slack', status: 'available' },
        { id: 'teams', name: 'Microsoft Teams', status: 'available' },
        { id: 'whatsapp', name: 'WhatsApp Business', status: 'available' },
        { id: 'telegram', name: 'Telegram', status: 'available' },
        { id: 'twilio', name: 'Twilio SMS', status: 'available' }
      ],
      search: [
        { id: 'perplexity', name: 'Perplexity', status: 'configured' },
        { id: 'serper', name: 'Serper.dev', status: 'available' },
        { id: 'brave', name: 'Brave Search', status: 'available' },
        { id: 'tavily', name: 'Tavily', status: 'available' }
      ],
      llm: [
        { id: 'openai', name: 'OpenAI', status: 'configured', models: 15 },
        { id: 'anthropic', name: 'Anthropic', status: 'configured', models: 6 },
        { id: 'google', name: 'Google Gemini', status: 'configured', models: 8 },
        { id: 'xai', name: 'xAI Grok', status: 'configured', models: 3 },
        { id: 'deepseek', name: 'DeepSeek', status: 'configured', models: 4 },
        { id: 'groq', name: 'Groq', status: 'available', models: 6 }
      ],
      payment: [
        { id: 'stripe', name: 'Stripe', status: 'available' },
        { id: 'razorpay', name: 'Razorpay', status: 'available' }
      ]
    }
  });
});

router.get('/dashboard/workflows', async (req: Request, res: Response) => {
  res.json({
    success: true,
    workflows: {
      templates: [
        {
          id: 'email-to-task',
          name: 'Email to Task',
          description: 'Automatically create tasks from incoming emails',
          trigger: 'email.received',
          actions: ['classify', 'extract_entities', 'create_task', 'notify']
        },
        {
          id: 'voice-support',
          name: 'Voice Support Agent',
          description: 'Handle incoming support calls with AI agent',
          trigger: 'call.inbound',
          actions: ['greet', 'understand_intent', 'resolve_or_escalate', 'summarize']
        },
        {
          id: 'document-processing',
          name: 'Document Processing Pipeline',
          description: 'Automatically process and classify uploaded documents',
          trigger: 'document.uploaded',
          actions: ['extract_text', 'classify', 'extract_entities', 'store', 'notify']
        },
        {
          id: 'competitor-monitoring',
          name: 'Competitor Monitoring',
          description: 'Track competitor activities and market changes',
          trigger: 'schedule.daily',
          actions: ['search_web', 'analyze', 'summarize', 'alert']
        },
        {
          id: 'customer-onboarding',
          name: 'Customer Onboarding',
          description: 'Automated customer onboarding sequence',
          trigger: 'customer.created',
          actions: ['send_welcome', 'schedule_call', 'create_digital_twin', 'monitor']
        }
      ],
      triggers: [
        'email.received', 'email.sent', 'call.inbound', 'call.completed',
        'document.uploaded', 'message.received', 'schedule.hourly', 'schedule.daily',
        'customer.created', 'order.placed', 'payment.received', 'api.webhook'
      ],
      actions: [
        'send_email', 'make_call', 'send_message', 'create_task', 'update_crm',
        'classify', 'extract_entities', 'summarize', 'translate', 'search_web',
        'notify', 'escalate', 'log', 'api_call'
      ]
    }
  });
});

router.get('/v3/health', async (req: Request, res: Response) => {
  const [messagingStats, twinStats, obsStats, emailStats, voiceStats, orchestrationStats, docStats] = await Promise.all([
    messagingAutomationService.getStats(),
    digitalTwinEngine.getStats(),
    wizardSmithObservability.getStats(),
    emailAutomationService.getStats(),
    voiceAgentService.getStats(),
    enhancedOrchestrationService.getStats(),
    documentIntelligenceService.getStats()
  ]);
  
  res.json({
    success: true,
    status: 'healthy',
    version: '3.0.0',
    timestamp: new Date().toISOString(),
    services: {
      email: {
        status: 'operational',
        accounts: emailStats.totalAccounts,
        rules: emailStats.totalRules
      },
      voice: {
        status: 'operational',
        agents: voiceStats.totalAgents,
        activeCalls: voiceStats.activeCalls,
        providers: voiceStats.providers.length
      },
      messaging: {
        status: 'operational',
        channels: messagingStats.totalChannels,
        activeChannels: messagingStats.activeChannels
      },
      digitalTwin: {
        status: 'operational',
        twins: twinStats.totalTwins,
        interactions: twinStats.totalInteractions
      },
      orchestration: {
        status: 'operational',
        subAgents: orchestrationStats.activeSubAgents,
        patterns: orchestrationStats.patterns.length
      },
      documentIntelligence: {
        status: 'operational',
        documents: docStats.totalDocuments,
        formats: docStats.supportedFormats
      },
      observability: {
        status: 'operational',
        traces: obsStats.totalTraces,
        alertRules: obsStats.activeAlertRules,
        unresolvedAlerts: obsStats.unresolvedAlerts
      }
    },
    features: {
      p1: {
        emailAutomation: '100%',
        messagingAutomation: '100%',
        voiceAgents: '100%'
      },
      p2: {
        digitalTwin: '100%',
        wizardSmithObservability: '100%',
        enhancedOrchestration: '100%',
        documentIntelligence: '100%'
      }
    }
  });
});

export default router;
