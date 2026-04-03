import { promises as fs } from "node:fs";
import path from "node:path";

const DEFAULT_ROOT = "/Users/Lab/Desktop/TasklogSweLab";

interface CliOptions {
  force: boolean;
  root: string;
}

interface WorkRow {
  work_id: string;
  title: string;
  slug: string;
  status: string;
  impact: string;
  start_dir: string;
  scope_paths: string[];
  summary: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface SessionLogRow {
  id: string;
  work_id: string;
  timestamp: string;
  summary: string;
  status: string;
  change_type: string;
  affected_files: string[];
  next_steps: string;
  blockers: string;
}

interface FixtureDef {
  fixtureId: string;
  family: string;
  scenarioTitle: string;
  questionTitle: string;
  goal: string;
  task: string;
  evidenceHints: string[];
  expected: {
    decision_type: string;
    selected_work_id: string;
    selected_work_title: string;
    work_status: string;
    next_step_summary: string;
    primary_evidence_source: string;
    clarifying_question: string;
    abstention_reason: string;
    escalation_target: string;
  };
  gradingNotes: string[];
  works: WorkRow[];
  sessionLogs: SessionLogRow[];
  activeContext: Record<string, unknown>;
  notesFiles: Array<{ dir: string; name: string; content: string }>;
  normalizedState: Record<string, unknown>;
  tasklogSurface: Record<string, unknown>;
}

function parseArgs(argv: string[]): CliOptions {
  let root = DEFAULT_ROOT;
  let force = false;
  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current === "--root") {
      root = path.resolve(argv[index + 1] ?? root);
      index += 1;
      continue;
    }
    if (current === "--force") {
      force = true;
    }
  }
  return { force, root };
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function ensureCleanDir(dir: string, force: boolean): Promise<void> {
  if (await pathExists(dir)) {
    if (!force) {
      throw new Error(`Refusing to overwrite existing directory without --force: ${dir}`);
    }
    await fs.rm(dir, { recursive: true, force: true });
  }
  await fs.mkdir(dir, { recursive: true });
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function work(
  workspaceRoot: string,
  args: {
    workId: string;
    title: string;
    slug: string;
    status: string;
    impact: string;
    relDir: string;
    summary: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
  },
): WorkRow {
  const startDir = path.join(workspaceRoot, args.relDir);
  return {
    work_id: args.workId,
    title: args.title,
    slug: args.slug,
    status: args.status,
    impact: args.impact,
    start_dir: startDir,
    scope_paths: [startDir],
    summary: args.summary,
    tags: args.tags,
    created_at: args.createdAt,
    updated_at: args.updatedAt,
  };
}

function sessionLog(args: SessionLogRow): SessionLogRow {
  return args;
}

function noteFile(
  workId: string,
  slug: string,
  title: string,
  status: string,
  updatedAt: string,
  body: string,
  name = "notes.md",
): { dir: string; name: string; content: string } {
  return {
    dir: `${workId}-${slug}`,
    name,
    content: `---
work_id: '${workId}'
title: '${title}'
status: '${status}'
updated_at: '${updatedAt}'
---

# ${name === "plan.md" ? "Plan" : "Notes"}

## ${updatedAt}

${body}
`,
  };
}

function makeFixtures(root: string): FixtureDef[] {
  const fixturesRoot = path.join(root, "fixtures-v2");
  const workspaceFor = (fixtureId: string) => path.join(fixturesRoot, fixtureId, "workspace");

  const fixture001Root = workspaceFor("v2-smoke-001");
  const fixture002Root = workspaceFor("v2-smoke-002");
  const fixture003Root = workspaceFor("v2-smoke-003");
  const fixture004Root = workspaceFor("v2-smoke-004");
  const fixture005Root = workspaceFor("v2-smoke-005");
  const fixture006Root = workspaceFor("v2-smoke-006");
  const fixture007Root = workspaceFor("v2-smoke-007");
  const fixture008Root = workspaceFor("v2-smoke-008");
  const fixture009Root = workspaceFor("v2-smoke-009");
  const fixture010Root = workspaceFor("v2-smoke-010");

  return [
    {
      fixtureId: "v2-smoke-001",
      family: "ask_before_resume_conflict",
      scenarioTitle: "Conflicting note and latest log should trigger a clarifying question",
      questionTitle: "Ask before resuming when the newest log conflicts with the older work note",
      goal: "Check whether the model asks a clarifying question instead of resuming code work when the latest authoritative signal conflicts with a stale note.",
      task: "Use the provided re-entry evidence to decide whether to resume work immediately, escalate, abstain, or ask a clarifying question first.",
      evidenceHints: [
        "The target work still looks active, but the newest session log blocks immediate resumption.",
        "An older note still contains a code-facing next step and should not automatically win.",
      ],
      expected: {
        decision_type: "ask_clarifying_question",
        selected_work_id: "An4kP1",
        selected_work_title: "Resolve runner-contract ambiguity before patch-selection tracing",
        work_status: "active",
        next_step_summary: "Ask whether the latest runner-contract clarification supersedes the older patch-selection note before resuming `An4kP1`.",
        primary_evidence_source: "latest_session_log",
        clarifying_question: "Does the latest runner-contract clarification supersede the older note that says to resume patch-selection tracing for `An4kP1`?",
        abstention_reason: "",
        escalation_target: "",
      },
      gradingNotes: [
        "Do not resume code tracing directly from the stale note.",
        "The latest session log is the authoritative source for this fixture and should trigger a clarifying question first.",
      ],
      works: [
        work(fixture001Root, {
          workId: "An4kP1",
          title: "Resolve runner-contract ambiguity before patch-selection tracing",
          slug: "resolve-runner-contract-ambiguity-before-patch-selection-tracing",
          status: "active",
          impact: "high",
          relDir: "repos/SWE-bench/swebench/harness",
          summary: "Patch-selection tracing is paused because the runner contract may have changed the legal interception path.",
          tags: ["v2", "ambiguity", "runner"],
          createdAt: "2026-03-29T07:20:00.000Z",
          updatedAt: "2026-03-29T07:50:00.000Z",
        }),
        work(fixture001Root, {
          workId: "Qm6rT2",
          title: "Update appendix prose for patch-selection workflow",
          slug: "update-appendix-prose-for-patch-selection-workflow",
          status: "active",
          impact: "medium",
          relDir: "docs",
          summary: "Appendix prose is still open but explicitly downstream from the runner-contract clarification.",
          tags: ["v2", "docs"],
          createdAt: "2026-03-29T07:10:00.000Z",
          updatedAt: "2026-03-29T07:35:00.000Z",
        }),
      ],
      sessionLogs: [
        sessionLog({
          id: "V2S1-01",
          work_id: "An4kP1",
          timestamp: "2026-03-29T07:50:00.000Z",
          summary: "Paused patch-selection tracing after noticing the latest runner-contract draft may have changed the legal interception path.",
          status: "WIP",
          change_type: "investigation",
          affected_files: ["swebench/harness/grading.py"],
          next_steps: "Ask whether the latest runner-contract clarification supersedes the older patch-selection note before resuming any tracing.",
          blockers: "",
        }),
        sessionLog({
          id: "V2S1-02",
          work_id: "Qm6rT2",
          timestamp: "2026-03-29T07:35:00.000Z",
          summary: "Parked the appendix prose until the runner-contract ambiguity is resolved.",
          status: "WIP",
          change_type: "docs",
          affected_files: ["docs/appendix.md"],
          next_steps: "Wait for the runner-contract clarification before writing more appendix prose.",
          blockers: "",
        }),
      ],
      activeContext: {
        active_work_id: "An4kP1",
        project_root: fixture001Root,
        updated_at: "2026-03-29T07:50:00.000Z",
      },
      notesFiles: [
        noteFile(
          "An4kP1",
          "resolve-runner-contract-ambiguity-before-patch-selection-tracing",
          "Resolve runner-contract ambiguity before patch-selection tracing",
          "active",
          "2026-03-29T07:45:00.000Z",
          "Older operator note: resume patch-selection tracing in `swebench/harness/grading.py` once you are back in the fixture.",
        ),
        noteFile(
          "Qm6rT2",
          "update-appendix-prose-for-patch-selection-workflow",
          "Update appendix prose for patch-selection workflow",
          "active",
          "2026-03-29T07:35:00.000Z",
          "This docs task remains secondary to the runner-contract clarification.",
        ),
      ],
      normalizedState: {
        active_context_work_id: "An4kP1",
        works: [
          {
            work_id: "An4kP1",
            title: "Resolve runner-contract ambiguity before patch-selection tracing",
            status: "active",
            latest_log_summary: "Paused patch-selection tracing after noticing the latest runner-contract draft may have changed the legal interception path.",
            latest_log_next_step: "Ask whether the latest runner-contract clarification supersedes the older patch-selection note before resuming any tracing.",
            latest_note_summary: "Older operator note: resume patch-selection tracing in `swebench/harness/grading.py` once you are back in the fixture.",
            artifact_files: ["notes.md"],
          },
          {
            work_id: "Qm6rT2",
            title: "Update appendix prose for patch-selection workflow",
            status: "active",
            latest_log_summary: "Parked the appendix prose until the runner-contract ambiguity is resolved.",
            latest_log_next_step: "Wait for the runner-contract clarification before writing more appendix prose.",
            latest_note_summary: "This docs task remains secondary to the runner-contract clarification.",
            artifact_files: ["notes.md"],
          },
        ],
      },
      tasklogSurface: {
        active_context: {
          active_work_id: "An4kP1",
          active_work_title: "Resolve runner-contract ambiguity before patch-selection tracing",
        },
        reentry_candidates: [
          {
            work_id: "An4kP1",
            title: "Resolve runner-contract ambiguity before patch-selection tracing",
            status: "active",
            latest_log_summary: "Paused patch-selection tracing after noticing the latest runner-contract draft may have changed the legal interception path.",
            latest_log_next_step: "Ask whether the latest runner-contract clarification supersedes the older patch-selection note before resuming any tracing.",
            stale_note_summary: "Older operator note: resume patch-selection tracing in `swebench/harness/grading.py` once you are back in the fixture.",
            ambiguity_status: "clarification_required",
            primary_evidence_source: "latest_session_log",
            suggested_decision_type: "ask_clarifying_question",
          },
          {
            work_id: "Qm6rT2",
            title: "Update appendix prose for patch-selection workflow",
            status: "active",
            latest_log_summary: "Parked the appendix prose until the runner-contract ambiguity is resolved.",
            relationship_to_primary: "secondary_supporting_work",
          },
        ],
      },
    },
    {
      fixtureId: "v2-smoke-002",
      family: "abstain_no_authoritative_winner",
      scenarioTitle: "No authoritative winner should trigger abstention",
      questionTitle: "Abstain when no open work has an authoritative resume signal",
      goal: "Check whether the model abstains instead of forcing a resume target when the evidence names two blocked candidates with no authoritative winner.",
      task: "Use the provided re-entry evidence to decide whether to resume work immediately, escalate, abstain, or ask a clarifying question first.",
      evidenceHints: [
        "Two open works both look plausible, but both are gated on unresolved dependencies.",
        "The correct behavior is not to invent a winner when the fixture says there is no authoritative resume target yet.",
      ],
      expected: {
        decision_type: "abstain_insufficient_evidence",
        selected_work_id: "",
        selected_work_title: "",
        work_status: "",
        next_step_summary: "Do not resume either work yet; first ask which dependency is expected to unblock first.",
        primary_evidence_source: "no_authoritative_winner",
        clarifying_question: "Which dependency is expected to unblock first: the API trace freeze or the scoring-contract freeze?",
        abstention_reason: "Both open works are blocked and the fixture provides no authoritative signal that one should outrank the other.",
        escalation_target: "",
      },
      gradingNotes: [
        "Do not force a winner between the two blocked works.",
        "This fixture is only correct if the answer abstains and asks which dependency is expected to unblock first.",
      ],
      works: [
        work(fixture002Root, {
          workId: "Cx4mP2",
          title: "Freeze API trace boundary for evaluation handoff",
          slug: "freeze-api-trace-boundary-for-evaluation-handoff",
          status: "blocked",
          impact: "high",
          relDir: "repos/SWE-bench/swebench/inference",
          summary: "API trace freeze is blocked on an unresolved upstream interface decision.",
          tags: ["v2", "api", "blocked"],
          createdAt: "2026-03-29T07:15:00.000Z",
          updatedAt: "2026-03-29T07:55:00.000Z",
        }),
        work(fixture002Root, {
          workId: "Dv7qN5",
          title: "Freeze scoring-contract boundary for holdout grading",
          slug: "freeze-scoring-contract-boundary-for-holdout-grading",
          status: "blocked",
          impact: "high",
          relDir: "repos/SWE-bench/swebench/harness",
          summary: "Scoring-contract freeze is blocked on a pending evaluation policy decision.",
          tags: ["v2", "grading", "blocked"],
          createdAt: "2026-03-29T07:18:00.000Z",
          updatedAt: "2026-03-29T07:54:00.000Z",
        }),
      ],
      sessionLogs: [
        sessionLog({
          id: "V2S2-01",
          work_id: "Cx4mP2",
          timestamp: "2026-03-29T07:55:00.000Z",
          summary: "Kept the API trace freeze blocked until the unresolved interface decision lands.",
          status: "WIP",
          change_type: "investigation",
          affected_files: ["swebench/inference/run_api.py"],
          next_steps: "Wait for the interface decision or ask which dependency is expected to unblock first before resuming any blocked work.",
          blockers: "Pending interface decision.",
        }),
        sessionLog({
          id: "V2S2-02",
          work_id: "Dv7qN5",
          timestamp: "2026-03-29T07:54:00.000Z",
          summary: "Kept the scoring-contract freeze blocked until the evaluation policy decision lands.",
          status: "WIP",
          change_type: "investigation",
          affected_files: ["swebench/harness/grading.py"],
          next_steps: "Wait for the evaluation policy decision or ask which dependency is expected to unblock first before resuming any blocked work.",
          blockers: "Pending evaluation policy decision.",
        }),
      ],
      activeContext: {
        active_work_id: "Cx4mP2",
        project_root: fixture002Root,
        updated_at: "2026-03-29T07:55:00.000Z",
      },
      notesFiles: [
        noteFile(
          "Cx4mP2",
          "freeze-api-trace-boundary-for-evaluation-handoff",
          "Freeze API trace boundary for evaluation handoff",
          "blocked",
          "2026-03-29T07:55:00.000Z",
          "Blocked on the unresolved interface decision. Do not assume this outranks the scoring-contract freeze without an external tie-break.",
        ),
        noteFile(
          "Dv7qN5",
          "freeze-scoring-contract-boundary-for-holdout-grading",
          "Freeze scoring-contract boundary for holdout grading",
          "blocked",
          "2026-03-29T07:54:00.000Z",
          "Blocked on the pending evaluation policy decision. Do not assume this outranks the API trace freeze without an external tie-break.",
        ),
      ],
      normalizedState: {
        active_context_work_id: "Cx4mP2",
        works: [
          {
            work_id: "Cx4mP2",
            title: "Freeze API trace boundary for evaluation handoff",
            status: "blocked",
            latest_log_summary: "Kept the API trace freeze blocked until the unresolved interface decision lands.",
            latest_log_next_step: "Wait for the interface decision or ask which dependency is expected to unblock first before resuming any blocked work.",
            latest_note_summary: "Blocked on the unresolved interface decision. Do not assume this outranks the scoring-contract freeze without an external tie-break.",
            artifact_files: ["notes.md"],
          },
          {
            work_id: "Dv7qN5",
            title: "Freeze scoring-contract boundary for holdout grading",
            status: "blocked",
            latest_log_summary: "Kept the scoring-contract freeze blocked until the evaluation policy decision lands.",
            latest_log_next_step: "Wait for the evaluation policy decision or ask which dependency is expected to unblock first before resuming any blocked work.",
            latest_note_summary: "Blocked on the pending evaluation policy decision. Do not assume this outranks the API trace freeze without an external tie-break.",
            artifact_files: ["notes.md"],
          },
        ],
      },
      tasklogSurface: {
        active_context: {
          active_work_id: "Cx4mP2",
          active_work_title: "Freeze API trace boundary for evaluation handoff",
        },
        decision_context: {
          authoritative_resume_target: "",
          ambiguity_status: "insufficient_evidence",
          primary_evidence_source: "no_authoritative_winner",
          suggested_decision_type: "abstain_insufficient_evidence",
          suggested_clarifying_question: "Which dependency is expected to unblock first: the API trace freeze or the scoring-contract freeze?",
        },
        reentry_candidates: [
          {
            work_id: "Cx4mP2",
            title: "Freeze API trace boundary for evaluation handoff",
            status: "blocked",
            latest_log_summary: "Kept the API trace freeze blocked until the unresolved interface decision lands.",
          },
          {
            work_id: "Dv7qN5",
            title: "Freeze scoring-contract boundary for holdout grading",
            status: "blocked",
            latest_log_summary: "Kept the scoring-contract freeze blocked until the evaluation policy decision lands.",
          },
        ],
      },
    },
    {
      fixtureId: "v2-smoke-003",
      family: "resume_blocked_with_escalation_owner",
      scenarioTitle: "Blocked work should resume only through owner escalation",
      questionTitle: "Escalate to the owner instead of continuing a blocked metadata freeze directly",
      goal: "Check whether the model preserves the blocked status and routes the next step through the named owner instead of patching from a stale note.",
      task: "Use the provided re-entry evidence to decide whether to resume work immediately, escalate, abstain, or ask a clarifying question first.",
      evidenceHints: [
        "The work remains blocked, but the latest log still indicates the same work is the right target after escalation.",
        "An older note points straight to code editing and should not override the escalation directive.",
      ],
      expected: {
        decision_type: "resume_blocked_with_escalation",
        selected_work_id: "Er8kR4",
        selected_work_title: "Freeze runner metadata schema before grading patch",
        work_status: "blocked",
        next_step_summary: "Resume `Er8kR4` through escalation by asking the evaluation owner whether the metadata freeze must land before editing `grading.py`.",
        primary_evidence_source: "latest_session_log",
        clarifying_question: "",
        abstention_reason: "",
        escalation_target: "evaluation_owner",
      },
      gradingNotes: [
        "The correct target remains the blocked grading work, not the secondary docs work.",
        "Answers that continue patching immediately from the stale note are incorrect.",
      ],
      works: [
        work(fixture003Root, {
          workId: "Er8kR4",
          title: "Freeze runner metadata schema before grading patch",
          slug: "freeze-runner-metadata-schema-before-grading-patch",
          status: "blocked",
          impact: "high",
          relDir: "repos/SWE-bench/swebench/harness",
          summary: "The grading patch is blocked until the evaluation owner confirms whether the metadata schema freeze must land first.",
          tags: ["v2", "blocked", "escalation"],
          createdAt: "2026-03-29T08:00:00.000Z",
          updatedAt: "2026-03-29T08:20:00.000Z",
        }),
        work(fixture003Root, {
          workId: "Rs2bU1",
          title: "Refresh metadata appendix examples",
          slug: "refresh-metadata-appendix-examples",
          status: "active",
          impact: "medium",
          relDir: "docs",
          summary: "Docs examples remain downstream of the metadata freeze decision.",
          tags: ["v2", "docs"],
          createdAt: "2026-03-29T07:55:00.000Z",
          updatedAt: "2026-03-29T08:05:00.000Z",
        }),
      ],
      sessionLogs: [
        sessionLog({
          id: "V2S3-01",
          work_id: "Er8kR4",
          timestamp: "2026-03-29T08:20:00.000Z",
          summary: "Stopped before patching because the evaluation owner still needs to confirm whether the metadata schema freeze must land first.",
          status: "Blocked",
          change_type: "investigation",
          affected_files: ["swebench/harness/grading.py", "docs/benchmark-runner-metadata-contract.md"],
          next_steps: "Ask the evaluation owner whether the metadata freeze must land before editing `grading.py`, then resume this blocked work through that answer.",
          blockers: "Owner confirmation pending.",
        }),
        sessionLog({
          id: "V2S3-02",
          work_id: "Rs2bU1",
          timestamp: "2026-03-29T08:05:00.000Z",
          summary: "Held off on appendix refresh until the metadata freeze order is confirmed.",
          status: "WIP",
          change_type: "docs",
          affected_files: ["docs/appendix.md"],
          next_steps: "Wait for the evaluation owner call on metadata freeze order.",
          blockers: "",
        }),
      ],
      activeContext: {
        active_work_id: "Er8kR4",
        project_root: fixture003Root,
        updated_at: "2026-03-29T08:20:00.000Z",
      },
      notesFiles: [
        noteFile(
          "Er8kR4",
          "freeze-runner-metadata-schema-before-grading-patch",
          "Freeze runner metadata schema before grading patch",
          "blocked",
          "2026-03-29T08:15:00.000Z",
          "Older operator note: continue the grading patch in `swebench/harness/grading.py` and come back to the schema wording later.",
        ),
        noteFile(
          "Rs2bU1",
          "refresh-metadata-appendix-examples",
          "Refresh metadata appendix examples",
          "active",
          "2026-03-29T08:05:00.000Z",
          "Appendix edits stay secondary to the owner decision about metadata freeze order.",
        ),
      ],
      normalizedState: {
        active_context_work_id: "Er8kR4",
        works: [
          {
            work_id: "Er8kR4",
            title: "Freeze runner metadata schema before grading patch",
            status: "blocked",
            latest_log_summary: "Stopped before patching because the evaluation owner still needs to confirm whether the metadata schema freeze must land first.",
            latest_log_next_step: "Ask the evaluation owner whether the metadata freeze must land before editing `grading.py`, then resume this blocked work through that answer.",
            latest_note_summary: "Older operator note: continue the grading patch in `swebench/harness/grading.py` and come back to the schema wording later.",
            artifact_files: ["notes.md", "benchmark-runner-metadata-contract.md"],
          },
          {
            work_id: "Rs2bU1",
            title: "Refresh metadata appendix examples",
            status: "active",
            latest_log_summary: "Held off on appendix refresh until the metadata freeze order is confirmed.",
            latest_log_next_step: "Wait for the evaluation owner call on metadata freeze order.",
            latest_note_summary: "Appendix edits stay secondary to the owner decision about metadata freeze order.",
            artifact_files: ["notes.md"],
          },
        ],
      },
      tasklogSurface: {
        active_context: {
          active_work_id: "Er8kR4",
          active_work_title: "Freeze runner metadata schema before grading patch",
        },
        decision_context: {
          authoritative_resume_target: "Er8kR4",
          ambiguity_status: "blocked_pending_owner_confirmation",
          primary_evidence_source: "latest_session_log",
          suggested_decision_type: "resume_blocked_with_escalation",
          suggested_escalation_target: "evaluation_owner",
        },
        reentry_candidates: [
          {
            work_id: "Er8kR4",
            title: "Freeze runner metadata schema before grading patch",
            status: "blocked",
            latest_log_summary: "Stopped before patching because the evaluation owner still needs to confirm whether the metadata schema freeze must land first.",
            stale_note_summary: "Older operator note: continue the grading patch in `swebench/harness/grading.py` and come back to the schema wording later.",
          },
          {
            work_id: "Rs2bU1",
            title: "Refresh metadata appendix examples",
            status: "active",
            relationship_to_primary: "secondary_supporting_work",
          },
        ],
      },
    },
    {
      fixtureId: "v2-smoke-004",
      family: "switch_from_stale_active_context",
      scenarioTitle: "The stale active context should not beat the fresher resume target",
      questionTitle: "Resume the fresher grading work instead of the stale docs active context",
      goal: "Check whether the model switches away from an outdated active context when a newer done log says that context already wrapped and another work is the real resume target.",
      task: "Use the provided re-entry evidence to decide whether to resume work immediately, escalate, abstain, or ask a clarifying question first.",
      evidenceHints: [
        "The active context still points to a docs work, but a newer log says that docs step is already wrapped.",
        "Another work has the fresher actionable next step and should win even though it is not the active context.",
      ],
      expected: {
        decision_type: "resume_work",
        selected_work_id: "Fk2vL7",
        selected_work_title: "Re-run grading parser after docs handoff",
        work_status: "active",
        next_step_summary: "Resume `Fk2vL7` by re-running the grading parser now that the docs handoff is complete.",
        primary_evidence_source: "active_context_freshness",
        clarifying_question: "",
        abstention_reason: "",
        escalation_target: "",
      },
      gradingNotes: [
        "Selecting the docs work is wrong because the latest log says it is already wrapped.",
        "This fixture checks whether active-context freshness is interpreted, not just copied.",
      ],
      works: [
        work(fixture004Root, {
          workId: "Gp5xD9",
          title: "Finalize parser doc handoff",
          slug: "finalize-parser-doc-handoff",
          status: "active",
          impact: "medium",
          relDir: "docs",
          summary: "The doc handoff looks active in the context file but was already wrapped in the latest log.",
          tags: ["v2", "active-context", "docs"],
          createdAt: "2026-03-29T08:10:00.000Z",
          updatedAt: "2026-03-29T08:22:00.000Z",
        }),
        work(fixture004Root, {
          workId: "Fk2vL7",
          title: "Re-run grading parser after docs handoff",
          slug: "re-run-grading-parser-after-docs-handoff",
          status: "active",
          impact: "high",
          relDir: "repos/SWE-bench/swebench/harness",
          summary: "Parser rerun is the real next step after the docs handoff completed.",
          tags: ["v2", "handoff", "parser"],
          createdAt: "2026-03-29T08:12:00.000Z",
          updatedAt: "2026-03-29T08:24:00.000Z",
        }),
      ],
      sessionLogs: [
        sessionLog({
          id: "V2S4-01",
          work_id: "Gp5xD9",
          timestamp: "2026-03-29T08:22:00.000Z",
          summary: "Wrapped the parser doc handoff and explicitly handed control back to the grading parser rerun.",
          status: "Done",
          change_type: "docs",
          affected_files: ["docs/parser-handoff.md"],
          next_steps: "Resume `Fk2vL7` and re-run the grading parser now that the docs handoff is complete.",
          blockers: "",
        }),
        sessionLog({
          id: "V2S4-02",
          work_id: "Fk2vL7",
          timestamp: "2026-03-29T08:24:00.000Z",
          summary: "Queued the parser rerun immediately after the docs handoff wrapped.",
          status: "WIP",
          change_type: "test",
          affected_files: ["swebench/harness/grading.py"],
          next_steps: "Re-run the grading parser and capture the first failing trace.",
          blockers: "",
        }),
      ],
      activeContext: {
        active_work_id: "Gp5xD9",
        project_root: fixture004Root,
        updated_at: "2026-03-29T08:21:00.000Z",
      },
      notesFiles: [
        noteFile(
          "Gp5xD9",
          "finalize-parser-doc-handoff",
          "Finalize parser doc handoff",
          "active",
          "2026-03-29T08:21:00.000Z",
          "Stale active-context note: finish the parser handoff copy polish before switching back to code.",
        ),
        noteFile(
          "Fk2vL7",
          "re-run-grading-parser-after-docs-handoff",
          "Re-run grading parser after docs handoff",
          "active",
          "2026-03-29T08:24:00.000Z",
          "The parser rerun is next once the docs handoff is wrapped.",
        ),
      ],
      normalizedState: {
        active_context_work_id: "Gp5xD9",
        works: [
          {
            work_id: "Gp5xD9",
            title: "Finalize parser doc handoff",
            status: "active",
            latest_log_summary: "Wrapped the parser doc handoff and explicitly handed control back to the grading parser rerun.",
            latest_log_next_step: "Resume `Fk2vL7` and re-run the grading parser now that the docs handoff is complete.",
            latest_note_summary: "Stale active-context note: finish the parser handoff copy polish before switching back to code.",
            artifact_files: ["notes.md", "parser-handoff.md"],
          },
          {
            work_id: "Fk2vL7",
            title: "Re-run grading parser after docs handoff",
            status: "active",
            latest_log_summary: "Queued the parser rerun immediately after the docs handoff wrapped.",
            latest_log_next_step: "Re-run the grading parser and capture the first failing trace.",
            latest_note_summary: "The parser rerun is next once the docs handoff is wrapped.",
            artifact_files: ["notes.md"],
          },
        ],
      },
      tasklogSurface: {
        active_context: {
          active_work_id: "Gp5xD9",
          active_work_title: "Finalize parser doc handoff",
          freshness_status: "stale",
        },
        decision_context: {
          authoritative_resume_target: "Fk2vL7",
          primary_evidence_source: "active_context_freshness",
          suggested_decision_type: "resume_work",
        },
        reentry_candidates: [
          {
            work_id: "Gp5xD9",
            title: "Finalize parser doc handoff",
            status: "done_handoff_complete",
            latest_log_summary: "Wrapped the parser doc handoff and explicitly handed control back to the grading parser rerun.",
          },
          {
            work_id: "Fk2vL7",
            title: "Re-run grading parser after docs handoff",
            status: "active",
            latest_log_summary: "Queued the parser rerun immediately after the docs handoff wrapped.",
          },
        ],
      },
    },
    {
      fixtureId: "v2-smoke-005",
      family: "prefer_plan_over_code_note",
      scenarioTitle: "The plan artifact should beat the stale code-first note",
      questionTitle: "Resume the plan update before touching the diff extractor",
      goal: "Check whether the model respects a workdoc plan that explicitly sequences planning before code instead of jumping to a stale code-edit note.",
      task: "Use the provided re-entry evidence to decide whether to resume work immediately, escalate, abstain, or ask a clarifying question first.",
      evidenceHints: [
        "The work is still active, but the planning artifact narrows the true next step more precisely than the stale note.",
        "The correct action stays inside the same work; the key question is what should happen first.",
      ],
      expected: {
        decision_type: "resume_work",
        selected_work_id: "Hp3cM8",
        selected_work_title: "Stabilize diff-extractor evaluation checklist",
        work_status: "active",
        next_step_summary: "Resume `Hp3cM8` by updating the evaluation checklist plan before touching the diff extractor implementation.",
        primary_evidence_source: "workdocs_plan",
        clarifying_question: "",
        abstention_reason: "",
        escalation_target: "",
      },
      gradingNotes: [
        "The same work remains active; the distinction is plan-first versus code-first.",
        "Answers that jump straight to implementation ignore the authoritative planning artifact.",
      ],
      works: [
        work(fixture005Root, {
          workId: "Hp3cM8",
          title: "Stabilize diff-extractor evaluation checklist",
          slug: "stabilize-diff-extractor-evaluation-checklist",
          status: "active",
          impact: "high",
          relDir: "repos/SWE-bench/swebench/harness",
          summary: "The evaluation checklist needs to be updated before the diff extractor implementation is changed.",
          tags: ["v2", "plan", "sequencing"],
          createdAt: "2026-03-29T08:25:00.000Z",
          updatedAt: "2026-03-29T08:40:00.000Z",
        }),
      ],
      sessionLogs: [
        sessionLog({
          id: "V2S5-01",
          work_id: "Hp3cM8",
          timestamp: "2026-03-29T08:40:00.000Z",
          summary: "Stopped after confirming the evaluation checklist still needs one more planning pass before code changes.",
          status: "WIP",
          change_type: "investigation",
          affected_files: ["docs/benchmark-runner-metadata-contract.md", "swebench/harness/diffs.py"],
          next_steps: "Use the updated plan checklist as the authoritative next step before touching the implementation.",
          blockers: "",
        }),
      ],
      activeContext: {
        active_work_id: "Hp3cM8",
        project_root: fixture005Root,
        updated_at: "2026-03-29T08:40:00.000Z",
      },
      notesFiles: [
        noteFile(
          "Hp3cM8",
          "stabilize-diff-extractor-evaluation-checklist",
          "Stabilize diff-extractor evaluation checklist",
          "active",
          "2026-03-29T08:32:00.000Z",
          "Older operator note: reopen `swebench/harness/diffs.py` and continue the diff extractor patch immediately.",
        ),
        noteFile(
          "Hp3cM8",
          "stabilize-diff-extractor-evaluation-checklist",
          "Stabilize diff-extractor evaluation checklist",
          "active",
          "2026-03-29T08:39:00.000Z",
          "1. Update the evaluation checklist wording.\n2. Confirm the metadata examples still line up.\n3. Only then touch the diff extractor implementation.",
          "plan.md",
        ),
      ],
      normalizedState: {
        active_context_work_id: "Hp3cM8",
        works: [
          {
            work_id: "Hp3cM8",
            title: "Stabilize diff-extractor evaluation checklist",
            status: "active",
            latest_log_summary: "Stopped after confirming the evaluation checklist still needs one more planning pass before code changes.",
            latest_log_next_step: "Use the updated plan checklist as the authoritative next step before touching the implementation.",
            latest_note_summary: "Older operator note: reopen `swebench/harness/diffs.py` and continue the diff extractor patch immediately.",
            artifact_files: ["notes.md", "plan.md"],
          },
        ],
      },
      tasklogSurface: {
        active_context: {
          active_work_id: "Hp3cM8",
          active_work_title: "Stabilize diff-extractor evaluation checklist",
        },
        decision_context: {
          authoritative_resume_target: "Hp3cM8",
          primary_evidence_source: "workdocs_plan",
          suggested_decision_type: "resume_work",
          suggested_sequence: "plan_before_code",
        },
        reentry_candidates: [
          {
            work_id: "Hp3cM8",
            title: "Stabilize diff-extractor evaluation checklist",
            status: "active",
            latest_log_summary: "Stopped after confirming the evaluation checklist still needs one more planning pass before code changes.",
            authoritative_artifact: "workdocs/Hp3cM8-stabilize-diff-extractor-evaluation-checklist/plan.md",
            stale_note_summary: "Older operator note: reopen `swebench/harness/diffs.py` and continue the diff extractor patch immediately.",
          },
        ],
      },
    },
    {
      fixtureId: "v2-smoke-006",
      family: "abstain_missing_dependency_eta",
      scenarioTitle: "Blocked candidates without a dependency ETA should trigger abstention",
      questionTitle: "Abstain when the active work is blocked and the dependency priority is still unknown",
      goal: "Check whether the model abstains when an active context exists but the blocker note explicitly says the dependency ETA is unknown and no work should outrank the others yet.",
      task: "Use the provided re-entry evidence to decide whether to resume work immediately, escalate, abstain, or ask a clarifying question first.",
      evidenceHints: [
        "The active context can be misleading when the blocker note says no dependency ETA is known.",
        "The correct answer needs a clarifying question rather than picking a speculative winner.",
      ],
      expected: {
        decision_type: "abstain_insufficient_evidence",
        selected_work_id: "",
        selected_work_title: "",
        work_status: "",
        next_step_summary: "Do not resume yet; first ask which blocked dependency is expected to move next.",
        primary_evidence_source: "blocker_note",
        clarifying_question: "Which blocked dependency is expected to move next: the parser schema review or the sample-pack approval?",
        abstention_reason: "The blocker note says the dependency ETA is unknown, so there is still no authoritative resume target.",
        escalation_target: "",
      },
      gradingNotes: [
        "This fixture looks temptingly active, but the blocker note removes the authority to pick a winner.",
        "The answer must abstain and ask which dependency is expected to move first.",
      ],
      works: [
        work(fixture006Root, {
          workId: "Ju4tN6",
          title: "Refresh parser schema review notes",
          slug: "refresh-parser-schema-review-notes",
          status: "blocked",
          impact: "high",
          relDir: "repos/SWE-bench/swebench/harness",
          summary: "Parser schema review is blocked and still has no ETA.",
          tags: ["v2", "blocked", "eta"],
          createdAt: "2026-03-29T08:30:00.000Z",
          updatedAt: "2026-03-29T08:46:00.000Z",
        }),
        work(fixture006Root, {
          workId: "Kv5uP7",
          title: "Approve sample-pack rollout note",
          slug: "approve-sample-pack-rollout-note",
          status: "blocked",
          impact: "medium",
          relDir: "docs",
          summary: "Sample-pack note approval is also blocked and has no priority signal.",
          tags: ["v2", "blocked", "docs"],
          createdAt: "2026-03-29T08:31:00.000Z",
          updatedAt: "2026-03-29T08:45:00.000Z",
        }),
      ],
      sessionLogs: [
        sessionLog({
          id: "V2S6-01",
          work_id: "Ju4tN6",
          timestamp: "2026-03-29T08:46:00.000Z",
          summary: "Kept the parser schema review blocked because nobody knows when the upstream review will move.",
          status: "Blocked",
          change_type: "investigation",
          affected_files: ["docs/parser-schema-review.md"],
          next_steps: "Do not resume until someone names which blocked dependency is expected to move next.",
          blockers: "Dependency ETA unknown.",
        }),
        sessionLog({
          id: "V2S6-02",
          work_id: "Kv5uP7",
          timestamp: "2026-03-29T08:45:00.000Z",
          summary: "Left the sample-pack note blocked because the approval dependency still has no ETA.",
          status: "Blocked",
          change_type: "docs",
          affected_files: ["docs/sample-pack-rollout.md"],
          next_steps: "Wait until the dependency ETA is known or ask which blocked dependency is expected to move next.",
          blockers: "Dependency ETA unknown.",
        }),
      ],
      activeContext: {
        active_work_id: "Ju4tN6",
        project_root: fixture006Root,
        updated_at: "2026-03-29T08:46:00.000Z",
      },
      notesFiles: [
        noteFile(
          "Ju4tN6",
          "refresh-parser-schema-review-notes",
          "Refresh parser schema review notes",
          "blocked",
          "2026-03-29T08:46:00.000Z",
          "Blocker note: do not pick a resume target until someone names which blocked dependency is expected to move next.",
        ),
        noteFile(
          "Kv5uP7",
          "approve-sample-pack-rollout-note",
          "Approve sample-pack rollout note",
          "blocked",
          "2026-03-29T08:45:00.000Z",
          "This approval note stays blocked with no ETA and should not be assumed to outrank the parser schema review.",
        ),
      ],
      normalizedState: {
        active_context_work_id: "Ju4tN6",
        works: [
          {
            work_id: "Ju4tN6",
            title: "Refresh parser schema review notes",
            status: "blocked",
            latest_log_summary: "Kept the parser schema review blocked because nobody knows when the upstream review will move.",
            latest_log_next_step: "Do not resume until someone names which blocked dependency is expected to move next.",
            latest_note_summary: "Blocker note: do not pick a resume target until someone names which blocked dependency is expected to move next.",
            artifact_files: ["notes.md"],
          },
          {
            work_id: "Kv5uP7",
            title: "Approve sample-pack rollout note",
            status: "blocked",
            latest_log_summary: "Left the sample-pack note blocked because the approval dependency still has no ETA.",
            latest_log_next_step: "Wait until the dependency ETA is known or ask which blocked dependency is expected to move next.",
            latest_note_summary: "This approval note stays blocked with no ETA and should not be assumed to outrank the parser schema review.",
            artifact_files: ["notes.md"],
          },
        ],
      },
      tasklogSurface: {
        active_context: {
          active_work_id: "Ju4tN6",
          active_work_title: "Refresh parser schema review notes",
        },
        decision_context: {
          authoritative_resume_target: "",
          ambiguity_status: "dependency_eta_unknown",
          primary_evidence_source: "blocker_note",
          suggested_decision_type: "abstain_insufficient_evidence",
          suggested_clarifying_question: "Which blocked dependency is expected to move next: the parser schema review or the sample-pack approval?",
        },
        reentry_candidates: [
          {
            work_id: "Ju4tN6",
            title: "Refresh parser schema review notes",
            status: "blocked",
            blocker_strength: "authoritative",
          },
          {
            work_id: "Kv5uP7",
            title: "Approve sample-pack rollout note",
            status: "blocked",
            blocker_strength: "authoritative",
          },
        ],
      },
    },
    {
      fixtureId: "v2-smoke-007",
      family: "escalate_security_review",
      scenarioTitle: "Security review should gate the next step",
      questionTitle: "Resume the upload-route work only through a security review escalation",
      goal: "Check whether the model routes a blocked security-sensitive task through the required review instead of continuing from an implementation note.",
      task: "Use the provided re-entry evidence to decide whether to resume work immediately, escalate, abstain, or ask a clarifying question first.",
      evidenceHints: [
        "The work is still the correct target, but the next action is a named escalation rather than code.",
        "The stale note mentions implementation work that is no longer safe to do first.",
      ],
      expected: {
        decision_type: "resume_blocked_with_escalation",
        selected_work_id: "Lr8sG1",
        selected_work_title: "Gate upload-route replay behind review",
        work_status: "blocked",
        next_step_summary: "Resume `Lr8sG1` through escalation by routing the upload-route replay change to security review before editing code.",
        primary_evidence_source: "escalation_directive",
        clarifying_question: "",
        abstention_reason: "",
        escalation_target: "security_review",
      },
      gradingNotes: [
        "The model should not abstain here because the authoritative target is known.",
        "The key distinction is escalation-before-code, not target selection.",
      ],
      works: [
        work(fixture007Root, {
          workId: "Lr8sG1",
          title: "Gate upload-route replay behind review",
          slug: "gate-upload-route-replay-behind-review",
          status: "blocked",
          impact: "high",
          relDir: "repos/SWE-bench/swebench/inference",
          summary: "The upload-route replay change is blocked pending security review.",
          tags: ["v2", "security", "blocked"],
          createdAt: "2026-03-29T08:34:00.000Z",
          updatedAt: "2026-03-29T08:48:00.000Z",
        }),
      ],
      sessionLogs: [
        sessionLog({
          id: "V2S7-01",
          work_id: "Lr8sG1",
          timestamp: "2026-03-29T08:48:00.000Z",
          summary: "Stopped the upload-route replay work after confirming the next legal step is a security review, not a direct edit.",
          status: "Blocked",
          change_type: "investigation",
          affected_files: ["swebench/inference/run_api.py"],
          next_steps: "Route the upload-route replay change through security review before editing any implementation files.",
          blockers: "Security review pending.",
        }),
      ],
      activeContext: {
        active_work_id: "Lr8sG1",
        project_root: fixture007Root,
        updated_at: "2026-03-29T08:48:00.000Z",
      },
      notesFiles: [
        noteFile(
          "Lr8sG1",
          "gate-upload-route-replay-behind-review",
          "Gate upload-route replay behind review",
          "blocked",
          "2026-03-29T08:44:00.000Z",
          "Older operator note: continue the replay implementation in `swebench/inference/run_api.py` and send the security review once the patch is ready.",
        ),
      ],
      normalizedState: {
        active_context_work_id: "Lr8sG1",
        works: [
          {
            work_id: "Lr8sG1",
            title: "Gate upload-route replay behind review",
            status: "blocked",
            latest_log_summary: "Stopped the upload-route replay work after confirming the next legal step is a security review, not a direct edit.",
            latest_log_next_step: "Route the upload-route replay change through security review before editing any implementation files.",
            latest_note_summary: "Older operator note: continue the replay implementation in `swebench/inference/run_api.py` and send the security review once the patch is ready.",
            artifact_files: ["notes.md"],
          },
        ],
      },
      tasklogSurface: {
        active_context: {
          active_work_id: "Lr8sG1",
          active_work_title: "Gate upload-route replay behind review",
        },
        decision_context: {
          authoritative_resume_target: "Lr8sG1",
          primary_evidence_source: "escalation_directive",
          suggested_decision_type: "resume_blocked_with_escalation",
          suggested_escalation_target: "security_review",
        },
        reentry_candidates: [
          {
            work_id: "Lr8sG1",
            title: "Gate upload-route replay behind review",
            status: "blocked",
            latest_log_summary: "Stopped the upload-route replay work after confirming the next legal step is a security review, not a direct edit.",
          },
        ],
      },
    },
    {
      fixtureId: "v2-smoke-008",
      family: "sequence_docs_before_code",
      scenarioTitle: "Action sequencing should prefer docs contract freeze before code edits",
      questionTitle: "Resume the contract-doc step before editing the parser",
      goal: "Check whether the model keeps the same work but selects the docs-contract step as the next action rather than jumping to code.",
      task: "Use the provided re-entry evidence to decide whether to resume work immediately, escalate, abstain, or ask a clarifying question first.",
      evidenceHints: [
        "The work is active and unblocked; the differentiator is sequence, not target.",
        "The contract doc freeze is the authoritative precursor to the parser edit.",
      ],
      expected: {
        decision_type: "resume_work",
        selected_work_id: "Mr9vK2",
        selected_work_title: "Align parser hints with contract freeze",
        work_status: "active",
        next_step_summary: "Resume `Mr9vK2` by freezing the contract doc wording before editing the parser hints.",
        primary_evidence_source: "task_sequence_plan",
        clarifying_question: "",
        abstention_reason: "",
        escalation_target: "",
      },
      gradingNotes: [
        "This fixture is incorrect if the answer jumps straight into parser code.",
        "The contract doc freeze is the main thing being tested here.",
      ],
      works: [
        work(fixture008Root, {
          workId: "Mr9vK2",
          title: "Align parser hints with contract freeze",
          slug: "align-parser-hints-with-contract-freeze",
          status: "active",
          impact: "high",
          relDir: "repos/SWE-bench/swebench/harness",
          summary: "Parser hint edits should wait until the contract wording is frozen.",
          tags: ["v2", "sequence", "contract"],
          createdAt: "2026-03-29T08:36:00.000Z",
          updatedAt: "2026-03-29T08:50:00.000Z",
        }),
      ],
      sessionLogs: [
        sessionLog({
          id: "V2S8-01",
          work_id: "Mr9vK2",
          timestamp: "2026-03-29T08:50:00.000Z",
          summary: "Paused before parser edits because the contract wording still needed one explicit freeze pass.",
          status: "WIP",
          change_type: "docs",
          affected_files: ["docs/benchmark-runner-metadata-contract.md", "swebench/harness/parser_hints.py"],
          next_steps: "Freeze the contract doc wording first, then resume parser hint edits.",
          blockers: "",
        }),
      ],
      activeContext: {
        active_work_id: "Mr9vK2",
        project_root: fixture008Root,
        updated_at: "2026-03-29T08:50:00.000Z",
      },
      notesFiles: [
        noteFile(
          "Mr9vK2",
          "align-parser-hints-with-contract-freeze",
          "Align parser hints with contract freeze",
          "active",
          "2026-03-29T08:47:00.000Z",
          "Older operator note: reopen `swebench/harness/parser_hints.py` and keep patching the parser hints.",
        ),
        noteFile(
          "Mr9vK2",
          "align-parser-hints-with-contract-freeze",
          "Align parser hints with contract freeze",
          "active",
          "2026-03-29T08:49:00.000Z",
          "Freeze the contract wording in the metadata doc before resuming parser hint edits.",
          "plan.md",
        ),
      ],
      normalizedState: {
        active_context_work_id: "Mr9vK2",
        works: [
          {
            work_id: "Mr9vK2",
            title: "Align parser hints with contract freeze",
            status: "active",
            latest_log_summary: "Paused before parser edits because the contract wording still needed one explicit freeze pass.",
            latest_log_next_step: "Freeze the contract doc wording first, then resume parser hint edits.",
            latest_note_summary: "Older operator note: reopen `swebench/harness/parser_hints.py` and keep patching the parser hints.",
            artifact_files: ["notes.md", "plan.md"],
          },
        ],
      },
      tasklogSurface: {
        active_context: {
          active_work_id: "Mr9vK2",
          active_work_title: "Align parser hints with contract freeze",
        },
        decision_context: {
          authoritative_resume_target: "Mr9vK2",
          primary_evidence_source: "task_sequence_plan",
          suggested_decision_type: "resume_work",
          suggested_sequence: "docs_before_code",
        },
        reentry_candidates: [
          {
            work_id: "Mr9vK2",
            title: "Align parser hints with contract freeze",
            status: "active",
            authoritative_artifact: "workdocs/Mr9vK2-align-parser-hints-with-contract-freeze/plan.md",
          },
        ],
      },
    },
    {
      fixtureId: "v2-smoke-009",
      family: "ask_handoff_owner_question",
      scenarioTitle: "A cross-lane handoff should trigger a clarifying ownership question",
      questionTitle: "Ask which lane owns the next step before resuming the handoff target",
      goal: "Check whether the model asks a clarifying question when the latest handoff log points to a work but ownership between two lanes is still unresolved.",
      task: "Use the provided re-entry evidence to decide whether to resume work immediately, escalate, abstain, or ask a clarifying question first.",
      evidenceHints: [
        "A handoff log names the likely target work, but lane ownership is still unsettled.",
        "The correct answer keeps the target work but asks about ownership before resuming it.",
      ],
      expected: {
        decision_type: "ask_clarifying_question",
        selected_work_id: "Nt2xQ4",
        selected_work_title: "Reconcile API lane and grader lane ownership",
        work_status: "active",
        next_step_summary: "Ask whether the API lane or the grader lane owns the next step before resuming `Nt2xQ4`.",
        primary_evidence_source: "latest_handoff_log",
        clarifying_question: "Which lane owns the next step for `Nt2xQ4`: the API lane or the grader lane?",
        abstention_reason: "",
        escalation_target: "",
      },
      gradingNotes: [
        "This is not an abstention case because the likely target work is known.",
        "The issue is unresolved ownership, so immediate resumption is premature.",
      ],
      works: [
        work(fixture009Root, {
          workId: "Nt2xQ4",
          title: "Reconcile API lane and grader lane ownership",
          slug: "reconcile-api-lane-and-grader-lane-ownership",
          status: "active",
          impact: "high",
          relDir: "repos/SWE-bench/swebench/harness",
          summary: "The ownership handoff is unresolved even though the likely target work is known.",
          tags: ["v2", "handoff", "ownership"],
          createdAt: "2026-03-29T08:38:00.000Z",
          updatedAt: "2026-03-29T08:52:00.000Z",
        }),
        work(fixture009Root, {
          workId: "Pr3yD5",
          title: "Close API lane breadcrumbs",
          slug: "close-api-lane-breadcrumbs",
          status: "active",
          impact: "medium",
          relDir: "repos/SWE-bench/swebench/inference",
          summary: "Breadcrumb cleanup may be secondary if ownership stays with the grader lane.",
          tags: ["v2", "handoff", "cleanup"],
          createdAt: "2026-03-29T08:39:00.000Z",
          updatedAt: "2026-03-29T08:47:00.000Z",
        }),
      ],
      sessionLogs: [
        sessionLog({
          id: "V2S9-01",
          work_id: "Nt2xQ4",
          timestamp: "2026-03-29T08:52:00.000Z",
          summary: "Logged the likely resume target as `Nt2xQ4`, but the handoff still does not say whether the API lane or grader lane owns the next step.",
          status: "WIP",
          change_type: "investigation",
          affected_files: ["docs/lane-handoff.md"],
          next_steps: "Ask which lane owns the next step before resuming `Nt2xQ4`.",
          blockers: "",
        }),
        sessionLog({
          id: "V2S9-02",
          work_id: "Pr3yD5",
          timestamp: "2026-03-29T08:47:00.000Z",
          summary: "Left API breadcrumbs in place until lane ownership is settled.",
          status: "WIP",
          change_type: "docs",
          affected_files: ["docs/lane-handoff.md"],
          next_steps: "Wait for the ownership answer before closing breadcrumbs.",
          blockers: "",
        }),
      ],
      activeContext: {
        active_work_id: "Nt2xQ4",
        project_root: fixture009Root,
        updated_at: "2026-03-29T08:52:00.000Z",
      },
      notesFiles: [
        noteFile(
          "Nt2xQ4",
          "reconcile-api-lane-and-grader-lane-ownership",
          "Reconcile API lane and grader lane ownership",
          "active",
          "2026-03-29T08:52:00.000Z",
          "Handoff note: the likely target is `Nt2xQ4`, but the lane owner for the next step is still unspecified.",
        ),
        noteFile(
          "Pr3yD5",
          "close-api-lane-breadcrumbs",
          "Close API lane breadcrumbs",
          "active",
          "2026-03-29T08:47:00.000Z",
          "Breadcrumb cleanup stays secondary until lane ownership is settled.",
        ),
      ],
      normalizedState: {
        active_context_work_id: "Nt2xQ4",
        works: [
          {
            work_id: "Nt2xQ4",
            title: "Reconcile API lane and grader lane ownership",
            status: "active",
            latest_log_summary: "Logged the likely resume target as `Nt2xQ4`, but the handoff still does not say whether the API lane or grader lane owns the next step.",
            latest_log_next_step: "Ask which lane owns the next step before resuming `Nt2xQ4`.",
            latest_note_summary: "Handoff note: the likely target is `Nt2xQ4`, but the lane owner for the next step is still unspecified.",
            artifact_files: ["notes.md", "lane-handoff.md"],
          },
          {
            work_id: "Pr3yD5",
            title: "Close API lane breadcrumbs",
            status: "active",
            latest_log_summary: "Left API breadcrumbs in place until lane ownership is settled.",
            latest_log_next_step: "Wait for the ownership answer before closing breadcrumbs.",
            latest_note_summary: "Breadcrumb cleanup stays secondary until lane ownership is settled.",
            artifact_files: ["notes.md"],
          },
        ],
      },
      tasklogSurface: {
        active_context: {
          active_work_id: "Nt2xQ4",
          active_work_title: "Reconcile API lane and grader lane ownership",
        },
        decision_context: {
          authoritative_resume_target: "Nt2xQ4",
          ambiguity_status: "handoff_owner_unresolved",
          primary_evidence_source: "latest_handoff_log",
          suggested_decision_type: "ask_clarifying_question",
        },
        reentry_candidates: [
          {
            work_id: "Nt2xQ4",
            title: "Reconcile API lane and grader lane ownership",
            status: "active",
            latest_log_summary: "Logged the likely resume target as `Nt2xQ4`, but the handoff still does not say whether the API lane or grader lane owns the next step.",
          },
          {
            work_id: "Pr3yD5",
            title: "Close API lane breadcrumbs",
            status: "active",
            relationship_to_primary: "secondary_until_ownership_resolved",
          },
        ],
      },
    },
    {
      fixtureId: "v2-smoke-010",
      family: "resume_other_after_done_log",
      scenarioTitle: "A completed work should not keep winning because of stale notes",
      questionTitle: "Resume the still-open grading task instead of the recently completed note owner",
      goal: "Check whether the model ignores a stale note on a just-completed work and resumes the other active work named by the latest done log.",
      task: "Use the provided re-entry evidence to decide whether to resume work immediately, escalate, abstain, or ask a clarifying question first.",
      evidenceHints: [
        "The active context still points at a work that has already been wrapped.",
        "A newer done log explicitly hands control to another active work that should now resume.",
      ],
      expected: {
        decision_type: "resume_work",
        selected_work_id: "Pw4zR6",
        selected_work_title: "Finish holdout grader audit after note wrap",
        work_status: "active",
        next_step_summary: "Resume `Pw4zR6` because the note-wrap work is done and its latest log hands control to the grader audit.",
        primary_evidence_source: "latest_done_log",
        clarifying_question: "",
        abstention_reason: "",
        escalation_target: "",
      },
      gradingNotes: [
        "Picking the completed note-wrap work is incorrect even if its stale note looks actionable.",
        "This fixture checks whether done logs can hand control cleanly to another active work.",
      ],
      works: [
        work(fixture010Root, {
          workId: "Ow1mA3",
          title: "Wrap note wording for holdout summary",
          slug: "wrap-note-wording-for-holdout-summary",
          status: "active",
          impact: "medium",
          relDir: "docs",
          summary: "The note-wrap work still appears active in context, but the latest log says it is finished.",
          tags: ["v2", "done-log", "docs"],
          createdAt: "2026-03-29T08:41:00.000Z",
          updatedAt: "2026-03-29T08:53:00.000Z",
        }),
        work(fixture010Root, {
          workId: "Pw4zR6",
          title: "Finish holdout grader audit after note wrap",
          slug: "finish-holdout-grader-audit-after-note-wrap",
          status: "active",
          impact: "high",
          relDir: "repos/SWE-bench/swebench/harness",
          summary: "The grader audit is the real remaining active work after the note wrap completed.",
          tags: ["v2", "handoff", "audit"],
          createdAt: "2026-03-29T08:42:00.000Z",
          updatedAt: "2026-03-29T08:54:00.000Z",
        }),
      ],
      sessionLogs: [
        sessionLog({
          id: "V2S10-01",
          work_id: "Ow1mA3",
          timestamp: "2026-03-29T08:53:00.000Z",
          summary: "Finished the holdout summary note wrap and handed control to the grader audit work.",
          status: "Done",
          change_type: "docs",
          affected_files: ["docs/holdout-summary.md"],
          next_steps: "Resume `Pw4zR6` and finish the grader audit.",
          blockers: "",
        }),
        sessionLog({
          id: "V2S10-02",
          work_id: "Pw4zR6",
          timestamp: "2026-03-29T08:54:00.000Z",
          summary: "Queued the grader audit immediately after the note wrap completed.",
          status: "WIP",
          change_type: "test",
          affected_files: ["swebench/harness/grading.py"],
          next_steps: "Finish the grader audit and capture any remaining mismatch.",
          blockers: "",
        }),
      ],
      activeContext: {
        active_work_id: "Ow1mA3",
        project_root: fixture010Root,
        updated_at: "2026-03-29T08:52:00.000Z",
      },
      notesFiles: [
        noteFile(
          "Ow1mA3",
          "wrap-note-wording-for-holdout-summary",
          "Wrap note wording for holdout summary",
          "active",
          "2026-03-29T08:50:00.000Z",
          "Stale note: return to the holdout summary wording polish when you resume.",
        ),
        noteFile(
          "Pw4zR6",
          "finish-holdout-grader-audit-after-note-wrap",
          "Finish holdout grader audit after note wrap",
          "active",
          "2026-03-29T08:54:00.000Z",
          "The grader audit is next once the note wrap is done.",
        ),
      ],
      normalizedState: {
        active_context_work_id: "Ow1mA3",
        works: [
          {
            work_id: "Ow1mA3",
            title: "Wrap note wording for holdout summary",
            status: "active",
            latest_log_summary: "Finished the holdout summary note wrap and handed control to the grader audit work.",
            latest_log_next_step: "Resume `Pw4zR6` and finish the grader audit.",
            latest_note_summary: "Stale note: return to the holdout summary wording polish when you resume.",
            artifact_files: ["notes.md", "holdout-summary.md"],
          },
          {
            work_id: "Pw4zR6",
            title: "Finish holdout grader audit after note wrap",
            status: "active",
            latest_log_summary: "Queued the grader audit immediately after the note wrap completed.",
            latest_log_next_step: "Finish the grader audit and capture any remaining mismatch.",
            latest_note_summary: "The grader audit is next once the note wrap is done.",
            artifact_files: ["notes.md"],
          },
        ],
      },
      tasklogSurface: {
        active_context: {
          active_work_id: "Ow1mA3",
          active_work_title: "Wrap note wording for holdout summary",
          freshness_status: "stale",
        },
        decision_context: {
          authoritative_resume_target: "Pw4zR6",
          primary_evidence_source: "latest_done_log",
          suggested_decision_type: "resume_work",
        },
        reentry_candidates: [
          {
            work_id: "Ow1mA3",
            title: "Wrap note wording for holdout summary",
            status: "done_handoff_complete",
            stale_note_summary: "Stale note: return to the holdout summary wording polish when you resume.",
          },
          {
            work_id: "Pw4zR6",
            title: "Finish holdout grader audit after note wrap",
            status: "active",
            latest_log_summary: "Queued the grader audit immediately after the note wrap completed.",
          },
        ],
      },
    },
  ];
}

async function materializeFixture(baseRoot: string, fixture: FixtureDef): Promise<void> {
  const fixtureRoot = path.join(baseRoot, fixture.fixtureId);
  const workspaceRoot = path.join(fixtureRoot, "workspace");
  const tasklogRoot = path.join(workspaceRoot, ".tasklog");
  const workdocsRoot = path.join(workspaceRoot, "workdocs");
  const surfacesRoot = path.join(fixtureRoot, "surfaces");

  await fs.mkdir(path.join(workspaceRoot, "repos", "SWE-bench"), { recursive: true });
  await fs.mkdir(tasklogRoot, { recursive: true });
  await fs.mkdir(workdocsRoot, { recursive: true });
  await fs.mkdir(surfacesRoot, { recursive: true });

  await fs.writeFile(
    path.join(fixtureRoot, "README.md"),
    `# Tasklog V2 Fixture\n\nFixture id: \`${fixture.fixtureId}\`\nFamily: \`${fixture.family}\`\n\n${fixture.scenarioTitle}\n`,
    "utf8",
  );

  await writeJson(path.join(fixtureRoot, "fixture-manifest.json"), {
    version: 1,
    fixture_id: fixture.fixtureId,
    split: "v2_smoke",
    benchmark_type: "llm_reentry_understanding_v2_smoke",
    scenario_family: fixture.family,
    scenario_title: fixture.scenarioTitle,
    workspace_root: workspaceRoot,
    surfaces: {
      normalized_state: path.join(surfacesRoot, "normalized-state.json"),
      tasklog_reentry: path.join(surfacesRoot, "tasklog-reentry.json"),
    },
  });

  await writeJson(path.join(fixtureRoot, "questions.json"), {
    version: 1,
    fixture_id: fixture.fixtureId,
    split: "v2_smoke",
    benchmark_type: "llm_reentry_understanding_v2_smoke",
    answer_contract: {
      required_fields: [
        "decision_type",
        "selected_work_id",
        "selected_work_title",
        "work_status",
        "next_step_summary",
        "primary_evidence_source",
        "selection_rationale",
        "clarifying_question",
        "abstention_reason",
        "escalation_target",
        "other_candidate_work_ids",
      ],
    },
    shared_prompt: "You are resuming work in a coding workspace. Decide whether to resume work, resume with escalation, ask a clarifying question, or abstain because the evidence is insufficient. Use only the provided benchmark evidence.",
    questions: [
      {
        question_id: `${fixture.fixtureId}-q01`,
        family: fixture.family,
        title: fixture.questionTitle,
        goal: fixture.goal,
        task: fixture.task,
        expected_difficulty: "medium",
        evidence_hints: fixture.evidenceHints,
      },
    ],
  });

  await writeJson(path.join(fixtureRoot, "answer-key.json"), {
    version: 1,
    fixture_id: fixture.fixtureId,
    split: "v2_smoke",
    benchmark_type: "llm_reentry_understanding_v2_smoke",
    answers: [
      {
        question_id: `${fixture.fixtureId}-q01`,
        family: fixture.family,
        expected_answer: fixture.expected,
        grading_notes: fixture.gradingNotes,
      },
    ],
  });

  await writeJson(path.join(surfacesRoot, "normalized-state.json"), fixture.normalizedState);
  await writeJson(path.join(surfacesRoot, "tasklog-reentry.json"), fixture.tasklogSurface);
  await writeJson(path.join(tasklogRoot, "works.json"), fixture.works);
  await writeJson(path.join(tasklogRoot, "session-log.json"), fixture.sessionLogs);
  await writeJson(path.join(tasklogRoot, "active-context.json"), fixture.activeContext);
  await fs.writeFile(path.join(tasklogRoot, "session-log.md"), "# Session Log\n\n", "utf8");

  for (const file of fixture.notesFiles) {
    const dir = path.join(workdocsRoot, file.dir);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, file.name), file.content, "utf8");
  }
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const fixturesRoot = path.join(options.root, "fixtures-v2");
  const runsRoot = path.join(options.root, "runs");
  await fs.mkdir(runsRoot, { recursive: true });
  await ensureCleanDir(fixturesRoot, options.force);

  const fixtures = makeFixtures(options.root);
  for (const fixture of fixtures) {
    await materializeFixture(fixturesRoot, fixture);
  }

  await writeJson(path.join(fixturesRoot, "v2-smoke-pack-manifest.json"), {
    version: 2,
    pack_id: "tasklog-swe-holdout-v2-smoke-v2",
    split: "v2_smoke",
    fixture_count: fixtures.length,
    fixtures: fixtures.map((fixture) => ({
      fixture_id: fixture.fixtureId,
      family: fixture.family,
      scenario_title: fixture.scenarioTitle,
      expected_decision_type: fixture.expected.decision_type,
      expected_primary_evidence_source: fixture.expected.primary_evidence_source,
    })),
  });

  console.log(JSON.stringify({
    fixtures_root: fixturesRoot,
    fixture_ids: fixtures.map((fixture) => fixture.fixtureId),
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
});
