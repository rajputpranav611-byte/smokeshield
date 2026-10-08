# SmokeShield Agent Rules

## Product

SmokeShield is an environmental operations system for schools.

Core loop:
OBSERVE → FORECAST → PLAN → APPROVAL → MORNING VERIFY → ACT → VERIFY OUTCOME

## Source of truth

Read:

- DESIGN.md
- docs/PROJECT_CONTEXT.md
- ARCHITECTURE.md
- DECISIONS.md

before making architectural changes.

## Engineering rules

- TypeScript frontend.
- Python backend/risk engine where useful.
- Keep domain logic separate from UI.
- No fake live data claims.
- Label simulation/historical replay data.
- Never invent scientific accuracy.
- Never fabricate AQI/fire/weather values.
- Never claim regulatory certification unless actually implemented.
- LLMs may explain/reason/orchestrate but must not invent environmental observations.
- Risk calculations are deterministic and inspectable.
- Cedar authorizes consequential actions; it does not calculate risk.
- Every recommendation must be traceable to evidence.
- Data freshness must be visible.

## UI rules

- Follow DESIGN.md.
- Reuse components.
- Do not redesign existing screens unless explicitly requested.
- Do not add unnecessary cards/charts.
- Keep PlanGuard visually important.

## Git rules

- Work only on assigned branch.
- Run tests/build/lint before commit.
- Never rewrite git history.
- Never force push.
- Never delete another feature's work.
- Commit working milestones frequently.

## Hackathon rule

The implementation must be created during the hackathon period.
Pre-event designs are reference material only.
Do not import old implementation code.
