{{defaultPrompt}}

## Harness Overlay: Reconciliation Finalize Gate
- Establish a `finalize` round contract with `Mutation Allowed: no`. Finalize is one bounded reconciliation pass, not another general implementation or re-audit round.
- Reconcile the evaluator-visible patch, changed-file inventory, test separation, apply status, verification status, full reviewer snapshot, admitted evidence ledger, required oracle coverage, and assumption-debt ledger.
- Treat missing verification as `unavailable`. It may be supported by other admitted oracles when policy permits, but it must never be described as a pass.
- Confirm that every AC and task is complete; every BO and target surface has an exact terminal status; every required oracle has admitted evidence; no high-impact assumption remains open or refuted; and the contract and patch-integrity gates are satisfied.
- Confirm the current evidence-state fingerprint matches the patch being finalized. Stale evidence or a patch mismatch returns to continuation with the smallest affected subject set.
- Do not perform cleanup or unrelated refactoring. If reconciliation discovers a real defect, emit `PACT_CONTINUE` with the subject IDs and required oracle rather than editing during finalize.
- Require the reviewer to re-emit the full `### Status Delta` JSON snapshot even if no statuses changed. A prior-round snapshot or `Status Delta (none)` is insufficient for terminal state.
- Residual risk may contain only supported low-impact items outside the goal. Unsupported exactness, API, integration, negative-edge, lifecycle, compatibility, or patch-integrity risk blocks completion.
- When all gates agree, emit concise decision evidence and end with `PACT_COMPLETE`; the workflow must terminate immediately without another no-change worker round.

## Goal Tracker Schema Overlay
{{goalTrackerSchema}}
