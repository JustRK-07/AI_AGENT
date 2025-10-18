"""
TTS Factory - Creates TTS instances based on provider

Supports: Cartesia, OpenAI TTS, ElevenLabs, Deepgram Aura
"""

import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class TTSFactory:
    """Factory for creating TTS instances"""

    # Cartesia Sonic 2 voices
    CARTESIA_VOICES = {
        "echo": "79a125e8-cd45-4c13-8a67-188112f4dd22",
        "alloy": "bf991597-6c13-47e4-8411-91ec2de5c466",
        "shimmer": "69a82b6f-d26a-491e-9e00-bfb9250eea12",
        "barbershop-man": "a0e99841-438c-4a64-b679-ae501e7d6091",
        "friendly-reading-man": "f114a467-c40a-4db8-964d-aaba89cd08fa",
        "professional-woman": "77a36f9e-0246-45f5-8a3f-1e7e7e3d4b49",
    }

    # OpenAI TTS voices
    OPENAI_VOICES = {
        "alloy": "alloy",
        "echo": "echo",
        "fable": "fable",
        "onyx": "onyx",
        "nova": "nova",
        "shimmer": "shimmer",
    }

    # Deepgram Aura voices
    DEEPGRAM_VOICES = {
        "aura-asteria-en": "aura-asteria-en",
        "aura-luna-en": "aura-luna-en",
        "aura-stella-en": "aura-stella-en",
        "aura-athena-en": "aura-athena-en",
        "aura-hera-en": "aura-hera-en",
        "aura-orion-en": "aura-orion-en",
        "aura-arcas-en": "aura-arcas-en",
        "aura-perseus-en": "aura-perseus-en",
        "aura-angus-en": "aura-angus-en",
        "aura-orpheus-en": "aura-orpheus-en",
    }

    @classmethod
    def create(
        cls,
        provider: str,
        voice_id: Optional[str] = None,
        api_key: Optional[str] = None,
        **kwargs
    ) -> str:
        """
        Create TTS instance specification

        Args:
            provider: TTS provider (cartesia, openai, elevenlabs, deepgram)
            voice_id: Voice identifier (provider-specific)
            api_key: Optional API key
            **kwargs: Additional provider-specific options

        Returns:
            TTS string in LiveKit format

        Raises:
            ValueError: If provider is unsupported
        """
        provider = provider.lower()

        if provider == "cartesia":
            return cls._create_cartesia(voice_id, api_key, **kwargs)
        elif provider == "openai":
            return cls._create_openai(voice_id, api_key, **kwargs)
        elif provider == "elevenlabs":
            return cls._create_elevenlabs(voice_id, api_key, **kwargs)
        elif provider == "deepgram":
            return cls._create_deepgram(voice_id, api_key, **kwargs)
        else:
            raise ValueError(
                f"Unsupported TTS provider: {provider}. "
                f"Supported: cartesia, openai, elevenlabs, deepgram"
            )

    @classmethod
    def _create_cartesia(
        cls,
        voice_id: Optional[str],
        api_key: Optional[str],
        **kwargs
    ) -> str:
        """Create Cartesia Sonic 2 TTS"""
        # Set API key
        if api_key:
            os.environ["CARTESIA_API_KEY"] = api_key
        elif not os.getenv("CARTESIA_API_KEY"):
            logger.warning("No Cartesia API key provided")

        # Default voice if not specified
        if not voice_id:
            voice_id = "echo"
            logger.info("No voice_id provided, using default: echo")

        # Map friendly name to UUID if needed
        voice_uuid = cls.CARTESIA_VOICES.get(voice_id, voice_id)

        tts_str = f"cartesia/sonic-2:{voice_uuid}"
        logger.info(f"Created Cartesia TTS: {tts_str}")
        return tts_str

    @classmethod
    def _create_openai(
        cls,
        voice_id: Optional[str],
        api_key: Optional[str],
        **kwargs
    ) -> str:
        """Create OpenAI TTS"""
        # Set API key
        if api_key:
            os.environ["OPENAI_API_KEY"] = api_key
        elif not os.getenv("OPENAI_API_KEY"):
            logger.warning("No OpenAI API key provided")

        # Default voice
        if not voice_id:
            voice_id = "alloy"
            logger.info("No voice_id provided, using default: alloy")

        # Validate voice
        if voice_id not in cls.OPENAI_VOICES:
            logger.warning(
                f"Voice {voice_id} not in known OpenAI voices. "
                f"Known voices: {', '.join(cls.OPENAI_VOICES.keys())}"
            )

        tts_str = f"openai/tts-1:{voice_id}"
        logger.info(f"Created OpenAI TTS: {tts_str}")
        return tts_str

    @classmethod
    def _create_elevenlabs(
        cls,
        voice_id: Optional[str],
        api_key: Optional[str],
        **kwargs
    ) -> str:
        """Create ElevenLabs TTS"""
        # Set API key
        if api_key:
            os.environ["ELEVEN_API_KEY"] = api_key
        elif not os.getenv("ELEVEN_API_KEY"):
            logger.warning("No ElevenLabs API key provided")

        # ElevenLabs requires specific voice IDs from their platform
        if not voice_id:
            # Default to a common voice ID (user should override)
            voice_id = "21m00Tcm4TlvDq8ikWAM"  # Rachel (default)
            logger.info("No voice_id provided, using default ElevenLabs voice")

        tts_str = f"elevenlabs:{voice_id}"
        logger.info(f"Created ElevenLabs TTS: {tts_str}")
        return tts_str

    @classmethod
    def _create_deepgram(
        cls,
        voice_id: Optional[str],
        api_key: Optional[str],
        **kwargs
    ) -> str:
        """Create Deepgram Aura TTS"""
        # Set API key
        if api_key:
            os.environ["DEEPGRAM_API_KEY"] = api_key
        elif not os.getenv("DEEPGRAM_API_KEY"):
            logger.warning("No Deepgram API key provided")

        # Default voice
        if not voice_id:
            voice_id = "aura-asteria-en"
            logger.info("No voice_id provided, using default: aura-asteria-en")

        # Validate voice
        if voice_id not in cls.DEEPGRAM_VOICES:
            logger.warning(
                f"Voice {voice_id} not in known Deepgram voices. "
                f"Known voices: {', '.join(cls.DEEPGRAM_VOICES.keys())}"
            )

        tts_str = f"deepgram/{voice_id}"
        logger.info(f"Created Deepgram TTS: {tts_str}")
        return tts_str

    @classmethod
    def get_supported_providers(cls) -> list[str]:
        """Get list of supported providers"""
        return ["cartesia", "openai", "elevenlabs", "deepgram"]

    @classmethod
    def get_supported_voices(cls, provider: str) -> list[str]:
        """
        Get list of supported voices for a provider

        Args:
            provider: Provider name

        Returns:
            List of voice identifiers
        """
        provider = provider.lower()

        if provider == "cartesia":
            return list(cls.CARTESIA_VOICES.keys())
        elif provider == "openai":
            return list(cls.OPENAI_VOICES.keys())
        elif provider == "deepgram":
            return list(cls.DEEPGRAM_VOICES.keys())
        elif provider == "elevenlabs":
            return ["custom"]  # ElevenLabs uses custom voice IDs
        else:
            return []
