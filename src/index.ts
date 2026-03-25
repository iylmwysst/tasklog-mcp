#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readServerConfig } from "./config.js";
import {
  amendLogMetadata,
  appendLogEntry,
  APPENDABLE_LOG_STATUSES,
  CHANGE_TYPES,
  getOpenThreadEntries,
  getRecentLogEntries,
  LOG_STATUSES,
  type AmendLogMetadataInput,
  type LogStatus,
  type SessionLogEntry,
  updateLogStatus,
} from "./logbook.js";
import { createLogger, serializeError, type Logger } from "./logger.js";
import {
  formatAppendResponse,
  formatMetadataAmendResponse,
  formatReadResponse,
  formatStatusUpdateResponse,
} from "./response-format.js";
import {
  EXAMPLES_RESOURCE_TEXT,
  SCHEMA_RESOURCE_TEXT,
  USAGE_RESOURCE_TEXT,
} from "./resources.js";

const logger = createLogger();

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
      version: "0.2.1",
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
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info("server.ready", {
    project_root: config.paths.projectRoot,
    tools: 5,
    resources: 3,
  });
}

function registerResources(server: McpServer): void {
  server.registerResource(
    "tasklog-usage",
    "tasklog://usage",
    {
      title: "Logbook usage guide",
      description: "Rules for when and how an AI should read or write project log entries.",
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
      title: "Logbook schema",
      description: "Current data model for stored log entries.",
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
      title: "Logbook examples",
      description: "Examples of strong and weak log entries for this MCP.",
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [{ uri: uri.href, text: EXAMPLES_RESOURCE_TEXT }],
    }),
  );
}

function registerTools(server: McpServer, paths: Parameters<typeof getRecentLogEntries>[0], logger: Logger): void {
  server.registerTool(
    "get_recent_logs",
    {
      title: "Get recent session logs",
      description:
        "Read the most recent project session summaries before continuing work. Use this when the user intends to recover prior context, continue earlier work, or debug a recent regression.",
      inputSchema: {
        limit: z.number().int().min(1).max(50).default(5).describe("How many recent log entries to return."),
      },
      outputSchema: {
        project_root: z.string(),
        json_path: z.string(),
        markdown_path: z.string(),
        count: z.number().int(),
        entries: z.array(logEntrySchema()),
      },
    },
    observeToolCall(logger, "get_recent_logs", async ({ limit }) => {
      const entries = await getRecentLogEntries(paths, limit);
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
        "Append a new log entry. Summary should capture intent and outcome. List only files actually edited. If files changed in this session, work is not done until a log entry is written.",
      inputSchema: {
        summary: z.string().min(1).describe("One or two sentences describing what changed and why or what outcome it produced."),
        status: z.enum(APPENDABLE_LOG_STATUSES).describe("Progress state for this newly appended entry."),
        change_type: z.enum(CHANGE_TYPES).describe("Type of work performed in this entry."),
        affected_files: z.array(z.string().min(1)).default([]).describe("Relative paths for files actually edited."),
        tags: z.array(z.string().min(1)).default([]).describe("Optional project-specific tags, ideally lowercase and concise."),
        next_steps: z.string().default("").describe("Optional note describing what the next session should do."),
        blockers: z.string().default("").describe("Optional note describing why work cannot currently proceed."),
        related_log_ids: z.array(z.string().min(1)).default([]).describe("Optional IDs of earlier log entries this work relates to."),
        supersedes_log_id: z.string().default("").describe("Optional older log ID this new entry takes over."),
      },
      outputSchema: {
        project_root: z.string(),
        json_path: z.string(),
        markdown_path: z.string(),
        entry: logEntrySchema(),
      },
    },
    observeToolCall(logger, "append_session_log", async ({ summary, status, change_type, affected_files, tags, next_steps, blockers, related_log_ids, supersedes_log_id }) => {
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
    }),
  );

  server.registerTool(
    "get_open_threads",
    {
      title: "Get open threads",
      description:
        "Return unresolved or follow-up-worthy log entries. Use this when the user intends to resume unfinished work or asks what is still open.",
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
    observeToolCall(logger, "amend_log_metadata", async ({ log_id, affected_files, tags, next_steps, blockers }) => {
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
    }),
  );
}

function logEntrySchema() {
  return z.object({
    id: z.string(),
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
    count: typeof structured.count === "number" ? structured.count : undefined,
  };
}

main().catch((error: unknown) => {
  logger.error("server.start_failed", serializeError(error));
  process.exit(1);
});
