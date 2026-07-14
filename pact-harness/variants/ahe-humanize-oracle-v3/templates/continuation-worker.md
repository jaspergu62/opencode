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
   Rebuild the Impact Oracle Matrix from the current patch, not just from the
   previous summary. A changed surface with no oracle row remains unresolved.

2. Do not chase over-broad derived ACs. If feedback identifies a tracker AC
   that is broader than the original task, preserve the implementation and ask
   the reviewer to mark it `invalidated_out_of_scope`.

3. Close the strongest remaining required evidence gap first.
   - If the previous round failed from missing summary, timeout, upstream
     timeout, or a non-importable stub, first restore an honest summary heartbeat
     and make the patch importable or explicitly incomplete.
   - For parser/format work, prefer fixture/compliance coverage over more
     smoke probes. If no fixture corpus is present, synthesize a focused corpus
     before claiming completion.
   - For grammar/compiler/AST work, prefer committed automated regressions.
     Include future-annotations and unparse/cosmetic roundtrip or equivalent
     oracles when the changed files imply those surfaces.
   - For multi-surface work, prefer an equivalence test or direct proof.
   - Do not use "not touched" as proof of non-applicability for fallback,
     accelerator, metadata, import/install, cache/runtime, grammar, AST, or
     fixture surfaces named by the source artifacts.
   - For stdlib integration work, prove import/build/install/metadata behavior
     on the changed surfaces instead of relying on source inspection alone.
   - For zoneinfo/timezone work, do not stop at one or two happy-path zones.
     Cover the relevant ordinary-zone, weird/minimal TZif, TZ-string,
     fold/gap/fromutc, cache, pickle, path traversal, and fallback-data oracle
     families before completion.

4. Keep required deferrals incomplete until evidence closes them. Optional or
   out-of-scope work should be moved to rejected/non-blocking, not deferred.

5. Use a Humanize-style stop budget. Once the strongest blocker is closed and
   the matching oracle is green, refresh the summary and stop. Do not start a
   new broad suite, rewrite, or optional audit if it risks leaving the summary
   stale or missing.

Your summary must include:
- Feedback Classification.
- Implementation Surface Inventory update.
- Impact Oracle Matrix update.
- Requirement Source Ledger changes.
- Verification Debt closed or still open.
- Round Budget / Summary Heartbeat status.
- Surface Equivalence Matrix update.
- Evidence Ledger Update.
- Goal Tracker Update Request.
