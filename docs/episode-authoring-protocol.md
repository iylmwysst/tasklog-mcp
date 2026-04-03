# Episode Authoring Protocol for Taxonomy Validation

## Purpose

This note defines how the research team should author `episode descriptions` for the interrupted coding work taxonomy study.

The study object is **not** a raw log, raw benchmark trace, or full session transcript.
The study object is a normalized `episode description` derived from one of three source types:

- `constructed` from recurring patterns already observed in prototype development
- `historical` from existing internal logs or benchmark artifacts
- `public-grounded` from public traces, public logs, or repo-grounded cases such as SWE-bench-derived materials

Annotators classify the `episode description`, not the raw source.

---

## Core Principle

The authoring task is:

> convert heterogeneous source evidence into a standardized, non-leading, taxonomy-ready episode description that preserves the interruption boundary and the resumptive decision problem without leaking the intended class labels.

That means episode authoring is a research method, not just documentation.

---

## Source Types

### 1. Constructed

Use when:

- the pattern is already well established from prototype or fixture-building experience
- a loss class needs coverage and public or historical material is still sparse
- a boundary case or hybrid case is needed deliberately

Constructed episodes are allowed.
They should be used intentionally, not defensively.
In the first full study they also serve as a `coverage floor`, especially to guarantee at least one episode per dominant loss class.

### 2. Historical Internal

Use when:

- there is an existing session log, benchmark artifact, or prototype trace with a visible interruption boundary
- the provenance is frozen or reconstructable well enough for internal audit

These episodes should be normalized for annotators, but the research team should retain a hidden provenance note linking the episode description back to its source material.

### 3. Public-Grounded

Use when:

- a public trace, public issue/log, or repo-grounded artifact exposes a structural pattern relevant to interrupted coding work
- the team wants external credibility without pretending the source is already a ready-made validation case

Public-grounded episodes may be lightly abstracted, but should remain structurally faithful to the source pattern that motivated them.

---

## Authoring Pipeline

Each episode should be created through the same five-step process.

### Step 1: Identify the Source Moment

The episode must center on a real `resumption boundary`, not on a whole task history.

Good source moments include:

- session cutoff or overnight return
- conflicting records after status drift
- blocked work requiring ask/wait/escalate judgment
- resumed work after a misleading done signal
- requirement or reviewer change that invalidates the next step

The author should isolate the moment where resumed action becomes non-trivial.

### Step 2: Extract the Minimal Structural Facts

Before writing prose, the author should extract only the facts needed to define the resumptive problem:

- what work appears to be active
- what competing records are visible
- what changed during the interruption
- what action pressure exists at resume time
- what makes the next step uncertain or invalid

Do **not** carry over irrelevant narrative detail just because it appears in the source.

### Step 3: Normalize Into Episode Form

Write the episode as a short standalone scenario using a common structure:

- `Setting`: what task or work item appears active
- `Interruption boundary`: what event or pause created the resume point
- `Visible records`: what records or cues are available at resume time
- `Decision pressure`: what the agent appears ready or tempted to do next
- `Complication`: what makes that resumed move potentially invalid

The episode should be long enough to classify, but short enough that annotators are classifying the resumptive structure rather than free-form narrative noise.

### Step 4: Remove Label Leakage

Before an episode is frozen for annotation, the author should strip wording that gives away the intended answer.

Remove or avoid:

- the taxonomy labels themselves
- wording like `the wrong record`, `the authoritative source`, `the real task`, `the correct next action`
- explicit editorial guidance like `this later turns out to be blocked`
- phrasing that makes one class obviously privileged

The episode may describe ambiguity.
It should not describe the taxonomy's resolution of that ambiguity.

### Step 5: Attach Hidden Research Metadata

Each episode should keep a hidden research-side metadata record that annotators do not see.

The metadata should include:

- `episode_id`
- `source_type` (`constructed`, `historical`, `public_grounded`)
- provenance note or source pointer
- expected interruption class
- expected dominant loss class
- known ambiguity notes
- author name and revision date

This metadata is for sampling, audit, adjudication, and later disagreement analysis.
It should not be exposed in the annotator packet.

---

## What Annotators See

Annotators should receive:

- the episode description
- the codebook
- the classification form

Annotators should **not** receive:

- the raw source log
- benchmark results
- provenance notes
- the intended labels
- author commentary about why the episode was selected

The study should test whether the taxonomy can be applied from the normalized scenario alone.

The target length for a standard episode description should be roughly `100–200` words, excluding the hidden research metadata.
Shorter than that often under-specifies the resumptive problem.
Much longer than that makes classification depend too heavily on narrative noise and writing style.

---

## Episode ID and Versioning

Every episode should use a stable source-aware identifier.

Recommended ID prefixes:

- `E-CON-XX` for constructed episodes
- `E-HIS-XX` for historical internal episodes
- `E-PUB-XX` for public-grounded episodes
- `E-SWE-XX` for SWE-bench-derived or repo-grounded episodes when that distinction matters analytically

If an episode is revised after pilot review or adjudication feedback, retain the base episode ID and append a revision suffix:

- `E-CON-03v2`
- `E-PUB-07v3`

Do not silently overwrite meaning-changing revisions.
If the episode changes enough that it is no longer materially the same scenario, retire the original ID and create a new one instead.

---

## Episode Template

Each episode should be authored in a consistent format such as:

```md
### Episode ID

Setting:
[2-4 sentences]

Interruption boundary:
[1-2 sentences]

Visible records at resume time:
- ...
- ...
- ...

What happened before or during the interrupted attempt:
[1-3 sentences, or `N/A` for purely constructed minimal cases]

Decision pressure:
[1-2 sentences]

Complication:
[1-3 sentences]
```

This exact wording can be tuned later, but the structure should remain stable across source types.

---

## Quality Rules

An episode is ready for annotation only if it satisfies all of the following:

- it contains a clear interruption or resume boundary
- it contains enough information to classify both interruption class and dominant loss class
- it does not explicitly name the intended class
- it is not so long that annotators are forced to infer from irrelevant detail
- it is not so short that the resumptive pressure becomes underdetermined
- it is roughly within the target authoring range unless there is a clear reason to exceed it
- it can be traced back to a source note or source rationale on the research side

---

## Special Rules by Source Type

### Constructed Episodes

Constructed episodes must still be anchored in repeated observed patterns.
They should not be invented only to make the taxonomy look clean.

For every constructed episode, the research note should record:

- what recurring pattern motivated it
- why an existing public or historical source was not sufficient
- whether the episode is intended as a coverage case, a boundary case, or a hybrid case

### Historical Episodes

Historical episodes may compress or rename irrelevant details for anonymity or clarity, but should not alter the underlying resumptive structure.

If the source was noisy, the author may simplify presentation.
The simplification should preserve the actual structure of the interruption and resumed decision pressure.

### Public-Grounded Episodes

Public-grounded episodes must not pretend to be verbatim documented interrupted episodes unless they truly are.

Allowed:

- `inspired by structural patterns visible in a public agent-facing codebase`
- `lightly abstracted from a public trace or repo-grounded artifact`

Not allowed:

- presenting a file path alone as if it were already an interrupted episode
- implying that a public source explicitly documents a resumptive failure when it does not

---

## Bias Control Rules

Because the authors are also the taxonomy designers, bias control matters.

The authoring protocol should therefore enforce the following:

- do not let the same author both draft and finalize every episode without review
- flag episodes whose intended class feels too obvious
- include some known ambiguous or borderline cases deliberately
- include at least a few episodes where early internal guesses about the dominant class later prove unstable

The aim is not to eliminate author influence completely.
It is to keep the episode set from collapsing into a pure demonstration pack.

---

## Pilot Use

Before the full 30-episode study, apply this protocol to `3–5` pilot episodes.

The pilot should test:

- whether episode descriptions are understandable without raw logs
- whether wording is unintentionally leading
- whether disagreement comes from taxonomy boundaries or from poor episode writing

If the pilot reveals wording problems, revise the protocol before scaling up.

---

## Working Position

The validation study should be understood this way:

> authors transform heterogeneous source material into standardized interrupted-work episodes; annotators then classify those episodes independently using the taxonomy.

This means the study is neither raw-log coding nor purely hypothetical case writing.
It is a controlled episode-authoring and classification process.
