import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { parseEpisodes } from "./annotator-packet.js";
import {
  DuplicateSubmissionError,
  saveSubmission,
  type PacketPayload,
  type SubmissionInput,
} from "./annotator-submission.js";

function buildPacket(): PacketPayload {
  const source = readFileSync(
    path.resolve(process.cwd(), "docs", "validation-30-episode-send-pack-th.md"),
    "utf8",
  );
  const episodes = parseEpisodes(source);

  return {
    packetTitle: "test",
    packetDescription: "test",
    episodes,
    choices: {
      interruptionClass: [],
      dominantLossClass: [],
      boundaryAmbiguous: [],
      nearestAlternativeClass: [],
      confidence: [],
    },
  };
}

function buildSubmission(packet: PacketPayload): SubmissionInput {
  return {
    respondentName: "Tester One",
    respondentTag: "HUM-01",
    submittedAtClient: "2026-04-07T00:00:00.000Z",
    responses: packet.episodes.map((episode) => ({
      episodeId: episode.id,
      interruptionClass: "session_cutoff",
      dominantLossClass: "intent_loss",
      boundaryAmbiguous: "no",
      nearestAlternativeClass: "none",
      confidence: "high",
      justification: `Structured rationale for ${episode.id}`,
      notes: "",
    })),
  };
}

test("saveSubmission writes one JSON file with respondent-scoped payload", async () => {
  const packet = buildPacket();
  const submission = buildSubmission(packet);
  const outputDir = mkdtempSync(path.join(os.tmpdir(), "tasklog-annotator-save-"));

  const result = await saveSubmission(submission, packet, outputDir);
  const filePath = path.join(outputDir, result.fileName);
  const saved = JSON.parse(readFileSync(filePath, "utf8"));

  assert.equal(result.ok, "true");
  assert.equal(saved.respondentName, "Tester One");
  assert.equal(saved.respondentTag, "HUM-01");
  assert.equal(saved.responseCount, 30);
  assert.equal(saved.responses.length, 30);
  assert.equal(saved.responses[0].episodeId, "E-SWE-01");

  await fs.rm(outputDir, { recursive: true, force: true });
});

test("saveSubmission rejects inconsistent nearest alternative when boundary is no", async () => {
  const packet = buildPacket();
  const submission = buildSubmission(packet);
  submission.responses[0].nearestAlternativeClass = "focus_loss";

  const outputDir = mkdtempSync(path.join(os.tmpdir(), "tasklog-annotator-save-"));

  await assert.rejects(
    saveSubmission(submission, packet, outputDir),
    /nearest_alternative_must_be_none:E-SWE-01/,
  );

  await fs.rm(outputDir, { recursive: true, force: true });
});

test("saveSubmission rejects duplicate respondentTag unless overwrite is requested", async () => {
  const packet = buildPacket();
  const submission = buildSubmission(packet);
  const outputDir = mkdtempSync(path.join(os.tmpdir(), "tasklog-annotator-save-"));

  await saveSubmission(submission, packet, outputDir);

  await assert.rejects(
    saveSubmission(submission, packet, outputDir),
    (error) =>
      error instanceof DuplicateSubmissionError && error.existingFileName === "HUM-01.json",
  );

  const overwriteResult = await saveSubmission(
    { ...submission, respondentName: "Tester Overwrite", overwrite: true },
    packet,
    outputDir,
  );
  const overwritten = JSON.parse(readFileSync(path.join(outputDir, overwriteResult.fileName), "utf8"));

  assert.equal(overwritten.respondentName, "Tester Overwrite");
  assert.equal(overwritten.overwrite, true);

  await fs.rm(outputDir, { recursive: true, force: true });
});
