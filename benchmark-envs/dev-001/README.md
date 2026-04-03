# Tasklog Benchmark Environment

Fixture id: `dev-001`

This directory is a fresh benchmark environment scaffold.

Layout:
- `workspace/` is the isolated project root for benchmark runs.
- `workspace/repos/` contains copied repo snapshots.
- `workspace/.tasklog/` contains seeded Tasklog state files.
- `workspace/workdocs/` contains seeded work artifact markdown files.
- `fixture-manifest.json` records the fixture contract for runners.

Next steps:
1. Seed scenario-specific works, logs, and workdocs inside `workspace/.tasklog/` and `workspace/workdocs/`.
2. Point the isolated benchmark runner at `workspace/` rather than the operator's live workspace.
3. Keep claim-lane runs hermetic by mounting only this fixture directory.
