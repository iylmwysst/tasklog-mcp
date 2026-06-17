import {
  ACTIVE_WORK_FRESHNESS,
  APPENDABLE_LOG_STATUSES,
  AUTHORITY_STATUSES,
  CHANGE_TYPES,
  GOVERNING_SOURCES,
  LOG_STATUSES,
  NEXT_ACTION_KINDS,
  READINESS_MODES,
  WORK_IMPACTS,
  WORK_STATUSES,
} from "./logbook.js";

const statusBullets = APPENDABLE_LOG_STATUSES.map((status) => `- \`${status}\``).join("\n");
const lifecycleStatusBullets = LOG_STATUSES.map((status) => `- \`${status}\``).join("\n");
const changeTypeBullets = CHANGE_TYPES.map((changeType) => `- \`${changeType}\``).join("\n");
const workStatusBullets = WORK_STATUSES.map((status) => `- \`${status}\``).join("\n");
const workImpactBullets = WORK_IMPACTS.map((impact) => `- \`${impact}\``).join("\n");
const freshnessBullets = ACTIVE_WORK_FRESHNESS.map((status) => `- \`${status}\``).join("\n");
const governingSourceBullets = GOVERNING_SOURCES.map((source) => `- \`${source}\``).join("\n");
const readinessBullets = READINESS_MODES.map((mode) => `- \`${mode}\``).join("\n");
const authorityBullets = AUTHORITY_STATUSES.map((status) => `- \`${status}\``).join("\n");
const nextActionBullets = NEXT_ACTION_KINDS.map((kind) => `- \`${kind}\``).join("\n");

export const USAGE_RESOURCE_TEXT = `# Tasklog Usage

Tasklog MCP now works best in a work-first flow.

## Mental model

- \`work\` is the main unit of discovery and resume
- \`log\` is for session activity only
- \`resume_capsule\` is the required correctness-first handoff object on each new session log
- \`work_state\` is the read-time resumptive decision surface returned by \`read_reentry_brief\` and \`read_work_context\`
- \`note\` is for lightweight capture
- \`design\`, \`plan\`, \`spec\`, and closed-work \`summary\` are first-class work artifacts
- human-facing docs live under \`workdocs/\`
- machine-facing state lives under \`.tasklog/\`

## Workspace root

- \`project_root\` is the workspace boundary for one Tasklog store
- it may be one repo or a parent directory that contains multiple repos
- \`scope_paths\` selects which directories inside that workspace belong to the work
- \`target_paths\` narrows one implementation pass without changing the overall work scope

## Design principles

- Keep it small: solve handoff and note-taking pain directly instead of becoming a general memory system.
- Keep it explicit: prefer clear work and artifact boundaries over hidden state.
- Keep it low-drag: it should be easier to jot something down than to debate the workflow.
- Keep it handoff-friendly: another session should be able to recover the right context quickly.
- Keep it lean: avoid features that make context heavier or the tool itself harder to manage.

## Anti-goals

- closed-work \`summary.md\` exists only to accelerate re-entry into that work
- it is not a generic retrieval layer for arbitrary project facts
- it does not replace project docs, code search, or architecture tools
- it does not create free-floating memory objects outside a work item

## Authoritative state

- \`workdocs/\` is the human-facing source of truth for \`design\`, \`plan\`, \`spec\`, \`summary\`, and \`notes\`
- \`.tasklog/works.json\` is the machine-facing source of truth for works
- \`.tasklog/session-log.json\` is the machine-facing source of truth for logs
- \`active_work\` is only a hint for the current session
- \`target_paths\` in \`plan.md\` is the authoritative implementation scope for that plan

## Intent matrix

- user asks what is open -> \`get_active_context\`, then \`list_works(status="open")\`
- user wants unfinished work filtered by tag or impact -> \`list_works(status="open", tag="...", impact="critical")\`
- user wants to continue prior work -> \`get_active_context\`, then \`resume_work\` if needed, then \`read_reentry_brief\`
- user starts a new effort -> \`start_work\`
- user says note this down -> \`append_work_note\`
- user wants approach or tradeoffs -> \`create_design_doc\`
- user wants steps or rollout -> \`create_plan_doc\`
- user wants exact rules or contract details -> \`create_spec_doc\`
- user wants a canonical re-entry brief for a done work -> \`create_summary_doc\`
- session changed files and is ending -> \`append_session_log\`

## Recommended workflow

### Start or resume work

Use:

- \`get_active_context\` at the start of a session
- \`list_works(status="open")\` when the user asks what is still open
- add \`tag\`, \`impact\`, or \`sort_by="impact"\` when the user is triaging unfinished work
- \`start_work\` for a new task
- \`resume_work\` when the user wants to continue an existing task
- \`read_reentry_brief\` as the default first read after choosing one work
- \`read_work_context\` when the brief is not enough and the session needs the full surface
- \`get_recent_logs\` when the new session needs raw session evidence beyond the governing brief

This is the intended session-to-session recovery path. Pull prior context back through Tasklog tools instead of treating the session log as a notebook to read top to bottom. Use \`read_reentry_brief\` first. Expand to \`read_work_context\` only when the brief is not enough. For consolidated closed work, prefer \`summary.md\` as the re-entry brief and treat recent raw logs as secondary evidence. By default, \`read_work_context\` does not inline the summary body or recent raw logs for consolidated work. Use \`include_summary=true\` and \`include_recent_logs=true\` only when that extra evidence is actually needed in context.

Tasklog now exposes resumptive decision state explicitly:

- \`append_session_log\` requires an authored \`resume_capsule\`
- \`read_reentry_brief\` returns \`work_state\` as the primary resumptive surface
- \`read_work_context\` returns the same \`work_state\` plus broader evidence
- \`resume_capsule\` remains the authored handoff object for writes and summary frontmatter, but default read surfaces now center the returned \`work_state\`

### Resume capsule rules

- every new \`append_session_log\` call must include \`resume_capsule\`
- \`resume_capsule.current_work\` must be the exact resolved \`work_id\` for the new log entry, not a prose work summary
- \`readiness="act"\` and \`readiness="done"\` require both \`blocking_or_missing_fact\` and \`verification_target\` to be empty
- \`readiness="wait"\` and \`readiness="ask"\` require \`blocking_or_missing_fact\`
- \`readiness="revalidate"\` requires \`verification_target\` and may also include \`blocking_or_missing_fact\`
- when \`active_work\` is stale, invalid, or mismatched, pass \`work_id\` explicitly instead of relying on implicit attachment

### Status vocabulary cheat sheet

- \`append_session_log.status\` accepts only \`WIP\`, \`Done\`, or \`Blocked\`
- \`set_work_status.status\` accepts only \`active\`, \`blocked\`, or \`done\`
- \`list_works(status="open")\` is a read-time filter for unfinished work discovery, not a valid write value

### Create artifacts by intent

Use:

- \`create_design_doc\` when the user wants to reason about goals, tradeoffs, or approach
- \`create_plan_doc\` when the user wants implementation steps
- \`create_spec_doc\` when the user needs exact behavior or contract details
- \`create_summary_doc\` when a closed work should have a canonical re-entry brief
- \`append_work_note\` when the user says to note something down

### Summary consolidation policy

Use this policy to decide when a closed work should get \`summary.md\`.

- \`raw context size\` measures reconstruction cost
- \`impact\` measures remember-value
- create \`summary.md\` when either axis is high enough to justify a re-entry brief

Current behavior note:

- this is guidance for humans and agents, not automatic consolidation
- Tasklog stores \`impact\` and supports \`create_summary_doc\`, but it does not auto-create summaries when work becomes \`done\`

Default guidance:

- \`critical\` or \`high\` -> summarize by default
- \`medium\` -> summarize when raw context is large or when the work captured an important decision, tradeoff, or contract detail
- \`low\` -> usually leave as \`closed/raw\` unless reconstruction cost is unusually high or the user explicitly wants a summary

\`impact\` may override size. Short but risky work can still deserve \`summary.md\`, especially for auth, migrations, API/schema contracts, shared infra, or policy decisions.

### Use logs for session handoff

Use \`append_session_log\` when:

- files changed during the session
- a meaningful fix or implementation pass is ending
- work is pausing and the next session needs a handoff

The log should summarize what happened in this session. It should not replace work docs.

Every new \`append_session_log\` should attach a \`resume_capsule\` so the next session does not need to infer authority and readiness from scratch.

Before calling \`append_session_log\`, do this quick check:

- confirm whether \`active_work\` is still \`fresh\`; if not, resolve the work explicitly first
- pass the same work id in both \`work_id\` and \`resume_capsule.current_work\`
- choose log status from \`WIP | Done | Blocked\`
- choose readiness first, then satisfy its required companion fields

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
- \`append_session_log\` only attaches \`work_id\` implicitly when \`active_work\` is still fresh
- If no work is unambiguous, do not guess silently
- If \`plan.md\` already exists, repeated \`target_paths\` must either match the file or fail
- If the user only asks to note something, default to \`append_work_note\`, not \`append_session_log\`

## Work and scope rules

- Work ids and new log ids are 6-character base62 strings
- Work scope is tracked by \`start_dir\` and \`scope_paths\`
- Work importance may be tracked by \`impact\`
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

## Work impact values

${workImpactBullets}

## Change types

${changeTypeBullets}

## Governing source values

${governingSourceBullets}

## Readiness values

${readinessBullets}

## Authority status values

${authorityBullets}

## Next valid action kinds

${nextActionBullets}

## Deprecated behavior

- \`get_open_threads\` is kept for migration only
- prefer \`list_works(status="open")\` for unfinished work discovery

## Persistence and concurrency

- writes are atomic per file, not transactionally atomic across every file touched by one operation
- mutations are serialized inside one server process
- multiple server processes pointing at the same \`project_root\` are not a supported coordination mode
`;

export const SCHEMA_RESOURCE_TEXT = `# Tasklog Schema

\`\`\`ts
type WorkStatus = "active" | "blocked" | "done";
type WorkImpact = "low" | "medium" | "high" | "critical";

interface WorkRecord {
  work_id: string; // 6-char base62
  title: string;
  slug: string;
  status: WorkStatus;
  impact?: WorkImpact;
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

type GoverningSource =
  | "work_record"
  | "latest_log"
  | "summary_doc"
  | "plan_doc"
  | "spec_doc"
  | "notes_doc"
  | "active_context_hint";

type ReadinessMode = "act" | "wait" | "ask" | "revalidate" | "done";

type AuthorityStatus = "clear" | "weak" | "conflicted";

type NextActionKind =
  | "resume"
  | "review_summary"
  | "inspect_logs"
  | "wait_for_unblock"
  | "clarify"
  | "close";

interface ResumeCapsule {
  current_work: string;
  governing_source: GoverningSource[];
  authority_reason: string;
  readiness: ReadinessMode;
  next_valid_action: string;
  blocking_or_missing_fact?: string;
  verification_target?: string;
}

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
  resume_capsule?: ResumeCapsule; // required on new append_session_log writes; may be absent on legacy entries
  revision: number;
  created_at: string;
  updated_at: string;
}

interface WorkState {
  current_work: {
    work_id: string;
    title: string;
    status: WorkStatus;
    context_mode: "active" | "closed/raw" | "closed/consolidated";
    scope_paths: string[];
  };
  authority: {
    status: AuthorityStatus;
    basis: GoverningSource[];
    reason: string;
  };
  readiness: {
    mode: ReadinessMode;
    reason: string;
  };
  next_valid_action: {
    kind: NextActionKind;
    summary: string;
  };
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
- \`summary.md\`
- \`notes.md\`

## Notes

- New \`append_session_log\` calls must include \`resume_capsule\`
- \`readiness="wait"\` and \`readiness="ask"\` require \`blocking_or_missing_fact\`
- \`readiness="revalidate"\` requires both \`blocking_or_missing_fact\` and \`verification_target\`
- \`readiness="act"\` and \`readiness="done"\` require those extra fields to stay empty
- Old UUID-like log ids remain readable during migration
- \`related_log_ids\` may still point at legacy ids
- \`target_paths\` belongs in \`plan.md\` frontmatter, not in the work record
- \`project_root\` may be a workspace directory containing multiple repos
`;

export const EXAMPLES_RESOURCE_TEXT = `# Tasklog Examples

## Good Example: Start a New Workspace-Scoped Work

\`\`\`json
{
  "title": "Secure launch handoff polish",
  "summary": "Unify the placeholder handoff experience across dashboard and terminal entry.",
  "impact": "high",
  "start_dir": "/workspace",
  "scope_paths": ["/workspace/WebWayFleet", "/workspace/CodeWebway"],
  "tags": ["secure-launch", "ux"]
}
\`\`\`

This starts one work inside a shared workspace root while keeping the scope limited to two repos inside that workspace.

## Good Example: Append a Session Log

\`\`\`json
{
  "summary": "Implemented work-aware context recovery and added active-work freshness checks before implicit log attachment.",
  "status": "Done",
  "change_type": "feature",
  "affected_files": ["src/logbook.ts", "src/index.ts"],
  "work_id": "a91K2x",
  "tags": ["work-first", "context"],
  "resume_capsule": {
    "current_work": "a91K2x",
    "governing_source": ["work_record", "latest_log", "notes_doc"],
    "authority_reason": "The work record, latest log, and notes agree on the current implementation pass.",
    "readiness": "act",
    "next_valid_action": "Resume manual UX validation against the updated resumptive-state surface."
  }
}
\`\`\`

Why this is safe:

- \`work_id\` and \`resume_capsule.current_work\` match exactly
- the log status uses the appendable log vocabulary, not work status or list filter vocabulary
- \`readiness="act"\` leaves both optional companion fields empty

## Good Example: Append a Session Log That Needs Revalidation

\`\`\`json
{
  "summary": "Prepared the summary-driven closed-work read path, but the consolidated read still needs a live client check.",
  "status": "Done",
  "change_type": "test",
  "affected_files": ["src/logbook.ts", "src/resources.ts"],
  "work_id": "a91K2x",
  "tags": ["summary-doc", "reentry"],
  "resume_capsule": {
    "current_work": "a91K2x",
    "governing_source": ["latest_log", "summary_doc"],
    "authority_reason": "The code path is updated and the canonical summary exists, but the client surface still needs confirmation.",
    "readiness": "revalidate",
    "next_valid_action": "Re-run read_work_context against a consolidated work and compare the returned work_state to the summary frontmatter.",
    "blocking_or_missing_fact": "No live client verification has confirmed the new consolidated-read behavior yet.",
    "verification_target": "Confirm consolidated reads prefer summary-derived state until include_recent_logs or include_summary is requested."
  }
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
- It omits the required \`resume_capsule\` for a new session log
- It omits work context in a work-first flow when one should exist
`;
