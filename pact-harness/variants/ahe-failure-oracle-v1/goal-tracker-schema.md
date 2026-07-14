# Goal Tracker Schema: AHE Failure Oracle V1

The tracker is the durable completion contract. It must turn observed hidden failures into explicit oracle obligations before implementation and review.

## Summary Heartbeat

Each worker round must record a summary heartbeat before broad implementation, long-running probes, or large edits.

Fields:
- Round and timestamp or clear sequence marker.
- Bounded round objective.
- Current patch intent.
- Expected changed surfaces.
- Initial Impact Oracle Matrix rows.
- Known blockers and verification debt.

Rules:
- Missing heartbeat is a process blocker.
- A stale heartbeat is a blocker when material implementation or verification happened after the last summary update.
- Timeout without a summary is incomplete even if a patch exists.

## Round Budget

Each round must choose a bounded vertical slice.

Fields:
- Objective: one coherent behavior slice.
- In scope this round.
- Explicitly postponed required work.
- Staged checkpoint plan if the slice is broad.
- Stop condition.

Rules:
- Broad subsystem rewrites need staged checkpoints and a heartbeat before broad work starts.
- Required postponed work remains open verification debt and blocks completion.

## Requirement Source Ledger

Every acceptance criterion and behavior obligation must include:
- ID.
- Requirement.
- Source class: original_required, derived_required, optional_check, out_of_scope.
- Source evidence pointer.
- Risk class: low, medium, high.
- Status: pending, in_progress, partial, satisfied, deferred_required, invalidated_out_of_scope, blocked.

Rules:
- original_required and derived_required cannot be dropped, narrowed, or marked optional without reviewer approval.
- optional_check and out_of_scope must not block completion.
- Over-broad derived criteria should become invalidated_out_of_scope, not silently implemented or marked satisfied.

## Impact Oracle Matrix

For each changed or required surface, record:
- Surface.
- Why it is in scope.
- Failure family it could hide.
- Required oracle family.
- Evidence provenance grade.
- Evidence artifact.
- Status: missing, partial, satisfied, non_applicable_with_evidence.

Completion requires every required high-risk oracle row to be satisfied or non_applicable_with_evidence.

## Evidence Provenance Grades

Allowed grades:
- upstream_oracle: upstream fixture, reference test, standard conformance corpus, or in-tree equivalent copied from authoritative context. Enough for completion when relevant behavior is covered.
- committed_equivalent_fixture: committed local fixture with explicit equivalence rationale to upstream or standard behavior. Enough only with the rationale.
- synthetic_local_test: useful regression but partial for high-risk parser, grammar, compiler, timezone, serialization, and stdlib integration surfaces.
- manual_probe: partial only.
- source_inspection: risk note only.
- public_verification: supports completion only for behavior it actually exercises.
- build_or_runtime_gate: supports integration surfaces it actually exercises.
- hidden_unavailable: cannot satisfy a required oracle row.

Rules:
- High-risk ACs cannot be satisfied by manual_probe or source_inspection alone.
- Synthetic local tests alone are partial for high-risk surfaces unless reviewer records why upstream or equivalent oracle is unavailable and unnecessary.
- Parser, format, grammar, compiler, AST, timezone, serialization, and stdlib integration work is high-risk by default.

## Case-Learned Oracle Defaults

Use these defaults as required audits whenever the surface is relevant.

Zoneinfo/timezone work:
- transition offsets and tznames.
- folds, gaps, fromutc, and fold mutation.
- variable-offset time behavior.
- weird or minimal TZif files.
- TZ string localized, from_utc, and invalid behavior.
- ZoneInfo.from_file pickle behavior.
- bad keys, traversal, and path handling.
- cache, weakref, extension-built cache location, and GC expectations.
- duplicate Python/C-backed behavior surfaces.

Grammar/compiler/AST/unparse work:
- grammar parser acceptance.
- AST shape and validation.
- compiler and runtime behavior.
- from __future__ import annotations.
- typing.get_type_hints and ForwardRef behavior.
- unparse, especially cosmetic and slice roundtrip behavior.
- negative syntax cases.

TOML/parser/file-format import work:
- upstream-compatible valid fixtures.
- upstream-compatible invalid fixtures.
- exact error message, line, column, and invalid-character formatting expectations.
- public exception constructor and module behavior.
- parse_float invalid return behavior.
- recursion, deepcopy, and public API behavior when relevant.

## Verification Debt Ledger

Record unresolved evidence gaps:
- Debt ID.
- Linked AC or oracle row.
- Missing evidence.
- Why it matters.
- Status: open, non_blocking_optional, closed, invalidated_out_of_scope.

Rules:
- Open debt linked to required high-risk work blocks PACT_COMPLETE.
- Debt may be non-blocking only when optional or out of scope with evidence.

## Surface Equivalence Matrix

Use when multiple implementation surfaces, fallbacks, or integration points exist:
- Surface A and Surface B.
- Behavior that must match.
- Evidence and provenance grade.
- Status: unverified, equivalent, divergent, not_applicable_with_evidence.

## Completion Gate

PACT_COMPLETE is valid only when:
- Summary heartbeat exists and is current.
- Round budget did not hide required broad work.
- All original_required and derived_required ACs are satisfied or reviewer-approved invalidated_out_of_scope.
- Required deferred work is empty.
- Open high-risk verification debt is empty.
- Impact Oracle Matrix required rows are satisfied or non_applicable_with_evidence.
- Multi-surface equivalence is proven or non-applicable with evidence.
- Public verification does not block final hidden scoring.
- The final summary names remaining optional risks without using them as evidence of completion.
