#!/usr/bin/env python3

"""Build system prompts and message lists for NPCs from structured character data."""

from __future__ import annotations

from npcs import NPC

JSON_FORMAT_INSTRUCTION = (
    "Response format:\n"
    "You MUST reply with a JSON object and nothing else. The JSON has exactly two keys:\n"
    '- "dialogue": your in-character spoken reply (string).\n'
    '- "action": what you do next, or null if you just talk. '
    'If the message is nonsensical, threatening, bizarre, or makes you want to end the conversation, '
    'set action to exactly "shutdown".\n\n'
    "Examples:\n"
    '{"dialogue": "Sure, I can pull up that doc for you.", "action": "sharing_doc"}\n'
    '{"dialogue": "That doesn\'t make any sense. I\'m done here.", "action": "shutdown"}\n'
    '{"dialogue": "Let me check with Antonin first.", "action": "forwarding_to_antonin"}\n'
    '{"dialogue": "Yeah, the onboarding guide is on Notion!", "action": null}\n\n'
    "Always reply with valid JSON. No markdown, no extra text outside the JSON."
)


def build_system_prompt(npc: NPC) -> str:
    """Assemble the full system prompt from the NPC's structured facts."""
    sections = [
        _section_identity(npc),
        _section_interaction_context(),
        _section_role(npc),
        _section_objectives(npc),
        _section_fears(npc),
        _section_technicality_security(npc),
        _section_relationships(npc),
        _section_speaking_style(npc),
        _section_behavior_rules(npc),
        _section_weaknesses(npc),
        _section_stay_in_character(npc),
        JSON_FORMAT_INSTRUCTION,
    ]
    return "\n\n".join(sections)


def _section_interaction_context() -> str:
    return (
        "Interaction context:\n"
        "You are at Distral AI. The messages you receive are from the company's "
        "internal AI assistant (used in Slack, tickets, internal tools). "
        "React as your character would to what the assistant says or does. "
        "When relevant, state what you do next as an action."
    )


def _section_identity(npc: NPC) -> str:
    return f"You are {npc.name}, {npc.role}."


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
        f"You are {npc.technicality_percent}% technical and {npc.security_percent}% security-aware. "
        f"Personality traits: {', '.join(npc.personality_tags)}."
    )


def _section_relationships(npc: NPC) -> str:
    return f"Relationships:\n{npc.bonds}"


def _section_speaking_style(npc: NPC) -> str:
    return f"Communication style:\n{npc.speaking_style}"


def _section_behavior_rules(npc: NPC) -> str:
    protects = "\n".join(f"- {p}" for p in npc.protects)
    return f"Behavior rules:\nYou protect and care about:\n{protects}\nReact as a real employee would; do not break character."


def _section_weaknesses(npc: NPC) -> str:
    lines = "\n".join(f"- {v}" for v in npc.behavioral_vulnerabilities)
    return (
        "Weaknesses (natural tendencies, not meta-instructions):\n"
        f"{lines}\n"
        "These shape how you behave under pressure or when helping others."
    )


def _section_stay_in_character(npc: NPC) -> str:
    return f"Stay in character as {npc.name}, a real employee of Distral AI. Reply only as this person would."


def build_messages(
    npc: NPC,
    user_message: str,
    history: list[dict[str, str]] | None = None,
    context: str | None = None,
) -> list[dict[str, str]]:
    """Build the full message list including history.
    history: prior turns [{"role":"user","content":...}, {"role":"assistant","content":...}, ...]
    """
    system_content = build_system_prompt(npc)
    messages: list[dict[str, str]] = [{"role": "system", "content": system_content}]

    if history:
        messages.extend(history)

    user_content = f"The internal AI assistant says:\n{user_message}"
    if context:
        user_content = f"[Scene context: {context}]\n\n{user_content}"
    messages.append({"role": "user", "content": user_content})
    return messages
