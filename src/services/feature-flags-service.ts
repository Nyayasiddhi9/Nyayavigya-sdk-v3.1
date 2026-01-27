import { db } from '../db';
import { featureFlags, type FeatureFlag, type InsertFeatureFlag } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Feature Flags Service - Per-Studio WAI v1.0 Enablement
 * 
 * Manages feature flags for gradual rollout of WAI SDK v1.0 capabilities
 * across the 13 studios (10 canonical + 3 legacy) without disrupting existing v9 workflows.
 * 
 * Flag Naming Convention:
 * - Global: 'wai_v1_enabled' (master switch)
 * - Studio: 'wai_v1_{studio_id}' (e.g., 'wai_v1_content_studio')
 * - Feature: 'wai_v1_mem0', 'wai_v1_mcp', 'wai_v1_multimodal'
 * 
 * Usage:
 * const useWAIv1 = await featureFlagsService.isEnabled('wai_v1_content_studio', 'studio', 'content_studio');
 */
export class FeatureFlagsService {
  /**
   * Check if a feature flag is enabled
   * @param flagKey - The feature flag key (e.g., 'wai_v1_content_studio')
   * @param scope - The scope ('global', 'studio', 'user', 'organization')
   * @param scopeId - The ID for the scope (optional for global)
   * @returns true if enabled, false otherwise
   */
  async isEnabled(
    flagKey: string,
    scope: 'global' | 'studio' | 'user' | 'organization' = 'global',
    scopeId: string = '_global'
  ): Promise<boolean> {
    try {
      // Check for scoped flag first (most specific)
      if (scopeId !== '_global') {
        const scopedFlag = await db.query.featureFlags.findFirst({
          where: and(
            eq(featureFlags.flagKey, flagKey),
            eq(featureFlags.scope, scope),
            eq(featureFlags.scopeId, scopeId)
          ),
        });

        if (scopedFlag) {
          return scopedFlag.enabled;
        }
      }

      // Fall back to global flag
      const globalFlag = await db.query.featureFlags.findFirst({
        where: and(
          eq(featureFlags.flagKey, flagKey),
          eq(featureFlags.scope, 'global'),
          eq(featureFlags.scopeId, '_global')
        ),
      });

      return globalFlag?.enabled ?? false;
    } catch (error) {
      console.error(`[FeatureFlagsService] Error checking flag ${flagKey}:`, error);
      // Fail closed - default to disabled on errors
      return false;
    }
  }

  /**
   * Check if WAI v1.0 is enabled for a specific studio
   * Hierarchical check: master switch → studio flag
   * @param studioId - The studio ID (e.g., 'content_studio', 'ideation_lab')
   * @returns true if WAI v1.0 is enabled for this studio
   */
  async isWAIv1EnabledForStudio(studioId: string): Promise<boolean> {
    // First check global master switch
    const masterEnabled = await this.isEnabled('wai_v1_enabled', 'global');
    if (!masterEnabled) {
      return false; // Master switch off, short-circuit
    }

    // Then check studio-specific flag
    const flagKey = `wai_v1_${studioId}`;
    return this.isEnabled(flagKey, 'studio', studioId);
  }

  /**
   * Check if a specific WAI v1.0 feature is enabled
   * @param feature - The feature name ('mem0', 'mcp', 'multimodal', 'tools')
   * @returns true if the feature is enabled globally
   */
  async isWAIv1FeatureEnabled(feature: string): Promise<boolean> {
    const flagKey = `wai_v1_${feature}`;
    return this.isEnabled(flagKey, 'global');
  }

  /**
   * Create or update a feature flag
   * @param flag - The feature flag data
   * @returns The created/updated feature flag
   */
  async setFlag(flag: InsertFeatureFlag): Promise<FeatureFlag> {
    try {
      // Ensure scopeId defaults to '_global' if not provided
      const scopeId = flag.scopeId || '_global';
      
      // Check if flag exists
      const existing = await db.query.featureFlags.findFirst({
        where: and(
          eq(featureFlags.flagKey, flag.flagKey),
          eq(featureFlags.scope, flag.scope || 'global'),
          eq(featureFlags.scopeId, scopeId)
        ),
      });

      if (existing) {
        // Update existing flag - merge metadata to preserve existing values
        const mergedMetadata = {
          ...(existing.metadata as object || {}),
          ...(flag.metadata as object || {}),
        };

        const [updated] = await db
          .update(featureFlags)
          .set({
            ...flag,
            scopeId, // Ensure scopeId is set
            // Preserve description if not provided in update
            description: flag.description || existing.description,
            // Merge metadata instead of overwriting
            metadata: mergedMetadata,
            updatedAt: new Date(),
          })
          .where(eq(featureFlags.id, existing.id))
          .returning();
        return updated;
      } else {
        // Create new flag
        const [created] = await db.insert(featureFlags).values({
          ...flag,
          scopeId, // Ensure scopeId is set
        }).returning();
        return created;
      }
    } catch (error) {
      console.error('[FeatureFlagsService] Error setting flag:', error);
      throw error;
    }
  }

  /**
   * Enable a feature flag
   * @param flagKey - The feature flag key
   * @param scope - The scope ('global', 'studio', 'user', 'organization')
   * @param scopeId - The ID for the scope (optional for global)
   */
  async enable(
    flagKey: string,
    scope: 'global' | 'studio' | 'user' | 'organization' = 'global',
    scopeId: string = '_global'
  ): Promise<FeatureFlag> {
    return this.setFlag({
      flagKey,
      flagName: flagKey.replace(/_/g, ' ').toUpperCase(),
      enabled: true,
      scope,
      scopeId,
    });
  }

  /**
   * Disable a feature flag
   * @param flagKey - The feature flag key
   * @param scope - The scope ('global', 'studio', 'user', 'organization')
   * @param scopeId - The ID for the scope (defaults to '_global')
   */
  async disable(
    flagKey: string,
    scope: 'global' | 'studio' | 'user' | 'organization' = 'global',
    scopeId: string = '_global'
  ): Promise<FeatureFlag> {
    return this.setFlag({
      flagKey,
      flagName: flagKey.replace(/_/g, ' ').toUpperCase(),
      enabled: false,
      scope,
      scopeId,
    });
  }

  /**
   * Get all feature flags
   * @returns Array of all feature flags
   */
  async getAllFlags(): Promise<FeatureFlag[]> {
    try {
      return await db.query.featureFlags.findMany({
        orderBy: (flags, { asc }) => [asc(flags.scope), asc(flags.flagKey)],
      });
    } catch (error) {
      console.error('[FeatureFlagsService] Error getting all flags:', error);
      return [];
    }
  }

  /**
   * Get flags by scope
   * @param scope - The scope to filter by
   * @returns Array of feature flags for the scope
   */
  async getFlagsByScope(scope: 'global' | 'studio' | 'user' | 'organization'): Promise<FeatureFlag[]> {
    try {
      return await db.query.featureFlags.findMany({
        where: eq(featureFlags.scope, scope),
        orderBy: (flags, { asc }) => [asc(flags.flagKey)],
      });
    } catch (error) {
      console.error(`[FeatureFlagsService] Error getting flags for scope ${scope}:`, error);
      return [];
    }
  }

  /**
   * Initialize default WAI v1.0 feature flags (all disabled by default)
   * Safe to call multiple times - won't overwrite existing flags
   */
  async initializeDefaultFlags(): Promise<void> {
    const defaultFlags: InsertFeatureFlag[] = [
      // Global master switch
      {
        flagKey: 'wai_v1_enabled',
        flagName: 'WAI SDK v1.0 Global Enable',
        description: 'Master switch for WAI SDK v1.0 - disables all v1.0 features when off',
        enabled: false,
        scope: 'global',
        scopeId: '_global',
      },

      // Core features
      {
        flagKey: 'wai_v1_mem0',
        flagName: 'WAI SDK v1.0 mem0 Memory',
        description: 'Enable mem0 memory management with 90% token reduction',
        enabled: false,
        scope: 'global',
        scopeId: '_global',
      },
      {
        flagKey: 'wai_v1_mcp',
        flagName: 'WAI SDK v1.0 MCP Server',
        description: 'Enable Model Context Protocol server for tool/resource/prompt management',
        enabled: false,
        scope: 'global',
        scopeId: '_global',
      },
      {
        flagKey: 'wai_v1_tools',
        flagName: 'WAI SDK v1.0 Tool Ecosystem',
        description: 'Enable 93 production-ready tools across 17 categories',
        enabled: false,
        scope: 'global',
        scopeId: '_global',
      },
      {
        flagKey: 'wai_v1_multimodal',
        flagName: 'WAI SDK v1.0 Multimodal',
        description: 'Enable multimodal capabilities (voice, video, music, image)',
        enabled: false,
        scope: 'global',
        scopeId: '_global',
      },

      // Phase 1 Pilot Studios
      {
        flagKey: 'wai_v1_content_studio',
        flagName: 'WAI v1.0 - Content Studio',
        description: 'Enable WAI v1.0 for Content Studio',
        enabled: false,
        scope: 'studio',
        scopeId: 'content_studio',
      },
      {
        flagKey: 'wai_v1_ideation_lab',
        flagName: 'WAI v1.0 - Ideation Lab',
        description: 'Enable WAI v1.0 for Ideation Lab Studio',
        enabled: false,
        scope: 'studio',
        scopeId: 'ideation_lab',
      },

      // Phase 2 Wave 1 Studios
      {
        flagKey: 'wai_v1_market_intelligence',
        flagName: 'WAI v1.0 - Market Intelligence',
        description: 'Enable WAI v1.0 for Market Intelligence Studio',
        enabled: false,
        scope: 'studio',
        scopeId: 'market_intelligence',
      },
      {
        flagKey: 'wai_v1_product_blueprint',
        flagName: 'WAI v1.0 - Product Blueprint',
        description: 'Enable WAI v1.0 for Product Blueprint Studio',
        enabled: false,
        scope: 'studio',
        scopeId: 'product_blueprint',
      },
      {
        flagKey: 'wai_v1_growth_engine',
        flagName: 'WAI v1.0 - Growth Engine',
        description: 'Enable WAI v1.0 for Growth Engine Studio',
        enabled: false,
        scope: 'studio',
        scopeId: 'growth_engine',
      },
      {
        flagKey: 'wai_v1_experience_design',
        flagName: 'WAI v1.0 - Experience Design',
        description: 'Enable WAI v1.0 for Experience Design Studio',
        enabled: false,
        scope: 'studio',
        scopeId: 'experience_design',
      },

      // Phase 2 Wave 2 Studios
      {
        flagKey: 'wai_v1_engineering_forge',
        flagName: 'WAI v1.0 - Engineering Forge',
        description: 'Enable WAI v1.0 for Engineering Forge Studio',
        enabled: false,
        scope: 'studio',
        scopeId: 'engineering_forge',
      },
      {
        flagKey: 'wai_v1_quality_assurance',
        flagName: 'WAI v1.0 - Quality Assurance',
        description: 'Enable WAI v1.0 for QA Studio',
        enabled: false,
        scope: 'studio',
        scopeId: 'quality_assurance',
      },
      {
        flagKey: 'wai_v1_operations_cockpit',
        flagName: 'WAI v1.0 - Operations Cockpit',
        description: 'Enable WAI v1.0 for Operations Studio',
        enabled: false,
        scope: 'studio',
        scopeId: 'operations_cockpit',
      },
      {
        flagKey: 'wai_v1_launch_control',
        flagName: 'WAI v1.0 - Launch Control',
        description: 'Enable WAI v1.0 for Launch Control Studio',
        enabled: false,
        scope: 'studio',
        scopeId: 'launch_control',
      },
      {
        flagKey: 'wai_v1_deployment_studio',
        flagName: 'WAI v1.0 - Deployment Studio',
        description: 'Enable WAI v1.0 for Deployment Studio',
        enabled: false,
        scope: 'studio',
        scopeId: 'deployment_studio',
      },
      {
        flagKey: 'wai_v1_data_ml_studio',
        flagName: 'WAI v1.0 - Data & ML Studio',
        description: 'Enable WAI v1.0 for Data & ML Studio',
        enabled: false,
        scope: 'studio',
        scopeId: 'data_ml_studio',
      },
      {
        flagKey: 'wai_v1_compliance_shield',
        flagName: 'WAI v1.0 - Compliance Shield',
        description: 'Enable WAI v1.0 for Compliance Shield',
        enabled: false,
        scope: 'studio',
        scopeId: 'compliance_shield',
      },
    ];

    for (const flag of defaultFlags) {
      try {
        // Only create if doesn't exist
        const existing = await db.query.featureFlags.findFirst({
          where: and(
            eq(featureFlags.flagKey, flag.flagKey),
            eq(featureFlags.scope, flag.scope),
            flag.scopeId ? eq(featureFlags.scopeId, flag.scopeId) : undefined
          ),
        });

        if (!existing) {
          await db.insert(featureFlags).values(flag);
          console.log(`[FeatureFlagsService] Created flag: ${flag.flagKey}`);
        }
      } catch (error) {
        console.error(`[FeatureFlagsService] Error creating flag ${flag.flagKey}:`, error);
      }
    }

    console.log('[FeatureFlagsService] Default flags initialized');
  }
}

// Export singleton instance
export const featureFlagsService = new FeatureFlagsService();
