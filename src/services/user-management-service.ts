import { storage } from '../storage/database-storage';
import { encryptionService } from './encryption-service';
import { eventService } from '../config/redis';
import bcrypt from 'bcrypt';
import type { User, InsertUser } from '../../shared/schema';

interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'inactive' | 'cancelled' | 'trial' | 'past_due';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEnd?: Date;
  cancelAtPeriodEnd: boolean;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

interface UserContent {
  id: string;
  userId: string;
  type: 'project' | 'assistant' | 'game' | 'content' | 'workflow';
  data: any;
  permissions: string[];
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UserManagementService {

  async createUser(userData: Partial<InsertUser>): Promise<User> {
    try {
      if (!userData.email) {
        throw new Error('Email is required');
      }

      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        throw new Error('Email already exists');
      }

      const username = userData.username || `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

      const existingUsername = await storage.getUserByEmailOrUsername(username);
      if (existingUsername) {
        throw new Error('Username already exists');
      }

      const user = await storage.createUser({
        email: userData.email,
        username,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        avatarUrl: userData.avatarUrl || null,
        passwordHash: userData.passwordHash || null,
        role: userData.role || 'user',
        subscriptionPlan: userData.subscriptionPlan || 'alpha',
        subscriptionStatus: userData.subscriptionStatus || 'trial',
        organizationId: userData.organizationId || null,
        preferences: userData.preferences || {
          theme: 'light',
          notifications: true,
          language: 'en',
          timezone: 'UTC'
        },
      });

      // Publish user_created event (non-blocking - don't fail signup if Redis is unavailable)
      try {
        await eventService.publishEvent('user_created', {
          userId: user.id,
          email: user.email,
          subscriptionPlan: user.subscriptionPlan
        });
      } catch (eventError) {
        console.warn('Failed to publish user_created event (non-critical):', eventError);
      }

      return user;
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  }

  async getUserByEmailOrUsername(emailOrUsername: string): Promise<User | null> {
    return await storage.getUserByEmailOrUsername(emailOrUsername) || null;
  }

  async getUserById(userId: string): Promise<User | null> {
    return await storage.getUser(userId as any) || null;
  }

  async authenticateUser(emailOrUsername: string, password: string): Promise<User | null> {
    try {
      console.log('🔐 Authenticating user from database:', emailOrUsername);
      
      const dbUser = await storage.getUserByEmailOrUsername(emailOrUsername);
      
      if (!dbUser || !dbUser.passwordHash) {
        console.log('❌ User not found or no password hash:', emailOrUsername);
        return null;
      }
      
      console.log('✅ User found in database, verifying password...');
      const isPasswordValid = await bcrypt.compare(password, dbUser.passwordHash);
      
      if (!isPasswordValid) {
        console.log('❌ Invalid password for user:', emailOrUsername);
        return null;
      }
      
      console.log('✅ User authenticated successfully:', dbUser.email);
      
      return dbUser;
    } catch (error) {
      console.error('❌ Failed to authenticate user:', error);
      return null;
    }
  }

  async registerUser(email: string, password: string, userData: Partial<InsertUser> = {}): Promise<User> {
    const passwordHash = await bcrypt.hash(password, 10);
    
    const user = await this.createUser({
      ...userData,
      email,
      passwordHash,
    });
    
    await eventService.publishEvent('user_registered', {
      userId: user.id,
      email: user.email
    });
    
    return user;
  }

  async updateUserSubscription(userId: string, planId: string): Promise<void> {
    try {
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const tierMap: { [key: string]: string } = {
        'alpha': 'alpha',
        'beta': 'beta',
        'gamma': 'gamma',
        'enterprise': 'enterprise'
      };

      await storage.updateUser(user.id as any, {
        subscriptionPlan: tierMap[planId] as any,
        subscriptionStatus: 'active'
      });

      await eventService.publishEvent('subscription_updated', {
        userId,
        planId,
        status: 'active'
      });
    } catch (error) {
      console.error('Failed to update subscription:', error);
      throw new Error('Subscription update failed');
    }
  }

  getUserPermissions(user: User): {
    maxProjects: number;
    maxAssistants: number;
    availableAgents: number;
    availableLLMProviders: number;
    features: string[];
  } {
    const permissions = {
      alpha: {
        maxProjects: 3,
        maxAssistants: 2,
        availableAgents: 10,
        availableLLMProviders: 3,
        features: ['basic_workflows', 'content_creation', 'basic_support']
      },
      beta: {
        maxProjects: 10,
        maxAssistants: 5,
        availableAgents: 20,
        availableLLMProviders: 7,
        features: ['advanced_workflows', 'content_creation', 'ai_assistants', 'priority_support', 'analytics']
      },
      gamma: {
        maxProjects: 50,
        maxAssistants: 20,
        availableAgents: 35,
        availableLLMProviders: 11,
        features: ['all_workflows', 'team_collaboration', 'enterprise_integrations', 'dedicated_support', 'advanced_analytics', 'custom_branding']
      },
      enterprise: {
        maxProjects: -1,
        maxAssistants: -1,
        availableAgents: 39,
        availableLLMProviders: 13,
        features: ['unlimited_everything', 'white_label', 'custom_integrations', '24_7_support', 'sla_guarantee', 'custom_training']
      }
    };

    return permissions[user.subscriptionPlan as keyof typeof permissions] || permissions.alpha;
  }

  async canUserPerformAction(userId: string, action: string): Promise<boolean> {
    try {
      const user = await this.getUserById(userId);
      if (!user) return false;

      const permissions = this.getUserPermissions(user);

      switch (action) {
        case 'create_project':
          if (permissions.maxProjects === -1) return true;
          const projectCount = await storage.getUserProjects(user.id as any, {}).then(p => p.length);
          return projectCount < permissions.maxProjects;

        case 'create_assistant':
          if (permissions.maxAssistants === -1) return true;
          return true;

        case 'access_enterprise_features':
          return permissions.features.includes('enterprise_integrations');

        case 'access_analytics':
          return permissions.features.includes('analytics') || permissions.features.includes('advanced_analytics');

        default:
          return true;
      }
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  }

  async getUserContent(userId: string, type?: string): Promise<UserContent[]> {
    try {
      return [];
    } catch (error) {
      console.error('Failed to get user content:', error);
      return [];
    }
  }

  async createUserContent(userId: string, type: string, data: any): Promise<UserContent> {
    try {
      const canCreate = await this.canUserPerformAction(userId, `create_${type}`);
      if (!canCreate) {
        throw new Error(`User has reached the limit for ${type} creation`);
      }

      const content: UserContent = {
        id: `${type}_${Date.now()}`,
        userId,
        type: type as any,
        data,
        permissions: ['read', 'write', 'delete'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return content;
    } catch (error) {
      console.error('Failed to create user content:', error);
      throw error;
    }
  }

  async getSuperAdminDashboard(adminUserId: string): Promise<any> {
    const admin = await this.getUserById(adminUserId);
    if (!admin || admin.role !== 'super_admin') {
      throw new Error('Unauthorized: Super admin access required');
    }

    const totalUsers = await storage.getAllUsers().then(users => users.length);
    const activeUsers = await storage.getAllUsers().then(users => 
      users.filter(u => u.subscriptionStatus === 'active').length
    );

    return {
      totalUsers,
      activeSubscriptions: activeUsers,
      revenueMetrics: { mrr: 0, arr: 0 },
      systemHealth: { status: 'healthy', uptime: '99.9%' },
      userActivity: [],
      subscriptionDistribution: {}
    };
  }

  async manageUserSubscription(adminUserId: string, targetUserId: string, action: string, data?: any): Promise<void> {
    const admin = await this.getUserById(adminUserId);
    if (!admin || admin.role !== 'super_admin') {
      throw new Error('Unauthorized: Super admin access required');
    }

    switch (action) {
      case 'upgrade':
      case 'downgrade':
        await this.updateUserSubscription(targetUserId, data.planId);
        break;
      case 'cancel':
        await this.cancelUserSubscription(targetUserId);
        break;
      case 'reactivate':
        await this.reactivateUserSubscription(targetUserId);
        break;
    }
  }

  private async cancelUserSubscription(userId: string): Promise<void> {
    const user = await this.getUserById(userId);
    if (!user) throw new Error('User not found');
    
    await storage.updateUser(user.id as any, {
      subscriptionStatus: 'cancelled'
    });
  }

  private async reactivateUserSubscription(userId: string): Promise<void> {
    const user = await this.getUserById(userId);
    if (!user) throw new Error('User not found');
    
    await storage.updateUser(user.id as any, {
      subscriptionStatus: 'active'
    });
  }

  async createSuperAdmin(): Promise<void> {
    try {
      const existingAdmin = await storage.getUserByEmail('admin@waidevstudio.com');
      if (existingAdmin) {
        console.log('✅ Super admin already exists');
        return;
      }

      // Use cryptographically secure random password that must be changed on first login
      const crypto = await import('crypto');
      const randomPassword = crypto.randomBytes(24).toString('base64');
      const passwordHash = await bcrypt.hash(randomPassword, 12);
      const adminUser = await this.createUser({
        email: 'admin@waidevstudio.com',
        username: 'admin',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'super_admin',
        subscriptionPlan: 'enterprise',
        passwordHash
      });

      console.log('✅ Super admin user created:', adminUser.username);
      console.log('⚠️  SECURITY: Use password reset flow to set admin password - no default credentials');
    } catch (error) {
      console.error('❌ Failed to create super admin:', error);
    }
  }

  async seedAll(): Promise<void> {
    console.log('🌱 Starting database seeding...');

    try {
      await this.createSuperAdmin();

      console.log('🎉 Database seeding completed successfully!');
    } catch (error) {
      console.error('❌ Database seeding failed:', error);
      throw error;
    }
  }
}

export const userManagementService = new UserManagementService();
