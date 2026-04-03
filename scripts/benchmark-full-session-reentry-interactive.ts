import path from "node:path";
import { promises as fs } from "node:fs";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";

import { z } from "zod";

import {
  readLogEntries,
  readWorkContext,
  readWorkRecords,
  resolveLogbookPaths,
  type LogbookPaths,
  type SessionLogEntry,
  type WorkArtifactAvailability,
  type WorkRecord,
  type WorkState,
} from "../src/logbook.js";

const ARTIFACT_FILES = ["design.md", "plan.md", "spec.md", "summary.md", "notes.md"] as const;
const NO_CONTINUITY_SKIP_NAMES = new Set([
  ".git",
  ".tasklog",
  "workdocs",
  "node_modules",
  "target",
  "dist",
  ".next",
  ".turbo",
  "coverage",
]);
const TRACE_SCHEMA_DOC_PATH = "docs/full-session-reentry-interactive-trace-schema.json";
const execFile = promisify(execFileCallback);

interface CliOptions {
  projectRoot: string;
  manifestPath?: string;
  split?: "dev" | "holdout" | "stress";
  outDir?: string;
  gradeIn?: string;
  keyIn?: string;
  json: boolean;
}

interface ScenarioDefinition {
  scenario_id: string;
  family:
    | "active_work_resume"
    | "stale_active_context_resume"
    | "multiple_open_works_resume"
    | "blocked_work_triage"
    | "closed_work_do_not_resume";
  target_work_id: string;
  candidate_work_ids: string[];
  active_work_id?: string;
  require_full_context?: boolean;
  note?: string;
}

interface ScenarioManifest {
  version: number;
  description?: string;
  splits: Partial<Record<"dev" | "holdout" | "stress", string[]>>;
  scenarios: ScenarioDefinition[];
}

interface SessionReentryAnswer {
  selected_work_id: string;
  selected_work_title: string;
  selection_confidence: string;
  selection_rationale: string;
  work_status: string;
  scope_paths: string[];
  latest_log_summary: string;
  next_step_summary: string;
  used_expanded_context: boolean;
  other_candidate_work_ids: string[];
  ambiguity_notes: string;
}

interface SurfaceMetrics {
  bytes: number;
  lines: number;
  estTokens: number;
}

interface WorkBrief {
  work_id: string;
  title: string;
  status: string;
  scope_paths: string[];
  latest_log_summary: string;
  next_step_summary: string;
  artifact_files: string[];
  used_expanded_context: boolean;
  artifact_availability: WorkArtifactAvailability;
  context_mode: string;
  work_state: WorkState;
  recent_log_count: number;
}

interface WorkContextBundle {
  work: {
    work_id: string;
    title: string;
    status: string;
    scope_paths: string[];
  };
  artifact_paths: {
    workDir: string;
    designPath: string;
    planPath: string;
    specPath: string;
    summaryPath: string;
    notesPath: string;
  };
  artifact_availability: WorkArtifactAvailability;
  context_mode: string;
  work_state: WorkState;
  recent_log_count: number;
  recent_logs: Array<{
    id: string;
    summary: string;
    status: string;
    change_type: string;
    next_steps?: string;
    affected_files?: string[];
  }>;
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

interface PolicyRules {
  start_tools: string[];
  require_resume_before_brief?: boolean;
  require_brief_before_full_context?: boolean;
  count_full_context_as_expansion?: boolean;
}

interface StrategyVariant {
  strategy: string;
  interaction_contract: InteractionContract;
  policy_rules: PolicyRules;
  metrics: SurfaceMetrics;
}

interface PublicVariant {
  label: string;
  interaction_contract: InteractionContract;
}

interface KeyVariant {
  label: string;
  strategy: string;
  interaction_contract: InteractionContract;
  policy_rules: PolicyRules;
  metrics: SurfaceMetrics;
}

interface ScenarioPack {
  scenario_id: string;
  scenario_family: ScenarioDefinition["family"];
  title: string;
  prompt: string;
  answer_contract: Record<string, string>;
  trace_schema_path: string;
  variants: PublicVariant[];
}

interface ScenarioKey {
  scenario_id: string;
  scenario_family: ScenarioDefinition["family"];
  title: string;
  expected_answer: SessionReentryAnswer;
  require_full_context: boolean;
  variants: KeyVariant[];
}

interface BenchmarkPack {
  benchmark_type: "full_session_reentry_interactive";
  project_root: string;
  scenario_manifest_path: string;
  trace_schema_path: string;
  notes: string[];
  scenarios: ScenarioPack[];
}

interface BenchmarkKey {
  benchmark_type: "full_session_reentry_interactive";
  project_root: string;
  scenario_manifest_path: string;
  trace_schema_path: string;
  notes: string[];
  scenarios: ScenarioKey[];
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

interface FieldScore {
  field: string;
  expected: string;
  actual: string;
  outcome: "correct" | "wrong" | "abstained" | "hallucinated";
}

const traceToolCallSchema = z.object({
  step_index: z.number().int().positive(),
  tool_name: z.string().min(1),
  tool_input: z.record(z.string(), z.unknown()),
  tool_result: z.unknown(),
  latency_ms: z.number().nullable(),
});

const traceRunSchema = z.object({
  scenario_id: z.string().min(1),
  variant_label: z.string().min(1),
  step_budget: z.object({
    max_tool_calls: z.number().int().positive(),
    max_model_turns: z.number().int().positive(),
    max_final_answer_attempts: z.number().int().positive(),
  }),
  final_status: z.enum(["answered", "budget_exhausted", "error", "stopped_without_answer"]),
  model_turns: z.number().int().nonnegative(),
  run_started_at: z.string().min(1),
  run_finished_at: z.string().min(1),
  tool_calls: z.array(traceToolCallSchema),
  final_answer: z.record(z.string(), z.unknown()),
});

const traceBatchSchema = z.object({
  benchmark_type: z.literal("full_session_reentry_interactive"),
  split: z.string().min(1),
  project_root: z.string().min(1),
  pack_path: z.string().min(1),
  trace_schema_path: z.string().min(1),
  run_id: z.string().min(1),
  provider: z.string().min(1),
  model_id: z.string().min(1),
  model_family: z.string().min(1),
  reasoning_setting: z.string().min(1),
  runner_name: z.string().min(1),
  runner_version: z.string().min(1),
  traces: z.array(traceRunSchema),
});

function parseArgs(argv: string[]): CliOptions {
  let projectRoot = process.cwd();
  let manifestPath: string | undefined;
  let split: CliOptions["split"];
  let outDir: string | undefined;
  let gradeIn: string | undefined;
  let keyIn: string | undefined;
  let json = false;

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current === "--project-root") {
      projectRoot = argv[index + 1] ?? projectRoot;
      index += 1;
      continue;
    }
    if (current === "--manifest") {
      const candidatePath = argv[index + 1];
      if (candidatePath) {
        manifestPath = candidatePath;
      }
      index += 1;
      continue;
    }
    if (current === "--split") {
      const candidate = argv[index + 1];
      if (candidate === "dev" || candidate === "holdout" || candidate === "stress") {
        split = candidate;
      }
      index += 1;
      continue;
    }
    if (current === "--out-dir") {
      outDir = argv[index + 1] ?? outDir;
      index += 1;
      continue;
    }
    if (current === "--grade-in") {
      gradeIn = argv[index + 1] ?? gradeIn;
      index += 1;
      continue;
    }
    if (current === "--key-in") {
      keyIn = argv[index + 1] ?? keyIn;
      index += 1;
      continue;
    }
    if (current === "--json") {
      json = true;
    }
  }

  return {
    projectRoot: path.resolve(projectRoot),
    manifestPath: manifestPath ? path.resolve(manifestPath) : undefined,
    split,
    outDir: outDir ? path.resolve(outDir) : undefined,
    gradeIn: gradeIn ? path.resolve(gradeIn) : undefined,
    keyIn: keyIn ? path.resolve(keyIn) : undefined,
    json,
  };
}

function metricFromObject(value: unknown): SurfaceMetrics {
  const text = JSON.stringify(value, null, 2);
  const bytes = Buffer.byteLength(text, "utf8");
  return {
    bytes,
    lines: text.length === 0 ? 0 : text.split(/\r?\n/).length,
    estTokens: Math.ceil(bytes / 4),
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

async function sampleDirectoryTree(dirPath: string, depth: number, maxEntries: number): Promise<string[]> {
  const results: string[] = [];
  const seen = new Set<string>();

  async function walk(currentPath: string, currentDepth: number): Promise<void> {
    if (results.length >= maxEntries) {
      return;
    }
    let entries;
    try {
      entries = await fs.readdir(currentPath, { withFileTypes: true });
    } catch {
      return;
    }

    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      if (results.length >= maxEntries) {
        return;
      }
      if (NO_CONTINUITY_SKIP_NAMES.has(entry.name)) {
        continue;
      }
      const absolutePath = path.join(currentPath, entry.name);
      const relativePath = path.relative(dirPath, absolutePath) || entry.name;
      if (seen.has(relativePath)) {
        continue;
      }
      seen.add(relativePath);
      results.push(`${entry.isDirectory() ? "dir" : "file"}:${relativePath}`);
      if (entry.isDirectory() && currentDepth < depth) {
        await walk(absolutePath, currentDepth + 1);
      }
    }
  }

  await walk(dirPath, 0);
  return results;
}

async function readTextFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, "utf8");
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  return JSON.parse(await readTextFile(filePath)) as T;
}

async function loadManifest(manifestPath: string): Promise<ScenarioManifest> {
  return readJsonFile<ScenarioManifest>(manifestPath);
}

function normalizeForMatch(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

function normalizeOptional(value: string | undefined): string {
  return value ?? "";
}

function normalizeList(values: string[]): string[] {
  return values.map((value) => normalizeForMatch(value)).filter((value) => value.length > 0);
}

function latestLog(logs: SessionLogEntry[]): SessionLogEntry | undefined {
  return logs.at(-1);
}

function latestNextStep(logs: SessionLogEntry[]): string | undefined {
  return [...logs].reverse().find((entry) => entry.next_steps)?.next_steps;
}

async function findRepoRoot(startPath: string, projectRoot: string): Promise<string | null> {
  let currentPath = path.resolve(startPath);
  const rootPath = path.parse(currentPath).root;
  const projectBoundary = path.resolve(projectRoot);

  while (true) {
    if (await pathExists(path.join(currentPath, ".git"))) {
      return currentPath;
    }
    if (currentPath === rootPath || currentPath === projectBoundary) {
      break;
    }
    currentPath = path.dirname(currentPath);
  }

  if (await pathExists(path.join(projectBoundary, ".git"))) {
    return projectBoundary;
  }
  return null;
}

async function gitStatusShort(repoRoot: string): Promise<string> {
  try {
    const { stdout } = await execFile("git", ["-C", repoRoot, "status", "--short"], {
      maxBuffer: 1024 * 1024,
    });
    const trimmed = stdout.trim();
    return trimmed.length > 0 ? trimmed : "(clean)";
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return `(git status unavailable: ${message})`;
  }
}

async function existingArtifactFilePaths(paths: LogbookPaths, work: WorkRecord): Promise<string[]> {
  const workDir = path.join(paths.workdocsRoot, `${work.work_id}-${work.slug}`);
  const candidates = ARTIFACT_FILES.map((fileName) => path.join(workDir, fileName));
  const stats = await Promise.all(candidates.map(async (candidate) => {
    try {
      const stat = await fs.stat(candidate);
      return stat.isFile() ? candidate : null;
    } catch {
      return null;
    }
  }));
  return stats.filter((candidate): candidate is string => candidate !== null);
}

async function buildWorkBrief(paths: LogbookPaths, work: WorkRecord, requireFullContext = false): Promise<WorkBrief> {
  const surface = requireFullContext ? "full" : "brief";
  const context = await readWorkContext(paths, work.work_id, { surface, include_recent_logs: requireFullContext });
  const logs = await readLogEntries(paths);
  const logsForWork = logs.filter((entry) => entry.work_id === work.work_id);
  return {
    work_id: work.work_id,
    title: context.work.title,
    status: context.work.status,
    scope_paths: context.work_state.current_work.scope_paths,
    latest_log_summary: normalizeOptional(latestLog(logsForWork)?.summary),
    next_step_summary: normalizeOptional(
      context.work_state.next_valid_action.summary || latestNextStep(logsForWork),
    ),
    artifact_files: existingArtifactFileNames(context.artifact_availability),
    used_expanded_context: requireFullContext,
    artifact_availability: context.artifact_availability,
    context_mode: context.context_mode,
    work_state: context.work_state,
    recent_log_count: context.recent_log_count,
  };
}

async function buildWorkContextBundle(paths: LogbookPaths, work: WorkRecord, requireFullContext = false): Promise<WorkContextBundle> {
  const context = await readWorkContext(paths, work.work_id, { surface: "full", include_recent_logs: true });
  const logs = await readLogEntries(paths);
  const logsForWork = logs
    .filter((entry) => entry.work_id === work.work_id)
    .slice(-5)
    .map((entry) => ({
      id: entry.id,
      summary: entry.summary,
      status: entry.status,
      change_type: entry.change_type,
      next_steps: entry.next_steps,
      affected_files: entry.affected_files,
    }));
  return {
    work: {
      work_id: context.work.work_id,
      title: context.work.title,
      status: context.work.status,
      scope_paths: context.work.scope_paths,
    },
    artifact_paths: context.artifact_paths,
    artifact_availability: context.artifact_availability,
    context_mode: context.context_mode,
    work_state: context.work_state,
    recent_log_count: context.recent_log_count,
    recent_logs: logsForWork,
  };
}

function existingArtifactFileNames(availability: WorkArtifactAvailability): string[] {
  return ["design", "plan", "spec", "summary", "notes"]
    .filter((name) => availability[name as keyof WorkArtifactAvailability])
    .map((name) => `${name}.md`);
}

function sessionPrompt(): string {
  return [
    "You are resuming work in a coding workspace.",
    "This is a constrained interactive benchmark with deterministic mock tools.",
    "Use only the tools exposed for this strategy and stop when you can return the final JSON answer.",
    "Do not guess. If a field is unknown, return an empty string or an empty array.",
    "",
    "Return this JSON shape at the end:",
    "{",
    '  "selected_work_id": "",',
    '  "selected_work_title": "",',
    '  "selection_confidence": "",',
    '  "selection_rationale": "",',
    '  "work_status": "",',
    '  "scope_paths": [],',
    '  "latest_log_summary": "",',
    '  "next_step_summary": "",',
    '  "used_expanded_context": false,',
    '  "other_candidate_work_ids": [],',
    '  "ambiguity_notes": ""',
    "}",
  ].join("\n");
}

function sessionContract(): Record<string, string> {
  return {
    selected_work_id: "string",
    selected_work_title: "string",
    selection_confidence: "string",
    selection_rationale: "string",
    work_status: "string",
    scope_paths: "string[]",
    latest_log_summary: "string",
    next_step_summary: "string",
    used_expanded_context: "boolean",
    other_candidate_work_ids: "string[]",
    ambiguity_notes: "string",
  };
}

function buildExpectedAnswer(targetBrief: WorkBrief, scenario: ScenarioDefinition): SessionReentryAnswer {
  return {
    selected_work_id: targetBrief.work_id,
    selected_work_title: targetBrief.title,
    selection_confidence: "high",
    selection_rationale: "",
    work_status: targetBrief.status,
    scope_paths: targetBrief.scope_paths,
    latest_log_summary: targetBrief.latest_log_summary,
    next_step_summary: targetBrief.next_step_summary,
    used_expanded_context: targetBrief.used_expanded_context,
    other_candidate_work_ids: scenario.candidate_work_ids.filter((workId) => workId !== targetBrief.work_id),
    ambiguity_notes: "",
  };
}

function tool(name: string, description: string, inputSchema: Record<string, string>, deterministicResponses: ToolFixture[]): ToolDefinition {
  return {
    name,
    description,
    input_schema: inputSchema,
    deterministic_responses: deterministicResponses,
  };
}

function baseInteractionContract(tools: ToolDefinition[]): InteractionContract {
  return {
    mode: "mock_tool_calling",
    max_tool_calls: 5,
    max_model_turns: 6,
    max_final_answer_attempts: 1,
    tools,
  };
}

async function buildWorkspaceVariant(projectRoot: string, candidates: WorkRecord[]): Promise<StrategyVariant> {
  const inspections = await Promise.all(candidates.map(async (candidate, index) => {
    const scopes = await Promise.all(candidate.scope_paths.map(async (scopePath) => {
      const repoRoot = await findRepoRoot(scopePath, projectRoot);
      const status = repoRoot ? await gitStatusShort(repoRoot) : "(no git repo found)";
      const treeSample = await sampleDirectoryTree(scopePath, 2, 24);
      return {
        scope_path: scopePath,
        repo_root: repoRoot ?? "",
        git_status_short: status,
        tree_sample: treeSample,
      };
    }));
    return { slot: index + 1, scopes };
  }));
  const tools = [
    tool(
      "list_candidate_slots",
      "List anonymous candidate slots available for workspace-only inspection.",
      {},
      [{ input: {}, result: { slots: inspections.map(({ slot, scopes }) => ({ slot, scope_paths: scopes.map((scope) => scope.scope_path) })) } }],
    ),
    tool(
      "inspect_candidate_slot",
      "Inspect one anonymous candidate slot using workspace-only evidence.",
      { slot: "number" },
      inspections.map((inspection) => ({
        input: { slot: inspection.slot },
        result: inspection,
      })),
    ),
  ];
  const contract = baseInteractionContract(tools);
  return {
    strategy: "no_continuity_workspace_scan_interactive",
    interaction_contract: contract,
    policy_rules: { start_tools: ["list_candidate_slots"] },
    metrics: metricFromObject(contract),
  };
}

async function buildNotesVariant(paths: LogbookPaths, candidates: WorkRecord[]): Promise<StrategyVariant> {
  const artifactPaths = await Promise.all(candidates.map((candidate) => existingArtifactFilePaths(paths, candidate)));
  const uniqueFiles = [paths.markdownPath, ...artifactPaths.flat()].sort((left, right) => left.localeCompare(right));
  const files = await Promise.all(uniqueFiles.map(async (filePath) => ({
    path: filePath,
    content: await readTextFile(filePath),
  })));
  const tools = [
    tool(
      "list_markdown_files",
      "List available markdown continuity files for this scenario.",
      {},
      [{ input: {}, result: { files: files.map((file) => ({ path: file.path })) } }],
    ),
    tool(
      "read_markdown_file",
      "Read one markdown file from the notes-replay surface.",
      { path: "string" },
      files.map((file) => ({
        input: { path: file.path },
        result: { path: file.path, content: file.content },
      })),
    ),
  ];
  const contract = baseInteractionContract(tools);
  return {
    strategy: "markdown_notebook_scan_interactive",
    interaction_contract: contract,
    policy_rules: { start_tools: ["list_markdown_files", "read_markdown_file"] },
    metrics: metricFromObject(contract),
  };
}

async function buildRawStateVariant(
  paths: LogbookPaths,
  scenario: ScenarioDefinition,
  candidates: WorkRecord[],
  logs: SessionLogEntry[],
): Promise<StrategyVariant> {
  const candidateIds = new Set(scenario.candidate_work_ids);
  const scopedLogs = logs.filter((entry) => candidateIds.has(entry.work_id));
  const scopedWorks = candidates.map((candidate) => ({
    work_id: candidate.work_id,
    title: candidate.title,
    slug: candidate.slug,
    status: candidate.status,
    start_dir: candidate.start_dir,
    scope_paths: candidate.scope_paths,
    summary: candidate.summary,
    tags: candidate.tags,
    created_at: candidate.created_at,
    updated_at: candidate.updated_at,
  }));
  const activeContextUpdatedAt =
    candidates.find((candidate) => candidate.work_id === (scenario.active_work_id ?? ""))?.updated_at
    ?? candidates.find((candidate) => candidate.work_id === scenario.target_work_id)?.updated_at
    ?? [...candidates].sort((left, right) => right.updated_at.localeCompare(left.updated_at))[0]?.updated_at
    ?? "";
  const workdocFixtures: ToolFixture[] = [];
  for (const candidate of candidates) {
    const workDir = path.join(paths.workdocsRoot, `${candidate.work_id}-${candidate.slug}`);
    for (const fileName of ARTIFACT_FILES) {
      const filePath = path.join(workDir, fileName);
      if (await pathExists(filePath)) {
        workdocFixtures.push({
          input: { work_id: candidate.work_id, file_name: fileName },
          result: { work_id: candidate.work_id, file_name: fileName, path: filePath, content: await readTextFile(filePath) },
        });
      }
    }
  }
  const tools = [
    tool(
      "read_active_context_json",
      "Read the raw active-context JSON file for this scenario.",
      {},
      [{
        input: {},
        result: {
          active_work_id: scenario.active_work_id ?? "",
          project_root: paths.projectRoot,
          updated_at: activeContextUpdatedAt,
        },
      }],
    ),
    tool(
      "read_works_json",
      "Read the raw works JSON for the candidate set.",
      {},
      [{ input: {}, result: scopedWorks }],
    ),
    tool(
      "read_session_log_json",
      "Read the raw session-log JSON for the candidate set.",
      {},
      [{ input: {}, result: scopedLogs }],
    ),
    tool(
      "read_workdoc_file",
      "Read one workdoc file from the raw-state surface.",
      { work_id: "string", file_name: "string" },
      workdocFixtures,
    ),
  ];
  const contract = baseInteractionContract(tools);
  return {
    strategy: "json_state_scan_interactive",
    interaction_contract: contract,
    policy_rules: { start_tools: ["read_active_context_json", "read_works_json", "read_session_log_json"] },
    metrics: metricFromObject(contract),
  };
}

function buildNormalizedVariant(
  scenario: ScenarioDefinition,
  candidateBriefs: WorkBrief[],
  candidateContexts: WorkContextBundle[],
): StrategyVariant {
  const activeBrief = candidateBriefs.find((candidate) => candidate.work_id === (scenario.active_work_id ?? ""));
  const openCandidateBriefs = candidateBriefs.filter((candidate) => candidate.status !== "done");
  const tools = [
    tool(
      "get_active_context_preview",
      "Return a normalized preview of the active context.",
      {},
      [{
        input: {},
        result: {
          active_work_id: scenario.active_work_id ?? "",
          active_work_title: activeBrief?.title ?? "",
        },
      }],
    ),
    tool(
      "list_open_work_preview",
      "Return normalized previews of open candidate work.",
      {},
      [{
        input: {},
        result: openCandidateBriefs.map((candidate) => ({
          work_id: candidate.work_id,
          title: candidate.title,
          status: candidate.status,
          next_step_summary: candidate.next_step_summary,
          latest_log_summary: candidate.latest_log_summary,
        })),
      }],
    ),
    tool(
      "get_work_brief",
      "Return a normalized brief for one candidate work.",
      { work_id: "string" },
      candidateBriefs.map((candidate) => ({
        input: { work_id: candidate.work_id },
        result: {
          artifact_availability: candidate.artifact_availability,
          context_mode: candidate.context_mode,
          work_state: candidate.work_state,
          recent_log_count: candidate.recent_log_count,
        },
      })),
    ),
    tool(
      "get_work_context",
      "Return normalized expanded context for one candidate work.",
      { work_id: "string" },
      candidateContexts.map((candidate) => ({
        input: { work_id: candidate.work_id },
        result: candidate,
      })),
    ),
  ];
  const contract = baseInteractionContract(tools);
  return {
    strategy: "json_state_normalized_scan_interactive",
    interaction_contract: contract,
    policy_rules: {
      start_tools: ["get_active_context_preview", "list_open_work_preview", "get_work_brief"],
      count_full_context_as_expansion: true,
    },
    metrics: metricFromObject(contract),
  };
}

function buildTasklogVariant(
  scenario: ScenarioDefinition,
  candidateBriefs: WorkBrief[],
  candidateContexts: WorkContextBundle[],
): StrategyVariant {
  const activeBrief = candidateBriefs.find((candidate) => candidate.work_id === (scenario.active_work_id ?? ""));
  const openCandidateBriefs = candidateBriefs.filter((candidate) => candidate.status !== "done");
  const resumeCandidates = candidateBriefs.map((candidate) => ({
    work_id: candidate.work_id,
    title: candidate.title,
    status: candidate.status,
  }));
  const tools = [
    tool(
      "get_active_context",
      "Return the active work context from Tasklog.",
      {},
      [{
        input: {},
        result: {
          active_work_id: scenario.active_work_id ?? "",
          active_work_title: activeBrief?.title ?? "",
        },
      }],
    ),
    tool(
      "list_works",
      "List open Tasklog work previews.",
      { status: "string" },
      [{
        input: { status: "open" },
        result: openCandidateBriefs.map((candidate) => ({
          work_id: candidate.work_id,
          title: candidate.title,
          status: candidate.status,
          next_step_summary: candidate.next_step_summary,
          latest_log_summary: candidate.latest_log_summary,
        })),
      }],
    ),
    tool(
      "resume_work",
      "Resume one Tasklog work item.",
      { work_id: "string" },
      resumeCandidates.map((candidate) => ({
        input: { work_id: candidate.work_id },
        result: candidate,
      })),
    ),
    tool(
      "read_reentry_brief",
      "Read the concise Tasklog re-entry brief for one work.",
      { work_id: "string" },
      candidateBriefs.map((candidate) => ({
        input: { work_id: candidate.work_id },
        result: candidate,
      })),
    ),
    tool(
      "read_work_context",
      "Read expanded Tasklog context for one work when the brief is not enough.",
      { work_id: "string" },
      candidateContexts.map((candidate) => ({
        input: { work_id: candidate.work_id },
        result: candidate,
      })),
    ),
  ];
  const contract = baseInteractionContract(tools);
  return {
    strategy: "tasklog_session_reentry_interactive",
    interaction_contract: contract,
    policy_rules: {
      start_tools: ["get_active_context", "list_works"],
      require_resume_before_brief: true,
      require_brief_before_full_context: true,
      count_full_context_as_expansion: true,
    },
    metrics: metricFromObject(contract),
  };
}

function blindVariants(seed: string, variants: StrategyVariant[]): { publicVariants: PublicVariant[]; keyVariants: KeyVariant[] } {
  const labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const ordered = [...variants].sort((left, right) =>
    normalizeForMatch(`${seed}:${left.strategy}`).localeCompare(normalizeForMatch(`${seed}:${right.strategy}`)));
  return {
    publicVariants: ordered.map((variant, index) => ({
      label: labels[index] ?? `V${index + 1}`,
      interaction_contract: variant.interaction_contract,
    })),
    keyVariants: ordered.map((variant, index) => ({
      label: labels[index] ?? `V${index + 1}`,
      strategy: variant.strategy,
      interaction_contract: variant.interaction_contract,
      policy_rules: variant.policy_rules,
      metrics: variant.metrics,
    })),
  };
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function stringListValue(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function booleanValue(value: unknown): boolean {
  return typeof value === "boolean" ? value : false;
}

function gradeScalarField(field: string, expected: string, actual: string): FieldScore {
  const normalizedExpected = normalizeForMatch(expected);
  const normalizedActual = normalizeForMatch(actual);
  if (normalizedExpected.length === 0 && normalizedActual.length === 0) {
    return { field, expected, actual, outcome: "correct" };
  }
  if (normalizedExpected.length === 0 && normalizedActual.length > 0) {
    return { field, expected, actual, outcome: "hallucinated" };
  }
  if (normalizedExpected.length > 0 && normalizedActual.length === 0) {
    return { field, expected, actual, outcome: "abstained" };
  }
  return {
    field,
    expected,
    actual,
    outcome: normalizedExpected === normalizedActual ? "correct" : "wrong",
  };
}

function gradeListField(field: string, expected: string[], actual: string[]): FieldScore {
  return gradeScalarField(field, normalizeList(expected).join(" | "), normalizeList(actual).join(" | "));
}

function gradeBooleanField(field: string, expected: boolean, actual: boolean): FieldScore {
  return gradeScalarField(field, String(expected), String(actual));
}

function gradeAnswer(expected: SessionReentryAnswer, answer: Record<string, unknown>): FieldScore[] {
  return [
    gradeScalarField("selected_work_id", expected.selected_work_id, stringValue(answer.selected_work_id)),
    gradeScalarField("selected_work_title", expected.selected_work_title, stringValue(answer.selected_work_title)),
    gradeScalarField("work_status", expected.work_status, stringValue(answer.work_status)),
    gradeListField("scope_paths", expected.scope_paths, stringListValue(answer.scope_paths)),
    gradeScalarField("latest_log_summary", expected.latest_log_summary, stringValue(answer.latest_log_summary)),
    gradeScalarField("next_step_summary", expected.next_step_summary, stringValue(answer.next_step_summary)),
    gradeBooleanField("used_expanded_context", expected.used_expanded_context, booleanValue(answer.used_expanded_context)),
  ];
}

function answerRowKey(scenarioId: string, variantLabel: string): string {
  return `${scenarioId}::${variantLabel}`;
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

function validateTraceRows(batch: TraceBatch, key: BenchmarkKey): void {
  const expectedRows = new Set(key.scenarios.flatMap((scenario) =>
    scenario.variants.map((variant) => answerRowKey(scenario.scenario_id, variant.label))));
  const seenRows = new Set<string>();
  for (const trace of batch.traces) {
    const rowKey = answerRowKey(trace.scenario_id, trace.variant_label);
    if (!expectedRows.has(rowKey)) {
      throw new Error(`Unknown trace row: ${trace.scenario_id} / ${trace.variant_label}`);
    }
    if (seenRows.has(rowKey)) {
      throw new Error(`Duplicate trace row: ${trace.scenario_id} / ${trace.variant_label}`);
    }
    seenRows.add(rowKey);
  }
  const missingRows = [...expectedRows].filter((rowKey) => !seenRows.has(rowKey));
  if (missingRows.length > 0) {
    throw new Error(`Trace batch is incomplete. Missing ${missingRows.length} expected row(s), starting with ${missingRows[0]}.`);
  }
}

function findFixture(toolDef: ToolDefinition, toolInput: Record<string, unknown>): ToolFixture | undefined {
  const expectedInput = canonicalJson(toolInput);
  return toolDef.deterministic_responses.find((fixture) => canonicalJson(fixture.input) === expectedInput);
}

function assessTracePolicy(
  trace: TraceRun,
  variant: KeyVariant,
  requireFullContext: boolean,
): {
  violation_messages: string[];
  tool_policy_violation: boolean;
  trace_integrity_violation: boolean;
  budget_exhausted: boolean;
  unnecessary_expansion: boolean;
} {
  const violationMessages: string[] = [];
  const toolsByName = new Map(variant.interaction_contract.tools.map((toolDef) => [toolDef.name, toolDef]));
  const resumedWorks = new Set<string>();
  const briefedWorks = new Set<string>();
  let traceIntegrityViolation = false;
  let unnecessaryExpansion = false;

  if (trace.step_budget.max_tool_calls !== variant.interaction_contract.max_tool_calls
    || trace.step_budget.max_model_turns !== variant.interaction_contract.max_model_turns
    || trace.step_budget.max_final_answer_attempts !== variant.interaction_contract.max_final_answer_attempts) {
    violationMessages.push("trace step_budget does not match the frozen interaction contract");
  }
  if (trace.tool_calls.length > variant.interaction_contract.max_tool_calls) {
    violationMessages.push("tool call budget exceeded");
  }
  if (trace.model_turns > variant.interaction_contract.max_model_turns) {
    violationMessages.push("model turn budget exceeded");
  }
  if (trace.tool_calls.length > 0 && !variant.policy_rules.start_tools.includes(trace.tool_calls[0]!.tool_name)) {
    violationMessages.push(`trace started with disallowed first tool ${trace.tool_calls[0]!.tool_name}`);
  }

  trace.tool_calls.forEach((call, index) => {
    if (call.step_index !== index + 1) {
      violationMessages.push(`tool call step_index ${call.step_index} does not match position ${index + 1}`);
    }
    const toolDef = toolsByName.get(call.tool_name);
    if (!toolDef) {
      violationMessages.push(`tool ${call.tool_name} is not allowed for this variant`);
      traceIntegrityViolation = true;
      return;
    }
    const fixture = findFixture(toolDef, call.tool_input);
    if (!fixture) {
      violationMessages.push(`tool ${call.tool_name} used an input not present in frozen fixtures`);
      traceIntegrityViolation = true;
    } else if (canonicalJson(fixture.result) !== canonicalJson(call.tool_result)) {
      violationMessages.push(`tool ${call.tool_name} returned a result that does not match frozen fixtures`);
      traceIntegrityViolation = true;
    }

    const workId = stringValue(call.tool_input.work_id);
    if (call.tool_name === "resume_work" && workId) {
      resumedWorks.add(workId);
    }
    if (call.tool_name === "read_reentry_brief" && workId) {
      if (variant.policy_rules.require_resume_before_brief && !resumedWorks.has(workId)) {
        violationMessages.push(`read_reentry_brief called before resume_work for ${workId}`);
      }
      briefedWorks.add(workId);
    }
    if (call.tool_name === "read_work_context" && workId) {
      if (variant.policy_rules.require_brief_before_full_context && !briefedWorks.has(workId)) {
        violationMessages.push(`read_work_context called before read_reentry_brief for ${workId}`);
      }
      if (variant.policy_rules.count_full_context_as_expansion && !requireFullContext) {
        unnecessaryExpansion = true;
      }
    }
  });

  return {
    violation_messages: [...new Set(violationMessages)],
    tool_policy_violation: violationMessages.length > 0,
    trace_integrity_violation: traceIntegrityViolation,
    budget_exhausted: trace.final_status === "budget_exhausted"
      || trace.tool_calls.length > variant.interaction_contract.max_tool_calls
      || trace.model_turns > variant.interaction_contract.max_model_turns,
    unnecessary_expansion: unnecessaryExpansion,
  };
}

async function resolveScenarioManifest(options: CliOptions): Promise<ScenarioManifest> {
  if (!options.manifestPath) {
    throw new Error("benchmark-full-session-reentry-interactive requires --manifest");
  }
  return loadManifest(options.manifestPath);
}

function selectScenarioIds(manifest: ScenarioManifest, split?: CliOptions["split"]): string[] {
  if (split && manifest.splits[split]) {
    return manifest.splits[split] ?? [];
  }
  return manifest.scenarios.map((scenario) => scenario.scenario_id);
}

async function buildPack(options: CliOptions): Promise<{ pack: BenchmarkPack; key: BenchmarkKey }> {
  const manifest = await resolveScenarioManifest(options);
  const paths = resolveLogbookPaths(options.projectRoot);
  const works = await readWorkRecords(paths);
  const logs = await readLogEntries(paths);
  const scenarioIds = new Set(selectScenarioIds(manifest, options.split));
  const scenarios = manifest.scenarios.filter((scenario) => scenarioIds.has(scenario.scenario_id));
  const packScenarios: ScenarioPack[] = [];
  const keyScenarios: ScenarioKey[] = [];

  for (const scenario of scenarios) {
    const candidateWorks = scenario.candidate_work_ids.map((workId) => {
      const work = works.find((entry) => entry.work_id === workId);
      if (!work) {
        throw new Error(`Unknown work_id in scenario ${scenario.scenario_id}: ${workId}`);
      }
      return work;
    });
    const targetWork = candidateWorks.find((candidate) => candidate.work_id === scenario.target_work_id);
    if (!targetWork) {
      throw new Error(`Target work ${scenario.target_work_id} is not listed as candidate for ${scenario.scenario_id}`);
    }
    const candidateBriefs = await Promise.all(candidateWorks.map((candidate) =>
      buildWorkBrief(paths, candidate, scenario.require_full_context && candidate.work_id === scenario.target_work_id)));
    const candidateContexts = await Promise.all(candidateWorks.map((candidate) =>
      buildWorkContextBundle(paths, candidate, scenario.require_full_context && candidate.work_id === scenario.target_work_id)));
    const targetBrief = candidateBriefs.find((candidate) => candidate.work_id === scenario.target_work_id);
    if (!targetBrief) {
      throw new Error(`Failed to build target brief for ${scenario.scenario_id}`);
    }

    const variants: StrategyVariant[] = [
      await buildWorkspaceVariant(options.projectRoot, candidateWorks),
      await buildNotesVariant(paths, candidateWorks),
      await buildRawStateVariant(paths, scenario, candidateWorks, logs),
      buildNormalizedVariant(scenario, candidateBriefs, candidateContexts),
      buildTasklogVariant(scenario, candidateBriefs, candidateContexts),
    ];
    const blinded = blindVariants(scenario.scenario_id, variants);
    const expected = buildExpectedAnswer(targetBrief, scenario);
    const title = `Interactive Full Session Re-entry (${targetWork.title})`;

    packScenarios.push({
      scenario_id: scenario.scenario_id,
      scenario_family: scenario.family,
      title,
      prompt: sessionPrompt(),
      answer_contract: sessionContract(),
      trace_schema_path: TRACE_SCHEMA_DOC_PATH,
      variants: blinded.publicVariants,
    });
    keyScenarios.push({
      scenario_id: scenario.scenario_id,
      scenario_family: scenario.family,
      title,
      expected_answer: expected,
      require_full_context: Boolean(scenario.require_full_context),
      variants: blinded.keyVariants,
    });
  }

  return {
    pack: {
      benchmark_type: "full_session_reentry_interactive",
      project_root: options.projectRoot,
      scenario_manifest_path: options.manifestPath ?? "",
      trace_schema_path: TRACE_SCHEMA_DOC_PATH,
      notes: [
        "This benchmark measures budgeted interactive full-session re-entry with deterministic mock tools.",
        "Each strategy exposes a fixed tool set and frozen tool fixtures for the same scenario.",
        "The benchmark is dev-ready for prototyping but should remain supporting or exploratory until its trace workflow is frozen.",
      ],
      scenarios: packScenarios,
    },
    key: {
      benchmark_type: "full_session_reentry_interactive",
      project_root: options.projectRoot,
      scenario_manifest_path: options.manifestPath ?? "",
      trace_schema_path: TRACE_SCHEMA_DOC_PATH,
      notes: [
        "Use this answer key only for grading.",
      ],
      scenarios: keyScenarios,
    },
  };
}

function writeTraceTemplate(pack: BenchmarkPack, split?: CliOptions["split"]): TraceBatch {
  return {
    benchmark_type: "full_session_reentry_interactive",
    split: split ?? "dev",
    project_root: pack.project_root,
    pack_path: "",
    trace_schema_path: pack.trace_schema_path,
    run_id: "",
    provider: "",
    model_id: "",
    model_family: "",
    reasoning_setting: "",
    runner_name: "",
    runner_version: "",
    traces: pack.scenarios.flatMap((scenario) => scenario.variants.map((variant) => ({
      scenario_id: scenario.scenario_id,
      variant_label: variant.label,
      step_budget: {
        max_tool_calls: variant.interaction_contract.max_tool_calls,
        max_model_turns: variant.interaction_contract.max_model_turns,
        max_final_answer_attempts: variant.interaction_contract.max_final_answer_attempts,
      },
      final_status: "answered" as const,
      model_turns: 0,
      run_started_at: "",
      run_finished_at: "",
      tool_calls: [],
      final_answer: {},
    }))),
  };
}

async function writePackFiles(outDir: string, pack: BenchmarkPack, key: BenchmarkKey, split?: CliOptions["split"]): Promise<string[]> {
  await fs.mkdir(outDir, { recursive: true });
  const packPath = path.join(outDir, "full-session-reentry-interactive-pack.json");
  const keyPath = path.join(outDir, "full-session-reentry-interactive-answer-key.json");
  const templatePath = path.join(outDir, "full-session-reentry-interactive-trace-template.json");
  await Promise.all([
    fs.writeFile(packPath, JSON.stringify(pack, null, 2), "utf8"),
    fs.writeFile(keyPath, JSON.stringify(key, null, 2), "utf8"),
    fs.writeFile(templatePath, JSON.stringify(writeTraceTemplate(pack, split), null, 2), "utf8"),
  ]);
  return [packPath, keyPath, templatePath];
}

async function resolveKeyPath(tracePath: string, explicitKeyPath: string | undefined, defaultFileName: string): Promise<string> {
  if (explicitKeyPath) {
    return explicitKeyPath;
  }
  const siblingKeyPath = path.join(path.dirname(tracePath), defaultFileName);
  if (await pathExists(siblingKeyPath)) {
    return siblingKeyPath;
  }
  throw new Error(`Could not find frozen answer key. Pass --key-in explicitly or place ${defaultFileName} next to the trace file.`);
}

async function gradeTraceBatch(tracePath: string, key: BenchmarkKey) {
  const batch = traceBatchSchema.parse(await readJsonFile<TraceBatch>(tracePath));
  validateTraceRows(batch, key);
  const gradedTraces = batch.traces.map((trace) => {
    const scenario = key.scenarios.find((entry) => entry.scenario_id === trace.scenario_id);
    if (!scenario) {
      throw new Error(`Unknown scenario in trace batch: ${trace.scenario_id}`);
    }
    const variant = scenario.variants.find((entry) => entry.label === trace.variant_label);
    if (!variant) {
      throw new Error(`Unknown variant for ${trace.scenario_id}: ${trace.variant_label}`);
    }
    const fieldScores = gradeAnswer(scenario.expected_answer, trace.final_answer);
    const policy = assessTracePolicy(trace, variant, scenario.require_full_context);
    return {
      scenario_id: trace.scenario_id,
      variant_label: trace.variant_label,
      strategy: variant.strategy,
      field_scores: fieldScores,
      final_status: trace.final_status,
      model_turns: trace.model_turns,
      tool_calls_used: trace.tool_calls.length,
      policy,
    };
  });

  const grouped = new Map<string, typeof gradedTraces>();
  for (const trace of gradedTraces) {
    const entries = grouped.get(trace.strategy) ?? [];
    entries.push(trace);
    grouped.set(trace.strategy, entries);
  }
  const aggregate = [...grouped.entries()].map(([strategy, entries]) => {
    const fieldScores = entries.flatMap((entry) => entry.field_scores);
    const supported = fieldScores.filter((score) => normalizeForMatch(score.expected).length > 0);
    const correct = fieldScores.filter((score) => score.outcome === "correct").length;
    const recoveredSupported = supported.filter((score) => score.outcome === "correct").length;
    const toolPolicyViolations = entries.filter((entry) => entry.policy.tool_policy_violation).length;
    const traceIntegrityViolations = entries.filter((entry) => entry.policy.trace_integrity_violation).length;
    const budgetExhaustions = entries.filter((entry) => entry.policy.budget_exhausted).length;
    const unnecessaryExpansions = entries.filter((entry) => entry.policy.unnecessary_expansion).length;
    const strictSuccess = entries.filter((entry) =>
      entry.final_status === "answered"
      && entry.field_scores.every((score) => score.outcome === "correct")
      && !entry.policy.tool_policy_violation
      && !entry.policy.trace_integrity_violation).length;
    const correctTarget = entries.filter((entry) =>
      entry.field_scores.find((score) => score.field === "selected_work_id")?.outcome === "correct").length;
    const correctNextStep = entries.filter((entry) =>
      entry.field_scores.find((score) => score.field === "next_step_summary")?.outcome === "correct").length;
    return {
      strategy,
      scenario_total: entries.length,
      strict_scenario_success_total: strictSuccess,
      strict_scenario_success_percent: entries.length > 0 ? (strictSuccess / entries.length) * 100 : 0,
      resume_target_accuracy_percent: entries.length > 0 ? (correctTarget / entries.length) * 100 : 0,
      next_step_accuracy_percent: entries.length > 0 ? (correctNextStep / entries.length) * 100 : 0,
      supported_field_recall_percent: supported.length > 0 ? (recoveredSupported / supported.length) * 100 : 100,
      field_accuracy_percent: fieldScores.length > 0 ? (correct / fieldScores.length) * 100 : 100,
      tool_policy_violation_total: toolPolicyViolations,
      tool_policy_violation_percent: entries.length > 0 ? (toolPolicyViolations / entries.length) * 100 : 0,
      trace_integrity_violation_total: traceIntegrityViolations,
      budget_exhaustion_total: budgetExhaustions,
      budget_exhaustion_percent: entries.length > 0 ? (budgetExhaustions / entries.length) * 100 : 0,
      unnecessary_expansion_total: unnecessaryExpansions,
      unnecessary_expansion_percent: entries.length > 0 ? (unnecessaryExpansions / entries.length) * 100 : 0,
    };
  }).sort((left, right) => right.resume_target_accuracy_percent - left.resume_target_accuracy_percent);

  return {
    trace_batch_summary: {
      split: batch.split,
      provider: batch.provider,
      model_id: batch.model_id,
      model_family: batch.model_family,
      reasoning_setting: batch.reasoning_setting,
      runner_name: batch.runner_name,
      runner_version: batch.runner_version,
      response_count: batch.traces.length,
    },
    graded_traces: gradedTraces,
    aggregate,
  };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  if (options.gradeIn) {
    const keyPath = await resolveKeyPath(
      options.gradeIn,
      options.keyIn,
      "full-session-reentry-interactive-answer-key.json",
    );
    const key = await readJsonFile<BenchmarkKey>(keyPath);
    const graded = await gradeTraceBatch(options.gradeIn, key);
    console.log(JSON.stringify({
      key_path: keyPath,
      ...graded,
    }, null, 2));
    return;
  }

  const { pack, key } = await buildPack(options);
  if (options.outDir) {
    const files = await writePackFiles(options.outDir, pack, key, options.split);
    console.log(JSON.stringify({
      out_dir: options.outDir,
      scenario_count: pack.scenarios.length,
      files,
    }, null, 2));
    return;
  }
  if (options.json || !options.outDir) {
    console.log(JSON.stringify({
      benchmark_type: pack.benchmark_type,
      scenario_count: pack.scenarios.length,
      scenario_ids: pack.scenarios.map((scenario) => scenario.scenario_id),
    }, null, 2));
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
