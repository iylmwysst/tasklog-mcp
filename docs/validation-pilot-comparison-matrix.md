# Validation Pilot Comparison Matrix

## Purpose

This document consolidates the first pilot annotations across:

- `HUM-AUTH-01` (author-side human annotation)
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
- The two LLM rows are auxiliary pilot pressure-tests, not claim-bearing human evidence.
- This matrix is therefore a `pilot readout`, not the final study result.

---

## Per-Episode Comparison

| Episode | HUM-AUTH-01 | GPT-5.4-Mini | GPT-5.3-Codex | Claude Sonnet 4.6 | Readout |
| --- | --- | --- | --- | --- | --- |
| `E-SWE-01` | `environment_drift` / `focus_loss` | `session_cutoff` / `authority_loss` | `multi_open_work_conflict` / `authority_loss` | `session_cutoff` / `authority_loss` | strongest disagreement in the pilot; both layers move |
| `E-SWE-02` | `blocked_waiting` / `readiness_loss` | `blocked_waiting` / `readiness_loss` | `blocked_waiting` / `readiness_loss` | `blocked_waiting` / `readiness_loss` | clean agreement |
| `E-CON-01` | `multi_open_work_conflict` / `focus_loss` | `multi_open_work_conflict` / `authority_loss` | `multi_open_work_conflict` / `authority_loss` | `multi_open_work_conflict` / `authority_loss` | interruption stable, dominant loss boundary active |
| `E-CON-02` | `multi_open_work_conflict` / `intent_loss` | `session_cutoff` / `intent_loss` | `session_cutoff` / `intent_loss` | `session_cutoff` / `intent_loss` | dominant loss stable, interruption label disputed |
| `E-HIS-01` | `dirty_done` / `closure_loss` | `dirty_done` / `closure_loss` | `dirty_done` / `closure_loss` | `dirty_done` / `closure_loss` | clean agreement |

---

## Boundary Notes

### `E-SWE-01`

- `HUM-AUTH-01` read this as `environment_drift` plus `focus_loss`.
- All three LLM annotators instead treated it as a record-precedence problem and chose `authority_loss`.
- This is a good pilot stress point because it tests whether annotators read the later governing record as:
  - a changed environment,
  - a work-selection conflict, or
  - a source-precedence conflict.

### `E-CON-01`

- All annotators agreed on `multi_open_work_conflict`.
- The human annotation chose `focus_loss`.
- All three LLM annotators chose `authority_loss`, usually with `focus_loss` as the nearest alternative.
- This is useful evidence that the `focus_loss` versus `authority_loss` tie-break is genuinely hard rather than merely unclear in the wording.

### `E-CON-02`

- All annotators agreed on `intent_loss`.
- The human annotation chose `multi_open_work_conflict` for `interruption_class`.
- All three LLM annotators chose `session_cutoff`.
- This suggests the dominant-loss layer is clearer than the interruption-class layer for this episode.

---

## Initial Readout

### Stable so far

- `E-SWE-02` and `E-HIS-01` are already very stable across all four annotators.
- `intent_loss`, `readiness_loss`, and `closure_loss` look operational in this pilot packet.

### Useful ambiguity

- `E-CON-01` is doing the job it was designed to do.
- `E-SWE-01` may be the most informative episode in the current packet because it produces disagreement at both layers.
- `E-CON-02` suggests the codebook may be easier to apply at the `dominant_loss_class` layer than at the `interruption_class` layer.

### Immediate implication

- The packet should proceed to at least one additional human annotator before any wording changes are considered.
- At this stage, disagreement is still informative and should not be optimized away too early.
