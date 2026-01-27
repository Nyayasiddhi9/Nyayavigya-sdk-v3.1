import { Router } from 'express';
import { db } from '../db.js';
import { wizardsIndustryTemplates } from '../../shared/schema.js';
import { eq, desc, and } from 'drizzle-orm';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

/**
 * Industry Templates API Routes
 * Top 5 ready-to-deploy templates for rapid MVP development
 */

// Get all industry templates
router.get('/templates', async (req, res) => {
  try {
    const { industry, complexity, popular } = req.query;
    
    // Build filters array
    const filters = [];
    if (industry) {
      filters.push(eq(wizardsIndustryTemplates.industry, industry as string));
    }
    if (complexity) {
      filters.push(eq(wizardsIndustryTemplates.complexity, complexity as string));
    }
    if (popular === 'true') {
      filters.push(eq(wizardsIndustryTemplates.isPopular, true));
    }
    
    // Build query with conditional where clause
    let query = db.select().from(wizardsIndustryTemplates);
    
    if (filters.length > 0) {
      query = query.where(and(...filters));
    }
    
    const templates = await query.orderBy(desc(wizardsIndustryTemplates.usageCount));
    
    res.json({ success: true, data: templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get single template by ID
router.get('/templates/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    
    const [template] = await db.select()
      .from(wizardsIndustryTemplates)
      .where(eq(wizardsIndustryTemplates.templateId, templateId))
      .limit(1);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }
    
    res.json({ success: true, data: template });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get popular templates
router.get('/templates/featured/popular', async (req, res) => {
  try {
    const templates = await db.select()
      .from(wizardsIndustryTemplates)
      .where(eq(wizardsIndustryTemplates.isPopular, true))
      .orderBy(desc(wizardsIndustryTemplates.usageCount))
      .limit(5);
    
    res.json({ success: true, data: templates });
  } catch (error) {
    console.error('Error fetching popular templates:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Increment template usage count (when template is used/deployed)
router.post('/templates/:templateId/use', authenticateToken, async (req, res) => {
  try {
    const { templateId } = req.params;
    
    const [template] = await db.select()
      .from(wizardsIndustryTemplates)
      .where(eq(wizardsIndustryTemplates.templateId, templateId))
      .limit(1);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }
    
    await db.update(wizardsIndustryTemplates)
      .set({ usageCount: (template.usageCount || 0) + 1 })
      .where(eq(wizardsIndustryTemplates.templateId, templateId));
    
    res.json({ success: true, message: 'Template usage recorded' });
  } catch (error) {
    console.error('Error recording template usage:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get templates by industry
router.get('/templates/industry/:industry', async (req, res) => {
  try {
    const { industry } = req.params;
    
    const templates = await db.select()
      .from(wizardsIndustryTemplates)
      .where(eq(wizardsIndustryTemplates.industry, industry))
      .orderBy(desc(wizardsIndustryTemplates.rating));
    
    res.json({ success: true, data: templates });
  } catch (error) {
    console.error('Error fetching templates by industry:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
