"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { EnvironmentalAssessment } from "@/domain/assessment";

export default function Evidence() {
  const [assessment, setAssessment] = useState<EnvironmentalAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const payload = {
          school: { id: "s1", name: "Replay School", latitude: 0, longitude: 0, timezone: "UTC", operationalPolicyReference: "P1" },
          operationalPlan: {
            id: "p1", schoolId: "s1", version: 1, createdAt: new Date().toISOString(), status: "APPROVED", policyVersion: "1",
            activities: [{ id: "a1", name: "Outdoor PE", startTime: new Date().toISOString(), endTime: new Date(Date.now() + 3600000).toISOString(), locationType: "OUTDOOR" }]
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
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <header>
          <h1 className="text-display-lg text-text-primary mb-2">Evidence Telemetry</h1>
          <p className="text-body-md text-text-secondary">Raw provider observations vs modeled estimates.</p>
        </header>

        {error && (
          <div className="p-4 bg-red-950/20 border border-red-900 rounded">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {loading && <p className="text-text-muted">Loading telemetry...</p>}

        {assessment && (
          <div className="grid grid-cols-1 gap-6">
            <Panel>
              <PanelHeader>
                <PanelTitle className="flex justify-between w-full pr-4">
                  <span>NASA FIRMS Active Fires</span>
                  <StatusBadge variant={assessment.providerStatuses.fire === "SUCCESS" ? "verified" : "data-gap"}>
                    {assessment.providerStatuses.fire}
                  </StatusBadge>
                </PanelTitle>
              </PanelHeader>
              <PanelContent>
                <p className="text-sm text-text-muted mb-4">Note: Satellite observations denote thermal anomalies. They are not confirmed ground fires.</p>
                {assessment.evidence.fires.length === 0 ? (
                  <p className="text-text-secondary">No active fires detected in radius.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-text-primary">
                      <thead>
                        <tr className="border-b border-border-strong">
                          <th className="py-2">Source</th>
                          <th className="py-2">Coordinates</th>
                          <th className="py-2">Confidence</th>
                          <th className="py-2">Observed At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assessment.evidence.fires.map((fire, i) => (
                          <tr key={i} className="border-b border-border-strong/50">
                            <td className="py-2">{fire.source}</td>
                            <td className="py-2">{fire.latitude.toFixed(4)}, {fire.longitude.toFixed(4)}</td>
                            <td className="py-2">{fire.confidence ? `${fire.confidence}%` : 'N/A'}</td>
                            <td className="py-2">{new Date(fire.observedAt).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </PanelContent>
            </Panel>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Panel>
                <PanelHeader>
                  <PanelTitle className="flex justify-between w-full pr-4">
                    <span>Weather Data</span>
                    <StatusBadge variant={assessment.providerStatuses.weather === "SUCCESS" ? "verified" : "data-gap"}>
                      {assessment.providerStatuses.weather}
                    </StatusBadge>
                  </PanelTitle>
                </PanelHeader>
                <PanelContent>
                  {assessment.evidence.weather ? (
                    <ul className="space-y-2 text-sm">
                      <li><span className="text-text-muted">Source:</span> {assessment.evidence.weather.source}</li>
                      <li><span className="text-text-muted">Wind Speed:</span> {assessment.evidence.weather.windSpeed} km/h</li>
                      <li><span className="text-text-muted">Wind Direction:</span> {assessment.evidence.weather.windDirection}°</li>
                      <li><span className="text-text-muted">Temperature:</span> {assessment.evidence.weather.temperature}°C</li>
                      <li><span className="text-text-muted">Freshness:</span> {assessment.evidence.weather.freshnessMinutes} mins</li>
                      <li><span className="text-text-muted">Observed At:</span> {new Date(assessment.evidence.weather.observedAt).toLocaleString()}</li>
                    </ul>
                  ) : (
                    <p className="text-text-secondary">Weather telemetry unavailable.</p>
                  )}
                </PanelContent>
              </Panel>

              <Panel>
                <PanelHeader>
                  <PanelTitle className="flex justify-between w-full pr-4">
                    <span>Air Quality (CPCB)</span>
                    <StatusBadge variant={assessment.providerStatuses.aqi === "SUCCESS" ? "verified" : assessment.providerStatuses.aqi === "NOT_CONFIGURED" ? "watch" : "data-gap"}>
                      {assessment.providerStatuses.aqi}
                    </StatusBadge>
                  </PanelTitle>
                </PanelHeader>
                <PanelContent>
                  <p className="text-sm text-text-muted mb-4">Regulatory AQI monitors (e.g. CPCB) provide ground-truth context to modeled risk.</p>
                  {assessment.evidence.aqi ? (
                    <ul className="space-y-2 text-sm">
                      <li><span className="text-text-muted">Source:</span> {assessment.evidence.aqi.source}</li>
                      <li><span className="text-text-muted">AQI:</span> {assessment.evidence.aqi.aqi}</li>
                      <li><span className="text-text-muted">Freshness:</span> {assessment.evidence.aqi.freshnessMinutes} mins</li>
                      <li><span className="text-text-muted">Observed At:</span> {new Date(assessment.evidence.aqi.observedAt).toLocaleString()}</li>
                    </ul>
                  ) : (
                    <div className="p-4 bg-gray-900 border border-border-strong rounded">
                      <p className="text-text-secondary mb-1 font-semibold">Data Unavailable</p>
                      <p className="text-text-muted text-xs">No direct measurements could be obtained. Do not invent measurements.</p>
                    </div>
                  )}
                </PanelContent>
              </Panel>
            </div>
            
            <Panel>
              <PanelHeader>
                <PanelTitle>Modeled Estimates</PanelTitle>
              </PanelHeader>
              <PanelContent>
                <p className="text-sm text-text-secondary mb-4">
                  Based on the raw observations above, the deterministic Risk Engine computes the following model estimates. These are calculations, not raw telemetry.
                </p>
                <ul className="text-sm space-y-2">
                  <li><span className="text-text-muted">Activity Overlap:</span> {assessment.riskAssessment.overlapMinutes} minutes</li>
                  <li><span className="text-text-muted">Engine Confidence:</span> {(assessment.riskAssessment.confidenceScore * 100).toFixed(0)}%</li>
                  <li><span className="text-text-muted">Engine Version:</span> {assessment.riskAssessment.modelVersion}</li>
                  <li><span className="text-text-muted">Simulation Mode:</span> {assessment.isSimulation ? 'Yes' : 'No'}</li>
                </ul>
              </PanelContent>
            </Panel>
          </div>
        )}
      </div>
    </AppShell>
  );
}
