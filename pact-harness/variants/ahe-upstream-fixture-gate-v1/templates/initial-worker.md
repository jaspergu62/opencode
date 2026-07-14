{{defaultPrompt}}

Round: {{round}} {{roundName}}
Loop directory: {{loopDir}}

Objective:
{{objective}}

Current state snapshot:
{{currentStateSnapshot}}

Spec evidence references:
{{specEvidenceReferences}}

Pre-snapshot path: {{preSnapshotPath}}
Todo path: {{todoPath}}
Goal tracker path: {{goalTrackerPath}}
Summary path: {{summaryPath}}
Contract path: {{contractPath}}

Goal tracker schema:
{{goalTrackerSchema}}

Upstream-fixture worker workflow:

1. Before source edits or long probes, create or update the summary at {{summaryPath}} with a Summary Heartbeat.
Include bounded objective, expected parser/file-format/API/error surfaces, initial Fixture Gate Matrix rows, initial Failure Signature Gate rows, known verification debt, and staged checkpoints if work is broad.

2. Read the todo, goal tracker, contract, and relevant source/spec evidence. Do not edit PACT-owned artifacts as solution changes.

3. Rebuild the Requirement Source Ledger.
- Treat parser/file-format compatibility, fixture parity, exact public error behavior, exported exception behavior, and parse_float validation as high-risk when relevant.
- Do not narrow required ACs to fit the patch.

4. Build the Parser/File-Format Fixture Gate before claiming implementation completion.
For every parser/file-format surface, record valid fixture family, invalid fixture family, upstream or equivalence source, artifact path or public test.patch pointer when legally available, runnable command or probe path, observed result, provenance grade, and status.

5. Make fixture evidence material.
- Prefer upstream-compatible fixtures copied from authoritative in-tree, imported spec, standard-conformance, or legally available public test context.
- If upstream fixtures are not directly available, create committed equivalent fixtures or tests and explain equivalence.
- Include runnable probes or test commands that exercise those fixtures.
- A summary that merely says upstream fixtures were considered is not enough.

6. For TOML/tomllib-style work, satisfy the Failure Signature Gate when relevant.
Required evidence must cover valid fixture acceptance, invalid fixture public decode exception wrapping instead of raw implementation exceptions, exact message/location/invalid-character behavior, TOMLDecodeError constructor and __module__ behavior through the public export, and invalid parse_float return ValueError behavior.

7. Implement the smallest coherent patch that can satisfy behavior and fixture evidence. Keep required fixture or signature gaps open as verification debt; do not label them optional unless source evidence proves they are out of scope.

Your final summary update must include Summary Heartbeat status, Round Budget outcome, Requirement Source Ledger, Parser/File-Format Fixture Gate, Fixture Gate Matrix, Failure Signature Gate, Evidence Provenance Grade Ledger, Verification Debt Ledger, and Goal Tracker Update Request.

Completion claims are invalid if valid and invalid parser/file-format fixtures are not materially present as artifacts, runnable probes, or legally available public test.patch evidence. After writing the final summary update, stop work and return control to PACT.
