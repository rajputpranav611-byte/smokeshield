import { FireObservation, WeatherObservation, AirQualityObservation, ObservationStatus } from "@/types/domain";

export interface RawFirmsData {
  acq_date: string;
  acq_time: string;
  latitude: number;
  longitude: number;
  confidence: number;
  instrument: string;
}

export interface NormalizationOptions {
  receivedAt: string;
  now: string;
}

export function normalizeFirmsData(raw: RawFirmsData, options: NormalizationOptions): FireObservation {
  const observedAt = new Date(`${raw.acq_date}T${raw.acq_time.substring(0,2)}:${raw.acq_time.substring(2,4)}:00Z`).toISOString();
  
  const ageMs = new Date(options.now).getTime() - new Date(observedAt).getTime();
  let status: ObservationStatus = "ACTIVE";
  if (ageMs > 24 * 3600 * 1000) status = "STALE";

  return {
    id: `firms-${raw.latitude}-${raw.longitude}-${raw.acq_date}`,
    fireDetectionId: `firms-${raw.latitude}-${raw.longitude}`,
    latitude: raw.latitude,
    longitude: raw.longitude,
    observedAt,
    confidence: raw.confidence,
    source: `FIRMS-${raw.instrument}`,
    status
  };
}

export interface RawWeatherData {
  time: string;
  wind_speed_10m: number;
  wind_direction_10m: number;
  temperature_2m?: number;
  relative_humidity_2m?: number;
}

export function normalizeWeatherData(raw: RawWeatherData, options: NormalizationOptions): WeatherObservation {
  const timeStr = raw.time.endsWith("Z") ? raw.time : raw.time + "Z";
  const observedAt = new Date(timeStr).toISOString();
  const freshnessMinutes = Math.max(0, Math.floor((new Date(options.now).getTime() - new Date(observedAt).getTime()) / 60000));
  
  let status: ObservationStatus = "ACTIVE";
  if (freshnessMinutes > 60) status = "STALE";

  return {
    id: `weather-${raw.time}`,
    observedAt,
    windSpeed: raw.wind_speed_10m, // Open-Meteo provides km/h by default, which aligns with domain
    windDirection: raw.wind_direction_10m,
    temperature: raw.temperature_2m ?? 0,
    humidity: raw.relative_humidity_2m,
    source: "OPEN_METEO",
    freshnessMinutes,
    status
  };
}

export interface RawAQIData {
  timestamp: number;
  pm25: number;
  aqi: number;
}

export function normalizeAQIData(raw: RawAQIData, options: NormalizationOptions): AirQualityObservation {
  const observedAt = new Date(raw.timestamp * 1000).toISOString();
  const freshnessMinutes = Math.max(0, Math.floor((new Date(options.now).getTime() - new Date(observedAt).getTime()) / 60000));
  
  let status: ObservationStatus = "ACTIVE";
  if (freshnessMinutes > 120) status = "STALE";

  return {
    id: `aqi-${raw.timestamp}`,
    observedAt,
    pm25: raw.pm25,
    aqi: raw.aqi,
    source: "CPCB",
    freshnessMinutes,
    status
  };
}
