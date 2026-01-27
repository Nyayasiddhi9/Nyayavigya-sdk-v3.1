import { z } from 'zod';
import { createInsertSchema } from 'drizzle-zod';
import { WAIOrchestrationCoreV9 } from '../orchestration/wai-orchestration-core-v9';
import { WAIRequestBuilder } from '../builders/wai-request-builder';
import path from 'path';
import fs from 'fs/promises';
import { chromium, Browser, Page, BrowserContext } from 'playwright';
import sharp from 'sharp';

// ================================================================================================
// TYPES & SCHEMAS
// ================================================================================================

/**
 * Visual test configuration
 */
export const visualTestConfigSchema = z.object({
  testName: z.string().min(1).max(200),
  url: z.string().url(),
  viewports: z.array(z.object({
    width: z.number().min(320).max(3840),
    height: z.number().min(240).max(2160),
    name: z.string()
  })).min(1).default([{ width: 1280, height: 720, name: 'desktop' }]),
  selectors: z.array(z.string()).optional(),
  fullPage: z.boolean().default(true),
  threshold: z.number().min(0).max(1).default(0.1), // 10% diff threshold
  waitForSelector: z.string().optional(),
  waitForTimeout: z.number().min(0).max(30000).default(3000)
});

export type VisualTestConfig = z.infer<typeof visualTestConfigSchema>;

/**
 * Visual test result
 */
export interface VisualTestResult {
  success: boolean;
  testName: string;
  screenshots: ScreenshotResult[];
  totalDiffPercentage?: number;
  passed: boolean;
  message: string;
  error?: string;
  executionTime: number;
}

/**
 * Individual screenshot result
 */
export interface ScreenshotResult {
  viewport: string;
  selector?: string;
  screenshotPath: string;
  baselinePath?: string;
  diffPath?: string;
  diffPercentage?: number;
  passed: boolean;
}

/**
 * Test generation request
 */
export const testGenerationRequestSchema = z.object({
  description: z.string().min(1).max(1000),
  url: z.string().url(),
  testType: z.enum(['visual', 'functional', 'accessibility']).default('visual')
});

export type TestGenerationRequest = z.infer<typeof testGenerationRequestSchema>;

// ================================================================================================
// VISUAL TESTING SERVICE
// ================================================================================================

export class VisualTestingService {
  private waiCore: WAIOrchestrationCoreV9;
  private screenshotsDir: string;
  private baselinesDir: string;
  private diffsDir: string;

  constructor() {
    this.waiCore = new WAIOrchestrationCoreV9();
    
    // Setup directories
    const baseDir = path.join(process.cwd(), 'test-results', 'visual');
    this.screenshotsDir = path.join(baseDir, 'screenshots');
    this.baselinesDir = path.join(baseDir, 'baselines');
    this.diffsDir = path.join(baseDir, 'diffs');
  }

  /**
   * Initialize directories for screenshots
   */
  private async ensureDirectories(): Promise<void> {
    await fs.mkdir(this.screenshotsDir, { recursive: true });
    await fs.mkdir(this.baselinesDir, { recursive: true });
    await fs.mkdir(this.diffsDir, { recursive: true });
  }

  /**
   * Run visual regression test
   */
  async runVisualTest(config: VisualTestConfig): Promise<VisualTestResult> {
    const startTime = Date.now();
    let browser: Browser | null = null;

    try {
      // Validate config
      const validated = visualTestConfigSchema.parse(config);
      
      // Ensure directories exist
      await this.ensureDirectories();

      // Launch browser
      browser = await chromium.launch({ headless: true });
      
      const screenshots: ScreenshotResult[] = [];
      let totalDiffPercentage = 0;
      let hasDiffs = false;

      // Test each viewport
      for (const viewport of validated.viewports) {
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height }
        });

        const page = await context.newPage();

        try {
          // Navigate to URL
          await page.goto(validated.url, { waitUntil: 'networkidle' });

          // Wait for selector if specified
          if (validated.waitForSelector) {
            await page.waitForSelector(validated.waitForSelector, {
              timeout: validated.waitForTimeout
            });
          } else {
            await page.waitForTimeout(validated.waitForTimeout);
          }

          // Take screenshots
          if (validated.selectors && validated.selectors.length > 0) {
            // Screenshot specific elements
            for (const selector of validated.selectors) {
              const result = await this.captureElementScreenshot(
                page,
                selector,
                validated.testName,
                viewport.name,
                validated.threshold
              );
              screenshots.push(result);
              
              if (result.diffPercentage !== undefined) {
                totalDiffPercentage += result.diffPercentage;
                if (!result.passed) hasDiffs = true;
              }
            }
          } else {
            // Full page screenshot
            const result = await this.capturePageScreenshot(
              page,
              validated.testName,
              viewport.name,
              validated.fullPage,
              validated.threshold
            );
            screenshots.push(result);
            
            if (result.diffPercentage !== undefined) {
              totalDiffPercentage += result.diffPercentage;
              if (!result.passed) hasDiffs = true;
            }
          }

        } finally {
          await context.close();
        }
      }

      const avgDiffPercentage = screenshots.length > 0 
        ? totalDiffPercentage / screenshots.length 
        : 0;

      const passed = !hasDiffs;
      
      return {
        success: true,
        testName: validated.testName,
        screenshots,
        totalDiffPercentage: avgDiffPercentage,
        passed,
        message: passed 
          ? `Visual test passed - average diff: ${avgDiffPercentage.toFixed(2)}%`
          : `Visual test failed - average diff: ${avgDiffPercentage.toFixed(2)}% exceeds threshold`,
        executionTime: Date.now() - startTime
      };

    } catch (error) {
      return {
        success: false,
        testName: config.testName,
        screenshots: [],
        passed: false,
        message: 'Visual test failed with error',
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime
      };
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Capture full page screenshot
   */
  private async capturePageScreenshot(
    page: Page,
    testName: string,
    viewport: string,
    fullPage: boolean,
    threshold: number
  ): Promise<ScreenshotResult> {
    const timestamp = Date.now();
    const filename = `${testName}-${viewport}-page-${timestamp}.png`;
    const screenshotPath = path.join(this.screenshotsDir, filename);

    // Capture screenshot
    await page.screenshot({ 
      path: screenshotPath, 
      fullPage 
    });

    // Check for baseline
    const baselineFilename = `${testName}-${viewport}-page-baseline.png`;
    const baselinePath = path.join(this.baselinesDir, baselineFilename);

    try {
      await fs.access(baselinePath);
      
      // Baseline exists - compare
      const diffResult = await this.compareScreenshots(
        baselinePath,
        screenshotPath,
        testName,
        viewport,
        threshold
      );

      return {
        viewport,
        screenshotPath,
        baselinePath,
        diffPath: diffResult.diffPath,
        diffPercentage: diffResult.diffPercentage,
        passed: diffResult.passed
      };

    } catch {
      // No baseline - create one
      await fs.copyFile(screenshotPath, baselinePath);
      
      return {
        viewport,
        screenshotPath,
        baselinePath,
        diffPercentage: 0,
        passed: true
      };
    }
  }

  /**
   * Capture element screenshot
   */
  private async captureElementScreenshot(
    page: Page,
    selector: string,
    testName: string,
    viewport: string,
    threshold: number
  ): Promise<ScreenshotResult> {
    const timestamp = Date.now();
    const selectorName = selector.replace(/[^a-zA-Z0-9]/g, '-');
    const filename = `${testName}-${viewport}-${selectorName}-${timestamp}.png`;
    const screenshotPath = path.join(this.screenshotsDir, filename);

    // Wait for element and capture
    const element = await page.waitForSelector(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }

    await element.screenshot({ path: screenshotPath });

    // Check for baseline
    const baselineFilename = `${testName}-${viewport}-${selectorName}-baseline.png`;
    const baselinePath = path.join(this.baselinesDir, baselineFilename);

    try {
      await fs.access(baselinePath);
      
      // Baseline exists - compare
      const diffResult = await this.compareScreenshots(
        baselinePath,
        screenshotPath,
        testName,
        viewport,
        threshold
      );

      return {
        viewport,
        selector,
        screenshotPath,
        baselinePath,
        diffPath: diffResult.diffPath,
        diffPercentage: diffResult.diffPercentage,
        passed: diffResult.passed
      };

    } catch {
      // No baseline - create one
      await fs.copyFile(screenshotPath, baselinePath);
      
      return {
        viewport,
        selector,
        screenshotPath,
        baselinePath,
        diffPercentage: 0,
        passed: true
      };
    }
  }

  /**
   * Compare two screenshots using pixel diff
   */
  private async compareScreenshots(
    baselinePath: string,
    currentPath: string,
    testName: string,
    viewport: string,
    threshold: number
  ): Promise<{ diffPath: string; diffPercentage: number; passed: boolean }> {
    try {
      // Load both images
      const baseline = await sharp(baselinePath).raw().toBuffer({ resolveWithObject: true });
      const current = await sharp(currentPath).raw().toBuffer({ resolveWithObject: true });

      // Ensure same dimensions
      if (baseline.info.width !== current.info.width || 
          baseline.info.height !== current.info.height) {
        throw new Error('Image dimensions do not match');
      }

      const width = baseline.info.width;
      const height = baseline.info.height;
      const pixelCount = width * height;

      // Calculate pixel differences
      let diffPixels = 0;
      const diffBuffer = Buffer.alloc(baseline.data.length);

      for (let i = 0; i < baseline.data.length; i += baseline.info.channels) {
        const baseR = baseline.data[i];
        const baseG = baseline.data[i + 1];
        const baseB = baseline.data[i + 2];
        
        const currR = current.data[i];
        const currG = current.data[i + 1];
        const currB = current.data[i + 2];

        // Calculate color difference
        const diffR = Math.abs(baseR - currR);
        const diffG = Math.abs(baseG - currG);
        const diffB = Math.abs(baseB - currB);
        const totalDiff = diffR + diffG + diffB;

        if (totalDiff > 30) { // Threshold for "different" pixel
          diffPixels++;
          // Highlight diff in red
          diffBuffer[i] = 255;
          diffBuffer[i + 1] = 0;
          diffBuffer[i + 2] = 0;
          if (baseline.info.channels === 4) diffBuffer[i + 3] = 255;
        } else {
          // Keep original
          diffBuffer[i] = baseR;
          diffBuffer[i + 1] = baseG;
          diffBuffer[i + 2] = baseB;
          if (baseline.info.channels === 4) diffBuffer[i + 3] = baseline.data[i + 3];
        }
      }

      const diffPercentage = (diffPixels / pixelCount) * 100;
      const passed = diffPercentage <= (threshold * 100);

      // Save diff image
      const diffFilename = `${testName}-${viewport}-diff-${Date.now()}.png`;
      const diffPath = path.join(this.diffsDir, diffFilename);

      await sharp(diffBuffer, {
        raw: {
          width,
          height,
          channels: baseline.info.channels as 3 | 4
        }
      }).png().toFile(diffPath);

      return { diffPath, diffPercentage, passed };

    } catch (error) {
      console.error('Screenshot comparison failed:', error);
      return { diffPath: '', diffPercentage: 100, passed: false };
    }
  }

  /**
   * Generate test code using WAI SDK
   */
  async generateTest(request: TestGenerationRequest): Promise<{
    success: boolean;
    testCode?: string;
    error?: string;
  }> {
    try {
      const validated = testGenerationRequestSchema.parse(request);

      const waiRequest = new WAIRequestBuilder()
        .setType('code_generation')
        .setTask(`Generate a Playwright ${validated.testType} test for the following:

Description: ${validated.description}
URL: ${validated.url}

Requirements:
- Use TypeScript with Playwright
- Include proper assertions and waits
- Follow testing best practices
- Add data-testid selectors where appropriate
- Include comments explaining the test steps

Generate ONLY the test code, no explanations.`)
        .setPriority('high')
        .setPreferences({
          costOptimization: true,
          qualityThreshold: 0.9
        })
        .setContext({
          task_type: 'test_generation',
          test_framework: 'playwright',
          language: 'typescript'
        })
        .build();

      const result = await this.waiCore.executeRequest(waiRequest);

      if (!result.success || !result.output) {
        return {
          success: false,
          error: result.error || 'Failed to generate test code'
        };
      }

      // Extract code from response
      const testCode = this.extractCode(result.output);

      return {
        success: true,
        testCode
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Extract code from WAI response (remove markdown)
   */
  private extractCode(result: string): string {
    let code = result.replace(/```typescript\n?/gi, '')
                     .replace(/```ts\n?/gi, '')
                     .replace(/```\n?/g, '');
    return code.trim();
  }

  /**
   * List all visual test baselines
   */
  async listBaselines(): Promise<{
    success: boolean;
    baselines?: Array<{ name: string; path: string; size: number; created: Date }>;
    error?: string;
  }> {
    try {
      await this.ensureDirectories();
      
      const files = await fs.readdir(this.baselinesDir);
      const baselines = await Promise.all(
        files
          .filter(f => f.endsWith('.png'))
          .map(async (filename) => {
            const filePath = path.join(this.baselinesDir, filename);
            const stats = await fs.stat(filePath);
            return {
              name: filename,
              path: filePath,
              size: stats.size,
              created: stats.birthtime
            };
          })
      );

      return {
        success: true,
        baselines: baselines.sort((a, b) => b.created.getTime() - a.created.getTime())
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list baselines'
      };
    }
  }

  /**
   * Delete a baseline
   */
  async deleteBaseline(filename: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const filePath = path.join(this.baselinesDir, filename);
      await fs.unlink(filePath);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete baseline'
      };
    }
  }
}
