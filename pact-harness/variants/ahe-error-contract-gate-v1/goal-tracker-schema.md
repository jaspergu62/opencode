# Goal Tracker Schema: AHE Error Contract Gate V1

The tracker is the durable completion contract. For PEP680 or tomllib-style parser work, PACT_COMPLETE is impossible until the TOML Error Contract Gate has exact evidence for every required row.

## Summary Heartbeat

Each worker round must record a summary heartbeat before broad implementation, long-running probes, or large edits.

Fields:
- Round and timestamp or clear sequence marker.
- Bounded round objective.
- Current patch intent.
- Expected changed surfaces.
- Initial TOML Error Contract Gate rows.
- Known blockers and verification debt.

Rules:
- Missing heartbeat is a process blocker.
- A stale heartbeat is a blocker when material implementation or verification happened after the last summary update.
- Timeout without a summary is incomplete even if a patch exists.

## Round Budget

Each round must choose one coherent behavior slice.

Fields:
- Objective.
- In scope this round.
- Explicitly postponed required work.
- Staged checkpoint plan if the slice is broad.
- Stop condition.

Rules:
- Required TOML contract rows cannot be postponed and still counted complete.
- Broad parser implementation needs staged checkpoints and a current heartbeat.

## Requirement Source Ledger

Every acceptance criterion and behavior obligation must include:
- ID.
- Requirement.
- Source class: original_required, derived_required, optional_check, out_of_scope.
- Source evidence pointer.
- Risk class: low, medium, high.
- Status: pending, in_progress, partial, satisfied, deferred_required, invalidated_out_of_scope, blocked.

Rules:
- original_required and derived_required cannot be dropped, narrowed, or marked optional without reviewer approval.
- For PEP680/tomllib work, exact error contracts are derived_required unless reviewer proves the TOML parser surface is out of scope.
- AC does not require exact messages is not a valid reason to bypass this schema.

## Implementation Surface Inventory

List separate surfaces before narrowing scope:
- Public API: load, loads, TOMLDecodeError, parse_float.
- Parser value dispatch and error construction.
- Date and datetime parsing.
- Fixture ingestion for valid and invalid TOML documents.
- Exception constructor behavior and module metadata.
- Recursion, deepcopy, and public API behavior when relevant.

Fields:
- Surface name.
- Why it is in scope, out of scope, or uncertain.
- Source pointer.
- Required evidence.
- Status: uninspected, required_open, implemented_unverified, verified, invalidated_out_of_scope.

## TOML Error Contract Gate

For every PEP680/tomllib parser implementation, record these rows. All rows are required unless reviewer marks the entire TOML parser/API surface invalidated_out_of_scope with source evidence.

Fields:
- Contract ID.
- Behavior surface.
- Required exact evidence.
- Evidence artifact.
- Evidence provenance grade.
- Status: missing, partial, satisfied, non_applicable_with_evidence.

Required rows:
- ECT-VALID-FIXTURES: upstream-compatible valid TOML fixtures are accepted and produce the expected Python data model.
- ECT-INVALID-FIXTURES: upstream-compatible invalid TOML fixtures are rejected with TOMLDecodeError, not raw parser, date, or ValueError leaks except where the public API requires ValueError.
- ECT-LINE-COL-MESSAGE: TOMLDecodeError string output proves exact message text plus line and column formatting for invalid values.
- ECT-MISSING-VALUE: missing value after a key or equals sign proves exact Invalid value wording and the expected end-of-document or line/column location.
- ECT-INVALID-CHAR-QUOTES: invalid-character errors include the invalid character using the expected quoted repr formatting, including whitespace and newline characters.
- ECT-EXCEPTION-API: TOMLDecodeError no-argument construction succeeds, three-argument construction behaves like the public contract, and __module__ matches tomllib.
- ECT-INVALID-DATE-WRAP: invalid date or datetime components are wrapped as TOMLDecodeError with location evidence instead of leaking date/time ValueError.
- ECT-PARSE-FLOAT-INVALID-RETURN: parse_float returning an invalid container type raises ValueError.
- ECT-PUBLIC-API-REGRESSION: load, loads, parse_float, deepcopy, and recursion behavior that is already working stays covered when parser internals change.

## Evidence Provenance Grades

Allowed grades:
- upstream_fixture_oracle: upstream fixture, reference test, standard conformance corpus, or in-tree equivalent copied from authoritative context.
- exact_contract_regression: committed automated test or patch-captured regression that asserts the exact message, location, constructor, wrapping, or ValueError contract.
- committed_equivalent_fixture: committed local fixture with explicit equivalence rationale to upstream or standard behavior.
- public_verification: public PACT verification artifact. It satisfies a row only when it exercises the exact contract.
- custom_parser_probe: ad hoc or local probe. Partial only.
- manual_probe: partial only.
- source_inspection: risk note only.
- hidden_unavailable: cannot satisfy a required row.

Rules:
- Required TOML Error Contract Gate rows need upstream_fixture_oracle, exact_contract_regression, or committed_equivalent_fixture evidence.
- Public verification passing is supporting evidence only unless the artifact shows the exact contract row.
- Custom parser probes alone cannot satisfy fixture, exact message, constructor, wrapping, or parse_float rows.

## Verification Debt Ledger

Record unresolved evidence gaps:
- Debt ID.
- Linked AC or contract row.
- Missing evidence.
- Why it matters.
- Status: open, non_blocking_optional, closed, invalidated_out_of_scope.

Rules:
- Open debt linked to a required TOML Error Contract Gate row blocks PACT_COMPLETE.
- Debt may be non-blocking only when optional or out of scope with evidence.

## Completion Gate

PACT_COMPLETE is valid only when:
- Summary heartbeat exists and is current.
- Round budget did not hide required parser work.
- All original_required and derived_required ACs are satisfied or reviewer-approved invalidated_out_of_scope.
- Required deferred work is empty.
- Every TOML Error Contract Gate row is satisfied or non_applicable_with_evidence.
- Open high-risk verification debt is empty.
- Public verification does not block final hidden scoring.
- The final summary does not use public tests pass, AC does not require exact messages, custom parser probes only, or hidden unavailable as completion evidence.
