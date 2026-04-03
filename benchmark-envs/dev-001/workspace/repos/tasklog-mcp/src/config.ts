import path from "node:path";
import { defaults, resolveLogbookPaths, type LogbookPaths } from "./logbook.js";
import type { Logger } from "./logger.js";

export interface ServerConfig {
  paths: LogbookPaths;
}

export function readServerConfig(
  argv: string[],
  env: NodeJS.ProcessEnv,
  logger?: Logger,
): ServerConfig {
  const args = parseArgs(argv);
  const projectRoot = path.resolve(
    args.get("project-root") ?? env.LOGBOOK_PROJECT_ROOT ?? process.cwd(),
  );
  const jsonFile = args.get("json-file") ?? env.LOGBOOK_JSON_FILE ?? defaults.DEFAULT_JSON_FILE;
  const markdownFile =
    args.get("markdown-file") ?? env.LOGBOOK_MARKDOWN_FILE ?? defaults.DEFAULT_MARKDOWN_FILE;

  return {
    paths: resolveLogbookPaths(projectRoot, jsonFile, markdownFile, logger),
  };
}

function parseArgs(argv: string[]): Map<string, string> {
  const args = new Map<string, string>();

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);
    const value = argv[index + 1];

    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }

    args.set(key, value);
    index += 1;
  }

  return args;
}
