/**
 * Enterprise Platform Services Index
 * 
 * Central export for all P0/P1/P2 enterprise services
 */

// P0 Services - Critical
export { realWebSearchService, RealWebSearchService } from './real-web-search-service';
export { realWebScrapingService, RealWebScrapingService } from './real-web-scraping-service';
export { realOCRPipelineService, RealOCRPipelineService } from './real-ocr-pipeline-service';
export { realFinancialDataService, RealFinancialDataService } from './real-financial-data-service';
export { realMultimediaAPIService, RealMultimediaAPIService } from './real-multimedia-api-service';

// P1 Services - High Priority
export { notebookDocumentStudioService } from './notebook-document-studio-service';
export { databaseConnectorHubService } from './database-connector-hub-service';
export { codeQualityGatewayService } from './code-quality-gateway-service';
export { domainResearchAPIService } from './domain-research-api-service';
export { investmentResearchService } from './investment-research-service';

// P2 Services - Production Ready
export { visualAnalyticsDashboardService } from './visual-analytics-dashboard-service';
export { contentAssetManagementService } from './content-asset-management-service';
export { multiLanguageSupportService } from './multi-language-support-service';

// Re-export types
export type {
  SearchProvider,
  WebSearchResult,
  WebSearchResponse,
  SearchOptions
} from './real-web-search-service';

export type {
  ScrapeJob,
  ScrapeOptions,
  ScrapeResult,
  ExtractedEntity
} from './real-web-scraping-service';

export type {
  OCRJob,
  OCROptions,
  OCRResult,
  OCRPage,
  ExtractedTable,
  ExtractedFormField
} from './real-ocr-pipeline-service';

export type {
  StockQuote,
  HistoricalData,
  CompanyFundamentals,
  SECFiling,
  CryptoQuote
} from './real-financial-data-service';

export type {
  MediaJob,
  MediaGenerationOptions,
  MediaResult,
  ElevenLabsVoice
} from './real-multimedia-api-service';

export type {
  DocumentProject,
  ProcessedDocument,
  DocumentChunk,
  DocumentInsights,
  ChatMessage,
  QAResponse
} from './notebook-document-studio-service';

export type {
  DatabaseConnection,
  QueryResult,
  SchemaInfo,
  TableInfo
} from './database-connector-hub-service';

export type {
  CodeAnalysisJob,
  CodeAnalysisResult,
  CodeIssue,
  SecurityIssue,
  CodeMetrics,
  CodeSuggestion
} from './code-quality-gateway-service';

/**
 * Initialize all enterprise services
 */
export function initializeEnterpriseServices(): {
  search: typeof import('./real-web-search-service').realWebSearchService;
  scraping: typeof import('./real-web-scraping-service').realWebScrapingService;
  ocr: typeof import('./real-ocr-pipeline-service').realOCRPipelineService;
  financial: typeof import('./real-financial-data-service').realFinancialDataService;
  multimedia: typeof import('./real-multimedia-api-service').realMultimediaAPIService;
} {
  console.log('🚀 Initializing Enterprise Platform Services...');
  
  return {
    search: require('./real-web-search-service').realWebSearchService,
    scraping: require('./real-web-scraping-service').realWebScrapingService,
    ocr: require('./real-ocr-pipeline-service').realOCRPipelineService,
    financial: require('./real-financial-data-service').realFinancialDataService,
    multimedia: require('./real-multimedia-api-service').realMultimediaAPIService
  };
}

/**
 * Get service health status
 */
export function getEnterpriseServicesHealth(): {
  search: { status: string; providers: number };
  scraping: { status: string; cacheSize: number };
  ocr: { status: string; engines: number };
  financial: { status: string; providers: number };
  multimedia: { status: string; providers: number };
} {
  const { realWebSearchService } = require('./real-web-search-service');
  const { realWebScrapingService } = require('./real-web-scraping-service');
  const { realOCRPipelineService } = require('./real-ocr-pipeline-service');
  const { realFinancialDataService } = require('./real-financial-data-service');
  const { realMultimediaAPIService } = require('./real-multimedia-api-service');

  return {
    search: {
      status: 'active',
      providers: realWebSearchService.getAvailableProviders().length
    },
    scraping: {
      status: 'active',
      cacheSize: realWebScrapingService.getCacheStats().size
    },
    ocr: {
      status: 'active',
      engines: realOCRPipelineService.getAvailableEngines().length
    },
    financial: {
      status: 'active',
      providers: realFinancialDataService.getStats().availableProviders.length
    },
    multimedia: {
      status: 'active',
      providers: Object.values(realMultimediaAPIService.getAvailableProviders()).flat().length
    }
  };
}
