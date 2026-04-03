# Validation Pilot Episode Shortlist

## Purpose

This note turns the pilot-pack plan into an initial actionable shortlist.

It does **not** contain final authored episode descriptions yet.
Instead, it identifies the first `5` pilot episodes to write next, along with:

- source type
- source pointer
- intended interruption class
- intended dominant loss class
- ambiguity expectation
- why the episode belongs in the pilot

These entries are the bridge between:

- `docs/validation-pilot-pack.md`
- `docs/episode-authoring-protocol.md`
- the actual authored episodes that annotators will classify

---

## Shortlist Rules

This first shortlist follows the pilot-pack design:

- `5` total episodes
- at least `1` clean authority case
- at least `1` clean readiness case
- at least `2` boundary cases
- at least `1` closure-oriented case
- mixed sources rather than constructed-only

The current shortlist uses:

- `2` constructed episodes
- `1` historical internal episode
- `2` repo-grounded / public-grounded episodes

That is enough to start authoring without pretending the pilot sample is already frozen.

---

## Pilot Episode 1

- `episode_id`: `E-SWE-01`
- `source_type`: `repo_grounded`
- `source_pointer`: `docs/tasklog-v4-1-dev-annotation-family-briefs.md` → `authoritative_log_overrides_note` → `v4-1-dev-001`
- `source_rel_paths`: `swebench/harness/modal_eval/run_evaluation_modal_entrypoint.py`
- `pilot_role`: clean authority case
- `target_interruption_class`: `multi_open_work_conflict`
- `target_dominant_loss_class`: `authority_loss`
- `boundary_expectation`: low

Why this is in the pilot:

- it is the cleanest repo-grounded authority-pattern source we currently have
- it directly tests the paper's central claim that record selection can fail even when relevant state is visible
- it gives the pilot one artifact-rich case that is not purely author-constructed

Authoring note:

- write the episode so that the work is identifiable but the governing record still has to be chosen
- avoid implying that the later structured source is automatically correct without episode-visible justification

---

## Pilot Episode 2

- `episode_id`: `E-SWE-02`
- `source_type`: `repo_grounded`
- `source_pointer`: `docs/tasklog-v4-1-dev-annotation-family-briefs.md` → `blocked_work_requires_escalation` → `v4-1-dev-005`
- `source_rel_paths`: `swebench/harness/modal_eval/run_evaluation_modal.py`
- `pilot_role`: clean readiness case
- `target_interruption_class`: `blocked_waiting`
- `target_dominant_loss_class`: `readiness_loss`
- `boundary_expectation`: low to medium

Why this is in the pilot:

- it tests the most important non-authority distinction in the taxonomy
- it checks whether annotators can separate `readiness_loss` from `intent_loss`
- it keeps one pilot case grounded in a real repo-shaped blocker rather than a synthetic dependency

Authoring note:

- the work and governing record should both be clear
- the key uncertainty should be whether action is valid now, not what the concrete next code edit would be

---

## Pilot Episode 3

- `episode_id`: `E-CON-01`
- `source_type`: `constructed`
- `source_pointer`: recurring pattern from developmental history; aligned with the ambiguous example in `docs/validation-codebook.md`
- `pilot_role`: focus-vs-authority boundary case
- `target_interruption_class`: `multi_open_work_conflict`
- `target_dominant_loss_class`: `authority_loss`
- `nearest_alternative`: `focus_loss`
- `boundary_expectation`: high

Why this is in the pilot:

- this is the earliest and most important dominant-loss ambiguity in the taxonomy
- a clean ambiguous case is needed to test whether annotators can use the tie-break rules rather than defaulting to gut feeling
- it also normalizes that `boundary_ambiguous = yes` is an acceptable output

Authoring note:

- make both work candidates clearly nameable
- force the dispute to be about which signal governs, while still allowing `focus_loss` to remain a defensible rival

---

## Pilot Episode 4

- `episode_id`: `E-CON-02`
- `source_type`: `constructed`
- `source_pointer`: recurring pattern from prototype and manuscript examples around next-step underconstraint after mode is fixed
- `pilot_role`: readiness-vs-intent boundary case
- `target_interruption_class`: `session_cutoff` or `failure_boundary`
- `target_dominant_loss_class`: `intent_loss`
- `nearest_alternative`: `readiness_loss`
- `boundary_expectation`: high

Why this is in the pilot:

- annotators are likely to overuse `intent_loss` unless the codebook is clear about action mode vs action content
- this case tests whether the pilot wording makes `act` clearly valid before asking for the next concrete step
- it gives the pilot one deliberately controlled stress case rather than relying only on noisier repo-grounded episodes

Authoring note:

- the episode must make `act` securely justified
- the only remaining uncertainty should be which concrete next step is admissible

---

## Pilot Episode 5

- `episode_id`: `E-HIS-01`
- `source_type`: `historical_internal`
- `source_pointer`: developmental history pattern behind the manuscript's `over-structured tracker` example
- `pilot_role`: closure or authority/closure interaction case
- `target_interruption_class`: `false_done` or `dirty_done`
- `target_dominant_loss_class`: `closure_loss`
- `nearest_alternative`: `focus_loss` or `authority_loss`, depending on authored wording
- `boundary_expectation`: medium

Why this is in the pilot:

- the pilot needs at least one closure-oriented case before the full study
- tracker-vs-engineering-state drift is realistic and likely to surface real classification disagreement
- it also gives the pilot one author-side historical case that is not benchmark-derived

Authoring note:

- decide early whether this episode is about `false_done` or `dirty_done`
- do not let it become a disguised pure authority case
- if the work remains identifiable and only completion status is unstable, keep `closure_loss` dominant

---

## Authoring Order

The recommended order for drafting the pilot episodes is:

1. `E-SWE-02` — clean readiness case
2. `E-SWE-01` — clean authority case
3. `E-CON-01` — focus vs authority boundary case
4. `E-CON-02` — readiness vs intent boundary case
5. `E-HIS-01` — closure-oriented historical case

Reason:

- start with the two cleanest cases to test whether the protocol and codebook produce unambiguous pilot items
- then move to the two boundary-stress cases
- finish with the closure case, which may need the most wording care

---

## Immediate Next Step

For each shortlist entry, the next concrete step is:

1. write one normalized episode description using `docs/episode-authoring-protocol.md`
2. attach hidden metadata for expected class and source provenance
3. review for label leakage
4. freeze the pilot wording before sending it to annotators

This means the pilot can now move from `planning` to `episode authoring`.
