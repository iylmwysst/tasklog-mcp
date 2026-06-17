# 30-Episode Validation Candidate Table

## Purpose

This document is the first working candidate table for the `30`-episode taxonomy validation study.

It is not a frozen sample.
Its job is to bridge:

- `docs/30-episode-sampling-matrix.md`
- `docs/episode-authoring-protocol.md`
- the current source reality across `CON`, `REAL`, and `SWE`

The table therefore records not only target labels, but also whether the source substrate is actually available yet.

---

## Bucket Mapping

- `CON` = `constructed`
- `REAL` = `real/public-log` or `historical_internal` used in the real-data bucket
- `SWE` = `SWE-bench-derived` or otherwise `repo_grounded`

---

## Readiness Legend

- `pilot-seeded`: already exists as a pilot episode with provenance
- `author-ready`: can be authored directly from existing constructed patterns
- `swe-pool-ready`: can be selected from existing frozen `V4` / `V4.1-dev` SWE source pools
- `history-scan-needed`: likely available from internal historical / prototype records, but not yet pooled
- `public-sourcing-needed`: intended public-log/public-trace slot, but exact source still needs to be selected

---

## Coverage Summary

| Bucket | Focus | Authority | Readiness | Intent | Closure | Total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `REAL` | 2 | 2 | 2 | 2 | 2 | 10 |
| `CON` | 2 | 2 | 2 | 2 | 2 | 10 |
| `SWE` | 2 | 3 | 2 | 1 | 2 | 10 |
| **Total** | **6** | **7** | **6** | **5** | **6** | **30** |

This matches the current planning matrix.

---

## Candidate Table

| Episode ID | Bucket | Source Type | Target Dominant Loss | Target Interruption | Boundary Status | Source Pointer / Seed | Source Readiness | Authoring Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `E-CON-01` | `CON` | `constructed` | `authority_loss` | `multi_open_work_conflict` | `boundary` | Existing pilot provenance ledger | `pilot-seeded` | `revise-if-reused` | Existing focus-vs-authority stress case |
| `E-CON-02` | `CON` | `constructed` | `intent_loss` | `session_cutoff` | `boundary` | Existing pilot provenance ledger | `pilot-seeded` | `revise-if-reused` | Existing intent case after wording cleanup |
| `E-CON-03` | `CON` | `constructed` | `focus_loss` | `task_switch` | `anchor` | New constructed coverage-floor case | `author-ready` | `authored_wave_1` | Clean current-work identity loss |
| `E-CON-04` | `CON` | `constructed` | `readiness_loss` | `blocked_waiting` | `anchor` | New constructed coverage-floor case | `author-ready` | `authored_wave_1` | Clean act-vs-wait case |
| `E-CON-05` | `CON` | `constructed` | `closure_loss` | `false_done` | `anchor` | New constructed coverage-floor case | `author-ready` | `authored_wave_1` | Clean false-complete case |
| `E-CON-06` | `CON` | `constructed` | `focus_loss` | `multi_open_work_conflict` | `boundary` | New constructed ambiguity case | `author-ready` | `authored_wave_1` | Current-work identity remains unresolved |
| `E-CON-07` | `CON` | `constructed` | `authority_loss` | `environment_drift` | `stress` | New constructed record-precedence case | `author-ready` | `authored_wave_1` | Later state competes with earlier local continuity |
| `E-CON-08` | `CON` | `constructed` | `readiness_loss` | `handoff` | `stress` | New constructed handoff-blocker case | `author-ready` | `authored_wave_1` | Work known, action mode still constrained |
| `E-CON-09` | `CON` | `constructed` | `intent_loss` | `failure_boundary` | `boundary` | New constructed next-step-underconstraint case | `author-ready` | `authored_wave_1` | `act` justified but concrete next move unclear |
| `E-CON-10` | `CON` | `constructed` | `closure_loss` | `dirty_done` | `anchor` | New constructed residual-obligation case | `author-ready` | `authored_wave_1` | Valid done marker but follow-up still governs |
| `E-HIS-01` | `REAL` | `historical_internal` | `closure_loss` | `dirty_done` | `anchor` | Existing pilot provenance ledger | `pilot-seeded` | `revise-if-reused` | Internal historical closure case already authored |
| `E-HIS-02` | `REAL` | `historical_internal` | `readiness_loss` | `blocked_waiting` | `anchor` | `workdocs/je0AuN.../spec.md` blocked/readiness rules | `history-scan-needed` | `authored_wave_2` | Historical/internal readiness case |
| `E-HIS-03` | `REAL` | `historical_internal` | `closure_loss` | `false_done` | `boundary` | `workdocs/lImttL.../spec.md` closure-summary contract | `history-scan-needed` | `authored_wave_2` | Closure variant distinct from `E-HIS-01` |
| `E-HIS-04` | `REAL` | `historical_internal` | `authority_loss` | `handoff` | `stress` | `workdocs/EzrPj7.../summary.md` handoff/summary authority | `history-scan-needed` | `authored_wave_2` | Tests authority after actor boundary |
| `E-PUB-01` | `REAL` | `public_grounded` | `focus_loss` | `task_switch` | `boundary` | OpenHands issue `#4677` | `public-sourcing-needed` | `authored_wave_2` | External current-work drift case |
| `E-PUB-02` | `REAL` | `public_grounded` | `focus_loss` | `multi_open_work_conflict` | `boundary` | OpenHands issue `#12170` | `public-sourcing-needed` | `authored_wave_2` | Two visible strands remain active |
| `E-PUB-03` | `REAL` | `public_grounded` | `authority_loss` | `environment_drift` | `boundary` | OpenHands issue `#11188` | `public-sourcing-needed` | `authored_wave_2` | Competing state records after time gap |
| `E-PUB-04` | `REAL` | `public_grounded` | `readiness_loss` | `handoff` | `stress` | OpenHands issue `#11432` | `public-sourcing-needed` | `authored_wave_2` | Work known but safe action still depends on outside confirmation |
| `E-PUB-05` | `REAL` | `public_grounded` | `intent_loss` | `session_cutoff` | `boundary` | SWE-agent issue `#1247` | `public-sourcing-needed` | `authored_wave_2` | Resumes inside one stable work strand |
| `E-PUB-06` | `REAL` | `public_grounded` | `intent_loss` | `failure_boundary` | `stress` | SWE-agent issue `#1051` | `public-sourcing-needed` | `authored_wave_2` | Recovery complete enough that only next operation remains unclear |
| `E-SWE-01` | `SWE` | `repo_grounded` | `authority_loss` | `multi_open_work_conflict` | `boundary` | `docs/tasklog-v4-1-dev-annotation-family-briefs.md` → `v4-1-dev-001` | `pilot-seeded` | `revise-if-reused` | Existing repo-grounded authority case |
| `E-SWE-02` | `SWE` | `repo_grounded` | `readiness_loss` | `blocked_waiting` | `anchor` | `docs/tasklog-v4-1-dev-annotation-family-briefs.md` → `v4-1-dev-005` | `pilot-seeded` | `revise-if-reused` | Existing repo-grounded readiness case |
| `E-SWE-03` | `SWE` | `repo_grounded` | `authority_loss` | `environment_drift` | `boundary` | `docs/tasklog-v4-family-allocation-table.json` → `v4-002` / `authoritative_log_overrides_note` | `swe-pool-ready` | `authored_wave_1` | Later governing record conflicts with local trail |
| `E-SWE-04` | `SWE` | `repo_grounded` | `authority_loss` | `handoff` | `stress` | `docs/tasklog-v4-1-dev-source-pool-manifest.json` → `swebench-harness-test-spec` | `swe-pool-ready` | `authored_wave_2` | Repo-grounded source-precedence after actor or role shift |
| `E-SWE-05` | `SWE` | `repo_grounded` | `focus_loss` | `multi_open_work_conflict` | `boundary` | `docs/tasklog-v4-1-dev-source-pool-manifest.json` → `swebench-harness-log-parser-python` | `swe-pool-ready` | `authored_wave_2` | Multiple visible work candidates in repo context |
| `E-SWE-06` | `SWE` | `repo_grounded` | `focus_loss` | `task_switch` | `stress` | `docs/tasklog-v4-family-allocation-table.json` → `v4-007` / `stale_active_context_must_be_ignored` | `swe-pool-ready` | `authored_wave_2` | Stale context makes current work identity unstable |
| `E-SWE-07` | `SWE` | `repo_grounded` | `readiness_loss` | `blocked_waiting` | `anchor` | `docs/tasklog-v4-family-allocation-table.json` → `v4-009` / `blocked_work_requires_escalation` | `swe-pool-ready` | `authored_wave_1` | Clean blocker / escalation pattern |
| `E-SWE-08` | `SWE` | `repo_grounded` | `intent_loss` | `session_cutoff` | `boundary` | `docs/tasklog-v4-1-dev-source-pool-manifest.json` → `swebench-harness-modal-run-evaluation` / `resume_with_state_constrained_next_step` | `swe-pool-ready` | `authored_wave_2` | Stable work and governing record, next step underdetermined |
| `E-SWE-09` | `SWE` | `repo_grounded` | `closure_loss` | `dirty_done` | `anchor` | `docs/tasklog-v4-family-allocation-table.json` → `v4-021` / `done_work_noise_vs_true_active_signal` | `swe-pool-ready` | `authored_wave_2` | Completion-looking repo state still hides live obligation |
| `E-SWE-10` | `SWE` | `repo_grounded` | `closure_loss` | `false_done` | `boundary` | `docs/tasklog-v4-1-dev-source-pool-manifest.json` → `swebench-harness-test-spec-javascript` / `done_work_noise_vs_true_active_signal` | `swe-pool-ready` | `authored_wave_2` | False-complete repo-grounded variant |

---

## Current Readout

What is ready now:

- all `CON` slots can be authored immediately
- all `SWE` slots have concrete frozen source substrates and can be selected/authored immediately
- one `REAL` slot already exists as a pilot-seeded historical case

What is still missing:

- any later revision pass after internal review for leakage, wording consistency, and bucket balance

So the current state is:

> all `30` candidate rows are now authored at least once, `REAL` is no longer represented by empty placeholders, and the consolidated annotator-facing packet plus hidden full ledger now exist.

---

## Recommended Next Pass

1. Run one internal leakage and consistency pass across all 30 episodes.
2. Freeze the research-side full ledger if no final wording edits are needed.
3. Send `docs/validation-30-episode-send-pack.md` together with `docs/validation-30-episode-submission-template.md` to annotators.
