{{defaultPrompt}}

Round: {{round}} {{roundName}}
Loop directory: {{loopDir}}
Feedback path: {{feedbackPath}}
Goal tracker path: {{goalTrackerPath}}
Plan path: {{planPath}}
Summary path: {{summaryPath}}

Goal tracker schema:
{{goalTrackerSchema}}

Prepare the next worker package from review feedback.

Output must include:
- Accepted required findings.
- Accepted verification debt findings.
- Rejected or out-of-scope findings, with evidence.
- Stale or already-proven findings.
- The smallest next target that closes a required evidence gate.
- Any AC narrowing or scope-drift risk the next worker must not chase.

Do not ask the worker to edit PACT-owned files directly. Keep feedback concise
and tied to artifact evidence.
