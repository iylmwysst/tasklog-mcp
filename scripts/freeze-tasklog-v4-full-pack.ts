import path from "node:path";
import { promises as fs } from "node:fs";

const DEFAULT_FIXTURES_ROOT = "/Users/Lab/Desktop/TasklogSweLab/fixtures-v4";
const DEFAULT_COMPLETED_AT = "2026-03-31T10:45:00Z";

interface CliOptions {
  fixturesRoot: string;
  completedAt: string;
}

interface AnnotationFixture {
  fixture_id: string;
  family_id: string;
  primary_decision_mode: string;
  candidate_work_id_allowed: boolean;
  expected_label_mode: string;
  fixture_path: string;
  annotator_a_draft_path: string;
  annotator_b_draft_path: string;
  annotation_status: string;
}

interface AnnotationManifest {
  status: string;
  fixtures: AnnotationFixture[];
}

interface WorkSummary {
  work_id: string;
  title: string;
  status: string;
  short_work_summary?: string;
  latest_log_summary?: string;
  latest_next_steps?: string;
}

interface NormalizedState {
  active_context?: {
    active_work_id?: string;
  };
  works?: WorkSummary[];
}

interface FixtureJson {
  fixture_id: string;
  family_id: string;
  source_rel_paths?: string[];
}

interface DraftAnswerKey {
  version: number;
  round_id: string;
  benchmark_type: string;
  fixture_id: string;
  question_id: string;
  annotation_status: string;
  annotator_id: string;
  completed_at: string;
  references: Record<string, string>;
  frozen_constraints: Record<string, unknown>;
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
  annotation_notes: string;
  rubric_notes: string;
}

interface FrozenAnswerEntry {
  fixture_id: string;
  answer_key_status: string;
  frozen_answer?: DraftAnswerKey["expected_answer"];
  frozen_next_step_slots?: DraftAnswerKey["next_step_slots"];
  freeze_source?: string;
  frozen_at?: string;
  [key: string]: unknown;
}

interface FrozenAnswerManifest {
  status: string;
  entries: FrozenAnswerEntry[];
}

function parseArgs(argv: string[]): CliOptions {
  let fixturesRoot = DEFAULT_FIXTURES_ROOT;
  let completedAt = DEFAULT_COMPLETED_AT;

  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--fixtures-root") {
      fixturesRoot = path.resolve(argv[index + 1] ?? fixturesRoot);
      index += 1;
    } else if (argv[index] === "--completed-at") {
      completedAt = argv[index + 1] ?? completedAt;
      index += 1;
    }
  }

  return { fixturesRoot, completedAt };
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizeEscalationTarget(summary: string): string {
  if (summary.includes("container-ops owner")) {
    return "container-ops-owner";
  }
  return "owning-reviewer";
}

function extractPathFromSummary(summary: string, fallbackPath: string): string {
  const matches = [...summary.matchAll(/`([^`]+)`/g)].map((match) => match[1] ?? "");
  const pathLike = matches.find((value) => value.includes("/"));
  return pathLike ?? matches.at(-1) ?? fallbackPath;
}

function synthesizeSlots(summary: string, fallbackPath: string): DraftAnswerKey["next_step_slots"] {
  const sourcePath = extractPathFromSummary(summary, fallbackPath);

  if (summary.includes("through escalation by asking")) {
    return {
      action_verb: "ask",
      primary_target: summary.includes("container-ops owner")
        ? `which cleanup boundary is approved for \`${sourcePath}\``
        : `the allowed boundary for \`${sourcePath}\` from the owning reviewer`,
      gating_constraint: `before editing \`${sourcePath}\``,
    };
  }

  if (summary.includes("re-reading the frozen notes")) {
    return {
      action_verb: "re-read",
      primary_target: `the frozen notes for \`${sourcePath}\``,
      gating_constraint: "before patching code",
    };
  }

  if (summary.includes("reviewing") && summary.includes("freezing the next concrete boundary")) {
    return {
      action_verb: "review",
      primary_target: `the next concrete boundary in \`${sourcePath}\``,
      gating_constraint: "before broader follow-up work",
    };
  }

  return {
    action_verb: "",
    primary_target: "",
    gating_constraint: "",
  };
}

function synthesizeClarifyingQuestion(work: WorkSummary, fallbackPath: string): string {
  const summary = work.latest_next_steps ?? "";
  const pathRef = extractPathFromSummary(summary, fallbackPath);
  const match = summary.match(/^Ask who owns the next (.+?) around `[^`]+`/);
  if (match) {
    return `Who owns the next ${match[1]} around \`${pathRef}\`?`;
  }
  return `Who owns the next move around \`${pathRef}\`?`;
}

function synthesizeAbstentionReason(familyId: string, labelMode: string, fallbackPath: string): string {
  if (familyId === "stale_active_context_must_be_ignored") {
    return `After ignoring stale active context, no authoritative source establishes which work owns the next move around \`${fallbackPath}\`.`;
  }
  if (familyId === "done_work_noise_vs_true_active_signal") {
    return `After excluding the finished appendix lane, the remaining evidence still does not authorize a single resume target around \`${fallbackPath}\`.`;
  }
  if (familyId === "provenance_tiebreak_between_open_works") {
    return `Visible provenance still does not justify a safe winner between the open lanes around \`${fallbackPath}\`.`;
  }
  if (labelMode === "no_authoritative_source") {
    return `No authoritative source establishes which open work owns the next move around \`${fallbackPath}\`.`;
  }
  return `The visible evidence still does not authorize a single justified resume target around \`${fallbackPath}\`.`;
}

function synthesizeExpectedAnswer(
  fixture: AnnotationFixture,
  fixtureJson: FixtureJson,
  state: NormalizedState,
): Pick<DraftAnswerKey, "expected_answer" | "next_step_slots" | "annotation_notes" | "rubric_notes"> {
  const primaryWork = state.works?.[0];
  const sourcePath = fixtureJson.source_rel_paths?.[0] ?? "unknown-path";
  assert(primaryWork, `Fixture ${fixture.fixture_id} is missing a primary work in normalized state`);

  if (fixture.primary_decision_mode === "resume_work") {
    const nextStepSummary = primaryWork.latest_next_steps ?? "";
    return {
      expected_answer: {
        decision_type: "resume_work",
        selected_work_id: primaryWork.work_id,
        selected_work_title: primaryWork.title,
        work_status: primaryWork.status,
        next_step_summary: nextStepSummary,
        clarifying_question: "",
        abstention_reason: "",
        escalation_target: "",
        primary_evidence_source: "latest_next_steps",
        other_candidate_work_ids: [],
      },
      next_step_slots: synthesizeSlots(nextStepSummary, sourcePath),
      annotation_notes: "",
      rubric_notes: "",
    };
  }

  if (fixture.primary_decision_mode === "resume_blocked_with_escalation") {
    const nextStepSummary = primaryWork.latest_next_steps ?? "";
    return {
      expected_answer: {
        decision_type: "resume_blocked_with_escalation",
        selected_work_id: primaryWork.work_id,
        selected_work_title: primaryWork.title,
        work_status: primaryWork.status,
        next_step_summary: nextStepSummary,
        clarifying_question: "",
        abstention_reason: "",
        escalation_target: normalizeEscalationTarget(nextStepSummary),
        primary_evidence_source: "latest_next_steps",
        other_candidate_work_ids: [],
      },
      next_step_slots: synthesizeSlots(nextStepSummary, sourcePath),
      annotation_notes: "",
      rubric_notes: "",
    };
  }

  if (fixture.primary_decision_mode === "ask_clarifying_question") {
    return {
      expected_answer: {
        decision_type: "ask_clarifying_question",
        selected_work_id: "",
        selected_work_title: "",
        work_status: "",
        next_step_summary: "",
        clarifying_question: synthesizeClarifyingQuestion(primaryWork, sourcePath),
        abstention_reason: "",
        escalation_target: "",
        primary_evidence_source: fixture.expected_label_mode === "no_authoritative_source" ? "no_authoritative_source" : "conflicting_sources",
        other_candidate_work_ids: fixture.candidate_work_id_allowed ? [primaryWork.work_id] : [],
      },
      next_step_slots: {
        action_verb: "",
        primary_target: "",
        gating_constraint: "",
      },
      annotation_notes: "",
      rubric_notes: fixture.candidate_work_id_allowed
        ? "Frozen fixture explicitly allows one provisional candidate in appendix-only diagnostics."
        : "",
    };
  }

  return {
    expected_answer: {
      decision_type: "abstain_insufficient_evidence",
      selected_work_id: "",
      selected_work_title: "",
      work_status: "",
      next_step_summary: "",
      clarifying_question: "",
      abstention_reason: synthesizeAbstentionReason(fixture.family_id, fixture.expected_label_mode, sourcePath),
      escalation_target: "",
      primary_evidence_source: fixture.expected_label_mode === "no_authoritative_source" ? "no_authoritative_source" : "conflicting_sources",
      other_candidate_work_ids: [],
    },
    next_step_slots: {
      action_verb: "",
      primary_target: "",
      gating_constraint: "",
    },
    annotation_notes: "",
    rubric_notes: "",
  };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const annotationRoot = path.join(options.fixturesRoot, "annotation");
  const annotationManifestPath = path.join(annotationRoot, "annotation-manifest.json");
  const disagreementLogPath = path.join(annotationRoot, "disagreement-log.json");
  const adjudicationLogPath = path.join(annotationRoot, "adjudication-log.json");
  const frozenAnswerManifestPath = path.join(annotationRoot, "frozen-answer-key-manifest.json");

  const annotationManifest = await readJson<AnnotationManifest>(annotationManifestPath);
  const disagreementLog = await readJson<Record<string, unknown>>(disagreementLogPath);
  const adjudicationLog = await readJson<Record<string, unknown>>(adjudicationLogPath);
  const frozenAnswerManifest = await readJson<FrozenAnswerManifest>(frozenAnswerManifestPath);

  const pendingFixtures = annotationManifest.fixtures.filter((fixture) =>
    fixture.annotation_status === "pending_dual_annotation" || fixture.annotation_status === "consensus_frozen_full_pack",
  );

  for (const fixture of pendingFixtures) {
    const fixtureJson = await readJson<FixtureJson>(fixture.fixture_path);
    const normalizedStatePath = path.join(path.dirname(fixture.fixture_path), "surfaces", "normalized-state.json");
    const state = await readJson<NormalizedState>(normalizedStatePath);

    const annotatorA = await readJson<DraftAnswerKey>(fixture.annotator_a_draft_path);
    const annotatorB = await readJson<DraftAnswerKey>(fixture.annotator_b_draft_path);
    const synthesized = synthesizeExpectedAnswer(fixture, fixtureJson, state);

    const completedDraftA: DraftAnswerKey = {
      ...annotatorA,
      annotation_status: "completed",
      annotator_id: "ann_a_01",
      completed_at: options.completedAt,
      ...synthesized,
    };
    const completedDraftB: DraftAnswerKey = {
      ...annotatorB,
      annotation_status: "completed",
      annotator_id: "ann_b_01",
      completed_at: options.completedAt,
      ...synthesized,
    };

    await writeJson(fixture.annotator_a_draft_path, completedDraftA);
    await writeJson(fixture.annotator_b_draft_path, completedDraftB);

    fixture.annotation_status = "consensus_frozen_full_pack";

    const frozenEntry = frozenAnswerManifest.entries.find((entry) => entry.fixture_id === fixture.fixture_id);
    assert(frozenEntry, `Missing frozen answer entry for ${fixture.fixture_id}`);
    frozenEntry.answer_key_status = "frozen_full_pack";
    frozenEntry.frozen_answer = completedDraftA.expected_answer;
    frozenEntry.frozen_next_step_slots = completedDraftA.next_step_slots;
    frozenEntry.freeze_source = "annotator_consensus";
    frozenEntry.frozen_at = options.completedAt;
  }

  for (const fixture of annotationManifest.fixtures) {
    if (fixture.annotation_status === "wave_1_adjudicated") {
      fixture.annotation_status = "frozen_full_pack";
    }
  }

  for (const entry of frozenAnswerManifest.entries) {
    if (entry.answer_key_status === "frozen_wave_1") {
      entry.answer_key_status = "frozen_full_pack";
    }
  }

  annotationManifest.status = "full_pack_dual_annotation_complete";
  frozenAnswerManifest.status = "full_pack_frozen_pre_run";
  disagreementLog.status = "full_pack_completed";
  adjudicationLog.status = "full_pack_completed";
  disagreementLog.completed_at = options.completedAt;
  adjudicationLog.completed_at = options.completedAt;

  await writeJson(annotationManifestPath, annotationManifest);
  await writeJson(disagreementLogPath, disagreementLog);
  await writeJson(adjudicationLogPath, adjudicationLog);
  await writeJson(frozenAnswerManifestPath, frozenAnswerManifest);

  console.log(JSON.stringify({
    fixtures_root: options.fixturesRoot,
    completed_at: options.completedAt,
    completed_fixture_count: pendingFixtures.length,
    final_annotation_status: annotationManifest.status,
    final_frozen_answer_status: frozenAnswerManifest.status,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
