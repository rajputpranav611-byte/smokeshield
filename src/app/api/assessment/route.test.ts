import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './route';
import { scenarios } from '../../../../data/replay/scenarios/index';

// Mock the network globally
const originalFetch = global.fetch;

describe('Assessment API Route', () => {
  const baseRequest = {
    school: { id: "s1", name: "Test", latitude: 35, longitude: -120, timezone: "UTC", operationalPolicyReference: "P1" },
    operationalPlan: { id: "p1", schoolId: "s1", version: 1, activities: [], createdAt: "2026-10-08T10:00:00Z", status: "APPROVED", policyVersion: "1" },
    mode: "REPLAY",
    referenceTime: "2026-10-08T12:00:00Z",
    scenarioId: scenarios[0].id
  };

  beforeEach(() => {
    process.env.FIRMS_MAP_KEY = "test-key";
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const createRequest = (body: unknown) => {
    return new Request("http://localhost/api/assessment", {
      method: "POST",
      body: typeof body === 'string' ? body : JSON.stringify(body)
    });
  };

  it('1. valid LIVE request', async () => {
    // Mock fetch responses for LIVE mode
    vi.mocked(global.fetch).mockImplementation((url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes('firms')) {
        return Promise.resolve({ ok: true, text: () => Promise.resolve("latitude,longitude,acq_date,acq_time,confidence,instrument\n35.1,-120.1,2026-10-08,1200,100,VIIRS") } as unknown as Response);
      }
      if (urlStr.includes('open-meteo')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ hourly: { time: ["2026-10-08T12:00"], wind_speed_10m: [10], wind_direction_10m: [180] } }) } as unknown as Response);
      }
      return Promise.resolve({ ok: false } as unknown as Response);
    });

    const res = await POST(createRequest({ ...baseRequest, mode: "LIVE" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.mode).toBe("LIVE");
    expect(data.isSimulation).toBe(false);
  });

  it('2. valid REPLAY request', async () => {
    const res = await POST(createRequest(baseRequest));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.mode).toBe("REPLAY");
    expect(data.isSimulation).toBe(true);
  });

  it('3. malformed JSON', async () => {
    const res = await POST(createRequest("{ invalid json"));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Malformed JSON");
  });

  it('4. invalid coordinates', async () => {
    const reqData = { ...baseRequest, school: { ...baseRequest.school, latitude: "35" /* string instead of number */ } };
    const res = await POST(createRequest(reqData));
    expect(res.status).toBe(400);
  });

  it('5. missing operational plan', async () => {
    const { operationalPlan: _operationalPlan, ...rest } = baseRequest;
    const res = await POST(createRequest(rest));
    expect(res.status).toBe(400);
  });

  it('6. invalid mode', async () => {
    const reqData = { ...baseRequest, mode: "FAKE" };
    const res = await POST(createRequest(reqData));
    expect(res.status).toBe(400);
  });

  it('7. replay without scenarioId', async () => {
    const { scenarioId: _scenarioId, ...rest } = baseRequest;
    const res = await POST(createRequest(rest));
    expect(res.status).toBe(400);
  });

  it('8. unknown scenarioId', async () => {
    const reqData = { ...baseRequest, scenarioId: "does-not-exist" };
    const res = await POST(createRequest(reqData));
    expect(res.status).toBe(404);
  });

  it('9. live partial provider failure returns 200 with DATA_GAP, not 500', async () => {
    // FIRMS fails, OpenMeteo succeeds
    vi.mocked(global.fetch).mockImplementation((url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes('firms')) {
        return Promise.resolve({ ok: false, status: 504 } as unknown as Response); // Gateway timeout
      }
      if (urlStr.includes('open-meteo')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ hourly: { time: ["2026-10-08T12:00"], wind_speed_10m: [10], wind_direction_10m: [180] } }) } as unknown as Response);
      }
      return Promise.resolve({ ok: false } as unknown as Response);
    });

    const res = await POST(createRequest({ ...baseRequest, mode: "LIVE" }));
    expect(res.status).toBe(200); // Because it successfully generated an assessment with partial data
    const data = await res.json();
    expect(data.providerStatuses.fire).toBe("DATA_GAP");
    expect(data.dataQuality.hasMissingCriticalData).toBe(true);
  });

  it('10. successful response preserves evidence IDs', async () => {
    const res = await POST(createRequest(baseRequest));
    const data = await res.json();
    expect(data.evidence.evidenceIds.length).toBeGreaterThan(0);
    expect(data.riskAssessment.evidenceIds).toEqual(data.recommendation.evidenceIds);
  });

  it('11. response never contains provider credentials', async () => {
    const res = await POST(createRequest(baseRequest));
    const text = await res.text();
    expect(text).not.toContain("test-key");
  });

  it('12. replay route makes zero network calls', async () => {
    await POST(createRequest(baseRequest));
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
