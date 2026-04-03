import path from "node:path";
import { promises as fs } from "node:fs";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";
import os from "node:os";

const execFile = promisify(execFileCallback);

const EXCLUDED_COPY_NAMES = new Set([
  ".git",
  ".tasklog",
  "workdocs",
  "node_modules",
  "dist",
  "target",
  ".next",
  ".turbo",
  "coverage",
]);

interface CliOptions {
  outDir: string;
  fixtureId: string;
  repoSources: string[];
  force: boolean;
  includeGitDir: boolean;
}

interface RepoManifestEntry {
  repo_id: string;
  source_path: string;
  target_path: string;
  source_git_head?: string;
}

interface FixtureManifest {
  version: 1;
  fixture_id: string;
  created_at: string;
  environment_type: "tasklog_benchmark_fixture";
  workspace_root: string;
  contamination_controls: string[];
  state_paths: {
    state_root: string;
    works_file: string;
    session_log_json: string;
    session_log_markdown: string;
    active_context_file: string;
    workdocs_root: string;
  };
  repos: RepoManifestEntry[];
}

function printUsage(): never {
  throw new Error(
    [
      "Usage: npm run bench:env:init -- --out-dir /tmp/tasklog-bench-env [options]",
      "",
      "Options:",
      "  --out-dir PATH         Required. Output directory for the new benchmark environment.",
      "  --fixture-id ID        Optional. Fixture id written into the manifest. Default: benchmark-env.",
      "  --repo-source PATH     Optional and repeatable. Copy one repo snapshot into workspace/repos/.",
      "  --force                Optional. Replace an existing output directory.",
      "  --include-git-dir      Optional. Copy the source .git directory too. Default: false.",
    ].join("\n"),
  );
}

function parseArgs(argv: string[]): CliOptions {
  let outDir = "";
  let fixtureId = "benchmark-env";
  const repoSources: string[] = [];
  let force = false;
  let includeGitDir = false;

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current === "--out-dir") {
      outDir = argv[index + 1] ?? outDir;
      index += 1;
      continue;
    }
    if (current === "--fixture-id") {
      fixtureId = argv[index + 1] ?? fixtureId;
      index += 1;
      continue;
    }
    if (current === "--repo-source") {
      const repoSource = argv[index + 1];
      if (repoSource) {
        repoSources.push(repoSource);
      }
      index += 1;
      continue;
    }
    if (current === "--force") {
      force = true;
      continue;
    }
    if (current === "--include-git-dir") {
      includeGitDir = true;
      continue;
    }
    if (current === "--help" || current === "-h") {
      printUsage();
    }
  }

  if (!outDir) {
    printUsage();
  }

  return {
    outDir: path.resolve(outDir),
    fixtureId,
    repoSources: repoSources.map((value) => path.resolve(value)),
    force,
    includeGitDir,
  };
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function ensureCleanDirectory(targetPath: string, force: boolean): Promise<void> {
  if (await pathExists(targetPath)) {
    if (!force) {
      throw new Error(`Output directory already exists: ${targetPath}. Re-run with --force to replace it.`);
    }
    await fs.rm(targetPath, { recursive: true, force: true });
  }
  await fs.mkdir(targetPath, { recursive: true });
}

function isExcludedCopyPath(sourcePath: string, includeGitDir: boolean): boolean {
  const baseName = path.basename(sourcePath);
  if (baseName === ".git") {
    return !includeGitDir;
  }
  return EXCLUDED_COPY_NAMES.has(baseName);
}

async function copyRepoSnapshot(sourcePath: string, targetPath: string, includeGitDir: boolean): Promise<void> {
  await fs.cp(sourcePath, targetPath, {
    recursive: true,
    filter: (currentSource) => !isExcludedCopyPath(currentSource, includeGitDir),
  });
}

function isPathInside(parentPath: string, childPath: string): boolean {
  const relativePath = path.relative(parentPath, childPath);
  return relativePath.length > 0 && !relativePath.startsWith("..") && !path.isAbsolute(relativePath);
}

async function copyRepoSnapshotSafe(sourcePath: string, targetPath: string, includeGitDir: boolean): Promise<void> {
  if (!isPathInside(sourcePath, targetPath)) {
    await copyRepoSnapshot(sourcePath, targetPath, includeGitDir);
    return;
  }

  const tempSnapshotRoot = await fs.mkdtemp(path.join(os.tmpdir(), "tasklog-benchmark-repo-copy-"));
  const tempSnapshotPath = path.join(tempSnapshotRoot, path.basename(sourcePath));

  try {
    await copyRepoSnapshot(sourcePath, tempSnapshotPath, includeGitDir);
    await fs.cp(tempSnapshotPath, targetPath, { recursive: true });
  } finally {
    await fs.rm(tempSnapshotRoot, { recursive: true, force: true });
  }
}

async function readGitHead(sourcePath: string): Promise<string | undefined> {
  try {
    const { stdout } = await execFile("git", ["-C", sourcePath, "rev-parse", "HEAD"], {
      maxBuffer: 1024 * 1024,
    });
    const trimmed = stdout.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  } catch {
    return undefined;
  }
}

function buildUniqueRepoId(preferredName: string, usedNames: Set<string>): string {
  let candidate = preferredName;
  let suffix = 2;
  while (usedNames.has(candidate)) {
    candidate = `${preferredName}-${suffix}`;
    suffix += 1;
  }
  usedNames.add(candidate);
  return candidate;
}

async function writeJsonFile(targetPath: string, value: unknown): Promise<void> {
  await fs.writeFile(targetPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const createdAt = new Date().toISOString();
  const workspaceRoot = path.join(options.outDir, "workspace");
  const reposRoot = path.join(workspaceRoot, "repos");
  const stateRoot = path.join(workspaceRoot, ".tasklog");
  const workdocsRoot = path.join(workspaceRoot, "workdocs");
  const activeContextPath = path.join(stateRoot, "active-context.json");
  const worksPath = path.join(stateRoot, "works.json");
  const sessionLogJsonPath = path.join(stateRoot, "session-log.json");
  const sessionLogMarkdownPath = path.join(stateRoot, "session-log.md");
  const usedRepoIds = new Set<string>();
  const repos: RepoManifestEntry[] = [];

  await ensureCleanDirectory(options.outDir, options.force);
  await fs.mkdir(reposRoot, { recursive: true });
  await fs.mkdir(stateRoot, { recursive: true });
  await fs.mkdir(workdocsRoot, { recursive: true });

  for (const repoSource of options.repoSources) {
    const sourceStats = await fs.stat(repoSource).catch(() => null);
    if (!sourceStats || !sourceStats.isDirectory()) {
      throw new Error(`Repo source is not a readable directory: ${repoSource}`);
    }

    const repoId = buildUniqueRepoId(path.basename(repoSource), usedRepoIds);
    const repoTargetPath = path.join(reposRoot, repoId);
    await copyRepoSnapshotSafe(repoSource, repoTargetPath, options.includeGitDir);

    repos.push({
      repo_id: repoId,
      source_path: repoSource,
      target_path: path.relative(options.outDir, repoTargetPath),
      source_git_head: await readGitHead(repoSource),
    });
  }

  await writeJsonFile(worksPath, []);
  await writeJsonFile(sessionLogJsonPath, []);
  await fs.writeFile(sessionLogMarkdownPath, "# Session Log\n\n", "utf8");

  const manifest: FixtureManifest = {
    version: 1,
    fixture_id: options.fixtureId,
    created_at: createdAt,
    environment_type: "tasklog_benchmark_fixture",
    workspace_root: path.relative(options.outDir, workspaceRoot),
    contamination_controls: [
      "fresh output directory per fixture",
      "repo snapshots copied without node_modules, dist, target, .tasklog, or workdocs",
      "no ambient Tasklog state copied from the operator workspace",
      "runner should mount only this fixture directory during claim-lane evaluation",
    ],
    state_paths: {
      state_root: path.relative(options.outDir, stateRoot),
      works_file: path.relative(options.outDir, worksPath),
      session_log_json: path.relative(options.outDir, sessionLogJsonPath),
      session_log_markdown: path.relative(options.outDir, sessionLogMarkdownPath),
      active_context_file: path.relative(options.outDir, activeContextPath),
      workdocs_root: path.relative(options.outDir, workdocsRoot),
    },
    repos,
  };

  await writeJsonFile(path.join(options.outDir, "fixture-manifest.json"), manifest);
  await fs.writeFile(
    path.join(options.outDir, "README.md"),
    [
      "# Tasklog Benchmark Environment",
      "",
      `Fixture id: \`${options.fixtureId}\``,
      "",
      "This directory is a fresh benchmark environment scaffold.",
      "",
      "Layout:",
      "- `workspace/` is the isolated project root for benchmark runs.",
      "- `workspace/repos/` contains copied repo snapshots.",
      "- `workspace/.tasklog/` contains seeded Tasklog state files.",
      "- `workspace/workdocs/` contains seeded work artifact markdown files.",
      "- `fixture-manifest.json` records the fixture contract for runners.",
      "",
      "Next steps:",
      "1. Seed scenario-specific works, logs, and workdocs inside `workspace/.tasklog/` and `workspace/workdocs/`.",
      "2. Point the isolated benchmark runner at `workspace/` rather than the operator's live workspace.",
      "3. Keep claim-lane runs hermetic by mounting only this fixture directory.",
      "",
    ].join("\n"),
    "utf8",
  );

  console.log(JSON.stringify({
    fixture_id: options.fixtureId,
    out_dir: options.outDir,
    workspace_root: workspaceRoot,
    repo_count: repos.length,
  }, null, 2));
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
