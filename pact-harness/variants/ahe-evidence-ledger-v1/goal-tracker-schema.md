# Goal Tracker Schema: Evidence Ledger Variant

Keep entries compact and artifact-backed. The tracker should make it possible to explain why a status changed and what evidence could falsify it next round.

## Evidence Ledger

Record concrete observations only.

Format:
- ID: short stable label.
- Source: spec, code, patch, verification, contract, summary, review, or feedback.
- Observation: what was directly seen.
- Supports: hypothesis, acceptance criterion, task, prediction, or risk.
- Confidence: high, medium, or low.

## Root Cause Hypotheses

Each hypothesis must be falsifiable.

Format:
- ID.
- Claim.
- Evidence.
- Expected patch effect.
- Falsifier: what result would prove this is wrong or incomplete.
- Status: proposed, supported, weakened, falsified, resolved.

## Predicted Impact

Track expected case or acceptance-criterion movement before the next review.

Format:
- Prediction.
- Target case or AC.
- Required evidence.
- Result: pending, confirmed, falsified, unresolved.

## Risk Ledger

Name risks before they become review findings.

Format:
- Risk.
- Affected case or behavior.
- Evidence gap.
- Mitigation or next check.
- Status: open, reduced, closed, accepted.

## Attribution Notes

Explain why observed movement should be attributed to a change.

Format:
- Change.
- Linked evidence.
- Linked prediction.
- Alternative explanation.
- Next-round attribution check.

## AC and Task Status Vocabulary

Acceptance criteria:
- pending: not attempted or no evidence yet.
- in_progress: patch or investigation exists but evidence is incomplete.
- satisfied: artifact evidence shows the criterion is met.
- blocked: cannot proceed without a named missing artifact or dependency.
- rejected: evidence shows the criterion is invalid or superseded.

Tasks:
- todo: not started.
- doing: active in current round.
- done: completed with evidence.
- deferred: intentionally postponed with reason.
- invalidated: no longer applicable due to falsified hypothesis.
