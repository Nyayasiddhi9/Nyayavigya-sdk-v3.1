/**
 * Assistants Route - Compatibility Layer
 * 
 * @deprecated This is a compatibility wrapper. New code should use ai-assistant-builder.ts directly.
 * This wrapper delegates to the comprehensive AI Assistant Builder platform for enhanced capabilities.
 */

import { Router } from 'express';
import { aiAssistantRouter } from './ai-assistant-builder';

const router = Router();

console.log('⚠️  Assistants Route: Using compatibility wrapper - consider migrating to ai-assistant-builder');

// Delegate all routes to the comprehensive AI Assistant Builder
router.use('/', aiAssistantRouter);

// Backward compatibility endpoints
router.get('/', async (req, res) => {
  try {
    // Redirect to the comprehensive AI assistant builder templates
    const response = await fetch(`${req.protocol}://${req.get('host')}/api/ai-assistant-builder/templates`);
    const data = await response.json();
    
    // Transform to simple format for backward compatibility
    const assistants = data.data?.map((template: any) => ({
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      features: template.features,
      userId: 1 // Demo user for backward compatibility
    })) || [];
    
    res.json(assistants);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assistants' });
  }
});

export default router;