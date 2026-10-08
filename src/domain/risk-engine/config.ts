export const RISK_CONFIG = {
  MAX_INFLUENCE_DISTANCE_KM: 50,
  DIRECTIONAL_TOLERANCE_DEGREES: 45, // Wind must be blowing towards school within 45 degrees
  DEFAULT_WIND_SPEED_KMH: 10,
  MINIMUM_WIND_SPEED_KMH: 2, // Below this, dispersion is highly localized (360 degrees)
  INFLUENCE_WINDOW_DURATION_MINUTES: 120, // Estimated duration of smoke influence per event
  STALE_DATA_THRESHOLD_MINUTES: 60, // Data older than 60 minutes is stale
};
