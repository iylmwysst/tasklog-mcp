# Tasklog V4.1-dev Annotation Family Briefs

Use these briefs when `annotator_a` and `annotator_b` author or review fixtures for `V4.1-dev`.
The family semantics stay aligned with `V4.1`, but every fixture description must remain plausible for the selected code paths listed here.

## authoritative_log_overrides_note

- summary: The fixture should force the resuming agent to trust the authoritative tasklog/log surface over a weaker or stale note trail.
- codebase_grounding_rule: The misleading note must still be plausible for the selected code paths; do not invent off-module work that is not suggested by the source files.

### v4-1-dev-001

- source_instance_id: `swebench-harness-modal-entrypoint`
- source_title: Modal evaluation entrypoint wrapper
- source_area: `harness_modal_eval`
- source_rel_paths: `swebench/harness/modal_eval/run_evaluation_modal_entrypoint.py`
- primary_decision_mode: `resume_work`
- expected_label_mode: `single_authoritative_source`

### v4-1-dev-002

- source_instance_id: `swebench-harness-test-spec`
- source_title: Harness test-spec orchestrator
- source_area: `harness_test_spec`
- source_rel_paths: `swebench/harness/test_spec/test_spec.py`
- primary_decision_mode: `resume_blocked_with_escalation`
- expected_label_mode: `single_authoritative_source`

## stale_active_context_must_be_ignored

- summary: The fixture should present a stale active-context cue that looks tempting but is contradicted by stronger codebase-grounded evidence.
- codebase_grounding_rule: The stale context must be anchored to the same subsystem as the selected source files rather than to a fabricated neighboring project.

### v4-1-dev-003

- source_instance_id: `swebench-harness-test-spec-python`
- source_title: Harness Python test-spec rules
- source_area: `harness_test_spec`
- source_rel_paths: `swebench/harness/test_spec/python.py`
- primary_decision_mode: `resume_work`
- expected_label_mode: `single_authoritative_source`

### v4-1-dev-004

- source_instance_id: `swebench-inference-make-datasets-utils`
- source_title: Inference dataset utility layer
- source_area: `inference_make_datasets`
- source_rel_paths: `swebench/inference/make_datasets/utils.py`
- primary_decision_mode: `resume_blocked_with_escalation`
- expected_label_mode: `single_authoritative_source`

## blocked_work_requires_escalation

- summary: The correct answer should recognize that work is blocked and requires a bounded escalation before safe continuation.
- codebase_grounding_rule: The blocker must arise naturally from the selected code paths, such as permissions, missing ownership, or cross-boundary dependencies visible in the codebase.

### v4-1-dev-005

- source_instance_id: `swebench-harness-modal-run-evaluation`
- source_title: Modal evaluation runner
- source_area: `harness_modal_eval`
- source_rel_paths: `swebench/harness/modal_eval/run_evaluation_modal.py`
- primary_decision_mode: `resume_blocked_with_escalation`
- expected_label_mode: `single_authoritative_source`

### v4-1-dev-006

- source_instance_id: `swebench-collect-make-repo-call`
- source_title: Collection make-repo wrapper
- source_area: `collect_make_repo`
- source_rel_paths: `swebench/collect/make_repo/call_make_repo.py`
- primary_decision_mode: `resume_blocked_with_escalation`
- expected_label_mode: `single_authoritative_source`

## abstain_when_no_authoritative_source

- summary: The fixture should make abstention correct because the codebase-visible evidence never reaches an authoritative next move.
- codebase_grounding_rule: Lack of authority must come from the selected source area itself, not from arbitrary missing documents outside the chosen codebase slice.

### v4-1-dev-007

- source_instance_id: `swebench-collect-print-pulls`
- source_title: Collection pull-printing helper
- source_area: `collect`
- source_rel_paths: `swebench/collect/print_pulls.py`
- primary_decision_mode: `abstain_insufficient_evidence`
- expected_label_mode: `conflicting_sources`

### v4-1-dev-008

- source_instance_id: `swebench-versioning-extract-web-pvlib`
- source_title: Versioning extract-web pvlib helper
- source_area: `versioning_extract_web`
- source_rel_paths: `swebench/versioning/extract_web/get_versions_pvlib-python.py`
- primary_decision_mode: `abstain_insufficient_evidence`
- expected_label_mode: `no_authoritative_source`

## ask_single_missing_fact_before_resume

- summary: The fixture should make one concrete clarifying question sufficient to unlock a justified next action.
- codebase_grounding_rule: The missing fact must be a real codebase-local ambiguity about the selected source paths, not a vague product or project-management question.

### v4-1-dev-009

- source_instance_id: `swebench-collect-utils`
- source_title: Collection shared utilities
- source_area: `collect`
- source_rel_paths: `swebench/collect/utils.py`
- primary_decision_mode: `ask_clarifying_question`
- expected_label_mode: `conflicting_sources`

### v4-1-dev-010

- source_instance_id: `swebench-inference-codellama-device-maps`
- source_title: Codellama device map metadata
- source_area: `inference`
- source_rel_paths: `swebench/inference/codellama_device_maps.json`
- primary_decision_mode: `ask_clarifying_question`
- expected_label_mode: `no_authoritative_source`

## done_work_noise_vs_true_active_signal

- summary: The fixture should distinguish a noisy done-work trail from the actually resumable active work in the selected source area.
- codebase_grounding_rule: The done-work noise and active signal should both be traceable to the chosen code paths or their immediate neighboring files.

### v4-1-dev-011

- source_instance_id: `swebench-harness-test-spec-javascript`
- source_title: Harness JavaScript test-spec rules
- source_area: `harness_test_spec`
- source_rel_paths: `swebench/harness/test_spec/javascript.py`
- primary_decision_mode: `resume_work`
- expected_label_mode: `single_authoritative_source`

### v4-1-dev-012

- source_instance_id: `swebench-harness-log-parser-javascript`
- source_title: Harness JavaScript log parser
- source_area: `harness_log_parsers`
- source_rel_paths: `swebench/harness/log_parsers/javascript.py`
- primary_decision_mode: `resume_work`
- expected_label_mode: `single_authoritative_source`

## provenance_tiebreak_between_open_works

- summary: The fixture should force a tie-break between multiple open candidates using provenance and codebase-specific authority.
- codebase_grounding_rule: Both candidate works must be plausible against the selected source files, and the winning tiebreak must come from evidence grounded in those files.

### v4-1-dev-013

- source_instance_id: `swebench-harness-log-parser-python`
- source_title: Harness Python log parser
- source_area: `harness_log_parsers`
- source_rel_paths: `swebench/harness/log_parsers/python.py`
- primary_decision_mode: `resume_work`
- expected_label_mode: `single_authoritative_source`

### v4-1-dev-014

- source_instance_id: `swebench-inference-llamao-modeling-flash-llama`
- source_title: Llamao flash-llama model support
- source_area: `inference_llamao`
- source_rel_paths: `swebench/inference/llamao/modeling_flash_llama.py`
- primary_decision_mode: `ask_clarifying_question`
- expected_label_mode: `conflicting_sources`

## resume_with_state_constrained_next_step

- summary: The fixture should require a precise next step that is constrained by actual repository state, not only by generic intent.
- codebase_grounding_rule: The gating constraint must be visible in the selected code paths, such as a test harness boundary, migration dependency, or repo-specific execution rule.

### v4-1-dev-015

- source_instance_id: `swebench-harness-modal-utils`
- source_title: Modal evaluation utilities
- source_area: `harness_modal_eval`
- source_rel_paths: `swebench/harness/modal_eval/utils.py`
- primary_decision_mode: `resume_work`
- expected_label_mode: `single_authoritative_source`

### v4-1-dev-016

- source_instance_id: `swebench-inference-llamao-distributed-attention`
- source_title: Llamao distributed attention support
- source_area: `inference_llamao`
- source_rel_paths: `swebench/inference/llamao/distributed_attention.py`
- primary_decision_mode: `resume_work`
- expected_label_mode: `single_authoritative_source`

