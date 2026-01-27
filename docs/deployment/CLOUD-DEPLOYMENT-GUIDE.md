# NyayaVighya SDK v3.1 - Cloud Deployment Guide

**Version**: 3.1.5  
**Last Updated**: January 26, 2026  
**Platforms**: AWS, Azure, GCP, On-Premise

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [AWS Deployment](#aws-deployment)
3. [Azure Deployment](#azure-deployment)
4. [GCP Deployment](#gcp-deployment)
5. [On-Premise Deployment](#on-premise-deployment)
6. [Environment Configuration](#environment-configuration)
7. [Security Hardening](#security-hardening)
8. [Monitoring & Scaling](#monitoring--scaling)

---

## Prerequisites

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 4 cores | 8+ cores |
| RAM | 16 GB | 32+ GB |
| Storage | 100 GB SSD | 500+ GB NVMe |
| Network | 100 Mbps | 1 Gbps |

### Software Requirements

- Node.js 20+ LTS
- PostgreSQL 15+ (Neon Serverless recommended)
- Redis 7+ (for caching)
- Docker & Docker Compose (optional)
- Kubernetes (for orchestration)

### Required API Keys

```env
# LLM Providers (minimum 3 recommended)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...

# Indian Language Support
SARVAM_API_KEY=sarvam-...

# Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Security
JWT_SECRET=<32-byte-random-string>
SESSION_SECRET=<32-byte-random-string>
ENCRYPTION_KEY=<32-byte-random-string>
```

---

## AWS Deployment

### Option 1: EC2 with RDS

#### 1. Launch EC2 Instance

```bash
# Recommended AMI: Amazon Linux 2023 or Ubuntu 22.04
# Instance Type: t3.xlarge (minimum) or c6i.2xlarge (recommended)

# Install dependencies
sudo yum update -y
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs git

# Clone and install
git clone https://github.com/nyayavighya/nyayavighya-sdk-v3.1.git
cd nyayavighya-sdk-v3.1
npm install
```

#### 2. Configure RDS PostgreSQL

```sql
-- Create database
CREATE DATABASE nyayavighya;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create user
CREATE USER nyayavighya_user WITH PASSWORD '<secure-password>';
GRANT ALL PRIVILEGES ON DATABASE nyayavighya TO nyayavighya_user;
```

#### 3. Setup Environment

```bash
# Create .env file
cat > .env << EOF
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://nyayavighya_user:<password>@<rds-endpoint>:5432/nyayavighya
REDIS_URL=redis://<elasticache-endpoint>:6379
JWT_SECRET=$(openssl rand -hex 32)
SESSION_SECRET=$(openssl rand -hex 32)
EOF
```

#### 4. Run with PM2

```bash
npm install -g pm2
npm run build
pm2 start npm --name "nyayavighya" -- start
pm2 save
pm2 startup
```

#### 5. Configure ALB (Application Load Balancer)

```yaml
# ALB Configuration
Listeners:
  - Port: 443
    Protocol: HTTPS
    Certificate: ACM Certificate ARN
    Actions:
      - Type: forward
        TargetGroup: nyayavighya-tg

TargetGroups:
  - Name: nyayavighya-tg
    Port: 5000
    Protocol: HTTP
    HealthCheck:
      Path: /api/health
      Interval: 30
```

### Option 2: ECS Fargate

#### Dockerfile

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
EXPOSE 5000
CMD ["npm", "start"]
```

#### ECS Task Definition

```json
{
  "family": "nyayavighya",
  "cpu": "2048",
  "memory": "4096",
  "networkMode": "awsvpc",
  "containerDefinitions": [
    {
      "name": "nyayavighya",
      "image": "<ecr-repo>/nyayavighya:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"}
      ],
      "secrets": [
        {"name": "DATABASE_URL", "valueFrom": "<secrets-manager-arn>:DATABASE_URL::"},
        {"name": "JWT_SECRET", "valueFrom": "<secrets-manager-arn>:JWT_SECRET::"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/nyayavighya",
          "awslogs-region": "ap-south-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

---

## Azure Deployment

### Option 1: Azure App Service

#### 1. Create App Service

```bash
# Login to Azure
az login

# Create resource group
az group create --name nyayavighya-rg --location centralindia

# Create App Service Plan
az appservice plan create \
  --name nyayavighya-plan \
  --resource-group nyayavighya-rg \
  --sku P2v3 \
  --is-linux

# Create Web App
az webapp create \
  --resource-group nyayavighya-rg \
  --plan nyayavighya-plan \
  --name nyayavighya-app \
  --runtime "NODE:20-lts"
```

#### 2. Configure Database (Azure Database for PostgreSQL)

```bash
az postgres flexible-server create \
  --resource-group nyayavighya-rg \
  --name nyayavighya-db \
  --location centralindia \
  --admin-user nyayavighya_admin \
  --admin-password '<secure-password>' \
  --sku-name Standard_D4s_v3 \
  --version 15
```

#### 3. Configure App Settings

```bash
az webapp config appsettings set \
  --resource-group nyayavighya-rg \
  --name nyayavighya-app \
  --settings \
    NODE_ENV=production \
    WEBSITE_NODE_DEFAULT_VERSION=20-lts

# Store secrets in Key Vault
az keyvault secret set --vault-name nyayavighya-kv --name DATABASE-URL --value "<connection-string>"
```

### Option 2: Azure Kubernetes Service (AKS)

#### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nyayavighya
  namespace: legal-ai
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nyayavighya
  template:
    metadata:
      labels:
        app: nyayavighya
    spec:
      containers:
      - name: nyayavighya
        image: nyayavighyaacr.azurecr.io/nyayavighya:v3.1.5
        ports:
        - containerPort: 5000
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
        env:
        - name: NODE_ENV
          value: production
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: nyayavighya-secrets
              key: database-url
        livenessProbe:
          httpGet:
            path: /api/health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 5000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: nyayavighya-svc
  namespace: legal-ai
spec:
  selector:
    app: nyayavighya
  ports:
  - port: 80
    targetPort: 5000
  type: LoadBalancer
```

---

## GCP Deployment

### Option 1: Cloud Run

#### 1. Build and Deploy

```bash
# Build container
gcloud builds submit --tag gcr.io/<project-id>/nyayavighya:v3.1.5

# Deploy to Cloud Run
gcloud run deploy nyayavighya \
  --image gcr.io/<project-id>/nyayavighya:v3.1.5 \
  --platform managed \
  --region asia-south1 \
  --memory 4Gi \
  --cpu 2 \
  --min-instances 1 \
  --max-instances 10 \
  --set-env-vars NODE_ENV=production \
  --set-secrets DATABASE_URL=nyayavighya-db-url:latest
```

### Option 2: GKE (Google Kubernetes Engine)

```bash
# Create cluster
gcloud container clusters create nyayavighya-cluster \
  --zone asia-south1-a \
  --num-nodes 3 \
  --machine-type e2-standard-4

# Apply Kubernetes manifests
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

### Cloud SQL Configuration

```bash
gcloud sql instances create nyayavighya-db \
  --database-version POSTGRES_15 \
  --tier db-custom-4-15360 \
  --region asia-south1

gcloud sql databases create nyayavighya --instance nyayavighya-db
```

---

## On-Premise Deployment

### Docker Compose

```yaml
version: '3.8'

services:
  nyayavighya:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://nyayavighya:password@postgres:5432/nyayavighya
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    restart: always

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=nyayavighya
      - POSTGRES_USER=nyayavighya
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: always

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certs:/etc/nginx/certs
    depends_on:
      - nyayavighya
    restart: always

volumes:
  postgres_data:
  redis_data:
```

---

## Environment Configuration

### Production Environment Variables

```env
# Application
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://user:pass@host:5432/nyayavighya?sslmode=require
REDIS_URL=redis://host:6379

# Security
JWT_SECRET=<64-char-random>
SESSION_SECRET=<64-char-random>
ENCRYPTION_KEY=<32-byte-key>

# LLM Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
DEEPSEEK_API_KEY=...
GROQ_API_KEY=...
PERPLEXITY_API_KEY=...

# Indian AI
SARVAM_API_KEY=sarvam-...

# Voice
ELEVENLABS_API_KEY=...

# Legal APIs
INDIAN_KANOON_API_KEY=...

# Monitoring
SENTRY_DSN=...
LOG_LEVEL=info
```

---

## Security Hardening

### 1. SSL/TLS Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name nyayavighya.example.com;

    ssl_certificate /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    location / {
        proxy_pass http://nyayavighya:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. Database Security

```sql
-- Enable row-level security
ALTER TABLE legal_cases ENABLE ROW LEVEL SECURITY;

-- Create policy for client data isolation
CREATE POLICY client_isolation ON legal_cases
    FOR ALL
    USING (organization_id = current_setting('app.current_org_id')::uuid);
```

### 3. API Rate Limiting

```typescript
// Redis-based rate limiting
const rateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:'
  })
});
```

---

## Monitoring & Scaling

### Health Check Endpoint

```typescript
// /api/health
{
  "status": "healthy",
  "version": "3.1.5",
  "timestamp": "2026-01-26T00:00:00Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "llm": "operational"
  }
}
```

### Auto-Scaling Configuration (AWS)

```yaml
ScalingPolicy:
  Type: AWS::ApplicationAutoScaling::ScalingPolicy
  Properties:
    PolicyName: cpu-tracking
    PolicyType: TargetTrackingScaling
    TargetTrackingScalingPolicyConfiguration:
      TargetValue: 70.0
      PredefinedMetricSpecification:
        PredefinedMetricType: ECSServiceAverageCPUUtilization
      ScaleInCooldown: 300
      ScaleOutCooldown: 60
```

### Monitoring Stack

| Tool | Purpose |
|------|---------|
| Prometheus | Metrics collection |
| Grafana | Visualization |
| Loki | Log aggregation |
| Jaeger | Distributed tracing |
| Sentry | Error tracking |

---

**Document Version**: 3.1.5  
**Maintainer**: NyayaVighya DevOps Team  
**Support**: devops@nyayavighya.com
