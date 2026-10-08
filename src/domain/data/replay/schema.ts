import { FireObservation, WeatherObservation, AirQualityObservation, OperationalPlan, School, VerificationStatus } from "@/types/domain";

export interface ExpectedOutcome {
  action?: string;
  affectedActivityIds?: string[];
  factorsIncludes?: string[];
  factorsExcludes?: string[];
  planGuardStatus?: VerificationStatus;
}

export interface ReplayScenario {
  id: string;
  name: string;
  description: string;
  school: School;
  observations: {
    fires: FireObservation[];
    weather: WeatherObservation | null;
    aqi: AirQualityObservation | null;
  };
  operationalPlan: OperationalPlan;
  isSimulation: boolean;
  expectedOutcome: ExpectedOutcome;
}

export function validateReplayScenario(scenario: unknown): scenario is ReplayScenario {
  const s = scenario as Record<string, unknown>;
  if (!s || !s.id || !s.school || !s.observations || !s.operationalPlan) {
    throw new Error(`Invalid scenario: missing core fields in ${s?.id}`);
  }
  if (s.isSimulation !== true) {
    throw new Error(`Invalid scenario: isSimulation must be explicitly true in ${s.id}`);
  }
  return true;
}
