import { db } from '../db';
import { wizardsStudios } from '@shared/schema';
import { eq } from 'drizzle-orm';

const STUDIOS_CONFIG = [
  {
    studioId: 'ideation-lab',
    name: 'Ideation Lab',
    displayName: 'Ideation Lab',
    description: 'Transform ideas into validated concepts with market research and competitive analysis',
    icon: 'Lightbulb',
    color: 'yellow',
    sequence: 1,
    category: 'ideation',
    estimatedDays: 2,
    features: ['Idea Validation', 'Market Research', 'Competitive Analysis'],
    deliverables: ['Validated Idea Report', 'Market Research Document', 'Competitor Analysis'],
  },
  {
    studioId: 'engineering-forge',
    name: 'Engineering Forge',
    displayName: 'Engineering Forge',
    description: 'Build your MVP with AI-powered code generation and architecture design',
    icon: 'Code',
    color: 'blue',
    sequence: 2,
    category: 'development',
    estimatedDays: 4,
    features: ['Code Generation', 'Architecture Design', 'Technical Specifications'],
    deliverables: ['Codebase', 'Architecture Diagram', 'Technical Documentation'],
  },
  {
    studioId: 'market-intelligence',
    name: 'Market Intelligence',
    displayName: 'Market Intelligence',
    description: 'Deep market analysis, competitor insights, and strategic positioning',
    icon: 'TrendingUp',
    color: 'green',
    sequence: 3,
    category: 'market',
    estimatedDays: 2,
    features: ['Market Analysis', 'Competitor Research', 'TAM/SAM/SOM Calculation'],
    deliverables: ['Market Analysis Report', 'Competitor Matrix', 'Market Size Analysis'],
  },
  {
    studioId: 'product-blueprint',
    name: 'Product Blueprint',
    displayName: 'Product Blueprint',
    description: 'Design comprehensive product specifications and feature roadmaps',
    icon: 'FileText',
    color: 'indigo',
    sequence: 4,
    category: 'product',
    estimatedDays: 2,
    features: ['Product Specifications', 'Feature Roadmap', 'User Stories'],
    deliverables: ['Product Requirements Document', 'Feature Roadmap', 'User Stories'],
  },
  {
    studioId: 'experience-design',
    name: 'Experience Design',
    displayName: 'Experience Design',
    description: 'Create stunning UI/UX designs with prototypes and design systems',
    icon: 'Palette',
    color: 'pink',
    sequence: 5,
    category: 'design',
    estimatedDays: 3,
    features: ['UI/UX Design', 'Prototyping', 'Design System'],
    deliverables: ['Wireframes', 'UI Mockups', 'Interactive Prototype', 'Design System'],
  },
  {
    studioId: 'quality-assurance-lab',
    name: 'Quality Assurance Lab',
    displayName: 'Quality Assurance Lab',
    description: 'Ensure excellence with comprehensive testing strategies and automation',
    icon: 'Shield',
    color: 'cyan',
    sequence: 6,
    category: 'quality',
    estimatedDays: 2,
    features: ['Test Case Generation', 'QA Strategy', 'Automation Setup'],
    deliverables: ['Test Cases', 'QA Strategy Document', 'Automation Scripts'],
  },
  {
    studioId: 'growth-engine',
    name: 'Growth Engine',
    displayName: 'Growth Engine',
    description: 'Scale rapidly with data-driven marketing, SEO mastery, and viral growth tactics',
    icon: 'TrendingUp',
    color: 'purple',
    sequence: 7,
    category: 'growth',
    estimatedDays: 3,
    features: ['Marketing Strategy', 'SEO Optimization', 'Growth Hacking'],
    deliverables: ['Growth Marketing Strategy', 'SEO Optimization Plan', 'Growth Hacking Playbook'],
  },
  {
    studioId: 'launch-command',
    name: 'Launch Command',
    displayName: 'Launch Command',
    description: 'Deploy with confidence - strategies, automation, and infrastructure as code',
    icon: 'Rocket',
    color: 'orange',
    sequence: 8,
    category: 'deployment',
    estimatedDays: 3,
    features: ['Deployment Strategy', 'DevOps Setup', 'Infrastructure as Code'],
    deliverables: ['Deployment Strategy Document', 'CI/CD Pipeline Configuration', 'Terraform/IaC Templates'],
  },
  {
    studioId: 'operations-hub',
    name: 'Operations Hub',
    displayName: 'Operations Hub',
    description: 'Optimize and scale with performance analytics, process improvement, and continuous optimization',
    icon: 'Activity',
    color: 'teal',
    sequence: 9,
    category: 'operations',
    estimatedDays: 2,
    features: ['Performance Analytics', 'Process Optimization', 'Continuous Improvement'],
    deliverables: ['Performance Analytics Report', 'Process Optimization Plan', 'Continuous Improvement Framework'],
  },
  {
    studioId: 'deployment-studio',
    name: 'Deployment Studio',
    displayName: 'Deployment Studio',
    description: 'One-click deployment to all major cloud providers with automated CI/CD and custom domains',
    icon: 'Rocket',
    color: 'indigo',
    sequence: 10,
    category: 'deployment',
    estimatedDays: 1,
    features: ['Cloud Provider Deploy', 'CI/CD Setup', 'Domain Configuration'],
    deliverables: ['Deployment Configuration', 'CI/CD Pipeline', 'Domain Setup Guide'],
  },
];

/**
 * Initialize all Wizards studios in the database
 * This ensures studios are available for session creation
 */
export async function initializeWizardsStudios() {
  console.log('🎨 Initializing Wizards studios...');

  for (const studioConfig of STUDIOS_CONFIG) {
    try {
      // Upsert studio (insert or update if exists)
      const [result] = await db
        .insert(wizardsStudios)
        .values({
          studioId: studioConfig.studioId,
          name: studioConfig.name,
          displayName: studioConfig.displayName,
          description: studioConfig.description,
          icon: studioConfig.icon,
          color: studioConfig.color,
          sequence: studioConfig.sequence,
          category: studioConfig.category,
          estimatedDays: studioConfig.estimatedDays,
          features: studioConfig.features,
          deliverables: studioConfig.deliverables,
          isActive: true,
          version: '1.0',
        })
        .onConflictDoUpdate({
          target: wizardsStudios.studioId,
          set: {
            name: studioConfig.name,
            displayName: studioConfig.displayName,
            description: studioConfig.description,
            icon: studioConfig.icon,
            color: studioConfig.color,
            sequence: studioConfig.sequence,
            category: studioConfig.category,
            estimatedDays: studioConfig.estimatedDays,
            features: studioConfig.features,
            deliverables: studioConfig.deliverables,
            updatedAt: new Date(),
          },
        })
        .returning();

      console.log(`  ✅ Upserted studio '${studioConfig.studioId}' (id: ${result.id})`);
    } catch (error) {
      console.error(`  ❌ Error upserting studio '${studioConfig.studioId}':`, error);
    }
  }

  console.log('✅ Wizards studios initialization complete');
}
