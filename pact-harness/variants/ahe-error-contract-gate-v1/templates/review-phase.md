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
- Summary heartbeat defects: missing, stale, or current.
- Accepted required findings.
- Accepted TOML Error Contract Gate debt.
- Accepted verification debt findings.
- Rejected or out-of-scope findings, with evidence.
- Stale or already-proven findings.
- The smallest next target that closes a required contract row.
- Required TOML Error Contract Gate rows to add or satisfy next.
- Any AC narrowing or scope-drift risk the next worker must not chase.

For TOML-shaped gaps, name the contract row directly:
- valid fixtures accepted,
- invalid fixtures rejected with TOMLDecodeError,
- exact message, line, column,
- missing-value wording and location,
- invalid-character quoted repr,
- TOMLDecodeError no-arg and three-arg constructor plus module,
- invalid date wrapping,
- invalid parse_float return ValueError,
- public API regressions.

Do not ask the worker to edit PACT-owned files directly. Keep feedback concise and tied to artifact evidence.
