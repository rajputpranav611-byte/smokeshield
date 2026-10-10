import { EnvironmentalEvidenceOrchestrator } from '../../domain/orchestrator';
import { FirmsProvider, OpenMeteoProvider } from '../../domain/data/providers';
import { assessEnvironment } from '../../domain/assessment';
import { getFirmsMapKey } from '../config/secrets';
import { PlanRepository } from '../data/PlanRepository';
import { VerificationStatus, PlanVerification } from '../../types/domain';

const repo = new PlanRepository();

export const handler = async (event: unknown): Promise<unknown> => {
  try {
    const { schoolId, planId, version } = event as Record<string, unknown>;
    if (!schoolId || !planId || !version) {
      throw new Error("Missing schoolId, planId, or version in event");
    }

    const plan = await repo.getPlan(String(schoolId), String(planId), Number(version));
    if (!plan) {
      throw new Error("Plan not found");
    }

    const orchestrator = new EnvironmentalEvidenceOrchestrator(
      new FirmsProvider(getFirmsMapKey),
      new OpenMeteoProvider()
    );

    // Provide a mocked school context and reference time for this execution
    // In a full implementation, we'd load school details from a school repository.
    const school = {
      id: String(schoolId),
      name: "Verification School",
      latitude: 0,
      longitude: 0,
      timezone: "Asia/Kolkata",
      operationalPolicyReference: plan.policyVersion
    };
    const referenceTime = new Date().toISOString();

    const assessment = await assessEnvironment(
      orchestrator,
      school,
      plan,
      'LIVE',
      referenceTime
    );

    // Basic deterministic escalation rules
    let status: VerificationStatus = "VERIFIED";
    let summary = "Conditions remain within approved bounds.";
    
    // Simulate PlanGuard comparison logic
    if (assessment.riskAssessment.confidenceScore < 50) {
      status = "DATA_GAP";
      summary = "Insufficient data confidence for automatic verification.";
    } else if (assessment.riskAssessment.overlapMinutes > 30) {
      status = "ESCALATED";
      summary = "Predicted overlap materially increased. Human review required.";
    } else if (assessment.riskAssessment.overlapMinutes > 0) {
      status = "WATCH";
      summary = "Conditions changed. Monitoring active.";
    }

    const verification: PlanVerification = {
      planId: String(planId),
      approvedPlanVersion: Number(version),
      verifiedAt: referenceTime,
      status,
      comparisonSummary: summary,
      latestEvidenceIds: assessment.riskAssessment.evidenceIds
    };

    await repo.saveVerification(verification);

    return {
      success: true,
      verification
    };
  } catch (error: unknown) {
    console.error("PlanGuard Error:", error);
    throw error;
  }
};
