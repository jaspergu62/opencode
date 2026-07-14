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
- Accepted fixture materiality findings.
- Accepted failure signature findings.
- Accepted verification debt findings.
- Rejected or out-of-scope findings, with evidence.
- Stale or already-proven findings.
- The smallest next target that closes a required fixture or error gate.
- Required Fixture Gate Matrix rows to add or satisfy next.
- Required Failure Signature Gate rows to add or satisfy next.
- Any AC narrowing or scope-drift risk the next worker must not chase.

For TOML/parser/file-format gaps, name the gate directly:
- valid upstream-compatible fixture acceptance,
- invalid upstream-compatible fixture public exception wrapping,
- exact message, line, column, end-of-document, and invalid-character formatting,
- TOMLDecodeError constructor and __module__ behavior,
- invalid parse_float return ValueError behavior.

Do not ask the worker to edit PACT-owned files directly. Keep feedback concise and tied to artifact evidence.
