/**
 * Configuration Guardrails - WAI SDK v3.1
 * 
 * Prevents configuration drift and ensures platform stability by:
 * - Validating agent registry integrity
 * - Enforcing model version requirements
 * - Detecting unauthorized configuration changes
 * - Providing rollback capabilities
 * 
 * @version 3.1.0
 * @date January 25, 2026
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { CONFIG_PATHS, REQUIRED_AGENT_FIELDS, LATEST_MODELS } from './central-configuration';

// ================================================================================================
// GUARDRAIL RULES
// ================================================================================================

export interface GuardrailViolation {
  rule: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  path?: string;
  suggestion?: string;
}

export interface GuardrailResult {
  passed: boolean;
  violations: GuardrailViolation[];
  timestamp: Date;
}

// ================================================================================================
// CONFIGURATION GUARDRAILS CLASS
// ================================================================================================

export class ConfigurationGuardrails {
  private static instance: ConfigurationGuardrails;
  private knownHashes: Map<string, string> = new Map();

  private constructor() {
    console.log('🛡️ ConfigurationGuardrails initialized');
  }

  public static getInstance(): ConfigurationGuardrails {
    if (!ConfigurationGuardrails.instance) {
      ConfigurationGuardrails.instance = new ConfigurationGuardrails();
    }
    return ConfigurationGuardrails.instance;
  }

  /**
   * Run all guardrail checks
   */
  public async runAllChecks(): Promise<GuardrailResult> {
    console.log('🔍 Running configuration guardrail checks...');
    
    const violations: GuardrailViolation[] = [];

    // Check 1: Agent registry files exist
    violations.push(...this.checkRegistryFilesExist());

    // Check 2: Agent structure validation
    violations.push(...await this.checkAgentStructure());

    // Check 3: Model version currency
    violations.push(...this.checkModelVersions());

    // Check 4: Configuration integrity
    violations.push(...this.checkConfigurationIntegrity());

    const passed = !violations.some(v => v.severity === 'critical');

    console.log(`🛡️ Guardrail Check Complete: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   Critical: ${violations.filter(v => v.severity === 'critical').length}`);
    console.log(`   Warnings: ${violations.filter(v => v.severity === 'warning').length}`);
    console.log(`   Info: ${violations.filter(v => v.severity === 'info').length}`);

    return {
      passed,
      violations,
      timestamp: new Date()
    };
  }

  /**
   * Check that required registry files exist
   */
  private checkRegistryFilesExist(): GuardrailViolation[] {
    const violations: GuardrailViolation[] = [];

    const requiredFiles = [
      { path: CONFIG_PATHS.WAI_AGENTS_REGISTRY, name: 'WAI Agent Registry' },
      { path: CONFIG_PATHS.WAI_AGENTS_BACKUP, name: 'WAI Agent Registry Backup' }
    ];

    const optionalFiles = [
      { path: CONFIG_PATHS.LEGAL_AGENTS_REGISTRY, name: 'Legal Agent Registry' }
    ];

    for (const file of requiredFiles) {
      const fullPath = path.resolve(process.cwd(), file.path);
      if (!fs.existsSync(fullPath)) {
        violations.push({
          rule: 'REGISTRY_FILE_REQUIRED',
          severity: 'critical',
          message: `Required registry file not found: ${file.name}`,
          path: file.path,
          suggestion: `Ensure ${file.path} exists and contains valid agent definitions`
        });
      }
    }

    for (const file of optionalFiles) {
      const fullPath = path.resolve(process.cwd(), file.path);
      if (!fs.existsSync(fullPath)) {
        violations.push({
          rule: 'REGISTRY_FILE_OPTIONAL',
          severity: 'warning',
          message: `Optional registry file not found: ${file.name}`,
          path: file.path,
          suggestion: `Create ${file.path} for full functionality`
        });
      }
    }

    return violations;
  }

  /**
   * Check agent structure compliance
   */
  private async checkAgentStructure(): Promise<GuardrailViolation[]> {
    const violations: GuardrailViolation[] = [];

    try {
      const registryPath = path.resolve(process.cwd(), CONFIG_PATHS.WAI_AGENTS_REGISTRY);
      
      if (!fs.existsSync(registryPath)) {
        return violations; // Already flagged by file check
      }

      const content = fs.readFileSync(registryPath, 'utf-8');
      const data = JSON.parse(content);

      if (!data.agents || !Array.isArray(data.agents)) {
        violations.push({
          rule: 'AGENT_ARRAY_REQUIRED',
          severity: 'critical',
          message: 'Agent registry missing agents array',
          path: CONFIG_PATHS.WAI_AGENTS_REGISTRY
        });
        return violations;
      }

      let missingFields = 0;
      const fieldCounts: Map<string, number> = new Map();

      for (const agent of data.agents) {
        for (const field of REQUIRED_AGENT_FIELDS) {
          if (agent[field] === undefined) {
            missingFields++;
            fieldCounts.set(field, (fieldCounts.get(field) || 0) + 1);
          }
        }
      }

      if (missingFields > 0) {
        const topMissing = Array.from(fieldCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([field, count]) => `${field}(${count})`)
          .join(', ');

        violations.push({
          rule: 'AGENT_22_POINT_STRUCTURE',
          severity: 'warning',
          message: `${missingFields} missing fields across agents. Top missing: ${topMissing}`,
          path: CONFIG_PATHS.WAI_AGENTS_REGISTRY,
          suggestion: 'Run agent structure migration to add missing fields'
        });
      }

    } catch (error) {
      violations.push({
        rule: 'AGENT_PARSE_ERROR',
        severity: 'critical',
        message: `Failed to parse agent registry: ${error}`,
        path: CONFIG_PATHS.WAI_AGENTS_REGISTRY
      });
    }

    return violations;
  }

  /**
   * Check model versions are current
   */
  private checkModelVersions(): GuardrailViolation[] {
    const violations: GuardrailViolation[] = [];

    try {
      const registryPath = path.resolve(process.cwd(), CONFIG_PATHS.WAI_AGENTS_REGISTRY);
      
      if (!fs.existsSync(registryPath)) {
        return violations;
      }

      const content = fs.readFileSync(registryPath, 'utf-8');
      const data = JSON.parse(content);

      // Check a sample of agents for model currency
      const sampleAgents = data.agents.slice(0, 10);
      let outdatedModels = 0;

      for (const agent of sampleAgents) {
        const preferredModels = agent.preferredModels || [];
        
        // Check if agent uses latest models
        const hasLatestOpenAI = preferredModels.some((m: string) => 
          m.includes('gpt-5') || m.includes('o3')
        );
        const hasLatestClaude = preferredModels.some((m: string) => 
          m.includes('claude-opus-4') || m.includes('claude-sonnet-4')
        );
        const hasLatestGemini = preferredModels.some((m: string) => 
          m.includes('gemini-3') || m.includes('gemini-2.5')
        );

        if (!hasLatestOpenAI && !hasLatestClaude && !hasLatestGemini) {
          outdatedModels++;
        }
      }

      if (outdatedModels > 3) {
        violations.push({
          rule: 'MODEL_VERSION_CURRENCY',
          severity: 'warning',
          message: `${outdatedModels}/10 sampled agents may have outdated model preferences`,
          suggestion: 'Update agent preferredModels to include latest models (GPT-5.x, Claude 4.x, Gemini 3.x)'
        });
      }

    } catch {
      // Silently skip model checks on parse error
    }

    return violations;
  }

  /**
   * Check configuration integrity
   */
  private checkConfigurationIntegrity(): GuardrailViolation[] {
    const violations: GuardrailViolation[] = [];

    const configFiles = [
      CONFIG_PATHS.WAI_AGENTS_REGISTRY,
      CONFIG_PATHS.WAI_AGENTS_BACKUP
    ];

    for (const configPath of configFiles) {
      const fullPath = path.resolve(process.cwd(), configPath);
      
      if (!fs.existsSync(fullPath)) continue;

      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const currentHash = crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);

        const storedHash = this.knownHashes.get(configPath);
        
        if (storedHash && storedHash !== currentHash) {
          violations.push({
            rule: 'CONFIG_INTEGRITY_CHANGE',
            severity: 'info',
            message: `Configuration changed: ${configPath}`,
            path: configPath,
            suggestion: 'Review changes to ensure intentional modification'
          });
        }

        // Update stored hash
        this.knownHashes.set(configPath, currentHash);

      } catch {
        // Skip integrity check on read error
      }
    }

    return violations;
  }

  /**
   * Create backup of configuration
   */
  public async createBackup(): Promise<{ success: boolean; backupPath?: string; error?: string }> {
    try {
      const sourcePath = path.resolve(process.cwd(), CONFIG_PATHS.WAI_AGENTS_REGISTRY);
      const backupPath = path.resolve(process.cwd(), CONFIG_PATHS.WAI_AGENTS_BACKUP);

      if (!fs.existsSync(sourcePath)) {
        return { success: false, error: 'Source registry not found' };
      }

      fs.copyFileSync(sourcePath, backupPath);
      console.log(`✅ Configuration backup created: ${backupPath}`);

      return { success: true, backupPath };
    } catch (error) {
      return { success: false, error: `Backup failed: ${error}` };
    }
  }

  /**
   * Restore from backup
   */
  public async restoreFromBackup(): Promise<{ success: boolean; error?: string }> {
    try {
      const backupPath = path.resolve(process.cwd(), CONFIG_PATHS.WAI_AGENTS_BACKUP);
      const targetPath = path.resolve(process.cwd(), CONFIG_PATHS.WAI_AGENTS_REGISTRY);

      if (!fs.existsSync(backupPath)) {
        return { success: false, error: 'Backup not found' };
      }

      fs.copyFileSync(backupPath, targetPath);
      console.log(`✅ Configuration restored from backup`);

      return { success: true };
    } catch (error) {
      return { success: false, error: `Restore failed: ${error}` };
    }
  }
}

// Export singleton
export const configGuardrails = ConfigurationGuardrails.getInstance();
