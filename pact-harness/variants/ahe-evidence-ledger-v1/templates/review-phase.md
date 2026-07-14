{{defaultPrompt}}

Round: {{round}} {{roundName}}
Loop directory: {{loopDir}}
Feedback path: {{feedbackPath}}
Goal tracker path: {{goalTrackerPath}}
Plan path: {{planPath}}
Summary path: {{summaryPath}}

Goal tracker schema:
{{goalTrackerSchema}}

Prepare review-phase feedback for the next worker. Keep it grounded in PACT artifacts and avoid speculative coaching.

Feedback should include:
- Confirmed evidence: what the patch, summary, verification, or review actually showed.
- Falsified predictions: claims from the prior round that did not survive artifact review.
- Unresolved predictions: expected impacts still lacking evidence.
- Active risks: risk ledger items that should shape the next patch or verification step.
- Next attribution target: the smallest claim the next round should prove or disprove.

Do not ask the worker to edit PACT-owned files directly. Keep feedback concise and actionable.
