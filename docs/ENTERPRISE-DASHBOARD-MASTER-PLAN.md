# NyayaVighya SDK v3.1 - Enterprise Dashboard Master Plan

**Version:** 3.1.5  
**Date:** January 26, 2026  
**Target:** Unified Legal AI Platform Management

---

## Executive Summary

This plan defines the comprehensive Enterprise Dashboard architecture for NyayaVighya SDK v3.1, providing **Super Admins**, **Organization Admins**, and **Legal Practitioners** with full control over the legal AI platform. The dashboard consolidates all 275 legal agents, 23 LLM providers, 530+ tools, and advanced legal AI features into a single, intuitive management interface.

---

## Dashboard Architecture

### Role Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      SUPER ADMIN (Platform Owner)                        │
│  ✓ Global feature flags        ✓ All law firms/organizations            │
│  ✓ Platform-wide algorithms    ✓ System-wide billing                    │
│  ✓ LLM provider management     ✓ Legal agent marketplace                │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         ▼                          ▼                          ▼
┌─────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   ORG ADMIN     │    │     ORG ADMIN       │    │     ORG ADMIN       │
│   (Law Firm A)  │    │   (Corporate Legal) │    │   (Legal Tech Co)   │
│  ✓ Firm agents  │    │  ✓ Custom agents    │    │  ✓ Agent config     │
│  ✓ Case settings│    │  ✓ Compliance rules │    │  ✓ Team management  │
│  ✓ Usage/billing│    │  ✓ LLM allocation   │    │  ✓ Feature toggles  │
└─────────────────┘    └─────────────────────┘    └─────────────────────┘
         │                          │                          │
    ┌────┴────┐              ┌──────┴──────┐            ┌──────┴──────┐
    ▼         ▼              ▼             ▼            ▼             ▼
┌───────┐ ┌───────┐    ┌───────┐   ┌───────┐    ┌───────┐   ┌───────┐
│Partner│ │Associate│   │Counsel│   │Paralegal│  │Developer│ │Analyst│
└───────┘ └───────┘    └───────┘   └───────┘    └───────┘   └───────┘
```

---

## Navigation Structure

### Super Admin Dashboard (`/admin`)

```
🏠 NyayaVighya Admin Dashboard
├── 📊 Platform Overview
│   ├── Health Status (all providers, agents, services)
│   ├── Real-time Metrics (requests, tokens, errors)
│   ├── Cost Analysis (across all organizations)
│   └── Global Alerts & Incidents
│
├── 🏢 Organizations (Law Firms & Legal Departments)
│   ├── Organization List (CRUD)
│   ├── Subscription Management (Free/Starter/Pro/Enterprise)
│   ├── Usage Quotas & Limits
│   ├── Billing & Invoices
│   └── Organization Health Scores
│
├── ⚖️ Legal Agents Registry (275 Agents)
│   ├── Agent Catalog Browser
│   │   ├── Filter by Category (Criminal/Civil/Corporate/etc.)
│   │   ├── Filter by Statute (IPC/BNS/Companies Act/etc.)
│   │   ├── Filter by ROMA Level (L1/L2/L3/L4)
│   │   ├── Filter by Language (22 Indian languages)
│   │   └── Search & Advanced Filters
│   ├── Agent Details View
│   │   ├── 22-Point Configuration (Parlant Standard)
│   │   ├── Performance Metrics
│   │   ├── Case Success Rates
│   │   └── Cost Analysis
│   ├── Custom Legal Agent Creator
│   │   ├── Step 1: Basic Info (Name, Category, Jurisdiction)
│   │   ├── Step 2: Statute Coverage
│   │   ├── Step 3: ROMA Level & Autonomy
│   │   ├── Step 4: Legal Capabilities & Tools
│   │   ├── Step 5: System Prompt Builder
│   │   ├── Step 6: Model Selection & Fallbacks
│   │   ├── Step 7: Guardrails & Ethics
│   │   ├── Step 8: Testing & Validation
│   │   └── Step 9: Deploy & Monitor
│   └── Legal Agent Teams
│       ├── Practice Area Teams
│       ├── Case-specific Teams
│       └── Collaboration Rules
│
├── 🧠 LLM Providers (23 Providers)
│   ├── Provider Health Dashboard
│   │   ├── Real-time Status (Green/Yellow/Red)
│   │   ├── Latency Metrics
│   │   ├── Error Rates
│   │   └── Uptime History
│   ├── Provider Configuration
│   │   ├── API Key Management
│   │   ├── Rate Limits
│   │   ├── Cost Settings
│   │   └── Fallback Chains
│   ├── LLM Allocation Rules
│   │   ├── Per-Organization Quotas
│   │   ├── Per-Agent Model Preferences
│   │   ├── Cost Optimization Rules
│   │   └── Priority Routing
│   └── Model Registry (750+ Models)
│       ├── Model Catalog
│       ├── Legal Capability Matrix
│       ├── Benchmark Scores
│       └── Pricing Calculator
│
├── 📜 Indian Statutes Database
│   ├── Statute Browser (50+ Acts)
│   │   ├── Constitution of India
│   │   ├── Criminal Laws (IPC, BNS, CrPC, BNSS)
│   │   ├── Civil Laws (CPC, Limitation, TPA)
│   │   ├── Corporate Laws (Companies Act, SEBI)
│   │   └── Specialized Laws
│   ├── Amendment Tracker
│   ├── Section Cross-References
│   └── Precedent Links
│
├── 🎯 Legal Orchestration Algorithms
│   ├── Task Decomposition
│   │   ├── ACONIC (Constraint-based)
│   │   ├── ADaPT (Adaptive)
│   │   ├── HTA (Hierarchical)
│   │   └── Swarm Intelligence
│   ├── Case Workflow Patterns
│   │   ├── Litigation Pipeline
│   │   ├── Corporate Transaction
│   │   ├── Compliance Audit
│   │   └── Research & Opinion
│   ├── Collective Intelligence
│   │   ├── Case Strategy Brainstorm
│   │   ├── Risk Assessment Consensus
│   │   ├── Argument Debate Mode
│   │   └── Legal Opinion Synthesis
│   └── Queen Orchestrator Settings
│       ├── Legal Routing Rules
│       ├── Jurisdiction Detection
│       └── Expertise Matching
│
├── 🧠 Learning & Adaptation
│   ├── GRPO (Reinforcement Learning)
│   │   ├── Case Outcome Training
│   │   ├── Policy Updates
│   │   ├── Legal Reward Functions
│   │   └── Per-Agent Learning
│   ├── Precedent Learning
│   │   ├── New Judgment Ingestion
│   │   ├── Ratio Decidendi Extraction
│   │   └── Citation Graph Updates
│   └── Continuous Improvement
│       ├── Practitioner Feedback
│       ├── Model Fine-tuning Queue
│       └── A/B Testing Framework
│
├── 👥 Human-in-the-Loop (HITL) for Legal
│   ├── Confidence Thresholds
│   │   ├── Auto-Approve (≥0.95) - Routine research
│   │   ├── Review Queue (0.70-0.95) - Draft documents
│   │   ├── Senior Review (<0.70) - Critical filings
│   │   └── Custom Thresholds by Case Type
│   ├── Legal Decision Cards Queue
│   │   ├── Pending Senior Approval
│   │   ├── Ethics Committee Review
│   │   └── Client Approval Required
│   └── Audit Trail
│       ├── All Agent Actions Logged
│       ├── Human Override History
│       └── Compliance Reports
│
├── 🌐 Indian Language Support (22 Languages)
│   ├── Language Configuration
│   ├── Legal Terminology by Language
│   ├── Translation Quality Metrics
│   └── Sarvam AI Settings
│
├── 📊 Analytics & Reporting
│   ├── Case Analytics
│   │   ├── Case Outcomes by Type
│   │   ├── Success Rates by Agent
│   │   ├── Time to Resolution
│   │   └── Cost per Case
│   ├── Research Analytics
│   │   ├── Search Patterns
│   │   ├── Most Cited Precedents
│   │   ├── Research Quality Scores
│   │   └── Coverage Analysis
│   ├── Usage Analytics
│   │   ├── Token Consumption
│   │   ├── API Call Patterns
│   │   ├── Cost Breakdown
│   │   └── Trend Analysis
│   └── Custom Reports
│       ├── Report Builder
│       ├── Scheduled Reports
│       └── Export (PDF/CSV/API)
│
├── 🛡️ Security & Compliance
│   ├── Legal Guardrails
│   │   ├── Client Confidentiality
│   │   ├── Privilege Protection
│   │   ├── Citation Verification
│   │   └── Ethics Compliance
│   ├── Access Control
│   │   ├── Role-Based Permissions
│   │   ├── Matter-Level Access
│   │   ├── Ethical Walls
│   │   └── API Key Management
│   ├── Audit Logs
│   │   ├── Agent Execution Logs
│   │   ├── Document Access Logs
│   │   ├── Admin Action Logs
│   │   └── Security Events
│   └── Regulatory Compliance
│       ├── Bar Council Rules
│       ├── IT Act 2000
│       ├── DPDP Act 2023
│       └── GDPR (International)
│
└── ⚙️ System Settings
    ├── Platform Configuration
    │   ├── Database Settings
    │   ├── Cache Settings
    │   ├── Queue Settings
    │   └── Logging Levels
    ├── Integrations
    │   ├── Court e-Filing Systems
    │   ├── Legal Research Platforms
    │   ├── Practice Management
    │   └── Billing Systems
    └── Maintenance
        ├── System Health
        ├── Database Migrations
        └── Cache Management
```

---

### Organization Admin Dashboard (`/org-admin`)

```
🏢 Law Firm Dashboard
├── 📊 Overview
│   ├── Active Cases Summary
│   ├── Upcoming Hearings
│   ├── Team Activity
│   └── Billing Summary
│
├── ⚖️ Cases & Matters
│   ├── Case List
│   ├── Matter Management
│   ├── Client Portal
│   └── Document Repository
│
├── 🤖 Legal Agents
│   ├── Enabled Agents (by practice area)
│   ├── Agent Configuration
│   ├── Custom Agent Settings
│   └── Agent Performance
│
├── 👥 Team Management
│   ├── Partners
│   ├── Associates
│   ├── Paralegals
│   └── Role Permissions
│
├── 📊 Analytics
│   ├── Case Metrics
│   ├── Team Performance
│   ├── Revenue Analysis
│   └── AI Efficiency
│
└── ⚙️ Settings
    ├── Firm Profile
    ├── Billing Configuration
    ├── Integration Settings
    └── Security Policies
```

---

## Feature Matrix by Plan

| Feature | Free | Starter | Professional | Enterprise |
|---------|------|---------|--------------|------------|
| **Legal Agents** | 10 | 50 | 150 | All 275 |
| **Categories** | 5 | 15 | 25 | All 29 |
| **LLM Providers** | 3 | 10 | 18 | All 23 |
| **Languages** | 3 | 10 | 18 | All 22 |
| **API Keys** | 2 | 5 | 20 | Unlimited |
| **Team Members** | 2 | 10 | 50 | Unlimited |
| **Custom Agents** | ❌ | ❌ | 5 | Unlimited |
| **GRPO Learning** | ❌ | ❌ | ✅ | ✅ |
| **Ethical Walls** | ❌ | Basic | Advanced | Full |
| **Court e-Filing** | ❌ | ❌ | ✅ | ✅ |
| **White Label** | ❌ | ❌ | ❌ | ✅ |
| **On-Premise** | ❌ | ❌ | ❌ | ✅ |
| **Support** | Community | Email | Priority | Dedicated |

---

## Legal Agent Card Component

```
┌────────────────────────────────────────┐
│  ⚖️ Criminal Defense Specialist        │
│  ─────────────────────────────         │
│  L3 • Senior • Criminal Law            │
│                                         │
│  Statutes: BNS 2023, BNSS 2023,        │
│  IPC, CrPC, Evidence Act                │
│                                         │
│  Languages: English, Hindi, Tamil       │
│                                         │
│  Models: claude-opus-4.5, gpt-5.1      │
│                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │Configure│ │ Execute │ │Analytics│  │
│  └─────────┘ └─────────┘ └─────────┘  │
└────────────────────────────────────────┘
```

---

## Implementation Status

| Phase | Target | Status |
|-------|--------|--------|
| Core Dashboard | Feb 2026 | ✅ Complete |
| Agent Management | Feb 2026 | ✅ Complete |
| LLM Management | Feb 2026 | ✅ Complete |
| Legal Workflows | Feb 2026 | ✅ Complete |
| Analytics | Feb 2026 | ✅ Complete |
| Integrations | Mar 2026 | 🔄 In Progress |
| Mobile App | Mar 2026 | ⏳ Pending |

---

## UI/UX Design Principles

### Design System
- **Theme**: Light-first with legal blue accents (#1e3a5f)
- **Colors**: Primary (#1e3a5f), Success (#10B981), Warning (#F59E0B), Error (#EF4444)
- **Typography**: Inter for UI, JetBrains Mono for code, Noto Sans for Indian scripts
- **Spacing**: 4px grid system
- **Components**: shadcn/ui + Radix primitives

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support (Hindi, English)
- High contrast mode

---

**Document Version**: 3.1.5  
**Maintainer**: NyayaVighya Product Team  
**Platform**: NyayaVighya SDK v3.1
