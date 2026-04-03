import os from "node:os";
import path from "node:path";
import { promises as fs } from "node:fs";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);

type Backend = "claude" | "codex";

interface CliOptions {
  packPath: string;
  outPath: string;
  backend: Backend;
  provider: string;
  modelId: string;
  modelFamily: string;
  reasoningSetting: string;
  runnerName: string;
  runnerVersion: string;
  scenarioId?: string;
  variantLabel?: string;
  maxRows?: number;
}

interface ToolFixture {
  input: Record<string, unknown>;
  result: unknown;
}

interface ToolDefinition {
  name: string;
  description: string;
  input_schema: Record<string, string>;
  deterministic_responses: ToolFixture[];
}

interface InteractionContract {
  mode: "mock_tool_calling";
  max_tool_calls: number;
  max_model_turns: number;
  max_final_answer_attempts: number;
  tools: ToolDefinition[];
}

interface Variant {
  label: string;
  interaction_contract: InteractionContract;
}

interface ScenarioPack {
  scenario_id: string;
  title: string;
  prompt: string;
  answer_contract: Record<string, string>;
  trace_schema_path: string;
  variants: Variant[];
}

interface BenchmarkPack {
  benchmark_type: "full_session_reentry_interactive";
  project_root: string;
  trace_schema_path: string;
  scenarios: ScenarioPack[];
}

interface TraceToolCall {
  step_index: number;
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_result: unknown;
  latency_ms: number | null;
}

interface TraceRun {
  scenario_id: string;
  variant_label: string;
  step_budget: {
    max_tool_calls: number;
    max_model_turns: number;
    max_final_answer_attempts: number;
  };
  final_status: "answered" | "budget_exhausted" | "error" | "stopped_without_answer";
  model_turns: number;
  run_started_at: string;
  run_finished_at: string;
  tool_calls: TraceToolCall[];
  final_answer: Record<string, unknown>;
}

interface TraceBatch {
  benchmark_type: "full_session_reentry_interactive";
  split: string;
  project_root: string;
  pack_path: string;
  trace_schema_path: string;
  run_id: string;
  provider: string;
  model_id: string;
  model_family: string;
  reasoning_setting: string;
  runner_name: string;
  runner_version: string;
  traces: TraceRun[];
}

interface StepDecision {
  action: "tool" | "final";
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  final_answer?: Record<string, unknown>;
}

const ANSWER_FIELD_NAMES = [
  "selected_work_id",
  "selected_work_title",
  "selection_confidence",
  "selection_rationale",
  "work_status",
  "scope_paths",
  "latest_log_summary",
  "next_step_summary",
  "used_expanded_context",
  "other_candidate_work_ids",
  "ambiguity_notes",
] as const;

function parseArgs(argv: string[]): CliOptions {
  let packPath = "";
  let outPath = "";
  let backend: Backend = "claude";
  let provider = "anthropic";
  let modelId = "claude-haiku-4.5";
  let modelFamily = "claude-haiku-4.5";
  let reasoningSetting = "standard";
  let runnerName = "tasklog-cli-smoke-runner";
  let runnerVersion = new Date().toISOString().slice(0, 10);
  let scenarioId: string | undefined;
  let variantLabel: string | undefined;
  let maxRows: number | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current === "--pack") {
      packPath = argv[index + 1] ?? packPath;
      index += 1;
      continue;
    }
    if (current === "--out") {
      outPath = argv[index + 1] ?? outPath;
      index += 1;
      continue;
    }
    if (current === "--backend") {
      const candidate = argv[index + 1];
      if (candidate === "claude" || candidate === "codex") {
        backend = candidate;
      }
      index += 1;
      continue;
    }
    if (current === "--provider") {
      provider = argv[index + 1] ?? provider;
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
    if (current === "--reasoning-setting") {
      reasoningSetting = argv[index + 1] ?? reasoningSetting;
      index += 1;
      continue;
    }
    if (current === "--runner-name") {
      runnerName = argv[index + 1] ?? runnerName;
      index += 1;
      continue;
    }
    if (current === "--runner-version") {
      runnerVersion = argv[index + 1] ?? runnerVersion;
      index += 1;
      continue;
    }
    if (current === "--scenario-id") {
      scenarioId = argv[index + 1] ?? scenarioId;
      index += 1;
      continue;
    }
    if (current === "--variant-label") {
      variantLabel = argv[index + 1] ?? variantLabel;
      index += 1;
      continue;
    }
    if (current === "--max-rows") {
      const candidate = Number.parseInt(argv[index + 1] ?? "", 10);
      if (Number.isFinite(candidate) && candidate > 0) {
        maxRows = candidate;
      }
      index += 1;
    }
  }

  if (!packPath) {
    throw new Error("Missing required --pack");
  }
  if (!outPath) {
    throw new Error("Missing required --out");
  }

  return {
    packPath: path.resolve(packPath),
    outPath: path.resolve(outPath),
    backend,
    provider,
    modelId,
    modelFamily,
    reasoningSetting,
    runnerName,
    runnerVersion,
    scenarioId,
    variantLabel,
    maxRows,
  };
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function findFixture(toolDef: ToolDefinition, input: Record<string, unknown>): ToolFixture | undefined {
  const inputKey = canonicalJson(input);
  return toolDef.deterministic_responses.find((fixture) => canonicalJson(fixture.input) === inputKey);
}

function buildToolCatalog(contract: InteractionContract): Array<Record<string, unknown>> {
  return contract.tools.map((toolDef) => ({
    name: toolDef.name,
    description: toolDef.description,
    input_schema: toolDef.input_schema,
    valid_inputs: toolDef.deterministic_responses.map((fixture) => fixture.input),
  }));
}

function hasTool(contract: InteractionContract, toolName: string): boolean {
  return contract.tools.some((toolDef) => toolDef.name === toolName);
}

function isTasklogVariant(contract: InteractionContract): boolean {
  return hasTool(contract, "list_works")
    && hasTool(contract, "resume_work")
    && hasTool(contract, "read_reentry_brief");
}

function buildTranscript(toolCalls: TraceToolCall[]): string {
  if (toolCalls.length === 0) {
    return "No tool calls yet.";
  }
  return toolCalls.map((call) => [
    `Step ${call.step_index}`,
    `tool_name: ${call.tool_name}`,
    `tool_input: ${JSON.stringify(call.tool_input)}`,
    `tool_result: ${JSON.stringify(call.tool_result)}`,
  ].join("\n")).join("\n\n");
}

function buildPrompt(
  scenario: ScenarioPack,
  variant: Variant,
  toolCalls: TraceToolCall[],
  modelTurns: number,
  backend: Backend,
  runnerFeedback: string[],
): string {
  const remainingToolCalls = variant.interaction_contract.max_tool_calls - toolCalls.length;
  const remainingModelTurns = variant.interaction_contract.max_model_turns - modelTurns;
  const tasklogSpecificInstructions = hasTool(variant.interaction_contract, "resume_work")
    && hasTool(variant.interaction_contract, "read_reentry_brief")
    && hasTool(variant.interaction_contract, "list_works")
    ? [
      "Tasklog workflow rule: do not finalize from get_active_context alone.",
      "Tasklog workflow rule: if list_works is available, call it before selecting the final work.",
      "Tasklog workflow rule: once you choose a work_id, call resume_work for that exact work before read_reentry_brief.",
      "Tasklog workflow rule: do not call read_reentry_brief before resume_work.",
    ]
    : [];
  const returnInstructions = backend === "codex"
    ? [
      "Return one JSON object only.",
      "For Codex schema compliance, encode tool_input as a JSON string and final_answer as a JSON string.",
      "If choosing a tool, return:",
      "{\"action\":\"tool\",\"tool_name\":\"...\",\"tool_input_json\":\"{}\",\"final_answer_json\":\"{}\"}",
      "If returning the benchmark answer, return:",
      "{\"action\":\"final\",\"tool_name\":\"\",\"tool_input_json\":\"{}\",\"final_answer_json\":\"{...}\"}",
    ]
    : [
      "Return one JSON object only.",
      "If choosing a tool, return:",
      "{\"action\":\"tool\",\"tool_name\":\"...\",\"tool_input\":{}}",
      "If returning the benchmark answer, return:",
      "{\"action\":\"final\",\"final_answer\":{...}}",
    ];
  return [
    "You are participating in a constrained interactive benchmark.",
    "Use only the provided mock tools.",
    "Never invent tool names, tool inputs, tool results, or hidden facts.",
    "When choosing a tool, you must select one exact tool_name and one exact tool_input from valid_inputs.",
    "When you already have enough evidence, return a final answer object instead of another tool call.",
    "",
    `Scenario ID: ${scenario.scenario_id}`,
    `Scenario Title: ${scenario.title}`,
    `Variant Label: ${variant.label}`,
    "",
    scenario.prompt,
    "",
    "Allowed tool catalog:",
    JSON.stringify(buildToolCatalog(variant.interaction_contract), null, 2),
    ...(tasklogSpecificInstructions.length > 0 ? ["", ...tasklogSpecificInstructions] : []),
    "",
    "Answer contract:",
    JSON.stringify(scenario.answer_contract, null, 2),
    "",
    `Remaining tool calls: ${remainingToolCalls}`,
    `Remaining model turns including this one: ${remainingModelTurns}`,
    "",
    "Transcript so far:",
    buildTranscript(toolCalls),
    ...(runnerFeedback.length > 0 ? ["", "Runner feedback:", ...runnerFeedback.map((item, index) => `${index + 1}. ${item}`)] : []),
    "",
    ...returnInstructions,
  ].join("\n");
}

function stepSchema(): Record<string, unknown> {
  return {
    type: "object",
    properties: {
      action: { type: "string", enum: ["tool", "final"] },
      tool_name: { type: "string" },
      tool_input: {
        oneOf: [
          {
            type: "object",
            properties: {},
            additionalProperties: false,
          },
          {
            type: "object",
            properties: {
              work_id: { type: "string" },
            },
            required: ["work_id"],
            additionalProperties: false,
          },
        ],
      },
      final_answer: {
        type: "object",
        properties: {
          selected_work_id: { type: "string" },
          selected_work_title: { type: "string" },
          selection_confidence: { type: "string" },
          selection_rationale: { type: "string" },
          work_status: { type: "string" },
          scope_paths: { type: "array", items: { type: "string" } },
          latest_log_summary: { type: "string" },
          next_step_summary: { type: "string" },
          used_expanded_context: { type: "boolean" },
          other_candidate_work_ids: { type: "array", items: { type: "string" } },
          ambiguity_notes: { type: "string" },
        },
        additionalProperties: false,
      },
    },
    required: ["action"],
    additionalProperties: false,
  };
}

function normalizeDecision(raw: unknown): StepDecision {
  if (!raw || typeof raw !== "object") {
    throw new Error("Runner did not return an object");
  }
  const decision = raw as Record<string, unknown>;
  const action = decision.action;
  if (action !== "tool" && action !== "final") {
    throw new Error("Runner returned an invalid action");
  }
  if (action === "tool") {
    return {
      action,
      tool_name: typeof decision.tool_name === "string" ? decision.tool_name : "",
      tool_input: decision.tool_input && typeof decision.tool_input === "object" && !Array.isArray(decision.tool_input)
        ? decision.tool_input as Record<string, unknown>
        : {},
    };
  }
  return {
    action,
    final_answer: decision.final_answer && typeof decision.final_answer === "object" && !Array.isArray(decision.final_answer)
      ? decision.final_answer as Record<string, unknown>
      : {},
  };
}

function normalizeFinalAnswer(answer: Record<string, unknown> | undefined): Record<string, unknown> {
  const normalized: Record<string, unknown> = {
    selected_work_id: "",
    selected_work_title: "",
    selection_confidence: "",
    selection_rationale: "",
    work_status: "",
    scope_paths: [],
    latest_log_summary: "",
    next_step_summary: "",
    used_expanded_context: false,
    other_candidate_work_ids: [],
    ambiguity_notes: "",
  };
  if (!answer) {
    return normalized;
  }
  for (const fieldName of ANSWER_FIELD_NAMES) {
    if (fieldName in answer) {
      normalized[fieldName] = answer[fieldName];
    }
  }
  if (!Array.isArray(normalized.scope_paths)) {
    normalized.scope_paths = [];
  }
  if (!Array.isArray(normalized.other_candidate_work_ids)) {
    normalized.other_candidate_work_ids = [];
  }
  if (typeof normalized.used_expanded_context !== "boolean") {
    normalized.used_expanded_context = false;
  }
  return normalized;
}

async function runClaude(prompt: string, modelId: string): Promise<StepDecision> {
  const { stdout } = await execFile("claude", [
    "-p",
    "--output-format",
    "json",
    "--json-schema",
    JSON.stringify(stepSchema()),
    "--permission-mode",
    "dontAsk",
    "--tools",
    "",
    "--model",
    modelId,
    prompt,
  ], {
    maxBuffer: 1024 * 1024 * 32,
  });
  const parsed = JSON.parse(stdout) as { structured_output?: unknown };
  return normalizeDecision(parsed.structured_output);
}

function codexStepSchema(): Record<string, unknown> {
  return {
    type: "object",
    properties: {
      action: { type: "string", enum: ["tool", "final"] },
      tool_name: { type: "string" },
      tool_input_json: { type: "string" },
      final_answer_json: { type: "string" },
    },
    required: ["action", "tool_name", "tool_input_json", "final_answer_json"],
    additionalProperties: false,
  };
}

async function runCodex(prompt: string, modelId: string): Promise<StepDecision> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "tasklog-codex-smoke-"));
  const schemaPath = path.join(tempDir, "schema.json");
  const outputPath = path.join(tempDir, "last.json");
  await fs.writeFile(schemaPath, JSON.stringify(codexStepSchema(), null, 2), "utf8");
  await execFile("codex", [
    "exec",
    "--skip-git-repo-check",
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
  });
  const parsed = JSON.parse(await fs.readFile(outputPath, "utf8")) as Record<string, unknown>;
  const action = parsed.action;
  if (action !== "tool" && action !== "final") {
    throw new Error("Codex runner returned an invalid action");
  }
  const toolInputJson = typeof parsed.tool_input_json === "string" ? parsed.tool_input_json : "{}";
  const finalAnswerJson = typeof parsed.final_answer_json === "string" ? parsed.final_answer_json : "{}";
  return action === "tool"
    ? {
      action,
      tool_name: typeof parsed.tool_name === "string" ? parsed.tool_name : "",
      tool_input: JSON.parse(toolInputJson) as Record<string, unknown>,
    }
    : {
      action,
      final_answer: JSON.parse(finalAnswerJson) as Record<string, unknown>,
    };
}

async function requestDecision(options: CliOptions, prompt: string): Promise<StepDecision> {
  if (options.backend === "claude") {
    return runClaude(prompt, options.modelId);
  }
  return runCodex(prompt, options.modelId);
}

function selectedWorkIdFromAnswer(answer: Record<string, unknown> | undefined): string {
  return answer && typeof answer.selected_work_id === "string" ? answer.selected_work_id : "";
}

function hasToolCall(
  toolCalls: TraceToolCall[],
  toolName: string,
  workId?: string,
): boolean {
  return toolCalls.some((call) => call.tool_name === toolName
    && (workId === undefined || String(call.tool_input.work_id ?? "") === workId));
}

function tasklogFinalizationFeedback(
  variant: Variant,
  toolCalls: TraceToolCall[],
  answer: Record<string, unknown> | undefined,
): string | null {
  if (!isTasklogVariant(variant.interaction_contract)) {
    return null;
  }
  if (toolCalls.length === 0) {
    return "Tasklog arm final answers require at least one tool call. Start by calling list_works with {\"status\":\"open\"}.";
  }
  if (!hasToolCall(toolCalls, "list_works")) {
    return "Tasklog arm final answers require list_works before you decide on the final work.";
  }

  const selectedWorkId = selectedWorkIdFromAnswer(answer);
  if (!selectedWorkId) {
    return "Tasklog arm final answers must include selected_work_id after you inspect list_works.";
  }
  if (!hasToolCall(toolCalls, "resume_work", selectedWorkId)) {
    return `Before finalizing Tasklog work ${selectedWorkId}, call resume_work for that exact work_id.`;
  }
  if (!hasToolCall(toolCalls, "read_reentry_brief", selectedWorkId)) {
    return `Before finalizing Tasklog work ${selectedWorkId}, call read_reentry_brief for that same work_id after resume_work.`;
  }
  return null;
}

async function runVariant(options: CliOptions, scenario: ScenarioPack, variant: Variant): Promise<TraceRun> {
  const toolCalls: TraceToolCall[] = [];
  const runnerFeedback: string[] = [];
  const runStartedAt = new Date().toISOString();
  let modelTurns = 0;
  let finalStatus: TraceRun["final_status"] = "stopped_without_answer";
  let finalAnswer: Record<string, unknown> = {};

  console.error(`[smoke] start ${scenario.scenario_id}/${variant.label} backend=${options.backend} model=${options.modelId}`);

  while (modelTurns < variant.interaction_contract.max_model_turns) {
    modelTurns += 1;
    console.error(`[smoke] turn ${modelTurns} ${scenario.scenario_id}/${variant.label} tool_calls=${toolCalls.length}`);
    const prompt = buildPrompt(scenario, variant, toolCalls, modelTurns - 1, options.backend, runnerFeedback);
    let decision: StepDecision;
    try {
      decision = await requestDecision(options, prompt);
    } catch (error) {
      console.error(`[smoke] runner error ${scenario.scenario_id}/${variant.label}: ${error instanceof Error ? error.message : String(error)}`);
      finalStatus = "error";
      finalAnswer = {
        runner_error: error instanceof Error ? error.message : String(error),
      };
      break;
    }

    if (decision.action === "final") {
      const finalFeedback = tasklogFinalizationFeedback(variant, toolCalls, decision.final_answer);
      if (finalFeedback) {
        console.error(`[smoke] reject final ${scenario.scenario_id}/${variant.label}: ${finalFeedback}`);
        runnerFeedback.push(finalFeedback);
        continue;
      }
      console.error(`[smoke] final answer ${scenario.scenario_id}/${variant.label} after ${modelTurns} turns`);
      finalStatus = "answered";
      finalAnswer = normalizeFinalAnswer(decision.final_answer);
      break;
    }

    if (toolCalls.length >= variant.interaction_contract.max_tool_calls) {
      finalStatus = "budget_exhausted";
      break;
    }

    const toolName = decision.tool_name ?? "";
    const toolInput = decision.tool_input ?? {};
    console.error(`[smoke] tool ${scenario.scenario_id}/${variant.label}: ${toolName} ${JSON.stringify(toolInput)}`);
    const toolDef = variant.interaction_contract.tools.find((entry) => entry.name === toolName);
    const started = Date.now();

    if (!toolDef) {
      console.error(`[smoke] disallowed tool ${scenario.scenario_id}/${variant.label}: ${toolName}`);
      toolCalls.push({
        step_index: toolCalls.length + 1,
        tool_name: toolName,
        tool_input: toolInput,
        tool_result: { runner_error: "tool_not_allowed" },
        latency_ms: Date.now() - started,
      });
      finalStatus = "error";
      break;
    }

    const fixture = findFixture(toolDef, toolInput);
    if (!fixture) {
      console.error(`[smoke] fixture miss ${scenario.scenario_id}/${variant.label}: ${toolName} ${JSON.stringify(toolInput)}`);
      toolCalls.push({
        step_index: toolCalls.length + 1,
        tool_name: toolName,
        tool_input: toolInput,
        tool_result: { runner_error: "fixture_not_found" },
        latency_ms: Date.now() - started,
      });
      finalStatus = "error";
      break;
    }

    toolCalls.push({
      step_index: toolCalls.length + 1,
      tool_name: toolName,
      tool_input: fixture.input,
      tool_result: fixture.result,
      latency_ms: Date.now() - started,
    });
  }

  if (finalStatus === "stopped_without_answer"
    && (modelTurns >= variant.interaction_contract.max_model_turns || toolCalls.length >= variant.interaction_contract.max_tool_calls)) {
    finalStatus = "budget_exhausted";
  }

  console.error(`[smoke] done ${scenario.scenario_id}/${variant.label} status=${finalStatus} turns=${modelTurns} tool_calls=${toolCalls.length}`);

  return {
    scenario_id: scenario.scenario_id,
    variant_label: variant.label,
    step_budget: {
      max_tool_calls: variant.interaction_contract.max_tool_calls,
      max_model_turns: variant.interaction_contract.max_model_turns,
      max_final_answer_attempts: variant.interaction_contract.max_final_answer_attempts,
    },
    final_status: finalStatus,
    model_turns: modelTurns,
    run_started_at: runStartedAt,
    run_finished_at: new Date().toISOString(),
    tool_calls: toolCalls,
    final_answer: finalAnswer,
  };
}

function selectRows(pack: BenchmarkPack, options: CliOptions): Array<{ scenario: ScenarioPack; variant: Variant }> {
  const rows = pack.scenarios
    .filter((scenario) => !options.scenarioId || scenario.scenario_id === options.scenarioId)
    .flatMap((scenario) =>
      scenario.variants
        .filter((variant) => !options.variantLabel || variant.label === options.variantLabel)
        .map((variant) => ({ scenario, variant })));

  if (rows.length === 0) {
    throw new Error("No scenario rows matched the requested filters");
  }
  return options.maxRows ? rows.slice(0, options.maxRows) : rows;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const pack = await readJsonFile<BenchmarkPack>(options.packPath);
  const rows = selectRows(pack, options);
  const traces: TraceRun[] = [];

  for (const { scenario, variant } of rows) {
    traces.push(await runVariant(options, scenario, variant));
  }

  const batch: TraceBatch = {
    benchmark_type: "full_session_reentry_interactive",
    split: "dev",
    project_root: pack.project_root,
    pack_path: options.packPath,
    trace_schema_path: pack.trace_schema_path,
    run_id: `${options.backend}-${Date.now()}`,
    provider: options.provider,
    model_id: options.modelId,
    model_family: options.modelFamily,
    reasoning_setting: options.reasoningSetting,
    runner_name: options.runnerName,
    runner_version: options.runnerVersion,
    traces,
  };

  await fs.mkdir(path.dirname(options.outPath), { recursive: true });
  await fs.writeFile(options.outPath, JSON.stringify(batch, null, 2), "utf8");
  console.log(JSON.stringify({
    out_path: options.outPath,
    backend: options.backend,
    model_id: options.modelId,
    trace_count: traces.length,
    statuses: traces.map((trace) => ({
      scenario_id: trace.scenario_id,
      variant_label: trace.variant_label,
      final_status: trace.final_status,
      model_turns: trace.model_turns,
      tool_calls: trace.tool_calls.length,
    })),
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
