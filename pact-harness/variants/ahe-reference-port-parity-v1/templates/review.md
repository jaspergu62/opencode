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

2. Reference-port strategy blocker.
- Parser or file-format work must name a Reference-Port Strategy.
- Completion is blocked if the worker chose independent behavior without documented comparison to upstream-compatible, CPython-compatible, tomli-compatible, or spec behavior.

3. Reference Parity Ledger blocker.
- Parser or file-format work must include a Reference Parity Ledger.
- TOML/parser completion requires rows for fixture acceptance, fixture rejection, exact error messages and locations, invalid `parse_float` returns, datetime/date wrapping, and `TOMLDecodeError` constructor/module behavior unless source-backed non-applicability is recorded.
- Missing required rows block completion even when public verification passes.

4. Evidence blocker.
- Each required parser parity row must be supported by committed fixtures, direct unittest probes, or documented reference comparison.
- Synthetic local parser tests are partial unless tied to reference equivalence.
- Manual probes are partial only.
- Source inspection is a risk note only.
- Hidden-unavailable evidence cannot satisfy a required row.

5. Specific TOML parity blockers.
- Valid fixture parity: completion requires evidence that accepted reference-compatible fixtures are accepted locally.
- Invalid fixture parity: completion requires evidence that rejected reference-compatible fixtures reject locally with the expected exception family.
- Exact errors and locations: completion requires evidence for string behavior, line, column, end-of-document, and invalid-character formatting when the parser reports errors.
- `parse_float` invalid return: completion requires evidence that invalid callback returns raise the expected `ValueError` behavior.
- Datetime/date wrapping: completion requires evidence that invalid date, time, and datetime construction errors are wrapped as parser decode errors rather than leaking raw implementation exceptions.
- `TOMLDecodeError` constructor/module: completion requires evidence for public constructor and exported module behavior.

6. Required deferral and AC narrowing blocker.
- Any original_required or derived_required item left deferred, postponed, skipped, or optional for now blocks PACT_COMPLETE.
- Reject worker attempts to weaken reference parity after implementation.
- Allow out-of-scope invalidation only when the AC was not original required and source evidence supports that decision.

Review output requirements:
- Findings first, ordered by severity.
- Summary Heartbeat Audit.
- Reference-Port Strategy Audit.
- Reference Parity Ledger Audit.
- TOML Parser Parity Audit.
- Evidence Provenance Audit.
- Goal Alignment Summary: AC count, forgotten items, unjustified deferrals, open verification debt, and out-of-scope invalidations.
- Impact Oracle Matrix Audit.
- Surface Equivalence Audit.
- Required Next Steps when incomplete.
- Goal Tracker Updates only when evidence supports status changes.
- Status Delta JSON when statuses change.

Write PACT_COMPLETE only if every hard blocker rule is satisfied.
