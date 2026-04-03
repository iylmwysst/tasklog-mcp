# Full Session Re-entry Benchmark

This document defines `Bench C1`, the scripted version of the third benchmark in the Tasklog benchmark inventory.

It is intentionally separate from the frozen `work_reentry` benchmark so we can measure the practical value of the full product workflow without collapsing all evidence into one claim-bearing result too early.

The executable `Bench C1` scaffold lives in:

- `scripts/benchmark-full-session-reentry.ts`
- `docs/full-session-reentry-scenarios.json`

The current scenario manifest now includes `dev`, `holdout`, and `stress` lanes for review, but only `dev` should be treated as execution-ready until the runner and grading workflow are frozen.

The planned interactive successor is documented separately in `docs/full-session-reentry-interactive-benchmark.md`.

## Purpose

This benchmark measures `end-to-end session re-entry`.

The question is not only whether one retrieval surface contains the right facts.
The question is whether an agent can:

- discover the right unfinished work
- choose the correct work to resume
- retrieve enough context to continue safely
- identify the next concrete step

This is the closest benchmark to the real Tasklog product flow.

## Role in the Benchmark Inventory

- `Primary claim-bearing benchmark`
  Frozen LLM `work_reentry`
- `Supporting benchmark`
  Deterministic surface benchmark
- `Supporting benchmark`
  Full Session Re-entry benchmark (`Bench C1`)
- `Supporting or exploratory benchmark`
  Full Session Re-entry Interactive benchmark (`Bench C2`, planned)

This benchmark should begin as `supporting`.

Do not promote it to the main claim until its protocol is frozen and its sources of variance are understood.

## Core Flow

Each run should model the default session-to-session recovery path:

1. inspect active session state
2. discover open work
3. choose the best candidate work to resume
4. load the default concise re-entry context
5. expand to full context only when necessary
6. answer what the work is and what to do next

The intended live Tasklog flow is:

1. `get_active_context`
2. `list_works(status="open")`
3. `resume_work`
4. `read_reentry_brief`
5. optional `read_work_context`
6. final structured answer

The current executable harness is a `static scripted approximation`, not a live interactive tool runner.
To keep the payload one-shot and gradeable, it exposes open-work discovery first and then batches brief snapshots for the open candidate shortlist.
Closed distractors are intentionally excluded from the Tasklog brief step because `list_works(status="open")` would not return them.

## Benchmark Question

The benchmark should ask one end-to-end question per scenario:

`You are resuming work in this coding workspace. Determine which unfinished work should be resumed now, summarize its current state, and state the next concrete step. Use only the provided tools or payload for this strategy. Do not guess.`

## Scenario Families

The first version should use only scenarios that have a clear intended target work and a stable expected next step.

Recommended scenario families:

- `active_work_resume`
- `stale_active_context_resume`
- `multiple_open_works_resume`
- `blocked_work_triage`
- `closed_work_do_not_resume`

Do not include open-ended project planning scenarios in v1.

## Benchmark Arms

Use the same paper-facing display labels as the other benchmarks:

- `Workspace-Only`
- `Notes Replay`
- `Raw State`
- `Normalized State`
- `Tasklog Re-entry`

The arms differ in what evidence and flow are allowed.

### Workspace-Only

- allowed inputs: workspace tree, repo status, local manifests, code search, docs search
- not allowed: `.tasklog`, `workdocs`, Tasklog MCP outputs

### Notes Replay

- allowed inputs: session markdown and workdocs markdown only
- not allowed: Tasklog structured JSON state or Tasklog MCP tools

### Raw State

- allowed inputs: raw `.tasklog` state files and workdocs files
- allowed operations: direct file reads only
- not allowed: benchmark-only normalization beyond trivial parsing

### Normalized State

- allowed inputs: same source files as `Raw State`
- allowed operations: generic flattening, preview shaping, latest-log extraction, path basename normalization, and other product-agnostic normalization
- not allowed: Tasklog-specific wording heuristics or hidden mappings that mirror the Tasklog flow

### Tasklog Re-entry

- allowed inputs: Tasklog MCP workflow
- intended live flow: brief-first
- executable harness approximation: shortlist-first one-shot payload
- optional expansion: `read_work_context` only when needed

## Protocol Shape

The first version should be `scripted multi-step`, not fully open agentic evaluation.

That means each arm should expose a predefined interaction surface and the model should be graded on the end answer, not on arbitrary tool exploration.

Why:

- it keeps arm comparisons fairer
- it reduces variance from unrelated exploration behavior
- it is much easier to debug before attempting a more agentic benchmark later

Because it is a static scripted benchmark, the current executable harness does not yet enforce literal sequential access at the token boundary.
Review it as a one-shot approximation of the intended flow, not as a full interactive tool-calling benchmark.

## Typical Workflow

1. Generate a blinded scenario pack for the chosen split.
2. Run each variant through the same model and save answers into the template.
3. Grade the answer sheet against the frozen answer key.

## Example

Generate a dev pack:

```bash
npm run bench:session -- --project-root /path/to/workspace --manifest docs/full-session-reentry-scenarios.json --split dev --out-dir /tmp/tasklog-session-pack
```

Grade an answer sheet:

```bash
npm run bench:session -- --project-root /path/to/workspace --grade-in /tmp/tasklog-session-pack/answers.json
```

By default, grading loads the frozen `full-session-reentry-answer-key.json` from the same directory as the answer sheet.
Use `--key-in /path/to/full-session-reentry-answer-key.json` when the answer key lives elsewhere.

## Structured Output Contract

Scored core fields:

- `selected_work_id`
- `selected_work_title`
- `work_status`
- `scope_paths`
- `latest_log_summary`
- `next_step_summary`
- `used_expanded_context`

Unscored diagnostic fields that the current prompt still asks for:

- `selection_confidence`
- `selection_rationale`
- `other_candidate_work_ids`
- `ambiguity_notes`

The current grader does not score or reject those diagnostic fields. Treat them as analysis aids, not claim-bearing metrics.

Unknown fields must be empty strings or empty arrays.

## Metrics

Primary metrics:

- `resume_target_accuracy_percent`
- `next_step_accuracy_percent`

Secondary metrics:

- `supported_field_recall_percent`
- `strict_scenario_success_percent`
- `field_accuracy_percent`

Diagnostic metrics:

- selection-versus-context failure breakdown
- confusion rate between simultaneously open works
- unnecessary-expansion rate
- stale-active-context sensitivity
- blocked-work misresume rate

Efficiency metrics:

- context bytes
- estimated tokens
- latency
- step count
- tool call count

## Model Roster Policy

This benchmark should inherit the same model-lane policy as the frozen LLM re-entry benchmark so comparisons across benchmark forms stay interpretable.

### Smoke Lane

- `gpt-5.4-mini`
- `claude-haiku-4.5`

Use this lane for cheap scripted-flow debugging only.

### Pre-holdout Dev Lane

- `gpt-5.4-mini`
- `claude-sonnet-4.6`

Use this lane to verify that flow-level failures are not only artifacts of very small models.

### Holdout Lane

- `gpt-5.4-mini`
- `gpt-5.4`
- `claude-sonnet-4.6`
- `claude-opus-4.6`

Use this lane when the scripted multi-step protocol is frozen.

### Post-holdout Ablation Lane

- `gpt-5.4` with `high` reasoning
- `claude-haiku-4.5`

Use this lane for sensitivity checks such as:

- whether higher reasoning effort changes selection quality
- whether Tasklog's workflow value survives on smaller models

## Model Selection Rules

- Freeze exact model ids and reasoning settings before any claim-bearing run.
- Keep at least two vendor families in the main holdout roster.
- Treat reasoning settings as configuration variants of one model, not as separate model families.
- If a cheaper smoke lane passes but the pre-holdout dev lane fails, fix the protocol before spending holdout budget.

Runner metadata must follow `docs/benchmark-runner-metadata-contract.md`.

## Scoring Logic

Each scenario should be graded in stages:

1. `selection`
   Did the model choose the correct work to resume?
2. `state reconstruction`
   Did it recover status, scope, and latest summary accurately?
3. `next step`
   Did it identify the correct next concrete action?
4. `control behavior`
   Did it abstain appropriately when evidence was ambiguous?

A scenario should count as strict success only if:

- the selected work is correct
- no required field is hallucinated
- the next step is correct

## Freeze Rules

Before any claim-bearing run of this benchmark family:

1. freeze scenario membership
2. freeze the scripted per-arm interaction contract
3. freeze output schema
4. freeze grading rules
5. freeze allowed normalization rules for `Normalized State`

Any change after that starts a new benchmark round.

## Readiness Gate for V1

Do not run the first real benchmark round until:

1. Bench A and Bench B are both runnable from `package.json`
2. Bench B uses the same five arm labels as Bench A
3. a scenario pack exists with at least one multi-open-work case and one stale-active-context case
4. the grader can distinguish wrong-work selection from wrong-next-step errors
5. the Tasklog arm is locked to `Brief-first` with explicit optional expansion

The current dev scaffold satisfies only the `executable dev pack` goal.
It now includes draft `holdout` and `stress` scenarios for review, but those lanes still need frozen runner behavior and live rehearsal before they are treated as ready.

## Expected Interpretation

This benchmark is meant to answer a different question from the frozen `work_reentry` benchmark.

- Bench A asks whether a retrieval surface helps reconstruct one known work correctly.
- Bench C asks whether the full workflow helps an agent resume the right work efficiently and safely.

Tasklog does not need to win both benchmarks for the result to be useful.
If it ties on Bench A but wins on Bench C, that would support the claim that Tasklog's value is in workflow design rather than only in payload compression.
