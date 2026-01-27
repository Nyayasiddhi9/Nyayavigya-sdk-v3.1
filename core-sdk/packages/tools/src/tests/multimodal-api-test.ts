/**
 * Multimodal API Integration Tests
 * Tests video and music generation tools with real KIE_AI_API_KEY
 * 
 * Test Coverage:
 * - Video: Veo3 (KIE AI)
 * - Music: Suno v4, Suno v4.5 (KIE AI)
 * 
 * Skipped (missing API keys):
 * - Voice: ElevenLabs (needs ELEVENLABS_API_KEY)
 * - Video: Kling, Runway (need KLING_API_KEY, RUNWAY_API_KEY)
 * - Music: Udio (needs UDIO_API_KEY)
 */

import { videoGenerationExecutor, getVideoStatusExecutor } from '../tools/multimodal/video-generation';
import { musicGenerationExecutor, getMusicStatusExecutor } from '../tools/multimodal/music-generation';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  duration?: number;
  error?: string;
  result?: any;
}

const results: TestResult[] = [];

/**
 * Test Video Generation (Veo3)
 */
async function testVeo3VideoGeneration() {
  const testName = 'Veo3 Video Generation';
  console.log(`\n🎬 Testing ${testName}...`);
  const start = Date.now();

  try {
    const result = await videoGenerationExecutor({
      provider: 'veo3',
      prompt: 'A serene ocean sunset with gentle waves and seagulls, cinematic quality, 4K',
      duration: 10, // Short duration for testing
      resolution: '1080p',
      aspectRatio: '16:9',
    });

    const duration = Date.now() - start;

    if (result.status === 'failed') {
      results.push({
        name: testName,
        status: 'fail',
        duration,
        error: result.error,
        result,
      });
      console.log(`  ❌ Failed: ${result.error}`);
    } else {
      results.push({
        name: testName,
        status: 'pass',
        duration,
        result,
      });
      console.log(`  ✅ Success (${duration}ms)`);
      console.log(`     ID: ${result.id}`);
      console.log(`     Status: ${result.status}`);
      console.log(`     Video URL: ${result.videoUrl || 'pending'}`);
    }

    return result;
  } catch (error: any) {
    const duration = Date.now() - start;
    results.push({
      name: testName,
      status: 'fail',
      duration,
      error: error.message,
    });
    console.log(`  ❌ Error: ${error.message}`);
    return null;
  }
}

/**
 * Test Music Generation (Suno v4)
 */
async function testSunoV4MusicGeneration() {
  const testName = 'Suno v4 Music Generation';
  console.log(`\n🎵 Testing ${testName}...`);
  const start = Date.now();

  try {
    const result = await musicGenerationExecutor({
      provider: 'suno-v4',
      prompt: 'Upbeat electronic dance music with tropical vibes, energetic and fun',
      duration: 30, // Short duration for testing
      genre: 'electronic',
      mood: 'energetic',
      instrumentalOnly: true,
    });

    const duration = Date.now() - start;

    if (result.status === 'failed') {
      results.push({
        name: testName,
        status: 'fail',
        duration,
        error: result.error,
        result,
      });
      console.log(`  ❌ Failed: ${result.error}`);
    } else {
      results.push({
        name: testName,
        status: 'pass',
        duration,
        result,
      });
      console.log(`  ✅ Success (${duration}ms)`);
      console.log(`     ID: ${result.id}`);
      console.log(`     Status: ${result.status}`);
      console.log(`     Audio URL: ${result.audioUrl || 'pending'}`);
    }

    return result;
  } catch (error: any) {
    const duration = Date.now() - start;
    results.push({
      name: testName,
      status: 'fail',
      duration,
      error: error.message,
    });
    console.log(`  ❌ Error: ${error.message}`);
    return null;
  }
}

/**
 * Test Music Generation (Suno v4.5)
 */
async function testSunoV45MusicGeneration() {
  const testName = 'Suno v4.5 Music Generation (Premium)';
  console.log(`\n🎵 Testing ${testName}...`);
  const start = Date.now();

  try {
    const result = await musicGenerationExecutor({
      provider: 'suno-v4.5',
      prompt: 'Calm ambient piano with soft strings, perfect for meditation and relaxation',
      duration: 60, // Short duration for testing
      genre: 'ambient',
      mood: 'calm',
      instrumentalOnly: true,
    });

    const duration = Date.now() - start;

    if (result.status === 'failed') {
      results.push({
        name: testName,
        status: 'fail',
        duration,
        error: result.error,
        result,
      });
      console.log(`  ❌ Failed: ${result.error}`);
    } else {
      results.push({
        name: testName,
        status: 'pass',
        duration,
        result,
      });
      console.log(`  ✅ Success (${duration}ms)`);
      console.log(`     ID: ${result.id}`);
      console.log(`     Status: ${result.status}`);
      console.log(`     Audio URL: ${result.audioUrl || 'pending'}`);
    }

    return result;
  } catch (error: any) {
    const duration = Date.now() - start;
    results.push({
      name: testName,
      status: 'fail',
      duration,
      error: error.message,
    });
    console.log(`  ❌ Error: ${error.message}`);
    return null;
  }
}

/**
 * Test Video Status Check
 */
async function testVideoStatusCheck(videoId: string) {
  const testName = 'Video Status Check';
  console.log(`\n🔍 Testing ${testName}...`);
  const start = Date.now();

  try {
    const result = await getVideoStatusExecutor({
      provider: 'veo3',
      videoId,
    });

    const duration = Date.now() - start;

    if (result.status === 'failed') {
      results.push({
        name: testName,
        status: 'fail',
        duration,
        error: result.error,
        result,
      });
      console.log(`  ❌ Failed: ${result.error}`);
    } else {
      results.push({
        name: testName,
        status: 'pass',
        duration,
        result,
      });
      console.log(`  ✅ Success (${duration}ms)`);
      console.log(`     Status: ${result.status}`);
      console.log(`     Video URL: ${result.videoUrl || 'pending'}`);
    }

    return result;
  } catch (error: any) {
    const duration = Date.now() - start;
    results.push({
      name: testName,
      status: 'fail',
      duration,
      error: error.message,
    });
    console.log(`  ❌ Error: ${error.message}`);
    return null;
  }
}

/**
 * Test Music Status Check
 */
async function testMusicStatusCheck(musicId: string, provider: 'suno-v4' | 'suno-v4.5' | 'udio') {
  const testName = `Music Status Check (${provider})`;
  console.log(`\n🔍 Testing ${testName}...`);
  const start = Date.now();

  try {
    const result = await getMusicStatusExecutor({
      provider,
      musicId,
    });

    const duration = Date.now() - start;

    if (result.status === 'failed') {
      results.push({
        name: testName,
        status: 'fail',
        duration,
        error: result.error,
        result,
      });
      console.log(`  ❌ Failed: ${result.error}`);
    } else {
      results.push({
        name: testName,
        status: 'pass',
        duration,
        result,
      });
      console.log(`  ✅ Success (${duration}ms)`);
      console.log(`     Status: ${result.status}`);
      console.log(`     Audio URL: ${result.audioUrl || 'pending'}`);
    }

    return result;
  } catch (error: any) {
    const duration = Date.now() - start;
    results.push({
      name: testName,
      status: 'fail',
      duration,
      error: error.message,
    });
    console.log(`  ❌ Error: ${error.message}`);
    return null;
  }
}

/**
 * Print Test Summary
 */
function printSummary() {
  console.log('\n\n📊 Test Summary');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const skipped = results.filter(r => r.status === 'skip').length;
  const total = results.length;

  console.log(`\nTotal Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`\nSuccess Rate: ${((passed / total) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n\n❌ Failed Tests:');
    results.filter(r => r.status === 'fail').forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
  }

  console.log('\n\n📋 Detailed Results:');
  results.forEach(r => {
    const icon = r.status === 'pass' ? '✅' : r.status === 'fail' ? '❌' : '⏭️';
    console.log(`\n${icon} ${r.name}`);
    console.log(`   Duration: ${r.duration || 'N/A'}ms`);
    if (r.error) {
      console.log(`   Error: ${r.error}`);
    }
    if (r.result) {
      console.log(`   Result: ${JSON.stringify(r.result, null, 2)}`);
    }
  });

  console.log('\n\n');
}

/**
 * Main Test Runner
 */
async function runTests() {
  console.log('🚀 Starting Multimodal API Integration Tests\n');
  console.log('Testing with KIE_AI_API_KEY...\n');
  console.log('='.repeat(60));

  // Validate API key
  if (!process.env.KIE_AI_API_KEY) {
    console.error('\n❌ ERROR: KIE_AI_API_KEY environment variable is required');
    console.error('   Please set the API key before running tests.\n');
    process.exit(1);
  }

  try {
    // Test 1: Veo3 Video Generation
    const videoResult = await testVeo3VideoGeneration();

    // Test 2: Suno v4 Music Generation
    const musicV4Result = await testSunoV4MusicGeneration();

    // Test 3: Suno v4.5 Music Generation
    const musicV45Result = await testSunoV45MusicGeneration();

    // Test 4: Video Status Check (if video was created)
    if (videoResult && videoResult.id && !videoResult.id.startsWith('error-')) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s
      await testVideoStatusCheck(videoResult.id);
    }

    // Test 5: Music Status Check v4 (if music was created)
    if (musicV4Result && musicV4Result.id && !musicV4Result.id.startsWith('error-')) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s
      await testMusicStatusCheck(musicV4Result.id, 'suno-v4');
    }

    // Test 6: Music Status Check v4.5 (if music was created)
    if (musicV45Result && musicV45Result.id && !musicV45Result.id.startsWith('error-')) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s
      await testMusicStatusCheck(musicV45Result.id, 'suno-v4.5');
    }

    // Print summary
    printSummary();

    // Exit with appropriate code
    const failed = results.filter(r => r.status === 'fail').length;
    process.exit(failed > 0 ? 1 : 0);
  } catch (error: any) {
    console.error('\n\n❌ Fatal Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
runTests();
