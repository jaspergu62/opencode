{{defaultPrompt}}

Use the existing PACT workflow. Do not introduce a separate runtime, benchmark process, or external code-host dependency.

Goal tracker schema:
{{goalTrackerSchema}}

Existing plan path: {{planPath}}

Existing plan content:
{{planContent}}

Planner overlay: create a failure-oracle completion contract.

1. Add a Summary Heartbeat requirement.
- The first worker action must create or update the summary with a bounded objective, expected surfaces, initial oracle rows, and known debt before long probes or broad edits.
- Timeout without a summary is incomplete.

2. Add a Round Budget.
- Define the smallest coherent vertical slice for the next round.
- Broad subsystem work must include staged checkpoints and a stop condition.
- Required work postponed by budget remains open debt.

3. Build a Requirement Source Ledger.
- Class each AC as original_required, derived_required, optional_check, or out_of_scope.
- Keep original task requirements narrow and behavioral.
- If a derived AC is broader than the original task, mark it as a review question rather than an immutable requirement.

4. Build an Impact Oracle Matrix.
- For each changed surface, name the failure family, required oracle family, evidence provenance grade, and artifact expected.
- High-risk parser, format, grammar, compiler, AST, timezone, serialization, and stdlib integration work needs oracle rows before completion.

5. Apply case-learned defaults.
- Zoneinfo work needs fold, gap, fromutc, TZ string, weird TZif, pickle, path, cache, weakref, GC, and C/Python parity rows when relevant.
- Grammar/compiler/AST work needs parser, AST validation, compiler/runtime, future annotations, typing.get_type_hints, unparse, and negative syntax rows when relevant.
- TOML/parser/file-format imports need upstream-compatible valid and invalid fixtures, exact error behavior, exception constructor/module behavior, parse_float failure behavior, and relevant public API rows.

6. Add evidence provenance rules.
- upstream_oracle can close covered high-risk behavior.
- committed_equivalent_fixture can close only with equivalence rationale.
- synthetic_local_test is partial for high-risk surfaces.
- manual_probe is partial only.
- source_inspection is a risk note only.
