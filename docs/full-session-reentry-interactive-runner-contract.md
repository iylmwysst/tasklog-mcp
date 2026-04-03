# Full Session Re-entry Interactive Runner Contract

This document freezes the runner-facing contract for `Bench C2`.

It complements:

- `docs/full-session-reentry-interactive-benchmark.md`
- `docs/full-session-reentry-interactive-trace-schema.json`

Use this contract when an external runner executes the interactive benchmark and writes trace batches for grading.

## Scope

This contract applies to `Bench C2` only.

It does not replace the LLM metadata contract used by `Bench A`.
It adds the interactive trace requirements that `Bench C2` needs on top of ordinary model metadata.

## Files

For each interactive run, the runner should preserve:

- the blinded pack file
- the trace batch JSON file
- the frozen interactive answer key
- the exact trace schema path used for the run

The canonical trace schema path is:

- `docs/full-session-reentry-interactive-trace-schema.json`

## Required Batch Fields

Every trace batch must preserve:

- `benchmark_type`
- `split`
- `project_root`
- `pack_path`
- `trace_schema_path`
- `run_id`
- `provider`
- `model_id`
- `model_family`
- `reasoning_setting`
- `runner_name`
- `runner_version`
- `traces`

## Required Per-Trace Fields

Every trace record must preserve:

- `scenario_id`
- `variant_label`
- `step_budget`
- `final_status`
- `model_turns`
- `run_started_at`
- `run_finished_at`
- `tool_calls`
- `final_answer`

## Required Per-Tool-Call Fields

Every tool call must preserve:

- `step_index`
- `tool_name`
- `tool_input`
- `tool_result`
- `latency_ms`

## Consistency Rules

- `benchmark_type` must be `full_session_reentry_interactive`
- `trace_schema_path` must point to the frozen schema used for the run
- each trace row must correspond to one frozen `scenario_id + variant_label` pair
- no duplicate trace rows are allowed
- no expected trace rows may be missing
- `step_budget` in each trace must match the frozen interaction contract for that variant
- `tool_input` and `tool_result` must preserve the exact mock-fixture interaction used during the run

## Replay Rule

The grader must be able to replay policy checks from the trace batch alone plus:

- the frozen pack
- the frozen answer key

That means the runner must not rely on hidden transient state when writing traces.

## Minimal Example

```json
{
  "benchmark_type": "full_session_reentry_interactive",
  "split": "dev",
  "project_root": "/path/to/workspace",
  "pack_path": "/tmp/tasklog-session-interactive-dev/full-session-reentry-interactive-pack.json",
  "trace_schema_path": "docs/full-session-reentry-interactive-trace-schema.json",
  "run_id": "run-001",
  "provider": "openai",
  "model_id": "gpt-5.4-mini",
  "model_family": "gpt-5.4-mini",
  "reasoning_setting": "medium",
  "runner_name": "tasklog-benchmark-runner",
  "runner_version": "2026-03-29",
  "traces": [
    {
      "scenario_id": "fsi-dev-active-context",
      "variant_label": "A",
      "step_budget": {
        "max_tool_calls": 5,
        "max_model_turns": 6,
        "max_final_answer_attempts": 1
      },
      "final_status": "answered",
      "model_turns": 4,
      "run_started_at": "2026-03-29T12:00:00Z",
      "run_finished_at": "2026-03-29T12:00:10Z",
      "tool_calls": [
        {
          "step_index": 1,
          "tool_name": "get_active_context",
          "tool_input": {},
          "tool_result": {
            "active_work_id": "0tetbC",
            "active_work_title": "Measure Tasklog re-entry value"
          },
          "latency_ms": 5
        }
      ],
      "final_answer": {
        "selected_work_id": "0tetbC",
        "selected_work_title": "Measure Tasklog re-entry value",
        "work_status": "active",
        "scope_paths": ["/path/to/workspace/tasklog-mcp"],
        "latest_log_summary": "Latest log summary",
        "next_step_summary": "Next step summary",
        "used_expanded_context": false
      }
    }
  ]
}
```

## Current Readiness

The repo now has:

- a frozen trace schema
- an executable dev harness
- regression coverage for basic grading and policy checks

The remaining hardening work is:

- richer trace-policy coverage
- holdout and stress scenario rehearsal
- external runner smoke-lane replay
