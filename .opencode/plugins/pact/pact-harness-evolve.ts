import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { basename, join, resolve } from "node:path"

import { loadPactHarness, writeJsonFile } from "./pact-core"

export type HarnessPromotionPolicy = "guarded" | "report-only" | "aggressive"
export type HarnessVariantKind = "pact-harness" | "humanize-opencode"
export type HarnessBenchmark = "lolbench" | "swebench-pro-harbor"

export type HarnessSuiteCase = {
  id: string
  resume_loop_dir?: string
  instance_id?: string
  task_path?: string
  language?: string
  repo?: string
  max_rounds: number
  verification_command?: string
  target_suites?: string[]
  tags?: string[]
}

export type HarnessSuite = {
  name?: string
  benchmark?: HarnessBenchmark
  max_rounds?: number
  cases: HarnessSuiteCase[]
}

export type HarnessCaseResult = {
  case_id: string
  status: "pass" | "fail" | "timeout" | "infra" | "skipped"
  resolved?: boolean
  stop_reason?: string
  round_count?: number
  verification_status?: "passed" | "failed" | "timeout" | "infra_failed" | "not_run" | "unknown" | string
  final_hidden_gate?: "passed" | "failed" | "timeout" | "not_run" | "unknown" | string
  timeout?: boolean
  patch_quality?: "valid" | "empty" | "malformed" | "unknown" | string
  artifacts_dir?: string
  infra_error?: string
  reward?: number
  agent_seconds?: number
  patch_lines?: number
  attempted_rounds?: number
  completed_rounds?: number
  reviewed_rounds?: number
  reviewer_decision?: string
  verifier_status?: string
}

export type HarnessVariantResults = {
  harness_id: string
  harness_dir: string
  kind?: HarnessVariantKind
  promotable?: boolean
  case_results: HarnessCaseResult[]
}

export type HarnessScoreSummary = {
  harness_id: string
  harness_dir: string
  kind: HarnessVariantKind
  promotable: boolean
  total: number
  pass: number
  resolved: number
  fail: number
  timeout: number
  infra: number
  skipped: number
  verification_passed: number
  final_hidden_gate_passed: number
  valid_patch: number
  average_round_count: number | null
  pass_rate: number
  resolved_rate: number
  score: number
}

export type HarnessRegression = {
  case_id: string
  baseline_status: HarnessCaseResult["status"] | "missing"
  candidate_status: HarnessCaseResult["status"] | "missing"
}

export type HarnessVariantSelection = {
  promotion: HarnessPromotionPolicy
  baseline: HarnessScoreSummary
  variants: HarnessScoreSummary[]
  winner?: HarnessScoreSummary
  should_promote: boolean
  reason: string
  regressions: HarnessRegression[]
  timeout_delta: number
  infra_delta: number
}

export type HarnessChangeManifest = {
  schema?: "pact-harness-change/v1"
  variant_id?: string
  changed_harness_files?: string[]
  predicted_fixes?: string[]
  risk_cases?: string[]
  rationale?: string
  changes?: Array<{
    id?: string
    type?: string
    description?: string
    files?: string[]
    changed_harness_files?: string[]
    failure_pattern?: string
    predicted_fixes?: string[]
    risk_cases?: string[]
    constraint_level?: string
    why_this_component?: string
  }>
}

export type HarnessChangeEvaluation = {
  variant_id: string
  predicted_fixed: string[]
  still_failed: string[]
  already_passing: string[]
  risk_realized: string[]
  unattributed_regressions: string[]
  changed_harness_files: string[]
  verdict: "effective" | "partially_effective" | "mixed" | "ineffective" | "harmful"
}

export type HarnessVariantInput = {
  id: string
  harnessDir?: string
  kind?: HarnessVariantKind
  promotable?: boolean
  changeManifest?: HarnessChangeManifest
}

export type HarnessCaseRunner = (input: {
  caseItem: HarnessSuiteCase
  harnessId: string
  harnessDir: string
  kind: HarnessVariantKind
  promotable: boolean
  outputDir: string
  iteration: number
}) => HarnessCaseResult | Promise<HarnessCaseResult>

export type HarnessEvolutionIteration = {
  iteration: number
  iteration_dir: string
  baseline: HarnessVariantResults
  variants: HarnessVariantResults[]
  selection: HarnessVariantSelection
  change_evaluations: HarnessChangeEvaluation[]
}

export type HarnessEvolutionResult = {
  output_dir: string
  suite: HarnessSuite
  iterations: HarnessEvolutionIteration[]
}

export function loadHarnessSuite(path: string): HarnessSuite {
  const parsed = JSON.parse(readFileSync(path, "utf-8")) as unknown
  return validateHarnessSuite(parsed)
}

export function validateHarnessSuite(value: unknown): HarnessSuite {
  if (!value || typeof value !== "object" || !Array.isArray((value as { cases?: unknown }).cases)) {
    throw new Error("PACT harness suite must include cases")
  }
  const record = value as Record<string, unknown> & { cases: unknown[] }
  const benchmark = record.benchmark === undefined ? undefined : validateHarnessBenchmark(record.benchmark)
  const maxRounds = positiveNumber(record.max_rounds)
  const cases = record.cases.map((entry, index) => validateHarnessSuiteCase(entry, index, benchmark, maxRounds))
  if (cases.length === 0) throw new Error("PACT harness suite must include at least one case")
  if (record.name !== undefined && (typeof record.name !== "string" || !record.name)) {
    throw new Error("PACT harness suite name must be a non-empty string")
  }
  return {
    ...(record.name ? { name: record.name as string } : {}),
    ...(benchmark ? { benchmark } : {}),
    ...(maxRounds ? { max_rounds: maxRounds } : {}),
    cases,
  }
}

export function summarizeHarnessVariant(results: HarnessVariantResults): HarnessScoreSummary {
  const total = results.case_results.length
  const pass = results.case_results.filter((entry) => entry.status === "pass").length
  const resolved = results.case_results.filter(caseResolved).length
  const fail = results.case_results.filter((entry) => entry.status === "fail").length
  const timeout = results.case_results.filter((entry) => entry.status === "timeout" || entry.timeout).length
  const infra = results.case_results.filter((entry) => entry.status === "infra").length
  const skipped = results.case_results.filter((entry) => entry.status === "skipped").length
  const verificationPassed = results.case_results.filter((entry) => entry.verification_status === "passed").length
  const finalHiddenGatePassed = results.case_results.filter((entry) => entry.final_hidden_gate === "passed").length
  const validPatch = results.case_results.filter((entry) => entry.patch_quality === "valid").length
  const roundCounts = results.case_results
    .map((entry) => entry.round_count)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value))
  const averageRoundCount =
    roundCounts.length === 0 ? null : roundCounts.reduce((sum, value) => sum + value, 0) / roundCounts.length

  return {
    harness_id: results.harness_id,
    harness_dir: results.harness_dir,
    kind: results.kind ?? "pact-harness",
    promotable: results.promotable ?? (results.kind ?? "pact-harness") === "pact-harness",
    total,
    pass,
    resolved,
    fail,
    timeout,
    infra,
    skipped,
    verification_passed: verificationPassed,
    final_hidden_gate_passed: finalHiddenGatePassed,
    valid_patch: validPatch,
    average_round_count: averageRoundCount,
    pass_rate: total === 0 ? 0 : pass / total,
    resolved_rate: total === 0 ? 0 : resolved / total,
    score: Number(results.case_results.reduce((sum, entry) => sum + scoreCase(entry), 0).toFixed(3)),
  }
}

export function compareHarnessVariants(input: {
  promotion: HarnessPromotionPolicy
  baseline: HarnessVariantResults
  variants: HarnessVariantResults[]
}): HarnessVariantSelection {
  const baseline = summarizeHarnessVariant(input.baseline)
  const variants = input.variants.map(summarizeHarnessVariant).sort(compareSummaries)
  const winner = variants.find((variant) => variant.promotable)
  const winnerResults = winner
    ? input.variants.find((variant) => variant.harness_id === winner.harness_id)?.case_results ?? []
    : []
  const regressions = winner ? detectRegressions(input.baseline.case_results, winnerResults) : []
  const timeoutDelta = winner ? winner.timeout - baseline.timeout : 0
  const infraDelta = winner ? winner.infra - baseline.infra : 0
  const improved =
    !!winner &&
    winner.score > baseline.score &&
    (winner.pass > baseline.pass || winner.resolved > baseline.resolved || winner.pass_rate > baseline.pass_rate)

  let shouldPromote = false
  let reason = input.variants.length === 0 ? "no candidate harness supplied" : "no promotable candidate harness supplied"
  if (winner) {
    if (input.promotion === "report-only") {
      reason = "report-only promotion policy"
    } else if (input.promotion === "guarded") {
      if (!improved) reason = "blocked: candidate did not improve baseline score"
      else if (regressions.length > 0) reason = `blocked: regression on ${regressions.map((entry) => entry.case_id).join(", ")}`
      else if (timeoutDelta > 0) reason = "blocked: candidate increased timeouts"
      else if (infraDelta > 0) reason = "blocked: candidate increased infra failures"
      else {
        shouldPromote = true
        reason = "improved score with no guarded regressions"
      }
    } else {
      shouldPromote = improved && infraDelta <= 0
      reason = shouldPromote ? "aggressive promotion accepted improved candidate" : "aggressive promotion found no improvement"
    }
  }

  return {
    promotion: input.promotion,
    baseline,
    variants,
    winner,
    should_promote: shouldPromote,
    reason,
    regressions,
    timeout_delta: timeoutDelta,
    infra_delta: infraDelta,
  }
}

export function evaluateHarnessChanges(input: {
  manifest: HarnessChangeManifest
  baseline_results: HarnessCaseResult[]
  candidate_results: HarnessCaseResult[]
}): HarnessChangeEvaluation {
  const predictedFixes = unique([
    ...(input.manifest.predicted_fixes ?? []),
    ...(input.manifest.changes ?? []).flatMap((entry) => entry.predicted_fixes ?? []),
  ])
  const riskCases = unique([
    ...(input.manifest.risk_cases ?? []),
    ...(input.manifest.changes ?? []).flatMap((entry) => entry.risk_cases ?? []),
  ])
  const changedFiles = unique([
    ...(input.manifest.changed_harness_files ?? []),
    ...(input.manifest.changes ?? []).flatMap((entry) => entry.changed_harness_files ?? entry.files ?? []),
  ])
  const baselineByCase = caseMap(input.baseline_results)
  const candidateByCase = caseMap(input.candidate_results)

  const predictedFixed: string[] = []
  const stillFailed: string[] = []
  const alreadyPassing: string[] = []
  for (const caseID of predictedFixes) {
    const baseline = baselineByCase.get(caseID)
    const candidate = candidateByCase.get(caseID)
    if (baseline && caseResolved(baseline)) {
      alreadyPassing.push(caseID)
    } else if (candidate && caseResolved(candidate)) {
      predictedFixed.push(caseID)
    } else {
      stillFailed.push(caseID)
    }
  }

  const riskSet = new Set(riskCases)
  const regressions = detectRegressions(input.baseline_results, input.candidate_results)
  const riskRealized = regressions.filter((entry) => riskSet.has(entry.case_id)).map((entry) => entry.case_id)
  const unattributedRegressions = regressions
    .filter((entry) => !riskSet.has(entry.case_id))
    .map((entry) => entry.case_id)

  let verdict: HarnessChangeEvaluation["verdict"] = "ineffective"
  if (unattributedRegressions.length > 0 || riskRealized.length > 0) {
    verdict = predictedFixed.length > 0 && unattributedRegressions.length === 0 ? "mixed" : "harmful"
  } else if (predictedFixed.length > 0 && stillFailed.length === 0) {
    verdict = "effective"
  } else if (predictedFixed.length > 0) {
    verdict = "partially_effective"
  }

  return {
    variant_id: input.manifest.variant_id ?? "candidate",
    predicted_fixed: predictedFixed,
    still_failed: stillFailed,
    already_passing: alreadyPassing,
    risk_realized: riskRealized,
    unattributed_regressions: unattributedRegressions,
    changed_harness_files: changedFiles,
    verdict,
  }
}

export function parseLolbenchResultsCsv(text: string): Record<string, string>[] {
  const rows = parseCsvRows(text)
  if (rows.length === 0) return []
  const headers = rows[0] ?? []
  return rows.slice(1).map((row) => {
    const record: Record<string, string> = {}
    headers.forEach((header, index) => {
      record[header] = row[index] ?? ""
    })
    return record
  })
}

export function harnessCaseResultFromLolbenchCsv(
  text: string,
  input: { caseId: string; targetSuites?: string[]; artifactsDir?: string },
): HarnessCaseResult {
  const allRows = parseLolbenchResultsCsv(text).filter((row) => row.instance_id === input.caseId)
  const targetSuites = input.targetSuites?.filter(Boolean) ?? []
  const rows =
    targetSuites.length === 0 ? allRows : allRows.filter((row) => targetSuites.includes(row.suite ?? ""))
  if (rows.length === 0) {
    return {
      case_id: input.caseId,
      status: "infra",
      resolved: false,
      verification_status: "infra_failed",
      final_hidden_gate: "unknown",
      patch_quality: "unknown",
      stop_reason: "missing_lolbench_result",
      artifacts_dir: input.artifactsDir,
      infra_error: targetSuites.length
        ? `No LoLBench result row for ${input.caseId} suites ${targetSuites.join(", ")}`
        : `No LoLBench result row for ${input.caseId}`,
    }
  }

  const timeout = rows.some(isLolbenchTimeoutRow)
  const infra = rows.some(isLolbenchInfraRow)
  const allTargetsPresent =
    targetSuites.length === 0 || targetSuites.every((suite) => rows.some((row) => row.suite === suite))
  const resolved = allTargetsPresent && rows.length > 0 && rows.every((row) => truthy(row.resolved))
  const patchQuality = lolbenchPatchQuality(rows)
  const roundCount = firstNumericField(rows, [
    "pact_completed_worker_rounds",
    "pact_attempted_worker_rounds",
    "pact_reviewed_worker_rounds",
    "pact_next_round",
    "agent_attempts",
  ])

  let status: HarnessCaseResult["status"] = "fail"
  if (timeout) status = "timeout"
  else if (infra) status = "infra"
  else if (resolved) status = "pass"

  const finalHiddenGate = normalizeHiddenGate(firstNonEmptyField(rows, ["pact_final_hidden_gate_status"]), status)
  const stopReason = firstNonEmptyField(rows, ["pact_stop_reason", "agent_status", "suite_status"])
  const note = firstNonEmptyField(rows, ["note", "error_categories", "suite_status"])

  return {
    case_id: input.caseId,
    status,
    resolved,
    stop_reason: stopReason,
    round_count: roundCount,
    verification_status:
      status === "pass" ? "passed" : status === "timeout" ? "timeout" : status === "infra" ? "infra_failed" : "failed",
    final_hidden_gate: finalHiddenGate,
    timeout,
    patch_quality: patchQuality,
    artifacts_dir: input.artifactsDir,
    infra_error: status === "infra" ? note : undefined,
  }
}

export function harnessCaseResultFromHarborTrial(
  trialResult: unknown,
  input: {
    caseId: string
    artifactsDir?: string
    pactState?: Record<string, unknown>
    patchText?: string
  },
): HarnessCaseResult {
  const trial = asRecord(typeof trialResult === "string" ? JSON.parse(trialResult) : trialResult)
  const verifierResult = asRecord(trial.verifier_result)
  const rewards = asRecord(verifierResult.rewards)
  const rewardValues = Object.values(rewards).filter((value): value is number => typeof value === "number" && Number.isFinite(value))
  const reward = typeof rewards.reward === "number" ? rewards.reward : rewardValues.length ? Math.min(...rewardValues) : 0
  const exception = asRecord(trial.exception_info)
  const exceptionText = `${stringField(exception, "exception_type") ?? ""} ${stringField(exception, "exception_message") ?? ""}`.trim()
  const timeout = /timeout|timed out/i.test(exceptionText)
  const hasException = Object.keys(exception).length > 0
  const resolved = reward >= 1 && !hasException
  const status: HarnessCaseResult["status"] = timeout ? "timeout" : hasException ? "infra" : resolved ? "pass" : "fail"
  const state = input.pactState ?? {}
  const attempted = numericRecordField(state, "attempted_worker_rounds")
  const completed = numericRecordField(state, "completed_worker_rounds")
  const reviewed = numericRecordField(state, "reviewed_worker_rounds")
  const patchText = input.patchText ?? ""
  const patchLines = patchText
    ? patchText.split(/\r?\n/).filter((line) => /^\+(?!\+\+)/.test(line)).length
    : 0
  const agentExecution = asRecord(trial.agent_execution)
  const agentSeconds = elapsedSeconds(
    stringField(agentExecution, "started_at") ?? stringField(trial, "started_at"),
    stringField(agentExecution, "finished_at") ?? stringField(trial, "finished_at"),
  )

  return {
    case_id: input.caseId,
    status,
    resolved,
    reward,
    stop_reason: stringField(state, "stop_reason") ?? (hasException ? exceptionText : resolved ? "harbor_resolved" : "harbor_unresolved"),
    round_count: reviewed ?? completed ?? attempted,
    attempted_rounds: attempted,
    completed_rounds: completed,
    reviewed_rounds: reviewed,
    reviewer_decision: stringField(state, "last_review_decision") ?? stringField(state, "last_review_marker"),
    verification_status: resolved ? "passed" : timeout ? "timeout" : hasException ? "infra_failed" : "failed",
    final_hidden_gate: resolved ? "passed" : timeout ? "timeout" : "failed",
    verifier_status: resolved ? "passed" : "failed",
    timeout,
    patch_quality: patchText ? (patchLines > 0 ? "valid" : "malformed") : "empty",
    patch_lines: patchLines,
    agent_seconds: agentSeconds,
    artifacts_dir: input.artifactsDir,
    infra_error: hasException && !timeout ? exceptionText || "Harbor trial failed" : undefined,
  }
}

export async function runHarnessEvolution(input: {
  suite: HarnessSuite | string
  baselineHarnessDir: string
  variants: HarnessVariantInput[]
  iterations?: number
  promotion?: HarnessPromotionPolicy
  outputDir: string
  currentHarnessDir?: string
  runCase: HarnessCaseRunner
}): Promise<HarnessEvolutionResult> {
  const suite = typeof input.suite === "string" ? loadHarnessSuite(input.suite) : validateHarnessSuite(input.suite)
  const outputDir = resolve(input.outputDir)
  const iterations = Math.max(1, input.iterations ?? 1)
  const promotion = input.promotion ?? "guarded"
  const baselineHarness = loadPactHarness(input.baselineHarnessDir)
  if (!baselineHarness) throw new Error("Missing baseline harness")
  for (const variant of input.variants) {
    const normalized = normalizeVariantInput(variant)
    if (normalized.kind === "pact-harness" && !loadPactHarness(normalized.harnessDir)) {
      throw new Error(`Missing variant harness: ${normalized.harnessDir}`)
    }
  }

  mkdirSync(outputDir, { recursive: true })
  const iterationResults: HarnessEvolutionIteration[] = []

  for (let iteration = 1; iteration <= iterations; iteration++) {
    const iterationDir = join(outputDir, `iteration-${String(iteration).padStart(3, "0")}`)
    mkdirSync(iterationDir, { recursive: true })

    const baseline = await evaluateHarnessOnSuite({
      suite,
      harnessId: baselineHarness.manifest.id,
      harnessDir: baselineHarness.dir,
      kind: "pact-harness",
      promotable: true,
      outputDir: join(iterationDir, "baseline"),
      iteration,
      runCase: input.runCase,
    })
    const variants: HarnessVariantResults[] = []
    const changeEvaluations: HarnessChangeEvaluation[] = []
    for (const variant of input.variants) {
      const normalized = normalizeVariantInput(variant)
      const harness = normalized.kind === "pact-harness" ? loadPactHarness(normalized.harnessDir) : undefined
      const harnessId = variant.id || harness?.manifest.id || basename(normalized.harnessDir)
      const changeManifest = variant.changeManifest ?? loadVariantChangeManifest(normalized.kind, normalized.harnessDir)
      const variantResults = await evaluateHarnessOnSuite({
        suite,
        harnessId,
        harnessDir: normalized.kind === "pact-harness" ? resolve(normalized.harnessDir) : normalized.harnessDir,
        kind: normalized.kind,
        promotable: normalized.promotable,
        outputDir: join(iterationDir, "variants", harnessId),
        iteration,
        runCase: input.runCase,
      })
      variants.push(variantResults)
      if (changeManifest) {
        const manifest = { ...changeManifest, variant_id: changeManifest.variant_id ?? harnessId }
        const variantDir = join(iterationDir, "variants", harnessId)
        writeJsonFile(join(variantDir, "change_manifest.json"), manifest)
        const evaluation = evaluateHarnessChanges({
          manifest,
          baseline_results: baseline.case_results,
          candidate_results: variantResults.case_results,
        })
        changeEvaluations.push(evaluation)
        writeJsonFile(join(variantDir, "change_evaluation.json"), evaluation)
      }
    }

    const selection = compareHarnessVariants({ promotion, baseline, variants })
    writeJsonFile(join(iterationDir, "case_results.json"), { baseline, variants })
    writeJsonFile(join(iterationDir, "iteration_scores.json"), {
      baseline: summarizeHarnessVariant(baseline),
      variants: variants.map(summarizeHarnessVariant),
    })
    writeJsonFile(join(iterationDir, "change_evaluation.json"), changeEvaluations)
    writeJsonFile(join(iterationDir, "variant_selection.json"), selection)

    if (selection.should_promote && input.currentHarnessDir && selection.winner?.harness_dir) {
      replaceDirectory(selection.winner.harness_dir, input.currentHarnessDir)
    }

    iterationResults.push({
      iteration,
      iteration_dir: iterationDir,
      baseline,
      variants,
      selection,
      change_evaluations: changeEvaluations,
    })
    writeEvolutionHistory(outputDir, iterationResults)
  }

  return { output_dir: outputDir, suite, iterations: iterationResults }
}

export function harnessEvolveCliArgs(raw: string[]): {
  suite?: string
  baselineHarness?: string
  variants: HarnessVariantInput[]
  variantCount?: number
  iterations: number
  promotion: HarnessPromotionPolicy
  output?: string
  currentHarness?: string
  runnerCommand?: string
} {
  const parsed: Record<string, string[]> = {}
  for (let index = 0; index < raw.length; index++) {
    const token = raw[index]
    if (!token.startsWith("--")) throw new Error(`Unexpected argument: ${token}`)
    const key = token.slice(2)
    const value = raw[index + 1]
    if (!value || value.startsWith("--")) throw new Error(`Missing value for --${key}`)
    index++
    parsed[key] ??= []
    parsed[key].push(value)
  }
  const promotion = (parsed.promotion?.[0] ?? "guarded") as HarnessPromotionPolicy
  if (!["guarded", "report-only", "aggressive"].includes(promotion)) {
    throw new Error(`Unsupported PACT harness promotion policy: ${promotion}`)
  }
  return {
    suite: parsed.suite?.[0],
    baselineHarness: parsed["baseline-harness"]?.[0],
    variants: [
      ...(parsed["variant-harness"] ?? []).map(parseVariantHarnessArg),
      ...(parsed["control-variant"] ?? []).map(parseControlVariantArg),
    ],
    variantCount: parsed.variants?.[0] ? Number(parsed.variants[0]) : undefined,
    iterations: parsed.iterations?.[0] ? Number(parsed.iterations[0]) : 1,
    promotion,
    output: parsed.output?.[0],
    currentHarness: parsed["current-harness"]?.[0],
    runnerCommand: parsed["runner-command"]?.[0],
  }
}

function validateHarnessSuiteCase(
  value: unknown,
  index: number,
  benchmark?: HarnessBenchmark,
  defaultMaxRounds?: number,
): HarnessSuiteCase {
  if (!value || typeof value !== "object") throw new Error(`PACT harness suite case ${index} must be an object`)
  const record = value as Record<string, unknown>
  if (typeof record.id !== "string" || !record.id) throw new Error(`PACT harness suite case ${index} missing id`)
  const maxRounds = positiveNumber(record.max_rounds) ?? defaultMaxRounds
  if (!maxRounds) {
    throw new Error(`PACT harness suite case ${record.id} missing positive max_rounds`)
  }
  if (benchmark === "swebench-pro-harbor") {
    if (typeof record.instance_id !== "string" || !record.instance_id) {
      throw new Error(`PACT harness suite case ${record.id} missing instance_id`)
    }
    if (typeof record.task_path !== "string" || !record.task_path) {
      throw new Error(`PACT harness suite case ${record.id} missing task_path`)
    }
    if (record.language !== undefined && typeof record.language !== "string") {
      throw new Error(`PACT harness suite case ${record.id} has invalid language`)
    }
  } else if (typeof record.resume_loop_dir !== "string" || !record.resume_loop_dir) {
    throw new Error(`PACT harness suite case ${record.id} missing resume_loop_dir`)
  }
  if (record.verification_command !== undefined && typeof record.verification_command !== "string") {
    throw new Error(`PACT harness suite case ${record.id} has invalid verification_command`)
  }
  if (
    record.target_suites !== undefined &&
    (!Array.isArray(record.target_suites) || record.target_suites.some((suite) => typeof suite !== "string"))
  ) {
    throw new Error(`PACT harness suite case ${record.id} has invalid target_suites`)
  }
  if (record.tags !== undefined && (!Array.isArray(record.tags) || record.tags.some((tag) => typeof tag !== "string"))) {
    throw new Error(`PACT harness suite case ${record.id} has invalid tags`)
  }
  return {
    id: record.id,
    resume_loop_dir: record.resume_loop_dir as string | undefined,
    instance_id: record.instance_id as string | undefined,
    task_path: record.task_path as string | undefined,
    language: record.language as string | undefined,
    repo: record.repo as string | undefined,
    max_rounds: maxRounds,
    verification_command: record.verification_command,
    target_suites: record.target_suites,
    tags: record.tags,
  }
}

function validateHarnessBenchmark(value: unknown): HarnessBenchmark {
  if (value === "ScaleAI/SWE-bench_Pro") return "swebench-pro-harbor"
  if (value === "lolbench" || value === "swebench-pro-harbor") return value
  throw new Error(`Unsupported PACT harness benchmark: ${String(value)}`)
}

function positiveNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 1 ? value : undefined
}

function scoreCase(result: HarnessCaseResult): number {
  let score = 0
  if (result.status === "pass") score += 100
  else if (result.resolved) score += 85
  if (result.verification_status === "passed") score += 10
  if (result.final_hidden_gate === "passed") score += 15
  if (result.patch_quality === "valid") score += 5
  if (typeof result.round_count === "number" && Number.isFinite(result.round_count)) {
    score += Math.max(0, 8 - Math.min(result.round_count, 8))
  }
  if (result.status === "timeout" || result.timeout) score -= 50
  if (result.status === "infra") score -= 75
  if (result.patch_quality === "empty" || result.patch_quality === "malformed") score -= 20
  return score
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false

  for (let index = 0; index < text.length; index++) {
    const char = text[index]
    if (inQuotes) {
      if (char === "\"") {
        if (text[index + 1] === "\"") {
          field += "\""
          index++
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
      continue
    }

    if (char === "\"") {
      inQuotes = true
    } else if (char === ",") {
      row.push(field)
      field = ""
    } else if (char === "\n") {
      row.push(field)
      rows.push(row)
      row = []
      field = ""
    } else if (char !== "\r") {
      field += char
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((entry) => entry.some((value) => value.length > 0))
}

function isLolbenchTimeoutRow(row: Record<string, string>): boolean {
  return row.agent_status === "agent_timeout" || row.suite_status === "timeout" || row.pact_final_hidden_gate_status === "timeout"
}

function isLolbenchInfraRow(row: Record<string, string>): boolean {
  const haystack = [
    row.image_build_status,
    row.agent_status,
    row.suite_status,
    row.error_categories,
    row.pact_stop_reason,
    row.note,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
  if (haystack.includes("empty_patch")) return false
  return [
    "build_failed",
    "seed_failed",
    "image_failed",
    "agent_image_failed",
    "model_unavailable",
    "missing_instructions",
    "no_patch_to_reuse",
    "docker build",
    "infrastructure",
    "infra",
  ].some((marker) => haystack.includes(marker))
}

function lolbenchPatchQuality(rows: Record<string, string>[]): HarnessCaseResult["patch_quality"] {
  if (rows.some((row) => /malformed|rejected|cheat/i.test(`${row.suite_status} ${row.error_categories} ${row.note}`))) {
    return "malformed"
  }
  const patchLines = firstNumericField(rows, ["patch_lines"])
  if (patchLines === 0) return "empty"
  if (typeof patchLines === "number" && patchLines > 0) return "valid"
  return "unknown"
}

function firstNonEmptyField(rows: Record<string, string>[], fields: string[]): string | undefined {
  for (const row of rows) {
    for (const field of fields) {
      const value = row[field]?.trim()
      if (value) return value
    }
  }
  return undefined
}

function firstNumericField(rows: Record<string, string>[], fields: string[]): number | undefined {
  for (const row of rows) {
    for (const field of fields) {
      const value = row[field]?.trim()
      if (!value) continue
      const parsed = Number(value)
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return undefined
}

function truthy(value: string | undefined): boolean {
  return /^(true|1|yes|resolved)$/i.test((value ?? "").trim())
}

function normalizeHiddenGate(
  raw: string | undefined,
  status: HarnessCaseResult["status"],
): HarnessCaseResult["final_hidden_gate"] {
  const value = (raw ?? "").trim().toLowerCase()
  if (value === "passed" || value === "pass" || value === "resolved") return "passed"
  if (value === "failed" || value === "fail" || value === "unresolved") return "failed"
  if (value === "timeout") return "timeout"
  if (value === "not_run" || value === "not-run") return "not_run"
  if (status === "pass") return "passed"
  if (status === "timeout") return "timeout"
  if (status === "fail" || status === "infra") return "failed"
  return "unknown"
}

function caseResolved(result: HarnessCaseResult | undefined): boolean {
  if (!result) return false
  return result.status === "pass" || result.resolved === true || result.final_hidden_gate === "passed"
}

function compareSummaries(left: HarnessScoreSummary, right: HarnessScoreSummary): number {
  return (
    right.score - left.score ||
    right.pass - left.pass ||
    right.resolved - left.resolved ||
    left.timeout - right.timeout ||
    left.infra - right.infra ||
    left.harness_id.localeCompare(right.harness_id)
  )
}

function detectRegressions(
  baselineResults: HarnessCaseResult[],
  candidateResults: HarnessCaseResult[],
): HarnessRegression[] {
  const candidateByCase = caseMap(candidateResults)
  return baselineResults
    .filter(caseResolved)
    .map((baseline) => {
      const candidate = candidateByCase.get(baseline.case_id)
      if (caseResolved(candidate)) return undefined
      return {
        case_id: baseline.case_id,
        baseline_status: baseline.status,
        candidate_status: candidate?.status ?? "missing",
      }
    })
    .filter((entry): entry is HarnessRegression => !!entry)
}

function caseMap(results: HarnessCaseResult[]): Map<string, HarnessCaseResult> {
  return new Map(results.map((entry) => [entry.case_id, entry]))
}

export async function evaluateHarnessOnSuite(input: {
  suite: HarnessSuite
  harnessId: string
  harnessDir: string
  kind: HarnessVariantKind
  promotable: boolean
  outputDir: string
  iteration: number
  runCase: HarnessCaseRunner
}): Promise<HarnessVariantResults> {
  mkdirSync(input.outputDir, { recursive: true })
  const caseResults: HarnessCaseResult[] = []
  for (const caseItem of input.suite.cases) {
    const caseOutputDir = join(input.outputDir, caseItem.id)
    mkdirSync(caseOutputDir, { recursive: true })
    const result = await input.runCase({
      caseItem,
      harnessId: input.harnessId,
      harnessDir: input.harnessDir,
      kind: input.kind,
      promotable: input.promotable,
      outputDir: caseOutputDir,
      iteration: input.iteration,
    })
    const normalized = { ...result, case_id: result.case_id || caseItem.id, artifacts_dir: result.artifacts_dir ?? caseOutputDir }
    caseResults.push(normalized)
    writeJsonFile(join(caseOutputDir, "case_result.json"), normalized)
  }
  return {
    harness_id: input.harnessId,
    harness_dir: input.harnessDir,
    kind: input.kind,
    promotable: input.promotable,
    case_results: caseResults,
  }
}

function writeEvolutionHistory(outputDir: string, iterations: HarnessEvolutionIteration[]): void {
  const lines = [
    "# PACT Harness Evolution History",
    "",
    "| Iteration | Winner | Promote | Reason | Baseline Score | Winner Score |",
    "| --- | --- | --- | --- | ---: | ---: |",
  ]
  for (const iteration of iterations) {
    const selection = iteration.selection
    lines.push(
      `| ${iteration.iteration} | ${selection.winner?.harness_id ?? "(none)"} | ${
        selection.should_promote ? "yes" : "no"
      } | ${escapeMarkdownTable(selection.reason)} | ${selection.baseline.score} | ${
        selection.winner?.score ?? 0
      } |`,
    )
  }
  writeFileSync(join(outputDir, "evolution_history.md"), `${lines.join("\n")}\n`, "utf-8")
}

function replaceDirectory(sourceDir: string, targetDir: string): void {
  const source = resolve(sourceDir)
  const target = resolve(targetDir)
  if (source === target) return
  rmSync(target, { recursive: true, force: true })
  copyDirectory(source, target)
}

function copyDirectory(sourceDir: string, targetDir: string): void {
  mkdirSync(targetDir, { recursive: true })
  for (const name of readdirSync(sourceDir)) {
    const sourcePath = join(sourceDir, name)
    const targetPath = join(targetDir, name)
    const stat = statSync(sourcePath)
    if (stat.isDirectory()) copyDirectory(sourcePath, targetPath)
    else copyFileSync(sourcePath, targetPath)
  }
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))]
}

function parseVariantHarnessArg(value: string): HarnessVariantInput {
  const equals = value.indexOf("=")
  if (equals === -1) {
    return { id: basename(value), harnessDir: value, kind: "pact-harness", promotable: true }
  }
  return { id: value.slice(0, equals), harnessDir: value.slice(equals + 1), kind: "pact-harness", promotable: true }
}

function parseControlVariantArg(value: string): HarnessVariantInput {
  const equals = value.indexOf("=")
  if (equals === -1) {
    return { id: value, harnessDir: value, kind: "humanize-opencode", promotable: false }
  }
  const id = value.slice(0, equals)
  const rest = value.slice(equals + 1)
  if (rest !== "humanize-opencode") {
    throw new Error(`Unsupported control variant kind: ${rest}`)
  }
  return { id, harnessDir: id, kind: "humanize-opencode", promotable: false }
}

function normalizeVariantInput(input: HarnessVariantInput): Required<Pick<HarnessVariantInput, "id" | "harnessDir" | "kind" | "promotable">> {
  const kind = input.kind ?? "pact-harness"
  if (kind !== "pact-harness" && kind !== "humanize-opencode") {
    throw new Error(`Unsupported harness variant kind: ${String(kind)}`)
  }
  const promotable = input.promotable ?? kind === "pact-harness"
  const harnessDir = input.harnessDir ?? input.id
  if (kind === "pact-harness" && !input.harnessDir) {
    throw new Error(`PACT harness variant missing harnessDir: ${input.id}`)
  }
  return { id: input.id, harnessDir, kind, promotable }
}

function loadVariantChangeManifest(kind: HarnessVariantKind, harnessDir: string): HarnessChangeManifest | undefined {
  if (kind !== "pact-harness") return undefined
  const manifestPath = join(harnessDir, "change_manifest.json")
  if (!existsSync(manifestPath)) return undefined
  return JSON.parse(readFileSync(manifestPath, "utf-8")) as HarnessChangeManifest
}

function escapeMarkdownTable(value: string): string {
  return value.replaceAll("|", "\\|").replace(/\s+/g, " ").trim()
}

function renderRunnerCommand(template: string, values: Record<string, string | number | undefined>): string {
  return template.replace(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (match, key: string) => {
    const value = values[key]
    return value === undefined ? match : shellQuote(String(value))
  })
}

function shellQuote(value: string): string {
  return `'${value.replaceAll("'", "'\\''")}'`
}

export function runExternalCase(input: {
  runnerCommand: string
  caseItem: HarnessSuiteCase
  harnessId: string
  harnessDir: string
  kind?: HarnessVariantKind
  promotable?: boolean
  outputDir: string
}): HarnessCaseResult {
  const command = renderRunnerCommand(input.runnerCommand, {
    case_id: input.caseItem.id,
    resume_loop_dir: input.caseItem.resume_loop_dir,
    instance_id: input.caseItem.instance_id,
    task_path: input.caseItem.task_path,
    language: input.caseItem.language,
    repo: input.caseItem.repo,
    max_rounds: input.caseItem.max_rounds,
    verification_command: input.caseItem.verification_command,
    harness_id: input.harnessId,
    harness_dir: input.harnessDir,
    variant_kind: input.kind,
    promotable: input.promotable === undefined ? undefined : String(input.promotable),
    output_dir: input.outputDir,
  })
  const result = spawnSync(command, { shell: true, encoding: "utf-8", maxBuffer: 1024 * 1024 * 64 })
  const caseResultPath = join(input.outputDir, "case_result.json")
  if (existsSync(caseResultPath)) {
    return JSON.parse(readFileSync(caseResultPath, "utf-8")) as HarnessCaseResult
  }
  const lolbenchResultsPath = join(input.outputDir, "results.csv")
  if (existsSync(lolbenchResultsPath)) {
    return harnessCaseResultFromLolbenchCsv(readFileSync(lolbenchResultsPath, "utf-8"), {
      caseId: input.caseItem.id,
      targetSuites: input.caseItem.target_suites,
      artifactsDir: input.outputDir,
    })
  }
  if (result.status === 0 && result.stdout.trim()) {
    return JSON.parse(result.stdout) as HarnessCaseResult
  }
  return {
    case_id: input.caseItem.id,
    status: result.status === 0 ? "skipped" : "infra",
    resolved: false,
    stop_reason: result.status === 0 ? "runner_returned_no_case_result" : "runner_failed",
    infra_error: result.stderr || result.stdout || result.error?.message,
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

function stringField(record: Record<string, unknown>, key: string): string | undefined {
  return typeof record[key] === "string" && record[key] ? record[key] : undefined
}

function numericRecordField(record: Record<string, unknown>, key: string): number | undefined {
  return typeof record[key] === "number" && Number.isFinite(record[key]) ? record[key] : undefined
}

function elapsedSeconds(start: string | undefined, finish: string | undefined): number | undefined {
  if (!start || !finish) return undefined
  const startMs = Date.parse(start)
  const finishMs = Date.parse(finish)
  if (!Number.isFinite(startMs) || !Number.isFinite(finishMs) || finishMs < startMs) return undefined
  return (finishMs - startMs) / 1000
}

if (import.meta.main) {
  const args = harnessEvolveCliArgs(process.argv.slice(2))
  if (!args.suite) throw new Error("Missing --suite")
  if (!args.baselineHarness) throw new Error("Missing --baseline-harness")
  if (!args.output) throw new Error("Missing --output")
  if (args.variants.length === 0) {
    throw new Error("Missing --variant-harness. Candidate generation is intentionally external to this driver.")
  }
  if (!args.runnerCommand) throw new Error("Missing --runner-command")
  const result = await runHarnessEvolution({
    suite: args.suite,
    baselineHarnessDir: args.baselineHarness,
    variants: args.variants,
    iterations: args.iterations,
    promotion: args.promotion,
    outputDir: args.output,
    currentHarnessDir: args.currentHarness,
    runCase({ caseItem, harnessId, harnessDir, kind, promotable, outputDir }) {
      return runExternalCase({
        runnerCommand: args.runnerCommand ?? "",
        caseItem,
        harnessId,
        harnessDir,
        kind,
        promotable,
        outputDir,
      })
    },
  })
  process.stdout.write(`${JSON.stringify(result.iterations.at(-1)?.selection ?? {}, null, 2)}\n`)
}
