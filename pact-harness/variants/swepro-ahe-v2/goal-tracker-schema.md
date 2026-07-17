# PACT Goal Tracker Schema Overlay

## 1. Immutable Requirement Model

The Ultimate Goal preserves every imported requirement. Acceptance Criteria definitions are immutable and contain:

- `AC ID`
- behavioral outcome at an observable boundary
- requirement provenance: `normative`, `derived`, or `risk_inferred`
- mapped `BO-*` obligation
- selected oracle families
- impact: `high`, `medium`, or `low`

Do not put mutable status in the immutable AC table. The initial reviewer status snapshot records every AC as `not_met` until evidence is admitted.

A literal, exact format, symbol removal, ownership choice, or integration point may be mandatory only when supported by normative requirement text or a concrete consumer contract. Examples and plausible implementation choices are not normative by themselves.

## 2. Canonical Status Vocabularies

Acceptance Criterion statuses are exactly:

- `met`
- `partial`
- `not_met`
- `deferred`
- `blocked`

Task statuses are exactly:

- `complete`
- `partial`
- `pending`
- `deferred`
- `blocked`

No synonym, capitalization variant, or BO status may appear in the AC or task maps. Only a reviewer may update these maps.

Behavioral obligations retain their existing evidence vocabulary:

- `UNVERIFIED`
- `PROVEN_CHANGED`
- `PROVEN_BASE_EQUIVALENT`
- `NOT_APPLICABLE_WITH_EVIDENCE`
- `MISSING`

Hard target surfaces retain:

- `CHANGED`
- `BASE_PROVEN_EQUIVALENT`
- `NOT_APPLICABLE_WITH_EVIDENCE`
- `MISSING`

## 3. Mutable Objective Packet

Every active task records `Task`, `Target AC`, `Target BO`, `Status`, `Mode`, `Owner`, `Falsifiable Outcome`, and `Notes`.

Each round has one bounded objective packet:

- mode: `implementation`, `evidence_closure`, `review_phase`, or `finalize`
- one primary objective and its subject IDs
- mutation allowed: yes or no
- inspection budget
- command budget
- gate-output reserve
- prior evidence-state fingerprint
- contract status: standalone or embedded

Implementation rounds must materialize the contract before mutation. A no-mutation checkpoint may embed the complete contract record in its summary and reviewer Status Delta; a missing standalone contract file is not then a completion blocker.

## 4. Append-Only Evidence Ledger

Each evidence row has:

- stable `E-*` ID
- subject IDs: AC, BO, task, assumption, or compatibility row
- precise claim
- oracle family
- observable boundary
- input class and expected result
- provenance: authoritative verification, reviewer reproduction, worker reproduction, source inspection, or inference
- independence: independent or claim-derived
- artifact locator or focused command
- observed result
- final-state fingerprint
- admission state: `CANDIDATE`, `ADMITTED`, `REJECTED`, or `STALE`

Workers may add candidates. Only reviewers admit evidence. Evidence may be carried forward by ID when the relevant source, boundary, requirement, and fingerprint are unchanged. Do not reprint full proofs on every round.

A passing source inspection proves code shape, not behavior. A behavioral claim requires an executable oracle at the claimed boundary. A worker-authored probe cannot be the sole evidence for a high-impact claim.

## 5. Boundary and Counterexample Matrix

Select oracle families from the change shape rather than requiring every family indiscriminately:

- explicit literal, format, or signature: `NORMATIVE_EXACTNESS`
- exported, package-visible, rebound, or owner-sensitive symbol: `API_SHAPE_BINDING`
- added, removed, renamed, or signature-changed symbol: `CONSUMER_COMPATIBILITY`
- changed normal result: `POSITIVE_BEHAVIOR`
- invalid, absent, undefined, sentinel, exception, or fallback path: `NEGATIVE_ERROR_SENTINEL`
- cache, transaction, retry, repeated-call, rollback, or mutation behavior: `STATE_LIFECYCLE`
- middleware, callback, provider, wrapper, or cross-module flow: `INTEGRATION_PROPAGATION`
- type checking or compilation: `BUILD_STATIC`
- unaffected behavior: `REGRESSION`
- final diff and artifact consistency: `PATCH_INTEGRITY`

For high-impact behavior, the reviewer selects at least one orthogonal counterexample not used as the worker's primary proof. Relevant boundary distinctions include direct call versus wrapper, missing versus malformed input, value versus pointer identity, first call versus repeated call, success versus rollback, and implementation package versus affected consumer.

Error and sentinel criteria are not `met` until the expected externally observable result and, when specified, error type are executed and observed. Reachable-looking source is insufficient.

## 6. Compatibility Ledger

Every added, removed, renamed, moved, rebound, or signature-changed symbol gets a `C-*` row containing:

- symbol contract and owner/binding
- change kind
- known and searched consumer surfaces
- consumer build or type-check evidence
- adapter or migration decision
- closure status: `OPEN`, `PROVEN`, or `NOT_APPLICABLE_WITH_EVIDENCE`

Absence of a symbol is not by itself proof that removal is correct. Removal completes only when normative evidence requires it and affected consumers compile, or when a compatibility adapter preserves the required contract.

## 7. Assumption Debt

Each assumption records provenance, affected subjects, impact, falsifying oracle, worker closeability, and status: `OPEN`, `SUPPORTED`, `REFUTED`, or `ACCEPTED_LOW_RISK`.

An assumption is high-impact only when it can violate normative behavior or a concrete consumer contract. An exact value that the requirements and discoverable consumers do not constrain is recorded as bounded risk, not promoted into an uncloseable required AC.

`ACCEPTED_LOW_RISK` cannot override explicit normative text, an authoritative verification failure, or a broken consumer.

## 8. Evidence-State Fingerprint and Convergence

The fingerprint covers final patch identity, changed surfaces, AC and BO snapshots, compatibility rows, admitted evidence IDs, authoritative verification state, and open high-impact assumptions.

At most one evidence-only round may run without changing this fingerprint. A continuation after that requires a newly identified falsifiable gap and a concrete worker-closeable action. Process-only restatement, cosmetic mutation, and substitution of one unsupported guess for another do not qualify.

## 9. Authoritative Verification

Authoritative verification applies to the final workspace state and outranks summaries, probes, source inspection, and earlier passing runs.

- `failed`, `timeout`, or `infra_failed` blocks completion for affected subjects.
- `passed` supports only the behavior actually exercised.
- `unavailable` is not described as passed and is acceptable only when selected high-risk oracle families have independent admitted evidence.

When the runtime exposes a harness-owned final verification command or overlay, run it after the final patch is assembled. Compilation failures are product evidence even when implementation-local probes pass.

## 10. Reviewer Status Snapshot

Every review emits a full snapshot containing:

- all AC IDs with canonical AC statuses
- all active task IDs with canonical task statuses
- all BO statuses
- compatibility closure summary
- assumption summary
- admitted evidence IDs
- authoritative verification state
- round contract record
- evidence-state fingerprint
- decision
- exactly one next action when continuing, including `worker_closeable`

The snapshot is compact: refer to stable evidence IDs instead of duplicating proof narratives.

## 11. Completion Gate

`PACT_COMPLETE` is valid only when:

- every required AC is `met`
- every active implementation task is `complete`; a deferred task is allowed only when it is nonessential and its target AC is already `met`
- every BO and hard target surface is proven or non-applicable with evidence
- every selected high-impact oracle family has admitted evidence at the correct observable boundary
- every compatibility row for a changed or removed contract is `PROVEN` or justified non-applicable
- no normative high-impact assumption is `OPEN` or `REFUTED`
- authoritative verification does not report failure, timeout, or infrastructure failure
- admitted evidence matches the final-state fingerprint
- the reviewer snapshot is complete and internally consistent

A standalone process artifact is not allowed to consume another unchanged no-mutation round when its complete contract record is embedded in the summary and Status Delta.

A terminal review uses the exact heading `### Status Delta`, immediately followed by one fenced JSON object with `role` equal to `reviewer_confirmed`. `PACT_COMPLETE` must be the final non-empty line.
