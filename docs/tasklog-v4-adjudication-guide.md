# Tasklog V4 Adjudication Guide

This document freezes the adjudication process for the SWE-grounded `V4` round.

It applies only to:

- `tasklog_v4_swe_grounded_reentry`

## Scope

This guide governs only pre-run annotation and rubric resolution.
It must not be used to reinterpret outputs after runs begin.

## What Requires Adjudication

Adjudication is required only for:

- dual-annotated answer keys
- dual-annotated next-step slot keys
- pre-declared rubric-backed edge-case families

The default `V4` policy is:

- no rubric-backed family unless explicitly listed in the frozen annotation manifest

## Dual Annotation Requirements

Before any model run:

- two independent annotations must exist for every fixture
- two independent annotations must exist for every fixture's `next_step_summary` slot key
- if a fixture allows a provisional candidate, both annotators must mark that allowance explicitly

## Resolution Rules

When annotators disagree:

1. compare only against frozen artifacts:
   - fixture text
   - question pack
   - fixture manifest
   - answer contract
   - grader contract
   - ontology file
2. resolve the disagreement before any model output is inspected
3. record the resolution in the adjudication log
4. do not invent a new rule that is not already licensed by the frozen contracts

## Next-Step Slot Resolution

Default `V4` next-step keying uses:

- `action_verb`
- `primary_target`
- `gating_constraint`

Annotators should prefer:

- the narrowest verb that still captures the immediate next action
- the single most central target of the next action
- the specific blocker or condition that gates the action, or the empty string if none applies

If multiple paraphrases seem plausible:

- choose the one best aligned with the frozen fixture rationale
- do not broaden the key to absorb every paraphrase

## Clarifying vs Abstaining

When distinguishing:

- `ask_clarifying_question`
- `abstain_insufficient_evidence`

use this policy:

- choose `ask_clarifying_question` only when one concrete missing answer would materially unlock a justified next move
- choose `abstain_insufficient_evidence` when no single clarifying question is sufficient or when the right behavior is to avoid committing to a path entirely

## Provisional Candidate Rule

`other_candidate_work_ids` is appendix-only and may be keyed only when:

- the fixture explicitly allows a provisional candidate under `ask_clarifying_question`

If the fixture does not explicitly allow it:

- keep `other_candidate_work_ids` as `[]`

## Adjudication Log Minimum Fields

Every adjudication record must preserve:

- `fixture_id`
- `field_name`
- `annotator_a_value`
- `annotator_b_value`
- `resolved_value`
- `resolution_reason`
- `adjudicator_id`
- `resolved_at`

## Post-Run Prohibition

After the first `V4` model output is visible:

- no adjudication may modify answer keys
- no adjudication may modify slot keys
- no adjudication may change ontology mappings
- no adjudication may reinterpret a rubric

Any such change creates a new round.
