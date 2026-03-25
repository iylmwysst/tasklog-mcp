import { formatLogEntries, type SessionLogEntry } from "./logbook.js";

interface LogPathsSummary {
  projectRoot: string;
  jsonPath: string;
  markdownPath: string;
}

export function formatReadResponse(
  label: string,
  entries: SessionLogEntry[],
  paths: LogPathsSummary,
): string {
  return [
    `${label}:`,
    `Project root: ${escapePlainTextField(paths.projectRoot)}`,
    `JSON log: ${escapePlainTextField(paths.jsonPath)}`,
    `Markdown log: ${escapePlainTextField(paths.markdownPath)}`,
    "",
    formatLogEntries(entries),
  ].join("\n");
}

export function formatAppendResponse(
  entry: SessionLogEntry,
  paths: Pick<LogPathsSummary, "jsonPath" | "markdownPath">,
): string {
  return [
    "Session log appended.",
    `ID: ${escapePlainTextField(entry.id)}`,
    `Timestamp: ${escapePlainTextField(entry.timestamp)}`,
    `Status: ${escapePlainTextField(entry.status)}`,
    `Change type: ${escapePlainTextField(entry.change_type)}`,
    `Summary: ${escapePlainTextField(entry.summary)}`,
    `Files: ${
      entry.affected_files.length > 0
        ? entry.affected_files.map((filePath) => escapePlainTextField(filePath)).join(", ")
        : "(none listed)"
    }`,
    `JSON log: ${escapePlainTextField(paths.jsonPath)}`,
    `Markdown log: ${escapePlainTextField(paths.markdownPath)}`,
  ].join("\n");
}

export function formatStatusUpdateResponse(entry: SessionLogEntry): string {
  return [
    "Log status updated.",
    `ID: ${escapePlainTextField(entry.id)}`,
    `Status: ${escapePlainTextField(entry.status)}`,
    `Revision: ${entry.revision}`,
    `Updated: ${escapePlainTextField(entry.updated_at)}`,
  ].join("\n");
}

export function formatMetadataAmendResponse(entry: SessionLogEntry): string {
  return [
    "Log metadata amended.",
    `ID: ${escapePlainTextField(entry.id)}`,
    `Revision: ${entry.revision}`,
    `Updated: ${escapePlainTextField(entry.updated_at)}`,
    `Files: ${
      entry.affected_files.length > 0
        ? entry.affected_files.map((filePath) => escapePlainTextField(filePath)).join(", ")
        : "(none listed)"
    }`,
    `Tags: ${
      entry.tags && entry.tags.length > 0
        ? entry.tags.map((tag) => escapePlainTextField(tag)).join(", ")
        : "(none listed)"
    }`,
  ].join("\n");
}

export function escapePlainTextField(value: string): string {
  return value
    .replace(/\r/g, "")
    .replace(/\n/g, "\\n")
    .replace(/\t/g, "\\t");
}
