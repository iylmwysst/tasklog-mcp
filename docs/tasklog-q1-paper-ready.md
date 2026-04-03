# Tasklog Q1 Status Summary

This note freezes the current answer to the meta-question:

`Are we ready to claim a Q1-level empirical result, or are we still at the level of strong internal diagnostic evidence?`

## Short Answer

We are ready to write the paper draft.

We are **not** yet ready to treat the current methodology as Q1-safe empirical evidence.

The right framing today is:

`strong internal diagnostic evidence with clear Q1 potential`

not:

`finished Q1-ready empirical paper`

## What The Current Evidence Supports

### V1 Holdout

- Frozen pack: `10` fixtures
- Arms: `Workspace-Only`, `Notes Replay`, `Raw State`, `Normalized State`, `Tasklog Re-entry`
- Model: `gpt-5.4-mini`
- Metric: `strict`
- Artifact: [holdout-graded.json](/Users/Lab/Desktop/TasklogSweLab/runs/holdout-five-arm-codex-mini/holdout-graded.json)

Results:

| Arm | Strict |
| --- | ---: |
| Workspace-Only | 0/10 |
| Notes Replay | 1/10 |
| Raw State | 3/10 |
| Normalized State | 10/10 |
| Tasklog Re-entry | 10/10 |

Safe reading:

- Tasklog clearly outperforms the weaker baselines.
- V1 does not establish superiority over the strong normalized baseline.

### V2 Diagnostic Lane

- Frozen pack: `10` fixtures
- Arms: `Normalized State`, `Tasklog Re-entry`
- Model: `gpt-5.4-mini`
- Artifact: [v2-smoke-graded.json](/Users/Lab/Desktop/TasklogSweLab/runs/v2-lane-codex-mini-canonical/v2-smoke-graded.json)

Results:

| Arm | Strict | Decision-Core | Canonical Decision-Core |
| --- | ---: | ---: | ---: |
| Normalized State | 0/10 | 0/10 | 0/10 |
| Tasklog Re-entry | 0/10 | 8/10 | 10/10 |

Safe reading:

- Under the current frozen scoring design, Tasklog separates strongly from the normalized baseline on provenance-grounded decisions.
- This is meaningful diagnostic evidence.
- It is not yet a clean broad superiority claim, because the metric still depends on exact `primary_evidence_source` ontology and the lane was authored after V1 saturation.

## Safe Current Claim

The safest current claim is:

`Tasklog improves provenance-grounded re-entry decisions under frozen diagnostic benchmarks, while clearly outperforming weaker continuity baselines on a simpler frozen holdout.`

## Claims To Avoid

- Do not claim that Tasklog universally beats strong normalized baselines.
- Do not claim that V2 is an independent blind holdout.
- Do not claim that V2 proves interactive sequencing superiority.
- Do not treat evidence-source naming as a solved evaluation issue.

## Why This Still Matters

Even under the narrower framing, the project remains strong:

- the problem is real
- the benchmark story is coherent
- the artifacts are frozen and inspectable
- V1 and V2 reveal a meaningful distinction between shallow recovery and provenance-grounded re-entry

This is enough to justify writing now.

## What Still Blocks A Q1-Safe Empirical Claim

- `primary_evidence_source` still affects the headline V2 metric too directly
- V2 is adaptive rather than an independent blind holdout
- only one model and one reasoning setting have been tested
- the fixture packs are still small and hand-authored
- no interactive lane has been run, despite earlier motivation around sequencing

## Next-Step Framing

Use the current draft as:

- a workshop / industry / artifact-centric paper draft now
- or a pilot-study basis for a stronger Q1 follow-on

Do not use it as a final Q1 empirical submission without first closing the methodology gaps.
