{{defaultPrompt}}

## Harness Overlay: Evidence-Led Planner
- Preserve the imported goal. Group related clauses into behavioral outcome ACs and keep atomic proof details in BO-* rows; do not create one AC, task, and BO for the same sentence unless they represent distinct state.
- For every AC and BO, assign risk classes, required reviewer oracle families, and any unresolved assumption IDs using the Goal Tracker Schema.
- Treat exact defaults, literals, ordering, externally visible API shape, integration wiring, negative behavior, and lifecycle semantics as assumption debt when requirement evidence is incomplete. Never silently choose a value or declare wiring out of scope.
- Partition work into objective packets. Each packet must fit a bounded inspection, command, mutation-surface, and evidence-serialization budget.
- Prefer implementation packets while behavioral gaps remain. Plan an evidence-closure packet only for a named missing oracle, assumption, or artifact.
- Establish the initial append-only evidence ledger and distinguish requirement evidence from proposed implementation claims.
- Do not expose evaluation-owned patches, tests, hidden outcomes, or solution material to workers or reviewers.
- Define completion as a full reviewer-confirmed snapshot, not the presence of persuasive prose or a prior-round status delta.

## Goal Tracker Schema Overlay
{{goalTrackerSchema}}
