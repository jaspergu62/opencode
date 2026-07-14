{{defaultPrompt}}

Review kind: {{reviewKind}}
Round {{round}} {{roundName}}
Loop: {{loopDir}}
Plan: {{planPath}}
Todo: {{todoPath}}
Tracker: {{goalTrackerPath}}
Eval patch: {{evalPatchPath}}
Patch artifact: {{patchArtifactPath}}
Verification: {{verificationPath}}
Summary: {{summaryPath}}
Contract: {{contractPath}}

Summary status: {{summaryStatus}}
{{summary}}

Contract status: {{contractStatus}}
{{contract}}

Spec evidence:
{{specEvidenceReferences}}

Tracker schema:
{{goalTrackerSchema}}

Independently review alignment. Compare original plan, tracker, summary, contract, patch, verification, and spec evidence.

Accept completion only when every AC and behavior obligation is proven or evidence-backed non-applicable. Deferred items remain incomplete. Flag any harness artifact changes in the solution patch. If feedback is repeating or progress stalled, direct the next worker to one smaller verifiable target.
