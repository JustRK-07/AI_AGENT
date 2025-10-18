"""
Configuration models for Core Voice Worker

Pydantic models for type-safe configuration management
"""

from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, validator
from datetime import datetime


class AgentConfig(BaseModel):
    """
    Complete agent runtime configuration

    This model represents all configuration needed to run an agent session.
    Values are loaded from the database API at runtime.
    """

    # Agent Identity
    agent_id: str = Field(..., description="Unique agent identifier")
    name: str = Field(..., description="Agent display name")
    livekit_agent_name: str = Field(default="core-voice-worker", description="LiveKit worker registration name")

    # AI Configuration
    system_prompt: str = Field(..., description="System prompt / instructions for the agent")
    personality: Optional[str] = Field(None, description="Agent personality traits")
    voice_id: str = Field(default="default", description="TTS voice identifier")

    # LLM Configuration
    llm_provider: str = Field(default="openai", description="LLM provider (openai, cerebras, groq, google, amazon)")
    llm_model: str = Field(default="gpt-4o-mini", description="Specific model name")
    llm_api_key: Optional[str] = Field(None, description="Agent-specific LLM API key (falls back to env)")
    temperature: float = Field(default=0.7, ge=0.0, le=2.0, description="LLM temperature")

    # TTS Configuration
    tts_provider: str = Field(default="cartesia", description="TTS provider")
    tts_voice_id: Optional[str] = Field(None, description="Specific TTS voice ID")
    tts_api_key: Optional[str] = Field(None, description="Agent-specific TTS API key")

    # STT Configuration
    stt_provider: str = Field(default="assemblyai", description="STT provider")
    stt_language: str = Field(default="en", description="STT language code")
    stt_api_key: Optional[str] = Field(None, description="Agent-specific STT API key")

    # LiveKit Configuration (optional overrides)
    livekit_url: Optional[str] = Field(None, description="Agent-specific LiveKit URL")
    livekit_api_key: Optional[str] = Field(None, description="Agent-specific LiveKit API key")
    livekit_api_secret: Optional[str] = Field(None, description="Agent-specific LiveKit secret")

    # Performance Settings
    max_concurrent_calls: int = Field(default=3, description="Max concurrent calls for this agent")

    # Metadata
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional configuration data")

    @validator('llm_provider')
    def validate_llm_provider(cls, v):
        """Validate LLM provider is supported"""
        valid_providers = ['openai', 'cerebras', 'groq', 'google', 'amazon']
        if v.lower() not in valid_providers:
            raise ValueError(f"LLM provider must be one of: {', '.join(valid_providers)}")
        return v.lower()

    @validator('tts_provider')
    def validate_tts_provider(cls, v):
        """Validate TTS provider is supported"""
        valid_providers = ['cartesia', 'openai', 'elevenlabs', 'deepgram']
        if v.lower() not in valid_providers:
            raise ValueError(f"TTS provider must be one of: {', '.join(valid_providers)}")
        return v.lower()

    @validator('stt_provider')
    def validate_stt_provider(cls, v):
        """Validate STT provider is supported"""
        valid_providers = ['assemblyai', 'deepgram', 'openai']
        if v.lower() not in valid_providers:
            raise ValueError(f"STT provider must be one of: {', '.join(valid_providers)}")
        return v.lower()

    @classmethod
    def default(cls) -> "AgentConfig":
        """
        Return default configuration as fallback

        Used when API is unavailable or agent not found
        """
        return cls(
            agent_id="default",
            name="Default Agent",
            livekit_agent_name="core-voice-worker",
            system_prompt="You are a helpful AI assistant. Please assist the caller with their questions.",
            personality="Professional and friendly",
            voice_id="default",
            llm_provider="openai",
            llm_model="gpt-4o-mini",
            temperature=0.7,
            tts_provider="cartesia",
            stt_provider="assemblyai",
            max_concurrent_calls=3
        )

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for logging/debugging"""
        data = self.dict()
        # Redact sensitive fields
        for key in ['llm_api_key', 'tts_api_key', 'stt_api_key', 'livekit_api_key', 'livekit_api_secret']:
            if key in data and data[key]:
                data[key] = '***REDACTED***'
        return data


class RuntimeConfig(BaseModel):
    """
    Runtime metadata for a specific call/session

    This includes information specific to the current call that isn't
    part of the agent's base configuration.
    """

    # Call Information
    room_name: str = Field(..., description="LiveKit room name")
    call_type: str = Field(..., description="Call type: inbound or outbound")

    # Agent & Campaign
    agent_id: str = Field(..., description="Agent handling this call")
    campaign_id: Optional[str] = Field(None, description="Campaign ID if applicable")
    lead_id: Optional[str] = Field(None, description="Lead ID for outbound calls")

    # Contact Information
    phone_number: Optional[str] = Field(None, description="Caller/callee phone number")

    # Timing
    created_at: datetime = Field(default_factory=datetime.utcnow, description="When call was initiated")

    # Additional Context
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional call context")

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class CachedConfig(BaseModel):
    """
    Cached configuration entry

    Wraps AgentConfig with caching metadata
    """
    config: AgentConfig = Field(..., description="The agent configuration")
    cached_at: float = Field(..., description="Unix timestamp when cached")
    cache_key: str = Field(..., description="Cache key")
    ttl: int = Field(default=300, description="Time-to-live in seconds")

    def is_expired(self, current_time: float) -> bool:
        """Check if cache entry has expired"""
        return (current_time - self.cached_at) > self.ttl

    def age_seconds(self, current_time: float) -> float:
        """Get age of cache entry in seconds"""
        return current_time - self.cached_at


class ConfigFetchResult(BaseModel):
    """
    Result of a configuration fetch operation

    Tracks success/failure and provides metadata
    """
    success: bool = Field(..., description="Whether fetch was successful")
    config: Optional[AgentConfig] = Field(None, description="The fetched configuration")
    error: Optional[str] = Field(None, description="Error message if failed")
    source: str = Field(..., description="Source: api, cache, or default")
    duration_ms: int = Field(..., description="How long the fetch took in milliseconds")
    cache_hit: bool = Field(default=False, description="Whether this was a cache hit")

    @classmethod
    def success_from_api(cls, config: AgentConfig, duration_ms: int) -> "ConfigFetchResult":
        """Create successful result from API fetch"""
        return cls(
            success=True,
            config=config,
            source="api",
            duration_ms=duration_ms,
            cache_hit=False
        )

    @classmethod
    def success_from_cache(cls, config: AgentConfig, duration_ms: int) -> "ConfigFetchResult":
        """Create successful result from cache"""
        return cls(
            success=True,
            config=config,
            source="cache",
            duration_ms=duration_ms,
            cache_hit=True
        )

    @classmethod
    def success_from_default(cls, config: AgentConfig, duration_ms: int) -> "ConfigFetchResult":
        """Create successful result using default config"""
        return cls(
            success=True,
            config=config,
            source="default",
            duration_ms=duration_ms,
            cache_hit=False
        )

    @classmethod
    def failure(cls, error: str, duration_ms: int, fallback_config: Optional[AgentConfig] = None) -> "ConfigFetchResult":
        """Create failed result"""
        return cls(
            success=False,
            config=fallback_config,
            error=error,
            source="default" if fallback_config else "none",
            duration_ms=duration_ms,
            cache_hit=False
        )
