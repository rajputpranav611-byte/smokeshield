import { describe, it, expect } from "vitest";
import { runReplay } from "./runner";
import { validateReplayScenario, ReplayScenario } from "./schema";
import { scenarios } from "../../../../data/replay/scenarios/index";

describe("Replay System", () => {
  it("B. each replay fixture loads and C. has isSimulation=true", () => {
    expect(scenarios.length).toBeGreaterThan(0);
    for (const scenario of scenarios) {
      expect(() => validateReplayScenario(scenario)).not.toThrow();
      expect(scenario.isSimulation).toBe(true);
    }
  });

  it("D. baseline produces expected overlap/recommendation", () => {
    const res = runReplay(scenarios[0], "2026-10-08T12:00:00Z");
    expect(res.engineResult.recommendation.action).toBe("REVIEW_PLAN");
    expect(res.engineResult.factors.some(f => f.type === "DIRECTIONAL_ALIGNMENT")).toBe(true);
  });

  it("E. wind-shift fixture changes directional result", () => {
    const res = runReplay(scenarios[1], "2026-10-08T12:00:00Z");
    expect(res.engineResult.recommendation.action).toBe("NO_CHANGE");
  });

  it("F. stale evidence reduces confidence", () => {
    const resBase = runReplay(scenarios[0], "2026-10-08T12:00:00Z");
    const resStale = runReplay(scenarios[2], "2026-10-08T12:00:00Z");
    expect(resStale.engineResult.recommendation.confidenceScore).toBeLessThan(resBase.engineResult.recommendation.confidenceScore);
    expect(resStale.engineResult.factors.some(f => f.type === "STALE_WEATHER")).toBe(true);
  });

  it("G. conflict fixture produces explicit conflict", () => {
    const res = runReplay(scenarios[3], "2026-10-08T12:00:00Z");
    expect(res.engineResult.factors.some(f => f.type === "AQ_CONFLICT")).toBe(true);
    expect(res.engineResult.recommendation.confidenceScore).toBeLessThan(1.0);
  });

  it("H. multiple-fire fixture preserves all relevant evidenceIds", () => {
    const res = runReplay(scenarios[4], "2026-10-08T12:00:00Z");
    expect(res.engineResult.assessment.evidenceIds).toContain("f5a");
    expect(res.engineResult.assessment.evidenceIds).toContain("f5b");
  });

  it("I. PlanGuard escalation fixture produces changed morning result", () => {
    const res = runReplay(scenarios[5], "2026-10-08T12:00:00Z");
    expect(res.engineResult.recommendation.action).toBe("REVIEW_PLAN");
    expect(res.engineResult.factors.some(f => f.type === "AQ_CORROBORATION")).toBe(true);
  });

  it("J. improved-condition fixture output", () => {
    const res = runReplay(scenarios[6], "2026-10-08T12:00:00Z");
    expect(res.engineResult.recommendation.action).toBe("NO_CHANGE");
  });

  it("K. replay is deterministic", () => {
    const res1 = runReplay(scenarios[0], "2026-10-08T12:00:00Z");
    const res2 = runReplay(scenarios[0], "2026-10-08T12:00:00Z");
    expect(res1.engineResult.recommendation.action).toBe(res2.engineResult.recommendation.action);
    expect(res1.engineResult.assessment.confidenceScore).toBe(res2.engineResult.assessment.confidenceScore);
  });

  it("L. invalid fixture is rejected", () => {
    const invalidScenario = { ...scenarios[0], isSimulation: false };
    expect(() => runReplay(invalidScenario as unknown as ReplayScenario, "2026-10-08T12:00:00Z")).toThrow();
  });
});
