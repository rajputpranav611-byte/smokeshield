"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { EnvironmentalAssessment } from "@/domain/assessment";
import { 
  AlertCircle, 
  Flame, 
  Radio, 
  RefreshCw, 
  Wind,
  Cpu
} from "lucide-react";

export default function Evidence() {
  const [assessment, setAssessment] = useState<EnvironmentalAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const payload = {
          school: { id: "s1", name: "Delhi Public School, Sector 12", latitude: 0, longitude: 0, timezone: "UTC", operationalPolicyReference: "P1" },
          operationalPlan: {
            id: "p1", schoolId: "s1", version: 1, createdAt: new Date().toISOString(), status: "APPROVED", policyVersion: "1",
            activities: [{ id: "a1", name: "Morning Assembly", startTime: new Date().toISOString(), endTime: new Date(Date.now() + 3600000).toISOString(), locationType: "OUTDOOR" }]
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
        if (!res.ok) throw new Error("Failed to fetch assessment evidence");
        setAssessment(await res.json());
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-display-md text-text-primary tracking-tight">Evidence Telemetry</h1>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-panel-elevated border border-border-strong text-text-muted">
                Audit & Provenance
              </span>
            </div>
            <p className="text-body-sm text-text-secondary mt-1">
              Distinguishing raw physical observations, satellite detections, and derived engine calculations.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-danger/10 border border-danger/40 rounded text-danger text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex h-48 items-center justify-center text-text-muted text-sm font-mono gap-2">
            <RefreshCw className="h-4 w-4 animate-spin text-primary" />
            Loading sensor telemetry & evidence records...
          </div>
        ) : assessment && (
          <div className="grid grid-cols-1 gap-6">
            {/* Section 1: NASA FIRMS Thermal Satellite Observations */}
            <Panel elevated className="border-border-strong">
              <PanelHeader className="pb-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-escalated" />
                  <PanelTitle className="text-sm font-semibold">1. NASA FIRMS Satellite Thermal Observations</PanelTitle>
                </div>
                <StatusBadge variant={assessment.providerStatuses.fire === "SUCCESS" ? "verified" : "data-gap"}>
                  {assessment.providerStatuses.fire}
                </StatusBadge>
              </PanelHeader>

              <PanelContent className="pt-4 space-y-3">
                <div className="p-3 bg-panel-elevated border border-border-subtle rounded text-xs text-text-secondary leading-relaxed">
                  <span className="text-text-primary font-semibold">Provenance Note: </span>
                  Satellite sensors (MODIS / VIIRS) detect thermal radiometric anomalies from orbit. These represent candidate fires rather than ground-confirmed blazes. Timestamps reflect satellite overpass time.
                </div>

                {assessment.evidence.fires.length === 0 ? (
                  <div className="p-4 bg-canvas border border-border-subtle rounded text-center text-xs text-text-muted">
                    No active thermal detections reported within the operational perimeter.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="border-b border-border-strong text-text-muted">
                          <th className="py-2.5 px-3">Observation ID</th>
                          <th className="py-2.5 px-3">Sensor Source</th>
                          <th className="py-2.5 px-3">Latitude, Longitude</th>
                          <th className="py-2.5 px-3">Confidence</th>
                          <th className="py-2.5 px-3">Overpass Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assessment.evidence.fires.map((fire, i) => (
                          <tr key={fire.id || i} className="border-b border-border-subtle/50 text-text-primary hover:bg-panel-elevated">
                            <td className="py-2 px-3">{fire.id}</td>
                            <td className="py-2 px-3">{fire.source}</td>
                            <td className="py-2 px-3">{fire.latitude.toFixed(4)}, {fire.longitude.toFixed(4)}</td>
                            <td className="py-2 px-3 font-semibold text-escalated">{fire.confidence ? `${fire.confidence}%` : "N/A"}</td>
                            <td className="py-2 px-3 text-text-muted">{new Date(fire.observedAt).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </PanelContent>
            </Panel>

            {/* Section 2: Weather and Wind Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Weather Observation */}
              <Panel>
                <PanelHeader className="pb-3 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wind className="h-4 w-4 text-primary" />
                    <PanelTitle className="text-sm font-semibold">2. Weather & Wind Telemetry</PanelTitle>
                  </div>
                  <StatusBadge variant={assessment.providerStatuses.weather === "SUCCESS" ? "verified" : "data-gap"}>
                    {assessment.providerStatuses.weather}
                  </StatusBadge>
                </PanelHeader>

                <PanelContent className="pt-4 space-y-3">
                  {assessment.evidence.weather ? (
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-border-subtle">
                        <span className="text-text-muted">Provider:</span>
                        <span className="font-mono text-text-primary">{assessment.evidence.weather.source} (Open-Meteo)</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-border-subtle">
                        <span className="text-text-muted">Wind Speed:</span>
                        <span className="font-mono font-semibold text-text-primary">{assessment.evidence.weather.windSpeed} km/h</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-border-subtle">
                        <span className="text-text-muted">Wind Bearing:</span>
                        <span className="font-mono font-semibold text-text-primary">{assessment.evidence.weather.windDirection}°</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-border-subtle">
                        <span className="text-text-muted">Freshness:</span>
                        <span className="font-mono text-text-primary">{assessment.evidence.weather.freshnessMinutes} minutes</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-text-muted">Observation Time:</span>
                        <span className="font-mono text-text-muted">{new Date(assessment.evidence.weather.observedAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-canvas border border-border-subtle rounded text-xs text-text-muted">
                      Weather data unavailable. Risk engine operates under radial proximity precaution.
                    </div>
                  )}
                </PanelContent>
              </Panel>

              {/* Air Quality Station */}
              <Panel>
                <PanelHeader className="pb-3 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="h-4 w-4 text-watch" />
                    <PanelTitle className="text-sm font-semibold">3. Ground Station AQI (CPCB)</PanelTitle>
                  </div>
                  <StatusBadge variant={
                    assessment.providerStatuses.aqi === "SUCCESS" ? "verified" : 
                    assessment.providerStatuses.aqi === "NOT_CONFIGURED" ? "watch" : "data-gap"
                  }>
                    {assessment.providerStatuses.aqi}
                  </StatusBadge>
                </PanelHeader>

                <PanelContent className="pt-4 space-y-3">
                  {assessment.evidence.aqi ? (
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-border-subtle">
                        <span className="text-text-muted">Regulatory Monitor:</span>
                        <span className="font-mono text-text-primary">{assessment.evidence.aqi.source}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-border-subtle">
                        <span className="text-text-muted">AQI Value:</span>
                        <span className="font-mono font-semibold text-text-primary">{assessment.evidence.aqi.aqi}</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-text-muted">Freshness:</span>
                        <span className="font-mono text-text-primary">{assessment.evidence.aqi.freshnessMinutes} mins</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-canvas border border-border-strong rounded text-xs space-y-2">
                      <div className="flex items-center gap-1.5 text-watch font-semibold">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>AQI Ground Monitor Unconfigured</span>
                      </div>
                      <p className="text-text-muted text-[11px] leading-relaxed">
                        Physical CPCB air quality monitor API is not linked for this school. SmokeShield does not fabricate sensor readings or claim certified air standards without physical ground sensors.
                      </p>
                    </div>
                  )}
                </PanelContent>
              </Panel>
            </div>

            {/* Section 4: Modeled Estimates & Risk Engine Assumptions */}
            <Panel>
              <PanelHeader className="pb-3 border-b border-border flex items-center gap-2">
                <Cpu className="h-4 w-4 text-info" />
                <PanelTitle className="text-sm font-semibold">4. Modeled Estimates & Derived Risk Engine Calculations</PanelTitle>
              </PanelHeader>

              <PanelContent className="pt-4">
                <p className="text-xs text-text-secondary leading-relaxed mb-4">
                  These values are calculated mathematically from the physical observations above. They are not direct measurements.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
                  <div className="p-3 bg-canvas border border-border-subtle rounded">
                    <span className="text-text-muted text-[11px] block mb-1">Calculated Overlap</span>
                    <span className="text-base font-bold text-text-primary">
                      {Math.round(assessment.riskAssessment.overlapMinutes)} mins
                    </span>
                  </div>
                  <div className="p-3 bg-canvas border border-border-subtle rounded">
                    <span className="text-text-muted text-[11px] block mb-1">Algorithm Confidence</span>
                    <span className="text-base font-bold text-text-primary">
                      {(assessment.riskAssessment.confidenceScore * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="p-3 bg-canvas border border-border-subtle rounded">
                    <span className="text-text-muted text-[11px] block mb-1">Model Version</span>
                    <span className="text-base font-bold text-text-primary">
                      v{assessment.riskAssessment.modelVersion}
                    </span>
                  </div>
                  <div className="p-3 bg-canvas border border-border-subtle rounded">
                    <span className="text-text-muted text-[11px] block mb-1">Execution Mode</span>
                    <span className="text-base font-bold text-text-primary">
                      {assessment.isSimulation ? "Deterministic Replay" : "Live Sensor"}
                    </span>
                  </div>
                </div>
              </PanelContent>
            </Panel>
          </div>
        )}
      </div>
    </AppShell>
  );
}
