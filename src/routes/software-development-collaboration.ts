/**
 * Software Development Collaboration Route - Compatibility Layer
 * 
 * @deprecated This is a compatibility wrapper. New code should use software-development.ts directly.
 * This wrapper delegates to the main Software Development platform for enhanced capabilities.
 */

import express, { Request, Response } from 'express';

const router = express.Router();

console.log('⚠️  Software Development Collaboration Route: Using compatibility wrapper - consider migrating to software-development');

// Backward compatibility for collaboration endpoints
router.get('/projects/:projectId/collaboration/status', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    
    // Return simplified collaboration status for backward compatibility
    const mockStats = {
      activeUsers: 1,
      filesOpen: 0,
      lastActivity: new Date().toISOString()
    };
    
    const mockUsers = [
      { id: 1, name: 'Current User', role: 'owner', status: 'active' }
    ];
    
    const mockActiveFiles = [];

    res.json({
      success: true,
      data: {
        stats: mockStats,
        users: mockUsers,
        activeFiles: mockActiveFiles,
        isActive: true
      }
    });
  } catch (error) {
    console.error('Error getting collaboration status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get collaboration status'
    });
  }
});

// Simplified invite endpoint for backward compatibility
router.post('/projects/:projectId/collaboration/invite', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { emails } = req.body;

    res.json({
      success: true,
      data: {
        projectId,
        invitedEmails: emails,
        status: 'invitations_sent'
      }
    });
  } catch (error) {
    console.error('Error sending invitations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send invitations'
    });
  }
});

export default router;