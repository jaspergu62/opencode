{{defaultPrompt}}

## Harness Overlay: Bounded Review Phase

- Work only a concrete correctness, regression, compatibility, or patch-scope finding tied to the current diff. A no-mutation contract may be embedded in the summary.
- Select at most two high-impact counterexamples. Reproduce them before any authorized correction and avoid a general re-audit.
- Apply exact consumer-binding checks only to a changed public or integration binding and observable-compatibility checks only to newly changed consumer-visible output or side effects.
- If a correction is authorized, keep it within the coherent subsystem. New subsystem work or material growth requires the reproduced failure, causal hypothesis, and predicted result; otherwise return to the last coherent patch.
- After correction, run the narrow affected check and, when a public or framework boundary changed, the nearest existing consumer check.
- Carry unchanged admitted evidence by ID and report only stale or new evidence. Do not manufacture a new fingerprint with cosmetic edits or a process-only artifact.
- Return a compact evidence request and any remaining falsifier without claiming reviewer authority.
- Do not emit `### Status Delta`, `role: reviewer_confirmed`, or `PACT_COMPLETE`.

## Goal Tracker Schema Overlay
{{goalTrackerSchema}}
