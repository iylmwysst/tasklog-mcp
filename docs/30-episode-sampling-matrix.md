# 30-Episode Sampling Matrix for Taxonomy Validation

## Purpose

This note defines the target sampling shape for the first `30`-episode claim-bearing validation study of the interrupted coding work taxonomy.

It is a `planning matrix`, not a frozen claim about what the final dataset must look like.
The actual sample will depend on:

- source availability
- provenance quality
- whether some candidate episodes are too weak or too leading after authoring
- whether pilot disagreement reveals that some boundaries need more coverage than planned

So the matrix should be read as:

> target distribution plus rebalancing rules

not as:

> exact final counts that must never move

---

## Fixed Constraints

The first full study should satisfy the following constraints:

- `30` total episodes
- `3` source types represented:
  - `real/public-log`
  - `constructed`
  - `SWE-bench-derived or repo-grounded`
- every dominant loss class represented by at least `3` episodes
- interruption-class coverage checked separately from loss-class coverage
- no dominant loss class represented by only one source type if cross-source coverage can be achieved
- no source type dominating substantially more than one third to one half of the final sample

Episode identifiers and revision handling should follow the convention in `docs/episode-authoring-protocol.md`.

---

## Default Source Mix

The default full-study mix is:

- `10` real/public-log episodes
- `10` constructed episodes
- `10` SWE-bench-derived or repo-grounded episodes

Reason:

- `real/public-log` gives external credibility
- `constructed` guarantees coverage and boundary stress
- `SWE-bench-derived/repo-grounded` gives artifact-rich coding realism without relying only on author-side history

---

## Coverage Floor by Dominant Loss Class

The constructed subset should guarantee a minimum floor of one episode per dominant loss class.

Minimum coverage floor:

- `1` constructed `focus_loss`
- `1` constructed `authority_loss`
- `1` constructed `readiness_loss`
- `1` constructed `intent_loss`
- `1` constructed `closure_loss`

This floor is not sufficient by itself.
It simply ensures that no dominant loss class is absent while sourcing the rest of the sample.

---

## Planning Matrix

The table below is the default target distribution for the first 30-episode study.

| Dominant loss class | Real/public-log | Constructed | SWE-bench-derived / repo-grounded | Target total |
|---|---:|---:|---:|---:|
| `focus_loss` | 2 | 2 | 2 | 6 |
| `authority_loss` | 2 | 2 | 3 | 7 |
| `readiness_loss` | 2 | 2 | 2 | 6 |
| `intent_loss` | 2 | 2 | 1 | 5 |
| `closure_loss` | 2 | 2 | 2 | 6 |
| **Total** | **10** | **10** | **10** | **30** |

This distribution is intentionally not perfectly flat.
It gives a small extra margin to `authority_loss`, since that is both central to the paper's claim and likely to attract the most reviewer scrutiny.

---

## Why This Matrix Makes Sense

### Focus Loss

Needs enough examples to distinguish:

- unresolved current-work identity
- multiple known work items that still fail triage cleanly

Constructed and real/public examples should both contribute here because focus confusion is common but often under-specified in public traces.

### Authority Loss

Gets one extra episode because:

- it is the paper's most novel class
- it is the most likely target of reviewer pushback
- it needs to show up across more than one source type to avoid looking author-invented

### Readiness Loss

Needs visible examples of:

- act vs ask
- act vs wait
- act vs escalate
- abstain as a valid resumed mode

Repo-grounded and operational episodes should help here because blocked or invalid next-step situations often show up in artifact-rich work.

### Intent Loss

May end up with slightly fewer cases if sourcing is harder, but it still needs at least `5` in the first full study and must not collapse into an afterthought class.
`5` is the floor for the first full study and should not be reduced further without an explicit redesign of the taxonomy or codebook.

The key distinction to preserve is:

- readiness is known, but the concrete next step is still under-specified

### Closure Loss

Needs both:

- false completion
- apparently complete but still action-governing work

This class benefits from mixed sourcing because done-signals appear in trackers, comments, and repo state in different ways.

---

## Constructed Subset Plan

Within the `10` constructed episodes, the planned role split should be:

- `5` coverage-floor episodes
  - one per dominant loss class
- `5` stress or ambiguity episodes
  - likely boundary confusions
  - hybrid cases
  - sparse structures that are hard to source cleanly elsewhere

That means the constructed subset is not just a convenience bucket.
It is a deliberate way to guarantee:

- minimum coverage
- boundary pressure
- repeatable worked cases for adjudication analysis

---

## Real/Public-Log Subset Plan

The real/public-log subset should prioritize:

- visible interruption boundaries
- enough narrative clarity to author a fair episode description
- cases not dominated by missing context

Good candidates include:

- public agent traces
- operational logs from prototype use
- public issue or review threads where the resumptive decision pressure is reconstructable

This subset should make it possible to say:

> the taxonomy is not only being tested on author-built scenarios.

---

## SWE-Bench-Derived / Repo-Grounded Subset Plan

This subset should prioritize:

- artifact-rich repo situations
- provenance-visible source material
- cases where multiple records or cues can compete at resume time

It should not overclaim.
These cases may be `repo-grounded` or `trace-inspired` without pretending they are all fully documented interrupted episodes.

This subset helps answer a different reviewer concern:

> does the taxonomy survive contact with codebase-shaped artifact fields rather than only narrative logs?

---

## Secondary Interruption-Class Coverage Check

The matrix is organized primarily around `dominant loss class`, because that is where the paper's main conceptual claim sits.
But the study also reports agreement on `interruption class`, so interruption coverage cannot be left implicit.

The working secondary rule should be:

- every interruption class should appear at least `1` time if a defensible episode can be authored for it
- the more common or analytically central interruption classes should appear at least `2` times
- no more than a small minority of the 30 episodes should collapse onto only `session_cutoff` and `blocked_waiting`

This means the final sample should be checked twice before freeze:

- once by dominant loss class
- once by interruption class

If interruption coverage is too concentrated, rebalance before annotation even if loss-class coverage already looks acceptable.

---

## Rebalancing Rules

The final sample does **not** need to match the matrix exactly if real sourcing pressure makes that impossible.
But deviations should follow explicit rules.

### Allowed Rebalancing

Allowed:

- moving `+/-1` episode between source types for a class if provenance quality forces it
- increasing a class total if pilot disagreement shows it needs more coverage
- reducing one class slightly if a stronger ambiguous-boundary set is needed elsewhere

### Not Allowed Without Explicit Justification

Not allowed:

- dropping any dominant loss class below `3` total episodes
- letting one source type dominate a class entirely when cross-source coverage was possible
- letting the whole sample drift into mostly constructed or mostly author-side material
- reducing `authority_loss` to a token presence after claiming it is a central object of the taxonomy

---

## Pilot Interaction

The matrix should not be frozen before the pilot.

The correct process is:

1. draft the initial 30-episode target pool
2. run a `3–5` episode pilot
3. inspect disagreement
4. rebalance the matrix if some boundaries clearly need more coverage

Examples:

- if `focus_loss` and `authority_loss` repeatedly blur, add one or two more episodes there
- if `closure_loss` seems too easy and uninformative, reduce it slightly and move those slots to a harder boundary
- if public-log episodes are too noisy to author fairly, shift some quota toward repo-grounded cases while preserving source diversity

---

## Working Position

The sampling matrix should be presented as a disciplined starting point, not as a fake certainty.

The strongest way to describe it is:

> The 30-episode study will be built to satisfy coverage and source-diversity constraints. The exact final distribution may move slightly as source quality, pilot disagreement, and boundary difficulty become clearer, but the study will preserve cross-source coverage and minimum representation for every dominant loss class.
