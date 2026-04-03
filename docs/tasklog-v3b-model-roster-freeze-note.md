# Tasklog V3b Model Roster Freeze Note

This note freezes the model roster for:

- `tasklog_v3_independent_structured_holdout`
- round `V3b`

This round reuses the frozen fixture pack and frozen answer keys from `V3a`.
The only intended round-level change is runner hardening plus a new runner version after the failed `V3a` execution attempt.

## Frozen Slots

- `slot_a_openai_frontier_large`
  - `provider`: `openai`
  - `model_id`: `gpt-5.4`
  - `model_family`: `gpt-5.4`
  - `reasoning_setting`: `medium`
- `slot_b_openai_frontier_small`
  - `provider`: `openai`
  - `model_id`: `gpt-5.4-mini`
  - `model_family`: `gpt-5.4-mini`
  - `reasoning_setting`: `medium`
- `slot_c_external_closed_frontier`
  - `provider`: `anthropic`
  - `model_id`: `claude-sonnet-4.6`
  - `model_family`: `claude-sonnet-4.6`
  - `reasoning_setting`: `standard`

Optional slot:

- `slot_d_external_open_or_open_weight`
  - `status`: `unavailable`

## Runner Freeze

- `runner_name`: `tasklog-benchmark-runner`
- `runner_version`: `2026-03-29-v3b`
- `freeze_completed`: `true`
- `freeze_completed_at`: `2026-03-29T17:00:00Z`

## Repetition Policy

- each populated required slot must run exactly `3` full-pack repetitions per arm

## Carry-Forward Rule

`V3b` inherits the frozen `V3a` fixture pack, answer keys, grader contract, ontology, and answer contract.
Any later artifact-level change beyond the runner hardening described here must start a new round id again.
