# 30-Episode Authoring Kickoff

## Decision

The pilot is now strong enough to move into `30`-episode full-study authoring.

This is a `go with targeted revisions`, not a `wait for another pilot round` decision.

Reason:

- the pilot now includes `2` human annotations and `3` auxiliary LLM annotations
- two anchor cases are already stable across all five annotators
- the remaining disagreement is concentrated in specific boundary cases rather than scattered randomly
- the main revision-driving issues in `E-SWE-01` and `E-CON-02` have already been tightened in the canonical codebook and pilot episode wording

---

## What The Pilot Established

Operational enough to carry into the full study:

- `readiness_loss`
- `closure_loss`
- the general four-step annotation procedure
- the use of `boundary_ambiguous` for real boundary cases

Still needs deliberate coverage in the 30-episode set:

- `focus_loss` vs `authority_loss`
- `authority_loss` vs `readiness_loss`
- interruption-class wording where `session_cutoff` and `multi_open_work_conflict` can both look plausible

This means the full study should not wait for perfect unanimity.
It should be authored so the hard boundaries are represented on purpose and not left to chance.

---

## Preconditions Already Satisfied

- pilot packet authored
- pilot packet annotated
- pilot comparison readout updated to `2` humans + `3` LLMs
- revision-driving pilot cases identified
- source authoring protocol exists in `docs/episode-authoring-protocol.md`
- target sampling matrix exists in `docs/30-episode-sampling-matrix.md`

---

## Immediate Authoring Rules For The 30-Episode Study

Use these rules at authoring time:

1. Keep the work item, governing record, action mode, and next-step layer separable in the prose.
2. If a case is meant to test `authority_loss`, do not let blocked-status language silently convert it into `readiness_loss` unless the governing record is already fixed.
3. If a case is meant to test `intent_loss`, state clearly that `act` is already justified and remove stray record-precedence cues.
4. For interruption class, avoid mixed cues unless the episode is intentionally boundary-stressing.
5. Preserve at least a few interpretable hard cases, but do not let avoidable wording noise dominate the sample.

---

## Suggested Build Order

1. Freeze a candidate `30`-episode pool against the current sampling matrix.
2. Mark each candidate as `anchor`, `boundary`, or `stress` during authoring.
3. Author the clean anchor episodes first for each dominant loss class.
4. Author the known boundary pairs second:
   - `focus_loss` vs `authority_loss`
   - `authority_loss` vs `readiness_loss`
   - `readiness_loss` vs `intent_loss`
5. Only after the first authored pool exists, run a leakage and balance review before annotation freeze.

---

## First Concrete Next Step

The next concrete step is to create the initial candidate table for the `30`-episode pool with:

- episode id
- source type
- target interruption class
- target dominant loss class
- boundary status (`anchor` / `boundary` / `stress`)
- source pointer
- authoring status

That table should be treated as the bridge between the sampling matrix and the actual episode drafting pass.
