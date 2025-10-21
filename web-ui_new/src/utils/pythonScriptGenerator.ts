/**
 * Python Script Generator Utility
 * Generates Python voice agent scripts matching the actual LiveKit implementation
 */

import { Agent } from '@/services/agentsService';

export interface ScriptGenerationOptions {
  model?: string;
  voice?: string;
  temperature?: number;
}

/**
 * Generate a Python voice agent script matching the actual voice_agent.py structure
 */
export function generatePythonScript(
  agent: Agent,
  options: ScriptGenerationOptions = {}
): string {
  const {
    model = 'gpt-4o-mini',
    voice = 'cartesia-sonic-2',
    temperature = 0.7,
  } = options;

  // Voice ID mapping for Cartesia - using actual distinct voices
  const voiceIdMap: Record<string, string> = {
    // Professional and warm (default)
    'alloy': '9626c31c-bec5-4cca-baa8-f8ba9e84c8bc',
    // Warm, friendly, professional (female)
    'nova': 'a0e99841-438c-4a64-b679-ae501e7d6091',
    // Confident and strong (male)
    'echo': '79a125e8-cd45-4c13-8a67-188112f4dd22',
    // Friendly and energetic (female)
    'shimmer': '248be419-c632-4f23-adf1-5324ed7dbf1d',
    // Deep and authoritative (male)
    'onyx': '41534374-4c8c-4360-b3f9-551b82be3e82',
    // Engaging for storytelling (neutral)
    'fable': '156fb8d2-335b-4950-9cb3-a2d33befec77',
    // Cartesia Sonic 2 default
    'cartesia-sonic-2': '9626c31c-bec5-4cca-baa8-f8ba9e84c8bc',
  };

  const cartesiaVoiceId = voiceIdMap[voice] || '9626c31c-bec5-4cca-baa8-f8ba9e84c8bc';

  // Generate agent name for LiveKit (lowercase, no spaces)
  const livekitAgentName = agent.name.toLowerCase().replace(/\s+/g, '-');

  // Generate Python class name (remove special characters, keep only alphanumeric)
  const pythonClassName = agent.name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '');

  const script = `#!/usr/bin/env python3
"""
AI Voice Agent: ${agent.name}
Description: ${agent.description || 'AI Voice Assistant'}
Agent ID: ${agent.id}
Generated: ${new Date().toISOString()}

SETUP INSTRUCTIONS:
===================

1. Install dependencies:
   pip install -r requirements.txt

2. Set environment variables in .env.local (or export them):
   LIVEKIT_URL="wss://your-project.livekit.cloud"
   LIVEKIT_API_KEY="your-api-key"
   LIVEKIT_API_SECRET="your-api-secret"
   OPENAI_API_KEY="your-openai-key"
   BACKEND_URL="http://localhost:3000"

   NOTE: Configuration priority (highest to lowest):
   1. Database config (set via UI) - allows per-agent overrides
   2. .env.local - local environment variables
   3. .env - default environment variables

   AGENT_ID and AGENT_NAME are hardcoded in this script:
   - AGENT_ID="${agent.id}"
   - AGENT_NAME="${livekitAgentName}"

2b. (Optional) Set per-agent configuration via API:
   # This allows different LiveKit/OpenAI credentials per agent
   curl -X PUT http://localhost:3000/api/v1/agents/${agent.id}/config \\
     -H "Content-Type: application/json" \\
     -d '{
       "livekitUrl": "wss://agent-specific.livekit.cloud",
       "livekitApiKey": "agent-specific-key",
       "livekitApiSecret": "agent-specific-secret"
     }'

3. Run the agent:
   python ${agent.name.toLowerCase().replace(/\s+/g, '_')}_voice_agent.py dev

   The agent will automatically:
   ✓ Register with LiveKit as "${livekitAgentName}"
   ✓ Send heartbeat to backend every 10 seconds
   ✓ Appear as RUNNING in /local-agents/active
   ✓ Be ready to handle campaign calls

4. Verify agent is running:
   curl http://localhost:3000/api/v1/local-agents/active

5. Add to campaign (via UI or API):
   - This agent is already configured with livekitAgentName="${livekitAgentName}"
   - Just add agent (ID: ${agent.id}) to your campaign
   - Incoming/outgoing calls will automatically route to this running agent
   - No additional configuration needed!

"""
import os
import sys
import json
import asyncio
from dotenv import load_dotenv
from livekit import agents
from livekit.agents import Agent, AgentSession, RoomInputOptions
from livekit.plugins import noise_cancellation, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel

# Add agent directory to path for heartbeat client
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(current_dir, "agent"))

# Import heartbeat client
try:
    from heartbeat_client import init_heartbeat, start_heartbeat, stop_heartbeat
    HEARTBEAT_AVAILABLE = True
except ImportError as e:
    HEARTBEAT_AVAILABLE = False
    print(f"Warning: Heartbeat client not available: {e}")

# Load environment
load_dotenv(".env.local")
load_dotenv(".env")

# IMPORTANT: Force this agent's specific ID and name from database
# This overrides any values in .env files to ensure correct agent registration
os.environ["AGENT_ID"] = "${agent.id}"
os.environ["AGENT_NAME"] = "${livekitAgentName}"

# Try to fetch configuration from database (allows per-agent overrides)
def fetch_agent_config():
    """Fetch agent configuration from backend database"""
    try:
        import requests
        backend_url = os.getenv("BACKEND_URL", "http://localhost:3000")
        response = requests.get(
            f"{backend_url}/api/v1/agents/${agent.id}/runtime-config",
            timeout=5
        )
        if response.status_code == 200:
            config = response.json().get("config", {})
            print("✅ Loaded configuration from database")
            return config
    except Exception as e:
        print(f"⚠️  Could not fetch database config: {e}")
        print("   Falling back to .env configuration")
    return {}

# Fetch database config
db_config = fetch_agent_config()

# Set environment variables (database overrides .env)
os.environ["LIVEKIT_URL"] = db_config.get("livekitUrl") or os.getenv("LIVEKIT_URL")
os.environ["LIVEKIT_API_KEY"] = db_config.get("livekitApiKey") or os.getenv("LIVEKIT_API_KEY")
os.environ["LIVEKIT_API_SECRET"] = db_config.get("livekitApiSecret") or os.getenv("LIVEKIT_API_SECRET")
os.environ["OPENAI_API_KEY"] = db_config.get("openaiApiKey") or os.getenv("OPENAI_API_KEY")

# Print configuration source for debugging
livekit_source = 'database' if db_config.get('livekitUrl') else 'env'
openai_source = 'database' if db_config.get('openaiApiKey') else 'env'
print(f"🔧 Configuration loaded:")
print(f"   LiveKit URL: {os.getenv('LIVEKIT_URL')[:50]}... (from {livekit_source})")
print(f"   OpenAI Key: {'*' * 20} (from {openai_source})")
print(f"   Backend URL: {os.getenv('BACKEND_URL', 'http://localhost:3000')}")


class ${pythonClassName}VoiceAssistant(Agent):
    """${agent.description || 'AI Voice Assistant for handling phone calls'}"""

    def __init__(self) -> None:
        super().__init__(
            instructions="""${agent.systemPrompt || `You are a helpful AI voice assistant.

Your role is to:
- Greet callers warmly and professionally
- Listen carefully to what they need
- Provide clear, concise, and helpful responses
- Speak naturally and conversationally
- Be polite and patient

Keep your responses brief and to the point since this is a phone conversation.
If you don't understand something, politely ask the caller to repeat or clarify.`}

${agent.personality ? `Personality: ${agent.personality}` : ''}
"""
        )


async def prewarm_process(proc):
    """
    Prewarm function called when worker connects to LiveKit
    Preloads models for faster cold start and initializes heartbeat
    """
    print("🔥 Prewarming worker process...")
    print("   Loading AI models and dependencies...")

    # Prewarm VAD model
    try:
        vad = silero.VAD.load()
        print("   ✅ VAD model loaded successfully")
    except Exception as e:
        print(f"   ⚠️  VAD prewarm failed: {e}")

    # Verify environment
    required_vars = ["LIVEKIT_URL", "LIVEKIT_API_KEY", "LIVEKIT_API_SECRET", "OPENAI_API_KEY"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]

    if missing_vars:
        print(f"   ❌ Missing required environment variables: {', '.join(missing_vars)}")
    else:
        print("   ✅ Environment configuration verified")

    # Initialize heartbeat client immediately on worker startup
    if HEARTBEAT_AVAILABLE:
        try:
            agent_id = os.getenv("AGENT_ID", "${agent.id}")
            agent_name = os.getenv("AGENT_NAME", "${livekitAgentName}")
            backend_url = os.getenv("BACKEND_URL", "http://localhost:3000")

            assistant = ${pythonClassName}VoiceAssistant()
            system_prompt = assistant.instructions if hasattr(assistant, 'instructions') else "AI Voice Assistant"

            init_heartbeat(
                agent_id=agent_id,
                agent_name=agent_name,
                backend_url=backend_url,
                description="${agent.description || 'AI Voice Assistant'}",
                model="${model}",
                voice="${voice}",
                temperature=${temperature},
                prompt=system_prompt,
                port=None,
                host="localhost",
            )
            await start_heartbeat()
            print("   ✅ Heartbeat client started - agent will be visible in backend")
        except Exception as e:
            print(f"   ⚠️  Failed to start heartbeat client: {e}")

    print("🎯 Worker is ready to accept jobs!")


async def entrypoint(ctx: agents.JobContext):
    """Main entry point for the AI agent"""
    print(f"✓ Agent starting - Room: {ctx.room.name}")

    # Parse metadata for phone number (used for outbound calls)
    phone_number = None
    if ctx.job.metadata:
        try:
            metadata = json.loads(ctx.job.metadata)
            phone_number = metadata.get("phone_number")
            print(f"✓ Outbound call to: {phone_number}")
        except json.JSONDecodeError:
            pass

    # Connect to the room
    await ctx.connect()
    print("✓ Agent connected to room")

    # Set up the agent session with STT, LLM, TTS pipeline
    session = AgentSession(
        # Speech-to-Text
        stt="assemblyai/universal-streaming:en",

        # Large Language Model
        llm="openai/${model}",

        # Text-to-Speech (Cartesia Sonic 2)
        tts="cartesia/sonic-2:${cartesiaVoiceId}",

        # Voice Activity Detection
        vad=silero.VAD.load(),

        # Turn detection
        turn_detection=MultilingualModel(),
    )

    # Start the agent session
    await session.start(
        room=ctx.room,
        agent=${pythonClassName}VoiceAssistant(),
        room_input_options=RoomInputOptions(
            noise_cancellation=noise_cancellation.BVC(),
        ),
    )

    # For inbound calls, greet the caller
    if not phone_number:
        print("✓ Inbound call - greeting caller")
        await session.generate_reply("Hello! This is ${agent.name}. How can I help you today?")
    else:
        # For outbound calls, wait for the user to speak first
        print("✓ Outbound call - waiting for user")

    print("✅ Agent session started successfully")


def start_heartbeat_background():
    """Start heartbeat in background thread"""
    import threading

    def run_heartbeat():
        import asyncio

        if not HEARTBEAT_AVAILABLE:
            return

        try:
            agent_id = os.getenv("AGENT_ID", "${agent.id}")
            agent_name = os.getenv("AGENT_NAME", "${livekitAgentName}")
            backend_url = os.getenv("BACKEND_URL", "http://localhost:3000")

            assistant = ${pythonClassName}VoiceAssistant()
            system_prompt = assistant.instructions if hasattr(assistant, 'instructions') else "AI Voice Assistant"

            print("🔌 Initializing heartbeat client...")
            init_heartbeat(
                agent_id=agent_id,
                agent_name=agent_name,
                backend_url=backend_url,
                description="${agent.description || 'AI Voice Assistant'}",
                model="${model}",
                voice="${voice}",
                temperature=${temperature},
                prompt=system_prompt,
                port=None,
                host="localhost",
            )

            # Run heartbeat in its own event loop
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(start_heartbeat())
            print("✅ Heartbeat started - agent will be visible in backend\\n")

            # Keep the loop running forever
            loop.run_forever()
        except Exception as e:
            print(f"⚠️  Failed to start heartbeat: {e}\\n")

    # Start heartbeat in background thread
    heartbeat_thread = threading.Thread(target=run_heartbeat, daemon=True)
    heartbeat_thread.start()


if __name__ == "__main__":
    print("="*60)
    print("🎙️  ${agent.name} - LiveKit + Twilio")
    print("="*60)
    print(f"Agent ID: {os.getenv('AGENT_ID', '${agent.id}')}")
    print(f"Agent Name: {os.getenv('AGENT_NAME', '${livekitAgentName}')}")
    print(f"LiveKit URL: {os.getenv('LIVEKIT_URL')}")
    print(f"Model: ${model}")
    print(f"Voice: ${voice}")
    print(f"Temperature: ${temperature}")
    print("="*60)
    print("\\n🚀 Starting agent... Press Ctrl+C to stop\\n")

    # Start heartbeat in background thread (non-blocking)
    start_heartbeat_background()

    # Give heartbeat a moment to initialize
    import time
    time.sleep(2)

    # Run the agent in main thread
    # Add 'dev' command if not provided
    if len(sys.argv) == 1:
        sys.argv.append('dev')
    
    agents.cli.run_app(
        agents.WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm_process,
            agent_name=os.getenv("AGENT_NAME", "${livekitAgentName}"),
            api_key=os.getenv("LIVEKIT_API_KEY"),
            api_secret=os.getenv("LIVEKIT_API_SECRET"),
            ws_url=os.getenv("LIVEKIT_URL"),
        )
    )
`;

  return script;
}

/**
 * Get script filename for an agent
 */
export function getScriptFilename(agent: Agent): string {
  const sanitizedName = agent.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return `${sanitizedName}_voice_agent.py`;
}

/**
 * Generate LiveKit agent name from agent name
 * This should match what goes into the agent's livekitAgentName field
 */
export function getLivekitAgentName(agent: Agent): string {
  return agent.name.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Download script as a file
 */
export function downloadScript(agent: Agent, script: string): void {
  const filename = getScriptFilename(agent);
  const blob = new Blob([script], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copy script to clipboard
 */
export async function copyScriptToClipboard(script: string): Promise<void> {
  await navigator.clipboard.writeText(script);
}
