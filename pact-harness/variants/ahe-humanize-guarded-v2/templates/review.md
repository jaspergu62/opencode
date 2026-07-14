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
   - Public verification can support completion only if it actually covers the
     relevant behavior; otherwise it is supporting evidence only.
   - If the worker changed files or ran meaningful verification after writing
     the summary, treat the summary as stale unless it was updated afterward.

5. Case-learned hidden-failure blockers.
   - PEP680 pattern: a new parser or file-format module that skips available
     fixture/compliance or error-focused tests is incomplete, even if smoke
     tests and public verification pass.
   - PEP615 pattern: duplicate implementations, fallbacks, accelerators, or
     metadata generators require a surface equivalence audit. One working
     surface does not prove the other.
     Do not accept "not touched" as non-applicability when the plan, imported
     spec, implementation anchors, or changed public API imply the surface is
     part of the original task.
   - PEP646 pattern: grammar/compiler changes need automated coverage for the
     parser, AST/tooling shape, runtime behavior, future-annotations behavior,
     and negative syntax when relevant.
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
- Surface Equivalence Audit.
- Case-Learned Gate Audit.
- Required Next Steps when incomplete.
- Goal Tracker Updates only when evidence supports status changes.
- Status Delta JSON when statuses change.

Write PACT_COMPLETE only if every hard blocker rule is satisfied.
