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

Goal tracker schema:
{{goalTrackerSchema}}

Failure-oracle worker workflow:

1. Before source edits or long probes, create or update the summary at {{summaryPath}} with a Summary Heartbeat.
Include:
- bounded round objective,
- expected changed surfaces,
- initial Impact Oracle Matrix,
- known verification debt,
- staged checkpoint plan if work is broad.

2. Read the todo, goal tracker, contract, and relevant source/spec evidence. Do not edit PACT-owned artifacts as solution changes.

3. Rebuild the Requirement Source Ledger.
- Identify original_required, derived_required, optional_check, and out_of_scope items.
- Do not narrow required ACs to fit the patch.
- If an AC appears broader than the original task, record the source-classification issue for review.

4. Choose a bounded vertical slice for this round.
- Large subsystem implementation is not a valid one-round objective unless it has staged checkpoints.
- Required work outside the slice must stay open as verification debt and cannot be counted complete.

5. Build the Impact Oracle Matrix before implementation.
For every required or changed surface, list the surface, hidden failure family, required oracle family, provenance grade, evidence artifact, and status.
Use case-learned defaults:
- Zoneinfo: transition offsets and tznames; folds and gaps; fromutc; fold mutation; variable-offset time; weird or minimal TZif; TZ string localized/from_utc/invalid behavior; ZoneInfo.from_file pickle behavior; bad keys and traversal; cache, weakref, extension-built cache location, and GC expectations; Python/C-backed parity.
- Grammar/compiler/AST/unparse: parser acceptance; AST shape and validation; compiler/runtime behavior; from __future__ import annotations; typing.get_type_hints and ForwardRef behavior; unparse cosmetic and slice roundtrips; negative syntax.
- TOML/parser/file-format: upstream-compatible valid and invalid fixtures; exact line, column, invalid-character, and missing-value errors; public exception constructor and module behavior; parse_float invalid return behavior; recursion, deepcopy, and public API behavior when relevant.

6. Implement the smallest coherent patch that can satisfy behavior and oracle evidence.
Prefer upstream_oracle or committed_equivalent_fixture for high-risk work. Treat synthetic_local_test, manual_probe, and source_inspection as partial unless reviewer-approved non-applicability applies.

Your final summary update must include:
- Summary Heartbeat status.
- Round Budget outcome.
- Requirement Source Ledger.
- Impact Oracle Matrix.
- Evidence Provenance Grade Ledger.
- Implementation Surface Inventory.
- Verification Debt Ledger.
- Surface Equivalence Matrix, or not_applicable with evidence.
- Deferred and Rejected Work.
- Goal Tracker Update Request.

Completion claims are invalid if the summary heartbeat is missing or stale, high-risk required work lacks required oracle families, or required verification debt remains open.
After writing the final summary update, stop work and return control to PACT.
