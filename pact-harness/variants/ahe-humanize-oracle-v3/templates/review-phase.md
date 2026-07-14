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
- Impact Oracle Matrix rows that are missing, uncovered, or invalidated.
- Summary heartbeat/process defects that the next worker must repair first.
- The smallest next target that closes a required evidence gate.
- Any AC narrowing or scope-drift risk the next worker must not chase.

Do not ask the worker to edit PACT-owned files directly. Keep feedback concise
and tied to artifact evidence. Do not assign a broad rewrite when one bounded
oracle gap or summary/process repair would make the next round recoverable.
