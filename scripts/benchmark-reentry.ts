import path from "node:path";
import { promises as fs } from "node:fs";

import {
  getActiveContext,
  listWorks,
  readLogEntries,
  readWorkContext,
  readWorkRecords,
  resolveLogbookPaths,
  resumeWork,
  type LogbookPaths,
  type SessionLogEntry,
  type WorkListEntry,
  type WorkRecord,
} from "../src/logbook.js";

const ARTIFACT_FILES = ["design.md", "plan.md", "spec.md", "summary.md", "notes.md"] as const;
const OPEN_WORK_PREVIEW_COUNT = 3;

interface SurfaceMetrics {
  files: number;
  bytes: number;
  lines: number;
  estTokens: number;
}

interface CheckExpectation {
  label: string;
  expected: string;
}

interface CheckResult extends CheckExpectation {
  passed: boolean;
}

interface AnswerFieldResult {
  label: string;
  expected: string;
  actual: string;
  passed: boolean;
}

interface StrategyRun {
  strategy: string;
  elapsedMs: number;
  metrics: SurfaceMetrics;
  checks: CheckResult[];
  answerFields?: AnswerFieldResult[];
  extra?: Record<string, number | string>;
}

interface CliOptions {
  projectRoot: string;
  workIds: string[];
  limit: number;
}

function parseArgs(argv: string[]): CliOptions {
  const workIds: string[] = [];
  let projectRoot = process.cwd();
  let limit = 10;

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current === "--project-root") {
      projectRoot = argv[index + 1] ?? projectRoot;
      index += 1;
      continue;
    }
    if (current === "--work-id") {
      const workId = argv[index + 1];
      if (workId) {
        workIds.push(workId);
      }
      index += 1;
      continue;
    }
    if (current === "--limit") {
      const parsed = Number.parseInt(argv[index + 1] ?? "", 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        limit = parsed;
      }
      index += 1;
    }
  }

  return { projectRoot: path.resolve(projectRoot), workIds, limit };
}

function metricFromText(text: string): SurfaceMetrics {
  const bytes = Buffer.byteLength(text, "utf8");
  const lines = text.length === 0 ? 0 : text.split(/\r?\n/).length;
  return {
    files: 1,
    bytes,
    lines,
    estTokens: Math.ceil(bytes / 4),
  };
}

function combineMetrics(metrics: SurfaceMetrics[]): SurfaceMetrics {
  return metrics.reduce<SurfaceMetrics>(
    (accumulator, item) => ({
      files: accumulator.files + item.files,
      bytes: accumulator.bytes + item.bytes,
      lines: accumulator.lines + item.lines,
      estTokens: accumulator.estTokens + item.estTokens,
    }),
    { files: 0, bytes: 0, lines: 0, estTokens: 0 },
  );
}

async function readTextFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, "utf8");
}

async function loadRawFiles(filePaths: string[]): Promise<{ text: string; metrics: SurfaceMetrics }> {
  const texts = await Promise.all(filePaths.map(async (filePath) => {
    const text = await readTextFile(filePath);
    return `FILE: ${filePath}\n${text}`;
  }));
  const metrics = combineMetrics(texts.map((text) => metricFromText(text)));
  return {
    text: texts.join("\n"),
    metrics: { ...metrics, files: filePaths.length },
  };
}

async function timed(
  fn: () => Promise<{
    text: string;
    metrics?: SurfaceMetrics;
    extra?: Record<string, number | string>;
    checks: CheckExpectation[];
    answerFields?: AnswerFieldResult[];
  }>,
): Promise<StrategyRun> {
  const start = process.hrtime.bigint();
  const output = await fn();
  const elapsedMs = Number(process.hrtime.bigint() - start) / 1_000_000;
  return {
    elapsedMs,
    strategy: "",
    metrics: output.metrics ?? metricFromText(output.text),
    checks: evaluateChecks(output.text, output.checks),
    answerFields: output.answerFields,
    extra: output.extra,
  };
}

function normalizeForMatch(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

function evaluateChecks(text: string, checks: CheckExpectation[]): CheckResult[] {
  const normalizedText = normalizeForMatch(text);
  return checks.map((check) => ({
    ...check,
    passed: normalizedText.includes(normalizeForMatch(check.expected)),
  }));
}

function passedChecks(run: StrategyRun): number {
  return run.checks.filter((check) => check.passed).length;
}

function passedAnswerFields(run: StrategyRun): number {
  return run.answerFields?.filter((field) => field.passed).length ?? 0;
}

function coveragePercent(run: StrategyRun): number {
  if (run.checks.length === 0) {
    return 100;
  }
  return (passedChecks(run) / run.checks.length) * 100;
}

function answerAccuracyPercent(run: StrategyRun): number | null {
  if (!run.answerFields || run.answerFields.length === 0) {
    return null;
  }
  return (passedAnswerFields(run) / run.answerFields.length) * 100;
}

function bytesPerPassedCheck(run: StrategyRun): number | null {
  const passed = passedChecks(run);
  if (passed === 0) {
    return null;
  }
  return run.metrics.bytes / passed;
}

function artifactFilePaths(paths: LogbookPaths, work: WorkRecord): string[] {
  const workDir = path.join(paths.workdocsRoot, `${work.work_id}-${work.slug}`);
  return ARTIFACT_FILES.map((fileName) => path.join(workDir, fileName));
}

async function existingArtifactFilePaths(paths: LogbookPaths, work: WorkRecord): Promise<string[]> {
  const candidates = artifactFilePaths(paths, work);
  const stats = await Promise.all(candidates.map(async (candidate) => {
    try {
      const stat = await fs.stat(candidate);
      return stat.isFile() ? candidate : null;
    } catch {
      return null;
    }
  }));
  return stats.filter((candidate): candidate is string => candidate !== null);
}

function latestLog(logs: SessionLogEntry[]): SessionLogEntry | undefined {
  return logs.at(-1);
}

function latestNextStep(logs: SessionLogEntry[]): string | undefined {
  return [...logs].reverse().find((entry) => entry.next_steps)?.next_steps;
}

interface ActiveContextRecord {
  active_work_id?: string;
  updated_at?: string;
  project_root?: string;
}

async function readActiveContextRecordRaw(paths: LogbookPaths): Promise<ActiveContextRecord> {
  try {
    return JSON.parse(await readTextFile(paths.activeContextPath)) as ActiveContextRecord;
  } catch {
    return {};
  }
}

function buildOpenWorksRaw(works: WorkRecord[], logs: SessionLogEntry[], limit: number): WorkRecord[] {
  return works
    .filter((work) => work.status === "active" || work.status === "blocked")
    .sort((left, right) => right.updated_at.localeCompare(left.updated_at))
    .slice(0, limit);
}

interface OpenDiscoveryAnswer {
  active_work_id: string;
  active_work_title: string;
  open_work_ids: string[];
  open_work_titles: string[];
  open_work_next_steps: string[];
}

interface WorkReentryAnswer {
  work_id: string;
  title: string;
  status: string;
  start_dir: string;
  scope_paths: string[];
  latest_log_summary: string;
  next_step_summary: string;
  artifact_files: string[];
}

function normalizeOptional(value: string | undefined): string {
  return value ?? "";
}

function compareScalarField(label: string, expected: string, actual: string): AnswerFieldResult {
  return {
    label,
    expected,
    actual,
    passed: normalizeForMatch(expected) === normalizeForMatch(actual),
  };
}

function compareListField(label: string, expected: string[], actual: string[]): AnswerFieldResult {
  return {
    label,
    expected: expected.join(" | "),
    actual: actual.join(" | "),
    passed: expected.length === actual.length && expected.every((item, index) =>
      normalizeForMatch(item) === normalizeForMatch(actual[index] ?? "")),
  };
}

function compareOpenDiscoveryAnswers(expected: OpenDiscoveryAnswer, actual: OpenDiscoveryAnswer): AnswerFieldResult[] {
  return [
    compareScalarField("active_work_id", expected.active_work_id, actual.active_work_id),
    compareScalarField("active_work_title", expected.active_work_title, actual.active_work_title),
    compareListField("open_work_ids", expected.open_work_ids, actual.open_work_ids),
    compareListField("open_work_titles", expected.open_work_titles, actual.open_work_titles),
    compareListField("open_work_next_steps", expected.open_work_next_steps, actual.open_work_next_steps),
  ];
}

function compareWorkReentryAnswers(expected: WorkReentryAnswer, actual: WorkReentryAnswer): AnswerFieldResult[] {
  return [
    compareScalarField("work_id", expected.work_id, actual.work_id),
    compareScalarField("title", expected.title, actual.title),
    compareScalarField("status", expected.status, actual.status),
    compareScalarField("start_dir", expected.start_dir, actual.start_dir),
    compareListField("scope_paths", expected.scope_paths, actual.scope_paths),
    compareScalarField("latest_log_summary", expected.latest_log_summary, actual.latest_log_summary),
    compareScalarField("next_step_summary", expected.next_step_summary, actual.next_step_summary),
    compareListField("artifact_files", expected.artifact_files, actual.artifact_files),
  ];
}

async function buildOpenDiscoveryGroundTruth(paths: LogbookPaths, limit: number): Promise<{
  checks: CheckExpectation[];
  answer: OpenDiscoveryAnswer;
}> {
  const [activeContextRecord, works, logs] = await Promise.all([
    readActiveContextRecordRaw(paths),
    readWorkRecords(paths),
    readLogEntries(paths),
  ]);
  const openWorks = buildOpenWorksRaw(works, logs, limit);
  const activeWork = works.find((work) => work.work_id === activeContextRecord.active_work_id);
  const preview = openWorks.slice(0, Math.min(OPEN_WORK_PREVIEW_COUNT, openWorks.length));

  const answer: OpenDiscoveryAnswer = {
    active_work_id: activeWork?.work_id ?? "",
    active_work_title: activeWork?.title ?? "",
    open_work_ids: preview.map((work) => work.work_id),
    open_work_titles: preview.map((work) => work.title),
    open_work_next_steps: preview.map((work) => normalizeOptional(latestNextStep(logs.filter((entry) => entry.work_id === work.work_id)))),
  };

  const checks: CheckExpectation[] = [];
  if (answer.active_work_id) {
    checks.push({ label: "active_work_id", expected: answer.active_work_id });
  }
  if (answer.active_work_title) {
    checks.push({ label: "active_work_title", expected: answer.active_work_title });
  }

  for (const [index, work] of preview.entries()) {
    checks.push({ label: `open_${index + 1}_work_id`, expected: work.work_id });
    checks.push({ label: `open_${index + 1}_work_title`, expected: work.title });
    const nextStep = answer.open_work_next_steps[index];
    if (nextStep) {
      checks.push({ label: `open_${index + 1}_next_step`, expected: nextStep });
    }
  }

  return { checks, answer };
}

function buildOpenDiscoveryAnswerFromTasklog(activeContext: Awaited<ReturnType<typeof getActiveContext>>, works: WorkListEntry[]): OpenDiscoveryAnswer {
  const preview = works.slice(0, Math.min(OPEN_WORK_PREVIEW_COUNT, works.length));
  return {
    active_work_id: activeContext.active_work?.work_id ?? "",
    active_work_title: activeContext.active_work?.title ?? "",
    open_work_ids: preview.map((work) => work.work_id),
    open_work_titles: preview.map((work) => work.title),
    open_work_next_steps: preview.map((work) => normalizeOptional(work.next_step_summary)),
  };
}

function buildOpenDiscoveryAnswerFromJson(works: WorkRecord[], logs: SessionLogEntry[], activeContextRecord: ActiveContextRecord, limit: number): OpenDiscoveryAnswer {
  const openWorks = buildOpenWorksRaw(works, logs, limit);
  const preview = openWorks.slice(0, Math.min(OPEN_WORK_PREVIEW_COUNT, openWorks.length));
  const activeWork = works.find((work) => work.work_id === activeContextRecord.active_work_id);
  return {
    active_work_id: activeWork?.work_id ?? "",
    active_work_title: activeWork?.title ?? "",
    open_work_ids: preview.map((work) => work.work_id),
    open_work_titles: preview.map((work) => work.title),
    open_work_next_steps: preview.map((work) => normalizeOptional(latestNextStep(logs.filter((entry) => entry.work_id === work.work_id)))),
  };
}

async function buildOpenWorkDiscoveryChecks(paths: LogbookPaths, limit: number): Promise<{
  checks: CheckExpectation[];
  answer: OpenDiscoveryAnswer;
}> {
  return buildOpenDiscoveryGroundTruth(paths, limit);
}

async function benchmarkOpenWorks(paths: LogbookPaths, limit: number): Promise<StrategyRun[]> {
  const { checks, answer: expectedAnswer } = await buildOpenWorkDiscoveryChecks(paths, limit);

  const notebook = await timed(async () => {
    const loaded = await loadRawFiles([paths.markdownPath]);
    return {
      text: loaded.text,
      metrics: loaded.metrics,
      checks,
      extra: { toolCalls: 0 },
    };
  });

  const jsonScan = await timed(async () => {
    const loaded = await loadRawFiles([paths.activeContextPath, paths.worksPath, paths.jsonPath]);
    const [works, logs, activeContextRecord] = await Promise.all([
      readWorkRecords(paths),
      readLogEntries(paths),
      readActiveContextRecordRaw(paths),
    ]);
    const openWorks = works.filter((work) => work.status === "active" || work.status === "blocked");
    const actualAnswer = buildOpenDiscoveryAnswerFromJson(works, logs, activeContextRecord, limit);
    return {
      text: loaded.text,
      metrics: loaded.metrics,
      checks,
      answerFields: compareOpenDiscoveryAnswers(expectedAnswer, actualAnswer),
      extra: { openWorkCount: openWorks.length, toolCalls: 0 },
    };
  });

  const tasklog = await timed(async () => {
    const [activeContext, works] = await Promise.all([
      getActiveContext(paths),
      listWorks(paths, { status: "open", limit }),
    ]);
    const text = JSON.stringify({ activeContext, works }, null, 2);
    const actualAnswer = buildOpenDiscoveryAnswerFromTasklog(activeContext, works);
    return {
      text,
      checks,
      answerFields: compareOpenDiscoveryAnswers(expectedAnswer, actualAnswer),
      extra: { openWorkCount: works.length, toolCalls: 2 },
    };
  });

  notebook.strategy = "markdown_notebook_scan";
  jsonScan.strategy = "json_state_scan";
  tasklog.strategy = "tasklog_get_active_plus_list_works";

  return [notebook, jsonScan, tasklog];
}

async function withActiveContextRestored<T>(paths: LogbookPaths, fn: () => Promise<T>): Promise<T> {
  let original: string | undefined;
  try {
    original = await readTextFile(paths.activeContextPath);
  } catch {
    original = undefined;
  }

  try {
    return await fn();
  } finally {
    if (original === undefined) {
      await fs.rm(paths.activeContextPath, { force: true });
    } else {
      await fs.writeFile(paths.activeContextPath, original, "utf8");
    }
  }
}

async function buildWorkReentryChecks(paths: LogbookPaths, work: WorkRecord): Promise<CheckExpectation[]> {
  const logs = await readLogEntries(paths);
  const logsForWork = logs.filter((entry) => entry.work_id === work.work_id);
  const checks: CheckExpectation[] = [
    { label: "work_id", expected: work.work_id },
    { label: "title", expected: work.title },
    { label: "status", expected: work.status },
    { label: "start_dir", expected: work.start_dir },
  ];

  for (const [index, scopePath] of work.scope_paths.entries()) {
    checks.push({ label: `scope_path_${index + 1}`, expected: scopePath });
  }

  const latest = latestLog(logsForWork);
  if (latest?.summary) {
    checks.push({ label: "latest_log_summary", expected: latest.summary });
  }

  const nextStep = latestNextStep(logsForWork);
  if (nextStep) {
    checks.push({ label: "next_step_summary", expected: nextStep });
  }

  const artifactPaths = await existingArtifactFilePaths(paths, work);
  for (const artifactPath of artifactPaths) {
    checks.push({ label: `artifact_${path.basename(artifactPath)}`, expected: path.basename(artifactPath) });
  }

  return checks;
}

async function buildWorkReentryGroundTruth(paths: LogbookPaths, work: WorkRecord): Promise<{
  checks: CheckExpectation[];
  answer: WorkReentryAnswer;
}> {
  const logs = await readLogEntries(paths);
  const logsForWork = logs.filter((entry) => entry.work_id === work.work_id);
  const latest = latestLog(logsForWork);
  const nextStep = latestNextStep(logsForWork);
  const artifactPaths = await existingArtifactFilePaths(paths, work);
  const checks = await buildWorkReentryChecks(paths, work);
  return {
    checks,
    answer: {
      work_id: work.work_id,
      title: work.title,
      status: work.status,
      start_dir: work.start_dir,
      scope_paths: work.scope_paths,
      latest_log_summary: normalizeOptional(latest?.summary),
      next_step_summary: normalizeOptional(nextStep),
      artifact_files: artifactPaths.map((artifactPath) => path.basename(artifactPath)),
    },
  };
}

function buildWorkReentryAnswerFromJson(work: WorkRecord, logsForWork: SessionLogEntry[], artifactPaths: string[]): WorkReentryAnswer {
  return {
    work_id: work.work_id,
    title: work.title,
    status: work.status,
    start_dir: work.start_dir,
    scope_paths: work.scope_paths,
    latest_log_summary: normalizeOptional(latestLog(logsForWork)?.summary),
    next_step_summary: normalizeOptional(latestNextStep(logsForWork)),
    artifact_files: artifactPaths.map((artifactPath) => path.basename(artifactPath)),
  };
}

async function benchmarkWorkReentry(paths: LogbookPaths, work: WorkRecord): Promise<StrategyRun[]> {
  const artifactPaths = await existingArtifactFilePaths(paths, work);
  const notebookPaths = [paths.markdownPath, ...artifactPaths];
  const jsonPaths = [paths.worksPath, paths.jsonPath, ...artifactPaths];
  const logs = await readLogEntries(paths);
  const logsForWork = logs.filter((entry) => entry.work_id === work.work_id);
  const { checks, answer: expectedAnswer } = await buildWorkReentryGroundTruth(paths, work);

  const notebook = await timed(async () => {
    const loaded = await loadRawFiles(notebookPaths);
    return {
      text: loaded.text,
      metrics: loaded.metrics,
      checks,
      extra: { workLogCount: logsForWork.length, artifactFileCount: artifactPaths.length, toolCalls: 0 },
    };
  });

  const jsonScan = await timed(async () => {
    const loaded = await loadRawFiles(jsonPaths);
    const actualAnswer = buildWorkReentryAnswerFromJson(work, logsForWork, artifactPaths);
    return {
      text: loaded.text,
      metrics: loaded.metrics,
      checks,
      answerFields: compareWorkReentryAnswers(expectedAnswer, actualAnswer),
      extra: { workLogCount: logsForWork.length, artifactFileCount: artifactPaths.length, toolCalls: 0 },
    };
  });

  const tasklog = await timed(async () => withActiveContextRestored(paths, async () => {
    const [activeContext, workContext] = await Promise.all([
      resumeWork(paths, { work_id: work.work_id }),
      readWorkContext(paths, work.work_id),
    ]);
    const text = JSON.stringify({ activeContext, workContext }, null, 2);
    const actualAnswer: WorkReentryAnswer = {
      work_id: workContext.work.work_id,
      title: workContext.work.title,
      status: workContext.work.status,
      start_dir: workContext.work.start_dir,
      scope_paths: workContext.work.scope_paths,
      latest_log_summary: normalizeOptional(workContext.recent_logs.at(0)?.summary ?? latestLog(logsForWork)?.summary),
      next_step_summary: normalizeOptional(workContext.next_step_summary),
      artifact_files: ARTIFACT_FILES.filter((fileName) => {
        const key = fileName.replace(".md", "") as keyof typeof workContext.artifact_availability;
        return Boolean(workContext.artifact_availability[key]);
      }),
    };
    return {
      text,
      checks,
      answerFields: compareWorkReentryAnswers(expectedAnswer, actualAnswer),
      extra: {
        workLogCount: workContext.recent_log_count,
        artifactFileCount: artifactPaths.length,
        toolCalls: 2,
      },
    };
  }));

  notebook.strategy = "markdown_notebook_scan";
  jsonScan.strategy = "json_state_scan";
  tasklog.strategy = "tasklog_resume_plus_read_work_context";

  return [notebook, jsonScan, tasklog];
}

function formatNumber(value: number): string {
  if (Number.isInteger(value)) {
    return value.toString();
  }
  return value.toFixed(2);
}

function describeReduction(baseline: StrategyRun, candidate: StrategyRun): string {
  const byteReduction = ((baseline.metrics.bytes - candidate.metrics.bytes) / baseline.metrics.bytes) * 100;
  const lineReduction = ((baseline.metrics.lines - candidate.metrics.lines) / baseline.metrics.lines) * 100;
  const tokenReduction = ((baseline.metrics.estTokens - candidate.metrics.estTokens) / baseline.metrics.estTokens) * 100;
  return `vs ${baseline.strategy}: ${formatNumber(byteReduction)}% fewer bytes, ${formatNumber(lineReduction)}% fewer lines, ${formatNumber(tokenReduction)}% fewer est. tokens`;
}

function missingCheckLabels(run: StrategyRun): string {
  const missing = run.checks.filter((check) => !check.passed).map((check) => check.label);
  return missing.length > 0 ? missing.join(", ") : "none";
}

function bestCoverage(runs: StrategyRun[]): number {
  return Math.max(...runs.map((run) => coveragePercent(run)));
}

function bestAccuracy(runs: StrategyRun[]): number | null {
  const accuracies = runs
    .map((run) => answerAccuracyPercent(run))
    .filter((value): value is number => value !== null);
  if (accuracies.length === 0) {
    return null;
  }
  return Math.max(...accuracies);
}

function printScenario(title: string, prompt: string, runs: StrategyRun[]): void {
  console.log(`\n## ${title}\n`);
  console.log(`Prompt: ${prompt}\n`);
  console.log("| Strategy | Checks | Coverage | Answer Accuracy | Surface files | Surface bytes | Surface lines | Est. tokens | Bytes / passed check | Wall ms | Missing checks | Notes |");
  console.log("| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |");
  for (const run of runs) {
    const notes = Object.entries(run.extra ?? {})
      .map(([key, value]) => `${key}=${value}`)
      .join(", ");
    const bytesPerCheck = bytesPerPassedCheck(run);
    const answerAccuracy = answerAccuracyPercent(run);
    console.log(
      `| ${run.strategy} | ${passedChecks(run)}/${run.checks.length} | ${formatNumber(coveragePercent(run))}% | ${answerAccuracy === null ? "n/a" : `${formatNumber(answerAccuracy)}% (${passedAnswerFields(run)}/${run.answerFields?.length ?? 0})`} | ${run.metrics.files} | ${run.metrics.bytes} | ${run.metrics.lines} | ${run.metrics.estTokens} | ${bytesPerCheck === null ? "n/a" : formatNumber(bytesPerCheck)} | ${formatNumber(run.elapsedMs)} | ${missingCheckLabels(run)} | ${notes} |`,
    );
  }

  const baseline = runs[0];
  const tasklogRun = runs.at(-1);
  const strongestCoverage = bestCoverage(runs);
  const strongestAccuracy = bestAccuracy(runs);
  if (baseline && tasklogRun) {
    console.log(`\n- ${describeReduction(baseline, tasklogRun)}`);
    if (coveragePercent(tasklogRun) === strongestCoverage) {
      console.log(`- tasklog path reached the top coverage in this scenario while using ${tasklogRun.metrics.files} surface file(s).`);
    } else {
      console.log(`- tasklog path did not reach the top coverage in this scenario; check missing fields before making broad claims.`);
    }
    const tasklogAccuracy = answerAccuracyPercent(tasklogRun);
    if (strongestAccuracy !== null && tasklogAccuracy !== null) {
      if (tasklogAccuracy === strongestAccuracy) {
        console.log(`- tasklog path also reached the top structured-answer accuracy in this scenario.`);
      } else {
        console.log(`- tasklog path did not reach the top structured-answer accuracy in this scenario.`);
      }
    }
  }
}

async function resolveTargetWorks(paths: LogbookPaths, requestedWorkIds: string[]): Promise<WorkRecord[]> {
  const works = await readWorkRecords(paths);
  if (requestedWorkIds.length > 0) {
    return requestedWorkIds.map((workId) => {
      const match = works.find((work) => work.work_id === workId);
      if (!match) {
        throw new Error(`Unknown work_id: ${workId}`);
      }
      return match;
    });
  }

  const logs = await readLogEntries(paths);
  const ranked = await Promise.all(
    works.map(async (work) => {
      const artifactCount = (await existingArtifactFilePaths(paths, work)).length;
      const logCount = logs.filter((entry) => entry.work_id === work.work_id).length;
      const statusBonus = work.status === "active" ? 25 : work.status === "blocked" ? 10 : 0;
      return {
        work,
        score: artifactCount * 100 + logCount * 10 + statusBonus,
      };
    }),
  );

  ranked.sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }
    return right.work.updated_at.localeCompare(left.work.updated_at);
  });

  return ranked.slice(0, 1).map((item) => item.work);
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const paths = resolveLogbookPaths(options.projectRoot);
  const works = await resolveTargetWorks(paths, options.workIds);

  console.log(`# Tasklog Re-entry Benchmark`);
  console.log("");
  console.log(`- project_root: ${options.projectRoot}`);
  console.log(`- works_in_scope: ${works.map((work) => work.title).join(" | ") || "(none)"}`);
  console.log(`- open_work_limit: ${options.limit}`);
  console.log(`- note: est. tokens use a rough utf8-bytes/4 heuristic; use them as relative context-size estimates, not billing-exact token counts.`);
  console.log(`- note: coverage checks answerability by looking for concrete evidence needed to resume the work, not by running an LLM over the payload.`);

  const openRuns = await benchmarkOpenWorks(paths, options.limit);
  printScenario(
    "Open Work Discovery",
    "I just came back to this workspace. What is still open, what am I actively working on, and what should I look at first?",
    openRuns,
  );

  for (const work of works) {
    const runs = await benchmarkWorkReentry(paths, work);
    printScenario(
      `Work Re-entry (${work.title})`,
      `I am resuming this in-progress system task. What is the work, what is its status and scope, and what should I do next?`,
      runs,
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
