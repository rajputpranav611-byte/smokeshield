import { describe, it, expect, vi, beforeEach } from "vitest";
import { FirmsProvider, OpenMeteoProvider } from "./index";
import { getBoundingBox } from "./geo";

const nowStr = "2026-10-08T12:00:00Z";

describe("Geo Helper", () => {
  it("creates a bounding box", () => {
    const bbox = getBoundingBox(0, 0, 111);
    expect(bbox.minLat).toBeCloseTo(-1);
    expect(bbox.maxLat).toBeCloseTo(1);
    expect(bbox.minLon).toBeCloseTo(-1);
    expect(bbox.maxLon).toBeCloseTo(1);
  });
});

describe("FIRMS Provider", () => {
  const provider = new FirmsProvider();

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    process.env.FIRMS_MAP_KEY = "test_key";
  });

  it("handles missing MAP_KEY", async () => {
    delete process.env.FIRMS_MAP_KEY;
    const res = await provider.getFires(0, 0, 10, nowStr);
    expect(res.ok).toBe(false);
    expect(res.status).toBe("ERROR");
  });

  it("handles HTTP error", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 500 } as unknown as Response);
    const res = await provider.getFires(0, 0, 10, nowStr);
    expect(res.ok).toBe(false);
    expect(res.status).toBe("DATA_GAP");
  });

  it("handles empty CSV", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, text: async () => "latitude,longitude,acq_date,acq_time" } as unknown as Response);
    const res = await provider.getFires(0, 0, 10, nowStr);
    expect(res.ok).toBe(true);
    expect(res.data).toEqual([]);
  });

  it("parses valid CSV correctly", async () => {
    const csv = `latitude,longitude,acq_date,acq_time,confidence,instrument
10.0,20.0,2026-10-08,1000,90,VIIRS`;
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, text: async () => csv } as unknown as Response);
    const res = await provider.getFires(0, 0, 10, nowStr);
    expect(res.ok).toBe(true);
    expect(res.data?.length).toBe(1);
    expect(res.data![0].latitude).toBe(10.0);
  });
});

describe("OpenMeteo Provider", () => {
  const provider = new OpenMeteoProvider();

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("handles HTTP error", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 500 } as unknown as Response);
    const res = await provider.getWeather(0, 0, nowStr);
    expect(res.ok).toBe(false);
    expect(res.status).toBe("DATA_GAP");
  });

  it("handles malformed JSON (missing hourly)", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => ({ current: { temp: 20 } }) } as unknown as Response);
    const res = await provider.getWeather(0, 0, nowStr);
    expect(res.ok).toBe(false);
    expect(res.status).toBe("DATA_GAP");
  });

  it("handles missing wind in valid hourly array", async () => {
    const json = { hourly: { time: ["2026-10-08T12:00"], wind_speed_10m: [null], wind_direction_10m: [180] } };
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => json } as unknown as Response);
    const res = await provider.getWeather(0, 0, nowStr);
    expect(res.ok).toBe(false);
    expect(res.status).toBe("DATA_GAP");
  });

  it("parses valid JSON correctly and picks closest hour", async () => {
    const json = {
      hourly: {
        time: ["2026-10-08T10:00", "2026-10-08T12:00", "2026-10-08T14:00"],
        wind_speed_10m: [5, 18, 10],
        wind_direction_10m: [90, 180, 270],
        temperature_2m: [20, 25, 22],
        relative_humidity_2m: [60, 50, 55]
      }
    };
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => json } as unknown as Response);
    const res = await provider.getWeather(0, 0, nowStr); // now is 12:00:00Z
    expect(res.ok).toBe(true);
    expect(res.data?.windSpeed).toBe(18); // 18 km/h at 12:00
    expect(res.data?.windDirection).toBe(180);
    expect(res.data?.source).toBe("OPEN_METEO");
  });
});
