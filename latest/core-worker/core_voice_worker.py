#!/usr/bin/env python3
"""
Core Voice Worker - Multi-Tenant AI Agent System

Main entrypoint for the core worker that handles all agents dynamically.
This single worker replaces individual per-agent deployments.

Usage:
    python -m core_voice_worker dev        # Development mode
    python -m core_voice_worker start      # Production mode
"""

import os
import sys
import json
import asyncio
import signal
from typing import Optional
from dotenv import load_dotenv

# LiveKit imports
from livekit import agents
from livekit.agents import Agent, AgentSession, JobContext
from livekit.plugins import silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel

# Core worker imports
from config import AgentConfigLoader, AgentConfig
from factories import LLMFactory, TTSFactory, STTFactory
from utils import setup_logger, get_logger, log_call_start, log_call_end, log_config_fetch, log_error

# Load environment variables
load_dotenv(".env.local")
load_dotenv(".env")

# Set up logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FORMAT = os.getenv("LOG_FORMAT", "colored")  # "colored" or "json"
logger = setup_logger("core-worker", LOG_LEVEL, LOG_FORMAT)

# Initialize config loader (global instance)
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:3000")
CACHE_TTL = int(os.getenv("CONFIG_CACHE_TTL", "300"))  # 5 minutes
config_loader = AgentConfigLoader(backend_url=BACKEND_URL, cache_ttl=CACHE_TTL)


class DynamicVoiceAgent(Agent):
    """
    Dynamic voice agent that adapts based on configuration

    This agent is instantiated per-call with dynamic configuration
    fetched from the database at runtime.
    """

    def __init__(self, config: AgentConfig):
        """
        Initialize agent with dynamic configuration

        Args:
            config: Agent configuration loaded from database
        """
        # Build instructions from config
        instructions = config.system_prompt

        if config.personality:
            instructions += f"\n\nPersonality: {config.personality}"

        super().__init__(instructions=instructions)

        self.config = config
        self.agent_id = config.agent_id
        self.agent_name = config.name

        logger.info(
            f"DynamicVoiceAgent initialized: {self.agent_name}",
            extra={"agent_id": self.agent_id}
        )


async def prewarm_process(proc):
    """
    Prewarm worker process when it first starts

    This is called once when the worker connects to LiveKit.
    Preloading models here reduces cold start time for first calls.
    """
    logger.info("🔥 Prewarming worker process...")

    # Prewarm VAD model
    try:
        vad = silero.VAD.load()
        logger.info("✅ VAD model preloaded")
    except Exception as e:
        logger.error(f"⚠️  VAD prewarm failed: {e}")

    # Verify environment configuration
    required_vars = ["LIVEKIT_URL", "LIVEKIT_API_KEY", "LIVEKIT_API_SECRET", "BACKEND_URL"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]

    if missing_vars:
        logger.error(f"❌ Missing required environment variables: {', '.join(missing_vars)}")
    else:
        logger.info("✅ Environment configuration verified")

    # Test backend connectivity
    try:
        import aiohttp
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{BACKEND_URL}/health", timeout=aiohttp.ClientTimeout(total=5)) as response:
                if response.status == 200:
                    logger.info(f"✅ Backend API reachable: {BACKEND_URL}")
                else:
                    logger.warning(f"⚠️  Backend API returned {response.status}")
    except Exception as e:
        logger.warning(f"⚠️  Could not reach backend API: {e}")

    logger.info("🎯 Worker prewarmed and ready!")


async def entrypoint(ctx: JobContext):
    """
    Main entrypoint for each agent session

    This function is called for every new call/room that's created.
    It dynamically loads the agent configuration and handles the conversation.

    Args:
        ctx: Job context from LiveKit containing room and metadata
    """
    import time
    start_time = time.time()

    room_name = ctx.room.name
    logger.info(f"📞 New job received: {room_name}")

    # Extract metadata from job
    agent_id: Optional[str] = None
    campaign_id: Optional[str] = None
    phone_number: Optional[str] = None
    call_type: str = "unknown"

    if ctx.job.metadata:
        try:
            metadata = json.loads(ctx.job.metadata)
            agent_id = metadata.get("agent_id")
            campaign_id = metadata.get("campaign_id")
            phone_number = metadata.get("phone_number")
            call_type = metadata.get("call_type", "unknown")

            logger.info(
                f"Extracted metadata: agent_id={agent_id}, campaign_id={campaign_id}, call_type={call_type}",
                extra={"agent_id": agent_id, "campaign_id": campaign_id, "room_name": room_name}
            )
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse job metadata: {e}")

    if not agent_id:
        logger.error("❌ No agent_id in metadata! Cannot proceed.")
        # Use default agent as fallback
        agent_id = "default"
        logger.warning("Using default agent configuration as fallback")

    try:
        # ===================================================================
        # STEP 1: Fetch Agent Configuration
        # ===================================================================
        logger.info(f"🔍 Fetching configuration for agent: {agent_id}")

        config_result = await config_loader.load(agent_id, campaign_id)

        log_config_fetch(
            logger,
            agent_id,
            config_result.success,
            config_result.source,
            config_result.duration_ms
        )

        if not config_result.success or not config_result.config:
            logger.error(f"❌ Failed to load config for agent {agent_id}")
            return

        config = config_result.config

        # Log configuration summary (redacted)
        logger.info(
            f"Configuration loaded: "
            f"llm={config.llm_provider}/{config.llm_model}, "
            f"tts={config.tts_provider}, "
            f"stt={config.stt_provider}",
            extra={"agent_id": agent_id, "config_source": config_result.source}
        )

        # ===================================================================
        # STEP 2: Initialize Components (STT/LLM/TTS)
        # ===================================================================
        logger.info("🛠️  Initializing voice pipeline components...")

        # Create LLM
        try:
            llm_spec = LLMFactory.create(
                provider=config.llm_provider,
                model=config.llm_model,
                api_key=config.llm_api_key,
                temperature=config.temperature
            )
            logger.info(f"✓ LLM initialized: {llm_spec}")
        except Exception as e:
            logger.error(f"Failed to initialize LLM: {e}")
            # Fallback to OpenAI
            llm_spec = "openai/gpt-4o-mini"
            logger.warning(f"Using fallback LLM: {llm_spec}")

        # Create TTS
        try:
            tts_spec = TTSFactory.create(
                provider=config.tts_provider,
                voice_id=config.voice_id or config.tts_voice_id,
                api_key=config.tts_api_key
            )
            logger.info(f"✓ TTS initialized: {tts_spec}")
        except Exception as e:
            logger.error(f"Failed to initialize TTS: {e}")
            # Fallback to Cartesia
            tts_spec = "cartesia/sonic-2:79a125e8-cd45-4c13-8a67-188112f4dd22"
            logger.warning(f"Using fallback TTS: {tts_spec}")

        # Create STT
        try:
            stt_spec = STTFactory.create(
                provider=config.stt_provider,
                language=config.stt_language,
                api_key=config.stt_api_key
            )
            logger.info(f"✓ STT initialized: {stt_spec}")
        except Exception as e:
            logger.error(f"Failed to initialize STT: {e}")
            # Fallback to AssemblyAI
            stt_spec = "assemblyai/universal-streaming:en"
            logger.warning(f"Using fallback STT: {stt_spec}")

        # ===================================================================
        # STEP 3: Connect to Room
        # ===================================================================
        await ctx.connect()
        logger.info("✓ Connected to room")

        log_call_start(logger, agent_id, room_name, call_type)

        # ===================================================================
        # STEP 4: Create Agent Session
        # ===================================================================
        logger.info("🎙️  Creating agent session...")

        session = AgentSession(
            # Speech-to-Text
            stt=stt_spec,

            # Large Language Model
            llm=llm_spec,

            # Text-to-Speech
            tts=tts_spec,

            # Voice Activity Detection
            vad=silero.VAD.load(),

            # Turn detection for natural conversation flow
            turn_detection=MultilingualModel(),
        )

        # Create dynamic agent with fetched configuration
        agent = DynamicVoiceAgent(config)

        # ===================================================================
        # STEP 5: Start Session
        # ===================================================================
        logger.info("🚀 Starting agent session...")

        await session.start(
            room=ctx.room,
            agent=agent
        )

        # ===================================================================
        # STEP 6: Handle Call Based on Type
        # ===================================================================
        if call_type == "inbound" or not phone_number:
            # Inbound call - greet the caller
            logger.info("📞 Inbound call - greeting caller")
            greeting = f"Hello! This is {config.name}. How can I help you today?"
            await session.generate_reply(greeting)
        else:
            # Outbound call - wait for user to speak
            logger.info(f"📞 Outbound call to {phone_number} - waiting for response")

        logger.info("✅ Agent session started successfully")

        # Session runs until call ends (handled by LiveKit)

    except Exception as e:
        duration_ms = int((time.time() - start_time) * 1000)
        log_error(
            logger,
            "❌ Fatal error in agent entrypoint",
            e,
            agent_id=agent_id,
            room_name=room_name,
            duration_ms=duration_ms
        )
        # Re-raise to trigger LiveKit retry mechanism
        raise

    finally:
        # Log call completion
        duration_ms = int((time.time() - start_time) * 1000)
        log_call_end(logger, agent_id or "unknown", room_name, duration_ms)


def print_banner():
    """Print startup banner"""
    banner = """
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║         🎙️  Core Voice Worker - Multi-Tenant AI Agent       ║
║                                                              ║
║  Single deployment. Infinite agents. Zero complexity.       ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
"""
    print(banner)
    print(f"Version: 1.0.0")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"LiveKit URL: {os.getenv('LIVEKIT_URL', 'NOT SET')}")
    print(f"Worker Name: {os.getenv('WORKER_NAME', 'core-voice-worker')}")
    print(f"Max Concurrency: {os.getenv('MAX_CONCURRENCY', '25')}")
    print(f"Cache TTL: {CACHE_TTL}s")
    print(f"Log Level: {LOG_LEVEL}")
    print("=" * 66)


async def shutdown_handler(sig):
    """Handle graceful shutdown"""
    logger.info(f"\n🛑 Received shutdown signal: {sig}")
    logger.info("Cleaning up...")

    # Close config loader
    await config_loader.close()

    # Print final metrics
    metrics = config_loader.get_metrics()
    logger.info("📊 Final Metrics:")
    logger.info(f"  Total requests: {metrics['total_requests']}")
    logger.info(f"  Cache hits: {metrics['cache_hits']} ({metrics['cache_hit_rate']:.1%})")
    logger.info(f"  API calls: {metrics['api_successes'] + metrics['api_failures']}")
    logger.info(f"  API success rate: {metrics['api_success_rate']:.1%}")

    logger.info("👋 Core worker stopped gracefully")


def main():
    """Main entry point"""
    print_banner()

    # Verify required environment variables
    required_vars = ["LIVEKIT_URL", "LIVEKIT_API_KEY", "LIVEKIT_API_SECRET"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]

    if missing_vars:
        logger.error(f"❌ ERROR: Missing required environment variables: {', '.join(missing_vars)}")
        logger.error("\nPlease set these variables in .env or .env.local file")
        logger.error("See .env.template for reference")
        sys.exit(1)

    logger.info("\n🚀 Starting Core Voice Worker...")
    logger.info("Press Ctrl+C to stop\n")

    # Set up signal handlers
    loop = asyncio.get_event_loop()
    for sig in (signal.SIGTERM, signal.SIGINT):
        loop.add_signal_handler(
            sig,
            lambda s=sig: asyncio.create_task(shutdown_handler(s))
        )

    try:
        # Run the worker
        agents.cli.run_app(
            agents.WorkerOptions(
                entrypoint_fnc=entrypoint,
                prewarm_fnc=prewarm_process,
                agent_name=os.getenv("WORKER_NAME", "core-voice-worker"),
                api_key=os.getenv("LIVEKIT_API_KEY"),
                api_secret=os.getenv("LIVEKIT_API_SECRET"),
                ws_url=os.getenv("LIVEKIT_URL"),
                max_retry=5,  # Retry connection up to 5 times
            )
        )
    except KeyboardInterrupt:
        logger.info("\n⚠️  Interrupted by user")
    except Exception as e:
        logger.error(f"\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
