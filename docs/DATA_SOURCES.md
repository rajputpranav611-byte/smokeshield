## Data Ingestion & Provider Abstraction
To ensure the Risk Engine remains deterministic and pure, external/live providers are abstracted:
1. **Provider Adapters**: Functions that call external APIs (e.g. `FireDataProvider`, `WeatherDataProvider`, `AirQualityDataProvider`).
2. **Normalized Observation Boundary**: Provider-specific response shapes (e.g., FIRMS MODIS payload, Open-Meteo JSON) are isolated. They are transformed using normalizers (like `normalizeFirmsData`) into strictly typed domain contracts (`FireObservation`, `WeatherObservation`, `AirQualityObservation`). 
3. **Risk Engine**: The engine itself only accepts the normalized domain objects. It has no knowledge of provider-specific formats or API constraints.

## Telemetry Sources

### 1. Fire Detections (NASA FIRMS)
**Source**: NASA FIRMS (VIIRS_NOAA21_NRT or VIIRS_NOAA20_NRT).
- **Role**: Provides active thermal anomalies via `FireDataProvider`.
- **API Boundary**: Bounding box queries are generated around the school's location.
- **Requirement**: A valid `FIRMS_MAP_KEY` is required in the environment.
- **Limitations**: The bounding box assumes perfect spherical geometries, and the product data might be delayed.
- **Failure Behavior**: If the API fails or times out, it returns a `DATA_GAP` status. It will **never** fabricate records or return an empty array on an HTTP error.

### 2. Weather & Wind (Open-Meteo)
**Source**: Open-Meteo API.
- **Role**: Provides current `windSpeed` and `windDirection` via `WeatherDataProvider`.
- **Endpoint**: `https://api.open-meteo.com/v1/forecast`
- **Fields**: Uses `wind_speed_10m` (km/h) and `wind_direction_10m` from the hourly forecast array.
- **Requirement**: No API key is required (free for non-commercial usage). Adheres to standard rate limits (10,000 requests per day).
- **Nature**: Values represent short-term forecast/model data, which is parsed to find the nearest hour to the current check.
- **Failure Behavior**: Returns `DATA_GAP` if the API fails, times out, or returns a response missing critical wind variables.

### 3. Air Quality
**Source**: CPCB (Central Pollution Control Board) or OGD.
- **Note**: Air-quality provider remains pluggable and is not connected until a verified accessible source contract is available.
- **Role**: Will provide `PM2.5` and `AQI` via `AirQualityDataProvider`.
- Highly susceptible to data gaps. When missing, `status` becomes `STALE` or `MISSING`.

## Handling Data Gaps & Stale Data
All observations implement `ObservationStatus` (`ACTIVE | STALE | MISSING | ERROR | CONFLICT`). 
If critical data is `STALE` or `MISSING`, the Risk Assessment's `confidenceScore` must be penalized. A plan verification in this state defaults to `DATA_GAP`. Data freshness determines this automatically during normalization.

## Live vs Replay Distinction
Replay fixtures utilize the exact same normalized observation boundary as live data. The `isSimulation: boolean` flag is strictly enforced on the ReplayScenario and is carried forward into the resulting Risk Assessment to ensure simulated data never pollutes live event logs or is misrepresented as real-world exposure.
