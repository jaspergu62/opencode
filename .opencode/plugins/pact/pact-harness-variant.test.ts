import { afterEach, describe, expect, test } from "bun:test"
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { loadPactHarness } from "./pact-core"
import {
  materializeCodexHarnessVariantOutput,
  validateCodexHarnessVariantOutput,
} from "./pact-harness-variant"

const tempDirs: string[] = []

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

function tempDir(prefix = "pact-harness-variant-"): string {
  const dir = mkdtempSync(join(tmpdir(), prefix))
  tempDirs.push(dir)
  return dir
}

function codexOutput(files: Array<{ path: string; content: string }>): string {
  return [
    "Here is the candidate:",
    "",
    "```json",
    JSON.stringify({ files }, null, 2),
    "```",
  ].join("\n")
}

function validFiles(variantPrefix = "pact-harness/variants/humanize-inspired-v1"): Array<{ path: string; content: string }> {
  return [
    {
      path: `${variantPrefix}/manifest.json`,
      content: JSON.stringify(
        {
          schema: "pact-harness/v1",
          id: "humanize-inspired-v1",
          templates: {
            planner: "templates/planner.md",
            review: "templates/review.md",
          },
          goal_tracker_schema: "goal-tracker-schema.md",
          spec_import_profile: "spec-import-profile.json",
        },
        null,
        2,
      ),
    },
    {
      path: `${variantPrefix}/templates/planner.md`,
      content: "{{defaultPrompt}}\n\nPlanner sees {{planPath}} and {{goalTrackerSchema}}.\n",
    },
    {
      path: `${variantPrefix}/templates/review.md`,
      content: "{{defaultPrompt}}\n\nReview {{summaryStatus}} from {{summaryPath}} before {{contractPath}}.\n",
    },
    {
      path: `${variantPrefix}/goal-tracker-schema.md`,
      content: "# Goal Tracker\n\nKeep evidence explicit.\n",
    },
    {
      path: `${variantPrefix}/spec-import-profile.json`,
      content: JSON.stringify({ schema: "pact-spec-import-profile/v1", id: "humanize-inspired-v1" }, null, 2),
    },
    {
      path: `${variantPrefix}/change_manifest.json`,
      content: JSON.stringify(
        {
          schema: "pact-harness-change/v1",
          variant_id: "humanize-inspired-v1",
          predicted_fixes: ["CPython_PEP-680_tomllib-Support-for-Parsing-TOML-in-the-Standard-Library_PR-31498"],
          risk_cases: ["CPython_PEP-615_Support-for-the-IANA-Time-Zone-Database-in-the-Standard-Library_PR-19909"],
          changed_harness_files: ["templates/planner.md", "templates/review.md"],
          rationale: "Adopt Humanize-style round summaries and stricter evidence review.",
        },
        null,
        2,
      ),
    },
  ]
}

describe("Codex PACT harness variant output", () => {
  test("validates and materializes a fenced JSON variant into the allowed variant directory", () => {
    const root = tempDir()
    const variantDir = join(root, "pact-harness", "variants", "humanize-inspired-v1")
    const output = codexOutput(validFiles())

    const files = validateCodexHarnessVariantOutput(output, { variantDir })
    materializeCodexHarnessVariantOutput(output, { variantDir })

    expect(files.map((file) => file.relativePath).sort()).toEqual([
      "change_manifest.json",
      "goal-tracker-schema.md",
      "manifest.json",
      "spec-import-profile.json",
      "templates/planner.md",
      "templates/review.md",
    ])
    expect(loadPactHarness(variantDir)?.manifest.id).toBe("humanize-inspired-v1")
    expect(existsSync(join(variantDir, "change_manifest.json"))).toBe(true)
    expect(readFileSync(join(variantDir, "templates", "planner.md"), "utf-8")).toContain("{{defaultPrompt}}")
  })

  test("rejects paths outside the variant directory", () => {
    const variantDir = join(tempDir(), "pact-harness", "variants", "humanize-inspired-v1")
    const output = codexOutput([
      ...validFiles(),
      { path: "pact-harness/variants/humanize-inspired-v1/../evil.md", content: "bad\n" },
    ])

    expect(() => validateCodexHarnessVariantOutput(output, { variantDir })).toThrow(/outside|unsupported/i)
  })

  test("rejects unsupported template placeholders", () => {
    const variantDir = join(tempDir(), "pact-harness", "variants", "humanize-inspired-v1")
    const files = validFiles()
    const planner = files.find((file) => file.path.endsWith("templates/planner.md"))
    if (!planner) throw new Error("missing planner fixture")
    planner.content = "{{defaultPrompt}}\n\nRun {{arbitraryShellCommand}}.\n"

    expect(() => validateCodexHarnessVariantOutput(codexOutput(files), { variantDir })).toThrow(/placeholder/i)
  })

  test("rejects placeholders that are not available to a template render context", () => {
    const variantDir = join(tempDir(), "pact-harness", "variants", "humanize-inspired-v1")
    const files = validFiles()
    const planner = files.find((file) => file.path.endsWith("templates/planner.md"))
    if (!planner) throw new Error("missing planner fixture")
    planner.content = "{{defaultPrompt}}\n\nPlanner cannot receive {{objective}}.\n"

    expect(() => validateCodexHarnessVariantOutput(codexOutput(files), { variantDir })).toThrow(/planner.*objective/i)
  })

  test("requires manifest and change manifest files", () => {
    const variantDir = join(tempDir(), "pact-harness", "variants", "humanize-inspired-v1")
    const files = validFiles().filter((file) => !file.path.endsWith("change_manifest.json"))

    expect(() => validateCodexHarnessVariantOutput(codexOutput(files), { variantDir })).toThrow(/change_manifest/i)
  })

  test("rejects benchmark instance leakage from executable harness files", () => {
    const variantDir = join(tempDir(), "pact-harness", "variants", "humanize-inspired-v1")
    const files = validFiles()
    const review = files.find((file) => file.path.endsWith("templates/review.md"))
    if (!review) throw new Error("missing review fixture")
    review.content += "\nSpecial-case instance_example__repo-deadbeef.\n"

    expect(() =>
      validateCodexHarnessVariantOutput(codexOutput(files), {
        variantDir,
        forbiddenTerms: ["example-case", "example-repo"],
      }),
    ).toThrow(/benchmark leakage/i)
  })

  test("allows case IDs only in change attribution metadata", () => {
    const variantDir = join(tempDir(), "pact-harness", "variants", "humanize-inspired-v1")
    const files = validFiles()
    const changeManifest = files.find((file) => file.path.endsWith("change_manifest.json"))
    if (!changeManifest) throw new Error("missing change manifest fixture")
    changeManifest.content = JSON.stringify({
      schema: "pact-harness-change/v1",
      variant_id: "humanize-inspired-v1",
      predicted_fixes: ["example-case"],
      changed_harness_files: ["templates/review.md"],
    })

    expect(() =>
      validateCodexHarnessVariantOutput(codexOutput(files), {
        variantDir,
        forbiddenTerms: ["example-case"],
      }),
    ).not.toThrow()
  })
})
