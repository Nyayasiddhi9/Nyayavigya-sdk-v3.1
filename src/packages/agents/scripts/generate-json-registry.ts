/**
 * WAI SDK v2.0 - JSON Registry Generator
 * 
 * This script generates the agents-registry-v2.json file with all 275 agents
 * including their complete 22-point system prompts.
 * 
 * Run: npx tsx wai-sdk/packages/agents/scripts/generate-json-registry.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { COMPLETE_AGENT_REGISTRY } from '../src/agent-loader';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface AgentRegistryJSON {
  metadata: {
    version: string;
    generatedAt: string;
    totalAgents: number;
    description: string;
    protocols: string[];
    llmProviders: number;
    models: number;
    mcpTools: number;
    languages: {
      global: number;
      indian: number;
      total: number;
    };
  };
  tiers: {
    executive: number;
    development: number;
    domain: number;
    creative: number;
    qa: number;
    devops: number;
  };
  agents: any[];
}

function generateRegistry(): AgentRegistryJSON {
  // Count agents by tier
  const tierCounts = {
    executive: 0,
    development: 0,
    domain: 0,
    creative: 0,
    qa: 0,
    devops: 0
  };

  for (const agent of COMPLETE_AGENT_REGISTRY) {
    if (agent.tier in tierCounts) {
      tierCounts[agent.tier as keyof typeof tierCounts]++;
    }
  }

  const registry: AgentRegistryJSON = {
    metadata: {
      version: '2.0.0',
      generatedAt: new Date().toISOString(),
      totalAgents: COMPLETE_AGENT_REGISTRY.length,
      description: 'WAI SDK v2.0 Complete Agent Registry - 275 AI Agents with 22-Point System Prompts',
      protocols: ['A2A', 'MCP', 'ROMA L1-L4', 'AG-UI', 'OpenAgent', 'Parlant', 'BMAD'],
      llmProviders: 23,
      models: 750,
      mcpTools: 530,
      languages: {
        global: 19,
        indian: 12,
        total: 31
      }
    },
    tiers: tierCounts,
    agents: COMPLETE_AGENT_REGISTRY.map(agent => ({
      id: agent.id,
      name: agent.name,
      version: agent.version,
      tier: agent.tier,
      romaLevel: agent.romaLevel,
      category: agent.category,
      group: agent.group,
      description: agent.description,
      systemPrompt: agent.systemPrompt,
      capabilities: agent.capabilities,
      tools: agent.tools,
      protocols: agent.protocols,
      preferredModels: agent.preferredModels,
      fallbackModels: agent.fallbackModels,
      operationModes: agent.operationModes,
      securityLevel: agent.securityLevel,
      reportsTo: agent.reportsTo,
      manages: agent.manages,
      collaboratesWith: agent.collaboratesWith,
      supportedLanguages: agent.supportedLanguages,
      guardrails: agent.guardrails,
      costOptimization: agent.costOptimization,
      cam2Monitoring: {
        enabled: true,
        version: "2.0.0",
        metrics: {
          responseLatency: true,
          tokenUsage: true,
          costTracking: true,
          qualityScoring: true,
          errorRate: true,
          throughput: true
        },
        alertThresholds: {
          latencyMs: agent.tier === 'executive' ? 3000 : 5000,
          errorRatePercent: 1.0,
          qualityScoreMin: 0.85
        },
        realTimeStreaming: true,
        dashboardEndpoint: `/api/cam/agents/${agent.id}/metrics`,
        historyRetentionDays: 90
      },
      grpoConfig: {
        enabled: true,
        version: "1.0.0",
        continuousLearning: {
          enabled: true,
          feedbackIntegration: true,
          performanceOptimization: true,
          modelFinetuning: agent.tier === 'executive' || agent.tier === 'development'
        },
        policyOptimization: {
          groupRelativeRanking: true,
          rewardModelIntegration: true,
          safetyConstraints: true
        },
        trainingDataSources: [
          "user-feedback",
          "outcome-tracking",
          "peer-comparison",
          "supervisor-ratings"
        ],
        updateFrequency: "weekly"
      },
      voiceAIConfig: {
        enabled: true,
        twoWayStreaming: true,
        inputProviders: ["whisper-large-v3", "sarvam-stt", "google-speech"],
        outputProviders: ["elevenlabs", "sarvam-tts", "google-tts"],
        realtimeProtocol: "websocket",
        streamingEndpoint: `/api/voice/stream/${agent.id}`,
        supportedLanguages: [
          "en-US", "en-GB", "en-IN", "hi-IN", "bn-IN", "ta-IN", "te-IN", 
          "mr-IN", "gu-IN", "kn-IN", "ml-IN", "pa-IN", "ar-SA", "zh-CN"
        ],
        features: {
          interruptionHandling: true,
          turnTaking: true,
          sentimentDetection: true,
          languageDetection: true,
          speakerDiarization: true
        },
        voiceCloning: agent.tier === 'executive',
        latencyTargetMs: 200
      },
      enterpriseWiring: {
        queenOrchestrator: {
          connected: true,
          taskDecomposition: true,
          algorithms: ["SIMPLE", "ACONIC", "ADaPT", "HTA", "SWARM"]
        },
        memoryIntegration: {
          mem0: true,
          pgvector: true,
          shortTermContext: true,
          longTermMemory: true,
          entityExtraction: true
        },
        toolsIntegration: {
          mcpToolsAccess: true,
          toolCount: 530,
          customToolsEnabled: true
        },
        orchestrationEngine: {
          dualClock: true,
          seedPropagation: true,
          failFast: true
        },
        agentBreeding: {
          canSpawnSubagents: agent.tier === 'executive' || agent.tier === 'development',
          maxSubagents: agent.tier === 'executive' ? 10 : 5
        },
        humanInLoop: {
          approvalWorkflows: true,
          escalationEnabled: true
        },
        collectiveIntelligence: {
          brainstorm: true,
          consensus: true,
          vote: true,
          debate: true,
          synthesis: true
        }
      },
      peerMeshConfig: {
        enabled: true,
        discoveryProtocol: "A2A",
        meshTopology: "dynamic",
        loadBalancing: true,
        failover: true,
        maxPeers: 20
      },
      status: agent.status
    }))
  };

  return registry;
}

async function main() {
  console.log('🚀 Generating WAI SDK v2.0 Agent Registry JSON...');
  
  const registry = generateRegistry();
  
  const outputPath = path.join(__dirname, '..', 'agents-registry-v2.json');
  
  fs.writeFileSync(
    outputPath,
    JSON.stringify(registry, null, 2),
    'utf-8'
  );
  
  console.log(`✅ Registry generated successfully!`);
  console.log(`📊 Total Agents: ${registry.metadata.totalAgents}`);
  console.log(`   - Executive: ${registry.tiers.executive}`);
  console.log(`   - Development: ${registry.tiers.development}`);
  console.log(`   - Domain: ${registry.tiers.domain}`);
  console.log(`   - Creative: ${registry.tiers.creative}`);
  console.log(`   - QA: ${registry.tiers.qa}`);
  console.log(`   - DevOps: ${registry.tiers.devops}`);
  console.log(`📁 Output: ${outputPath}`);
}

main().catch(console.error);
