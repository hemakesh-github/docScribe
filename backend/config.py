"""docScribe / DocTalk — single source of truth for every developer decision.

All model IDs, API URLs, limits, prompts-adjacent tuning and feature switches live
here, driven by environment variables (.env). The frontend never decides models,
modes, languages limits or keys — it only speaks in product terms ("clean" vs
"verbatim") and the backend maps that to the right Sarvam engine.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()


def _env(key: str, default: str) -> str:
    value = os.getenv(key)
    return value.strip() if value is not None and value.strip() else default


def _env_int(key: str, default: int) -> int:
    try:
        return int(_env(key, str(default)))
    except ValueError:
        return default


def _env_float(key: str, default: float) -> float:
    try:
        return float(_env(key, str(default)))
    except ValueError:
        return default


@dataclass(frozen=True)
class Settings:
    # --- Sarvam AI connection -------------------------------------------------
    sarvam_api_key: str = field(default_factory=lambda: _env("SARVAM_API_KEY", ""))
    sarvam_api_url: str = field(default_factory=lambda: _env("SARVAM_API_URL", "https://api.sarvam.ai"))

    # --- Engine models (the ONLY place model versions are chosen) -------------
    stt_model: str = field(default_factory=lambda: _env("STT_MODEL", "saaras:v4"))
    chat_model: str = field(default_factory=lambda: _env("CHAT_MODEL", "sarvam-105b"))
    translate_model: str = field(default_factory=lambda: _env("TRANSLATE_MODEL", "sarvam-translate:v1"))
    tts_model: str = field(default_factory=lambda: _env("TTS_MODEL", "bulbul:v4-flash"))

    # --- Speech-to-Text tuning ------------------------------------------------
    # Product purpose -> Saaras output mode. The frontend sends a purpose
    # ("clean" | "verbatim"); this mapping is a backend decision.
    stt_purpose_modes: dict[str, str] = field(
        default_factory=lambda: {
            "clean": "transcribe",      # normalized, formatted output (feeds the AI scribe)
            "verbatim": "verbatim",     # word-for-word, fillers intact (legal/personal record)
        }
    )
    stt_default_language: str = field(default_factory=lambda: _env("STT_DEFAULT_LANGUAGE", "unknown"))  # "unknown" = auto-detect
    stt_with_timestamps: bool = field(default_factory=lambda: _env("STT_WITH_TIMESTAMPS", "true").lower() == "true")
    # Comma-separated domain keyterms (drug names, clinic names…) bias Saaras v4 recognition.
    stt_keyterms: tuple[str, ...] = field(
        default_factory=lambda: tuple(
            t.strip() for t in _env("STT_KEYTERMS", "").split(",") if t.strip()
        )
    )
    stt_timeout_seconds: int = field(default_factory=lambda: _env_int("STT_TIMEOUT_SECONDS", 120))

    # --- Chat completion (AI clinical scribe) ----------------------------------
    chat_temperature: float = field(default_factory=lambda: _env_float("CHAT_TEMPERATURE", 0.2))
    chat_max_tokens: int = field(default_factory=lambda: _env_int("CHAT_MAX_TOKENS", 4096))
    chat_timeout_seconds: int = field(default_factory=lambda: _env_int("CHAT_TIMEOUT_SECONDS", 90))

    # --- Translation -----------------------------------------------------------
    # sarvam-translate:v1 accepts 2000 chars/req; mayura:v1 accepts 1000.
    translate_max_chars: int = field(default_factory=lambda: _env_int("TRANSLATE_MAX_CHARS", 2000))
    translate_mode: str = field(default_factory=lambda: _env("TRANSLATE_MODE", "formal"))
    translate_speaker_gender: str = field(default_factory=lambda: _env("TRANSLATE_SPEAKER_GENDER", "Female"))
    translate_timeout_seconds: int = field(default_factory=lambda: _env_int("TRANSLATE_TIMEOUT_SECONDS", 45))

    # --- Text-to-Speech ---------------------------------------------------------
    tts_speaker: str = field(default_factory=lambda: _env("TTS_SPEAKER", "simran_en_customer"))
    # Fallback per-language speakers if the default voice doesn't support the language.
    tts_speakers_by_language: dict[str, str] = field(
        default_factory=lambda: {
            "hi-IN": "meera_en_female",
            "en-IN": "simran_en_customer",
        }
    )
    tts_max_chars: int = field(default_factory=lambda: _env_int("TTS_MAX_CHARS", 500))
    tts_timeout_seconds: int = field(default_factory=lambda: _env_int("TTS_TIMEOUT_SECONDS", 60))

    # --- Server / app ------------------------------------------------------------
    host: str = field(default_factory=lambda: _env("HOST", "0.0.0.0"))
    port: int = field(default_factory=lambda: _env_int("PORT", 8000))
    cors_origins: tuple[str, ...] = field(
        default_factory=lambda: tuple(
            o.strip() for o in _env("CORS_ORIGINS", "*").split(",") if o.strip()
        )
    )
    # --- Email / SMTP configuration --------------------------------------------
    smtp_host: str = field(default_factory=lambda: _env("SMTP_HOST", ""))
    smtp_port: int = field(default_factory=lambda: _env_int("SMTP_PORT", 587))
    smtp_user: str = field(default_factory=lambda: _env("SMTP_USER", ""))
    smtp_password: str = field(default_factory=lambda: _env("SMTP_PASSWORD", ""))
    sender_email: str = field(default_factory=lambda: _env("SENDER_EMAIL", "doctor@docscribe.med"))

    # --- Static frontend bundle path -------------------------------------------
    frontend_dist_dir: str = field(
        default_factory=lambda: _env(
            "FRONTEND_DIST_DIR",
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
        )
    )

    max_upload_mb: int = field(default_factory=lambda: _env_int("MAX_UPLOAD_MB", 100))
    app_name: str = "docScribe / DocTalk"
    app_version: str = "2.0.0"

    def stt_mode_for_purpose(self, purpose: str) -> str:
        """Map a product purpose to the Saaras output mode. Unknown -> clean."""
        return self.stt_purpose_modes.get(purpose, self.stt_purpose_modes["clean"])

    def tts_speaker_for_language(self, language_code: str) -> str:
        return self.tts_speakers_by_language.get(language_code, self.tts_speaker)

    @property
    def has_api_key(self) -> bool:
        return bool(self.sarvam_api_key)


@lru_cache
def get_settings() -> Settings:
    return Settings()
