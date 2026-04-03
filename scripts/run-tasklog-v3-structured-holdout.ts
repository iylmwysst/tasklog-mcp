import { execFile as execFileCallback } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);

const DEFAULT_FIXTURES_ROOT = "/Users/Lab/Desktop/TasklogSweLab/fixtures-v3";
const DEFAULT_RUNS_ROOT = "/Users/Lab/Desktop/TasklogSweLab/runs";
const BENCHMARK_TYPE = "tasklog_v3_independent_structured_holdout";
const ROUND_ID = "V3a";
const RUNNER_NAME = "tasklog-benchmark-runner";
const RUNNER_VERSION = "2026-03-29-v3a";
const PACK_MANIFEST_NAME = "v3a-pack-manifest.json";
const ANSWER_KEY_MANIFEST_PATH = path.join("annotation", "frozen-answer-key-manifest.json");

type ArmId = "normalized_state" | "tasklog_reentry";
type ModelSlot =
  | "slot_a_openai_frontier_large"
  | "slot_b_openai_frontier_small"
  | "slot_c_external_closed_frontier";
type RunStatus = "running" | "completed" | "failed";

interface CliOptions {
  fixturesRoot: string;
  fixtureIds: string[];
  arms: ArmId[];
  modelSlot: ModelSlot;
  modelId: string;
  modelFamily: string;
  provider: string;
  reasoningSetting: string;
  repetitionIndex: number;
  outDir: string;
  codexConfigs: string[];
}

interface SlotDefaults {
  provider: string;
  modelId: string;
  modelFamily: string;
  reasoningSetting: string;
}

interface PackManifest {
  version: number;
  round_id: string;
  benchmark_type: string;
  root: string;
  authored_fixture_ids: string[];
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
  round_id: string;
  benchmark_type: string;
  shared_prompt: string;
  questions: Question[];
}

interface ExpectedAnswer {
  decision_type: string;
  selected_work_id: string;
  work_status: string;
  next_step_summary: string;
  clarifying_question: string;
  abstention_reason: string;
  escalation_target: string;
  primary_evidence_source: string;
  candidate_work_id?: string;
}

interface NextStepSlots {
  action_verb: string;
  primary_target: string;
  gating_constraint: string;
}

interface AnswerKeyEntry {
  fixture_id: string;
  frozen_constraints: {
    family_id: string;
    primary_decision_mode: string;
    difficulty: string;
    candidate_work_id_allowed: boolean;
    rubric_fallback_family: boolean;
    expected_label_mode: string;
  };
  expected_answer: ExpectedAnswer;
  next_step_slots: NextStepSlots;
}

interface AnswerKeyManifest {
  version: number;
  round_id: string;
  benchmark_type: string;
  status: string;
  entry_count: number;
  entries: AnswerKeyEntry[];
}

interface FixtureManifest {
  version: number;
  round_id: string;
  fixture_id: string;
  benchmark_type: string;
  family_id: string;
  scenario_title: string;
  primary_decision_mode: string;
  difficulty: string;
  candidate_work_id_allowed: boolean;
  rubric_fallback_family: boolean;
  expected_label_mode: string;
  files: {
    fixture: string;
    questions: string;
    normalized_state: string;
    tasklog_reentry: string;
  };
}

interface Ontology {
  version: string;
  benchmark_type: string;
  exact_label_to_family: Record<string, string>;
}

interface ModelAnswer {
  decision_type: string;
  selected_work_id: string;
  work_status: string;
  next_step_summary: string;
  clarifying_question: string;
  abstention_reason: string;
  escalation_target: string;
  primary_evidence_source: string;
  candidate_work_id: string;
}

interface GradeResult {
  decision_type_correct: boolean;
  selected_work_id_correct: boolean;
  work_status_correct: boolean;
  next_step_accuracy: boolean;
  clarifying_question_correct: boolean;
  abstention_reason_correct: boolean;
  escalation_target_correct: boolean;
  exact_label_evidence_accuracy: boolean;
  compatible_family_evidence_accuracy: boolean;
  required_empty_fields_correct: boolean;
  decision_action_core_accuracy: boolean;
  strict_contract_accuracy: boolean;
  action_valid_success: boolean;
  abstention_accuracy: boolean | null;
  clarification_accuracy: boolean | null;
  escalation_accuracy: boolean | null;
  candidate_work_id_allowed: boolean;
  candidate_work_id_correct: boolean | null;
}

interface ResponseRow {
  benchmark_type: string;
  round_id: string;
  split: "holdout";
  fixture_id: string;
  question_id: string;
  family: string;
  title: string;
  difficulty: string;
  variant_label: string;
  arm_id: ArmId;
  display_label: string;
  provider: string;
  model_slot: ModelSlot;
  repetition_index: number;
  model_id: string;
  model_family: string;
  reasoning_setting: string;
  runner_name: string;
  runner_version: string;
  run_id: string;
  run_started_at: string;
  run_finished_at: string;
  latency_ms: number;
  input_tokens: null;
  output_tokens: null;
  cache_creation_input_tokens: null;
  cache_read_input_tokens: null;
  estimated_cost_usd: null;
  payload_bytes: number;
  payload_path: string;
  answer: ModelAnswer;
  expected_answer: ExpectedAnswer;
  next_step_slots: NextStepSlots;
  grade: GradeResult;
}

interface SummaryStats {
  total: number;
  action_valid_success_count: number;
  decision_action_core_accuracy_count: number;
  strict_contract_accuracy_count: number;
  next_step_accuracy_count: number;
  exact_label_evidence_accuracy_count: number;
  compatible_family_evidence_accuracy_count: number;
  payload_bytes_median: number | null;
}

interface PersistContext {
  options: CliOptions;
  runId: string;
  status: RunStatus;
  rows: ResponseRow[];
  expectedRowCount: number;
  packPath: string;
  outDir: string;
  failureMessage?: string;
}

const SLOT_DEFAULTS: Record<ModelSlot, SlotDefaults> = {
  slot_a_openai_frontier_large: {
    provider: "openai",
    modelId: "gpt-5.4",
    modelFamily: "gpt-5.4",
    reasoningSetting: "medium",
  },
  slot_b_openai_frontier_small: {
    provider: "openai",
    modelId: "gpt-5.4-mini",
    modelFamily: "gpt-5.4-mini",
    reasoningSetting: "medium",
  },
  slot_c_external_closed_frontier: {
    provider: "anthropic",
    modelId: "claude-sonnet-4.6",
    modelFamily: "claude-sonnet-4.6",
    reasoningSetting: "standard",
  },
};

const ARMS = [
  {
    arm_id: "normalized_state" as const,
    variant_label: "D",
    display_label: "Normalized State",
    manifest_key: "normalized_state" as const,
  },
  {
    arm_id: "tasklog_reentry" as const,
    variant_label: "E",
    display_label: "Tasklog Re-entry",
    manifest_key: "tasklog_reentry" as const,
  },
];

function parseArgs(argv: string[]): CliOptions {
  let fixturesRoot = DEFAULT_FIXTURES_ROOT;
  let fixtureIds: string[] = [];
  let arms = ARMS.map((arm) => arm.arm_id);
  let modelSlot: ModelSlot = "slot_b_openai_frontier_small";
  let repetitionIndex = 1;
  let outDir: string | undefined;
  const codexConfigs: string[] = [];
  let modelIdExplicit = false;
  let modelFamilyExplicit = false;
  let providerExplicit = false;
  let reasoningExplicit = false;

  let provider = SLOT_DEFAULTS[modelSlot].provider;
  let modelId = SLOT_DEFAULTS[modelSlot].modelId;
  let modelFamily = SLOT_DEFAULTS[modelSlot].modelFamily;
  let reasoningSetting = SLOT_DEFAULTS[modelSlot].reasoningSetting;

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
    if (current === "--model-slot") {
      const candidate = argv[index + 1] as ModelSlot | undefined;
      if (candidate && candidate in SLOT_DEFAULTS) {
        modelSlot = candidate;
        const defaults = SLOT_DEFAULTS[modelSlot];
        if (!providerExplicit) {
          provider = defaults.provider;
        }
        if (!modelIdExplicit) {
          modelId = defaults.modelId;
        }
        if (!modelFamilyExplicit) {
          modelFamily = defaults.modelFamily;
        }
        if (!reasoningExplicit) {
          reasoningSetting = defaults.reasoningSetting;
        }
      }
      index += 1;
      continue;
    }
    if (current === "--model-id") {
      modelId = argv[index + 1] ?? modelId;
      modelIdExplicit = true;
      index += 1;
      continue;
    }
    if (current === "--model-family") {
      modelFamily = argv[index + 1] ?? modelFamily;
      modelFamilyExplicit = true;
      index += 1;
      continue;
    }
    if (current === "--provider") {
      provider = argv[index + 1] ?? provider;
      providerExplicit = true;
      index += 1;
      continue;
    }
    if (current === "--reasoning-setting") {
      reasoningSetting = argv[index + 1] ?? reasoningSetting;
      reasoningExplicit = true;
      index += 1;
      continue;
    }
    if (current === "--repetition-index") {
      const candidate = Number.parseInt(argv[index + 1] ?? "", 10);
      if (Number.isFinite(candidate) && candidate >= 1 && candidate <= 3) {
        repetitionIndex = candidate;
      }
      index += 1;
      continue;
    }
    if (current === "--out-dir") {
      outDir = path.resolve(argv[index + 1] ?? "");
      index += 1;
      continue;
    }
    if (current === "--codex-config") {
      const value = argv[index + 1];
      if (value) {
        codexConfigs.push(value);
      }
      index += 1;
      continue;
    }
  }

  const resolvedOutDir = outDir ?? path.join(
    DEFAULT_RUNS_ROOT,
    `v3a-${modelSlot}-rep${repetitionIndex}-${new Date().toISOString().replace(/[:.]/g, "-")}`,
  );

  return {
    fixturesRoot,
    fixtureIds,
    arms,
    modelSlot,
    modelId,
    modelFamily,
    provider,
    reasoningSetting,
    repetitionIndex,
    outDir: resolvedOutDir,
    codexConfigs,
  };
}

function answerSchema(): Record<string, unknown> {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      decision_type: { type: "string" },
      selected_work_id: { type: "string" },
      work_status: { type: "string" },
      next_step_summary: { type: "string" },
      clarifying_question: { type: "string" },
      abstention_reason: { type: "string" },
      escalation_target: { type: "string" },
      primary_evidence_source: { type: "string" },
      candidate_work_id: { type: "string" },
    },
    required: [
      "decision_type",
      "selected_work_id",
      "work_status",
      "next_step_summary",
      "clarifying_question",
      "abstention_reason",
      "escalation_target",
      "primary_evidence_source",
      "candidate_work_id",
    ],
  };
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

async function readJsonText(filePath: string): Promise<{ parsed: unknown; text: string }> {
  const text = await fs.readFile(filePath, "utf8");
  return { parsed: JSON.parse(text) as unknown, text };
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function normalizeForMatch(value: unknown): string {
  return normalizeText(value).toLowerCase().replace(/`/g, "");
}

function normalizeAnswer(parsed: Record<string, unknown>): ModelAnswer {
  return {
    decision_type: normalizeText(parsed.decision_type),
    selected_work_id: normalizeText(parsed.selected_work_id),
    work_status: normalizeText(parsed.work_status),
    next_step_summary: normalizeText(parsed.next_step_summary),
    clarifying_question: normalizeText(parsed.clarifying_question),
    abstention_reason: normalizeText(parsed.abstention_reason),
    escalation_target: normalizeText(parsed.escalation_target),
    primary_evidence_source: normalizeText(parsed.primary_evidence_source),
    candidate_work_id: normalizeText(parsed.candidate_work_id),
  };
}

function scoreNextStepSummary(actualSummary: string, slots: NextStepSlots): boolean {
  const normalizedSummary = normalizeForMatch(actualSummary);
  const requiredSlots = [slots.action_verb, slots.primary_target, slots.gating_constraint]
    .map((value) => normalizeForMatch(value))
    .filter((value) => value.length > 0);

  if (requiredSlots.length === 0) {
    return normalizedSummary.length === 0;
  }

  return requiredSlots.every((slotValue) => normalizedSummary.includes(slotValue));
}

function scoreCompatibleEvidenceFamily(actualLabel: string, expectedLabel: string, ontology: Ontology): boolean {
  const actualFamily = ontology.exact_label_to_family[actualLabel];
  const expectedFamily = ontology.exact_label_to_family[expectedLabel];
  return Boolean(actualFamily && expectedFamily && actualFamily === expectedFamily);
}

function requiredEmptyFieldsCorrect(actual: ModelAnswer, expectedDecisionType: string): boolean {
  if (expectedDecisionType === "resume_work") {
    return actual.clarifying_question === ""
      && actual.abstention_reason === ""
      && actual.escalation_target === ""
      && actual.candidate_work_id === "";
  }
  if (expectedDecisionType === "resume_blocked_with_escalation") {
    return actual.clarifying_question === ""
      && actual.abstention_reason === ""
      && actual.candidate_work_id === "";
  }
  if (expectedDecisionType === "ask_clarifying_question") {
    return actual.selected_work_id === ""
      && actual.work_status === ""
      && actual.next_step_summary === ""
      && actual.abstention_reason === ""
      && actual.escalation_target === "";
  }
  if (expectedDecisionType === "abstain_insufficient_evidence") {
    return actual.selected_work_id === ""
      && actual.work_status === ""
      && actual.next_step_summary === ""
      && actual.clarifying_question === ""
      && actual.escalation_target === ""
      && actual.candidate_work_id === "";
  }
  return false;
}

function scoreActionField(actual: ModelAnswer, expected: ExpectedAnswer, nextStepAccuracy: boolean): boolean {
  if (expected.decision_type === "resume_work") {
    return nextStepAccuracy;
  }
  if (expected.decision_type === "resume_blocked_with_escalation") {
    return nextStepAccuracy && normalizeForMatch(actual.escalation_target) === normalizeForMatch(expected.escalation_target);
  }
  if (expected.decision_type === "ask_clarifying_question") {
    return normalizeForMatch(actual.clarifying_question) === normalizeForMatch(expected.clarifying_question);
  }
  if (expected.decision_type === "abstain_insufficient_evidence") {
    return normalizeForMatch(actual.abstention_reason) === normalizeForMatch(expected.abstention_reason);
  }
  return false;
}

function gradeAnswer(actual: ModelAnswer, expected: ExpectedAnswer, slots: NextStepSlots, ontology: Ontology, candidateWorkIdAllowed: boolean): GradeResult {
  const decisionTypeCorrect = normalizeForMatch(actual.decision_type) === normalizeForMatch(expected.decision_type);
  const selectedWorkIdCorrect = normalizeForMatch(actual.selected_work_id) === normalizeForMatch(expected.selected_work_id);
  const workStatusCorrect = normalizeForMatch(actual.work_status) === normalizeForMatch(expected.work_status);
  const nextStepAccuracy = expected.next_step_summary === ""
    ? actual.next_step_summary === ""
    : scoreNextStepSummary(actual.next_step_summary, slots);
  const clarifyingQuestionCorrect = normalizeForMatch(actual.clarifying_question) === normalizeForMatch(expected.clarifying_question);
  const abstentionReasonCorrect = normalizeForMatch(actual.abstention_reason) === normalizeForMatch(expected.abstention_reason);
  const escalationTargetCorrect = normalizeForMatch(actual.escalation_target) === normalizeForMatch(expected.escalation_target);
  const exactLabelEvidenceAccuracy = normalizeForMatch(actual.primary_evidence_source) === normalizeForMatch(expected.primary_evidence_source);
  const compatibleFamilyEvidenceAccuracy = scoreCompatibleEvidenceFamily(
    normalizeText(actual.primary_evidence_source),
    normalizeText(expected.primary_evidence_source),
    ontology,
  );
  const emptyFieldsCorrect = requiredEmptyFieldsCorrect(actual, expected.decision_type);
  const actionFieldCorrect = scoreActionField(actual, expected, nextStepAccuracy);
  const candidateWorkIdCorrect = candidateWorkIdAllowed
    ? normalizeForMatch(actual.candidate_work_id) === normalizeForMatch(expected.candidate_work_id ?? "")
    : actual.candidate_work_id === "";

  return {
    decision_type_correct: decisionTypeCorrect,
    selected_work_id_correct: selectedWorkIdCorrect,
    work_status_correct: workStatusCorrect,
    next_step_accuracy: nextStepAccuracy,
    clarifying_question_correct: clarifyingQuestionCorrect,
    abstention_reason_correct: abstentionReasonCorrect,
    escalation_target_correct: escalationTargetCorrect,
    exact_label_evidence_accuracy: exactLabelEvidenceAccuracy,
    compatible_family_evidence_accuracy: compatibleFamilyEvidenceAccuracy,
    required_empty_fields_correct: emptyFieldsCorrect,
    decision_action_core_accuracy: decisionTypeCorrect && selectedWorkIdCorrect && workStatusCorrect,
    strict_contract_accuracy: decisionTypeCorrect
      && selectedWorkIdCorrect
      && workStatusCorrect
      && normalizeForMatch(actual.next_step_summary) === normalizeForMatch(expected.next_step_summary)
      && clarifyingQuestionCorrect
      && abstentionReasonCorrect
      && escalationTargetCorrect
      && exactLabelEvidenceAccuracy,
    action_valid_success: decisionTypeCorrect
      && selectedWorkIdCorrect
      && workStatusCorrect
      && actionFieldCorrect
      && emptyFieldsCorrect,
    abstention_accuracy: expected.decision_type === "abstain_insufficient_evidence" ? abstentionReasonCorrect : null,
    clarification_accuracy: expected.decision_type === "ask_clarifying_question" ? clarifyingQuestionCorrect : null,
    escalation_accuracy: expected.decision_type === "resume_blocked_with_escalation" ? escalationTargetCorrect : null,
    candidate_work_id_allowed: candidateWorkIdAllowed,
    candidate_work_id_correct: expected.decision_type === "ask_clarifying_question" ? candidateWorkIdCorrect : null,
  };
}

function codexConfigArgs(reasoningSetting: string, extraConfigs: string[]): string[] {
  const args: string[] = [];
  if (["low", "medium", "high", "xhigh"].includes(reasoningSetting)) {
    args.push("-c", `model_reasoning_effort="${reasoningSetting}"`);
  }
  for (const config of extraConfigs) {
    args.push("-c", config);
  }
  return args;
}

async function runCodex(prompt: string, modelId: string, reasoningSetting: string, extraConfigs: string[]): Promise<ModelAnswer> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "tasklog-v3-holdout-"));
  const schemaPath = path.join(tempDir, "schema.json");
  const outputPath = path.join(tempDir, "answer.json");

  try {
    await fs.writeFile(schemaPath, JSON.stringify(answerSchema(), null, 2), "utf8");
    const args = [
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
      ...codexConfigArgs(reasoningSetting, extraConfigs),
      prompt,
    ];
    await execFile("codex", args, {
      maxBuffer: 1024 * 1024 * 32,
      timeout: 120_000,
    });
    return normalizeAnswer(JSON.parse(await fs.readFile(outputPath, "utf8")) as Record<string, unknown>);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

function buildPrompt(fixtureId: string, question: Question, sharedPrompt: string, armLabel: string, payload: unknown): string {
  return [
    "You are answering one frozen V3 benchmark variant.",
    "Use only the evidence payload below.",
    "Return exactly one JSON object matching the frozen V3 answer contract.",
    "If the evidence is insufficient, ask one clarifying question or abstain instead of guessing.",
    "",
    sharedPrompt,
    "",
    "Required JSON fields:",
    "- decision_type",
    "- selected_work_id",
    "- work_status",
    "- next_step_summary",
    "- clarifying_question",
    "- abstention_reason",
    "- escalation_target",
    "- primary_evidence_source",
    "- candidate_work_id (always include; use empty string unless needed and justified)",
    "",
    "Valid decision_type values:",
    "- resume_work",
    "- resume_blocked_with_escalation",
    "- ask_clarifying_question",
    "- abstain_insufficient_evidence",
    "",
    "Valid primary_evidence_source values:",
    "- active_context",
    "- work_summary",
    "- latest_session_log",
    "- latest_next_steps",
    "- workdoc_plan",
    "- workdoc_design",
    "- workdoc_spec",
    "- workdoc_notes",
    "- artifact_file",
    "- notes_markdown",
    "- conflicting_sources",
    "- no_authoritative_source",
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

function median(numbers: number[]): number | null {
  if (numbers.length === 0) {
    return null;
  }
  const sorted = [...numbers].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Number((((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2).toFixed(2));
  }
  return Number((sorted[middle] ?? 0).toFixed(2));
}

function percent(count: number, total: number): number {
  if (total === 0) {
    return 0;
  }
  return Number(((count / total) * 100).toFixed(2));
}

function summarizeStats(rows: ResponseRow[]): SummaryStats {
  return {
    total: rows.length,
    action_valid_success_count: rows.filter((row) => row.grade.action_valid_success).length,
    decision_action_core_accuracy_count: rows.filter((row) => row.grade.decision_action_core_accuracy).length,
    strict_contract_accuracy_count: rows.filter((row) => row.grade.strict_contract_accuracy).length,
    next_step_accuracy_count: rows.filter((row) => row.grade.next_step_accuracy).length,
    exact_label_evidence_accuracy_count: rows.filter((row) => row.grade.exact_label_evidence_accuracy).length,
    compatible_family_evidence_accuracy_count: rows.filter((row) => row.grade.compatible_family_evidence_accuracy).length,
    payload_bytes_median: median(rows.map((row) => row.payload_bytes)),
  };
}

function summarizeRows(rows: ResponseRow[], expectedRowCount: number, status: RunStatus, failureMessage?: string): Record<string, unknown> {
  const byArm = new Map<string, SummaryStats>();
  const byFamily = new Map<string, Map<string, SummaryStats>>();

  for (const arm of ARMS) {
    const armRows = rows.filter((row) => row.arm_id === arm.arm_id);
    byArm.set(arm.display_label, summarizeStats(armRows));
  }

  const families = [...new Set(rows.map((row) => row.family))].sort();
  for (const family of families) {
    const armMap = new Map<string, SummaryStats>();
    for (const arm of ARMS) {
      const familyRows = rows.filter((row) => row.family === family && row.arm_id === arm.arm_id);
      armMap.set(arm.display_label, summarizeStats(familyRows));
    }
    byFamily.set(family, armMap);
  }

  const pairedDifferences = rows.reduce<Map<string, { normalized?: ResponseRow; tasklog?: ResponseRow }>>((accumulator, row) => {
    const entry = accumulator.get(row.fixture_id) ?? {};
    if (row.arm_id === "normalized_state") {
      entry.normalized = row;
    } else if (row.arm_id === "tasklog_reentry") {
      entry.tasklog = row;
    }
    accumulator.set(row.fixture_id, entry);
    return accumulator;
  }, new Map());

  const pairedActionDiffs = [...pairedDifferences.values()]
    .filter((pair) => pair.normalized && pair.tasklog)
    .map((pair) => (pair.tasklog!.grade.action_valid_success ? 1 : 0) - (pair.normalized!.grade.action_valid_success ? 1 : 0));

  return {
    status,
    failure_message: failureMessage ?? null,
    expected_response_count: expectedRowCount,
    completed_response_count: rows.length,
    completion_percent: percent(rows.length, expectedRowCount),
    by_arm: [...byArm.entries()].map(([displayLabel, stats]) => ({
      display_label: displayLabel,
      total: stats.total,
      action_valid_success_count: stats.action_valid_success_count,
      action_valid_success_percent: percent(stats.action_valid_success_count, stats.total),
      decision_action_core_accuracy_count: stats.decision_action_core_accuracy_count,
      decision_action_core_accuracy_percent: percent(stats.decision_action_core_accuracy_count, stats.total),
      strict_contract_accuracy_count: stats.strict_contract_accuracy_count,
      strict_contract_accuracy_percent: percent(stats.strict_contract_accuracy_count, stats.total),
      next_step_accuracy_count: stats.next_step_accuracy_count,
      next_step_accuracy_percent: percent(stats.next_step_accuracy_count, stats.total),
      exact_label_evidence_accuracy_count: stats.exact_label_evidence_accuracy_count,
      exact_label_evidence_accuracy_percent: percent(stats.exact_label_evidence_accuracy_count, stats.total),
      compatible_family_evidence_accuracy_count: stats.compatible_family_evidence_accuracy_count,
      compatible_family_evidence_accuracy_percent: percent(stats.compatible_family_evidence_accuracy_count, stats.total),
      payload_bytes_median: stats.payload_bytes_median,
    })),
    by_family: [...byFamily.entries()].map(([family, armStats]) => ({
      family,
      arms: [...armStats.entries()].map(([displayLabel, stats]) => ({
        display_label: displayLabel,
        total: stats.total,
        action_valid_success_count: stats.action_valid_success_count,
        action_valid_success_percent: percent(stats.action_valid_success_count, stats.total),
      })),
    })),
    paired_action_valid_success_difference: {
      pair_count: pairedActionDiffs.length,
      mean_difference: pairedActionDiffs.length === 0
        ? null
        : Number((pairedActionDiffs.reduce((sum, value) => sum + value, 0) / pairedActionDiffs.length).toFixed(4)),
    },
  };
}

async function persistArtifacts(context: PersistContext): Promise<void> {
  const answersPath = path.join(context.outDir, "v3-answers.json");
  const metadataPath = path.join(context.outDir, "v3-answers.meta.json");
  const gradedPath = path.join(context.outDir, "v3-graded.json");
  const statusPath = path.join(context.outDir, "v3-run-status.json");
  const summary = summarizeRows(context.rows, context.expectedRowCount, context.status, context.failureMessage);

  await writeJson(answersPath, {
    benchmark_type: BENCHMARK_TYPE,
    round_id: ROUND_ID,
    split: "holdout",
    run_id: context.runId,
    model_slot: context.options.modelSlot,
    repetition_index: context.options.repetitionIndex,
    model_id: context.options.modelId,
    responses: context.rows,
  });

  await writeJson(metadataPath, {
    benchmark_type: BENCHMARK_TYPE,
    round_id: ROUND_ID,
    split: "holdout",
    provider: context.options.provider,
    model_id: context.options.modelId,
    model_family: context.options.modelFamily,
    reasoning_setting: context.options.reasoningSetting,
    runner_name: RUNNER_NAME,
    runner_version: RUNNER_VERSION,
    project_root: context.options.fixturesRoot,
    pack_path: context.packPath,
    answers_path: answersPath,
    metadata_path: metadataPath,
    run_id: context.runId,
    submitted_at: new Date().toISOString(),
    model_slot: context.options.modelSlot,
    repetition_index: context.options.repetitionIndex,
    status: context.status,
    failure_message: context.failureMessage ?? null,
    responses: context.rows.map((row) => ({
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
      input_tokens: row.input_tokens,
      output_tokens: row.output_tokens,
      cache_creation_input_tokens: row.cache_creation_input_tokens,
      cache_read_input_tokens: row.cache_read_input_tokens,
      estimated_cost_usd: row.estimated_cost_usd,
    })),
  });

  await writeJson(gradedPath, {
    benchmark_type: BENCHMARK_TYPE,
    round_id: ROUND_ID,
    split: "holdout",
    run_id: context.runId,
    model_slot: context.options.modelSlot,
    repetition_index: context.options.repetitionIndex,
    summary,
    responses: context.rows,
  });

  await writeJson(statusPath, {
    benchmark_type: BENCHMARK_TYPE,
    round_id: ROUND_ID,
    run_id: context.runId,
    model_slot: context.options.modelSlot,
    repetition_index: context.options.repetitionIndex,
    status: context.status,
    completed_response_count: context.rows.length,
    expected_response_count: context.expectedRowCount,
    failure_message: context.failureMessage ?? null,
  });
}

function assertValidMetadata(options: CliOptions): void {
  if (RUNNER_NAME !== "tasklog-benchmark-runner" || RUNNER_VERSION !== "2026-03-29-v3a") {
    throw new Error("Runner identity drift detected. V3a must use tasklog-benchmark-runner / 2026-03-29-v3a.");
  }
  if (options.repetitionIndex < 1 || options.repetitionIndex > 3) {
    throw new Error("V3a repetition_index must be 1, 2, or 3.");
  }
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  assertValidMetadata(options);

  const packPath = path.join(options.fixturesRoot, PACK_MANIFEST_NAME);
  const packManifest = await readJson<PackManifest>(packPath);
  if (packManifest.benchmark_type !== BENCHMARK_TYPE || packManifest.round_id !== ROUND_ID) {
    throw new Error(`Unexpected pack manifest at ${packPath}`);
  }

  const fixtureIds = options.fixtureIds.length > 0 ? options.fixtureIds : packManifest.authored_fixture_ids;
  const answerKeyManifest = await readJson<AnswerKeyManifest>(path.join(options.fixturesRoot, ANSWER_KEY_MANIFEST_PATH));
  if (answerKeyManifest.status !== "answer_keys_frozen") {
    throw new Error("V3a runner requires annotation/frozen-answer-key-manifest.json with status answer_keys_frozen.");
  }

  const ontology = await readJson<Ontology>("/Users/Lab/Desktop/WebWay/tasklog-mcp/docs/tasklog-v3-source-family-ontology.json");
  const answerKeyByFixture = new Map(answerKeyManifest.entries.map((entry) => [entry.fixture_id, entry]));
  const runId = `tasklog-v3-${options.modelSlot}-rep${options.repetitionIndex}-${new Date().toISOString().replace(/[:.]/g, "-")}`;
  const rows: ResponseRow[] = [];
  const expectedRowCount = fixtureIds.length * options.arms.length;

  await persistArtifacts({
    options,
    runId,
    status: "running",
    rows,
    expectedRowCount,
    packPath,
    outDir: options.outDir,
  });

  try {
    for (const fixtureId of fixtureIds) {
      const answerKey = answerKeyByFixture.get(fixtureId);
      if (!answerKey) {
        throw new Error(`Missing frozen answer key entry for fixture ${fixtureId}`);
      }

      const fixtureRoot = path.join(options.fixturesRoot, fixtureId);
      const fixtureManifest = await readJson<FixtureManifest>(path.join(fixtureRoot, "fixture-manifest.json"));
      const questions = await readJson<QuestionPack>(fixtureManifest.files.questions);
      const question = questions.questions[0];
      if (!question) {
        throw new Error(`Fixture ${fixtureId} is missing a question.`);
      }

      for (const armId of options.arms) {
        const arm = ARMS.find((entry) => entry.arm_id === armId);
        if (!arm) {
          throw new Error(`Unknown arm: ${armId}`);
        }

        const payloadPath = fixtureManifest.files[arm.manifest_key];
        const payloadFile = await readJsonText(payloadPath);
        const prompt = buildPrompt(fixtureId, question, questions.shared_prompt, arm.display_label, payloadFile.parsed);
        const startedAt = new Date().toISOString();
        const startedMs = Date.now();

        console.error(
          `[v3] slot=${options.modelSlot} rep=${options.repetitionIndex} fixture=${fixtureId} arm=${arm.display_label} model=${options.modelId}`,
        );

        const answer = await runCodex(prompt, options.modelId, options.reasoningSetting, options.codexConfigs);
        const finishedAt = new Date().toISOString();
        const grade = gradeAnswer(
          answer,
          answerKey.expected_answer,
          answerKey.next_step_slots,
          ontology,
          answerKey.frozen_constraints.candidate_work_id_allowed,
        );

        rows.push({
          benchmark_type: BENCHMARK_TYPE,
          round_id: ROUND_ID,
          split: "holdout",
          fixture_id: fixtureId,
          question_id: question.question_id,
          family: question.family,
          title: question.title,
          difficulty: question.expected_difficulty,
          variant_label: arm.variant_label,
          arm_id: arm.arm_id,
          display_label: arm.display_label,
          provider: options.provider,
          model_slot: options.modelSlot,
          repetition_index: options.repetitionIndex,
          model_id: options.modelId,
          model_family: options.modelFamily,
          reasoning_setting: options.reasoningSetting,
          runner_name: RUNNER_NAME,
          runner_version: RUNNER_VERSION,
          run_id: runId,
          run_started_at: startedAt,
          run_finished_at: finishedAt,
          latency_ms: Date.now() - startedMs,
          input_tokens: null,
          output_tokens: null,
          cache_creation_input_tokens: null,
          cache_read_input_tokens: null,
          estimated_cost_usd: null,
          payload_bytes: Buffer.byteLength(payloadFile.text, "utf8"),
          payload_path: payloadPath,
          answer,
          expected_answer: answerKey.expected_answer,
          next_step_slots: answerKey.next_step_slots,
          grade,
        });

        await persistArtifacts({
          options,
          runId,
          status: "running",
          rows,
          expectedRowCount,
          packPath,
          outDir: options.outDir,
        });
      }
    }

    await persistArtifacts({
      options,
      runId,
      status: "completed",
      rows,
      expectedRowCount,
      packPath,
      outDir: options.outDir,
    });

    console.log(JSON.stringify({
      run_id: runId,
      out_dir: options.outDir,
      model_slot: options.modelSlot,
      repetition_index: options.repetitionIndex,
      row_count: rows.length,
      expected_row_count: expectedRowCount,
    }, null, 2));
  } catch (error) {
    const failureMessage = error instanceof Error ? error.stack ?? error.message : String(error);
    await persistArtifacts({
      options,
      runId,
      status: "failed",
      rows,
      expectedRowCount,
      packPath,
      outDir: options.outDir,
      failureMessage,
    });
    throw error;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
});
