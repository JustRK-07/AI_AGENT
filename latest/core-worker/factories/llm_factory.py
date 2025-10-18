"""
LLM Factory - Creates LLM instances based on provider

Supports: OpenAI, Cerebras, Groq, Google, Amazon Bedrock
"""

import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class LLMFactory:
    """Factory for creating LLM instances"""

    # Provider-specific model mappings
    OPENAI_MODELS = {
        "gpt-4o": "gpt-4o",
        "gpt-4o-mini": "gpt-4o-mini",
        "gpt-4-turbo": "gpt-4-turbo",
        "gpt-4": "gpt-4",
        "gpt-3.5-turbo": "gpt-3.5-turbo",
    }

    CEREBRAS_MODELS = {
        "llama3.1-8b": "llama3.1-8b",
        "llama3.1-70b": "llama3.1-70b",
    }

    GROQ_MODELS = {
        "mixtral-8x7b": "mixtral-8x7b-32768",
        "llama-3.1-70b": "llama-3.1-70b-versatile",
        "llama-3.1-8b": "llama-3.1-8b-instant",
    }

    GOOGLE_MODELS = {
        "gemini-1.5-pro": "gemini-1.5-pro",
        "gemini-1.5-flash": "gemini-1.5-flash",
        "gemini-pro": "gemini-pro",
    }

    AMAZON_MODELS = {
        "claude-3-5-sonnet": "anthropic.claude-3-5-sonnet-20241022-v2:0",
        "claude-3-sonnet": "anthropic.claude-3-sonnet-20240229-v1:0",
        "claude-3-haiku": "anthropic.claude-3-haiku-20240307-v1:0",
    }

    @classmethod
    def create(
        cls,
        provider: str,
        model: str,
        api_key: Optional[str] = None,
        temperature: float = 0.7,
        **kwargs
    ) -> str:
        """
        Create LLM instance specification

        Args:
            provider: LLM provider (openai, cerebras, groq, google, amazon)
            model: Model name
            api_key: Optional API key (if None, uses environment variable)
            temperature: LLM temperature (0.0-2.0)
            **kwargs: Additional provider-specific options

        Returns:
            Model string in LiveKit format (e.g., "openai/gpt-4o-mini")

        Raises:
            ValueError: If provider or model is unsupported
        """
        provider = provider.lower()

        # Validate and get model string
        if provider == "openai":
            return cls._create_openai(model, api_key, temperature, **kwargs)
        elif provider == "cerebras":
            return cls._create_cerebras(model, api_key, temperature, **kwargs)
        elif provider == "groq":
            return cls._create_groq(model, api_key, temperature, **kwargs)
        elif provider == "google":
            return cls._create_google(model, api_key, temperature, **kwargs)
        elif provider == "amazon":
            return cls._create_amazon(model, api_key, temperature, **kwargs)
        else:
            raise ValueError(
                f"Unsupported LLM provider: {provider}. "
                f"Supported: openai, cerebras, groq, google, amazon"
            )

    @classmethod
    def _create_openai(
        cls,
        model: str,
        api_key: Optional[str],
        temperature: float,
        **kwargs
    ) -> str:
        """Create OpenAI LLM"""
        # Set API key if provided
        if api_key:
            os.environ["OPENAI_API_KEY"] = api_key
        elif not os.getenv("OPENAI_API_KEY"):
            logger.warning("No OpenAI API key provided, will use environment variable")

        # Validate model
        if model not in cls.OPENAI_MODELS:
            logger.warning(
                f"Model {model} not in known OpenAI models, using as-is. "
                f"Known models: {', '.join(cls.OPENAI_MODELS.keys())}"
            )

        model_str = f"openai/{model}"
        logger.info(f"Created OpenAI LLM: {model_str} (temp={temperature})")
        return model_str

    @classmethod
    def _create_cerebras(
        cls,
        model: str,
        api_key: Optional[str],
        temperature: float,
        **kwargs
    ) -> str:
        """Create Cerebras LLM"""
        # Set API key
        if api_key:
            os.environ["CEREBRAS_API_KEY"] = api_key
        elif not os.getenv("CEREBRAS_API_KEY"):
            logger.warning("No Cerebras API key provided")

        # Validate model
        if model not in cls.CEREBRAS_MODELS:
            logger.warning(
                f"Model {model} not in known Cerebras models. "
                f"Known models: {', '.join(cls.CEREBRAS_MODELS.keys())}"
            )

        model_str = f"cerebras/{model}"
        logger.info(f"Created Cerebras LLM: {model_str} (temp={temperature})")
        return model_str

    @classmethod
    def _create_groq(
        cls,
        model: str,
        api_key: Optional[str],
        temperature: float,
        **kwargs
    ) -> str:
        """Create Groq LLM"""
        # Set API key
        if api_key:
            os.environ["GROQ_API_KEY"] = api_key
        elif not os.getenv("GROQ_API_KEY"):
            logger.warning("No Groq API key provided")

        # Map to full model name if needed
        full_model = cls.GROQ_MODELS.get(model, model)

        model_str = f"groq/{full_model}"
        logger.info(f"Created Groq LLM: {model_str} (temp={temperature})")
        return model_str

    @classmethod
    def _create_google(
        cls,
        model: str,
        api_key: Optional[str],
        temperature: float,
        **kwargs
    ) -> str:
        """Create Google Gemini LLM"""
        # Set API key
        if api_key:
            os.environ["GOOGLE_API_KEY"] = api_key
        elif not os.getenv("GOOGLE_API_KEY"):
            logger.warning("No Google API key provided")

        # Validate model
        if model not in cls.GOOGLE_MODELS:
            logger.warning(
                f"Model {model} not in known Google models. "
                f"Known models: {', '.join(cls.GOOGLE_MODELS.keys())}"
            )

        model_str = f"google/{model}"
        logger.info(f"Created Google LLM: {model_str} (temp={temperature})")
        return model_str

    @classmethod
    def _create_amazon(
        cls,
        model: str,
        api_key: Optional[str],
        temperature: float,
        **kwargs
    ) -> str:
        """Create Amazon Bedrock LLM"""
        # For Bedrock, typically uses AWS credentials, not API key
        # But we'll support it for consistency

        # Map to full model ID
        full_model = cls.AMAZON_MODELS.get(model, model)

        model_str = f"amazon/{full_model}"
        logger.info(f"Created Amazon Bedrock LLM: {model_str} (temp={temperature})")
        return model_str

    @classmethod
    def get_supported_providers(cls) -> list[str]:
        """Get list of supported providers"""
        return ["openai", "cerebras", "groq", "google", "amazon"]

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

        if provider == "openai":
            return list(cls.OPENAI_MODELS.keys())
        elif provider == "cerebras":
            return list(cls.CEREBRAS_MODELS.keys())
        elif provider == "groq":
            return list(cls.GROQ_MODELS.keys())
        elif provider == "google":
            return list(cls.GOOGLE_MODELS.keys())
        elif provider == "amazon":
            return list(cls.AMAZON_MODELS.keys())
        else:
            return []
