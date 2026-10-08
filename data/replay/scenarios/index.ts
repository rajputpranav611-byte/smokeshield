import { ReplayScenario } from "@/domain/data/replay/schema";

const now = new Date();
const tString = (hoursOff: number) => new Date(now.getTime() + hoursOff * 3600000).toISOString();

const baseSchool = {
  id: "s1", name: "Replay School", latitude: 0, longitude: 0, timezone: "UTC", operationalPolicyReference: "P1"
};

const basePlan = {
  id: "p1", schoolId: "s1", version: 1, createdAt: tString(0), status: "APPROVED" as const, policyVersion: "1"
};

export const scenarios: ReplayScenario[] = [
  {
    id: "SCENARIO_1_BASELINE",
    name: "Baseline Overlap",
    description: "Active fire evidence, usable wind pushing towards school, causing overlap with outdoor assembly",
    school: baseSchool,
    observations: {
      fires: [{ id: "f1", fireDetectionId: "fd1", latitude: 0.1, longitude: 0, observedAt: tString(-1), confidence: 90, source: "SIM", status: "ACTIVE" }],
      weather: { id: "w1", observedAt: tString(0), windSpeed: 15, windDirection: 0, temperature: 25, source: "SIM", freshnessMinutes: 5, status: "ACTIVE" },
      aqi: null
    },
    operationalPlan: {
      ...basePlan,
      activities: [{ id: "a1", name: "Outdoor Assembly", startTime: tString(1), endTime: tString(2), locationType: "OUTDOOR" }]
    },
    isSimulation: true,
    expectedOutcome: {
      action: "REVIEW_PLAN",
      factorsIncludes: ["DIRECTIONAL_ALIGNMENT"]
    }
  },
  {
    id: "SCENARIO_2_WIND_SHIFT",
    name: "Wind Shift",
    description: "Wind blows smoke away from school",
    school: baseSchool,
    observations: {
      fires: [{ id: "f2", fireDetectionId: "fd1", latitude: 0.1, longitude: 0, observedAt: tString(-1), confidence: 90, source: "SIM", status: "ACTIVE" }],
      weather: { id: "w2", observedAt: tString(0), windSpeed: 15, windDirection: 180, temperature: 25, source: "SIM", freshnessMinutes: 5, status: "ACTIVE" },
      aqi: null
    },
    operationalPlan: {
      ...basePlan,
      activities: [{ id: "a1", name: "Outdoor Assembly", startTime: tString(1), endTime: tString(2), locationType: "OUTDOOR" }]
    },
    isSimulation: true,
    expectedOutcome: {
      action: "NO_CHANGE"
    }
  },
  {
    id: "SCENARIO_3_STALE_EVIDENCE",
    name: "Stale Morning Evidence",
    description: "Stale wind creates proximity warning with reduced confidence",
    school: baseSchool,
    observations: {
      fires: [{ id: "f3", fireDetectionId: "fd1", latitude: 0.1, longitude: 0, observedAt: tString(-1), confidence: 90, source: "SIM", status: "ACTIVE" }],
      weather: { id: "w3", observedAt: tString(0), windSpeed: 15, windDirection: 0, temperature: 25, source: "SIM", freshnessMinutes: 90, status: "STALE" },
      aqi: null
    },
    operationalPlan: {
      ...basePlan,
      activities: [{ id: "a1", name: "Outdoor Assembly", startTime: tString(1), endTime: tString(2), locationType: "OUTDOOR" }]
    },
    isSimulation: true,
    expectedOutcome: {
      action: "REVIEW_PLAN",
      factorsIncludes: ["STALE_WEATHER"]
    }
  },
  {
    id: "SCENARIO_4_AQI_CONFLICT",
    name: "Air-Quality Conflict",
    description: "Directional concern but AQI is perfectly clear",
    school: baseSchool,
    observations: {
      fires: [{ id: "f4", fireDetectionId: "fd1", latitude: 0.1, longitude: 0, observedAt: tString(-1), confidence: 90, source: "SIM", status: "ACTIVE" }],
      weather: { id: "w4", observedAt: tString(0), windSpeed: 15, windDirection: 0, temperature: 25, source: "SIM", freshnessMinutes: 5, status: "ACTIVE" },
      aqi: { id: "aq4", observedAt: tString(0), aqi: 20, source: "SIM", freshnessMinutes: 5, status: "ACTIVE" }
    },
    operationalPlan: {
      ...basePlan,
      activities: [{ id: "a1", name: "Outdoor Assembly", startTime: tString(1), endTime: tString(2), locationType: "OUTDOOR" }]
    },
    isSimulation: true,
    expectedOutcome: {
      action: "REVIEW_PLAN",
      factorsIncludes: ["AQ_CONFLICT"]
    }
  },
  {
    id: "SCENARIO_5_MULTIPLE_FIRES",
    name: "Multiple Fires",
    description: "Multiple active fires contribute to evaluation",
    school: baseSchool,
    observations: {
      fires: [
        { id: "f5a", fireDetectionId: "fd5a", latitude: 0.1, longitude: 0, observedAt: tString(-1), confidence: 90, source: "SIM", status: "ACTIVE" },
        { id: "f5b", fireDetectionId: "fd5b", latitude: 0.2, longitude: 0, observedAt: tString(-1), confidence: 90, source: "SIM", status: "ACTIVE" }
      ],
      weather: { id: "w5", observedAt: tString(0), windSpeed: 15, windDirection: 0, temperature: 25, source: "SIM", freshnessMinutes: 5, status: "ACTIVE" },
      aqi: null
    },
    operationalPlan: {
      ...basePlan,
      activities: [{ id: "a1", name: "Outdoor Assembly", startTime: tString(1), endTime: tString(2), locationType: "OUTDOOR" }]
    },
    isSimulation: true,
    expectedOutcome: {
      action: "REVIEW_PLAN"
    }
  },
  {
    id: "SCENARIO_6_ESCALATION",
    name: "PlanGuard Escalation",
    description: "Conditions worsen overnight requiring morning escalation",
    school: baseSchool,
    observations: {
      fires: [{ id: "f6", fireDetectionId: "fd6", latitude: 0.1, longitude: 0, observedAt: tString(-1), confidence: 90, source: "SIM", status: "ACTIVE" }],
      weather: { id: "w6", observedAt: tString(0), windSpeed: 20, windDirection: 0, temperature: 25, source: "SIM", freshnessMinutes: 5, status: "ACTIVE" },
      aqi: { id: "aq6", observedAt: tString(0), aqi: 180, source: "SIM", freshnessMinutes: 5, status: "ACTIVE" }
    },
    operationalPlan: {
      ...basePlan,
      activities: [{ id: "a1", name: "Outdoor PE", startTime: tString(1), endTime: tString(2), locationType: "OUTDOOR" }]
    },
    isSimulation: true,
    expectedOutcome: {
      action: "REVIEW_PLAN",
      factorsIncludes: ["AQ_CORROBORATION"]
    }
  },
  {
    id: "SCENARIO_7_IMPROVED_CONDITIONS",
    name: "Improved Morning Conditions",
    description: "Conditions improve but the risk engine preserves output to prevent auto-relaxation",
    school: baseSchool,
    observations: {
      fires: [],
      weather: { id: "w7", observedAt: tString(0), windSpeed: 15, windDirection: 180, temperature: 25, source: "SIM", freshnessMinutes: 5, status: "ACTIVE" },
      aqi: { id: "aq7", observedAt: tString(0), aqi: 30, source: "SIM", freshnessMinutes: 5, status: "ACTIVE" }
    },
    operationalPlan: {
      ...basePlan,
      activities: [{ id: "a1", name: "Outdoor Event", startTime: tString(1), endTime: tString(2), locationType: "OUTDOOR" }]
    },
    isSimulation: true,
    expectedOutcome: {
      action: "NO_CHANGE"
    }
  }
];
