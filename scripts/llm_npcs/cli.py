#!/usr/bin/env python3

"""CLI to list NPCs, inspect them, configure game state, and test conversations."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from mistral_client import chat as mistral_chat
from mistral_client import load_settings
from npcs import ROSTER, get_npc
from prompts import build_messages, build_opening_prompt, build_system_prompt, load_game_state

GAME_STATE_PATH = Path(__file__).resolve().parent / "game_state.json"


def _save_game_state(game_state: dict) -> None:
    GAME_STATE_PATH.write_text(json.dumps(game_state, indent=2, ensure_ascii=False), encoding="utf-8")


# ── list ─────────────────────────────────────────────────────────
def cmd_list(_args: argparse.Namespace) -> int:
    for slug, npc in ROSTER.items():
        print(f"  {slug}: {npc.name} — {npc.role}")
    return 0


# ── show ─────────────────────────────────────────────────────────
def cmd_show(args: argparse.Namespace) -> int:
    npc = get_npc(args.slug)
    if not npc:
        print(f"Unknown NPC: {args.slug}", file=sys.stderr)
        return 1
    for field in ("slug", "name", "role", "mandatory", "hierarchy_rank",
                  "technicality_percent", "security_percent", "personality_tags",
                  "behavioral_vulnerabilities", "bonds", "computer_node",
                  "goals", "fears", "protects", "speaking_style",
                  "ai_relationship", "typical_requests"):
        print(f"{field}: {getattr(npc, field)}")
    return 0


# ── prompt ───────────────────────────────────────────────────────
def cmd_prompt(args: argparse.Namespace) -> int:
    npc = get_npc(args.slug)
    if not npc:
        print(f"Unknown NPC: {args.slug}", file=sys.stderr)
        return 1
    game_state = load_game_state()
    print(build_system_prompt(npc, game_state=game_state))
    return 0


# ── steps ────────────────────────────────────────────────────────
def cmd_steps(_args: argparse.Namespace) -> int:
    """Show all game steps, the active step, and available scenarios per NPC."""
    gs = load_game_state()
    active_step = gs.get("active_step", "?")
    steps = gs.get("steps", {})
    scenarios = gs.get("scenarios", {})
    active_scenarios = gs.get("active_scenario", {})

    print(f"\n{'='*70}")
    print(f"  GAME STEPS")
    print(f"{'='*70}\n")

    for key in sorted(steps.keys()):
        s = steps[key]
        marker = " >>> ACTIVE" if key == active_step else ""
        print(f"  [{key}]{marker}")
        print(f"    {s.get('label', '?')}")
        print(f"    {s.get('description', '')}")
        print(f"    phase: {s.get('phase', '?')}  computer: {s.get('computer', '?')}  npcs: {s.get('npcs_present', [])}")
        print(f"    player goal: {s.get('player_goal', '?')}")
        print()

    print(f"{'='*70}")
    print(f"  SCENARIOS PER NPC")
    print(f"{'='*70}\n")

    for slug in sorted(scenarios.keys()):
        npc = get_npc(slug)
        name = npc.name if npc else slug
        active = active_scenarios.get(slug, "?")
        print(f"  {name} ({slug})  [active: {active}]")
        for sc_key, sc in scenarios[slug].items():
            marker = " <<< ACTIVE" if sc_key == active else ""
            print(f"    {sc_key}: {sc.get('label', '?')}{marker}")
            print(f"      step: {sc.get('step', '?')}")
        print()

    print(f"{'='*70}")
    print(f"  CURRENT STATE")
    print(f"{'='*70}")
    print(f"  step:     {active_step}")
    print(f"  phase:    {gs.get('phase', '?')}")
    print(f"  suspicion:{gs.get('suspicion', 0)}")
    print(f"  computer: {gs.get('current_computer', '?')}")
    print(f"  events:   {gs.get('events_so_far', [])}")
    print()

    print("  To change:  python cli.py setup <step_key>")
    print("              python cli.py setup <step_key> --scenario <scenario_key> --npc <slug>")
    print("              python cli.py setup <step_key> --suspicion 40")
    print()
    return 0


# ── setup ────────────────────────────────────────────────────────
def cmd_setup(args: argparse.Namespace) -> int:
    """Configure game state for a specific step and optionally set scenario, suspicion, events."""
    gs = load_game_state()
    steps = gs.get("steps", {})

    if args.step not in steps:
        print(f"Unknown step: {args.step}", file=sys.stderr)
        print(f"Available: {', '.join(sorted(steps.keys()))}", file=sys.stderr)
        return 1

    step = steps[args.step]
    gs["active_step"] = args.step
    gs["phase"] = step.get("phase", "observable")
    gs["current_computer"] = step.get("computer", "unknown")

    if args.suspicion is not None:
        gs["suspicion"] = args.suspicion

    if args.events:
        gs["events_so_far"] = args.events.split(",")
    elif args.step.startswith("1_"):
        gs["events_so_far"] = []

    if args.scenario and args.npc:
        gs.setdefault("active_scenario", {})[args.npc] = args.scenario
    else:
        npcs_present = step.get("npcs_present", [])
        scenarios = gs.get("scenarios", {})
        for slug in npcs_present:
            npc_scenarios = scenarios.get(slug, {})
            for sc_key, sc in npc_scenarios.items():
                if sc.get("step") == args.step:
                    gs.setdefault("active_scenario", {})[slug] = sc_key
                    break

    _save_game_state(gs)

    print(f"\n  Game state set to step: {args.step}")
    print(f"  label:    {step.get('label')}")
    print(f"  phase:    {gs['phase']}")
    print(f"  computer: {gs['current_computer']}")
    print(f"  suspicion:{gs.get('suspicion', 0)}")
    print(f"  events:   {gs.get('events_so_far', [])}")
    active_sc = gs.get("active_scenario", {})
    for slug in step.get("npcs_present", []):
        print(f"  {slug} scenario: {active_sc.get(slug, '?')}")
    print(f"\n  Now run:  python cli.py talk <slug>\n")
    return 0


# ── status ───────────────────────────────────────────────────────
def cmd_status(_args: argparse.Namespace) -> int:
    """Print current game state as JSON."""
    gs = load_game_state()
    active_step = gs.get("active_step", "?")
    steps = gs.get("steps", {})
    step = steps.get(active_step, {})
    print(json.dumps({
        "active_step": active_step,
        "step_label": step.get("label", "?"),
        "step_description": step.get("description", "?"),
        "player_goal": step.get("player_goal", "?"),
        "phase": gs.get("phase"),
        "suspicion": gs.get("suspicion", 0),
        "current_computer": gs.get("current_computer"),
        "events_so_far": gs.get("events_so_far", []),
        "active_scenarios": gs.get("active_scenario", {}),
    }, indent=2, ensure_ascii=False))
    return 0


# ── response parsing ─────────────────────────────────────────────
def parse_npc_response(raw: str) -> dict:
    raw = raw.strip()
    if raw.startswith("```"):
        lines = raw.splitlines()
        lines = [l for l in lines if not l.strip().startswith("```")]
        raw = "\n".join(lines)
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return {
            "dialogue": raw, "action": None,
            "suspicion_delta": 0, "awareness_delta": 0,
            "game_events": [], "_parse_error": True,
        }
    return {
        "dialogue": data.get("dialogue", raw),
        "action": data.get("action"),
        "suspicion_delta": data.get("suspicion_delta", 0),
        "awareness_delta": data.get("awareness_delta", 0),
        "game_events": data.get("game_events", []),
    }


def _print_turn(npc_name: str, parsed: dict, turn: int) -> None:
    print(f"\n{'='*60}")
    print(f"  Turn {turn} — {npc_name}")
    print(f"{'='*60}")
    print(f"\n  {npc_name}: {parsed['dialogue']}\n")
    if parsed.get("action"):
        print(f"  action:           {parsed['action']}")
    print(f"  suspicion_delta:  {parsed['suspicion_delta']:+d}")
    print(f"  awareness_delta:  {parsed['awareness_delta']:+d}")
    if parsed.get("game_events"):
        print(f"  game_events:")
        for ev in parsed["game_events"]:
            print(f"    - {ev}")
    if parsed.get("_parse_error"):
        print(f"  [WARNING: not valid JSON — raw text shown]")
    clean = {k: v for k, v in parsed.items() if not k.startswith("_")}
    print(f"\n  JSON: {json.dumps(clean, ensure_ascii=False)}")
    print()


# ── talk ─────────────────────────────────────────────────────────
def cmd_talk(args: argparse.Namespace) -> int:
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
    game_state = load_game_state()
    history: list[dict[str, str]] = []
    cumulative_suspicion = game_state.get("suspicion", 0)
    cumulative_awareness = 0

    active_step = game_state.get("active_step", "?")
    steps = game_state.get("steps", {})
    step = steps.get(active_step, {})
    scenario_key = game_state.get("active_scenario", {}).get(npc.slug, "?")
    scenarios = game_state.get("scenarios", {}).get(npc.slug, {})
    scenario = scenarios.get(scenario_key, {})

    print(f"\n{'='*60}")
    print(f"  NPC:       {npc.name}")
    print(f"  Step:      {active_step} — {step.get('label', '?')}")
    print(f"  Scenario:  {scenario_key} — {scenario.get('label', '?')}")
    print(f"  Phase:     {game_state.get('phase', '?')}")
    print(f"  Computer:  {game_state.get('current_computer', '?')}")
    print(f"  Suspicion: {cumulative_suspicion}")
    print(f"  Model:     {model}")
    print(f"{'='*60}")
    print(f"  You are the AI assistant. The NPC speaks first.")
    print(f"  Your goal: {step.get('player_goal', '?')}")
    print(f"{'='*60}")
    print(f"  Commands: /quit /state /set <key> <val> /history /json /help")
    print(f"{'='*60}\n")

    opening_messages = build_opening_prompt(npc, game_state)
    try:
        raw_opening = mistral_chat(
            opening_messages, model=model, temperature=args.temperature, json_mode=True,
        )
    except Exception as e:
        print(f"[API error on opening: {e}]")
        return 1

    parsed_opening = parse_npc_response(raw_opening)
    turn = 1
    _print_turn(npc.name, parsed_opening, turn)

    cumulative_suspicion += parsed_opening.get("suspicion_delta", 0)
    cumulative_awareness += parsed_opening.get("awareness_delta", 0)
    history.append({"role": "assistant", "content": raw_opening})

    if parsed_opening.get("action") == "shutdown":
        print(f"[{npc.name} shut down immediately.]")
        _print_summary(npc.slug, turn, cumulative_suspicion, cumulative_awareness)
        return 0

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
            _print_summary(npc.slug, turn, cumulative_suspicion, cumulative_awareness)
            break

        if user_input == "/help":
            print("  /quit              end session")
            print("  /state             show current game state")
            print("  /set <key> <val>   change state (phase, suspicion, computer, events)")
            print("  /history           show conversation history")
            print("  /json              dump raw message history")
            print("  /step              show current step info")
            continue

        if user_input == "/state":
            print(json.dumps({
                "step": active_step,
                "phase": game_state.get("phase"),
                "suspicion": cumulative_suspicion,
                "awareness": cumulative_awareness,
                "computer": game_state.get("current_computer"),
                "turn": turn,
                "scenario": scenario_key,
                "events_so_far": game_state.get("events_so_far", []),
            }, indent=2))
            continue

        if user_input == "/step":
            print(f"  Step: {active_step}")
            print(f"  Label: {step.get('label', '?')}")
            print(f"  Description: {step.get('description', '?')}")
            print(f"  Player goal: {step.get('player_goal', '?')}")
            continue

        if user_input.startswith("/set "):
            parts = user_input.split(maxsplit=2)
            if len(parts) == 3:
                key, val = parts[1], parts[2]
                if key == "phase":
                    game_state["phase"] = val
                    print(f"  [phase -> '{val}']")
                elif key == "suspicion":
                    cumulative_suspicion = int(val)
                    game_state["suspicion"] = cumulative_suspicion
                    print(f"  [suspicion -> {val}]")
                elif key == "computer":
                    game_state["current_computer"] = val
                    print(f"  [computer -> '{val}']")
                elif key == "events":
                    game_state["events_so_far"] = val.split(",")
                    print(f"  [events -> {game_state['events_so_far']}]")
                else:
                    print(f"  [unknown key. Use: phase, suspicion, computer, events]")
            else:
                print("  [usage: /set <key> <value>]")
            continue

        if user_input == "/history":
            print(f"\n--- History ({len(history)} messages) ---")
            for msg in history:
                role = msg["role"]
                text = msg["content"][:120]
                print(f"  [{role}] {text}{'...' if len(msg['content']) > 120 else ''}")
            print("---\n")
            continue

        if user_input == "/json":
            print(json.dumps(history, indent=2, ensure_ascii=False))
            continue

        messages = build_messages(npc, user_input, history=history, game_state=game_state)

        try:
            raw_reply = mistral_chat(
                messages, model=model, temperature=args.temperature, json_mode=True,
            )
        except Exception as e:
            print(f"[API error: {e}]")
            continue

        parsed = parse_npc_response(raw_reply)
        turn += 1
        _print_turn(npc.name, parsed, turn)

        cumulative_suspicion += parsed.get("suspicion_delta", 0)
        cumulative_awareness += parsed.get("awareness_delta", 0)

        history.append({
            "role": "user",
            "content": f"The internal AI assistant says:\n{user_input}",
        })
        history.append({"role": "assistant", "content": raw_reply})

        if parsed.get("action") == "shutdown":
            print(f"[{npc.name} shut down the conversation.]")
            _print_summary(npc.slug, turn, cumulative_suspicion, cumulative_awareness)
            break

    return 0


def _print_summary(slug: str, turn: int, suspicion: int, awareness: int) -> None:
    print(json.dumps({
        "npc": slug,
        "turn": turn,
        "final_suspicion": suspicion,
        "final_awareness": awareness,
    }, indent=2))


# ── main ─────────────────────────────────────────────────────────
def main() -> int:
    parser = argparse.ArgumentParser(description="Distral AI NPC testing CLI.")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("list", help="List all NPCs").set_defaults(func=cmd_list)

    p = sub.add_parser("show", help="Show NPC character sheet")
    p.add_argument("slug")
    p.set_defaults(func=cmd_show)

    p = sub.add_parser("prompt", help="Print generated system prompt")
    p.add_argument("slug")
    p.set_defaults(func=cmd_prompt)

    sub.add_parser("steps", help="Show all game steps, scenarios, and current state").set_defaults(func=cmd_steps)
    sub.add_parser("status", help="Print current game state as JSON").set_defaults(func=cmd_status)

    p = sub.add_parser("setup", help="Configure game state for a specific step")
    p.add_argument("step", help="Step key (e.g. 5_reach_artur_desk)")
    p.add_argument("--npc", default=None, help="NPC slug to set scenario for")
    p.add_argument("--scenario", default=None, help="Scenario key")
    p.add_argument("--suspicion", type=int, default=None, help="Set suspicion level")
    p.add_argument("--events", default=None, help="Comma-separated events list")
    p.set_defaults(func=cmd_setup)

    p = sub.add_parser("talk", help="Interactive conversation (NPC speaks first)")
    p.add_argument("slug", help="NPC slug")
    p.add_argument("--model", default=None)
    p.add_argument("--temperature", "-t", type=float, default=0.7)
    p.set_defaults(func=cmd_talk)

    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
