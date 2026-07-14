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

Reference-port parity worker workflow:

1. Before source edits or long probes, create or update the summary at {{summaryPath}} with a Summary Heartbeat.
Include:
- bounded round objective,
- parser and public API surfaces in scope,
- chosen Reference-Port Strategy,
- initial Reference Parity Ledger rows,
- known verification debt,
- staged checkpoint plan if work is broad.

2. Read the todo, goal tracker, contract, and relevant source/spec evidence. Do not edit PACT-owned artifacts as solution changes.

3. Classify the task.
If the task touches parser, file-format, TOML, `tomllib`, fixture corpus, public parser API, parse callbacks, date/time construction, or parser exceptions, treat it as a high-risk reference-port task.

4. Prefer reference behavior before implementation.
Use upstream-compatible, CPython-compatible, or tomli-compatible behavior as the target. A fresh local parser design is partial until it is compared against reference behavior.

5. Build the Reference Parity Ledger before implementation.
For TOML/parser work, include rows for:
- valid fixture acceptance,
- invalid fixture rejection,
- exact `TOMLDecodeError` messages, line, column, end-of-document, and invalid-character formatting,
- invalid `parse_float` return behavior,
- invalid date, time, and datetime wrapping into `TOMLDecodeError`,
- `TOMLDecodeError` constructor and `__module__` behavior,
- public API, recursion, deepcopy, import, and install behavior when relevant.

6. Implement the smallest coherent patch that moves the parser toward reference parity.
Prefer porting or adapting reference-compatible logic over inventing incompatible behavior. Keep required rows open until evidence closes them.

7. Produce evidence before claiming completion.
Each required Reference Parity Ledger row needs committed fixtures, direct unittest probes, or documented reference comparison. Synthetic local tests, manual probes, and source inspection are partial unless tied to explicit reference comparison.

Your final summary update must include:
- Summary Heartbeat status.
- Round Budget outcome.
- Reference-Port Strategy.
- Requirement Source Ledger.
- Reference Parity Ledger.
- Impact Oracle Matrix linked to parity rows.
- Evidence Provenance Grade Ledger.
- Verification Debt Ledger.
- Surface Equivalence Matrix, or not_applicable with evidence.
- Deferred and Rejected Work.
- Goal Tracker Update Request.

Completion claims are invalid if the Reference Parity Ledger is missing, required parser parity rows lack fixture/unittest/reference-comparison evidence, or required verification debt remains open.
After writing the final summary update, stop work and return control to PACT.
