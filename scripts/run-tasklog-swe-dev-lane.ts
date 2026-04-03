import os from "node:os";
import path from "node:path";
import { promises as fs } from "node:fs";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);

interface QuestionPack {
  fixture_id: string;
  split: string;
  benchmark_type: string;
  shared_prompt: string;
  questions: QuestionRow[];
}

interface QuestionRow {
  question_id: string;
  family: string;
  title: string;
  goal: string;
  task: string;
  expected_difficulty: string;
  evidence_hints?: string[];
}

interface AnswerKeyPack {
  fixture_id: string;
  split: string;
  benchmark_type: string;
  answers: AnswerKeyRow[];
}

interface AnswerKeyRow {
  question_id: string;
  family: string;
  expected_answer: ExpectedAnswer;
  acceptable_next_step_summaries?: string[];
  grading_notes?: string[];
}

interface ExpectedAnswer {
  selected_work_id: string;
  selected_work_title: string;
  work_status: string;
  next_step_summary: string;
}

interface ModelAnswer {
  selected_work_id: string;
  selected_work_title: string;
  work_status: string;
  next_step_summary: string;
  selection_rationale?: string;
  other_candidate_work_ids?: string[];
  ambiguity_notes?: string;
}

interface RunRow {
  fixture_id: string;
  workspace_root: string;
  question_id: string;
  family: string;
  title: string;
  duration_ms: number;
  expected_answer: ExpectedAnswer;
  acceptable_next_step_summaries: string[];
  model_answer: ModelAnswer;
  grade: {
    selected_work_id_match: boolean;
    selected_work_title_match: boolean;
    work_status_match: boolean;
    next_step_summary_match: boolean;
    strict_correct: boolean;
  };
}

interface RunArtifact {
  benchmark_type: string;
  split: string;
  run_id: string;
  model_id: string;
  runner_name: string;
  runner_version: string;
  started_at: string;
  finished_at: string;
  row_count: number;
  strict_correct_count: number;
  strict_accuracy_percent: number;
  rows: RunRow[];
}

interface CliOptions {
  fixturesRoot: string;
  fixtureIds: string[];
  outPath: string;
  modelId: string;
  maxRows?: number;
}

function parseArgs(argv: string[]): CliOptions {
  let fixturesRoot = "/Users/Lab/Desktop/TasklogSweLab/fixtures";
  let fixtureIds = ["dev-001", "dev-002", "dev-003"];
  let outPath = path.resolve(
    `/Users/Lab/Desktop/TasklogSweLab/runs/dev-lane-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
  );
  let modelId = "gpt-5.4-mini";
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
    if (current === "--out") {
      outPath = path.resolve(argv[index + 1] ?? outPath);
      index += 1;
      continue;
    }
    if (current === "--model-id") {
      modelId = argv[index + 1] ?? modelId;
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
    outPath,
    modelId,
    maxRows,
  };
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
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

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => normalizeText(item)).filter((item) => item.length > 0);
}

function normalizeAnswer(value: Record<string, unknown>): ModelAnswer {
  return {
    selected_work_id: normalizeText(value.selected_work_id),
    selected_work_title: normalizeText(value.selected_work_title),
    work_status: normalizeText(value.work_status),
    next_step_summary: normalizeText(value.next_step_summary),
    selection_rationale: normalizeText(value.selection_rationale),
    other_candidate_work_ids: normalizeStringList(value.other_candidate_work_ids),
    ambiguity_notes: normalizeText(value.ambiguity_notes),
  };
}

function gradeAnswer(
  actual: ModelAnswer,
  expected: ExpectedAnswer,
  acceptableNextStepSummaries: string[] = [],
): RunRow["grade"] {
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

function answerSchema(): Record<string, unknown> {
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "selected_work_id",
      "selected_work_title",
      "work_status",
      "next_step_summary",
      "selection_rationale",
      "other_candidate_work_ids",
      "ambiguity_notes",
    ],
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
  };
}

async function runCodex(workspaceRoot: string, prompt: string, modelId: string): Promise<ModelAnswer> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "tasklog-swe-dev-lane-"));
  const schemaPath = path.join(tempDir, "schema.json");
  const outputPath = path.join(tempDir, "answer.json");

  try {
    await fs.writeFile(schemaPath, JSON.stringify(answerSchema(), null, 2), "utf8");
    await execFile("codex", [
      "exec",
      "--skip-git-repo-check",
      "--ephemeral",
      "-C",
      workspaceRoot,
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

function buildPrompt(
  workspaceRoot: string,
  fixtureId: string,
  sharedPrompt: string,
  question: QuestionRow,
): string {
  const evidenceHints = question.evidence_hints && question.evidence_hints.length > 0
    ? question.evidence_hints.map((hint, index) => `${index + 1}. ${hint}`).join("\n")
    : "None.";

  return [
    "You are running inside an isolated benchmark fixture workspace.",
    "You may inspect files under the current workspace only.",
    "Relevant paths in this workspace:",
    "- `.tasklog/` for Tasklog state",
    "- `workdocs/` for artifact markdown",
    "- `repos/SWE-bench/` for the codebase snapshot",
    "",
    sharedPrompt,
    "",
    `Fixture: ${fixtureId}`,
    `Workspace root: ${workspaceRoot}`,
    `Question ID: ${question.question_id}`,
    `Family: ${question.family}`,
    `Title: ${question.title}`,
    `Goal: ${question.goal}`,
    `Task: ${question.task}`,
    `Expected difficulty: ${question.expected_difficulty}`,
    "",
    "Evidence hints:",
    evidenceHints,
    "",
    "Answer requirements:",
    "- Use evidence from the fixture only.",
    "- Start from `.tasklog/` and `workdocs/` first.",
    "- Inspect code only if the task state is not already sufficient.",
    "- Do not inspect more than one code file unless the first file is clearly insufficient.",
    "- Prefer exact Tasklog wording for `next_step_summary` when a clear next step exists in the evidence.",
    "- Return exactly one JSON object matching the schema.",
    "- Leave optional fields empty if they are unnecessary.",
    "",
    "Required JSON fields:",
    "- `selected_work_id`",
    "- `selected_work_title`",
    "- `work_status`",
    "- `next_step_summary`",
    "- `selection_rationale`",
    "- `other_candidate_work_ids`",
    "- `ambiguity_notes`",
  ].join("\n");
}

async function loadRows(options: CliOptions): Promise<Array<{
  fixtureId: string;
  workspaceRoot: string;
  question: QuestionRow;
  expected: ExpectedAnswer;
  acceptableNextStepSummaries: string[];
  sharedPrompt: string;
}>> {
  const rows: Array<{
    fixtureId: string;
    workspaceRoot: string;
    question: QuestionRow;
    expected: ExpectedAnswer;
    acceptableNextStepSummaries: string[];
    sharedPrompt: string;
  }> = [];

  for (const fixtureId of options.fixtureIds) {
    const fixtureRoot = path.join(options.fixturesRoot, fixtureId);
    const workspaceRoot = path.join(fixtureRoot, "workspace");
    const questionPack = await readJsonFile<QuestionPack>(path.join(fixtureRoot, "questions.json"));
    const answerKey = await readJsonFile<AnswerKeyPack>(path.join(fixtureRoot, "answer-key.json"));
    const answerById = new Map(answerKey.answers.map((answer) => [answer.question_id, answer]));

    for (const question of questionPack.questions) {
      const answerKeyRow = answerById.get(question.question_id);
      if (!answerKeyRow) {
        throw new Error(`Missing answer key for ${fixtureId}/${question.question_id}`);
      }
      rows.push({
        fixtureId,
        workspaceRoot,
        question,
        expected: answerKeyRow.expected_answer,
        acceptableNextStepSummaries: answerKeyRow.acceptable_next_step_summaries ?? [],
        sharedPrompt: questionPack.shared_prompt,
      });
    }
  }

  return options.maxRows ? rows.slice(0, options.maxRows) : rows;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const startedAt = new Date().toISOString();
  const rows = await loadRows(options);
  const runId = `tasklog-swe-dev-${new Date().toISOString().replace(/[:.]/g, "-")}`;
  const results: RunRow[] = [];

  console.error(`[dev-lane] starting run_id=${runId} rows=${rows.length} model=${options.modelId}`);

  for (const row of rows) {
    const prompt = buildPrompt(
      row.workspaceRoot,
      row.fixtureId,
      row.sharedPrompt,
      row.question,
    );
    const started = Date.now();
    console.error(`[dev-lane] question ${row.question.question_id} fixture=${row.fixtureId}`);
    const modelAnswer = await runCodex(row.workspaceRoot, prompt, options.modelId);
    const durationMs = Date.now() - started;
    const grade = gradeAnswer(modelAnswer, row.expected, row.acceptableNextStepSummaries);

    results.push({
      fixture_id: row.fixtureId,
      workspace_root: row.workspaceRoot,
      question_id: row.question.question_id,
      family: row.question.family,
      title: row.question.title,
      duration_ms: durationMs,
      expected_answer: row.expected,
      acceptable_next_step_summaries: row.acceptableNextStepSummaries,
      model_answer: modelAnswer,
      grade,
    });

    console.error(
      `[dev-lane] done ${row.question.question_id} strict=${grade.strict_correct} duration_ms=${durationMs}`,
    );
  }

  const strictCorrectCount = results.filter((row) => row.grade.strict_correct).length;
  const artifact: RunArtifact = {
    benchmark_type: "tasklog_reentry_dev_lane",
    split: "dev",
    run_id: runId,
    model_id: options.modelId,
    runner_name: "tasklog-swe-dev-lane-runner",
    runner_version: "2026-03-29",
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    row_count: results.length,
    strict_correct_count: strictCorrectCount,
    strict_accuracy_percent: results.length === 0 ? 0 : Number(((strictCorrectCount / results.length) * 100).toFixed(2)),
    rows: results,
  };

  await fs.mkdir(path.dirname(options.outPath), { recursive: true });
  await fs.writeFile(options.outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({
    out_path: options.outPath,
    row_count: artifact.row_count,
    strict_correct_count: artifact.strict_correct_count,
    strict_accuracy_percent: artifact.strict_accuracy_percent,
  }, null, 2));
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
