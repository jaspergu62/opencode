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
- Accepted oracle debt findings.
- Accepted verification debt findings.
- Rejected or out-of-scope findings, with evidence.
- Stale or already-proven findings.
- The smallest next target that closes a required oracle or evidence gate.
- Required Impact Oracle Matrix rows to add or satisfy next.
- Any AC narrowing or scope-drift risk the next worker must not chase.

For case-shaped gaps, name the oracle family directly:
- zoneinfo weird/TZ-string/fold/fromutc/cache/pickle/path/C-Python parity,
- grammar parser/AST/runtime/future/type-hints/unparse/negative syntax,
- TOML upstream-compatible valid/invalid fixtures, exact errors, exception behavior, parse_float failure, and public API behavior.

Do not ask the worker to edit PACT-owned files directly. Keep feedback concise and tied to artifact evidence.
