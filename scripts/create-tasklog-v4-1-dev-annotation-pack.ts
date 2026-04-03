import path from "node:path";
import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";

const DEFAULT_FIXTURES_ROOT = "/Users/Lab/Desktop/TasklogSweLab/fixtures-v4-1-dev";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const DOCS_ROOT = path.join(REPO_ROOT, "docs");
const ROUND_ID = "V4.1-dev";
const BENCHMARK_TYPE = "tasklog_v4_swe_grounded_reentry";
const ANNOTATION_MODE = "llm_assisted_dev_lane";

interface CliOptions {
  fixturesRoot: string;
  annotationRoot: string;
  force: boolean;
}

interface PackFixture {
  fixture_id: string;
  family_id: string;
  source_instance_id: string;
  difficulty: string;
  human_audit_status?: string;
}

interface PackManifest {
  round_id: string;
  benchmark_type: string;
  fixtures: PackFixture[];
}

interface QuestionRow {
  question_id: string;
  prompt_version: string;
  answer_contract_version?: string;
  answer_contract_path?: string;
  title: string;
  goal: string;
  task: string;
  required_fields: string[];
  optional_fields?: string[];
}

interface QuestionsPack {
  round_id: string;
  fixture_id: string;
  benchmark_type: string;
  questions: QuestionRow[];
}

interface FixturePack {
  round_id: string;
  fixture_id: string;
  family_id: string;
  title: string;
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
  fixture_id: string;
  workspace_root: string;
  fixture_stage: string;
  generation_metadata?: {
    human_audit_status?: string;
  };
  state_paths?: {
    workdocs_root?: string;
  };
}

function parseArgs(argv: string[]): CliOptions {
  let fixturesRoot = DEFAULT_FIXTURES_ROOT;
  let annotationRoot = path.join(fixturesRoot, "annotation");
  let force = false;

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current === "--fixtures-root") {
      fixturesRoot = path.resolve(argv[index + 1] ?? fixturesRoot);
      annotationRoot = path.join(fixturesRoot, "annotation");
      index += 1;
      continue;
    }
    if (current === "--annotation-root") {
      annotationRoot = path.resolve(argv[index + 1] ?? annotationRoot);
      index += 1;
      continue;
    }
    if (current === "--force") {
      force = true;
      continue;
    }
  }

  return {
    fixturesRoot,
    annotationRoot,
    force,
  };
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function ensureCleanDirectory(targetPath: string, force: boolean): Promise<void> {
  if (await pathExists(targetPath)) {
    if (!force) {
      throw new Error(`Refusing to overwrite existing directory without --force: ${targetPath}`);
    }
    await fs.rm(targetPath, { recursive: true, force: true });
  }
  await fs.mkdir(targetPath, { recursive: true });
}

async function writeJsonFile(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function annotatorPrompt(
  roleId: string,
  lane: { provider: string; model_family: string; reasoning_setting: string },
  peerDir: string,
  ownDir: string,
): string {
  return [
    `# ${ROUND_ID} ${roleId === "ann_a_01" ? "Annotator A" : "Annotator B"} Prompt`,
    "",
    `You are \`${roleId}\`.`,
    "",
    "You are one of two independent annotators for:",
    "",
    `- \`${BENCHMARK_TYPE}\``,
    `- lane \`${ROUND_ID}\``,
    "",
    "Your model lane is:",
    "",
    `- provider: \`${lane.provider}\``,
    `- model family: \`${lane.model_family}\``,
    `- reasoning setting: \`${lane.reasoning_setting}\``,
    "",
    "## Allowed Inputs",
    "",
    "You may read only:",
    "",
    `- your assigned draft file under \`${ownDir}\``,
    "- the referenced fixture files named inside that draft",
    "- the frozen V4.1 answer contract",
    "- the frozen V4.1 grader contract",
    "- the frozen ontology file",
    "- the frozen adjudication guide",
    "- the V4.1-dev annotation family briefs",
    "- the fixture-local repo snapshot and seeded Tasklog state referenced by that draft",
    "",
    "## Forbidden Inputs",
    "",
    "You must not inspect:",
    "",
    `- any file under \`${peerDir}\``,
    "- `disagreement-log.json`",
    "- `adjudication-log.json`",
    "- any V4 or V4.1 holdout run outputs",
    "- any model-roster or run-layer artifact",
    "",
    "## Task",
    "",
    "For each assigned draft:",
    "",
    "1. read the draft, the referenced fixture files, and the corresponding family brief",
    `2. fill \`annotator_id\` with \`${roleId}\``,
    "3. fill `expected_answer`",
    "4. fill `next_step_slots`",
    "5. optionally fill `annotation_notes`",
    "6. leave `rubric_notes` empty unless a frozen rubric-backed edge case actually applies",
    "7. set `completed_at` to the UTC completion timestamp",
    "8. set `annotation_status` to `completed`",
    "",
    "## Required Output Discipline",
    "",
    "- do not add fields",
    "- do not remove fields",
    "- preserve valid JSON",
    "- respect `candidate_work_id_allowed`",
    "- respect action-dependent empty-field rules from the frozen answer contract",
    "- treat `next_step_slots` as the frozen interpretation of `next_step_summary`",
    "- keep family reasoning grounded in the fixture's listed `source_rel_paths`",
    "",
    "## Conflict Discipline",
    "",
    "If a fixture feels ambiguous:",
    "",
    "- still write your best independent annotation",
    "- record brief rationale in `annotation_notes`",
    `- do not try to guess what ${roleId === "ann_a_01" ? "annotator B" : "annotator A"} will say`,
    "",
    "## Postcondition",
    "",
    `When finished, only your own draft files under \`${ownDir}\` should change.`,
    "",
  ].join("\n");
}

function adjudicatorPrompt(): string {
  return [
    `# ${ROUND_ID} Adjudicator Prompt`,
    "",
    "You are `adj_01`.",
    "",
    "You are the adjudicator for:",
    "",
    `- \`${BENCHMARK_TYPE}\``,
    `- lane \`${ROUND_ID}\``,
    "",
    "## Allowed Inputs",
    "",
    "You may read only:",
    "",
    "- the frozen fixture files",
    "- the frozen V4.1 answer contract",
    "- the frozen V4.1 grader contract",
    "- the frozen ontology file",
    "- the frozen adjudication guide",
    "- the V4.1-dev annotation family briefs",
    "- completed annotator A and annotator B drafts for the fixture being adjudicated",
    "- `disagreement-log.json`",
    "- `adjudication-log.json`",
    "",
    "## Task",
    "",
    "Resolve disagreements using only the frozen artifacts and codebase-grounded family briefs.",
    "Do not invent a new family interpretation that is not already licensed by the fixture, the contracts, and the listed source paths.",
    "",
  ].join("\n");
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const packManifestPath = path.join(options.fixturesRoot, "pack-manifest.json");
  const packManifest = await readJsonFile<PackManifest>(packManifestPath);

  if (packManifest.round_id !== ROUND_ID) {
    throw new Error(`Expected round ${ROUND_ID} pack, received ${packManifest.round_id}`);
  }
  if (packManifest.benchmark_type !== BENCHMARK_TYPE) {
    throw new Error(`Expected benchmark type ${BENCHMARK_TYPE}, received ${packManifest.benchmark_type}`);
  }

  await ensureCleanDirectory(options.annotationRoot, options.force);

  const annotatorADir = path.join(options.annotationRoot, "annotator-a");
  const annotatorBDir = path.join(options.annotationRoot, "annotator-b");
  const promptsDir = path.join(options.annotationRoot, "prompts");
  await fs.mkdir(annotatorADir, { recursive: true });
  await fs.mkdir(annotatorBDir, { recursive: true });
  await fs.mkdir(promptsDir, { recursive: true });

  const now = new Date().toISOString();
  const answerContractPath = path.join(DOCS_ROOT, "tasklog-v4-1-answer-contract.md");
  const graderContractPath = path.join(DOCS_ROOT, "tasklog-v4-1-grader-contract.md");
  const ontologyPath = path.join(DOCS_ROOT, "tasklog-v4-source-family-ontology.json");
  const adjudicationGuidePath = path.join(DOCS_ROOT, "tasklog-v4-adjudication-guide.md");
  const familyBriefsPath = path.join(DOCS_ROOT, "tasklog-v4-1-dev-annotation-family-briefs.md");
  const roleAssignmentPath = path.join(options.annotationRoot, "role-assignment.json");
  const promptPackManifestPath = path.join(options.annotationRoot, "prompt-pack-manifest.json");
  const disagreementLogPath = path.join(options.annotationRoot, "disagreement-log.json");
  const adjudicationLogPath = path.join(options.annotationRoot, "adjudication-log.json");
  const frozenAnswerKeyManifestPath = path.join(options.annotationRoot, "frozen-answer-key-manifest.json");

  const annotationFixtures: Record<string, unknown>[] = [];
  const frozenAnswerEntries: Record<string, unknown>[] = [];

  for (const packFixture of packManifest.fixtures) {
    const fixtureRoot = path.join(options.fixturesRoot, packFixture.fixture_id);
    const fixturePath = path.join(fixtureRoot, "fixture.json");
    const fixtureManifestPath = path.join(fixtureRoot, "fixture-manifest.json");
    const questionsPath = path.join(fixtureRoot, "questions.json");
    const normalizedStatePath = path.join(fixtureRoot, "surfaces", "normalized-state.json");
    const tasklogReentryPath = path.join(fixtureRoot, "surfaces", "tasklog-reentry.json");
    const fixture = await readJsonFile<FixturePack>(fixturePath);
    const fixtureManifest = await readJsonFile<FixtureManifest>(fixtureManifestPath);
    const questions = await readJsonFile<QuestionsPack>(questionsPath);
    const question = questions.questions[0];
    if (!question) {
      throw new Error(`Fixture ${packFixture.fixture_id} is missing questions[0]`);
    }

    const sharedReferences = {
      fixture_path: fixturePath,
      fixture_manifest_path: fixtureManifestPath,
      questions_path: questionsPath,
      normalized_state_path: normalizedStatePath,
      tasklog_reentry_path: tasklogReentryPath,
      workspace_root: fixtureManifest.workspace_root,
      workdocs_root: fixtureManifest.state_paths?.workdocs_root ?? path.join(fixtureManifest.workspace_root, "workdocs"),
      answer_contract_path: fixture.evaluation_refs?.answer_contract_path ?? answerContractPath,
      grader_contract_path: fixture.evaluation_refs?.grader_contract_path ?? graderContractPath,
      ontology_path: fixture.evaluation_refs?.ontology_path ?? ontologyPath,
      adjudication_guide_path: fixture.evaluation_refs?.adjudication_guide_path ?? adjudicationGuidePath,
      annotation_family_briefs_path: familyBriefsPath,
    };

    const frozenConstraints = {
      family_id: fixture.family_id,
      primary_decision_mode: fixture.primary_decision_mode,
      difficulty: fixture.difficulty,
      candidate_work_id_allowed: fixture.candidate_work_id_allowed,
      rubric_fallback_family: false,
      expected_label_mode: fixture.expected_label_mode,
      fixture_stage: fixtureManifest.fixture_stage,
      human_audit_status: fixtureManifest.generation_metadata?.human_audit_status ?? packFixture.human_audit_status ?? "spot_check_optional",
    };

    const draftBase = {
      version: 1,
      round_id: ROUND_ID,
      benchmark_type: BENCHMARK_TYPE,
      fixture_id: packFixture.fixture_id,
      question_id: question.question_id,
      question_title: question.title,
      annotation_status: "pending",
      annotator_id: "",
      completed_at: "",
      references: sharedReferences,
      frozen_constraints: frozenConstraints,
      expected_answer: {
        decision_type: "",
        selected_work_id: "",
        selected_work_title: "",
        work_status: "",
        next_step_summary: "",
        clarifying_question: "",
        abstention_reason: "",
        escalation_target: "",
        primary_evidence_source: "",
        other_candidate_work_ids: [] as string[],
      },
      next_step_slots: {
        action_verb: "",
        primary_target: "",
        gating_constraint: "",
      },
      annotation_notes: "",
      rubric_notes: "",
    };

    const annotatorADraftPath = path.join(annotatorADir, `${packFixture.fixture_id}.answer-key.json`);
    const annotatorBDraftPath = path.join(annotatorBDir, `${packFixture.fixture_id}.answer-key.json`);
    await writeJsonFile(annotatorADraftPath, draftBase);
    await writeJsonFile(annotatorBDraftPath, draftBase);

    annotationFixtures.push({
      fixture_id: packFixture.fixture_id,
      family_id: fixture.family_id,
      source_instance_id: fixture.source_instance_id,
      primary_decision_mode: fixture.primary_decision_mode,
      candidate_work_id_allowed: fixture.candidate_work_id_allowed,
      rubric_fallback_family: false,
      expected_label_mode: fixture.expected_label_mode,
      human_audit_status: frozenConstraints.human_audit_status,
      fixture_path: fixturePath,
      fixture_manifest_path: fixtureManifestPath,
      questions_path: questionsPath,
      annotator_a_draft_path: annotatorADraftPath,
      annotator_b_draft_path: annotatorBDraftPath,
      annotation_status: "pending_dual_annotation",
    });

    frozenAnswerEntries.push({
      version: 1,
      round_id: ROUND_ID,
      benchmark_type: BENCHMARK_TYPE,
      fixture_id: packFixture.fixture_id,
      question_id: question.question_id,
      frozen_constraints: frozenConstraints,
      references: {
        ...sharedReferences,
        annotator_a_draft_path: annotatorADraftPath,
        annotator_b_draft_path: annotatorBDraftPath,
        adjudication_log_path: adjudicationLogPath,
      },
      answer_key_status: "pending_dual_annotation",
    });
  }

  const roleAssignment = {
    version: 1,
    round_id: ROUND_ID,
    benchmark_type: BENCHMARK_TYPE,
    annotation_mode: ANNOTATION_MODE,
    annotation_phase: "planned_not_frozen",
    created_at: now,
    frozen_at: "",
    roles: {
      answer_key_annotator_a: "ann_a_01",
      answer_key_annotator_b: "ann_b_01",
      adjudicator: "adj_01",
    },
    model_plan: {
      ann_a_01: {
        provider: "OpenAI",
        model_family: "GPT-5.4",
        reasoning_setting: "high",
      },
      ann_b_01: {
        provider: "OpenAI",
        model_family: "GPT-5.4-mini",
        reasoning_setting: "high",
      },
      adj_01: {
        provider: "Anthropic",
        model_family: "Claude Sonnet 4.6",
        reasoning_setting: "default",
      },
    },
    notes: [
      "This file records the planned V4.1-dev annotation lanes before dual annotation starts.",
      "Freeze the role assignment before any answer-key draft is completed.",
      "V4.1-dev is a development lane, so spot-check review is recommended but not a claim-bearing hard gate.",
    ],
  };

  const promptPackManifest = {
    version: 1,
    round_id: ROUND_ID,
    benchmark_type: BENCHMARK_TYPE,
    annotation_mode: ANNOTATION_MODE,
    created_at: now,
    role_assignment_path: roleAssignmentPath,
    prompts: {
      ann_a_01: {
        role_id: "ann_a_01",
        provider: "OpenAI",
        model_family: "GPT-5.4",
        reasoning_setting: "high",
        prompt_path: path.join(promptsDir, "annotator-a.md"),
        draft_dir: annotatorADir,
      },
      ann_b_01: {
        role_id: "ann_b_01",
        provider: "OpenAI",
        model_family: "GPT-5.4-mini",
        reasoning_setting: "high",
        prompt_path: path.join(promptsDir, "annotator-b.md"),
        draft_dir: annotatorBDir,
      },
      adj_01: {
        role_id: "adj_01",
        provider: "Anthropic",
        model_family: "Claude Sonnet 4.6",
        reasoning_setting: "default",
        prompt_path: path.join(promptsDir, "adjudicator.md"),
        input_logs: [
          disagreementLogPath,
          adjudicationLogPath,
        ],
      },
    },
  };

  const annotationManifest = {
    version: 1,
    round_id: ROUND_ID,
    benchmark_type: BENCHMARK_TYPE,
    annotation_mode: ANNOTATION_MODE,
    status: "scaffold_pending_dual_annotation",
    created_at: now,
    pack_manifest_path: packManifestPath,
    role_assignment_path: roleAssignmentPath,
    prompt_pack_manifest_path: promptPackManifestPath,
    disagreement_log_path: disagreementLogPath,
    adjudication_log_path: adjudicationLogPath,
    future_frozen_answer_key_manifest_path: frozenAnswerKeyManifestPath,
    fixtures: annotationFixtures,
  };

  const disagreementLog = {
    version: 1,
    round_id: ROUND_ID,
    benchmark_type: BENCHMARK_TYPE,
    status: "not_started",
    adjudication_log_path: adjudicationLogPath,
    entries: [],
  };

  const adjudicationLog = {
    version: 1,
    round_id: ROUND_ID,
    benchmark_type: BENCHMARK_TYPE,
    status: "not_started",
    entries: [],
  };

  const frozenAnswerKeyManifest = {
    version: 1,
    round_id: ROUND_ID,
    benchmark_type: BENCHMARK_TYPE,
    status: "pending_dual_annotation",
    created_at: now,
    entry_count: frozenAnswerEntries.length,
    adjudication_log_path: adjudicationLogPath,
    entries: frozenAnswerEntries,
  };

  await writeJsonFile(path.join(options.annotationRoot, "annotation-manifest.json"), annotationManifest);
  await writeJsonFile(roleAssignmentPath, roleAssignment);
  await writeJsonFile(promptPackManifestPath, promptPackManifest);
  await writeJsonFile(disagreementLogPath, disagreementLog);
  await writeJsonFile(adjudicationLogPath, adjudicationLog);
  await writeJsonFile(frozenAnswerKeyManifestPath, frozenAnswerKeyManifest);
  await fs.writeFile(path.join(promptsDir, "annotator-a.md"), `${annotatorPrompt("ann_a_01", roleAssignment.model_plan.ann_a_01, "annotation/annotator-b", "annotation/annotator-a")}\n`, "utf8");
  await fs.writeFile(path.join(promptsDir, "annotator-b.md"), `${annotatorPrompt("ann_b_01", roleAssignment.model_plan.ann_b_01, "annotation/annotator-a", "annotation/annotator-b")}\n`, "utf8");
  await fs.writeFile(path.join(promptsDir, "adjudicator.md"), `${adjudicatorPrompt()}\n`, "utf8");
  await fs.writeFile(
    path.join(options.annotationRoot, "README.md"),
    [
      "# Tasklog V4.1-dev Annotation Pack",
      "",
      "This directory scaffolds the pre-run answer-key workflow for the V4.1-dev development lane.",
      "",
      "Next steps:",
      "1. Freeze `role-assignment.json` before any draft is completed.",
      "2. Complete both annotator draft directories independently.",
      "3. Record disagreements in `disagreement-log.json`.",
      "4. Resolve them in `adjudication-log.json`.",
      "5. Replace `frozen-answer-key-manifest.json` placeholders with the final dev-lane answer keys.",
      "",
      "Human audit note:",
      "- V4.1-dev uses spot-check review rather than a claim-bearing full-audit gate.",
      "",
    ].join("\n"),
    "utf8",
  );

  console.log(JSON.stringify({
    round_id: ROUND_ID,
    benchmark_type: BENCHMARK_TYPE,
    fixtures_root: options.fixturesRoot,
    annotation_root: options.annotationRoot,
    fixture_count: annotationFixtures.length,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
