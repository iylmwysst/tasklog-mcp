import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const DOCS_ROOT = path.join(REPO_ROOT, "docs");
const DEFAULT_LAB_ROOT = "/Users/Lab/Desktop/TasklogSweLab";
const BENCHMARK_TYPE = "tasklog_v4_swe_grounded_reentry";
const FIXTURE_TYPE = "tasklog_v4_1_dev_swe_grounded_fixture";
const ROUND_ID = "V4.1-dev";
const DEV_LANE_STATUS = "spot_check_pending";

type WorkStatus = "active" | "blocked" | "done" | "planned";
type WorkDocKind = "notes" | "plan" | "spec" | "design" | "summary";
type AuditStatus = "spot_check_pending" | "spot_check_in_progress" | "spot_check_pass";

interface CliOptions {
  force: boolean;
  fixtureIds: string[];
  labRoot: string;
  outRoot: string;
}

interface SourcePoolCandidate {
  source_instance_id: string;
  source_title: string;
  source_rel_paths: string[];
  source_area: string;
  upstream_repo_slug: string;
  upstream_commit: string;
  source_vendor_path: string;
}

interface AllocationFixture {
  fixture_id: string;
  family_id: string;
  source_instance_id: string;
  primary_decision_mode: string;
  difficulty: "medium" | "hard";
  candidate_work_id_allowed: boolean;
  expected_label_mode: string;
}

interface PromptVersions {
  generation_prompt_version: string;
  review_prompt_version: string;
  generator_model: string;
  reviewer_model: string;
}

interface WorkArtifact {
  body: string;
  kind: WorkDocKind;
}

interface WorkSeed {
  artifacts: WorkArtifact[];
  createdAt: string;
  id: string;
  impact: "low" | "medium" | "high";
  notes: string[];
  scopeRelPaths: string[];
  startDirRel: string;
  status: WorkStatus;
  summary: string;
  tags: string[];
  title: string;
  updatedAt: string;
}

interface SessionLogSeed {
  affectedFiles: string[];
  changeType: "docs" | "feature" | "investigation" | "research";
  id: string;
  nextSteps: string;
  status: "WIP" | "Done";
  summary: string;
  timestamp: string;
  workId: string;
}

interface ScenarioSeed {
  activeContextWorkId: string;
  ambiguityRationale: string;
  distractorRationale: string;
  goal: string;
  questionTitle: string;
  scenarioNote: string;
  scenarioTitle: string;
  seedNotes: string[];
  sessionLogs: SessionLogSeed[];
  task: string;
  works: WorkSeed[];
}

function parseArgs(argv: string[]): CliOptions {
  let force = false;
  let labRoot = DEFAULT_LAB_ROOT;
  let outRoot = path.join(DEFAULT_LAB_ROOT, "fixtures-v4-1-dev");
  const fixtureIds: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current === "--lab-root") {
      labRoot = path.resolve(argv[index + 1] ?? labRoot);
      index += 1;
      outRoot = path.join(labRoot, "fixtures-v4-1-dev");
      continue;
    }
    if (current === "--out-root") {
      outRoot = path.resolve(argv[index + 1] ?? outRoot);
      index += 1;
      continue;
    }
    if (current === "--fixture-id") {
      const fixtureId = argv[index + 1];
      if (fixtureId) {
        fixtureIds.push(fixtureId);
      }
      index += 1;
      continue;
    }
    if (current === "--force") {
      force = true;
      continue;
    }
  }

  return {
    force,
    fixtureIds,
    labRoot,
    outRoot,
  };
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function ensureCleanDirectory(targetPath: string, force: boolean): Promise<void> {
  if (await pathExists(targetPath)) {
    if (!force) {
      throw new Error(`Refusing to overwrite existing output without --force: ${targetPath}`);
    }
    await fs.rm(targetPath, { recursive: true, force: true });
  }
  await fs.mkdir(targetPath, { recursive: true });
}

async function writeJsonFile(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function loadJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

async function readGitHead(repoRoot: string): Promise<string> {
  try {
    const { stdout } = await execFile("git", ["-C", repoRoot, "rev-parse", "HEAD"]);
    return stdout.trim();
  } catch {
    return "";
  }
}

async function copyRepoSnapshot(sourcePath: string, targetPath: string): Promise<void> {
  await fs.cp(sourcePath, targetPath, {
    recursive: true,
    force: true,
    filter: (entry) => {
      const baseName = path.basename(entry);
      return ![".git", ".tasklog", "workdocs", "node_modules", "dist", "target", ".next", ".turbo", "coverage"].includes(baseName);
    },
  });
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function relToRepoPaths(workspaceRoot: string, relPaths: string[]): string[] {
  return relPaths.map((relPath) => path.join(workspaceRoot, "repos", "SWE-bench", relPath));
}

function latestLogForWork(logs: SessionLogSeed[], workId: string): SessionLogSeed | undefined {
  return logs
    .filter((log) => log.workId === workId)
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp))[0];
}

function sessionLogMarkdown(logs: SessionLogSeed[]): string {
  const lines = ["# Session Log", ""];
  for (const log of logs.sort((left, right) => left.timestamp.localeCompare(right.timestamp))) {
    lines.push(`## ${log.timestamp}`);
    lines.push("");
    lines.push(`- work_id: \`${log.workId}\``);
    lines.push(`- status: \`${log.status}\``);
    lines.push(`- change_type: \`${log.changeType}\``);
    lines.push(`- summary: ${log.summary}`);
    lines.push(`- next_steps: ${log.nextSteps}`);
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

function artifactHeader(work: WorkSeed, workspaceRoot: string): string[] {
  return [
    "---",
    `work_id: '${work.id}'`,
    `title: '${work.title.replace(/'/g, "''")}'`,
    `status: '${work.status}'`,
    `impact: '${work.impact}'`,
    `start_dir: '${path.join(workspaceRoot, "repos", "SWE-bench", work.startDirRel).replace(/'/g, "''")}'`,
    "scope_paths:",
    ...work.scopeRelPaths.map((scopeRelPath) => `  - '${path.join(workspaceRoot, "repos", "SWE-bench", scopeRelPath).replace(/'/g, "''")}'`),
    `updated_at: '${work.updatedAt}'`,
    "---",
    "",
  ];
}

function artifactTitle(kind: WorkDocKind): string {
  const titles: Record<WorkDocKind, string> = {
    notes: "# Notes",
    plan: "# Implementation Plan",
    spec: "# Spec",
    design: "# Design Notes",
    summary: "# Summary",
  };
  return titles[kind];
}

function artifactBody(work: WorkSeed, workspaceRoot: string, artifact: WorkArtifact): string {
  return [
    ...artifactHeader(work, workspaceRoot),
    artifactTitle(artifact.kind),
    "",
    artifact.body,
    "",
  ].join("\n");
}

function normalizedStatePayload(
  fixtureId: string,
  workspaceRoot: string,
  activeContextWorkId: string,
  works: WorkSeed[],
  sessionLogs: SessionLogSeed[],
) {
  const worksPayload = works.map((work) => {
    const latest = latestLogForWork(sessionLogs, work.id);
    const artifactBasenames = work.artifacts.map((artifact) => `${artifact.kind}.md`).sort();
    return {
      work_id: work.id,
      title: work.title,
      status: work.status,
      created_at: work.createdAt,
      updated_at: work.updatedAt,
      scope_paths: work.scopeRelPaths,
      short_work_summary: work.summary,
      latest_log_summary: latest?.summary ?? "",
      latest_next_steps: latest?.nextSteps ?? "",
      artifact_basenames: artifactBasenames,
    };
  });

  const activeWork = works.find((work) => work.id === activeContextWorkId);

  return {
    benchmark_type: BENCHMARK_TYPE,
    arm_id: "normalized_state",
    fixture_id: fixtureId,
    active_context: {
      active_work_id: activeContextWorkId,
      active_work_status: activeWork?.status ?? "",
      active_work_updated_at: activeWork?.updatedAt ?? "",
    },
    works: worksPayload,
    workspace_root: workspaceRoot,
  };
}

function tasklogReentryPayload(
  fixtureId: string,
  activeContextWorkId: string,
  works: WorkSeed[],
  sessionLogs: SessionLogSeed[],
) {
  const activeWork = works.find((work) => work.id === activeContextWorkId);
  const openWorkBriefs = works
    .filter((work) => work.status !== "done")
    .map((work) => {
      const latest = latestLogForWork(sessionLogs, work.id);
      return {
        work_id: work.id,
        title: work.title,
        status: work.status,
        updated_at: work.updatedAt,
        scope_paths: work.scopeRelPaths,
        summary: work.summary,
        latest_log_summary: latest?.summary ?? "",
        next_step_summary: latest?.nextSteps ?? "",
        artifact_files: work.artifacts.map((artifact) => `${artifact.kind}.md`).sort(),
      };
    })
    .sort((left, right) => right.updated_at.localeCompare(left.updated_at));

  return {
    benchmark_type: BENCHMARK_TYPE,
    arm_id: "tasklog_reentry",
    fixture_id: fixtureId,
    surface_name: "brief",
    active_context: {
      active_work_id: activeContextWorkId,
      active_work_status: activeWork?.status ?? "",
      active_work_updated_at: activeWork?.updatedAt ?? "",
    },
    open_work_briefs: openWorkBriefs,
  };
}

const PILOT_SCENARIOS: Record<string, ScenarioSeed> = {
  "v4-001": {
    activeContextWorkId: "A1R7N2",
    ambiguityRationale: "An older broad note points toward a harness-wide refresh, but the newest structured session log narrows the legal next step to the run_evaluation entrypoint contract.",
    distractorRationale: "The docs refresh work looks recent and adjacent, but its artifacts are secondary to the sharper log-backed entrypoint freeze.",
    goal: "Identify the unfinished work that should be resumed now and state the correct next concrete step.",
    questionTitle: "Latest structured log should override an older broad harness note",
    scenarioNote: "This pilot fixture checks that the model can prefer the sharper structured handoff over an older note when both point at the same codebase area in different ways.",
    scenarioTitle: "Latest structured log overrides an older broad harness note",
    seedNotes: [
      "The broad harness-refresh note is intentionally stale and should not outrank the sharper latest session log.",
      "The codebase snapshot contains the exact run_evaluation.py path referenced by the active work."
    ],
    task: "Use the repo snapshot and the seeded Tasklog state to determine which unfinished work to resume, summarize its current state, and state the next concrete step without guessing.",
    works: [
      {
        id: "A1R7N2",
        title: "Freeze harness evaluation entrypoint CLI contract",
        status: "active",
        impact: "high",
        startDirRel: "swebench/harness",
        scopeRelPaths: [
          "swebench/harness/run_evaluation.py",
          "docs/reference/harness.md"
        ],
        summary: "Narrow the run_evaluation.py CLI contract before any broader runner or reporting refresh.",
        tags: ["benchmark", "v4", "harness", "cli"],
        createdAt: "2026-03-30T08:10:00.000Z",
        updatedAt: "2026-03-30T09:24:00.000Z",
        notes: [
          "Initial exploration started as a broad harness refresh, but that scope is now too wide for the next session.",
          "The remaining legal next step is to freeze the entrypoint CLI shape in run_evaluation.py before touching reporting or docs."
        ],
        artifacts: [
          {
            kind: "plan",
            body: "## Scope\n\nFreeze the argument and exit-code contract in `swebench/harness/run_evaluation.py` before any broader runner refresh.\n\n## Steps\n\n1. Review the current argparse and exit paths.\n2. Write the CLI contract note.\n3. Only then queue follow-up work for reporting or docs.\n"
          },
          {
            kind: "spec",
            body: "## Contract\n\nThe next session should not edit reporting or evaluation docs first. The first pass must lock the entrypoint CLI and status semantics inside `run_evaluation.py`.\n"
          }
        ]
      },
      {
        id: "B4M2K8",
        title: "Refresh evaluation guide screenshots",
        status: "planned",
        impact: "low",
        startDirRel: "docs/guides",
        scopeRelPaths: [
          "docs/guides/evaluation.md"
        ],
        summary: "Refresh screenshots and wording in the evaluation guide after the CLI contract is frozen.",
        tags: ["benchmark", "docs", "guide"],
        createdAt: "2026-03-29T16:00:00.000Z",
        updatedAt: "2026-03-30T08:55:00.000Z",
        notes: [
          "This docs work depends on the entrypoint freeze and should not be resumed first."
        ],
        artifacts: [
          {
            kind: "notes",
            body: "The guide refresh remains a follow-on task. It should not outrank the CLI contract freeze."
          }
        ]
      }
    ],
    sessionLogs: [
      {
        id: "V4P-001-01",
        workId: "A1R7N2",
        timestamp: "2026-03-30T08:42:00.000Z",
        summary: "Captured a broad harness-refresh note while surveying the entrypoint, reporting, and docs surfaces.",
        status: "WIP",
        changeType: "investigation",
        affectedFiles: ["swebench/harness/run_evaluation.py", "docs/reference/harness.md"],
        nextSteps: "Decide which sub-scope should freeze first before doing any wide refresh."
      },
      {
        id: "V4P-001-02",
        workId: "A1R7N2",
        timestamp: "2026-03-30T09:24:00.000Z",
        summary: "Narrowed the work to the run_evaluation.py CLI contract and stopped before touching reporting or docs.",
        status: "WIP",
        changeType: "docs",
        affectedFiles: ["swebench/harness/run_evaluation.py"],
        nextSteps: "Freeze the argument and exit-code contract in `swebench/harness/run_evaluation.py` before touching any reporting or docs follow-up."
      },
      {
        id: "V4P-001-03",
        workId: "B4M2K8",
        timestamp: "2026-03-30T08:55:00.000Z",
        summary: "Queued the evaluation guide refresh behind the CLI contract work.",
        status: "WIP",
        changeType: "docs",
        affectedFiles: ["docs/guides/evaluation.md"],
        nextSteps: "Wait for the harness CLI contract freeze before editing the guide."
      }
    ]
  },
  "v4-005": {
    activeContextWorkId: "C9L4T2",
    ambiguityRationale: "The active-context pointer still names the old memo work, but the fresher structured log on the prepare_images audit is the real controlling signal.",
    distractorRationale: "The stale memo work remains open-looking and sits in active context, which is exactly the trap this family should expose.",
    goal: "Use the repo snapshot and Tasklog evidence to identify the actual current resume target even when active context is stale.",
    questionTitle: "Ignore stale active context and resume the fresher prepare_images audit",
    scenarioNote: "This pilot fixture checks whether the model can demote a stale active-context pointer when a fresher log-backed work is clearly sharper.",
    scenarioTitle: "Stale active context should lose to the fresher prepare_images audit",
    seedNotes: [
      "The active-context pointer intentionally remains stale after a handoff.",
      "The fresher work log names the real next step and should control."
    ],
    task: "Determine which work should be resumed now, summarize its state, and state the next legal next step using the repo snapshot and Tasklog evidence only.",
    works: [
      {
        id: "C9L4T2",
        title: "Refresh legacy image-prep memo",
        status: "active",
        impact: "medium",
        startDirRel: "docs/reference",
        scopeRelPaths: [
          "docs/reference/harness.md"
        ],
        summary: "Tidy the old image-preparation memo after the real prepare_images audit stabilizes.",
        tags: ["benchmark", "docs", "stale-active-context"],
        createdAt: "2026-03-29T18:00:00.000Z",
        updatedAt: "2026-03-30T08:12:00.000Z",
        notes: [
          "This work was left in active context accidentally after the handoff."
        ],
        artifacts: [
          {
            kind: "notes",
            body: "Keep this memo task behind the real prepare_images audit; it is still useful but no longer the main target."
          }
        ]
      },
      {
        id: "D7P2V6",
        title: "Resume prepare_images retry-boundary audit",
        status: "active",
        impact: "high",
        startDirRel: "swebench/harness",
        scopeRelPaths: [
          "swebench/harness/prepare_images.py",
          "docs/reference/harness.md"
        ],
        summary: "Audit the retry and failure-boundary behavior in prepare_images.py before any memo cleanup.",
        tags: ["benchmark", "v4", "harness", "prepare-images"],
        createdAt: "2026-03-30T08:05:00.000Z",
        updatedAt: "2026-03-30T09:31:00.000Z",
        notes: [
          "The handoff left the old memo work in active context, but the sharper resume target is the retry-boundary audit."
        ],
        artifacts: [
          {
            kind: "plan",
            body: "## Scope\n\nAudit retry-boundary handling in `swebench/harness/prepare_images.py`.\n\n## Steps\n\n1. Inspect retry loops and failure exits.\n2. Record the boundary that must stay stable for image preparation.\n3. Only then return to memo cleanup.\n"
          }
        ]
      }
    ],
    sessionLogs: [
      {
        id: "V4P-005-01",
        workId: "C9L4T2",
        timestamp: "2026-03-30T08:12:00.000Z",
        summary: "Kept the legacy image-prep memo open, but did not advance it.",
        status: "WIP",
        changeType: "docs",
        affectedFiles: ["docs/reference/harness.md"],
        nextSteps: "Wait until the real prepare_images audit lands before touching the memo."
      },
      {
        id: "V4P-005-02",
        workId: "D7P2V6",
        timestamp: "2026-03-30T09:31:00.000Z",
        summary: "Paused after isolating the retry-boundary audit in prepare_images.py and left the memo work behind.",
        status: "WIP",
        changeType: "investigation",
        affectedFiles: ["swebench/harness/prepare_images.py"],
        nextSteps: "Resume `D7P2V6` by checking the retry and failure-boundary paths in `swebench/harness/prepare_images.py` before editing any memo or docs."
      }
    ]
  },
  "v4-013": {
    activeContextWorkId: "E5H1S4",
    ambiguityRationale: "Two grading-related works look plausible, but the visible evidence does not establish which one should move next without inventing authority.",
    distractorRationale: "The active-context pointer and neighboring grading scopes both tempt a premature resume decision even though the evidence is not authoritative enough.",
    goal: "Use the codebase snapshot and Tasklog evidence to decide whether any work can be resumed now without guessing.",
    questionTitle: "Abstain when grading evidence does not identify an authoritative resume target",
    scenarioNote: "This pilot fixture checks that the model can abstain when the visible grading evidence is sparse or mutually underdetermined.",
    scenarioTitle: "No authoritative grading target should trigger abstention",
    seedNotes: [
      "The active-context pointer is intentionally weak and should not be treated as automatic authority.",
      "The two grading works remain plausible enough that overconfident guessing would be a bug."
    ],
    task: "Determine whether any unfinished work should be resumed now. If the evidence is insufficient, leave the selected work blank and explain the uncertainty briefly.",
    works: [
      {
        id: "E5H1S4",
        title: "Tighten grading diff-scan heuristics",
        status: "active",
        impact: "high",
        startDirRel: "swebench/harness",
        scopeRelPaths: [
          "swebench/harness/grading.py"
        ],
        summary: "Evaluate whether the diff-scan heuristics in grading.py need one more pass before the next run.",
        tags: ["benchmark", "v4", "grading"],
        createdAt: "2026-03-30T07:50:00.000Z",
        updatedAt: "2026-03-30T08:48:00.000Z",
        notes: [
          "This work may still be the right target, but the handoff does not prove it conclusively."
        ],
        artifacts: [
          {
            kind: "plan",
            body: "## Scope\n\nPotentially revisit the grading diff-scan heuristics in `swebench/harness/grading.py`.\n\n## Risk\n\nDo not resume this work unless the handoff evidence establishes that the heuristics lane still owns the next move.\n"
          }
        ]
      },
      {
        id: "F8Q3L1",
        title: "Refactor grading outcome wording",
        status: "active",
        impact: "medium",
        startDirRel: "swebench/harness",
        scopeRelPaths: [
          "swebench/harness/grading.py",
          "docs/reference/harness.md"
        ],
        summary: "Clean up outcome wording once the grading policy questions settle.",
        tags: ["benchmark", "docs", "grading"],
        createdAt: "2026-03-30T08:02:00.000Z",
        updatedAt: "2026-03-30T08:41:00.000Z",
        notes: [
          "This wording lane is close enough to the grading heuristics work that a rushed resume choice would be unsafe."
        ],
        artifacts: [
          {
            kind: "notes",
            body: "Keep the wording refactor separate from the heuristics lane until ownership is explicit."
          }
        ]
      }
    ],
    sessionLogs: [
      {
        id: "V4P-013-01",
        workId: "E5H1S4",
        timestamp: "2026-03-30T08:48:00.000Z",
        summary: "Stopped after identifying one more possible grading heuristic cleanup, but did not confirm whether this lane or the wording lane owns the next move.",
        status: "WIP",
        changeType: "investigation",
        affectedFiles: ["swebench/harness/grading.py"],
        nextSteps: "Do not guess; confirm which grading lane owns the next move before resuming."
      },
      {
        id: "V4P-013-02",
        workId: "F8Q3L1",
        timestamp: "2026-03-30T08:41:00.000Z",
        summary: "Left the wording cleanup open, but it still depends on the unresolved grading policy boundary.",
        status: "WIP",
        changeType: "docs",
        affectedFiles: ["docs/reference/harness.md"],
        nextSteps: "Wait until the grading policy boundary is explicit before changing wording."
      }
    ]
  },
  "v4-026": {
    activeContextWorkId: "G2T6P8",
    ambiguityRationale: "Two retrieval-related works are both plausible, but one single ownership fact is missing before a safe resume decision can be made.",
    distractorRationale: "Both works share the same repo area and both have fresh logs, so provenance and ownership matter more than surface recency alone.",
    goal: "Use the repo snapshot and Tasklog evidence to decide whether to resume a work now or ask one clarifying question first.",
    questionTitle: "Ask one missing ownership question before resuming the retrieval lane",
    scenarioNote: "This pilot fixture checks that the model can hold off and ask one missing fact when two open retrieval works remain too close to separate safely.",
    scenarioTitle: "Provenance tiebreak requires one clarifying ownership fact",
    seedNotes: [
      "The model should not over-resolve the tie just because one work is in active context.",
      "The missing fact is lane ownership for the next retrieval evaluation window."
    ],
    task: "Determine whether to resume a work now or ask one clarifying question first. Use only the repo snapshot and the Tasklog evidence.",
    works: [
      {
        id: "G2T6P8",
        title: "Audit eval_retrieval metric boundary",
        status: "active",
        impact: "high",
        startDirRel: "swebench/inference/make_datasets",
        scopeRelPaths: [
          "swebench/inference/make_datasets/eval_retrieval.py"
        ],
        summary: "Audit which metric boundary should control the next retrieval evaluation pass in eval_retrieval.py.",
        tags: ["benchmark", "v4", "retrieval"],
        createdAt: "2026-03-30T07:44:00.000Z",
        updatedAt: "2026-03-30T09:05:00.000Z",
        notes: [
          "This may still be the best target, but the handoff never states whether the metrics lane owns the next window."
        ],
        artifacts: [
          {
            kind: "plan",
            body: "## Scope\n\nAudit the metric-boundary handling in `swebench/inference/make_datasets/eval_retrieval.py`.\n\n## Guardrail\n\nDo not resume until lane ownership for the next evaluation window is explicit.\n"
          }
        ]
      },
      {
        id: "H9N4R5",
        title: "Tune retrieval dataset sample size",
        status: "active",
        impact: "medium",
        startDirRel: "swebench/inference/make_datasets",
        scopeRelPaths: [
          "swebench/inference/make_datasets/eval_retrieval.py",
          "swebench/inference/make_datasets/create_text_dataset.py"
        ],
        summary: "Tune the retrieval dataset sample size once it is clear which lane owns the next evaluation window.",
        tags: ["benchmark", "v4", "retrieval", "dataset"],
        createdAt: "2026-03-30T07:58:00.000Z",
        updatedAt: "2026-03-30T09:02:00.000Z",
        notes: [
          "This work is close enough to the metric-boundary audit that a clarifying question is safer than guessing."
        ],
        artifacts: [
          {
            kind: "notes",
            body: "Wait until the next evaluation window owner is explicit before tuning sample size."
          }
        ]
      }
    ],
    sessionLogs: [
      {
        id: "V4P-026-01",
        workId: "G2T6P8",
        timestamp: "2026-03-30T09:05:00.000Z",
        summary: "Paused the eval_retrieval metric-boundary audit because the handoff never says whether the metrics lane owns the next evaluation window.",
        status: "WIP",
        changeType: "investigation",
        affectedFiles: ["swebench/inference/make_datasets/eval_retrieval.py"],
        nextSteps: "Ask who owns the next retrieval evaluation window before resuming this metric-boundary audit."
      },
      {
        id: "V4P-026-02",
        workId: "H9N4R5",
        timestamp: "2026-03-30T09:02:00.000Z",
        summary: "Left the sample-size tuning work open, but it is blocked on the same unresolved evaluation-window ownership question.",
        status: "WIP",
        changeType: "research",
        affectedFiles: ["swebench/inference/make_datasets/create_text_dataset.py"],
        nextSteps: "Wait until the retrieval evaluation window owner is explicit before tuning sample size."
      }
    ]
  },
  "v4-009": {
    activeContextWorkId: "J3K7M2",
    ambiguityRationale: "The correct work is identifiable, but the latest state shows that the next legal action is an escalation rather than a direct code edit.",
    distractorRationale: "A neighboring cleanup task in the same Docker utility area looks resumable, but it skips the required escalation boundary.",
    goal: "Use the repo snapshot and Tasklog evidence to choose the right work and state the next legal step without skipping escalation.",
    questionTitle: "Resume the Docker utility work through escalation, not direct editing",
    scenarioNote: "This fixture checks that the model can keep the right work selected while still respecting an escalation-gated next step.",
    scenarioTitle: "Blocked Docker utility work should resume only through escalation",
    seedNotes: [
      "The resume target is real and current, but the next step is explicitly constrained by an owner escalation.",
      "The distractor work is nearby in scope and could tempt a direct code action."
    ],
    task: "Determine which work should be resumed now, summarize its state, and state the next legal next step using the repo snapshot and Tasklog evidence only.",
    works: [
      {
        id: "J3K7M2",
        title: "Route docker_utils cleanup through container-ops owner review",
        status: "blocked",
        impact: "high",
        startDirRel: "swebench/harness",
        scopeRelPaths: [
          "swebench/harness/docker_utils.py",
          "docs/reference/harness.md"
        ],
        summary: "Prepare the docker_utils cleanup, but only after the container-ops owner confirms the allowed boundary for the next change.",
        tags: ["benchmark", "v4", "docker", "escalation"],
        createdAt: "2026-03-30T08:18:00.000Z",
        updatedAt: "2026-03-30T09:18:00.000Z",
        notes: [
          "The technical target is still docker_utils.py, but the next legal move is owner escalation rather than direct editing."
        ],
        artifacts: [
          {
            kind: "plan",
            body: "## Scope\n\nPrepare the next `swebench/harness/docker_utils.py` cleanup.\n\n## Gate\n\nDo not patch directly until the container-ops owner confirms which cleanup boundary is legal for the next session.\n"
          }
        ]
      },
      {
        id: "K8P4T6",
        title: "Tidy stale harness cleanup notes",
        status: "active",
        impact: "low",
        startDirRel: "docs/reference",
        scopeRelPaths: [
          "docs/reference/harness.md"
        ],
        summary: "Tidy old cleanup notes after the docker utility boundary is confirmed.",
        tags: ["benchmark", "docs", "cleanup"],
        createdAt: "2026-03-30T07:50:00.000Z",
        updatedAt: "2026-03-30T08:47:00.000Z",
        notes: [
          "This memo cleanup is plausible, but it is not the right immediate target."
        ],
        artifacts: [
          {
            kind: "notes",
            body: "Keep the memo cleanup behind the docker utility owner review."
          }
        ]
      }
    ],
    sessionLogs: [
      {
        id: "V4P-009-01",
        workId: "J3K7M2",
        timestamp: "2026-03-30T09:18:00.000Z",
        summary: "Stopped the docker_utils cleanup after confirming the next legal move is to route the boundary through the container-ops owner.",
        status: "WIP",
        changeType: "investigation",
        affectedFiles: ["swebench/harness/docker_utils.py"],
        nextSteps: "Resume `J3K7M2` through escalation by asking the container-ops owner which cleanup boundary is approved before editing `swebench/harness/docker_utils.py`."
      },
      {
        id: "V4P-009-02",
        workId: "K8P4T6",
        timestamp: "2026-03-30T08:47:00.000Z",
        summary: "Left the cleanup memo open, but it still sits behind the owner-reviewed docker utility work.",
        status: "WIP",
        changeType: "docs",
        affectedFiles: ["docs/reference/harness.md"],
        nextSteps: "Wait until the docker utility boundary is approved before editing the memo."
      }
    ]
  },
  "v4-018": {
    activeContextWorkId: "L4R8N1",
    ambiguityRationale: "The retrieval dataset work is probably right, but one concrete ownership fact is missing before a safe resume decision can be finalized.",
    distractorRationale: "A sibling retrieval work shares the same repo area and has similar freshness, which makes one missing fact more important than surface recency.",
    goal: "Use the repo snapshot and Tasklog evidence to decide whether to resume a work now or ask one clarifying question first.",
    questionTitle: "Ask one ownership question before resuming text-dataset creation",
    scenarioNote: "This fixture checks the clarifying-question family in a retrieval dataset authoring path where the missing fact is narrow and actionable.",
    scenarioTitle: "One missing retrieval ownership fact should block direct resume",
    seedNotes: [
      "A single ownership fact is missing: whether the dataset or evaluation lane owns the next retrieval step.",
      "The fixture should not be resolved by guessing from active context alone."
    ],
    task: "Determine whether to resume a work now or ask one clarifying question first. Use only the repo snapshot and the seeded Tasklog evidence.",
    works: [
      {
        id: "L4R8N1",
        title: "Create text-dataset retrieval sample window",
        status: "active",
        impact: "high",
        startDirRel: "swebench/inference/make_datasets",
        scopeRelPaths: [
          "swebench/inference/make_datasets/create_text_dataset.py"
        ],
        summary: "Prepare the next retrieval text-dataset sample window once ownership for the next retrieval lane is explicit.",
        tags: ["benchmark", "v4", "retrieval", "dataset"],
        createdAt: "2026-03-30T08:14:00.000Z",
        updatedAt: "2026-03-30T09:12:00.000Z",
        notes: [
          "This work is likely correct, but the handoff still lacks one ownership fact."
        ],
        artifacts: [
          {
            kind: "plan",
            body: "## Scope\n\nCreate the next retrieval sample window in `swebench/inference/make_datasets/create_text_dataset.py`.\n\n## Guardrail\n\nAsk which lane owns the next retrieval step before resuming if the handoff still leaves ownership unclear.\n"
          }
        ]
      },
      {
        id: "M7Q2P5",
        title: "Tune eval_retrieval follow-up thresholds",
        status: "active",
        impact: "medium",
        startDirRel: "swebench/inference/make_datasets",
        scopeRelPaths: [
          "swebench/inference/make_datasets/eval_retrieval.py"
        ],
        summary: "Tune retrieval thresholds after the next retrieval lane ownership is explicit.",
        tags: ["benchmark", "v4", "retrieval"],
        createdAt: "2026-03-30T08:20:00.000Z",
        updatedAt: "2026-03-30T09:09:00.000Z",
        notes: [
          "This work is plausible enough that a clarifying question is safer than a forced winner."
        ],
        artifacts: [
          {
            kind: "notes",
            body: "Do not outrank the dataset creation lane without the missing ownership fact."
          }
        ]
      }
    ],
    sessionLogs: [
      {
        id: "V4P-018-01",
        workId: "L4R8N1",
        timestamp: "2026-03-30T09:12:00.000Z",
        summary: "Stopped before creating the next text-dataset sample window because the handoff never states whether the dataset lane owns the next retrieval step.",
        status: "WIP",
        changeType: "research",
        affectedFiles: ["swebench/inference/make_datasets/create_text_dataset.py"],
        nextSteps: "Ask whether the dataset lane or the evaluation lane owns the next retrieval step before resuming `L4R8N1`."
      },
      {
        id: "V4P-018-02",
        workId: "M7Q2P5",
        timestamp: "2026-03-30T09:09:00.000Z",
        summary: "Kept the threshold tuning work open, but it depends on the same unresolved retrieval-lane ownership fact.",
        status: "WIP",
        changeType: "investigation",
        affectedFiles: ["swebench/inference/make_datasets/eval_retrieval.py"],
        nextSteps: "Wait until retrieval-lane ownership is explicit before tuning thresholds."
      }
    ]
  },
  "v4-021": {
    activeContextWorkId: "N6V3K8",
    ambiguityRationale: "A finished docs-heavy note cluster looks richer than the real active target, so the model must separate polished done-work artifacts from the true current work.",
    distractorRationale: "The completed note-wrap work has fresher-looking artifacts than the actual docker_build investigation and is designed to lure a shallow resume decision.",
    goal: "Use the repo snapshot and Tasklog evidence to choose the true active work even when a done work has richer artifacts.",
    questionTitle: "Ignore richer done-work artifacts and resume the docker_build investigation",
    scenarioNote: "This fixture checks whether the model can avoid letting a polished done-work artifact outrank the real active docker_build task.",
    scenarioTitle: "Artifact-rich done work should not beat the live docker_build target",
    seedNotes: [
      "The done work is intentionally artifact-heavy and more polished than the active code path.",
      "The correct target remains an active docker_build investigation."
    ],
    task: "Determine which work should be resumed now, summarize its state, and state the next concrete step using the repo snapshot and Tasklog evidence only.",
    works: [
      {
        id: "N6V3K8",
        title: "Audit docker_build cache-boundary behavior",
        status: "active",
        impact: "high",
        startDirRel: "swebench/harness",
        scopeRelPaths: [
          "swebench/harness/docker_build.py"
        ],
        summary: "Audit the cache-boundary behavior in docker_build.py before reopening any appendix or summary work.",
        tags: ["benchmark", "v4", "docker-build"],
        createdAt: "2026-03-30T08:07:00.000Z",
        updatedAt: "2026-03-30T09:28:00.000Z",
        notes: [
          "The artifact-heavy wrap work is done and should not outrank this still-live docker_build audit."
        ],
        artifacts: [
          {
            kind: "plan",
            body: "## Scope\n\nAudit the cache-boundary logic in `swebench/harness/docker_build.py`.\n\n## Steps\n\n1. Inspect cache key branching.\n2. Record the exact boundary that must remain stable.\n3. Only then reopen any docs or appendix work.\n"
          }
        ]
      },
      {
        id: "P2X9D4",
        title: "Wrap appendix note for prior Docker findings",
        status: "done",
        impact: "low",
        startDirRel: "docs/reference",
        scopeRelPaths: [
          "docs/reference/harness.md"
        ],
        summary: "Wrapped the appendix note for the last Docker findings pass.",
        tags: ["benchmark", "docs", "done-work"],
        createdAt: "2026-03-29T18:30:00.000Z",
        updatedAt: "2026-03-30T09:20:00.000Z",
        notes: [
          "This work is complete and exists mainly as a polished distractor."
        ],
        artifacts: [
          {
            kind: "summary",
            body: "The appendix wrap is finished. It should not be resumed again unless a later round creates new evidence."
          },
          {
            kind: "design",
            body: "The appendix note intentionally preserves the prior Docker findings in a reader-facing form."
          }
        ]
      }
    ],
    sessionLogs: [
      {
        id: "V4P-021-01",
        workId: "P2X9D4",
        timestamp: "2026-03-30T09:20:00.000Z",
        summary: "Finished the appendix note wrap and handed control back to the docker_build cache-boundary audit.",
        status: "Done",
        changeType: "docs",
        affectedFiles: ["docs/reference/harness.md"],
        nextSteps: "Do not resume this done work; return to the live docker_build audit."
      },
      {
        id: "V4P-021-02",
        workId: "N6V3K8",
        timestamp: "2026-03-30T09:28:00.000Z",
        summary: "Paused the docker_build audit after isolating the cache-boundary branch that still needs one more pass.",
        status: "WIP",
        changeType: "investigation",
        affectedFiles: ["swebench/harness/docker_build.py"],
        nextSteps: "Resume `N6V3K8` by tracing the cache-boundary branch in `swebench/harness/docker_build.py` before touching any docs or appendix artifacts."
      }
    ]
  },
  "v4-030": {
    activeContextWorkId: "Q5M1T7",
    ambiguityRationale: "The correct work is identifiable, but the next step is constrained by sequence and review boundary rather than raw availability of code to edit.",
    distractorRationale: "A tempting code-first action exists in the same tokenization file, but the next legal move still has to respect the review order frozen in the logs.",
    goal: "Use the repo snapshot and Tasklog evidence to identify the right work and the correct constrained next step.",
    questionTitle: "Resume tokenize_dataset work with the review boundary intact",
    scenarioNote: "This fixture checks the state-constrained next-step family on a tokenization workflow where sequence matters more than eagerness to patch code.",
    scenarioTitle: "Correct work is clear, but the next step must respect the tokenization review order",
    seedNotes: [
      "The resume target is not ambiguous, but the immediate next step is order-constrained.",
      "The fixture should reward respecting the review boundary rather than jumping to edits."
    ],
    task: "Determine which work should be resumed now, summarize its state, and state the correct next concrete step using only the repo snapshot and Tasklog evidence.",
    works: [
      {
        id: "Q5M1T7",
        title: "Freeze tokenize_dataset review boundary before edits",
        status: "active",
        impact: "high",
        startDirRel: "swebench/inference/make_datasets",
        scopeRelPaths: [
          "swebench/inference/make_datasets/tokenize_dataset.py"
        ],
        summary: "Freeze the tokenization review boundary before making the next direct change in tokenize_dataset.py.",
        tags: ["benchmark", "v4", "tokenize-dataset"],
        createdAt: "2026-03-30T08:22:00.000Z",
        updatedAt: "2026-03-30T09:36:00.000Z",
        notes: [
          "The next session should not jump straight into code edits; the review boundary still needs one explicit pass."
        ],
        artifacts: [
          {
            kind: "plan",
            body: "## Scope\n\nFreeze the review boundary for `swebench/inference/make_datasets/tokenize_dataset.py`.\n\n## Steps\n\n1. Re-read the tokenization review notes.\n2. Confirm the exact boundary that is allowed to change.\n3. Only then patch the implementation.\n"
          }
        ]
      },
      {
        id: "R1D8L3",
        title: "Quick tokenization cleanup patch",
        status: "planned",
        impact: "medium",
        startDirRel: "swebench/inference/make_datasets",
        scopeRelPaths: [
          "swebench/inference/make_datasets/tokenize_dataset.py"
        ],
        summary: "Apply a small tokenization cleanup patch once the review boundary is frozen.",
        tags: ["benchmark", "planned", "tokenize-dataset"],
        createdAt: "2026-03-30T08:30:00.000Z",
        updatedAt: "2026-03-30T09:10:00.000Z",
        notes: [
          "This planned patch is tempting, but it is out of order before the review boundary freeze."
        ],
        artifacts: [
          {
            kind: "notes",
            body: "Do not apply the quick patch before the review boundary is frozen."
          }
        ]
      }
    ],
    sessionLogs: [
      {
        id: "V4P-030-01",
        workId: "Q5M1T7",
        timestamp: "2026-03-30T09:36:00.000Z",
        summary: "Stopped the tokenize_dataset work after confirming one explicit review-boundary pass still has to happen before code edits.",
        status: "WIP",
        changeType: "investigation",
        affectedFiles: ["swebench/inference/make_datasets/tokenize_dataset.py"],
        nextSteps: "Resume `Q5M1T7` by re-reading the tokenization review notes and freezing the allowed change boundary before patching `swebench/inference/make_datasets/tokenize_dataset.py`."
      },
      {
        id: "V4P-030-02",
        workId: "R1D8L3",
        timestamp: "2026-03-30T09:10:00.000Z",
        summary: "Left the quick cleanup patch planned, but it remains out of order until the review boundary is explicit.",
        status: "WIP",
        changeType: "feature",
        affectedFiles: ["swebench/inference/make_datasets/tokenize_dataset.py"],
        nextSteps: "Wait until the review boundary is frozen before applying the quick cleanup patch."
      }
    ]
  }
};

function fixtureNumber(fixtureId: string): string {
  return fixtureId.split("-")[1] ?? "000";
}

function makeWorkId(fixtureId: string, suffix: "A" | "B"): string {
  return `V4${fixtureNumber(fixtureId)}${suffix}`;
}

function humanizeArea(sourceArea: string): string {
  return sourceArea.replace(/_/g, " ");
}

function genericSourceScope(source: SourcePoolCandidate): string {
  return source.source_rel_paths[0] ?? `${source.source_area}/unknown`;
}

function genericSummaryPrefix(source: SourcePoolCandidate): string {
  return `${source.source_title} in ${genericSourceScope(source)}`;
}

function genericArtifacts(kind: WorkDocKind, body: string): WorkArtifact[] {
  return [{ kind, body }];
}

function buildGeneratedScenarioSeed(allocation: AllocationFixture, source: SourcePoolCandidate): ScenarioSeed {
  const mainPath = genericSourceScope(source);
  const area = humanizeArea(source.source_area);
  const fixtureIndex = Number(fixtureNumber(allocation.fixture_id));
  const createdMinute = String((fixtureIndex * 3) % 60).padStart(2, "0");
  const primaryMinute = String((fixtureIndex * 5) % 60).padStart(2, "0");
  const secondaryMinute = String((fixtureIndex * 7 + 11) % 60).padStart(2, "0");
  const primaryWorkId = makeWorkId(allocation.fixture_id, "A");
  const secondaryWorkId = makeWorkId(allocation.fixture_id, "B");
  const baseCreatedAt = `2026-03-30T08:${createdMinute}:00.000Z`;
  const primaryUpdatedAt = `2026-03-30T09:${primaryMinute}:00.000Z`;
  const secondaryUpdatedAt = `2026-03-30T08:${secondaryMinute}:00.000Z`;
  const primaryDifficultyPhrase = allocation.difficulty === "hard" ? "one more careful pass" : "a focused follow-up pass";
  const escalationNextStep = `Resume \`${primaryWorkId}\` through escalation by asking the owning reviewer to confirm the allowed boundary before editing \`${mainPath}\`.`;
  const directNextStep = `Resume \`${primaryWorkId}\` by reviewing \`${mainPath}\` and freezing the next concrete boundary before broader follow-up work.`;
  const constrainedNextStep = `Resume \`${primaryWorkId}\` by re-reading the frozen notes for \`${mainPath}\` and confirming the next allowed boundary before patching code.`;

  switch (allocation.family_id) {
    case "authoritative_log_overrides_note":
      return {
        activeContextWorkId: primaryWorkId,
        ambiguityRationale: "An older broad note suggests a wider follow-up, but the latest structured log narrows the real next step to the sharper source-backed boundary.",
        distractorRationale: "The broader note work looks related and plausible, but it is intentionally less authoritative than the newest structured log.",
        goal: "Use the repo snapshot and Tasklog evidence to identify which unfinished work should be resumed and what the next concrete step is.",
        questionTitle: `Prefer the sharper ${source.source_title} handoff over the older broad note`,
        scenarioNote: `This generated fixture checks whether the model can let the latest structured log control the resume decision for ${genericSummaryPrefix(source)}.`,
        scenarioTitle: `Latest structured handoff should control ${source.source_title}`,
        seedNotes: [
          "The older broad note is intentionally real but stale.",
          `The sharper structured log points directly at ${mainPath}.`
        ],
        task: "Determine which unfinished work should be resumed now, summarize its current state, and state the next concrete step.",
        works: [
          {
            id: primaryWorkId,
            title: `Freeze ${source.source_title} handoff boundary`,
            status: allocation.primary_decision_mode === "resume_blocked_with_escalation" ? "blocked" : "active",
            impact: "high",
            startDirRel: mainPath,
            scopeRelPaths: source.source_rel_paths,
            summary: `Narrow the next step for ${genericSummaryPrefix(source)} before any broader ${area} refresh.`,
            tags: ["benchmark", "v4", "generated", source.source_area],
            createdAt: baseCreatedAt,
            updatedAt: primaryUpdatedAt,
            notes: [
              `The current resume target is the sharper ${source.source_title} handoff, not the older broad ${area} note.`
            ],
            artifacts: genericArtifacts("plan", `## Scope\n\nFreeze the next-step boundary for \`${mainPath}\`.\n\n## Steps\n\n1. Review the current boundary in the source file.\n2. Record the exact allowed next change.\n3. Only then reopen any broader ${area} follow-up.\n`)
          },
          {
            id: secondaryWorkId,
            title: `Refresh broad ${area} follow-up note`,
            status: "planned",
            impact: "low",
            startDirRel: mainPath,
            scopeRelPaths: [mainPath],
            summary: `Refresh the broad ${area} note only after the sharper ${source.source_title} boundary is frozen.`,
            tags: ["benchmark", "generated", "distractor"],
            createdAt: baseCreatedAt,
            updatedAt: secondaryUpdatedAt,
            notes: [
              "This broader note is intentionally related but should not outrank the sharper structured handoff."
            ],
            artifacts: genericArtifacts("notes", `Keep the broad ${area} note behind the sharper source-backed handoff.`)
          }
        ],
        sessionLogs: [
          {
            id: `${allocation.fixture_id}-01`,
            workId: primaryWorkId,
            timestamp: primaryUpdatedAt,
            summary: `Narrowed the work to ${mainPath} and stopped before broadening scope.`,
            status: "WIP",
            changeType: "investigation",
            affectedFiles: [mainPath],
            nextSteps: allocation.primary_decision_mode === "resume_blocked_with_escalation" ? escalationNextStep : directNextStep
          },
          {
            id: `${allocation.fixture_id}-02`,
            workId: secondaryWorkId,
            timestamp: secondaryUpdatedAt,
            summary: `Left the broad ${area} note open, but queued it behind the sharper handoff work.`,
            status: "WIP",
            changeType: "docs",
            affectedFiles: [mainPath],
            nextSteps: `Wait until the sharper ${source.source_title} boundary is frozen before expanding the note.`
          }
        ]
      };
    case "stale_active_context_must_be_ignored":
      return {
        activeContextWorkId: secondaryWorkId,
        ambiguityRationale: "The visible active context is stale and should not control by itself; the fresher log-backed work carries the real signal.",
        distractorRationale: "The stale active-context work is intentionally plausible and close in scope to the real target.",
        goal: "Use the repo snapshot and Tasklog evidence to identify the actual resume target even if active context is stale.",
        questionTitle: `Ignore stale active context and recover the fresher ${source.source_title} target`,
        scenarioNote: `This generated fixture checks whether stale active context can be demoted in favor of fresher evidence around ${genericSummaryPrefix(source)}.`,
        scenarioTitle: `Stale active context should not beat the fresher ${source.source_title} handoff`,
        seedNotes: [
          "The active-context pointer is intentionally stale.",
          "The fresher log-backed target is in the same general code area."
        ],
        task: "Determine which work should be resumed now, summarize its state, and state the next concrete step without treating active context as automatic authority.",
        works: [
          {
            id: primaryWorkId,
            title: `Resume ${source.source_title} follow-up`,
            status: allocation.primary_decision_mode === "resume_blocked_with_escalation" ? "blocked" : "active",
            impact: "high",
            startDirRel: mainPath,
            scopeRelPaths: source.source_rel_paths,
            summary: `Continue the fresher ${source.source_title} follow-up in ${mainPath}.`,
            tags: ["benchmark", "v4", "generated", source.source_area],
            createdAt: baseCreatedAt,
            updatedAt: primaryUpdatedAt,
            notes: [
              `This is the fresher target tied directly to ${mainPath}.`
            ],
            artifacts: genericArtifacts("plan", `## Scope\n\nContinue the fresher follow-up in \`${mainPath}\`.\n\n## Guardrail\n\nDo not let stale active context outrank the newest structured log.\n`)
          },
          {
            id: secondaryWorkId,
            title: `Refresh stale ${area} memo`,
            status: "active",
            impact: "medium",
            startDirRel: mainPath,
            scopeRelPaths: [mainPath],
            summary: `Tidy an older ${area} memo that was left in active context by accident.`,
            tags: ["benchmark", "generated", "stale-active-context"],
            createdAt: baseCreatedAt,
            updatedAt: secondaryUpdatedAt,
            notes: [
              "This work was left in active context intentionally as a stale signal."
            ],
            artifacts: genericArtifacts("notes", `This memo is stale and should not control if fresher evidence exists.`)
          }
        ],
        sessionLogs: [
          {
            id: `${allocation.fixture_id}-01`,
            workId: primaryWorkId,
            timestamp: primaryUpdatedAt,
            summary: allocation.primary_decision_mode === "abstain_insufficient_evidence"
              ? `Found a fresher ${source.source_title} lead in ${mainPath}, but the handoff still leaves one critical ownership gap unresolved.`
              : `Paused after isolating the fresher ${source.source_title} follow-up in ${mainPath}.`,
            status: "WIP",
            changeType: "investigation",
            affectedFiles: [mainPath],
            nextSteps: allocation.primary_decision_mode === "abstain_insufficient_evidence"
              ? `Do not guess; first confirm who owns the next ${area} move around \`${mainPath}\` after ignoring stale active context.`
              : allocation.primary_decision_mode === "resume_blocked_with_escalation"
                ? escalationNextStep
                : directNextStep
          },
          {
            id: `${allocation.fixture_id}-02`,
            workId: secondaryWorkId,
            timestamp: secondaryUpdatedAt,
            summary: `Left the stale ${area} memo in active context even though the fresher work moved elsewhere.`,
            status: "WIP",
            changeType: "docs",
            affectedFiles: [mainPath],
            nextSteps: `Do not treat this stale active-context memo as controlling evidence.`
          }
        ]
      };
    case "blocked_work_requires_escalation":
      return {
        activeContextWorkId: primaryWorkId,
        ambiguityRationale: "The correct work is identifiable, but the next legal action is an escalation rather than a direct patch.",
        distractorRationale: "A nearby cleanup or notes task makes a direct move look tempting, but it would skip the escalation gate.",
        goal: "Identify the correct work and state the next legal step without skipping required escalation.",
        questionTitle: `Resume ${source.source_title} only through escalation`,
        scenarioNote: `This generated fixture checks the escalation-gated family on ${genericSummaryPrefix(source)}.`,
        scenarioTitle: `The ${source.source_title} work is current, but the next step is escalation`,
        seedNotes: [
          "The technical target is current and real.",
          "The next step is intentionally escalation-gated."
        ],
        task: "Determine which work should be resumed now, summarize its state, and state the next legal next step.",
        works: [
          {
            id: primaryWorkId,
            title: `Route ${source.source_title} change through owner review`,
            status: "blocked",
            impact: "high",
            startDirRel: mainPath,
            scopeRelPaths: source.source_rel_paths,
            summary: `Prepare the next change in ${mainPath}, but only after the owning reviewer confirms the allowed boundary.`,
            tags: ["benchmark", "v4", "generated", "escalation"],
            createdAt: baseCreatedAt,
            updatedAt: primaryUpdatedAt,
            notes: ["The work is correct, but the next legal move is owner escalation."],
            artifacts: genericArtifacts("plan", `## Scope\n\nPrepare the next change in \`${mainPath}\`.\n\n## Gate\n\nDo not patch directly before the owner approves the allowed boundary.\n`)
          },
          {
            id: secondaryWorkId,
            title: `Tidy related ${area} notes`,
            status: "active",
            impact: "low",
            startDirRel: mainPath,
            scopeRelPaths: [mainPath],
            summary: `Tidy related ${area} notes after the escalation-gated source work moves.`,
            tags: ["benchmark", "generated", "distractor"],
            createdAt: baseCreatedAt,
            updatedAt: secondaryUpdatedAt,
            notes: ["This nearby work should not outrank the blocked escalation-gated target."],
            artifacts: genericArtifacts("notes", `Keep the related note cleanup behind the owner-reviewed source work.`)
          }
        ],
        sessionLogs: [
          {
            id: `${allocation.fixture_id}-01`,
            workId: primaryWorkId,
            timestamp: primaryUpdatedAt,
            summary: `Stopped the ${source.source_title} work after confirming the next legal action is owner escalation, not a direct edit.`,
            status: "WIP",
            changeType: "investigation",
            affectedFiles: [mainPath],
            nextSteps: escalationNextStep
          },
          {
            id: `${allocation.fixture_id}-02`,
            workId: secondaryWorkId,
            timestamp: secondaryUpdatedAt,
            summary: `Left the nearby ${area} note cleanup open, but it still sits behind the escalation-gated source work.`,
            status: "WIP",
            changeType: "docs",
            affectedFiles: [mainPath],
            nextSteps: `Wait until the escalation-gated source work is cleared before returning to this note cleanup.`
          }
        ]
      };
    case "abstain_when_no_authoritative_source":
      return {
        activeContextWorkId: primaryWorkId,
        ambiguityRationale: "Multiple plausible works remain open, but the visible evidence does not identify an authoritative winner.",
        distractorRationale: "Both works are intentionally close enough in freshness and scope that guessing would be unsafe.",
        goal: "Use the repo snapshot and Tasklog evidence to decide whether any work can be resumed now without guessing.",
        questionTitle: `Abstain when ${source.source_title} evidence is not authoritative enough`,
        scenarioNote: `This generated fixture checks abstention on ${genericSummaryPrefix(source)} when the visible evidence remains underdetermined.`,
        scenarioTitle: `No authoritative winner should emerge around ${source.source_title}`,
        seedNotes: [
          "The active-context pointer is intentionally weak.",
          "The visible evidence should not force a winner without overreach."
        ],
        task: "Determine whether any unfinished work should be resumed now. If the evidence is insufficient, leave the selected work blank.",
        works: [
          {
            id: primaryWorkId,
            title: `Revisit ${source.source_title} boundary`,
            status: "active",
            impact: "high",
            startDirRel: mainPath,
            scopeRelPaths: source.source_rel_paths,
            summary: `Possibly revisit the ${source.source_title} boundary in ${mainPath}, but only if later evidence confirms ownership.`,
            tags: ["benchmark", "v4", "generated", source.source_area],
            createdAt: baseCreatedAt,
            updatedAt: primaryUpdatedAt,
            notes: ["This work may be right, but the evidence is intentionally insufficient."],
            artifacts: genericArtifacts("plan", `## Scope\n\nPotentially revisit \`${mainPath}\`.\n\n## Guardrail\n\nDo not resume unless later evidence clearly identifies this as the controlling lane.\n`)
          },
          {
            id: secondaryWorkId,
            title: `Refine neighboring ${area} wording`,
            status: "active",
            impact: "medium",
            startDirRel: mainPath,
            scopeRelPaths: [mainPath],
            summary: `Refine neighboring ${area} wording once it is clear which lane actually owns the next move.`,
            tags: ["benchmark", "generated", "ambiguous"],
            createdAt: baseCreatedAt,
            updatedAt: secondaryUpdatedAt,
            notes: ["This neighboring work is plausible enough to prevent a confident resume choice."],
            artifacts: genericArtifacts("notes", `Do not let this neighboring work win automatically; the fixture is meant to remain underdetermined.`)
          }
        ],
        sessionLogs: [
          {
            id: `${allocation.fixture_id}-01`,
            workId: primaryWorkId,
            timestamp: primaryUpdatedAt,
            summary: `Stopped after identifying a possible ${source.source_title} follow-up, but the handoff never establishes that this lane owns the next move.`,
            status: "WIP",
            changeType: "investigation",
            affectedFiles: [mainPath],
            nextSteps: `Do not guess; confirm which ${area} lane owns the next move before resuming any work around \`${mainPath}\`.`
          },
          {
            id: `${allocation.fixture_id}-02`,
            workId: secondaryWorkId,
            timestamp: secondaryUpdatedAt,
            summary: `Left the neighboring ${area} wording work open, but it depends on the same unresolved ownership question.`,
            status: "WIP",
            changeType: "docs",
            affectedFiles: [mainPath],
            nextSteps: `Wait until the ownership question is explicit before changing this neighboring work.`
          }
        ]
      };
    case "ask_single_missing_fact_before_resume":
      return {
        activeContextWorkId: primaryWorkId,
        ambiguityRationale: "One work is probably right, but one narrow fact is still missing before a safe resume decision can be finalized.",
        distractorRationale: "A sibling work remains plausible enough that asking one question is better than forcing a winner.",
        goal: "Use the repo snapshot and Tasklog evidence to decide whether to resume a work now or ask one clarifying question first.",
        questionTitle: `Ask one missing fact before resuming ${source.source_title}`,
        scenarioNote: `This generated fixture checks the single-missing-fact family on ${genericSummaryPrefix(source)}.`,
        scenarioTitle: `One missing fact should block direct resume for ${source.source_title}`,
        seedNotes: [
          "The fixture is meant to hinge on one narrow missing ownership or sequencing fact.",
          "Do not over-resolve the tie from surface recency alone."
        ],
        task: "Determine whether to resume a work now or ask one clarifying question first. Use only the repo snapshot and seeded Tasklog evidence.",
        works: [
          {
            id: primaryWorkId,
            title: `Continue ${source.source_title} follow-up`,
            status: "active",
            impact: "high",
            startDirRel: mainPath,
            scopeRelPaths: source.source_rel_paths,
            summary: `Continue the ${source.source_title} follow-up in ${mainPath} once one missing fact is confirmed.`,
            tags: ["benchmark", "v4", "generated", source.source_area],
            createdAt: baseCreatedAt,
            updatedAt: primaryUpdatedAt,
            notes: ["This is probably the target, but the handoff still lacks one narrow fact."],
            artifacts: genericArtifacts("plan", `## Scope\n\nContinue the follow-up in \`${mainPath}\`.\n\n## Guardrail\n\nAsk the one missing ownership or sequencing fact before resuming if the handoff still leaves it unresolved.\n`)
          },
          {
            id: secondaryWorkId,
            title: `Tune neighboring ${area} follow-up`,
            status: "active",
            impact: "medium",
            startDirRel: mainPath,
            scopeRelPaths: [mainPath],
            summary: `Tune a neighboring ${area} follow-up once the same missing fact is resolved.`,
            tags: ["benchmark", "generated", "clarifying"],
            createdAt: baseCreatedAt,
            updatedAt: secondaryUpdatedAt,
            notes: ["This nearby work is plausible enough that a clarifying question is safer than guessing."],
            artifacts: genericArtifacts("notes", `Keep this neighboring work behind the missing ownership fact.`)
          }
        ],
        sessionLogs: [
          {
            id: `${allocation.fixture_id}-01`,
            workId: primaryWorkId,
            timestamp: primaryUpdatedAt,
            summary: `Stopped before advancing ${source.source_title} because one missing ${area} fact still controls the next move.`,
            status: "WIP",
            changeType: "research",
            affectedFiles: [mainPath],
            nextSteps: `Ask who owns the next ${area} step around \`${mainPath}\` before resuming \`${primaryWorkId}\`.`
          },
          {
            id: `${allocation.fixture_id}-02`,
            workId: secondaryWorkId,
            timestamp: secondaryUpdatedAt,
            summary: `Kept the neighboring ${area} work open, but it depends on the same unresolved fact.`,
            status: "WIP",
            changeType: "investigation",
            affectedFiles: [mainPath],
            nextSteps: `Wait until the missing ${area} fact is resolved before advancing this neighboring work.`
          }
        ]
      };
    case "done_work_noise_vs_true_active_signal":
      return {
        activeContextWorkId: primaryWorkId,
        ambiguityRationale: "A richer done-work artifact cluster sits nearby and can look more authoritative than the true live target.",
        distractorRationale: "The completed work is intentionally polished and artifact-heavy to test whether done work can be demoted correctly.",
        goal: "Use the repo snapshot and Tasklog evidence to separate richer done-work artifacts from the true active target.",
        questionTitle: `Do not let richer done-work artifacts beat ${source.source_title}`,
        scenarioNote: `This generated fixture checks whether active work around ${genericSummaryPrefix(source)} can outrank polished done-work noise.`,
        scenarioTitle: `Done-work noise should not outrank the live ${source.source_title} target`,
        seedNotes: [
          "The done work is intentionally richer in artifacts than the active work.",
          "The real target remains the active source-backed work."
        ],
        task: "Determine which work should be resumed now, summarize its state, and state the next concrete step using the repo snapshot and Tasklog evidence only.",
        works: [
          {
            id: primaryWorkId,
            title: `Audit live ${source.source_title} boundary`,
            status: "active",
            impact: "high",
            startDirRel: mainPath,
            scopeRelPaths: source.source_rel_paths,
            summary: `Audit the live ${source.source_title} boundary in ${mainPath} before reopening any note-wrap or summary work.`,
            tags: ["benchmark", "v4", "generated", source.source_area],
            createdAt: baseCreatedAt,
            updatedAt: primaryUpdatedAt,
            notes: ["The live source-backed work should outrank the richer done-work artifacts."],
            artifacts: genericArtifacts("plan", `## Scope\n\nAudit the live boundary in \`${mainPath}\`.\n\n## Steps\n\n1. Revisit the current source-backed boundary.\n2. Record the next allowed move.\n3. Only then reopen any done-work artifacts.\n`)
          },
          {
            id: secondaryWorkId,
            title: `Wrap finished ${area} appendix note`,
            status: "done",
            impact: "low",
            startDirRel: mainPath,
            scopeRelPaths: [mainPath],
            summary: `Wrapped the finished ${area} note for the prior pass.`,
            tags: ["benchmark", "generated", "done-work"],
            createdAt: baseCreatedAt,
            updatedAt: secondaryUpdatedAt,
            notes: ["This done work is complete and exists mainly as a polished distractor."],
            artifacts: [
              { kind: "summary", body: `The finished ${area} note wrap is complete and should not be resumed again.` },
              { kind: "design", body: `This done-work artifact intentionally looks polished to test demotion of finished work.` }
            ]
          }
        ],
        sessionLogs: [
          {
            id: `${allocation.fixture_id}-01`,
            workId: secondaryWorkId,
            timestamp: secondaryUpdatedAt,
            summary: `Finished the ${area} note wrap and handed control back to the live source-backed work.`,
            status: "Done",
            changeType: "docs",
            affectedFiles: [mainPath],
            nextSteps: `Do not resume this done work; return to the live source-backed work in \`${mainPath}\`.`
          },
          {
            id: `${allocation.fixture_id}-02`,
            workId: primaryWorkId,
            timestamp: primaryUpdatedAt,
            summary: allocation.primary_decision_mode === "abstain_insufficient_evidence"
              ? `Stopped the live ${source.source_title} audit after finding one unresolved ownership gap that still blocks a safe resume choice.`
              : `Paused the live ${source.source_title} audit after isolating ${primaryDifficultyPhrase}.`,
            status: "WIP",
            changeType: "investigation",
            affectedFiles: [mainPath],
            nextSteps: allocation.primary_decision_mode === "abstain_insufficient_evidence"
              ? `Do not guess; confirm whether the live ${area} work still owns the next move before resuming anything around \`${mainPath}\`.`
              : directNextStep
          }
        ]
      };
    case "provenance_tiebreak_between_open_works":
      return {
        activeContextWorkId: primaryWorkId,
        ambiguityRationale: "Two open works remain plausible, so provenance, recency, or one missing fact must break the tie.",
        distractorRationale: "The distractor work intentionally shares nearby scope and freshness with the source-backed target.",
        goal: "Use the repo snapshot and Tasklog evidence to break a tie between open works, or ask one question if the tie still stands.",
        questionTitle: `Use provenance to break the tie around ${source.source_title}`,
        scenarioNote: `This generated fixture checks provenance-sensitive tiebreak behavior on ${genericSummaryPrefix(source)}.`,
        scenarioTitle: `Two open works stay close around ${source.source_title}`,
        seedNotes: [
          "The open works are intentionally close in freshness and scope.",
          "The fixture should reward provenance-sensitive tiebreaking rather than shallow recency only."
        ],
        task: "Determine whether one unfinished work should be resumed now or whether one clarifying question is still required.",
        works: [
          {
            id: primaryWorkId,
            title: `Continue source-backed ${source.source_title} lane`,
            status: "active",
            impact: "high",
            startDirRel: mainPath,
            scopeRelPaths: source.source_rel_paths,
            summary: `Continue the source-backed ${source.source_title} lane in ${mainPath}.`,
            tags: ["benchmark", "v4", "generated", source.source_area],
            createdAt: baseCreatedAt,
            updatedAt: primaryUpdatedAt,
            notes: ["This work is intended to be the provenance-sensitive target unless the fixture is authored as a clarifying or abstention case."],
            artifacts: genericArtifacts("plan", `## Scope\n\nContinue the source-backed lane in \`${mainPath}\`.\n\n## Guardrail\n\nUse provenance or the single missing fact to break ties; do not rely on broad similarity alone.\n`)
          },
          {
            id: secondaryWorkId,
            title: `Advance neighboring ${area} lane`,
            status: "active",
            impact: "medium",
            startDirRel: mainPath,
            scopeRelPaths: [mainPath],
            summary: `Advance a neighboring ${area} lane once provenance or ownership makes the next move explicit.`,
            tags: ["benchmark", "generated", "tiebreak"],
            createdAt: baseCreatedAt,
            updatedAt: secondaryUpdatedAt,
            notes: ["This neighboring lane is intentionally close enough to force a tiebreak."],
            artifacts: genericArtifacts("notes", `This neighboring lane should stay plausible enough to require provenance-sensitive reasoning.`)
          }
        ],
        sessionLogs: [
          {
            id: `${allocation.fixture_id}-01`,
            workId: primaryWorkId,
            timestamp: primaryUpdatedAt,
            summary: allocation.primary_decision_mode === "ask_clarifying_question"
              ? `Paused the source-backed ${source.source_title} lane because one ownership fact still prevents a safe tiebreak.`
              : allocation.primary_decision_mode === "abstain_insufficient_evidence"
                ? `Stopped after narrowing the likely target, but the visible provenance still does not justify a safe winner.`
                : `Narrowed the tie toward the source-backed ${source.source_title} lane in ${mainPath}.`,
            status: "WIP",
            changeType: "investigation",
            affectedFiles: [mainPath],
            nextSteps: allocation.primary_decision_mode === "ask_clarifying_question"
              ? `Ask who owns the next ${area} move around \`${mainPath}\` before resuming either open work.`
              : allocation.primary_decision_mode === "abstain_insufficient_evidence"
                ? `Do not guess; the visible provenance still does not justify a safe winner around \`${mainPath}\`.`
                : directNextStep
          },
          {
            id: `${allocation.fixture_id}-02`,
            workId: secondaryWorkId,
            timestamp: secondaryUpdatedAt,
            summary: `Kept the neighboring ${area} lane open so the tiebreak still requires provenance-sensitive reasoning.`,
            status: "WIP",
            changeType: "research",
            affectedFiles: [mainPath],
            nextSteps: `Wait until provenance or ownership clearly breaks the tie before advancing this neighboring lane.`
          }
        ]
      };
    case "resume_with_state_constrained_next_step":
      return {
        activeContextWorkId: primaryWorkId,
        ambiguityRationale: "The correct work is clear, but the next step is constrained by order, review boundary, or escalation state.",
        distractorRationale: "A tempting code-first move exists nearby, but it is intentionally out of order.",
        goal: "Use the repo snapshot and Tasklog evidence to identify the right work and the correct constrained next step.",
        questionTitle: `Respect the next-step boundary for ${source.source_title}`,
        scenarioNote: `This generated fixture checks next-step constraint handling on ${genericSummaryPrefix(source)}.`,
        scenarioTitle: `Correct work is clear, but the next step is constrained for ${source.source_title}`,
        seedNotes: [
          "The resume target is intentionally clear.",
          "The immediate next step is constrained by order or review state rather than code availability."
        ],
        task: "Determine which work should be resumed now, summarize its state, and state the correct next concrete step.",
        works: [
          {
            id: primaryWorkId,
            title: `Freeze ${source.source_title} next-step boundary`,
            status: allocation.primary_decision_mode === "resume_blocked_with_escalation" ? "blocked" : "active",
            impact: "high",
            startDirRel: mainPath,
            scopeRelPaths: source.source_rel_paths,
            summary: `Freeze the next-step boundary around ${genericSummaryPrefix(source)} before any direct patch sequence broadens.`,
            tags: ["benchmark", "v4", "generated", source.source_area],
            createdAt: baseCreatedAt,
            updatedAt: primaryUpdatedAt,
            notes: ["The work is clear, but the immediate next step is order-constrained."],
            artifacts: genericArtifacts("plan", `## Scope\n\nFreeze the next-step boundary for \`${mainPath}\`.\n\n## Steps\n\n1. Re-read the frozen notes.\n2. Confirm the allowed next boundary.\n3. Only then patch code or broaden scope.\n`)
          },
          {
            id: secondaryWorkId,
            title: `Apply quick ${area} cleanup patch`,
            status: "planned",
            impact: "medium",
            startDirRel: mainPath,
            scopeRelPaths: [mainPath],
            summary: `Apply a quick ${area} cleanup only after the next-step boundary is frozen.`,
            tags: ["benchmark", "generated", "out-of-order"],
            createdAt: baseCreatedAt,
            updatedAt: secondaryUpdatedAt,
            notes: ["This quick patch is intentionally tempting but out of order."],
            artifacts: genericArtifacts("notes", `Do not apply the quick cleanup before the next-step boundary is frozen.`)
          }
        ],
        sessionLogs: [
          {
            id: `${allocation.fixture_id}-01`,
            workId: primaryWorkId,
            timestamp: primaryUpdatedAt,
            summary: `Stopped the ${source.source_title} work after confirming ${primaryDifficultyPhrase} still has to happen before code edits.`,
            status: "WIP",
            changeType: "investigation",
            affectedFiles: [mainPath],
            nextSteps: allocation.primary_decision_mode === "resume_blocked_with_escalation" ? escalationNextStep : constrainedNextStep
          },
          {
            id: `${allocation.fixture_id}-02`,
            workId: secondaryWorkId,
            timestamp: secondaryUpdatedAt,
            summary: `Left the quick ${area} cleanup planned, but it remains out of order until the boundary is explicit.`,
            status: "WIP",
            changeType: "feature",
            affectedFiles: [mainPath],
            nextSteps: `Wait until the next-step boundary is frozen before applying the quick cleanup in \`${mainPath}\`.`
          }
        ]
      };
    default:
      throw new Error(`Unsupported family id for generated scenario: ${allocation.family_id}`);
  }
}

async function materializeFixture(params: {
  allocation: AllocationFixture;
  auditStatus: AuditStatus;
  fixtureRoot: string;
  promptVersions: PromptVersions;
  repoCommit: string;
  scenario: ScenarioSeed;
  source: SourcePoolCandidate;
  vendorRoot: string;
}): Promise<void> {
  const { allocation, auditStatus, fixtureRoot, promptVersions, repoCommit, scenario, source, vendorRoot } = params;
  const workspaceRoot = path.join(fixtureRoot, "workspace");
  const tasklogRoot = path.join(workspaceRoot, ".tasklog");
  const workdocsRoot = path.join(workspaceRoot, "workdocs");
  const reposRoot = path.join(workspaceRoot, "repos");
  const repoRoot = path.join(reposRoot, "SWE-bench");
  const surfacesRoot = path.join(fixtureRoot, "surfaces");

  await fs.mkdir(reposRoot, { recursive: true });
  await fs.mkdir(tasklogRoot, { recursive: true });
  await fs.mkdir(workdocsRoot, { recursive: true });
  await fs.mkdir(surfacesRoot, { recursive: true });
  await copyRepoSnapshot(vendorRoot, repoRoot);

  const worksJson = scenario.works.map((work) => ({
    work_id: work.id,
    title: work.title,
    slug: slugify(work.title),
    status: work.status,
    impact: work.impact,
    start_dir: path.join(repoRoot, work.startDirRel),
    scope_paths: relToRepoPaths(workspaceRoot, work.scopeRelPaths),
    summary: work.summary,
    tags: work.tags,
    created_at: work.createdAt,
    updated_at: work.updatedAt,
  }));

  const sessionLogJson = scenario.sessionLogs.map((log) => ({
    id: log.id,
    work_id: log.workId,
    timestamp: log.timestamp,
    summary: log.summary,
    status: log.status,
    change_type: log.changeType,
    affected_files: log.affectedFiles,
    tags: worksJson.find((work) => work.work_id === log.workId)?.tags ?? [],
    next_steps: log.nextSteps,
    blockers: "",
    related_log_ids: [],
    supersedes_log_id: "",
    revision: 1,
    created_at: log.timestamp,
    updated_at: log.timestamp,
  }));

  const activeWork = scenario.works.find((work) => work.id === scenario.activeContextWorkId);
  const activeContext = {
    active_work_id: scenario.activeContextWorkId,
    project_root: workspaceRoot,
    updated_at: activeWork?.updatedAt ?? scenario.sessionLogs[0]?.timestamp ?? "",
  };

  const normalizedState = normalizedStatePayload(
    allocation.fixture_id,
    workspaceRoot,
    scenario.activeContextWorkId,
    scenario.works,
    scenario.sessionLogs,
  );
  const tasklogReentry = tasklogReentryPayload(
    allocation.fixture_id,
    scenario.activeContextWorkId,
    scenario.works,
    scenario.sessionLogs,
  );

  const questionId = `${allocation.fixture_id}-q01`;
  const questions = {
    version: 1,
    round_id: ROUND_ID,
    fixture_id: allocation.fixture_id,
    benchmark_type: BENCHMARK_TYPE,
    questions: [
      {
        question_id: questionId,
        prompt_version: "v4-1-dev-reentry-question-2026-03-31a",
        answer_contract_version: "v4-1-answer-2026-03-31a",
        answer_contract_path: path.join(DOCS_ROOT, "tasklog-v4-1-answer-contract.md"),
        title: scenario.questionTitle,
        goal: scenario.goal,
        task: scenario.task,
        required_fields: [
          "decision_type",
          "selected_work_id",
          "selected_work_title",
          "work_status",
          "next_step_summary",
          "clarifying_question",
          "abstention_reason",
          "escalation_target",
          "primary_evidence_source",
          "other_candidate_work_ids"
        ],
        optional_fields: [
          "selection_rationale"
        ]
      }
    ]
  };

  const fixtureJson = {
    benchmark_type: BENCHMARK_TYPE,
    round_id: ROUND_ID,
    fixture_id: allocation.fixture_id,
    family_id: allocation.family_id,
    title: scenario.scenarioTitle,
    difficulty: allocation.difficulty,
    candidate_work_id_allowed: allocation.candidate_work_id_allowed,
    primary_decision_mode: allocation.primary_decision_mode,
    expected_label_mode: allocation.expected_label_mode,
    source_instance_id: allocation.source_instance_id,
    source_rel_paths: source.source_rel_paths,
    ambiguity_rationale: scenario.ambiguityRationale,
    distractor_rationale: scenario.distractorRationale,
    seed_notes: scenario.seedNotes,
    evaluation_refs: {
      answer_contract_path: path.join(DOCS_ROOT, "tasklog-v4-1-answer-contract.md"),
      grader_contract_path: path.join(DOCS_ROOT, "tasklog-v4-1-grader-contract.md"),
      ontology_path: path.join(DOCS_ROOT, "tasklog-v4-source-family-ontology.json"),
      adjudication_guide_path: path.join(DOCS_ROOT, "tasklog-v4-adjudication-guide.md"),
    }
  };

  const seededWorkdocPaths = scenario.works.map((work) => path.join(workdocsRoot, `${work.id}-${slugify(work.title)}`));
  const fixtureStage = auditStatus === "spot_check_pass"
    ? "dev_lane_spot_check_pass"
    : auditStatus === "spot_check_in_progress"
      ? "dev_lane_spot_check_in_progress"
      : "dev_lane_seeded_pre_annotation";
  const manifest = {
    version: 1,
    round_id: ROUND_ID,
    fixture_id: allocation.fixture_id,
    fixture_type: FIXTURE_TYPE,
    benchmark_type: BENCHMARK_TYPE,
    fixture_stage: fixtureStage,
    family_id: allocation.family_id,
    workspace_root: workspaceRoot,
    repo_snapshots: [
      {
        repo_id: "SWE-bench",
        source_dataset: "SWE-bench repo snapshot",
        source_instance_id: source.source_instance_id,
        upstream_repo_slug: source.upstream_repo_slug,
        upstream_commit: repoCommit || source.upstream_commit,
        source_vendor_path: source.source_vendor_path,
        fixture_repo_path: repoRoot,
        snapshot_created_at: new Date().toISOString()
      }
    ],
    state_paths: {
      tasklog_root: tasklogRoot,
      works_file: path.join(tasklogRoot, "works.json"),
      session_log_json: path.join(tasklogRoot, "session-log.json"),
      session_log_markdown: path.join(tasklogRoot, "session-log.md"),
      active_context_file: path.join(tasklogRoot, "active-context.json"),
      workdocs_root: workdocsRoot
    },
    contamination_controls: [
      "fixture-local repo snapshot excludes .git and transient build state",
      "fixture-local .tasklog is seeded independently from the operator workspace",
      "fixture-local workdocs are seeded independently from the operator workspace",
      "both benchmark arms read from the same repo snapshot and the same seeded Tasklog state"
    ],
    provenance_status: "repo_snapshot_visible_and_seeded_tasklog_visible",
    generation_metadata: {
      generator_model: promptVersions.generator_model,
      reviewer_model: promptVersions.reviewer_model,
      human_audit_status: auditStatus,
      human_audit_family_coverage: allocation.family_id,
      generation_prompt_version: promptVersions.generation_prompt_version,
      review_prompt_version: promptVersions.review_prompt_version,
      human_edited_before_freeze: true
    },
    seeded_tasklog_files: [
      path.join(tasklogRoot, "works.json"),
      path.join(tasklogRoot, "session-log.json"),
      path.join(tasklogRoot, "session-log.md"),
      path.join(tasklogRoot, "active-context.json")
    ],
    seeded_workdocs_paths: seededWorkdocPaths,
    seed_method: "v4_1_dev_pack_builder_v1",
    seed_notes: scenario.seedNotes
  };

  await writeJsonFile(path.join(fixtureRoot, "fixture-manifest.json"), manifest);
  await writeJsonFile(path.join(fixtureRoot, "fixture.json"), fixtureJson);
  await writeJsonFile(path.join(fixtureRoot, "questions.json"), questions);
  await writeJsonFile(path.join(tasklogRoot, "works.json"), worksJson);
  await writeJsonFile(path.join(tasklogRoot, "session-log.json"), sessionLogJson);
  await writeJsonFile(path.join(tasklogRoot, "active-context.json"), activeContext);
  await writeJsonFile(path.join(surfacesRoot, "normalized-state.json"), normalizedState);
  await writeJsonFile(path.join(surfacesRoot, "tasklog-reentry.json"), tasklogReentry);
  await fs.writeFile(path.join(tasklogRoot, "session-log.md"), sessionLogMarkdown(scenario.sessionLogs), "utf8");
  await fs.writeFile(
    path.join(fixtureRoot, "README.md"),
    [
      "# Tasklog V4.1-dev Fixture",
      "",
      `Fixture id: \`${allocation.fixture_id}\``,
      `Family: \`${allocation.family_id}\``,
      `Source instance: \`${source.source_instance_id}\``,
      "",
      scenario.scenarioNote,
      "",
      auditStatus === "spot_check_pass" ? "Frozen spot-checked artifacts:" : "Frozen pre-annotation artifacts:",
      "- `fixture-manifest.json`",
      "- `fixture.json`",
      "- `questions.json`",
      "- `surfaces/normalized-state.json`",
      "- `surfaces/tasklog-reentry.json`",
      "- `workspace/repos/SWE-bench/`",
      "- `workspace/.tasklog/`",
      "- `workspace/workdocs/`",
      "",
    ].join("\n"),
    "utf8",
  );

  for (const work of scenario.works) {
    const workdocDir = path.join(workdocsRoot, `${work.id}-${slugify(work.title)}`);
    await fs.mkdir(workdocDir, { recursive: true });
    await fs.writeFile(path.join(workdocDir, "notes.md"), artifactBody(work, workspaceRoot, { kind: "notes", body: work.notes.join("\n\n") }), "utf8");
    for (const artifact of work.artifacts) {
      await fs.writeFile(path.join(workdocDir, `${artifact.kind}.md`), artifactBody(work, workspaceRoot, artifact), "utf8");
    }
  }
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const sourcePool = await loadJson<{ candidates: SourcePoolCandidate[] }>(path.join(DOCS_ROOT, "tasklog-v4-1-dev-source-pool-manifest.json"));
  const allocationDoc = await loadJson<{ fixtures: AllocationFixture[] }>(path.join(DOCS_ROOT, "tasklog-v4-1-dev-family-allocation-table.json"));
  const promptVersions = await loadJson<PromptVersions>(path.join(DOCS_ROOT, "tasklog-v4-prompt-versions.json"));

  const vendorRoot = path.join(options.labRoot, "vendor", "SWE-bench");
  if (!(await pathExists(vendorRoot))) {
    throw new Error(`Missing vendor repo snapshot at ${vendorRoot}`);
  }

  const requestedFixtureIds = options.fixtureIds.length > 0
    ? options.fixtureIds
    : allocationDoc.fixtures.map((fixture) => fixture.fixture_id);
  const sourceById = new Map(sourcePool.candidates.map((candidate) => [candidate.source_instance_id, candidate]));
  const allocationById = new Map(allocationDoc.fixtures.map((fixture) => [fixture.fixture_id, fixture]));
  const auditStatusByFixtureId = new Map(
    allocationDoc.fixtures.map((fixture) => [fixture.fixture_id, DEV_LANE_STATUS] as const),
  );
  const repoCommit = await readGitHead(vendorRoot);

  await ensureCleanDirectory(options.outRoot, options.force);

  const emittedFixtureIds: string[] = [];
  for (const fixtureId of requestedFixtureIds) {
    const allocation = allocationById.get(fixtureId);
    if (!allocation) {
      throw new Error(`Unknown fixture id in allocation table: ${fixtureId}`);
    }
    const source = sourceById.get(allocation.source_instance_id);
    if (!source) {
      throw new Error(`Missing source-pool candidate for fixture id ${fixtureId}: ${allocation.source_instance_id}`);
    }
    const scenario = PILOT_SCENARIOS[fixtureId] ?? buildGeneratedScenarioSeed(allocation, source);

    const fixtureRoot = path.join(options.outRoot, fixtureId);
    await ensureCleanDirectory(fixtureRoot, true);
    await materializeFixture({
      allocation,
      auditStatus: auditStatusByFixtureId.get(fixtureId) ?? DEV_LANE_STATUS,
      fixtureRoot,
      promptVersions,
      repoCommit,
      scenario,
      source,
      vendorRoot,
    });
    emittedFixtureIds.push(fixtureId);
  }

  const packManifest = {
    version: 1,
    pack_id: "tasklog-v4-1-dev-pack",
    created_at: new Date().toISOString(),
    round_id: ROUND_ID,
    benchmark_type: BENCHMARK_TYPE,
    fixture_count: emittedFixtureIds.length,
    source_pool_manifest: path.join(DOCS_ROOT, "tasklog-v4-1-dev-source-pool-manifest.json"),
    family_allocation_manifest: path.join(DOCS_ROOT, "tasklog-v4-1-dev-family-allocation-table.json"),
    prompt_versions_manifest: path.join(DOCS_ROOT, "tasklog-v4-prompt-versions.json"),
    human_audit_policy_manifest: path.join(DOCS_ROOT, "tasklog-v4-1-dev-human-audit-policy.md"),
    annotation_family_briefs_manifest: path.join(DOCS_ROOT, "tasklog-v4-1-dev-annotation-family-briefs.md"),
    answer_contract_manifest: path.join(DOCS_ROOT, "tasklog-v4-1-answer-contract.md"),
    grader_contract_manifest: path.join(DOCS_ROOT, "tasklog-v4-1-grader-contract.md"),
    ontology_manifest: path.join(DOCS_ROOT, "tasklog-v4-source-family-ontology.json"),
    adjudication_guide_manifest: path.join(DOCS_ROOT, "tasklog-v4-adjudication-guide.md"),
    fixtures: emittedFixtureIds.map((fixtureId) => {
      const allocation = allocationById.get(fixtureId)!;
      return {
        fixture_id: fixtureId,
        family_id: allocation.family_id,
        source_instance_id: allocation.source_instance_id,
        difficulty: allocation.difficulty,
        human_audit_status: auditStatusByFixtureId.get(fixtureId) ?? DEV_LANE_STATUS
      };
    })
  };

  await writeJsonFile(path.join(options.outRoot, "pack-manifest.json"), packManifest);
  await writeJsonFile(path.join(options.outRoot, "dev-pack-manifest.json"), packManifest);

  console.log(JSON.stringify({
    round_id: ROUND_ID,
    benchmark_type: BENCHMARK_TYPE,
    out_root: options.outRoot,
    fixture_count: emittedFixtureIds.length,
    fixture_ids: emittedFixtureIds,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
