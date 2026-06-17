# 30-Episode Validation Wave 2 Ledger

## Purpose

This is the hidden research-side ledger for `docs/validation-30-episode-wave-2.md`.

It records source pointers, intended labels, and wave-selection rationale.

It should not be included in the annotator-facing packet.

---

## E-HIS-02

- `episode_id`: `E-HIS-02`
- `source_type`: `historical_internal`
- `source_pointer`: `workdocs/je0AuN-advance-tasklog-as-an-open-source-tool/spec.md` readiness and blocked-work rules
- `expected interruption_class`: `blocked_waiting`
- `expected dominant_loss_class`: `readiness_loss`
- `boundary_status`: `anchor`
- `why_in_wave_2`: historical/internal readiness case needed to strengthen REAL coverage

## E-HIS-03

- `episode_id`: `E-HIS-03`
- `source_type`: `historical_internal`
- `source_pointer`: `workdocs/lImttL-add-closed-work-re-entry-summaries-to-tasklog/spec.md` plus closure-state discussions in `je0AuN` workdocs
- `expected interruption_class`: `false_done`
- `expected dominant_loss_class`: `closure_loss`
- `boundary_status`: `boundary`
- `why_in_wave_2`: historical/internal false-done variant distinct from pilot dirty-done

## E-HIS-04

- `episode_id`: `E-HIS-04`
- `source_type`: `historical_internal`
- `source_pointer`: `workdocs/EzrPj7-smoke-test-resumptive-state-mcp-surface/summary.md`
- `expected interruption_class`: `handoff`
- `expected dominant_loss_class`: `authority_loss`
- `boundary_status`: `stress`
- `why_in_wave_2`: gives REAL bucket a handoff-driven authority case

## E-PUB-01

- `episode_id`: `E-PUB-01`
- `source_type`: `public_grounded`
- `source_pointer`: public agent-trace pattern abstracted from OpenHands issue `#4677`
- `source_url`: `https://github.com/OpenHands/OpenHands/issues/4677`
- `expected interruption_class`: `task_switch`
- `expected dominant_loss_class`: `focus_loss`
- `boundary_status`: `boundary`

## E-PUB-02

- `episode_id`: `E-PUB-02`
- `source_type`: `public_grounded`
- `source_pointer`: public stale-status pattern abstracted from OpenHands issue `#12170`
- `source_url`: `https://github.com/OpenHands/OpenHands/issues/12170`
- `expected interruption_class`: `multi_open_work_conflict`
- `expected dominant_loss_class`: `focus_loss`
- `boundary_status`: `boundary`

## E-PUB-03

- `episode_id`: `E-PUB-03`
- `source_type`: `public_grounded`
- `source_pointer`: public conflicting-runtime-state pattern abstracted from OpenHands issue `#11188`
- `source_url`: `https://github.com/OpenHands/OpenHands/issues/11188`
- `expected interruption_class`: `environment_drift`
- `expected dominant_loss_class`: `authority_loss`
- `boundary_status`: `boundary`

## E-PUB-04

- `episode_id`: `E-PUB-04`
- `source_type`: `public_grounded`
- `source_pointer`: public stalled-task-tracking pattern abstracted from OpenHands issue `#11432`
- `source_url`: `https://github.com/OpenHands/OpenHands/issues/11432`
- `expected interruption_class`: `handoff`
- `expected dominant_loss_class`: `readiness_loss`
- `boundary_status`: `stress`

## E-PUB-05

- `episode_id`: `E-PUB-05`
- `source_type`: `public_grounded`
- `source_pointer`: public batch-run continuation pattern abstracted from SWE-agent issue `#1247`
- `source_url`: `https://github.com/SWE-agent/SWE-agent/issues/1247`
- `expected interruption_class`: `session_cutoff`
- `expected dominant_loss_class`: `intent_loss`
- `boundary_status`: `boundary`

## E-PUB-06

- `episode_id`: `E-PUB-06`
- `source_type`: `public_grounded`
- `source_pointer`: public failure-loop repair pattern abstracted from SWE-agent issue `#1051`
- `source_url`: `https://github.com/SWE-agent/SWE-agent/issues/1051`
- `expected interruption_class`: `failure_boundary`
- `expected dominant_loss_class`: `intent_loss`
- `boundary_status`: `stress`

## E-SWE-04

- `episode_id`: `E-SWE-04`
- `source_type`: `repo_grounded`
- `source_pointer`: `docs/tasklog-v4-1-dev-source-pool-manifest.json` → `swebench-harness-test-spec`
- `expected interruption_class`: `handoff`
- `expected dominant_loss_class`: `authority_loss`
- `boundary_status`: `stress`

## E-SWE-05

- `episode_id`: `E-SWE-05`
- `source_type`: `repo_grounded`
- `source_pointer`: `docs/tasklog-v4-1-dev-source-pool-manifest.json` → `swebench-harness-log-parser-python`
- `expected interruption_class`: `multi_open_work_conflict`
- `expected dominant_loss_class`: `focus_loss`
- `boundary_status`: `boundary`

## E-SWE-06

- `episode_id`: `E-SWE-06`
- `source_type`: `repo_grounded`
- `source_pointer`: `docs/tasklog-v4-family-allocation-table.json` → `v4-007` → `stale_active_context_must_be_ignored`
- `expected interruption_class`: `task_switch`
- `expected dominant_loss_class`: `focus_loss`
- `boundary_status`: `stress`

## E-SWE-08

- `episode_id`: `E-SWE-08`
- `source_type`: `repo_grounded`
- `source_pointer`: `docs/tasklog-v4-1-dev-source-pool-manifest.json` → `swebench-harness-modal-run-evaluation` / `resume_with_state_constrained_next_step`
- `expected interruption_class`: `session_cutoff`
- `expected dominant_loss_class`: `intent_loss`
- `boundary_status`: `boundary`

## E-SWE-09

- `episode_id`: `E-SWE-09`
- `source_type`: `repo_grounded`
- `source_pointer`: `docs/tasklog-v4-family-allocation-table.json` → `v4-021` → `done_work_noise_vs_true_active_signal`
- `expected interruption_class`: `dirty_done`
- `expected dominant_loss_class`: `closure_loss`
- `boundary_status`: `anchor`

## E-SWE-10

- `episode_id`: `E-SWE-10`
- `source_type`: `repo_grounded`
- `source_pointer`: `docs/tasklog-v4-1-dev-source-pool-manifest.json` → `swebench-harness-test-spec-javascript` / `done_work_noise_vs_true_active_signal`
- `expected interruption_class`: `false_done`
- `expected dominant_loss_class`: `closure_loss`
- `boundary_status`: `boundary`
