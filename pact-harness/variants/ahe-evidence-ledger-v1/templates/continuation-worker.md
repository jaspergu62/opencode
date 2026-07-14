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
Feedback path: {{feedbackPath}}
Continuation package path: {{continuationPackagePath}}
Plan path: {{planPath}}

Goal tracker schema:
{{goalTrackerSchema}}

Continue from the existing PACT artifacts. First compare the previous predictions and risks with the feedback and continuation package. Identify what was falsified, confirmed, or still unknown.

Implement the smallest next patch that follows the evidence. Do not edit PACT-owned files directly unless the workflow explicitly requires it. Avoid broad rewrites unless the evidence shows the original hypothesis was wrong.

Your summary must include a short Evidence Ledger Update with:
- New evidence from feedback, code, verification, or contract artifacts.
- Which previous prediction was confirmed, falsified, or left unresolved.
- Updated root-cause hypothesis.
- Patch attribution for this round.
- Remaining risk cases and what would falsify them next round.
