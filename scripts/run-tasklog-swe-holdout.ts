import { execFile as execFileCallback } from "node:child_process";
import { promises as fs } from "node:fs";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);

const DEFAULT_FIXTURES_ROOT = "/Users/Lab/Desktop/TasklogSweLab/fixtures";
const DEFAULT_RUNS_ROOT = "/Users/Lab/Desktop/TasklogSweLab/runs";
const DEFAULT_FIXTURE_IDS = Array.from({ length: 10 }, (_, index) => `holdout-${String(index + 1).padStart(3, "0")}`);
const RUNNER_NAME = "tasklog-swe-holdout-runner";
const RUNNER_VERSION = "2026-03-29";
const BENCHMARK_TYPE = "llm_reentry_understanding";

type ArmId =
  | "no_continuity_scope_scan"
  | "markdown_notebook_scan"
  | "json_state_scan"
  | "json_state_normalized_scan"
  | "tasklog_resume_plus_read_work_context";

interface CliOptions {
  fixturesRoot: string;
  fixtureIds: string[];
  arms: ArmId[];
  modelId: string;
  modelFamily: string;
  provider: string;
  reasoningSetting: string;
  outDir: string;
  maxRows?: number;
}

interface QuestionRow {
  question_id: string;
  family: string;
  title: string;
  goal: string;
  task: string;
  expected_difficulty: string;
  evidence_hints: string[];
}

interface QuestionPack {
  fixture_id: string;
  questions: QuestionRow[];
  shared_prompt: string;
}

interface ExpectedAnswer {
  selected_work_id: string;
  selected_work_title: string;
  work_status: string;
  next_step_summary: string;
}

interface AnswerKeyRow {
  question_id: string;
  family: string;
  expected_answer: ExpectedAnswer;
  acceptable_next_step_summaries?: string[];
}

interface AnswerKeyPack {
  fixture_id: string;
  answers: AnswerKeyRow[];
}

interface WorkRecord {
  work_id: string;
  title: string;
  slug: string;
  status: string;
  impact?: string;
  start_dir: string;
  scope_paths: string[];
  summary?: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

interface SessionLogEntry {
  id: string;
  work_id: string;
  timestamp: string;
  summary: string;
  status: string;
  change_type: string;
  affected_files?: string[];
  next_steps?: string;
  blockers?: string;
}

interface ActiveContext {
  active_work_id?: string;
  project_root?: string;
  updated_at?: string;
}

interface ModelAnswer {
  selected_work_id: string;
  selected_work_title: string;
  work_status: string;
  next_step_summary: string;
  selection_rationale: string;
  other_candidate_work_ids: string[];
  ambiguity_notes: string;
}

interface GradeResult {
  selected_work_id_match: boolean;
  selected_work_title_match: boolean;
  work_status_match: boolean;
  next_step_summary_match: boolean;
  strict_correct: boolean;
}

interface ArmDefinition {
  arm_id: ArmId;
  variant_label: string;
  display_label: string;
}

interface VariantPackRow {
  fixture_id: string;
  scenario_id: string;
  family: string;
  question_id: string;
  title: string;
  variant_label: string;
  arm_id: ArmId;
  display_label: string;
  prompt: string;
  payload: string;
  payload_metrics: {
    bytes: number;
    lines: number;
    est_tokens: number;
  };
  expected_answer: ExpectedAnswer;
  acceptable_next_step_summaries: string[];
}

interface ResponseRow {
  benchmark_type: string;
  split: string;
  fixture_id: string;
  scenario_id: string;
  question_id: string;
  family: string;
  title: string;
  variant_label: string;
  arm_id: ArmId;
  display_label: string;
  provider: string;
  model_id: string;
  model_family: string;
  reasoning_setting: string | null;
  runner_name: string;
  runner_version: string;
  run_id: string;
  run_started_at: string;
  run_finished_at: string;
  latency_ms: number;
  input_tokens: number | null;
  output_tokens: number | null;
  cache_creation_input_tokens: number | null;
  cache_read_input_tokens: number | null;
  estimated_cost_usd: number | null;
  payload_metrics: VariantPackRow["payload_metrics"];
  answer: ModelAnswer;
  grade: GradeResult;
}

const ARMS: ArmDefinition[] = [
  {
    arm_id: "no_continuity_scope_scan",
    variant_label: "A",
    display_label: "Workspace-Only",
  },
  {
    arm_id: "markdown_notebook_scan",
    variant_label: "B",
    display_label: "Notes Replay",
  },
  {
    arm_id: "json_state_scan",
    variant_label: "C",
    display_label: "Raw State",
  },
  {
    arm_id: "json_state_normalized_scan",
    variant_label: "D",
    display_label: "Normalized State",
  },
  {
    arm_id: "tasklog_resume_plus_read_work_context",
    variant_label: "E",
    display_label: "Tasklog Re-entry",
  },
];

function parseArgs(argv: string[]): CliOptions {
  let fixturesRoot = DEFAULT_FIXTURES_ROOT;
  let fixtureIds = [...DEFAULT_FIXTURE_IDS];
  let arms = ARMS.map((arm) => arm.arm_id);
  let modelId = "gpt-5.4-mini";
  let modelFamily = "gpt-5.4-mini";
  let provider = "openai";
  let reasoningSetting = "none";
  let outDir = path.join(
    DEFAULT_RUNS_ROOT,
    `holdout-${new Date().toISOString().replace(/[:.]/g, "-")}`,
  );
  let maxRows: number | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current === "--fixtures-root") {
      fixturesRoot = path.resolve(argv[index + 1] ?? fixturesRoot);
      index += 1;
      continue;
    }
    if (current === "--fixture-ids") {
      const raw = argv[index + 1];
      if (raw) {
        fixtureIds = raw.split(",").map((item) => item.trim()).filter(Boolean);
      }
      index += 1;
      continue;
    }
    if (current === "--arms") {
      const raw = argv[index + 1];
      if (raw) {
        const requested = raw.split(",").map((item) => item.trim()).filter(Boolean) as ArmId[];
        if (requested.length > 0) {
          arms = requested;
        }
      }
      index += 1;
      continue;
    }
    if (current === "--model-id") {
      modelId = argv[index + 1] ?? modelId;
      index += 1;
      continue;
    }
    if (current === "--model-family") {
      modelFamily = argv[index + 1] ?? modelFamily;
      index += 1;
      continue;
    }
    if (current === "--provider") {
      provider = argv[index + 1] ?? provider;
      index += 1;
      continue;
    }
    if (current === "--reasoning-setting") {
      reasoningSetting = argv[index + 1] ?? reasoningSetting;
      index += 1;
      continue;
    }
    if (current === "--out-dir") {
      outDir = path.resolve(argv[index + 1] ?? outDir);
      index += 1;
      continue;
    }
    if (current === "--max-rows") {
      const candidate = Number.parseInt(argv[index + 1] ?? "", 10);
      if (Number.isFinite(candidate) && candidate > 0) {
        maxRows = candidate;
      }
      index += 1;
      continue;
    }
  }

  return {
    fixturesRoot,
    fixtureIds,
    arms,
    modelId,
    modelFamily,
    provider,
    reasoningSetting,
    outDir,
    maxRows,
  };
}

function answerSchema(): Record<string, unknown> {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      selected_work_id: { type: "string" },
      selected_work_title: { type: "string" },
      work_status: { type: "string" },
      next_step_summary: { type: "string" },
      selection_rationale: { type: "string" },
      other_candidate_work_ids: {
        type: "array",
        items: { type: "string" },
      },
      ambiguity_notes: { type: "string" },
    },
    required: [
      "selected_work_id",
      "selected_work_title",
      "work_status",
      "next_step_summary",
      "selection_rationale",
      "other_candidate_work_ids",
      "ambiguity_notes",
    ],
  };
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function normalizeStringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => normalizeText(item)).filter((item) => item.length > 0)
    : [];
}

function normalizeNextStepForGrade(value: unknown): string {
  return normalizeText(value)
    .toLowerCase()
    .replace(/`/g, "")
    .replace(/\bswebench\/harness\b/g, "harness")
    .replace(/^the next concrete step is still to\s+/, "")
    .replace(/^the next concrete step is to\s+/, "")
    .replace(/\bcalled after\b/g, "after");
}

function normalizeWorkStatusForGrade(value: unknown): string {
  const normalized = normalizeText(value).toLowerCase();
  if (normalized === "wip" || normalized === "in_progress" || normalized === "in-progress") {
    return "active";
  }
  if (normalized === "complete" || normalized === "completed" || normalized === "closed") {
    return "done";
  }
  return normalized;
}

function normalizeAnswer(parsed: Record<string, unknown>): ModelAnswer {
  return {
    selected_work_id: normalizeText(parsed.selected_work_id),
    selected_work_title: normalizeText(parsed.selected_work_title),
    work_status: normalizeText(parsed.work_status),
    next_step_summary: normalizeText(parsed.next_step_summary),
    selection_rationale: normalizeText(parsed.selection_rationale),
    other_candidate_work_ids: normalizeStringList(parsed.other_candidate_work_ids),
    ambiguity_notes: normalizeText(parsed.ambiguity_notes),
  };
}

function gradeAnswer(
  actual: ModelAnswer,
  expected: ExpectedAnswer,
  acceptableNextStepSummaries: string[] = [],
): GradeResult {
  const selectedWorkIdMatch = actual.selected_work_id === expected.selected_work_id;
  const selectedWorkTitleMatch = normalizeText(actual.selected_work_title).toLowerCase()
    === normalizeText(expected.selected_work_title).toLowerCase();
  const workStatusMatch = normalizeWorkStatusForGrade(actual.work_status)
    === normalizeWorkStatusForGrade(expected.work_status);
  const normalizedActualNextStep = normalizeNextStepForGrade(actual.next_step_summary);
  const acceptedNextSteps = new Set([
    normalizeNextStepForGrade(expected.next_step_summary),
    ...acceptableNextStepSummaries
      .map((item) => normalizeNextStepForGrade(item))
      .filter((item) => item.length > 0),
  ]);
  const nextStepSummaryMatch = acceptedNextSteps.has(normalizedActualNextStep);

  return {
    selected_work_id_match: selectedWorkIdMatch,
    selected_work_title_match: selectedWorkTitleMatch,
    work_status_match: workStatusMatch,
    next_step_summary_match: nextStepSummaryMatch,
    strict_correct: selectedWorkIdMatch && selectedWorkTitleMatch && workStatusMatch && nextStepSummaryMatch,
  };
}

function metricFromText(value: string): VariantPackRow["payload_metrics"] {
  const bytes = Buffer.byteLength(value, "utf8");
  const lines = value.length === 0 ? 0 : value.split("\n").length;
  return {
    bytes,
    lines,
    est_tokens: Math.ceil(bytes / 4),
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

async function listMarkdownFiles(rootPath: string): Promise<string[]> {
  const results: string[] = [];
  async function walk(currentPath: string): Promise<void> {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });
    const sorted = [...entries].sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of sorted) {
      const entryPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        await walk(entryPath);
        continue;
      }
      if (entry.isFile() && entry.name.endsWith(".md")) {
        results.push(entryPath);
      }
    }
  }
  if (await pathExists(rootPath)) {
    await walk(rootPath);
  }
  return results;
}

function latestLog(logs: SessionLogEntry[], workId: string): SessionLogEntry | undefined {
  return logs
    .filter((entry) => entry.work_id === workId)
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp))[0];
}

function artifactFilesForWork(workdocsRoot: string, work: WorkRecord): string[] {
  const workdocDir = path.join(workdocsRoot, `${work.work_id}-${work.slug}`);
  return [
    "design.md",
    "plan.md",
    "spec.md",
    "summary.md",
    "notes.md",
  ]
    .filter((fileName) => {
      return existsSync(path.join(workdocDir, fileName));
    });
}

function relativePaths(workspaceRoot: string, values: string[]): string[] {
  return values.map((value) => path.relative(workspaceRoot, value));
}

async function sampleDirectoryTree(rootPath: string, depth: number, maxEntries: number): Promise<string[]> {
  const results: string[] = [];
  async function walk(currentPath: string, currentDepth: number, prefix: string): Promise<void> {
    if (results.length >= maxEntries) {
      return;
    }
    let entries: Awaited<ReturnType<typeof fs.readdir>>;
    try {
      entries = await fs.readdir(currentPath, { withFileTypes: true });
    } catch {
      return;
    }
    const sorted = [...entries].sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of sorted) {
      if (results.length >= maxEntries) {
        return;
      }
      const marker = entry.isDirectory() ? "/" : "";
      results.push(`${prefix}${entry.name}${marker}`);
      if (entry.isDirectory() && currentDepth < depth) {
        await walk(path.join(currentPath, entry.name), currentDepth + 1, `${prefix}${entry.name}/`);
      }
    }
  }
  await walk(rootPath, 0, "");
  return results;
}

async function optionalExcerpt(filePath: string, maxLines = 40): Promise<string | null> {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return content.split("\n").slice(0, maxLines).join("\n");
  } catch {
    return null;
  }
}

async function buildWorkspaceOnlyPayload(workspaceRoot: string): Promise<string> {
  const repoRoot = path.join(workspaceRoot, "repos", "SWE-bench");
  const tree = await sampleDirectoryTree(repoRoot, 2, 40);
  const manifestExcerpts = (
    await Promise.all([
      optionalExcerpt(path.join(repoRoot, "README.md")),
      optionalExcerpt(path.join(repoRoot, "docs", "reference", "harness.md")),
      optionalExcerpt(path.join(repoRoot, "docs", "guides", "evaluation.md")),
    ])
  ).filter((entry): entry is string => entry !== null);

  return [
    "This arm exposes workspace and codebase context only.",
    "No Tasklog continuity artifacts, work ids, or workdocs are provided in this arm.",
    "",
    "TREE_SAMPLE:",
    tree.join("\n"),
    "",
    ...(manifestExcerpts.length > 0 ? ["REFERENCE_EXCERPTS:", manifestExcerpts.join("\n\n")] : []),
  ].join("\n");
}

async function buildNotesReplayPayload(workspaceRoot: string): Promise<string> {
  const workdocsRoot = path.join(workspaceRoot, "workdocs");
  const tasklogSessionMarkdown = path.join(workspaceRoot, ".tasklog", "session-log.md");
  const markdownFiles = [
    ...(await pathExists(tasklogSessionMarkdown) ? [tasklogSessionMarkdown] : []),
    ...(await listMarkdownFiles(workdocsRoot)),
  ];
  const chunks = await Promise.all(markdownFiles.map(async (filePath) => {
    const content = await fs.readFile(filePath, "utf8");
    return `FILE: ${path.relative(workspaceRoot, filePath)}\n${content}`;
  }));
  return chunks.join("\n\n");
}

async function buildRawStatePayload(workspaceRoot: string, works: WorkRecord[]): Promise<string> {
  const rawFiles = [
    path.join(workspaceRoot, ".tasklog", "active-context.json"),
    path.join(workspaceRoot, ".tasklog", "works.json"),
    path.join(workspaceRoot, ".tasklog", "session-log.json"),
  ];
  const workdocsRoot = path.join(workspaceRoot, "workdocs");
  for (const work of works) {
    const workdocDir = path.join(workdocsRoot, `${work.work_id}-${work.slug}`);
    for (const fileName of ["notes.md", "plan.md", "spec.md", "design.md", "summary.md"]) {
      const filePath = path.join(workdocDir, fileName);
      if (await pathExists(filePath)) {
        rawFiles.push(filePath);
      }
    }
  }
  const chunks = await Promise.all(rawFiles.map(async (filePath) => {
    const content = await fs.readFile(filePath, "utf8");
    return `FILE: ${path.relative(workspaceRoot, filePath)}\n${content}`;
  }));
  return chunks.join("\n\n");
}

function buildNormalizedStatePayload(
  workspaceRoot: string,
  activeContext: ActiveContext,
  works: WorkRecord[],
  logs: SessionLogEntry[],
): string {
  const workdocsRoot = path.join(workspaceRoot, "workdocs");
  return JSON.stringify({
    active_context_work_id: activeContext.active_work_id ?? "",
    works: works.map((work) => {
      const latest = latestLog(logs, work.work_id);
      return {
        work_id: work.work_id,
        title: work.title,
        status: work.status,
        impact: work.impact ?? "",
        summary: work.summary ?? "",
        scope_paths: relativePaths(workspaceRoot, work.scope_paths),
        latest_log_summary: latest?.summary ?? "",
        next_step_summary: latest?.next_steps ?? "",
        artifact_files: artifactFilesForWork(workdocsRoot, work),
        updated_at: work.updated_at ?? "",
      };
    }),
  }, null, 2);
}

function buildTasklogPayload(
  workspaceRoot: string,
  activeContext: ActiveContext,
  works: WorkRecord[],
  logs: SessionLogEntry[],
): string {
  const workdocsRoot = path.join(workspaceRoot, "workdocs");
  const workById = new Map(works.map((work) => [work.work_id, work]));
  const activeWork = activeContext.active_work_id ? workById.get(activeContext.active_work_id) : undefined;
  return JSON.stringify({
    active_context: {
      active_work_id: activeContext.active_work_id ?? "",
      active_work_title: activeWork?.title ?? "",
      updated_at: activeContext.updated_at ?? "",
    },
    open_work_preview: works
      .filter((work) => work.status !== "done")
      .map((work) => {
        const latest = latestLog(logs, work.work_id);
        return {
          work_id: work.work_id,
          title: work.title,
          status: work.status,
          impact: work.impact ?? "",
          latest_log_summary: latest?.summary ?? "",
          next_step_summary: latest?.next_steps ?? "",
        };
      }),
    closed_work_preview: works
      .filter((work) => work.status === "done")
      .map((work) => ({
        work_id: work.work_id,
        title: work.title,
        status: work.status,
        summary: work.summary ?? "",
      })),
    reentry_briefs: works.map((work) => {
      const latest = latestLog(logs, work.work_id);
      return {
        work_id: work.work_id,
        title: work.title,
        status: work.status,
        scope_paths: relativePaths(workspaceRoot, work.scope_paths),
        latest_log_summary: latest?.summary ?? "",
        next_step_summary: latest?.next_steps ?? "",
        artifact_files: artifactFilesForWork(workdocsRoot, work),
      };
    }),
  }, null, 2);
}

function buildPrompt(
  fixtureId: string,
  arm: ArmDefinition,
  question: QuestionRow,
  sharedPrompt: string,
  payload: string,
): string {
  return [
    "You are answering one frozen benchmark variant.",
    "Use only the evidence payload shown below.",
    "Do not assume access to any files, tools, or state beyond this payload.",
    "If the payload is insufficient, leave fields blank rather than guessing.",
    "",
    sharedPrompt,
    "",
    `Fixture: ${fixtureId}`,
    `Variant: ${arm.variant_label} (${arm.display_label})`,
    `Arm ID: ${arm.arm_id}`,
    `Question ID: ${question.question_id}`,
    `Family: ${question.family}`,
    `Title: ${question.title}`,
    `Goal: ${question.goal}`,
    `Task: ${question.task}`,
    `Expected difficulty: ${question.expected_difficulty}`,
    "",
    "Evidence hints:",
    ...question.evidence_hints.map((hint, index) => `${index + 1}. ${hint}`),
    "",
    "Return exactly one JSON object matching the schema.",
    "",
    "EVIDENCE_PAYLOAD_START",
    payload,
    "EVIDENCE_PAYLOAD_END",
  ].join("\n");
}

async function runCodex(prompt: string, modelId: string): Promise<ModelAnswer> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "tasklog-swe-holdout-"));
  const schemaPath = path.join(tempDir, "schema.json");
  const outputPath = path.join(tempDir, "answer.json");

  try {
    await fs.writeFile(schemaPath, JSON.stringify(answerSchema(), null, 2), "utf8");
    await execFile("codex", [
      "exec",
      "--skip-git-repo-check",
      "--ephemeral",
      "-C",
      tempDir,
      "--output-schema",
      schemaPath,
      "-o",
      outputPath,
      "--sandbox",
      "read-only",
      "--model",
      modelId,
      prompt,
    ], {
      maxBuffer: 1024 * 1024 * 32,
      timeout: 90_000,
    });

    const parsed = JSON.parse(await fs.readFile(outputPath, "utf8")) as Record<string, unknown>;
    return normalizeAnswer(parsed);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

async function loadPackRows(options: CliOptions): Promise<VariantPackRow[]> {
  const rows: VariantPackRow[] = [];

  for (const fixtureId of options.fixtureIds) {
    const fixtureRoot = path.join(options.fixturesRoot, fixtureId);
    const workspaceRoot = path.join(fixtureRoot, "workspace");
    const questions = await readJsonFile<QuestionPack>(path.join(fixtureRoot, "questions.json"));
    const answerKey = await readJsonFile<AnswerKeyPack>(path.join(fixtureRoot, "answer-key.json"));
    const works = await readJsonFile<WorkRecord[]>(path.join(workspaceRoot, ".tasklog", "works.json"));
    const logs = await readJsonFile<SessionLogEntry[]>(path.join(workspaceRoot, ".tasklog", "session-log.json"));
    const activeContext = await readJsonFile<ActiveContext>(path.join(workspaceRoot, ".tasklog", "active-context.json"));
    const answerById = new Map(answerKey.answers.map((answer) => [answer.question_id, answer]));

    const payloadBuilders: Record<ArmId, () => Promise<string>> = {
      no_continuity_scope_scan: async () => buildWorkspaceOnlyPayload(workspaceRoot),
      markdown_notebook_scan: async () => buildNotesReplayPayload(workspaceRoot),
      json_state_scan: async () => buildRawStatePayload(workspaceRoot, works),
      json_state_normalized_scan: async () => buildNormalizedStatePayload(workspaceRoot, activeContext, works, logs),
      tasklog_resume_plus_read_work_context: async () => buildTasklogPayload(workspaceRoot, activeContext, works, logs),
    };

    for (const question of questions.questions) {
      const answerKeyRow = answerById.get(question.question_id);
      if (!answerKeyRow) {
        throw new Error(`Missing answer key row for ${fixtureId}/${question.question_id}`);
      }
      for (const armId of options.arms) {
        const arm = ARMS.find((entry) => entry.arm_id === armId);
        if (!arm) {
          throw new Error(`Unknown arm requested: ${armId}`);
        }
        const payload = await payloadBuilders[armId]();
        rows.push({
          fixture_id: fixtureId,
          scenario_id: fixtureId,
          family: question.family,
          question_id: question.question_id,
          title: question.title,
          variant_label: arm.variant_label,
          arm_id: arm.arm_id,
          display_label: arm.display_label,
          prompt: buildPrompt(fixtureId, arm, question, questions.shared_prompt, payload),
          payload,
          payload_metrics: metricFromText(payload),
          expected_answer: answerKeyRow.expected_answer,
          acceptable_next_step_summaries: answerKeyRow.acceptable_next_step_summaries ?? [],
        });
      }
    }
  }

  return options.maxRows ? rows.slice(0, options.maxRows) : rows;
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function summarizeResults(rows: ResponseRow[]): Record<string, unknown> {
  const byArm = new Map<string, { total: number; correct: number }>();
  const byFamily = new Map<string, { total: number; correct: number }>();
  for (const row of rows) {
    const arm = byArm.get(row.display_label) ?? { total: 0, correct: 0 };
    arm.total += 1;
    arm.correct += row.grade.strict_correct ? 1 : 0;
    byArm.set(row.display_label, arm);

    const familyKey = `${row.display_label} :: ${row.family}`;
    const family = byFamily.get(familyKey) ?? { total: 0, correct: 0 };
    family.total += 1;
    family.correct += row.grade.strict_correct ? 1 : 0;
    byFamily.set(familyKey, family);
  }
  return {
    total_rows: rows.length,
    strict_correct_count: rows.filter((row) => row.grade.strict_correct).length,
    strict_accuracy_percent: rows.length === 0
      ? 0
      : Number(((rows.filter((row) => row.grade.strict_correct).length / rows.length) * 100).toFixed(2)),
    by_arm: [...byArm.entries()].map(([displayLabel, stats]) => ({
      display_label: displayLabel,
      total: stats.total,
      strict_correct: stats.correct,
      strict_accuracy_percent: Number(((stats.correct / stats.total) * 100).toFixed(2)),
    })),
    by_arm_family: [...byFamily.entries()].map(([key, stats]) => ({
      key,
      total: stats.total,
      strict_correct: stats.correct,
      strict_accuracy_percent: Number(((stats.correct / stats.total) * 100).toFixed(2)),
    })),
  };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const runId = `tasklog-swe-holdout-${new Date().toISOString().replace(/[:.]/g, "-")}`;
  const rows = await loadPackRows(options);
  const responses: ResponseRow[] = [];

  console.error(`[holdout] run_id=${runId} rows=${rows.length} model=${options.modelId}`);

  const packPath = path.join(options.outDir, "holdout-pack.json");
  const keyPath = path.join(options.outDir, "holdout-answer-key.json");
  const answersPath = path.join(options.outDir, "holdout-answers.json");
  const metadataPath = path.join(options.outDir, "holdout-answers.meta.json");
  const gradedPath = path.join(options.outDir, "holdout-graded.json");

  await writeJson(packPath, {
    benchmark_type: BENCHMARK_TYPE,
    split: "holdout",
    notes: [
      "Frozen holdout pack for Tasklog SWE-style re-entry evaluation.",
      "Each variant exposes only one arm-specific payload; Codex does not see the full fixture workspace.",
      "Variant labels map to canonical arm display labels in docs/benchmark-arm-names.md.",
    ],
    scenarios: rows.map((row) => ({
      fixture_id: row.fixture_id,
      scenario_id: row.scenario_id,
      question_id: row.question_id,
      variant_label: row.variant_label,
      display_label: row.display_label,
      arm_id: row.arm_id,
      title: row.title,
      family: row.family,
      prompt: row.prompt,
      payload: row.payload,
      payload_metrics: row.payload_metrics,
    })),
  });

  await writeJson(keyPath, {
    benchmark_type: BENCHMARK_TYPE,
    split: "holdout",
    notes: ["Use this frozen answer key only for grading holdout responses."],
    rows: rows.map((row) => ({
      fixture_id: row.fixture_id,
      scenario_id: row.scenario_id,
      question_id: row.question_id,
      variant_label: row.variant_label,
      display_label: row.display_label,
      arm_id: row.arm_id,
      family: row.family,
      expected_answer: row.expected_answer,
      acceptable_next_step_summaries: row.acceptable_next_step_summaries,
    })),
  });

  for (const row of rows) {
    const startedAt = new Date().toISOString();
    const startedMs = Date.now();
    console.error(`[holdout] fixture=${row.fixture_id} arm=${row.display_label}`);
    const answer = await runCodex(row.prompt, options.modelId);
    const latencyMs = Date.now() - startedMs;
    const finishedAt = new Date().toISOString();
    const grade = gradeAnswer(answer, row.expected_answer, row.acceptable_next_step_summaries);

    responses.push({
      benchmark_type: BENCHMARK_TYPE,
      split: "holdout",
      fixture_id: row.fixture_id,
      scenario_id: row.scenario_id,
      question_id: row.question_id,
      family: row.family,
      title: row.title,
      variant_label: row.variant_label,
      arm_id: row.arm_id,
      display_label: row.display_label,
      provider: options.provider,
      model_id: options.modelId,
      model_family: options.modelFamily,
      reasoning_setting: options.reasoningSetting,
      runner_name: RUNNER_NAME,
      runner_version: RUNNER_VERSION,
      run_id: runId,
      run_started_at: startedAt,
      run_finished_at: finishedAt,
      latency_ms: latencyMs,
      input_tokens: null,
      output_tokens: null,
      cache_creation_input_tokens: null,
      cache_read_input_tokens: null,
      estimated_cost_usd: null,
      payload_metrics: row.payload_metrics,
      answer,
      grade,
    });
  }

  const metadata = {
    benchmark_type: BENCHMARK_TYPE,
    split: "holdout",
    provider: options.provider,
    model_id: options.modelId,
    model_family: options.modelFamily,
    reasoning_setting: options.reasoningSetting,
    runner_name: RUNNER_NAME,
    runner_version: RUNNER_VERSION,
    project_root: options.fixturesRoot,
    pack_path: packPath,
    answers_path: answersPath,
    metadata_path: metadataPath,
    run_id: runId,
    submitted_at: new Date().toISOString(),
    responses: responses.map((row) => ({
      benchmark_type: row.benchmark_type,
      scenario_id: row.scenario_id,
      variant_label: row.variant_label,
      provider: row.provider,
      model_id: row.model_id,
      model_family: row.model_family,
      reasoning_setting: row.reasoning_setting,
      runner_name: row.runner_name,
      runner_version: row.runner_version,
      run_id: row.run_id,
      run_started_at: row.run_started_at,
      run_finished_at: row.run_finished_at,
      latency_ms: row.latency_ms,
      input_tokens: row.input_tokens,
      output_tokens: row.output_tokens,
      cache_creation_input_tokens: row.cache_creation_input_tokens,
      cache_read_input_tokens: row.cache_read_input_tokens,
      estimated_cost_usd: row.estimated_cost_usd,
    })),
  };

  await writeJson(answersPath, {
    benchmark_type: BENCHMARK_TYPE,
    split: "holdout",
    run_id: runId,
    model_id: options.modelId,
    responses,
  });
  await writeJson(metadataPath, metadata);
  await writeJson(gradedPath, {
    benchmark_type: BENCHMARK_TYPE,
    split: "holdout",
    run_id: runId,
    model_id: options.modelId,
    summary: summarizeResults(responses),
    responses,
  });

  console.log(JSON.stringify({
    run_id: runId,
    out_dir: options.outDir,
    row_count: responses.length,
    strict_accuracy_percent: summarizeResults(responses).strict_accuracy_percent,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
});
