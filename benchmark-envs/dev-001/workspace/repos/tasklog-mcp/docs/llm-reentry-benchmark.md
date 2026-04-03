# LLM Re-entry Benchmark

This benchmark is meant to be fairer than a pure context-size proxy without pretending to measure more than it really can.

Canonical benchmark arm names for papers and docs are defined in `docs/benchmark-arm-names.md`. Use those display labels in prose and tables, and keep internal strategy ids only for code and raw outputs.

## What It Measures

It measures `re-entry understanding`.

Each path gets the same scenario and the same JSON question. The model must reconstruct the work state from the provided payload and leave fields blank when the evidence is not there.

The current protocol separates:

- `benchmark track`: frozen, claim-bearing evaluation
- `live-use track`: dynamic product-relevant checks that may depend on current workspace state

Paper-facing benchmark inventory:

- `Primary frozen LLM benchmark`
- `Supporting deterministic surface benchmark`
- `Efficiency table` derived from the primary benchmark

Role assignment:

- `claim-bearing`: frozen LLM `work_reentry` benchmark only
- `supporting`: deterministic surface evidence and explicit ablations such as `Brief` versus `Full`
- `exploratory`: `open_work_discovery`, stress diagnostics, and any future agentic benchmark until separately frozen

The current harness is designed to answer questions like:

- can the model identify what work is active or being resumed
- can it recover status, scope, latest summary, next step, and artifacts
- how often does it abstain versus hallucinate when the payload is weak

## What It Does Not Measure

It does not yet measure `continue the unfinished task from the original mid-work code snapshot`.

That stronger benchmark needs the codebase state from the moment the work was still in progress. Without those snapshots, a present-day workspace can still support re-entry understanding but not a fair end-to-end continuation benchmark.

## Fairness Rules

- every strategy answers the same question for the same scenario
- the public pack is blinded per scenario with variant labels like `A`, `B`, `C`, `D`
- the model is instructed not to guess and to return empty fields when unknown
- grading is field-by-field against the same expected answer
- wrong confident answers and unsupported filled fields are both visible in the grading output
- Tasklog is not the only path allowed to shape evidence; the benchmark also supports a generic `Normalized State` baseline
- artifact-file grading uses basename normalization so one path does not win only because it prints absolute paths

## Supported Arms

- `Workspace-Only`: codebase or workspace scan only
- `Notes Replay`: reread freeform notes and logs
- `Raw State`: read Tasklog state files directly with no shaping
- `Normalized State`: read Tasklog state and apply only generic flattening or normalization
- `Tasklog Re-entry`: use the higher-level work-first MCP re-entry flow

## Dataset Splits

The fairer protocol should keep scenario selection frozen by split:

- `dev`: prompt and protocol debugging only
- `holdout`: primary claim set
- `stress`: edge-shape diagnostics after holdout is frozen

The current split proposal lives in `docs/benchmark-splits.json`.

Important track rule:

- primary `holdout` is `work_reentry` only
- `open_work_discovery` stays a live diagnostic until we introduce a frozen fixture for it

## Tasklog Primary Arm

For the current fair-eval protocol, the primary `Tasklog Re-entry` arm is the `Brief` re-entry surface.

This arm was initially benchmark-only. The brief-first path is now the intended default direction for product re-entry, while the full surface remains available for expansion when needed.

If we want an ablation, we can still run the `Full` surface explicitly, but it is not the default claim-bearing arm.

## Primary Metrics

- `supported_field_recall_percent`
- `hallucination_rate_percent`

Secondary metrics:

- `strict_scenario_success_percent`
- `field_accuracy_percent`

Diagnostic metrics:

- per-field and per-family recall
- raw-versus-normalized gap
- cross-model consistency
- work-shape breakdowns
- strict-versus-lenient sensitivity if a lenient or adjudicated layer is added before holdout

Efficiency metrics:

- context bytes
- estimated tokens
- latency
- cost

Latency, cost, and model-family summaries are sourced from external runner metadata or wrapper logs, not from the core benchmark harness alone.

## Model Roster Policy

The benchmark should use a fixed model roster by evaluation lane so protocol debugging, claim runs, and ablations are not mixed together.

### Smoke Lane

Use this lane for cheap rehearsal, pack validation, prompt-shape debugging, and grader checks.

Recommended roster:

- `gpt-5.4-mini`
- `claude-haiku-4.5`

This lane is allowed to fail because of weaker model capability.
Do not use smoke-lane results as the primary evidence for benchmark claims.

### Pre-holdout Dev Lane

Use this lane before freezing the protocol.
Its purpose is to verify that the benchmark is not only behaving well on small models.

Recommended roster:

- `gpt-5.4-mini`
- `claude-sonnet-4.6`

This lane is the minimum cross-vendor validation pass before holdout.

### Holdout Lane

Use this lane for the main benchmark evidence.

Recommended roster:

- `gpt-5.4-mini`
- `gpt-5.4`
- `claude-sonnet-4.6`
- `claude-opus-4.6`

Rationale:

- `gpt-5.4-mini` and `claude-sonnet-4.6` provide a strong lower-cost cross-vendor comparison
- `gpt-5.4` and `claude-opus-4.6` provide higher-capability reference runs
- this roster gives at least two model families and multiple capability tiers without exploding benchmark cost

### Post-holdout Ablation Lane

Use this lane only after the main holdout protocol is frozen or completed.

Recommended ablations:

- `gpt-5.4` with `high` reasoning
- `claude-haiku-4.5`

These runs are useful for sensitivity checks, not for redefining the primary claim after the fact.

## Model Selection Rules

- Do not treat `gpt-5.4` and `gpt-5.4` with `high` reasoning as two independent model families.
- Freeze exact model ids and reasoning settings before holdout.
- Record vendor, model id, reasoning setting, date, and runner version with every run.
- If a provider updates a model alias mid-study, either pin the older snapshot id or start a new benchmark round.
- If cost forces a reduced roster, preserve cross-vendor coverage before adding extra reasoning variants of the same base model.

Runner metadata must follow `docs/benchmark-runner-metadata-contract.md`.

## Files Produced

`scripts/benchmark-llm-reentry.ts` can generate:

- `llm-reentry-pack.json`: the blinded pack to give to a model or evaluator
- `llm-reentry-answer-key.json`: the private answer key with strategy mapping
- `llm-reentry-answer-template.json`: the response template to fill in

## Typical Workflow

1. Generate a blinded pack for your workspace.
2. Run each variant through the same model with the same instructions.
3. Save the structured answers into the template.
4. Grade the answers against the private key.

## Example

Generate a pack:

```bash
npm run bench:llm -- --project-root /path/to/workspace --manifest docs/benchmark-splits.json --split holdout --out-dir /tmp/tasklog-llm-pack
```

Generate a dev pack that still includes live open-work discovery:

```bash
npm run bench:llm -- --project-root /path/to/workspace --manifest docs/benchmark-splits.json --split dev --open-discovery-mode live --out-dir /tmp/tasklog-llm-dev-pack
```

Grade an answer sheet:

```bash
npm run bench:llm -- --project-root /path/to/workspace --grade-in /tmp/tasklog-llm-pack/answers.json
```

By default, grading loads the frozen `llm-reentry-answer-key.json` from the same directory as the answer sheet.
Use `--key-in /path/to/llm-reentry-answer-key.json` when the answer key lives elsewhere.
