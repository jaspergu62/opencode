import { execFileSync, spawnSync } from "node:child_process"
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs"
import { argv, cwd, exit } from "node:process"
import { basename, isAbsolute, join, relative, resolve, sep } from "node:path"

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
  workerCompletionGraceMs: number
  reviewerCompletionGraceMs: number
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
    workerCompletionGraceMs: input.workerCompletionGraceMs,
    reviewerCompletionGraceMs: input.reviewerCompletionGraceMs,
    reviewerAgent: input.reviewerAgent,
    plannerBackend: "spec-import",
    reviewerBackend: "opencode-cli",
    reviewerModel: input.reviewerModel,
    resumeLoopDir: round0Dir,
    resumeMode: "round0",
    harnessDir,
  })
  const removedTestPatchFiles = result.loopDir
    ? cleanupHarborTestPatchFiles({ projectRoot, loopDir: result.loopDir })
    : []

  return {
    ...result,
    harbor_removed_test_patch_files: removedTestPatchFiles,
    instruction_sha256_source: basename(instructionFile),
    instruction_bytes: Buffer.byteLength(readFileSync(instructionFile, "utf-8")),
  }
}

export function cleanupHarborTestPatchFiles(input: { projectRoot: string; loopDir: string }): string[] {
  const artifacts = readdirSync(input.loopDir)
    .map((name) => {
      const match = /^round-(\d+)-patch-artifact\.json$/.exec(name)
      return match ? { name, round: Number(match[1]) } : undefined
    })
    .filter((item): item is { name: string; round: number } => Boolean(item))
    .sort((left, right) => right.round - left.round)
  const latest = artifacts[0]
  if (!latest) return []

  const artifact = JSON.parse(readFileSync(join(input.loopDir, latest.name), "utf-8")) as {
    test_patch?: { changed_files?: unknown }
    excluded_test_patch_files?: unknown
  }
  const testPatchFiles = Array.isArray(artifact.test_patch?.changed_files)
    ? artifact.test_patch.changed_files.filter((item): item is string => typeof item === "string")
    : []
  const excludedFiles = Array.isArray(artifact.excluded_test_patch_files)
    ? artifact.excluded_test_patch_files
        .map((item) => (item && typeof item === "object" && "path" in item ? item.path : undefined))
        .filter((item): item is string => typeof item === "string")
    : []
  const paths = [...new Set([...testPatchFiles, ...excludedFiles])].sort()
  const targets = paths.map((path) => ({ path, target: harborCleanupTarget(input.projectRoot, path) }))

  for (const item of targets) {
    const tracked = spawnSync("git", ["ls-files", "--error-unmatch", "--", item.path], {
      cwd: input.projectRoot,
      stdio: "ignore",
    }).status === 0
    if (tracked) {
      execFileSync("git", ["checkout", "--", item.path], { cwd: input.projectRoot, stdio: "ignore" })
    } else {
      rmSync(item.target, { force: true, recursive: true })
    }
  }
  return paths
}

function harborCleanupTarget(projectRoot: string, artifactPath: string): string {
  if (!artifactPath || isAbsolute(artifactPath)) {
    throw new Error(`Unsafe Harbor test patch path: ${artifactPath || "(empty)"}`)
  }
  const root = resolve(projectRoot)
  const target = resolve(root, artifactPath)
  const fromRoot = relative(root, target)
  if (!fromRoot || fromRoot === ".." || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot)) {
    throw new Error(`Unsafe Harbor test patch path: ${artifactPath}`)
  }
  return target
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
    workerCompletionGraceMs: Number(parsed["worker-completion-grace-ms"] ?? 120_000),
    reviewerCompletionGraceMs: Number(parsed["reviewer-completion-grace-ms"] ?? 120_000),
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
