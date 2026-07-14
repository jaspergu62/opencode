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

2. Parser/file-format fixture materiality blocker.
- If the task changes or adds parser, file-format, loader, stdlib parsing API, or public parse error behavior, PACT_COMPLETE requires both valid and invalid fixture evidence.
- The valid and invalid fixture evidence must be materially present as committed artifacts, runnable probes, verification output, or legally available public test.patch evidence.
- A description that fixtures are upstream-compatible is insufficient without artifact paths and a command or probe that exercised them.
- Synthetic snippets are partial unless committed as equivalent fixtures with equivalence rationale and runnable probes.

3. Fixture Gate Matrix blocker.
- Every required parser/file-format surface must have rows for valid fixture family, invalid fixture family, upstream/equivalence source, artifact path or public test.patch pointer, runnable command or probe, observed result, provenance grade, and status.
- Missing rows, missing artifact paths, missing runnable probes, or partial provenance block completion.

4. TOML failure signature blockers.
For TOML/tomllib-style work, block PACT_COMPLETE unless evidence covers each relevant signature:
- valid fixture acceptance, so upstream-compatible valid fixture data is not rejected,
- invalid fixture wrapping, so invalid data raises the public decode exception and does not leak raw implementation exceptions,
- exact error behavior, including message, line, column, end-of-document, and invalid-character quoting when public,
- public TOMLDecodeError constructor and __module__ behavior,
- invalid parse_float return behavior raising the expected ValueError.

5. Exact error downgrade blocker.
- Do not accept claims that exact error behavior is optional for stdlib-compatible parser APIs unless source evidence proves the public contract excludes exact error text and location.
- Passing load/loads smoke tests does not satisfy exact error or invalid fixture behavior.

6. Evidence provenance blocker.
- upstream_oracle_fixture can satisfy covered high-risk behavior only with artifact and runnable evidence.
- committed_equivalent_fixture can satisfy only with explicit equivalence rationale, artifact path, and runnable evidence.
- public_test_patch_oracle can satisfy only when that public artifact is legally available in the PACT context.
- manual_probe is partial only.
- source_inspection is a risk note only.
- hidden_unavailable cannot satisfy a required oracle row.

7. Required deferral and AC narrowing blocker.
- Any original_required or derived_required parser/file-format item left deferred, postponed, skipped, or optional for now blocks PACT_COMPLETE.
- Reject worker attempts to weaken ACs after implementation.
- Allow out-of-scope invalidation only when the AC was not original required and source evidence supports that decision.

Review output requirements:
- Findings first, ordered by severity.
- Summary Heartbeat Audit.
- Fixture Materiality Audit.
- Fixture Gate Matrix Audit.
- Failure Signature Gate Audit.
- Goal Alignment Summary: AC count, forgotten items, unjustified deferrals, open verification debt, and out-of-scope invalidations.
- Evidence Provenance Audit.
- Required Next Steps when incomplete.
- Goal Tracker Updates only when evidence supports status changes.
- Status Delta JSON when statuses change.

Write PACT_COMPLETE only if every hard blocker rule is satisfied.
