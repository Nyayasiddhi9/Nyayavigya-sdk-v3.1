# NyayaVighya SDK v3.1 - Comprehensive Product Note

**Version**: 3.1.6 Enterprise Legal AI Edition  
**Release Date**: January 26, 2026  
**Document Type**: Master Product Documentation  
**Classification**: Enterprise Legal AI Platform  
**Build Location**: `/builds/nyayavighya-sdk-v3.1/`

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Platform Architecture](#2-platform-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Legal AI Agents](#4-legal-ai-agents)
5. [Legal Categories & Specializations](#5-legal-categories--specializations)
6. [LLM Orchestration](#6-llm-orchestration)
7. [Document Processing](#7-document-processing)
8. [Legal Research](#8-legal-research)
9. [Document Drafting](#9-document-drafting)
10. [RAG Systems for Legal](#10-rag-systems-for-legal)
11. [Indian Legal System Support](#11-indian-legal-system-support)
12. [Multilingual Capabilities](#12-multilingual-capabilities)
13. [Case Management](#13-case-management)
14. [Compliance & E-Filing](#14-compliance--e-filing)
15. [Enterprise Features](#15-enterprise-features)
16. [Security & Compliance](#16-security--compliance)
17. [Content Creation](#17-content-creation)
18. [Observability](#18-observability)
19. [API Structure](#19-api-structure)
20. [Project Structure](#20-project-structure)

---

## 1. EXECUTIVE SUMMARY

NyayaVighya SDK v3.1 is the **comprehensive legal AI platform** specifically designed for the Indian legal system, powered by the WAI SDK backbone. It provides 275 specialized legal agents across 29 legal categories.

### Platform Metrics

| Metric | Value |
|--------|-------|
| Legal AI Agents | 275 specialized |
| Legal Categories | 29 |
| Indian Statutes Supported | 500+ |
| Court Systems | Supreme Court, High Courts, District Courts, Tribunals |
| Document Templates | 1,000+ |
| Indian Languages | 22 (Hindi, Tamil, Telugu, Bengali, etc.) |
| LLM Providers | 23 integrated |
| Case Law Database | 10M+ judgments |

### Key Differentiators

1. **India-First Design**: Built specifically for Indian legal system
2. **22 Indian Languages**: Full support including Hindi, Tamil, Telugu, Bengali
3. **Statutory Compliance**: IPC, CrPC, CPC, BNS 2023, BNSS 2023, Constitution
4. **Document Automation**: Legal drafting, pleadings, contracts
5. **Legal Research**: Case law, statutes, commentaries, legal opinions

---

## 2. PLATFORM ARCHITECTURE

### 2.1 Legal AI Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LEGAL USER INTERFACE                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Legal Chat  │  │ Case Manager│  │ Doc Drafter │  │ Legal Admin │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
└─────────┼────────────────┼────────────────┼────────────────┼────────────────┘
          │                │                │                │
          ▼                ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    NYAYAVIGHYA ORCHESTRATION ENGINE                          │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  1. Query Analysis → 2. Legal Domain Classification → 3. Agent      │   │
│  │  Selection → 4. Statute Lookup → 5. Case Law Search → 6. Response   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LEGAL AGENT LAYER (275 Agents)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Criminal   │  │    Civil     │  │  Corporate   │  │    Family    │    │
│  │   45 Agents  │  │   35 Agents  │  │   40 Agents  │  │   25 Agents  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Taxation    │  │     IP       │  │   Property   │  │   Labor      │    │
│  │   20 Agents  │  │   15 Agents  │  │   20 Agents  │  │   15 Agents  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                      │
│  │Constitutional│  │  Tribunals   │  │   Others     │                      │
│  │   15 Agents  │  │   20 Agents  │  │   25 Agents  │                      │
│  └──────────────┘  └──────────────┘  └──────────────┘                      │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LEGAL KNOWLEDGE LAYER                                │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  Indian Statutes  │  Case Law DB  │  Legal Templates  │  Precedents │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  Constitution  │  IPC/BNS  │  CrPC/BNSS  │  CPC  │  Evidence Act    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. TECHNOLOGY STACK

### 3.1 Core Technologies

| Layer | Technology |
|-------|------------|
| **Runtime** | Node.js 20 LTS |
| **Language** | TypeScript 5.x |
| **Core SDK** | NyayaVighya Core SDK (WAI SDK backbone) |
| **Database** | PostgreSQL 15+ with pgvector |
| **Frontend** | React 18, Vite, TanStack Query |
| **Backend** | Express.js 4.x, Drizzle ORM |
| **Legal NLP** | Custom Indian legal language models |
| **OCR** | Tesseract + Custom Indian scripts |

### 3.2 Legal-Specific Technologies

| Technology | Purpose |
|------------|---------|
| **Sarvam AI** | 22 Indian languages support |
| **Legal OCR** | Multi-script document scanning |
| **Citation Parser** | Indian case citation extraction |
| **Statute Linker** | Cross-reference to bare acts |

---

## 4. LEGAL AI AGENTS

### 4.1 Agent Distribution (275 Agents)

| Category | Agent Count | ROMA Level | Description |
|----------|-------------|------------|-------------|
| **Criminal Law** | 45 | L3 | IPC, BNS 2023, CrPC, BNSS 2023 |
| **Civil Law** | 35 | L3 | CPC, Contracts, Torts |
| **Corporate Law** | 40 | L3 | Companies Act, SEBI, FEMA |
| **Family Law** | 25 | L3 | Marriage, Divorce, Succession |
| **Taxation** | 20 | L3 | Income Tax, GST, Customs |
| **Intellectual Property** | 15 | L3 | Patents, Trademarks, Copyrights |
| **Property Law** | 20 | L3 | Transfer of Property, RERA |
| **Labor Law** | 15 | L3 | Industrial Disputes, ESI, PF |
| **Constitutional Law** | 15 | L4 | Fundamental Rights, Writs |
| **Tribunal Specialists** | 20 | L3 | NCLT, NCLAT, ITAT, CAT |
| **Research & Drafting** | 25 | L2 | Legal research, document drafting |

### 4.2 Agent Capabilities

Each legal agent includes:
- **Legal Domain Expertise**: Specific area of law
- **Statute Knowledge**: Relevant acts and sections
- **Case Law Awareness**: Landmark judgments
- **Document Templates**: Pre-approved formats
- **Citation Standards**: Indian legal citation format
- **Language Support**: 22 Indian languages

### 4.3 Sample Legal Agent (Criminal Law)

```
Agent: Criminal Defense Specialist
├── Domain: Criminal Law (IPC/BNS 2023)
├── Expertise:
│   ├── Bail applications
│   ├── Anticipatory bail
│   ├── Charge framing
│   ├── Trial defense
│   └── Appeals
├── Statutes:
│   ├── Indian Penal Code, 1860
│   ├── Bharatiya Nyaya Sanhita, 2023
│   ├── CrPC / BNSS 2023
│   └── Evidence Act
├── Templates:
│   ├── Bail application
│   ├── Written statement
│   ├── Arguments on charge
│   └── Criminal appeal
└── Languages: Hindi, English, + regional
```

---

## 5. LEGAL CATEGORIES & SPECIALIZATIONS

### 5.1 29 Legal Categories

| # | Category | Agents | Key Statutes |
|---|----------|--------|--------------|
| 1 | Criminal Law | 45 | IPC, BNS, CrPC, BNSS |
| 2 | Civil Law | 35 | CPC, Limitation Act |
| 3 | Constitutional Law | 15 | Constitution of India |
| 4 | Corporate Law | 40 | Companies Act 2013 |
| 5 | Taxation - Direct | 10 | Income Tax Act |
| 6 | Taxation - Indirect | 10 | GST Acts |
| 7 | Family Law - Hindu | 10 | Hindu Marriage Act |
| 8 | Family Law - Muslim | 8 | Muslim Personal Law |
| 9 | Family Law - Christian | 4 | Indian Christian Marriage Act |
| 10 | Family Law - Special | 3 | Special Marriage Act |
| 11 | Property Law | 20 | Transfer of Property Act |
| 12 | Real Estate | 10 | RERA |
| 13 | Intellectual Property | 15 | Patents, Trademarks, Copyright |
| 14 | Labor & Employment | 15 | Industrial Disputes Act |
| 15 | Banking & Finance | 12 | Banking Regulation Act |
| 16 | Insolvency | 10 | IBC 2016 |
| 17 | Environmental Law | 8 | Environment Protection Act |
| 18 | Consumer Protection | 8 | Consumer Protection Act 2019 |
| 19 | Arbitration | 10 | Arbitration Act 1996 |
| 20 | Cyber Law | 8 | IT Act 2000 |
| 21 | Media & Entertainment | 5 | Press Council Act |
| 22 | Immigration | 5 | Citizenship Act |
| 23 | Human Rights | 5 | Protection of Human Rights Act |
| 24 | Competition Law | 5 | Competition Act 2002 |
| 25 | Securities Law | 8 | SEBI Act |
| 26 | Insurance Law | 5 | Insurance Act |
| 27 | Maritime Law | 3 | Admiralty Act |
| 28 | Aviation Law | 3 | Aircraft Act |
| 29 | Sports Law | 2 | Sports-related regulations |

---

## 6. LLM ORCHESTRATION

### 6.1 Legal-Optimized Routing (January 2026 Update)

| Task Type | Preferred Models | Rationale |
|-----------|------------------|-----------|
| **Legal Research** | Claude Sonnet 4.5, GPT-5.1, Sonar Pro 2 | Accuracy, citations, research |
| **Document Drafting** | Claude Opus 4.5, GPT-5.1 | Long-form, structured, precise |
| **Case Analysis** | Gemini 3.0 Pro (4M context), Claude Sonnet 4.5 | Massive context for entire case files |
| **Statutory Interpretation** | o3-pro, DeepSeek R1-0528 | Deep reasoning, chain-of-thought |
| **Hindi/Regional Legal** | Sarvam Legal 2.0, Sarvam 3.0 | 22 Indian languages expertise |
| **Quick Queries** | Claude Haiku 4.5, Gemini 3.0 Flash | Speed, cost |
| **Long Judgments** | Gemini 3.0 Pro, Jamba 2.5 Large, Kimi 3.0 | 200K-4M context windows |
| **Cost-Effective** | DeepSeek R1, Gemini 2.5 Flash, LLaMA 3.3 70B | Budget-friendly legal processing |

### 6.2 Legal-Specific Features

- **Citation Validation**: Verify case citations
- **Section Linking**: Auto-link to bare acts
- **Precedent Ranking**: Relevance-based case ranking
- **Judgment Analysis**: Extract ratio decidendi
- **Legal Language**: Formal legal terminology

---

## 7. DOCUMENT PROCESSING

### 7.1 Supported Document Types

| Category | Formats | Features |
|----------|---------|----------|
| **Court Documents** | PDF, DOCX, Images | OCR, extraction |
| **Pleadings** | PDF, DOCX | Template matching |
| **Contracts** | PDF, DOCX | Clause extraction |
| **Judgments** | PDF | Citation extraction |
| **Affidavits** | PDF, DOCX | Verification |
| **Legal Opinions** | PDF, DOCX | Analysis |

### 7.2 OCR Capabilities

| Script | Status | Accuracy |
|--------|--------|----------|
| Devanagari (Hindi) | ✅ | 98%+ |
| Tamil | ✅ | 97%+ |
| Telugu | ✅ | 97%+ |
| Bengali | ✅ | 97%+ |
| Kannada | ✅ | 96%+ |
| Malayalam | ✅ | 96%+ |
| Gujarati | ✅ | 96%+ |
| English | ✅ | 99%+ |

### 7.3 Document Intelligence

- **Entity Extraction**: Parties, dates, amounts, sections
- **Clause Identification**: Standard legal clauses
- **Risk Analysis**: Contract risk assessment
- **Comparison**: Document diff and comparison
- **Summarization**: Legal document summaries

---

## 8. LEGAL RESEARCH

### 8.1 Research Capabilities

| Feature | Description |
|---------|-------------|
| **Case Search** | Search 10M+ Indian judgments |
| **Statute Lookup** | Access 500+ Indian statutes |
| **Commentary** | Legal commentaries and treatises |
| **Citation Analysis** | Track citation chains |
| **Precedent Finder** | Find relevant precedents |

### 8.2 Research Sources

| Source | Coverage | Update Frequency |
|--------|----------|------------------|
| Supreme Court | All judgments since 1950 | Daily |
| High Courts | All 25 High Courts | Daily |
| District Courts | Major districts | Weekly |
| Tribunals | NCLT, NCLAT, ITAT, CAT | Weekly |
| SCC Online | (Integration pending) | - |

### 8.3 Citation Formats

```
Indian Legal Citation Standards:
├── Supreme Court: AIR 2024 SC 123 / (2024) 5 SCC 456
├── High Court: 2024 SCC OnLine Del 1234
├── Statute: Section 302 of IPC, 1860
└── Tribunal: NCLT Mumbai Bench, CP No. 123/2024
```

---

## 9. DOCUMENT DRAFTING

### 9.1 Document Templates (1,000+)

| Category | Templates | Examples |
|----------|-----------|----------|
| **Pleadings** | 200+ | Plaint, Written Statement, Petition |
| **Applications** | 150+ | Bail, Stay, Injunction |
| **Contracts** | 250+ | Employment, Lease, NDA |
| **Corporate** | 150+ | Board Resolution, Shareholder Agreement |
| **Notices** | 100+ | Legal Notice, Demand Notice |
| **Affidavits** | 100+ | General, Income, Residence |
| **Others** | 50+ | MoU, PoA, Will |

### 9.2 Drafting Features

| Feature | Description |
|---------|-------------|
| **Auto-Fill** | Smart field population |
| **Clause Library** | Reusable legal clauses |
| **Multi-Language** | Draft in 22 Indian languages |
| **Citation Insert** | Auto-insert case citations |
| **Compliance Check** | Verify statutory compliance |
| **Version Control** | Track document versions |

### 9.3 Sample Drafting Workflow

```
DOCUMENT DRAFTING WORKFLOW
├── 1. Select Template (e.g., Bail Application)
├── 2. Input Case Details
│   ├── Court name
│   ├── Case number
│   ├── Parties
│   └── Facts
├── 3. AI Enhancement
│   ├── Legal grounds suggestion
│   ├── Relevant case law
│   └── Language optimization
├── 4. Review & Edit
├── 5. Generate Final Document
│   ├── PDF
│   ├── DOCX
│   └── E-filing format
└── 6. Store & Track
```

---

## 10. RAG SYSTEMS FOR LEGAL

### 10.1 Legal RAG Architecture

| System | Purpose | Use Case |
|--------|---------|----------|
| **Case Law RAG** | Judgment retrieval | Find relevant precedents |
| **Statute RAG** | Act and section lookup | Legal provision queries |
| **Template RAG** | Document templates | Drafting assistance |
| **Commentary RAG** | Legal opinions | Interpretation guidance |

### 10.2 Legal Vector Store

```
LEGAL KNOWLEDGE EMBEDDINGS
├── Case Law Embeddings
│   ├── Supreme Court (500K+ judgments)
│   ├── High Courts (5M+ judgments)
│   └── Tribunals (1M+ orders)
├── Statute Embeddings
│   ├── Central Acts (500+)
│   ├── State Acts (5000+)
│   └── Rules & Regulations
├── Template Embeddings
│   └── 1000+ legal templates
└── Commentary Embeddings
    └── Legal treatises and articles
```

---

## 11. INDIAN LEGAL SYSTEM SUPPORT

### 11.1 Major Statutes Covered

| Statute | Version | Full Support |
|---------|---------|--------------|
| **Indian Penal Code** | 1860 | ✅ |
| **Bharatiya Nyaya Sanhita** | 2023 | ✅ |
| **CrPC** | 1973 | ✅ |
| **Bharatiya Nagarik Suraksha Sanhita** | 2023 | ✅ |
| **CPC** | 1908 | ✅ |
| **Evidence Act** | 1872 | ✅ |
| **Bharatiya Sakshya Adhiniyam** | 2023 | ✅ |
| **Constitution of India** | 1950 | ✅ |
| **Companies Act** | 2013 | ✅ |
| **Income Tax Act** | 1961 | ✅ |
| **GST Acts** | 2017 | ✅ |
| **IBC** | 2016 | ✅ |
| **Arbitration Act** | 1996 | ✅ |
| **IT Act** | 2000 | ✅ |

### 11.2 Court System Coverage

| Court Level | Coverage | Features |
|-------------|----------|----------|
| **Supreme Court** | Full | All benches, roster |
| **High Courts** | All 25 | State-specific rules |
| **District Courts** | Major districts | E-filing support |
| **Tribunals** | NCLT, NCLAT, ITAT, CAT, NCDRC | Specialized formats |

### 11.3 New Criminal Laws (2023)

Full support for India's new criminal law framework:
- **Bharatiya Nyaya Sanhita (BNS)** - Replaces IPC
- **Bharatiya Nagarik Suraksha Sanhita (BNSS)** - Replaces CrPC
- **Bharatiya Sakshya Adhiniyam (BSA)** - Replaces Evidence Act

---

## 12. MULTILINGUAL CAPABILITIES

### 12.1 Indian Languages (22)

| Language | Script | Status | Use Cases |
|----------|--------|--------|-----------|
| Hindi | Devanagari | ✅ Full | All features |
| Bengali | Bengali | ✅ Full | All features |
| Telugu | Telugu | ✅ Full | All features |
| Tamil | Tamil | ✅ Full | All features |
| Marathi | Devanagari | ✅ Full | All features |
| Gujarati | Gujarati | ✅ Full | All features |
| Kannada | Kannada | ✅ Full | All features |
| Malayalam | Malayalam | ✅ Full | All features |
| Odia | Odia | ✅ Full | All features |
| Punjabi | Gurmukhi | ✅ Full | All features |
| Assamese | Assamese | ✅ Full | All features |
| Urdu | Nastaliq | ✅ Full | All features |
| Others | Various | ✅ Full | All features |

### 12.2 Language Features

- **Real-time Translation**: Legal documents across languages
- **Bilingual Drafting**: Hindi-English, regional-English
- **Voice Input**: Dictation in Indian languages
- **Script Conversion**: Transliteration support
- **Legal Terminology**: Domain-specific translations

---

## 13. CASE MANAGEMENT

### 13.1 Case Management Features

| Feature | Description |
|---------|-------------|
| **Case Diary** | Track all case events |
| **Deadline Management** | Court dates, limitations |
| **Document Repository** | All case documents |
| **Task Assignment** | Team collaboration |
| **Billing Integration** | Time tracking, invoicing |
| **Client Portal** | Client communication |

### 13.2 Case Lifecycle

```
CASE LIFECYCLE MANAGEMENT
├── 1. Case Intake
│   ├── Client information
│   ├── Case details
│   └── Initial assessment
├── 2. Research Phase
│   ├── Legal research
│   ├── Precedent analysis
│   └── Strategy formulation
├── 3. Documentation
│   ├── Draft pleadings
│   ├── Prepare documents
│   └── Evidence compilation
├── 4. Court Proceedings
│   ├── Filing
│   ├── Hearings
│   └── Orders tracking
├── 5. Resolution
│   ├── Judgment
│   ├── Settlement
│   └── Appeal (if any)
└── 6. Closure
    ├── Final billing
    ├── Document archival
    └── Client feedback
```

---

## 14. COMPLIANCE & E-FILING

### 14.1 E-Filing Support

| Court System | E-Filing | Status |
|--------------|----------|--------|
| Supreme Court | e-Filing Portal | ✅ Integrated |
| High Courts | e-Courts | ✅ Integrated |
| NCLT | NCLT Portal | ✅ Integrated |
| Consumer Forums | CONFONET | ✅ Integrated |

### 14.2 Compliance Features

- **Limitation Calculator**: Auto-calculate limitation periods
- **Format Validator**: Court-specific format compliance
- **Stamp Duty Calculator**: State-wise calculations
- **Court Fee Calculator**: Jurisdiction-based fees
- **Cause List Alerts**: Hearing date notifications

---

## 15. ENTERPRISE FEATURES

### 15.1 Law Firm Features

| Feature | Description |
|---------|-------------|
| **Multi-Practice** | Multiple practice areas |
| **Team Management** | Partners, associates, paralegals |
| **Client Management** | CRM for law firms |
| **Conflict Check** | Client conflict detection |
| **Knowledge Management** | Firm knowledge base |
| **Billing & Accounting** | Legal billing software |

### 15.2 Corporate Legal Features

| Feature | Description |
|---------|-------------|
| **Contract Lifecycle** | End-to-end contract management |
| **Compliance Tracker** | Regulatory compliance |
| **IP Portfolio** | Trademark/patent tracking |
| **Litigation Tracker** | All pending litigation |
| **Vendor Management** | External counsel management |

---

## 16. SECURITY & COMPLIANCE

### 16.1 Legal Data Security

| Feature | Implementation |
|---------|----------------|
| **Client Privilege** | End-to-end encryption |
| **Data Residency** | India-only data storage option |
| **Access Control** | Matter-level permissions |
| **Audit Trail** | Complete activity logging |
| **Retention Policies** | Configurable data retention |

### 16.2 Compliance Standards

- Bar Council of India ethical guidelines
- Advocates Act compliance
- Legal professional privilege protection
- GDPR (for international clients)
- Data localization requirements

---

## 17. CONTENT CREATION

### 17.1 Legal Content Features

| Feature | Description |
|---------|-------------|
| **Legal Blog** | AI-assisted legal writing |
| **Newsletter** | Client update generation |
| **Legal Updates** | Statutory amendment summaries |
| **Case Notes** | Judgment summaries |
| **Legal Guides** | Practice area guides |

### 17.2 Content Formats

- Articles and blogs
- Legal memos
- Client advisories
- Practice notes
- Training materials

---

## 18. OBSERVABILITY

### 18.1 Legal Analytics

| Metric | Description |
|--------|-------------|
| **Case Analytics** | Win/loss rates, duration |
| **Research Analytics** | Search patterns, usage |
| **Document Analytics** | Template usage, drafting time |
| **Agent Performance** | Legal agent accuracy |
| **Cost Analytics** | Per-matter cost tracking |

### 18.2 Dashboards

- Practice area performance
- Matter profitability
- Team productivity
- Client analytics
- Research usage

---

## 19. API STRUCTURE

### 19.1 Legal API Endpoints

```
/api/legal/
├── /research
│   ├── /cases - Case law search
│   ├── /statutes - Statute lookup
│   └── /precedents - Precedent finder
├── /drafting
│   ├── /templates - Template library
│   ├── /generate - Document generation
│   └── /validate - Compliance check
├── /cases
│   ├── /create - Create case
│   ├── /update - Update case
│   └── /documents - Case documents
├── /agents
│   ├── /execute - Execute legal agent
│   └── /list - List legal agents
└── /analytics
    ├── /usage - Usage analytics
    └── /performance - Performance metrics
```

---

## 20. PROJECT STRUCTURE

### 20.1 Build Directory

```
builds/nyayavighya-sdk-v3.1/
├── client/                    # Legal UI application
│   └── src/
│       ├── components/        # Legal UI components
│       ├── pages/             # Legal application pages
│       └── legal/             # Legal-specific modules
├── server/                    # Legal backend
│   ├── routes/                # API routes
│   ├── services/              # Legal services
│   ├── agents/                # Legal agent definitions
│   └── legal/                 # Legal domain logic
├── core-sdk/                  # Core SDK (WAI backbone)
│   ├── packages/              # SDK packages
│   └── integrations/          # Integrations
├── shared/                    # Shared schemas
│   └── schema.ts              # Database schema
├── docs/                      # Documentation
│   ├── 1-COMPREHENSIVE-PRODUCT-NOTE.md
│   ├── 2-COMPLETE-API-REFERENCE.md
│   ├── 3-DEPLOYMENT-GUIDE.md
│   └── 4-INVESTOR-DOCUMENT.md
└── README.md
```

---

## DOCUMENT INFORMATION

**Version**: 3.1.6  
**Last Updated**: January 26, 2026  
**Maintainer**: NyayaVighya Development Team  
**Status**: Production Ready for Indian Legal Market

---

*This document consolidates all feature documentation for NyayaVighya SDK v3.1. For API details, see `2-COMPLETE-API-REFERENCE.md`. For deployment instructions, see `3-DEPLOYMENT-GUIDE.md`.*
