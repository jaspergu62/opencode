# PACT Goal Tracker Schema Overlay — swepro-ahe-v4

## 1. Authority and Canonical Status

- Preserve the Ultimate Goal, imported requirements, AC text, and BO text after planning.
- Acceptance Criterion statuses are exactly `met`, `partial`, `not_met`, `deferred`, or `blocked`. Initialize an unproved required AC as `not_met`.
- Task statuses are exactly `complete`, `partial`, `pending`, `deferred`, or `blocked`.
- BO proof statuses are `UNVERIFIED`, `PROVEN_CHANGED`, `PROVEN_BASE_EQUIVALENT`, `NOT_APPLICABLE_WITH_EVIDENCE`, or `MISSING`.
- Terminal BO proof statuses are only `PROVEN_CHANGED`, `PROVEN_BASE_EQUIVALENT`, or `NOT_APPLICABLE_WITH_EVIDENCE`.
- Workers propose evidence and status changes. Only a reviewer confirms statuses and durable approvals or rejections.
- Workers, review-phase workers, and finalizers must not emit `### Status Delta`, `role: reviewer_confirmed`, or `PACT_COMPLETE`.

## 2. Compact Objective and Evidence State

Each round owns one coherent objective packet containing target AC and BO IDs, the observable outcome, anticipated production surface, mutation permission, verification plan, and last coherent patch fingerprint.

Keep a compact append-only evidence ledger:

`E-* | Subjects | Trigger | Boundary | Command or Artifact | Expected | Observed | Fingerprint | Admission`

Admission is `candidate`, `admitted`, `rejected`, or `stale`. Carry admitted evidence by stable ID while its requirement, boundary, dependency state, and fingerprint remain unchanged. Source inspection proves source shape only; it does not prove consumer binding or observable runtime behavior.

## 3. Diff-Triggered Risk Register

Classify the assembled production diff before selecting extra probes:

- `LOCAL_DIFF`: no public binding, integration entry, framework boundary, or observable compatibility output changed.
- `BINDING_DIFF`: the diff adds, removes, renames, rebinds, exports, hides, moves, registers, reroutes, or changes the signature of a public or integration binding.
- `OBSERVABLE_DIFF`: the diff adds or changes logs, warnings, notifications, exception identity or cause, sentinel or fallback values, partial output, callbacks, events, or externally visible mutation.
- `FRAMEWORK_DIFF`: the diff changes behavior observed through a framework, wrapper, serializer, parser, middleware, renderer, provider, registry, or generated consumer.

A diff may have multiple triggers. Record concrete changed lines or artifacts for every activated trigger. Ordinary `LOCAL_DIFF` work must not inherit binding, side-effect, lifecycle, or pristine-replay matrices merely as precaution.

## 4. Triggered Compatibility Evidence

For `BINDING_DIFF`, record the concrete contract supported by normative text or an existing consumer: owner or receiver, import path, spelling, visibility, parameters, defaults, returns, and integration entry. Execute that exact call, compile, lookup, route, registration, or framework entry. A module-level signature or source-name search cannot substitute for the real consumer call form.

For `OBSERVABLE_DIFF`, observe the compatibility tuple relevant to the changed line: return or sentinel, output, exception identity and cause, logs or warnings, notification or callback, partial mutation, and required silence. A newly emitted diagnostic is not positive evidence unless the requirement or an existing consumer requires it.

For `FRAMEWORK_DIFF`, exercise the nearest existing consumer through that framework boundary. A direct helper probe is insufficient when the framework can change coercion, propagation, identity, state, or output.

These probes are mandatory only when their trigger is present in the final production diff.

## 5. Verification Selection

- Every production patch receives the narrowest affected check that exercises its primary behavior.
- When a public or framework boundary is touched, also run the nearest existing consumer check covering that boundary.
- A `BINDING_DIFF` exact-consumer probe may serve as the nearest consumer check when it exercises the same real consumer path.
- Worker-authored or modified tests may guide implementation but cannot be the sole proof of behavior they encode.
- Do not require exhaustive suites. An authoritative verification supplied by the runtime remains dominant when available.
- A current-fingerprint failed check blocks its subjects. Classify it as pre-existing only with a matching clean-base observation and relevant failure signature.

## 6. Bounded Falsification

The planner or reviewer selects at most two high-impact falsifiers per round. Each must be derived from the current diff, a failed observation, or an unresolved required contract and must state:

`F-* | Subjects | Trigger | Probe | Predicted Observation | Worker-Closeable`

Prefer a decisive exact consumer, observable-compatibility, nearest-consumer, or narrow affected probe. Do not enumerate every oracle family. Narrative uncertainty, a generic desire for confidence, and repeated settled checks are not falsifiers.

## 7. Patch-Scope Circuit Breaker

Track the last coherent patch fingerprint, its changed subsystems, and the checks it passed. Before entering a new subsystem or materially growing the production patch, record:

`SC-* | Current Failing Observation | Causal Hypothesis | Proposed New Surface | Predicted Post-Change Result | Subjects`

Expansion is admitted only when the failing observation is concrete on the current fingerprint and the predicted result explains how the new surface will close it. Without that record, do not expand; remove speculative current-round expansion and return to the last coherent patch. Preserve pre-existing workspace changes. A reviewer rejects ungrounded expansion even when its code appears plausible.

## 8. Convergence and Process Artifacts

- One round implements one coherent objective and reserves attention for its selected checks and compact handoff.
- At most one no-source-mutation evidence-closure round may occur for an unchanged fingerprint, and it must execute a previously missing selected probe.
- No-mutation review or finalize contracts may be embedded in an existing summary, Evidence Closure Request, or gate artifact. A missing standalone process file cannot force a continuation.
- A continuation names no more than two selected falsifiers and cannot be justified by status restatement, cosmetic edits, or speculative scope growth.
- Finalize is a no-mutation reconciliation pass. It may reconcile existing state but cannot admit or reopen evidence, execute a new proof campaign, request a source change, or create a process-only continuation.

## 9. Durable Reviewer Snapshot

Every review emits one complete current snapshot, not a delta. Under `### Status Delta`, place exactly one fenced JSON object with these keys:

- `role`, exactly `reviewer_confirmed`;
- `ac`, containing every actual AC ID exactly once with one allowed AC status;
- `tasks`, containing every actual task ID exactly once with one allowed task status;
- `approved`, a complete JSON array of stable approved evidence or update IDs for the current fingerprint;
- `rejected`, a complete JSON array of stable rejected evidence or update IDs for the current fingerprint.

Use empty arrays when appropriate. Do not use placeholder IDs, comments, ellipses, compressed ranges, synonyms, or a partial snapshot.

## 10. Completion Gate and Terminal Review

`PACT_COMPLETE` is valid only when every required AC is `met`, every active required task is `complete`, every BO has one terminal proof status with admitted concrete evidence, all activated diff triggers are closed, the narrow affected check passed, every triggered nearest-consumer or exact-binding check passed, no decisive current-fingerprint failure remains, patch expansion satisfies the circuit breaker, and the snapshot matches the final fingerprint.

A terminal review uses these exact headings in this order:

1. `### Behavioral Contract Audit`
2. `### Base-Equivalence Proof Audit`
3. `### Status Delta`
4. `### Complete Decision Evidence`

Under `### Behavioral Contract Audit`, spell out every actual `BO-*` ID individually. Give each exactly one terminal proof status and cite concrete admitted evidence. Never compress a range or group multiple BO IDs into one row.

Under `### Base-Equivalence Proof Audit`, spell out each `BO-*` using `PROVEN_BASE_EQUIVALENT` and its concrete comparison evidence. If none has that status, state that explicitly; the Behavioral Contract Audit must still enumerate every BO individually.

`### Status Delta` must be followed immediately by the single fenced JSON snapshot. Under `### Complete Decision Evidence`, reconcile the final fingerprint, activated triggers, selected checks, patch scope, approvals, and rejections without opening new work.

Only a terminal review may emit `PACT_COMPLETE`, and it must be the final non-empty line.
