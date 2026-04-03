# Tasklog V4 Fixture Provenance Contract

This document freezes the minimum provenance requirements for each `V4` fixture.

Its purpose is simple:

`A reviewer should be able to inspect one frozen fixture directory and verify that the benchmark is grounded in an explicit SWE-derived codebase snapshot.`

## Non-Negotiable Rule

No `V4` fixture is claim-bearing unless the frozen artifact itself preserves repo provenance.

Historical notes, chat logs, or operator memory do not count as the provenance layer.

## Required Fixture Layout

Each fixture root must contain at least:

```text
<fixture-root>/
  fixture-manifest.json
  questions.json
  surfaces/
  workspace/
    repos/
      <repo-id>/
    .tasklog/
    workdocs/
```

`workspace/repos/<repo-id>/` must contain the frozen codebase snapshot actually used for the fixture.

## Required Manifest Fields

Each `fixture-manifest.json` must include:

- `version`
- `fixture_id`
- `round_id`
- `fixture_type`
- `benchmark_type`
- `workspace_root`
- `repo_snapshots`
- `state_paths`
- `contamination_controls`
- `provenance_status`
- `generation_metadata`

## Required `repo_snapshots` Fields

Each entry in `repo_snapshots` must include:

- `repo_id`
- `source_dataset`
- `source_instance_id`
- `upstream_repo_slug`
- `upstream_commit`
- `source_vendor_path`
- `fixture_repo_path`
- `snapshot_created_at`

### Field Intent

- `repo_id`
  Stable fixture-local repo label such as the directory name under `workspace/repos/`.
- `source_dataset`
  The source benchmark or corpus, for example `SWE-bench`.
- `source_instance_id`
  The dataset-level instance identifier or equivalent immutable selection key.
- `upstream_repo_slug`
  The original repository identity, not just a local vendor path.
- `upstream_commit`
  The frozen revision of the source repo snapshot.
- `source_vendor_path`
  The local source path used to build the snapshot.
- `fixture_repo_path`
  The path of the copied snapshot inside the fixture root.
- `snapshot_created_at`
  Timestamp for the fixture-local snapshot creation event.

## Required State-Seeding Fields

The fixture manifest or a sibling seeded-state manifest must also preserve:

- `seeded_tasklog_files`
- `seeded_workdocs_paths`
- `seed_method`
- `seed_notes`

This is required because `V4` is not only a codebase benchmark.
It is a codebase-grounded Tasklog re-entry benchmark, so the bridge from repo snapshot to seeded Tasklog state must be inspectable too.

## Required Generation Metadata Fields

`generation_metadata` must preserve at least:

- `generator_model`
- `reviewer_model`
- `human_audit_status`
- `human_audit_family_coverage`
- `generation_prompt_version`
- `review_prompt_version`
- `human_edited_before_freeze`

If human audit notes live outside the fixture manifest, store a stable path reference to them in the same metadata block.

Frozen recommendation for the first `V4` build:

- `generator_model: codex-5.1-mini`
- `reviewer_model: codex-5.2`

`human_audit_status` should use a bounded explicit vocabulary such as:

- `not_selected_for_audit`
- `audited_pass`
- `audited_pass_with_manual_edits`
- `audited_needs_rework`

`human_audit_family_coverage` should identify which scenario family the audited fixture belongs to so the final audit subset can be checked for spread across families.

## Prohibited `V4` Shortcut

The following shape is not sufficient for `V4` claim-bearing fixtures:

- a fixture defined only by `workspace_state`
- logical scope paths without a repo snapshot on disk
- manifests that omit `repo_snapshots`
- manifests that omit generation-role metadata
- audit selections concentrated in only one narrow family cluster
- provenance that lives only in tasklog notes or session history

## Freeze Rule

Before the first `V4` run starts:

- fixture manifests must already contain the required provenance fields
- the repo snapshot must already exist on disk inside each fixture
- answer keys, grader, roster, and runner must still be frozen separately after the fixture pack is complete

If the fixture provenance contract changes after pack freeze, start a later round id rather than mutating `V4` silently.
