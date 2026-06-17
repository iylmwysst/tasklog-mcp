import { execFile as execFileCallback } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { promisify } from "node:util";
import { parseEpisodes, type Episode } from "../src/annotator-packet.js";
import { saveSubmission, type EpisodeResponseInput, type PacketPayload } from "../src/annotator-submission.js";

const execFile = promisify(execFileCallback);

type Provider = "codex" | "claude";

interface ModelSpec {
  key: string;
  provider: Provider;
  modelId: string;
  respondentName: string;
  respondentTag: string;
}

interface ModelAnswer {
  responses: EpisodeResponseInput[];
}

interface CliOptions {
  models: ModelSpec[];
  overwrite: boolean;
  batchSize?: number;
}

interface RunArtifacts {
  structured: ModelAnswer;
  stdout: string;
  stderr: string;
}

interface ClaudeExecResult {
  structured_output?: unknown;
}

const projectRoot = process.cwd();
const docsRoot = path.join(projectRoot, "docs");
const responseDir = path.join(projectRoot, "annotator-data", "responses");
const runsRoot = path.join(projectRoot, "annotator-data", "llm-runs");

const CHOICES = {
  interruptionClass: [
    ["session_cutoff", "Session Cutoff"],
    ["task_switch", "Task Switch"],
    ["blocked_waiting", "Blocked Waiting"],
    ["environment_drift", "Environment Drift"],
    ["failure_boundary", "Failure Boundary"],
    ["handoff", "Handoff"],
    ["multi_open_work_conflict", "Multi-Open Work Conflict"],
    ["false_done", "False Done"],
    ["dirty_done", "Dirty Done"],
  ],
  dominantLossClass: [
    ["focus_loss", "Focus Loss"],
    ["authority_loss", "Authority Loss"],
    ["readiness_loss", "Readiness Loss"],
    ["intent_loss", "Intent Loss"],
    ["closure_loss", "Closure Loss"],
  ],
  boundaryAmbiguous: [
    ["yes", "Yes"],
    ["no", "No"],
  ],
  nearestAlternativeClass: [
    ["focus_loss", "Focus Loss"],
    ["authority_loss", "Authority Loss"],
    ["readiness_loss", "Readiness Loss"],
    ["intent_loss", "Intent Loss"],
    ["closure_loss", "Closure Loss"],
    ["none", "None"],
  ],
  confidence: [
    ["high", "High"],
    ["medium", "Medium"],
    ["low", "Low"],
  ],
} satisfies Record<string, Array<[string, string]>>;

const MODEL_SPECS: ModelSpec[] = [
  {
    key: "gpt-5.4-mini",
    provider: "codex",
    modelId: "gpt-5.4-mini",
    respondentName: "GPT-5.4-Mini",
    respondentTag: "LLM-GPT-54-MINI",
  },
  {
    key: "gpt-5.3-codex",
    provider: "codex",
    modelId: "gpt-5.3-codex",
    respondentName: "GPT-5.3-Codex",
    respondentTag: "LLM-GPT-53-CODEX",
  },
  {
    key: "claude-sonnet-4.6",
    provider: "claude",
    modelId: "claude-sonnet-4.6",
    respondentName: "Claude Sonnet 4.6",
    respondentTag: "LLM-CLAUDE-SONNET-46",
  },
];

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const packet = await loadPacket();
  const codebook = await fs.readFile(path.join(docsRoot, "validation-codebook.md"), "utf8");
  const sendPack = await fs.readFile(path.join(docsRoot, "validation-30-episode-send-pack.md"), "utf8");
  const timestamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  const runDir = path.join(runsRoot, timestamp);

  await fs.mkdir(responseDir, { recursive: true });
  await fs.mkdir(runDir, { recursive: true });
  await fs.writeFile(path.join(runDir, "codebook.md"), codebook, "utf8");
  await fs.writeFile(path.join(runDir, "full-send-pack.md"), sendPack, "utf8");

  const failures: Array<{ model: string; message: string }> = [];

  for (const model of options.models) {
    const modelDir = path.join(runDir, model.key);
    await fs.mkdir(modelDir, { recursive: true });

    try {
      console.log(`Running ${model.modelId} via ${model.provider}...`);
      const responses: EpisodeResponseInput[] = [];
      const batches = chunkEpisodes(packet.episodes, options.batchSize ?? packet.episodes.length);

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex += 1) {
        const batchEpisodes = batches[batchIndex]!;
        const batchPacket: PacketPayload = { ...packet, episodes: batchEpisodes };
        const batchPrompt = buildPrompt(batchPacket, codebook, renderEpisodeSubset(batchEpisodes));
        const batchLabel = `batch-${String(batchIndex + 1).padStart(2, "0")}`;

        await fs.writeFile(path.join(modelDir, `${batchLabel}-prompt.md`), batchPrompt, "utf8");
        const result = await runModel(model, batchPrompt, batchPacket);
        await fs.writeFile(
          path.join(modelDir, `${batchLabel}-structured-output.json`),
          JSON.stringify(result.structured, null, 2),
          "utf8",
        );
        await fs.writeFile(path.join(modelDir, `${batchLabel}-stdout.txt`), result.stdout, "utf8");
        await fs.writeFile(path.join(modelDir, `${batchLabel}-stderr.txt`), result.stderr, "utf8");
        responses.push(...reorderResponses(result.structured.responses, batchEpisodes));
      }

      const orderedResponses = reorderResponses(responses, packet.episodes);
      const saved = await saveSubmission(
        {
          respondentName: model.respondentName,
          respondentTag: model.respondentTag,
          submittedAtClient: new Date().toISOString(),
          overwrite: options.overwrite,
          responses: orderedResponses,
        },
        packet,
        responseDir,
      );

      await fs.writeFile(
        path.join(modelDir, "save-result.json"),
        JSON.stringify(
          {
            model,
            saved,
            responseFile: path.join(responseDir, `${model.respondentTag}.json`),
          },
          null,
          2,
        ),
        "utf8",
      );
      console.log(`Saved ${model.respondentTag}.json`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push({ model: model.modelId, message });
      await fs.writeFile(path.join(modelDir, "error.txt"), `${message}\n`, "utf8");
      console.error(`Failed ${model.modelId}: ${message}`);
    }
  }

  await fs.writeFile(
    path.join(runDir, "run-summary.json"),
    JSON.stringify(
      {
        runDir,
        models: options.models.map((model) => model.modelId),
        batchSize: options.batchSize ?? packet.episodes.length,
        failures,
      },
      null,
      2,
    ),
    "utf8",
  );

  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

function parseArgs(argv: string[]): CliOptions {
  let models = MODEL_SPECS;
  let overwrite = true;
  let batchSize: number | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current === "--models") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error("--models requires a comma-separated value");
      }
      const requested = new Set(value.split(",").map((entry) => entry.trim()).filter(Boolean));
      models = MODEL_SPECS.filter((model) => requested.has(model.key) || requested.has(model.modelId));
      if (models.length === 0) {
        throw new Error(`No matching models for --models=${value}`);
      }
      index += 1;
      continue;
    }

    if (current === "--no-overwrite") {
      overwrite = false;
      continue;
    }

    if (current === "--batch-size") {
      const value = argv[index + 1];
      const parsed = Number.parseInt(value ?? "", 10);
      if (!Number.isInteger(parsed) || parsed < 1) {
        throw new Error("--batch-size requires a positive integer");
      }
      batchSize = parsed;
      index += 1;
      continue;
    }

    if (current === "--help" || current === "-h") {
      printHelp();
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${current}`);
  }

  return { models, overwrite, batchSize };
}

function printHelp(): void {
  console.log(
    [
      "Usage: node --import tsx scripts/run-validation-30-episode-llm.ts [options]",
      "",
      "Options:",
      "  --models <list>    Comma-separated subset of model keys",
      "                     Available: gpt-5.4-mini,gpt-5.3-codex,claude-sonnet-4.6",
      "  --batch-size <n>   Split the packet into batches of n episodes per model call",
      "  --no-overwrite     Keep existing response files instead of replacing them",
    ].join("\n"),
  );
}

async function loadPacket(): Promise<PacketPayload> {
  const source = await fs.readFile(path.join(docsRoot, "validation-30-episode-send-pack.md"), "utf8");
  const episodes = parseEpisodes(source).filter((episode) => episode.id.startsWith("E-"));

  return {
    packetTitle: "Interrupted Coding Work Taxonomy: 30-Episode Validation Round",
    packetDescription: "LLM annotation run over the canonical 30-episode English packet.",
    episodes,
    choices: {
      interruptionClass: toOptions(CHOICES.interruptionClass),
      dominantLossClass: toOptions(CHOICES.dominantLossClass),
      boundaryAmbiguous: toOptions(CHOICES.boundaryAmbiguous),
      nearestAlternativeClass: toOptions(CHOICES.nearestAlternativeClass),
      confidence: toOptions(CHOICES.confidence),
    },
  };
}

function toOptions(entries: Array<[string, string]>): Array<{ value: string; label: string }> {
  return entries.map(([value, label]) => ({ value, label }));
}

function buildPrompt(
  packet: PacketPayload,
  codebook: string,
  sendPack: string,
): string {
  const interruptionValues = CHOICES.interruptionClass.map(([value]) => value).join(", ");
  const dominantValues = CHOICES.dominantLossClass.map(([value]) => value).join(", ");
  const confidenceValues = CHOICES.confidence.map(([value]) => value).join(", ");

  return [
    "You are an auxiliary LLM annotator for the Interrupted Coding Work Taxonomy validation round.",
    "Use only the materials below. Do not invent hidden facts or rely on external knowledge.",
    "Classify the episode as written, not the imagined raw session behind it.",
    "",
    "Output requirements:",
    `- Return exactly ${packet.episodes.length} responses in JSON under the top-level key "responses".`,
    "- Each response must include: episodeId, interruptionClass, dominantLossClass, boundaryAmbiguous, nearestAlternativeClass, confidence, justification, notes.",
    `- interruptionClass must be one of: ${interruptionValues}.`,
    `- dominantLossClass must be one of: ${dominantValues}.`,
    "- boundaryAmbiguous must be either yes or no.",
    "- If boundaryAmbiguous is no, nearestAlternativeClass must be none.",
    `- confidence must be one of: ${confidenceValues}.`,
    "- justification should be brief and structural, usually 1-3 sentences.",
    "- notes should be an empty string unless a short note is necessary.",
    "- Preserve the packet episode IDs exactly.",
    "",
    "Materials begin below.",
    "",
    "===== VALIDATION CODEBOOK =====",
    codebook,
    "",
    "===== 30-EPISODE SEND PACK =====",
    sendPack,
  ].join("\n");
}

function renderEpisodeSubset(episodes: Episode[]): string {
  const lines = ["# Validation Episode Subset", "", "Annotate only the episodes below."];

  for (const episode of episodes) {
    lines.push("", `## Episode ${episode.id}`);
    for (const field of episode.fields) {
      lines.push(`${field.key}:`);
      lines.push(...field.value);
      lines.push("");
    }
    lines.push("---");
  }

  return lines.join("\n").trim();
}

function answerSchema(packet: PacketPayload): Record<string, unknown> {
  return {
    type: "object",
    additionalProperties: false,
    required: ["responses"],
    properties: {
      responses: {
        type: "array",
        minItems: packet.episodes.length,
        maxItems: packet.episodes.length,
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "episodeId",
            "interruptionClass",
            "dominantLossClass",
            "boundaryAmbiguous",
            "nearestAlternativeClass",
            "confidence",
            "justification",
            "notes",
          ],
          properties: {
            episodeId: {
              type: "string",
              enum: packet.episodes.map((episode) => episode.id),
            },
            interruptionClass: {
              type: "string",
              enum: CHOICES.interruptionClass.map(([value]) => value),
            },
            dominantLossClass: {
              type: "string",
              enum: CHOICES.dominantLossClass.map(([value]) => value),
            },
            boundaryAmbiguous: {
              type: "string",
              enum: CHOICES.boundaryAmbiguous.map(([value]) => value),
            },
            nearestAlternativeClass: {
              type: "string",
              enum: CHOICES.nearestAlternativeClass.map(([value]) => value),
            },
            confidence: {
              type: "string",
              enum: CHOICES.confidence.map(([value]) => value),
            },
            justification: {
              type: "string",
              minLength: 4,
            },
            notes: {
              type: "string",
            },
          },
        },
      },
    },
  };
}

async function runModel(model: ModelSpec, prompt: string, packet: PacketPayload): Promise<RunArtifacts> {
  if (model.provider === "codex") {
    return runCodex(model, prompt, packet);
  }

  return runClaude(model, prompt, packet);
}

async function runCodex(model: ModelSpec, prompt: string, packet: PacketPayload): Promise<RunArtifacts> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "validation-30-episode-"));
  const schemaPath = path.join(tempDir, "schema.json");
  const outputPath = path.join(tempDir, "answer.json");

  try {
    await fs.writeFile(schemaPath, JSON.stringify(answerSchema(packet), null, 2), "utf8");
    const args = [
      "exec",
      "--skip-git-repo-check",
      "--ephemeral",
      "-C",
      tempDir,
      "--output-schema",
      schemaPath,
      "-o",
      outputPath,
      "--sandbox",
      "read-only",
      "--model",
      model.modelId,
      prompt,
    ];
    const { stdout, stderr } = await execFile("codex", args, {
      encoding: "utf8",
      maxBuffer: 1024 * 1024 * 32,
      timeout: 20 * 60_000,
    });

    const raw = await fs.readFile(outputPath, "utf8");
    return {
      structured: normalizeAnswer(JSON.parse(raw) as Record<string, unknown>),
      stdout,
      stderr,
    };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

async function runClaude(model: ModelSpec, prompt: string, packet: PacketPayload): Promise<RunArtifacts> {
  const args = [
    "-p",
    "--permission-mode",
    "dontAsk",
    "--tools",
    "",
    "--no-session-persistence",
    "--model",
    claudeModelArg(model.modelId),
    `${prompt}\n\nReturn JSON only. Do not wrap it in markdown fences.`,
  ];
  const { stdout, stderr } = await execFile("claude", args, {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 32,
    timeout: 20 * 60_000,
  });
  const parsed = JSON.parse(extractJson(stdout)) as ClaudeExecResult | Record<string, unknown>;
  const structuredOutput = "structured_output" in parsed
    ? (parsed as ClaudeExecResult).structured_output
    : parsed;
  return {
    structured: normalizeAnswer((structuredOutput ?? {}) as Record<string, unknown>),
    stdout,
    stderr,
  };
}

function claudeModelArg(modelId: string): string {
  if (modelId === "claude-sonnet-4.6") {
    return "claude-sonnet-4-6";
  }
  return modelId;
}

function normalizeAnswer(raw: Record<string, unknown>): ModelAnswer {
  if (!Array.isArray(raw.responses)) {
    throw new Error("Model response does not contain a top-level responses array.");
  }

  return {
    responses: raw.responses.map((entry) => normalizeResponse(entry as Record<string, unknown>)),
  };
}

function normalizeResponse(entry: Record<string, unknown>): EpisodeResponseInput {
  return {
    episodeId: asTrimmedString(entry.episodeId),
    interruptionClass: asTrimmedString(entry.interruptionClass),
    dominantLossClass: asTrimmedString(entry.dominantLossClass),
    boundaryAmbiguous: asTrimmedString(entry.boundaryAmbiguous),
    nearestAlternativeClass: asTrimmedString(entry.nearestAlternativeClass),
    confidence: asTrimmedString(entry.confidence),
    justification: asTrimmedString(entry.justification),
    notes: asTrimmedString(entry.notes),
  };
}

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function extractJson(text: string): string {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1);
  }

  throw new Error("Claude output did not contain a JSON object.");
}

function reorderResponses(responses: EpisodeResponseInput[], episodes: Episode[]): EpisodeResponseInput[] {
  const byId = new Map(responses.map((response) => [response.episodeId, response]));
  return episodes.map((episode) => {
    const response = byId.get(episode.id);
    if (!response) {
      throw new Error(`Model output is missing response for ${episode.id}`);
    }
    return response;
  });
}

function chunkEpisodes(episodes: Episode[], batchSize: number): Episode[][] {
  const chunks: Episode[][] = [];
  for (let index = 0; index < episodes.length; index += batchSize) {
    chunks.push(episodes.slice(index, index + batchSize));
  }
  return chunks;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
