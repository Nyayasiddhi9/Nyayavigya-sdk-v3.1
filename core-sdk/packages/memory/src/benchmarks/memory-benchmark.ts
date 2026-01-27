/**
 * Memory Performance Benchmark
 * Tests 1000 operations across all memory methods (store, recall, update, delete)
 * Measures latency, throughput, and compression effectiveness
 */

import { MemoryService } from '../core/memory-service';
import { PgMemoryStorage } from '../core/memory-storage';
import { OpenAIEmbeddingProvider } from '../core/embedding-provider';
import { PgVectorStore } from '../core/vector-store';

interface BenchmarkResult {
  operation: string;
  totalOperations: number;
  totalTimeMs: number;
  avgLatencyMs: number;
  throughputOpsPerSec: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  errors: number;
}

interface CompressionStats {
  avgOriginalLength: number;
  avgCompressedLength: number;
  avgCompressionRatio: number;
  totalTokensSaved: number;
}

/**
 * Run comprehensive memory performance benchmark
 */
export async function runMemoryBenchmark(options: {
  numOperations?: number;
  enableExtraction?: boolean;
  verbose?: boolean;
}): Promise<{
  store: BenchmarkResult;
  recall: BenchmarkResult;
  update: BenchmarkResult;
  delete: BenchmarkResult;
  compression?: CompressionStats;
  overall: {
    totalOperations: number;
    totalTimeMs: number;
    avgThroughput: number;
  };
}> {
  const numOps = options.numOperations || 1000;
  const verbose = options.verbose || false;
  const enableExtraction = options.enableExtraction ?? true;

  console.log(`\n🔬 Starting Memory Performance Benchmark`);
  console.log(`📊 Total operations: ${numOps * 4} (${numOps} per method)`);
  console.log(`🧪 Extraction pipeline: ${enableExtraction ? 'ENABLED' : 'DISABLED'}`);
  console.log(`---\n`);

  // Initialize memory service
  const connectionString = process.env.DATABASE_URL || process.env.PGCONNECTIONSTRING;
  if (!connectionString) {
    throw new Error('DATABASE_URL or PGCONNECTIONSTRING environment variable is required');
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey || typeof openaiKey !== 'string' || openaiKey.trim() === '') {
    throw new Error(`OPENAI_API_KEY environment variable is required (got: ${typeof openaiKey})`);
  }

  const embeddingProvider = new OpenAIEmbeddingProvider(openaiKey, 'text-embedding-3-small');

  const vectorStore = new PgVectorStore(connectionString, 'wai_memory_vectors_benchmark', 1536);
  const storage = new PgMemoryStorage(connectionString, vectorStore, embeddingProvider, 'wai_memories_benchmark');
  const memoryService = new MemoryService(storage, {
    extraction: { enabled: enableExtraction },
  });

  // Test data
  const testMessages = [
    { role: 'user', content: 'I need help with my React application performance optimization.' },
    { role: 'assistant', content: 'To optimize React performance, consider using React.memo for expensive components, implement code splitting with React.lazy, and use the useMemo and useCallback hooks to prevent unnecessary re-renders.' },
    { role: 'user', content: 'What about state management? Should I use Redux or Context API?' },
    { role: 'assistant', content: 'For smaller applications, Context API is sufficient. For larger apps with complex state logic, Redux with Redux Toolkit is recommended. Consider using Zustand for a lighter alternative.' },
  ];

  const testQueries = [
    'React performance',
    'state management',
    'optimization techniques',
    'Redux vs Context',
    'code splitting',
  ];

  const memoryIds: string[] = [];
  const originalLengths: number[] = [];
  const compressedLengths: number[] = [];

  // Benchmark 1: STORE operations
  console.log(`1️⃣  Benchmarking STORE operations...`);
  const storeLatencies: number[] = [];
  let storeErrors = 0;
  let firstStoreError: Error | null = null;
  const storeStart = Date.now();

  for (let i = 0; i < numOps; i++) {
    const opStart = Date.now();
    try {
      const result = await memoryService.add(testMessages, {
        userId: `user-${i % 10}`,
        sessionId: `session-${i % 50}`,
        agentId: 'benchmark-agent',
        type: 'user',
        tags: ['benchmark', `batch-${Math.floor(i / 100)}`],
        priority: Math.floor(Math.random() * 100), // Integer 0-100
        useExtraction: enableExtraction,
      });

      memoryIds.push(result.id);

      // Track compression stats if extraction is enabled
      if (enableExtraction && result.metadata?.extraction) {
        originalLengths.push(result.metadata.extraction.originalLength);
        compressedLengths.push(result.metadata.extraction.compressedLength);
      }

      const opLatency = Date.now() - opStart;
      storeLatencies.push(opLatency);

      if (verbose && i % 100 === 0) {
        console.log(`  📝 Stored ${i}/${numOps} memories (${opLatency}ms)`);
      }
    } catch (error) {
      storeErrors++;
      if (!firstStoreError) firstStoreError = error as Error;
      if (verbose) console.error(`  ❌ Store error:`, error);
    }
  }
  
  if (firstStoreError && !verbose) {
    console.log(`  ⚠️  First error: ${firstStoreError.message}`);
  }

  const storeTotalTime = Date.now() - storeStart;
  const storeResult = calculateBenchmarkResult('STORE', numOps, storeTotalTime, storeLatencies, storeErrors);
  printBenchmarkResult(storeResult);

  // Small delay between operations
  await new Promise(resolve => setTimeout(resolve, 500));

  // Benchmark 2: RECALL operations
  console.log(`\n2️⃣  Benchmarking RECALL operations...`);
  const recallLatencies: number[] = [];
  let recallErrors = 0;
  let firstRecallError: Error | null = null;
  const recallStart = Date.now();

  for (let i = 0; i < numOps; i++) {
    const opStart = Date.now();
    try {
      const query = testQueries[i % testQueries.length];
      await memoryService.search(query, {
        userId: `user-${i % 10}`,
        limit: 5,
        minSimilarity: 0.7,
      });

      const opLatency = Date.now() - opStart;
      recallLatencies.push(opLatency);

      if (verbose && i % 100 === 0) {
        console.log(`  🔍 Recalled ${i}/${numOps} memories (${opLatency}ms)`);
      }
    } catch (error) {
      recallErrors++;
      if (!firstRecallError) firstRecallError = error as Error;
      if (verbose) console.error(`  ❌ Recall error:`, error);
    }
  }
  
  if (firstRecallError && !verbose) {
    console.log(`  ⚠️  First error: ${firstRecallError.message}`);
  }

  const recallTotalTime = Date.now() - recallStart;
  const recallResult = calculateBenchmarkResult('RECALL', numOps, recallTotalTime, recallLatencies, recallErrors);
  printBenchmarkResult(recallResult);

  await new Promise(resolve => setTimeout(resolve, 500));

  // Benchmark 3: UPDATE operations
  console.log(`\n3️⃣  Benchmarking UPDATE operations...`);
  const updateLatencies: number[] = [];
  let updateErrors = 0;
  let firstUpdateError: Error | null = null;
  const updateStart = Date.now();

  for (let i = 0; i < numOps; i++) {
    const opStart = Date.now();
    try {
      const memoryId = memoryIds[i % memoryIds.length];
      await memoryService.update(memoryId, {
        content: `Updated content at ${Date.now()}`,
        tags: ['benchmark', 'updated'],
        priority: Math.floor(Math.random() * 100), // Integer 0-100
      });

      const opLatency = Date.now() - opStart;
      updateLatencies.push(opLatency);

      if (verbose && i % 100 === 0) {
        console.log(`  ✏️  Updated ${i}/${numOps} memories (${opLatency}ms)`);
      }
    } catch (error) {
      updateErrors++;
      if (!firstUpdateError) firstUpdateError = error as Error;
      if (verbose) console.error(`  ❌ Update error:`, error);
    }
  }
  
  if (firstUpdateError && !verbose) {
    console.log(`  ⚠️  First error: ${firstUpdateError.message}`);
  }

  const updateTotalTime = Date.now() - updateStart;
  const updateResult = calculateBenchmarkResult('UPDATE', numOps, updateTotalTime, updateLatencies, updateErrors);
  printBenchmarkResult(updateResult);

  await new Promise(resolve => setTimeout(resolve, 500));

  // Benchmark 4: DELETE operations
  console.log(`\n4️⃣  Benchmarking DELETE operations...`);
  const deleteLatencies: number[] = [];
  let deleteErrors = 0;
  const deleteStart = Date.now();

  for (let i = 0; i < numOps; i++) {
    const opStart = Date.now();
    try {
      const memoryId = memoryIds[i % memoryIds.length];
      await memoryService.delete(memoryId);

      const opLatency = Date.now() - opStart;
      deleteLatencies.push(opLatency);

      if (verbose && i % 100 === 0) {
        console.log(`  🗑️  Deleted ${i}/${numOps} memories (${opLatency}ms)`);
      }
    } catch (error) {
      deleteErrors++;
      if (verbose) console.error(`  ❌ Delete error:`, error);
    }
  }

  const deleteTotalTime = Date.now() - deleteStart;
  const deleteResult = calculateBenchmarkResult('DELETE', numOps, deleteTotalTime, deleteLatencies, deleteErrors);
  printBenchmarkResult(deleteResult);

  // Calculate compression stats if extraction was enabled
  let compressionStats: CompressionStats | undefined;
  if (enableExtraction && originalLengths.length > 0) {
    const avgOriginal = originalLengths.reduce((a, b) => a + b, 0) / originalLengths.length;
    const avgCompressed = compressedLengths.reduce((a, b) => a + b, 0) / compressedLengths.length;
    const avgRatio = avgCompressed / avgOriginal;
    const totalSaved = originalLengths.reduce((sum, orig, i) => sum + (orig - compressedLengths[i]), 0);

    compressionStats = {
      avgOriginalLength: Math.round(avgOriginal),
      avgCompressedLength: Math.round(avgCompressed),
      avgCompressionRatio: Math.round(avgRatio * 100) / 100,
      totalTokensSaved: totalSaved,
    };

    console.log(`\n📉 Compression Statistics:`);
    console.log(`   Original: ${compressionStats.avgOriginalLength} chars avg`);
    console.log(`   Compressed: ${compressionStats.avgCompressedLength} chars avg`);
    console.log(`   Ratio: ${(compressionStats.avgCompressionRatio * 100).toFixed(1)}%`);
    console.log(`   Tokens saved: ${compressionStats.totalTokensSaved.toLocaleString()} chars total`);
  }

  // Overall stats
  const totalOps = numOps * 4;
  const totalTime = storeTotalTime + recallTotalTime + updateTotalTime + deleteTotalTime;
  const avgThroughput = (totalOps / totalTime) * 1000;

  console.log(`\n📊 Overall Benchmark Results:`);
  console.log(`   Total operations: ${totalOps.toLocaleString()}`);
  console.log(`   Total time: ${(totalTime / 1000).toFixed(2)}s`);
  console.log(`   Avg throughput: ${avgThroughput.toFixed(2)} ops/sec`);
  console.log(`   Success rate: ${(((totalOps - (storeErrors + recallErrors + updateErrors + deleteErrors)) / totalOps) * 100).toFixed(2)}%`);
  console.log(`\n✅ Benchmark complete!\n`);

  return {
    store: storeResult,
    recall: recallResult,
    update: updateResult,
    delete: deleteResult,
    compression: compressionStats,
    overall: {
      totalOperations: totalOps,
      totalTimeMs: totalTime,
      avgThroughput,
    },
  };
}

/**
 * Calculate benchmark result with percentiles
 */
function calculateBenchmarkResult(
  operation: string,
  totalOps: number,
  totalTime: number,
  latencies: number[],
  errors: number
): BenchmarkResult {
  const successfulOps = latencies.length;
  const avgLatency = latencies.reduce((a, b) => a + b, 0) / successfulOps;
  const throughput = (successfulOps / totalTime) * 1000;

  // Calculate percentiles
  const sorted = [...latencies].sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.5)] || 0;
  const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
  const p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;

  return {
    operation,
    totalOperations: totalOps,
    totalTimeMs: totalTime,
    avgLatencyMs: Math.round(avgLatency * 100) / 100,
    throughputOpsPerSec: Math.round(throughput * 100) / 100,
    p50LatencyMs: p50,
    p95LatencyMs: p95,
    p99LatencyMs: p99,
    errors,
  };
}

/**
 * Print benchmark result
 */
function printBenchmarkResult(result: BenchmarkResult): void {
  console.log(`   ⏱️  Avg latency: ${result.avgLatencyMs}ms`);
  console.log(`   📈 Throughput: ${result.throughputOpsPerSec.toFixed(2)} ops/sec`);
  console.log(`   📊 Percentiles: p50=${result.p50LatencyMs}ms | p95=${result.p95LatencyMs}ms | p99=${result.p99LatencyMs}ms`);
  console.log(`   ✅ Success: ${result.totalOperations - result.errors}/${result.totalOperations}`);
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  const args = process.argv.slice(2);
  const numOps = args[0] ? parseInt(args[0]) : 1000;
  const enableExtraction = args[1] !== 'false';
  const verbose = args.includes('--verbose');

  runMemoryBenchmark({ numOperations: numOps, enableExtraction, verbose })
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Benchmark failed:', error);
      process.exit(1);
    });
}
