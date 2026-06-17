# 30-Episode Validation Wave 1 Ledger

## Purpose

This is the hidden research-side ledger for `docs/validation-30-episode-wave-1.md`.

It records:

- source type
- source pointer
- intended labels
- why the case is in wave 1

It should not be included in the annotator-facing packet.

---

## E-CON-03

- `episode_id`: `E-CON-03`
- `source_type`: `constructed`
- `source_pointer`: constructed coverage-floor case derived from repeated priority-switch patterns in prototype and benchmark planning work
- `expected interruption_class`: `task_switch`
- `expected dominant_loss_class`: `focus_loss`
- `boundary_status`: `anchor`
- `why_in_wave_1`: clean current-work identity case needed early as a coverage-floor episode

## E-CON-04

- `episode_id`: `E-CON-04`
- `source_type`: `constructed`
- `source_pointer`: constructed coverage-floor blocker pattern from repeated approval/dependency waits
- `expected interruption_class`: `blocked_waiting`
- `expected dominant_loss_class`: `readiness_loss`
- `boundary_status`: `anchor`
- `why_in_wave_1`: clean readiness anchor needed before harder readiness-vs-intent cases

## E-CON-05

- `episode_id`: `E-CON-05`
- `source_type`: `constructed`
- `source_pointer`: constructed closure-floor case from recurring false-complete patterns in tracker/state discussions
- `expected interruption_class`: `false_done`
- `expected dominant_loss_class`: `closure_loss`
- `boundary_status`: `anchor`
- `why_in_wave_1`: gives wave 1 a clean false-done closure case distinct from dirty-done

## E-CON-06

- `episode_id`: `E-CON-06`
- `source_type`: `constructed`
- `source_pointer`: constructed multi-open-work ambiguity derived from repeated triage patterns in prototype use
- `expected interruption_class`: `multi_open_work_conflict`
- `expected dominant_loss_class`: `focus_loss`
- `boundary_status`: `boundary`
- `why_in_wave_1`: stress-tests focus before authority precedence even becomes the main dispute

## E-CON-07

- `episode_id`: `E-CON-07`
- `source_type`: `constructed`
- `source_pointer`: constructed record-precedence case shaped by the pilot's authority-vs-readiness lessons
- `expected interruption_class`: `environment_drift`
- `expected dominant_loss_class`: `authority_loss`
- `boundary_status`: `stress`
- `why_in_wave_1`: gives a non-SWE authority case after the E-SWE-01 pilot revision

## E-CON-08

- `episode_id`: `E-CON-08`
- `source_type`: `constructed`
- `source_pointer`: constructed handoff-blocker pattern from repeated model/operator transitions in work-centered flows
- `expected interruption_class`: `handoff`
- `expected dominant_loss_class`: `readiness_loss`
- `boundary_status`: `stress`
- `why_in_wave_1`: ensures handoff does not collapse automatically into authority or intent

## E-CON-09

- `episode_id`: `E-CON-09`
- `source_type`: `constructed`
- `source_pointer`: constructed next-step-underconstraint case derived from repeated post-failure repair planning patterns
- `expected interruption_class`: `failure_boundary`
- `expected dominant_loss_class`: `intent_loss`
- `boundary_status`: `boundary`
- `why_in_wave_1`: gives a post-failure intent case where `act` is already justified

## E-CON-10

- `episode_id`: `E-CON-10`
- `source_type`: `constructed`
- `source_pointer`: constructed residual-obligation closure case from repeated dirty-done patterns in lifecycle discussions
- `expected interruption_class`: `dirty_done`
- `expected dominant_loss_class`: `closure_loss`
- `boundary_status`: `anchor`
- `why_in_wave_1`: complements the false-done case with a clean dirty-done variant

## E-SWE-03

- `episode_id`: `E-SWE-03`
- `source_type`: `repo_grounded`
- `source_pointer`: `docs/tasklog-v4-family-allocation-table.json` → `v4-002` → `authoritative_log_overrides_note`
- `expected interruption_class`: `environment_drift`
- `expected dominant_loss_class`: `authority_loss`
- `boundary_status`: `boundary`
- `why_in_wave_1`: repo-grounded authority case needed early so wave 1 is not constructed-only

## E-SWE-07

- `episode_id`: `E-SWE-07`
- `source_type`: `repo_grounded`
- `source_pointer`: `docs/tasklog-v4-family-allocation-table.json` → `v4-009` → `blocked_work_requires_escalation`
- `expected interruption_class`: `blocked_waiting`
- `expected dominant_loss_class`: `readiness_loss`
- `boundary_status`: `anchor`
- `why_in_wave_1`: clean repo-grounded readiness anchor that complements `E-CON-04`
