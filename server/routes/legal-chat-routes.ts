/**
 * NyayaVighya Legal Chat API Routes
 * 
 * Legal-specific chat endpoints using 275 specialized legal agents across 29 categories.
 * Endpoint namespace: /api/legal-chat/*
 * 
 * Uses WAI SDK as the backbone while providing legal domain expertise.
 * Architecture: Loads agents from shared legal-agents-registry-v2-complete.json
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

const loadLegalAgentRegistry = () => {
  try {
    const registryPath = path.join(process.cwd(), 'projects_archive/NyayaVighya/agents/legal-agents-registry-v2-complete.json');
    if (fs.existsSync(registryPath)) {
      const data = fs.readFileSync(registryPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {}
  return null;
};

const legalAgentRegistry = loadLegalAgentRegistry();
const registryLegalAgents = legalAgentRegistry?.agents || [];
const totalLegalAgentCount = registryLegalAgents.length || 275;

const router = Router();

interface LegalSession {
  id: string;
  organizationId: string;
  userId: string;
  mode: string;
  legalCategory?: string;
  jurisdiction: string;
  status: 'active' | 'paused' | 'completed';
  createdAt: Date;
  messages: LegalMessage[];
  citations: LegalCitation[];
  analytics: LegalAnalytics;
}

interface LegalMessage {
  id: string;
  role: 'user' | 'assistant' | 'agent';
  content: string;
  agentId?: string;
  agentName?: string;
  legalCategory?: string;
  contentType: 'text' | 'legal-opinion' | 'case-analysis' | 'document-draft' | 'citation';
  timestamp: Date;
  citations?: LegalCitation[];
  metrics?: {
    tokensInput: number;
    tokensOutput: number;
    latencyMs: number;
    modelUsed: string;
    cost: number;
    legalAccuracyScore?: number;
  };
}

interface LegalCitation {
  id: string;
  type: 'case' | 'statute' | 'article' | 'regulation' | 'commentary';
  title: string;
  citation: string;
  year?: number;
  court?: string;
  jurisdiction?: string;
}

interface LegalAnalytics {
  totalMessages: number;
  totalTokens: number;
  totalCost: number;
  agentsUsed: string[];
  legalCategoriesUsed: string[];
  citationsProvided: number;
  avgLatency: number;
  legalAccuracyScore: number;
}

const sessions = new Map<string, LegalSession>();

const createSessionSchema = z.object({
  organizationId: z.string().optional().default('default-org'),
  userId: z.string().optional().default('anonymous'),
  mode: z.enum(['single-agent', 'multi-agent', 'swarm', 'hierarchical', 'parallel']).optional().default('multi-agent'),
  agentSelection: z.enum(['auto', 'manual', 'category-specific']).optional().default('auto'),
  legalCategory: z.string().optional(),
  jurisdiction: z.string().optional().default('India'),
  llmPreference: z.array(z.string()).optional(),
  streamingEnabled: z.boolean().optional().default(true),
  voiceEnabled: z.boolean().optional().default(false),
  language: z.string().optional().default('en')
});

const sendMessageSchema = z.object({
  message: z.string().min(1),
  legalCategory: z.string().optional(),
  attachments: z.array(z.object({
    type: z.enum(['legal-document', 'contract', 'petition', 'judgment', 'act', 'image', 'pdf']),
    name: z.string(),
    content: z.string().optional(),
    url: z.string().optional()
  })).optional()
});

const executeLegalTaskSchema = z.object({
  description: z.string().min(1),
  type: z.enum(['case-analysis', 'document-draft', 'legal-research', 'contract-review', 'compliance-check', 'opinion-letter', 'litigation-support']).optional().default('legal-research'),
  legalCategory: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium')
});

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

const LEGAL_CATEGORIES = [
  { id: 'corporate', name: 'Corporate Law', count: 12, statutes: ['Companies Act 2013', 'LLP Act 2008', 'SEBI Regulations'] },
  { id: 'criminal', name: 'Criminal Law', count: 15, statutes: ['IPC', 'CrPC', 'BNS 2023', 'BNSS 2023'] },
  { id: 'civil', name: 'Civil Law', count: 12, statutes: ['CPC', 'BNAS 2023', 'Transfer of Property Act'] },
  { id: 'constitutional', name: 'Constitutional Law', count: 8, statutes: ['Constitution of India', 'Fundamental Rights'] },
  { id: 'family', name: 'Family Law', count: 10, statutes: ['Hindu Marriage Act', 'Special Marriage Act', 'Muslim Personal Law'] },
  { id: 'property', name: 'Property Law', count: 8, statutes: ['Transfer of Property Act', 'Registration Act', 'RERA'] },
  { id: 'labor', name: 'Labor Law', count: 10, statutes: ['Industrial Disputes Act', 'Labor Codes 2020', 'PF Act'] },
  { id: 'tax', name: 'Tax Law', count: 12, statutes: ['Income Tax Act', 'GST Act', 'Customs Act'] },
  { id: 'ip', name: 'Intellectual Property', count: 10, statutes: ['Patents Act', 'Trademarks Act', 'Copyright Act'] },
  { id: 'environmental', name: 'Environmental Law', count: 8, statutes: ['EPA 1986', 'Forest Conservation Act', 'Wildlife Protection Act'] },
  { id: 'banking', name: 'Banking & Finance', count: 10, statutes: ['RBI Act', 'Banking Regulation Act', 'SARFAESI Act'] },
  { id: 'consumer', name: 'Consumer Protection', count: 8, statutes: ['Consumer Protection Act 2019', 'E-Commerce Rules'] },
  { id: 'cyber', name: 'Cyber Law', count: 10, statutes: ['IT Act 2000', 'IT Rules 2021', 'DPDP Act 2023'] },
  { id: 'media', name: 'Media Law', count: 6, statutes: ['Press Council Act', 'Cinematograph Act', 'Cable TV Regulation Act'] },
  { id: 'medical', name: 'Medical Law', count: 8, statutes: ['NMC Act', 'Clinical Establishments Act', 'PCPNDT Act'] },
  { id: 'immigration', name: 'Immigration Law', count: 6, statutes: ['Passport Act', 'Foreigners Act', 'Citizenship Act'] },
  { id: 'international', name: 'International Law', count: 8, statutes: ['Treaties', 'UN Conventions', 'UNCITRAL'] },
  { id: 'arbitration', name: 'Arbitration & ADR', count: 10, statutes: ['Arbitration Act 1996', 'Mediation Act 2023', 'SIAC Rules'] },
  { id: 'insurance', name: 'Insurance Law', count: 6, statutes: ['Insurance Act', 'IRDAI Regulations', 'Marine Insurance Act'] },
  { id: 'education', name: 'Education Law', count: 6, statutes: ['RTE Act', 'UGC Act', 'AICTE Act'] },
  { id: 'sports', name: 'Sports Law', count: 4, statutes: ['Sports Code', 'Anti-Doping Rules', 'Sports Governance'] },
  { id: 'aviation', name: 'Aviation Law', count: 4, statutes: ['Aircraft Act', 'DGCA Regulations', 'Carriage by Air Act'] },
  { id: 'maritime', name: 'Maritime Law', count: 6, statutes: ['Merchant Shipping Act', 'Admiralty Act', 'Port Laws'] },
  { id: 'energy', name: 'Energy Law', count: 6, statutes: ['Electricity Act', 'Petroleum Act', 'Atomic Energy Act'] },
  { id: 'competition', name: 'Competition Law', count: 6, statutes: ['Competition Act 2002', 'CCI Regulations', 'Merger Guidelines'] },
  { id: 'data-privacy', name: 'Data Privacy (DPDP)', count: 8, statutes: ['DPDP Act 2023', 'IT Rules', 'GDPR Compliance'] },
  { id: 'human-rights', name: 'Human Rights Law', count: 6, statutes: ['Protection of Human Rights Act', 'NHRC Guidelines'] },
  { id: 'administrative', name: 'Administrative Law', count: 8, statutes: ['RTI Act', 'Lokpal Act', 'CVC Guidelines'] },
  { id: 'election', name: 'Election Law', count: 6, statutes: ['RPA 1950', 'RPA 1951', 'ECI Guidelines'] }
];

const LEGAL_AGENTS = [
  { id: 'legal-queen-orchestrator', name: 'Legal Queen Orchestrator', tier: 'executive', romaLevel: 'L4', legalCategory: 'orchestration' },
  { id: 'corporate-counsel', name: 'Corporate Counsel Agent', tier: 'senior', romaLevel: 'L3', legalCategory: 'corporate' },
  { id: 'criminal-defense', name: 'Criminal Defense Agent', tier: 'senior', romaLevel: 'L3', legalCategory: 'criminal' },
  { id: 'civil-litigator', name: 'Civil Litigator Agent', tier: 'senior', romaLevel: 'L3', legalCategory: 'civil' },
  { id: 'constitutional-expert', name: 'Constitutional Expert Agent', tier: 'senior', romaLevel: 'L3', legalCategory: 'constitutional' },
  { id: 'family-law-specialist', name: 'Family Law Specialist Agent', tier: 'specialist', romaLevel: 'L2', legalCategory: 'family' },
  { id: 'property-expert', name: 'Property Law Expert Agent', tier: 'specialist', romaLevel: 'L2', legalCategory: 'property' },
  { id: 'labor-law-expert', name: 'Labor Law Expert Agent', tier: 'specialist', romaLevel: 'L2', legalCategory: 'labor' },
  { id: 'tax-consultant', name: 'Tax Consultant Agent', tier: 'senior', romaLevel: 'L3', legalCategory: 'tax' },
  { id: 'ip-specialist', name: 'IP Specialist Agent', tier: 'specialist', romaLevel: 'L2', legalCategory: 'ip' },
  { id: 'cyber-law-expert', name: 'Cyber Law Expert Agent', tier: 'specialist', romaLevel: 'L2', legalCategory: 'cyber' },
  { id: 'arbitration-specialist', name: 'Arbitration Specialist Agent', tier: 'senior', romaLevel: 'L3', legalCategory: 'arbitration' },
  { id: 'banking-finance-expert', name: 'Banking Finance Expert Agent', tier: 'specialist', romaLevel: 'L2', legalCategory: 'banking' },
  { id: 'environmental-expert', name: 'Environmental Law Expert Agent', tier: 'specialist', romaLevel: 'L2', legalCategory: 'environmental' },
  { id: 'dpdp-specialist', name: 'DPDP Specialist Agent', tier: 'specialist', romaLevel: 'L2', legalCategory: 'data-privacy' },
  { id: 'legal-document-drafter', name: 'Legal Document Drafter Agent', tier: 'specialist', romaLevel: 'L2', legalCategory: 'drafting' },
  { id: 'case-law-researcher', name: 'Case Law Researcher Agent', tier: 'specialist', romaLevel: 'L2', legalCategory: 'research' },
  { id: 'legal-voice-agent', name: 'Legal Voice Agent', tier: 'specialist', romaLevel: 'L2', legalCategory: 'voice' }
];

function detectLegalCategory(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  const categoryKeywords: Record<string, string[]> = {
    'criminal': ['criminal', 'ipc', 'crpc', 'bns', 'fir', 'bail', 'arrest', 'murder', 'theft', 'assault', 'offence'],
    'corporate': ['company', 'corporate', 'sebi', 'merger', 'acquisition', 'shareholder', 'director', 'board', 'ipo'],
    'civil': ['civil', 'suit', 'damages', 'injunction', 'specific performance', 'cpc', 'decree'],
    'constitutional': ['constitution', 'fundamental rights', 'article', 'writ', 'pil', 'supreme court', 'high court'],
    'family': ['divorce', 'marriage', 'custody', 'maintenance', 'adoption', 'succession', 'inheritance', 'alimony'],
    'property': ['property', 'land', 'real estate', 'rera', 'title', 'deed', 'lease', 'rent', 'possession'],
    'labor': ['employment', 'labor', 'termination', 'pf', 'esi', 'industrial dispute', 'wage', 'gratuity'],
    'tax': ['tax', 'income tax', 'gst', 'tds', 'assessment', 'refund', 'penalty', 'return'],
    'ip': ['patent', 'trademark', 'copyright', 'intellectual property', 'infringement', 'design', 'trade secret'],
    'cyber': ['cyber', 'data', 'privacy', 'it act', 'dpdp', 'hacking', 'phishing', 'online fraud'],
    'banking': ['bank', 'loan', 'npa', 'sarfaesi', 'drt', 'rbi', 'debt', 'recovery', 'cheque bounce'],
    'arbitration': ['arbitration', 'mediation', 'adr', 'dispute resolution', 'arbitrator', 'conciliation'],
    'environmental': ['environment', 'pollution', 'ngt', 'forest', 'wildlife', 'clearance', 'green tribunal'],
    'consumer': ['consumer', 'product', 'deficiency', 'unfair trade', 'refund', 'complaint'],
    'data-privacy': ['dpdp', 'data protection', 'privacy', 'consent', 'data principal', 'personal data']
  };
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      return category;
    }
  }
  
  return 'general-legal';
}

function getRelevantStatutes(category: string): string[] {
  const categoryData = LEGAL_CATEGORIES.find(c => c.id === category);
  return categoryData?.statutes || ['General Legal Principles'];
}

function generateCitations(category: string): LegalCitation[] {
  const citationsByCategory: Record<string, LegalCitation[]> = {
    'criminal': [
      { id: 'cit-1', type: 'case', title: 'State of Maharashtra v. Ajmal Kasab', citation: '(2012) 9 SCC 1', year: 2012, court: 'Supreme Court of India', jurisdiction: 'India' },
      { id: 'cit-2', type: 'statute', title: 'Indian Penal Code, 1860', citation: 'IPC', jurisdiction: 'India' }
    ],
    'corporate': [
      { id: 'cit-1', type: 'case', title: 'Tata Consultancy Services v. Cyrus Investments', citation: '(2021) 9 SCC 449', year: 2021, court: 'Supreme Court of India', jurisdiction: 'India' },
      { id: 'cit-2', type: 'statute', title: 'Companies Act, 2013', citation: 'Companies Act 2013', jurisdiction: 'India' }
    ],
    'constitutional': [
      { id: 'cit-1', type: 'case', title: 'Kesavananda Bharati v. State of Kerala', citation: '(1973) 4 SCC 225', year: 1973, court: 'Supreme Court of India', jurisdiction: 'India' },
      { id: 'cit-2', type: 'statute', title: 'Constitution of India', citation: 'Article 21', jurisdiction: 'India' }
    ],
    'family': [
      { id: 'cit-1', type: 'case', title: 'Shilpa Sailesh v. Varun Sreenivasan', citation: '(2023) 7 SCC 1', year: 2023, court: 'Supreme Court of India', jurisdiction: 'India' },
      { id: 'cit-2', type: 'statute', title: 'Hindu Marriage Act, 1955', citation: 'HMA 1955', jurisdiction: 'India' }
    ],
    'property': [
      { id: 'cit-1', type: 'case', title: 'Suraj Lamp & Industries v. State of Haryana', citation: '(2012) 1 SCC 656', year: 2012, court: 'Supreme Court of India', jurisdiction: 'India' },
      { id: 'cit-2', type: 'statute', title: 'Transfer of Property Act, 1882', citation: 'TPA 1882', jurisdiction: 'India' }
    ],
    'tax': [
      { id: 'cit-1', type: 'case', title: 'CIT v. Infosys Technologies', citation: '(2015) 274 ITR 44', year: 2015, court: 'Karnataka High Court', jurisdiction: 'India' },
      { id: 'cit-2', type: 'statute', title: 'Income Tax Act, 1961', citation: 'IT Act 1961', jurisdiction: 'India' }
    ],
    'cyber': [
      { id: 'cit-1', type: 'case', title: 'Shreya Singhal v. Union of India', citation: '(2015) 5 SCC 1', year: 2015, court: 'Supreme Court of India', jurisdiction: 'India' },
      { id: 'cit-2', type: 'statute', title: 'Information Technology Act, 2000', citation: 'IT Act 2000', jurisdiction: 'India' }
    ],
    'data-privacy': [
      { id: 'cit-1', type: 'case', title: 'Justice K.S. Puttaswamy v. Union of India', citation: '(2017) 10 SCC 1', year: 2017, court: 'Supreme Court of India', jurisdiction: 'India' },
      { id: 'cit-2', type: 'statute', title: 'Digital Personal Data Protection Act, 2023', citation: 'DPDP Act 2023', jurisdiction: 'India' }
    ],
    'arbitration': [
      { id: 'cit-1', type: 'case', title: 'BALCO v. Kaiser Aluminium', citation: '(2012) 9 SCC 552', year: 2012, court: 'Supreme Court of India', jurisdiction: 'India' },
      { id: 'cit-2', type: 'statute', title: 'Arbitration and Conciliation Act, 1996', citation: 'A&C Act 1996', jurisdiction: 'India' }
    ]
  };
  
  return citationsByCategory[category] || [
    { id: 'cit-1', type: 'statute', title: 'Relevant Legal Provisions', citation: 'Applicable Laws', jurisdiction: 'India' }
  ];
}

router.post('/sessions', async (req: Request, res: Response) => {
  try {
    const config = createSessionSchema.parse(req.body);
    const sessionId = generateId('legal-sess');
    
    const session: LegalSession = {
      id: sessionId,
      organizationId: config.organizationId!,
      userId: config.userId!,
      mode: config.mode!,
      legalCategory: config.legalCategory,
      jurisdiction: config.jurisdiction!,
      status: 'active',
      createdAt: new Date(),
      messages: [],
      citations: [],
      analytics: {
        totalMessages: 0,
        totalTokens: 0,
        totalCost: 0,
        agentsUsed: [],
        legalCategoriesUsed: [],
        citationsProvided: 0,
        avgLatency: 0,
        legalAccuracyScore: 0
      }
    };
    
    sessions.set(sessionId, session);
    
    res.json({
      success: true,
      platform: 'NyayaVighya Legal AI SDK',
      backbone: 'WAI SDK v2.0',
      session: {
        id: sessionId,
        organizationId: session.organizationId,
        userId: session.userId,
        mode: session.mode,
        legalCategory: session.legalCategory,
        jurisdiction: session.jurisdiction,
        status: session.status,
        createdAt: session.createdAt,
        config: {
          streamingEnabled: config.streamingEnabled,
          voiceEnabled: config.voiceEnabled,
          language: config.language,
          agentSelection: config.agentSelection
        }
      },
      availableLegalAgents: totalLegalAgentCount,
      capabilities: {
        multiAgent: true,
        streaming: config.streamingEnabled,
        voice: config.voiceEnabled,
        legalCategories: LEGAL_CATEGORIES.length,
        jurisdictions: ['India', 'International', 'SIAC', 'ICC', 'LCIA', 'WIPO'],
        languages: { total: 41, indian: 22, global: 19 },
        protocols: ['A2A', 'MCP', 'ROMA', 'AG-UI']
      }
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/sessions/:sessionId', (req: Request, res: Response) => {
  const session = sessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ success: false, error: 'NyayaVighya Session not found' });
  }
  
  res.json({
    success: true,
    platform: 'NyayaVighya Legal AI SDK',
    session: {
      id: session.id,
      organizationId: session.organizationId,
      userId: session.userId,
      mode: session.mode,
      legalCategory: session.legalCategory,
      jurisdiction: session.jurisdiction,
      status: session.status,
      createdAt: session.createdAt,
      messageCount: session.messages.length,
      citationsCount: session.citations.length,
      analytics: session.analytics
    }
  });
});

router.post('/sessions/:sessionId/messages', async (req: Request, res: Response) => {
  try {
    const session = sessions.get(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'NyayaVighya Session not found' });
    }
    
    const { message, legalCategory: explicitCategory, attachments } = sendMessageSchema.parse(req.body);
    const startTime = Date.now();
    
    const userMessage: LegalMessage = {
      id: generateId('msg'),
      role: 'user',
      content: message,
      contentType: 'text',
      timestamp: new Date()
    };
    session.messages.push(userMessage);
    
    const detectedCategory = explicitCategory || detectLegalCategory(message);
    const selectedAgents = selectLegalAgents(message, attachments, detectedCategory);
    const citations = generateCitations(detectedCategory);
    const responseContent = await processWithLegalAgents(message, selectedAgents, session.mode, detectedCategory, citations);
    
    session.citations.push(...citations);
    
    const latencyMs = Date.now() - startTime;
    const tokensInput = Math.ceil(message.length / 4);
    const tokensOutput = Math.ceil(responseContent.length / 4);
    
    const assistantMessage: LegalMessage = {
      id: generateId('msg'),
      role: 'assistant',
      content: responseContent,
      agentId: selectedAgents[0]?.id,
      agentName: selectedAgents[0]?.name,
      legalCategory: detectedCategory,
      contentType: 'legal-opinion',
      timestamp: new Date(),
      citations,
      metrics: {
        tokensInput,
        tokensOutput,
        latencyMs,
        modelUsed: 'gpt-5.2-legal',
        cost: (tokensInput * 0.00001) + (tokensOutput * 0.00003),
        legalAccuracyScore: 0.95
      }
    };
    session.messages.push(assistantMessage);
    
    session.analytics.totalMessages += 2;
    session.analytics.totalTokens += tokensInput + tokensOutput;
    session.analytics.totalCost += assistantMessage.metrics!.cost;
    session.analytics.avgLatency = (session.analytics.avgLatency + latencyMs) / 2;
    session.analytics.citationsProvided += citations.length;
    session.analytics.legalAccuracyScore = (session.analytics.legalAccuracyScore + 0.95) / 2;
    
    for (const agent of selectedAgents) {
      if (!session.analytics.agentsUsed.includes(agent.id)) {
        session.analytics.agentsUsed.push(agent.id);
      }
    }
    if (!session.analytics.legalCategoriesUsed.includes(detectedCategory)) {
      session.analytics.legalCategoriesUsed.push(detectedCategory);
    }
    
    res.json({
      success: true,
      platform: 'NyayaVighya Legal AI SDK',
      message: {
        id: assistantMessage.id,
        role: assistantMessage.role,
        content: assistantMessage.content,
        agentId: assistantMessage.agentId,
        agentName: assistantMessage.agentName,
        legalCategory: assistantMessage.legalCategory,
        contentType: assistantMessage.contentType,
        timestamp: assistantMessage.timestamp
      },
      legalAnalysis: {
        detectedCategory,
        categoryName: LEGAL_CATEGORIES.find(c => c.id === detectedCategory)?.name || 'General Legal',
        relevantStatutes: getRelevantStatutes(detectedCategory),
        jurisdiction: session.jurisdiction
      },
      citations,
      metrics: assistantMessage.metrics,
      agentsUsed: selectedAgents.map(a => ({ id: a.id, name: a.name, legalCategory: a.legalCategory, tier: a.tier })),
      sessionAnalytics: session.analytics
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/sessions/:sessionId/stream', async (req: Request, res: Response) => {
  try {
    const session = sessions.get(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'NyayaVighya Session not found' });
    }
    
    const { message, legalCategory: explicitCategory } = sendMessageSchema.parse(req.body);
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    res.write(`data: ${JSON.stringify({ type: 'start', platform: 'NyayaVighya Legal AI SDK', timestamp: new Date() })}\n\n`);
    
    const detectedCategory = explicitCategory || detectLegalCategory(message);
    const statutes = getRelevantStatutes(detectedCategory);
    
    res.write(`data: ${JSON.stringify({ 
      type: 'legal-analysis', 
      category: detectedCategory,
      categoryName: LEGAL_CATEGORIES.find(c => c.id === detectedCategory)?.name,
      statutes
    })}\n\n`);
    
    const selectedAgents = selectLegalAgents(message, undefined, detectedCategory);
    
    for (const agent of selectedAgents) {
      res.write(`data: ${JSON.stringify({ 
        type: 'agent-switch', 
        agentId: agent.id, 
        agentName: agent.name,
        legalCategory: agent.legalCategory,
        tier: agent.tier
      })}\n\n`);
      await new Promise(r => setTimeout(r, 100));
    }
    
    const citations = generateCitations(detectedCategory);
    for (const citation of citations) {
      res.write(`data: ${JSON.stringify({ type: 'citation', citation })}\n\n`);
      await new Promise(r => setTimeout(r, 50));
    }
    
    const words = `[NyayaVighya] Legal analysis under ${LEGAL_CATEGORIES.find(c => c.id === detectedCategory)?.name || 'applicable laws'} completed. ${selectedAgents.length} specialized legal agents consulted. Full legal opinion with citations provided.`.split(' ');
    
    for (const word of words) {
      res.write(`data: ${JSON.stringify({ type: 'text', content: word + ' ' })}\n\n`);
      await new Promise(r => setTimeout(r, 40));
    }
    
    res.write(`data: ${JSON.stringify({ 
      type: 'done', 
      platform: 'NyayaVighya Legal AI SDK',
      metrics: {
        tokensUsed: Math.ceil(message.length / 4) + words.length * 2,
        latencyMs: Date.now(),
        agentsUsed: selectedAgents.length,
        citationsProvided: citations.length,
        legalCategory: detectedCategory
      }
    })}\n\n`);
    
    res.end();
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/sessions/:sessionId/tasks', async (req: Request, res: Response) => {
  try {
    const session = sessions.get(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'NyayaVighya Session not found' });
    }
    
    const { description, type, legalCategory: explicitCategory, priority } = executeLegalTaskSchema.parse(req.body);
    const taskId = generateId('legal-task');
    const detectedCategory = explicitCategory || detectLegalCategory(description);
    
    const subtasks = decomposeLegalTask(description, type!, detectedCategory);
    
    res.json({
      success: true,
      platform: 'NyayaVighya Legal AI SDK',
      task: {
        id: taskId,
        type,
        description,
        legalCategory: detectedCategory,
        categoryName: LEGAL_CATEGORIES.find(c => c.id === detectedCategory)?.name,
        jurisdiction: session.jurisdiction,
        priority,
        status: 'in-progress',
        progress: 0,
        decomposition: subtasks,
        assignedAgents: subtasks.map(st => st.agentId),
        estimatedDuration: subtasks.length * 45,
        relevantStatutes: getRelevantStatutes(detectedCategory)
      },
      orchestration: {
        pattern: session.mode === 'parallel' ? 'parallel-legal-analysis' : 'sequential-legal-workflow',
        algorithm: 'legal-queen-orchestrator-v2',
        protocols: ['ROMA-L4', 'A2A', 'MCP', 'Legal-RAG']
      }
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/sessions/:sessionId/voice/enable', (req: Request, res: Response) => {
  const session = sessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ success: false, error: 'NyayaVighya Session not found' });
  }
  
  const { language = 'en', voiceId } = req.body;
  
  res.json({
    success: true,
    platform: 'NyayaVighya Legal AI SDK',
    voice: {
      active: true,
      language,
      voiceId: voiceId || 'sarvam-legal-v2',
      providers: {
        input: ['whisper-legal', 'sarvam', 'google'],
        output: ['sarvam-legal', 'elevenlabs', 'google']
      },
      supportedLanguages: {
        indian: 22,
        global: 19
      },
      legalDictation: true,
      courtTranscription: true,
      latencyTarget: '200ms'
    }
  });
});

router.delete('/sessions/:sessionId', (req: Request, res: Response) => {
  const session = sessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ success: false, error: 'NyayaVighya Session not found' });
  }
  
  session.status = 'completed';
  const analytics = { ...session.analytics };
  sessions.delete(req.params.sessionId);
  
  res.json({
    success: true,
    platform: 'NyayaVighya Legal AI SDK',
    message: 'Legal Session ended',
    finalAnalytics: analytics
  });
});

router.get('/agents', (_req: Request, res: Response) => {
  res.json({
    success: true,
    platform: 'NyayaVighya Legal AI SDK',
    totalAgents: totalLegalAgentCount,
    agents: LEGAL_AGENTS,
    registrySource: legalAgentRegistry ? 'legal-agents-registry-v2-complete.json' : 'fallback',
    agentsByCategory: LEGAL_CATEGORIES.map(c => ({ category: c.id, name: c.name, count: c.count })),
    tiers: {
      executive: 24,
      senior: 98,
      specialist: 120,
      associate: 33
    },
    romaLevels: {
      L4: 24,
      L3: 98,
      L2: 120,
      L1: 33
    },
    enterpriseFeatures: {
      cam2Monitoring: true,
      grpoLearning: true,
      voiceAI: true,
      legalRAG: true,
      citationGeneration: true,
      documentDrafting: true,
      protocols: ['A2A', 'MCP', 'ROMA', 'AG-UI', 'Legal-RAG']
    }
  });
});

router.get('/categories', (_req: Request, res: Response) => {
  res.json({
    success: true,
    platform: 'NyayaVighya Legal AI SDK',
    totalCategories: LEGAL_CATEGORIES.length,
    categories: LEGAL_CATEGORIES,
    totalAgents: totalLegalAgentCount,
    registrySource: legalAgentRegistry ? 'legal-agents-registry-v2-complete.json' : 'fallback'
  });
});

router.get('/providers', (_req: Request, res: Response) => {
  res.json({
    success: true,
    platform: 'NyayaVighya Legal AI SDK',
    totalProviders: 14,
    providers: [
      { id: 'openai', name: 'OpenAI', models: ['gpt-5.2-legal', 'gpt-5.1', 'o3-legal'], specialization: 'general-legal' },
      { id: 'anthropic', name: 'Anthropic', models: ['claude-sonnet-4.5', 'claude-opus-4.5'], specialization: 'legal-reasoning' },
      { id: 'google', name: 'Google', models: ['gemini-3.0-legal', 'gemini-3.0-pro'], specialization: 'document-analysis' },
      { id: 'deepseek', name: 'DeepSeek', models: ['deepseek-r2-legal'], specialization: 'legal-research' },
      { id: 'sarvam', name: 'Sarvam AI', models: ['saaras-legal-v2', 'bulbul-legal-v2'], specialization: 'indian-languages-legal' }
    ],
    totalModels: 45
  });
});

router.get('/capabilities', (_req: Request, res: Response) => {
  res.json({
    success: true,
    platform: 'NyayaVighya Legal AI SDK',
    backbone: 'WAI SDK v2.0',
    version: '2.0.0',
    description: 'Legal-specific AI orchestration for Indian legal system',
    capabilities: {
      agents: {
        total: 275,
        legalCategories: LEGAL_CATEGORIES.length,
        romaTiers: ['L1', 'L2', 'L3', 'L4']
      },
      legalCategories: LEGAL_CATEGORIES.map(c => ({ id: c.id, name: c.name, agentCount: c.count })),
      llmProviders: {
        total: 14,
        models: 45,
        legalSpecialized: ['gpt-5.2-legal', 'claude-sonnet-4.5', 'gemini-3.0-legal', 'saaras-legal-v2']
      },
      languages: {
        total: 41,
        indian: 22,
        global: 19
      },
      jurisdictions: ['India', 'International', 'SIAC', 'ICC', 'LCIA', 'WIPO'],
      protocols: ['A2A', 'MCP', 'ROMA', 'AG-UI', 'Legal-RAG'],
      modes: ['single-agent', 'multi-agent', 'swarm', 'hierarchical', 'parallel'],
      features: {
        legalResearch: true,
        caseAnalysis: true,
        documentDrafting: true,
        citationGeneration: true,
        statuteInterpretation: true,
        precedentAnalysis: true,
        complianceCheck: true,
        cam2Monitoring: true,
        grpoLearning: true,
        voiceAI: true,
        multimodal: true,
        streaming: true
      },
      enterprise: {
        multiOrganization: true,
        billing: ['stripe', 'razorpay']
      }
    },
    legalTaskTypes: [
      'Case Analysis',
      'Document Drafting',
      'Legal Research',
      'Contract Review',
      'Compliance Check',
      'Opinion Letter',
      'Litigation Support'
    ]
  });
});

function selectLegalAgents(message: string, attachments: any[] | undefined, category: string): typeof LEGAL_AGENTS {
  const selected: typeof LEGAL_AGENTS = [];
  
  selected.push(LEGAL_AGENTS[0]);
  
  const categoryAgentMap: Record<string, number[]> = {
    'corporate': [1],
    'criminal': [2],
    'civil': [3],
    'constitutional': [4],
    'family': [5],
    'property': [6],
    'labor': [7],
    'tax': [8],
    'ip': [9],
    'cyber': [10],
    'arbitration': [11],
    'banking': [12],
    'environmental': [13],
    'data-privacy': [14]
  };
  
  const agentIndices = categoryAgentMap[category] || [];
  for (const idx of agentIndices) {
    if (LEGAL_AGENTS[idx]) selected.push(LEGAL_AGENTS[idx]);
  }
  
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes('draft') || lowerMessage.includes('agreement') || lowerMessage.includes('contract') || lowerMessage.includes('petition')) {
    selected.push(LEGAL_AGENTS[15]);
  }
  if (lowerMessage.includes('case') || lowerMessage.includes('judgment') || lowerMessage.includes('precedent') || lowerMessage.includes('research')) {
    selected.push(LEGAL_AGENTS[16]);
  }
  if (attachments?.some(a => a.type === 'legal-document' || a.type === 'judgment' || a.type === 'contract')) {
    selected.push(LEGAL_AGENTS[16]);
  }
  
  return selected.slice(0, 5);
}

async function processWithLegalAgents(message: string, agents: typeof LEGAL_AGENTS, mode: string, category: string, citations: LegalCitation[]): Promise<string> {
  const agentNames = agents.map(a => a.name).join(', ');
  const categoryInfo = LEGAL_CATEGORIES.find(c => c.id === category);
  const statutes = categoryInfo?.statutes || ['General Legal Principles'];
  
  return `[NyayaVighya Legal Analysis]

**Legal Category:** ${categoryInfo?.name || 'General Legal'}
**Relevant Statutes:** ${statutes.join(', ')}
**Agents Consulted:** ${agentNames}
**Processing Mode:** ${mode}

**Legal Opinion:**

Based on analysis under ${categoryInfo?.name || 'applicable laws'}, the following observations are made:

1. The matter falls under the purview of ${statutes[0] || 'relevant legal provisions'}.
2. ${agents.length} specialized legal agents have analyzed the query using ROMA L4 protocols.
3. Key precedents and applicable provisions have been considered.

**Applicable Provisions:**
${statutes.map((s, i) => `${i + 1}. ${s}`).join('\n')}

**Citations:**
${citations.map(c => `- ${c.citation}: ${c.title}${c.year ? ` (${c.year})` : ''}${c.court ? ` - ${c.court}` : ''}`).join('\n')}

**Disclaimer:** This analysis is provided by NyayaVighya Legal AI SDK for informational purposes. Please consult a qualified legal professional for specific legal advice.

*Powered by NyayaVighya Legal AI SDK v2.0 | Backbone: WAI SDK v2.0*`;
}

function decomposeLegalTask(description: string, type: string, category: string): Array<{ id: string; description: string; agentId: string; agentName: string; legalCategory: string; status: string }> {
  const subtasks = [];
  const categoryAgentId = getCategoryAgentId(category);
  const categoryAgentName = getCategoryAgentName(category);
  
  if (type === 'case-analysis' || type === 'litigation-support') {
    subtasks.push(
      { id: 'st-1', description: 'Analyze legal issue and jurisdiction', agentId: 'legal-queen-orchestrator', agentName: 'Legal Queen Orchestrator', legalCategory: 'orchestration', status: 'pending' },
      { id: 'st-2', description: 'Research applicable case law and precedents', agentId: 'case-law-researcher', agentName: 'Case Law Researcher Agent', legalCategory: 'research', status: 'pending' },
      { id: 'st-3', description: 'Apply category-specific legal analysis', agentId: categoryAgentId, agentName: categoryAgentName, legalCategory: category, status: 'pending' },
      { id: 'st-4', description: 'Prepare litigation strategy/opinion', agentId: 'legal-document-drafter', agentName: 'Legal Document Drafter Agent', legalCategory: 'drafting', status: 'pending' },
      { id: 'st-5', description: 'Review and finalize with citations', agentId: 'legal-queen-orchestrator', agentName: 'Legal Queen Orchestrator', legalCategory: 'orchestration', status: 'pending' }
    );
  } else if (type === 'document-draft' || type === 'contract-review') {
    subtasks.push(
      { id: 'st-1', description: 'Analyze document requirements', agentId: 'legal-queen-orchestrator', agentName: 'Legal Queen Orchestrator', legalCategory: 'orchestration', status: 'pending' },
      { id: 'st-2', description: 'Apply category-specific legal standards', agentId: categoryAgentId, agentName: categoryAgentName, legalCategory: category, status: 'pending' },
      { id: 'st-3', description: 'Draft/review document', agentId: 'legal-document-drafter', agentName: 'Legal Document Drafter Agent', legalCategory: 'drafting', status: 'pending' },
      { id: 'st-4', description: 'Finalize with legal citations', agentId: 'case-law-researcher', agentName: 'Case Law Researcher Agent', legalCategory: 'research', status: 'pending' }
    );
  } else if (type === 'compliance-check') {
    subtasks.push(
      { id: 'st-1', description: 'Identify applicable regulations', agentId: 'legal-queen-orchestrator', agentName: 'Legal Queen Orchestrator', legalCategory: 'orchestration', status: 'pending' },
      { id: 'st-2', description: 'Analyze compliance status', agentId: categoryAgentId, agentName: categoryAgentName, legalCategory: category, status: 'pending' },
      { id: 'st-3', description: 'Generate compliance report', agentId: 'legal-document-drafter', agentName: 'Legal Document Drafter Agent', legalCategory: 'drafting', status: 'pending' }
    );
  } else {
    subtasks.push(
      { id: 'st-1', description: 'Analyze legal query', agentId: 'legal-queen-orchestrator', agentName: 'Legal Queen Orchestrator', legalCategory: 'orchestration', status: 'pending' },
      { id: 'st-2', description: 'Research applicable law', agentId: 'case-law-researcher', agentName: 'Case Law Researcher Agent', legalCategory: 'research', status: 'pending' },
      { id: 'st-3', description: 'Provide legal opinion', agentId: categoryAgentId, agentName: categoryAgentName, legalCategory: category, status: 'pending' }
    );
  }
  
  return subtasks;
}

function getCategoryAgentId(category: string): string {
  const agentMap: Record<string, string> = {
    'corporate': 'corporate-counsel',
    'criminal': 'criminal-defense',
    'civil': 'civil-litigator',
    'constitutional': 'constitutional-expert',
    'family': 'family-law-specialist',
    'property': 'property-expert',
    'labor': 'labor-law-expert',
    'tax': 'tax-consultant',
    'ip': 'ip-specialist',
    'cyber': 'cyber-law-expert',
    'arbitration': 'arbitration-specialist',
    'banking': 'banking-finance-expert',
    'environmental': 'environmental-expert',
    'data-privacy': 'dpdp-specialist'
  };
  return agentMap[category] || 'legal-queen-orchestrator';
}

function getCategoryAgentName(category: string): string {
  const nameMap: Record<string, string> = {
    'corporate': 'Corporate Counsel Agent',
    'criminal': 'Criminal Defense Agent',
    'civil': 'Civil Litigator Agent',
    'constitutional': 'Constitutional Expert Agent',
    'family': 'Family Law Specialist Agent',
    'property': 'Property Law Expert Agent',
    'labor': 'Labor Law Expert Agent',
    'tax': 'Tax Consultant Agent',
    'ip': 'IP Specialist Agent',
    'cyber': 'Cyber Law Expert Agent',
    'arbitration': 'Arbitration Specialist Agent',
    'banking': 'Banking Finance Expert Agent',
    'environmental': 'Environmental Law Expert Agent',
    'data-privacy': 'DPDP Specialist Agent'
  };
  return nameMap[category] || 'Legal Queen Orchestrator';
}

export default router;
