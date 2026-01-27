/**
 * WAI SDK v2.0 Proprietary Naming Configuration
 * January 17, 2026
 * 
 * This file maps open-source module names to proprietary branded names
 * for enterprise licensing and branding purposes.
 */

export interface ProprietaryBrand {
  originalName: string;
  proprietaryName: string;
  trademark: string;
  description: string;
  category: 'memory' | 'protocol' | 'orchestration' | 'security' | 'storage';
}

/**
 * Core Proprietary Naming Map
 * Maps open-source names to enterprise-branded equivalents
 */
export const PROPRIETARY_BRANDS: Record<string, ProprietaryBrand> = {
  // Memory Systems
  mem0: {
    originalName: 'mem0',
    proprietaryName: 'MemCore',
    trademark: 'MemCore™',
    description: 'Enterprise Memory Management System',
    category: 'memory'
  },
  
  // Autonomy Standards
  roma: {
    originalName: 'ROMA',
    proprietaryName: 'APEX',
    trademark: 'APEX™ (Autonomous Process EXecution)',
    description: 'Autonomy Level Standards L1-L4',
    category: 'protocol'
  },
  
  // Coordination Methodology
  bmad: {
    originalName: 'BMAD',
    proprietaryName: 'BizCore',
    trademark: 'BizCore™',
    description: 'Behavioral Coordination Methodology',
    category: 'protocol'
  },
  
  // Communication Standards
  parlant: {
    originalName: 'Parlant',
    proprietaryName: 'SyncBridge',
    trademark: 'SyncBridge™',
    description: '22-Point Communication Standards',
    category: 'protocol'
  },
  
  // Agent Collaboration
  a2a: {
    originalName: 'A2A Bus',
    proprietaryName: 'AgentMesh',
    trademark: 'AgentMesh™',
    description: 'Agent-to-Agent Collaboration Network',
    category: 'protocol'
  },
  
  // UI Streaming & Monitoring
  agui: {
    originalName: 'AG-UI/CAM',
    proprietaryName: 'AutoScale',
    trademark: 'AutoScale™',
    description: 'Agent-UI Streaming & Continuous Agent Monitoring',
    category: 'protocol'
  },
  
  // Workflow Orchestration
  geminiflow: {
    originalName: 'Geminiflow',
    proprietaryName: 'WizardFlow',
    trademark: 'WizardFlow™',
    description: 'Workflow Orchestration Engine',
    category: 'orchestration'
  },
  
  // Vector Storage
  pgvector: {
    originalName: 'pgvector',
    proprietaryName: 'VectorCore',
    trademark: 'VectorCore™',
    description: 'Vector Similarity Search Engine',
    category: 'storage'
  },
  
  // Security Framework
  quantumSecurity: {
    originalName: 'Quantum Security',
    proprietaryName: 'ShieldMax',
    trademark: 'ShieldMax™',
    description: 'Enterprise Security Framework',
    category: 'security'
  },
  
  // Additional Proprietary Names
  queenOrchestrator: {
    originalName: 'Queen Orchestrator',
    proprietaryName: 'QueenAI',
    trademark: 'QueenAI™',
    description: 'Intelligent Task Decomposition Engine',
    category: 'orchestration'
  },
  
  mcpTools: {
    originalName: 'MCP Tools',
    proprietaryName: 'ToolVault',
    trademark: 'ToolVault™',
    description: 'Production Tools Library (530+ tools)',
    category: 'protocol'
  },
  
  llmProviderHub: {
    originalName: 'LLM Provider Hub',
    proprietaryName: 'ModelHub',
    trademark: 'ModelHub™',
    description: '23-Provider Routing Engine',
    category: 'orchestration'
  },
  
  agentRegistry: {
    originalName: 'Agent Registry',
    proprietaryName: 'AgentVault',
    trademark: 'AgentVault™',
    description: '275-Agent Repository',
    category: 'orchestration'
  },
  
  grpoTraining: {
    originalName: 'GRPO Training',
    proprietaryName: 'LearnCore',
    trademark: 'LearnCore™',
    description: 'Continuous Reinforcement Learning Engine',
    category: 'orchestration'
  },
  
  digitalTwin: {
    originalName: 'Digital Twin',
    proprietaryName: 'TwinSync',
    trademark: 'TwinSync™',
    description: 'AI Behavior Modeling System',
    category: 'orchestration'
  },
  
  hitlWorkflow: {
    originalName: 'HITL Workflow',
    proprietaryName: 'HumanLoop',
    trademark: 'HumanLoop™',
    description: 'Human-in-the-Loop Approval System',
    category: 'orchestration'
  },
  
  costOptimization: {
    originalName: 'Cost Optimization',
    proprietaryName: 'CostGuard',
    trademark: 'CostGuard™',
    description: 'Token Spending Controls',
    category: 'orchestration'
  },
  
  fallbackChains: {
    originalName: 'Fallback Chains',
    proprietaryName: 'SafeRoute',
    trademark: 'SafeRoute™',
    description: 'Provider Failover System',
    category: 'orchestration'
  },
  
  contextEngineering: {
    originalName: 'Context Engineering',
    proprietaryName: 'ContextIQ',
    trademark: 'ContextIQ™',
    description: 'Prompt Optimization Engine',
    category: 'orchestration'
  }
};

/**
 * Get proprietary name for a given original name
 */
export function getProprietaryName(originalName: string): string {
  const key = originalName.toLowerCase().replace(/[\s-]/g, '');
  const brand = Object.values(PROPRIETARY_BRANDS).find(
    b => b.originalName.toLowerCase().replace(/[\s-]/g, '') === key
  );
  return brand?.proprietaryName || originalName;
}

/**
 * Get trademark string for a given original name
 */
export function getTrademark(originalName: string): string {
  const key = originalName.toLowerCase().replace(/[\s-]/g, '');
  const brand = Object.values(PROPRIETARY_BRANDS).find(
    b => b.originalName.toLowerCase().replace(/[\s-]/g, '') === key
  );
  return brand?.trademark || originalName;
}

/**
 * Get all brands by category
 */
export function getBrandsByCategory(category: ProprietaryBrand['category']): ProprietaryBrand[] {
  return Object.values(PROPRIETARY_BRANDS).filter(b => b.category === category);
}

/**
 * Format branded description for documentation
 */
export function formatBrandedDescription(key: string): string {
  const brand = PROPRIETARY_BRANDS[key];
  if (!brand) return '';
  return `${brand.trademark}: ${brand.description}`;
}

/**
 * Export complete branding map for external use
 */
export const BRANDING_MAP = {
  // Memory
  'mem0': 'MemCore™',
  
  // Protocols
  'ROMA': 'APEX™',
  'BMAD': 'BizCore™',
  'Parlant': 'SyncBridge™',
  'A2A': 'AgentMesh™',
  'AG-UI': 'AutoScale™',
  'CAM': 'AutoScale™',
  
  // Orchestration
  'Geminiflow': 'WizardFlow™',
  'Queen Orchestrator': 'QueenAI™',
  'GRPO': 'LearnCore™',
  
  // Storage
  'pgvector': 'VectorCore™',
  
  // Security
  'Quantum Security': 'ShieldMax™',
  
  // Systems
  'MCP Tools': 'ToolVault™',
  'Agent Registry': 'AgentVault™',
  'LLM Hub': 'ModelHub™',
  'Digital Twin': 'TwinSync™',
  'HITL': 'HumanLoop™',
  'Cost Optimization': 'CostGuard™',
  'Fallback': 'SafeRoute™',
  'Context Engineering': 'ContextIQ™'
};

export default PROPRIETARY_BRANDS;
