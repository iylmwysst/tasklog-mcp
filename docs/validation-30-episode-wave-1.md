# 30-Episode Validation Wave 1 Drafts

## Purpose

This document contains the first authored expansion wave for the `30`-episode taxonomy validation study.

It is not yet the final full-study packet.
Its role is to move the study from a candidate table into concrete episode text for the first authoring-ready tranche.

This wave intentionally prioritizes:

- constructed coverage-floor and boundary cases that can be authored immediately
- a small number of SWE/repo-grounded cases with already-frozen source substrates

It should be used together with:

- `docs/validation-codebook.md`
- `docs/validation-annotation-form.md`

It should **not** be sent together with the hidden research ledger for this wave.

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
