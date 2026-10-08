# SmokeShield Risk Model

## Overview
SmokeShield uses a deterministic calculation model rather than a black-box AI score. The goal is to compute the **Potential Smoke-Influence Window** over a specific school or facility based on observed evidence.

## Constraints & Requirements
- **No fabricated data**: The system must never claim "live smoke plume measurement" if it's only extrapolating from fire + wind.
- **Traceability**: Every generated `RiskAssessment` must contain `evidenceIds` pointing to the exact `FireObservation` and `WeatherObservation` used.
- **Confidence**: `confidenceScore` is a strict numeric field (0.0 to 1.0) derived mathematically from data freshness, sensor distance, and conflicting evidence. Do NOT use string enums like "High" or "Medium" natively in the domain contracts.
- **Simulation**: The `isSimulation` boolean must be explicitly set on any `RiskAssessment` generated during replay or what-if planning.

## Core Formula Concepts (Implementation Pending)
1. Determine fire locations (`latitude`, `longitude`) via `FireObservation`.
2. Determine `windDirection` and `windSpeed` via `WeatherObservation`.
3. Extrapolate the *Potential Smoke-Influence Corridor*.
4. Calculate `overlapMinutes` by intersecting the school's location and active scheduled `OperationalPlan`.
