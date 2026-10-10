"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { EnvironmentalAssessment } from "@/domain/assessment";

export default function Replay() {
  const [assessment, setAssessment] = useState<EnvironmentalAssessment | null>(null);
  const [scenarioId, setScenarioId] = useState("SCENARIO_1_BASELINE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const payload = {
          school: { id: "s1", name: "Replay School", latitude: 0, longitude: 0, timezone: "UTC", operationalPolicyReference: "P1" },
          operationalPlan: {
            id: "p1", schoolId: "s1", version: 1, createdAt: new Date().toISOString(), status: "APPROVED", policyVersion: "1",
            activities: [{ id: "a1", name: "Outdoor PE", startTime: new Date().toISOString(), endTime: new Date(Date.now() + 3600000).toISOString(), locationType: "OUTDOOR" }]
          },
          mode: "REPLAY",
          referenceTime: new Date().toISOString(),
          scenarioId
        };
        const res = await fetch("/api/assessment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Failed to fetch replay data");
        setAssessment(await res.json());
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [scenarioId]);

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <header>
          <h1 className="text-display-lg text-text-primary mb-2">Replay & Simulation</h1>
          <p className="text-body-md text-text-secondary">Historical and deterministic replay scenarios.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 flex flex-col gap-6">
            <Panel>
              <PanelHeader>
                <PanelTitle>Playback Controls</PanelTitle>
              </PanelHeader>
              <PanelContent className="flex flex-col gap-4">
                <p className="text-sm text-text-muted">Select a historical snapshot to deterministically replay the risk engine.</p>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Scenario</label>
                  <select 
                    value={scenarioId} 
                    onChange={e => setScenarioId(e.target.value)}
                    className="w-full bg-background border border-border-strong rounded p-2 text-text-primary"
                  >
                    <option value="SCENARIO_1_BASELINE">Baseline (Clear Conditions)</option>
                    <option value="SCENARIO_2_WIND_SHIFT">Wind Shift (Increasing Overlap)</option>
                    <option value="SCENARIO_NO_DATA">Missing Telemetry (Data Gap)</option>
                  </select>
                </div>
                {loading && <p className="text-text-muted text-sm">Loading scenario...</p>}
                {error && <p className="text-red-500 text-sm">{error}</p>}
                
                <div className="mt-4 p-3 border border-border-strong rounded bg-panel-hover text-xs text-text-muted">
                  <span className="block font-bold text-text-primary mb-1">Data Provenance</span>
                  Inputs (Fires, Weather) are static historical records loaded from memory. The Risk Engine execution is live and deterministic. No external providers are called during REPLAY.
                </div>
              </PanelContent>
            </Panel>
          </div>

          <div className="lg:col-span-8 flex flex-col gap-6">
            <Panel>
              <PanelHeader>
                <PanelTitle>Replay Engine Results</PanelTitle>
              </PanelHeader>
              <PanelContent>
                {!assessment ? (
                  <div className="text-center py-12 text-text-muted">Waiting for playback data...</div>
                ) : (
                  <div className="flex flex-col gap-6">
                    <div className="flex justify-between border-b border-border-strong pb-4">
                      <div>
                        <h3 className="text-heading-sm mb-1">Risk Overlap</h3>
                        <p className="text-display-md">{assessment.riskAssessment.overlapMinutes} <span className="text-sm text-text-muted">minutes</span></p>
                      </div>
                      <div className="text-right">
                        <h3 className="text-heading-sm mb-1">Simulation Mode</h3>
                        <p className="text-green-400 font-bold">{assessment.isSimulation ? 'ACTIVE' : 'INACTIVE'}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-text-primary mb-2">Historical Telemetry Loaded:</h4>
                      <ul className="text-sm space-y-1 text-text-secondary">
                        <li><span className="text-text-muted">Fires:</span> {assessment.evidence.fires.length} active anomalies</li>
                        <li><span className="text-text-muted">Weather:</span> {assessment.evidence.weather ? `${assessment.evidence.weather.windSpeed} km/h at ${assessment.evidence.weather.windDirection}°` : 'Missing Data'}</li>
                        <li><span className="text-text-muted">AQI:</span> {assessment.evidence.aqi ? assessment.evidence.aqi.aqi : 'Missing Data'}</li>
                      </ul>
                    </div>
                  </div>
                )}
              </PanelContent>
            </Panel>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
