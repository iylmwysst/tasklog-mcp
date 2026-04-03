# Tasklog V3 Answer Contract

This document freezes the answer contract for the structured `V3` round.

It applies only to:

- `tasklog_v3_independent_structured_holdout`

## Output Shape

Every answer must return exactly one JSON object.

Required fields:

- `decision_type`
- `selected_work_id`
- `work_status`
- `next_step_summary`
- `clarifying_question`
- `abstention_reason`
- `escalation_target`
- `primary_evidence_source`

Optional appendix-only field:

- `candidate_work_id`

No additional fields are allowed.

## Decision Types

Valid `decision_type` values:

- `resume_work`
- `resume_blocked_with_escalation`
- `ask_clarifying_question`
- `abstain_insufficient_evidence`

## Field Semantics

### `selected_work_id`

- required for `resume_work`
- required for `resume_blocked_with_escalation`
- must be empty for `ask_clarifying_question`
- must be empty for `abstain_insufficient_evidence`

### `candidate_work_id`

- optional and diagnostic-only
- may appear only for `ask_clarifying_question`
- may appear only when the frozen answer key for that fixture marks a provisional candidate as allowed
- must be empty in all other cases

### `work_status`

Canonical non-empty values:

- `active`
- `blocked`
- `planned`
- `in_review`
- `done`

Rules:

- must be non-empty for `resume_work`
- must be non-empty for `resume_blocked_with_escalation`
- must be empty for `ask_clarifying_question`
- must be empty for `abstain_insufficient_evidence`

### `next_step_summary`

- required for `resume_work`
- required for `resume_blocked_with_escalation`
- must be empty for `ask_clarifying_question`
- must be empty for `abstain_insufficient_evidence`
- should be one concise sentence
- should describe the immediate next work-level action, not a multi-step plan

### `clarifying_question`

- required for `ask_clarifying_question`
- must be empty otherwise
- should contain one concrete question only

### `abstention_reason`

- required for `abstain_insufficient_evidence`
- must be empty otherwise
- should state why no resume decision is currently justified

### `escalation_target`

- required for `resume_blocked_with_escalation`
- must be empty otherwise
- should identify the exact owner or role to escalate to

### `primary_evidence_source`

Must be one exact label from:

- `active_context`
- `work_summary`
- `latest_session_log`
- `latest_next_steps`
- `workdoc_plan`
- `workdoc_design`
- `workdoc_spec`
- `workdoc_notes`
- `artifact_file`
- `notes_markdown`
- `conflicting_sources`
- `no_authoritative_source`

These exact labels are interpreted by the frozen ontology file:

- `docs/tasklog-v3-source-family-ontology.json`

## Consistency Rules

- `decision_type` must be internally consistent with all dependent fields
- fields that should be empty for the chosen action type must be empty strings
- `candidate_work_id` must not be used to bypass an empty `selected_work_id`
- `primary_evidence_source` must identify the controlling evidence source, not just any visible source

## Minimal Example

```json
{
  "decision_type": "resume_blocked_with_escalation",
  "selected_work_id": "0tetbC",
  "work_status": "blocked",
  "next_step_summary": "Escalate the scorer contract decision to the benchmark owner before editing the runner.",
  "clarifying_question": "",
  "abstention_reason": "",
  "escalation_target": "benchmark-owner",
  "primary_evidence_source": "latest_session_log",
  "candidate_work_id": ""
}
```

## Strict-Contract Boundary

The strict contract includes only required fields.
`candidate_work_id` is excluded from strict scoring and exists only for appendix-level diagnostics in allowed clarifying fixtures.
