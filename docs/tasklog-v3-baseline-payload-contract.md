# Tasklog V3 Baseline Payload Contract

This document freezes the arm payload contract for the structured `V3` round.

It applies to:

- `Normalized State`
- `Tasklog Re-entry`

## Scope

This contract applies only to:

- `tasklog_v3_independent_structured_holdout`

It freezes:

- allowed fields
- forbidden fields
- serialization order
- generation algorithm
- truncation policy

## Shared Rules

These rules apply to both arms:

- one frozen payload per `fixture_id + arm_id`
- JSON object serialization only
- stable key order
- UTF-8 text
- no per-fixture hand-written summaries
- no hidden fields not documented in this contract
- no post-freeze arm-format changes inside `V3a`

## Arm A: Normalized State

### Purpose

`Normalized State` is the strong generic baseline.

It may normalize raw state into a compact, consistent shape.
It may not encode product-specific authority resolution.

### Required Top-Level Shape

```json
{
  "benchmark_type": "tasklog_v3_independent_structured_holdout",
  "arm_id": "normalized_state",
  "fixture_id": "v3-001",
  "active_context": {
    "active_work_id": "0tetbC",
    "active_work_status": "active",
    "active_work_updated_at": "2026-03-29T08:00:00Z"
  },
  "works": [
    {
      "work_id": "0tetbC",
      "title": "Measure Tasklog re-entry value",
      "status": "active",
      "created_at": "2026-03-27T20:17:40.668Z",
      "updated_at": "2026-03-29T08:04:52.521Z",
      "scope_paths": ["tasklog-mcp"],
      "short_work_summary": "Design and run local measurements that show whether Tasklog reduces work re-entry time and coordination overhead in practice.",
      "latest_log_summary": "Downgraded the current paper framing from a Q1-level empirical claim to a safer diagnostic positioning.",
      "latest_next_steps": "Review whether the proposed V3 scope and metric split are methodologically sound.",
      "artifact_basenames": ["design.md", "notes.md", "plan.md", "spec.md"]
    }
  ]
}
```

### Allowed Fields

Top-level:

- `benchmark_type`
- `arm_id`
- `fixture_id`
- `active_context`
- `works`

`active_context` fields:

- `active_work_id`
- `active_work_status`
- `active_work_updated_at`

`works[]` fields:

- `work_id`
- `title`
- `status`
- `created_at`
- `updated_at`
- `scope_paths`
- `short_work_summary`
- `latest_log_summary`
- `latest_next_steps`
- `artifact_basenames`

### Forbidden Fields

The payload must not include:

- `recommended_work`
- `winning_source`
- `authority_rank`
- `resolved_priority`
- `selected_work_id`
- any field that states which source should win
- any field that collapses multiple candidates into a final decision
- any field that reproduces Tasklog-specific wording such as `reentry_brief` or `resume_target`

### Generation Algorithm

For each work row:

1. copy `work_id`, `title`, `status`, `created_at`, and `updated_at` from the canonical work record
2. normalize `scope_paths` to repo-relative strings when possible
3. set `short_work_summary` from the canonical work summary field only
4. set `latest_log_summary` from the newest timestamped session-log `summary` for that work
5. set `latest_next_steps` from the newest non-empty session-log `next_steps` for that work
6. set `artifact_basenames` by basename-normalizing the recorded artifact-file paths and sorting them lexicographically

For `active_context`:

1. copy only `active_work_id`
2. copy only active work `status` if present
3. copy only active-context `updated_at` if present

The generator must not:

- merge note text, work summary, and logs into a new synthetic sentence
- inject source precedence judgments
- rank works
- drop a conflicting field because another source looks more trustworthy

### Truncation Policy

- `short_work_summary`: maximum `240` characters
- `latest_log_summary`: maximum `240` characters
- `latest_next_steps`: maximum `240` characters
- `artifact_basenames`: maximum `8` items
- `scope_paths`: maximum `6` items

If truncation occurs:

- truncate by character count
- preserve original text prefix
- do not paraphrase

### Serialization Order

Top-level key order:

1. `benchmark_type`
2. `arm_id`
3. `fixture_id`
4. `active_context`
5. `works`

`works[]` key order:

1. `work_id`
2. `title`
3. `status`
4. `created_at`
5. `updated_at`
6. `scope_paths`
7. `short_work_summary`
8. `latest_log_summary`
9. `latest_next_steps`
10. `artifact_basenames`

## Arm B: Tasklog Re-entry

### Purpose

`Tasklog Re-entry` is the product-shaped comparison arm.

For `V3a`, it is frozen as a static serialization of the `Brief` surface rather than an interactive trace.

### Required Top-Level Shape

```json
{
  "benchmark_type": "tasklog_v3_independent_structured_holdout",
  "arm_id": "tasklog_reentry",
  "fixture_id": "v3-001",
  "surface_name": "brief",
  "active_context": {
    "active_work_id": "0tetbC",
    "active_work_status": "active",
    "active_work_updated_at": "2026-03-29T08:00:00Z"
  },
  "open_work_briefs": [
    {
      "work_id": "0tetbC",
      "title": "Measure Tasklog re-entry value",
      "status": "active",
      "updated_at": "2026-03-29T08:04:52.521Z",
      "scope_paths": ["tasklog-mcp"],
      "summary": "Design and run local measurements that show whether Tasklog reduces work re-entry time and coordination overhead in practice.",
      "latest_log_summary": "Downgraded the current paper framing from a Q1-level empirical claim to a safer diagnostic positioning.",
      "next_step_summary": "Review whether the proposed V3 scope and metric split are methodologically sound.",
      "artifact_files": ["design.md", "notes.md", "plan.md", "spec.md"]
    }
  ]
}
```

### Allowed Fields

Top-level:

- `benchmark_type`
- `arm_id`
- `fixture_id`
- `surface_name`
- `active_context`
- `open_work_briefs`

`active_context` fields:

- `active_work_id`
- `active_work_status`
- `active_work_updated_at`

`open_work_briefs[]` fields:

- `work_id`
- `title`
- `status`
- `updated_at`
- `scope_paths`
- `summary`
- `latest_log_summary`
- `next_step_summary`
- `artifact_files`

### Generation Algorithm

For each open work brief:

1. copy `work_id`, `title`, `status`, and `updated_at` from the canonical work record
2. normalize `scope_paths` to repo-relative strings when possible
3. copy `summary` from the canonical work summary field
4. copy `latest_log_summary` from the newest timestamped session-log `summary`
5. copy `next_step_summary` from the newest non-empty session-log `next_steps`
6. basename-normalize `artifact_files` and sort them lexicographically

`surface_name` must be:

- `brief`

### Truncation Policy

- `summary`: maximum `240` characters
- `latest_log_summary`: maximum `240` characters
- `next_step_summary`: maximum `240` characters
- `artifact_files`: maximum `8` items
- `scope_paths`: maximum `6` items

### Serialization Order

Top-level key order:

1. `benchmark_type`
2. `arm_id`
3. `fixture_id`
4. `surface_name`
5. `active_context`
6. `open_work_briefs`

`open_work_briefs[]` key order:

1. `work_id`
2. `title`
3. `status`
4. `updated_at`
5. `scope_paths`
6. `summary`
7. `latest_log_summary`
8. `next_step_summary`
9. `artifact_files`

## Change Rule

If either arm's field inventory, ordering, truncation policy, or generation algorithm changes after fixture drafting begins:

- stop the round
- version the changed contract
- restart as a new round
