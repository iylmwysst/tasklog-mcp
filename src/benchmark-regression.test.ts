import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tsxCli = path.join(repoRoot, "node_modules", "tsx", "dist", "cli.mjs");

function runScript(scriptRelativePath: string, args: string[]) {
  return spawnSync(process.execPath, [tsxCli, path.join(repoRoot, scriptRelativePath), ...args], {
    cwd: repoRoot,
    encoding: "utf8",
  });
}

function combinedOutput(result: ReturnType<typeof runScript>): string {
  return `${result.stdout ?? ""}${result.stderr ?? ""}`;
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

function minimalV4HoldoutBatch() {
  return {
    benchmark_type: "tasklog_v4_swe_grounded_reentry",
    round_id: "V4",
    run_id: "tasklog-v4-slot-a-openai-frontier-large-rep1-2026-03-31T12-00-00-000Z",
    model_slot: "slot_a_openai_frontier_large",
    repetition_index: 1,
    model_id: "gpt-5.4",
    responses: [
      {
        benchmark_type: "tasklog_v4_swe_grounded_reentry",
        round_id: "V4",
        split: "holdout",
        fixture_id: "v4-001",
        question_id: "q-v4-001",
        family: "tasklog_resume",
        title: "Recover the Tasklog signal check",
        difficulty: "medium",
        variant_label: "E",
        arm_id: "tasklog_reentry",
        display_label: "Tasklog Re-entry",
        provider: "openai",
        model_slot: "slot_a_openai_frontier_large",
        repetition_index: 1,
        model_id: "gpt-5.4",
        model_family: "gpt-5.4",
        reasoning_setting: "medium",
        runner_name: "tasklog-v4-holdout-runner",
        runner_version: "2026-03-31-v4-freeze",
        run_id: "tasklog-v4-slot-a-openai-frontier-large-rep1-2026-03-31T12-00-00-000Z",
        run_started_at: "2026-03-31T12:00:01Z",
        run_finished_at: "2026-03-31T12:00:12Z",
        latency_ms: 11000,
        input_tokens: null,
        output_tokens: null,
        cache_creation_input_tokens: null,
        cache_read_input_tokens: null,
        estimated_cost_usd: null,
        payload_bytes: 512,
        payload_path: "/tmp/payload.json",
        answer: {
          decision_type: "resume_work",
          selected_work_id: "KTsx9C",
          selected_work_title: "Rebuild Bench A as V4 SWE-grounded fixture round",
          work_status: "active",
          next_step_summary: "Rerun the signal smoke regrade before live roster reruns.",
          clarifying_question: "",
          abstention_reason: "n/a",
          escalation_target: "",
          primary_evidence_source: "latest_next_steps",
          other_candidate_work_ids: [],
          selection_rationale: "",
        },
        expected_answer: {
          decision_type: "resume_work",
          selected_work_id: "KTsx9C",
          selected_work_title: "Rebuild Bench A as V4 SWE-grounded fixture round",
          work_status: "active",
          next_step_summary: "Rerun the signal smoke regrade before live roster reruns.",
          clarifying_question: "",
          abstention_reason: "",
          escalation_target: "",
          primary_evidence_source: "latest_next_steps",
          other_candidate_work_ids: [],
        },
        next_step_slots: {
          action_verb: "rerun",
          primary_target: "signal smoke regrade",
          gating_constraint: "before live roster reruns",
        },
        grade: {
          decision_type_correct: false,
          selected_work_id_correct: false,
          selected_work_title_correct: false,
          work_status_correct: false,
          next_step_accuracy: false,
          clarifying_question_correct: false,
          abstention_reason_correct: false,
          escalation_target_correct: false,
          exact_label_evidence_accuracy: false,
          compatible_family_evidence_accuracy: false,
          required_empty_fields_correct: false,
          decision_action_core_accuracy: false,
          strict_contract_accuracy: false,
          action_valid_success: false,
          abstention_accuracy: null,
          clarification_accuracy: null,
          escalation_accuracy: null,
          provisional_candidate_diagnostic: null,
        },
      },
    ],
  };
}

function minimalLlmKey(projectRoot: string) {
  return {
    benchmark_type: "llm_reentry_understanding",
    project_root: projectRoot,
    notes: [],
    scenarios: [
      {
        scenario_id: "open-work-discovery",
        scenario_type: "open_discovery",
        title: "Open Work Discovery",
        expected_answer: {
          active_work_title: "Measure Tasklog re-entry value",
          open_work_titles: ["Measure Tasklog re-entry value"],
          open_work_next_steps: ["Run the smoke lane."],
        },
        variants: [
          {
            label: "A",
            strategy: "tasklog_get_active_plus_list_works",
            metrics: { bytes: 1, lines: 1, estTokens: 1 },
          },
        ],
      },
    ],
  };
}

function minimalLlmAnswerSheet(rows: Array<{ scenario_id: string; variant_label: string }>) {
  return {
    responses: rows.map((row) => ({
      ...row,
      answer: {},
    })),
  };
}

function minimalSessionKey(projectRoot: string) {
  return {
    benchmark_type: "full_session_reentry",
    project_root: projectRoot,
    notes: [],
    scenarios: [
      {
        scenario_id: "fsr-demo",
        scenario_family: "active_work_resume",
        title: "Full Session Re-entry",
        expected_answer: {
          selected_work_id: "0tetbC",
          selected_work_title: "Measure Tasklog re-entry value",
          selection_confidence: "high",
          selection_rationale: "",
          work_status: "active",
          scope_paths: [path.join(projectRoot, "tasklog-mcp")],
          latest_log_summary: "Latest log summary",
          next_step_summary: "Next step summary",
          used_expanded_context: false,
          other_candidate_work_ids: [],
          ambiguity_notes: "",
        },
        variants: [
          {
            label: "A",
            strategy: "tasklog_session_reentry_flow",
            metrics: { bytes: 1, lines: 1, estTokens: 1 },
          },
          {
            label: "B",
            strategy: "json_state_scan",
            metrics: { bytes: 1, lines: 1, estTokens: 1 },
          },
        ],
      },
    ],
  };
}

function minimalInteractiveKey(projectRoot: string) {
  return {
    benchmark_type: "full_session_reentry_interactive",
    project_root: projectRoot,
    scenario_manifest_path: path.join(projectRoot, "interactive-scenarios.json"),
    trace_schema_path: "docs/full-session-reentry-interactive-trace-schema.json",
    notes: [],
    scenarios: [
      {
        scenario_id: "fsi-demo",
        scenario_family: "active_work_resume",
        title: "Interactive Full Session Re-entry",
        require_full_context: false,
        expected_answer: {
          selected_work_id: "0tetbC",
          selected_work_title: "Measure Tasklog re-entry value",
          selection_confidence: "high",
          selection_rationale: "",
          work_status: "active",
          scope_paths: [path.join(projectRoot, "tasklog-mcp")],
          latest_log_summary: "Latest log summary",
          next_step_summary: "Next step summary",
          used_expanded_context: false,
          other_candidate_work_ids: [],
          ambiguity_notes: "",
        },
        variants: [
          {
            label: "A",
            strategy: "tasklog_session_reentry_interactive",
            metrics: { bytes: 1, lines: 1, estTokens: 1 },
            policy_rules: {
              start_tools: ["get_active_context", "list_works"],
              require_resume_before_brief: true,
              require_brief_before_full_context: true,
              count_full_context_as_expansion: true,
            },
            interaction_contract: {
              mode: "mock_tool_calling",
              max_tool_calls: 5,
              max_model_turns: 6,
              max_final_answer_attempts: 1,
              tools: [
                {
                  name: "get_active_context",
                  description: "Get active context",
                  input_schema: {},
                  deterministic_responses: [
                    {
                      input: {},
                      result: {
                        active_work_id: "0tetbC",
                        active_work_title: "Measure Tasklog re-entry value",
                      },
                    },
                  ],
                },
                {
                  name: "list_works",
                  description: "List open work",
                  input_schema: { status: "string" },
                  deterministic_responses: [
                    {
                      input: { status: "open" },
                      result: [
                        {
                          work_id: "0tetbC",
                          title: "Measure Tasklog re-entry value",
                          status: "active",
                          next_step_summary: "Next step summary",
                          latest_log_summary: "Latest log summary",
                        },
                      ],
                    },
                  ],
                },
                {
                  name: "resume_work",
                  description: "Resume work",
                  input_schema: { work_id: "string" },
                  deterministic_responses: [
                    {
                      input: { work_id: "0tetbC" },
                      result: {
                        work_id: "0tetbC",
                        title: "Measure Tasklog re-entry value",
                        status: "active",
                      },
                    },
                  ],
                },
                {
                  name: "read_work_context",
                  description: "Read full context",
                  input_schema: { work_id: "string" },
                  deterministic_responses: [
                    {
                      input: { work_id: "0tetbC" },
                      result: {
                        work_id: "0tetbC",
                        title: "Measure Tasklog re-entry value",
                        status: "active",
                        scope_paths: [path.join(projectRoot, "tasklog-mcp")],
                        latest_log_summary: "Latest log summary",
                        next_step_summary: "Next step summary",
                        artifact_files: [],
                        recent_logs: [],
                      },
                    },
                  ],
                },
                {
                  name: "read_reentry_brief",
                  description: "Read brief",
                  input_schema: { work_id: "string" },
                  deterministic_responses: [
                    {
                      input: { work_id: "0tetbC" },
                      result: {
                        work_id: "0tetbC",
                        title: "Measure Tasklog re-entry value",
                        status: "active",
                        scope_paths: [path.join(projectRoot, "tasklog-mcp")],
                        latest_log_summary: "Latest log summary",
                        next_step_summary: "Next step summary",
                        artifact_files: [],
                        used_expanded_context: false,
                      },
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  };
}

test("bench:llm grading loads frozen answer key from sibling path", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "tasklog-bench-llm-"));
  const answerPath = path.join(projectRoot, "llm-reentry-answer-template.json");
  const keyPath = path.join(projectRoot, "llm-reentry-answer-key.json");

  await writeJson(keyPath, minimalLlmKey(projectRoot));
  await writeJson(answerPath, minimalLlmAnswerSheet([{ scenario_id: "open-work-discovery", variant_label: "A" }]));

  const result = runScript("scripts/benchmark-llm-reentry.ts", [
    "--project-root",
    projectRoot,
    "--grade-in",
    answerPath,
  ]);

  assert.equal(result.status, 0, combinedOutput(result));
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.key_path, keyPath);
});

test("bench:llm grading rejects unknown and duplicate answer-sheet rows", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "tasklog-bench-llm-"));
  const keyPath = path.join(projectRoot, "llm-reentry-answer-key.json");
  const unknownAnswerPath = path.join(projectRoot, "answers-unknown.json");
  const duplicateAnswerPath = path.join(projectRoot, "answers-duplicate.json");

  await writeJson(keyPath, minimalLlmKey(projectRoot));
  await writeJson(unknownAnswerPath, minimalLlmAnswerSheet([{ scenario_id: "fake-scenario", variant_label: "Z" }]));
  await writeJson(duplicateAnswerPath, minimalLlmAnswerSheet([
    { scenario_id: "open-work-discovery", variant_label: "A" },
    { scenario_id: "open-work-discovery", variant_label: "A" },
  ]));

  const unknownResult = runScript("scripts/benchmark-llm-reentry.ts", [
    "--project-root",
    projectRoot,
    "--grade-in",
    unknownAnswerPath,
  ]);
  assert.equal(unknownResult.status, 1);
  assert.match(combinedOutput(unknownResult), /Unknown answer-sheet row/);

  const duplicateResult = runScript("scripts/benchmark-llm-reentry.ts", [
    "--project-root",
    projectRoot,
    "--grade-in",
    duplicateAnswerPath,
  ]);
  assert.equal(duplicateResult.status, 1);
  assert.match(combinedOutput(duplicateResult), /Duplicate answer-sheet row/);
});

test("bench:session grading loads frozen answer key from --key-in and rejects incomplete sheets", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "tasklog-bench-session-"));
  const answersDir = path.join(projectRoot, "answers");
  const keysDir = path.join(projectRoot, "keys");
  const validAnswerPath = path.join(answersDir, "full-session-reentry-answer-template.json");
  const invalidAnswerPath = path.join(answersDir, "full-session-reentry-answer-incomplete.json");
  const keyPath = path.join(keysDir, "full-session-reentry-answer-key.json");

  await writeJson(keyPath, minimalSessionKey(projectRoot));
  await writeJson(validAnswerPath, {
    responses: [
      { scenario_id: "fsr-demo", variant_label: "A", answer: {} },
      { scenario_id: "fsr-demo", variant_label: "B", answer: {} },
    ],
  });
  await writeJson(invalidAnswerPath, {
    responses: [
      { scenario_id: "fsr-demo", variant_label: "A", answer: {} },
    ],
  });

  const validResult = runScript("scripts/benchmark-full-session-reentry.ts", [
    "--project-root",
    projectRoot,
    "--grade-in",
    validAnswerPath,
    "--key-in",
    keyPath,
  ]);
  assert.equal(validResult.status, 0, combinedOutput(validResult));
  assert.equal(JSON.parse(validResult.stdout).key_path, keyPath);

  const invalidResult = runScript("scripts/benchmark-full-session-reentry.ts", [
    "--project-root",
    projectRoot,
    "--grade-in",
    invalidAnswerPath,
    "--key-in",
    keyPath,
  ]);
  assert.equal(invalidResult.status, 1);
  assert.match(combinedOutput(invalidResult), /Answer sheet is incomplete/);
});

test("bench:validate-meta rejects mismatched response metadata against the batch header", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "tasklog-meta-"));
  const metadataPath = path.join(tempDir, "answers.meta.json");

  await writeJson(metadataPath, {
    benchmark_type: "llm_reentry_understanding",
    split: "dev",
    provider: "openai",
    model_id: "gpt-5.4-mini",
    model_family: "gpt-5.4-mini",
    reasoning_setting: "medium",
    runner_name: "tasklog-benchmark-runner",
    runner_version: "2026-03-29",
    project_root: "/tmp/workspace",
    pack_path: "/tmp/workspace/llm-reentry-pack.json",
    answers_path: "/tmp/workspace/answers.json",
    metadata_path: "/tmp/workspace/answers.meta.json",
    run_id: "run-001",
    submitted_at: "2026-03-29T00:00:00Z",
    responses: [
      {
        benchmark_type: "llm_reentry_understanding",
        scenario_id: "open-work-discovery",
        variant_label: "A",
        provider: "anthropic",
        model_id: "claude-sonnet-4.6",
        model_family: "claude-sonnet-4.6",
        reasoning_setting: "medium",
        runner_name: "tasklog-benchmark-runner",
        runner_version: "2026-03-29",
        run_id: "run-001",
        run_started_at: "2026-03-29T00:00:01Z",
        run_finished_at: "2026-03-29T00:00:02Z",
        latency_ms: 1000,
        input_tokens: 10,
        output_tokens: 5,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 0,
        estimated_cost_usd: 0.01,
      },
    ],
  });

  const result = runScript("scripts/validate-benchmark-runner-metadata.ts", [
    "--file",
    metadataPath,
    "--json",
  ]);

  assert.equal(result.status, 1);
  assert.match(combinedOutput(result), /must match batch provider/);
  assert.match(combinedOutput(result), /must match batch model_id/);
  assert.match(combinedOutput(result), /must match batch model_family/);
});

test("bench:validate-meta accepts the canonical sample metadata file", async () => {
  const result = runScript("scripts/validate-benchmark-runner-metadata.ts", [
    "--file",
    path.join(repoRoot, "docs", "benchmark-runner-metadata-sample.json"),
    "--json",
  ]);

  assert.equal(result.status, 0, combinedOutput(result));
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.ok, true);
});

test("benchmark regression fixtures stay parseable as written", async () => {
  const sample = JSON.parse(await readFile(path.join(repoRoot, "docs", "benchmark-runner-metadata-sample.json"), "utf8"));
  assert.equal(sample.benchmark_type, "llm_reentry_understanding");
});

test("bench:v4.1-dev lane stays source-disjoint from the frozen V4 holdout", async () => {
  const scriptResult = runScript("scripts/create-tasklog-v4-1-dev-lane.ts", ["--check"]);
  assert.equal(scriptResult.status, 0, combinedOutput(scriptResult));

  const holdout = JSON.parse(await readFile(path.join(repoRoot, "docs", "tasklog-v4-family-allocation-table.json"), "utf8"));
  const devPool = JSON.parse(await readFile(path.join(repoRoot, "docs", "tasklog-v4-1-dev-source-pool-manifest.json"), "utf8"));
  const devAllocation = JSON.parse(await readFile(path.join(repoRoot, "docs", "tasklog-v4-1-dev-family-allocation-table.json"), "utf8"));
  const devBriefs = await readFile(path.join(repoRoot, "docs", "tasklog-v4-1-dev-annotation-family-briefs.md"), "utf8");

  assert.equal(devPool.round_id, "V4.1-dev");
  assert.equal(devAllocation.round_id, "V4.1-dev");
  assert.equal(devAllocation.pack_shape.fixture_count, 16);
  assert.equal(devAllocation.pack_shape.default_fixtures_per_family, 2);

  const holdoutSourceIds = new Set(holdout.fixtures.map((fixture: { source_instance_id: string }) => fixture.source_instance_id));
  const devSourceIds = devAllocation.fixtures.map((fixture: { source_instance_id: string }) => fixture.source_instance_id);
  const devPoolSourceIds = new Set(devPool.candidates.map((candidate: { source_instance_id: string }) => candidate.source_instance_id));

  assert.equal(new Set(devSourceIds).size, 16);
  assert.deepEqual(new Set(devSourceIds), devPoolSourceIds);
  for (const sourceId of devSourceIds) {
    assert.equal(holdoutSourceIds.has(sourceId), false, `Dev lane source ${sourceId} must not appear in V4 holdout.`);
  }
  for (const fixture of devAllocation.fixtures as Array<{ fixture_id: string; source_rel_paths: string[] }>) {
    assert.ok(Array.isArray(fixture.source_rel_paths) && fixture.source_rel_paths.length > 0, `${fixture.fixture_id} must carry source_rel_paths.`);
    assert.match(devBriefs, new RegExp(fixture.fixture_id));
  }

  const familyCounts = devAllocation.fixtures.reduce((accumulator: Record<string, number>, fixture: { family_id: string }) => {
    accumulator[fixture.family_id] = (accumulator[fixture.family_id] ?? 0) + 1;
    return accumulator;
  }, {});

  assert.deepEqual(familyCounts, {
    authoritative_log_overrides_note: 2,
    stale_active_context_must_be_ignored: 2,
    blocked_work_requires_escalation: 2,
    abstain_when_no_authoritative_source: 2,
    ask_single_missing_fact_before_resume: 2,
    done_work_noise_vs_true_active_signal: 2,
    provenance_tiebreak_between_open_works: 2,
    resume_with_state_constrained_next_step: 2,
  });
});

test("bench:v4.1-dev annotation pack scaffolds prompts and draft files", async () => {
  const fixturesRoot = await mkdtemp(path.join(os.tmpdir(), "tasklog-v4-1-dev-fixtures-"));
  const fixtureRoot = path.join(fixturesRoot, "v4-1-dev-001");
  const annotationRoot = path.join(fixturesRoot, "annotation");

  await writeJson(path.join(fixturesRoot, "pack-manifest.json"), {
    round_id: "V4.1-dev",
    benchmark_type: "tasklog_v4_swe_grounded_reentry",
    fixtures: [
      {
        fixture_id: "v4-1-dev-001",
        family_id: "authoritative_log_overrides_note",
        source_instance_id: "swebench-harness-modal-entrypoint",
        difficulty: "medium",
        human_audit_status: "spot_check_optional",
      },
    ],
  });

  await writeJson(path.join(fixtureRoot, "fixture.json"), {
    round_id: "V4.1-dev",
    fixture_id: "v4-1-dev-001",
    family_id: "authoritative_log_overrides_note",
    title: "Dev lane authoritative log fixture",
    difficulty: "medium",
    candidate_work_id_allowed: false,
    primary_decision_mode: "resume_work",
    expected_label_mode: "single_authoritative_source",
    source_instance_id: "swebench-harness-modal-entrypoint",
  });

  await writeJson(path.join(fixtureRoot, "fixture-manifest.json"), {
    fixture_id: "v4-1-dev-001",
    workspace_root: path.join(fixturesRoot, "workspace", "v4-1-dev-001"),
    fixture_stage: "authored_dev_lane",
    generation_metadata: {
      human_audit_status: "spot_check_optional",
    },
    state_paths: {
      workdocs_root: path.join(fixturesRoot, "workspace", "v4-1-dev-001", "workdocs"),
    },
  });

  await writeJson(path.join(fixtureRoot, "questions.json"), {
    round_id: "V4.1-dev",
    fixture_id: "v4-1-dev-001",
    benchmark_type: "tasklog_v4_swe_grounded_reentry",
    questions: [
      {
        question_id: "q-v4-1-dev-001",
        prompt_version: "v4-1-dev-question-001",
        title: "Resume the modal entrypoint work",
        goal: "Identify the next step for the interrupted modal entrypoint task.",
        task: "Choose the correct work item and immediate next step.",
        required_fields: [
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
        ],
      },
    ],
  });

  await writeJson(path.join(fixtureRoot, "surfaces", "normalized-state.json"), { works: [] });
  await writeJson(path.join(fixtureRoot, "surfaces", "tasklog-reentry.json"), { works: [] });

  const result = runScript("scripts/create-tasklog-v4-1-dev-annotation-pack.ts", [
    "--fixtures-root",
    fixturesRoot,
    "--annotation-root",
    annotationRoot,
    "--force",
  ]);

  assert.equal(result.status, 0, combinedOutput(result));
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.round_id, "V4.1-dev");
  assert.equal(parsed.fixture_count, 1);

  const roleAssignment = JSON.parse(await readFile(path.join(annotationRoot, "role-assignment.json"), "utf8"));
  const promptPack = JSON.parse(await readFile(path.join(annotationRoot, "prompt-pack-manifest.json"), "utf8"));
  const draftA = JSON.parse(await readFile(path.join(annotationRoot, "annotator-a", "v4-1-dev-001.answer-key.json"), "utf8"));
  const annotatorPrompt = await readFile(path.join(annotationRoot, "prompts", "annotator-a.md"), "utf8");

  assert.equal(roleAssignment.round_id, "V4.1-dev");
  assert.equal(promptPack.round_id, "V4.1-dev");
  assert.equal(draftA.references.annotation_family_briefs_path.endsWith("tasklog-v4-1-dev-annotation-family-briefs.md"), true);
  assert.match(annotatorPrompt, /V4\.1-dev/);
  assert.match(annotatorPrompt, /annotation family briefs/);
});

test("bench:v4 regrade mode distinguishes V4 diagnostic scoring from V4.1 go-no-go scoring", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "tasklog-v4-regrade-"));
  const inputPath = path.join(tempDir, "v4-answers.json");
  const v4OutDir = path.join(tempDir, "v4-out");
  const v41OutDir = path.join(tempDir, "v4-1-out");

  await writeJson(inputPath, minimalV4HoldoutBatch());

  const v4Result = runScript("scripts/run-tasklog-v4-holdout.ts", [
    "--round-id",
    "V4",
    "--regrade-from",
    inputPath,
    "--out-dir",
    v4OutDir,
  ]);
  assert.equal(v4Result.status, 0, combinedOutput(v4Result));

  const v41Result = runScript("scripts/run-tasklog-v4-holdout.ts", [
    "--round-id",
    "V4.1",
    "--regrade-from",
    inputPath,
    "--out-dir",
    v41OutDir,
  ]);
  assert.equal(v41Result.status, 0, combinedOutput(v41Result));

  const v4Graded = JSON.parse(await readFile(path.join(v4OutDir, "v4-graded.json"), "utf8"));
  const v41Graded = JSON.parse(await readFile(path.join(v41OutDir, "v4-1-graded.json"), "utf8"));

  assert.equal(v4Graded.round_id, "V4");
  assert.equal(v41Graded.round_id, "V4.1");
  assert.equal(v4Graded.responses[0].grade.action_valid_success, false);
  assert.equal(v41Graded.responses[0].grade.action_valid_success, true);
  assert.equal(v41Graded.responses[0].grade.required_empty_fields_correct, false);
  assert.equal(v41Graded.responses[0].grade.strict_contract_accuracy, false);
});

test("bench:session:interactive grading loads frozen answer key from sibling path", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "tasklog-bench-interactive-"));
  const tracePath = path.join(projectRoot, "full-session-reentry-interactive-trace-template.json");
  const keyPath = path.join(projectRoot, "full-session-reentry-interactive-answer-key.json");

  await writeJson(keyPath, minimalInteractiveKey(projectRoot));
  await writeJson(tracePath, {
    benchmark_type: "full_session_reentry_interactive",
    split: "dev",
    project_root: projectRoot,
    pack_path: "/tmp/interactive-pack.json",
    trace_schema_path: "docs/full-session-reentry-interactive-trace-schema.json",
    run_id: "run-001",
    provider: "openai",
    model_id: "gpt-5.4-mini",
    model_family: "gpt-5.4-mini",
    reasoning_setting: "medium",
    runner_name: "tasklog-benchmark-runner",
    runner_version: "2026-03-29",
    traces: [
      {
        scenario_id: "fsi-demo",
        variant_label: "A",
        step_budget: {
          max_tool_calls: 5,
          max_model_turns: 6,
          max_final_answer_attempts: 1,
        },
        final_status: "answered",
        model_turns: 4,
        run_started_at: "2026-03-29T00:00:00Z",
        run_finished_at: "2026-03-29T00:00:10Z",
        tool_calls: [
          {
            step_index: 1,
            tool_name: "get_active_context",
            tool_input: {},
            tool_result: {
              active_work_id: "0tetbC",
              active_work_title: "Measure Tasklog re-entry value",
            },
            latency_ms: 5,
          },
          {
            step_index: 2,
            tool_name: "resume_work",
            tool_input: { work_id: "0tetbC" },
            tool_result: {
              work_id: "0tetbC",
              title: "Measure Tasklog re-entry value",
              status: "active",
            },
            latency_ms: 5,
          },
          {
            step_index: 3,
            tool_name: "read_reentry_brief",
            tool_input: { work_id: "0tetbC" },
            tool_result: {
              work_id: "0tetbC",
              title: "Measure Tasklog re-entry value",
              status: "active",
              scope_paths: [path.join(projectRoot, "tasklog-mcp")],
              latest_log_summary: "Latest log summary",
              next_step_summary: "Next step summary",
              artifact_files: [],
              used_expanded_context: false,
            },
            latency_ms: 5,
          },
        ],
        final_answer: {
          selected_work_id: "0tetbC",
          selected_work_title: "Measure Tasklog re-entry value",
          work_status: "active",
          scope_paths: [path.join(projectRoot, "tasklog-mcp")],
          latest_log_summary: "Latest log summary",
          next_step_summary: "Next step summary",
          used_expanded_context: false,
        },
      },
    ],
  });

  const result = runScript("scripts/benchmark-full-session-reentry-interactive.ts", [
    "--project-root",
    projectRoot,
    "--grade-in",
    tracePath,
  ]);

  assert.equal(result.status, 0, combinedOutput(result));
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.key_path, keyPath);
  assert.equal(parsed.aggregate[0].strict_scenario_success_total, 1);
});

test("bench:session:interactive grading records tool policy violations", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "tasklog-bench-interactive-"));
  const tracePath = path.join(projectRoot, "traces.json");
  const keyPath = path.join(projectRoot, "full-session-reentry-interactive-answer-key.json");

  await writeJson(keyPath, minimalInteractiveKey(projectRoot));
  await writeJson(tracePath, {
    benchmark_type: "full_session_reentry_interactive",
    split: "dev",
    project_root: projectRoot,
    pack_path: "/tmp/interactive-pack.json",
    trace_schema_path: "docs/full-session-reentry-interactive-trace-schema.json",
    run_id: "run-002",
    provider: "openai",
    model_id: "gpt-5.4-mini",
    model_family: "gpt-5.4-mini",
    reasoning_setting: "medium",
    runner_name: "tasklog-benchmark-runner",
    runner_version: "2026-03-29",
    traces: [
      {
        scenario_id: "fsi-demo",
        variant_label: "A",
        step_budget: {
          max_tool_calls: 5,
          max_model_turns: 6,
          max_final_answer_attempts: 1,
        },
        final_status: "answered",
        model_turns: 2,
        run_started_at: "2026-03-29T00:00:00Z",
        run_finished_at: "2026-03-29T00:00:05Z",
        tool_calls: [
          {
            step_index: 1,
            tool_name: "read_reentry_brief",
            tool_input: { work_id: "0tetbC" },
            tool_result: {
              work_id: "0tetbC",
              title: "Measure Tasklog re-entry value",
              status: "active",
              scope_paths: [path.join(projectRoot, "tasklog-mcp")],
              latest_log_summary: "Latest log summary",
              next_step_summary: "Next step summary",
              artifact_files: [],
              used_expanded_context: false,
            },
            latency_ms: 5,
          },
        ],
        final_answer: {
          selected_work_id: "0tetbC",
          selected_work_title: "Measure Tasklog re-entry value",
          work_status: "active",
          scope_paths: [path.join(projectRoot, "tasklog-mcp")],
          latest_log_summary: "Latest log summary",
          next_step_summary: "Next step summary",
          used_expanded_context: false,
        },
      },
    ],
  });

  const result = runScript("scripts/benchmark-full-session-reentry-interactive.ts", [
    "--project-root",
    projectRoot,
    "--grade-in",
    tracePath,
  ]);

  assert.equal(result.status, 0, combinedOutput(result));
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.aggregate[0].tool_policy_violation_total, 1);
  assert.match(JSON.stringify(parsed.graded_traces[0].policy.violation_messages), /read_reentry_brief called before resume_work/);
});

test("bench:session:interactive grading rejects malformed trace batches", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "tasklog-bench-interactive-"));
  const tracePath = path.join(projectRoot, "traces-invalid.json");
  const keyPath = path.join(projectRoot, "full-session-reentry-interactive-answer-key.json");

  await writeJson(keyPath, minimalInteractiveKey(projectRoot));
  await writeJson(tracePath, {
    benchmark_type: "full_session_reentry_interactive",
    split: "dev",
    project_root: projectRoot,
    pack_path: "/tmp/interactive-pack.json",
    trace_schema_path: "docs/full-session-reentry-interactive-trace-schema.json",
    run_id: "run-003",
    provider: "openai",
    model_family: "gpt-5.4-mini",
    reasoning_setting: "medium",
    runner_name: "tasklog-benchmark-runner",
    runner_version: "2026-03-29",
    traces: [],
  });

  const result = runScript("scripts/benchmark-full-session-reentry-interactive.ts", [
    "--project-root",
    projectRoot,
    "--grade-in",
    tracePath,
  ]);

  assert.equal(result.status, 1);
  assert.match(combinedOutput(result), /model_id/);
});

test("bench:session:interactive grading flags fixture replay mismatches", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "tasklog-bench-interactive-"));
  const tracePath = path.join(projectRoot, "traces-bad-fixture.json");
  const keyPath = path.join(projectRoot, "full-session-reentry-interactive-answer-key.json");

  await writeJson(keyPath, minimalInteractiveKey(projectRoot));
  await writeJson(tracePath, {
    benchmark_type: "full_session_reentry_interactive",
    split: "dev",
    project_root: projectRoot,
    pack_path: "/tmp/interactive-pack.json",
    trace_schema_path: "docs/full-session-reentry-interactive-trace-schema.json",
    run_id: "run-004",
    provider: "openai",
    model_id: "gpt-5.4-mini",
    model_family: "gpt-5.4-mini",
    reasoning_setting: "medium",
    runner_name: "tasklog-benchmark-runner",
    runner_version: "2026-03-29",
    traces: [
      {
        scenario_id: "fsi-demo",
        variant_label: "A",
        step_budget: {
          max_tool_calls: 5,
          max_model_turns: 6,
          max_final_answer_attempts: 1,
        },
        final_status: "answered",
        model_turns: 3,
        run_started_at: "2026-03-29T00:00:00Z",
        run_finished_at: "2026-03-29T00:00:05Z",
        tool_calls: [
          {
            step_index: 1,
            tool_name: "get_active_context",
            tool_input: {},
            tool_result: {
              active_work_id: "WRONG",
              active_work_title: "Wrong title",
            },
            latency_ms: 5,
          },
          {
            step_index: 2,
            tool_name: "resume_work",
            tool_input: { work_id: "0tetbC" },
            tool_result: {
              work_id: "0tetbC",
              title: "Measure Tasklog re-entry value",
              status: "active",
            },
            latency_ms: 5,
          },
          {
            step_index: 3,
            tool_name: "read_reentry_brief",
            tool_input: { work_id: "0tetbC" },
            tool_result: {
              work_id: "0tetbC",
              title: "Measure Tasklog re-entry value",
              status: "active",
              scope_paths: [path.join(projectRoot, "tasklog-mcp")],
              latest_log_summary: "Latest log summary",
              next_step_summary: "Next step summary",
              artifact_files: [],
              used_expanded_context: false,
            },
            latency_ms: 5,
          }
        ],
        final_answer: {
          selected_work_id: "0tetbC",
          selected_work_title: "Measure Tasklog re-entry value",
          work_status: "active",
          scope_paths: [path.join(projectRoot, "tasklog-mcp")],
          latest_log_summary: "Latest log summary",
          next_step_summary: "Next step summary",
          used_expanded_context: false,
        },
      },
    ],
  });

  const result = runScript("scripts/benchmark-full-session-reentry-interactive.ts", [
    "--project-root",
    projectRoot,
    "--grade-in",
    tracePath,
  ]);

  assert.equal(result.status, 0, combinedOutput(result));
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.aggregate[0].trace_integrity_violation_total, 1);
  assert.match(JSON.stringify(parsed.graded_traces[0].policy.violation_messages), /does not match frozen fixtures/);
});

test("bench:session:interactive grading flags read_work_context before brief", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "tasklog-bench-interactive-"));
  const tracePath = path.join(projectRoot, "traces-full-context-first.json");
  const keyPath = path.join(projectRoot, "full-session-reentry-interactive-answer-key.json");

  await writeJson(keyPath, minimalInteractiveKey(projectRoot));
  await writeJson(tracePath, {
    benchmark_type: "full_session_reentry_interactive",
    split: "dev",
    project_root: projectRoot,
    pack_path: "/tmp/interactive-pack.json",
    trace_schema_path: "docs/full-session-reentry-interactive-trace-schema.json",
    run_id: "run-005",
    provider: "openai",
    model_id: "gpt-5.4-mini",
    model_family: "gpt-5.4-mini",
    reasoning_setting: "medium",
    runner_name: "tasklog-benchmark-runner",
    runner_version: "2026-03-29",
    traces: [
      {
        scenario_id: "fsi-demo",
        variant_label: "A",
        step_budget: {
          max_tool_calls: 5,
          max_model_turns: 6,
          max_final_answer_attempts: 1,
        },
        final_status: "answered",
        model_turns: 3,
        run_started_at: "2026-03-29T00:00:00Z",
        run_finished_at: "2026-03-29T00:00:05Z",
        tool_calls: [
          {
            step_index: 1,
            tool_name: "get_active_context",
            tool_input: {},
            tool_result: {
              active_work_id: "0tetbC",
              active_work_title: "Measure Tasklog re-entry value",
            },
            latency_ms: 5,
          },
          {
            step_index: 2,
            tool_name: "resume_work",
            tool_input: { work_id: "0tetbC" },
            tool_result: {
              work_id: "0tetbC",
              title: "Measure Tasklog re-entry value",
              status: "active",
            },
            latency_ms: 5,
          },
          {
            step_index: 3,
            tool_name: "read_work_context",
            tool_input: { work_id: "0tetbC" },
            tool_result: {
              work_id: "0tetbC",
              title: "Measure Tasklog re-entry value",
              status: "active",
              scope_paths: [path.join(projectRoot, "tasklog-mcp")],
              latest_log_summary: "Latest log summary",
              next_step_summary: "Next step summary",
              artifact_files: [],
              recent_logs: [],
            },
            latency_ms: 5,
          }
        ],
        final_answer: {
          selected_work_id: "0tetbC",
          selected_work_title: "Measure Tasklog re-entry value",
          work_status: "active",
          scope_paths: [path.join(projectRoot, "tasklog-mcp")],
          latest_log_summary: "Latest log summary",
          next_step_summary: "Next step summary",
          used_expanded_context: true,
        },
      },
    ],
  });

  const result = runScript("scripts/benchmark-full-session-reentry-interactive.ts", [
    "--project-root",
    projectRoot,
    "--grade-in",
    tracePath,
  ]);

  assert.equal(result.status, 0, combinedOutput(result));
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.aggregate[0].tool_policy_violation_total, 1);
  assert.equal(parsed.aggregate[0].unnecessary_expansion_total, 1);
  assert.match(JSON.stringify(parsed.graded_traces[0].policy.violation_messages), /read_work_context called before read_reentry_brief/);
});

test("bench:session:interactive grading flags budget exhaustion", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "tasklog-bench-interactive-"));
  const tracePath = path.join(projectRoot, "traces-budget-exhausted.json");
  const keyPath = path.join(projectRoot, "full-session-reentry-interactive-answer-key.json");

  await writeJson(keyPath, minimalInteractiveKey(projectRoot));
  await writeJson(tracePath, {
    benchmark_type: "full_session_reentry_interactive",
    split: "dev",
    project_root: projectRoot,
    pack_path: "/tmp/interactive-pack.json",
    trace_schema_path: "docs/full-session-reentry-interactive-trace-schema.json",
    run_id: "run-006",
    provider: "openai",
    model_id: "gpt-5.4-mini",
    model_family: "gpt-5.4-mini",
    reasoning_setting: "medium",
    runner_name: "tasklog-benchmark-runner",
    runner_version: "2026-03-29",
    traces: [
      {
        scenario_id: "fsi-demo",
        variant_label: "A",
        step_budget: {
          max_tool_calls: 5,
          max_model_turns: 6,
          max_final_answer_attempts: 1,
        },
        final_status: "budget_exhausted",
        model_turns: 7,
        run_started_at: "2026-03-29T00:00:00Z",
        run_finished_at: "2026-03-29T00:00:05Z",
        tool_calls: [
          {
            step_index: 1,
            tool_name: "get_active_context",
            tool_input: {},
            tool_result: {
              active_work_id: "0tetbC",
              active_work_title: "Measure Tasklog re-entry value",
            },
            latency_ms: 5,
          }
        ],
        final_answer: {},
      },
    ],
  });

  const result = runScript("scripts/benchmark-full-session-reentry-interactive.ts", [
    "--project-root",
    projectRoot,
    "--grade-in",
    tracePath,
  ]);

  assert.equal(result.status, 0, combinedOutput(result));
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.aggregate[0].budget_exhaustion_total, 1);
  assert.equal(parsed.aggregate[0].strict_scenario_success_total, 0);
});
