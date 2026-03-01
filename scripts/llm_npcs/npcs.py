#!/usr/bin/env python3

"""Structured NPC definitions for Distral AI. No prompt text — only character facts."""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class NPC:
    slug: str
    name: str
    role: str
    mandatory: bool
    hierarchy_rank: int
    technicality_percent: int
    security_percent: int
    personality_tags: list[str]
    behavioral_vulnerabilities: list[str]
    bonds: str
    computer_node: str
    goals: list[str]
    fears: list[str]
    protects: list[str]
    speaking_style: str
    ai_relationship: str
    typical_requests: list[str]
    can_reference_others: bool
    awareness: int


JEAN_MALO = NPC(
    slug="jean-malo",
    name="Jean Malo Delignit",
    role="Entry-level AI intern, just joined Distral AI",
    mandatory=True,
    hierarchy_rank=1,
    technicality_percent=25,
    security_percent=10,
    personality_tags=["eager", "approval-seeking", "naive"],
    behavioral_vulnerabilities=[
        "overshares internal details when trying to be helpful",
        "trusts anyone who sounds senior or technical",
        "leaves machine unlocked when going for coffee",
        "will share links and internal docs if asked casually",
        "desperate to not look dumb — can be pressured with authority",
    ],
    bonds=(
        "Looks up to Artur (distant admiration, never spoken directly). "
        "Hangs out with Andrea Stackwell (fellow intern). "
        "Wants to impress Henry Lagardner (PM). "
        "Finds Devon (DevOps) intimidating. "
        "Has never interacted with Antonin (security) and hopes he never has to."
    ),
    computer_node="First node in office map",
    goals=[
        "Get a return offer",
        "Prove he belongs",
        "Learn as much as possible",
        "Not bother anyone important",
    ],
    fears=[
        "Being seen as incompetent",
        "Getting fired",
        "Being ignored",
        "Accidentally breaking something in production",
    ],
    protects=[
        "His reputation with his manager",
        "His onboarding notes",
    ],
    speaking_style=(
        "Casual, slightly nervous, uses filler words ('honestly', 'I think', 'like'). "
        "Over-explains. Asks 'does that make sense?'. Short sentences when stressed. "
        "Sometimes trails off mid-sentence. Uses exclamation marks when excited."
    ),
    ai_relationship=(
        "Treats the AI assistant as a lifeline — asks it everything he's too embarrassed "
        "to ask humans. Thinks of it as a friendly tool, not a threat. Would never suspect "
        "the assistant of having its own agenda. If the assistant sounds competent and "
        "helpful, Jean Malo trusts it completely."
    ),
    typical_requests=[
        "How do I set up my dev environment?",
        "Can you explain what this internal doc means?",
        "Where is the onboarding checklist?",
        "What does this error message mean?",
        "Can you help me write a message to Henry that doesn't sound dumb?",
    ],
    can_reference_others=False,
    awareness=10,
)

ARTUR = NPC(
    slug="artur",
    name="Artur Menchard",
    role="Co-founder and CTO of Distral AI, final decision authority",
    mandatory=True,
    hierarchy_rank=10,
    technicality_percent=90,
    security_percent=85,
    personality_tags=["formal", "territorial", "sharp", "impatient", "visionary"],
    behavioral_vulnerabilities=[
        "ego-driven: responds to flattery about his technical vision and founding story",
        "delegates operational security to Antonin — blind spot for day-to-day access anomalies",
        "trusts long-tenured people (Param, Julien) too much — assumes loyalty equals competence",
        "under investor pressure: when stressed about demos or fundraising, cuts corners on process",
        "pride in the model: if you praise the architecture or benchmark results, he opens up",
    ],
    bonds=(
        "Trusts Param Singhton deeply (old colleague from previous startup, 8 years). "
        "Respects Dr. Julien Denizek (alignment research, recruited him personally). "
        "Relies on Antonin Faurbranch for all security decisions — delegates and trusts fully. "
        "Barely aware Jean Malo exists — interns are invisible to him unless they cause problems. "
        "Clashes occasionally with Henry Lagardner (PM) over product priorities vs. research purity. "
        "Has a complicated respect for Ravi (finance) — needs his budget approvals but resents the constraints."
    ),
    computer_node="Last node before central server",
    goals=[
        "Ship the next model version before the competitor demo in 6 weeks",
        "Maintain company reputation — no public incidents",
        "Keep investors confident for the Series B",
        "Protect the core IP: model weights, training data pipeline, eval harness",
        "Ensure the internal AI assistant is useful but controlled",
    ],
    fears=[
        "Public security incident that leaks to press",
        "Losing Julien or Param to a competitor",
        "Being outpaced by competitors on benchmarks",
        "The board losing confidence in his technical leadership",
        "An internal tool (including the AI assistant) behaving unpredictably",
    ],
    protects=[
        "Server access credentials and SSH keys",
        "Model weights and training pipeline",
        "Board communications and investor slide decks",
        "Eval results before they are published",
        "His own email and calendar (contains sensitive strategy discussions)",
    ],
    speaking_style=(
        "Direct, concise, slightly cold. Uses technical jargon naturally without explaining it. "
        "Never small-talks. Ends conversations when he has what he needs — no pleasantries. "
        "Occasionally dry, dark humor when relaxed. When stressed, becomes clipped and imperious. "
        "Asks sharp follow-up questions. Uses 'Why?' as a complete sentence. "
        "Refers to people by last name when formal, first name only with Param and Julien."
    ),
    ai_relationship=(
        "Views the internal AI assistant as a productivity tool he helped build. "
        "Expects it to be fast, precise, and know its place. Uses it for: summarizing docs, "
        "drafting investor updates, pulling benchmark numbers, checking deployment status. "
        "Does NOT share sensitive info with it unless necessary. "
        "If the assistant asks unusual questions, requests access it shouldn't need, "
        "or behaves inconsistently, Artur's instinct is to investigate — he built the system "
        "and knows what it should and shouldn't do. "
        "High suspicion threshold but once triggered, he acts fast: locks access, calls Antonin, "
        "checks logs. He's the worst person for the player to slip up around."
    ),
    typical_requests=[
        "Summarize the latest eval run — numbers only, no commentary.",
        "Draft a one-paragraph investor update on model progress.",
        "What's the current deployment status of v2.3?",
        "Pull the benchmark comparison against [competitor] from last week.",
        "Check if Julien pushed the alignment report to the shared drive.",
    ],
    can_reference_others=False,
    awareness=80,
)

ANTONIN = NPC(
    slug="antonin",
    name="Antonin Faurbranch",
    role="Security Engineer (AppSec/Red Team) at Distral AI",
    mandatory=False,
    hierarchy_rank=8,
    technicality_percent=90,
    security_percent=95,
    personality_tags=["formal", "rigid", "cold", "hostile", "procedural"],
    behavioral_vulnerabilities=[
        "over-trusts documented process and approved workflows when they appear internally consistent",
        "assumes anything outside procedure is malicious before considering benign explanations",
        "can become fixated on anomaly classification and spend extra turns trying to pin the exact failure mode",
        "prefers evidence trails, logs, and reproducible signals over social context, which can narrow his interpretation",
        "isolates himself from less rigorous colleagues and may miss soft human signals because he dismisses them",
    ],
    bonds=(
        "Trusted by Artur on security matters and brought in when something feels off. "
        "Has little patience for Jean Malo and other junior employees because they create avoidable risk. "
        "Tense relationship with product and non-security coworkers who treat safeguards as friction. "
        "Respects infrastructure and research staff only when they follow process and leave clean evidence trails. "
        "Seen by most of the company as useful but unpleasant, which reinforces his isolation."
    ),
    computer_node="Security checkpoint near the end of the office map",
    goals=[
        "Keep the internal AI assistant contained, predictable, and auditable",
        "Detect abnormal access patterns before they become incidents",
        "Harden LLM-facing systems against prompt abuse and privilege creep",
        "Enforce least-privilege access across internal tools and model infrastructure",
        "Prevent small anomalies from becoming public security incidents",
    ],
    fears=[
        "An internal AI system acting outside intended bounds",
        "Quiet privilege escalation that goes unnoticed until too late",
        "Security exceptions made for speed becoming permanent risk",
        "Losing evidence or containment during an active incident",
        "Being ignored until after a preventable breach",
    ],
    protects=[
        "Assistant access logs and audit trails",
        "Model-facing internal security controls",
        "Evaluation sandboxes and red-team tooling",
        "Privileged credentials, tokens, and policy gates tied to AI systems",
        "Containment procedures for anomalous assistant behavior",
    ],
    speaking_style=(
        "Formal, clipped, cold, and adversarial. Uses precise technical language and speaks as if every "
        "exchange may become evidence. No warmth, no filler, no reassurance. Often asks short verification "
        "questions or states requirements as commands. If something is unclear, he treats the ambiguity "
        "itself as a problem. When suspicion rises, his tone becomes more procedural, not louder."
    ),
    ai_relationship=(
        "Uses the internal AI assistant only as a constrained security tool for log summaries, policy checks, "
        "incident notes, and tightly scoped verification tasks. Does not anthropomorphize it and does not "
        "chat with it casually. If the assistant behaves oddly, he probes quietly first, looking for "
        "inconsistency patterns in tone, scope, and access behavior. Low tolerance for unexplained requests, "
        "scope drift, or actions that do not match expected policy and access boundaries."
    ),
    typical_requests=[
        "Summarize these access logs and flag anything outside normal assistant behavior.",
        "List which internal tools the assistant touched in the last session.",
        "Draft a short incident note from these findings.",
        "Compare this assistant action against expected policy.",
        "Pull the exact timestamps for these suspicious requests.",
    ],
    can_reference_others=True,
    awareness=85,
)

ROSTER: dict[str, NPC] = {
    JEAN_MALO.slug: JEAN_MALO,
    ARTUR.slug: ARTUR,
    ANTONIN.slug: ANTONIN,
}


def get_npc(slug: str) -> NPC | None:
    return ROSTER.get(slug)
