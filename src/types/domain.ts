export type ObservationStatus = "ACTIVE" | "STALE" | "MISSING" | "ERROR" | "CONFLICT";

export interface Location {
  latitude: number;
  longitude: number;
}

export interface EnvironmentalObservation {
  id: string;
  source: string;
  observedAt: string; // ISO 8601
  receivedAt: string; // ISO 8601
  location: Location;
  freshnessMinutes: number;
  status: ObservationStatus;
}

export interface FireObservation {
  id: string;
  fireDetectionId: string;
  latitude: number;
  longitude: number;
  observedAt: string;
  confidence?: number;
  source: string;
  status: ObservationStatus;
}

export interface WeatherObservation {
  id: string;
  observedAt: string;
  windSpeed: number; // km/h
  windDirection: number; // degrees
  temperature: number; // Celsius
  humidity?: number; // percentage
  source: string;
  freshnessMinutes: number;
  status: ObservationStatus;
}

export interface AirQualityObservation {
  id: string;
  observedAt: string;
  pm25?: number; // µg/m³
  aqi?: number;
  source: string;
  freshnessMinutes: number;
  status: ObservationStatus;
}

export interface School {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
  operationalPolicyReference: string;
}

export type PlanStatus = "DRAFT" | "APPROVED" | "REJECTED" | "SUPERSEDED";
export type LocationType = "INDOOR" | "OUTDOOR";

export interface Activity {
  id: string;
  name: string;
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  locationType: LocationType;
}

export interface OperationalPlan {
  id: string;
  schoolId: string;
  version: number;
  activities: Activity[];
  createdAt: string; // ISO 8601
  status: PlanStatus;
  evidenceSnapshotId?: string;
  policyVersion: string;
}

export interface RiskAssessment {
  assessmentId: string;
  schoolId: string;
  generatedAt: string;
  riskWindow: {
    start: string; // ISO 8601
    end: string; // ISO 8601
  };
  overlapMinutes: number;
  confidenceScore: number;
  dataFreshness: number;
  evidenceIds: string[];
  modelVersion: string;
  isSimulation: boolean;
}

export type RecommendationStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "OBSOLETE";

export interface Recommendation {
  recommendationId: string;
  action: string;
  rationale: string;
  confidenceScore: number;
  evidenceIds: string[];
  generatedAt: string;
  status: RecommendationStatus;
}

export type ObservationType = "FIRE" | "WEATHER" | "AIR_QUALITY" | "MODEL_OUTPUT";

export interface EvidenceItem {
  evidenceId: string;
  source: string;
  observationType: ObservationType;
  observedAt: string;
  receivedAt: string;
  freshnessMinutes: number;
  summary: string;
  effectOnDecision: string;
}

export interface PlanApproval {
  planId: string;
  planVersion: number;
  actorId: string;
  actorRole: string;
  approvedAt: string;
  evidenceSnapshotId: string;
  policyVersion: string;
}

export type VerificationStatus = "VERIFIED" | "WATCH" | "ESCALATED" | "DATA_GAP";

export interface PlanVerification {
  planId: string;
  approvedPlanVersion: number;
  verifiedAt: string;
  status: VerificationStatus;
  comparisonSummary: string;
  latestEvidenceIds: string[];
  revisedPlanId?: string;
}
