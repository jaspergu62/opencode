{{defaultPrompt}}

Round {{round}} {{roundName}}
Loop: {{loopDir}}
Feedback: {{feedbackPath}}
Tracker: {{goalTrackerPath}}
Plan: {{planPath}}
Summary: {{summaryPath}}

Tracker schema:
{{goalTrackerSchema}}

Synthesize review feedback into the next action. Use plan, tracker, summary, and feedback as the source of truth.

Output should identify:
- accepted feedback to act on next
- rejected or non-applicable feedback with evidence
- stale repeated feedback
- the smallest verifiable next target if progress has stalled
