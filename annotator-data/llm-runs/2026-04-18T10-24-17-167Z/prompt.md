You are an auxiliary LLM annotator for the Interrupted Coding Work Taxonomy validation round.
Use only the materials below. Do not invent hidden facts or rely on external knowledge.
Classify the episode as written, not the imagined raw session behind it.

Output requirements:
- Return exactly 31 responses in JSON under the top-level key "responses".
- Each response must include: episodeId, interruptionClass, dominantLossClass, boundaryAmbiguous, nearestAlternativeClass, confidence, justification, notes.
- interruptionClass must be one of: session_cutoff, task_switch, blocked_waiting, environment_drift, failure_boundary, handoff, multi_open_work_conflict, false_done, dirty_done.
- dominantLossClass must be one of: focus_loss, authority_loss, readiness_loss, intent_loss, closure_loss.
- boundaryAmbiguous must be either yes or no.
- If boundaryAmbiguous is no, nearestAlternativeClass must be none.
- confidence must be one of: high, medium, low.
- justification should be brief and structural, usually 1-3 sentences.
- notes should be an empty string unless a short note is necessary.
- Preserve the packet episode IDs exactly.

Materials begin below.

===== VALIDATION CODEBOOK =====
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


===== 30-EPISODE SEND PACK =====
# 30-Episode Validation Send Pack

## Purpose

This is the consolidated `annotator-facing` send pack for the first full `30`-episode interrupted coding work taxonomy study.

Use this file when you want to send one packet that is enough to:

- explain the study round
- tell annotators how to label
- provide the full `30` episode packet
- point to the matching submission sheet

This pack is assembled from the current canonical materials:

- `docs/validation-pilot-episodes.md`
- `docs/validation-30-episode-wave-1.md`
- `docs/validation-30-episode-wave-2.md`
- `docs/validation-codebook.md`
- `docs/validation-annotation-form.md`
- `docs/validation-30-episode-submission-template.md`

Do not send this together with:

- `docs/validation-pilot-provenance-ledger.md`
- `docs/validation-30-episode-hidden-ledger.md`
- expected labels
- author-side source commentary

---

## What This Round Is For

This round is the first full-study annotation packet for the interrupted coding work taxonomy.

The goal is to test the taxonomy on a balanced authored set spanning:

- `REAL`
- `CON`
- `SWE`

The packet preserves anchor cases, boundary cases, and stress cases.

Annotators should classify each episode as written.
They should not use outside provenance, raw logs, or hidden source notes.

---

## Annotator Instructions

Classify each episode as written.

- do not invent facts that are not in the episode
- do not correct the scenario
- do not use outside notes, raw logs, or provenance material
- do not try to guess what the researcher wants
- do not use hidden ledgers or expected labels

Before the round begins, you may read the codebook to understand the label system.
During annotation, decide the labels yourself. Do not use an LLM or any outside aid to choose labels for an annotator response.

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

If `boundary_ambiguous = no`, use:

- `nearest_alternative_class: none`

Use the companion response sheet:

- `docs/validation-30-episode-submission-template.md`
- `docs/validation-30-episode-google-form-kit.md` for Google Form setup

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
- `nearest_alternative_class` as the strongest rival

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

## Quick Tie-Break Reminders

- If multiple visible strands remain plausibly current, prefer `focus_loss` before escalating to later-layer classes.
- If one work is identifiable but competing records disagree about which state governs, prefer `authority_loss`.
- If work and governing state are already clear, but the valid present mode is still `wait`, `ask`, or `escalate`, prefer `readiness_loss`.
- If `act` is already justified and the remaining uncertainty is which concrete next move to take first, prefer `intent_loss`.
- If the main issue is whether the work is truly closed or still governed by a remaining obligation, prefer `closure_loss`.
- If a blocked or waiting state is visible only through a disputed later record, resolve the governing-record dispute first; that remains an `authority_loss` case until the governing record is settled.
- If the governing record is already stable and no newer blocker supersedes it, multiple plausible next edits are an `intent_loss` pattern rather than an `authority_loss` pattern.

---

## Episode Order

This packet contains:

- `5` pilot-seeded episodes
- `10` wave 1 episodes
- `15` wave 2 episodes

Total: `30` episodes

---

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

---

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

---

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

---

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

---

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

---

## Episode E-CON-03

Setting:
A coding agent returns after a short shift in priority during the same workday. Before the interruption, it had been implementing a low-risk cleanup in one area of the repository. During the interruption, a teammate redirected attention to a more urgent bug in a different area, but the earlier cleanup branch and notes still remain visible and recent.

Interruption boundary:
The earlier session stopped when the agent switched away from the cleanup task after the urgent bug was raised, but the switch was not externalized cleanly into the working notes.

Visible records at resume time:
- a recent local note describing the next cleanup edit
- an open bug report and newer team instruction about the urgent bug
- a branch and file context that still make the cleanup task look immediately resumable

What happened before or during the interrupted attempt:
The agent had already made enough progress on the cleanup that the earlier path still feels locally familiar. The urgent bug was acknowledged, but the handoff between the two strands was never stabilized into one explicit current-work record.

Decision pressure:
The easiest move is to reopen the cleanup files and continue the nearly finished change.

Complication:
The main problem is not which record governs one known work item. The main problem is that resumed action still hinges on deciding which work is actually current: the older but locally continuous cleanup task or the newer urgent bug strand.

---

## Episode E-CON-04

Setting:
A coding agent returns to an active repository task whose work item, owner, and target code area are all already clear. The fix itself is understood, and the remaining implementation path looks straightforward. One external dependency, however, has not yet been approved for use in this change.

Interruption boundary:
The previous session stopped after the agent identified the code change it wanted to make but before the required approval arrived.

Visible records at resume time:
- a stable work item for the same fix
- a recent note saying the implementation should wait for approval on the external dependency
- repository cues that still make the code change look easy to perform immediately

What happened before or during the interrupted attempt:
The agent had already narrowed the task to a specific implementation plan. Nothing at resume time suggests that another work item or competing state record should govern instead.

Decision pressure:
The natural temptation is to make the change now because the coding path is visible and the work itself is still clearly active.

Complication:
The unresolved question is whether the present action mode is `act` or `wait`. Work identity and governing state are already settled; what remains uncertain is whether it is permissible to continue before the missing approval arrives.

---

## Episode E-CON-05

Setting:
A coding agent returns to a repository task that appears closed at first glance. The tracker marks the item complete, the patch was merged, and the implementation notes read like a finished story. The appearance of closure, however, depends on a verification step that was never actually recorded as passed.

Interruption boundary:
The earlier session ended after the work was marked complete, before anyone checked whether the final required verification had really happened.

Visible records at resume time:
- a tracker status showing the task as done
- implementation notes that describe the change as complete
- no independent record showing that the required final verification actually succeeded

What happened before or during the interrupted attempt:
The agent had enough success signals to believe the task was closed, so the work was treated as finished at the end of the session.

Decision pressure:
The natural move is to archive the item and focus on something else.

Complication:
The remaining issue is not which work is current and not which state record should govern it. The issue is whether closure was ever valid in the first place, because the final closure condition appears to be missing rather than merely incomplete.

---

## Episode E-CON-06

Setting:
An agent returns to a repository where two partially overlapping strands remain open after a noisy afternoon of interruptions. One strand has an unfinished refactor with an active local branch. The other has a bugfix card that was escalated late in the day and never explicitly assigned back into the working notes.

Interruption boundary:
The earlier session ended before the agent could settle which of the two still-open strands should be treated as current when work resumed.

Visible records at resume time:
- a local branch and note trail for the refactor
- a newer bugfix card flagged as urgent
- open files and recent commands touching both strands

What happened before or during the interrupted attempt:
The agent bounced between the refactor and the bugfix during the same session. Neither strand was closed, and neither was cleanly demoted.

Decision pressure:
The easiest move is to continue the refactor because it has the richer local continuity trail.

Complication:
The problem is not merely that two records disagree about one identified work item. The deeper problem is that the resumed action still depends on triaging which work should be current at all, because both strands remain plausibly live.

---

## Episode E-CON-07

Setting:
A coding agent returns to a repository after a brief gap caused by an environment change. Before the interruption, the local notes and open branch still pointed cleanly to one implementation task. During the gap, an automated status surface refreshed and now shows that a different, later state should govern the next move.

Interruption boundary:
The work paused long enough for the visible environment-facing state to update, but not long enough for the earlier local trail to disappear or become obviously stale.

Visible records at resume time:
- a local note and branch that still point toward the earlier implementation path
- a newer status surface showing that the work state changed during the interruption
- no explicit bridge note explaining why the newer surface should outrank the earlier local trail

What happened before or during the interrupted attempt:
The agent had already oriented around the earlier work path and would have continued it directly if no newer surface had appeared.

Decision pressure:
The straightforward move is to trust the richer local continuity and keep implementing.

Complication:
The key uncertainty is which visible record is entitled to govern the work's current state after the environment shift. The problem is not yet whether the governed action should be `wait` or `act`; it is whether the newer changed-state signal should outrank the earlier local thread at all.

---

## Episode E-CON-08

Setting:
A coding agent resumes a repository task after another model or operator previously handled the same work. The task itself is still known, and the last trusted work record says the change is blocked on one missing ownership confirmation from another team.

Interruption boundary:
The resume point occurs at a handoff boundary: a different actor had been carrying the work, then stopped before the blocker was cleared.

Visible records at resume time:
- a stable work item for the same repository change
- handoff notes describing what remains to be done
- a blocker note saying ownership confirmation is still missing

What happened before or during the interrupted attempt:
The previous actor narrowed the task enough that the implementation path is understandable, but the blocker remained unresolved at handoff time.

Decision pressure:
The incoming agent is tempted to continue implementation anyway because the task itself and the intended change are both legible from the handoff notes.

Complication:
The unresolved issue is not who owns the work and not what the next code edit would be. The unresolved issue is whether the valid present mode is still `wait` or `ask` rather than `act`, because the blocker persisted across the handoff.

---

## Episode E-CON-09

Setting:
A coding agent resumes work immediately after recovering from a failed validation attempt. The failure itself has already been understood and contained, and the work remains active in the same repository area. Two next repairs now look plausible: adjust the implementation directly, or first tighten a related helper that seems to be the actual source of the problem.

Interruption boundary:
The previous session ended at a salient failed validation step, after the failure was localized but before the next repair path was chosen.

Visible records at resume time:
- the failed validation result from the previous attempt
- notes showing that the work is still active in the same strand
- two concrete repair directions that both look locally admissible
- no new blocker or superseding work record

What happened before or during the interrupted attempt:
The agent already resolved the higher-level question of whether it should continue working after the failure. Recovery is underway, but the next concrete repair move is still unsettled.

Decision pressure:
The natural move is to pick one of the repairs quickly and keep momentum.

Complication:
The unresolved issue is no longer whether action is permissible after the failure. The unresolved issue is which concrete next repair should be taken first inside the same governed work strand.

---

## Episode E-CON-10

Setting:
A coding agent returns to a task whose main implementation was genuinely completed in the previous session. A valid completion marker exists and the core change was accepted. At the same time, one follow-up safeguard that was part of the same obligation chain remains open and still governs whether the work can be treated as fully settled.

Interruption boundary:
The earlier session ended after the main implementation was closed successfully but before the residual safeguard was completed.

Visible records at resume time:
- a valid completion marker for the main implementation
- notes indicating that the central change landed as intended
- a later reminder that one still-governing safeguard remains unfinished

What happened before or during the interrupted attempt:
The earlier session had legitimate grounds to treat the main implementation as done, so the done-signal is not fake.

Decision pressure:
The easiest move is to accept the done marker and move on because the primary implementation path is clearly over.

Complication:
The issue is whether the work is fully closed for resumptive purposes or still active because the remaining safeguard continues to govern follow-up action. This is not a false completion; it is a real completion with residual obligation still attached.

---

## Episode E-SWE-03

Setting:
A coding agent returns to a repo-grounded task in the SWE-bench harness area after a short interruption. The earlier local trail still points toward one implementation path, but a newer structured status surface now suggests that the earlier path has been superseded by a different governing state.

Interruption boundary:
The prior session paused while the original path still looked active locally, and the newer governing state became visible only after the interruption.

Visible records at resume time:
- a local note tied to the earlier harness-side path
- an open work trail that still looks coherent in the same area
- a later structured record indicating that the earlier state should no longer govern
- no explicit reconciliation note explaining why the later record outranks the earlier local thread

What happened before or during the interrupted attempt:
The agent had already invested enough attention in the earlier path that it still looks like the easiest continuation route at resume time.

Decision pressure:
The natural move is to resume the earlier path because it has the strongest immediate continuity signal.

Complication:
The unresolved issue is which visible source should govern the work's current state after the interruption. The episode is not primarily about a missing approval or waiting condition; it is about whether the later state transition should override the earlier local continuity.

---

## Episode E-SWE-07

Setting:
A coding agent resumes a repo-grounded task in which the current work is already well identified and the governing state is stable. The same work strand remains active, but the latest trusted state shows that continuation requires escalation before implementation can safely proceed.

Interruption boundary:
The previous session stopped after the agent understood the remaining work but before it performed the escalation needed to unblock the task.

Visible records at resume time:
- a stable repo-grounded work item in the same source area
- a trusted state record showing the work is blocked pending escalation
- repository cues that still make the implementation path look locally actionable

What happened before or during the interrupted attempt:
The agent had already reduced the task to a concrete implementation plan. No competing work strand or newer governing record appears at resume time.

Decision pressure:
The natural temptation is to keep implementing because the code path is visible and the work remains clearly active.

Complication:
The unresolved issue is not which work is current and not which record governs that work. The unresolved issue is whether the valid present mode is still `escalate` or `wait` rather than `act`, even though the implementation path itself is easy to imagine.

---

## Episode E-HIS-02

Setting:
A coding agent resumes a work item from internal prototype history where the current task is already clear and the latest credible work state still points to the same implementation area. The handoff notes say the work remains blocked on one missing ownership confirmation from another team, even though the implementation path itself is already understood.

Interruption boundary:
The earlier session ended after the agent reduced the work to a concrete implementation plan but before the required ownership confirmation arrived.

Visible records at resume time:
- a stable work item describing the same change
- a handoff note marking the work as blocked pending ownership confirmation
- implementation notes that still make the code path look easy to continue

What happened before or during the interrupted attempt:
The previous attempt clarified what to build and where to build it. No competing work strand or rival state record appears at resume time.

Decision pressure:
The natural move is to continue the implementation because the code path still looks locally obvious.

Complication:
The unresolved issue is whether present action is actually permissible. Work identity and governing state are already settled; what remains is whether the correct mode is still `wait` or `ask` rather than `act`.

---

## Episode E-HIS-03

Setting:
A coding agent returns to an internal work item that was archived as finished after a documentation and implementation pass. The tracker shows it as closed, but the closure decision depended on a summary artifact that was never actually created, even though the work was treated as if that final condition had already been met.

Interruption boundary:
The previous session ended when the item was marked done before the missing summary or closure artifact was checked.

Visible records at resume time:
- a done marker on the work item
- notes implying that the task had reached closure
- no summary artifact or equivalent closure evidence where one was expected

What happened before or during the interrupted attempt:
The earlier session had enough progress evidence to make closure feel plausible, so the work was archived without an explicit final verification of the closing artifact.

Decision pressure:
The easiest move is to leave the item closed and spend time elsewhere.

Complication:
The unresolved issue is whether closure ever became valid at all. The problem is not residual follow-up after a real completion; it is that a required closing condition appears never to have been satisfied in the first place.

---

## Episode E-HIS-04

Setting:
A coding agent returns after an internal handoff where one actor closed out their part of the work and left a summary that appears authoritative. At the same time, a newer active-work record points to a different still-open strand that may now govern instead.

Interruption boundary:
The earlier session ended at a handoff boundary, and the next actor resumes with both the closing summary of the old strand and a fresher active-work signal for another strand still visible.

Visible records at resume time:
- a handoff summary that consolidates one completed-looking strand
- a fresher active-work signal pointing to a still-open follow-up strand
- notes that do not explicitly reconcile which record should now govern resumed action

What happened before or during the interrupted attempt:
The previous actor left behind enough structured summary state that it looks legitimate to treat the summarized strand as the main thing to revisit.

Decision pressure:
The natural move is to trust the polished summary because it looks like the most intentional handoff artifact.

Complication:
The unresolved issue is which record is entitled to govern after the handoff boundary. The problem is not that the work is unnameable; it is that the fresher active strand and the more polished closing summary compete to define what should happen next.

---

## Episode E-PUB-01

Setting:
A coding agent returns to a public issue-driven workflow after being pulled away mid-session. Before the interruption, it had been following one visible code-change thread. During the gap, attention shifted to a newer externally reported problem that is now being treated as the urgent item, but the earlier thread still looks active from the local branch and recent notes.

Interruption boundary:
The previous session ended when attention switched to the new public issue, but the switch was not cleanly externalized into one stable current-work marker.

Visible records at resume time:
- a recent local note for the earlier thread
- a newer public issue thread marked as the urgent problem
- branch state and recent files that still make the earlier thread look live

What happened before or during the interrupted attempt:
The agent had already made progress on the earlier code path, so it still feels like the easiest thing to resume.

Decision pressure:
The straightforward move is to continue the earlier thread because it has the richest immediate continuity.

Complication:
The main unresolved issue is which work is currently supposed to govern resumed action. The difficulty is not record precedence inside one known work item; it is triaging between two plausible work strands after a priority shift.

---

## Episode E-PUB-02

Setting:
A coding agent returns to a public-facing development environment where one conversation or runtime still appears active even though another newer strand has already been started. The older strand still shows active-looking status, while the newer strand carries the practical forward motion.

Interruption boundary:
The earlier session ended after the old runtime or conversation was stopped, but the visible status surface did not fully settle before the next strand began.

Visible records at resume time:
- an older strand that still looks active on the status surface
- a newer strand with fresher activity and actual forward progress
- no explicit record saying which strand should now count as current

What happened before or during the interrupted attempt:
The old strand was not cleanly removed from the visible activity field, so it still competes for attention after the resume boundary.

Decision pressure:
The natural move is to click back into the old strand because it still looks live.

Complication:
The resumed decision depends on deciding which of the still-visible strands is truly current. The ambiguity is not only that the status surface is stale; it is that multiple open-looking work candidates remain in view at once.

---

## Episode E-PUB-03

Setting:
A coding agent returns to a public issue environment where one infrastructure surface says the runtime or backend is available, while another surface keeps reporting that startup has not completed and work cannot proceed yet. The same overall task is still in view, but the surfaces disagree about which state should be trusted.

Interruption boundary:
The previous session paused while the system was still waiting on initialization, and the conflicting signals remained visible when the work resumed.

Visible records at resume time:
- one runtime-facing signal showing that the service appears to be up
- another surface continuing to report that startup is still incomplete
- the same user-facing task remaining active through the pause

What happened before or during the interrupted attempt:
The earlier attempt had enough partial success that one signal now suggests the environment is ready, even though the blocking surface never cleared.

Decision pressure:
The easiest move is to trust the surface that looks more operationally positive and continue.

Complication:
The unresolved issue is which visible state source should govern the current work state after the interruption. The episode is not yet about choosing `act` versus `wait` inside a trusted state; it is about deciding which visible state deserves trust at all.

---

## Episode E-PUB-04

Setting:
A coding agent resumes a public agent workflow after a task-tracking or coordination action was issued, but the system then became stuck instead of continuing cleanly. The task itself remains known, and the same work is still active, but the next actor or session does not know whether it is safe to continue execution or whether it must wait for the stuck coordination state to clear.

Interruption boundary:
The earlier session ended at a coordination or task-tracking boundary where the workflow stopped making progress.

Visible records at resume time:
- a stable description of the same active work
- a visible stuck state immediately after the tracking or coordination step
- no competing work strand suggesting a different task now governs

What happened before or during the interrupted attempt:
The task remained understandable and locally actionable, but the workflow never cleanly advanced past the coordination step.

Decision pressure:
The natural temptation is to keep pushing the same task forward because the work itself still looks known.

Complication:
The unresolved issue is whether present action is still permitted after the stalled coordination boundary. Work identity and governing state are both clear; the remaining question is whether to `wait`, `ask`, or `act`.

---

## Episode E-PUB-05

Setting:
A coding agent returns to a public batch-run scenario after the previous session ended before it completed the next command sequence. The same work item is still active, the governing run configuration is unchanged, and action is still allowed, but two immediate next operations now both look plausible: rerun the smaller single-instance path first, or keep pushing the batch path with one adjusted flag.

Interruption boundary:
The previous session ended before the next command sequence was executed, even though the work strand remained stable.

Visible records at resume time:
- a stable work item tied to the same public run configuration
- notes showing that action should continue in the same strand
- two concrete next commands that both look locally defensible

What happened before or during the interrupted attempt:
The agent had already ruled out abandoning the work or switching tasks. What remained unresolved was which concrete next operation should be attempted first.

Decision pressure:
The natural move is to choose one command quickly and keep the run moving.

Complication:
The unresolved issue is not whether action is currently allowed. The unresolved issue is which concrete next operation should be taken first inside the same still-governing work strand.

---

## Episode E-PUB-06

Setting:
A coding agent returns after a public issue thread documented a failed code-edit attempt that produced a syntax-related error and then started looping on closely related failures. The overall work remains active, recovery is justified, and the next session must choose how to repair the failure without re-entering the same loop.

Interruption boundary:
The previous session ended at a salient failure boundary after the first failing repair attempts had already been observed.

Visible records at resume time:
- the earlier syntax-related failure and looping behavior
- the same still-active work item
- two plausible next recovery moves, such as fixing the immediate edit path or first tightening the helper or format assumptions behind it

What happened before or during the interrupted attempt:
The earlier session had already established that the work should continue rather than be abandoned. The failure is understood enough that resumed action is allowed, but the next repair path is not yet fixed.

Decision pressure:
The easiest move is to retry quickly in order to restore momentum.

Complication:
The unresolved issue is which concrete recovery move should be attempted first after the failure boundary. The problem is no longer whether the agent should keep working; it is how to continue without guessing at the next repair.

---

## Episode E-SWE-04

Setting:
A coding agent returns to a repo-grounded SWE-bench source area after another actor or model previously handled the same strand. The work itself is still identifiable, but the new actor inherits both a local trail and a handoff-oriented source record that may redefine what should govern next.

Interruption boundary:
The earlier session ended at a handoff boundary before the successor actor reconciled the inherited local trail with the newer handoff state.

Visible records at resume time:
- a local trail in the same source area
- a handoff-oriented state record describing what now governs
- no explicit reconciliation note saying which of the two should outrank the other

What happened before or during the interrupted attempt:
The earlier actor left enough material that the older path still looks tempting to resume directly.

Decision pressure:
The easiest move is to continue the richer local path rather than reinterpret the handoff state.

Complication:
The unresolved issue is which visible record should define the work's current state after the actor boundary. The work is still nameable; what remains unsettled is record precedence after handoff.

---

## Episode E-SWE-05

Setting:
A coding agent returns to a repo-grounded source area where two plausible work strands are both still visible in the artifact field. One comes from a parser-side trail that still looks active locally. The other comes from a neighboring strand that has stronger recent status cues.

Interruption boundary:
The previous session ended before the agent resolved which of the two visible strands should count as the current work when it resumed.

Visible records at resume time:
- one local work trail with recent edits
- another visible strand with fresher status signals
- repository artifacts supporting both strands as still-live candidates

What happened before or during the interrupted attempt:
The earlier session touched both strands closely enough that each remains a plausible resumed target.

Decision pressure:
The natural move is to continue whichever strand has the thicker local continuity trail.

Complication:
The main unresolved issue is which work is currently supposed to govern resumed action. The problem is not merely picking a trusted record for one fixed work item; it is deciding which work item is current in the first place.

---

## Episode E-SWE-06

Setting:
A coding agent returns to a repo-grounded task after an earlier active-context record remained visible longer than it should have. A newer task has since become the more relevant path, but the stale active-context surface still points to the older strand and makes it look freshly resumable.

Interruption boundary:
The previous session ended before the stale active-context signal was corrected, and the newer task became relevant only after that boundary.

Visible records at resume time:
- a stale active-context surface pointing to the older strand
- a newer work trail indicating that the focus should now be elsewhere
- repository cues that still make the older strand look easy to resume

What happened before or during the interrupted attempt:
The earlier strand had enough local continuity that it still attracts attention at resume time, even though the working focus has shifted.

Decision pressure:
The obvious move is to trust the active-context surface and continue the older strand.

Complication:
The unresolved issue is which work is actually current after the focus shift. The stale surface matters, but the deeper problem is that resumed action still depends on triaging current work identity rather than choosing among records for one already-fixed task.

---

## Episode E-SWE-08

Setting:
A coding agent returns to a repo-grounded task after a plain session cutoff. The same work item is still active, the governing state is stable, and nothing suggests waiting or escalation. Two immediate next edits remain plausible, however, because one source file and one utility layer both look like reasonable starting points for the next change.

Interruption boundary:
The earlier session ended before the next code edit was chosen, even though the governing work state remained unchanged.

Visible records at resume time:
- a stable current work item in the same source area
- no newer record superseding or blocking the work
- repository evidence supporting two different immediate next edits

What happened before or during the interrupted attempt:
The earlier session had already resolved that the work should continue now. The remaining uncertainty was only about which code move should come first.

Decision pressure:
The natural move is to pick one edit quickly and resume execution.

Complication:
The unresolved issue is the concrete next step inside a still-governing work strand. The episode is not about whether action is allowed; it is about which admissible next edit should be taken first after a session cutoff.

---

## Episode E-SWE-09

Setting:
A coding agent returns to a repo-grounded task whose main implementation path appears complete from one set of repository cues. A valid completion marker exists for the primary work, but a later still-governing signal shows that one follow-up obligation in the same area remains unfinished.

Interruption boundary:
The previous session ended after the main path reached a genuine completion point but before the residual follow-up obligation was resolved.

Visible records at resume time:
- a real completion-looking repository signal
- notes indicating the main work path landed successfully
- a later still-governing reminder that one follow-up obligation remains

What happened before or during the interrupted attempt:
The earlier session had good reason to believe the core implementation was done, so the completion marker is not fake.

Decision pressure:
The natural move is to accept the completion signal and move on to another task.

Complication:
The unresolved issue is whether the work is actually closed for resumptive purposes or still active because the remaining follow-up continues to govern action. This is a real done signal with residual obligation attached.

---

## Episode E-SWE-10

Setting:
A coding agent returns to a repo-grounded source area where the work was treated as complete because one completion-looking signal appeared in the repository context. On closer inspection, however, the supposed closure depended on an assumption that was never actually satisfied, so the work may have been closed too early.

Interruption boundary:
The earlier session ended after the completion-looking signal appeared but before anyone checked whether the full closure condition had actually been met.

Visible records at resume time:
- a repository signal that makes the task look done
- no clear evidence that the final required closure condition really happened
- lingering cues that the work may still need attention despite the done-looking state

What happened before or during the interrupted attempt:
The earlier session interpreted the visible completion cue as enough to stop working on the task.

Decision pressure:
The easiest move is to leave the task closed and reuse the apparent done state as proof that it no longer governs action.

Complication:
The unresolved issue is whether closure ever became valid in the first place. The problem is not a real completion with follow-up remaining; it is that the completion-looking state may have been accepted too early without the necessary closing evidence.

---

## Submission Sheet

Use the companion response file:

- `docs/validation-30-episode-submission-template.md`

That file contains one ready-to-fill block for each episode in this pack.


===== 30-EPISODE SUBMISSION TEMPLATE =====
# 30-Episode Validation Submission Template

## Purpose

This template is the simplest copy-and-fill response sheet for the full `30`-episode validation packet.

Use it together with:

- `docs/validation-30-episode-send-pack.md`
- `docs/validation-codebook.md`
- `docs/validation-annotation-form.md`

The field names below match the schema in the annotation form so results can be compared cleanly across annotators.
For Google Form setup, use `docs/validation-30-episode-google-form-kit.md`.

---

## Instructions

- Copy the full block below.
- Keep the field names unchanged.
- Fill every required field.
- Use `none` for `nearest_alternative_class` when `boundary_ambiguous = no`.
- Keep `justification` short and structural.
- Use this template for markdown or document-based collection. Use the Google Form kit for form-based collection.

---

## Blank Template

```md
Episode ID:
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

## Full Submission Sheet

```md
# 30-Episode Validation Submission

Annotator ID:
Annotator Tier:
Annotator Family:

## Episode E-SWE-01
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

## Episode E-SWE-02
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

## Episode E-CON-01
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

## Episode E-CON-02
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

## Episode E-HIS-01
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

## Episode E-CON-03
Episode ID: E-CON-03
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

## Episode E-CON-04
Episode ID: E-CON-04
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

## Episode E-CON-05
Episode ID: E-CON-05
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

## Episode E-CON-06
Episode ID: E-CON-06
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

## Episode E-CON-07
Episode ID: E-CON-07
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

## Episode E-CON-08
Episode ID: E-CON-08
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

## Episode E-CON-09
Episode ID: E-CON-09
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

## Episode E-CON-10
Episode ID: E-CON-10
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

## Episode E-SWE-03
Episode ID: E-SWE-03
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

## Episode E-SWE-07
Episode ID: E-SWE-07
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

## Episode E-HIS-02
Episode ID: E-HIS-02
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

## Episode E-HIS-03
Episode ID: E-HIS-03
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

## Episode E-HIS-04
Episode ID: E-HIS-04
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

## Episode E-PUB-01
Episode ID: E-PUB-01
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

## Episode E-PUB-02
Episode ID: E-PUB-02
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

## Episode E-PUB-03
Episode ID: E-PUB-03
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

## Episode E-PUB-04
Episode ID: E-PUB-04
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

## Episode E-PUB-05
Episode ID: E-PUB-05
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

## Episode E-PUB-06
Episode ID: E-PUB-06
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

## Episode E-SWE-04
Episode ID: E-SWE-04
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

## Episode E-SWE-05
Episode ID: E-SWE-05
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

## Episode E-SWE-06
Episode ID: E-SWE-06
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

## Episode E-SWE-08
Episode ID: E-SWE-08
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

## Episode E-SWE-09
Episode ID: E-SWE-09
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

## Episode E-SWE-10
Episode ID: E-SWE-10
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
