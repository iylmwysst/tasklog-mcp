import path from "node:path";
import { promises as fs } from "node:fs";

const DEFAULT_FIXTURES_ROOT = "/Users/Lab/Desktop/TasklogSweLab/fixtures-v4";

interface CliOptions {
  fixturesRoot: string;
  frozenAt: string;
}

interface RoleAssignment {
  round_id: string;
  benchmark_type: string;
  annotation_phase: string;
  frozen_at: string;
}

interface AnnotationManifest {
  round_id: string;
  benchmark_type: string;
  status: string;
  role_assignment_frozen_at?: string;
}

function parseArgs(argv: string[]): CliOptions {
  let fixturesRoot = DEFAULT_FIXTURES_ROOT;
  let frozenAt = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current === "--fixtures-root") {
      fixturesRoot = path.resolve(argv[index + 1] ?? fixturesRoot);
      index += 1;
      continue;
    }
    if (current === "--frozen-at") {
      frozenAt = argv[index + 1] ?? frozenAt;
      index += 1;
      continue;
    }
  }

  return { fixturesRoot, frozenAt };
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

async function writeJsonFile(filePath: string, value: unknown): Promise<void> {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const annotationRoot = path.join(options.fixturesRoot, "annotation");
  const roleAssignmentPath = path.join(annotationRoot, "role-assignment.json");
  const annotationManifestPath = path.join(annotationRoot, "annotation-manifest.json");

  const roleAssignment = await readJsonFile<RoleAssignment>(roleAssignmentPath);
  const annotationManifest = await readJsonFile<AnnotationManifest>(annotationManifestPath);

  roleAssignment.annotation_phase = "role_assignment_frozen";
  roleAssignment.frozen_at = options.frozenAt;

  annotationManifest.status = "role_assignment_frozen_pending_dual_annotation";
  annotationManifest.role_assignment_frozen_at = options.frozenAt;

  await writeJsonFile(roleAssignmentPath, roleAssignment);
  await writeJsonFile(annotationManifestPath, annotationManifest);

  console.log(JSON.stringify({
    fixtures_root: options.fixturesRoot,
    role_assignment_path: roleAssignmentPath,
    annotation_manifest_path: annotationManifestPath,
    frozen_at: options.frozenAt,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
