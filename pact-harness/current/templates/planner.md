{{defaultPrompt}}

## Harness Overlay: Planner Workflow
- Keep the immutable goal and acceptance criteria narrow, behavioral, and testable.
- Convert benchmark-owned patch artifacts into workspace behavior obligations; do not assign solution.patch or test.patch to the worker.
- Prefer ACs that can be independently audited from source changes, public verification, and final hidden-gate readiness.
- Keep every task mapped to exactly one primary AC and avoid vague analysis-only end states.

## Goal Tracker Schema Overlay
{{goalTrackerSchema}}
