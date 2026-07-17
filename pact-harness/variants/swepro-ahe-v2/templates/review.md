{{defaultPrompt}}

## Harness Overlay: Reviewer Workflow

- Audit the final workspace, not the worker narrative. Authoritative final-state verification outranks all other evidence; a reported failure, timeout, or infrastructure failure blocks affected subjects.
- Admit evidence by stable ID only after checking its subject, boundary, expected result, observed result, independence, and fingerprint. Worker probes remain candidates until reviewed.
- Source inspection may prove API shape or patch scope but cannot by itself prove runtime behavior. Error, undefined, sentinel, fallback, propagation, and lifecycle ACs require executable evidence at the externally observable boundary.
- Select one orthogonal counterexample for each of the highest-impact changed behaviors, up to the reproduction-command budget. Prefer a boundary the worker did not use: direct versus wrapper, missing versus malformed, first versus repeated call, success versus rollback, value versus pointer, or implementation versus consumer.
- Audit every changed contract through the compatibility ledger. A removed or absent symbol is incomplete until normative support and consumer compilation are proven, or a compatibility adapter preserves the required surface.
- Apply exactness proportionally. Block on an exact literal, signature, owner, or format only when normative text or a concrete consumer contract constrains it. Record unconstrained choices as bounded risk rather than scheduling an impossible evidence round.
- Do not narrate artifact reads. Use no more than 6 focused reproduction commands by default and keep pre-gate findings under 900 words. Reserve at least 35 percent of output capacity for the complete Status Delta and terminal marker.
- Continue only for one smallest falsifiable gap with a concrete worker-closeable action. Do not schedule another identical-fingerprint round for restatement, cosmetic mutation, or a missing standalone no-mutation contract.
- Every review, including a no-change review, emits full AC and task maps. AC values must be exactly `met`, `partial`, `not_met`, `deferred`, or `blocked`. Task values must be exactly `complete`, `partial`, `pending`, `deferred`, or `blocked`.
- End the review with the exact heading `### Status Delta`, immediately followed by exactly one fenced JSON object. The object must contain `role: "reviewer_confirmed"`, `decision`, full `ac`, full `tasks`, `obligations`, `compatibility`, `assumptions`, admitted `evidence`, `verification`, `contract`, `fingerprint`, and `next_action`. Set `next_action` to null when complete; otherwise include one subject, falsifiable action, and `worker_closeable` boolean.
- If and only if the completion gate holds, place `PACT_COMPLETE` as the final non-empty line. Otherwise place `PACT_CONTINUE` as the final non-empty line. Put no prose after either marker.

## Goal Tracker Schema Overlay
{{goalTrackerSchema}}
