{{defaultPrompt}}

Round: {{round}} {{roundName}}
Loop directory: {{loopDir}}

Objective:
{{objective}}

Current state snapshot:
{{currentStateSnapshot}}

Spec evidence references:
{{specEvidenceReferences}}

Pre-snapshot path: {{preSnapshotPath}}
Todo path: {{todoPath}}
Goal tracker path: {{goalTrackerPath}}
Summary path: {{summaryPath}}
Contract path: {{contractPath}}

Goal tracker schema:
{{goalTrackerSchema}}

Work from the PACT-owned todo and goal tracker. Do not edit PACT-owned files directly unless the workflow explicitly requires it. Implement the smallest patch that tests the strongest current root-cause hypothesis.

Before editing, read the relevant spec evidence and current code. Treat every fix as a hypothesis with observable evidence. In your summary, include a short Evidence Ledger Update with:
- Evidence observed.
- Root-cause hypothesis supported or weakened.
- Patch attribution: which change is expected to move which acceptance criterion.
- Predicted next-round impact.
- Risks left open.

Do not claim success without verification evidence. If verification is unavailable, state the missing command or artifact and the reason it could not be produced.
