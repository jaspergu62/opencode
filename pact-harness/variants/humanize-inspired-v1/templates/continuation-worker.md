{{defaultPrompt}}

Round {{round}} {{roundName}}
Loop: {{loopDir}}
Objective: {{objective}}
Plan: {{planPath}}
Todo: {{todoPath}}
Tracker: {{goalTrackerPath}}
Summary: {{summaryPath}}
Contract: {{contractPath}}
Feedback: {{feedbackPath}}
Continuation package: {{continuationPackagePath}}
Pre-snapshot: {{preSnapshotPath}}

Current state:
{{currentStateSnapshot}}

Spec evidence:
{{specEvidenceReferences}}

Tracker schema:
{{goalTrackerSchema}}

Continue from the prior artifacts, not memory. Compare plan, tracker, summary, feedback, verification, and current state before editing.

Rules:
- Address reviewer feedback directly when valid.
- If feedback repeats or progress is stagnant, narrow to one smaller verifiable target.
- Keep incomplete deferred work marked incomplete unless evidence proves non-applicable.
- Do not modify harness artifacts as solution changes.
- Update tracker and summary, including BitLesson Delta: Action none/add/update; IDs or NONE; Notes.
