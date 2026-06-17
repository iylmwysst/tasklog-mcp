# 30-Episode Validation Google Form Kit

## Purpose

Use this file to build the annotator-facing Google Form for the full `30`-episode validation round.

This kit is designed to minimize wording drift between the source packet and the form.

Use it together with:

- `docs/validation-30-episode-send-pack.md`
- `docs/validation-codebook.md`
- `docs/validation-annotation-form.md`

Do not use:

- `docs/validation-30-episode-hidden-ledger.md`
- expected labels
- any research-side provenance notes

---

## Recommended Form Title

`Interrupted Coding Work Taxonomy: 30-Episode Validation Round`

## Recommended Form Description

Use the codebook and the episode text exactly as provided.

For each episode:

- choose one `interruption_class`
- choose one `dominant_loss_class`
- choose one `boundary_ambiguous` value
- choose one `nearest_alternative_class`
- provide a short structural justification

Classify each episode as written.
Do not use hidden notes, outside provenance, expected labels, or LLM assistance to decide the labels.

If `boundary_ambiguous = no`, choose `nearest_alternative_class = none`.

---

## Recommended Form Settings

- Collect email addresses: off, unless you explicitly want identity binding through Google
- Limit to 1 response: on, if each annotator should submit once
- Edit after submit: off
- See summary charts and text responses: off
- Shuffle question order: off
- Shuffle option order: off
- Show progress bar: on
- Confirm before submit: on

---

## Section 1: Annotator Metadata

Section title:
`Annotator Information`

Section description:
`Complete this once before starting the episode sections.`

Questions:

1. Short answer, required
   Title: `annotator_id`
   Help text: `Example: HUM-01`

2. Multiple choice, required
   Title: `annotator_tier`
   Options:
   - `human`
   - `llm`

3. Short answer, required
   Title: `annotator_family`
   Help text: `Example: human, gpt, claude, gemini`

---

## Shared Option Banks

Use these exact option values everywhere.

`interruption_class`

- `session_cutoff`
- `task_switch`
- `blocked_waiting`
- `environment_drift`
- `failure_boundary`
- `handoff`
- `multi_open_work_conflict`
- `false_done`
- `dirty_done`

`dominant_loss_class`

- `focus_loss`
- `authority_loss`
- `readiness_loss`
- `intent_loss`
- `closure_loss`

`boundary_ambiguous`

- `yes`
- `no`

`nearest_alternative_class`

- `focus_loss`
- `authority_loss`
- `readiness_loss`
- `intent_loss`
- `closure_loss`
- `none`

`confidence`

- `high`
- `medium`
- `low`

---

## Episode Section Template

For each episode, create one new section.

Use the episode text as the `section description`, not as a separate question.
Copy the episode text exactly from `docs/validation-30-episode-send-pack.md`.
Do not paraphrase or compress the scenario text when building the form.

Inside each episode section, create these questions in this order:

1. Multiple choice, required
   Title: `[EPISODE_ID] interruption_class`
   Options: use the shared `interruption_class` bank

2. Multiple choice, required
   Title: `[EPISODE_ID] dominant_loss_class`
   Options: use the shared `dominant_loss_class` bank

3. Multiple choice, required
   Title: `[EPISODE_ID] boundary_ambiguous`
   Options: `yes`, `no`

4. Multiple choice, required
   Title: `[EPISODE_ID] nearest_alternative_class`
   Options: use the shared `nearest_alternative_class` bank
   Help text: `If boundary_ambiguous = no, choose none.`

5. Multiple choice, optional
   Title: `[EPISODE_ID] confidence`
   Options: `high`, `medium`, `low`

6. Paragraph, required
   Title: `[EPISODE_ID] justification`
   Help text: `Keep this short and structural. Focus on the earliest unresolved object.`

7. Paragraph, optional
   Title: `[EPISODE_ID] notes`
   Help text: `Use for wording concerns or ambiguity notes not captured above.`

---

## Episode Section Order

Build the sections in this exact order.

1. `Episode E-SWE-01`
2. `Episode E-SWE-02`
3. `Episode E-CON-01`
4. `Episode E-CON-02`
5. `Episode E-HIS-01`
6. `Episode E-CON-03`
7. `Episode E-CON-04`
8. `Episode E-CON-05`
9. `Episode E-CON-06`
10. `Episode E-CON-07`
11. `Episode E-CON-08`
12. `Episode E-CON-09`
13. `Episode E-CON-10`
14. `Episode E-SWE-03`
15. `Episode E-SWE-07`
16. `Episode E-HIS-02`
17. `Episode E-HIS-03`
18. `Episode E-HIS-04`
19. `Episode E-PUB-01`
20. `Episode E-PUB-02`
21. `Episode E-PUB-03`
22. `Episode E-PUB-04`
23. `Episode E-PUB-05`
24. `Episode E-PUB-06`
25. `Episode E-SWE-04`
26. `Episode E-SWE-05`
27. `Episode E-SWE-06`
28. `Episode E-SWE-08`
29. `Episode E-SWE-09`
30. `Episode E-SWE-10`

---

## Build Checklist

- Use the form title and description above
- Add the `Annotator Information` section first
- Create `30` episode sections in the exact order above
- Paste each episode body into the matching section description
- Reuse the exact option values from the shared option banks
- Keep question titles prefixed with `[EPISODE_ID]` for clean spreadsheet export
- Keep `nearest_alternative_class` required
- Keep `justification` required
- Do not expose the hidden ledger or expected labels anywhere in the form

---

## Final Pre-Send Check

Before sending the form to annotators, confirm:

- the form contains exactly `30` episode sections
- every episode section contains exactly `7` questions
- every section title matches the episode ID in the send pack
- every section description is copied from the matching episode block with no paraphrase
- `nearest_alternative_class` includes `none`
- the form does not mention hidden provenance, packet origin, or expected labels
