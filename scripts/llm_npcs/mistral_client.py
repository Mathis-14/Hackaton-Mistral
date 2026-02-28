#!/usr/bin/env python3

"""Load .env and send message lists to Mistral. Knows nothing about characters or prompts."""

from __future__ import annotations

import os
from pathlib import Path

from mistralai import Mistral


def find_root_env(start_dir: Path | None = None) -> Path:
    if start_dir is None:
        start_dir = Path(__file__).resolve().parent
    for directory in [start_dir, *start_dir.parents]:
        candidate = directory / ".env"
        if candidate.is_file():
            return candidate
    raise FileNotFoundError(
        "Could not find a .env file in LLMs_pnjs/ or any parent directory."
    )


def _load_dotenv(env_path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        values[key] = value
        os.environ.setdefault(key, value)
    return values


def load_settings() -> dict[str, str]:
    """Load .env and return api_key and model. Raises if .env or MISTRAL_API_KEY missing."""
    env_path = find_root_env()
    _load_dotenv(env_path)
    api_key = os.getenv("MISTRAL_API_KEY")
    if not api_key:
        raise ValueError(
            f"MISTRAL_API_KEY is missing. Set it in {env_path} or in the environment."
        )
    model = os.getenv("MISTRAL_MODEL", "mistral-large-latest")
    return {"api_key": api_key, "model": model, "env_path": str(env_path)}


def chat(
    messages: list[dict[str, str]],
    model: str | None = None,
    temperature: float = 0.7,
    json_mode: bool = False,
) -> str:
    """Send messages to Mistral and return the assistant content string."""
    settings = load_settings()
    api_key = settings["api_key"]
    resolved_model = model or settings["model"]

    client = Mistral(api_key=api_key)
    kwargs: dict = dict(
        model=resolved_model,
        messages=messages,
        temperature=temperature,
    )
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}

    response = client.chat.complete(**kwargs)
    if not response or not response.choices:
        raise RuntimeError("Mistral response did not include any choices.")
    return response.choices[0].message.content or ""
