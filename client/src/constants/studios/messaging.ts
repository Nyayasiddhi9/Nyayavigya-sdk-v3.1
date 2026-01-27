/**
 * Wizards Incubator Platform - Studio Messaging Framework
 * 
 * Centralized messaging for consistent, founder-friendly language across all 10 studios.
 * This ensures uniform tone, prevents copy drift, and eases future localization.
 */

export interface StudioOutcome {
  icon: string; // Lucide icon name
  title: string;
  description: string;
  color: string; // HSL color value
}

export interface StudioWorkflow {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
}

export interface StudioMessaging {
  name: string;
  tagline: string;
  ctaVerb: string; // e.g., "Start", "Begin", "Launch"
  outcomes: StudioOutcome[];
  workflows?: StudioWorkflow[]; // Optional, for multi-workflow studios
}

/**
 * Comprehensive messaging map for all 10 studios
 */
export const STUDIOS_MESSAGING: Record<string, StudioMessaging> = {
  'ideation-lab': {
    name: 'Ideation Lab',
    tagline: 'Turn your idea into a validated business concept. Get expert insights on market fit, viability, and your path forward.',
    ctaVerb: 'Start',
    outcomes: [
      {
        icon: 'Lightbulb',
        title: 'Idea Validation',
        description: 'Viability score, key risks, and recommendations to strengthen your concept',
        color: 'hsl(45,100%,51%)', // Yellow
      },
      {
        icon: 'TrendingUp',
        title: 'Market Insights',
        description: 'Market size, competition analysis, and positioning strategy for your target audience',
        color: 'hsl(142,71%,45%)', // Green
      },
      {
        icon: 'FileText',
        title: 'Business Model',
        description: 'Complete business model canvas showing how you\'ll create and capture value',
        color: 'hsl(280,100%,70%)', // Purple
      },
    ],
    workflows: [
      {
        id: 'idea-validation',
        title: 'Validate Your Idea',
        description: 'See if your idea has what it takes to succeed in the market',
        icon: 'Lightbulb',
      },
      {
        id: 'market-research',
        title: 'Understand Your Market',
        description: 'Discover your competition, market size, and where you fit in',
        icon: 'TrendingUp',
      },
      {
        id: 'business-model',
        title: 'Design Your Business Model',
        description: 'Map out how you\'ll make money and grow your business',
        icon: 'FileText',
      },
    ],
  },
  
  'engineering-forge': {
    name: 'Engineering Forge',
    tagline: 'Transform your product vision into production-ready code. Get a complete technical foundation built by expert AI agents.',
    ctaVerb: 'Build',
    outcomes: [
      {
        icon: 'Code',
        title: 'MVP Codebase',
        description: 'Production-ready code following best practices with comprehensive documentation',
        color: 'hsl(217,91%,60%)', // Blue
      },
      {
        icon: 'GitBranch',
        title: 'Technical Architecture',
        description: 'Scalable system design, database schema, and API documentation',
        color: 'hsl(142,71%,45%)', // Green
      },
      {
        icon: 'Rocket',
        title: 'Deployment Setup',
        description: 'CI/CD pipeline, hosting configuration, and deployment guides',
        color: 'hsl(280,100%,70%)', // Purple
      },
    ],
  },
  
  'market-intelligence': {
    name: 'Market Intelligence',
    tagline: 'Understand your market landscape. Discover opportunities, threats, and winning positioning strategies.',
    ctaVerb: 'Analyze',
    outcomes: [
      {
        icon: 'Users',
        title: 'Competitor Analysis',
        description: 'Detailed profiles of key competitors with strengths, weaknesses, and market share',
        color: 'hsl(0,84%,60%)', // Red
      },
      {
        icon: 'Target',
        title: 'Market Sizing',
        description: 'Total addressable market, serviceable market, and growth projections',
        color: 'hsl(217,91%,60%)', // Blue
      },
      {
        icon: 'Compass',
        title: 'Positioning Strategy',
        description: 'Unique differentiation points and messaging framework for your target audience',
        color: 'hsl(142,71%,45%)', // Green
      },
    ],
  },
  
  'product-blueprint': {
    name: 'Product Blueprint',
    tagline: 'Design your product roadmap. Define features, user stories, and build your MVP scope.',
    ctaVerb: 'Define',
    outcomes: [
      {
        icon: 'Map',
        title: 'Feature Roadmap',
        description: 'Prioritized feature list with timeline, effort estimates, and dependencies',
        color: 'hsl(217,91%,60%)', // Blue
      },
      {
        icon: 'Users',
        title: 'User Stories',
        description: 'Complete set of user stories with acceptance criteria and mockups',
        color: 'hsl(280,100%,70%)', // Purple
      },
      {
        icon: 'Package',
        title: 'MVP Scope',
        description: 'Clear definition of your minimum viable product with must-have features',
        color: 'hsl(142,71%,45%)', // Green
      },
    ],
  },
  
  'experience-design': {
    name: 'Experience Design',
    tagline: 'Create intuitive user experiences. Get wireframes, design systems, and user flows that delight.',
    ctaVerb: 'Design',
    outcomes: [
      {
        icon: 'Layout',
        title: 'Wireframes',
        description: 'Complete wireframe set for all key screens and user journeys',
        color: 'hsl(217,91%,60%)', // Blue
      },
      {
        icon: 'Palette',
        title: 'Design System',
        description: 'Brand colors, typography, components, and style guide',
        color: 'hsl(280,100%,70%)', // Purple
      },
      {
        icon: 'GitMerge',
        title: 'User Flows',
        description: 'Detailed user flow diagrams showing every interaction and decision point',
        color: 'hsl(142,71%,45%)', // Green
      },
    ],
  },
  
  'quality-assurance-lab': {
    name: 'Quality Assurance Lab',
    tagline: 'Ensure your product works flawlessly. Get comprehensive testing, bug reports, and quality metrics.',
    ctaVerb: 'Test',
    outcomes: [
      {
        icon: 'CheckCircle',
        title: 'Test Coverage',
        description: 'Automated test suite covering core functionality and edge cases',
        color: 'hsl(142,71%,45%)', // Green
      },
      {
        icon: 'AlertTriangle',
        title: 'Bug Reports',
        description: 'Detailed bug reports with reproduction steps, severity, and fix recommendations',
        color: 'hsl(0,84%,60%)', // Red
      },
      {
        icon: 'BarChart',
        title: 'Quality Metrics',
        description: 'Performance benchmarks, code quality scores, and improvement suggestions',
        color: 'hsl(217,91%,60%)', // Blue
      },
    ],
  },
  
  'growth-engine': {
    name: 'Growth Engine',
    tagline: 'Accelerate your growth. Build marketing strategies, acquisition channels, and viral loops.',
    ctaVerb: 'Launch',
    outcomes: [
      {
        icon: 'TrendingUp',
        title: 'Marketing Strategy',
        description: 'Multi-channel marketing plan with messaging, content calendar, and budget allocation',
        color: 'hsl(142,71%,45%)', // Green
      },
      {
        icon: 'Target',
        title: 'Acquisition Channels',
        description: 'Prioritized channel recommendations with expected CAC and conversion rates',
        color: 'hsl(217,91%,60%)', // Blue
      },
      {
        icon: 'Repeat',
        title: 'Retention Programs',
        description: 'User onboarding flows, engagement campaigns, and viral referral systems',
        color: 'hsl(280,100%,70%)', // Purple
      },
    ],
  },
  
  'launch-command': {
    name: 'Launch Command',
    tagline: 'Prepare for launch. Get launch checklists, go-to-market strategy, and first customer acquisition plans.',
    ctaVerb: 'Prepare',
    outcomes: [
      {
        icon: 'Rocket',
        title: 'Launch Checklist',
        description: 'Complete pre-launch checklist with timing, tasks, and stakeholder responsibilities',
        color: 'hsl(0,84%,60%)', // Red
      },
      {
        icon: 'Megaphone',
        title: 'GTM Strategy',
        description: 'Go-to-market plan with messaging, channels, and first 90-day roadmap',
        color: 'hsl(217,91%,60%)', // Blue
      },
      {
        icon: 'Users',
        title: 'Early Customers',
        description: 'Target customer profiles, outreach templates, and beta program setup',
        color: 'hsl(142,71%,45%)', // Green
      },
    ],
  },
  
  'operations-hub': {
    name: 'Operations Hub',
    tagline: 'Streamline your operations. Build processes, tools, and systems for efficient scaling.',
    ctaVerb: 'Optimize',
    outcomes: [
      {
        icon: 'Settings',
        title: 'Process Documentation',
        description: 'Standard operating procedures for all core business functions',
        color: 'hsl(217,91%,60%)', // Blue
      },
      {
        icon: 'Users',
        title: 'Team Structure',
        description: 'Org chart, role definitions, and hiring roadmap for first 6-12 months',
        color: 'hsl(280,100%,70%)', // Purple
      },
      {
        icon: 'BarChart',
        title: 'KPI Dashboard',
        description: 'Key metrics framework with tracking systems and reporting cadences',
        color: 'hsl(142,71%,45%)', // Green
      },
    ],
  },
  
  'deployment-studio': {
    name: 'Deployment Studio',
    tagline: 'Ship your product to production. Get automated deployments, monitoring, and scaling infrastructure.',
    ctaVerb: 'Deploy',
    outcomes: [
      {
        icon: 'Cloud',
        title: 'Production Infrastructure',
        description: 'Configured hosting, CDN, database, and scaling policies',
        color: 'hsl(217,91%,60%)', // Blue
      },
      {
        icon: 'Activity',
        title: 'Monitoring & Alerts',
        description: 'Error tracking, performance monitoring, and automated alerting systems',
        color: 'hsl(0,84%,60%)', // Red
      },
      {
        icon: 'Shield',
        title: 'Security & Backups',
        description: 'SSL certificates, security scanning, and automated backup procedures',
        color: 'hsl(142,71%,45%)', // Green
      },
    ],
  },
};

/**
 * Common section labels used across studios
 */
export const SECTION_LABELS = {
  OUTCOMES: "What You'll Create",
  WORKFLOWS: "Choose Your Starting Point",
  WORKFLOWS_SINGLE: "Get Started",
  HOW_IT_WORKS: "How It Works",
  NEXT_STEPS: "Next Steps",
  PROGRESS: "Your Progress",
} as const;

/**
 * Get CTA text for a studio
 * @param studioId - The studio identifier
 * @param workflowName - Optional workflow name for specificity
 */
export function getStudioCTA(studioId: string, workflowName?: string): string {
  const studio = STUDIOS_MESSAGING[studioId];
  if (!studio) return 'Start Session';
  
  if (workflowName) {
    return `${studio.ctaVerb} ${workflowName}`;
  }
  
  return `${studio.ctaVerb} ${studio.name} Session`;
}

/**
 * Get messaging for a specific studio
 */
export function getStudioMessaging(studioId: string): StudioMessaging | null {
  return STUDIOS_MESSAGING[studioId] || null;
}
