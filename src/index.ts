#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readServerConfig } from "./config.js";
import {
  amendLogMetadata,
  appendLogEntry,
  appendWorkNote,
  APPENDABLE_LOG_STATUSES,
  ACTIVE_WORK_FRESHNESS,
  CHANGE_TYPES,
  createWorkDoc,
  getActiveContext,
  getOpenThreadEntries,
  getRecentLogEntries,
  listWorks,
  LOG_STATUSES,
  readWorkContext,
  resumeWork,
  setWorkImpact,
  setWorkStatus,
  startWork,
  type ActiveContextSummary,
  type AmendLogMetadataInput,
  type LogStatus,
  type SessionLogEntry,
  type WorkImpact,
  type WorkStatus,
  WORK_CONTEXT_MODES,
  WORK_IMPACTS,
  WORK_STATUSES,
  updateLogStatus,
} from "./logbook.js";
import { createLogger, serializeError, type Logger } from "./logger.js";
import {
  formatActiveContextResponse,
  formatAppendResponse,
  formatMetadataAmendResponse,
  formatReadResponse,
  formatStatusUpdateResponse,
  formatWorkContextResponse,
  formatWorkCreatedResponse,
  formatWorkDocResponse,
  formatWorkImpactResponse,
  formatWorkListResponse,
  formatWorkStatusResponse,
} from "./response-format.js";
import {
  EXAMPLES_RESOURCE_TEXT,
  SCHEMA_RESOURCE_TEXT,
  USAGE_RESOURCE_TEXT,
} from "./resources.js";

const logger = createLogger();
const WORK_LIST_FILTERS = ["open", "active", "blocked", "done", "all"] as const;
const WORK_LIST_SORT_FIELDS = ["updated_at", "impact"] as const;
const WORK_LIST_SORT_ORDERS = ["desc", "asc"] as const;

process.on("uncaughtException", (error) => {
  logger.error("process.uncaught_exception", serializeError(error));
});

process.on("unhandledRejection", (reason) => {
  logger.error("process.unhandled_rejection", serializeError(reason));
});

async function main(): Promise<void> {
  const config = readServerConfig(process.argv.slice(2), process.env, logger);
  const server = new McpServer(
    {
      name: "tasklog-mcp",
      version: "0.3.0",
    },
    {
      capabilities: {
        logging: {},
      },
    },
  );

  registerResources(server);
  registerTools(server, config.paths, logger);

  logger.info("server.starting", {
    cwd: process.cwd(),
    project_root: config.paths.projectRoot,
    json_path: config.paths.jsonPath,
    markdown_path: config.paths.markdownPath,
    workdocs_root: config.paths.workdocsRoot,
    state_root: config.paths.stateRoot,
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info("server.ready", {
    project_root: config.paths.projectRoot,
    tools: 15,
    resources: 3,
  });
}

function registerResources(server: McpServer): void {
  server.registerResource(
    "tasklog-usage",
    "tasklog://usage",
    {
      title: "Tasklog usage guide",
      description: "Rules for the work-first Tasklog workflow and artifact selection.",
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [{ uri: uri.href, text: USAGE_RESOURCE_TEXT }],
    }),
  );

  server.registerResource(
    "tasklog-schema",
    "tasklog://schema",
    {
      title: "Tasklog schema",
      description: "Current data model for work records, session logs, and active context.",
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [{ uri: uri.href, text: SCHEMA_RESOURCE_TEXT }],
    }),
  );

  server.registerResource(
    "tasklog-examples",
    "tasklog://examples",
    {
      title: "Tasklog examples",
      description: "Examples for work-first logs, works, and artifact creation.",
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [{ uri: uri.href, text: EXAMPLES_RESOURCE_TEXT }],
    }),
  );
}

function registerTools(
  server: McpServer,
  paths: Parameters<typeof getRecentLogEntries>[0],
  logger: Logger,
): void {
  server.registerTool(
    "get_active_context",
    {
      title: "Get active context",
      description:
        "Return the inferred project roots, canonical log paths, workdocs root, and current active work state for this session.",
      inputSchema: {},
      outputSchema: activeContextShape(),
    },
    observeToolCall(logger, "get_active_context", async () => {
      const summary = await getActiveContext(paths);
      return {
        content: [{ type: "text", text: formatActiveContextResponse(summary) }],
        structuredContent: summary,
      };
    }),
  );

  server.registerTool(
    "list_works",
    {
      title: "List works",
      description:
        "List work items for the current project. Prefer this over open-thread log discovery when the user asks what is still open.",
      inputSchema: {
        status: z
          .enum(WORK_LIST_FILTERS)
          .default("open")
          .describe("Which work statuses to include."),
        query: z.string().default("").describe("Optional text search across title, scope, summary, impact, and tags."),
        tag: z.string().default("").describe("Optional exact tag filter for narrowing unfinished work."),
        impact: z
          .enum(WORK_IMPACTS)
          .optional()
          .describe("Optional impact filter when you want to focus on low, medium, high, or critical work."),
        sort_by: z
          .enum(WORK_LIST_SORT_FIELDS)
          .default("updated_at")
          .describe("Which field to sort by when listing work items."),
        sort_order: z
          .enum(WORK_LIST_SORT_ORDERS)
          .default("desc")
          .describe("Whether to sort ascending or descending."),
        limit: z.number().int().min(1).max(100).default(10).describe("Maximum number of works to return."),
      },
      outputSchema: {
        project_root: z.string(),
        workdocs_root: z.string(),
        count: z.number().int(),
        works: z.array(workListEntrySchema()),
      },
    },
    observeToolCall(logger, "list_works", async ({ status, query, tag, impact, sort_by, sort_order, limit }) => {
      const summary = await getActiveContext(paths);
      const works = await listWorks(paths, {
        status,
        query,
        tag,
        impact,
        sort_by,
        sort_order,
        limit,
      });

      return {
        content: [
          {
            type: "text",
            text: formatWorkListResponse(works, {
              project_root: summary.project_root,
              workdocs_root: summary.workdocs_root,
            }),
          },
        ],
        structuredContent: {
          project_root: summary.project_root,
          workdocs_root: summary.workdocs_root,
          count: works.length,
          works,
        },
      };
    }),
  );

  server.registerTool(
    "start_work",
    {
      title: "Start work",
      description:
        "Create a new work, generate a short work id, persist work metadata, and mark it as the active work for this session.",
      inputSchema: {
        title: z.string().min(1).describe("Human-readable work title."),
        summary: z.string().default("").describe("Optional short summary of the work intent."),
        tags: z.array(z.string().min(1)).default([]).describe("Optional lowercase project tags."),
        impact: z.enum(WORK_IMPACTS).optional().describe("Optional work-level impact for later re-entry and prioritization."),
        start_dir: z.string().default("").describe("Optional directory where the work begins. Defaults to the project root."),
        scope_paths: z.array(z.string().min(1)).default([]).describe("Optional directories this work may touch. Defaults to the start directory."),
      },
      outputSchema: {
        project_root: z.string(),
        work: workRecordSchema(),
        artifact_paths: workArtifactPathsSchema(),
      },
    },
    observeToolCall(logger, "start_work", async ({ title, summary, tags, impact, start_dir, scope_paths }) => {
      const work = await startWork(paths, {
        title,
        summary,
        tags,
        impact: impact as WorkImpact | undefined,
        start_dir,
        scope_paths,
      });
      const context = await readWorkContext(paths, work.work_id);

      return {
        content: [{ type: "text", text: formatWorkCreatedResponse(work, context.artifact_paths.workDir) }],
        structuredContent: {
          project_root: paths.projectRoot,
          work,
          artifact_paths: context.artifact_paths,
        },
      };
    }),
  );

  server.registerTool(
    "resume_work",
    {
      title: "Resume work",
      description:
        "Set the active work for this session by work id or query. Use this before reading work context or writing work-scoped logs.",
      inputSchema: {
        work_id: z.string().default("").describe("Exact work id to resume."),
        query: z.string().default("").describe("Optional text query if the work id is not known."),
      },
      outputSchema: activeContextShape(),
    },
    observeToolCall(logger, "resume_work", async ({ work_id, query }) => {
      if (!work_id && !query) {
        throw new Error("resume_work requires either work_id or query.");
      }

      const summary = await resumeWork(paths, {
        work_id: work_id || undefined,
        query: query || undefined,
      });

      return {
        content: [{ type: "text", text: formatActiveContextResponse(summary) }],
        structuredContent: summary,
      };
    }),
  );

  server.registerTool(
    "set_work_status",
    {
      title: "Set work status",
      description: "Update the lifecycle status of a work item.",
      inputSchema: {
        work_id: z.string().min(1).describe("Work id to update."),
        status: z.enum(WORK_STATUSES).describe("New work status."),
      },
      outputSchema: {
        work: workRecordSchema(),
      },
    },
    observeToolCall(logger, "set_work_status", async ({ work_id, status }) => {
      const work = await setWorkStatus(paths, work_id, status as WorkStatus);
      return {
        content: [{ type: "text", text: formatWorkStatusResponse(work) }],
        structuredContent: { work },
      };
    }),
  );

  server.registerTool(
    "set_work_impact",
    {
      title: "Set work impact",
      description:
        "Set or clear the work-level impact metadata used to judge how important this work is to remember during re-entry.",
      inputSchema: {
        work_id: z.string().min(1).describe("Work id to update."),
        impact: z
          .enum(WORK_IMPACTS)
          .optional()
          .describe("New work impact. Omit to clear the field."),
      },
      outputSchema: {
        work: workRecordSchema(),
      },
    },
    observeToolCall(logger, "set_work_impact", async ({ work_id, impact }) => {
      const work = await setWorkImpact(paths, work_id, impact as WorkImpact | undefined);
      return {
        content: [{ type: "text", text: formatWorkImpactResponse(work) }],
        structuredContent: { work },
      };
    }),
  );

  server.registerTool(
    "read_work_context",
    {
      title: "Read work context",
      description:
        "Return a concise overview of one work including artifact paths, context mode, recent logs, and optional summary loading for consolidated closed work.",
      inputSchema: {
        work_id: z.string().default("").describe("Optional explicit work id. Defaults to the active work when unambiguous."),
        include_summary: z
          .boolean()
          .default(false)
          .describe("When true, inline summary.md for consolidated closed work. Leave false for the cheaper default re-entry path."),
        include_recent_logs: z
          .boolean()
          .default(false)
          .describe("When true, include recent raw log evidence for consolidated closed work. Active and closed/raw work still include logs by default."),
      },
      outputSchema: {
        context: workContextSchema(),
      },
    },
    observeToolCall(logger, "read_work_context", async ({ work_id, include_summary, include_recent_logs }) => {
      const context = await readWorkContext(paths, work_id || undefined, {
        include_summary,
        include_recent_logs,
      });
      const publicContext = toPublicWorkContext(context);
      return {
        content: [{ type: "text", text: formatWorkContextResponse(publicContext) }],
        structuredContent: { context: publicContext },
      };
    }),
  );

  server.registerTool(
    "get_recent_logs",
    {
      title: "Get recent session logs",
      description:
        "Read recent session summaries. Defaults to the active work when one is fresh; otherwise falls back to project-wide history.",
      inputSchema: {
        limit: z.number().int().min(1).max(50).default(5).describe("How many recent log entries to return."),
        work_id: z.string().default("").describe("Optional explicit work id filter."),
        project_wide: z.boolean().default(false).describe("When true, ignore the active work and read project-wide history."),
      },
      outputSchema: {
        project_root: z.string(),
        json_path: z.string(),
        markdown_path: z.string(),
        count: z.number().int(),
        entries: z.array(logEntrySchema()),
      },
    },
    observeToolCall(logger, "get_recent_logs", async ({ limit, work_id, project_wide }) => {
      const entries = await getRecentLogEntries(paths, limit, {
        work_id: work_id || undefined,
        project_wide,
      });
      return {
        content: [{ type: "text", text: formatReadResponse("Recent logs", entries, paths) }],
        structuredContent: {
          project_root: paths.projectRoot,
          json_path: paths.jsonPath,
          markdown_path: paths.markdownPath,
          count: entries.length,
          entries,
        },
      };
    }),
  );

  server.registerTool(
    "append_session_log",
    {
      title: "Append a project session log",
      description:
        "Append a new session activity log. The tool will attach a work id automatically when the active work is fresh, or accept an explicit work id.",
      inputSchema: {
        summary: z.string().min(1).describe("One or two sentences describing what changed and why or what outcome it produced."),
        status: z.enum(APPENDABLE_LOG_STATUSES).describe("Progress state for this newly appended entry."),
        change_type: z.enum(CHANGE_TYPES).describe("Type of work performed in this entry."),
        affected_files: z.array(z.string().min(1)).default([]).describe("Relative paths for files actually edited."),
        tags: z.array(z.string().min(1)).default([]).describe("Optional project-specific tags, ideally lowercase and concise."),
        next_steps: z.string().default("").describe("Optional note describing what the next session should do."),
        blockers: z.string().default("").describe("Optional note describing why work cannot currently proceed."),
        related_log_ids: z.array(z.string().min(1)).default([]).describe("Optional IDs of earlier entries this work relates to."),
        supersedes_log_id: z.string().default("").describe("Optional older entry this new entry takes over."),
        work_id: z.string().default("").describe("Optional explicit work id for this session log."),
      },
      outputSchema: {
        project_root: z.string(),
        json_path: z.string(),
        markdown_path: z.string(),
        entry: logEntrySchema(),
      },
    },
    observeToolCall(
      logger,
      "append_session_log",
      async ({
        summary,
        status,
        change_type,
        affected_files,
        tags,
        next_steps,
        blockers,
        related_log_ids,
        supersedes_log_id,
        work_id,
      }) => {
        const entry = await appendLogEntry(paths, {
          summary,
          status,
          change_type,
          affected_files,
          tags,
          next_steps,
          blockers,
          related_log_ids,
          supersedes_log_id,
          work_id: work_id || undefined,
        });

        return {
          content: [{ type: "text", text: formatAppendResponse(entry, paths) }],
          structuredContent: {
            project_root: paths.projectRoot,
            json_path: paths.jsonPath,
            markdown_path: paths.markdownPath,
            entry,
          },
        };
      },
    ),
  );

  server.registerTool(
    "create_design_doc",
    {
      title: "Create design doc",
      description:
        "Create or reopen design.md for the active work using the standard workdoc template.",
      inputSchema: {
        work_id: z.string().default("").describe("Optional explicit work id. Defaults to the active work when unambiguous."),
      },
      outputSchema: workDocOutputShape(),
    },
    observeToolCall(logger, "create_design_doc", async ({ work_id }) => {
      const result = await createWorkDoc(paths, "design", { work_id: work_id || undefined });
      return {
        content: [{ type: "text", text: formatWorkDocResponse("Design doc ready", result) }],
        structuredContent: result,
      };
    }),
  );

  server.registerTool(
    "create_plan_doc",
    {
      title: "Create plan doc",
      description:
        "Create or reopen plan.md for the active work. target_paths may narrow the implementation pass to a subset of the work scope.",
      inputSchema: {
        work_id: z.string().default("").describe("Optional explicit work id. Defaults to the active work when unambiguous."),
        target_paths: z.array(z.string().min(1)).default([]).describe("Optional subset of the work scope for this implementation pass."),
      },
      outputSchema: workDocOutputShape(),
    },
    observeToolCall(logger, "create_plan_doc", async ({ work_id, target_paths }) => {
      const result = await createWorkDoc(paths, "plan", {
        work_id: work_id || undefined,
        target_paths,
      });
      return {
        content: [{ type: "text", text: formatWorkDocResponse("Plan doc ready", result) }],
        structuredContent: result,
      };
    }),
  );

  server.registerTool(
    "create_spec_doc",
    {
      title: "Create spec doc",
      description:
        "Create or reopen spec.md for the active work using the standard workdoc template.",
      inputSchema: {
        work_id: z.string().default("").describe("Optional explicit work id. Defaults to the active work when unambiguous."),
      },
      outputSchema: workDocOutputShape(),
    },
    observeToolCall(logger, "create_spec_doc", async ({ work_id }) => {
      const result = await createWorkDoc(paths, "spec", { work_id: work_id || undefined });
      return {
        content: [{ type: "text", text: formatWorkDocResponse("Spec doc ready", result) }],
        structuredContent: result,
      };
    }),
  );

  server.registerTool(
    "create_summary_doc",
    {
      title: "Create summary doc",
      description:
        "Create or reopen summary.md for a done work item so the closed work has a canonical re-entry brief.",
      inputSchema: {
        work_id: z.string().default("").describe("Optional explicit work id. Defaults to the active work when unambiguous."),
      },
      outputSchema: workDocOutputShape(),
    },
    observeToolCall(logger, "create_summary_doc", async ({ work_id }) => {
      const result = await createWorkDoc(paths, "summary", { work_id: work_id || undefined });
      return {
        content: [{ type: "text", text: formatWorkDocResponse("Summary doc ready", result) }],
        structuredContent: result,
      };
    }),
  );

  server.registerTool(
    "append_work_note",
    {
      title: "Append work note",
      description:
        "Append a lightweight note to notes.md for the active work. Use this when the user says to note something down.",
      inputSchema: {
        work_id: z.string().default("").describe("Optional explicit work id. Defaults to the active work when unambiguous."),
        note: z.string().min(1).describe("Note text to append."),
      },
      outputSchema: {
        work: workRecordSchema(),
        path: z.string(),
        created: z.boolean(),
      },
    },
    observeToolCall(logger, "append_work_note", async ({ work_id, note }) => {
      const result = await appendWorkNote(paths, {
        work_id: work_id || undefined,
        note,
      });
      return {
        content: [{ type: "text", text: formatWorkDocResponse("Work note appended", result) }],
        structuredContent: result,
      };
    }),
  );

  server.registerTool(
    "get_open_threads",
    {
      title: "Get open threads",
      description:
        "Deprecated compatibility surface. Returns unresolved or follow-up-worthy log entries, but prefer list_works(status=\"open\") for work-first discovery.",
      inputSchema: {
        limit: z.number().int().min(1).max(50).default(10).describe("How many open threads to return."),
      },
      outputSchema: {
        project_root: z.string(),
        json_path: z.string(),
        markdown_path: z.string(),
        count: z.number().int(),
        entries: z.array(logEntrySchema()),
      },
    },
    observeToolCall(logger, "get_open_threads", async ({ limit }) => {
      const entries = await getOpenThreadEntries(paths, limit);
      return {
        content: [{ type: "text", text: formatReadResponse("Open threads", entries, paths) }],
        structuredContent: {
          project_root: paths.projectRoot,
          json_path: paths.jsonPath,
          markdown_path: paths.markdownPath,
          count: entries.length,
          entries,
        },
      };
    }),
  );

  server.registerTool(
    "update_log_status",
    {
      title: "Update log status",
      description:
        "Change only the lifecycle status of an existing log entry without rewriting its summary.",
      inputSchema: {
        log_id: z.string().min(1).describe("ID of the log entry to update."),
        status: z.enum(LOG_STATUSES).describe("New lifecycle status for the existing entry."),
      },
      outputSchema: {
        entry: logEntrySchema(),
      },
    },
    observeToolCall(logger, "update_log_status", async ({ log_id, status }) => {
      const entry = await updateLogStatus(paths, log_id, status as LogStatus);
      return {
        content: [{ type: "text", text: formatStatusUpdateResponse(entry) }],
        structuredContent: { entry },
      };
    }),
  );

  server.registerTool(
    "amend_log_metadata",
    {
      title: "Amend log metadata",
      description:
        "Amend limited metadata on an existing entry. Use this for affected_files, tags, next_steps, or blockers only.",
      inputSchema: {
        log_id: z.string().min(1).describe("ID of the log entry to amend."),
        affected_files: z.array(z.string().min(1)).optional().describe("Replacement file list if the original missed edited files."),
        tags: z.array(z.string().min(1)).optional().describe("Replacement tag list."),
        next_steps: z.string().optional().describe("Replacement next-steps note. Use an empty string to clear it."),
        blockers: z.string().optional().describe("Replacement blocker note. Use an empty string to clear it."),
      },
      outputSchema: {
        entry: logEntrySchema(),
      },
    },
    observeToolCall(
      logger,
      "amend_log_metadata",
      async ({ log_id, affected_files, tags, next_steps, blockers }) => {
        const patch: AmendLogMetadataInput = {
          affected_files,
          tags,
          next_steps,
          blockers,
        };

        if (
          affected_files === undefined &&
          tags === undefined &&
          next_steps === undefined &&
          blockers === undefined
        ) {
          throw new Error("amend_log_metadata requires at least one metadata field to change.");
        }

        const entry = await amendLogMetadata(paths, log_id, patch);
        return {
          content: [{ type: "text", text: formatMetadataAmendResponse(entry) }],
          structuredContent: { entry },
        };
      },
    ),
  );
}

function logEntrySchema() {
  return z.object({
    id: z.string(),
    work_id: z.string().optional(),
    timestamp: z.string(),
    summary: z.string(),
    status: z.enum(LOG_STATUSES),
    change_type: z.enum(CHANGE_TYPES),
    affected_files: z.array(z.string()),
    tags: z.array(z.string()).optional(),
    next_steps: z.string().optional(),
    blockers: z.string().optional(),
    related_log_ids: z.array(z.string()).optional(),
    supersedes_log_id: z.string().optional(),
    revision: z.number().int(),
    created_at: z.string(),
    updated_at: z.string(),
  });
}

function workRecordSchema() {
  return z.object({
    work_id: z.string(),
    title: z.string(),
    slug: z.string(),
    status: z.enum(WORK_STATUSES),
    impact: z.enum(WORK_IMPACTS).optional(),
    start_dir: z.string(),
    scope_paths: z.array(z.string()),
    summary: z.string().optional(),
    tags: z.array(z.string()).optional(),
    created_at: z.string(),
    updated_at: z.string(),
  });
}

function artifactAvailabilitySchema() {
  return z.object({
    design: z.boolean(),
    plan: z.boolean(),
    spec: z.boolean(),
    summary: z.boolean(),
    notes: z.boolean(),
  });
}

function workArtifactPathsSchema() {
  return z.object({
    workDir: z.string(),
    designPath: z.string(),
    planPath: z.string(),
    specPath: z.string(),
    summaryPath: z.string(),
    notesPath: z.string(),
  });
}

function workListEntrySchema() {
  return workRecordSchema().extend({
    artifact_availability: artifactAvailabilitySchema(),
    context_mode: z.enum(WORK_CONTEXT_MODES),
    last_log_summary: z.string().optional(),
    next_step_summary: z.string().optional(),
    recent_log_id: z.string().optional(),
  });
}

function workContextSchema() {
  return z.object({
    work: workRecordSchema(),
    artifact_paths: workArtifactPathsSchema(),
    artifact_availability: artifactAvailabilitySchema(),
    context_mode: z.enum(WORK_CONTEXT_MODES),
    recent_logs: z.array(logEntrySchema()),
    recent_log_count: z.number().int(),
    next_step_summary: z.string().optional(),
    summary_text: z.string().optional(),
  });
}

function toPublicWorkContext(context: Awaited<ReturnType<typeof readWorkContext>>) {
  const { reentry_brief: _reentryBrief, ...publicContext } = context;
  return publicContext;
}

function activeContextShape() {
  return {
    active_work_id: z.string().optional(),
    project_root: z.string(),
    updated_at: z.string().optional(),
    state_root: z.string(),
    workdocs_root: z.string(),
    json_path: z.string(),
    markdown_path: z.string(),
    active_work: workRecordSchema().optional(),
    freshness: z.enum(ACTIVE_WORK_FRESHNESS).optional(),
  };
}

function workDocOutputShape() {
  return {
    work: workRecordSchema(),
    path: z.string(),
    created: z.boolean(),
    target_paths: z.array(z.string()).optional(),
  };
}

function observeToolCall<Args extends Record<string, unknown>, Result>(
  logger: Logger,
  toolName: string,
  handler: (args: Args) => Promise<Result>,
): (args: Args) => Promise<Result> {
  return async (args: Args) => {
    const toolLogger = logger.child({ tool: toolName });
    toolLogger.debug("tool.started", summarizeToolArgs(args));

    try {
      const result = await handler(args);
      toolLogger.debug("tool.succeeded", summarizeToolResult(result));
      return result;
    } catch (error) {
      toolLogger.error("tool.failed", {
        ...summarizeToolArgs(args),
        ...serializeError(error),
      });
      throw error;
    }
  };
}

function summarizeToolArgs(args: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(args).map(([key, value]) => {
      if (Array.isArray(value)) {
        return [key, { type: "array", length: value.length }];
      }

      if (typeof value === "string") {
        return [key, { type: "string", length: value.length }];
      }

      return [key, value];
    }),
  );
}

function summarizeToolResult(result: unknown): Record<string, unknown> {
  if (!result || typeof result !== "object") {
    return {};
  }

  const candidate = result as { structuredContent?: unknown };
  if (!candidate.structuredContent || typeof candidate.structuredContent !== "object") {
    return {};
  }

  const structured = candidate.structuredContent as Record<string, unknown>;
  return {
    has_entry: typeof structured.entry === "object" && structured.entry !== null,
    has_work: typeof structured.work === "object" && structured.work !== null,
    count: typeof structured.count === "number" ? structured.count : undefined,
  };
}

main().catch((error: unknown) => {
  logger.error("server.start_failed", serializeError(error));
  process.exit(1);
});
