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
- Impact Oracle Matrix required rows are satisfied or non_applicable_with_evidence.
- Evidence provenance is strong enough for each high-risk surface.
- Parser/format work has upstream_oracle or committed_equivalent_fixture evidence, or reviewer-approved non-applicability.
- Grammar/compiler/AST work has parser, AST, runtime, future annotations, type-hints, unparse, and negative syntax evidence where relevant.
- Zoneinfo work has weird TZif, TZ string, fold/gap/fromutc, cache/weakref/GC, pickle/path, and Python/C parity evidence where relevant.
- Multi-surface work has equivalence evidence or non-applicability.
- Public verification does not block final hidden scoring.

The final summary must include:
- Completion decision.
- Summary Heartbeat outcome.
- Round Budget outcome.
- Requirement Source outcome.
- Impact Oracle Matrix outcome.
- Evidence Provenance outcome.
- Verification Debt outcome.
- Surface Equivalence outcome.
- Case-Learned Oracle outcome.
- Optional risks that remain non-blocking.

If hidden or final failure evidence is available to finalize, do not describe it as a generic failure. Map each signature back to missing oracle families for the next AHE iteration, such as zoneinfo fold/fromutc/cache/pickle/path/parity, grammar future annotations/type-hints/unparse, or TOML upstream fixtures/exact errors/exception/parse_float behavior.

Do not claim complete coverage unless the tracker, review, and verification artifacts support every checklist item.
