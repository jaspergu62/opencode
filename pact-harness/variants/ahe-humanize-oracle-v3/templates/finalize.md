{{defaultPrompt}}

Round: {{round}} {{roundName}}
Loop directory: {{loopDir}}
Goal tracker path: {{goalTrackerPath}}
Plan path: {{planPath}}
Finalize summary path: {{finalizeSummaryPath}}

Goal tracker schema:
{{goalTrackerSchema}}

Finalize from durable artifacts only. Do not convert uncertainty into success.

Hidden-readiness checklist:
- All original_required and derived_required ACs are satisfied or reviewer
  invalidated_out_of_scope with evidence.
- Implementation surfaces named by the original requirement, imported plan,
  anchors, public API, or existing-tree facts are classified with source
  evidence.
- Every changed high-risk surface has an audited Impact Oracle Matrix row, and
  each required oracle is covered by regression, fixture, build/runtime gate,
  public verification, or source-backed non-applicability.
- Required deferred work is empty.
- Open high-risk verification debt is empty.
- Manual-only evidence is not used to close high-risk work.
- The latest worker summary exists, is not stale, and matches the final patch.
- Parser/format work has fixture or compliance evidence, or reviewer-approved
  non-applicability.
- Grammar/compiler/AST work has automated regression evidence where relevant.
- Multi-surface work has equivalence evidence or non-applicability.
- Duplicate surfaces mentioned by the original plan/spec/anchors are not
  treated as non-applicable merely because the worker skipped them.
- Stdlib/module integration work has import/build/install/metadata evidence
  for touched surfaces, or reviewer-approved non-applicability.
- No stale-summary process defect remains open.
- Public verification does not block final hidden scoring.
- If final hidden gate artifacts are present and failed, report the concrete
  missing oracle family and do not claim success. Use the failure only as a
  lesson for the next harness/round, not as evidence that the current patch is
  complete.

The final summary must include:
- Requirement Source outcome.
- Implementation Surface Inventory outcome.
- Impact Oracle Matrix outcome.
- Evidence Grade outcome.
- Verification Debt outcome.
- Surface Equivalence outcome.
- Case-Learned Gate outcome.
- Round Budget / Summary Heartbeat outcome.
- Risk Ledger outcome.
- Optional risks that remain non-blocking.

Do not claim complete coverage unless the tracker, review, and verification
artifacts support every checklist item. If the durable artifacts are missing or
stale, summarize the gap and stop without upgrading status.
