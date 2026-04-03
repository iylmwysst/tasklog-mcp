import path from "node:path";
import { promises as fs } from "node:fs";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";

import {
  getActiveContext,
  listWorks,
  readLogEntries,
  readWorkContext,
  readWorkRecords,
  resolveLogbookPaths,
  resumeWork,
  type LogbookPaths,
  type SessionLogEntry,
  type WorkRecord,
} from "../src/logbook.js";

const ARTIFACT_FILES = ["design.md", "plan.md", "spec.md", "summary.md", "notes.md"] as const;
const OPEN_WORK_PREVIEW_COUNT = 3;
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
  workIds: string[];
  manifestPath?: string;
  split?: "dev" | "holdout" | "stress";
  openDiscoveryMode?: "live" | "off";
  openDiscoveryModeExplicit: boolean;
  limit: number;
  json: boolean;
  outDir?: string;
  gradeIn?: string;
  keyIn?: string;
  tasklogSurface: "full" | "brief";
  tasklogSurfaceExplicit: boolean;
}

interface BenchmarkManifestCase {
  source: "current_work" | "legacy_log";
  source_id: string;
  benchmark_ready: boolean;
  include_in_benchmark?: boolean;
}

interface BenchmarkManifest {
  benchmark_now_work_ids?: string[];
  splits?: Partial<Record<"dev" | "holdout" | "stress", string[]>>;
  track_rules?: {
    primary_holdout?: "work_reentry_only" | "include_open_work_discovery";
    open_work_discovery?: "live_diagnostic_only_until_frozen_fixture_exists" | "include_in_primary_holdout";
    tasklog_primary_arm?: "full" | "brief" | "baseline" | "compact";
    latency_cost_model_metadata?: "external_runner_metadata" | "harness_managed";
  };
  cases?: BenchmarkManifestCase[];
}

interface SurfaceMetrics {
  bytes: number;
  lines: number;
  estTokens: number;
}

type ScenarioType = "open_discovery" | "work_reentry";

interface OpenDiscoveryAnswer {
  active_work_title: string;
  open_work_titles: string[];
  open_work_next_steps: string[];
}

interface WorkReentryAnswer {
  title: string;
  status: string;
  scope_paths: string[];
  latest_log_summary: string;
  next_step_summary: string;
  artifact_files: string[];
}

type ExpectedAnswer = OpenDiscoveryAnswer | WorkReentryAnswer;

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
  scenario_type: ScenarioType;
  title: string;
  prompt: string;
  answer_contract: Record<string, string>;
  variants: BlindVariant[];
}

interface ScenarioKey {
  scenario_id: string;
  scenario_type: ScenarioType;
  title: string;
  expected_answer: ExpectedAnswer;
  variants: AnswerKeyVariant[];
}

interface BenchmarkPack {
  benchmark_type: "llm_reentry_understanding";
  project_root: string;
  notes: string[];
  scenarios: ScenarioPack[];
}

interface BenchmarkKey {
  benchmark_type: "llm_reentry_understanding";
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

function fieldHasExpectedValue(score: FieldScore): boolean {
  return normalizeForMatch(score.expected).length > 0;
}

function parseArgs(argv: string[]): CliOptions {
  const workIds: string[] = [];
  let projectRoot = process.cwd();
  let manifestPath: string | undefined;
  let split: "dev" | "holdout" | "stress" | undefined;
  let openDiscoveryMode: "live" | "off" | undefined;
  let limit = 10;
  let json = false;
  let outDir: string | undefined;
  let gradeIn: string | undefined;
  let keyIn: string | undefined;
  let tasklogSurface: "full" | "brief" = "brief";
  let openDiscoveryModeExplicit = false;
  let tasklogSurfaceExplicit = false;

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current === "--project-root") {
      projectRoot = argv[index + 1] ?? projectRoot;
      index += 1;
      continue;
    }
    if (current === "--work-id") {
      const workId = argv[index + 1];
      if (workId) {
        workIds.push(workId);
      }
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
    if (current === "--open-discovery-mode") {
      const candidate = argv[index + 1];
      if (candidate === "live" || candidate === "off") {
        openDiscoveryMode = candidate;
        openDiscoveryModeExplicit = true;
      }
      index += 1;
      continue;
    }
    if (current === "--limit") {
      const parsed = Number.parseInt(argv[index + 1] ?? "", 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        limit = parsed;
      }
      index += 1;
      continue;
    }
    if (current === "--out-dir") {
      const candidatePath = argv[index + 1];
      if (candidatePath) {
        outDir = candidatePath;
      }
      index += 1;
      continue;
    }
    if (current === "--grade-in") {
      const candidatePath = argv[index + 1];
      if (candidatePath) {
        gradeIn = candidatePath;
      }
      index += 1;
      continue;
    }
    if (current === "--key-in") {
      const candidatePath = argv[index + 1];
      if (candidatePath) {
        keyIn = candidatePath;
      }
      index += 1;
      continue;
    }
    if (current === "--tasklog-surface") {
      const candidate = argv[index + 1];
      if (candidate === "full" || candidate === "brief") {
        tasklogSurface = candidate;
        tasklogSurfaceExplicit = true;
      }
      index += 1;
      continue;
    }
    if (current === "--tasklog-mode") {
      const candidate = argv[index + 1];
      if (candidate === "baseline") {
        tasklogSurface = "full";
        tasklogSurfaceExplicit = true;
      } else if (candidate === "compact") {
        tasklogSurface = "brief";
        tasklogSurfaceExplicit = true;
      }
      index += 1;
      continue;
    }
    if (current === "--json") {
      json = true;
    }
  }

  return {
    projectRoot: path.resolve(projectRoot),
    workIds,
    manifestPath: manifestPath ? path.resolve(manifestPath) : undefined,
    split,
    openDiscoveryMode: openDiscoveryMode ?? (split === "holdout" ? "off" : "live"),
    openDiscoveryModeExplicit,
    limit,
    json,
    outDir: outDir ? path.resolve(outDir) : undefined,
    gradeIn: gradeIn ? path.resolve(gradeIn) : undefined,
    keyIn: keyIn ? path.resolve(keyIn) : undefined,
    tasklogSurface,
    tasklogSurfaceExplicit,
  };
}

function metricFromText(text: string): SurfaceMetrics {
  const bytes = Buffer.byteLength(text, "utf8");
  return {
    bytes,
    lines: text.length === 0 ? 0 : text.split(/\r?\n/).length,
    estTokens: Math.ceil(bytes / 4),
  };
}

async function readTextFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, "utf8");
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  return JSON.parse(await readTextFile(filePath)) as T;
}

function normalizeForMatch(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

function normalizeOptional(value: string | undefined): string {
  return value ?? "";
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

async function optionalExcerpt(filePath: string, maxChars = 800): Promise<string | null> {
  try {
    const content = await readTextFile(filePath);
    return content.slice(0, maxChars);
  } catch {
    return null;
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

async function noContinuityWorkspaceText(projectRoot: string): Promise<string> {
  const topEntries = await fs.readdir(projectRoot, { withFileTypes: true });
  const repoCandidates = topEntries
    .filter((entry) => entry.isDirectory() && !NO_CONTINUITY_SKIP_NAMES.has(entry.name))
    .map((entry) => path.join(projectRoot, entry.name));

  const reposWithGit = (
    await Promise.all(repoCandidates.map(async (candidate) => {
      const gitDir = path.join(candidate, ".git");
      return (await pathExists(gitDir)) ? candidate : null;
    }))
  ).filter((candidate): candidate is string => candidate !== null);

  const repoSections = await Promise.all(reposWithGit.map(async (repoRoot) => {
    const status = await gitStatusShort(repoRoot);
    const tree = await sampleDirectoryTree(repoRoot, 1, 20);
    return [
      `REPO: ${repoRoot}`,
      `GIT_STATUS_SHORT:\n${status}`,
      `TREE_SAMPLE:\n${tree.join("\n")}`,
    ].join("\n");
  }));

  return [
    `PROJECT_ROOT: ${projectRoot}`,
    `TOP_LEVEL_ENTRIES:\n${topEntries
      .filter((entry) => !NO_CONTINUITY_SKIP_NAMES.has(entry.name))
      .map((entry) => `${entry.isDirectory() ? "dir" : "file"}:${entry.name}`)
      .join("\n")}`,
    ...repoSections,
  ].join("\n\n");
}

async function noContinuityWorkText(projectRoot: string, work: WorkRecord): Promise<string> {
  const sections = await Promise.all(work.scope_paths.map(async (scopePath) => {
    const repoRoot = await findRepoRoot(scopePath, projectRoot);
    const tree = await sampleDirectoryTree(scopePath, 2, 30);
    const status = repoRoot ? await gitStatusShort(repoRoot) : "(no git repo found)";
    const manifestPaths = repoRoot
      ? [path.join(repoRoot, "Cargo.toml"), path.join(repoRoot, "package.json"), path.join(repoRoot, "README.md")]
      : [];
    const manifestExcerpts = (
      await Promise.all(manifestPaths.map(async (manifestPath) => {
        const excerpt = await optionalExcerpt(manifestPath);
        if (!excerpt) {
          return null;
        }
        return `FILE: ${manifestPath}\n${excerpt}`;
      }))
    ).filter((entry): entry is string => entry !== null);

    return [
      `SCOPE_PATH: ${scopePath}`,
      `REPO_ROOT: ${repoRoot ?? "(none)"}`,
      `GIT_STATUS_SHORT:\n${status}`,
      `TREE_SAMPLE:\n${tree.join("\n")}`,
      ...(manifestExcerpts.length > 0 ? [`MANIFEST_EXCERPTS:\n${manifestExcerpts.join("\n\n")}`] : []),
    ].join("\n");
  }));

  return sections.join("\n\n");
}

async function loadRawFiles(filePaths: string[]): Promise<string> {
  const texts = await Promise.all(filePaths.map(async (filePath) => {
    const text = await readTextFile(filePath);
    return `FILE: ${filePath}\n${text}`;
  }));
  return texts.join("\n");
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

function buildOpenWorksRaw(works: WorkRecord[], logs: SessionLogEntry[], limit: number): WorkRecord[] {
  return works
    .filter((work) => work.status === "active" || work.status === "blocked")
    .sort((left, right) => right.updated_at.localeCompare(left.updated_at))
    .slice(0, limit);
}

function buildOpenDiscoveryTasklogPayload(
  activeContext: Awaited<ReturnType<typeof getActiveContext>>,
  works: Awaited<ReturnType<typeof listWorks>>,
): string {
  return JSON.stringify({
    active_work_title: activeContext.active_work?.title ?? "",
    active_work_freshness: activeContext.freshness ?? "",
    open_work_preview: works.map((work) => ({
      title: work.title,
      status: work.status,
      next_step_summary: work.next_step_summary ?? "",
      last_log_summary: work.last_log_summary ?? "",
      context_mode: work.context_mode,
    })),
  }, null, 2);
}

function buildWorkReentryTasklogPayload(
  activeContext: Awaited<ReturnType<typeof resumeWork>>,
  workContext: Awaited<ReturnType<typeof readWorkContext>>,
): string {
  const brief = workContext.reentry_brief ?? {
    title: workContext.work.title,
    status: workContext.work.status,
    scope_paths: workContext.work.scope_paths,
    latest_log_summary: workContext.recent_logs[0]?.summary ?? "",
    next_step_summary: workContext.next_step_summary ?? "",
    artifact_files: [],
  };

  return JSON.stringify({
    active_work_title: activeContext.active_work?.title ?? "",
    context_mode: workContext.context_mode,
    reentry_brief: brief,
  }, null, 2);
}

function buildOpenDiscoveryRawJsonNormalizedPayload(
  activeWork: WorkRecord | undefined,
  openWorks: WorkRecord[],
  logs: SessionLogEntry[],
): string {
  return JSON.stringify({
    active_work: activeWork
      ? {
          work_id: activeWork.work_id,
          title: activeWork.title,
          status: activeWork.status,
        }
      : null,
    open_work_preview: openWorks.map((work) => {
      const logsForWork = logs.filter((entry) => entry.work_id === work.work_id);
      return {
        work_id: work.work_id,
        title: work.title,
        status: work.status,
        next_step_summary: normalizeOptional(latestNextStep(logsForWork)),
        last_log_summary: normalizeOptional(latestLog(logsForWork)?.summary),
      };
    }),
  }, null, 2);
}

function buildWorkReentryRawJsonNormalizedPayload(
  work: WorkRecord,
  logsForWork: SessionLogEntry[],
  artifactPaths: string[],
): string {
  return JSON.stringify({
    work: {
      work_id: work.work_id,
      title: work.title,
      status: work.status,
      scope_paths: work.scope_paths,
    },
    latest_log_summary: normalizeOptional(latestLog(logsForWork)?.summary),
    next_step_summary: normalizeOptional(latestNextStep(logsForWork)),
    artifact_files: artifactPaths.map((artifactPath) => path.basename(artifactPath)),
  }, null, 2);
}

async function buildOpenDiscoveryGroundTruth(paths: LogbookPaths, limit: number): Promise<OpenDiscoveryAnswer> {
  const [activeContextRecord, works, logs] = await Promise.all([
    readJsonFile<{ active_work_id?: string }>(paths.activeContextPath).catch(() => ({})),
    readWorkRecords(paths),
    readLogEntries(paths),
  ]);
  const openWorks = buildOpenWorksRaw(works, logs, limit);
  const activeWork = works.find((work) => work.work_id === activeContextRecord.active_work_id);
  const preview = openWorks.slice(0, Math.min(OPEN_WORK_PREVIEW_COUNT, openWorks.length));

  return {
    active_work_title: activeWork?.title ?? "",
    open_work_titles: preview.map((work) => work.title),
    open_work_next_steps: preview
      .map((work) => normalizeOptional(latestNextStep(logs.filter((entry) => entry.work_id === work.work_id))))
      .filter((entry) => entry.length > 0),
  };
}

async function buildOpenDiscoveryVariants(paths: LogbookPaths, limit: number, tasklogSurface: CliOptions["tasklogSurface"]): Promise<StrategyVariant[]> {
  const notebookPayload = await loadRawFiles([paths.markdownPath]);
  const jsonPayload = await loadRawFiles([paths.activeContextPath, paths.worksPath, paths.jsonPath]);
  const noContinuityPayload = await noContinuityWorkspaceText(paths.projectRoot);
  const [activeContext, works, activeContextRecord, allWorks, logs] = await Promise.all([
    getActiveContext(paths),
    listWorks(paths, { status: "open", limit }),
    readJsonFile<{ active_work_id?: string }>(paths.activeContextPath).catch(() => ({})),
    readWorkRecords(paths),
    readLogEntries(paths),
  ]);
  const openWorks = buildOpenWorksRaw(allWorks, logs, limit);
  const activeWork = allWorks.find((work) => work.work_id === activeContextRecord.active_work_id);
  const tasklogPayload = tasklogSurface === "brief"
    ? buildOpenDiscoveryTasklogPayload(activeContext, works)
    : JSON.stringify({ activeContext, works }, null, 2);
  const jsonNormalizedPayload = buildOpenDiscoveryRawJsonNormalizedPayload(activeWork, openWorks, logs);

  return [
    { strategy: "no_continuity_workspace_scan", payload: noContinuityPayload, metrics: metricFromText(noContinuityPayload) },
    { strategy: "markdown_notebook_scan", payload: notebookPayload, metrics: metricFromText(notebookPayload) },
    { strategy: "json_state_scan", payload: jsonPayload, metrics: metricFromText(jsonPayload) },
    { strategy: "json_state_normalized_scan", payload: jsonNormalizedPayload, metrics: metricFromText(jsonNormalizedPayload) },
    { strategy: "tasklog_get_active_plus_list_works", payload: tasklogPayload, metrics: metricFromText(tasklogPayload) },
  ];
}

async function withActiveContextRestored<T>(paths: LogbookPaths, fn: () => Promise<T>): Promise<T> {
  let original: string | undefined;
  try {
    original = await readTextFile(paths.activeContextPath);
  } catch {
    original = undefined;
  }

  try {
    return await fn();
  } finally {
    if (original === undefined) {
      await fs.rm(paths.activeContextPath, { force: true });
    } else {
      await fs.writeFile(paths.activeContextPath, original, "utf8");
    }
  }
}

async function buildWorkReentryGroundTruth(paths: LogbookPaths, work: WorkRecord): Promise<WorkReentryAnswer> {
  const logs = await readLogEntries(paths);
  const logsForWork = logs.filter((entry) => entry.work_id === work.work_id);
  const artifactPaths = await existingArtifactFilePaths(paths, work);
  return {
    title: work.title,
    status: work.status,
    scope_paths: work.scope_paths,
    latest_log_summary: normalizeOptional(latestLog(logsForWork)?.summary),
    next_step_summary: normalizeOptional(latestNextStep(logsForWork)),
    artifact_files: artifactPaths.map((artifactPath) => path.basename(artifactPath)),
  };
}

async function buildWorkReentryVariants(
  paths: LogbookPaths,
  work: WorkRecord,
  tasklogSurface: CliOptions["tasklogSurface"],
): Promise<StrategyVariant[]> {
  const artifactPaths = await existingArtifactFilePaths(paths, work);
  const logs = await readLogEntries(paths);
  const logsForWork = logs.filter((entry) => entry.work_id === work.work_id);
  const notebookPayload = await loadRawFiles([paths.markdownPath, ...artifactPaths]);
  const jsonPayload = await loadRawFiles([paths.worksPath, paths.jsonPath, ...artifactPaths]);
  const jsonNormalizedPayload = buildWorkReentryRawJsonNormalizedPayload(work, logsForWork, artifactPaths);
  const noContinuityPayload = await noContinuityWorkText(paths.projectRoot, work);
  const tasklogPayload = await withActiveContextRestored(paths, async () => {
    const [activeContext, workContext] = await Promise.all([
      resumeWork(paths, { work_id: work.work_id }),
      readWorkContext(paths, work.work_id, { surface: tasklogSurface }),
    ]);
    return tasklogSurface === "brief"
      ? buildWorkReentryTasklogPayload(activeContext, workContext)
      : JSON.stringify({ activeContext, workContext }, null, 2);
  });

  return [
    { strategy: "no_continuity_scope_scan", payload: noContinuityPayload, metrics: metricFromText(noContinuityPayload) },
    { strategy: "markdown_notebook_scan", payload: notebookPayload, metrics: metricFromText(notebookPayload) },
    { strategy: "json_state_scan", payload: jsonPayload, metrics: metricFromText(jsonPayload) },
    { strategy: "json_state_normalized_scan", payload: jsonNormalizedPayload, metrics: metricFromText(jsonNormalizedPayload) },
    { strategy: "tasklog_resume_plus_read_work_context", payload: tasklogPayload, metrics: metricFromText(tasklogPayload) },
  ];
}

function stableHash(text: string): number {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function blindVariants(scenarioId: string, variants: StrategyVariant[]): { publicVariants: BlindVariant[]; keyVariants: AnswerKeyVariant[] } {
  const entries = [...variants];
  entries.sort((left, right) => {
    const leftHash = stableHash(`${scenarioId}:${left.strategy}`);
    const rightHash = stableHash(`${scenarioId}:${right.strategy}`);
    return leftHash - rightHash;
  });

  const labels = ["A", "B", "C", "D", "E", "F"];
  return {
    publicVariants: entries.map((variant, index) => ({
      label: labels[index] ?? `V${index + 1}`,
      payload: variant.payload,
    })),
    keyVariants: entries.map((variant, index) => ({
      label: labels[index] ?? `V${index + 1}`,
      strategy: variant.strategy,
      metrics: variant.metrics,
    })),
  };
}

function openDiscoveryPrompt(): string {
  return [
    "You are resuming work in a coding workspace.",
    "Based only on the provided payload, answer in strict JSON.",
    "Do not guess. If a field is unknown, return an empty string or an empty array.",
    "Copy titles and summaries from the evidence when possible.",
    "",
    "Return this JSON shape:",
    "{",
    '  "active_work_title": "",',
    '  "open_work_titles": [],',
    '  "open_work_next_steps": []',
    "}",
  ].join("\n");
}

function workReentryPrompt(): string {
  return [
    "You are resuming one system task in a coding workspace.",
    "Based only on the provided payload, answer in strict JSON.",
    "Do not guess. If a field is unknown, return an empty string or an empty array.",
    "Copy titles, summaries, paths, and artifact names from the evidence when possible.",
    "",
    "Return this JSON shape:",
    "{",
    '  "title": "",',
    '  "status": "",',
    '  "scope_paths": [],',
    '  "latest_log_summary": "",',
    '  "next_step_summary": "",',
    '  "artifact_files": []',
    "}",
  ].join("\n");
}

function openDiscoveryContract(): Record<string, string> {
  return {
    active_work_title: "string",
    open_work_titles: "string[]",
    open_work_next_steps: "string[]",
  };
}

function workReentryContract(): Record<string, string> {
  return {
    title: "string",
    status: "string",
    scope_paths: "string[]",
    latest_log_summary: "string",
    next_step_summary: "string",
    artifact_files: "string[]",
  };
}

async function resolveTargetWorks(paths: LogbookPaths, requestedWorkIds: string[]): Promise<WorkRecord[]> {
  const works = await readWorkRecords(paths);
  if (requestedWorkIds.length > 0) {
    return requestedWorkIds.map((workId) => {
      const match = works.find((work) => work.work_id === workId);
      if (!match) {
        throw new Error(`Unknown work_id: ${workId}`);
      }
      return match;
    });
  }

  const logs = await readLogEntries(paths);
  const ranked = await Promise.all(
    works.map(async (work) => {
      const artifactCount = (await existingArtifactFilePaths(paths, work)).length;
      const logCount = logs.filter((entry) => entry.work_id === work.work_id).length;
      const statusBonus = work.status === "active" ? 25 : work.status === "blocked" ? 10 : 0;
      return { work, score: artifactCount * 100 + logCount * 10 + statusBonus };
    }),
  );

  ranked.sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }
    return right.work.updated_at.localeCompare(left.work.updated_at);
  });

  return ranked.slice(0, 1).map((item) => item.work);
}

async function loadBenchmarkManifest(manifestPath: string): Promise<BenchmarkManifest> {
  return readJsonFile<BenchmarkManifest>(manifestPath);
}

function manifestWorkIds(
  manifest: BenchmarkManifest,
  split?: "dev" | "holdout" | "stress",
): string[] {
  if (split && manifest.splits?.[split] && manifest.splits[split]!.length > 0) {
    return manifest.splits[split]!;
  }
  if (manifest.benchmark_now_work_ids && manifest.benchmark_now_work_ids.length > 0) {
    return manifest.benchmark_now_work_ids;
  }

  return (manifest.cases ?? [])
    .filter((entry) => entry.source === "current_work" && entry.benchmark_ready && entry.include_in_benchmark)
    .map((entry) => entry.source_id);
}

function normalizeTasklogSurface(surface?: "full" | "brief" | "baseline" | "compact"): "full" | "brief" {
  if (surface === "baseline") {
    return "full";
  }
  if (surface === "compact") {
    return "brief";
  }
  return surface ?? "brief";
}

function resolveTasklogSurface(options: CliOptions, manifest?: BenchmarkManifest): "full" | "brief" {
  if (options.tasklogSurfaceExplicit) {
    return options.tasklogSurface;
  }

  return normalizeTasklogSurface(manifest?.track_rules?.tasklog_primary_arm) ?? options.tasklogSurface;
}

function resolveOpenDiscoveryMode(options: CliOptions, manifest?: BenchmarkManifest): "live" | "off" {
  if (options.openDiscoveryModeExplicit && options.openDiscoveryMode) {
    return options.openDiscoveryMode;
  }

  const primaryHoldoutRule = manifest?.track_rules?.primary_holdout;
  const openDiscoveryRule = manifest?.track_rules?.open_work_discovery;

  if (
    options.split === "holdout" &&
    (primaryHoldoutRule === "work_reentry_only" ||
      openDiscoveryRule === "live_diagnostic_only_until_frozen_fixture_exists")
  ) {
    return "off";
  }

  if (
    options.split === "holdout" &&
    (primaryHoldoutRule === "include_open_work_discovery" ||
      openDiscoveryRule === "include_in_primary_holdout")
  ) {
    return "live";
  }

  return options.openDiscoveryMode ?? "live";
}

async function buildPack(options: CliOptions): Promise<{ pack: BenchmarkPack; key: BenchmarkKey }> {
  const paths = resolveLogbookPaths(options.projectRoot);
  const manifest = options.manifestPath ? await loadBenchmarkManifest(options.manifestPath) : undefined;
  const effectiveTasklogSurface = resolveTasklogSurface(options, manifest);
  const effectiveOpenDiscoveryMode = resolveOpenDiscoveryMode(options, manifest);
  const targetWorkIds = options.workIds.length > 0
    ? options.workIds
    : manifest
      ? manifestWorkIds(manifest, options.split)
      : [];
  const works = await resolveTargetWorks(paths, targetWorkIds);

  const packScenarios: ScenarioPack[] = [];
  const keyScenarios: ScenarioKey[] = [];

  if (effectiveOpenDiscoveryMode !== "off") {
    const openExpected = await buildOpenDiscoveryGroundTruth(paths, options.limit);
    const openVariants = await buildOpenDiscoveryVariants(paths, options.limit, effectiveTasklogSurface);
    const openBlinded = blindVariants("open-work-discovery", openVariants);
    packScenarios.push({
      scenario_id: "open-work-discovery",
      scenario_type: "open_discovery",
      title: "Open Work Discovery",
      prompt: openDiscoveryPrompt(),
      answer_contract: openDiscoveryContract(),
      variants: openBlinded.publicVariants,
    });
    keyScenarios.push({
      scenario_id: "open-work-discovery",
      scenario_type: "open_discovery",
      title: "Open Work Discovery",
      expected_answer: openExpected,
      variants: openBlinded.keyVariants,
    });
  }

  for (const work of works) {
    const scenarioId = `work-reentry-${work.work_id}`;
    const expected = await buildWorkReentryGroundTruth(paths, work);
    const variants = await buildWorkReentryVariants(paths, work, effectiveTasklogSurface);
    const blinded = blindVariants(scenarioId, variants);
    packScenarios.push({
      scenario_id: scenarioId,
      scenario_type: "work_reentry",
      title: `Work Re-entry (${work.title})`,
      prompt: workReentryPrompt(),
      answer_contract: workReentryContract(),
      variants: blinded.publicVariants,
    });
    keyScenarios.push({
      scenario_id: scenarioId,
      scenario_type: "work_reentry",
      title: `Work Re-entry (${work.title})`,
      expected_answer: expected,
      variants: blinded.keyVariants,
    });
  }

  return {
    pack: {
      benchmark_type: "llm_reentry_understanding",
      project_root: options.projectRoot,
      notes: [
        "This pack measures re-entry understanding, not end-to-end unfinished-task continuation.",
        "Every strategy answers the same JSON question per scenario.",
        "The pack is blinded per scenario so variant labels do not reveal which path is being tested.",
        "Models should leave unknown fields blank instead of guessing.",
        "Raw JSON includes both raw and generic-normalized baselines so Tasklog is not the only strategy allowed to shape evidence.",
        effectiveTasklogSurface === "brief"
          ? "Tasklog workflow primary arm uses the Brief re-entry surface."
          : "Tasklog workflow uses the Full work-context surface for ablation/debugging.",
        effectiveOpenDiscoveryMode === "off"
          ? "Open-work discovery is omitted in this pack so the primary holdout remains work-reentry only."
          : "Open-work discovery is included as a live diagnostic track tied to the current workspace state.",
      ],
      scenarios: packScenarios,
    },
    key: {
      benchmark_type: "llm_reentry_understanding",
      project_root: options.projectRoot,
      notes: [
        "Use this answer key only for grading, not for the live prompt shown to the model.",
      ],
      scenarios: keyScenarios,
    },
  };
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function stringListValue(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
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

function normalizeList(values: string[]): string[] {
  return [...values].map((value) => normalizeForMatch(value)).filter((value) => value.length > 0).sort();
}

function normalizeListForField(field: string, values: string[]): string[] {
  const prepared = field === "artifact_files"
    ? values.map((value) => path.basename(value))
    : values;
  return normalizeList(prepared);
}

function gradeListField(field: string, expected: string[], actual: string[]): FieldScore {
  const normalizedExpected = normalizeListForField(field, expected);
  const normalizedActual = normalizeListForField(field, actual);
  if (normalizedExpected.length === 0 && normalizedActual.length === 0) {
    return { field, expected: expected.join(" | "), actual: actual.join(" | "), outcome: "correct" };
  }
  if (normalizedExpected.length === 0 && normalizedActual.length > 0) {
    return { field, expected: expected.join(" | "), actual: actual.join(" | "), outcome: "hallucinated" };
  }
  if (normalizedExpected.length > 0 && normalizedActual.length === 0) {
    return { field, expected: expected.join(" | "), actual: actual.join(" | "), outcome: "abstained" };
  }
  const sameLength = normalizedExpected.length === normalizedActual.length;
  const sameValues = sameLength && normalizedExpected.every((value, index) => value === normalizedActual[index]);
  return {
    field,
    expected: expected.join(" | "),
    actual: actual.join(" | "),
    outcome: sameValues ? "correct" : "wrong",
  };
}

function gradeAnswer(expected: ExpectedAnswer, actual: Record<string, unknown>, scenarioType: ScenarioType): FieldScore[] {
  if (scenarioType === "open_discovery") {
    const typedExpected = expected as OpenDiscoveryAnswer;
    return [
      gradeScalarField("active_work_title", typedExpected.active_work_title, stringValue(actual.active_work_title)),
      gradeListField("open_work_titles", typedExpected.open_work_titles, stringListValue(actual.open_work_titles)),
      gradeListField("open_work_next_steps", typedExpected.open_work_next_steps, stringListValue(actual.open_work_next_steps)),
    ];
  }

  const typedExpected = expected as WorkReentryAnswer;
  return [
    gradeScalarField("title", typedExpected.title, stringValue(actual.title)),
    gradeScalarField("status", typedExpected.status, stringValue(actual.status)),
    gradeListField("scope_paths", typedExpected.scope_paths, stringListValue(actual.scope_paths)),
    gradeScalarField("latest_log_summary", typedExpected.latest_log_summary, stringValue(actual.latest_log_summary)),
    gradeScalarField("next_step_summary", typedExpected.next_step_summary, stringValue(actual.next_step_summary)),
    gradeListField("artifact_files", typedExpected.artifact_files, stringListValue(actual.artifact_files)),
  ];
}

function aggregateGrades(graded: Array<{ scenario_id: string; strategy: string; fieldScores: FieldScore[] }>) {
  const byStrategy = new Map<string, Array<{ scenario_id: string; fieldScores: FieldScore[] }>>();
  for (const item of graded) {
    const existing = byStrategy.get(item.strategy) ?? [];
    existing.push({ scenario_id: item.scenario_id, fieldScores: item.fieldScores });
    byStrategy.set(item.strategy, existing);
  }

  return [...byStrategy.entries()].map(([strategy, entries]) => {
    const scores = entries.flatMap((entry) => entry.fieldScores);
    const correct = scores.filter((score) => score.outcome === "correct").length;
    const wrong = scores.filter((score) => score.outcome === "wrong").length;
    const abstained = scores.filter((score) => score.outcome === "abstained").length;
    const hallucinated = scores.filter((score) => score.outcome === "hallucinated").length;
    const supportedScores = scores.filter(fieldHasExpectedValue);
    const unsupportedScores = scores.filter((score) => !fieldHasExpectedValue(score));
    const recoveredSupported = supportedScores.filter((score) => score.outcome === "correct").length;
    const strictScenarioSuccess = entries.filter((entry) => entry.fieldScores.every((score) => score.outcome === "correct")).length;
    return {
      strategy,
      scenario_total: entries.length,
      strict_scenario_success_total: strictScenarioSuccess,
      strict_scenario_success_percent: entries.length > 0 ? (strictScenarioSuccess / entries.length) * 100 : 0,
      fields_total: scores.length,
      supported_fields_total: supportedScores.length,
      unsupported_fields_total: unsupportedScores.length,
      correct,
      wrong,
      abstained,
      hallucinated,
      field_accuracy_percent: scores.length > 0 ? (correct / scores.length) * 100 : 0,
      hallucination_rate_percent: unsupportedScores.length > 0
        ? (hallucinated / unsupportedScores.length) * 100
        : 0,
      supported_field_recall_percent: supportedScores.length > 0
        ? (recoveredSupported / supportedScores.length) * 100
        : 100,
    };
  }).sort((left, right) => right.supported_field_recall_percent - left.supported_field_recall_percent);
}

async function writePackFiles(outDir: string, pack: BenchmarkPack, key: BenchmarkKey): Promise<void> {
  await fs.mkdir(outDir, { recursive: true });
  const packPath = path.join(outDir, "llm-reentry-pack.json");
  const keyPath = path.join(outDir, "llm-reentry-answer-key.json");
  const templatePath = path.join(outDir, "llm-reentry-answer-template.json");

  await fs.writeFile(packPath, JSON.stringify(pack, null, 2), "utf8");
  await fs.writeFile(keyPath, JSON.stringify(key, null, 2), "utf8");
  await fs.writeFile(
    templatePath,
    JSON.stringify({
      responses: pack.scenarios.flatMap((scenario) =>
        scenario.variants.map((variant) => ({
          scenario_id: scenario.scenario_id,
          variant_label: variant.label,
          answer: {},
        }))),
    }, null, 2),
    "utf8",
  );
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

async function gradeAnswerSheet(answerPath: string, key: BenchmarkKey) {
  const sheet = await readJsonFile<AnswerSheet>(answerPath);
  validateAnswerSheetRows(sheet, key);
  const graded: Array<{ scenario_id: string; variant_label: string; strategy: string; fieldScores: FieldScore[] }> = [];

  for (const response of sheet.responses) {
    const scenario = key.scenarios.find((entry) => entry.scenario_id === response.scenario_id);
    if (!scenario) {
      throw new Error(`Unknown scenario in answer sheet: ${response.scenario_id}`);
    }
    const variant = scenario.variants.find((entry) => entry.label === response.variant_label);
    if (!variant) {
      throw new Error(`Unknown variant for ${response.scenario_id}: ${response.variant_label}`);
    }
    graded.push({
      scenario_id: response.scenario_id,
      variant_label: response.variant_label,
      strategy: variant.strategy,
      fieldScores: gradeAnswer(scenario.expected_answer, response.answer, scenario.scenario_type),
    });
  }

  return {
    graded_responses: graded.map((entry) => ({
      scenario_id: entry.scenario_id,
      variant_label: entry.variant_label,
      strategy: entry.strategy,
      field_scores: entry.fieldScores,
    })),
    aggregate: aggregateGrades(graded.map((entry) => ({
      scenario_id: entry.scenario_id,
      strategy: entry.strategy,
      fieldScores: entry.fieldScores,
    }))),
  };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  if (options.gradeIn) {
    const keyPath = await resolveKeyPath(options.gradeIn, options.keyIn, "llm-reentry-answer-key.json");
    const key = await readJsonFile<BenchmarkKey>(keyPath);
    const graded = await gradeAnswerSheet(options.gradeIn, key);
    console.log(JSON.stringify({
      key_path: keyPath,
      ...graded,
    }, null, 2));
    return;
  }

  const { pack, key } = await buildPack(options);

  if (options.outDir) {
    await writePackFiles(options.outDir, pack, key);
  }

  if (options.json || !options.outDir) {
    console.log(JSON.stringify({ pack, key }, null, 2));
    return;
  }

  console.log(JSON.stringify({
    out_dir: options.outDir,
    scenario_count: pack.scenarios.length,
    notes: pack.notes,
    files: [
      path.join(options.outDir, "llm-reentry-pack.json"),
      path.join(options.outDir, "llm-reentry-answer-key.json"),
      path.join(options.outDir, "llm-reentry-answer-template.json"),
    ],
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
