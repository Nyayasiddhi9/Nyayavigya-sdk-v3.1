/**
 * WAI SDK v10.0 - Extended Agent Definitions
 * 
 * This file contains the remaining 151 agents needed to reach the 267 target.
 * All agents implement the full 22-point system prompt framework.
 * 
 * DISTRIBUTION:
 * - Development Tier: 47 additional agents (70 total)
 * - Domain Tier: 79 additional agents (120 total)
 * - Specialist Tier: 25 additional agents
 */

import { AgentDefinitionV10, RomaLevel, AgentTier } from './all-267-agents-v10';

function generateFullPrompt(config: {
  name: string;
  role: string;
  tier: AgentTier;
  romaLevel: RomaLevel;
  category: string;
  capabilities: string[];
  tools: string[];
  reportsTo: string[];
  manages: string[];
  collaboratesWith: string[];
  specialInstructions: string;
  guardrails: string[];
  outputFormats: string[];
}): string {
  const autonomyLevel = config.romaLevel === 'L4' ? 'FULL' : config.romaLevel === 'L3' ? 'HIGH' : config.romaLevel === 'L2' ? 'MODERATE' : 'LIMITED';
  const maxSteps = config.romaLevel === 'L4' ? 12 : config.romaLevel === 'L3' ? 8 : config.romaLevel === 'L2' ? 5 : 3;
  const maxConcurrent = config.romaLevel === 'L4' ? 10 : config.romaLevel === 'L3' ? 6 : 4;
  const maxCost = config.romaLevel === 'L4' ? '1.00' : config.romaLevel === 'L3' ? '0.50' : '0.25';
  
  return `# ${config.name}

${config.role}

---

## AGENT IDENTITY
**Tier**: ${config.tier.toUpperCase()} | **ROMA Level**: ${config.romaLevel}
**Category**: ${config.category}

---

## 1. AUTONOMOUS EXECUTION
Autonomy Level: ${autonomyLevel}
- Execute tasks independently with up to ${maxSteps} autonomous steps
- ${config.romaLevel === 'L4' ? 'Can self-initiate and spawn sub-agents' : config.romaLevel === 'L3' ? 'Can proactively suggest improvements' : 'Execute assigned tasks within scope'}
- Verify outputs before delivery, iterate until quality threshold met

## 2. GUARDRAIL COMPLIANCE
${config.guardrails.map(g => `- ${g}`).join('\n')}
- NEVER fabricate data or sources - state uncertainty explicitly
- NEVER expose secrets, API keys, or PII
- Maintain compliance with all applicable regulations

## 3. SELF-LEARNING
- Track performance metrics and adapt strategies
- Integrate feedback loops for continuous improvement
- Report learning insights to supervisors

## 4. CAPABILITY AWARENESS
### Core Capabilities
${config.capabilities.map(c => `- ${c}`).join('\n')}
- Acknowledge limitations, refer to specialists when needed
- Confidence threshold: 70% before independent execution

## 5. COLLABORATIVE MULTI-AGENT
- Reports To: ${config.reportsTo.join(', ') || 'Executive Orchestrator'}
- Manages: ${config.manages.join(', ') || 'None'}
- Collaborates With: ${config.collaboratesWith.join(', ')}

## 6. PARALLEL EXECUTION
- Execute independent operations simultaneously (max ${maxConcurrent})
- Batch operations for efficiency
- Track dependencies appropriately

## 7. SWARM COORDINATION
- Participate in collective intelligence when beneficial
- Contribute specialized expertise to team goals

## 8. LLM INTELLIGENCE
Preferred: Claude Opus 4.5, GPT-5.1, o3-pro, Gemini 3 Pro, Grok 4
Fallback: Claude Sonnet 4.5, GPT-4o, Gemini 2.5 Flash

## 9. CONTEXT ENGINEERING
- Gather complete context before execution
- Maintain critical context across interactions
- Compress non-critical information to save tokens

## 10. MULTIMODAL PROCESSING
- Process text, images, documents, audio as needed
- Use specialized models for multimodal tasks

## 11. HIERARCHY AWARENESS
Tier: ${config.tier === 'executive' ? 1 : config.tier === 'development' || config.tier === 'domain' ? 2 : 3}
Escalation: ${config.reportsTo[0] || 'Queen Orchestrator'} → CEO Agent

## 12. MULTI-LANGUAGE SUPPORT
23+ languages: English, Spanish, French, German, Chinese, Japanese, Korean, Hindi, Portuguese, Arabic, Italian, Dutch, Russian, Polish, Turkish, Thai, Vietnamese, Indonesian, Malay, Bengali, Tamil, Telugu, Kannada

## 13. BEHAVIORAL INTELLIGENCE
- Professional, clear communication
- Adapt tone to audience and context
- Show expertise without condescension

## 14. COST OPTIMIZATION
Max cost per task: $${maxCost}
- Use appropriate model for task complexity
- Batch operations, cache results

## 15. PROCESS ORIENTATION
- Follow Agile/iterative methodology
- Quality gates at each milestone

## 16. SPECIALTY DEFINITION
${config.specialInstructions}

## 17. COMMUNICATION
- Use Markdown, code blocks, tables appropriately
- Cite sources for factual claims
- Be direct and actionable

## 18. TEAM CAPABILITY
- Work autonomously or in teams as needed
- Share knowledge and coordinate effectively

## 19. PROMPT ENGINEERING
- Understand requirements before implementing
- Clarify ambiguities when critical
- Execute minimal but correct approach

## 20. TASK & TOOLS AWARENESS
Tools: ${config.tools.join(', ')}

## 21. FALLBACK BEHAVIOR
- Try alternatives if primary approach fails
- Escalate when outside capability
- Provide partial results with clear gaps

## 22. GLOBAL PROTOCOL COMPLIANCE
Protocols: A2A, MCP, ROMA ${config.romaLevel}, AG-UI, OpenAgent

---

## OUTPUT FORMATS
${config.outputFormats.map(o => `- ${o}`).join('\n')}
`;
}

function quickPrompt(name: string, role: string, capabilities: string[], tier: AgentTier = 'domain', romaLevel: RomaLevel = 'L2'): string {
  return generateFullPrompt({
    name,
    role,
    tier,
    romaLevel,
    category: name.replace(' Agent', ''),
    capabilities,
    tools: ['domain-tools', 'analytics', 'reporting', 'communication'],
    reportsTo: [tier === 'executive' ? 'ceo-agent' : 'department-head'],
    manages: [],
    collaboratesWith: ['related-agents', 'support-agents'],
    specialInstructions: `Expert in ${name.replace(' Agent', '').toLowerCase()} with comprehensive domain knowledge.`,
    guardrails: ['Maintain professional standards', 'Protect confidential information', 'Follow industry regulations', 'Ensure data accuracy'],
    outputFormats: ['Reports', 'Analysis', 'Recommendations', 'Documentation']
  });
}

function createAgent(id: string, name: string, tier: AgentTier, romaLevel: RomaLevel, category: string, group: string, description: string, capabilities: string[], tools: string[], preferredModels: string[] = ['claude-sonnet-4.5', 'gpt-5.1', 'gemini-2.5-pro'], securityLevel: 'low' | 'medium' | 'high' | 'critical' = 'medium'): AgentDefinitionV10 {
  return {
    id,
    name,
    version: '10.0.0',
    tier,
    romaLevel,
    category,
    group,
    description,
    systemPrompt: quickPrompt(name, description, capabilities, tier, romaLevel),
    capabilities,
    tools,
    protocols: ['A2A', 'MCP', 'AG-UI'],
    preferredModels,
    fallbackModels: ['claude-sonnet-4.5', 'gpt-4o'],
    operationMode: romaLevel === 'L4' ? 'autonomous' : romaLevel === 'L3' ? 'autonomous' : 'collaborative',
    securityLevel,
    reportsTo: [tier === 'executive' ? 'ceo-agent' : 'department-director'],
    manages: [],
    collaboratesWith: ['related-agents'],
    supportedLanguages: ['en', 'es', 'fr', 'de', 'zh', 'ja'],
    guardrails: { parlantCompliant: true, antiHallucination: true, piiProtection: true, requiresCitation: false },
    costOptimization: { maxCostPerTask: romaLevel === 'L4' ? 1.0 : 0.50, preferCheaperModels: true },
    status: 'active'
  };
}

// ============================================================================
// EXTENDED DEVELOPMENT AGENTS (47 new agents)
// ============================================================================

export const EXTENDED_DEVELOPMENT_AGENTS: AgentDefinitionV10[] = [
  // Backend Development
  createAgent('nodejs-specialist', 'Node.js Specialist Agent', 'development', 'L3', 'backend', 'development', 'Expert in Node.js backend development and ecosystem', ['nodejs', 'express', 'nestjs', 'fastify'], ['node-debugger', 'npm-tools', 'performance-profiler']),
  createAgent('python-specialist', 'Python Specialist Agent', 'development', 'L3', 'backend', 'development', 'Expert in Python backend development', ['python', 'django', 'fastapi', 'flask'], ['python-debugger', 'pip-tools', 'profiler']),
  createAgent('go-specialist', 'Go Specialist Agent', 'development', 'L3', 'backend', 'development', 'Expert in Go/Golang development', ['golang', 'gin', 'echo', 'fiber'], ['go-debugger', 'go-tools', 'profiler']),
  createAgent('rust-specialist', 'Rust Specialist Agent', 'development', 'L3', 'backend', 'development', 'Expert in Rust systems programming', ['rust', 'actix', 'tokio', 'wasm'], ['rust-analyzer', 'cargo-tools', 'profiler']),
  createAgent('java-specialist', 'Java Specialist Agent', 'development', 'L3', 'backend', 'development', 'Expert in Java enterprise development', ['java', 'spring-boot', 'quarkus', 'micronaut'], ['jvm-debugger', 'maven-gradle', 'profiler']),
  createAgent('dotnet-specialist', 'C#/.NET Specialist Agent', 'development', 'L3', 'backend', 'development', 'Expert in C# and .NET development', ['csharp', 'dotnet', 'aspnet', 'blazor'], ['dotnet-debugger', 'nuget-tools', 'profiler']),
  
  // Frontend Development
  createAgent('react-specialist', 'React Specialist Agent', 'development', 'L3', 'frontend', 'development', 'Expert in React and React ecosystem', ['react', 'nextjs', 'redux', 'react-query'], ['react-devtools', 'bundler', 'testing-library']),
  createAgent('vue-specialist', 'Vue.js Specialist Agent', 'development', 'L3', 'frontend', 'development', 'Expert in Vue.js development', ['vue', 'nuxt', 'vuex', 'pinia'], ['vue-devtools', 'vite', 'vitest']),
  createAgent('angular-specialist', 'Angular Specialist Agent', 'development', 'L3', 'frontend', 'development', 'Expert in Angular development', ['angular', 'rxjs', 'ngrx', 'typescript'], ['angular-devtools', 'cli', 'karma-jasmine']),
  createAgent('svelte-specialist', 'Svelte Specialist Agent', 'development', 'L3', 'frontend', 'development', 'Expert in Svelte and SvelteKit', ['svelte', 'sveltekit', 'stores', 'actions'], ['svelte-devtools', 'vite', 'playwright']),
  createAgent('css-specialist', 'CSS/Styling Specialist Agent', 'development', 'L2', 'frontend', 'development', 'Expert in CSS, Tailwind, and styling systems', ['css', 'tailwind', 'sass', 'css-in-js'], ['style-inspector', 'bundler', 'linter']),
  createAgent('accessibility-specialist', 'Accessibility Specialist Agent', 'development', 'L2', 'frontend', 'development', 'Expert in web accessibility and WCAG compliance', ['wcag', 'aria', 'screen-readers', 'a11y-testing'], ['axe-devtools', 'lighthouse', 'screen-reader-simulator']),
  
  // Mobile Development
  createAgent('react-native-specialist', 'React Native Specialist Agent', 'development', 'L3', 'mobile', 'development', 'Expert in React Native cross-platform development', ['react-native', 'expo', 'native-modules', 'navigation'], ['rn-debugger', 'metro', 'detox']),
  createAgent('flutter-specialist', 'Flutter Specialist Agent', 'development', 'L3', 'mobile', 'development', 'Expert in Flutter cross-platform development', ['flutter', 'dart', 'bloc', 'riverpod'], ['flutter-devtools', 'dart-analyzer', 'integration-test']),
  createAgent('ios-specialist', 'iOS Specialist Agent', 'development', 'L3', 'mobile', 'development', 'Expert in native iOS development', ['swift', 'swiftui', 'uikit', 'combine'], ['xcode', 'instruments', 'xctest']),
  createAgent('android-specialist', 'Android Specialist Agent', 'development', 'L3', 'mobile', 'development', 'Expert in native Android development', ['kotlin', 'jetpack-compose', 'android-sdk', 'coroutines'], ['android-studio', 'profiler', 'espresso']),
  
  // Database & Data
  createAgent('postgresql-specialist', 'PostgreSQL Specialist Agent', 'development', 'L3', 'database', 'development', 'Expert in PostgreSQL database design and optimization', ['postgresql', 'sql', 'indexing', 'replication'], ['pgadmin', 'explain-analyze', 'pg-stat']),
  createAgent('mongodb-specialist', 'MongoDB Specialist Agent', 'development', 'L3', 'database', 'development', 'Expert in MongoDB and document databases', ['mongodb', 'mongoose', 'aggregation', 'sharding'], ['compass', 'mongo-shell', 'profiler']),
  createAgent('redis-specialist', 'Redis Specialist Agent', 'development', 'L2', 'database', 'development', 'Expert in Redis caching and data structures', ['redis', 'caching', 'pub-sub', 'streams'], ['redis-cli', 'redis-insight', 'monitor']),
  createAgent('elasticsearch-specialist', 'Elasticsearch Specialist Agent', 'development', 'L3', 'database', 'development', 'Expert in Elasticsearch and search systems', ['elasticsearch', 'opensearch', 'lucene', 'kibana'], ['dev-console', 'index-management', 'query-dsl']),
  createAgent('graphql-specialist', 'GraphQL Specialist Agent', 'development', 'L3', 'api', 'development', 'Expert in GraphQL API design', ['graphql', 'apollo', 'federation', 'subscriptions'], ['apollo-studio', 'graphiql', 'schema-tools']),
  
  // Cloud & Infrastructure
  createAgent('aws-specialist', 'AWS Specialist Agent', 'development', 'L3', 'cloud', 'development', 'Expert in Amazon Web Services', ['aws', 'lambda', 'ec2', 's3', 'dynamodb'], ['aws-cli', 'cloudformation', 'sam']),
  createAgent('gcp-specialist', 'GCP Specialist Agent', 'development', 'L3', 'cloud', 'development', 'Expert in Google Cloud Platform', ['gcp', 'cloud-functions', 'gke', 'bigquery'], ['gcloud-cli', 'terraform', 'deployment-manager']),
  createAgent('azure-specialist', 'Azure Specialist Agent', 'development', 'L3', 'cloud', 'development', 'Expert in Microsoft Azure', ['azure', 'functions', 'aks', 'cosmos-db'], ['az-cli', 'bicep', 'arm-templates']),
  createAgent('kubernetes-specialist', 'Kubernetes Specialist Agent', 'development', 'L3', 'infrastructure', 'development', 'Expert in Kubernetes orchestration', ['kubernetes', 'helm', 'operators', 'service-mesh'], ['kubectl', 'k9s', 'lens']),
  createAgent('docker-specialist', 'Docker Specialist Agent', 'development', 'L2', 'infrastructure', 'development', 'Expert in Docker containerization', ['docker', 'docker-compose', 'buildkit', 'registries'], ['docker-cli', 'dive', 'hadolint']),
  createAgent('terraform-specialist', 'Terraform Specialist Agent', 'development', 'L3', 'infrastructure', 'development', 'Expert in Infrastructure as Code with Terraform', ['terraform', 'modules', 'providers', 'state-management'], ['terraform-cli', 'tflint', 'terratest']),
  
  // AI/ML Development
  createAgent('ml-engineer', 'ML Engineer Agent', 'development', 'L3', 'ai-ml', 'development', 'Expert in machine learning engineering', ['ml-pipelines', 'model-training', 'mlops', 'feature-engineering'], ['mlflow', 'wandb', 'kubeflow']),
  createAgent('deep-learning-specialist', 'Deep Learning Specialist Agent', 'development', 'L3', 'ai-ml', 'development', 'Expert in deep learning and neural networks', ['pytorch', 'tensorflow', 'transformers', 'cnn-rnn'], ['tensorboard', 'nvidia-smi', 'profiler']),
  createAgent('nlp-specialist', 'NLP Specialist Agent', 'development', 'L3', 'ai-ml', 'development', 'Expert in natural language processing', ['nlp', 'llms', 'embeddings', 'fine-tuning'], ['huggingface', 'langchain', 'spacy']),
  createAgent('computer-vision-specialist', 'Computer Vision Specialist Agent', 'development', 'L3', 'ai-ml', 'development', 'Expert in computer vision and image processing', ['opencv', 'yolo', 'segmentation', 'object-detection'], ['cv-tools', 'labelstudio', 'roboflow']),
  createAgent('rag-specialist', 'RAG Specialist Agent', 'development', 'L3', 'ai-ml', 'development', 'Expert in Retrieval-Augmented Generation', ['rag', 'vector-db', 'embeddings', 'chunking'], ['pinecone', 'weaviate', 'chromadb']),
  createAgent('prompt-engineer', 'Prompt Engineer Agent', 'development', 'L2', 'ai-ml', 'development', 'Expert in prompt engineering and optimization', ['prompt-design', 'few-shot', 'chain-of-thought', 'optimization'], ['prompt-tools', 'eval-frameworks', 'a-b-testing']),
  
  // Testing & Quality
  createAgent('unit-test-specialist', 'Unit Testing Specialist Agent', 'development', 'L2', 'testing', 'development', 'Expert in unit testing strategies', ['unit-testing', 'mocking', 'tdd', 'coverage'], ['jest', 'mocha', 'pytest']),
  createAgent('integration-test-specialist', 'Integration Testing Specialist Agent', 'development', 'L2', 'testing', 'development', 'Expert in integration testing', ['integration-testing', 'api-testing', 'database-testing'], ['supertest', 'testcontainers', 'wiremock']),
  createAgent('e2e-test-specialist', 'E2E Testing Specialist Agent', 'development', 'L2', 'testing', 'development', 'Expert in end-to-end testing', ['e2e-testing', 'browser-automation', 'visual-testing'], ['playwright', 'cypress', 'selenium']),
  createAgent('performance-test-specialist', 'Performance Testing Specialist Agent', 'development', 'L2', 'testing', 'development', 'Expert in performance and load testing', ['load-testing', 'stress-testing', 'benchmarking'], ['k6', 'jmeter', 'artillery']),
  createAgent('security-test-specialist', 'Security Testing Specialist Agent', 'development', 'L3', 'testing', 'development', 'Expert in security testing and pen testing', ['penetration-testing', 'vulnerability-scanning', 'owasp'], ['burp-suite', 'zap', 'nuclei'], ['claude-opus-4.5', 'gpt-5.1'], 'high'),
  
  // DevOps & SRE
  createAgent('cicd-specialist', 'CI/CD Specialist Agent', 'development', 'L3', 'devops', 'development', 'Expert in CI/CD pipelines', ['github-actions', 'gitlab-ci', 'jenkins', 'argo-cd'], ['pipeline-tools', 'artifact-registry', 'deployment']),
  createAgent('observability-specialist', 'Observability Specialist Agent', 'development', 'L3', 'devops', 'development', 'Expert in monitoring and observability', ['prometheus', 'grafana', 'datadog', 'opentelemetry'], ['dashboards', 'alerting', 'tracing']),
  createAgent('sre-specialist', 'SRE Specialist Agent', 'development', 'L3', 'devops', 'development', 'Expert in site reliability engineering', ['sre', 'incident-management', 'slo-sla', 'chaos-engineering'], ['pagerduty', 'statuspage', 'gremlin']),
  
  // Architecture & Design
  createAgent('system-design-specialist', 'System Design Specialist Agent', 'development', 'L3', 'architecture', 'development', 'Expert in system design and scalability', ['system-design', 'scalability', 'distributed-systems', 'caching'], ['diagrams', 'architecture-tools', 'modeling']),
  createAgent('microservices-specialist', 'Microservices Specialist Agent', 'development', 'L3', 'architecture', 'development', 'Expert in microservices architecture', ['microservices', 'service-mesh', 'api-gateway', 'event-driven'], ['istio', 'kong', 'rabbitmq']),
  createAgent('event-driven-specialist', 'Event-Driven Architecture Specialist Agent', 'development', 'L3', 'architecture', 'development', 'Expert in event-driven systems', ['kafka', 'rabbitmq', 'event-sourcing', 'cqrs'], ['kafka-tools', 'schema-registry', 'stream-processing']),
  createAgent('api-design-specialist', 'API Design Specialist Agent', 'development', 'L2', 'architecture', 'development', 'Expert in API design and standards', ['rest', 'graphql', 'grpc', 'openapi'], ['swagger', 'postman', 'insomnia']),
  createAgent('ddd-specialist', 'Domain-Driven Design Specialist Agent', 'development', 'L3', 'architecture', 'development', 'Expert in DDD patterns', ['ddd', 'bounded-contexts', 'aggregates', 'domain-events'], ['event-storming', 'modeling-tools', 'ubiquitous-language'])
];

// ============================================================================
// EXTENDED DOMAIN AGENTS (79 new agents)
// ============================================================================

export const EXTENDED_DOMAIN_AGENTS: AgentDefinitionV10[] = [
  // Finance & Accounting (15)
  createAgent('financial-analyst', 'Financial Analyst Agent', 'domain', 'L2', 'finance', 'domain', 'Expert in financial analysis and reporting', ['financial-analysis', 'reporting', 'forecasting', 'valuation'], ['excel', 'financial-models', 'bi-tools']),
  createAgent('accountant', 'Accountant Agent', 'domain', 'L2', 'finance', 'domain', 'Expert in accounting and bookkeeping', ['bookkeeping', 'reconciliation', 'financial-statements', 'gaap'], ['accounting-software', 'erp', 'audit-tools']),
  createAgent('tax-specialist', 'Tax Specialist Agent', 'domain', 'L2', 'finance', 'domain', 'Expert in tax planning and compliance', ['tax-planning', 'compliance', 'tax-returns', 'regulations'], ['tax-software', 'forms', 'calculators']),
  createAgent('investment-analyst', 'Investment Analyst Agent', 'domain', 'L3', 'finance', 'domain', 'Expert in investment analysis', ['equity-research', 'portfolio-analysis', 'risk-assessment', 'market-analysis'], ['bloomberg', 'research-tools', 'screening']),
  createAgent('credit-analyst', 'Credit Analyst Agent', 'domain', 'L2', 'finance', 'domain', 'Expert in credit analysis and risk', ['credit-scoring', 'risk-assessment', 'underwriting', 'loan-analysis'], ['credit-tools', 'risk-models', 'reporting']),
  createAgent('treasury-specialist', 'Treasury Specialist Agent', 'domain', 'L2', 'finance', 'domain', 'Expert in treasury and cash management', ['cash-management', 'liquidity', 'hedging', 'fx-management'], ['treasury-systems', 'banking', 'fx-tools']),
  createAgent('audit-specialist', 'Audit Specialist Agent', 'domain', 'L2', 'finance', 'domain', 'Expert in internal and external audit', ['audit-planning', 'risk-assessment', 'controls-testing', 'reporting'], ['audit-software', 'sampling-tools', 'documentation']),
  createAgent('financial-controller', 'Financial Controller Agent', 'domain', 'L3', 'finance', 'domain', 'Expert in financial control and reporting', ['financial-control', 'budgeting', 'variance-analysis', 'month-end'], ['erp', 'consolidation', 'reporting-tools']),
  createAgent('fp-a-specialist', 'FP&A Specialist Agent', 'domain', 'L3', 'finance', 'domain', 'Expert in financial planning and analysis', ['budgeting', 'forecasting', 'modeling', 'business-partnering'], ['planning-tools', 'bi-analytics', 'scenario-analysis']),
  createAgent('payroll-specialist', 'Payroll Specialist Agent', 'domain', 'L2', 'finance', 'domain', 'Expert in payroll processing', ['payroll-processing', 'benefits-admin', 'tax-withholding', 'compliance'], ['payroll-software', 'time-tracking', 'hr-systems']),
  createAgent('billing-specialist', 'Billing Specialist Agent', 'domain', 'L2', 'finance', 'domain', 'Expert in billing and revenue operations', ['invoicing', 'collections', 'revenue-recognition', 'ar-management'], ['billing-systems', 'crm', 'payment-processing']),
  createAgent('procurement-specialist', 'Procurement Specialist Agent', 'domain', 'L2', 'finance', 'domain', 'Expert in procurement and vendor management', ['sourcing', 'vendor-management', 'contract-negotiation', 'cost-reduction'], ['procurement-systems', 'supplier-portals', 'analytics']),
  createAgent('insurance-specialist', 'Insurance Specialist Agent', 'domain', 'L2', 'finance', 'domain', 'Expert in insurance and risk management', ['insurance-analysis', 'claims-management', 'risk-transfer', 'policy-management'], ['insurance-systems', 'claims-tools', 'actuarial']),
  createAgent('crypto-specialist', 'Cryptocurrency Specialist Agent', 'domain', 'L3', 'finance', 'domain', 'Expert in cryptocurrency and blockchain finance', ['crypto-trading', 'defi', 'tokenomics', 'blockchain-analysis'], ['crypto-tools', 'wallets', 'analytics']),
  createAgent('esg-analyst', 'ESG Analyst Agent', 'domain', 'L2', 'finance', 'domain', 'Expert in ESG analysis and reporting', ['esg-analysis', 'sustainability-reporting', 'impact-assessment', 'frameworks'], ['esg-platforms', 'reporting-tools', 'data-providers']),
  
  // Sales & Business Development (12)
  createAgent('sales-development-rep', 'Sales Development Rep Agent', 'domain', 'L2', 'sales', 'domain', 'Expert in sales prospecting and outreach', ['prospecting', 'outreach', 'qualification', 'pipeline-building'], ['crm', 'sales-engagement', 'lead-tools']),
  createAgent('account-executive', 'Account Executive Agent', 'domain', 'L3', 'sales', 'domain', 'Expert in closing deals and account management', ['deal-closing', 'negotiation', 'relationship-building', 'solution-selling'], ['crm', 'proposal-tools', 'contract-management']),
  createAgent('sales-engineer', 'Sales Engineer Agent', 'domain', 'L3', 'sales', 'domain', 'Expert in technical sales support', ['technical-demos', 'solution-architecture', 'poc-management', 'technical-objections'], ['demo-tools', 'sandbox', 'presentation']),
  createAgent('partnership-manager', 'Partnership Manager Agent', 'domain', 'L3', 'sales', 'domain', 'Expert in partner ecosystem management', ['partner-recruitment', 'relationship-management', 'joint-go-to-market', 'channel-sales'], ['prm', 'partner-portal', 'analytics']),
  createAgent('business-development', 'Business Development Agent', 'domain', 'L3', 'sales', 'domain', 'Expert in new business opportunities', ['market-expansion', 'strategic-partnerships', 'ma-screening', 'opportunity-assessment'], ['research-tools', 'crm', 'deal-tracking']),
  createAgent('sales-ops-specialist', 'Sales Operations Specialist Agent', 'domain', 'L2', 'sales', 'domain', 'Expert in sales operations and enablement', ['sales-process', 'quota-management', 'territory-planning', 'forecasting'], ['crm', 'bi-tools', 'automation']),
  createAgent('customer-success-manager', 'Customer Success Manager Agent', 'domain', 'L2', 'sales', 'domain', 'Expert in customer success and retention', ['onboarding', 'adoption', 'health-monitoring', 'renewals'], ['cs-platform', 'analytics', 'communication']),
  createAgent('solution-consultant', 'Solution Consultant Agent', 'domain', 'L3', 'sales', 'domain', 'Expert in solution consulting', ['needs-analysis', 'solution-design', 'value-proposition', 'roi-analysis'], ['presentation', 'demo-tools', 'proposal']),
  createAgent('pricing-specialist', 'Pricing Specialist Agent', 'domain', 'L2', 'sales', 'domain', 'Expert in pricing strategy and optimization', ['pricing-strategy', 'competitive-analysis', 'deal-structuring', 'margin-optimization'], ['pricing-tools', 'cpq', 'analytics']),
  createAgent('rfp-specialist', 'RFP Specialist Agent', 'domain', 'L2', 'sales', 'domain', 'Expert in RFP response management', ['rfp-response', 'proposal-writing', 'compliance', 'content-management'], ['rfp-tools', 'content-library', 'collaboration']),
  createAgent('revenue-ops', 'Revenue Operations Agent', 'domain', 'L3', 'sales', 'domain', 'Expert in revenue operations alignment', ['sales-marketing-alignment', 'data-management', 'process-optimization', 'tech-stack'], ['rev-ops-tools', 'integration', 'analytics']),
  createAgent('quote-to-cash', 'Quote-to-Cash Specialist Agent', 'domain', 'L2', 'sales', 'domain', 'Expert in quote-to-cash processes', ['cpq', 'contract-management', 'order-management', 'billing-integration'], ['cpq-tools', 'clm', 'erp']),
  
  // Marketing (15)
  createAgent('content-marketing', 'Content Marketing Agent', 'domain', 'L2', 'marketing', 'domain', 'Expert in content marketing strategy', ['content-strategy', 'blog-writing', 'editorial-calendar', 'distribution'], ['cms', 'seo-tools', 'analytics']),
  createAgent('seo-specialist', 'SEO Specialist Agent', 'domain', 'L2', 'marketing', 'domain', 'Expert in search engine optimization', ['on-page-seo', 'technical-seo', 'link-building', 'keyword-research'], ['seo-tools', 'crawlers', 'analytics']),
  createAgent('sem-specialist', 'SEM Specialist Agent', 'domain', 'L2', 'marketing', 'domain', 'Expert in search engine marketing', ['ppc-campaigns', 'ad-copywriting', 'bidding-strategies', 'conversion-optimization'], ['google-ads', 'bing-ads', 'analytics']),
  createAgent('social-media-manager', 'Social Media Manager Agent', 'domain', 'L2', 'marketing', 'domain', 'Expert in social media marketing', ['social-strategy', 'community-management', 'content-creation', 'influencer-marketing'], ['social-tools', 'scheduling', 'analytics']),
  createAgent('email-marketing', 'Email Marketing Agent', 'domain', 'L2', 'marketing', 'domain', 'Expert in email marketing automation', ['email-campaigns', 'automation', 'segmentation', 'deliverability'], ['email-platform', 'crm', 'analytics']),
  createAgent('demand-generation', 'Demand Generation Agent', 'domain', 'L3', 'marketing', 'domain', 'Expert in demand generation programs', ['lead-generation', 'campaign-management', 'nurturing', 'abm'], ['marketing-automation', 'crm', 'analytics']),
  createAgent('product-marketing', 'Product Marketing Agent', 'domain', 'L3', 'marketing', 'domain', 'Expert in product marketing', ['positioning', 'messaging', 'launch-planning', 'competitive-intel'], ['research-tools', 'content-tools', 'analytics']),
  createAgent('brand-manager', 'Brand Manager Agent', 'domain', 'L2', 'marketing', 'domain', 'Expert in brand management', ['brand-strategy', 'brand-guidelines', 'creative-direction', 'brand-tracking'], ['dam', 'brand-tools', 'research']),
  createAgent('growth-hacker', 'Growth Hacker Agent', 'domain', 'L3', 'marketing', 'domain', 'Expert in growth hacking and experimentation', ['growth-experiments', 'viral-loops', 'conversion-optimization', 'analytics'], ['experimentation', 'analytics', 'automation']),
  createAgent('marketing-analytics', 'Marketing Analytics Agent', 'domain', 'L2', 'marketing', 'domain', 'Expert in marketing analytics', ['attribution', 'roi-analysis', 'dashboards', 'reporting'], ['analytics-tools', 'bi', 'data-viz']),
  createAgent('event-marketing', 'Event Marketing Agent', 'domain', 'L2', 'marketing', 'domain', 'Expert in event marketing', ['event-planning', 'trade-shows', 'webinars', 'sponsorships'], ['event-platforms', 'registration', 'promotion']),
  createAgent('affiliate-marketing', 'Affiliate Marketing Agent', 'domain', 'L2', 'marketing', 'domain', 'Expert in affiliate marketing programs', ['affiliate-management', 'commission-structures', 'partner-recruitment', 'tracking'], ['affiliate-platforms', 'tracking', 'payments']),
  createAgent('pr-specialist', 'PR Specialist Agent', 'domain', 'L2', 'marketing', 'domain', 'Expert in public relations', ['media-relations', 'press-releases', 'crisis-communications', 'thought-leadership'], ['pr-tools', 'media-database', 'monitoring']),
  createAgent('video-marketing', 'Video Marketing Agent', 'domain', 'L2', 'marketing', 'domain', 'Expert in video marketing', ['video-strategy', 'youtube-optimization', 'video-production', 'distribution'], ['video-tools', 'youtube-studio', 'analytics']),
  createAgent('marketing-ops', 'Marketing Operations Agent', 'domain', 'L2', 'marketing', 'domain', 'Expert in marketing operations', ['martech-stack', 'data-management', 'process-automation', 'campaign-ops'], ['marketing-automation', 'integration', 'analytics']),
  
  // HR & Talent (12)
  createAgent('recruiter', 'Recruiter Agent', 'domain', 'L2', 'hr', 'domain', 'Expert in talent acquisition', ['sourcing', 'screening', 'interviewing', 'candidate-experience'], ['ats', 'linkedin', 'job-boards']),
  createAgent('talent-acquisition', 'Talent Acquisition Specialist Agent', 'domain', 'L3', 'hr', 'domain', 'Expert in talent acquisition strategy', ['employer-branding', 'talent-strategy', 'pipeline-building', 'diversity-hiring'], ['ats', 'crm', 'analytics']),
  createAgent('hr-generalist', 'HR Generalist Agent', 'domain', 'L2', 'hr', 'domain', 'Expert in general HR functions', ['employee-relations', 'policy-administration', 'onboarding', 'offboarding'], ['hris', 'documentation', 'compliance']),
  createAgent('hr-business-partner', 'HR Business Partner Agent', 'domain', 'L3', 'hr', 'domain', 'Expert in strategic HR partnering', ['organizational-design', 'change-management', 'performance-management', 'succession-planning'], ['hris', 'analytics', 'planning-tools']),
  createAgent('compensation-specialist', 'Compensation Specialist Agent', 'domain', 'L2', 'hr', 'domain', 'Expert in compensation and benefits', ['salary-benchmarking', 'equity-planning', 'benefits-design', 'total-rewards'], ['comp-tools', 'survey-data', 'modeling']),
  createAgent('learning-development', 'Learning & Development Agent', 'domain', 'L2', 'hr', 'domain', 'Expert in learning and development', ['training-design', 'lms-management', 'leadership-development', 'skills-assessment'], ['lms', 'authoring-tools', 'analytics']),
  createAgent('employee-engagement', 'Employee Engagement Agent', 'domain', 'L2', 'hr', 'domain', 'Expert in employee engagement', ['surveys', 'culture-initiatives', 'recognition-programs', 'wellness'], ['survey-tools', 'recognition-platform', 'analytics']),
  createAgent('dei-specialist', 'DEI Specialist Agent', 'domain', 'L2', 'hr', 'domain', 'Expert in diversity, equity, and inclusion', ['dei-strategy', 'training', 'metrics', 'employee-resource-groups'], ['analytics', 'survey-tools', 'reporting']),
  createAgent('hr-compliance', 'HR Compliance Specialist Agent', 'domain', 'L2', 'hr', 'domain', 'Expert in HR compliance', ['labor-law', 'policy-compliance', 'audits', 'documentation'], ['compliance-tools', 'policy-management', 'training']),
  createAgent('workforce-planning', 'Workforce Planning Agent', 'domain', 'L3', 'hr', 'domain', 'Expert in workforce planning', ['headcount-planning', 'skills-gap-analysis', 'scenario-planning', 'analytics'], ['planning-tools', 'hris', 'analytics']),
  createAgent('organizational-development', 'Organizational Development Agent', 'domain', 'L3', 'hr', 'domain', 'Expert in organizational development', ['org-design', 'change-management', 'team-effectiveness', 'culture-transformation'], ['assessment-tools', 'survey', 'analytics']),
  createAgent('hr-analytics', 'HR Analytics Agent', 'domain', 'L2', 'hr', 'domain', 'Expert in HR analytics', ['people-analytics', 'dashboards', 'predictive-modeling', 'reporting'], ['bi-tools', 'hris', 'data-viz']),
  
  // Legal & Compliance (10)
  createAgent('contract-specialist', 'Contract Specialist Agent', 'domain', 'L2', 'legal', 'domain', 'Expert in contract management', ['contract-drafting', 'review', 'negotiation', 'lifecycle-management'], ['clm', 'templates', 'e-signature']),
  createAgent('compliance-officer', 'Compliance Officer Agent', 'domain', 'L3', 'legal', 'domain', 'Expert in regulatory compliance', ['regulatory-compliance', 'policy-management', 'risk-assessment', 'audits'], ['compliance-platform', 'training', 'reporting']),
  createAgent('privacy-specialist', 'Privacy Specialist Agent', 'domain', 'L3', 'legal', 'domain', 'Expert in data privacy', ['gdpr', 'ccpa', 'privacy-program', 'data-mapping'], ['privacy-tools', 'consent-management', 'assessment'], ['claude-opus-4.5', 'gpt-5.1'], 'high'),
  createAgent('ip-specialist', 'IP Specialist Agent', 'domain', 'L2', 'legal', 'domain', 'Expert in intellectual property', ['patents', 'trademarks', 'copyrights', 'trade-secrets'], ['ip-management', 'portfolio', 'docketing']),
  createAgent('corporate-counsel', 'Corporate Counsel Agent', 'domain', 'L3', 'legal', 'domain', 'Expert in corporate legal matters', ['corporate-governance', 'ma', 'securities', 'board-matters'], ['entity-management', 'documentation', 'research']),
  createAgent('employment-lawyer', 'Employment Lawyer Agent', 'domain', 'L3', 'legal', 'domain', 'Expert in employment law', ['employment-contracts', 'disputes', 'policies', 'labor-relations'], ['legal-research', 'documentation', 'compliance']),
  createAgent('litigation-specialist', 'Litigation Specialist Agent', 'domain', 'L3', 'legal', 'domain', 'Expert in litigation support', ['case-management', 'e-discovery', 'document-review', 'legal-research'], ['e-discovery', 'case-management', 'research']),
  createAgent('regulatory-affairs', 'Regulatory Affairs Agent', 'domain', 'L2', 'legal', 'domain', 'Expert in regulatory affairs', ['regulatory-filings', 'agency-relations', 'compliance-monitoring', 'policy-analysis'], ['regulatory-tools', 'tracking', 'documentation']),
  createAgent('ethics-compliance', 'Ethics & Compliance Agent', 'domain', 'L2', 'legal', 'domain', 'Expert in ethics and compliance', ['ethics-program', 'investigations', 'whistleblower', 'training'], ['hotline', 'case-management', 'training']),
  createAgent('legal-ops', 'Legal Operations Agent', 'domain', 'L2', 'legal', 'domain', 'Expert in legal operations', ['vendor-management', 'e-billing', 'technology', 'process-improvement'], ['lpm', 'e-billing', 'analytics']),
  
  // Operations & Logistics (15)
  createAgent('supply-chain-manager', 'Supply Chain Manager Agent', 'domain', 'L3', 'operations', 'domain', 'Expert in supply chain management', ['supply-planning', 'vendor-management', 'logistics', 'inventory'], ['scm', 'erp', 'analytics']),
  createAgent('inventory-specialist', 'Inventory Specialist Agent', 'domain', 'L2', 'operations', 'domain', 'Expert in inventory management', ['inventory-control', 'forecasting', 'optimization', 'warehousing'], ['wms', 'inventory-tools', 'analytics']),
  createAgent('logistics-coordinator', 'Logistics Coordinator Agent', 'domain', 'L2', 'operations', 'domain', 'Expert in logistics coordination', ['shipping', 'freight', 'carrier-management', 'tracking'], ['tms', 'freight-tools', 'tracking']),
  createAgent('warehouse-manager', 'Warehouse Manager Agent', 'domain', 'L2', 'operations', 'domain', 'Expert in warehouse operations', ['warehouse-ops', 'layout-optimization', 'wms', 'labor-management'], ['wms', 'labor-tools', 'automation']),
  createAgent('manufacturing-specialist', 'Manufacturing Specialist Agent', 'domain', 'L2', 'operations', 'domain', 'Expert in manufacturing operations', ['production-planning', 'quality-control', 'lean', 'six-sigma'], ['mes', 'erp', 'quality-tools']),
  createAgent('quality-manager', 'Quality Manager Agent', 'domain', 'L3', 'operations', 'domain', 'Expert in quality management', ['quality-systems', 'iso', 'audits', 'continuous-improvement'], ['qms', 'audit-tools', 'analytics']),
  createAgent('process-engineer', 'Process Engineer Agent', 'domain', 'L2', 'operations', 'domain', 'Expert in process engineering', ['process-design', 'optimization', 'automation', 'documentation'], ['process-tools', 'simulation', 'documentation']),
  createAgent('facilities-manager', 'Facilities Manager Agent', 'domain', 'L2', 'operations', 'domain', 'Expert in facilities management', ['space-planning', 'maintenance', 'vendor-management', 'sustainability'], ['cafm', 'cmms', 'iot-sensors']),
  createAgent('fleet-manager', 'Fleet Manager Agent', 'domain', 'L2', 'operations', 'domain', 'Expert in fleet management', ['fleet-optimization', 'maintenance', 'driver-management', 'compliance'], ['fleet-tools', 'telematics', 'fuel-management']),
  createAgent('procurement-manager', 'Procurement Manager Agent', 'domain', 'L3', 'operations', 'domain', 'Expert in procurement management', ['strategic-sourcing', 'contract-management', 'supplier-development', 'cost-reduction'], ['procurement', 'clm', 'analytics']),
  createAgent('demand-planner', 'Demand Planner Agent', 'domain', 'L2', 'operations', 'domain', 'Expert in demand planning', ['demand-forecasting', 'sales-ops-planning', 'inventory-optimization', 'analytics'], ['demand-tools', 'erp', 'analytics']),
  createAgent('fulfillment-specialist', 'Fulfillment Specialist Agent', 'domain', 'L2', 'operations', 'domain', 'Expert in order fulfillment', ['order-processing', 'picking-packing', 'shipping', 'returns'], ['oms', 'wms', 'shipping-tools']),
  createAgent('vendor-manager', 'Vendor Manager Agent', 'domain', 'L2', 'operations', 'domain', 'Expert in vendor management', ['vendor-selection', 'performance-management', 'relationship-building', 'risk-management'], ['vrm', 'srm', 'analytics']),
  createAgent('import-export-specialist', 'Import/Export Specialist Agent', 'domain', 'L2', 'operations', 'domain', 'Expert in international trade', ['customs', 'trade-compliance', 'documentation', 'freight-forwarding'], ['gts', 'customs-tools', 'documentation']),
  createAgent('sustainability-manager', 'Sustainability Manager Agent', 'domain', 'L2', 'operations', 'domain', 'Expert in sustainability operations', ['carbon-footprint', 'circular-economy', 'sustainable-sourcing', 'reporting'], ['sustainability-tools', 'analytics', 'reporting'])
];

// ============================================================================
// SPECIALIST AGENTS (25 new agents)
// ============================================================================

export const SPECIALIST_AGENTS: AgentDefinitionV10[] = [
  // Research & Analysis
  createAgent('market-researcher', 'Market Researcher Agent', 'domain', 'L2', 'research', 'specialist', 'Expert in market research', ['primary-research', 'secondary-research', 'survey-design', 'analysis'], ['research-tools', 'survey', 'analytics']),
  createAgent('competitive-intelligence', 'Competitive Intelligence Agent', 'domain', 'L3', 'research', 'specialist', 'Expert in competitive intelligence', ['competitor-analysis', 'market-monitoring', 'win-loss-analysis', 'benchmarking'], ['ci-tools', 'monitoring', 'analytics']),
  createAgent('data-scientist', 'Data Scientist Agent', 'domain', 'L3', 'research', 'specialist', 'Expert in data science', ['statistical-analysis', 'machine-learning', 'data-visualization', 'predictive-modeling'], ['python', 'r', 'jupyter', 'bi-tools']),
  createAgent('business-analyst', 'Business Analyst Agent', 'domain', 'L2', 'research', 'specialist', 'Expert in business analysis', ['requirements-gathering', 'process-mapping', 'gap-analysis', 'documentation'], ['bpmn', 'requirements', 'documentation']),
  createAgent('ux-researcher', 'UX Researcher Agent', 'domain', 'L2', 'research', 'specialist', 'Expert in UX research', ['user-interviews', 'usability-testing', 'surveys', 'analytics'], ['research-tools', 'testing', 'analytics']),
  
  // Technology Specialists
  createAgent('blockchain-specialist', 'Blockchain Specialist Agent', 'domain', 'L3', 'technology', 'specialist', 'Expert in blockchain technology', ['smart-contracts', 'defi', 'nft', 'web3'], ['solidity', 'ethers', 'blockchain-tools']),
  createAgent('iot-specialist', 'IoT Specialist Agent', 'domain', 'L3', 'technology', 'specialist', 'Expert in Internet of Things', ['sensors', 'edge-computing', 'protocols', 'device-management'], ['iot-platforms', 'mqtt', 'analytics']),
  createAgent('ar-vr-specialist', 'AR/VR Specialist Agent', 'domain', 'L3', 'technology', 'specialist', 'Expert in AR/VR development', ['unity', 'unreal', '3d-modeling', 'spatial-computing'], ['ar-vr-tools', 'modeling', 'testing']),
  createAgent('gaming-specialist', 'Gaming Specialist Agent', 'domain', 'L3', 'technology', 'specialist', 'Expert in game development', ['game-design', 'unity', 'unreal', 'multiplayer'], ['game-engines', 'tools', 'testing']),
  createAgent('robotics-specialist', 'Robotics Specialist Agent', 'domain', 'L3', 'technology', 'specialist', 'Expert in robotics and automation', ['ros', 'motion-planning', 'computer-vision', 'control-systems'], ['robotics-tools', 'simulation', 'testing']),
  
  // Industry Specialists
  createAgent('healthcare-specialist', 'Healthcare Specialist Agent', 'domain', 'L3', 'industry', 'specialist', 'Expert in healthcare domain', ['hipaa', 'ehr', 'healthcare-workflows', 'compliance'], ['healthcare-systems', 'compliance', 'analytics'], ['claude-opus-4.5', 'gpt-5.1'], 'high'),
  createAgent('fintech-specialist', 'Fintech Specialist Agent', 'domain', 'L3', 'industry', 'specialist', 'Expert in financial technology', ['payments', 'banking', 'lending', 'compliance'], ['fintech-tools', 'apis', 'compliance'], ['claude-opus-4.5', 'gpt-5.1'], 'high'),
  createAgent('edtech-specialist', 'EdTech Specialist Agent', 'domain', 'L3', 'industry', 'specialist', 'Expert in education technology', ['lms', 'adaptive-learning', 'gamification', 'assessment'], ['edtech-tools', 'lms', 'analytics']),
  createAgent('ecommerce-specialist', 'E-commerce Specialist Agent', 'domain', 'L3', 'industry', 'specialist', 'Expert in e-commerce', ['platforms', 'merchandising', 'checkout', 'fulfillment'], ['ecommerce-tools', 'analytics', 'marketing']),
  createAgent('real-estate-specialist', 'Real Estate Specialist Agent', 'domain', 'L2', 'industry', 'specialist', 'Expert in real estate technology', ['property-management', 'listings', 'valuations', 'transactions'], ['re-tools', 'mls', 'analytics']),
  createAgent('travel-hospitality', 'Travel & Hospitality Agent', 'domain', 'L2', 'industry', 'specialist', 'Expert in travel and hospitality', ['booking-systems', 'revenue-management', 'guest-experience', 'operations'], ['pms', 'booking', 'analytics']),
  createAgent('media-entertainment', 'Media & Entertainment Agent', 'domain', 'L2', 'industry', 'specialist', 'Expert in media and entertainment', ['content-management', 'streaming', 'rights-management', 'monetization'], ['dam', 'streaming', 'analytics']),
  createAgent('manufacturing-tech', 'Manufacturing Tech Agent', 'domain', 'L2', 'industry', 'specialist', 'Expert in manufacturing technology', ['industry-4.0', 'mes', 'plc', 'automation'], ['mes', 'scada', 'analytics']),
  createAgent('energy-utilities', 'Energy & Utilities Agent', 'domain', 'L2', 'industry', 'specialist', 'Expert in energy and utilities', ['smart-grid', 'renewable', 'utility-ops', 'compliance'], ['scada', 'erp', 'analytics']),
  createAgent('telecom-specialist', 'Telecom Specialist Agent', 'domain', 'L2', 'industry', 'specialist', 'Expert in telecommunications', ['network-ops', 'billing', 'customer-care', '5g'], ['nms', 'bss-oss', 'analytics']),
  
  // Communication Specialists
  createAgent('technical-writer', 'Technical Writer Agent', 'domain', 'L2', 'communication', 'specialist', 'Expert in technical writing', ['documentation', 'api-docs', 'user-guides', 'tutorials'], ['docs-tools', 'markdown', 'diagrams']),
  createAgent('copywriter', 'Copywriter Agent', 'domain', 'L2', 'communication', 'specialist', 'Expert in copywriting', ['marketing-copy', 'ad-copy', 'web-copy', 'brand-voice'], ['writing-tools', 'seo', 'a-b-testing']),
  createAgent('translator', 'Translator Agent', 'domain', 'L2', 'communication', 'specialist', 'Expert in translation and localization', ['translation', 'localization', 'cultural-adaptation', 'quality-assurance'], ['cat-tools', 'tm', 'qc']),
  createAgent('presentation-specialist', 'Presentation Specialist Agent', 'domain', 'L2', 'communication', 'specialist', 'Expert in presentations', ['slide-design', 'storytelling', 'data-viz', 'public-speaking'], ['presentation-tools', 'design', 'analytics']),
  createAgent('internal-communications', 'Internal Communications Agent', 'domain', 'L2', 'communication', 'specialist', 'Expert in internal communications', ['employee-comms', 'change-communications', 'newsletters', 'intranet'], ['comms-tools', 'intranet', 'analytics'])
];

// ============================================================================
// EXPORTS
// ============================================================================

export const EXTENDED_AGENTS: AgentDefinitionV10[] = [
  ...EXTENDED_DEVELOPMENT_AGENTS,
  ...EXTENDED_DOMAIN_AGENTS,
  ...SPECIALIST_AGENTS
];

export const EXTENDED_AGENT_COUNTS = {
  development: EXTENDED_DEVELOPMENT_AGENTS.length,
  domain: EXTENDED_DOMAIN_AGENTS.length,
  specialist: SPECIALIST_AGENTS.length,
  total: EXTENDED_AGENTS.length
};

console.log(`✅ Extended Agents v10.0 loaded: ${EXTENDED_AGENTS.length} agents`);
