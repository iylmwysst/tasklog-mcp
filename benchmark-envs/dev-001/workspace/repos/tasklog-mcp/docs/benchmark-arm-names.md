# Benchmark Arm Naming Reference

This file defines the canonical display labels for benchmark arms and maps them to the internal strategy identifiers used in scripts and raw outputs.

Use this naming policy for:
- papers
- docs
- tables
- figures
- result summaries

Keep internal ids stable in code and output artifacts unless there is a deliberate migration.

## Canonical Display Labels

| Display label | Meaning |
| --- | --- |
| `Workspace-Only` | The model gets workspace or codebase context only, with no Tasklog continuity artifacts. |
| `Notes Replay` | The model rereads freeform notes or notebook-style markdown. |
| `Raw State` | The model gets raw Tasklog state files directly with no extra shaping. |
| `Normalized State` | The model gets raw Tasklog state after generic normalization only. |
| `Tasklog Re-entry` | The model gets the Tasklog re-entry surface exposed by the product workflow. |

## Mapping to Internal Strategy IDs

| Display label | Work re-entry internal ids | Open discovery internal ids |
| --- | --- | --- |
| `Workspace-Only` | `no_continuity_scope_scan` | `no_continuity_workspace_scan` |
| `Notes Replay` | `markdown_notebook_scan` | `markdown_notebook_scan` |
| `Raw State` | `json_state_scan` | `json_state_scan` |
| `Normalized State` | `json_state_normalized_scan` | `json_state_normalized_scan` |
| `Tasklog Re-entry` | `tasklog_resume_plus_read_work_context` | `tasklog_get_active_plus_list_works` |

## Writing Rules

- Use display labels in prose, tables, and plots.
- Use internal ids only in raw result files, implementation notes, and code comments where exact script values matter.
- When writing benchmark methods, define each arm once with display label first and internal id in parentheses only if needed.
- Avoid older mixed naming such as `tasklog_workflow`, `raw_json_normalized`, or `markdown_notes` in user-facing benchmark text unless they are being discussed as legacy identifiers.
