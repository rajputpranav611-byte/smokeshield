import { 
  FireObservation, 
  WeatherObservation, 
  AirQualityObservation, 
  OperationalPlan, 
  School,
  RiskAssessment,
  Recommendation
} from "@/types/domain";
import { RISK_CONFIG } from "./config";
import { haversineDistance, calculateBearing, angularDifference } from "./math";

export interface ContributingFactor {
  type: string;
  label: string;
  effect: "INCREASES_CONCERN" | "REDUCES_CONCERN" | "INCREASES_CONFIDENCE" | "REDUCES_CONFIDENCE";
}

export interface EngineResult {
  assessment: RiskAssessment;
  recommendation: Recommendation;
  factors: ContributingFactor[];
}

export function evaluateRisk(
  fires: FireObservation[],
  weather: WeatherObservation | null,
  aqi: AirQualityObservation | null,
  school: School,
  plan: OperationalPlan,
  isSimulation: boolean,
  referenceTime: string
): EngineResult {
  const generatedAt = referenceTime;
  let baseConfidence = 1.0;
  const evidenceIds: string[] = [];
  const factors: ContributingFactor[] = [];
  
  // Data Quality Checks
  const usableFires = fires.filter(f => f.status === "ACTIVE" || f.status === "STALE");
  if (usableFires.some(f => f.status === "STALE")) {
    baseConfidence -= 0.1;
    factors.push({ type: "STALE_FIRE", label: "Some fire observations are stale", effect: "REDUCES_CONFIDENCE" });
  }

  let windSpeed = RISK_CONFIG.DEFAULT_WIND_SPEED_KMH;
  let windDirection: number | null = null;
  let hasValidWind = false;

  if (weather && (weather.status === "ACTIVE" || weather.status === "STALE")) {
    evidenceIds.push(weather.id);
    windSpeed = weather.windSpeed;
    windDirection = weather.windDirection;
    hasValidWind = true;
    if (weather.status === "STALE") {
      baseConfidence -= 0.3; // Stale wind reduces confidence substantially
      factors.push({ type: "STALE_WEATHER", label: "Wind observation is stale", effect: "REDUCES_CONFIDENCE" });
    }
  } else {
    baseConfidence -= 0.5; // Missing wind is a major penalty
    factors.push({ type: "MISSING_WEATHER", label: "Wind observation is missing or invalid", effect: "REDUCES_CONFIDENCE" });
  }

  const potentialInfluenceWindows: {start: Date, end: Date}[] = [];
  let isDownwind = false;

  for (const fire of usableFires) {
    evidenceIds.push(fire.id);
    const distance = haversineDistance(fire.latitude, fire.longitude, school.latitude, school.longitude);
    
    if (distance <= RISK_CONFIG.MAX_INFLUENCE_DISTANCE_KM) {
      factors.push({ type: "FIRE_DISTANCE", label: "Active detection is within configured influence range", effect: "INCREASES_CONCERN" });
      
      const bearing = calculateBearing(fire.latitude, fire.longitude, school.latitude, school.longitude);
      
      let fireIsDownwind = false;
      let fireIsRadialProximity = false;

      if (!hasValidWind || windSpeed < RISK_CONFIG.MINIMUM_WIND_SPEED_KMH) {
        fireIsRadialProximity = true; // Radial proximity fallback due to missing/low wind
      } else if (windDirection !== null) {
        // Wind direction is meteorological (from). Smoke travels towards (windDirection + 180).
        const smokeTravelDirection = (windDirection + 180) % 360;
        const diff = angularDifference(bearing, smokeTravelDirection);
        if (diff <= RISK_CONFIG.DIRECTIONAL_TOLERANCE_DEGREES) {
          fireIsDownwind = true;
          isDownwind = true;
        }
      }

      if (fireIsDownwind || fireIsRadialProximity) {
        if (fireIsDownwind) {
          factors.push({ type: "DIRECTIONAL_ALIGNMENT", label: "School is approximately downwind of fire (DIRECTIONAL_INFLUENCE)", effect: "INCREASES_CONCERN" });
        } else {
          factors.push({ type: "PROXIMITY_WITHOUT_DIRECTION", label: "School is near fire, but directional influence cannot be established due to missing/low wind", effect: "INCREASES_CONCERN" });
        }
        
        // Estimate arrival time
        // If wind is missing, we use DEFAULT_WIND_SPEED_KMH for fallback precautionary estimation
        const effectiveWindSpeed = hasValidWind ? windSpeed : RISK_CONFIG.DEFAULT_WIND_SPEED_KMH;
        const travelHours = distance / effectiveWindSpeed;
        const fireObservedAt = new Date(fire.observedAt);
        const arrivalTime = new Date(fireObservedAt.getTime() + travelHours * 3600 * 1000);
        const endTime = new Date(arrivalTime.getTime() + RISK_CONFIG.INFLUENCE_WINDOW_DURATION_MINUTES * 60 * 1000);
        
        potentialInfluenceWindows.push({ start: arrivalTime, end: endTime });
      }
    }
  }

  if (aqi && (aqi.status === "ACTIVE" || aqi.status === "STALE")) {
    evidenceIds.push(aqi.id);
    if (aqi.status === "STALE") {
      baseConfidence -= 0.05;
      factors.push({ type: "STALE_AQI", label: "Air quality observation is stale", effect: "REDUCES_CONFIDENCE" });
    }
    if (aqi.aqi && aqi.aqi > 150) {
      if (isDownwind) {
        factors.push({ type: "AQ_CORROBORATION", label: "Recent air-quality observation supports concern", effect: "INCREASES_CONFIDENCE" });
      } else {
        baseConfidence -= 0.1;
        factors.push({ type: "AQ_CONFLICT", label: "Air quality is bad but school is not downwind", effect: "REDUCES_CONFIDENCE" });
      }
    } else if (aqi.aqi && aqi.aqi < 50) {
      if (isDownwind) {
        baseConfidence -= 0.1;
        factors.push({ type: "AQ_CONFLICT", label: "School is downwind but air quality is good", effect: "REDUCES_CONFIDENCE" });
      }
    }
  }

  let totalOverlapMinutes = 0;

  // Merge influence windows (simplified: just take min start and max end of overlapping ones, or just overall)
  // For operational overlap, we check each activity against each window
  for (const activity of plan.activities) {
    if (activity.locationType === "INDOOR") {
      factors.push({ type: "INDOOR_ACTIVITY", label: `Activity '${activity.name}' is indoor and NOT_EVALUATED_FOR_OUTDOOR_CORRIDOR`, effect: "REDUCES_CONCERN" });
      continue; 
    }
    
    const actStart = new Date(activity.startTime).getTime();
    const actEnd = new Date(activity.endTime).getTime();
    
    let overlapForActivity = 0;
    for (const w of potentialInfluenceWindows) {
      const wStart = w.start.getTime();
      const wEnd = w.end.getTime();
      
      const overlapStart = Math.max(actStart, wStart);
      const overlapEnd = Math.min(actEnd, wEnd);
      
      if (overlapStart < overlapEnd) {
        overlapForActivity += (overlapEnd - overlapStart) / 60000;
      }
    }
    
    if (overlapForActivity > 0) {
      totalOverlapMinutes += overlapForActivity;
    }
  }

  // Determine Overall Risk Window
  let riskWindowStart = new Date(0);
  let riskWindowEnd = new Date(0);
  if (potentialInfluenceWindows.length > 0) {
    riskWindowStart = new Date(Math.min(...potentialInfluenceWindows.map(w => w.start.getTime())));
    riskWindowEnd = new Date(Math.max(...potentialInfluenceWindows.map(w => w.end.getTime())));
  }

  // Normalize confidence (0 to 1)
  const confidenceScore = Math.max(0, Math.min(1, baseConfidence));

  const assessment: RiskAssessment = {
    assessmentId: `ra-${new Date(referenceTime).getTime()}`,
    schoolId: school.id,
    generatedAt,
    riskWindow: {
      start: riskWindowStart.toISOString(),
      end: riskWindowEnd.toISOString()
    },
    overlapMinutes: totalOverlapMinutes,
    confidenceScore,
    dataFreshness: 0, // Placeholder, usually computed as min freshness
    evidenceIds,
    modelVersion: "1.0.0",
    isSimulation
  };

  let action = "NO_CHANGE";
  let rationale = "No significant smoke influence predicted during outdoor activities.";
  
  if (totalOverlapMinutes > 0) {
    action = "REVIEW_PLAN";
    rationale = `Potential smoke-influence window overlaps scheduled outdoor activities by ${Math.round(totalOverlapMinutes)} minutes. ${isDownwind ? "School is downwind of active detections." : "Proximity alert (missing/low wind)."}`;
  } else if (potentialInfluenceWindows.length > 0) {
    action = "MONITOR";
    rationale = `Potential smoke-influence window exists, but does not currently overlap scheduled outdoor activities. ${isDownwind ? "Directional influence noted." : "Proximity without directional evidence."}`;
  } else if (usableFires.length > 0) {
    action = "NO_CHANGE";
    rationale = "Fires detected, but school is not in the predicted influence corridor.";
  }

  if (confidenceScore < 0.5) {
    rationale += " (Low confidence due to missing or stale data).";
  }

  const recommendation: Recommendation = {
    recommendationId: `rec-${new Date(referenceTime).getTime()}`,
    action,
    rationale,
    confidenceScore,
    evidenceIds,
    generatedAt,
    status: "PENDING"
  };

  return { assessment, recommendation, factors };
}
