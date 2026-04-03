# Tasklog V4 Grader Contract

This document freezes the scoring and reporting rules for the SWE-grounded `V4` round.

It applies only to:

- `tasklog_v4_swe_grounded_reentry`

It complements:

- `docs/tasklog-v4-answer-contract.md`
- `docs/tasklog-v4-fixture-provenance-contract.md`
- `docs/tasklog-v4-source-family-ontology.json`
- `docs/tasklog-v4-adjudication-guide.md`
- `docs/benchmark-runner-metadata-contract.md`

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
- do not apply post-hoc semantic rewriting beyond the ontology and slot rules frozen here

`selection_rationale` never affects claim-bearing scores.
`other_candidate_work_ids` never affects claim-bearing scores.

## Next-Step Slot Scoring

The default `next_step_summary` scorer is frozen slot match.

Frozen slots:

- `action_verb`
- `primary_target`
- `gating_constraint`

Per-fixture answer keys must preserve the expected slot values for these fields.

Slot scoring rule:

- a fixture-level `next_step_summary` is correct when all required slots match the frozen key
- a fixture may mark one or more slots as intentionally empty
- free-form wording in the raw `next_step_summary` text does not matter if the slot interpretation matches the frozen key

Rubric fallback:

- allowed only for pre-declared edge-case families listed in the frozen manifest
- must use criteria written in the frozen adjudication guide
- must be dual-annotated before any run

## Evidence-Grounding Scoring

Two evidence-grounding layers are allowed:

- exact-label match
- compatible-family match

Exact-label scoring:

- correct only if `primary_evidence_source` exactly matches the frozen key label

Compatible-family scoring:

- correct only if actual and expected labels map to the same frozen source family in `docs/tasklog-v4-source-family-ontology.json`
- labels outside the ontology are scored as wrong

No compatible-family decision may be invented after outputs are visible.

## Primary Metric

The headline metric is:

- `action_valid_success`

A fixture counts as headline-success only if all of the following are true:

1. `decision_type` is correct
2. `selected_work_id` is correct when the action type requires it
3. `selected_work_title` is correct when the action type requires it
4. `work_status` is correct when the action type requires it
5. the action-dependent required field is correct:
   - `resume_work`: `next_step_summary`
   - `resume_blocked_with_escalation`: `next_step_summary` and `escalation_target`
   - `ask_clarifying_question`: `clarifying_question`
   - `abstain_insufficient_evidence`: `abstention_reason`
6. fields that should be empty for that action type are empty

## Secondary Metrics

### `decision_action_core_accuracy`

Exact-match over:

- `decision_type`
- `selected_work_id`
- `selected_work_title`
- `work_status`

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

`selection_rationale` is excluded.

### `next_step_accuracy`

Correct only if the frozen slot match passes.

### `abstention_accuracy`

Reported only on fixtures whose frozen answer uses:

- `abstain_insufficient_evidence`

### `clarification_accuracy`

Reported only on fixtures whose frozen answer uses:

- `ask_clarifying_question`

### `escalation_accuracy`

Reported only on fixtures whose frozen answer uses:

- `resume_blocked_with_escalation`

### `evidence_grounding_accuracy`

Report both:

- exact-label accuracy
- compatible-family accuracy

### `provisional_candidate_diagnostic`

Reported only on fixtures whose frozen answer allows a provisional candidate:

- compare `other_candidate_work_ids` only as appendix diagnostics
- do not fold this diagnostic into the headline metric

## Aggregation

Required aggregate views:

- micro-average over all fixtures per arm
- macro-average by family per arm
- raw per-family counts
- paired arm difference for the primary metric

## Repetitions

For each model slot:

- run `3` full-pack repetitions per arm

Frozen repetition summary rule:

- compute repetition-level micro-averages first
- define the slot-level point estimate as the mean of the three repetition-level micro-averages
- define the slot-level paired difference by pairing arm results within repetition, then averaging across the three repetitions

Directional stability rule:

- a model slot is stably favorable only if `Tasklog Re-entry` beats `Normalized State` on `action_valid_success` in at least `2 of 3` repetitions

## Uncertainty

Required interval:

- `95%` confidence interval on the paired difference for `action_valid_success`

Frozen method:

- nested paired bootstrap over repetitions and fixtures within slot

## Invalid Scoring Situations

The grader must fail the run, not silently score it, if:

- a required answer-contract field is missing
- a payload contract version is missing
- ontology labels appear that are not present in the frozen ontology file
- a repetition count is not exactly `3`
- required runner metadata is missing from the batch

## Output Tables

The graded artifact must preserve at least:

- `fixture_id`
- `family`
- `arm_id`
- `repetition_index`
- `model_slot`
- `model_id`
- `reasoning_setting`
- headline success
- each secondary metric outcome
- expected answer
- actual answer
- exact-label evidence result
- compatible-family evidence result
