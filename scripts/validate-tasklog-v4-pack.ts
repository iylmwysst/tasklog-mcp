import path from "node:path";
import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";

const DEFAULT_FIXTURES_ROOT = "/Users/Lab/Desktop/TasklogSweLab/fixtures-v4";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const DOCS_ROOT = path.join(REPO_ROOT, "docs");
const ROUND_ID = "V4";
const BENCHMARK_TYPE = "tasklog_v4_swe_grounded_reentry";

interface CliOptions {
  fixturesRoot: string;
}

interface PackFixture {
  fixture_id: string;
  family_id: string;
  source_instance_id: string;
  difficulty: string;
  human_audit_status: string;
}

interface PackManifest {
  version: number;
  pack_id: string;
  round_id: string;
  benchmark_type: string;
  fixture_count: number;
  source_pool_manifest: string;
  family_allocation_manifest: string;
  prompt_versions_manifest: string;
  audit_subset_manifest: string;
  answer_contract_manifest: string;
  grader_contract_manifest: string;
  ontology_manifest: string;
  adjudication_guide_manifest: string;
  fixtures: PackFixture[];
}

interface AllocationFixture {
  fixture_id: string;
  family_id: string;
  source_instance_id: string;
  primary_decision_mode: string;
  difficulty: string;
  candidate_work_id_allowed: boolean;
  expected_label_mode: string;
}

interface AllocationDoc {
  fixtures: AllocationFixture[];
}

interface QuestionRow {
  question_id: string;
  answer_contract_path?: string;
  required_fields: string[];
  optional_fields?: string[];
}

interface QuestionsPack {
  round_id: string;
  fixture_id: string;
  benchmark_type: string;
  questions: QuestionRow[];
}

interface FixtureJson {
  round_id: string;
  benchmark_type: string;
  fixture_id: string;
  family_id: string;
  difficulty: string;
  candidate_work_id_allowed: boolean;
  primary_decision_mode: string;
  expected_label_mode: string;
  source_instance_id: string;
  evaluation_refs?: {
    answer_contract_path?: string;
    grader_contract_path?: string;
    ontology_path?: string;
    adjudication_guide_path?: string;
  };
}

interface FixtureManifest {
  round_id: string;
  fixture_id: string;
  benchmark_type: string;
  fixture_stage: string;
  generation_metadata?: {
    human_audit_status?: string;
  };
}

interface AnnotationManifestFixture {
  fixture_id: string;
  family_id: string;
  source_instance_id: string;
  primary_decision_mode: string;
  candidate_work_id_allowed: boolean;
  expected_label_mode: string;
  human_audit_status: string;
  fixture_path: string;
  fixture_manifest_path: string;
  questions_path: string;
  annotator_a_draft_path: string;
  annotator_b_draft_path: string;
  annotation_status: string;
}

interface AnnotationManifest {
  round_id: string;
  benchmark_type: string;
  status: string;
  fixtures: AnnotationManifestFixture[];
}

interface DraftAnswerKey {
  round_id: string;
  benchmark_type: string;
  fixture_id: string;
  question_id: string;
  references: {
    fixture_path: string;
    fixture_manifest_path: string;
    questions_path: string;
    normalized_state_path: string;
    tasklog_reentry_path: string;
    workspace_root: string;
    workdocs_root: string;
    answer_contract_path: string;
    grader_contract_path: string;
    ontology_path: string;
    adjudication_guide_path: string;
  };
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
    other_candidate_work_ids: string[];
  };
}

interface FrozenAnswerEntry {
  fixture_id: string;
  question_id: string;
  frozen_constraints: DraftAnswerKey["frozen_constraints"];
  references: DraftAnswerKey["references"] & {
    annotator_a_draft_path: string;
    annotator_b_draft_path: string;
    adjudication_log_path: string;
  };
  answer_key_status: string;
}

interface FrozenAnswerKeyManifest {
  round_id: string;
  benchmark_type: string;
  status: string;
  entry_count: number;
  entries: FrozenAnswerEntry[];
}

function parseArgs(argv: string[]): CliOptions {
  let fixturesRoot = DEFAULT_FIXTURES_ROOT;
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--fixtures-root") {
      fixturesRoot = path.resolve(argv[index + 1] ?? fixturesRoot);
      index += 1;
    }
  }
  return { fixturesRoot };
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

async function assertExists(filePath: string, label: string): Promise<void> {
  try {
    await fs.access(filePath);
  } catch {
    throw new Error(`Missing ${label}: ${filePath}`);
  }
}

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const packManifestPath = path.join(options.fixturesRoot, "pack-manifest.json");
  const annotationRoot = path.join(options.fixturesRoot, "annotation");
  const annotationManifestPath = path.join(annotationRoot, "annotation-manifest.json");
  const frozenAnswerKeyManifestPath = path.join(annotationRoot, "frozen-answer-key-manifest.json");
  const allocationPath = path.join(DOCS_ROOT, "tasklog-v4-family-allocation-table.json");
  const answerContractPath = path.join(DOCS_ROOT, "tasklog-v4-answer-contract.md");
  const graderContractPath = path.join(DOCS_ROOT, "tasklog-v4-grader-contract.md");
  const ontologyPath = path.join(DOCS_ROOT, "tasklog-v4-source-family-ontology.json");
  const adjudicationGuidePath = path.join(DOCS_ROOT, "tasklog-v4-adjudication-guide.md");

  await assertExists(packManifestPath, "pack manifest");
  await assertExists(annotationManifestPath, "annotation manifest");
  await assertExists(frozenAnswerKeyManifestPath, "frozen answer-key manifest");
  await assertExists(answerContractPath, "answer contract");
  await assertExists(graderContractPath, "grader contract");
  await assertExists(ontologyPath, "ontology");
  await assertExists(adjudicationGuidePath, "adjudication guide");

  const packManifest = await readJsonFile<PackManifest>(packManifestPath);
  const annotationManifest = await readJsonFile<AnnotationManifest>(annotationManifestPath);
  const frozenAnswerKeyManifest = await readJsonFile<FrozenAnswerKeyManifest>(frozenAnswerKeyManifestPath);
  const allocationDoc = await readJsonFile<AllocationDoc>(allocationPath);
  const allocationById = new Map(allocationDoc.fixtures.map((fixture) => [fixture.fixture_id, fixture]));
  const annotationById = new Map(annotationManifest.fixtures.map((fixture) => [fixture.fixture_id, fixture]));
  const frozenById = new Map(frozenAnswerKeyManifest.entries.map((entry) => [entry.fixture_id, entry]));

  assert(packManifest.round_id === ROUND_ID, `Unexpected pack round id: ${packManifest.round_id}`);
  assert(packManifest.benchmark_type === BENCHMARK_TYPE, `Unexpected pack benchmark type: ${packManifest.benchmark_type}`);
  assert(packManifest.fixture_count === 32, `Expected 32 fixtures, found ${packManifest.fixture_count}`);
  assert(packManifest.fixtures.length === packManifest.fixture_count, "Pack fixture_count does not match fixtures array length");
  assert(annotationManifest.round_id === ROUND_ID, `Unexpected annotation round id: ${annotationManifest.round_id}`);
  assert(annotationManifest.benchmark_type === BENCHMARK_TYPE, `Unexpected annotation benchmark type: ${annotationManifest.benchmark_type}`);
  assert(frozenAnswerKeyManifest.round_id === ROUND_ID, `Unexpected frozen answer round id: ${frozenAnswerKeyManifest.round_id}`);
  assert(frozenAnswerKeyManifest.benchmark_type === BENCHMARK_TYPE, `Unexpected frozen answer benchmark type: ${frozenAnswerKeyManifest.benchmark_type}`);
  assert(frozenAnswerKeyManifest.entry_count === packManifest.fixture_count, "Frozen answer entry_count does not match pack fixture_count");

  const requiredFields = [
    "decision_type",
    "selected_work_id",
    "selected_work_title",
    "work_status",
    "next_step_summary",
    "clarifying_question",
    "abstention_reason",
    "escalation_target",
    "primary_evidence_source",
    "other_candidate_work_ids",
  ];

  for (const packFixture of packManifest.fixtures) {
    const allocation = allocationById.get(packFixture.fixture_id);
    const annotationFixture = annotationById.get(packFixture.fixture_id);
    const frozenEntry = frozenById.get(packFixture.fixture_id);
    const fixtureRoot = path.join(options.fixturesRoot, packFixture.fixture_id);
    const fixtureJsonPath = path.join(fixtureRoot, "fixture.json");
    const fixtureManifestPath = path.join(fixtureRoot, "fixture-manifest.json");
    const questionsPath = path.join(fixtureRoot, "questions.json");
    const annotatorAPath = path.join(annotationRoot, "annotator-a", `${packFixture.fixture_id}.answer-key.json`);
    const annotatorBPath = path.join(annotationRoot, "annotator-b", `${packFixture.fixture_id}.answer-key.json`);

    assert(allocation, `Fixture ${packFixture.fixture_id} missing from allocation doc`);
    assert(annotationFixture, `Fixture ${packFixture.fixture_id} missing from annotation manifest`);
    assert(frozenEntry, `Fixture ${packFixture.fixture_id} missing from frozen answer-key manifest`);
    await assertExists(fixtureJsonPath, "fixture json");
    await assertExists(fixtureManifestPath, "fixture manifest");
    await assertExists(questionsPath, "questions pack");
    await assertExists(annotatorAPath, "annotator A draft");
    await assertExists(annotatorBPath, "annotator B draft");

    const fixtureJson = await readJsonFile<FixtureJson>(fixtureJsonPath);
    const fixtureManifest = await readJsonFile<FixtureManifest>(fixtureManifestPath);
    const questions = await readJsonFile<QuestionsPack>(questionsPath);
    const annotatorADraft = await readJsonFile<DraftAnswerKey>(annotatorAPath);
    const annotatorBDraft = await readJsonFile<DraftAnswerKey>(annotatorBPath);

    assert(fixtureJson.round_id === ROUND_ID, `Fixture ${packFixture.fixture_id} has wrong round_id`);
    assert(fixtureJson.benchmark_type === BENCHMARK_TYPE, `Fixture ${packFixture.fixture_id} has wrong benchmark_type`);
    assert(fixtureManifest.round_id === ROUND_ID, `Fixture manifest ${packFixture.fixture_id} has wrong round_id`);
    assert(fixtureManifest.benchmark_type === BENCHMARK_TYPE, `Fixture manifest ${packFixture.fixture_id} has wrong benchmark_type`);
    assert(questions.round_id === ROUND_ID, `Questions ${packFixture.fixture_id} has wrong round_id`);
    assert(questions.benchmark_type === BENCHMARK_TYPE, `Questions ${packFixture.fixture_id} has wrong benchmark_type`);
    assert(questions.questions.length === 1, `Questions ${packFixture.fixture_id} must contain exactly one question`);
    assert(JSON.stringify(questions.questions[0]?.required_fields ?? []) === JSON.stringify(requiredFields), `Questions ${packFixture.fixture_id} required_fields drifted from V4 answer contract`);
    assert(questions.questions[0]?.answer_contract_path === answerContractPath, `Questions ${packFixture.fixture_id} points to the wrong answer contract path`);

    assert(fixtureJson.family_id === allocation!.family_id, `Fixture ${packFixture.fixture_id} family_id mismatch`);
    assert(fixtureJson.source_instance_id === allocation!.source_instance_id, `Fixture ${packFixture.fixture_id} source_instance_id mismatch`);
    assert(fixtureJson.primary_decision_mode === allocation!.primary_decision_mode, `Fixture ${packFixture.fixture_id} primary_decision_mode mismatch`);
    assert(fixtureJson.expected_label_mode === allocation!.expected_label_mode, `Fixture ${packFixture.fixture_id} expected_label_mode mismatch`);
    assert(fixtureJson.candidate_work_id_allowed === allocation!.candidate_work_id_allowed, `Fixture ${packFixture.fixture_id} candidate_work_id_allowed mismatch`);
    assert(fixtureJson.evaluation_refs?.answer_contract_path === answerContractPath, `Fixture ${packFixture.fixture_id} evaluation_refs.answer_contract_path mismatch`);
    assert(fixtureJson.evaluation_refs?.grader_contract_path === graderContractPath, `Fixture ${packFixture.fixture_id} evaluation_refs.grader_contract_path mismatch`);
    assert(fixtureJson.evaluation_refs?.ontology_path === ontologyPath, `Fixture ${packFixture.fixture_id} evaluation_refs.ontology_path mismatch`);
    assert(fixtureJson.evaluation_refs?.adjudication_guide_path === adjudicationGuidePath, `Fixture ${packFixture.fixture_id} evaluation_refs.adjudication_guide_path mismatch`);

    assert(annotationFixture!.family_id === fixtureJson.family_id, `Annotation manifest ${packFixture.fixture_id} family_id mismatch`);
    assert(annotationFixture!.source_instance_id === fixtureJson.source_instance_id, `Annotation manifest ${packFixture.fixture_id} source_instance_id mismatch`);
    assert(annotationFixture!.primary_decision_mode === fixtureJson.primary_decision_mode, `Annotation manifest ${packFixture.fixture_id} primary_decision_mode mismatch`);
    assert(annotationFixture!.candidate_work_id_allowed === fixtureJson.candidate_work_id_allowed, `Annotation manifest ${packFixture.fixture_id} candidate_work_id_allowed mismatch`);
    assert(annotationFixture!.expected_label_mode === fixtureJson.expected_label_mode, `Annotation manifest ${packFixture.fixture_id} expected_label_mode mismatch`);
    assert(annotationFixture!.human_audit_status === packFixture.human_audit_status, `Annotation manifest ${packFixture.fixture_id} human_audit_status mismatch`);

    for (const [roleLabel, draft] of [["A", annotatorADraft], ["B", annotatorBDraft]] as const) {
      assert(draft.round_id === ROUND_ID, `Annotator ${roleLabel} draft ${packFixture.fixture_id} has wrong round_id`);
      assert(draft.benchmark_type === BENCHMARK_TYPE, `Annotator ${roleLabel} draft ${packFixture.fixture_id} has wrong benchmark_type`);
      assert(draft.fixture_id === packFixture.fixture_id, `Annotator ${roleLabel} draft ${packFixture.fixture_id} has wrong fixture_id`);
      assert(draft.references.answer_contract_path === answerContractPath, `Annotator ${roleLabel} draft ${packFixture.fixture_id} points to wrong answer contract`);
      assert(draft.references.grader_contract_path === graderContractPath, `Annotator ${roleLabel} draft ${packFixture.fixture_id} points to wrong grader contract`);
      assert(draft.references.ontology_path === ontologyPath, `Annotator ${roleLabel} draft ${packFixture.fixture_id} points to wrong ontology`);
      assert(draft.references.adjudication_guide_path === adjudicationGuidePath, `Annotator ${roleLabel} draft ${packFixture.fixture_id} points to wrong adjudication guide`);
      assert(Array.isArray(draft.expected_answer.other_candidate_work_ids), `Annotator ${roleLabel} draft ${packFixture.fixture_id} other_candidate_work_ids must be an array`);
      assert(draft.frozen_constraints.family_id === fixtureJson.family_id, `Annotator ${roleLabel} draft ${packFixture.fixture_id} family mismatch`);
      assert(draft.frozen_constraints.primary_decision_mode === fixtureJson.primary_decision_mode, `Annotator ${roleLabel} draft ${packFixture.fixture_id} primary_decision_mode mismatch`);
      assert(draft.frozen_constraints.candidate_work_id_allowed === fixtureJson.candidate_work_id_allowed, `Annotator ${roleLabel} draft ${packFixture.fixture_id} candidate_work_id_allowed mismatch`);
      assert(draft.frozen_constraints.expected_label_mode === fixtureJson.expected_label_mode, `Annotator ${roleLabel} draft ${packFixture.fixture_id} expected_label_mode mismatch`);
      assert(draft.frozen_constraints.fixture_stage === fixtureManifest.fixture_stage, `Annotator ${roleLabel} draft ${packFixture.fixture_id} fixture_stage mismatch`);
      assert(draft.frozen_constraints.human_audit_status === (fixtureManifest.generation_metadata?.human_audit_status ?? packFixture.human_audit_status), `Annotator ${roleLabel} draft ${packFixture.fixture_id} human_audit_status mismatch`);
    }

    assert(frozenEntry!.question_id === questions.questions[0]!.question_id, `Frozen answer entry ${packFixture.fixture_id} question_id mismatch`);
    assert(frozenEntry!.references.fixture_path === fixtureJsonPath, `Frozen answer entry ${packFixture.fixture_id} fixture_path mismatch`);
    assert(frozenEntry!.references.annotator_a_draft_path === annotatorAPath, `Frozen answer entry ${packFixture.fixture_id} annotator_a_draft_path mismatch`);
    assert(frozenEntry!.references.annotator_b_draft_path === annotatorBPath, `Frozen answer entry ${packFixture.fixture_id} annotator_b_draft_path mismatch`);
    assert(frozenEntry!.frozen_constraints.family_id === fixtureJson.family_id, `Frozen answer entry ${packFixture.fixture_id} family mismatch`);
    assert(frozenEntry!.frozen_constraints.primary_decision_mode === fixtureJson.primary_decision_mode, `Frozen answer entry ${packFixture.fixture_id} primary_decision_mode mismatch`);
    assert(frozenEntry!.frozen_constraints.candidate_work_id_allowed === fixtureJson.candidate_work_id_allowed, `Frozen answer entry ${packFixture.fixture_id} candidate_work_id_allowed mismatch`);
    assert(frozenEntry!.frozen_constraints.expected_label_mode === fixtureJson.expected_label_mode, `Frozen answer entry ${packFixture.fixture_id} expected_label_mode mismatch`);
  }

  console.log(JSON.stringify({
    round_id: ROUND_ID,
    benchmark_type: BENCHMARK_TYPE,
    fixtures_root: options.fixturesRoot,
    fixture_count: packManifest.fixture_count,
    annotation_status: annotationManifest.status,
    frozen_answer_status: frozenAnswerKeyManifest.status,
    validation: "ok",
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
