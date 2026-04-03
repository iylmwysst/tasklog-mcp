# Tasklog SWE Holdout Round V1

This document freezes the first claim-bearing holdout round configuration for the Tasklog SWE-style re-entry benchmark.

## Frozen Inputs

- holdout pack: `tasklog-swe-holdout-v1`
- fixture root: `/Users/Lab/Desktop/TasklogSweLab/fixtures`
- fixture count: `10`
- split: `holdout`
- benchmark type: `llm_reentry_understanding`

The frozen fixture families are:

- `stale_active_context_resume`
- `active_context_correct`
- `multiple_open_works_resume`
- `blocked_work_triage`
- `closed_work_do_not_resume`
- `artifact_heavy_done_work`
- `docs_heavy_wrong_target`
- `two_plausible_active_works`
- `cross_scope_distractor`
- `next_step_precision`

## Frozen Runner

- runner name: `tasklog-swe-holdout-runner`
- runner version: `2026-03-29`
- execution mode: static frozen payload per arm
- isolation rule: each arm runs in an ephemeral temp workspace and sees only its own payload, not the full fixture workspace

## Frozen Model Roster

Primary holdout round:

- provider: `openai`
- model id: `gpt-5.4-mini`
- model family: `gpt-5.4-mini`
- reasoning setting: `none`
- primary arm: `Tasklog Re-entry`

Secondary comparison round, if executed under the same frozen round:

- provider: `openai`
- model id: `gpt-5.4-mini`
- model family: `gpt-5.4-mini`
- reasoning setting: `none`
- arm set:
  - `Workspace-Only`
  - `Notes Replay`
  - `Raw State`
  - `Normalized State`
  - `Tasklog Re-entry`

## Validation Gate

Before the full holdout round:

1. run a representative rehearsal on at least one stale-context case, one blocked-work case, and one next-step-precision case
2. confirm the runner emits metadata that passes `bench:validate-meta`
3. do not change fixture questions or answer keys based on holdout rehearsal outcomes

Rehearsal artifact for this round:

- `/Users/Lab/Desktop/TasklogSweLab/runs/holdout-rehearsal-tasklog-mini`

This document should not be edited in place once the first full round starts. If the runner, roster, or payload design changes materially, create a new round document instead.
