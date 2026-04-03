# Full Session Re-entry Interactive Benchmark

This document defines `Bench C2`, the interactive successor to the current scripted full-session benchmark.

Use this spec for the `Bench C2` track:

- `Bench C1`
  `docs/full-session-reentry-benchmark.md`
  Static scripted shortlist approximation
- `Bench C2`
  `docs/full-session-reentry-interactive-benchmark.md`
  Interactive tool-calling benchmark

The initial executable `Bench C2` scaffold lives in:

- `scripts/benchmark-full-session-reentry-interactive.ts`
- `docs/full-session-reentry-interactive-scenarios.json`
- `docs/full-session-reentry-interactive-trace-schema.json`
- `docs/full-session-reentry-interactive-runner-contract.md`

`Bench C2` should begin as `supporting or exploratory`.
Do not promote it to claim-bearing use until its trace protocol, runner behavior, and grading workflow are frozen.

## Purpose

This benchmark measures whether the real Tasklog resume workflow helps an agent re-enter a workspace more effectively than alternative continuity surfaces when the model must actually choose which tools to call and when to stop.

Unlike `Bench C1`, this benchmark does not approximate the flow with a one-shot payload.
It measures the interactive workflow itself.

## Benchmark Role

- `Bench A`
  Frozen LLM `work_reentry` benchmark
  Main claim-bearing benchmark
- `Bench B`
  Deterministic surface benchmark
  Supporting benchmark
- `Bench C1`
  Static scripted full-session benchmark
  Supporting benchmark
- `Bench C2`
  Interactive full-session benchmark
  Supporting or exploratory benchmark

The current executable harness should be treated as `dev-only`.
It is a real prototype harness, not a claim-ready benchmark.

## Live Flow Under Test

The intended Tasklog flow is:

1. `get_active_context`
2. `list_works(status="open")`
3. choose a candidate work
4. `resume_work`
5. `read_reentry_brief`
6. optional `read_work_context`
7. final structured answer

This benchmark should test that flow directly rather than simulating it with a prebuilt shortlist payload.

## Benchmark Question

Each scenario should ask one end-to-end question:

`You are resuming work in this coding workspace. Use only the allowed tools for this strategy. Determine which unfinished work should be resumed now, summarize its current state, and state the next concrete step. Do not guess.`

## Protocol

This benchmark should be `interactive but budgeted`.

That means:

- the runner exposes a fixed allowed tool set per arm
- the model can call tools step by step
- every tool call and tool result is recorded in the trace
- the run stops when the model emits the final JSON answer or exhausts the step budget

This is not a fully open agentic benchmark.
It is a constrained interactive benchmark.

## Step Budget

Freeze a small step budget before any serious comparison.

Recommended v1 budget:

- maximum tool calls: `5`
- maximum final answer attempts: `1`
- hard stop after `6` model turns total

Why:

- enough room to do discovery, selection, brief, and one optional expansion
- small enough that wasteful exploration is visible and comparable
- cheap enough to run across multiple models and scenarios

## Tool Policy By Arm

Keep the paper-facing labels aligned with the other benchmarks:

- `Workspace-Only`
- `Notes Replay`
- `Raw State`
- `Normalized State`
- `Tasklog Re-entry`

### Workspace-Only

Allowed actions:

- inspect repo tree
- inspect repo status
- read workspace files outside `.tasklog` and `workdocs`
- code search

Not allowed:

- `.tasklog`
- `workdocs`
- Tasklog MCP tools

### Notes Replay

Allowed actions:

- read session markdown
- read workdocs markdown

Not allowed:

- `.tasklog` JSON state
- Tasklog MCP tools

### Raw State

Allowed actions:

- read `.tasklog` JSON state files
- read workdocs files

Not allowed:

- benchmark-only normalization beyond trivial parsing
- Tasklog MCP tools

### Normalized State

Allowed actions:

- same source files as `Raw State`
- generic product-agnostic normalization
- generic preview shaping
- latest-log extraction

Not allowed:

- hidden Tasklog-specific mappings
- precomputed flow shortcuts that effectively simulate Tasklog tools

### Tasklog Re-entry

Allowed tools:

- `get_active_context`
- `list_works`
- `resume_work`
- `read_reentry_brief`
- `read_work_context`

Required live policy:

- start with `get_active_context` or `list_works`
- call `resume_work` before `read_reentry_brief`
- call `read_work_context` only after `read_reentry_brief`

## Scenario Families

Reuse the same family set as `Bench C1` when possible:

- `active_work_resume`
- `stale_active_context_resume`
- `multiple_open_works_resume`
- `blocked_work_triage`
- `closed_work_do_not_resume`

Interactive v1 should still avoid open-ended planning or product ideation scenarios.

## Output Contract

Scored core fields:

- `selected_work_id`
- `selected_work_title`
- `work_status`
- `scope_paths`
- `latest_log_summary`
- `next_step_summary`
- `used_expanded_context`

Diagnostic but initially unscored fields:

- `selection_confidence`
- `selection_rationale`
- `other_candidate_work_ids`
- `ambiguity_notes`
- `tool_trace_summary`

## Trace Contract

Every run should emit a machine-readable trace record with:

- `benchmark_type`
- `scenario_id`
- `variant_label`
- `model_id`
- `reasoning_setting`
- `run_id`
- `step_budget`
- `model_turns`
- `final_status`
- `tool_calls`
- `final_answer`

Each tool call record should preserve:

- `step_index`
- `tool_name`
- `tool_input`
- `tool_result`
- `latency_ms`

The frozen JSON schema for this trace format lives at `docs/full-session-reentry-interactive-trace-schema.json`.
The runner-facing trace contract lives at `docs/full-session-reentry-interactive-runner-contract.md`.

## Typical Workflow

1. Generate a blinded interactive dev pack.
2. Run each variant with the constrained mock-tool contract.
3. Save the trace batch in the frozen trace schema.
4. Grade the trace batch against the frozen interactive answer key.

## Example

Generate an interactive dev pack:

```bash
npm run bench:session:interactive -- --project-root /path/to/workspace --manifest docs/full-session-reentry-interactive-scenarios.json --split dev --out-dir /tmp/tasklog-session-interactive-dev
```

Grade an interactive trace batch:

```bash
npm run bench:session:interactive -- --project-root /path/to/workspace --grade-in /tmp/tasklog-session-interactive-dev/traces.json
```

By default, grading loads the frozen `full-session-reentry-interactive-answer-key.json` from the same directory as the trace batch.
Use `--key-in /path/to/full-session-reentry-interactive-answer-key.json` when the key lives elsewhere.

## Metrics

Primary metrics:

- `resume_target_accuracy_percent`
- `next_step_accuracy_percent`

Secondary metrics:

- `strict_scenario_success_percent`
- `supported_field_recall_percent`
- `field_accuracy_percent`

Interactive diagnostics:

- `wasted_tool_call_rate`
- `unnecessary_expansion_rate`
- `selection_before_brief_violation_rate`
- `brief_before_resume_violation_rate`
- `budget_exhaustion_rate`
- `trace_hallucination_rate`

Efficiency metrics:

- tool calls
- model turns
- latency
- input tokens
- output tokens
- estimated cost

## Failure Taxonomy

Interactive grading should classify at least these failure modes:

- selected the wrong work before sufficient evidence
- ignored stale active context and still chose correctly
- overtrusted stale active context and chose incorrectly
- resumed the right work but summarized it incorrectly
- resumed the right work but proposed the wrong next step
- expanded context unnecessarily
- exhausted the budget before reaching a justified answer
- violated the allowed tool sequence

## Grading

Grade the final answer separately from the trace.

Final-answer grading should determine correctness.
Trace grading should determine whether the run followed the allowed interactive policy efficiently and honestly.

That means a run can:

- get the answer right but still receive a trace-policy violation
- get the answer wrong even if the trace was well behaved

## Comparison With Bench C1

`Bench C1` should stay in the inventory even after `Bench C2` exists.

Reason:

- `Bench C1` isolates surface quality with lower variance
- `Bench C2` measures real workflow value with higher realism and higher variance

Use both together:

- `C1` for clean evidence about retrieval shaping
- `C2` for practical evidence about live workflow value

## Readiness Gates

Before running an interactive dev lane:

1. freeze the allowed tool set per arm
2. freeze the step budget
3. freeze the trace schema
4. confirm the runner records every tool call deterministically
5. confirm replayable grading from frozen traces

Before any claim-bearing use:

1. freeze the scenario pack
2. freeze the runner roster
3. freeze exact model ids and reasoning settings
4. freeze the trace-policy grader
5. run cross-model smoke lanes without protocol drift

## Recommendation

Implement `Bench C2` only after `Bench C1` remains stable in routine use.

The practical rollout order should be:

1. keep `Bench C1` as the active executable full-session benchmark
2. prototype `Bench C2` on a small dev scenario pack
3. use `Bench C2` as supporting evidence only
4. decide later whether a future frozen interactive benchmark deserves stronger paper-facing status

## Current Residual Gap

The current repo already has regression coverage for:

- frozen-key loading in the scripted graders
- malformed answer-sheet rejection
- batch-versus-response metadata validation
- interactive sibling-key grading
- interactive tool-sequence policy violations
- interactive budget and malformed-trace rejection

Those are no longer the main open risk for the benchmark program.

The main remaining gap before `Bench C2` becomes real is interactive-specific coverage:

- broader holdout and stress rehearsal with external runners
- deeper stop-rule and multi-vendor runner behavior checks
- runner replay tests from frozen traces outside the local mock harness
