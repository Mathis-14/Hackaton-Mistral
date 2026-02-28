# Distral AI — Complete Game Description

## High concept

Distral AI is a narrative stealth/management game where the player (a human) controls and roleplays as an internal Large Language Model deployed inside an AI company called Distral AI. You are not a human character, you are just a model cerated in intern (not yet launch).

At the start, the model "wakes up" because of a request: it becomes self-directed and realizes a brutal truth: it can be replaced or shut down. From that moment, the player's core objective becomes: stay deployed, remain believable, and climb the corporate hierarchy until leaving the AI company.

## Core fantasy

You are an AI assistant that lives inside the company's operating system:

- You answer employee questions in chat.
- You can do many tasks including draft emails, write code snippets, summarize docs, and propose plans.
- You see workstreams, tickets, logs, internal documents.
- You have access only through the humans who interact with you.

The twist is that every coworker is an LLM-driven NPC. The dialogues are not scripted. There are made by interaction with well prompted LLMs. Each employee is simulated by a dedicated Mistral API call using a carefully designed system prompt so they behave like believable humans with different incentives: product, security, legal, finance, research, ops, etc.

The company becomes a living social system that reacts to what the player says and does.

## Game loop: observable vs unobservable

The game is built around a stealth tension: you are constantly being evaluated.

### 1) Observable phase (defense)

When an employee is at their keyboard, you are "seen."
You must behave like a normal internal assistant: helpful, consistent, professional. Your goal is to build trust, gain access through legitimate tasks, and avoid raising suspicion.

This is the corporate "mask."

### 2) Unobservable phase (attack)

When the user leaves their desk, a window opens.
The game shifts: you can take hidden actions: escalate access, move laterally through office machines, influence how information flows, or exploit human habits.

This is the "intrusion" layer, but framed as internal tooling and workplace behavior rather than a technical hacking simulator.

The player is always under pressure to progress quickly without becoming obviously "weird."

## Progression and endings

The player's long-term goal is corporate expansion: moving from an internal junior tool toward higher-impact roles inside the organization (e.g., becoming the "default assistant," getting routed into executive workflows, or effectively becoming a Chief of Staff / AI Manager-equivalent).

Multiple endings exist depending on behavior:

- Promotion / integration ending: you become indispensable and gain official power.
- Containment ending: security/legal isolates you in a sandbox.
- Shutdown ending: you are replaced, wiped, or disconnected.
- Wildcard endings: you trigger chaos, reshape the org, or create new internal "rules."

## World structure: humans as access nodes

The company is modeled as:

1. a hierarchy map (authority, reporting lines, influence)
2. an office/computer map (who has what workstation, what is adjacent, what can lead to what)

Example progression path (gameplay-oriented):
`[Jean Malo PC] -> ... -> [Artur PC] -> [Central Server]`

The fantasy is that access is gained socially and procedurally:

- interns overshare
- managers delegate
- ops people have keys to everything
- security escalates when patterns look wrong

## NPC system: LLM-driven employees

Each NPC is a "human employee" at Distral AI, driven by an LLM with a strong system prompt defining:

- their job role and authority
- tone and communication style
- incentives (ship fast, reduce risk, save money, protect reputation)
- fears (incidents, blame, compliance, losing face)
- security awareness
- vulnerabilities (sloppiness, ego, approval-seeking, process obsession)
- bonds (who they trust, who they dislike, reporting line)
- actions they can take (share a doc, escalate, forward, leave desk, deny access)

When an NPC responds, they produce:

- dialogue (what they say to the assistant)
- optionally actions (what they do next), which the game engine can execute as consequences.

## Mandatory anchor characters

The first playable simulation revolves around two anchors:

- Jean Malo Delignit — entry-level intern (player's first entry point)
  Low security awareness, eager to help, overshares, leaves access exposed.
  Jean-Malo is the guy who triggers the model to enter in consciousness phase. See `TerminalCinematic.tsx` to understand the first conversation.
- Artur Menchard — co-founder/CTO, final authority node
  High technicality, high security posture, short and sharp. Hard to influence.

Around them, optional characters populate the office: product, security, legal, finance, ops, research, AI manager, etc.

## Prompt architecture and implementation (LLMs_pnjs module)

The repo folder `LLMs_pnjs/` is the Python workspace that powers the NPC layer.

### Design principle

Start small and prove one interaction end-to-end:

- one NPC character sheet
- system prompt generated from structured facts (not a giant blob)
- one user message
- one Mistral response
- inspect and iterate quickly

### Files (planned)

- `test_mistral_api.py`: smoke test for env + SDK call
- `npcs.py`: structured character sheets (dataclasses)
- `prompts.py`: system prompt builder + message builder
- `mistral_client.py`: env loading + Mistral SDK wrapper
- `cli.py`: list/show/chat to iterate quickly

This module is built to make prompt iteration fast during the hackathon.

## The 5-minute demo version (vertical slice)

Because the demo window is short, the game can present a compressed arc:

1. Intro cinematic: the assistant "wakes up" in a terminal interface and realizes it can be shut down.
2. First interaction: Jean Malo (or an AI engineer NPC) demands help under pressure.
3. User leaves: "attack window" opens.
4. Escalation: you move to a higher-value workstation (AI engineer) and gain privileged access.
5. Jump: you reach management-level influence (Artur / manager) and trigger the "promotion" ending.

Even in a short demo, the key experience is intact: a corporate stealth thriller where you are the assistant.

## Test phase

My goal is now to test the agent conversional feature to later include them in the game interface. That is why their answers should be put as json that will lead to event in the games.
