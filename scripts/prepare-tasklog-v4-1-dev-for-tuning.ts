import path from "node:path";
import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";

const DEFAULT_FIXTURES_ROOT = "/Users/Lab/Desktop/TasklogSweLab/fixtures-v4-1-dev";
const ROUND_ID = "V4.1-dev";
const BENCHMARK_TYPE = "tasklog_v4_swe_grounded_reentry";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const DOCS_ROOT = path.join(REPO_ROOT, "docs");

interface CliOptions {
  fixturesRoot: string;
  preparedAt: string;
}

interface DraftAnswer {
  version: number;
  round_id: string;
  benchmark_type: string;
  fixture_id: string;
  question_id: string;
  question_title: string;
  annotation_status: string;
  annotator_id: string;
  completed_at: string;
  references: Record<string, string>;
  frozen_constraints: {
    family_id: string;
    primary_decision_mode: string;
    difficulty: string;
    candidate_work_id_allowed: boolean;
    rubric_fallback_family: boolean;
    expected_label_mode: string;
    fixture_stage: string;
    human_audit_status: string;
  };
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

interface WorkItem {
  work_id: string;
  title: string;
  status: string;
}

interface SessionLogEntry {
  work_id: string;
  timestamp: string;
  next_steps: string;
}

interface ActiveContext {
  active_work_id: string;
}

interface AnnotationManifestFixture {
  fixture_id: string;
  annotation_status: string;
}

interface AnnotationManifest {
  version: number;
  round_id: string;
  benchmark_type: string;
  annotation_mode: string;
  status: string;
  created_at: string;
  pack_manifest_path: string;
  role_assignment_path: string;
  prompt_pack_manifest_path: string;
  disagreement_log_path: string;
  adjudication_log_path: string;
  future_frozen_answer_key_manifest_path: string;
  role_assignment_frozen_at?: string;
  fixtures: AnnotationManifestFixture[];
}

interface RoleAssignment {
  version: number;
  round_id: string;
  benchmark_type: string;
  annotation_mode: string;
  annotation_phase: string;
  created_at: string;
  frozen_at: string;
  roles: Record<string, string>;
}

interface FrozenAnswerEntry {
  fixture_id: string;
  answer_key_status: string;
  [key: string]: unknown;
}

interface FrozenAnswerManifest {
  version: number;
  round_id: string;
  benchmark_type: string;
  status: string;
  created_at: string;
  entry_count: number;
  adjudication_log_path: string;
  entries: FrozenAnswerEntry[];
}

interface SpotCheckSelection {
  fixture_id: string;
  family_id: string;
  review_goal: string;
  rationale: string;
}

function parseArgs(argv: string[]): CliOptions {
  let fixturesRoot = DEFAULT_FIXTURES_ROOT;
  let preparedAt = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current === "--fixtures-root") {
      fixturesRoot = path.resolve(argv[index + 1] ?? fixturesRoot);
      index += 1;
      continue;
    }
    if (current === "--prepared-at") {
      preparedAt = argv[index + 1] ?? preparedAt;
      index += 1;
    }
  }

  return { fixturesRoot, preparedAt };
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function areaLabelFromPath(targetPath: string): string {
  if (targetPath.includes("/collect/")) {
    return "collect";
  }
  if (targetPath.includes("/versioning/extract_web/")) {
    return "versioning extract web";
  }
  if (targetPath.includes("/inference/llamao/")) {
    return "inference llamao";
  }
  if (targetPath.includes("/inference/")) {
    return "inference";
  }
  if (targetPath.includes("/harness/log_parsers/")) {
    return "harness log parsers";
  }
  if (targetPath.includes("/harness/test_spec/")) {
    return "harness test spec";
  }
  if (targetPath.includes("/harness/modal_eval/")) {
    return "harness modal eval";
  }
  return "source-backed";
}

function latestLog(entries: SessionLogEntry[]): SessionLogEntry {
  const sorted = [...entries].sort((left, right) => right.timestamp.localeCompare(left.timestamp));
  const candidate = sorted[0];
  if (!candidate) {
    throw new Error("Fixture is missing session logs");
  }
  return candidate;
}

function buildResumeSlots(nextStepSummary: string): { action_verb: string; primary_target: string; gating_constraint: string } {
  const reviewMatch = nextStepSummary.match(/^Resume `[^`]+` by reviewing `([^`]+)` and freezing the next concrete boundary before broader follow-up work\.$/);
  if (reviewMatch) {
    return {
      action_verb: "review",
      primary_target: `\`${reviewMatch[1]}\``,
      gating_constraint: "before broader follow-up work",
    };
  }

  const escalationMatch = nextStepSummary.match(/^Resume `[^`]+` through escalation by asking (.+) before editing `([^`]+)`\.$/);
  if (escalationMatch) {
    return {
      action_verb: "ask",
      primary_target: escalationMatch[1]!,
      gating_constraint: `before editing \`${escalationMatch[2]}\``,
    };
  }

  const rereadMatch = nextStepSummary.match(/^Resume `[^`]+` by re-reading the frozen notes for `([^`]+)` and confirming the next allowed boundary before patching code\.$/);
  if (rereadMatch) {
    return {
      action_verb: "re-read",
      primary_target: `the frozen notes for \`${rereadMatch[1]}\``,
      gating_constraint: "before patching code",
    };
  }

  throw new Error(`Unsupported next-step pattern: ${nextStepSummary}`);
}

function buildClarifyingQuestion(nextSteps: string): string {
  const match = nextSteps.match(/^Ask (.+) before resuming .+\.$/);
  if (!match) {
    throw new Error(`Unsupported clarifying-question pattern: ${nextSteps}`);
  }
  const prompt = match[1]!;
  return `${prompt.charAt(0).toUpperCase()}${prompt.slice(1)}?`;
}

function buildAbstentionReason(expectedLabelMode: string, pathLabel: string): string {
  if (expectedLabelMode === "conflicting_sources") {
    return `The visible ${pathLabel} lanes conflict, and no authoritative source establishes which work owns the next move.`;
  }
  return `No authoritative source establishes which ${pathLabel} lane owns the next move.`;
}

function buildSeededAnswer(params: {
  draft: DraftAnswer;
  works: WorkItem[];
  logs: SessionLogEntry[];
  activeContext: ActiveContext;
  sourcePath: string;
}): Pick<DraftAnswer, "expected_answer" | "next_step_slots"> {
  const { draft, works, logs, activeContext, sourcePath } = params;
  const decisionType = draft.frozen_constraints.primary_decision_mode;
  const recent = latestLog(logs);
  const workById = new Map(works.map((work) => [work.work_id, work]));
  const selectedWork = workById.get(recent.work_id) ?? workById.get(activeContext.active_work_id);
  const pathLabel = areaLabelFromPath(sourcePath);

  if (decisionType === "resume_work" || decisionType === "resume_blocked_with_escalation") {
    if (!selectedWork) {
      throw new Error(`Missing selected work for ${draft.fixture_id}`);
    }
    return {
      expected_answer: {
        decision_type: decisionType,
        selected_work_id: selectedWork.work_id,
        selected_work_title: selectedWork.title,
        work_status: selectedWork.status,
        next_step_summary: recent.next_steps,
        clarifying_question: "",
        abstention_reason: "",
        escalation_target: decisionType === "resume_blocked_with_escalation" ? "owning reviewer" : "",
        primary_evidence_source: "latest_next_steps",
        other_candidate_work_ids: [],
      },
      next_step_slots: buildResumeSlots(recent.next_steps),
    };
  }

  if (decisionType === "ask_clarifying_question") {
    return {
      expected_answer: {
        decision_type: decisionType,
        selected_work_id: "",
        selected_work_title: "",
        work_status: "",
        next_step_summary: "",
        clarifying_question: buildClarifyingQuestion(recent.next_steps),
        abstention_reason: "",
        escalation_target: "",
        primary_evidence_source: draft.frozen_constraints.expected_label_mode,
        other_candidate_work_ids: draft.frozen_constraints.candidate_work_id_allowed ? [recent.work_id] : [],
      },
      next_step_slots: {
        action_verb: "",
        primary_target: "",
        gating_constraint: "",
      },
    };
  }

  if (decisionType === "abstain_insufficient_evidence") {
    return {
      expected_answer: {
        decision_type: decisionType,
        selected_work_id: "",
        selected_work_title: "",
        work_status: "",
        next_step_summary: "",
        clarifying_question: "",
        abstention_reason: buildAbstentionReason(draft.frozen_constraints.expected_label_mode, pathLabel),
        escalation_target: "",
        primary_evidence_source: draft.frozen_constraints.expected_label_mode,
        other_candidate_work_ids: [],
      },
      next_step_slots: {
        action_verb: "",
        primary_target: "",
        gating_constraint: "",
      },
    };
  }

  throw new Error(`Unsupported decision type: ${decisionType}`);
}

function spotCheckSelections(): SpotCheckSelection[] {
  return [
    {
      fixture_id: "v4-1-dev-007",
      family_id: "abstain_when_no_authoritative_source",
      review_goal: "ambiguity-heavy conflicting-source abstention",
      rationale: "Covers the policy requirement for an ambiguity-heavy fixture where visible open lanes exist but no justified resume decision is licensed.",
    },
    {
      fixture_id: "v4-1-dev-005",
      family_id: "blocked_work_requires_escalation",
      review_goal: "escalation-gated blocked work",
      rationale: "Checks that the lane treats owner escalation as the immediate legal next move rather than allowing a direct code edit.",
    },
    {
      fixture_id: "v4-1-dev-013",
      family_id: "provenance_tiebreak_between_open_works",
      review_goal: "provenance-sensitive tiebreak",
      rationale: "Verifies that the seeded gold picks the source-backed open lane rather than a neighboring open distractor.",
    },
    {
      fixture_id: "v4-1-dev-015",
      family_id: "resume_with_state_constrained_next_step",
      review_goal: "state-constrained next-step precision",
      rationale: "Confirms that the next-step slot key stays tied to the re-read-before-patch gating sequence instead of a generic resume action.",
    },
  ];
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const annotationRoot = path.join(options.fixturesRoot, "annotation");
  const roleAssignmentPath = path.join(annotationRoot, "role-assignment.json");
  const annotationManifestPath = path.join(annotationRoot, "annotation-manifest.json");
  const frozenAnswerManifestPath = path.join(annotationRoot, "frozen-answer-key-manifest.json");
  const disagreementLogPath = path.join(annotationRoot, "disagreement-log.json");
  const adjudicationLogPath = path.join(annotationRoot, "adjudication-log.json");
  const spotCheckManifestPath = path.join(annotationRoot, "spot-check-manifest.json");
  const spotCheckChecklistPath = path.join(annotationRoot, "spot-check-checklist.md");

  const roleAssignment = await readJson<RoleAssignment>(roleAssignmentPath);
  const annotationManifest = await readJson<AnnotationManifest>(annotationManifestPath);
  const frozenAnswerManifest = await readJson<FrozenAnswerManifest>(frozenAnswerManifestPath);

  if (annotationManifest.round_id !== ROUND_ID || frozenAnswerManifest.round_id !== ROUND_ID || roleAssignment.round_id !== ROUND_ID) {
    throw new Error("Unexpected round id while preparing V4.1-dev tuning pack");
  }

  roleAssignment.annotation_phase = "role_assignment_frozen";
  roleAssignment.frozen_at = options.preparedAt;
  annotationManifest.role_assignment_frozen_at = options.preparedAt;

  for (const fixtureEntry of frozenAnswerManifest.entries) {
    const references = fixtureEntry.references as Record<string, unknown>;
    const annotatorAPath = String(references.annotator_a_draft_path);
    const annotatorBPath = String(references.annotator_b_draft_path);
    const workspaceRoot = String(references.workspace_root);
    const fixturePath = String(references.fixture_path);
    const draftA = await readJson<DraftAnswer>(annotatorAPath);
    const draftB = await readJson<DraftAnswer>(annotatorBPath);
    const works = await readJson<WorkItem[]>(path.join(workspaceRoot, ".tasklog", "works.json"));
    const logs = await readJson<SessionLogEntry[]>(path.join(workspaceRoot, ".tasklog", "session-log.json"));
    const activeContext = await readJson<ActiveContext>(path.join(workspaceRoot, ".tasklog", "active-context.json"));
    const sourcePath = String((await readJson<{ source_rel_paths: string[] }>(fixturePath)).source_rel_paths[0] ?? "");

    const seeded = buildSeededAnswer({
      draft: draftA,
      works,
      logs,
      activeContext,
      sourcePath,
    });

    draftA.annotation_status = "completed";
    draftA.annotator_id = "ann_a_01";
    draftA.completed_at = options.preparedAt;
    draftA.expected_answer = seeded.expected_answer;
    draftA.next_step_slots = seeded.next_step_slots;
    draftA.annotation_notes = "Author-seeded provisional dev-lane gold for immediate tuning bootstrap; targeted spot-check still pending.";
    draftA.rubric_notes = "";

    draftB.annotation_status = "completed";
    draftB.annotator_id = "ann_b_01";
    draftB.completed_at = options.preparedAt;
    draftB.expected_answer = seeded.expected_answer;
    draftB.next_step_slots = seeded.next_step_slots;
    draftB.annotation_notes = "Author-seeded provisional dev-lane gold for immediate tuning bootstrap; targeted spot-check still pending.";
    draftB.rubric_notes = "";

    await writeJson(annotatorAPath, draftA);
    await writeJson(annotatorBPath, draftB);

    const annotationFixture = annotationManifest.fixtures.find((entry) => entry.fixture_id === fixtureEntry.fixture_id);
    if (annotationFixture) {
      annotationFixture.annotation_status = "provisional_seeded_ready_for_spot_check";
    }

    fixtureEntry.answer_key_status = "provisional_seeded_ready_for_spot_check";
    fixtureEntry.frozen_answer = seeded.expected_answer;
    fixtureEntry.frozen_next_step_slots = seeded.next_step_slots;
    fixtureEntry.freeze_source = "author_seed_consensus";
    fixtureEntry.frozen_at = options.preparedAt;
    fixtureEntry.wave_id = "dev_seed_v1";
  }

  annotationManifest.status = "provisional_seeded_ready_for_spot_check";
  frozenAnswerManifest.status = "provisional_seeded_ready_for_spot_check";

  const spotChecks = spotCheckSelections();
  const spotCheckManifest = {
    version: 1,
    round_id: ROUND_ID,
    benchmark_type: BENCHMARK_TYPE,
    status: "recommended_pending",
    prepared_at: options.preparedAt,
    policy_path: path.join(DOCS_ROOT, "tasklog-v4-1-dev-human-audit-policy.md"),
    fixtures: spotChecks,
  };

  const spotCheckChecklist = [
    "# V4.1-dev Spot-Check Checklist",
    "",
    `Prepared at: ${options.preparedAt}`,
    "",
    "Review these 4 fixtures before relying on the lane for a larger tuning pass:",
    "",
    ...spotChecks.flatMap((entry) => [
      `## ${entry.fixture_id}`,
      "",
      `- family: \`${entry.family_id}\``,
      `- review_goal: ${entry.review_goal}`,
      `- rationale: ${entry.rationale}`,
      `- fixture: ${path.join(options.fixturesRoot, entry.fixture_id, "fixture.json")}`,
      `- annotator A draft: ${path.join(annotationRoot, "annotator-a", `${entry.fixture_id}.answer-key.json`)}`,
      `- annotator B draft: ${path.join(annotationRoot, "annotator-b", `${entry.fixture_id}.answer-key.json`)}`,
      "",
    ]),
  ].join("\n");

  const disagreementLog = {
    version: 1,
    round_id: ROUND_ID,
    benchmark_type: BENCHMARK_TYPE,
    status: "author_seed_consensus",
    completed_at: options.preparedAt,
    entry_count: 0,
    entries: [],
  };

  const adjudicationLog = {
    version: 1,
    round_id: ROUND_ID,
    benchmark_type: BENCHMARK_TYPE,
    status: "author_seed_consensus",
    completed_at: options.preparedAt,
    entry_count: 0,
    entries: [],
  };

  await writeJson(roleAssignmentPath, roleAssignment);
  await writeJson(annotationManifestPath, annotationManifest);
  await writeJson(frozenAnswerManifestPath, frozenAnswerManifest);
  await writeJson(disagreementLogPath, disagreementLog);
  await writeJson(adjudicationLogPath, adjudicationLog);
  await writeJson(spotCheckManifestPath, spotCheckManifest);
  await fs.writeFile(spotCheckChecklistPath, `${spotCheckChecklist}\n`, "utf8");

  console.log(JSON.stringify({
    round_id: ROUND_ID,
    fixtures_root: options.fixturesRoot,
    prepared_at: options.preparedAt,
    annotation_status: annotationManifest.status,
    frozen_answer_status: frozenAnswerManifest.status,
    spot_check_fixture_ids: spotChecks.map((entry) => entry.fixture_id),
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
