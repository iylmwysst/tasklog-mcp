# Tasklog V3 Model Roster Freeze Note

This note freezes the model roster for:

- `tasklog_v3_independent_structured_holdout`
- round `V3a`

It complements:

- `docs/benchmark-runner-metadata-contract.md`
- `docs/tasklog-v3-grader-contract.md`
- `docs/tasklog-v3-independent-holdout-manifest.json`

## Required Slots

Freeze one exact model per required slot:

- `slot_a_openai_frontier_large`
- `slot_b_openai_frontier_small`
- `slot_c_external_closed_frontier`

Optional slot:

- `slot_d_external_open_or_open_weight`

## Per-Slot Fields

Record all of the following for each frozen slot:

- `slot_id`
- `provider`
- `model_id`
- `model_family`
- `reasoning_setting`
- `snapshot_or_pin`
- `freeze_date`
- `runner_name`
- `runner_version`

If no snapshot pin exists:

- record the provider-facing model id
- record the freeze date

## Repetition Policy

The frozen policy for every populated slot is:

- `3` full-pack repetitions per arm

No slot may silently run fewer repetitions inside `V3a`.

## Fallback Rule

If a required slot cannot be filled with a stable accessible model at freeze time:

- record the slot as unavailable
- do not silently substitute a convenience model later

The round may proceed only if the required three slots are frozen or explicitly waived before runs begin.

## Template

Fill this block before any run:

```yaml
round_id: V3a
freeze_completed: true
freeze_completed_at: 2026-03-29T16:20:00Z
notes:
  - No provider snapshot pin is available in the current workflow, so the provider-facing model id plus freeze date is the frozen reference.
  - The same runner wrapper and runner version must be used across all populated slots in V3a.
  - The optional open/open-weight slot is explicitly left unavailable in this round rather than silently substituted.
slots:
  - slot_id: slot_a_openai_frontier_large
    provider: openai
    model_id: gpt-5.4
    model_family: gpt-5.4
    reasoning_setting: medium
    snapshot_or_pin: freeze-date-only
    freeze_date: 2026-03-29
    runner_name: tasklog-benchmark-runner
    runner_version: 2026-03-29-v3a
  - slot_id: slot_b_openai_frontier_small
    provider: openai
    model_id: gpt-5.4-mini
    model_family: gpt-5.4-mini
    reasoning_setting: medium
    snapshot_or_pin: freeze-date-only
    freeze_date: 2026-03-29
    runner_name: tasklog-benchmark-runner
    runner_version: 2026-03-29-v3a
  - slot_id: slot_c_external_closed_frontier
    provider: anthropic
    model_id: claude-sonnet-4.6
    model_family: claude-sonnet-4.6
    reasoning_setting: standard
    snapshot_or_pin: freeze-date-only
    freeze_date: 2026-03-29
    runner_name: tasklog-benchmark-runner
    runner_version: 2026-03-29-v3a
  - slot_id: slot_d_external_open_or_open_weight
    provider: unavailable
    model_id: unavailable
    model_family: unavailable
    reasoning_setting: unavailable
    snapshot_or_pin: unavailable
    freeze_date: 2026-03-29
    runner_name: tasklog-benchmark-runner
    runner_version: 2026-03-29-v3a
    optional: true
    availability_note: No stable accessible external open or open-weight coding slot was frozen for V3a.
```

## Post-Freeze Rule

After the first repetition begins:

- no slot may change `model_id`
- no slot may change `reasoning_setting`
- no slot may change `runner_version`

Any such change starts a new round.
