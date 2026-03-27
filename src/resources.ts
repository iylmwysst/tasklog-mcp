import {
  ACTIVE_WORK_FRESHNESS,
  APPENDABLE_LOG_STATUSES,
  CHANGE_TYPES,
  LOG_STATUSES,
  WORK_STATUSES,
} from "./logbook.js";

const statusBullets = APPENDABLE_LOG_STATUSES.map((status) => `- \`${status}\``).join("\n");
const lifecycleStatusBullets = LOG_STATUSES.map((status) => `- \`${status}\``).join("\n");
const changeTypeBullets = CHANGE_TYPES.map((changeType) => `- \`${changeType}\``).join("\n");
const workStatusBullets = WORK_STATUSES.map((status) => `- \`${status}\``).join("\n");
const freshnessBullets = ACTIVE_WORK_FRESHNESS.map((status) => `- \`${status}\``).join("\n");

export const USAGE_RESOURCE_TEXT = `# Tasklog Usage

Tasklog MCP now works best in a work-first flow.

## Mental model

- \`work\` is the main unit of discovery and resume
- \`log\` is for session activity only
- \`note\` is for lightweight capture
- \`design\`, \`plan\`, and \`spec\` are first-class work artifacts
- human-facing docs live under \`workdocs/\`
- machine-facing state lives under \`.tasklog/\`

## Design principles

- Keep it small: solve handoff and note-taking pain directly instead of becoming a general memory system.
- Keep it explicit: prefer clear work and artifact boundaries over hidden state.
- Keep it low-drag: it should be easier to jot something down than to debate the workflow.
- Keep it handoff-friendly: another session should be able to recover the right context quickly.
- Keep it lean: avoid features that make context heavier or the tool itself harder to manage.

## Authoritative state

- \`workdocs/\` is the human-facing source of truth for \`design\`, \`plan\`, \`spec\`, and \`notes\`
- \`.tasklog/works.json\` is the machine-facing source of truth for works
- \`.tasklog/session-log.json\` is the machine-facing source of truth for logs
- \`active_work\` is only a hint for the current session
- \`target_paths\` in \`plan.md\` is the authoritative implementation scope for that plan

## Intent matrix

- user asks what is open -> \`get_active_context\`, then \`list_works(status="open")\`
- user wants to continue prior work -> \`get_active_context\`, then \`resume_work\` if needed, then \`read_work_context\`
- user starts a new effort -> \`start_work\`
- user says note this down -> \`append_work_note\`
- user wants approach or tradeoffs -> \`create_design_doc\`
- user wants steps or rollout -> \`create_plan_doc\`
- user wants exact rules or contract details -> \`create_spec_doc\`
- session changed files and is ending -> \`append_session_log\`

## Recommended workflow

### Start or resume work

Use:

- \`get_active_context\` at the start of a session
- \`list_works(status="open")\` when the user asks what is still open
- \`start_work\` for a new task
- \`resume_work\` when the user wants to continue an existing task
- \`read_work_context\` before substantial implementation inside one work

### Create artifacts by intent

Use:

- \`create_design_doc\` when the user wants to reason about goals, tradeoffs, or approach
- \`create_plan_doc\` when the user wants implementation steps
- \`create_spec_doc\` when the user needs exact behavior or contract details
- \`append_work_note\` when the user says to note something down

### Use logs for session handoff

Use \`append_session_log\` when:

- files changed during the session
- a meaningful fix or implementation pass is ending
- work is pausing and the next session needs a handoff

The log should summarize what happened in this session. It should not replace work docs.

## Do / Don't

- Do keep one work per coherent effort
- Do use logs for session handoff, not for all thinking
- Do use notes for lightweight reminders and observations
- Don't create a new work for every tiny edit
- Don't append a log for every small change in one continuous session
- Don't use Tasklog as a full journal or general memory dump
- Don't silently widen work scope without a clear reason

## Ambiguity rules

- If \`active_work\` is fresh and clearly matches the user's intent, reuse it
- If \`active_work\` is stale, invalid, or mismatched, prefer \`list_works\` or explicit \`resume_work\`
- If no work is unambiguous, do not guess silently
- If \`plan.md\` already exists, repeated \`target_paths\` must either match the file or fail
- If the user only asks to note something, default to \`append_work_note\`, not \`append_session_log\`

## Work and scope rules

- Work ids and new log ids are 6-character base62 strings
- Work scope is tracked by \`start_dir\` and \`scope_paths\`
- Plan scope is tracked by \`target_paths\`
- \`target_paths\` must stay within \`scope_paths\`
- \`active_work\` is a session hint, not authoritative truth

## Active context freshness

${freshnessBullets}

## Log status values for append_session_log

${statusBullets}

## Lifecycle status values for update_log_status

${lifecycleStatusBullets}

## Work status values

${workStatusBullets}

## Change types

${changeTypeBullets}

## Deprecated behavior

- \`get_open_threads\` is kept for migration only
- prefer \`list_works(status="open")\` for unfinished work discovery
`;

export const SCHEMA_RESOURCE_TEXT = `# Tasklog Schema

\`\`\`ts
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

type ChangeType =
  | "feature"
  | "bugfix"
  | "refactor"
  | "investigation"
  | "docs"
  | "test"
  | "config";

type LogStatus = "WIP" | "Done" | "Blocked" | "Superseded";

interface SessionLogEntry {
  id: string; // 6-char base62 for new entries
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

interface ActiveContext {
  active_work_id?: string;
  project_root: string;
  updated_at?: string;
}
\`\`\`

## Storage roots

- \`.tasklog/\` stores machine-facing JSON state
- \`workdocs/\` stores human-facing work artifacts

## Artifact files

- \`design.md\`
- \`plan.md\`
- \`spec.md\`
- \`notes.md\`

## Notes

- Old UUID-like log ids remain readable during migration
- \`related_log_ids\` may still point at legacy ids
- \`target_paths\` belongs in \`plan.md\` frontmatter, not in the work record
`;

export const EXAMPLES_RESOURCE_TEXT = `# Tasklog Examples

## Good Example: Start a New Work

\`\`\`json
{
  "title": "Secure launch handoff polish",
  "summary": "Unify the placeholder handoff experience across dashboard and terminal entry.",
  "start_dir": "/workspace/WebWayFleet",
  "scope_paths": ["/workspace/WebWayFleet", "/workspace/CodeWebway"],
  "tags": ["secure-launch", "ux"]
}
\`\`\`

## Good Example: Append a Session Log

\`\`\`json
{
  "summary": "Implemented work-aware context recovery and added active-work freshness checks before implicit log attachment.",
  "status": "Done",
  "change_type": "feature",
  "affected_files": ["src/logbook.ts", "src/index.ts"],
  "work_id": "a91K2x",
  "tags": ["work-first", "context"]
}
\`\`\`

## Good Example: Create a Plan Doc With Target Paths

\`\`\`json
{
  "work_id": "a91K2x",
  "target_paths": ["/workspace/CodeWebway"]
}
\`\`\`

This is valid when the work scope includes multiple paths but the current implementation pass touches only one of them.

## Bad Example

\`\`\`json
{
  "summary": "updated code",
  "status": "Done",
  "change_type": "bugfix",
  "affected_files": ["src/auth.ts"]
}
\`\`\`

Why it is bad:

- The summary does not say what changed
- The summary does not say what outcome was produced
- It omits work context in a work-first flow when one should exist
`;
