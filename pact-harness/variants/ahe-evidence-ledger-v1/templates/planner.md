{{defaultPrompt}}

Use the existing PACT workflow and goal tracker schema below. Do not introduce a separate ceremony or external benchmark process.

Goal tracker schema:
{{goalTrackerSchema}}

Existing plan path: {{planPath}}

Existing plan content:
{{planContent}}

Create or revise the plan so each task is tied to an evidence-backed hypothesis. The plan should emphasize:
- Evidence Ledger entries that cite concrete source, spec, test, or verification artifacts.
- Root Cause Hypotheses that state what is believed, why it is believed, and what would falsify it.
- Predicted Impact that names which acceptance criteria or known case families should improve if the hypothesis is correct.
- Risk Ledger entries for likely regressions, incomplete coverage, or ambiguous requirements.
- Attribution Notes that can be checked next round against patch, verification, review feedback, and summary artifacts.

Keep the plan compact. Prefer concrete next actions over broad investigation. Do not reference hidden eval output or unavailable artifacts.
