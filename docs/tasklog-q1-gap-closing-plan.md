# Tasklog Q1 Gap-Closing Plan

This document turns the current critique into a concrete plan for moving from:

- `strong internal diagnostic evidence`

to:

- `Q1-safe empirical evidence`

## Goal

Produce a follow-on evaluation that can support a stronger claim than the current draft:

`Tasklog improves provenance-grounded work re-entry under frozen diagnostic benchmarks.`

The target is not simply “higher scores.”
The target is stronger methodology.

## Gap 1: Decision Correctness Is Too Coupled To Evidence-Source Naming

### Problem

The current V2 headline metric includes `primary_evidence_source` as a core field.
That makes ontology alignment part of the headline score.

### Risk

A reviewer can argue that the benchmark is partly rewarding product vocabulary rather than only better decisions.

### Required Fix

Split the current decision-core metric into two reported layers:

- `decision_action_core`
  - `decision_type`
  - `selected_work_id`
  - `work_status`
- `evidence_grounding`
  - `primary_evidence_source`

### Additional Safeguard

Add human-adjudicated or rubric-based scoring for near-miss evidence-source phrasing:

- exact source match
- semantically compatible source family
- wrong source

### Deliverable

- new V2 grader contract
- updated artifact schema
- adjudication guide with examples

## Gap 2: V2 Is Adaptive Rather Than Independent

### Problem

The current V2 lane was authored after observing V1 saturation.

### Risk

A reviewer can argue that the benchmark was tuned to the observed failure mode of the baseline.

### Required Fix

Create a new independent pack:

- separate author or authoring pass
- fixture design rules frozen before writing answer keys
- answer keys frozen before any model run
- no post-hoc editing after seeing results

### Recommended Process

1. freeze the fixture template
2. assign fixture drafting to a different person or isolated pass
3. freeze answer keys
4. only then run models

### Deliverable

- `v3-independent-holdout-manifest`
- authorship and freeze log
- benchmark pre-registration note

## Gap 3: Single-Model Evidence Is Too Narrow

### Problem

Current evidence uses only `gpt-5.4-mini`

### Risk

A reviewer can dismiss the result as model-specific.

### Required Fix

Run at least `3-5` models across the same frozen packs.

Recommended minimum roster:

- one strong OpenAI model
- one smaller OpenAI model
- one Anthropic model
- one Google or open-weight strong coding model if available

### Additional Safeguard

Run repeated trials where possible:

- same prompt
- same fixture
- multiple reruns

### Deliverable

- multi-model result table
- variance / rerun stability appendix

## Gap 4: No True Interactive Evidence Yet

### Problem

The current paper motivation talks about sequencing and legal next actions, but the executed V2 benchmark is still one-shot JSON extraction.

### Risk

A reviewer can call out a mismatch between motivation and measured behavior.

### Required Fix

Build and run an actual interactive lane that measures:

- first action correctness
- whether the agent resumes before reading
- whether it performs illegal or premature reads
- whether it asks for clarification when needed

### Deliverable

- frozen interactive benchmark contract
- runner traces
- interaction-level metrics

## Gap 5: External Validity Is Too Weak

### Problem

The current fixtures are local, hand-authored, and small.

### Risk

A reviewer can accept the internal signal but reject broader generalization.

### Required Fix

Add at least one broader evaluation source:

- sampled real internal task logs
- held-out real operator sessions
- externally inspired tasks mapped into the same benchmark contract

### Deliverable

- sampled corpus description
- sampling protocol
- held-out evaluation split

## Execution Order

### Phase 1: Scoring Repair

- separate `decision_action_core` from `evidence_grounding`
- add adjudication rubric for source-family matching
- rerun current V2 pack without changing fixtures

### Phase 2: Independent Holdout

- freeze a new pack authored independently of the current V2 results
- run the same two-arm comparison first

### Phase 3: Robustness

- add multiple models
- add reruns / repeated trials

### Phase 4: Interactive Validation

- implement the interactive lane for sequencing claims

### Phase 5: Broader External Validation

- add sampled real-world or semi-real benchmark material

## Minimal Acceptance Bar For Q1-Ready Re-Evaluation

The project is meaningfully closer to Q1-safe only if all of the following are true:

- the headline metric no longer depends primarily on evidence-source naming
- at least one independent frozen holdout separates Tasklog from the baseline
- the effect persists across multiple models
- sequencing claims are backed by an actual interactive lane
- the paper clearly distinguishes internal diagnostic results from broader held-out evidence

## Best Interim Paper Position

Until these gaps are closed, the right position is:

`This is a strong diagnostic benchmark and pilot study with clear Q1 potential, not yet a final Q1 empirical result.`
