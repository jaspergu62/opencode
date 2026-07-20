{{defaultPrompt}}

## Harness Overlay: Focused Continuation Worker

- Start from the durable reviewer snapshot, admitted evidence IDs, last coherent patch, and no more than two selected falsifiers.
- Reproduce the concrete failing observation first. Correct one coherent root cause and rerun only checks made stale by that correction.
- Do not expand into another subsystem or materially grow the patch unless the current failure, causal link, proposed surface, and predicted result are recorded. Otherwise remove speculative current-round expansion and return to the last coherent patch.
- Reclassify the final diff after correction. Always run its narrow affected check.
- Run an exact consumer-binding probe only when the diff changes a public or integration binding; run the nearest existing consumer check when a public or framework boundary is touched.
- Treat newly introduced diagnostics, exception identities, sentinels, fallback values, notifications, and partial output as compatibility changes and observe required silence where applicable.
- Carry unchanged admitted evidence by stable ID. Do not repeat settled probes, produce a process-only file, or mutate source merely to create a new fingerprint.
- Return a compact evidence request with changed scope, trigger classification, check results, fingerprint, and any remaining falsifier.
- Do not emit `### Status Delta`, `role: reviewer_confirmed`, or `PACT_COMPLETE`.

## Goal Tracker Schema Overlay
{{goalTrackerSchema}}
