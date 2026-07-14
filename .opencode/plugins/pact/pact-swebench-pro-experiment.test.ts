import { describe, expect, test } from "bun:test"

import { renderFinalComparison, renderHoldoutReport } from "./pact-swebench-pro-experiment"
import type { AheEvolutionResult } from "./pact-harness-ahe"
import type { HarnessVariantResults } from "./pact-harness-evolve"

const baseline: HarnessVariantResults = {
  harness_id: "baseline",
  harness_dir: "/base",
  case_results: [{ case_id: "a", status: "pass", resolved: true }],
}

describe("SWE-bench Pro experiment reports", () => {
  test("does not claim promotion when baseline remains winner", () => {
    const evolution: AheEvolutionResult = { baseline, iterations: [], winner: baseline }
    const report = renderFinalComparison(evolution, baseline)
    expect(report).toContain("不具备 guarded promotion 条件")
    expect(renderHoldoutReport(baseline)).toContain("只运行 baseline")
  })
})
