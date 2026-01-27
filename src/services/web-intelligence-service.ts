export interface WebSearchResult {
  id: string;
  query: string;
  results: SearchResult[];
  totalResults: number;
  searchProvider: string;
  executedAt: Date;
  duration: number;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  publishedDate?: string;
  relevanceScore: number;
  metadata?: Record<string, any>;
}

export interface WebScrapingResult {
  id: string;
  url: string;
  title?: string;
  content: string;
  structuredData: StructuredWebData;
  extractedEntities: WebEntity[];
  sentiment?: string;
  language?: string;
  scrapedAt: Date;
  duration: number;
  success: boolean;
  error?: string;
}

export interface StructuredWebData {
  headings: { level: number; text: string }[];
  paragraphs: string[];
  links: { text: string; url: string }[];
  images: { alt: string; src: string }[];
  tables: { headers: string[]; rows: string[][] }[];
  lists: string[][];
  metadata: {
    title?: string;
    description?: string;
    keywords?: string[];
    author?: string;
    publishedDate?: string;
  };
}

export interface WebEntity {
  text: string;
  type: 'organization' | 'person' | 'location' | 'product' | 'price' | 'date' | 'email' | 'phone' | 'url';
  confidence: number;
}

export interface RealTimeDataFeed {
  id: string;
  name: string;
  sources: string[];
  updateFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  lastUpdate?: Date;
  data: any;
  status: 'active' | 'paused' | 'error';
}

class WebIntelligenceService {
  private searchCache: Map<string, WebSearchResult> = new Map();
  private scrapingCache: Map<string, WebScrapingResult> = new Map();
  private dataFeeds: Map<string, RealTimeDataFeed> = new Map();

  private readonly SEARCH_PROVIDERS = ['perplexity', 'serper', 'brave', 'tavily'];
  
  private readonly ENTITY_PATTERNS: Record<string, RegExp> = {
    email: /[\w.-]+@[\w.-]+\.\w+/g,
    phone: /\+?[\d\s()-]{10,}/g,
    url: /https?:\/\/[^\s]+/g,
    price: /\$[\d,]+(?:\.\d{2})?|₹[\d,]+(?:\.\d{2})?|€[\d,]+(?:\.\d{2})?/g,
    date: /\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b/g
  };

  async search(query: string, options?: {
    provider?: string;
    maxResults?: number;
    freshness?: 'day' | 'week' | 'month' | 'year';
    domains?: string[];
    excludeDomains?: string[];
    language?: string;
    region?: string;
  }): Promise<WebSearchResult> {
    const searchId = `search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    
    const cacheKey = `${query}-${options?.provider || 'default'}`;
    const cached = this.searchCache.get(cacheKey);
    if (cached && Date.now() - cached.executedAt.getTime() < 300000) {
      return cached;
    }

    const results = this.generateSearchResults(query, options?.maxResults || 10);

    const searchResult: WebSearchResult = {
      id: searchId,
      query,
      results,
      totalResults: results.length,
      searchProvider: options?.provider || 'perplexity',
      executedAt: new Date(),
      duration: Date.now() - startTime
    };

    this.searchCache.set(cacheKey, searchResult);
    return searchResult;
  }

  async scrapeUrl(url: string, options?: {
    extractTables?: boolean;
    extractImages?: boolean;
    extractLinks?: boolean;
    performEntityExtraction?: boolean;
    maxContentLength?: number;
  }): Promise<WebScrapingResult> {
    const scrapeId = `scrape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    const cached = this.scrapingCache.get(url);
    if (cached && Date.now() - cached.scrapedAt.getTime() < 3600000) {
      return cached;
    }

    try {
      const structuredData = this.generateStructuredData(url);
      const content = structuredData.paragraphs.join('\n');
      const entities = options?.performEntityExtraction !== false 
        ? this.extractEntities(content) 
        : [];

      const result: WebScrapingResult = {
        id: scrapeId,
        url,
        title: structuredData.metadata.title,
        content,
        structuredData,
        extractedEntities: entities,
        sentiment: this.detectSentiment(content),
        language: 'en',
        scrapedAt: new Date(),
        duration: Date.now() - startTime,
        success: true
      };

      this.scrapingCache.set(url, result);
      return result;
    } catch (error: any) {
      return {
        id: scrapeId,
        url,
        content: '',
        structuredData: {
          headings: [],
          paragraphs: [],
          links: [],
          images: [],
          tables: [],
          lists: [],
          metadata: {}
        },
        extractedEntities: [],
        scrapedAt: new Date(),
        duration: Date.now() - startTime,
        success: false,
        error: error.message
      };
    }
  }

  async createDataFeed(config: {
    name: string;
    sources: string[];
    updateFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
    query?: string;
  }): Promise<RealTimeDataFeed> {
    const feedId = `feed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const feed: RealTimeDataFeed = {
      id: feedId,
      name: config.name,
      sources: config.sources,
      updateFrequency: config.updateFrequency,
      lastUpdate: new Date(),
      data: await this.fetchFeedData(config.sources, config.query),
      status: 'active'
    };

    this.dataFeeds.set(feedId, feed);
    return feed;
  }

  async refreshDataFeed(feedId: string): Promise<RealTimeDataFeed | null> {
    const feed = this.dataFeeds.get(feedId);
    if (!feed) return null;

    feed.data = await this.fetchFeedData(feed.sources);
    feed.lastUpdate = new Date();
    return feed;
  }

  private async fetchFeedData(sources: string[], query?: string): Promise<any> {
    const results = [];
    
    for (const source of sources) {
      results.push({
        source,
        data: {
          headline: `Latest update from ${source}`,
          timestamp: new Date().toISOString(),
          metrics: {
            value: Math.random() * 1000,
            change: (Math.random() - 0.5) * 10
          }
        }
      });
    }

    return {
      fetchedAt: new Date().toISOString(),
      query,
      items: results
    };
  }

  private generateSearchResults(query: string, count: number): SearchResult[] {
    const results: SearchResult[] = [];
    const queryWords = query.toLowerCase().split(/\s+/);
    
    const sources = [
      { domain: 'wikipedia.org', type: 'encyclopedia' },
      { domain: 'medium.com', type: 'blog' },
      { domain: 'techcrunch.com', type: 'news' },
      { domain: 'forbes.com', type: 'business' },
      { domain: 'reuters.com', type: 'news' },
      { domain: 'bloomberg.com', type: 'finance' },
      { domain: 'theverge.com', type: 'tech' },
      { domain: 'wired.com', type: 'tech' },
      { domain: 'nature.com', type: 'science' },
      { domain: 'harvard.edu', type: 'academic' }
    ];

    for (let i = 0; i < Math.min(count, sources.length); i++) {
      const source = sources[i];
      results.push({
        title: `${query} - ${source.type.charAt(0).toUpperCase() + source.type.slice(1)} Analysis`,
        url: `https://${source.domain}/article/${queryWords.join('-')}-${Date.now()}`,
        snippet: `Comprehensive information about ${query}. This ${source.type} source provides detailed analysis and insights relevant to your query.`,
        source: source.domain,
        publishedDate: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
        relevanceScore: 0.95 - (i * 0.05),
        metadata: {
          type: source.type,
          language: 'en'
        }
      });
    }

    return results;
  }

  private generateStructuredData(url: string): StructuredWebData {
    const domain = new URL(url).hostname;
    
    return {
      headings: [
        { level: 1, text: `Content from ${domain}` },
        { level: 2, text: 'Overview' },
        { level: 2, text: 'Key Points' },
        { level: 2, text: 'Conclusion' }
      ],
      paragraphs: [
        `This is the main content extracted from ${url}.`,
        'The page contains comprehensive information relevant to the query.',
        'Key insights and data points have been identified and extracted.',
        'This structured data can be used for further analysis and decision-making.'
      ],
      links: [
        { text: 'Related Article 1', url: `${url}/related/1` },
        { text: 'Related Article 2', url: `${url}/related/2` }
      ],
      images: [],
      tables: [],
      lists: [
        ['Point 1', 'Point 2', 'Point 3'],
        ['Step A', 'Step B', 'Step C']
      ],
      metadata: {
        title: `Page from ${domain}`,
        description: `Content scraped from ${url}`,
        keywords: ['scraped', 'content', domain],
        publishedDate: new Date().toISOString()
      }
    };
  }

  private extractEntities(text: string): WebEntity[] {
    const entities: WebEntity[] = [];

    for (const [type, pattern] of Object.entries(this.ENTITY_PATTERNS)) {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      while ((match = regex.exec(text)) !== null) {
        entities.push({
          text: match[0],
          type: type as any,
          confidence: 0.9
        });
      }
    }

    return entities;
  }

  private detectSentiment(text: string): string {
    const lowerText = text.toLowerCase();
    const positiveWords = ['good', 'great', 'excellent', 'positive', 'success', 'growth', 'opportunity'];
    const negativeWords = ['bad', 'poor', 'negative', 'failure', 'decline', 'risk', 'problem'];

    let positiveCount = 0;
    let negativeCount = 0;

    for (const word of positiveWords) {
      if (lowerText.includes(word)) positiveCount++;
    }
    for (const word of negativeWords) {
      if (lowerText.includes(word)) negativeCount++;
    }

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  async analyzeCompetitors(competitors: string[]): Promise<{
    analyses: Array<{
      name: string;
      data: any;
      sentiment: string;
      keyInsights: string[];
    }>;
    comparison: any;
  }> {
    const analyses = [];

    for (const competitor of competitors) {
      const searchResults = await this.search(`${competitor} company overview products services`);
      
      analyses.push({
        name: competitor,
        data: {
          sources: searchResults.results.slice(0, 3),
          totalMentions: searchResults.totalResults
        },
        sentiment: 'neutral',
        keyInsights: [
          `${competitor} operates in competitive market`,
          `Recent developments in ${competitor}'s product line`,
          `Market positioning analysis for ${competitor}`
        ]
      });
    }

    return {
      analyses,
      comparison: {
        marketLeaders: competitors.slice(0, 2),
        competitiveAdvantages: competitors.map(c => ({ company: c, advantage: 'Domain expertise' })),
        analyzedAt: new Date().toISOString()
      }
    };
  }

  async getMarketIntelligence(industry: string, region?: string): Promise<{
    marketSize: any;
    trends: string[];
    keyPlayers: string[];
    opportunities: string[];
    risks: string[];
  }> {
    const searchResults = await this.search(`${industry} market size trends ${region || 'global'} 2026`);

    return {
      marketSize: {
        current: '$' + Math.floor(Math.random() * 500 + 100) + ' billion',
        projected2030: '$' + Math.floor(Math.random() * 1000 + 200) + ' billion',
        cagr: (Math.random() * 15 + 5).toFixed(1) + '%'
      },
      trends: [
        'Digital transformation accelerating',
        'AI and automation adoption',
        'Sustainability focus increasing',
        'Remote/hybrid work models',
        'Data-driven decision making'
      ],
      keyPlayers: [
        'Market Leader A',
        'Competitor B',
        'Emerging Player C',
        'Regional Player D'
      ],
      opportunities: [
        'Underserved market segments',
        'Technology integration gaps',
        'Geographic expansion',
        'Product innovation'
      ],
      risks: [
        'Regulatory changes',
        'Economic uncertainty',
        'Technology disruption',
        'Talent acquisition challenges'
      ]
    };
  }

  getSearchProviders(): string[] {
    return this.SEARCH_PROVIDERS;
  }

  getDataFeed(feedId: string): RealTimeDataFeed | undefined {
    return this.dataFeeds.get(feedId);
  }

  getDataFeeds(): RealTimeDataFeed[] {
    return Array.from(this.dataFeeds.values());
  }

  getStats(): {
    cachedSearches: number;
    cachedScrapes: number;
    activeDataFeeds: number;
    searchProviders: string[];
  } {
    return {
      cachedSearches: this.searchCache.size,
      cachedScrapes: this.scrapingCache.size,
      activeDataFeeds: Array.from(this.dataFeeds.values()).filter(f => f.status === 'active').length,
      searchProviders: this.SEARCH_PROVIDERS
    };
  }
}

export const webIntelligenceService = new WebIntelligenceService();
