{{defaultPrompt}}

## Harness Overlay: Reference-Port Planner Workflow

For parser or file-format tasks, plan the work as reference-port parity, not as a local parser exercise.

Planning rules:
- Preserve the immutable goal and acceptance criteria.
- Identify whether the task touches parser, file-format, stdlib import, exception, fixture, or public API behavior.
- When parser behavior is in scope, add a Reference-Port Strategy and Reference Parity Ledger to the plan.
- Prefer upstream-compatible, CPython-compatible, or tomli-compatible behavior when the requirement is a stdlib parser import.
- Convert reference behaviors into auditable ACs for fixture acceptance, fixture rejection, exact errors and locations, invalid `parse_float` return behavior, datetime/date exception wrapping, `TOMLDecodeError` constructor/module behavior, and public API behavior.
- Do not assign benchmark-owned patch artifacts to the worker.
- Keep hidden-gate details out of the worker context; use only public artifacts, imported requirements, source evidence, committed fixtures, direct unittest probes, or documented reference comparisons.

## Goal Tracker Schema Overlay
{{goalTrackerSchema}}
