# Replay Scenarios Architecture

SmokeShield uses a deterministic replay fixture architecture. Replay scenarios feed directly into the exact same Risk Engine pipeline as live normalized data. 

**Simulation Flag**: Every scenario MUST explicitly enforce `isSimulation=true` to prevent simulated inputs from appearing as real-world events.

## SCENARIO 1 — Baseline Overlap
- **Purpose**: Validate baseline operational conflict.
- **Input conditions**: Active fire evidence, usable wind pushing towards school, outdoor assembly scheduled.
- **Expected decision behavior**: Action escalates to `REVIEW_PLAN` due to `DIRECTIONAL_ALIGNMENT`.
- **Demo Shows**: How the engine determines downwind overlap with an outdoor activity.

## SCENARIO 2 — Wind Shift
- **Purpose**: Validate directional meteorology rules.
- **Input conditions**: Identical fire and schedule to Scenario 1, but wind direction reversed.
- **Expected decision behavior**: Action defaults to `NO_CHANGE`.
- **Demo Shows**: The engine does not penalize schools upwind of fires.

## SCENARIO 3 — Stale Morning Evidence
- **Purpose**: Validate data quality penalization.
- **Input conditions**: Nearby fire, but weather observation is 90 minutes old.
- **Expected decision behavior**: Returns a lower confidence score and logs `STALE_WEATHER`.
- **Demo Shows**: The system refuses to confidently claim directional safety when wind is stale.

## SCENARIO 4 — Air-Quality Conflict
- **Purpose**: Validate corroboration vs. conflict logic.
- **Input conditions**: Directional signal suggests concern, but local AQI sensor reads perfectly clear (AQI 20).
- **Expected decision behavior**: Flags `AQ_CONFLICT` and reduces confidence.
- **Demo Shows**: How the system avoids forcing a recommendation when primary models and ground truth disagree.

## SCENARIO 5 — Multiple Fires
- **Purpose**: Validate array-based observation processing.
- **Input conditions**: Multiple active fires within influence radius.
- **Expected decision behavior**: Outputs `REVIEW_PLAN` and preserves all fire evidence IDs in the assessment.
- **Demo Shows**: Scalability across concurrent wildfire events.

## SCENARIO 6 — PlanGuard Escalation
- **Purpose**: Validate morning snapshot deterioration.
- **Input conditions**: Strong AQI corroboration + active fire + outdoor PE overlapping.
- **Expected decision behavior**: Triggers `REVIEW_PLAN` and logs `AQ_CORROBORATION`.
- **Demo Shows**: How an approved evening plan gets automatically flagged the next morning if conditions worsen.

## SCENARIO 7 — Improved Morning Conditions
- **Purpose**: Validate manual relaxation rule constraint.
- **Input conditions**: Clear conditions after a previous risk assessment.
- **Expected decision behavior**: Outputs `NO_CHANGE`.
- **Demo Shows**: While the *engine* computes `NO_CHANGE`, the overall *system* (outside this module) must not silently auto-relax a previously escalated precaution without human verification.
