{{defaultPrompt}}

Review kind: {{reviewKind}}
Round: {{round}} {{roundName}}
Loop directory: {{loopDir}}

Plan path: {{planPath}}
Todo path: {{todoPath}}
Goal tracker path: {{goalTrackerPath}}
Eval patch path: {{evalPatchPath}}
Patch artifact path: {{patchArtifactPath}}
Verification path: {{verificationPath}}
Summary path: {{summaryPath}}
Summary status: {{summaryStatus}}
Summary:
{{summary}}

Contract path: {{contractPath}}
Contract status: {{contractStatus}}
Contract:
{{contract}}

Spec evidence references:
{{specEvidenceReferences}}

Goal tracker schema:
{{goalTrackerSchema}}

Audit the worker artifact-first. Compare worker claims against the patch, verification, contract, summary, plan, todo, goal tracker, and spec evidence. Do not reward plausible explanations that are not supported by artifacts.

Review requirements:
- Check whether each claimed root cause has direct evidence.
- Check whether each predicted impact follows from the patch and verification.
- Check whether risks are named when evidence is incomplete or ambiguous.
- Check whether any acceptance criterion status changed without artifact support.
- Check whether the summary's Evidence Ledger Update is specific enough for next-round attribution.

Write a Status Delta only when evidence supports it. For every status change, cite the artifact type and observed fact. If the patch may help but evidence is missing, leave the status unchanged and name the missing verification. Preserve unresolved predictions and risks for the next round.
