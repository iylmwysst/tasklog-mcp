import { readFile } from "node:fs/promises";
import path from "node:path";

import { z } from "zod";

const responseSchema = z.object({
  benchmark_type: z.enum(["llm_reentry_understanding", "full_session_reentry", "tasklog_v4_swe_grounded_reentry"]),
  scenario_id: z.string().min(1),
  variant_label: z.string().min(1),
  provider: z.string().min(1),
  model_id: z.string().min(1),
  model_family: z.string().min(1),
  reasoning_setting: z.string().min(1),
  runner_name: z.string().min(1),
  runner_version: z.string().min(1),
  run_id: z.string().min(1),
  run_started_at: z.string().min(1),
  run_finished_at: z.string().min(1),
  latency_ms: z.number().nullable(),
  input_tokens: z.number().nullable(),
  output_tokens: z.number().nullable(),
  cache_creation_input_tokens: z.number().nullable(),
  cache_read_input_tokens: z.number().nullable(),
  estimated_cost_usd: z.number().nullable(),
});

const batchSchema = z.object({
  benchmark_type: z.enum(["llm_reentry_understanding", "full_session_reentry", "tasklog_v4_swe_grounded_reentry"]),
  split: z.string().min(1),
  provider: z.string().min(1),
  model_id: z.string().min(1),
  model_family: z.string().min(1),
  reasoning_setting: z.string().min(1),
  runner_name: z.string().min(1),
  runner_version: z.string().min(1),
  project_root: z.string().min(1),
  pack_path: z.string().min(1),
  answers_path: z.string().min(1),
  metadata_path: z.string().min(1),
  run_id: z.string().min(1),
  submitted_at: z.string().min(1),
  responses: z.array(responseSchema),
}).superRefine((batch, ctx) => {
  batch.responses.forEach((response, index) => {
    const comparableFields = [
      "benchmark_type",
      "provider",
      "model_id",
      "model_family",
      "reasoning_setting",
      "runner_name",
      "runner_version",
      "run_id",
    ] as const;
    for (const field of comparableFields) {
      if (response[field] !== batch[field]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["responses", index, field],
          message: `Response field ${field} must match batch ${field}.`,
        });
      }
    }
  });
});

function parseArgs(argv: string[]): { filePath?: string; json: boolean } {
  let filePath: string | undefined;
  let json = false;
  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if ((current === "--file" || current === "--metadata") && argv[index + 1]) {
      filePath = path.resolve(argv[index + 1]!);
      index += 1;
      continue;
    }
    if (current === "--json") {
      json = true;
    }
  }
  return { filePath, json };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  if (!options.filePath) {
    throw new Error("validate-benchmark-runner-metadata requires --file <metadata.json>");
  }

  const parsed = batchSchema.parse(JSON.parse(await readFile(options.filePath, "utf8")));
  const summary = {
    ok: true,
    benchmark_type: parsed.benchmark_type,
    split: parsed.split,
    provider: parsed.provider,
    model_id: parsed.model_id,
    model_family: parsed.model_family,
    reasoning_setting: parsed.reasoning_setting,
    runner_name: parsed.runner_name,
    runner_version: parsed.runner_version,
    response_count: parsed.responses.length,
  };

  if (options.json) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  console.log("# Benchmark Runner Metadata Validation");
  console.log("");
  console.log(`- ok: true`);
  console.log(`- benchmark_type: ${summary.benchmark_type}`);
  console.log(`- split: ${summary.split}`);
  console.log(`- provider: ${summary.provider}`);
  console.log(`- model_id: ${summary.model_id}`);
  console.log(`- model_family: ${summary.model_family}`);
  console.log(`- reasoning_setting: ${summary.reasoning_setting}`);
  console.log(`- runner_name: ${summary.runner_name}`);
  console.log(`- runner_version: ${summary.runner_version}`);
  console.log(`- response_count: ${summary.response_count}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
