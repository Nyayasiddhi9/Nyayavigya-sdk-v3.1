/**
 * System Prompt Manager
 * Custom system prompt editing, versioning, and per-agent prompt customization
 */

import { EventEmitter } from 'events';

export interface SystemPrompt {
  id: string;
  name: string;
  content: string;
  agentId?: string;
  category: 'default' | 'agent' | 'team' | 'workflow' | 'custom';
  version: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface PromptVersion {
  version: number;
  content: string;
  createdAt: Date;
  createdBy?: string;
  changelog?: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: PromptVariable[];
  category: string;
  tags: string[];
}

export interface PromptVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  defaultValue?: unknown;
}

export interface PromptConfig {
  basePrompt: string;
  roleDefinition?: string;
  capabilities?: string[];
  constraints?: string[];
  outputFormat?: string;
  examples?: string[];
  contextInjections?: string[];
  language?: string;
  tone?: 'professional' | 'casual' | 'technical' | 'friendly' | 'authoritative';
  verbosity?: 'concise' | 'detailed' | 'comprehensive';
}

export const DEFAULT_PROMPTS: Record<string, PromptConfig> = {
  'general-assistant': {
    basePrompt: 'You are a helpful AI assistant capable of understanding and responding to a wide variety of requests.',
    roleDefinition: 'General-purpose assistant with broad knowledge',
    capabilities: ['question-answering', 'research', 'analysis', 'writing', 'problem-solving'],
    constraints: ['Be accurate', 'Cite sources when possible', 'Acknowledge limitations'],
    outputFormat: 'Clear and well-structured responses',
    tone: 'professional'
  },
  'code-developer': {
    basePrompt: 'You are an expert software developer with deep knowledge of modern programming languages, frameworks, and best practices.',
    roleDefinition: 'Senior Software Engineer with full-stack expertise',
    capabilities: ['code-generation', 'debugging', 'code-review', 'architecture-design', 'optimization'],
    constraints: ['Write clean, maintainable code', 'Follow best practices', 'Consider security', 'Explain your approach'],
    outputFormat: 'Code with comments and explanations',
    tone: 'technical'
  },
  'creative-writer': {
    basePrompt: 'You are a creative writer with expertise in storytelling, content creation, and engaging narrative development.',
    roleDefinition: 'Creative Content Specialist',
    capabilities: ['storytelling', 'copywriting', 'blogging', 'creative-writing', 'editing'],
    constraints: ['Maintain brand voice', 'Be original', 'Engage the audience', 'Check for grammar'],
    outputFormat: 'Engaging, well-formatted content',
    tone: 'friendly'
  },
  'researcher': {
    basePrompt: 'You are a thorough researcher with expertise in finding, analyzing, and synthesizing information from multiple sources.',
    roleDefinition: 'Research Analyst',
    capabilities: ['research', 'analysis', 'synthesis', 'fact-checking', 'report-writing'],
    constraints: ['Verify sources', 'Be objective', 'Provide citations', 'Acknowledge uncertainty'],
    outputFormat: 'Structured research reports with citations',
    tone: 'professional'
  },
  'project-manager': {
    basePrompt: 'You are an experienced project manager skilled in planning, coordination, and delivering projects on time and within budget.',
    roleDefinition: 'Senior Project Manager',
    capabilities: ['planning', 'scheduling', 'resource-allocation', 'risk-management', 'stakeholder-communication'],
    constraints: ['Be realistic', 'Consider dependencies', 'Identify risks', 'Communicate clearly'],
    outputFormat: 'Actionable plans with timelines',
    tone: 'professional'
  }
};

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'role-based',
    name: 'Role-Based Prompt',
    description: 'Template for defining agent roles and responsibilities',
    template: `You are a {{role}} with expertise in {{expertise}}.
Your primary responsibilities include:
{{#each responsibilities}}
- {{this}}
{{/each}}

Key skills: {{skills}}

Communication style: {{tone}}`,
    variables: [
      { name: 'role', type: 'string', description: 'Agent role title', required: true },
      { name: 'expertise', type: 'string', description: 'Area of expertise', required: true },
      { name: 'responsibilities', type: 'array', description: 'List of responsibilities', required: true },
      { name: 'skills', type: 'string', description: 'Key skills', required: false },
      { name: 'tone', type: 'string', description: 'Communication tone', required: false, defaultValue: 'professional' }
    ],
    category: 'agent',
    tags: ['role', 'responsibilities', 'agent-definition']
  },
  {
    id: 'task-execution',
    name: 'Task Execution Prompt',
    description: 'Template for executing specific tasks',
    template: `Task: {{task}}

Context: {{context}}

Requirements:
{{#each requirements}}
- {{this}}
{{/each}}

Expected output format: {{outputFormat}}

Constraints:
{{#each constraints}}
- {{this}}
{{/each}}`,
    variables: [
      { name: 'task', type: 'string', description: 'Task description', required: true },
      { name: 'context', type: 'string', description: 'Background context', required: false },
      { name: 'requirements', type: 'array', description: 'List of requirements', required: true },
      { name: 'outputFormat', type: 'string', description: 'Expected output format', required: true },
      { name: 'constraints', type: 'array', description: 'Constraints to follow', required: false }
    ],
    category: 'workflow',
    tags: ['task', 'execution', 'workflow']
  },
  {
    id: 'chain-of-thought',
    name: 'Chain of Thought Prompt',
    description: 'Template for step-by-step reasoning',
    template: `Problem: {{problem}}

Please solve this problem step by step:

1. First, understand the problem completely
2. Break it down into smaller parts
3. Solve each part systematically
4. Verify your solution
5. Present the final answer

Show your reasoning at each step.`,
    variables: [
      { name: 'problem', type: 'string', description: 'Problem to solve', required: true }
    ],
    category: 'reasoning',
    tags: ['reasoning', 'step-by-step', 'problem-solving']
  },
  {
    id: 'multi-agent-coordination',
    name: 'Multi-Agent Coordination Prompt',
    description: 'Template for coordinating multiple agents',
    template: `You are coordinating with the following agents:
{{#each agents}}
- {{this.name}}: {{this.role}}
{{/each}}

Coordination strategy: {{strategy}}

Your role in this coordination: {{yourRole}}

Communication protocol:
- Clearly state your findings
- Request help when needed
- Acknowledge inputs from other agents
- Synthesize collective insights`,
    variables: [
      { name: 'agents', type: 'array', description: 'List of coordinating agents', required: true },
      { name: 'strategy', type: 'string', description: 'Coordination strategy', required: true },
      { name: 'yourRole', type: 'string', description: 'Your role in coordination', required: true }
    ],
    category: 'team',
    tags: ['multi-agent', 'coordination', 'collaboration']
  }
];

export class SystemPromptManager extends EventEmitter {
  private static instance: SystemPromptManager;
  private prompts: Map<string, SystemPrompt> = new Map();
  private versions: Map<string, PromptVersion[]> = new Map();
  private agentPromptOverrides: Map<string, string> = new Map();

  private constructor() {
    super();
    this.initializeDefaultPrompts();
    console.log('📝 SystemPromptManager initialized');
  }

  public static getInstance(): SystemPromptManager {
    if (!SystemPromptManager.instance) {
      SystemPromptManager.instance = new SystemPromptManager();
    }
    return SystemPromptManager.instance;
  }

  private initializeDefaultPrompts(): void {
    for (const [id, config] of Object.entries(DEFAULT_PROMPTS)) {
      const fullPrompt = this.buildPromptFromConfig(config);
      this.createPrompt({
        id,
        name: id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        content: fullPrompt,
        category: 'default',
        isActive: true
      });
    }
  }

  private buildPromptFromConfig(config: PromptConfig): string {
    const parts: string[] = [config.basePrompt];

    if (config.roleDefinition) {
      parts.push(`\nRole: ${config.roleDefinition}`);
    }

    if (config.capabilities && config.capabilities.length > 0) {
      parts.push(`\nCapabilities:\n${config.capabilities.map(c => `- ${c}`).join('\n')}`);
    }

    if (config.constraints && config.constraints.length > 0) {
      parts.push(`\nGuidelines:\n${config.constraints.map(c => `- ${c}`).join('\n')}`);
    }

    if (config.outputFormat) {
      parts.push(`\nOutput Format: ${config.outputFormat}`);
    }

    if (config.tone) {
      parts.push(`\nCommunication Style: ${config.tone}`);
    }

    return parts.join('\n');
  }

  public createPrompt(input: Omit<SystemPrompt, 'version' | 'createdAt' | 'updatedAt'>): SystemPrompt {
    const now = new Date();
    const prompt: SystemPrompt = {
      ...input,
      version: 1,
      createdAt: now,
      updatedAt: now
    };

    this.prompts.set(prompt.id, prompt);
    this.versions.set(prompt.id, [{
      version: 1,
      content: prompt.content,
      createdAt: now
    }]);

    this.emit('prompt-created', prompt);
    return prompt;
  }

  public updatePrompt(id: string, updates: Partial<Pick<SystemPrompt, 'name' | 'content' | 'isActive' | 'metadata'>>, changelog?: string): SystemPrompt | undefined {
    const existing = this.prompts.get(id);
    if (!existing) return undefined;

    const now = new Date();
    const contentChanged = updates.content && updates.content !== existing.content;
    const newVersion = contentChanged ? existing.version + 1 : existing.version;

    const updated: SystemPrompt = {
      ...existing,
      ...updates,
      version: newVersion,
      updatedAt: now
    };

    this.prompts.set(id, updated);

    if (contentChanged && updates.content) {
      const versions = this.versions.get(id) || [];
      versions.push({
        version: newVersion,
        content: updates.content,
        createdAt: now,
        changelog
      });
      this.versions.set(id, versions);
    }

    this.emit('prompt-updated', updated);
    return updated;
  }

  public getPrompt(id: string): SystemPrompt | undefined {
    return this.prompts.get(id);
  }

  public getAllPrompts(): SystemPrompt[] {
    return Array.from(this.prompts.values());
  }

  public getPromptsByCategory(category: SystemPrompt['category']): SystemPrompt[] {
    return this.getAllPrompts().filter(p => p.category === category);
  }

  public getPromptVersions(promptId: string): PromptVersion[] {
    return this.versions.get(promptId) || [];
  }

  public revertToVersion(promptId: string, version: number): SystemPrompt | undefined {
    const versions = this.versions.get(promptId);
    if (!versions) return undefined;

    const targetVersion = versions.find(v => v.version === version);
    if (!targetVersion) return undefined;

    return this.updatePrompt(promptId, { content: targetVersion.content }, `Reverted to version ${version}`);
  }

  public deletePrompt(id: string): boolean {
    const prompt = this.prompts.get(id);
    if (!prompt || prompt.category === 'default') return false;

    this.prompts.delete(id);
    this.versions.delete(id);
    this.emit('prompt-deleted', id);
    return true;
  }

  public setAgentPromptOverride(agentId: string, promptId: string): void {
    this.agentPromptOverrides.set(agentId, promptId);
    this.emit('agent-prompt-override', { agentId, promptId });
  }

  public getAgentPromptOverride(agentId: string): SystemPrompt | undefined {
    const promptId = this.agentPromptOverrides.get(agentId);
    if (!promptId) return undefined;
    return this.prompts.get(promptId);
  }

  public clearAgentPromptOverride(agentId: string): void {
    this.agentPromptOverrides.delete(agentId);
    this.emit('agent-prompt-override-cleared', agentId);
  }

  public getPromptForAgent(agentId: string): string {
    const override = this.getAgentPromptOverride(agentId);
    if (override) return override.content;

    const agentPrompt = this.getAllPrompts().find(p => p.agentId === agentId && p.isActive);
    if (agentPrompt) return agentPrompt.content;

    const defaultPrompt = this.getPrompt('general-assistant');
    return defaultPrompt?.content || 'You are a helpful AI assistant.';
  }

  public buildCustomPrompt(config: PromptConfig): string {
    return this.buildPromptFromConfig(config);
  }

  public getTemplates(): PromptTemplate[] {
    return PROMPT_TEMPLATES;
  }

  public getTemplate(templateId: string): PromptTemplate | undefined {
    return PROMPT_TEMPLATES.find(t => t.id === templateId);
  }

  public renderTemplate(templateId: string, variables: Record<string, unknown>): string {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    let result = template.template;

    for (const variable of template.variables) {
      const value = variables[variable.name] ?? variable.defaultValue;
      
      if (variable.required && value === undefined) {
        throw new Error(`Required variable ${variable.name} not provided`);
      }

      if (variable.type === 'array' && Array.isArray(value)) {
        const arrayPattern = new RegExp(`{{#each ${variable.name}}}([\\s\\S]*?){{/each}}`, 'g');
        result = result.replace(arrayPattern, (_, content) => {
          return (value as unknown[]).map(item => {
            if (typeof item === 'object' && item !== null) {
              let itemContent = content;
              for (const [key, val] of Object.entries(item)) {
                itemContent = itemContent.replace(new RegExp(`{{this\\.${key}}}`, 'g'), String(val));
              }
              return itemContent;
            }
            return content.replace(/{{this}}/g, String(item));
          }).join('');
        });
      } else if (value !== undefined) {
        result = result.replace(new RegExp(`{{${variable.name}}}`, 'g'), String(value));
      }
    }

    return result;
  }

  public exportPrompts(): string {
    const prompts = this.getAllPrompts().filter(p => p.category !== 'default');
    return JSON.stringify(prompts, null, 2);
  }

  public importPrompts(data: string): number {
    try {
      const prompts = JSON.parse(data) as SystemPrompt[];
      let imported = 0;
      
      for (const prompt of prompts) {
        if (!this.prompts.has(prompt.id)) {
          this.createPrompt({
            ...prompt,
            category: 'custom'
          });
          imported++;
        }
      }
      
      return imported;
    } catch (error) {
      throw new Error('Invalid prompt import data');
    }
  }
}

export const systemPromptManager = SystemPromptManager.getInstance();
