# NyayaVighya Legal SDK v3.1

## Specialized Legal AI Platform for Indian Law

NyayaVighya SDK v3.1 is a comprehensive legal AI platform featuring 275 specialized legal agents across 29 categories, extensive coverage of 50+ Indian statutes, and enterprise-grade legal research capabilities with 22 Indian language support.

## Legal Domain Coverage

### Major Statutes Supported
- **Indian Penal Code (IPC)** - Complete criminal law coverage
- **Code of Criminal Procedure (CrPC)** - Criminal procedure expertise
- **Code of Civil Procedure (CPC)** - Civil litigation support
- **Bharatiya Nyaya Sanhita 2023 (BNS)** - New criminal code
- **Bharatiya Nagarik Suraksha Sanhita 2023 (BNSS)** - New procedure code
- **Constitution of India** - Constitutional law expertise
- **Indian Evidence Act** - Evidence law analysis
- **Arbitration & Conciliation Act** - ADR expertise
- **Companies Act 2013** - Corporate law
- **SEBI Regulations** - Securities law
- **Insolvency & Bankruptcy Code** - IBC expertise
- **Motor Vehicles Act** - Transport law
- **Consumer Protection Act** - Consumer rights
- **Real Estate (Regulation & Development) Act** - RERA compliance
- **Information Technology Act** - Cyber law

### Legal Categories (29)
Criminal Law, Civil Law, Constitutional Law, Corporate Law, Intellectual Property, Family Law, Labor & Employment, Tax Law, Banking & Finance, Real Estate, Environmental Law, International Law, Administrative Law, Alternative Dispute Resolution, Consumer Protection, Cyber Law, Human Rights, Media & Entertainment, Sports Law, Aviation Law, Maritime Law, Insurance Law, Competition Law, Data Privacy, Healthcare Law, Education Law, Election Law, Energy Law, Religious & Personal Law

## Features

### 275+ Specialized Legal Agents
- **Case Analysis Agents** - Analyze facts and identify legal issues
- **Statute Interpretation Agents** - Interpret legislative provisions
- **Precedent Research Agents** - Find relevant case law
- **Document Drafting Agents** - Create legal documents
- **Compliance Agents** - Ensure regulatory compliance
- **Litigation Support Agents** - Assist with court proceedings

### P0 Enterprise Services
1. **Legal Web Search** - CourtListener, Indian Kanoon, SCC Online integration
2. **Document Processing** - Legal document OCR and extraction
3. **NotebookLLM Studio** - Interactive legal research with citations
4. **Web Scraping** - Court website data extraction
5. **Database Connectors** - Legal database integration

### P1 Enterprise Services
1. **Legal Code Analysis** - Statute and case law analysis
2. **Domain Research API** - Legal, academic, patent research
3. **Investment Research** - SEBI compliance and corporate law
4. **Court Data Service** - Case status and hearing dates
5. **Document Generation** - Legal document templates

### P2 Enterprise Services
1. **Case Analytics Dashboard** - Litigation analytics and insights
2. **Legal Asset Management** - Case files and document organization
3. **Multi-language Support** - 22 Indian languages + English

### Security & Compliance
- Legal privilege protection
- Client confidentiality safeguards
- Bar Council compliance
- GDPR/DPDP Act compliance
- Audit trails for all legal activities

## Quick Start

### Installation

```bash
npm install
```

### Configuration

```bash
cp .env.example .env
```

Configure legal-specific settings in `.env`:
```env
DATABASE_URL=postgresql://user:pass@host:5432/nyayavighya
OPENAI_API_KEY=your-key
ANTHROPIC_API_KEY=your-key

# Legal API Keys
INDIAN_KANOON_API_KEY=your-key
SCC_ONLINE_API_KEY=your-key
COURTLISTENER_API_KEY=your-key
```

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

## API Documentation

### Base URL
```
http://localhost:5000/api/v3/legal
```

### Legal-Specific Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/v3/legal/case-analysis` | Analyze case facts and identify issues |
| `POST /api/v3/legal/statute-lookup` | Find relevant statutory provisions |
| `POST /api/v3/legal/precedent-search` | Search case law precedents |
| `POST /api/v3/legal/document-draft` | Generate legal documents |
| `POST /api/v3/legal/compliance-check` | Verify regulatory compliance |
| `GET /api/v3/legal/court-status/:caseNumber` | Get case status |
| `POST /api/v3/legal/translate` | Translate legal content (22 languages) |

## Architecture

```
nyayavighya-sdk-v3.1/
├── src/
│   ├── services/           # Enterprise services
│   ├── agents/             # Core NyayaVighya agents
│   ├── legal-agents/       # 275+ specialized legal agents
│   ├── middleware/         # Auth, rate limiting, validation
│   ├── routes/             # API endpoints
│   └── utils/              # Legal utilities
├── config/                 # Configuration files
├── docs/                   # Legal documentation
└── scripts/                # Deployment scripts
```

## Legal Agent Categories

| Category | Agents | Focus Areas |
|----------|--------|-------------|
| Criminal | 45 | IPC, BNS, CrPC, BNSS, Evidence |
| Civil | 35 | CPC, Contracts, Torts, Property |
| Constitutional | 20 | Fundamental Rights, Writs, PIL |
| Corporate | 40 | Companies Act, SEBI, M&A, IPO |
| IP | 15 | Patents, Trademarks, Copyright |
| Family | 20 | Marriage, Divorce, Succession |
| Labor | 25 | Employment, Factories, ESI, PF |
| Tax | 30 | Income Tax, GST, Customs |
| Others | 45 | Specialized domains |

## License

MIT License - See LICENSE file for details.

## Disclaimer

NyayaVighya SDK is an AI-powered legal research tool. It does not provide legal advice and should not be considered a substitute for professional legal counsel. Always consult with a qualified lawyer for legal matters.

## Support

For enterprise legal support and custom deployments, contact the NyayaVighya team.
