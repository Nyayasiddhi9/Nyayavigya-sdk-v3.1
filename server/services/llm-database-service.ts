/**
 * LLM Database Service
 * Database-backed LLM provider management using waiLlmProvidersV9
 */

import { db } from '../db';
import { waiLlmProvidersV9, type WaiLlmProviderV9, type InsertWaiLlmProviderV9 } from '@shared/schema';
import { eq, desc, sql } from 'drizzle-orm';

export class LLMDatabaseService {
  
  async getAllProviders() {
    return await db.select().from(waiLlmProvidersV9).orderBy(desc(waiLlmProvidersV9.successCount));
  }

  async getProviderById(id: number) {
    const result = await db.select().from(waiLlmProvidersV9).where(eq(waiLlmProvidersV9.id, id));
    return result[0] || null;
  }

  async getProviderByProviderId(providerId: string) {
    const result = await db.select().from(waiLlmProvidersV9).where(eq(waiLlmProvidersV9.providerId, providerId));
    return result[0] || null;
  }

  async createProvider(provider: InsertWaiLlmProviderV9) {
    const result = await db.insert(waiLlmProvidersV9).values(provider).returning();
    return result[0];
  }

  async updateProvider(id: number, updates: Partial<InsertWaiLlmProviderV9>) {
    const result = await db
      .update(waiLlmProvidersV9)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(waiLlmProvidersV9.id, id))
      .returning();
    return result[0] || null;
  }

  async updateProviderStatus(id: number, status: string) {
    return await this.updateProvider(id, { status });
  }

  async deleteProvider(id: number) {
    const result = await db.delete(waiLlmProvidersV9).where(eq(waiLlmProvidersV9.id, id)).returning();
    return result[0] || null;
  }

  async recordSuccess(id: number) {
    await db
      .update(waiLlmProvidersV9)
      .set({
        successCount: sql`${waiLlmProvidersV9.successCount} + 1`,
        totalRequests: sql`${waiLlmProvidersV9.totalRequests} + 1`,
        updatedAt: new Date()
      })
      .where(eq(waiLlmProvidersV9.id, id));
  }

  async recordError(id: number) {
    await db
      .update(waiLlmProvidersV9)
      .set({
        errorCount: sql`${waiLlmProvidersV9.errorCount} + 1`,
        totalRequests: sql`${waiLlmProvidersV9.totalRequests} + 1`,
        updatedAt: new Date()
      })
      .where(eq(waiLlmProvidersV9.id, id));
  }

  async updateHealthCheck(id: number, metrics: any) {
    await db
      .update(waiLlmProvidersV9)
      .set({
        healthMetrics: metrics,
        lastHealthCheck: new Date(),
        updatedAt: new Date()
      })
      .where(eq(waiLlmProvidersV9.id, id));
  }

  async getUsageStats() {
    const providers = await this.getAllProviders();
    
    const totalRequests = providers.reduce((sum, p) => sum + (p.totalRequests || 0), 0);
    const totalSuccess = providers.reduce((sum, p) => sum + (p.successCount || 0), 0);
    const totalErrors = providers.reduce((sum, p) => sum + (p.errorCount || 0), 0);
    
    return {
      totalProviders: providers.length,
      activeProviders: providers.filter(p => p.status === 'active').length,
      totalRequests,
      totalSuccess,
      totalErrors,
      overallSuccessRate: totalRequests > 0 ? totalSuccess / totalRequests : 0,
      providers: providers.map(p => ({
        id: p.id,
        providerId: p.providerId,
        name: p.name,
        type: p.type,
        status: p.status,
        requests: p.totalRequests || 0,
        successRate: (p.totalRequests || 0) > 0 ? (p.successCount || 0) / (p.totalRequests || 0) : 0,
        costPerToken: p.costPerToken ? parseFloat(p.costPerToken) : 0,
        latencyMs: p.latencyMs || 0
      }))
    };
  }

  async getProvidersByType(type: string) {
    const result = await db.select().from(waiLlmProvidersV9).where(eq(waiLlmProvidersV9.type, type));
    return result;
  }

  async getActiveProviders() {
    const result = await db.select().from(waiLlmProvidersV9).where(eq(waiLlmProvidersV9.status, 'active'));
    return result;
  }
}

export const llmDatabaseService = new LLMDatabaseService();
