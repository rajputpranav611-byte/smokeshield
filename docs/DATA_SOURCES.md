## Data Ingestion & Provider Abstraction
To ensure the Risk Engine remains deterministic and pure, external/live providers are abstracted:
1. **Provider Adapters**: Functions that call external APIs (e.g. `FireDataProvider`, `WeatherDataProvider`, `AirQualityDataProvider`).
2. **Normalized Observation Boundary**: Provider-specific response shapes (e.g., FIRMS MODIS payload, OpenWeather JSON) are isolated. They are transformed using normalizers (like `normalizeFirmsData`) into strictly typed domain contracts (`FireObservation`, `WeatherObservation`, `AirQualityObservation`). 
3. **Risk Engine**: The engine itself only accepts the normalized domain objects. It has no knowledge of provider-specific formats or API constraints.

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
If critical data is `STALE` or `MISSING`, the Risk Assessment's `confidenceScore` must be penalized. A plan verification in this state defaults to `DATA_GAP`. Data freshness determines this automatically during normalization.

## Live vs Replay Distinction
Replay fixtures utilize the exact same normalized observation boundary as live data. The `isSimulation: boolean` flag is strictly enforced on the ReplayScenario and is carried forward into the resulting Risk Assessment to ensure simulated data never pollutes live event logs or is misrepresented as real-world exposure.
