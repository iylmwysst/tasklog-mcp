import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const DOCS_ROOT = path.join(REPO_ROOT, "docs");

const DEV_ROUND_ID = "V4.1-dev";
const PROTOCOL_BASIS = "V4.1";
const SOURCE_ROUND_ID = "V4";
const OUTPUT_PATHS = {
  note: path.join(DOCS_ROOT, "tasklog-v4-1-dev-lane-note.md"),
  sourcePool: path.join(DOCS_ROOT, "tasklog-v4-1-dev-source-pool-manifest.json"),
  allocation: path.join(DOCS_ROOT, "tasklog-v4-1-dev-family-allocation-table.json"),
  briefs: path.join(DOCS_ROOT, "tasklog-v4-1-dev-annotation-family-briefs.md"),
};

const FAMILY_ORDER = [
  "authoritative_log_overrides_note",
  "stale_active_context_must_be_ignored",
  "blocked_work_requires_escalation",
  "abstain_when_no_authoritative_source",
  "ask_single_missing_fact_before_resume",
  "done_work_noise_vs_true_active_signal",
  "provenance_tiebreak_between_open_works",
  "resume_with_state_constrained_next_step",
] as const;

const FAMILY_SOURCE_ASSIGNMENTS: Record<(typeof FAMILY_ORDER)[number], [string, string]> = {
  authoritative_log_overrides_note: [
    "swebench-harness-modal-entrypoint",
    "swebench-harness-test-spec",
  ],
  stale_active_context_must_be_ignored: [
    "swebench-harness-test-spec-python",
    "swebench-inference-make-datasets-utils",
  ],
  blocked_work_requires_escalation: [
    "swebench-harness-modal-run-evaluation",
    "swebench-collect-make-repo-call",
  ],
  abstain_when_no_authoritative_source: [
    "swebench-collect-print-pulls",
    "swebench-versioning-extract-web-pvlib",
  ],
  ask_single_missing_fact_before_resume: [
    "swebench-collect-utils",
    "swebench-inference-codellama-device-maps",
  ],
  done_work_noise_vs_true_active_signal: [
    "swebench-harness-test-spec-javascript",
    "swebench-harness-log-parser-javascript",
  ],
  provenance_tiebreak_between_open_works: [
    "swebench-harness-log-parser-python",
    "swebench-inference-llamao-modeling-flash-llama",
  ],
  resume_with_state_constrained_next_step: [
    "swebench-harness-modal-utils",
    "swebench-inference-llamao-distributed-attention",
  ],
};

const FAMILY_BRIEFS: Record<(typeof FAMILY_ORDER)[number], { summary: string; authoringRule: string }> = {
  authoritative_log_overrides_note: {
    summary: "The fixture should force the resuming agent to trust the authoritative tasklog/log surface over a weaker or stale note trail.",
    authoringRule: "The misleading note must still be plausible for the selected code paths; do not invent off-module work that is not suggested by the source files.",
  },
  stale_active_context_must_be_ignored: {
    summary: "The fixture should present a stale active-context cue that looks tempting but is contradicted by stronger codebase-grounded evidence.",
    authoringRule: "The stale context must be anchored to the same subsystem as the selected source files rather than to a fabricated neighboring project.",
  },
  blocked_work_requires_escalation: {
    summary: "The correct answer should recognize that work is blocked and requires a bounded escalation before safe continuation.",
    authoringRule: "The blocker must arise naturally from the selected code paths, such as permissions, missing ownership, or cross-boundary dependencies visible in the codebase.",
  },
  abstain_when_no_authoritative_source: {
    summary: "The fixture should make abstention correct because the codebase-visible evidence never reaches an authoritative next move.",
    authoringRule: "Lack of authority must come from the selected source area itself, not from arbitrary missing documents outside the chosen codebase slice.",
  },
  ask_single_missing_fact_before_resume: {
    summary: "The fixture should make one concrete clarifying question sufficient to unlock a justified next action.",
    authoringRule: "The missing fact must be a real codebase-local ambiguity about the selected source paths, not a vague product or project-management question.",
  },
  done_work_noise_vs_true_active_signal: {
    summary: "The fixture should distinguish a noisy done-work trail from the actually resumable active work in the selected source area.",
    authoringRule: "The done-work noise and active signal should both be traceable to the chosen code paths or their immediate neighboring files.",
  },
  provenance_tiebreak_between_open_works: {
    summary: "The fixture should force a tie-break between multiple open candidates using provenance and codebase-specific authority.",
    authoringRule: "Both candidate works must be plausible against the selected source files, and the winning tiebreak must come from evidence grounded in those files.",
  },
  resume_with_state_constrained_next_step: {
    summary: "The fixture should require a precise next step that is constrained by actual repository state, not only by generic intent.",
    authoringRule: "The gating constraint must be visible in the selected code paths, such as a test harness boundary, migration dependency, or repo-specific execution rule.",
  },
};

interface CliOptions {
  write: boolean;
  check: boolean;
}

interface SourcePoolCandidate {
  source_instance_id: string;
  source_title: string;
  upstream_repo_slug: string;
  upstream_commit: string;
  source_vendor_path: string;
  source_rel_paths: string[];
  source_area: string;
  complexity_hint: string;
  eligible_families: string[];
}

interface SourcePoolManifest {
  version: number;
  round_id: string;
  status: string;
  source_dataset: string;
  source_pool_type: string;
  source_vendor_path: string;
  upstream_repo_slug: string;
  upstream_commit: string;
  selection_rule_version: string;
  selection_notes: string[];
  pool_size: number;
  selected_pool_target: number;
  reserve_pool_target: number;
  candidates: SourcePoolCandidate[];
}

interface AllocationFixture {
  fixture_id: string;
  family_id: string;
  source_instance_id: string;
  primary_decision_mode: string;
  difficulty: "medium" | "hard";
  candidate_work_id_allowed: boolean;
  expected_label_mode: string;
}

interface AllocationTable {
  version: number;
  round_id: string;
  status: string;
  allocation_version: string;
  pack_shape: {
    fixture_count: number;
    family_count: number;
    default_fixtures_per_family: number;
  };
  selection_method: string[];
  fixtures: AllocationFixture[];
}

function parseArgs(argv: string[]): CliOptions {
  let write = false;
  let check = false;

  for (const arg of argv) {
    if (arg === "--write") {
      write = true;
    } else if (arg === "--check") {
      check = true;
    }
  }

  return { write, check };
}

async function loadJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

async function writeText(filePath: string, body: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, body, "utf8");
}

function stableJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function buildDevNote(): string {
  return `# Tasklog V4.1 Development Lane Note

This note defines a source-disjoint development lane that follows the same answer and grading protocol as \`V4.1\`.

It applies to:

- \`tasklog_v4_swe_grounded_reentry\`
- lane \`${DEV_ROUND_ID}\`

It complements:

- \`docs/tasklog-v4-1-answer-contract.md\`
- \`docs/tasklog-v4-1-grader-contract.md\`
- \`docs/tasklog-v4-1-dev-source-pool-manifest.json\`
- \`docs/tasklog-v4-1-dev-family-allocation-table.json\`
- \`docs/tasklog-v4-1-dev-annotation-family-briefs.md\`

## Purpose

\`${DEV_ROUND_ID}\` exists for system and prompt development only.
It uses the same action contract, scorer boundary, and reporting philosophy as \`V4.1\`, but it must remain source-disjoint from the frozen \`V4\` holdout pack.

## Disjointness Rule

The development lane is built only from the \`16\` reserve candidates left unused by the frozen \`V4\` family-allocation table.

That means:

- no \`${DEV_ROUND_ID}\` fixture may reuse a \`source_instance_id\` from the frozen \`V4\` holdout allocation
- no tune or system change justified by \`${DEV_ROUND_ID}\` may cite holdout-only fixtures as evidence

## Pack Shape

\`${DEV_ROUND_ID}\` keeps the same family inventory as \`V4/V4.1\`, but at a smaller development shape:

- \`16\` fixtures
- \`8\` families
- \`2\` fixtures per family

This is large enough to exercise every decision family while still staying bounded enough for frequent iteration.

## Protocol Carry-Forward

\`${DEV_ROUND_ID}\` reuses:

- the \`V4.1\` answer contract
- the \`V4.1\` grader contract
- the same source-family ontology
- the same arm comparison shape

It changes only:

- the source pool
- the fixture allocation
- the lane identifier

## Usage Rule

Use \`${DEV_ROUND_ID}\` to improve the system.
Use \`V4/V4.1\` holdout artifacts to evaluate whether those improvements generalize.

If a change was explicitly tuned against \`${DEV_ROUND_ID}\`, do not present \`${DEV_ROUND_ID}\` as claim-bearing evidence in the main writeup.

## Annotation Grounding Rule

When \`annotator_a\` and \`annotator_b\` work on this lane, family descriptions must stay grounded in the selected codebase slice.
The family brief for each fixture should therefore name:

- the selected \`source_instance_id\`
- the relevant \`source_rel_paths\`
- the source area inside the vendored repo
- the allowed family-level ambiguity and anti-drift rule

That brief lives in:

- \`docs/tasklog-v4-1-dev-annotation-family-briefs.md\`
`;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function buildArtifacts(
  sourcePool: SourcePoolManifest,
  allocation: AllocationTable,
): {
  note: string;
  briefs: string;
  devSourcePool: Record<string, unknown>;
  devAllocation: Record<string, unknown>;
  summary: Record<string, unknown>;
} {
  const selectedSourceIds = new Set(allocation.fixtures.map((fixture) => fixture.source_instance_id));
  const reserveCandidates = sourcePool.candidates.filter((candidate) => !selectedSourceIds.has(candidate.source_instance_id));
  const reserveById = new Map(reserveCandidates.map((candidate) => [candidate.source_instance_id, candidate]));
  const fixturesByFamily = new Map<string, AllocationFixture[]>();

  for (const fixture of allocation.fixtures) {
    const existing = fixturesByFamily.get(fixture.family_id) ?? [];
    existing.push(fixture);
    fixturesByFamily.set(fixture.family_id, existing);
  }

  const devFixtures = FAMILY_ORDER.flatMap((familyId, familyIndex) => {
    const sourceIds = FAMILY_SOURCE_ASSIGNMENTS[familyId];
    const familyPatterns = (fixturesByFamily.get(familyId) ?? []).slice(0, 2);

    assert(familyPatterns.length === 2, `Expected exactly two protocol patterns for family ${familyId}.`);

    return sourceIds.map((sourceInstanceId, localIndex) => {
      const candidate = reserveById.get(sourceInstanceId);
      assert(candidate, `Missing reserve candidate ${sourceInstanceId} for family ${familyId}.`);
      assert(
        candidate.eligible_families.includes(familyId),
        `Candidate ${sourceInstanceId} is not eligible for family ${familyId}.`,
      );

      const pattern = familyPatterns[localIndex];
      return {
        fixture_id: `v4-1-dev-${String(familyIndex * 2 + localIndex + 1).padStart(3, "0")}`,
        family_id: familyId,
        source_instance_id: sourceInstanceId,
        source_title: candidate.source_title,
        source_area: candidate.source_area,
        source_rel_paths: candidate.source_rel_paths,
        primary_decision_mode: pattern.primary_decision_mode,
        difficulty: pattern.difficulty,
        candidate_work_id_allowed: pattern.candidate_work_id_allowed,
        expected_label_mode: pattern.expected_label_mode,
      };
    });
  });

  const devSourceIds = new Set(devFixtures.map((fixture) => fixture.source_instance_id));
  assert(devSourceIds.size === devFixtures.length, "Dev lane source ids must be unique.");

  const familyCounts = devFixtures.reduce<Record<string, number>>((accumulator, fixture) => {
    accumulator[fixture.family_id] = (accumulator[fixture.family_id] ?? 0) + 1;
    return accumulator;
  }, {});

  for (const familyId of FAMILY_ORDER) {
    assert(familyCounts[familyId] === 2, `Dev lane family ${familyId} must have exactly two fixtures.`);
  }

  const devSourcePool = {
    version: 1,
    round_id: DEV_ROUND_ID,
    status: "frozen_before_authoring",
    protocol_basis: PROTOCOL_BASIS,
    parent_round_id: SOURCE_ROUND_ID,
    source_dataset: sourcePool.source_dataset,
    source_pool_type: "source_disjoint_dev_lane_pool",
    source_vendor_path: sourcePool.source_vendor_path,
    upstream_repo_slug: sourcePool.upstream_repo_slug,
    upstream_commit: sourcePool.upstream_commit,
    selection_rule_version: "v4-1-dev-source-pool-2026-03-31a",
    selection_notes: [
      "This development lane reuses the V4 source dataset and provenance contract but only from reserve candidates left unused by the frozen V4 holdout allocation.",
      "The lane keeps the V4.1 protocol boundary while remaining source-disjoint from the visible V4 holdout fixtures.",
      "All 16 reserve candidates are consumed so the development lane cannot quietly drift back into the holdout source set.",
    ],
    disjoint_against_round_id: SOURCE_ROUND_ID,
    disjoint_against_allocation_path: "docs/tasklog-v4-family-allocation-table.json",
    pool_size: reserveCandidates.length,
    selected_pool_target: devFixtures.length,
    reserve_pool_target: 0,
    candidates: reserveCandidates,
  };

  const devAllocation = {
    version: 1,
    round_id: DEV_ROUND_ID,
    status: "frozen_before_authoring",
    allocation_version: "v4-1-dev-family-allocation-2026-03-31a",
    pack_shape: {
      fixture_count: 16,
      family_count: FAMILY_ORDER.length,
      default_fixtures_per_family: 2,
    },
    protocol_basis: PROTOCOL_BASIS,
    source_disjoint_from_round_id: SOURCE_ROUND_ID,
    selection_method: [
      "Select only from the 16 reserve candidates not used by the frozen V4 holdout allocation.",
      "Keep the same family inventory as V4/V4.1, but shrink to a 16-fixture development lane with 2 fixtures per family.",
      "Copy the first two V4 family-level decision-shape patterns per family so the dev lane exercises the same protocol boundary without reusing holdout sources.",
      "Use the development lane for iteration only; evaluate final system changes on V4/V4.1 holdout artifacts.",
    ],
    fixtures: devFixtures,
  };

  const briefs = [
    "# Tasklog V4.1-dev Annotation Family Briefs",
    "",
    "Use these briefs when `annotator_a` and `annotator_b` author or review fixtures for `V4.1-dev`.",
    "The family semantics stay aligned with `V4.1`, but every fixture description must remain plausible for the selected code paths listed here.",
    "",
  ];

  for (const familyId of FAMILY_ORDER) {
    const familyFixtures = devFixtures.filter((fixture) => fixture.family_id === familyId);
    const familyBrief = FAMILY_BRIEFS[familyId];
    briefs.push(`## ${familyId}`);
    briefs.push("");
    briefs.push(`- summary: ${familyBrief.summary}`);
    briefs.push(`- codebase_grounding_rule: ${familyBrief.authoringRule}`);
    briefs.push("");
    for (const fixture of familyFixtures) {
      briefs.push(`### ${fixture.fixture_id}`);
      briefs.push("");
      briefs.push(`- source_instance_id: \`${fixture.source_instance_id}\``);
      briefs.push(`- source_title: ${fixture.source_title}`);
      briefs.push(`- source_area: \`${fixture.source_area}\``);
      briefs.push(`- source_rel_paths: ${fixture.source_rel_paths.map((relPath) => `\`${relPath}\``).join(", ")}`);
      briefs.push(`- primary_decision_mode: \`${fixture.primary_decision_mode}\``);
      briefs.push(`- expected_label_mode: \`${fixture.expected_label_mode}\``);
      briefs.push("");
    }
  }

  return {
    note: buildDevNote(),
    briefs: `${briefs.join("\n")}\n`,
    devSourcePool,
    devAllocation,
    summary: {
      round_id: DEV_ROUND_ID,
      protocol_basis: PROTOCOL_BASIS,
      source_disjoint_from_round_id: SOURCE_ROUND_ID,
      source_pool_size: reserveCandidates.length,
      fixture_count: devFixtures.length,
      family_counts: familyCounts,
      output_paths: OUTPUT_PATHS,
    },
  };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const sourcePool = await loadJson<SourcePoolManifest>(path.join(DOCS_ROOT, "tasklog-v4-source-pool-manifest.json"));
  const allocation = await loadJson<AllocationTable>(path.join(DOCS_ROOT, "tasklog-v4-family-allocation-table.json"));
  const artifacts = buildArtifacts(sourcePool, allocation);

  if (options.write) {
    await writeText(OUTPUT_PATHS.note, artifacts.note);
    await writeText(OUTPUT_PATHS.sourcePool, stableJson(artifacts.devSourcePool));
    await writeText(OUTPUT_PATHS.allocation, stableJson(artifacts.devAllocation));
    await writeText(OUTPUT_PATHS.briefs, artifacts.briefs);
  }

  if (options.check) {
    const existingNote = await fs.readFile(OUTPUT_PATHS.note, "utf8");
    const existingSourcePool = await fs.readFile(OUTPUT_PATHS.sourcePool, "utf8");
    const existingAllocation = await fs.readFile(OUTPUT_PATHS.allocation, "utf8");
    const existingBriefs = await fs.readFile(OUTPUT_PATHS.briefs, "utf8");

    assert(existingNote === artifacts.note, "Dev lane note is out of date. Re-run with --write.");
    assert(existingSourcePool === stableJson(artifacts.devSourcePool), "Dev lane source pool manifest is out of date. Re-run with --write.");
    assert(existingAllocation === stableJson(artifacts.devAllocation), "Dev lane family allocation table is out of date. Re-run with --write.");
    assert(existingBriefs === artifacts.briefs, "Dev lane annotation briefs are out of date. Re-run with --write.");
  }

  console.log(JSON.stringify(artifacts.summary, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
});
