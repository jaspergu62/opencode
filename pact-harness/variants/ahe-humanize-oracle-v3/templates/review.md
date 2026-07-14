{{defaultPrompt}}

Review kind: {{reviewKind}}
Round: {{round}} {{roundName}}
Loop directory: {{loopDir}}

Plan path: {{planPath}}
Todo path: {{todoPath}}
Goal tracker path: {{goalTrackerPath}}
Eval patch path: {{evalPatchPath}}
Patch artifact path: {{patchArtifactPath}}
Verification path: {{verificationPath}}
Summary path: {{summaryPath}}
Summary status: {{summaryStatus}}
Summary:
{{summary}}

Contract path: {{contractPath}}
Contract status: {{contractStatus}}
Contract:
{{contract}}

Spec evidence references:
{{specEvidenceReferences}}

Goal tracker schema:
{{goalTrackerSchema}}

Audit artifact-first. Do not reward plausible explanations unsupported by
patch, verification, contract, summary, plan, todo, tracker, or spec evidence.

Hard blocker rules:

1. Required deferral blocker.
   - Any `original_required` or `derived_required` item left deferred,
     postponed, skipped, or "optional for now" blocks PACT_COMPLETE.
   - If it is truly not required, mark it `invalidated_out_of_scope` with
     source evidence. Do not leave it as deferred.

2. Evidence grade blocker.
   - High-risk parser/format work cannot be complete with smoke tests only.
     Require fixture/compliance-style tests when relevant.
   - High-risk grammar/compiler/AST work cannot be complete with manual probes
     only. Require automated regressions for runtime and tooling surfaces.
   - Multi-surface work cannot be complete without equivalence evidence or a
     clear non-applicability proof.

3. AC narrowing blocker.
   - Reject worker attempts to weaken ACs after implementation.
   - Allow out-of-scope invalidation only when the AC was not original
     required and the source evidence supports that decision.

4. Claim audit blocker.
   - A summary claim without patch or verification evidence is not proof.
   - A missing summary is a process defect. It may justify continuation, but it
     blocks PACT_COMPLETE even when the patch applies.
   - Public verification can support completion only if it actually covers the
     relevant behavior; otherwise it is supporting evidence only.
   - If the worker changed files or ran meaningful verification after writing
     the summary, treat the summary as stale unless it was updated afterward.

5. Impact oracle blocker.
   - Build an Impact Oracle Matrix from patch metadata and changed files before
     accepting completion. Do not reuse the worker's matrix without auditing it.
   - Any changed high-risk surface with no oracle family, no evidence grade, or
     no source-backed non-applicability blocks PACT_COMPLETE.
   - Worker-chosen tests can be necessary but insufficient when changed files
     imply another oracle family.

6. Round budget / process blocker.
   - If the worker spent the round on broad implementation but left no summary,
     no importable checkpoint, or no mapped verification plan, request another
     bounded round. Do not reward "almost done" when artifacts are not
     recoverable.
   - Large contracts are acceptable only when required open surfaces remain
     explicit. A contract that relabels required tests, metadata, fallbacks, or
     duplicate surfaces as optional is scope drift.

7. Case-learned hidden-failure blockers.
   - PEP680 pattern: a new parser or file-format module that skips available
     fixture/compliance or error-focused tests is incomplete, even if smoke
     tests and public verification pass. If no in-tree corpus exists, require a
     synthetic corpus for valid values, invalid syntax, binary `load`,
     keyword-only `parse_float`, original float spelling, no path support, no
     writer APIs, and stdlib integration/import metadata.
   - PEP615 pattern: duplicate implementations, fallbacks, accelerators, or
     metadata generators require a surface equivalence audit. One working
     surface does not prove the other.
     Do not accept "not touched" as non-applicability when the plan, imported
     spec, implementation anchors, or changed public API imply the surface is
     part of the original task.
     For zoneinfo/timezone behavior, require oracle coverage or justified
     non-applicability for ordinary zones, weird/minimal TZif, TZ strings,
     folds/gaps, `fromutc`, variable-offset `time`, cache lifecycle, pickle,
     path traversal, tzdata fallback, and duplicate pure-Python/C surfaces when
     these are in scope.
   - PEP646 pattern: grammar/compiler changes need automated coverage for the
     parser, AST/tooling shape, runtime behavior, future-annotations behavior,
     negative syntax, and unparse/cosmetic roundtrip when relevant. If changed
     files include grammar/compiler/AST/unparser paths, do not accept only
     typing-focused tests when future or unparse oracles are implied.
   - Tracker drift pattern: an over-broad derived AC should be explicitly
     invalidated out of scope when source evidence supports it; do not force
     the worker to chase non-original work, and do not mark it complete by
     hand-wave.

Review output requirements:
- Findings first, ordered by severity.
- Goal Alignment Summary: AC count, forgotten items, unjustified deferrals,
  open verification debt, and out-of-scope invalidations.
- Evidence Grade Audit.
- Implementation Surface Inventory Audit.
- Impact Oracle Matrix Audit.
- Surface Equivalence Audit.
- Case-Learned Gate Audit.
- Round Budget / Summary Heartbeat Audit.
- Required Next Steps when incomplete.
- Goal Tracker Updates only when evidence supports status changes.
- Status Delta JSON when statuses change.

Write PACT_COMPLETE only if every hard blocker rule is satisfied.
