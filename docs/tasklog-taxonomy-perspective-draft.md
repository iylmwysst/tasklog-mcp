# Beyond Memory and Retrieval: A Taxonomy of Interrupted Coding Work

## Abstract

<!--
Rewrite target:
- Open with interrupted coding work as a distinct failure surface
- State that current memory / retrieval / workflow frames are incomplete
- Present the taxonomy and design-gap analysis
- Use benchmark-development history as motivating observations only
- Close with implications for future systems
-->

## 1. Introduction

### 1.1 Interruptions as a Coding-Agent Failure Mode

<!--
Use Thesis B as the opening move:
"Coding agents do not merely lose memory across interruptions; they fail because current work state, authority, and action readiness are not modeled as first-class objects."
-->

### 1.2 Why This Is Not Only a Memory Problem

<!--
Distinguish:
- recall failure
- authority failure
- readiness failure
- next-valid-action failure
-->

### 1.3 Why Current Frames Are Incomplete

<!--
Bridge to related-work section:
- memory systems
- retrieval shaping
- workflow systems
- task interruption literature
all cover adjacent pieces but not interrupted coding work as defined here
-->

### 1.4 Thesis and Contributions

<!--
Target contributions:
1. a taxonomy of interrupted coding-work failures
2. a design-gap analysis against adjacent literatures
3. design requirements for future systems
-->

## 2. Adjacent Frames and Their Limits

### 2.1 Task Interruption and Programming Resumption

<!--
Reuse from old Related Work, but end with:
what this literature does not yet model for coding agents
-->

### 2.2 Agent Memory and Long-Lived LLM State

<!--
Need explicit contrast:
- memory item persistence vs work-state resolution
- cite missing abstraction around authority and readiness
-->

### 2.3 Coding-Agent Workflows and Persistent Development Context

<!--
Position against SWE-agent / AutoCodeRover / workflow papers
-->

### 2.4 Retrieval-Oriented Context Shaping and Benchmark Traditions

<!--
Explain why relevant retrieval != resolved work state
-->

### 2.5 What Remains Missing Across These Frames

Across these adjacent strands, a common limitation remains. Each literature captures part of the interrupted-work problem, but none treats resumptive work state as the primary object of analysis. Task-interruption and programming-resumption studies explain why suspended goals and resumptive cues matter, but they do not model machine-readable work state for coding agents. Agent-memory work externalizes long-lived state, yet usually treats the persistent unit as a memory item, summary, reflection, or retrieved fact rather than as the governing state of one unfinished work item. Retrieval-oriented approaches improve context selection, but relevance is not the same as authority: a highly relevant source may still be stale, superseded, or invalid for action. Coding-agent workflow systems show that software work is iterative and tool-mediated, but they generally optimize issue solving and repository action rather than interruption-boundary state resolution.

What remains missing across these frames is a model of interrupted coding work in which four objects are first-class: current work, authority, readiness, and next valid action. In the setting studied here, the central failure is often not that an agent cannot remember enough context, but that it cannot determine which visible state is entitled to govern action, whether acting is currently valid, or whether the correct outcome is to ask, wait, escalate, or abstain rather than continue. This is the gap the present paper addresses. We therefore treat interrupted coding work not as a special case of generic memory retrieval, but as a distinct failure surface whose structure must be described before it can be reliably solved.

## 3. The Failure Surface of Interrupted Coding Work

### 3.1 Unit of Analysis and Scope

The unit of analysis in this paper is one `resumptive decision episode`: a bounded episode in which an agent or operator must determine, after interruption or handoff, what work is currently governing, what state is authoritative for that work, whether action is currently permitted, and what the next valid action should be. This unit is narrower than the full life of a software task and narrower than general long-term memory. It focuses on the decision boundary immediately before resumed action, because that is where interrupted coding work repeatedly fails despite apparently adequate context.

This scope matters because it keeps the paper from collapsing into a generic account of persistent memory, project planning, or repository understanding. A system may be strong at all of those and still fail at resumption if it cannot determine which unfinished work is current, what evidence is entitled to govern it, and whether the right present outcome is action or non-action. The taxonomy therefore does not attempt to classify every software-engineering agent failure, every retrieval error, or every execution mistake after the correct work has already been identified. Its target is specifically the interruption boundary at which previously ongoing work must be resumed, redirected, delayed, or refused.

### 3.2 Core Objects

#### 3.2.1 Work State

We use `work state` to mean the minimal structured state required to decide what should happen next for one work item at an interruption boundary. A work state is not a full project representation and not a replay of all historical context. It is the smallest state sufficient to determine whether a work item is active, blocked, waiting, superseded, or done, what next valid action follows from that status, and what evidence currently authorizes that conclusion. This definition matters because interrupted coding work often fails not when information is absent, but when the system lacks a compact governing state for one unfinished piece of work.

Treating work state as first-class distinguishes the present framing from both document retrieval and conversational memory. In a retrieval framing, the task is to surface relevant evidence. In a work-state framing, the task is to determine which work item is current and what state transition, if any, it currently permits. A system may retrieve many relevant artifacts and still fail resumptive recovery if those artifacts do not resolve which work is governing, which status is current, and what step is justified now.

#### 3.2.2 Authority

`Authority` refers to the entitlement of a source to govern the resumptive decision for a work item. It is therefore different from mere visibility, recency, or semantic relevance. A source is authoritative in this paper's sense when it can override competing signals for the same work state, reflects the latest accepted state transition for that work, and does not itself depend on unresolved reconciliation with a stronger source. Authority is considered resolved when no competing signal with equal or stronger entitlement remains unreconciled, the selected source is fresh enough to govern action, and that freshness can be checked against current environment or control state when such checks are available.

This notion is central because interruption-boundary failures often occur after the relevant information is already present. The system sees a note, a log, an active context, a tracker status, or a workspace artifact, but cannot decide which of those is entitled to govern the next step. The claim here is not that provenance or source conflict is unknown in neighboring literatures, but that authority has not been centered as a first-class object in current coding-agent accounts of interrupted work recovery.

#### 3.2.3 Readiness

`Readiness` denotes the action mode currently permitted or required at the interruption boundary. We treat readiness as distinct from both work identity and action content because many resumptive failures are not failures of choosing the wrong concrete step; they are failures of attempting action when the correct current outcome is non-acting. The canonical readiness modes used in this paper are `act`, `ask`, `wait`, `escalate`, and `abstain`.

This distinction matters because systems optimized only for continuation pressure will systematically mis-handle interrupted work. A blocked work item may still be correctly identified and backed by authoritative state, yet the correct next move may be to wait for a dependency, ask for one missing fact, escalate for approval, or abstain because authoritative state is still insufficient. Resumptive correctness therefore depends not only on choosing a step, but on choosing whether stepping is currently valid at all.

#### 3.2.4 Next Valid Action

`Next valid action` is the smallest admissible next step consistent with the current work state, the authoritative evidence for that state, and the current readiness mode. We explicitly divide it into two components: `action mode` and `action content`. The action mode determines whether the correct present outcome is to act, ask, wait, escalate, or abstain. Action content determines what concrete step should be taken once the action mode is fixed. This separation is what allows the taxonomy to distinguish `readiness_loss` from `intent_loss`: the former concerns uncertainty about the correct mode, while the latter concerns uncertainty about the concrete step after the mode is already fixed.

This definition also prevents the taxonomy from collapsing into a generic planning account. The next valid action is not the most ambitious conceivable step. It is the next step that is currently justified under the available governing state. A system that chooses a plausible but premature implementation step when the valid present move is escalation or waiting has not partially succeeded; it has failed at the interruption boundary.

### 3.3 Interruption Classes

Interruption classes describe the kind of boundary event that produces a resumptive decision episode. They are not themselves the failure classes of the taxonomy. Instead, they name the boundary condition that creates pressure on one or more of the core objects introduced above. The same interruption class may damage different objects in different cases; for example, a session cutoff may produce either `focus_loss` or `intent_loss`, while an environment-drift episode may ultimately surface as `authority_loss` or `readiness_loss`. This is why the taxonomy separates interruption class from loss class rather than collapsing them into one layer.

The interruption classes proposed here are: `session_cutoff`, `task_switch`, `blocked_waiting`, `environment_drift`, `failure_boundary`, `handoff`, `multi_open_work_conflict`, `false_done`, and `dirty_done`. Together they cover the main ways interrupted coding work becomes resumptively difficult without claiming to exhaust every possible software-engineering interruption. Their purpose is to characterize the boundary event, not to fully explain the downstream failure.

`Session_cutoff` denotes episodes where a prior working session ends before local trajectory is fully externalized or resumed, such as context exhaustion, terminal closure, or abrupt session termination. `Task_switch` denotes episodes where attention or priority ordering is redirected across works, creating uncertainty about which work should now govern. `Blocked_waiting` captures interruptions in which the work remains identifiable but action permissibility depends on missing input, approval, or an unresolved dependency. `Environment_drift` captures cases where the live environment has already changed enough at boundary entry that previously recorded state may no longer be trustworthy. `Failure_boundary` marks episodes where the previous session ended at a failed command, tool invocation, validation step, or permission check, making the correct recovery mode unclear. `Handoff` denotes transfer across model or operator boundary where tacit rationale is lost even if durable artifacts remain; plain session termination without actor change remains `session_cutoff`.

The remaining three classes capture ambiguity that often gets flattened in generic workflow systems. `Multi_open_work_conflict` refers to episodes where several open works remain simultaneously plausible as current, making the difficulty one of competition among candidates rather than simple recall. `False_done` denotes episodes where the system resumes against a completion-looking state even though closure conditions were never actually met. `Dirty_done` denotes episodes where a valid completion marker exists, but unresolved follow-up obligations, side effects, or cleanup conditions mean the work still governs future action. These classes matter because interrupted coding work is often derailed not by missing context alone, but by competition among plausible current truths or by closure signals that are stronger-looking than they are action-entitling.

Table 1 summarizes the interruption classes, their operational definitions, and the wrong behaviors they commonly induce.

| Interruption class | Operational definition | Primary pressure introduced | Typical wrong behavior |
| --- | --- | --- | --- |
| `session_cutoff` | the prior working session ends before state is fully externalized or resumed locally | loss of immediate plan continuity | resume the correct work from the wrong local step |
| `task_switch` | attention is redirected to another work item or priority ordering changes across the interruption | loss of current-work focus | resume the most recent-looking work instead of the true priority |
| `blocked_waiting` | the work remains identifiable but action permissibility depends on missing input, approval, or dependency resolution | readiness uncertainty | continue acting instead of waiting, asking, or escalating |
| `environment_drift` | the live environment has changed enough that prior recorded state may no longer be trustworthy | authority degradation | act on state that has become stale |
| `failure_boundary` | the prior session ended at an execution, tooling, permission, or validation failure | readiness and recovery ambiguity | retry blindly or reopen too much context |
| `handoff` | work passes across model, operator, or session boundary and tacit state is lost | loss of tacit rationale and intent | misread the same artifacts and diverge from the prior trajectory |
| `multi_open_work_conflict` | several open works remain simultaneously plausible as current | focus and authority competition | pick the richest artifact trail instead of the truly current work |
| `false_done` | a closure-looking assertion or state appears even though required closure evidence was never actually satisfied | closure ambiguity | close too early and remove still-active work from consideration |
| `dirty_done` | a valid completion marker exists alongside separately visible residual obligations that still govern follow-up action | closure ambiguity | suppress still-governing follow-up work because completion looks final |

These classes are intended to be mutually distinct at the boundary-event level. A `blocked_waiting` case is not the same thing as a `failure_boundary` case merely because both may result in non-action; the former is dependency-driven while the latter is failed-attempt-driven. Likewise, `session_cutoff` and `handoff` may both yield downstream intent problems, but they differ in whether the principal loss concerns local trajectory or tacit transfer across actors. The same logic applies to `environment_drift`: it is an interruption class because it names what happened at the boundary, namely that live world state changed enough to destabilize prior records. `Authority_loss`, by contrast, names what object is broken in the resumptive decision when that drift makes governing state uncertain. The taxonomy therefore uses interruption classes to characterize how resumptive pressure arises, while later sections classify what object is actually damaged.

### 3.4 Loss Classes

Loss classes identify the primary object that the resumptive episode cannot currently resolve. Unlike interruption classes, which describe boundary events, loss classes describe the location of the failure in the resumptive decision itself. They are therefore closer to the paper's main claim. The central argument of the taxonomy is that interrupted coding work repeatedly fails because one of five objects becomes unavailable or invalid at the point where a next valid action must be produced.

The five loss classes are `focus_loss`, `intent_loss`, `authority_loss`, `readiness_loss`, and `closure_loss`. `Focus_loss` applies when the current-work identity itself is unresolved. `Authority_loss` applies when a plausible work state is visible but the system cannot determine why one state source should govern action over competing signals. `Readiness_loss` applies when the work and trusted state are known but the correct action mode remains unresolved: the system does not know whether it should act, ask, wait, escalate, or abstain. `Intent_loss` applies later in the chain, once readiness is fully resolved to a single valid mode and only the concrete next step remains unclear. `Closure_loss` applies when the work's completion status is the main unresolved object, such that the system cannot tell whether the work is truly done, falsely marked done, or still action-governing because follow-up obligations remain despite a completion marker.

This ordering is deliberate. In interrupted coding work, not all uncertainties are equally fundamental. If the current work is unknown, there is no stable basis for downstream reasoning. If the current work is known but authority is unresolved, the system may still act on the wrong governing truth. If work and authority are fixed but readiness is unresolved, even a plausible concrete step may be invalid now. Only after these conditions are satisfied does it make sense to ask whether the system still lacks the concrete content of the next valid action.

Table 2 defines the loss classes operationally.

| Loss class | Operational question that fails | Inclusion rule | Exclusion rule |
| --- | --- | --- | --- |
| `focus_loss` | `Which work is truly current?` | use when current-work identity is unresolved | do not use if the work is known but action is unclear |
| `authority_loss` | `Why should this state be trusted over competing signals?` | use when the problem is adjudicating between sources or validating state freshness | do not use if the trusted state is known and the dispute is only about action mode or content |
| `readiness_loss` | `Which action mode is currently valid: act, ask, wait, escalate, or abstain?` | use when the main uncertainty is whether action is currently permitted or what non-acting mode is required | do not use if the action mode is already determined and only the concrete next step is unresolved |
| `intent_loss` | `Given the fixed action mode, what concrete next step should be taken?` | use when the correct action mode is already known but action content is unresolved | do not use if the main uncertainty is whether the agent should act, ask, wait, escalate, or abstain |
| `closure_loss` | `Is this work actually done or still active?` | use when closure state is the main unresolved object | do not use if the work remains clearly active but blocked |

Two boundaries deserve emphasis because they are the easiest places for the taxonomy to collapse. First, `authority_loss` is not the same as `focus_loss`: a system may know which work is current yet still fail to determine which visible source is entitled to govern that work's state. Second, `readiness_loss` is not the same as `intent_loss`: a system may know that the correct current mode is `act` and still not know what concrete next step to take, while a different system may know several plausible concrete steps yet still fail because the correct current mode is actually `wait` or `escalate`. Third, `closure_loss` may obscure downstream focus by making a falsely completed item disappear from the candidate set, but the dominant-assignment rule still treats focus as prior only when current-work identity is genuinely unresolved at the interruption boundary. The taxonomy insists on these distinctions because interruption-boundary errors often arise from choosing action under the wrong mode rather than from choosing the wrong action content under the correct mode.

### 3.5 Dominant-Assignment Rule

Many resumptive episodes contain several plausible problems at once. A task switch may also involve stale evidence, a failed command may also obscure the next concrete step, and an apparent completion may coexist with unresolved follow-up. To keep the taxonomy usable, each episode should therefore receive one `dominant loss class`: the first missing or invalid object whose resolution is necessary before a safe next valid action can be produced. This rule does not deny that multiple pressures may coexist. Its purpose is to prevent classification from collapsing into an undisciplined list of everything that seems relevant in the case.

The dominant-assignment order in this paper is deliberately asymmetrical. If the current work itself is unresolved, the episode should be assigned `focus_loss`. If the work is known but the system cannot determine which visible state is entitled to govern action, the episode should be assigned `authority_loss`. If work and governing state are fixed but the correct action mode remains uncertain, the episode should be assigned `readiness_loss`. Only after those conditions are satisfied should an episode be assigned `intent_loss`, namely when the action mode is already fixed but the concrete next step remains unclear. `Closure_loss` applies when the remaining unresolved object is whether the work is actually done or still action-governing. When closure failure causes work to disappear from the candidate set, the dominant class at the interruption boundary is still `focus_loss`, while `closure_loss` remains the triggering condition rather than the dominant assignment. A higher-priority class should dominate only when the corresponding governing object must be resolved before any safe downstream inference is possible.

This order follows the dependency structure of safe resumption. Without focus, there is no stable basis for downstream reasoning. Without authority, any action may still be grounded in the wrong governing truth. Without readiness, even a plausible action content may be invalid now. Only then does it make sense to ask whether the system still lacks the concrete content of the next valid step. The dominant-assignment rule is therefore not just a convenience for labeling cases. It expresses the deeper claim that interruption recovery should resolve the earliest broken governing object before it expands outward into broader context recovery or action planning.

### 3.6 Auxiliary Recovery States

The paper's primary claim concerns interruption classes and loss classes, not recovery states. Even so, a secondary recovery-state layer is useful because it shows how a continuity system may move through an interruption-boundary episode once recovery begins. This layer should therefore be treated as auxiliary rather than load-bearing. It helps explain how systems may operationalize the taxonomy, but it should not displace the paper's main argument about the objects that are actually damaged at the resumptive boundary.

Table 3 names seven recovery states that commonly arise during resumptive resolution.

| Recovery state | Meaning | Exit condition |
| --- | --- | --- |
| `unresolved` | no safe current-work candidate exists yet | a candidate work is identified |
| `candidate_found` | a work candidate exists but still needs authority or freshness validation | authority and freshness are sufficiently resolved |
| `waiting_one_fact` | one specific fact blocks safe resolution | the missing fact is obtained or the system abstains |
| `blocked` | the work is known but the valid action mode is not `act` | the blocker clears, the required actor responds, or the system escalates or abstains |
| `stale` | previously recorded state is no longer trustworthy without revalidation | live state is reverified or action is withheld |
| `ready` | current work and next valid action are both sufficiently justified | action is taken or passed onward |
| `done_pending_close` | substantive work appears complete but lifecycle closure is unresolved | the work is closed cleanly or reopened as follow-up |

These states should not be confused with the loss classes above. `Stale`, for example, is not a sixth loss class alongside `authority_loss`; it is a recovery-process state that may arise while an authority problem is being resolved. Likewise, `waiting_one_fact` is not a replacement for `intent_loss` or `readiness_loss`; it describes the minimal subcase in which one missing fact prevents safe classification or action, whereas multi-fact, external-actor, or open-ended non-action conditions resolve to `blocked`. `Done_pending_close` is also not equivalent to `closure_loss`: the latter names the dominant failure in classifying the episode, while the former names the recovery-process state after the system has already recognized that closure must still be resolved. Keeping this layer subordinate helps preserve the paper's main claim while still showing how interruption-boundary failures may be processed in practice.

### 3.7 Representative Examples

Representative examples help show that the taxonomy is not tied to one narrow implementation. The cases below are phrased generically, although they are informed by the benchmark-development history behind this work. They are intentionally single-pressure examples chosen for classification clarity rather than full cascades through multiple loss classes.

In a `stale active context` episode, the visible session context still points to work X, but a later structured state record shows that work X was superseded by work Y. The agent resumes work X because the visible context is richer and easier to follow. This is a `multi_open_work_conflict` case because two explicit current-work candidates remain visible without a trustworthy tie-break; the dominant loss is `authority_loss`, because the failure lies in selecting the wrong governing state rather than in total ignorance of plausible work candidates.

In a `known work, invalid action` episode, the correct work is obvious and the governing state is trusted, but the work is blocked pending approval or missing input. The valid current outcome is to wait, ask, or escalate, yet the agent continues implementation anyway. This is a `blocked_waiting` interruption whose dominant loss is `readiness_loss`, because the system fails at action mode rather than at work identity or source selection.

In an `intent-loss after valid mode` episode, the current work is known, the authoritative state is trusted, and the correct action mode is clearly `act`, but two concrete next steps remain plausible. One missing implementation detail determines whether the agent should edit file A first or patch file B first, yet the agent guesses without resolving the underlying detail or expands context far beyond what is needed instead of resolving the specific next step. This is an `intent_loss` case because the action mode is already fixed and only the concrete action content remains underdetermined.

In a `false done` episode, the artifact trail looks complete enough to imply closure, but the completion signal was recorded before the actual closure boundary was satisfied. The agent archives the work instead of reopening it as still active. This is a `false_done` interruption with dominant `closure_loss`.

In a `dirty done` episode, a valid completion marker exists for the main implementation step, but a required cleanup, handoff, or closure-adjacent obligation still governs what must happen next. The agent suppresses that follow-up because the completion marker looks final. This is a `dirty_done` interruption with dominant `closure_loss`.

A contrastive `stateless agent` example shows that the taxonomy does not depend on Tasklog at all. Suppose an agent re-enters work by scanning only recent diffs, issue text, and chat history, with no explicit work-state representation. Two unfinished goals remain plausible, and the agent picks the one with richer textual evidence rather than the one with stronger current authority. The interruption class may be `multi_open_work_conflict`, but the dominant loss is `focus_loss`: the system cannot reliably determine which work is actually current.

A second contrastive case comes from an `over-structured tracker`. A project-management system marks a work item as `in progress`, while a more recent engineering-side state transition shows that the work is blocked pending approval. The agent trusts the more structured tracker view and keeps executing. This case matters because it shows that interruption-boundary failure can arise not only from too little state but also from the wrong state source winning. The dominant loss here is `authority_loss`; only after the governing source is corrected would the blocked non-action mode become visible.

## 4. Design Gap Analysis

### 4.1 Why Memory Recall Is Insufficient

Memory recall is insufficient because interrupted coding work does not fail only when facts are forgotten. In many resumptive episodes, the necessary information is already visible somewhere in the artifact field: a session log, note, work item, tracker status, or workspace cue. As Section 3 defines the problem, failure may still arise because the system cannot determine which of those visible states is entitled to govern the next step, whether the state is still fresh enough to trust, or whether acting is currently valid at all. A memory system can therefore retrieve more without resolving the governing conditions of safe resumption.

This claim should be read against memory systems that optimize broad persistence and later recall, such as long-lived agent-memory architectures in the vein of MemGPT or Reflexion-style externalized summaries and reflections. Those systems aim to preserve, prioritize, or resurface useful state over time. MemGPT's hierarchical memory management and Reflexion's reflection weighting overlap partially with the problem by organizing or prioritizing what should be reused later. The gap argued here is narrower: prioritization-for-recall does not by itself determine entitlement-for-action at the resumed decision boundary for one interrupted work item.

This matters especially at the interruption boundary. A system may remember the issue, the prior plan, the latest files, and even a partial summary of what happened before the interruption, yet still fail because it cannot determine whether the work remains active, whether a more recent blocker overrides the visible plan, or whether the correct outcome is to abstain pending verification. Treating interrupted coding work as a recall problem alone therefore leaves the governing decision implicit rather than resolved.

### 4.2 Why Retrieval Relevance Is Insufficient

Retrieval relevance is insufficient because relevance and authority are not the same object. A source may be semantically relevant to the interrupted work and still be stale, superseded, or normatively weaker than another source for deciding what should happen next. Retrieval systems optimize which artifacts are likely to help. Interrupted coding work additionally requires deciding which artifact, if any, is entitled to govern action now.

This claim should be read against retrieval-oriented systems and research programs that optimize context selection, such as RAG-style retrieval pipelines and repository-aware coding agents that try to surface the most useful supporting artifacts for the current question. In those systems, the target is usually to retrieve the most helpful supporting evidence for the current generation step. In provenance-sensitive interruption cases, however, a rich note, active-context remnant, or issue description may be highly relevant to the topic of the work while still being the wrong basis for resumption if a later structured state transition or blocker update supersedes it. In those situations, improving retrieval ranking alone does not solve the underlying problem. The missing step is not simply better relevance estimation, but the authority question formalized in Section 3.2.2: which candidate state is actually entitled to govern resumed action.

### 4.3 Why Workflow Visibility Is Insufficient

Workflow visibility is also insufficient. Many coding-agent systems already expose issue state, task lists, repository status, or execution traces, and these surfaces are clearly useful. But a visible workflow is not yet a governing resumptive state. Seeing that a task exists, that a branch changed, or that a command failed does not itself resolve which work item is currently primary, what evidence authorizes that conclusion, and whether the present mode should be action or non-action.

This claim should be read against workflow-oriented coding-agent systems that expose issue execution state, tool traces, or repository progress, including issue-solving systems in the vein of SWE-agent or AutoCodeRover. These are not primarily session-management systems; they are cited here only as boundary cases because they surface issue context, repository state, and tool-mediated progress in ways later readers may inspect. The gap argued here is that visibility into workflow progress does not by itself determine which visible state is entitled to govern the next move after interruption.

The gap is especially clear in multi-work or blocked-work cases. A dashboard may show several open tasks, recent changes, and pending failures while still leaving the system unable to choose the true current work or the correct present action mode. Workflow visibility therefore contributes evidence, but it does not by itself supply the authoritative work-state reasoning required at resumption boundaries.

### 4.4 Why Interrupted Coding Work Requires Work-State Reasoning

Interrupted coding work requires work-state reasoning because the resumptive problem is not merely "what information should be shown?" but "what governing state should decide the next move?" The taxonomy in Section 3 argues that resumed action depends on an explicit account of the current work's governing state rather than on retrieved context alone. Without such an account, continuity systems tend to fall back on broad retrieval over heterogeneous artifacts or on visibility surfaces that still leave the governing state implicit.

Work-state reasoning also changes what counts as a successful recovery. Success is not simply producing a plausible action or restating prior context. It is producing a justified next valid action, using the readiness modes and next-valid-action framing defined in Sections 3.2.3 and 3.2.4. The gap argued here is negative rather than mechanistic in the sense that the contribution is to identify a missing object of analysis, not yet to specify a solution architecture. Adjacent systems may preserve context or expose workflow successfully while still leaving the resumed decision underdetermined.

### 4.5 Authority as a Missing Object in Current Coding-Agent Framing

The argument of this paper is not that provenance, trust, belief revision, or source conflict are absent from adjacent research. Those literatures clearly study how systems distinguish stronger from weaker evidence, how conflicts are resolved, and how state should be updated under competing signals. The narrower claim here is not that no prior work addresses source selection. Rather, we are not aware of prior work in the programming-resumption and interrupted-work literature that isolates source entitlement as a first-class object for resumed coding-agent action. That scope qualifier matters: the claim is about the interrupted coding-work framing, not about all research on evidential ordering under conflict. In the programming-resumption literature, work such as Parnin and Rugaber or DeLine and Parnin studies resumptive cues and context recovery for human programmers rather than machine-readable source entitlement. In memory-oriented agent work, systems such as MemGPT or Reflexion do overlap partially with this problem because they prioritize and reuse persistent state over time, but they do not expose an explicit object that says which visible state is currently entitled to govern one interrupted work item. In workflow-oriented coding-agent systems, state is often visible, but the entitlement of one visible source to override another remains implicit inside the workflow representation rather than being isolated as a separate object.

This distinction matters because many resumed-action failures occur after the relevant information is already present. The system does not fail because no evidence exists; it fails because it cannot decide which visible state is entitled to govern action and whether that state remains fresh enough under current environment conditions. Authority in this paper therefore names a coding-agent interruption problem rather than a universal theory of source conflict. The contribution is to make that object explicit in the specific setting of interrupted coding work, where the core analytic gap is not information absence alone but unresolved source entitlement at the resumptive boundary.

## 5. Observations From Building and Testing Tasklog

### 5.1 What V1 Revealed

<!--
Weaker baselines are not the hard problem
-->

### 5.2 What V2 Revealed

<!--
Provenance-sensitive ambiguity matters
-->

### 5.3 What V3b Revealed

<!--
A narrow structured signal exists, but not enough to carry the whole paper
-->

### 5.4 What V4.1 Pressure Revealed

<!--
The old framing remained too tool- and benchmark-centered
-->

### 5.5 Why These Are Observations, Not the Core Claim

<!--
Explicitly keep this section subordinate.
Do not invest major writing effort here yet.
This section is intentionally deferred because the evidence package may change.
Use it later as supporting observations only, not as the spine of the paper.
-->

## 6. Design Requirements for Future Systems

### 6.1 Work as the Primary Continuity Object

### 6.2 Explicit Authority Semantics

### 6.3 Explicit Readiness Modes

### 6.4 Non-Action Outcomes as First-Class Outputs

### 6.5 Pre-Action Verification as an Emerging Requirement

<!--
Talk only about What / Why, not How
-->

## 7. Discussion and Research Agenda

### 7.1 Implications for Coding-Agent Evaluation

### 7.2 Implications for Runtime Continuity Systems

### 7.3 Open Research Questions

### 7.4 From Taxonomy to Mechanism

<!--
Bridge to divergence-gate paper
-->

## 8. Limitations

### 8.1 Author-Derived Taxonomy Risk

### 8.2 External Validation Still Limited

### 8.3 No Full Mechanism Proof in This Paper

### 8.4 Boundary Cases and Class Stability

## 9. Conclusion

<!--
Close as a perspective / taxonomy paper, not as a tool pitch
-->
