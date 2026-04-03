# Tasklog V4 Annotation Wave Plan

This note freezes the recommended execution order for V4 dual annotation.

It applies to:

- `tasklog_v4_swe_grounded_reentry`
- round `V4`

## Purpose

The full pack now contains `32` seeded fixtures.
Dual annotation should not begin as one undifferentiated batch.

Use a staged wave order so the annotation pipeline can:

- start with the already-audited subset
- surface format or interpretation drift early
- avoid wasting a full-pack pass if one contract detail still needs tightening

## Wave 1

Start with the `8` audited fixtures:

- `v4-001`
- `v4-005`
- `v4-009`
- `v4-013`
- `v4-018`
- `v4-021`
- `v4-026`
- `v4-030`

Why this wave comes first:

- every family is represented once
- all `8` fixtures already passed human audit
- this is the cheapest subset for checking whether dual-annotation behavior looks stable before scaling to the remaining `24`

## Wave 2

After Wave 1 dual annotation is complete and the first disagreement patterns are understood, continue with the remaining `24` fixtures.

This second wave should reuse:

- the same frozen answer contract
- the same frozen grader contract
- the same frozen ontology
- the same frozen role assignment

If any of those need to change after Wave 1 review, create a later round rather than silently mixing regimes.

## Operational Rule

For the current `V4` round:

- Wave 1 is the recommended starting sample
- Wave 1 is still claim-bearing material, not a throwaway sandbox
- no benchmark execution should begin until both waves are fully dual-annotated, adjudicated, and frozen

## Referenced Artifact

The concrete file list for Wave 1 lives in:

- `/Users/Lab/Desktop/TasklogSweLab/fixtures-v4/annotation/wave-1-audited-subset.json`
