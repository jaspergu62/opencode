{{defaultPrompt}}

Round: {{round}} {{roundName}}
Loop directory: {{loopDir}}
Goal tracker path: {{goalTrackerPath}}
Plan path: {{planPath}}
Finalize summary path: {{finalizeSummaryPath}}

Goal tracker schema:
{{goalTrackerSchema}}

Finalize from durable artifacts only. Do not convert uncertainty into success.

Hidden-readiness checklist:
- Summary heartbeat exists and is current.
- All original_required and derived_required ACs are satisfied or reviewer invalidated_out_of_scope with evidence.
- Required deferred work is empty.
- Every TOML Error Contract Gate row is satisfied or source-proven non-applicable.
- Valid TOML fixtures are accepted with expected data model evidence.
- Invalid TOML fixtures raise TOMLDecodeError where required.
- TOMLDecodeError exact message, line, column, missing-value location, and invalid-character quoted repr are proven.
- TOMLDecodeError no-arg constructor, three-arg constructor, and module behavior are proven.
- Invalid date or datetime errors are wrapped as TOMLDecodeError.
- Invalid parse_float return raises ValueError.
- Relevant load, loads, parse_float, deepcopy, and recursion behavior stays covered.
- Public tests pass is not used as a substitute for exact contract evidence.
- AC does not require exact messages is not used to bypass the tracker schema.
- Custom parser probes only are not used to close required rows.
- Open high-risk verification debt is empty.
- Public verification does not block final hidden scoring.

The final summary must include:
- Completion decision.
- Summary Heartbeat outcome.
- Requirement Source outcome.
- TOML Error Contract Gate outcome.
- Evidence Provenance outcome.
- Verification Debt outcome.
- Optional risks that remain non-blocking.

If any required TOML Error Contract Gate row is missing, partial, stale, or supported only by public verification, custom probes, manual probes, source inspection, or hidden unavailable, finalize as incomplete.
Do not claim complete coverage unless the tracker, review, and verification artifacts support every checklist item.
