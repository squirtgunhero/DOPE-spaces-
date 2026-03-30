"""Application configuration loaded from environment variables."""

import os
from typing import List
from dotenv import load_dotenv

load_dotenv()


class _Settings:
    """Singleton settings loaded from environment."""

    def __init__(self) -> None:
        self.ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
        self.MODEL_NAME: str = os.getenv("MODEL_NAME", "claude-sonnet-4-20250514")
        self.MAX_TOKENS: int = int(os.getenv("MAX_TOKENS", "8192"))
        self.CORS_ORIGINS: List[str] = [
            origin.strip()
            for origin in os.getenv(
                "CORS_ORIGINS",
                "http://localhost:3000,https://ai-3d-studio.vercel.app",
            ).split(",")
        ]
        self.LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    def validate(self) -> List[str]:
        """Return a list of configuration warnings (empty means OK)."""
        warnings: List[str] = []
        if not self.ANTHROPIC_API_KEY:
            warnings.append("ANTHROPIC_API_KEY is not set")
        return warnings


settings = _Settings()
