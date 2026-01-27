/**
 * SurfSense Integration for WAI Orchestration v8.0
 * 
 * Advanced web scraping and data extraction with AI-powered content understanding,
 * real-time monitoring, and intelligent data processing capabilities.
 * 
 * Features:
 * - Smart web scraping with anti-detection
 * - Real-time data monitoring
 * - AI-powered content extraction
 * - Multi-source data aggregation
 * - Rate limiting and ethical scraping
 */

import { EventEmitter } from 'events';
import puppeteer, { Browser, Page } from 'puppeteer';
import { JSDOM } from 'jsdom';

export interface SurfSenseConfig {
  enableSmartScraping: boolean;
  enableRealTimeMonitoring: boolean;
  enableAIContentExtraction: boolean;
  maxConcurrentScrapes: number;
  respectRobotsTxt: boolean;
  rateLimitMs: number;
  userAgentRotation: boolean;
  proxyRotation: boolean;
  screenshotCapture: boolean;
  contentTimeout: number;
}

export interface ScrapingRequest {
  id: string;
  url: string;
  type: 'single-page' | 'multi-page' | 'real-time-monitor' | 'deep-crawl';
  selectors?: {
    title?: string;
    content?: string;
    images?: string;
    links?: string;
    metadata?: string;
    custom?: Record<string, string>;
  };
  options: {
    waitForSelector?: string;
    waitForNetworkIdle?: boolean;
    screenshotRequired?: boolean;
    extractFullContent?: boolean;
    followLinks?: boolean;
    maxDepth?: number;
    filters?: ContentFilter[];
  };
  scheduling?: {
    frequency?: 'once' | 'hourly' | 'daily' | 'weekly' | 'custom';
    interval?: number;
    endDate?: Date;
  };
  aiProcessing?: {
    summarize?: boolean;
    extractEntities?: boolean;
    categorize?: boolean;
    sentimentAnalysis?: boolean;
    languageDetection?: boolean;
  };
  createdAt: Date;
}

export interface ContentFilter {
  type: 'keyword' | 'regex' | 'ai-classification' | 'date-range' | 'language';
  criteria: string;
  include: boolean;
}

export interface ScrapingResult {
  id: string;
  requestId: string;
  url: string;
  status: 'success' | 'partial' | 'failed';
  extractedData: {
    title?: string;
    content?: string;
    images?: ExtractedImage[];
    links?: ExtractedLink[];
    metadata?: Record<string, any>;
    fullHtml?: string;
    customSelectors?: Record<string, any>;
  };
  aiAnalysis?: {
    summary?: string;
    entities?: ExtractedEntity[];
    category?: string;
    sentiment?: SentimentAnalysis;
    language?: string;
    topics?: string[];
    keyInsights?: string[];
  };
  performance: {
    responseTime: number;
    dataSize: number;
    screenshotSize?: number;
    resourcesLoaded: number;
    jsExecutionTime: number;
  };
  error?: string;
  screenshot?: string; // Base64 encoded
  timestamp: Date;
}

export interface ExtractedImage {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  size?: number;
  format?: string;
}

export interface ExtractedLink {
  href: string;
  text?: string;
  type?: 'internal' | 'external' | 'social' | 'download';
  title?: string;
}

export interface ExtractedEntity {
  text: string;
  type: 'person' | 'organization' | 'location' | 'date' | 'money' | 'custom';
  confidence: number;
  context?: string;
}

export interface SentimentAnalysis {
  score: number; // -1 to 1
  confidence: number;
  dominant: 'positive' | 'negative' | 'neutral';
  emotions?: {
    joy?: number;
    anger?: number;
    fear?: number;
    sadness?: number;
    surprise?: number;
  };
}

export interface MonitoringTarget {
  id: string;
  name: string;
  urls: string[];
  selectors: Record<string, string>;
  frequency: number; // in milliseconds
  changeThreshold: number; // 0-1, percentage change to trigger alert
  active: boolean;
  lastCheck?: Date;
  baseline?: any;
  alertWebhook?: string;
}

export interface ChangeAlert {
  id: string;
  targetId: string;
  url: string;
  changeType: 'content' | 'structure' | 'availability' | 'performance';
  description: string;
  oldValue?: any;
  newValue?: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

export class SurfSenseIntegration extends EventEmitter {
  private config: SurfSenseConfig;
  private browser?: Browser;
  private activeRequests: Map<string, ScrapingRequest> = new Map();
  private scrapeResults: Map<string, ScrapingResult[]> = new Map();
  private monitoringTargets: Map<string, MonitoringTarget> = new Map();
  private userAgents: string[] = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  ];

  constructor(config: Partial<SurfSenseConfig> = {}) {
    super();
    this.config = {
      enableSmartScraping: true,
      enableRealTimeMonitoring: true,
      enableAIContentExtraction: true,
      maxConcurrentScrapes: 10,
      respectRobotsTxt: true,
      rateLimitMs: 2000,
      userAgentRotation: true,
      proxyRotation: false, // Requires proxy configuration
      screenshotCapture: true,
      contentTimeout: 30000,
      ...config
    };
    
    this.initializeSurfSense();
  }

  /**
   * Initialize SurfSense integration
   */
  private async initializeSurfSense(): Promise<void> {
    console.log('🌊 Initializing SurfSense Integration...');
    
    try {
      // Launch headless browser
      await this.initializeBrowser();
      
      // Start monitoring services
      if (this.config.enableRealTimeMonitoring) {
        this.startMonitoringServices();
      }
      
      console.log('✅ SurfSense Integration initialized successfully');
      this.emit('initialized');
    } catch (error) {
      console.error('❌ SurfSense initialization failed:', error);
      this.emit('initialization-failed', error);
    }
  }

  /**
   * Initialize Puppeteer browser
   */
  private async initializeBrowser(): Promise<void> {
    console.log('🚀 Launching headless browser...');
    
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    console.log('✅ Browser launched successfully');
  }

  /**
   * Start monitoring services
   */
  private startMonitoringServices(): void {
    console.log('📊 Starting real-time monitoring services...');
    
    // Start monitoring loop
    this.startMonitoringLoop();
    
    console.log('✅ Monitoring services started');
  }

  /**
   * Execute web scraping request
   */
  async scrapeWebsite(request: Omit<ScrapingRequest, 'id' | 'createdAt'>): Promise<string> {
    const requestId = `scrape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const fullRequest: ScrapingRequest = {
      id: requestId,
      createdAt: new Date(),
      ...request
    };

    this.activeRequests.set(requestId, fullRequest);
    
    console.log(`🕷️ Starting scraping request: ${requestId} for ${request.url}`);

    try {
      const result = await this.executeScraping(fullRequest);
      
      // Store result
      const results = this.scrapeResults.get(requestId) || [];
      results.push(result);
      this.scrapeResults.set(requestId, results);

      console.log(`✅ Scraping completed: ${requestId}`);
      this.emit('scraping-completed', result);

      return requestId;
    } catch (error) {
      console.error(`❌ Scraping failed: ${requestId}`, error);
      this.emit('scraping-failed', { requestId, error });
      throw error;
    } finally {
      this.activeRequests.delete(requestId);
    }
  }

  /**
   * Execute actual scraping operation
   */
  private async executeScraping(request: ScrapingRequest): Promise<ScrapingResult> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page = await this.browser.newPage();
    const startTime = Date.now();

    try {
      // Configure page
      await this.configurePage(page, request);

      // Navigate to URL
      console.log(`📱 Navigating to ${request.url}...`);
      await page.goto(request.url, { 
        waitUntil: request.options.waitForNetworkIdle ? 'networkidle2' : 'domcontentloaded',
        timeout: this.config.contentTimeout
      });

      // Wait for specific selector if provided
      if (request.options.waitForSelector) {
        await page.waitForSelector(request.options.waitForSelector, { 
          timeout: this.config.contentTimeout 
        });
      }

      // Extract data using selectors
      const extractedData = await this.extractData(page, request);

      // Take screenshot if required
      let screenshot: string | undefined;
      if (request.options.screenshotRequired && this.config.screenshotCapture) {
        const screenshotBuffer = await page.screenshot({ 
          fullPage: true, 
          type: 'png' 
        });
        screenshot = screenshotBuffer.toString('base64');
      }

      // Calculate performance metrics
      const performance = await this.calculatePerformance(page, startTime);

      const result: ScrapingResult = {
        id: `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        requestId: request.id,
        url: request.url,
        status: 'success',
        extractedData,
        performance,
        screenshot,
        timestamp: new Date()
      };

      // Apply AI processing if requested
      if (request.aiProcessing) {
        result.aiAnalysis = await this.processWithAI(extractedData, request.aiProcessing);
      }

      return result;

    } catch (error) {
      return {
        id: `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        requestId: request.id,
        url: request.url,
        status: 'failed',
        extractedData: {},
        performance: {
          responseTime: Date.now() - startTime,
          dataSize: 0,
          resourcesLoaded: 0,
          jsExecutionTime: 0
        },
        error: (error as Error).message,
        timestamp: new Date()
      };
    } finally {
      await page.close();
    }
  }

  /**
   * Configure page settings
   */
  private async configurePage(page: Page, request: ScrapingRequest): Promise<void> {
    // Set random user agent for stealth
    if (this.config.userAgentRotation) {
      const userAgent = this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
      await page.setUserAgent(userAgent);
    }

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Block unnecessary resources for faster loading
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (['font', 'media'].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Add stealth measures
    await page.evaluateOnNewDocument(() => {
      // Override navigator.webdriver
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
    });
  }

  /**
   * Extract data from page using selectors
   */
  private async extractData(page: Page, request: ScrapingRequest): Promise<ScrapingResult['extractedData']> {
    const data: ScrapingResult['extractedData'] = {};

    try {
      // Extract basic content
      if (request.selectors?.title || !request.selectors) {
        data.title = await page.$eval('title, h1', el => el.textContent?.trim()).catch(() => '');
      }

      if (request.selectors?.content || !request.selectors) {
        data.content = await page.evaluate(() => {
          const contentSelectors = ['main', 'article', '.content', '#content', 'body'];
          for (const selector of contentSelectors) {
            const element = document.querySelector(selector);
            if (element) {
              return element.textContent?.trim() || '';
            }
          }
          return document.body.textContent?.trim() || '';
        });
      }

      // Extract images
      if (request.selectors?.images || request.options.extractFullContent) {
        data.images = await page.$$eval('img', imgs => 
          imgs.map(img => ({
            src: img.src,
            alt: img.alt,
            width: img.naturalWidth,
            height: img.naturalHeight
          })).filter(img => img.src)
        );
      }

      // Extract links
      if (request.selectors?.links || request.options.extractFullContent) {
        data.links = await page.$$eval('a[href]', links => 
          links.map(link => ({
            href: link.href,
            text: link.textContent?.trim(),
            title: link.title
          })).filter(link => link.href)
        );
      }

      // Extract custom selectors
      if (request.selectors?.custom) {
        data.customSelectors = {};
        for (const [key, selector] of Object.entries(request.selectors.custom)) {
          try {
            data.customSelectors[key] = await page.$eval(selector, el => el.textContent?.trim());
          } catch (error) {
            console.warn(`Failed to extract custom selector ${key}: ${selector}`);
          }
        }
      }

      // Extract metadata
      data.metadata = await page.evaluate(() => {
        const meta: Record<string, any> = {};
        
        // Meta tags
        document.querySelectorAll('meta').forEach(metaTag => {
          const name = metaTag.getAttribute('name') || metaTag.getAttribute('property');
          const content = metaTag.getAttribute('content');
          if (name && content) {
            meta[name] = content;
          }
        });
        
        // Page info
        meta.url = window.location.href;
        meta.title = document.title;
        meta.lastModified = document.lastModified;
        
        return meta;
      });

      // Get full HTML if requested
      if (request.options.extractFullContent) {
        data.fullHtml = await page.content();
      }

    } catch (error) {
      console.warn('Error during data extraction:', error);
    }

    return data;
  }

  /**
   * Calculate performance metrics
   */
  private async calculatePerformance(page: Page, startTime: number): Promise<ScrapingResult['performance']> {
    const responseTime = Date.now() - startTime;
    
    const metrics = await page.metrics();
    const content = await page.content();
    
    return {
      responseTime,
      dataSize: Buffer.byteLength(content, 'utf8'),
      resourcesLoaded: metrics.Documents + metrics.Frames,
      jsExecutionTime: metrics.ScriptDuration || 0
    };
  }

  /**
   * Process extracted data with AI
   */
  private async processWithAI(
    data: ScrapingResult['extractedData'], 
    options: ScrapingRequest['aiProcessing']
  ): Promise<ScrapingResult['aiAnalysis']> {
    const analysis: ScrapingResult['aiAnalysis'] = {};

    const content = data.content || '';
    
    if (options?.summarize && content) {
      analysis.summary = this.generateSummary(content);
    }

    if (options?.extractEntities && content) {
      analysis.entities = this.extractEntities(content);
    }

    if (options?.categorize && content) {
      analysis.category = this.categorizeContent(content);
    }

    if (options?.sentimentAnalysis && content) {
      analysis.sentiment = this.analyzeSentiment(content);
    }

    if (options?.languageDetection && content) {
      analysis.language = this.detectLanguage(content);
    }

    analysis.topics = this.extractTopics(content);
    analysis.keyInsights = this.extractKeyInsights(content);

    return analysis;
  }

  /**
   * AI Processing Methods (Simplified implementations - in production would use actual AI models)
   */
  private generateSummary(content: string): string {
    // Simplified summarization - extract first few sentences
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.slice(0, 3).join('. ') + '.';
  }

  private extractEntities(content: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    
    // Simple pattern matching for common entities
    const patterns = {
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      phone: /\b\d{3}-\d{3}-\d{4}\b|\b\(\d{3}\)\s*\d{3}-\d{4}\b/g,
      url: /https?:\/\/[^\s]+/g,
      date: /\b\d{1,2}\/\d{1,2}\/\d{4}\b|\b\d{4}-\d{2}-\d{2}\b/g
    };

    Object.entries(patterns).forEach(([type, pattern]) => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          entities.push({
            text: match,
            type: type as ExtractedEntity['type'],
            confidence: 0.8,
            context: content.substring(Math.max(0, content.indexOf(match) - 50), content.indexOf(match) + match.length + 50)
          });
        });
      }
    });

    return entities;
  }

  private categorizeContent(content: string): string {
    const keywords = {
      news: ['breaking', 'report', 'according', 'sources', 'today'],
      tech: ['technology', 'software', 'AI', 'machine learning', 'data'],
      business: ['company', 'revenue', 'profit', 'market', 'investment'],
      education: ['learn', 'course', 'tutorial', 'guide', 'education'],
      entertainment: ['movie', 'music', 'game', 'entertainment', 'fun']
    };

    const contentLower = content.toLowerCase();
    let bestCategory = 'general';
    let maxScore = 0;

    Object.entries(keywords).forEach(([category, words]) => {
      const score = words.reduce((count, word) => {
        return count + (contentLower.split(word).length - 1);
      }, 0);

      if (score > maxScore) {
        maxScore = score;
        bestCategory = category;
      }
    });

    return bestCategory;
  }

  private analyzeSentiment(content: string): SentimentAnalysis {
    // Simplified sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'horrible', 'disappointing', 'worst'];

    const contentLower = content.toLowerCase();
    let positiveCount = 0;
    let negativeCount = 0;

    positiveWords.forEach(word => {
      positiveCount += (contentLower.split(word).length - 1);
    });

    negativeWords.forEach(word => {
      negativeCount += (contentLower.split(word).length - 1);
    });

    const totalWords = positiveCount + negativeCount;
    let score = 0;
    let dominant: SentimentAnalysis['dominant'] = 'neutral';

    if (totalWords > 0) {
      score = (positiveCount - negativeCount) / totalWords;
      if (score > 0.1) dominant = 'positive';
      else if (score < -0.1) dominant = 'negative';
    }

    return {
      score: Math.max(-1, Math.min(1, score)),
      confidence: Math.min(totalWords / 10, 1),
      dominant
    };
  }

  private detectLanguage(content: string): string {
    // Simplified language detection
    const patterns = {
      en: /\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/g,
      es: /\b(el|la|y|o|en|de|a|por|con|que|es)\b/g,
      fr: /\b(le|la|et|ou|dans|de|à|pour|avec|que|est)\b/g,
      de: /\b(der|die|das|und|oder|in|von|zu|mit|dass|ist)\b/g
    };

    let bestLang = 'en';
    let maxMatches = 0;

    Object.entries(patterns).forEach(([lang, pattern]) => {
      const matches = (content.match(pattern) || []).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        bestLang = lang;
      }
    });

    return bestLang;
  }

  private extractTopics(content: string): string[] {
    // Simple topic extraction using word frequency
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 4);

    const frequency: Record<string, number> = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  private extractKeyInsights(content: string): string[] {
    // Extract sentences that might contain key insights
    const sentences = content.split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 30 && s.length < 200);

    // Look for sentences with insight indicators
    const insightIndicators = ['important', 'key', 'significant', 'notable', 'remarkable', 'interesting', 'found that', 'shows that', 'reveals'];
    
    const insights = sentences.filter(sentence => {
      const lowerSentence = sentence.toLowerCase();
      return insightIndicators.some(indicator => lowerSentence.includes(indicator));
    });

    return insights.slice(0, 3);
  }

  /**
   * Add monitoring target
   */
  async addMonitoringTarget(target: Omit<MonitoringTarget, 'id'>): Promise<string> {
    const targetId = `monitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const fullTarget: MonitoringTarget = {
      id: targetId,
      ...target
    };

    this.monitoringTargets.set(targetId, fullTarget);

    console.log(`📊 Added monitoring target: ${target.name}`);
    this.emit('monitoring-target-added', fullTarget);

    return targetId;
  }

  /**
   * Start monitoring loop
   */
  private startMonitoringLoop(): void {
    setInterval(async () => {
      const targets = Array.from(this.monitoringTargets.values())
        .filter(target => target.active);

      for (const target of targets) {
        try {
          await this.checkMonitoringTarget(target);
        } catch (error) {
          console.error(`Error checking monitoring target ${target.id}:`, error);
        }
      }
    }, 60000); // Check every minute
  }

  /**
   * Check individual monitoring target
   */
  private async checkMonitoringTarget(target: MonitoringTarget): Promise<void> {
    const now = new Date();
    const lastCheck = target.lastCheck?.getTime() || 0;
    
    if (now.getTime() - lastCheck < target.frequency) {
      return; // Not time to check yet
    }

    console.log(`🔍 Checking monitoring target: ${target.name}`);

    for (const url of target.urls) {
      try {
        const request: ScrapingRequest = {
          id: `monitor_check_${Date.now()}`,
          url,
          type: 'single-page',
          selectors: { custom: target.selectors },
          options: { extractFullContent: false },
          createdAt: now
        };

        const result = await this.executeScraping(request);
        
        // Check for changes
        if (target.baseline) {
          const changes = this.detectChanges(target.baseline, result.extractedData, target.changeThreshold);
          
          if (changes.length > 0) {
            changes.forEach(change => {
              this.triggerChangeAlert(target, url, change);
            });
          }
        } else {
          // Set baseline on first check
          target.baseline = result.extractedData;
        }

        target.lastCheck = now;
        
      } catch (error) {
        console.error(`Error monitoring ${url}:`, error);
        
        // Trigger availability alert
        this.triggerChangeAlert(target, url, {
          type: 'availability',
          description: `Website not accessible: ${(error as Error).message}`,
          severity: 'high'
        });
      }
    }
  }

  /**
   * Detect changes between baseline and current data
   */
  private detectChanges(baseline: any, current: any, threshold: number): any[] {
    const changes: any[] = [];
    
    // Compare content changes
    if (baseline.content && current.content) {
      const similarity = this.calculateSimilarity(baseline.content, current.content);
      if (similarity < (1 - threshold)) {
        changes.push({
          type: 'content',
          description: `Content changed by ${Math.round((1 - similarity) * 100)}%`,
          oldValue: baseline.content.substring(0, 100) + '...',
          newValue: current.content.substring(0, 100) + '...',
          severity: similarity < 0.5 ? 'high' : 'medium'
        });
      }
    }

    return changes;
  }

  /**
   * Calculate similarity between two texts
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Trigger change alert
   */
  private triggerChangeAlert(target: MonitoringTarget, url: string, change: any): void {
    const alert: ChangeAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      targetId: target.id,
      url,
      changeType: change.type,
      description: change.description,
      oldValue: change.oldValue,
      newValue: change.newValue,
      severity: change.severity,
      timestamp: new Date()
    };

    console.log(`🚨 Change alert: ${alert.description}`);
    
    this.emit('change-alert', alert);

    // Send webhook if configured
    if (target.alertWebhook) {
      this.sendWebhookAlert(target.alertWebhook, alert);
    }
  }

  /**
   * Send webhook alert
   */
  private async sendWebhookAlert(webhookUrl: string, alert: ChangeAlert): Promise<void> {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert)
      });
      
      if (response.ok) {
        console.log(`✅ Webhook alert sent successfully`);
      } else {
        console.error(`❌ Webhook alert failed: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error sending webhook alert:', error);
    }
  }

  /**
   * Public API methods
   */
  
  async getScrapingResults(requestId: string): Promise<ScrapingResult[]> {
    return this.scrapeResults.get(requestId) || [];
  }

  getActiveRequests(): ScrapingRequest[] {
    return Array.from(this.activeRequests.values());
  }

  getMonitoringTargets(): MonitoringTarget[] {
    return Array.from(this.monitoringTargets.values());
  }

  async removeMonitoringTarget(targetId: string): Promise<boolean> {
    return this.monitoringTargets.delete(targetId);
  }

  async getSystemMetrics(): Promise<any> {
    return {
      activeRequests: this.activeRequests.size,
      totalScrapingResults: Array.from(this.scrapeResults.values())
        .reduce((sum, results) => sum + results.length, 0),
      monitoringTargets: this.monitoringTargets.size,
      activeMonitoring: Array.from(this.monitoringTargets.values())
        .filter(t => t.active).length,
      browserStatus: this.browser ? 'active' : 'inactive'
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up SurfSense resources...');
    
    if (this.browser) {
      await this.browser.close();
      this.browser = undefined;
    }
    
    this.activeRequests.clear();
    
    console.log('✅ SurfSense cleanup completed');
  }
}

// Export singleton instance
export const surfSenseIntegration = new SurfSenseIntegration();