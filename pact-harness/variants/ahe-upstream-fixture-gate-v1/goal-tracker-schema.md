# Goal Tracker Schema: AHE Upstream Fixture Gate V1

The tracker is the durable completion contract. Parser and file-format work cannot complete on prose, confidence, source inspection, or synthetic spot checks alone. Completion requires material fixture evidence that can be inspected or rerun.

## Summary Heartbeat

Each worker round must record a heartbeat before broad implementation, long-running probes, or large edits.

Fields:
- Round and sequence marker.
- Bounded objective.
- Expected parser, file-format, public API, and error surfaces.
- Initial Fixture Gate Matrix rows.
- Initial Failure Signature Gate rows.
- Known verification debt.

Rules:
- Missing or stale heartbeat blocks PACT_COMPLETE.
- Timeout without a current summary is incomplete even if a patch exists.

## Requirement Source Ledger

Every acceptance criterion and behavior obligation must include ID, requirement, source class, source evidence pointer, risk class, and status.

Allowed source classes: original_required, derived_required, optional_check, out_of_scope.
Allowed statuses: pending, in_progress, partial, satisfied, deferred_required, invalidated_out_of_scope, blocked.

Rules:
- Parser/file-format compatibility, upstream fixture parity, public exception semantics, exact error behavior, and parse_float validation are high-risk by default.
- Required items cannot be downgraded to optional after implementation without reviewer evidence.

## Parser/File-Format Fixture Gate

When a task adds or changes a parser, serializer, grammar, loader, or stdlib file-format API, PACT_COMPLETE is invalid unless all required fixture rows are satisfied.

Required rows:
- valid_fixture_gate: upstream-compatible valid fixtures or committed equivalent valid fixtures.
- invalid_fixture_gate: upstream-compatible invalid fixtures or committed equivalent invalid fixtures.
- runnable_probe_gate: a runnable test, probe, or verification command that exercises each fixture family.
- artifact_materiality_gate: fixture evidence exists as patch/workspace artifacts, verification artifacts, or legally available public test.patch evidence.

Insufficient evidence:
- prose that describes fixtures but cites no artifact path.
- source inspection without executing fixtures.
- manual probe text without a committed or reproducible probe.
- synthetic snippets without upstream-compatibility rationale.
- hidden_unavailable evidence.

Non-applicability requires reviewer evidence that the changed surface is not parser/file-format work or that no upstream, standard, imported, public test.patch, or committed-equivalent fixture source exists. For TOML/tomllib-style parsing, valid and invalid fixture non-applicability is not allowed unless TOML parsing is proven out of scope.

## Fixture Gate Matrix

For each parser/file-format surface, record:
- Surface.
- Fixture family: valid, invalid, error, API, recursion, parse_float, public load/loads.
- Upstream or equivalence source.
- Artifact path or public test.patch pointer.
- Runnable command or probe path.
- Observed result.
- Evidence provenance grade.
- Status: missing, partial, satisfied, non_applicable_with_evidence.

## Failure Signature Gate

For TOML/parser/file-format imports, especially tomllib-style work, these signatures are hard gates when relevant:
- valid_fixture_rejected: valid upstream-compatible fixtures parse successfully and match expected data.
- invalid_fixture_raw_exception: invalid fixtures raise the public decode exception, not raw ValueError, IndexError, KeyError, TypeError, or implementation exceptions.
- exact_error_behavior: message text, line, column, end-of-document, and invalid-character quoting behavior are checked when public.
- toml_decode_error_constructor_module: public TOMLDecodeError constructor and __module__ behavior match the stdlib API expectation.
- invalid_parse_float_return: parse_float returning an invalid type raises the expected ValueError.

Each signature row must cite a linked AC, artifact path or public test.patch pointer, runnable probe, observed result, and status.

## Evidence Provenance Grades

Allowed grades:
- upstream_oracle_fixture: authoritative fixture or reference test with runnable evidence.
- committed_equivalent_fixture: committed fixture with equivalence rationale and runnable evidence.
- public_test_patch_oracle: legally available public test.patch evidence; hidden or unavailable contents cannot be used.
- runnable_probe_artifact: committed test, script, or command output naming the fixture artifact.
- synthetic_local_test: partial unless upgraded to committed_equivalent_fixture.
- manual_probe: partial only.
- source_inspection: risk note only.
- public_verification: supports only behavior it actually exercises.
- hidden_unavailable: cannot satisfy required rows.

## Verification Debt Ledger

Record unresolved fixture, signature, or oracle gaps with debt ID, linked row, missing evidence, reason it matters, and status. Open required parser/file-format debt blocks PACT_COMPLETE.

## Completion Gate

PACT_COMPLETE is valid only when:
- Summary heartbeat exists and is current.
- Required deferred work is empty.
- All original_required and derived_required ACs are satisfied or reviewer-approved invalidated_out_of_scope.
- Fixture Gate Matrix has satisfied valid and invalid fixture rows for every parser/file-format surface.
- Fixture evidence is materially present as artifacts, runnable probes, or legally available public test.patch evidence.
- Failure Signature Gate rows are satisfied for valid fixture acceptance, invalid exception wrapping, exact error behavior, TOMLDecodeError constructor/module behavior, and invalid parse_float behavior when relevant.
- Open high-risk verification debt is empty.
- Public verification does not block final hidden scoring.
