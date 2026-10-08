import { evaluateRisk } from "../../risk-engine/engine";
import { ReplayScenario, validateReplayScenario } from "./schema";

export interface ReplayResult {
  scenarioMetadata: {
    id: string;
    name: string;
    description: string;
  };
  engineResult: ReturnType<typeof evaluateRisk>;
}

export function runReplay(scenario: ReplayScenario, referenceTime: string): ReplayResult {
  validateReplayScenario(scenario);
  
  const result = evaluateRisk(
    scenario.observations.fires,
    scenario.observations.weather,
    scenario.observations.aqi,
    scenario.school,
    scenario.operationalPlan,
    scenario.isSimulation,
    referenceTime
  );

  return {
    scenarioMetadata: {
      id: scenario.id,
      name: scenario.name,
      description: scenario.description
    },
    engineResult: result
  };
}
