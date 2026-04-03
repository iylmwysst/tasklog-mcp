# Tasklog V4.1 Go/No-Go Round Note

This note defines the round boundary for the repaired external benchmark round:

- `tasklog_v4_swe_grounded_reentry`
- round `V4.1`

It complements:

- `docs/tasklog-v4-swe-grounded-round-note.md`
- `docs/tasklog-v4-1-answer-contract.md`
- `docs/tasklog-v4-1-grader-contract.md`
- `docs/tasklog-v4-1-runner-metadata-sample.json`

## Purpose

`V4` is now treated as a frozen diagnostic round.
Its first visible external outputs showed that the original headline metric collapsed under a contract that mixed:

- decision correctness
- action-field wording exactness
- empty-field hygiene
- exact evidence-label reporting

`V4.1` exists to answer one narrow question only:

- after separating hygiene from the headline metric and tightening the prompt around empty fields, does a real external signal appear

If the repaired round still produces only marginal or non-publishable separation, stop the line instead of extending the benchmark indefinitely.

## Carry-Forward Rules

`V4.1` intentionally reuses the frozen `V4` source artifacts where possible:

- the same fixture pack rooted at `/Users/Lab/Desktop/TasklogSweLab/fixtures-v4`
- the same frozen answer-key manifest and next-step slot annotations
- the same source-family ontology
- the same three required model slots

The source artifacts remain frozen under round id `V4`.
`V4.1` is a new scoring and execution round layered on top of that frozen source pack.

## Allowed Changes

`V4.1` may change only:

- runner identity and metadata
- answer-contract wording
- prompt instructions
- grader rules
- round-level reporting artifacts

`V4.1` must not silently mutate:

- fixture contents
- provenance metadata
- adjudicated selected work ids or titles
- source ontology labels

## Headline-Metric Repair

`V4.1` keeps `action_valid_success` as the headline metric name, but changes what it means:

- it still requires correct decision core
- it still requires the action-dependent field to be correct
- it no longer folds required-empty-field hygiene into headline success
- it leaves exact evidence-label scoring and exact wording diagnostics in secondary tables

This turns `V4.1` into an explicit go/no-go repair round rather than a silent rewrite of `V4`.

## Validation Discipline

Before any new live roster run:

1. regrade representative `V4` outputs under the `V4.1` contract
2. confirm that the repaired headline metric no longer collapses both arms near zero when decision core is clearly correct
3. freeze the `V4.1` docs and runner metadata

Only then should the required roster run again.
