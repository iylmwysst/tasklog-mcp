import {
  APPENDABLE_LOG_STATUSES,
  CHANGE_TYPES,
  LOG_STATUSES,
} from "./logbook.js";

const statusBullets = APPENDABLE_LOG_STATUSES.map((status) => `- \`${status}\``).join("\n");
const lifecycleStatusBullets = LOG_STATUSES.map((status) => `- \`${status}\``).join("\n");
const changeTypeBullets = CHANGE_TYPES.map((changeType) => `- \`${changeType}\``).join("\n");

export const USAGE_RESOURCE_TEXT = `# Logbook Usage

This MCP exists to keep a chronological project log that helps an AI recover context, hand work off between sessions, and narrow likely causes when something breaks.

## Trigger rules

These rules are intent-based, not phrase-based. They apply regardless of the user's language or exact wording.

### Read before proceeding

Read the logbook before doing substantial work when the user expresses intent to:

- continue prior work
- recover previous context
- inspect unfinished work
- ask what was done earlier
- debug a regression that may be related to recent edits

Use:

- \`get_recent_logs(limit=5)\` for recent context recovery
- \`get_recent_logs(limit=5)\` plus \`get_open_threads(limit=5)\` when the user wants to resume unfinished work or asks what is still open

### Write before closing work

If the session changed one or more files, the work is not considered done until a log entry has been written.

Use \`append_session_log\` when:

- a meaningful task or fix is finished
- the session is about to end
- work is stopping mid-task and the next step should be preserved
- high-risk areas were changed and future debugging would benefit from a handoff entry

## Required field behavior

- If the work is unfinished, use \`status = "WIP"\` and provide \`next_steps\`
- If progress is blocked, use \`status = "Blocked"\` and provide \`blockers\`
- If the work is complete within the intended scope, use \`status = "Done"\`

## Writing rules

- \`summary\` must explain both what changed and why or what outcome it produced
- \`affected_files\` should list only files that were actually edited
- \`status\` is about current progress, not the type of work
- \`change_type\` describes the kind of work that was done
- \`tags\` are optional, project-specific, lowercase, and short
- \`next_steps\` should tell the next session where to continue
- \`blockers\` should only be used for real external or unresolved constraints

## Status values for append_session_log

${statusBullets}

## Status values for update_log_status

${lifecycleStatusBullets}

## Change types

${changeTypeBullets}

## Do not do this

- Do not write vague summaries like \`updated code\` or \`fixed stuff\`
- Do not paste raw diffs into the summary
- Do not list files that were only inspected
- Do not create a new log for every tiny edit
- Do not rewrite old summaries when the work evolves; append a follow-up log instead
`;

export const SCHEMA_RESOURCE_TEXT = `# Logbook Schema

\`\`\`ts
type LogStatus = "WIP" | "Done" | "Blocked" | "Superseded";

type ChangeType =
  | "feature"
  | "bugfix"
  | "refactor"
  | "investigation"
  | "docs"
  | "test"
  | "config";

interface SessionLogEntry {
  id: string;
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
\`\`\`

## Notes

- \`summary\` should usually be one or two sentences
- \`tags\` are freeform and project-defined
- \`revision\` increases when metadata or status is amended
- \`supersedes_log_id\` lets a new log take over an older thread without deleting history
`;

export const EXAMPLES_RESOURCE_TEXT = `# Logbook Examples

## Good Example: Finished Refactor

\`\`\`json
{
  "summary": "Refactored session refresh handling so expired tokens fail closed instead of reopening the dashboard loop.",
  "status": "Done",
  "change_type": "refactor",
  "affected_files": ["src/auth.ts", "src/router.ts", "src/session.ts"],
  "tags": ["session-refresh", "routing"],
  "blockers": ""
}
\`\`\`

This example is fully done within its intended scope, so it does not carry a handoff step.

## Good Example: Investigation In Progress

\`\`\`json
{
  "summary": "Started investigating intermittent PTY disconnects after host-login approval. Confirmed the issue happens after reconnect, but the exact event ordering is still unclear.",
  "status": "WIP",
  "change_type": "investigation",
  "affected_files": ["src/server.rs", "src/session.rs"],
  "tags": ["pty-session", "host-login"],
  "next_steps": "Trace reconnect flow around websocket reattachment and approval state propagation.",
  "blockers": ""
}
\`\`\`

## Bad Example

\`\`\`json
{
  "summary": "Updated auth",
  "status": "Done",
  "change_type": "bugfix",
  "affected_files": ["src/auth.ts"]
}
\`\`\`

Why it is bad:

- The summary does not say what changed
- The summary does not say what outcome was achieved
- There is no next step even though the change might need follow-up
`;
