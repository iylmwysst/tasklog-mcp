# Benchmark Runner Metadata Contract

This document defines the minimum external runner metadata that must be preserved for LLM benchmark runs.

Tasklog's benchmark harnesses intentionally do not own provider-specific latency, cost, or model-family accounting.
Those fields must come from the runner or wrapper that submits benchmark prompts to the model.

## Applies To

- `docs/llm-reentry-benchmark.md`
- `docs/full-session-reentry-benchmark.md`

The deterministic surface benchmark does not need this contract because it does not call external models.

## Required Fields Per Response

Every response record should preserve:

- `benchmark_type`
- `scenario_id`
- `variant_label`
- `provider`
- `model_id`
- `model_family`
- `reasoning_setting`
- `runner_name`
- `runner_version`
- `run_id`
- `run_started_at`
- `run_finished_at`
- `latency_ms`
- `input_tokens`
- `output_tokens`
- `cache_creation_input_tokens`
- `cache_read_input_tokens`
- `estimated_cost_usd`

If a provider does not expose one of these fields, write `null` explicitly rather than dropping the key.

## Required Fields Per Batch

Every batch or manifest-level record should preserve:

- `benchmark_type`
- `split`
- `provider`
- `model_id`
- `model_family`
- `reasoning_setting`
- `runner_name`
- `runner_version`
- `project_root`
- `pack_path`
- `answers_path`
- `metadata_path`
- `run_id`
- `submitted_at`

## Normalization Rules

- `model_id` should be the exact provider-facing id or snapshot id used at runtime.
- `model_family` should be a stable paper-facing family label such as `gpt-5.4`, `gpt-5.4-mini`, `claude-sonnet-4.6`, or `claude-opus-4.6`.
- `reasoning_setting` should record runner configuration such as `none`, `low`, `medium`, `high`, or `xhigh`.
- Do not collapse `model_id` and `model_family` into one field.
- Do not treat reasoning settings as separate model families.

## Drift Rules

- If a provider alias changes behavior mid-study, pin the exact snapshot id when possible.
- If a snapshot pin is not available, record the calendar date and treat later reruns as a new benchmark round if behavior may have changed.
- If runner code changes prompt wrapping, sampling defaults, retry policy, or token accounting, bump `runner_version`.

## Minimal JSON Shape

```json
{
  "benchmark_type": "llm_reentry_understanding",
  "split": "dev",
  "provider": "openai",
  "model_id": "gpt-5.4-mini",
  "model_family": "gpt-5.4-mini",
  "reasoning_setting": "medium",
  "runner_name": "tasklog-benchmark-runner",
  "runner_version": "2026-03-28",
  "run_id": "run-001",
  "submitted_at": "2026-03-28T16:00:00Z",
  "responses": [
    {
      "benchmark_type": "llm_reentry_understanding",
      "scenario_id": "work-reentry-cegiHG",
      "variant_label": "B",
      "provider": "openai",
      "model_id": "gpt-5.4-mini",
      "model_family": "gpt-5.4-mini",
      "reasoning_setting": "medium",
      "runner_name": "tasklog-benchmark-runner",
      "runner_version": "2026-03-28",
      "run_id": "run-001",
      "run_started_at": "2026-03-28T16:00:12Z",
      "run_finished_at": "2026-03-28T16:00:24Z",
      "latency_ms": 12042,
      "input_tokens": 1821,
      "output_tokens": 244,
      "cache_creation_input_tokens": 0,
      "cache_read_input_tokens": 0,
      "estimated_cost_usd": 0.0184
    }
  ]
}
```

Use `docs/benchmark-runner-metadata-sample.json` as a starter artifact and validate real metadata files with:

```bash
npm run bench:validate-meta -- --file /path/to/answers.meta.json --json
```

## Freeze Rule

Before any claim-bearing holdout run:

1. freeze the runner roster
2. freeze exact model ids and reasoning settings
3. freeze this metadata contract
4. verify that every configured runner can emit the required fields

If any of those change after holdout starts, start a new benchmark round.
