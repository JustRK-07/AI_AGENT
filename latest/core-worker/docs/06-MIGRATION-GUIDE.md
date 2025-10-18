# Migration Guide: Per-Agent → Core Worker

This comprehensive guide walks you through migrating from individual agent deployments to the core worker architecture with **zero downtime**.

## Table of Contents

1. [Pre-Migration](#pre-migration)
2. [Phase 1: Preparation](#phase-1-preparation-week-1)
3. [Phase 2: Backend Integration](#phase-2-backend-integration-week-1-2)
4. [Phase 3: Local Deployment](#phase-3-local-deployment-week-2)
5. [Phase 4: Cloud Deployment](#phase-4-cloud-deployment-week-3)
6. [Phase 5: Production Migration](#phase-5-production-migration-week-3-4)
7. [Rollback Plan](#rollback-plan)
8. [Post-Migration](#post-migration)

---

## Pre-Migration

### Pre-Migration Checklist

- [ ] **Backup database** - Full backup of all agent configurations
- [ ] **Document active agents** - List all agents, their configs, and campaigns
- [ ] **Set up monitoring** - Ensure you can track metrics during migration
- [ ] **Prepare rollback plan** - Document how to revert if needed
- [ ] **Stakeholder notification** - Inform team of migration schedule
- [ ] **Test environment** - Set up staging environment for testing

### Current State Assessment

Run this assessment before starting:

```bash
# Count active agents
psql -c "SELECT COUNT(*) FROM agents WHERE is_active = true;"

# List agents with their campaigns
psql -c "SELECT a.id, a.name, COUNT(ca.campaign_id) as campaign_count
         FROM agents a
         LEFT JOIN campaign_agents ca ON a.id = ca.agent_id
         GROUP BY a.id, a.name;"

# Check current monthly cost (estimate)
# Number of agents × $20/month
```

**Document your results:**
```
Total Agents: ___
Active Campaigns: ___
Current Monthly Cost: $___
```

---

## Phase 1: Preparation (Week 1)

### Step 1.1: Set Up Core Worker Directory

**Status:** ⏳ Not Started → 🚧 In Progress → ✅ Complete

**Time Estimate:** 5 minutes

**Action:**
```bash
cd /path/to/your/project
mkdir core-worker
cd core-worker
```

**Verification:**
```bash
ls -la core-worker/
# Should show empty directory
```

**Expected Output:**
```
core-worker/ directory created successfully
```

**Documentation Update:**
- [ ] Update README.md: Phase 1 Step 1.1 ✅
- [ ] Update CHANGELOG.md with timestamp

---

### Step 1.2: Install Core Worker Code

**Status:** ⏳ Not Started

**Time Estimate:** 10 minutes

**Action:**
```bash
# Copy core worker files from repo or create structure
cp -r /path/to/core-worker-template/* ./core-worker/

# Or if starting fresh:
mkdir -p core-worker/{config,factories,utils,docs,examples,tests}
```

**Verification:**
```bash
ls -la core-worker/
# Should show:
# config/, factories/, utils/, docs/, examples/, tests/
# __init__.py, core_voice_worker.py, requirements.txt
```

**Documentation Update:**
- [ ] Update README.md status
- [ ] Add entry to CHANGELOG.md

---

### Step 1.3: Install Dependencies

**Status:** ⏳ Not Started

**Time Estimate:** 3-5 minutes

**Action:**
```bash
cd core-worker
pip install -r requirements.txt
```

**Expected Output:**
```
Successfully installed:
  livekit-agents==1.2.0
  livekit-plugins-openai==0.10.0
  livekit-plugins-noise-cancellation==0.2.0
  livekit-api==1.0.0
  pydantic==2.5.0
  aiohttp==3.9.0
  python-dotenv==1.0.0
  requests==2.31.0
  ...
```

**Verification:**
```bash
python -c "import livekit; print('LiveKit version:', livekit.__version__)"
python -c "from pydantic import BaseModel; print('Pydantic OK')"
```

**Troubleshooting:**
- If installation fails, check Python version: `python --version` (need 3.10+)
- If conflicts, use virtual environment: `python -m venv venv && source venv/bin/activate`

**Documentation Update:**
- [ ] Update README.md: Dependencies ✅
- [ ] Document any issues in TROUBLESHOOTING.md

---

### Step 1.4: Configure Environment

**Status:** ⏳ Not Started

**Time Estimate:** 10 minutes

**Action:**
```bash
# Copy template
cp .env.template .env

# Edit with your values
nano .env  # or vi, vim, code, etc.
```

**Required Variables:**
```env
# Backend API
BACKEND_URL=http://localhost:3000
# or https://your-backend.run.app for production

# LiveKit Configuration
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret

# Default API Keys (fallback if not in database)
OPENAI_API_KEY=sk-...
CARTESIA_API_KEY=...
DEEPGRAM_API_KEY=...

# Worker Configuration
WORKER_NAME=core-voice-worker
MAX_CONCURRENCY=25
CONFIG_CACHE_TTL=300
LOG_LEVEL=INFO
```

**Verification:**
```bash
# Test environment loading
python -c "
import os
from dotenv import load_dotenv
load_dotenv()
print('LIVEKIT_URL:', os.getenv('LIVEKIT_URL'))
print('BACKEND_URL:', os.getenv('BACKEND_URL'))
print('OpenAI Key:', 'SET' if os.getenv('OPENAI_API_KEY') else 'NOT SET')
"
```

**Documentation Update:**
- [ ] Update docs/03-CONFIGURATION.md with your actual values
- [ ] Add to CHANGELOG.md

---

## Phase 2: Backend Integration (Week 1-2)

### Step 2.1: Add Runtime Config API Endpoint

**Status:** ⏳ Not Started

**Time Estimate:** 30 minutes

**Files to Modify:**
- `backend/src/controllers/agentController.js`
- `backend/src/routes/agentRoutes.js`

**Action 1: Add Controller Method**

Edit `backend/src/controllers/agentController.js`:

```javascript
/**
 * GET /api/v1/agents/:id/runtime-config
 * Get agent runtime configuration for core worker
 */
exports.getAgentRuntimeConfig = async (req, res) => {
    try {
        const { id } = req.params;
        const { campaignId } = req.query;

        // Fetch agent from database
        const agent = await prisma.agent.findUnique({
            where: { id },
            include: {
                config: true,  // Include AgentConfig
                campaignAgents: campaignId ? {
                    where: { campaignId }
                } : false
            }
        });

        if (!agent) {
            return res.status(404).json({
                success: false,
                error: 'Agent not found'
            });
        }

        if (!agent.isActive) {
            return res.status(400).json({
                success: false,
                error: 'Agent is not active'
            });
        }

        // Build runtime config
        const config = {
            agent_id: agent.id,
            name: agent.name,
            livekit_agent_name: agent.livekitAgentName || 'core-voice-worker',

            // AI Configuration
            system_prompt: agent.systemPrompt || 'You are a helpful AI assistant.',
            personality: agent.personality,
            voice_id: agent.voiceId || 'default',

            // LLM Configuration
            llm_provider: agent.llmProvider || 'openai',
            llm_model: agent.llmModel || 'gpt-4o-mini',
            temperature: agent.config?.temperature || 0.7,

            // API Keys (from AgentConfig if set, else fall back to env)
            llm_api_key: agent.config?.openaiApiKey || null,
            tts_provider: 'cartesia',  // Default for now
            tts_api_key: agent.config?.cartesiaApiKey || null,
            stt_provider: 'assemblyai',  // Default
            stt_api_key: agent.config?.deepgramApiKey || null,

            // LiveKit Configuration
            livekit_url: agent.config?.livekitUrl || null,
            livekit_api_key: agent.config?.livekitApiKey || null,
            livekit_api_secret: agent.config?.livekitApiSecret || null,

            // Other
            max_concurrent_calls: agent.maxConcurrentCalls || 3,
        };

        // Log access for audit
        console.log(`Runtime config fetched for agent ${id}${campaignId ? ` (campaign: ${campaignId})` : ''}`);

        return res.json({
            success: true,
            config,
            cached_until: new Date(Date.now() + 5 * 60 * 1000).toISOString()  // 5 min cache hint
        });

    } catch (error) {
        console.error('Error fetching agent runtime config:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
```

**Action 2: Add Route**

Edit `backend/src/routes/agentRoutes.js`:

```javascript
// Add after other routes
router.get('/:id/runtime-config', agentController.getAgentRuntimeConfig);
```

**Action 3: Test Endpoint**

```bash
# Test with curl
curl http://localhost:3000/api/v1/agents/cmgr32z4q000039dudjfah00c/runtime-config

# Expected response:
# {
#   "success": true,
#   "config": {
#     "agent_id": "cmgr32z4q000039dudjfah00c",
#     "name": "Greeting Agent",
#     "system_prompt": "You are a friendly receptionist...",
#     ...
#   },
#   "cached_until": "2025-10-16T14:24:00.000Z"
# }
```

**Verification Checklist:**
- [ ] Endpoint returns 200 for valid agent ID
- [ ] Endpoint returns 404 for invalid agent ID
- [ ] Response includes all required config fields
- [ ] API keys are null if not in database (worker will use env vars)
- [ ] Endpoint responds in < 500ms

**Documentation Update:**
- [ ] Update README.md: Phase 2 Step 2.1 ✅
- [ ] Update docs/04-API-REFERENCE.md with endpoint details
- [ ] Add example response to examples/ directory

---

### Step 2.2: Update Call Routing

**Status:** ⏳ Not Started

**Time Estimate:** 20 minutes

**Files to Modify:**
- Your call initiation service (wherever you create LiveKit rooms)

**Action: Pass Agent Metadata**

When creating a room for a call, include agent_id in metadata:

```javascript
// Example: backend/src/services/callService.js

async function initiateOutboundCall(campaignId, leadId, agentId) {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });

    // Create LiveKit room with metadata
    const roomName = `call-${leadId}-${Date.now()}`;
    const metadata = {
        agent_id: agentId,                  // ← Core worker uses this!
        campaign_id: campaignId,
        lead_id: leadId,
        phone_number: lead.phoneNumber,
        call_type: 'outbound',
        created_at: new Date().toISOString()
    };

    const roomOptions = {
        name: roomName,
        emptyTimeout: 300,  // 5 minutes
        metadata: JSON.stringify(metadata)  // ← Important!
    };

    const room = await livekitClient.createRoom(roomOptions);

    // Create SIP participant (triggers agent dispatch)
    await livekitClient.createSIPParticipant(
        roomName,
        lead.phoneNumber,
        {
            participantIdentity: `caller-${leadId}`,
            participantMetadata: JSON.stringify({ lead_id: leadId })
        }
    );

    return { room, roomName };
}
```

**For Inbound Calls:**

```javascript
// backend/src/routes/webhooks/livekitWebhook.js

app.post('/webhooks/livekit/inbound', async (req, res) => {
    const { roomName, participantIdentity, phoneNumber } = req.body;

    // Determine which agent to use based on phone number
    const phoneNumberRecord = await prisma.phoneNumber.findUnique({
        where: { number: phoneNumber },
        include: { inboundCampaign: { include: { campaignAgents: true } } }
    });

    if (!phoneNumberRecord || !phoneNumberRecord.inboundCampaign) {
        return res.status(404).json({ error: 'No campaign for this number' });
    }

    // Get primary agent for campaign
    const primaryAgent = phoneNumberRecord.inboundCampaign.campaignAgents
        .find(ca => ca.isPrimary);

    const agentId = primaryAgent?.agentId || phoneNumberRecord.inboundCampaign.campaignAgents[0]?.agentId;

    // Update room metadata to include agent_id
    await livekitClient.updateRoomMetadata(roomName, JSON.stringify({
        agent_id: agentId,  // ← Core worker uses this!
        campaign_id: phoneNumberRecord.inboundCampaignId,
        phone_number: phoneNumber,
        call_type: 'inbound'
    }));

    res.json({ success: true });
});
```

**Verification:**
```bash
# Check that rooms are created with metadata
# In LiveKit dashboard or via API
```

**Documentation Update:**
- [ ] Update README.md status
- [ ] Document call routing in ARCHITECTURE.md

---

## Phase 3: Local Deployment (Week 2)

### Step 3.1: Deploy Core Worker Locally

**Status:** ⏳ Not Started

**Time Estimate:** 10 minutes

**Action:**
```bash
cd core-worker
python -m core_voice_worker dev
```

**Expected Output:**
```
🚀 Core Voice Worker Starting...
✓ Loaded environment configuration
  - LiveKit URL: wss://your-project.livekit.cloud
  - Backend API: http://localhost:3000
  - Worker Name: core-voice-worker
  - Max Concurrency: 25 jobs

✓ Connected to LiveKit
✓ Registered as worker: core-voice-worker
✓ Ready to accept jobs

🎯 Worker is ready! Waiting for calls...
💡 Press Ctrl+C to stop
```

**Verification:**
```bash
# In another terminal, check worker status
curl http://localhost:3000/api/v1/local-agents/active

# Should show core worker in list
```

**Troubleshooting:**
- Connection refused? Check LiveKit credentials
- Import errors? Reinstall dependencies: `pip install -r requirements.txt`
- Config errors? Verify .env file

**Documentation Update:**
- [ ] Update README.md: Phase 3 Step 3.1 ✅
- [ ] Add troubleshooting entries if issues found

---

### Step 3.2: Test with Existing Agent

**Status:** ⏳ Not Started

**Time Estimate:** 15 minutes

**Action:**
1. Pick a test agent (preferably low-traffic)
2. Make a test call to trigger the agent
3. Monitor worker logs

**Test Agent Selection:**
```bash
# Find a suitable test agent
psql -c "SELECT id, name, livekit_agent_name, is_active
         FROM agents
         WHERE is_active = true
         LIMIT 5;"

# Pick one with low traffic
```

**Make Test Call:**
```bash
# Via your UI or API
# Or trigger manually via LiveKit API

# Watch worker logs
tail -f core-worker.log
```

**Expected Behavior:**
```
📞 Job received: room-call-lead123-1697234567890
✓ Extracted metadata: agent_id=cmgr32z4q000039dudjfah00c, campaign_id=camp456
✓ Fetching config from API...
✓ Config fetched in 245ms (cache miss)
✓ Initialized OpenAI gpt-4o-mini
✓ Initialized Cartesia Sonic 2 (voice: echo)
✓ Initialized AssemblyAI Universal
✓ Session started
💬 Conversation in progress...
   Caller: "Hello"
   Agent: "Hi! How can I help you today?"
   Caller: "I need information about..."
   Agent: "Of course! Let me help you with that..."
✓ Call completed - duration: 2m 34s
✓ Cleaned up resources
🎯 Ready for next job
```

**Verification Checklist:**
- [ ] Call connects successfully
- [ ] Agent greeting is correct
- [ ] Agent voice/personality matches config
- [ ] Conversation flows naturally
- [ ] No errors in logs
- [ ] Call logs saved to database
- [ ] Config was fetched and cached

**If Issues Arise:**
1. Check worker logs for errors
2. Verify agent config in database
3. Test API endpoint manually: `curl http://localhost:3000/api/v1/agents/{id}/runtime-config`
4. Check LiveKit dashboard for room status

**Documentation Update:**
- [ ] Update README.md: Testing ✅
- [ ] Add test results to examples/
- [ ] Document any issues in TROUBLESHOOTING.md

---

### Step 3.3: Load Testing

**Status:** ⏳ Not Started

**Time Estimate:** 30 minutes

**Action:**
```bash
# Run load test script
python tests/load_test.py --concurrent 10 --duration 300
```

**Test Configuration:**
```python
# tests/load_test.py parameters
concurrent_calls = 10    # Simultaneous calls
duration_seconds = 300   # 5 minutes
agent_ids = ['agent1', 'agent2', 'agent3']  # Rotate through agents
```

**Expected Metrics:**
```
Load Test Results:
==================
Duration: 5:00 minutes
Total calls: 50
Concurrent calls: 10
Success rate: 100% (50/50)

Performance:
- Avg call duration: 2m 15s
- Avg config fetch time: 125ms (cache hit rate: 96%)
- Avg session start time: 1.2s
- Max response latency: 2.1s (p95: 1.8s)

Errors: 0
Cache hits: 48/50 (96%)
Cache misses: 2/50 (4%)

Worker Stats:
- CPU usage: 45-60%
- Memory usage: 512MB-768MB
- Active jobs peak: 10
- Job queue depth max: 0 (no queuing)

✅ Load test PASSED
```

**Acceptance Criteria:**
- [ ] Success rate > 99%
- [ ] Avg response latency < 2s
- [ ] Cache hit rate > 90%
- [ ] No memory leaks (stable memory usage)
- [ ] Worker handles target concurrency

**Documentation Update:**
- [ ] Update docs/01-ARCHITECTURE.md with performance data
- [ ] Add load test results to README.md

---

## Phase 4: Cloud Deployment (Week 3)

### Step 4.1: Build Docker Image

**Status:** ⏳ Not Started

**Time Estimate:** 10 minutes

**Action:**
```bash
cd core-worker
docker build -t core-voice-worker:latest .
```

**Expected Output:**
```
[+] Building 45.2s (12/12) FINISHED
 => [internal] load build definition from Dockerfile
 => => transferring dockerfile: 523B
 => [internal] load .dockerignore
 => [1/7] FROM python:3.11-slim
 => [2/7] WORKDIR /app
 => [3/7] COPY requirements.txt .
 => [4/7] RUN pip install --no-cache-dir -r requirements.txt
 => [5/7] COPY . .
 => exporting to image
 => => exporting layers
 => => writing image sha256:abc123...
 => => naming to docker.io/library/core-voice-worker:latest
```

**Verification:**
```bash
# Test locally
docker run -it --rm \
  -e LIVEKIT_URL=$LIVEKIT_URL \
  -e LIVEKIT_API_KEY=$LIVEKIT_API_KEY \
  -e LIVEKIT_API_SECRET=$LIVEKIT_API_SECRET \
  -e BACKEND_URL=$BACKEND_URL \
  core-voice-worker:latest

# Should start and connect to LiveKit
```

**Documentation Update:**
- [ ] Update README.md: Docker ✅
- [ ] Update docs/05-DEPLOYMENT.md

---

### Step 4.2: Deploy to Google Cloud Run

**Status:** ⏳ Not Started

**Time Estimate:** 15 minutes

**Pre-Deployment:**
```bash
# Set up GCP project (if not already)
gcloud config set project your-project-id

# Enable required services
gcloud services enable run.googleapis.com cloudbuild.googleapis.com
```

**Action:**
```bash
gcloud run deploy voice-agent-core-worker \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --min-instances 2 \
  --max-instances 50 \
  --concurrency 25 \
  --memory 1Gi \
  --cpu 2 \
  --timeout 3600 \
  --set-env-vars \
    BACKEND_URL=$BACKEND_URL,\
    LIVEKIT_URL=$LIVEKIT_URL,\
    LIVEKIT_API_KEY=$LIVEKIT_API_KEY,\
    LIVEKIT_API_SECRET=$LIVEKIT_API_SECRET,\
    OPENAI_API_KEY=$OPENAI_API_KEY,\
    WORKER_NAME=core-voice-worker,\
    MAX_CONCURRENCY=25
```

**Expected Output:**
```
Building using Dockerfile and deploying container to Cloud Run service...
✓ Creating Revision...
✓ Routing traffic...
✓ Setting IAM Policy...
Done.
Service [voice-agent-core-worker] revision [voice-agent-core-worker-00001-abc] has been deployed and is serving 100 percent of traffic.
Service URL: https://voice-agent-core-worker-xyz123.run.app
```

**Verification:**
```bash
# Check service status
gcloud run services describe voice-agent-core-worker --region us-central1

# Check logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=voice-agent-core-worker" --limit 50
```

**Documentation Update:**
- [ ] Update README.md: Cloud Deployment ✅
- [ ] Save service URL for reference
- [ ] Update CHANGELOG.md

---

## Phase 5: Production Migration (Week 3-4)

### Step 5.1: Gradual Traffic Migration

**Status:** ⏳ Not Started

**Time Estimate:** 1 week (gradual)

**Strategy:**
```
Day 1-2: 10% traffic  → Core worker  (90% old agents)
Day 3-4: 50% traffic  → Core worker  (50% old agents)
Day 5-7: 100% traffic → Core worker  (0% old agents)
```

**Implementation:**

**Day 1-2: 10% Traffic**

```javascript
// Update 10% of campaigns to use core worker
// Keep old agents running as backup

async function selectWorkerForCall(campaignId) {
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });

    // 10% traffic to core worker
    if (Math.random() < 0.10) {
        // Use core worker (just return agent_id in metadata)
        return { useCoreWorker: true, agentId: campaign.primaryAgentId };
    } else {
        // Use old per-agent deployment
        return { useCoreWorker: false, agentId: campaign.primaryAgentId };
    }
}
```

**Monitoring During Day 1-2:**
- [ ] Error rate < 1%
- [ ] Call success rate > 99%
- [ ] Latency < 2s (p95)
- [ ] No customer complaints
- [ ] Worker auto-scaling working

**Day 3-4: 50% Traffic**

```javascript
// Increase to 50%
if (Math.random() < 0.50) {
    return { useCoreWorker: true, agentId: campaign.primaryAgentId };
}
```

**Monitoring During Day 3-4:**
- Same metrics as Day 1-2
- Monitor cost savings
- Check worker scaling behavior

**Day 5-7: 100% Traffic**

```javascript
// All traffic to core worker
return { useCoreWorker: true, agentId: campaign.primaryAgentId };
```

**Final Verification:**
- [ ] 100% of calls using core worker
- [ ] No errors or issues
- [ ] Cost savings confirmed
- [ ] Team comfortable with new system

**Rollback Triggers:**
- Error rate > 5%
- Call failure rate > 5%
- Critical bugs discovered
- Customer complaints

**Rollback Procedure:**
```javascript
// Immediate rollback - revert to 0% core worker
if (shouldRollback) {
    return { useCoreWorker: false, agentId: campaign.primaryAgentId };
}
```

**Documentation Update:**
- [ ] Update README.md: Production ✅
- [ ] Document actual migration timeline
- [ ] Record any issues in TROUBLESHOOTING.md

---

### Step 5.2: Cleanup Old Deployments

**Status:** ⏳ Not Started

**Time Estimate:** 1 hour

**Important:** Only do this AFTER successful 100% migration for 7+ days!

**Action 1: Archive Old Agent Files**

```bash
# Create archive
cd /path/to/project
mkdir -p backups
tar -czf backups/old-agents-$(date +%Y%m%d).tar.gz *_voice_agent.py *_requirements.txt

# Verify archive
tar -tzf backups/old-agents-*.tar.gz | head -20

# Remove old files
rm *_voice_agent.py
rm *_requirements.txt
```

**Action 2: Delete Old Cloud Run Services**

```bash
# List all agent services
gcloud run services list --platform managed --region us-central1 | grep agent

# Delete old per-agent services (be careful!)
# Keep core worker service!
gcloud run services delete agent-greeting-abc123 --region us-central1 --quiet
gcloud run services delete agent-support-def456 --region us-central1 --quiet
# ... repeat for all old services

# Or bulk delete (DANGEROUS - verify list first!)
gcloud run services list --platform managed --region us-central1 --format="value(metadata.name)" | \
  grep -v "voice-agent-core-worker" | \
  xargs -I {} gcloud run services delete {} --region us-central1 --quiet
```

**Action 3: Update Backend Code**

```javascript
// backend/src/services/agentFileGenerator.js
// Comment out or remove file generation logic

/*
exports.generateAgentFile = async (agentId) => {
    // NO LONGER NEEDED - using core worker
    console.log("Agent file generation disabled - using core worker");
    return null;
};
*/
```

**Action 4: Cost Analysis**

```bash
# Compare costs before/after
# Month before migration: $_____
# Month after migration: $_____
# Savings: $_____  (___%)
```

**Documentation Update:**
- [ ] Update README.md: Cleanup ✅
- [ ] Document cost savings
- [ ] Archive migration logs

---

## Rollback Plan

### Emergency Rollback (< 5 minutes)

If critical issues arise during migration:

**Step 1: Immediate Traffic Revert**

```javascript
// In your call routing logic
const USE_CORE_WORKER = false;  // ← Change this to false

if (USE_CORE_WORKER) {
    // Core worker path
} else {
    // Old per-agent path (still deployed)
}
```

**Step 2: Verify**
```bash
# Check that calls are using old agents again
# Monitor for 10-15 minutes
# Confirm error rate drops
```

**Step 3: Communicate**
```
"We've reverted to the previous system while we investigate the issue."
```

### Full Rollback (< 30 minutes)

If you need to completely abandon the migration:

```bash
# 1. Scale down core worker
gcloud run services update voice-agent-core-worker \
  --max-instances 0 \
  --region us-central1

# 2. Revert all campaigns to old agents
# Run database migration in reverse
psql -c "UPDATE campaigns SET use_core_worker = false;"

# 3. Verify old agents still deployed and working
gcloud run services list --platform managed

# 4. Monitor for stability
```

### Rollback Decision Tree

```
Issue Detected
    ↓
Is error rate > 5%?
    ↓
┌──YES → Immediate rollback
│   ↓
│   Monitor for 1 hour
│   ↓
│   Stable? → Investigate root cause
│            → Fix → Retry migration
│
└──NO → Continue monitoring
    ↓
    Is latency > 3s (p95)?
        ↓
    ┌──YES → Gradual rollback (reduce to 50% → 10% → 0%)
    │
    └──NO → Continue migration
```

---

## Post-Migration

### Success Metrics

Track these for 2 weeks post-migration:

| Metric | Target | Actual |
|--------|--------|--------|
| Call success rate | > 99% | ___% |
| Error rate | < 0.5% | ___% |
| Avg latency (p95) | < 2s | ___s |
| Config cache hit rate | > 95% | ___% |
| Monthly cost | < $300 | $___ |
| Cost savings | > 85% | ___% |

### Final Checklist

- [ ] All calls handled by core worker
- [ ] Old deployments cleaned up
- [ ] Cost savings confirmed
- [ ] Documentation updated
- [ ] Team trained on new system
- [ ] Monitoring dashboards set up
- [ ] Runbooks created for common issues
- [ ] Stakeholders notified of success

### Lessons Learned

Document what went well and what could be improved:

**What Went Well:**
- ___
- ___
- ___

**What Could Be Improved:**
- ___
- ___
- ___

**Recommendations for Future:**
- ___
- ___
- ___

---

**Migration Completed:** _______________
**Final Cost Savings:** $______/month (___%)
**Time to Complete:** ___ weeks
**Downtime:** ___ minutes (target: 0)

---

**Last Updated:** 2025-10-16
**Version:** 1.0.0
