import { FireObservation, WeatherObservation, AirQualityObservation } from "@/types/domain";

export interface FireDataProvider {
  getFires(schoolLat: number, schoolLon: number, radiusKm: number): Promise<FireObservation[]>;
}

export interface WeatherDataProvider {
  getWeather(lat: number, lon: number): Promise<WeatherObservation | null>;
}

export interface AirQualityDataProvider {
  getAirQuality(lat: number, lon: number): Promise<AirQualityObservation | null>;
}
