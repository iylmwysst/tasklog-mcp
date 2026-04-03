# Tasklog V4 Agent-Handoff Generation Protocol

This note freezes the intended fixture-generation discipline for `V4`.

`V4` is not trying to simulate handwritten human notes only.
It is trying to measure whether Tasklog supports reliable session handoff on real codebase snapshots.

That means AI-assisted handoff generation is in scope, but only under a role-separated protocol.

## Core Idea

Each `V4` fixture should represent this chain:

1. a frozen SWE-derived repo snapshot
2. a first session that reviews the codebase and records in-progress Tasklog state
3. a second session that must re-enter from that state and continue correctly

The benchmark question is:

`How well does Tasklog support agent-to-agent or session-to-session handoff on a real frozen codebase workspace?`

## Frozen Roles

Each fixture must keep these roles separate:

- `protocol_owner`
  Owns the round-level contracts, freeze order, and allowed claim wording.
- `fixture_author`
  Owns the final frozen fixture directories and fixture-local manifests.
- `generator`
  Produces the first draft of the handoff state from the repo snapshot.
- `reviewer`
  Reviews and normalizes the generated handoff state without answering the benchmark question.
- `human_auditor`
  Audits a bounded subset of fixtures for realism, consistency, and leakage.
- `annotator_a`
  Produces an independent gold-answer draft.
- `annotator_b`
  Produces a second independent gold-answer draft.
- `adjudicator`
  Resolves disagreements.
- `grader_implementer`
  Owns scorer implementation without changing semantics after outputs are visible.
- `run_operator`
  Executes the benchmark after all frozen inputs are sealed.

The same role holder must not fill multiple frozen roles in a way that collapses independence.

The `generator`, `reviewer`, and `human_auditor` roles are additions inside the broader `V3`-style structure.
They do not replace `protocol_owner`, `fixture_author`, `grader_implementer`, `annotator`, `adjudicator`, or `run_operator`.

## Recommended `V4` Setup

- `generator`
  `codex 5.1 mini` used for first-pass handoff drafting.
- `reviewer`
  `codex 5.2` used for review and normalization.
- `human_auditor`
  manual audit on a fixed subset, recommended `25%` of the pack.
- `benchmark roster`
  keep the main benchmark roster separate from the generator and reviewer roles.

Frozen recommendation for the first `V4` build:

- `generator_model = codex-5.1-mini`
- `reviewer_model = codex-5.2`

Roster guardrail:

- do not include `codex 5.2` in the headline `V4` benchmark roster
- keep the main scored roster on the original benchmark models rather than the review model

## Why This Split Exists

Without role separation, the benchmark would drift toward:

- self-grading
- same-family style leakage
- synthetic state that is optimized for one model's own writing patterns

With role separation, the benchmark stays closer to the actual product question:

- one session leaves behind Tasklog state
- a later session must resume correctly

## Blind Boundaries

Before fixture freeze:

- `generator` may see the frozen repo snapshot and the frozen generation protocol
- `reviewer` may see the repo snapshot and generator output
- `human_auditor` may see audited fixture drafts only for the selected audit subset
- none of these roles may inspect any `V4` benchmark outputs

Before answer-key freeze:

- `annotator_a`, `annotator_b`, and `adjudicator` may see frozen fixtures
- they may not inspect any `V4` benchmark outputs

After first output visibility:

- `generator`, `reviewer`, `human_auditor`, `annotators`, and `adjudicator` may not rewrite frozen fixture content or gold answers in place
- any such correction starts a later round id

## Required Generation Record

Each fixture must record:

- `generator_model`
- `reviewer_model`
- `human_audit_status`
- `human_audit_notes` or a path to them
- `generation_prompt_version`
- `review_prompt_version`
- whether any human edits were applied before freeze

These fields may live in `fixture-manifest.json` or in a sibling generation manifest, but they must be frozen with the pack.

## Human Audit Rule

Human audit does not need to cover every fixture.

Recommended minimum:

- audit `8 of 32` fixtures if the pack size is `32`
- spread the audited fixtures across families
- ensure at least one audited fixture per high-risk family

At pack-freeze time, the audit sample must not collapse into one or two easy families.
The audited subset should cover both straightforward and ambiguity-heavy families.

The audit should check:

- the handoff state is plausible for the repo snapshot
- no gold-answer leakage appears in notes, logs, or workdocs
- the next-step state is realistic for an interrupted work session
- the work selection ambiguity is intentional rather than accidental noise

Human audit is still pre-run review.
It must complete before fixture freeze for the audited subset and before any benchmark outputs are visible.

## Freeze Order

`V4` should follow the same high-level freeze discipline as `V3`, with the generation pipeline inserted before fixture freeze:

1. freeze round note and claim wording
2. freeze fixture template and scenario-family inventory
3. freeze baseline payload contract
4. freeze provenance contract
5. freeze handoff-generation protocol
6. freeze answer contract, grader contract, and any ontology needed for scoring
7. draft fixtures from repo snapshots
8. reviewer normalizes fixture drafts
9. human audit completes for the selected subset
10. freeze fixture pack
11. dual-annotate answer keys
12. adjudicate and freeze answer keys
13. freeze model roster and runner settings
14. run models

No later step may retroactively modify an earlier frozen artifact.

## Prohibited Shortcuts

Do not allow:

- generator and reviewer to be the same frozen role
- generator output to become gold truth without independent annotation
- benchmark models to see hidden generation metadata during the run
- post-hoc cleanup of fixtures after benchmark results are known
- human audit to continue after benchmark outputs are visible

## Safe Claim Shape

If `V4` follows this protocol, the safe public framing is:

`Tasklog improves session-handoff and work re-entry quality on frozen SWE-derived codebase snapshots under an agent-to-agent handoff workflow.`

This is stronger than a generic workspace-state claim and narrower than a full issue-resolution claim.
