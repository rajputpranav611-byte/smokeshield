"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { EnvironmentalAssessment } from "@/domain/assessment";

export default function PlanStudio() {
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:00");
  const [scenarioId, setScenarioId] = useState("SCENARIO_1_BASELINE");
  const [assessment, setAssessment] = useState<EnvironmentalAssessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEvaluate = async () => {
    setLoading(true);
    setError(null);
    setAssessment(null);

    // Convert HH:MM to ISO string relative to today
    const now = new Date();
    const startParts = startTime.split(':');
    const endParts = endTime.split(':');

    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(startParts[0]), parseInt(startParts[1]));
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(endParts[0]), parseInt(endParts[1]));

    const payload = {
      school: {
        id: "s1", name: "Replay School", latitude: 0, longitude: 0, timezone: "UTC", operationalPolicyReference: "P1"
      },
      operationalPlan: {
        id: "p1", schoolId: "s1", version: 1, createdAt: new Date().toISOString(), status: "DRAFT", policyVersion: "1",
        activities: [
          { id: "a1", name: "Outdoor Assembly", startTime: startDate.toISOString(), endTime: endDate.toISOString(), locationType: "OUTDOOR" }
        ]
      },
      mode: "REPLAY",
      referenceTime: new Date().toISOString(),
      scenarioId
    };

    try {
      const res = await fetch("/api/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = await res.json();
      setAssessment(data);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg || "Failed to evaluate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <header>
          <h1 className="text-display-lg text-text-primary mb-2">Plan Studio</h1>
          <p className="text-body-md text-text-secondary">What-if planner.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 flex flex-col gap-6">
            <Panel>
              <PanelHeader>
                <PanelTitle>Activity Controls</PanelTitle>
              </PanelHeader>
              <PanelContent className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Scenario</label>
                  <select
                    value={scenarioId}
                    onChange={e => setScenarioId(e.target.value)}
                    className="w-full bg-background border border-border-strong rounded p-2 text-text-primary"
                  >
                    <option value="SCENARIO_1_BASELINE">Baseline Overlap</option>
                    <option value="SCENARIO_2_WIND_SHIFT">Wind Shift</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Activity: Outdoor Assembly</label>
                  <div className="flex gap-2">
                    <input
                      type="time"
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      className="bg-background border border-border-strong rounded p-2 text-text-primary w-full"
                    />
                    <span className="text-text-muted self-center">to</span>
                    <input
                      type="time"
                      value={endTime}
                      onChange={e => setEndTime(e.target.value)}
                      className="bg-background border border-border-strong rounded p-2 text-text-primary w-full"
                    />
                  </div>
                </div>
                <Button onClick={handleEvaluate} disabled={loading}>
                  {loading ? "Evaluating..." : "Recalculate Assessment"}
                </Button>
                {error && <p className="text-red-500 text-sm">{error}</p>}
              </PanelContent>
            </Panel>
          </div>

          <div className="lg:col-span-8 flex flex-col gap-6">
            <Panel>
              <PanelHeader>
                <PanelTitle>Assessment Results</PanelTitle>
              </PanelHeader>
              <PanelContent>
                {assessment ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-start border-b border-border-strong pb-4">
                      <div>
                        <h3 className="text-heading-lg mb-1">{assessment.recommendation.action}</h3>
                        <p className="text-text-secondary">{assessment.recommendation.rationale}</p>
                      </div>
                      <StatusBadge variant={assessment.dataQuality.hasMissingCriticalData ? "data-gap" : assessment.recommendation.action === "NO_CHANGE" ? "verified" : "escalated"}>
                        {assessment.dataQuality.hasMissingCriticalData ? "DATA GAP" : assessment.riskAssessment.confidenceScore > 0.8 ? "HIGH CONFIDENCE" : "LOW CONFIDENCE"}
                      </StatusBadge>
                    </div>
                    <div>
                      <p className="text-label text-text-muted mb-2">RISK METRICS</p>
                      <ul className="text-body-md text-text-primary space-y-2">
                        <li>Overlap Minutes: <span className="font-bold">{assessment.riskAssessment.overlapMinutes}</span></li>
                        <li>Confidence Score: <span className="font-bold">{(assessment.riskAssessment.confidenceScore * 100).toFixed(0)}%</span></li>
                        <li>Data Health: {assessment.dataQuality.hasMissingCriticalData ? "Missing Critical Data" : "Healthy"}</li>
                      </ul>
                      {assessment.dataQuality.notes.length > 0 && (
                        <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded text-yellow-200 text-sm">
                          {assessment.dataQuality.notes.map((n, i) => <p key={i}>{n}</p>)}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-text-muted">
                    {loading ? "Calculating..." : "Adjust controls and click Recalculate to see deterministic outcome."}
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
