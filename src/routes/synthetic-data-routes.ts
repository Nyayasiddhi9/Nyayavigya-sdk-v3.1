/**
 * Synthetic Data Generation API Routes
 * Enterprise-grade data generation for data-intensive projects
 */

import express, { type Request, type Response } from 'express';
import { syntheticDataEngine, type DataGenerationRequest } from '../services/synthetic-data-engine';
import { authenticateToken, type AuthRequest } from '../middleware/auth';
import { db } from '../db';
import { wizardsStartups, wizardsFounders } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const router = express.Router();

// Proper validation schemas for data fields and relationships
const dataFieldSchema = z.object({
  name: z.string(),
  type: z.enum(['string', 'number', 'boolean', 'date', 'email', 'phone', 'address', 'url', 'uuid', 'enum']),
  required: z.boolean(),
  unique: z.boolean().optional(),
  enumValues: z.array(z.string()).optional(),
  format: z.string().optional(),
  constraints: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    length: z.number().optional(),
  }).optional(),
});

const dataRelationshipSchema = z.object({
  from: z.string(),
  to: z.string(),
  type: z.enum(['one-to-one', 'one-to-many', 'many-to-many']),
  foreignKey: z.string(),
});

// Validation schema with proper field/relationship validation
const dataGenerationSchema = z.object({
  startupId: z.number(),
  datasetType: z.enum(['csv', 'json', 'sql', 'api_mock']),
  industry: z.string(),
  recordCount: z.number().min(1).max(10000),
  includeRelationships: z.boolean().optional(),
  schema: z.object({
    name: z.string(),
    description: z.string(),
    fields: z.array(dataFieldSchema),
    relationships: z.array(dataRelationshipSchema).optional(),
  }).optional(),
  constraints: z.object({
    consistency: z.enum(['strict', 'relaxed']).optional(),
    distribution: z.enum(['uniform', 'normal', 'realistic']).optional(),
    locale: z.string().optional(),
  }).optional(),
});

/**
 * POST /api/synthetic-data/generate
 * Generate synthetic dataset using WAI orchestration
 */
router.post('/generate', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const validated = dataGenerationSchema.parse(req.body);

    // CRITICAL SECURITY: Verify startup belongs to current user
    const [startup] = await db
      .select()
      .from(wizardsStartups)
      .innerJoin(wizardsFounders, eq(wizardsStartups.founderId, wizardsFounders.id))
      .where(
        and(
          eq(wizardsStartups.id, validated.startupId),
          eq(wizardsFounders.userId, userId)
        )
      )
      .limit(1);

    if (!startup) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You do not have access to this startup',
      });
    }

    const dataset = await syntheticDataEngine.generateDataset(validated as DataGenerationRequest);

    res.json({
      success: true,
      dataset,
    });
  } catch (error: any) {
    console.error('Synthetic data generation error:', error);
    res.status(error.name === 'ZodError' ? 400 : 500).json({
      success: false,
      error: error.message || 'Failed to generate synthetic data',
    });
  }
});

/**
 * GET /api/synthetic-data/templates
 * Get available industry templates
 */
router.get('/templates', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const templates = syntheticDataEngine.getIndustryTemplates();

    res.json({
      success: true,
      templates,
    });
  } catch (error: any) {
    console.error('Template fetch error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch templates',
    });
  }
});

/**
 * GET /api/synthetic-data/templates/:industry
 * Get template schema for specific industry
 */
router.get('/templates/:industry', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { industry } = req.params;
    const schema = syntheticDataEngine.getTemplateSchema(industry);

    if (!schema) {
      return res.status(404).json({
        success: false,
        error: `No template found for industry: ${industry}`,
      });
    }

    res.json({
      success: true,
      schema,
    });
  } catch (error: any) {
    console.error('Template schema fetch error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch template schema',
    });
  }
});

export default router;
