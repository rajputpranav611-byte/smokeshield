import { FireObservation, WeatherObservation, AirQualityObservation, ObservationStatus } from "@/types/domain";

export interface RawFirmsData {
  acq_date: string;
  acq_time: string;
  latitude: number;
  longitude: number;
  confidence: number;
  instrument: string;
}

export function normalizeFirmsData(raw: RawFirmsData, receivedAt: string): FireObservation {
  const observedAt = new Date(`${raw.acq_date}T${raw.acq_time.substring(0,2)}:${raw.acq_time.substring(2,4)}:00Z`).toISOString();
  
  const ageMs = new Date(receivedAt).getTime() - new Date(observedAt).getTime();
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
  dt: number;
  wind: { speed: number; deg: number };
  main: { temp: number; humidity: number };
}

export function normalizeWeatherData(raw: RawWeatherData, receivedAt: string): WeatherObservation {
  const observedAt = new Date(raw.dt * 1000).toISOString();
  const freshnessMinutes = Math.max(0, Math.floor((new Date(receivedAt).getTime() - new Date(observedAt).getTime()) / 60000));
  
  let status: ObservationStatus = "ACTIVE";
  if (freshnessMinutes > 60) status = "STALE";

  return {
    id: `weather-${raw.dt}`,
    observedAt,
    windSpeed: raw.wind.speed * 3.6, // m/s to km/h
    windDirection: raw.wind.deg,
    temperature: raw.main.temp,
    humidity: raw.main.humidity,
    source: "OPENWEATHER",
    freshnessMinutes,
    status
  };
}

export interface RawAQIData {
  timestamp: number;
  pm25: number;
  aqi: number;
}

export function normalizeAQIData(raw: RawAQIData, receivedAt: string): AirQualityObservation {
  const observedAt = new Date(raw.timestamp * 1000).toISOString();
  const freshnessMinutes = Math.max(0, Math.floor((new Date(receivedAt).getTime() - new Date(observedAt).getTime()) / 60000));
  
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
