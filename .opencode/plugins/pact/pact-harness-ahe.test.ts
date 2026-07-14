import { describe, expect, test } from "bun:test"
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { runAheHarnessEvolution, strictBestDecision } from "./pact-harness-ahe"
import type { HarnessVariantResults } from "./pact-harness-evolve"

function tempDir(prefix: string): string {
  return mkdtempSync(join(tmpdir(), prefix))
}

function writeHarness(dir: string, id: string): void {
  mkdirSync(dir, { recursive: true })
  writeFileSync(
    join(dir, "manifest.json"),
    JSON.stringify({ schema: "pact-harness/v1", id, description: "test", templates: {} }),
  )
  writeFileSync(
    join(dir, "change_manifest.json"),
    JSON.stringify({
      schema: "pact-harness-change/v1",
      variant_id: id,
      changed_harness_files: ["manifest.json"],
      predicted_fixes: ["case-b"],
      risk_cases: ["case-a"],
      rationale: "test evidence workflow",
    }),
  )
}

describe("PACT AHE sequential evolution", () => {
  test("evaluates baseline once and keeps a strict resolved best across three candidates", async () => {
    const root = tempDir("pact-ahe-")
    const baselineDir = join(root, "baseline")
    writeHarness(baselineDir, "baseline")
    const calls: string[] = []
    const result = await runAheHarnessEvolution({
      suite: {
        benchmark: "swebench-pro-harbor",
        cases: [
          { id: "case-a", instance_id: "instance_org__repo-a", task_path: "/tmp/a", max_rounds: 3 },
          { id: "case-b", instance_id: "instance_org__repo-b", task_path: "/tmp/b", max_rounds: 3 },
        ],
      },
      baselineHarnessDir: baselineDir,
      variantsRoot: join(root, "variants"),
      outputDir: join(root, "output"),
      iterations: 3,
      generateVariant(input) {
        writeHarness(input.variantDir, input.variantId)
        return input.variantDir
      },
      runCase({ caseItem, harnessId }) {
        calls.push(`${harnessId}:${caseItem.id}`)
        const resolved =
          caseItem.id === "case-a" || harnessId === "swepro-ahe-v1" || harnessId === "swepro-ahe-v2"
        return {
          case_id: caseItem.id,
          status: resolved ? "pass" : harnessId === "swepro-ahe-v3" ? "timeout" : "fail",
          resolved,
          timeout: harnessId === "swepro-ahe-v3" && caseItem.id === "case-b",
          patch_quality: "valid",
        }
      },
    })

    expect(calls.filter((entry) => entry.startsWith("baseline:"))).toHaveLength(2)
    expect(calls).toHaveLength(8)
    expect(result.winner.harness_id).toBe("swepro-ahe-v1")
    expect(result.iterations.map((entry) => entry.accepted_as_best)).toEqual([true, false, false])
  })

  test("rejects resolved gains that regress a baseline pass", () => {
    const baseline: HarnessVariantResults = {
      harness_id: "baseline",
      harness_dir: "/tmp/base",
      case_results: [
        { case_id: "a", status: "pass", resolved: true },
        { case_id: "b", status: "fail", resolved: false },
        { case_id: "c", status: "fail", resolved: false },
      ],
    }
    const candidate: HarnessVariantResults = {
      harness_id: "candidate",
      harness_dir: "/tmp/candidate",
      case_results: [
        { case_id: "a", status: "fail", resolved: false },
        { case_id: "b", status: "pass", resolved: true },
        { case_id: "c", status: "pass", resolved: true },
      ],
    }
    expect(strictBestDecision(baseline, baseline, candidate)).toMatchObject({ accept: false })
  })
})
