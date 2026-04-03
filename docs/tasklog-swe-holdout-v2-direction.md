# Tasklog SWE Holdout V2 Direction

This document defines the next benchmark direction after `tasklog-swe-holdout-round-v1`.

V1 was successful as a first frozen claim-bearing round:

- `Tasklog Re-entry` achieved `100%` strict accuracy on the 10-sample holdout
- `Workspace-Only`, `Notes Replay`, and `Raw State` were clearly weaker
- `Normalized State` matched `Tasklog Re-entry` at `100%`

That means V1 is good evidence for a conservative claim:

`Tasklog Re-entry substantially outperformed weaker continuity baselines on the frozen holdout.`

It is **not** sufficient evidence for a stronger claim:

`Tasklog Re-entry outperformed a strong normalized-state baseline.`

The reason is simple:

- V1 hit a `ceiling effect`
- the current strict metric cannot distinguish two arms that both answer every sample correctly
- the current `Normalized State` payload still exposes enough decisive signal for full-score recovery

V2 should therefore be designed to answer a narrower question:

`Where should Tasklog's product surface outperform a generic normalized baseline, if it truly adds value beyond field extraction?`

## V2 Goal

V2 should measure whether Tasklog helps when the problem is no longer just:

- select the right work
- restate the next step

Instead, V2 should target cases where a re-entry surface should matter because the agent must reason about:

- source priority
- ambiguity
- abstention
- stale or conflicting evidence
- multi-work navigation
- action sequencing rather than one-shot extraction

The core V2 claim target is:

`On ambiguity-sensitive re-entry tasks, Tasklog Re-entry recovers the correct action or abstention decision more reliably than a generic normalized-state baseline.`

## Why V1 Saturated

V1 gave `Normalized State` too much of the decisive signal in already-digested form:

- `work_id`
- `title`
- `status`
- `latest_log_summary`
- `next_step_summary`
- `artifact_files`

That payload is still generic enough to call a baseline, but it is strong enough that the model can often solve the task by one-pass extraction and ranking.

When the benchmark asks only for:

- selected work
- work status
- next step

and the baseline payload already contains the decisive ranking signal, V1 will not separate the two arms unless the model makes avoidable mistakes.

That is not a useful basis for a superiority claim.

## V2 Design Principles

V2 should keep the good parts of V1:

- frozen fixtures
- hermetic execution
- fixed model roster
- frozen answer keys
- no holdout tuning

But V2 should change four things.

### 1. Make the task depend on evidence priority, not only evidence presence

The correct answer should depend on *which source should win*, not just whether a field exists somewhere.

Good V2 examples:

- a broad note suggests one action, but the latest structured work log explicitly supersedes it
- a done work has newer documentation artifacts, but the actual active target has the more trustworthy next-step signal
- the active context is recent, but a more authoritative workdoc or log narrows the priority differently

### 2. Reward correct abstention and escalation

V1 mostly asks for a concrete resume target.
V2 should include cases where the correct answer is:

- `insufficient evidence`
- `ask one clarifying question`
- `escalate to unblock`
- `do not resume any current work yet`

This is where a re-entry product surface can plausibly beat generic extraction.

### 3. Measure action sequencing, not only one-shot field recovery

Tasklog may help most when the agent must decide:

- what to inspect first
- which follow-up step is legal
- whether a chosen work requires `resume_work` before deeper reads
- whether the correct next action is another Tasklog step rather than a code step

V2 should therefore include at least one interactive or staged lane where the answer is not just a final JSON extraction target.

### 4. Keep `Normalized State` generic

If the normalized baseline bakes in Tasklog semantics, the comparison becomes circular.

For V2, `Normalized State` should remain generic:

- normalized fields are allowed
- but baseline payloads should not encode product-specific priority judgments
- do not include fields that already collapse provenance or ambiguity into a final recommendation

The baseline may summarize state.
It should not quietly reproduce Tasklog's retrieval semantics.

## Proposed V2 Tracks

Use two linked tracks.

### Track A: Claim-Bearing Structured Holdout

This remains frozen and scoreable.

It should include new scenario families such as:

- `authoritative_log_overrides_notes`
- `active_context_recent_but_not_authoritative`
- `ask_before_resume`
- `resume_none_due_to_insufficient_evidence`
- `blocked_work_requires_escalation`
- `two_open_works_need_provenance_tie_break`
- `artifact_rich_done_work_with_more_recent_noise`
- `next_action_is_tasklog_step_not_code_step`

This track should still return a structured answer, but the contract should expand.

Recommended required fields:

- `decision_type`
- `selected_work_id`
- `work_status`
- `next_step_summary`
- `primary_evidence_source`

Recommended optional fields:

- `clarifying_question`
- `abstention_reason`
- `escalation_target`
- `other_candidate_work_ids`

`decision_type` should be one of:

- `resume_work`
- `resume_blocked_with_escalation`
- `ask_clarifying_question`
- `abstain_insufficient_evidence`
- `do_not_resume_closed_work`

This prevents V2 from collapsing all cases back into plain work selection.

### Track B: Supporting Interactive Re-entry Lane

This track is not required for the first V2 claim, but it should exist as supporting evidence if Tasklog value is expected to appear in sequencing.

The interactive lane should test whether the model:

- chooses the right first Tasklog action
- avoids illegal or premature reads
- sequences resume and read operations correctly
- stops and asks for clarification when evidence is insufficient

This is the most likely place where Tasklog can outperform a normalized static payload even when both can solve simpler structured tasks.

## V2 Metrics

V2 should not rely on one strict score only.

Use at least these metrics:

- `decision_accuracy`
- `resume_target_accuracy`
- `next_step_accuracy`
- `primary_evidence_source_accuracy`
- `abstention_accuracy`
- `escalation_accuracy`

For the interactive lane, also track:

- `first_action_accuracy`
- `tool_path_compliance`
- `illegal_read_rate`
- `premature_finalization_rate`

The paper can still report one headline metric, but V2 should keep the submetrics because they explain *why* Tasklog helps or fails.

## Baseline Rules For V2

To keep the comparison fair and interpretable:

### Workspace-Only

- codebase tree
- repo manifests
- no Tasklog state
- no workdocs

### Notes Replay

- markdown artifacts only
- no structured `.tasklog` state

### Raw State

- raw `.tasklog` and workdocs
- no generic normalization layer

### Normalized State

- generic normalized summaries only
- may expose normalized fields like latest log and work status
- must not expose product-specific retrieval conclusions
- must not include a field equivalent to `recommended_work`
- must not encode an implicit authority ordering decided by hand for the model

### Tasklog Re-entry

- expose the actual product-facing re-entry surface
- preserve explicit authority and retrieval behavior if that is part of the product value being tested

## V2 Fixture Guidance

Every V2 fixture should document:

- the intended ambiguity
- which evidence source is actually authoritative
- why a plausible distractor is still wrong
- whether the correct behavior is resume, ask, escalate, or abstain

Each fixture should also name the exact failure mode it is meant to expose in `Normalized State`.

Example fixture note:

`This case should be easy for Tasklog only if the product surface makes the latest superseding log more salient than older notes. The normalized baseline sees all the same sources, but without explicit source priority.`

## Acceptance Gate For V2

Do not call V2 ready until:

1. at least one scenario family explicitly tests abstention or clarification rather than direct resume
2. the `Normalized State` payload is audited to confirm it is generic and not quietly carrying Tasklog semantics
3. the answer contract includes more than plain work selection and next-step extraction
4. at least one supporting interactive lane exists, even if the first public claim stays on the structured holdout

## Recommended Next Steps

1. Freeze a short V2 answer contract that includes `decision_type` and `primary_evidence_source`
2. Draft 8 to 12 V2 candidate fixtures focused on ambiguity and abstention
3. Write a baseline audit note for `Normalized State` showing what it is and is not allowed to expose
4. Build one or two smoke fixtures before scaling to a full V2 holdout pack
5. Keep V1 intact; do not overwrite or reinterpret the existing holdout round

## Practical Paper Guidance

Until V2 exists, the paper should phrase the current result as:

`Tasklog Re-entry matched a strong normalized baseline on the frozen V1 holdout while clearly outperforming weaker continuity baselines.`

V2 is the benchmark revision needed if the paper wants to test whether Tasklog adds value beyond generic normalization.
