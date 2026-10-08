# SmokeShield Data Sources

## Telemetry Sources

### 1. Fire Detections
**Source**: NASA FIRMS (or simulated equivalent).
- Provides active thermal anomalies.
- Mapped to `FireObservation` contract.
- Includes `confidence` only if the source explicitly provided it.

### 2. Weather & Wind
**Source**: IMD (Indian Meteorological Department) or OpenWeather.
- Provides `windSpeed`, `windDirection`, and `temperature`.
- Mapped to `WeatherObservation` contract.
- Must include `freshnessMinutes` based on `observedAt` vs `receivedAt`.

### 3. Air Quality
**Source**: CPCB (Central Pollution Control Board) or OGD.
- Provides `PM2.5` and `AQI`.
- Mapped to `AirQualityObservation`.
- Highly susceptible to data gaps. When missing, `status` becomes `STALE` or `MISSING`.

## Handling Data Gaps & Stale Data
All observations implement `ObservationStatus` (`ACTIVE | STALE | MISSING | ERROR | CONFLICT`). 
If critical data is `STALE` or `MISSING`, the Risk Assessment's `confidenceScore` must be penalized. A plan verification in this state defaults to `DATA_GAP`.
