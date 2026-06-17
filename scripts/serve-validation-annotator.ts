import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import { parseEpisodes as parsePacketEpisodes, type Episode } from "../src/annotator-packet.js";
import {
  DuplicateSubmissionError,
  saveSubmission,
  type PacketPayload,
  type ChoiceOption,
  type SubmissionInput,
} from "../src/annotator-submission.js";

const projectRoot = process.cwd();
const port = Number.parseInt(process.env.PORT ?? "8788", 10);
const host = process.env.HOST ?? "127.0.0.1";
const publicDir = path.join(projectRoot, "annotator-web");
const packetPath = path.join(projectRoot, "docs", "validation-30-episode-send-pack-th.md");
const responseDir = path.join(projectRoot, "annotator-data", "responses");

const CONTENT_TYPES = new Map<string, string>([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "application/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
]);

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

async function main(): Promise<void> {
  await fs.mkdir(responseDir, { recursive: true });
  const packet = await loadPacket();

  const server = createServer(async (request, response) => {
    try {
      await routeRequest(request, response, packet);
    } catch (error) {
      if (error instanceof DuplicateSubmissionError) {
        sendJson(response, 409, {
          error: "duplicate_submission",
          existingFileName: error.existingFileName,
        });
        return;
      }
      console.error("annotator-web error", error);
      sendJson(response, 500, { error: "internal_error" });
    }
  });

  server.listen(port, host, () => {
    console.log(`Validation annotator web running on http://${host}:${port}`);
    console.log(`Responses will be saved under ${responseDir}`);
  });
}

async function routeRequest(
  request: IncomingMessage,
  response: ServerResponse,
  packet: PacketPayload,
): Promise<void> {
  const method = request.method ?? "GET";
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

  if (method === "GET" && url.pathname === "/api/packet") {
    sendJson(response, 200, packet);
    return;
  }

  if (method === "GET" && url.pathname === "/api/health") {
    sendJson(response, 200, { ok: true, episodes: packet.episodes.length });
    return;
  }

  if (method === "POST" && url.pathname === "/api/submissions") {
    const body = await readJsonBody(request);
    const saved = await saveSubmission(body, packet, responseDir);
    sendJson(response, 201, saved);
    return;
  }

  if (method === "GET") {
    await serveStatic(url.pathname, response);
    return;
  }

  sendJson(response, 404, { error: "not_found" });
}

async function loadPacket(): Promise<PacketPayload> {
  const source = await fs.readFile(packetPath, "utf8");
  const episodes = parsePacketEpisodes(source);

  return {
    packetTitle: "Interrupted Coding Work Taxonomy: 30-Episode Validation Round",
    packetDescription:
      "แบบประเมินภายในสำหรับ annotator ใช้ตอบทีละ episode พร้อมบันทึกคำตอบเป็นรายบุคคล",
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

function toOptions(entries: Array<[string, string]>): ChoiceOption[] {
  return entries.map(([value, label]) => ({ value, label }));
}

async function serveStatic(pathname: string, response: ServerResponse): Promise<void> {
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const normalizedPath = path.normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(publicDir, normalizedPath);

  if (!filePath.startsWith(publicDir)) {
    sendJson(response, 403, { error: "forbidden" });
    return;
  }

  try {
    const content = await fs.readFile(filePath);
    const extension = path.extname(filePath);
    response.writeHead(200, {
      "content-type": CONTENT_TYPES.get(extension) ?? "application/octet-stream",
    });
    response.end(content);
  } catch {
    sendJson(response, 404, { error: "not_found" });
  }
}

async function readJsonBody(request: IncomingMessage): Promise<SubmissionInput> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return JSON.parse(raw) as SubmissionInput;
}

function sendJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
}

void main();
