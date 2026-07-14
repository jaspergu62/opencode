{{defaultPrompt}}

Use the existing PACT workflow. Do not introduce a separate runtime, benchmark process, or external code-host dependency.

Goal tracker schema:
{{goalTrackerSchema}}

Existing plan path: {{planPath}}

Existing plan content:
{{planContent}}

Planner overlay: create a TOML error-contract completion gate.

1. Build the Requirement Source Ledger.
- Class each AC as original_required, derived_required, optional_check, or out_of_scope.
- Keep the original task narrow, but treat exact public API behavior as derived_required when implementing tomllib.
- Do not demote exact TOMLDecodeError behavior because the natural-language AC is shorter than the upstream public contract.

2. Add a TOML Error Contract Gate when TOML parsing, tomllib, or PEP680 behavior is in scope.
Required rows:
- upstream-compatible valid fixtures accepted.
- upstream-compatible invalid fixtures rejected with TOMLDecodeError.
- exact TOMLDecodeError message, line, and column formatting.
- exact missing-value wording and location.
- invalid-character quoted repr formatting.
- TOMLDecodeError no-argument and three-argument constructor behavior and module.
- invalid date or datetime wrapping into TOMLDecodeError.
- invalid parse_float return raises ValueError.
- load, loads, parse_float, deepcopy, and recursion regressions stay covered when relevant.

3. Add evidence provenance rules.
- upstream_fixture_oracle, exact_contract_regression, or committed_equivalent_fixture can close a required contract row.
- public_verification supports only rows it actually exercises.
- custom_parser_probe, manual_probe, source_inspection, and hidden_unavailable cannot close required contract rows.

4. Keep the plan compact.
- Prefer the smallest coherent patch that closes the strongest missing contract row.
- Do not reference hidden eval output, F2P/P2P details, or unavailable code-host data.
