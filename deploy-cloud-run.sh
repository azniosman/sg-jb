#!/bin/bash
# Deploy to Google Cloud Run

set -e

# Configuration
PROJECT_ID="orioniq
REGION="US"
BACKEND_SERVICE="sg-jb-backend"
FRONTEND_SERVICE="sg-jb-frontend"

echo "🚀 Deploying to Google Cloud Run"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo ""

# Ensure we're using the correct project
gcloud config set project $PROJECT_ID

# Build and push backend
echo "📦 Building backend image..."
cd backend
gcloud builds submit --tag gcr.io/$PROJECT_ID/$BACKEND_SERVICE

# Deploy backend
echo "🚀 Deploying backend to Cloud Run..."
gcloud run deploy $BACKEND_SERVICE \
  --image gcr.io/$PROJECT_ID/$BACKEND_SERVICE \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars ENVIRONMENT=production,USE_GCS=true \
  --set-secrets OPENWEATHER_API_KEY=openweather-api-key:latest,GOOGLE_MAPS_API_KEY=google-maps-api-key:latest \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 10

# Get backend URL
BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE --platform managed --region $REGION --format 'value(status.url)')
echo "✅ Backend deployed at: $BACKEND_URL"

cd ..

# Build and push frontend
echo "📦 Building frontend image..."
cd frontend
gcloud builds submit --tag gcr.io/$PROJECT_ID/$FRONTEND_SERVICE \
  --substitutions=_REACT_APP_API_URL=$BACKEND_URL

# Deploy frontend
echo "🚀 Deploying frontend to Cloud Run..."
gcloud run deploy $FRONTEND_SERVICE \
  --image gcr.io/$PROJECT_ID/$FRONTEND_SERVICE \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1

# Get frontend URL
FRONTEND_URL=$(gcloud run services describe $FRONTEND_SERVICE --platform managed --region $REGION --format 'value(status.url)')
echo "✅ Frontend deployed at: $FRONTEND_URL"

cd ..

echo ""
echo "🎉 Deployment complete!"
echo "Backend: $BACKEND_URL"
echo "Frontend: $FRONTEND_URL"
