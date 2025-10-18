# System Architecture

## Table of Contents

1. [Overview](#overview)
2. [Components](#components)
3. [Data Flow](#data-flow)
4. [Configuration Loading](#configuration-loading)
5. [Scaling Strategy](#scaling-strategy)
6. [Error Handling](#error-handling)
7. [Security](#security)
8. [Monitoring](#monitoring)

---

## Overview

The Core Voice Worker uses a **centralized worker pool architecture** where a single deployment handles multiple agent configurations dynamically. This eliminates the need for per-agent deployments while maintaining complete isolation and customization per agent.

### Design Principles

1. **Configuration over Code**: Agent behavior defined in database, not in code
2. **Horizontal Scaling**: Scale workers based on total load, not agent count
3. **Fail-Safe**: Multiple fallback layers for configuration and execution
4. **Cost-Optimized**: Shared infrastructure with efficient resource utilization
5. **Zero-Downtime**: Graceful updates without service interruption

---

## Components

### 1. Core Voice Worker

**File:** `core_voice_worker.py`

The main entrypoint responsible for:
- Registering with LiveKit as a worker
- Receiving room assignments with metadata
- Fetching agent configuration from API
- Initializing voice pipeline components dynamically
- Handling voice conversations

**Worker Lifecycle:**

```
┌──────────────────────┐
│  Worker Starts       │
│  - Load environment  │
│  - Connect to LiveKit│
│  - Register as worker│
└─────────┬────────────┘
          │
          ▼
┌──────────────────────┐
│  Wait for Jobs       │
│  - Idle, ready state │
│  - Monitor for rooms │
└─────────┬────────────┘
          │
          ▼
┌──────────────────────┐
│  Job Received        │
│  - Room created      │
│  - Extract metadata  │
└─────────┬────────────┘
          │
          ▼
┌──────────────────────┐
│  Fetch Config        │
│  - Call API          │
│  - Check cache       │
│  - Validate response │
└─────────┬────────────┘
          │
          ▼
┌──────────────────────┐
│  Initialize Pipeline │
│  - Create STT        │
│  - Create LLM        │
│  - Create TTS        │
│  - Create session    │
└─────────┬────────────┘
          │
          ▼
┌──────────────────────┐
│  Handle Call         │
│  - Join room         │
│  - Process audio     │
│  - Generate responses│
└─────────┬────────────┘
          │
          ▼
┌──────────────────────┐
│  Cleanup             │
│  - End session       │
│  - Release resources │
│  - Ready for next job│
└──────────────────────┘
```

---

### 2. Agent Config Loader

**File:** `config/agent_config_loader.py`

Responsible for:
- Fetching agent configurations from backend API
- Implementing intelligent caching (5-minute TTL)
- Fallback to defaults on failure
- Campaign-specific configuration overrides

**Caching Strategy:**

```python
# Cache Structure
{
  "agent_id:campaign_id": (timestamp, config_object),
  "abc123:camp456": (1697234567.89, AgentConfig(...)),
  ...
}

# Cache TTL: 5 minutes (300 seconds)
# Eviction: Time-based + LRU if memory constrained
# Max entries: 1000 (configurable)
```

**Benefits:**
- 95%+ cache hit rate in production
- Reduces database load by 95%
- Faster response time (< 10ms cached vs 100-500ms API)
- Continues working during brief API outages

---

### 3. Factory Classes

#### LLM Factory

**File:** `factories/llm_factory.py`

Creates LLM instances based on provider configuration.

**Supported Providers:**

| Provider | Models | Format |
|----------|--------|--------|
| **OpenAI** | gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo | `openai/model-name` |
| **Cerebras** | llama3.1-8b, llama3.1-70b | `cerebras/model-name` |
| **Groq** | mixtral-8x7b, llama-3.1-70b | `groq/model-name` |
| **Google** | gemini-1.5-pro, gemini-1.5-flash | `google/model-name` |
| **Amazon** | claude-3-5-sonnet, etc. | `amazon/model-name` |

**Usage:**
```python
llm = LLMFactory.create(
    provider="openai",
    model="gpt-4o-mini",
    api_key=config.llm_api_key or os.getenv("OPENAI_API_KEY")
)
```

#### TTS Factory

**File:** `factories/tts_factory.py`

Creates TTS instances for voice synthesis.

**Supported Providers:**

| Provider | Voices | Latency |
|----------|--------|---------|
| **Cartesia Sonic 2** | Multiple voices | < 200ms |
| **OpenAI TTS** | alloy, echo, fable, onyx, nova, shimmer | ~300ms |
| **ElevenLabs** | Custom voices | ~400ms |
| **Deepgram Aura** | aura-asteria, aura-luna, etc. | < 250ms |

#### STT Factory

**File:** `factories/stt_factory.py`

Creates STT instances for speech recognition.

**Supported Providers:**

| Provider | Languages | Features |
|----------|-----------|----------|
| **AssemblyAI** | 100+ languages | Universal model, streaming |
| **Deepgram** | 30+ languages | Nova-2, real-time |
| **OpenAI Whisper** | 90+ languages | Large model, high accuracy |

---

## Data Flow

### Call Initiation Sequence

```
┌─────────┐
│ Caller  │ Dials phone number
└────┬────┘
     │
     ▼
┌─────────────────────┐
│ Twilio / SIP        │ Routes to LiveKit SIP trunk
│ (or LiveKit direct) │
└────┬────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│ LiveKit Server                          │
│                                          │
│ 1. Creates room with unique name        │
│ 2. Adds metadata:                       │
│    {                                    │
│      "agent_id": "abc123",              │
│      "campaign_id": "camp456",          │
│      "lead_id": "lead789",              │
│      "phone_number": "+15551234567"     │
│    }                                    │
│ 3. Dispatches job to available worker   │
└────┬────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│ Core Worker (One of Many)               │
│                                          │
│ 1. Receives job assignment              │
│ 2. Parses metadata                      │
│ 3. Extracts agent_id = "abc123"         │
└────┬────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│ Agent Config Loader                      │
│                                          │
│ 1. Check cache for "abc123:camp456"     │
│ 2. Cache miss? Fetch from API:          │
│    GET /api/v1/agents/abc123/           │
│        runtime-config?campaignId=camp456│
└────┬────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│ Backend API                              │
│                                          │
│ 1. Query database:                      │
│    SELECT * FROM agents WHERE id=abc123 │
│    JOIN agent_configs ON ...            │
│ 2. Apply campaign overrides if needed   │
│ 3. Return JSON config                   │
└────┬────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│ Core Worker - Initialize Components     │
│                                          │
│ llm = LLMFactory.create("openai", ...)  │
│ tts = TTSFactory.create("cartesia", ...)│
│ stt = STTFactory.create("assemblyai",...)│
│                                          │
│ session = AgentSession(                 │
│   stt=stt, llm=llm, tts=tts, ...        │
│ )                                        │
└────┬────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│ Voice Conversation                       │
│                                          │
│ ┌─────────────────────────┐             │
│ │ Caller speaks           │             │
│ └────┬────────────────────┘             │
│      │                                   │
│      ▼                                   │
│ ┌─────────────────────────┐             │
│ │ STT: Audio → Text       │             │
│ └────┬────────────────────┘             │
│      │                                   │
│      ▼                                   │
│ ┌─────────────────────────┐             │
│ │ LLM: Generate Response  │             │
│ └────┬────────────────────┘             │
│      │                                   │
│      ▼                                   │
│ ┌─────────────────────────┐             │
│ │ TTS: Text → Audio       │             │
│ └────┬────────────────────┘             │
│      │                                   │
│      ▼                                   │
│ ┌─────────────────────────┐             │
│ │ Stream to Caller        │             │
│ └─────────────────────────┘             │
│                                          │
│ (Loop until call ends)                  │
└─────────────────────────────────────────┘
```

---

## Configuration Loading

### Multi-Layer Fallback System

```python
def get_config_value(key, config, env_var):
    """
    Priority order (highest to lowest):
    1. Agent-specific database config
    2. Environment variable
    3. System default
    """
    if config and config.get(key):
        return config.get(key)  # Database wins
    elif os.getenv(env_var):
        return os.getenv(env_var)  # Env var fallback
    else:
        return get_system_default(key)  # System default
```

### Cache Flow

```
Request Config for agent_id:campaign_id
    ↓
Check in-memory cache
    ↓
┌───────────────────────────┐
│ Is cache entry present?   │
└───────┬───────────────────┘
        │
    ┌───┴───┐
    │  YES  │
    └───┬───┘
        │
        ▼
┌──────────────────────────┐
│ Is cache entry fresh?    │
│ (age < 5 minutes)        │
└───────┬──────────────────┘
        │
    ┌───┴───┐
    │  YES  │  Return cached config ✓
    └───────┘
        │
        │  NO
        ▼
┌──────────────────────────┐
│ Fetch from API           │
│                           │
│ Success? Update cache    │
│ Failure? Use stale cache │
└──────────────────────────┘
```

---

## Scaling Strategy

### Horizontal Auto-Scaling

**Configuration:**
```yaml
min_instances: 2      # Always running (high availability)
max_instances: 50     # Scale up to
concurrency: 25       # Jobs per worker
```

**Capacity Calculation:**
```
Max Concurrent Calls = max_instances × concurrency
                     = 50 × 25
                     = 1,250 simultaneous calls
```

**Scaling Triggers:**
- CPU utilization > 70%
- Memory utilization > 80%
- Active jobs > 20 per worker
- Request queue depth > 10

**Scaling Behavior:**
```
Low traffic:  2 workers (50 calls capacity)
Normal:       5-10 workers (125-250 calls)
Peak:         20-30 workers (500-750 calls)
Extreme:      50 workers (1,250 calls max)
```

### Cost Optimization

**Before (Per-Agent):**
```
100 agents × $20/month = $2,000/month
- Always running (even when idle)
- Each agent uses minimum resources
- No resource sharing
```

**After (Core Worker):**
```
Base cost: 2 workers × $30/month = $60/month
Peak cost: Average 8 workers × 30 hours × $2/hour = $480/month
Total: ~$150-300/month

Savings: $1,700-1,850/month (85-92%)
```

---

## Error Handling

### Configuration Fetch Errors

```python
try:
    # 1. Try to fetch from API
    config = await fetch_from_api(agent_id, campaign_id)
except APITimeoutError:
    # 2. Use cached config (even if expired)
    config = get_from_cache(agent_id, ignore_ttl=True)
    logger.warning(f"API timeout, using stale cache for {agent_id}")
except APIError:
    # 3. Use default config
    config = AgentConfig.default()
    logger.error(f"API error, using default config for {agent_id}")
```

### Component Initialization Errors

```python
try:
    llm = LLMFactory.create(provider, model, api_key)
except ProviderError:
    # Fallback to OpenAI gpt-4o-mini (reliable default)
    llm = "openai/gpt-4o-mini"
    logger.warning(f"Provider {provider} failed, using OpenAI fallback")
```

### Runtime Errors

```python
try:
    await session.start(room=ctx.room, agent=agent)
except SessionError as e:
    # Log error, notify monitoring
    logger.error(f"Session failed: {e}")
    await send_alert("session_failure", agent_id, str(e))
    # LiveKit automatically restarts job on another worker
    raise  # Re-raise to trigger LiveKit retry
```

### Graceful Degradation

| Error Type | Fallback Strategy |
|------------|------------------|
| Config API down | Use cached config (ignore TTL) |
| Database slow | Return cached config immediately |
| Invalid config | Use system defaults |
| LLM provider error | Fallback to OpenAI |
| TTS provider error | Fallback to Cartesia |
| Worker crash | LiveKit auto-restarts on new worker |

---

## Security

### API Key Management

**Priority Order:**
1. Agent-specific keys (database)
2. Environment variables
3. Never hardcoded

**Storage:**
- Database: Encrypted at rest (AES-256)
- Transit: HTTPS/TLS only
- Memory: Cleared after use
- Logs: Redacted (never logged)

### Access Control

```
Worker → API:     Service account with JWT token
API → Database:   Role-based access (read-only for runtime config)
Client → Worker:  LiveKit manages authentication
```

### Network Security

```
Internet → Load Balancer → Worker (internal network only)
Worker → Database API:      Internal VPC, no public IP
Worker → LiveKit:           WSS (encrypted WebSocket)
Worker → LLM APIs:         HTTPS only
```

---

## Monitoring

### Key Metrics

| Metric | Target | Alert If |
|--------|--------|----------|
| Config fetch latency | < 500ms (p95) | > 1s |
| Cache hit rate | > 95% | < 90% |
| Call success rate | > 99% | < 98% |
| Worker utilization | 60-80% | > 90% or < 20% |
| Concurrent calls | Dynamic | > 1,000 |
| Error rate | < 1% | > 2% |

### Logging

**Structured logging format:**
```json
{
  "timestamp": "2025-10-16T14:19:42.123Z",
  "level": "info",
  "worker_id": "worker-abc-123",
  "agent_id": "agent-xyz-789",
  "campaign_id": "camp-456",
  "action": "config_fetched",
  "duration_ms": 245,
  "cache_hit": false
}
```

### Alerts

**Critical (Page):**
- Config API unavailable > 5 minutes
- Worker crash rate > 5%
- Call failure rate > 5%

**Warning (Notify):**
- Cache miss rate > 50%
- Response latency > 2s (p95)
- Worker count > 40 (approaching limit)

---

**Last Updated:** 2025-10-16
**Version:** 1.0.0
