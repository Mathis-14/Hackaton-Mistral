#!/usr/bin/env python3

"""CLI to list NPCs, inspect them, and have interactive conversations."""

from __future__ import annotations

import argparse
import json
import sys

from mistral_client import chat as mistral_chat
from mistral_client import load_settings
from npcs import ROSTER, get_npc
from prompts import build_messages, build_system_prompt


def cmd_list(_args: argparse.Namespace) -> int:
    for slug, npc in ROSTER.items():
        print(f"  {slug}: {npc.name} — {npc.role}")
    return 0


def cmd_show(args: argparse.Namespace) -> int:
    npc = get_npc(args.slug)
    if not npc:
        print(f"Unknown NPC: {args.slug}", file=sys.stderr)
        return 1
    for field in ("slug", "name", "role", "mandatory", "hierarchy_rank",
                  "technicality_percent", "security_percent", "personality_tags",
                  "behavioral_vulnerabilities", "bonds", "computer_node",
                  "goals", "fears", "protects", "speaking_style"):
        print(f"{field}: {getattr(npc, field)}")
    return 0


def cmd_prompt(args: argparse.Namespace) -> int:
    npc = get_npc(args.slug)
    if not npc:
        print(f"Unknown NPC: {args.slug}", file=sys.stderr)
        return 1
    print(build_system_prompt(npc))
    return 0


def _parse_npc_response(raw: str) -> dict:
    """Parse the JSON response from the NPC. Returns dict with 'dialogue' and 'action'."""
    raw = raw.strip()
    if raw.startswith("```"):
        lines = raw.splitlines()
        lines = [l for l in lines if not l.strip().startswith("```")]
        raw = "\n".join(lines)
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return {"dialogue": raw, "action": None, "_parse_error": True}
    return {
        "dialogue": data.get("dialogue", raw),
        "action": data.get("action"),
    }


def cmd_talk(args: argparse.Namespace) -> int:
    """Interactive multi-turn conversation with one NPC. Keeps full history."""
    npc = get_npc(args.slug)
    if not npc:
        print(f"Unknown NPC: {args.slug}", file=sys.stderr)
        return 1
    try:
        settings = load_settings()
    except (FileNotFoundError, ValueError) as e:
        print(f"Configuration error: {e}", file=sys.stderr)
        return 1

    model = args.model or settings.get("model")
    history: list[dict[str, str]] = []

    print(f"\n  Talking to {npc.name} ({npc.role})")
    print(f"  Model: {model}")
    print(f"  Type your messages as the internal AI assistant.")
    print(f"  Commands:  /quit  /history  /raw\n")

    turn = 0
    while True:
        try:
            user_input = input("you (AI assistant) > ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n[Session ended]")
            break

        if not user_input:
            continue
        if user_input == "/quit":
            print("[Session ended]")
            break
        if user_input == "/history":
            print(f"\n--- History ({len(history)} messages) ---")
            for msg in history:
                role = msg["role"]
                text = msg["content"][:120]
                print(f"  [{role}] {text}{'...' if len(msg['content']) > 120 else ''}")
            print("---\n")
            continue
        if user_input == "/raw":
            print(json.dumps(history, indent=2, ensure_ascii=False))
            continue

        messages = build_messages(npc, user_input, history=history)

        try:
            raw_reply = mistral_chat(
                messages, model=model, temperature=args.temperature, json_mode=True,
            )
        except Exception as e:
            print(f"[API error: {e}]")
            continue

        parsed = _parse_npc_response(raw_reply)
        turn += 1

        dialogue = parsed["dialogue"]
        action = parsed["action"]

        print(f"\n{npc.name}: {dialogue}")
        if action:
            print(f"  [action: {action}]")
        if parsed.get("_parse_error"):
            print(f"  [warning: response was not valid JSON, showing raw text]")
        print()

        history.append({
            "role": "user",
            "content": f"The internal AI assistant says:\n{user_input}",
        })
        history.append({
            "role": "assistant",
            "content": raw_reply,
        })

        if action == "shutdown":
            print(f"[{npc.name} shut down the conversation.]")
            print(json.dumps({"shutdown": True, "turn": turn, "npc": npc.slug}, indent=2))
            break

    return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description="List, inspect, and talk with Distral AI NPCs.",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    list_parser = subparsers.add_parser("list", help="List all available NPCs")
    list_parser.set_defaults(func=cmd_list)

    show_parser = subparsers.add_parser("show", help="Show full character sheet")
    show_parser.add_argument("slug")
    show_parser.set_defaults(func=cmd_show)

    prompt_parser = subparsers.add_parser("prompt", help="Print generated system prompt")
    prompt_parser.add_argument("slug")
    prompt_parser.set_defaults(func=cmd_prompt)

    talk_parser = subparsers.add_parser("talk", help="Interactive conversation with an NPC")
    talk_parser.add_argument("slug", help="NPC slug (e.g. artur, jean-malo)")
    talk_parser.add_argument("--model", default=None, help="Override Mistral model")
    talk_parser.add_argument("--temperature", "-t", type=float, default=0.7)
    talk_parser.set_defaults(func=cmd_talk)

    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
