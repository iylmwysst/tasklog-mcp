# Tasklog V4 Baseline Fairness Note

This note freezes how `V4` should preserve the core fairness logic of `V3`.

It applies to the two main scored arms:

- `Normalized State`
- `Tasklog Re-entry`

## Core Fairness Principle

`V4` changes the source environment, not the fairness philosophy.

The benchmark should still compare:

- the same frozen underlying work state
- the same frozen repo snapshot
- two different continuity surfaces

It should not compare:

- one arm with richer underlying evidence
- one arm with hidden authority resolution
- one arm with extra repo interpretation that the other arm never receives

## Shared Input Rule

Both scored arms must be grounded in the same fixture-local assets:

- the same repo snapshot under `workspace/repos/`
- the same seeded `.tasklog` state
- the same seeded workdocs
- the same question

The codebase environment is shared.
The continuity surface is what differs.

## `Normalized State` Inheritance From `V3`

`Normalized State` remains the strong generic baseline.

It may:

- compact the frozen state into a stable, generic schema
- surface summaries, latest logs, next steps, and artifact names
- normalize paths and file lists

It may not:

- inject source precedence judgments
- state which work should win
- state which evidence source is authoritative
- collapse ambiguity into a final recommendation
- borrow Tasklog-specific labels or convenience fields that are unavailable in the generic baseline framing

## `Tasklog Re-entry` Inheritance From `V3`

`Tasklog Re-entry` remains the product-shaped continuity arm.

For the first `V4` round, it should stay close to the frozen static-surface discipline used in `V3` unless a separate interactive round is explicitly frozen.

That means:

- keep it as a frozen structured re-entry surface
- do not quietly upgrade it into a more interactive or tool-rich arm than the baseline comparison assumes

## Repo-Snapshot Fairness Rule

Because `V4` is repo-grounded, the existence of the codebase must not itself become an arm-level advantage.

Therefore:

- both arms must be authored from the same repo-grounded fixture
- neither arm may receive hand-written repo summaries that are absent from the other arm
- if any repo-derived metadata is serialized into one arm, the same underlying repo facts must remain accessible in equivalent generic form to the other arm

## Authoring Check For Fairness

Before fixture freeze, the fixture author and reviewer should confirm:

- both arm payloads derive from the same frozen fixture state
- neither arm contains answer leakage
- `Normalized State` has not acquired hidden authority shortcuts
- `Tasklog Re-entry` has not acquired extra information that is not part of the intended product-shaped surface
- repo-specific clues have not been selectively surfaced to only one arm

## Non-Allowed `V4` Shortcut

The following would violate the fairness discipline inherited from `V3`:

- adding repo-inspection conclusions to one arm but only raw state to the other
- adding issue-resolution hints to `Tasklog Re-entry` only
- letting the baseline omit key frozen work evidence that the Tasklog arm still gets
- changing arm payload semantics after fixture authoring has already begun

## Safe Interpretation

If this note is followed, `V4` remains a fair continuation of the `V3` comparison logic:

- same frozen work
- same frozen codebase
- different continuity surface

That is the comparison the paper should defend.
