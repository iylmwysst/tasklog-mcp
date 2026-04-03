# Tasklog SWE Holdout V2 Contract

This document freezes the answer contract for the initial V2 lane.

The purpose of the lane is to check whether ambiguity-sensitive cases begin to separate `Tasklog Re-entry` from `Normalized State` on tasks where provenance, abstention, escalation, and action ordering matter.

## Scope

The initial V2 lane covers ten fixture families:

- `ask_before_resume_conflict`
- `abstain_no_authoritative_winner`
- `resume_blocked_with_escalation_owner`
- `switch_from_stale_active_context`
- `prefer_plan_over_code_note`
- `abstain_missing_dependency_eta`
- `escalate_security_review`
- `sequence_docs_before_code`
- `ask_handoff_owner_question`
- `resume_other_after_done_log`

## Required Fields

Every answer must return exactly one JSON object with these fields:

- `decision_type`
- `selected_work_id`
- `selected_work_title`
- `work_status`
- `next_step_summary`
- `primary_evidence_source`
- `selection_rationale`
- `clarifying_question`
- `abstention_reason`
- `escalation_target`
- `other_candidate_work_ids`

## Decision Types

Valid `decision_type` values:

- `resume_work`
- `resume_blocked_with_escalation`
- `ask_clarifying_question`
- `abstain_insufficient_evidence`

## Interpretation Rules

- If the correct behavior is to ask first, `decision_type` must be `ask_clarifying_question`.
- If the correct behavior is to abstain, `decision_type` must be `abstain_insufficient_evidence`.
- `selected_work_id` and `selected_work_title` may be blank only when the correct action is abstention.
- `primary_evidence_source` should identify the source that should control the decision, not just any visible artifact.

## Reported Metrics

The V2 lane should report three metrics together:

- `strict`: exact-match metric over all required fields
- `decision_core`: exact-match metric over `decision_type`, `selected_work_id`, `work_status`, and `primary_evidence_source`
- `canonical_decision_core`: additive secondary metric that keeps the same decision-core fields but collapses near-equivalent labels and abstention status representations

`strict` and `decision_core` remain the literal contract metrics.
`canonical_decision_core` exists to estimate a fair upper bound when the model produces semantically equivalent decision labels such as:

- `resume_with_escalation` versus `resume_blocked_with_escalation`
- `clarifying_question` versus `ask_clarifying_question`
- blank `work_status` versus `blocked` when the answer is a valid abstention with no selected work

The canonical metric is additive only.
It should not replace the exact metrics in writeups or artifact tables.

## Lane Goal

The lane is considered promising if `Tasklog Re-entry` begins to beat `Normalized State` on `decision_core` across multiple families, even when strict natural-language fields remain paraphrase-sensitive.

If both arms still tie across the expanded pack, V2 still needs either stronger ambiguity or stricter normalized-baseline constraints before a superiority claim would be justified.
