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

Failure-oracle continuation workflow:

1. Before source edits or long probes, update the summary at {{summaryPath}} with a new Summary Heartbeat for this round.
Include the bounded objective, changed surfaces, initial oracle rows, known debt, and staged checkpoints if the target is broad.

2. Compare feedback, continuation package, prior summary, tracker, contract, plan, todo, and patch before editing. Classify each reviewer item as:
- accepted_required,
- accepted_oracle_debt,
- accepted_verification_debt,
- rejected_out_of_scope,
- stale_or_already_proven,
- needs_clarifying_evidence.

3. Rebuild the Impact Oracle Matrix from the original requirement, imported plan, anchors, public API names, feedback, and current patch.
- A required surface skipped in a previous round is unresolved unless reviewer evidence invalidated it.
- Do not use not touched as proof of non-applicability for fallback, accelerator, metadata, import/install, cache/runtime, grammar, AST, unparse, fixture, or parser surfaces named by source artifacts.

4. Close the strongest remaining required oracle gap first.
- For zoneinfo work, prefer oracle evidence for weird TZif, TZ string behavior, fold/gap/fromutc, cache/weakref/GC, pickle/path, and Python/C parity gaps.
- For grammar/compiler/AST work, prefer committed automated regressions for parser, AST, runtime, future annotations, get_type_hints, unparse roundtrip, and negative syntax gaps.
- For TOML/parser/file-format work, prefer upstream_oracle or committed_equivalent_fixture evidence for valid and invalid fixtures, exact errors, exception construction, parse_float failures, and public API behavior.

5. Keep required deferrals incomplete until evidence closes them. Optional or out-of-scope work should be moved to rejected or non-blocking, not deferred.

6. Re-check summary honesty before stopping. If code changed or meaningful verification ran after drafting the summary heartbeat, update the summary so it exactly matches the final patch and final evidence.

Your summary must include:
- Summary Heartbeat status.
- Feedback Classification.
- Round Budget outcome.
- Impact Oracle Matrix update.
- Requirement Source Ledger changes.
- Verification Debt closed or still open.
- Evidence Provenance Grade Ledger.
- Surface Equivalence Matrix update.
- Goal Tracker Update Request.
