import { School, FireObservation, WeatherObservation, AirQualityObservation } from "@/types/domain";
import { FireDataProvider, WeatherDataProvider, AirQualityDataProvider } from "../data/providers";
import { scenarios } from "../../../data/replay/scenarios";

export interface ProviderStatuses {
  fire: "SUCCESS" | "DATA_GAP" | "ERROR";
  weather: "SUCCESS" | "DATA_GAP" | "ERROR";
  aqi: "SUCCESS" | "DATA_GAP" | "ERROR" | "NOT_CONFIGURED";
}

export interface DataQualitySummary {
  hasMissingCriticalData: boolean;
  notes: string[];
}

export interface EnvironmentalEvidenceBundle {
  school: School;
  fires: FireObservation[];
  weather: WeatherObservation | null;
  aqi: AirQualityObservation | null;
  providerStatuses: ProviderStatuses;
  retrievedAt: string;
  referenceTime: string;
  isSimulation: boolean;
  evidenceIds: string[];
  dataQualitySummary: DataQualitySummary;
}

export class EnvironmentalEvidenceOrchestrator {
  constructor(
    private fireProvider: FireDataProvider,
    private weatherProvider: WeatherDataProvider,
    private aqiProvider?: AirQualityDataProvider
  ) {}

  async gatherLiveEvidence(school: School, radiusKm: number, referenceTime: string): Promise<EnvironmentalEvidenceBundle> {
    const retrievedAt = new Date().toISOString(); // Real physical retrieval time
    const bundle: EnvironmentalEvidenceBundle = {
      school,
      fires: [],
      weather: null,
      aqi: null,
      providerStatuses: { fire: "SUCCESS", weather: "SUCCESS", aqi: "NOT_CONFIGURED" },
      retrievedAt,
      referenceTime,
      isSimulation: false,
      evidenceIds: [],
      dataQualitySummary: { hasMissingCriticalData: false, notes: [] }
    };

    // Parallel fetch for speed
    const [fireRes, weatherRes] = await Promise.all([
      this.fireProvider.getFires(school.latitude, school.longitude, radiusKm, referenceTime),
      this.weatherProvider.getWeather(school.latitude, school.longitude, referenceTime)
    ]);

    if (fireRes.ok && fireRes.data) {
      bundle.fires = fireRes.data;
      bundle.evidenceIds.push(...fireRes.data.map(f => f.id));
    } else {
      bundle.providerStatuses.fire = fireRes.status || "ERROR";
      bundle.dataQualitySummary.notes.push(`Fire data unavailable: ${fireRes.message}`);
      bundle.dataQualitySummary.hasMissingCriticalData = true;
    }

    if (weatherRes.ok && weatherRes.data) {
      bundle.weather = weatherRes.data;
      bundle.evidenceIds.push(weatherRes.data.id);
    } else {
      bundle.providerStatuses.weather = weatherRes.status || "ERROR";
      bundle.dataQualitySummary.notes.push(`Weather data unavailable: ${weatherRes.message}`);
      bundle.dataQualitySummary.hasMissingCriticalData = true;
    }

    if (this.aqiProvider) {
      const aqiRes = await this.aqiProvider.getAirQuality(school.latitude, school.longitude, referenceTime);
      if (aqiRes.ok && aqiRes.data) {
        bundle.aqi = aqiRes.data;
        bundle.providerStatuses.aqi = "SUCCESS";
        bundle.evidenceIds.push(aqiRes.data.id);
      } else {
        bundle.providerStatuses.aqi = aqiRes.status || "ERROR";
        bundle.dataQualitySummary.notes.push(`AQI data unavailable: ${aqiRes.message}`);
      }
    }

    return bundle;
  }

  async getReplayEvidence(scenarioId: string, referenceTime: string): Promise<EnvironmentalEvidenceBundle> {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (!scenario) {
      throw new Error(`Replay scenario not found: ${scenarioId}`);
    }
    
    // In replay mode, the provider statuses are logically SUCCESS since we mock the availability.
    // If a scenario specifically tests missing data, it will simply lack the observation (e.g. weather = null)
    // but the bundle is correctly loaded.
    
    const retrievedAt = referenceTime; // Replay happens instantaneously at reference time
    
    const bundle: EnvironmentalEvidenceBundle = {
      school: scenario.school,
      fires: scenario.observations.fires,
      weather: scenario.observations.weather,
      aqi: scenario.observations.aqi,
      providerStatuses: { fire: "SUCCESS", weather: "SUCCESS", aqi: "SUCCESS" },
      retrievedAt,
      referenceTime,
      isSimulation: true,
      evidenceIds: [],
      dataQualitySummary: { hasMissingCriticalData: false, notes: ["Simulation dataset"] }
    };

    bundle.evidenceIds.push(...bundle.fires.map(f => f.id));
    if (bundle.weather) bundle.evidenceIds.push(bundle.weather.id);
    if (bundle.aqi) bundle.evidenceIds.push(bundle.aqi.id);

    if (!bundle.weather) {
      bundle.dataQualitySummary.hasMissingCriticalData = true;
      bundle.dataQualitySummary.notes.push("Replay dataset omitted weather data");
    }

    return bundle;
  }
}
