# Tasklog MCP Work-First Context Implementation Plan

Date: 2026-03-27
Status: Proposed
Depends on: `docs/2026-03-27-work-first-context-design.md`

## Summary

This plan implements the work-first redesign for Tasklog MCP in controlled phases.

The target end state is:

- one centralized human-facing document root at `workdocs/`
- one machine-facing state root at `.tasklog/`
- 6-character base62 ids for all human-facing work and log references
- `work` as the main discovery unit
- `log` reduced to session activity only
- separate work artifacts for `note`, `design`, `plan`, and `spec`
- minimal scope metadata at the work level: `start_dir` and `scope_paths`
- plan-level `target_paths` so cross-repo work can still implement only one side at a time

This plan intentionally stages the migration so the current logbook remains usable throughout implementation.

## Locked Decisions

These should be treated as fixed inputs for implementation:

- Human-facing docs live under `workdocs/`
- Machine state lives under `.tasklog/`
- Only `work_id` and `log_id` are required ids at this stage
- `work_id` and `log_id` use fixed 6-character base62 ids
- Work scope uses `start_dir` and `scope_paths`
- Plan scope uses `target_paths`
- `active_work` is a session hint, not authoritative truth
- `get_open_threads` is heading toward deprecation in favor of work-level discovery

## Out of Scope for Phase 1

- Full removal of legacy logbook files
- Multiple plan files per work
- Multiple spec files per work
- Cross-process locking beyond the current server-process mutation lock
- Remote sync or shared database storage

## Target File Layout

```text
<workspace_root>/
  .tasklog/
    works.json
    session-log.json
    session-log.md
    active-context.json
  workdocs/
    <work_id>-<slug>/
      design.md
      plan.md
      spec.md
      notes.md
```

Notes:

- `session-log.json` and `session-log.md` replace the old hidden filenames over time, but compatibility should be preserved during migration.
- `active-context.json` holds session-level active-work state and freshness metadata.

## Data Model

### Work Record

Stored in `.tasklog/works.json`.

```ts
type WorkStatus = "active" | "blocked" | "done";

interface WorkRecord {
  work_id: string; // 6-char base62
  title: string;
  slug: string;
  status: WorkStatus;
  start_dir: string;
  scope_paths: string[];
  summary?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}
```

### Log Record

Existing log records should gain optional `work_id` and move toward a 6-character base62 `log_id`.

```ts
type LogStatus = "WIP" | "Done" | "Blocked" | "Superseded";

interface SessionLogEntry {
  id: string; // 6-char base62
  work_id?: string;
  timestamp: string;
  summary: string;
  status: LogStatus;
  change_type: ChangeType;
  affected_files: string[];
  tags?: string[];
  next_steps?: string;
  blockers?: string;
  related_log_ids?: string[];
  supersedes_log_id?: string;
  revision: number;
  created_at: string;
  updated_at: string;
}
```

### Active Context

Stored in `.tasklog/active-context.json`.

```ts
type ActiveWorkFreshness = "fresh" | "stale" | "invalid";

interface ActiveContext {
  active_work_id?: string;
  project_root: string;
  updated_at?: string;
  freshness?: ActiveWorkFreshness;
}
```

## Artifact Templates

Every work artifact should include minimal frontmatter.

### `design.md`

```md
---
work_id: a91K2x
title: Work-first context model
status: active
start_dir: /Users/Lab/Desktop/WebWay/tasklog-mcp
scope_paths:
  - /Users/Lab/Desktop/WebWay/tasklog-mcp
updated_at: 2026-03-27T00:00:00.000Z
---
```

### `plan.md`

```md
---
work_id: a91K2x
title: Work-first context model
status: active
start_dir: /Users/Lab/Desktop/WebWay/tasklog-mcp
scope_paths:
  - /Users/Lab/Desktop/WebWay/tasklog-mcp
target_paths:
  - /Users/Lab/Desktop/WebWay/tasklog-mcp
updated_at: 2026-03-27T00:00:00.000Z
---
```

### `spec.md`

Same as `design.md`, without `target_paths`.

### `notes.md`

May use the same frontmatter or a lighter header. Keep it append-friendly.

## Tool Rollout

### New Tools

Phase in these new tools:

1. `get_active_context`
2. `list_works`
3. `start_work`
4. `resume_work`
5. `set_work_status`
6. `read_work_context`
7. `create_design_doc`
8. `create_plan_doc`
9. `create_spec_doc`
10. `append_work_note`

### Existing Tools to Modify

1. `append_session_log`
2. `get_recent_logs`
3. `update_log_status`
4. `amend_log_metadata`

### Tool to Deprecate

1. `get_open_threads`

## Phase Plan

### Phase 1: Foundations

Goal:

Create the new storage model and work index without breaking current log usage.

Tasks:

1. Add helpers for 6-character base62 id generation.
2. Introduce `.tasklog/` path resolution and create the new storage files if missing.
3. Add `workdocs/` path resolution and safe path creation.
4. Add the `WorkRecord` model and `.tasklog/works.json` persistence helpers.
5. Add `ActiveContext` model and `.tasklog/active-context.json` persistence helpers.
6. Preserve current `.ai-history.json` and `.ai-session-log.md` read support during migration.

Deliverables:

- Base62 id utility
- Work storage read/write layer
- Active-context read/write layer
- Path/config updates

Files likely touched:

- `src/config.ts`
- `src/logbook.ts`
- `src/index.ts`
- `src/resources.ts`
- `src/logbook.test.ts`

### Phase 2: Work Discovery Tools

Goal:

Make `work` the unit of context recovery.

Tasks:

1. Implement `get_active_context`.
2. Implement `list_works`.
3. Implement `start_work`.
4. Implement `resume_work`.
5. Implement `set_work_status`.
6. Implement `read_work_context`.
7. Add compact summary formatting for work discovery.

Behavior requirements:

- `project_root` comes from launch context
- `active_work` is returned with freshness status
- `list_works` returns concise summaries, not raw logs
- `resume_work` updates active context only; it does not mutate work content

Deliverables:

- New MCP tool registrations
- Work summary formatter
- Initial active-work resolution rules

Files likely touched:

- `src/index.ts`
- `src/logbook.ts`
- `src/resources.ts`
- `src/response-format.ts`
- `src/logbook.test.ts`
- `src/response-format.test.ts`

### Phase 3: Artifact Creation Tools

Goal:

Create first-class work artifacts in `workdocs/`.

Tasks:

1. Implement `create_design_doc`.
2. Implement `create_plan_doc`.
3. Implement `create_spec_doc`.
4. Implement `append_work_note`.
5. Add template generation for frontmatter and default body sections.
6. Ensure `create_plan_doc` supports `target_paths` as a subset of `scope_paths`.

Behavior requirements:

- Doc creation is idempotent if the file already exists
- `target_paths` defaults to `scope_paths` when omitted
- Invalid `target_paths` outside `scope_paths` must fail validation

Deliverables:

- Template writer
- Work artifact path resolver
- New doc/note tool registrations

Files likely touched:

- `src/index.ts`
- `src/logbook.ts`
- `src/resources.ts`
- `src/logbook.test.ts`

### Phase 4: Log Semantics Migration

Goal:

Make logs work-aware and reduce their role to session activity only.

Tasks:

1. Extend `append_session_log` to attach `work_id` by default when confidence is high.
2. Update `get_recent_logs` to default to the active work unless project-wide history is explicitly requested.
3. Add ambiguity checks when `active_work` is stale, invalid, or clearly mismatched.
4. Introduce 6-character base62 `log_id` generation for new entries.
5. Continue reading legacy UUID-like ids without rewriting old history immediately.

Behavior requirements:

- No silent write to a dubious active work
- Legacy logs remain readable
- New human-facing references use short ids

Deliverables:

- Work-aware logging
- Active-work ambiguity guard
- Legacy-id compatibility layer

Files likely touched:

- `src/index.ts`
- `src/logbook.ts`
- `src/response-format.ts`
- `src/logbook.test.ts`
- `src/response-format.test.ts`

### Phase 5: Deprecation and Guidance Cleanup

Goal:

Shift agent guidance from log-first to work-first.

Tasks:

1. Update `README.md` to document work-first usage.
2. Update MCP resources to describe when to use `log` vs `note` vs `design` vs `plan` vs `spec`.
3. Mark `get_open_threads` as deprecated in docs and resources.
4. Keep the tool temporarily if compatibility is still needed, but redirect guidance toward `list_works(status=open)`.

Deliverables:

- Updated docs
- Updated usage resource
- Explicit deprecation notice

Files likely touched:

- `README.md`
- `src/resources.ts`
- `src/index.ts`

## Validation Rules

### Base62 IDs

- Length must be exactly 6
- Allowed chars: `0-9`, `a-z`, `A-Z`
- Generation must retry on collision
- `work_id` and `log_id` share the same format

### Scope

- `start_dir` must exist or be within the workspace root
- `scope_paths` must be normalized absolute paths
- `scope_paths` must not escape the workspace root
- `target_paths` must be a subset of `scope_paths`

### Active Work

- Closed work cannot become the default write target without explicit reopen or resume
- Stale active work must lower confidence
- Invalid active work must not be used for implicit writes

## Testing Plan

Add or update tests for:

1. Base62 id format and collision retry
2. Work creation and persistence
3. Active-context persistence and freshness handling
4. Work listing and compact summaries
5. Work resume and status changes
6. Artifact creation idempotency
7. `target_paths` subset validation
8. Work-aware logging defaults
9. Legacy log compatibility
10. Deprecation-safe `get_open_threads` behavior during migration

## Migration Notes

### Legacy Files

Continue reading:

- `.ai-history.json`
- `.ai-session-log.md`

New writes should gradually move toward:

- `.tasklog/session-log.json`
- `.tasklog/session-log.md`

The migration should not require rewriting old entries immediately.

### Legacy IDs

Continue reading existing UUID-like log ids.

Do not rewrite historical ids in place during the first implementation phase. Only new writes need the short 6-character base62 format.

## Recommended Build Order

1. Phase 1 foundations
2. Phase 2 work discovery tools
3. Phase 3 artifact creation tools
4. Phase 4 log semantics migration
5. Phase 5 docs and deprecation cleanup

This order minimizes breakage because it introduces work storage and work discovery before changing how logs are interpreted.

## Exit Criteria

The redesign is ready for daily use when all of the following are true:

- A new session can recover context from work summaries instead of raw logs
- The AI can start or resume work without inventing ids
- Work docs live under `workdocs/`
- Plan docs support `target_paths`
- New logs use 6-character base62 ids
- Legacy logs remain readable
- The recommended workflow no longer depends on `get_open_threads`
