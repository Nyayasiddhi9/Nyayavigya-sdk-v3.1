/**
 * Tool Registry
 * Central registry for all WAI SDK tools with MCP integration
 */

import { MCPServer } from '@wai/protocols';
import { fileOperationsTool, fileOperationsExecutor } from '../tools/file-operations';
import { webRequestsTool, webRequestsExecutor } from '../tools/web-requests';
import { apiCallingTool, apiCallingExecutor } from '../tools/api-calling';
import { codeExecutionTool, codeExecutionExecutor } from '../tools/code-execution';
import { jsonOperationsTool, jsonOperationsExecutor } from '../tools/json-operations';
import { textProcessingTool, textProcessingExecutor } from '../tools/text-processing';
import { mathCalculationsTool, mathCalculationsExecutor } from '../tools/math-calculations';
import { datetimeOperationsTool, datetimeOperationsExecutor } from '../tools/datetime-operations';
import { randomGenerationTool, randomGenerationExecutor } from '../tools/random-generation';
import { dataValidationTool, dataValidationExecutor } from '../tools/data-validation';
import { memoryStoreTool, memoryStoreExecutor } from '../tools/memory-store';
import { memoryRecallTool, memoryRecallExecutor } from '../tools/memory-recall';
import { memoryUpdateTool, memoryUpdateExecutor } from '../tools/memory-update';
import { memoryDeleteTool, memoryDeleteExecutor } from '../tools/memory-delete';
import { 
  voiceSynthesisTool, 
  voiceSynthesisExecutor,
  getVoicesTool,
  getVoicesExecutor,
} from '../tools/multimodal/voice-synthesis';
import {
  speechToTextTool,
  speechToTextExecutor,
  speechTranslationTool,
  speechTranslationExecutor,
} from '../tools/multimodal/speech-to-text';
import {
  videoGenerationTool,
  videoGenerationExecutor,
  getVideoStatusTool,
  getVideoStatusExecutor,
} from '../tools/multimodal/video-generation';
import {
  musicGenerationTool,
  musicGenerationExecutor,
  getMusicStatusTool,
  getMusicStatusExecutor,
} from '../tools/multimodal/music-generation';
import {
  dalleImageGenerationTool,
  dalleImageGenerationExecutor,
  stableDiffusionTool,
  stableDiffusionExecutor,
  getStableDiffusionStatusTool,
  getStableDiffusionStatusExecutor,
} from '../tools/multimodal/image-generation';
import {
  imageResizeTool,
  imageResizeExecutor,
  imageCropTool,
  imageCropExecutor,
  imageFilterTool,
  imageFilterExecutor,
  imageWatermarkTool,
  imageWatermarkExecutor,
  imageConvertTool,
  imageConvertExecutor,
} from '../tools/multimodal/image-editing';
import { csvOperationsTool, csvOperationsExecutor } from '../tools/data/csv-operations';
import { excelOperationsTool, excelOperationsExecutor } from '../tools/data/excel-operations';
import { dataCleaningTool, dataCleaningExecutor } from '../tools/data/data-cleaning';
import { pivotTableTool, pivotTableExecutor } from '../tools/data/pivot-table';
import { googleSheetsTool, googleSheetsExecutor } from '../tools/data/google-sheets';
import { chartConfigTool, chartConfigExecutor } from '../tools/visualization/chart-config';
import { tableFormatterTool, tableFormatterExecutor } from '../tools/visualization/table-formatter';
import { dashboardConfigTool, dashboardConfigExecutor } from '../tools/visualization/dashboard-config';
import { dataVizConfigTool, dataVizConfigExecutor } from '../tools/visualization/data-viz-config';
import { realTimeWidgetTool, realTimeWidgetExecutor } from '../tools/visualization/real-time-widget';
import { descriptiveStatsTool, descriptiveStatsExecutor } from '../tools/statistics/descriptive-stats';
import { correlationTool, correlationExecutor } from '../tools/statistics/correlation';
import { regressionTool, regressionExecutor } from '../tools/statistics/regression';
import { timeSeriesTool, timeSeriesExecutor } from '../tools/statistics/time-series';
import { abTestingTool, abTestingExecutor } from '../tools/statistics/ab-testing';
import { kpiTrackerTool, kpiTrackerExecutor } from '../tools/business-intelligence/kpi-tracker';
import { trendAnalyzerTool, trendAnalyzerExecutor } from '../tools/business-intelligence/trend-analyzer';
import { forecasterTool, forecasterExecutor } from '../tools/business-intelligence/forecaster';
import { cohortAnalyzerTool, cohortAnalyzerExecutor } from '../tools/business-intelligence/cohort-analyzer';
import { funnelAnalyzerTool, funnelAnalyzerExecutor } from '../tools/business-intelligence/funnel-analyzer';
import { firecrawlScraperTool, firecrawlScraperExecutor } from '../tools/web-scraping/firecrawl-scraper';
import { puppeteerAutomationTool, puppeteerAutomationExecutor } from '../tools/web-scraping/puppeteer-automation';
import { playwrightE2ETool, playwrightE2EExecutor } from '../tools/web-scraping/playwright-e2e';
import { cheerioParserTool, cheerioParserExecutor } from '../tools/web-scraping/cheerio-parser';
import { exaSearchTool, exaSearchExecutor } from '../tools/web-scraping/exa-search';
import { sitemapGeneratorTool, sitemapGeneratorExecutor } from '../tools/web-scraping/sitemap-generator';
import { perplexitySearchTool, perplexitySearchExecutor } from '../tools/web-search/perplexity-search';
import { googleSearchTool, googleSearchExecutor } from '../tools/web-search/google-search';
import { bingSearchTool, bingSearchExecutor } from '../tools/web-search/bing-search';
import { duckduckgoSearchTool, duckduckgoSearchExecutor } from '../tools/web-search/duckduckgo-search';
import { seoAnalyzerTool, seoAnalyzerExecutor } from '../tools/seo-analytics/seo-analyzer';
import { keywordResearchTool, keywordResearchExecutor } from '../tools/seo-analytics/keyword-research';
import { backlinkCheckerTool, backlinkCheckerExecutor } from '../tools/seo-analytics/backlink-checker';
import { metaTagGeneratorTool, metaTagGeneratorExecutor } from '../tools/seo-analytics/meta-tag-generator';
import { googleAnalyticsTool, googleAnalyticsExecutor } from '../tools/seo-analytics/google-analytics';
import { emailSenderTool, emailSenderExecutor } from '../tools/communication/email-sender';
import { emailParserTool, emailParserExecutor } from '../tools/communication/email-parser';
import { emailTemplateTool, emailTemplateExecutor } from '../tools/communication/email-template';
import { bulkEmailTool, bulkEmailExecutor } from '../tools/communication/bulk-email';
import { emailValidationTool, emailValidationExecutor } from '../tools/communication/email-validation';
import { smsSenderTool, smsSenderExecutor } from '../tools/communication/sms-sender';
import { slackMessengerTool, slackMessengerExecutor } from '../tools/communication/slack-messenger';
import { discordMessengerTool, discordMessengerExecutor } from '../tools/communication/discord-messenger';
import { telegramBotTool, telegramBotExecutor } from '../tools/communication/telegram-bot';
import { whatsappBusinessTool, whatsappBusinessExecutor } from '../tools/communication/whatsapp-business';
import { calendarEventTool, calendarEventExecutor } from '../tools/productivity/calendar-event';
import { timezoneConverterTool, timezoneConverterExecutor } from '../tools/productivity/timezone-converter';
import { eventReminderTool, eventReminderExecutor } from '../tools/productivity/event-reminder';
import { taskManagerTool, taskManagerExecutor } from '../tools/productivity/task-manager';
import { noteTakerTool, noteTakerExecutor } from '../tools/productivity/note-taker';
import { pdfGeneratorTool, pdfGeneratorExecutor } from '../tools/document/pdf-generator';
import { markdownConverterTool, markdownConverterExecutor } from '../tools/document/markdown-converter';
import { templateEngineTool, templateEngineExecutor } from '../tools/document/template-engine';
import { docMergerTool, docMergerExecutor } from '../tools/document/doc-merger';
import { qrcodeGeneratorTool, qrcodeGeneratorExecutor } from '../tools/document/qrcode-generator';
import { githubApiTool, githubApiExecutor } from '../tools/api-integration/github-api';
import { stripePaymentsTool, stripePaymentsExecutor } from '../tools/api-integration/stripe-payments';
import { twilioSmsTool, twilioSmsExecutor } from '../tools/api-integration/twilio-sms';
import { sendgridEmailTool, sendgridEmailExecutor } from '../tools/api-integration/sendgrid-email';
import { awsS3Tool, awsS3Executor } from '../tools/api-integration/aws-s3';

/**
 * Tool Registry Configuration
 */
export interface ToolRegistryConfig {
  enabledTools?: string[]; // If undefined, all tools are enabled
  rateLimit?: {
    maxCalls: number;
    windowMs: number;
  };
  timeout?: number;
}

/**
 * Tool Registry
 * Manages all tools and integrates with MCP server
 */
export class ToolRegistry {
  private mcpServer: MCPServer;
  private registeredTools = new Set<string>();

  constructor(mcpServer: MCPServer, private config: ToolRegistryConfig = {}) {
    this.mcpServer = mcpServer;
  }

  /**
   * Register all 89 tools (4 memory tools disabled pending @wai/memory package)
   * 10 core + 19 multimodal + 5 data + 5 visualization + 5 statistics + 5 BI + 6 web scraping + 4 web search + 5 SEO/analytics + 5 email + 5 messaging + 5 productivity + 5 document + 5 API integration
   */
  registerAllTools(): void {
    const tools = [
      // Core Tools (10)
      { tool: fileOperationsTool, executor: fileOperationsExecutor },
      { tool: webRequestsTool, executor: webRequestsExecutor },
      { tool: apiCallingTool, executor: apiCallingExecutor },
      { tool: codeExecutionTool, executor: codeExecutionExecutor },
      { tool: jsonOperationsTool, executor: jsonOperationsExecutor },
      { tool: textProcessingTool, executor: textProcessingExecutor },
      { tool: mathCalculationsTool, executor: mathCalculationsExecutor },
      { tool: datetimeOperationsTool, executor: datetimeOperationsExecutor },
      { tool: randomGenerationTool, executor: randomGenerationExecutor },
      { tool: dataValidationTool, executor: dataValidationExecutor },
      
      // Memory Tools (4) - Temporarily disabled until @wai/memory package is implemented
      // TODO Phase 1: Integrate with mem0Manager for production memory support
      // { tool: memoryStoreTool, executor: memoryStoreExecutor },
      // { tool: memoryRecallTool, executor: memoryRecallExecutor },
      // { tool: memoryUpdateTool, executor: memoryUpdateExecutor },
      // { tool: memoryDeleteTool, executor: memoryDeleteExecutor },
      
      // Multimodal Tools (19)
      { tool: voiceSynthesisTool, executor: voiceSynthesisExecutor },
      { tool: getVoicesTool, executor: getVoicesExecutor },
      { tool: speechToTextTool, executor: speechToTextExecutor },
      { tool: speechTranslationTool, executor: speechTranslationExecutor },
      { tool: videoGenerationTool, executor: videoGenerationExecutor },
      { tool: getVideoStatusTool, executor: getVideoStatusExecutor },
      { tool: musicGenerationTool, executor: musicGenerationExecutor },
      { tool: getMusicStatusTool, executor: getMusicStatusExecutor },
      { tool: dalleImageGenerationTool, executor: dalleImageGenerationExecutor },
      { tool: stableDiffusionTool, executor: stableDiffusionExecutor },
      { tool: getStableDiffusionStatusTool, executor: getStableDiffusionStatusExecutor },
      { tool: imageResizeTool, executor: imageResizeExecutor },
      { tool: imageCropTool, executor: imageCropExecutor },
      { tool: imageFilterTool, executor: imageFilterExecutor },
      { tool: imageWatermarkTool, executor: imageWatermarkExecutor },
      { tool: imageConvertTool, executor: imageConvertExecutor },
      
      // Data Analysis Tools (5)
      { tool: csvOperationsTool, executor: csvOperationsExecutor },
      { tool: excelOperationsTool, executor: excelOperationsExecutor },
      { tool: dataCleaningTool, executor: dataCleaningExecutor },
      { tool: pivotTableTool, executor: pivotTableExecutor },
      { tool: googleSheetsTool, executor: googleSheetsExecutor },
      
      // Visualization Tools (5)
      { tool: chartConfigTool, executor: chartConfigExecutor },
      { tool: tableFormatterTool, executor: tableFormatterExecutor },
      { tool: dashboardConfigTool, executor: dashboardConfigExecutor },
      { tool: dataVizConfigTool, executor: dataVizConfigExecutor },
      { tool: realTimeWidgetTool, executor: realTimeWidgetExecutor },
      
      // Statistical Analysis Tools (5)
      { tool: descriptiveStatsTool, executor: descriptiveStatsExecutor },
      { tool: correlationTool, executor: correlationExecutor },
      { tool: regressionTool, executor: regressionExecutor },
      { tool: timeSeriesTool, executor: timeSeriesExecutor },
      { tool: abTestingTool, executor: abTestingExecutor },
      
      // Business Intelligence Tools (5)
      { tool: kpiTrackerTool, executor: kpiTrackerExecutor },
      { tool: trendAnalyzerTool, executor: trendAnalyzerExecutor },
      { tool: forecasterTool, executor: forecasterExecutor },
      { tool: cohortAnalyzerTool, executor: cohortAnalyzerExecutor },
      { tool: funnelAnalyzerTool, executor: funnelAnalyzerExecutor },
      
      // Web Scraping Tools (6)
      { tool: firecrawlScraperTool, executor: firecrawlScraperExecutor },
      { tool: puppeteerAutomationTool, executor: puppeteerAutomationExecutor },
      { tool: playwrightE2ETool, executor: playwrightE2EExecutor },
      { tool: cheerioParserTool, executor: cheerioParserExecutor },
      { tool: exaSearchTool, executor: exaSearchExecutor },
      { tool: sitemapGeneratorTool, executor: sitemapGeneratorExecutor },
      
      // Web Search Tools (4)
      { tool: perplexitySearchTool, executor: perplexitySearchExecutor },
      { tool: googleSearchTool, executor: googleSearchExecutor },
      { tool: bingSearchTool, executor: bingSearchExecutor },
      { tool: duckduckgoSearchTool, executor: duckduckgoSearchExecutor },
      
      // SEO & Analytics Tools (5)
      { tool: seoAnalyzerTool, executor: seoAnalyzerExecutor },
      { tool: keywordResearchTool, executor: keywordResearchExecutor },
      { tool: backlinkCheckerTool, executor: backlinkCheckerExecutor },
      { tool: metaTagGeneratorTool, executor: metaTagGeneratorExecutor },
      { tool: googleAnalyticsTool, executor: googleAnalyticsExecutor },
      
      // Communication/Email Tools (5)
      { tool: emailSenderTool, executor: emailSenderExecutor },
      { tool: emailParserTool, executor: emailParserExecutor },
      { tool: emailTemplateTool, executor: emailTemplateExecutor },
      { tool: bulkEmailTool, executor: bulkEmailExecutor },
      { tool: emailValidationTool, executor: emailValidationExecutor },
      
      // Communication/Messaging Tools (5)
      { tool: smsSenderTool, executor: smsSenderExecutor },
      { tool: slackMessengerTool, executor: slackMessengerExecutor },
      { tool: discordMessengerTool, executor: discordMessengerExecutor },
      { tool: telegramBotTool, executor: telegramBotExecutor },
      { tool: whatsappBusinessTool, executor: whatsappBusinessExecutor },
      
      // Productivity Tools (5)
      { tool: calendarEventTool, executor: calendarEventExecutor },
      { tool: timezoneConverterTool, executor: timezoneConverterExecutor },
      { tool: eventReminderTool, executor: eventReminderExecutor },
      { tool: taskManagerTool, executor: taskManagerExecutor },
      { tool: noteTakerTool, executor: noteTakerExecutor },
      
      // Document Tools (5)
      { tool: pdfGeneratorTool, executor: pdfGeneratorExecutor },
      { tool: markdownConverterTool, executor: markdownConverterExecutor },
      { tool: templateEngineTool, executor: templateEngineExecutor },
      { tool: docMergerTool, executor: docMergerExecutor },
      { tool: qrcodeGeneratorTool, executor: qrcodeGeneratorExecutor },
      
      // API Integration Tools (5) 🎉 80 TOOLS COMPLETE!
      { tool: githubApiTool, executor: githubApiExecutor },
      { tool: stripePaymentsTool, executor: stripePaymentsExecutor },
      { tool: twilioSmsTool, executor: twilioSmsExecutor },
      { tool: sendgridEmailTool, executor: sendgridEmailExecutor },
      { tool: awsS3Tool, executor: awsS3Executor },
    ];

    for (const { tool, executor } of tools) {
      // Check if tool should be registered
      if (this.config.enabledTools && !this.config.enabledTools.includes(tool.id)) {
        continue;
      }

      // Register with MCP server
      const toolProtocol = this.mcpServer.getToolProtocol();
      toolProtocol.registerTool(tool, executor, {
        enabled: true,
        rateLimit: this.config.rateLimit,
        timeout: this.config.timeout || 30000,
      });

      this.registeredTools.add(tool.id);
    }

    console.log(`✅ Registered ${this.registeredTools.size} tools with MCP server`);
  }

  /**
   * Get list of registered tools
   */
  getRegisteredTools(): string[] {
    return Array.from(this.registeredTools);
  }

  /**
   * Check if a tool is registered
   */
  isToolRegistered(toolId: string): boolean {
    return this.registeredTools.has(toolId);
  }

  /**
   * Get tool statistics
   */
  getStats(): any {
    const toolProtocol = this.mcpServer.getToolProtocol();
    return toolProtocol.getStats();
  }
}

/**
 * Create and initialize tool registry with MCP server
 */
export function createToolRegistry(mcpServer: MCPServer, config?: ToolRegistryConfig): ToolRegistry {
  const registry = new ToolRegistry(mcpServer, config);
  registry.registerAllTools();
  return registry;
}
