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
    assert.equal(path.dirname(config.paths.jsonPath), path.join(normalizedProjectRoot, ".tasklog"));
    assert.equal(path.dirname(config.paths.markdownPath), path.join(normalizedProjectRoot, ".tasklog"));
    assert.equal(path.dirname(config.paths.worksPath), path.join(normalizedProjectRoot, ".tasklog"));
    assert.equal(path.dirname(config.paths.activeContextPath), path.join(normalizedProjectRoot, ".tasklog"));
    assert.equal(path.basename(config.paths.jsonPath), "session-log.json");
    assert.equal(path.basename(config.paths.markdownPath), "session-log.md");
    assert.equal(path.basename(config.paths.legacyJsonPath), ".ai-history.json");
    assert.equal(path.basename(config.paths.legacyMarkdownPath), ".ai-session-log.md");
    assert.equal(path.basename(config.paths.workdocsRoot), "workdocs");
  } finally {
    process.chdir(previousCwd);
  }
});

test("readServerConfig keeps legacy overrides while canonical paths stay under .tasklog", () => {
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
  assert.equal(config.paths.jsonPath, "/tmp/logbook-project/.tasklog/session-log.json");
  assert.equal(config.paths.markdownPath, "/tmp/logbook-project/.tasklog/session-log.md");
  assert.equal(config.paths.legacyJsonPath, "/tmp/logbook-project/.state/logs.json");
  assert.equal(config.paths.legacyMarkdownPath, "/tmp/logbook-project/.state/logs.md");
  assert.equal(config.paths.workdocsRoot, "/tmp/logbook-project/workdocs");
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
