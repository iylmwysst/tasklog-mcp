# Tasklog as a Work-Centric Continuity Layer for Structured Coding Re-Entry

## Abstract

Coding agents often fail not because they cannot generate code, but because they must resume interrupted work under incomplete, stale, or conflicting continuity state. We study whether a work-centric continuity surface, Tasklog, improves structured coding-task re-entry under frozen local benchmarks. The evidence now spans three benchmark stages. In `V1`, a five-arm frozen holdout shows that `Tasklog Re-entry` matches a strong `Normalized State` baseline while clearly outperforming weaker baselines such as workspace-only inspection, notes replay, and raw-state reading. In `V2`, an adaptive diagnostic lane introduces provenance conflicts, abstention pressure, escalation requirements, stale-context override, and action-ordering constraints; under the current ontology-sensitive scoring design, Tasklog separates strongly from `Normalized State`, but we treat that result as diagnostic rather than definitive. In `V3b`, a new frozen structured holdout evaluates `Tasklog Re-entry` against `Normalized State` on `32` frozen fixtures from `8` scenario families across three required model slots (`gpt-5.4`, `gpt-5.4-mini`, and `claude-sonnet-4.6`) with three repetitions per slot. That round therefore contains `576` fixture-arm evaluations and `288` paired fixture comparisons overall. Across all nine repetitions, Tasklog Re-entry beats or ties `Normalized State` on the headline `action_valid_success` metric in every repetition (`7` positive, `2` ties, `0` negatives), with an aggregate improvement from `21.88%` to `26.74%`, paired mean difference `+0.0486`, and bootstrap `95%` confidence interval `[0.0208, 0.0764]`. These results support a narrow empirical claim: Tasklog improves frozen structured work-reentry quality over a fair normalized baseline. They do not yet support a broader claim about interactive sequencing, runtime efficiency parity, or general coding-agent continuation.

## 1. Introduction

Interruptions are routine in practical coding workflows. A model or operator pauses one task, returns later, and must recover which work matters now, whether the visible context remains trustworthy, and what action is both valid and useful next. This is a continuity problem, not merely a code-generation problem.

Tasklog is a work-first continuity surface intended to reduce that re-entry burden. Its central premise is that structured work state, session logs, and workdocs should help a later model pass recover the correct action more reliably than weaker alternatives such as raw workspace inspection or free-form note replay.

The empirical question is more demanding than the product intuition. Weak baselines are easy to outperform. A sufficiently strong generic normalization layer can already recover obvious work-selection decisions when the task is shallow enough. The central question is therefore whether Tasklog adds value over a fair strong baseline, and, if so, under what forms of re-entry difficulty.

This draft addresses a narrower question than a full Q1 systems paper would need to answer:

`Under frozen local benchmarks, does a work-centric Tasklog surface improve coding-task re-entry quality over fair alternative continuity surfaces, and what part of that claim is currently supported?`

Our answer is more specific than in the earlier draft. `V1` established value against weaker baselines. `V2` exposed stronger provenance-sensitive separation, but under an adaptive and still ontology-sensitive lane. `V3b` now adds a frozen multi-model structured holdout in which `Tasklog Re-entry` outperforms a fair `Normalized State` baseline overall. That progression moves the project from a strong pilot signal to a narrow paper-ready empirical claim, while still falling short of a broader Q1-safe story.

## 2. Related Work

The literature most relevant to this paper falls into five adjacent strands: programming-task resumption, agent memory, coding-agent workflow systems, retrieval and benchmark literature, and software coordination or tacit work-state studies. Together, these strands justify the problem and clarify the contribution, but none of them directly define `work-centric continuity for coding agents` as the primary system object.

### 2.1 Programming Task Resumption and Interruption

The deepest conceptual root of this paper is not the recent agent-memory literature, but the task-resumption literature. Foundational work by Trafton et al. and Altmann and Trafton shows that interruption costs arise not only from forgetting facts, but from losing access to goal state, next-step cues, and the conditions that make resumption efficient rather than hesitant [1, 2]. Matthews et al. similarly show that interface support can materially improve reacquisition of task context after interruption [3]. Iqbal and Horvitz extend this picture by demonstrating that disruption and recovery are practical system-design concerns in real computing environments rather than merely laboratory effects [4, 5].

Within software engineering, Parnin and Rugaber, followed by DeLine and Parnin, provide the closest pre-LLM grounding for the present problem [6, 7]. Their work shows that interrupted programming tasks are difficult to resume and that external cues can improve recovery. This literature is essential because it frames re-entry as a structured continuity problem rather than as a generic information-retrieval problem. At the same time, those studies were designed for human developers and interface cues, not for coding agents that must reconstruct work state from machine-readable logs, workdocs, and provenance-bearing artifacts. Tasklog inherits the same underlying problem while changing both the actor and the continuity substrate: instead of supporting a human programmer with visual cues alone, it exposes structured work-centered evidence for a later model pass.

This distinction matters for the contribution claim. If the paper merely repeated the now-familiar claim that interruptions are harmful and cues are useful, it would add little. The more specific claim is that coding-agent workflows require continuity state organized around `work`, `handoff`, `next step`, and `artifacts`, and that such structure should itself be evaluated. The task-resumption literature therefore provides the problem legitimacy and conceptual motivation, but not the system abstraction or evaluation protocol introduced here.

### 2.2 Agent Memory and Long-Lived LLM State

The most obvious neighboring literature is the recent wave of agent-memory systems. MemGPT, Reflexion, Mem0, and architectural treatments such as CoALA ask how language agents can maintain or improve state across long-lived interaction [8, 9, 10, 12]. These systems typically focus on remembering useful information over time: user facts, interaction history, reflections, plans, or distilled memories that can later be retrieved. Surveys of memory mechanisms for LLM agents organize this space around memory storage, retrieval, summarization, and control [11].

This literature is directly relevant because Tasklog also externalizes cross-session state. However, the fit is incomplete. Most memory systems optimize for remembering broadly useful context across many future interactions. Their unit of persistence is typically a memory item, summary, reflection, or conversational fact. By contrast, Tasklog's unit of continuity is the `work item`. The system is less concerned with preserving arbitrary long-term memory than with recovering the current actionable state of one piece of engineering work: what is active, which evidence is authoritative, what blocker or status constrains the next step, and which artifacts define the handoff boundary.

That difference changes both the design space and the fair comparison. A general memory layer may excel at preference retention, conversational recall, or broad autobiographical continuity without necessarily helping a coding agent choose the correct work to resume or abstain when authoritative signal is weak. Conversely, a work-centric surface may be narrower, but it can shape evidence in precisely the ways that matter for resumptive decisions. The point of Tasklog is therefore not that general memory is unimportant, but that generic long-term memory is not the only useful abstraction for coding agents. Work continuity deserves to be treated as a first-class problem with its own interfaces and evaluation criteria.

### 2.3 Coding-Agent Systems and Persistent Development Context

A third neighboring body of work comes from coding-agent and AI-assisted development systems. ReAct established the now-standard pattern of interleaving reasoning and actions [13]. MetaGPT explored structured software workflows through explicit role decomposition and standard operating procedures [14]. SWE-agent and AutoCodeRover demonstrate increasingly capable agents that navigate repositories, issue descriptions, and action spaces to solve software tasks [15, 16]. Broader visions of intelligent development environments and AI teammates in software engineering argue that software work is becoming a mixed human-agent workflow rather than a single-pass coding problem [17, 18]. Related work on goal-driven AI pair programmers and the traceability of software-engineering agents strengthens the same point from two different directions: realistic agent development is iterative, workflow-shaped, and sensitive to the structure of intermediate state rather than only to final issue-resolution accuracy [26, 27].

These systems are adjacent to Tasklog because they inhabit the same software-engineering setting and often require continuity across multiple steps, tools, or repository interactions. Yet they typically optimize a different target. Most coding-agent systems focus on issue solving, search, planning, action selection, or repository repair. Their main challenge is how to act effectively in code environments, not how to represent and recover interrupted work state as a durable cross-session object. In this sense, they are closer to autonomous or semi-autonomous software agents than to continuity infrastructure.

Tasklog therefore should not be positioned as a replacement for systems such as SWE-agent or AutoCodeRover, nor as a universal project-management layer. Its most defensible position is narrower: a continuity layer that can sit underneath or alongside coding agents by structuring resumptive evidence before the next model pass begins. This framing also matches the practical distinction between memory of facts and continuity of work. Current coding-assistant ecosystems increasingly provide persistent instructions, notes, or project memories, and the broader AI-assisted development literature already shows that coding assistance is reshaping productivity, collaboration, and knowledge-transfer patterns [28, 29, 30]. Tasklog's contribution is to center that continuity problem around resumable work state rather than around general instructions or conversation history.

### 2.4 Retrieval and Benchmark Literature

Retrieval-oriented systems and benchmarks shape the strongest non-Tasklog comparator story. Foundational RAG work, black-box retrieval layers such as REPLUG, and in-context retrieval augmentation all show that models can improve when external evidence is selected and supplied at inference time [19, 20, 21]. RAG-oriented benchmark and evaluation papers then move beyond simple accuracy by emphasizing noise robustness, evidence quality, and the distinction between retrieved support and final answer quality [22, 23, 24, 25]. Code-domain retrieval work such as RepoCoder and RepoFusion brings the same concern into repository-scale software settings [31, 32].

This literature matters because it provides a serious alternative explanation for any observed Tasklog gain: perhaps Tasklog succeeds only because it is another retrieval layer. That possibility is exactly why the fair comparator in this paper is not only a weak baseline, but also a strong `Normalized State` baseline that preserves generic flattening and normalization. At the same time, the retrieval literature clarifies the limit of that comparison. Generic retrieval-oriented systems usually organize context around document or snippet relevance. Tasklog organizes continuity around work-state authority and resumptive validity: which work should be resumed, which evidence is authoritative, whether the visible active context is stale, and what next step is legal under the current work state. The paper therefore should not claim that Tasklog replaces RAG. It should claim that work-centric continuity is a different and useful abstraction from generic retrieval shaping.

Benchmark literature outside RAG sharpens the evaluation story further. AgentBench, ToolQA, SWE-bench, SWE-bench Goes Live, LoCoMo, and LongMemEval all show that benchmark credibility depends on frozen fixtures, fair comparators, and contamination-aware methodology [33, 34, 35, 36, 37, 38]. Yet these benchmarks still target different objects: tool use, issue resolution, or conversational memory. They do not directly measure whether a model can recover the correct work, identify authoritative continuity evidence, and choose a valid next step under interrupted coding conditions. Our benchmark program fills that missing niche rather than attempting to replace these broader evaluation families.

### 2.5 Work Coordination, Handoff, and Tacit State

The final relevant strand concerns software coordination and tacit work-state literature. Distributed software-development studies show that shared mental models and coordination structures materially affect outcomes in large-scale software work [39]. Work on asynchronous development similarly shows that lightweight coordination support can prevent expensive downstream recovery costs [40]. Empirical studies of tacit knowledge in software teams further reinforce that important work state is often social, implicit, and fragile unless it is externalized well [41].

These papers matter because they strengthen a part of the Tasklog argument that interruption studies and memory papers do not fully capture. The continuity problem is not only about retrieving information; it is also about preserving enough structured work understanding that later collaborators, including coding agents, can recover a valid path forward. Tasklog can therefore be read as one concrete attempt to externalize work state that would otherwise remain partly tacit, scattered, or coordination-heavy.

### 2.6 Implications for the Present Paper

Taken together, the literature suggests that Tasklog occupies an under-described intersection. The task-resumption literature explains why resumptive cues matter; the agent-memory literature shows how cross-session state can be externalized; the coding-agent literature shows why structured software workflows matter; the retrieval literature explains the strongest generic alternative; and the coordination literature clarifies why `work` is a meaningful unit of continuity rather than merely another storage key. Yet none of these literatures, on their own, provide a work-first continuity abstraction targeted at interrupted coding re-entry.

That is the niche this paper claims. Tasklog is best understood not as a universal memory platform, not as a generic RAG stack, and not as an autonomous issue-solving agent, but as a `work-centric continuity layer for coding agents`. The paper's contribution is therefore twofold. At the system level, it proposes that `work` is the right unit of continuity for coding-task re-entry. At the empirical level, it evaluates whether that work-centric surface improves frozen structured re-entry quality over a fair `Normalized State` baseline. Framed this way, Related Work does not dilute the contribution. It clarifies why the problem is real, why adjacent categories are incomplete matches, and why the paper's narrow empirical claim is worth testing directly.

## 3. Evidence Hierarchy

The current evidence package should be read in three layers.

### 3.1 Developmental Evidence

`V1` and `V2` remain useful because they explain how the benchmark story evolved:

- `V1` shows that Tasklog clearly beats weaker baselines
- `V2` shows where provenance-grounded re-entry differences begin to appear

Neither lane should carry the main empirical claim by itself.

### 3.2 Primary Claim Evidence

The main claim now rests on `V3b`, the frozen structured `work_reentry` holdout summarized in [tasklog-v3b-results-summary.md](/Users/Lab/Desktop/WebWay/tasklog-mcp/docs/tasklog-v3b-results-summary.md).

This round is the strongest current evidence because it:

- uses a frozen structured holdout
- compares `Tasklog Re-entry` directly against `Normalized State`
- covers `32` fixtures from `8` required provenance-sensitive scenario families
- spans three required model slots
- uses three repetitions per slot
- yields `576` fixture-arm evaluations and `288` paired fixture comparisons overall
- reports paired differences and confidence intervals

### 3.3 Evidence We Still Do Not Have

We still lack:

- a frozen interactive benchmark result
- a full runtime efficiency table with comparable token, latency, and cost metadata
- broader external-validation material beyond the current hand-authored local fixtures

Those missing pieces matter for a broad Q1-safe claim, but not for the narrower empirical claim now supported by `V3b`.

## 4. Benchmark Program

### 4.1 V1: Five-Arm Frozen Holdout

The first lane is the frozen holdout described in [tasklog-swe-holdout-round-v1.md](/Users/Lab/Desktop/WebWay/tasklog-mcp/docs/tasklog-swe-holdout-round-v1.md). It contains `10` frozen local fixtures and compares five continuity arms:

- `Workspace-Only`
- `Notes Replay`
- `Raw State`
- `Normalized State`
- `Tasklog Re-entry`

Each arm runs in isolation and sees only its arm-specific payload. The fixed model is Codex `gpt-5.4-mini` with reasoning setting `none`. The comparison artifact is [holdout-graded.json](/Users/Lab/Desktop/TasklogSweLab/runs/holdout-five-arm-codex-mini/holdout-graded.json).

### 4.2 V2: Adaptive Provenance-Sensitive Diagnostic Lane

The second lane is defined in [tasklog-swe-holdout-v2-direction.md](/Users/Lab/Desktop/WebWay/tasklog-mcp/docs/tasklog-swe-holdout-v2-direction.md) and frozen for its smoke contract in [tasklog-swe-holdout-v2-smoke-contract.md](/Users/Lab/Desktop/WebWay/tasklog-mcp/docs/tasklog-swe-holdout-v2-smoke-contract.md). It compares only:

- `Normalized State`
- `Tasklog Re-entry`

The lane contains `10` fixtures covering provenance conflicts, abstention, escalation, stale-context override, and action-ordering pressure under a one-shot structured decision task.

This lane remains diagnostic for two reasons:

- it was motivated after observing the `V1` ceiling effect
- its decision-core story still depends partly on exact `primary_evidence_source` ontology

### 4.3 V3b: Frozen Multi-Model Structured Holdout

The third lane is the current `Bench A` claim-bearing round described by:

- [tasklog-v3b-model-roster-freeze-note.md](/Users/Lab/Desktop/WebWay/tasklog-mcp/docs/tasklog-v3b-model-roster-freeze-note.md)
- [tasklog-v3-paper-readiness-gates.md](/Users/Lab/Desktop/WebWay/tasklog-mcp/docs/tasklog-v3-paper-readiness-gates.md)
- [tasklog-v3b-results-summary.md](/Users/Lab/Desktop/WebWay/tasklog-mcp/docs/tasklog-v3b-results-summary.md)

This round inherits the frozen structured `work_reentry` protocol and compares:

- `Normalized State`
- `Tasklog Re-entry`

across three required model slots:

- `gpt-5.4`
- `gpt-5.4-mini`
- `claude-sonnet-4.6`

Each slot completes `3` full-pack repetitions.

The frozen pack contains `32` unique fixtures from `8` required families. Those families are designed to cover distinct provenance-sensitive re-entry difficulties rather than minor prompt variations:

- `authoritative_log_overrides_note`: newer structured logs should outrank older broad notes
- `stale_active_context_must_be_ignored`: visible active context is stale or superseded
- `blocked_work_requires_escalation`: the right work is known but the next legal step is escalation
- `abstain_when_no_authoritative_source`: evidence is too weak or conflicting to justify resuming
- `ask_single_missing_fact_before_resume`: one concrete missing fact should be requested before acting
- `done_work_noise_vs_true_active_signal`: richer completed-work artifacts distract from the real active target
- `provenance_tiebreak_between_open_works`: two open works look plausible and provenance must break the tie
- `resume_with_state_constrained_next_step`: the right work is identifiable but the next action is constrained by blocker state or ordering

Because every repetition evaluates all `32` fixtures under both arms, one repetition of one model slot produces `64` fixture-arm evaluations. Across `3` model slots and `3` repetitions per slot, `V3b` therefore totals `576` fixture-arm evaluations, or `288` paired fixture comparisons between `Tasklog Re-entry` and `Normalized State`.

### 4.4 What This Draft Still Excludes

This draft does not treat `Bench C1` or `Bench C2` as main evidence.

- `Bench C1` is a scripted full-session supporting benchmark
- `Bench C2` is an interactive full-session benchmark that should remain supporting or exploratory until its protocol is frozen

Those benchmarks matter for a broader workflow story, but they should not be mixed into the main table before they have their own frozen protocols.

## 5. Results

### 5.1 V1 Results

| Arm | Strict Accuracy |
| --- | ---: |
| Workspace-Only | 0/10 |
| Notes Replay | 1/10 |
| Raw State | 3/10 |
| Normalized State | 10/10 |
| Tasklog Re-entry | 10/10 |

V1 supports a clear but narrow statement: Tasklog improves re-entry relative to weaker continuity baselines on this frozen holdout. It does not establish superiority over a strong normalized baseline, because `Normalized State` also scores `10/10`.

### 5.2 V2 Results

| Arm | Strict | Decision-Core | Canonical Decision-Core |
| --- | ---: | ---: | ---: |
| Normalized State | 0/10 | 0/10 | 0/10 |
| Tasklog Re-entry | 0/10 | 8/10 | 10/10 |

V2 shows strong diagnostic separation under the current scoring policy. Tasklog outperforms the normalized baseline on both exact and canonicalized decision-core metrics. However, the lane remains ontology-sensitive and adaptive, and therefore should still be treated as diagnostic evidence rather than as the main clean superiority result.

### 5.3 V3b Main Results

Headline metric:

- `action_valid_success`
- paired difference measured as `Tasklog Re-entry - Normalized State`

| Model | Reps | Positive / Tie / Negative Reps | Normalized State | Tasklog Re-entry | Delta (points) | Relative Uplift | Paired Mean Diff | 95% CI |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `gpt-5.4` | 3 | 2 / 1 / 0 | 30.21% | 33.34% | +3.13 | +10.35% | +0.0313 | [-0.0104, 0.0833] |
| `gpt-5.4-mini` | 3 | 2 / 1 / 0 | 26.04% | 33.33% | +7.29 | +27.99% | +0.0729 | [0.0208, 0.1354] |
| `claude-sonnet-4.6` | 3 | 3 / 0 / 0 | 9.38% | 13.54% | +4.16 | +44.39% | +0.0417 | [0.0104, 0.0833] |
| `Overall` | 9 | 7 / 2 / 0 | 21.88% | 26.74% | +4.86 | +22.21% | +0.0486 | [0.0208, 0.0764] |

This is the first round in which the project cleanly separates from a fair normalized baseline under a frozen multi-model holdout. The aggregate headline confidence interval does not cross `0`, and none of the nine repetitions are negative.

These percentages summarize a benchmark that remains modest in unique scenario count, but is no longer a tiny single-run probe: the completed `V3b` round pools `32` frozen fixtures across `8` families, `2` arms, `3` model slots, and `3` repetitions per slot.

### 5.4 Secondary and Efficiency Results

Overall secondary quality metrics from `V3b`:

| Metric | Normalized State | Tasklog Re-entry | Delta (points) | Paired Mean Diff | 95% CI |
| --- | ---: | ---: | ---: | ---: | --- |
| `next_step_accuracy` | 50.00% | 61.46% | +11.46 | +0.1146 | [0.0590, 0.1736] |
| `strict_contract_accuracy` | 13.54% | 17.36% | +3.82 | +0.0382 | [0.0035, 0.0729] |

Available efficiency signal from the same frozen round:

- median payload bytes are `1616.5` for `Normalized State`
- median payload bytes are `1535.5` for `Tasklog Re-entry`
- Tasklog therefore uses about `5%` less prompt payload surface in the current frozen artifacts

This supports a limited efficiency readout around `context surface`. It does not yet support stronger claims about runtime token, latency, or cost parity, because the `V3b` runner did not populate comparable runtime metadata for those fields.

### 5.5 What the Combined Program Says

The current three-stage picture is coherent:

- `V1` shows that Tasklog clearly beats weaker baselines
- `V2` shows why provenance-sensitive re-entry is a meaningful harder target
- `V3b` now shows a direct positive result against a fair normalized baseline under frozen multi-model conditions

Taken together, the evidence now supports a real narrow empirical claim rather than only a pilot-study signal.

## 6. Discussion

### 6.1 Safe Current Claim

The safest current claim is:

`On a frozen structured work-reentry holdout, Tasklog Re-entry improves re-entry quality over a fair Normalized State baseline across three required model slots.`

That claim is substantially stronger than the one supported by the earlier draft, but it remains much narrower than a broad Q1-safe systems claim.

### 6.2 What V3b Adds Over Earlier Lanes

Relative to the earlier `V1 + V2` story, `V3b` adds four features that materially strengthen the manuscript:

- stronger evidence than the adaptive V2 lane
- cross-model coverage rather than a single-model story
- repeated-trial stability through `3` repetitions per slot
- confidence intervals on the headline metric

This moves the project beyond a purely diagnostic result.

### 6.3 Smaller-Model Trend

The strongest uplift appears on `gpt-5.4-mini`. That supports a cautious trend statement:

`lower-capacity models may benefit more from work-centric re-entry structure`

This should still be phrased carefully. The current evidence supports a trend, not a universal law.

### 6.4 What This Draft Still Does Not Claim

This draft does not claim:

- a broad Q1-safe result
- general interactive sequencing superiority
- runtime efficiency parity
- external validity beyond the current frozen local benchmark family
- end-to-end unfinished-task continuation from historical code snapshots

## 7. Limitations and Next Steps

The project still falls short of a broad Q1-safe empirical package for four main reasons.

First, we still do not have a frozen interactive benchmark result. `Bench C2` remains supporting or exploratory rather than claim-bearing.

Second, the efficiency story is still partial. `V3b` supports a context-surface comparison, but not a full runtime cost or latency comparison.

Third, the supporting benchmark inventory remains incomplete at paper-package level. `Bench B` and `Bench C1` are still supporting tracks that need to be closed cleanly if we want a broader evidence story.

Fourth, the benchmark material is still modest in unique scenario diversity and remains hand-authored. `V3b` is not merely a `32`-datapoint smoke test: the completed round contains `576` fixture-arm evaluations and `288` paired fixture comparisons, which is materially larger than a single-model pilot. However, the underlying scenario set is still only `32` frozen local fixtures across `8` families, so broader external-validation evidence is still missing.

The most practical next step is therefore not to over-expand the main claim. It is to keep `V3b` as the main results table, then add one supporting benchmark plus a bounded efficiency follow-up.

## 8. Conclusion

The current evidence is stronger than the earlier diagnostic draft implied. `V1` and `V2` remain useful developmental artifacts, but `V3b` now supplies a frozen multi-model result in which `Tasklog Re-entry` outperforms a fair normalized baseline overall with a positive aggregate confidence interval. That is enough for a narrow paper-ready empirical claim about structured work re-entry. It is not yet enough for a broad Q1-safe claim about interactive agent continuation or general coding-agent performance. The correct next move is therefore not to broaden the claim prematurely, but to package `V3b` cleanly and extend the evidence one supporting benchmark family at a time.

## References (Provisional)

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

[19] Patrick Lewis et al. "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks." 2020.

[20] Ori Ram et al. "In-Context Retrieval-Augmented Language Models." 2023.

[21] Weijia Shi et al. "REPLUG: Retrieval-Augmented Black-Box Language Models." 2023.

[22] Jiawei Chen, Hongyu Lin, Xianpei Han, and Le Sun. "Benchmarking Large Language Models in Retrieval-Augmented Generation." 2023.

[23] Jon Saad-Falcon, Omar Khattab, Christopher Potts, and Matei Zaharia. "ARES: An Automated Evaluation Framework for Retrieval-Augmented Generation Systems." 2023.

[24] Yunfan Gao et al. "Retrieval-Augmented Generation for Large Language Models: A Survey." 2023.

[25] Ori Yoran et al. "Making Retrieval-Augmented Language Models Robust to Irrelevant Context." 2023.

[26] Ahmed E. Hassan and collaborators. "Goal-Driven AI Pair Programmers for Autonomously Developing Software." 2024.

[27] Ira Ceka, Saurabh Pujar, Shyam Ramji, Luca Buratti, Gail Kaiser, and Baishakhi Ray. "Understanding Software Engineering Agents Through the Lens of Traceability: An Empirical Study." 2025.

[28] Sida Peng et al. "The Impact of AI on Developer Productivity: Evidence from GitHub Copilot." 2023.

[29] Song et al. "The Impact of Generative AI on Collaborative Open-Source Software Development: Evidence from GitHub Copilot." 2024.

[30] Welter et al. "From Developer Pairs to AI Copilots: Investigating Knowledge Transfer and Team Composition with LLM Support." 2025.

[31] Fengji Zhang et al. "RepoCoder: Repository-Level Code Completion Through Iterative Retrieval and Generation." 2023.

[32] Disha Shrivastava et al. "RepoFusion: Training Code Models to Understand Your Repository." 2023.

[33] Xiao Liu et al. "AgentBench: Evaluating LLMs as Agents." 2023.

[34] Chengsong Chen et al. "ToolQA: A Dataset for LLM Question Answering with External Tools." 2023.

[35] Carlos E. Jimenez et al. "SWE-bench: Can Language Models Resolve Real-World GitHub Issues?" 2023.

[36] Tianlin Zhang et al. "SWE-bench Goes Live!" 2025.

[37] Adyasha Maharana et al. "Evaluating Very Long-Term Conversational Memory of LLM Agents." 2024.

[38] Hao Liu et al. "LongMemEval: Benchmarking Chat Assistants on Long-Term Interactive Memory." 2024.

[39] Alberto Espinosa, Robert Kraut, Javier Lerch, Sandra Slaughter, James Herbsleb, and Audris Mockus. "Shared Mental Models and Coordination in Large-Scale, Distributed Software Development." ICIS 2001.

[40] Prasun Dewan and Rajesh Hegde. "Semi-Synchronous Conflict Detection and Resolution in Asynchronous Software Development." ECSCW 2007.

[41] Sharon M. Ryan and Rory O'Connor. "Acquiring and Sharing Tacit Knowledge in Software Development Teams: An Empirical Study." Information and Software Technology, 2013.

## Appendix: Safe Headline Claim

`Tasklog Re-entry improves frozen structured work-reentry quality over a fair Normalized State baseline, while broader claims about interactivity, runtime efficiency, and generalization remain future work.`
