# Tasklog V3 Paper-Readiness Gates

This note freezes the post-run interpretation gates for `V3a`.

It answers one narrow question:

`After V3a finishes, when should the result be treated as paper-ready, and when should it remain internal-only?`

This note does not change any benchmark protocol, scoring rule, or model-roster rule.
It only defines how the frozen `V3a` outputs should be interpreted.

It complements:

- `docs/tasklog-v3-independence-protocol.md`
- `docs/tasklog-v3-grader-contract.md`
- `docs/tasklog-v3-model-roster-freeze-note.md`
- `docs/tasklog-q1-gap-closing-plan.md`
- `docs/tasklog-q1-paper-ready.md`

## Output Classes

`V3a` results should be assigned to exactly one of these classes:

1. `paper_ready_narrow_empirical_claim`
2. `strong_internal_or_pilot_only`
3. `broader_q1_safe_claim_not_yet_supported`

## Class 1: `paper_ready_narrow_empirical_claim`

Use this class only if all of the following are true:

- the round completes under the frozen order in `docs/tasklog-v3-independence-protocol.md`
- fixtures, answer keys, ontology, grader rules, and model roster are all frozen before the first run
- all `3` required model slots are populated or explicitly waived before runs begin
- each populated required slot runs exactly `3` full-pack repetitions per arm
- `Tasklog Re-entry` beats `Normalized State` on `action_valid_success` in at least `2` of the `3` required slots
- in each slot counted above, `Tasklog Re-entry` is `stably favorable`, meaning it wins on `action_valid_success` in at least `2 of 3` repetitions
- at least `2` required slots show a positive paired difference on `action_valid_success` with a `95%` confidence interval that does not cross `0`
- secondary quality metrics support the same direction of result, especially `decision_action_core_accuracy` and `next_step_accuracy`
- no invalid-scoring condition from `docs/tasklog-v3-grader-contract.md` occurs

Efficiency handling for this class:

- if all frozen comparability thresholds are satisfied, the result may be described as both a quality improvement and efficiency-comparable
- if any threshold is exceeded, the result may still stay in this class, but the paper must describe it as a `quality-versus-cost tradeoff`, not an unconditional efficiency win

Safe claim for this class:

`Tasklog Re-entry improves provenance-grounded structured work re-entry decisions over a normalized baseline on a frozen independent holdout.`

## Class 2: `strong_internal_or_pilot_only`

Use this class if `V3a` produces a meaningful positive signal but fails the bar above.

Common reasons include:

- one or more required model slots are missing
- one or more required slots fail the `3`-repetition rule
- `Tasklog Re-entry` wins on `action_valid_success` in only `1 of 3` required slots
- the effect direction is positive but `95%` intervals remain wide or cross `0`
- the headline metric improves but supporting metrics such as `next_step_accuracy` or `decision_action_core_accuracy` do not clearly support the same story
- the result appears highly model-specific
- the round completes but efficiency ratios are poor enough that the main takeaway is cost inflation rather than a usable quality win
- any process limitation forces substantial caveating of the empirical claim

Safe claim for this class:

`This is strong internal diagnostic evidence or pilot-study evidence, not yet a final claim-bearing empirical result.`

## Class 3: `broader_q1_safe_claim_not_yet_supported`

`V3a` alone should stay in this class even if it passes Class 1 cleanly.

Reason:

- `V3a` is a strong independent structured holdout
- but the broader program still lacks the full set of evidence named in `docs/tasklog-q1-gap-closing-plan.md`

Additional evidence still needed for a broader Q1-safe claim:

- robust multi-model evidence beyond one frozen structured round
- an actual interactive lane for sequencing claims
- broader external-validation material beyond the current hand-authored pack
- a paper narrative that clearly separates internal diagnostic evidence from broader held-out evidence

Safe claim for this class:

`V3a may support a narrow paper-ready empirical claim, but it does not by itself justify a broad Q1-safe claim about general interactive re-entry performance.`

## Decision Rule

Apply this order after the final graded artifacts are produced:

1. check protocol completion and invalid-scoring conditions
2. check required slot coverage and repetition coverage
3. check headline wins by slot
4. check directional stability by repetition
5. check `95%` confidence intervals on paired headline differences
6. check whether secondary metrics support the same interpretation
7. check whether efficiency stays within frozen thresholds or must be written as a tradeoff
8. assign exactly one output class for the main writeup

## Recommended Readout

When summarizing `V3a`, report all of the following together:

- assigned output class
- headline metric result
- paired difference and `95%` confidence interval
- per-slot stability summary
- secondary metric summary
- efficiency summary
- allowed claim wording for the assigned class

## Non-Allowed Shortcut

Do not call `V3a` paper-ready merely because one model or one repetition looks strong.

Do not call `V3a` Q1-safe merely because it passes the narrow structured-holdout bar.
