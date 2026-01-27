/**
 * Sketchflow-Inspired Design System API Routes
 * AI-powered design generation and workflow management
 */

import { Router } from 'express';
import { sketchflowDesignSystem } from '../services/sketchflow-inspired-design-system';

const router = Router();

/**
 * GET /api/sketchflow-design/templates
 * Get all design templates
 */
router.get('/templates', async (req, res) => {
  try {
    const { category } = req.query;
    const templates = sketchflowDesignSystem.getTemplates(category as string);
    
    res.json({
      success: true,
      data: {
        templates,
        total: templates.length,
        categories: [...new Set(templates.map(t => t.category))]
      }
    });
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch templates'
    });
  }
});

/**
 * GET /api/sketchflow-design/workflows
 * Get available design workflows
 */
router.get('/workflows', async (req, res) => {
  try {
    const workflows = sketchflowDesignSystem.getWorkflows();
    
    res.json({
      success: true,
      data: {
        workflows,
        total: workflows.length
      }
    });
  } catch (error: any) {
    console.error('Error fetching workflows:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch workflows'
    });
  }
});

/**
 * POST /api/sketchflow-design/generate
 * Generate AI-powered design
 */
router.post('/generate', async (req, res) => {
  try {
    const { description, platform, style, features } = req.body;
    
    if (!description || !platform) {
      return res.status(400).json({
        success: false,
        error: 'Description and platform are required'
      });
    }

    const result = await sketchflowDesignSystem.generateDesign({
      description,
      platform,
      style: style || 'modern',
      features: features || []
    });

    res.json({
      success: result.success,
      data: result.success ? {
        design: result.design,
        components: result.components,
        workflow: result.workflow,
        generatedAt: new Date().toISOString()
      } : null,
      error: result.success ? null : 'Design generation failed'
    });

  } catch (error: any) {
    console.error('Error generating design:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate design'
    });
  }
});

/**
 * POST /api/sketchflow-design/analyze-screenshot
 * Analyze screenshot for design patterns
 */
router.post('/analyze-screenshot', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    
    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        error: 'Image data is required'
      });
    }

    const result = await sketchflowDesignSystem.analyzeScreenshot(imageBase64);

    res.json({
      success: result.success,
      data: result.success ? {
        analysis: result.analysis,
        extractedComponents: result.extractedComponents,
        designPatterns: result.designPatterns,
        analyzedAt: new Date().toISOString()
      } : null,
      error: result.success ? null : 'Screenshot analysis failed'
    });

  } catch (error: any) {
    console.error('Error analyzing screenshot:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze screenshot'
    });
  }
});

/**
 * GET /api/sketchflow-design/status
 * Get design system status
 */
router.get('/status', async (req, res) => {
  try {
    const status = sketchflowDesignSystem.getStatus();
    
    res.json({
      success: true,
      data: {
        ...status,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error getting status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get status'
    });
  }
});

/**
 * GET /api/sketchflow-design/preview/:templateId
 * Get template preview
 */
router.get('/preview/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    const templates = sketchflowDesignSystem.getTemplates();
    const template = templates.find(t => t.id === templateId);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    // Generate preview data
    const preview = {
      template,
      mockup: {
        components: template.components.map(comp => ({
          name: comp,
          type: 'component',
          responsive: template.responsive,
          animated: template.animations
        })),
        colorScheme: {
          primary: '#3B82F6',
          secondary: '#8B5CF6', 
          background: '#FFFFFF'
        },
        layout: 'responsive-grid',
        darkMode: template.darkMode
      }
    };

    res.json({
      success: true,
      data: preview
    });

  } catch (error: any) {
    console.error('Error getting template preview:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get template preview'
    });
  }
});

export default router;