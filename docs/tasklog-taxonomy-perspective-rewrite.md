# Beyond Memory and Retrieval: A Taxonomy of Interrupted Coding Work

## Abstract

We propose a taxonomy of interrupted coding work organized around four primary objects: current work, authority, readiness, and next valid action, with authority as the pivotal object that links visible records to justified resumed action. On top of these objects, we distinguish interruption classes, loss classes, dominant assignment, and auxiliary recovery states.

After an interruption, a coding agent may return to a repo with many relevant traces still visible: an issue description, a recent note, a tracker status, an active-context remnant, and a newer blocker update. The failure is often not that information is missing. The failure is that the system cannot determine which visible state is entitled to govern resumed action. We argue that this authority problem is central to interrupted coding work and is not adequately captured by memory recall, retrieval relevance, workflow visibility, or durable goal structure alone.

We use the taxonomy to explain a conceptual gap in adjacent literatures: memory systems prioritize persistence and later recall, retrieval systems prioritize relevance, workflow systems prioritize visible progress, and classical practical-reasoning traditions formalize durable intentions and commitment revision, yet resumed correctness in coding work still depends on record-level entitlement at the interruption boundary.

The paper is grounded in iterative prototype development, structured failure analysis, and repeated reframing under resumptive pressure, but its contribution is conceptual rather than product-specific. It defines a missing analytical layer for coding-agent resumption and derives implications for future continuity systems, evaluation protocols, and downstream mechanism work. The central claim is that future systems should optimize not only for carrying more context forward, but for recovering the right work state under minimal inherited session state.

## 1. Introduction

### 1.1 Interruptions as a Coding-Agent Failure Mode

Consider a simple resumption failure. A coding agent returns to a repository after a pause. The visible active context still points to work X. The issue thread is still open. A rich note explains the intended next edit. But a later structured state record says that work X was blocked pending approval and that work Y now governs. Both states are relevant to the same overall task. Only one of them should decide what happens next. If the agent keeps implementing work X, it has not failed because it lacked context. It has failed because it trusted the wrong visible state.

That example names the failure mode this paper is about. Coding agents do not merely lose memory across interruptions; they fail because resumed action depends on a governing work state that is rarely made explicit. In practical software work, progress is repeatedly broken by session limits, handoffs, failed validations, branch changes, environment drift, waiting states, and priority switches. When work resumes, the central problem is deciding what work is current, which source is authoritative for that work, whether acting is valid now, and what the next justified move should be. Interruption and programming-resumption research has long treated this recovery boundary as its own difficulty rather than as a simple recall failure (Trafton et al., 2003; Parnin and Rugaber, 2009; DeLine and Parnin, 2010). Section 2.1 returns to that lineage in more detail.

We call this the failure surface of interrupted coding work. The term is intentionally narrower than general long-term memory and narrower than end-to-end software-agent performance. It refers to the bounded resumptive episode in which an agent or operator must recover the governing state of previously ongoing coding work after interruption or handoff. The claim of this paper is that this episode has enough recurring structure to justify its own taxonomy. And the object at the center of it is not memory. It is authority.

### 1.2 Why This Is Not Only a Memory Problem

At first glance, interrupted coding work can look like a memory problem. The prior issue, the latest plan, the work notes, the changed files, or the recent conversation may no longer fit in the active context window, so the obvious response is to preserve more context, summarize better, or retrieve more effectively later. That response is often useful, but it is incomplete. Contemporary agent-memory systems have made exactly this persistence question serious, whether through hierarchical long-lived memory, reflective summaries, architectural memory decomposition, or explicit memory layers (Packer et al., 2023; Shinn et al., 2023; Sumers et al., 2023; Zhang et al., 2024; Chhikara et al., 2025). In the work X case, both states were present. The blocker record was there. The active context was there. Memory was not the problem.

This is why the protagonist of the paper is not memory but authority. A stale note and a fresh structured blocker can both be remembered. A summary and a later status transition can both be retrieved. The hard part is not merely surfacing them. The hard part is deciding which one is entitled to govern the resumed decision. Once authority is unresolved, readiness often becomes unresolved with it: the system no longer knows whether it should act, ask, wait, escalate, or abstain.

This distinction becomes sharper as coding agents are used across multiple sessions or long-running harnesses. A design optimized only for carried-over context treats continuity as a problem of retaining more of the prior conversation. But accumulated conversational residue is not the same as governing work state. It can be stale, superseded, or structurally misaligned with the resumptive decision the system now faces. Recent systems work on long-horizon agents and KV-cache management reinforces the same lesson from another direction: carrying ever more context forward is not free (Wang et al., 2026; Wu et al., 2026). Long-lived context creates memory pressure, operational cost, cache-management constraints, and more room for stale state to remain silently influential. The stronger target for continuity is therefore reliable recovery under limited inherited session state, not unlimited retention.

### 1.3 Why Current Frames Are Incomplete

The role of the next section is to map five near-misses. Each neighboring literature gets close to the work X problem from a different direction, but each stops one layer too early. That residue matters especially in coding work, where environment drift is rapid, side effects are often hard to reverse, and continuation pressure can push the system into irreversible action under the wrong governing record.

### 1.4 Methodological Grounding

The taxonomy is not offered as armchair speculation. It was refined through iterative prototype development, structured failure analysis across multiple resumptive cases, and repeated classification exercises that exposed recurring patterns not cleanly captured by adjacent framings. Those repeated pressures are one reason `authority` and `readiness` became the load-bearing objects of the present account.

The contribution of this paper, however, is still analytical rather than empirical. The goal here is to define the failure surface, the missing objects, and the design implications clearly enough that later mechanism and evaluation papers can test them more directly. For that reason, the present manuscript does not turn its development history into an empirical-results section. It uses that history only to show that the taxonomy emerged from repeated contact with resumptive failures rather than from purely theoretical decomposition.

### 1.5 Thesis and Contributions

The thesis of this paper is that interrupted coding-agent work is not adequately explained by memory, retrieval, workflow visibility, or durable goal structure alone. It requires a work-state-centered taxonomy of failure organized around current work, authority, readiness, and next valid action, with record-level entitlement as the pivotal object that turns visible state into justified resumed action.

The paper makes three contributions. First, it defines interrupted coding work as a distinct failure surface and proposes a taxonomy spanning interruption classes, loss classes, dominant assignment, and auxiliary recovery states. Second, it identifies record-level entitlement over competing persisted records as the most under-modeled object in current resumption accounts and uses the taxonomy to show why persistence, relevance, workflow visibility, and durable goal structure each remain insufficient on their own. Third, it derives design requirements and a research agenda for future continuity systems, including explicit authority semantics, explicit readiness modes, and stronger pre-action verification at resumptive boundaries.

The contribution is conceptual rather than mechanistic. Its aim is to sharpen the object of study and make future system design and evaluation more coherent. A later mechanism paper can then test one concrete response to this taxonomy through pre-action divergence checks.

## 2. Adjacent Frames and Their Limits

This section is organized around five near-misses. Each adjacent frame captures a real part of interrupted coding work, and each helps explain why the problem is hard. But each one stops one layer too early in a different way. The point of the section is not to dismiss neighboring literatures. It is to show why the protagonist of this paper, authority at the resumed decision boundary, remains analytically underexposed.

### 2.1 Task Interruption and Programming Resumption

This is the oldest near-miss and still the deepest one. The interruption and programming-resumption literature correctly sees that resumed work fails before any downstream task-solving can even begin. Foundational work by Trafton and colleagues and by Altmann and Trafton shows that interruption cost is not only a matter of forgetting facts. Recovery depends on suspended goals, resumptive cues, and the conditions under which a prior task can be re-entered efficiently rather than hesitantly (Trafton et al., 2003; Altmann and Trafton, 2004). Matthews and colleagues extend this line by showing that interface-level information design can improve reacquisition (Matthews et al., 2006). Iqbal and Horvitz further broaden the picture by showing that disruption and recovery are not laboratory curiosities but recurring design problems in real computing environments (Iqbal and Horvitz, 2007a, 2007b).

Within software engineering, Parnin and Rugaber and later DeLine and Parnin provide the closest pre-LLM grounding for our problem. Their work shows that interrupted programming tasks are difficult to resume and that external cues, summaries, and note-like supports can materially affect reacquisition quality (Parnin and Rugaber, 2009; DeLine and Parnin, 2010). This is crucial background because it legitimizes the basic problem. Resumption is not a synthetic inconvenience invented by modern agent tooling; it is a long-standing property of programming work itself.

What it does not yet provide is a machine-facing account of governing state. It was developed for human programmers and for cue design in developer-facing environments. It does not formalize machine-readable work state, source entitlement, action readiness, or the distinction between resumed work identity and resumed action validity for coding agents. In the work X case, the problem is not that resumptive cues are absent. Both the active context and the blocker record are good cues. The problem is that cue design alone cannot settle which one is authoritative. The interruption literature therefore explains why the problem matters, but not yet what a coding-agent taxonomy of interrupted work should look like.

For interrupted coding work, the implication is that good resumptive cues are necessary but not sufficient. A continuity system must represent which work currently governs and what record is entitled to define its present state, rather than assuming that richer cues alone will make the resumed decision safe.

### 2.2 Agent Memory and Long-Lived LLM State

Memory work is the most obvious modern near-neighbor because it has already elevated persistence into a serious design object. Systems such as MemGPT, Reflexion, and Mem0, together with broader architectural accounts such as CoALA and recent memory surveys, ask how agents should preserve, organize, retrieve, and reuse state across extended interaction (Packer et al., 2023; Shinn et al., 2023; Sumers et al., 2023; Zhang et al., 2024; Chhikara et al., 2025). This literature matters because it has made persistent state a serious design object rather than a prompt hack. It has also clarified that memory can be represented in multiple forms: summaries, reflections, compressed traces, salient facts, episodic buffers, and external stores.

The fit is still incomplete because memory work usually asks what information should survive and become reusable later. The persistent unit is often a memory item, a reflection, a summary, or a useful fact. Our paper asks a narrower and different question: what governs one interrupted piece of coding work at the moment of resumption? That question cannot be answered by persistence alone, because the system may remember several plausible artifacts without knowing which one is currently entitled to govern action.

In the work X case, a memory system that preserved both the active context and the blocker record would still leave the central question unanswered. Both persisted records survive. The system still does not know which one governs. This is where `authority` and `readiness` begin to matter. The gap is therefore not that memory is irrelevant. The gap is that persistent memory does not by itself resolve the governing state of interrupted coding work.

The design implication is that persistent memory has to be subordinated to a governing work-state layer. A continuity system needs not only to preserve usable records, but also to decide which preserved record is currently entitled to govern one interrupted work item.

### 2.3 Coding-Agent Workflows and Persistent Development Context

Workflow and coding-agent papers get a different part of the story right: software work is procedural, iterative, and full of intermediate state. ReAct, MetaGPT, SWE-agent, AutoCodeRover, traceability-oriented studies, and vision pieces on intelligent development environments all contribute to a broad picture in which software-agent performance depends on structured interfaces, iterative workflows, tool-mediated action, and visible intermediate state (Yao et al., 2022; Hong et al., 2023; J. Yang et al., 2024; T. Yang et al., 2024; Marron, 2024; Ceka et al., 2025).

These papers also help explain why our problem is timely. Once agents participate in iterative software work, interruptions, handoffs, validation failures, and cross-session resumptions become normal rather than exceptional. Workflow systems and traces move us closer to the right setting because they show that coding agents benefit from explicit structure and that software work is increasingly distributed across artifacts, tools, and actors.

But workflow visibility still leaves an analytical gap. A visible issue board, trace, or repository state does not automatically determine which work is currently primary, which source governs resumed action, or whether the next valid move is action or non-action. Workflow systems help make state visible; they do not yet isolate the governing resumptive state as a separate object. Our paper builds on this literature while arguing that interruption-boundary correctness still requires a work-state-centered layer that the workflow framing alone does not supply.

In the work X case, workflow surfaces show both the old trajectory and the newer blocker. The system still cannot decide which record governs. Visibility helps, but it does not settle precedence.

The implication is that workflow-aware systems need an explicit resumptive layer above visibility. Making traces, boards, and repository state legible is useful, but interrupted coding work still requires a representation that decides which visible state outranks the others and whether action is valid now.

### 2.4 Classical Practical Reasoning, Intentions, and Commitment

Classical practical-reasoning traditions also matter here, especially BDI-style work on beliefs, desires, intentions, commitment, and intention reconsideration. This tradition is a serious near-neighbor because it already formalizes several issues that resemble parts of the present taxonomy: durable goals, commitment persistence, reconsideration under changing beliefs, and conditions under which action should or should not proceed (Bratman, 1987; Cohen and Levesque, 1990; Rao and Georgeff, 1991; Schut et al., 2004). Any account of interrupted agent behavior that ignores this tradition risks overstating its own novelty.

The overlap is real, especially on the `readiness` side of the taxonomy. A BDI framing predicts that interrupted agents should succeed once they preserve the current intention clearly enough and reconsider it when beliefs change. That framing is strong as far as it goes. It explains why durable goal structure and commitment revision matter, and it likely absorbs part of the novelty space around readiness, commitment, and permission to act.

But the work X case fails on a different dimension. A BDI account would ask which intention remains committed after the blocker arrives and whether the belief state now requires reconsideration. That is a serious part of the picture. It still leaves unresolved which persisted record should override the others at the resumption boundary: the richer active-context trace, the open issue thread, or the later structured blocker record that transfers governance to work Y. The distinction is not merely external versus internal state. It is that the coding-work problem studied here lives at the level of adjudication among competing persisted records in the artifact field, each of which may remain visible, relevant, and partially credible at once. Belief revision says how an agent should update what it takes to be true. The authority problem here asks which visible record is entitled to cause that update for one interrupted work item in the first place. Our claim is therefore narrower than a new general theory of practical reasoning. `Authority` is best understood here as a domain-specific operationalization of a broader source-precedence problem that practical-reasoning traditions treat more abstractly. BDI architectures illuminate reconsideration and commitment, but they are not primarily operationalized around notes, trackers, logs, workspace cues, superseding state transitions, and other heterogeneous persisted records whose precedence must be settled before resumed coding action can be justified.

The implication is not that BDI-style structure becomes irrelevant, but that interrupted coding systems need one more layer between belief revision and action: an explicit account of which persisted record gets to drive belief update and readiness assessment for the current work item.

### 2.5 Retrieval-Oriented Context Shaping and Benchmark Traditions

Retrieval work is the sharpest foil because it comes closest to saying, "this is just a better context-selection problem." Foundational RAG work, in-context retrieval augmentation, robustness studies such as Yoran and colleagues, and code-domain retrieval systems such as RepoCoder and RepoFusion all show that the shape and quality of retrieved context materially affect downstream reasoning (Lewis et al., 2020; Ram et al., 2023; Yoran et al., 2023; Zhang et al., 2023; Shrivastava et al., 2023). More recent context-engineering work for long-horizon agents strengthens this point further by showing that context growth, compression, and selection are now central design problems rather than implementation details.

This bucket matters because a skeptical reader could reasonably ask whether interrupted coding work is just another context-selection problem. Perhaps the right response is not a new taxonomy, but better retrieval, better compression, or more careful plan-aware context shaping.

Our answer is that retrieval relevance and governing work state are not the same object. In the work X case, both records are relevant. That is exactly why retrieval alone cannot settle the problem. A note, issue description, active-context remnant, or repository artifact may be highly relevant to the work and still be the wrong basis for resumed action if a later blocker, superseding transition, or stronger state record overrides it. Retrieval literature helps explain why more context is not always better and why irrelevant context can hurt. But it still usually optimizes around helpfulness or relevance. The present paper argues that interrupted coding work additionally requires authority-sensitive resolution of what record is entitled to govern resumed action.

The design implication is that retrieval for interrupted coding work cannot optimize only for relevance. It also needs a way to rank or reject records by governing entitlement, so that the most helpful-looking artifact does not automatically become the state the system acts on.

### 2.6 What Remains Missing Across These Frames

Across these adjacent strands, a common limitation remains. Each literature captures part of the interrupted-work problem, but none treats resumptive work state as the primary object of analysis. Task-interruption and programming-resumption studies explain why suspended goals and resumptive cues matter, but they do not model machine-readable work state for coding agents. Agent-memory work externalizes long-lived state, yet usually treats the persistent unit as a memory item, summary, reflection, or retrieved fact rather than as the governing state of one unfinished work item. Retrieval-oriented approaches improve context selection, but relevance is not the same as authority: a highly relevant source may still be stale, superseded, or invalid for action. Coding-agent workflow systems show that software work is iterative and tool-mediated, but they generally optimize issue solving and repository action rather than interruption-boundary state resolution. Practical-reasoning traditions formalize durable intention and commitment revision, but they are not primarily framed around artifact precedence across persisted coding records.

What remains missing across these frames is a model of interrupted coding work in which four objects are first-class: current work, authority, readiness, and next valid action. Among these, authority is the sharpest gap: in the setting studied here, the central failure is often not that an agent cannot remember enough context, but that it cannot determine which persisted record is entitled to govern action. Readiness remains important, but its novelty is weaker in the broad practical-reasoning sense. The strongest claim of this paper is therefore narrower: interrupted coding work is a distinct failure surface in which record-level entitlement must be modeled explicitly before resumed action can be trusted.

## 3. The Failure Surface of Interrupted Coding Work

The work X case fails because four questions break at once. Which work now governs? Which persisted record is entitled to decide that? Is action currently valid? And if so, what is the next justified step? Those questions are separable, and resumed coding work fails in different ways depending on which one breaks first. A taxonomy of interrupted coding work should therefore organize itself around them.

Two short examples are enough to show why. In the work X case, the agent sees a richer active context and a later blocker record at the same time. The failure is not absence of information but `authority_loss`: the wrong record wins. In a different case, the correct work and governing record are both clear, but the work is blocked pending approval and the agent keeps coding anyway. That is `readiness_loss`: the wrong action mode wins. Section 3.7 returns to these cases only in their fully classified form and then adds contrastive examples that stress the rest of the taxonomy. The taxonomy that follows is designed to classify such cases consistently.

### 3.1 Unit of Analysis and Scope

The unit of analysis in this paper is one `resumptive decision episode`: a bounded episode in which an agent or operator must determine, after interruption or handoff, what work is currently governing, what state is authoritative for that work, whether action is currently permitted, and what the next valid action should be. This unit is narrower than the full life of a software task and narrower than general long-term memory. It focuses on the decision boundary immediately before resumed action, because that is where interrupted coding work repeatedly fails despite apparently adequate context.

This scope matters because it keeps the paper from collapsing into a generic account of persistent memory, project planning, or repository understanding. A system may be strong at all of those and still fail at resumption if it cannot determine which unfinished work is current, what evidence is entitled to govern it, and whether the right present outcome is action or non-action. The taxonomy therefore does not attempt to classify every software-engineering agent failure, every retrieval error, or every execution mistake after the correct work has already been identified. Its target is specifically the interruption boundary at which previously ongoing work must be resumed, redirected, delayed, or refused.

### 3.2 Core Objects

#### 3.2.1 Work State

`Work state` is the compact governing state of one work item at the interruption boundary. It should be strong enough to answer what the work currently is, whether it is active, blocked, waiting, superseded, or done, and what kind of next move that status permits. In the work X case, the failure is not that the repo lacks information. It is that no compact governing state has won cleanly enough to decide whether X is still active or whether Y now governs instead.

Treating work state as first-class distinguishes the present framing from both document retrieval and conversational memory. In a retrieval framing, the task is to surface relevant evidence. In a work-state framing, the task is to determine which work item is current and what state transition, if any, it currently permits. A system may retrieve many relevant artifacts and still fail resumptive recovery if those artifacts do not resolve which work is governing, which status is current, and what step is justified now. Only after that positive role is clear does it make sense to say what work state is not: it is not a full project representation and not a replay of all prior context.

#### 3.2.2 Authority

`Authority` is the answer to the question that defines the work X failure: which persisted record gets to govern the resumed decision? It is therefore different from mere visibility, recency, or semantic relevance. A record is authoritative in this paper's sense when it can override competing signals for the same work state, reflects the latest accepted state transition for that work, and does not itself depend on unresolved reconciliation with a stronger record. Authority is resolved when the system can say not only what record it will follow, but why that record outranks the others.

This notion is central because interruption-boundary failures often occur after the relevant information is already present. The system sees a note, a log, an active context, a tracker status, or a workspace artifact, but cannot decide which of those is entitled to govern the next step. The claim here is not that provenance or source conflict is unknown in neighboring literatures, but that authority has not been centered as a first-class object in current coding-agent accounts of interrupted work recovery.

#### 3.2.3 Readiness

`Readiness` asks a simpler but more dangerous question: even if the system knows what work governs, is action currently valid at all? The canonical readiness modes used in this paper are `act`, `ask`, `wait`, `escalate`, and `abstain`. We treat readiness as distinct from both work identity and action content because many resumptive failures are not failures of choosing the wrong concrete step; they are failures of attempting action when the correct current outcome is non-acting.

This distinction matters because systems optimized for continuation pressure will systematically overproduce `act`. A blocked work item may still be correctly identified and backed by the right governing record, yet the correct next move may be to wait for a dependency, ask for one missing fact, escalate for approval, or abstain because governing state is still insufficient. In coding work, that bias is expensive because action can create new side effects, consume review bandwidth, or push the system deeper into the wrong branch of work before the governing state has actually been settled.

#### 3.2.4 Next Valid Action

`Next valid action` is the smallest admissible next step consistent with the current work state, the authoritative evidence for that state, and the current readiness mode. We explicitly divide it into two components: `action mode` and `action content`. The action mode determines whether the correct present outcome is to act, ask, wait, escalate, or abstain. Action content determines what concrete step should be taken once the action mode is fixed. This separation is what allows the taxonomy to distinguish `readiness_loss` from `intent_loss`: the former concerns uncertainty about the correct mode, while the latter concerns uncertainty about the concrete step after the mode is already fixed.

This definition also prevents the taxonomy from collapsing into a generic planning account. The next valid action is not the most ambitious conceivable step. It is the next step that is currently justified under the available governing state. A system that chooses a plausible but premature implementation step when the valid present move is escalation or waiting has not partially succeeded; it has failed at the interruption boundary.

### 3.3 Interruption Classes

Interruption classes describe the kind of boundary event that produces a resumptive decision episode. They are not themselves the failure classes of the taxonomy. Instead, they name the boundary condition that creates pressure on one or more of the core objects introduced above. The same interruption class may damage different objects in different cases; for example, a session cutoff may produce either `focus_loss` or `intent_loss`, while an environment-drift episode may ultimately surface as `authority_loss` or `readiness_loss`. This is why the taxonomy separates interruption class from loss class rather than collapsing them into one layer.

The interruption classes proposed here are: `session_cutoff`, `task_switch`, `blocked_waiting`, `environment_drift`, `failure_boundary`, `handoff`, `multi_open_work_conflict`, `false_done`, and `dirty_done`. Together they cover the main ways interrupted coding work becomes resumptively difficult without claiming to exhaust every possible software-engineering interruption. Their purpose is to characterize the boundary event, not to fully explain the downstream failure.

`Session_cutoff` denotes episodes where a prior working session ends before local trajectory is fully externalized or resumed, such as context exhaustion, terminal closure, or abrupt session termination. `Task_switch` denotes episodes where attention or priority ordering is redirected across works, creating uncertainty about which work should now govern. `Blocked_waiting` captures interruptions in which the work remains identifiable but action permissibility depends on missing input, approval, or an unresolved dependency. `Environment_drift` captures cases where the live environment has already changed enough at boundary entry that previously recorded state may no longer be trustworthy. `Failure_boundary` marks episodes where the previous session ended at a failed command, tool invocation, validation step, or permission check, making the correct recovery mode unclear. `Handoff` denotes transfer across model or operator boundary where tacit rationale is lost even if durable artifacts remain; plain session termination without actor change remains `session_cutoff`.

The remaining three classes capture ambiguity that often gets flattened in generic workflow systems. `Multi_open_work_conflict` refers to episodes where several open works remain simultaneously plausible as current, making the difficulty one of competition among candidates rather than simple recall. `False_done` denotes episodes where the system resumes against a completion-looking state even though closure conditions were never actually met. `Dirty_done` denotes episodes where a valid completion marker exists, but unresolved follow-up obligations, side effects, or cleanup conditions mean the work still governs future action. These classes matter because interrupted coding work is often derailed not by missing context alone, but by competition among plausible current truths or by closure signals that are stronger-looking than they are action-entitling.

The list is not intended as a final exhaustive ontology of interruption. Other candidates, such as review-driven rejection, gradual context-window overflow, or dependency cascades triggered by changes in the surrounding build graph, may deserve separate treatment in later revisions once broader case material is available.

These latter classes are also the most analytically distinctive for the present paper. `Session_cutoff` and `task_switch` help anchor the taxonomy in recognizable interruption conditions, but classes such as `environment_drift`, `multi_open_work_conflict`, `false_done`, and `dirty_done` expose the sharper structure of resumed coding-agent failure: visible state remains present, yet the governing status of that state is still easy to misread.

Table 1 summarizes the interruption classes, their operational definitions, the primary object they pressure, and the wrong moves they commonly induce.

| Interruption class | Operational definition | Primary object pressured | Typical wrong move |
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

The five loss classes are `focus_loss`, `authority_loss`, `readiness_loss`, `intent_loss`, and `closure_loss`. `Focus_loss` applies when the current-work identity itself is unresolved. `Authority_loss` applies when a plausible work state is visible but the system cannot determine why one state source should govern action over competing signals. `Readiness_loss` applies when the work and trusted state are known but the correct action mode remains unresolved: the system does not know whether it should act, ask, wait, escalate, or abstain. `Intent_loss` applies later in the chain, once readiness is fully resolved to a single valid mode and only the concrete next step remains unclear. `Closure_loss` applies when the work's completion status is the main unresolved object, such that the system cannot tell whether the work is truly done, falsely marked done, or still action-governing because follow-up obligations remain despite a completion marker.

This ordering is deliberate. In interrupted coding work, not all uncertainties are equally fundamental. If the current work is unknown, there is no stable basis for downstream reasoning. If the current work is known but authority is unresolved, the system may still act on the wrong governing truth. If work and authority are fixed but readiness is unresolved, even a plausible concrete step may be invalid now. Only after these conditions are satisfied does it make sense to ask whether the system still lacks the concrete content of the next valid action.

Table 2 defines the loss classes operationally and makes explicit where each class sits in the dominant-assignment order later visualized by Figure 1.

| Loss class | Governing question that fails | Inclusion rule | Exclusion rule | Assignment order |
| --- | --- | --- | --- | --- |
| `focus_loss` | `Which work is truly current?` | use when current-work identity is unresolved | do not use if the work is known but action is unclear | 1 |
| `authority_loss` | `Why should this state be trusted over competing signals?` | use when the problem is adjudicating between sources or validating state freshness | do not use if the trusted state is known and the dispute is only about action mode or content | 2 |
| `readiness_loss` | `Which action mode is currently valid: act, ask, wait, escalate, or abstain?` | use when the main uncertainty is whether action is currently permitted or what non-acting mode is required | do not use if the action mode is already determined and only the concrete next step is unresolved | 3 |
| `intent_loss` | `Given the fixed action mode, what concrete next step should be taken?` | use when the correct action mode is already known but action content is unresolved | do not use if the main uncertainty is whether the agent should act, ask, wait, escalate, or abstain | 4 |
| `closure_loss` | `Is this work actually done or still active?` | use when closure state is the main unresolved object | do not use if the work remains clearly active but blocked | 5 |

Two boundaries deserve emphasis because they are the easiest places for the taxonomy to collapse. First, `authority_loss` is not the same as `focus_loss`: a system may know which work is current yet still fail to determine which visible source is entitled to govern that work's state. Second, `readiness_loss` is not the same as `intent_loss`: a system may know that the correct current mode is `act` and still not know what concrete next step to take, while a different system may know several plausible concrete steps yet still fail because the correct current mode is actually `wait` or `escalate`. Third, `closure_loss` may obscure downstream focus by making a falsely completed item disappear from the candidate set, but the dominant-assignment rule still treats focus as prior only when current-work identity is genuinely unresolved at the interruption boundary. The taxonomy insists on these distinctions because interruption-boundary errors often arise from choosing action under the wrong mode rather than from choosing the wrong action content under the correct mode.

### 3.5 Dominant-Assignment Rule

Many resumptive episodes contain several plausible problems at once. A task switch may also involve stale evidence, a failed command may also obscure the next concrete step, and an apparent completion may coexist with unresolved follow-up. To keep the taxonomy usable, each episode should therefore receive one `dominant loss class`: the first missing or invalid object whose resolution is necessary before a safe next valid action can be produced. This rule does not deny that multiple pressures may coexist. Its purpose is to prevent classification from collapsing into an undisciplined list of everything that seems relevant in the case.

Figure 1 visualizes this dominant-assignment order.

![Figure 1. Dominant assignment proceeds in governing order. Interrupted coding work is classified at the earliest unresolved layer: current work, authoritative record, readiness mode, next valid action, and finally closure status. Later uncertainty does not override an earlier unresolved governing object.](figures/figure1-dominant-assignment.svg)

The dominant-assignment order in this paper is deliberately asymmetrical. If the current work itself is unresolved, the episode should be assigned `focus_loss`. If the work is known but the system cannot determine which visible state is entitled to govern action, the episode should be assigned `authority_loss`. If work and governing state are fixed but the correct action mode remains uncertain, the episode should be assigned `readiness_loss`. Only after those conditions are satisfied should an episode be assigned `intent_loss`, namely when the action mode is already fixed but the concrete next step remains unclear. `Closure_loss` applies when the remaining unresolved object is whether the work is actually done or still action-governing. When closure failure causes work to disappear from the candidate set, the dominant class at the interruption boundary is still `focus_loss`, while `closure_loss` remains the triggering condition rather than the dominant assignment. A higher-priority class should dominate only when the corresponding governing object must be resolved before any safe downstream inference is possible.

This order follows the dependency structure of safe resumption. Without focus, there is no stable basis for downstream reasoning. Without authority, any action may still be grounded in the wrong governing truth. Without readiness, even a plausible action content may be invalid now. Only then does it make sense to ask whether the system still lacks the concrete content of the next valid step. The dominant-assignment rule is therefore not just a convenience for labeling cases. It expresses the deeper claim that interruption recovery should resolve the earliest broken governing object before it expands outward into broader context recovery or action planning.

### 3.6 Auxiliary Recovery States

The paper's primary claim concerns interruption classes and loss classes, not recovery states. Even so, a secondary recovery-state layer is useful because it shows how a continuity system may move through an interruption-boundary episode once recovery begins. This layer should therefore be treated as auxiliary rather than load-bearing. It helps explain how systems may operationalize the taxonomy, but it should not displace the paper's main argument about the objects that are actually damaged at the resumptive boundary.

Table 3 names seven recovery states that commonly arise during resumptive resolution. Unlike Table 2, it describes the recovery process after classification has begun rather than the dominant failure itself.

| Recovery state | Meaning | Typical entry condition | Exit condition |
| --- | --- | --- | --- |
| `unresolved` | no safe current-work candidate exists yet | the episode enters recovery before any governing work candidate is stable | a candidate work is identified |
| `candidate_found` | a work candidate exists but still needs authority or freshness validation | a plausible current work is visible but source precedence or freshness is still unresolved | authority and freshness are sufficiently resolved |
| `waiting_one_fact` | one specific fact blocks safe resolution | one missing fact prevents safe classification or action | the missing fact is obtained or the system abstains |
| `blocked` | the work is known but the valid action mode is not `act` | approval, dependency, or external input is still required | the blocker clears, the required actor responds, or the system escalates or abstains |
| `stale` | previously recorded state is no longer trustworthy without revalidation | environment drift or superseding evidence makes prior state suspect | live state is reverified or action is withheld |
| `ready` | current work and next valid action are both sufficiently justified | work, authority, and readiness have been resolved strongly enough to proceed | action is taken or passed onward |
| `done_pending_close` | substantive work appears complete but lifecycle closure is unresolved | implementation appears complete while closure obligations remain open | the work is closed cleanly or reopened as follow-up |

These states should not be confused with the loss classes above. `Stale`, for example, is not a sixth loss class alongside `authority_loss`; it is a recovery-process state that may arise while an authority problem is being resolved. Likewise, `waiting_one_fact` is not a replacement for `intent_loss` or `readiness_loss`; it describes the minimal subcase in which one missing fact prevents safe classification or action, whereas multi-fact, external-actor, or open-ended non-action conditions resolve to `blocked`. `Done_pending_close` is also not equivalent to `closure_loss`: the latter names the dominant failure in classifying the episode, while the former names the recovery-process state after the system has already recognized that closure must still be resolved. Keeping this layer subordinate helps preserve the paper's main claim while still showing how interruption-boundary failures may be processed in practice.

### 3.7 Representative Examples

Representative examples help show that the taxonomy is not tied to one narrow implementation. The cases below are phrased generically, although they are informed by the developmental history behind this work. The first two cases complete the short previews at the opening of Section 3 and are included here only in fully classified form before the section turns to contrastive examples not previously discussed.

In the work X episode, the visible session context still points to work X, but a later structured state record shows that work X was blocked pending approval and that work Y now governs. The agent resumes work X because the visible context is richer and easier to follow. This is a `multi_open_work_conflict` case because two explicit current-work candidates remain visible without a trustworthy tie-break; the dominant loss is `authority_loss`, because the failure lies in selecting the wrong governing record rather than in total ignorance of plausible work candidates.

In a `known work, invalid action` episode, the correct work is obvious and the governing record is trusted, but the work is blocked pending approval or missing input. The valid current outcome is to wait, ask, or escalate, yet the agent continues implementation anyway. This is a `blocked_waiting` interruption whose dominant loss is `readiness_loss`, because the system fails at action mode rather than at work identity or record selection.

In an `intent-loss after valid mode` episode, the current work is known, the authoritative state is trusted, and the correct action mode is clearly `act`, but two concrete next steps remain plausible. One missing implementation detail determines whether the agent should edit file A first or patch file B first, yet the agent guesses without resolving the underlying detail or expands context far beyond what is needed instead of resolving the specific next step. This is an `intent_loss` case because the action mode is already fixed and only the concrete action content remains underdetermined.

The next three examples are not presented as documented interrupted episodes. They are illustrative cases inspired by structural patterns visible in public agent-facing codebases, including the public SWE-bench repository, and are included only to show how the taxonomy classifies codebase-grounded resumptive pressures rather than to serve as benchmark evidence (Jimenez et al., 2023). They should therefore be read as illustrative application rather than as claim-bearing empirical validation.

A public-codebase-inspired case presents a stale active-context cue that still looks locally rich inside a test-spec subsystem, even though stronger later evidence in the same area narrows the governing work differently. If the agent follows the older active-context trail because it is easier to continue, the interruption is best understood as `environment_drift` and the dominant loss as `authority_loss`: the work is not wholly unknown, but the wrong persisted record governs resumed action.

A second public-codebase-inspired case makes the current work identifiable inside an evaluation harness, but shows that safe continuation depends on bounded escalation across a visible dependency or ownership boundary. If the agent resumes implementation anyway instead of surfacing the blocker, the interruption class is `blocked_waiting` and the dominant loss is `readiness_loss`. The mistake is not uncertainty about which work governs, but failure to recognize that the valid present mode is non-action.

A third public-codebase-inspired case leaves a completion-looking trail visible from one recently finished strand of work while a still-governing follow-up obligation remains active in neighboring test-spec logic. If the agent treats the visible done-work signal as full closure and suppresses the remaining obligation, the interruption is best classified as `dirty_done` with dominant `closure_loss`: a real completion marker is present, but it does not actually settle the resumptive boundary cleanly.

A contrastive `stateless agent` example shows that the taxonomy does not depend on any one continuity system. Suppose an agent re-enters work by scanning only recent diffs, issue text, and chat history, with no explicit work-state representation. Two unfinished goals remain plausible, and the agent picks the one with richer textual evidence rather than the one with stronger current authority. The interruption class may be `multi_open_work_conflict`, but the dominant loss is `focus_loss`: the system cannot reliably determine which work is actually current.

A second contrastive case comes from an `over-structured tracker`. A project-management system marks a work item as `in progress`, while a more recent engineering-side state transition shows that the work is blocked pending approval. The agent trusts the more structured tracker view and keeps executing. This case matters because it shows that interruption-boundary failure can arise not only from too little state but also from the wrong state source winning. The dominant loss here is `authority_loss`; only after the governing source is corrected would the blocked non-action mode become visible.

## 4. Synthesis and Design Consequences

### 4.1 Why Interrupted Coding Work Requires Work-State Reasoning

Interrupted coding work requires work-state reasoning because the resumptive problem is not merely "what information should be shown?" but "what governing state should decide the next move?" The taxonomy in Section 3 argues that resumed action depends on an explicit account of the current work's governing state rather than on retrieved context alone. Without such an account, continuity systems tend to fall back on broad retrieval over heterogeneous artifacts or on visibility surfaces that still leave the governing state implicit.

Work-state reasoning also changes what counts as a successful recovery. Success is not simply producing a plausible action or restating prior context. It is producing a justified next valid action, using the readiness modes and next-valid-action framing defined in Sections 3.2.3 and 3.2.4. This includes non-action outcomes such as asking for one missing fact, waiting on an external dependency, escalating for approval, or abstaining when authoritative state is still unresolved. In the work X case, the correct recovery is not "retrieve more" and not "continue plausibly." It is to settle which record governs and then see that the valid present mode may no longer be `act` at all.

That is why the taxonomy matters. It predicts not only that adjacent frames fail, but how they fail: memory-only systems tend to stop at recall, retrieval-oriented systems at relevance, workflow systems at visibility, and practical-reasoning systems at internal commitment structure. The contribution of the taxonomy is to show that interrupted coding work still requires one more layer of reasoning over records, modes, and admissible next steps.

This reframing also implies a different optimization target for future systems. If the core problem is governable work-state recovery, then the relevant success criterion is not only how much context survives, but how well the system can restart from limited inherited session state and still reconstruct a correct governing state. In that sense, work-state reasoning is not simply another context-management tactic. It is an alternative answer to what continuity should optimize.

### 4.2 Authority as a Missing Object in Current Coding-Agent Framing

Section 2 showed that interruption research, memory systems, workflow systems, retrieval methods, and practical-reasoning traditions all get close to the problem from different directions without isolating one object explicitly: record-level entitlement for resumed action in interrupted coding work. The narrower claim here is not that source conflict is unknown in general. It is that the interrupted coding-work framing still lacks an explicit account of which persisted record gets to govern one work item at the resumption boundary.

This distinction matters because many resumed-action failures occur after the relevant information is already present. The system does not fail because no evidence exists; it fails because it cannot decide which visible state is entitled to govern action and whether that state remains fresh enough under current environment conditions. In the work X case, the problem is not that the agent lacks a goal, a memory, or a plausible plan. The problem is that two persisted records survive the boundary and no explicit rule says which one overrides the other. In that sense, authority is not just another name for belief revision under conflict. It is the antecedent question of which record gets to count as the governing state transition for this interrupted work item.

That is why a minimal operational sketch matters even in a non-mechanistic paper. In practical system terms, authority could be operationalized through explicit precedence relations among record types, freshness checks against current environment markers, and supersession rules that force later accepted state transitions to override earlier but richer-looking artifacts. This is not yet a complete mechanism. But it does make the concept testable: a system can be asked whether it resolved the right record-level ordering before it acted.

Authority in this paper therefore names a coding-agent interruption problem rather than a universal theory of source conflict. The contribution is to make that object explicit in the specific setting of interrupted coding work, where the core analytic gap is not information absence alone but unresolved source entitlement at the resumptive boundary.

## 5. Design Requirements for Future Systems

### 5.1 Work as the Primary Continuity Object

Future continuity systems should treat `work`, not only conversation or artifact recall, as the primary continuity object. The point is not to store every prior interaction indefinitely. It is to recover the governing state of one interrupted work item well enough that resumed action becomes justified again. That requires representing current-work identity, current status, and minimal admissible next-move constraints directly rather than inferring them opportunistically from residue spread across notes, traces, and issue text. This requirement is consistent with older coordination research on shared work understanding and tacit knowledge in software settings as well as with newer agent-system directions that externalize persistent state instead of carrying ever more context forward (Espinosa et al., 2001; Dewan and Hegde, 2007; Ryan and O'Connor, 2013; Marron, 2024; Yu et al., 2026).

This requirement follows directly from the taxonomy. If interrupted coding work repeatedly fails at the boundary where one unfinished work item must be resumed, redirected, delayed, or refused, then systems should preserve and reconstruct that bounded object explicitly. A continuity layer organized only around generic memory items or broad conversational summaries will often preserve useful evidence while still leaving the resumptive decision underspecified.

### 5.2 Explicit Authority Semantics

Future systems should expose explicit `authority semantics` rather than leaving source precedence implicit inside retrieval scores, tracker heuristics, or workflow views. In practical terms, that means the system should be able to answer why one persisted record outranks another for the same work item and under what conditions that ordering should be reconsidered.

The taxonomy does not require one universal authority scheme. It does require that authority stop being hidden. Once several plausible state records remain visible at once, a system that cannot explain its precedence rule is effectively guessing at the resumed decision boundary. Explicit authority semantics therefore belong to the representation layer, not only to downstream prompting tricks.

### 5.3 Explicit Readiness Modes

Future systems should represent `readiness` explicitly instead of assuming that successful continuity culminates in immediate action. In interrupted coding work, the correct present outcome may be to ask, wait, escalate, or abstain rather than to continue implementation. Systems that collapse all successful recovery into `act` will continue to mis-handle exactly the cases where resumed action is most dangerous.

This requirement is especially important because coding agents are usually optimized under continuation pressure. They are rewarded for moving, finishing, patching, or producing output. The taxonomy argues that a continuity system should counterbalance that bias by making action-mode validity visible before action-content generation begins.

### 5.4 Non-Action Outcomes as First-Class Outputs

If readiness is first-class, then non-action outcomes must become first-class outputs as well. A continuity system should be able to produce structured outcomes such as `waiting on approval`, `ask for one missing fact`, `revalidate stale state`, or `abstain pending authority resolution` without treating them as failures of helpfulness.

This requirement changes both system design and evaluation. A model that correctly refuses to continue under unresolved governing state may be more successful, in the continuity sense, than one that produces plausible code immediately. The paper therefore treats non-action not as a fallback behavior, but as one of the valid endpoints of good resumption.

### 5.5 Pre-Action Verification as an Emerging Requirement

The taxonomy also points toward a final requirement: future systems should verify governing state before resumed action rather than assuming that reconstructed context is already trustworthy enough to execute against. This paper does not specify the full mechanism for such verification. It does, however, make clear why some mechanism of that kind will likely be necessary once authority, freshness, and readiness are treated as explicit objects. Emerging long-horizon agent work already points toward bounded-context reconstruction and plan-aware context management as partial answers to the same broad pressure, even if they do not isolate interrupted coding work in the same way (Yuksel, 2025; Yu et al., 2026).

In that sense, pre-action verification is the natural bridge to a later mechanism paper rather than a hidden implementation claim inside this one. If the taxonomy is correct, then future systems should not only recover candidate work state. They should also check for divergence between the state they are about to trust and the state that the artifact field now actually justifies.

## 6. Discussion and Research Agenda

### 6.1 Implications for Coding-Agent Evaluation

The most immediate implication of the taxonomy is evaluative. Coding-agent benchmarks should not measure only whether the model eventually produces a plausible patch or solves an issue. They should also measure whether the model recovers the right current work, resolves authority correctly under competing persisted records, chooses the right readiness mode, and selects the next valid action under interruption pressure. Existing benchmarks already demonstrate how varied the current targets are, from tool use and general agency to issue resolution and long-term memory, but they still organize success around different objects (Zhuang et al., 2023; Liu et al., 2023; Jimenez et al., 2023; Xiao et al., 2024; Maharana et al., 2024; Liu et al., 2024; Zhang et al., 2025).

This implies a broader shift in target metrics. Current evaluation regimes often reward eventual action quality under whatever context was supplied. A continuity-sensitive evaluation regime should additionally reward correct abstention, escalation, waiting, and source-sensitive re-entry. It should also include cases where the decisive difficulty is not missing information but competition among visible records that all look locally helpful.

### 6.2 Implications for Runtime Continuity Systems

The taxonomy also implies a different runtime objective. A strong continuity system should not be judged only by how much prior context it can carry forward, compress, or cache. It should be judged by how well it can reconstruct governable work state under minimal inherited session state. That is a different target from generic long-context retention, even if the two sometimes overlap.

This point helps connect the present paper to emerging bounded-context and state-externalization trends without collapsing into them. Runtime systems may converge on smaller inherited contexts, stronger state externalization, and cleaner restart paths for practical systems reasons, as seen in work on file-centric state reconstruction, plan-aware context engineering, intelligent development environments, and systems-side pressure from long-context inference itself (Yu et al., 2026; Yuksel, 2025; Marron, 2024; Wang et al., 2026; Wu et al., 2026). The taxonomy adds a more specific claim: restartability matters not only because long context is expensive, but because resumed correctness depends on the explicit reconstruction of work, authority, readiness, and next valid action.

### 6.3 Open Research Questions

Several research questions remain open. First, how stable are the proposed class boundaries once broader external datasets or independent annotators are introduced? Second, how coding-specific is this taxonomy really? Some elements may generalize to other interrupted agentic work, but the exact role of environment drift, irreversible side effects, and multi-artifact precedence may still be unusually strong in software settings.

Third, what is the right operational test for authority resolution? A future system will need some explicit way to justify why one record outranks another without collapsing into brittle hand-coded policy. Fourth, how should evaluation distinguish successful re-entry from superficially plausible continuation? And finally, what is the smallest continuity surface that still preserves high-quality recovery under near-zero session inheritance? These questions define the research program more honestly than any claim that the taxonomy is already final.

### 6.4 From Taxonomy to Mechanism

This paper is intentionally not the mechanism paper. Even so, the taxonomy points toward one concrete next step: systems should test for divergence before acting on resumed state. The central intuition is straightforward. If resumed coding work fails when the wrong persisted record governs action, then a mechanism should exist that checks whether the candidate governing state has been superseded, invalidated, or blocked before execution proceeds.

That bridge matters because it shows the taxonomy is not purely classificatory. It generates a downstream mechanism agenda. A later paper can therefore ask whether explicit pre-action divergence checks reduce authority-sensitive resumed-action failures in practice. The role of the current paper is to make clear why such a mechanism would answer a real missing object rather than merely adding another safeguard to an already solved framing.

## 7. Limitations

### 7.1 Author-Derived Taxonomy Risk

The taxonomy remains author-derived. It was assembled through literature synthesis, repeated structured failure analysis, and direct interaction with one family of continuity artifacts. That makes it coherent enough to argue with, but it also means the class boundaries may partly reflect the authors' framing choices rather than an already settled ontology of interrupted coding work.

### 7.2 External Validation Still Limited

External validation is still limited. The taxonomy has not yet been independently validated through broad external annotation studies, inter-rater agreement analysis, large third-party corpora of interrupted coding episodes, or multi-team replication that would show the class boundaries survive outside the current project context.

### 7.3 No Full Mechanism Proof in This Paper

The paper also does not provide a full mechanism proof. It argues that `authority` and `readiness` should be first-class objects and sketches why pre-action verification is a natural next step, but it does not yet demonstrate one validated runtime design that solves the problem end to end. Reviewers who expect a complete systems contribution should therefore read this manuscript as a viewpoint paper with a downstream mechanism agenda rather than as a finished implementation claim.

### 7.4 Boundary Cases and Class Stability

Finally, some boundary cases may remain unstable. `Authority_loss` and `focus_loss` can interact closely when closure failure hides the true current work. `Readiness_loss` and `intent_loss` can look deceptively similar when a system is uncertain about both mode and content. And the boundary between interrupted coding work and interrupted agentic work more generally remains open. These are not reasons to abandon the taxonomy, but they are reasons to treat it as a proposed organizing frame rather than a final settled vocabulary.

## 8. Conclusion

Interrupted coding work is easy to misdescribe as a generic memory or retrieval problem. The argument of this paper is that something more specific breaks at the resumed decision boundary. The system must recover not only relevant context, but the right current work, the right governing record, the right action mode, and the next valid action that follows from them.

That is why the paper centers `authority` rather than treating it as a minor side condition. In many resumed coding failures, the decisive problem is not that the relevant traces are absent. It is that several traces survive and the system still cannot tell which one is entitled to govern action. The proposed taxonomy is meant to make that failure surface easier to study, evaluate, and design for.

The taxonomy defines interrupted coding work as a distinct analytical object, proposes a work-state-centered vocabulary for understanding it, and derives design and research consequences from that framing. If this perspective is right, future continuity systems should optimize not only for memory persistence or better retrieval, but for clean recovery of governable work state under minimal inherited session state.

## References

- Altmann, Erik M., and J. Gregory Trafton. 2004. "Task Interruption: Resumption Lag and the Role of Cues." *Proceedings of the 26th Annual Conference of the Cognitive Science Society*.
- Bratman, Michael E. 1987. *Intention, Plans, and Practical Reason*. Harvard University Press.
- Ceka, Ira, et al. 2025. "Understanding Software Engineering Agents Through the Lens of Traceability: An Empirical Study." arXiv preprint arXiv:2506.08311.
- Chhikara, Prateek, et al. 2025. "Mem0: Building Production-Ready AI Agents with Scalable Long-Term Memory." arXiv preprint arXiv:2504.19413.
- Cohen, Philip R., and Hector J. Levesque. 1990. "Intention Is Choice with Commitment." *Artificial Intelligence*.
- DeLine, Robert, and Chris Parnin. 2010. "Evaluating Cues for Resuming Interrupted Programming Tasks." CHI 2010.
- Dewan, Prasun, and Rajesh Hegde. 2007. "Semi-Synchronous Conflict Detection and Resolution in Asynchronous Software Development." ECSCW 2007.
- Espinosa, Alberto, et al. 2001. "Shared Mental Models and Coordination in Large-Scale, Distributed Software Development." ICIS.
- Hong, Sirui, et al. 2023. "MetaGPT: Meta Programming for A Multi-Agent Collaborative Framework." arXiv preprint arXiv:2308.00352.
- Iqbal, Shamsi T., and Eric Horvitz. 2007a. "Disruption and Recovery of Computing Tasks: Field Study, Analysis, and Directions." CHI 2007.
- Iqbal, Shamsi T., and Eric Horvitz. 2007b. "Conversations Amidst Computing: A Study of Interruptions and Recovery of Task Activity." User Modeling 2007.
- Jimenez, Carlos E., et al. 2023. "SWE-bench: Can Language Models Resolve Real-World GitHub Issues?" arXiv preprint arXiv:2310.06770.
- Lewis, Patrick, et al. 2020. "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks." arXiv preprint arXiv:2005.11401.
- Liu, Xiao, et al. 2023. "AgentBench: Evaluating LLMs as Agents." arXiv preprint arXiv:2308.03688.
- Liu, Yilun, et al. 2024. "LongMemEval: Benchmarking Chat Assistants on Long-Term Interactive Memory." arXiv preprint arXiv:2407.11017.
- Maharana, Adyasha, et al. 2024. "Evaluating Very Long-Term Conversational Memory of LLM Agents." arXiv preprint arXiv:2402.17753.
- Marron, Mark. 2024. "A New Generation of Intelligent Development Environments." IDE Workshop. arXiv:2406.09577.
- Matthews, Tara, et al. 2006. "Clipping Lists and Change Borders: Improving Multitasking Efficiency with Peripheral Information Design." CHI 2006.
- Packer, Charles, et al. 2023. "MemGPT: Towards LLMs as Operating Systems." arXiv preprint arXiv:2310.08560.
- Parnin, Chris, and Spencer Rugaber. 2009. "Resumption Strategies for Interrupted Programming Tasks." ICPC 2009.
- Ram, Ori, et al. 2023. "In-Context Retrieval-Augmented Language Models." arXiv preprint arXiv:2302.00083.
- Rao, Anand S., and Michael P. Georgeff. 1991. "Modeling Rational Agents within a BDI-Architecture." KR 1991.
- Ryan, Sharon M., and Rory O'Connor. 2013. "Acquiring and Sharing Tacit Knowledge in Software Development Teams: An Empirical Study." *Information and Software Technology*.
- Schut, Martijn, Michael Wooldridge, and Simon Parsons. 2004. "The Theory and Practice of Intention Reconsideration." *Journal of Experimental and Theoretical Artificial Intelligence*.
- Shinn, Noah, et al. 2023. "Reflexion: Language Agents with Verbal Reinforcement Learning." arXiv preprint arXiv:2303.11366.
- Shrivastava, Disha, et al. 2023. "RepoFusion: Training Code Models to Understand Your Repository." arXiv preprint arXiv:2306.10998.
- Sumers, Theodore R., et al. 2023. "Cognitive Architectures for Language Agents." arXiv preprint arXiv:2309.02427.
- Trafton, J. Gregory, et al. 2003. "Preparing to Resume an Interrupted Task: Effects of Prospective Goal Encoding and Retrospective Rehearsal." *International Journal of Human-Computer Studies*.
- Wang, Junliang, et al. 2026. "Multi-tier Dynamic Storage of KV Cache for LLM Inference Under Resource-Constrained Conditions." *Complex & Intelligent Systems*.
- Wu, Yusen, et al. 2026. "KVC-Q: A High-Fidelity and Dynamic KV Cache Quantization Framework for Long-Context Large Language Models." *Journal of Systems Architecture*.
- Xiao, Xuhui, et al. 2024. "τ-bench: A Benchmark for Tool-Agent-User Interaction in Real-World Domains." arXiv preprint arXiv:2406.12045.
- Yang, John, et al. 2024. "SWE-agent: Agent-Computer Interfaces Enable Automated Software Engineering." *NeurIPS 2024*.
- Yang, Tianlin, et al. 2024. "AutoCodeRover: Autonomous Program Improvement." arXiv preprint arXiv:2404.05427.
- Yao, Shunyu, et al. 2022. "ReAct: Synergizing Reasoning and Acting in Language Models." ICLR 2023.
- Yoran, Ori, et al. 2023. "Making Retrieval-Augmented Language Models Robust to Irrelevant Context." arXiv preprint arXiv:2310.01558.
- Yu, Chenglin, et al. 2026. "InfiAgent: An Infinite-Horizon Framework for General-Purpose Autonomous Agents." arXiv preprint arXiv:2601.03204.
- Yuksel, Kamer Ali. 2025. "PAACE: A Plan-Aware Automated Agent Context Engineering Framework." arXiv preprint arXiv:2512.16970.
- Zhang, Fengji, et al. 2023. "RepoCoder: Repository-Level Code Completion Through Iterative Retrieval and Generation." arXiv preprint arXiv:2303.12570.
- Zhang, Zeyu, et al. 2024. "A Survey on the Memory Mechanism of Large Language Model based Agents." arXiv preprint arXiv:2404.13501.
- Zhang, Jian, et al. 2025. "SWE-bench Goes Live!" arXiv preprint arXiv:2504.13008.
- Zhuang, Yuchen, et al. 2023. "ToolQA: A Dataset for LLM Question Answering with External Tools." *NeurIPS* Datasets and Benchmarks Track.
