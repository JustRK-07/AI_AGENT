# Core Voice Worker - Production Dockerfile
# Optimized for fast builds and small image size

# ===================================================================
# Stage 1: Builder
# ===================================================================
FROM python:3.11-slim as builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# ===================================================================
# Stage 2: Runtime
# ===================================================================
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy Python packages from builder
COPY --from=builder /root/.local /root/.local

# Make sure scripts in .local are usable
ENV PATH=/root/.local/bin:$PATH

# Copy application code
COPY . .

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

# Add health check endpoint (optional)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import sys; sys.exit(0)"

# Create non-root user (security best practice)
RUN useradd -m -u 1000 worker && \
    chown -R worker:worker /app

USER worker

# Expose port (if needed for health checks)
EXPOSE 8080

# Set entrypoint
ENTRYPOINT ["python", "-m", "core_voice_worker"]

# Default command (can be overridden)
CMD ["start"]

# ===================================================================
# Build Instructions:
# ===================================================================
# Build image:
#   docker build -t core-voice-worker:latest .
#
# Run locally:
#   docker run --env-file .env \
#     -p 8080:8080 \
#     core-voice-worker:latest
#
# Deploy to Google Cloud Run:
#   gcloud run deploy voice-agent-core-worker \
#     --source . \
#     --region us-central1 \
#     --min-instances 2 \
#     --max-instances 50 \
#     --concurrency 25
#
# ===================================================================
# Environment Variables Required:
# ===================================================================
# - LIVEKIT_URL
# - LIVEKIT_API_KEY
# - LIVEKIT_API_SECRET
# - BACKEND_URL
# - OPENAI_API_KEY (or other LLM provider keys)
# - CARTESIA_API_KEY (for TTS)
# - DEEPGRAM_API_KEY or ASSEMBLYAI_API_KEY (for STT)
#
# See .env.template for complete list
