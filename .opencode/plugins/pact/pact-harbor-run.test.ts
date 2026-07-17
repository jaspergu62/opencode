import { describe, expect, test } from "bun:test"
import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { cleanupHarborTestPatchFiles, pactHarborArgs } from "./pact-harbor-run"

describe("PACT Harbor runner", () => {
  test("defaults both OpenCode roles to GLM 5.2 with three rounds", () => {
    const args = pactHarborArgs(["--instruction-file", "/tmp/instruction.md", "--harness-dir", "/tmp/harness"])
    expect(args).toMatchObject({
      maxRounds: 3,
      model: "openrouter/z-ai/glm-5.2",
      reviewerModel: "openrouter/z-ai/glm-5.2",
      workerAgent: "build",
      reviewerAgent: "build",
      workerCompletionGraceMs: 120_000,
      reviewerCompletionGraceMs: 120_000,
    })
  })

  test("accepts explicit role models and loop identity", () => {
    const args = pactHarborArgs([
      "--instruction-file",
      "/tmp/instruction.md",
      "--harness-dir",
      "/tmp/harness",
      "--model",
      "openrouter/model-a",
      "--reviewer-model",
      "openrouter/model-b",
      "--loop-id",
      "trial-1",
      "--worker-completion-grace-ms",
      "2500",
      "--reviewer-completion-grace-ms",
      "3500",
    ])
    expect(args.model).toBe("openrouter/model-a")
    expect(args.reviewerModel).toBe("openrouter/model-b")
    expect(args.loopID).toBe("trial-1")
    expect(args.workerCompletionGraceMs).toBe(2500)
    expect(args.reviewerCompletionGraceMs).toBe(3500)
  })

  test("removes test-patch changes before Harbor verification while retaining eval changes", () => {
    const projectRoot = mkdtempSync(join(tmpdir(), "pact-harbor-cleanup-"))
    const sourcePath = join(projectRoot, "src.ts")
    const trackedTestPath = join(projectRoot, "src.test.ts")
    const untrackedTestPath = join(projectRoot, "new.test.ts")
    execFileSync("git", ["init", "-q"], { cwd: projectRoot })
    execFileSync("git", ["config", "user.email", "pact-test@localhost"], { cwd: projectRoot })
    execFileSync("git", ["config", "user.name", "PACT Test"], { cwd: projectRoot })
    writeFileSync(sourcePath, "baseline source\n", "utf-8")
    writeFileSync(trackedTestPath, "baseline test\n", "utf-8")
    execFileSync("git", ["add", "src.ts", "src.test.ts"], { cwd: projectRoot })
    execFileSync("git", ["commit", "-q", "-m", "baseline"], { cwd: projectRoot })

    writeFileSync(sourcePath, "changed source\n", "utf-8")
    writeFileSync(trackedTestPath, "changed test\n", "utf-8")
    writeFileSync(untrackedTestPath, "new test\n", "utf-8")
    const loopDir = join(projectRoot, ".pact", "loops", "trial")
    mkdirSync(loopDir, { recursive: true })
    writeFileSync(
      join(loopDir, "round-02-patch-artifact.json"),
      JSON.stringify({
        test_patch: { changed_files: ["src.test.ts", "new.test.ts"] },
        excluded_test_patch_files: [{ path: "src.test.ts" }, { path: "new.test.ts" }],
      }),
      "utf-8",
    )

    expect(cleanupHarborTestPatchFiles({ projectRoot, loopDir })).toEqual(["new.test.ts", "src.test.ts"])
    expect(readFileSync(sourcePath, "utf-8")).toBe("changed source\n")
    expect(readFileSync(trackedTestPath, "utf-8")).toBe("baseline test\n")
    expect(existsSync(untrackedTestPath)).toBeFalse()
  })

  test("rejects test-patch paths outside the Harbor project", () => {
    const projectRoot = mkdtempSync(join(tmpdir(), "pact-harbor-cleanup-"))
    execFileSync("git", ["init", "-q"], { cwd: projectRoot })
    const outsidePath = join(projectRoot, "..", "outside.test.ts")
    writeFileSync(outsidePath, "must remain\n", "utf-8")
    const loopDir = join(projectRoot, ".pact", "loops", "trial")
    mkdirSync(loopDir, { recursive: true })
    writeFileSync(
      join(loopDir, "round-01-patch-artifact.json"),
      JSON.stringify({ test_patch: { changed_files: ["../outside.test.ts"] } }),
      "utf-8",
    )

    expect(() => cleanupHarborTestPatchFiles({ projectRoot, loopDir })).toThrow("Unsafe Harbor test patch path")
    expect(readFileSync(outsidePath, "utf-8")).toBe("must remain\n")
  })
})
