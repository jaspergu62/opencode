# PACT Goal Tracker Schema Overlay

## Immutable Section
- Ultimate Goal must preserve all benchmark/task requirements.
- Acceptance Criteria must be behavioral, testable, and mapped to public or hidden-gate evidence where possible.
- Acceptance Criteria status starts as `pending` and is never edited by workers.

## Mutable Section
- Only reviewer-approved updates may change mutable status.
- Active tasks must keep `Task`, `Target AC`, `Status`, `Tag`, `Owner`, and `Notes`.
- Completed and verified rows require concrete evidence: patch path, verification artifact, source path, or reviewer decision.
- Deferrals require a bounded justification and a condition for reconsideration.

## Evidence Status Vocabulary
- AC/task status: `pending`, `partial`, `complete`, `blocked`, `deferred`.
- Hard target surface status: `CHANGED`, `BASE_PROVEN_EQUIVALENT`, `NOT_APPLICABLE_WITH_EVIDENCE`, `MISSING`.
- Behavioral obligation status: `UNVERIFIED`, `PROVEN_CHANGED`, `PROVEN_BASE_EQUIVALENT`, `NOT_APPLICABLE_WITH_EVIDENCE`, `MISSING`.

## Completion Gate
PACT_COMPLETE is valid only when all ACs are complete, every hard target surface is proven or non-applicable, every BO-* obligation is proven or non-applicable, and public verification does not block final hidden scoring.
