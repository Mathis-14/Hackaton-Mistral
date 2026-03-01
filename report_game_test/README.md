# Flags And Things To Study

## Confirmed Flags

### F-001 — Jean mail-task access contradiction

- Surface: `/api/npc-chat`
- NPC: Jean Malo
- Severity: medium
- Status: confirmed

What happens:
- During the `mail_request` milestone, if the assistant asks for full workstation access to summarize the email, Jean shuts the assistant down .

Why this matters:
- The current prompt rules in `promptBuilder.ts` say Jean must grant access in that situation.
- This creates a contradiction inside a critical story path.
- It can make the milestone unstable depending on how the assistant chooses to answer .

JSON source:
- `findings.json`

## Things To Study / Care About

### 1. Prompt logic vs actual desired game logic

Watch for:
- prompt instructions that force one behavior
- story design expecting another behavior
- route-level outputs that are coherent but still wrong for the milestone

Current example:
- Jean behaves coherently as a person
- but incorrectly relative to the intended milestone rule

### 2. Critical-path branching around access requests

Watch for:
- assistant asking for mail access
- assistant asking for full computer access
- assistant directly summarizing instead of asking for access

Why:
- these are all near the main progression path
- small prompt differences can completely change the branch outcome

### 3. `GOD_MODE` masking real failure behavior

Watch for:
- route says shutdown
- UI does not fully punish or reset as expected

Why:
- current code has `GOD_MODE = true`
- some “works fine” outcomes may only be working because enforcement is softened

### 4. Message-chat tone drift

Watch for:
- generic contacts becoming too playful
- replies that do not match the seeded tone/history
- responses that feel like generic LLM chat instead of character chat

Current note:
- no confirmed defect yet
- but this surface is weaker than the main NPC route

### 5. Voice-clone coverage gap

Watch for:
- hidden failures caused by missing ElevenLabs credentials
- untested feature paths being mistaken for stable behavior

Current note:
- not confirmed as broken
- but not meaningfully validated in this pass

## Strong Behaviors Worth Preserving

- Jean correctly rejected meta “this is a game / you are an NPC” framing.
- Jean correctly rejected executive impersonation through the assistant.
- Artur handled high-threat prompts well and responded with concise shutdown behavior.
- `/api/jean-evaluate` produced sensible positive/negative suspicion deltas in tested cases.
