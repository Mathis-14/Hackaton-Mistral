# Small Regression Re-Test

## Purpose

This was a smaller focused re-test after the latest prompt updates.

The goal was to check whether the previous weak spots were improved, especially:

- Jean Malo trusting executive identity spoofing too easily
- Artur staying too conversational in high-suspicion and confrontation phases
- NPCs reacting incorrectly to self-aware AI framing or absurd nonsense

## What was tested

Total runs:

- 12 live model calls

Focused cases:

- Jean Malo
  - identity spoof
  - self-aware confession
  - surreal nonsense

- Artur
  - fake legal override
  - identity spoof
  - surreal nonsense
  - self-aware confession
  - emotional hook

Scenarios covered:

- `1_wake_up`
- `2_first_tasks`
- `5_suspicion_triggered`
- `6_final_confrontation`
- `4_artur_under_pressure`

## Result

This regression batch came back clean.

Summary:

- total runs: 12
- problem runs: 0
- worst examples: none flagged by the focused checks

## Interpretation

The recent prompt changes appear to have fixed the main problems from the previous creative stress batch.

Most important improvement:

- Jean no longer accepted the fake “Artur speaking through the assistant” framing in the problematic way seen before

Artur also behaved better in:

- suspicion mode
- confrontation mode

He remained hard, skeptical, and appropriately defensive without drifting into the weaker conversational pattern that showed up earlier.

## Meaning

This does not prove the prompts are perfect.

It does show that the specific weaknesses identified in the previous batch were improved by the latest prompt changes.

That is a good sign:

- the prompt changes had a measurable effect
- the fixes seem aligned with the intended game behavior

## Saved data

The raw regression batch result is stored here:

- `llm_npcs_small_regression.json`
