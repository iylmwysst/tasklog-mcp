# Validation Pilot Comparison Matrix

## Purpose

This document consolidates the first pilot annotations across:

- `HUM-AUTH-01` (author-side human annotation)
- `HUM-EXT-02` (independent external human annotation)
- `LLM-GPT-5.4-MINI`
- `LLM-GPT-5.3-CODEX`
- `LLM-CLAUDE-SONNET-4.6`

The goal is not to force full agreement. It is to see:

- which distinctions are already stable
- which episodes produce useful disagreement
- whether disagreement concentrates in `interruption_class` or `dominant_loss_class`

---

## Annotator Status

- `HUM-AUTH-01` is an `author-side human annotation`, not an independent external human annotation.
- `HUM-EXT-02` is the first independent external human pilot annotation in this packet.
- The three LLM rows are auxiliary pilot pressure-tests, not claim-bearing human evidence.
- This matrix is therefore a `pilot readout`, not the final study result.

---

## Per-Episode Comparison

| Episode | HUM-AUTH-01 | HUM-EXT-02 | GPT-5.4-Mini | GPT-5.3-Codex | Claude Sonnet 4.6 | Readout |
| --- | --- | --- | --- | --- | --- | --- |
| `E-SWE-01` | `environment_drift` / `focus_loss` | `environment_drift` / `readiness_loss` | `session_cutoff` / `authority_loss` | `multi_open_work_conflict` / `authority_loss` | `session_cutoff` / `authority_loss` | strongest disagreement in the pilot; both interruption and dominant-loss readings remain open |
| `E-SWE-02` | `blocked_waiting` / `readiness_loss` | `blocked_waiting` / `readiness_loss` | `blocked_waiting` / `readiness_loss` | `blocked_waiting` / `readiness_loss` | `blocked_waiting` / `readiness_loss` | unanimous anchor case |
| `E-CON-01` | `multi_open_work_conflict` / `focus_loss` | `multi_open_work_conflict` / `authority_loss` | `multi_open_work_conflict` / `authority_loss` | `multi_open_work_conflict` / `authority_loss` | `multi_open_work_conflict` / `authority_loss` | interruption stable; dominant loss still a live focus-vs-authority boundary, but now leaning authority |
| `E-CON-02` | `multi_open_work_conflict` / `intent_loss` | `multi_open_work_conflict` / `authority_loss` | `session_cutoff` / `intent_loss` | `session_cutoff` / `intent_loss` | `session_cutoff` / `intent_loss` | interruption wording remains split; dominant loss mostly reads as intent, but one human still saw authority |
| `E-HIS-01` | `dirty_done` / `closure_loss` | `dirty_done` / `closure_loss` | `dirty_done` / `closure_loss` | `dirty_done` / `closure_loss` | `dirty_done` / `closure_loss` | unanimous anchor case |

---

## Boundary Notes

### `E-SWE-01`

- `HUM-AUTH-01` read this as `environment_drift` plus `focus_loss`.
- `HUM-EXT-02` kept `environment_drift` for interruption class, but shifted the dominant loss to `readiness_loss`.
- All three LLM annotators instead treated the dominant problem as `authority_loss`, while also splitting on interruption class.
- This is a good pilot stress point because it tests whether annotators read the later governing record as:
  - a changed environment,
  - a work-selection conflict, or
  - a source-precedence conflict,
  - or a blocked-action / readiness problem.

### `E-CON-01`

- All annotators agreed on `multi_open_work_conflict`.
- `HUM-AUTH-01` chose `focus_loss`.
- `HUM-EXT-02` and all three LLM annotators chose `authority_loss`, usually with `focus_loss` as the nearest alternative.
- This is useful evidence that the `focus_loss` versus `authority_loss` tie-break is genuinely hard rather than merely unclear in the wording, but the current packet now leans toward `authority_loss`.

### `E-CON-02`

- `HUM-AUTH-01` and all three LLM annotators read the dominant loss as `intent_loss`.
- `HUM-EXT-02` instead chose `authority_loss`, despite keeping the same interruption label as `HUM-AUTH-01`.
- The two human annotators chose `multi_open_work_conflict` for `interruption_class`.
- All three LLM annotators chose `session_cutoff`.
- This suggests the interruption-layer wording is still weaker than the dominant-loss wording, but it also shows the episode can still trigger an authority reading if the tie-break is not enforced tightly enough.

---

## Initial Readout

### Stable so far

- `E-SWE-02` and `E-HIS-01` are now stable across all five annotators.
- `readiness_loss` and `closure_loss` look clearly operational in this pilot packet.
- `intent_loss` is fairly strong but not fully clean, because `E-CON-02` still attracted one `authority_loss` reading.

### Useful ambiguity

- `E-CON-01` is doing the job it was designed to do.
- `E-SWE-01` may be the most informative episode in the current packet because it produces disagreement at both layers.
- `E-CON-02` still suggests the interruption-class layer is weaker than the dominant-loss layer, but it is no longer a pure interruption-only disagreement case.

### Immediate implication

- The pilot has now done its main job: it shows which distinctions are already operational and which boundaries still need tightening before the first full study is frozen.
- `E-SWE-01` and `E-CON-02` should be treated as revision-driving episodes before the 30-episode claim-bearing set is finalized.
- `E-CON-01` does not necessarily need to be made unanimous; its value is that the disagreement is interpretable and concentrated on the intended boundary.
