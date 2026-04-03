# Tasklog V3 Independent Holdout Proposal

This document proposes the next claim-bearing evaluation round after the current V1 and V2 benchmark artifacts.

It is intentionally a `proposal for review`, not a frozen contract.
The goal is to make the next step methodologically coherent before we touch the grader, fixture pack, or paper claim again.

## Why A New Round Is Needed

The current evidence is useful but split across two different roles:

- `V1` is a clean frozen holdout, but it saturates against `Normalized State`
- `V2` shows strong diagnostic separation, but it is adaptive and its headline metric is still too coupled to `primary_evidence_source`

That means the current project can support:

- `strong internal diagnostic evidence`

but not yet:

- `independent Q1-safe empirical evidence`

The next round should therefore avoid two failure modes:

1. do not keep patching V2 after observing outcomes
2. do not claim a stronger result without a new independently frozen pack

## Core Goal

Build one new independent holdout round that tests the narrowest claim we actually care about:

`Does Tasklog improve provenance-sensitive work re-entry decisions over a strong generic normalized-state baseline under a newly frozen benchmark?`

This round should measure decision quality first.
Evidence-source naming, interactive sequencing, and broader external validity should be tracked separately rather than folded into one headline score.

The headline should also reflect `valid action selection`, not only bare work selection.

## What Counts As Success

The next round is successful only if it produces evidence that is stronger in methodology, not just better in score.

Minimum success bar:

- the new fixture pack is authored independently of the current V2 outcomes
- answer keys are frozen before any model run
- the headline metric does not depend on exact `primary_evidence_source` wording
- `Tasklog Re-entry` is compared directly against `Normalized State`
- the result is reproduced across multiple models
- all runner metadata needed for latency, cost, and model identity is preserved

If those conditions are not met, the round may still be useful internally, but it should remain diagnostic rather than claim-bearing.

## Proposed Benchmark Role Split

### Claim-Bearing Round

One new round only:

- `V3 Independent Structured Holdout`

This is the next and only round that should be allowed to upgrade the paper claim.

### Supporting Evidence

These remain supporting-only:

- `V1` five-arm holdout
- `V2` diagnostic lane
- any rerun of V2 under repaired scoring
- any brief-versus-full surface ablation

### Future Follow-On Rounds

These matter, but they should not block the first V3 claim-bearing pass:

- interactive sequencing lane
- broader real-session sampling
- larger external or semi-real fixture corpora

## Main Comparison

The primary comparison should be:

- `Normalized State`
- `Tasklog Re-entry`

Reason:

- V1 already established that weaker baselines are weaker
- the main unresolved scientific question is whether Tasklog adds value beyond a strong generic baseline
- keeping the main round two-arm reduces noise and makes interpretation cleaner

Optional appendix-only reruns may include weaker baselines, but they should not be the core claim table.

## Proposed Task Shape

V3 should stay a `structured decision benchmark`, not an interactive benchmark.

Each fixture should ask the model to decide what to do at re-entry time under ambiguity, conflict, or insufficient evidence.
The structured task is acceptable for the next claim-bearing round because it isolates the main unresolved question:

- can the retrieval surface help the model choose the right work-level action

The round should not claim sequencing superiority.
That belongs to a later interactive lane.

## Scenario Families

The pack should focus on cases where a strong generic summary is plausible but not sufficient.

Recommended families:

- authoritative structured log overrides an older broad note
- active context is stale and should be ignored
- a blocked work should be resumed only with escalation
- evidence is insufficient and the right action is abstention
- evidence is insufficient and the right action is a clarifying question
- a done work has richer noise than the true active work
- two plausible open works require provenance-sensitive tie-breaking
- one work should be resumed, but the next step must stay within its actual state constraints

Rules for family design:

- each family must be specifiable before answer-key writing
- each family must be expressible without mentioning Tasklog-specific vocabulary in the fixture logic
- each family must admit a clear decision rubric
- each family must include an ambiguity rationale and at least one plausible distractor source or distractor work

## Pack Size, Balance, And Aggregation

The claim-bearing pack should not be tiny.

Minimum pack size:

- `24` fixtures total

Minimum family balance:

- at least `8` scenario families
- at least `3` fixtures per family

Recommended target:

- `32` fixtures total if authoring bandwidth allows

Primary aggregation:

- micro-average over all fixtures for the headline metric

Required secondary aggregation:

- macro-average by family
- per-family raw counts

This prevents one overrepresented family from dominating the headline result.

## Authorship And Freeze Discipline

This is the most important process change.

The pack should be authored under an explicit independence protocol, not only a separate drafting pass.

Required role split:

1. `Protocol Owner`
   Owns the benchmark question, family inventory, answer contract, baseline payload contract, grader spec, and adjudication policy.
   This role may know V1 and V2 outcomes.

2. `Fixture Author`
   Receives only the frozen protocol artifacts needed to draft fixtures.
   This role may not inspect model outputs from the V3 round before fixture freeze.

3. `Answer-Key Annotator`
   Writes answer keys from the frozen fixtures using the frozen rubric.
   This role may not inspect model outputs before answer-key freeze.

4. `Grader Implementer`
   Implements the scorer from the frozen contract.
   This role may not change rubric semantics after any model outputs are seen.

5. `Run Operator`
   Executes the benchmark and preserves raw outputs and metadata.

6. `Adjudicator`
   Resolves pre-run annotation disagreements only.
   This role may not revise keys or ontology after model outputs are visible.

Minimum blind boundaries:

- Fixture Author does not see model outputs from the V3 round before fixture freeze.
- Answer-Key Annotator does not see model outputs before answer-key freeze.
- Grader Implementer does not change scorer semantics after first model output is available.
- Any post-run change to fixtures, keys, ontology, grader, or payload contract creates `V3b`, not a silent rerun.

Required reveal order:

1. freeze fixture template
2. freeze scenario-family inventory
3. freeze baseline payload contract
4. freeze answer contract, grader contract, ontology tables, and adjudication guide
5. draft fixtures
6. freeze fixtures
7. annotate answer keys with dual annotation where required
8. resolve disagreements and freeze answer keys
9. freeze model roster and runner settings
10. run models

The pack should be authored under these rules:

1. freeze the fixture template first
2. freeze the scenario-family inventory first
3. assign fixture drafting to a role that does not see V3 model outputs
4. freeze answer keys before any run
5. do not edit fixtures, answer keys, or metrics after seeing model outputs
6. if anything substantive changes, declare a new round instead of silently rerunning

Minimum artifacts to preserve:

- independence protocol
- fixture template version
- authorship note
- freeze timestamp
- answer-key manifest
- adjudication log
- ontology table version
- grader version
- runner version

## Answer Contract

V3 should keep a compact structured answer contract.

Required fields:

- `decision_type`
- `selected_work_id`
- `work_status`
- `next_step_summary`
- `clarifying_question`
- `abstention_reason`
- `escalation_target`
- `primary_evidence_source`

Optional appendix-only field:

- `candidate_work_id`

Notes:

- `primary_evidence_source` should remain in the output because it is scientifically useful
- it should not remain part of the headline decision metric
- `selected_work_title` can remain optional or appendix-only if the work id is already canonical
- `candidate_work_id` is optional and diagnostic-only
- free-form rationale should not be a headline-scored field

Decision-policy semantics should be frozen with the contract:

- `resume_work`
  Use only when one work should be resumed now and no escalation is required.
  `selected_work_id` must be non-empty.
  `candidate_work_id` must be empty.

- `resume_blocked_with_escalation`
  Use only when one work is the right target but a blocking escalation is part of the correct immediate action.
  `selected_work_id` and `escalation_target` must be non-empty.
  `candidate_work_id` must be empty.

- `ask_clarifying_question`
  Use only when one focused question is the correct next action and the model should not yet commit to a work resume.
  `clarifying_question` must be non-empty.
  `selected_work_id` must be empty.
  `candidate_work_id` may be empty, or may contain one provisional leading candidate when the fixture design explicitly allows that state.

- `abstain_insufficient_evidence`
  Use only when the model should not resume any work and should not fabricate a clarifying path as if one decisive question were already known.
  `abstention_reason` must be non-empty.
  `selected_work_id` must be empty.
  `candidate_work_id` must be empty.

This policy tree should be frozen before answer-key writing so `ask_clarifying_question` and `abstain_insufficient_evidence` do not drift between fixtures.

## Next-Step Scoring Policy

`next_step_summary` should not be exact-string scored in the claim-bearing metric.

Default scoring rule:

- frozen templated slot match

Frozen slots:

- `action_verb`
- `primary_target`
- `gating_constraint`

Interpretation:

- `action_verb` captures the immediate work-level action such as implement, update, verify, ask, escalate, or review
- `primary_target` captures the main object of that action such as a file, test, doc, route, contract, or work artifact
- `gating_constraint` captures the condition that must hold or the blocker that governs the action

Scoring rule:

- `next_step_summary` is considered correct when all required slots for that fixture match the frozen key
- fixtures may mark one slot as intentionally empty if that dimension is not applicable
- free-form wording may vary as long as the frozen slot interpretation matches

Fallback rule:

- a small frozen rubric may be used only for pre-declared edge-case families where slot extraction is known to be insufficient
- those families must be declared before fixture drafting
- rubric criteria must be dual-annotated before any run

## Baseline Payload Contract

The primary baseline must be frozen as a concrete payload contract before fixture drafting.

`Normalized State` allowed fields:

- canonical `work_id`
- title
- status
- created_at
- updated_at
- scope_paths
- short work summary
- latest_log_summary
- latest_next_steps
- artifact file basenames
- bounded active-context metadata

`Normalized State` forbidden fields:

- any explicit recommendation such as `recommended_work`
- any field that directly encodes authority resolution
- any field that says which source should win
- any field that collapses multiple candidate works into a final answer
- any Tasklog-specific wording that reproduces the product surface

Serialization policy:

- same field order for every fixture
- same truncation policy for every fixture
- same basename normalization policy for every fixture
- no per-fixture hand-written summaries
- no fixture-specific rationale fields

Generation algorithm:

- `short_work_summary` is copied from the canonical work-level summary field only, then truncated by one frozen character budget
- `latest_log_summary` is copied verbatim from the newest timestamped session log summary for that work, then truncated by one frozen character budget
- `latest_next_steps` is copied verbatim from the newest non-empty `next_steps` field for that work; if none exists, it is empty
- `artifact file basenames` are generated only by basename normalization over the recorded artifact paths
- `bounded active-context metadata` is copied only from the active-context state fields and may not be rewritten into a recommendation
- no normalized field may be synthesized by merging note text, log text, and work summary into a new cross-source sentence
- no source-precedence resolution may be performed during baseline generation beyond selecting the newest row for a single named field

Frozen implementation note:

- the baseline contract must include a reference extraction algorithm or pseudocode, not only field names
- the same algorithm must be used for every fixture and every run

`Tasklog Re-entry` contract must also be frozen:

- exact tool-derived surface used
- whether it is `Brief` or another named surface
- exact field inventory
- exact truncation and ordering rules

If either arm's payload format changes after fixture drafting starts, the round should restart.

## Proposed Metrics

### Primary Headline Metric

`action_valid_success`

This is a hierarchical success rule, not a bare field bundle.

Count a fixture as headline-success only if:

1. the action core is correct:
   - `decision_type`
   - `selected_work_id`
   - `work_status`
2. the action-dependent required field is also correct and non-invalid:
   - `resume_work`: `next_step_summary` under the frozen slot-match rule
   - `resume_blocked_with_escalation`: `next_step_summary` under the frozen slot-match rule and `escalation_target`
   - `ask_clarifying_question`: `clarifying_question`
   - `abstain_insufficient_evidence`: `abstention_reason`
3. fields that should be empty for that action type are empty

Why this should be the headline:

- it captures the action the model would actually take
- it rejects superficially correct work selection with an invalid or unsafe immediate action
- it avoids baking evidence-source ontology into the main score
- it is compact enough to reproduce cleanly

### Secondary Metrics

`decision_action_core_accuracy`

Exact-match over:

- `decision_type`
- `selected_work_id`
- `work_status`

This remains useful as a diagnostic submetric, but not as the only success criterion.

`strict_contract_accuracy`

Exact-match over all required fields only.

Diagnostic-only optional fields such as `candidate_work_id` are excluded from this metric.

`evidence_grounding_accuracy`

Score `primary_evidence_source` separately.

Recommended reporting layers:

- exact source match
- semantically compatible source family
- wrong source

The source-family ontology must be frozen before any run.
No post-hoc compatible-family decisions are allowed.

`next_step_accuracy`

Frozen slot-match by default over:

- `action_verb`
- `primary_target`
- `gating_constraint`

Rubric fallback is allowed only for pre-declared edge-case families.

`abstention_accuracy`

Correct only on fixtures where abstention is the right action.

`clarification_accuracy`

Correct only on fixtures where a clarifying question is the right action.

`escalation_accuracy`

Correct only on fixtures where escalation is required.

### Efficiency Metrics

Keep these from the existing metadata contract:

- context bytes
- estimated tokens
- latency
- cost

These should be reported as a separate table, not fused into the quality metric.

## Evidence-Grounding Ontology And Adjudication

If `evidence_grounding_accuracy` is reported beyond exact match, the ontology must be frozen in advance.

Required artifact:

- `source-family-ontology.json` or equivalent frozen table

Minimum ontology behavior:

- every allowed `primary_evidence_source` maps to exactly one source family
- compatible-family judgments are determined by the frozen mapping, not by post-run interpretation
- if a source phrase is outside the ontology, it is scored as `wrong`, not manually reclassified after the run

If any metric uses rubric scoring:

- dual annotation is required before any run
- disagreements are resolved by the adjudicator before freeze
- the adjudication log is preserved

This especially applies to:

- `next_step_accuracy` if slot- or rubric-based
- `evidence_grounding_accuracy` if family-based
- any future canonicalization layer

## Uncertainty And Statistical Reporting

The round should report uncertainty explicitly.

Required statistics:

- point estimate per arm
- paired difference between `Tasklog Re-entry` and `Normalized State`
- `95%` confidence interval on the paired difference
- per-family breakdowns

Recommended default:

- nested paired bootstrap over repetitions and fixtures within slot

If a significance test is added, it should be declared before runs and treated as secondary to effect size and interval reporting.

Frozen unit-of-analysis rule:

- the primary point estimate for one slot is the mean of the three repetition-level micro-averages
- the primary paired difference for one slot is computed per repetition, then averaged across the three repetitions
- the confidence interval should be estimated with a nested bootstrap that resamples repetitions with replacement and then resamples paired fixtures within each selected repetition
- per-family breakdowns should use fixture-level paired outcomes within each family, reported separately from the overall interval

This keeps fixture variance and run-to-run variance in the same frozen analysis plan.

## Interpretation Rules

The round should support a stronger claim only if all of the following are true:

- `Tasklog Re-entry` beats `Normalized State` on `action_valid_success`
- the gap is not bought by worse hallucination or invalid-action behavior
- the result appears across multiple models, not just one
- the efficiency table remains within the frozen comparability threshold, or else the paper clearly reports a quality-versus-cost tradeoff rather than an unqualified win

The round should not be used to claim:

- interactive sequencing superiority
- general superiority over every possible normalized baseline
- external validity beyond the authored fixture population

## Efficiency Thresholds

Efficiency claims need frozen thresholds.

For the primary comparison, `Tasklog Re-entry` is considered `efficiency-comparable` only if its median per-response usage stays within all of these bounds relative to `Normalized State`:

- context bytes ratio `<= 1.25x`
- estimated input tokens ratio `<= 1.25x`
- latency ratio `<= 1.50x`
- estimated cost ratio `<= 1.25x`

If quality improves but any ratio exceeds that threshold:

- the quality result may still stand
- no unconditional efficiency claim should be made
- the writeup must describe the result as a quality-versus-cost tradeoff

## Model Slots And Fallback Rules

The roster should be frozen by slot, then bound to exact model ids before the run.

Required slots:

- `slot_a_openai_frontier_large`
- `slot_b_openai_frontier_small`
- `slot_c_external_closed_frontier`

Optional slot:

- `slot_d_external_open_or_open_weight`

Fallback policy:

- if a slot cannot be filled with a stable accessible model at freeze time, record the slot as unavailable rather than silently substituting a convenience model after runs begin
- the round may proceed with three frozen slots
- any later slot substitution starts a new round

Freeze rule for model identity:

- prefer exact snapshot id when the provider exposes one
- otherwise freeze the provider-facing model id plus run date
- reasoning setting must be frozen per slot before any run

## Model Roster And Repetition

Minimum run policy for claim-bearing use:

- same prompt and same frozen pack for every arm
- fixed reasoning setting per slot
- `3` full-pack repetitions per slot and per arm
- no change to prompts, payloads, grader, or ontology between repetitions

Required summary rule:

- report mean headline score across the three repetitions
- report min and max headline score across the three repetitions
- preserve raw per-repetition outputs

Directional stability rule:

- a slot should be described as stably favorable only if `Tasklog Re-entry` beats `Normalized State` on the headline metric in at least `2 of 3` repetitions

If exact model ids or reasoning settings drift after the round starts, declare a new round.

## Measurement Procedure

1. approve this concept
2. write the frozen V3 fixture template
3. write the frozen baseline payload contract
4. write the frozen V3 answer contract, grader contract, ontology table, and adjudication guide
5. author the new fixture pack independently of V2 outcomes
6. freeze fixtures
7. dual-annotate answer keys where rubric fields apply
8. freeze answer keys and adjudication log
9. freeze the model roster and runner metadata contract
10. run the two-arm benchmark with three repetitions per slot
11. report quality metrics, uncertainty, and efficiency metrics separately
12. treat any post-run contract change as a new round

## What To Do With V2

V2 should not disappear.
It should be retained as a supporting diagnostic artifact.

Recommended V2 treatment:

- keep the current V2 result in the paper as diagnostic evidence
- if desired, rerun V2 with repaired metrics only as a bridge analysis
- do not use a repaired V2 rerun as the new primary claim

This preserves the value of the current work without pretending it is already the independent proof we still lack.

## Concrete Deliverables

If this proposal is accepted, the next implementation pass should produce:

- `tasklog-v3-independence-protocol.md`
- `tasklog-v3-fixture-template.md`
- `tasklog-v3-baseline-payload-contract.md`
- `tasklog-v3-answer-contract.md`
- `tasklog-v3-grader-contract.md`
- `tasklog-v3-source-family-ontology.json`
- `tasklog-v3-adjudication-guide.md`
- `tasklog-v3-independent-holdout-manifest.json`
- authorship and freeze note
- model roster freeze note

Only after those exist should we change runner code or produce new result tables.

## Review Questions

Before implementation, this concept should be reviewed against these questions:

- is the main claim narrow enough to be defensible
- is `action_valid_success` the right headline rule
- should `selected_work_title` be scored at all
- is the two-arm claim-bearing setup too narrow or appropriately focused
- is the current scenario-family inventory sufficient for provenance-sensitive decisions
- is the abstain-versus-clarifying decision tree sharp enough for consistent keying
- are the efficiency thresholds appropriate
- is the minimum pack size large enough for a first claim-bearing round
- is the three-repetition policy realistic for cost and tooling

If those answers are not stable yet, the right next move is more design review, not more benchmark runs.
