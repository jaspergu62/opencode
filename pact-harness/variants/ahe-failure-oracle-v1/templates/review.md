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

Audit artifact-first. Do not reward plausible explanations unsupported by patch, verification, contract, summary, plan, todo, tracker, or spec evidence.

Hard blocker rules:

1. Summary heartbeat blocker.
- Missing summary, missing heartbeat, or timeout before summary blocks PACT_COMPLETE.
- If meaningful edits or verification happened after the latest summary update, treat the summary as stale and block completion.

2. Round budget blocker.
- A broad subsystem patch without a bounded objective and staged checkpoints blocks completion.
- Required work postponed by the budget remains open debt and blocks completion.

3. Impact Oracle Matrix blocker.
- Every required high-risk changed surface must have an oracle row with required oracle family, provenance grade, artifact, and status.
- Missing oracle families block completion even when public verification passes.

4. Evidence provenance blocker.
- upstream_oracle can satisfy covered high-risk behavior.
- committed_equivalent_fixture can satisfy only with explicit equivalence rationale.
- synthetic_local_test is partial for high-risk parser, grammar, compiler, timezone, serialization, and stdlib integration surfaces.
- manual_probe is partial only.
- source_inspection is a risk note only.
- hidden_unavailable cannot satisfy a required oracle row.

5. Required deferral and AC narrowing blocker.
- Any original_required or derived_required item left deferred, postponed, skipped, or optional for now blocks PACT_COMPLETE.
- Reject worker attempts to weaken ACs after implementation.
- Allow out-of-scope invalidation only when the AC was not original required and source evidence supports that decision.

6. Case-learned oracle blockers.
- Zoneinfo pattern: require evidence for weird/minimal TZif, TZ string localized/from_utc/invalid behavior, fold/gap/fromutc/fold mutation, cache/weakref/GC behavior, pickle/path behavior, and Python/C-backed parity when relevant.
- Grammar/compiler pattern: require parser, AST shape and validation, compiler/runtime, future annotations, typing.get_type_hints or ForwardRef, unparse cosmetic/slice roundtrip, and negative syntax evidence when relevant.
- TOML/parser pattern: local synthetic corpus alone is partial. Require upstream-compatible valid and invalid fixtures or equivalence rationale, exact error-message expectations, public exception constructor/module behavior, parse_float failure behavior, and relevant public API/recursion/deepcopy evidence.

Review output requirements:
- Findings first, ordered by severity.
- Summary Heartbeat Audit.
- Round Budget Audit.
- Goal Alignment Summary: AC count, forgotten items, unjustified deferrals, open verification debt, and out-of-scope invalidations.
- Impact Oracle Matrix Audit.
- Evidence Provenance Audit.
- Implementation Surface Inventory Audit.
- Surface Equivalence Audit.
- Case-Learned Oracle Audit.
- Required Next Steps when incomplete.
- Goal Tracker Updates only when evidence supports status changes.
- Status Delta JSON when statuses change.

Write PACT_COMPLETE only if every hard blocker rule is satisfied.
