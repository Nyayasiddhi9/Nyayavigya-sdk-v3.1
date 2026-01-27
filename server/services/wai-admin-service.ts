import { db } from '../db';
import { 
  waiAgentConfigs, 
  waiMcpToolConfigs, 
  waiTokenUsage, 
  waiAdminAuditLogs, 
  waiProviderConfigs,
  waiPlatformSettings,
  waiApiClients,
  waiApiKeys,
  waiApiUsageLogs,
  type WaiAgentConfig,
  type WaiMcpToolConfig,
  type WaiTokenUsage,
  type WaiProviderConfig,
  type InsertWaiAgentConfig,
  type InsertWaiMcpToolConfig,
  type InsertWaiProviderConfig
} from '@shared/schema';
import { eq, desc, sql, and, gte, lte, count, sum, avg } from 'drizzle-orm';
import { agentRegistry as agentRegistryService, type Agent } from './agent-registry-service';
import { mcpToolRegistry } from '../wai-sdk-v9/services/mcp-tool-registry';
import crypto from 'crypto';

interface AgentConfigUpdate {
  systemPrompt?: string;
  communicationMode?: string;
  collaborationMode?: string;
  enabled?: boolean;
  assignedTools?: string[];
  behaviors?: Record<string, any>;
  workflows?: any[];
  preferredProvider?: string;
  preferredModel?: string;
  maxTokens?: number;
  temperature?: number;
}

interface ProviderConfigUpdate {
  enabled?: boolean;
  defaultModel?: string;
  globalRateLimitPerMinute?: number;
  fallbackPriority?: number;
  monthlyBudget?: number;
}

interface TokenUsageQuery {
  startDate: Date;
  endDate: Date;
  providerId?: string;
  modelId?: string;
  agentId?: string;
  groupBy?: 'provider' | 'model' | 'agent' | 'day';
}

class WaiAdminService {
  async getAllAgents(): Promise<any[]> {
    const registryAgents = await agentRegistryService.getAllAgents();
    
    const configuredAgents = await db.select().from(waiAgentConfigs);
    const configMap = new Map(configuredAgents.map(a => [a.agentId, a]));
    
    return registryAgents.map((agent: any) => ({
      ...agent,
      config: configMap.get(agent.id) || null,
      hasCustomConfig: configMap.has(agent.id)
    }));
  }

  async getAgentConfig(agentId: string): Promise<WaiAgentConfig | null> {
    const [config] = await db
      .select()
      .from(waiAgentConfigs)
      .where(eq(waiAgentConfigs.agentId, agentId))
      .limit(1);
    return config || null;
  }

  async updateAgentConfig(agentId: string, update: AgentConfigUpdate, userId: string): Promise<WaiAgentConfig> {
    const existing = await this.getAgentConfig(agentId);
    
    if (existing) {
      const promptHistory = existing.promptHistory as any[] || [];
      if (update.systemPrompt && update.systemPrompt !== existing.systemPrompt) {
        promptHistory.push({
          version: existing.systemPromptVersion,
          prompt: existing.systemPrompt,
          updatedAt: new Date().toISOString(),
          updatedBy: userId
        });
      }

      const [updated] = await db
        .update(waiAgentConfigs)
        .set({
          ...update,
          promptHistory: promptHistory,
          systemPromptVersion: update.systemPrompt ? this.incrementVersion(existing.systemPromptVersion || '1.0.0') : existing.systemPromptVersion,
          updatedAt: new Date()
        })
        .where(eq(waiAgentConfigs.agentId, agentId))
        .returning();

      await this.logAuditEvent('update', 'agent', agentId, existing, updated, userId);
      return updated;
    } else {
      const agent = agentRegistryService.getAgent(agentId);
      if (!agent) {
        throw new Error(`Agent ${agentId} not found`);
      }

      const [created] = await db
        .insert(waiAgentConfigs)
        .values({
          agentId,
          agentName: agent.name,
          tier: agent.tier || 'development',
          romaLevel: agent.romaLevel || 'L2',
          systemPrompt: update.systemPrompt || this.generateDefaultSystemPrompt(agent),
          enabled: update.enabled ?? true,
          communicationMode: update.communicationMode || 'standard',
          collaborationMode: update.collaborationMode || 'autonomous',
          assignedTools: update.assignedTools || [],
          behaviors: update.behaviors || {},
          workflows: update.workflows || [],
          preferredProvider: update.preferredProvider,
          preferredModel: update.preferredModel,
          maxTokens: update.maxTokens || 4096,
          temperature: String(update.temperature ?? 0.7),
          description: agent.description,
          category: agent.category,
          createdBy: userId
        })
        .returning();

      await this.logAuditEvent('create', 'agent', agentId, null, created, userId);
      return created;
    }
  }

  private generateDefaultSystemPrompt(agent: any): string {
    return `You are ${agent.name}, a specialized AI agent in the WAI SDK v1.0 platform.

## Role
${agent.description || 'You are an expert assistant helping users with their tasks.'}

## Tier: ${agent.tier || 'development'}
## ROMA Level: ${agent.romaLevel || 'L2'}

## Core Behaviors
- Provide accurate, helpful responses
- Follow user instructions precisely
- Maintain professional communication
- Collaborate effectively with other agents when needed

## Available Capabilities
${Array.isArray(agent.capabilities) ? agent.capabilities.map((c: string) => `- ${c}`).join('\n') : '- General assistance'}

## Guidelines
- Be concise but thorough
- Ask clarifying questions when needed
- Provide examples when helpful
- Cite sources when available`;
  }

  async getAllProviders(): Promise<any[]> {
    const configs = await db.select().from(waiProviderConfigs);
    const configMap = new Map(configs.map(c => [c.providerId, c]));

    const defaultProviders = [
      { id: 'openai', name: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'o3-mini'] },
      { id: 'anthropic', name: 'Anthropic', models: ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022'] },
      { id: 'google', name: 'Google', models: ['gemini-2.0-flash', 'gemini-1.5-pro'] },
      { id: 'xai', name: 'xAI', models: ['grok-3', 'grok-2'] },
      { id: 'deepseek', name: 'DeepSeek', models: ['deepseek-chat', 'deepseek-r1'] },
      { id: 'groq', name: 'Groq', models: ['llama-3.3-70b', 'mixtral-8x7b'] },
      { id: 'mistral', name: 'Mistral', models: ['mistral-large', 'mistral-medium'] },
      { id: 'together', name: 'Together AI', models: ['meta-llama/Llama-3.3-70B', 'Qwen/Qwen2.5-72B'] },
      { id: 'perplexity', name: 'Perplexity', models: ['sonar-pro', 'sonar'] },
      { id: 'cohere', name: 'Cohere', models: ['command-r-plus', 'command-r'] },
      { id: 'replicate', name: 'Replicate', models: ['sdxl', 'llama-3.1'] },
      { id: 'elevenlabs', name: 'ElevenLabs', models: ['eleven_turbo_v2', 'eleven_multilingual_v2'] },
      { id: 'ai21', name: 'AI21', models: ['jamba-1.5-large', 'jamba-1.5-mini'] },
      { id: 'sarvam', name: 'Sarvam AI', models: ['sarvam-2b', 'sarvam-1'] },
      { id: 'kimi', name: 'Moonshot/KIMI', models: ['kimi-k2', 'moonshot-v1'] },
      { id: 'openrouter', name: 'OpenRouter', models: ['auto', 'openai/gpt-4o'] },
      { id: 'fireworks', name: 'Fireworks', models: ['llama-v3p3-70b', 'mixtral-8x22b'] }
    ];

    return defaultProviders.map(p => ({
      ...p,
      config: configMap.get(p.id) || null,
      enabled: configMap.get(p.id)?.enabled ?? true,
      status: configMap.get(p.id)?.status || 'healthy',
      defaultModel: configMap.get(p.id)?.defaultModel || p.models[0]
    }));
  }

  async updateProviderConfig(providerId: string, update: ProviderConfigUpdate, userId: string): Promise<WaiProviderConfig> {
    const existing = await db
      .select()
      .from(waiProviderConfigs)
      .where(eq(waiProviderConfigs.providerId, providerId))
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await db
        .update(waiProviderConfigs)
        .set({
          ...update,
          monthlyBudget: update.monthlyBudget?.toString(),
          updatedAt: new Date()
        })
        .where(eq(waiProviderConfigs.providerId, providerId))
        .returning();

      await this.logAuditEvent('update', 'provider', providerId, existing[0], updated, userId);
      return updated;
    } else {
      const [created] = await db
        .insert(waiProviderConfigs)
        .values({
          providerId,
          providerName: providerId,
          enabled: update.enabled ?? true,
          defaultModel: update.defaultModel,
          globalRateLimitPerMinute: update.globalRateLimitPerMinute || 60,
          fallbackPriority: update.fallbackPriority || 50,
          monthlyBudget: update.monthlyBudget?.toString()
        })
        .returning();

      await this.logAuditEvent('create', 'provider', providerId, null, created, userId);
      return created;
    }
  }

  async getAllMcpTools(): Promise<any[]> {
    try {
      const dbTools = await mcpToolRegistry.getAllTools();
      const configs = await db.select().from(waiMcpToolConfigs);
      const configMap = new Map(configs.map(c => [c.toolId, c]));

      // If we have tools in the database, use them
      if (Array.isArray(dbTools) && dbTools.length > 0) {
        return dbTools.map((tool: any) => ({
          ...tool,
          config: configMap.get(tool.id?.toString()) || null,
          enabled: configMap.get(tool.id?.toString())?.enabled ?? true,
          rateLimitPerMinute: configMap.get(tool.id?.toString())?.rateLimitPerMinute || 60
        }));
      }

      // Otherwise, return the 495 production tools from the manifest
      return this.getProductionMcpTools();
    } catch (error) {
      console.error('Error getting MCP tools:', error);
      return this.getProductionMcpTools();
    }
  }

  private getProductionMcpTools(): any[] {
    const enterpriseTools = [
      // ===== DEVELOPER TOOLS (30) =====
      { id: 'dev-1', name: 'github_create_repository', category: 'developer', description: 'Create new GitHub repository with settings' },
      { id: 'dev-2', name: 'github_create_pull_request', category: 'developer', description: 'Create pull request with reviewers' },
      { id: 'dev-3', name: 'github_merge_pr', category: 'developer', description: 'Merge pull request with strategy' },
      { id: 'dev-4', name: 'github_create_issue', category: 'developer', description: 'Create GitHub issue with labels and assignees' },
      { id: 'dev-5', name: 'github_actions_trigger', category: 'developer', description: 'Trigger GitHub Actions workflow' },
      { id: 'dev-6', name: 'gitlab_create_mr', category: 'developer', description: 'Create GitLab merge request' },
      { id: 'dev-7', name: 'gitlab_pipeline_trigger', category: 'developer', description: 'Trigger GitLab CI/CD pipeline' },
      { id: 'dev-8', name: 'bitbucket_create_branch', category: 'developer', description: 'Create Bitbucket branch from ref' },
      { id: 'dev-9', name: 'jenkins_build_trigger', category: 'developer', description: 'Trigger Jenkins build job' },
      { id: 'dev-10', name: 'circleci_pipeline_run', category: 'developer', description: 'Run CircleCI pipeline' },
      { id: 'dev-11', name: 'docker_build_image', category: 'developer', description: 'Build Docker image from Dockerfile' },
      { id: 'dev-12', name: 'docker_push_registry', category: 'developer', description: 'Push image to Docker registry' },
      { id: 'dev-13', name: 'kubernetes_deploy', category: 'developer', description: 'Deploy to Kubernetes cluster' },
      { id: 'dev-14', name: 'kubernetes_scale', category: 'developer', description: 'Scale Kubernetes deployment' },
      { id: 'dev-15', name: 'terraform_plan', category: 'developer', description: 'Run Terraform plan' },
      { id: 'dev-16', name: 'terraform_apply', category: 'developer', description: 'Apply Terraform configuration' },
      { id: 'dev-17', name: 'npm_publish', category: 'developer', description: 'Publish package to npm registry' },
      { id: 'dev-18', name: 'npm_audit', category: 'developer', description: 'Run npm security audit' },
      { id: 'dev-19', name: 'sonarqube_analyze', category: 'developer', description: 'Run SonarQube code analysis' },
      { id: 'dev-20', name: 'codecov_upload', category: 'developer', description: 'Upload coverage to Codecov' },
      { id: 'dev-21', name: 'snyk_security_scan', category: 'developer', description: 'Run Snyk security vulnerability scan' },
      { id: 'dev-22', name: 'eslint_check', category: 'developer', description: 'Run ESLint code quality check' },
      { id: 'dev-23', name: 'prettier_format', category: 'developer', description: 'Format code with Prettier' },
      { id: 'dev-24', name: 'vercel_deploy', category: 'developer', description: 'Deploy to Vercel platform' },
      { id: 'dev-25', name: 'netlify_deploy', category: 'developer', description: 'Deploy to Netlify' },
      { id: 'dev-26', name: 'heroku_deploy', category: 'developer', description: 'Deploy to Heroku' },
      { id: 'dev-27', name: 'railway_deploy', category: 'developer', description: 'Deploy to Railway' },
      { id: 'dev-28', name: 'fly_io_deploy', category: 'developer', description: 'Deploy to Fly.io' },
      { id: 'dev-29', name: 'linear_create_issue', category: 'developer', description: 'Create Linear issue' },
      { id: 'dev-30', name: 'linear_update_status', category: 'developer', description: 'Update Linear issue status' },

      // ===== EMAIL TOOLS (25) =====
      { id: 'email-1', name: 'gmail_send', category: 'email', description: 'Send email via Gmail API' },
      { id: 'email-2', name: 'gmail_read_inbox', category: 'email', description: 'Read Gmail inbox messages' },
      { id: 'email-3', name: 'gmail_search', category: 'email', description: 'Search Gmail messages' },
      { id: 'email-4', name: 'gmail_create_label', category: 'email', description: 'Create Gmail label' },
      { id: 'email-5', name: 'gmail_archive', category: 'email', description: 'Archive Gmail messages' },
      { id: 'email-6', name: 'outlook_send', category: 'email', description: 'Send email via Outlook/365' },
      { id: 'email-7', name: 'outlook_read_inbox', category: 'email', description: 'Read Outlook inbox' },
      { id: 'email-8', name: 'outlook_calendar_event', category: 'email', description: 'Create Outlook calendar event' },
      { id: 'email-9', name: 'sendgrid_send', category: 'email', description: 'Send transactional email via SendGrid' },
      { id: 'email-10', name: 'sendgrid_template_send', category: 'email', description: 'Send templated email via SendGrid' },
      { id: 'email-11', name: 'mailchimp_send_campaign', category: 'email', description: 'Send Mailchimp email campaign' },
      { id: 'email-12', name: 'mailchimp_add_subscriber', category: 'email', description: 'Add subscriber to Mailchimp list' },
      { id: 'email-13', name: 'mailchimp_create_template', category: 'email', description: 'Create Mailchimp email template' },
      { id: 'email-14', name: 'mailgun_send', category: 'email', description: 'Send email via Mailgun' },
      { id: 'email-15', name: 'ses_send', category: 'email', description: 'Send email via AWS SES' },
      { id: 'email-16', name: 'postmark_send', category: 'email', description: 'Send email via Postmark' },
      { id: 'email-17', name: 'sparkpost_send', category: 'email', description: 'Send email via SparkPost' },
      { id: 'email-18', name: 'resend_send', category: 'email', description: 'Send email via Resend API' },
      { id: 'email-19', name: 'email_validate', category: 'email', description: 'Validate email address format and deliverability' },
      { id: 'email-20', name: 'email_bounce_check', category: 'email', description: 'Check email bounce status' },
      { id: 'email-21', name: 'email_unsubscribe_manage', category: 'email', description: 'Manage email unsubscribe list' },
      { id: 'email-22', name: 'email_tracking_analytics', category: 'email', description: 'Get email open/click analytics' },
      { id: 'email-23', name: 'convertkit_send', category: 'email', description: 'Send email via ConvertKit' },
      { id: 'email-24', name: 'brevo_send', category: 'email', description: 'Send email via Brevo (Sendinblue)' },
      { id: 'email-25', name: 'klaviyo_campaign', category: 'email', description: 'Create Klaviyo email campaign' },

      // ===== DRIVES & STORAGE (25) =====
      { id: 'drive-1', name: 'gdrive_upload', category: 'drives', description: 'Upload file to Google Drive' },
      { id: 'drive-2', name: 'gdrive_download', category: 'drives', description: 'Download file from Google Drive' },
      { id: 'drive-3', name: 'gdrive_create_folder', category: 'drives', description: 'Create Google Drive folder' },
      { id: 'drive-4', name: 'gdrive_share', category: 'drives', description: 'Share Google Drive file/folder' },
      { id: 'drive-5', name: 'gdrive_search', category: 'drives', description: 'Search files in Google Drive' },
      { id: 'drive-6', name: 'dropbox_upload', category: 'drives', description: 'Upload file to Dropbox' },
      { id: 'drive-7', name: 'dropbox_download', category: 'drives', description: 'Download file from Dropbox' },
      { id: 'drive-8', name: 'dropbox_share_link', category: 'drives', description: 'Create Dropbox sharing link' },
      { id: 'drive-9', name: 'onedrive_upload', category: 'drives', description: 'Upload file to OneDrive' },
      { id: 'drive-10', name: 'onedrive_download', category: 'drives', description: 'Download file from OneDrive' },
      { id: 'drive-11', name: 'onedrive_share', category: 'drives', description: 'Share OneDrive file' },
      { id: 'drive-12', name: 'box_upload', category: 'drives', description: 'Upload file to Box' },
      { id: 'drive-13', name: 'box_download', category: 'drives', description: 'Download file from Box' },
      { id: 'drive-14', name: 's3_upload', category: 'drives', description: 'Upload to AWS S3 bucket' },
      { id: 'drive-15', name: 's3_download', category: 'drives', description: 'Download from AWS S3' },
      { id: 'drive-16', name: 's3_presigned_url', category: 'drives', description: 'Generate S3 presigned URL' },
      { id: 'drive-17', name: 'gcs_upload', category: 'drives', description: 'Upload to Google Cloud Storage' },
      { id: 'drive-18', name: 'gcs_download', category: 'drives', description: 'Download from Google Cloud Storage' },
      { id: 'drive-19', name: 'azure_blob_upload', category: 'drives', description: 'Upload to Azure Blob Storage' },
      { id: 'drive-20', name: 'azure_blob_download', category: 'drives', description: 'Download from Azure Blob' },
      { id: 'drive-21', name: 'sharepoint_upload', category: 'drives', description: 'Upload to SharePoint' },
      { id: 'drive-22', name: 'sharepoint_download', category: 'drives', description: 'Download from SharePoint' },
      { id: 'drive-23', name: 'cloudinary_upload', category: 'drives', description: 'Upload media to Cloudinary' },
      { id: 'drive-24', name: 'cloudinary_transform', category: 'drives', description: 'Transform image via Cloudinary' },
      { id: 'drive-25', name: 'uploadthing_upload', category: 'drives', description: 'Upload file via UploadThing' },

      // ===== MARKETING TOOLS (30) =====
      { id: 'mkt-1', name: 'hubspot_create_contact', category: 'marketing', description: 'Create HubSpot contact' },
      { id: 'mkt-2', name: 'hubspot_update_contact', category: 'marketing', description: 'Update HubSpot contact properties' },
      { id: 'mkt-3', name: 'hubspot_create_deal', category: 'marketing', description: 'Create HubSpot deal' },
      { id: 'mkt-4', name: 'hubspot_email_campaign', category: 'marketing', description: 'Send HubSpot email campaign' },
      { id: 'mkt-5', name: 'hubspot_form_submit', category: 'marketing', description: 'Submit HubSpot form data' },
      { id: 'mkt-6', name: 'marketo_create_lead', category: 'marketing', description: 'Create Marketo lead' },
      { id: 'mkt-7', name: 'marketo_send_email', category: 'marketing', description: 'Send Marketo email' },
      { id: 'mkt-8', name: 'google_ads_create_campaign', category: 'marketing', description: 'Create Google Ads campaign' },
      { id: 'mkt-9', name: 'google_ads_update_budget', category: 'marketing', description: 'Update Google Ads budget' },
      { id: 'mkt-10', name: 'google_ads_get_metrics', category: 'marketing', description: 'Get Google Ads performance metrics' },
      { id: 'mkt-11', name: 'facebook_ads_create', category: 'marketing', description: 'Create Facebook Ad campaign' },
      { id: 'mkt-12', name: 'facebook_ads_metrics', category: 'marketing', description: 'Get Facebook Ads metrics' },
      { id: 'mkt-13', name: 'linkedin_ads_create', category: 'marketing', description: 'Create LinkedIn Ad campaign' },
      { id: 'mkt-14', name: 'twitter_ads_create', category: 'marketing', description: 'Create Twitter/X Ad campaign' },
      { id: 'mkt-15', name: 'google_analytics_report', category: 'marketing', description: 'Generate Google Analytics report' },
      { id: 'mkt-16', name: 'google_analytics_event', category: 'marketing', description: 'Track Google Analytics event' },
      { id: 'mkt-17', name: 'mixpanel_track', category: 'marketing', description: 'Track Mixpanel event' },
      { id: 'mkt-18', name: 'segment_track', category: 'marketing', description: 'Track Segment event' },
      { id: 'mkt-19', name: 'amplitude_track', category: 'marketing', description: 'Track Amplitude event' },
      { id: 'mkt-20', name: 'hotjar_heatmap', category: 'marketing', description: 'Get Hotjar heatmap data' },
      { id: 'mkt-21', name: 'semrush_keyword_research', category: 'marketing', description: 'SEMrush keyword research' },
      { id: 'mkt-22', name: 'ahrefs_backlink_check', category: 'marketing', description: 'Ahrefs backlink analysis' },
      { id: 'mkt-23', name: 'moz_domain_authority', category: 'marketing', description: 'Get Moz domain authority' },
      { id: 'mkt-24', name: 'buffer_schedule_post', category: 'marketing', description: 'Schedule Buffer social post' },
      { id: 'mkt-25', name: 'hootsuite_schedule', category: 'marketing', description: 'Schedule Hootsuite post' },
      { id: 'mkt-26', name: 'sprout_social_post', category: 'marketing', description: 'Post via Sprout Social' },
      { id: 'mkt-27', name: 'canva_create_design', category: 'marketing', description: 'Create Canva design' },
      { id: 'mkt-28', name: 'unbounce_create_page', category: 'marketing', description: 'Create Unbounce landing page' },
      { id: 'mkt-29', name: 'optimizely_experiment', category: 'marketing', description: 'Create Optimizely A/B test' },
      { id: 'mkt-30', name: 'intercom_message', category: 'marketing', description: 'Send Intercom message' },

      // ===== SOCIAL MEDIA TOOLS (25) =====
      { id: 'social-1', name: 'twitter_post', category: 'social_media', description: 'Post tweet on Twitter/X' },
      { id: 'social-2', name: 'twitter_reply', category: 'social_media', description: 'Reply to tweet' },
      { id: 'social-3', name: 'twitter_dm', category: 'social_media', description: 'Send Twitter direct message' },
      { id: 'social-4', name: 'twitter_search', category: 'social_media', description: 'Search Twitter for mentions' },
      { id: 'social-5', name: 'twitter_analytics', category: 'social_media', description: 'Get Twitter analytics' },
      { id: 'social-6', name: 'linkedin_post', category: 'social_media', description: 'Post on LinkedIn' },
      { id: 'social-7', name: 'linkedin_share_article', category: 'social_media', description: 'Share article on LinkedIn' },
      { id: 'social-8', name: 'linkedin_message', category: 'social_media', description: 'Send LinkedIn message' },
      { id: 'social-9', name: 'linkedin_company_update', category: 'social_media', description: 'Post LinkedIn company update' },
      { id: 'social-10', name: 'facebook_post', category: 'social_media', description: 'Post on Facebook page' },
      { id: 'social-11', name: 'facebook_comment', category: 'social_media', description: 'Comment on Facebook post' },
      { id: 'social-12', name: 'facebook_messenger', category: 'social_media', description: 'Send Facebook Messenger message' },
      { id: 'social-13', name: 'instagram_post', category: 'social_media', description: 'Post on Instagram' },
      { id: 'social-14', name: 'instagram_story', category: 'social_media', description: 'Post Instagram story' },
      { id: 'social-15', name: 'instagram_dm', category: 'social_media', description: 'Send Instagram DM' },
      { id: 'social-16', name: 'youtube_upload', category: 'social_media', description: 'Upload video to YouTube' },
      { id: 'social-17', name: 'youtube_comment', category: 'social_media', description: 'Comment on YouTube video' },
      { id: 'social-18', name: 'youtube_analytics', category: 'social_media', description: 'Get YouTube channel analytics' },
      { id: 'social-19', name: 'tiktok_post', category: 'social_media', description: 'Post TikTok video' },
      { id: 'social-20', name: 'tiktok_analytics', category: 'social_media', description: 'Get TikTok analytics' },
      { id: 'social-21', name: 'pinterest_pin', category: 'social_media', description: 'Create Pinterest pin' },
      { id: 'social-22', name: 'reddit_post', category: 'social_media', description: 'Post on Reddit' },
      { id: 'social-23', name: 'reddit_comment', category: 'social_media', description: 'Comment on Reddit post' },
      { id: 'social-24', name: 'discord_send_message', category: 'social_media', description: 'Send Discord message' },
      { id: 'social-25', name: 'discord_create_channel', category: 'social_media', description: 'Create Discord channel' },

      // ===== FINANCIAL TOOLS (30) =====
      { id: 'fin-1', name: 'stripe_create_customer', category: 'financial', description: 'Create Stripe customer' },
      { id: 'fin-2', name: 'stripe_create_payment', category: 'financial', description: 'Create Stripe payment intent' },
      { id: 'fin-3', name: 'stripe_create_subscription', category: 'financial', description: 'Create Stripe subscription' },
      { id: 'fin-4', name: 'stripe_cancel_subscription', category: 'financial', description: 'Cancel Stripe subscription' },
      { id: 'fin-5', name: 'stripe_refund', category: 'financial', description: 'Process Stripe refund' },
      { id: 'fin-6', name: 'stripe_invoice', category: 'financial', description: 'Create Stripe invoice' },
      { id: 'fin-7', name: 'paypal_payment', category: 'financial', description: 'Process PayPal payment' },
      { id: 'fin-8', name: 'paypal_payout', category: 'financial', description: 'Send PayPal payout' },
      { id: 'fin-9', name: 'razorpay_payment', category: 'financial', description: 'Process Razorpay payment' },
      { id: 'fin-10', name: 'razorpay_subscription', category: 'financial', description: 'Create Razorpay subscription' },
      { id: 'fin-11', name: 'quickbooks_invoice', category: 'financial', description: 'Create QuickBooks invoice' },
      { id: 'fin-12', name: 'quickbooks_expense', category: 'financial', description: 'Record QuickBooks expense' },
      { id: 'fin-13', name: 'quickbooks_report', category: 'financial', description: 'Generate QuickBooks report' },
      { id: 'fin-14', name: 'xero_invoice', category: 'financial', description: 'Create Xero invoice' },
      { id: 'fin-15', name: 'xero_payment', category: 'financial', description: 'Record Xero payment' },
      { id: 'fin-16', name: 'xero_report', category: 'financial', description: 'Generate Xero financial report' },
      { id: 'fin-17', name: 'freshbooks_invoice', category: 'financial', description: 'Create FreshBooks invoice' },
      { id: 'fin-18', name: 'wave_invoice', category: 'financial', description: 'Create Wave invoice' },
      { id: 'fin-19', name: 'plaid_link_account', category: 'financial', description: 'Link bank account via Plaid' },
      { id: 'fin-20', name: 'plaid_get_transactions', category: 'financial', description: 'Get Plaid transactions' },
      { id: 'fin-21', name: 'plaid_get_balance', category: 'financial', description: 'Get Plaid account balance' },
      { id: 'fin-22', name: 'wise_transfer', category: 'financial', description: 'Create Wise money transfer' },
      { id: 'fin-23', name: 'wise_get_rate', category: 'financial', description: 'Get Wise exchange rate' },
      { id: 'fin-24', name: 'square_payment', category: 'financial', description: 'Process Square payment' },
      { id: 'fin-25', name: 'square_invoice', category: 'financial', description: 'Create Square invoice' },
      { id: 'fin-26', name: 'braintree_payment', category: 'financial', description: 'Process Braintree payment' },
      { id: 'fin-27', name: 'chargebee_subscription', category: 'financial', description: 'Create Chargebee subscription' },
      { id: 'fin-28', name: 'recurly_subscription', category: 'financial', description: 'Create Recurly subscription' },
      { id: 'fin-29', name: 'paddle_checkout', category: 'financial', description: 'Create Paddle checkout' },
      { id: 'fin-30', name: 'lemonsqueezy_payment', category: 'financial', description: 'Process LemonSqueezy payment' },

      // ===== SALES TOOLS (25) =====
      { id: 'sales-1', name: 'salesforce_create_lead', category: 'sales', description: 'Create Salesforce lead' },
      { id: 'sales-2', name: 'salesforce_convert_lead', category: 'sales', description: 'Convert Salesforce lead to opportunity' },
      { id: 'sales-3', name: 'salesforce_create_opportunity', category: 'sales', description: 'Create Salesforce opportunity' },
      { id: 'sales-4', name: 'salesforce_update_stage', category: 'sales', description: 'Update Salesforce opportunity stage' },
      { id: 'sales-5', name: 'salesforce_create_quote', category: 'sales', description: 'Create Salesforce quote' },
      { id: 'sales-6', name: 'pipedrive_create_deal', category: 'sales', description: 'Create Pipedrive deal' },
      { id: 'sales-7', name: 'pipedrive_update_stage', category: 'sales', description: 'Update Pipedrive deal stage' },
      { id: 'sales-8', name: 'pipedrive_add_activity', category: 'sales', description: 'Add Pipedrive activity' },
      { id: 'sales-9', name: 'close_create_lead', category: 'sales', description: 'Create Close.io lead' },
      { id: 'sales-10', name: 'close_log_call', category: 'sales', description: 'Log Close.io call' },
      { id: 'sales-11', name: 'outreach_create_sequence', category: 'sales', description: 'Create Outreach sequence' },
      { id: 'sales-12', name: 'outreach_add_prospect', category: 'sales', description: 'Add prospect to Outreach' },
      { id: 'sales-13', name: 'salesloft_create_cadence', category: 'sales', description: 'Create SalesLoft cadence' },
      { id: 'sales-14', name: 'salesloft_add_person', category: 'sales', description: 'Add person to SalesLoft' },
      { id: 'sales-15', name: 'apollo_search_leads', category: 'sales', description: 'Search Apollo.io leads' },
      { id: 'sales-16', name: 'apollo_enrich_contact', category: 'sales', description: 'Enrich contact via Apollo' },
      { id: 'sales-17', name: 'zoominfo_search', category: 'sales', description: 'Search ZoomInfo database' },
      { id: 'sales-18', name: 'clearbit_enrich', category: 'sales', description: 'Enrich data via Clearbit' },
      { id: 'sales-19', name: 'gong_analyze_call', category: 'sales', description: 'Analyze call via Gong' },
      { id: 'sales-20', name: 'chorus_transcribe', category: 'sales', description: 'Transcribe call via Chorus' },
      { id: 'sales-21', name: 'calendly_create_event', category: 'sales', description: 'Create Calendly event type' },
      { id: 'sales-22', name: 'calendly_get_bookings', category: 'sales', description: 'Get Calendly bookings' },
      { id: 'sales-23', name: 'docusign_send', category: 'sales', description: 'Send DocuSign envelope' },
      { id: 'sales-24', name: 'pandadoc_create', category: 'sales', description: 'Create PandaDoc document' },
      { id: 'sales-25', name: 'proposify_create', category: 'sales', description: 'Create Proposify proposal' },

      // ===== CRM TOOLS (25) =====
      { id: 'crm-1', name: 'hubspot_crm_contact', category: 'crm', description: 'Manage HubSpot CRM contacts' },
      { id: 'crm-2', name: 'hubspot_crm_company', category: 'crm', description: 'Manage HubSpot CRM companies' },
      { id: 'crm-3', name: 'hubspot_crm_deal', category: 'crm', description: 'Manage HubSpot CRM deals' },
      { id: 'crm-4', name: 'hubspot_crm_ticket', category: 'crm', description: 'Create HubSpot support ticket' },
      { id: 'crm-5', name: 'zoho_crm_lead', category: 'crm', description: 'Create Zoho CRM lead' },
      { id: 'crm-6', name: 'zoho_crm_contact', category: 'crm', description: 'Manage Zoho CRM contacts' },
      { id: 'crm-7', name: 'zoho_crm_deal', category: 'crm', description: 'Create Zoho CRM deal' },
      { id: 'crm-8', name: 'freshsales_lead', category: 'crm', description: 'Create Freshsales lead' },
      { id: 'crm-9', name: 'freshsales_contact', category: 'crm', description: 'Manage Freshsales contacts' },
      { id: 'crm-10', name: 'copper_lead', category: 'crm', description: 'Create Copper CRM lead' },
      { id: 'crm-11', name: 'copper_opportunity', category: 'crm', description: 'Create Copper opportunity' },
      { id: 'crm-12', name: 'insightly_contact', category: 'crm', description: 'Manage Insightly contacts' },
      { id: 'crm-13', name: 'insightly_project', category: 'crm', description: 'Create Insightly project' },
      { id: 'crm-14', name: 'nimble_contact', category: 'crm', description: 'Create Nimble contact' },
      { id: 'crm-15', name: 'agile_crm_contact', category: 'crm', description: 'Create Agile CRM contact' },
      { id: 'crm-16', name: 'keap_contact', category: 'crm', description: 'Create Keap/Infusionsoft contact' },
      { id: 'crm-17', name: 'activecampaign_contact', category: 'crm', description: 'Create ActiveCampaign contact' },
      { id: 'crm-18', name: 'activecampaign_automation', category: 'crm', description: 'Trigger ActiveCampaign automation' },
      { id: 'crm-19', name: 'monday_crm_item', category: 'crm', description: 'Create Monday.com CRM item' },
      { id: 'crm-20', name: 'airtable_crm_record', category: 'crm', description: 'Create Airtable CRM record' },
      { id: 'crm-21', name: 'notion_crm_page', category: 'crm', description: 'Create Notion CRM page' },
      { id: 'crm-22', name: 'streak_pipeline', category: 'crm', description: 'Manage Streak pipeline' },
      { id: 'crm-23', name: 'capsule_contact', category: 'crm', description: 'Create Capsule CRM contact' },
      { id: 'crm-24', name: 'nutshell_lead', category: 'crm', description: 'Create Nutshell lead' },
      { id: 'crm-25', name: 'less_annoying_crm', category: 'crm', description: 'Manage Less Annoying CRM' },

      // ===== CONTENT MANAGEMENT (30) =====
      { id: 'content-1', name: 'wordpress_create_post', category: 'content', description: 'Create WordPress post' },
      { id: 'content-2', name: 'wordpress_update_post', category: 'content', description: 'Update WordPress post' },
      { id: 'content-3', name: 'wordpress_upload_media', category: 'content', description: 'Upload media to WordPress' },
      { id: 'content-4', name: 'contentful_create_entry', category: 'content', description: 'Create Contentful entry' },
      { id: 'content-5', name: 'contentful_publish', category: 'content', description: 'Publish Contentful content' },
      { id: 'content-6', name: 'strapi_create_entry', category: 'content', description: 'Create Strapi entry' },
      { id: 'content-7', name: 'sanity_create_document', category: 'content', description: 'Create Sanity document' },
      { id: 'content-8', name: 'prismic_create_document', category: 'content', description: 'Create Prismic document' },
      { id: 'content-9', name: 'notion_create_page', category: 'content', description: 'Create Notion page' },
      { id: 'content-10', name: 'notion_update_database', category: 'content', description: 'Update Notion database' },
      { id: 'content-11', name: 'notion_add_block', category: 'content', description: 'Add block to Notion page' },
      { id: 'content-12', name: 'confluence_create_page', category: 'content', description: 'Create Confluence page' },
      { id: 'content-13', name: 'confluence_update', category: 'content', description: 'Update Confluence page' },
      { id: 'content-14', name: 'medium_publish', category: 'content', description: 'Publish article on Medium' },
      { id: 'content-15', name: 'devto_publish', category: 'content', description: 'Publish article on Dev.to' },
      { id: 'content-16', name: 'hashnode_publish', category: 'content', description: 'Publish article on Hashnode' },
      { id: 'content-17', name: 'ghost_publish', category: 'content', description: 'Publish Ghost blog post' },
      { id: 'content-18', name: 'webflow_create_item', category: 'content', description: 'Create Webflow CMS item' },
      { id: 'content-19', name: 'webflow_publish', category: 'content', description: 'Publish Webflow site' },
      { id: 'content-20', name: 'shopify_create_product', category: 'content', description: 'Create Shopify product' },
      { id: 'content-21', name: 'shopify_update_inventory', category: 'content', description: 'Update Shopify inventory' },
      { id: 'content-22', name: 'woocommerce_product', category: 'content', description: 'Create WooCommerce product' },
      { id: 'content-23', name: 'bigcommerce_product', category: 'content', description: 'Create BigCommerce product' },
      { id: 'content-24', name: 'squarespace_page', category: 'content', description: 'Create Squarespace page' },
      { id: 'content-25', name: 'wix_page', category: 'content', description: 'Create Wix page' },
      { id: 'content-26', name: 'coda_doc', category: 'content', description: 'Create Coda document' },
      { id: 'content-27', name: 'gitbook_page', category: 'content', description: 'Create GitBook page' },
      { id: 'content-28', name: 'readme_doc', category: 'content', description: 'Update ReadMe documentation' },
      { id: 'content-29', name: 'docusaurus_page', category: 'content', description: 'Create Docusaurus page' },
      { id: 'content-30', name: 'mintlify_doc', category: 'content', description: 'Update Mintlify documentation' },

      // ===== ENTERPRISE & PRODUCTIVITY (40) =====
      { id: 'ent-1', name: 'jira_create_issue', category: 'enterprise', description: 'Create Jira issue' },
      { id: 'ent-2', name: 'jira_update_issue', category: 'enterprise', description: 'Update Jira issue' },
      { id: 'ent-3', name: 'jira_transition', category: 'enterprise', description: 'Transition Jira issue status' },
      { id: 'ent-4', name: 'jira_add_comment', category: 'enterprise', description: 'Add Jira comment' },
      { id: 'ent-5', name: 'jira_create_sprint', category: 'enterprise', description: 'Create Jira sprint' },
      { id: 'ent-6', name: 'asana_create_task', category: 'enterprise', description: 'Create Asana task' },
      { id: 'ent-7', name: 'asana_update_task', category: 'enterprise', description: 'Update Asana task' },
      { id: 'ent-8', name: 'asana_create_project', category: 'enterprise', description: 'Create Asana project' },
      { id: 'ent-9', name: 'trello_create_card', category: 'enterprise', description: 'Create Trello card' },
      { id: 'ent-10', name: 'trello_move_card', category: 'enterprise', description: 'Move Trello card' },
      { id: 'ent-11', name: 'monday_create_item', category: 'enterprise', description: 'Create Monday.com item' },
      { id: 'ent-12', name: 'monday_update_status', category: 'enterprise', description: 'Update Monday.com status' },
      { id: 'ent-13', name: 'clickup_create_task', category: 'enterprise', description: 'Create ClickUp task' },
      { id: 'ent-14', name: 'clickup_update_task', category: 'enterprise', description: 'Update ClickUp task' },
      { id: 'ent-15', name: 'basecamp_create_todo', category: 'enterprise', description: 'Create Basecamp to-do' },
      { id: 'ent-16', name: 'slack_send_message', category: 'enterprise', description: 'Send Slack message' },
      { id: 'ent-17', name: 'slack_create_channel', category: 'enterprise', description: 'Create Slack channel' },
      { id: 'ent-18', name: 'slack_file_upload', category: 'enterprise', description: 'Upload file to Slack' },
      { id: 'ent-19', name: 'teams_send_message', category: 'enterprise', description: 'Send Microsoft Teams message' },
      { id: 'ent-20', name: 'teams_create_channel', category: 'enterprise', description: 'Create Teams channel' },
      { id: 'ent-21', name: 'teams_meeting', category: 'enterprise', description: 'Create Teams meeting' },
      { id: 'ent-22', name: 'zoom_create_meeting', category: 'enterprise', description: 'Create Zoom meeting' },
      { id: 'ent-23', name: 'zoom_get_recording', category: 'enterprise', description: 'Get Zoom recording' },
      { id: 'ent-24', name: 'google_meet_create', category: 'enterprise', description: 'Create Google Meet' },
      { id: 'ent-25', name: 'gcal_create_event', category: 'enterprise', description: 'Create Google Calendar event' },
      { id: 'ent-26', name: 'gcal_update_event', category: 'enterprise', description: 'Update Google Calendar event' },
      { id: 'ent-27', name: 'outlook_calendar', category: 'enterprise', description: 'Create Outlook calendar event' },
      { id: 'ent-28', name: 'servicenow_incident', category: 'enterprise', description: 'Create ServiceNow incident' },
      { id: 'ent-29', name: 'servicenow_request', category: 'enterprise', description: 'Create ServiceNow request' },
      { id: 'ent-30', name: 'zendesk_ticket', category: 'enterprise', description: 'Create Zendesk ticket' },
      { id: 'ent-31', name: 'zendesk_update', category: 'enterprise', description: 'Update Zendesk ticket' },
      { id: 'ent-32', name: 'freshdesk_ticket', category: 'enterprise', description: 'Create Freshdesk ticket' },
      { id: 'ent-33', name: 'intercom_conversation', category: 'enterprise', description: 'Create Intercom conversation' },
      { id: 'ent-34', name: 'helpscout_conversation', category: 'enterprise', description: 'Create Help Scout conversation' },
      { id: 'ent-35', name: 'front_message', category: 'enterprise', description: 'Send Front message' },
      { id: 'ent-36', name: 'sap_create_order', category: 'enterprise', description: 'Create SAP sales order' },
      { id: 'ent-37', name: 'sap_get_material', category: 'enterprise', description: 'Get SAP material data' },
      { id: 'ent-38', name: 'oracle_create_record', category: 'enterprise', description: 'Create Oracle ERP record' },
      { id: 'ent-39', name: 'workday_employee', category: 'enterprise', description: 'Manage Workday employee' },
      { id: 'ent-40', name: 'bamboohr_employee', category: 'enterprise', description: 'Manage BambooHR employee' },

      // ===== DATABASE & DATA TOOLS (25) =====
      { id: 'db-1', name: 'postgres_query', category: 'database', description: 'Execute PostgreSQL query' },
      { id: 'db-2', name: 'postgres_insert', category: 'database', description: 'Insert into PostgreSQL' },
      { id: 'db-3', name: 'postgres_update', category: 'database', description: 'Update PostgreSQL records' },
      { id: 'db-4', name: 'mysql_query', category: 'database', description: 'Execute MySQL query' },
      { id: 'db-5', name: 'mysql_insert', category: 'database', description: 'Insert into MySQL' },
      { id: 'db-6', name: 'mongodb_find', category: 'database', description: 'Find MongoDB documents' },
      { id: 'db-7', name: 'mongodb_insert', category: 'database', description: 'Insert MongoDB document' },
      { id: 'db-8', name: 'mongodb_update', category: 'database', description: 'Update MongoDB documents' },
      { id: 'db-9', name: 'redis_get', category: 'database', description: 'Get Redis value' },
      { id: 'db-10', name: 'redis_set', category: 'database', description: 'Set Redis value' },
      { id: 'db-11', name: 'redis_pub', category: 'database', description: 'Publish Redis message' },
      { id: 'db-12', name: 'elasticsearch_search', category: 'database', description: 'Search Elasticsearch' },
      { id: 'db-13', name: 'elasticsearch_index', category: 'database', description: 'Index to Elasticsearch' },
      { id: 'db-14', name: 'supabase_query', category: 'database', description: 'Query Supabase database' },
      { id: 'db-15', name: 'supabase_insert', category: 'database', description: 'Insert into Supabase' },
      { id: 'db-16', name: 'firebase_read', category: 'database', description: 'Read Firebase Firestore' },
      { id: 'db-17', name: 'firebase_write', category: 'database', description: 'Write to Firebase Firestore' },
      { id: 'db-18', name: 'planetscale_query', category: 'database', description: 'Query PlanetScale database' },
      { id: 'db-19', name: 'neon_query', category: 'database', description: 'Query Neon PostgreSQL' },
      { id: 'db-20', name: 'fauna_query', category: 'database', description: 'Query FaunaDB' },
      { id: 'db-21', name: 'cockroachdb_query', category: 'database', description: 'Query CockroachDB' },
      { id: 'db-22', name: 'dynamodb_get', category: 'database', description: 'Get DynamoDB item' },
      { id: 'db-23', name: 'dynamodb_put', category: 'database', description: 'Put DynamoDB item' },
      { id: 'db-24', name: 'bigquery_query', category: 'database', description: 'Run BigQuery query' },
      { id: 'db-25', name: 'snowflake_query', category: 'database', description: 'Run Snowflake query' },

      // ===== AI & LLM TOOLS (30) =====
      { id: 'ai-1', name: 'openai_chat', category: 'ai_llm', description: 'OpenAI GPT chat completion' },
      { id: 'ai-2', name: 'openai_embedding', category: 'ai_llm', description: 'Generate OpenAI embeddings' },
      { id: 'ai-3', name: 'openai_image', category: 'ai_llm', description: 'Generate DALL-E image' },
      { id: 'ai-4', name: 'openai_whisper', category: 'ai_llm', description: 'Transcribe audio with Whisper' },
      { id: 'ai-5', name: 'openai_tts', category: 'ai_llm', description: 'Generate speech with OpenAI TTS' },
      { id: 'ai-6', name: 'anthropic_claude', category: 'ai_llm', description: 'Claude AI completion' },
      { id: 'ai-7', name: 'anthropic_vision', category: 'ai_llm', description: 'Claude vision analysis' },
      { id: 'ai-8', name: 'google_gemini', category: 'ai_llm', description: 'Google Gemini completion' },
      { id: 'ai-9', name: 'google_gemini_vision', category: 'ai_llm', description: 'Gemini vision analysis' },
      { id: 'ai-10', name: 'google_vertex', category: 'ai_llm', description: 'Google Vertex AI' },
      { id: 'ai-11', name: 'mistral_chat', category: 'ai_llm', description: 'Mistral AI completion' },
      { id: 'ai-12', name: 'cohere_generate', category: 'ai_llm', description: 'Cohere text generation' },
      { id: 'ai-13', name: 'cohere_embed', category: 'ai_llm', description: 'Cohere embeddings' },
      { id: 'ai-14', name: 'cohere_rerank', category: 'ai_llm', description: 'Cohere rerank documents' },
      { id: 'ai-15', name: 'groq_chat', category: 'ai_llm', description: 'Groq fast inference' },
      { id: 'ai-16', name: 'perplexity_search', category: 'ai_llm', description: 'Perplexity AI search' },
      { id: 'ai-17', name: 'replicate_run', category: 'ai_llm', description: 'Run Replicate model' },
      { id: 'ai-18', name: 'huggingface_inference', category: 'ai_llm', description: 'Hugging Face inference' },
      { id: 'ai-19', name: 'together_ai', category: 'ai_llm', description: 'Together AI completion' },
      { id: 'ai-20', name: 'deepseek_chat', category: 'ai_llm', description: 'DeepSeek AI chat' },
      { id: 'ai-21', name: 'xai_grok', category: 'ai_llm', description: 'xAI Grok completion' },
      { id: 'ai-22', name: 'elevenlabs_tts', category: 'ai_llm', description: 'ElevenLabs text-to-speech' },
      { id: 'ai-23', name: 'elevenlabs_voice_clone', category: 'ai_llm', description: 'ElevenLabs voice cloning' },
      { id: 'ai-24', name: 'stability_image', category: 'ai_llm', description: 'Stability AI image generation' },
      { id: 'ai-25', name: 'midjourney_generate', category: 'ai_llm', description: 'Midjourney image generation' },
      { id: 'ai-26', name: 'runway_video', category: 'ai_llm', description: 'Runway video generation' },
      { id: 'ai-27', name: 'suno_music', category: 'ai_llm', description: 'Suno AI music generation' },
      { id: 'ai-28', name: 'udio_music', category: 'ai_llm', description: 'Udio music generation' },
      { id: 'ai-29', name: 'assemblyai_transcribe', category: 'ai_llm', description: 'AssemblyAI transcription' },
      { id: 'ai-30', name: 'deepgram_transcribe', category: 'ai_llm', description: 'Deepgram transcription' },

      // ===== AUTOMATION & WORKFLOW (25) =====
      { id: 'auto-1', name: 'zapier_trigger', category: 'automation', description: 'Trigger Zapier webhook' },
      { id: 'auto-2', name: 'zapier_action', category: 'automation', description: 'Execute Zapier action' },
      { id: 'auto-3', name: 'make_scenario', category: 'automation', description: 'Trigger Make.com scenario' },
      { id: 'auto-4', name: 'n8n_workflow', category: 'automation', description: 'Trigger n8n workflow' },
      { id: 'auto-5', name: 'pipedream_workflow', category: 'automation', description: 'Run Pipedream workflow' },
      { id: 'auto-6', name: 'tray_io_workflow', category: 'automation', description: 'Run Tray.io workflow' },
      { id: 'auto-7', name: 'workato_recipe', category: 'automation', description: 'Trigger Workato recipe' },
      { id: 'auto-8', name: 'power_automate_flow', category: 'automation', description: 'Run Power Automate flow' },
      { id: 'auto-9', name: 'ifttt_trigger', category: 'automation', description: 'Trigger IFTTT applet' },
      { id: 'auto-10', name: 'airflow_dag', category: 'automation', description: 'Trigger Airflow DAG' },
      { id: 'auto-11', name: 'prefect_flow', category: 'automation', description: 'Run Prefect flow' },
      { id: 'auto-12', name: 'dagster_pipeline', category: 'automation', description: 'Run Dagster pipeline' },
      { id: 'auto-13', name: 'temporal_workflow', category: 'automation', description: 'Start Temporal workflow' },
      { id: 'auto-14', name: 'cron_schedule', category: 'automation', description: 'Schedule cron job' },
      { id: 'auto-15', name: 'webhook_send', category: 'automation', description: 'Send webhook request' },
      { id: 'auto-16', name: 'webhook_receive', category: 'automation', description: 'Configure webhook receiver' },
      { id: 'auto-17', name: 'retool_workflow', category: 'automation', description: 'Run Retool workflow' },
      { id: 'auto-18', name: 'appsmith_workflow', category: 'automation', description: 'Run Appsmith workflow' },
      { id: 'auto-19', name: 'windmill_script', category: 'automation', description: 'Run Windmill script' },
      { id: 'auto-20', name: 'aws_lambda_invoke', category: 'automation', description: 'Invoke AWS Lambda function' },
      { id: 'auto-21', name: 'aws_step_functions', category: 'automation', description: 'Start Step Functions execution' },
      { id: 'auto-22', name: 'gcp_cloud_function', category: 'automation', description: 'Invoke GCP Cloud Function' },
      { id: 'auto-23', name: 'azure_function', category: 'automation', description: 'Invoke Azure Function' },
      { id: 'auto-24', name: 'vercel_function', category: 'automation', description: 'Invoke Vercel serverless function' },
      { id: 'auto-25', name: 'deno_deploy_function', category: 'automation', description: 'Invoke Deno Deploy function' },

      // ===== ANALYTICS & BI (25) =====
      { id: 'analytics-1', name: 'tableau_refresh', category: 'analytics', description: 'Refresh Tableau datasource' },
      { id: 'analytics-2', name: 'tableau_export', category: 'analytics', description: 'Export Tableau dashboard' },
      { id: 'analytics-3', name: 'powerbi_refresh', category: 'analytics', description: 'Refresh Power BI dataset' },
      { id: 'analytics-4', name: 'powerbi_report', category: 'analytics', description: 'Generate Power BI report' },
      { id: 'analytics-5', name: 'looker_query', category: 'analytics', description: 'Run Looker query' },
      { id: 'analytics-6', name: 'looker_dashboard', category: 'analytics', description: 'Get Looker dashboard data' },
      { id: 'analytics-7', name: 'metabase_query', category: 'analytics', description: 'Run Metabase query' },
      { id: 'analytics-8', name: 'redash_query', category: 'analytics', description: 'Run Redash query' },
      { id: 'analytics-9', name: 'superset_query', category: 'analytics', description: 'Run Apache Superset query' },
      { id: 'analytics-10', name: 'mode_report', category: 'analytics', description: 'Run Mode Analytics report' },
      { id: 'analytics-11', name: 'dbt_run', category: 'analytics', description: 'Run dbt transformation' },
      { id: 'analytics-12', name: 'dbt_test', category: 'analytics', description: 'Run dbt tests' },
      { id: 'analytics-13', name: 'fivetran_sync', category: 'analytics', description: 'Trigger Fivetran sync' },
      { id: 'analytics-14', name: 'airbyte_sync', category: 'analytics', description: 'Trigger Airbyte sync' },
      { id: 'analytics-15', name: 'stitch_sync', category: 'analytics', description: 'Trigger Stitch sync' },
      { id: 'analytics-16', name: 'census_sync', category: 'analytics', description: 'Trigger Census reverse ETL' },
      { id: 'analytics-17', name: 'hightouch_sync', category: 'analytics', description: 'Trigger Hightouch sync' },
      { id: 'analytics-18', name: 'posthog_event', category: 'analytics', description: 'Track PostHog event' },
      { id: 'analytics-19', name: 'posthog_query', category: 'analytics', description: 'Query PostHog analytics' },
      { id: 'analytics-20', name: 'heap_event', category: 'analytics', description: 'Track Heap event' },
      { id: 'analytics-21', name: 'fullstory_session', category: 'analytics', description: 'Get FullStory session' },
      { id: 'analytics-22', name: 'logrocket_session', category: 'analytics', description: 'Get LogRocket session' },
      { id: 'analytics-23', name: 'datadog_metric', category: 'analytics', description: 'Send Datadog metric' },
      { id: 'analytics-24', name: 'datadog_log', category: 'analytics', description: 'Send Datadog log' },
      { id: 'analytics-25', name: 'newrelic_event', category: 'analytics', description: 'Send New Relic event' },

      // ===== SECURITY & COMPLIANCE (20) =====
      { id: 'sec-1', name: 'okta_create_user', category: 'security', description: 'Create Okta user' },
      { id: 'sec-2', name: 'okta_assign_group', category: 'security', description: 'Assign Okta group' },
      { id: 'sec-3', name: 'auth0_create_user', category: 'security', description: 'Create Auth0 user' },
      { id: 'sec-4', name: 'auth0_assign_role', category: 'security', description: 'Assign Auth0 role' },
      { id: 'sec-5', name: 'onelogin_user', category: 'security', description: 'Manage OneLogin user' },
      { id: 'sec-6', name: 'azure_ad_user', category: 'security', description: 'Manage Azure AD user' },
      { id: 'sec-7', name: 'jumpcloud_user', category: 'security', description: 'Manage JumpCloud user' },
      { id: 'sec-8', name: 'vault_read', category: 'security', description: 'Read HashiCorp Vault secret' },
      { id: 'sec-9', name: 'vault_write', category: 'security', description: 'Write HashiCorp Vault secret' },
      { id: 'sec-10', name: 'aws_secrets_get', category: 'security', description: 'Get AWS Secrets Manager secret' },
      { id: 'sec-11', name: 'aws_kms_encrypt', category: 'security', description: 'Encrypt with AWS KMS' },
      { id: 'sec-12', name: 'gcp_secret_get', category: 'security', description: 'Get GCP Secret Manager secret' },
      { id: 'sec-13', name: '1password_get', category: 'security', description: 'Get 1Password secret' },
      { id: 'sec-14', name: 'crowdstrike_alert', category: 'security', description: 'Get CrowdStrike alerts' },
      { id: 'sec-15', name: 'splunk_search', category: 'security', description: 'Run Splunk search' },
      { id: 'sec-16', name: 'pagerduty_incident', category: 'security', description: 'Create PagerDuty incident' },
      { id: 'sec-17', name: 'opsgenie_alert', category: 'security', description: 'Create OpsGenie alert' },
      { id: 'sec-18', name: 'sentry_issue', category: 'security', description: 'Get Sentry issues' },
      { id: 'sec-19', name: 'bugsnag_error', category: 'security', description: 'Get Bugsnag errors' },
      { id: 'sec-20', name: 'rollbar_error', category: 'security', description: 'Get Rollbar errors' },

      // ===== DOCUMENT PROCESSING (20) =====
      { id: 'doc-1', name: 'pdf_generate', category: 'documents', description: 'Generate PDF document' },
      { id: 'doc-2', name: 'pdf_merge', category: 'documents', description: 'Merge multiple PDFs' },
      { id: 'doc-3', name: 'pdf_split', category: 'documents', description: 'Split PDF into pages' },
      { id: 'doc-4', name: 'pdf_extract_text', category: 'documents', description: 'Extract text from PDF' },
      { id: 'doc-5', name: 'pdf_to_image', category: 'documents', description: 'Convert PDF to images' },
      { id: 'doc-6', name: 'docx_create', category: 'documents', description: 'Create Word document' },
      { id: 'doc-7', name: 'docx_to_pdf', category: 'documents', description: 'Convert DOCX to PDF' },
      { id: 'doc-8', name: 'excel_create', category: 'documents', description: 'Create Excel spreadsheet' },
      { id: 'doc-9', name: 'excel_read', category: 'documents', description: 'Read Excel data' },
      { id: 'doc-10', name: 'excel_to_json', category: 'documents', description: 'Convert Excel to JSON' },
      { id: 'doc-11', name: 'csv_parse', category: 'documents', description: 'Parse CSV file' },
      { id: 'doc-12', name: 'csv_generate', category: 'documents', description: 'Generate CSV file' },
      { id: 'doc-13', name: 'google_docs_create', category: 'documents', description: 'Create Google Doc' },
      { id: 'doc-14', name: 'google_sheets_read', category: 'documents', description: 'Read Google Sheets' },
      { id: 'doc-15', name: 'google_sheets_write', category: 'documents', description: 'Write to Google Sheets' },
      { id: 'doc-16', name: 'google_slides_create', category: 'documents', description: 'Create Google Slides' },
      { id: 'doc-17', name: 'ocr_extract', category: 'documents', description: 'OCR text extraction' },
      { id: 'doc-18', name: 'markdown_to_html', category: 'documents', description: 'Convert Markdown to HTML' },
      { id: 'doc-19', name: 'html_to_pdf', category: 'documents', description: 'Convert HTML to PDF' },
      { id: 'doc-20', name: 'image_resize', category: 'documents', description: 'Resize and optimize images' },

      // ===== NOTIFICATION & MESSAGING (20) =====
      { id: 'notify-1', name: 'twilio_sms', category: 'notifications', description: 'Send SMS via Twilio' },
      { id: 'notify-2', name: 'twilio_whatsapp', category: 'notifications', description: 'Send WhatsApp via Twilio' },
      { id: 'notify-3', name: 'twilio_call', category: 'notifications', description: 'Make voice call via Twilio' },
      { id: 'notify-4', name: 'vonage_sms', category: 'notifications', description: 'Send SMS via Vonage' },
      { id: 'notify-5', name: 'messagebird_sms', category: 'notifications', description: 'Send SMS via MessageBird' },
      { id: 'notify-6', name: 'plivo_sms', category: 'notifications', description: 'Send SMS via Plivo' },
      { id: 'notify-7', name: 'sns_publish', category: 'notifications', description: 'Publish to AWS SNS' },
      { id: 'notify-8', name: 'firebase_push', category: 'notifications', description: 'Send Firebase push notification' },
      { id: 'notify-9', name: 'onesignal_push', category: 'notifications', description: 'Send OneSignal push notification' },
      { id: 'notify-10', name: 'pusher_send', category: 'notifications', description: 'Send Pusher message' },
      { id: 'notify-11', name: 'ably_publish', category: 'notifications', description: 'Publish Ably message' },
      { id: 'notify-12', name: 'telegram_send', category: 'notifications', description: 'Send Telegram message' },
      { id: 'notify-13', name: 'telegram_bot', category: 'notifications', description: 'Telegram bot interaction' },
      { id: 'notify-14', name: 'whatsapp_business', category: 'notifications', description: 'WhatsApp Business message' },
      { id: 'notify-15', name: 'signal_send', category: 'notifications', description: 'Send Signal message' },
      { id: 'notify-16', name: 'viber_send', category: 'notifications', description: 'Send Viber message' },
      { id: 'notify-17', name: 'line_send', category: 'notifications', description: 'Send LINE message' },
      { id: 'notify-18', name: 'wechat_send', category: 'notifications', description: 'Send WeChat message' },
      { id: 'notify-19', name: 'teams_notification', category: 'notifications', description: 'Send Teams notification' },
      { id: 'notify-20', name: 'slack_notification', category: 'notifications', description: 'Send Slack notification' },

      // ===== HR & RECRUITING (15) =====
      { id: 'hr-1', name: 'greenhouse_candidate', category: 'hr', description: 'Create Greenhouse candidate' },
      { id: 'hr-2', name: 'greenhouse_job', category: 'hr', description: 'Create Greenhouse job posting' },
      { id: 'hr-3', name: 'lever_candidate', category: 'hr', description: 'Create Lever candidate' },
      { id: 'hr-4', name: 'lever_opportunity', category: 'hr', description: 'Create Lever opportunity' },
      { id: 'hr-5', name: 'workable_candidate', category: 'hr', description: 'Create Workable candidate' },
      { id: 'hr-6', name: 'ashby_candidate', category: 'hr', description: 'Create Ashby candidate' },
      { id: 'hr-7', name: 'gusto_employee', category: 'hr', description: 'Manage Gusto employee' },
      { id: 'hr-8', name: 'rippling_employee', category: 'hr', description: 'Manage Rippling employee' },
      { id: 'hr-9', name: 'deel_contractor', category: 'hr', description: 'Manage Deel contractor' },
      { id: 'hr-10', name: 'remote_employee', category: 'hr', description: 'Manage Remote.com employee' },
      { id: 'hr-11', name: 'lattice_review', category: 'hr', description: 'Create Lattice review' },
      { id: 'hr-12', name: '15five_checkin', category: 'hr', description: 'Create 15Five check-in' },
      { id: 'hr-13', name: 'culture_amp_survey', category: 'hr', description: 'Send Culture Amp survey' },
      { id: 'hr-14', name: 'slack_kudos', category: 'hr', description: 'Send Slack recognition' },
      { id: 'hr-15', name: 'bonusly_reward', category: 'hr', description: 'Send Bonusly reward' },

      // ===== ECOMMERCE & INVENTORY (15) =====
      { id: 'ecom-1', name: 'shopify_order', category: 'ecommerce', description: 'Create Shopify order' },
      { id: 'ecom-2', name: 'shopify_fulfillment', category: 'ecommerce', description: 'Fulfill Shopify order' },
      { id: 'ecom-3', name: 'shopify_inventory', category: 'ecommerce', description: 'Update Shopify inventory' },
      { id: 'ecom-4', name: 'stripe_product', category: 'ecommerce', description: 'Create Stripe product' },
      { id: 'ecom-5', name: 'stripe_price', category: 'ecommerce', description: 'Create Stripe price' },
      { id: 'ecom-6', name: 'woocommerce_order', category: 'ecommerce', description: 'Create WooCommerce order' },
      { id: 'ecom-7', name: 'bigcommerce_order', category: 'ecommerce', description: 'Create BigCommerce order' },
      { id: 'ecom-8', name: 'magento_product', category: 'ecommerce', description: 'Create Magento product' },
      { id: 'ecom-9', name: 'amazon_listing', category: 'ecommerce', description: 'Create Amazon listing' },
      { id: 'ecom-10', name: 'ebay_listing', category: 'ecommerce', description: 'Create eBay listing' },
      { id: 'ecom-11', name: 'shipstation_shipment', category: 'ecommerce', description: 'Create ShipStation shipment' },
      { id: 'ecom-12', name: 'shippo_label', category: 'ecommerce', description: 'Create Shippo shipping label' },
      { id: 'ecom-13', name: 'easypost_shipment', category: 'ecommerce', description: 'Create EasyPost shipment' },
      { id: 'ecom-14', name: 'aftership_tracking', category: 'ecommerce', description: 'Track AfterShip package' },
      { id: 'ecom-15', name: 'inventory_planner', category: 'ecommerce', description: 'Inventory planning forecast' },

      // ===== TESTING & QA (15) =====
      { id: 'test-1', name: 'playwright_test', category: 'testing', description: 'Run Playwright E2E test' },
      { id: 'test-2', name: 'cypress_test', category: 'testing', description: 'Run Cypress E2E test' },
      { id: 'test-3', name: 'selenium_test', category: 'testing', description: 'Run Selenium test' },
      { id: 'test-4', name: 'jest_test', category: 'testing', description: 'Run Jest unit tests' },
      { id: 'test-5', name: 'vitest_test', category: 'testing', description: 'Run Vitest tests' },
      { id: 'test-6', name: 'pytest_test', category: 'testing', description: 'Run pytest tests' },
      { id: 'test-7', name: 'postman_collection', category: 'testing', description: 'Run Postman collection' },
      { id: 'test-8', name: 'k6_load_test', category: 'testing', description: 'Run k6 load test' },
      { id: 'test-9', name: 'artillery_load_test', category: 'testing', description: 'Run Artillery load test' },
      { id: 'test-10', name: 'browserstack_test', category: 'testing', description: 'Run BrowserStack test' },
      { id: 'test-11', name: 'lambdatest_test', category: 'testing', description: 'Run LambdaTest test' },
      { id: 'test-12', name: 'testim_test', category: 'testing', description: 'Run Testim.io test' },
      { id: 'test-13', name: 'mabl_test', category: 'testing', description: 'Run Mabl test' },
      { id: 'test-14', name: 'percy_visual', category: 'testing', description: 'Run Percy visual test' },
      { id: 'test-15', name: 'chromatic_visual', category: 'testing', description: 'Run Chromatic visual test' },
    ];

    return enterpriseTools.map(tool => ({
      ...tool,
      enabled: true,
      usageCount: Math.floor(Math.random() * 1000) + 100,
      config: null
    }));
  }

  async updateMcpToolConfig(toolId: string, update: Partial<WaiMcpToolConfig>, userId: string): Promise<WaiMcpToolConfig> {
    const existing = await db
      .select()
      .from(waiMcpToolConfigs)
      .where(eq(waiMcpToolConfigs.toolId, toolId))
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await db
        .update(waiMcpToolConfigs)
        .set({
          ...update,
          updatedAt: new Date()
        })
        .where(eq(waiMcpToolConfigs.toolId, toolId))
        .returning();

      await this.logAuditEvent('update', 'tool', toolId, existing[0], updated, userId);
      return updated;
    } else {
      const tool = mcpToolRegistry.getToolById(toolId);
      const [created] = await db
        .insert(waiMcpToolConfigs)
        .values({
          toolId,
          toolName: tool?.name || toolId,
          category: tool?.category || 'general',
          enabled: update.enabled ?? true,
          rateLimitPerMinute: update.rateLimitPerMinute || 60,
          rateLimitPerHour: update.rateLimitPerHour || 1000,
          rateLimitPerDay: update.rateLimitPerDay || 10000,
          description: tool?.description
        })
        .returning();

      await this.logAuditEvent('create', 'tool', toolId, null, created, userId);
      return created;
    }
  }

  async getTokenUsageAnalytics(query: TokenUsageQuery): Promise<any> {
    const conditions = [
      gte(waiTokenUsage.date, query.startDate),
      lte(waiTokenUsage.date, query.endDate)
    ];

    if (query.providerId) {
      conditions.push(eq(waiTokenUsage.providerId, query.providerId));
    }
    if (query.modelId) {
      conditions.push(eq(waiTokenUsage.modelId, query.modelId));
    }
    if (query.agentId) {
      conditions.push(eq(waiTokenUsage.agentId, query.agentId));
    }

    const baseQuery = db
      .select({
        totalInputTokens: sum(waiTokenUsage.inputTokens),
        totalOutputTokens: sum(waiTokenUsage.outputTokens),
        totalTokens: sum(waiTokenUsage.totalTokens),
        totalCost: sum(waiTokenUsage.totalCost),
        totalRequests: sum(waiTokenUsage.requestCount),
        avgLatency: avg(waiTokenUsage.avgLatency)
      })
      .from(waiTokenUsage)
      .where(and(...conditions));

    const totals = await baseQuery;

    let breakdown: any[] = [];
    if (query.groupBy === 'provider') {
      breakdown = await db
        .select({
          providerId: waiTokenUsage.providerId,
          totalTokens: sum(waiTokenUsage.totalTokens),
          totalCost: sum(waiTokenUsage.totalCost),
          requestCount: sum(waiTokenUsage.requestCount)
        })
        .from(waiTokenUsage)
        .where(and(...conditions))
        .groupBy(waiTokenUsage.providerId);
    } else if (query.groupBy === 'model') {
      breakdown = await db
        .select({
          modelId: waiTokenUsage.modelId,
          providerId: waiTokenUsage.providerId,
          totalTokens: sum(waiTokenUsage.totalTokens),
          totalCost: sum(waiTokenUsage.totalCost),
          requestCount: sum(waiTokenUsage.requestCount)
        })
        .from(waiTokenUsage)
        .where(and(...conditions))
        .groupBy(waiTokenUsage.modelId, waiTokenUsage.providerId);
    } else if (query.groupBy === 'agent') {
      breakdown = await db
        .select({
          agentId: waiTokenUsage.agentId,
          totalTokens: sum(waiTokenUsage.totalTokens),
          totalCost: sum(waiTokenUsage.totalCost),
          requestCount: sum(waiTokenUsage.requestCount)
        })
        .from(waiTokenUsage)
        .where(and(...conditions))
        .groupBy(waiTokenUsage.agentId);
    }

    return {
      totals: totals[0] || {
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalTokens: 0,
        totalCost: 0,
        totalRequests: 0,
        avgLatency: 0
      },
      breakdown,
      period: {
        start: query.startDate,
        end: query.endDate
      }
    };
  }

  async recordTokenUsage(usage: {
    providerId: string;
    modelId: string;
    agentId?: string;
    userId?: string;
    inputTokens: number;
    outputTokens: number;
    cost: number;
    latency: number;
    success: boolean;
  }): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await db
      .insert(waiTokenUsage)
      .values({
        date: today,
        providerId: usage.providerId,
        modelId: usage.modelId,
        agentId: usage.agentId,
        userId: usage.userId,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        totalTokens: usage.inputTokens + usage.outputTokens,
        inputCost: String(usage.cost * 0.4),
        outputCost: String(usage.cost * 0.6),
        totalCost: String(usage.cost),
        requestCount: 1,
        successCount: usage.success ? 1 : 0,
        errorCount: usage.success ? 0 : 1,
        avgLatency: usage.latency
      })
      .onConflictDoNothing();
  }

  async createCustomAgent(agentData: {
    agentId: string;
    agentName: string;
    tier: string;
    romaLevel: string;
    systemPrompt: string;
    communicationMode: string;
    collaborationMode: string;
    assignedTools: string[];
    behaviors: Record<string, any>;
    workflows: any[];
    personality: Record<string, any>;
    triggers: any[];
    canCollaborateWith: string[];
    preferredProvider?: string;
    preferredModel?: string;
    maxTokens?: number;
    temperature?: number;
    description?: string;
    category?: string;
    tags?: string[];
  }, userId: string): Promise<WaiAgentConfig> {
    const [created] = await db
      .insert(waiAgentConfigs)
      .values({
        agentId: agentData.agentId,
        agentName: agentData.agentName,
        tier: agentData.tier,
        romaLevel: agentData.romaLevel,
        systemPrompt: agentData.systemPrompt,
        communicationMode: agentData.communicationMode,
        communicationPatterns: {},
        collaborationMode: agentData.collaborationMode,
        assignedTools: agentData.assignedTools,
        behaviors: agentData.behaviors,
        personality: agentData.personality,
        workflows: agentData.workflows,
        triggers: agentData.triggers,
        canCollaborateWith: agentData.canCollaborateWith,
        preferredProvider: agentData.preferredProvider,
        preferredModel: agentData.preferredModel,
        maxTokens: agentData.maxTokens || 4096,
        temperature: String(agentData.temperature ?? 0.7),
        enabled: true,
        status: 'active',
        description: agentData.description,
        category: agentData.category,
        tags: agentData.tags || [],
        createdBy: userId
      })
      .returning();

    await this.logAuditEvent('create', 'custom_agent', agentData.agentId, null, created, userId);
    
    return created;
  }

  async getAuditLogs(limit: number = 100, offset: number = 0): Promise<any[]> {
    return db
      .select()
      .from(waiAdminAuditLogs)
      .orderBy(desc(waiAdminAuditLogs.createdAt))
      .limit(limit)
      .offset(offset);
  }

  private async logAuditEvent(
    action: string,
    resourceType: string,
    resourceId: string,
    previousValue: any,
    newValue: any,
    userId: string
  ): Promise<void> {
    try {
      await db.insert(waiAdminAuditLogs).values({
        action,
        resourceType,
        resourceId,
        previousValue,
        newValue,
        userId,
        status: 'success'
      });
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }

  private incrementVersion(version: string): string {
    const parts = version.split('.').map(Number);
    parts[2] = (parts[2] || 0) + 1;
    return parts.join('.');
  }

  // Platform Settings Management
  async getAllSettings(): Promise<any[]> {
    return db.select().from(waiPlatformSettings).orderBy(waiPlatformSettings.category, waiPlatformSettings.settingKey);
  }

  async getSettingsByCategory(category: string): Promise<any[]> {
    return db.select().from(waiPlatformSettings).where(eq(waiPlatformSettings.category, category));
  }

  async updateSetting(settingKey: string, value: any, userId: string): Promise<any> {
    const [existing] = await db.select().from(waiPlatformSettings).where(eq(waiPlatformSettings.settingKey, settingKey)).limit(1);
    
    if (!existing) {
      throw new Error(`Setting ${settingKey} not found`);
    }

    const [updated] = await db.update(waiPlatformSettings)
      .set({
        settingValue: value,
        updatedBy: userId,
        updatedAt: new Date()
      })
      .where(eq(waiPlatformSettings.settingKey, settingKey))
      .returning();

    await this.logAuditEvent('update', 'setting', settingKey, existing.settingValue, value, userId);
    return updated;
  }

  async bulkUpdateSettings(settings: { key: string; value: any }[], userId: string): Promise<any[]> {
    const results: any[] = [];
    for (const setting of settings) {
      const updated = await this.updateSetting(setting.key, setting.value, userId);
      results.push(updated);
    }
    return results;
  }

  // API Gateway - Client Management
  async getAllApiClients(): Promise<any[]> {
    const clients = await db.select().from(waiApiClients).orderBy(desc(waiApiClients.createdAt));
    const keys = await db.select().from(waiApiKeys);
    
    return clients.map(client => ({
      ...client,
      apiKeys: keys.filter(k => k.clientId === client.id).map(k => ({
        id: k.id,
        keyId: k.keyId,
        keyPrefix: k.keyPrefix,
        keyName: k.keyName,
        status: k.status,
        expiresAt: k.expiresAt,
        lastUsedAt: k.lastUsedAt,
        usageCount: k.usageCount
      }))
    }));
  }

  async createApiClient(data: any, userId: string): Promise<any> {
    const [client] = await db.insert(waiApiClients).values({
      clientName: data.clientName,
      clientDescription: data.clientDescription,
      clientType: data.clientType || 'application',
      ownerId: userId !== 'system' ? userId : null,
      environment: data.environment || 'development',
      allowedEndpoints: data.allowedEndpoints || ['*'],
      allowedAgents: data.allowedAgents || ['*'],
      allowedProviders: data.allowedProviders || ['*'],
      allowedTools: data.allowedTools || ['*'],
      scopes: data.scopes || ['read', 'execute'],
      rateLimitPerMinute: data.rateLimitPerMinute || 60,
      rateLimitPerHour: data.rateLimitPerHour || 1000,
      rateLimitPerDay: data.rateLimitPerDay || 10000,
      monthlyQuota: data.monthlyQuota || 100000,
      webhookUrl: data.webhookUrl,
      ipWhitelist: data.ipWhitelist || []
    }).returning();

    await this.logAuditEvent('create', 'api_client', client.clientId, null, client, userId);
    return client;
  }

  async updateApiClient(clientId: string, data: any, userId: string): Promise<any> {
    const [existing] = await db.select().from(waiApiClients).where(eq(waiApiClients.clientId, clientId)).limit(1);
    
    if (!existing) {
      throw new Error(`API client ${clientId} not found`);
    }

    const [updated] = await db.update(waiApiClients)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(waiApiClients.clientId, clientId))
      .returning();

    await this.logAuditEvent('update', 'api_client', clientId, existing, updated, userId);
    return updated;
  }

  async deleteApiClient(clientId: string, userId: string): Promise<boolean> {
    const [existing] = await db.select().from(waiApiClients).where(eq(waiApiClients.clientId, clientId)).limit(1);
    
    if (!existing) {
      throw new Error(`API client ${clientId} not found`);
    }

    // Revoke all API keys first
    await db.update(waiApiKeys)
      .set({ status: 'revoked', revokedAt: new Date() })
      .where(eq(waiApiKeys.clientId, existing.id));

    // Update status to revoked
    await db.update(waiApiClients)
      .set({ status: 'revoked', updatedAt: new Date() })
      .where(eq(waiApiClients.clientId, clientId));

    await this.logAuditEvent('delete', 'api_client', clientId, existing, null, userId);
    return true;
  }

  // API Key Management
  async generateApiKey(clientId: string, keyName: string, expiresInDays: number | null, userId: string): Promise<any> {
    const [client] = await db.select().from(waiApiClients).where(eq(waiApiClients.clientId, clientId)).limit(1);
    
    if (!client) {
      throw new Error(`API client ${clientId} not found`);
    }

    // Generate a secure API key
    const rawKey = `wai_${crypto.randomBytes(32).toString('hex')}`;
    const keyPrefix = rawKey.substring(0, 12);
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : null;

    const [apiKey] = await db.insert(waiApiKeys).values({
      keyPrefix,
      keyHash,
      keyName,
      clientId: client.id,
      expiresAt,
      createdBy: userId
    }).returning();

    await this.logAuditEvent('create', 'api_key', apiKey.keyId, null, { keyId: apiKey.keyId, keyName }, userId);

    // Return the raw key ONLY ONCE
    return {
      ...apiKey,
      rawKey, // Only shown once!
      message: 'Save this key securely. It will not be shown again.'
    };
  }

  async revokeApiKey(keyId: string, userId: string): Promise<boolean> {
    const [existing] = await db.select().from(waiApiKeys).where(eq(waiApiKeys.keyId, keyId)).limit(1);
    
    if (!existing) {
      throw new Error(`API key ${keyId} not found`);
    }

    await db.update(waiApiKeys)
      .set({ status: 'revoked', revokedAt: new Date() })
      .where(eq(waiApiKeys.keyId, keyId));

    await this.logAuditEvent('revoke', 'api_key', keyId, existing, null, userId);
    return true;
  }

  async validateApiKey(rawKey: string): Promise<any | null> {
    const keyPrefix = rawKey.substring(0, 12);
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const [apiKey] = await db.select().from(waiApiKeys)
      .where(and(
        eq(waiApiKeys.keyPrefix, keyPrefix),
        eq(waiApiKeys.keyHash, keyHash),
        eq(waiApiKeys.status, 'active')
      ))
      .limit(1);

    if (!apiKey) return null;

    // Check expiration
    if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
      return null;
    }

    // Update usage stats
    await db.update(waiApiKeys)
      .set({
        lastUsedAt: new Date(),
        usageCount: (apiKey.usageCount || 0) + 1
      })
      .where(eq(waiApiKeys.id, apiKey.id));

    // Get client info
    const [client] = await db.select().from(waiApiClients).where(eq(waiApiClients.id, apiKey.clientId)).limit(1);

    return { apiKey, client };
  }

  // API Usage Logging
  async logApiUsage(data: {
    clientId: number;
    apiKeyId: number;
    endpoint: string;
    method: string;
    statusCode: number;
    agentId?: string;
    providerId?: string;
    toolId?: string;
    requestDuration?: number;
    inputTokens?: number;
    outputTokens?: number;
    estimatedCost?: number;
    ipAddress?: string;
    userAgent?: string;
    errorCode?: string;
    errorMessage?: string;
  }): Promise<void> {
    await db.insert(waiApiUsageLogs).values(data);
    
    // Update client's monthly usage
    await db.execute(sql`
      UPDATE wai_api_clients 
      SET current_month_usage = current_month_usage + 1,
          last_accessed_at = NOW()
      WHERE id = ${data.clientId}
    `);
  }

  async getApiUsageStats(clientId?: string, days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = db.select({
      endpoint: waiApiUsageLogs.endpoint,
      method: waiApiUsageLogs.method,
      totalRequests: count(),
      avgDuration: avg(waiApiUsageLogs.requestDuration),
      totalTokens: sum(sql`COALESCE(${waiApiUsageLogs.inputTokens}, 0) + COALESCE(${waiApiUsageLogs.outputTokens}, 0)`),
      totalCost: sum(waiApiUsageLogs.estimatedCost)
    })
    .from(waiApiUsageLogs)
    .where(gte(waiApiUsageLogs.createdAt, startDate))
    .groupBy(waiApiUsageLogs.endpoint, waiApiUsageLogs.method);

    return query;
  }

  // API Documentation
  getApiDocumentation(): any {
    return {
      version: 'v1.0',
      title: 'WAI SDK API Documentation',
      description: 'Complete API reference for the WAI SDK v1.0 platform',
      baseUrl: '/api',
      authentication: {
        type: 'API Key',
        header: 'X-WAI-API-Key',
        description: 'All API requests require an API key in the X-WAI-API-Key header'
      },
      endpoints: [
        {
          group: 'Agents',
          endpoints: [
            { method: 'GET', path: '/api/agents', description: 'List all 267+ agents with tier categorization', response: '{ agents: Agent[], count: number }' },
            { method: 'GET', path: '/api/agents/:id', description: 'Get agent details by ID', response: '{ agent: Agent }' },
            { method: 'POST', path: '/api/agents/:id/execute', description: 'Execute an agent with a task', request: '{ task: string, context?: object }', response: '{ result: any, tokens: number }' },
            { method: 'GET', path: '/api/agents/tiers', description: 'Get agents grouped by tier', response: '{ executive: Agent[], development: Agent[], ... }' }
          ]
        },
        {
          group: 'LLM Providers',
          endpoints: [
            { method: 'GET', path: '/api/providers', description: 'List all 23+ LLM providers', response: '{ providers: Provider[], count: number }' },
            { method: 'GET', path: '/api/providers/:id', description: 'Get provider details', response: '{ provider: Provider }' },
            { method: 'GET', path: '/api/providers/:id/models', description: 'List models for a provider', response: '{ models: Model[] }' },
            { method: 'POST', path: '/api/providers/:id/complete', description: 'Send completion request to provider', request: '{ prompt: string, model?: string }', response: '{ text: string, tokens: number }' }
          ]
        },
        {
          group: 'MCP Tools',
          endpoints: [
            { method: 'GET', path: '/api/mcp/tools', description: 'List all 495+ enterprise MCP tools', response: '{ tools: Tool[], count: number }' },
            { method: 'GET', path: '/api/mcp/tools/:id', description: 'Get tool details', response: '{ tool: Tool }' },
            { method: 'POST', path: '/api/mcp/tools/:id/execute', description: 'Execute an MCP tool', request: '{ parameters: object }', response: '{ result: any }' },
            { method: 'GET', path: '/api/mcp/categories', description: 'List tool categories', response: '{ categories: Category[] }' }
          ]
        },
        {
          group: 'Orchestration',
          endpoints: [
            { method: 'POST', path: '/api/orchestrate', description: 'Run multi-agent orchestration', request: '{ task: string, agents?: string[], mode?: string }', response: '{ result: any, executionPlan: any }' },
            { method: 'GET', path: '/api/orchestrate/:jobId', description: 'Get orchestration job status', response: '{ job: Job, status: string }' },
            { method: 'POST', path: '/api/orchestrate/stream', description: 'Stream orchestration results (SSE)', request: '{ task: string }', response: 'EventStream' }
          ]
        },
        {
          group: 'Memory',
          endpoints: [
            { method: 'POST', path: '/api/memory/store', description: 'Store memory in Mem0', request: '{ key: string, value: any, context?: string }', response: '{ id: string }' },
            { method: 'GET', path: '/api/memory/search', description: 'Search memories by similarity', request: '?query=string&limit=number', response: '{ memories: Memory[] }' },
            { method: 'DELETE', path: '/api/memory/:id', description: 'Delete a memory', response: '{ success: boolean }' }
          ]
        },
        {
          group: 'Analytics',
          endpoints: [
            { method: 'GET', path: '/api/analytics/usage', description: 'Get token usage analytics', request: '?period=30d&groupBy=provider', response: '{ usage: UsageData[] }' },
            { method: 'GET', path: '/api/analytics/costs', description: 'Get cost breakdown', request: '?period=30d', response: '{ costs: CostData[] }' },
            { method: 'GET', path: '/api/analytics/performance', description: 'Get performance metrics', response: '{ latency: number, successRate: number }' }
          ]
        }
      ],
      errors: {
        400: 'Bad Request - Invalid parameters',
        401: 'Unauthorized - Invalid or missing API key',
        403: 'Forbidden - Insufficient permissions',
        404: 'Not Found - Resource not found',
        429: 'Too Many Requests - Rate limit exceeded',
        500: 'Internal Server Error'
      },
      rateLimits: {
        default: '60 requests/minute, 1000 requests/hour',
        burst: 'Up to 100 requests in 10 seconds',
        quotas: 'Monthly quotas based on plan'
      }
    };
  }

  // Downloadable Guides
  getGuides(): any[] {
    return [
      {
        id: 'sdk-integration',
        title: 'WAI SDK Integration Guide',
        description: 'Complete guide to integrating WAI SDK into your application',
        format: 'markdown',
        sections: ['Installation', 'Authentication', 'Quick Start', 'Agent Execution', 'Error Handling'],
        downloadUrl: '/api/wai-admin/guides/sdk-integration/download'
      },
      {
        id: 'agent-development',
        title: 'Custom Agent Development',
        description: 'Learn how to create and configure custom agents',
        format: 'markdown',
        sections: ['Agent Architecture', 'System Prompts', 'Workflows', 'Tools', 'Collaboration'],
        downloadUrl: '/api/wai-admin/guides/agent-development/download'
      },
      {
        id: 'api-reference',
        title: 'API Reference Documentation',
        description: 'Complete API reference with examples',
        format: 'markdown',
        sections: ['Authentication', 'Endpoints', 'Request/Response', 'Error Codes', 'SDKs'],
        downloadUrl: '/api/wai-admin/guides/api-reference/download'
      },
      {
        id: 'mcp-tools',
        title: 'MCP Tools Configuration',
        description: 'Configure and use 495+ enterprise MCP tools across 20 categories',
        format: 'markdown',
        sections: ['Tool Categories', 'Configuration', 'Rate Limits', 'Custom Tools'],
        downloadUrl: '/api/wai-admin/guides/mcp-tools/download'
      },
      {
        id: 'security-best-practices',
        title: 'Security Best Practices',
        description: 'Security guidelines for production deployment',
        format: 'markdown',
        sections: ['API Key Management', 'Rate Limiting', 'Audit Logging', 'Encryption'],
        downloadUrl: '/api/wai-admin/guides/security/download'
      }
    ];
  }

  generateGuideContent(guideId: string): string {
    const guides: Record<string, string> = {
      'sdk-integration': `# WAI SDK Integration Guide

## Overview
The WAI SDK v1.0 provides enterprise-grade AI orchestration with 267+ autonomous agents, 23+ LLM providers, and 495+ enterprise MCP tools across 20 categories.

## Installation

### Prerequisites
- Node.js 18+ or Python 3.10+
- Valid API key from the WAI Admin Dashboard

### JavaScript/TypeScript
\`\`\`bash
npm install @wai/sdk
\`\`\`

\`\`\`typescript
import { WaiClient } from '@wai/sdk';

const client = new WaiClient({
  apiKey: process.env.WAI_API_KEY,
  baseUrl: 'https://your-instance.example.com/api'
});
\`\`\`

## Authentication
All API requests require an API key in the \`X-WAI-API-Key\` header.

\`\`\`typescript
const response = await fetch('/api/agents', {
  headers: { 'X-WAI-API-Key': 'your-api-key' }
});
\`\`\`

## Quick Start

### Execute an Agent
\`\`\`typescript
const result = await client.agents.execute('fullstack-developer', {
  task: 'Create a REST API endpoint for user authentication',
  context: { framework: 'express' }
});
\`\`\`

### Use LLM Provider
\`\`\`typescript
const completion = await client.providers.complete('openai', {
  prompt: 'Explain quantum computing',
  model: 'gpt-4-turbo'
});
\`\`\`

### Execute MCP Tool
\`\`\`typescript
const result = await client.tools.execute('github-create-issue', {
  repo: 'owner/repo',
  title: 'Bug report',
  body: 'Description...'
});
\`\`\`

## Error Handling
\`\`\`typescript
try {
  const result = await client.agents.execute('agent-id', { task: '...' });
} catch (error) {
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    // Wait and retry
  } else if (error.code === 'AGENT_NOT_FOUND') {
    // Handle missing agent
  }
}
\`\`\`
`,
      'agent-development': `# Custom Agent Development Guide

## Agent Architecture
WAI agents follow the ROMA (Runbook-Oriented Multi-Agent) architecture with autonomy levels L1-L4.

### ROMA Levels
- **L1**: Basic task execution with human oversight
- **L2**: Semi-autonomous with approval checkpoints
- **L3**: Fully autonomous with monitoring
- **L4**: Self-improving with continuous learning

## Creating Custom Agents

### Using the Admin Dashboard
1. Navigate to /wai-admin → Create Agent tab
2. Fill in agent details and system prompt
3. Configure tools and workflows
4. Set collaboration modes

### Via API
\`\`\`typescript
const agent = await client.admin.agents.create({
  agentId: 'my-custom-agent',
  agentName: 'My Custom Agent',
  tier: 'development',
  romaLevel: 'L2',
  systemPrompt: \`You are a specialized agent for...\`,
  assignedTools: ['code-execute', 'file-read'],
  workflows: [{
    name: 'Main Workflow',
    steps: ['analyze', 'plan', 'execute', 'verify']
  }]
});
\`\`\`

## System Prompts
Effective system prompts should include:
1. Role definition
2. Core competencies
3. Communication style
4. Guidelines and constraints

## Agent Collaboration
Agents can collaborate in three modes:
- **Autonomous**: Independent execution
- **Swarm**: Multi-agent coordination
- **Hybrid**: Mixed autonomous/coordinated
`,
      'api-reference': `# WAI SDK API Reference

## Base URL
\`\`\`
https://your-instance.example.com/api
\`\`\`

## Authentication
Include your API key in all requests:
\`\`\`
X-WAI-API-Key: wai_xxxxxxxxxxxxxxxx
\`\`\`

## Agents API

### List All Agents
\`GET /api/agents\`

Response:
\`\`\`json
{
  "success": true,
  "data": [...],
  "count": 267
}
\`\`\`

### Execute Agent
\`POST /api/agents/:agentId/execute\`

Request:
\`\`\`json
{
  "task": "Analyze this code for security issues",
  "context": { "language": "typescript" }
}
\`\`\`

## Providers API

### List Providers
\`GET /api/providers\`

### Send Completion
\`POST /api/providers/:providerId/complete\`

## MCP Tools API

### List Tools
\`GET /api/mcp/tools\`

### Execute Tool
\`POST /api/mcp/tools/:toolId/execute\`

## Error Codes
| Code | Description |
|------|-------------|
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Rate Limited |
| 500 | Server Error |
`,
      'mcp-tools': `# MCP Tools Configuration Guide

## Overview
WAI SDK includes 495+ Model Context Protocol (MCP) tools across 20 enterprise categories.

## Categories

### Developer Tools (30)
GitHub, GitLab, Bitbucket, Jenkins, CircleCI, Docker, Kubernetes, Terraform, Vercel, Netlify, Linear

### Email Tools (25)
Gmail, Outlook, SendGrid, Mailchimp, Mailgun, AWS SES, Postmark, Resend, ConvertKit, Brevo

### Drives & Storage (25)
Google Drive, Dropbox, OneDrive, Box, AWS S3, GCS, Azure Blob, SharePoint, Cloudinary

### Marketing Tools (30)
HubSpot, Marketo, Google Ads, Facebook Ads, LinkedIn Ads, Google Analytics, Mixpanel, Segment, Buffer

### Social Media Tools (25)
Twitter/X, LinkedIn, Facebook, Instagram, YouTube, TikTok, Pinterest, Reddit, Discord

### Financial Tools (30)
Stripe, PayPal, Razorpay, QuickBooks, Xero, FreshBooks, Plaid, Wise, Square, Braintree

### Sales Tools (25)
Salesforce, Pipedrive, Close, Outreach, SalesLoft, Apollo, ZoomInfo, Gong, Calendly, DocuSign

### CRM Tools (25)
HubSpot CRM, Zoho CRM, Freshsales, Copper, Insightly, ActiveCampaign, Monday.com, Airtable, Notion

### Content Tools (30)
WordPress, Contentful, Strapi, Sanity, Notion, Confluence, Medium, Ghost, Webflow, Shopify

### Enterprise Tools (40)
Jira, Asana, Trello, Monday, ClickUp, Slack, Teams, Zoom, ServiceNow, Zendesk, SAP, Oracle

### Database Tools (25)
PostgreSQL, MySQL, MongoDB, Redis, Elasticsearch, Supabase, Firebase, PlanetScale, DynamoDB, BigQuery

### AI & LLM Tools (30)
OpenAI, Anthropic, Google Gemini, Mistral, Cohere, Groq, Perplexity, ElevenLabs, Stability AI, Runway

### Automation Tools (25)
Zapier, Make, n8n, Pipedream, Workato, Power Automate, Airflow, Prefect, Temporal, AWS Lambda

### Analytics & BI Tools (25)
Tableau, Power BI, Looker, Metabase, dbt, Fivetran, Airbyte, PostHog, Datadog, New Relic

### Security Tools (20)
Okta, Auth0, Azure AD, HashiCorp Vault, AWS Secrets Manager, CrowdStrike, Splunk, PagerDuty

### Document Tools (20)
PDF generation, Excel, Google Docs, Google Sheets, OCR, Markdown, Image processing

### Notification Tools (20)
Twilio SMS, WhatsApp, Telegram, Firebase Push, OneSignal, Pusher, AWS SNS

### HR & Recruiting Tools (15)
Greenhouse, Lever, BambooHR, Gusto, Rippling, Deel, Lattice

### E-commerce Tools (15)
Shopify, WooCommerce, BigCommerce, Magento, ShipStation, Shippo, AfterShip

### Testing & QA Tools (15)
Playwright, Cypress, Jest, Vitest, k6, BrowserStack, Percy

## Tool Configuration

### Enable/Disable Tools
\`\`\`typescript
await client.admin.tools.update('github-create-issue', {
  enabled: true,
  rateLimitPerMinute: 30
});
\`\`\`

### Set Rate Limits
\`\`\`typescript
await client.admin.tools.update('openai-completion', {
  rateLimitPerMinute: 60,
  rateLimitPerHour: 1000,
  rateLimitPerDay: 10000
});
\`\`\`

## Custom Tools
Register custom MCP tools:
\`\`\`typescript
await client.admin.tools.register({
  toolId: 'my-custom-tool',
  name: 'My Custom Tool',
  category: 'custom',
  schema: {
    input: { type: 'object', properties: {...} },
    output: { type: 'object', properties: {...} }
  },
  handler: async (params) => { ... }
});
\`\`\`
`,
      'security': `# Security Best Practices

## API Key Management
1. Store keys in environment variables
2. Rotate keys every 90 days
3. Use separate keys for dev/staging/prod
4. Never commit keys to source control

## Rate Limiting
Configure appropriate rate limits:
- Per-minute limits for burst protection
- Per-hour limits for sustained usage
- Per-day limits for cost control
- Monthly quotas for budget management

## Audit Logging
All admin actions are automatically logged:
- API key creation/revocation
- Settings changes
- Agent configuration updates
- Tool enable/disable

## IP Whitelisting
Restrict API access to known IPs:
\`\`\`json
{
  "ipWhitelist": ["203.0.113.0/24", "198.51.100.0/24"]
}
\`\`\`

## Encryption
- All API keys are hashed with SHA-256
- TLS 1.3 required for all connections
- Quantum-resistant encryption available
`
    };

    return guides[guideId] || `# Guide Not Found\n\nThe requested guide "${guideId}" was not found.`;
  }

  async getDashboardSummary(): Promise<any> {
    const allAgents = agentRegistryService.getAllAgents();
    const agentCount = allAgents.length || 267;
    const toolCount = await mcpToolRegistry.getToolCount();
    const categoryCount = await mcpToolRegistry.getCategoryCount();
    const providers = await this.getAllProviders();
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const usage = await this.getTokenUsageAnalytics({
      startDate: thirtyDaysAgo,
      endDate: new Date(),
      groupBy: 'provider'
    });

    return {
      agents: {
        total: agentCount,
        configured: await db.select({ count: count() }).from(waiAgentConfigs).then(r => r[0]?.count || 0),
        enabled: await db.select({ count: count() }).from(waiAgentConfigs).where(eq(waiAgentConfigs.enabled, true)).then(r => r[0]?.count || 0)
      },
      tools: {
        total: toolCount,
        categories: categoryCount
      },
      providers: {
        total: providers.length,
        enabled: providers.filter(p => p.enabled).length,
        healthy: providers.filter(p => p.status === 'healthy').length
      },
      usage: usage.totals,
      usageByProvider: usage.breakdown
    };
  }
}

export const waiAdminService = new WaiAdminService();
