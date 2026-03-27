# Tasklog MCP

Small `stdio` MCP server for work-first task handoffs across coding sessions.

Tasklog gives a coding agent a lightweight local continuity layer for one `project_root` at a time. It is built to answer a narrow set of questions quickly:

- What am I working on right now?
- What work is still open?
- Where should design notes, plans, specs, and reminders live?
- What changed in the last session?
- If a work is already closed, what is the right re-entry brief?

Tasklog is intentionally work-first, not log-first.

## Why It Exists

Most session logging tools drift toward one of two extremes:

- a raw chronological notebook that gets expensive to reread
- a broad memory system that tries to remember everything

Tasklog stays narrower than both.

- `work` is the main unit of continuity
- `log` is for session handoff only
- `workdocs/` hold the durable human-facing artifacts
- closed-work `summary.md` exists only to accelerate re-entry into that work

The goal is to make session recovery cheap without turning Tasklog into a general memory layer.

## Quick Start

Run with `npx`:

```bash
npx -y tasklog-mcp
```

Or install globally:

```bash
npm install -g tasklog-mcp
tasklog-mcp
```

Add it to Codex:

```bash
codex mcp add tasklog -- npx -y tasklog-mcp
```

By default, Tasklog uses the current working directory as `project_root`. To point it elsewhere:

```bash
npx -y tasklog-mcp --project-root /path/to/workspace
```

## Mental Model

Tasklog separates continuity into two layers:

- machine-facing state under `.tasklog/`
- human-facing work artifacts under `workdocs/`

The main objects are:

- `work`: one coherent effort
- `log`: one session handoff entry
- `design.md`: goals, constraints, tradeoffs
- `plan.md`: execution sequence and target paths
- `spec.md`: exact behavior or contract details
- `notes.md`: lightweight reminders
- `summary.md`: optional re-entry brief for selected closed work

In practice:

- active work is driven by recent logs plus current workdocs
- small closed work can stay raw
- selected closed work can become summary-first

## Typical Flow

1. Start with `get_active_context`
2. If needed, use `list_works` and `resume_work`
3. Call `read_work_context`
4. Use workdocs and logs according to intent

Recommended tool choices:

- start a new effort: `start_work`
- continue an existing effort: `resume_work`
- capture approach: `create_design_doc`
- capture implementation steps: `create_plan_doc`
- capture exact rules: `create_spec_doc`
- note something down: `append_work_note`
- record a session handoff: `append_session_log`

## Closed-Work Summaries

Tasklog can attach `summary.md` to selected closed work items.

This summary is intentionally narrow:

- it is the canonical re-entry brief for that work
- it is not a generic retrieval layer for arbitrary project facts
- it does not replace project docs, code search, or architecture tools
- it does not create free-floating memory objects outside a work item

For `closed/consolidated` work:

- `read_work_context` is summary-first and path-first
- `summary.md` is the default entrypoint
- `include_summary=true` inlines the summary body only when needed
- `include_recent_logs=true` loads raw log evidence only when needed

By default, consolidated work does not inline the summary body or recent logs.

## Work Records

Each `work` has:

- `work_id`: 6-character base62 id
- `title`
- `slug`
- `status`: `active`, `blocked`, or `done`
- optional `impact`: `low`, `medium`, `high`, or `critical`
- `start_dir`
- `scope_paths`
- optional `summary`
- optional `tags`
- `created_at`
- `updated_at`

`impact` is work metadata. It helps decide whether a closed work deserves a canonical re-entry brief. It is not a separate memory object.

## Scope Model

Tasklog separates overall work scope from the narrower scope of one implementation pass:

- work scope lives in `start_dir` and `scope_paths`
- plan scope lives in `target_paths` inside `plan.md`

One `project_root` can be:

- a single repo
- or a parent workspace containing multiple repos

Tasklog tracks one workspace root at a time, not one git repo at a time.

## Storage Layout

```text
<project_root>/
  .tasklog/
    works.json
    active-context.json
    session-log.json
    session-log.md
  workdocs/
    <work_id>-<slug>/
      design.md
      plan.md
      spec.md
      summary.md
      notes.md
```

Authoritative sources:

- `.tasklog/works.json`: machine-facing work state
- `.tasklog/session-log.json`: machine-facing session logs
- `workdocs/`: human-facing work artifacts
- `active_work`: session hint only, not the source of truth

Compatibility notes:

- canonical log writes are mirrored to legacy `.ai-history.json`
- canonical markdown log writes are mirrored to legacy `.ai-session-log.md`
- if canonical JSON does not exist yet, Tasklog can still read legacy `.ai-history.json`

## Tool Surface

Work discovery:

- `get_active_context`
- `list_works`
- `start_work`
- `resume_work`
- `set_work_impact`
- `set_work_status`
- `read_work_context`

Artifact creation:

- `create_design_doc`
- `create_plan_doc`
- `create_spec_doc`
- `create_summary_doc`
- `append_work_note`

Logs:

- `get_recent_logs`
- `append_session_log`
- `update_log_status`
- `amend_log_metadata`

Deprecated compatibility:

- `get_open_threads`

Prefer `list_works(status="open")` for new flows.

## Boundaries

Tasklog is not:

- a full journal
- a generic memory MCP
- a note vault for arbitrary facts
- a replacement for project docs, code search, or architecture tools

Design goals:

- keep it small
- keep it explicit
- keep it low-drag
- keep it handoff-friendly
- keep it lean

## Reliability Notes

- writes are serialized within one server process
- writes are atomic per file using temp-file replacement
- multi-file operations are not transactionally atomic
- all machine and document paths stay inside the selected `project_root`
- multiple server processes pointing at the same root are not a supported coordination mode

## Resources

The MCP server exposes:

- `tasklog://usage`
- `tasklog://schema`
- `tasklog://examples`

These are the detailed references for workflow rules, schemas, and examples.

## Local Development

```bash
cd tasklog-mcp
npm install
npm test
npm run build
```

Run against a specific project root:

```bash
node dist/index.js --project-root /Users/Lab/Desktop/WebWay/CodeWebway
```

Or during development:

```bash
npm run dev -- --project-root /Users/Lab/Desktop/WebWay/CodeWebway
```

If `--project-root` is omitted, the server uses the current working directory.

## MCP Config

Generic stdio config:

```json
{
  "mcpServers": {
    "tasklog": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "tasklog-mcp"],
      "env": {}
    }
  }
}
```

If you want to point somewhere else explicitly, add `--project-root <path>` to `args`.

Legacy compatibility environment variables are still supported:

- `LOGBOOK_PROJECT_ROOT`
- `LOGBOOK_JSON_FILE`
- `LOGBOOK_MARKDOWN_FILE`

Claude Desktop and Cursor can use the same stdio command pattern.
