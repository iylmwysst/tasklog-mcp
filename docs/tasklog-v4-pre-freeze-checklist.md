# Tasklog V4 Pre-Freeze Checklist

This note exists to close the major design risks before `V4` fixture authoring begins.

It should be treated as the pre-freeze preparation gate for:

- SWE instance selection
- family mapping
- generation-prompt leakage control
- audit spread

It complements:

- `docs/tasklog-v4-swe-grounded-round-note.md`
- `docs/tasklog-v4-fixture-provenance-contract.md`
- `docs/tasklog-v4-agent-handoff-generation-protocol.md`

## Purpose

`V4` should not repeat the main avoidable failure modes from earlier rounds:

- source selection that drifts toward hand-picked easy wins
- family coverage that looks broad on paper but collapses in the audited subset
- generation prompts that leak benchmark answers into the handoff artifacts
- baseline payload drift that makes the comparison less fair than `V3`

## 1. SWE Instance Selection Rule

The `V4` source pool must be chosen before fixture authoring.

Use this sequence:

1. define an eligible source pool from the available SWE-derived vendor snapshot
2. freeze the eligibility criteria
3. freeze the selection method
4. select candidate instances
5. only then map them into fixture families

### Eligibility Criteria

An instance is eligible only if:

- the repo snapshot is available locally and can be copied into a fixture workspace
- the repo is readable without hidden external state
- the codebase has enough real structure for work handoff to be meaningful
- the task can support an interrupted-work interpretation rather than only a final patch-success interpretation
- the instance is not so tiny that continuation is trivial
- the instance is not so large or broken that the handoff benchmark becomes mostly environment triage

### Prohibited Selection Shortcuts

Do not:

- pick instances after looking at benchmark outcomes
- cherry-pick only repos or issues that obviously favor Tasklog
- drop hard families because a repo is inconvenient after family assignment
- use family-specific repo choices that make one family much easier than the others by construction

### Recommended Source Procedure

- freeze a source pool larger than the final pack, for example `48` or `64` candidate SWE-derived instances
- record the pool in a frozen source-selection manifest before authoring fixtures
- map the final `32` fixtures from that predeclared pool

## 2. Family Mapping Rule

`V4` should keep the same high-level pack discipline as `V3` unless there is a frozen reason to change it:

- `32` fixtures total
- `8` families
- default target `4` fixtures per family

Before authoring begins, freeze a family-allocation table that records:

- `fixture_id`
- `family_id`
- `source_instance_id`
- `primary_decision_mode`
- `difficulty`
- `candidate_work_id_allowed`
- `expected_label_mode`

### Mapping Guardrails

- do not let one repo dominate too many fixtures unless that distribution is frozen intentionally and documented
- do not assign all hard ambiguity cases to one narrow repo subset
- keep clarifying and abstention cases distributed rather than clustered at the end
- ensure every family has at least one source instance that survives human audit

## 3. Human Audit Coverage Rule

The audit subset must be frozen before any benchmark run.

Recommended minimum for a `32`-fixture pack:

- audit `8` fixtures
- include at least `1` audited fixture from each family

If the audit budget is exactly `8`, the subset should be:

- `1` audited fixture per family

If the audit budget is larger than `8`, distribute extras toward:

- ambiguity-heavy families
- clarifying-question families
- provenance-tiebreak families
- state-constrained-next-step families

### Audit Freeze Rule

Before fixture freeze, record:

- which fixtures were selected for audit
- why they were selected
- which families they cover

Do not change the audit subset after outputs are visible.

## 4. Generation Prompt Leakage Rule

The generator and reviewer prompts must be frozen before large-scale authoring starts.

### Generator Prompt Must Not Contain

- the expected benchmark answer
- the expected winning arm
- the final selected work id
- the final evidence label
- the gold next-step wording
- grader-specific vocabulary that should only appear during annotation

### Generator Prompt Must Explicitly Ask For

- plausible interrupted-work state
- incomplete or ambiguous continuity evidence where intended
- realistic logs, workdocs, and notes that reflect the repo snapshot
- no direct answer leakage in notes or workdocs

### Reviewer Prompt Must Explicitly Check

- realism against the repo snapshot
- consistency between repo state and Tasklog state
- absence of gold-answer leakage
- adherence to the assigned family pattern
- whether the handoff state remains neutral enough for both benchmark arms

### Prompt Version Rule

Before fixture freeze, record:

- `generation_prompt_version`
- `review_prompt_version`

If these prompts change materially after large-scale authoring begins, version the resulting pack forward instead of silently mixing prompt regimes.

## 5. Pre-Freeze Gate

Do not start full-pack fixture authoring until all of the following are frozen:

- source-pool selection rule
- family-allocation table
- audit subset rule
- generator prompt version
- reviewer prompt version
- baseline fairness note

## 6. Sign-Off Checklist

Mark each item before authoring:

- source pool frozen
- family allocation frozen
- audit subset rule frozen
- generator/reviewer model pair frozen
- generation and review prompts frozen
- baseline fairness note frozen
- no benchmark outputs visible yet
