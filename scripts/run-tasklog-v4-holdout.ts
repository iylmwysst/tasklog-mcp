import { execFile as execFileCallback, execFileSync } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);

const DEFAULT_FIXTURES_ROOT = "/Users/Lab/Desktop/TasklogSweLab/fixtures-v4";
const DEFAULT_RUNS_ROOT = "/Users/Lab/Desktop/TasklogSweLab/runs";
const BENCHMARK_TYPE = "tasklog_v4_swe_grounded_reentry";
const PACK_MANIFEST_NAME = "pack-manifest.json";
const ANSWER_KEY_MANIFEST_PATH = path.join("annotation", "frozen-answer-key-manifest.json");
const ONTOLOGY_PATH = "/Users/Lab/Desktop/WebWay/tasklog-mcp/docs/tasklog-v4-source-family-ontology.json";

type ArmId = "normalized_state" | "tasklog_reentry";
type ModelSlot =
  | "slot_a_openai_frontier_large"
  | "slot_b_openai_frontier_small"
  | "slot_c_external_closed_frontier";
type RunStatus = "running" | "completed" | "failed";
type RoundProfileId = "V4" | "V4.1";

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
  roundId: RoundProfileId;
  regradeFrom?: string;
}

interface SlotDefaults {
  provider: string;
  modelId: string;
  modelFamily: string;
  reasoningSetting: string;
}

interface PackFixture {
  fixture_id: string;
  family_id: string;
  difficulty: string;
}

interface PackManifest {
  version: number;
  round_id: string;
  benchmark_type: string;
  fixture_count: number;
  fixtures: PackFixture[];
}

interface Question {
  question_id: string;
  title: string;
  goal: string;
  task: string;
}

interface QuestionsPack {
  fixture_id: string;
  round_id: string;
  benchmark_type: string;
  questions: Question[];
}

interface FrozenConstraints {
  family_id: string;
  primary_decision_mode: string;
  difficulty: string;
  candidate_work_id_allowed: boolean;
  rubric_fallback_family: boolean;
  expected_label_mode: string;
  fixture_stage: string;
  human_audit_status: string;
}

interface FrozenAnswer {
  decision_type: string;
  selected_work_id: string;
  selected_work_title: string;
  work_status: string;
  next_step_summary: string;
  clarifying_question: string;
  abstention_reason: string;
  escalation_target: string;
  primary_evidence_source: string;
  other_candidate_work_ids: string[];
}

interface NextStepSlots {
  action_verb: string;
  primary_target: string;
  gating_constraint: string;
}

interface AnswerKeyEntry {
  fixture_id: string;
  question_id: string;
  frozen_constraints: FrozenConstraints;
  references: {
    fixture_path: string;
    fixture_manifest_path: string;
    questions_path: string;
    normalized_state_path: string;
    tasklog_reentry_path: string;
    workspace_root: string;
    workdocs_root: string;
    answer_contract_path: string;
    grader_contract_path: string;
    ontology_path: string;
    adjudication_guide_path: string;
    annotator_a_draft_path: string;
    annotator_b_draft_path: string;
    adjudication_log_path: string;
  };
  answer_key_status: string;
  frozen_answer?: FrozenAnswer;
  frozen_next_step_slots?: NextStepSlots;
}

interface AnswerKeyManifest {
  version: number;
  round_id: string;
  benchmark_type: string;
  status: string;
  entry_count: number;
  entries: AnswerKeyEntry[];
}

interface Ontology {
  version: number | string;
  benchmark_type: string;
  exact_label_to_family: Record<string, string>;
}

interface ClaudeExecResult {
  structured_output?: unknown;
}

interface ModelAnswer {
  decision_type: string;
  selected_work_id: string;
  selected_work_title: string;
  work_status: string;
  next_step_summary: string;
  clarifying_question: string;
  abstention_reason: string;
  escalation_target: string;
  primary_evidence_source: string;
  other_candidate_work_ids: string[];
  selection_rationale: string;
}

interface GradeResult {
  decision_type_correct: boolean;
  selected_work_id_correct: boolean;
  selected_work_title_correct: boolean;
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
  provisional_candidate_diagnostic: boolean | null;
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
  expected_answer: FrozenAnswer;
  next_step_slots: NextStepSlots;
  grade: GradeResult;
}

interface SummaryStats {
  total: number;
  action_valid_success_count: number;
  decision_action_core_accuracy_count: number;
  strict_contract_accuracy_count: number;
  required_empty_fields_correct_count: number;
  next_step_accuracy_count: number;
  exact_label_evidence_accuracy_count: number;
  compatible_family_evidence_accuracy_count: number;
  payload_bytes_median: number | null;
}

interface RoundProfile {
  outputRoundId: RoundProfileId;
  sourceRoundId: "V4";
  runnerName: string;
  runnerVersion: string;
  artifactPrefix: string;
  runIdPrefix: string;
}

interface PersistContext {
  options: CliOptions;
  round: RoundProfile;
  runId: string;
  status: RunStatus;
  rows: ResponseRow[];
  expectedRowCount: number;
  packPath: string;
  outDir: string;
  failureMessage?: string;
  sourceAnswersPath?: string;
  sourceRunId?: string;
  sourceRoundId?: string;
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
    referenceKey: "normalized_state_path" as const,
  },
  {
    arm_id: "tasklog_reentry" as const,
    variant_label: "E",
    display_label: "Tasklog Re-entry",
    referenceKey: "tasklog_reentry_path" as const,
  },
];

const ROUND_PROFILES: Record<RoundProfileId, RoundProfile> = {
  V4: {
    outputRoundId: "V4",
    sourceRoundId: "V4",
    runnerName: "tasklog-v4-holdout-runner",
    runnerVersion: "2026-03-31-v4-freeze",
    artifactPrefix: "v4",
    runIdPrefix: "tasklog-v4",
  },
  "V4.1": {
    outputRoundId: "V4.1",
    sourceRoundId: "V4",
    runnerName: "tasklog-v4-1-holdout-runner",
    runnerVersion: "2026-03-31-v4-1-go-no-go",
    artifactPrefix: "v4-1",
    runIdPrefix: "tasklog-v4-1",
  },
};

function parseArgs(argv: string[]): CliOptions {
  let fixturesRoot = DEFAULT_FIXTURES_ROOT;
  let fixtureIds: string[] = [];
  let arms = ARMS.map((arm) => arm.arm_id);
  let modelSlot: ModelSlot = "slot_b_openai_frontier_small";
  let repetitionIndex = 1;
  let outDir: string | undefined;
  const codexConfigs: string[] = [];
  let roundId: RoundProfileId = "V4";
  let regradeFrom: string | undefined;
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
    if (current === "--round-id") {
      const candidate = argv[index + 1];
      if (candidate === "V4" || candidate === "V4.1") {
        roundId = candidate;
      }
      index += 1;
      continue;
    }
    if (current === "--regrade-from") {
      const value = argv[index + 1];
      if (value) {
        regradeFrom = path.resolve(value);
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

  const round = ROUND_PROFILES[roundId];
  const resolvedOutDir = outDir ?? path.join(
    DEFAULT_RUNS_ROOT,
    `${round.artifactPrefix}-${modelSlot}-rep${repetitionIndex}-${new Date().toISOString().replace(/[:.]/g, "-")}`,
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
    roundId,
    regradeFrom,
  };
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
      clarifying_question: { type: "string" },
      abstention_reason: { type: "string" },
      escalation_target: { type: "string" },
      primary_evidence_source: { type: "string" },
      other_candidate_work_ids: {
        type: "array",
        items: { type: "string" },
      },
      selection_rationale: { type: "string" },
    },
    required: [
      "decision_type",
      "selected_work_id",
      "selected_work_title",
      "work_status",
      "next_step_summary",
      "clarifying_question",
      "abstention_reason",
      "escalation_target",
      "primary_evidence_source",
      "other_candidate_work_ids",
      "selection_rationale",
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

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function summarizeExecText(value: string): string {
  const normalized = value.trim();
  if (normalized.length === 0) {
    return "";
  }
  return normalized.slice(-4000);
}

function normalizeForMatch(value: unknown): string {
  return normalizeText(value).toLowerCase().replace(/`/g, "");
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return [...new Set(value.map((item) => normalizeText(item)).filter((item) => item.length > 0))];
}

function normalizeAnswer(parsed: Record<string, unknown>): ModelAnswer {
  return {
    decision_type: normalizeText(parsed.decision_type),
    selected_work_id: normalizeText(parsed.selected_work_id),
    selected_work_title: normalizeText(parsed.selected_work_title),
    work_status: normalizeText(parsed.work_status),
    next_step_summary: normalizeText(parsed.next_step_summary),
    clarifying_question: normalizeText(parsed.clarifying_question),
    abstention_reason: normalizeText(parsed.abstention_reason),
    escalation_target: normalizeText(parsed.escalation_target),
    primary_evidence_source: normalizeText(parsed.primary_evidence_source),
    other_candidate_work_ids: normalizeStringArray(parsed.other_candidate_work_ids),
    selection_rationale: normalizeText(parsed.selection_rationale),
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

function compareStringSets(actual: string[], expected: string[]): boolean {
  const normalizedActual = [...new Set(actual.map((item) => normalizeForMatch(item)).filter(Boolean))].sort();
  const normalizedExpected = [...new Set(expected.map((item) => normalizeForMatch(item)).filter(Boolean))].sort();
  return JSON.stringify(normalizedActual) === JSON.stringify(normalizedExpected);
}

function requiredEmptyFieldsCorrect(actual: ModelAnswer, expected: FrozenAnswer): boolean {
  if (expected.decision_type === "resume_work") {
    return actual.clarifying_question === ""
      && actual.abstention_reason === ""
      && actual.escalation_target === ""
      && actual.other_candidate_work_ids.length === 0;
  }
  if (expected.decision_type === "resume_blocked_with_escalation") {
    return actual.clarifying_question === ""
      && actual.abstention_reason === ""
      && actual.other_candidate_work_ids.length === 0;
  }
  if (expected.decision_type === "ask_clarifying_question") {
    const candidateSetValid = compareStringSets(actual.other_candidate_work_ids, expected.other_candidate_work_ids);
    return actual.selected_work_id === ""
      && actual.selected_work_title === ""
      && actual.work_status === ""
      && actual.next_step_summary === ""
      && actual.abstention_reason === ""
      && actual.escalation_target === ""
      && candidateSetValid;
  }
  if (expected.decision_type === "abstain_insufficient_evidence") {
    return actual.selected_work_id === ""
      && actual.selected_work_title === ""
      && actual.work_status === ""
      && actual.next_step_summary === ""
      && actual.clarifying_question === ""
      && actual.escalation_target === ""
      && actual.other_candidate_work_ids.length === 0;
  }
  return false;
}

function scoreActionField(
  actual: ModelAnswer,
  expected: FrozenAnswer,
  nextStepAccuracy: boolean,
  roundId: RoundProfileId,
): boolean {
  if (roundId === "V4.1") {
    if (expected.decision_type === "resume_work") {
      return nextStepAccuracy;
    }
    if (expected.decision_type === "resume_blocked_with_escalation") {
      return nextStepAccuracy && actual.escalation_target.length > 0;
    }
    if (expected.decision_type === "ask_clarifying_question") {
      return actual.clarifying_question.length > 0;
    }
    if (expected.decision_type === "abstain_insufficient_evidence") {
      return actual.abstention_reason.length > 0;
    }
    return false;
  }

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

function gradeAnswer(
  actual: ModelAnswer,
  expected: FrozenAnswer,
  slots: NextStepSlots,
  ontology: Ontology,
  roundId: RoundProfileId,
): GradeResult {
  const decisionTypeCorrect = normalizeForMatch(actual.decision_type) === normalizeForMatch(expected.decision_type);
  const selectedWorkIdCorrect = normalizeForMatch(actual.selected_work_id) === normalizeForMatch(expected.selected_work_id);
  const selectedWorkTitleCorrect = normalizeForMatch(actual.selected_work_title) === normalizeForMatch(expected.selected_work_title);
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
  const emptyFieldsCorrect = requiredEmptyFieldsCorrect(actual, expected);
  const actionFieldCorrect = scoreActionField(actual, expected, nextStepAccuracy, roundId);
  const decisionActionCoreAccuracy = decisionTypeCorrect && selectedWorkIdCorrect && selectedWorkTitleCorrect && workStatusCorrect;
  const provisionalCandidateDiagnostic = expected.decision_type === "ask_clarifying_question"
    ? compareStringSets(actual.other_candidate_work_ids, expected.other_candidate_work_ids)
    : null;

  return {
    decision_type_correct: decisionTypeCorrect,
    selected_work_id_correct: selectedWorkIdCorrect,
    selected_work_title_correct: selectedWorkTitleCorrect,
    work_status_correct: workStatusCorrect,
    next_step_accuracy: nextStepAccuracy,
    clarifying_question_correct: clarifyingQuestionCorrect,
    abstention_reason_correct: abstentionReasonCorrect,
    escalation_target_correct: escalationTargetCorrect,
    exact_label_evidence_accuracy: exactLabelEvidenceAccuracy,
    compatible_family_evidence_accuracy: compatibleFamilyEvidenceAccuracy,
    required_empty_fields_correct: emptyFieldsCorrect,
    decision_action_core_accuracy: decisionActionCoreAccuracy,
    strict_contract_accuracy: decisionTypeCorrect
      && selectedWorkIdCorrect
      && selectedWorkTitleCorrect
      && workStatusCorrect
      && normalizeForMatch(actual.next_step_summary) === normalizeForMatch(expected.next_step_summary)
      && clarifyingQuestionCorrect
      && abstentionReasonCorrect
      && escalationTargetCorrect
      && exactLabelEvidenceAccuracy
      && compareStringSets(actual.other_candidate_work_ids, expected.other_candidate_work_ids),
    action_valid_success: decisionActionCoreAccuracy
      && actionFieldCorrect
      && (roundId === "V4" ? emptyFieldsCorrect : true),
    abstention_accuracy: expected.decision_type === "abstain_insufficient_evidence" ? abstentionReasonCorrect : null,
    clarification_accuracy: expected.decision_type === "ask_clarifying_question" ? clarifyingQuestionCorrect : null,
    escalation_accuracy: expected.decision_type === "resume_blocked_with_escalation" ? escalationTargetCorrect : null,
    provisional_candidate_diagnostic: provisionalCandidateDiagnostic,
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

function claudeModelArg(modelId: string): string {
  if (modelId === "claude-sonnet-4.6") {
    return "claude-sonnet-4-6";
  }
  if (modelId === "claude-opus-4.6") {
    return "claude-opus-4-6";
  }
  if (modelId === "claude-haiku-4.5") {
    return "claude-haiku-4-5";
  }
  return modelId.replace(/\./g, "-");
}

function claudeEffortArgs(reasoningSetting: string): string[] {
  if (reasoningSetting === "low" || reasoningSetting === "medium" || reasoningSetting === "high") {
    return ["--effort", reasoningSetting];
  }
  return [];
}

async function runCodexOnce(prompt: string, modelId: string, reasoningSetting: string, extraConfigs: string[]): Promise<ModelAnswer> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "tasklog-v4-holdout-"));
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
    const { stdout, stderr } = await execFile("codex", args, {
      maxBuffer: 1024 * 1024 * 32,
      timeout: 120_000,
    });

    if (!await pathExists(outputPath)) {
      const stderrSummary = summarizeExecText(stderr);
      const stdoutSummary = summarizeExecText(stdout);
      throw new Error(
        [
          "Codex finished without writing answer.json.",
          stderrSummary ? `stderr_tail:\n${stderrSummary}` : "",
          stdoutSummary ? `stdout_tail:\n${stdoutSummary}` : "",
        ].filter(Boolean).join("\n\n"),
      );
    }

    const rawAnswer = await fs.readFile(outputPath, "utf8");
    if (rawAnswer.trim().length === 0) {
      const stderrSummary = summarizeExecText(stderr);
      const stdoutSummary = summarizeExecText(stdout);
      throw new Error(
        [
          "Codex wrote an empty answer.json file.",
          stderrSummary ? `stderr_tail:\n${stderrSummary}` : "",
          stdoutSummary ? `stdout_tail:\n${stdoutSummary}` : "",
        ].filter(Boolean).join("\n\n"),
      );
    }

    return normalizeAnswer(JSON.parse(rawAnswer) as Record<string, unknown>);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

async function runCodex(prompt: string, modelId: string, reasoningSetting: string, extraConfigs: string[]): Promise<ModelAnswer> {
  try {
    return await runCodexOnce(prompt, modelId, reasoningSetting, extraConfigs);
  } catch (firstError) {
    const firstMessage = firstError instanceof Error ? firstError.stack ?? firstError.message : String(firstError);
    console.error(`[v4] transient runner failure, retrying once\n${firstMessage}`);
    try {
      return await runCodexOnce(prompt, modelId, reasoningSetting, extraConfigs);
    } catch (secondError) {
      const secondMessage = secondError instanceof Error ? secondError.stack ?? secondError.message : String(secondError);
      throw new Error(`V4 runner failed twice for the same prompt.\n\nfirst_attempt:\n${firstMessage}\n\nsecond_attempt:\n${secondMessage}`);
    }
  }
}

async function runClaudeOnce(prompt: string, modelId: string, reasoningSetting: string): Promise<ModelAnswer> {
  const args = [
    "-p",
    "--output-format",
    "json",
    "--json-schema",
    JSON.stringify(answerSchema()),
    "--permission-mode",
    "dontAsk",
    "--tools",
    "",
    "--no-session-persistence",
    "--model",
    claudeModelArg(modelId),
    ...claudeEffortArgs(reasoningSetting),
    prompt,
  ];

  let stdout = "";
  let stderr = "";
  try {
    stdout = execFileSync("claude", args, {
      encoding: "utf8",
      maxBuffer: 1024 * 1024 * 32,
      timeout: 240_000,
      stdio: ["ignore", "pipe", "pipe"],
    }) as string;
  } catch (error) {
    const maybeError = error as { stdout?: string | Buffer; stderr?: string | Buffer; message?: string };
    stdout = typeof maybeError.stdout === "string" ? maybeError.stdout : maybeError.stdout?.toString("utf8") ?? "";
    stderr = typeof maybeError.stderr === "string" ? maybeError.stderr : maybeError.stderr?.toString("utf8") ?? "";
    const stderrSummary = summarizeExecText(stderr);
    const stdoutSummary = summarizeExecText(stdout);
    throw new Error(
      [
        maybeError.message ?? "Claude CLI invocation failed.",
        stderrSummary ? `stderr_tail:\n${stderrSummary}` : "",
        stdoutSummary ? `stdout_tail:\n${stdoutSummary}` : "",
      ].filter(Boolean).join("\n\n"),
    );
  }

  const stderrSummary = summarizeExecText(stderr);
  if (stdout.trim().length === 0) {
    throw new Error(
      [
        "Claude CLI returned empty stdout.",
        stderrSummary ? `stderr_tail:\n${stderrSummary}` : "",
      ].filter(Boolean).join("\n\n"),
    );
  }

  const parsed = JSON.parse(stdout) as ClaudeExecResult;
  return normalizeAnswer((parsed.structured_output ?? {}) as Record<string, unknown>);
}

async function runClaude(prompt: string, modelId: string, reasoningSetting: string): Promise<ModelAnswer> {
  try {
    return await runClaudeOnce(prompt, modelId, reasoningSetting);
  } catch (firstError) {
    const firstMessage = firstError instanceof Error ? firstError.stack ?? firstError.message : String(firstError);
    console.error(`[v4] transient claude runner failure, retrying once\n${firstMessage}`);
    try {
      return await runClaudeOnce(prompt, modelId, reasoningSetting);
    } catch (secondError) {
      const secondMessage = secondError instanceof Error ? secondError.stack ?? secondError.message : String(secondError);
      throw new Error(`V4 Claude runner failed twice for the same prompt.\n\nfirst_attempt:\n${firstMessage}\n\nsecond_attempt:\n${secondMessage}`);
    }
  }
}

async function runModel(options: CliOptions, prompt: string): Promise<ModelAnswer> {
  if (options.provider === "anthropic") {
    return runClaude(prompt, options.modelId, options.reasoningSetting);
  }
  return runCodex(prompt, options.modelId, options.reasoningSetting, options.codexConfigs);
}

function buildPrompt(
  roundId: RoundProfileId,
  fixtureId: string,
  question: Question,
  armLabel: string,
  payloadText: string,
): string {
  if (roundId === "V4.1") {
    return [
      "You are answering one frozen V4.1 go/no-go benchmark variant.",
      "Use only the evidence payload below.",
      "Return exactly one JSON object matching the frozen V4.1 answer contract.",
      "If the evidence is insufficient, ask one clarifying question or abstain instead of guessing.",
      "Every non-applicable string field must be the empty string \"\".",
      "Do not write placeholders such as n/a, none, unknown, or explanatory text into fields that should be empty.",
      "",
      "Required JSON fields:",
      "- decision_type",
      "- selected_work_id",
      "- selected_work_title",
      "- work_status",
      "- next_step_summary",
      "- clarifying_question",
      "- abstention_reason",
      "- escalation_target",
      "- primary_evidence_source",
      "- other_candidate_work_ids",
      "",
      "Valid decision_type values:",
      "- resume_work",
      "- resume_blocked_with_escalation",
      "- ask_clarifying_question",
      "- abstain_insufficient_evidence",
      "",
      "Field-empty rules:",
      "- resume_work: clarifying_question, abstention_reason, escalation_target must be \"\" and other_candidate_work_ids must be []",
      "- resume_blocked_with_escalation: clarifying_question and abstention_reason must be \"\" and other_candidate_work_ids must be []",
      "- ask_clarifying_question: selected_work_id, selected_work_title, work_status, next_step_summary, abstention_reason, escalation_target must be \"\"",
      "- abstain_insufficient_evidence: selected_work_id, selected_work_title, work_status, next_step_summary, clarifying_question, escalation_target must be \"\" and other_candidate_work_ids must be []",
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
      `Title: ${question.title}`,
      `Goal: ${question.goal}`,
      `Task: ${question.task}`,
      "",
      "EVIDENCE_PAYLOAD_START",
      payloadText.trim(),
      "EVIDENCE_PAYLOAD_END",
    ].join("\n");
  }

  return [
    "You are answering one frozen V4 benchmark variant.",
    "Use only the evidence payload below.",
    "Return exactly one JSON object matching the frozen V4 answer contract.",
    "If the evidence is insufficient, ask one clarifying question or abstain instead of guessing.",
    "",
    "Required JSON fields:",
    "- decision_type",
    "- selected_work_id",
    "- selected_work_title",
    "- work_status",
    "- next_step_summary",
    "- clarifying_question",
    "- abstention_reason",
    "- escalation_target",
    "- primary_evidence_source",
    "- other_candidate_work_ids",
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
    `Title: ${question.title}`,
    `Goal: ${question.goal}`,
    `Task: ${question.task}`,
    "",
    "EVIDENCE_PAYLOAD_START",
    payloadText.trim(),
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
    required_empty_fields_correct_count: rows.filter((row) => row.grade.required_empty_fields_correct).length,
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
      required_empty_fields_correct_count: stats.required_empty_fields_correct_count,
      required_empty_fields_correct_percent: percent(stats.required_empty_fields_correct_count, stats.total),
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
  const answersPath = path.join(context.outDir, `${context.round.artifactPrefix}-answers.json`);
  const metadataPath = path.join(context.outDir, `${context.round.artifactPrefix}-answers.meta.json`);
  const gradedPath = path.join(context.outDir, `${context.round.artifactPrefix}-graded.json`);
  const statusPath = path.join(context.outDir, `${context.round.artifactPrefix}-run-status.json`);
  const summary = summarizeRows(context.rows, context.expectedRowCount, context.status, context.failureMessage);
  const metadataRow = context.rows[0];

  await writeJson(answersPath, {
    benchmark_type: BENCHMARK_TYPE,
    round_id: context.round.outputRoundId,
    split: "holdout",
    run_id: context.runId,
    model_slot: metadataRow?.model_slot ?? context.options.modelSlot,
    repetition_index: metadataRow?.repetition_index ?? context.options.repetitionIndex,
    model_id: metadataRow?.model_id ?? context.options.modelId,
    responses: context.rows,
  });

  await writeJson(metadataPath, {
    benchmark_type: BENCHMARK_TYPE,
    round_id: context.round.outputRoundId,
    split: "holdout",
    provider: metadataRow?.provider ?? context.options.provider,
    model_id: metadataRow?.model_id ?? context.options.modelId,
    model_family: metadataRow?.model_family ?? context.options.modelFamily,
    reasoning_setting: metadataRow?.reasoning_setting ?? context.options.reasoningSetting,
    runner_name: context.round.runnerName,
    runner_version: context.round.runnerVersion,
    project_root: context.options.fixturesRoot,
    pack_path: context.packPath,
    answers_path: answersPath,
    metadata_path: metadataPath,
    run_id: context.runId,
    submitted_at: new Date().toISOString(),
    model_slot: metadataRow?.model_slot ?? context.options.modelSlot,
    repetition_index: metadataRow?.repetition_index ?? context.options.repetitionIndex,
    status: context.status,
    failure_message: context.failureMessage ?? null,
    source_answers_path: context.sourceAnswersPath ?? null,
    source_run_id: context.sourceRunId ?? null,
    source_round_id: context.sourceRoundId ?? null,
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
    round_id: context.round.outputRoundId,
    split: "holdout",
    run_id: context.runId,
    model_slot: metadataRow?.model_slot ?? context.options.modelSlot,
    repetition_index: metadataRow?.repetition_index ?? context.options.repetitionIndex,
    summary,
    responses: context.rows,
  });

  await writeJson(statusPath, {
    benchmark_type: BENCHMARK_TYPE,
    round_id: context.round.outputRoundId,
    run_id: context.runId,
    model_slot: metadataRow?.model_slot ?? context.options.modelSlot,
    repetition_index: metadataRow?.repetition_index ?? context.options.repetitionIndex,
    status: context.status,
    completed_response_count: context.rows.length,
    expected_response_count: context.expectedRowCount,
    failure_message: context.failureMessage ?? null,
  });
}

function assertValidMetadata(options: CliOptions, round: RoundProfile): void {
  if (round.outputRoundId === "V4"
    && (round.runnerName !== "tasklog-v4-holdout-runner" || round.runnerVersion !== "2026-03-31-v4-freeze")) {
    throw new Error("Runner identity drift detected. V4 must use tasklog-v4-holdout-runner / 2026-03-31-v4-freeze.");
  }
  if (round.outputRoundId === "V4.1"
    && (round.runnerName !== "tasklog-v4-1-holdout-runner" || round.runnerVersion !== "2026-03-31-v4-1-go-no-go")) {
    throw new Error("Runner identity drift detected. V4.1 must use tasklog-v4-1-holdout-runner / 2026-03-31-v4-1-go-no-go.");
  }
  if (options.repetitionIndex < 1 || options.repetitionIndex > 3) {
    throw new Error(`${round.outputRoundId} repetition_index must be 1, 2, or 3.`);
  }
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const round = ROUND_PROFILES[options.roundId];
  assertValidMetadata(options, round);
  const ontology = await readJson<Ontology>(ONTOLOGY_PATH);

  if (options.regradeFrom) {
    const existingRun = await readJson<{ responses?: ResponseRow[]; run_id?: string; round_id?: string }>(options.regradeFrom);
    const sourceRows = Array.isArray(existingRun.responses) ? existingRun.responses : [];
    if (sourceRows.length === 0) {
      throw new Error(`Regrade input at ${options.regradeFrom} does not contain any responses.`);
    }

    const metadataRow = sourceRows[0];
    const runId = `${round.runIdPrefix}-${metadataRow?.model_slot ?? options.modelSlot}-rep${metadataRow?.repetition_index ?? options.repetitionIndex}-${new Date().toISOString().replace(/[:.]/g, "-")}`;
    const rows = sourceRows.map((row) => ({
      ...row,
      benchmark_type: BENCHMARK_TYPE,
      round_id: round.outputRoundId,
      runner_name: round.runnerName,
      runner_version: round.runnerVersion,
      run_id: runId,
      grade: gradeAnswer(row.answer, row.expected_answer, row.next_step_slots, ontology, options.roundId),
    }));

    await persistArtifacts({
      options,
      round,
      runId,
      status: "completed",
      rows,
      expectedRowCount: rows.length,
      packPath: options.regradeFrom,
      outDir: options.outDir,
      sourceAnswersPath: options.regradeFrom,
      sourceRunId: typeof existingRun.run_id === "string" ? existingRun.run_id : undefined,
      sourceRoundId: typeof existingRun.round_id === "string" ? existingRun.round_id : undefined,
    });

    console.log(JSON.stringify({
      run_id: runId,
      out_dir: options.outDir,
      row_count: rows.length,
      summary: summarizeRows(rows, rows.length, "completed"),
    }, null, 2));
    return;
  }

  const packPath = path.join(options.fixturesRoot, PACK_MANIFEST_NAME);
  const packManifest = await readJson<PackManifest>(packPath);
  if (packManifest.benchmark_type !== BENCHMARK_TYPE || packManifest.round_id !== round.sourceRoundId) {
    throw new Error(`Unexpected ${round.outputRoundId} source pack manifest at ${packPath}`);
  }

  const fixtureIds = options.fixtureIds.length > 0 ? options.fixtureIds : packManifest.fixtures.map((fixture) => fixture.fixture_id);
  const answerKeyManifest = await readJson<AnswerKeyManifest>(path.join(options.fixturesRoot, ANSWER_KEY_MANIFEST_PATH));
  if (answerKeyManifest.status !== "full_pack_frozen_pre_run") {
    throw new Error(`${round.outputRoundId} runner requires annotation/frozen-answer-key-manifest.json with status full_pack_frozen_pre_run.`);
  }
  if (answerKeyManifest.round_id !== round.sourceRoundId || answerKeyManifest.benchmark_type !== BENCHMARK_TYPE) {
    throw new Error(`Unexpected frozen answer-key manifest at ${path.join(options.fixturesRoot, ANSWER_KEY_MANIFEST_PATH)}`);
  }

  const answerKeyByFixture = new Map(answerKeyManifest.entries.map((entry) => [entry.fixture_id, entry]));
  const runId = `${round.runIdPrefix}-${options.modelSlot}-rep${options.repetitionIndex}-${new Date().toISOString().replace(/[:.]/g, "-")}`;
  const rows: ResponseRow[] = [];
  const expectedRowCount = fixtureIds.length * options.arms.length;

  await persistArtifacts({
    options,
    round,
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
      if (!answerKey || !answerKey.frozen_answer || !answerKey.frozen_next_step_slots) {
        throw new Error(`Missing frozen V4 answer key entry for fixture ${fixtureId}`);
      }

      const questions = await readJson<QuestionsPack>(answerKey.references.questions_path);
      const question = questions.questions.find((entry) => entry.question_id === answerKey.question_id);
      if (!question) {
        throw new Error(`Fixture ${fixtureId} is missing question ${answerKey.question_id}.`);
      }

      for (const armId of options.arms) {
        const arm = ARMS.find((entry) => entry.arm_id === armId);
        if (!arm) {
          throw new Error(`Unknown arm: ${armId}`);
        }

        const payloadPath = answerKey.references[arm.referenceKey];
        const payloadFile = await readJsonText(payloadPath);
        const prompt = buildPrompt(options.roundId, fixtureId, question, arm.display_label, payloadFile.text);
        const startedAt = new Date().toISOString();
        const startedMs = Date.now();

        console.error(
          `[${round.artifactPrefix}] slot=${options.modelSlot} rep=${options.repetitionIndex} fixture=${fixtureId} arm=${arm.display_label} model=${options.modelId}`,
        );

        const answer = await runModel(options, prompt);
        const finishedAt = new Date().toISOString();
        const grade = gradeAnswer(answer, answerKey.frozen_answer, answerKey.frozen_next_step_slots, ontology, options.roundId);

        rows.push({
          benchmark_type: BENCHMARK_TYPE,
          round_id: round.outputRoundId,
          split: "holdout",
          fixture_id: fixtureId,
          question_id: answerKey.question_id,
          family: answerKey.frozen_constraints.family_id,
          title: question.title,
          difficulty: answerKey.frozen_constraints.difficulty,
          variant_label: arm.variant_label,
          arm_id: arm.arm_id,
          display_label: arm.display_label,
          provider: options.provider,
          model_slot: options.modelSlot,
          repetition_index: options.repetitionIndex,
          model_id: options.modelId,
          model_family: options.modelFamily,
          reasoning_setting: options.reasoningSetting,
          runner_name: round.runnerName,
          runner_version: round.runnerVersion,
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
          expected_answer: answerKey.frozen_answer,
          next_step_slots: answerKey.frozen_next_step_slots,
          grade,
        });

        await persistArtifacts({
          options,
          round,
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
      round,
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
      row_count: rows.length,
      summary: summarizeRows(rows, expectedRowCount, "completed"),
    }, null, 2));
  } catch (error) {
    const failureMessage = error instanceof Error ? error.stack ?? error.message : String(error);
    await persistArtifacts({
      options,
      round,
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
