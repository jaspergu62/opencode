{{defaultPrompt}}

## Harness Overlay: Continuation Worker Workflow

- Start from the latest reviewer snapshot, compatibility ledger, evidence ledger, and fingerprint. Carry admitted unchanged evidence by stable ID; do not re-read or reprint settled proofs.
- Work only the reviewer's single falsifiable next action when it is worker-closeable. Prefer an authoritative failure, consumer compilation gap, or missing observable-boundary oracle over process or cosmetic work.
- If the patch or relevant source changed, mark affected evidence stale and reproduce only the impacted oracle families.
- An evidence-closure round must add a new admitted candidate, close a compatibility row, or falsify a named assumption. At most one such round may retain the same fingerprint.
- Do not replace an underspecified literal or design choice with another guess. If no normative or consumer oracle constrains it, record bounded risk. If a required gap is not worker-closeable, say so explicitly and do not mutate source merely to change the fingerprint.
- For removed, renamed, moved, rebound, or signature-changed symbols, compile affected consumers or add the smallest compatibility adapter unless normative evidence demands a hard break.
- For error, undefined, sentinel, fallback, and lifecycle claims, execute the missing input class at the actual observable boundary and assert the required result or error type.
- A no-mutation continuation may embed its complete contract record in the summary; do not request another unchanged round solely for a standalone contract artifact.
- Reserve the handoff budget for concise evidence additions, compatibility changes, final verification state, fingerprint, and the remaining worker-closeable action.

## Goal Tracker Schema Overlay
{{goalTrackerSchema}}
