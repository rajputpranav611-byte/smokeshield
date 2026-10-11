"use client";

import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { AppShell } from "@/components/layout/app-shell";
import { EnvironmentalAssessment } from "@/domain/assessment";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { 
  Flame, 
  Wind, 
  Layers, 
  ShieldAlert, 
  RefreshCw, 
  Info,
  Compass
} from "lucide-react";

export default function AirCorridor() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<{ remove: () => void } | null>(null);
  const [assessment, setAssessment] = useState<EnvironmentalAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFireId, setSelectedFireId] = useState<string | null>(null);
  const [showModelCorridor, setShowModelCorridor] = useState(true);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        school: { id: "s1", name: "Replay School", latitude: 0, longitude: 0, timezone: "UTC", operationalPolicyReference: "P1" },
        operationalPlan: {
          id: "p1", schoolId: "s1", version: 1, createdAt: "2026-10-10T07:00:00Z", status: "APPROVED", policyVersion: "1",
          activities: [{ id: "a1", name: "Outdoor Assembly", startTime: "2026-10-10T08:00:00Z", endTime: "2026-10-10T09:00:00Z", locationType: "OUTDOOR" }]
        },
        mode: "REPLAY",
        referenceTime: "2026-10-10T07:00:00Z",
        scenarioId: "SCENARIO_1_BASELINE"
      };
      const res = await fetch("/api/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to fetch assessment");
      const data = await res.json();
      setAssessment(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const payload = {
          school: { id: "s1", name: "Replay School", latitude: 0, longitude: 0, timezone: "UTC", operationalPolicyReference: "P1" },
          operationalPlan: {
            id: "p1", schoolId: "s1", version: 1, createdAt: "2026-10-10T07:00:00Z", status: "APPROVED", policyVersion: "1",
            activities: [{ id: "a1", name: "Outdoor Assembly", startTime: "2026-10-10T08:00:00Z", endTime: "2026-10-10T09:00:00Z", locationType: "OUTDOOR" }]
          },
          mode: "REPLAY",
          referenceTime: "2026-10-10T07:00:00Z",
          scenarioId: "SCENARIO_1_BASELINE"
        };
        const res = await fetch("/api/assessment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Failed to fetch assessment");
        const data = await res.json();
        if (!ignore) {
          setAssessment(data);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : String(err));
          setLoading(false);
        }
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !assessment) return;

    if (map.current) {
      map.current.remove();
      map.current = null;
    }

    const { school, evidence } = assessment;

    let active = true;
    import("maplibre-gl").then((maplibregl) => {
      if (!active || !mapContainer.current) return;

      // Provide explicitly resolved worker URL for Next.js Turbopack via setWorkerUrl
      if (typeof maplibregl.setWorkerUrl === "function") {
        maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");
      }

      // Dark styled tile basemap (CartoDB dark_all with provided key)
      const m = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            "carto-dark": {
              type: "raster",
              tiles: [
                "https://a.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png?key=cb1_3t48_1_08d6186afe190a4115e71a86",
                "https://b.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png?key=cb1_3t48_1_08d6186afe190a4115e71a86",
                "https://c.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png?key=cb1_3t48_1_08d6186afe190a4115e71a86"
              ],
              tileSize: 256,
              attribution: "&copy; OpenStreetMap &copy; CARTO"
            }
          },
          layers: [
            {
              id: "carto-dark-layer",
              type: "raster",
              source: "carto-dark",
              minzoom: 0,
              maxzoom: 19
            }
          ]
        },
        center: [school.longitude, school.latitude + 0.05],
        zoom: 10
      });

      map.current = m;

      // Add navigation controls
      m.addControl(new maplibregl.NavigationControl({ showCompass: true, showZoom: true }), "bottom-right");

      m.on("load", () => {
        if (!active) return;

        // Custom HTML Marker for School
        const schoolEl = document.createElement("div");
        schoolEl.className = "flex items-center justify-center";
        schoolEl.innerHTML = `
          <div style="background: #11171C; border: 2px solid #76D39A; border-radius: 9999px; padding: 6px; box-shadow: 0 0 12px rgba(118, 211, 154, 0.5); display: flex; align-items: center; justify-content: center;">
            <div style="width: 10px; height: 10px; background: #76D39A; border-radius: 9999px;"></div>
          </div>
        `;
        new maplibregl.Marker({ element: schoolEl })
          .setLngLat([school.longitude, school.latitude])
          .setPopup(
            new maplibregl.Popup({ offset: 15, closeButton: false }).setHTML(`
              <div style="background: #11171C; color: #F3F6F8; padding: 6px 10px; font-family: Inter, sans-serif; font-size: 12px; border-radius: 6px; border: 1px solid #3A4751;">
                <div style="font-weight: 600; color: #76D39A;">${school.name}</div>
                <div style="color: #AAB5BE; font-size: 11px;">Target Facility (Protected Node)</div>
              </div>
            `)
          )
          .addTo(m);

        // Add Active Fire Markers
        evidence.fires.forEach((fire) => {
          const fireEl = document.createElement("div");
          fireEl.className = "cursor-pointer";
          fireEl.innerHTML = `
            <div style="background: rgba(255, 107, 74, 0.2); border: 1.5px solid #FF6B4A; border-radius: 9999px; padding: 5px; box-shadow: 0 0 10px rgba(255, 107, 74, 0.6); display: flex; align-items: center; justify-content: center;">
              <div style="width: 8px; height: 8px; background: #FF6B4A; border-radius: 9999px;"></div>
            </div>
          `;
          fireEl.addEventListener("click", () => {
            setSelectedFireId(fire.id);
          });

          new maplibregl.Marker({ element: fireEl })
            .setLngLat([fire.longitude, fire.latitude])
            .setPopup(
              new maplibregl.Popup({ offset: 15, closeButton: false }).setHTML(`
                <div style="background: #11171C; color: #F3F6F8; padding: 6px 10px; font-family: Inter, sans-serif; font-size: 12px; border-radius: 6px; border: 1px solid #3A4751;">
                  <div style="font-weight: 600; color: #FF6B4A;">Satellite Fire Observation</div>
                  <div style="color: #AAB5BE; font-size: 11px;">Confidence: ${fire.confidence}% | Source: ${fire.source}</div>
                  <div style="color: #73808A; font-size: 10px; margin-top: 2px;">Observed: ${new Date(fire.observedAt).toLocaleTimeString()}</div>
                </div>
              `)
            )
            .addTo(m);
        });

        // Add Modeled Smoke Influence Corridor (Deterministic Cone)
        if (showModelCorridor && evidence.weather && evidence.fires.length > 0) {
          const { windDirection } = evidence.weather;
          // Smoke travels toward (windDirection + 180) degrees
          const smokeDirection = (windDirection + 180) % 360;
          const rad = smokeDirection * (Math.PI / 180);
          
          evidence.fires.forEach((fire, i) => {
            // Corridor projection 45 km (~0.4 degrees)
            const distance = 0.45;
            const spreadRad = 20 * (Math.PI / 180); // 20-degree half-width tolerance

            const leftRad = rad - spreadRad;
            const rightRad = rad + spreadRad;

            const p1 = [fire.longitude, fire.latitude];
            const p2 = [fire.longitude + Math.sin(leftRad) * distance, fire.latitude + Math.cos(leftRad) * distance];
            const p3 = [fire.longitude + Math.sin(rightRad) * distance, fire.latitude + Math.cos(rightRad) * distance];

            const polygonCoords = [p1, p2, p3, p1];

            m.addSource(`corridor-cone-${i}`, {
              type: "geojson",
              data: {
                type: "Feature",
                geometry: {
                  type: "Polygon",
                  coordinates: [polygonCoords]
                },
                properties: {}
              }
            });

            // Fill Layer
            m.addLayer({
              id: `corridor-fill-${i}`,
              type: "fill",
              source: `corridor-cone-${i}`,
              paint: {
                "fill-color": "#A6E3B5",
                "fill-opacity": 0.15
              }
            });

            // Outline Layer
            m.addLayer({
              id: `corridor-line-${i}`,
              type: "line",
              source: `corridor-cone-${i}`,
              paint: {
                "line-color": "#76D39A",
                "line-width": 1.5,
                "line-dasharray": [2, 2],
                "line-opacity": 0.7
              }
            });
          });
        }
      });
    });

    return () => {
      active = false;
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [assessment, showModelCorridor]);

  const weather = assessment?.evidence.weather;

  return (
    <AppShell>
      <div className="flex flex-col gap-6 h-[calc(100vh-8.5rem)]">
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-display-md text-text-primary tracking-tight">Air Corridor</h1>
              <StatusBadge variant={assessment?.riskAssessment.overlapMinutes && assessment.riskAssessment.overlapMinutes > 0 ? "escalated" : "verified"}>
                {assessment?.riskAssessment.overlapMinutes && assessment.riskAssessment.overlapMinutes > 0 ? "Corridor Active" : "Clear Corridor"}
              </StatusBadge>
              {assessment?.isSimulation && (
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-panel-elevated border border-border-strong text-text-muted">
                  Deterministic Replay
                </span>
              )}
            </div>
            <p className="text-body-sm text-text-secondary mt-1">
              Modeled potential smoke-influence corridor and verified satellite thermal detections.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowModelCorridor(!showModelCorridor)}
              className="text-xs flex items-center gap-1.5"
            >
              <Layers className="h-3.5 w-3.5" />
              {showModelCorridor ? "Hide Model Corridor" : "Show Model Corridor"}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadData}
              disabled={loading}
              className="text-xs flex items-center gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Workspace: 12-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
          {/* Main Map Viewport */}
          <div className="lg:col-span-8 flex flex-col h-full rounded-md border border-border-strong bg-panel relative overflow-hidden shadow-inner">
            {/* Tile/Data Loading overlay */}
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-canvas/80 z-20 backdrop-blur-xs">
                <div className="flex items-center gap-3 text-text-secondary text-sm">
                  <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                  Loading spatial observations & corridor model...
                </div>
              </div>
            )}

            {/* Error Overlay */}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-canvas/90 z-20 p-6 text-center">
                <ShieldAlert className="h-8 w-8 text-escalated mb-2" />
                <h3 className="text-text-primary font-semibold text-sm">Spatial Telemetry Unavailable</h3>
                <p className="text-text-muted text-xs max-w-sm mt-1 mb-4">{error}</p>
                <Button variant="outline" size="sm" onClick={loadData}>Retry Connection</Button>
              </div>
            )}

            {/* Map Container */}
            <div ref={mapContainer} className="w-full h-full" />

            {/* Over-Map HUD - Floating Top Left: Scientific Disclaimer */}
            <div className="absolute top-3 left-3 z-10 bg-panel/75 border border-border-strong/60 px-3 py-2 rounded-sm backdrop-blur-md shadow-lg max-w-xs pointer-events-none">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary">
                <Info className="h-3.5 w-3.5 text-info shrink-0" />
                <span>Deterministic Atmospheric Model</span>
              </div>
              <p className="text-[11px] text-text-muted mt-0.5 leading-snug">
                The corridor cone is calculated from wind direction and speed. It is an influence projection, not a measured smoke plume.
              </p>
            </div>

            {/* Over-Map HUD - Floating Bottom Left: Legend */}
            <div className="absolute bottom-3 left-3 z-10 bg-panel/85 border border-border-strong/70 p-3 rounded-sm backdrop-blur-md shadow-lg space-y-2 pointer-events-auto">
              <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Spatial Legend</div>
              <div className="flex flex-col gap-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-verified border border-text-primary shrink-0"></span>
                  <span className="text-text-primary">Target School Node</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-danger border border-escalated shrink-0"></span>
                  <span className="text-text-secondary">NASA FIRMS Thermal Detection</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-1.5 border border-dashed border-primary bg-primary/20 shrink-0"></span>
                  <span className="text-text-secondary">Modeled Smoke Influence Cone</span>
                </div>
              </div>
            </div>
          </div>

          {/* Side Telemetry & Selected Evidence Panel */}
          <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto pr-1">
            {/* Atmospheric Telemetry Panel */}
            <div className="rounded-md border border-border bg-panel p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div className="flex items-center gap-2">
                  <Wind className="h-4 w-4 text-primary" />
                  <span className="text-heading-sm text-text-primary text-sm font-semibold">Wind Vector</span>
                </div>
                {weather ? (
                  <span className="text-xs font-mono text-text-muted">
                    Freshness: {weather.freshnessMinutes}m
                  </span>
                ) : (
                  <StatusBadge variant="data-gap">Missing</StatusBadge>
                )}
              </div>

              {weather ? (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-canvas border border-border-subtle p-2.5 rounded">
                    <span className="text-[11px] text-text-muted uppercase tracking-wider block">Wind Speed</span>
                    <span className="text-lg font-mono font-semibold text-text-primary">{weather.windSpeed}</span>
                    <span className="text-xs text-text-secondary ml-1">km/h</span>
                  </div>
                  <div className="bg-canvas border border-border-subtle p-2.5 rounded">
                    <span className="text-[11px] text-text-muted uppercase tracking-wider block">Wind Direction</span>
                    <span className="text-lg font-mono font-semibold text-text-primary">{weather.windDirection}°</span>
                    <span className="text-xs text-text-secondary ml-1">({weather.windDirection === 0 ? "N" : weather.windDirection === 180 ? "S" : `${weather.windDirection}°`})</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-text-muted">No valid weather telemetry available. Engine falls back to radial proximity precaution.</p>
              )}
            </div>

            {/* Fire Observation Summary */}
            <div className="rounded-md border border-border bg-panel p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-escalated" />
                  <span className="text-heading-sm text-text-primary text-sm font-semibold">Fire Evidence</span>
                </div>
                <span className="text-xs font-mono text-text-primary bg-panel-elevated px-2 py-0.5 rounded border border-border-strong">
                  {assessment?.evidence.fires.length || 0} Detections
                </span>
              </div>

              {assessment && assessment.evidence.fires.length > 0 ? (
                <div className="space-y-2">
                  {assessment.evidence.fires.map((fire, idx) => (
                    <div 
                      key={fire.id || idx}
                      onClick={() => setSelectedFireId(fire.id)}
                      className={`p-3 rounded border text-xs cursor-pointer transition-colors ${
                        selectedFireId === fire.id 
                          ? "border-primary bg-panel-elevated" 
                          : "border-border-subtle bg-canvas hover:border-border-strong"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-text-primary flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-escalated"></span>
                          Observation #{idx + 1}
                        </span>
                        <span className="font-mono text-text-muted">Confidence {fire.confidence}%</span>
                      </div>
                      <div className="text-[11px] text-text-muted font-mono flex justify-between">
                        <span>Lat: {fire.latitude.toFixed(4)}, Lon: {fire.longitude.toFixed(4)}</span>
                        <span>{fire.source}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-canvas border border-border-subtle rounded text-center">
                  <p className="text-xs text-text-muted">No thermal anomalies detected within operational perimeter.</p>
                </div>
              )}
            </div>

            {/* Model Derivation & Limitations */}
            <div className="rounded-md border border-border bg-panel p-4 flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                <Compass className="h-3.5 w-3.5 text-text-muted" />
                <span>Engine Verification</span>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                {assessment?.riskAssessment.overlapMinutes && assessment.riskAssessment.overlapMinutes > 0
                  ? `Deterministic corridor overlaps scheduled outdoor activities by ${Math.round(assessment.riskAssessment.overlapMinutes)} minutes. Review scheduled outdoor assembly in Plan Studio.`
                  : "Current wind vector guides smoke influence away from school grounds. No active overlap detected."}
              </p>
              {assessment?.dataQuality.hasMissingCriticalData && (
                <div className="mt-1 p-2.5 bg-data-gap/10 border border-data-gap/30 rounded text-[11px] text-data-gap">
                  Critical data gaps detected. Directional calculations require verified wind and thermal observations.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
