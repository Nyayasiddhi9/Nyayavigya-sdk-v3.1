/**
 * Script to generate all-267-agents.json from TypeScript definitions
 * 
 * Run with: npx tsx scripts/generate-agents-json.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { ALL_267_AGENTS } from '../src/definitions/all-267-agents-v10';
import { CREATIVE_AGENTS, QA_AGENTS, DEVOPS_AGENTS, ADDITIONAL_DOMAIN_AGENTS } from '../src/definitions/complete-agent-categories';
import { EXTENDED_AGENTS } from '../src/definitions/extended-agents-v10';

// Combine all agents
const allAgents = [
  ...ALL_267_AGENTS,
  ...CREATIVE_AGENTS,
  ...QA_AGENTS,
  ...DEVOPS_AGENTS,
  ...ADDITIONAL_DOMAIN_AGENTS,
  ...EXTENDED_AGENTS
];

// Calculate tier counts
const tierCounts = allAgents.reduce((acc, agent) => {
  acc[agent.tier] = (acc[agent.tier] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

// Build JSON structure
const jsonOutput = {
  metadata: {
    version: "10.0.0",
    generatedAt: new Date().toISOString(),
    totalAgents: allAgents.length,
    description: "WAI SDK Complete Agent Registry - AI Agents with 22-Point System Prompts",
    protocols: ["A2A", "MCP", "ROMA L1-L4", "AG-UI", "OpenAgent"],
    llmProviders: 23,
    models: 750,
    mcpTools: 530
  },
  tiers: tierCounts,
  agents: allAgents.map(agent => ({
    id: agent.id,
    name: agent.name,
    version: agent.version,
    tier: agent.tier,
    romaLevel: agent.romaLevel,
    category: agent.category,
    group: agent.group,
    description: agent.description,
    capabilities: agent.capabilities,
    tools: agent.tools,
    protocols: agent.protocols,
    preferredModels: agent.preferredModels,
    fallbackModels: agent.fallbackModels,
    operationMode: agent.operationMode,
    securityLevel: agent.securityLevel,
    reportsTo: agent.reportsTo,
    manages: agent.manages,
    collaboratesWith: agent.collaboratesWith,
    supportedLanguages: agent.supportedLanguages,
    guardrails: agent.guardrails,
    costOptimization: agent.costOptimization,
    status: agent.status
  }))
};

// Write to file
const outputPath = path.join(__dirname, '..', 'all-267-agents.json');
fs.writeFileSync(outputPath, JSON.stringify(jsonOutput, null, 2));

console.log(`✅ Generated ${allAgents.length} agents to all-267-agents.json`);
console.log(`   Tiers:`, tierCounts);
