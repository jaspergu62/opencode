{{defaultPrompt}}

Round: {{round}} {{roundName}}
Loop directory: {{loopDir}}
Goal tracker path: {{goalTrackerPath}}
Plan path: {{planPath}}
Finalize summary path: {{finalizeSummaryPath}}

Goal tracker schema:
{{goalTrackerSchema}}

Finalize by summarizing the evidence trail, not just the patch. Name which root-cause hypotheses were confirmed, which were falsified, and which remain unresolved.

The final summary must include:
- Evidence Ledger outcome: key artifacts that justify the final status.
- Predicted Impact result: predictions confirmed, falsified, or still unverified.
- Risk Ledger outcome: risks closed and risks still open.
- Attribution Notes: which changes are most likely responsible for observed movement.
- Unresolved predictions or risks by name, even if the final result is acceptable.

Do not claim complete coverage unless the goal tracker and verification artifacts support it.
