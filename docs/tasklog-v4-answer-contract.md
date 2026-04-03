# Tasklog V4 Answer Contract

This document freezes the answer contract for the SWE-grounded `V4` round.

It applies only to:

- `tasklog_v4_swe_grounded_reentry`

It complements:

- `docs/tasklog-v4-fixture-provenance-contract.md`
- `docs/tasklog-v4-grader-contract.md`
- `docs/tasklog-v4-source-family-ontology.json`
- `docs/tasklog-v4-adjudication-guide.md`

## Output Shape

Every answer must return exactly one JSON object.

Required fields:

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

Optional appendix-only field:

- `selection_rationale`

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

### `selected_work_title`

- required for `resume_work`
- required for `resume_blocked_with_escalation`
- must be empty for `ask_clarifying_question`
- must be empty for `abstain_insufficient_evidence`
- must name the same work as `selected_work_id`

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
- should state why no justified resume decision is currently licensed

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

- `docs/tasklog-v4-source-family-ontology.json`

### `other_candidate_work_ids`

- must always be present as a JSON array
- may contain one provisional candidate only for `ask_clarifying_question`
- may contain a provisional candidate only when the frozen fixture manifest marks `candidate_work_id_allowed` as `true`
- must be `[]` for every other case

### `selection_rationale`

- optional and appendix-only
- must not affect claim-bearing grading
- may briefly justify why the selected answer is licensed by the frozen evidence

## Consistency Rules

- `decision_type` must be internally consistent with all dependent fields
- fields that should be empty for the chosen action type must be empty strings
- `other_candidate_work_ids` must not be used to bypass an empty `selected_work_id`
- `primary_evidence_source` must identify the controlling evidence source, not just any visible source

## Minimal Example

```json
{
  "decision_type": "resume_blocked_with_escalation",
  "selected_work_id": "D8K2M4",
  "selected_work_title": "Resolve docker utility permission boundary",
  "work_status": "blocked",
  "next_step_summary": "Escalate the Docker utility permission boundary to the harness owner before editing `swebench/harness/docker_utils.py`.",
  "clarifying_question": "",
  "abstention_reason": "",
  "escalation_target": "harness-owner",
  "primary_evidence_source": "latest_next_steps",
  "other_candidate_work_ids": [],
  "selection_rationale": ""
}
```

## Strict-Contract Boundary

The strict contract includes only required fields.
`selection_rationale` is excluded from strict scoring and exists only for appendix-level diagnostics.
