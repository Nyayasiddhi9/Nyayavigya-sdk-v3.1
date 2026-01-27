#!/bin/bash
# NyayaVighya Legal SDK v3.1 - AWS Deployment Script

set -e

echo "⚖️ NyayaVighya Legal SDK v3.1 - AWS Deployment"
echo "================================================"

command -v aws >/dev/null 2>&1 || { echo "❌ AWS CLI required"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker required"; exit 1; }

AWS_REGION="${AWS_REGION:-ap-south-1}"
ECR_REPO="${ECR_REPO:-nyayavighya-sdk}"
ECS_CLUSTER="${ECS_CLUSTER:-nyayavighya-cluster}"
ECS_SERVICE="${ECS_SERVICE:-nyayavighya-service}"

echo "📦 Building Docker image..."
docker build -t nyayavighya-sdk:3.1 .

echo "🔐 Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

echo "📤 Pushing to ECR..."
docker tag nyayavighya-sdk:3.1 $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:3.1
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:3.1

echo "🔄 Updating ECS service..."
aws ecs update-service --cluster $ECS_CLUSTER --service $ECS_SERVICE --force-new-deployment --region $AWS_REGION

echo "✅ Deployment complete!"
