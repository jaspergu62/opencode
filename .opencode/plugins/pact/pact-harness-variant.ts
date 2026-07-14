import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join, basename, resolve, posix as pathPosix } from "node:path"

import type { PactHarnessTemplateName } from "./pact-core"

export type CodexHarnessVariantFile = {
  path: string
  content: string
}

export type ValidatedCodexHarnessVariantFile = CodexHarnessVariantFile & {
  relativePath: string
  absolutePath: string
}

const TEMPLATE_NAMES = new Set<PactHarnessTemplateName>([
  "planner",
  "initial_worker",
  "continuation_worker",
  "review",
  "review_phase",
  "finalize",
])

const ALLOWED_PLACEHOLDERS = new Set([
  "contract",
  "contractPath",
  "contractStatus",
  "continuationPackagePath",
  "currentStateSnapshot",
  "defaultPrompt",
  "evalPatchPath",
  "feedbackPath",
  "finalizeSummaryPath",
  "goalTrackerPath",
  "goalTrackerSchema",
  "loopDir",
  "objective",
  "patchArtifactPath",
  "planContent",
  "planPath",
  "preSnapshotPath",
  "reviewKind",
  "round",
  "roundName",
  "specEvidenceReferences",
  "summary",
  "summaryPath",
  "summaryStatus",
  "todoPath",
  "verificationPath",
])

const TEMPLATE_PLACEHOLDERS: Record<PactHarnessTemplateName, Set<string>> = {
  planner: new Set(["defaultPrompt", "goalTrackerSchema", "planContent", "planPath"]),
  initial_worker: new Set([
    "contractPath",
    "currentStateSnapshot",
    "defaultPrompt",
    "goalTrackerPath",
    "goalTrackerSchema",
    "loopDir",
    "objective",
    "preSnapshotPath",
    "round",
    "roundName",
    "specEvidenceReferences",
    "summaryPath",
    "todoPath",
  ]),
  continuation_worker: new Set([
    "contractPath",
    "continuationPackagePath",
    "currentStateSnapshot",
    "defaultPrompt",
    "feedbackPath",
    "goalTrackerPath",
    "goalTrackerSchema",
    "loopDir",
    "objective",
    "planPath",
    "preSnapshotPath",
    "round",
    "roundName",
    "specEvidenceReferences",
    "summaryPath",
    "todoPath",
  ]),
  review: new Set([
    "contract",
    "contractPath",
    "contractStatus",
    "defaultPrompt",
    "evalPatchPath",
    "goalTrackerPath",
    "goalTrackerSchema",
    "loopDir",
    "patchArtifactPath",
    "planPath",
    "reviewKind",
    "round",
    "roundName",
    "specEvidenceReferences",
    "summary",
    "summaryPath",
    "summaryStatus",
    "todoPath",
    "verificationPath",
  ]),
  review_phase: new Set([
    "defaultPrompt",
    "feedbackPath",
    "goalTrackerPath",
    "goalTrackerSchema",
    "loopDir",
    "planPath",
    "round",
    "roundName",
    "summaryPath",
  ]),
  finalize: new Set([
    "defaultPrompt",
    "finalizeSummaryPath",
    "goalTrackerPath",
    "goalTrackerSchema",
    "loopDir",
    "planPath",
    "round",
    "roundName",
  ]),
}

export function parseCodexHarnessVariantOutput(text: string): { files: CodexHarnessVariantFile[] } {
  const candidates = [text.trim()]
  const fencePattern = /```(?:json)?\s*([\s\S]*?)```/gi
  for (const match of text.matchAll(fencePattern)) {
    candidates.unshift(match[1]?.trim() ?? "")
  }

  for (const candidate of candidates) {
    if (!candidate) continue
    try {
      const parsed = JSON.parse(candidate) as unknown
      if (isVariantFileEnvelope(parsed)) return parsed
    } catch {
      // Try the next candidate; Codex often wraps JSON in explanatory text.
    }
  }
  throw new Error("Codex harness variant output must be JSON with a files array")
}

export function validateCodexHarnessVariantOutput(
  text: string,
  options: { variantDir: string },
): ValidatedCodexHarnessVariantFile[] {
  const variantDir = resolve(options.variantDir)
  const parsed = parseCodexHarnessVariantOutput(text)
  const files: ValidatedCodexHarnessVariantFile[] = []
  const byRelativePath = new Map<string, ValidatedCodexHarnessVariantFile>()

  for (const file of parsed.files) {
    if (!file.path || typeof file.path !== "string") throw new Error("Codex harness variant file missing path")
    if (typeof file.content !== "string") throw new Error(`Codex harness variant file missing content: ${file.path}`)
    const relativePath = normalizeVariantFilePath(file.path, variantDir)
    validateAllowedVariantPath(relativePath)
    if (byRelativePath.has(relativePath)) throw new Error(`Duplicate Codex harness variant file: ${relativePath}`)
    if (relativePath.startsWith("templates/")) validateTemplatePlaceholders(file.content, relativePath, ALLOWED_PLACEHOLDERS)
    const validated = {
      ...file,
      relativePath,
      absolutePath: join(variantDir, relativePath),
    }
    files.push(validated)
    byRelativePath.set(relativePath, validated)
  }

  const manifest = readRequiredJson(byRelativePath, "manifest.json") as Record<string, unknown>
  validateManifest(manifest, byRelativePath)
  const changeManifest = readRequiredJson(byRelativePath, "change_manifest.json") as Record<string, unknown>
  validateChangeManifest(changeManifest)
  if (byRelativePath.has("spec-import-profile.json")) readJson(byRelativePath.get("spec-import-profile.json")!)

  return files
}

export function materializeCodexHarnessVariantOutput(text: string, options: { variantDir: string }): void {
  const files = validateCodexHarnessVariantOutput(text, options)
  for (const file of files) {
    mkdirSync(dirname(file.absolutePath), { recursive: true })
    writeFileSync(file.absolutePath, file.content.endsWith("\n") ? file.content : `${file.content}\n`, "utf-8")
  }
}

function isVariantFileEnvelope(value: unknown): value is { files: CodexHarnessVariantFile[] } {
  if (!value || typeof value !== "object") return false
  const files = (value as { files?: unknown }).files
  return (
    Array.isArray(files) &&
    files.every((file) => {
      return (
        file &&
        typeof file === "object" &&
        typeof (file as { path?: unknown }).path === "string" &&
        typeof (file as { content?: unknown }).content === "string"
      )
    })
  )
}

function normalizeVariantFilePath(rawPath: string, variantDir: string): string {
  if (rawPath.includes("\\")) throw new Error(`Unsupported Codex harness variant path: ${rawPath}`)
  if (rawPath.startsWith("/") || /^[A-Za-z]:/.test(rawPath)) {
    throw new Error(`Codex harness variant path must be relative: ${rawPath}`)
  }
  const normalized = pathPosix.normalize(rawPath)
  if (normalized === "." || normalized === ".." || normalized.startsWith("../")) {
    throw new Error(`Codex harness variant path escapes variant directory: ${rawPath}`)
  }

  const variantName = basename(variantDir)
  const repoVariantPrefix = `pact-harness/variants/${variantName}/`
  if (normalized.startsWith(repoVariantPrefix)) return normalized.slice(repoVariantPrefix.length)
  const localVariantPrefix = `${variantName}/`
  if (normalized.startsWith(localVariantPrefix)) return normalized.slice(localVariantPrefix.length)
  return normalized
}

function validateAllowedVariantPath(relativePath: string): void {
  if (
    relativePath === "manifest.json" ||
    relativePath === "change_manifest.json" ||
    relativePath === "goal-tracker-schema.md" ||
    relativePath === "spec-import-profile.json"
  ) {
    return
  }
  if (relativePath.startsWith("templates/")) {
    const templateName = relativePath.slice("templates/".length)
    if (templateName && !templateName.includes("/") && templateName.endsWith(".md")) return
  }
  throw new Error(`Unsupported Codex harness variant path: ${relativePath}`)
}

function validateTemplatePlaceholders(content: string, relativePath: string, allowedPlaceholders: Set<string>): void {
  const pattern = /\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g
  for (const match of content.matchAll(pattern)) {
    const placeholder = match[1] ?? ""
    if (!allowedPlaceholders.has(placeholder)) {
      throw new Error(`Unsupported PACT harness placeholder in ${relativePath}: ${placeholder}`)
    }
  }
}

function readRequiredJson(files: Map<string, ValidatedCodexHarnessVariantFile>, relativePath: string): unknown {
  const file = files.get(relativePath)
  if (!file) throw new Error(`Codex harness variant output missing ${relativePath}`)
  return readJson(file)
}

function readJson(file: ValidatedCodexHarnessVariantFile): unknown {
  try {
    return JSON.parse(file.content) as unknown
  } catch (error) {
    throw new Error(`Invalid JSON in ${file.relativePath}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

function validateManifest(
  manifest: Record<string, unknown>,
  files: Map<string, ValidatedCodexHarnessVariantFile>,
): void {
  if (manifest.schema !== "pact-harness/v1") throw new Error("manifest.json must use schema pact-harness/v1")
  if (typeof manifest.id !== "string" || !manifest.id) throw new Error("manifest.json must include id")
  if (manifest.templates !== undefined) {
    if (!manifest.templates || typeof manifest.templates !== "object" || Array.isArray(manifest.templates)) {
      throw new Error("manifest.json templates must be an object")
    }
    for (const [name, value] of Object.entries(manifest.templates as Record<string, unknown>)) {
      if (!TEMPLATE_NAMES.has(name as PactHarnessTemplateName)) throw new Error(`Unsupported manifest template: ${name}`)
      if (typeof value !== "string") throw new Error(`Manifest template path must be a string: ${name}`)
      validateAllowedVariantPath(value)
      if (!value.startsWith("templates/")) throw new Error(`Manifest template path must be under templates/: ${value}`)
      const templateFile = files.get(value)
      if (!templateFile) throw new Error(`Manifest references missing template file: ${value}`)
      validateTemplatePlaceholders(templateFile.content, `${name} template ${value}`, TEMPLATE_PLACEHOLDERS[name as PactHarnessTemplateName])
    }
  }
  if (manifest.goal_tracker_schema !== undefined) {
    if (manifest.goal_tracker_schema !== "goal-tracker-schema.md") {
      throw new Error("manifest.json goal_tracker_schema must be goal-tracker-schema.md")
    }
    if (!files.has("goal-tracker-schema.md")) throw new Error("Manifest references missing goal-tracker-schema.md")
  }
  if (manifest.spec_import_profile !== undefined) {
    if (manifest.spec_import_profile !== "spec-import-profile.json") {
      throw new Error("manifest.json spec_import_profile must be spec-import-profile.json")
    }
    if (!files.has("spec-import-profile.json")) throw new Error("Manifest references missing spec-import-profile.json")
  }
}

function validateChangeManifest(manifest: Record<string, unknown>): void {
  if (manifest.schema !== "pact-harness-change/v1") {
    throw new Error("change_manifest.json must use schema pact-harness-change/v1")
  }
  if (manifest.variant_id !== undefined && typeof manifest.variant_id !== "string") {
    throw new Error("change_manifest.json variant_id must be a string")
  }
  for (const key of ["changed_harness_files", "predicted_fixes", "risk_cases"]) {
    const value = manifest[key]
    if (value !== undefined && (!Array.isArray(value) || value.some((entry) => typeof entry !== "string"))) {
      throw new Error(`change_manifest.json ${key} must be a string array`)
    }
  }
  if (manifest.rationale !== undefined && typeof manifest.rationale !== "string") {
    throw new Error("change_manifest.json rationale must be a string")
  }
}
