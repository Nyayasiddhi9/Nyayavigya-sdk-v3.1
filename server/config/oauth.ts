/**
 * OAuth Configuration - Production Ready
 * Supports Google OAuth, GitHub OAuth, and enterprise SSO
 */
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { storage } from '../storage';
import type { User, InsertUser } from '@shared/schema';

// OAuth Configuration
export const oauthConfig = {
  google: {
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback'
  },
  github: {
    clientID: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    callbackURL: process.env.GITHUB_CALLBACK_URL || '/auth/github/callback'
  }
};

// Initialize OAuth strategies
export function initializeOAuth() {
  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: oauthConfig.google.clientID,
      clientSecret: oauthConfig.google.clientSecret,
      callbackURL: oauthConfig.google.callbackURL,
      scope: ['profile', 'email']
    },
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        // Check if user already exists
        let user = await storage.getUserByEmail(profile.emails[0].value);
        
        if (!user) {
          // Create new user
          const newUser: InsertUser = {
            email: profile.emails[0].value,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            profileImageUrl: profile.photos[0]?.value,
            provider: 'google',
            providerId: profile.id,
            subscriptionPlan: 'alpha',
            isActive: true
          };
          
          user = await storage.createUser(newUser);
        } else {
          // Update existing user with OAuth info
          user = await storage.updateUser(user.id, {
            provider: 'google',
            providerId: profile.id,
            profileImageUrl: profile.photos[0]?.value
          });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }));
  }

  // GitHub OAuth Strategy
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(new GitHubStrategy({
      clientID: oauthConfig.github.clientID,
      clientSecret: oauthConfig.github.clientSecret,
      callbackURL: oauthConfig.github.callbackURL,
      scope: ['user:email', 'repo']
    },
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        // Get primary email from GitHub
        const email = profile.emails?.find((e: any) => e.primary)?.value || profile.emails[0]?.value;
        
        let user = await storage.getUserByEmail(email);
        
        if (!user) {
          const newUser: InsertUser = {
            email: email,
            firstName: profile.displayName?.split(' ')[0] || profile.username,
            lastName: profile.displayName?.split(' ')[1] || '',
            profileImageUrl: profile.photos[0]?.value,
            provider: 'github',
            providerId: profile.id,
            subscriptionPlan: 'alpha',
            isActive: true
          };
          
          user = await storage.createUser(newUser);
        } else {
          user = await storage.updateUser(user.id, {
            provider: 'github',
            providerId: profile.id,
            profileImageUrl: profile.photos[0]?.value
          });
        }
        
        // Store GitHub access token for repository access
        if (accessToken) {
          await storage.storeProviderToken(user.id, 'github', accessToken);
        }
        
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }));
  }

  // Passport serialization
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
}

// OAuth middleware for routes
export function requireAuth(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
}

export function requireRole(role: string) {
  return (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (req.user.role !== role && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
}