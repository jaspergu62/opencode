# Goal Tracker Schema: AHE Reference Port Parity V1

The tracker is the durable completion contract. For parser and file-format tasks, it must force reference-port parity before PACT_COMPLETE. Local plausibility is not enough when an upstream-compatible implementation or tomli-compatible behavior is the natural target.

## Summary Heartbeat

Each worker round must record a summary heartbeat before source edits, long probes, or broad parser rewrites.

Fields:
- Round and timestamp or clear sequence marker.
- Bounded objective.
- Parser or file-format surfaces in scope.
- Current reference-port strategy.
- Initial Reference Parity Ledger rows.
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
- Staged checkpoint plan when the slice is broad.
- Stop condition.

Rules:
- Broad parser rewrites need staged checkpoints and a heartbeat before broad work starts.
- Required postponed work remains open verification debt and blocks completion.

## Requirement Source Ledger

Every acceptance criterion and behavior obligation must include:
- ID.
- Requirement.
- Source class: `original_required`, `derived_required`, `optional_check`, `out_of_scope`.
- Source evidence pointer.
- Risk class: `low`, `medium`, `high`.
- Status: `pending`, `in_progress`, `partial`, `satisfied`, `deferred_required`, `invalidated_out_of_scope`, `blocked`.

Rules:
- `original_required` and `derived_required` cannot be dropped, narrowed, or marked optional without reviewer approval.
- Parser and file-format work is high risk by default.
- Optional checks and out-of-scope items must not block completion.

## Reference-Port Strategy

Parser and file-format tasks must start from reference behavior.

Allowed strategies:
- `port_reference`: port or closely mirror upstream, CPython, tomli, or standard-library reference behavior.
- `adapt_reference`: adapt reference behavior where repository constraints require changes, with documented deltas.
- `independent_with_reference_comparison`: independent implementation with committed comparisons to upstream, tomli, or authoritative fixtures.
- `non_parser_task`: not applicable with evidence.

Rules:
- Workers should prefer `port_reference` or `adapt_reference` for TOML/parser tasks.
- `independent_with_reference_comparison` requires documented behavior comparisons before completion.
- A local synthetic parser is partial until reference parity evidence closes the required rows.

## Reference Parity Ledger

For each required parser behavior, record:
- Row ID.
- Surface or behavior.
- Hidden-signature family: `fixture_acceptance`, `fixture_rejection`, `exact_error_message_location`, `parse_float_invalid_return`, `datetime_date_error_wrapping`, `tomldecodeerror_constructor_module`, `public_api_recursion_deepcopy`, `other_reference_behavior`.
- Reference source: upstream fixture, tomli behavior, TOML spec, in-tree reference test, committed equivalent fixture, direct unittest probe, or documented reference comparison.
- Expected parity behavior.
- Evidence artifact.
- Evidence grade.
- Status: `missing`, `partial_probe`, `fixture_committed`, `reference_compared`, `satisfied`, `non_applicable_with_reviewer_evidence`.

Rules:
- Every required parser row must be `satisfied` or `non_applicable_with_reviewer_evidence` before PACT_COMPLETE.
- Valid fixture acceptance, invalid fixture rejection, exact error messages and locations, invalid `parse_float` return handling, invalid datetime/date wrapping, and `TOMLDecodeError` constructor/module behavior are required rows for TOML parser work unless reviewer records evidence-backed non-applicability.
- The ledger must be grounded in artifacts, not confidence or prose alone.

## Required TOML Parser Parity Rows

Use these rows whenever TOML parser behavior is relevant:
- Valid fixture acceptance: upstream-compatible or tomli-compatible accepted TOML forms, including scalars, containers, dotted keys, arrays of tables, inline tables and arrays, multiline strings, numeric spellings, dates, times, and datetimes.
- Invalid fixture rejection: upstream-compatible or tomli-compatible rejection for malformed keys, tables, strings, arrays, inline tables, invalid characters, incomplete key/value pairs, invalid dates, invalid times, and invalid datetimes.
- Exact errors and locations: `TOMLDecodeError` string behavior, line, column, end-of-document location, and invalid-character display formatting.
- `parse_float` invalid returns: callbacks returning invalid TOML value types raise the reference-compatible `ValueError` behavior instead of silently accepting the value.
- Datetime/date wrapping: invalid date, time, and datetime construction errors are wrapped as `TOMLDecodeError`, not leaked as raw implementation exceptions.
- `TOMLDecodeError` constructor/module: public constructor and `__module__` behavior match the exported `tomllib` API expectation.
- Public API behavior: `load`, `loads`, binary input handling, keyword-only `parse_float`, deepcopy, recursion limits, import/install metadata, and writer/path non-goals when relevant.

## Evidence Provenance Grades

Allowed grades:
- `upstream_or_tomli_oracle`: authoritative fixture, reference test, or tomli/CPython behavior comparison.
- `committed_reference_fixture`: committed local fixture or test copied from or explicitly equivalent to a reference behavior.
- `direct_unittest_probe`: recorded unittest or focused command that exercises the target public API and exact assertion.
- `documented_reference_comparison`: summary that names the reference behavior, the local behavior, and the evidence artifact for parity.
- `public_verification`: configured PACT verification, enough only for behavior it actually exercises.
- `synthetic_local_without_reference`: partial for parser work.
- `manual_probe`: partial only.
- `source_inspection`: risk note only.
- `hidden_unavailable`: cannot satisfy a row.

Rules:
- A required parser parity row must have `upstream_or_tomli_oracle`, `committed_reference_fixture`, `direct_unittest_probe`, or `documented_reference_comparison` evidence before completion.
- Synthetic local tests alone are partial for parser tasks unless they are tied to an explicit reference-equivalence rationale.
- Manual probes and source inspection cannot close high-risk parser rows.

## Verification Debt Ledger

Record unresolved evidence gaps:
- Debt ID.
- Linked AC or Reference Parity Ledger row.
- Missing evidence.
- Why it matters.
- Status: `open`, `non_blocking_optional`, `closed`, `invalidated_out_of_scope`.

Rules:
- Open debt linked to required parser parity blocks PACT_COMPLETE.
- Debt may be non-blocking only when optional or out of scope with evidence.

## Impact Oracle Matrix

For each changed or required surface, record:
- Surface.
- Why it is in scope.
- Failure family it could hide.
- Required oracle family.
- Linked Reference Parity Ledger rows when parser behavior is involved.
- Evidence artifact.
- Status: `missing`, `partial`, `satisfied`, `non_applicable_with_evidence`.

Completion requires every required high-risk oracle row to be satisfied or non-applicable with evidence.

## Surface Equivalence Matrix

Use when multiple implementation surfaces, fallbacks, or integration points exist:
- Surface A and Surface B.
- Behavior that must match.
- Evidence and provenance grade.
- Status: `unverified`, `equivalent`, `divergent`, `not_applicable_with_evidence`.

## Completion Gate

PACT_COMPLETE is valid only when:
- Summary heartbeat exists and is current.
- Round budget did not hide required broad work.
- All `original_required` and `derived_required` ACs are satisfied or reviewer-approved `invalidated_out_of_scope`.
- Required deferred work is empty.
- Open high-risk verification debt is empty.
- Parser and file-format tasks have a complete Reference Parity Ledger.
- Required parser parity rows are satisfied by committed fixtures, direct unittest probes, or documented reference comparison.
- Impact Oracle Matrix required rows are satisfied or non-applicable with evidence.
- Multi-surface equivalence is proven or non-applicable with evidence.
- Public verification does not block final hidden scoring.
- The final summary names remaining optional risks without using them as evidence of completion.
