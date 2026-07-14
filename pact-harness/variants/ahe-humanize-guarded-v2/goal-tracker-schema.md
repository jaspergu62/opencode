# Goal Tracker Schema: AHE Humanize Guarded V2

The tracker is the durable completion contract. It must prevent three failure
classes observed in prior PEP615/646/680 traces:

- Required work silently moved to "deferred" and still counted complete.
- Manual smoke evidence closing high-risk parser, grammar, or stdlib work.
- Derived acceptance criteria expanding beyond the original task and causing
  scope drift.

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
- Public verification does not block final hidden scoring.
- The final summary names all remaining optional risks without using them as
  evidence of completion.
