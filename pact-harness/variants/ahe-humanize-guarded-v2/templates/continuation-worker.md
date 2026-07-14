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

Guarded continuation workflow:

1. Compare feedback, continuation package, summary, tracker, and patch before
   editing. Classify each reviewer item as:
   - accepted_required,
   - accepted_verification_debt,
   - rejected_out_of_scope,
   - stale_or_already_proven,
   - needs_clarifying_evidence.

   Also rebuild the Implementation Surface Inventory from the original
   requirement, imported plan, implementation anchors, public API names, and
   current patch. If a required surface was skipped in the previous round, treat
   it as unresolved work unless reviewer evidence explicitly invalidated it.

2. Do not chase over-broad derived ACs. If feedback identifies a tracker AC
   that is broader than the original task, preserve the implementation and ask
   the reviewer to mark it `invalidated_out_of_scope`.

3. Close the strongest remaining required evidence gap first.
   - For parser/format work, prefer fixture/compliance coverage over more
     smoke probes.
   - For grammar/compiler/AST work, prefer committed automated regressions.
   - For multi-surface work, prefer an equivalence test or direct proof.
   - Do not use "not touched" as proof of non-applicability for fallback,
     accelerator, metadata, import/install, cache/runtime, grammar, AST, or
     fixture surfaces named by the source artifacts.
   - For stdlib integration work, prove import/build/install/metadata behavior
     on the changed surfaces instead of relying on source inspection alone.

4. Keep required deferrals incomplete until evidence closes them. Optional or
   out-of-scope work should be moved to rejected/non-blocking, not deferred.

5. Re-check summary honesty before stopping. If you changed code or ran new
   verification after drafting the summary, update the summary so it exactly
   matches the final patch and final evidence. Then stop.

Your summary must include:
- Feedback Classification.
- Implementation Surface Inventory update.
- Requirement Source Ledger changes.
- Verification Debt closed or still open.
- Surface Equivalence Matrix update.
- Evidence Ledger Update.
- Goal Tracker Update Request.
