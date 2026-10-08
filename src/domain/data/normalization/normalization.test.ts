import { describe, it, expect } from "vitest";
import { normalizeFirmsData, normalizeWeatherData, normalizeAQIData } from "./index";

describe("Data Normalization", () => {
  const receivedAt = "2026-10-08T12:00:00Z";

  it("normalizes FIRMS data correctly", () => {
    const raw = {
      acq_date: "2026-10-08",
      acq_time: "1000",
      latitude: 1.0,
      longitude: 2.0,
      confidence: 85,
      instrument: "MODIS"
    };
    const obs = normalizeFirmsData(raw, receivedAt);
    expect(obs.latitude).toBe(1.0);
    expect(obs.status).toBe("ACTIVE");
    expect(obs.observedAt).toBe("2026-10-08T10:00:00.000Z");
  });

  it("marks old FIRMS data as STALE", () => {
    const raw = {
      acq_date: "2026-10-05", // 3 days ago
      acq_time: "1000",
      latitude: 1.0,
      longitude: 2.0,
      confidence: 85,
      instrument: "MODIS"
    };
    const obs = normalizeFirmsData(raw, receivedAt);
    expect(obs.status).toBe("STALE");
  });

  it("normalizes Weather data correctly", () => {
    const ts = new Date("2026-10-08T11:50:00Z").getTime() / 1000;
    const raw = {
      dt: ts,
      wind: { speed: 5, deg: 180 },
      main: { temp: 22, humidity: 40 }
    };
    const obs = normalizeWeatherData(raw, receivedAt);
    expect(obs.windSpeed).toBe(18); // 5 m/s * 3.6
    expect(obs.status).toBe("ACTIVE");
    expect(obs.freshnessMinutes).toBe(10);
  });

  it("normalizes AQI data correctly", () => {
    const ts = new Date("2026-10-08T09:50:00Z").getTime() / 1000;
    const raw = { timestamp: ts, pm25: 15, aqi: 50 };
    const obs = normalizeAQIData(raw, receivedAt);
    expect(obs.aqi).toBe(50);
    expect(obs.status).toBe("STALE"); // > 120 mins
  });
});
