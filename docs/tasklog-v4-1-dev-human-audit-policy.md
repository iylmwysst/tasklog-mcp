# Tasklog V4.1-dev Human Audit Policy

This note defines the audit policy for the `V4.1-dev` development lane.

It applies to:

- `tasklog_v4_swe_grounded_reentry`
- lane `V4.1-dev`

## Decision

Full human audit is **not** a hard precondition for using `V4.1-dev`.

`V4.1-dev` is a development lane.
It does not need the same audit burden as the claim-bearing holdout pack before work can begin.

## What Is Required

Use a targeted spot-check instead of a full audit gate.

Recommended minimum:

- check `4 of 16` fixtures before relying on the lane for a substantial tuning cycle
- include at least:
  - `1` ambiguity-heavy fixture
  - `1` escalation fixture
  - `1` provenance-tiebreak fixture
  - `1` state-constrained-next-step fixture

## What The Spot-Check Must Verify

- the fixture remains plausible for the listed `source_rel_paths`
- the family description matches the codebase slice
- no gold-answer leakage appears in logs, workdocs, or notes
- the immediate next-step logic is realistic for an interrupted coding session
- the distractor evidence is intentional rather than accidental corruption

## When To Escalate Beyond Spot-Check

Increase audit depth if:

- a new family brief is added
- the authoring prompt changes materially
- multiple fixtures fail spot-check plausibility
- a tuning change starts to exploit obviously synthetic dev-lane artifacts

## Non-Allowed Shortcut

Do not skip all review forever.

Even for a dev lane, if no human or careful manual spot-check ever happens, it becomes too easy to optimize against malformed synthetic artifacts rather than against realistic handoff problems.

## Holdout Boundary

This relaxed audit policy applies only to `V4.1-dev`.

It does **not** weaken the audit expectations for:

- `V4`
- `V4.1`
- any future claim-bearing external round
