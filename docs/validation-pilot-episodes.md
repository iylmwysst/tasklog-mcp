# Validation Pilot Episodes

## Purpose

This document contains the first `5` authored pilot episodes for the interrupted coding work taxonomy study.

This is the `annotator-facing` packet.
It should be used together with:

- `docs/validation-codebook.md`
- `docs/validation-annotation-form.md`

It should **not** be distributed together with the provenance ledger or expected labels.

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
