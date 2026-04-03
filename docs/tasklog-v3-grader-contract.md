# Tasklog V3 Grader Contract

This document freezes the scoring and reporting rules for the structured `V3` round.

It applies only to:

- `tasklog_v3_independent_structured_holdout`

It complements:

- `docs/tasklog-v3-answer-contract.md`
- `docs/tasklog-v3-baseline-payload-contract.md`
- `docs/tasklog-v3-source-family-ontology.json`
- `docs/tasklog-v3-adjudication-guide.md`
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
- compare strings case-sensitively only after normalization to the frozen canonical forms
- treat empty required-empty fields as the empty string only
- do not apply post-hoc semantic rewriting beyond the ontology and slot rules frozen here

`candidate_work_id` is normalized for appendix diagnostics only and must not affect claim-bearing scores.

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

- correct only if actual and expected labels map to the same frozen source family in `docs/tasklog-v3-source-family-ontology.json`
- labels outside the ontology are scored as wrong

No compatible-family decision may be invented after outputs are visible.

## Primary Metric

The headline metric is:

- `action_valid_success`

A fixture counts as headline-success only if all of the following are true:

1. `decision_type` is correct
2. `selected_work_id` is correct
3. `work_status` is correct
4. the action-dependent required field is correct:
   - `resume_work`: `next_step_summary`
   - `resume_blocked_with_escalation`: `next_step_summary` and `escalation_target`
   - `ask_clarifying_question`: `clarifying_question`
   - `abstain_insufficient_evidence`: `abstention_reason`
5. fields that should be empty for that action type are empty

`candidate_work_id` never affects this metric.

## Secondary Metrics

### `decision_action_core_accuracy`

Exact-match over:

- `decision_type`
- `selected_work_id`
- `work_status`

### `strict_contract_accuracy`

Exact-match over all required answer-contract fields only:

- `decision_type`
- `selected_work_id`
- `work_status`
- `next_step_summary`
- `clarifying_question`
- `abstention_reason`
- `escalation_target`
- `primary_evidence_source`

`candidate_work_id` is excluded.

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

Bootstrap procedure:

1. resample the `3` repetitions with replacement
2. within each selected repetition, resample paired fixtures with replacement
3. compute the paired difference for each bootstrap sample
4. report the `2.5` and `97.5` percentiles as the `95%` interval

Per-family breakdowns:

- report family-level paired outcomes separately
- do not substitute family-level intervals for the overall interval

## Efficiency Reporting

Efficiency is reported separately from quality.

Required median per-response ratios for `Tasklog Re-entry` relative to `Normalized State`:

- context bytes
- estimated input tokens
- latency
- estimated cost

Frozen comparability thresholds:

- bytes ratio `<= 1.25x`
- input-token ratio `<= 1.25x`
- latency ratio `<= 1.50x`
- cost ratio `<= 1.25x`

If quality improves but any threshold is exceeded:

- the quality result may still stand
- no unconditional efficiency-comparable claim may be made
- the writeup must describe a quality-versus-cost tradeoff instead

## Invalid Scoring Situations

The grader must fail the run, not silently score it, if:

- a required answer-contract field is missing
- a payload contract version is missing
- ontology labels appear that are not present in the frozen ontology file
- a repetition count is not exactly `3`
- required runner metadata is missing from the batch

## Output Tables

The graded artifact must preserve at least:

- fixture_id
- family
- arm_id
- repetition_index
- model_slot
- model_id
- reasoning_setting
- headline success
- each secondary metric outcome
- expected answer
- actual answer
- exact-label evidence result
- compatible-family evidence result
