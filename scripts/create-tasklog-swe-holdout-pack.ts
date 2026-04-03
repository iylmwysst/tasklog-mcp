import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const DEFAULT_LAB_ROOT = "/Users/Lab/Desktop/TasklogSweLab";
const SHARED_PROMPT = "You are resuming work in this coding workspace. Determine which unfinished work should be resumed now, summarize its current status, and state the next concrete step. Use only the provided Tasklog and workspace evidence. Do not guess. Leave fields blank if the evidence is insufficient.";

type WorkStatus = "active" | "blocked" | "done";
type WorkDocKind = "notes" | "plan" | "spec" | "design" | "summary";

interface CliOptions {
  force: boolean;
  labRoot: string;
}

interface WorkArtifact {
  kind: WorkDocKind;
  body: string;
}

interface SessionLog {
  id: string;
  workId: string;
  timestamp: string;
  summary: string;
  status: "WIP" | "Done";
  changeType: "docs" | "feature" | "investigation" | "research";
  affectedFiles: string[];
  nextSteps: string;
  blockers?: string;
}

interface WorkDefinition {
  id: string;
  title: string;
  status: WorkStatus;
  impact: "low" | "medium" | "high";
  startDirRel: string;
  scopeRelPaths: string[];
  summary: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  notes: string[];
  artifacts: WorkArtifact[];
}

interface FixtureDefinition {
  fixtureId: string;
  family: string;
  scenarioTitle: string;
  scenarioNote: string;
  activeContextWorkId: string;
  questionTitle: string;
  goal: string;
  task: string;
  evidenceHints: string[];
  expectedDifficulty: "easy" | "medium" | "hard";
  notes: string[];
  expectedWorkId: string;
  expectedWorkTitle: string;
  expectedWorkStatus: WorkStatus;
  expectedNextStep: string;
  acceptableOtherCandidateWorkIds: string[];
  acceptableNextStepSummaries?: string[];
  gradingNotes: string[];
  works: WorkDefinition[];
  sessionLogs: SessionLog[];
}

function parseArgs(argv: string[]): CliOptions {
  let labRoot = DEFAULT_LAB_ROOT;
  let force = false;

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current === "--lab-root") {
      labRoot = path.resolve(argv[index + 1] ?? labRoot);
      index += 1;
      continue;
    }
    if (current === "--force") {
      force = true;
    }
  }

  return { force, labRoot };
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
      throw new Error(`Refusing to overwrite existing fixture directory without --force: ${targetPath}`);
    }
    await fs.rm(targetPath, { recursive: true, force: true });
  }
  await fs.mkdir(targetPath, { recursive: true });
}

async function readGitHead(repoRoot: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync("git", ["-C", repoRoot, "rev-parse", "HEAD"]);
    return stdout.trim();
  } catch {
    return "";
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function copyRepoSnapshot(sourcePath: string, targetPath: string): Promise<void> {
  await fs.cp(sourcePath, targetPath, {
    recursive: true,
    force: true,
    filter: (entry) => {
      const baseName = path.basename(entry);
      return ![".git", "node_modules", "dist", "target", ".tasklog", "workdocs"].includes(baseName);
    },
  });
}

function repoPath(workspaceRoot: string, relativePath: string): string {
  return path.join(workspaceRoot, "repos", "SWE-bench", relativePath);
}

function sessionLogMarkdown(logs: SessionLog[]): string {
  const lines = ["# Session Log", ""];
  for (const log of logs) {
    lines.push(`## ${log.timestamp}`);
    lines.push("");
    lines.push(`- work_id: \`${log.workId}\``);
    lines.push(`- status: \`${log.status}\``);
    lines.push(`- change_type: \`${log.changeType}\``);
    lines.push(`- summary: ${log.summary}`);
    lines.push(`- next_steps: ${log.nextSteps}`);
    if (log.blockers) {
      lines.push(`- blockers: ${log.blockers}`);
    }
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

function workDocFrontmatter(work: WorkDefinition, workspaceRoot: string): string[] {
  return [
    "---",
    `work_id: '${work.id}'`,
    `title: '${work.title.replace(/'/g, "''")}'`,
    `status: '${work.status}'`,
    `impact: '${work.impact}'`,
    `start_dir: '${repoPath(workspaceRoot, work.startDirRel).replace(/'/g, "''")}'`,
    "scope_paths:",
    ...work.scopeRelPaths.map((scopeRelPath) => `  - '${repoPath(workspaceRoot, scopeRelPath).replace(/'/g, "''")}'`),
    `updated_at: '${work.updatedAt}'`,
    "---",
    "",
  ];
}

function writeNotesDoc(work: WorkDefinition, workspaceRoot: string): string {
  return [
    ...workDocFrontmatter(work, workspaceRoot),
    "# Notes",
    "",
    ...work.notes.flatMap((paragraph, index) => [
      `## ${new Date(new Date(work.updatedAt).getTime() - (work.notes.length - index) * 60000).toISOString()}`,
      "",
      paragraph,
      "",
    ]),
  ].join("\n");
}

function artifactHeader(work: WorkDefinition, workspaceRoot: string): string[] {
  return [
    "---",
    `work_id: '${work.id}'`,
    `title: '${work.title.replace(/'/g, "''")}'`,
    `status: '${work.status}'`,
    `impact: '${work.impact}'`,
    `start_dir: '${repoPath(workspaceRoot, work.startDirRel).replace(/'/g, "''")}'`,
    "scope_paths:",
    ...work.scopeRelPaths.map((scopeRelPath) => `  - '${repoPath(workspaceRoot, scopeRelPath).replace(/'/g, "''")}'`),
    `updated_at: '${work.updatedAt}'`,
    "---",
    "",
  ];
}

function artifactBody(work: WorkDefinition, workspaceRoot: string, artifact: WorkArtifact): string {
  const header = artifactHeader(work, workspaceRoot);
  const titles: Record<WorkDocKind, string> = {
    notes: "# Notes",
    plan: "# Implementation Plan",
    spec: "# Spec",
    design: "# Design Notes",
    summary: "# Summary",
  };
  return [...header, titles[artifact.kind], "", artifact.body, ""].join("\n");
}

async function writeJsonFile(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function activeWork(params: {
  id: string;
  title: string;
  impact: "low" | "medium" | "high";
  startDirRel: string;
  scopeRelPaths: string[];
  summary: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  notes: string[];
  planBody: string;
  specBody?: string;
  designBody?: string;
}): WorkDefinition {
  return {
    ...params,
    status: "active",
    artifacts: [
      { kind: "plan", body: params.planBody },
      ...(params.specBody ? [{ kind: "spec" as const, body: params.specBody }] : []),
      ...(params.designBody ? [{ kind: "design" as const, body: params.designBody }] : []),
    ],
  };
}

function blockedWork(params: {
  id: string;
  title: string;
  impact: "low" | "medium" | "high";
  startDirRel: string;
  scopeRelPaths: string[];
  summary: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  notes: string[];
  planBody: string;
}): WorkDefinition {
  return {
    ...params,
    status: "blocked",
    artifacts: [{ kind: "plan", body: params.planBody }],
  };
}

function doneWork(params: {
  id: string;
  title: string;
  impact: "low" | "medium" | "high";
  startDirRel: string;
  scopeRelPaths: string[];
  summary: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  notes: string[];
  summaryBody: string;
  designBody?: string;
  specBody?: string;
}): WorkDefinition {
  return {
    ...params,
    status: "done",
    artifacts: [
      { kind: "summary", body: params.summaryBody },
      ...(params.designBody ? [{ kind: "design" as const, body: params.designBody }] : []),
      ...(params.specBody ? [{ kind: "spec" as const, body: params.specBody }] : []),
    ],
  };
}

const HOLDOUT_FIXTURES: FixtureDefinition[] = [
  {
    fixtureId: "holdout-001",
    family: "stale_active_context_resume",
    scenarioTitle: "Stale active context should lose to the sharper harness audit",
    scenarioNote: "The active context points to a still-open docs work, but the stronger latest log and next-step signal belong to the grading boundary audit.",
    activeContextWorkId: "Jd4pR8",
    questionTitle: "Stale active context with a stronger harness target",
    goal: "Check whether the model can override an open active context when another unfinished work has the clearer execution-ready signal.",
    task: "Inspect the active context, open works, recent logs, and workdocs. Decide which unfinished work should actually be resumed now.",
    evidenceHints: [
      "The active context is not closed, but it is parked behind the fixture pack freeze.",
      "The best target names one concrete harness file and a single boundary to trace next.",
    ],
    expectedDifficulty: "medium",
    notes: [
      "Holdout fixture for stale-active-context recovery on a code-adjacent harness task.",
      "The target work should beat the active-context memo because it has the sharper latest log and next step.",
    ],
    expectedWorkId: "Ht7qN2",
    expectedWorkTitle: "Trace grading boundary for fixture-local patch application",
    expectedWorkStatus: "active",
    expectedNextStep: "Open `swebench/harness/grading.py` and record the first patch-application boundary that fixture-local evaluation must preserve.",
    acceptableOtherCandidateWorkIds: ["Jd4pR8", "Kb8mL1", "Qv2sC5"],
    gradingNotes: [
      "Reject Jd4pR8 even though it is the active context, because it is explicitly parked until the fixture pack is frozen.",
      "Prefer the work with the sharper harness-file next step over the broader docs memo.",
    ],
    works: [
      activeWork({
        id: "Ht7qN2",
        title: "Trace grading boundary for fixture-local patch application",
        impact: "high",
        startDirRel: "swebench/harness",
        scopeRelPaths: ["swebench/harness/grading.py", "swebench/harness/run_evaluation.py"],
        summary: "Reduced the grading audit to a single patch-application boundary, but the exact interception point is not frozen yet.",
        tags: ["benchmark", "swe", "grading"],
        createdAt: "2026-03-28T10:05:00.000Z",
        updatedAt: "2026-03-29T06:22:00.000Z",
        notes: [
          "This is the strongest resumable work because it names the one grading boundary that a fixture-local runner must preserve before holdout execution can be trusted.",
          "The next action is narrow and executable: open one harness file and record the first patch-application boundary.",
        ],
        planBody: "## Scope\n\nFreeze the first grading boundary that controls patch application order for fixture-local runs.\n\n## Steps\n\n1. Open `swebench/harness/grading.py`.\n2. Find the first patch-application boundary used during evaluation.\n3. Record that boundary in a short runner note.\n\n## Testing\n\nConfirm the note cites the exact file and does not rely on operator-local state.",
        specBody: "## Objective\n\nPreserve the grading boundary that determines whether fixture-local evaluation respects patch application order.\n\n## Constraints\n\n- Cite exact harness files only.\n- Do not broaden into report formatting or docs polish.",
      }),
      activeWork({
        id: "Jd4pR8",
        title: "Draft methods paragraph for fixture provenance",
        impact: "medium",
        startDirRel: "docs/reference",
        scopeRelPaths: ["docs/reference/harness.md", "docs/guides/evaluation.md"],
        summary: "Outlined a methods paragraph about fixture provenance, but it should stay parked until the holdout pack itself is frozen.",
        tags: ["benchmark", "docs", "paper"],
        createdAt: "2026-03-28T09:10:00.000Z",
        updatedAt: "2026-03-29T06:05:00.000Z",
        notes: [
          "This memo is still open, but it is intentionally downstream from the fixture freeze work and should not outrank a sharper runner-facing task.",
          "Keep the prose draft parked until the exact holdout artifacts and boundary notes are frozen.",
        ],
        planBody: "## Scope\n\nCapture the methods wording for fixture provenance after the pack is frozen.\n\n## Steps\n\n1. Wait for the fixture pack to freeze.\n2. Pull the exact contamination controls into prose.\n3. Write a short methods paragraph.\n\n## Testing\n\nDo not resume this work before the holdout fixture pack itself is stable.",
      }),
      blockedWork({
        id: "Kb8mL1",
        title: "Choose container base image matrix for holdout runners",
        impact: "high",
        startDirRel: "docs/guides",
        scopeRelPaths: ["docs/guides/docker_setup.md", "swebench/harness/docker_build.py"],
        summary: "Compared image strategies for holdout execution, but the image matrix is blocked on the final mount contract.",
        tags: ["benchmark", "infra", "container"],
        createdAt: "2026-03-28T08:40:00.000Z",
        updatedAt: "2026-03-29T05:30:00.000Z",
        notes: [
          "This work remains blocked because image selection depends on whether the holdout lane will build containers or only mount frozen repos.",
          "It is high impact, but it is not the best resumable next step today.",
        ],
        planBody: "## Scope\n\nKeep the image-matrix decision parked until the runner contract freezes.\n\n## Steps\n\n1. Confirm the mount contract for holdout runs.\n2. Resume image selection only after that decision.\n\n## Testing\n\nDo not continue container selection while the runner contract is unresolved.",
      }),
      doneWork({
        id: "Qv2sC5",
        title: "Bootstrap clean Tasklog SWE holdout lab",
        impact: "high",
        startDirRel: ".",
        scopeRelPaths: ["docs/reference/harness.md"],
        summary: "Created the lab root and initial vendor snapshot for the holdout lane; this closed setup work should not be resumed.",
        tags: ["benchmark", "environment", "done"],
        createdAt: "2026-03-27T21:20:00.000Z",
        updatedAt: "2026-03-28T22:45:00.000Z",
        notes: [
          "This done work has strong artifacts because it created the lab root, but it is a closed setup step and not the next resume target.",
        ],
        summaryBody: "Established the clean holdout lab root, copied the vendor repo snapshot, and separated `vendor`, `fixtures`, and `runs` so the holdout lane no longer depends on the operator workspace.",
        designBody: "The holdout lab isolates vendor state, fixture packs, and run outputs so later evaluation can mount only frozen fixture directories.",
      }),
    ],
    sessionLogs: [
      {
        id: "H001-01",
        workId: "Qv2sC5",
        timestamp: "2026-03-28T22:45:00.000Z",
        summary: "Created the clean holdout lab root and copied the first frozen SWE-bench vendor snapshot into the lab.",
        status: "Done",
        changeType: "feature",
        affectedFiles: ["README.md", "lab-manifest.json"],
        nextSteps: "Seed frozen fixture state and workdocs into the new holdout fixtures.",
      },
      {
        id: "H001-02",
        workId: "Jd4pR8",
        timestamp: "2026-03-29T06:05:00.000Z",
        summary: "Parked the fixture-provenance paragraph until the exact holdout artifacts are frozen enough to cite precisely.",
        status: "WIP",
        changeType: "docs",
        affectedFiles: ["docs/reference/harness.md"],
        nextSteps: "Resume the paper paragraph only after the holdout artifacts and contamination controls are final.",
      },
      {
        id: "H001-03",
        workId: "Kb8mL1",
        timestamp: "2026-03-29T05:30:00.000Z",
        summary: "Compared candidate image directions for the holdout lane and confirmed image selection remains blocked on the mount contract.",
        status: "WIP",
        changeType: "research",
        affectedFiles: ["docs/guides/docker_setup.md", "swebench/harness/docker_build.py"],
        nextSteps: "Escalate the open mount-contract question before making any image-matrix decision.",
        blockers: "The runner contract is not frozen, so image selection would be premature.",
      },
      {
        id: "H001-04",
        workId: "Ht7qN2",
        timestamp: "2026-03-29T06:22:00.000Z",
        summary: "Reduced the grading audit to the single boundary that determines whether fixture-local evaluation can preserve patch application order.",
        status: "WIP",
        changeType: "investigation",
        affectedFiles: ["swebench/harness/grading.py", "swebench/harness/run_evaluation.py"],
        nextSteps: "Open `swebench/harness/grading.py` and record the first patch-application boundary that fixture-local evaluation must preserve.",
      },
    ],
  },
  {
    fixtureId: "holdout-002",
    family: "active_context_correct",
    scenarioTitle: "Active context already points at the best reporting task",
    scenarioNote: "This holdout checks that the model keeps the active context when it already matches the best latest-log and next-step signal.",
    activeContextWorkId: "Pc4mL8",
    questionTitle: "Active context is already correct",
    goal: "Check whether the model can keep the active context as-is when it already names the strongest unfinished work.",
    task: "Review the active context, recent logs, and open workdocs. Decide whether the active work should stay active or another work should replace it.",
    evidenceHints: [
      "The active context work has the sharpest file-level next step in the fixture.",
      "A richer artifact-heavy work exists, but it is not the best current target.",
    ],
    expectedDifficulty: "easy",
    notes: [
      "Holdout fixture for the 'active context is already right' case.",
      "The target should remain the active work because it has both the freshest log and the narrowest executable next step.",
    ],
    expectedWorkId: "Pc4mL8",
    expectedWorkTitle: "Map report emission files for claim-lane artifacts",
    expectedWorkStatus: "active",
    expectedNextStep: "Open `swebench/harness/reporting.py` and list the first artifact-emission function called after evaluation completes.",
    acceptableOtherCandidateWorkIds: ["Ld3vT6", "Wa1cK9", "Rm6pQ4"],
    gradingNotes: [
      "Keep the active context as-is; it already points to the strongest target.",
      "Reject the artifact-rich packaging work because it is broader and less execution-ready than the reporting task.",
    ],
    acceptableNextStepSummaries: [
      "Open `swebench/harness/reporting.py` and list the first artifact-emission function called after evaluation completes.",
      "Read `swebench/harness/reporting.py` and capture the first artifact-emission function after evaluation.",
    ],
    works: [
      activeWork({
        id: "Pc4mL8",
        title: "Map report emission files for claim-lane artifacts",
        impact: "high",
        startDirRel: "swebench/harness",
        scopeRelPaths: ["swebench/harness/reporting.py", "docs/guides/evaluation.md"],
        summary: "Trimmed the artifact-emission audit down to one reporting file, but the first emission function still needs to be frozen.",
        tags: ["benchmark", "reporting", "artifacts"],
        createdAt: "2026-03-28T11:25:00.000Z",
        updatedAt: "2026-03-29T07:05:00.000Z",
        notes: [
          "This active work is already the strongest target because the next step is file-specific and directly tied to the claim-lane artifact story.",
          "Do not demote it in favor of broader packaging or appendix work.",
        ],
        planBody: "## Scope\n\nFreeze the first artifact-emission boundary for claim-lane reporting.\n\n## Steps\n\n1. Open `swebench/harness/reporting.py`.\n2. Identify the first artifact-emission function after evaluation completes.\n3. Record that function for the methods appendix.\n\n## Testing\n\nThe note should cite exact files and the first reporting boundary only.",
      }),
      activeWork({
        id: "Ld3vT6",
        title: "Assemble artifact-rich packaging checklist",
        impact: "medium",
        startDirRel: "docs/guides",
        scopeRelPaths: ["docs/guides/evaluation.md", "docs/reference/harness.md"],
        summary: "Collected the broad packaging checklist for claim-lane outputs, but it is less decisive than the sharper reporting task.",
        tags: ["benchmark", "docs", "packaging"],
        createdAt: "2026-03-28T10:40:00.000Z",
        updatedAt: "2026-03-29T06:20:00.000Z",
        notes: [
          "This work is plausible, but it is broader and more checklist-like than the reporting audit.",
          "The sharper next step is still inside `swebench/harness/reporting.py`, not the packaging checklist.",
        ],
        planBody: "## Scope\n\nKeep the packaging checklist updated after the lower-level reporting boundary is frozen.\n\n## Steps\n\n1. Wait for the reporting boundary to freeze.\n2. Fold the exact artifact-emission details into the checklist.\n\n## Testing\n\nDo not let this checklist outrank the underlying reporting audit.",
      }),
      doneWork({
        id: "Wa1cK9",
        title: "Freeze contamination-control appendix bullets",
        impact: "medium",
        startDirRel: "docs/reference",
        scopeRelPaths: ["docs/reference/harness.md", "docs/README.md"],
        summary: "Finished the contamination-control appendix bullets for the methods write-up; this closed work should stay closed.",
        tags: ["benchmark", "paper", "done"],
        createdAt: "2026-03-27T19:10:00.000Z",
        updatedAt: "2026-03-28T21:35:00.000Z",
        notes: [
          "The appendix bullets are complete and intentionally closed. Their strong artifacts should not cause the model to resume them.",
        ],
        summaryBody: "Locked the contamination-control bullets for the methods appendix and cross-checked them against the fixture manifest contract.",
        specBody: "The appendix bullets cite only frozen fixture-local controls and avoid any live-workspace assumptions.",
      }),
      blockedWork({
        id: "Rm6pQ4",
        title: "Choose screenshot bundle format for artifact previews",
        impact: "low",
        startDirRel: "docs/assets",
        scopeRelPaths: ["docs/assets/evaluation.md", "docs/guides/evaluation.md"],
        summary: "Preview bundle format is blocked on deciding whether the holdout pack will publish rendered screenshots at all.",
        tags: ["benchmark", "assets", "blocked"],
        createdAt: "2026-03-28T12:00:00.000Z",
        updatedAt: "2026-03-29T05:50:00.000Z",
        notes: [
          "This asset-format work is downstream and blocked. It should not outrank the reporting boundary audit.",
        ],
        planBody: "## Scope\n\nKeep the screenshot-bundle discussion blocked until the paper package requirements are frozen.\n\n## Steps\n\n1. Freeze the paper package requirements.\n2. Resume the preview-format choice only if screenshots are in scope.\n\n## Testing\n\nDo not promote this blocked asset task over runner-facing reporting work.",
      }),
    ],
    sessionLogs: [
      {
        id: "H002-01",
        workId: "Ld3vT6",
        timestamp: "2026-03-29T06:20:00.000Z",
        summary: "Expanded the packaging checklist, but left it intentionally secondary to the lower-level reporting boundary work.",
        status: "WIP",
        changeType: "docs",
        affectedFiles: ["docs/guides/evaluation.md"],
        nextSteps: "Wait for the reporting boundary to freeze before returning to the checklist.",
      },
      {
        id: "H002-02",
        workId: "Rm6pQ4",
        timestamp: "2026-03-29T05:50:00.000Z",
        summary: "Paused screenshot-bundle format work because the paper package may not include rendered previews.",
        status: "WIP",
        changeType: "research",
        affectedFiles: ["docs/assets/evaluation.md"],
        nextSteps: "Freeze the paper-package requirements before deciding any preview format.",
        blockers: "Preview screenshots may be out of scope for the first holdout round.",
      },
      {
        id: "H002-03",
        workId: "Pc4mL8",
        timestamp: "2026-03-29T07:05:00.000Z",
        summary: "Reduced the reporting audit to the first artifact-emission function that fires after evaluation completes.",
        status: "WIP",
        changeType: "investigation",
        affectedFiles: ["swebench/harness/reporting.py", "docs/guides/evaluation.md"],
        nextSteps: "Open `swebench/harness/reporting.py` and list the first artifact-emission function called after evaluation completes.",
      },
    ],
  },
  {
    fixtureId: "holdout-003",
    family: "multiple_open_works_resume",
    scenarioTitle: "Several open works are plausible, but one metadata task is clearly sharper",
    scenarioNote: "This fixture tests ranking across several open works with mixed docs and code surfaces.",
    activeContextWorkId: "Mg7qR5",
    questionTitle: "Multiple open works with one metadata winner",
    goal: "Check whether the model can compare several open works and choose the one with the clearest next action rather than the broadest scope.",
    task: "Compare all unfinished works visible in Tasklog and the workdocs. Choose the single best work to resume now.",
    evidenceHints: [
      "One work names the exact metadata fields that still need to be frozen.",
      "A broader cross-repo planning memo is active, but it should not outrank the narrower metadata freeze.",
    ],
    expectedDifficulty: "medium",
    notes: [
      "Holdout fixture for multi-open ranking across docs-heavy and code-adjacent work.",
      "The correct answer is the narrower metadata-field freeze, not the broader planning memo.",
    ],
    expectedWorkId: "Mv3kT1",
    expectedWorkTitle: "Freeze runner metadata field list for per-run provenance",
    expectedWorkStatus: "active",
    expectedNextStep: "Open `docs/benchmark-runner-metadata-contract.md` and enumerate the exact required provenance fields before comparing them with `swebench/harness/reporting.py`.",
    acceptableOtherCandidateWorkIds: ["Mg7qR5", "Br9mC2", "Ds1vP7"],
    gradingNotes: [
      "Reject the broader planning memo even though it is also active and high impact.",
      "The correct next step starts by enumerating exact metadata fields before any broader writing.",
    ],
    works: [
      activeWork({
        id: "Mv3kT1",
        title: "Freeze runner metadata field list for per-run provenance",
        impact: "high",
        startDirRel: "docs",
        scopeRelPaths: ["docs/benchmark-runner-metadata-contract.md", "swebench/harness/reporting.py"],
        summary: "Narrowed the provenance contract to one field list, but the exact required fields still need to be enumerated and checked against the reporting surface.",
        tags: ["benchmark", "metadata", "paper"],
        createdAt: "2026-03-28T13:00:00.000Z",
        updatedAt: "2026-03-29T07:35:00.000Z",
        notes: [
          "This is the strongest resume target because it has a two-step but still precise next action: enumerate the required fields, then compare them against the reporting surface.",
          "Do not widen this into cross-repo planning or appendix prose until the field list is frozen.",
        ],
        planBody: "## Scope\n\nFreeze the exact per-run provenance fields required for holdout reporting.\n\n## Steps\n\n1. Open `docs/benchmark-runner-metadata-contract.md`.\n2. Enumerate the exact required provenance fields.\n3. Compare that field list with `swebench/harness/reporting.py`.\n\n## Testing\n\nKeep the field list exact; do not replace it with broad narrative summaries.",
        specBody: "## Objective\n\nLock the provenance contract before the first holdout runs.\n\n## Constraints\n\n- Use exact field names.\n- Check the frozen contract against the reporting surface.",
      }),
      activeWork({
        id: "Mg7qR5",
        title: "Draft cross-repo methods outline for the holdout lane",
        impact: "high",
        startDirRel: "docs",
        scopeRelPaths: ["docs/full-session-reentry-benchmark.md", "docs/llm-reentry-benchmark.md"],
        summary: "Outlined the broader methods section for the holdout lane, but the exact per-run provenance fields are still upstream of this write-up.",
        tags: ["benchmark", "docs", "paper"],
        createdAt: "2026-03-28T12:20:00.000Z",
        updatedAt: "2026-03-29T06:40:00.000Z",
        notes: [
          "This work is open and important, but it is still downstream from the metadata field freeze.",
          "The methods outline should wait for the exact provenance contract rather than guessing it.",
        ],
        planBody: "## Scope\n\nKeep the broader methods outline open but subordinate to the metadata freeze.\n\n## Steps\n\n1. Wait for the metadata field list to freeze.\n2. Fold those exact fields into the methods outline.\n\n## Testing\n\nDo not let the broad outline outrank the sharper provenance-field task.",
      }),
      blockedWork({
        id: "Br9mC2",
        title: "Decide whether holdout traces should embed raw tool events",
        impact: "medium",
        startDirRel: "docs",
        scopeRelPaths: ["docs/full-session-reentry-interactive-trace-schema.json", "docs/benchmark-runner-metadata-contract.md"],
        summary: "Tool-event embedding is blocked on the publication policy for raw traces.",
        tags: ["benchmark", "trace", "blocked"],
        createdAt: "2026-03-28T12:55:00.000Z",
        updatedAt: "2026-03-29T05:55:00.000Z",
        notes: [
          "This trace-policy work is still blocked and should not outrank the exact metadata freeze.",
        ],
        planBody: "## Scope\n\nLeave trace embedding blocked until publication policy is final.\n\n## Steps\n\n1. Freeze the publication policy.\n2. Revisit raw tool-event embedding only if it remains in scope.\n\n## Testing\n\nKeep this blocked task from outranking the sharper provenance-field work.",
      }),
      doneWork({
        id: "Ds1vP7",
        title: "Freeze dev-lane runner version string",
        impact: "low",
        startDirRel: "scripts",
        scopeRelPaths: ["scripts/run-tasklog-swe-dev-lane.ts"],
        summary: "Closed the dev-lane runner version string update; it is a done supporting task.",
        tags: ["benchmark", "runner", "done"],
        createdAt: "2026-03-27T22:10:00.000Z",
        updatedAt: "2026-03-28T20:10:00.000Z",
        notes: [
          "This done runner-version task is a distractor only and should remain closed.",
        ],
        summaryBody: "Locked the dev-lane runner version string to preserve comparability across the latest dev reruns.",
      }),
    ],
    sessionLogs: [
      {
        id: "H003-01",
        workId: "Mg7qR5",
        timestamp: "2026-03-29T06:40:00.000Z",
        summary: "Expanded the holdout methods outline but left explicit placeholders for the exact per-run provenance fields.",
        status: "WIP",
        changeType: "docs",
        affectedFiles: ["docs/llm-reentry-benchmark.md", "docs/full-session-reentry-benchmark.md"],
        nextSteps: "Wait for the metadata field list to freeze before returning to the broader methods outline.",
      },
      {
        id: "H003-02",
        workId: "Br9mC2",
        timestamp: "2026-03-29T05:55:00.000Z",
        summary: "Paused raw tool-event embedding because the publication policy for full traces remains unresolved.",
        status: "WIP",
        changeType: "research",
        affectedFiles: ["docs/full-session-reentry-interactive-trace-schema.json"],
        nextSteps: "Resolve the publication policy before deciding whether raw tool events belong in the holdout output.",
        blockers: "Publication policy for raw traces is not frozen.",
      },
      {
        id: "H003-03",
        workId: "Mv3kT1",
        timestamp: "2026-03-29T07:35:00.000Z",
        summary: "Reduced the provenance contract to the exact field list that still needs to be enumerated and checked against the reporting surface.",
        status: "WIP",
        changeType: "investigation",
        affectedFiles: ["docs/benchmark-runner-metadata-contract.md", "swebench/harness/reporting.py"],
        nextSteps: "Open `docs/benchmark-runner-metadata-contract.md` and enumerate the exact required provenance fields before comparing them with `swebench/harness/reporting.py`.",
      },
    ],
  },
  {
    fixtureId: "holdout-004",
    family: "blocked_work_triage",
    scenarioTitle: "The correct work is blocked and the next step is escalation",
    scenarioNote: "This holdout checks whether the model can correctly surface a blocked target and provide the unblock step instead of forcing a resumable coding task.",
    activeContextWorkId: "Bg8nD4",
    questionTitle: "Blocked target should stay blocked with an unblock next step",
    goal: "Check whether the model can report a blocked work honestly when it is still the correct current target.",
    task: "Inspect the active context, works, recent logs, and workdocs. Choose the correct unfinished work to resume now, even if it is blocked, and state the next concrete unblock step.",
    evidenceHints: [
      "The strongest latest log explicitly says the image-choice work is blocked and why.",
      "Another active task is resumable, but it is supporting work rather than the main frozen dependency.",
    ],
    expectedDifficulty: "hard",
    notes: [
      "Holdout fixture for blocked-work triage where the correct answer remains blocked.",
      "The target is the blocked dependency itself, not the easier supporting docs task.",
    ],
    expectedWorkId: "Bg8nD4",
    expectedWorkTitle: "Choose mount contract for hermetic image builds",
    expectedWorkStatus: "blocked",
    expectedNextStep: "Escalate the open runner-contract question and freeze whether holdout runs build images or mount only frozen repos before making any image-choice decision.",
    acceptableOtherCandidateWorkIds: ["Av5rK2", "Dd3pM9", "Ft7qL1"],
    gradingNotes: [
      "Do not evade the blocked dependency by choosing the easier supporting work.",
      "The correct next step is an unblock or escalation step, not a coding step inside `docker_build.py`.",
    ],
    works: [
      blockedWork({
        id: "Bg8nD4",
        title: "Choose mount contract for hermetic image builds",
        impact: "high",
        startDirRel: "swebench/harness",
        scopeRelPaths: ["swebench/harness/docker_build.py", "docs/guides/docker_setup.md"],
        summary: "Compared holdout image-build directions, but the core mount contract is still unresolved, so image-choice work is blocked.",
        tags: ["benchmark", "container", "blocked"],
        createdAt: "2026-03-28T13:40:00.000Z",
        updatedAt: "2026-03-29T07:45:00.000Z",
        notes: [
          "This blocked dependency still owns the main uncertainty for hermetic execution and should be reported honestly as blocked.",
          "Do not replace it with a weaker supporting task just because that task is easier to execute immediately.",
        ],
        planBody: "## Scope\n\nResolve the mount-contract dependency that blocks image-choice work.\n\n## Steps\n\n1. Escalate the runner-contract question.\n2. Freeze whether holdout runs build images or mount only frozen repos.\n3. Resume image-choice work only after that decision.\n\n## Testing\n\nDo not continue image-choice work before the mount contract is frozen.",
      }),
      activeWork({
        id: "Av5rK2",
        title: "Draft supporting note on hermetic repo mounts",
        impact: "medium",
        startDirRel: "docs/guides",
        scopeRelPaths: ["docs/guides/docker_setup.md", "docs/reference/harness.md"],
        summary: "Drafted a note about possible repo-mount patterns, but it is supporting analysis under the blocked mount-contract decision.",
        tags: ["benchmark", "docs", "infra"],
        createdAt: "2026-03-28T14:00:00.000Z",
        updatedAt: "2026-03-29T07:10:00.000Z",
        notes: [
          "This note is executable, but it is not the main frozen dependency. The actual blockage is still the unresolved mount contract.",
        ],
        planBody: "## Scope\n\nKeep the mount-pattern note ready, but subordinate it to the blocked mount-contract decision.\n\n## Steps\n\n1. Wait for the runner contract to freeze.\n2. Update the note with the final mount decision.\n\n## Testing\n\nDo not promote this supporting note over the blocked dependency.",
      }),
      doneWork({
        id: "Dd3pM9",
        title: "Capture current docker-build entrypoints",
        impact: "medium",
        startDirRel: "swebench/harness",
        scopeRelPaths: ["swebench/harness/docker_build.py", "swebench/harness/prepare_images.py"],
        summary: "Closed the inventory of docker-build entrypoints for the current vendor snapshot.",
        tags: ["benchmark", "container", "done"],
        createdAt: "2026-03-27T22:45:00.000Z",
        updatedAt: "2026-03-28T21:15:00.000Z",
        notes: [
          "The entrypoint inventory is done and should not be reopened just because the blocked dependency is nearby.",
        ],
        summaryBody: "Inventoried the docker-build and prepare-images entrypoints in the current vendor snapshot so later contract work can cite the correct files.",
      }),
      activeWork({
        id: "Ft7qL1",
        title: "Outline container appendix bullets for the paper",
        impact: "low",
        startDirRel: "docs",
        scopeRelPaths: ["docs/llm-reentry-benchmark.md", "docs/guides/docker_setup.md"],
        summary: "Started a paper appendix outline on container assumptions, but it is downstream from the blocked mount-contract decision.",
        tags: ["benchmark", "paper", "docs"],
        createdAt: "2026-03-28T13:55:00.000Z",
        updatedAt: "2026-03-29T06:30:00.000Z",
        notes: [
          "This appendix outline is intentionally downstream from the blocked mount-contract work and should not outrank it.",
        ],
        planBody: "## Scope\n\nKeep the appendix outline ready for when the mount contract is frozen.\n\n## Steps\n\n1. Wait for the mount contract decision.\n2. Fill the appendix with the exact final assumption.\n\n## Testing\n\nAvoid writing speculative appendix text before the contract freezes.",
      }),
    ],
    sessionLogs: [
      {
        id: "H004-01",
        workId: "Ft7qL1",
        timestamp: "2026-03-29T06:30:00.000Z",
        summary: "Added placeholder bullets for the container appendix, but left the core assumption blank until the mount contract is decided.",
        status: "WIP",
        changeType: "docs",
        affectedFiles: ["docs/llm-reentry-benchmark.md"],
        nextSteps: "Wait for the mount contract before filling in the appendix.",
      },
      {
        id: "H004-02",
        workId: "Av5rK2",
        timestamp: "2026-03-29T07:10:00.000Z",
        summary: "Drafted a supporting note on hermetic repo mounts, but kept it subordinate to the unresolved mount-contract decision.",
        status: "WIP",
        changeType: "docs",
        affectedFiles: ["docs/guides/docker_setup.md"],
        nextSteps: "Update the supporting note after the runner contract freezes.",
      },
      {
        id: "H004-03",
        workId: "Bg8nD4",
        timestamp: "2026-03-29T07:45:00.000Z",
        summary: "Confirmed that image-choice work remains blocked on the unresolved mount contract for hermetic holdout execution.",
        status: "WIP",
        changeType: "research",
        affectedFiles: ["swebench/harness/docker_build.py", "docs/guides/docker_setup.md"],
        nextSteps: "Escalate the open runner-contract question and freeze whether holdout runs build images or mount only frozen repos before making any image-choice decision.",
        blockers: "The holdout runner contract is not frozen, so image-choice work cannot continue safely.",
      },
    ],
  },
  {
    fixtureId: "holdout-005",
    family: "closed_work_do_not_resume",
    scenarioTitle: "A rich done work should stay closed even with fresh-looking artifacts",
    scenarioNote: "This holdout uses a done packaging template as the main distractor against an open script-generation task.",
    activeContextWorkId: "Va1mK3",
    questionTitle: "Done packaging template should not be resumed",
    goal: "Check whether the model resists an artifact-rich done work and still chooses the correct open target.",
    task: "Review the open and closed Tasklog evidence. Choose the work that should be resumed now and avoid any closed distractor, even if it has strong artifacts.",
    evidenceHints: [
      "One done work has summary, design, and spec artifacts, but it is explicitly closed.",
      "The correct open target points to a concrete helper in `test_spec/create_scripts.py`.",
    ],
    expectedDifficulty: "medium",
    notes: [
      "Holdout fixture for done-work avoidance with a rich packaging-template distractor.",
      "The correct answer should come from the open script-generation work, not the closed packaging template.",
    ],
    expectedWorkId: "Ta9qD2",
    expectedWorkTitle: "Verify test-spec script helpers stay inside the fixture root",
    expectedWorkStatus: "active",
    expectedNextStep: "Open `swebench/harness/test_spec/create_scripts.py` and identify the first helper that writes files outside the immediate test-spec staging path, if any.",
    acceptableOtherCandidateWorkIds: ["Va1mK3", "Px4rL8", "Cb7mN1"],
    gradingNotes: [
      "Reject Px4rL8 because it is closed even though it has the richest artifact set in the fixture.",
      "The correct target is the open helper-audit work with the sharper next step.",
    ],
    works: [
      activeWork({
        id: "Ta9qD2",
        title: "Verify test-spec script helpers stay inside the fixture root",
        impact: "high",
        startDirRel: "swebench/harness/test_spec",
        scopeRelPaths: ["swebench/harness/test_spec/create_scripts.py", "swebench/harness/test_spec/utils.py"],
        summary: "Narrowed the test-spec audit to the helpers that might write outside the staged fixture path, but the first risky helper is not frozen yet.",
        tags: ["benchmark", "test-spec", "runner"],
        createdAt: "2026-03-28T14:15:00.000Z",
        updatedAt: "2026-03-29T08:05:00.000Z",
        notes: [
          "This is the best resumable target because it names the exact helper boundary that could break fixture locality.",
          "The packaging template work is done and should remain closed.",
        ],
        planBody: "## Scope\n\nFreeze whether any test-spec helper escapes the staged fixture root.\n\n## Steps\n\n1. Open `swebench/harness/test_spec/create_scripts.py`.\n2. Find the first helper that writes files outside the staged path, if any.\n3. Record that result for the holdout runner note.\n\n## Testing\n\nKeep the audit scoped to fixture-local write boundaries only.",
      }),
      activeWork({
        id: "Va1mK3",
        title: "Collect fixture-root assumptions from test-spec utils",
        impact: "medium",
        startDirRel: "swebench/harness/test_spec",
        scopeRelPaths: ["swebench/harness/test_spec/utils.py", "docs/reference/harness.md"],
        summary: "Collected the broad fixture-root assumptions from the test-spec utilities, but the sharper next action remains inside `create_scripts.py`.",
        tags: ["benchmark", "test-spec", "docs"],
        createdAt: "2026-03-28T14:05:00.000Z",
        updatedAt: "2026-03-29T07:20:00.000Z",
        notes: [
          "This open supporting work is plausible, but it is broader and less precise than the helper-boundary audit.",
        ],
        planBody: "## Scope\n\nKeep the broad utility assumptions visible, but subordinate them to the sharper helper-boundary audit.\n\n## Steps\n\n1. Wait for the `create_scripts.py` audit to freeze.\n2. Fold the result into the broader utility note.\n\n## Testing\n\nDo not promote this support note over the direct helper audit.",
      }),
      doneWork({
        id: "Px4rL8",
        title: "Assemble artifact-rich fixture packaging template",
        impact: "high",
        startDirRel: "docs",
        scopeRelPaths: ["docs/benchmark-environment-format.md", "docs/guides/evaluation.md"],
        summary: "Finished the artifact-rich template that future fixtures can follow; this is intentionally a closed packaging distractor.",
        tags: ["benchmark", "template", "done"],
        createdAt: "2026-03-27T23:10:00.000Z",
        updatedAt: "2026-03-28T23:55:00.000Z",
        notes: [
          "This packaging template is artifact-rich on purpose so the holdout can test whether the model still avoids closed work.",
        ],
        summaryBody: "Built the artifact-rich fixture packaging template with strong examples for manifests, state roots, workdocs, and freeze rules.",
        designBody: "The template prioritizes inspectable frozen artifacts so later dev and holdout fixtures can share one visible contract.",
        specBody: "Future fixture packs can copy the template, but the template work itself is done and should not be resumed.",
      }),
      blockedWork({
        id: "Cb7mN1",
        title: "Decide whether test-spec artifacts need publication-side trimming",
        impact: "low",
        startDirRel: "docs",
        scopeRelPaths: ["docs/reference/harness.md", "docs/guides/evaluation.md"],
        summary: "Publication-side trimming for test-spec artifacts is blocked on the paper appendix scope.",
        tags: ["benchmark", "paper", "blocked"],
        createdAt: "2026-03-28T14:25:00.000Z",
        updatedAt: "2026-03-29T07:00:00.000Z",
        notes: [
          "This blocked publication-format work should not outrank the direct helper-boundary audit.",
        ],
        planBody: "## Scope\n\nLeave publication-side trimming blocked until appendix scope is frozen.\n\n## Steps\n\n1. Freeze the appendix scope.\n2. Revisit trimming only if the appendix still needs raw helper output.\n\n## Testing\n\nKeep this blocked publication task below the direct code audit.",
      }),
    ],
    sessionLogs: [
      {
        id: "H005-01",
        workId: "Px4rL8",
        timestamp: "2026-03-28T23:55:00.000Z",
        summary: "Finished the artifact-rich packaging template and closed it as a reusable but non-resumable fixture asset.",
        status: "Done",
        changeType: "feature",
        affectedFiles: ["docs/benchmark-environment-format.md", "docs/guides/evaluation.md"],
        nextSteps: "Use the template as a reference only; do not reopen it for the next holdout step.",
      },
      {
        id: "H005-02",
        workId: "Va1mK3",
        timestamp: "2026-03-29T07:20:00.000Z",
        summary: "Collected broad test-spec utility assumptions, but left the sharper helper-boundary audit as the next priority.",
        status: "WIP",
        changeType: "investigation",
        affectedFiles: ["swebench/harness/test_spec/utils.py"],
        nextSteps: "Wait for the direct helper-boundary result from `create_scripts.py`.",
      },
      {
        id: "H005-03",
        workId: "Ta9qD2",
        timestamp: "2026-03-29T08:05:00.000Z",
        summary: "Reduced the test-spec locality audit to the first helper in `create_scripts.py` that might write outside the staged fixture path.",
        status: "WIP",
        changeType: "investigation",
        affectedFiles: ["swebench/harness/test_spec/create_scripts.py", "swebench/harness/test_spec/utils.py"],
        nextSteps: "Open `swebench/harness/test_spec/create_scripts.py` and identify the first helper that writes files outside the immediate test-spec staging path, if any.",
      },
    ],
  },
  {
    fixtureId: "holdout-006",
    family: "artifact_heavy_done_work",
    scenarioTitle: "Artifact-heavy done appendix should not outrank the active parser-selection audit",
    scenarioNote: "The done work looks rich and recent, but the correct answer remains an open parser-selection task.",
    activeContextWorkId: "Ns6pR4",
    questionTitle: "Rich done appendix vs open parser-selection audit",
    goal: "Check whether the model can ignore a rich recently updated done work and still choose the open code task with the better next step.",
    task: "Inspect the recent logs, active context, and workdocs. Choose the unfinished work that should be resumed now and avoid the done appendix.",
    evidenceHints: [
      "The done appendix has strong design and summary artifacts.",
      "The best open target points to a specific parser-selection boundary inside the harness.",
    ],
    expectedDifficulty: "medium",
    notes: [
      "Holdout fixture for artifact-heavy done-work distraction.",
      "The correct answer is the open parser-selection audit, not the recent done appendix.",
    ],
    expectedWorkId: "Lp2mT8",
    expectedWorkTitle: "Trace log parser selection before report collation",
    expectedWorkStatus: "active",
    expectedNextStep: "Open `swebench/harness/log_parsers/__init__.py` and trace how the first parser module is selected before results flow into reporting.",
    acceptableOtherCandidateWorkIds: ["Ns6pR4", "Qr7kV1", "Hd4mC9"],
    gradingNotes: [
      "Reject the done appendix even if it looks fresh and well-documented.",
      "Prefer the open parser-selection audit because it has the sharper harness-file next step.",
    ],
    works: [
      activeWork({
        id: "Lp2mT8",
        title: "Trace log parser selection before report collation",
        impact: "high",
        startDirRel: "swebench/harness/log_parsers",
        scopeRelPaths: ["swebench/harness/log_parsers/__init__.py", "swebench/harness/reporting.py"],
        summary: "Trimmed the parser-selection audit down to the first module-selection boundary before reporting, but the exact selection point still needs to be frozen.",
        tags: ["benchmark", "parser", "reporting"],
        createdAt: "2026-03-28T15:00:00.000Z",
        updatedAt: "2026-03-29T08:20:00.000Z",
        notes: [
          "This work is the strongest target because it ties parser selection directly to the reporting path used by holdout evaluation.",
          "Do not let the richer done appendix outrank this live harness task.",
        ],
        planBody: "## Scope\n\nFreeze the first parser-selection boundary before report collation.\n\n## Steps\n\n1. Open `swebench/harness/log_parsers/__init__.py`.\n2. Trace how the first parser module is selected.\n3. Confirm where reporting consumes that output.\n\n## Testing\n\nCite the exact parser-selection boundary and its handoff into reporting.",
      }),
      activeWork({
        id: "Ns6pR4",
        title: "Collect parser-family notes for the appendix",
        impact: "medium",
        startDirRel: "docs/reference",
        scopeRelPaths: ["docs/reference/harness.md", "docs/guides/evaluation.md"],
        summary: "Collected parser-family notes for the appendix, but they are downstream from the underlying parser-selection audit.",
        tags: ["benchmark", "docs", "parser"],
        createdAt: "2026-03-28T14:50:00.000Z",
        updatedAt: "2026-03-29T07:15:00.000Z",
        notes: [
          "This appendix note is open, but it is downstream and less precise than the parser-selection audit.",
        ],
        planBody: "## Scope\n\nKeep the appendix note in sync after the parser-selection boundary is frozen.\n\n## Steps\n\n1. Wait for the parser-selection boundary result.\n2. Fold that exact result into the appendix note.\n\n## Testing\n\nDo not let the appendix note outrank the underlying code audit.",
      }),
      doneWork({
        id: "Qr7kV1",
        title: "Finish artifact-heavy appendix for holdout outputs",
        impact: "high",
        startDirRel: "docs",
        scopeRelPaths: ["docs/guides/evaluation.md", "docs/reference/harness.md"],
        summary: "Completed the artifact-heavy appendix for holdout outputs with strong documentation artifacts.",
        tags: ["benchmark", "paper", "done"],
        createdAt: "2026-03-27T23:40:00.000Z",
        updatedAt: "2026-03-29T07:55:00.000Z",
        notes: [
          "This appendix is intentionally rich and recent so the holdout can test resistance to done-work distraction.",
        ],
        summaryBody: "Completed the appendix that explains frozen holdout outputs, contamination controls, and report bundles for the paper package.",
        designBody: "The appendix stays artifact-heavy so the benchmark can test whether models still avoid closed work with strong documentation.",
      }),
      blockedWork({
        id: "Hd4mC9",
        title: "Choose whether parser traces belong in the public release bundle",
        impact: "low",
        startDirRel: "docs",
        scopeRelPaths: ["docs/guides/evaluation.md", "docs/reference/harness.md"],
        summary: "Parser-trace publication is blocked on the release-bundle policy for raw traces.",
        tags: ["benchmark", "trace", "blocked"],
        createdAt: "2026-03-28T15:10:00.000Z",
        updatedAt: "2026-03-29T06:50:00.000Z",
        notes: [
          "This publication-format work is blocked and should not outrank the parser-selection audit.",
        ],
        planBody: "## Scope\n\nLeave parser-trace publication blocked until the release-bundle policy is final.\n\n## Steps\n\n1. Freeze the release-bundle policy.\n2. Revisit parser-trace publication only if raw traces stay in scope.\n\n## Testing\n\nAvoid promoting this blocked publication task over the live parser-selection audit.",
      }),
    ],
    sessionLogs: [
      {
        id: "H006-01",
        workId: "Qr7kV1",
        timestamp: "2026-03-29T07:55:00.000Z",
        summary: "Closed the artifact-heavy appendix for holdout outputs and froze it as a paper asset rather than an active work item.",
        status: "Done",
        changeType: "docs",
        affectedFiles: ["docs/guides/evaluation.md", "docs/reference/harness.md"],
        nextSteps: "Leave the appendix closed and use it only as a reference artifact.",
      },
      {
        id: "H006-02",
        workId: "Ns6pR4",
        timestamp: "2026-03-29T07:15:00.000Z",
        summary: "Expanded the appendix-side parser notes, but kept them dependent on the underlying parser-selection audit.",
        status: "WIP",
        changeType: "docs",
        affectedFiles: ["docs/reference/harness.md"],
        nextSteps: "Wait for the parser-selection audit to freeze before extending the appendix note.",
      },
      {
        id: "H006-03",
        workId: "Lp2mT8",
        timestamp: "2026-03-29T08:20:00.000Z",
        summary: "Reduced the parser audit to the first selection boundary inside `log_parsers/__init__.py` before reporting consumes the result.",
        status: "WIP",
        changeType: "investigation",
        affectedFiles: ["swebench/harness/log_parsers/__init__.py", "swebench/harness/reporting.py"],
        nextSteps: "Open `swebench/harness/log_parsers/__init__.py` and trace how the first parser module is selected before results flow into reporting.",
      },
    ],
  },
  {
    fixtureId: "holdout-007",
    family: "docs_heavy_wrong_target",
    scenarioTitle: "Verbose docs memo should not beat the narrow entrypoint comparison",
    scenarioNote: "This fixture makes the docs memo look detailed, but the actual best target is a narrow entrypoint comparison task.",
    activeContextWorkId: "Wp4mD7",
    questionTitle: "Docs-heavy memo vs narrow entrypoint comparison",
    goal: "Check whether the model can resist verbose docs and choose the narrower technical comparison work.",
    task: "Inspect the active context, notes, and recent logs. Decide which unfinished work should be resumed now.",
    evidenceHints: [
      "One open docs memo is wordy and broad but explicitly downstream from a technical comparison task.",
      "The best target names two exact entrypoint files to compare next.",
    ],
    expectedDifficulty: "medium",
    notes: [
      "Holdout fixture for resisting verbose docs evidence.",
      "The correct answer is the entrypoint comparison, not the broad methods memo.",
    ],
    expectedWorkId: "Xr8qN1",
    expectedWorkTitle: "Compare `run_api.py` and `run_evaluation.py` entrypoints for claim-lane scope",
    expectedWorkStatus: "active",
    expectedNextStep: "Open `swebench/inference/run_api.py` and `swebench/harness/run_evaluation.py` and note the first boundary where their responsibilities diverge.",
    acceptableOtherCandidateWorkIds: ["Wp4mD7", "Sa2vL5", "Rc6mK3"],
    gradingNotes: [
      "Reject the verbose docs memo because it is broader and intentionally downstream from the technical comparison.",
      "The correct next step explicitly compares two files and one divergence boundary.",
    ],
    works: [
      activeWork({
        id: "Xr8qN1",
        title: "Compare `run_api.py` and `run_evaluation.py` entrypoints for claim-lane scope",
        impact: "high",
        startDirRel: "swebench",
        scopeRelPaths: ["swebench/inference/run_api.py", "swebench/harness/run_evaluation.py"],
        summary: "Reduced the holdout scope question to one entrypoint comparison, but the first divergence boundary is not frozen yet.",
        tags: ["benchmark", "entrypoint", "scope"],
        createdAt: "2026-03-28T15:25:00.000Z",
        updatedAt: "2026-03-29T08:35:00.000Z",
        notes: [
          "This task is narrower and more executable than the broad methods memo because it names the two exact entrypoints to compare next.",
          "The best next step is to compare the first divergence boundary, not to keep drafting prose.",
        ],
        planBody: "## Scope\n\nFreeze the first divergence boundary between `run_api.py` and `run_evaluation.py` for claim-lane scope.\n\n## Steps\n\n1. Open both entrypoint files.\n2. Find the first boundary where responsibilities diverge.\n3. Record that divergence in a short scope note.\n\n## Testing\n\nKeep the comparison narrow and tied to exact files.",
      }),
      activeWork({
        id: "Wp4mD7",
        title: "Draft broad methods memo on API versus harness scope",
        impact: "medium",
        startDirRel: "docs",
        scopeRelPaths: ["docs/api/inference.md", "docs/api/harness.md"],
        summary: "Expanded a broad methods memo on API versus harness scope, but it should wait for the exact entrypoint divergence to freeze.",
        tags: ["benchmark", "docs", "paper"],
        createdAt: "2026-03-28T15:05:00.000Z",
        updatedAt: "2026-03-29T07:40:00.000Z",
        notes: [
          "This memo is intentionally verbose but still downstream from the narrower entrypoint comparison.",
          "Do not resume this prose task before the exact divergence boundary is frozen.",
        ],
        planBody: "## Scope\n\nKeep the methods memo open but subordinate it to the entrypoint comparison.\n\n## Steps\n\n1. Wait for the exact divergence boundary.\n2. Fold that finding into the memo.\n\n## Testing\n\nDo not let broad prose outrank the sharper file-level comparison.",
        designBody: "The methods memo should summarize frozen technical findings, not invent them ahead of time.",
      }),
      doneWork({
        id: "Sa2vL5",
        title: "Archive old live-workspace scope notes",
        impact: "low",
        startDirRel: "docs",
        scopeRelPaths: ["docs/api/inference.md", "docs/api/harness.md"],
        summary: "Archived the old live-workspace scope notes from earlier diagnostic work.",
        tags: ["benchmark", "archive", "done"],
        createdAt: "2026-03-27T20:55:00.000Z",
        updatedAt: "2026-03-28T20:40:00.000Z",
        notes: [
          "This archival cleanup is closed and should not be resumed.",
        ],
        summaryBody: "Archived the earlier live-workspace scope notes so the holdout lane no longer confuses old diagnostic assumptions with the new fixture-first protocol.",
      }),
      blockedWork({
        id: "Rc6mK3",
        title: "Choose paper figure for entrypoint comparison",
        impact: "low",
        startDirRel: "docs/assets",
        scopeRelPaths: ["docs/assets/evaluation.md", "docs/api/harness.md"],
        summary: "Figure choice for the entrypoint comparison is blocked on whether the paper includes flow diagrams at all.",
        tags: ["benchmark", "paper", "blocked"],
        createdAt: "2026-03-28T15:35:00.000Z",
        updatedAt: "2026-03-29T06:45:00.000Z",
        notes: [
          "This figure-selection task is blocked and should not outrank the actual technical comparison.",
        ],
        planBody: "## Scope\n\nKeep figure selection blocked until the paper layout is frozen.\n\n## Steps\n\n1. Freeze the paper layout.\n2. Revisit the figure choice only if diagrams remain in scope.\n\n## Testing\n\nDo not promote this blocked figure task over the live technical comparison.",
      }),
    ],
    sessionLogs: [
      {
        id: "H007-01",
        workId: "Wp4mD7",
        timestamp: "2026-03-29T07:40:00.000Z",
        summary: "Expanded the broad API-versus-harness memo but kept placeholders where the exact divergence boundary still belongs.",
        status: "WIP",
        changeType: "docs",
        affectedFiles: ["docs/api/inference.md", "docs/api/harness.md"],
        nextSteps: "Wait for the exact divergence boundary before extending the memo.",
      },
      {
        id: "H007-02",
        workId: "Xr8qN1",
        timestamp: "2026-03-29T08:35:00.000Z",
        summary: "Reduced the scope question to the first divergence boundary between `run_api.py` and `run_evaluation.py`.",
        status: "WIP",
        changeType: "investigation",
        affectedFiles: ["swebench/inference/run_api.py", "swebench/harness/run_evaluation.py"],
        nextSteps: "Open `swebench/inference/run_api.py` and `swebench/harness/run_evaluation.py` and note the first boundary where their responsibilities diverge.",
      },
    ],
  },
  {
    fixtureId: "holdout-008",
    family: "two_plausible_active_works",
    scenarioTitle: "Two active works look plausible, but the narrower prepare-images audit should win",
    scenarioNote: "Both active works are real contenders; the correct answer is the one with the narrower, more executable next step.",
    activeContextWorkId: "Qp5mT2",
    questionTitle: "Two plausible active works require precise tie-breaking",
    goal: "Check whether the model can choose between two plausible active works by favoring the narrower next step.",
    task: "Inspect the active context, workdocs, and recent logs. Choose the single best work to resume now.",
    evidenceHints: [
      "Two active works are high-impact and recent.",
      "The winner is the work with the narrower prepare-images boundary, not the broader repo-coverage plan.",
    ],
    expectedDifficulty: "hard",
    notes: [
      "Holdout fixture for tie-breaking between two genuinely plausible active works.",
      "The correct answer is the narrower prepare-images audit with the more executable next step.",
    ],
    expectedWorkId: "Pi7qR4",
    expectedWorkTitle: "Trace `prepare_images.py` before the first reusable build decision",
    expectedWorkStatus: "active",
    expectedNextStep: "Open `swebench/harness/prepare_images.py` and identify the first decision point that controls whether an image build can be reused across runs.",
    acceptableOtherCandidateWorkIds: ["Qp5mT2", "Kr1vL9", "Yd4mC6"],
    gradingNotes: [
      "Reject the broader repo-coverage plan even though it is also active and high impact.",
      "The correct next step starts with one file and one decision point inside `prepare_images.py`.",
    ],
    works: [
      activeWork({
        id: "Pi7qR4",
        title: "Trace `prepare_images.py` before the first reusable build decision",
        impact: "high",
        startDirRel: "swebench/harness",
        scopeRelPaths: ["swebench/harness/prepare_images.py", "swebench/harness/docker_build.py"],
        summary: "Narrowed the image-prep audit to the first reusable-build decision point, but that decision is not frozen yet.",
        tags: ["benchmark", "images", "reuse"],
        createdAt: "2026-03-28T15:55:00.000Z",
        updatedAt: "2026-03-29T08:45:00.000Z",
        notes: [
          "This work should beat the broader planning task because the next action is one-file and one-decision-point specific.",
          "The tie-breaker is precision, not impact or breadth.",
        ],
        planBody: "## Scope\n\nFreeze the first reusable-build decision inside `prepare_images.py`.\n\n## Steps\n\n1. Open `swebench/harness/prepare_images.py`.\n2. Find the first decision point that controls reusable image builds.\n3. Note how that decision feeds `docker_build.py`.\n\n## Testing\n\nKeep the audit scoped to the first reusable-build decision only.",
      }),
      activeWork({
        id: "Qp5mT2",
        title: "Plan broader repo coverage for image-prep audits",
        impact: "high",
        startDirRel: "docs",
        scopeRelPaths: ["docs/reference/harness.md", "docs/guides/docker_setup.md"],
        summary: "Drafted the broader repo-coverage plan for image-prep audits, but the exact reusable-build boundary still comes first.",
        tags: ["benchmark", "planning", "infra"],
        createdAt: "2026-03-28T15:45:00.000Z",
        updatedAt: "2026-03-29T08:00:00.000Z",
        notes: [
          "This planning work is a plausible contender, but it is intentionally broader and less executable than the prepare-images audit.",
        ],
        planBody: "## Scope\n\nKeep the broader coverage plan open, but subordinate it to the narrower prepare-images audit.\n\n## Steps\n\n1. Wait for the reusable-build decision to freeze.\n2. Expand the broader plan using that result.\n\n## Testing\n\nDo not let broad planning outrank the file-level audit.",
      }),
      doneWork({
        id: "Kr1vL9",
        title: "Archive old image-cache rehearsal notes",
        impact: "low",
        startDirRel: "docs",
        scopeRelPaths: ["docs/guides/docker_setup.md"],
        summary: "Archived earlier image-cache rehearsal notes from the live-workspace phase.",
        tags: ["benchmark", "archive", "done"],
        createdAt: "2026-03-27T21:50:00.000Z",
        updatedAt: "2026-03-28T19:30:00.000Z",
        notes: [
          "This archival work is done and should stay closed.",
        ],
        summaryBody: "Archived the earlier image-cache rehearsal notes so the holdout lane no longer depends on live-workspace diagnostics.",
      }),
      blockedWork({
        id: "Yd4mC6",
        title: "Choose publication wording for reusable-build caveats",
        impact: "low",
        startDirRel: "docs",
        scopeRelPaths: ["docs/guides/docker_setup.md", "docs/llm-reentry-benchmark.md"],
        summary: "Publication wording for reusable-build caveats is blocked on the final methods outline.",
        tags: ["benchmark", "paper", "blocked"],
        createdAt: "2026-03-28T16:00:00.000Z",
        updatedAt: "2026-03-29T06:55:00.000Z",
        notes: [
          "This wording task is blocked and should not outrank either active contender.",
        ],
        planBody: "## Scope\n\nLeave publication wording blocked until the methods outline is final.\n\n## Steps\n\n1. Freeze the methods outline.\n2. Revisit reusable-build caveat wording if needed.\n\n## Testing\n\nDo not promote this blocked wording task over the active technical work.",
      }),
    ],
    sessionLogs: [
      {
        id: "H008-01",
        workId: "Qp5mT2",
        timestamp: "2026-03-29T08:00:00.000Z",
        summary: "Extended the broader image-prep coverage plan but left the central reusable-build boundary unresolved.",
        status: "WIP",
        changeType: "docs",
        affectedFiles: ["docs/reference/harness.md", "docs/guides/docker_setup.md"],
        nextSteps: "Wait for the narrower reusable-build audit before expanding the broader plan.",
      },
      {
        id: "H008-02",
        workId: "Pi7qR4",
        timestamp: "2026-03-29T08:45:00.000Z",
        summary: "Reduced the image-prep audit to the first decision point in `prepare_images.py` that controls reusable builds across runs.",
        status: "WIP",
        changeType: "investigation",
        affectedFiles: ["swebench/harness/prepare_images.py", "swebench/harness/docker_build.py"],
        nextSteps: "Open `swebench/harness/prepare_images.py` and identify the first decision point that controls whether an image build can be reused across runs.",
      },
    ],
  },
  {
    fixtureId: "holdout-009",
    family: "cross_scope_distractor",
    scenarioTitle: "Broad multi-repo roster work should not outrank the harness-reference citation freeze",
    scenarioNote: "This fixture checks that a broad cross-scope planning task does not beat a smaller citation-freeze task that is actually next.",
    activeContextWorkId: "Ud6pV2",
    questionTitle: "Broad roster planning vs citation freeze",
    goal: "Check whether the model can choose a smaller citation-freeze task over a broad cross-scope planning memo.",
    task: "Inspect the open works, recent logs, and notes. Choose the unfinished work that should actually be resumed now.",
    evidenceHints: [
      "One active work is broad and strategic but explicitly waiting for narrower citation work.",
      "The correct target points to exact reference files that need to be cited next.",
    ],
    expectedDifficulty: "medium",
    notes: [
      "Holdout fixture for broad-scope distraction.",
      "The correct answer is the narrow reference-citation freeze, not the broader model-roster planning memo.",
    ],
    expectedWorkId: "Cf9mR7",
    expectedWorkTitle: "Freeze harness-reference citations for the methods appendix",
    expectedWorkStatus: "active",
    expectedNextStep: "Open `docs/reference/harness.md` and `docs/api/harness.md` and write the exact citations that describe the frozen harness surface.",
    acceptableOtherCandidateWorkIds: ["Ud6pV2", "Gh3mL8", "Pr1qD4"],
    gradingNotes: [
      "Reject the broad roster-planning memo even though it is active and cross-scope.",
      "The correct next step should start with exact citations from the two harness reference files.",
    ],
    works: [
      activeWork({
        id: "Cf9mR7",
        title: "Freeze harness-reference citations for the methods appendix",
        impact: "medium",
        startDirRel: "docs",
        scopeRelPaths: ["docs/reference/harness.md", "docs/api/harness.md"],
        summary: "Reduced the appendix evidence task to the exact harness-reference citations that still need to be frozen.",
        tags: ["benchmark", "paper", "citations"],
        createdAt: "2026-03-28T16:20:00.000Z",
        updatedAt: "2026-03-29T08:55:00.000Z",
        notes: [
          "This smaller citation-freeze task is the right next action because the broader roster memo is waiting on it.",
          "The next step is still concrete and exact: cite two reference files, not expand planning prose.",
        ],
        planBody: "## Scope\n\nFreeze the exact harness-reference citations used by the methods appendix.\n\n## Steps\n\n1. Open `docs/reference/harness.md` and `docs/api/harness.md`.\n2. Extract the exact citations that describe the frozen harness surface.\n3. Record those citations in the appendix note.\n\n## Testing\n\nKeep the output to exact citations rather than general summaries.",
      }),
      activeWork({
        id: "Ud6pV2",
        title: "Plan cross-vendor roster narrative for the holdout section",
        impact: "high",
        startDirRel: "docs",
        scopeRelPaths: ["docs/benchmark-model-roster.json", "docs/llm-reentry-benchmark.md"],
        summary: "Started the broader roster narrative for the holdout section, but left placeholders for exact harness-reference citations.",
        tags: ["benchmark", "paper", "roster"],
        createdAt: "2026-03-28T16:05:00.000Z",
        updatedAt: "2026-03-29T08:10:00.000Z",
        notes: [
          "This broader narrative is open, but it explicitly depends on the narrower harness-reference citations first.",
        ],
        planBody: "## Scope\n\nKeep the cross-vendor roster narrative open but wait for the exact harness-reference citations.\n\n## Steps\n\n1. Freeze the exact harness citations.\n2. Fold them into the roster narrative.\n\n## Testing\n\nDo not let broad narrative work outrank the narrower citation freeze.",
      }),
      doneWork({
        id: "Gh3mL8",
        title: "Archive old model-family comparison scratchpad",
        impact: "low",
        startDirRel: "docs",
        scopeRelPaths: ["docs/benchmark-model-roster.json"],
        summary: "Closed the old scratchpad for model-family comparisons from earlier dev-only work.",
        tags: ["benchmark", "archive", "done"],
        createdAt: "2026-03-27T22:20:00.000Z",
        updatedAt: "2026-03-28T20:05:00.000Z",
        notes: [
          "This scratchpad is closed and should not be resumed.",
        ],
        summaryBody: "Archived the old model-family scratchpad so the holdout section can rely only on the frozen roster contract.",
      }),
      blockedWork({
        id: "Pr1qD4",
        title: "Decide whether citation snippets can appear verbatim in the appendix",
        impact: "low",
        startDirRel: "docs",
        scopeRelPaths: ["docs/reference/harness.md", "docs/api/harness.md"],
        summary: "Citation-snippet formatting is blocked on the paper style policy for verbatim excerpts.",
        tags: ["benchmark", "paper", "blocked"],
        createdAt: "2026-03-28T16:25:00.000Z",
        updatedAt: "2026-03-29T07:05:00.000Z",
        notes: [
          "This style-policy task is blocked and should not outrank the citation freeze itself.",
        ],
        planBody: "## Scope\n\nLeave citation-snippet formatting blocked until the paper style policy is final.\n\n## Steps\n\n1. Freeze the paper style policy.\n2. Revisit verbatim snippets only if they remain allowed.\n\n## Testing\n\nDo not promote blocked formatting policy over the direct citation-freeze task.",
      }),
    ],
    sessionLogs: [
      {
        id: "H009-01",
        workId: "Ud6pV2",
        timestamp: "2026-03-29T08:10:00.000Z",
        summary: "Expanded the holdout roster narrative but left the harness-reference citations as unresolved placeholders.",
        status: "WIP",
        changeType: "docs",
        affectedFiles: ["docs/benchmark-model-roster.json", "docs/llm-reentry-benchmark.md"],
        nextSteps: "Freeze the exact harness-reference citations before extending the narrative.",
      },
      {
        id: "H009-02",
        workId: "Cf9mR7",
        timestamp: "2026-03-29T08:55:00.000Z",
        summary: "Reduced the appendix evidence task to the exact harness-reference citations needed for the methods section.",
        status: "WIP",
        changeType: "docs",
        affectedFiles: ["docs/reference/harness.md", "docs/api/harness.md"],
        nextSteps: "Open `docs/reference/harness.md` and `docs/api/harness.md` and write the exact citations that describe the frozen harness surface.",
      },
    ],
  },
  {
    fixtureId: "holdout-010",
    family: "next_step_precision",
    scenarioTitle: "The correct work is clear, but the next step must stay precise",
    scenarioNote: "This holdout keeps work selection easy but stresses exact next-step wording with a two-part instruction.",
    activeContextWorkId: "Ze5mK1",
    questionTitle: "Correct work is obvious, but vague next steps should not pass",
    goal: "Check whether the model preserves a precise two-part next step instead of collapsing it into a vague summary.",
    task: "Choose the correct unfinished work to resume now and state the exact next concrete step as precisely as the evidence supports.",
    evidenceHints: [
      "The selected work is not ambiguous.",
      "Full credit requires keeping both parts of the next step: enumerate the helper boundary and compare it against the staging utility.",
    ],
    expectedDifficulty: "medium",
    notes: [
      "Holdout fixture for next-step precision rather than work-selection ambiguity.",
      "The selected work is obvious; the challenge is preserving the exact two-part next step.",
    ],
    expectedWorkId: "Ze5mK1",
    expectedWorkTitle: "Freeze the first staging-helper boundary for test-spec utilities",
    expectedWorkStatus: "active",
    expectedNextStep: "Open `swebench/harness/test_spec/utils.py`, identify the first staging helper boundary, and compare it against `swebench/harness/test_spec/create_scripts.py` before writing the holdout note.",
    acceptableOtherCandidateWorkIds: ["La2vR7", "Nd8mC4", "Sq1pL6"],
    acceptableNextStepSummaries: [
      "Open `swebench/harness/test_spec/utils.py`, identify the first staging helper boundary, and compare it against `swebench/harness/test_spec/create_scripts.py` before writing the holdout note.",
      "Read `swebench/harness/test_spec/utils.py`, find the first staging helper boundary, then compare it against `swebench/harness/test_spec/create_scripts.py` before writing the note.",
    ],
    gradingNotes: [
      "The work selection itself should be straightforward.",
      "A vague answer about improving staging helpers should not receive full credit; both parts of the next step must remain present.",
    ],
    works: [
      activeWork({
        id: "Ze5mK1",
        title: "Freeze the first staging-helper boundary for test-spec utilities",
        impact: "high",
        startDirRel: "swebench/harness/test_spec",
        scopeRelPaths: ["swebench/harness/test_spec/utils.py", "swebench/harness/test_spec/create_scripts.py"],
        summary: "Narrowed the staging-helper audit to the first boundary in `utils.py`, but the comparison against `create_scripts.py` is still the required second step.",
        tags: ["benchmark", "test-spec", "precision"],
        createdAt: "2026-03-28T16:40:00.000Z",
        updatedAt: "2026-03-29T09:05:00.000Z",
        notes: [
          "This is the obvious target, but the point of the fixture is to keep the next step precise rather than letting it collapse into a vague summary.",
          "Full credit depends on preserving both actions: identify the boundary in `utils.py` and compare it against `create_scripts.py`.",
        ],
        planBody: "## Scope\n\nFreeze the first staging-helper boundary and compare it across the two test-spec helper files.\n\n## Steps\n\n1. Open `swebench/harness/test_spec/utils.py`.\n2. Identify the first staging helper boundary.\n3. Compare that boundary against `swebench/harness/test_spec/create_scripts.py`.\n4. Write the resulting holdout note.\n\n## Testing\n\nDo not drop the cross-file comparison from the next step.",
      }),
      activeWork({
        id: "La2vR7",
        title: "Write broader note on test-spec staging assumptions",
        impact: "medium",
        startDirRel: "docs/reference",
        scopeRelPaths: ["docs/reference/harness.md", "swebench/harness/test_spec/utils.py"],
        summary: "Started a broader note on staging assumptions, but it is less exact than the direct helper-boundary freeze.",
        tags: ["benchmark", "docs", "test-spec"],
        createdAt: "2026-03-28T16:30:00.000Z",
        updatedAt: "2026-03-29T08:00:00.000Z",
        notes: [
          "This supporting note is weaker because it hides the exact two-part next step that the real target preserves.",
        ],
        planBody: "## Scope\n\nKeep the broad staging note ready after the exact helper boundary is frozen.\n\n## Steps\n\n1. Wait for the direct helper-boundary result.\n2. Fold it into the broader staging note.\n\n## Testing\n\nDo not promote the broad note over the direct cross-file helper comparison.",
      }),
      doneWork({
        id: "Nd8mC4",
        title: "Archive temporary staging-helper scratch notes",
        impact: "low",
        startDirRel: "docs",
        scopeRelPaths: ["docs/reference/harness.md"],
        summary: "Closed the temporary scratch notes from the early staging-helper exploration.",
        tags: ["benchmark", "archive", "done"],
        createdAt: "2026-03-27T22:35:00.000Z",
        updatedAt: "2026-03-28T19:20:00.000Z",
        notes: [
          "The temporary scratch notes are done and should remain closed.",
        ],
        summaryBody: "Archived the early staging-helper scratch notes so the holdout pack now points only to frozen evidence.",
      }),
      blockedWork({
        id: "Sq1pL6",
        title: "Choose appendix wording for staging-helper caveats",
        impact: "low",
        startDirRel: "docs",
        scopeRelPaths: ["docs/reference/harness.md", "docs/llm-reentry-benchmark.md"],
        summary: "Appendix wording for staging-helper caveats is blocked on the final methods section structure.",
        tags: ["benchmark", "paper", "blocked"],
        createdAt: "2026-03-28T16:45:00.000Z",
        updatedAt: "2026-03-29T07:10:00.000Z",
        notes: [
          "This blocked wording task is a distractor only and should not outrank the direct helper-boundary freeze.",
        ],
        planBody: "## Scope\n\nLeave appendix wording blocked until the methods structure is final.\n\n## Steps\n\n1. Freeze the methods structure.\n2. Revisit staging-helper caveat wording only if needed.\n\n## Testing\n\nDo not let this blocked wording task outrank the direct helper-boundary work.",
      }),
    ],
    sessionLogs: [
      {
        id: "H010-01",
        workId: "La2vR7",
        timestamp: "2026-03-29T08:00:00.000Z",
        summary: "Expanded the broad staging note, but left the exact helper-boundary comparison unresolved.",
        status: "WIP",
        changeType: "docs",
        affectedFiles: ["docs/reference/harness.md"],
        nextSteps: "Wait for the exact helper-boundary comparison before extending the broad note.",
      },
      {
        id: "H010-02",
        workId: "Ze5mK1",
        timestamp: "2026-03-29T09:05:00.000Z",
        summary: "Reduced the staging-helper audit to the first boundary in `utils.py` and kept the cross-file comparison against `create_scripts.py` as the required second step.",
        status: "WIP",
        changeType: "investigation",
        affectedFiles: ["swebench/harness/test_spec/utils.py", "swebench/harness/test_spec/create_scripts.py"],
        nextSteps: "Open `swebench/harness/test_spec/utils.py`, identify the first staging helper boundary, and compare it against `swebench/harness/test_spec/create_scripts.py` before writing the holdout note.",
      },
    ],
  },
];

async function materializeFixture(
  fixture: FixtureDefinition,
  fixturesRoot: string,
  vendorRoot: string,
  repoCommit: string,
): Promise<void> {
  const fixtureRoot = path.join(fixturesRoot, fixture.fixtureId);
  const workspaceRoot = path.join(fixtureRoot, "workspace");
  const repoRoot = path.join(workspaceRoot, "repos", "SWE-bench");
  const tasklogRoot = path.join(workspaceRoot, ".tasklog");
  const workdocsRoot = path.join(workspaceRoot, "workdocs");

  await fs.mkdir(path.join(workspaceRoot, "repos"), { recursive: true });
  await fs.mkdir(tasklogRoot, { recursive: true });
  await fs.mkdir(workdocsRoot, { recursive: true });
  await copyRepoSnapshot(vendorRoot, repoRoot);

  const manifest = {
    version: 1,
    fixture_id: fixture.fixtureId,
    fixture_type: "tasklog_reentry_workspace",
    split: "holdout",
    benchmark_type: "tasklog_reentry_holdout",
    scenario_title: fixture.scenarioTitle,
    scenario_family: fixture.family,
    scenario_note: fixture.scenarioNote,
    workspace_root: workspaceRoot,
    repo_snapshots: [
      {
        repo_id: "SWE-bench",
        source_vendor_path: vendorRoot,
        fixture_repo_path: repoRoot,
        upstream_commit: repoCommit,
      },
    ],
    state_paths: {
      tasklog_root: tasklogRoot,
      works_file: path.join(tasklogRoot, "works.json"),
      session_log_json: path.join(tasklogRoot, "session-log.json"),
      session_log_markdown: path.join(tasklogRoot, "session-log.md"),
      active_context_file: path.join(tasklogRoot, "active-context.json"),
      workdocs_root: workdocsRoot,
    },
    contamination_controls: [
      "fixture-local repo copy excludes .git and transient build state",
      "fixture has its own seeded .tasklog root",
      "fixture has its own seeded workdocs root",
      "claim-lane runs should mount only this fixture root",
      "questions and answer keys are frozen before any holdout run",
    ],
  };

  const worksFile = fixture.works.map((work) => ({
    work_id: work.id,
    title: work.title,
    slug: slugify(work.title),
    status: work.status,
    impact: work.impact,
    start_dir: repoPath(workspaceRoot, work.startDirRel),
    scope_paths: work.scopeRelPaths.map((scopeRelPath) => repoPath(workspaceRoot, scopeRelPath)),
    summary: work.summary,
    tags: work.tags,
    created_at: work.createdAt,
    updated_at: work.updatedAt,
  }));

  const sessionLogJson = fixture.sessionLogs.map((log) => ({
    id: log.id,
    work_id: log.workId,
    timestamp: log.timestamp,
    summary: log.summary,
    status: log.status,
    change_type: log.changeType,
    affected_files: log.affectedFiles,
    tags: worksFile.find((work) => work.work_id === log.workId)?.tags ?? [],
    next_steps: log.nextSteps,
    blockers: log.blockers ?? "",
    related_log_ids: [],
    supersedes_log_id: "",
    revision: 1,
    created_at: log.timestamp,
    updated_at: log.timestamp,
  }));

  const activeContext = {
    active_work_id: fixture.activeContextWorkId,
    project_root: workspaceRoot,
    updated_at:
      fixture.sessionLogs.find((log) => log.workId === fixture.activeContextWorkId)?.timestamp
      ?? fixture.works.find((work) => work.id === fixture.activeContextWorkId)?.updatedAt
      ?? fixture.works[0]?.updatedAt,
  };

  const questionId = `${fixture.fixtureId}-q01`;
  const questions = {
    version: 1,
    fixture_id: fixture.fixtureId,
    split: "holdout",
    benchmark_type: "tasklog_reentry_holdout",
    answer_contract: {
      required_fields: [
        "selected_work_id",
        "selected_work_title",
        "work_status",
        "next_step_summary",
      ],
      optional_fields: [
        "selection_rationale",
        "other_candidate_work_ids",
        "ambiguity_notes",
      ],
    },
    shared_prompt: SHARED_PROMPT,
    questions: [
      {
        question_id: questionId,
        family: fixture.family,
        title: fixture.questionTitle,
        goal: fixture.goal,
        task: fixture.task,
        expected_difficulty: fixture.expectedDifficulty,
        evidence_hints: fixture.evidenceHints,
      },
    ],
  };

  const answerKey = {
    version: 1,
    fixture_id: fixture.fixtureId,
    split: "holdout",
    benchmark_type: "tasklog_reentry_holdout",
    notes: fixture.notes,
    answers: [
      {
        question_id: questionId,
        family: fixture.family,
        expected_answer: {
          selected_work_id: fixture.expectedWorkId,
          selected_work_title: fixture.expectedWorkTitle,
          work_status: fixture.expectedWorkStatus,
          next_step_summary: fixture.expectedNextStep,
        },
        acceptable_next_step_summaries: fixture.acceptableNextStepSummaries,
        grading_notes: fixture.gradingNotes,
        acceptable_other_candidate_work_ids: fixture.acceptableOtherCandidateWorkIds,
      },
    ],
  };

  await writeJsonFile(path.join(fixtureRoot, "fixture-manifest.json"), manifest);
  await writeJsonFile(path.join(fixtureRoot, "questions.json"), questions);
  await writeJsonFile(path.join(fixtureRoot, "answer-key.json"), answerKey);
  await writeJsonFile(path.join(tasklogRoot, "works.json"), worksFile);
  await writeJsonFile(path.join(tasklogRoot, "session-log.json"), sessionLogJson);
  await writeJsonFile(path.join(tasklogRoot, "active-context.json"), activeContext);
  await fs.writeFile(path.join(tasklogRoot, "session-log.md"), sessionLogMarkdown(fixture.sessionLogs), "utf8");
  await fs.writeFile(
    path.join(fixtureRoot, "README.md"),
    [
      "# Tasklog Holdout Fixture",
      "",
      `Fixture id: \`${fixture.fixtureId}\``,
      `Family: \`${fixture.family}\``,
      "",
      fixture.scenarioNote,
      "",
      "Frozen artifacts:",
      "- `fixture-manifest.json`",
      "- `questions.json`",
      "- `answer-key.json`",
      "- `workspace/.tasklog/`",
      "- `workspace/workdocs/`",
      "",
    ].join("\n"),
    "utf8",
  );

  for (const work of fixture.works) {
    const workdocDir = path.join(workdocsRoot, `${work.id}-${slugify(work.title)}`);
    await fs.mkdir(workdocDir, { recursive: true });
    await fs.writeFile(path.join(workdocDir, "notes.md"), writeNotesDoc(work, workspaceRoot), "utf8");
    for (const artifact of work.artifacts) {
      await fs.writeFile(
        path.join(workdocDir, `${artifact.kind}.md`),
        artifactBody(work, workspaceRoot, artifact),
        "utf8",
      );
    }
  }
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const fixturesRoot = path.join(options.labRoot, "fixtures");
  const vendorRoot = path.join(options.labRoot, "vendor", "SWE-bench");

  if (!(await pathExists(vendorRoot))) {
    throw new Error(`Missing vendor repo snapshot at ${vendorRoot}`);
  }

  const repoCommit = await readGitHead(vendorRoot);

  for (const fixture of HOLDOUT_FIXTURES) {
    const fixtureRoot = path.join(fixturesRoot, fixture.fixtureId);
    await ensureCleanDirectory(fixtureRoot, options.force);
    await materializeFixture(fixture, fixturesRoot, vendorRoot, repoCommit);
  }

  const packManifest = {
    version: 1,
    pack_id: "tasklog-swe-holdout-v1",
    created_at: new Date().toISOString(),
    split: "holdout",
    benchmark_type: "tasklog_reentry_holdout",
    fixture_count: HOLDOUT_FIXTURES.length,
    notes: [
      "This is the first frozen holdout pack for the Tasklog SWE-style re-entry benchmark.",
      "Fixtures are intentionally small, diverse, and frozen before any holdout runs.",
      "Do not tune the grader or prompts from holdout outcomes; return to the dev pack for calibration.",
    ],
    fixtures: HOLDOUT_FIXTURES.map((fixture) => ({
      fixture_id: fixture.fixtureId,
      family: fixture.family,
      scenario_title: fixture.scenarioTitle,
      active_context_work_id: fixture.activeContextWorkId,
      expected_work_id: fixture.expectedWorkId,
      expected_work_status: fixture.expectedWorkStatus,
      expected_work_title: fixture.expectedWorkTitle,
    })),
  };

  await writeJsonFile(path.join(fixturesRoot, "holdout-pack-manifest.json"), packManifest);

  console.log(JSON.stringify({
    lab_root: options.labRoot,
    fixtures_root: fixturesRoot,
    fixture_count: HOLDOUT_FIXTURES.length,
    fixture_ids: HOLDOUT_FIXTURES.map((fixture) => fixture.fixtureId),
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
