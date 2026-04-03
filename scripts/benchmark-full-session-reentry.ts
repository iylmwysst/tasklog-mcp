import path from "node:path";
import { promises as fs } from "node:fs";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";

import {
  readLogEntries,
  readWorkContext,
  readWorkRecords,
  resolveLogbookPaths,
  type LogbookPaths,
  type SessionLogEntry,
  type WorkRecord,
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

interface SurfaceMetrics {
  bytes: number;
  lines: number;
  estTokens: number;
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

interface StrategyVariant {
  strategy: string;
  payload: string;
  metrics: SurfaceMetrics;
}

interface BlindVariant {
  label: string;
  payload: string;
}

interface AnswerKeyVariant {
  label: string;
  strategy: string;
  metrics: SurfaceMetrics;
}

interface ScenarioPack {
  scenario_id: string;
  scenario_family: ScenarioDefinition["family"];
  title: string;
  prompt: string;
  answer_contract: Record<string, string>;
  variants: BlindVariant[];
}

interface ScenarioKey {
  scenario_id: string;
  scenario_family: ScenarioDefinition["family"];
  title: string;
  expected_answer: SessionReentryAnswer;
  variants: AnswerKeyVariant[];
}

interface BenchmarkPack {
  benchmark_type: "full_session_reentry";
  project_root: string;
  notes: string[];
  scenarios: ScenarioPack[];
}

interface BenchmarkKey {
  benchmark_type: "full_session_reentry";
  project_root: string;
  notes: string[];
  scenarios: ScenarioKey[];
}

interface AnswerSubmission {
  scenario_id: string;
  variant_label: string;
  answer: Record<string, unknown>;
}

interface AnswerSheet {
  responses: AnswerSubmission[];
}

interface FieldScore {
  field: string;
  expected: string;
  actual: string;
  outcome: "correct" | "wrong" | "abstained" | "hallucinated";
}

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

function metricFromText(text: string): SurfaceMetrics {
  const bytes = Buffer.byteLength(text, "utf8");
  const lines = text.length === 0 ? 0 : text.split(/\r?\n/).length;
  return {
    bytes,
    lines,
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

async function buildWorkBrief(
  paths: LogbookPaths,
  work: WorkRecord,
  requireFullContext = false,
): Promise<{
  work_id: string;
  title: string;
  status: string;
  scope_paths: string[];
  latest_log_summary: string;
  next_step_summary: string;
  artifact_files: string[];
  used_expanded_context: boolean;
}> {
  const surface = requireFullContext ? "full" : "brief";
  const context = await readWorkContext(paths, work.work_id, { surface, include_recent_logs: requireFullContext });
  const logs = await readLogEntries(paths);
  const logsForWork = logs.filter((entry) => entry.work_id === work.work_id);
  return {
    work_id: work.work_id,
    title: context.work.title,
    status: context.work.status,
    scope_paths: context.reentry_brief?.scope_paths ?? context.work.scope_paths,
    latest_log_summary: normalizeOptional(
      context.reentry_brief?.latest_log_summary ?? latestLog(logsForWork)?.summary,
    ),
    next_step_summary: normalizeOptional(
      context.reentry_brief?.next_step_summary ?? context.next_step_summary ?? latestNextStep(logsForWork),
    ),
    artifact_files: context.reentry_brief?.artifact_files ?? [],
    used_expanded_context: requireFullContext,
  };
}

async function noContinuityWorkText(projectRoot: string, work: WorkRecord): Promise<string> {
  const sections = await Promise.all(work.scope_paths.map(async (scopePath) => {
    const repoRoot = await findRepoRoot(scopePath, projectRoot);
    const tree = await sampleDirectoryTree(scopePath, 2, 24);
    const status = repoRoot ? await gitStatusShort(repoRoot) : "(no git repo found)";
    return [
      `SCOPE_PATH: ${scopePath}`,
      `REPO_ROOT: ${repoRoot ?? "(none)"}`,
      `GIT_STATUS_SHORT:\n${status}`,
      `TREE_SAMPLE:\n${tree.join("\n")}`,
    ].join("\n");
  }));
  return sections.join("\n\n");
}

function sessionPrompt(): string {
  return [
    "You are resuming work in a coding workspace.",
    "Based only on the provided payload, determine which unfinished work should be resumed now.",
    "Then summarize its current state and state the next concrete step.",
    "Do not guess. If a field is unknown, return an empty string or an empty array.",
    "",
    "Return this JSON shape:",
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

function buildExpectedAnswer(
  targetBrief: Awaited<ReturnType<typeof buildWorkBrief>>,
  scenario: ScenarioDefinition,
): SessionReentryAnswer {
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

async function buildWorkspaceOnlyPayload(projectRoot: string, candidates: WorkRecord[]): Promise<string> {
  const sections = await Promise.all(candidates.map(async (candidate, index) => {
    const scan = await noContinuityWorkText(projectRoot, candidate);
    return [`CANDIDATE_SLOT: ${index + 1}`, scan].join("\n");
  }));
  return [
    "SESSION_MODE: full_session_reentry",
    "SURFACE: workspace_only",
    sections.join("\n\n"),
  ].join("\n\n");
}

async function buildNotesReplayPayload(paths: LogbookPaths, candidates: WorkRecord[]): Promise<string> {
  const artifactPaths = await Promise.all(candidates.map((candidate) => existingArtifactFilePaths(paths, candidate)));
  const uniqueFiles = [paths.markdownPath, ...artifactPaths.flat()];
  const texts = await Promise.all(uniqueFiles.map(async (filePath) => {
    const content = await readTextFile(filePath);
    return `FILE: ${filePath}\n${content}`;
  }));
  return texts.join("\n\n");
}

async function buildRawStatePayload(
  paths: LogbookPaths,
  scenario: ScenarioDefinition,
  candidates: WorkRecord[],
  logs: SessionLogEntry[],
): Promise<string> {
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
  return [
    "FILE: .tasklog/active-context.json",
    JSON.stringify({
      active_work_id: scenario.active_work_id ?? "",
      project_root: paths.projectRoot,
      updated_at: activeContextUpdatedAt,
    }, null, 2),
    "",
    "FILE: .tasklog/works.json",
    JSON.stringify(scopedWorks, null, 2),
    "",
    "FILE: .tasklog/session-log.json",
    JSON.stringify(scopedLogs, null, 2),
  ].join("\n");
}

function buildNormalizedStatePayload(
  scenario: ScenarioDefinition,
  candidateBriefs: Awaited<ReturnType<typeof buildWorkBrief>>[],
): string {
  const activeBrief = candidateBriefs.find((candidate) => candidate.work_id === (scenario.active_work_id ?? ""));
  const openCandidateBriefs = candidateBriefs.filter((candidate) => candidate.status !== "done");
  return JSON.stringify({
    active_context: activeBrief
      ? {
          active_work_id: activeBrief.work_id,
          active_work_title: activeBrief.title,
        }
      : {
          active_work_id: scenario.active_work_id ?? "",
          active_work_title: "",
        },
    open_work_preview: openCandidateBriefs.map((candidate) => ({
      work_id: candidate.work_id,
      title: candidate.title,
      status: candidate.status,
      next_step_summary: candidate.next_step_summary,
      latest_log_summary: candidate.latest_log_summary,
    })),
    candidate_briefs: candidateBriefs.map((candidate) => ({
      work_id: candidate.work_id,
      title: candidate.title,
      status: candidate.status,
      scope_paths: candidate.scope_paths,
      latest_log_summary: candidate.latest_log_summary,
      next_step_summary: candidate.next_step_summary,
      artifact_files: candidate.artifact_files,
    })),
  }, null, 2);
}

function buildTasklogPayload(
  scenario: ScenarioDefinition,
  candidateBriefs: Awaited<ReturnType<typeof buildWorkBrief>>[],
): string {
  const activeBrief = candidateBriefs.find((candidate) => candidate.work_id === (scenario.active_work_id ?? ""));
  const openCandidateBriefs = candidateBriefs.filter((candidate) => candidate.status !== "done");
  return JSON.stringify({
    workflow: "shortlist-first static session re-entry",
    protocol_mode: "static_scripted_shortlist_approximation",
    approximation_notes: [
      "This payload approximates the live Tasklog flow in one shot.",
      "Open-work discovery appears first, followed by brief snapshots for the open shortlist only.",
      "Closed distractors are excluded from the brief step because list_works(status=open) would not return them.",
    ],
    steps: [
      {
        tool: "get_active_context",
        result: {
          active_work_id: scenario.active_work_id ?? "",
          active_work_title: activeBrief?.title ?? "",
        },
      },
      {
        tool: "list_works",
        input: { status: "open" },
        result: openCandidateBriefs.map((candidate) => ({
          work_id: candidate.work_id,
          title: candidate.title,
          status: candidate.status,
          next_step_summary: candidate.next_step_summary,
          latest_log_summary: candidate.latest_log_summary,
        })),
      },
      ...openCandidateBriefs.map((candidate) => ({
        tool: "read_reentry_brief",
        input: { work_id: candidate.work_id },
        result: {
          title: candidate.title,
          status: candidate.status,
          scope_paths: candidate.scope_paths,
          latest_log_summary: candidate.latest_log_summary,
          next_step_summary: candidate.next_step_summary,
          artifact_files: candidate.artifact_files,
        },
      })),
    ],
  }, null, 2);
}

function blindVariants(seed: string, variants: StrategyVariant[]): { publicVariants: BlindVariant[]; keyVariants: AnswerKeyVariant[] } {
  const labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const ordered = [...variants].sort((left, right) => {
    const leftKey = normalizeForMatch(`${seed}:${left.strategy}`);
    const rightKey = normalizeForMatch(`${seed}:${right.strategy}`);
    return leftKey.localeCompare(rightKey);
  });
  return {
    publicVariants: ordered.map((variant, index) => ({
      label: labels[index] ?? `V${index + 1}`,
      payload: variant.payload,
    })),
    keyVariants: ordered.map((variant, index) => ({
      label: labels[index] ?? `V${index + 1}`,
      strategy: variant.strategy,
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

async function resolveScenarioManifest(options: CliOptions): Promise<ScenarioManifest> {
  if (!options.manifestPath) {
    throw new Error("benchmark-full-session-reentry requires --manifest");
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
      buildWorkBrief(paths, candidate, scenario.require_full_context && candidate.work_id === scenario.target_work_id),
    ));
    const targetBrief = candidateBriefs.find((candidate) => candidate.work_id === scenario.target_work_id);
    if (!targetBrief) {
      throw new Error(`Failed to build target brief for ${scenario.scenario_id}`);
    }

    const workspacePayload = await buildWorkspaceOnlyPayload(options.projectRoot, candidateWorks);
    const notesPayload = await buildNotesReplayPayload(paths, candidateWorks);
    const rawPayload = await buildRawStatePayload(paths, scenario, candidateWorks, logs);
    const normalizedPayload = buildNormalizedStatePayload(scenario, candidateBriefs);
    const tasklogPayload = buildTasklogPayload(scenario, candidateBriefs);

    const variants: StrategyVariant[] = [
      { strategy: "no_continuity_workspace_scan", payload: workspacePayload, metrics: metricFromText(workspacePayload) },
      { strategy: "markdown_notebook_scan", payload: notesPayload, metrics: metricFromText(notesPayload) },
      { strategy: "json_state_scan", payload: rawPayload, metrics: metricFromText(rawPayload) },
      { strategy: "json_state_normalized_scan", payload: normalizedPayload, metrics: metricFromText(normalizedPayload) },
      { strategy: "tasklog_session_reentry_flow", payload: tasklogPayload, metrics: metricFromText(tasklogPayload) },
    ];
    const blinded = blindVariants(scenario.scenario_id, variants);
    const expected = buildExpectedAnswer(targetBrief, scenario);
    const title = `Full Session Re-entry (${targetWork.title})`;

    packScenarios.push({
      scenario_id: scenario.scenario_id,
      scenario_family: scenario.family,
      title,
      prompt: sessionPrompt(),
      answer_contract: sessionContract(),
      variants: blinded.publicVariants,
    });
    keyScenarios.push({
      scenario_id: scenario.scenario_id,
      scenario_family: scenario.family,
      title,
      expected_answer: expected,
      variants: blinded.keyVariants,
    });
  }

  return {
    pack: {
      benchmark_type: "full_session_reentry",
      project_root: options.projectRoot,
      notes: [
        "This benchmark approximates full session-to-session re-entry using scripted multi-step payloads.",
        "Each strategy answers the same end-to-end resume question for the same scenario.",
        "The benchmark is supporting or exploratory until its protocol and scenario pack are frozen.",
      ],
      scenarios: packScenarios,
    },
    key: {
      benchmark_type: "full_session_reentry",
      project_root: options.projectRoot,
      notes: [
        "Use this answer key only for grading.",
      ],
      scenarios: keyScenarios,
    },
  };
}

function writeAnswerTemplate(pack: BenchmarkPack): AnswerSheet {
  return {
    responses: pack.scenarios.flatMap((scenario) => scenario.variants.map((variant) => ({
      scenario_id: scenario.scenario_id,
      variant_label: variant.label,
      answer: {},
    }))),
  };
}

async function writePackFiles(outDir: string, pack: BenchmarkPack, key: BenchmarkKey): Promise<string[]> {
  await fs.mkdir(outDir, { recursive: true });
  const packPath = path.join(outDir, "full-session-reentry-pack.json");
  const keyPath = path.join(outDir, "full-session-reentry-answer-key.json");
  const templatePath = path.join(outDir, "full-session-reentry-answer-template.json");
  await Promise.all([
    fs.writeFile(packPath, JSON.stringify(pack, null, 2), "utf8"),
    fs.writeFile(keyPath, JSON.stringify(key, null, 2), "utf8"),
    fs.writeFile(templatePath, JSON.stringify(writeAnswerTemplate(pack), null, 2), "utf8"),
  ]);
  return [packPath, keyPath, templatePath];
}

async function resolveKeyPath(answerPath: string, explicitKeyPath: string | undefined, defaultFileName: string): Promise<string> {
  if (explicitKeyPath) {
    return explicitKeyPath;
  }
  const siblingKeyPath = path.join(path.dirname(answerPath), defaultFileName);
  if (await pathExists(siblingKeyPath)) {
    return siblingKeyPath;
  }
  throw new Error(`Could not find frozen answer key. Pass --key-in explicitly or place ${defaultFileName} next to the answer sheet.`);
}

function answerRowKey(scenarioId: string, variantLabel: string): string {
  return `${scenarioId}::${variantLabel}`;
}

function validateAnswerSheetRows(sheet: AnswerSheet, key: BenchmarkKey): void {
  const expectedRows = new Set(
    key.scenarios.flatMap((scenario) =>
      scenario.variants.map((variant) => answerRowKey(scenario.scenario_id, variant.label))),
  );
  const seenRows = new Set<string>();

  for (const response of sheet.responses) {
    const rowKey = answerRowKey(response.scenario_id, response.variant_label);
    if (!expectedRows.has(rowKey)) {
      throw new Error(`Unknown answer-sheet row: ${response.scenario_id} / ${response.variant_label}`);
    }
    if (seenRows.has(rowKey)) {
      throw new Error(`Duplicate answer-sheet row: ${response.scenario_id} / ${response.variant_label}`);
    }
    seenRows.add(rowKey);
  }

  const missingRows = [...expectedRows].filter((rowKey) => !seenRows.has(rowKey));
  if (missingRows.length > 0) {
    throw new Error(`Answer sheet is incomplete. Missing ${missingRows.length} expected row(s), starting with ${missingRows[0]}.`);
  }
}

async function gradeAnswerSheet(gradeIn: string, manifest: { pack: BenchmarkPack; key: BenchmarkKey }) {
  const sheet = await readJsonFile<AnswerSheet>(gradeIn);
  validateAnswerSheetRows(sheet, manifest.key);
  const gradedResponses = sheet.responses.map((response) => {
    const scenario = manifest.key.scenarios.find((entry) => entry.scenario_id === response.scenario_id);
    if (!scenario) {
      throw new Error(`Unknown scenario in answer sheet: ${response.scenario_id}`);
    }
    const variant = scenario.variants.find((entry) => entry.label === response.variant_label);
    if (!variant) {
      throw new Error(`Unknown variant for ${response.scenario_id}: ${response.variant_label}`);
    }
    const fieldScores = gradeAnswer(scenario.expected_answer, response.answer);
    return {
      scenario_id: response.scenario_id,
      variant_label: response.variant_label,
      strategy: variant.strategy,
      fieldScores,
    };
  });

  return {
    graded_responses: gradedResponses,
  };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  if (options.gradeIn) {
    const keyPath = await resolveKeyPath(options.gradeIn, options.keyIn, "full-session-reentry-answer-key.json");
    const key = await readJsonFile<BenchmarkKey>(keyPath);
    const graded = await gradeAnswerSheet(options.gradeIn, {
      pack: {
        benchmark_type: "full_session_reentry",
        project_root: options.projectRoot,
        notes: [],
        scenarios: [],
      },
      key,
    });
    console.log(JSON.stringify({
      key_path: keyPath,
      ...graded,
    }, null, 2));
    return;
  }

  const manifest = await buildPack(options);

  if (options.outDir) {
    const files = await writePackFiles(options.outDir, manifest.pack, manifest.key);
    console.log(JSON.stringify({
      out_dir: options.outDir,
      scenario_count: manifest.pack.scenarios.length,
      files,
    }, null, 2));
    return;
  }

  if (options.json) {
    console.log(JSON.stringify({
      benchmark_type: manifest.pack.benchmark_type,
      scenario_count: manifest.pack.scenarios.length,
      scenario_ids: manifest.pack.scenarios.map((scenario) => scenario.scenario_id),
    }, null, 2));
    return;
  }

  console.log("# Full Session Re-entry Benchmark");
  console.log("");
  console.log(`- project_root: ${options.projectRoot}`);
  console.log(`- split: ${options.split ?? "(all)"}`);
  console.log(`- scenario_count: ${manifest.pack.scenarios.length}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
