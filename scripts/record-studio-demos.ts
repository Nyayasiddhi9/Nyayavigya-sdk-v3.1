import { chromium, Browser, Page } from 'playwright';
import fs from 'fs';

interface RecordingConfig {
  studioPath: string;
  duration: number;
  demoWorkflow?: string;
  outputName: string;
}

async function recordStudioDemo(
  browser: Browser,
  config: RecordingConfig,
  outputPath: string
): Promise<string> {
  const context = await browser.newContext({
    recordVideo: {
      dir: 'video-assets/recordings/',
      size: { width: 1920, height: 1080 },
    },
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();

  try {
    // Navigate to studio
    console.log(`📹 Recording ${config.studioPath}...`);
    await page.goto(`http://localhost:5000${config.studioPath}`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Wait for initial render
    await page.waitForTimeout(2000);

    // Trigger demo workflow if specified
    if (config.demoWorkflow) {
      const demoButton = page.locator(`[data-testid="button-${config.demoWorkflow}"]`);
      
      if (await demoButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await demoButton.click();
        
        // Wait for AG-UI streaming to start
        await page.waitForSelector('[data-testid="agui-panel"]', { 
          timeout: 10000,
        }).catch(() => {
          console.log('⚠️  AG-UI panel not found, recording studio interface only');
        });
        
        // Record for exact duration from config
        await page.waitForTimeout(config.duration * 1000);
      } else {
        console.log(`⚠️  Button ${config.demoWorkflow} not found, recording interface`);
        await page.waitForTimeout(config.duration * 1000);
      }
    } else {
      // Just record the studio interface
      await page.waitForTimeout(config.duration * 1000);
    }

    console.log(`✅ Recorded: ${config.studioPath}`);
    
    // Get video object BEFORE closing context
    const video = page.video();
    if (!video) {
      throw new Error(`No video recorder found for ${config.studioPath}`);
    }
    
    // Close context to finalize the video file
    await context.close();
    
    // Now get the finalized video path
    const videoPath = await video.path();
    
    if (!videoPath) {
      throw new Error(`Failed to get video path for ${config.studioPath}`);
    }
    
    return videoPath;
  } catch (error) {
    console.error(`❌ Error recording ${config.studioPath}:`, error);
    await context.close().catch(() => {}); // Clean up on error
    throw error;
  }
}

async function recordAllStudios(): Promise<string[]> {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100, // Slower for better capture
  });

  // CRITICAL: Durations must match VideoScriptGenerator exactly (30, 40, 35, 40, 35)
  const recordings: RecordingConfig[] = [
    {
      studioPath: '/studios/ideation-lab',
      duration: 30,
      demoWorkflow: 'refine-concept',
      outputName: 'scene-1-ideation-lab',
    },
    {
      studioPath: '/studios/engineering-forge',
      duration: 40,
      demoWorkflow: 'generate-app',
      outputName: 'scene-2-engineering-forge',
    },
    {
      studioPath: '/studios/market-intelligence',
      duration: 35,
      demoWorkflow: 'analyze-competitors',
      outputName: 'scene-3-market-intelligence',
    },
    {
      studioPath: '/studios/product-blueprint',
      duration: 40,
      demoWorkflow: 'create-prd',
      outputName: 'scene-4-product-blueprint',
    },
    {
      studioPath: '/studios/experience-design',
      duration: 35,
      demoWorkflow: 'generate-mockups',
      outputName: 'scene-5-experience-design',
    },
  ];

  const orderedVideoPaths: string[] = [];

  for (const config of recordings) {
    const playwrightVideoPath = await recordStudioDemo(
      browser, 
      config, 
      `video-assets/recordings/${config.outputName}.webm`
    );
    
    // Validate we got a video path
    if (!playwrightVideoPath) {
      throw new Error(`Recording failed for ${config.studioPath} - no video path returned`);
    }
    
    // Rename Playwright's hashed filename to predictable name
    const targetPath = `video-assets/recordings/${config.outputName}.webm`;
    
    // Verify source file exists before renaming
    if (!fs.existsSync(playwrightVideoPath)) {
      throw new Error(`Video file not found at ${playwrightVideoPath}`);
    }
    
    fs.renameSync(playwrightVideoPath, targetPath);
    orderedVideoPaths.push(targetPath);
    console.log(`📁 Renamed to: ${targetPath}`);
  }

  await browser.close();
  
  // Final validation
  if (orderedVideoPaths.length !== recordings.length) {
    throw new Error(
      `Recording count mismatch: expected ${recordings.length}, got ${orderedVideoPaths.length}`
    );
  }
  
  console.log('\n✅ All studio demos recorded!');
  console.log(`📁 ${orderedVideoPaths.length} videos saved in order`);
  
  return orderedVideoPaths;
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  recordAllStudios().catch(console.error);
}

export { recordAllStudios };
