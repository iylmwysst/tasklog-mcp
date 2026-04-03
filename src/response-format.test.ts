import test from "node:test";
import assert from "node:assert/strict";
import {
  formatActiveContextResponse,
  formatAppendResponse,
  formatCompactWorkContextResponse,
  formatMetadataAmendResponse,
  formatReadResponse,
  formatWorkDocResponse,
  formatWorkImpactResponse,
  formatWorkContextResponse,
  formatWorkListResponse,
} from "./response-format.js";
import type {
  ActiveContextSummary,
  AppendWorkNoteResult,
  CreateWorkDocResult,
  ResumeCapsule,
  SessionLogEntry,
  WorkContextSummary,
  WorkListEntry,
  WorkRecord,
  WorkState,
} from "./logbook.js";

function makeEntry(overrides: Partial<SessionLogEntry> = {}): SessionLogEntry {
  return {
    id: "a91K2x",
    timestamp: "2026-03-26T00:00:00.000Z",
    summary: "Safe summary",
    status: "Done",
    change_type: "bugfix",
    affected_files: ["src/auth.ts"],
    tags: ["tag-a"],
    revision: 1,
    created_at: "2026-03-26T00:00:00.000Z",
    updated_at: "2026-03-26T00:00:00.000Z",
    ...overrides,
  };
}

function makeWork(overrides: Partial<WorkRecord> = {}): WorkRecord {
  return {
    work_id: "b37MqD",
    title: "Secure launch handoff",
    slug: "secure-launch-handoff",
    status: "active",
    start_dir: "/tmp/project/WebWayFleet",
    scope_paths: ["/tmp/project/WebWayFleet", "/tmp/project/CodeWebway"],
    created_at: "2026-03-26T00:00:00.000Z",
    updated_at: "2026-03-26T00:00:00.000Z",
    ...overrides,
  };
}

function makeResumeCapsule(overrides: Partial<ResumeCapsule> = {}): ResumeCapsule {
  return {
    current_work: "b37MqD",
    governing_source: ["work_record", "latest_log"],
    authority_reason: "Work record and latest log agree.",
    readiness: "act",
    next_valid_action: "Resume the scoped implementation pass.",
    ...overrides,
  };
}

function makeWorkState(overrides: Partial<WorkState> = {}): WorkState {
  return {
    current_work: {
      work_id: "b37MqD",
      title: "Secure launch handoff",
      status: "active",
      context_mode: "active",
      scope_paths: ["/tmp/project/WebWayFleet", "/tmp/project/CodeWebway"],
    },
    authority: {
      status: "clear",
      basis: ["work_record", "latest_log"],
      reason: "Work record and latest log agree.",
    },
    readiness: {
      mode: "act",
      reason: "The work is active and ready to resume.",
    },
    next_valid_action: {
      kind: "resume",
      summary: "Resume the scoped implementation pass.",
    },
    ...overrides,
  };
}

function makeWorkContext(overrides: Partial<WorkContextSummary> = {}): WorkContextSummary {
  return {
    work: makeWork(),
    artifact_paths: {
      workDir: "/tmp/project/workdocs/b37MqD-secure-launch-handoff",
      designPath: "/tmp/project/workdocs/b37MqD-secure-launch-handoff/design.md",
      planPath: "/tmp/project/workdocs/b37MqD-secure-launch-handoff/plan.md",
      specPath: "/tmp/project/workdocs/b37MqD-secure-launch-handoff/spec.md",
      summaryPath: "/tmp/project/workdocs/b37MqD-secure-launch-handoff/summary.md",
      notesPath: "/tmp/project/workdocs/b37MqD-secure-launch-handoff/notes.md",
    },
    artifact_availability: {
      design: true,
      plan: true,
      spec: true,
      summary: true,
      notes: true,
    },
    context_mode: "active",
    work_state: makeWorkState(),
    recent_logs: [],
    recent_log_count: 0,
    summary_text: undefined,
    ...overrides,
  };
}

test("formatAppendResponse escapes multiline user-controlled fields", () => {
  const output = formatAppendResponse(
    makeEntry({
      work_id: "b37MqD",
      summary: "Did useful work.\nFiles: injected",
      affected_files: ["src/auth.ts", "src/router.ts\nTags: injected"],
      resume_capsule: makeResumeCapsule({
        next_valid_action: "Resume the next step.\nInjected",
      }),
    }),
    {
      jsonPath: "/tmp/project/.tasklog/session-log.json",
      markdownPath: "/tmp/project/.tasklog/session-log.md",
    },
  );

  assert.ok(output.includes("Summary: Did useful work.\\nFiles: injected"));
  assert.ok(output.includes("Work: b37MqD"));
  assert.ok(output.includes("Resume readiness: act"));
  assert.ok(output.includes("src/router.ts\\nTags: injected"));
});

test("formatMetadataAmendResponse escapes multiline metadata fields", () => {
  const output = formatMetadataAmendResponse(
    makeEntry({
      work_id: "b37MqD",
      affected_files: ["src/auth.ts\nSummary: injected"],
      tags: ["tag-a", "tag-b\nFiles: injected"],
    }),
  );

  assert.ok(output.includes("Work: b37MqD"));
  assert.ok(output.includes("src/auth.ts\\nSummary: injected"));
  assert.ok(output.includes("tag-b\\nFiles: injected"));
});

test("formatReadResponse keeps recent-log output focused on evidence entries", () => {
  const output = formatReadResponse("Recent logs", [makeEntry()]);

  assert.ok(output.includes("Recent logs:"));
  assert.ok(output.includes("Safe summary"));
  assert.ok(!output.includes("Project root:"));
  assert.ok(!output.includes("JSON log:"));
  assert.ok(!output.includes("Markdown log:"));
});

test("formatActiveContextResponse renders active work details", () => {
  const summary: ActiveContextSummary = {
    active_work_id: "b37MqD",
    project_root: "/tmp/project",
    updated_at: "2026-03-26T00:00:00.000Z",
    state_root: "/tmp/project/.tasklog",
    workdocs_root: "/tmp/project/workdocs",
    json_path: "/tmp/project/.tasklog/session-log.json",
    markdown_path: "/tmp/project/.tasklog/session-log.md",
    active_work: makeWork(),
    freshness: "fresh",
  };

  const output = formatActiveContextResponse(summary);
  assert.ok(output.includes("Active work: b37MqD Secure launch handoff"));
  assert.ok(output.includes("Freshness: fresh"));
});

test("formatWorkListResponse renders compact work summaries", () => {
  const works: WorkListEntry[] = [
    {
      ...makeWork(),
      impact: "high",
      artifact_availability: {
        design: true,
        plan: false,
        spec: false,
        summary: true,
        notes: true,
      },
      context_mode: "closed/consolidated",
      last_log_summary: "Reduced placeholder copy.",
      next_step_summary: "Align the terminal-side handoff.",
      recent_log_id: "a91K2x",
    },
  ];

  const output = formatWorkListResponse(works, {
    project_root: "/tmp/project",
    workdocs_root: "/tmp/project/workdocs",
  });

  assert.ok(output.includes("b37MqD [active] Secure launch handoff"));
  assert.ok(output.includes("Context mode: closed/consolidated"));
  assert.ok(output.includes("Impact: high"));
  assert.ok(output.includes("Last log: Reduced placeholder copy."));
  assert.ok(output.includes("Artifacts: design=true plan=false spec=false summary=true notes=true"));
});

test("formatWorkListResponse does not promote raw next steps for consolidated work", () => {
  const works: WorkListEntry[] = [
    {
      ...makeWork({ status: "done", impact: "high" }),
      artifact_availability: {
        design: true,
        plan: true,
        spec: true,
        summary: true,
        notes: true,
      },
      context_mode: "closed/consolidated",
      last_log_summary: "Closed the work with a final pass.",
      next_step_summary: undefined,
      recent_log_id: "a91K2x",
    },
  ];

  const output = formatWorkListResponse(works, {
    project_root: "/tmp/project",
    workdocs_root: "/tmp/project/workdocs",
  });

  assert.ok(output.includes("Context mode: closed/consolidated"));
  assert.ok(!output.includes("Next step:"));
});

test("formatWorkDocResponse renders target paths for plan docs", () => {
  const result: CreateWorkDocResult = {
    work: makeWork(),
    path: "/tmp/project/workdocs/b37MqD-secure-launch-handoff/plan.md",
    created: true,
    target_paths: ["/tmp/project/CodeWebway"],
  };

  const output = formatWorkDocResponse("Plan doc ready", result);
  assert.ok(output.includes("Path: /tmp/project/workdocs/b37MqD-secure-launch-handoff/plan.md"));
  assert.ok(output.includes("Target paths: /tmp/project/CodeWebway"));
});

test("formatWorkDocResponse also supports note append results", () => {
  const result: AppendWorkNoteResult = {
    work: makeWork(),
    path: "/tmp/project/workdocs/b37MqD-secure-launch-handoff/notes.md",
    created: false,
  };

  const output = formatWorkDocResponse("Work note appended", result);
  assert.ok(output.includes("Created: false"));
  assert.ok(output.includes("notes.md"));
});

test("formatWorkImpactResponse renders the new impact field", () => {
  const output = formatWorkImpactResponse(
    makeWork({
      impact: "critical",
      updated_at: "2026-03-27T00:00:00.000Z",
    }),
  );

  assert.ok(output.includes("Work impact updated."));
  assert.ok(output.includes("Impact: critical"));
});

test("formatWorkContextResponse renders summary-aware context fields", () => {
  const output = formatWorkContextResponse(makeWorkContext({
    work: makeWork({ status: "done", impact: "high" }),
    context_mode: "closed/consolidated",
    work_state: makeWorkState({
      current_work: {
        work_id: "b37MqD",
        title: "Secure launch handoff",
        status: "done",
        context_mode: "closed/consolidated",
        scope_paths: ["/tmp/project/WebWayFleet", "/tmp/project/CodeWebway"],
      },
      readiness: {
        mode: "done",
        reason: "The work is closed with a canonical summary.",
      },
      next_valid_action: {
        kind: "review_summary",
        summary: "Review the summary doc if re-entry is needed.",
      },
    }),
    recent_logs: [],
    recent_log_count: 1,
    summary_text: undefined,
  }));

  assert.ok(output.includes("Context mode: closed/consolidated"));
  assert.ok(output.includes("Impact: high"));
  assert.ok(output.includes("summary=/tmp/project/workdocs/b37MqD-secure-launch-handoff/summary.md"));
  assert.ok(output.includes("Re-entry brief: /tmp/project/workdocs/b37MqD-secure-launch-handoff/summary.md (use include_summary=true to inline it)"));
  assert.ok(output.includes("Authority: clear (work_record, latest_log)"));
  assert.ok(output.includes("Readiness: done"));
  assert.ok(output.includes("Next valid action: review_summary - Review the summary doc if re-entry is needed."));
  assert.ok(output.includes("Recent logs: 1 available as secondary evidence (use include_recent_logs=true to load them)."));
  assert.ok(!output.includes("Next step:"));
  assert.ok(!output.includes("Summary: Safe summary"));
});

test("formatCompactWorkContextResponse keeps compact output focused on the re-entry brief", () => {
  const output = formatCompactWorkContextResponse(makeWorkContext({
    work: makeWork({ status: "done", impact: "critical" }),
    context_mode: "closed/consolidated",
    work_state: makeWorkState({
      current_work: {
        work_id: "b37MqD",
        title: "Secure launch handoff",
        status: "done",
        context_mode: "closed/consolidated",
        scope_paths: ["/tmp/project/WebWayFleet"],
      },
      readiness: {
        mode: "done",
        reason: "The work is closed with a canonical summary.",
      },
      next_valid_action: {
        kind: "review_summary",
        summary: "Review the summary doc if re-entry is needed.",
      },
    }),
    recent_logs: [],
    recent_log_count: 2,
    summary_text: undefined,
    reentry_brief: {
      title: "Secure launch handoff",
      status: "done",
      scope_paths: ["/tmp/project/WebWayFleet"],
      latest_log_summary: "Captured the final handoff.",
      next_step_summary: "",
      artifact_files: ["summary.md", "notes.md"],
    },
  }));

  assert.ok(output.includes("Re-entry brief: b37MqD Secure launch handoff"));
  assert.ok(output.includes("Impact: critical"));
  assert.ok(output.includes("Summary doc: available (use include_summary=true to inline it)"));
  assert.ok(output.includes("Recent logs: 2 available as secondary evidence."));
  assert.ok(output.includes("Readiness: done"));
  assert.ok(!output.includes("Docs: design="));
  assert.ok(!output.includes("Compact work context:"));
  assert.ok(!output.includes("/tmp/project/workdocs/b37MqD-secure-launch-handoff/design.md"));
  assert.ok(!output.includes("Latest log:"));
  assert.ok(!output.includes("Resume capsule:"));
});
