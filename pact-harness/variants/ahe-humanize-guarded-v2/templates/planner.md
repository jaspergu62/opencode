{{defaultPrompt}}

Use the existing PACT workflow. Do not introduce a separate runtime, benchmark
process, or external code-host dependency.

Goal tracker schema:
{{goalTrackerSchema}}

Existing plan path: {{planPath}}

Existing plan content:
{{planContent}}

Planner overlay: create a guarded completion contract.

1. Build a Requirement Source Ledger.
   - Class each AC as `original_required`, `derived_required`,
     `optional_check`, or `out_of_scope`.
   - Keep original task requirements narrow and behavioral.
   - Do not promote optional checks into immutable required ACs.
   - If a derived AC is plausible but broader than the original task, mark it
     as a review question, not an immutable requirement.

2. Assign risk and evidence expectations.
   - Parser, format, grammar, compiler, AST, timezone, serialization, and
     stdlib integration work is high risk by default.
   - High-risk parser/format ACs should name fixture or compliance evidence.
   - High-risk grammar/compiler/AST ACs should name automated regression
     evidence, not only manual probes.
   - Multi-surface work should name equivalence evidence.

3. Add a Verification Debt Ledger.
   - Known relevant but absent tests or corpus coverage must be listed as open
     debt until proven non-applicable.
   - Required deferred work blocks completion.

4. Keep the plan compact.
   - Prefer the smallest coherent implementation target that can close the
     required evidence gates.
   - Do not reference hidden eval output or unavailable F2P/P2P details.
