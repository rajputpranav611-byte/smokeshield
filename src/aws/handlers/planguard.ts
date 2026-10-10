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

    const approval = await repo.getApproval(String(planId), Number(version));
    if (!approval) {
      throw new Error("Approved plan version not found");
    }

    const orchestrator = new EnvironmentalEvidenceOrchestrator(
      new FirmsProvider(getFirmsMapKey),
      new OpenMeteoProvider()
    );

    const school = {
      id: String(schoolId),
      name: "Verification School",
      latitude: 0,
      longitude: 0,
      timezone: "Asia/Kolkata",
      operationalPolicyReference: plan.policyVersion
    };
    const referenceTime = new Date().toISOString();

    const currentAssessment = await assessEnvironment(
      orchestrator,
      school,
      plan,
      'LIVE',
      referenceTime
    );

    const approvedAssessment = await assessEnvironment(
      orchestrator,
      school,
      plan,
      'REPLAY',
      referenceTime,
      approval.evidenceSnapshotId
    );

    let status: VerificationStatus = "VERIFIED";
    let summary = "Conditions remain within approved bounds.";

    const { dataQuality, riskAssessment: currentRisk } = currentAssessment;
    const { riskAssessment: approvedRisk } = approvedAssessment;

    if (dataQuality.hasMissingCriticalData || currentRisk.confidenceScore < 0.5) {
      status = "DATA_GAP";
      summary = "Insufficient data confidence for automatic verification: " + dataQuality.notes.join(", ");
    } else if (currentRisk.overlapMinutes > approvedRisk.overlapMinutes + 15) {
      status = "ESCALATED";
      summary = `Predicted overlap materially increased from ${approvedRisk.overlapMinutes} to ${currentRisk.overlapMinutes} minutes. Human review required.`;
    } else if (currentRisk.overlapMinutes > 0 && currentRisk.overlapMinutes > approvedRisk.overlapMinutes) {
      status = "WATCH";
      summary = "Conditions changed. Monitoring active.";
    } else if (currentRisk.overlapMinutes > 0) {
      status = "VERIFIED"; // Even if > 0, it hasn't worsened. Never automatically relax an approved precaution.
      summary = "Conditions remain within approved bounds, but some overlap persists.";
    }

    const verification: PlanVerification = {
      planId: String(planId),
      approvedPlanVersion: Number(version),
      verifiedAt: referenceTime,
      status,
      comparisonSummary: summary,
      latestEvidenceIds: currentAssessment.riskAssessment.evidenceIds
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
