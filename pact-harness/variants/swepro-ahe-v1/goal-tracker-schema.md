# PACT Goal Tracker Schema Overlay

## 1. Immutable Requirement Model
- Preserve the Ultimate Goal and every imported requirement without weakening or silently interpreting them.
- Acceptance Criteria are behavioral outcomes with stable `AC-*` identifiers. Keep related clauses in one outcome AC; place atomic proof obligations in `BO-*` rows instead of duplicating every clause as an AC and task.
- The immutable AC table keeps its original status value, normally `pending`. Runtime completion state lives only in the reviewer-owned mutable ledger.
- Every AC records its linked BOs, risk classes, and required oracle families.
- Unknown exact values, integration expectations, public API shapes, or compatibility semantics become explicit assumptions; they must not be converted into worker-chosen facts.

## 2. Round Register
Every round has one reviewer-auditable contract row:

`Round | Mode | Objective Packet | Mutation Allowed | Inspection Budget | Command Budget | Evidence Reserve | Prior Fingerprint | Contract Status`

Allowed modes are `implementation`, `evidence_closure`, `review_phase`, and `finalize`.
- `implementation` changes the smallest coherent production surface needed for one objective packet.
- `evidence_closure` creates missing proof without gratuitous source edits.
- `review_phase` investigates concrete correctness, regression, or patch-quality findings.
- `finalize` reconciles artifacts and emits terminal state; it is not a general implementation round.
- Contract Status is `present` or `violated`. Audit-only and finalize rounds still require a minimal contract with `Mutation Allowed: no`.
- Reserve enough budget to produce the evidence packet and gate record. Budgets may be enlarged only by the planner with a recorded reason.

## 3. Requirement State Ledger
Maintain one mutable reviewer-owned row per AC, task, BO, and hard target surface:

`Subject ID | Kind | Parent AC | Status | Risk Classes | Required Oracles | Admitted Evidence IDs | Open Assumption IDs | Last Reviewer Round`

Workers may propose changes, but only reviewers admit evidence and change status. A later contradictory observation invalidates affected rows and records the invalidating evidence ID.

## 4. Append-Only Evidence Ledger
Each independently addressable claim uses a stable evidence ID:

`E-* | Subject IDs | Claim | Producer | Provenance Tier | Evidence Kind | Oracle Family | Observation | Scope | Round | Freshness | Reviewer Disposition`

Provenance tiers:
- `AUTHORITATIVE_ARTIFACT`: harness-produced patch, verification, build, or contract artifact.
- `REVIEWER_REPRODUCED`: reviewer directly inspected or reproduced the observation.
- `WORKER_REPORTED`: candidate evidence awaiting reviewer admission.

Evidence kinds are `REQUIREMENT`, `PATCH`, `SOURCE`, `TEST`, `BUILD`, `STATIC`, `RUNTIME_PROBE`, `INTEGRATION`, `BASELINE_COMPARISON`, and `ARTIFACT_INTEGRITY`.

Reviewer Disposition is `ADMITTED`, `REJECTED`, `STALE`, or `CANDIDATE`. Terminal proof requires admitted evidence. Worker-reported command results alone are not authoritative verification.

Carry admitted evidence forward by ID when the relevant patch bytes, source surface, and requirement have not changed. Do not re-run or restate settled low-risk evidence merely because the round number changed.

## 5. Assumption-Debt Ledger
Record every nontrivial inference:

`A-* | Subject IDs | Assumption | Risk Class | Impact | Required Oracle | Evidence IDs | Status | Resolution`

Risk classes include:
- `EXACT_VALUE`
- `PUBLIC_API_SHAPE`
- `INTEGRATION_WIRING`
- `POSITIVE_BEHAVIOR`
- `NEGATIVE_EDGE`
- `STATE_LIFECYCLE`
- `COMPATIBILITY_BASELINE`
- `BUILD_STATIC`
- `REGRESSION`
- `PATCH_INTEGRITY`
- `PROCESS_ARTIFACT`

Assumption status is `OPEN`, `SUPPORTED`, `REFUTED`, or `ACCEPTED_LOW_RISK`. An `OPEN` or `REFUTED` high-impact assumption blocks completion. Exact constants, registration or wiring, externally visible API shape, persistence or lifecycle semantics, and error behavior are high-impact unless the imported requirements prove otherwise. Calling such an item advisory does not close it.

## 6. Reviewer Oracle Families
Select oracles from the subject's risk rather than applying one generic source audit:
- `REQUIREMENT_EXACTNESS`: confirms exact literals, defaults, ordering, signatures, and named behavior against imported requirements.
- `API_SHAPE`: checks exports, types, signatures, visibility, and compatibility.
- `INTEGRATION`: proves the changed component is reached through the intended production path when wiring is required.
- `POSITIVE_BEHAVIOR`: exercises expected successful behavior.
- `NEGATIVE_EDGE`: exercises missing, empty, invalid, exceptional, and boundary inputs relevant to the change.
- `STATE_LIFECYCLE`: checks repeated calls, cancellation, cleanup, persistence, and state transitions where relevant.
- `COMPATIBILITY_BASELINE`: compares unchanged behavior with the base revision using concrete source, diff, or paired execution evidence.
- `BUILD_STATIC`: runs applicable build, type, format, lint, or static checks.
- `REGRESSION`: exercises the narrow affected suite or an equivalent public check.
- `PATCH_INTEGRITY`: proves patch applicability, changed-file scope, test separation, and absence of unrelated artifacts.
- `PROCESS_ARTIFACT`: validates the round contract, verification state, and ledger serialization.

A changed BO needs an admitted patch or source observation plus at least one behavior-appropriate oracle. A base-equivalence claim needs `COMPATIBILITY_BASELINE`; a no-diff assertion alone is insufficient. `NOT_APPLICABLE_WITH_EVIDENCE` requires positive scope evidence, not an empty claim.

## 7. Canonical Status Vocabulary
AC/task status: `pending`, `partial`, `complete`, `blocked`, `deferred`.

BO status: `UNVERIFIED`, `PROVEN_CHANGED`, `PROVEN_BASE_EQUIVALENT`, `NOT_APPLICABLE_WITH_EVIDENCE`, `MISSING`.

Hard target surface status: `CHANGED`, `BASE_PROVEN_EQUIVALENT`, `NOT_APPLICABLE_WITH_EVIDENCE`, `MISSING`.

Verification status: `passed`, `failed`, `unavailable`, `timeout`, `infra_failed`.

Use these exact strings. Absence of a verification artifact is `unavailable`, never implicit success.

## 8. Worker Budget and Convergence Rules
- One round owns one objective packet. Prefer the largest coherent implementation slice that still leaves budget for relevant verification and evidence serialization.
- When implementation is complete, switch to `evidence_closure`; do not make cosmetic edits to manufacture patch activity.
- An evidence-closure round must name the missing oracle, assumption, or artifact it will close.
- Compute an evidence-state fingerprint from patch identity, terminal statuses, open assumptions, and admitted evidence IDs.
- Permit at most one no-source-change evidence-closure round for a fingerprint. If the next round has the same fingerprint, the reviewer must either emit a terminal snapshot or identify a new falsifiable gap with its required oracle. Re-auditing the same facts is not a gap.

## 9. Reviewer Snapshot Contract
Every review emits a self-contained `### Status Delta` fenced JSON object. Despite the compatibility heading, it is a full current snapshot, not merely changed rows. It contains:
- `role: reviewer_confirmed`
- every AC status in `ac`
- every task status in `tasks`
- every BO status in `bo`
- every hard target surface status, or the exact string `NOT_APPLICABLE_WITH_EVIDENCE` when positive evidence proves the set is empty
- every blocking assumption status in `assumptions`
- admitted evidence IDs in `evidence`
- `verification_status`
- `contract_status`
- `evidence_state_fingerprint`

Never emit `Status Delta (none)` when claiming completion. A no-change review re-emits the full confirmed snapshot.

## 10. Completion and Finalize Gate
`PACT_COMPLETE` is valid only when:
- every AC and active task is `complete`;
- every BO is `PROVEN_CHANGED`, `PROVEN_BASE_EQUIVALENT`, or `NOT_APPLICABLE_WITH_EVIDENCE`;
- every hard target surface is `CHANGED`, `BASE_PROVEN_EQUIVALENT`, or `NOT_APPLICABLE_WITH_EVIDENCE`;
- all required oracle families have admitted evidence;
- no high-impact assumption is `OPEN` or `REFUTED`;
- verification is not `failed`, `timeout`, or `infra_failed`;
- patch integrity and the round contract are proven;
- the full reviewer snapshot is internally consistent with the patch and evidence ledger.

Once these conditions hold, finalize immediately and emit `PACT_COMPLETE`. Do not schedule another no-change worker round. If they do not hold, emit `PACT_CONTINUE` and name the smallest falsifiable gap, its subject IDs, and the next required oracle.
