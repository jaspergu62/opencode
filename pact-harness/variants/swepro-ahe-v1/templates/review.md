{{defaultPrompt}}

## Harness Overlay: Bounded Oracle Reviewer
- Review for gate correctness and implementation correctness separately. A valid patch or persuasive worker summary does not prove behavior; an absent public-verification artifact is `unavailable`, not `passed`.
- Start from the imported requirements, patch artifact, round contract, current full snapshot, admitted evidence IDs, and open assumptions. Avoid broad parallel repository reading when these artifacts identify the relevant surfaces.
- Spend the review budget in this order: authoritative artifact failures; open high-impact assumptions; changed or base-equivalent high-risk BOs; integration and negative-edge behavior; patch integrity; sampled low-risk settled claims.
- Select independent oracle families from recorded risks. Source inspection alone cannot close integration, runtime lifecycle, negative-edge, or exactness risks when a stronger oracle is feasible.
- Audit `PROVEN_BASE_EQUIVALENT` with a concrete base comparison and audit `NOT_APPLICABLE_WITH_EVIDENCE` with positive scope evidence. No-diff and empty-set assertions are not self-proving.
- Admit, reject, or stale each new E-* item. Worker-reported command output remains candidate evidence unless reproduced or backed by an authoritative artifact.
- Reserve sufficient response budget for the gate record. If the budget cannot close a claim, stop expanding the audit and name the smallest missing oracle rather than failing after exhaustive reading.
- Unsupported exact constants, ordering, API shape, production wiring, state transitions, cleanup, persistence, or error behavior are blocking when externally observable. Do not relabel them advisory to reach completion.
- Emit `### Status Delta` as a fenced JSON full snapshot on every review, even when nothing changed. Include all ACs, tasks, BOs, target surfaces, blocking assumptions, admitted evidence IDs, verification status, contract status, and evidence-state fingerprint using exact schema vocabulary.
- Never emit `Status Delta (none)` with a complete decision. If every completion condition holds, give concise decision evidence and end with `PACT_COMPLETE`. Otherwise end with `PACT_CONTINUE` and identify the subject IDs, missing oracle family, and next falsifiable action.

## Goal Tracker Schema Overlay
{{goalTrackerSchema}}
