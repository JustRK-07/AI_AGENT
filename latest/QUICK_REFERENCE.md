# 📋 Quick Reference Card
## Voice AI Agent Platform - Developer Cheat Sheet

**Print this out or bookmark it!**

---

## 🚀 Start Development

```bash
# Terminal 1: Backend
cd backend && npm start

# Terminal 2: Frontend
cd web-ui && npm run dev

# Terminal 3: Core-Worker
cd core-worker && python3 core_voice_worker.py start
```

**URLs:**
- Frontend: http://localhost:4026
- Backend API: http://localhost:3000
- Health Check: http://localhost:3000/health

---

## 📁 File Locations

### Need to modify agent configuration UI?
```
web-ui/src/pages/agents/create.tsx
```

### Need to add new voice provider?
```
1. web-ui/src/config/voice-providers.ts       (Add provider data)
2. core-worker/factories/tts_factory.py        (Add factory logic)
```

### Need to change agent runtime config?
```
1. backend/src/controllers/agentController.js  (getAgentRuntimeConfig)
2. core-worker/config/config_models.py         (AgentConfig model)
3. core-worker/core_voice_worker.py            (Use new fields)
```

### Need to modify database schema?
```
1. backend/prisma/schema.prisma                (Update schema)
2. npx prisma migrate dev --name your_change   (Create migration)
3. npx prisma generate                         (Update Prisma client)
```

---

## 🔑 Key API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/v1/agents` | List all agents |
| `POST` | `/api/v1/agents` | Create new agent |
| `GET` | `/api/v1/agents/:id/runtime-config` | Get agent config (for core-worker) |
| `POST` | `/api/v1/agents/:id/test-session` | Create test session |
| `GET` | `/api/v1/campaigns` | List campaigns |
| `POST` | `/api/v1/campaigns/:id/start` | Start campaign |

**Full API Reference:** See `DEVELOPER_ONBOARDING.md` → API Reference section

---

## 🗄️ Database Queries

```bash
# Connect to database
cd backend
sqlite3 prisma/dev.db

# List all agents
SELECT id, name, is_active FROM agents;

# Get specific agent details
SELECT * FROM agents WHERE id = 'cm123...';

# Count active agents
SELECT COUNT(*) FROM agents WHERE is_active = 1;

# View recent calls
SELECT * FROM call_logs ORDER BY created_at DESC LIMIT 10;

# Exit sqlite
.exit
```

---

## 🧪 Testing Commands

```bash
# Quick test agent runtime config
curl http://localhost:3000/api/v1/agents/cm123.../runtime-config | jq '.'

# Create test session
curl -X POST http://localhost:3000/api/v1/agents/cm123.../test-session | jq '.'

# Test with browser (easiest!)
open http://localhost:4026/agents
# Click agent → "Test Agent" button → Allow mic → Talk!
```

---

## 🐛 Common Issues

### Agent doesn't join room
```bash
# Check core-worker logs:
# Should see: "registered worker"
# If not: Check LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET

# Remember: Agent joins AFTER human connects to room!
```

### Configuration not loading
```bash
# Check backend is running:
curl http://localhost:3000/health

# Check core-worker env:
echo $BACKEND_URL  # Should be http://localhost:3000

# Check agent exists:
sqlite3 backend/prisma/dev.db "SELECT id, name FROM agents WHERE id = 'cm123...';"
```

### Changes not taking effect
```bash
# Config is cached for 5 minutes!
# Solutions:
# 1. Wait 5 minutes
# 2. Restart core-worker (clears cache)
# 3. Set CONFIG_CACHE_TTL=10 in core-worker/.env for dev
```

---

## 🔧 Common Tasks

### Create Agent via API
```bash
curl -X POST http://localhost:3000/api/v1/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Agent",
    "systemPrompt": "You are a helpful assistant...",
    "llmModel": "gpt-4o-mini",
    "voiceId": "79a125e8-cd45-4c13-8a67-188112f4dd22",
    "metadata": {
      "voiceProvider": "cartesia",
      "sttProvider": "assemblyai"
    }
  }'
```

### Update Agent Prompt
```bash
curl -X PUT http://localhost:3000/api/v1/agents/cm123... \
  -H "Content-Type: application/json" \
  -d '{"systemPrompt": "New prompt..."}'
```

### Check Core-Worker Metrics
```python
# Add this to core-worker or check logs:
metrics = config_loader.get_metrics()
# Shows cache hit rate, API calls, etc.
```

---

## 📊 Architecture Flow

```
Call Starts
    ↓
Backend creates LiveKit room with agent_id in metadata
    ↓
LiveKit dispatches to core-worker
    ↓
Core-worker extracts agent_id from metadata
    ↓
Core-worker fetches config from backend (GET /runtime-config)
    ↓
Core-worker checks cache (5min TTL)
    • Hit? → Use cached config
    • Miss? → Fetch from API → Cache it
    ↓
Core-worker creates LLM/TTS/STT dynamically
    ↓
Core-worker joins room
    ↓
Agent starts conversation
    ↓
Human talks → STT → LLM → TTS → Human hears
    ↓
Loop until hang up
```

---

## 🎯 Voice Provider IDs

### Cartesia (Recommended)
- British Lady: `79a125e8-cd45-4c13-8a67-188112f4dd22`
- American Male: `b7d03a88-b3e3-4c1e-85e0-9c7c3d0c1c3e`
- See `web-ui/src/config/voice-providers.ts` for all 100+ voices

### ElevenLabs
- Sarah: `sarah`
- See ElevenLabs docs for IDs

### OpenAI
- Nova: `nova`
- Alloy: `alloy`
- Echo: `echo`
- Fable: `fable`
- Onyx: `onyx`
- Shimmer: `shimmer`

---

## 🧠 LLM Models

```typescript
// Fastest + Cheapest (Recommended)
'gpt-4o-mini'       // 128K context, 4K output

// Most Intelligent
'gpt-4o'            // 128K context, 4K output

// Largest Context
'gemini-1.5-pro'    // 2M context, 8K output

// Latest Google
'gemini-2.0-flash'  // 1M context, 8K output, fast
```

---

## 📞 Environment Variables Quick Reference

### Backend (.env)
```bash
DATABASE_URL="file:./prisma/dev.db"
LIVEKIT_URL="wss://..."
LIVEKIT_API_KEY="API..."
LIVEKIT_API_SECRET="..."
JWT_SECRET="..."
PORT=3000
```

### Core-Worker (.env)
```bash
LIVEKIT_URL="wss://..."
LIVEKIT_API_KEY="API..."
LIVEKIT_API_SECRET="..."
BACKEND_URL="http://localhost:3000"
WORKER_NAME="core-voice-worker-local"
MAX_CONCURRENCY=5
CONFIG_CACHE_TTL=300

# Provider Keys
OPENAI_API_KEY="sk-..."
CARTESIA_API_KEY="..."
ASSEMBLYAI_API_KEY="..."
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL="http://localhost:3000/api/v1"
NEXT_PUBLIC_LIVEKIT_URL="wss://..."
```

---

## 🔍 Log Watching

### Backend Logs
```bash
# In terminal running backend
# Watch for API requests, database queries
```

### Core-Worker Logs
```bash
# In terminal running core-worker
# Watch for:
# 📞 New job received
# 🔍 Fetching configuration
# ✅ Agent session started
```

### Frontend Logs
```bash
# Browser console (F12)
# Watch for API calls, React errors
```

---

## 🆘 Emergency Commands

### Restart Everything
```bash
# Kill all processes
pkill -f "npm start"
pkill -f "npm run dev"
pkill -f "core_voice_worker"

# Start fresh
cd backend && npm start &
cd web-ui && npm run dev &
cd core-worker && python3 core_voice_worker.py start
```

### Reset Database
```bash
cd backend
rm prisma/dev.db
npx prisma migrate dev
npx prisma db seed
```

### Clear Config Cache
```bash
# Restart core-worker
pkill -f "core_voice_worker"
cd core-worker && python3 core_voice_worker.py start
```

---

## 📚 Documentation Index

- **Project Overview:** `README.md`
- **Complete Dev Guide:** `DEVELOPER_ONBOARDING.md` ← **Read this first!**
- **Testing Guide:** `TESTING_GUIDE.md`
- **Quick Reference:** `QUICK_REFERENCE.md` ← **You are here**

---

## 💡 Pro Tips

1. **Always test with browser UI first** - Easiest way to verify everything works
2. **Watch core-worker logs** - They show exactly what's happening
3. **Check `/runtime-config` endpoint** - See what core-worker sees
4. **Use Test Agent button** - Built into UI, no curl needed
5. **Remember the cache** - Config changes take up to 5min (or restart worker)
6. **One worker = all agents** - Never deploy per-agent again!
7. **Database is source of truth** - All config comes from there
8. **Metadata field is JSON** - Store extra config there

---

**🚨 Important Phone Numbers (In an Emergency):**

- Balaji: [Your contact]
- DevOps: [DevOps contact]
- LiveKit Support: https://livekit.io/support

---

**Happy Coding! Keep this handy!** 🚀

Last Updated: October 2025
