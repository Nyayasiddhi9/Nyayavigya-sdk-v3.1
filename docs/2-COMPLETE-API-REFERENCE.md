# NyayaVighya SDK v3.1 - Complete API Reference

**Version**: 3.1.6  
**Last Updated**: January 26, 2026  
**Base URL**: `https://api.nyayavighya.com` or `http://localhost:5000`  
**API Version**: v3

---

## TABLE OF CONTENTS

1. [Authentication](#1-authentication)
2. [Legal Agent APIs](#2-legal-agent-apis)
3. [Legal Research APIs](#3-legal-research-apis)
4. [Document Drafting APIs](#4-document-drafting-apis)
5. [Case Management APIs](#5-case-management-apis)
6. [Document Processing APIs](#6-document-processing-apis)
7. [Statute & Citation APIs](#7-statute--citation-apis)
8. [E-Filing APIs](#8-e-filing-apis)
9. [Analytics APIs](#9-analytics-apis)
10. [Admin APIs](#10-admin-apis)
11. [Error Handling](#11-error-handling)
12. [Rate Limits](#12-rate-limits)

---

## 1. AUTHENTICATION

### 1.1 Login

```bash
POST /api/auth/login
Content-Type: application/json

Request:
{
  "email": "advocate@lawfirm.com",
  "password": "secure_password"
}

Response (200):
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "24h",
  "user": {
    "id": "uuid",
    "email": "advocate@lawfirm.com",
    "role": "advocate",
    "barCouncilId": "MH/12345/2020",
    "practiceAreas": ["criminal", "civil"]
  }
}
```

### 1.2 API Key Authentication

```bash
Authorization: Bearer <API_KEY>
```

---

## 2. LEGAL AGENT APIs

### 2.1 List Legal Agents

```bash
GET /api/legal/agents
Authorization: Bearer <token>
Query Parameters:
  - category: criminal|civil|corporate|family|taxation|ip|property|labor
  - specialty: string
  - limit: number (default: 50)

Response (200):
{
  "agents": [
    {
      "id": "criminal-defense-specialist",
      "name": "Criminal Defense Specialist",
      "category": "criminal",
      "specialty": "IPC/BNS defense",
      "statutes": ["IPC", "BNS 2023", "CrPC", "BNSS 2023"],
      "capabilities": ["bail", "trial-defense", "appeals"],
      "languages": ["en", "hi", "mr"]
    }
  ],
  "total": 275
}
```

### 2.2 Execute Legal Agent

```bash
POST /api/legal/agents/:agentId/execute
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "task": "Draft a bail application for accused in Section 302 IPC case",
  "context": {
    "caseNumber": "Session Case No. 123/2026",
    "court": "Sessions Court, Mumbai",
    "accused": "Ram Kumar",
    "fir": {
      "number": "123/2026",
      "policeStation": "Andheri PS",
      "sections": ["302", "34"]
    },
    "facts": "Brief facts of the case..."
  },
  "options": {
    "language": "en",
    "format": "court_format",
    "includeCitations": true
  }
}

Response (200):
{
  "taskId": "task_legal_123",
  "agentId": "criminal-defense-specialist",
  "status": "completed",
  "result": {
    "document": "IN THE COURT OF SESSIONS JUDGE...",
    "format": "court_format",
    "citations": [
      {"case": "Arnesh Kumar v. State of Bihar", "citation": "(2014) 8 SCC 273"},
      {"case": "Satender Kumar Antil v. CBI", "citation": "(2022) 10 SCC 51"}
    ],
    "sections": ["Section 437 CrPC", "Section 483 BNSS"]
  },
  "metadata": {
    "model": "claude-4.5-sonnet",
    "tokensUsed": 2500,
    "cost": 0.025
  }
}
```

---

## 3. LEGAL RESEARCH APIs

### 3.1 Case Law Search

```bash
POST /api/legal/research/cases
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "query": "bail in murder cases Supreme Court",
  "filters": {
    "court": "supreme_court",
    "dateFrom": "2020-01-01",
    "dateTo": "2026-01-26",
    "sections": ["302 IPC", "Section 105 BNS"],
    "bench": "constitution"
  },
  "options": {
    "limit": 20,
    "sortBy": "relevance",
    "includeSummary": true
  }
}

Response (200):
{
  "results": [
    {
      "caseTitle": "State of Rajasthan v. Balchand",
      "citation": "(1977) 4 SCC 308",
      "court": "Supreme Court of India",
      "bench": ["Justice Krishna Iyer", "Justice Goswami"],
      "date": "1977-09-21",
      "summary": "Bail is the rule, jail is the exception...",
      "headnotes": ["Bail principles", "Section 437 CrPC"],
      "sections": ["Section 437 CrPC"],
      "relevanceScore": 0.95
    }
  ],
  "total": 156,
  "facets": {
    "courts": {"supreme_court": 45, "high_courts": 111},
    "years": {"2024": 12, "2023": 18}
  }
}
```

### 3.2 Statute Lookup

```bash
POST /api/legal/research/statutes
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "query": "Section 302 IPC",
  "options": {
    "includeAmendments": true,
    "includeCommentary": true,
    "includeBNS": true
  }
}

Response (200):
{
  "statute": {
    "act": "Indian Penal Code, 1860",
    "section": "302",
    "title": "Punishment for murder",
    "text": "Whoever commits murder shall be punished with death, or imprisonment for life, and shall also be liable to fine.",
    "amendments": [],
    "bnsEquivalent": {
      "act": "Bharatiya Nyaya Sanhita, 2023",
      "section": "103",
      "text": "Whoever commits murder shall be punished..."
    },
    "commentary": {
      "author": "Ratanlal & Dhirajlal",
      "notes": "Essential ingredients of murder..."
    }
  },
  "relatedCases": [
    {"title": "K.M. Nanavati v. State of Maharashtra", "citation": "AIR 1962 SC 605"}
  ]
}
```

### 3.3 Precedent Finder

```bash
POST /api/legal/research/precedents
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "legalIssue": "Whether anticipatory bail can be granted in economic offences",
  "jurisdiction": "india",
  "options": {
    "bindingOnly": false,
    "recentFirst": true,
    "limit": 10
  }
}

Response (200):
{
  "precedents": [
    {
      "caseTitle": "P. Chidambaram v. Directorate of Enforcement",
      "citation": "(2019) 9 SCC 24",
      "court": "Supreme Court",
      "ratio": "Economic offences constitute a class apart...",
      "relevance": "directly_on_point",
      "binding": true,
      "subsequentTreatment": {
        "followed": 45,
        "distinguished": 12,
        "overruled": 0
      }
    }
  ]
}
```

---

## 4. DOCUMENT DRAFTING APIs

### 4.1 List Templates

```bash
GET /api/legal/drafting/templates
Authorization: Bearer <token>
Query Parameters:
  - category: pleading|contract|notice|affidavit|application
  - court: supreme_court|high_court|district_court|tribunal
  - language: en|hi|ta|te|bn

Response (200):
{
  "templates": [
    {
      "id": "bail-application-sessions",
      "name": "Bail Application - Sessions Court",
      "category": "application",
      "court": "sessions_court",
      "language": ["en", "hi"],
      "fields": ["accused_name", "case_number", "sections", "grounds"],
      "preview": "IN THE COURT OF SESSIONS JUDGE..."
    }
  ],
  "total": 1000
}
```

### 4.2 Generate Document

```bash
POST /api/legal/drafting/generate
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "templateId": "bail-application-sessions",
  "data": {
    "court": "Sessions Court, Mumbai",
    "caseNumber": "SC No. 123/2026",
    "accusedName": "Ram Kumar",
    "accusedAddress": "123, ABC Road, Mumbai",
    "sections": ["302", "34"],
    "fir": {
      "number": "123/2026",
      "date": "2026-01-01",
      "policeStation": "Andheri PS"
    },
    "grounds": [
      "No direct evidence against the accused",
      "Accused has roots in society",
      "No likelihood of absconding"
    ],
    "reliefSought": "Regular bail"
  },
  "options": {
    "language": "en",
    "format": "pdf",
    "aiEnhance": true,
    "addCitations": true
  }
}

Response (200):
{
  "documentId": "doc_draft_123",
  "status": "completed",
  "document": {
    "content": "IN THE COURT OF SESSIONS JUDGE, MUMBAI...",
    "format": "pdf",
    "downloadUrl": "https://api.nyayavighya.com/documents/doc_draft_123.pdf",
    "citations": [
      {"case": "Arnesh Kumar v. State of Bihar", "citation": "(2014) 8 SCC 273"}
    ]
  },
  "metadata": {
    "pages": 5,
    "wordCount": 1200,
    "generationTime": 3.5
  }
}
```

### 4.3 Validate Document

```bash
POST /api/legal/drafting/validate
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "document": "IN THE COURT OF...",
  "documentType": "bail_application",
  "court": "sessions_court",
  "jurisdiction": "maharashtra"
}

Response (200):
{
  "valid": true,
  "score": 0.92,
  "issues": [
    {
      "severity": "warning",
      "field": "verification",
      "message": "Verification clause should include date and place"
    }
  ],
  "suggestions": [
    "Consider adding more recent Supreme Court precedents",
    "Include BNSS 2023 equivalent sections"
  ],
  "compliance": {
    "courtFormat": true,
    "stampDuty": "check_required",
    "courtFee": "Rs. 50 (estimated)"
  }
}
```

---

## 5. CASE MANAGEMENT APIs

### 5.1 Create Case

```bash
POST /api/legal/cases
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "title": "State v. Ram Kumar",
  "type": "criminal",
  "court": {
    "name": "Sessions Court, Mumbai",
    "type": "sessions_court"
  },
  "caseNumber": "SC No. 123/2026",
  "client": {
    "name": "Ram Kumar",
    "type": "accused",
    "contact": "+91-9876543210"
  },
  "opposingParty": {
    "name": "State of Maharashtra",
    "type": "prosecution"
  },
  "sections": ["302 IPC", "34 IPC"],
  "assignedTo": ["advocate_123"],
  "priority": "high"
}

Response (201):
{
  "caseId": "case_abc123",
  "title": "State v. Ram Kumar",
  "status": "active",
  "nextHearing": null,
  "createdAt": "2026-01-26T10:00:00Z"
}
```

### 5.2 Get Case Details

```bash
GET /api/legal/cases/:caseId
Authorization: Bearer <token>

Response (200):
{
  "caseId": "case_abc123",
  "title": "State v. Ram Kumar",
  "type": "criminal",
  "status": "active",
  "court": {...},
  "parties": [...],
  "sections": [...],
  "timeline": [
    {"date": "2026-01-26", "event": "Case registered"},
    {"date": "2026-02-15", "event": "Next hearing scheduled"}
  ],
  "documents": [...],
  "tasks": [...],
  "billing": {
    "totalHours": 12.5,
    "totalBilled": 50000
  }
}
```

### 5.3 Add Case Document

```bash
POST /api/legal/cases/:caseId/documents
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
  - file: <document file>
  - type: pleading|evidence|order|judgment|correspondence
  - description: "Bail application filed on 26.01.2026"

Response (201):
{
  "documentId": "doc_case_123",
  "filename": "bail_application.pdf",
  "type": "pleading",
  "uploadedAt": "2026-01-26T10:00:00Z"
}
```

---

## 6. DOCUMENT PROCESSING APIs

### 6.1 OCR Processing

```bash
POST /api/legal/documents/ocr
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
  - file: <image/pdf>
  - language: "hi+en"  # Hindi + English
  - extractTables: true
  - extractEntities: true

Response (200):
{
  "text": "Full extracted text...",
  "language": "hi+en",
  "confidence": 0.96,
  "entities": {
    "parties": ["State of Maharashtra", "Ram Kumar"],
    "dates": ["26.01.2026", "15.02.2026"],
    "sections": ["Section 302 IPC", "Section 34 IPC"],
    "caseNumbers": ["SC No. 123/2026"],
    "amounts": ["Rs. 50,000/-"]
  },
  "tables": [...],
  "pages": 5
}
```

### 6.2 Document Analysis

```bash
POST /api/legal/documents/analyze
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "documentId": "doc_123",
  "analysisType": ["summary", "entities", "sections", "citations"]
}

Response (200):
{
  "documentId": "doc_123",
  "analysis": {
    "summary": "This is a bail application filed in Sessions Court...",
    "documentType": "bail_application",
    "entities": {
      "court": "Sessions Court, Mumbai",
      "parties": {...},
      "sections": [...],
      "dates": [...]
    },
    "citations": [
      {"case": "Arnesh Kumar v. State of Bihar", "citation": "(2014) 8 SCC 273"}
    ],
    "riskAssessment": {
      "score": 0.7,
      "factors": ["Serious offence", "Precedents favor prosecution"]
    }
  }
}
```

---

## 7. STATUTE & CITATION APIs

### 7.1 Get Bare Act

```bash
GET /api/legal/statutes/:actId
Authorization: Bearer <token>
Query Parameters:
  - section: 302
  - format: full|section_only
  - language: en|hi

Response (200):
{
  "act": {
    "id": "ipc_1860",
    "name": "Indian Penal Code, 1860",
    "shortTitle": "IPC",
    "enactedDate": "1860-10-06",
    "lastAmended": "2013-04-03",
    "status": "partially_repealed",
    "repealedBy": {
      "act": "Bharatiya Nyaya Sanhita, 2023",
      "effectiveFrom": "2024-07-01"
    }
  },
  "section": {
    "number": "302",
    "title": "Punishment for murder",
    "text": "Whoever commits murder...",
    "explanation": null,
    "illustrations": []
  }
}
```

### 7.2 Citation Lookup

```bash
POST /api/legal/citations/lookup
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "citation": "(2014) 8 SCC 273"
}

Response (200):
{
  "citation": "(2014) 8 SCC 273",
  "valid": true,
  "case": {
    "title": "Arnesh Kumar v. State of Bihar",
    "court": "Supreme Court of India",
    "date": "2014-07-02",
    "bench": ["Justice C.K. Prasad", "Justice Pinaki Chandra Ghose"],
    "headnotes": ["Arrest", "Section 41 CrPC", "Guidelines"],
    "status": "good_law",
    "overruled": false,
    "citedIn": 1250
  }
}
```

### 7.3 Convert to BNS

```bash
POST /api/legal/statutes/convert
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "fromAct": "IPC",
  "section": "302",
  "toAct": "BNS"
}

Response (200):
{
  "original": {
    "act": "Indian Penal Code, 1860",
    "section": "302",
    "title": "Punishment for murder"
  },
  "converted": {
    "act": "Bharatiya Nyaya Sanhita, 2023",
    "section": "103",
    "title": "Punishment for murder",
    "changes": "Substantially similar, minor linguistic changes"
  },
  "equivalenceTable": {
    "300": "101 (Culpable homicide amounting to murder)",
    "302": "103 (Punishment for murder)",
    "304": "105 (Punishment for culpable homicide)"
  }
}
```

---

## 8. E-FILING APIs

### 8.1 Prepare E-Filing

```bash
POST /api/legal/efiling/prepare
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "court": "bombay_high_court",
  "caseType": "writ_petition",
  "documents": [
    {"type": "main_petition", "documentId": "doc_123"},
    {"type": "vakalatnama", "documentId": "doc_124"},
    {"type": "index", "documentId": "doc_125"}
  ],
  "urgency": "ordinary"
}

Response (200):
{
  "filingId": "filing_abc123",
  "status": "prepared",
  "validation": {
    "valid": true,
    "issues": []
  },
  "fees": {
    "courtFee": 500,
    "stampDuty": 0,
    "processingFee": 50,
    "total": 550
  },
  "estimatedFilingNumber": "WP-123-2026",
  "nextSteps": [
    "Complete payment",
    "Submit for filing",
    "Await registration"
  ]
}
```

### 8.2 Check Filing Status

```bash
GET /api/legal/efiling/:filingId/status
Authorization: Bearer <token>

Response (200):
{
  "filingId": "filing_abc123",
  "status": "registered",
  "caseNumber": "WP No. 123/2026",
  "registrationDate": "2026-01-26",
  "nextHearing": "2026-02-15",
  "timeline": [
    {"date": "2026-01-26 10:00", "event": "Filing submitted"},
    {"date": "2026-01-26 14:30", "event": "Fees verified"},
    {"date": "2026-01-26 16:00", "event": "Case registered"}
  ]
}
```

---

## 9. ANALYTICS APIs

### 9.1 Case Analytics

```bash
GET /api/legal/analytics/cases
Authorization: Bearer <token>
Query Parameters:
  - period: month|quarter|year
  - groupBy: type|court|status

Response (200):
{
  "period": "year",
  "summary": {
    "totalCases": 150,
    "activeCases": 45,
    "disposedCases": 100,
    "wonCases": 65,
    "lostCases": 35,
    "winRate": 0.65
  },
  "byType": {
    "criminal": 45,
    "civil": 60,
    "corporate": 25,
    "family": 20
  },
  "byCourt": {...},
  "averageDuration": "8.5 months"
}
```

### 9.2 Research Analytics

```bash
GET /api/legal/analytics/research
Authorization: Bearer <token>

Response (200):
{
  "period": "month",
  "searches": 1500,
  "documentsGenerated": 450,
  "topQueries": [
    {"query": "bail murder", "count": 45},
    {"query": "section 138 NI Act", "count": 38}
  ],
  "mostUsedTemplates": [
    {"template": "bail_application", "count": 120},
    {"template": "legal_notice", "count": 85}
  ]
}
```

---

## 10. ADMIN APIs

### 10.1 User Management

```bash
GET /api/admin/users
POST /api/admin/users
PATCH /api/admin/users/:userId
DELETE /api/admin/users/:userId
```

### 10.2 Firm Settings

```bash
GET /api/admin/settings
PATCH /api/admin/settings
```

---

## 11. ERROR HANDLING

### Error Response Format

```json
{
  "error": {
    "code": "CASE_NOT_FOUND",
    "message": "The requested case does not exist",
    "details": {
      "caseId": "case_invalid"
    },
    "requestId": "req_abc123"
  }
}
```

### Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| UNAUTHORIZED | 401 | Invalid or missing token |
| FORBIDDEN | 403 | Insufficient permissions |
| CASE_NOT_FOUND | 404 | Case does not exist |
| DOCUMENT_NOT_FOUND | 404 | Document not found |
| VALIDATION_ERROR | 400 | Invalid request data |
| RATE_LIMIT | 429 | Too many requests |

---

## 12. RATE LIMITS

| Tier | Requests/min | Documents/day |
|------|--------------|---------------|
| Free | 60 | 10 |
| Professional | 600 | 100 |
| Firm | 1200 | Unlimited |
| Enterprise | Unlimited | Unlimited |

---

**Document Version**: 3.1.6  
**Last Updated**: January 26, 2026  
**Maintainer**: NyayaVighya Development Team
