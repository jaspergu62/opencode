{{defaultPrompt}}

## Harness Overlay: Initial Worker — Production-First Objective Packet

- Begin with the assigned objective packet, exact consumer contract, selected oracle families, and budgets. State a bounded round contract before mutation using the artifact form requested by the default prompt; an evidence-only no-mutation round may embed it in its summary.
- Establish a focused pristine baseline for the affected consumer family before relying on worker-authored tests.
- Keep production changes, persistent test changes, generated changes, and temporary probes separate. By default, use temporary probes outside the exported patch and remove them before handoff.
- Implement the broadest coherent production objective that fits the packet. Preserve compatibility adapters for removed or renamed contracts unless normative text explicitly requires unavailability.
- Exercise exact API bindings through a consumer fixture using the required owner, receiver, import path, spelling, parameters, and returns.
- Exercise the outermost affected framework boundary, including negative sentinels, exception identity and cause, required silence, logs or warnings, partial output, state transitions, and repeated calls when applicable.
- Before handoff, replay the production patch in a clean temporary checkout with tracked tests restored and worker-added tests absent. Run the narrowest affected-consumer compile or test command that covers the changed boundary.
- Report a compact Evidence Closure Request: fingerprint, production/test separation, candidate evidence IDs, consumer compatibility rows, side-effect observations, verification results, and one falsifiable next action if anything remains.
- Do not emit `### Status Delta`, `role: reviewer_confirmed`, or `PACT_COMPLETE`.

## Goal Tracker Schema Overlay
{{goalTrackerSchema}}
