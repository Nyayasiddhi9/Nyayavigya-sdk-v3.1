/**
 * Web Scraping Service - Real Implementation
 * Provides actual web scraping capabilities with respect for robots.txt
 */

import { EventEmitter } from 'events';

export interface WebScrapingRequest {
  urls: string[];
  options: {
    extractText: boolean;
    extractLinks: boolean;
    extractImages: boolean;
    extractMetadata: boolean;
    followRedirects: boolean;
    timeout: number;
    userAgent?: string;
  };
}

export class WebScrapingService extends EventEmitter {
  private initialized = false;
  private robotsCache: Map<string, any> = new Map();

  async initialize(): Promise<void> {
    try {
      console.log('🕷️ Initializing Web Scraping Service...');
      this.initialized = true;
      console.log('✅ Web Scraping Service initialized');
    } catch (error) {
      console.error('❌ Web Scraping Service initialization failed:', error);
      throw error;
    }
  }

  async scrape(request: WebScrapingRequest): Promise<any[]> {
    if (!this.initialized) {
      throw new Error('Web Scraping Service not initialized');
    }

    const results: any[] = [];

    for (const url of request.urls) {
      try {
        // Check robots.txt compliance
        if (!(await this.isAllowedByRobots(url, request.options.userAgent))) {
          console.warn(`⚠️ Scraping not allowed by robots.txt for: ${url}`);
          continue;
        }

        const scrapedData = await this.scrapeUrl(url, request.options);
        results.push(scrapedData);

      } catch (error) {
        console.error(`❌ Failed to scrape ${url}:`, error);
        results.push({
          url,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date()
        });
      }
    }

    return results;
  }

  private async scrapeUrl(url: string, options: WebScrapingRequest['options']): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': options.userAgent || 'WAI-Bot/1.0 (+https://wai-orchestration.com/bot)'
        },
        redirect: options.followRedirects ? 'follow' : 'manual'
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      
      if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
        throw new Error(`Unsupported content type: ${contentType}`);
      }

      const html = await response.text();
      const result: any = {
        url,
        status: response.status,
        contentType,
        timestamp: new Date()
      };

      // Extract text content
      if (options.extractText) {
        result.text = this.extractTextFromHtml(html);
      }

      // Extract links
      if (options.extractLinks) {
        result.links = this.extractLinksFromHtml(html, url);
      }

      // Extract images
      if (options.extractImages) {
        result.images = this.extractImagesFromHtml(html, url);
      }

      // Extract metadata
      if (options.extractMetadata) {
        result.metadata = this.extractMetadataFromHtml(html);
      }

      return result;

    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private extractTextFromHtml(html: string): string {
    // Simple HTML text extraction (in production, would use a proper HTML parser)
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractLinksFromHtml(html: string, baseUrl: string): string[] {
    const links: string[] = [];
    const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
      try {
        const href = match[1];
        const absoluteUrl = new URL(href, baseUrl).href;
        links.push(absoluteUrl);
      } catch (error) {
        // Invalid URL, skip
      }
    }

    return [...new Set(links)]; // Remove duplicates
  }

  private extractImagesFromHtml(html: string, baseUrl: string): string[] {
    const images: string[] = [];
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let match;

    while ((match = imgRegex.exec(html)) !== null) {
      try {
        const src = match[1];
        const absoluteUrl = new URL(src, baseUrl).href;
        images.push(absoluteUrl);
      } catch (error) {
        // Invalid URL, skip
      }
    }

    return [...new Set(images)]; // Remove duplicates
  }

  private extractMetadataFromHtml(html: string): Record<string, any> {
    const metadata: Record<string, any> = {};

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      metadata.title = titleMatch[1].trim();
    }

    // Extract meta description
    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i);
    if (descMatch) {
      metadata.description = descMatch[1].trim();
    }

    // Extract meta keywords
    const keywordsMatch = html.match(/<meta[^>]+name=["']keywords["'][^>]+content=["']([^"']+)["'][^>]*>/i);
    if (keywordsMatch) {
      metadata.keywords = keywordsMatch[1].trim().split(',').map(k => k.trim());
    }

    // Extract Open Graph data
    const ogRegex = /<meta[^>]+property=["']og:([^"']+)["'][^>]+content=["']([^"']+)["'][^>]*>/gi;
    let ogMatch;
    metadata.openGraph = {};
    
    while ((ogMatch = ogRegex.exec(html)) !== null) {
      metadata.openGraph[ogMatch[1]] = ogMatch[2];
    }

    // Extract canonical URL
    const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i);
    if (canonicalMatch) {
      metadata.canonical = canonicalMatch[1];
    }

    return metadata;
  }

  private async isAllowedByRobots(url: string, userAgent: string = '*'): Promise<boolean> {
    try {
      const urlObj = new URL(url);
      const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;
      
      // Check cache first
      if (this.robotsCache.has(robotsUrl)) {
        const robots = this.robotsCache.get(robotsUrl);
        return this.checkRobotsRules(robots, urlObj.pathname, userAgent);
      }

      // Fetch robots.txt
      const response = await fetch(robotsUrl, {
        timeout: 5000,
        headers: {
          'User-Agent': 'WAI-Bot/1.0 (+https://wai-orchestration.com/bot)'
        }
      });

      if (!response.ok) {
        // If robots.txt doesn't exist or is inaccessible, allow scraping
        this.robotsCache.set(robotsUrl, null);
        return true;
      }

      const robotsText = await response.text();
      const robots = this.parseRobotsTxt(robotsText);
      
      // Cache for 1 hour
      this.robotsCache.set(robotsUrl, robots);
      setTimeout(() => this.robotsCache.delete(robotsUrl), 3600000);

      return this.checkRobotsRules(robots, urlObj.pathname, userAgent);

    } catch (error) {
      console.warn(`⚠️ Failed to check robots.txt for ${url}:`, error);
      // If we can't check robots.txt, be conservative and allow
      return true;
    }
  }

  private parseRobotsTxt(robotsText: string): any {
    const rules: any = {
      '*': { allow: [], disallow: [] }
    };

    const lines = robotsText.split('\n');
    let currentUserAgent = '*';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#') || !trimmed) continue;

      const colonIndex = trimmed.indexOf(':');
      if (colonIndex === -1) continue;

      const directive = trimmed.substring(0, colonIndex).trim().toLowerCase();
      const value = trimmed.substring(colonIndex + 1).trim();

      if (directive === 'user-agent') {
        currentUserAgent = value;
        if (!rules[currentUserAgent]) {
          rules[currentUserAgent] = { allow: [], disallow: [] };
        }
      } else if (directive === 'disallow' && rules[currentUserAgent]) {
        rules[currentUserAgent].disallow.push(value);
      } else if (directive === 'allow' && rules[currentUserAgent]) {
        rules[currentUserAgent].allow.push(value);
      }
    }

    return rules;
  }

  private checkRobotsRules(robots: any, path: string, userAgent: string): boolean {
    if (!robots) return true;

    // Check specific user agent rules first
    const specificRules = robots[userAgent] || robots['*'];
    if (!specificRules) return true;

    // Check allow rules first (more specific)
    for (const allowPattern of specificRules.allow || []) {
      if (this.matchesPattern(path, allowPattern)) {
        return true;
      }
    }

    // Check disallow rules
    for (const disallowPattern of specificRules.disallow || []) {
      if (this.matchesPattern(path, disallowPattern)) {
        return false;
      }
    }

    return true;
  }

  private matchesPattern(path: string, pattern: string): boolean {
    if (pattern === '' || pattern === '/') return path === '/';
    if (pattern === '/*' || pattern === '*') return true;
    
    // Simple pattern matching (in production, would implement full robots.txt pattern matching)
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      return path.startsWith(prefix);
    }
    
    return path === pattern || path.startsWith(pattern + '/');
  }

  async shutdown(): Promise<void> {
    console.log('🕷️ Web Scraping Service shutting down...');
    this.robotsCache.clear();
    this.removeAllListeners();
    this.initialized = false;
  }
}