import { z } from 'zod';

// Node types with specific metadata (including system nodes)
export const nodeTypeEnum = z.enum(['agent', 'tool', 'workflow', 'input', 'output', 'default']);

// Base node schema
export const workflowNodeSchema = z.object({
  id: z.string(),
  type: nodeTypeEnum,
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: z.object({
    label: z.string(),
    description: z.string().optional(),
    // Agent-specific data
    agentId: z.string().optional(),
    tier: z.enum(['executive', 'development', 'creative', 'qa', 'devops', 'domain']).optional(),
    // Tool-specific data
    toolId: z.string().optional(),
    category: z.string().optional(),
    // Workflow-specific data
    workflowId: z.string().optional(),
    steps: z.number().optional(),
    // Common fields
    config: z.record(z.any()).optional(),
  }),
});

// Edge/Connection schema with type validation
export const workflowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(), // Node ID
  target: z.string(), // Node ID
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
  type: z.string().default('default'),
  animated: z.boolean().optional().default(false),
  label: z.string().optional(),
});

// Complete workflow schema
export const workflowDefinitionSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Workflow name is required'),
  description: z.string().optional(),
  nodes: z.array(workflowNodeSchema),
  edges: z.array(workflowEdgeSchema),
  metadata: z.object({
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    version: z.string().default('1.0.0'),
    tags: z.array(z.string()).optional(),
  }).optional(),
});

// Type exports
export type NodeType = z.infer<typeof nodeTypeEnum>;
export type WorkflowNode = z.infer<typeof workflowNodeSchema>;
export type WorkflowEdge = z.infer<typeof workflowEdgeSchema>;
export type WorkflowDefinition = z.infer<typeof workflowDefinitionSchema>;

// Validation helpers
export function validateWorkflow(workflow: unknown): { 
  success: boolean; 
  data?: WorkflowDefinition; 
  errors?: z.ZodError;
} {
  const result = workflowDefinitionSchema.safeParse(workflow);
  
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error };
  }
}

// Connection validation rules
export function validateConnection(
  sourceNode: WorkflowNode,
  targetNode: WorkflowNode
): { valid: boolean; reason?: string } {
  // Rule 0: System nodes (input/output/default) can connect to anything
  if (['input', 'output', 'default'].includes(sourceNode.type) || 
      ['input', 'output', 'default'].includes(targetNode.type)) {
    return { valid: true };
  }

  // Rule 1: Agents can connect to tools and workflows
  if (sourceNode.type === 'agent') {
    if (targetNode.type === 'agent') {
      return { valid: false, reason: 'Agents cannot connect directly to other agents' };
    }
    return { valid: true };
  }

  // Rule 2: Tools can connect to agents and workflows
  if (sourceNode.type === 'tool') {
    return { valid: true };
  }

  // Rule 3: Workflows can connect to anything
  if (sourceNode.type === 'workflow') {
    return { valid: true };
  }

  return { valid: false, reason: 'Unknown node type' };
}

// Node creation helpers
export function createAgentNode(
  id: string,
  label: string,
  position: { x: number; y: number },
  data?: { agentId?: string; tier?: string; description?: string }
): WorkflowNode {
  return {
    id,
    type: 'agent',
    position,
    data: {
      label,
      ...data,
    },
  };
}

export function createToolNode(
  id: string,
  label: string,
  position: { x: number; y: number },
  data?: { toolId?: string; category?: string; description?: string }
): WorkflowNode {
  return {
    id,
    type: 'tool',
    position,
    data: {
      label,
      ...data,
    },
  };
}

export function createWorkflowNode(
  id: string,
  label: string,
  position: { x: number; y: number },
  data?: { workflowId?: string; steps?: number; description?: string }
): WorkflowNode {
  return {
    id,
    type: 'workflow',
    position,
    data: {
      label,
      ...data,
    },
  };
}
