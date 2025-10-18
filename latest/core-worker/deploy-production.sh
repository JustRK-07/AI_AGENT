#!/bin/bash
# ==============================================
# Deploy Core Voice Worker to Google Cloud Run
# ==============================================
# This script deploys the core-worker to production
# with proper configuration and monitoring

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "=========================================="
echo "  🚀 Core Voice Worker Deployment"
echo "=========================================="
echo ""

# ==============================================
# Configuration
# ==============================================
# Set GCP_PROJECT environment variable to override default
PROJECT_ID="${GCP_PROJECT:-your-gcp-project-id}"
REGION="${GCP_REGION:-us-central1}"
SERVICE_NAME="voice-agent-core-worker"

# IMPORTANT: Set these environment variables before deploying!
BACKEND_URL="${BACKEND_URL:-https://your-production-backend-url.com}"
LIVEKIT_URL="${LIVEKIT_URL:-wss://your-livekit-url.cloud}"
LIVEKIT_KEY="${LIVEKIT_API_KEY:-your-livekit-key-here}"
LIVEKIT_SECRET="${LIVEKIT_API_SECRET:-your-livekit-secret-here}"
OPENAI_KEY="${OPENAI_API_KEY:-your-key-here}"
CARTESIA_KEY="${CARTESIA_API_KEY:-your-key-here}"
ASSEMBLYAI_KEY="${ASSEMBLYAI_API_KEY:-your-key-here}"
DEEPGRAM_KEY="${DEEPGRAM_API_KEY:-your-key-here}"

# Check if required variables are set
if [ "$PROJECT_ID" = "your-gcp-project-id" ] || \
   [ "$BACKEND_URL" = "https://your-production-backend-url.com" ] || \
   [ "$LIVEKIT_URL" = "wss://your-livekit-url.cloud" ] || \
   [ "$LIVEKIT_KEY" = "your-livekit-key-here" ] || \
   [ "$LIVEKIT_SECRET" = "your-livekit-secret-here" ] || \
   [ "$OPENAI_KEY" = "your-key-here" ] || \
   [ "$CARTESIA_KEY" = "your-key-here" ] || \
   [ "$ASSEMBLYAI_KEY" = "your-key-here" ]; then
    echo -e "${RED}❌ ERROR: Please set production environment variables${NC}"
    echo ""
    echo "Required variables:"
    echo "  GCP_PROJECT        - Your GCP project ID"
    echo "  BACKEND_URL        - Your production backend URL"
    echo "  LIVEKIT_URL        - Your LiveKit WebSocket URL"
    echo "  LIVEKIT_API_KEY    - LiveKit API key"
    echo "  LIVEKIT_API_SECRET - LiveKit API secret"
    echo "  OPENAI_API_KEY     - OpenAI API key"
    echo "  CARTESIA_API_KEY   - Cartesia API key"
    echo "  ASSEMBLYAI_API_KEY - AssemblyAI API key"
    echo ""
    echo "Example:"
    echo "  export GCP_PROJECT=my-project-id"
    echo "  export BACKEND_URL=https://api.example.com"
    echo "  export LIVEKIT_URL=wss://my-project.livekit.cloud"
    echo "  export LIVEKIT_API_KEY=API..."
    echo "  export LIVEKIT_API_SECRET=..."
    echo "  export OPENAI_API_KEY=sk-..."
    echo "  export CARTESIA_API_KEY=..."
    echo "  export ASSEMBLYAI_API_KEY=..."
    echo "  ./deploy-production.sh"
    echo ""
    exit 1
fi

echo -e "${BLUE}Deployment Configuration:${NC}"
echo "  Project ID: $PROJECT_ID"
echo "  Region: $REGION"
echo "  Service Name: $SERVICE_NAME"
echo "  Backend URL: $BACKEND_URL"
echo ""

# Confirm deployment
echo -e "${YELLOW}⚠️  You are about to deploy to PRODUCTION${NC}"
echo ""
read -p "Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Deployment cancelled."
    exit 0
fi

echo ""
echo -e "${BLUE}Starting deployment...${NC}"
echo ""

# ==============================================
# Deploy to Cloud Run
# ==============================================
echo -e "${YELLOW}Step 1: Deploying to Google Cloud Run...${NC}"

/opt/homebrew/bin/gcloud run deploy $SERVICE_NAME \
  --source . \
  --platform managed \
  --region $REGION \
  --project $PROJECT_ID \
  --allow-unauthenticated \
  --min-instances 2 \
  --max-instances 50 \
  --concurrency 25 \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --set-env-vars "\
BACKEND_URL=$BACKEND_URL,\
LIVEKIT_URL=$LIVEKIT_URL,\
LIVEKIT_API_KEY=$LIVEKIT_KEY,\
LIVEKIT_API_SECRET=$LIVEKIT_SECRET,\
WORKER_NAME=core-voice-worker-prod,\
MAX_CONCURRENCY=25,\
CONFIG_CACHE_TTL=300,\
LOG_LEVEL=INFO,\
LOG_FORMAT=json,\
OPENAI_API_KEY=$OPENAI_KEY,\
CARTESIA_API_KEY=$CARTESIA_KEY,\
ASSEMBLYAI_API_KEY=$ASSEMBLYAI_KEY,\
DEEPGRAM_API_KEY=$DEEPGRAM_KEY"

DEPLOY_STATUS=$?

if [ $DEPLOY_STATUS -ne 0 ]; then
    echo ""
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Deployment successful!${NC}"
echo ""

# ==============================================
# Post-Deployment Verification
# ==============================================
echo -e "${YELLOW}Step 2: Verifying deployment...${NC}"

# Get service details
SERVICE_URL=$(/opt/homebrew/bin/gcloud run services describe $SERVICE_NAME \
  --region $REGION \
  --project $PROJECT_ID \
  --format="value(status.url)")

echo ""
echo -e "${GREEN}Service Information:${NC}"
echo "  Service URL: $SERVICE_URL"
echo "  Region: $REGION"
echo "  Min Instances: 2"
echo "  Max Instances: 50"
echo "  Concurrency: 25"
echo ""

# Check recent logs
echo -e "${YELLOW}Step 3: Checking recent logs...${NC}"
echo ""

/opt/homebrew/bin/gcloud logging read \
  "resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME" \
  --limit=10 \
  --project=$PROJECT_ID \
  --format="value(textPayload,jsonPayload)" | head -20

echo ""
echo "=========================================="
echo -e "  ${GREEN}✅ DEPLOYMENT COMPLETE${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Verify workers in LiveKit dashboard:"
echo "   https://cloud.livekit.io → Agents → Workers"
echo ""
echo "2. Test with a production call"
echo ""
echo "3. Monitor logs:"
echo "   gcloud logging read \\"
echo "     'resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME' \\"
echo "     --limit=50 --project=$PROJECT_ID"
echo ""
echo "4. Check metrics in Cloud Console:"
echo "   https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME/metrics?project=$PROJECT_ID"
echo ""
echo "5. Set up monitoring dashboard"
echo ""

# ==============================================
# Cost Estimation
# ==============================================
echo "💰 Expected Monthly Cost:"
echo "  Base (2 instances): ~$117/month"
echo "  Average (8 instances): ~$350-500/month"
echo "  Savings vs per-agent: $1,500-1,850/month (75-85%)"
echo ""
