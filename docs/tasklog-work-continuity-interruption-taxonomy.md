# Tasklog Work Continuity Interruption Taxonomy

This document defines the interruption classes that a work-centric continuity layer should resolve for coding agents.

The goal is not to preserve arbitrary memory. The goal is to recover the correct current work and the next valid action with the smallest possible read surface and the highest possible certainty.

## Design Goal

Tasklog should optimize for:

- minimal calls
- minimal read volume
- maximal certainty of work recovery
- safe abstention when certainty is insufficient

The continuity layer should answer four questions as early as possible:

1. Which work should be active now?
2. What source is authoritative for that answer?
3. Is that state still fresh enough to trust?
4. What is the next valid action: `act`, `ask`, `wait`, `escalate`, or `abstain`?

## Interruption Taxonomy

| Type | Typical trigger | What is lost | What usually remains | Common failure mode | Recovery target |
| --- | --- | --- | --- | --- | --- |
| `session_cutoff` | context exhaustion, terminal closure, agent crash, time boundary | in-memory plan, local intent, latest next step | workspace, logs, work metadata | the agent resumes the right work but from the wrong point | recover the latest valid next action for the correct work |
| `task_switch` | user changes priority, urgent follow-up, repo switch | active focus, priority ordering | open work list, recent logs, notes | the agent resumes the most recent-looking work instead of the true priority | resolve the true current work |
| `blocked_waiting` | waiting for approval, missing user input, external dependency, deploy/test gate | action readiness | blocker notes, pending status, partial outputs | the agent keeps acting when it should ask, wait, or escalate | recover the correct non-acting state |
| `environment_drift` | files changed, branch changed, concurrent edits, new external state | trust in prior assumptions | old plan, old logs, current workspace | stale context outranks fresher evidence | verify whether prior state is still authoritative |
| `failure_boundary` | command failure, permission failure, tool failure, test failure | forward momentum, confidence in plan | error output, last attempted step, work state | the agent retries blindly or reopens too much context | identify the failure cause and the next legal recovery step |
| `handoff` | model swap, operator swap, cross-session takeover | tacit assumptions, unspoken rationale | durable artifacts only | the receiving agent interprets the same artifacts differently | recover shared authoritative work state without relying on tacit memory |
| `multi_open_work_conflict` | several plausible open works coexist | certainty about which work should resume | open work metadata, logs, notes, workdocs | the agent picks the noisiest or richest work instead of the most authoritative one | break the tie between plausible open works |
| `false_done_or_dirty_done` | work appears done but has unresolved cleanup or follow-up | closure clarity | done logs, changed files, loose notes | the agent closes too early or revives already-finished work | distinguish true completion from follow-up debt |

## Loss Classes

These interruption types are easier to reason about if grouped by the state they damage.

| Loss class | Meaning | Typical interruption types |
| --- | --- | --- |
| `focus_loss` | the agent cannot tell which work should be current | `session_cutoff`, `task_switch`, `multi_open_work_conflict` |
| `intent_loss` | the agent knows the work but not the latest valid next step | `session_cutoff`, `handoff` |
| `authority_loss` | the agent has evidence but cannot tell what to trust | `environment_drift`, `multi_open_work_conflict`, `false_done_or_dirty_done` |
| `readiness_loss` | the agent knows the work but not whether it should act now | `blocked_waiting`, `failure_boundary` |
| `closure_loss` | the agent cannot tell whether the work is done or merely paused near the end | `false_done_or_dirty_done` |

## Agent Recovery State Model

The continuity layer should move the agent into one of these states quickly and explicitly.

| State | Meaning |
| --- | --- |
| `unresolved` | current work cannot yet be determined safely |
| `candidate_found` | a plausible work is found but authority or freshness still needs verification |
| `ready` | current work and next valid action are both known with sufficient confidence |
| `waiting_one_fact` | only one missing fact blocks a safe decision |
| `blocked` | the correct work is known but acting is constrained by an external blocker or ordering rule |
| `stale` | visible context exists but is too stale or conflicted to trust directly |
| `done_pending_close` | the work is substantively finished but lifecycle closure is not yet clean |

## Recovery Matrix

The recovery matrix defines the smallest continuity payload that should resolve each interruption type.

| Type | Minimal fields needed | Preferred retrieval path | Stop condition | Fallback if unresolved |
| --- | --- | --- | --- | --- |
| `session_cutoff` | `active/open works`, `latest authoritative session log`, `next_valid_action`, `blocker_state`, `freshness` | 1. shortlist candidate active works 2. read latest authoritative log for top candidate 3. read `next_valid_action` capsule fields | one work is clearly current and has a valid next action or non-action state | ask for one missing fact or surface top two candidates with authority reasons |
| `task_switch` | `work status`, `updated_at`, `supersedes`, `priority signal`, `latest authoritative source` | 1. rank open works by authority and recency 2. discard superseded or done works 3. inspect top-ranked work only | a single work outranks others on authority, not just recency | request explicit priority confirmation |
| `blocked_waiting` | `blocker_state`, `waiting_on`, `required_actor`, `next_valid_action`, `last_status_change` | 1. inspect blocker capsule 2. inspect latest status transition 3. stop if action mode is non-acting | the layer can safely classify `wait`, `ask`, or `escalate` | ask the single missing fact that would release the blocker |
| `environment_drift` | `freshness`, `workspace_revision` or equivalent, `authoritative_source`, `superseded_by`, `verification_needed` | 1. compare continuity state freshness against current environment markers 2. only if mismatch exists inspect underlying evidence | either prior state is verified fresh or marked stale | mark `stale` and ask for verification before acting |
| `failure_boundary` | `last_attempted_action`, `failure_kind`, `failure_summary`, `retry_policy`, `next_valid_action` | 1. inspect latest failure record 2. classify retryable vs blocked vs escalation-required 3. stop at first valid recovery action | a concrete recovery action is identified without replaying the whole attempt history | request the missing failure detail or open the specific failing artifact only |
| `handoff` | `work summary`, `authoritative_source`, `next_valid_action`, `blocker_state`, `evidence_refs` | 1. read work state capsule 2. inspect only referenced evidence if confidence is below threshold | the receiving agent can state the work, evidence basis, and next action | fall back to the latest authoritative session log |
| `multi_open_work_conflict` | `open works`, `status`, `authority score`, `supersedes`, `active rationale` | 1. enumerate open works 2. eliminate impossible candidates 3. inspect authority evidence only for remaining top candidates | one candidate remains with a clear authority edge | ask the user which work should dominate if authority is still tied |
| `false_done_or_dirty_done` | `status`, `completion marker`, `follow_up_count`, `pending artifact`, `latest authoritative log` | 1. inspect closure capsule 2. verify whether open follow-up exists 3. stop when work can be classified as done or active follow-up | clear classification between done and follow-up | reopen only the closure-adjacent evidence, not the full work history |

## Minimal Continuity Contract

To make the recovery matrix implementable, each work should eventually expose a compact canonical state capsule with at least:

- `work_id`
- `title`
- `status`
- `freshness`
- `authoritative_source`
- `next_valid_action`
- `action_mode`
- `blocker_state`
- `waiting_on`
- `needs_one_fact`
- `supersedes`
- `superseded_by`
- `evidence_refs`

## Design Implications

The taxonomy implies three design constraints for Tasklog:

1. Continuity should be indexed state, not replay-only history.
2. Authority ranking should happen before broad retrieval.
3. The layer should prefer early stopping over context expansion.

In practical terms, the best continuity layer is not the one that helps the agent read more. It is the one that lets the agent avoid unnecessary reads while still recovering the correct work and the next valid action safely.
