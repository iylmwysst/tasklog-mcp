export type EpisodeFieldKey =
  | "Setting"
  | "Interruption boundary"
  | "Visible records at resume time"
  | "What happened before or during the interrupted attempt"
  | "Decision pressure"
  | "Complication";

export interface EpisodeField {
  key: EpisodeFieldKey;
  value: string[];
}

export interface Episode {
  id: string;
  title: string;
  fields: EpisodeField[];
}

const FIELD_HEADERS: EpisodeFieldKey[] = [
  "Setting",
  "Interruption boundary",
  "Visible records at resume time",
  "What happened before or during the interrupted attempt",
  "Decision pressure",
  "Complication",
];

export function parseEpisodes(source: string): Episode[] {
  const blocks = source.split(/\n## Episode /g).slice(1);
  return blocks.map((block) => parseEpisodeBlock(block.trim()));
}

function parseEpisodeBlock(block: string): Episode {
  const lines = block.split("\n");
  const id = lines[0].trim();
  const title = `Episode ${id}`;
  const body = lines.slice(1);
  const fields: EpisodeField[] = [];
  let currentKey: EpisodeFieldKey | null = null;
  let currentValue: string[] = [];

  for (const rawLine of body) {
    const line = rawLine.trimEnd();
    const matchedHeader = FIELD_HEADERS.find((header) => line === `${header}:`);

    if (matchedHeader) {
      if (currentKey) {
        fields.push({ key: currentKey, value: trimEmptyEdges(currentValue) });
      }
      currentKey = matchedHeader;
      currentValue = [];
      continue;
    }

    if (line === "---") {
      break;
    }

    if (currentKey) {
      currentValue.push(line);
    }
  }

  if (currentKey) {
    fields.push({ key: currentKey, value: trimEmptyEdges(currentValue) });
  }

  return { id, title, fields };
}

function trimEmptyEdges(lines: string[]): string[] {
  let start = 0;
  let end = lines.length;

  while (start < end && lines[start].trim() === "") {
    start += 1;
  }

  while (end > start && lines[end - 1].trim() === "") {
    end -= 1;
  }

  return lines.slice(start, end);
}
