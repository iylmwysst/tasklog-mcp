# Tasklog V4.1 Development Lane Note

This note defines a source-disjoint development lane that follows the same answer and grading protocol as `V4.1`.

It applies to:

- `tasklog_v4_swe_grounded_reentry`
- lane `V4.1-dev`

It complements:

- `docs/tasklog-v4-1-answer-contract.md`
- `docs/tasklog-v4-1-grader-contract.md`
- `docs/tasklog-v4-1-dev-source-pool-manifest.json`
- `docs/tasklog-v4-1-dev-family-allocation-table.json`
- `docs/tasklog-v4-1-dev-annotation-family-briefs.md`

## Purpose

`V4.1-dev` exists for system and prompt development only.
It uses the same action contract, scorer boundary, and reporting philosophy as `V4.1`, but it must remain source-disjoint from the frozen `V4` holdout pack.

## Disjointness Rule

The development lane is built only from the `16` reserve candidates left unused by the frozen `V4` family-allocation table.

That means:

- no `V4.1-dev` fixture may reuse a `source_instance_id` from the frozen `V4` holdout allocation
- no tune or system change justified by `V4.1-dev` may cite holdout-only fixtures as evidence

## Pack Shape

`V4.1-dev` keeps the same family inventory as `V4/V4.1`, but at a smaller development shape:

- `16` fixtures
- `8` families
- `2` fixtures per family

This is large enough to exercise every decision family while still staying bounded enough for frequent iteration.

## Protocol Carry-Forward

`V4.1-dev` reuses:

- the `V4.1` answer contract
- the `V4.1` grader contract
- the same source-family ontology
- the same arm comparison shape

It changes only:

- the source pool
- the fixture allocation
- the lane identifier

## Usage Rule

Use `V4.1-dev` to improve the system.
Use `V4/V4.1` holdout artifacts to evaluate whether those improvements generalize.

If a change was explicitly tuned against `V4.1-dev`, do not present `V4.1-dev` as claim-bearing evidence in the main writeup.

## Annotation Grounding Rule

When `annotator_a` and `annotator_b` work on this lane, family descriptions must stay grounded in the selected codebase slice.
The family brief for each fixture should therefore name:

- the selected `source_instance_id`
- the relevant `source_rel_paths`
- the source area inside the vendored repo
- the allowed family-level ambiguity and anti-drift rule

That brief lives in:

- `docs/tasklog-v4-1-dev-annotation-family-briefs.md`
