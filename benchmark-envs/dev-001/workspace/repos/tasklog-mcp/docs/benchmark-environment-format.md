# Benchmark Environment Format

This document defines the first scaffold format for a fresh Tasklog benchmark environment.

It is intentionally simple.
The goal is to create a clean isolated workspace that later fixture seeders and runners can consume without touching the operator's live machine state.

Use this together with:

- `docs/swe-style-reentry-benchmark-direction.md`
- `scripts/create-benchmark-env.ts`

## Purpose

The environment scaffold exists to solve the first problem before any benchmark run:

- where does the benchmark workspace live
- what files belong to the fixture
- what state is allowed into the claim lane

This format is for `claim-lane` preparation.
It can also be used locally for dry runs.

## Top-Level Layout

The scaffold generator creates this shape:

```text
<fixture-root>/
  README.md
  fixture-manifest.json
  workspace/
    .tasklog/
      works.json
      session-log.json
      session-log.md
      active-context.json   # reserved path; may be absent until seeded
    repos/
      <repo-id>/
    workdocs/
```

## Design Rules

- `fixture-root` is disposable and should be unique per run or per scenario pack build.
- `workspace/` is the synthetic project root for the benchmark.
- no data from the operator's ambient `.tasklog` or `workdocs` should be copied in automatically.
- copied repos should exclude transient or contaminating directories by default.
- runner metadata should point to this fixture, not to the live local workspace.

## Repo Snapshot Rules

The scaffold generator may copy one or more source repos into `workspace/repos/`.

By default it excludes:

- `.git`
- `.tasklog`
- `workdocs`
- `node_modules`
- `dist`
- `target`
- `.next`
- `.turbo`
- `coverage`

This keeps the fixture small and avoids importing unrelated state into the claim lane.

If a future benchmark needs `.git`, the generator can opt in explicitly.
That should be the exception, not the default.

## Tasklog State Rules

The scaffold generator initializes empty Tasklog files:

- `works.json`
- `session-log.json`
- `session-log.md`

It reserves the canonical `active-context.json` path in the manifest even if the file has not been seeded yet.

Scenario builders should later add:

- frozen work records
- frozen recent logs
- optional active context
- workdocs markdown for the targeted works

## Fixture Manifest

The generator writes `fixture-manifest.json`.

Current fields:

- `version`
- `fixture_id`
- `created_at`
- `environment_type`
- `workspace_root`
- `contamination_controls`
- `state_paths`
- `repos`

The manifest is the handoff contract between:

- environment creation
- scenario seeding
- isolated runner execution

## Example

Create a fresh scaffold with one copied repo snapshot:

```bash
npm run bench:env:init -- \
  --out-dir /tmp/tasklog-bench-env \
  --fixture-id dev-sample \
  --repo-source /path/to/repo
```

This should be followed by a separate seeding step that writes the benchmark-specific Tasklog works, logs, and workdocs into the new `workspace/`.

## What This Format Does Not Do Yet

This scaffold is intentionally only the first layer.

It does not yet:

- seed scenario-specific Tasklog data
- define the isolated runner API
- launch containers
- score benchmark outputs

Those pieces should build on top of this format rather than bypassing it.
