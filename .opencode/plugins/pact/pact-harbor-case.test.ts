import { describe, expect, test } from "bun:test"

import { harborTrialArgs, pactHarborCaseArgs } from "./pact-harbor-case"

describe("PACT Harbor case runner", () => {
  test("uses a templated secret and disables forced image builds", () => {
    const input = pactHarborCaseArgs([
      "--task-path",
      "/tmp/task",
      "--case-id",
      "case-1",
      "--harness-dir",
      "/tmp/harness",
      "--output-dir",
      "/tmp/output",
      "--worktree-dir",
      "/tmp/worktree",
    ])
    const args = harborTrialArgs(input)
    expect(args).toContain("--no-force-build")
    expect(args).toContain("script.pact_harbor_agent:PactOpenCodeAgent")
    expect(args).toContain("OPENROUTER_API_KEY=${OPENROUTER_API_KEY}")
    expect(args.join(" ")).not.toMatch(/sk-or-/)
    expect(input.model).toBe("openrouter/z-ai/glm-5.2")
    expect(input.maxRounds).toBe(3)
  })
})
