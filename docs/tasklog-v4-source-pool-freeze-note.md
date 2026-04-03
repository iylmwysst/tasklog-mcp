# Tasklog V4 Source-Pool Freeze Note

This note freezes how the first `V4` source pool is interpreted.

## First-Build Interpretation

For the first `V4` build, the source pool is frozen from the vendored `SWE-bench` codebase snapshot at:

- `/Users/Lab/Desktop/TasklogSweLab/vendor/SWE-bench`

This means the initial `V4` source pool is:

- repo-scope and file-scope candidate work seeds drawn from the `SWE-bench` repository itself
- not a frozen issue-instance sample drawn from downstream upstream repositories referenced by the public SWE-bench dataset

That choice matches the current local lab state:

- the available vendor artifact is the `SWE-bench` repo snapshot itself
- existing Tasklog SWE-style scaffolds already materialize workspace state from this repo snapshot
- the immediate V4 goal is a codebase-grounded interrupted-work benchmark, not a full issue-resolution benchmark

## Source Identity Rule

Because the first build uses one vendored source repo, these fields should be interpreted as follows:

- `source_instance_id`
  Stable repo-scope candidate id frozen by this project, for example `swebench-harness-run-evaluation`
- `upstream_repo_slug`
  Always `princeton-nlp/SWE-bench` for this first build
- `upstream_commit`
  The vendored repo commit frozen in the source-pool manifest
- `source_vendor_path`
  The local vendored repo root used to build fixture-local snapshots

This is still acceptable for `V4` because the benchmark claim is repo-grounded and provenance-visible, not issue-resolution-complete.

## Pool Shape

The first frozen source pool contains:

- `48` eligible candidates
- `32` selected candidates for the first pack allocation
- `16` reserve candidates left unused in the initial family-allocation table

The pool intentionally spans multiple areas of the vendored codebase:

- `harness`
- `inference`
- `collect`
- `versioning`
- selected documentation/reference surfaces

## Family-Mapping Rule

The source pool is frozen before family allocation, but the first build still records `eligible_families` for each candidate so fixture authoring does not drift into arbitrary remapping later.

The authoritative family assignment for the first `32` fixtures lives in:

- `docs/tasklog-v4-family-allocation-table.json`

## Future Round Upgrade

If a later round moves from repo-scope `SWE-bench` source seeds to issue-level downstream repo snapshots, that is a provenance-contract upgrade and should produce a later round id rather than silently mutating this first `V4` freeze.
