"""
Agent Configuration Loader

Fetches agent configurations from backend API with intelligent caching
"""

import asyncio
import time
import logging
from typing import Optional, Dict
import aiohttp
from .config_models import AgentConfig, CachedConfig, ConfigFetchResult


logger = logging.getLogger(__name__)


class AgentConfigLoader:
    """
    Loads agent configurations from backend API with caching

    Features:
    - 5-minute TTL cache to reduce database load
    - Async HTTP client with connection pooling
    - Fallback to stale cache on API failure
    - Fallback to default config if no cache available
    - Detailed logging and metrics
    """

    def __init__(
        self,
        backend_url: str,
        cache_ttl: int = 300,  # 5 minutes
        max_cache_size: int = 1000,
        request_timeout: int = 5
    ):
        """
        Initialize config loader

        Args:
            backend_url: Backend API base URL (e.g., http://localhost:3000)
            cache_ttl: Cache time-to-live in seconds (default: 300 = 5 min)
            max_cache_size: Maximum number of cached configs
            request_timeout: HTTP request timeout in seconds
        """
        self.backend_url = backend_url.rstrip('/')
        self.cache_ttl = cache_ttl
        self.max_cache_size = max_cache_size
        self.request_timeout = request_timeout

        # In-memory cache
        self._cache: Dict[str, CachedConfig] = {}

        # HTTP session (connection pooling)
        self._session: Optional[aiohttp.ClientSession] = None

        # Metrics
        self._metrics = {
            "total_requests": 0,
            "cache_hits": 0,
            "cache_misses": 0,
            "api_successes": 0,
            "api_failures": 0,
            "fallback_to_stale": 0,
            "fallback_to_default": 0
        }

        logger.info(f"AgentConfigLoader initialized: backend={backend_url}, cache_ttl={cache_ttl}s")

    async def _ensure_session(self):
        """Ensure HTTP session exists"""
        if self._session is None or self._session.closed:
            timeout = aiohttp.ClientTimeout(total=self.request_timeout)
            self._session = aiohttp.ClientSession(timeout=timeout)

    async def close(self):
        """Close HTTP session"""
        if self._session and not self._session.closed:
            await self._session.close()

    def _make_cache_key(self, agent_id: str, campaign_id: Optional[str] = None) -> str:
        """Generate cache key"""
        if campaign_id:
            return f"{agent_id}:{campaign_id}"
        return agent_id

    def _get_from_cache(self, cache_key: str, ignore_ttl: bool = False) -> Optional[AgentConfig]:
        """
        Get config from cache

        Args:
            cache_key: Cache key
            ignore_ttl: If True, return even expired cache entries

        Returns:
            Cached config if found and valid, None otherwise
        """
        if cache_key not in self._cache:
            return None

        cached = self._cache[cache_key]
        current_time = time.time()

        if not ignore_ttl and cached.is_expired(current_time):
            logger.debug(f"Cache entry expired for {cache_key} (age: {cached.age_seconds(current_time):.1f}s)")
            return None

        logger.debug(f"Cache hit for {cache_key} (age: {cached.age_seconds(current_time):.1f}s)")
        return cached.config

    def _put_in_cache(self, cache_key: str, config: AgentConfig):
        """
        Store config in cache

        Args:
            cache_key: Cache key
            config: Agent configuration to cache
        """
        # Evict oldest entries if cache is full
        if len(self._cache) >= self.max_cache_size:
            # Simple LRU: remove oldest entry
            oldest_key = min(self._cache.keys(), key=lambda k: self._cache[k].cached_at)
            del self._cache[oldest_key]
            logger.debug(f"Cache full, evicted {oldest_key}")

        # Store new entry
        self._cache[cache_key] = CachedConfig(
            config=config,
            cached_at=time.time(),
            cache_key=cache_key,
            ttl=self.cache_ttl
        )
        logger.debug(f"Cached config for {cache_key}")

    async def _fetch_from_api(
        self,
        agent_id: str,
        campaign_id: Optional[str] = None
    ) -> Optional[AgentConfig]:
        """
        Fetch config from backend API

        Args:
            agent_id: Agent ID
            campaign_id: Optional campaign ID for campaign-specific overrides

        Returns:
            AgentConfig if successful, None otherwise
        """
        await self._ensure_session()

        # Build URL
        url = f"{self.backend_url}/api/v1/agents/{agent_id}/runtime-config"
        params = {}
        if campaign_id:
            params["campaignId"] = campaign_id

        try:
            logger.debug(f"Fetching config from API: {url}")
            async with self._session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()

                    if not data.get("success"):
                        logger.warning(f"API returned success=false for agent {agent_id}")
                        return None

                    config_data = data.get("config")
                    if not config_data:
                        logger.warning(f"API returned no config for agent {agent_id}")
                        return None

                    # Parse into Pydantic model
                    config = AgentConfig(**config_data)
                    logger.info(f"Successfully fetched config for agent {agent_id}")
                    return config

                elif response.status == 404:
                    logger.warning(f"Agent {agent_id} not found (404)")
                    return None

                else:
                    text = await response.text()
                    logger.error(f"API error ({response.status}): {text}")
                    return None

        except asyncio.TimeoutError:
            logger.error(f"API request timeout for agent {agent_id}")
            return None
        except aiohttp.ClientError as e:
            logger.error(f"API client error for agent {agent_id}: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error fetching config for agent {agent_id}: {e}")
            return None

    async def load(
        self,
        agent_id: str,
        campaign_id: Optional[str] = None
    ) -> ConfigFetchResult:
        """
        Load agent configuration with fallback strategy

        Fallback order:
        1. Try cache (if fresh)
        2. Try API
        3. Use stale cache if API fails
        4. Use default config

        Args:
            agent_id: Agent ID
            campaign_id: Optional campaign ID

        Returns:
            ConfigFetchResult with config and metadata
        """
        start_time = time.time()
        self._metrics["total_requests"] += 1

        cache_key = self._make_cache_key(agent_id, campaign_id)

        # Step 1: Check cache (fresh entries only)
        cached_config = self._get_from_cache(cache_key, ignore_ttl=False)
        if cached_config:
            self._metrics["cache_hits"] += 1
            duration_ms = int((time.time() - start_time) * 1000)
            logger.info(f"Cache hit for {agent_id} (age: fresh, duration: {duration_ms}ms)")
            return ConfigFetchResult.success_from_cache(cached_config, duration_ms)

        self._metrics["cache_misses"] += 1

        # Step 2: Fetch from API
        logger.info(f"Cache miss for {agent_id}, fetching from API...")
        api_config = await self._fetch_from_api(agent_id, campaign_id)

        if api_config:
            # Success! Cache it and return
            self._put_in_cache(cache_key, api_config)
            self._metrics["api_successes"] += 1
            duration_ms = int((time.time() - start_time) * 1000)
            logger.info(f"API fetch successful for {agent_id} (duration: {duration_ms}ms)")
            return ConfigFetchResult.success_from_api(api_config, duration_ms)

        # API failed...
        self._metrics["api_failures"] += 1

        # Step 3: Try stale cache
        stale_config = self._get_from_cache(cache_key, ignore_ttl=True)
        if stale_config:
            self._metrics["fallback_to_stale"] += 1
            duration_ms = int((time.time() - start_time) * 1000)
            logger.warning(f"API failed for {agent_id}, using stale cache (duration: {duration_ms}ms)")
            return ConfigFetchResult.success_from_cache(stale_config, duration_ms)

        # Step 4: Fallback to default config
        self._metrics["fallback_to_default"] += 1
        duration_ms = int((time.time() - start_time) * 1000)
        default_config = AgentConfig.default()
        logger.error(f"No config available for {agent_id}, using default (duration: {duration_ms}ms)")
        return ConfigFetchResult.success_from_default(default_config, duration_ms)

    async def preload(self, agent_ids: list[str]):
        """
        Preload configurations for multiple agents

        Useful for warming up cache during worker startup

        Args:
            agent_ids: List of agent IDs to preload
        """
        logger.info(f"Preloading {len(agent_ids)} agent configs...")

        tasks = [self.load(agent_id) for agent_id in agent_ids]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        success_count = sum(1 for r in results if isinstance(r, ConfigFetchResult) and r.success)
        logger.info(f"Preloaded {success_count}/{len(agent_ids)} configs successfully")

    def get_metrics(self) -> Dict:
        """
        Get loader metrics

        Returns:
            Dictionary of metrics
        """
        metrics = self._metrics.copy()

        # Calculate cache hit rate
        total_cache_checks = metrics["cache_hits"] + metrics["cache_misses"]
        if total_cache_checks > 0:
            metrics["cache_hit_rate"] = metrics["cache_hits"] / total_cache_checks
        else:
            metrics["cache_hit_rate"] = 0.0

        # Calculate API success rate
        total_api_calls = metrics["api_successes"] + metrics["api_failures"]
        if total_api_calls > 0:
            metrics["api_success_rate"] = metrics["api_successes"] / total_api_calls
        else:
            metrics["api_success_rate"] = 0.0

        metrics["cache_size"] = len(self._cache)

        return metrics

    def clear_cache(self):
        """Clear all cached configs"""
        self._cache.clear()
        logger.info("Cache cleared")

    def clear_agent_cache(self, agent_id: str):
        """
        Clear cache for specific agent

        Args:
            agent_id: Agent ID to clear
        """
        keys_to_remove = [k for k in self._cache.keys() if k.startswith(agent_id)]
        for key in keys_to_remove:
            del self._cache[key]
        logger.info(f"Cleared cache for agent {agent_id} ({len(keys_to_remove)} entries)")
