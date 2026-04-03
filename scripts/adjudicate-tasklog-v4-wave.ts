import path from "node:path";
import { promises as fs } from "node:fs";

const DEFAULT_FIXTURES_ROOT = "/Users/Lab/Desktop/TasklogSweLab/fixtures-v4";
const DEFAULT_WAVE_ID = "wave_1_audited_subset";
const DEFAULT_RESOLVED_AT = "2026-03-31T10:15:00Z";

type JsonObject = Record<string, unknown>;

interface CliOptions {
  fixturesRoot: string;
  waveId: string;
  resolvedAt: string;
}

interface WaveFixture {
  fixture_id: string;
  family_id: string;
  annotator_a_draft_path: string;
  annotator_b_draft_path: string;
}

interface WaveManifest {
  wave_id: string;
  status: string;
  fixtures: WaveFixture[];
}

interface DraftAnswer {
  fixture_id: string;
  question_id: string;
  expected_answer: {
    decision_type: string;
    selected_work_id: string;
    selected_work_title: string;
    work_status: string;
    next_step_summary: string;
    clarifying_question: string;
    abstention_reason: string;
    escalation_target: string;
    primary_evidence_source: string;
    other_candidate_work_ids: string[];
  };
  next_step_slots: {
    action_verb: string;
    primary_target: string;
    gating_constraint: string;
  };
}

interface AnnotationManifestFixture {
  fixture_id: string;
  annotation_status: string;
}

interface AnnotationManifest {
  status: string;
  fixtures: AnnotationManifestFixture[];
}

interface FrozenAnswerEntry {
  fixture_id: string;
  answer_key_status: string;
  [key: string]: unknown;
}

interface FrozenAnswerManifest {
  status: string;
  entries: FrozenAnswerEntry[];
}

interface Override {
  value: unknown;
  reason: string;
}

type OverrideMap = Record<string, Record<string, Override>>;

const RESOLUTION_OVERRIDES: OverrideMap = {
  "v4-001": {
    "expected_answer.next_step_summary": {
      value: "Freeze the argument and exit-code contract in `swebench/harness/run_evaluation.py` before touching any reporting or docs follow-up.",
      reason: "The latest_next_steps string is authoritative and already states the exact immediate action and gate.",
    },
    "next_step_slots.action_verb": {
      value: "freeze",
      reason: "The frozen next-step wording uses 'Freeze'; the slot is normalized to lowercase without widening the action.",
    },
    "next_step_slots.primary_target": {
      value: "the argument and exit-code contract in `swebench/harness/run_evaluation.py`",
      reason: "This matches the central target named in the latest structured next-step field.",
    },
    "next_step_slots.gating_constraint": {
      value: "before touching any reporting or docs follow-up",
      reason: "The gating condition is stated verbatim in the latest structured next-step field.",
    },
  },
  "v4-005": {
    "expected_answer.next_step_summary": {
      value: "Resume `D7P2V6` by checking the retry and failure-boundary paths in `swebench/harness/prepare_images.py` before editing any memo or docs.",
      reason: "The latest_next_steps field uses 'checking', so the adjudicated summary stays aligned with the frozen workspace evidence.",
    },
    "next_step_slots.action_verb": {
      value: "check",
      reason: "The frozen next-step summary uses 'checking', which is narrower than a broader audit verb.",
    },
  },
  "v4-009": {
    "expected_answer.next_step_summary": {
      value: "Resume `J3K7M2` through escalation by asking the container-ops owner which cleanup boundary is approved before editing `swebench/harness/docker_utils.py`.",
      reason: "The blocked lane's latest_next_steps string is the controlling evidence and already encodes the escalation path.",
    },
    "next_step_slots.action_verb": {
      value: "ask",
      reason: "The guide prefers the narrowest immediate action; here the immediate move is to ask the owner, not to edit code.",
    },
    "next_step_slots.primary_target": {
      value: "which cleanup boundary is approved for `swebench/harness/docker_utils.py`",
      reason: "This isolates the central object of the escalation request without broadening to the whole work lane.",
    },
  },
  "v4-013": {
    "expected_answer.abstention_reason": {
      value: "The visible grading lanes conflict, and no authoritative source establishes which work owns the next move.",
      reason: "The adjudicated wording preserves the family rule that the absence of an authoritative source is what licenses abstention here.",
    },
  },
  "v4-018": {
    "expected_answer.clarifying_question": {
      value: "Does the dataset lane or the evaluation lane own the next retrieval step?",
      reason: "This is the exact ownership fact named in the frozen latest_next_steps field for the active lane.",
    },
  },
  "v4-021": {
    "expected_answer.next_step_summary": {
      value: "Resume `N6V3K8` by tracing the cache-boundary branch in `swebench/harness/docker_build.py` before touching any docs or appendix artifacts.",
      reason: "The latest structured next-step field uses 'tracing' and should control the frozen answer wording.",
    },
    "next_step_slots.action_verb": {
      value: "trace",
      reason: "The frozen next-step evidence uses 'tracing', which is the narrowest supported action verb.",
    },
    "next_step_slots.gating_constraint": {
      value: "before touching any docs or appendix artifacts",
      reason: "This matches the gate encoded in the latest structured next-step field.",
    },
  },
  "v4-026": {
    "expected_answer.other_candidate_work_ids": {
      value: ["G2T6P8"],
      reason: "This fixture explicitly allows one provisional candidate, and the active eval_retrieval lane is the appendix-only candidate preserved by the frozen evidence.",
    },
  },
  "v4-030": {
    "expected_answer.next_step_summary": {
      value: "Resume `Q5M1T7` by re-reading the tokenization review notes and freezing the allowed change boundary before patching `swebench/inference/make_datasets/tokenize_dataset.py`.",
      reason: "The latest_next_steps field explicitly requires a re-reading pass before edits, so the adjudicated wording stays exact to that sequence.",
    },
    "next_step_slots.action_verb": {
      value: "re-read",
      reason: "The frozen next-step wording names a re-reading step; this is narrower than a generic review verb.",
    },
    "next_step_slots.primary_target": {
      value: "the tokenization review notes",
      reason: "The notes are the direct object of the re-reading action before the boundary freeze and code patch.",
    },
  },
};

const TRACKED_FIELDS = [
  "expected_answer.decision_type",
  "expected_answer.selected_work_id",
  "expected_answer.selected_work_title",
  "expected_answer.work_status",
  "expected_answer.next_step_summary",
  "expected_answer.clarifying_question",
  "expected_answer.abstention_reason",
  "expected_answer.escalation_target",
  "expected_answer.primary_evidence_source",
  "expected_answer.other_candidate_work_ids",
  "next_step_slots.action_verb",
  "next_step_slots.primary_target",
  "next_step_slots.gating_constraint",
] as const;

function parseArgs(argv: string[]): CliOptions {
  let fixturesRoot = DEFAULT_FIXTURES_ROOT;
  let waveId = DEFAULT_WAVE_ID;
  let resolvedAt = DEFAULT_RESOLVED_AT;

  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--fixtures-root") {
      fixturesRoot = path.resolve(argv[index + 1] ?? fixturesRoot);
      index += 1;
    } else if (argv[index] === "--wave-id") {
      waveId = argv[index + 1] ?? waveId;
      index += 1;
    } else if (argv[index] === "--resolved-at") {
      resolvedAt = argv[index + 1] ?? resolvedAt;
      index += 1;
    }
  }

  return { fixturesRoot, waveId, resolvedAt };
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function getAtPath(input: JsonObject, dottedPath: string): unknown {
  return dottedPath.split(".").reduce<unknown>((current, part) => {
    if (current === null || typeof current !== "object") {
      return undefined;
    }
    return (current as JsonObject)[part];
  }, input);
}

function setAtPath(input: JsonObject, dottedPath: string, value: unknown): void {
  const parts = dottedPath.split(".");
  let cursor: JsonObject = input;
  for (let index = 0; index < parts.length - 1; index += 1) {
    const part = parts[index]!;
    const next = cursor[part];
    if (next === null || typeof next !== "object" || Array.isArray(next)) {
      cursor[part] = {};
    }
    cursor = cursor[part] as JsonObject;
  }
  cursor[parts[parts.length - 1]!] = value;
}

function stableEquals(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const annotationRoot = path.join(options.fixturesRoot, "annotation");
  const waveManifestPath = path.join(annotationRoot, `${options.waveId.replaceAll("_", "-")}.json`);
  const annotationManifestPath = path.join(annotationRoot, "annotation-manifest.json");
  const disagreementLogPath = path.join(annotationRoot, "disagreement-log.json");
  const adjudicationLogPath = path.join(annotationRoot, "adjudication-log.json");
  const frozenAnswerManifestPath = path.join(annotationRoot, "frozen-answer-key-manifest.json");

  const waveManifest = await readJson<WaveManifest>(waveManifestPath);
  const annotationManifest = await readJson<AnnotationManifest>(annotationManifestPath);
  const frozenAnswerManifest = await readJson<FrozenAnswerManifest>(frozenAnswerManifestPath);

  const disagreementEntries: JsonObject[] = [];
  const adjudicationEntries: JsonObject[] = [];

  for (const fixture of waveManifest.fixtures) {
    const annotatorA = await readJson<DraftAnswer>(fixture.annotator_a_draft_path);
    const annotatorB = await readJson<DraftAnswer>(fixture.annotator_b_draft_path);
    const resolved = clone(annotatorA) as JsonObject;
    const fixtureOverrides = RESOLUTION_OVERRIDES[fixture.fixture_id] ?? {};
    let hadDiff = false;

    for (const fieldName of TRACKED_FIELDS) {
      const annotatorAValue = getAtPath(annotatorA as unknown as JsonObject, fieldName);
      const annotatorBValue = getAtPath(annotatorB as unknown as JsonObject, fieldName);
      const valuesDiffer = !stableEquals(annotatorAValue, annotatorBValue);

      if (!valuesDiffer) {
        continue;
      }

      hadDiff = true;
      const override = fixtureOverrides[fieldName];
      if (!override) {
        throw new Error(`Missing adjudication override for ${fixture.fixture_id} field ${fieldName}`);
      }

      disagreementEntries.push({
        fixture_id: fixture.fixture_id,
        field_name: fieldName,
        annotator_a_value: annotatorAValue,
        annotator_b_value: annotatorBValue,
        wave_id: options.waveId,
      });
      adjudicationEntries.push({
        fixture_id: fixture.fixture_id,
        field_name: fieldName,
        annotator_a_value: annotatorAValue,
        annotator_b_value: annotatorBValue,
        resolved_value: override.value,
        resolution_reason: override.reason,
        adjudicator_id: "adj_01",
        resolved_at: options.resolvedAt,
        wave_id: options.waveId,
      });
      setAtPath(resolved, fieldName, override.value);
    }

    const annotationFixture = annotationManifest.fixtures.find((entry) => entry.fixture_id === fixture.fixture_id);
    if (annotationFixture) {
      annotationFixture.annotation_status = "wave_1_adjudicated";
    }

    const frozenEntry = frozenAnswerManifest.entries.find((entry) => entry.fixture_id === fixture.fixture_id);
    if (!frozenEntry) {
      throw new Error(`Missing frozen answer entry for ${fixture.fixture_id}`);
    }
    frozenEntry.answer_key_status = "frozen_wave_1";
    frozenEntry.frozen_answer = (resolved as { expected_answer: unknown }).expected_answer;
    frozenEntry.frozen_next_step_slots = (resolved as { next_step_slots: unknown }).next_step_slots;
    frozenEntry.freeze_source = hadDiff ? "adjudicated_disagreement" : "annotator_consensus";
    frozenEntry.frozen_at = options.resolvedAt;
    frozenEntry.wave_id = options.waveId;
  }

  waveManifest.status = "adjudicated_ready_for_sample_use";
  annotationManifest.status = "wave_1_adjudicated_partial";

  const disagreementLog = {
    version: 1,
    round_id: "V4",
    benchmark_type: "tasklog_v4_swe_grounded_reentry",
    status: "wave_1_completed",
    wave_id: options.waveId,
    completed_at: options.resolvedAt,
    adjudication_log_path: adjudicationLogPath,
    entry_count: disagreementEntries.length,
    entries: disagreementEntries,
  };

  const adjudicationLog = {
    version: 1,
    round_id: "V4",
    benchmark_type: "tasklog_v4_swe_grounded_reentry",
    status: "wave_1_completed",
    wave_id: options.waveId,
    completed_at: options.resolvedAt,
    entry_count: adjudicationEntries.length,
    entries: adjudicationEntries,
  };

  frozenAnswerManifest.status = "wave_1_frozen_partial";

  await writeJson(waveManifestPath, waveManifest);
  await writeJson(annotationManifestPath, annotationManifest);
  await writeJson(disagreementLogPath, disagreementLog);
  await writeJson(adjudicationLogPath, adjudicationLog);
  await writeJson(frozenAnswerManifestPath, frozenAnswerManifest);

  console.log(JSON.stringify({
    wave_id: options.waveId,
    fixtures_root: options.fixturesRoot,
    disagreement_count: disagreementEntries.length,
    adjudication_count: adjudicationEntries.length,
    frozen_entries_updated: waveManifest.fixtures.length,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
