# SWE-Style Re-entry Benchmark Direction

This document defines the next benchmark direction for Tasklog re-entry claims.

The core decision is:

- keep the current local and interactive harnesses as development and diagnostic tools
- move the claim-bearing lane to a `SWE-style isolated benchmark`

`SWE-style` here means:

- each run starts from a fresh workspace snapshot
- the benchmark fixture is frozen before evaluation
- the runner executes inside an isolated environment
- the scored question and success criteria are frozen ahead of time
- the claim is based on a small, sufficient, reproducible holdout set rather than an always-live workspace

This document does not replace the existing benchmark docs.
It sets the direction for the next claim-bearing protocol revision.

## Why Change Direction

The current benchmark work proved useful for protocol design, grading design, and comparative rehearsal.
It also exposed a structural problem:

- the live local workspace is too rich and too contaminated for claim-bearing evaluation

Examples of contamination sources:

- `AGENTS.md` routing and tool-use norms
- ambient Tasklog state from unrelated current work
- `workdocs`, `notes`, and stale active context from this machine
- local helper tools such as Serena, GraphCode, RTK, and repo-specific wrappers
- drift between today's codebase and the historical work state implied by a test case
- agent CLI behavior that may still reflect local environment assumptions even when the benchmark prompt is constrained

This means the current live-run harness should be treated as:

- useful for smoke testing
- useful for debugging prompts, tool policies, and graders
- not sufficient as the main evidence for a public claim

## High-Level Goal

We want to support a claim of the form:

`Given a fresh coding workspace plus Tasklog work continuity artifacts, the Tasklog re-entry workflow helps an agent recover the correct unfinished work and the next concrete step more reliably than weaker continuity baselines.`

This is narrower than a full SWE-bench-style issue-resolution claim.
It is also stronger than a pure payload reconstruction benchmark.

The claim should focus on `re-entry and continuation readiness`, not full task completion.

## Benchmark Shape

The benchmark should become a hybrid:

- `SWE-style infrastructure`
- `Tasklog-specific continuity scenarios`

That means the benchmark borrows the environment discipline of SWE benchmarks without pretending to be a generic issue-resolution benchmark.

### Borrow from SWE-style benchmarks

- frozen repo snapshots
- isolated execution environment per run
- fixed split policy
- reproducible runner metadata
- explicit dev versus holdout separation

### Keep as Tasklog-specific

- seeded Tasklog work state
- seeded logs, notes, and workdocs
- seeded ambiguity and stale-context conditions
- grading centered on work selection and next-step recovery
- optional continuation-readiness checks instead of full patch success

## Primary Decision

We should not try to benchmark everything.

The next protocol should aim for `sufficient evidence for a claim`, not exhaustive product simulation.

That means:

- small holdout set
- strong scenario coverage
- frozen environment
- conservative claim wording

If the protocol can support a stable claim with a compact suite, that is better than a broad but noisy benchmark.

## Proposed Tracks

Use two clearly separated tracks.

### Claim Lane

This is the only lane used for public benchmark claims.

Properties:

- fresh isolated workspace for every run
- frozen repo snapshot and seeded Tasklog artifacts
- frozen question set
- frozen scoring key
- fixed model roster for the round
- strict runner metadata capture

This lane should avoid any dependency on the current local workspace.

### Diagnostic Lane

This lane is for local iteration only.

Properties:

- may run against local workspace state
- may use current harnesses and local CLIs
- useful for debugging prompts, tool order, trace policy, and cost
- not claim-bearing

Current `Bench C1` and `Bench C2` activity mostly belongs here until the isolated claim lane exists.

## Recommended Scope of the Claim Lane

The claim lane should measure only:

- choose the correct work to resume
- recover the current state of that work
- identify the next concrete step
- avoid overcommitting when the evidence is ambiguous

It should not initially measure:

- full code change completion
- full issue resolution
- long-horizon planning quality
- open-ended open-work discovery across a live workspace

This keeps the benchmark aligned with the product claim we actually need.

## Minimum Scenario Set

The holdout set should be intentionally small but diverse.

Recommended minimum:

- `active_work_resume`
- `stale_active_context_resume`
- `multiple_open_works_resume`
- `blocked_work_triage`
- `closed_work_do_not_resume`
- `artifact_heavy_done_work`

Recommended target size:

- `8 to 12 holdout scenarios`

That is enough to support a modest claim if:

- the scenarios are high quality
- the work shapes are meaningfully different
- the grading is frozen
- the baselines are fair

Do not expand the holdout set just to make it look bigger.
Expand only when we need coverage that changes the claim.

## Environment Requirements

Every claim-lane run should execute in a fresh environment.

Minimum requirements:

- fresh temp workspace or container per run
- fixed repo commit or fixture snapshot
- no access to the operator's ambient `tasklog`, `workdocs`, or unrelated repositories
- no access to local Serena or GraphCode state unless explicitly included in the benchmark arm
- no dependence on local `HOME`, user-specific config, or prior session memory
- no hidden state outside the frozen fixture pack and the runner metadata

Preferred implementation:

- containerized workspace setup
- one fixture workspace directory per scenario
- one seeded Tasklog state pack per scenario
- one runner entrypoint that mounts only the required fixture files

## Fixture Design

The benchmark should no longer rely on today's live product workspace as the source of truth.

Instead, each scenario should be built from:

- a frozen repo snapshot
- a frozen Tasklog state snapshot
- frozen notes and workdocs where relevant
- a frozen answer key
- a short scenario note describing what makes this case representative

Each scenario should also specify what is intentionally misleading.

Examples:

- stale active work that points to the wrong task
- two open works where only one matches the latest logs
- a done work with strong artifacts that should not be resumed
- a blocked work whose next step is escalation rather than coding

## Repo Strategy

We should anchor on recognizable SWE-style repository evaluation patterns, but we do not need to reuse the full SWE-bench task format.

Recommended repo strategy:

- use a small number of frozen open-source repos or curated internal snapshots
- prefer repos with real module structure, tests, and documentation
- avoid repos whose shape forces the benchmark to become a general issue-solving test

Selection criteria:

- easy to freeze and replay
- enough code structure to support realistic re-entry
- enough ambiguity to make the wrong resume choice plausible
- enough artifacts to seed notes, logs, and summaries
- not so large that the benchmark becomes mostly a search benchmark

## Benchmark Arms

The public-facing arm set can stay familiar:

- `Workspace-Only`
- `Notes Replay`
- `Raw State`
- `Normalized State`
- `Tasklog Re-entry`

But for the claim lane, all arms must run inside the same isolated fixture environment.

That means:

- `Workspace-Only` sees only the frozen repo snapshot
- `Notes Replay` sees only the seeded markdown artifacts
- `Raw State` sees only the seeded raw Tasklog state files
- `Normalized State` sees only those same seeded raw files plus generic shaping
- `Tasklog Re-entry` sees only the seeded Tasklog MCP surface for that fixture

No arm should be able to reach the operator's real workspace or session state.

## Metrics

The claim lane should stay focused on a short metric set.

Primary metrics:

- `resume_target_accuracy_percent`
- `next_step_accuracy_percent`

Secondary metrics:

- `strict_scenario_success_percent`
- `supported_field_recall_percent`
- `abstention_quality_percent`

Diagnostic metrics:

- stale-context sensitivity
- multi-open-work confusion rate
- blocked-work misresume rate
- unnecessary expansion rate
- tool-policy violation rate

Efficiency metrics:

- tool calls
- model turns
- prompt bytes or tokens
- latency
- optional cost

Do not elevate diagnostic metrics into the claim unless we are prepared to defend them publicly.

## Claim Standard

The claim should stay conservative.

Example acceptable claim:

`On a frozen SWE-style re-entry benchmark with isolated fixture workspaces, Tasklog Re-entry outperformed weaker continuity baselines on selecting the correct work to resume and identifying the next concrete step.`

Example claims to avoid for now:

- `Tasklog makes coding agents generally better at software engineering`
- `Tasklog improves full issue completion on SWE-bench`
- `Tasklog wins on all repo understanding tasks`

The benchmark should support only the claim that the protocol can truly defend.

## Model and Runner Policy

Before any claim run:

- freeze exact model ids
- freeze reasoning settings
- freeze runner version
- freeze environment image or setup script version
- record run date
- record provider

If a model alias changes, start a new round rather than silently mixing results.

If a runner cannot reliably disable ambient or hidden tool use, it should remain diagnostic-only.

## What Happens to Existing Benchmarks

Existing benchmark assets remain useful.

### Bench A

Keep as the compact frozen payload benchmark for re-entry understanding.
This remains useful because it is cheap, stable, and easy to rerun.

### Bench C1

Keep as a supporting scripted benchmark.
Use it to debug scenario design and compare surface quality before running the isolated lane.

### Bench C2

Keep as an exploratory interactive benchmark.
Use it to debug live tool workflows, runner policy, and tool ordering.
Do not treat it as claim-bearing until it runs in a fresh isolated environment.

## Suggested Implementation Plan

Phase 1:

- freeze this direction
- decide the claim wording
- define the fixture format
- define the isolated runner contract

Phase 2:

- build a fixture generator
- create `8 to 12` claim-lane scenarios
- create a fresh workspace launcher
- make all arms consume only fixture-local state

Phase 3:

- rehearse on a dev split
- freeze the holdout split
- run the small fixed model roster
- publish only the conservative claim the data supports

## Decision Summary

The next claim-bearing benchmark should be:

- `SWE-style in environment discipline`
- `Tasklog-specific in scenario design`
- `small but sufficient in holdout size`
- `strictly isolated from the operator's live workspace`

That is the simplest path to a benchmark we can actually defend.
