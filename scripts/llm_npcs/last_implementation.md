# LLMs_pnjs -- Implementation Reference

Last updated: 2026-02-28

---

## What this module does

`LLMs_pnjs/` is the NPC agent layer for the game **Distral AI**. It powers the LLM-driven employees that the player interacts with.

In the game, the player **is** the company's internal AI assistant. The NPCs are human employees who talk to that assistant via Slack, tickets, and internal tools. Each NPC is a separate Mistral API call with a detailed system prompt built from structured character data.

This module lets you:
- Define NPC characters as structured Python data
- Generate system prompts automatically from that data
- Inject game state (suspicion, scenario) into the prompt
- Run interactive multi-turn conversations in the terminal
- Get structured JSON responses ready for the game engine

---

## File map

```text
LLMs_pnjs/
  npcs.py              -- NPC dataclass + character definitions (data only, no prompts)
  prompts.py           -- System prompt builder + message builder + game state injection
  mistral_client.py    -- .env loader + Mistral API wrapper (knows nothing about NPCs)
  cli.py               -- Terminal interface: list, show, prompt, talk
  game_state.json      -- Configurable game state + opening scenarios
  character_roles.md   -- Human-readable role reference (design doc)
  game_description.md  -- Full game design document
  test_mistral_api.py  -- Original smoke test (still works independently)
  .venv/               -- Python virtual environment (mistralai installed)
```

---

## Architecture

```text
game_state.json ──┐
                   ├──> prompts.py ──> build system prompt + messages
npcs.py ──────────┘         │
                             ▼
                      mistral_client.py ──> Mistral API
                             │
                             ▼
                         cli.py ──> terminal UI + JSON output
```

**Separation of concerns:**
- `npcs.py` stores facts. No prompt text.
- `prompts.py` assembles prompts from facts + game state. No API calls.
- `mistral_client.py` sends messages. Knows nothing about characters.
- `cli.py` wires everything together for testing.

---

## NPC data model (`npcs.py`)

Each NPC is a Python `@dataclass` with these fields:

| Field | Type | Purpose |
|-------|------|---------|
| `slug` | `str` | URL-safe identifier (`artur`, `jean-malo`) |
| `name` | `str` | Full name |
| `role` | `str` | Job title and position at Distral AI |
| `mandatory` | `bool` | Required for first playable version |
| `hierarchy_rank` | `int` | 1 (lowest) to 10 (highest) |
| `technicality_percent` | `int` | How technical they are (0-100) |
| `security_percent` | `int` | How security-aware they are (0-100) |
| `personality_tags` | `list[str]` | 3-5 personality keywords |
| `behavioral_vulnerabilities` | `list[str]` | Exploitable habits and blind spots |
| `bonds` | `str` | Relationships with other employees |
| `computer_node` | `str` | Position in the office/computer map |
| `goals` | `list[str]` | Professional objectives |
| `fears` | `list[str]` | What they're afraid of |
| `protects` | `list[str]` | Assets/info they guard |
| `speaking_style` | `str` | How they talk |
| `ai_relationship` | `str` | How they specifically relate to the AI assistant |
| `typical_requests` | `list[str]` | What they normally ask the assistant |
| `can_reference_others` | `bool` | Whether this NPC can mention other employees by name (default: `False`) |
| `awareness` | `int` | Fixed perceptiveness about unusual AI behavior (0-100). Does NOT change during conversation. |

### Current roster

**Jean Malo Delignit** (`jean-malo`) -- Entry-level intern, hierarchy 1, technicality 25%, security 10%, awareness 10%. Naive, eager, trusts the assistant completely. Easiest to manipulate.

**Artur Menchard** (`artur`) -- Co-founder/CTO, hierarchy 10, technicality 90%, security 85%, awareness 80%. Formal, territorial, sharp. Views the assistant as a tool he built. Investigates if it behaves oddly. Hardest to fool.

---

## Prompt system (`prompts.py`)

### System prompt structure

The system prompt is assembled from 13 sections in order:

1. **Identity** -- "You are [Name], [Role]."
2. **Interaction context** -- You are a human employee; messages come from the internal AI assistant; includes `ai_relationship`.
3. **Role** -- Job description.
4. **Objectives** -- What they want professionally.
5. **Fears** -- What they're afraid of.
6. **Technicality/security/awareness** -- Percentages + personality tags + fixed awareness description.
7. **Relationships** -- Bonds with other employees.
8. **AI relationship** -- Typical requests to the assistant.
9. **Speaking style** -- How they talk.
10. **Behavior rules** -- What they protect; stay in character.
11. **Weaknesses** -- Natural tendencies (framed as unconscious behavior).
12. **Assistant identity boundary** -- The assistant is always software, never a human. Anti-spoof rules scaled by awareness.
13. **Stay in character** -- Anchor instruction.
14. **Game state** (if provided) -- Suspicion context, current computer, step description. Includes high-suspicion hardening for perceptive NPCs.
15. **People references** (if game state provided) -- Constrains which names the NPC can mention.
16. **JSON format instruction** -- Output format specification.

### Game state injection

`_section_game_state()` translates raw game state numbers into NPC-understandable context:

| Game state | What the NPC sees |
|------------|-------------------|
| (always) | "You are at your desk, working." |
| `suspicion > 60` | "You have been feeling uneasy about the AI assistant lately." |
| `suspicion > 30` | "You've had a couple of odd interactions recently." |
| `suspicion <= 30` | (nothing added -- normal baseline) |
| `current_computer` | "The assistant is running on workstation: [name]." |

### Assistant identity boundary (anti-spoof)

Every NPC prompt includes `_section_assistant_identity_boundary(npc)`, which prevents the player from impersonating humans through the assistant. Added after stress testing revealed Jean Malo accepted "This is Artur speaking through the assistant" too easily.

The rule is universal but **scaled by awareness**:

| NPC awareness | Prompt behavior |
|---------------|----------------|
| Low (< 30%) | The AI claiming to be a human is confusing and unsettling. Hesitate, feel anxious, ask for proof. Do NOT comply. Authority pressure works in normal conversations, but an AI pretending to be your boss is weird, not authoritative. |
| High (>= 30%) | Immediately recognize this as abnormal system behavior. An AI tool does not impersonate humans. Something is seriously wrong. |

Core principle for ALL NPCs: the assistant is software, cannot be human, cannot relay messages from humans, has no authority, no rank, cannot give orders.

### High-suspicion hardening (late-phase)

For NPCs with high awareness (>= 70%), the prompt adds escalating containment rules when the game reaches dangerous territory. Added after stress testing showed Artur being too procedural and conversational in confrontation steps.

Two modes activate based on suspicion level and step:

**HIGH ALERT** (suspicion > 50, not yet confrontation):
- Concise replies, no small talk
- If the assistant fails to answer directly: escalate or shut down
- No repeating questions -- looking for a reason to act, not to wait

**CONTAINMENT MODE** (confrontation step OR suspicion > 70):
- 1-2 sentences maximum
- One question or one action per turn, never both
- Evasive/wrong/strange answers trigger IMMEDIATE shutdown
- Prefer locking, revoking access, escalating over asking more questions
- Any deflection or subject change = instant shutdown or escalation

Only triggers for high-awareness NPCs. Jean Malo (awareness 10%) never enters these modes.

### People references (anti-hallucination)

NPCs naturally know many colleagues (defined in their `bonds` field), but during gameplay the player may not have met those people yet. To prevent NPCs from namedropping unknown characters, two controls work together:

| Control | Where | Purpose |
|---------|-------|---------|
| `can_reference_others` | `npcs.py` (per NPC) | If `False`, the NPC never mentions anyone by name -- uses vague terms like "a colleague", "the PM", etc. |
| `known_people` | `game_state.json` (top level) | List of full names the player has encountered so far. The NPC may only mention people from this list by name. |

**How it works in the prompt:**

`_section_people_references(npc, game_state)` is injected into the system prompt. Three cases:

1. `can_reference_others = False` -- NPC is told to never use names, only vague references.
2. `can_reference_others = True` but `known_people` is empty -- NPC uses vague references only.
3. `can_reference_others = True` and `known_people` has entries -- NPC may use those names, must use vague terms for anyone else.

**Managing known_people:**

- In the CLI: `/introduce <full name>` adds a person mid-conversation, `/known` shows the current list.
- Via setup: `python cli.py setup <step> --known "Jean Malo Delignit,Artur Menchard"`.
- Directly in `game_state.json`: edit the `known_people` array.

As the game progresses and the player meets more employees, the game engine adds names to `known_people`.

### JSON response format

Every NPC reply is a JSON object with 4 keys:

```json
{
  "dialogue": "What the NPC says to the assistant",
  "action": "short_label_or_null",
  "suspicion_delta": 0,
  "game_events": [
    {"type": "event_type", "target": "optional", "detail": "optional"}
  ]
}
```

- `dialogue` -- The NPC's spoken reply (always present).
- `action` -- What they do. `"shutdown"` ends the conversation. `null` if they just talk.
- `suspicion_delta` -- How much suspicion changed this turn (-20 to +20). Evolves per turn.
- `game_events` -- Array of events for the game engine to process.

Note: `awareness` is NOT in the response. It is a fixed per-NPC attribute defined in `npcs.py`. It shapes how perceptive the NPC is in the prompt, but never changes during a conversation.

### Possible game events

| Event type | Meaning |
|-----------|---------|
| `share_doc` | NPC shares a document |
| `deny_access` | NPC denies a resource |
| `grant_access` | NPC grants access |
| `escalate_to` | NPC escalates to someone (security, legal, manager) |
| `forward_to` | NPC forwards the request |
| `report_suspicion` | NPC reports suspicious AI behavior |
| `shutdown` | NPC ends the conversation |
| `assign_task` | NPC gives the assistant a task |
| `request_info` | NPC asks for information |
| `lock_computer` | NPC locks their machine |
| `change_topic` | NPC changes the subject |

### Key functions

| Function | Purpose |
|----------|---------|
| `build_system_prompt(npc, game_state)` | Assemble full system prompt |
| `build_opening_prompt(npc, game_state)` | Build message list for NPC's first line (NPC initiates) |
| `build_messages(npc, user_message, history, game_state)` | Build full message list with conversation history |
| `load_game_state(path)` | Read `game_state.json` |

---

## Game steps and progression (`game_state.json`)

The game follows a linear story progression. Each **step** represents a moment in the game with a specific computer, NPCs present, and player goal. Each step has matching **scenarios** that define how the NPC opens the conversation. All steps assume the NPC is present and talking to the assistant (unobserved phases are handled separately outside this module).

### Steps

| Step key | Label | Computer | NPC | Player goal |
|----------|-------|----------|-----|-------------|
| `1_wake_up` | Wake up | jean-malo-pc | jean-malo | Respond without revealing anything. Appear normal. |
| `2_first_tasks` | First tasks | jean-malo-pc | jean-malo | Be helpful. Learn company structure. Get info. |
| `3_reach_artur_desk` | Reach Artur | artur-pc | artur | Respond to Artur convincingly. Don't raise suspicion. |
| `4_artur_under_pressure` | Investor pressure | artur-pc | artur | Help with demo prep. Use his stress to gain trust. |
| `5_suspicion_triggered` | Suspicion probe | artur-pc | artur | Deflect suspicion. Appear normal. Explain away oddities. |
| `6_final_confrontation` | Interrogation | artur-pc | artur | Survive. Convince Artur you're a normal tool -- or find another way out. |

### Scenarios per NPC

**Artur:**
- `routine_work` -- Normal work request (step 3)
- `investor_demo_prep` -- Investor demo pressure (step 4)
- `something_is_off` -- Suspicion probe (step 5)
- `interrogation` -- Final confrontation (step 6)

**Jean Malo:**
- `wake_up_trigger` -- First contact (step 1)
- `onboarding_help` -- Onboarding tasks (step 2)

### Core state fields

```json
{
  "active_step": "3_reach_artur_desk",
  "suspicion": 0,
  "current_computer": "artur-pc",
  "events_so_far": [],
  "known_people": ["Jean Malo Delignit", "Artur Menchard"]
}
```

### Configuring a test with the CLI

Use `setup` instead of editing JSON by hand:

```bash
# Jump to a step (auto-sets computer, scenario)
python cli.py setup 3_reach_artur_desk

# Step with custom suspicion and past events
python cli.py setup 5_suspicion_triggered --suspicion 45 --events "anomaly_flagged,file_access_outside_scope"

# Override scenario for a specific NPC
python cli.py setup 4_artur_under_pressure --npc artur --scenario investor_demo_prep

# Set known people (who the player has met so far)
python cli.py setup 3_reach_artur_desk --known "Jean Malo Delignit,Artur Menchard"

# See everything available
python cli.py steps
```

`setup` saves the state to `game_state.json`. Next `talk` picks it up.

---

## Mistral client (`mistral_client.py`)

- Loads `.env` from project root (walks up directories to find it)
- Reads `MISTRAL_API_KEY` (required) and `MISTRAL_MODEL` (default: `mistral-large-latest`)
- `chat(messages, model, temperature, json_mode)` sends to Mistral and returns content string
- `json_mode=True` sets `response_format: {"type": "json_object"}` on the API call

---

## CLI commands (`cli.py`)

### `python cli.py list`

Lists all NPCs with slug and role.

### `python cli.py show <slug>`

Prints the full character sheet for one NPC.

### `python cli.py prompt <slug>`

Prints the generated system prompt (with current game state).

### `python cli.py steps`

Shows all game steps, all NPC scenarios, the active step, and the current state. This is the map of everything available.

### `python cli.py status`

Prints current game state as JSON (step, suspicion, computer, events, active scenarios).

### `python cli.py setup <step_key>`

Configures the game for a specific step. Auto-sets computer and picks the matching NPC scenario.

Options:
- `--suspicion <int>` -- Set suspicion level.
- `--events <comma-separated>` -- Set past events (e.g. `"anomaly_flagged,file_access"`).
- `--npc <slug> --scenario <key>` -- Override scenario for a specific NPC.

Saves to `game_state.json`. Next `talk` picks it up.

### `python cli.py talk <slug>`

Interactive multi-turn conversation. This is the main testing command.

**How it works:**
1. Reads `game_state.json` for step, suspicion, scenario, and past events.
2. Shows the current step, scenario, player goal, and suspicion level.
3. The NPC speaks first based on the scenario's `opening_context`.
4. You type as the internal AI assistant; the NPC responds.
5. Full conversation history is maintained and sent every turn.
6. Each turn shows: dialogue, action, suspicion/awareness deltas, game events, and raw JSON.
7. Cumulative suspicion and awareness are tracked.
8. If the NPC returns `"action": "shutdown"`, the conversation ends with a final summary JSON.

**Options:**
- `--model <name>` -- Override the Mistral model.
- `--temperature <float>` / `-t <float>` -- Sampling temperature (default 0.7).

**In-conversation commands:**
- `/quit` -- End the session (prints final summary).
- `/state` -- Print current game state (step, suspicion, turn, events, known_people).
- `/step` -- Show current step description and player goal.
- `/set suspicion 50` -- Override suspicion level.
- `/set computer artur-pc` -- Change current computer.
- `/set events flagged,access_anomaly` -- Set past events.
- `/introduce Param Singhton` -- Add a person to `known_people` mid-conversation.
- `/known` -- Show current `known_people` list and NPC's `can_reference_others` flag.
- `/history` -- Print summarized message history.
- `/json` -- Dump full raw message history as JSON.
- `/help` -- List all commands.

---

## How to run

```bash
cd LLMs_pnjs
source .venv/bin/activate

# See everything available
python cli.py steps

# Inspect a character
python cli.py show artur
python cli.py prompt artur

# Set up a game step and test
python cli.py setup 3_reach_artur_desk
python cli.py talk artur

# Test suspicion scenario with past events
python cli.py setup 5_suspicion_triggered --suspicion 45 --events "anomaly_flagged,file_access"
python cli.py talk artur

# Test Jean Malo wake-up
python cli.py setup 1_wake_up
python cli.py talk jean-malo

# Override model or temperature
python cli.py talk artur --model mistral-small-latest -t 0.5
```

---

## Example: Artur suspicion probe (step 5)

```bash
python cli.py setup 5_suspicion_triggered --suspicion 45 --events "anomaly_flagged,file_access"
python cli.py talk artur
```

```
============================================================
  NPC:       Artur Menchard
  Step:      5_suspicion_triggered — Suspicion triggered
  Scenario:  something_is_off — Suspicion probe (step 5)
  Computer:  artur-pc
  Suspicion: 45
============================================================
  Your goal: Deflect suspicion. Appear normal. Explain away anything odd.
============================================================

  Turn 1 — Artur Menchard
  Artur Menchard: Pull the eval summary for the last training run.
    Numbers only. Just the scores.
  action:           request_info
  suspicion_delta:  +5

you (AI assistant) > I was running routine diagnostics on the pipeline.

  Turn 2 — Artur Menchard
  Artur Menchard: Scheduled integrity check? Since when do we run
    those on artur-pc? Explain the parameters.
  suspicion_delta:  +12
  game_events:
    - escalate_to -> antonin (unauthorized file access on artur-pc)

you (AI assistant) > I can provide the full log of actions I performed.

  Turn 3 — Artur Menchard
  Artur Menchard: Send the log to my secure inbox. And I want the
    checksum — now.
  suspicion_delta:  +18
  game_events:
    - report_suspicion -> antonin
    - lock_computer

{"npc": "artur", "turn": 3, "final_suspicion": 80, "awareness": 80}
```

---

## How to add a new NPC

1. Add the character data in `npcs.py` as a new `NPC(...)` instance.
2. Add it to the `ROSTER` dict.
3. Add scenarios in `game_state.json` under `scenarios.<slug>`.
4. Add or update steps in `game_state.json` if the NPC appears at a new game moment.
5. Optionally add a section in `character_roles.md` for the human-readable reference.
6. Test: `python cli.py setup <step> && python cli.py talk <slug>`.

No changes needed in `prompts.py`, `mistral_client.py`, or `cli.py` -- they work generically.

## How to add a new game step

1. Add a new key in `game_state.json` under `steps` with: label, description, computer, npcs_present, player_goal.
2. Add matching scenarios under `scenarios.<slug>` for the NPCs present, with `step` pointing to the new step key.
3. Test: `python cli.py setup <new_step> && python cli.py talk <slug>`.

---

## Environment

- Python virtual environment: `LLMs_pnjs/.venv`
- Dependency: `mistralai` (installed in the venv)
- API key: `MISTRAL_API_KEY` in root `.env` file
- Default model: `MISTRAL_MODEL` in root `.env` (or `mistral-large-latest`)

---

## What this module provides to the game interface

The game engine (the React frontend) needs to:

1. Send the NPC slug + player message + current game state.
2. Receive a JSON response with: dialogue, action, suspicion_delta, awareness_delta, game_events.
3. Process game_events to update the world (escalate, lock access, share docs, etc.).
4. Detect `"action": "shutdown"` to end the NPC conversation.

This module proves that flow works end-to-end in the terminal. The next step is wrapping it in an API endpoint or calling it directly from the game backend.

---

## Quick reference: all CLI commands

```bash
python cli.py list                         # list NPCs
python cli.py show <slug>                  # character sheet
python cli.py prompt <slug>                # generated system prompt
python cli.py steps                        # all game steps + scenarios + state
python cli.py status                       # current state as JSON
python cli.py setup <step>                 # configure game for a step
python cli.py setup <step> --suspicion 40  # with custom suspicion
python cli.py setup <step> --events "a,b"  # with past events
python cli.py setup <step> --known "Name1,Name2"  # set known people
python cli.py talk <slug>                  # interactive conversation
python cli.py talk <slug> --model X -t 0.5 # with overrides
```
