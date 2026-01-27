/**
 * Storage Adapter Interface
 * Provides abstraction for different storage backends (PostgreSQL, Redis, In-Memory, etc.)
 * Framework-agnostic design allows integration with any database/ORM
 */

export interface IStorageAdapter {
  /**
   * Retrieve a value by key
   * @param key - Unique identifier
   * @returns The stored value or null if not found
   */
  get<T = unknown>(key: string): Promise<T | null>;

  /**
   * Store a value with a key
   * @param key - Unique identifier
   * @param value - Data to store
   * @param options - Optional storage configuration
   */
  set<T = unknown>(
    key: string,
    value: T,
    options?: StorageOptions
  ): Promise<void>;

  /**
   * Delete a value by key
   * @param key - Unique identifier
   * @returns True if deleted, false if not found
   */
  delete(key: string): Promise<boolean>;

  /**
   * Query multiple values based on filter criteria
   * @param filter - Query filter object
   * @param options - Query options (limit, offset, sort)
   * @returns Array of matching results
   */
  query<T = unknown>(
    filter: Record<string, unknown>,
    options?: QueryOptions
  ): Promise<T[]>;

  /**
   * Check if a key exists
   * @param key - Unique identifier
   * @returns True if key exists
   */
  exists(key: string): Promise<boolean>;

  /**
   * Clear all data (use with caution!)
   * @param confirm - Must pass true to confirm
   */
  clear(confirm: boolean): Promise<void>;

  /**
   * Get multiple values by keys
   * @param keys - Array of keys
   * @returns Array of values (null for missing keys)
   */
  mget<T = unknown>(keys: string[]): Promise<(T | null)[]>;

  /**
   * Set multiple key-value pairs
   * @param entries - Array of [key, value] tuples
   */
  mset<T = unknown>(entries: [string, T][]): Promise<void>;

  /**
   * Increment a numeric value
   * @param key - Key for numeric value
   * @param amount - Amount to increment (default: 1)
   * @returns New value after increment
   */
  increment(key: string, amount?: number): Promise<number>;

  /**
   * Set expiration on a key (TTL)
   * @param key - Key to expire
   * @param ttl - Time to live in seconds
   */
  expire(key: string, ttl: number): Promise<void>;
}

export interface StorageOptions {
  /** Time to live in seconds */
  ttl?: number;
  /** Tags for categorization */
  tags?: string[];
  /** Metadata */
  metadata?: Record<string, unknown>;
}

export interface QueryOptions {
  /** Maximum number of results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
  /** Sort field and direction */
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

/**
 * In-Memory Storage Adapter (for development/testing)
 */
export class MemoryStorageAdapter implements IStorageAdapter {
  private store = new Map<string, { value: unknown; expires?: number }>();

  async get<T = unknown>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    
    if (entry.expires && Date.now() > entry.expires) {
      this.store.delete(key);
      return null;
    }
    
    return entry.value as T;
  }

  async set<T = unknown>(
    key: string,
    value: T,
    options?: StorageOptions
  ): Promise<void> {
    const entry: { value: unknown; expires?: number } = { value };
    
    if (options?.ttl) {
      entry.expires = Date.now() + options.ttl * 1000;
    }
    
    this.store.set(key, entry);
  }

  async delete(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  async query<T = unknown>(
    filter: Record<string, unknown>,
    options?: QueryOptions
  ): Promise<T[]> {
    let results: T[] = [];
    
    for (const [, entry] of this.store) {
      if (entry.expires && Date.now() > entry.expires) continue;
      
      const matches = Object.entries(filter).every(([key, value]) => {
        const obj = entry.value as Record<string, unknown>;
        return obj[key] === value;
      });
      
      if (matches) {
        results.push(entry.value as T);
      }
    }
    
    if (options?.limit) {
      const start = options.offset || 0;
      results = results.slice(start, start + options.limit);
    }
    
    return results;
  }

  async exists(key: string): Promise<boolean> {
    return this.store.has(key);
  }

  async clear(confirm: boolean): Promise<void> {
    if (!confirm) {
      throw new Error('Must confirm clear operation');
    }
    this.store.clear();
  }

  async mget<T = unknown>(keys: string[]): Promise<(T | null)[]> {
    return Promise.all(keys.map(key => this.get<T>(key)));
  }

  async mset<T = unknown>(entries: [string, T][]): Promise<void> {
    await Promise.all(
      entries.map(([key, value]) => this.set(key, value))
    );
  }

  async increment(key: string, amount = 1): Promise<number> {
    const current = await this.get<number>(key);
    const newValue = (current || 0) + amount;
    await this.set(key, newValue);
    return newValue;
  }

  async expire(key: string, ttl: number): Promise<void> {
    const entry = this.store.get(key);
    if (entry) {
      entry.expires = Date.now() + ttl * 1000;
    }
  }
}
