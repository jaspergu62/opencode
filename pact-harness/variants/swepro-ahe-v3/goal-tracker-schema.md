# PACT Goal Tracker Schema Overlay — swepro-ahe-v3

## 1. Authority and Status Vocabularies

- The Ultimate Goal and Acceptance Criterion text are immutable after planning. Preserve every imported behavioral and interface requirement.
- Acceptance Criterion statuses are exactly `met`, `partial`, `not_met`, `deferred`, or `blocked`. Initialize an unproved required AC as `not_met`.
- Task statuses are exactly `complete`, `partial`, `pending`, `deferred`, or `blocked`.
- Workers may request changes through an Evidence Closure Request, but only a reviewer may confirm AC or task status.
- Workers, review-phase workers, and finalizers must not emit the heading `### Status Delta`, the role `reviewer_confirmed`, or `PACT_COMPLETE`.

## 2. Requirement and Claim Register

Each AC must record:

| Field | Meaning |
| --- | --- |
| ID | Stable AC identifier. |
| Requirement | Behavioral or interface contract. |
| Claim class | `normative`, `derived`, or `risk_inferred`. |
| Observable boundary | Where a consumer can observe success or failure. |
| Oracle families | Selected evidence families required for closure. |
| Status | One allowed AC status. |
| Evidence IDs | Reviewer-admitted evidence supporting the current status. |

Claim rules:

- `normative` claims come directly from supplied requirements or an explicit public contract.
- `derived` claims follow from discoverable consumers, existing public API shape, or repository conventions needed to satisfy a normative claim.
- `risk_inferred` claims are useful falsifiers but cannot invent an exact literal, owner, receiver, field name, removal, or integration requirement.
- Exact spelling, binding location, signature, default value, ordering, and hard removal are blocking only when supported by normative text or a concrete consumer contract. Otherwise record the uncertainty and choose the most compatible implementation.

## 3. Objective Packets and Budgets

Every implementation task belongs to an objective packet containing:

- target ACs and one primary observable boundary;
- production surfaces and consumer surfaces;
- selected oracle families;
- compatibility and side-effect risks;
- a falsifiable exit condition;
- inspection, command, and output budgets.

Default per-round budgets are 12 source inspections, 8 focused commands, 2 broad commands, and a reserved 1,200-token worker gate packet. Default reviewer budgets are 10 source inspections, 6 commands, and a reserved 1,000-token status-and-decision block. The planner may scale a budget once when it records why the default cannot cover the affected consumer family. Budget exhaustion is not proof; stop lower-value inspection and preserve the gate reserve.

Group ACs that share the same boundary and evidence. Do not duplicate the same proof once per AC.

## 4. Append-Only Evidence Ledger

Each evidence row contains:

| Field | Meaning |
| --- | --- |
| Evidence ID | Stable ID carried across unchanged fingerprints. |
| Subjects | ACs, behavioral obligations, compatibility rows, or risks supported. |
| Producer | `worker`, `reviewer`, `authoritative_verifier`, or `repository`. |
| Oracle family | The method used to observe the contract. |
| Boundary | Exact consumer-visible boundary exercised. |
| Artifact or command | Reproducible source, command, result, or patch artifact. |
| Outcome | Pass, failure, or concrete observation. |
| Fingerprint | Final-state fingerprint to which the result applies. |
| Admission | `candidate`, `admitted`, `refuted`, or `stale`. |

Evidence rules:

- Workers add candidates. Reviewers admit, refute, or stale them.
- Evidence priority is: authoritative verifier; pristine-consumer replay; affected-consumer compilation; reviewer-reproduced boundary oracle; worker boundary oracle; source inspection; narrative claim.
- A worker-authored or worker-modified test is not independent evidence for behavior it encodes. It can guide implementation but needs corroboration from a pristine consumer, reviewer reproduction, or authoritative verification.
- Source inspection alone cannot close runtime error identity, sentinel handling, lifecycle, diagnostic side effects, framework propagation, or exact consumer binding.
- Carry evidence by ID only when its subject surface, boundary, command, dependency state, and fingerprint remain unchanged.

## 5. Final-State Fingerprint

Track together:

- base revision identity;
- production-patch hash and changed production files;
- persistent-test-patch hash and changed or added test files;
- selected consumer-contract version;
- admitted evidence IDs;
- authoritative verification state;
- pristine-consumer replay state;
- open high-impact assumptions.

A production, test, dependency, generated-file, or consumer-contract change stales affected evidence. Rewording a summary does not create a new fingerprint.

## 6. Patch-Composition Ledger

Record:

| Field | Required observation |
| --- | --- |
| Production patch | Hash and production files only. |
| Modified tracked tests | Listed separately from production changes. |
| Added worker tests | Listed separately; absent by default from export. |
| Temporary probes | Confirmed removed from the exported patch. |
| Pristine-consumer replay | Production patch applied in a clean temporary checkout while tracked tests are restored to base and worker-added tests are absent. |
| Overlay-collision audit | No worker declaration, fixture, helper, generated artifact, or package-level name can collide with a later test overlay. |
| Patch integrity | Clean apply or reverse-apply evidence for the current fingerprint. |

Persistent worker test changes are allowed only when the requirement explicitly makes them a deliverable. They cannot be the sole completion oracle. If external evaluator tests may replace tracked tests or add tests, prefer temporary probes outside the exported patch. Any modified tracked test must also be replayed in its pristine base form against the production patch.

## 7. Consumer Compatibility Ledger

Create one row for every added, removed, renamed, rebound, visibility-changed, or signature-changed symbol, configuration field, test seam, or generated interface:

| Field | Meaning |
| --- | --- |
| Compatibility ID | Stable row ID. |
| Contract | Exact owner or receiver, import path, spelling, parameters, returns, defaults, and visibility. |
| Change kind | Add, remove, rename, rebind, signature, default, or behavior. |
| Consumers searched | Production, tests, fixtures, generated consumers, and neighboring public usage. |
| Executable fixture | A temporary compile or call fixture using the normative binding exactly. |
| Adapter decision | Preserve, adapt, remove, or non-applicable, with evidence. |
| State | Open or evidence-backed closure. |

Absence searches do not prove compatibility. A removal or rename requires affected-consumer compilation and prefers a compatibility adapter unless normative text explicitly requires the old contract to be unavailable. API-shape ACs require an executable consumer fixture; matching source text is insufficient.

## 8. Observable-Boundary and Oracle-Family Selection

Select families by change signature:

- Serialization, parsing, templating, middleware, rendering, or error transformation: `FRAMEWORK_MEDIATED_BEHAVIOR`, `NEGATIVE_SENTINEL_ERROR_IDENTITY`, and a positive round trip.
- Public symbol, field, helper, receiver, or export changes: `API_SHAPE_BINDING`, `CONSUMER_COMPATIBILITY`, and `PRISTINE_CONSUMER_REPLAY`.
- Removal or rename: `CONSUMER_COMPATIBILITY`, executable affected-consumer compilation, and an adapter decision.
- New logs, warnings, notifications, metrics, exceptions, or partial output: `OBSERVABLE_SIDE_EFFECT`, including proof of both required emissions and required silence.
- Cache, state, transaction, or lifecycle changes: `STATE_LIFECYCLE`, including repeated and failure-path behavior; add concurrency evidence when shared state changes.
- Exact literals, defaults, ordering, or protocol values: `NORMATIVE_EXACTNESS` plus a concrete consumer or supplied normative source.
- Test changes: `PATCH_OVERLAY_COMPOSABILITY` and pristine replay with those changes excluded.
- Every production patch: `BUILD_STATIC`, `REGRESSION`, and `PATCH_INTEGRITY` at the narrowest consumer-complete scope.

At least one admitted oracle must exercise the outermost affected consumer boundary. A direct helper probe cannot substitute for a framework-mediated call when the framework can change coercion, exception identity, diagnostics, state, or output.

## 9. Verification and Failure Dominance

- A failed, timed-out, or infrastructure-failed authoritative verification for the current fingerprint blocks completion.
- A failed pristine-consumer replay, exact contract fixture, affected-consumer compile, or selected high-impact boundary oracle blocks the corresponding AC.
- A failure may be classified as pre-existing only when the same command on a clean base reproduces the same relevant failure signature. An unrelated baseline failure is not a waiver.
- `unavailable` verification is not a pass. Completion with unavailable authoritative verification requires admitted evidence for pristine-consumer replay, exact consumer bindings, patch-overlay composability, all selected high-impact boundary families, build/static checks, and patch integrity.
- When any decisive current-fingerprint failure exists, fix or isolate it before gathering more positive evidence.

## 10. Assumption and Side-Effect Debt

Record each high-impact assumption with claim class, possible falsifier, affected ACs, and state. A normative high-impact assumption cannot remain open or refuted at completion. Risk-inferred exactness may be accepted as bounded risk only after consumer discovery finds no contract.

Record every newly added or removed observable side effect: log level and message class, warning, notification, exception type and cause, partial output, mutation, callback, or event. Required silence is a behavior and needs an oracle.

## 11. Convergence

- A continuation must name exactly one falsifiable, worker-closeable next action tied to a failed gate or missing oracle.
- At most one no-production-mutation evidence-closure round is allowed for a fingerprint, and only when it runs a previously missing selected oracle.
- Process-only artifact production, status restatement, and repeated unchanged probes are not valid continuations.
- If all completion gates hold, the reviewer must issue the terminal snapshot immediately. A later finalize pass is a compact no-mutation integrity handoff, not a reason to reopen admitted evidence.

## 12. Completion Gate and Terminal Protocol

`PACT_COMPLETE` is valid only when:

1. every required AC is `met`;
2. every active implementation task is `complete`;
3. every behavioral obligation and hard target surface is proven or non-applicable with evidence;
4. the production patch passes pristine-consumer replay with worker test changes excluded;
5. every changed consumer contract has an exact executable binding fixture and compatibility closure;
6. every selected high-impact oracle family has admitted evidence at the correct observable boundary;
7. no current authoritative, pristine-consumer, consumer-compile, or boundary-oracle failure remains;
8. unavailable authoritative verification, if applicable, satisfies the fallback matrix in section 9;
9. admitted evidence matches the final-state fingerprint; and
10. the reviewer emits a complete, internally consistent AC and task snapshot.

Every review must end its substantive content with the exact heading `### Status Delta`, immediately followed by exactly one fenced JSON object. The object must contain `role: "reviewer_confirmed"`, every actual AC ID exactly once with an allowed AC status, and every actual task ID exactly once with an allowed task status. Do not emit `(none)`, placeholder IDs, partial snapshots, or a worker-authored confirmation.

Only a terminal review may emit `PACT_COMPLETE`, and it must be the final non-empty line.
