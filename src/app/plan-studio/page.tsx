"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { EnvironmentalAssessment } from "@/domain/assessment";
import { useRouter } from "next/navigation";
import { 
  ArrowRight, 
  RefreshCw, 
  Sliders, 
  TrendingDown, 
  TrendingUp
} from "lucide-react";

export default function PlanStudio() {
  const router = useRouter();
  
  // Baseline initial state (8:00 to 9:00 AM)
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:00");
  const [activityName, setActivityName] = useState("Morning Assembly");
  const [scenarioId, setScenarioId] = useState("SCENARIO_1_BASELINE");

  // State storage
  const [baselineAssessment, setBaselineAssessment] = useState<EnvironmentalAssessment | null>(null);
  const [proposedAssessment, setProposedAssessment] = useState<EnvironmentalAssessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Common school reference
  const school = {
    id: "s1", 
    name: "Delhi Public School, Sector 12", 
    latitude: 0, 
    longitude: 0, 
    timezone: "UTC", 
    operationalPolicyReference: "P1"
  };

  // Helper to fetch assessment for a given start and end time
  async function fetchEvaluation(sTime: string, eTime: string, scenId: string) {
    const startParts = sTime.split(':');
    const endParts = eTime.split(':');

    const startDate = new Date(2026, 9, 11, parseInt(startParts[0]), parseInt(startParts[1]));
    const endDate = new Date(2026, 9, 11, parseInt(endParts[0]), parseInt(endParts[1]));

    const payload = {
      school,
      operationalPlan: {
        id: "p1",
        schoolId: "s1",
        version: 1,
        createdAt: "2026-10-10T19:30:00Z",
        status: "DRAFT",
        policyVersion: "1",
        activities: [
          {
            id: "a1",
            name: activityName,
            startTime: startDate.toISOString(),
            endTime: endDate.toISOString(),
            locationType: "OUTDOOR"
          }
        ]
      },
      mode: "REPLAY",
      referenceTime: "2026-10-10T20:00:00Z",
      scenarioId: scenId
    };

    const res = await fetch("/api/assessment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(await res.text());
    }

    return await res.json();
  }

  // Load initial baseline immediately on mount
  useEffect(() => {
    let ignore = false;
    async function loadInitial() {
      try {
        const startDate = new Date(2026, 9, 11, 8, 0);
        const endDate = new Date(2026, 9, 11, 9, 0);

        const payload = {
          school,
          operationalPlan: {
            id: "p1",
            schoolId: "s1",
            version: 1,
            createdAt: "2026-10-10T19:30:00Z",
            status: "DRAFT",
            policyVersion: "1",
            activities: [
              {
                id: "a1",
                name: "Morning Assembly",
                startTime: startDate.toISOString(),
                endTime: endDate.toISOString(),
                locationType: "OUTDOOR"
              }
            ]
          },
          mode: "REPLAY",
          referenceTime: "2026-10-10T20:00:00Z",
          scenarioId
        };

        const res = await fetch("/api/assessment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) return;
        const initialData = await res.json();
        if (!ignore) {
          setBaselineAssessment(initialData);
          setProposedAssessment(initialData);
        }
      } catch {
        // ignore
      }
    }
    loadInitial();
    return () => {
      ignore = true;
    };
  }, [scenarioId]);

  // Recalculate when the user modifies proposed times
  const handleRecalculate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchEvaluation(startTime, endTime, scenarioId);
      setProposedAssessment(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  // Preset Shift helper (e.g. shift afternoon 13:00 to 14:00)
  const applyPreset = (start: string, end: string) => {
    setStartTime(start);
    setEndTime(end);
  };

  const baselineOverlap = baselineAssessment ? Math.round(baselineAssessment.riskAssessment.overlapMinutes) : 0;
  const proposedOverlap = proposedAssessment ? Math.round(proposedAssessment.riskAssessment.overlapMinutes) : 0;
  const overlapDelta = proposedOverlap - baselineOverlap;

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-display-md text-text-primary tracking-tight">Plan Studio</h1>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-panel-elevated border border-border-strong text-text-muted">
                What-If Recalculator
              </span>
            </div>
            <p className="text-body-sm text-text-secondary mt-1">
              Simulate operational adjustments against deterministic environmental evidence before approval.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/plan-guard')}
              className="text-xs flex items-center gap-1.5"
            >
              Verify in PlanGuard <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Workspace: 12-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Interactive Activity & Time Controls (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <Panel elevated className="border-border-strong">
              <PanelHeader className="pb-3 border-b border-border flex items-center gap-2">
                <Sliders className="h-4 w-4 text-primary" />
                <PanelTitle className="text-sm font-semibold">Activity Parameters</PanelTitle>
              </PanelHeader>

              <PanelContent className="pt-4 flex flex-col gap-4">
                {/* Scenario Selector */}
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                    Atmospheric Scenario
                  </label>
                  <select
                    value={scenarioId}
                    onChange={(e) => setScenarioId(e.target.value)}
                    className="w-full bg-canvas border border-border-strong rounded p-2 text-xs text-text-primary focus:border-primary focus:outline-none"
                  >
                    <option value="SCENARIO_1_BASELINE">Baseline Overlap (Downwind Fire)</option>
                    <option value="SCENARIO_2_WIND_SHIFT">Wind Shift Away (Clear Conditions)</option>
                    <option value="SCENARIO_3_STALE_EVIDENCE">Stale Morning Evidence (Precautionary)</option>
                  </select>
                </div>

                {/* Activity Name */}
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                    Activity Name
                  </label>
                  <input
                    type="text"
                    value={activityName}
                    onChange={(e) => setActivityName(e.target.value)}
                    className="w-full bg-canvas border border-border-strong rounded p-2 text-xs text-text-primary focus:border-primary focus:outline-none"
                  />
                </div>

                {/* Proposed Time Window */}
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                    Proposed Schedule (Outdoor)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[11px] text-text-muted block mb-1">Start Time</span>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full bg-canvas border border-border-strong rounded p-2 text-xs font-mono text-text-primary focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-text-muted block mb-1">End Time</span>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full bg-canvas border border-border-strong rounded p-2 text-xs font-mono text-text-primary focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Schedule Presets */}
                <div className="pt-2 border-t border-border-subtle">
                  <span className="text-[11px] text-text-muted block mb-2">Test Precautionary Windows:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => applyPreset("11:00", "12:00")}
                      className="px-2 py-1.5 bg-canvas border border-border-subtle hover:border-border-strong text-[11px] rounded text-text-secondary hover:text-text-primary text-left transition-colors"
                    >
                      Shift to 11:00 AM
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset("13:30", "14:30")}
                      className="px-2 py-1.5 bg-canvas border border-border-subtle hover:border-border-strong text-[11px] rounded text-text-secondary hover:text-text-primary text-left transition-colors"
                    >
                      Shift to 01:30 PM
                    </button>
                  </div>
                </div>

                {/* Primary Action Button */}
                <Button 
                  onClick={handleRecalculate} 
                  disabled={loading}
                  className="w-full mt-2 text-xs flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                  {loading ? "Calling Assessment Engine..." : "Recalculate Plan Risk"}
                </Button>

                {error && (
                  <div className="p-2.5 bg-danger/10 border border-danger/40 rounded text-danger text-xs">
                    {error}
                  </div>
                )}
              </PanelContent>
            </Panel>
          </div>

          {/* Right Column: Comparative Before vs After Evaluation (8 Cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Impact Metric Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Baseline Overlap */}
              <div className="p-4 bg-panel border border-border rounded-md">
                <span className="text-[11px] text-text-muted uppercase tracking-wider block mb-1">Original Schedule (08:00 - 09:00)</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-mono font-bold text-text-primary">
                    {baselineAssessment ? `${baselineOverlap}m` : "..."}
                  </span>
                  <span className="text-xs text-text-muted">predicted overlap</span>
                </div>
              </div>

              {/* Proposed Overlap */}
              <div className="p-4 bg-panel-elevated border border-border-strong rounded-md">
                <span className="text-[11px] text-text-muted uppercase tracking-wider block mb-1">Proposed Schedule ({startTime} - {endTime})</span>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-mono font-bold ${proposedOverlap === 0 ? "text-verified" : "text-escalated"}`}>
                    {proposedAssessment ? `${proposedOverlap}m` : "..."}
                  </span>
                  <span className="text-xs text-text-muted">predicted overlap</span>
                </div>
              </div>

              {/* Net Impact Delta */}
              <div className="p-4 bg-panel border border-border rounded-md">
                <span className="text-[11px] text-text-muted uppercase tracking-wider block mb-1">Risk Reduction Delta</span>
                <div className="flex items-center gap-2">
                  {overlapDelta < 0 ? (
                    <span className="text-xl font-mono font-bold text-verified flex items-center gap-1">
                      <TrendingDown className="h-5 w-5" /> {Math.abs(overlapDelta)}m Reduced
                    </span>
                  ) : overlapDelta > 0 ? (
                    <span className="text-xl font-mono font-bold text-escalated flex items-center gap-1">
                      <TrendingUp className="h-5 w-5" /> +{overlapDelta}m Increased
                    </span>
                  ) : (
                    <span className="text-xl font-mono font-bold text-text-secondary">
                      No Change
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Recalculated Assessment Card */}
            <Panel elevated className="border-border-strong">
              <PanelHeader className="pb-3 border-b border-border flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Engine Determination</span>
                  <PanelTitle className="text-heading-md pt-1">
                    {proposedAssessment?.recommendation.action || "Evaluating..."}
                  </PanelTitle>
                </div>
                {proposedAssessment && (
                  <StatusBadge variant={proposedAssessment.recommendation.action === "NO_CHANGE" ? "verified" : "escalated"}>
                    {proposedAssessment.recommendation.action}
                  </StatusBadge>
                )}
              </PanelHeader>

              <PanelContent className="pt-4 space-y-4">
                <p className="text-sm text-text-primary leading-relaxed">
                  {proposedAssessment?.recommendation.rationale}
                </p>

                {/* Evidence Snapshot Details */}
                <div className="p-3 bg-canvas border border-border-subtle rounded text-xs space-y-2 font-mono">
                  <div className="flex justify-between text-text-muted">
                    <span>Engine Confidence Score:</span>
                    <span className="text-text-primary">
                      {proposedAssessment ? `${(proposedAssessment.riskAssessment.confidenceScore * 100).toFixed(0)}%` : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between text-text-muted">
                    <span>Evaluation Timestamp:</span>
                    <span className="text-text-primary">
                      {proposedAssessment ? new Date(proposedAssessment.riskAssessment.generatedAt).toLocaleTimeString() : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between text-text-muted">
                    <span>Contributing Evidence IDs:</span>
                    <span className="text-text-primary truncate max-w-xs">
                      {proposedAssessment?.riskAssessment.evidenceIds.join(", ") || "None"}
                    </span>
                  </div>
                </div>

                {/* Next Operator Action */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border-subtle">
                  <div className="text-xs text-text-muted">
                    Operational changes require explicit principal review before dispatching to PlanGuard.
                  </div>
                  <Button 
                    onClick={() => router.push('/plan-guard')}
                    className="shrink-0 text-xs flex items-center gap-1.5"
                  >
                    Submit for Morning PlanGuard <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </PanelContent>
            </Panel>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
