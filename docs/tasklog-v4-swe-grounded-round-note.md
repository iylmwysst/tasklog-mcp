# Tasklog V4 SWE-Grounded Round Note

This note records the decision to start a new `V4` round for Bench A.

`V4` exists because the frozen `V3/V3b` fixture pack does not preserve explicit repo-snapshot provenance inside the claim-bearing artifacts.

## Why `V4` Is Necessary

`V3b` remains useful evidence for a narrow structured work-reentry claim.

It does **not** currently support a stronger SWE-codebase-grounded claim because the frozen `fixtures-v3` pack:

- does not carry repo snapshots under `workspace/repos/`
- does not record per-fixture `repo_snapshots` metadata
- does not expose exact SWE-derived source identifiers in the frozen manifests

That means the safe interpretation of `V3b` is:

- frozen structured work-reentry benchmark
- tasklog-centered workspace-state artifacts
- not a repo-grounded SWE-style fixture pack

## Round Boundary Rule

`V4` is a new round id, not a continuation of `V3b`.

The round boundary is triggered by the artifact-level change itself:

- rebuilding the fixture pack from explicit repo snapshots
- changing the frozen fixture contract to require manifest-visible provenance
- re-freezing the pack, answer keys, roster, and runner for a new round

Do not describe this as a quiet `V3b` rerun.

`V4` should inherit the core round-discipline shape of `V3`:

- frozen artifacts before execution
- explicit role separation
- no post-output mutation of frozen inputs
- new round ids for artifact-level or scorer-level changes after outputs are visible

## What `V4` Must Add

Every `V4` fixture must preserve:

- an actual repo snapshot under `workspace/repos/<repo-id>/`
- a manifest entry that identifies the SWE-derived source
- the upstream commit or equivalent immutable source revision
- the path used inside the fixture workspace
- the seeding path from repo snapshot to Tasklog state and workdocs

The frozen artifact itself must let a reviewer answer:

- what codebase was used
- where it came from
- which revision was frozen
- where it lives inside the fixture

without reopening old tasklog logs or conversational history.

`V4` also treats Tasklog as a handoff substrate rather than as a human-notes-only artifact.
That means the frozen handoff state may be AI-assisted, but the generation and evaluation roles must stay separated.

## Interpretation Rule

Until `V4` exists and completes:

- keep `V3b` as the main structured work-reentry result
- do not retroactively relabel `V3b` as a SWE-codebase-grounded benchmark
- reserve SWE-grounded wording for `V4`

## V3-Aligned Invariants

The following `V3` discipline remains unchanged in `V4`:

- fixture template, scenario-family inventory, and baseline payload contract must still freeze before fixture authoring
- answer keys must still be dual-annotated and adjudicated before runs
- model roster and runner settings must still freeze after fixture and answer-key freeze, not before
- any post-output change to fixtures, answer keys, grader semantics, roster policy, or provenance contract must create a later round id
- run operators may inspect outputs only after all frozen inputs are sealed for the round

## Required Frozen Artifacts

`V4` should preserve a reviewer-readable artifact set comparable to `V3`:

- round note
- fixture template
- scenario-family inventory
- baseline payload contract
- provenance contract
- handoff-generation protocol
- answer contract
- grader contract
- any scoring ontology used for the round
- frozen fixture manifest or pack manifest
- frozen answer-key manifest
- adjudication log
- frozen model roster note
- runner metadata batches

## Immediate Next Step

Build `V4` from the existing SWE-style environment scaffold and freeze a stricter provenance contract before authoring the new fixture pack.
