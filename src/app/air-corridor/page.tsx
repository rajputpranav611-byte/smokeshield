"use client";

import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { AppShell } from "@/components/layout/app-shell";
import { EnvironmentalAssessment } from "@/domain/assessment";

export default function AirCorridor() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [assessment, setAssessment] = useState<EnvironmentalAssessment | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const payload = {
          school: { id: "s1", name: "Replay School", latitude: 0, longitude: 0, timezone: "UTC", operationalPolicyReference: "P1" },
          operationalPlan: {
            id: "p1", schoolId: "s1", version: 1, createdAt: new Date().toISOString(), status: "APPROVED", policyVersion: "1",
            activities: [{ id: "a1", name: "Outdoor Assembly", startTime: new Date().toISOString(), endTime: new Date(Date.now() + 3600000).toISOString(), locationType: "OUTDOOR" }]
          },
          mode: "REPLAY",
          referenceTime: new Date().toISOString(),
          scenarioId: "SCENARIO_1_BASELINE"
        };
        const res = await fetch("/api/assessment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Failed to fetch assessment");
        setAssessment(await res.json());
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !assessment) return;

    if (map.current) {
      map.current.remove();
    }

    const { school, evidence } = assessment;

    let active = true;
    import("maplibre-gl").then(maplibregl => {
      if (!active) return;
      map.current = new maplibregl.Map({
        container: mapContainer.current!,
        style: {
          version: 8,
          sources: {
            osm: {
              type: "raster",
              tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
            }
          },
          layers: [
            {
              id: "osm",
              type: "raster",
              source: "osm",
              minzoom: 0,
              maxzoom: 19
            }
          ]
        },
        center: [school.longitude, school.latitude],
        zoom: 9
      });

      const m = map.current;

      m.on("load", () => {
        // Add School marker
        new maplibregl.Marker({ color: "#3b82f6" })
          .setLngLat([school.longitude, school.latitude])
          .setPopup(new maplibregl.Popup().setText("School: " + school.name))
          .addTo(m);

        // Add Fires
        evidence.fires.forEach(fire => {
          new maplibregl.Marker({ color: "#ef4444" })
            .setLngLat([fire.longitude, fire.latitude])
            .setPopup(new maplibregl.Popup().setText(`Satellite Fire Obs (Confidence: ${fire.confidence}%) - ${fire.source}`))
            .addTo(m);
        });

        // Simple corridor model if weather allows
        if (evidence.weather && evidence.fires.length > 0) {
          const { windDirection } = evidence.weather;
          // Invert wind direction to get where smoke goes
          const smokeDir = (windDirection + 180) % 360;
          const rad = smokeDir * (Math.PI / 180);
          
          // Very basic visual cone
          evidence.fires.forEach((fire, i) => {
            const distance = 0.5; // degrees roughly 50km
            const endLat = fire.latitude + Math.cos(rad) * distance;
            const endLng = fire.longitude + Math.sin(rad) * distance;
            
            m.addSource(`corridor-${i}`, {
              type: 'geojson',
              data: {
                type: 'Feature',
                geometry: {
                  type: 'LineString',
                  coordinates: [
                    [fire.longitude, fire.latitude],
                    [endLng, endLat]
                  ]
                },
                properties: {}
              }
            });

            m.addLayer({
              id: `corridor-layer-${i}`,
              type: 'line',
              source: `corridor-${i}`,
              layout: {
                'line-join': 'round',
                'line-cap': 'round'
              },
              paint: {
                'line-color': 'rgba(150, 150, 150, 0.6)',
                'line-width': 20,
                'line-blur': 10
              }
            });
          });
        }
      });
    });

    return () => {
      active = false;
      if (map.current) map.current.remove();
    };
  }, [assessment]);

  return (
    <AppShell>
      <div className="flex flex-col gap-8 h-[calc(100vh-12rem)]">
        <header>
          <h1 className="text-display-lg text-text-primary mb-2">Air Corridor</h1>
          <p className="text-body-md text-text-secondary">
            Modeled smoke influence based on {assessment ? (assessment.isSimulation ? 'simulated replay' : 'live data') : '...'}
          </p>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </header>

        <div className="flex-1 rounded-lg border border-border-strong bg-panel relative overflow-hidden">
          {!assessment && !error ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
              <p className="text-text-primary">Loading assessment data...</p>
            </div>
          ) : null}
          
          <div ref={mapContainer} className="w-full h-full" />
          
          {assessment && (
            <div className="absolute top-4 right-4 bg-panel border border-border-strong p-4 rounded shadow-lg max-w-sm">
              <h3 className="text-heading-sm mb-2">Corridor Information</h3>
              <p className="text-sm text-text-secondary mb-2">
                <span className="font-bold text-red-500">Note:</span> This is a calculated corridor model, not a directly measured smoke plume.
              </p>
              <ul className="text-sm space-y-1">
                <li><span className="text-text-muted">Fires:</span> {assessment.evidence.fires.length} Satellite Observations</li>
                <li><span className="text-text-muted">Wind:</span> {assessment.evidence.weather ? `${assessment.evidence.weather.windSpeed}km/h at ${assessment.evidence.weather.windDirection}°` : 'Missing Data'}</li>
              </ul>
              {assessment.dataQuality.hasMissingCriticalData && (
                <div className="mt-2 p-2 bg-red-950/30 border border-red-900 rounded">
                  <p className="text-red-400 text-xs">Insufficient data for a defensible full corridor model.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
