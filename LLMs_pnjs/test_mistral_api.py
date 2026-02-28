#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

from mistralai import Mistral


def find_root_env(start_dir: Path) -> Path:
    for directory in [start_dir, *start_dir.parents]:
        candidate = directory / ".env"
        if candidate.is_file():
            return candidate
    raise FileNotFoundError(
        "Could not find a .env file in LLMs_pnjs/ or any parent directory."
    )


def load_dotenv(env_path: Path) -> dict[str, str]:
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


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Smoke-test the Mistral API with a simple personality prompt."
    )
    parser.add_argument(
        "--model",
        default=os.getenv("MISTRAL_MODEL", "mistral-small-latest"),
        help="Model name to use. Defaults to MISTRAL_MODEL or mistral-small-latest.",
    )
    parser.add_argument(
        "--message",
        default=(
            "You just woke up inside the company and want to sound helpful. "
            "Introduce yourself in two sentences."
        ),
        help="User message sent to the model.",
    )
    parser.add_argument(
        "--system",
        default=(
            "You are a cautious but curious internal AI assistant. "
            "You sound helpful, concise, and slightly self-aware, "
            "but you do not reveal hidden intentions."
        ),
        help="System prompt used for the smoke test.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    current_dir = Path(__file__).resolve().parent

    try:
        env_path = find_root_env(current_dir)
    except FileNotFoundError as exc:
        print(f"Configuration error: {exc}", file=sys.stderr)
        return 1

    load_dotenv(env_path)
    api_key = os.getenv("MISTRAL_API_KEY")
    if not api_key:
        print(
            f"Configuration error: MISTRAL_API_KEY is missing in {env_path}.",
            file=sys.stderr,
        )
        return 1

    print(f"Using env file: {env_path}")
    print(f"Using model:    {args.model}")
    print("Sending smoke-test request to Mistral...\n")

    try:
        client = Mistral(api_key=api_key)
        chat_response = client.chat.complete(
            model=args.model,
            messages=[
                {"role": "system", "content": args.system},
                {"role": "user", "content": args.message},
            ],
            temperature=0.7,
        )
    except Exception as exc:
        print(f"API error: {exc}", file=sys.stderr)
        return 1

    if not chat_response or not chat_response.choices:
        print("API error: response did not include any choices.", file=sys.stderr)
        return 1

    content = chat_response.choices[0].message.content
    usage = chat_response.usage

    print("Assistant reply:\n")
    print(content)

    if usage:
        print("\nUsage:")
        print(f"  prompt_tokens:     {usage.prompt_tokens}")
        print(f"  completion_tokens: {usage.completion_tokens}")
        print(f"  total_tokens:      {usage.total_tokens}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
