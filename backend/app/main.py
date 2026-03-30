"""DOPE [spaces] Backend -- FastAPI application entry point."""

from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routes.generate import router as generate_router
from .core.config import settings

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL, logging.INFO),
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="DOPE [spaces] Backend",
    description="NLP-driven 3D scene generation engine powered by Claude",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(generate_router)


@app.get("/health")
async def health_check() -> dict:
    """Health-check endpoint."""
    warnings = settings.validate()
    return {
        "status": "healthy" if not warnings else "degraded",
        "version": "1.0.0",
        "model": settings.MODEL_NAME,
        "warnings": warnings,
    }


@app.on_event("startup")
async def on_startup() -> None:
    """Log configuration on startup."""
    warnings = settings.validate()
    logger.info("DOPE [spaces] Backend starting")
    logger.info("  Model:        %s", settings.MODEL_NAME)
    logger.info("  Max tokens:   %d", settings.MAX_TOKENS)
    logger.info("  CORS origins: %s", settings.CORS_ORIGINS)
    if warnings:
        for w in warnings:
            logger.warning("  CONFIG WARNING: %s", w)
    else:
        logger.info("  API key:      configured")
