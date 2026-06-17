# 30-Episode Validation Hidden Ledger

## Purpose

This is the consolidated hidden research-side ledger for the first full `30`-episode taxonomy validation packet.

It records, for every episode:

- source type
- source pointer
- expected labels
- boundary status
- packet origin

It should not be included in the annotator-facing send pack.

---

## Consolidated Ledger

| Episode ID | Packet Origin | Source Type | Source Pointer | Expected Interruption | Expected Dominant Loss | Boundary Status |
| --- | --- | --- | --- | --- | --- | --- |
| `E-SWE-01` | `pilot` | `repo_grounded` | `docs/tasklog-v4-1-dev-annotation-family-briefs.md` → `authoritative_log_overrides_note` → `v4-1-dev-001` | `multi_open_work_conflict` | `authority_loss` | `boundary` |
| `E-SWE-02` | `pilot` | `repo_grounded` | `docs/tasklog-v4-1-dev-annotation-family-briefs.md` → `blocked_work_requires_escalation` → `v4-1-dev-005` | `blocked_waiting` | `readiness_loss` | `anchor` |
| `E-CON-01` | `pilot` | `constructed` | recurring focus-versus-authority ambiguity observed during prototype development | `multi_open_work_conflict` | `authority_loss` | `boundary` |
| `E-CON-02` | `pilot` | `constructed` | recurring pattern around next-step underconstraint after `act` is already fixed | `session_cutoff` | `intent_loss` | `boundary` |
| `E-HIS-01` | `pilot` | `historical_internal` | historical tracker-versus-engineering-state closure conflict from internal prototype development | `dirty_done` | `closure_loss` | `anchor` |
| `E-CON-03` | `wave_1` | `constructed` | constructed coverage-floor case derived from repeated priority-switch patterns | `task_switch` | `focus_loss` | `anchor` |
| `E-CON-04` | `wave_1` | `constructed` | constructed coverage-floor blocker pattern from repeated approval/dependency waits | `blocked_waiting` | `readiness_loss` | `anchor` |
| `E-CON-05` | `wave_1` | `constructed` | constructed closure-floor case from recurring false-complete patterns | `false_done` | `closure_loss` | `anchor` |
| `E-CON-06` | `wave_1` | `constructed` | constructed multi-open-work ambiguity derived from repeated triage patterns | `multi_open_work_conflict` | `focus_loss` | `boundary` |
| `E-CON-07` | `wave_1` | `constructed` | constructed record-precedence case shaped by pilot authority-vs-readiness lessons | `environment_drift` | `authority_loss` | `stress` |
| `E-CON-08` | `wave_1` | `constructed` | constructed handoff-blocker pattern from repeated model/operator transitions | `handoff` | `readiness_loss` | `stress` |
| `E-CON-09` | `wave_1` | `constructed` | constructed next-step-underconstraint case from post-failure repair planning patterns | `failure_boundary` | `intent_loss` | `boundary` |
| `E-CON-10` | `wave_1` | `constructed` | constructed residual-obligation closure case from repeated dirty-done patterns | `dirty_done` | `closure_loss` | `anchor` |
| `E-SWE-03` | `wave_1` | `repo_grounded` | `docs/tasklog-v4-family-allocation-table.json` → `v4-002` → `authoritative_log_overrides_note` | `environment_drift` | `authority_loss` | `boundary` |
| `E-SWE-07` | `wave_1` | `repo_grounded` | `docs/tasklog-v4-family-allocation-table.json` → `v4-009` → `blocked_work_requires_escalation` | `blocked_waiting` | `readiness_loss` | `anchor` |
| `E-HIS-02` | `wave_2` | `historical_internal` | `workdocs/je0AuN-advance-tasklog-as-an-open-source-tool/spec.md` readiness and blocked-work rules | `blocked_waiting` | `readiness_loss` | `anchor` |
| `E-HIS-03` | `wave_2` | `historical_internal` | `workdocs/lImttL-add-closed-work-re-entry-summaries-to-tasklog/spec.md` plus closure-state discussions | `false_done` | `closure_loss` | `boundary` |
| `E-HIS-04` | `wave_2` | `historical_internal` | `workdocs/EzrPj7-smoke-test-resumptive-state-mcp-surface/summary.md` | `handoff` | `authority_loss` | `stress` |
| `E-PUB-01` | `wave_2` | `public_grounded` | OpenHands issue `#4677` | `task_switch` | `focus_loss` | `boundary` |
| `E-PUB-02` | `wave_2` | `public_grounded` | OpenHands issue `#12170` | `multi_open_work_conflict` | `focus_loss` | `boundary` |
| `E-PUB-03` | `wave_2` | `public_grounded` | OpenHands issue `#11188` | `environment_drift` | `authority_loss` | `boundary` |
| `E-PUB-04` | `wave_2` | `public_grounded` | OpenHands issue `#11432` | `handoff` | `readiness_loss` | `stress` |
| `E-PUB-05` | `wave_2` | `public_grounded` | SWE-agent issue `#1247` | `session_cutoff` | `intent_loss` | `boundary` |
| `E-PUB-06` | `wave_2` | `public_grounded` | SWE-agent issue `#1051` | `failure_boundary` | `intent_loss` | `stress` |
| `E-SWE-04` | `wave_2` | `repo_grounded` | `docs/tasklog-v4-1-dev-source-pool-manifest.json` → `swebench-harness-test-spec` | `handoff` | `authority_loss` | `stress` |
| `E-SWE-05` | `wave_2` | `repo_grounded` | `docs/tasklog-v4-1-dev-source-pool-manifest.json` → `swebench-harness-log-parser-python` | `multi_open_work_conflict` | `focus_loss` | `boundary` |
| `E-SWE-06` | `wave_2` | `repo_grounded` | `docs/tasklog-v4-family-allocation-table.json` → `v4-007` → `stale_active_context_must_be_ignored` | `task_switch` | `focus_loss` | `stress` |
| `E-SWE-08` | `wave_2` | `repo_grounded` | `docs/tasklog-v4-1-dev-source-pool-manifest.json` → `swebench-harness-modal-run-evaluation` / `resume_with_state_constrained_next_step` | `session_cutoff` | `intent_loss` | `boundary` |
| `E-SWE-09` | `wave_2` | `repo_grounded` | `docs/tasklog-v4-family-allocation-table.json` → `v4-021` → `done_work_noise_vs_true_active_signal` | `dirty_done` | `closure_loss` | `anchor` |
| `E-SWE-10` | `wave_2` | `repo_grounded` | `docs/tasklog-v4-1-dev-source-pool-manifest.json` → `swebench-harness-test-spec-javascript` / `done_work_noise_vs_true_active_signal` | `false_done` | `closure_loss` | `boundary` |

---

## Notes

- This ledger is the compact freeze-ready surface for internal review.
- For richer provenance detail on the original pilot episodes, the longer companion source remains `docs/validation-pilot-provenance-ledger.md`.
- For wave-specific rationale prose, the companion sources remain `docs/validation-30-episode-wave-1-ledger.md` and `docs/validation-30-episode-wave-2-ledger.md`.
