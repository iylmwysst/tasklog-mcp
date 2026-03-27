import {
  formatLogEntries,
  type ActiveContextSummary,
  type AppendWorkNoteResult,
  type CreateWorkDocResult,
  type SessionLogEntry,
  type WorkContextSummary,
  type WorkListEntry,
  type WorkRecord,
} from "./logbook.js";

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
  const lines = [
    "Session log appended.",
    `ID: ${escapePlainTextField(entry.id)}`,
    `Timestamp: ${escapePlainTextField(entry.timestamp)}`,
    `Status: ${escapePlainTextField(entry.status)}`,
    `Change type: ${escapePlainTextField(entry.change_type)}`,
    `Summary: ${escapePlainTextField(entry.summary)}`,
  ];

  if (entry.work_id) {
    lines.push(`Work: ${escapePlainTextField(entry.work_id)}`);
  }

  lines.push(
    `Files: ${
      entry.affected_files.length > 0
        ? entry.affected_files.map((filePath) => escapePlainTextField(filePath)).join(", ")
        : "(none listed)"
    }`,
    `JSON log: ${escapePlainTextField(paths.jsonPath)}`,
    `Markdown log: ${escapePlainTextField(paths.markdownPath)}`,
  );

  return lines.join("\n");
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
  const lines = [
    "Log metadata amended.",
    `ID: ${escapePlainTextField(entry.id)}`,
    `Revision: ${entry.revision}`,
    `Updated: ${escapePlainTextField(entry.updated_at)}`,
  ];

  if (entry.work_id) {
    lines.push(`Work: ${escapePlainTextField(entry.work_id)}`);
  }

  lines.push(
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
  );

  return lines.join("\n");
}

export function formatActiveContextResponse(summary: ActiveContextSummary): string {
  const lines = [
    "Active context:",
    `Project root: ${escapePlainTextField(summary.project_root)}`,
    `State root: ${escapePlainTextField(summary.state_root)}`,
    `Workdocs root: ${escapePlainTextField(summary.workdocs_root)}`,
    `JSON log: ${escapePlainTextField(summary.json_path)}`,
    `Markdown log: ${escapePlainTextField(summary.markdown_path)}`,
  ];

  if (!summary.active_work) {
    lines.push("Active work: (none)");
    return lines.join("\n");
  }

  lines.push(
    `Active work: ${escapePlainTextField(summary.active_work.work_id)} ${escapePlainTextField(summary.active_work.title)}`,
    `Freshness: ${escapePlainTextField(summary.freshness ?? "unknown")}`,
    `Scope: ${summary.active_work.scope_paths.map((scopePath) => escapePlainTextField(scopePath)).join(", ")}`,
  );

  return lines.join("\n");
}

export function formatWorkListResponse(
  works: WorkListEntry[],
  context: Pick<ActiveContextSummary, "project_root" | "workdocs_root">,
): string {
  if (works.length === 0) {
    return [
      "Works:",
      `Project root: ${escapePlainTextField(context.project_root)}`,
      `Workdocs root: ${escapePlainTextField(context.workdocs_root)}`,
      "",
      "No works found.",
    ].join("\n");
  }

  const lines = [
    "Works:",
    `Project root: ${escapePlainTextField(context.project_root)}`,
    `Workdocs root: ${escapePlainTextField(context.workdocs_root)}`,
    "",
  ];

  for (const work of works) {
    lines.push(
      `- ${escapePlainTextField(work.work_id)} [${escapePlainTextField(work.status)}] ${escapePlainTextField(work.title)}`,
      `  Start: ${escapePlainTextField(work.start_dir)}`,
      `  Scope: ${work.scope_paths.map((scopePath) => escapePlainTextField(scopePath)).join(", ")}`,
    );

    if (work.last_log_summary) {
      lines.push(`  Last log: ${escapePlainTextField(work.last_log_summary)}`);
    }

    if (work.next_step_summary) {
      lines.push(`  Next step: ${escapePlainTextField(work.next_step_summary)}`);
    }

    lines.push(
      `  Artifacts: design=${work.artifact_availability.design} plan=${work.artifact_availability.plan} spec=${work.artifact_availability.spec} notes=${work.artifact_availability.notes}`,
    );
  }

  return lines.join("\n");
}

export function formatWorkCreatedResponse(work: WorkRecord, workDir: string): string {
  return [
    "Work started.",
    `Work ID: ${escapePlainTextField(work.work_id)}`,
    `Title: ${escapePlainTextField(work.title)}`,
    `Status: ${escapePlainTextField(work.status)}`,
    `Start dir: ${escapePlainTextField(work.start_dir)}`,
    `Scope: ${work.scope_paths.map((scopePath) => escapePlainTextField(scopePath)).join(", ")}`,
    `Work dir: ${escapePlainTextField(workDir)}`,
  ].join("\n");
}

export function formatWorkStatusResponse(work: WorkRecord): string {
  return [
    "Work status updated.",
    `Work ID: ${escapePlainTextField(work.work_id)}`,
    `Status: ${escapePlainTextField(work.status)}`,
    `Updated: ${escapePlainTextField(work.updated_at)}`,
  ].join("\n");
}

export function formatWorkContextResponse(context: WorkContextSummary): string {
  return [
    `Work context: ${escapePlainTextField(context.work.work_id)} ${escapePlainTextField(context.work.title)}`,
    `Status: ${escapePlainTextField(context.work.status)}`,
    `Start dir: ${escapePlainTextField(context.work.start_dir)}`,
    `Scope: ${context.work.scope_paths.map((scopePath) => escapePlainTextField(scopePath)).join(", ")}`,
    `Docs: design=${escapePlainTextField(context.artifact_paths.designPath)} plan=${escapePlainTextField(context.artifact_paths.planPath)} spec=${escapePlainTextField(context.artifact_paths.specPath)} notes=${escapePlainTextField(context.artifact_paths.notesPath)}`,
    context.next_step_summary
      ? `Next step: ${escapePlainTextField(context.next_step_summary)}`
      : "Next step: (none recorded)",
    "",
    formatLogEntries(context.recent_logs),
  ].join("\n");
}

export function formatWorkDocResponse(
  label: string,
  result: CreateWorkDocResult | AppendWorkNoteResult,
): string {
  const lines = [
    `${label}:`,
    `Work ID: ${escapePlainTextField(result.work.work_id)}`,
    `Title: ${escapePlainTextField(result.work.title)}`,
    `Path: ${escapePlainTextField(result.path)}`,
    `Created: ${result.created}`,
  ];

  const targetPaths =
    "target_paths" in result && Array.isArray(result.target_paths) ? result.target_paths : undefined;

  if (targetPaths && targetPaths.length > 0) {
    lines.push(
      `Target paths: ${targetPaths
        .map((targetPath) => escapePlainTextField(targetPath))
        .join(", ")}`,
    );
  }

  return lines.join("\n");
}

export function escapePlainTextField(value: string): string {
  return value
    .replace(/\r/g, "")
    .replace(/\n/g, "\\n")
    .replace(/\t/g, "\\t");
}
