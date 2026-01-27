# NyayaVighya SDK v3.1 - Complete Deployment Guide

**Version**: 3.1.6  
**Last Updated**: January 26, 2026  
**Document Type**: Deployment & Operations Manual

---

## TABLE OF CONTENTS

1. [Prerequisites](#1-prerequisites)
2. [Quick Start](#2-quick-start)
3. [Installation Methods](#3-installation-methods)
4. [Configuration](#4-configuration)
5. [Database Setup](#5-database-setup)
6. [Legal Data Setup](#6-legal-data-setup)
7. [Environment Variables](#7-environment-variables)
8. [API Keys Setup](#8-api-keys-setup)
9. [Cloud Deployment](#9-cloud-deployment)
10. [Docker Deployment](#10-docker-deployment)
11. [India Data Residency](#11-india-data-residency)
12. [Security & Compliance](#12-security--compliance)
13. [Scaling Guidelines](#13-scaling-guidelines)
14. [Backup & Recovery](#14-backup--recovery)
15. [Troubleshooting](#15-troubleshooting)

---

## 1. PREREQUISITES

### 1.1 System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 4 cores | 8+ cores |
| RAM | 8 GB | 16+ GB |
| Storage | 100 GB SSD | 500+ GB SSD |
| Node.js | 20.x | 20.x LTS |
| PostgreSQL | 15+ | 16+ |

### 1.2 Legal Data Storage

| Data Type | Estimated Size |
|-----------|----------------|
| Case Law Database | 50 GB |
| Statute Database | 5 GB |
| Templates | 1 GB |
| Document Embeddings | 20 GB |

---

## 2. QUICK START

### 2.1 One-Line Installation

```bash
git clone https://github.com/nyayavighya/sdk-v3.1.git && cd sdk-v3.1 && npm install && npm run setup
```

### 2.2 Development Server

```bash
npm run dev
# Server starts at http://localhost:5000
```

### 2.3 Production Build

```bash
npm run build
npm run start
```

---

## 3. INSTALLATION METHODS

### 3.1 NPM Installation

```bash
npm install @nyayavighya/sdk @nyayavighya/legal-agents
```

### 3.2 GitHub Installation

```bash
git clone https://github.com/nyayavighya/sdk-v3.1.git
cd sdk-v3.1
npm install
cp .env.example .env
# Configure .env
npm run db:push
npm run dev
```

### 3.3 Project Folder Copy

```bash
cp -r builds/nyayavighya-sdk-v3.1 /path/to/project
cd /path/to/project
npm install
npm run setup
```

---

## 4. CONFIGURATION

### 4.1 Legal-Specific Configuration

```typescript
// server/config/legal-config.ts
export const legalConfig = {
  // Jurisdiction
  defaultJurisdiction: 'india',
  supportedCourts: ['supreme_court', 'high_courts', 'district_courts', 'tribunals'],
  
  // Languages
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml'],
  
  // Legal Data
  caseDatabase: process.env.CASE_DATABASE_URL,
  statuteDatabase: process.env.STATUTE_DATABASE_URL,
  
  // Indian Statutes
  enableBNS2023: true,
  enableBNSS2023: true,
  enableBSA2023: true,
};
```

---

## 5. DATABASE SETUP

### 5.1 PostgreSQL Setup

```bash
# Create database
createdb nyayavighya_db

# Set DATABASE_URL
DATABASE_URL="postgresql://localhost:5432/nyayavighya_db"

# Push schema
npm run db:push
```

### 5.2 Initial Data Scripts

```sql
-- Legal Categories
INSERT INTO legal_categories (name, description) VALUES
('criminal', 'Criminal Law - IPC, BNS, CrPC, BNSS'),
('civil', 'Civil Law - CPC, Contract, Tort'),
('corporate', 'Corporate Law - Companies Act, SEBI'),
('family', 'Family Law - Marriage, Divorce, Succession'),
('taxation', 'Tax Law - Income Tax, GST'),
('ip', 'Intellectual Property - Patents, Trademarks'),
('property', 'Property Law - Transfer of Property, RERA'),
('labor', 'Labor Law - Industrial Disputes, ESI');

-- Default Indian Courts
INSERT INTO courts (name, type, jurisdiction) VALUES
('Supreme Court of India', 'supreme_court', 'india'),
('Bombay High Court', 'high_court', 'maharashtra'),
('Delhi High Court', 'high_court', 'delhi'),
('Madras High Court', 'high_court', 'tamil_nadu'),
('Calcutta High Court', 'high_court', 'west_bengal');
```

### 5.3 pgvector for Legal Embeddings

```sql
CREATE EXTENSION IF NOT EXISTS vector;

-- Legal case embeddings table
CREATE TABLE IF NOT EXISTS legal_case_embeddings (
  id SERIAL PRIMARY KEY,
  case_id VARCHAR(255) NOT NULL,
  citation VARCHAR(255),
  embedding vector(1536),
  metadata JSONB
);

CREATE INDEX ON legal_case_embeddings USING ivfflat (embedding vector_cosine_ops);
```

---

## 6. LEGAL DATA SETUP

### 6.1 Case Law Database

```bash
# Download case law dataset (requires license)
npm run legal:download-cases

# Import to database
npm run legal:import-cases

# Build embeddings
npm run legal:build-embeddings
```

### 6.2 Statute Database

```bash
# Download Indian statutes
npm run legal:download-statutes

# Import bare acts
npm run legal:import-statutes

# Enable BNS 2023 mapping
npm run legal:enable-bns-mapping
```

### 6.3 Template Database

```bash
# Import legal templates
npm run legal:import-templates

# Validate templates
npm run legal:validate-templates
```

---

## 7. ENVIRONMENT VARIABLES

### 7.1 Complete .env Template

```bash
# ===========================================
# NyayaVighya SDK v3.1 - Environment Configuration
# ===========================================

# ===== SERVER =====
NODE_ENV=production
PORT=5000

# ===== DATABASE =====
DATABASE_URL=postgresql://user:password@host:5432/nyayavighya?sslmode=require

# ===== SECURITY =====
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
SESSION_SECRET=your-super-secret-session-key

# ===== LLM PROVIDERS =====
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
SARVAM_API_KEY=...  # Required for Indian languages

# ===== LEGAL DATA =====
CASE_DATABASE_URL=postgresql://...
STATUTE_DATABASE_URL=postgresql://...
TEMPLATE_STORAGE_PATH=/data/templates

# ===== INDIAN LANGUAGES =====
SARVAM_VOICE_KEY=...
ENABLE_HINDI=true
ENABLE_TAMIL=true
ENABLE_TELUGU=true
ENABLE_BENGALI=true
ENABLE_MARATHI=true

# ===== E-FILING INTEGRATION =====
ECOURTS_API_KEY=...
NCLT_PORTAL_KEY=...

# ===== DATA RESIDENCY =====
DATA_RESIDENCY=india
STORAGE_REGION=ap-south-1
```

---

## 8. API KEYS SETUP

### 8.1 Required API Keys

| Provider | Purpose | Required |
|----------|---------|----------|
| OpenAI | Legal research, drafting | Recommended |
| Anthropic | Document analysis | Recommended |
| Sarvam AI | Indian languages | Required |
| Google AI | Multi-modal | Optional |

### 8.2 Legal Database Access

| Database | Get Access From |
|----------|-----------------|
| SCC Online | https://scconline.com (license required) |
| Manupatra | https://manupatra.com (license required) |
| Indian Kanoon | Free API available |

---

## 9. CLOUD DEPLOYMENT

### 9.1 AWS India Region (Mumbai)

```bash
# Deploy to AWS Mumbai (ap-south-1) for data residency
aws configure set region ap-south-1

# Create RDS PostgreSQL
aws rds create-db-instance \
  --db-instance-identifier nyayavighya-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --region ap-south-1

# Deploy to EC2/ECS
# (Use provided CloudFormation templates)
```

### 9.2 Azure India

```bash
# Deploy to Azure Central India
az group create --name nyayavighya-rg --location centralindia

az webapp create \
  --name nyayavighya-app \
  --resource-group nyayavighya-rg \
  --plan nyayavighya-plan \
  --runtime "NODE:20-lts"
```

### 9.3 GCP India

```bash
# Deploy to GCP Mumbai
gcloud config set compute/region asia-south1

gcloud run deploy nyayavighya \
  --image gcr.io/project/nyayavighya \
  --region asia-south1
```

---

## 10. DOCKER DEPLOYMENT

### 10.1 Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/nyayavighya
    depends_on:
      - db
    volumes:
      - ./data/templates:/app/data/templates

  db:
    image: pgvector/pgvector:pg16
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=nyayavighya

volumes:
  postgres_data:
```

### 10.2 One-Click Docker Install

```bash
git clone https://github.com/nyayavighya/sdk-v3.1.git
cd sdk-v3.1
cp .env.example .env
# Edit .env with API keys
docker-compose up -d
```

---

## 11. INDIA DATA RESIDENCY

### 11.1 Data Localization Requirements

| Data Type | Storage Location | Encryption |
|-----------|------------------|------------|
| Client data | India only | AES-256 |
| Case files | India only | AES-256 |
| Legal documents | India only | AES-256 |
| Embeddings | India only | AES-256 |

### 11.2 Compliance Configuration

```typescript
// server/config/data-residency.ts
export const dataResidency = {
  region: 'india',
  allowedRegions: ['ap-south-1', 'centralindia', 'asia-south1'],
  encryptionAtRest: true,
  encryptionInTransit: true,
  dataRetentionDays: 365 * 7,  // 7 years per Bar Council rules
};
```

---

## 12. SECURITY & COMPLIANCE

### 12.1 Legal Data Security

- Client-attorney privilege protection
- End-to-end encryption
- Access control by matter
- Comprehensive audit logging
- Secure document disposal

### 12.2 Bar Council Compliance

- Advocates Act compliance
- Professional ethics guidelines
- Client confidentiality rules
- Conflict of interest checks

### 12.3 Security Checklist

- [ ] Enable HTTPS/TLS
- [ ] Configure client privilege encryption
- [ ] Set up matter-level access control
- [ ] Enable audit logging
- [ ] Configure data retention policies
- [ ] Regular security audits

---

## 13. SCALING GUIDELINES

### 13.1 Horizontal Scaling

| Users | Instances | Database |
|-------|-----------|----------|
| < 50 | 1 | Single |
| 50-200 | 2-3 | Single |
| 200-1000 | 5-10 | Read replicas |
| 1000+ | 10+ | Sharded |

### 13.2 Legal Search Optimization

- Use pgvector indexing
- Implement search caching
- Pre-compute common embeddings

---

## 14. BACKUP & RECOVERY

### 14.1 Backup Schedule

| Data Type | Frequency | Retention |
|-----------|-----------|-----------|
| Database | Daily | 7 years |
| Documents | Daily | 7 years |
| Case files | Daily | 7 years |
| Audit logs | Daily | 10 years |

### 14.2 Backup Script

```bash
#!/bin/bash
DATE=$(date +%Y%m%d)
pg_dump $DATABASE_URL | gzip > /backups/nyayavighya_$DATE.sql.gz
aws s3 cp /backups/nyayavighya_$DATE.sql.gz s3://nyayavighya-backups/
```

---

## 15. TROUBLESHOOTING

### 15.1 Common Issues

| Issue | Solution |
|-------|----------|
| OCR failing | Check language pack installation |
| Slow search | Rebuild pgvector indexes |
| API errors | Verify API keys |
| Translation issues | Check Sarvam AI key |

### 15.2 Support

- Documentation: https://docs.nyayavighya.com
- Email: support@nyayavighya.com
- Phone: +91-XXX-XXX-XXXX

---

**Document Version**: 3.1.6  
**Last Updated**: January 26, 2026  
**Maintainer**: NyayaVighya Operations Team
