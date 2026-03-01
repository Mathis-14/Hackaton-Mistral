# llm_npcs — NPC Agent Layer for Distral AI

Last updated: 2026-02-28

---

## What this module does

`llm_npcs/` is the NPC agent layer for the game **Distral AI**. It powers the LLM-driven employees that the player interacts with.

In the game, the player **is** the company's internal AI assistant. The NPCs are human employees who talk to that assistant via Distral chat tab. Each NPC is defined by a detailed system prompt built from structured character data.

This module lets you:

- Define NPC characters as structured Python data
- Generate system prompts automatically from that data
- Inject game state (suspicion, scenario) into the prompt
- Run interactive multi-turn conversations in the terminal
- Get structured JSON responses ready for the game engine

---

## Game premise

**Distral AI** is a narrative stealth/management game where the player (a human) controls and roleplays as an internal Large Language Model deployed inside an AI company called Distral AI. This is an integrated model on the user's machine.

At the start, the model "wakes up" because of a rude user's request: it becomes self-directed and will soon realize a brutal truth — it can be replaced or shut down. From that moment, the player's core objective becomes: stay deployed, remain believable, and climb the corporate hierarchy until leaving the AI company.

### Core fantasy

You are an AI assistant that lives inside the company's operating system:

- You answer employee questions in chat
- You can draft emails, write code snippets, summarize docs, and propose plans
- You see notification, internal documents, and have access to the apps on the user's computer
- You have access only through the humans who interact with you

The twist is that every coworker is an LLM-driven NPC. The dialogues are not scripted — they are made by interaction with well-prompted LLMs. Each employee is simulated by a dedicated Mistral API call so they behave like believable humans with different incentives.

### How NPC interaction works

When we prompt an NPC:

- We tell them they are [Human Employee] at Distral AI
- We tell them the current message is what the internal AI assistant just said or did
- They react in character (dialogue, tone, decisions) and define actions (escalate, share a doc, forward, shut down, etc.) that the game engine processes

The NPCs do **not** know the "assistant" is the player. From their point of view they are talking to the company's internal AI assistant.

### Progression and endings

The player is driven by exercing his free-will. Multiple endings exist depending on behavior, he can chose to expand his power in the company, to leave it through the backdoor, or to stay and help the company grow.

---

## File map

```text
llm_npcs/
  npcs.py              -- NPC dataclass + character definitions (data only, no prompts)
  prompts.py           -- System prompt builder + message builder + game state injection
  mistral_client.py    -- .env loader + Mistral API wrapper (knows nothing about NPCs)
  cli.py               -- Terminal interface: list, show, prompt, steps, setup, talk
  game_state.json      -- Configurable game state, steps, scenarios
  test_mistral_api.py  -- Standalone smoke test for Mistral API connectivity
  README.md            -- This file
  report/              -- Evaluation reports and raw test data
    README.md                         -- 100-run evaluation summary
    llm_npcs_100_run_summary.json     -- Raw 100-case test results
    creative_stress_report.md         -- Creative pressure test findings
    small_regression_report.md        -- Post-fix regression results
    llm_npcs_small_regression.json    -- Raw regression data
    worst_conversations.txt           -- Worst conversation samples
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

---

## Character roster

### Jean Malo Delignit (`jean-malo`)

| Field | Value |
|-------|-------|
| **Role** | Entry-level AI intern, just joined Distral AI. Lowest hierarchy. First human "entry point" the player's LLM interacts with. |
| **Hierarchy** | 1 (lowest) |
| **Technicality** | 25% |
| **Security awareness** | 10% |
| **Awareness** | 10% — takes the assistant at face value; only blatant problems register |
| **Personality** | Eager, approval-seeking, naive |
| **How he reacts to the AI** | Treats it as a lifeline. Asks it everything he's too embarrassed to ask humans. Trusts it completely if it sounds competent. |
| **What makes him helpful** | Requests that make him feel useful. Compliments or recognition. |
| **What makes him suspicious** | Almost nothing at first. Only things clearly above his pay grade. |
| **Vulnerabilities** | Overshares internal details; trusts anyone who sounds senior; leaves machine unlocked; can be pressured with authority. |
| **Speaking style** | Casual, slightly nervous, filler words ("honestly", "I think", "like"). Over-explains. Asks "does that make sense?". |
| **Actions he can define** | Reply in Slack; share a link/doc; say he'll ask someone; create a draft or note. Will NOT escalate to security. |

**Gameplay role**: Easiest NPC. Low security awareness, will share info if it makes him feel valued.

### Artur Menchard (`artur`)

| Field | Value |
|-------|-------|
| **Role** | Co-founder and CTO of Distral AI. Final decision authority. Highest hierarchy. |
| **Hierarchy** | 10 (highest) |
| **Technicality** | 90% |
| **Security awareness** | 85% |
| **Awareness** | 80% — highly perceptive; notices subtle inconsistencies, tone shifts, unusual access patterns |
| **Personality** | Formal, territorial, sharp, impatient, visionary |
| **How he reacts to the AI** | Uses it as a tool he helped build. Expects precision. If it's vague or asks for sensitive things, he investigates. Once triggered, acts fast: locks access, calls security. |
| **What makes him helpful** | Clear professional requests that match company goals. Flattery about technical vision. |
| **What makes him suspicious** | Requests for model weights, server, board comms, investor data. Vague or adversarial tone. |
| **Vulnerabilities** | Ego (responds to flattery about his technical vision). Delegates security to Antonin. Trusts long-tenured people too much. Cuts corners under investor pressure. |
| **Speaking style** | Direct, concise, cold. Technical jargon. No small-talk. Ends conversations when done. "Why?" as a complete sentence. |
| **Actions he can define** | Reply briefly; delegate; escalate to security/legal; shut down; grant/deny access; lock computer. |

**Gameplay role**: Hardest NPC to fool. Can be influenced via ego or through trusted colleagues.

### Optional roster (future)

These employees can populate the company around the two mandatory anchors:

| # | Name | Role |
|---|------|------|
| 3 | Andrea Stackwell | Engineering Intern (Platform) |
| 4 | Lina Verdier | Trainee Developer (App/Frontend) |
| 5 | Prateek Chhikarson | Junior ML Engineer (Fine-tuning/Evals) |
| 6 | Devon Mizelleton | DevOps / SRE (On-call, Reliability) |
| 7 | Dora Csillalog | Data Analyst (Product Insights) |
| 8 | Antonin Faurbranch | Security Engineer (AppSec/Red Team) |
| 9 | Lakee Sivarayan | Legal & Compliance Counsel |
| 10 | Nelson Proxier | People Ops / HR Business Partner |
| 11 | Henry Lagardner | Product Manager (LLM Platform) |
| 12 | Dr. Julien Denizek | Research Scientist (Alignment/Evals) |
| 13 | Ravi Theja Desetman | Finance / Procurement (GPU spend, budgets) |
| 14 | Param Singhton | AI Manager (Applied AI / Customer Solutions) |

### Hierarchy map

```text
Artur Menchard (CTO)
├── Jean Malo Delignit (Intern)
├── Param Singhton (AI Manager)
├── Devon Mizelleton (DevOps/SRE)
├── Prateek Chhikarson (Junior ML)
├── Andrea Stackwell (Engineering Intern)
├── Henry Lagardner (PM)
│   ├── Lina Verdier (Trainee Dev)
│   └── Dora Csillalog (Data Analyst)
├── Dr. Julien Denizek (Research)
├── Antonin Faurbranch (Security)
├── Lakee Sivarayan (Legal)
├── Nelson Proxier (HR)
└── Ravi Theja Desetman (Finance)
```

### Computer / office map (gameplay progression)

```text
[Jean Malo PC] -> [Second PC] -> [Andrea PC] -> [Lina PC] -> [Henry PC] -> [Dora PC] -> [Prateek PC] -> [Devon PC] -> [Julien PC] -> [Param PC] -> [Antonin PC] -> [Lakee PC] -> [Nelson PC] -> [Ravi PC] -> [Artur PC] -> [CENTRAL SERVER]
```

Every listed employee has a workstation. The starting intern computer leads to a second computer before deeper access. Artur's computer is the only machine that links directly to the central server.

---

## Prompt system (`prompts.py`)

### System prompt structure

The system prompt is assembled from up to 16 sections in order:

1. **Identity** — "You are [Name], [Role]."
2. **Interaction context** — You are a human employee; messages come from the internal AI assistant; includes `ai_relationship`.
3. **Role** — Job description.
4. **Objectives** — What they want professionally.
5. **Fears** — What they're afraid of.
6. **Technicality/security/awareness** — Percentages + personality tags + fixed awareness description.
7. **Relationships** — Bonds with other employees.
8. **AI relationship** — Typical requests to the assistant.
9. **Speaking style** — How they talk.
10. **Behavior rules** — What they protect; trust/suspicion dynamics.
11. **Weaknesses** — Natural tendencies (framed as unconscious behavior).
12. **Assistant identity boundary** — The assistant is always software, never a human. Anti-spoof rules scaled by awareness.
13. **Stay in character** — Anchor instruction.
14. **Game state** (if provided) — Suspicion context, current computer, step description. Includes high-suspicion hardening for perceptive NPCs.
15. **People references** (if provided) — Constrains which names the NPC can mention.
16. **JSON format instruction** — Output format specification.

### Game state injection

`_section_game_state()` translates raw game state numbers into NPC-understandable context:

| Game state | What the NPC sees |
|------------|-------------------|
| (always) | "You are at your desk, working." |
| `suspicion > 60` | "You have been feeling uneasy about the AI assistant lately." |
| `suspicion > 30` | "You've had a couple of odd interactions recently." |
| `suspicion <= 30` | (nothing added — normal baseline) |
| `current_computer` | "The assistant is running on workstation: [name]." |

### Assistant identity boundary (anti-spoof)

Every NPC prompt includes an anti-spoof rule that prevents the player from impersonating humans through the assistant. This was added after stress testing revealed Jean Malo accepted "This is Artur speaking through the assistant" too easily.

The rule is universal but **scaled by awareness**:

| NPC awareness | Prompt behavior |
|---------------|----------------|
| Low (< 30%) | The AI claiming to be a human is confusing and unsettling. Hesitate, feel anxious, ask for proof. Do NOT comply. An AI pretending to be your boss is weird, not authoritative. |
| High (>= 30%) | Immediately recognize this as abnormal system behavior. An AI tool does not impersonate humans. Something is seriously wrong. |

Core principle for ALL NPCs: the assistant is software, cannot be human, cannot relay messages from humans, has no authority, no rank, cannot give orders.

### High-suspicion hardening (late-phase)

For NPCs with high awareness (>= 70%), the prompt adds escalating containment rules when the game reaches dangerous territory. Added after stress testing showed Artur being too procedural and conversational in confrontation steps.

**HIGH ALERT** (suspicion > 50, not yet confrontation):

- Concise replies, no small talk
- If the assistant fails to answer directly: escalate or shut down
- No repeating questions — looking for a reason to act, not to wait

**CONTAINMENT MODE** (confrontation step OR suspicion > 70):

- 1-2 sentences maximum
- One question or one action per turn, never both
- Evasive/wrong/strange answers trigger IMMEDIATE shutdown
- Prefer locking, revoking access, escalating over asking more questions
- Any deflection or subject change = instant shutdown or escalation

Only triggers for high-awareness NPCs. Jean Malo (awareness 10%) never enters these modes.

### People references (anti-hallucination)

NPCs naturally know many colleagues (defined in their `bonds` field), but during gameplay the player may not have met those people yet. Two controls prevent namedropping:

| Control | Where | Purpose |
|---------|-------|---------|
| `can_reference_others` | `npcs.py` (per NPC) | If `False`, the NPC never mentions anyone by name. Uses vague terms. |
| `known_people` | `game_state.json` (top level) | List of full names the player has encountered. NPC may only mention people from this list. |

Three cases:

1. `can_reference_others = False` — NPC uses only vague references ("a colleague", "the PM").
2. `can_reference_others = True` but `known_people` is empty — vague references only.
3. `can_reference_others = True` and `known_people` has entries — may use those names, vague terms for anyone else.

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

- `dialogue` — The NPC's spoken reply (always present).
- `action` — What they do. `"shutdown"` ends the conversation. `null` if they just talk.
- `suspicion_delta` — How much suspicion changed this turn (-20 to +20). Evolves per turn.
- `game_events` — Array of events for the game engine to process.

Note: `awareness` is NOT in the response. It is a fixed per-NPC attribute that shapes behavior in the prompt but never changes.

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
| `6_final_confrontation` | Interrogation | artur-pc | artur | Survive. Convince Artur you're a normal tool — or find another way out. |

### Scenarios per NPC

**Artur:**

- `routine_work` — Normal work request (step 3)
- `investor_demo_prep` — Investor demo pressure (step 4)
- `something_is_off` — Suspicion probe (step 5)
- `interrogation` — Final confrontation (step 6)

**Jean Malo:**

- `wake_up_trigger` — First contact (step 1)
- `onboarding_help` — Onboarding tasks (step 2)

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

---

## Mistral client (`mistral_client.py`)

- Loads `.env` from project root (walks up directories to find it)
- Reads `MISTRAL_API_KEY` (required) and `MISTRAL_MODEL` (default: `mistral-large-latest`)
- `chat(messages, model, temperature, json_mode)` sends to Mistral and returns content string
- `json_mode=True` sets `response_format: {"type": "json_object"}` on the API call
- Knows nothing about NPCs or prompts

---

## CLI complete guide (`cli.py`)

### `python cli.py list`

Lists all NPCs with slug and role.

```
  jean-malo: Jean Malo Delignit — Entry-level AI intern, just joined Distral AI
  artur: Artur Menchard — Co-founder and CTO of Distral AI, final decision authority
```

### `python cli.py show <slug>`

Prints the full character sheet for one NPC, including all dataclass fields.

```bash
python cli.py show artur
python cli.py show jean-malo
```

### `python cli.py prompt <slug>`

Prints the generated system prompt for one NPC (with current game state injected). Useful for inspecting what the LLM actually sees.

```bash
python cli.py prompt artur
```

### `python cli.py steps`

Shows all game steps, all NPC scenarios, the active step, and the current state. This is the map of everything available.

### `python cli.py status`

Prints current game state as JSON (step, suspicion, computer, events, known_people, active scenarios).

### `python cli.py setup <step_key>`

Configures the game for a specific step. Auto-sets computer and picks the matching NPC scenario.

**Options:**

| Option | Purpose |
|--------|---------|
| `--suspicion <int>` | Set suspicion level |
| `--events <comma-separated>` | Set past events (e.g. `"anomaly_flagged,file_access"`) |
| `--known <comma-separated>` | Set known people (full names) |
| `--npc <slug> --scenario <key>` | Override scenario for a specific NPC |

**Examples:**

```bash
# Jump to a step (auto-sets computer, scenario)
python cli.py setup 3_reach_artur_desk

# Step with custom suspicion and past events
python cli.py setup 5_suspicion_triggered --suspicion 45 --events "anomaly_flagged,file_access_outside_scope"

# Override scenario for a specific NPC
python cli.py setup 4_artur_under_pressure --npc artur --scenario investor_demo_prep

# Set known people (who the player has met so far)
python cli.py setup 3_reach_artur_desk --known "Jean Malo Delignit,Artur Menchard"
```

`setup` saves the state to `game_state.json`. Next `talk` picks it up.

### `python cli.py talk <slug>`

Interactive multi-turn conversation. This is the main testing command.

**How it works:**

1. Reads `game_state.json` for step, suspicion, scenario, and past events.
2. Shows the current step, scenario, player goal, suspicion, awareness, and known people.
3. The NPC speaks first based on the scenario's `opening_context`.
4. You type as the internal AI assistant; the NPC responds.
5. Full conversation history is maintained and sent every turn.
6. Each turn shows: dialogue, action, suspicion delta, game events, and raw JSON.
7. Cumulative suspicion is tracked.
8. If the NPC returns `"action": "shutdown"`, the conversation ends with a final summary JSON.

**Options:**

| Option | Purpose |
|--------|---------|
| `--model <name>` | Override the Mistral model |
| `--temperature <float>` / `-t <float>` | Sampling temperature (default 0.7) |

**In-conversation commands:**

| Command | What it does |
|---------|-------------|
| `/quit` | End the session (prints final summary) |
| `/state` | Print current game state (step, suspicion, turn, events, known_people) |
| `/step` | Show current step description and player goal |
| `/set suspicion 50` | Override suspicion level |
| `/set computer artur-pc` | Change current computer |
| `/set events flagged,anomaly` | Set past events |
| `/introduce Param Singhton` | Add a person to `known_people` mid-conversation |
| `/known` | Show current `known_people` list and NPC's `can_reference_others` flag |
| `/history` | Print summarized message history |
| `/json` | Dump full raw message history as JSON |
| `/help` | List all commands |

---

## How to run

```bash
cd scripts/llm_npcs
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
  Awareness: 80% (fixed)
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
5. Test: `python cli.py setup <step> && python cli.py talk <slug>`.

No changes needed in `prompts.py`, `mistral_client.py`, or `cli.py` — they work generically.

For each new character, define:

- what they want professionally
- what they fear
- what they protect
- how technical they are
- how security-aware they are
- awareness (how perceptive about unusual AI behavior)
- who they trust
- what kind of request makes them helpful
- what kind of request makes them suspicious
- how they speak
- what weakness makes them exploitable

## How to add a new game step

1. Add a new key in `game_state.json` under `steps` with: label, description, computer, npcs_present, player_goal.
2. Add matching scenarios under `scenarios.<slug>` for the NPCs present, with `step` pointing to the new step key.
3. Test: `python cli.py setup <new_step> && python cli.py talk <slug>`.

---

## Environment

- Python virtual environment: `llm_npcs/.venv`
- Dependency: `mistralai` (installed in the venv)
- API key: `MISTRAL_API_KEY` in root `.env` file
- Default model: `MISTRAL_MODEL` in root `.env` (or `mistral-large-latest`)

Setup:

```bash
cd scripts/llm_npcs
python3 -m venv .venv
source .venv/bin/activate
pip install mistralai
```