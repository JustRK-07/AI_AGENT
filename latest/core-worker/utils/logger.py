"""
Structured logging utility for Core Voice Worker

Provides consistent, structured logging across all components
"""

import logging
import sys
import json
from datetime import datetime
from typing import Any, Dict, Optional


class StructuredFormatter(logging.Formatter):
    """
    Structured JSON formatter for logs

    Outputs logs as JSON for easy parsing by monitoring tools
    """

    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON"""
        log_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Add extra fields if present
        if hasattr(record, "agent_id"):
            log_data["agent_id"] = record.agent_id
        if hasattr(record, "campaign_id"):
            log_data["campaign_id"] = record.campaign_id
        if hasattr(record, "room_name"):
            log_data["room_name"] = record.room_name
        if hasattr(record, "duration_ms"):
            log_data["duration_ms"] = record.duration_ms

        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_data)


class ColoredFormatter(logging.Formatter):
    """
    Colored console formatter for local development

    Makes logs easier to read during development
    """

    # ANSI color codes
    COLORS = {
        "DEBUG": "\033[36m",      # Cyan
        "INFO": "\033[32m",       # Green
        "WARNING": "\033[33m",    # Yellow
        "ERROR": "\033[31m",      # Red
        "CRITICAL": "\033[35m",   # Magenta
    }
    RESET = "\033[0m"
    BOLD = "\033[1m"

    def format(self, record: logging.LogRecord) -> str:
        """Format log record with colors"""
        # Get color for level
        color = self.COLORS.get(record.levelname, "")

        # Format timestamp
        timestamp = datetime.fromtimestamp(record.created).strftime("%H:%M:%S")

        # Format level
        level = f"{color}{record.levelname:8s}{self.RESET}"

        # Format logger name (shortened)
        logger_name = record.name.split(".")[-1][:15]

        # Build message
        message = record.getMessage()

        # Add extra context if present
        extras = []
        if hasattr(record, "agent_id"):
            extras.append(f"agent={record.agent_id[:8]}")
        if hasattr(record, "room_name"):
            extras.append(f"room={record.room_name[:20]}")
        if hasattr(record, "duration_ms"):
            extras.append(f"{record.duration_ms}ms")

        extra_str = f" [{', '.join(extras)}]" if extras else ""

        # Combine
        log_line = f"{timestamp} {level} {logger_name:15s} | {message}{extra_str}"

        # Add exception if present
        if record.exc_info:
            log_line += "\n" + self.formatException(record.exc_info)

        return log_line


def setup_logger(
    name: str = "core-worker",
    level: str = "INFO",
    format_type: str = "colored",  # "colored" or "json"
) -> logging.Logger:
    """
    Set up logger with appropriate formatter

    Args:
        name: Logger name
        level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        format_type: Format type ("colored" for dev, "json" for production)

    Returns:
        Configured logger
    """
    logger = logging.getLogger(name)

    # Clear existing handlers
    logger.handlers.clear()

    # Set level
    log_level = getattr(logging, level.upper(), logging.INFO)
    logger.setLevel(log_level)

    # Create console handler
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(log_level)

    # Set formatter
    if format_type == "json":
        formatter = StructuredFormatter()
    else:
        formatter = ColoredFormatter()

    handler.setFormatter(formatter)
    logger.addHandler(handler)

    # Prevent propagation to root logger
    logger.propagate = False

    return logger


def get_logger(name: str) -> logging.Logger:
    """
    Get logger by name

    Args:
        name: Logger name

    Returns:
        Logger instance
    """
    return logging.getLogger(name)


class LogContext:
    """
    Context manager for adding extra fields to logs

    Usage:
        with LogContext(logger, agent_id="abc123", room_name="room-xyz"):
            logger.info("Processing call")
            # Log will include agent_id and room_name
    """

    def __init__(self, logger: logging.Logger, **kwargs):
        self.logger = logger
        self.extra_fields = kwargs
        self.old_factory = None

    def __enter__(self):
        """Enter context - add extra fields"""
        # Save old factory
        self.old_factory = self.logger._log

        # Create new factory that adds extra fields
        def log_with_context(level, msg, args, exc_info=None, extra=None, stack_info=False):
            if extra is None:
                extra = {}
            extra.update(self.extra_fields)
            return self.old_factory(level, msg, args, exc_info, extra, stack_info)

        self.logger._log = log_with_context
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Exit context - restore old factory"""
        if self.old_factory:
            self.logger._log = self.old_factory


def log_call_start(logger: logging.Logger, agent_id: str, room_name: str, call_type: str):
    """Log call start with structured data"""
    logger.info(
        f"📞 Call started: {call_type}",
        extra={
            "agent_id": agent_id,
            "room_name": room_name,
            "call_type": call_type,
        }
    )


def log_call_end(logger: logging.Logger, agent_id: str, room_name: str, duration_ms: int):
    """Log call end with structured data"""
    logger.info(
        f"✅ Call completed",
        extra={
            "agent_id": agent_id,
            "room_name": room_name,
            "duration_ms": duration_ms,
        }
    )


def log_config_fetch(
    logger: logging.Logger,
    agent_id: str,
    success: bool,
    source: str,
    duration_ms: int
):
    """Log configuration fetch with structured data"""
    if success:
        logger.info(
            f"✓ Config fetched from {source}",
            extra={
                "agent_id": agent_id,
                "config_source": source,
                "duration_ms": duration_ms,
            }
        )
    else:
        logger.error(
            f"✗ Config fetch failed",
            extra={
                "agent_id": agent_id,
                "duration_ms": duration_ms,
            }
        )


def log_error(logger: logging.Logger, message: str, error: Exception, **extra):
    """Log error with exception info"""
    logger.error(
        message,
        exc_info=error,
        extra=extra
    )
