"""
STT Factory - Creates STT instances based on provider

Supports: AssemblyAI, Deepgram, OpenAI Whisper
"""

import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class STTFactory:
    """Factory for creating STT (Speech-to-Text) instances"""

    # AssemblyAI models
    ASSEMBLYAI_MODELS = {
        "universal": "universal-streaming",
        "best": "best-streaming",
        "nano": "nano-streaming",
    }

    # Deepgram models
    DEEPGRAM_MODELS = {
        "nova-2": "nova-2",
        "nova": "nova",
        "enhanced": "enhanced",
        "base": "base",
    }

    # Whisper models (OpenAI)
    WHISPER_MODELS = {
        "whisper-1": "whisper-1",
    }

    @classmethod
    def create(
        cls,
        provider: str,
        model: Optional[str] = None,
        language: str = "en",
        api_key: Optional[str] = None,
        **kwargs
    ) -> str:
        """
        Create STT instance specification

        Args:
            provider: STT provider (assemblyai, deepgram, openai)
            model: Model name (provider-specific)
            language: Language code (e.g., 'en', 'es', 'fr')
            api_key: Optional API key
            **kwargs: Additional provider-specific options

        Returns:
            STT string in LiveKit format

        Raises:
            ValueError: If provider is unsupported
        """
        provider = provider.lower()

        if provider == "assemblyai":
            return cls._create_assemblyai(model, language, api_key, **kwargs)
        elif provider == "deepgram":
            return cls._create_deepgram(model, language, api_key, **kwargs)
        elif provider == "openai":
            return cls._create_openai(model, language, api_key, **kwargs)
        else:
            raise ValueError(
                f"Unsupported STT provider: {provider}. "
                f"Supported: assemblyai, deepgram, openai"
            )

    @classmethod
    def _create_assemblyai(
        cls,
        model: Optional[str],
        language: str,
        api_key: Optional[str],
        **kwargs
    ) -> str:
        """Create AssemblyAI STT"""
        # Set API key
        if api_key:
            os.environ["ASSEMBLYAI_API_KEY"] = api_key
        elif not os.getenv("ASSEMBLYAI_API_KEY"):
            logger.warning("No AssemblyAI API key provided")

        # Default model
        if not model:
            model = "universal"
            logger.info("No model provided, using default: universal")

        # Map to full model name
        full_model = cls.ASSEMBLYAI_MODELS.get(model, model)

        # AssemblyAI format: assemblyai/universal-streaming:en
        stt_str = f"assemblyai/{full_model}:{language}"
        logger.info(f"Created AssemblyAI STT: {stt_str}")
        return stt_str

    @classmethod
    def _create_deepgram(
        cls,
        model: Optional[str],
        language: str,
        api_key: Optional[str],
        **kwargs
    ) -> str:
        """Create Deepgram STT"""
        # Set API key
        if api_key:
            os.environ["DEEPGRAM_API_KEY"] = api_key
        elif not os.getenv("DEEPGRAM_API_KEY"):
            logger.warning("No Deepgram API key provided")

        # Default model
        if not model:
            model = "nova-2"
            logger.info("No model provided, using default: nova-2")

        # Validate model
        if model not in cls.DEEPGRAM_MODELS:
            logger.warning(
                f"Model {model} not in known Deepgram models. "
                f"Known models: {', '.join(cls.DEEPGRAM_MODELS.keys())}"
            )

        # Deepgram format: deepgram/nova-2:en-US
        # Convert simple language code to locale if needed
        locale = cls._to_locale(language)
        stt_str = f"deepgram/{model}:{locale}"
        logger.info(f"Created Deepgram STT: {stt_str}")
        return stt_str

    @classmethod
    def _create_openai(
        cls,
        model: Optional[str],
        language: str,
        api_key: Optional[str],
        **kwargs
    ) -> str:
        """Create OpenAI Whisper STT"""
        # Set API key
        if api_key:
            os.environ["OPENAI_API_KEY"] = api_key
        elif not os.getenv("OPENAI_API_KEY"):
            logger.warning("No OpenAI API key provided")

        # Whisper only has one model
        model = "whisper-1"

        # OpenAI Whisper format: openai/whisper-1:en
        stt_str = f"openai/{model}:{language}"
        logger.info(f"Created OpenAI Whisper STT: {stt_str}")
        return stt_str

    @classmethod
    def _to_locale(cls, language: str) -> str:
        """
        Convert simple language code to locale

        Args:
            language: Simple language code (e.g., 'en', 'es')

        Returns:
            Locale string (e.g., 'en-US', 'es-ES')
        """
        locale_map = {
            "en": "en-US",
            "es": "es-ES",
            "fr": "fr-FR",
            "de": "de-DE",
            "it": "it-IT",
            "pt": "pt-BR",
            "nl": "nl-NL",
            "pl": "pl-PL",
            "ru": "ru-RU",
            "ja": "ja-JP",
            "ko": "ko-KR",
            "zh": "zh-CN",
            "ar": "ar-SA",
            "hi": "hi-IN",
        }

        # If already a locale (contains -), return as-is
        if "-" in language:
            return language

        # Map to locale or default to US variant
        return locale_map.get(language.lower(), f"{language}-US")

    @classmethod
    def get_supported_providers(cls) -> list[str]:
        """Get list of supported providers"""
        return ["assemblyai", "deepgram", "openai"]

    @classmethod
    def get_supported_models(cls, provider: str) -> list[str]:
        """
        Get list of supported models for a provider

        Args:
            provider: Provider name

        Returns:
            List of model names
        """
        provider = provider.lower()

        if provider == "assemblyai":
            return list(cls.ASSEMBLYAI_MODELS.keys())
        elif provider == "deepgram":
            return list(cls.DEEPGRAM_MODELS.keys())
        elif provider == "openai":
            return list(cls.WHISPER_MODELS.keys())
        else:
            return []

    @classmethod
    def get_supported_languages(cls) -> list[str]:
        """Get list of commonly supported languages"""
        return [
            "en",  # English
            "es",  # Spanish
            "fr",  # French
            "de",  # German
            "it",  # Italian
            "pt",  # Portuguese
            "nl",  # Dutch
            "pl",  # Polish
            "ru",  # Russian
            "ja",  # Japanese
            "ko",  # Korean
            "zh",  # Chinese
            "ar",  # Arabic
            "hi",  # Hindi
        ]
