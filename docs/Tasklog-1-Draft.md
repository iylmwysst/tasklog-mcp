# Tasklog: A Work-Centric Continuity Layer for Structured Coding Re-Entry

## Abstract

Coding agents often fail not because they cannot produce code, but because they must re-enter interrupted work with incomplete or conflicting continuity state. We propose Tasklog, a work-first continuity surface that organizes re-entry evidence around active work state, session logs, and provenance-bearing workdocs, and we evaluate whether this structure improves coding-task re-entry quality over a fair normalized baseline. Our evaluation program spans three stages. In the first stage, a five-condition frozen holdout shows that Tasklog Re-entry matches a strong Normalized State baseline while clearly outperforming weaker baselines such as workspace-only inspection, notes replay, and raw-state reading. In the second stage, a provenance-sensitive diagnostic holdout stresses conflict resolution, abstention, escalation, stale-context override, and action ordering; Tasklog separates strongly from the Normalized State baseline on decision-core metrics under this harder target. In the third and primary stage, a frozen structured holdout evaluates Tasklog Re-entry against Normalized State on 32 evaluation instances from 8 scenario families across three model families (gpt-5.4, gpt-5.4-mini, and claude-sonnet-4.6) with three repetitions per model, yielding 576 condition-instance evaluations and 288 paired comparisons overall. Across all nine repetitions, Tasklog Re-entry beats or ties Normalized State on the headline action validity metric in every repetition (7 positive, 2 ties, 0 negatives), with an aggregate improvement from 21.88% to 26.74%, paired mean difference +0.0486, and bootstrap 95% confidence interval [0.0208, 0.0764]. These results demonstrate that work-centric continuity structure consistently improves frozen structured re-entry quality over a fair normalized baseline across model families. Limitations around interactive benchmarking, runtime efficiency, and external validation are discussed.

## 1. Introduction

Interruptions are routine in practical coding workflows. A model or operator pauses one task, returns later, and must reconstruct which work matters now, whether the visible active context is still trustworthy, and what action is legal or useful next. This is a continuity problem, not only a code-generation problem.

Tasklog is a work-first continuity surface intended to make this re-entry step more reliable. Its premise is that structured work state, session logs, and workdocs help a later model invocation recover the correct action more reliably than weaker alternatives such as raw workspace inspection or free-form notes replay.

The measurement challenge is harder than the product intuition. Weak baselines are easy to beat. A strong generic normalization layer can already recover obvious work-selection decisions if the evaluation only asks for shallow extraction. The central question is whether Tasklog adds value over a fair strong baseline, and if so, under what kinds of re-entry difficulty.

This paper therefore evaluates a focused question: under frozen structured holdouts, does a work-centric continuity surface improve coding-task re-entry quality over fair alternative continuity surfaces? We answer this question across three evaluation stages. The first stage establishes that Tasklog improves re-entry relative to weaker continuity baselines. The second stage shows where provenance-sensitive re-entry differences emerge. The third and primary stage provides a frozen multi-model result in which Tasklog Re-entry beats a fair Normalized State baseline overall, with a positive aggregate confidence interval.

## 2. Related Work

### 2.1 Programming Task Resumption and Interruption

The oldest and most relevant root of this paper is not the recent agent-memory literature, but the programming-task resumption literature. Classic cognitive work by Trafton et al. and Altmann and Trafton explains why resumptive cues matter at all: after interruption, the cost is not only remembering facts, but recovering the suspended goal stack, the next legal step, and the cues that make resumption efficient rather than hesitant [1, 2]. Matthews et al. similarly show that interface-level support can materially affect reacquisition of work context after interruption [3]. Iqbal and Horvitz then broaden the picture by showing that disruption and recovery are system-design concerns in real computing environments, not merely laboratory curiosities [4, 5].

Within software engineering specifically, Parnin and Rugaber and later DeLine and Parnin provide the closest pre-LLM grounding for our problem [6, 7]. Their work shows that interrupted programming tasks are difficult to resume and that external cues can improve recovery. That literature is important because it frames re-entry as a structured continuity problem rather than a general retrieval problem. However, those papers were written for human developers and interface cues, not for coding agents that must reconstruct work state from machine-readable logs, workdocs, and provenance-bearing artifacts. Tasklog inherits the same core problem but changes both the actor and the continuity substrate: instead of supporting a human programmer with visual cues alone, it exposes structured work-centered evidence for a later model invocation.

This distinction matters for the contribution claim. If the paper were only saying that interruptions are harmful and cues are useful, it would add little. The more specific contribution is that coding-agent workflows need continuity state organized around work items, handoff boundaries, next steps, and artifacts, and that this structure should be evaluated directly. The programming-resumption literature therefore supplies the problem legitimacy and conceptual motivation, but not the system abstraction or evaluation protocol used here.

### 2.2 Agent Memory and Long-Lived LLM State

The obvious neighboring literature is the recent wave of agent-memory systems. MemGPT, Reflexion, Mem0, and related architectural treatments such as CoALA ask how language agents can maintain or improve state across long-lived interaction [8, 9, 10, 12]. These systems typically focus on remembering useful information over time: user facts, interaction history, reflections, plans, or distilled memories that can be retrieved later. Surveys of memory mechanisms for LLMs organize this space around memory storage, retrieval, summarization, and control [11].

This literature is directly relevant because Tasklog also externalizes cross-session state. But the fit is still incomplete. Most memory systems optimize for remembering broadly useful context across many possible future interactions. Their unit of persistence is usually a memory item, summary, reflection, or conversational fact. By contrast, Tasklog's unit of continuity is the work item. The system is less concerned with preserving arbitrary long-term memory than with recovering the current actionable state of one piece of engineering work: what is active, what evidence is authoritative, what blocker or status constrains the next step, and what artifacts define the handoff boundary.

That difference changes both the system design and the fair comparison. A general memory layer might excel at personal preference retention, conversational recall, or broad autobiographical continuity without necessarily helping a coding agent choose the right work to resume or abstain when the authoritative signal is weak. Conversely, a work-centric surface can shape evidence in ways that matter specifically for resumptive decisions. The point of Tasklog is therefore not that general memory is unimportant, but that generic long-term memory is not the only useful abstraction for coding agents. Work continuity deserves to be treated as a first-class problem with its own interfaces and evaluation criteria.

### 2.3 Coding-Agent Systems and Persistent Development Context

A third neighboring body of work comes from coding-agent and AI-assisted development systems. ReAct established the now-standard pattern of interleaving reasoning and actions [13]. MetaGPT explored structured software workflows through explicit role decomposition and standard operating procedures [14]. SWE-agent and AutoCodeRover demonstrate increasingly capable agents that navigate repositories, issue descriptions, and action spaces to solve software tasks [15, 16]. Broader visions of intelligent development environments and AI teammates in software engineering argue that software work is becoming a mixed human-agent workflow rather than a single-pass coding problem [17, 18]. Related work on goal-driven AI pair programmers and traceability of software-engineering agents strengthens the same point from two different directions: realistic agent development is iterative, workflow-shaped, and sensitive to the structure of intermediate state rather than only to final issue-resolution accuracy [26, 27].

These systems are adjacent to Tasklog because they operate in the same software-engineering setting and often need continuity across multiple steps, tools, or repository interactions. But they typically optimize a different target. Most coding-agent systems focus on issue solving, search, planning, action selection, or repository repair. Their main challenge is how to act effectively in code environments, not how to represent and recover interrupted work state as a durable cross-session object. In other words, they are closer to autonomous or semi-autonomous software agents than to continuity infrastructure.

Tasklog is therefore not positioned as a replacement for systems such as SWE-agent or AutoCodeRover, nor as a universal project-management layer. Its most defensible position is a continuity layer that can sit underneath or alongside coding agents by structuring resumptive evidence before the next model invocation begins. Current coding-assistant ecosystems increasingly provide persistent instructions, notes, or project memories, and the broader AI-assisted development literature already shows that coding assistance is reshaping productivity, collaboration, and knowledge transfer patterns [28, 29, 30]. Tasklog's contribution is to center that continuity problem around resumable work state rather than around general instructions or generic conversation history.

### 2.4 Benchmark and Evaluation Literature

The benchmark literature also matters because it determines how strong our empirical claim can be. Memory-oriented benchmarks such as LoCoMo and LongMemEval study long-term conversational memory and assistant continuity [19, 20]. AgentBench and ToolQA evaluate broader agent behavior and tool use [21, 22]. SWE-bench and SWE-bench Goes Live have become central references for software-agent evaluation, while τ-bench explores more realistic tool-agent workflows [23, 24, 25]. Together these works make two points clear. First, evaluation credibility depends on frozen evaluation sets, fair comparators, and contamination-aware design. Second, existing benchmarks are not targeted at structured coding-work re-entry as defined in this paper.

That gap is important. A benchmark for issue resolution, tool use, or long-term conversation does not automatically test whether a model can recover the right work, identify authoritative continuity evidence, and choose a valid next step under interrupted coding conditions. Our evaluation program therefore fills a missing niche: frozen structured evaluation of work-centric re-entry quality, with an explicit comparison between a product-shaped continuity surface and a fair generic normalized baseline.

### 2.5 Positioning of This Paper

Taken together, the literature suggests that Tasklog occupies an under-described intersection. The task-resumption literature justifies why resumptive cues matter; the agent-memory literature shows how cross-session state can be externalized; the coding-agent literature shows why structured software workflows matter; and the benchmark literature shows how easy it is to overclaim without frozen fair comparisons. Yet none of these literatures, on their own, provide a work-first continuity abstraction targeted at interrupted coding re-entry.

Tasklog is best understood not as a universal memory platform and not as an autonomous issue-solving agent, but as a work-centric continuity layer for coding agents. The paper's contribution is therefore twofold. At the system level, it proposes that the work item is the right unit of continuity for coding-task re-entry. At the empirical level, it evaluates whether that work-centric surface improves frozen structured re-entry quality over a fair Normalized State baseline across multiple model families.

## 3. Evaluation Design

### 3.1 Overview

The evaluation program proceeds in three stages of increasing rigor. The first two stages are included as developmental context: they establish that the problem is non-trivial and that provenance-sensitive re-entry creates meaningful difficulty for generic baselines. The third stage is the primary claim-bearing holdout. All stages use frozen evaluation sets and compare conditions in isolation, with each condition receiving only its own continuity payload.

### 3.2 Stage 1: Five-Condition Baseline Sweep

The first stage contains 10 frozen evaluation instances and compares five continuity conditions:

- Workspace-Only
- Notes Replay
- Raw State
- Normalized State
- Tasklog Re-entry

Each condition runs in isolation and sees only its condition-specific payload. The fixed model is gpt-5.4-mini.

### 3.3 Stage 2: Provenance-Sensitive Diagnostic Holdout

The second stage compares only Normalized State and Tasklog Re-entry across 10 evaluation instances covering provenance conflicts, abstention, escalation, stale-context override, and action-ordering pressure under a one-shot structured decision task.

This stage motivated the design of the primary holdout by identifying the ceiling effect in Stage 1 and showing where generic normalization begins to fail under harder provenance-sensitive re-entry conditions.

### 3.4 Stage 3: Frozen Multi-Model Structured Holdout

The primary holdout compares Tasklog Re-entry against Normalized State across three model families — gpt-5.4, gpt-5.4-mini, and claude-sonnet-4.6 — with three repetitions per model.

The frozen evaluation set contains 32 instances from 8 scenario families. Each family represents a distinct class of re-entry difficulty rather than a surface prompt variation:

- *Authoritative log overrides note*: newer structured logs should outrank older broad notes
- *Stale active context*: the visible active context is stale or superseded and must be ignored
- *Blocked work requiring escalation*: the correct work is known but the next legal step is escalation
- *Abstention under weak evidence*: evidence is too weak or conflicting to justify resuming any work
- *Single missing fact before resume*: one concrete missing fact should be requested before acting
- *Completed-work noise vs. active signal*: richer completed-work artifacts distract from the real active target
- *Provenance tiebreak between open works*: two open works look plausible and provenance must break the tie
- *State-constrained next step*: the correct work is identifiable but the next action is constrained by blocker state or ordering

Because every repetition evaluates all 32 instances under both conditions, one repetition of one model produces 64 condition-instance evaluations. Across three models and three repetitions per model, the primary holdout totals 576 condition-instance evaluations and 288 paired comparisons between Tasklog Re-entry and Normalized State.

## 4. Results

### 4.1 Stage 1 Results

| Condition | Strict Accuracy |
| --- | ---: |
| Workspace-Only | 0/10 |
| Notes Replay | 1/10 |
| Raw State | 3/10 |
| Normalized State | 10/10 |
| Tasklog Re-entry | 10/10 |

Stage 1 establishes that Tasklog improves re-entry relative to weaker continuity baselines. It does not show superiority over the Normalized State baseline, which also scores 10/10, motivating a harder evaluation target in Stage 2.

### 4.2 Stage 2 Results

| Condition | Strict | Decision-Core | Canonical Decision-Core |
| --- | ---: | ---: | ---: |
| Normalized State | 0/10 | 0/10 | 0/10 |
| Tasklog Re-entry | 0/10 | 8/10 | 10/10 |

Stage 2 shows strong separation on decision-core metrics under provenance-sensitive conditions. Tasklog outperforms the Normalized State baseline on both exact and canonicalized decision-core scoring. This stage is included as diagnostic context for the design of Stage 3 rather than as a primary claim result, because its scoring policy depends partly on the specific provenance ontology used.

### 4.3 Primary Holdout Results

The headline metric is action validity, measured as a paired difference of Tasklog Re-entry minus Normalized State.

| Model | Repetitions | Positive / Tie / Negative | Normalized State | Tasklog Re-entry | Delta (pp) | Relative Uplift | Paired Mean Diff | 95% CI |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| gpt-5.4 | 3 | 2 / 1 / 0 | 30.21% | 33.34% | +3.13 | +10.35% | +0.0313 | [−0.0104, 0.0833] |
| gpt-5.4-mini | 3 | 2 / 1 / 0 | 26.04% | 33.33% | +7.29 | +27.99% | +0.0729 | [0.0208, 0.1354] |
| claude-sonnet-4.6 | 3 | 3 / 0 / 0 | 9.38% | 13.54% | +4.16 | +44.39% | +0.0417 | [0.0104, 0.0833] |
| Overall | 9 | 7 / 2 / 0 | 21.88% | 26.74% | +4.86 | +22.21% | +0.0486 | [0.0208, 0.0764] |

Tasklog Re-entry beats or ties Normalized State in every one of the nine repetitions. The aggregate confidence interval does not cross zero. No repetition is negative.

### 4.4 Secondary Quality and Efficiency Results

Secondary quality metrics from the primary holdout:

| Metric | Normalized State | Tasklog Re-entry | Delta (pp) | Paired Mean Diff | 95% CI |
| --- | ---: | ---: | ---: | ---: | --- |
| Next-step accuracy | 50.00% | 61.46% | +11.46 | +0.1146 | [0.0590, 0.1736] |
| Strict contract accuracy | 13.54% | 17.36% | +3.82 | +0.0382 | [0.0035, 0.0729] |

On prompt surface, the median payload size is 1,616.5 bytes for Normalized State and 1,535.5 bytes for Tasklog Re-entry, a reduction of approximately 5%. This supports a limited efficiency observation around context surface. Comparable runtime token, latency, and cost data were not collected in this round and remain future work.

### 4.5 Combined Interpretation

The three-stage picture is coherent. Stage 1 shows that Tasklog clearly beats weaker baselines. Stage 2 shows why provenance-sensitive re-entry is a meaningfully harder target for generic normalization. Stage 3 provides a direct positive result against a fair normalized baseline under frozen multi-model conditions, with a positive aggregate confidence interval and no negative repetitions across nine trials.

## 5. Discussion

### 5.1 Main Finding

On a frozen structured work-reentry holdout, Tasklog Re-entry improves re-entry quality over a fair Normalized State baseline across three model families. The aggregate improvement is +4.86 percentage points on action validity, with a 95% confidence interval of [0.0208, 0.0764].

### 5.2 What the Primary Holdout Adds Over Earlier Stages

Relative to the earlier two-stage story, the primary holdout adds four things that materially strengthen the claim:

- independent stronger evidence than the provenance-diagnostic stage
- cross-model coverage instead of a single-model result
- repeated-trial stability through three repetitions per model
- confidence intervals on the headline metric

### 5.3 Smaller-Model Trend

The strongest uplift appears on gpt-5.4-mini (+27.99% relative). This supports a cautious trend observation: lower-capacity models may benefit more from work-centric re-entry structure than higher-capacity models that can partially compensate through stronger inference. The current evidence supports this as a trend warranting further investigation rather than as a general law.

### 5.4 Scope of the Claim

The results support the specific claim that work-centric continuity structure improves frozen structured re-entry quality over a fair normalized baseline. They do not support broader claims about general interactive agent continuation, runtime efficiency parity, or performance on arbitrary coding tasks outside the re-entry setting.

## 6. Limitations

Four limitations constrain the current evidence package.

First, an interactive benchmark result is not yet available. The scripted and interactive full-session evaluation tracks are under development and will be reported separately. Until those results are available, the claim is bounded to the structured re-entry setting.

Second, the efficiency analysis is limited to prompt surface area. Runtime token counts, latency, and cost comparisons were not collected in the primary holdout and cannot be reported here.

Third, the evaluation instances are hand-authored. The primary holdout contains 32 frozen instances across 8 scenario families, yielding 576 condition-instance evaluations and 288 paired comparisons — materially larger than a single-model pilot, but still bounded to locally constructed scenarios. External validation on real interrupted coding sessions, for example using task snapshots derived from public repositories, remains future work.

Fourth, the gpt-5.4 per-model confidence interval crosses zero [−0.0104, 0.0833], though the aggregate interval does not. The per-model result for gpt-5.4 should be read as a positive trend rather than a statistically significant isolated finding.

## 7. Conclusion

This paper proposes Tasklog as a work-centric continuity layer for coding agents and evaluates whether work-first structure improves re-entry quality over a fair normalized baseline. Across a frozen multi-model holdout spanning 576 condition-instance evaluations and three model families, Tasklog Re-entry beats or ties the Normalized State baseline in every repetition, with an aggregate improvement from 21.88% to 26.74% on action validity and a bootstrap 95% confidence interval of [0.0208, 0.0764]. Secondary metrics on next-step accuracy and contract validity reinforce the same direction. These results support the claim that the work item is a productive unit of continuity for coding-task re-entry, and that structuring re-entry evidence around active work state adds measurable value over generic normalization. Interactive session evaluation, external validation, and runtime efficiency analysis remain directions for future work.

## References

[1] J. Gregory Trafton, Erik M. Altmann, Derek P. Brock, and Farilee E. Mintz. "Preparing to Resume an Interrupted Task: Effects of Prospective Goal Encoding and Retrospective Rehearsal." International Journal of Human-Computer Studies, 2003.

[2] Erik M. Altmann and J. Gregory Trafton. "Task Interruption: Resumption Lag and the Role of Cues." 2004.

[3] Tara Matthews, Jaime Teevan, Steve Whittaker, and John Pierce. "Clipping Lists and Change Borders: Improving Multitasking Efficiency with Peripheral Information Design." 2006.

[4] Shamsi T. Iqbal and Eric Horvitz. "Disruption and Recovery of Computing Tasks: Field Study, Analysis, and Directions." 2007.

[5] Shamsi T. Iqbal and Eric Horvitz. "Conversations Amidst Computing: A Study of Interruptions and Recovery of Task Activity." 2007.

[6] Chris Parnin and Spencer Rugaber. "Resumption Strategies for Interrupted Programming Tasks." 2009.

[7] Robert DeLine and Chris Parnin. "Evaluating Cues for Resuming Interrupted Programming Tasks." 2010.

[8] Charles Packer, Sarah Wooders, Kevin Lin, Vivian Fang, Shishir G. Patil, Ion Stoica, and Joseph E. Gonzalez. "MemGPT: Towards LLMs as Operating Systems." 2023.

[9] Noah Shinn, Federico Cassano, Edward Berman, and Ashwin Gopinath. "Reflexion: Language Agents with Verbal Reinforcement Learning." 2023.

[10] Theodore R. Sumers, Shunyu Yao, Karthik Narasimhan, and Thomas L. Griffiths. "Cognitive Architectures for Language Agents." 2023.

[11] Yao Zhang et al. "A Survey on the Memory Mechanism of Large Language Model based Agents." 2024.

[12] Aman Chhikara et al. "Mem0: Building Production-Ready AI Agents with Scalable Long-Term Memory." 2025.

[13] Shunyu Yao et al. "ReAct: Synergizing Reasoning and Acting in Language Models." 2022.

[14] Sirui Hong et al. "MetaGPT: Meta Programming for A Multi-Agent Collaborative Framework." 2023.

[15] John Yang, Carlos E. Jimenez, Alexander Wettig, Kilian Lieret, Shunyu Yao, Karthik Narasimhan, and Ofir Press. "SWE-agent: Agent-Computer Interfaces Enable Automated Software Engineering." NeurIPS, 2024.

[16] John Yang et al. "AutoCodeRover: Autonomous Program Improvement." 2024.

[17] Mark Marron. "A New Generation of Intelligent Development Environments." 2024.

[18] Zinan Li et al. "The Rise of AI Teammates in Software Engineering (SE) 3.0." 2025.

[19] Adyasha Maharana et al. "Evaluating Very Long-Term Conversational Memory of LLM Agents." 2024.

[20] Hao Liu et al. "LongMemEval: Benchmarking Chat Assistants on Long-Term Interactive Memory." 2024.

[21] Xiao Liu et al. "AgentBench: Evaluating LLMs as Agents." 2023.

[22] Chengsong Chen et al. "ToolQA: A Dataset for LLM Question Answering with External Tools." 2023.

[23] Carlos E. Jimenez et al. "SWE-bench: Can Language Models Resolve Real-World GitHub Issues?" 2023.

[24] Tianlin Zhang et al. "SWE-bench Goes Live!" 2025.

[25] Bin Xiao et al. "τ-bench: A Benchmark for Tool-Agent-User Interaction in Real-World Domains." 2024.

[26] Ahmed E. Hassan and collaborators. "Goal-Driven AI Pair Programmers for Autonomously Developing Software." 2024.

[27] Ira Ceka, Saurabh Pujar, Shyam Ramji, Luca Buratti, Gail Kaiser, and Baishakhi Ray. "Understanding Software Engineering Agents Through the Lens of Traceability: An Empirical Study." 2025.

[28] Sida Peng et al. "The Impact of AI on Developer Productivity: Evidence from GitHub Copilot." 2023.

[29] Song et al. "The Impact of Generative AI on Collaborative Open-Source Software Development: Evidence from GitHub Copilot." 2024.

[30] Welter et al. "From Developer Pairs to AI Copilots: Investigating Knowledge Transfer and Team Composition with LLM Support." 2025.
