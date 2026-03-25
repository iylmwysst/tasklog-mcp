import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
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

export type AppendableLogStatus = (typeof APPENDABLE_LOG_STATUSES)[number];
export type LogStatus = (typeof LOG_STATUSES)[number];
export type ChangeType = (typeof CHANGE_TYPES)[number];

export interface SessionLogEntry {
  id: string;
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

export interface LogbookPaths {
  projectRoot: string;
  jsonPath: string;
  markdownPath: string;
  logger?: Logger;
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
}

export interface AmendLogMetadataInput {
  affected_files?: string[];
  tags?: string[];
  next_steps?: string;
  blockers?: string;
}

const DEFAULT_JSON_FILE = ".ai-history.json";
const DEFAULT_MARKDOWN_FILE = ".ai-session-log.md";
let mutationQueue: Promise<void> = Promise.resolve();

export function resolveLogbookPaths(
  projectRoot: string,
  jsonFile = DEFAULT_JSON_FILE,
  markdownFile = DEFAULT_MARKDOWN_FILE,
  logger?: Logger,
): LogbookPaths {
  const normalizedProjectRoot = path.resolve(projectRoot);
  return {
    projectRoot: normalizedProjectRoot,
    jsonPath: resolveInsideProjectRoot(normalizedProjectRoot, jsonFile, "json-file"),
    markdownPath: resolveInsideProjectRoot(normalizedProjectRoot, markdownFile, "markdown-file"),
    logger,
  };
}

export async function readLogEntries(paths: LogbookPaths): Promise<SessionLogEntry[]> {
  try {
    const raw = await readFile(paths.jsonPath, "utf8");
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      throw new Error(`Expected ${paths.jsonPath} to contain a JSON array.`);
    }

    return parsed.map((entry, index) => normalizeEntry(entry, index));
  } catch (error) {
    if (isMissingFile(error)) {
      return [];
    }

    paths.logger?.error("logbook.read_failed", {
      project_root: paths.projectRoot,
      json_path: paths.jsonPath,
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
    const currentEntries = await readLogEntries(paths);
    const now = new Date().toISOString();
    const entry: SessionLogEntry = {
      id: buildLogId(),
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

    await persistEntries(paths, nextEntries);
    return entry;
  });
}

export async function getRecentLogEntries(
  paths: LogbookPaths,
  limit: number,
): Promise<SessionLogEntry[]> {
  const entries = await readLogEntries(paths);
  const safeLimit = normalizeLimit(limit, 3, 50);
  return entries.slice(-safeLimit).reverse();
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
    const entry = findEntry(entries, logId);
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
    const entry = findEntry(entries, logId);
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
    timestamp,
    summary: stringField(entry.summary, "summary"),
    status: normalizeStatus(rawStatus ?? "Done"),
    change_type: normalizeChangeType(resolveChangeType(rawChangeType, rawStatus)),
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

async function persistEntries(paths: LogbookPaths, entries: SessionLogEntry[]): Promise<void> {
  try {
    await mkdir(paths.projectRoot, { recursive: true });
    await writeAtomically(paths.jsonPath, `${JSON.stringify(entries, null, 2)}\n`);
    await writeAtomically(paths.markdownPath, renderMarkdown(entries));
  } catch (error) {
    paths.logger?.error("logbook.persist_failed", {
      project_root: paths.projectRoot,
      json_path: paths.jsonPath,
      markdown_path: paths.markdownPath,
      entry_count: entries.length,
      error: error instanceof Error ? error.message : String(error),
    });
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
            "",
            ...renderQuotedText(entry.summary),
            "",
            "**Affected files**",
            "",
            ...(entry.affected_files.length > 0
              ? entry.affected_files.map((filePath) => `- ${escapeMarkdownInline(filePath)}`)
              : ["- (none listed)"]),
          ];

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

function markSuperseded(entries: SessionLogEntry[], logId: string, now: string): void {
  const previousEntry = entries.find((entry) => entry.id === logId);
  if (!previousEntry) {
    throw new Error(`Log entry not found for supersedes_log_id: ${logId}`);
  }

  previousEntry.status = "Superseded";
  previousEntry.revision += 1;
  previousEntry.updated_at = now;
}

function findEntry(entries: SessionLogEntry[], logId: string): SessionLogEntry {
  const entry = entries.find((item) => item.id === logId);
  if (!entry) {
    throw new Error(`Log entry not found: ${logId}`);
  }

  return entry;
}

function resolveChangeType(rawChangeType: string | undefined, rawStatus: string | undefined): ChangeType {
  if (rawChangeType) {
    return rawChangeType as ChangeType;
  }

  if (rawStatus && CHANGE_TYPES.includes(rawStatus.toLowerCase() as ChangeType)) {
    return rawStatus.toLowerCase() as ChangeType;
  }

  return "investigation";
}

function normalizeSummary(summary: string): string {
  const trimmed = summary.trim();
  if (!trimmed) {
    throw new Error("summary must not be empty.");
  }

  return trimmed;
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

function normalizeChangeType(changeType: string): ChangeType {
  if (CHANGE_TYPES.includes(changeType as ChangeType)) {
    return changeType as ChangeType;
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

function stringField(value: unknown, fieldName: string): string {
  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be a string.`);
  }

  return value;
}

function optionalStringField(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function buildLogId(): string {
  return `log-${randomUUID()}`;
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

function resolveInsideProjectRoot(projectRoot: string, relativeFilePath: string, label: string): string {
  const candidate = path.resolve(projectRoot, relativeFilePath);
  const relative = path.relative(projectRoot, candidate);

  if (relative === "" || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`${label} must stay within the project root.`);
  }

  return candidate;
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

function escapePlainTextField(value: string): string {
  return value
    .replace(/\r/g, "")
    .replace(/\n/g, "\\n")
    .replace(/\t/g, "\\t");
}

function isMissingFile(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

export const defaults = {
  DEFAULT_JSON_FILE,
  DEFAULT_MARKDOWN_FILE,
};
