/**
 * Game Studio Route - Compatibility Layer
 * 
 * @deprecated This is a compatibility wrapper. New code should use game-builder.ts directly.
 * This wrapper delegates to the comprehensive Game Builder platform for enhanced capabilities.
 */

import { Router, Request, Response } from 'express';
import { gameBuilderRouter } from './game-builder';

const router = Router();

console.log('⚠️  Game Studio Route: Using compatibility wrapper - consider migrating to game-builder');

// Delegate all routes to the comprehensive Game Builder
router.use('/', gameBuilderRouter);

// Backward compatibility for game templates
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const templates = [
      {
        id: 'mindful-memory',
        name: 'Mindful Memory',
        description: 'A therapeutic memory game that helps reduce anxiety and improve focus through mindfulness exercises',
        category: 'mental-health',
        difficulty: 'Beginner',
        estimatedTime: '5 min',
        features: ['Breathing exercises', 'Progress tracking', 'Calming visuals', 'Meditation sounds'],
        tags: ['anxiety', 'mindfulness', 'meditation', 'therapeutic'],
        icon: 'heart',
        gradient: 'from-pink-500 to-rose-600'
      },
      {
        id: 'learning-adventure',
        name: 'Learning Adventure',
        description: 'Interactive educational game that makes learning fun with personalized challenges and rewards',
        category: 'kids',
        difficulty: 'Beginner',
        estimatedTime: '8 min',
        features: ['Adaptive difficulty', 'Character progression', 'Parent dashboard', 'Achievement system'],
        tags: ['education', 'kids', 'adaptive', 'rewards'],
        icon: 'smile',
        gradient: 'from-blue-500 to-cyan-600'
      }
    ];

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching game templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch game templates'
    });
  }
});

export default router;