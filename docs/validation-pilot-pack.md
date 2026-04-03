# Validation Pilot Pack Plan

## Purpose

This note defines how to assemble the first `pilot pack` for the interrupted coding work taxonomy study.

The goal of the pilot is **not** to validate the full taxonomy statistically.
The goal is to test whether:

- episode descriptions are written clearly enough
- the codebook is usable independently
- the dominant-loss boundaries are operational enough to survive first contact with annotators

---

## Pilot Size

The pilot pack should contain `3–5` episodes.

Default recommendation:

- build `5` episodes if authoring bandwidth allows
- drop to `3` only if source preparation is still incomplete

Five is better because it lets the pilot touch more than one difficult boundary pair without becoming a mini full study.

---

## Pilot Objectives

The pilot pack should answer four questions:

1. Do annotators understand the `episode format` without raw logs?
2. Do annotators use the `dominant-assignment rule` in the intended order?
3. Are the hardest boundary pairs still too unstable?
4. Is ambiguity coming from the `taxonomy` or from the `episode wording`?

---

## Required Coverage in the Pilot

The pilot should not try to cover all five dominant loss classes equally.
It should instead cover:

- at least `1` clean case
- at least `2` likely boundary-confusion cases
- at least `1` case grounded in something other than a purely constructed source

The pilot is a stress test, not a miniature balanced sample.

---

## Recommended Pilot Mix

The strongest default `5`-episode pilot pack is:

- `2` constructed episodes
- `1` historical internal episode
- `1` public-grounded episode
- `1` SWE-bench-derived or repo-grounded episode

This mix is good enough to test:

- whether the authoring protocol works across source types
- whether annotators react differently to cleaner versus noisier episodes
- whether public-grounded or repo-grounded cases need stronger normalization

If only `3` episodes are feasible, use:

- `1` constructed
- `1` historical or public-grounded
- `1` SWE-bench-derived or repo-grounded

---

## Recommended Boundary Targets

The first pilot should prioritize the boundary pairs most likely to break:

- `focus_loss` vs `authority_loss`
- `authority_loss` vs `readiness_loss`
- `readiness_loss` vs `intent_loss`

The pilot may also include one closure case if a good episode already exists, but closure does not need to dominate the first pack.

---

## Default 5-Episode Pilot Shape

The following is the recommended first-pass structure:

### Episode 1: Clean Authority Case

- Source: `constructed` or `repo-grounded`
- Interruption pressure: competing visible records for a known work
- Expected dominant loss: `authority_loss`
- Purpose: ensure the codebook can recognize the paper's central class in a non-ambiguous case

### Episode 2: Clean Readiness Case

- Source: `historical` or `constructed`
- Interruption pressure: work and record are clear, but valid mode is wait/ask/escalate rather than act
- Expected dominant loss: `readiness_loss`
- Purpose: test whether annotators separate mode uncertainty from action-content uncertainty

### Episode 3: Boundary Case Between Focus and Authority

- Source: `constructed`
- Interruption pressure: multiple visible works and competing signals
- Expected dominant loss: `authority_loss` or `focus_loss`, with ambiguity expected
- Purpose: test the most important early boundary in the taxonomy

### Episode 4: Boundary Case Between Readiness and Intent

- Source: `public-grounded` or `repo-grounded`
- Interruption pressure: unclear whether the agent should act at all, versus only uncertainty about the next concrete step
- Expected dominant loss: `readiness_loss` or `intent_loss`
- Purpose: test whether annotators overuse `intent_loss`

### Episode 5: Optional Closure or Tracker Case

- Source: `historical`, `public-grounded`, or `repo-grounded`
- Interruption pressure: false or dirty done signal
- Expected dominant loss: `closure_loss` or, in some cases, a focus/closure interaction
- Purpose: test whether closure language is operational enough before the full study

---

## What Goes Into the Pilot Pack

The pilot pack delivered to annotators should include:

- `3–5` episode descriptions
- the current `validation codebook`
- the `validation annotation form`
- brief instructions on submission timing and independence

The current drafting shortlist for those episodes is tracked in:

- `docs/validation-pilot-episode-shortlist.md`

The current authored annotator-facing episode packet is:

- `docs/validation-pilot-episodes.md`

The corresponding research-side provenance ledger is:

- `docs/validation-pilot-provenance-ledger.md`

It should **not** include:

- raw logs
- provenance metadata
- intended labels
- author commentary about which cases are expected to be ambiguous

---

## Review Process After the Pilot

After the pilot, review should happen in this order:

1. check whether annotators completed the form consistently
2. identify agreement and disagreement per episode
3. separate `wording problems` from `taxonomy-boundary problems`
4. revise episode authoring rules if wording caused confusion
5. revise the codebook if stable disagreement reveals weak definitions
6. only then freeze the first full 30-episode pool

---

## Pilot Success Conditions

The pilot is successful if it shows:

- annotators can use the form without ad hoc interpretation
- episode descriptions are understandable without raw logs
- disagreements are interpretable rather than random
- boundary confusion points to real taxonomy refinement work

The pilot is not required to show strong agreement everywhere.
It is allowed to reveal that some boundaries still need tightening.

---

## Working Position

The pilot pack should be treated as a `usability and boundary-stability check` for the validation workflow.

Its job is:

> make sure the codebook, episode-authoring protocol, and annotation form work together before the full 30-episode study is frozen.
