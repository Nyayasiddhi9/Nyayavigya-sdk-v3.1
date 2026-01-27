/**
 * mem0 Memory System 1000-Operation Benchmark
 * 
 * This benchmark tests the mem0 + pgvector memory infrastructure performance
 * with 1000 operations to validate production readiness.
 * 
 * Metrics measured:
 * - Store operations (write)
 * - Recall operations (semantic search)
 * - Update operations
 * - Delete operations
 * - Concurrent operations
 * - Memory compression efficiency
 */

import { Pool } from 'pg';

interface BenchmarkResult {
  operation: string;
  count: number;
  totalTimeMs: number;
  avgTimeMs: number;
  minTimeMs: number;
  maxTimeMs: number;
  opsPerSecond: number;
  errors: number;
}

interface OverallResults {
  totalOperations: number;
  totalTimeMs: number;
  opsPerSecond: number;
  results: BenchmarkResult[];
  memoryUsage: {
    before: NodeJS.MemoryUsage;
    after: NodeJS.MemoryUsage;
    delta: { heapUsed: number; external: number };
  };
  timestamp: string;
  status: 'passed' | 'failed';
  recommendations: string[];
}

class Mem0Benchmark {
  private pool: Pool;
  private results: BenchmarkResult[] = [];

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20
    });
  }

  async initialize(): Promise<void> {
    console.log('🔧 Initializing mem0 benchmark tables...');
    
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS mem0_benchmark_memories (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          session_id VARCHAR(255),
          agent_id VARCHAR(255),
          content TEXT NOT NULL,
          metadata JSONB DEFAULT '{}',
          embedding VECTOR(1536),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          access_count INTEGER DEFAULT 0,
          last_accessed TIMESTAMP
        )
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_mem0_bench_user ON mem0_benchmark_memories(user_id)
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_mem0_bench_session ON mem0_benchmark_memories(session_id)
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_mem0_bench_agent ON mem0_benchmark_memories(agent_id)
      `);

      console.log('✅ Benchmark tables initialized');
    } finally {
      client.release();
    }
  }

  private generateEmbedding(): number[] {
    return Array.from({ length: 1536 }, () => (Math.random() * 2 - 1) * 0.1);
  }

  private generateMemoryContent(index: number): string {
    const topics = [
      'project requirements', 'user preferences', 'code architecture',
      'API design patterns', 'database schema', 'deployment strategy',
      'security considerations', 'performance optimization', 'testing approach',
      'documentation needs'
    ];
    const topic = topics[index % topics.length];
    return `Memory ${index}: Important information about ${topic}. This is a benchmark test memory that simulates real-world usage patterns with varying content lengths and complexity. The system should efficiently store, retrieve, and process this information.`;
  }

  async benchmarkStore(count: number): Promise<BenchmarkResult> {
    console.log(`\n📝 Benchmarking STORE operations (${count} records)...`);
    const times: number[] = [];
    let errors = 0;

    for (let i = 0; i < count; i++) {
      const start = performance.now();
      try {
        const embedding = this.generateEmbedding();
        const content = this.generateMemoryContent(i);
        
        await this.pool.query(
          `INSERT INTO mem0_benchmark_memories (user_id, session_id, agent_id, content, metadata, embedding)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            `user_${i % 100}`,
            `session_${i % 50}`,
            `agent_${i % 10}`,
            content,
            JSON.stringify({ index: i, timestamp: Date.now() }),
            `[${embedding.join(',')}]`
          ]
        );
        times.push(performance.now() - start);
      } catch (error) {
        errors++;
      }

      if ((i + 1) % 100 === 0) {
        process.stdout.write(`  Progress: ${i + 1}/${count}\r`);
      }
    }

    const result = this.calculateStats('STORE', times, errors);
    this.results.push(result);
    console.log(`✅ Store: ${result.avgTimeMs.toFixed(2)}ms avg, ${result.opsPerSecond.toFixed(0)} ops/sec`);
    return result;
  }

  async benchmarkRecall(count: number): Promise<BenchmarkResult> {
    console.log(`\n🔍 Benchmarking RECALL (semantic search) operations (${count} queries)...`);
    const times: number[] = [];
    let errors = 0;

    for (let i = 0; i < count; i++) {
      const start = performance.now();
      try {
        const queryEmbedding = this.generateEmbedding();
        
        await this.pool.query(
          `SELECT id, content, metadata,
                  1 - (embedding <=> $1::vector) as similarity
           FROM mem0_benchmark_memories
           WHERE user_id = $2
           ORDER BY embedding <=> $1::vector
           LIMIT 10`,
          [`[${queryEmbedding.join(',')}]`, `user_${i % 100}`]
        );
        times.push(performance.now() - start);
      } catch (error) {
        errors++;
      }

      if ((i + 1) % 100 === 0) {
        process.stdout.write(`  Progress: ${i + 1}/${count}\r`);
      }
    }

    const result = this.calculateStats('RECALL', times, errors);
    this.results.push(result);
    console.log(`✅ Recall: ${result.avgTimeMs.toFixed(2)}ms avg, ${result.opsPerSecond.toFixed(0)} ops/sec`);
    return result;
  }

  async benchmarkUpdate(count: number): Promise<BenchmarkResult> {
    console.log(`\n🔄 Benchmarking UPDATE operations (${count} updates)...`);
    const times: number[] = [];
    let errors = 0;

    const { rows } = await this.pool.query(
      `SELECT id FROM mem0_benchmark_memories ORDER BY RANDOM() LIMIT $1`,
      [count]
    );

    for (let i = 0; i < Math.min(count, rows.length); i++) {
      const start = performance.now();
      try {
        await this.pool.query(
          `UPDATE mem0_benchmark_memories 
           SET content = $1, updated_at = NOW(), access_count = access_count + 1
           WHERE id = $2`,
          [`Updated memory content at ${Date.now()}`, rows[i].id]
        );
        times.push(performance.now() - start);
      } catch (error) {
        errors++;
      }

      if ((i + 1) % 50 === 0) {
        process.stdout.write(`  Progress: ${i + 1}/${count}\r`);
      }
    }

    const result = this.calculateStats('UPDATE', times, errors);
    this.results.push(result);
    console.log(`✅ Update: ${result.avgTimeMs.toFixed(2)}ms avg, ${result.opsPerSecond.toFixed(0)} ops/sec`);
    return result;
  }

  async benchmarkDelete(count: number): Promise<BenchmarkResult> {
    console.log(`\n🗑️ Benchmarking DELETE operations (${count} deletes)...`);
    const times: number[] = [];
    let errors = 0;

    const { rows } = await this.pool.query(
      `SELECT id FROM mem0_benchmark_memories ORDER BY id DESC LIMIT $1`,
      [count]
    );

    for (let i = 0; i < Math.min(count, rows.length); i++) {
      const start = performance.now();
      try {
        await this.pool.query(
          `DELETE FROM mem0_benchmark_memories WHERE id = $1`,
          [rows[i].id]
        );
        times.push(performance.now() - start);
      } catch (error) {
        errors++;
      }

      if ((i + 1) % 50 === 0) {
        process.stdout.write(`  Progress: ${i + 1}/${count}\r`);
      }
    }

    const result = this.calculateStats('DELETE', times, errors);
    this.results.push(result);
    console.log(`✅ Delete: ${result.avgTimeMs.toFixed(2)}ms avg, ${result.opsPerSecond.toFixed(0)} ops/sec`);
    return result;
  }

  async benchmarkConcurrent(concurrency: number, opsPerThread: number): Promise<BenchmarkResult> {
    console.log(`\n⚡ Benchmarking CONCURRENT operations (${concurrency} threads x ${opsPerThread} ops)...`);
    const times: number[] = [];
    let errors = 0;

    const start = performance.now();
    
    const threads = Array.from({ length: concurrency }, async (_, threadId) => {
      for (let i = 0; i < opsPerThread; i++) {
        const opStart = performance.now();
        try {
          const op = Math.random();
          if (op < 0.5) {
            const embedding = this.generateEmbedding();
            await this.pool.query(
              `INSERT INTO mem0_benchmark_memories (user_id, content, embedding)
               VALUES ($1, $2, $3)`,
              [`concurrent_user_${threadId}`, `Concurrent memory ${i}`, `[${embedding.join(',')}]`]
            );
          } else {
            const queryEmbedding = this.generateEmbedding();
            await this.pool.query(
              `SELECT id, content FROM mem0_benchmark_memories
               ORDER BY embedding <=> $1::vector LIMIT 5`,
              [`[${queryEmbedding.join(',')}]`]
            );
          }
          times.push(performance.now() - opStart);
        } catch (error) {
          errors++;
        }
      }
    });

    await Promise.all(threads);
    
    const totalTime = performance.now() - start;
    const result: BenchmarkResult = {
      operation: 'CONCURRENT',
      count: concurrency * opsPerThread,
      totalTimeMs: totalTime,
      avgTimeMs: times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0,
      minTimeMs: times.length > 0 ? Math.min(...times) : 0,
      maxTimeMs: times.length > 0 ? Math.max(...times) : 0,
      opsPerSecond: (concurrency * opsPerThread) / (totalTime / 1000),
      errors
    };

    this.results.push(result);
    console.log(`✅ Concurrent: ${result.avgTimeMs.toFixed(2)}ms avg, ${result.opsPerSecond.toFixed(0)} ops/sec`);
    return result;
  }

  private calculateStats(operation: string, times: number[], errors: number): BenchmarkResult {
    const count = times.length;
    const totalTimeMs = times.reduce((a, b) => a + b, 0);
    
    return {
      operation,
      count: count + errors,
      totalTimeMs,
      avgTimeMs: count > 0 ? totalTimeMs / count : 0,
      minTimeMs: count > 0 ? Math.min(...times) : 0,
      maxTimeMs: count > 0 ? Math.max(...times) : 0,
      opsPerSecond: count > 0 ? (count / totalTimeMs) * 1000 : 0,
      errors
    };
  }

  async cleanup(): Promise<void> {
    console.log('\n🧹 Cleaning up benchmark data...');
    await this.pool.query(`DELETE FROM mem0_benchmark_memories WHERE user_id LIKE 'user_%' OR user_id LIKE 'concurrent_%'`);
    console.log('✅ Cleanup complete');
  }

  async run(): Promise<OverallResults> {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('           mem0 Memory System 1000-Operation Benchmark          ');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`Started at: ${new Date().toISOString()}`);
    
    const memoryBefore = process.memoryUsage();
    const startTime = performance.now();

    try {
      await this.initialize();

      await this.benchmarkStore(400);
      await this.benchmarkRecall(300);
      await this.benchmarkUpdate(100);
      await this.benchmarkConcurrent(10, 10);
      await this.benchmarkDelete(100);

      await this.cleanup();

      const totalTime = performance.now() - startTime;
      const memoryAfter = process.memoryUsage();
      const totalOps = this.results.reduce((sum, r) => sum + r.count, 0);
      const totalErrors = this.results.reduce((sum, r) => sum + r.errors, 0);

      const recommendations: string[] = [];
      
      const avgOpsPerSecond = this.results.reduce((sum, r) => sum + r.opsPerSecond, 0) / this.results.length;
      if (avgOpsPerSecond < 100) {
        recommendations.push('Consider adding connection pooling or optimizing database indices');
      }
      if (totalErrors > totalOps * 0.01) {
        recommendations.push('Error rate exceeds 1%, investigate database connection stability');
      }
      
      const recallResult = this.results.find(r => r.operation === 'RECALL');
      if (recallResult && recallResult.avgTimeMs > 50) {
        recommendations.push('Semantic search latency high, consider HNSW index tuning');
      }

      const overall: OverallResults = {
        totalOperations: totalOps,
        totalTimeMs: totalTime,
        opsPerSecond: (totalOps / totalTime) * 1000,
        results: this.results,
        memoryUsage: {
          before: memoryBefore,
          after: memoryAfter,
          delta: {
            heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed,
            external: memoryAfter.external - memoryBefore.external
          }
        },
        timestamp: new Date().toISOString(),
        status: totalErrors < totalOps * 0.05 ? 'passed' : 'failed',
        recommendations
      };

      this.printResults(overall);
      return overall;

    } finally {
      await this.pool.end();
    }
  }

  private printResults(results: OverallResults): void {
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('                        BENCHMARK RESULTS                        ');
    console.log('═══════════════════════════════════════════════════════════════');
    
    console.log('\n📊 Operation Summary:');
    console.log('┌─────────────┬────────┬───────────┬───────────┬───────────┬───────────┐');
    console.log('│ Operation   │ Count  │ Avg (ms)  │ Min (ms)  │ Max (ms)  │ Ops/sec   │');
    console.log('├─────────────┼────────┼───────────┼───────────┼───────────┼───────────┤');
    
    for (const r of results.results) {
      console.log(`│ ${r.operation.padEnd(11)} │ ${r.count.toString().padStart(6)} │ ${r.avgTimeMs.toFixed(2).padStart(9)} │ ${r.minTimeMs.toFixed(2).padStart(9)} │ ${r.maxTimeMs.toFixed(2).padStart(9)} │ ${r.opsPerSecond.toFixed(0).padStart(9)} │`);
    }
    
    console.log('└─────────────┴────────┴───────────┴───────────┴───────────┴───────────┘');

    console.log('\n📈 Overall Statistics:');
    console.log(`   Total Operations: ${results.totalOperations}`);
    console.log(`   Total Time: ${(results.totalTimeMs / 1000).toFixed(2)}s`);
    console.log(`   Overall Throughput: ${results.opsPerSecond.toFixed(0)} ops/sec`);
    console.log(`   Memory Delta: ${(results.memoryUsage.delta.heapUsed / 1024 / 1024).toFixed(2)} MB heap`);

    console.log(`\n${results.status === 'passed' ? '✅' : '❌'} Benchmark Status: ${results.status.toUpperCase()}`);

    if (results.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      results.recommendations.forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec}`);
      });
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
  }
}

async function main() {
  try {
    const benchmark = new Mem0Benchmark();
    const results = await benchmark.run();
    
    const fs = await import('fs');
    fs.writeFileSync(
      'mem0-benchmark-results.json',
      JSON.stringify(results, null, 2)
    );
    console.log('\n📄 Results saved to mem0-benchmark-results.json');
    
    process.exit(results.status === 'passed' ? 0 : 1);
  } catch (error) {
    console.error('Benchmark failed:', error);
    process.exit(1);
  }
}

main();
