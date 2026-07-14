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

Reference-port parity continuation workflow:

1. Before source edits or long probes, update the summary at {{summaryPath}} with a new Summary Heartbeat for this round.
Include the bounded objective, parser surfaces, Reference-Port Strategy, parity rows, known debt, and staged checkpoints if the target is broad.

2. Compare feedback, continuation package, prior summary, tracker, contract, plan, todo, patch, and spec evidence before editing. Classify each reviewer item as:
- accepted_required,
- accepted_reference_parity_debt,
- accepted_verification_debt,
- rejected_out_of_scope,
- stale_or_already_proven,
- needs_clarifying_evidence.

3. Rebuild the Reference Parity Ledger from the original requirement, imported plan, anchors, public API names, feedback, and current patch.
A required parser row skipped in a previous round is unresolved unless reviewer evidence invalidated it.

4. Close the strongest remaining reference parity gap first.
Use this priority for TOML/parser work:
- upstream-compatible valid fixture acceptance,
- upstream-compatible invalid fixture rejection,
- exact error messages and line/column or end-of-document locations,
- invalid `parse_float` return ValueError behavior,
- invalid date/time/datetime wrapping into `TOMLDecodeError`,
- `TOMLDecodeError` constructor and module behavior,
- public API, recursion, deepcopy, import, and install behavior when relevant.

5. Use evidence that can survive review.
Committed fixtures, direct unittest probes, and documented reference comparisons can close parity rows. Local smoke tests, manual probes, and source inspection are partial unless they explicitly compare against the reference behavior.

6. Keep required deferrals incomplete until evidence closes them. Optional or out-of-scope work should be moved to rejected or non-blocking, not deferred.

7. Re-check summary honesty before stopping. If code changed or meaningful verification ran after drafting the summary heartbeat, update the summary so it exactly matches the final patch and final evidence.

Your summary must include:
- Summary Heartbeat status.
- Feedback Classification.
- Round Budget outcome.
- Reference-Port Strategy update.
- Reference Parity Ledger update.
- Impact Oracle Matrix update.
- Requirement Source Ledger changes.
- Verification Debt closed or still open.
- Evidence Provenance Grade Ledger.
- Surface Equivalence Matrix update.
- Goal Tracker Update Request.
