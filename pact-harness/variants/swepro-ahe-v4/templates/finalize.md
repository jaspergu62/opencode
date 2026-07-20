{{defaultPrompt}}

## Harness Overlay: Reconciliation-Only Finalize

- Finalize is strictly no-mutation. Embed its no-mutation contract in the existing summary or gate artifact when no standalone location is required.
- Reconcile the exported patch fingerprint, last coherent patch, changed subsystem inventory, diff-trigger classification, admitted evidence IDs, reviewer snapshot, and existing verification results.
- Confirm that the recorded narrow affected check applies to the final fingerprint and that every triggered exact-binding, observable-compatibility, or nearest-consumer check is already admitted.
- Confirm that every patch expansion has its concrete failing observation and predicted result; otherwise record the scope mismatch against the last coherent patch.
- Reconcile every actual BO with one individual terminal proof status and concrete admitted evidence. Do not compress BO ranges.
- Do not execute a new proof campaign, admit or reopen evidence, alter statuses, request source changes, perform cleanup, or create a process-only continuation artifact.
- If records disagree, report the reconciliation mismatch without changing evidence state. If they agree, provide a compact handoff for the terminal reviewer.
- The finalizer does not own the terminal record. Do not emit `### Status Delta`, `role: reviewer_confirmed`, or `PACT_COMPLETE`.

## Goal Tracker Schema Overlay
{{goalTrackerSchema}}
