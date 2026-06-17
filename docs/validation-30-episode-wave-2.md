# 30-Episode Validation Wave 2 Drafts

## Purpose

This document contains the second authored expansion wave for the `30`-episode taxonomy validation study.

Wave 2 completes the remaining non-pilot candidates by covering:

- historical-internal REAL cases
- public-grounded REAL cases
- the remaining SWE/repo-grounded cases

It should be used together with:

- `docs/validation-codebook.md`
- `docs/validation-annotation-form.md`

It should **not** be sent together with the hidden research ledger for this wave.

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
