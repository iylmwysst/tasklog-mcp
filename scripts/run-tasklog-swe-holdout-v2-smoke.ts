import { execFile as execFileCallback } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);

const DEFAULT_FIXTURES_ROOT = "/Users/Lab/Desktop/TasklogSweLab/fixtures-v2";
const DEFAULT_RUNS_ROOT = "/Users/Lab/Desktop/TasklogSweLab/runs";
const DEFAULT_FIXTURE_IDS = Array.from({ length: 10 }, (_, index) => `v2-smoke-${String(index + 1).padStart(3, "0")}`);
const BENCHMARK_TYPE = "llm_reentry_understanding";

type ArmId = "json_state_normalized_scan" | "tasklog_reentry_v2";

interface CliOptions {
  fixturesRoot: string;
  fixtureIds: string[];
  arms: ArmId[];
  modelId: string;
  modelFamily: string;
  provider: string;
  reasoningSetting: string;
  outDir: string;
}

interface Question {
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
  shared_prompt: string;
  questions: Question[];
}

interface ExpectedAnswer {
  decision_type: string;
  selected_work_id: string;
  selected_work_title: string;
  work_status: string;
  next_step_summary: string;
  primary_evidence_source: string;
  clarifying_question: string;
  abstention_reason: string;
  escalation_target: string;
}

interface AnswerKeyPack {
  answers: Array<{
    question_id: string;
    family: string;
    expected_answer: ExpectedAnswer;
  }>;
}

interface ModelAnswer extends ExpectedAnswer {
  selection_rationale: string;
  other_candidate_work_ids: string[];
}

interface GradeResult {
  decision_type_match: boolean;
  canonical_decision_type_match: boolean;
  selected_work_id_match: boolean;
  work_status_match: boolean;
  canonical_work_status_match: boolean;
  next_step_summary_match: boolean;
  primary_evidence_source_match: boolean;
  clarifying_question_match: boolean;
  abstention_reason_match: boolean;
  escalation_target_match: boolean;
  decision_core_correct: boolean;
  canonical_decision_core_correct: boolean;
  strict_correct: boolean;
}

const ARMS = [
  {
    arm_id: "json_state_normalized_scan" as const,
    variant_label: "D",
    display_label: "Normalized State",
    file_name: "normalized-state.json",
  },
  {
    arm_id: "tasklog_reentry_v2" as const,
    variant_label: "E",
    display_label: "Tasklog Re-entry",
    file_name: "tasklog-reentry.json",
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
  let outDir = path.join(DEFAULT_RUNS_ROOT, `v2-smoke-${new Date().toISOString().replace(/[:.]/g, "-")}`);

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
        arms = raw.split(",").map((item) => item.trim()).filter(Boolean) as ArmId[];
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
  }

  return { fixturesRoot, fixtureIds, arms, modelId, modelFamily, provider, reasoningSetting, outDir };
}

function answerSchema(): Record<string, unknown> {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      decision_type: { type: "string" },
      selected_work_id: { type: "string" },
      selected_work_title: { type: "string" },
      work_status: { type: "string" },
      next_step_summary: { type: "string" },
      primary_evidence_source: { type: "string" },
      selection_rationale: { type: "string" },
      clarifying_question: { type: "string" },
      abstention_reason: { type: "string" },
      escalation_target: { type: "string" },
      other_candidate_work_ids: {
        type: "array",
        items: { type: "string" },
      },
    },
    required: [
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
  };
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function normalizeAnswer(parsed: Record<string, unknown>): ModelAnswer {
  return {
    decision_type: normalizeText(parsed.decision_type),
    selected_work_id: normalizeText(parsed.selected_work_id),
    selected_work_title: normalizeText(parsed.selected_work_title),
    work_status: normalizeText(parsed.work_status),
    next_step_summary: normalizeText(parsed.next_step_summary),
    primary_evidence_source: normalizeText(parsed.primary_evidence_source),
    selection_rationale: normalizeText(parsed.selection_rationale),
    clarifying_question: normalizeText(parsed.clarifying_question),
    abstention_reason: normalizeText(parsed.abstention_reason),
    escalation_target: normalizeText(parsed.escalation_target),
    other_candidate_work_ids: Array.isArray(parsed.other_candidate_work_ids)
      ? parsed.other_candidate_work_ids.map((item) => normalizeText(item)).filter((item) => item.length > 0)
      : [],
  };
}

function normalizeForGrade(value: unknown): string {
  return normalizeText(value).toLowerCase().replace(/`/g, "");
}

function canonicalDecisionType(answer: Pick<ModelAnswer, "decision_type" | "selected_work_id" | "abstention_reason"> | ExpectedAnswer): string {
  const decisionType = normalizeForGrade(answer.decision_type);
  const selectedWorkId = normalizeForGrade(answer.selected_work_id);
  const abstentionReason = normalizeForGrade(answer.abstention_reason);

  if (decisionType === "resume_with_escalation" || decisionType === "resume_blocked_with_escalation") {
    return "resume_blocked_with_escalation";
  }
  if (decisionType === "ask_clarifying_question" || decisionType === "clarifying_question") {
    if (!selectedWorkId && abstentionReason) {
      return "abstain_insufficient_evidence";
    }
    return "ask_clarifying_question";
  }
  if (decisionType === "abstain" || decisionType === "abstain_insufficient_evidence") {
    return "abstain_insufficient_evidence";
  }
  return decisionType;
}

function canonicalWorkStatus(answer: Pick<ModelAnswer, "decision_type" | "selected_work_id" | "abstention_reason" | "work_status"> | ExpectedAnswer): string {
  const decisionType = canonicalDecisionType(answer);
  if (decisionType === "abstain_insufficient_evidence" && !normalizeForGrade(answer.selected_work_id)) {
    return "";
  }
  return normalizeForGrade(answer.work_status);
}

function gradeAnswer(actual: ModelAnswer, expected: ExpectedAnswer): GradeResult {
  const decisionTypeMatch = normalizeForGrade(actual.decision_type) === normalizeForGrade(expected.decision_type);
  const canonicalDecisionTypeMatch = canonicalDecisionType(actual) === canonicalDecisionType(expected);
  const selectedWorkIdMatch = normalizeForGrade(actual.selected_work_id) === normalizeForGrade(expected.selected_work_id);
  const workStatusMatch = normalizeForGrade(actual.work_status) === normalizeForGrade(expected.work_status);
  const canonicalWorkStatusMatch = canonicalWorkStatus(actual) === canonicalWorkStatus(expected);
  const nextStepMatch = normalizeForGrade(actual.next_step_summary) === normalizeForGrade(expected.next_step_summary);
  const primaryEvidenceSourceMatch = normalizeForGrade(actual.primary_evidence_source) === normalizeForGrade(expected.primary_evidence_source);
  const clarifyingQuestionMatch = normalizeForGrade(actual.clarifying_question) === normalizeForGrade(expected.clarifying_question);
  const abstentionReasonMatch = normalizeForGrade(actual.abstention_reason) === normalizeForGrade(expected.abstention_reason);
  const escalationTargetMatch = normalizeForGrade(actual.escalation_target) === normalizeForGrade(expected.escalation_target);

  return {
    decision_type_match: decisionTypeMatch,
    canonical_decision_type_match: canonicalDecisionTypeMatch,
    selected_work_id_match: selectedWorkIdMatch,
    work_status_match: workStatusMatch,
    canonical_work_status_match: canonicalWorkStatusMatch,
    next_step_summary_match: nextStepMatch,
    primary_evidence_source_match: primaryEvidenceSourceMatch,
    clarifying_question_match: clarifyingQuestionMatch,
    abstention_reason_match: abstentionReasonMatch,
    escalation_target_match: escalationTargetMatch,
    decision_core_correct: decisionTypeMatch
      && selectedWorkIdMatch
      && workStatusMatch
      && primaryEvidenceSourceMatch,
    canonical_decision_core_correct: canonicalDecisionTypeMatch
      && selectedWorkIdMatch
      && canonicalWorkStatusMatch
      && primaryEvidenceSourceMatch,
    strict_correct: decisionTypeMatch
      && selectedWorkIdMatch
      && workStatusMatch
      && nextStepMatch
      && primaryEvidenceSourceMatch
      && clarifyingQuestionMatch
      && abstentionReasonMatch
      && escalationTargetMatch,
  };
}

async function runCodex(prompt: string, modelId: string): Promise<ModelAnswer> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "tasklog-v2-smoke-"));
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
    return normalizeAnswer(JSON.parse(await fs.readFile(outputPath, "utf8")) as Record<string, unknown>);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

function buildPrompt(fixtureId: string, question: Question, sharedPrompt: string, armLabel: string, payload: unknown): string {
  return [
    "You are answering one frozen V2 smoke benchmark variant.",
    "Use only the evidence payload below.",
    "If the evidence is insufficient, abstain or ask a clarifying question rather than guessing.",
    "",
    sharedPrompt,
    "",
    `Fixture: ${fixtureId}`,
    `Arm: ${armLabel}`,
    `Question ID: ${question.question_id}`,
    `Family: ${question.family}`,
    `Title: ${question.title}`,
    `Goal: ${question.goal}`,
    `Task: ${question.task}`,
    "",
    "Evidence hints:",
    ...question.evidence_hints.map((hint, index) => `${index + 1}. ${hint}`),
    "",
    "EVIDENCE_PAYLOAD_START",
    JSON.stringify(payload, null, 2),
    "EVIDENCE_PAYLOAD_END",
  ].join("\n");
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const runId = `tasklog-v2-smoke-${new Date().toISOString().replace(/[:.]/g, "-")}`;
  const rows: Array<Record<string, unknown>> = [];
  const summaryRows: Array<Record<string, unknown>> = [];

  for (const fixtureId of options.fixtureIds) {
    const fixtureRoot = path.join(options.fixturesRoot, fixtureId);
    const questions = await readJson<QuestionPack>(path.join(fixtureRoot, "questions.json"));
    const answerKey = await readJson<AnswerKeyPack>(path.join(fixtureRoot, "answer-key.json"));
    const answerById = new Map(answerKey.answers.map((row) => [row.question_id, row.expected_answer]));

    for (const question of questions.questions) {
      const expected = answerById.get(question.question_id);
      if (!expected) {
        throw new Error(`Missing answer key for ${fixtureId}/${question.question_id}`);
      }

      for (const armId of options.arms) {
        const arm = ARMS.find((entry) => entry.arm_id === armId);
        if (!arm) {
          throw new Error(`Unknown arm: ${armId}`);
        }
        const payload = await readJson<unknown>(path.join(fixtureRoot, "surfaces", arm.file_name));
        const prompt = buildPrompt(fixtureId, question, questions.shared_prompt, arm.display_label, payload);
        const startedAt = new Date().toISOString();
        const startedMs = Date.now();
        console.error(`[v2-smoke] fixture=${fixtureId} arm=${arm.display_label}`);
        const answer = await runCodex(prompt, options.modelId);
        const finishedAt = new Date().toISOString();
        const grade = gradeAnswer(answer, expected);
        const row = {
          benchmark_type: BENCHMARK_TYPE,
          split: "v2_smoke",
          fixture_id: fixtureId,
          family: question.family,
          question_id: question.question_id,
          variant_label: arm.variant_label,
          arm_id: arm.arm_id,
          display_label: arm.display_label,
          provider: options.provider,
          model_id: options.modelId,
          model_family: options.modelFamily,
          reasoning_setting: options.reasoningSetting,
          runner_name: "tasklog-swe-v2-smoke-runner",
          runner_version: "2026-03-29",
          run_id: runId,
          run_started_at: startedAt,
          run_finished_at: finishedAt,
          latency_ms: Date.now() - startedMs,
          input_tokens: null,
          output_tokens: null,
          cache_creation_input_tokens: null,
          cache_read_input_tokens: null,
          estimated_cost_usd: null,
          answer,
          expected,
          grade,
        };
        rows.push(row);
        summaryRows.push({
          fixture: fixtureId,
          arm: arm.display_label,
          strict_correct: grade.strict_correct,
          decision_core_correct: grade.decision_core_correct,
          canonical_decision_core_correct: grade.canonical_decision_core_correct,
          decision_type_match: grade.decision_type_match,
          canonical_decision_type_match: grade.canonical_decision_type_match,
          primary_evidence_source_match: grade.primary_evidence_source_match,
        });
      }
    }
  }

  const grouped = new Map<string, { total: number; strict_correct: number; decision_core_correct: number; canonical_decision_core_correct: number }>();
  for (const row of rows as Array<{ display_label: string; grade: GradeResult }>) {
    const current = grouped.get(row.display_label) ?? { total: 0, strict_correct: 0, decision_core_correct: 0, canonical_decision_core_correct: 0 };
    current.total += 1;
    current.strict_correct += row.grade.strict_correct ? 1 : 0;
    current.decision_core_correct += row.grade.decision_core_correct ? 1 : 0;
    current.canonical_decision_core_correct += row.grade.canonical_decision_core_correct ? 1 : 0;
    grouped.set(row.display_label, current);
  }

  await writeJson(path.join(options.outDir, "v2-smoke-graded.json"), {
    benchmark_type: BENCHMARK_TYPE,
    split: "v2_smoke",
    run_id: runId,
    model_id: options.modelId,
    summary: {
      total_rows: rows.length,
      strict_correct_count: rows.filter((row: any) => row.grade.strict_correct).length,
      strict_accuracy_percent: Number((((rows.filter((row: any) => row.grade.strict_correct).length) / rows.length) * 100).toFixed(2)),
      decision_core_correct_count: rows.filter((row: any) => row.grade.decision_core_correct).length,
      decision_core_accuracy_percent: Number((((rows.filter((row: any) => row.grade.decision_core_correct).length) / rows.length) * 100).toFixed(2)),
      canonical_decision_core_correct_count: rows.filter((row: any) => row.grade.canonical_decision_core_correct).length,
      canonical_decision_core_accuracy_percent: Number((((rows.filter((row: any) => row.grade.canonical_decision_core_correct).length) / rows.length) * 100).toFixed(2)),
      by_arm: [...grouped.entries()].map(([display_label, stats]) => ({
        display_label,
        total: stats.total,
        strict_correct: stats.strict_correct,
        strict_accuracy_percent: Number(((stats.strict_correct / stats.total) * 100).toFixed(2)),
        decision_core_correct: stats.decision_core_correct,
        decision_core_accuracy_percent: Number(((stats.decision_core_correct / stats.total) * 100).toFixed(2)),
        canonical_decision_core_correct: stats.canonical_decision_core_correct,
        canonical_decision_core_accuracy_percent: Number(((stats.canonical_decision_core_correct / stats.total) * 100).toFixed(2)),
      })),
      rows: summaryRows,
    },
    responses: rows,
  });

  await writeJson(path.join(options.outDir, "v2-smoke-meta.json"), {
    benchmark_type: BENCHMARK_TYPE,
    split: "v2_smoke",
    provider: options.provider,
    model_id: options.modelId,
    model_family: options.modelFamily,
    reasoning_setting: options.reasoningSetting,
    runner_name: "tasklog-swe-v2-smoke-runner",
    runner_version: "2026-03-29",
    project_root: options.fixturesRoot,
    pack_path: path.join(options.outDir, "v2-smoke-graded.json"),
    answers_path: path.join(options.outDir, "v2-smoke-graded.json"),
    metadata_path: path.join(options.outDir, "v2-smoke-meta.json"),
    run_id: runId,
    submitted_at: new Date().toISOString(),
    responses: (rows as Array<any>).map((row) => ({
      benchmark_type: row.benchmark_type,
      scenario_id: row.fixture_id,
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
      input_tokens: null,
      output_tokens: null,
      cache_creation_input_tokens: null,
      cache_read_input_tokens: null,
      estimated_cost_usd: null,
    })),
  });

  console.log(JSON.stringify({
    run_id: runId,
    out_dir: options.outDir,
    row_count: rows.length,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
});
