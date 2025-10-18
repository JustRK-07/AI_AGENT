# 👨‍💻 Developer Onboarding Guide
## Voice AI Agent Platform - Core-Worker Architecture

**Last Updated:** October 2025
**Architecture Version:** 2.0 (Core-Worker)

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Quick Start](#quick-start)
4. [Project Structure](#project-structure)
5. [Core Concepts](#core-concepts)
6. [Development Workflow](#development-workflow)
7. [Common Tasks](#common-tasks)
8. [API Reference](#api-reference)
9. [Troubleshooting](#troubleshooting)
10. [Deployment](#deployment)

---

## 🎯 Project Overview

### What This Platform Does

This is a **multi-tenant AI voice agent platform** that enables:

- ✅ Creating unlimited AI voice agents via web UI
- ✅ Handling inbound calls (customer service, support, etc.)
- ✅ Making outbound calls (sales, surveys, follow-ups)
- ✅ Real-time voice conversations using LiveKit + OpenAI/Cartesia/AssemblyAI
- ✅ Agent configuration stored in database (no code deployment per agent!)
- ✅ Dynamic voice/model selection (100+ voices, 10+ LLM models)
- ✅ Multi-tenant support (multiple companies/teams)

### Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend** | Next.js 15 + TypeScript + Tailwind | Web UI for agent management |
| **Backend** | Node.js + Express + Prisma | REST API, database ORM |
| **Database** | SQLite (dev) / PostgreSQL (prod) | Agent configs, campaigns, logs |
| **Voice Worker** | Python 3.9 + LiveKit Agents SDK | Real-time voice processing |
| **Voice Providers** | Cartesia, ElevenLabs, OpenAI TTS | Text-to-Speech |
| **STT Providers** | AssemblyAI, Deepgram, Google | Speech-to-Text |
| **LLM Providers** | OpenAI, Google Gemini | Conversational AI |
| **Real-time Audio** | LiveKit Cloud | WebRTC rooms, audio streaming |

---

## 🏗️ Architecture

### Core-Worker Architecture (v2.0)

**Previous (v1.0):** Each agent = separate Python file + deployment
**Current (v2.0):** Single Python worker handles ALL agents dynamically

```
┌─────────────────────────────────────────────────────────────────┐
│                     🗄️  PostgreSQL Database                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ agents: id, name, systemPrompt, llmModel, voiceId, etc.   │ │
│  │ metadata: { voiceProvider, sttProvider, transferNumber }   │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP GET /agents/:id/runtime-config
                             │ (5-minute cache)
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│              🤖 Core Voice Worker (Python)                       │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  core_voice_worker.py                                     │  │
│  │  - Single process, handles 25 concurrent calls           │  │
│  │  - Fetches agent config on-demand from database          │  │
│  │  - Creates LLM/TTS/STT dynamically per call              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  config/                                                  │  │
│  │  - AgentConfigLoader: Fetches configs with caching       │  │
│  │  - Fallback strategy: cache → API → stale → default      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  factories/                                               │  │
│  │  - LLMFactory: Creates OpenAI/Gemini clients             │  │
│  │  - TTSFactory: Creates Cartesia/ElevenLabs/OpenAI TTS    │  │
│  │  - STTFactory: Creates AssemblyAI/Deepgram/Google STT    │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬───────────────────────────────────────┘
                         │
                         │ WebSocket (Agents Protocol)
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                      🎙️  LiveKit Cloud                          │
│  - WebRTC rooms for real-time audio                            │
│  - Dispatches calls to core-worker                             │
│  - Handles audio streaming, mixing, recording                  │
└────────────────────────┬───────────────────────────────────────┘
                         │
                         │ WebRTC
                         ↓
                   👤 Human Participant
                   (Browser or Phone)
```

### Request Flow Example

**Scenario:** Customer calls support number

```
1. 📞 Call comes in via Twilio/SIP
   POST /api/v1/phone-numbers/handle-call

2. 🔄 Backend creates LiveKit room
   await livekit.createRoom({
     name: "call-1234567890",
     metadata: JSON.stringify({ agent_id: "cm123...", call_type: "inbound" })
   })

3. 🎯 LiveKit dispatches to core-worker
   core-worker.entrypoint(ctx) is triggered

4. 📥 Core-worker extracts agent_id from room metadata
   agent_id = metadata.get("agent_id")  // "cm123..."

5. 🔍 Core-worker fetches agent config from database
   GET http://localhost:3000/api/v1/agents/cm123.../runtime-config

   Response:
   {
     name: "Support Agent",
     llm_model: "gpt-4o-mini",
     voice_id: "79a125e8...",
     tts_provider: "cartesia",
     stt_provider: "assemblyai",
     system_prompt: "You are a helpful support agent..."
   }

6. 🛠️ Core-worker creates components dynamically
   llm = OpenAI(model="gpt-4o-mini")
   tts = CartesiaTTS(voice_id="79a125e8...")
   stt = AssemblyAISTT(language="en")

7. 🎙️ Core-worker joins room and starts conversation
   await session.start(room=ctx.room, agent=agent)
   await session.generate_reply("Hello! How can I help you?")

8. 💬 Conversation continues until hang up
```

**Key Insight:** Agent configuration is loaded **at call time**, not deployment time. This means:
- ✅ Add 1000 agents → No redeployment
- ✅ Update agent prompt → Takes effect in ~5 minutes (cache TTL)
- ✅ Change voice → Works immediately for new calls

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ (for backend + frontend)
- **Python** 3.9+ (for core-worker)
- **npm** or **pnpm**
- **Git**
- **SQLite** (dev) or **PostgreSQL** (prod)

### 1. Clone Repository

```bash
git clone <repository-url>
cd test_sip
```

### 2. Install Dependencies

```bash
# Backend
cd backend
npm install
npx prisma generate
npx prisma migrate dev
cd ..

# Frontend
cd web-ui
npm install
cd ..

# Core Worker
cd core-worker
pip3 install -r requirements.txt
cd ..
```

### 3. Environment Setup

Create `.env` files in each directory:

**backend/.env**
```bash
# Database
DATABASE_URL="file:./prisma/dev.db"

# LiveKit
LIVEKIT_URL="wss://your-project.livekit.cloud"
LIVEKIT_API_KEY="APIxxxxx"
LIVEKIT_API_SECRET="xxxxx"

# JWT
JWT_SECRET="your-secret-key-change-in-production"

# API
PORT=3000
API_PREFIX="/api/v1"
CORS_ORIGIN="http://localhost:4026"
```

**web-ui/.env.local**
```bash
NEXT_PUBLIC_API_URL="http://localhost:3000/api/v1"
NEXT_PUBLIC_LIVEKIT_URL="wss://your-project.livekit.cloud"
```

**core-worker/.env**
```bash
# LiveKit Connection
LIVEKIT_URL="wss://your-project.livekit.cloud"
LIVEKIT_API_KEY="APIxxxxx"
LIVEKIT_API_SECRET="xxxxx"

# Backend API (for fetching agent configs)
BACKEND_URL="http://localhost:3000"

# Voice Providers (Optional - can be set per-agent)
OPENAI_API_KEY="sk-..."
CARTESIA_API_KEY="..."
ASSEMBLYAI_API_KEY="..."
ELEVENLABS_API_KEY="..."
DEEPGRAM_API_KEY="..."
GOOGLE_API_KEY="..."

# Worker Configuration
WORKER_NAME="core-voice-worker-local"
MAX_CONCURRENCY=5
CONFIG_CACHE_TTL=300  # 5 minutes
LOG_LEVEL="INFO"
```

### 4. Seed Database

```bash
cd backend
npx prisma db seed
```

This creates:
- Demo tenant
- 3 sample agents (Sales, Support, Greeting)
- Test campaigns
- Sample phone numbers

### 5. Start Services

**Terminal 1: Backend**
```bash
cd backend
npm start
```

**Terminal 2: Frontend**
```bash
cd web-ui
npm run dev
```

**Terminal 3: Core Worker**
```bash
cd core-worker
python3 core_voice_worker.py start
```

### 6. Verify Everything Works

1. **Backend:** http://localhost:3000/health → `{"status":"ok"}`
2. **Frontend:** http://localhost:4026 → Shows UI
3. **Core-worker:** Terminal shows `✅ Worker registered`

---

## 📁 Project Structure

```
test_sip/
├── backend/                          # Node.js REST API
│   ├── src/
│   │   ├── controllers/              # Request handlers
│   │   │   ├── agentController.js    # Agent CRUD + runtime config
│   │   │   ├── agentTestController.js # Test session creation
│   │   │   ├── campaignController.js
│   │   │   └── ...
│   │   ├── routes/                   # API route definitions
│   │   │   ├── agentRoutes.js        # /api/v1/agents/*
│   │   │   ├── campaignRoutes.js
│   │   │   └── index.js              # Main router
│   │   ├── services/                 # Business logic
│   │   ├── middleware/               # Auth, validation, etc.
│   │   ├── config/                   # Configuration
│   │   └── server.js                 # Express app entry point
│   ├── prisma/
│   │   ├── schema.prisma             # Database schema
│   │   ├── migrations/               # Database migrations
│   │   └── dev.db                    # SQLite database (dev)
│   └── package.json
│
├── web-ui/                           # Next.js Frontend
│   ├── src/
│   │   ├── pages/                    # Next.js pages
│   │   │   ├── agents/
│   │   │   │   ├── index.tsx         # /agents - List agents
│   │   │   │   ├── create.tsx        # /agents/create - NEW UI!
│   │   │   │   └── [id].tsx          # /agents/:id - Agent details
│   │   │   ├── campaigns/
│   │   │   ├── phone-numbers/
│   │   │   └── index.tsx             # / - Dashboard
│   │   ├── components/               # React components
│   │   │   ├── InboundConfigSection.tsx     # Inbound config UI
│   │   │   ├── OutboundConfigSection.tsx    # Outbound config UI
│   │   │   ├── VoiceProviderSelector.tsx    # 100+ voice selector
│   │   │   ├── STTProviderSelector.tsx      # STT provider selector
│   │   │   ├── TokenLimitDisplay.tsx        # Token limit info
│   │   │   ├── AgentStatus.tsx
│   │   │   └── ui/                   # Shadcn UI components
│   │   ├── config/                   # Frontend config
│   │   │   ├── voice-providers.ts    # Voice provider data (NEW!)
│   │   │   ├── stt-providers.ts      # STT provider data (NEW!)
│   │   │   └── llm-models.ts         # LLM model data (UPDATED!)
│   │   ├── services/                 # API clients
│   │   │   ├── agentsService.ts
│   │   │   └── apiClient.ts
│   │   └── styles/
│   └── package.json
│
├── core-worker/                      # Python Voice Worker
│   ├── core_voice_worker.py          # Main entrypoint
│   ├── config/                       # Configuration management
│   │   ├── __init__.py
│   │   ├── agent_config_loader.py    # Fetches configs from backend
│   │   └── config_models.py          # Pydantic models
│   ├── factories/                    # Component factories
│   │   ├── __init__.py
│   │   ├── llm_factory.py            # Creates LLM clients
│   │   ├── tts_factory.py            # Creates TTS clients
│   │   └── stt_factory.py            # Creates STT clients
│   ├── utils/                        # Utilities
│   │   ├── __init__.py
│   │   └── logging.py                # Structured logging
│   ├── requirements.txt              # Python dependencies
│   ├── .env                          # Environment variables
│   └── README.md
│
├── TESTING_GUIDE.md                  # How to test the system
├── DEVELOPER_ONBOARDING.md           # This file!
├── DEPLOYMENT.md                     # Deployment instructions
└── README.md                         # Project overview
```

---

## 🧠 Core Concepts

### 1. Agent

An **Agent** is a configured AI voice assistant stored in the database.

**Database Schema:**
```prisma
model agents {
  id            String   @id @default(cuid())
  name          String
  description   String?

  // Voice Configuration
  voice_id      String?   // Voice ID (e.g., "79a125e8..." for Cartesia)

  // AI Configuration
  system_prompt String?   // System instructions
  personality   String?   // Personality traits
  llm_model     String?   @default("gpt-4o-mini")
  llm_provider  String?   @default("openai")

  // Metadata (JSON)
  metadata      String?   // Stores: voiceProvider, sttProvider, etc.

  // State
  is_active     Boolean   @default(true)
  created_at    DateTime  @default(now())
  updated_at    DateTime  @updatedAt
}
```

**Metadata JSON Structure:**
```json
{
  "voiceProvider": "cartesia",
  "sttProvider": "assemblyai",
  "sttModel": "universal-streaming",
  "transferNumber": "+18005551234",
  "fallbackNumber": "+18005556789",
  "businessHours": {
    "monday": { "start": "09:00", "end": "17:00" },
    "tuesday": { "start": "09:00", "end": "17:00" },
    ...
  },
  "outboundConfig": {
    "dialerType": "predictive",
    "maxRetries": 3,
    "dncEnabled": true
  }
}
```

### 2. Runtime Config

When a call starts, core-worker fetches the **runtime config** from backend API:

**Endpoint:** `GET /api/v1/agents/:id/runtime-config`

**Response:**
```json
{
  "success": true,
  "config": {
    "agent_id": "cm123...",
    "name": "Support Agent",
    "system_prompt": "You are a helpful customer support agent...",
    "personality": "Patient and empathetic",
    "llm_provider": "openai",
    "llm_model": "gpt-4o-mini",
    "temperature": 0.7,
    "voice_id": "79a125e8-cd45-4c13-8a67-188112f4dd22",
    "tts_provider": "cartesia",
    "tts_voice_id": "79a125e8...",
    "stt_provider": "assemblyai",
    "stt_language": "en",
    "max_concurrent_calls": 3
  },
  "cached_until": "2025-10-16T17:30:00Z",
  "timestamp": "2025-10-16T17:25:00Z"
}
```

**Implementation:** `backend/src/controllers/agentController.js` → `getAgentRuntimeConfig()`

### 3. Config Caching

**Why?** To reduce database load (1000 calls/sec would = 1000 DB queries/sec!)

**How?**
- Core-worker caches configs for **5 minutes** (configurable via `CONFIG_CACHE_TTL`)
- Fallback strategy:
  1. Check cache (if fresh) → return
  2. Fetch from API → cache it → return
  3. If API fails → use stale cache (better than nothing)
  4. If no cache → use default config

**Implementation:** `core-worker/config/agent_config_loader.py` → `AgentConfigLoader`

**Metrics:**
```python
{
  "total_requests": 1523,
  "cache_hits": 1498,
  "cache_misses": 25,
  "cache_hit_rate": 0.98,  # 98%!
  "api_successes": 24,
  "api_failures": 1,
  "fallback_to_stale": 1,
  "fallback_to_default": 0
}
```

### 4. Factories Pattern

Core-worker uses **factories** to create components dynamically based on config.

**LLMFactory** (`factories/llm_factory.py`):
```python
@staticmethod
def create(provider: str, model: str, api_key: str = None) -> str:
    """
    Creates LLM spec string for LiveKit Agents SDK

    Returns: "openai/gpt-4o-mini" or "google/gemini-2.0-flash"
    """
    if provider == "openai":
        return f"openai/{model}"
    elif provider == "google":
        return f"google/{model}"
    else:
        raise ValueError(f"Unknown LLM provider: {provider}")
```

**TTSFactory** (`factories/tts_factory.py`):
```python
@staticmethod
def create(provider: str, voice_id: str, api_key: str = None) -> str:
    """
    Creates TTS spec string for LiveKit Agents SDK

    Returns: "cartesia/sonic-2:79a125e8..." or "elevenlabs:sarah"
    """
    if provider == "cartesia":
        return f"cartesia/sonic-2:{voice_id}"
    elif provider == "elevenlabs":
        return f"elevenlabs:{voice_id}"
    elif provider == "openai":
        return f"openai:{voice_id}"  # nova, alloy, echo, etc.
```

**Usage in core_voice_worker.py:**
```python
# Dynamic component creation
llm_spec = LLMFactory.create(
    provider=config.llm_provider,  # "openai"
    model=config.llm_model,        # "gpt-4o-mini"
    api_key=config.llm_api_key
)

tts_spec = TTSFactory.create(
    provider=config.tts_provider,  # "cartesia"
    voice_id=config.voice_id,      # "79a125e8..."
    api_key=config.tts_api_key
)

stt_spec = STTFactory.create(
    provider=config.stt_provider,  # "assemblyai"
    language=config.stt_language,  # "en"
    api_key=config.stt_api_key
)

# Create agent session
session = AgentSession(
    llm=llm_spec,
    tts=tts_spec,
    stt=stt_spec,
    vad=silero.VAD.load()
)
```

### 5. Voice Providers

We support multiple TTS providers with 100+ voices.

**Configuration:** `web-ui/src/config/voice-providers.ts`

**Providers:**
```typescript
export const VOICE_PROVIDERS = [
  {
    id: 'cartesia',
    name: 'Cartesia Sonic 2.0',
    latency: '90ms',
    voiceCount: '100+',
    recommended: true,
    voices: [
      {
        id: '79a125e8-cd45-4c13-8a67-188112f4dd22',
        name: 'British Lady',
        gender: 'female',
        accent: 'British',
        tags: ['professional', 'clear', 'calm']
      },
      // ... 99 more voices
    ]
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    voiceCount: '10,000+',
    // ...
  }
];
```

**How it works:**
1. User selects voice in UI → `voiceProvider` + `voiceId` saved to database
2. Core-worker reads from database
3. TTSFactory creates correct spec: `cartesia/sonic-2:79a125e8...`

### 6. STT Providers

We support multiple Speech-to-Text providers with language detection.

**Configuration:** `web-ui/src/config/stt-providers.ts`

**Providers:**
```typescript
export const STT_PROVIDERS = [
  {
    id: 'assemblyai',
    name: 'AssemblyAI Universal-1',
    languageSupport: 99,
    avgLatency: '307ms',
    accuracy: 'excellent',
    recommended: true,
    bestFor: [
      'Multilingual environments',
      'Customer service (multiple languages)',
      'High accuracy requirements'
    ]
  },
  // Deepgram, Google STT
];
```

### 7. Inbound vs Outbound Configuration

Agents can be **inbound** (receive calls) or **outbound** (make calls).

**Inbound Features:**
- Business hours
- Transfer number (escalate to human)
- Fallback number (technical failures)
- Out-of-hours message
- IVR routing

**Outbound Features:**
- Dialer type (auto/predictive/progressive)
- Campaign objectives
- Call pacing & retry logic
- DNC compliance (required by law!)
- Consent tracking

**UI Component:** `web-ui/src/components/InboundConfigSection.tsx` and `OutboundConfigSection.tsx`

---

## 🔧 Development Workflow

### Making Changes to Agent Configuration

**Scenario:** Add a new field to agent config (e.g., `greetingMessage`)

1. **Update Database Schema** (`backend/prisma/schema.prisma`):
   ```prisma
   model agents {
     // ... existing fields
     greeting_message String? @default("Hello!")
   }
   ```

2. **Create Migration:**
   ```bash
   cd backend
   npx prisma migrate dev --name add_greeting_message
   ```

3. **Update Runtime Config** (`backend/src/controllers/agentController.js`):
   ```javascript
   async function getAgentRuntimeConfig(req, res) {
     const agent = await prisma.agents.findUnique({ ... });

     return res.json({
       config: {
         // ... existing fields
         greeting_message: agent.greeting_message,
       }
     });
   }
   ```

4. **Update Config Model** (`core-worker/config/config_models.py`):
   ```python
   class AgentConfig(BaseModel):
       # ... existing fields
       greeting_message: Optional[str] = "Hello!"
   ```

5. **Use in Core-Worker** (`core-worker/core_voice_worker.py`):
   ```python
   # In entrypoint function
   greeting = config.greeting_message or "Hello!"
   await session.generate_reply(greeting)
   ```

6. **Add to UI** (`web-ui/src/pages/agents/create.tsx`):
   ```typescript
   const [greetingMessage, setGreetingMessage] = useState("");

   // In form
   <Input
     value={greetingMessage}
     onChange={(e) => setGreetingMessage(e.target.value)}
     placeholder="Enter greeting message"
   />
   ```

7. **Test:**
   ```bash
   # Restart all services
   # Create new agent in UI
   # Test agent → Should use new greeting
   ```

### Adding a New Voice Provider

**Scenario:** Add PlayHT voice provider

1. **Add to Config** (`web-ui/src/config/voice-providers.ts`):
   ```typescript
   export const VOICE_PROVIDERS: VoiceProvider[] = [
     // ... existing providers
     {
       id: 'playht',
       name: 'PlayHT',
       label: '🎵 PlayHT',
       latency: '120ms',
       voiceCount: '200+',
       voices: [
         {
           id: 'playht-emma',
           name: 'Emma',
           gender: 'female',
           description: 'Professional American voice'
         },
         // ... more voices
       ]
     }
   ];
   ```

2. **Add to Factory** (`core-worker/factories/tts_factory.py`):
   ```python
   @staticmethod
   def create(provider: str, voice_id: str, api_key: str = None) -> str:
       if provider == "playht":
           return f"playht:{voice_id}"
       # ... existing providers
   ```

3. **Update Dependencies** (`core-worker/requirements.txt`):
   ```
   livekit-plugins-playht>=0.1.0
   ```

4. **Test:**
   ```bash
   cd core-worker
   pip3 install -r requirements.txt

   # Create agent with PlayHT voice in UI
   # Test → Should work!
   ```

### Adding a New LLM Model

**Scenario:** Add Claude 3.5 Sonnet

1. **Add to Config** (`web-ui/src/config/llm-models.ts`):
   ```typescript
   export const LLM_MODELS: LLMModel[] = [
     // ... existing models
     {
       value: 'claude-3-5-sonnet',
       label: 'Claude 3.5 Sonnet',
       description: 'Anthropic\'s most intelligent model',
       contextWindow: 200000,
       outputLimit: 4096,
       costLevel: '$$',
       recommended: false,
       bestFor: [
         'Complex reasoning',
         'Long context understanding',
         'Code generation'
       ]
     }
   ];
   ```

2. **Add to Factory** (`core-worker/factories/llm_factory.py`):
   ```python
   @staticmethod
   def create(provider: str, model: str, api_key: str = None) -> str:
       if provider == "anthropic":
           return f"anthropic/{model}"
       # ... existing providers
   ```

3. **Update Dependencies:**
   ```bash
   pip3 install anthropic
   ```

4. **Set API Key** (`core-worker/.env`):
   ```bash
   ANTHROPIC_API_KEY="sk-ant-..."
   ```

5. **Test:**
   - Create agent with Claude model
   - Test conversation
   - Verify it works!

---

## 🎯 Common Tasks

### Task 1: Create a New Agent via API

```bash
curl -X POST http://localhost:3000/api/v1/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sales Agent",
    "description": "Handles product inquiries and sales",
    "systemPrompt": "You are a friendly sales agent. Help customers find the right product.",
    "personality": "Enthusiastic and helpful",
    "llmModel": "gpt-4o-mini",
    "voiceId": "79a125e8-cd45-4c13-8a67-188112f4dd22",
    "metadata": {
      "voiceProvider": "cartesia",
      "sttProvider": "assemblyai"
    }
  }'
```

### Task 2: Test an Agent

```bash
# Method 1: Via UI
open http://localhost:4026/agents/cm123...
# Click "Test Agent" button

# Method 2: Via API
curl -X POST http://localhost:3000/api/v1/agents/cm123.../test-session
# Returns room token → use with LiveKit client
```

### Task 3: Update Agent Prompt

```bash
curl -X PUT http://localhost:3000/api/v1/agents/cm123... \
  -H "Content-Type: application/json" \
  -d '{
    "systemPrompt": "New system prompt here..."
  }'
```

**Note:** Changes take effect in ~5 minutes (cache TTL) or restart core-worker for immediate effect.

### Task 4: View Agent Runtime Config

```bash
curl http://localhost:3000/api/v1/agents/cm123.../runtime-config | jq '.'
```

This shows exactly what the core-worker sees.

### Task 5: Check Core-Worker Metrics

```python
# In core-worker, add endpoint or log metrics
metrics = config_loader.get_metrics()
print(metrics)

# Output:
# {
#   "total_requests": 1523,
#   "cache_hits": 1498,
#   "cache_hit_rate": 0.98,
#   "api_successes": 24,
#   "cache_size": 47
# }
```

### Task 6: Clear Agent Config Cache

```python
# In core-worker, add this to a management endpoint
config_loader.clear_agent_cache(agent_id="cm123...")
# Or clear all
config_loader.clear_cache()
```

### Task 7: Database Queries

```bash
# List all agents
sqlite3 backend/prisma/dev.db "SELECT id, name, is_active FROM agents;"

# Get agent details
sqlite3 backend/prisma/dev.db "SELECT * FROM agents WHERE id = 'cm123...';"

# Count active agents
sqlite3 backend/prisma/dev.db "SELECT COUNT(*) FROM agents WHERE is_active = 1;"

# View recent call logs
sqlite3 backend/prisma/dev.db "SELECT * FROM call_logs ORDER BY created_at DESC LIMIT 10;"
```

---

## 📚 API Reference

### Agent Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/agents` | List all agents |
| `POST` | `/api/v1/agents` | Create new agent |
| `GET` | `/api/v1/agents/:id` | Get agent details |
| `PUT` | `/api/v1/agents/:id` | Update agent |
| `DELETE` | `/api/v1/agents/:id` | Delete agent |
| `GET` | `/api/v1/agents/:id/runtime-config` | Get runtime config (for core-worker) |
| `POST` | `/api/v1/agents/:id/test-session` | Create test session |
| `GET` | `/api/v1/agents/:id/prompt-history` | Get prompt change history |

### Campaign Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/campaigns` | List campaigns |
| `POST` | `/api/v1/campaigns` | Create campaign |
| `GET` | `/api/v1/campaigns/:id` | Get campaign details |
| `PUT` | `/api/v1/campaigns/:id` | Update campaign |
| `POST` | `/api/v1/campaigns/:id/start` | Start campaign |
| `POST` | `/api/v1/campaigns/:id/pause` | Pause campaign |

### Phone Number Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/phone-numbers` | List phone numbers |
| `POST` | `/api/v1/phone-numbers` | Purchase/add number |
| `PUT` | `/api/v1/phone-numbers/:id` | Update number config |
| `POST` | `/api/v1/phone-numbers/:id/assign-agent` | Assign agent to number |

---

## 🐛 Troubleshooting

### Problem: Agent doesn't join room

**Symptoms:**
- Room created successfully
- No logs in core-worker

**Possible Causes:**

1. **Core-worker not running**
   ```bash
   ps aux | grep core_voice_worker
   # Should show running process
   ```

2. **Core-worker not connected to LiveKit**
   ```bash
   # Check core-worker logs for:
   # {"message": "registered worker", "id": "AW_..."}
   ```

3. **Wrong worker name**
   ```bash
   # In core-worker/.env
   WORKER_NAME="core-voice-worker-local"

   # Must match what LiveKit expects
   ```

4. **No participant joined**
   - Agent only joins AFTER a human connects!
   - Open browser and click "Test Agent"

### Problem: Agent joins but no audio

**Possible Causes:**

1. **Missing API keys**
   ```bash
   # Check core-worker/.env
   OPENAI_API_KEY="sk-..."
   CARTESIA_API_KEY="..."
   ASSEMBLYAI_API_KEY="..."
   ```

2. **Wrong voice ID**
   ```bash
   # Check agent config
   curl http://localhost:3000/api/v1/agents/cm123.../runtime-config

   # voice_id should be valid for the provider
   ```

3. **Microphone not working**
   - Check browser console
   - Allow microphone permission

### Problem: Configuration not loading

**Symptoms:**
- Agent uses default config
- Core-worker logs show API error

**Possible Causes:**

1. **Backend not running**
   ```bash
   curl http://localhost:3000/health
   # Should return {"status":"ok"}
   ```

2. **Wrong BACKEND_URL**
   ```bash
   # In core-worker/.env
   BACKEND_URL="http://localhost:3000"
   # NOT https, NOT with /api/v1
   ```

3. **Agent not in database**
   ```bash
   sqlite3 backend/prisma/dev.db "SELECT id, name FROM agents WHERE id = 'cm123...';"
   ```

### Problem: Changes not taking effect

**Cause:** Config cache (5 minutes TTL)

**Solutions:**
1. Wait 5 minutes
2. Restart core-worker (clears cache)
3. Reduce `CONFIG_CACHE_TTL` in development:
   ```bash
   # core-worker/.env
   CONFIG_CACHE_TTL=10  # 10 seconds for dev
   ```

---

## 🚀 Deployment

### Production Deployment

**Environment Variables:**

```bash
# Backend (.env.production)
DATABASE_URL="postgresql://user:pass@host:5432/db"
NODE_ENV="production"
LIVEKIT_URL="wss://prod.livekit.cloud"
JWT_SECRET="<strong-random-secret>"
CORS_ORIGIN="https://your-domain.com"

# Core-Worker (.env.production)
BACKEND_URL="https://api.your-domain.com"
LIVEKIT_URL="wss://prod.livekit.cloud"
MAX_CONCURRENCY=25
CONFIG_CACHE_TTL=300
LOG_LEVEL="INFO"
LOG_FORMAT="json"  # For log aggregation

# All provider API keys...
```

**Backend Deployment (Docker):**

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t voice-backend .
docker run -p 3000:3000 --env-file .env.production voice-backend
```

**Core-Worker Deployment (Systemd):**

```ini
# /etc/systemd/system/core-worker.service
[Unit]
Description=Core Voice Worker
After=network.target

[Service]
Type=simple
User=voice
WorkingDirectory=/opt/core-worker
Environment="PATH=/usr/local/bin:/usr/bin"
ExecStart=/usr/bin/python3 core_voice_worker.py start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable core-worker
sudo systemctl start core-worker
sudo systemctl status core-worker
```

**Frontend Deployment (Vercel):**

```bash
cd web-ui
vercel --prod
```

**Or Docker:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 📖 Additional Resources

- **LiveKit Docs:** https://docs.livekit.io
- **Prisma Docs:** https://www.prisma.io/docs
- **Next.js Docs:** https://nextjs.org/docs
- **OpenAI API:** https://platform.openai.com/docs
- **Cartesia API:** https://docs.cartesia.ai
- **AssemblyAI API:** https://www.assemblyai.com/docs

---

## 🤝 Getting Help

1. **Check logs:**
   - Backend: Terminal running `npm start`
   - Frontend: Browser console + Terminal
   - Core-worker: Terminal running Python script

2. **Check this documentation:**
   - `TESTING_GUIDE.md` for testing
   - `DEPLOYMENT.md` for production setup

3. **Ask the team:**
   - Slack: #voice-ai-dev
   - Email: dev@yourcompany.com

---

**Happy Coding! 🚀**

Last updated: October 2025
