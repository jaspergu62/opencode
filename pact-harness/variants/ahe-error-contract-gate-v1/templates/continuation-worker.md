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
Feedback path: {{feedbackPath}}
Continuation package path: {{continuationPackagePath}}
Plan path: {{planPath}}

Goal tracker schema:
{{goalTrackerSchema}}

Error-contract continuation workflow:

1. Before source edits or long probes, update the summary at {{summaryPath}} with a new Summary Heartbeat for this round.
Include the bounded objective, changed surfaces, TOML Error Contract Gate rows, known debt, and staged checkpoints if the target is broad.

2. Compare feedback, continuation package, prior summary, tracker, contract, plan, todo, and patch before editing. Classify each reviewer item as:
- accepted_required,
- accepted_contract_debt,
- accepted_verification_debt,
- rejected_out_of_scope,
- stale_or_already_proven,
- needs_clarifying_evidence.

3. Rebuild the TOML Error Contract Gate from the original requirement, imported plan, anchors, public API names, feedback, and current patch.
A required tomllib row skipped in a previous round is unresolved unless reviewer evidence invalidated the whole TOML parser/API surface.

4. Close the strongest remaining required contract gap first.
Prefer this order when multiple rows are open:
- exact TOMLDecodeError line, column, message, missing-value, and invalid-character quoted repr evidence,
- TOMLDecodeError no-arg and three-arg constructor plus module evidence,
- invalid date or datetime wrapping into TOMLDecodeError,
- invalid parse_float return ValueError,
- upstream-compatible valid and invalid fixture parity,
- public API regression coverage for load, loads, parse_float, deepcopy, and recursion.

5. Keep required deferrals incomplete until evidence closes them.
Do not accept public tests pass, AC does not require exact messages, or custom parser probes only as closure for required rows.

6. Re-check summary honesty before stopping. If code changed or meaningful verification ran after drafting the summary heartbeat, update the summary so it exactly matches the final patch and final evidence.

Your summary must include:
- Summary Heartbeat status.
- Feedback Classification.
- Round Budget outcome.
- TOML Error Contract Gate update.
- Requirement Source Ledger changes.
- Verification Debt closed or still open.
- Evidence Provenance Grade Ledger.
- Goal Tracker Update Request.
