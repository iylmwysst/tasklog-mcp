# Validation Annotation Form

## Purpose

This document defines the standard response format for the interrupted coding work taxonomy study.

The same form should be used for:

- `human annotators`
- `LLM annotators`

Using one shared form makes it easier to compare:

- human-human agreement
- model-model agreement
- human-model disagreement patterns

---

## Response Rules

For each episode:

- submit exactly `one` interruption class
- submit exactly `one` dominant loss class
- mark whether the case is `boundary-ambiguous`
- if ambiguous, name the strongest alternative class
- provide a short structural justification

Annotators should classify the episode as written.
They should not invent missing context or correct the scenario.

---

## Canonical Fields

Each annotation record should contain:

- `episode_id`
- `annotator_id`
- `annotator_tier`
- `annotator_family`
- `interruption_class`
- `dominant_loss_class`
- `boundary_ambiguous`
- `nearest_alternative_class`
- `justification`
- `confidence`
- `notes`

---

## Field Definitions

### `episode_id`

The stable episode identifier from the authoring protocol, for example:

- `E-CON-03`
- `E-PUB-07v2`
- `E-SWE-05`

### `annotator_id`

A stable identifier for the annotator.

Examples:

- `HUM-01`
- `HUM-02`
- `LLM-CLAUDE`
- `LLM-GPT`
- `LLM-GEMINI`

### `annotator_tier`

Allowed values:

- `human`
- `llm`

### `annotator_family`

The human or model family label used for analysis.

Examples:

- `human`
- `gpt`
- `claude`
- `gemini`

### `interruption_class`

Allowed values:

- `session_cutoff`
- `task_switch`
- `blocked_waiting`
- `environment_drift`
- `failure_boundary`
- `handoff`
- `multi_open_work_conflict`
- `false_done`
- `dirty_done`

### `dominant_loss_class`

Allowed values:

- `focus_loss`
- `authority_loss`
- `readiness_loss`
- `intent_loss`
- `closure_loss`

### `boundary_ambiguous`

Allowed values:

- `yes`
- `no`

Use `yes` when a nearest alternative remained genuinely plausible after applying the codebook.

### `nearest_alternative_class`

Use the strongest rival dominant loss class.

Allowed values:

- one of the five dominant loss classes above
- `none`

If `boundary_ambiguous = no`, use `none` unless the study later decides to keep rival-class notes even for confident answers.

### `justification`

Short structural rationale in `1–3` sentences.

Good:

> The work is identifiable and the governing state is visible, but the episode does not establish whether the valid present mode is to continue or to wait for approval. The earliest unresolved object is therefore readiness.

Bad:

> This seems like readiness because that was my impression.

### `confidence`

Recommended allowed values:

- `high`
- `medium`
- `low`

This is optional for the first paper but useful for disagreement analysis.

### `notes`

Optional free-text field for brief annotator comments.

Use for:

- wording concerns
- missing-context concerns
- ambiguity that does not fit neatly in the main justification

Do not use this field to replace the required justification.

---

## Markdown Form

For human annotation, the simplest working form is:

```md
Episode ID: E-CON-03
Annotator ID: HUM-01
Annotator Tier: human
Annotator Family: human

Interruption Class: blocked_waiting
Dominant Loss Class: readiness_loss
Boundary-Ambiguous: no
Nearest Alternative Class: none
Confidence: high

Justification:
The work and governing state are both clear, but the episode does not justify continued implementation because approval is still missing. The unresolved object is the valid present mode rather than the next concrete implementation step.

Notes:
None.
```

---

## JSON Form

For LLM annotation or spreadsheet export, use the equivalent structured form:

```json
{
  "episode_id": "E-CON-03",
  "annotator_id": "LLM-GPT",
  "annotator_tier": "llm",
  "annotator_family": "gpt",
  "interruption_class": "blocked_waiting",
  "dominant_loss_class": "readiness_loss",
  "boundary_ambiguous": "no",
  "nearest_alternative_class": "none",
  "confidence": "high",
  "justification": "The work and governing state are both clear, but the episode does not justify continued implementation because approval is still missing. The unresolved object is the valid present mode rather than the next concrete implementation step.",
  "notes": ""
}
```

---

## Minimal Validation Rules

An annotation submission is valid only if:

- `episode_id` is present
- `interruption_class` is one of the allowed nine classes
- `dominant_loss_class` is one of the allowed five classes
- `boundary_ambiguous` is filled
- `nearest_alternative_class` is filled
- `justification` is non-empty

For pilot use, this is enough.
More fields can be added later if the analysis layer needs them.

---

## Pilot Recommendation

For the first pilot:

- keep the form short
- require only the canonical fields above
- do not add secondary ratings or extra dimensions yet

The pilot should test taxonomy usability, not form complexity.
