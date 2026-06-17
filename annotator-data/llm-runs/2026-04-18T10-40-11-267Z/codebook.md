# Validation Codebook for the Interrupted Coding Work Taxonomy

## Purpose

This codebook defines how annotators should classify `episode descriptions` in the interrupted coding work validation study.

It is designed for use by:

- `human annotators` in the claim-bearing validation layer
- `LLM annotators` in the auxiliary annotation layer

The codebook applies to normalized `episode descriptions`, not to raw logs, raw traces, or full transcripts.

---

## What Annotators Must Produce

For each episode, annotators must assign:

1. one `interruption class`
2. one `dominant loss class`
3. a short justification
4. an uncertainty flag if the case feels boundary-ambiguous

Annotators should classify the episode as written.
They should not infer hidden facts that are not supported by the episode description.

---

## Unit of Analysis

The unit of analysis is:

> one resumptive decision episode at one interruption boundary

Do not classify the whole project, the whole session history, or the general quality of the system.
Classify the specific interruption and resumption situation described in the episode.

---

## Annotation Procedure

Annotators should use the same four-step procedure for every episode.

### Step 1: Identify the Interruption Boundary

Ask:

> What kind of boundary event created this resume point?

Choose the interruption class that best describes what happened at the boundary.

### Step 2: Identify the Earliest Broken Governing Object

Ask the dominant-assignment questions in order:

1. `Which work is truly current?`
2. `Why should this state be trusted over competing signals?`
3. `Which action mode is currently valid: act, ask, wait, escalate, or abstain?`
4. `Given the fixed action mode, what concrete next step should be taken?`
5. `Is this work actually done or still active?`

Assign the dominant loss at the earliest unresolved layer.

### Step 3: Check the Nearest Boundary Confusion

Before finalizing, compare the selected class against its nearest alternatives:

- `focus_loss` vs `authority_loss`
- `authority_loss` vs `readiness_loss`
- `readiness_loss` vs `intent_loss`
- `false_done` vs `dirty_done`

If the alternative seems equally plausible, mark the episode as `boundary-ambiguous` and explain why.

### Step 4: Record a Brief Justification

The justification should be short and structural.

Good justification:

> The work is known, but competing records disagree about whether it is blocked, so the earliest unresolved object is which record governs.

Bad justification:

> This feels like authority because it reminds me of another case.

---

## Interruption Classes

Interruption classes describe the `boundary event`, not the dominant failure object.

### `session_cutoff`

Use when:

- the prior working session ends before local trajectory is fully externalized or resumed locally
- the key difficulty comes from abrupt pause, terminal closure, token/context exhaustion, or overnight return

Do not use when:

- the key event is actor transfer across people or models
- the main boundary is a change in environment or dependency state rather than session termination itself

### `task_switch`

Use when:

- attention or priority is redirected across works
- the resume point is shaped by a switch to or from another work item

Do not use when:

- the boundary event is not a deliberate or system-driven priority redirect
- multiple works are visible only because tracker or closure state left them ambiguously open
  (`multi_open_work_conflict`, `false_done`, or `dirty_done` may fit better there)

### `blocked_waiting`

Use when:

- the work remains identifiable
- safe continuation depends on missing input, approval, ownership confirmation, or dependency resolution

Do not use when:

- the previous session ended at a failed step and the uncertainty is mainly about recovery from that failure event

### `environment_drift`

Use when:

- live world state changed during the interruption
- previously recorded state may no longer be trustworthy because the environment moved

Do not use when:

- the main issue is only session interruption without a meaningful world-state change

A world-state change counts as meaningful when it could invalidate a previously recorded fact that the agent would otherwise act on at resume time.

### `failure_boundary`

Use when:

- the previous attempt ended at a failed command, tool invocation, validation step, or permission boundary
- the recovery mode is itself part of the difficulty

Do not use when:

- the work is merely blocked pending external input without a salient failed attempt ending the prior episode

### `handoff`

Use when:

- the episode crosses model, operator, or role boundary
- tacit rationale is lost even though durable artifacts remain

Do not use when:

- the interruption is plain session termination without meaningful actor transfer

### `multi_open_work_conflict`

Use when:

- more than one open work candidate remains visible
- resume-time triage across works is part of the boundary event itself

Do not use when:

- the work is known but record precedence for that work is the main unresolved issue

### `false_done`

Use when:

- a closure-looking assertion or state appears
- required closure evidence was never actually satisfied

Do not use when:

- a real completion marker exists but follow-up obligations remain visible

### `dirty_done`

Use when:

- a valid completion marker exists
- separately visible residual obligations still govern follow-up action

Do not use when:

- the apparent done-state was never validly earned in the first place

---

## Dominant Loss Classes

Loss classes describe the earliest unresolved governing object.

### `focus_loss`

Core question:

> Which work is truly current?

Use when:

- current-work identity is unresolved
- the system cannot reliably determine which work item governs resumed action

Do not use when:

- the current work is known but the system cannot decide which record governs that work

Typical signs:

- multiple plausible current works
- closure failure hid the true active work
- priority redirection makes current-work identity itself unstable

### `authority_loss`

Core question:

> Why should this state be trusted over competing signals?

Use when:

- the work is known
- plausible records, cues, or state sources compete
- the unresolved issue is which one is entitled to govern

Do not use when:

- the dominant uncertainty is whether the agent should act, wait, ask, escalate, or abstain

Typical signs:

- stale but locally rich context wins over fresher state
- structured tracker view conflicts with newer engineering-side state
- multiple persisted records disagree about blocked/active/current status

### `readiness_loss`

Core question:

> Which action mode is currently valid: act, ask, wait, escalate, or abstain?

Use when:

- the work is known
- the governing record is trusted
- the dominant uncertainty is whether action is currently permissible

Do not use when:

- the action mode is already fixed and only the concrete next step is unresolved

Typical signs:

- the valid present output may be non-action
- the work is blocked, pending review, or waiting on missing input
- escalation is required before more implementation

### `intent_loss`

Core question:

> Given the fixed action mode, what concrete next step should be taken?

Use when:

- the action mode is already determined
- the remaining uncertainty concerns concrete next-step content

Do not use when:

- the deeper problem is still whether the agent should act at all

Typical signs:

- `act` is clearly valid, but file/order/operation choice is underdetermined
- one missing fact decides between otherwise plausible next steps

### `closure_loss`

Core question:

> Is this work actually done or still active?

Use when:

- closure status is the main unresolved object
- apparent completion may be false or incomplete

Do not use when:

- the work is clearly still active but blocked

Typical signs:

- done-looking trail suppresses still-governing follow-up work
- a completion marker exists but does not settle the resume boundary cleanly

---

## Dominant-Assignment Rule

Use the following order strictly:

1. `focus_loss`
2. `authority_loss`
3. `readiness_loss`
4. `intent_loss`
5. `closure_loss`

Interpretation:

- if `focus` is unresolved, assign `focus_loss`
- if focus is resolved but record precedence is unresolved, assign `authority_loss`
- if focus and authority are resolved but valid action mode is unresolved, assign `readiness_loss`
- if mode is resolved but the concrete next step is unresolved, assign `intent_loss`
- if the remaining unresolved object is whether the work is actually done, assign `closure_loss`

Later uncertainty does not outrank an earlier unresolved layer.

---

## Tie-Break Notes

### `focus_loss` vs `authority_loss`

Choose `focus_loss` when:

- the current work itself is unresolved
- the agent cannot tell which work item governs resumed action

Choose `authority_loss` when:

- the current work is known
- the dispute is over which record or cue governs that work

Rule of thumb:

> If you can name the work confidently but not the governing record, prefer `authority_loss`.

### `focus_loss` vs `closure_loss`

Choose `focus_loss` when:

- the agent genuinely cannot determine which work is current
- current-work identity is unresolved, regardless of why that happened

Choose `closure_loss` when:

- the work can still be identified
- the unresolved issue is whether it is truly done or still action-governing

Rule of thumb:

> If a false or misleading done-signal is the reason the wrong work looks current, the triggering condition is closure, but the dominant assignment depends on whether current-work identity is itself unresolved (`focus_loss`) or whether the work is identifiable and only its completion status remains unresolved (`closure_loss`).

### `authority_loss` vs `readiness_loss`

Choose `authority_loss` when:

- the system still does not know which record is entitled to define the work's current state
- a blocked, waiting, or approval-dependent status appears only inside one disputed record, so record precedence is still unresolved before mode selection can even begin

Choose `readiness_loss` when:

- the trusted state is already fixed
- the remaining question is whether present action should be act/ask/wait/escalate/abstain

Rule of thumb:

> Record selection comes before mode selection.

Corollary:

> If a later record says "this work is blocked" but the episode is still asking whether that later record should govern at all, prefer `authority_loss` over `readiness_loss`.

### `readiness_loss` vs `intent_loss`

Choose `readiness_loss` when:

- the valid present mode is still uncertain

Choose `intent_loss` when:

- the mode is fixed
- only the concrete next step remains unclear

Rule of thumb:

> If `act` is not yet securely justified, do not assign `intent_loss`.

Corollary:

> If the governing record is stable and `act` is already justified, multiple plausible next edits inside that same work strand are an `intent_loss` pattern, not an `authority_loss` pattern.

### `false_done` vs `dirty_done`

Choose `false_done` when:

- closure was never actually satisfied

Choose `dirty_done` when:

- a real completion marker exists
- follow-up obligations still govern action

Rule of thumb:

> `false_done` means the done signal was invalid; `dirty_done` means the done signal was real but incomplete for resumptive purposes.

---

## Handling Ambiguous Cases

Some episodes will remain genuinely difficult.
When that happens:

- still choose the best-fitting interruption class
- still choose the best-fitting dominant loss class
- mark the episode as `boundary-ambiguous`
- explain which rival class was strongest and why

Disagreement is useful study output.
Do not force false certainty if the episode truly straddles a boundary.

---

## Output Format

For each episode, record:

- `episode_id`
- `interruption_class`
- `dominant_loss_class`
- `boundary_ambiguous` (`yes` / `no`)
- `nearest_alternative_class`
- `justification` (`1–3` sentences)

Suggested compact form:

```md
Episode: E-CON-03
Interruption class: blocked_waiting
Dominant loss class: readiness_loss
Boundary-ambiguous: no
Nearest alternative: intent_loss
Justification: The work and governing state are clear, but safe continuation depends on approval that has not yet arrived. The unresolved object is therefore the valid present action mode, not the next concrete implementation step.
```

---

## Worked Micro-Examples

### Example 1

Episode sketch:

Two unfinished works remain visible after an overnight return. One has richer recent local context, but a separate newer state record shows the other now governs. The agent resumes the richer-looking strand.

Classification:

- interruption class: `multi_open_work_conflict`
- dominant loss class: `authority_loss`

Why:

- multiple work candidates remain visible at the boundary
- the key failure is not total ignorance of plausible work items, but choosing the wrong governing record among competing visible signals

### Example 2

Episode sketch:

The current work is clear and the trusted record shows that implementation is blocked pending approval. The agent continues coding instead of surfacing the blocker.

Classification:

- interruption class: `blocked_waiting`
- dominant loss class: `readiness_loss`

Why:

- the work and trusted state are known
- the unresolved object is which present mode is valid

### Example 3

Episode sketch:

The work is clearly active and `act` is the right present mode, but one missing implementation detail determines whether the next step should be patch file A or file B first. The agent guesses.

Classification:

- interruption class: `session_cutoff` or `failure_boundary`, depending on the described boundary
- dominant loss class: `intent_loss`

Why:

- the action mode is already fixed
- only concrete next-step content remains unresolved

### Example 4

Episode sketch:

An agent returns to a repo where two feature branches remain open. One branch has a recent commit and an open PR. The other has a tracker card marked `in progress` and a newer team message saying to focus there first. The agent resumes the branch with the open PR.

Classification:

- interruption class: `multi_open_work_conflict`
- dominant loss class: `authority_loss`
- boundary-ambiguous: `yes`
- nearest alternative: `focus_loss`

Why:

- both works are visible and nameable, which weighs against pure `focus_loss`
- the main dispute is over which visible signal should govern resumed action
- `focus_loss` remains a defensible alternative because the current work may still feel unresolved at the boundary

---

## What This Codebook Does Not Do

This codebook does not:

- prove the taxonomy correct in advance
- eliminate all ambiguity
- replace later taxonomy revision if disagreement reveals weak boundaries

Its job is narrower:

> make the taxonomy usable enough for an independent classification study.
