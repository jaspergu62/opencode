import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join, resolve } from "node:path"

import {
  evaluateHarnessOnSuite,
  loadHarnessSuite,
  runExternalCase,
  summarizeHarnessVariant,
  type HarnessCaseRunner,
  type HarnessVariantResults,
} from "./pact-harness-evolve"
import { runAheHarnessEvolution, type AheEvolutionResult } from "./pact-harness-ahe"

export type SWEbenchProExperimentOptions = {
  evolutionSuite: string
  holdoutSuite: string
  baselineHarnessDir: string
  variantsRoot: string
  outputDir: string
  harborDir: string
  worktreeDir: string
  keyFile: string
  codexCommand: string
}

export async function runSWEbenchProExperiment(input: SWEbenchProExperimentOptions) {
  const outputDir = resolve(input.outputDir)
  mkdirSync(outputDir, { recursive: true })
  const runnerCommand = [
    "bun",
    join(resolve(input.worktreeDir), ".opencode", "plugins", "pact", "pact-harbor-case.ts"),
    "--task-path {task_path}",
    "--case-id {case_id}",
    "--harness-dir {harness_dir}",
    "--output-dir {output_dir}",
    `--harbor-dir ${shellQuote(resolve(input.harborDir))}`,
    `--worktree-dir ${shellQuote(resolve(input.worktreeDir))}`,
    `--key-file ${shellQuote(resolve(input.keyFile))}`,
    "--max-rounds {max_rounds}",
    "--model openrouter/z-ai/glm-5.2",
  ].join(" ")
  const runCase: HarnessCaseRunner = (args) => {
    const cached = join(args.outputDir, "case_result.json")
    if (existsSync(cached)) return JSON.parse(readFileSync(cached, "utf-8"))
    return runExternalCase({
      runnerCommand,
      caseItem: args.caseItem,
      harnessId: args.harnessId,
      harnessDir: args.harnessDir,
      kind: args.kind,
      promotable: args.promotable,
      outputDir: args.outputDir,
    })
  }

  const evolution = await runAheHarnessEvolution({
    suite: input.evolutionSuite,
    baselineHarnessDir: input.baselineHarnessDir,
    variantsRoot: input.variantsRoot,
    outputDir: join(outputDir, "evolution"),
    iterations: 3,
    runCase,
    codexCommand: input.codexCommand,
    worktreeDir: input.worktreeDir,
  })
  writeFileSync(join(outputDir, "evolution-report.md"), renderEvolutionReport(evolution), "utf-8")

  // Holdout is deliberately loaded only after the evolution winner is frozen.
  const holdoutSuite = loadHarnessSuite(input.holdoutSuite)
  const holdoutBaseline = await evaluateHarnessOnSuite({
    suite: holdoutSuite,
    harnessId: "baseline",
    harnessDir: resolve(input.baselineHarnessDir),
    kind: "pact-harness",
    promotable: true,
    outputDir: join(outputDir, "holdout", "baseline"),
    iteration: 0,
    runCase,
  })
  const holdoutWinner =
    evolution.winner.harness_id === "baseline"
      ? undefined
      : await evaluateHarnessOnSuite({
          suite: holdoutSuite,
          harnessId: evolution.winner.harness_id,
          harnessDir: evolution.winner.harness_dir,
          kind: "pact-harness",
          promotable: true,
          outputDir: join(outputDir, "holdout", evolution.winner.harness_id),
          iteration: 4,
          runCase,
        })
  writeFileSync(join(outputDir, "holdout-report.md"), renderHoldoutReport(holdoutBaseline, holdoutWinner), "utf-8")
  writeFileSync(
    join(outputDir, "final-harness-comparison.md"),
    renderFinalComparison(evolution, holdoutBaseline, holdoutWinner),
    "utf-8",
  )
  return { evolution, holdoutBaseline, holdoutWinner }
}

export function renderEvolutionReport(evolution: AheEvolutionResult): string {
  const runs = [evolution.baseline, ...evolution.iterations.map((entry) => entry.candidate)]
  const lines = [
    "# SWE-bench Pro PACT 三轮演化报告",
    "",
    "本轮固定 evolution suite、GLM 5.2、PACT max rounds=3，并采用 report-only 选择策略。",
    "",
    scoreTable(runs),
    "",
    "## 逐轮选择",
    "",
    "| 轮次 | 候选 | 生成前 best | 生成后 best | 接受 | 原因 |",
    "| ---: | --- | --- | --- | --- | --- |",
  ]
  for (const item of evolution.iterations) {
    lines.push(`| ${item.iteration} | ${item.variant_id} | ${item.current_best_before} | ${item.current_best_after} | ${item.accepted_as_best ? "是" : "否"} | ${escapeTable(item.reason)} |`)
  }
  lines.push("", `冻结 winner：**${evolution.winner.harness_id}**。`, "")
  return lines.join("\n")
}

export function renderHoldoutReport(baseline: HarnessVariantResults, winner?: HarnessVariantResults): string {
  const lines = [
    "# SWE-bench Pro PACT Holdout 报告",
    "",
    winner
      ? "winner 在 evolution 完成后冻结；候选生成器未读取 holdout 输入或轨迹。"
      : "没有候选通过 evolution 门槛，因此只运行 baseline，避免重复执行同一 harness。",
    "",
    scoreTable(winner ? [baseline, winner] : [baseline]),
    "",
    caseTable(winner ? [baseline, winner] : [baseline]),
    "",
  ]
  return lines.join("\n")
}

export function renderFinalComparison(
  evolution: AheEvolutionResult,
  holdoutBaseline: HarnessVariantResults,
  holdoutWinner?: HarnessVariantResults,
): string {
  const evoBase = summarizeHarnessVariant(evolution.baseline)
  const evoWinner = summarizeHarnessVariant(evolution.winner)
  const holdBase = summarizeHarnessVariant(holdoutBaseline)
  const holdWinner = holdoutWinner ? summarizeHarnessVariant(holdoutWinner) : undefined
  const baselinePasses = new Set(holdoutBaseline.case_results.filter((item) => item.resolved).map((item) => item.case_id))
  const winnerPasses = new Set(holdoutWinner?.case_results.filter((item) => item.resolved).map((item) => item.case_id) ?? [])
  const holdoutRegressions = holdoutWinner ? [...baselinePasses].filter((id) => !winnerPasses.has(id)) : []
  const eligible =
    !!holdWinner &&
    evoWinner.resolved > evoBase.resolved &&
    holdWinner.resolved >= holdBase.resolved &&
    holdWinner.timeout <= holdBase.timeout &&
    holdWinner.infra <= holdBase.infra &&
    holdoutRegressions.length === 0
  const conclusion = eligible
    ? "具备 guarded promotion 条件，但本轮仍保持 report-only，不修改 pact-harness/current。"
    : "不具备 guarded promotion 条件，保持 baseline/current 不变。"
  return [
    "# SWE-bench Pro PACT 最终 Harness 对比",
    "",
    `Evolution winner：**${evolution.winner.harness_id}**。`,
    "",
    `- Evolution resolved：baseline ${evoBase.resolved}/${evoBase.total}；winner ${evoWinner.resolved}/${evoWinner.total}`,
    `- Holdout resolved：baseline ${holdBase.resolved}/${holdBase.total}；winner ${holdWinner ? `${holdWinner.resolved}/${holdWinner.total}` : "未运行"}`,
    `- Holdout baseline-pass regressions：${holdoutRegressions.length ? holdoutRegressions.join(", ") : "无"}`,
    `- Holdout timeout/infra：baseline ${holdBase.timeout}/${holdBase.infra}；winner ${holdWinner ? `${holdWinner.timeout}/${holdWinner.infra}` : "未运行"}`,
    "",
    `结论：**${conclusion}**`,
    "",
    "网络边界说明：本机 Docker Desktop kernel 不支持 Harbor v0.18 的 nftables allowlist sidecar；本次采用容器 hosts block、删除 git remotes、禁用 OpenCode web 工具的 fallback。它阻止已验证的代码托管与包站点，但不等价于任意域名级 allowlist。",
    "",
  ].join("\n")
}

function scoreTable(runs: HarnessVariantResults[]): string {
  const lines = [
    "| Harness | Resolved | Fail | Timeout | Infra | Valid patch | Avg rounds | Score |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
  ]
  for (const run of runs) {
    const score = summarizeHarnessVariant(run)
    lines.push(`| ${run.harness_id} | ${score.resolved}/${score.total} | ${score.fail} | ${score.timeout} | ${score.infra} | ${score.valid_patch} | ${score.average_round_count?.toFixed(2) ?? "-"} | ${score.score} |`)
  }
  return lines.join("\n")
}

function caseTable(runs: HarnessVariantResults[]): string {
  const lines = [
    "| Harness | Case | Status | Resolved | Reward | Rounds A/C/R | Patch lines | Stop reason |",
    "| --- | --- | --- | --- | ---: | --- | ---: | --- |",
  ]
  for (const run of runs) {
    for (const item of run.case_results) {
      lines.push(`| ${run.harness_id} | ${item.case_id} | ${item.status} | ${item.resolved ? "是" : "否"} | ${item.reward ?? 0} | ${item.attempted_rounds ?? "?"}/${item.completed_rounds ?? "?"}/${item.reviewed_rounds ?? "?"} | ${item.patch_lines ?? 0} | ${escapeTable(item.stop_reason ?? "unknown")} |`)
    }
  }
  return lines.join("\n")
}

function shellQuote(value: string): string {
  return `'${value.replaceAll("'", "'\\''")}'`
}

function escapeTable(value: string): string {
  return value.replaceAll("|", "\\|").replace(/\s+/g, " ").trim()
}

function cliArgs(raw: string[]): Record<string, string | undefined> {
  const parsed: Record<string, string | undefined> = {}
  const args = [...raw]
  while (args.length) {
    const key = args.shift()
    if (!key?.startsWith("--")) continue
    parsed[key.slice(2)] = args.shift()
  }
  return parsed
}

if (import.meta.main) {
  const args = cliArgs(process.argv.slice(2))
  for (const required of ["evolution-suite", "holdout-suite", "baseline-harness", "variants-root", "output", "harbor-dir", "worktree-dir", "key-file"] as const) {
    if (!args[required]) throw new Error(`Missing --${required}`)
  }
  const result = await runSWEbenchProExperiment({
    evolutionSuite: args["evolution-suite"]!,
    holdoutSuite: args["holdout-suite"]!,
    baselineHarnessDir: args["baseline-harness"]!,
    variantsRoot: args["variants-root"]!,
    outputDir: args.output!,
    harborDir: args["harbor-dir"]!,
    worktreeDir: args["worktree-dir"]!,
    keyFile: args["key-file"]!,
    codexCommand: args["codex-command"] ?? "codex",
  })
  process.stdout.write(`${JSON.stringify({ winner: result.evolution.winner.harness_id }, null, 2)}\n`)
}
