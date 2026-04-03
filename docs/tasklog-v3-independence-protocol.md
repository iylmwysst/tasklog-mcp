# Tasklog V3 Independence Protocol

This document freezes the independence protocol for the claim-bearing `V3` round.

It complements:

- `docs/tasklog-v3-independent-holdout-proposal.md`
- `docs/tasklog-v3-baseline-payload-contract.md`
- `docs/tasklog-v3-answer-contract.md`
- `docs/tasklog-v3-grader-contract.md`
- `docs/tasklog-v3-adjudication-guide.md`

## Scope

This protocol applies only to:

- `tasklog_v3_independent_structured_holdout`

It exists to prevent `V3` from drifting back into an adaptive benchmark.

## Round Identity

The first freeze-ready round under this protocol is:

- `V3a`

Any post-run change to fixtures, answer keys, payload contracts, ontology, grader semantics, or roster policy creates a new round such as:

- `V3b`

## Roles

### Protocol Owner

Owns:

- benchmark question
- scenario-family inventory
- independence protocol
- baseline payload contract
- answer contract
- grader contract
- source-family ontology
- adjudication guide

This role may know V1 and V2 outcomes.
This role may not rewrite frozen artifacts after V3 outputs are visible.

### Fixture Author

Owns:

- drafting fixture instances from the frozen family inventory and fixture template

This role receives only the frozen protocol artifacts needed to draft fixtures.
This role may not inspect any V3 model outputs before fixture freeze.

### Answer-Key Annotator

Owns:

- writing expected answers from frozen fixtures
- filling slot-level next-step keys
- marking whether `candidate_work_id` is allowed for a clarifying fixture

This role may not inspect any V3 model outputs before answer-key freeze.

### Grader Implementer

Owns:

- implementing the frozen scorer
- implementing the frozen ontology lookup
- implementing the frozen nested-bootstrap analysis

This role may not change scoring semantics after the first V3 model output is visible.

### Run Operator

Owns:

- executing the benchmark
- preserving raw outputs
- preserving runner metadata
- packaging repetition-level result artifacts

This role may not alter frozen inputs once runs begin.

### Adjudicator

Owns:

- resolving pre-run annotation disagreements
- signing off on rubric-backed edge cases

This role may not revise keys, ontology, or rubric policy after model outputs are visible.

## Blind Boundaries

The following boundaries are mandatory:

- Fixture Author must not inspect V3 model outputs before fixture freeze.
- Answer-Key Annotator must not inspect V3 model outputs before answer-key freeze.
- Grader Implementer must not change scorer semantics after first output visibility.
- Adjudicator must resolve disagreements before any model output is reviewed.
- Run Operator may inspect outputs only after all frozen inputs are versioned and sealed for the round.

## Freeze Order

The required freeze order is:

1. freeze fixture template
2. freeze scenario-family inventory
3. freeze baseline payload contract
4. freeze answer contract
5. freeze grader contract
6. freeze source-family ontology
7. freeze adjudication guide
8. draft fixtures
9. freeze fixtures
10. dual-annotate answer keys where required
11. resolve disagreements and freeze answer keys
12. freeze model roster and runner settings
13. run models

No later step may retroactively modify an earlier frozen artifact.

## Required Artifacts

The round must preserve all of the following:

- independence protocol path and version
- fixture template path and version
- scenario-family inventory path and version
- baseline payload contract path and version
- answer contract path and version
- grader contract path and version
- source-family ontology path and version
- adjudication guide path and version
- frozen fixture manifest
- frozen answer-key manifest
- adjudication log
- frozen model roster note
- runner metadata batches

## Prohibited Actions

The following are not allowed inside `V3a`:

- editing fixtures after seeing outputs
- editing answer keys after seeing outputs
- changing allowed baseline fields after seeing outputs
- changing slot semantics for `next_step_summary` after seeing outputs
- adding new compatible source-family mappings after seeing outputs
- silently swapping model ids or reasoning settings mid-round

If any of these occur, the run must be renamed as a new round.

## Reveal Rules

Before fixture freeze, the Fixture Author may see:

- frozen protocol artifacts
- authored scenario families
- fixture template

Before answer-key freeze, the Answer-Key Annotator may see:

- frozen fixtures
- frozen answer contract
- frozen ontology
- frozen adjudication guide

After answer-key freeze, the Run Operator may see:

- frozen fixtures
- frozen answer keys
- frozen scorer
- frozen roster

## Change Control

Allowed pre-run changes:

- typo fixes that do not alter meaning
- formatting changes that do not alter serialization or policy

Disallowed pre-run changes without new version labels:

- field additions or removals
- ontology label changes
- slot schema changes
- answer-policy changes
- repetition-policy changes
- efficiency-threshold changes

## Sign-Off Rule

`V3a` is considered valid for claim-bearing use only if:

- all required artifacts exist
- freeze order was followed
- no prohibited action occurred
- the adjudication log is preserved
- runner metadata shows the frozen roster and settings actually used
