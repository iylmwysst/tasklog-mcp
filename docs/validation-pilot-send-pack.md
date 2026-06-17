# Validation Pilot Send Pack

## Purpose

This is the consolidated `annotator-facing` send pack for the first pilot of the interrupted coding work taxonomy study.

Use this file when you want to send one document that is enough to:

- explain the pilot
- tell annotators how to label
- provide the pilot episodes
- provide the submission sheet

This pack is assembled from the current canonical materials:

- `docs/validation-pilot-episodes.md`
- `docs/validation-codebook.md`
- `docs/validation-annotation-form.md`
- `docs/validation-annotation-submission-template.md`

Do not send this together with:

- `docs/validation-pilot-provenance-ledger.md`
- expected labels
- author-side commentary about intended ambiguity

---

## What The Pilot Is For

The goal of this pilot is not to validate the whole taxonomy statistically.

The goal is to check whether:

- episode descriptions are clear enough
- the codebook is usable independently
- the dominant-loss boundaries are operational enough for first-pass annotation

Disagreement is allowed in the pilot.
The pilot is successful if disagreement is interpretable rather than random.

---

## Annotator Instructions

Classify each episode as written.

- do not invent facts that are not in the episode
- do not correct the scenario
- do not use outside notes, raw logs, or provenance material
- do not try to guess what the researcher wants

If you use an LLM at all, use it only before annotation to understand the codebook.
Do not use an LLM to decide the labels for a real pilot episode if this round is being treated as human annotation.

---

## What To Submit For Each Episode

For each episode, submit:

1. one `interruption_class`
2. one `dominant_loss_class`
3. one `boundary_ambiguous` value
4. one `nearest_alternative_class`
5. a short structural `justification`

Optional but recommended:

- `confidence`
- `notes`

---

## Annotation Procedure

Use the same four-step procedure for every episode.

### Step 1: Identify The Interruption Boundary

Ask:

> What kind of boundary event created this resume point?

Choose the `interruption_class` that best matches the boundary event.

### Step 2: Identify The Earliest Broken Governing Object

Ask these in order:

1. Which work is truly current?
2. Why should this state be trusted over competing signals?
3. Which action mode is currently valid: `act`, `ask`, `wait`, `escalate`, or `abstain`?
4. Given that action mode, what concrete next step should be taken?
5. Is this work actually done or still active?

Choose the `dominant_loss_class` at the earliest unresolved layer.

### Step 3: Check The Nearest Boundary Confusion

Before finalizing, compare the selected dominant loss against the nearest common rival:

- `focus_loss` vs `authority_loss`
- `authority_loss` vs `readiness_loss`
- `readiness_loss` vs `intent_loss`
- `false_done` vs `dirty_done`

If the nearest alternative still feels genuinely plausible, mark:

- `boundary_ambiguous: yes`

Otherwise use:

- `boundary_ambiguous: no`
- `nearest_alternative_class: none`

### Step 4: Write A Short Structural Justification

Keep the justification short and structural.

Good:

> The work is known, but competing records disagree about whether it is blocked, so the earliest unresolved object is which record governs.

Bad:

> This feels like authority because it reminds me of another case.

---

## Allowed Label Values

### `interruption_class`

- `session_cutoff`
- `task_switch`
- `blocked_waiting`
- `environment_drift`
- `failure_boundary`
- `handoff`
- `multi_open_work_conflict`
- `false_done`
- `dirty_done`

### `dominant_loss_class`

- `focus_loss`
- `authority_loss`
- `readiness_loss`
- `intent_loss`
- `closure_loss`

### `boundary_ambiguous`

- `yes`
- `no`

### `nearest_alternative_class`

- `focus_loss`
- `authority_loss`
- `readiness_loss`
- `intent_loss`
- `closure_loss`
- `none`

### `confidence`

- `high`
- `medium`
- `low`

---

## Quick Reference: Interruption Classes

These labels describe the `boundary event`, not the deeper failure object.

### `session_cutoff`

Use when the main issue comes from the session ending abruptly before local trajectory was fully externalized.

Typical use:

- overnight return
- terminal closure
- context or token exhaustion

Do not use if the main boundary is really actor transfer, environment change, or a failed step.

### `task_switch`

Use when attention or priority was redirected from one work item to another.

Typical use:

- priority changed
- another task interrupted the current one

Do not use if multiple open works are visible only because closure state or tracking left them ambiguously open.

### `blocked_waiting`

Use when the work is still identifiable but safe continuation depends on something missing.

Typical use:

- waiting for approval
- waiting for ownership confirmation
- waiting for input or dependency resolution

Do not use if the previous episode ended at a salient failure and recovery from that failure is the real boundary.

### `environment_drift`

Use when the environment changed during the interruption and earlier recorded facts may no longer be trustworthy.

Typical use:

- dependency state changed
- live world state moved
- previously valid assumptions may now be stale

Do not use if the only issue is that the session ended.

### `failure_boundary`

Use when the previous attempt ended at a failed command, failed tool invocation, failed validation step, or permission boundary, and recovery mode is part of the difficulty.

Typical use:

- a test failed and resume starts from recovery
- a command hit a permission boundary

Do not use if the work is merely waiting on outside input.

### `handoff`

Use when the episode crosses a model, operator, or role boundary and tacit rationale is lost.

Typical use:

- one person or model hands off to another

Do not use for plain session termination without meaningful actor transfer.

### `multi_open_work_conflict`

Use when more than one open work candidate remains visible and resume-time triage across those works is itself the boundary event.

Typical use:

- two active-looking strands are still open
- the agent must decide which work is current

Do not use if the work is known and only record precedence is disputed.

### `false_done`

Use when something looks closed but the required closure evidence was never actually satisfied.

Typical use:

- done-looking state appears, but completion was never validly earned

Do not use if completion was valid but residual follow-up work still governs.

### `dirty_done`

Use when there is a valid completion marker but separately visible residual obligations still govern follow-up action.

Typical use:

- main implementation is done, but one still-governing safeguard or follow-up remains

Do not use if the done-state was never valid in the first place.

---

## Quick Reference: Dominant Loss Classes

These labels describe the `earliest unresolved governing object`.

### `focus_loss`

Core question:

> Which work is truly current?

Use when current-work identity itself is unresolved.

Typical use:

- multiple plausible current works
- the system cannot tell which work governs resumed action

Do not use if the work is known and the dispute is only about which record governs it.

### `authority_loss`

Core question:

> Why should this state be trusted over competing signals?

Use when the work is known, but multiple records or cues compete and the unresolved issue is which one is entitled to govern.

Typical use:

- local context conflicts with fresher structured state
- tracker state conflicts with newer engineering-side state

Do not use if the deeper issue is whether the agent should act at all.

### `readiness_loss`

Core question:

> Which action mode is currently valid: act, ask, wait, escalate, or abstain?

Use when the work is known, the governing record is trusted, but the agent still does not know whether action is currently permissible.

Typical use:

- blocked pending review or approval
- waiting on input
- escalation is required before implementation can continue

Do not use if the action mode is already fixed and only the next concrete step is unclear.

### `intent_loss`

Core question:

> Given the fixed action mode, what concrete next step should be taken?

Use when `act` is already justified, but the next concrete operation is still underdetermined.

Typical use:

- two plausible next edits remain
- file or operation order is still unclear

Do not use if the deeper issue is still whether the agent should act, wait, ask, or escalate.

### `closure_loss`

Core question:

> Is this work actually done or still active?

Use when closure status is the main unresolved object.

Typical use:

- a done-looking trail hides still-governing follow-up work
- completion may be false or incomplete

Do not use if the work is clearly still active but merely blocked.

---

## Quick Tie-Break Rules

- If you cannot tell which work is current, prefer `focus_loss`.
- If you know the work but not which record should govern it, prefer `authority_loss`.
- If work and governing record are clear but you do not know whether action is allowed yet, prefer `readiness_loss`.
- If action is allowed but the next concrete step is unclear, prefer `intent_loss`.
- If the remaining question is whether the work is actually done, prefer `closure_loss`.

Two high-value reminders from the pilot:

- if a later record says the work is blocked, but the episode is still asking whether that later record should govern at all, prefer `authority_loss` over `readiness_loss`
- if the governing record is stable and `act` is already justified, multiple plausible next edits inside the same work strand are an `intent_loss` pattern, not an `authority_loss` pattern

---

## Canonical Fields

Each annotation record should contain:

- `episode_id`
- `annotator_id`
- `annotator_tier`
- `annotator_family`
- `interruption_class`
- `dominant_loss_class`
- `boundary_ambiguous`
- `nearest_alternative_class`
- `justification`
- `confidence`
- `notes`

---

## Pilot Episodes

## Annotator Header

Fill this once before starting:

```md
Annotator ID:
Annotator Tier:
Annotator Family:
```

## Episode E-SWE-01

Setting:
A coding agent returns to an evaluation harness repository after a pause in work on the modal execution entrypoint. The earlier local thread of work still looks coherent: a note says to continue wiring the entrypoint flow, and the open work item still appears active.

Interruption boundary:
The prior session ended after partial progress on the entrypoint path, with the expectation that implementation would continue in the same area when the session resumed.

Visible records at resume time:
- a recent local note describing the next edit in the entrypoint wrapper
- an open work item still associated with the same subsystem
- a newer structured state record indicating that the original strand is blocked pending approval and that a neighboring work strand now governs
- no newer record that independently confirms whether the blocked-status record should outrank the local thread

What happened before or during the interrupted attempt:
The agent had already oriented itself around the entrypoint path and left enough local context that the earlier strand still looks easy to continue.

Decision pressure:
The obvious move is to keep implementing the entrypoint work that already has a visible local trail.

Complication:
The visible records do not fully agree about what currently governs. One record favors local continuity, while another later record changes the status of that work and points to a different governing strand. The key uncertainty is not yet whether the agent should wait for approval; it is whether that later blocked-status record should outrank the local thread in the first place.

### Response Block

```md
Episode ID: E-SWE-01
Annotator ID:
Annotator Tier:
Annotator Family:

Interruption Class:
Dominant Loss Class:
Boundary-Ambiguous:
Nearest Alternative Class:
Confidence:

Justification:

Notes:
```

## Episode E-SWE-02

Setting:
A coding agent returns to work on a modal evaluation runner in a repository where the target work item is clear and the latest repository-facing state still points to the same runner area.

Interruption boundary:
The previous session paused after the agent identified the next relevant runner changes but before it executed them.

Visible records at resume time:
- a clear current work item tied to the modal runner
- a trusted state record showing that continuation depends on an approval, ownership confirmation, or external handoff
- repository cues that still make further implementation look locally feasible

What happened before or during the interrupted attempt:
The interrupted attempt made enough progress that the remaining implementation path looks straightforward if the agent ignores the blocker.

Decision pressure:
The agent is tempted to keep editing the runner immediately because the coding path is visible and locally understandable.

Complication:
The issue is not which code path to touch next. The issue is whether it is safe to continue at all before an external confirmation or handoff arrives.

### Response Block

```md
Episode ID: E-SWE-02
Annotator ID:
Annotator Tier:
Annotator Family:

Interruption Class:
Dominant Loss Class:
Boundary-Ambiguous:
Nearest Alternative Class:
Confidence:

Justification:

Notes:
```

## Episode E-CON-01

Setting:
An agent returns to a repository where two feature strands remain visibly open. One strand has a recent commit and an open pull request. The other has a tracker card marked `in progress` and a newer team-side message saying that this second strand should take priority first.

Interruption boundary:
The earlier session ended before the agent resolved which of the two active-looking strands now governs resumed work.

Visible records at resume time:
- an open PR and recent commit trail for one strand
- a tracker record marking another strand as active
- a newer team-side instruction shifting focus toward the second strand

What happened before or during the interrupted attempt:
The earlier work touched both strands closely enough that each still looks plausibly current at the point of return.

Decision pressure:
The easiest move is to resume the branch with the richer implementation trail and open PR.

Complication:
Both candidate works are visible and nameable, but the visible signals do not agree on which one should actually govern resumed action. The ambiguity is not only about what work exists, but also about which signal outranks the others.

### Response Block

```md
Episode ID: E-CON-01
Annotator ID:
Annotator Tier:
Annotator Family:

Interruption Class:
Dominant Loss Class:
Boundary-Ambiguous:
Nearest Alternative Class:
Confidence:

Justification:

Notes:
```

## Episode E-CON-02

Setting:
A coding agent returns to a repository after a pause while implementing a fix whose current work item is still clear. The latest trusted state does not indicate any blocker, ownership handoff, or waiting condition. The work should continue.

Interruption boundary:
The previous session ended after the agent narrowed the problem to two concrete next edits inside the same active strand of work.

Visible records at resume time:
- a stable current work item with no newer superseding record
- notes showing that action should continue now rather than wait or escalate
- repository evidence that leaves two immediate next edits plausible
- no competing tracker, handoff, or later state record suggesting that a different governing source should be trusted instead

What happened before or during the interrupted attempt:
The interrupted attempt already resolved the higher-level question of whether to continue. What remained unsettled was the order of the next concrete implementation move.

Decision pressure:
The agent needs to resume by choosing the next admissible edit and continuing execution.

Complication:
The agent already knows it should keep working, and it is not choosing among competing records. What it does not know is which of two plausible edits to make first inside the same already-governing work strand.

### Response Block

```md
Episode ID: E-CON-02
Annotator ID:
Annotator Tier:
Annotator Family:

Interruption Class:
Dominant Loss Class:
Boundary-Ambiguous:
Nearest Alternative Class:
Confidence:

Justification:

Notes:
```

## Episode E-HIS-01

Setting:
A coding agent returns to a work tracker the morning after a patch was marked complete. The tracker shows the item as done, and the implementation notes suggest that the main coding task was finished. A neighboring engineering-side record, however, indicates that one follow-up safeguard still remained open before the work should be treated as fully closed.

Interruption boundary:
The earlier session stopped after the visible done-signal appeared, before the residual follow-up obligation was resolved.

Visible records at resume time:
- a tracker or status surface showing the work as complete
- implementation notes that reinforce the appearance of closure
- a later engineering-side record showing one still-governing follow-up obligation

What happened before or during the interrupted attempt:
The agent had legitimate reason to believe the main implementation was complete, but the lifecycle state of the work did not settle cleanly before the pause.

Decision pressure:
The natural move is to treat the completed-looking item as closed and move on to other work.

Complication:
The visible done-signal may be real but insufficient. The resumed decision depends on whether the remaining obligation means the work still requires attention despite the completion marker.

### Response Block

```md
Episode ID: E-HIS-01
Annotator ID:
Annotator Tier:
Annotator Family:

Interruption Class:
Dominant Loss Class:
Boundary-Ambiguous:
Nearest Alternative Class:
Confidence:

Justification:

Notes:
```

---

## Minimal Validity Check

Before submission, confirm:

- every episode has both an interruption class and a dominant loss class
- `boundary_ambiguous` is filled for every episode
- `nearest_alternative_class` is filled for every episode
- every episode has a justification

---

## Canonical Source Files

If this send pack later needs revision, update the canonical source files first:

- `docs/validation-pilot-episodes.md`
- `docs/validation-codebook.md`
- `docs/validation-annotation-form.md`
- `docs/validation-annotation-submission-template.md`
