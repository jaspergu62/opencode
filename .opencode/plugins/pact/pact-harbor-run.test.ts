import { describe, expect, test } from "bun:test"

import { pactHarborArgs } from "./pact-harbor-run"

describe("PACT Harbor runner", () => {
  test("defaults both OpenCode roles to GLM 5.2 with three rounds", () => {
    const args = pactHarborArgs(["--instruction-file", "/tmp/instruction.md", "--harness-dir", "/tmp/harness"])
    expect(args).toMatchObject({
      maxRounds: 3,
      model: "openrouter/z-ai/glm-5.2",
      reviewerModel: "openrouter/z-ai/glm-5.2",
      workerAgent: "build",
      reviewerAgent: "build",
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
    ])
    expect(args.model).toBe("openrouter/model-a")
    expect(args.reviewerModel).toBe("openrouter/model-b")
    expect(args.loopID).toBe("trial-1")
  })
})
