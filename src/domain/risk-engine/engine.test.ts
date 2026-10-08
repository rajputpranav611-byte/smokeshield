import { describe, it, expect } from "vitest";
import { evaluateRisk } from "./engine";
import { FireObservation, WeatherObservation, OperationalPlan, School } from "@/types/domain";

const baseSchool: School = {
  id: "s1", name: "Test School", latitude: 0, longitude: 0, timezone: "UTC", operationalPolicyReference: "P1"
};

const basePlan: OperationalPlan = {
  id: "p1", schoolId: "s1", version: 1, activities: [], createdAt: new Date().toISOString(), status: "APPROVED", policyVersion: "1"
};

const now = new Date();

function createFire(lat: number, lon: number, status: "ACTIVE"|"STALE"|"ERROR" = "ACTIVE"): FireObservation {
  return { id: `id-${lat}-${lon}`, fireDetectionId: `f-${lat}-${lon}`, latitude: lat, longitude: lon, observedAt: now.toISOString(), source: "FIRMS", status };
}

function createWeather(windDir: number, windSpeed: number = 10, status: "ACTIVE"|"STALE"|"ERROR" = "ACTIVE"): WeatherObservation {
  return { id: `w-${windDir}`, observedAt: now.toISOString(), windSpeed, windDirection: windDir, temperature: 25, source: "IMD", freshnessMinutes: 10, status };
}

describe("Risk Engine Math & Logic", () => {
  it("A. fire north of school with northward wind (smoke blows north)", () => {
    // North is approx lat=0.1
    const fire = createFire(0.1, 0); 
    // Northward wind blows TO North, so comes FROM South (180)
    const weather = createWeather(180);
    const { recommendation } = evaluateRisk([fire], weather, null, baseSchool, basePlan, false);
    expect(recommendation.action).toBe("NO_CHANGE");
  });

  it("B. fire north of school with southward wind (smoke blows south)", () => {
    const fire = createFire(0.1, 0); 
    // Southward wind blows TO South, comes FROM North (0)
    const weather = createWeather(0);
    const { recommendation, factors } = evaluateRisk([fire], weather, null, baseSchool, basePlan, false);
    expect(recommendation.action).toBe("MONITOR");
    expect(factors.some(f => f.type === "DIRECTIONAL_ALIGNMENT")).toBe(true);
  });

  it("C. fire east of school with eastward wind", () => {
    const fire = createFire(0, 0.1); 
    // Eastward wind (TO East) comes FROM West (270)
    const weather = createWeather(270);
    const { recommendation } = evaluateRisk([fire], weather, null, baseSchool, basePlan, false);
    expect(recommendation.action).toBe("NO_CHANGE");
  });

  it("D. fire west of school with westward wind", () => {
    const fire = createFire(0, -0.1); 
    // Westward wind (TO West) comes FROM East (90)
    const weather = createWeather(90);
    const { recommendation } = evaluateRisk([fire], weather, null, baseSchool, basePlan, false);
    expect(recommendation.action).toBe("NO_CHANGE");
  });

  it("E. diagonal wind/bearing case", () => {
    const fire = createFire(0.1, 0.1); // NE
    // Wind FROM NE (45) blows SW.
    const weather = createWeather(45);
    const { recommendation } = evaluateRisk([fire], weather, null, baseSchool, basePlan, false);
    expect(recommendation.action).toBe("MONITOR");
  });

  it("F. fire outside configured influence distance", () => {
    // 1 degree lat is ~111km
    const fire = createFire(1, 0);
    const weather = createWeather(0);
    const { recommendation } = evaluateRisk([fire], weather, null, baseSchool, basePlan, false);
    expect(recommendation.action).toBe("NO_CHANGE");
  });

  it("G. overlapping activity", () => {
    const fire = createFire(0.1, 0);
    const weather = createWeather(0);
    const plan: OperationalPlan = {
      ...basePlan,
      activities: [{
        id: "a1", name: "Assembly", 
        // 1 hour from now
        startTime: new Date(now.getTime() + 60*60*1000).toISOString(),
        endTime: new Date(now.getTime() + 120*60*1000).toISOString(),
        locationType: "OUTDOOR"
      }]
    };
    const { assessment, recommendation } = evaluateRisk([fire], weather, null, baseSchool, plan, false);
    expect(recommendation.action).toBe("REVIEW_PLAN");
    expect(assessment.overlapMinutes).toBeGreaterThan(0);
  });

  it("R. deterministic output", () => {
    const fire = createFire(0.1, 0);
    const weather = createWeather(0);
    const res1 = evaluateRisk([fire], weather, null, baseSchool, basePlan, false);
    const res2 = evaluateRisk([fire], weather, null, baseSchool, basePlan, false);
    
    expect(res1.recommendation.action).toBe(res2.recommendation.action);
    expect(res1.assessment.overlapMinutes).toBe(res2.assessment.overlapMinutes);
    expect(res1.assessment.confidenceScore).toBe(res2.assessment.confidenceScore);
  });

  it("S. missing wind + nearby fire", () => {
    const fire = createFire(0.1, 0);
    const { recommendation, factors } = evaluateRisk([fire], null, null, baseSchool, basePlan, false);
    expect(factors.some(f => f.type === "PROXIMITY_WITHOUT_DIRECTION")).toBe(true);
    expect(factors.some(f => f.type === "DIRECTIONAL_ALIGNMENT")).toBe(false);
    expect(recommendation.confidenceScore).toBeLessThan(0.6); // penalized by -0.5
    expect(recommendation.action).toBe("MONITOR");
  });

  it("T. stale wind + nearby fire", () => {
    const fire = createFire(0.1, 0);
    const weather = createWeather(0, 10, "STALE");
    const { recommendation, factors } = evaluateRisk([fire], weather, null, baseSchool, basePlan, false);
    expect(factors.some(f => f.type === "STALE_WEATHER")).toBe(true);
    expect(recommendation.confidenceScore).toBeLessThan(0.8);
  });

  it("U. indoor-only schedule", () => {
    const fire = createFire(0.1, 0);
    const weather = createWeather(0);
    const plan: OperationalPlan = {
      ...basePlan,
      activities: [{
        id: "a1", name: "Assembly", 
        startTime: new Date(now.getTime() + 60*60*1000).toISOString(),
        endTime: new Date(now.getTime() + 120*60*1000).toISOString(),
        locationType: "INDOOR"
      }]
    };
    const { recommendation, factors } = evaluateRisk([fire], weather, null, baseSchool, plan, false);
    expect(recommendation.action).toBe("MONITOR"); // Because indoor is skipped
    expect(factors.some(f => f.type === "INDOOR_ACTIVITY")).toBe(true);
  });

  it("V. mixed indoor/outdoor schedule", () => {
    const fire = createFire(0.1, 0);
    const weather = createWeather(0);
    const plan: OperationalPlan = {
      ...basePlan,
      activities: [{
        id: "a1", name: "Indoor Assembly", 
        startTime: new Date(now.getTime() + 60*60*1000).toISOString(),
        endTime: new Date(now.getTime() + 120*60*1000).toISOString(),
        locationType: "INDOOR"
      }, {
        id: "a2", name: "Outdoor PE", 
        startTime: new Date(now.getTime() + 60*60*1000).toISOString(),
        endTime: new Date(now.getTime() + 120*60*1000).toISOString(),
        locationType: "OUTDOOR"
      }]
    };
    const { assessment, recommendation } = evaluateRisk([fire], weather, null, baseSchool, plan, false);
    expect(recommendation.action).toBe("REVIEW_PLAN"); // Outdoor triggers review
    expect(assessment.overlapMinutes).toBeGreaterThan(0);
  });

  it("W. confidence lower bound", () => {
    // Missing wind, error AQI, stale fire
    const fire = createFire(0.1, 0, "STALE");
    const aqi = { id: "a", observedAt: now.toISOString(), aqi: 200, source: "X", freshnessMinutes: 10, status: "STALE" as const };
    const { assessment } = evaluateRisk([fire], null, aqi, baseSchool, basePlan, false);
    expect(assessment.confidenceScore).toBeGreaterThanOrEqual(0.0);
  });

  it("X. confidence upper bound", () => {
    const fire = createFire(0.1, 0);
    const weather = createWeather(0);
    const { assessment } = evaluateRisk([fire], weather, null, baseSchool, basePlan, false);
    expect(assessment.confidenceScore).toBeLessThanOrEqual(1.0);
    expect(assessment.confidenceScore).toBe(1.0);
  });
});
