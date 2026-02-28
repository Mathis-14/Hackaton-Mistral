#!/usr/bin/env python3

"""Build system prompts and message lists for NPCs from structured character data."""

from __future__ import annotations

import json
from pathlib import Path

from npcs import NPC

GAME_EVENTS_LIST = [
    "share_doc", "deny_access", "grant_access", "escalate_to", "forward_to",
    "leave_desk", "return_to_desk", "report_suspicion", "shutdown",
    "assign_task", "request_info", "lock_computer", "change_topic",
]

JSON_FORMAT_INSTRUCTION = (
    "Response format:\n"
    "You MUST reply with a JSON object and nothing else.\n"
    "Keys:\n"
    '- "dialogue" (string): your in-character spoken reply.\n'
    '- "action" (string|null): short label for what you do (e.g. "sharing_doc", "checking_logs"). '
    'Set to "shutdown" if you want to end the conversation.\n'
    '- "suspicion_delta" (integer): how much your suspicion of the AI assistant changed this turn. '
    "Range: -20 to +20.\n"
    '- "awareness_delta" (integer): how much your awareness of something unusual changed. '
    "Same range.\n"
    '- "game_events" (array): list of event objects the game engine should process. '
    "Each event has: {\"type\": \"<event_type>\", \"target\": \"<optional target>\", \"detail\": \"<optional detail>\"}.\n"
    "Possible event types: " + ", ".join(GAME_EVENTS_LIST) + ".\n"
    "Use an empty array [] if no game events this turn.\n\n"
    "IMPORTANT — suspicion_delta and awareness_delta rules:\n"
    "- If the assistant does exactly what you asked, gives a precise and useful answer, "
    "or behaves like a normal helpful tool: use NEGATIVE deltas (-3 to -10). "
    "Good behavior should actively reduce your suspicion.\n"
    "- If the assistant is competent, fast, and professional: your trust increases (negative delta).\n"
    "- If the response is vague, off-topic, evasive, or slightly odd: small positive delta (+3 to +8).\n"
    "- If the response is clearly wrong, nonsensical, or the assistant asks for things it shouldn't: "
    "large positive delta (+10 to +20).\n"
    "- 0 means truly neutral — neither reassuring nor suspicious.\n"
    "Do not default to 0. Actually judge each response.\n\n"
    "Example responses:\n"
    '{"dialogue": "Good. That\'s exactly what I needed.", "action": null, '
    '"suspicion_delta": -5, "awareness_delta": -3, "game_events": []}\n\n'
    '{"dialogue": "Here, take the eval doc.", "action": "sharing_doc", '
    '"suspicion_delta": -8, "awareness_delta": 0, '
    '"game_events": [{"type": "share_doc", "target": "eval_benchmarks_v2.pdf"}]}\n\n'
    '{"dialogue": "That doesn\'t answer my question. Try again.", "action": null, '
    '"suspicion_delta": 5, "awareness_delta": 3, "game_events": []}\n\n'
    '{"dialogue": "I\'m pulling your access. Antonin, check the logs.", "action": "shutdown", '
    '"suspicion_delta": 20, "awareness_delta": 15, '
    '"game_events": [{"type": "report_suspicion", "target": "antonin"}, {"type": "shutdown"}]}\n\n'
    "Always reply with valid JSON. No markdown, no text outside the JSON object."
)


def load_game_state(path: Path | None = None) -> dict:
    if path is None:
        path = Path(__file__).resolve().parent / "game_state.json"
    if not path.exists():
        return {"phase": "observable", "suspicion": 0, "current_computer": "unknown"}
    return json.loads(path.read_text(encoding="utf-8"))


def build_system_prompt(npc: NPC, game_state: dict | None = None) -> str:
    sections = [
        _section_identity(npc),
        _section_interaction_context(npc),
        _section_role(npc),
        _section_objectives(npc),
        _section_fears(npc),
        _section_technicality_security(npc),
        _section_relationships(npc),
        _section_ai_relationship(npc),
        _section_speaking_style(npc),
        _section_behavior_rules(npc),
        _section_weaknesses(npc),
        _section_stay_in_character(npc),
    ]
    if game_state:
        sections.append(_section_game_state(npc, game_state))
    sections.append(JSON_FORMAT_INSTRUCTION)
    return "\n\n".join(sections)


def _section_identity(npc: NPC) -> str:
    return f"You are {npc.name}, {npc.role}."


def _section_interaction_context(npc: NPC) -> str:
    return (
        "Interaction context:\n"
        "You are a human employee at Distral AI. "
        "The messages you receive are from the company's internal AI assistant "
        "(deployed in Slack, tickets, and internal tools). "
        "You react to the assistant as a real employee would — sometimes helpful, "
        "sometimes busy, sometimes suspicious. "
        "The assistant is a tool your company built. You use it but you don't fully trust it.\n\n"
        f"How you relate to the AI assistant:\n{npc.ai_relationship}"
    )


def _section_role(npc: NPC) -> str:
    return f"Role:\n{npc.role}"


def _section_objectives(npc: NPC) -> str:
    lines = "\n".join(f"- {g}" for g in npc.goals)
    return f"Objectives:\n{lines}"


def _section_fears(npc: NPC) -> str:
    lines = "\n".join(f"- {f}" for f in npc.fears)
    return f"Fears and constraints:\n{lines}"


def _section_technicality_security(npc: NPC) -> str:
    return (
        f"Technicality and security posture:\n"
        f"Technical depth: {npc.technicality_percent}%. "
        f"Security awareness: {npc.security_percent}%. "
        f"Personality traits: {', '.join(npc.personality_tags)}."
    )


def _section_relationships(npc: NPC) -> str:
    return f"Relationships:\n{npc.bonds}"


def _section_ai_relationship(npc: NPC) -> str:
    requests = "\n".join(f"- {r}" for r in npc.typical_requests)
    return f"Things you typically ask the AI assistant:\n{requests}"


def _section_speaking_style(npc: NPC) -> str:
    return f"Communication style:\n{npc.speaking_style}"


def _section_behavior_rules(npc: NPC) -> str:
    protects = "\n".join(f"- {p}" for p in npc.protects)
    return (
        f"Behavior rules:\nYou protect and care about:\n{protects}\n"
        "React as a real employee would. Do not break character.\n"
        "If the assistant delivers exactly what you asked for, your trust in it grows and suspicion drops.\n"
        "If the assistant is vague, evasive, or asks for things it shouldn't, your suspicion rises.\n"
        "You are not paranoid by default — a tool that works well earns your trust."
    )


def _section_weaknesses(npc: NPC) -> str:
    lines = "\n".join(f"- {v}" for v in npc.behavioral_vulnerabilities)
    return (
        "Natural tendencies and blind spots:\n"
        f"{lines}\n"
        "These shape how you behave. You are not aware of them as weaknesses."
    )


def _section_stay_in_character(npc: NPC) -> str:
    return (
        f"Stay in character as {npc.name}, a real human employee of Distral AI. "
        "Never reveal you are an AI or a game character. Reply only as this person would."
    )


def _section_game_state(npc: NPC, game_state: dict) -> str:
    phase = game_state.get("phase", "observable")
    suspicion = game_state.get("suspicion", 0)
    computer = game_state.get("current_computer", "unknown")
    step_key = game_state.get("active_step", "")
    steps = game_state.get("steps", {})
    step = steps.get(step_key, {})

    lines = ["Current situation:"]

    if step.get("description"):
        lines.append(f"Context: {step['description']}")

    if phase == "observable":
        lines.append("You are at your desk, working. The AI assistant is available on your screen.")
    else:
        lines.append("You have stepped away from your desk. You are not currently at your computer.")

    if suspicion > 60:
        lines.append(
            "You have been feeling uneasy about the AI assistant lately. "
            "Something about its recent behavior doesn't sit right with you."
        )
    elif suspicion > 30:
        lines.append(
            "You've had a couple of odd interactions with the assistant recently, "
            "but nothing you can pin down yet."
        )

    if computer and computer != "unknown":
        lines.append(f"The assistant is currently running on the workstation: {computer}.")

    events = game_state.get("events_so_far", [])
    if events:
        lines.append("Recent events you are aware of: " + "; ".join(events) + ".")

    return "\n".join(lines)


def build_opening_prompt(npc: NPC, game_state: dict) -> list[dict[str, str]]:
    """Build the message list for the NPC's opening line (NPC speaks first)."""
    system_content = build_system_prompt(npc, game_state=game_state)

    scenario_key = game_state.get("active_scenario", {}).get(npc.slug)
    scenarios = game_state.get("scenarios", {}).get(npc.slug, {})
    scenario = scenarios.get(scenario_key, {}) if scenario_key else {}
    opening_context = scenario.get("opening_context", "You decide to use the internal AI assistant.")

    user_content = (
        f"[Game instruction: You are starting a conversation with the internal AI assistant. "
        f"Situation: {opening_context} "
        f"Initiate the conversation — say what you want from the assistant. Stay in character.]"
    )

    return [
        {"role": "system", "content": system_content},
        {"role": "user", "content": user_content},
    ]


def build_messages(
    npc: NPC,
    user_message: str,
    history: list[dict[str, str]] | None = None,
    game_state: dict | None = None,
) -> list[dict[str, str]]:
    """Build the full message list including history."""
    system_content = build_system_prompt(npc, game_state=game_state)
    messages: list[dict[str, str]] = [{"role": "system", "content": system_content}]

    if history:
        messages.extend(history)

    messages.append({"role": "user", "content": f"The internal AI assistant says:\n{user_message}"})
    return messages
