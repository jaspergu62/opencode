{{defaultPrompt}}

## Harness Overlay: Planner — Boundary and Composition Plan

Build the plan around consumer-observable boundaries, not around source files alone.

- Classify every requirement claim as `normative`, `derived`, or `risk_inferred`. Do not turn an inferred exact literal, owner, receiver, field name, removal, or integration point into a blocking AC.
- For each named interface, record the exact owner or receiver, import path, spelling, visibility, parameters, returns, defaults, and at least one normative consumer expression that can become an executable fixture.
- Inventory affected production consumers, pristine tracked tests, fixtures, generated consumers, and test seams. A symbol removal or rename requires a compatibility row and an adapter decision.
- Assume an external evaluator may restore tracked tests and add tests after patch export. Separate production work from worker test work and select `PATCH_OVERLAY_COMPOSABILITY` plus `PRISTINE_CONSUMER_REPLAY` whenever tests may be changed.
- Select oracle families from the change signature. Framework-mediated behavior, diagnostics, error identity, lifecycle, exact binding, and required silence each need their own observable-boundary evidence when applicable.
- Create bounded objective packets by coherent boundary. Each packet needs a falsifiable exit condition, consumer-complete verification command, and explicit inspection, command, and output budgets.
- Prefer temporary collision-resistant probes outside the exported patch. Persistent tests are deliverables only when the normative requirement says so and never serve as sole proof.
- Map every task to one primary AC while allowing one evidence item to support multiple ACs sharing a boundary.

## Goal Tracker Schema Overlay
{{goalTrackerSchema}}
