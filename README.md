# Tasklog MCP

Small `stdio` MCP server for chronological task handoffs across coding sessions.

It keeps a chronological log so an LLM can:

- read recent work before starting a new session
- append a short high-level summary before ending a session
- see which files were touched without burning tokens on large diffs

## Reliability Notes

- Log writes are serialized within the server process so overlapping tool calls do not drop entries.
- Storage writes are atomic per file using a temp file plus rename.
- The JSON and Markdown log paths are constrained to stay inside the selected project root.
- Markdown output escapes user-controlled fields so summaries, tags, and paths render as content instead of altering document structure.
- This is still a local single-process logbook. If multiple independent server processes point at the same project simultaneously, there is no cross-process file lock yet.

## Observability

- The server writes structured JSON logs to `stderr`, never `stdout`, so MCP protocol traffic stays clean.
- Startup logs include `cwd`, `project_root`, `json_path`, and `markdown_path`.
- Tool failures emit an error event with the tool name and summarized arguments.
- Read and persist failures emit explicit log events from the storage layer.
- Set `LOGBOOK_DEBUG=1` to enable debug-level tool start/success logs during Codex integration troubleshooting.

## Installation

### npm / npx

```bash
npx -y tasklog-mcp
```

For a global install:

```bash
npm install -g tasklog-mcp
tasklog-mcp
```

## Resources

- `tasklog://usage` explains when the AI should read or write logs, plus writing rules.
- `tasklog://schema` documents the current entry shape and lifecycle fields.
- `tasklog://examples` contains good and bad examples for log quality.

## Tools

### `get_recent_logs`

Input:

- `limit`: number of recent entries to read

Returns recent entries in reverse chronological order, plus the JSON and Markdown log file paths.

### `append_session_log`

Input:

- `summary`: one or two sentences describing what changed and why or what outcome it produced
- `status`: `WIP`, `Done`, or `Blocked`
- `change_type`: `feature`, `bugfix`, `refactor`, `investigation`, `docs`, `test`, or `config`
- `affected_files`: changed file paths
- `tags`: optional project-defined tags
- `next_steps`: optional handoff note for the next session
- `blockers`: optional blocker note
- `related_log_ids`: optional earlier entries this work relates to
- `supersedes_log_id`: optional older entry this new one takes over

Appends a timestamped entry and rewrites two local files:

- `.ai-history.json`
- `.ai-session-log.md`

### `get_open_threads`

Input:

- `limit`: number of unresolved or follow-up-worthy entries to read

Returns logs that are still active, blocked, or carry next-step notes.

### `update_log_status`

Input:

- `log_id`: log entry id
- `status`: `WIP`, `Done`, `Blocked`, or `Superseded`

Updates only the lifecycle status of an existing entry.

### `amend_log_metadata`

Input:

- `log_id`: log entry id
- any subset of `affected_files`, `tags`, `next_steps`, `blockers`

Amends limited metadata without rewriting the original summary.

## Recommended Agent Workflow

- Start of a new session or context recovery: call `get_recent_logs`
- Resuming unfinished work or asking what is still open: call `get_recent_logs` and `get_open_threads`
- If files were edited during the session: finish by calling `append_session_log`

## Local development

```bash
cd tasklog-mcp
npm install
npm run build
```

Run it against a specific project root:

```bash
node dist/index.js --project-root /Users/Lab/Desktop/WebWay/CodeWebway
```

Or with `tsx` during development:

```bash
npm run dev -- --project-root /Users/Lab/Desktop/WebWay/CodeWebway
```

If `--project-root` is omitted, the server stores logs in the current working directory. That is the recommended default when this MCP is attached per workspace, because each opened folder gets its own `.ai-history.json` and `.ai-session-log.md`.

## MCP Config

### Generic stdio MCP config

Add this to your MCP config:

```json
{
  "mcpServers": {
    "tasklog": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "tasklog-mcp"
      ],
      "env": {}
    }
  }
}
```

This uses the current workspace path by default. If you want to override that and point somewhere else explicitly, add `--project-root <path>`. You can also use:

- `LOGBOOK_PROJECT_ROOT`
- `LOGBOOK_JSON_FILE`
- `LOGBOOK_MARKDOWN_FILE`

### Codex CLI

```bash
codex mcp add tasklog -- npx -y tasklog-mcp
```

### Claude Desktop

```json
{
  "mcpServers": {
    "tasklog": {
      "command": "npx",
      "args": ["-y", "tasklog-mcp"]
    }
  }
}
```

### Cursor

```json
{
  "mcpServers": {
    "tasklog": {
      "command": "npx",
      "args": ["-y", "tasklog-mcp"]
    }
  }
}
```

### Local package during development

```json
{
  "mcpServers": {
    "tasklog": {
      "type": "stdio",
      "command": "node",
      "args": [
        "/absolute/path/to/tasklog-mcp/dist/index.js"
      ],
      "env": {}
    }
  }
}
```

## Publishing Checklist

```bash
npm run test
npm run build
npm publish --access public
```
