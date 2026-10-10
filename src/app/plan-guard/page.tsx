"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { EnvironmentalAssessment } from "@/domain/assessment";
import { VerificationStatus } from "@/types/domain";

export default function PlanGuard() {
  const [approvedAssessment, setApprovedAssessment] = useState<EnvironmentalAssessment | null>(null);
  const [latestAssessment, setLatestAssessment] = useState<EnvironmentalAssessment | null>(null);
  const [scenarioId, setScenarioId] = useState("SCENARIO_1_BASELINE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [summary, setSummary] = useState<string>("");

  const school = { id: "s1", name: "Replay School", latitude: 0, longitude: 0, timezone: "UTC", operationalPolicyReference: "P1" };
  const operationalPlan = {
    id: "p1", schoolId: "s1", version: 1, createdAt: "2026-10-10T07:00:00Z", status: "APPROVED", policyVersion: "1",
    activities: [{ id: "a1", name: "Outdoor Assembly", startTime: "2026-10-10T08:00:00Z", endTime: "2026-10-10T09:00:00Z", locationType: "OUTDOOR" }]
  };

  const evaluateGuard = async () => {
    setLoading(true);
    setError(null);
    setVerificationStatus(null);

    try {
      // 1. Fetch approved state (simulated as SCENARIO_1_BASELINE)
      const resApproved = await fetch("/api/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ school, operationalPlan, mode: "REPLAY", referenceTime: new Date().toISOString(), scenarioId: "SCENARIO_1_BASELINE" })
      });
      if (!resApproved.ok) throw new Error("Failed to fetch approved assessment");
      const appAst = await resApproved.json();
      setApprovedAssessment(appAst);

      // 2. Fetch latest morning state (simulated using selected scenario)
      const resLatest = await fetch("/api/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ school, operationalPlan, mode: "REPLAY", referenceTime: new Date().toISOString(), scenarioId })
      });
      if (!resLatest.ok) throw new Error("Failed to fetch latest assessment");
      const latAst = await resLatest.json();
      setLatestAssessment(latAst);

      // 3. Apply PlanGuard Logic (same as AWS handler)
      let status: VerificationStatus = "VERIFIED";
      let msg = "Conditions remain within approved bounds.";
      
      const { dataQuality, riskAssessment: currentRisk } = latAst;
      const { riskAssessment: approvedRisk } = appAst;

      if (dataQuality.hasMissingCriticalData || currentRisk.confidenceScore < 0.5) {
        status = "DATA_GAP";
        msg = "Insufficient data confidence for automatic verification: " + dataQuality.notes.join(", ");
      } else if (currentRisk.overlapMinutes > approvedRisk.overlapMinutes + 15) {
        status = "ESCALATED";
        msg = `Predicted overlap materially increased from ${approvedRisk.overlapMinutes} to ${currentRisk.overlapMinutes} minutes. Human review required.`;
      } else if (currentRisk.overlapMinutes > 0 && currentRisk.overlapMinutes > approvedRisk.overlapMinutes) {
        status = "WATCH";
        msg = "Conditions changed. Monitoring active.";
      } else if (currentRisk.overlapMinutes > 0) {
        status = "VERIFIED";
        msg = "Conditions remain within approved bounds, but some overlap persists.";
      } else {
        status = "VERIFIED";
        msg = "Conditions improved or cleared entirely.";
      }

      setVerificationStatus(status);
      setSummary(msg);
      
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <header>
          <h1 className="text-display-lg text-text-primary mb-2">PlanGuard</h1>
          <p className="text-body-md text-text-secondary">Morning Verification.</p>
          <div className="mt-2 inline-flex items-center gap-2 p-2 bg-blue-900/20 border border-blue-900 rounded">
            <span className="text-blue-400 font-bold text-xs">LOCAL DEMONSTRATION</span>
            <span className="text-blue-300 text-xs">AWS EventBridge schedule is NOT running. This simulates the automated morning workflow using deterministic rules.</span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 flex flex-col gap-6">
            <Panel>
              <PanelHeader>
                <PanelTitle>Simulate Morning Check</PanelTitle>
              </PanelHeader>
              <PanelContent className="flex flex-col gap-4">
                <p className="text-sm text-text-muted">Select the morning environmental conditions to verify against the originally approved plan.</p>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Morning Evidence Scenario</label>
                  <select 
                    value={scenarioId} 
                    onChange={e => setScenarioId(e.target.value)}
                    className="w-full bg-background border border-border-strong rounded p-2 text-text-primary"
                  >
                    <option value="SCENARIO_1_BASELINE">Conditions Stable (Baseline)</option>
                    <option value="SCENARIO_2_WIND_SHIFT">Conditions Worsen (Wind Shift)</option>
                    <option value="SCENARIO_NO_DATA">Data Gap (Missing Telemetry)</option>
                  </select>
                </div>
                <Button onClick={evaluateGuard} disabled={loading}>
                  {loading ? "Running Verification..." : "Run PlanGuard Check"}
                </Button>
                {error && <p className="text-red-500 text-sm">{error}</p>}
              </PanelContent>
            </Panel>

            {verificationStatus && (
              <Panel>
                <PanelHeader>
                  <PanelTitle>Decision Outcome</PanelTitle>
                </PanelHeader>
                <PanelContent>
                  <div className="flex flex-col gap-4 items-start">
                    <StatusBadge variant={
                      verificationStatus === 'ESCALATED' ? 'escalated' : 
                      verificationStatus === 'DATA_GAP' ? 'data-gap' : 
                      verificationStatus === 'WATCH' ? 'watch' : 'verified'
                    }>
                      {verificationStatus}
                    </StatusBadge>
                    <p className="text-body-md text-text-primary">{summary}</p>
                    
                    {verificationStatus === 'ESCALATED' && (
                      <div className="w-full mt-4 p-4 bg-red-950/30 border border-red-900 rounded">
                        <p className="text-red-400 font-bold mb-2">ACTION REQUIRED</p>
                        <p className="text-sm text-red-300 mb-4">A revised draft plan has been created. Human review is strictly required. Approved mitigations cannot be automatically relaxed.</p>
                        <Button className="w-full bg-red-800 hover:bg-red-700 text-white border-0">Review Revised Plan</Button>
                      </div>
                    )}
                  </div>
                </PanelContent>
              </Panel>
            )}
          </div>

          <div className="lg:col-span-8 flex flex-col gap-6">
            <Panel>
              <PanelHeader>
                <PanelTitle>State Comparison</PanelTitle>
              </PanelHeader>
              <PanelContent>
                {!approvedAssessment || !latestAssessment ? (
                  <div className="text-center py-12 text-text-muted">
                    Run the PlanGuard check to see the side-by-side comparison.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Approved State */}
                    <div className="border border-border-strong rounded p-4">
                      <h3 className="text-heading-sm mb-4 border-b border-border-strong pb-2">Approved Snapshot (Previous)</h3>
                      <ul className="text-sm space-y-3">
                        <li>
                          <span className="block text-text-muted mb-1">Overlap Minutes</span>
                          <span className="font-bold text-lg">{approvedAssessment.riskAssessment.overlapMinutes}</span>
                        </li>
                        <li>
                          <span className="block text-text-muted mb-1">Confidence Score</span>
                          <span>{(approvedAssessment.riskAssessment.confidenceScore * 100).toFixed(0)}%</span>
                        </li>
                        <li>
                          <span className="block text-text-muted mb-1">Recommendation</span>
                          <span>{approvedAssessment.recommendation.action}</span>
                        </li>
                      </ul>
                    </div>

                    {/* Latest State */}
                    <div className="border border-border-strong rounded p-4 bg-panel-hover">
                      <h3 className="text-heading-sm mb-4 border-b border-border-strong pb-2">Latest Evidence (Morning Check)</h3>
                      <ul className="text-sm space-y-3">
                        <li>
                          <span className="block text-text-muted mb-1">Overlap Minutes</span>
                          <span className={`font-bold text-lg ${latestAssessment.riskAssessment.overlapMinutes > approvedAssessment.riskAssessment.overlapMinutes ? 'text-red-400' : 'text-green-400'}`}>
                            {latestAssessment.riskAssessment.overlapMinutes}
                            {latestAssessment.riskAssessment.overlapMinutes > approvedAssessment.riskAssessment.overlapMinutes && ' (Increased)'}
                          </span>
                        </li>
                        <li>
                          <span className="block text-text-muted mb-1">Confidence Score</span>
                          <span className={latestAssessment.riskAssessment.confidenceScore < 0.5 ? 'text-red-400' : ''}>
                            {(latestAssessment.riskAssessment.confidenceScore * 100).toFixed(0)}%
                          </span>
                        </li>
                        <li>
                          <span className="block text-text-muted mb-1">Data Health</span>
                          <span className={latestAssessment.dataQuality.hasMissingCriticalData ? 'text-red-400' : ''}>
                            {latestAssessment.dataQuality.hasMissingCriticalData ? 'Critical Gap' : 'Healthy'}
                          </span>
                        </li>
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
