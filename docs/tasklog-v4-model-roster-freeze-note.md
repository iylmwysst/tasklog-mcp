# Tasklog V4 Model Roster Freeze Note

This note freezes the model roster and runner settings for:

- `tasklog_v4_swe_grounded_reentry`
- round `V4`

It complements:

- `docs/tasklog-v4-swe-grounded-round-note.md`
- `docs/tasklog-v4-grader-contract.md`
- `docs/benchmark-runner-metadata-contract.md`
- `docs/benchmark-model-roster.json`

`V4` reuses the same claim shape as the earlier structured re-entry lanes for model-side comparisons.
The round-level novelty is the fixture pack, provenance contract, and answer-key freeze, not a new model-policy experiment.
This freeze note was refreshed before the first `V4` run after the dedicated V4 runner gained Anthropic dispatch via the `claude` CLI.

## Frozen Slots

- `slot_a_openai_frontier_large`
  - `provider`: `openai`
  - `model_id`: `gpt-5.4`
  - `model_family`: `gpt-5.4`
  - `reasoning_setting`: `medium`
  - `snapshot_or_pin`: `freeze-date-only`
  - `freeze_date`: `2026-03-31`
- `slot_b_openai_frontier_small`
  - `provider`: `openai`
  - `model_id`: `gpt-5.4-mini`
  - `model_family`: `gpt-5.4-mini`
  - `reasoning_setting`: `medium`
  - `snapshot_or_pin`: `freeze-date-only`
  - `freeze_date`: `2026-03-31`
- `slot_c_external_closed_frontier`
  - `provider`: `anthropic`
  - `model_id`: `claude-sonnet-4.6`
  - `model_family`: `claude-sonnet-4.6`
  - `reasoning_setting`: `standard`
  - `snapshot_or_pin`: `freeze-date-only`
  - `freeze_date`: `2026-03-31`

Optional slot:

- `slot_d_external_open_or_open_weight`
  - `status`: `unavailable`

## Runner Freeze

- `runner_name`: `tasklog-v4-holdout-runner`
- `runner_version`: `2026-03-31-v4-freeze`
- `freeze_completed`: `true`
- `freeze_completed_at`: `2026-03-31T11:30:00Z`
- `runner_entrypoint`: `scripts/run-tasklog-v4-holdout.ts`
- `anthropic_dispatch`: `claude CLI`

## Runner Policy

- `benchmark_type`: `tasklog_v4_swe_grounded_reentry`
- `split`: `holdout`
- `fixture_root`: `/Users/Lab/Desktop/TasklogSweLab/fixtures-v4`
- `required_repetitions_per_populated_slot`: `3`
- `metadata_contract`: `docs/benchmark-runner-metadata-contract.md`
- `metadata_sample`: `docs/tasklog-v4-runner-metadata-sample.json`

## Carry-Forward Rule

`V4` does not reopen the model-policy question.
It carries forward the earlier three-slot comparison shape and changes only the frozen fixture pack and provenance discipline.

Any later change to:

- populated model ids
- reasoning settings
- runner name or version
- provider availability for a required slot

must create a later round id rather than mutating `V4` in place after runs begin.
