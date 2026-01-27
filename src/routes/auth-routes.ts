
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { userManagementService } from '../services/user-management-service';
import { logError } from '../lib/errorHandler';

// Helper function for consistent error responses
function sendErrorResponse(res: express.Response, statusCode: number, message: string, error?: unknown) {
  if (error) {
    logError(error, message);
  }
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && error instanceof Error && {
      details: error.message
    })
  });
}

// Type-safe interfaces for user objects
interface UserProfile {
  id: number | string;
  email: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  name?: string;
  avatar?: string;
  role: string;
  subscriptionTier?: string;
  subscriptionStatus?: string;
  preferences?: any;
  createdAt?: string | Date;
  lastLoginAt?: string;
  metadata?: any;
  updatedAt?: Date;
}

interface JWTPayload {
  userId: number | string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

const router = express.Router();

// CRITICAL: JWT_SECRET must be set in environment variables
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is required for authentication. Server cannot start without it.');
}

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, username } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    const user = await userManagementService.registerUser(email, password, {
      firstName,
      lastName,
      username,
      role: 'user'
    });

    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Sanitize user object - NEVER send passwordHash!
    const sanitizedUser = {
      id: user.id,
      email: user.email,
      name: user.firstName || user.email,
      avatar: user.avatarUrl || user.profileImage,
      role: user.role,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionStatus: user.subscriptionStatus
    };

    res.json({
      success: true,
      message: 'Registration successful',
      token,
      user: sanitizedUser
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Registration failed';
    const statusCode = errorMessage.includes('already exists') ? 409 : 500;
    sendErrorResponse(res, statusCode, 'Registration failed', error);
  }
});

// Login with email/password or username/password - Production Authentication
router.post('/login', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const loginField = email || username;

    if (!loginField || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username/email and password are required'
      });
    }

    console.log('🔐 Authenticating user:', loginField);

    const user = await userManagementService.authenticateUser(loginField, password);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username/email or password'
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        userId: user!.id, 
        email: user!.email,
        role: user!.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Sanitize user object before sending to client - NEVER send passwordHash!
    const userProfile = user as unknown as UserProfile;
    const sanitizedUser = {
      id: user!.id,
      email: user!.email,
      name: userProfile.firstName || userProfile.name || user!.email,
      avatar: userProfile.avatar,
      role: user!.role,
      subscriptionTier: userProfile.subscriptionTier,
      subscriptionStatus: userProfile.subscriptionStatus
    };

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: sanitizedUser,
      sessionInfo: {
        loginTime: new Date().toISOString(),
        expiresIn: '7d',
        sessionId: `session_${Date.now()}`
      }
    });
  } catch (error) {
    sendErrorResponse(res, 500, 'Login failed', error);
  }
});

// OAuth routes disabled - implement real OAuth provider integration before enabling
// router.get('/google', ...)
// router.get('/replit', ...)
// router.get('/github', ...)
// router.get('/callback/:provider', ...)

// Get current user (me) - used for auth validation and hydration
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    const user = await userManagementService.getUserById(String(decoded.userId));

    // Check if user exists
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userProfile = user as unknown as UserProfile;
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: userProfile.name || `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() || userProfile.username || 'User',
        avatar: userProfile.avatar,
        role: user.role,
        subscriptionTier: userProfile.subscriptionTier,
        subscriptionStatus: userProfile.subscriptionStatus
      }
    });
  } catch (error) {
    sendErrorResponse(res, 401, 'Invalid or expired token', error);
  }
});

// Verify token (legacy endpoint - kept for backward compatibility)
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    const user = await userManagementService.getUserById(String(decoded.userId));

    // Check if user exists
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userProfile = user as unknown as UserProfile;
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: userProfile.name || `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() || userProfile.username || 'User',
        avatar: userProfile.avatar,
        role: user.role,
        subscriptionTier: userProfile.subscriptionTier,
        subscriptionStatus: userProfile.subscriptionStatus
      }
    });
  } catch (error) {
    sendErrorResponse(res, 401, 'Invalid or expired token', error);
  }
});

// Logout
router.post('/logout', (req, res) => {
  try {
    // In production, you might want to blacklist the token
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    sendErrorResponse(res, 500, 'Logout failed', error);
  }
});

// Get user profile - production authentication required
router.get('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    const user = await userManagementService.getUserById(String(decoded.userId));

    // Check if user exists
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userProfile = user as unknown as UserProfile;
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: userProfile.name || `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() || userProfile.username || 'User',
        avatar: userProfile.avatar,
        role: user.role,
        subscriptionTier: userProfile.subscriptionTier,
        subscriptionStatus: userProfile.subscriptionStatus,
        preferences: userProfile.preferences,
        createdAt: userProfile.createdAt,
        lastLoginAt: userProfile.lastLoginAt
      }
    });
  } catch (error) {
    sendErrorResponse(res, 500, 'Failed to get profile', error);
  }
});

// Get user progress - removed demo endpoint, implement real progress tracking
router.get('/progress', async (req, res) => {
  try {
    return res.status(501).json({
      success: false,
      message: 'Progress tracking not yet implemented'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user progress'
    });
  }
});

export default router;
