# SmokeShield Risk Model

## Overview
SmokeShield uses a deterministic calculation model rather than a black-box AI score. The goal is to compute the **Potential Smoke-Influence Window** over a specific school or facility based on observed evidence.

## Constraints & Requirements
- **No fabricated data**: The system must never claim "live smoke plume measurement" if it's only extrapolating from fire + wind.
- **Traceability**: Every generated `RiskAssessment` must contain `evidenceIds` pointing to the exact `FireObservation` and `WeatherObservation` used.
- **Confidence**: `confidenceScore` is a strict numeric field (0.0 to 1.0) derived mathematically from data freshness, sensor distance, and conflicting evidence. Do NOT use string enums like "High" or "Medium" natively in the domain contracts.
- **Simulation**: The `isSimulation` boolean must be explicitly set on any `RiskAssessment` generated during replay or what-if planning.

## Core Formula Concepts
1. **Directional Influence**: Calculated when fire locations (`latitude`, `longitude`) via `FireObservation` and valid wind data (`windDirection` and `windSpeed`) confirm the school is downwind of the fire.
2. **Proximity-Only Signal**: When wind data is missing or stale, a radial proximity fallback is used. This implies the school is near a fire, but directional influence cannot be established. This is a low-confidence precautionary signal and MUST NOT be presented as a confident directional forecast.
3. **Outdoor Overlap**: Calculated by intersecting the Potential Smoke-Influence Window strictly with activities marked `OUTDOOR`.
4. **Indoor Activities**: Activities marked `INDOOR` are *not* evaluated by this model for smoke overlap. The model flags them as `NOT_EVALUATED_FOR_OUTDOOR_CORRIDOR`. The model does not make any HVAC or indoor air quality safety claims.

## Confidence Meaning
Confidence (`confidenceScore`) is a strict numeric field (0.0 to 1.0) derived mathematically from data freshness, sensor distance, and conflicting evidence. It represents **evidence quality and model consistency, NOT the probability of human exposure**. Stale or missing wind data reduces confidence substantially.
