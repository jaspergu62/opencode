import { afterEach, describe, expect, test } from "bun:test"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import {
  compareHarnessVariants,
  evaluateHarnessChanges,
  harnessCaseResultFromLolbenchCsv,
  harnessEvolveCliArgs,
  loadHarnessSuite,
  runHarnessEvolution,
  type HarnessCaseResult,
  type HarnessChangeManifest,
} from "./pact-harness-evolve"

const tempDirs: string[] = []

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

function tempDir(prefix = "pact-harness-evolve-"): string {
  const dir = mkdtempSync(join(tmpdir(), prefix))
  tempDirs.push(dir)
  return dir
}

function writeHarness(dir: string, id: string): void {
  mkdirSync(dir, { recursive: true })
  writeFileSync(
    join(dir, "manifest.json"),
    JSON.stringify({ schema: "pact-harness/v1", id }, null, 2) + "\n",
    "utf-8",
  )
}

function result(caseID: string, status: HarnessCaseResult["status"], extra: Partial<HarnessCaseResult> = {}): HarnessCaseResult {
  return {
    case_id: caseID,
    status,
    resolved: status === "pass",
    verification_status: status === "pass" ? "passed" : "failed",
    final_hidden_gate: status === "pass" ? "passed" : "failed",
    round_count: status === "pass" ? 2 : 4,
    patch_quality: status === "pass" ? "valid" : "unknown",
    ...extra,
  }
}

describe("PACT harness evolution", () => {
  test("loads and validates a curated suite JSON", () => {
    const dir = tempDir()
    const suitePath = join(dir, "suite.json")
    writeFileSync(
      suitePath,
      JSON.stringify(
        {
          cases: [
            {
              id: "case-a",
              resume_loop_dir: "/tmp/round0/case-a",
              max_rounds: 6,
              verification_command: "python check.py",
              tags: ["smoke"],
            },
          ],
        },
        null,
        2,
      ) + "\n",
      "utf-8",
    )

    expect(loadHarnessSuite(suitePath)).toEqual({
      cases: [
        {
          id: "case-a",
          resume_loop_dir: "/tmp/round0/case-a",
          max_rounds: 6,
          verification_command: "python check.py",
          tags: ["smoke"],
        },
      ],
    })
  })

  test("loads the checked-in LoLBench mini-suite", () => {
    const suite = loadHarnessSuite(join(process.cwd(), "pact-harness", "suites", "lolbench-mini-suite.json"))

    expect(suite.cases.length).toBeGreaterThan(0)
    expect(suite.cases[0]?.resume_loop_dir).toContain("lolbench_pact_round0_imports")
  })

  test("loads the checked-in PEP615/646/680 suite", () => {
    const suite = loadHarnessSuite(join(process.cwd(), "pact-harness", "suites", "lolbench-pep615-646-680.json"))

    expect(suite.cases.map((caseItem) => caseItem.id)).toEqual([
      "CPython_PEP-615_Support-for-the-IANA-Time-Zone-Database-in-the-Standard-Library_PR-19909",
      "CPython_PEP-646_Variadic-Generics_PR-31018",
      "CPython_PEP-680_tomllib-Support-for-Parsing-TOML-in-the-Standard-Library_PR-31498",
    ])
    expect(suite.cases.every((caseItem) => existsSync(caseItem.resume_loop_dir))).toBe(true)
    expect(suite.cases.every((caseItem) => caseItem.target_suites?.includes("orig"))).toBe(true)
  })

  test("guarded selection promotes a better non-regressing candidate", () => {
    const selection = compareHarnessVariants({
      promotion: "guarded",
      baseline: {
        harness_id: "baseline",
        harness_dir: "/harness/baseline",
        case_results: [result("case-a", "pass"), result("case-b", "fail")],
      },
      variants: [
        {
          harness_id: "variant-a",
          harness_dir: "/harness/variant-a",
          case_results: [result("case-a", "pass"), result("case-b", "pass")],
        },
      ],
    })

    expect(selection.winner?.harness_id).toBe("variant-a")
    expect(selection.should_promote).toBe(true)
    expect(selection.reason).toContain("improved")
  })

  test("guarded selection rejects candidates with baseline-case regressions", () => {
    const selection = compareHarnessVariants({
      promotion: "guarded",
      baseline: {
        harness_id: "baseline",
        harness_dir: "/harness/baseline",
        case_results: [result("case-a", "pass"), result("case-b", "fail"), result("case-c", "fail")],
      },
      variants: [
        {
          harness_id: "variant-risk",
          harness_dir: "/harness/variant-risk",
          case_results: [result("case-a", "fail"), result("case-b", "pass"), result("case-c", "pass")],
        },
      ],
    })

    expect(selection.winner?.harness_id).toBe("variant-risk")
    expect(selection.should_promote).toBe(false)
    expect(selection.regressions).toEqual([{ case_id: "case-a", baseline_status: "pass", candidate_status: "fail" }])
    expect(selection.reason).toContain("regression")
  })

  test("selection reports non-promotable controls but only promotes PACT harness candidates", () => {
    const selection = compareHarnessVariants({
      promotion: "guarded",
      baseline: {
        harness_id: "baseline",
        harness_dir: "/harness/baseline",
        case_results: [result("case-a", "pass"), result("case-b", "fail")],
      },
      variants: [
        {
          harness_id: "humanize-opencode-glm52",
          harness_dir: "humanize-opencode-glm52",
          kind: "humanize-opencode",
          promotable: false,
          case_results: [result("case-a", "pass"), result("case-b", "pass")],
        },
        {
          harness_id: "humanize-inspired-v1",
          harness_dir: "/harness/humanize-inspired-v1",
          kind: "pact-harness",
          promotable: true,
          case_results: [result("case-a", "pass"), result("case-b", "fail")],
        },
      ],
    })

    expect(selection.variants[0]?.harness_id).toBe("humanize-opencode-glm52")
    expect(selection.variants[0]?.promotable).toBe(false)
    expect(selection.winner?.harness_id).toBe("humanize-inspired-v1")
    expect(selection.should_promote).toBe(false)
  })

  test("attributes predicted fixes, risk realization, and unattributed regressions", () => {
    const manifest: HarnessChangeManifest = {
      schema: "pact-harness-change/v1",
      variant_id: "variant-risk",
      predicted_fixes: ["case-b", "case-c"],
      risk_cases: ["case-a"],
      changed_harness_files: ["templates/review.md"],
      rationale: "Tighten reviewer evidence gate.",
    }

    const evaluation = evaluateHarnessChanges({
      manifest,
      baseline_results: [
        result("case-a", "pass"),
        result("case-b", "fail"),
        result("case-c", "fail"),
        result("case-d", "pass"),
      ],
      candidate_results: [
        result("case-a", "fail"),
        result("case-b", "pass"),
        result("case-c", "fail"),
        result("case-d", "fail"),
      ],
    })

    expect(evaluation.predicted_fixed).toEqual(["case-b"])
    expect(evaluation.still_failed).toEqual(["case-c"])
    expect(evaluation.risk_realized).toEqual(["case-a"])
    expect(evaluation.unattributed_regressions).toEqual(["case-d"])
    expect(evaluation.verdict).toBe("harmful")
  })

  test("runHarnessEvolution writes artifacts and guarded-promotes the selected harness", async () => {
    const dir = tempDir()
    const baselineHarnessDir = join(dir, "baseline")
    const variantHarnessDir = join(dir, "variant")
    const currentHarnessDir = join(dir, "current")
    const outputDir = join(dir, "evolution-output")
    writeHarness(baselineHarnessDir, "baseline")
    writeHarness(variantHarnessDir, "variant")
    writeHarness(currentHarnessDir, "baseline-current")

    const suite = {
      cases: [
        { id: "case-a", resume_loop_dir: "/tmp/round0/case-a", max_rounds: 4 },
        { id: "case-b", resume_loop_dir: "/tmp/round0/case-b", max_rounds: 4 },
      ],
    }

    const evolution = await runHarnessEvolution({
      suite,
      baselineHarnessDir,
      variants: [
        {
          id: "variant",
          harnessDir: variantHarnessDir,
          changeManifest: {
            schema: "pact-harness-change/v1",
            variant_id: "variant",
            predicted_fixes: ["case-b"],
            risk_cases: [],
            changed_harness_files: ["templates/review.md"],
          },
        },
      ],
      iterations: 1,
      promotion: "guarded",
      outputDir,
      currentHarnessDir,
      runCase({ caseItem, harnessId }) {
        if (harnessId === "baseline" && caseItem.id === "case-b") return result(caseItem.id, "fail")
        return result(caseItem.id, "pass")
      },
    })

    expect(evolution.iterations[0]?.selection.should_promote).toBe(true)
    expect(JSON.parse(readFileSync(join(currentHarnessDir, "manifest.json"), "utf-8")).id).toBe("variant")
    expect(existsSync(join(outputDir, "iteration-001", "iteration_scores.json"))).toBe(true)
    expect(existsSync(join(outputDir, "iteration-001", "case_results.json"))).toBe(true)
    expect(existsSync(join(outputDir, "evolution_history.md"))).toBe(true)
  })

  test("runHarnessEvolution evaluates humanize-opencode controls without loading or promoting them", async () => {
    const dir = tempDir()
    const baselineHarnessDir = join(dir, "baseline")
    const pactVariantHarnessDir = join(dir, "variant")
    const currentHarnessDir = join(dir, "current")
    const outputDir = join(dir, "evolution-output")
    writeHarness(baselineHarnessDir, "baseline")
    writeHarness(pactVariantHarnessDir, "humanize-inspired-v1")
    writeHarness(currentHarnessDir, "baseline-current")

    const evolution = await runHarnessEvolution({
      suite: {
        cases: [{ id: "case-a", resume_loop_dir: "/tmp/round0/case-a", max_rounds: 1 }],
      },
      baselineHarnessDir,
      variants: [
        {
          id: "humanize-inspired-v1",
          harnessDir: pactVariantHarnessDir,
          kind: "pact-harness",
          promotable: true,
        },
        {
          id: "humanize-opencode-glm52",
          kind: "humanize-opencode",
          promotable: false,
        },
      ],
      iterations: 1,
      promotion: "guarded",
      outputDir,
      currentHarnessDir,
      runCase({ caseItem, harnessId, kind, promotable }) {
        if (harnessId === "humanize-opencode-glm52") {
          expect(kind).toBe("humanize-opencode")
          expect(promotable).toBe(false)
          return result(caseItem.id, "pass")
        }
        return result(caseItem.id, "fail")
      },
    })

    const selection = evolution.iterations[0]?.selection
    expect(selection?.variants.map((entry) => entry.harness_id)).toContain("humanize-opencode-glm52")
    expect(selection?.winner?.harness_id).toBe("humanize-inspired-v1")
    expect(selection?.should_promote).toBe(false)
    expect(JSON.parse(readFileSync(join(currentHarnessDir, "manifest.json"), "utf-8")).id).toBe("baseline-current")
  })

  test("runHarnessEvolution loads PACT variant change manifests from harness dirs", async () => {
    const dir = tempDir()
    const baselineHarnessDir = join(dir, "baseline")
    const variantHarnessDir = join(dir, "variant")
    const outputDir = join(dir, "evolution-output")
    writeHarness(baselineHarnessDir, "baseline")
    writeHarness(variantHarnessDir, "variant")
    writeFileSync(
      join(variantHarnessDir, "change_manifest.json"),
      JSON.stringify(
        {
          schema: "pact-harness-change/v1",
          variant_id: "variant",
          predicted_fixes: ["case-b"],
          risk_cases: [],
          changed_harness_files: ["templates/review.md"],
        },
        null,
        2,
      ) + "\n",
      "utf-8",
    )

    await runHarnessEvolution({
      suite: {
        cases: [
          { id: "case-a", resume_loop_dir: "/tmp/round0/case-a", max_rounds: 1 },
          { id: "case-b", resume_loop_dir: "/tmp/round0/case-b", max_rounds: 1 },
        ],
      },
      baselineHarnessDir,
      variants: [{ id: "variant", harnessDir: variantHarnessDir }],
      iterations: 1,
      promotion: "report-only",
      outputDir,
      runCase({ caseItem, harnessId }) {
        if (harnessId === "baseline" && caseItem.id === "case-b") return result(caseItem.id, "fail")
        return result(caseItem.id, "pass")
      },
    })

    const evaluation = JSON.parse(
      readFileSync(join(outputDir, "iteration-001", "change_evaluation.json"), "utf-8"),
    )
    expect(evaluation[0]).toMatchObject({
      variant_id: "variant",
      predicted_fixed: ["case-b"],
      changed_harness_files: ["templates/review.md"],
      verdict: "effective",
    })
  })

  test("parses pact-harness-evolve CLI arguments", () => {
    const parsed = harnessEvolveCliArgs([
      "--suite",
      "suite.json",
      "--baseline-harness",
      "pact-harness/current",
      "--variant-harness",
      "variant-a=out/variant-a",
      "--iterations",
      "2",
      "--promotion",
      "guarded",
      "--output",
      "out/evolution",
    ])

    expect(parsed).toMatchObject({
      suite: "suite.json",
      baselineHarness: "pact-harness/current",
      variants: [{ id: "variant-a", harnessDir: "out/variant-a" }],
      iterations: 2,
      promotion: "guarded",
      output: "out/evolution",
    })
  })

  test("parses non-promotable control variants from CLI arguments", () => {
    const parsed = harnessEvolveCliArgs([
      "--suite",
      "suite.json",
      "--baseline-harness",
      "pact-harness/current",
      "--variant-harness",
      "humanize-inspired-v1=pact-harness/variants/humanize-inspired-v1",
      "--control-variant",
      "humanize-opencode-glm52=humanize-opencode",
      "--output",
      "out/evolution",
    ])

    expect(parsed.variants).toEqual([
      {
        id: "humanize-inspired-v1",
        harnessDir: "pact-harness/variants/humanize-inspired-v1",
        kind: "pact-harness",
        promotable: true,
      },
      {
        id: "humanize-opencode-glm52",
        harnessDir: "humanize-opencode-glm52",
        kind: "humanize-opencode",
        promotable: false,
      },
    ])
  })

  test("normalizes LoLBench results.csv rows into harness case results", () => {
    const csv = [
      "instance_id,suite,image_build_status,agent_status,agent_exit,agent_seconds,agent_attempts,patch_lines,suite_status,resolved,f2p,p2p,error_categories,pact_stop_reason,pact_completed_worker_rounds,pact_final_hidden_gate_status,note",
      "CPython_PEP-646_Variadic-Generics_PR-31018,orig,cached,agent_nonzero,3,2920.6,1,12191,resolved,True,6/6,18/18,,,3,passed,",
      "CPython_PEP-615_Support-for-the-IANA-Time-Zone-Database-in-the-Standard-Library_PR-19909,orig,cached,agent_timeout,124,3600,1,0,timeout,False,0/44,0/89,,round_timeout,1,timeout,",
      "CPython_PEP-680_tomllib-Support-for-Parsing-TOML-in-the-Standard-Library_PR-31498,orig,failed,agent_not_started,1,0,0,0,build_failed,False,0/0,0/0,build,build_failed,0,,docker build failed",
    ].join("\n")

    expect(
      harnessCaseResultFromLolbenchCsv(csv, {
        caseId: "CPython_PEP-646_Variadic-Generics_PR-31018",
        artifactsDir: "/tmp/pep646",
      }),
    ).toMatchObject({
      case_id: "CPython_PEP-646_Variadic-Generics_PR-31018",
      status: "pass",
      resolved: true,
      verification_status: "passed",
      final_hidden_gate: "passed",
      round_count: 3,
      patch_quality: "valid",
      artifacts_dir: "/tmp/pep646",
    })
    expect(
      harnessCaseResultFromLolbenchCsv(csv, {
        caseId: "CPython_PEP-615_Support-for-the-IANA-Time-Zone-Database-in-the-Standard-Library_PR-19909",
      }),
    ).toMatchObject({
      status: "timeout",
      timeout: true,
      verification_status: "timeout",
      final_hidden_gate: "timeout",
      patch_quality: "empty",
    })
    expect(
      harnessCaseResultFromLolbenchCsv(csv, {
        caseId: "CPython_PEP-680_tomllib-Support-for-Parsing-TOML-in-the-Standard-Library_PR-31498",
      }),
    ).toMatchObject({
      status: "infra",
      verification_status: "infra_failed",
      infra_error: "docker build failed",
    })
  })
})
