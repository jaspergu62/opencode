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

2. TOML Error Contract Gate blocker.
For PEP680, tomllib, or TOML parser/API work, PACT_COMPLETE is impossible unless every required row is satisfied or source-proven non-applicable:
- upstream-compatible valid fixtures accepted,
- upstream-compatible invalid fixtures rejected with TOMLDecodeError,
- exact TOMLDecodeError message, line, and column formatting,
- exact missing-value wording and location,
- invalid-character quoted repr formatting,
- TOMLDecodeError no-argument constructor behavior,
- TOMLDecodeError three-argument constructor behavior,
- TOMLDecodeError module behavior,
- invalid date or datetime wraps as TOMLDecodeError,
- invalid parse_float return raises ValueError,
- relevant load, loads, parse_float, deepcopy, and recursion regressions stay covered.

3. Evidence provenance blocker.
- upstream_fixture_oracle, exact_contract_regression, or committed_equivalent_fixture can close covered required rows.
- public_verification closes a row only if it directly asserts that exact row.
- custom_parser_probe, manual_probe, source_inspection, and hidden_unavailable are partial only.

4. Forbidden acceptance rationales.
Reject PACT_COMPLETE when the worker or reviewer relies on any of these claims for a required row:
- public tests pass,
- AC does not require exact messages,
- custom parser probes show enough behavior,
- the exact exception path was not touched,
- hidden tests are unavailable,
- fixture corpus would be too broad.

5. Required deferral and AC narrowing blocker.
- Any original_required or derived_required item left deferred, postponed, skipped, or optional for now blocks PACT_COMPLETE.
- Exact TOMLDecodeError behavior is derived_required for tomllib unless source evidence proves the TOML parser/API surface is out of scope.
- Allow out-of-scope invalidation only when the AC was not original required and source evidence supports that decision.

Review output requirements:
- Findings first, ordered by severity.
- Summary Heartbeat Audit.
- Goal Alignment Summary: AC count, forgotten items, unjustified deferrals, open verification debt, and out-of-scope invalidations.
- TOML Error Contract Gate Audit.
- Evidence Provenance Audit.
- Implementation Surface Inventory Audit.
- Required Next Steps when incomplete.
- Goal Tracker Updates only when evidence supports status changes.
- Status Delta JSON when statuses change.

Write PACT_COMPLETE only if every hard blocker rule is satisfied.
