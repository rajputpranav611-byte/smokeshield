import { FireObservation, WeatherObservation, AirQualityObservation } from "@/types/domain";
import { ProviderResult, fetchWithTimeout } from "./client";
import { getBoundingBox } from "./geo";
import { normalizeFirmsData, normalizeWeatherData, RawFirmsData, RawWeatherData } from "../normalization";

export interface FireDataProvider {
  getFires(schoolLat: number, schoolLon: number, radiusKm: number, now: string): Promise<ProviderResult<FireObservation[]>>;
}

export interface WeatherDataProvider {
  getWeather(lat: number, lon: number, now: string): Promise<ProviderResult<WeatherObservation>>;
}

export interface AirQualityDataProvider {
  getAirQuality(lat: number, lon: number, now: string): Promise<ProviderResult<AirQualityObservation>>;
}

export class FirmsProvider implements FireDataProvider {
  async getFires(schoolLat: number, schoolLon: number, radiusKm: number, now: string): Promise<ProviderResult<FireObservation[]>> {
    const mapKey = process.env.FIRMS_MAP_KEY;
    if (!mapKey) {
      return { ok: false, status: "ERROR", message: "FIRMS_MAP_KEY is missing" };
    }

    const bbox = getBoundingBox(schoolLat, schoolLon, radiusKm);
    // Use VIIRS_NOAA21_NRT
    const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${mapKey}/VIIRS_NOAA21_NRT/${bbox.minLon},${bbox.minLat},${bbox.maxLon},${bbox.maxLat}/1`;

    try {
      const res = await fetchWithTimeout(url);
      if (!res.ok) {
        return { ok: false, status: "DATA_GAP", message: `FIRMS API returned ${res.status}` };
      }
      
      const text = await res.text();
      // Basic CSV parsing
      const lines = text.trim().split("\n");
      if (lines.length < 2) return { ok: true, data: [] }; // No fires or just header
      
      const headers = lines[0].split(",");
      const data: FireObservation[] = [];
      const receivedAt = now;

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(",");
        const raw: RawFirmsData = {
          latitude: parseFloat(parts[headers.indexOf("latitude")]),
          longitude: parseFloat(parts[headers.indexOf("longitude")]),
          acq_date: parts[headers.indexOf("acq_date")],
          acq_time: parts[headers.indexOf("acq_time")].padStart(4, "0"),
          confidence: parts.includes("confidence") ? parseFloat(parts[headers.indexOf("confidence")]) : 50,
          instrument: parts[headers.indexOf("instrument")] || "VIIRS"
        };
        data.push(normalizeFirmsData(raw, { receivedAt, now }));
      }
      
      return { ok: true, data };
    } catch (e: unknown) {
      const error = e as Error;
      return { ok: false, status: "DATA_GAP", message: error.message || "Unknown error" };
    }
  }
}

export class OpenMeteoProvider implements WeatherDataProvider {
  async getWeather(lat: number, lon: number, now: string): Promise<ProviderResult<WeatherObservation>> {
    // Open-Meteo is free for non-commercial use, no API key required for this endpoint.
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=wind_speed_10m,wind_direction_10m,temperature_2m,relative_humidity_2m&forecast_days=1&wind_speed_unit=kmh&timezone=UTC`;
    
    try {
      const res = await fetchWithTimeout(url);
      if (!res.ok) {
        return { ok: false, status: "DATA_GAP", message: `Weather API returned ${res.status}` };
      }
      const json = await res.json();
      
      if (!json || !json.hourly || !json.hourly.time || json.hourly.time.length === 0) {
        return { ok: false, status: "DATA_GAP", message: "Malformed weather response" };
      }

      // Find the closest hourly reading to `now`
      const targetTime = new Date(now).getTime();
      let bestIdx = 0;
      let minDiff = Infinity;
      
      for (let i = 0; i < json.hourly.time.length; i++) {
        // Open-Meteo returns time like "2026-10-08T12:00" in UTC if timezone=UTC
        const obsTime = new Date(json.hourly.time[i] + "Z").getTime();
        const diff = Math.abs(obsTime - targetTime);
        if (diff < minDiff) {
          minDiff = diff;
          bestIdx = i;
        }
      }

      const windSpeed = json.hourly.wind_speed_10m[bestIdx];
      const windDirection = json.hourly.wind_direction_10m[bestIdx];
      
      if (windSpeed === null || windDirection === null || windSpeed === undefined || windDirection === undefined) {
         return { ok: false, status: "DATA_GAP", message: "Missing wind data in response" };
      }

      const raw: RawWeatherData = {
        time: json.hourly.time[bestIdx],
        wind_speed_10m: windSpeed,
        wind_direction_10m: windDirection,
        temperature_2m: json.hourly.temperature_2m?.[bestIdx] ?? undefined,
        relative_humidity_2m: json.hourly.relative_humidity_2m?.[bestIdx] ?? undefined,
      };

      const data = normalizeWeatherData(raw, { receivedAt: now, now });
      return { ok: true, data };
    } catch (e: unknown) {
      const error = e as Error;
      return { ok: false, status: "DATA_GAP", message: error.message || "Unknown error" };
    }
  }
}
