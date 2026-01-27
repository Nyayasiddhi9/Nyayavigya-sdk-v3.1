/**
 * WAI SDK v3.1 - Enterprise Services Index
 * 238 Services | 23+ LLM Providers | 15 Studios | 275 Agents
 * Universal AI Orchestration Platform
 * 
 * Service modules are organized in subdirectories and can be imported directly:
 * - ./llm-providers/* - 16 LLM provider integrations
 * - ./enterprise-platform-services/* - 14 enterprise APIs
 * - ./studios/* - 15 Wizards Incubator studios
 * - ./multi-org/* - 7 multi-tenant services
 * - ./rag/* - 4 RAG services
 * - ./memory/* - 3 memory services
 * - ./protocols/* - 5 protocol services
 * - ./automation/* - 4 automation services
 * - ./domain-workflows/* - 2 domain workflow services
 * - ./integrations/* - 3 integration services
 */

// ============================================================================
// CORE SERVICE IMPORTS
// ============================================================================
import { WebSearchService } from './web-search';
import { DocumentProcessingService } from './document-processing';
import { NotebookLLMService } from './notebook-llm';
import { WebScrapingService } from './web-scraping';
import { DatabaseConnectorService } from './database-connector';
import { CodeQualityService } from './code-quality';
import { DomainResearchService } from './domain-research';
import { InvestmentResearchService } from './investment-research';
import { FinancialDataService } from './financial-data';
import { MultimediaService } from './multimedia';
import { VisualAnalyticsService } from './visual-analytics';
import { ContentAssetService } from './content-asset';
import { MultiLanguageService } from './multi-language';
import { AgentOrchestrationService } from './agent-orchestration';
import { LLMProviders } from './llm-providers';

// ============================================================================
// SERVICE REGISTRY TYPE
// ============================================================================
export interface ServiceRegistry {
  webSearch: WebSearchService;
  documentProcessing: DocumentProcessingService;
  notebookLLM: NotebookLLMService;
  webScraping: WebScrapingService;
  databaseConnector: DatabaseConnectorService;
  codeQuality: CodeQualityService;
  domainResearch: DomainResearchService;
  investmentResearch: InvestmentResearchService;
  financialData: FinancialDataService;
  multimedia: MultimediaService;
  visualAnalytics: VisualAnalyticsService;
  contentAsset: ContentAssetService;
  multiLanguage: MultiLanguageService;
  agentOrchestration: AgentOrchestrationService;
  llmProviders: typeof LLMProviders;
}

export const services: Partial<ServiceRegistry> = {};

// ============================================================================
// SERVICE INITIALIZATION
// ============================================================================
export async function initializeServices(): Promise<ServiceRegistry> {
  console.log('🚀 Initializing WAI SDK v3.1 Enterprise Services...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const startTime = Date.now();

  // P0 - Critical Services
  console.log('📦 [P0] Loading Critical Enterprise Services...');
  services.webSearch = new WebSearchService();
  services.documentProcessing = new DocumentProcessingService();
  services.notebookLLM = new NotebookLLMService();
  services.webScraping = new WebScrapingService();
  services.databaseConnector = new DatabaseConnectorService();
  console.log('  ✅ P0 Services: 5/5 loaded');

  // P1 - Important Services
  console.log('📦 [P1] Loading Important Enterprise Services...');
  services.codeQuality = new CodeQualityService();
  services.domainResearch = new DomainResearchService();
  services.investmentResearch = new InvestmentResearchService();
  services.financialData = new FinancialDataService();
  services.multimedia = new MultimediaService();
  console.log('  ✅ P1 Services: 5/5 loaded');

  // P2 - Enhanced Services
  console.log('📦 [P2] Loading Enhanced Enterprise Services...');
  services.visualAnalytics = new VisualAnalyticsService();
  services.contentAsset = new ContentAssetService();
  services.multiLanguage = new MultiLanguageService();
  services.agentOrchestration = new AgentOrchestrationService();
  services.llmProviders = LLMProviders;
  console.log('  ✅ P2 Services: 5/5 loaded');

  const loadTime = Date.now() - startTime;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════════╗
║                    WAI SDK v3.1 - Enterprise Services Ready                       ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║  📊 Total Service Modules: 238 available                                         ║
║  🔧 Initialized Services: 15 (P0+P1+P2 core services)                            ║
║                                                                                   ║
║  📦 Service Categories (import directly from subdirectories):                    ║
║     • LLM Providers: 16 (./llm-providers/*)                                     ║
║     • Enterprise Platform: 14 (./enterprise-platform-services/*)                ║
║     • Wizards Studios: 15 (./studios/*)                                         ║
║     • Multi-Org: 7 (./multi-org/*)                                              ║
║     • RAG: 4 (./rag/*)                                                          ║
║     • Memory: 3 (./memory/*)                                                    ║
║     • Protocols: 5 (./protocols/*)                                              ║
║     • Automation: 4 (./automation/*)                                            ║
║     • Orchestration: 9+ core orchestration services                             ║
║     • Infrastructure: 20+ supporting services                                   ║
║                                                                                   ║
║  ⏱️ Load Time: ${loadTime}ms                                                         ║
╚══════════════════════════════════════════════════════════════════════════════════╝
  `);

  return services as ServiceRegistry;
}

export function getService<K extends keyof ServiceRegistry>(name: K): ServiceRegistry[K] | undefined {
  return services[name];
}

export function getServiceStats(): { total: number; initialized: number; categories: Record<string, number> } {
  return {
    total: 238,
    initialized: 15,
    categories: {
      'P0 Critical': 5,
      'P1 Important': 5,
      'P2 Enhanced': 5,
      'LLM Providers': 16,
      'Enterprise Platform': 14,
      'Studios': 15,
      'Multi-Org': 7,
      'RAG': 4,
      'Memory': 3,
      'Protocols': 5,
      'Automation': 4,
      'Orchestration': 9,
      'Domain Workflows': 2,
      'Integrations': 3,
      'Infrastructure': 20,
      'Admin': 4
    }
  };
}

// ============================================================================
// EXPORTS
// ============================================================================
export {
  WebSearchService,
  DocumentProcessingService,
  NotebookLLMService,
  WebScrapingService,
  DatabaseConnectorService,
  CodeQualityService,
  DomainResearchService,
  InvestmentResearchService,
  FinancialDataService,
  MultimediaService,
  VisualAnalyticsService,
  ContentAssetService,
  MultiLanguageService,
  AgentOrchestrationService,
  LLMProviders
};
