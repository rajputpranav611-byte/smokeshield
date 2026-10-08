import { School, OperationalPlan, RiskAssessment, Recommendation } from "@/types/domain";
import { EnvironmentalEvidenceOrchestrator, EnvironmentalEvidenceBundle, ProviderStatuses, DataQualitySummary } from "../orchestrator";
import { evaluateRisk } from "../risk-engine/engine";

export interface EnvironmentalAssessment {
  school: School;
  operationalPlan: OperationalPlan;
  evidence: EnvironmentalEvidenceBundle;
  riskAssessment: RiskAssessment;
  recommendation: Recommendation;
  providerStatuses: ProviderStatuses;
  dataQuality: DataQualitySummary;
  assessedAt: string;
  referenceTime: string;
  mode: "LIVE" | "REPLAY";
  isSimulation: boolean;
}

export async function assessEnvironment(
  orchestrator: EnvironmentalEvidenceOrchestrator,
  school: School,
  operationalPlan: OperationalPlan,
  mode: "LIVE" | "REPLAY",
  referenceTime: string,
  replayScenarioId?: string
): Promise<EnvironmentalAssessment> {
  let bundle: EnvironmentalEvidenceBundle;

  if (mode === "LIVE") {
    // 50km radius for fires for example
    bundle = await orchestrator.gatherLiveEvidence(school, 50, referenceTime);
  } else {
    if (!replayScenarioId) {
      throw new Error("replayScenarioId is required when mode is REPLAY");
    }
    bundle = await orchestrator.getReplayEvidence(replayScenarioId, referenceTime);
  }

  const { assessment, recommendation } = evaluateRisk(
    bundle.fires,
    bundle.weather,
    bundle.aqi,
    school,
    operationalPlan,
    bundle.isSimulation,
    referenceTime
  );

  return {
    school,
    operationalPlan,
    evidence: bundle,
    riskAssessment: assessment,
    recommendation,
    providerStatuses: bundle.providerStatuses,
    dataQuality: bundle.dataQualitySummary,
    assessedAt: new Date().toISOString(), // Wall-clock time of assessment
    referenceTime,
    mode,
    isSimulation: bundle.isSimulation
  };
}
