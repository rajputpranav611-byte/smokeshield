import { describe, it, expect } from "vitest";
import { 
  VerificationStatus, 
  PlanVerification,
  RiskAssessment,
  Recommendation
} from "./domain";

function createRiskAssessment(data: Partial<RiskAssessment>): RiskAssessment {
  return {
    assessmentId: "a1",
    schoolId: "s1",
    generatedAt: new Date().toISOString(),
    riskWindow: { start: new Date().toISOString(), end: new Date().toISOString() },
    overlapMinutes: 0,
    confidenceScore: 0.8,
    dataFreshness: 10,
    evidenceIds: [],
    modelVersion: "1.0",
    isSimulation: false,
    ...data
  };
}

describe("Domain Contracts", () => {
  it("should create a valid RiskAssessment with simulation flag", () => {
    const assessment = createRiskAssessment({ isSimulation: true });
    expect(assessment.isSimulation).toBe(true);
    expect(assessment.assessmentId).toBe("a1");
  });

  it("should correctly handle VerificationStatus enum mapping", () => {
    const status: VerificationStatus = "WATCH";
    const verification: PlanVerification = {
      planId: "p1",
      approvedPlanVersion: 1,
      verifiedAt: new Date().toISOString(),
      status,
      comparisonSummary: "Conditions changed.",
      latestEvidenceIds: ["e1", "e2"]
    };
    expect(verification.status).toBe("WATCH");
  });

  it("should strictly associate evidence with recommendations", () => {
    const recommendation: Recommendation = {
      recommendationId: "r1",
      action: "Shift Assembly",
      rationale: "Predicted Overlap with smoke corridor",
      confidenceScore: 0.85,
      evidenceIds: ["f1", "w1"], // Evidence traceable
      generatedAt: new Date().toISOString(),
      status: "PENDING"
    };

    expect(recommendation.evidenceIds).toHaveLength(2);
    expect(recommendation.confidenceScore).toBeTypeOf("number");
  });
});
