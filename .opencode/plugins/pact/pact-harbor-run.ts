import { existsSync, mkdirSync, readFileSync } from "node:fs"
import { argv, cwd, exit } from "node:process"
import { basename, join, resolve } from "node:path"

import { runPactDriver } from "./pact-run-driver"
import { importInstructionSpec } from "./pact-spec-importer"

export type PactHarborRunOptions = {
  projectRoot: string
  instructionFile: string
  harnessDir: string
  maxRounds: number
  model: string
  reviewerModel: string
  workerAgent: string
  reviewerAgent: string
  loopID?: string
}

export function runPactHarborCase(input: PactHarborRunOptions) {
  const projectRoot = resolve(input.projectRoot)
  const instructionFile = resolve(input.instructionFile)
  const harnessDir = resolve(input.harnessDir)
  if (!existsSync(instructionFile)) throw new Error(`Missing Harbor instruction: ${instructionFile}`)
  if (!existsSync(harnessDir)) throw new Error(`Missing PACT harness: ${harnessDir}`)

  const loopID = input.loopID ?? `harbor-${Date.now()}`
  const round0Dir = join(projectRoot, ".pact", "round0", loopID)
  mkdirSync(round0Dir, { recursive: true })
  importInstructionSpec({
    instructionFile,
    outputLoopDir: round0Dir,
    projectRoot,
    planFile: instructionFile,
    loopID,
    maxRounds: input.maxRounds,
    reviewerBackend: "opencode-cli",
    reviewerModel: input.reviewerModel,
    workerModel: input.model,
    workerConfigSource: "harbor-openrouter",
    sessionStrategy: "new-per-round",
  })

  const result = runPactDriver({
    projectRoot,
    planFile: instructionFile,
    model: input.model,
    maxRounds: input.maxRounds,
    workerRunner: "host",
    workerAgent: input.workerAgent,
    workerConfigSource: "harbor-openrouter",
    reviewerAgent: input.reviewerAgent,
    plannerBackend: "spec-import",
    reviewerBackend: "opencode-cli",
    reviewerModel: input.reviewerModel,
    resumeLoopDir: round0Dir,
    resumeMode: "round0",
    harnessDir,
  })

  return {
    ...result,
    instruction_sha256_source: basename(instructionFile),
    instruction_bytes: Buffer.byteLength(readFileSync(instructionFile, "utf-8")),
  }
}

export function pactHarborArgs(raw: string[]): PactHarborRunOptions {
  const parsed: Record<string, string | undefined> = {}
  const args = [...raw]
  while (args.length) {
    const key = args.shift()
    if (!key?.startsWith("--")) continue
    parsed[key.slice(2)] = args.shift()
  }
  const instructionFile = parsed["instruction-file"]
  const harnessDir = parsed["harness-dir"]
  if (!instructionFile) throw new Error("Missing --instruction-file")
  if (!harnessDir) throw new Error("Missing --harness-dir")
  return {
    projectRoot: parsed["project-root"] ?? cwd(),
    instructionFile,
    harnessDir,
    maxRounds: Number(parsed["max-rounds"] ?? 3),
    model: parsed.model ?? "openrouter/z-ai/glm-5.2",
    reviewerModel: parsed["reviewer-model"] ?? parsed.model ?? "openrouter/z-ai/glm-5.2",
    workerAgent: parsed["worker-agent"] ?? "build",
    reviewerAgent: parsed["reviewer-agent"] ?? "build",
    loopID: parsed["loop-id"],
  }
}

if (import.meta.main) {
  try {
    const result = runPactHarborCase(pactHarborArgs(argv.slice(2)))
    console.log(JSON.stringify(result, null, 2))
    exit(result.exitCode)
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    exit(2)
  }
}
