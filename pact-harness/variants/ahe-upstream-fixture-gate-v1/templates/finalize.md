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
- Round budget did not hide broad required work.
- All original_required and derived_required ACs are satisfied or reviewer invalidated_out_of_scope with evidence.
- Required deferred work is empty.
- Parser/file-format work has both valid and invalid fixture gate rows satisfied.
- Fixture evidence is materially present as committed artifacts, runnable probes, verification output, or legally available public test.patch evidence.
- Committed equivalent fixtures include equivalence rationale and runnable evidence.
- Description-only fixture claims, source inspection, and non-reproducible manual probes are not used as completion evidence.
- TOML/parser work proves valid fixture acceptance when relevant.
- TOML/parser work proves invalid fixture public decode exception wrapping when relevant.
- TOML/parser work proves exact message, line, column, end-of-document, and invalid-character formatting when public.
- TOML/parser work proves TOMLDecodeError constructor and __module__ behavior when exported.
- TOML/parser work proves invalid parse_float return ValueError behavior when parse_float is supported.
- Open high-risk verification debt is empty.
- Public verification does not block final hidden scoring.

The final summary must include:
- Completion decision.
- Summary Heartbeat outcome.
- Round Budget outcome.
- Requirement Source outcome.
- Fixture Materiality outcome.
- Fixture Gate Matrix outcome.
- Failure Signature Gate outcome.
- Evidence Provenance outcome.
- Verification Debt outcome.
- Optional risks that remain non-blocking.

If final failure evidence is available to finalize, do not describe it as a generic failure. Map each signature back to missing fixture or error gates: valid fixture rejected, invalid fixture raw exception leak, exact error mismatch, TOMLDecodeError constructor/module mismatch, or invalid parse_float return acceptance.

Do not claim complete coverage unless the tracker, review, patch artifacts, and verification artifacts support every checklist item.
