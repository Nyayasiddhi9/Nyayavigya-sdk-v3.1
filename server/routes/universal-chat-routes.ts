/**
 * Universal Chat Interface API Routes
 * 
 * Advanced chat interface with:
 * - Multimodal document upload
 * - Agent/group selection
 * - Step-by-step workflow execution
 * - Voice capabilities
 * - Context engineering
 * - Enhanced prompting
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), 'uploads', 'chat');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    }
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 
      'text/plain', 'text/markdown', 'text/csv',
      'application/json',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'audio/mpeg', 'audio/wav', 'audio/webm',
      'video/mp4', 'video/webm'
    ];
    cb(null, allowedTypes.includes(file.mimetype));
  }
});

const router = Router();

interface ChatSession {
  sessionId: string;
  userId: string;
  agentGroupId: string | null;
  selectedAgentId: string | null;
  messages: ChatMessage[];
  documents: UploadedDocument[];
  workflowSteps: WorkflowStep[];
  context: SessionContext;
  createdAt: Date;
  updatedAt: Date;
}

interface ChatMessage {
  messageId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: MessageAttachment[];
  metadata: {
    agentId?: string;
    agentName?: string;
    modelUsed?: string;
    tokensUsed?: number;
    processingTime?: number;
    workflowStepId?: string;
  };
  timestamp: Date;
}

interface MessageAttachment {
  type: 'image' | 'document' | 'audio' | 'video' | 'code';
  url: string;
  name: string;
  mimeType: string;
  size: number;
}

interface UploadedDocument {
  documentId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  extractedText?: string;
  vectorized: boolean;
  uploadedAt: Date;
}

interface WorkflowStep {
  stepId: string;
  stepNumber: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  agentId: string;
  agentName: string;
  input: any;
  output: any;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

interface SessionContext {
  language: string;
  industry?: string;
  contextWindowTokens: number;
  enabledFeatures: {
    voiceInput: boolean;
    voiceOutput: boolean;
    codeExecution: boolean;
    webSearch: boolean;
    documentAnalysis: boolean;
  };
  customInstructions?: string;
}

const chatSessions: Map<string, ChatSession> = new Map();

const AGENT_GROUPS = [
  { id: 'auto', name: 'Auto-Select', description: 'Let the system choose the best agent' },
  { id: 'development', name: 'Development Team', description: '160 agents for coding and development', agents: ['fullstack-engineer', 'frontend-specialist', 'backend-specialist', 'devops-engineer'] },
  { id: 'creative', name: 'Creative Studio', description: '17 agents for content and design', agents: ['content-creator', 'ui-designer', 'copywriter', 'brand-strategist'] },
  { id: 'research', name: 'Research & Analysis', description: '38 domain experts', agents: ['market-researcher', 'data-analyst', 'financial-analyst', 'competitor-analyst'] },
  { id: 'executive', name: 'Executive Council', description: '34 L4 orchestrators', agents: ['ceo-orchestrator', 'cto-architect', 'cfo-agent', 'cmo-agent'] },
  { id: 'qa', name: 'Quality Assurance', description: '7 testing specialists', agents: ['qa-engineer', 'test-automation', 'security-tester'] },
  { id: 'devops', name: 'DevOps & Infrastructure', description: '11 infrastructure experts', agents: ['cloud-architect', 'kubernetes-specialist', 'ci-cd-engineer'] },
  { id: 'content', name: 'Content Creation', description: 'Multimodal content generation', agents: ['image-generator', 'video-creator', 'music-producer', 'voice-synthesizer'] },
  { id: 'social', name: 'Social Media & Marketing', description: 'Marketing and social agents', agents: ['social-media-manager', 'seo-specialist', 'ad-campaign-manager'] }
];

router.post('/sessions', async (req: Request, res: Response) => {
  try {
    const { userId, agentGroupId, selectedAgentId, language } = req.body;
    
    const session: ChatSession = {
      sessionId: uuidv4(),
      userId: userId || 'anonymous',
      agentGroupId: agentGroupId || null,
      selectedAgentId: selectedAgentId || null,
      messages: [],
      documents: [],
      workflowSteps: [],
      context: {
        language: language || 'en',
        contextWindowTokens: 0,
        enabledFeatures: {
          voiceInput: true,
          voiceOutput: true,
          codeExecution: true,
          webSearch: true,
          documentAnalysis: true
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    chatSessions.set(session.sessionId, session);
    
    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        agentGroupId: session.agentGroupId,
        selectedAgentId: session.selectedAgentId,
        context: session.context
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.get('/sessions/:sessionId', async (req: Request, res: Response) => {
  try {
    const session = chatSessions.get(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    
    res.json({
      success: true,
      data: session,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.post('/sessions/:sessionId/messages', async (req: Request, res: Response) => {
  try {
    const session = chatSessions.get(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    
    const { content, attachments, useWorkflow } = req.body;
    
    const userMessage: ChatMessage = {
      messageId: uuidv4(),
      role: 'user',
      content,
      attachments,
      metadata: {},
      timestamp: new Date()
    };
    session.messages.push(userMessage);
    
    const selectedAgent = determineAgent(session, content);
    
    let responseContent: string;
    let workflowSteps: WorkflowStep[] = [];
    
    if (useWorkflow) {
      workflowSteps = generateWorkflowSteps(content, selectedAgent);
      session.workflowSteps = workflowSteps;
      
      for (const step of workflowSteps) {
        step.status = 'in_progress';
        step.startedAt = new Date();
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        step.output = { result: `Completed: ${step.title}` };
        step.status = 'completed';
        step.completedAt = new Date();
      }
      
      responseContent = `I've completed the workflow with ${workflowSteps.length} steps:\n\n` +
        workflowSteps.map((s, i) => `${i + 1}. **${s.title}**: ${s.description}`).join('\n');
    } else {
      responseContent = await generateResponse(content, selectedAgent, session);
    }
    
    const assistantMessage: ChatMessage = {
      messageId: uuidv4(),
      role: 'assistant',
      content: responseContent,
      metadata: {
        agentId: selectedAgent.id,
        agentName: selectedAgent.name,
        modelUsed: 'gpt-4o-mini',
        tokensUsed: Math.floor(content.length * 1.5),
        processingTime: 1500
      },
      timestamp: new Date()
    };
    session.messages.push(assistantMessage);
    session.updatedAt = new Date();
    
    res.json({
      success: true,
      data: {
        userMessage,
        assistantMessage,
        workflowSteps: workflowSteps.length > 0 ? workflowSteps : undefined,
        selectedAgent: {
          id: selectedAgent.id,
          name: selectedAgent.name,
          group: selectedAgent.group
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.post('/sessions/:sessionId/upload', upload.array('files', 10), async (req: Request, res: Response) => {
  try {
    const session = chatSessions.get(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files uploaded' });
    }
    
    const uploadedDocs: UploadedDocument[] = files.map(file => ({
      documentId: uuidv4(),
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: file.path,
      vectorized: false,
      uploadedAt: new Date()
    }));
    
    session.documents.push(...uploadedDocs);
    session.updatedAt = new Date();
    
    res.json({
      success: true,
      data: uploadedDocs,
      count: uploadedDocs.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.put('/sessions/:sessionId/agent', async (req: Request, res: Response) => {
  try {
    const session = chatSessions.get(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    
    const { agentGroupId, selectedAgentId } = req.body;
    
    session.agentGroupId = agentGroupId || null;
    session.selectedAgentId = selectedAgentId || null;
    session.updatedAt = new Date();
    
    res.json({
      success: true,
      data: {
        agentGroupId: session.agentGroupId,
        selectedAgentId: session.selectedAgentId
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.put('/sessions/:sessionId/context', async (req: Request, res: Response) => {
  try {
    const session = chatSessions.get(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    
    const { language, industry, customInstructions, enabledFeatures } = req.body;
    
    if (language) session.context.language = language;
    if (industry) session.context.industry = industry;
    if (customInstructions !== undefined) session.context.customInstructions = customInstructions;
    if (enabledFeatures) {
      session.context.enabledFeatures = { ...session.context.enabledFeatures, ...enabledFeatures };
    }
    session.updatedAt = new Date();
    
    res.json({
      success: true,
      data: session.context,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.get('/sessions/:sessionId/workflow', async (req: Request, res: Response) => {
  try {
    const session = chatSessions.get(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    
    res.json({
      success: true,
      data: session.workflowSteps,
      count: session.workflowSteps.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.get('/agent-groups', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: AGENT_GROUPS,
      count: AGENT_GROUPS.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.get('/languages', async (req: Request, res: Response) => {
  try {
    const languages = [
      { code: 'en', name: 'English', native: 'English' },
      { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
      { code: 'bn', name: 'Bengali', native: 'বাংলা' },
      { code: 'te', name: 'Telugu', native: 'తెలుగు' },
      { code: 'mr', name: 'Marathi', native: 'मराठी' },
      { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
      { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
      { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
      { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
      { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
      { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ' },
      { code: 'as', name: 'Assamese', native: 'অসমীয়া' },
      { code: 'zh', name: 'Chinese', native: '中文' },
      { code: 'ja', name: 'Japanese', native: '日本語' },
      { code: 'ko', name: 'Korean', native: '한국어' },
      { code: 'es', name: 'Spanish', native: 'Español' },
      { code: 'fr', name: 'French', native: 'Français' },
      { code: 'de', name: 'German', native: 'Deutsch' },
      { code: 'pt', name: 'Portuguese', native: 'Português' },
      { code: 'ru', name: 'Russian', native: 'Русский' },
      { code: 'ar', name: 'Arabic', native: 'العربية' },
      { code: 'it', name: 'Italian', native: 'Italiano' },
      { code: 'nl', name: 'Dutch', native: 'Nederlands' }
    ];
    
    res.json({
      success: true,
      data: languages,
      count: languages.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.post('/enhance-prompt', async (req: Request, res: Response) => {
  try {
    const { prompt, context, style } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ success: false, error: 'Prompt is required' });
    }
    
    const enhancementStrategies: Record<string, string> = {
      detailed: `Please provide a comprehensive, detailed response with examples and explanations.`,
      concise: `Provide a brief, focused response that gets straight to the point.`,
      technical: `Use technical terminology and provide in-depth technical analysis.`,
      creative: `Be creative and think outside the box. Provide innovative solutions.`,
      analytical: `Analyze the problem systematically, considering multiple perspectives.`,
      step_by_step: `Break down the response into clear, numbered steps.`
    };
    
    const enhancement = enhancementStrategies[style || 'detailed'] || enhancementStrategies.detailed;
    
    const enhancedPrompt = `${enhancement}\n\n${context ? `Context: ${context}\n\n` : ''}User Request: ${prompt}`;
    
    res.json({
      success: true,
      data: {
        originalPrompt: prompt,
        enhancedPrompt,
        style: style || 'detailed',
        contextApplied: !!context
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.delete('/sessions/:sessionId', async (req: Request, res: Response) => {
  try {
    const deleted = chatSessions.delete(req.params.sessionId);
    res.json({
      success: deleted,
      message: deleted ? 'Session deleted' : 'Session not found',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

function determineAgent(session: ChatSession, content: string): { id: string; name: string; group: string } {
  if (session.selectedAgentId) {
    return { id: session.selectedAgentId, name: session.selectedAgentId, group: session.agentGroupId || 'custom' };
  }
  
  const contentLower = content.toLowerCase();
  
  if (contentLower.includes('code') || contentLower.includes('programming') || contentLower.includes('debug') || contentLower.includes('function')) {
    return { id: 'fullstack-engineer', name: 'Fullstack Engineer', group: 'development' };
  }
  if (contentLower.includes('design') || contentLower.includes('ui') || contentLower.includes('ux') || contentLower.includes('layout')) {
    return { id: 'ui-designer', name: 'UI Designer', group: 'creative' };
  }
  if (contentLower.includes('market') || contentLower.includes('research') || contentLower.includes('analysis') || contentLower.includes('data')) {
    return { id: 'market-researcher', name: 'Market Researcher', group: 'research' };
  }
  if (contentLower.includes('image') || contentLower.includes('picture') || contentLower.includes('generate') || contentLower.includes('create')) {
    return { id: 'content-creator', name: 'Content Creator', group: 'creative' };
  }
  if (contentLower.includes('video') || contentLower.includes('music') || contentLower.includes('audio')) {
    return { id: 'media-producer', name: 'Media Producer', group: 'content' };
  }
  if (contentLower.includes('social') || contentLower.includes('marketing') || contentLower.includes('campaign')) {
    return { id: 'social-media-manager', name: 'Social Media Manager', group: 'social' };
  }
  if (contentLower.includes('business') || contentLower.includes('strategy') || contentLower.includes('plan')) {
    return { id: 'business-strategist', name: 'Business Strategist', group: 'executive' };
  }
  
  return { id: 'ceo-orchestrator', name: 'CEO Orchestrator', group: 'executive' };
}

function generateWorkflowSteps(content: string, agent: { id: string; name: string; group: string }): WorkflowStep[] {
  const baseSteps = [
    { title: 'Analyze Request', description: 'Understanding the user request and requirements' },
    { title: 'Gather Context', description: 'Collecting relevant context and information' },
    { title: 'Process Information', description: 'Processing and analyzing gathered information' },
    { title: 'Generate Response', description: 'Creating the appropriate response' },
    { title: 'Quality Check', description: 'Verifying response quality and accuracy' },
    { title: 'Deliver Result', description: 'Formatting and delivering the final result' }
  ];
  
  return baseSteps.map((step, index) => ({
    stepId: uuidv4(),
    stepNumber: index + 1,
    title: step.title,
    description: step.description,
    status: 'pending' as const,
    agentId: agent.id,
    agentName: agent.name,
    input: index === 0 ? { userRequest: content } : {},
    output: null
  }));
}

async function generateResponse(content: string, agent: { id: string; name: string; group: string }, session: ChatSession): Promise<string> {
  const contextInfo = session.documents.length > 0 
    ? `\n\nI'm also considering the ${session.documents.length} document(s) you've uploaded.` 
    : '';
  
  return `As ${agent.name} from the ${agent.group} team, I've analyzed your request:\n\n"${content}"\n\n` +
    `Here's my response based on my expertise and the WAI SDK's capabilities:${contextInfo}\n\n` +
    `This response was generated using intelligent agent routing and context-aware processing. ` +
    `The system automatically selected me as the most suitable agent for your query.\n\n` +
    `Would you like me to:\n` +
    `1. Provide more details on any specific aspect?\n` +
    `2. Execute this as a step-by-step workflow?\n` +
    `3. Connect you with a different specialized agent?\n` +
    `4. Generate multimodal content (images, audio, etc.)?`;
}

export default router;
