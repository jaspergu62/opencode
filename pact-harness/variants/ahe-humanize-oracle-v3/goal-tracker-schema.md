# Goal Tracker Schema: AHE Humanize Oracle V3

The tracker is the durable completion contract. It must prevent three failure
classes observed in prior PEP615/646/680 traces:

- Required work silently moved to "deferred" and still counted complete.
- Manual smoke evidence closing high-risk parser, grammar, or stdlib work.
- Derived acceptance criteria expanding beyond the original task and causing
  scope drift.
- Workers timing out or failing upstream after edits without leaving a usable
  summary artifact.
- Reviewers accepting worker-chosen tests while missing the oracle family
  implied by the files actually changed.

## Requirement Source Ledger

Every acceptance criterion and behavior obligation must include:

- ID: stable label.
- Requirement: concise behavior or target surface.
- Source class:
  - `original_required`: directly required by the prompt, spec, plan, or imported requirement.
  - `derived_required`: necessary to satisfy an original requirement.
  - `optional_check`: useful verification that is not required for completion.
  - `out_of_scope`: not required by the original task.
- Source evidence: quote-free pointer to the artifact or code/spec fact.
- Risk class: `low`, `medium`, `high`.
- Status: `pending`, `in_progress`, `partial`, `satisfied`, `deferred_required`, `invalidated_out_of_scope`, `blocked`.

Rules:
- `original_required` and `derived_required` cannot be dropped, narrowed, or
  marked optional without reviewer approval.
- `optional_check` and `out_of_scope` must not block completion.
- Over-broad derived criteria should become `invalidated_out_of_scope`, not
  force unrelated implementation.

## Evidence Grade Ledger

Each completed claim must name an evidence grade:

- `source_inspection`: code path inspected.
- `manual_probe`: ad hoc command or snippet.
- `automated_regression`: committed or patch-captured regression.
- `fixture_or_compliance`: corpus, fixture suite, or standard conformance tests.
- `public_verification`: PACT public verification artifact.
- `build_or_runtime_gate`: configured build, import, or runtime integration check.
- `hidden_unavailable`: hidden gate unavailable during worker/reviewer rounds.

Rules:
- Manual probes can support `partial` only for high-risk ACs.
- Parser, format, grammar, compiler, AST, serialization, timezone, and stdlib
  integration work is high-risk by default.
- High-risk ACs require at least one automated, fixture/compliance, build, or
  public verification grade before `satisfied`.
- If a compliance suite or fixture corpus is known and relevant, omitting it
  creates verification debt unless reviewer marks it non-applicable.

## Case-Learned Gate Patterns

Use these patterns as required audits, not as hard-coded case answers:

- Parser/file-format gate: new parser behavior needs more than smoke tests.
  Prefer fixture/compliance and error-focused tests; record omitted known
  corpora as verification debt.
- Duplicate-surface gate: C accelerator, pure-Python fallback, generated
  metadata, import paths, install paths, and runtime cache paths are separate
  surfaces when touched or when the original plan/spec/anchors make them part
  of the required implementation. Completion needs equivalence or
  non-applicability backed by source evidence, not merely "the worker skipped
  it".
- Grammar/compiler gate: grammar changes need parser, AST/tooling, runtime,
  future-annotations, and negative syntax evidence when those paths are in
  scope.
- Scope-drift gate: if a derived criterion expands beyond the original
  requirement, classify it and ask for reviewer invalidation instead of
  silently chasing it or calling it done.
- Stale-summary gate: summary evidence must describe the final patch and final
  verification. Work performed after the summary requires a summary update.

## Round Budget and Summary Heartbeat

Every worker round must keep the loop recoverable:

- Write the round contract before source edits.
- After the first coherent patch or importable checkpoint, create the required
  summary file as a live heartbeat. It may honestly say "incomplete".
- Reserve the last part of the round for summary refresh and stop. Do not start
  a new broad suite, rewrite, or optional audit when the summary would become
  stale or missing.
- If an upstream/model/tool failure occurs, the latest summary must let the
  reviewer distinguish "no work", "partial but importable", and "partial and
  broken".

Rules:
- A missing summary is a process defect and blocks completion.
- A stale summary can support continuation only; it cannot support
  PACT_COMPLETE.
- Large one-round contracts must explain the vertical slice and list required
  ACs still open. Calling a required open surface "optional" is scope drift.

## Impact Oracle Matrix

For every changed or claimed-base-equivalent surface, record:

- Changed surface or source family.
- Oracle family: existing test module, fixture corpus, generated metadata
  check, runtime probe, or documented non-applicability.
- Evidence grade required before completion.
- Status: `unmapped`, `oracle_unavailable`, `covered_by_probe`,
  `covered_by_regression`, `covered_by_fixture`, `covered_by_hidden_only`,
  `invalidated_out_of_scope`.

Default mappings for these PEP cases:

- `Lib/tomllib`, new parser/file-format modules, or TOML parsing claims:
  require parser fixtures or compliance/error corpus when available. If no
  in-tree corpus exists, synthesize a table-driven corpus covering valid
  scalars/containers/datetime, invalid syntax, binary `load`, keyword-only
  `parse_float`, original float spelling, no path support, no writer APIs, and
  stdlib install/import metadata.
- `Lib/zoneinfo`, `Modules/_zoneinfo`, timezone transition logic, TZPATH,
  caches, pickle, or fallback data lookup: require zoneinfo oracle families for
  ordinary zones, weird/minimal TZif files, TZ strings, folds/gaps,
  `fromutc`, cache lifecycle, pickle semantics, path traversal, tzdata fallback,
  and pure-Python/C-surface parity when a duplicate surface is in scope.
- Grammar, parser generator, compiler, AST, unparser, typing, or future
  annotations changes: require parser-positive, parser-negative, AST/tooling,
  runtime, future-annotations, unparse/cosmetic roundtrip, and public API
  equivalence oracles as applicable. Worker-chosen typing tests alone are not
  enough when `test_future`, `test_unparse`, or equivalent surfaces are implied.
- Metadata or stdlib integration changes: require generated-name, install path,
  import, docs index, and build/runtime checks as applicable.

Rules:
- Reviewers must build their own matrix from the patch metadata before
  accepting completion.
- A changed surface with no mapped oracle blocks PACT_COMPLETE unless the
  reviewer records source-backed non-applicability.
- Hidden-only evidence from a prior final gate may guide the next harness
  design, but worker rounds must still rely on public artifacts, source
  inspection, probes, and patch-captured tests.

## Implementation Surface Inventory

Before the worker narrows scope or the reviewer accepts non-applicability, list:

- Surface name.
- Why it is in scope, out of scope, or uncertain.
- Source pointer: original requirement, imported plan, anchors, public API, or
  existing-tree implementation fact.
- Required evidence to close it.
- Status: `uninspected`, `required_open`, `implemented_unverified`,
  `verified`, `invalidated_out_of_scope`.

Rules:
- A surface named by source artifacts starts as `required_open` or `uncertain`,
  not `not_applicable`.
- "Not touched by this patch" is not a source pointer.
- Duplicate/fallback/accelerator/metadata/import/cache/runtime/grammar/AST/test
  corpus surfaces require explicit source-based classification.

## Verification Debt Ledger

Record unresolved evidence gaps:

- Debt ID.
- Linked AC or surface.
- Missing evidence.
- Why it matters.
- Status: `open`, `non_blocking_optional`, `closed`, `invalidated_out_of_scope`.

Rules:
- Open debt linked to required high-risk work blocks PACT_COMPLETE.
- Debt may be non-blocking only when it is optional or out-of-scope with evidence.

## Surface Equivalence Matrix

Use when multiple implementation surfaces, fallbacks, or integration points exist:

- Surface A / Surface B.
- Behavior that must match.
- Evidence.
- Status: `unverified`, `equivalent`, `divergent`, `not_applicable`.

Examples:
- C accelerator and pure-Python fallback.
- Runtime module and stdlib installation metadata.
- Parser output and documented data model.

## Deferred and Rejected Work

Separate required deferrals from rejected scope:

- Required deferred work: blocks completion until resolved or reviewer proves non-applicable.
- Rejected out-of-scope work: does not block completion and should not be chased.
- Optional verification: useful, but not a completion gate unless tied to high-risk required work.

## Evidence Ledger

Record concrete observations only:

- ID.
- Source: spec, code, patch, verification, contract, summary, review, feedback.
- Observation.
- Supports.
- Confidence: high, medium, low.

## Root Cause Hypotheses

Each hypothesis must be falsifiable:

- ID.
- Claim.
- Evidence.
- Expected patch effect.
- Falsifier.
- Status: proposed, supported, weakened, falsified, resolved.

## Completion Gate

PACT_COMPLETE is valid only when:

- All `original_required` and `derived_required` ACs are `satisfied` or
  reviewer-approved `invalidated_out_of_scope`.
- Required deferred work is empty.
- Open high-risk verification debt is empty.
- Multi-surface equivalence is proven or non-applicable.
- Every changed high-risk surface has an Impact Oracle Matrix row that is
  covered or reviewer-invalidated with evidence.
- The latest summary heartbeat exists and matches the final patch.
- Public verification does not block final hidden scoring.
- The final summary names all remaining optional risks without using them as
  evidence of completion.
