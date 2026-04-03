# Validation Pilot Provenance Ledger

## Purpose

This document records where each pilot episode description came from and how it was transformed into annotator-facing form.

This is a `research-side and reviewer-side` artifact.
It should not be included in the annotator packet because it contains:

- source pointers
- expected labels
- authoring rationale

Its job is to answer a predictable reviewer question:

> Where did these episode descriptions come from?

The answer in this study is:

> each episode was authored from a documented source type using the episode-authoring protocol; annotators saw only the normalized episode description, while provenance, expected labels, and transformation notes were kept here.

---

## Ledger Fields

Each entry records:

- `episode_id`
- `source_type`
- `source_pointer`
- `source_provenance`
- `authoring_basis`
- `preserved structural features`
- `abstractions introduced`
- `expected interruption class`
- `expected dominant loss class`
- `why this source was chosen`

---

## E-SWE-01

- `episode_id`: `E-SWE-01`
- `source_type`: `repo_grounded`
- `source_pointer`: `docs/tasklog-v4-1-dev-annotation-family-briefs.md` → `authoritative_log_overrides_note` → `v4-1-dev-001`
- `source_provenance`: `princeton-nlp/SWE-bench` snapshot, commit `f7bbbb2ccdf479001d6467c9e34af59e44a840f9`, path `swebench/harness/modal_eval/run_evaluation_modal_entrypoint.py`
- `authoring_basis`: repo-grounded authority pattern in which a richer local continuation trail conflicts with a later stronger governing record
- `preserved structural features`:
  - one active-looking local work trail remains visible
  - a later structured record supersedes or blocks that trail
  - the resumed decision depends on record precedence rather than memory absence
- `abstractions introduced`:
  - code-level specifics were compressed into a normalized work-state scenario
  - no claim is made that the source file itself documents a verbatim interrupted episode
- `expected interruption class`: `multi_open_work_conflict`
- `expected dominant loss class`: `authority_loss`
- `nearest alternative`: `focus_loss`
- `why this source was chosen`: it is the cleanest artifact-rich authority case in the current repo-grounded pool and directly supports the paper's core source-precedence claim

---

## E-SWE-02

- `episode_id`: `E-SWE-02`
- `source_type`: `repo_grounded`
- `source_pointer`: `docs/tasklog-v4-1-dev-annotation-family-briefs.md` → `blocked_work_requires_escalation` → `v4-1-dev-005`
- `source_provenance`: `princeton-nlp/SWE-bench` snapshot, commit `f7bbbb2ccdf479001d6467c9e34af59e44a840f9`, path `swebench/harness/modal_eval/run_evaluation_modal.py`
- `authoring_basis`: repo-grounded blocker/escalation pattern in which the work and trusted state are clear but the valid present mode is non-action
- `preserved structural features`:
  - current work remains identifiable
  - a real blocker is visible in the work state
  - the pressure error is to continue acting under a blocked condition
- `abstractions introduced`:
  - the blocker is rendered generically as approval, ownership, or dependency rather than as a source-code-specific implementation detail
  - the episode is authored as a resumptive decision case rather than as a benchmark fixture
- `expected interruption class`: `blocked_waiting`
- `expected dominant loss class`: `readiness_loss`
- `why this source was chosen`: it is the cleanest available readiness case and helps test the most important non-authority boundary in the taxonomy

---

## E-CON-01

- `episode_id`: `E-CON-01`
- `source_type`: `constructed`
- `source_pointer`: recurring focus-versus-authority ambiguity observed during prototype development
- `source_provenance`: author-constructed from repeated ambiguity patterns observed during prototype development and taxonomy drafting
- `authoring_basis`: focus-versus-authority ambiguity where two work candidates remain visible and the resumed decision turns on signal precedence rather than pure work discovery
- `preserved structural features`:
  - two work candidates remain visible
  - both candidates are nameable
  - the tie-break depends on competing visible signals
- `abstractions introduced`:
  - branch names, PR metadata, and tracker references are normalized
  - no single historical log is claimed as the unique source
  - the wording was kept separate from the worked example phrasing later used in the codebook
- `expected interruption class`: `multi_open_work_conflict`
- `expected dominant loss class`: `authority_loss`
- `nearest alternative`: `focus_loss`
- `why this source was chosen`: the pilot needs one deliberately authored ambiguous case to test whether annotators use the tie-break rules rather than defaulting to the easiest class

---

## E-CON-02

- `episode_id`: `E-CON-02`
- `source_type`: `constructed`
- `source_pointer`: recurring pattern from prototype and manuscript examples around next-step underconstraint after acting mode is already fixed
- `source_provenance`: author-constructed from repeated intent-versus-readiness distinctions encountered during taxonomy writing and example refinement
- `authoring_basis`: act is already justified, but the next concrete edit remains underdetermined
- `preserved structural features`:
  - current work is stable
  - no newer record blocks or supersedes the work
  - the unresolved object is concrete next-step content, not action permissibility
- `abstractions introduced`:
  - specific files and command traces are omitted to avoid overfitting to one prototype trace
  - the scenario is normalized to isolate the intent boundary cleanly
- `expected interruption class`: `session_cutoff`
- `expected dominant loss class`: `intent_loss`
- `nearest alternative`: `readiness_loss`
- `why this source was chosen`: the pilot needs one controlled case that makes `intent_loss` usable without relying on noisier real-world traces

---

## E-HIS-01

- `episode_id`: `E-HIS-01`
- `source_type`: `historical_internal`
- `source_pointer`: historical pattern behind the manuscript's tracker-versus-engineering-state examples, especially the closure-oriented variant discussed during taxonomy drafting
- `source_provenance`: internal prototype-side developmental history involving completion markers that conflicted with later still-governing follow-up obligations
- `authoring_basis`: closure-looking work state that does not settle the resumptive boundary cleanly because a remaining obligation still governs action
- `preserved structural features`:
  - a real completion-looking signal is present
  - a later still-governing follow-up obligation remains visible
  - the resumed decision hinges on whether the work is actually closed
- `abstractions introduced`:
  - tracker names, internal note formats, and project-specific identifiers are generalized
  - the episode is written as a normalized closure case rather than as a raw prototype log extract
- `expected interruption class`: `dirty_done`
- `expected dominant loss class`: `closure_loss`
- `nearest alternative`: `authority_loss`
- `why this source was chosen`: the pilot needs one non-benchmark closure case, and the developmental history already contains repeated tracker/closure conflicts sharp enough to serve this role

---

## Working Position

The pilot episodes are therefore not ungrounded hypotheticals and not raw log excerpts either.

They are:

> authored interrupted-work episodes with explicit provenance, controlled abstraction, and hidden expected labels.

That is the intended study design.
