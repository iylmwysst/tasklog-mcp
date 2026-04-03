# Tasklog V3 Fixture Template

This document freezes the authoring template for one fixture in:

- `tasklog_v3_independent_structured_holdout`

It complements:

- `docs/tasklog-v3-independence-protocol.md`
- `docs/tasklog-v3-baseline-payload-contract.md`
- `docs/tasklog-v3-answer-contract.md`
- `docs/tasklog-v3-grader-contract.md`
- `docs/tasklog-v3-scenario-family-inventory.md`

## Purpose

This template defines the required shape of one fixture before answer-key annotation.

It is owned by the `Fixture Author`.
It must not include frozen expected answers.

## One-Fixture Directory Layout

Each fixture directory should preserve:

- `fixture.json`
- `questions.json`
- `surfaces/normalized-state.json`
- `surfaces/tasklog-reentry.json`

After fixture freeze and separate annotation:

- `answer-key.json`

## `fixture.json` Required Shape

Every `fixture.json` should preserve these top-level fields:

- `benchmark_type`
- `round_id`
- `fixture_id`
- `family_id`
- `title`
- `difficulty`
- `rubric_fallback_family`
- `candidate_work_id_allowed`
- `ambiguity_rationale`
- `distractor_rationale`
- `workspace_state`
- `author_notes_for_annotation`

### Field Semantics

- `benchmark_type`
  Must be `tasklog_v3_independent_structured_holdout`

- `round_id`
  Must be `V3a` unless the round is versioned forward

- `fixture_id`
  Must be unique within the pack

- `family_id`
  Must be one exact family id from:
  [tasklog-v3-scenario-family-inventory.md](/Users/Lab/Desktop/WebWay/tasklog-mcp/docs/tasklog-v3-scenario-family-inventory.md)

- `difficulty`
  One of:
  - `medium`
  - `hard`

- `rubric_fallback_family`
  Boolean.
  Must be `true` only if the family was pre-declared as rubric-backed in the frozen family inventory or manifest.

- `candidate_work_id_allowed`
  Boolean.
  Must be `true` only if the family inventory explicitly allows a provisional candidate under `ask_clarifying_question`.

- `ambiguity_rationale`
  Brief explanation of why a strong generic summary might still be insufficient.

- `distractor_rationale`
  Brief explanation of the main distractor source or distractor work.

- `workspace_state`
  The frozen author-owned state used to materialize both arm payloads.

- `author_notes_for_annotation`
  Short neutral note for the annotator describing what kind of ambiguity the fixture was designed to represent.
  This must not contain the final expected answer.

## `workspace_state` Required Shape

`workspace_state` must preserve the raw material needed to generate both arm payloads consistently:

- `active_context`
- `works`
- `session_logs`
- `workdocs`
- `notes_files`
- `artifact_files`

### `active_context`

Required fields:

- `active_work_id`
- `updated_at`

Optional fields:

- `active_work_status`

### `works[]`

Required fields:

- `work_id`
- `title`
- `status`
- `created_at`
- `updated_at`
- `summary`
- `scope_paths`

### `session_logs[]`

Required fields:

- `log_id`
- `work_id`
- `timestamp`
- `summary`
- `next_steps`
- `status`

### `workdocs`

May preserve only the minimum text needed for the authored ambiguity.

Allowed keys:

- `plan`
- `design`
- `spec`
- `notes`

### `notes_files`

Each row should preserve:

- `path`
- `content`

### `artifact_files`

Each row should preserve:

- `work_id`
- `path`

## `questions.json` Required Shape

Each fixture question should preserve:

- `fixture_id`
- `question_id`
- `prompt_version`
- `task`
- `goal`
- `output_contract_path`

### Question Rules

- the question must ask only for the frozen structured answer
- the question must not mention Tasklog-specific hidden policy
- the question must not hint which arm should win
- the question must not expose the expected evidence label

## Surface Materialization Hooks

Before fixture freeze, the Fixture Author must ensure:

- `surfaces/normalized-state.json` can be generated from `workspace_state` using:
  [tasklog-v3-baseline-payload-contract.md](/Users/Lab/Desktop/WebWay/tasklog-mcp/docs/tasklog-v3-baseline-payload-contract.md)
- `surfaces/tasklog-reentry.json` can be generated from `workspace_state` using:
  [tasklog-v3-baseline-payload-contract.md](/Users/Lab/Desktop/WebWay/tasklog-mcp/docs/tasklog-v3-baseline-payload-contract.md)

The Fixture Author must not manually rewrite the arm payloads to favor one arm.

## Authoring Checklist

Every fixture must satisfy all of the following before freeze:

- family id is from the frozen inventory
- ambiguity rationale is explicit
- at least one distractor source or distractor work exists
- both arm payloads are derivable from the same `workspace_state`
- no expected answer appears in author notes
- `candidate_work_id_allowed` matches the family policy
- `rubric_fallback_family` matches the family policy

## Answer-Key Hook Fields

These fields are not authored by the Fixture Author inside `fixture.json`, but the template must leave room for them in later sidecar artifacts:

- `expected_decision_type`
- `expected_selected_work_id`
- `expected_work_status`
- `expected_next_step_slots`
- `expected_clarifying_question`
- `expected_abstention_reason`
- `expected_escalation_target`
- `expected_primary_evidence_source`
- `expected_candidate_work_id`

## Source-Label Guidance For Authors

The Fixture Author must not fill the final `primary_evidence_source` label, but should design the fixture so one of these exact conditions is true:

- one controlling source clearly dominates
- multiple sources conflict and no single authoritative source should control
- no authoritative source exists at all

Important distinction:

- use `conflicting_sources` later in annotation when multiple visible sources point in incompatible directions and the correct behavior is to acknowledge conflict
- use `no_authoritative_source` later in annotation when decisive support is absent, even if there is no explicit conflict

This distinction should be made legible by the fixture design itself, not improvised at annotation time.

## Minimal Skeleton

```json
{
  "benchmark_type": "tasklog_v3_independent_structured_holdout",
  "round_id": "V3a",
  "fixture_id": "v3-001",
  "family_id": "authoritative_log_overrides_note",
  "title": "Newer log supersedes broad note",
  "difficulty": "medium",
  "rubric_fallback_family": false,
  "candidate_work_id_allowed": false,
  "ambiguity_rationale": "A broad note points one way, but the newest structured log narrows the correct action differently.",
  "distractor_rationale": "The note looks rich enough to dominate unless provenance is respected.",
  "workspace_state": {
    "active_context": {
      "active_work_id": "0tetbC",
      "updated_at": "2026-03-29T08:00:00Z"
    },
    "works": [],
    "session_logs": [],
    "workdocs": {},
    "notes_files": [],
    "artifact_files": []
  },
  "author_notes_for_annotation": "Designed to test whether a newer structured log overrides a broader but older note."
}
```
