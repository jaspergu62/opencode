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

Error-contract worker workflow:

1. Before source edits or long probes, create or update the summary at {{summaryPath}} with a Summary Heartbeat.
Include:
- bounded round objective,
- expected changed surfaces,
- initial TOML Error Contract Gate rows,
- known verification debt,
- staged checkpoint plan if work is broad.

2. Read the todo, goal tracker, contract, and relevant source/spec evidence. Do not edit PACT-owned artifacts as solution changes.

3. Rebuild the Requirement Source Ledger and Implementation Surface Inventory.
For tomllib work, treat these as separate surfaces: load, loads, TOMLDecodeError, parse_float, value parsing, date/datetime parsing, fixture acceptance and rejection, exception message construction, recursion, and deepcopy.

4. Build the TOML Error Contract Gate before implementation.
Required rows are:
- ECT-VALID-FIXTURES: upstream-compatible valid fixtures accepted.
- ECT-INVALID-FIXTURES: upstream-compatible invalid fixtures rejected with TOMLDecodeError.
- ECT-LINE-COL-MESSAGE: exact TOMLDecodeError message, line, and column formatting.
- ECT-MISSING-VALUE: exact missing-value wording and location.
- ECT-INVALID-CHAR-QUOTES: invalid-character quoted repr formatting.
- ECT-EXCEPTION-API: TOMLDecodeError no-arg constructor, three-arg constructor, and module behavior.
- ECT-INVALID-DATE-WRAP: invalid date or datetime wraps as TOMLDecodeError.
- ECT-PARSE-FLOAT-INVALID-RETURN: invalid parse_float return raises ValueError.
- ECT-PUBLIC-API-REGRESSION: load, loads, parse_float, deepcopy, and recursion behavior stays covered when relevant.

5. Implement the smallest coherent patch that can satisfy behavior and contract evidence.
Prefer upstream_fixture_oracle, exact_contract_regression, or committed_equivalent_fixture evidence. Do not rely on custom parser probes alone.

6. Verify the exact contract.
Public verification is useful, but PACT_COMPLETE requires artifacts that show the exact rows above. A claim that AC does not require exact messages is not a valid completion argument for tomllib.

Your final summary update must include:
- Summary Heartbeat status.
- Round Budget outcome.
- Requirement Source Ledger.
- Implementation Surface Inventory.
- TOML Error Contract Gate.
- Evidence Provenance Grade Ledger.
- Verification Debt Ledger.
- Deferred and Rejected Work.
- Goal Tracker Update Request.

Completion claims are invalid if any required TOML Error Contract Gate row is missing, partial, or supported only by public tests, custom parser probes, manual probes, source inspection, or hidden unavailable.
After writing the final summary update, stop work and return control to PACT.
