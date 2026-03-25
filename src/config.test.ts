import { mkdtemp, realpath } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { readServerConfig } from "./config.js";

test("readServerConfig defaults projectRoot to the current working directory", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "mini-mcp-config-"));
  const previousCwd = process.cwd();

  process.chdir(projectRoot);
  try {
    const config = readServerConfig([], {});
    const normalizedProjectRoot = await realpath(projectRoot);
    assert.equal(await realpath(config.paths.projectRoot), normalizedProjectRoot);
    assert.equal(await realpath(path.dirname(config.paths.jsonPath)), normalizedProjectRoot);
    assert.equal(await realpath(path.dirname(config.paths.markdownPath)), normalizedProjectRoot);
    assert.equal(path.basename(config.paths.jsonPath), ".ai-history.json");
    assert.equal(path.basename(config.paths.markdownPath), ".ai-session-log.md");
  } finally {
    process.chdir(previousCwd);
  }
});

test("readServerConfig lets args override env defaults", () => {
  const config = readServerConfig(
    [
      "--project-root",
      "/tmp/logbook-project",
      "--json-file",
      ".state/logs.json",
      "--markdown-file",
      ".state/logs.md",
    ],
    {
      LOGBOOK_PROJECT_ROOT: "/tmp/ignored",
      LOGBOOK_JSON_FILE: "ignored.json",
      LOGBOOK_MARKDOWN_FILE: "ignored.md",
    },
  );

  assert.equal(config.paths.projectRoot, "/tmp/logbook-project");
  assert.equal(config.paths.jsonPath, "/tmp/logbook-project/.state/logs.json");
  assert.equal(config.paths.markdownPath, "/tmp/logbook-project/.state/logs.md");
});

test("readServerConfig rejects file targets that escape the project root", () => {
  assert.throws(
    () =>
      readServerConfig(
        ["--project-root", "/tmp/logbook-project", "--json-file", "../escape.json"],
        {},
      ),
    /must stay within the project root/,
  );
});
