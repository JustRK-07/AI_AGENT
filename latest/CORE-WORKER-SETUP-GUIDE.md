# 🚀 Core-Worker Setup & Deployment Guide

Complete guide for testing and deploying the core-worker architecture to production.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1: Local Setup](#phase-1-local-setup)
4. [Phase 2: Backend Testing](#phase-2-backend-testing)
5. [Phase 3: Local Core-Worker Testing](#phase-3-local-core-worker-testing)
6. [Phase 4: Production Deployment](#phase-4-production-deployment)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The core-worker architecture replaces per-agent deployments with a single, scalable worker pool that:

- ✅ Reduces deployment from 100 services → 1 service
- ✅ Saves 75-85% on infrastructure costs
- ✅ Enables instant agent updates (no redeployment)
- ✅ Scales horizontally (2-50 instances)
- ✅ Fetches agent configs at runtime from database

**Architecture**: Single core-worker deployment → Fetches agent config from backend API → Handles all calls

---

## Prerequisites

### Required Software

- ✅ **Node.js 18+** (for backend)
- ✅ **Python 3.10+** (for core-worker)
- ✅ **pip** (Python package manager)
- ✅ **Google Cloud SDK** (for production deployment)
- ✅ **jq** (for JSON parsing in test scripts)

### Required Accounts

- ✅ **LiveKit Cloud** account (already configured)
- ✅ **OpenAI API** key
- ✅ **Cartesia API** key (recommended for TTS)
- ✅ **AssemblyAI API** key (recommended for STT)
- ✅ **Google Cloud** account (for production deployment)

### Install Missing Tools

```bash
# Install jq (if not installed)
brew install jq

# Verify installations
node --version  # Should be 18+
python3 --version  # Should be 3.10+
gcloud --version  # Should be latest
```

---

## Phase 1: Local Setup

### Step 1.1: Configure Core-Worker Environment

```bash
cd core-worker

# Edit .env file with your API keys
nano .env
```

**Update these values in `.env`**:

```bash
# Replace with your actual API keys
OPENAI_API_KEY=sk-your-actual-openai-key
CARTESIA_API_KEY=your-actual-cartesia-key
ASSEMBLYAI_API_KEY=your-actual-assemblyai-key
DEEPGRAM_API_KEY=your-actual-deepgram-key
```

### Step 1.2: Install Python Dependencies

```bash
cd core-worker

# Install dependencies
python3 -m pip install -r requirements.txt

# Verify installation
python3 -c "import livekit.agents; print('✅ LiveKit agents installed')"
```

**Expected output**: `✅ LiveKit agents installed`

---

## Phase 2: Backend Testing

### Step 2.1: Start Backend Server

```bash
# Terminal 1: Start backend
cd backend
npm start
```

**Expected output**: "Campaign Calling API is running on port 3000"

### Step 2.2: Create Test Agent

1. Open web UI: **http://localhost:3001**
2. Login with your credentials
3. Navigate to **Agents** page
4. Click **"Create Agent"** button
5. Fill in the form:
   - **Name**: `Core Worker Test Agent`
   - **Description**: `Testing core-worker integration`
   - **Agent Type**: `Inbound`
   - **System Prompt**: `You are a friendly test agent. Greet the caller warmly and ask how you can help.`
   - **Voice**: `Nova`
   - **LLM Provider**: `OpenAI`
   - **LLM Model**: `gpt-4o-mini`
6. Click **"Create Agent"**
7. **📋 Copy the Agent ID** (looks like: `cmgxxxxx`)

### Step 2.3: Test Runtime Config API

```bash
# Set your agent ID
export AGENT_ID="<paste-your-agent-id-here>"

# Run test script
./test-runtime-config.sh
```

**Expected output**:

```
✅ Backend is running
✅ API responded successfully
✅ Response has success: true
✅ Config object present

Key Configuration Fields:
  Agent ID: cmg...
  Name: Core Worker Test Agent
  LLM Provider: openai
  LLM Model: gpt-4o-mini
  ...

========================================
  ✅ ALL TESTS PASSED!
==========================================
```

---

## Phase 3: Local Core-Worker Testing

### Step 3.1: Start Core-Worker

```bash
# Terminal 2: Start core-worker
cd core-worker
python3 -m core_voice_worker start
```

**Expected output**:

```
╔══════════════════════════════════════════════════════════════╗
║         🎙️  Core Voice Worker - Multi-Tenant AI Agent       ║
║  Single deployment. Infinite agents. Zero complexity.       ║
╚══════════════════════════════════════════════════════════════╝

🔥 Prewarming worker process...
✅ VAD model preloaded
✅ Environment configuration verified
✅ Backend API reachable: http://localhost:3000
🎯 Worker prewarmed and ready!

🚀 Starting Core Voice Worker...
```

### Step 3.2: Verify Worker in LiveKit

1. Go to: **https://cloud.livekit.io**
2. Login to your account
3. Navigate: **Agents** → **Workers**
4. **Verify**: You see `core-voice-worker-local` with status **Online** (green)

### Step 3.3: Create Test Room

```bash
# Terminal 3: Create test room
cd backend

# Set your agent ID
export AGENT_ID="<your-agent-id>"

# Create test room
node ../test-create-room.js
```

**Expected output**:

```
🔨 Creating Test Room
✅ Room created successfully!

📊 What to check now:
1. Check your core-worker logs for:
   - "📞 New job received"
   - "🔍 Fetching configuration"
   - "✅ Config fetched from API"
   - "✅ Agent session started successfully"
```

**In core-worker terminal**, you should see:

```
📞 New job received: test-room-1697234567
🔍 Fetching configuration for agent: cmg...
✅ Config fetched from API (duration: 245ms)
Configuration loaded: llm=openai/gpt-4o-mini, tts=cartesia, stt=assemblyai
🛠️  Initializing voice pipeline components...
✓ LLM initialized: openai/gpt-4o-mini
✓ TTS initialized: cartesia/sonic-2:...
✓ STT initialized: assemblyai/universal-streaming:en
🚀 Starting agent session...
✅ Agent session started successfully
```

### Step 3.4: Test Configuration Caching

Run the test 3 times to verify caching:

```bash
node ../test-create-room.js  # 1st call - API fetch (200-500ms)
node ../test-create-room.js  # 2nd call - Cache hit (5-15ms)
node ../test-create-room.js  # 3rd call - Cache hit (5-15ms)
```

**In core-worker logs**, verify:
- **1st call**: `Config fetched from API (duration: 200-500ms)`
- **2nd call**: `Cache hit for agent (duration: 5-15ms)`
- **3rd call**: `Cache hit for agent (duration: 5-15ms)`

### Step 3.5: Test with Real Voice Call (Optional)

If you have Twilio configured:

1. **Call your phone number**: `+18588796658`
2. **Listen for agent greeting**
3. **Have a short conversation**
4. **Hang up**

**Monitor core-worker logs** for the full conversation flow.

---

## Phase 4: Production Deployment

### Step 4.1: Configure Production Environment

```bash
cd core-worker

# Edit .env.production with your production values
nano .env.production
```

**Update these critical values**:

```bash
# Production backend URL
BACKEND_URL=https://your-production-backend.com

# Production API keys
OPENAI_API_KEY=sk-prod-your-key
CARTESIA_API_KEY=prod-your-key
ASSEMBLYAI_API_KEY=prod-your-key
```

### Step 4.2: Test Docker Build (Optional)

```bash
cd core-worker

# Build Docker image locally
docker build -t core-voice-worker:test .

# Test run (Ctrl+C to stop after verification)
docker run --env-file .env -p 8080:8080 core-voice-worker:test
```

### Step 4.3: Deploy to Google Cloud Run

```bash
cd core-worker

# Set environment variables
export BACKEND_URL="https://your-production-backend.com"
export OPENAI_API_KEY="sk-prod-..."
export CARTESIA_API_KEY="prod-..."
export ASSEMBLYAI_API_KEY="prod-..."
export DEEPGRAM_API_KEY="prod-..."

# Deploy!
./deploy-production.sh
```

**Deployment will**:
- Build the Docker image on Google Cloud Build (5-10 minutes)
- Deploy to Cloud Run with 2 min instances, 50 max
- Configure environment variables
- Show service URL and logs

**Expected output**:

```
🚀 Core Voice Worker Deployment
========================================

Deployment Configuration:
  Project ID: swift-area-475018-d1
  Region: us-central1
  Service Name: voice-agent-core-worker
  Backend URL: https://your-backend.com

⚠️  You are about to deploy to PRODUCTION
Continue? (yes/no): yes

Starting deployment...
✅ Deployment successful!

========================================
  ✅ DEPLOYMENT COMPLETE
==========================================
```

### Step 4.4: Verify Production Deployment

```bash
# Check service status
gcloud run services describe voice-agent-core-worker \
  --region us-central1 \
  --project swift-area-475018-d1
```

**Verify**:
- ✅ Status: Ready
- ✅ Min instances: 2
- ✅ Max instances: 50
- ✅ URL: https://voice-agent-core-worker-...run.app

### Step 4.5: Check Production Logs

```bash
# View recent logs
gcloud logging read \
  "resource.type=cloud_run_revision AND resource.labels.service_name=voice-agent-core-worker" \
  --limit=50 \
  --project=swift-area-475018-d1 \
  --format="value(textPayload,jsonPayload)"
```

**Look for**:
- ✅ "Worker prewarmed and ready"
- ✅ "Connected to LiveKit"
- ✅ No errors

### Step 4.6: Verify in LiveKit Dashboard

1. Go to **https://cloud.livekit.io**
2. Navigate: **Agents** → **Workers**
3. **Verify**: Multiple workers online (2+ instances)
4. Worker names: `core-voice-worker-prod-xxx`

---

## Monitoring & Maintenance

### View Live Logs

```bash
# Stream logs in real-time
gcloud logging tail \
  "resource.type=cloud_run_revision AND resource.labels.service_name=voice-agent-core-worker" \
  --project=swift-area-475018-d1
```

### Check Metrics

Visit Google Cloud Console:
```
https://console.cloud.google.com/run/detail/us-central1/voice-agent-core-worker/metrics?project=swift-area-475018-d1
```

**Key metrics to monitor**:
- **Request count**: Should increase with calls
- **Request latency**: Should be < 500ms (p95)
- **Instance count**: Should auto-scale 2-50
- **Error rate**: Should be < 1%
- **Memory usage**: Should be < 1.5GB

### Update Agent Configuration

Agents are updated instantly without redeployment:

1. Go to web UI
2. Edit agent (change prompt, voice, model, etc.)
3. Save changes
4. **Next call uses new config** (within 5 minutes due to cache)

### Scale Production

```bash
# Increase capacity
gcloud run services update voice-agent-core-worker \
  --max-instances 100 \
  --region us-central1

# Decrease capacity
gcloud run services update voice-agent-core-worker \
  --max-instances 20 \
  --region us-central1
```

---

## Troubleshooting

### Issue: Core-Worker Won't Start

**Symptoms**: Worker fails to start with connection errors

**Solutions**:
1. Verify LiveKit credentials in `.env`
2. Check backend is running: `curl http://localhost:3000/api/v1/health`
3. Verify Python dependencies: `pip list | grep livekit`
4. Check firewall/network settings

### Issue: Config Not Loading

**Symptoms**: "Failed to fetch config" errors

**Solutions**:
1. Test runtime config API: `./test-runtime-config.sh`
2. Verify agent exists in database
3. Check backend logs for errors
4. Verify agent is active: `isActive: true`

### Issue: Worker Not Appearing in LiveKit

**Symptoms**: Worker doesn't show in LiveKit dashboard

**Solutions**:
1. Verify LiveKit credentials
2. Check worker logs for connection errors
3. Ensure no firewall blocking wss://
4. Restart worker

### Issue: High Latency

**Symptoms**: Config fetch > 1 second

**Solutions**:
1. Check cache hit rate (should be > 90%)
2. Verify backend response time
3. Check network latency
4. Consider increasing `CONFIG_CACHE_TTL`

### Issue: Production Deployment Fails

**Symptoms**: `gcloud run deploy` fails

**Solutions**:
1. Verify Google Cloud project ID
2. Check API keys are set correctly
3. Ensure Cloud Run API is enabled
4. Check Cloud Build logs for errors
5. Verify Docker builds locally first

---

## Cost Optimization

### Current Architecture Cost

**Before (Per-Agent)**:
- 100 agents × $20/month = **$2,000/month**

**After (Core-Worker)**:
- Base: 2 instances × $117 = **$117/month**
- Auto-scale average: 8 instances = **$350-500/month**

**💰 Savings: $1,500-1,850/month (75-85%)**

### Cost Optimization Tips

1. **Tune auto-scaling**: Adjust min/max instances based on actual load
2. **Use spot instances**: 60% discount (if available)
3. **Optimize cache TTL**: Higher TTL = fewer API calls
4. **Monitor unused agents**: Deactivate unused agents in database
5. **Regional deployment**: Deploy in region closest to users

---

## Success Criteria Checklist

### Local Testing ✓
- [ ] Backend runtime config API works
- [ ] Core-worker starts locally
- [ ] Worker connects to LiveKit
- [ ] Config fetching works (< 500ms)
- [ ] Cache working (< 15ms cached)
- [ ] Test call succeeds with voice

### Production Deployment ✓
- [ ] Cloud Run deployment succeeds
- [ ] 2+ worker instances online
- [ ] Workers visible in LiveKit dashboard
- [ ] Production config API works
- [ ] Production test call succeeds
- [ ] No errors in logs for 1 hour

### Performance ✓
- [ ] Config fetch latency < 500ms (p95)
- [ ] Cache hit rate > 90%
- [ ] Call success rate > 99%
- [ ] Worker CPU < 80%
- [ ] Worker memory < 1.5GB

---

## Next Steps

1. ✅ Complete local testing
2. ✅ Deploy to production
3. ⏳ Set up monitoring dashboards
4. ⏳ Configure alerts
5. ⏳ Test with 10% production traffic
6. ⏳ Gradually increase to 100%
7. ⏳ Delete old per-agent deployments (after 2 weeks stable)

---

## Support

For issues or questions:

1. Check this guide's [Troubleshooting](#troubleshooting) section
2. Review core-worker logs
3. Check backend API health
4. Verify LiveKit dashboard

---

**Last Updated**: 2025-10-16
**Version**: 1.0.0
