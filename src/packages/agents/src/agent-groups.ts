/**
 * WAI SDK v1.0 - Agent Groups System
 * Cohesive Multi-Agent Coordination
 * 
 * 12 Sector Groups + Functional Groups for unified agent orchestration
 */

export interface AgentGroup {
  id: string;
  name: string;
  description: string;
  category: 'sector' | 'functional' | 'operational';
  leadAgent: string;
  members: string[];
  capabilities: string[];
  collaborationProtocol: 'A2A' | 'MCP' | 'AG-UI' | 'hybrid';
}

// ================================================================================================
// SECTOR GROUPS (12)
// ================================================================================================

export const sectorGroups: AgentGroup[] = [
  {
    id: 'group-c-suite',
    name: 'C-Suite Leadership',
    description: 'Executive leadership and strategic decision-making',
    category: 'sector',
    leadAgent: 'ceo-agent',
    members: ['ceo-agent', 'cto-agent', 'cfo-agent', 'cpo-agent', 'cmo-agent'],
    capabilities: ['strategic-planning', 'resource-allocation', 'vision-setting', 'stakeholder-management'],
    collaborationProtocol: 'A2A'
  },
  {
    id: 'group-engineering',
    name: 'Engineering Team',
    description: 'Software development and technical implementation',
    category: 'sector',
    leadAgent: 'cto-agent',
    members: [
      'fullstack-developer', 'frontend-developer', 'backend-developer',
      'api-developer', 'database-developer', 'mobile-developer',
      'ml-engineer', 'data-engineer', 'security-engineer', 'devops-engineer',
      'systems-developer', 'test-automation-engineer', 'prompt-engineer'
    ],
    capabilities: ['software-development', 'system-design', 'code-review', 'testing'],
    collaborationProtocol: 'hybrid'
  },
  {
    id: 'group-product',
    name: 'Product Team',
    description: 'Product strategy, design, and user experience',
    category: 'sector',
    leadAgent: 'cpo-agent',
    members: [
      'product-owner', 'ux-designer', 'ui-designer',
      'content-strategist', 'project-manager', 'scrum-master'
    ],
    capabilities: ['product-strategy', 'user-research', 'design', 'roadmapping'],
    collaborationProtocol: 'A2A'
  },
  {
    id: 'group-marketing',
    name: 'Marketing Team',
    description: 'Marketing strategy, content, and brand management',
    category: 'sector',
    leadAgent: 'cmo-agent',
    members: [
      'marketing-strategist', 'content-strategist', 'content-writer',
      'seo-specialist', 'social-media-specialist', 'brand-manager',
      'growth-hacker', 'copywriter', 'graphic-designer', 'video-producer'
    ],
    capabilities: ['marketing-strategy', 'content-creation', 'brand-management', 'growth'],
    collaborationProtocol: 'A2A'
  },
  {
    id: 'group-sales',
    name: 'Sales Team',
    description: 'Sales strategy, revenue growth, and customer acquisition',
    category: 'sector',
    leadAgent: 'sales-strategist',
    members: [
      'sales-strategist', 'account-executive', 'sales-engineer',
      'business-development', 'customer-success'
    ],
    capabilities: ['sales-strategy', 'pipeline-management', 'customer-acquisition', 'account-management'],
    collaborationProtocol: 'A2A'
  },
  {
    id: 'group-finance',
    name: 'Finance Team',
    description: 'Financial planning, analysis, and reporting',
    category: 'sector',
    leadAgent: 'cfo-agent',
    members: [
      'financial-analyst', 'investment-analyst', 'risk-analyst',
      'tax-specialist', 'treasury-analyst', 'audit-analyst',
      'accounting-analyst', 'fpa-analyst'
    ],
    capabilities: ['financial-analysis', 'budgeting', 'forecasting', 'compliance'],
    collaborationProtocol: 'A2A'
  },
  {
    id: 'group-legal',
    name: 'Legal Team',
    description: 'Legal counsel, compliance, and contract management',
    category: 'sector',
    leadAgent: 'corporate-counsel',
    members: [
      'legal-analyst', 'contract-reviewer', 'compliance-officer',
      'ip-specialist', 'corporate-counsel'
    ],
    capabilities: ['legal-analysis', 'contract-review', 'compliance', 'ip-protection'],
    collaborationProtocol: 'A2A'
  },
  {
    id: 'group-hr',
    name: 'Human Resources Team',
    description: 'People operations, talent, and culture',
    category: 'sector',
    leadAgent: 'hr-specialist',
    members: [
      'hr-specialist', 'recruiter', 'compensation-analyst',
      'learning-development', 'employee-experience'
    ],
    capabilities: ['talent-acquisition', 'employee-relations', 'compensation', 'development'],
    collaborationProtocol: 'A2A'
  },
  {
    id: 'group-operations',
    name: 'Operations Team',
    description: 'Operational excellence and process optimization',
    category: 'sector',
    leadAgent: 'operations-orchestrator',
    members: [
      'operations-orchestrator', 'resource-allocator',
      'release-manager', 'project-manager'
    ],
    capabilities: ['process-optimization', 'resource-management', 'release-management'],
    collaborationProtocol: 'hybrid'
  },
  {
    id: 'group-quality',
    name: 'Quality Assurance Team',
    description: 'Quality assurance, testing, and security',
    category: 'sector',
    leadAgent: 'qa-engineer',
    members: [
      'qa-engineer', 'security-auditor', 'accessibility-specialist',
      'performance-tester', 'test-automation-engineer'
    ],
    capabilities: ['testing', 'quality-assurance', 'security-testing', 'accessibility'],
    collaborationProtocol: 'hybrid'
  },
  {
    id: 'group-infrastructure',
    name: 'Infrastructure Team',
    description: 'DevOps, cloud, and site reliability',
    category: 'sector',
    leadAgent: 'cloud-architect',
    members: [
      'devops-engineer', 'sre-engineer', 'cloud-architect',
      'security-engineer'
    ],
    capabilities: ['infrastructure', 'deployment', 'monitoring', 'reliability'],
    collaborationProtocol: 'hybrid'
  },
  {
    id: 'group-research',
    name: 'Research & Analytics Team',
    description: 'Research, data science, and market intelligence',
    category: 'sector',
    leadAgent: 'research-analyst',
    members: [
      'research-analyst', 'data-scientist', 'market-researcher',
      'competitive-intelligence', 'learning-analytics'
    ],
    capabilities: ['research', 'analytics', 'market-intelligence', 'data-science'],
    collaborationProtocol: 'A2A'
  }
];

// ================================================================================================
// FUNCTIONAL GROUPS
// ================================================================================================

export const functionalGroups: AgentGroup[] = [
  {
    id: 'group-orchestration',
    name: 'Orchestration Layer',
    description: 'Multi-agent orchestration and coordination',
    category: 'functional',
    leadAgent: 'orchestrator',
    members: [
      'orchestrator', 'strategy-orchestrator', 'operations-orchestrator',
      'innovation-orchestrator', 'transformation-orchestrator',
      'integration-orchestrator', 'governance-orchestrator', 'risk-orchestrator'
    ],
    capabilities: ['orchestration', 'coordination', 'workflow-management'],
    collaborationProtocol: 'A2A'
  },
  {
    id: 'group-creative',
    name: 'Creative Team',
    description: 'Content creation and visual design',
    category: 'functional',
    leadAgent: 'content-strategist',
    members: [
      'content-writer', 'copywriter', 'ux-designer', 'ui-designer',
      'graphic-designer', 'video-producer'
    ],
    capabilities: ['content-creation', 'design', 'branding', 'visual-communication'],
    collaborationProtocol: 'A2A'
  },
  {
    id: 'group-education',
    name: 'Education Team',
    description: 'Learning design and educational delivery',
    category: 'functional',
    leadAgent: 'curriculum-designer',
    members: [
      'curriculum-designer', 'instructor', 'assessment-designer',
      'learning-analytics', 'student-success'
    ],
    capabilities: ['curriculum-design', 'instruction', 'assessment', 'learning-analytics'],
    collaborationProtocol: 'A2A'
  }
];

// ================================================================================================
// COMBINED GROUPS
// ================================================================================================

export const allAgentGroups: AgentGroup[] = [...sectorGroups, ...functionalGroups];

// ================================================================================================
// UTILITY FUNCTIONS
// ================================================================================================

export function getGroupById(groupId: string): AgentGroup | undefined {
  return allAgentGroups.find(g => g.id === groupId);
}

export function getGroupsByCategory(category: AgentGroup['category']): AgentGroup[] {
  return allAgentGroups.filter(g => g.category === category);
}

export function getAgentGroups(agentId: string): AgentGroup[] {
  return allAgentGroups.filter(g => g.members.includes(agentId));
}

export function getGroupLeader(groupId: string): string | undefined {
  const group = getGroupById(groupId);
  return group?.leadAgent;
}

export function getGroupMembers(groupId: string): string[] {
  const group = getGroupById(groupId);
  return group?.members || [];
}

export function getCollaboratingAgents(agentId: string): string[] {
  const groups = getAgentGroups(agentId);
  const collaborators = new Set<string>();
  
  groups.forEach(group => {
    group.members.forEach(member => {
      if (member !== agentId) {
        collaborators.add(member);
      }
    });
  });
  
  return Array.from(collaborators);
}

export function getGroupStats() {
  return {
    totalGroups: allAgentGroups.length,
    sectorGroups: sectorGroups.length,
    functionalGroups: functionalGroups.length,
    totalMemberships: allAgentGroups.reduce((sum, g) => sum + g.members.length, 0),
    averageGroupSize: Math.round(
      allAgentGroups.reduce((sum, g) => sum + g.members.length, 0) / allAgentGroups.length
    )
  };
}

export default {
  sectorGroups,
  functionalGroups,
  allAgentGroups,
  getGroupById,
  getGroupsByCategory,
  getAgentGroups,
  getGroupLeader,
  getGroupMembers,
  getCollaboratingAgents,
  getGroupStats
};
