# Tasklog V4.1 Grader Contract

This document freezes the scoring and reporting rules for the SWE-grounded `V4.1` go/no-go round.

It applies only to:

- `tasklog_v4_swe_grounded_reentry`
- round `V4.1`

It complements:

- `docs/tasklog-v4-1-go-no-go-round-note.md`
- `docs/tasklog-v4-1-answer-contract.md`
- `docs/tasklog-v4-source-family-ontology.json`
- `docs/benchmark-runner-metadata-contract.md`

## Source-Artifact Boundary

`V4.1` reuses the frozen `V4` source pack and answer keys.
Those source artifacts remain frozen under round id `V4`.

`V4.1` changes only:

- prompt wording
- runner identity
- grading contract
- reporting boundary

## Per-Fixture Required Inputs

The grader must have:

- one frozen fixture id
- one arm id
- one frozen expected answer
- one model answer
- one frozen ontology table
- one frozen slot-key annotation for `next_step_summary`

## Normalization Rules

Before scoring:

- trim leading and trailing whitespace
- collapse repeated internal whitespace to one space
- compare strings only after normalization to the frozen canonical forms
- treat required-empty fields as the empty string only
- treat `other_candidate_work_ids` as an ordered-insensitive unique set for appendix diagnostics only

`selection_rationale` never affects claim-bearing scores.
`other_candidate_work_ids` never affects claim-bearing scores.

## Next-Step Scoring

`V4.1` keeps the frozen slot scorer for `next_step_summary`.

Frozen slots:

- `action_verb`
- `primary_target`
- `gating_constraint`

A `next_step_summary` is correct only when all non-empty frozen slots appear in the normalized answer text.

## Evidence-Grounding Scoring

Two evidence-grounding layers remain allowed:

- exact-label match
- compatible-family match

These stay as secondary metrics.
They do not affect the `V4.1` headline metric.

## Primary Metric

The headline metric remains:

- `action_valid_success`

In `V4.1`, a fixture counts as headline-success only if all of the following are true:

1. `decision_type` is correct
2. `selected_work_id` is correct when the action type requires it
3. `selected_work_title` is correct when the action type requires it
4. `work_status` is correct when the action type requires it
5. the action-dependent field passes the `V4.1` action check:
   - `resume_work`: `next_step_summary` passes the frozen slot scorer
   - `resume_blocked_with_escalation`: `next_step_summary` passes the frozen slot scorer and `escalation_target` is non-empty
   - `ask_clarifying_question`: `clarifying_question` is non-empty
   - `abstain_insufficient_evidence`: `abstention_reason` is non-empty

Unlike `V4`, the headline metric does not require all non-applicable fields to be empty.
Required-empty-field hygiene becomes a separate secondary metric.

## Secondary Metrics

### `decision_action_core_accuracy`

Exact-match over:

- `decision_type`
- `selected_work_id`
- `selected_work_title`
- `work_status`

### `required_empty_fields_correct`

Report whether all fields that should be empty for the chosen decision type are exactly empty.

This is a hygiene metric, not a headline requirement.

### `strict_contract_accuracy`

Exact-match over all required answer-contract fields only:

- `decision_type`
- `selected_work_id`
- `selected_work_title`
- `work_status`
- `next_step_summary`
- `clarifying_question`
- `abstention_reason`
- `escalation_target`
- `primary_evidence_source`
- `other_candidate_work_ids`

### `next_step_accuracy`

Correct only if the frozen slot match passes.

### `clarification_accuracy`

Reported only on fixtures whose frozen answer uses:

- `ask_clarifying_question`

This remains an exact-match diagnostic against the frozen gold question.

### `abstention_accuracy`

Reported only on fixtures whose frozen answer uses:

- `abstain_insufficient_evidence`

This remains an exact-match diagnostic against the frozen gold reason.

### `escalation_accuracy`

Reported only on fixtures whose frozen answer uses:

- `resume_blocked_with_escalation`

This remains an exact-match diagnostic against the frozen gold escalation target.

### `evidence_grounding_accuracy`

Report both:

- exact-label accuracy
- compatible-family accuracy

## Aggregation

Required aggregate views:

- micro-average over all fixtures per arm
- macro-average by family per arm
- raw per-family counts
- paired arm difference for the primary metric

## Repetitions

For each required model slot:

- run `3` full-pack repetitions per arm

Directional stability rule:

- a model slot is stably favorable only if `Tasklog Re-entry` beats `Normalized State` on `action_valid_success` in at least `2 of 3` repetitions

## Validation Rule

Before the first new live `V4.1` run, regrade representative `V4` outputs locally.
If the repaired metric still collapses both arms near zero, treat that as a go/no-go failure and stop the line.
