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
- Open high-risk verification debt is empty.
- Parser and file-format tasks have a complete Reference Parity Ledger.
- Each required parser parity row has committed fixture, direct unittest probe, or documented reference comparison evidence.
- Valid fixture acceptance and invalid fixture rejection parity are proven when relevant.
- Exact error message and location behavior is proven when relevant.
- Invalid `parse_float` return behavior is proven when relevant.
- Invalid datetime/date wrapping into parser decode errors is proven when relevant.
- `TOMLDecodeError` constructor and module behavior is proven when relevant.
- Impact Oracle Matrix required rows are satisfied or non_applicable_with_evidence.
- Multi-surface work has equivalence evidence or non-applicability.
- Public verification does not block final hidden scoring.

The final summary must include:
- Completion decision.
- Summary Heartbeat outcome.
- Round Budget outcome.
- Requirement Source outcome.
- Reference-Port Strategy outcome.
- Reference Parity Ledger outcome.
- Evidence Provenance outcome.
- Verification Debt outcome.
- Impact Oracle Matrix outcome.
- Surface Equivalence outcome.
- Optional risks that remain non-blocking.

If final failure evidence is available to finalize, do not describe it as a generic failure. Map each signature back to missing reference parity rows such as fixture acceptance, fixture rejection, exact errors and locations, invalid `parse_float` returns, datetime/date wrapping, or `TOMLDecodeError` constructor/module behavior.

Do not claim complete coverage unless the tracker, review, and verification artifacts support every checklist item.
