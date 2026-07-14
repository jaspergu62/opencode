import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { basename, join, resolve } from "node:path"

import { loadPactHarness, writeJsonFile } from "./pact-core"
import {
  compareHarnessVariants,
  evaluateHarnessChanges,
  evaluateHarnessOnSuite,
  loadHarnessSuite,
  runExternalCase,
  summarizeHarnessVariant,
  type HarnessCaseRunner,
  type HarnessCaseResult,
  type HarnessChangeEvaluation,
  type HarnessSuite,
  type HarnessVariantResults,
} from "./pact-harness-evolve"
import { materializeCodexHarnessVariantOutput } from "./pact-harness-variant"

export type AheVariantGeneratorInput = {
  iteration: number
  variantId: string
  variantDir: string
  currentBest: HarnessVariantResults
  baseline: HarnessVariantResults
  history: HarnessVariantResults[]
  failureBundle: string
  forbiddenTerms: string[]
  outputDir: string
}

export type AheVariantGenerator = (input: AheVariantGeneratorInput) => Promise<string> | string

export type AheIterationResult = {
  iteration: number
  variant_id: string
  current_best_before: string
  current_best_after: string
  candidate: HarnessVariantResults
  change_evaluation: HarnessChangeEvaluation
  accepted_as_best: boolean
  reason: string
}

export type AheEvolutionResult = {
  baseline: HarnessVariantResults
  iterations: AheIterationResult[]
  winner: HarnessVariantResults
}

export async function runAheHarnessEvolution(input: {
  suite: HarnessSuite | string
  baselineHarnessDir: string
  variantsRoot: string
  outputDir: string
  iterations?: number
  runCase: HarnessCaseRunner
  generateVariant?: AheVariantGenerator
  codexCommand?: string
  worktreeDir?: string
}): Promise<AheEvolutionResult> {
  const suite = typeof input.suite === "string" ? loadHarnessSuite(input.suite) : input.suite
  const outputDir = resolve(input.outputDir)
  const variantsRoot = resolve(input.variantsRoot)
  const iterations = Math.max(1, input.iterations ?? 3)
  mkdirSync(outputDir, { recursive: true })
  mkdirSync(variantsRoot, { recursive: true })
  loadPactHarness(input.baselineHarnessDir)

  const baseline = await evaluateHarnessOnSuite({
    suite,
    harnessId: "baseline",
    harnessDir: resolve(input.baselineHarnessDir),
    kind: "pact-harness",
    promotable: true,
    outputDir: join(outputDir, "baseline"),
    iteration: 0,
    runCase: input.runCase,
  })
  writeJsonFile(join(outputDir, "baseline-results.json"), baseline)

  let currentBest = baseline
  const history: HarnessVariantResults[] = [baseline]
  const iterationResults: AheIterationResult[] = []
  for (let iteration = 1; iteration <= iterations; iteration++) {
    const iterationDir = join(outputDir, `iteration-${String(iteration).padStart(3, "0")}`)
    const variantId = `swepro-ahe-v${iteration}`
    const variantDir = join(variantsRoot, variantId)
    mkdirSync(iterationDir, { recursive: true })
    const failureBundle = buildFailureBundle(currentBest, history)
    writeFileSync(join(iterationDir, "failure-bundle.md"), failureBundle, "utf-8")
    const forbiddenTerms = suiteForbiddenTerms(suite, failureBundle)
    const generator =
      input.generateVariant ??
      ((args: AheVariantGeneratorInput) =>
        generateCodexVariant(args, input.codexCommand ?? "codex", input.worktreeDir ?? process.cwd()))
    const generatedDir =
      existsSync(join(variantDir, "manifest.json")) && existsSync(join(variantDir, "change_manifest.json"))
        ? variantDir
        : await generator({
            iteration,
            variantId,
            variantDir,
            currentBest,
            baseline,
            history,
            failureBundle,
            forbiddenTerms,
            outputDir: iterationDir,
          })
    loadPactHarness(generatedDir)
    const candidate = await evaluateHarnessOnSuite({
      suite,
      harnessId: variantId,
      harnessDir: generatedDir,
      kind: "pact-harness",
      promotable: true,
      outputDir: join(iterationDir, "evaluation"),
      iteration,
      runCase: input.runCase,
    })
    history.push(candidate)
    const manifest = JSON.parse(readFileSync(join(generatedDir, "change_manifest.json"), "utf-8"))
    const changeEvaluation = evaluateHarnessChanges({
      manifest,
      baseline_results: currentBest.case_results,
      candidate_results: candidate.case_results,
    })
    const decision = strictBestDecision(baseline, currentBest, candidate)
    const before = currentBest.harness_id
    if (decision.accept) currentBest = candidate
    const result: AheIterationResult = {
      iteration,
      variant_id: variantId,
      current_best_before: before,
      current_best_after: currentBest.harness_id,
      candidate,
      change_evaluation: changeEvaluation,
      accepted_as_best: decision.accept,
      reason: decision.reason,
    }
    iterationResults.push(result)
    writeJsonFile(join(iterationDir, "candidate-results.json"), candidate)
    writeJsonFile(join(iterationDir, "change-evaluation.json"), changeEvaluation)
    writeJsonFile(join(iterationDir, "selection.json"), {
      ...decision,
      current_best_before: before,
      current_best_after: currentBest.harness_id,
      comparison: compareHarnessVariants({ promotion: "report-only", baseline, variants: history.slice(1) }),
    })
  }

  const result = { baseline, iterations: iterationResults, winner: currentBest }
  writeJsonFile(join(outputDir, "ahe-evolution-result.json"), result)
  writeAheHistory(outputDir, baseline, iterationResults, currentBest)
  return result
}

export function strictBestDecision(
  baseline: HarnessVariantResults,
  currentBest: HarnessVariantResults,
  candidate: HarnessVariantResults,
): { accept: boolean; reason: string } {
  const baselineScore = summarizeHarnessVariant(baseline)
  const bestScore = summarizeHarnessVariant(currentBest)
  const candidateScore = summarizeHarnessVariant(candidate)
  const baselinePasses = new Set(baseline.case_results.filter(isResolved).map((entry) => entry.case_id))
  const candidatePasses = new Set(candidate.case_results.filter(isResolved).map((entry) => entry.case_id))
  const regressions = [...baselinePasses].filter((caseId) => !candidatePasses.has(caseId))
  if (candidateScore.resolved <= bestScore.resolved) {
    return { accept: false, reason: "candidate did not increase resolved over current best" }
  }
  if (candidateScore.resolved <= baselineScore.resolved) {
    return { accept: false, reason: "candidate did not increase resolved over baseline" }
  }
  if (regressions.length) return { accept: false, reason: `candidate regressed baseline passes: ${regressions.join(", ")}` }
  if (candidateScore.timeout > baselineScore.timeout) return { accept: false, reason: "candidate increased timeout count" }
  if (candidateScore.infra > baselineScore.infra) return { accept: false, reason: "candidate increased infra count" }
  return { accept: true, reason: "resolved increased with no baseline-pass, timeout, or infra regression" }
}

export function buildFailureBundle(currentBest: HarnessVariantResults, history: HarnessVariantResults[]): string {
  const lines = [
    "# AHE Failure Evidence Bundle",
    "",
    `Current best: ${currentBest.harness_id}`,
    "",
    "## Predicted Fixes Versus Still Failed",
  ]
  for (const run of history) {
    const summary = summarizeHarnessVariant(run)
    lines.push("", `### ${run.harness_id}`, "", `Resolved ${summary.resolved}/${summary.total}; timeout ${summary.timeout}; infra ${summary.infra}.`)
    for (const result of run.case_results) {
      lines.push(
        "",
        `#### ${result.case_id}`,
        `- status: ${result.status}`,
        `- resolved: ${String(result.resolved ?? false)}`,
        `- stop_reason: ${result.stop_reason ?? "unknown"}`,
        `- rounds attempted/completed/reviewed: ${result.attempted_rounds ?? "?"}/${result.completed_rounds ?? "?"}/${result.reviewed_rounds ?? "?"}`,
        `- reviewer: ${result.reviewer_decision ?? "unknown"}`,
        `- patch: ${result.patch_quality ?? "unknown"} (${result.patch_lines ?? "?"} added lines)`,
      )
      const evidence = run === currentBest || run === history.at(-1) ? compactTrajectoryEvidence(result.artifacts_dir) : ""
      if (evidence) lines.push("", "```text", evidence, "```")
    }
  }
  lines.push(
    "",
    "## Improve Constraint",
    "Infer workflow/schema changes from repeated failure signatures. Do not encode case IDs, repository names, paths, hidden test names, or solution content into executable harness files.",
    "",
  )
  return lines.join("\n")
}

function generateCodexVariant(input: AheVariantGeneratorInput, codexCommand: string, worktreeDir: string): string {
  const promptPath = join(input.outputDir, "codex-prompt.md")
  const rawPath = join(input.outputDir, "codex-output.md")
  const prompt = renderCodexPrompt(input)
  writeFileSync(promptPath, prompt, "utf-8")
  let result = spawnSync(codexCommand, ["exec", "--sandbox", "read-only", "--output-last-message", rawPath, prompt], {
    cwd: worktreeDir,
    encoding: "utf-8",
    maxBuffer: 1024 * 1024 * 64,
  })
  if (result.status !== 0 || !existsSync(rawPath)) {
    throw new Error(`Codex variant generation failed: ${result.stderr || result.stdout || result.error?.message}`)
  }
  let raw = readFileSync(rawPath, "utf-8")
  try {
    materializeCodexHarnessVariantOutput(raw, { variantDir: input.variantDir, forbiddenTerms: input.forbiddenTerms })
  } catch (error) {
    const repairPath = join(input.outputDir, "codex-repair-output.md")
    const repairPrompt = `${prompt}\n\nThe previous output failed validation with: ${error instanceof Error ? error.message : String(error)}\nReturn one corrected JSON envelope only. Previous output:\n${raw}`
    result = spawnSync(codexCommand, ["exec", "--sandbox", "read-only", "--output-last-message", repairPath, repairPrompt], {
      cwd: worktreeDir,
      encoding: "utf-8",
      maxBuffer: 1024 * 1024 * 64,
    })
    if (result.status !== 0 || !existsSync(repairPath)) throw new Error("Codex variant repair failed")
    raw = readFileSync(repairPath, "utf-8")
    materializeCodexHarnessVariantOutput(raw, { variantDir: input.variantDir, forbiddenTerms: input.forbiddenTerms })
  }
  return input.variantDir
}

function renderCodexPrompt(input: AheVariantGeneratorInput): string {
  return `You are the improve phase of an AHE evaluate -> analyze -> improve -> select loop.
Generate ${input.variantId} as a generic PACT workflow/schema overlay.

Use the concrete failed trajectories below, especially predicted fixes versus still failed. Do not merely make the previous wording stricter. Infer reusable evidence-ledger, worker budgeting, reviewer oracle-family, or finalize-gate schema changes.

Output exactly one JSON object shaped as {"files":[{"path":"manifest.json","content":"..."}, ...]}.
Required files: manifest.json, change_manifest.json, goal-tracker-schema.md, spec-import-profile.json, and every template referenced by manifest.json.
Allowed templates: planner, initial_worker, continuation_worker, review, review_phase, finalize.
Each template should preserve the default prompt and may use the goal tracker schema placeholder.
change_manifest.json must use pact-harness-change/v1 and state predicted fixes, risks, changed files, and rationale.
Never include instance IDs, repository names, task-specific paths, gold patches, solution content, or hidden test names in executable harness files.

Current harness:
${harnessSnapshot(input.currentBest.harness_dir)}

Failure trajectories:
${input.failureBundle}
`
}

function compactTrajectoryEvidence(artifactsDir: string | undefined): string {
  if (!artifactsDir || !existsSync(artifactsDir)) return ""
  const names = new Set(["pact-driver.log", "state.json", "round-01-review.md", "round-02-review.md", "round-03-review.md", "round-01-summary.md", "round-02-summary.md", "round-03-summary.md"])
  return findNamedFiles(artifactsDir, names)
    .slice(-12)
    .map((path) => `--- ${basename(path)} ---\n${readFileSync(path, "utf-8").slice(-4000)}`)
    .join("\n")
    .slice(-8000)
}

function harnessSnapshot(harnessDir: string): string {
  return findNamedFiles(harnessDir)
    .filter((path) => /(?:\.md|\.json)$/.test(path))
    .map((path) => `--- ${path.slice(resolve(harnessDir).length + 1)} ---\n${readFileSync(path, "utf-8")}`)
    .join("\n")
}

function findNamedFiles(root: string, names?: Set<string>): string[] {
  const result: string[] = []
  const visit = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) visit(path)
      else if (!names || names.has(entry.name)) result.push(path)
    }
  }
  visit(root)
  return result.sort((a, b) => statSync(a).mtimeMs - statSync(b).mtimeMs || a.localeCompare(b))
}

function suiteForbiddenTerms(suite: HarnessSuite, evidence: string): string[] {
  const terms = suite.cases.flatMap((item) => [item.instance_id, item.repo]).filter((item): item is string => !!item)
  const hiddenIdentifiers = evidence.match(/(?:tests?[/._-][A-Za-z0-9_./:-]+|[A-Za-z0-9_./-]+::test_[A-Za-z0-9_]+)/g) ?? []
  return [...new Set([...terms, ...hiddenIdentifiers])]
}

function isResolved(result: HarnessCaseResult): boolean {
  return result.status === "pass" || result.resolved === true || result.final_hidden_gate === "passed"
}

function writeAheHistory(
  outputDir: string,
  baseline: HarnessVariantResults,
  iterations: AheIterationResult[],
  winner: HarnessVariantResults,
): void {
  const baselineSummary = summarizeHarnessVariant(baseline)
  const lines = [
    "# SWE-bench Pro PACT AHE Evolution",
    "",
    `Baseline resolved: ${baselineSummary.resolved}/${baselineSummary.total}`,
    "",
    "| Iteration | Candidate | Resolved | Timeout | Infra | Accepted as best | Reason |",
    "| ---: | --- | ---: | ---: | ---: | --- | --- |",
  ]
  for (const iteration of iterations) {
    const score = summarizeHarnessVariant(iteration.candidate)
    lines.push(`| ${iteration.iteration} | ${iteration.variant_id} | ${score.resolved} | ${score.timeout} | ${score.infra} | ${iteration.accepted_as_best ? "yes" : "no"} | ${iteration.reason.replaceAll("|", "\\|")} |`)
  }
  lines.push("", `Frozen winner: ${winner.harness_id}`, "")
  writeFileSync(join(outputDir, "evolution-history.md"), lines.join("\n"), "utf-8")
}

export function pactAheCliArgs(raw: string[]): Record<string, string | undefined> & { iterations: number } {
  const parsed: Record<string, string | undefined> = {}
  const args = [...raw]
  while (args.length) {
    const key = args.shift()
    if (!key?.startsWith("--")) continue
    parsed[key.slice(2)] = args.shift()
  }
  return { ...parsed, iterations: Number(parsed.iterations ?? 3) }
}

if (import.meta.main) {
  const args = pactAheCliArgs(process.argv.slice(2))
  for (const required of ["suite", "baseline-harness", "variants-root", "output", "runner-command"] as const) {
    if (!args[required]) throw new Error(`Missing --${required}`)
  }
  const result = await runAheHarnessEvolution({
    suite: args.suite!,
    baselineHarnessDir: args["baseline-harness"]!,
    variantsRoot: args["variants-root"]!,
    outputDir: args.output!,
    iterations: args.iterations,
    codexCommand: args["codex-command"],
    worktreeDir: args["worktree-dir"],
    runCase({ caseItem, harnessId, harnessDir, kind, promotable, outputDir }) {
      return runExternalCase({
        runnerCommand: args["runner-command"]!,
        caseItem,
        harnessId,
        harnessDir,
        kind,
        promotable,
        outputDir,
      })
    },
  })
  process.stdout.write(`${JSON.stringify({ winner: result.winner.harness_id }, null, 2)}\n`)
}
