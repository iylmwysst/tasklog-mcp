import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parseEpisodes } from "./annotator-packet.js";

test("Thai validation packet parses into 30 structured episodes", () => {
  const source = readFileSync(
    path.resolve(process.cwd(), "docs", "validation-30-episode-send-pack-th.md"),
    "utf8",
  );

  const episodes = parseEpisodes(source);

  assert.equal(episodes.length, 30);
  assert.equal(episodes[0]?.id, "E-SWE-01");
  assert.equal(episodes.at(-1)?.id, "E-SWE-10");

  for (const episode of episodes) {
    assert.equal(episode.fields.length, 6, `episode ${episode.id} should have 6 sections`);
    assert.equal(episode.fields[0]?.key, "Setting");
    assert.equal(episode.fields.at(-1)?.key, "Complication");
  }
});

test("Thai packet keeps visible-record bullet structure", () => {
  const source = readFileSync(
    path.resolve(process.cwd(), "docs", "validation-30-episode-send-pack-th.md"),
    "utf8",
  );

  const episodes = parseEpisodes(source);
  const visibleRecords = episodes[0]?.fields.find(
    (field) => field.key === "Visible records at resume time",
  );

  assert.ok(visibleRecords);
  assert.ok(visibleRecords.value.some((line) => line.startsWith("- ")));
});
