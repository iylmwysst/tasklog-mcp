import { promises as fs } from "node:fs";
import path from "node:path";
import type { Episode } from "./annotator-packet.js";

export interface ChoiceOption {
  value: string;
  label: string;
}

export interface PacketPayload {
  packetTitle: string;
  packetDescription: string;
  episodes: Episode[];
  choices: {
    interruptionClass: ChoiceOption[];
    dominantLossClass: ChoiceOption[];
    boundaryAmbiguous: ChoiceOption[];
    nearestAlternativeClass: ChoiceOption[];
    confidence: ChoiceOption[];
  };
}

export interface EpisodeResponseInput {
  episodeId: string;
  interruptionClass: string;
  dominantLossClass: string;
  boundaryAmbiguous: string;
  nearestAlternativeClass: string;
  confidence: string;
  justification: string;
  notes: string;
}

export interface SubmissionInput {
  respondentName: string;
  respondentTag?: string;
  submittedAtClient?: string;
  overwrite?: boolean;
  responses: EpisodeResponseInput[];
}

export interface SavedSubmissionResult {
  ok: "true";
  fileName: string;
  submittedAt: string;
}

export class DuplicateSubmissionError extends Error {
  existingFileName: string;

  constructor(existingFileName: string) {
    super(`duplicate_submission:${existingFileName}`);
    this.name = "DuplicateSubmissionError";
    this.existingFileName = existingFileName;
  }
}

export async function saveSubmission(
  input: SubmissionInput,
  packet: PacketPayload,
  responseDir: string,
): Promise<SavedSubmissionResult> {
  validateSubmission(input, packet);

  await fs.mkdir(responseDir, { recursive: true });

  const submittedAt = new Date().toISOString();
  const respondentTag = input.respondentTag!.trim();
  const fileName = `${respondentTag}.json`;
  const filePath = path.join(responseDir, fileName);

  if (!input.overwrite) {
    try {
      await fs.access(filePath);
      throw new DuplicateSubmissionError(fileName);
    } catch (error) {
      if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") {
        if (error instanceof DuplicateSubmissionError) {
          throw error;
        }
        throw error;
      }
    }
  }

  const payload = {
    respondentName: input.respondentName.trim(),
    respondentTag,
    submittedAt,
    submittedAtClient: input.submittedAtClient ?? "",
    responseCount: input.responses.length,
    overwrite: Boolean(input.overwrite),
    responses: input.responses,
  };

  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  return {
    ok: "true",
    fileName,
    submittedAt,
  };
}

export function validateSubmission(input: SubmissionInput, packet: PacketPayload): void {
  if (!input.respondentName || input.respondentName.trim().length < 2) {
    throw new Error("respondent_name_required");
  }

  if (!input.respondentTag || input.respondentTag.trim().length < 2) {
    throw new Error("respondent_tag_required");
  }

  if (!Array.isArray(input.responses) || input.responses.length !== packet.episodes.length) {
    throw new Error("invalid_response_count");
  }

  const seen = new Set<string>();

  for (const response of input.responses) {
    if (!response.episodeId || seen.has(response.episodeId)) {
      throw new Error("duplicate_or_missing_episode");
    }
    seen.add(response.episodeId);

    if (!response.interruptionClass || !response.dominantLossClass || !response.boundaryAmbiguous) {
      throw new Error(`missing_required_choice:${response.episodeId}`);
    }

    if (!response.nearestAlternativeClass) {
      throw new Error(`missing_nearest_alternative:${response.episodeId}`);
    }

    if (!response.justification || response.justification.trim().length < 4) {
      throw new Error(`missing_justification:${response.episodeId}`);
    }

    if (response.boundaryAmbiguous === "no" && response.nearestAlternativeClass !== "none") {
      throw new Error(`nearest_alternative_must_be_none:${response.episodeId}`);
    }
  }
}
