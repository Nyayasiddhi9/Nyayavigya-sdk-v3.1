import { Router, Request, Response } from 'express';
import passport from '../config/oauth-config';

const router = Router();

/**
 * OAuth Routes for Wizards Incubator Platform
 * Supports Google and GitHub OAuth providers
 * Only exposes routes if provider credentials are configured
 */

const GOOGLE_CONFIGURED = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const GITHUB_CONFIGURED = !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);

// Google OAuth (only if configured)
if (GOOGLE_CONFIGURED) {
  router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'],
  }));

  router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login?error=oauth_failed' }),
    (req: Request, res: Response) => {
      // Successful authentication, redirect to dashboard
      res.redirect('/dashboard');
    }
  );
} else {
  router.get('/google', (req: Request, res: Response) => {
    res.status(503).json({
      success: false,
      error: 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.',
    });
  });
  router.get('/google/callback', (req: Request, res: Response) => {
    res.status(503).json({
      success: false,
      error: 'Google OAuth is not configured.',
    });
  });
}

// GitHub OAuth (only if configured)
if (GITHUB_CONFIGURED) {
  router.get('/github', passport.authenticate('github', {
    scope: ['user:email'],
  }));

  router.get('/github/callback',
    passport.authenticate('github', { failureRedirect: '/login?error=oauth_failed' }),
    (req: Request, res: Response) => {
      // Successful authentication, redirect to dashboard
      res.redirect('/dashboard');
    }
  );
} else {
  router.get('/github', (req: Request, res: Response) => {
    res.status(503).json({
      success: false,
      error: 'GitHub OAuth is not configured. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables.',
    });
  });
  router.get('/github/callback', (req: Request, res: Response) => {
    res.status(503).json({
      success: false,
      error: 'GitHub OAuth is not configured.',
    });
  });
}

// OAuth logout
router.post('/logout', (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Failed to logout',
      });
    }
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  });
});

// Get OAuth provider status
router.get('/providers', (req: Request, res: Response) => {
  res.json({
    success: true,
    providers: {
      google: GOOGLE_CONFIGURED,
      github: GITHUB_CONFIGURED,
    },
    message: 'OAuth provider configuration status',
  });
});

// Get current OAuth user
router.get('/me', (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated',
    });
  }

  const user = req.user as any;
  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      avatarUrl: user.avatarUrl,
      oauthProvider: user.oauthProvider,
    },
  });
});

export default router;
