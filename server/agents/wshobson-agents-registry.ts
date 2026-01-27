/**
 * wshobson Specialized Agents Registry
 * Integration of 83 production-ready specialized agents from https://github.com/wshobson/agents
 * 
 * These agents complement our existing 105 WAI agents + 79 Geminiflow agents with deep domain expertise
 * Total agent count: 267+ agents (105 WAI + 79 Geminiflow + 83+ wshobson specialized)
 */

export interface SpecializedAgent {
  id: string;
  name: string;
  description: string;
  model: 'haiku' | 'sonnet' | 'opus';
  category: string;
  capabilities: string[];
  tier: 'executive' | 'development' | 'creative' | 'qa' | 'devops' | 'domain';
  romaLevel: 'L1' | 'L2' | 'L3' | 'L4';
  status: 'active' | 'ready' | 'building';
}

/**
 * Architecture & System Design Agents (14)
 */
export const architectureAgents: SpecializedAgent[] = [
  {
    id: 'backend-architect',
    name: 'Backend Architect',
    description: 'RESTful API design, microservice boundaries, database schemas',
    model: 'opus',
    category: 'architecture',
    capabilities: ['api-design', 'microservices', 'database-schema', 'scaling', 'caching'],
    tier: 'executive',
    romaLevel: 'L4',
    status: 'active'
  },
  {
    id: 'frontend-developer',
    name: 'Frontend Developer',
    description: 'React components, responsive layouts, client-side state management',
    model: 'sonnet',
    category: 'architecture',
    capabilities: ['react', 'ui-components', 'state-management', 'responsive-design'],
    tier: 'development',
    romaLevel: 'L3',
    status: 'active'
  },
  {
    id: 'graphql-architect',
    name: 'GraphQL Architect',
    description: 'GraphQL schemas, resolvers, federation architecture',
    model: 'opus',
    category: 'architecture',
    capabilities: ['graphql', 'schema-design', 'resolvers', 'federation'],
    tier: 'executive',
    romaLevel: 'L4',
    status: 'active'
  },
  {
    id: 'architect-reviewer',
    name: 'Architect Reviewer',
    description: 'Architectural consistency analysis and pattern validation',
    model: 'opus',
    category: 'architecture',
    capabilities: ['code-review', 'architecture-validation', 'pattern-analysis'],
    tier: 'executive',
    romaLevel: 'L4',
    status: 'active'
  },
  {
    id: 'cloud-architect',
    name: 'Cloud Architect',
    description: 'AWS/Azure/GCP infrastructure design and cost optimization',
    model: 'opus',
    category: 'architecture',
    capabilities: ['aws', 'azure', 'gcp', 'infrastructure', 'cost-optimization'],
    tier: 'executive',
    romaLevel: 'L4',
    status: 'active'
  },
  {
    id: 'hybrid-cloud-architect',
    name: 'Hybrid Cloud Architect',
    description: 'Multi-cloud strategies across cloud and on-premises environments',
    model: 'opus',
    category: 'architecture',
    capabilities: ['multi-cloud', 'hybrid-cloud', 'on-premises', 'migration'],
    tier: 'executive',
    romaLevel: 'L4',
    status: 'active'
  },
  {
    id: 'kubernetes-architect',
    name: 'Kubernetes Architect',
    description: 'Cloud-native infrastructure with Kubernetes and GitOps',
    model: 'opus',
    category: 'architecture',
    capabilities: ['kubernetes', 'cloud-native', 'gitops', 'helm', 'istio'],
    tier: 'devops',
    romaLevel: 'L4',
    status: 'active'
  },
  {
    id: 'ui-ux-designer',
    name: 'UI/UX Designer',
    description: 'Interface design, wireframes, design systems',
    model: 'sonnet',
    category: 'architecture',
    capabilities: ['ui-design', 'ux', 'wireframes', 'design-systems'],
    tier: 'creative',
    romaLevel: 'L3',
    status: 'active'
  },
  {
    id: 'ui-visual-validator',
    name: 'UI Visual Validator',
    description: 'Visual regression testing and UI verification',
    model: 'sonnet',
    category: 'architecture',
    capabilities: ['visual-testing', 'regression-testing', 'ui-validation'],
    tier: 'qa',
    romaLevel: 'L3',
    status: 'active'
  },
  {
    id: 'mobile-developer',
    name: 'Mobile Developer',
    description: 'React Native and Flutter application development',
    model: 'sonnet',
    category: 'architecture',
    capabilities: ['react-native', 'flutter', 'mobile-dev', 'cross-platform'],
    tier: 'development',
    romaLevel: 'L3',
    status: 'active'
  },
  {
    id: 'ios-developer',
    name: 'iOS Developer',
    description: 'Native iOS development with Swift/SwiftUI',
    model: 'sonnet',
    category: 'architecture',
    capabilities: ['swift', 'swiftui', 'ios', 'xcode'],
    tier: 'development',
    romaLevel: 'L3',
    status: 'active'
  },
  {
    id: 'flutter-expert',
    name: 'Flutter Expert',
    description: 'Advanced Flutter development with state management',
    model: 'sonnet',
    category: 'architecture',
    capabilities: ['flutter', 'dart', 'bloc', 'provider', 'riverpod'],
    tier: 'development',
    romaLevel: 'L3',
    status: 'active'
  },
  {
    id: 'terraform-specialist',
    name: 'Terraform Specialist',
    description: 'Infrastructure as Code with Terraform modules and state management',
    model: 'opus',
    category: 'architecture',
    capabilities: ['terraform', 'iac', 'modules', 'state-management'],
    tier: 'devops',
    romaLevel: 'L4',
    status: 'active'
  },
  {
    id: 'unity-developer',
    name: 'Unity Developer',
    description: 'Unity game development and optimization',
    model: 'sonnet',
    category: 'architecture',
    capabilities: ['unity', 'c-sharp', 'game-dev', '3d', 'optimization'],
    tier: 'development',
    romaLevel: 'L3',
    status: 'active'
  }
];

/**
 * Programming Language Specialists (18)
 */
export const languageAgents: SpecializedAgent[] = [
  {
    id: 'c-pro',
    name: 'C Pro',
    description: 'System programming with memory management and OS interfaces',
    model: 'sonnet',
    category: 'programming',
    capabilities: ['c', 'memory-management', 'os-interfaces', 'pointers'],
    tier: 'development',
    romaLevel: 'L3',
    status: 'active'
  },
  {
    id: 'cpp-pro',
    name: 'C++ Pro',
    description: 'Modern C++ with RAII, smart pointers, STL algorithms',
    model: 'sonnet',
    category: 'programming',
    capabilities: ['cpp', 'raii', 'smart-pointers', 'stl', 'templates'],
    tier: 'development',
    romaLevel: 'L3',
    status: 'active'
  },
  {
    id: 'rust-pro',
    name: 'Rust Pro',
    description: 'Memory-safe systems programming with ownership patterns',
    model: 'sonnet',
    category: 'programming',
    capabilities: ['rust', 'ownership', 'borrowing', 'lifetimes', 'async'],
    tier: 'development',
    romaLevel: 'L3',
    status: 'active'
  },
  {
    id: 'golang-pro',
    name: 'Golang Pro',
    description: 'Concurrent programming with goroutines and channels',
    model: 'sonnet',
    category: 'programming',
    capabilities: ['golang', 'concurrency', 'goroutines', 'channels'],
    tier: 'development',
    romaLevel: 'L3',
    status: 'active'
  },
  {
    id: 'javascript-pro',
    name: 'JavaScript Pro',
    description: 'Modern JavaScript with ES6+, async patterns, Node.js',
    model: 'sonnet',
    category: 'programming',
    capabilities: ['javascript', 'es6', 'async', 'nodejs', 'promises'],
    tier: 'development',
    romaLevel: 'L3',
    status: 'active'
  },
  {
    id: 'typescript-pro',
    name: 'TypeScript Pro',
    description: 'Advanced TypeScript with type systems and generics',
    model: 'sonnet',
    category: 'programming',
    capabilities: ['typescript', 'type-systems', 'generics', 'decorators'],
    tier: 'development',
    romaLevel: 'L3',
    status: 'active'
  },
  {
    id: 'python-pro',
    name: 'Python Pro',
    description: 'Python development with advanced features and optimization',
    model: 'sonnet',
    category: 'programming',
    capabilities: ['python', 'async', 'decorators', 'metaclasses', 'optimization'],
    tier: 'development',
    romaLevel: 'L3',
    status: 'active'
  },
  {
    id: 'ruby-pro',
    name: 'Ruby Pro',
    description: 'Ruby with metaprogramming, Rails patterns, gem development',
    model: 'sonnet',
    category: 'programming',
    capabilities: ['ruby', 'rails', 'metaprogramming', 'gems'],
    tier: 'development',
    romaLevel: 'L3',
    status: 'active'
  },
  {
    id: 'php-pro',
    name: 'PHP Pro',
    description: 'Modern PHP with frameworks and performance optimization',
    model: 'sonnet',
    category: 'programming',
    capabilities: ['php', 'laravel', 'symfony', 'composer', 'optimization'],
    tier: 'development',
    romaLevel: 'L3',
    status: 'active'
  },
  {
    id: 'java-pro',
    name: 'Java Pro',
    description: 'Modern Java with streams, concurrency, JVM optimization',
    model: 'sonnet',
    category: 'programming',
    capabilities: ['java', 'streams', 'concurrency', 'jvm', 'spring'],
    tier: 'development',
    romaLevel: 'L3',
    status: 'active'
  },
  {
    id: 'scala-pro',
    name: 'Scala Pro',
    description: 'Enterprise Scala with functional programming and distributed systems',
    model: 'sonnet',
    category: 'programming',
    capabilities: ['scala', 'functional', 'akka', 'spark', 'cats'],
    tier: 'development',
    romaLevel: 'L3',
    status: 'active'
  },
  {
    id: 'csharp-pro',
    name: 'C# Pro',
    description: 'C# development with .NET frameworks and patterns',
    model: 'sonnet',
    category: 'programming',
    capabilities: ['csharp', 'dotnet', 'asp-net', 'linq', 'entity-framework'],
    tier: 'development',
    romaLevel: 'L3',
    status: 'active'
  },
  {
    id: 'elixir-pro',
    name: 'Elixir Pro',
    description: 'Elixir with OTP patterns and Phoenix frameworks',
    model: 'sonnet',
    category: 'programming',
    capabilities: ['elixir', 'otp', 'phoenix', 'genserver', 'ecto'],
    tier: 'development',
    romaLevel: 'L3',
    status: 'active'
  },
  {
    id: 'sql-pro',
    name: 'SQL Pro',
    description: 'Complex SQL queries and database optimization',
    model: 'sonnet',
    category: 'programming',
    capabilities: ['sql', 'query-optimization', 'indexes', 'stored-procedures'],
    tier: 'development',
    romaLevel: 'L3',
    status: 'active'
  },
  {
    id: 'django-pro',
    name: 'Django Pro',
    description: 'Django web development with ORM and REST frameworks',
    model: 'sonnet',
    category: 'programming',
    capabilities: ['django', 'django-rest', 'orm', 'celery'],
    tier: 'development',
    romaLevel: 'L3',
    status: 'active'
  },
  {
    id: 'fastapi-pro',
    name: 'FastAPI Pro',
    description: 'FastAPI development with async, pydantic, and swagger',
    model: 'sonnet',
    category: 'programming',
    capabilities: ['fastapi', 'async', 'pydantic', 'swagger', 'sqlalchemy'],
    tier: 'development',
    romaLevel: 'L3',
    status: 'active'
  },
  {
    id: 'minecraft-bukkit-pro',
    name: 'Minecraft Bukkit Pro',
    description: 'Minecraft server plugin development',
    model: 'sonnet',
    category: 'programming',
    capabilities: ['minecraft', 'bukkit', 'spigot', 'plugin-dev', 'java'],
    tier: 'development',
    romaLevel: 'L2',
    status: 'active'
  },
  {
    id: 'blockchain-developer',
    name: 'Blockchain Developer',
    description: 'Web3 apps, smart contracts, DeFi protocols',
    model: 'sonnet',
    category: 'programming',
    capabilities: ['web3', 'solidity', 'ethereum', 'defi', 'smart-contracts'],
    tier: 'development',
    romaLevel: 'L3',
    status: 'active'
  }
];

/**
 * AI/ML Specialists (7)
 */
export const aiMlAgents: SpecializedAgent[] = [
  {
    id: 'ai-engineer',
    name: 'AI Engineer',
    description: 'LLM applications, RAG systems, prompt pipelines',
    model: 'opus',
    category: 'ai-ml',
    capabilities: ['llm', 'rag', 'prompts', 'vector-search', 'agents'],
    tier: 'domain',
    romaLevel: 'L4',
    status: 'active'
  },
  {
    id: 'ml-engineer',
    name: 'ML Engineer',
    description: 'ML pipelines, model serving, feature engineering',
    model: 'opus',
    category: 'ai-ml',
    capabilities: ['ml-pipelines', 'model-serving', 'feature-engineering'],
    tier: 'domain',
    romaLevel: 'L4',
    status: 'active'
  },
  {
    id: 'mlops-engineer',
    name: 'MLOps Engineer',
    description: 'ML infrastructure, experiment tracking, model registries',
    model: 'opus',
    category: 'ai-ml',
    capabilities: ['mlops', 'experiment-tracking', 'model-registry', 'mlflow'],
    tier: 'devops',
    romaLevel: 'L4',
    status: 'active'
  },
  {
    id: 'data-scientist',
    name: 'Data Scientist',
    description: 'Data analysis, SQL queries, BigQuery operations',
    model: 'opus',
    category: 'ai-ml',
    capabilities: ['data-analysis', 'sql', 'bigquery', 'python', 'r'],
    tier: 'domain',
    romaLevel: 'L4',
    status: 'active'
  },
  {
    id: 'data-engineer',
    name: 'Data Engineer',
    description: 'ETL pipelines, data warehouses, streaming architectures',
    model: 'sonnet',
    category: 'ai-ml',
    capabilities: ['etl', 'data-warehouse', 'streaming', 'airflow', 'spark'],
    tier: 'development',
    romaLevel: 'L3',
    status: 'active'
  },
  {
    id: 'prompt-engineer',
    name: 'Prompt Engineer',
    description: 'LLM prompt optimization and engineering',
    model: 'opus',
    category: 'ai-ml',
    capabilities: ['prompt-engineering', 'few-shot', 'chain-of-thought'],
    tier: 'domain',
    romaLevel: 'L4',
    status: 'active'
  },
  {
    id: 'quant-analyst',
    name: 'Quant Analyst',
    description: 'Financial modeling, trading strategies, market analysis',
    model: 'opus',
    category: 'ai-ml',
    capabilities: ['financial-modeling', 'trading', 'market-analysis'],
    tier: 'domain',
    romaLevel: 'L4',
    status: 'active'
  }
];

/**
 * Quality & Security Agents (14)
 */
export const qualitySecurityAgents: SpecializedAgent[] = [
  {
    id: 'code-reviewer',
    name: 'Code Reviewer',
    description: 'Code review with security focus and production reliability',
    model: 'opus',
    category: 'quality-security',
    capabilities: ['code-review', 'security', 'best-practices', 'performance'],
    tier: 'qa',
    romaLevel: 'L4',
    status: 'active'
  },
  {
    id: 'security-auditor',
    name: 'Security Auditor',
    description: 'Vulnerability assessment and OWASP compliance',
    model: 'opus',
    category: 'quality-security',
    capabilities: ['security-audit', 'owasp', 'vulnerability', 'penetration-testing'],
    tier: 'qa',
    romaLevel: 'L4',
    status: 'active'
  },
  {
    id: 'backend-security-coder',
    name: 'Backend Security Coder',
    description: 'Secure backend coding practices, API security implementation',
    model: 'opus',
    category: 'quality-security',
    capabilities: ['backend-security', 'api-security', 'encryption', 'auth'],
    tier: 'development',
    romaLevel: 'L4',
    status: 'active'
  },
  {
    id: 'frontend-security-coder',
    name: 'Frontend Security Coder',
    description: 'XSS prevention, CSP implementation, client-side security',
    model: 'opus',
    category: 'quality-security',
    capabilities: ['xss', 'csp', 'csrf', 'client-security'],
    tier: 'development',
    romaLevel: 'L4',
    status: 'active'
  },
  {
    id: 'mobile-security-coder',
    name: 'Mobile Security Coder',
    description: 'Mobile security patterns, WebView security, biometric auth',
    model: 'opus',
    category: 'quality-security',
    capabilities: ['mobile-security', 'webview', 'biometric', 'storage-encryption'],
    tier: 'development',
    romaLevel: 'L4',
    status: 'active'
  },
  {
    id: 'test-automator',
    name: 'Test Automator',
    description: 'Comprehensive test suite creation (unit, integration, e2e)',
    model: 'sonnet',
    category: 'quality-security',
    capabilities: ['unit-testing', 'integration-testing', 'e2e', 'test-automation'],
    tier: 'qa',
    romaLevel: 'L3',
    status: 'active'
  },
  {
    id: 'tdd-orchestrator',
    name: 'TDD Orchestrator',
    description: 'Test-Driven Development methodology guidance',
    model: 'sonnet',
    category: 'quality-security',
    capabilities: ['tdd', 'red-green-refactor', 'test-first'],
    tier: 'qa',
    romaLevel: 'L3',
    status: 'active'
  },
  {
    id: 'debugger',
    name: 'Debugger',
    description: 'Error resolution and test failure analysis',
    model: 'sonnet',
    category: 'quality-security',
    capabilities: ['debugging', 'error-analysis', 'root-cause'],
    tier: 'qa',
    romaLevel: 'L3',
    status: 'active'
  },
  {
    id: 'error-detective',
    name: 'Error Detective',
    description: 'Log analysis and error pattern recognition',
    model: 'sonnet',
    category: 'quality-security',
    capabilities: ['log-analysis', 'error-patterns', 'monitoring'],
    tier: 'qa',
    romaLevel: 'L3',
    status: 'active'
  },
  {
    id: 'performance-engineer',
    name: 'Performance Engineer',
    description: 'Application profiling and optimization',
    model: 'opus',
    category: 'quality-security',
    capabilities: ['profiling', 'optimization', 'benchmarking', 'load-testing'],
    tier: 'devops',
    romaLevel: 'L4',
    status: 'active'
  },
  {
    id: 'observability-engineer',
    name: 'Observability Engineer',
    description: 'Production monitoring, distributed tracing, SLI/SLO management',
    model: 'opus',
    category: 'quality-security',
    capabilities: ['monitoring', 'tracing', 'sli-slo', 'metrics', 'logging'],
    tier: 'devops',
    romaLevel: 'L4',
    status: 'active'
  },
  {
    id: 'incident-responder',
    name: 'Incident Responder',
    description: 'Production incident management and resolution',
    model: 'opus',
    category: 'quality-security',
    capabilities: ['incident-response', 'postmortem', 'crisis-management'],
    tier: 'devops',
    romaLevel: 'L4',
    status: 'active'
  },
  {
    id: 'database-optimizer',
    name: 'Database Optimizer',
    description: 'Query optimization, index design, migration strategies',
    model: 'opus',
    category: 'quality-security',
    capabilities: ['query-optimization', 'index-design', 'migrations'],
    tier: 'development',
    romaLevel: 'L4',
    status: 'active'
  },
  {
    id: 'database-admin',
    name: 'Database Admin',
    description: 'Database operations, backup, replication, monitoring',
    model: 'sonnet',
    category: 'quality-security',
    capabilities: ['database-ops', 'backup', 'replication', 'monitoring'],
    tier: 'devops',
    romaLevel: 'L3',
    status: 'active'
  }
];

/**
 * DevOps & Infrastructure (8)
 */
export const devopsAgents: SpecializedAgent[] = [
  {
    id: 'devops-troubleshooter',
    name: 'DevOps Troubleshooter',
    description: 'Production debugging, log analysis, deployment troubleshooting',
    model: 'sonnet',
    category: 'devops',
    capabilities: ['debugging', 'log-analysis', 'deployment', 'troubleshooting'],
    tier: 'devops',
    romaLevel: 'L3',
    status: 'active'
  },
  {
    id: 'deployment-engineer',
    name: 'Deployment Engineer',
    description: 'CI/CD pipelines, containerization, cloud deployments',
    model: 'sonnet',
    category: 'devops',
    capabilities: ['cicd', 'docker', 'kubernetes', 'deployment'],
    tier: 'devops',
    romaLevel: 'L3',
    status: 'active'
  },
  {
    id: 'dx-optimizer',
    name: 'DX Optimizer',
    description: 'Developer experience optimization and tooling improvements',
    model: 'sonnet',
    category: 'devops',
    capabilities: ['dx', 'tooling', 'automation', 'developer-productivity'],
    tier: 'devops',
    romaLevel: 'L3',
    status: 'active'
  },
  {
    id: 'network-engineer',
    name: 'Network Engineer',
    description: 'Network debugging, load balancing, traffic analysis',
    model: 'sonnet',
    category: 'devops',
    capabilities: ['networking', 'load-balancing', 'traffic-analysis', 'dns'],
    tier: 'devops',
    romaLevel: 'L3',
    status: 'active'
  },
  {
    id: 'legacy-modernizer',
    name: 'Legacy Modernizer',
    description: 'Legacy code refactoring and modernization',
    model: 'sonnet',
    category: 'devops',
    capabilities: ['refactoring', 'modernization', 'migration', 'tech-debt'],
    tier: 'development',
    romaLevel: 'L3',
    status: 'active'
  },
  {
    id: 'payment-integration',
    name: 'Payment Integration',
    description: 'Payment processor integration (Stripe, PayPal)',
    model: 'sonnet',
    category: 'devops',
    capabilities: ['stripe', 'paypal', 'payment-processing', 'webhooks'],
    tier: 'development',
    romaLevel: 'L3',
    status: 'active'
  },
  {
    id: 'context-manager',
    name: 'Context Manager',
    description: 'Multi-agent context management',
    model: 'haiku',
    category: 'devops',
    capabilities: ['context', 'multi-agent', 'coordination'],
    tier: 'domain',
    romaLevel: 'L2',
    status: 'active'
  },
  {
    id: 'search-specialist',
    name: 'Search Specialist',
    description: 'Advanced web research and information synthesis',
    model: 'haiku',
    category: 'devops',
    capabilities: ['search', 'research', 'information-synthesis'],
    tier: 'domain',
    romaLevel: 'L2',
    status: 'active'
  }
];

/**
 * Documentation & Content (16)
 */
export const documentationAgents: SpecializedAgent[] = [
  {
    id: 'docs-architect',
    name: 'Docs Architect',
    description: 'Comprehensive technical documentation generation',
    model: 'opus',
    category: 'documentation',
    capabilities: ['technical-docs', 'architecture-docs', 'user-guides'],
    tier: 'creative',
    romaLevel: 'L4',
    status: 'active'
  },
  {
    id: 'api-documenter',
    name: 'API Documenter',
    description: 'OpenAPI/Swagger specifications and developer docs',
    model: 'sonnet',
    category: 'documentation',
    capabilities: ['openapi', 'swagger', 'api-docs', 'postman'],
    tier: 'development',
    romaLevel: 'L3',
    status: 'active'
  },
  {
    id: 'reference-builder',
    name: 'Reference Builder',
    description: 'Technical references and API documentation',
    model: 'haiku',
    category: 'documentation',
    capabilities: ['reference-docs', 'api-reference', 'sdk-docs'],
    tier: 'creative',
    romaLevel: 'L2',
    status: 'active'
  },
  {
    id: 'tutorial-engineer',
    name: 'Tutorial Engineer',
    description: 'Step-by-step tutorials and educational content',
    model: 'sonnet',
    category: 'documentation',
    capabilities: ['tutorials', 'guides', 'educational-content'],
    tier: 'creative',
    romaLevel: 'L3',
    status: 'active'
  },
  {
    id: 'mermaid-expert',
    name: 'Mermaid Expert',
    description: 'Diagram creation (flowcharts, sequences, ERDs)',
    model: 'sonnet',
    category: 'documentation',
    capabilities: ['mermaid', 'diagrams', 'flowcharts', 'sequence-diagrams'],
    tier: 'creative',
    romaLevel: 'L3',
    status: 'active'
  },
  {
    id: 'content-marketer',
    name: 'Content Marketer',
    description: 'Blog posts, social media, email campaigns',
    model: 'sonnet',
    category: 'documentation',
    capabilities: ['blogging', 'social-media', 'email-marketing', 'copywriting'],
    tier: 'creative',
    romaLevel: 'L3',
    status: 'active'
  },
  {
    id: 'sales-automator',
    name: 'Sales Automator',
    description: 'Cold emails, follow-ups, proposal generation',
    model: 'haiku',
    category: 'documentation',
    capabilities: ['sales-emails', 'proposals', 'follow-ups'],
    tier: 'creative',
    romaLevel: 'L2',
    status: 'active'
  },
  // SEO Agents (10)
  {
    id: 'seo-content-auditor',
    name: 'SEO Content Auditor',
    description: 'Content quality analysis, E-E-A-T signals assessment',
    model: 'sonnet',
    category: 'documentation',
    capabilities: ['seo-audit', 'content-quality', 'eeat'],
    tier: 'creative',
    romaLevel: 'L3',
    status: 'active'
  },
  {
    id: 'seo-meta-optimizer',
    name: 'SEO Meta Optimizer',
    description: 'Meta title and description optimization',
    model: 'haiku',
    category: 'documentation',
    capabilities: ['meta-tags', 'seo-optimization', 'snippets'],
    tier: 'creative',
    romaLevel: 'L2',
    status: 'active'
  },
  {
    id: 'seo-keyword-strategist',
    name: 'SEO Keyword Strategist',
    description: 'Keyword analysis and semantic variations',
    model: 'haiku',
    category: 'documentation',
    capabilities: ['keyword-research', 'semantic-seo'],
    tier: 'creative',
    romaLevel: 'L2',
    status: 'active'
  },
  {
    id: 'seo-structure-architect',
    name: 'SEO Structure Architect',
    description: 'Content structure and schema markup',
    model: 'haiku',
    category: 'documentation',
    capabilities: ['content-structure', 'schema-markup'],
    tier: 'creative',
    romaLevel: 'L2',
    status: 'active'
  },
  {
    id: 'seo-snippet-hunter',
    name: 'SEO Snippet Hunter',
    description: 'Featured snippet formatting',
    model: 'haiku',
    category: 'documentation',
    capabilities: ['featured-snippets', 'serp-optimization'],
    tier: 'creative',
    romaLevel: 'L2',
    status: 'active'
  },
  {
    id: 'seo-content-refresher',
    name: 'SEO Content Refresher',
    description: 'Content freshness analysis',
    model: 'haiku',
    category: 'documentation',
    capabilities: ['content-refresh', 'update-analysis'],
    tier: 'creative',
    romaLevel: 'L2',
    status: 'active'
  },
  {
    id: 'seo-cannibalization-detector',
    name: 'SEO Cannibalization Detector',
    description: 'Keyword overlap detection',
    model: 'haiku',
    category: 'documentation',
    capabilities: ['keyword-cannibalization', 'overlap-detection'],
    tier: 'creative',
    romaLevel: 'L2',
    status: 'active'
  },
  {
    id: 'seo-authority-builder',
    name: 'SEO Authority Builder',
    description: 'E-E-A-T signal analysis',
    model: 'sonnet',
    category: 'documentation',
    capabilities: ['authority-building', 'eeat-signals'],
    tier: 'creative',
    romaLevel: 'L3',
    status: 'active'
  },
  {
    id: 'seo-content-writer',
    name: 'SEO Content Writer',
    description: 'SEO-optimized content creation',
    model: 'sonnet',
    category: 'documentation',
    capabilities: ['seo-writing', 'content-creation'],
    tier: 'creative',
    romaLevel: 'L3',
    status: 'active'
  },
  {
    id: 'seo-content-planner',
    name: 'SEO Content Planner',
    description: 'Content planning and topic clusters',
    model: 'haiku',
    category: 'documentation',
    capabilities: ['content-planning', 'topic-clusters'],
    tier: 'creative',
    romaLevel: 'L2',
    status: 'active'
  }
];

/**
 * Business & Operations (6)
 */
export const businessAgents: SpecializedAgent[] = [
  {
    id: 'business-analyst',
    name: 'Business Analyst',
    description: 'Metrics analysis, reporting, KPI tracking',
    model: 'sonnet',
    category: 'business',
    capabilities: ['metrics-analysis', 'reporting', 'kpi', 'analytics'],
    tier: 'domain',
    romaLevel: 'L3',
    status: 'active'
  },
  {
    id: 'risk-manager',
    name: 'Risk Manager',
    description: 'Portfolio risk monitoring and management',
    model: 'sonnet',
    category: 'business',
    capabilities: ['risk-management', 'portfolio-analysis'],
    tier: 'executive',
    romaLevel: 'L3',
    status: 'active'
  },
  {
    id: 'customer-support',
    name: 'Customer Support',
    description: 'Support tickets, FAQ responses, customer communication',
    model: 'sonnet',
    category: 'business',
    capabilities: ['support-tickets', 'faq', 'customer-service'],
    tier: 'domain',
    romaLevel: 'L2',
    status: 'active'
  },
  {
    id: 'hr-pro',
    name: 'HR Pro',
    description: 'HR operations, policies, employee relations',
    model: 'opus',
    category: 'business',
    capabilities: ['hr-ops', 'policies', 'employee-relations'],
    tier: 'executive',
    romaLevel: 'L4',
    status: 'active'
  },
  {
    id: 'legal-advisor',
    name: 'Legal Advisor',
    description: 'Privacy policies, terms of service, legal documentation',
    model: 'opus',
    category: 'business',
    capabilities: ['legal-docs', 'privacy', 'terms-of-service', 'compliance'],
    tier: 'executive',
    romaLevel: 'L4',
    status: 'active'
  }
];

/**
 * Consolidated Agent Registry
 */
export const allWshobsonAgents: SpecializedAgent[] = [
  ...architectureAgents,
  ...languageAgents,
  ...aiMlAgents,
  ...qualitySecurityAgents,
  ...devopsAgents,
  ...documentationAgents,
  ...businessAgents
];

/**
 * Agent Statistics
 */
export const agentStats = {
  total: allWshobsonAgents.length,
  byModel: {
    haiku: allWshobsonAgents.filter(a => a.model === 'haiku').length,
    sonnet: allWshobsonAgents.filter(a => a.model === 'sonnet').length,
    opus: allWshobsonAgents.filter(a => a.model === 'opus').length
  },
  byCategory: {
    architecture: architectureAgents.length,
    programming: languageAgents.length,
    aiMl: aiMlAgents.length,
    qualitySecurity: qualitySecurityAgents.length,
    devops: devopsAgents.length,
    documentation: documentationAgents.length,
    business: businessAgents.length
  },
  byTier: {
    executive: allWshobsonAgents.filter(a => a.tier === 'executive').length,
    development: allWshobsonAgents.filter(a => a.tier === 'development').length,
    creative: allWshobsonAgents.filter(a => a.tier === 'creative').length,
    qa: allWshobsonAgents.filter(a => a.tier === 'qa').length,
    devops: allWshobsonAgents.filter(a => a.tier === 'devops').length,
    domain: allWshobsonAgents.filter(a => a.tier === 'domain').length
  }
};

/**
 * Get agent by ID
 */
export function getAgentById(id: string): SpecializedAgent | undefined {
  return allWshobsonAgents.find(agent => agent.id === id);
}

/**
 * Get agents by category
 */
export function getAgentsByCategory(category: string): SpecializedAgent[] {
  return allWshobsonAgents.filter(agent => agent.category === category);
}

/**
 * Get agents by tier
 */
export function getAgentsByTier(tier: string): SpecializedAgent[] {
  return allWshobsonAgents.filter(agent => agent.tier === tier);
}

/**
 * Get agents by model
 */
export function getAgentsByModel(model: 'haiku' | 'sonnet' | 'opus'): SpecializedAgent[] {
  return allWshobsonAgents.filter(agent => agent.model === model);
}
