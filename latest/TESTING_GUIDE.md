# 🧪 Core-Worker Testing Guide

## How the Architecture Works

```
┌─────────────┐         ┌──────────────┐         ┌─────────────────┐
│   Human     │────────▶│  LiveKit     │────────▶│  Core-Worker    │
│ Participant │  joins  │    Room      │ triggers│  (Python)       │
└─────────────┘         └──────────────┘         └─────────────────┘
                              │                          │
                              │                          ▼
                              │                   Fetches agent config
                              │                   from database
                              │                          │
                              ▼                          ▼
                        Agent joins room         Creates LLM/TTS/STT
                        with proper config       based on agent config
```

**Key Point**: The agent joins **AFTER** a human connects to the room!

---

## ✅ Test Method 1: Browser UI (Recommended)

This is the easiest way to test with real audio.

### Steps:

1. **Open the web UI:**
   ```
   http://localhost:4026
   ```

2. **Navigate to Agents page:**
   ```
   http://localhost:4026/agents
   ```

3. **Click on any agent** (e.g., "Support Agent")

4. **Click "Test Agent" button**
   - Allow microphone access when prompted
   - The UI will:
     - Create a LiveKit room
     - Connect you to the room
     - **Agent automatically joins when you connect!**

5. **Watch core-worker logs** (in the terminal where core-worker is running):
   ```
   📞 New job received: test-cmgpiyjiu000139jr5pncb18j-xxxxx
   🔍 Fetching configuration for agent: cmgpiyjiu000139jr5pncb18j
   ✅ Configuration loaded: llm=openai/gpt-4o-mini, tts=cartesia, stt=assemblyai
   🛠️  Initializing voice pipeline components...
   ✓ Connected to room
   🚀 Starting agent session...
   📞 Inbound call - greeting caller
   ✅ Agent session started successfully
   ```

6. **Start talking!**
   - Say "Hello"
   - The agent will respond using the voice configured in the database
   - Full conversation flow works

---

## ✅ Test Method 2: API + Manual Room Join

For testing without browser UI.

### Step 1: Create Test Session

```bash
curl -X POST http://localhost:3000/api/v1/agents/cmgpiyjiu000139jr5pncb18j/test-session
```

**Response:**
```json
{
  "success": true,
  "data": {
    "roomName": "test-cmgpiyjiu000139jr5pncb18j-9f6d2606",
    "token": "eyJhbGci...",
    "participantName": "tester-test-user",
    "livekitUrl": "https://firstproject-ly6tfhj5.livekit.cloud",
    "agent": {
      "id": "cmgpiyjiu000139jr5pncb18j",
      "name": "Support Agent"
    }
  }
}
```

### Step 2: Join Room with LiveKit Client

You need to connect a participant (using LiveKit SDK) to trigger the agent:

```python
# test_join.py
from livekit import rtc
import asyncio

async def test_agent():
    url = "wss://firstproject-ly6tfhj5.livekit.cloud"
    token = "YOUR_TOKEN_FROM_STEP_1"

    room = rtc.Room()

    @room.on("participant_connected")
    def on_participant_connected(participant: rtc.RemoteParticipant):
        print(f"✅ Participant joined: {participant.identity}")

    @room.on("track_subscribed")
    def on_track_subscribed(track: rtc.Track, publication, participant):
        print(f"🎙️  Got audio track from: {participant.identity}")

    await room.connect(url, token)
    print("✅ Connected to room, agent should join now...")
    print("👀 Check core-worker logs!")

    # Keep connection alive
    await asyncio.sleep(30)

    await room.disconnect()

asyncio.run(test_agent())
```

Run:
```bash
python test_join.py
```

---

## ✅ Test Method 3: Check Core-Worker Directly

### Verify Core-Worker is Running

```bash
# Check if core-worker process is running
ps aux | grep core_voice_worker

# Check if it's connected to LiveKit
# Look for this message in logs:
# {"message": "registered worker", "id": "AW_...", ...}
```

### Trigger a Test Job Manually

The core-worker listens for LiveKit dispatches. You can verify it's working by checking:

1. **Worker is registered:**
   ```json
   {"message": "registered worker", "id": "AW_hMrNpxxBpbch", "url": "wss://firstproject-ly6tfhj5.livekit.cloud"}
   ```

2. **Worker is available:**
   ```json
   {"message": "worker is below capacity, marking as available", "load": 0.44}
   ```

---

## 🔍 What to Look For in Core-Worker Logs

When a participant joins a room, you should see:

```
📞 New job received: test-cmgpiyjiu000139jr5pncb18j-xxxxx
   ↓
🔍 Fetching configuration for agent: cmgpiyjiu000139jr5pncb18j
   ↓
✅ Configuration loaded
   llm=openai/gpt-4o-mini
   tts=cartesia
   stt=assemblyai
   ↓
🛠️  Initializing voice pipeline components...
✓ LLM initialized: openai/gpt-4o-mini
✓ TTS initialized: cartesia/sonic-2:79a125e8...
✓ STT initialized: assemblyai/universal-streaming:en
   ↓
✓ Connected to room
   ↓
🎙️  Creating agent session...
   ↓
🚀 Starting agent session...
   ↓
📞 Inbound call - greeting caller
   ↓
✅ Agent session started successfully
```

---

## 📊 Quick Test Command

Test runtime config is working:

```bash
# 1. Check agent exists
sqlite3 backend/prisma/dev.db "SELECT id, name, is_active FROM agents WHERE is_active = 1 LIMIT 3;"

# 2. Fetch agent config (what core-worker sees)
curl -s http://localhost:3000/api/v1/agents/cmgpiyjiu000139jr5pncb18j/runtime-config | jq '.'

# 3. Create test session (returns room + token)
curl -s -X POST http://localhost:3000/api/v1/agents/cmgpiyjiu000139jr5pncb18j/test-session | jq '.'
```

---

## 🚨 Troubleshooting

### Agent Doesn't Join

**Problem:** Room created but agent never joins

**Causes:**
1. Core-worker not running
   ```bash
   cd core-worker
   python3 core_voice_worker.py start
   ```

2. Core-worker not connected to LiveKit
   - Check logs for: `registered worker`
   - Verify `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` in `.env`

3. No participant joined the room
   - Agent only joins **after** a human participant connects
   - Use browser UI to test with real microphone

### Agent Joins But Doesn't Talk

**Problem:** Agent joins room but no audio

**Causes:**
1. TTS/STT API keys missing
   - Check `CARTESIA_API_KEY`, `ASSEMBLYAI_API_KEY`, `OPENAI_API_KEY` in `.env`

2. Voice provider not configured
   - Check agent config: `voice_id`, `tts_provider`, `stt_provider`

3. Microphone not working
   - Browser must have microphone permission
   - Check browser console for errors

### Configuration Not Loading

**Problem:** Agent uses default config instead of database config

**Causes:**
1. Backend not running
   ```bash
   cd backend
   npm start
   ```

2. Wrong `BACKEND_URL` in core-worker
   - Should be: `http://localhost:3000`
   - Check `.env` in `core-worker/` directory

3. Agent ID mismatch
   - Room metadata must include correct `agent_id`
   - Check database: `SELECT id, name FROM agents WHERE is_active = 1;`

---

## ✅ Success Criteria

You know it's working when:

1. ✅ Core-worker connects to LiveKit (`registered worker`)
2. ✅ Agent configuration loads from database (check logs)
3. ✅ Agent joins room when participant connects
4. ✅ Agent speaks greeting message
5. ✅ Agent responds to your voice input
6. ✅ Full conversation works end-to-end

---

## 🎯 Next Steps After Testing

Once testing works:

1. **Deploy to Production:**
   ```bash
   # Single deployment handles ALL agents
   cd core-worker
   python3 core_voice_worker.py start
   ```

2. **Add More Agents:**
   - Create agent in UI: http://localhost:4026/agents/create
   - Agent works immediately (no redeployment!)

3. **Monitor:**
   - Core-worker logs show all agent activity
   - Cache metrics available (hit rate, API calls, etc.)

---

## 📱 Real-World Usage

### Inbound Calls (Customer calls your number)

```
1. Customer calls +1234567890
2. Twilio/SIP forwards to your backend
3. Backend creates LiveKit room with agent_id
4. Core-worker joins with agent config
5. Agent greets customer
6. Conversation happens
7. Agent can transfer to human if needed
```

### Outbound Calls (You call customers)

```
1. Campaign created with agent assignment
2. Dialer triggers call to +1987654321
3. Backend creates LiveKit room with agent_id + campaign_id
4. Core-worker fetches config (agent + campaign overrides)
5. Agent waits for customer to answer
6. Agent delivers campaign message
7. Agent logs outcome
```

---

## 🔗 Useful Links

- **Frontend:** http://localhost:4026
- **Backend API:** http://localhost:3000
- **Agents Page:** http://localhost:4026/agents
- **Create Agent:** http://localhost:4026/agents/create
- **Live Kit Dashboard:** https://cloud.livekit.io

---

## 💡 Tips

1. **Always test with browser UI first** - It's the easiest way to verify everything works
2. **Watch core-worker logs** - They show exactly what's happening
3. **Check agent config endpoint** - Verify configuration before testing: `/api/v1/agents/:id/runtime-config`
4. **Use Test Agent button** - Built into UI, creates room automatically
5. **Cache is 5 minutes** - Config changes take up to 5 min to reflect (or restart core-worker)

