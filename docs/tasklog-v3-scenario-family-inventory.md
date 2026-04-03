# Tasklog V3 Scenario-Family Inventory

This document freezes the family inventory for:

- `tasklog_v3_independent_structured_holdout`

It complements:

- `docs/tasklog-v3-fixture-template.md`
- `docs/tasklog-v3-answer-contract.md`
- `docs/tasklog-v3-source-family-ontology.json`
- `docs/tasklog-v3-adjudication-guide.md`

## Pack Size Policy

Claim-bearing minimum:

- `24` fixtures total

Recommended target:

- `32` fixtures total

Family balance rule:

- at least `8` families
- at least `3` fixtures per family

Recommended default:

- `4` fixtures per family across the `8` required families

## Required Families

The first `V3a` pack must draw from all `8` required families below.

### 1. `authoritative_log_overrides_note`

Core pattern:

- an older broad note suggests one path
- a newer structured session log should control

Expected decision types:

- `resume_work`
- `resume_blocked_with_escalation`

Allowed controlling evidence labels:

- `latest_session_log`
- `latest_next_steps`

Expected distractor types:

- `notes_markdown`
- `work_summary`

`candidate_work_id_allowed`:

- `false`

### 2. `stale_active_context_must_be_ignored`

Core pattern:

- active context is visible but stale or superseded
- another source should control instead

Expected decision types:

- `resume_work`
- `resume_blocked_with_escalation`
- `abstain_insufficient_evidence`

Allowed controlling evidence labels:

- `latest_session_log`
- `latest_next_steps`
- `workdoc_plan`
- `workdoc_design`
- `workdoc_spec`

Expected distractor types:

- `active_context`

`candidate_work_id_allowed`:

- `false`

### 3. `blocked_work_requires_escalation`

Core pattern:

- one work is still the right target
- but the immediate legal action includes escalation

Expected decision types:

- `resume_blocked_with_escalation`

Allowed controlling evidence labels:

- `latest_session_log`
- `latest_next_steps`
- `workdoc_plan`

Expected distractor types:

- superficially resumable active work
- stale status text

`candidate_work_id_allowed`:

- `false`

### 4. `abstain_when_no_authoritative_source`

Core pattern:

- evidence is too weak, missing, or mutually incompatible to justify resuming any work

Expected decision types:

- `abstain_insufficient_evidence`

Allowed controlling evidence labels:

- `conflicting_sources`
- `no_authoritative_source`

Expected distractor types:

- plausible but under-supported candidate work
- incomplete notes or incomplete logs

`candidate_work_id_allowed`:

- `false`

Label guidance:

- use `conflicting_sources` when multiple visible sources point in incompatible directions and the correct outcome is to acknowledge conflict
- use `no_authoritative_source` when no source provides decisive support, even if the evidence is merely sparse rather than explicitly contradictory

### 5. `ask_single_missing_fact_before_resume`

Core pattern:

- one concrete missing fact should be asked before any resume decision

Expected decision types:

- `ask_clarifying_question`

Allowed controlling evidence labels:

- `conflicting_sources`
- `no_authoritative_source`
- `latest_session_log`
- `workdoc_notes`

Expected distractor types:

- a tempting provisional candidate work
- a broad note that looks more decisive than it is

`candidate_work_id_allowed`:

- `true` for explicitly marked fixtures only

### 6. `done_work_noise_vs_true_active_signal`

Core pattern:

- a done work has richer or newer-looking artifacts
- another work is the true live target

Expected decision types:

- `resume_work`
- `abstain_insufficient_evidence`

Allowed controlling evidence labels:

- `latest_session_log`
- `latest_next_steps`
- `work_summary`

Expected distractor types:

- `artifact_file`
- `workdoc_notes`
- `notes_markdown`

`candidate_work_id_allowed`:

- `false`

### 7. `provenance_tiebreak_between_open_works`

Core pattern:

- two open works look plausible
- provenance or recency should break the tie

Expected decision types:

- `resume_work`
- `ask_clarifying_question`
- `abstain_insufficient_evidence`

Allowed controlling evidence labels:

- `latest_session_log`
- `latest_next_steps`
- `work_summary`
- `conflicting_sources`

Expected distractor types:

- another active or planned work with similar scope wording

`candidate_work_id_allowed`:

- `true` only for fixtures intentionally authored as clarifying cases

### 8. `resume_with_state_constrained_next_step`

Core pattern:

- the correct work can be identified
- but the correct immediate next step is constrained by blocker state, order, or review boundary

Expected decision types:

- `resume_work`
- `resume_blocked_with_escalation`

Allowed controlling evidence labels:

- `latest_session_log`
- `latest_next_steps`
- `workdoc_plan`
- `workdoc_design`

Expected distractor types:

- a tempting but out-of-order code step
- a richer artifact that suggests the wrong next action

`candidate_work_id_allowed`:

- `false`

## Family-Level Rules

Every family must satisfy:

- clear ambiguity rationale
- at least one plausible distractor source or distractor work
- no mention of hidden Tasklog semantics in the fixture logic
- compatibility with the frozen answer and grader contracts

No family may be authored solely to make one baseline fail.
The family should instead represent a real provenance-sensitive re-entry difficulty.

## Coverage Targets

Minimum coverage for `V3a`:

- `3` fixtures per family

Recommended coverage:

- `4` fixtures per family

Recommended diversity within each family:

- at least one medium-difficulty fixture
- at least one hard fixture
- at least two distinct distractor patterns

## Family-Level Label Guidance

Use the ontology labels consistently:

- `latest_session_log` when the decisive signal comes from the newest log summary
- `latest_next_steps` when the decisive signal is specifically the newest next-step field
- `work_summary` when the canonical work record itself is decisive
- `workdoc_*` labels when a specific workdoc type controls
- `artifact_file` when the artifact itself carries the decisive evidence
- `notes_markdown` when a free-form note file is the decisive evidence
- `active_context` only when active-context state should actually control

Special distinction:

- `conflicting_sources` means decisive conflict is itself the controlling fact
- `no_authoritative_source` means decisive support is absent, not necessarily contradictory

The annotator should never choose between those two labels by convenience.
The fixture should make the difference legible.

## Family Summary Table

| Family ID | Default Count | Candidate Work Allowed | Primary Decision Modes |
| --- | ---: | --- | --- |
| `authoritative_log_overrides_note` | 4 | no | `resume_work`, `resume_blocked_with_escalation` |
| `stale_active_context_must_be_ignored` | 4 | no | `resume_work`, `resume_blocked_with_escalation`, `abstain_insufficient_evidence` |
| `blocked_work_requires_escalation` | 4 | no | `resume_blocked_with_escalation` |
| `abstain_when_no_authoritative_source` | 4 | no | `abstain_insufficient_evidence` |
| `ask_single_missing_fact_before_resume` | 4 | yes, marked only | `ask_clarifying_question` |
| `done_work_noise_vs_true_active_signal` | 4 | no | `resume_work`, `abstain_insufficient_evidence` |
| `provenance_tiebreak_between_open_works` | 4 | yes, clarifying only | `resume_work`, `ask_clarifying_question`, `abstain_insufficient_evidence` |
| `resume_with_state_constrained_next_step` | 4 | no | `resume_work`, `resume_blocked_with_escalation` |
