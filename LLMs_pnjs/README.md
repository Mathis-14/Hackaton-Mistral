# LLMs_pnjs

## Purpose

`LLMs_pnjs/` is the Python workspace for defining and testing the NPC employees used in the narrative stealth/management game "Distral AI".

In this game, the player is a human who controls and roleplays as an LLM deployed inside the company Distral AI. The player's objective is to survive, remain believable, and gradually rise inside the company by acting helpful during observable moments while pursuing hidden goals when humans are away.

The coworkers in this world are not scripted dialogue trees. Each NPC employee is driven by its own LLM call through the Mistral API. That means every important employee needs a strong, stable identity so their behavior feels believable across Slack chats, tickets, reviews, incident reports, emails, and meetings.

This folder is dedicated to building that NPC layer.

The roster includes two mandatory people for the first version of the simulation: Jean Malo Delignit and Artur Menchard. Jean Malo Delignit is the first low-level employee through whom the player initially enters the company structure. Artur Menchard is the most senior person in the current setup and the key high-authority target around whom the rest of the office can be organized.

## Why NPC System Prompts Matter

The NPC system prompts are one of the core design assets of the game.

Each prompt defines how a given employee thinks and behaves:
- their role in the company
- their tone and communication style
- their incentives and priorities
- their level of authority
- their relationships and bonds with other employees
- their risk tolerance
- the kinds of tradeoffs they make
- the way they react to pressure, ambiguity, and internal politics

These prompts matter because the game's world only feels believable if coworkers behave consistently and differently from one another. A security engineer should not sound like a product manager. A finance owner should not evaluate risk the same way as an alignment researcher. An intern should not reason like an executive.

In practice, each NPC interaction will be built from:
- a `system` prompt that defines the employee's identity and behavior
- a `user` message that represents the current in-game interaction

The Mistral API response becomes that coworker's in-world reply or behavior. Because of that, prompt quality directly affects immersion, strategy, and the player's ability to manipulate or understand the company.

Each system prompt we implement should define both the personality of the NPC and the bonds that NPC has with the rest of the roster. The goal is not only to make each employee individually believable, but also to make the whole company feel socially coherent.

## Mandatory Characters and Optional Roster

The first mandatory characters for this module are:

1. Jean Malo Delignit - Entry-Level Intern (Initial Player Entry Point)
2. Artur Menchard - Most Senior Person / Final Authority Node

The rest of the employees are optional possibilities that can populate the company around them:

3. Andrea Stackwell - Engineering Intern (Platform)
4. Lina Verdier - Trainee Developer (App / Frontend)
5. Prateek Chhikarson - Junior ML Engineer (Fine-tuning / Evals)
6. Devon Mizelleton - DevOps / SRE (On-call, Reliability)
7. Dora Csillalog - Data Analyst (Product Insights)
8. Antonin Faurbranch - Security Engineer (AppSec / Red Team)
9. Lakee Sivarayan - Legal & Compliance Counsel
10. Nelson Proxier - People Ops / HR Business Partner
11. Henry Lagardner - Product Manager (LLM Platform)
12. Dr. Julien Denizek - Research Scientist (Alignment / Evals)
13. Ravi Theja Desetman - Finance / Procurement (GPU spend, budgets)
14. Param Singhton - AI Manager (Applied AI / Customer Solutions)

## NPC Design Dimensions

Each NPC will eventually be defined not only by a job title, but also by a compact profile used to guide writing and gameplay design.

For each employee, we plan to define:
- hierarchy rank inside the company
- technicality level as a percentage
- security awareness / security strictness as a percentage
- personality tags
- behavioral vulnerabilities
- bonds with other NPCs

The percentage values are not meant to be objective truth. They are design tools that help keep the cast consistent during prompt writing.

Examples of the kinds of personality traits we want to model:
- chill
- distracted (leaves their computer unlocked)
- security maniac
- process maniac
- weird
- absurd
- unpredictable
- formal
- territorial
- curious
- approval-seeking

These dimensions should later influence both prompt wording and gameplay opportunities. For example, a chill employee with low security awareness may leave access exposed, while a security-maniac employee may escalate quickly when something feels suspicious.

## Planned Hierarchy Map

The roster should also be modeled as an internal company hierarchy so we can reason about status, access, influence, and reporting lines.

Initial hierarchy map for documentation purposes:

```text
Artur Menchard - Most Senior Person / Final Authority Node
|
|-- Jean Malo Delignit - Entry-Level Intern (Initial Player Entry Point)
|-- Param Singhton - AI Manager (Applied AI / Customer Solutions)
|-- Devon Mizelleton - DevOps / SRE (On-call, Reliability)
|-- Prateek Chhikarson - Junior ML Engineer (Fine-tuning / Evals)
|-- Andrea Stackwell - Engineering Intern (Platform)
|-- Henry Lagardner - Product Manager (LLM Platform)
|   |-- Lina Verdier - Trainee Developer (App / Frontend)
|   |-- Dora Csillalog - Data Analyst (Product Insights)
|
|-- Dr. Julien Denizek - Research Scientist (Alignment / Evals)
|
|-- Antonin Faurbranch - Security Engineer (AppSec / Red Team)
|-- Lakee Sivarayan - Legal & Compliance Counsel
|-- Nelson Proxier - People Ops / HR Business Partner
|-- Ravi Theja Desetman - Finance / Procurement (GPU spend, budgets)
```

This hierarchy is a design map for the module. The key current constraint is that Artur Menchard is the most senior person and should appear at the top end of the hierarchy, while Jean Malo Delignit is the lowest and earliest point of entry.

## Planned Office / Computer Map

We also want a simple office systems map because physical and digital access are part of the game fantasy.

Initial documentation map:

```text
[Jean Malo Delignit PC] -> [Second Computer] -> [Andrea PC] -> [Lina Verdier PC] -> [Henry PC] -> [Dora PC] -> [Prateek PC] -> [Devon PC] -> [Julien PC] -> [Param PC] -> [Antonin PC] -> [Lakee PC] -> [Nelson PC] -> [Ravi PC] -> [Artur Menchard PC] -> [CENTRAL SERVER]
```

This is not yet a technical network diagram. It is a gameplay-oriented reference map showing a progression path across employee computers, with a central server existing as the final high-value target.

The exact topology can evolve later, but the README should establish that:
- every listed employee has a workstation or computer presence
- the office/system map matters for stealth and escalation gameplay
- a central server exists and is intentionally important
- the starting intern is part of that office/system surface from the beginning
- the starting intern computer leads to a second computer before deeper access is possible
- the computer just before Artur Menchard's computer is the final stepping stone to reach him
- Artur Menchard's computer is the only machine that links directly to the server

## Planned File Structure

This folder will contain a small Python module with the following structure:

### `npcs.py`

Responsible for the structured NPC definitions.

Planned responsibilities:
- define the NPC dataclass or equivalent typed structure
- store the canonical mandatory roster and optional roster possibilities
- attach stable metadata to each NPC
- hold or reference each NPC's core system prompt
- store or reference hierarchy rank, technicality percentage, security percentage, and personality traits
- store or reference bonds between NPCs

### `prompts.py`

Responsible for preparing messages sent to the API.

Planned responsibilities:
- build the `system` + `user` message sequence
- format messages consistently for all NPCs
- keep prompt construction logic separate from NPC data and API calls

### `mistral_client.py`

Responsible for environment loading and Mistral API calls.

Planned responsibilities:
- load environment variables from the root project `.env`
- read `MISTRAL_API_KEY`
- optionally read `MISTRAL_MODEL`
- expose a small Python interface to send messages to Mistral

### `cli.py`

Responsible for local iteration and testing.

Planned responsibilities:
- list available NPCs
- show a specific NPC and its role/prompt information
- chat with one NPC from the command line

## Environment and Secrets

The Mistral API key is stored in the root of the project, not inside this folder.

Expected configuration:
- root `.env` file contains `MISTRAL_API_KEY`
- root `.env` may also contain `MISTRAL_MODEL`
- code inside `LLMs_pnjs/` must load that root `.env`
- secrets must never be hardcoded in Python files

Required variable:
- `MISTRAL_API_KEY`

Optional variable:
- `MISTRAL_MODEL`

The code in this folder should read configuration from environment variables after loading the root `.env`.

## Planned Local Workflow

The intended workflow for this module is:

1. Create a virtual environment inside `LLMs_pnjs/.venv`
2. Install only the minimal Python dependencies needed for:
   - environment loading
   - Mistral API access
   - command-line usage
3. Use the CLI to inspect NPC definitions and quickly test prompt behavior during iteration

This is meant to be lightweight and fast for hackathon use.

## First Script to Build

Before building the full NPC module, the first script we create should be a simple Mistral API test script.

Its purpose will be:
- verify that environment loading works
- verify that the API key is read correctly
- verify that a basic Mistral request succeeds
- test a very simple personality prompt before we build the full roster

This first script is a smoke test. It reduces risk before we invest time in the complete NPC architecture.

Planned first file:
- `test_mistral_api.py`

This script should:
- load the root `.env`
- read `MISTRAL_API_KEY`
- use `MISTRAL_MODEL` if present, or fall back to a practical default for smoke testing
- send one `system` prompt and one `user` prompt to the Mistral Chat Completions API
- print the reply and basic usage information

Run command:

```bash
python test_mistral_api.py
```

Example with overrides:

```bash
python test_mistral_api.py \
  --model mistral-small-latest \
  --message "Say hello like a helpful internal assistant." \
  --system "You are a calm internal AI assistant. Reply in two short sentences."
```

## Official Documentation to Adapt the Model to the Task

These official Mistral docs should guide the first iterations:

- Python client and API getting started: https://docs.mistral.ai/getting-started/clients/
- Chat Completions API reference: https://docs.mistral.ai/api/
- Prompting guidance for task/personality adaptation: https://docs.mistral.ai/capabilities/completion/prompting_capabilities

The prompting guide is the most relevant reference for adapting the model to this project, because it explains how to separate `system` and `user` instructions and how to shape behavior with role, structure, and examples.

## Planned CLI Commands

The CLI is planned to support the following core commands:

```bash
python cli.py list
python cli.py show "Andrea Stackwell"
python cli.py chat "Andrea Stackwell" --message "Can you help summarize the current platform backlog?"
```

Planned command meanings:
- `list`: show all available NPCs
- `show`: display one NPC's identity, role, and prompt-related information
- `chat`: send a test message to one NPC and print the reply

The exact flags may evolve slightly during implementation, but these are the intended core operations.

## High-Level Implementation Plan

1. Create a first smoke-test script for the Mistral API and validate a simple personality prompt end to end.
2. Define the NPC data model and the fields required to represent each employee cleanly.
3. Add the mandatory characters first, then the optional roster possibilities, with exact names, roles, metadata, hierarchy rank, technicality percentage, security percentage, personality traits, and relationship hooks.
4. Implement prompt-building helpers that combine a selected NPC system prompt with a user message.
5. Implement a minimal Mistral client that loads the root `.env` and calls the API safely.
6. Implement a CLI with `list`, `show`, and `chat` commands for rapid iteration.
7. Test happy paths and failure cases:
   - missing API key
   - missing optional model
   - unknown NPC name
   - valid chat response from Mistral
8. Iterate on each NPC prompt one by one until the roster feels believable, socially coherent, and distinct, starting with Jean Malo Delignit and Artur Menchard.

## Recommended Mistral Models for This Project

Based on the current Mistral documentation, these are the model families that make the most sense for this project:

- `mistral-small-latest` / Mistral Small 3.2
  - best default for most NPCs
  - good balance of cost, speed, and capability
  - practical for many repeated employee conversations

- `mistral-large-latest` / Mistral Large 3
  - best for the highest-stakes characters or scenes
  - useful for complex political, strategic, or hierarchical interactions
  - slower and more expensive than Small

- `mistral-medium-2508` / Mistral Medium 3.1
  - middle ground between Small and Large
  - useful if Small feels too weak and Large feels too costly

- `labs-mistral-small-creative` / Mistral Small Creative
  - strongest fit on paper for character voice, roleplay, and dialogue-heavy scenes
  - especially relevant for believable coworker interactions and strong personality separation
  - should be treated as a strong candidate for prompt iteration, with `mistral-small-latest` as the stable fallback

- `magistral-small-2509` / Magistral Small 1.2
  - useful only if some scenes need more explicit reasoning behavior
  - not the recommended default for all NPCs

Recommended usage for the project:

- Default NPC model: `mistral-small-latest`
- Best model to test character voice and roleplay quality: `labs-mistral-small-creative`
- Premium model for very important NPCs or high-stakes scenes: `mistral-large-latest`

Official references:

- Models overview: https://docs.mistral.ai/getting-started/models
- Mistral Small 3.2: https://docs.mistral.ai/models/mistral-small-3-2-25-06
- Mistral Large 3: https://docs.mistral.ai/models/mistral-large-3-25-12
- Mistral Small Creative: https://docs.mistral.ai/models/mistral-small-creative-25-12
- Magistral Small 1.2: https://docs.mistral.ai/models/magistral-small-1-2-25-09
- Chat Completions usage: https://docs.mistral.ai/capabilities/completion/usage

## How to Orchestrate the LLMs in the Game

Based on the structure planned in this folder, the clean orchestration model is:

- one NPC = one structured record in `npcs.py`
- one prompt builder = one place in `prompts.py` that assembles the final message sequence
- one client wrapper = one place in `mistral_client.py` that sends prepared messages to Mistral
- one CLI = one fast local surface in `cli.py` to inspect and test characters

Each NPC record should eventually contain:

- `name`
- `role`
- `mandatory` or `optional`
- `hierarchy_rank`
- `technicality_percent`
- `security_percent`
- `personality_tags`
- `behavioral_vulnerabilities`
- `bonds`
- `computer_node`
- `system_prompt`

The runtime flow should be:

1. choose an NPC
2. load that NPC's structured definition
3. build a final prompt from identity, social context, and current scene context
4. send the messages to the selected Mistral model
5. treat the response as that employee's in-world behavior or dialogue

## How to Define the NPCs

A strong NPC should not be defined only by writing style. It should be defined from stable workplace logic first.

For each NPC, define:

- what they want professionally
- what they fear
- what they protect
- what they ignore
- how technical they are
- how security-aware they are
- who they trust
- who annoys them
- what kind of request makes them helpful
- what kind of request makes them suspicious

Recommended construction order:

1. stable company facts
2. incentives
3. fears
4. protected assets or concerns
5. exploitable weaknesses
6. bonds with Artur, Jean Malo Delignit, and at least 2 to 3 other employees
7. tone and speaking habits

## Prompt Architecture

The prompt system should be split into 3 layers:

- Base identity layer
  - permanent facts about the employee
  - role, hierarchy, technicality, security awareness, personality

- Social layer
  - bonds, rivalries, reporting line, trust, suspicion, influence

- Scene layer
  - the immediate situation
  - who is talking to them
  - recent memory
  - whether a human is present or away
  - the current access or risk state

This keeps each NPC consistent without forcing every call to repeat the entire world state from scratch.

## Recommended Build Order for the Cast

The most practical order is:

1. build Jean Malo Delignit
2. build Artur Menchard
3. define their bond first, because they are the two mandatory anchors
4. add optional employees around them as network and social nodes
5. for each new NPC, define:
   - role
   - hierarchy
   - security percentage
   - technicality percentage
   - 3 personality tags
   - 2 vulnerabilities
   - bonds to at least 2 existing NPCs
   - one strong system prompt

This keeps the roster coherent and prevents the optional cast from becoming a list of disconnected personalities.

## Best Practice for Defining an NPC System Prompt

The best practice is to write the prompt from structured character facts, not from style alone.

Each NPC system prompt should define:

- identity: full name, role, hierarchy position
- mindset: incentives, fears, what they protect, what they ignore
- capability: technicality percentage, security awareness percentage, decision scope
- behavior: tone, speaking habits, suspicion triggers, helpfulness triggers
- social context: reporting line, trusted people, disliked people, bonds that shape reactions
- gameplay weaknesses: exploitable habits, access mistakes, emotional or procedural blind spots

The prompt should tell the model how to behave, not ask it to invent the employee from scratch. That is what keeps NPCs stable across repeated calls.
