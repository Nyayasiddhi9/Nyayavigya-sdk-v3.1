/**
 * @wai/admin - Admin Console Package
 * 
 * Complete administration for WAI SDK:
 * - Agent configuration management
 * - LLM provider management
 * - MCP tools administration
 * - Settings and feature flags
 * - API gateway management
 * - Token usage analytics
 */

export * from './admin-service';
export * from './agent-config-manager';
export * from './llm-provider-manager';
export * from './mcp-tools-admin';
export * from './settings-manager';
export * from './api-gateway';

export const ADMIN_PACKAGE_VERSION = '1.0.0';
