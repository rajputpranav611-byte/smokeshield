import { describe, it, expect, vi } from "vitest";
import { EnvironmentalEvidenceOrchestrator } from "./index";
import { FireDataProvider, WeatherDataProvider } from "../data/providers";
import { ProviderResult } from "../data/providers/client";
import { FireObservation, WeatherObservation } from "@/types/domain";

describe("EnvironmentalEvidenceOrchestrator", () => {
  const mockSchool = {
    id: "s1", name: "Test School", latitude: 0, longitude: 0, timezone: "UTC", operationalPolicyReference: "P1"
  };
  const referenceTime = "2026-10-08T12:00:00Z";

  const createMockFireProvider = (result: ProviderResult<FireObservation[]>): FireDataProvider => ({
    getFires: vi.fn().mockResolvedValue(result)
  });

  const createMockWeatherProvider = (result: ProviderResult<WeatherObservation>): WeatherDataProvider => ({
    getWeather: vi.fn().mockResolvedValue(result)
  });

  it("gathers live evidence successfully from both providers", async () => {
    const fireObs: FireObservation = { id: "f1", fireDetectionId: "fd1", latitude: 1, longitude: 1, observedAt: referenceTime, confidence: 90, source: "SIM", status: "ACTIVE" };
    const weatherObs: WeatherObservation = { id: "w1", observedAt: referenceTime, windSpeed: 10, windDirection: 180, temperature: 20, source: "SIM", freshnessMinutes: 5, status: "ACTIVE" };
    
    const orchestrator = new EnvironmentalEvidenceOrchestrator(
      createMockFireProvider({ ok: true, data: [fireObs] }),
      createMockWeatherProvider({ ok: true, data: weatherObs })
    );

    const bundle = await orchestrator.gatherLiveEvidence(mockSchool, 10, referenceTime);
    
    expect(bundle.providerStatuses.fire).toBe("SUCCESS");
    expect(bundle.providerStatuses.weather).toBe("SUCCESS");
    expect(bundle.fires.length).toBe(1);
    expect(bundle.weather?.id).toBe("w1");
    expect(bundle.isSimulation).toBe(false);
    expect(bundle.dataQualitySummary.hasMissingCriticalData).toBe(false);
  });

  it("preserves DATA_GAP when FIRMS fails but weather succeeds", async () => {
    const weatherObs: WeatherObservation = { id: "w1", observedAt: referenceTime, windSpeed: 10, windDirection: 180, temperature: 20, source: "SIM", freshnessMinutes: 5, status: "ACTIVE" };
    
    const orchestrator = new EnvironmentalEvidenceOrchestrator(
      createMockFireProvider({ ok: false, status: "DATA_GAP", message: "Timeout" }),
      createMockWeatherProvider({ ok: true, data: weatherObs })
    );

    const bundle = await orchestrator.gatherLiveEvidence(mockSchool, 10, referenceTime);
    
    expect(bundle.providerStatuses.fire).toBe("DATA_GAP");
    expect(bundle.providerStatuses.weather).toBe("SUCCESS");
    expect(bundle.fires.length).toBe(0);
    expect(bundle.weather).not.toBeNull();
    expect(bundle.dataQualitySummary.hasMissingCriticalData).toBe(true);
  });

  it("preserves DATA_GAP when weather fails but FIRMS succeeds", async () => {
    const fireObs: FireObservation = { id: "f1", fireDetectionId: "fd1", latitude: 1, longitude: 1, observedAt: referenceTime, confidence: 90, source: "SIM", status: "ACTIVE" };

    const orchestrator = new EnvironmentalEvidenceOrchestrator(
      createMockFireProvider({ ok: true, data: [fireObs] }),
      createMockWeatherProvider({ ok: false, status: "DATA_GAP", message: "API error" })
    );

    const bundle = await orchestrator.gatherLiveEvidence(mockSchool, 10, referenceTime);
    
    expect(bundle.providerStatuses.fire).toBe("SUCCESS");
    expect(bundle.providerStatuses.weather).toBe("DATA_GAP");
    expect(bundle.weather).toBeNull();
    expect(bundle.fires.length).toBe(1);
    expect(bundle.dataQualitySummary.hasMissingCriticalData).toBe(true);
  });

  it("handles both failing", async () => {
    const orchestrator = new EnvironmentalEvidenceOrchestrator(
      createMockFireProvider({ ok: false, status: "DATA_GAP" }),
      createMockWeatherProvider({ ok: false, status: "DATA_GAP" })
    );

    const bundle = await orchestrator.gatherLiveEvidence(mockSchool, 10, referenceTime);
    expect(bundle.providerStatuses.fire).toBe("DATA_GAP");
    expect(bundle.providerStatuses.weather).toBe("DATA_GAP");
    expect(bundle.dataQualitySummary.hasMissingCriticalData).toBe(true);
  });

  it("handles FIRMS zero detections as empty success, not failure", async () => {
    const weatherObs: WeatherObservation = { id: "w1", observedAt: referenceTime, windSpeed: 10, windDirection: 180, temperature: 20, source: "SIM", freshnessMinutes: 5, status: "ACTIVE" };

    const orchestrator = new EnvironmentalEvidenceOrchestrator(
      createMockFireProvider({ ok: true, data: [] }),
      createMockWeatherProvider({ ok: true, data: weatherObs })
    );

    const bundle = await orchestrator.gatherLiveEvidence(mockSchool, 10, referenceTime);
    expect(bundle.providerStatuses.fire).toBe("SUCCESS");
    expect(bundle.fires.length).toBe(0);
    expect(bundle.dataQualitySummary.hasMissingCriticalData).toBe(false);
  });

  it("retrieves deterministic replay evidence without network calls", async () => {
    const fireSpy = vi.fn();
    const weatherSpy = vi.fn();
    const orchestrator = new EnvironmentalEvidenceOrchestrator(
      { getFires: fireSpy },
      { getWeather: weatherSpy }
    );

    const bundle = await orchestrator.getReplayEvidence("SCENARIO_1_BASELINE", referenceTime);
    
    expect(fireSpy).not.toHaveBeenCalled();
    expect(weatherSpy).not.toHaveBeenCalled();
    expect(bundle.isSimulation).toBe(true);
    expect(bundle.school.id).toBe("s1");
    expect(bundle.fires.length).toBe(1);
    expect(bundle.weather).not.toBeNull();
  });
});
