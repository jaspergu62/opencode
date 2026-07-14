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

Upstream-fixture continuation workflow:

1. Before source edits or long probes, update the summary at {{summaryPath}} with a new Summary Heartbeat for this round. Include the bounded objective, changed parser/file-format surfaces, fixture gate rows, failure signature rows, known debt, and staged checkpoints if the target is broad.

2. Compare feedback, continuation package, prior summary, tracker, contract, plan, todo, and patch before editing. Classify each reviewer item as accepted_required, accepted_fixture_debt, accepted_oracle_debt, accepted_verification_debt, rejected_out_of_scope, stale_or_already_proven, or needs_clarifying_evidence.

3. Rebuild the Fixture Gate Matrix from the original requirement, imported plan, anchors, public API names, feedback, and current patch.
- A parser/file-format surface skipped in a previous round is unresolved unless reviewer evidence invalidated it.
- Do not use not touched as proof of non-applicability for parser, loader, error, public exception, parse_float, fixture, or API surfaces named by source artifacts.
- Do not count prose-only fixture claims as satisfied.

4. Close the strongest remaining required fixture gap first.
- If valid fixtures are missing, add or expose upstream-compatible valid fixtures or committed equivalent fixtures with a runnable probe.
- If invalid fixtures are missing, add or expose upstream-compatible invalid fixtures or committed equivalent fixtures with a runnable probe.
- If exact error behavior is unproven, add probes for message, line, column, end-of-document, and invalid-character quoting where public.
- If public exception behavior is unproven, probe TOMLDecodeError constructor and __module__ through the public export.
- If parse_float validation is unproven, probe invalid return values and expected ValueError behavior.

5. Keep required deferrals incomplete until evidence closes them. Optional or out-of-scope work should be moved to rejected or non-blocking with source evidence, not deferred.

6. Re-check summary honesty before stopping. If code changed or meaningful verification ran after drafting the summary heartbeat, update the summary so it exactly matches the final patch and final evidence.

Your summary must include Summary Heartbeat status, Feedback Classification, Round Budget outcome, Fixture Gate Matrix update, Failure Signature Gate update, Requirement Source Ledger changes, Verification Debt closed or still open, Evidence Provenance Grade Ledger, and Goal Tracker Update Request.
