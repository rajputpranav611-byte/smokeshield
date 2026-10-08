import { describe, it, expect, vi } from "vitest";
import { assessEnvironment } from "./index";
import { EnvironmentalEvidenceOrchestrator } from "../orchestrator";
import { School, OperationalPlan } from "@/types/domain";

import { EnvironmentalEvidenceBundle } from "../orchestrator";
import { scenarios } from "../../../data/replay/scenarios/index";

describe("EnvironmentalAssessmentService", () => {
  const mockSchool: School = {
    id: "s1", name: "Test School", latitude: 0, longitude: 0, timezone: "UTC", operationalPolicyReference: "P1"
  };
  const mockPlan: OperationalPlan = {
    id: "p1", schoolId: "s1", version: 1, activities: [], createdAt: "2026-10-08T10:00:00Z", status: "APPROVED", policyVersion: "1"
  };
  const referenceTime = "2026-10-08T12:00:00Z";


  const createMockOrchestrator = (bundleOverrides: Partial<EnvironmentalEvidenceBundle> = {}): EnvironmentalEvidenceOrchestrator => {
    return {
      gatherLiveEvidence: vi.fn().mockResolvedValue({
        school: mockSchool,
        fires: [],
        weather: null,
        aqi: null,
        providerStatuses: { fire: "SUCCESS", weather: "SUCCESS", aqi: "SUCCESS" },
        retrievedAt: referenceTime,
        referenceTime,
        isSimulation: false,
        evidenceIds: [],
        dataQualitySummary: { hasMissingCriticalData: false, notes: [] },
        ...bundleOverrides
      }),
      getReplayEvidence: vi.fn().mockResolvedValue({
        school: mockSchool,
        fires: [],
        weather: null,
        aqi: null,
        providerStatuses: { fire: "SUCCESS", weather: "SUCCESS", aqi: "SUCCESS" },
        retrievedAt: referenceTime,
        referenceTime,
        isSimulation: true,
        evidenceIds: [],
        dataQualitySummary: { hasMissingCriticalData: false, notes: [] },
        ...bundleOverrides
      })
    } as unknown as EnvironmentalEvidenceOrchestrator;
  };

  it("1. live assessment with both providers successful", async () => {
    const orchestrator = createMockOrchestrator({
      fires: [{ id: "f1", fireDetectionId: "fd1", source: "SIM", latitude: 0, longitude: 0, observedAt: referenceTime, status: "ACTIVE" }],
      weather: { id: "w1", windSpeed: 10, windDirection: 180, temperature: 20, source: "SIM", freshnessMinutes: 0, observedAt: referenceTime, status: "ACTIVE" }
    });

    const result = await assessEnvironment(orchestrator, mockSchool, mockPlan, "LIVE", referenceTime);
    expect(result.mode).toBe("LIVE");
    expect(result.isSimulation).toBe(false);
    expect(result.providerStatuses.fire).toBe("SUCCESS");
    expect(result.providerStatuses.weather).toBe("SUCCESS");
    expect(result.evidence.fires.length).toBe(1);
    expect(result.riskAssessment.confidenceScore).toBe(1.0);
  });

  it("2. live assessment with FIRMS DATA_GAP", async () => {
    const orchestrator = createMockOrchestrator({
      fires: [],
      weather: { id: "w1", windSpeed: 10, windDirection: 180, temperature: 20, source: "SIM", freshnessMinutes: 0, observedAt: referenceTime, status: "ACTIVE" },
      providerStatuses: { fire: "DATA_GAP", weather: "SUCCESS", aqi: "SUCCESS" },
      dataQualitySummary: { hasMissingCriticalData: true, notes: [] }
    });

    const result = await assessEnvironment(orchestrator, mockSchool, mockPlan, "LIVE", referenceTime);
    expect(result.providerStatuses.fire).toBe("DATA_GAP");
    expect(result.providerStatuses.weather).toBe("SUCCESS");
    expect(result.dataQuality.hasMissingCriticalData).toBe(true);
    expect(result.recommendation.action).toBe("NO_CHANGE"); // no fires = no risk
  });

  it("3. live assessment with weather DATA_GAP", async () => {
    const orchestrator = createMockOrchestrator({
      fires: [{ id: "f1", fireDetectionId: "fd1", source: "SIM", latitude: 0.1, longitude: 0, observedAt: referenceTime, status: "ACTIVE" }],
      weather: null,
      providerStatuses: { fire: "SUCCESS", weather: "DATA_GAP", aqi: "SUCCESS" },
      dataQualitySummary: { hasMissingCriticalData: true, notes: [] }
    });

    const result = await assessEnvironment(orchestrator, mockSchool, mockPlan, "LIVE", referenceTime);
    expect(result.providerStatuses.fire).toBe("SUCCESS");
    expect(result.providerStatuses.weather).toBe("DATA_GAP");
    expect(result.riskAssessment.confidenceScore).toBeLessThan(1.0); // penalized for missing wind
  });

  it("4. both providers DATA_GAP", async () => {
    const orchestrator = createMockOrchestrator({
      fires: [],
      weather: null,
      providerStatuses: { fire: "DATA_GAP", weather: "DATA_GAP", aqi: "SUCCESS" },
      dataQualitySummary: { hasMissingCriticalData: true, notes: [] }
    });

    const result = await assessEnvironment(orchestrator, mockSchool, mockPlan, "LIVE", referenceTime);
    expect(result.providerStatuses.fire).toBe("DATA_GAP");
    expect(result.providerStatuses.weather).toBe("DATA_GAP");
  });

  // Since we mock the orchestrator here and the tests instruct to test specific replay scenarios, 
  // we need the real orchestrator or we just mock the outputs according to the scenarios.
  // The prompt says: "Mock the orchestrator. Do NOT call live APIs from tests."
  // So we mock the orchestrator to return the exact scenarios.
  

  const getRealOrchestratorMock = () => {
    return {
      getReplayEvidence: vi.fn().mockImplementation(async (scenarioId: string, refTime: string) => {
        const scenario = scenarios.find((s: { id: string }) => s.id === scenarioId);
        return {
          school: scenario!.school,
          fires: scenario!.observations.fires,
          weather: scenario!.observations.weather,
          aqi: scenario!.observations.aqi,
          providerStatuses: { fire: "SUCCESS", weather: "SUCCESS", aqi: "SUCCESS" },
          retrievedAt: refTime,
          referenceTime: refTime,
          isSimulation: true,
          evidenceIds: [],
          dataQualitySummary: { hasMissingCriticalData: !scenario!.observations.weather, notes: [] }
        };
      })
    } as unknown as EnvironmentalEvidenceOrchestrator;
  };

  it("5. baseline replay scenario", async () => {
    const orchestrator = getRealOrchestratorMock();
    const result = await assessEnvironment(orchestrator, scenarios[0].school, scenarios[0].operationalPlan, "REPLAY", referenceTime, "SCENARIO_1_BASELINE");
    expect(result.recommendation.action).toBe("REVIEW_PLAN");
    expect(result.isSimulation).toBe(true);
  });

  it("6. wind-shift replay scenario", async () => {
    const orchestrator = getRealOrchestratorMock();
    const result = await assessEnvironment(orchestrator, scenarios[1].school, scenarios[1].operationalPlan, "REPLAY", referenceTime, "SCENARIO_2_WIND_SHIFT");
    expect(result.recommendation.action).toBe("NO_CHANGE");
  });

  it("7. stale-evidence replay scenario", async () => {
    const orchestrator = getRealOrchestratorMock();
    const result = await assessEnvironment(orchestrator, scenarios[2].school, scenarios[2].operationalPlan, "REPLAY", referenceTime, "SCENARIO_3_STALE_EVIDENCE");
    expect(result.riskAssessment.confidenceScore).toBeLessThan(1.0);
  });

  it("8. escalation scenario", async () => {
    const orchestrator = getRealOrchestratorMock();
    const result = await assessEnvironment(orchestrator, scenarios[5].school, scenarios[5].operationalPlan, "REPLAY", referenceTime, "SCENARIO_6_ESCALATION");
    expect(result.recommendation.action).toBe("REVIEW_PLAN");
  });

  it("9. improved-conditions scenario", async () => {
    const orchestrator = getRealOrchestratorMock();
    const result = await assessEnvironment(orchestrator, scenarios[6].school, scenarios[6].operationalPlan, "REPLAY", referenceTime, "SCENARIO_7_IMPROVED_CONDITIONS");
    expect(result.recommendation.action).toBe("NO_CHANGE");
  });

  it("10. same input produces identical assessment", async () => {
    const orchestrator = getRealOrchestratorMock();
    const res1 = await assessEnvironment(orchestrator, scenarios[0].school, scenarios[0].operationalPlan, "REPLAY", referenceTime, "SCENARIO_1_BASELINE");
    const res2 = await assessEnvironment(orchestrator, scenarios[0].school, scenarios[0].operationalPlan, "REPLAY", referenceTime, "SCENARIO_1_BASELINE");
    
    expect(res1.riskAssessment.assessmentId).toBe(res2.riskAssessment.assessmentId);
    expect(res1.recommendation.action).toBe(res2.recommendation.action);
    
    // Explicitly prove same inputs + same referenceTime => identical domain objects
    expect(res1.riskAssessment).toEqual(res2.riskAssessment);
    expect(res1.recommendation).toEqual(res2.recommendation);
    
    // But assessedAt should be different if time advanced, or at least it is an independent value.
    // In our test, they might be identically generated if executed within the same ms, 
    // but the key point is we do NOT assert on assessedAt for domain determinism.
  });

  it("11. isSimulation preserved", async () => {
    const orchestrator = getRealOrchestratorMock();
    const result = await assessEnvironment(orchestrator, scenarios[0].school, scenarios[0].operationalPlan, "REPLAY", referenceTime, "SCENARIO_1_BASELINE");
    expect(result.isSimulation).toBe(true);
    expect(result.riskAssessment.isSimulation).toBe(true);
  });

  it("12. provider statuses preserved", async () => {
    const orchestrator = createMockOrchestrator({
      providerStatuses: { fire: "DATA_GAP", weather: "ERROR", aqi: "SUCCESS" }
    });
    const result = await assessEnvironment(orchestrator, mockSchool, mockPlan, "LIVE", referenceTime);
    expect(result.providerStatuses.fire).toBe("DATA_GAP");
    expect(result.providerStatuses.weather).toBe("ERROR");
  });

  it("13. recommendation evidenceIds are present", async () => {
    const orchestrator = getRealOrchestratorMock();
    const result = await assessEnvironment(orchestrator, scenarios[0].school, scenarios[0].operationalPlan, "REPLAY", referenceTime, "SCENARIO_1_BASELINE");
    expect(result.recommendation.evidenceIds).toContain("w1");
  });

  it("14. riskAssessment evidenceIds match supporting evidence", async () => {
    const orchestrator = getRealOrchestratorMock();
    const result = await assessEnvironment(orchestrator, scenarios[0].school, scenarios[0].operationalPlan, "REPLAY", referenceTime, "SCENARIO_1_BASELINE");
    expect(result.riskAssessment.evidenceIds).toEqual(result.recommendation.evidenceIds);
  });
});
