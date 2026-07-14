{{defaultPrompt}}

## Harness Overlay: Reference-Port Review Phase Workflow

Use review-phase work only to resolve correctness, regression, or patch-quality findings already surfaced by implementation review.

Rules:
- If the finding concerns parser or file-format behavior, repair it through the Reference Parity Ledger.
- Prefer adding or correcting committed fixtures, direct unittest probes, or documented reference comparisons over adding another local smoke test.
- Do not broaden scope beyond the missing parity row unless the row exposes a required implementation surface.
- Keep valid fixture acceptance, invalid fixture rejection, exact errors and locations, invalid `parse_float` returns, datetime/date wrapping, and `TOMLDecodeError` constructor/module behavior as completion blockers for TOML/parser work.
- Summaries must distinguish fixed review findings from residual optional risk.

## Goal Tracker Schema Overlay
{{goalTrackerSchema}}
