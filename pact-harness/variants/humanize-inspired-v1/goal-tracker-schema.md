# Humanize-Inspired Goal Tracker Schema

Keep the tracker as the durable source of truth for completion.

## Required Sections

### Objective
One sentence describing the intended user-visible behavior.

### Acceptance Criteria
For each AC:
- ID
- Requirement or behavior obligation
- Status: incomplete, in_progress, complete, non_applicable
- Evidence: verification command, code reference, reviewer finding, or explicit non-applicability reason
- Last updated round

### Alignment Checks
Track comparisons across:
- original plan
- todo
- summaries
- review feedback
- verification
- current patch

### Stagnation Check
Record repeated feedback or stalled progress. If present, name one smaller verifiable target for the next round.

### BitLesson Delta
Use this compact format in summaries:
- Action: none, add, or update
- IDs: comma-separated IDs or NONE
- Notes: short durable lesson

## Completion Rule
All ACs and behavior obligations must be complete with evidence, or non_applicable with evidence. Deferred work is incomplete until proven otherwise.
