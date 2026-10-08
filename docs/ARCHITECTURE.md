# SmokeShield Architecture

## Data Flow

Frontend
→ Assessment API
→ Assessment Service
→ Orchestrator
→ Risk Engine
→ Recommendation

- **Assessment API**: Exposes the assessment service via an HTTP endpoint. It acts solely as a transport and validation boundary (JSON parsing, basic checks, 400/404/500 error mapping) and contains no risk-engine or provider business logic. It seamlessly formats responses while ensuring secrets remain server-side.
- **Providers**: Adapters for external APIs (e.g. FIRMS, Open-Meteo).
- **Normalization**: Adapts provider-specific JSON/CSV into strict domain objects (`FireObservation`, `WeatherObservation`, `AirQualityObservation`). This ensures the Risk Engine remains ignorant of API-specific quirks.
- **Orchestrator**: Gathers evidence from all providers into an `EnvironmentalEvidenceBundle`.
- **Assessment Service**: Coordinates the use case. It orchestrates obtaining evidence from the Orchestrator, executing the deterministic Risk Engine, and tying it together into a single cohesive, traceable `EnvironmentalAssessment` result.
- **Risk Engine**: Performs deterministic calculations (calculates bounding boxes, trajectories, temporal overlaps). No LLMs, no network calls. Generates a `RiskAssessment` and a `Recommendation`.
- **Recommendation**: Advisory output. This is not automatic authorization.

## Failure & Data Gap Handling

The orchestration and assessment layers are designed to fail gracefully and preserve context.
A failure from a specific provider (e.g., FIRMS timeout) will be recorded as a `DATA_GAP` within the `providerStatuses` layer of the assessment.
The assessment service does NOT fabricate observations or unilaterally invent risk. Instead, it passes the available evidence to the Risk Engine, which issues a recommendation based on what it CAN determine, clearly labeling the confidence penalty and any corresponding factors.

## Replay System & Determinism

SmokeShield features a fully deterministic replay system that guarantees identical assessment outputs for the same replay scenario and reference time. 

- Wall-clock dependencies (`Date.now()`) are strictly isolated to the entry point (the Orchestrator). 
- All domain logic (Assessment Service, Risk Engine, Normalizers) relies on explicitly injected `referenceTime` values.
- In `REPLAY` mode, the Orchestrator intercepts requests and loads deterministic JSON fixtures, allowing tests and the UI to simulate environmental scenarios predictably without triggering network requests.
