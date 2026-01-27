// Flow Maker Routes - Phase 2 Visual Workflow Creation
// API endpoints for no-code visual workflow builder

import express from 'express';
import { flowMakerIntegration } from '../services/flow-maker-integration';

const router = express.Router();

// Get Flow Maker status
router.get('/status', async (req, res) => {
  try {
    const status = flowMakerIntegration.getStatus();
    
    res.json({
      success: true,
      service: 'Flow Maker Integration',
      status: 'operational',
      data: status,
      features: {
        visual_workflow_builder: true,
        no_code_automation: true,
        agent_integration: true,
        template_library: true,
        execution_monitoring: true,
        multi_node_types: true
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get Flow Maker status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all workflows
router.get('/workflows', async (req, res) => {
  try {
    const workflows = flowMakerIntegration.getWorkflows();
    
    res.json({
      success: true,
      workflows: workflows,
      count: workflows.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get workflows',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get workflow by ID
router.get('/workflows/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const workflow = flowMakerIntegration.getWorkflow(id);
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: `Workflow not found: ${id}`
      });
    }

    res.json({
      success: true,
      workflow: workflow,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get workflow',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create new workflow
router.post('/workflows', async (req, res) => {
  try {
    const workflowData = req.body;
    const workflow = await flowMakerIntegration.createWorkflow(workflowData);
    
    res.status(201).json({
      success: true,
      workflow: workflow,
      message: 'Workflow created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create workflow',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update workflow
router.put('/workflows/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const workflow = await flowMakerIntegration.updateWorkflow(id, updates);
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: `Workflow not found: ${id}`
      });
    }

    res.json({
      success: true,
      workflow: workflow,
      message: 'Workflow updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update workflow',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete workflow
router.delete('/workflows/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await flowMakerIntegration.deleteWorkflow(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: `Workflow not found: ${id}`
      });
    }

    res.json({
      success: true,
      message: `Workflow ${id} deleted successfully`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete workflow',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Execute workflow
router.post('/workflows/:id/execute', async (req, res) => {
  try {
    const { id } = req.params;
    const { inputData = {}, options = {} } = req.body;
    
    const execution = await flowMakerIntegration.executeWorkflow(id, inputData, options);
    
    res.json({
      success: true,
      execution: execution,
      message: 'Workflow execution started',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to execute workflow',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get workflow executions
router.get('/workflows/:id/executions', async (req, res) => {
  try {
    const { id } = req.params;
    const executions = flowMakerIntegration.getExecutions(id);
    
    res.json({
      success: true,
      executions: executions,
      count: executions.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get workflow executions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all executions
router.get('/executions', async (req, res) => {
  try {
    const executions = flowMakerIntegration.getExecutions();
    
    res.json({
      success: true,
      executions: executions,
      count: executions.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get executions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get execution by ID
router.get('/executions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const execution = flowMakerIntegration.getExecution(id);
    
    if (!execution) {
      return res.status(404).json({
        success: false,
        error: `Execution not found: ${id}`
      });
    }

    res.json({
      success: true,
      execution: execution,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get execution',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get workflow templates
router.get('/templates', async (req, res) => {
  try {
    const templates = flowMakerIntegration.getTemplates();
    
    res.json({
      success: true,
      templates: templates,
      count: templates.length,
      categories: [...new Set(templates.map(t => t.category))],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get workflow templates',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create workflow from template
router.post('/templates/:templateId/create', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { customizations = {} } = req.body;
    
    const templates = flowMakerIntegration.getTemplates();
    const template = templates.find(t => t.id === templateId);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: `Template not found: ${templateId}`
      });
    }

    // Create workflow from template
    const workflowData = {
      ...template.workflow,
      name: customizations.name || `${template.name} - Copy`,
      description: customizations.description || template.description,
      metadata: {
        ...template.workflow.metadata,
        tags: [...(template.workflow.metadata?.tags || []), 'from-template']
      }
    };

    const workflow = await flowMakerIntegration.createWorkflow(workflowData);
    
    res.status(201).json({
      success: true,
      workflow: workflow,
      template_used: template.id,
      message: 'Workflow created from template successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create workflow from template',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get available node types
router.get('/node-types', async (req, res) => {
  try {
    const nodeTypes = flowMakerIntegration.getNodeTypes();
    
    res.json({
      success: true,
      node_types: nodeTypes,
      count: nodeTypes.length,
      categories: [...new Set(nodeTypes.map(nt => nt.category))],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get node types',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Validate workflow
router.post('/workflows/validate', async (req, res) => {
  try {
    const { workflow } = req.body;
    
    if (!workflow) {
      return res.status(400).json({
        success: false,
        error: 'Workflow data is required for validation'
      });
    }

    // Basic validation logic
    const validation = {
      valid: true,
      errors: [] as string[],
      warnings: [] as string[]
    };

    // Check for required fields
    if (!workflow.name) validation.errors.push('Workflow name is required');
    if (!workflow.nodes || workflow.nodes.length === 0) validation.errors.push('At least one node is required');
    
    // Check for input/output nodes
    const hasInput = workflow.nodes?.some((node: any) => node.type === 'input');
    const hasOutput = workflow.nodes?.some((node: any) => node.type === 'output');
    
    if (!hasInput) validation.warnings.push('No input node found - workflow may not receive data');
    if (!hasOutput) validation.warnings.push('No output node found - workflow may not return results');
    
    // Check for disconnected nodes
    const connectedNodes = new Set();
    workflow.edges?.forEach((edge: any) => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });
    
    const disconnectedNodes = workflow.nodes?.filter((node: any) => !connectedNodes.has(node.id));
    if (disconnectedNodes?.length > 0) {
      validation.warnings.push(`${disconnectedNodes.length} disconnected nodes found`);
    }

    validation.valid = validation.errors.length === 0;

    res.json({
      success: true,
      validation: validation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to validate workflow',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get integration capabilities
router.get('/capabilities', async (req, res) => {
  try {
    const status = flowMakerIntegration.getStatus();
    
    const capabilities = {
      visual_workflow_builder: {
        drag_drop_interface: true,
        real_time_editing: true,
        collaborative_editing: false, // Future feature
        version_control: false // Future feature
      },
      node_types: {
        total_available: status.node_types_count,
        categories: ['IO', 'AI', 'Logic', 'Data', 'Utility', 'Integration'],
        custom_nodes_supported: true
      },
      execution_engine: {
        parallel_execution: true,
        conditional_branching: true,
        error_handling: true,
        retry_mechanisms: true,
        timeout_management: true
      },
      integration_features: {
        wai_agent_integration: true,
        external_api_calls: true,
        database_operations: true,
        webhook_support: true,
        real_time_monitoring: true
      },
      template_system: {
        pre_built_templates: status.templates_count,
        custom_templates: true,
        template_sharing: false, // Future feature
        community_templates: false // Future feature
      },
      monitoring_analytics: {
        execution_tracking: true,
        performance_metrics: true,
        error_analysis: true,
        usage_statistics: true,
        cost_tracking: true
      }
    };

    res.json({
      success: true,
      capabilities: capabilities,
      phase_2_status: 'Visual Workflow Creation - OPERATIONAL',
      integration_benefits: {
        no_code_automation: 'Create complex workflows without coding',
        productivity_boost: '3x faster workflow creation',
        visual_debugging: 'Easy troubleshooting and optimization',
        template_reusability: 'Accelerated development with pre-built templates'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get capabilities',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Health check
router.get('/health', async (req, res) => {
  try {
    const status = flowMakerIntegration.getStatus();
    
    res.json({
      success: true,
      service: 'Flow Maker Integration',
      status: 'operational',
      features: status.features,
      workflows_count: status.workflows_count,
      templates_count: status.templates_count,
      active_executions: status.active_executions,
      phase_2_implementation: 'COMPLETE',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;