{{defaultPrompt}}

Round {{round}} {{roundName}}
Loop: {{loopDir}}
Objective: {{objective}}
Todo: {{todoPath}}
Tracker: {{goalTrackerPath}}
Summary: {{summaryPath}}
Contract: {{contractPath}}
Pre-snapshot: {{preSnapshotPath}}

Current state:
{{currentStateSnapshot}}

Spec evidence:
{{specEvidenceReferences}}

Tracker schema:
{{goalTrackerSchema}}

Implement one coherent, verifiable slice. Treat the generated prompt, todo, contract, tracker, and summary as source of truth. Do not edit harness artifacts as solution changes.

Before finishing:
- Update the tracker for every touched AC or obligation.
- Record verification or evidence-backed non-applicability.
- If progress stalls, choose one smaller target that can be proven this round.
- Write a compact BitLesson Delta in the summary: Action none/add/update; IDs or NONE; Notes.
