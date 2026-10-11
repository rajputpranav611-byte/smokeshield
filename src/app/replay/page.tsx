"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { EnvironmentalAssessment } from "@/domain/assessment";
import { 
  Database, 
  RotateCcw,
  Sliders,
  TrendingDown,
  TrendingUp,
  Minus
} from "lucide-react";

export default function Replay() {
  const [baselineAssessment, setBaselineAssessment] = useState<EnvironmentalAssessment | null>(null);
  const [replayAssessment, setReplayAssessment] = useState<EnvironmentalAssessment | null>(null);
  const [scenarioId, setScenarioId] = useState("SCENARIO_2_WIND_SHIFT");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const school = { 
    id: "s1", 
    name: "Delhi Public School, Sector 12", 
    latitude: 0, 
    longitude: 0, 
    timezone: "UTC", 
    operationalPolicyReference: "P1" 
  };

  const operationalPlan = {
    id: "p1", 
    schoolId: "s1", 
    version: 1, 
    createdAt: "2026-10-10T19:30:00Z", 
    status: "APPROVED", 
    policyVersion: "1",
    activities: [
      { 
        id: "a1", 
        name: "Outdoor PE Session", 
        startTime: "2026-10-11T08:00:00Z", 
        endTime: "2026-10-11T09:00:00Z", 
        locationType: "OUTDOOR" 
      }
    ]
  };

  // Run replay comparison between baseline and selected scenario
  async function executeReplay(targetScenarioId: string) {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch fixed baseline snapshot
      const resBase = await fetch("/api/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          school,
          operationalPlan,
          mode: "REPLAY",
          referenceTime: "2026-10-10T20:00:00Z",
          scenarioId: "SCENARIO_1_BASELINE"
        })
      });
      if (!resBase.ok) throw new Error("Failed to load baseline replay");
      const baseData = await resBase.json();
      setBaselineAssessment(baseData);

      // 2. Fetch selected replay scenario
      const resTarget = await fetch("/api/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          school,
          operationalPlan,
          mode: "REPLAY",
          referenceTime: "2026-10-10T20:00:00Z",
          scenarioId: targetScenarioId
        })
      });
      if (!resTarget.ok) throw new Error("Failed to execute target replay scenario");
      const targetData = await resTarget.json();
      setReplayAssessment(targetData);
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
        const resBase = await fetch("/api/assessment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            school,
            operationalPlan,
            mode: "REPLAY",
            referenceTime: "2026-10-10T20:00:00Z",
            scenarioId: "SCENARIO_1_BASELINE"
          })
        });
        if (!resBase.ok) return;
        const baseData = await resBase.json();

        const resTarget = await fetch("/api/assessment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            school,
            operationalPlan,
            mode: "REPLAY",
            referenceTime: "2026-10-10T20:00:00Z",
            scenarioId: "SCENARIO_2_WIND_SHIFT"
          })
        });
        if (!resTarget.ok) return;
        const targetData = await resTarget.json();

        if (!ignore) {
          setBaselineAssessment(baseData);
          setReplayAssessment(targetData);
        }
      } catch {
        // ignore
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, []);

  const handleScenarioChange = (newScenario: string) => {
    setScenarioId(newScenario);
    executeReplay(newScenario);
  };

  const baselineOverlap = baselineAssessment ? Math.round(baselineAssessment.riskAssessment.overlapMinutes) : 0;
  const replayOverlap = replayAssessment ? Math.round(replayAssessment.riskAssessment.overlapMinutes) : 0;
  const overlapDiff = replayOverlap - baselineOverlap;

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-display-md text-text-primary tracking-tight">Replay & Simulation</h1>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-panel-elevated border border-border-strong text-text-muted">
                Deterministic Engine Simulator
              </span>
            </div>
            <p className="text-body-sm text-text-secondary mt-1">
              Test risk engine decisions side-by-side using curated historical observations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => executeReplay(scenarioId)}
              disabled={loading}
              className="text-xs flex items-center gap-1.5"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Re-Run Scenario
            </Button>
          </div>
        </div>

        {/* Data Provenance Banner */}
        <div className="flex items-start gap-3 p-3 bg-panel-elevated border border-border-strong rounded-md text-xs text-text-secondary">
          <Database className="h-4 w-4 text-info shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-text-primary">Deterministic Ground Truth: </span>
            In Replay mode, observations (fire coordinates, wind speed/direction, and timestamps) are static verified records loaded from memory. The risk engine logic executed is live and identical to production.
          </div>
        </div>

        {/* Workspace: 12-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Scenario Selector & Provenance (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <Panel elevated className="border-border-strong">
              <PanelHeader className="pb-3 border-b border-border flex items-center gap-2">
                <Sliders className="h-4 w-4 text-primary" />
                <PanelTitle className="text-sm font-semibold">Select Historical Scenario</PanelTitle>
              </PanelHeader>

              <PanelContent className="pt-4 flex flex-col gap-3">
                {[
                  {
                    id: "SCENARIO_2_WIND_SHIFT",
                    title: "Wind Shift (Clear Direction)",
                    desc: "Wind turns 180° south away from the school. Expects NO_CHANGE."
                  },
                  {
                    id: "SCENARIO_3_STALE_EVIDENCE",
                    title: "Stale Morning Evidence",
                    desc: "Wind observations stale (>60 mins). Precautionary penalty applied."
                  },
                  {
                    id: "SCENARIO_5_MULTIPLE_FIRES",
                    title: "Multiple Concurrent Fires",
                    desc: "Two distinct satellite detections active within influence range."
                  },
                  {
                    id: "SCENARIO_6_ESCALATION",
                    title: "Severe Smoke Escalation",
                    desc: "High wind pushing fire towards school with elevated AQI."
                  },
                  {
                    id: "SCENARIO_7_IMPROVED_CONDITIONS",
                    title: "Rapidly Cleared Conditions",
                    desc: "Fires disappear. Tests policy that approved precautions are not auto-relaxed."
                  }
                ].map((scen) => (
                  <button
                    key={scen.id}
                    type="button"
                    onClick={() => handleScenarioChange(scen.id)}
                    className={`w-full p-3 rounded border text-left text-xs transition-colors flex flex-col ${
                      scenarioId === scen.id
                        ? "border-primary bg-panel-elevated text-text-primary"
                        : "border-border-subtle bg-canvas text-text-secondary hover:border-border-strong"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-text-primary">{scen.title}</span>
                      {scenarioId === scen.id && (
                        <span className="text-[10px] font-mono text-primary font-bold">ACTIVE</span>
                      )}
                    </div>
                    <span className="text-[11px] text-text-muted leading-snug">{scen.desc}</span>
                  </button>
                ))}

                {error && (
                  <div className="p-2.5 bg-danger/10 border border-danger/40 rounded text-danger text-xs mt-2">
                    {error}
                  </div>
                )}
              </PanelContent>
            </Panel>
          </div>

          {/* Right Column: Side-by-Side Baseline vs Replay Comparison (8 Cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Top Delta Summary Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-panel border border-border rounded-md">
                <span className="text-[11px] text-text-muted uppercase tracking-wider block mb-1">Baseline Overlap</span>
                <span className="text-2xl font-mono font-bold text-text-primary">
                  {baselineAssessment ? `${baselineOverlap}m` : "..."}
                </span>
                <span className="text-[11px] text-text-muted block mt-0.5">Reference Scenario 1</span>
              </div>

              <div className="p-4 bg-panel-elevated border border-border-strong rounded-md">
                <span className="text-[11px] text-text-muted uppercase tracking-wider block mb-1">Replay Overlap</span>
                <span className={`text-2xl font-mono font-bold ${replayOverlap > baselineOverlap ? "text-escalated" : "text-verified"}`}>
                  {replayAssessment ? `${replayOverlap}m` : "..."}
                </span>
                <span className="text-[11px] text-text-muted block mt-0.5">Selected Scenario</span>
              </div>

              <div className="p-4 bg-panel border border-border rounded-md">
                <span className="text-[11px] text-text-muted uppercase tracking-wider block mb-1">Engine Variance</span>
                <div className="flex items-center gap-1.5 text-lg font-mono font-bold pt-0.5">
                  {overlapDiff > 0 ? (
                    <span className="text-escalated flex items-center gap-1">
                      <TrendingUp className="h-5 w-5" /> +{overlapDiff}m Overlap
                    </span>
                  ) : overlapDiff < 0 ? (
                    <span className="text-verified flex items-center gap-1">
                      <TrendingDown className="h-5 w-5" /> {Math.abs(overlapDiff)}m Overlap
                    </span>
                  ) : (
                    <span className="text-text-muted flex items-center gap-1">
                      <Minus className="h-4 w-4" /> No Variance
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Side-by-Side Detailed Breakdown */}
            <Panel elevated className="border-border-strong">
              <PanelHeader className="pb-3 border-b border-border flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Comparative Audit</span>
                  <PanelTitle className="text-sm font-semibold pt-0.5">Side-by-Side Determination & Evidence</PanelTitle>
                </div>
                {replayAssessment && (
                  <StatusBadge variant={replayAssessment.recommendation.action === "NO_CHANGE" ? "verified" : "escalated"}>
                    {replayAssessment.recommendation.action}
                  </StatusBadge>
                )}
              </PanelHeader>

              <PanelContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column: Baseline Snapshot */}
                  <div className="p-4 bg-canvas border border-border-subtle rounded-md space-y-3">
                    <div className="border-b border-border-subtle pb-2">
                      <span className="text-[11px] font-mono text-text-muted uppercase tracking-wider block">Reference Baseline</span>
                      <span className="text-xs font-semibold text-text-primary">Scenario 1 (Downwind Wind)</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-text-muted block text-[11px]">Recommendation</span>
                        <span className="font-semibold text-text-primary">{baselineAssessment?.recommendation.action}</span>
                      </div>
                      <div>
                        <span className="text-text-muted block text-[11px]">Rationale</span>
                        <span className="text-text-secondary text-[11px]">{baselineAssessment?.recommendation.rationale}</span>
                      </div>
                      <div className="pt-2 border-t border-border-subtle/50 font-mono text-[11px] text-text-muted space-y-1">
                        <div>Fires: {baselineAssessment?.evidence.fires.length} active</div>
                        <div>Wind: {baselineAssessment?.evidence.weather ? `${baselineAssessment.evidence.weather.windSpeed} km/h at ${baselineAssessment.evidence.weather.windDirection}°` : "N/A"}</div>
                        <div>Confidence: {baselineAssessment ? `${(baselineAssessment.riskAssessment.confidenceScore * 100).toFixed(0)}%` : "..."}</div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Replay Outcome */}
                  <div className="p-4 bg-panel-elevated border border-border-strong rounded-md space-y-3">
                    <div className="border-b border-border-strong pb-2">
                      <span className="text-[11px] font-mono text-text-muted uppercase tracking-wider block">Replay Outcome</span>
                      <span className="text-xs font-semibold text-text-primary">{scenarioId}</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-text-muted block text-[11px]">Recommendation</span>
                        <span className={`font-semibold ${replayAssessment?.recommendation.action === "NO_CHANGE" ? "text-verified" : "text-escalated"}`}>
                          {replayAssessment?.recommendation.action}
                        </span>
                      </div>
                      <div>
                        <span className="text-text-muted block text-[11px]">Rationale</span>
                        <span className="text-text-secondary text-[11px]">{replayAssessment?.recommendation.rationale}</span>
                      </div>
                      <div className="pt-2 border-t border-border-strong/50 font-mono text-[11px] text-text-muted space-y-1">
                        <div>Fires: {replayAssessment?.evidence.fires.length} active</div>
                        <div>Wind: {replayAssessment?.evidence.weather ? `${replayAssessment.evidence.weather.windSpeed} km/h at ${replayAssessment.evidence.weather.windDirection}°` : "Missing/Stale"}</div>
                        <div>Confidence: {replayAssessment ? `${(replayAssessment.riskAssessment.confidenceScore * 100).toFixed(0)}%` : "..."}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Honest Scientific Reflection */}
                <div className="mt-4 p-3 bg-panel border border-border-subtle rounded text-xs text-text-muted">
                  <span className="font-semibold text-text-secondary block mb-0.5">Verification Integrity:</span>
                  {overlapDiff === 0 && replayAssessment?.recommendation.action === baselineAssessment?.recommendation.action
                    ? "Both scenarios resulted in identical operational recommendations. SmokeShield does not invent artificial differences when telemetry changes do not cross threshold bounds."
                    : `Scenario variation altered risk calculation: overlap changed by ${overlapDiff > 0 ? `+${overlapDiff}` : overlapDiff} minutes.`}
                </div>
              </PanelContent>
            </Panel>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
