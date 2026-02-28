# LLMs_pnjs Simple Interaction Plan

## Goal

Build the smallest possible Python-only version of the NPC interaction system first.

The immediate objective is not to build the full final architecture. The immediate objective is to prove that:

- one NPC can be defined cleanly
- one system prompt can be generated from structured character data
- one user message can be sent to Mistral
- one character reply can be returned and inspected

The database will come later.

## First Principle

Do not start with storage complexity.

For the first version:

- no database
- no migrations
- no admin tooling
- no advanced memory system

Keep everything local in Python files so the behavior is easy to inspect and debug.

## First Scope

The first build is only for testing how a character interacts with the user.

That means:

- no multi-NPC simulation yet
- no NPC-to-NPC conversations yet
- no persistence
- no world-state engine
- no database

The only thing to validate is:

- pick one character
- send a user message
- receive an in-character reply

## Minimal Architecture

The first working version should use only these files:

- `test_mistral_api.py`
- `npcs.py`
- `prompts.py`
- `mistral_client.py`
- `cli.py`

## Responsibility of Each File

### `test_mistral_api.py`

Purpose:

- verify that the Mistral SDK call works
- verify that `.env` loading works
- verify that a very simple prompt can be sent and answered

This remains the first smoke test before the rest of the module.

### `npcs.py`

Purpose:

- store the first local character definitions in Python

For now, the characters should be defined directly in code as dataclasses or simple dictionaries.

Start with only the 2 mandatory characters available locally:

- `Jean Malo Delignit`
- `Artur Menchard`

Each character definition should contain:

- `slug`
- `name`
- `role`
- `mandatory`
- `hierarchy_rank`
- `technicality_percent`
- `security_percent`
- `personality_tags`
- `behavioral_vulnerabilities`
- `bonds`
- `computer_node`
- `goals`
- `fears`
- `protects`
- `speaking_style`

Important rule:

- do not store one giant hardcoded prompt string as the only character definition

Store character facts first.

### `prompts.py`

Purpose:

- build the final system prompt from the character definition
- build the final message list for Mistral

Recommended functions:

- `build_system_prompt(npc)`
- `build_messages(npc, user_message, context=None)`

The system prompt should be generated from structured facts such as:

- identity
- role
- objectives
- fears
- security posture
- social bonds
- speaking style
- vulnerabilities
- character rules

### `mistral_client.py`

Purpose:

- load `.env`
- read `MISTRAL_API_KEY`
- read `MISTRAL_MODEL`
- send prepared message lists to Mistral

Recommended functions:

- `load_settings()`
- `chat(messages, model=None)`

Important rule:

- this file should know nothing about character design

It only sends messages.

### `cli.py`

Purpose:

- manually test characters quickly from the terminal

Recommended commands:

- `list`
- `show <npc>`
- `prompt <npc>`
- `chat <npc> --message "..."`

For the very first iteration, only `chat` is truly required. The others are support commands.

## Best Practice for Defining Characters

The first version should define characters as structured sheets, not as loose prompt prose.

For each character, define:

- what they want professionally
- what they fear
- what they protect
- how technical they are
- how security-aware they are
- who they trust
- who they report to
- what makes them helpful
- what makes them suspicious
- how they speak
- what weakness makes them exploitable

If these facts are clear, the prompt will be easier to build and more stable over time.

## Best Practice for Building the System Prompt

The prompt should be assembled from stable sections.

Recommended shape:

1. identity
2. company role
3. objectives
4. fears and constraints
5. technicality and security posture
6. relationships
7. speaking style
8. behavioral rules
9. exploitable weaknesses
10. instruction to stay in character

Example structure:

```text
You are Jean Malo Delignit, an entry-level intern at Distral AI.

Role:
...

Objectives:
...

Fears:
...

Technicality and security posture:
...

Relationships:
...

Communication style:
...

Behavior rules:
...

Weaknesses:
...

Stay in character as a real employee of Distral AI.
```

## Runtime Flow

The runtime flow should stay simple:

1. select one NPC in `cli.py`
2. load that NPC definition from `npcs.py`
3. build the system prompt in `prompts.py`
4. build the final message list
5. send the request with `mistral_client.py`
6. print the reply

This is enough to test whether one character can interact correctly with the user.

## Why This Is the Best First Step

This simpler version is better because:

- faster to implement
- easier to debug
- no schema decisions too early
- no database layer to maintain yet
- easy to refactor later

If this version works, moving to SQLite later will mostly be a storage change, not a rewrite of the whole prompt system.

## Minimum Viable Scope

The first implementation should stop at:

- 1 working character interaction flow
- 2 characters available for testing
- generated system prompts
- one Mistral client wrapper
- one CLI chat command

Do not add more complexity before this works end to end.

## Recommended Build Order

1. keep `test_mistral_api.py` working
2. create `npcs.py` with Jean Malo Delignit and Artur Menchard
3. create `prompts.py`
4. create `mistral_client.py`
5. create `cli.py`
6. test `chat` with Jean Malo Delignit
7. test `chat` with Artur Menchard
8. add `list`, `show`, and `prompt` only after chat works

## Later Upgrade Path

Once the simple character-to-user interaction works, the next evolution can be:

1. move character sheets from Python into SQLite
2. move bonds into a structured relationship table
3. add prompt inspection and validation tooling
4. add more NPCs one by one

For now, the good rule is:

character sheet first
prompt builder second
API call third
database later
