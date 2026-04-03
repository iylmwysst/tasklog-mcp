# Tasklog V4.1-dev Annotation Workflow

This workflow describes how to turn the `V4.1-dev` lane into a usable development benchmark after fixture authoring begins.

It applies to:

- `tasklog_v4_swe_grounded_reentry`
- lane `V4.1-dev`

It complements:

- `docs/tasklog-v4-1-answer-contract.md`
- `docs/tasklog-v4-1-grader-contract.md`
- `docs/tasklog-v4-1-dev-lane-note.md`
- `docs/tasklog-v4-1-dev-annotation-family-briefs.md`
- `docs/tasklog-v4-1-dev-human-audit-policy.md`

## Purpose

`V4.1-dev` is for system development, not claim-bearing evaluation.
The workflow therefore keeps the `V4.1` answer and grading protocol, but relaxes pre-run process burden where that burden does not protect the final holdout.

## Recommended Fixture Root

Use a separate lab root from the frozen holdout pack, for example:

- `/Users/Lab/Desktop/TasklogSweLab/fixtures-v4-1-dev`

Do not author `V4.1-dev` fixtures inside the frozen `fixtures-v4` tree.

## Workflow

1. Author fixtures from the frozen dev allocation.
   Use `docs/tasklog-v4-1-dev-family-allocation-table.json` as the source-of-truth fixture list.
   Keep every fixture grounded in the listed `source_rel_paths`.
2. Run a targeted spot-check.
   Follow `docs/tasklog-v4-1-dev-human-audit-policy.md`.
   This is recommended before large tuning passes, but it is not a claim-bearing hard gate.
3. Scaffold the annotation pack.
   Run:

   ```bash
   node --import tsx scripts/create-tasklog-v4-1-dev-annotation-pack.ts --fixtures-root /Users/Lab/Desktop/TasklogSweLab/fixtures-v4-1-dev --force
   ```

4. Freeze role assignment.
   Reuse:

   ```bash
   node --import tsx scripts/freeze-tasklog-v4-role-assignment.ts --fixtures-root /Users/Lab/Desktop/TasklogSweLab/fixtures-v4-1-dev
   ```

5. Dual-annotate.
   Give `annotator_a` and `annotator_b`:
   - the generated prompt files under `annotation/prompts/`
   - the `V4.1` answer contract
   - the `V4.1` grader contract
   - the `V4.1-dev` annotation family briefs
6. Adjudicate disagreements.
   Reuse the same adjudication guide as `V4` unless the dev lane later freezes its own derivative guide.
7. Freeze dev answer keys.
   The dev lane is then safe to use for tuning.
8. Tune the system only on `V4.1-dev`.
   Do not cite `V4/V4.1` holdout fixtures while making those changes.
9. Evaluate on holdout.
   Any candidate improvement from `V4.1-dev` must be re-checked on `V4/V4.1` holdout artifacts before it is treated as evidence of generalization.

## Bootstrap Shortcut

If you need the lane to become tuning-usable immediately before full dual annotation finishes, use:

```bash
node --import tsx scripts/prepare-tasklog-v4-1-dev-for-tuning.ts --fixtures-root /Users/Lab/Desktop/TasklogSweLab/fixtures-v4-1-dev
```

This freezes role assignment, seeds provisional dev-lane answer keys into both annotator drafts, writes provisional frozen answers, and creates a recommended `4`-fixture spot-check manifest.

Use this only for `V4.1-dev`.
It is a development shortcut, not a claim-bearing holdout procedure.

## Required Inputs For Annotators

Each annotator should be able to see only:

- the assigned draft file
- referenced fixture files
- `docs/tasklog-v4-1-answer-contract.md`
- `docs/tasklog-v4-1-grader-contract.md`
- `docs/tasklog-v4-source-family-ontology.json`
- `docs/tasklog-v4-adjudication-guide.md`
- `docs/tasklog-v4-1-dev-annotation-family-briefs.md`

## Why The Workflow Is Lighter Than Holdout

`V4.1-dev` is not the final evidence lane.
Its job is to make system iteration cheaper while keeping:

- source disjointness
- answer-contract discipline
- grader compatibility
- codebase-grounded family semantics

The final anti-overfitting protection still comes from rerunning the frozen holdout.
