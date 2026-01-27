import { Router, Request, Response } from 'express';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { db } from '../db';
import { users } from '../../shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

/**
 * 2FA (Two-Factor Authentication) Routes
 * Implements TOTP (Time-based One-Time Password) using speakeasy
 */

// Middleware to require authentication
const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }
  next();
};

/**
 * POST /api/2fa/setup
 * Generate a new 2FA secret and QR code for the user
 */
router.post('/setup', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const userEmail = (req.user as any).email;

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Wizards Incubator (${userEmail})`,
      issuer: 'Wizards Incubator Platform',
      length: 32,
    });

    // Save the secret to the database (encrypted in production)
    await db
      .update(users)
      .set({
        twoFactorSecret: secret.base32,
        twoFactorEnabled: false, // Not enabled until verified
      })
      .where(eq(users.id, userId));

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');

    res.json({
      success: true,
      message: '2FA setup initiated. Scan the QR code with your authenticator app.',
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntry: {
        issuer: 'Wizards Incubator Platform',
        account: userEmail,
        secret: secret.base32,
      },
    });
  } catch (error) {
    console.error('Error setting up 2FA:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to setup 2FA',
    });
  }
});

/**
 * POST /api/2fa/verify
 * Verify the TOTP code and enable 2FA
 */
router.post('/verify', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required',
      });
    }

    // Get user's secret
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({
        success: false,
        error: '2FA setup not initiated. Please call /setup first.',
      });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token.toString(),
      window: 2, // Allow 2 time steps before and after
    });

    if (!verified) {
      return res.status(400).json({
        success: false,
        error: 'Invalid token. Please try again.',
      });
    }

    // Enable 2FA
    await db
      .update(users)
      .set({
        twoFactorEnabled: true,
      })
      .where(eq(users.id, userId));

    res.json({
      success: true,
      message: '2FA enabled successfully',
      twoFactorEnabled: true,
    });
  } catch (error) {
    console.error('Error verifying 2FA:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify 2FA',
    });
  }
});

/**
 * POST /api/2fa/disable
 * Disable 2FA for the user (requires current password or 2FA code)
 */
router.post('/disable', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required to disable 2FA',
      });
    }

    // Get user's secret
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        error: '2FA is not enabled',
      });
    }

    // Verify token before disabling
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret!,
      encoding: 'base32',
      token: token.toString(),
      window: 2,
    });

    if (!verified) {
      return res.status(400).json({
        success: false,
        error: 'Invalid token. Cannot disable 2FA.',
      });
    }

    // Disable 2FA and clear secret
    await db
      .update(users)
      .set({
        twoFactorEnabled: false,
        twoFactorSecret: null,
      })
      .where(eq(users.id, userId));

    res.json({
      success: true,
      message: '2FA disabled successfully',
      twoFactorEnabled: false,
    });
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disable 2FA',
    });
  }
});

/**
 * POST /api/2fa/validate
 * Validate a 2FA token (used during login or sensitive operations)
 */
router.post('/validate', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required',
      });
    }

    // Get user's secret
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(400).json({
        success: false,
        error: '2FA is not enabled for this user',
      });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token.toString(),
      window: 2,
    });

    if (!verified) {
      return res.status(400).json({
        success: false,
        error: 'Invalid 2FA token',
        valid: false,
      });
    }

    res.json({
      success: true,
      message: '2FA token is valid',
      valid: true,
    });
  } catch (error) {
    console.error('Error validating 2FA:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate 2FA token',
    });
  }
});

/**
 * GET /api/2fa/status
 * Get 2FA status for the current user
 */
router.get('/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;

    const [user] = await db
      .select({
        twoFactorEnabled: users.twoFactorEnabled,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      twoFactorEnabled: user.twoFactorEnabled || false,
    });
  } catch (error) {
    console.error('Error getting 2FA status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get 2FA status',
    });
  }
});

export default router;
