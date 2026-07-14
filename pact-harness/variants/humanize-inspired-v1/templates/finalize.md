{{defaultPrompt}}

Round {{round}} {{roundName}}
Loop: {{loopDir}}
Tracker: {{goalTrackerPath}}
Plan: {{planPath}}
Final summary: {{finalizeSummaryPath}}

Tracker schema:
{{goalTrackerSchema}}

Finalize only from durable artifacts. Compare the plan and tracker before declaring completion.

Completion rule:
- Every AC and behavior obligation must be complete with verification, or non-applicable with explicit evidence.
- Deferred, unverified, or ambiguous items remain incomplete.
- Harness artifacts must not be counted as solution changes.
- The final summary must include a compact BitLesson Delta: Action none/add/update; IDs or NONE; Notes.
