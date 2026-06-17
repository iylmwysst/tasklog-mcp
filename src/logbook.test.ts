import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import {
  appendLogEntry,
  appendWorkNote,
  createWorkDoc,
  formatLogEntries,
  getActiveContext,
  getOpenThreadEntries,
  getRecentLogEntries,
  listWorks,
  readLogEntries,
  readWorkContext,
  resolveLogbookPaths,
  resumeWork,
  setWorkImpact,
  setWorkStatus,
  startWork,
  updateLogStatus,
  amendLogMetadata,
} from "./logbook.js";

test("appendLogEntry writes canonical and legacy session logs", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "tasklog-mcp-"));
  const paths = resolveLogbookPaths(projectRoot);

  const entry = await appendLogEntry(paths, {
    summary: "Refined auth guard handling to avoid redirect loops after token expiry.",
    status: "Done",
    change_type: "refactor",
    affected_files: ["src/auth.ts", "src/router.ts", "src/auth.ts"],
    tags: ["Routing", "auth"],
    next_steps: "Verify that the callback route still lands correctly after refresh.",
    blockers: "",
    resume_capsule: {
      current_work: "handoff-work",
      governing_source: ["work_record", "latest_log"],
      authority_reason: "The work record and the latest log agree on the governing state.",
      readiness: "act",
      next_valid_action: "Resume the callback-route verification pass.",
    },
  });

  assert.match(entry.id, /^[0-9A-Za-z]{6}$/);
  assert.equal(entry.status, "Done");
  assert.equal(entry.change_type, "refactor");
  assert.deepEqual(entry.affected_files, ["src/auth.ts", "src/router.ts"]);
  assert.deepEqual(entry.tags, ["routing", "auth"]);
  assert.equal(entry.work_id, undefined);
  assert.equal(entry.resume_capsule?.readiness, "act");
  assert.equal(entry.revision, 1);

  const jsonLog = JSON.parse(await readFile(paths.jsonPath, "utf8")) as Array<{
    summary: string;
    resume_capsule?: { readiness: string };
  }>;
  const legacyJsonLog = JSON.parse(await readFile(paths.legacyJsonPath, "utf8")) as Array<{
    summary: string;
    resume_capsule?: { readiness: string };
  }>;
  const markdownLog = await readFile(paths.markdownPath, "utf8");
  const legacyMarkdownLog = await readFile(paths.legacyMarkdownPath, "utf8");

  assert.equal(jsonLog.length, 1);
  assert.equal(legacyJsonLog.length, 1);
  assert.equal(jsonLog[0]?.summary, "Refined auth guard handling to avoid redirect loops after token expiry.");
  assert.equal(legacyJsonLog[0]?.summary, "Refined auth guard handling to avoid redirect loops after token expiry.");
  assert.equal(jsonLog[0]?.resume_capsule?.readiness, "act");
  assert.equal(legacyJsonLog[0]?.resume_capsule?.readiness, "act");
  assert.match(markdownLog, /AI Session Logbook/);
  assert.match(legacyMarkdownLog, /AI Session Logbook/);
  assert.match(markdownLog, /src\/auth\.ts/);
  assert.match(markdownLog, /Resume capsule/);
  assert.match(markdownLog, /Current work id: handoff-work/);
});

test("appendLogEntry validates readiness-specific resume capsule requirements", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "tasklog-mcp-"));
  const paths = resolveLogbookPaths(projectRoot);

  await assert.rejects(
    () =>
      appendLogEntry(paths, {
        summary: "Attempted to log an invalid revalidate handoff.",
        status: "Blocked",
        change_type: "investigation",
        affected_files: [],
        resume_capsule: {
          current_work: "abc123",
          governing_source: ["work_record"],
          authority_reason: "Work record is the only visible source.",
          readiness: "revalidate",
          next_valid_action: "Recheck the state before continuing.",
        },
      }),
    /resume_capsule\.verification_target is required for readiness=revalidate/,
  );
});

test("appendLogEntry rejects prose current_work when the resolved work id is different", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "tasklog-mcp-"));
  const paths = resolveLogbookPaths(projectRoot);
  const work = await startWork(paths, {
    title: "Debug tasklog write hints",
  });

  await assert.rejects(
    () =>
      appendLogEntry(paths, {
        summary: "Tried to write a handoff with a prose work description instead of the work id.",
        status: "Done",
        change_type: "docs",
        affected_files: [],
        work_id: work.work_id,
        resume_capsule: {
          current_work: "Debug tasklog write hints",
          governing_source: ["work_record", "latest_log"],
          authority_reason: "The work record and latest log agree on the active task.",
          readiness: "done",
          next_valid_action: "No further action required.",
        },
      }),
    new RegExp(
      `resume_capsule\\.current_work must be the exact work_id for this log entry\\. Expected "${work.work_id}" but received "Debug tasklog write hints"\\. This field stores the work_id, not a prose work summary\\.`,
    ),
  );
});

test("startWork creates a work record and fresh active context", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "tasklog-mcp-"));
  const paths = resolveLogbookPaths(projectRoot);

  const work = await startWork(paths, {
    title: "Secure launch handoff polish",
    summary: "Unify secure-launch placeholder handoff copy and behavior.",
    start_dir: "WebWayFleet",
    scope_paths: ["WebWayFleet", "CodeWebway"],
    tags: ["secure-launch", "ux"],
  });
  const context = await getActiveContext(paths);

  assert.match(work.work_id, /^[0-9A-Za-z]{6}$/);
  assert.equal(work.slug, "secure-launch-handoff-polish");
  assert.equal(work.start_dir, path.join(projectRoot, "WebWayFleet"));
  assert.deepEqual(work.scope_paths, [
    path.join(projectRoot, "WebWayFleet"),
    path.join(projectRoot, "CodeWebway"),
  ]);
  assert.equal(context.active_work?.work_id, work.work_id);
  assert.equal(context.freshness, "fresh");
  assert.equal(path.basename(context.workdocs_root), "workdocs");
});

test("startWork supports one workspace root with multiple repo scope paths", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "tasklog-mcp-"));
  const paths = resolveLogbookPaths(projectRoot);

  const work = await startWork(paths, {
    title: "Workspace-scoped task",
    start_dir: ".",
    scope_paths: ["CodeWebway", "WebWayFleet"],
  });
  const planDoc = await createWorkDoc(paths, "plan", {
    work_id: work.work_id,
    target_paths: ["WebWayFleet"],
  });
  const planText = await readFile(planDoc.path, "utf8");

  assert.equal(work.start_dir, projectRoot);
  assert.deepEqual(work.scope_paths, [
    path.join(projectRoot, "CodeWebway"),
    path.join(projectRoot, "WebWayFleet"),
  ]);
  assert.deepEqual(planDoc.target_paths, [path.join(projectRoot, "WebWayFleet")]);
  assert.match(planText, /target_paths:\n  - '\/.*WebWayFleet'/);
});

test("startWork rejects multiline titles to prevent frontmatter injection", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "tasklog-mcp-"));
  const paths = resolveLogbookPaths(projectRoot);

  await assert.rejects(
    () =>
      startWork(paths, {
        title: "Title with newline\nstatus: done",
      }),
    /title must stay on a single line/,
  );
});

test("startWork rejects scope paths that escape the workspace root", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "tasklog-mcp-"));
  const paths = resolveLogbookPaths(projectRoot);

  await assert.rejects(
    () =>
      startWork(paths, {
        title: "Escaping scope path",
        start_dir: ".",
        scope_paths: ["../outside-workspace"],
      }),
    /scope_paths must stay within the project root/,
  );
});

test("createWorkDoc writes workdocs and validates target_paths", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "tasklog-mcp-"));
  const paths = resolveLogbookPaths(projectRoot);
  const work = await startWork(paths, {
    title: "Cross repo login handoff",
    start_dir: ".",
    scope_paths: ["CodeWebway", "WebWayFleet"],
  });

  const designDoc = await createWorkDoc(paths, "design", { work_id: work.work_id });
  const planDoc = await createWorkDoc(paths, "plan", {
    work_id: work.work_id,
    target_paths: ["CodeWebway"],
  });
  const designText = await readFile(designDoc.path, "utf8");
  const planText = await readFile(planDoc.path, "utf8");

  assert.equal(designDoc.created, true);
  assert.equal(planDoc.created, true);
  assert.match(designText, /# Design/);
  assert.match(planText, /target_paths:/);
  assert.match(planText, /'\/.*CodeWebway'/);

  const invalidWork = await startWork(paths, {
    title: "Invalid target scope work",
    start_dir: ".",
    scope_paths: ["CodeWebway"],
  });

  await assert.rejects(
    () =>
      createWorkDoc(paths, "plan", {
        work_id: invalidWork.work_id,
        target_paths: ["OutsideRepo"],
      }),
    /target_paths must stay within the work scope/,
  );
});

test("createWorkDoc defaults plan target_paths to the full work scope when omitted", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "tasklog-mcp-"));
  const paths = resolveLogbookPaths(projectRoot);
  const work = await startWork(paths, {
    title: "Plan default full scope",
    start_dir: ".",
    scope_paths: ["CodeWebway", "WebWayFleet"],
  });

  const planDoc = await createWorkDoc(paths, "plan", {
    work_id: work.work_id,
  });
  const planText = await readFile(planDoc.path, "utf8");

  assert.equal(planDoc.created, true);
  assert.deepEqual(planDoc.target_paths, [
    path.join(projectRoot, "CodeWebway"),
    path.join(projectRoot, "WebWayFleet"),
  ]);
  assert.match(planText, /'\/.*CodeWebway'/);
  assert.match(planText, /'\/.*WebWayFleet'/);
});

test("createWorkDoc allows target_paths nested within a scope root", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "tasklog-mcp-"));
  const paths = resolveLogbookPaths(projectRoot);
  const work = await startWork(paths, {
    title: "Nested scope target",
    start_dir: ".",
    scope_paths: ["CodeWebway"],
  });

  const planDoc = await createWorkDoc(paths, "plan", {
    work_id: work.work_id,
    target_paths: ["CodeWebway/src"],
  });
  const planText = await readFile(planDoc.path, "utf8");

  assert.equal(planDoc.created, true);
  assert.deepEqual(planDoc.target_paths, [path.join(projectRoot, "CodeWebway/src")]);
  assert.match(planText, /'\/.*CodeWebway\/src'/);
});

test("createWorkDoc rejects target_paths overrides when plan.md already exists", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "tasklog-mcp-"));
  const paths = resolveLogbookPaths(projectRoot);
  const work = await startWork(paths, {
    title: "Existing plan target mismatch guard",
    start_dir: ".",
    scope_paths: ["CodeWebway", "WebWayFleet"],
  });

  const firstPlan = await createWorkDoc(paths, "plan", {
    work_id: work.work_id,
    target_paths: ["CodeWebway"],
  });
  const firstText = await readFile(firstPlan.path, "utf8");

  await assert.rejects(
    () =>
      createWorkDoc(paths, "plan", {
        work_id: work.work_id,
        target_paths: ["WebWayFleet"],
      }),
    /plan\.md already exists; refusing to report new target_paths without updating the file/,
  );

  const secondText = await readFile(firstPlan.path, "utf8");
  assert.equal(secondText, firstText);
  assert.match(secondText, /'\/.*CodeWebway'/);
});

test("createWorkDoc is idempotent when target_paths matches the existing plan", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "tasklog-mcp-"));
  const paths = resolveLogbookPaths(projectRoot);
  const work = await startWork(paths, {
    title: "Existing plan same target retry",
    start_dir: ".",
    scope_paths: ["CodeWebway", "WebWayFleet"],
  });

  const firstPlan = await createWorkDoc(paths, "plan", {
    work_id: work.work_id,
    target_paths: ["CodeWebway"],
  });
  const firstText = await readFile(firstPlan.path, "utf8");

  const retriedPlan = await createWorkDoc(paths, "plan", {
    work_id: work.work_id,
    target_paths: ["CodeWebway"],
  });
  const secondText = await readFile(firstPlan.path, "utf8");

  assert.equal(retriedPlan.created, false);
  assert.deepEqual(retriedPlan.target_paths, [path.join(projectRoot, "CodeWebway")]);
  assert.equal(secondText, firstText);
});

test("createWorkDoc rejects target_paths when an existing plan is missing the target_paths block", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "tasklog-mcp-"));
  const paths = resolveLogbookPaths(projectRoot);
  const work = await startWork(paths, {
    title: "Existing plan missing target paths block",
    start_dir: ".",
    scope_paths: ["CodeWebway", "WebWayFleet"],
  });

  const firstPlan = await createWorkDoc(paths, "plan", {
    work_id: work.work_id,
    target_paths: ["CodeWebway"],
  });
  const firstText = await readFile(firstPlan.path, "utf8");
  const malformedText = firstText.replace(/target_paths:\n(?:  - .*\n)+/, "");
  await writeFile(firstPlan.path, malformedText, "utf8");

  await assert.rejects(
    () =>
      createWorkDoc(paths, "plan", {
        work_id: work.work_id,
        target_paths: ["WebWayFleet"],
      }),
    /plan\.md already exists; refusing to report new target_paths without updating the file/,
  );

  const secondText = await readFile(firstPlan.path, "utf8");
  assert.equal(secondText, malformedText);
  assert.doesNotMatch(secondText, /target_paths:/);
});

test("appendWorkNote creates notes and readWorkContext includes recent logs", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "tasklog-mcp-"));
  const paths = resolveLogbookPaths(projectRoot);
  const work = await startWork(paths, {
    title: "Agent context cleanup",
  });

  const noteResult = await appendWorkNote(paths, {
    work_id: work.work_id,
    note: "Need to keep work scope light and prefer target_paths in plan docs.",
  });
  await appendWorkNote(paths, {
    work_id: work.work_id,
    note: "Second note should append after the first one.",
  });

  await appendLogEntry(paths, {
    summary: "Linked work-aware logging to the current active work.",
    status: "Done",
    change_type: "feature",
    affected_files: ["src/logbook.ts"],
    work_id: work.work_id,
  });

  const notesText = await readFile(noteResult.path, "utf8");
  const context = await readWorkContext(paths, work.work_id);

  assert.equal(noteResult.created, true);
  assert.match(notesText, /# Notes/);
  assert.match(notesText, /target_paths in plan docs/);
  assert.match(
    notesText,
    /Need to keep work scope light and prefer target_paths in plan docs\.[\s\S]*Second note should append after the first one\./,
  );
  assert.equal(context.work.work_id, work.work_id);
  assert.equal(context.recent_logs.length, 1);
  assert.equal(context.recent_logs[0]?.work_id, work.work_id);
  assert.equal(context.artifact_availability.notes, true);
});

test("getRecentLogEntries defaults to the fresh active work", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "tasklog-mcp-"));
  const paths = resolveLogbookPaths(projectRoot);
  const workA = await startWork(paths, {
    title: "Login handoff",
  });

  await appendLogEntry(paths, {
    summary: "Implemented work-aware recovery for login handoff.",
    status: "Done",
    change_type: "feature",
    affected_files: ["src/index.ts"],
  });

  const workB = await startWork(paths, {
    title: "Secure launch placeholder",
  });

  await appendLogEntry(paths, {
    summary: "Reduced placeholder copy and aligned popup polling copy.",
    status: "Done",
    change_type: "docs",
    affected_files: ["dashboard/src/lib/terminal-launch.ts"],
  });

  const activeRecent = await getRecentLogEntries(paths, 10);
  const projectRecent = await getRecentLogEntries(paths, 10, { project_wide: true });

  assert.equal(workA.work_id !== workB.work_id, true);
  assert.equal(activeRecent.length, 1);
  assert.equal(activeRecent[0]?.work_id, workB.work_id);
  assert.equal(projectRecent.length, 2);
});

test("appendLogEntry does not implicitly attach work_id when active context is missing updated_at", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "tasklog-mcp-"));
  const paths = resolveLogbookPaths(projectRoot);
  const work = await startWork(paths, {
    title: "Missing freshness timestamp",
  });

  await writeFile(
    paths.activeContextPath,
    `${JSON.stringify({
      active_work_id: work.work_id,
      project_root: projectRoot,
    }, null, 2)}\n`,
    "utf8",
  );

  const entry = await appendLogEntry(paths, {
    summary: "Recorded a handoff without an explicit work id.",
    status: "Done",
    change_type: "docs",
    affected_files: ["README.md"],
  });

  assert.equal(entry.work_id, undefined);
});

test("appendLogEntry does not implicitly attach work_id when active context is stale or invalid", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "tasklog-mcp-"));
  const paths = resolveLogbookPaths(projectRoot);
  const staleWork = await startWork(paths, {
    title: "Stale active work",
  });

  await writeFile(
    paths.activeContextPath,
    `${JSON.stringify({
      active_work_id: staleWork.work_id,
      project_root: projectRoot,
      updated_at: "2000-01-01T00:00:00.000Z",
    }, null, 2)}\n`,
    "utf8",
  );

  const staleEntry = await appendLogEntry(paths, {
    summary: "Stale active context should not auto-attach.",
    status: "Done",
    change_type: "docs",
    affected_files: ["README.md"],
  });

  assert.equal(staleEntry.work_id, undefined);

  const invalidWork = await startWork(paths, {
    title: "Invalid active work",
  });
  await setWorkStatus(paths, invalidWork.work_id, "done");
  await writeFile(
    paths.activeContextPath,
    `${JSON.stringify({
      active_work_id: invalidWork.work_id,
      project_root: projectRoot,
      updated_at: "2026-03-27T00:00:00.000Z",
    }, null, 2)}\n`,
    "utf8",
  );

  const invalidEntry = await appendLogEntry(paths, {
    summary: "Done work in active context should not auto-attach.",
    status: "Done",
    change_type: "docs",
    affected_files: ["README.md"],
  });

  assert.equal(invalidEntry.work_id, undefined);
});

test("resumeWork query lookup and work status updates clear active work on done", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "tasklog-mcp-"));
  const paths = resolveLogbookPaths(projectRoot);
  const work = await startWork(paths, {
    title: "Host login reconnect tracing",
  });

  await startWork(paths, {
    title: "Other task",
  });

  const resumed = await resumeWork(paths, { query: "host login" });
  assert.equal(resumed.active_work?.work_id, work.work_id);

  const doneWork = await setWorkStatus(paths, work.work_id, "done");
  const context = await getActiveContext(paths);

  assert.equal(doneWork.status, "done");
  assert.equal(context.active_work_id, undefined);
});

test("getOpenThreadEntries still returns unresolved or follow-up logs during migration", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "tasklog-mcp-"));
  const paths = resolveLogbookPaths(projectRoot);

  await appendLogEntry(paths, {
    summary: "Wrapped up the release notes update.",
    status: "Done",
    change_type: "docs",
    affected_files: ["README.md"],
  });

  await appendLogEntry(paths, {
    summary: "Investigating host-login reconnect timing after approval.",
    status: "WIP",
    change_type: "investigation",
    affected_files: ["src/server.rs"],
    next_steps: "Trace websocket reattachment order.",
  });

  await appendLogEntry(paths, {
    summary: "Added dashboard polling for approval state, but waiting on API contract confirmation.",
    status: "Blocked",
    change_type: "feature",
    affected_files: ["dashboard/src/pages/HostLoginPage.tsx"],
    blockers: "API payload is still changing.",
  });

  const open = await getOpenThreadEntries(paths, 10);

  assert.equal(open.length, 2);
  assert.equal(open[0]?.status, "Blocked");
  assert.equal(open[1]?.status, "WIP");
});

test("updateLogStatus and amendLogMetadata revise existing entries", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "tasklog-mcp-"));
  const paths = resolveLogbookPaths(projectRoot);

  const entry = await appendLogEntry(paths, {
    summary: "Started tracing machine heartbeat retries.",
    status: "WIP",
    change_type: "investigation",
    affected_files: ["agent/src/main.rs"],
  });

  const amended = await amendLogMetadata(paths, entry.id, {
    affected_files: ["agent/src/main.rs", "api/src/routes/agent.ts"],
    tags: ["machine-heartbeat", "retry-policy"],
    next_steps: "Confirm the API retry contract before locking timings.",
  });

  assert.equal(amended.revision, 2);
  assert.deepEqual(amended.tags, ["machine-heartbeat", "retry-policy"]);
  assert.equal(amended.next_steps, "Confirm the API retry contract before locking timings.");

  const updated = await updateLogStatus(paths, entry.id, "Blocked");
  const entries = await readLogEntries(paths);

  assert.equal(updated.status, "Blocked");
  assert.equal(updated.revision, 3);
  assert.equal(entries[0]?.status, "Blocked");
});

test("plain-text log formatting escapes multiline field spoofing and shows work ids", () => {
  const output = formatLogEntries([
    {
      id: "a91K2x",
      work_id: "b37MqD",
      timestamp: "2026-03-26T00:00:00.000Z",
      summary: "Did something useful.\n  Files: injected",
      status: "Done",
      change_type: "bugfix",
      affected_files: ["src/auth.ts"],
      tags: ["tag-a\nStatus: fake"],
      next_steps: "Check follow-up.\n  Blockers: injected",
      blockers: "none",
      related_log_ids: ["rel-1\nSummary: fake"],
      revision: 1,
      created_at: "2026-03-26T00:00:00.000Z",
      updated_at: "2026-03-26T00:00:00.000Z",
    },
  ]);

  assert.ok(output.includes("Summary: Did something useful.\\n  Files: injected"));
  assert.ok(output.includes("Work: b37MqD"));
  assert.ok(output.includes("Tags: tag-a\\nStatus: fake"));
  assert.ok(output.includes("Next steps: Check follow-up.\\n  Blockers: injected"));
  assert.ok(output.includes("Related logs: rel-1\\nSummary: fake"));
});

test("readLogEntries falls back when legacy logs contain an unsupported change_type", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "tasklog-mcp-"));
  const paths = resolveLogbookPaths(projectRoot);

  await writeFile(
    paths.legacyJsonPath,
    `${JSON.stringify([
      {
        id: "log-legacy-release",
        timestamp: "2026-03-26T13:14:56.000Z",
        summary: "Legacy release entry from an older or manually edited log.",
        status: "Done",
        change_type: "release",
        affected_files: ["CodeWebway/Cargo.toml"],
      },
    ])}\n`,
    "utf8",
  );

  const entries = await readLogEntries(paths);

  assert.equal(entries.length, 1);
  assert.equal(entries[0]?.change_type, "investigation");
  assert.equal(entries[0]?.summary, "Legacy release entry from an older or manually edited log.");

  const appended = await appendLogEntry(paths, {
    summary: "Subsequent writes still use strict allowed change types.",
    status: "Done",
    change_type: "bugfix",
    affected_files: ["src/logbook.ts"],
  });

  assert.match(appended.id, /^[0-9A-Za-z]{6}$/);
  assert.equal(appended.change_type, "bugfix");
});

test("listWorks returns compact work summaries", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "tasklog-mcp-"));
  const paths = resolveLogbookPaths(projectRoot);
  const work = await startWork(paths, {
    title: "Work-first migration",
    summary: "Move from log-first to work-first context recovery.",
    tags: ["work-first"],
  });

  await appendLogEntry(paths, {
    summary: "Added the first work-discovery tool.",
    status: "Done",
    change_type: "feature",
    affected_files: ["src/index.ts"],
    work_id: work.work_id,
    next_steps: "Add plan and spec creation tools.",
  });

  const works = await listWorks(paths, { status: "open", limit: 5 });

  assert.equal(works.length, 1);
  assert.equal(works[0]?.work_id, work.work_id);
  assert.equal(works[0]?.context_mode, "active");
  assert.equal(works[0]?.last_log_summary, "Added the first work-discovery tool.");
  assert.equal(works[0]?.next_step_summary, "Add plan and spec creation tools.");
});

test("listWorks supports exact tag and impact filters for lightweight triage", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "tasklog-mcp-"));
  const paths = resolveLogbookPaths(projectRoot);
  const criticalOps = await startWork(paths, {
    title: "Restore agent heartbeat",
    impact: "critical",
    tags: ["ops", "incident"],
  });
  const highOps = await startWork(paths, {
    title: "Document ops fallback",
    impact: "high",
    tags: ["ops"],
  });
  await startWork(paths, {
    title: "Refresh docs examples",
    impact: "low",
    tags: ["docs"],
  });

  await setWorkStatus(paths, highOps.work_id, "done");

  const openCritical = await listWorks(paths, {
    status: "open",
    impact: "critical",
    limit: 10,
  });
  const opsTagged = await listWorks(paths, {
    status: "all",
    tag: "OPS",
    limit: 10,
  });

  assert.deepEqual(openCritical.map((work) => work.work_id), [criticalOps.work_id]);
  assert.deepEqual(opsTagged.map((work) => work.work_id), [highOps.work_id, criticalOps.work_id]);
});

test("listWorks can sort by impact for active-work triage", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "tasklog-mcp-"));
  const paths = resolveLogbookPaths(projectRoot);
  const low = await startWork(paths, {
    title: "Polish wording",
    impact: "low",
  });
  const critical = await startWork(paths, {
    title: "Fix production outage",
    impact: "critical",
  });
  const high = await startWork(paths, {
    title: "Stabilize deploy pipeline",
    impact: "high",
  });

  const descending = await listWorks(paths, {
    status: "open",
    sort_by: "impact",
    sort_order: "desc",
    limit: 10,
  });
  const ascending = await listWorks(paths, {
    status: "open",
    sort_by: "impact",
    sort_order: "asc",
    limit: 10,
  });

  assert.deepEqual(descending.map((work) => work.work_id), [critical.work_id, high.work_id, low.work_id]);
  assert.deepEqual(ascending.map((work) => work.work_id), [low.work_id, high.work_id, critical.work_id]);
});

test("listWorks applies sort_order consistently for impact ties and missing impact", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "tasklog-mcp-"));
  const paths = resolveLogbookPaths(projectRoot);
  const firstHigh = await startWork(paths, {
    title: "Earlier high priority task",
    impact: "high",
  });
  const secondHigh = await startWork(paths, {
    title: "Later high priority task",
    impact: "high",
  });
  const noImpact = await startWork(paths, {
    title: "Unranked backlog cleanup",
  });

  const descending = await listWorks(paths, {
    status: "open",
    sort_by: "impact",
    sort_order: "desc",
    limit: 10,
  });
  const ascending = await listWorks(paths, {
    status: "open",
    sort_by: "impact",
    sort_order: "asc",
    limit: 10,
  });

  assert.deepEqual(descending.map((work) => work.work_id), [secondHigh.work_id, firstHigh.work_id, noImpact.work_id]);
  assert.deepEqual(ascending.map((work) => work.work_id), [noImpact.work_id, firstHigh.work_id, secondHigh.work_id]);
});

test("work impact persists and can be updated explicitly", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "tasklog-mcp-"));
  const paths = resolveLogbookPaths(projectRoot);
  const work = await startWork(paths, {
    title: "High impact auth contract work",
    impact: "high",
  });

  assert.equal(work.impact, "high");

  const updated = await setWorkImpact(paths, work.work_id, "critical");
  const works = await listWorks(paths, { status: "all", limit: 10 });

  assert.equal(updated.impact, "critical");
  assert.equal(works[0]?.impact, "critical");
});

test("readWorkContext distinguishes closed raw work from consolidated work", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "tasklog-mcp-"));
  const paths = resolveLogbookPaths(projectRoot);
  const work = await startWork(paths, {
    title: "Closed work summary flow",
    impact: "high",
  });

  await setWorkStatus(paths, work.work_id, "done");
  const closedRaw = await readWorkContext(paths, work.work_id);

  assert.equal(closedRaw.context_mode, "closed/raw");
  assert.equal(closedRaw.artifact_availability.summary, false);
  assert.equal(closedRaw.summary_text, undefined);
  assert.equal(closedRaw.work_state.authority.status, "weak");
  assert.equal(closedRaw.work_state.readiness.mode, "revalidate");
  assert.equal(closedRaw.work_state.next_valid_action.kind, "inspect_logs");
});

test("readWorkContext remaps authored resume capsules into work_state", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "tasklog-mcp-"));
  const paths = resolveLogbookPaths(projectRoot);
  const work = await startWork(paths, {
    title: "Authored resumptive handoff",
    impact: "high",
  });

  await appendLogEntry(paths, {
    summary: "Recorded a correctness-first handoff capsule.",
    status: "Blocked",
    change_type: "investigation",
    affected_files: ["src/logbook.ts"],
    work_id: work.work_id,
    blockers: "Need the product decision on summary-doc authority.",
    resume_capsule: {
      current_work: work.work_id,
      governing_source: ["work_record", "latest_log", "plan_doc"],
      authority_reason: "The work record, latest log, and plan doc still agree on the active scope.",
      readiness: "ask",
      next_valid_action: "Ask for the product decision on summary-doc authority before changing the contract.",
      blocking_or_missing_fact: "Need the product decision on summary-doc authority.",
    },
  });

  const briefContext = await readWorkContext(paths, work.work_id, { surface: "brief" });
  const fullContext = await readWorkContext(paths, work.work_id);

  assert.equal(briefContext.resume_capsule?.readiness, "ask");
  assert.deepEqual(briefContext.resume_capsule?.governing_source, ["work_record", "latest_log", "plan_doc"]);
  assert.equal(briefContext.work_state.authority.status, "clear");
  assert.deepEqual(briefContext.work_state.authority.basis, ["work_record", "latest_log", "plan_doc"]);
  assert.equal(briefContext.work_state.readiness.mode, "ask");
  assert.equal(
    briefContext.work_state.next_valid_action.summary,
    "Ask for the product decision on summary-doc authority before changing the contract.",
  );
  assert.equal(fullContext.work_state.readiness.mode, "ask");
  assert.equal(fullContext.work_state.next_valid_action.kind, "clarify");
});

test("readWorkContext maps blocked work to wait when authority is clear", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "tasklog-mcp-"));
  const paths = resolveLogbookPaths(projectRoot);
  const work = await startWork(paths, {
    title: "Blocked review gate",
  });

  await setWorkStatus(paths, work.work_id, "blocked");
  await appendLogEntry(paths, {
    summary: "Paused for review approval.",
    status: "Blocked",
    change_type: "investigation",
    affected_files: ["src/index.ts"],
    work_id: work.work_id,
    blockers: "Waiting for review approval from the maintainer.",
  });

  const context = await readWorkContext(paths, work.work_id);

  assert.equal(context.work_state.authority.status, "clear");
  assert.equal(context.work_state.readiness.mode, "wait");
  assert.equal(context.work_state.next_valid_action.kind, "wait_for_unblock");
  assert.match(context.work_state.next_valid_action.summary, /Waiting for review approval/);
});

test("summary workdocs mark a done work as closed/consolidated and keep summary loading opt-in", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "tasklog-mcp-"));
  const paths = resolveLogbookPaths(projectRoot);
  const activeWork = await startWork(paths, {
    title: "Closed work summary creation",
    impact: "critical",
  });

  await assert.rejects(
    () =>
      createWorkDoc(paths, "summary", {
        work_id: activeWork.work_id,
      }),
    /summary\.md is only available for work items whose status is done/,
  );

  await setWorkStatus(paths, activeWork.work_id, "done");
  await appendLogEntry(paths, {
    summary: "Captured the final session handoff before consolidation.",
    status: "Done",
    change_type: "docs",
    affected_files: ["workdocs/summary.md"],
    work_id: activeWork.work_id,
    next_steps: "This raw handoff should stay secondary once summary.md exists.",
  });
  const summaryDoc = await createWorkDoc(paths, "summary", {
    work_id: activeWork.work_id,
  });
  await writeFile(
    summaryDoc.path,
    [
      "---",
      `work_id: '${activeWork.work_id}'`,
      `title: '${activeWork.title}'`,
      "status: 'done'",
      "impact: 'critical'",
      `start_dir: '${activeWork.start_dir}'`,
      "scope_paths:",
      `  - '${activeWork.start_dir}'`,
      `updated_at: '${activeWork.updated_at}'`,
      "---",
      "",
      "# Work Summary",
      "",
      "## What was this work?",
      "",
      "Captured a canonical re-entry brief.",
      "",
    ].join("\n"),
    "utf8",
  );

  const context = await readWorkContext(paths, activeWork.work_id);
  const loadedContext = await readWorkContext(paths, activeWork.work_id, {
    include_summary: true,
  });
  const evidenceContext = await readWorkContext(paths, activeWork.work_id, {
    include_recent_logs: true,
  });
  const compactContext = await readWorkContext(paths, activeWork.work_id, {
    compact: true,
  });
  const works = await listWorks(paths, { status: "done", limit: 10 });

  assert.equal(summaryDoc.created, true);
  assert.equal(context.context_mode, "closed/consolidated");
  assert.equal(context.artifact_availability.summary, true);
  assert.equal(context.artifact_paths.summaryPath, summaryDoc.path);
  assert.equal(context.next_step_summary, undefined);
  assert.equal(context.summary_text, undefined);
  assert.equal(context.recent_log_count, 1);
  assert.equal(context.work_state.readiness.mode, "done");
  assert.equal(context.work_state.next_valid_action.kind, "review_summary");
  assert.deepEqual(context.recent_logs, []);
  assert.match(loadedContext.summary_text ?? "", /Captured a canonical re-entry brief/);
  assert.equal(evidenceContext.recent_log_count, 1);
  assert.equal(evidenceContext.recent_logs.length, 1);
  assert.equal(compactContext.reentry_brief?.title, activeWork.title);
  assert.equal(compactContext.reentry_brief?.status, "done");
  assert.equal(compactContext.reentry_brief?.latest_log_summary, "Captured the final session handoff before consolidation.");
  assert.equal(compactContext.reentry_brief?.next_step_summary, "");
  assert.ok(compactContext.reentry_brief?.artifact_files.includes("summary.md"));
  assert.equal(works[0]?.context_mode, "closed/consolidated");
  assert.equal(works[0]?.artifact_availability.summary, true);
  assert.equal(works[0]?.next_step_summary, undefined);
});

test("create summary doc seeds canonical resumptive state and closed reads prefer it", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "tasklog-mcp-"));
  const paths = resolveLogbookPaths(projectRoot);
  const work = await startWork(paths, {
    title: "Canonical summary carrier",
    impact: "critical",
  });

  await setWorkStatus(paths, work.work_id, "done");
  await appendLogEntry(paths, {
    summary: "Recorded the final implementation handoff before consolidation.",
    status: "Done",
    change_type: "docs",
    affected_files: ["src/index.ts"],
    work_id: work.work_id,
    resume_capsule: {
      current_work: work.work_id,
      governing_source: ["work_record", "latest_log"],
      authority_reason: "The work record and final handoff log agree.",
      readiness: "revalidate",
      next_valid_action: "Revalidate the final state before closure.",
      verification_target: "Confirm the final review results and release notes.",
    },
  });

  const summaryDoc = await createWorkDoc(paths, "summary", { work_id: work.work_id });
  const summaryText = await readFile(summaryDoc.path, "utf8");
  const context = await readWorkContext(paths, work.work_id);

  assert.match(summaryText, new RegExp(`resume_current_work: '${work.work_id}'`));
  assert.match(summaryText, /resume_readiness: 'done'/);
  assert.match(summaryText, /resume_governing_source:\n  - 'summary_doc'/);
  assert.equal(context.context_mode, "closed/consolidated");
  assert.equal(context.resume_capsule?.readiness, "done");
  assert.ok(context.resume_capsule?.governing_source.includes("summary_doc"));
  assert.equal(context.work_state.readiness.mode, "done");
  assert.equal(context.work_state.next_valid_action.kind, "review_summary");
});
