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

Goal tracker schema:
{{goalTrackerSchema}}

Guarded worker workflow:

1. Before source edits, read the todo, goal tracker, contract, and relevant
   source/spec evidence. Do not edit PACT-owned artifacts as solution changes.
   Write the round contract first. After the first coherent or importable patch
   checkpoint, create the summary file as a live heartbeat, even if it says the
   work is incomplete. Keep refreshing it after meaningful edits or verification.

2. Rebuild the Requirement Source Ledger in your own words.
   - Which ACs are original required?
   - Which ACs are derived required?
   - Which possible checks are optional?
   - Which tempting tasks are out of scope?
   - If the task is too large for one round, choose a bounded vertical slice,
     keep all other required ACs open, and say exactly what remains. Do not
     relabel required work as optional to make the slice look complete.

3. Build a Verification Plan before implementing.
   - For each high-risk AC, name the evidence grade required to close it.
   - Before declaring a surface out of scope, build an Implementation Surface
     Inventory from the original requirement, imported plan, implementation
     anchors, public API names, and changed-file expectations.
   - Parser/format work needs fixture or compliance-style coverage when such a
     corpus is known or easy to vendor from in-tree/upstream context already
     present in the workspace.
   - Grammar/compiler/AST work needs automated regressions for runtime,
     future/annotation, and AST/tooling behavior when relevant.
   - Multi-surface work needs equivalence checks across the surfaces.
   - Stdlib/module integration work needs import/build/install or metadata
     evidence for the surfaces touched by the patch.
   - Build an Impact Oracle Matrix from the files you expect to change. For
     each changed surface, name the likely oracle family and the evidence grade
     needed before completion.

4. Apply the Humanize case-pattern checklist before coding:
   - PEP680-like parser/format work: identify compliance fixtures and
     error-focused tests early. If no in-tree corpus exists, synthesize a small
     table-driven corpus that covers valid scalars/containers/datetime, invalid
     syntax, binary `load`, keyword-only `parse_float`, original float spelling,
     no path support, no writer APIs, and stdlib metadata/import behavior. A
     small smoke suite is partial evidence only.
   - PEP615-like duplicate implementation work: enumerate C accelerator,
     pure-Python fallback, generated metadata, docs/tests, and cache/runtime
     paths as separate surfaces. Claims of same semantics need equivalence
     evidence. Do not mark a duplicate surface `not_applicable` merely because
     the first patch did not touch it; use source evidence from the requirement,
     plan, anchors, or existing tree. For zoneinfo-style work, map ordinary
     zones, weird/minimal TZif files, TZ strings, folds/gaps, `fromutc`, cache,
     pickle, path traversal, tzdata fallback, and duplicate-surface parity to
     concrete probes or available tests before claiming complete.
   - PEP646-like grammar/compiler work: cover positive syntax, negative
     syntax, AST shape, runtime annotations, future-annotations behavior, and
     unparse/cosmetic roundtrip when those surfaces are touched. If the patch
     changes grammar/compiler/AST/unparser behavior, worker-chosen typing tests
     alone are not enough.
   - If an AC appears broader than the original task, record it as a source
     classification issue instead of silently implementing or ignoring it.

5. Implement the smallest coherent patch that can satisfy both behavior and
   evidence gates. Stop expanding once the strongest required gate for this
   round is closed and the matching oracle evidence is green. Reserve time to
   refresh the summary and return control to PACT. Do not mark required
   deferred work complete. Do not narrow ACs to fit what was implemented.

Your summary must include these sections:
- Requirement Source Ledger.
- Implementation Surface Inventory.
- Impact Oracle Matrix.
- Verification Plan and Evidence Grade.
- Round Budget / Summary Heartbeat status.
- Surface Equivalence Matrix, or `not_applicable` with evidence.
- Deferred and Rejected Work.
- Evidence Ledger Update.
- Risk Ledger Update.
- Goal Tracker Update Request.

Completion claims are invalid if high-risk required work has only manual probe
evidence, if a changed high-risk surface has no oracle row, or if required
verification debt remains open.
After writing the summary, stop work and return control to PACT. Do not keep
editing, testing, or auditing after the summary.
