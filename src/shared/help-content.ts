export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'onboarding' | 'studios' | 'billing' | 'technical';
  keywords: string[];
}

export interface QuickStartStep {
  id: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionLink?: string;
}

export interface ContextualHelp {
  route: string;
  title: string;
  description: string;
  tips: string[];
  relatedFAQs: string[];
}

export const faqData: FAQItem[] = [
  {
    id: 'what-is-wizards',
    question: 'What is Wizards Incubator?',
    answer: 'Wizards Incubator is an AI-powered startup accelerator that transforms your idea into a production-ready MVP in just 14 days. Our platform uses 267+ autonomous AI agents across 10 specialized studios to handle everything from ideation to deployment.',
    category: 'general',
    keywords: ['wizards', 'incubator', 'accelerator', 'mvp', 'startup', '14 days']
  },
  {
    id: 'how-studios-work',
    question: 'How do the 10 studios work?',
    answer: 'Each studio specializes in a specific aspect of startup development: Ideation Lab (idea validation), Engineering Forge (code generation), Market Intelligence (competitor analysis), Product Blueprint (PRD creation), Experience Design (UI/UX), Quality Assurance Lab (testing), Growth Engine (marketing), Launch Command (deployment), Operations Hub (workflows), and Deployment Studio (infrastructure). You progress through these studios over 14 days.',
    category: 'studios',
    keywords: ['studios', '10 studios', 'ideation', 'engineering', 'market', 'product', 'design', 'qa', 'growth', 'launch', 'operations', 'deployment']
  },
  {
    id: 'what-is-onboarding',
    question: 'What happens during onboarding?',
    answer: 'Our guided onboarding helps you set up your profile, take a workspace tour, create your first startup, define your goals, and assess your technical level. This takes about 5-10 minutes and ensures we can provide personalized guidance throughout your 14-day journey.',
    category: 'onboarding',
    keywords: ['onboarding', 'getting started', 'setup', 'profile', 'first time']
  },
  {
    id: 'wai-sdk-explained',
    question: 'What is WAI SDK v1.0?',
    answer: 'WAI (Wizards AI Intelligence) SDK v1.0 is our enterprise-grade AI orchestration platform that powers the entire Wizards Incubator. It coordinates 267+ specialized agents across multiple LLM providers (OpenAI, Anthropic, Google, etc.) to deliver autonomous, intelligent assistance for every aspect of startup development.',
    category: 'technical',
    keywords: ['wai', 'sdk', 'ai', 'agents', 'orchestration', 'llm', 'technical']
  },
  {
    id: 'how-long-14-days',
    question: 'Why 14 days specifically?',
    answer: 'Our 14-day timeline is optimized for rapid MVP development. Each day focuses on specific milestones across our 10 studios, ensuring steady progress without overwhelming founders. You can pause and resume your journey, but the structured timeline helps maintain momentum and prevents scope creep.',
    category: 'general',
    keywords: ['14 days', 'timeline', 'duration', 'how long', 'schedule']
  },
  {
    id: 'credits-system',
    question: 'How does the credits system work?',
    answer: 'Credits are consumed when you run studio workflows powered by AI agents. Different studios and complexity levels require different credit amounts. You can monitor your credit usage in real-time via the analytics dashboard and purchase more credits as needed.',
    category: 'billing',
    keywords: ['credits', 'pricing', 'cost', 'billing', 'payment', 'usage']
  },
  {
    id: 'artifact-generation',
    question: 'What are artifacts?',
    answer: 'Artifacts are the deliverables produced by our studios - PRDs from Product Blueprint, code from Engineering Forge, designs from Experience Design, test reports from QA Lab, etc. All artifacts are version-controlled and stored in your Artifact Store for easy access and collaboration.',
    category: 'studios',
    keywords: ['artifacts', 'deliverables', 'outputs', 'prd', 'code', 'designs']
  },
  {
    id: 'pause-resume',
    question: 'Can I pause and resume my journey?',
    answer: 'Yes! Your progress is automatically saved at every step. You can pause your 14-day journey at any time and resume exactly where you left off. Your onboarding progress, studio sessions, artifacts, and all data are preserved.',
    category: 'general',
    keywords: ['pause', 'resume', 'save', 'progress', 'continue', 'stop']
  },
  {
    id: 'tech-requirements',
    question: 'Do I need technical skills?',
    answer: 'Not at all! Wizards Incubator is designed for both technical and non-technical founders. During onboarding, you specify your technical level, and our AI agents adapt their guidance accordingly. Even with zero coding experience, you can build a production-ready MVP.',
    category: 'onboarding',
    keywords: ['technical', 'skills', 'coding', 'non-technical', 'requirements', 'beginner']
  },
  {
    id: 'investor-matching',
    question: 'How does investor matching work?',
    answer: 'Our AI-powered investor matching platform analyzes your startup profile, industry, funding stage, and traction to connect you with relevant investors. You can browse investors, save favorites, track connection status, and manage outreach - all within the platform.',
    category: 'general',
    keywords: ['investors', 'funding', 'matching', 'connections', 'fundraising']
  }
];

export const quickStartSteps: QuickStartStep[] = [
  {
    id: 'complete-onboarding',
    title: 'Complete Your Onboarding',
    description: 'Set up your founder profile and create your first startup. This takes 5-10 minutes and ensures personalized guidance.',
    actionLabel: 'Start Onboarding',
    actionLink: '/onboarding'
  },
  {
    id: 'review-journey',
    title: 'Review Your 14-Day Journey',
    description: 'Understand the timeline, milestones, and what to expect from each of the 10 studios over the next two weeks.',
    actionLabel: 'View Journey',
    actionLink: '/founder-dashboard'
  },
  {
    id: 'launch-first-studio',
    title: 'Launch Your First Studio',
    description: 'Start with the Ideation Lab to validate your startup idea and generate initial market insights.',
    actionLabel: 'Open Ideation Lab',
    actionLink: '/studios/ideation-lab'
  },
  {
    id: 'monitor-progress',
    title: 'Monitor Your Progress',
    description: 'Track credit usage, studio completion, artifacts generated, and overall journey progress via the analytics dashboard.',
    actionLabel: 'View Analytics',
    actionLink: '/analytics'
  }
];

export const contextualHelpData: ContextualHelp[] = [
  {
    route: '/founder-dashboard',
    title: 'Founder Dashboard',
    description: 'Your central hub for tracking startup progress, viewing your 14-day journey timeline, and accessing all studios.',
    tips: [
      'Click on any studio card to launch a workflow',
      'The journey progress bar shows your current phase and completion percentage',
      'Use the analytics dashboard to monitor credit usage and conversion metrics',
      'Your recent artifacts appear in the timeline for quick access'
    ],
    relatedFAQs: ['what-is-wizards', 'how-studios-work', 'how-long-14-days']
  },
  {
    route: '/onboarding',
    title: 'Guided Onboarding',
    description: 'Complete these 5 steps to set up your profile and create your first startup.',
    tips: [
      'You can pause and resume onboarding at any time',
      'Your progress is automatically saved after each step',
      'Be specific about your startup idea - this helps our AI agents provide better guidance',
      'Your technical level determines how we explain concepts and generate code'
    ],
    relatedFAQs: ['what-is-onboarding', 'pause-resume', 'tech-requirements']
  },
  {
    route: '/studios/ideation-lab',
    title: 'Ideation Lab',
    description: 'Validate your startup idea through AI-powered market research, competitor analysis, and problem-solution fit assessment.',
    tips: [
      'Start with Idea Validation to get an AI assessment of market viability',
      'Use Competitor Analysis to understand your competitive landscape',
      'Problem-Solution Fit helps refine your value proposition',
      'Market Sizing gives you TAM/SAM/SOM calculations'
    ],
    relatedFAQs: ['how-studios-work', 'artifact-generation', 'credits-system']
  },
  {
    route: '/studios/engineering-forge',
    title: 'Engineering Forge',
    description: 'Generate production-ready code, database schemas, API specifications, and technical architecture powered by AI agents.',
    tips: [
      'Code Generation creates full-stack applications based on your PRD',
      'Database Design produces optimized schemas with migrations',
      'API Spec Generation creates RESTful API documentation',
      'All code is version-controlled and stored as artifacts'
    ],
    relatedFAQs: ['how-studios-work', 'artifact-generation', 'wai-sdk-explained']
  },
  {
    route: '/studios/market-intelligence',
    title: 'Market Intelligence',
    description: 'Gather competitive intelligence, market trends, customer insights, and positioning strategies.',
    tips: [
      'Competitor Research analyzes 10+ competitors across 50+ data points',
      'Market Trends identifies emerging opportunities in your industry',
      'Customer Insights reveals pain points and buying behavior',
      'Positioning Strategy helps differentiate your startup'
    ],
    relatedFAQs: ['how-studios-work', 'artifact-generation']
  },
  {
    route: '/studios/product-blueprint',
    title: 'Product Blueprint',
    description: 'Create comprehensive PRDs, feature specifications, user stories, and product roadmaps.',
    tips: [
      'PRD Generation creates detailed product requirements documents',
      'Feature Specs define user stories with acceptance criteria',
      'Roadmap Planning prioritizes features across sprints',
      'Use these artifacts as input for Engineering Forge'
    ],
    relatedFAQs: ['how-studios-work', 'artifact-generation']
  },
  {
    route: '/studios/experience-design',
    title: 'Experience Design',
    description: 'Create beautiful UI/UX designs, wireframes, prototypes, and design systems for your MVP.',
    tips: [
      'Wireframe Generation creates low-fidelity mockups for rapid iteration',
      'UI Design produces high-fidelity screens with brand guidelines',
      'Design System builds reusable components and style guides',
      'User Flow Mapping visualizes the entire user journey'
    ],
    relatedFAQs: ['how-studios-work', 'artifact-generation']
  },
  {
    route: '/studios/quality-assurance-lab',
    title: 'Quality Assurance Lab',
    description: 'Generate comprehensive test plans, automated tests, and quality assurance reports for your MVP.',
    tips: [
      'Test Plan Generation creates detailed testing strategies',
      'Unit Test Creation generates automated test suites',
      'Integration Testing validates API endpoints and data flows',
      'Bug Reporting tracks and prioritizes issues'
    ],
    relatedFAQs: ['how-studios-work', 'artifact-generation', 'wai-sdk-explained']
  },
  {
    route: '/studios/growth-engine',
    title: 'Growth Engine',
    description: 'Develop marketing strategies, content calendars, SEO plans, and growth experiments.',
    tips: [
      'Marketing Strategy creates go-to-market plans',
      'Content Calendar schedules blog posts and social media',
      'SEO Optimization improves search rankings',
      'Growth Experiments designs A/B tests and acquisition tactics'
    ],
    relatedFAQs: ['how-studios-work', 'artifact-generation']
  },
  {
    route: '/studios/launch-command',
    title: 'Launch Command',
    description: 'Prepare for product launch with deployment plans, launch checklists, and launch materials.',
    tips: [
      'Launch Plan creates comprehensive go-live strategies',
      'Deployment Checklist ensures all systems are ready',
      'Launch Materials generates press releases and announcements',
      'Post-Launch Monitor tracks early metrics and user feedback'
    ],
    relatedFAQs: ['how-studios-work', 'artifact-generation']
  },
  {
    route: '/analytics',
    title: 'Analytics Dashboard',
    description: 'Monitor platform metrics, credit usage, conversion funnels, and user engagement.',
    tips: [
      'Conversion funnel shows drop-off rates across signup → onboarding → first studio',
      'Credit tracking helps budget your AI agent usage',
      'Active users metric shows 24-hour engagement',
      'Timeline chart reveals usage patterns over the last 7 days'
    ],
    relatedFAQs: ['credits-system', 'how-studios-work']
  }
];

export function searchFAQs(query: string): FAQItem[] {
  if (!query || query.length < 2) return faqData;
  
  const lowerQuery = query.toLowerCase();
  
  return faqData.filter(faq => 
    faq.question.toLowerCase().includes(lowerQuery) ||
    faq.answer.toLowerCase().includes(lowerQuery) ||
    faq.keywords.some(keyword => keyword.toLowerCase().includes(lowerQuery))
  );
}

export function getContextualHelp(route: string): ContextualHelp | null {
  return contextualHelpData.find(help => 
    route.startsWith(help.route)
  ) || null;
}

export function getFAQsByIds(ids: string[]): FAQItem[] {
  return faqData.filter(faq => ids.includes(faq.id));
}
