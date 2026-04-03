# Validation Design for the Interrupted Coding Work Taxonomy

## Purpose

This note defines the validation strategy for the `taxonomy of interrupted coding work` paper track.
It is written to answer one practical question:

> How can we add enough empirical grounding for a research-journal version of the taxonomy without collapsing the paper back into a benchmark-first manuscript?

The short answer is:

- use `V1–V4.1` as **fixture-design and annotation-derived prior**
- do **not** treat those rounds as the full claim-bearing validation layer for the taxonomy
- add one smaller, cleaner, taxonomy-specific validation layer whose object is `classification stability`, not system superiority

---

## Validation Target

The validation target for the taxonomy paper is **not**:

- whether Tasklog beats a baseline
- whether one continuity surface is better than another
- whether one model family is stronger than another

The validation target **is**:

- whether the proposed interruption classes and loss classes can be applied to real or realistic interrupted coding episodes
- whether independent annotators can apply the taxonomy with non-trivial agreement
- where the boundaries are unstable enough to require taxonomy revision

That means the core paper question changes from:

> Does the system win?

to:

> Does the taxonomy classify interrupted coding work coherently enough to survive independent use?

---

## Position on V1–V4.1

The existing benchmark rounds are close enough to the taxonomy work that they should not be ignored.
But they should be used with the right epistemic status.

### What V1–V4.1 Can Legitimately Contribute

`V1–V4.1` can be used as:

- a source of recurring failure patterns discovered during fixture authoring and adjudication that helped surface `authority`, `readiness`, and `next valid action`
- a source of candidate episodes for pilot coding and codebook refinement
- a source of worked examples for annotator training
- a source of boundary cases where class confusion is already likely
- a source of provenance-disciplined SWE-grounded artifacts in `V4/V4.1`
- a source of scenario-family design knowledge, source-pool rules, provenance contracts, and annotation/adjudication discipline

More precisely, the main value of `V1–V4.1` for the taxonomy paper does **not** come from the run outcomes themselves.
It comes from the process that produced the fixtures:

- repeated scenario-family construction
- provenance and source-pool design
- worked-example drafting
- annotation and adjudication pressure
- repeated exposure to boundary cases during fixture building

### What V1–V4.1 Should Not Be Used To Claim

`V1–V4.1` should **not** be presented as the full validation layer for the taxonomy because:

- `V1` and `V2` were developmental/comparative rounds, not taxonomy-validation studies
- `V3/V3b` support a structured re-entry claim, but not a clean SWE-codebase-grounded validation claim
- `V4` and `V4.1` improve provenance visibility, but they were designed around benchmark discipline and system comparison rather than independent taxonomy validation
- `V4.1-dev` is explicitly a development lane and should not be used as claim-bearing evidence

So the right wording is:

> V1–V4.1 informed the taxonomy primarily through fixture design, provenance discipline, and annotation pressure, and can seed its validation design, but they are not by themselves sufficient as the independent validation layer for the taxonomy paper.

---

## Recommended Evidence Model

The cleanest validation model is a **two-layer design**.

### Layer A: Developmental Prior

Use `V1–V4.1` to do the following before the actual study:

- draft the codebook
- select likely ambiguous cases
- define tie-breaking rules
- produce 3-5 training examples for annotators
- anticipate which boundaries are most likely to fail

The key point is that this layer is shaped mainly by fixture construction and annotation experience, not by headline benchmark outcomes.

This layer is allowed to be author-involved and taxonomy-shaping.

### Layer B: Claim-Bearing Validation

Run a smaller, cleaner classification study whose outputs are:

- inter-rater agreement
- disagreement clusters
- class-boundary revisions
- revised inclusion/exclusion rules

This layer should be what the IST-style paper cites as validation.

---

## Recommended Study Shape

### Minimum Viable Validation

If we want a credible first empirical layer without overbuilding the study:

- `30` episodes is the current default target for the first full study
- `2` independent human annotators minimum
- optional `3rd` adjudicator for disagreements
- report:
  - Cohen's `kappa` for interruption class
  - Cohen's `kappa` for dominant loss class
  - qualitative analysis of disagreement hotspots

This is enough to say:

- the taxonomy was tested as a classification scheme
- the class boundaries are partly stable / unstable in known ways
- revisions were driven by observed disagreement rather than only by author intuition

### Two-Tier Annotation Design

The first full study should use a `two-tier` annotation design.

#### Tier 1: Claim-Bearing Human Annotation

This is the primary validation layer for the paper:

- `2` independent human annotators
- optional `3rd` human adjudicator
- human-human agreement reported as the main validation result

This tier is what supports the paper's claim that the taxonomy can be applied independently by people other than the authors.

#### Tier 2: Auxiliary LLM Annotation

In parallel, the study should also run a secondary annotation tier using `2–3` LLM families.

Role of this tier:

- stress-test whether the codebook is machine-usable as well as human-usable
- surface disagreement hotspots quickly
- compare where models collapse boundaries differently from humans
- support qualitative analysis of ambiguity and definition fragility

This tier should be described as `auxiliary`, not as the claim-bearing validation layer.
The main paper claim should still rest on human annotation and adjudication.

### Coverage Rule for the First Full Study

The key design constraint is not only total `N`.
It is whether the sample gives the taxonomy a fair chance to be exercised across its dominant loss classes.

For the first full study, the target should therefore be:

- `30` total episodes as the planning default
- at least `3` episodes per dominant loss class
- no dominant loss class represented by only `1` episode in the final sample

The practical reason is simple:

- a taxonomy with `30` episodes is stronger because it can cover every loss class while still leaving room for ambiguous and mixed cases
- even a `30`-episode study is weak if the sample collapses onto only `authority_loss` and `readiness_loss`

This means the study should be built with a `coverage-first` mindset rather than a raw-`N` mindset.
If a candidate sample reaches `30` episodes but still leaves one dominant loss class thin or absent, the correct move is to keep sampling until the coverage rule is met.

### Default Sampling Plan

The current planning assumption for the first claim-bearing study should be:

- `30` interrupted coding episodes total
- `5` dominant loss classes represented
- at least `3` episodes per dominant loss class
- remaining slots used to:
  - deepen known ambiguous boundaries
  - include at least a few harder mixed or borderline cases
  - preserve source diversity across public, provenance-visible historical, and author-side episodes

This does **not** require a perfectly balanced dataset.
It does require that the paper can honestly say:

> every dominant loss class was tested on more than one episode, and no class is carried entirely by a single hand-picked example.

### Pilot Gate

Before the full study, run a `pilot` on `3–5` episodes.

If the pilot shows:

- low agreement because instructions are unclear
- repeated confusion between `focus_loss` and `authority_loss`
- repeated confusion between `authority_loss` and `intent_loss`

then do **not** start the full study yet.
Refine the codebook first.

This pilot gate is critical because the biggest risk is spending time on annotation before the definitions are stable enough to be used independently.

---

## Episode Sourcing Strategy

The validation set should ideally mix three source types.
For reviewer-facing credibility, the strongest design is a mixed sample rather than a single-source dataset.
That makes it harder to dismiss the study as either entirely cherry-picked, entirely artificial, or entirely benchmark-shaped.

### 1. Public Agent/Codebase Episodes

Examples:

- public SWE-bench-related traces
- OpenHands / OpenDevin style public logs or traces
- public agent task traces where interruption and resumption are visible

Role in study:

- external credibility
- helps avoid "all examples were built by the authors"

### 2. Provenance-Visible Internal Historical Episodes

Examples:

- selected `V4` or `V4.1` holdout artifacts with frozen provenance
- selected historical Tasklog episodes with clear interruption boundary

Role in study:

- high controllability
- good for boundary stress

Restriction:

- `V4.1-dev` should not be treated as final claim-bearing evidence
- if used at all, it should remain in codebook development or pilot materials, not the final headline sample

### 3. Prototype/Operational Episodes

Examples:

- real interrupted sessions from our own prototype history
- logs where resumed action went wrong for authority/readiness reasons

Role in study:

- captures the actual design pressures that produced the taxonomy

Restriction:

- must be clearly marked as author-side data
- should not dominate the final sample

### Recommended Mix

For the first `30`-episode study, the strongest overall mix is:

- about `10` real operational or public-log episodes
- about `10` constructed or author-built episodes
- about `5–10` SWE-bench-derived or repo-grounded episodes

The point of this mix is not numerical symmetry for its own sake.
It is to ensure that the validation sample cannot be dismissed as:

- only real logs, which may look opportunistic and hard to classify consistently
- only constructed cases, which may look author-shaped to fit the taxonomy
- only benchmark-derived cases, which may look like an artifact of one benchmark ontology

### Default Mix for the First 30-Episode Study

If the first full study is run at `30` episodes, the practical default should be:

- `10` real operational or public-log episodes
- `10` constructed episodes
- `10` SWE-bench-derived or otherwise repo-grounded episodes

This is the cleanest first full-study shape because it gives the validation layer balance across source types while still staying within a manageable small-study range for SE taxonomy work.

### Role of the Constructed Subset

The `constructed` subset should not be treated as filler.
It should play a deliberate design role in the first validation study:

- guarantee baseline coverage across the dominant loss classes
- ensure at least `1` constructed episode for each dominant loss class
- provide cleaner worked cases for boundaries that are still too sparse in public or repo-grounded material

In practice, this means the first `5` constructed episodes can be planned as a coverage floor:

- `1` constructed `focus_loss` episode
- `1` constructed `authority_loss` episode
- `1` constructed `readiness_loss` episode
- `1` constructed `intent_loss` episode
- `1` constructed `closure_loss` episode

The remaining constructed slots can then be used for:

- known ambiguous boundaries
- mixed or hybrid cases
- stress cases that are hard to source cleanly from public logs alone

This makes the constructed subset useful without letting the whole study collapse into an artificial-only sample.

### Source-Mix Rule

Whatever the final `N`, the study should avoid letting any one source type dominate the whole sample.
The working rule should be:

- no source type should make up substantially more than half of the final validation set
- every dominant loss class should, where possible, appear in more than one source type

That second condition matters because it helps answer a stronger reviewer question:

> does this class only exist in author-constructed scenarios, or does it recur across real logs, repo-grounded cases, and constructed stress cases?

---

## Codebook Design

The codebook should be built directly from the current paper tables, but with one extra layer of annotation guidance.

### Required Components

- one-page summary of each interruption class
- one-page summary of each dominant loss class
- dominant-assignment rule as a decision flow
- at least `1` worked example per dominant loss class
- explicit tie-breaking notes for likely confusions:
  - `focus_loss` vs `authority_loss`
  - `authority_loss` vs `readiness_loss`
  - `readiness_loss` vs `intent_loss`
  - `false_done` vs `dirty_done`

### Codebook Status of Existing Materials

The current manuscript already supplies:

- Table 1: interruption classes
- Table 2: loss classes
- Figure 1: dominant assignment

What still needs to be added for annotators:

- annotation instructions in imperative form
- tie-breaking notes for ambiguous cases
- 3-5 worked examples outside the main paper prose

Supporting planning artifacts for this layer now exist in:

- `docs/validation-codebook.md`
- `docs/episode-authoring-protocol.md`
- `docs/30-episode-sampling-matrix.md`
- `docs/validation-annotation-form.md`
- `docs/validation-pilot-pack.md`

---

## How to Use Existing Rounds

### V1

Use for:

- early examples of resumptive failure pressure
- understanding what kinds of fixture shapes are too weak or too easy

Do not use for:

- claim-bearing taxonomy validation

### V2

Use for:

- provenance-sensitive cases
- stress cases around abstention, escalation, and stale-context override
- early evidence about which decision families require stronger fixture discipline

Do not use for:

- standalone validation, because the lane was diagnostic and adaptive

### V3 / V3b

Use for:

- structured re-entry patterns
- candidate episodes for training examples
- stronger fixture-shape lessons about adjudication, answer contracts, and structured re-entry decisions

Do not use for:

- SWE-grounded validation claims

### V4

Use for:

- provenance-visible SWE-grounded artifacts
- selecting candidate episodes for final validation sample
- source-pool and provenance-contract discipline for repo-grounded cases

This is the first round that can legitimately support `repo-grounded` validation language.

### V4.1

Use for:

- refined action-validity logic
- selecting clearer cases for readiness and authority analysis
- identifying where fixture prompts and grading logic better expose interruption-boundary mistakes

Restriction:

- use `V4.1` holdout artifacts, not `V4.1-dev`, if the case is meant to appear in claim-bearing validation

### V4.1-dev

Use for:

- codebook drafting
- worked examples
- pilot testing annotator instructions
- quick iteration on fixture families and likely disagreement hotspots

Do not use for:

- final validation counts or headline evidence

---

## Output of the Validation Study

The IST paper should not stop at reporting `kappa`.
The empirical layer should change the taxonomy if the data says it should.

### Best-Case Output

- moderate or strong agreement on most classes
- one or two known boundary weaknesses
- revised definitions that improve clarity

### Acceptable Output

- mixed agreement
- clear evidence that some boundaries are unstable
- transparent revision of definitions or inclusion rules

### Bad Output

- low agreement everywhere
- no principled revision plan
- paper still presenting the taxonomy as already settled

If the output is bad, the honest move is:

- revise the taxonomy first
- rerun a narrower validation
- delay the IST submission

---

## What This Means for Publication Strategy

### IEEE Software / Viewpoint Version

For the shorter viewpoint paper:

- no validation study required
- examples remain illustrative
- V1–V4.1 appear only as developmental background from fixture-building and failure-analysis experience, not as claim-bearing evidence

### IST Version

For the validation paper:

- V1–V4.1 are inputs to design and sampling
- the claim-bearing layer is the structured classification study
- the paper's novelty comes from `validated and revised taxonomy`, not from the original proposal alone

---

## Recommended Next Steps

1. Freeze a `validation codebook draft` derived from Table 1, Table 2, and Figure 1.
2. Build a candidate episode pool from:
   - public traces
   - `V4/V4.1` claim-bearing artifacts
   - selected author-side operational episodes
3. Run a `3–5` episode pilot.
4. Refine boundary rules before full annotation.
5. Run the `30`-episode classification study unless the pilot shows the codebook still needs revision.
6. Let the findings revise the taxonomy before the IST draft is frozen.

---

## Working Position

The working position of this project should be:

> We are not throwing away V1–V4.1. We are treating them as the developmental and provenance-visible substrate from which a cleaner taxonomy-validation layer can now be built.

That position preserves the value of the existing benchmark program without forcing the taxonomy paper to inherit every weakness of the earlier benchmark-first framing.

An even sharper restatement is:

> For the taxonomy paper, the main thing we inherit from V1–V4.1 is not benchmark performance. It is the fixture-building process: the scenario families, provenance rules, annotation pressure, and recurring boundary failures that made the taxonomy necessary in the first place.
