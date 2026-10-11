"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { EnvironmentalAssessment } from "@/domain/assessment";
import { useRouter } from "next/navigation";
import { 
  AlertTriangle, 
  ArrowRight, 
  Clock, 
  Flame, 
  ShieldCheck, 
  Wind, 
  Database,
  Radio,
  ExternalLink
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [assessment, setAssessment] = useState<EnvironmentalAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const payload = {
          school: {
            id: "s1", name: "Delhi Public School, Sector 12", latitude: 0, longitude: 0, timezone: "UTC", operationalPolicyReference: "P1"
          },
          operationalPlan: {
            id: "p1", schoolId: "s1", version: 1, createdAt: "2026-10-10T19:30:00Z", status: "APPROVED", policyVersion: "1",
            activities: [
              { id: "a1", name: "Morning Assembly", startTime: "2026-10-11T08:00:00Z", endTime: "2026-10-11T09:00:00Z", locationType: "OUTDOOR" }
            ]
          },
          mode: "REPLAY",
          referenceTime: "2026-10-10T20:00:00Z",
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
        const errorMsg = err instanceof Error ? err.message : String(err);
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-[50vh] items-center justify-center">
          <p className="text-text-muted text-sm font-mono flex items-center gap-2">
            <Radio className="h-4 w-4 animate-pulse text-primary" />
            Synchronizing environmental evidence & running risk engine...
          </p>
        </div>
      </AppShell>
    );
  }

  if (error || !assessment) {
    return (
      <AppShell>
        <div className="flex flex-col gap-4 p-6 border border-danger/40 bg-danger/10 rounded-md">
          <div className="flex items-center gap-2 text-danger font-semibold">
            <AlertTriangle className="h-5 w-5" />
            <h2>Telemetry Connection Error</h2>
          </div>
          <p className="text-text-secondary text-sm">{error || "Unable to acquire assessment bundle."}</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="w-fit">
            Retry Connection
          </Button>
        </div>
      </AppShell>
    );
  }

  const fires = assessment.evidence.fires || [];
  const weather = assessment.evidence.weather;
  const isActionNeeded = assessment.recommendation.action !== "NO_CHANGE";
  const overlapMins = Math.round(assessment.riskAssessment.overlapMinutes);

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-display-md text-text-primary tracking-tight">Command Center</h1>
              <StatusBadge variant={isActionNeeded ? "escalated" : "verified"}>
                {isActionNeeded ? "Action Required" : "Plan Validated"}
              </StatusBadge>
              {assessment.isSimulation && (
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-panel-elevated border border-border-strong text-text-muted">
                  Deterministic Replay
                </span>
              )}
            </div>
            <p className="text-body-sm text-text-secondary mt-1">
              Active facility operations, smoke-influence calculations, and evidence freshness.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/air-corridor')}
              className="text-xs flex items-center gap-1.5"
            >
              Air Corridor <ArrowRight className="h-3 w-3" />
            </Button>
            <Button 
              size="sm"
              onClick={() => router.push('/plan-studio')}
              className="text-xs flex items-center gap-1.5"
            >
              Modify Plan <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Missing AQI Warning Banner if Not Configured */}
        {assessment.providerStatuses.aqi !== "SUCCESS" && (
          <div className="flex items-start gap-3 p-3.5 bg-panel-elevated border border-border-strong rounded-md text-xs text-text-secondary">
            <Radio className="h-4 w-4 text-watch shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-text-primary">Air Quality (CPCB) Monitor Offline: </span>
              Regulatory ground-station monitoring is currently unconfigured or unavailable. Risk is calculated deterministically from satellite thermal anomalies and wind vectors. Regulatory compliance cannot be claimed without physical AQI telemetry.
            </div>
          </div>
        )}

        {/* Core Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Operational Assessment Card (8 Cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Primary Action Panel */}
            <Panel elevated className="border-border-strong">
              <PanelHeader className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-border">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge variant={isActionNeeded ? "escalated" : "verified"}>
                      {assessment.recommendation.action}
                    </StatusBadge>
                    <span className="text-xs font-mono text-text-muted">
                      ID: {assessment.recommendation.recommendationId.slice(0, 16)}
                    </span>
                  </div>
                  <PanelTitle className="text-heading-md text-text-primary pt-1">
                    {assessment.recommendation.rationale}
                  </PanelTitle>
                </div>
                <Button 
                  onClick={() => router.push('/plan-studio')}
                  className="shrink-0 text-xs flex items-center gap-1"
                >
                  Open Plan Studio
                </Button>
              </PanelHeader>

              <PanelContent className="pt-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-canvas border border-border-subtle p-3 rounded">
                    <span className="text-[11px] text-text-muted uppercase tracking-wider block mb-1">Impact Window</span>
                    <span className="text-lg font-mono font-bold text-text-primary">
                      {overlapMins > 0 ? `${overlapMins} mins` : "0 mins"}
                    </span>
                    <span className="text-[11px] text-text-muted block mt-0.5">
                      {overlapMins > 0 ? "Overlap predicted" : "No outdoor impact"}
                    </span>
                  </div>

                  <div className="bg-canvas border border-border-subtle p-3 rounded">
                    <span className="text-[11px] text-text-muted uppercase tracking-wider block mb-1">Model Confidence</span>
                    <span className="text-lg font-mono font-bold text-text-primary">
                      {(assessment.riskAssessment.confidenceScore * 100).toFixed(0)}%
                    </span>
                    <span className="text-[11px] text-text-muted block mt-0.5">
                      {assessment.riskAssessment.confidenceScore < 0.6 ? "Degraded confidence" : "Deterministic"}
                    </span>
                  </div>

                  <div className="bg-canvas border border-border-subtle p-3 rounded">
                    <span className="text-[11px] text-text-muted uppercase tracking-wider block mb-1">Wind Telemetry</span>
                    <span className="text-lg font-mono font-bold text-text-primary">
                      {weather ? `${weather.windSpeed} km/h` : "N/A"}
                    </span>
                    <span className="text-[11px] text-text-muted block mt-0.5">
                      {weather ? `Direction ${weather.windDirection}°` : "Missing wind"}
                    </span>
                  </div>

                  <div className="bg-canvas border border-border-subtle p-3 rounded">
                    <span className="text-[11px] text-text-muted uppercase tracking-wider block mb-1">Verification Status</span>
                    <span className="text-lg font-mono font-bold text-verified flex items-center gap-1">
                      <ShieldCheck className="h-4 w-4" /> Ready
                    </span>
                    <span className="text-[11px] text-text-muted block mt-0.5">
                      PlanGuard checkable
                    </span>
                  </div>
                </div>

                {/* Smoke Influence Timing Rail (if overlap exists) */}
                {overlapMins > 0 && assessment.riskAssessment.riskWindow && (
                  <div className="mt-4 p-3.5 bg-panel-elevated border border-escalated/30 rounded flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-escalated font-medium">
                      <Clock className="h-4 w-4" />
                      <span>Potential Smoke-Influence Window Active:</span>
                    </div>
                    <div className="font-mono text-text-primary">
                      {new Date(assessment.riskAssessment.riskWindow.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {" – "}
                      {new Date(assessment.riskAssessment.riskWindow.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                )}
              </PanelContent>
            </Panel>

            {/* Environmental Evidence Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Thermal Fire Evidence */}
              <Panel>
                <PanelHeader className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-escalated" />
                    <PanelTitle className="text-sm font-semibold">FIRMS Thermal Detections</PanelTitle>
                  </div>
                  <span className="text-xs font-mono text-text-muted">
                    {fires.length} Observed
                  </span>
                </PanelHeader>
                <PanelContent className="pt-3 space-y-3">
                  {fires.length === 0 ? (
                    <p className="text-xs text-text-muted">No active thermal anomalies detected.</p>
                  ) : (
                    fires.map((f, i) => (
                      <div key={i} className="p-3 bg-canvas border border-border-subtle rounded text-xs space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-text-primary">Satellite Detection #{i + 1}</span>
                          <span className="font-mono text-text-muted">{f.confidence}% Conf</span>
                        </div>
                        <div className="text-[11px] text-text-muted font-mono flex justify-between">
                          <span>{f.latitude.toFixed(4)}, {f.longitude.toFixed(4)}</span>
                          <span>{new Date(f.observedAt).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </PanelContent>
              </Panel>

              {/* Modeled Corridor Status */}
              <Panel>
                <PanelHeader className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Wind className="h-4 w-4 text-primary" />
                    <PanelTitle className="text-sm font-semibold">Modeled Atmospheric Corridor</PanelTitle>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => router.push('/air-corridor')}
                    className="text-[11px] h-6 px-1.5 flex items-center gap-1"
                  >
                    View Map <ExternalLink className="h-3 w-3" />
                  </Button>
                </PanelHeader>
                <PanelContent className="pt-3 space-y-3">
                  <div className="bg-canvas border border-border-subtle p-3 rounded text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-text-muted">Corridor Intersect</span>
                      <StatusBadge variant={overlapMins > 0 ? "escalated" : "verified"}>
                        {overlapMins > 0 ? "Intersecting" : "Clear"}
                      </StatusBadge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-text-muted">Directional Alignment</span>
                      <span className="font-mono text-text-primary">
                        {weather ? `${(weather.windDirection + 180) % 360}° Trajectory` : "Unavailable"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-text-muted">Model Nature</span>
                      <span className="text-text-secondary text-[11px]">Geometric cone (not plume)</span>
                    </div>
                  </div>
                </PanelContent>
              </Panel>
            </div>
          </div>

          {/* Right Rail: Data Freshness & Source Status (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <Panel>
              <PanelHeader className="pb-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-info" />
                  <PanelTitle className="text-sm font-semibold">Source Freshness & Health</PanelTitle>
                </div>
              </PanelHeader>
              <PanelContent className="pt-3 space-y-3">
                {/* NASA FIRMS */}
                <div className="p-3 bg-canvas border border-border-subtle rounded flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-text-primary block">NASA FIRMS</span>
                    <span className="text-[11px] text-text-muted">Thermal Satellite Scan</span>
                  </div>
                  <StatusBadge variant={assessment.providerStatuses.fire === "SUCCESS" ? "verified" : "data-gap"}>
                    {assessment.providerStatuses.fire}
                  </StatusBadge>
                </div>

                {/* Weather */}
                <div className="p-3 bg-canvas border border-border-subtle rounded flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-text-primary block">Open-Meteo</span>
                    <span className="text-[11px] text-text-muted">Wind Speed & Vector</span>
                  </div>
                  <StatusBadge variant={assessment.providerStatuses.weather === "SUCCESS" ? "verified" : "data-gap"}>
                    {assessment.providerStatuses.weather}
                  </StatusBadge>
                </div>

                {/* AQI CPCB */}
                <div className="p-3 bg-canvas border border-border-subtle rounded flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-text-primary block">CPCB Ground Station</span>
                    <span className="text-[11px] text-text-muted">Regulatory AQI Sensor</span>
                  </div>
                  <StatusBadge variant={assessment.providerStatuses.aqi === "SUCCESS" ? "verified" : "data-gap"}>
                    {assessment.providerStatuses.aqi}
                  </StatusBadge>
                </div>

                {/* Notes or Limitations */}
                {assessment.dataQuality.notes.length > 0 && (
                  <div className="p-2.5 bg-panel-elevated border border-border-strong rounded text-[11px] text-text-muted space-y-1">
                    <span className="font-semibold text-text-secondary block">Quality Notes:</span>
                    {assessment.dataQuality.notes.map((n, i) => (
                      <p key={i}>• {n}</p>
                    ))}
                  </div>
                )}
              </PanelContent>
            </Panel>

            {/* Operational Sequence Guide */}
            <Panel>
              <PanelHeader className="pb-3 border-b border-border">
                <PanelTitle className="text-sm font-semibold">Standard Operational Loop</PanelTitle>
              </PanelHeader>
              <PanelContent className="pt-3 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-text-primary">
                  <span className="w-5 h-5 rounded-full bg-panel-elevated border border-border-strong flex items-center justify-center font-mono text-[10px]">1</span>
                  <span>OBSERVE: Gather FIRMS & Wind Telemetry</span>
                </div>
                <div className="flex items-center gap-2 text-text-primary">
                  <span className="w-5 h-5 rounded-full bg-panel-elevated border border-border-strong flex items-center justify-center font-mono text-[10px]">2</span>
                  <span>ASSESS: Compute Directional Influence</span>
                </div>
                <div className="flex items-center gap-2 text-text-primary">
                  <span className="w-5 h-5 rounded-full bg-panel-elevated border border-border-strong flex items-center justify-center font-mono text-[10px]">3</span>
                  <span>PLAN: Test Schedules in Plan Studio</span>
                </div>
                <div className="flex items-center gap-2 text-text-primary">
                  <span className="w-5 h-5 rounded-full bg-panel-elevated border border-border-strong flex items-center justify-center font-mono text-[10px]">4</span>
                  <span>VERIFY: Morning PlanGuard Audit</span>
                </div>
              </PanelContent>
            </Panel>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
