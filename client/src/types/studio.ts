/**
 * Studio Types - Project Builder and Pipeline Management
 */

import { z } from 'zod';

export interface Project {
  id: string;
  name: string;
  description: string;
  type: 'content' | 'assistant' | 'game' | 'enterprise' | 'custom';
  status: 'draft' | 'active' | 'completed' | 'archived';
  template?: string;
  configuration: ProjectConfiguration;
  assets: ProjectAsset[];
  pipelines: string[];
  collaborators: ProjectCollaborator[];
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    tags: string[];
    category: string;
    version: string;
  };
}

export interface ProjectConfiguration {
  agents: string[];
  llmProviders: string[];
  policies: string[];
  budget: {
    maxCost: number;
    maxLatency: number;
    minQuality: number;
  };
  deployment: {
    target: string;
    environment: string;
    settings: Record<string, any>;
  };
}

export interface ProjectAsset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'dataset' | 'model' | 'prompt';
  size: number;
  url: string;
  metadata: {
    uploadedAt: Date;
    uploadedBy: string;
    tags: string[];
    description?: string;
  };
}

export interface ProjectCollaborator {
  userId: string;
  role: 'owner' | 'editor' | 'viewer';
  permissions: string[];
  joinedAt: Date;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  type: 'content' | 'assistant' | 'game' | 'enterprise' | 'custom';
  thumbnail?: string;
  configuration: TemplateConfiguration;
  assets: TemplateAsset[];
  pipeline: TemplatePipeline;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    tags: string[];
    downloads: number;
    rating: number;
    featured: boolean;
  };
}

export interface TemplateConfiguration {
  requiredAgents: string[];
  recommendedLLMs: string[];
  minimumBudget: number;
  estimatedTime: number;
  complexity: 'beginner' | 'intermediate' | 'advanced';
  customization: {
    configurable: string[];
    required: string[];
  };
}

export interface TemplateAsset {
  name: string;
  type: string;
  description: string;
  required: boolean;
  example?: string;
}

export interface TemplatePipeline {
  stages: TemplateStage[];
  connections: TemplateConnection[];
  variables: TemplateVariable[];
}

export interface TemplateStage {
  id: string;
  name: string;
  type: string;
  description: string;
  position: { x: number; y: number };
  configuration: Record<string, any>;
}

export interface TemplateConnection {
  from: string;
  to: string;
  type: 'data' | 'control';
  condition?: string;
}

export interface TemplateVariable {
  name: string;
  type: string;
  description: string;
  default?: any;
  required: boolean;
}

export interface WorkflowNode {
  id: string;
  type: 'agent' | 'llm' | 'input' | 'output' | 'condition' | 'transform' | 'custom';
  position: { x: number; y: number };
  data: {
    label: string;
    description?: string;
    configuration: Record<string, any>;
    inputs: WorkflowPort[];
    outputs: WorkflowPort[];
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
  type: 'data' | 'control';
  animated?: boolean;
  style?: Record<string, any>;
}

export interface WorkflowPort {
  id: string;
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

export interface Experiment {
  id: string;
  name: string;
  description: string;
  type: 'ab_test' | 'multivariate' | 'optimization';
  status: 'draft' | 'running' | 'completed' | 'paused';
  variants: ExperimentVariant[];
  metrics: ExperimentMetric[];
  configuration: ExperimentConfiguration;
  results?: ExperimentResults;
  metadata: {
    createdAt: Date;
    startedAt?: Date;
    endedAt?: Date;
    createdBy: string;
  };
}

export interface ExperimentVariant {
  id: string;
  name: string;
  description: string;
  configuration: Record<string, any>;
  trafficAllocation: number;
  status: 'active' | 'inactive';
}

export interface ExperimentMetric {
  id: string;
  name: string;
  type: 'conversion' | 'engagement' | 'performance' | 'cost';
  goal: 'maximize' | 'minimize';
  target?: number;
}

export interface ExperimentConfiguration {
  duration: number;
  minSampleSize: number;
  confidenceLevel: number;
  statisticalPower: number;
  trafficSplit: Record<string, number>;
}

export interface ExperimentResults {
  winner?: string;
  confidence: number;
  pValue: number;
  variants: Record<string, ExperimentVariantResult>;
  recommendations: string[];
}

export interface ExperimentVariantResult {
  conversions: number;
  visitors: number;
  conversionRate: number;
  improvement: number;
  significance: boolean;
  metrics: Record<string, number>;
}

// Zod schemas for validation
export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.enum(['content', 'assistant', 'game', 'enterprise', 'custom']),
  status: z.enum(['draft', 'active', 'completed', 'archived']),
  template: z.string().optional(),
  configuration: z.record(z.any()),
  assets: z.array(z.any()),
  pipelines: z.array(z.string()),
  collaborators: z.array(z.any()),
  metadata: z.object({
    createdAt: z.date(),
    updatedAt: z.date(),
    createdBy: z.string(),
    tags: z.array(z.string()),
    category: z.string(),
    version: z.string(),
  }),
});

export type ProjectInput = z.infer<typeof ProjectSchema>;