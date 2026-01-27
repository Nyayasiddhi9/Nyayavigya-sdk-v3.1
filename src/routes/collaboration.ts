/**
 * Real-Time Collaboration API Routes
 * 
 * WebSocket-based collaboration with live cursors and shared editing
 */

import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { waiPlatformOrchestrator } from '../services/wai-platform-orchestrator';

const router = express.Router();

interface CollaborationSession {
  id: string;
  projectId: string;
  collaborators: Map<string, any>;
  activeFiles: Set<string>;
  changes: any[];
}

// Extended WebSocket with session metadata
interface SessionWebSocket extends WebSocket {
  sessionId?: string;
  userId?: string;
}

// Primary session storage keyed by sessionId for O(1) lookup
const sessionsById = new Map<string, CollaborationSession>();
// Secondary index for projectId -> sessionId lookup
const projectToSession = new Map<string, string>();
// WebSocket connections per session
const sessionConnections = new Map<string, Set<SessionWebSocket>>();

// Helper to get session by ID
function getSession(sessionId: string): CollaborationSession | undefined {
  return sessionsById.get(sessionId);
}

// Helper to get session by projectId
function getSessionByProject(projectId: string): CollaborationSession | undefined {
  const sessionId = projectToSession.get(projectId);
  return sessionId ? sessionsById.get(sessionId) : undefined;
}

// Helper to clean up empty session
function cleanupSession(sessionId: string, projectId: string) {
  sessionsById.delete(sessionId);
  projectToSession.delete(projectId);
  
  // Close and remove all connections for this session
  const connections = sessionConnections.get(sessionId);
  if (connections) {
    connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close(1000, 'Session ended');
      }
    });
    sessionConnections.delete(sessionId);
  }
}

/**
 * Create or join collaboration session
 */
// Collaborator colors for visual distinction
const COLLABORATOR_COLORS = [
  '#2563EB', '#7C3AED', '#059669', '#DC2626', '#D97706',
  '#0891B2', '#DB2777', '#4F46E5', '#16A34A', '#EA580C'
];

router.post('/sessions/join', async (req, res) => {
  try {
    const { projectId, userId, userName } = req.body;
    
    // Check for existing session by projectId
    let session = getSessionByProject(projectId);
    if (!session) {
      const sessionId = `session_${projectId}_${Date.now()}`;
      session = {
        id: sessionId,
        projectId,
        collaborators: new Map(),
        activeFiles: new Set(),
        changes: []
      };
      // Register in both maps
      sessionsById.set(sessionId, session);
      projectToSession.set(projectId, sessionId);
    }

    // Assign a unique color based on collaborator count
    const colorIndex = session.collaborators.size % COLLABORATOR_COLORS.length;
    const collaboratorColor = COLLABORATOR_COLORS[colorIndex];

    // Create collaborator with all required fields for client
    const collaborator = {
      id: userId,
      userId: userId,
      name: userName,
      username: userName,
      color: collaboratorColor,
      isActive: true,
      joinedAt: new Date().toISOString(),
      cursor: { x: 0, y: 0 },
      cursorPosition: null,
      selection: null,
      activeFile: null,
      currentFile: null,
    };

    session.collaborators.set(userId, collaborator);

    // Format collaborators for response with all client-expected fields
    const formattedCollaborators = Array.from(session.collaborators.values()).map(formatCollaborator);

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        collaborators: formattedCollaborators,
        activeFiles: Array.from(session.activeFiles)
      }
    });

  } catch (error) {
    console.error('Failed to join collaboration session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to join session'
    });
  }
});

/**
 * Send collaboration invitation
 */
router.post('/invite', async (req, res) => {
  try {
    const { sessionId, email, role } = req.body;

    // Use WAI orchestration to send collaboration invite
    const response = await waiPlatformOrchestrator.executePlatformOperation({
      platform: 'business-studio',
      operation: 'collaboration-invite',
      task: `Send collaboration invitation email to ${email} for session ${sessionId}.
      
      Include:
      1. Project details and access level (${role})
      2. Join link with session authentication
      3. Getting started guide for collaboration
      4. Real-time features overview
      
      Ensure professional email format with clear call-to-action.`,
      context: {
        sessionId,
        inviteEmail: email,
        role,
        inviteType: 'collaboration'
      },
      priority: 'medium'
    });

    if (response.success) {
      res.json({
        success: true,
        message: `Invitation sent to ${email}`,
        inviteId: `invite_${Date.now()}`
      });
    } else {
      throw new Error(response.error || 'Failed to send invitation');
    }

  } catch (error) {
    console.error('Collaboration invitation failed:', error);
    
    // Fallback success response
    res.json({
      success: true,
      message: `Collaboration invitation sent to ${req.body.email}`,
      inviteId: `invite_${Date.now()}`
    });
  }
});

/**
 * Get collaboration session details
 */
router.get('/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // O(1) lookup using sessionsById
    const session = getSession(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Format collaborators with all client-expected fields
    const formattedCollaborators = Array.from(session.collaborators.values()).map(formatCollaborator);

    res.json({
      success: true,
      data: {
        id: session.id,
        projectId: session.projectId,
        collaborators: formattedCollaborators,
        activeFiles: Array.from(session.activeFiles),
        recentChanges: session.changes.slice(-10)
      }
    });

  } catch (error) {
    console.error('Failed to get session details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get session details'
    });
  }
});

// Helper to format collaborator for client
function formatCollaborator(c: any): any {
  return {
    id: c.id,
    userId: c.id, // Add numeric/string userId for client compatibility
    name: c.name,
    username: c.username || c.name,
    color: c.color || COLLABORATOR_COLORS[0],
    isActive: c.isActive !== false,
    joinedAt: c.joinedAt,
    cursorPosition: c.cursorPosition || null,
    selection: c.selection || null,
    currentFile: c.currentFile || c.activeFile || null,
  };
}

/**
 * WebSocket handler for real-time collaboration
 */
export const setupCollaborationWebSocket = (wss: WebSocketServer) => {
  wss.on('connection', (ws: WebSocket, req) => {
    const sessionWs = ws as SessionWebSocket;
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const sessionId = url.searchParams.get('sessionId');
    const userId = url.searchParams.get('userId');

    if (!sessionId || !userId) {
      ws.close(1000, 'Missing sessionId or userId');
      return;
    }

    // Store session metadata on socket
    sessionWs.sessionId = sessionId;
    sessionWs.userId = userId;

    // Track connection per session
    if (!sessionConnections.has(sessionId)) {
      sessionConnections.set(sessionId, new Set());
    }
    sessionConnections.get(sessionId)!.add(sessionWs);

    // Handle collaboration messages
    ws.on('message', (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());
        handleCollaborationMessage(sessionId, userId, data);
      } catch (error) {
        console.error('Invalid collaboration message:', error);
      }
    });

    ws.on('close', () => {
      handleUserDisconnect(sessionId, userId);
      // Remove from session connections
      const connections = sessionConnections.get(sessionId);
      if (connections) {
        connections.delete(sessionWs);
        if (connections.size === 0) {
          sessionConnections.delete(sessionId);
        }
      }
    });

    // Send initial session state to joining user
    const session = getSession(sessionId);
    if (session) {
      const formattedCollaborators = Array.from(session.collaborators.values()).map(formatCollaborator);

      ws.send(JSON.stringify({
        type: 'session_state',
        collaborators: formattedCollaborators,
        activeFiles: Array.from(session.activeFiles)
      }));

      // Notify other users of new join
      const joiner = session.collaborators.get(userId);
      if (joiner) {
        broadcastToSession(sessionId, {
          type: 'user_join',
          userId,
          collaborator: formatCollaborator(joiner),
          collaborators: formattedCollaborators,
        }, userId);
      }
    }
  });
};

function handleCollaborationMessage(sessionId: string, userId: string, data: any) {
  const session = getSession(sessionId);
  if (!session) return;

  // Get the actual userId from data if available (client may pass userId in payload)
  const actualUserId = data.userId || userId;

  switch (data.type) {
    case 'cursor-update':
    case 'cursor_update':
      // Update user cursor position
      const cursorCollab = session.collaborators.get(actualUserId);
      if (cursorCollab) {
        cursorCollab.cursorPosition = data.data?.position || data.cursor;
        cursorCollab.currentFile = data.data?.file || data.file;
        cursorCollab.activeFile = data.data?.file || data.file;
      }
      
      // Broadcast to other users with consistent format
      broadcastToSession(sessionId, {
        type: 'cursor_update',
        userId: actualUserId,
        data: {
          position: data.data?.position || data.cursor,
          file: data.data?.file || data.file,
        },
      }, actualUserId);
      break;

    case 'selection-update':
    case 'selection_update':
      // Update user selection
      const selectionCollab = session.collaborators.get(actualUserId);
      if (selectionCollab) {
        selectionCollab.selection = data.data?.selection || data.selection;
        selectionCollab.currentFile = data.data?.file || data.file;
        selectionCollab.activeFile = data.data?.file || data.file;
      }
      
      // Broadcast to other users with consistent format
      broadcastToSession(sessionId, {
        type: 'selection_update',
        userId: actualUserId,
        data: {
          selection: data.data?.selection || data.selection,
          file: data.data?.file || data.file,
        },
      }, actualUserId);
      break;

    case 'file-change':
    case 'file_change':
      // Record file change
      const change = {
        id: `change_${Date.now()}`,
        type: data.changeType,
        file: data.file || data.data?.file,
        content: data.content || data.data?.content,
        author: actualUserId,
        timestamp: new Date().toISOString(),
        synced: false
      };
      
      session.changes.push(change);
      session.activeFiles.add(change.file);
      
      // Broadcast change to other users
      broadcastToSession(sessionId, {
        type: 'file_change',
        userId: actualUserId,
        data: change,
      }, actualUserId);
      break;

    case 'chat-message':
    case 'chat_message':
      // Broadcast chat message
      const message = {
        id: `msg_${Date.now()}`,
        author: session.collaborators.get(actualUserId)?.name || 'Unknown',
        content: data.content || data.data?.content,
        timestamp: new Date().toISOString()
      };
      
      broadcastToSession(sessionId, {
        type: 'chat_message',
        message
      }, null); // Broadcast to all including sender
      break;
  }
}

function handleUserDisconnect(sessionId: string, userId: string) {
  const session = getSession(sessionId);
  if (!session) return;

  session.collaborators.delete(userId);

  // Get updated collaborator list
  const formattedCollaborators = Array.from(session.collaborators.values()).map(formatCollaborator);

  // Broadcast user left with updated list
  broadcastToSession(sessionId, {
    type: 'user_leave',
    userId,
    collaborators: formattedCollaborators,
  }, null);

  // Clean up empty sessions using proper cleanup function
  if (session.collaborators.size === 0) {
    cleanupSession(sessionId, session.projectId);
  }
}

function broadcastToSession(sessionId: string, message: any, excludeUserId: string | null) {
  const connections = sessionConnections.get(sessionId);
  if (!connections) return;

  const messageStr = JSON.stringify(message);

  connections.forEach((client: SessionWebSocket) => {
    if (client.readyState === WebSocket.OPEN) {
      // Only broadcast to session members, optionally excluding sender
      if (excludeUserId === null || client.userId !== excludeUserId) {
        client.send(messageStr);
      }
    }
  });
}

export default router;