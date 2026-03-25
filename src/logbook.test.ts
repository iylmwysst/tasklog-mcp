import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import {
  amendLogMetadata,
  appendLogEntry,
  formatLogEntries,
  getOpenThreadEntries,
  getRecentLogEntries,
  readLogEntries,
  resolveLogbookPaths,
  updateLogStatus,
} from "./logbook.js";

test("appendLogEntry writes schema v1 logs to json and markdown", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "tasklog-mcp-"));
  const paths = resolveLogbookPaths(projectRoot);

  const entry = await appendLogEntry(paths, {
    summary: "Refined auth guard handling to avoid redirect loops after token expiry.",
    status: "Done",
    change_type: "refactor",
    affected_files: ["src/auth.ts", "src/router.ts", "src/auth.ts"],
    tags: ["Routing", "auth"],
    next_steps: "Verify that the callback route still lands correctly after refresh.",
    blockers: "",
  });

  assert.match(entry.id, /^log-/);
  assert.equal(entry.status, "Done");
  assert.equal(entry.change_type, "refactor");
  assert.deepEqual(entry.affected_files, ["src/auth.ts", "src/router.ts"]);
  assert.deepEqual(entry.tags, ["routing", "auth"]);
  assert.equal(entry.revision, 1);

  const jsonLog = JSON.parse(await readFile(paths.jsonPath, "utf8")) as Array<{ summary: string }>;
  const markdownLog = await readFile(paths.markdownPath, "utf8");

  assert.equal(jsonLog.length, 1);
  assert.equal(jsonLog[0]?.summary, "Refined auth guard handling to avoid redirect loops after token expiry.");
  assert.match(markdownLog, /AI Session Logbook/);
  assert.match(markdownLog, /Revision/);
  assert.match(markdownLog, /src\/auth\.ts/);
});

test("getOpenThreadEntries returns unresolved and follow-up entries first", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "tasklog-mcp-"));
  const paths = resolveLogbookPaths(projectRoot);

  await appendLogEntry(paths, {
    summary: "Wrapped up the release notes update.",
    status: "Done",
    change_type: "docs",
    affected_files: ["README.md"],
  });

  await appendLogEntry(paths, {
    summary: "Investigating host-login reconnect timing after approval.",
    status: "WIP",
    change_type: "investigation",
    affected_files: ["src/server.rs"],
    next_steps: "Trace websocket reattachment order.",
  });

  await appendLogEntry(paths, {
    summary: "Added dashboard polling for approval state, but waiting on API contract confirmation.",
    status: "Blocked",
    change_type: "feature",
    affected_files: ["dashboard/src/pages/HostLoginPage.tsx"],
    blockers: "API payload is still changing.",
  });

  const recent = await getRecentLogEntries(paths, 2);
  const open = await getOpenThreadEntries(paths, 10);

  assert.equal(recent.length, 2);
  assert.equal(open.length, 2);
  assert.equal(open[0]?.status, "Blocked");
  assert.equal(open[1]?.status, "WIP");
});

test("updateLogStatus and amendLogMetadata revise existing entries", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "tasklog-mcp-"));
  const paths = resolveLogbookPaths(projectRoot);

  const entry = await appendLogEntry(paths, {
    summary: "Started tracing machine heartbeat retries.",
    status: "WIP",
    change_type: "investigation",
    affected_files: ["agent/src/main.rs"],
  });

  const amended = await amendLogMetadata(paths, entry.id, {
    affected_files: ["agent/src/main.rs", "api/src/routes/agent.ts"],
    tags: ["machine-heartbeat", "retry-policy"],
    next_steps: "Confirm the API retry contract before locking timings.",
  });

  assert.equal(amended.revision, 2);
  assert.deepEqual(amended.tags, ["machine-heartbeat", "retry-policy"]);
  assert.equal(amended.next_steps, "Confirm the API retry contract before locking timings.");

  const updated = await updateLogStatus(paths, entry.id, "Blocked");
  const entries = await readLogEntries(paths);

  assert.equal(updated.status, "Blocked");
  assert.equal(updated.revision, 3);
  assert.equal(entries[0]?.status, "Blocked");
});

test("appendLogEntry can supersede an earlier thread", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "tasklog-mcp-"));
  const paths = resolveLogbookPaths(projectRoot);

  const original = await appendLogEntry(paths, {
    summary: "Started digging into PTY disconnects after approval.",
    status: "WIP",
    change_type: "investigation",
    affected_files: ["src/session.rs"],
  });

  const followUp = await appendLogEntry(paths, {
    summary: "Confirmed stale approval state caused the disconnect and added a fix.",
    status: "Done",
    change_type: "bugfix",
    affected_files: ["src/session.rs", "src/server.rs"],
    related_log_ids: [original.id],
    supersedes_log_id: original.id,
  });

  const entries = await readLogEntries(paths);
  const superseded = entries.find((item) => item.id === original.id);

  assert.equal(followUp.supersedes_log_id, original.id);
  assert.equal(superseded?.status, "Superseded");
  assert.equal(superseded?.revision, 2);
});

test("concurrent appends are serialized without dropping entries", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "tasklog-mcp-"));
  const paths = resolveLogbookPaths(projectRoot);

  await Promise.all(
    Array.from({ length: 12 }, (_, index) =>
      appendLogEntry(paths, {
        summary: `Concurrent write ${index}`,
        status: "Done",
        change_type: "test",
        affected_files: [`tests/${index}.ts`],
      }),
    ),
  );

  const entries = await readLogEntries(paths);
  const summaries = new Set(entries.map((entry) => entry.summary));

  assert.equal(entries.length, 12);
  assert.equal(summaries.size, 12);
});

test("markdown rendering escapes user-controlled content", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "tasklog-mcp-"));
  const paths = resolveLogbookPaths(projectRoot);

  await appendLogEntry(paths, {
    summary: "# Heading\n- injected bullet\n[link](https://example.com)",
    status: "Done",
    change_type: "docs",
    affected_files: ["docs/[weird].md"],
    tags: ["tag-with-`code`"],
    next_steps: "Check [next](https://example.com) without rendering markup.",
  });

  const markdownLog = await readFile(paths.markdownPath, "utf8");

  assert.match(markdownLog, /> \\# Heading/);
  assert.match(markdownLog, /> - injected bullet/);
  assert.ok(markdownLog.includes("> \\[link\\]\\(https://example.com\\)"));
  assert.match(markdownLog, /- docs\/\\\[weird\\\]\.md/);
  assert.match(markdownLog, /- tag-with-\\`code\\`/);
});

test("resolveLogbookPaths rejects paths outside the project root", () => {
  assert.throws(
    () => resolveLogbookPaths("/tmp/project-root", "../escape.json"),
    /must stay within the project root/,
  );

  assert.throws(
    () => resolveLogbookPaths("/tmp/project-root", ".ai-history.json", "../../escape.md"),
    /must stay within the project root/,
  );
});

test("plain-text log formatting escapes multiline field spoofing", () => {
  const output = formatLogEntries([
    {
      id: "log-1",
      timestamp: "2026-03-26T00:00:00.000Z",
      summary: "Did something useful.\n  Files: injected",
      status: "Done",
      change_type: "bugfix",
      affected_files: ["src/auth.ts"],
      tags: ["tag-a\nStatus: fake"],
      next_steps: "Check follow-up.\n  Blockers: injected",
      blockers: "none",
      related_log_ids: ["rel-1\nSummary: fake"],
      revision: 1,
      created_at: "2026-03-26T00:00:00.000Z",
      updated_at: "2026-03-26T00:00:00.000Z",
    },
  ]);

  assert.ok(output.includes("Summary: Did something useful.\\n  Files: injected"));
  assert.ok(output.includes("Tags: tag-a\\nStatus: fake"));
  assert.ok(output.includes("Next steps: Check follow-up.\\n  Blockers: injected"));
  assert.ok(output.includes("Related logs: rel-1\\nSummary: fake"));
  assert.equal(
    output
      .split("\n")
      .filter((line) => line.startsWith("  Files:"))
      .length,
    1,
  );
});

test("nested log file targets are created automatically before writes", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "tasklog-mcp-"));
  const paths = resolveLogbookPaths(
    projectRoot,
    ".state/logs/.ai-history.json",
    ".state/logs/.ai-session-log.md",
  );

  await appendLogEntry(paths, {
    summary: "Persisted to nested log paths.",
    status: "Done",
    change_type: "config",
    affected_files: ["README.md"],
  });

  const jsonLog = JSON.parse(await readFile(paths.jsonPath, "utf8")) as Array<{ summary: string }>;
  const markdownLog = await readFile(paths.markdownPath, "utf8");

  assert.equal(jsonLog.length, 1);
  assert.equal(jsonLog[0]?.summary, "Persisted to nested log paths.");
  assert.match(markdownLog, /Persisted to nested log paths\./);
});
