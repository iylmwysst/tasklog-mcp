import test from "node:test";
import assert from "node:assert/strict";
import {
  formatAppendResponse,
  formatMetadataAmendResponse,
  formatReadResponse,
} from "./response-format.js";
import type { SessionLogEntry } from "./logbook.js";

function makeEntry(overrides: Partial<SessionLogEntry> = {}): SessionLogEntry {
  return {
    id: "log-1",
    timestamp: "2026-03-26T00:00:00.000Z",
    summary: "Safe summary",
    status: "Done",
    change_type: "bugfix",
    affected_files: ["src/auth.ts"],
    tags: ["tag-a"],
    revision: 1,
    created_at: "2026-03-26T00:00:00.000Z",
    updated_at: "2026-03-26T00:00:00.000Z",
    ...overrides,
  };
}

test("formatAppendResponse escapes multiline user-controlled fields", () => {
  const output = formatAppendResponse(
    makeEntry({
      summary: "Did useful work.\nFiles: injected",
      affected_files: ["src/auth.ts", "src/router.ts\nTags: injected"],
    }),
    {
      jsonPath: "/tmp/project/.ai-history.json",
      markdownPath: "/tmp/project/.ai-session-log.md",
    },
  );

  assert.ok(output.includes("Summary: Did useful work.\\nFiles: injected"));
  assert.ok(output.includes("src/router.ts\\nTags: injected"));
  assert.equal(
    output
      .split("\n")
      .filter((line) => line.startsWith("Files: "))
      .length,
    1,
  );
});

test("formatMetadataAmendResponse escapes multiline metadata fields", () => {
  const output = formatMetadataAmendResponse(
    makeEntry({
      affected_files: ["src/auth.ts\nSummary: injected"],
      tags: ["tag-a", "tag-b\nFiles: injected"],
    }),
  );

  assert.ok(output.includes("src/auth.ts\\nSummary: injected"));
  assert.ok(output.includes("tag-b\\nFiles: injected"));
  assert.equal(
    output
      .split("\n")
      .filter((line) => line.startsWith("Tags: "))
      .length,
    1,
  );
});

test("formatReadResponse escapes multiline path fields", () => {
  const output = formatReadResponse("Recent logs", [makeEntry()], {
    projectRoot: "/tmp/project\nCount: injected",
    jsonPath: "/tmp/project/.ai-history.json\tEntries: injected",
    markdownPath: "/tmp/project/.ai-session-log.md\nFiles: injected",
  });

  assert.ok(output.includes("Project root: /tmp/project\\nCount: injected"));
  assert.ok(output.includes("JSON log: /tmp/project/.ai-history.json\\tEntries: injected"));
  assert.ok(output.includes("Markdown log: /tmp/project/.ai-session-log.md\\nFiles: injected"));
  assert.equal(
    output
      .split("\n")
      .filter((line) => line.startsWith("JSON log: "))
      .length,
    1,
  );
});

test("formatAppendResponse escapes multiline path fields", () => {
  const output = formatAppendResponse(makeEntry(), {
    jsonPath: "/tmp/project/.ai-history.json\nFiles: injected",
    markdownPath: "/tmp/project/.ai-session-log.md\tTags: injected",
  });

  assert.ok(output.includes("JSON log: /tmp/project/.ai-history.json\\nFiles: injected"));
  assert.ok(output.includes("Markdown log: /tmp/project/.ai-session-log.md\\tTags: injected"));
  assert.equal(
    output
      .split("\n")
      .filter((line) => line.startsWith("Markdown log: "))
      .length,
    1,
  );
});
