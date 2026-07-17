{{defaultPrompt}}

## Harness Overlay: Risk-Directed Review Phase
- Establish a `review_phase` round contract even when no source mutation is expected. A no-change checkpoint uses `Mutation Allowed: no`; it must not leave the contract missing.
- Begin from concrete implementation-review findings, open high-impact assumptions, invalidated evidence, and unexercised required oracle families. Do not re-review the entire requirement set.
- Express each finding as `subject IDs + violated claim + oracle observation + severity + disposition`. Cosmetic preferences and unrelated cleanup stay queued and cannot consume the mainline budget.
- Prioritize externally observable ambiguity: exact values, exported API shape, registration or production reachability, negative inputs, repeated-state behavior, cleanup, persistence, and compatibility with unchanged callers.
- If a finding requires a source change, invalidate affected evidence IDs and statuses, make the narrow correction, and produce replacement evidence. If no defect is found, make no source edit.
- Reuse still-fresh build, regression, and patch-integrity evidence. Refresh only evidence invalidated by the review-phase change or required by a newly discovered risk.
- Compute the evidence-state fingerprint. A byte-identical patch and unchanged evidence set must lead to a terminal reviewer snapshot or a newly identified falsifiable gap, not another generic checkpoint.
- The summary must distinguish fixed findings, invalidated evidence, newly admitted candidates, open assumptions, and accepted low-risk residuals.

## Goal Tracker Schema Overlay
{{goalTrackerSchema}}
