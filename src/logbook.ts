import { randomBytes, randomUUID } from "node:crypto";
import { access, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Logger } from "./logger.js";

export const APPENDABLE_LOG_STATUSES = ["WIP", "Done", "Blocked"] as const;
export const LOG_STATUSES = [...APPENDABLE_LOG_STATUSES, "Superseded"] as const;
export const CHANGE_TYPES = [
  "feature",
  "bugfix",
  "refactor",
  "investigation",
  "docs",
  "test",
  "config",
] as const;
export const WORK_STATUSES = ["active", "blocked", "done"] as const;
export const WORK_IMPACTS = ["low", "medium", "high", "critical"] as const;
export const ACTIVE_WORK_FRESHNESS = ["fresh", "stale", "invalid"] as const;
export const WORK_CONTEXT_MODES = ["active", "closed/raw", "closed/consolidated"] as const;

const WORK_LIST_FILTERS = ["open", "active", "blocked", "done", "all"] as const;
const WORK_LIST_SORT_FIELDS = ["updated_at", "impact"] as const;
const WORK_LIST_SORT_ORDERS = ["desc", "asc"] as const;
const WORKDOC_FILENAMES = {
  design: "design.md",
  plan: "plan.md",
  spec: "spec.md",
  summary: "summary.md",
  notes: "notes.md",
} as const;

export type AppendableLogStatus = (typeof APPENDABLE_LOG_STATUSES)[number];
export type LogStatus = (typeof LOG_STATUSES)[number];
export type ChangeType = (typeof CHANGE_TYPES)[number];
export type WorkStatus = (typeof WORK_STATUSES)[number];
export type WorkImpact = (typeof WORK_IMPACTS)[number];
export type ActiveWorkFreshness = (typeof ACTIVE_WORK_FRESHNESS)[number];
export type WorkContextMode = (typeof WORK_CONTEXT_MODES)[number];
export type WorkListFilter = (typeof WORK_LIST_FILTERS)[number];
export type WorkListSortField = (typeof WORK_LIST_SORT_FIELDS)[number];
export type WorkListSortOrder = (typeof WORK_LIST_SORT_ORDERS)[number];
export type WorkDocType = keyof typeof WORKDOC_FILENAMES;

export interface SessionLogEntry extends Record<string, unknown> {
  id: string;
  work_id?: string;
  timestamp: string;
  summary: string;
  status: LogStatus;
  change_type: ChangeType;
  affected_files: string[];
  tags?: string[];
  next_steps?: string;
  blockers?: string;
  related_log_ids?: string[];
  supersedes_log_id?: string;
  revision: number;
  created_at: string;
  updated_at: string;
}

export interface WorkRecord extends Record<string, unknown> {
  work_id: string;
  title: string;
  slug: string;
  status: WorkStatus;
  impact?: WorkImpact;
  start_dir: string;
  scope_paths: string[];
  summary?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface WorkArtifactAvailability extends Record<string, unknown> {
  design: boolean;
  plan: boolean;
  spec: boolean;
  summary: boolean;
  notes: boolean;
}

export interface WorkArtifactPaths extends Record<string, unknown> {
  workDir: string;
  designPath: string;
  planPath: string;
  specPath: string;
  summaryPath: string;
  notesPath: string;
}

export interface WorkListEntry extends WorkRecord {
  artifact_availability: WorkArtifactAvailability;
  context_mode: WorkContextMode;
  last_log_summary?: string;
  next_step_summary?: string;
  recent_log_id?: string;
}

export interface ReentryBrief extends Record<string, unknown> {
  title: string;
  status: string;
  scope_paths: string[];
  latest_log_summary: string;
  next_step_summary: string;
  artifact_files: string[];
}

export interface WorkContextSummary extends Record<string, unknown> {
  work: WorkRecord;
  artifact_paths: WorkArtifactPaths;
  artifact_availability: WorkArtifactAvailability;
  context_mode: WorkContextMode;
  recent_logs: SessionLogEntry[];
  recent_log_count: number;
  next_step_summary?: string;
  summary_text?: string;
  reentry_brief?: ReentryBrief;
}

export interface ActiveContextRecord extends Record<string, unknown> {
  active_work_id?: string;
  project_root: string;
  updated_at?: string;
}

export interface ActiveContextSummary extends ActiveContextRecord {
  state_root: string;
  workdocs_root: string;
  json_path: string;
  markdown_path: string;
  active_work?: WorkRecord;
  freshness?: ActiveWorkFreshness;
}

export interface StartWorkInput {
  title: string;
  summary?: string;
  tags?: string[];
  impact?: WorkImpact;
  start_dir?: string;
  scope_paths?: string[];
}

export interface ListWorksInput {
  status?: WorkListFilter;
  query?: string;
  tag?: string;
  impact?: WorkImpact;
  sort_by?: WorkListSortField;
  sort_order?: WorkListSortOrder;
  limit?: number;
}

export interface AppendSessionLogInput {
  summary: string;
  status: AppendableLogStatus;
  change_type: ChangeType;
  affected_files: string[];
  tags?: string[];
  next_steps?: string;
  blockers?: string;
  related_log_ids?: string[];
  supersedes_log_id?: string;
  work_id?: string;
}

export interface AmendLogMetadataInput {
  affected_files?: string[];
  tags?: string[];
  next_steps?: string;
  blockers?: string;
}

export interface GetRecentLogsOptions {
  work_id?: string;
  project_wide?: boolean;
}

export interface ReadWorkContextOptions {
  include_summary?: boolean;
  include_recent_logs?: boolean;
  // Internal-only experimental re-entry surface. Keep this off the public MCP tool
  // schema until the product flow is ready for agents to choose it intentionally.
  compact?: boolean;
}

export interface CreateWorkDocResult extends Record<string, unknown> {
  work: WorkRecord;
  path: string;
  created: boolean;
  target_paths?: string[];
}

export interface AppendWorkNoteResult extends Record<string, unknown> {
  work: WorkRecord;
  path: string;
  created: boolean;
}

export interface LogbookPaths {
  projectRoot: string;
  stateRoot: string;
  workdocsRoot: string;
  worksPath: string;
  activeContextPath: string;
  jsonPath: string;
  markdownPath: string;
  legacyJsonPath: string;
  legacyMarkdownPath: string;
  logger?: Logger;
}

const DEFAULT_JSON_FILE = ".ai-history.json";
const DEFAULT_MARKDOWN_FILE = ".ai-session-log.md";
const DEFAULT_STATE_DIR = ".tasklog";
const DEFAULT_WORKDOCS_DIR = "workdocs";
const DEFAULT_WORKS_FILE = "works.json";
const DEFAULT_ACTIVE_CONTEXT_FILE = "active-context.json";
const DEFAULT_SESSION_JSON_FILE = "session-log.json";
const DEFAULT_SESSION_MARKDOWN_FILE = "session-log.md";
const ACTIVE_CONTEXT_STALE_MS = 24 * 60 * 60 * 1000;
const BASE62_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const BASE62_ID_LENGTH = 6;
const MAX_ID_ATTEMPTS = 64;

let mutationQueue: Promise<void> = Promise.resolve();

export function resolveLogbookPaths(
  projectRoot: string,
  jsonFile = DEFAULT_JSON_FILE,
  markdownFile = DEFAULT_MARKDOWN_FILE,
  logger?: Logger,
): LogbookPaths {
  const normalizedProjectRoot = path.resolve(projectRoot);
  const stateRoot = resolveInsideProjectRoot(normalizedProjectRoot, DEFAULT_STATE_DIR, "state-dir");
  const workdocsRoot = resolveInsideProjectRoot(
    normalizedProjectRoot,
    DEFAULT_WORKDOCS_DIR,
    "workdocs-dir",
  );

  return {
    projectRoot: normalizedProjectRoot,
    stateRoot,
    workdocsRoot,
    worksPath: resolveInsideProjectRoot(
      normalizedProjectRoot,
      path.join(DEFAULT_STATE_DIR, DEFAULT_WORKS_FILE),
      "works-file",
    ),
    activeContextPath: resolveInsideProjectRoot(
      normalizedProjectRoot,
      path.join(DEFAULT_STATE_DIR, DEFAULT_ACTIVE_CONTEXT_FILE),
      "active-context-file",
    ),
    jsonPath: resolveInsideProjectRoot(
      normalizedProjectRoot,
      path.join(DEFAULT_STATE_DIR, DEFAULT_SESSION_JSON_FILE),
      "session-json-file",
    ),
    markdownPath: resolveInsideProjectRoot(
      normalizedProjectRoot,
      path.join(DEFAULT_STATE_DIR, DEFAULT_SESSION_MARKDOWN_FILE),
      "session-markdown-file",
    ),
    legacyJsonPath: resolveInsideProjectRoot(normalizedProjectRoot, jsonFile, "json-file"),
    legacyMarkdownPath: resolveInsideProjectRoot(
      normalizedProjectRoot,
      markdownFile,
      "markdown-file",
    ),
    logger,
  };
}

export async function readLogEntries(paths: LogbookPaths): Promise<SessionLogEntry[]> {
  try {
    const raw = await readPreferredLogFile(paths);
    if (raw === undefined) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error(`Expected the session log JSON file to contain a JSON array.`);
    }

    return parsed.map((entry, index) => normalizeEntry(entry, index));
  } catch (error) {
    if (isMissingFile(error)) {
      return [];
    }

    paths.logger?.error("logbook.read_failed", {
      project_root: paths.projectRoot,
      json_path: paths.jsonPath,
      legacy_json_path: paths.legacyJsonPath,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function appendLogEntry(
  paths: LogbookPaths,
  input: AppendSessionLogInput,
): Promise<SessionLogEntry> {
  return withMutationLock(async () => {
    const [currentEntries, works, activeContext] = await Promise.all([
      readLogEntries(paths),
      readWorkRecords(paths),
      readActiveContextRecord(paths),
    ]);
    const now = new Date().toISOString();
    const resolvedWorkId = resolveAppendWorkId(works, activeContext, input.work_id);
    const entry: SessionLogEntry = {
      id: buildUniqueHumanId(new Set(currentEntries.map((item) => item.id))),
      work_id: resolvedWorkId,
      timestamp: now,
      summary: normalizeSummary(input.summary),
      status: normalizeStatus(input.status),
      change_type: normalizeChangeType(input.change_type),
      affected_files: normalizeAffectedFiles(input.affected_files),
      tags: normalizeTags(input.tags),
      next_steps: normalizeOptionalText(input.next_steps),
      blockers: normalizeOptionalText(input.blockers),
      related_log_ids: normalizeLogIds(input.related_log_ids),
      supersedes_log_id: normalizeOptionalText(input.supersedes_log_id),
      revision: 1,
      created_at: now,
      updated_at: now,
    };

    const nextEntries = [...currentEntries];
    if (entry.supersedes_log_id) {
      markSuperseded(nextEntries, entry.supersedes_log_id, now);
    }
    nextEntries.push(entry);

    if (entry.work_id) {
      touchWorkRecord(works, entry.work_id, now, entry.summary);
      await persistWorkRecords(paths, works);
    }

    await persistEntries(paths, nextEntries);
    return entry;
  });
}

export async function getRecentLogEntries(
  paths: LogbookPaths,
  limit: number,
  options: GetRecentLogsOptions = {},
): Promise<SessionLogEntry[]> {
  const entries = await readLogEntries(paths);
  const safeLimit = normalizeLimit(limit, 5, 50);
  const filtered = await filterRecentLogs(paths, entries, options);
  return filtered.slice(-safeLimit).reverse();
}

export async function getOpenThreadEntries(
  paths: LogbookPaths,
  limit: number,
): Promise<SessionLogEntry[]> {
  const entries = await readLogEntries(paths);
  const safeLimit = normalizeLimit(limit, 10, 50);

  return entries
    .filter((entry) => {
      if (entry.status === "Superseded") {
        return false;
      }

      return entry.status === "WIP" || entry.status === "Blocked" || Boolean(entry.next_steps);
    })
    .slice(-safeLimit)
    .reverse();
}

export async function updateLogStatus(
  paths: LogbookPaths,
  logId: string,
  status: LogStatus,
): Promise<SessionLogEntry> {
  return withMutationLock(async () => {
    const entries = await readLogEntries(paths);
    const entry = findLogEntry(entries, logId);
    const now = new Date().toISOString();

    entry.status = normalizeStatus(status);
    entry.revision += 1;
    entry.updated_at = now;

    await persistEntries(paths, entries);
    return entry;
  });
}

export async function amendLogMetadata(
  paths: LogbookPaths,
  logId: string,
  patch: AmendLogMetadataInput,
): Promise<SessionLogEntry> {
  return withMutationLock(async () => {
    const entries = await readLogEntries(paths);
    const entry = findLogEntry(entries, logId);
    const now = new Date().toISOString();

    if (patch.affected_files !== undefined) {
      entry.affected_files = normalizeAffectedFiles(patch.affected_files);
    }

    if (patch.tags !== undefined) {
      entry.tags = normalizeTags(patch.tags);
    }

    if (patch.next_steps !== undefined) {
      entry.next_steps = normalizeOptionalText(patch.next_steps);
    }

    if (patch.blockers !== undefined) {
      entry.blockers = normalizeOptionalText(patch.blockers);
    }

    entry.revision += 1;
    entry.updated_at = now;

    await persistEntries(paths, entries);
    return entry;
  });
}

export async function readWorkRecords(paths: LogbookPaths): Promise<WorkRecord[]> {
  try {
    const raw = await readFile(paths.worksPath, "utf8");
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      throw new Error(`Expected ${paths.worksPath} to contain a JSON array.`);
    }

    return parsed.map((value, index) => normalizeWorkRecord(paths.projectRoot, value, index));
  } catch (error) {
    if (isMissingFile(error)) {
      return [];
    }

    paths.logger?.error("workbook.read_failed", {
      project_root: paths.projectRoot,
      works_path: paths.worksPath,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function startWork(paths: LogbookPaths, input: StartWorkInput): Promise<WorkRecord> {
  return withMutationLock(async () => {
    const works = await readWorkRecords(paths);
    const now = new Date().toISOString();
    const title = normalizeTitle(input.title);
    const startDir = normalizeScopedPath(paths.projectRoot, input.start_dir, "start_dir");
    const scopePaths = normalizeScopePaths(paths.projectRoot, input.scope_paths, startDir);
    const work: WorkRecord = {
      work_id: buildUniqueHumanId(new Set(works.map((item) => item.work_id))),
      title,
      slug: slugify(title),
      status: "active",
      impact: normalizeWorkImpact(input.impact),
      start_dir: startDir,
      scope_paths: scopePaths,
      summary: normalizeOptionalText(input.summary),
      tags: normalizeTags(input.tags),
      created_at: now,
      updated_at: now,
    };

    works.push(work);
    await persistWorkRecords(paths, works);
    await ensureDirectory(getWorkArtifactPaths(paths, work).workDir);
    await writeActiveContextRecord(paths, {
      active_work_id: work.work_id,
      project_root: paths.projectRoot,
      updated_at: now,
    });

    return work;
  });
}

export async function listWorks(paths: LogbookPaths, input: ListWorksInput = {}): Promise<WorkListEntry[]> {
  const [works, entries] = await Promise.all([readWorkRecords(paths), readLogEntries(paths)]);
  const safeLimit = normalizeLimit(input.limit ?? 10, 10, 100);
  const normalizedQuery = input.query?.trim().toLowerCase();
  const normalizedTag = input.tag?.trim().toLowerCase();

  const filtered = works
    .filter((work) => matchesWorkStatus(work, input.status ?? "open"))
    .filter((work) => matchesWorkQuery(work, normalizedQuery))
    .filter((work) => matchesWorkTag(work, normalizedTag))
    .filter((work) => matchesWorkImpact(work, input.impact))
    .sort((left, right) => compareWorkRecords(left, right, input.sort_by ?? "updated_at", input.sort_order ?? "desc"))
    .slice(0, safeLimit);

  return Promise.all(
    filtered.map(async (work) => buildWorkListEntry(paths, work, entries.filter((entry) => entry.work_id === work.work_id))),
  );
}

export async function getActiveContext(paths: LogbookPaths): Promise<ActiveContextSummary> {
  const [works, activeContext] = await Promise.all([
    readWorkRecords(paths),
    readActiveContextRecord(paths),
  ]);

  return buildActiveContextSummary(paths, works, activeContext);
}

export async function resumeWork(
  paths: LogbookPaths,
  input: { work_id?: string; query?: string },
): Promise<ActiveContextSummary> {
  return withMutationLock(async () => {
    const works = await readWorkRecords(paths);
    const work = resolveWorkReference(works, input.work_id, input.query);
    const now = new Date().toISOString();

    await writeActiveContextRecord(paths, {
      active_work_id: work.work_id,
      project_root: paths.projectRoot,
      updated_at: now,
    });

    return buildActiveContextSummary(paths, works, {
      active_work_id: work.work_id,
      project_root: paths.projectRoot,
      updated_at: now,
    });
  });
}

export async function setWorkStatus(
  paths: LogbookPaths,
  workId: string,
  status: WorkStatus,
): Promise<WorkRecord> {
  return withMutationLock(async () => {
    const [works, activeContext] = await Promise.all([
      readWorkRecords(paths),
      readActiveContextRecord(paths),
    ]);
    const work = findWorkRecord(works, workId);
    const now = new Date().toISOString();

    work.status = normalizeWorkStatus(status);
    work.updated_at = now;
    await persistWorkRecords(paths, works);

    if (status === "done" && activeContext.active_work_id === workId) {
      await writeActiveContextRecord(paths, {
        project_root: paths.projectRoot,
        updated_at: now,
      });
    }

    return work;
  });
}

export async function setWorkImpact(
  paths: LogbookPaths,
  workId: string,
  impact?: WorkImpact,
): Promise<WorkRecord> {
  return withMutationLock(async () => {
    const works = await readWorkRecords(paths);
    const work = findWorkRecord(works, workId);

    work.impact = normalizeWorkImpact(impact);
    work.updated_at = new Date().toISOString();
    await persistWorkRecords(paths, works);
    return work;
  });
}

export async function readWorkContext(
  paths: LogbookPaths,
  workId?: string,
  options: ReadWorkContextOptions = {},
): Promise<WorkContextSummary> {
  const [works, entries, activeContext] = await Promise.all([
    readWorkRecords(paths),
    readLogEntries(paths),
    readActiveContextRecord(paths),
  ]);
  const work = resolvePreferredWork(works, activeContext, workId);
  const artifactPaths = getWorkArtifactPaths(paths, work);
  const artifactAvailability = await getArtifactAvailability(artifactPaths);
  const allRecentLogs = entries.filter((entry) => entry.work_id === work.work_id).slice(-5).reverse();
  const contextMode = resolveWorkContextMode(work, artifactAvailability);
  const includeRecentLogs =
    contextMode !== "closed/consolidated" || options.include_recent_logs === true;
  const recentLogs = includeRecentLogs ? allRecentLogs : [];
  const summaryText = options.include_summary && artifactAvailability.summary
    ? await readOptionalTextFile(artifactPaths.summaryPath)
    : undefined;
  const nextStepSummary =
    contextMode === "closed/consolidated"
      ? undefined
      : allRecentLogs.find((entry) => entry.next_steps)?.next_steps;
  const reentryBrief = options.compact
    ? {
      title: work.title,
      status: work.status,
      scope_paths: work.scope_paths,
      latest_log_summary: allRecentLogs[0]?.summary ?? "",
      next_step_summary: nextStepSummary ?? "",
      artifact_files: existingArtifactFileNames(artifactPaths, artifactAvailability),
    }
    : undefined;

  return {
    work,
    artifact_paths: artifactPaths,
    artifact_availability: artifactAvailability,
    context_mode: contextMode,
    recent_logs: recentLogs,
    recent_log_count: allRecentLogs.length,
    next_step_summary: nextStepSummary,
    summary_text: summaryText,
    reentry_brief: reentryBrief,
  };
}

export async function createWorkDoc(
  paths: LogbookPaths,
  docType: Exclude<WorkDocType, "notes">,
  input: { work_id?: string; target_paths?: string[] } = {},
): Promise<CreateWorkDocResult> {
  return withMutationLock(async () => {
    const [works, activeContext] = await Promise.all([
      readWorkRecords(paths),
      readActiveContextRecord(paths),
    ]);
    const work = resolvePreferredWork(works, activeContext, input.work_id);
    const artifactPaths = getWorkArtifactPaths(paths, work);
    const targetPath = getArtifactPath(artifactPaths, docType);
    const created = !(await pathExists(targetPath));
    const targetPaths =
      docType === "plan"
        ? normalizeTargetPaths(paths.projectRoot, input.target_paths, work.scope_paths)
        : undefined;

    if (docType === "summary" && work.status !== "done") {
      throw new Error("summary.md is only available for work items whose status is done.");
    }

    if (!created && docType === "plan" && targetPaths && targetPaths.length > 0) {
      const existingTargetPaths = await readPlanTargetPaths(targetPath);
      if (!existingTargetPaths || !samePathSet(existingTargetPaths, targetPaths)) {
        throw new Error(
          "plan.md already exists; refusing to report new target_paths without updating the file.",
        );
      }
    }

    await ensureDirectory(artifactPaths.workDir);
    if (created) {
      await writeAtomically(targetPath, buildWorkDocContents(docType, work, targetPaths));
    }

    touchWorkRecord(works, work.work_id, new Date().toISOString());
    await persistWorkRecords(paths, works);

    return {
      work: findWorkRecord(works, work.work_id),
      path: targetPath,
      created,
      target_paths: targetPaths,
    };
  });
}

export async function appendWorkNote(
  paths: LogbookPaths,
  input: { work_id?: string; note: string },
): Promise<AppendWorkNoteResult> {
  return withMutationLock(async () => {
    const [works, activeContext] = await Promise.all([
      readWorkRecords(paths),
      readActiveContextRecord(paths),
    ]);
    const work = resolvePreferredWork(works, activeContext, input.work_id);
    const artifactPaths = getWorkArtifactPaths(paths, work);
    const note = normalizeSummary(input.note);
    const now = new Date().toISOString();
    const created = !(await pathExists(artifactPaths.notesPath));
    const noteSection = `\n## ${now}\n\n${note
      .split(/\r?\n/)
      .map((line) => line.trimEnd())
      .join("\n")}\n`;

    await ensureDirectory(artifactPaths.workDir);
    const existingContents = created
      ? buildWorkDocContents("notes", work)
      : await readFile(artifactPaths.notesPath, "utf8");
    await writeAtomically(artifactPaths.notesPath, `${existingContents}${noteSection}`);

    touchWorkRecord(works, work.work_id, now);
    await persistWorkRecords(paths, works);

    return {
      work: findWorkRecord(works, work.work_id),
      path: artifactPaths.notesPath,
      created,
    };
  });
}

export function formatLogEntries(entries: SessionLogEntry[]): string {
  if (entries.length === 0) {
    return "No session logs found yet.";
  }

  return entries
    .map((entry) => {
      const lines = [
        `- ${entry.timestamp} [${entry.status}] {${entry.change_type}}`,
        `  ID: ${escapePlainTextField(entry.id)}`,
        `  Summary: ${escapePlainTextField(entry.summary)}`,
        `  Files: ${
          entry.affected_files.length > 0
            ? entry.affected_files.map((filePath) => escapePlainTextField(filePath)).join(", ")
            : "(none listed)"
        }`,
      ];

      if (entry.work_id) {
        lines.push(`  Work: ${escapePlainTextField(entry.work_id)}`);
      }

      if (entry.tags && entry.tags.length > 0) {
        lines.push(`  Tags: ${entry.tags.map((tag) => escapePlainTextField(tag)).join(", ")}`);
      }

      if (entry.next_steps) {
        lines.push(`  Next steps: ${escapePlainTextField(entry.next_steps)}`);
      }

      if (entry.blockers) {
        lines.push(`  Blockers: ${escapePlainTextField(entry.blockers)}`);
      }

      if (entry.related_log_ids && entry.related_log_ids.length > 0) {
        lines.push(
          `  Related logs: ${entry.related_log_ids
            .map((logId) => escapePlainTextField(logId))
            .join(", ")}`,
        );
      }

      if (entry.supersedes_log_id) {
        lines.push(`  Supersedes: ${escapePlainTextField(entry.supersedes_log_id)}`);
      }

      return lines.join("\n");
    })
    .join("\n\n");
}

async function filterRecentLogs(
  paths: LogbookPaths,
  entries: SessionLogEntry[],
  options: GetRecentLogsOptions,
): Promise<SessionLogEntry[]> {
  if (options.work_id) {
    return entries.filter((entry) => entry.work_id === options.work_id);
  }

  if (options.project_wide) {
    return entries;
  }

  const [works, activeContext] = await Promise.all([
    readWorkRecords(paths),
    readActiveContextRecord(paths),
  ]);
  const summary = buildActiveContextSummary(paths, works, activeContext);
  if (summary.freshness === "fresh" && summary.active_work_id) {
    return entries.filter((entry) => entry.work_id === summary.active_work_id);
  }

  return entries;
}

async function readPreferredLogFile(paths: LogbookPaths): Promise<string | undefined> {
  if (await pathExists(paths.jsonPath)) {
    return readFile(paths.jsonPath, "utf8");
  }

  if (paths.legacyJsonPath !== paths.jsonPath && (await pathExists(paths.legacyJsonPath))) {
    return readFile(paths.legacyJsonPath, "utf8");
  }

  return undefined;
}

function normalizeEntry(value: unknown, index: number): SessionLogEntry {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid session log entry.");
  }

  const entry = value as Record<string, unknown>;
  const timestamp = stringField(entry.timestamp, "timestamp");
  const rawStatus = optionalStringField(entry.status);
  const rawChangeType = optionalStringField(entry.change_type);
  const legacyAffectedFiles = entry.affectedFiles;

  return {
    id: optionalStringField(entry.id) ?? `legacy-${timestamp}-${index}`,
    work_id: normalizeOptionalText(optionalStringField(entry.work_id)),
    timestamp,
    summary: stringField(entry.summary, "summary"),
    status: normalizeStatus(rawStatus ?? "Done"),
    change_type: normalizeChangeType(resolveChangeType(rawChangeType, rawStatus), "investigation"),
    affected_files: normalizeAffectedFiles(
      Array.isArray(entry.affected_files)
        ? entry.affected_files.map((item) => stringField(item, "affected_files item"))
        : Array.isArray(legacyAffectedFiles)
          ? legacyAffectedFiles.map((item) => stringField(item, "affectedFiles item"))
          : [],
    ),
    tags: normalizeTags(
      Array.isArray(entry.tags) ? entry.tags.map((item) => stringField(item, "tags item")) : [],
    ),
    next_steps: normalizeOptionalText(optionalStringField(entry.next_steps)),
    blockers: normalizeOptionalText(optionalStringField(entry.blockers)),
    related_log_ids: normalizeLogIds(
      Array.isArray(entry.related_log_ids)
        ? entry.related_log_ids.map((item) => stringField(item, "related_log_ids item"))
        : [],
    ),
    supersedes_log_id: normalizeOptionalText(optionalStringField(entry.supersedes_log_id)),
    revision: normalizeRevision(entry.revision),
    created_at: optionalStringField(entry.created_at) ?? timestamp,
    updated_at: optionalStringField(entry.updated_at) ?? timestamp,
  };
}

function normalizeWorkRecord(projectRoot: string, value: unknown, index: number): WorkRecord {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid work record.");
  }

  const entry = value as Record<string, unknown>;
  const title = stringField(entry.title, "title");
  const startDir = normalizeScopedPath(projectRoot, optionalStringField(entry.start_dir), "start_dir");
  const createdAt = optionalStringField(entry.created_at) ?? new Date(0).toISOString();
  const updatedAt = optionalStringField(entry.updated_at) ?? createdAt;

  return {
    work_id: optionalStringField(entry.work_id) ?? `legacy${index.toString().padStart(4, "0")}`,
    title,
    slug: normalizeOptionalText(optionalStringField(entry.slug)) ?? slugify(title),
    status: normalizeWorkStatus(optionalStringField(entry.status) ?? "active"),
    impact: normalizeWorkImpact(optionalStringField(entry.impact) as WorkImpact | undefined),
    start_dir: startDir,
    scope_paths: normalizeScopePaths(
      projectRoot,
      Array.isArray(entry.scope_paths)
        ? entry.scope_paths.map((item) => stringField(item, "scope_paths item"))
        : [],
      startDir,
    ),
    summary: normalizeOptionalText(optionalStringField(entry.summary)),
    tags: normalizeTags(
      Array.isArray(entry.tags) ? entry.tags.map((item) => stringField(item, "tags item")) : [],
    ),
    created_at: createdAt,
    updated_at: updatedAt,
  };
}

async function persistEntries(paths: LogbookPaths, entries: SessionLogEntry[]): Promise<void> {
  try {
    await mkdir(paths.projectRoot, { recursive: true });
    await mkdir(paths.stateRoot, { recursive: true });
    const jsonContents = `${JSON.stringify(entries, null, 2)}\n`;
    const markdownContents = renderMarkdown(entries);

    await writeAtomically(paths.jsonPath, jsonContents);
    await writeAtomically(paths.markdownPath, markdownContents);

    if (paths.legacyJsonPath !== paths.jsonPath) {
      await writeAtomically(paths.legacyJsonPath, jsonContents);
    }

    if (paths.legacyMarkdownPath !== paths.markdownPath) {
      await writeAtomically(paths.legacyMarkdownPath, markdownContents);
    }
  } catch (error) {
    paths.logger?.error("logbook.persist_failed", {
      project_root: paths.projectRoot,
      json_path: paths.jsonPath,
      markdown_path: paths.markdownPath,
      legacy_json_path: paths.legacyJsonPath,
      legacy_markdown_path: paths.legacyMarkdownPath,
      entry_count: entries.length,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

async function persistWorkRecords(paths: LogbookPaths, works: WorkRecord[]): Promise<void> {
  await mkdir(paths.stateRoot, { recursive: true });
  await writeAtomically(paths.worksPath, `${JSON.stringify(works, null, 2)}\n`);
}

async function readActiveContextRecord(paths: LogbookPaths): Promise<ActiveContextRecord> {
  try {
    const raw = await readFile(paths.activeContextPath, "utf8");
    const parsed = JSON.parse(raw) as Record<string, unknown>;

    return {
      active_work_id: normalizeOptionalText(optionalStringField(parsed.active_work_id)),
      project_root: optionalStringField(parsed.project_root) ?? paths.projectRoot,
      updated_at: normalizeOptionalText(optionalStringField(parsed.updated_at)),
    };
  } catch (error) {
    if (isMissingFile(error)) {
      return {
        project_root: paths.projectRoot,
      };
    }

    paths.logger?.error("active_context.read_failed", {
      project_root: paths.projectRoot,
      active_context_path: paths.activeContextPath,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

async function writeActiveContextRecord(paths: LogbookPaths, activeContext: ActiveContextRecord): Promise<void> {
  await mkdir(paths.stateRoot, { recursive: true });
  await writeAtomically(paths.activeContextPath, `${JSON.stringify(activeContext, null, 2)}\n`);
}

function buildActiveContextSummary(
  paths: LogbookPaths,
  works: WorkRecord[],
  activeContext: ActiveContextRecord,
): ActiveContextSummary {
  const activeWork = activeContext.active_work_id
    ? works.find((work) => work.work_id === activeContext.active_work_id)
    : undefined;

  return {
    ...activeContext,
    state_root: paths.stateRoot,
    workdocs_root: paths.workdocsRoot,
    json_path: paths.jsonPath,
    markdown_path: paths.markdownPath,
    active_work: activeWork,
    freshness: resolveActiveWorkFreshness(activeContext, activeWork),
  };
}

function resolveWorkContextMode(
  work: WorkRecord,
  artifactAvailability: WorkArtifactAvailability,
): WorkContextMode {
  if (work.status !== "done") {
    return "active";
  }

  return artifactAvailability.summary ? "closed/consolidated" : "closed/raw";
}

async function buildWorkListEntry(
  paths: LogbookPaths,
  work: WorkRecord,
  logs: SessionLogEntry[],
): Promise<WorkListEntry> {
  const artifactPaths = getWorkArtifactPaths(paths, work);
  const artifactAvailability = await getArtifactAvailability(artifactPaths);
  const contextMode = resolveWorkContextMode(work, artifactAvailability);
  const recentLog = logs.at(-1);
  const recentNextStep =
    contextMode === "closed/consolidated"
      ? undefined
      : [...logs].reverse().find((entry) => entry.next_steps)?.next_steps;

  return {
    ...work,
    artifact_availability: artifactAvailability,
    context_mode: contextMode,
    last_log_summary: recentLog?.summary,
    next_step_summary: recentNextStep,
    recent_log_id: recentLog?.id,
  };
}

async function getArtifactAvailability(paths: WorkArtifactPaths): Promise<WorkArtifactAvailability> {
  const [design, plan, spec, summary, notes] = await Promise.all([
    pathExists(paths.designPath),
    pathExists(paths.planPath),
    pathExists(paths.specPath),
    pathExists(paths.summaryPath),
    pathExists(paths.notesPath),
  ]);

  return { design, plan, spec, summary, notes };
}

async function readOptionalTextFile(filePath: string): Promise<string | undefined> {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    if (isMissingFile(error)) {
      return undefined;
    }

    throw error;
  }
}

function renderMarkdown(entries: SessionLogEntry[]): string {
  const header = [
    "# AI Session Logbook",
    "",
    "Chronological handover log for recent AI sessions.",
    "",
  ];

  const body =
    entries.length === 0
      ? ["No entries yet.", ""]
      : entries.flatMap((entry) => {
          const section = [
            `## ${entry.timestamp} · ${entry.status} · ${entry.change_type}`,
            "",
            `**ID**: ${escapeMarkdownInline(entry.id)}`,
          ];

          if (entry.work_id) {
            section.push(`**Work**: ${escapeMarkdownInline(entry.work_id)}`);
          }

          section.push(
            "",
            ...renderQuotedText(entry.summary),
            "",
            "**Affected files**",
            "",
            ...(entry.affected_files.length > 0
              ? entry.affected_files.map((filePath) => `- ${escapeMarkdownInline(filePath)}`)
              : ["- (none listed)"]),
          );

          if (entry.tags && entry.tags.length > 0) {
            section.push("", "**Tags**", "", ...entry.tags.map((tag) => `- ${escapeMarkdownInline(tag)}`));
          }

          if (entry.next_steps) {
            section.push("", "**Next steps**", "", ...renderListText(entry.next_steps));
          }

          if (entry.blockers) {
            section.push("", "**Blockers**", "", ...renderListText(entry.blockers));
          }

          if (entry.related_log_ids && entry.related_log_ids.length > 0) {
            section.push(
              "",
              "**Related logs**",
              "",
              ...entry.related_log_ids.map((logId) => `- ${escapeMarkdownInline(logId)}`),
            );
          }

          if (entry.supersedes_log_id) {
            section.push("", `**Supersedes**: ${escapeMarkdownInline(entry.supersedes_log_id)}`);
          }

          section.push(
            "",
            `**Revision**: ${entry.revision}`,
            `**Created**: ${entry.created_at}`,
            `**Updated**: ${entry.updated_at}`,
            "",
          );

          return section;
        });

  return [...header, ...body].join("\n");
}

function getWorkArtifactPaths(paths: LogbookPaths, work: WorkRecord): WorkArtifactPaths {
  const workDir = resolveInsideProjectRoot(
    paths.projectRoot,
    path.join(DEFAULT_WORKDOCS_DIR, `${work.work_id}-${work.slug}`),
    "workdocs-entry",
  );

  return {
    workDir,
    designPath: path.join(workDir, WORKDOC_FILENAMES.design),
    planPath: path.join(workDir, WORKDOC_FILENAMES.plan),
    specPath: path.join(workDir, WORKDOC_FILENAMES.spec),
    summaryPath: path.join(workDir, WORKDOC_FILENAMES.summary),
    notesPath: path.join(workDir, WORKDOC_FILENAMES.notes),
  };
}

function getArtifactPath(paths: WorkArtifactPaths, docType: Exclude<WorkDocType, "notes">): string {
  switch (docType) {
    case "design":
      return paths.designPath;
    case "plan":
      return paths.planPath;
    case "spec":
      return paths.specPath;
    case "summary":
      return paths.summaryPath;
  }
}

function existingArtifactFileNames(
  paths: WorkArtifactPaths,
  availability: WorkArtifactAvailability,
): string[] {
  const files = [
    availability.design ? path.basename(paths.designPath) : null,
    availability.plan ? path.basename(paths.planPath) : null,
    availability.spec ? path.basename(paths.specPath) : null,
    availability.summary ? path.basename(paths.summaryPath) : null,
    availability.notes ? path.basename(paths.notesPath) : null,
  ];

  return files.filter((fileName): fileName is string => fileName !== null);
}

function buildWorkDocContents(
  docType: WorkDocType,
  work: WorkRecord,
  targetPaths?: string[],
): string {
  const frontmatter = [
    "---",
    `work_id: ${toYamlScalar(work.work_id)}`,
    `title: ${toYamlScalar(work.title)}`,
    `status: ${toYamlScalar(work.status)}`,
    ...(work.impact ? [`impact: ${toYamlScalar(work.impact)}`] : []),
    `start_dir: ${toYamlScalar(work.start_dir)}`,
    "scope_paths:",
    ...work.scope_paths.map((scopePath) => `  - ${toYamlScalar(scopePath)}`),
    ...(docType === "plan"
      ? [
          "target_paths:",
          ...(targetPaths ?? work.scope_paths).map(
            (targetPath) => `  - ${toYamlScalar(targetPath)}`,
          ),
        ]
      : []),
    `updated_at: ${toYamlScalar(work.updated_at)}`,
    "---",
    "",
  ];

  switch (docType) {
    case "design":
      return [
        ...frontmatter,
        "# Design",
        "",
        "## Problem",
        "",
        "## Goals",
        "",
        "## Constraints",
        "",
        "## Tradeoffs",
        "",
        "## Chosen Approach",
        "",
      ].join("\n");
    case "plan":
      return [
        ...frontmatter,
        "# Implementation Plan",
        "",
        "## Scope",
        "",
        "## Steps",
        "",
        "## Files and Areas",
        "",
        "## Testing",
        "",
        "## Rollout",
        "",
      ].join("\n");
    case "spec":
      return [
        ...frontmatter,
        "# Spec",
        "",
        "## Behavior",
        "",
        "## Inputs",
        "",
        "## Outputs",
        "",
        "## Rules",
        "",
        "## Acceptance Criteria",
        "",
      ].join("\n");
    case "summary":
      return [
        ...frontmatter,
        "# Work Summary",
        "",
        "## What was this work?",
        "",
        "## Why was it needed?",
        "",
        "## What changed?",
        "",
        "## Key decisions and tradeoffs",
        "",
        "## Affected modules and flows",
        "",
        "## Known limitations or deferred work",
        "",
        "## Re-entry guidance",
        "",
        "## Evidence pointers",
        "",
      ].join("\n");
    case "notes":
      return [
        ...frontmatter,
        "# Notes",
        "",
      ].join("\n");
  }
}

function markSuperseded(entries: SessionLogEntry[], logId: string, now: string): void {
  const previousEntry = entries.find((entry) => entry.id === logId);
  if (!previousEntry) {
    throw new Error(`Log entry not found for supersedes_log_id: ${logId}`);
  }

  previousEntry.status = "Superseded";
  previousEntry.revision += 1;
  previousEntry.updated_at = now;
}

function findLogEntry(entries: SessionLogEntry[], logId: string): SessionLogEntry {
  const entry = entries.find((item) => item.id === logId);
  if (!entry) {
    throw new Error(`Log entry not found: ${logId}`);
  }

  return entry;
}

function findWorkRecord(works: WorkRecord[], workId: string): WorkRecord {
  const work = works.find((item) => item.work_id === workId);
  if (!work) {
    throw new Error(`Work not found: ${workId}`);
  }

  return work;
}

function resolveWorkReference(works: WorkRecord[], workId?: string, query?: string): WorkRecord {
  if (workId) {
    return findWorkRecord(works, workId.trim());
  }

  const normalizedQuery = query?.trim().toLowerCase();
  if (!normalizedQuery) {
    throw new Error("A work_id or query is required.");
  }

  const matches = works.filter((work) => matchesWorkQuery(work, normalizedQuery));
  if (matches.length === 1) {
    return matches[0];
  }

  if (matches.length === 0) {
    throw new Error(`No work matched query: ${query}`);
  }

  throw new Error(
    `Query matched multiple works: ${matches
      .slice(0, 5)
      .map((work) => `${work.work_id}:${work.slug}`)
      .join(", ")}`,
  );
}

function resolvePreferredWork(
  works: WorkRecord[],
  activeContext: ActiveContextRecord,
  workId?: string,
): WorkRecord {
  if (workId) {
    return findWorkRecord(works, workId);
  }

  const activeWork = activeContext.active_work_id
    ? works.find((work) => work.work_id === activeContext.active_work_id)
    : undefined;
  const freshness = resolveActiveWorkFreshness(activeContext, activeWork);

  if (activeWork && freshness === "fresh") {
    return activeWork;
  }

  const openWorks = works.filter((work) => work.status === "active" || work.status === "blocked");
  if (openWorks.length === 1) {
    return openWorks[0];
  }

  throw new Error("No work_id was provided and no unambiguous active work could be resolved.");
}

function resolveAppendWorkId(
  works: WorkRecord[],
  activeContext: ActiveContextRecord,
  explicitWorkId: string | undefined,
): string | undefined {
  if (explicitWorkId) {
    return findWorkRecord(works, explicitWorkId.trim()).work_id;
  }

  const activeWork = activeContext.active_work_id
    ? works.find((work) => work.work_id === activeContext.active_work_id)
    : undefined;
  const freshness = resolveActiveWorkFreshness(activeContext, activeWork);

  if (freshness === "fresh" && activeWork) {
    return activeWork.work_id;
  }

  return undefined;
}

function resolveActiveWorkFreshness(
  activeContext: ActiveContextRecord,
  activeWork: WorkRecord | undefined,
): ActiveWorkFreshness | undefined {
  if (!activeContext.active_work_id) {
    return undefined;
  }

  if (!activeWork || activeWork.status === "done") {
    return "invalid";
  }

  if (!activeContext.updated_at) {
    return "stale";
  }

  const updatedAt = Date.parse(activeContext.updated_at);
  if (!Number.isFinite(updatedAt)) {
    return "stale";
  }

  return Date.now() - updatedAt > ACTIVE_CONTEXT_STALE_MS ? "stale" : "fresh";
}

function resolveChangeType(rawChangeType: string | undefined, rawStatus: string | undefined): string {
  if (rawChangeType) {
    return rawChangeType;
  }

  if (rawStatus && CHANGE_TYPES.includes(rawStatus.toLowerCase() as ChangeType)) {
    return rawStatus.toLowerCase();
  }

  return "investigation";
}

function touchWorkRecord(works: WorkRecord[], workId: string, now: string, summary?: string): void {
  const work = findWorkRecord(works, workId);
  work.updated_at = now;
  if (!work.summary && summary) {
    work.summary = summary;
  }
}

function normalizeSummary(summary: string): string {
  const trimmed = summary.trim();
  if (!trimmed) {
    throw new Error("summary must not be empty.");
  }

  return trimmed;
}

function normalizeTitle(title: string): string {
  const normalized = normalizeSummary(title);
  if (/[\r\n]/.test(normalized)) {
    throw new Error("title must stay on a single line.");
  }

  return normalized;
}

function normalizeAffectedFiles(affectedFiles: string[]): string[] {
  return [...new Set(affectedFiles.map((item) => item.trim()).filter(Boolean))];
}

function normalizeTags(tags: string[] | undefined): string[] | undefined {
  if (!tags || tags.length === 0) {
    return undefined;
  }

  const normalized = [...new Set(tags.map((item) => item.trim().toLowerCase()).filter(Boolean))];
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeLogIds(logIds: string[] | undefined): string[] | undefined {
  if (!logIds || logIds.length === 0) {
    return undefined;
  }

  const normalized = [...new Set(logIds.map((item) => item.trim()).filter(Boolean))];
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeOptionalText(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeStatus(status: string): LogStatus {
  if (LOG_STATUSES.includes(status as LogStatus)) {
    return status as LogStatus;
  }

  throw new Error(`Unsupported status: ${status}`);
}

function normalizeWorkStatus(status: string): WorkStatus {
  if (WORK_STATUSES.includes(status as WorkStatus)) {
    return status as WorkStatus;
  }

  throw new Error(`Unsupported work status: ${status}`);
}

function normalizeWorkImpact(impact: string | undefined): WorkImpact | undefined {
  if (!impact) {
    return undefined;
  }

  if (WORK_IMPACTS.includes(impact as WorkImpact)) {
    return impact as WorkImpact;
  }

  throw new Error(`Unsupported work impact: ${impact}`);
}

function normalizeChangeType(changeType: string, fallback?: ChangeType): ChangeType {
  if (CHANGE_TYPES.includes(changeType as ChangeType)) {
    return changeType as ChangeType;
  }

  if (fallback) {
    return fallback;
  }

  throw new Error(`Unsupported change_type: ${changeType}`);
}

function normalizeLimit(value: number, fallback: number, max: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(1, Math.min(max, Math.trunc(value)));
}

function normalizeRevision(value: unknown): number {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }

  return 1;
}

function normalizeScopedPath(projectRoot: string, value: string | undefined, label: string): string {
  const candidate = value?.trim() ? value.trim() : ".";
  return resolvePathWithinRoot(projectRoot, candidate, label);
}

function normalizeScopePaths(
  projectRoot: string,
  scopePaths: string[] | undefined,
  startDir: string,
): string[] {
  const rawScopePaths = scopePaths && scopePaths.length > 0 ? scopePaths : [startDir];
  const normalized = [
    ...new Set(rawScopePaths.map((scopePath) => resolvePathWithinRoot(projectRoot, scopePath, "scope_paths"))),
  ];

  return normalized.length > 0 ? normalized : [startDir];
}

function normalizeTargetPaths(
  projectRoot: string,
  targetPaths: string[] | undefined,
  scopePaths: string[],
): string[] {
  if (!targetPaths || targetPaths.length === 0) {
    return [...scopePaths];
  }

  const normalized = normalizeScopePaths(projectRoot, targetPaths, scopePaths[0] ?? projectRoot);
  for (const targetPath of normalized) {
    if (!scopePaths.some((scopePath) => isPathWithinScope(targetPath, scopePath))) {
      throw new Error(`target_paths must stay within the work scope.`);
    }
  }

  return normalized;
}

async function readPlanTargetPaths(planPath: string): Promise<string[] | undefined> {
  const contents = await readFile(planPath, "utf8");
  const lines = contents.split(/\r?\n/);
  const targetPaths: string[] = [];
  let inFrontmatter = false;
  let collecting = false;

  for (const line of lines) {
    if (line === "---") {
      if (!inFrontmatter) {
        inFrontmatter = true;
        continue;
      }
      break;
    }

    if (!inFrontmatter) {
      continue;
    }

    if (line === "target_paths:") {
      collecting = true;
      continue;
    }

    if (collecting) {
      if (line.startsWith("  - ")) {
        targetPaths.push(parseYamlScalar(line.slice(4)));
        continue;
      }

      break;
    }
  }

  return targetPaths.length > 0 ? targetPaths : undefined;
}

function parseYamlScalar(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1).replace(/''/g, "'");
  }

  return trimmed;
}

function samePathSet(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  const leftSet = new Set(left);
  return right.every((item) => leftSet.has(item));
}

function isPathWithinScope(candidatePath: string, scopePath: string): boolean {
  const relative = path.relative(scopePath, candidatePath);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function matchesWorkStatus(work: WorkRecord, filter: WorkListFilter): boolean {
  switch (filter) {
    case "all":
      return true;
    case "open":
      return work.status === "active" || work.status === "blocked";
    default:
      return work.status === filter;
  }
}

function matchesWorkQuery(work: WorkRecord, query: string | undefined): boolean {
  if (!query) {
    return true;
  }

  const haystack = [
    work.work_id,
    work.title,
    work.slug,
    work.summary,
    work.impact,
    work.start_dir,
    ...work.scope_paths,
    ...(work.tags ?? []),
  ]
    .filter(Boolean)
    .join("\n")
    .toLowerCase();

  return haystack.includes(query);
}

function matchesWorkTag(work: WorkRecord, tag: string | undefined): boolean {
  if (!tag) {
    return true;
  }

  return (work.tags ?? []).some((candidate) => candidate.toLowerCase() === tag);
}

function matchesWorkImpact(work: WorkRecord, impact: WorkImpact | undefined): boolean {
  if (!impact) {
    return true;
  }

  return work.impact === impact;
}

function compareWorkRecords(
  left: WorkRecord,
  right: WorkRecord,
  sortBy: WorkListSortField,
  sortOrder: WorkListSortOrder,
): number {
  if (sortBy === "impact") {
    const leftRank = impactRank(left.impact);
    const rightRank = impactRank(right.impact);

    if (leftRank !== rightRank) {
      if (leftRank === undefined) {
        return sortOrder === "asc" ? -1 : 1;
      }

      if (rightRank === undefined) {
        return sortOrder === "asc" ? 1 : -1;
      }

      return sortOrder === "asc" ? leftRank - rightRank : rightRank - leftRank;
    }
  }

  const updatedAtComparison = left.updated_at.localeCompare(right.updated_at);
  if (updatedAtComparison !== 0) {
    return sortOrder === "asc" ? updatedAtComparison : -updatedAtComparison;
  }

  return left.work_id.localeCompare(right.work_id);
}

function impactRank(impact: WorkImpact | undefined): number | undefined {
  switch (impact) {
    case "low":
      return 0;
    case "medium":
      return 1;
    case "high":
      return 2;
    case "critical":
      return 3;
    default:
      return undefined;
  }
}

function stringField(value: unknown, fieldName: string): string {
  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be a string.`);
  }

  return value;
}

function optionalStringField(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function slugify(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "work";
}

function buildUniqueHumanId(existingIds: Set<string>): string {
  for (let attempt = 0; attempt < MAX_ID_ATTEMPTS; attempt += 1) {
    const candidate = buildHumanId();
    if (!existingIds.has(candidate)) {
      return candidate;
    }
  }

  throw new Error("Failed to allocate a unique short id.");
}

function buildHumanId(): string {
  const bytes = randomBytes(BASE62_ID_LENGTH);
  let id = "";

  for (let index = 0; index < BASE62_ID_LENGTH; index += 1) {
    id += BASE62_ALPHABET[bytes[index] % BASE62_ALPHABET.length];
  }

  return id;
}

function withMutationLock<T>(task: () => Promise<T>): Promise<T> {
  const result = mutationQueue.then(task, task);
  mutationQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

async function writeAtomically(targetPath: string, contents: string): Promise<void> {
  await mkdir(path.dirname(targetPath), { recursive: true });
  const tempPath = `${targetPath}.tmp-${process.pid}-${randomUUID()}`;

  try {
    await writeFile(tempPath, contents, "utf8");
    await rename(tempPath, targetPath);
  } catch (error) {
    await rm(tempPath, { force: true }).catch(() => undefined);
    throw error;
  }
}

function resolvePathWithinRoot(projectRoot: string, candidatePath: string, label: string): string {
  const candidate = path.resolve(projectRoot, candidatePath);
  const relative = path.relative(projectRoot, candidate);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`${label} must stay within the project root.`);
  }

  return candidate;
}

function resolveInsideProjectRoot(projectRoot: string, relativeFilePath: string, label: string): string {
  const candidate = path.resolve(projectRoot, relativeFilePath);
  const relative = path.relative(projectRoot, candidate);

  if (relative === "" || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`${label} must stay within the project root.`);
  }

  return candidate;
}

async function ensureDirectory(directoryPath: string): Promise<void> {
  await mkdir(directoryPath, { recursive: true });
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await access(targetPath);
    return true;
  } catch (error) {
    if (isMissingFile(error)) {
      return false;
    }

    throw error;
  }
}

function isMissingFile(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "ENOENT",
  );
}

function renderQuotedText(text: string): string[] {
  return text.split(/\r?\n/).map((line) => `> ${escapeMarkdownInline(line)}`);
}

function renderListText(text: string): string[] {
  const lines = text.split(/\r?\n/);
  return lines.map((line, index) =>
    index === 0 ? `- ${escapeMarkdownInline(line)}` : `  ${escapeMarkdownInline(line)}`,
  );
}

function escapeMarkdownInline(value: string): string {
  return value.replace(/([\\`*_{}\[\]()#+!|>])/g, "\\$1");
}

function toYamlScalar(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

export function escapePlainTextField(value: string): string {
  return value
    .replace(/\r/g, "")
    .replace(/\n/g, "\\n")
    .replace(/\t/g, "\\t");
}

export const defaults = {
  DEFAULT_JSON_FILE,
  DEFAULT_MARKDOWN_FILE,
  DEFAULT_STATE_DIR,
  DEFAULT_WORKDOCS_DIR,
  DEFAULT_WORKS_FILE,
  DEFAULT_ACTIVE_CONTEXT_FILE,
  DEFAULT_SESSION_JSON_FILE,
  DEFAULT_SESSION_MARKDOWN_FILE,
};
