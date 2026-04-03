# Re-entry Surface Names

This file defines the canonical vocabulary for Tasklog's two re-entry surfaces.

Use these names consistently across product docs, code comments, benchmarks, and paper drafts.

## Canonical Terms

| Term | Meaning |
| --- | --- |
| `Re-entry Brief` | The default concise surface for resuming one work. It includes the minimum structured cues needed to restart work quickly. |
| `Full Work Context` | The expanded surface for one work, including artifact paths, recent logs, and optional summary or log evidence. |

## Internal Names

| Internal name | Canonical term |
| --- | --- |
| `brief` | `Re-entry Brief` |
| `full` | `Full Work Context` |

## Legacy Terms

Avoid these in new product-facing text:
- `compact`
- `baseline`

They are still acceptable in historical notes, benchmark migration comments, or raw output discussions where older results used those labels.

## Flow Rule

- default re-entry flow is `Brief-first`
- expand to `Full` only when the brief is not enough
