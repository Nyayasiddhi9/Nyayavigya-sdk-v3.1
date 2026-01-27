#!/bin/bash
# NyayaVighya Legal SDK v3.1 - GCP Deployment Script

set -e

echo "⚖️ NyayaVighya Legal SDK v3.1 - GCP Deployment"
echo "================================================"

command -v gcloud >/dev/null 2>&1 || { echo "❌ gcloud CLI required"; exit 1; }

GCP_PROJECT="${GCP_PROJECT:-your-project-id}"
GCP_REGION="${GCP_REGION:-asia-south1}"
SERVICE_NAME="${SERVICE_NAME:-nyayavighya-sdk}"

echo "📦 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --source . \
  --project $GCP_PROJECT \
  --region $GCP_REGION \
  --platform managed \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --min-instances 1 \
  --max-instances 10 \
  --port 5000

echo "✅ Deployment complete!"
gcloud run services describe $SERVICE_NAME --region $GCP_REGION --format="value(status.url)"
