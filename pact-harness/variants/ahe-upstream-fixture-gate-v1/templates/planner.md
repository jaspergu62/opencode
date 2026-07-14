{{defaultPrompt}}

Use the existing PACT workflow. Do not introduce a separate runtime, benchmark process, external code-host dependency, or TypeScript runner change.

Goal tracker schema:
{{goalTrackerSchema}}

Existing plan path: {{planPath}}

Existing plan content:
{{planContent}}

Planner overlay: create an upstream fixture completion contract for parser/file-format work.

1. Identify fixture-gated surfaces.
- Mark parser, file-format, loader, serializer, grammar, and stdlib parsing API work as high-risk by default.
- If TOML/tomllib-style behavior is in scope, add hard fixture gates for valid fixtures, invalid fixtures, public error behavior, public exception behavior, and parse_float validation.

2. Add a Parser/File-Format Fixture Gate.
- Completion requires upstream-compatible valid and invalid fixtures, or committed equivalent fixtures with equivalence rationale.
- Fixture evidence must be materially present as artifact paths, runnable probes, verification output, or legally available public test.patch evidence.
- Description-only fixture claims, source inspection, and non-reproducible manual probes are insufficient.

3. Add a Fixture Gate Matrix.
For each parser/file-format surface, require rows for fixture family, upstream or equivalence source, artifact path or public test.patch pointer, runnable command or probe, observed result, provenance grade, and status.

4. Add a Failure Signature Gate for TOML/parser/file-format imports.
Required signatures when relevant:
- valid fixture rejected,
- invalid fixture leaks raw exceptions instead of the public decode exception,
- exact message, line, column, end-of-document, and invalid-character quoting behavior,
- TOMLDecodeError constructor and __module__ behavior,
- invalid parse_float return behavior.

5. Add evidence provenance rules.
- upstream_oracle_fixture and committed_equivalent_fixture can close covered high-risk behavior only when the artifact and runnable probe are present.
- public_test_patch_oracle can close behavior only when the public artifact is legally available in the current PACT context.
- synthetic_local_test is partial unless upgraded into a committed equivalent fixture with rationale and a probe.
- manual_probe and source_inspection never close the fixture gate.

6. Keep ACs behavioral and audit-ready.
- Do not narrow exact error behavior to optional for stdlib-compatible parser APIs unless source evidence proves exact errors are out of scope.
- Do not count public verification as fixture evidence unless it names and exercises the fixture gate rows.
