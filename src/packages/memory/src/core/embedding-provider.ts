/**
 * Embedding Provider - OpenAI text-embedding-3-small
 * Generates vector embeddings for semantic search
 */

import OpenAI from 'openai';
import { EmbeddingProvider } from './types';

/**
 * OpenAI Embedding Provider
 * Uses text-embedding-3-small (1536 dimensions, fast, cost-effective)
 */
export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  private client: OpenAI;
  private model: string;
  private dimension: number;

  constructor(apiKey: string, model: string = 'text-embedding-3-small') {
    this.client = new OpenAI({ apiKey });
    this.model = model;
    this.dimension = 1536; // text-embedding-3-small dimension
  }

  /**
   * Generate embedding for text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.client.embeddings.create({
        model: this.model,
        input: text,
        encoding_format: 'float',
      });

      return response.data[0].embedding;
    } catch (error: any) {
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  /**
   * Get embedding dimension
   */
  getDimension(): number {
    return this.dimension;
  }

  /**
   * Get model name
   */
  getModel(): string {
    return this.model;
  }
}

/**
 * In-Memory Embedding Provider (for testing)
 * Generates random embeddings - NOT for production
 */
export class MockEmbeddingProvider implements EmbeddingProvider {
  private dimension: number;

  constructor(dimension: number = 1536) {
    this.dimension = dimension;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    // Generate deterministic random embedding based on text hash
    const hash = this.simpleHash(text);
    const embedding: number[] = [];
    
    for (let i = 0; i < this.dimension; i++) {
      const seed = (hash + i) * 2654435761; // Knuth's multiplicative hash
      embedding.push((Math.sin(seed) + 1) / 2); // Normalize to [0, 1]
    }

    // Normalize to unit vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / magnitude);
  }

  getDimension(): number {
    return this.dimension;
  }

  getModel(): string {
    return 'mock-embedding';
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}
