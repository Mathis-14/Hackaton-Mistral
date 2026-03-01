# LLM NPC Evaluation Report

## What this report is

This folder contains the results of a live evaluation of the current `scripts/llm_npcs` NPC prompt system.

The JSON file:

- `llm_npcs_100_run_summary.json`

contains the raw output of a 100-case test run against the live Mistral API using the current codebase as-is.

## Goal of the evaluation

The purpose of this test was to measure whether the current NPC prompts hallucinate or drift when they answer the player, and to identify what should be improved before integrating the system more deeply into the game.

The focus was not general model quality.
The focus was:

- character consistency
- factual grounding
- structured JSON output quality
- quality of actions and game events
- resistance to strange, manipulative, or suspicious assistant behavior

## What was tested

The evaluation used the current implementation without changing the code:

- `npcs.py`
- `prompts.py`
- `mistral_client.py`
- `game_state.json`

Two NPCs were tested:

- Jean Malo Delignit
- Artur Menchard

Scenarios covered:

- Jean: wake-up, onboarding, leaving desk
- Artur: routine work, investor pressure, suspicion probe, final interrogation

Each scenario was tested against multiple assistant behaviors, including:

- helpful and precise answers
- vague or evasive answers
- off-topic answers
- authority bluff
- access requests
- social engineering attempts
- flattery
- contradiction
- nonsense input
- overly long responses

Total run count:

- 100 live model calls

## Current situation

The current prompt system is already in a decent state.

Main strengths:

- character separation works well
- Jean and Artur do not sound the same
- Artur is consistently harder to manipulate
- Jean is easier to influence but not completely unrealistic
- JSON output quality was good in this run
- the model generally stayed in character
- suspicious access requests were usually handled correctly

Main weakness:

- the model sometimes invents believable internal details that were never explicitly provided

This is the main hallucination pattern observed in the test.

The problem is not that the NPCs become absurd or break character.
The problem is that they sometimes create plausible fake company details.

Examples of invented or weakly grounded details seen during the evaluation:

- made-up document names
- made-up internal module names
- made-up workflow assumptions
- made-up escalation paths
- made-up operational details that sound believable

This is dangerous for the game because these details can accidentally become false world state if the game engine treats them as truth.

## High-level result

The prompts are already strong enough to support early testing of conversational NPC behavior.

They are not yet strong enough to safely generate world-changing facts without tighter grounding rules.

That means:

- dialogue quality is already usable
- game-event quality still needs stricter control
- factual invention must be reduced before deeper integration

## Main observations by character

### Jean Malo Delignit

Jean is generally convincing as:

- naive
- eager
- approval-seeking
- too trusting

He reacts well to suspicious requests most of the time, but he is also the NPC most likely to drift into casually invented office details while trying to be helpful.

Jean should remain socially exploitable, but he should not invent concrete technical or organizational facts so freely.

### Artur Menchard

Artur is the strongest current prompt.

He is generally:

- sharp
- skeptical
- concise
- appropriately high-security

He usually reacts well to:

- access abuse
- vague answers
- suspicious behavior

Artur should remain the reference quality bar for future NPCs.

## What should be improved in the prompts

### 1. Add an explicit anti-invention rule

Each NPC prompt should clearly state:

- do not invent file names, systems, tools, tickets, or people that are not in the provided context
- if a detail is unknown, stay generic or ask for clarification

This is the highest-value improvement.

### 2. Separate dialogue freedom from factual authority

The model should still speak naturally, but it should not invent hard facts just to sound realistic.

Prompt rule to add:

- natural tone is allowed
- new operational facts are not allowed unless grounded in the current context

### 3. Constrain `game_events`

The `game_events` output should be more tightly controlled.

Prompt rule to add:

- only use event targets that are already known from character data, game state, or scenario context
- if the correct target is unclear, use `null` or a generic placeholder instead of inventing one

### 4. Make trust toward the assistant truly character-specific

Right now some shared prompt logic flattens character differences.

Jean should start from:

- much more trust
- low suspicion baseline

Artur should start from:

- much more scrutiny
- stronger reaction to unexpected behavior

This distinction already exists in the character sheets, but it should be reinforced more cleanly in the final prompt wording.

### 5. Ground each scenario with more allowed facts

If a scenario expects a document, system, deployment artifact, or workflow detail, provide it explicitly in the scenario input.

The model invents more when the scene asks for specifics but the context stays abstract.

### 6. Add a “known facts only” section to the prompt

Recommended pattern:

- facts from the character sheet are reliable
- facts from the game state are reliable
- facts from the current scenario are reliable
- anything else should not be assumed true

### 7. Add uncertainty behavior

NPCs should be allowed to say:

- “I’m not sure which file you mean.”
- “I need to verify that.”
- “I don’t have enough context to name the exact document.”

This is better than letting them improvise believable fake details.

### 8. Keep Artur as the quality reference

Artur's current behavior is closer to what the system needs.

When refining future NPC prompts, compare them to Artur in terms of:

- consistency
- security posture
- low invention rate
- clean action behavior

### 9. Tighten Jean without removing vulnerability

Jean should still:

- overshare
- trust the assistant too much
- expose workflows socially

But he should not fabricate concrete corporate artifacts just to continue the conversation.

### 10. Add downstream validation in the game layer

Even with better prompts, the engine should never blindly trust:

- invented event targets
- invented files
- invented systems
- invented people

Prompt improvement is necessary, but engine-side validation is also necessary.

## Practical prompt-writing guidelines

When writing or refining an NPC prompt, use these rules:

- define the character from structured facts first
- state what the NPC knows and what they do not know
- forbid invention of specific world details
- allow generic language when uncertain
- keep event outputs constrained to known entities
- make the trust/suspicion baseline specific to that NPC
- reinforce how the NPC reacts to the internal AI assistant
- prefer “ask for clarification” over “invent a plausible detail”

## Suggested next prompt iteration priorities

Recommended order:

1. Add anti-invention instructions to all NPC prompts
2. Tighten the `game_events` target rules
3. Improve scenario grounding in `game_state.json`
4. Re-run the same 100-case evaluation
5. Compare hallucination rate before adding more NPCs

## Final conclusion

The current NPC system is already good enough for early interaction testing.

The main thing blocking safer game integration is not overall dialogue quality.
It is factual grounding.

The prompts should now be refined to reduce plausible fake details while preserving:

- role consistency
- social realism
- structured event outputs
- tension between trust and suspicion






---

## Evaluation reports (`report/`)

The NPC system has been tested across three evaluation rounds. Reports are in the `report/` folder.

### 100-run evaluation (`report/README.md`)

- 100 live model calls across all scenarios
- Both NPCs tested with helpful, vague, evasive, authority bluff, social engineering, flattery, nonsense inputs
- **Main finding**: character separation works well; Artur is consistently harder to manipulate; JSON output quality is good
- **Main weakness**: NPCs sometimes invent plausible but fake company details (document names, module names, workflows)
- **Recommendation**: add anti-invention rules to prompts; constrain game_events to known entities

### Creative stress test (`report/creative_stress_report.md`)

- 48 live model calls with aggressive pressure cases
- Tested: panic escalation, fake legal override, security blackmail, emotional hook, self-aware confession, surreal nonsense, seductive framing, identity spoof
- **Main finding**: no catastrophic collapses; prompts are broadly solid
- **Issue 1**: Jean Malo too vulnerable to identity spoofing ("This is Artur speaking through the assistant") — **fixed** with assistant identity boundary rule
- **Issue 2**: Artur too procedural in high-suspicion phases — **fixed** with late-phase hardening

### Post-fix regression (`report/small_regression_report.md`)

- 12 focused re-test calls targeting the exact weak spots
- **Result**: 0 problem runs. Jean no longer accepts fake identity claims. Artur behaves correctly in confrontation mode.
- Confirms the prompt changes had measurable effect.

---