import { describe, it, expect, vi, beforeEach } from "vitest";
import { FirmsProvider, OpenMeteoProvider } from "./index";

const nowStr = "2026-10-08T12:00:00Z";

describe("Integration Smoke Test (Non-Network)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    process.env.FIRMS_MAP_KEY = "mock";
  });

  it("simulates full data ingestion pipeline without network", async () => {
    const fireCsv = `latitude,longitude,acq_date,acq_time,confidence,instrument
1.0,2.0,2026-10-08,1000,90,VIIRS`;
    const weatherJson = {
      hourly: {
        time: ["2026-10-08T12:00"],
        wind_speed_10m: [18],
        wind_direction_10m: [180],
        temperature_2m: [25],
        relative_humidity_2m: [50]
      }
    };

    const fireProvider = new FirmsProvider();
    const weatherProvider = new OpenMeteoProvider();

    // Mock responses sequentially if parallel, or mock based on URL in a real scenario.
    // For this simple test, we just override fetch per call
    vi.mocked(fetch).mockImplementation(async (url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes("firms")) return { ok: true, text: async () => fireCsv } as unknown as Response;
      if (urlStr.includes("open-meteo")) return { ok: true, json: async () => weatherJson } as unknown as Response;
      return { ok: false } as unknown as Response;
    });

    const fireRes = await fireProvider.getFires(0, 0, 10, nowStr);
    const weatherRes = await weatherProvider.getWeather(0, 0, nowStr);

    expect(fireRes.ok).toBe(true);
    expect(fireRes.data![0].status).toBe("ACTIVE");
    
    expect(weatherRes.ok).toBe(true);
    expect(weatherRes.data?.status).toBe("ACTIVE");
  });
});
