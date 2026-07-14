import { closeSync, existsSync, mkdirSync, openSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { argv, cwd, env, exit } from "node:process"
import { basename, join, resolve } from "node:path"

import { harnessCaseResultFromHarborTrial, type HarnessCaseResult } from "./pact-harness-evolve"

export type PactHarborCaseOptions = {
  taskPath: string
  caseId: string
  harnessDir: string
  outputDir: string
  harborDir: string
  worktreeDir: string
  runtimeDir: string
  keyFile: string
  model: string
  maxRounds: number
}

export function pactHarborCaseArgs(raw: string[]): PactHarborCaseOptions {
  const parsed: Record<string, string | undefined> = {}
  const args = [...raw]
  while (args.length) {
    const key = args.shift()
    if (!key?.startsWith("--")) continue
    parsed[key.slice(2)] = args.shift()
  }
  for (const required of ["task-path", "case-id", "harness-dir", "output-dir"] as const) {
    if (!parsed[required]) throw new Error(`Missing --${required}`)
  }
  const worktreeDir = resolve(parsed["worktree-dir"] ?? cwd())
  return {
    taskPath: resolve(parsed["task-path"]!),
    caseId: parsed["case-id"]!,
    harnessDir: resolve(parsed["harness-dir"]!),
    outputDir: resolve(parsed["output-dir"]!),
    harborDir: resolve(parsed["harbor-dir"] ?? "/Users/gujiazhen/Documents/cc_codes/harbor"),
    worktreeDir,
    runtimeDir: resolve(parsed["runtime-dir"] ?? join(worktreeDir, ".opencode", "plugins", "pact")),
    keyFile: resolve(
      parsed["key-file"] ??
        "/Users/gujiazhen/Documents/cc_codes/benchmark/lolbench_trial-outputs-reme-1dot2_v14_opencode/gpt-5.5/open_router_key",
    ),
    model: parsed.model ?? "openrouter/z-ai/glm-5.2",
    maxRounds: Number(parsed["max-rounds"] ?? 3),
  }
}

export function harborTrialArgs(input: PactHarborCaseOptions): string[] {
  const trialName = `${sanitize(input.caseId)}-${sanitize(basename(input.harnessDir))}`
  return [
    "trial",
    "start",
    "--path",
    input.taskPath,
    "--trial-name",
    trialName,
    "--trials-dir",
    join(input.outputDir, "trials"),
    "--agent",
    "script.pact_harbor_agent:PactOpenCodeAgent",
    "--model",
    input.model,
    "--agent-kwarg",
    `runtime_dir=${input.runtimeDir}`,
    "--agent-kwarg",
    `harness_dir=${input.harnessDir}`,
    "--agent-kwarg",
    `max_rounds=${input.maxRounds}`,
    "--agent-kwarg",
    `reviewer_model=${input.model}`,
    "--agent-env",
    "OPENROUTER_API_KEY=${OPENROUTER_API_KEY}",
    "--no-force-build",
  ]
}

export function runPactHarborTrial(input: PactHarborCaseOptions): HarnessCaseResult {
  for (const path of [input.taskPath, input.harnessDir, input.runtimeDir, input.harborDir, input.keyFile]) {
    if (!existsSync(path)) throw new Error(`Required Harbor run input does not exist: ${path}`)
  }
  const apiKey = readFileSync(input.keyFile, "utf-8").trim()
  if (!apiKey) throw new Error(`OpenRouter key file is empty: ${input.keyFile}`)
  mkdirSync(input.outputDir, { recursive: true })
  const logPath = join(input.outputDir, "runner.log")
  const logFD = openSync(logPath, "w")
  let status: number | null = null
  try {
    const result = spawnSync(join(input.harborDir, ".venv", "bin", "harbor"), harborTrialArgs(input), {
      cwd: input.worktreeDir,
      env: {
        ...env,
        OPENROUTER_API_KEY: apiKey,
        PYTHONPATH: [input.worktreeDir, join(input.harborDir, "src"), env.PYTHONPATH].filter(Boolean).join(":"),
      },
      stdio: ["ignore", logFD, logFD],
    })
    status = result.status
  } finally {
    closeSync(logFD)
  }

  const resultsPath = newestFile(join(input.outputDir, "trials"), "result.json")
  let caseResult: HarnessCaseResult
  if (!resultsPath) {
    caseResult = {
      case_id: input.caseId,
      status: "infra",
      resolved: false,
      verification_status: "infra_failed",
      final_hidden_gate: "unknown",
      patch_quality: "unknown",
      stop_reason: `harbor_exit_${status ?? "signal"}`,
      infra_error: `Harbor did not write result.json; see ${logPath}`,
      artifacts_dir: input.outputDir,
    }
  } else {
    const trialDir = resolve(resultsPath, "..")
    const statePath = newestFile(join(trialDir, "agent", "pact", "loops"), "state.json")
    const patchPath = join(trialDir, "agent", "final.patch")
    caseResult = harnessCaseResultFromHarborTrial(readFileSync(resultsPath, "utf-8"), {
      caseId: input.caseId,
      artifactsDir: trialDir,
      pactState: statePath ? JSON.parse(readFileSync(statePath, "utf-8")) : undefined,
      patchText: existsSync(patchPath) ? readFileSync(patchPath, "utf-8") : undefined,
    })
    if (status !== 0 && caseResult.status === "fail") {
      caseResult.status = "infra"
      caseResult.infra_error = `Harbor exited with ${status}; see ${logPath}`
    }
  }
  writeFileSync(join(input.outputDir, "case_result.json"), JSON.stringify(caseResult, null, 2) + "\n", "utf-8")
  writeFileSync(
    join(input.outputDir, "run-metadata.json"),
    JSON.stringify(
      {
        case_id: input.caseId,
        task_path: input.taskPath,
        harness_dir: input.harnessDir,
        model: input.model,
        max_rounds: input.maxRounds,
        harbor_exit_code: status,
      },
      null,
      2,
    ) + "\n",
    "utf-8",
  )
  return caseResult
}

function newestFile(root: string, fileName: string): string | undefined {
  if (!existsSync(root)) return undefined
  const matches: string[] = []
  const visit = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) visit(path)
      else if (entry.name === fileName) matches.push(path)
    }
  }
  visit(root)
  return matches.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0]
}

function sanitize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_.-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80)
}

if (import.meta.main) {
  try {
    const result = runPactHarborTrial(pactHarborCaseArgs(argv.slice(2)))
    console.log(JSON.stringify(result))
    exit(result.status === "infra" ? 2 : 0)
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    exit(2)
  }
}
