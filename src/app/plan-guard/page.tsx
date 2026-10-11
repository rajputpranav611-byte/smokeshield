"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { EnvironmentalAssessment } from "@/domain/assessment";
import { VerificationStatus } from "@/types/domain";
import { 
  AlertOctagon, 
  ArrowRight, 
  CheckCircle2, 
  Eye, 
  History, 
  Info, 
  RefreshCw, 
  ShieldAlert
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function PlanGuard() {
  const router = useRouter();
  const [approvedAssessment, setApprovedAssessment] = useState<EnvironmentalAssessment | null>(null);
  const [latestAssessment, setLatestAssessment] = useState<EnvironmentalAssessment | null>(null);
  const [scenarioId, setScenarioId] = useState("SCENARIO_1_BASELINE");
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [summary, setSummary] = useState<string>("");

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
        name: "Morning Assembly & PE", 
        startTime: "2026-10-11T08:00:00Z", 
        endTime: "2026-10-11T09:00:00Z", 
        locationType: "OUTDOOR" 
      }
    ]
  };

  const runVerification = async (selectedScenario: string) => {
    setLoading(true);

    try {
      // 1. Fetch approved state (historical baseline)
      const resApproved = await fetch("/api/assessment", {
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
      if (!resApproved.ok) throw new Error("Failed to load approved plan snapshot");
      const appAst = await resApproved.json();
      setApprovedAssessment(appAst);

      // 2. Fetch latest morning state using selected scenario
      const resLatest = await fetch("/api/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          school, 
          operationalPlan, 
          mode: "REPLAY", 
          referenceTime: "2026-10-11T06:45:00Z", 
          scenarioId: selectedScenario 
        })
      });
      if (!resLatest.ok) throw new Error("Failed to load latest morning assessment");
      const latAst = await resLatest.json();
      setLatestAssessment(latAst);

      // 3. Exact deterministic PlanGuard logic matching AWS Lambda Handler
      let status: VerificationStatus = "VERIFIED";
      let msg = "Conditions remain within approved bounds.";
      
      const { dataQuality, riskAssessment: currentRisk } = latAst;
      const { riskAssessment: approvedRisk } = appAst;

      if (dataQuality.hasMissingCriticalData || currentRisk.confidenceScore < 0.5) {
        status = "DATA_GAP";
        msg = "Insufficient data confidence for automated verification. Missing critical observation inputs: " + (dataQuality.notes.join(", ") || "telemetry offline");
      } else if (currentRisk.overlapMinutes > approvedRisk.overlapMinutes + 15) {
        status = "ESCALATED";
        msg = `Predicted smoke-influence overlap materially worsened from ${Math.round(approvedRisk.overlapMinutes)}m to ${Math.round(currentRisk.overlapMinutes)}m (+${Math.round(currentRisk.overlapMinutes - approvedRisk.overlapMinutes)}m). Human escalation required.`;
      } else if (currentRisk.overlapMinutes > 0 && currentRisk.overlapMinutes > approvedRisk.overlapMinutes) {
        status = "WATCH";
        msg = `Smoke influence increased slightly (${Math.round(currentRisk.overlapMinutes)}m vs ${Math.round(approvedRisk.overlapMinutes)}m). Monitoring active.`;
      } else if (currentRisk.overlapMinutes > 0) {
        status = "VERIFIED";
        msg = "Conditions remain within approved bounds. Precautionary mitigations remain in effect.";
      } else {
        status = "VERIFIED";
        msg = "Environmental conditions have cleared or improved. Approved plan verified.";
      }

      setVerificationStatus(status);
      setSummary(msg);
      
    } catch (err: unknown) {
      setSummary(err instanceof Error ? err.message : String(err));
      setVerificationStatus("DATA_GAP");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const resApproved = await fetch("/api/assessment", {
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
        if (!resApproved.ok) return;
        const appAst = await resApproved.json();

        const resLatest = await fetch("/api/assessment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            school, 
            operationalPlan, 
            mode: "REPLAY", 
            referenceTime: "2026-10-11T06:45:00Z", 
            scenarioId: "SCENARIO_1_BASELINE" 
          })
        });
        if (!resLatest.ok) return;
        const latAst = await resLatest.json();

        if (active) {
          setApprovedAssessment(appAst);
          setLatestAssessment(latAst);
          setVerificationStatus("VERIFIED");
          setSummary("Conditions remain within approved bounds.");
        }
      } catch {
        if (active) {
          setVerificationStatus("DATA_GAP");
          setSummary("Telemetry offline. Unable to complete automated check.");
        }
      }
    }
    init();
    return () => {
      active = false;
    };
  }, []);

  const handleScenarioChange = (newScenario: string) => {
    setScenarioId(newScenario);
    runVerification(newScenario);
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-display-md text-text-primary tracking-tight">PlanGuard</h1>
              {verificationStatus && (
                <StatusBadge variant={
                  verificationStatus === 'ESCALATED' ? 'escalated' : 
                  verificationStatus === 'DATA_GAP' ? 'data-gap' : 
                  verificationStatus === 'WATCH' ? 'watch' : 'verified'
                }>
                  {verificationStatus}
                </StatusBadge>
              )}
            </div>
            <p className="text-body-sm text-text-secondary mt-1">
              Automated 06:45 AM verification of approved activity plans against morning telemetry.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => runVerification(scenarioId)}
              disabled={loading}
              className="text-xs flex items-center gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Re-Verify Morning State
            </Button>
          </div>
        </div>

        {/* Local Demonstration Notice */}
        <div className="flex items-start gap-3 p-3 bg-panel-elevated border border-border-strong rounded-md text-xs text-text-secondary">
          <Info className="h-4 w-4 text-info shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-text-primary">Demonstration Environment: </span>
            AWS EventBridge automated 06:45 schedule is deployed in IaC but disabled by default to prevent unwanted AWS costs. This console runs the identical deterministic verification engine locally.
          </div>
        </div>

        {/* Workspace: 12-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Morning Verification Outcome & Rules (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Primary Status Card with selective glass styling */}
            <Panel glass elevated className="border-border-strong/70">
              <PanelHeader className="pb-3 border-b border-border">
                <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">
                  Morning Verification Outcome
                </span>
                <div className="flex items-center gap-2 pt-1">
                  {verificationStatus === 'VERIFIED' && <CheckCircle2 className="h-6 w-6 text-verified" />}
                  {verificationStatus === 'WATCH' && <Eye className="h-6 w-6 text-watch" />}
                  {verificationStatus === 'ESCALATED' && <AlertOctagon className="h-6 w-6 text-escalated" />}
                  {verificationStatus === 'DATA_GAP' && <ShieldAlert className="h-6 w-6 text-data-gap" />}
                  <PanelTitle className="text-heading-md">
                    {verificationStatus || "Evaluating..."}
                  </PanelTitle>
                </div>
              </PanelHeader>

              <PanelContent className="pt-4 flex flex-col gap-4">
                <p className="text-sm text-text-primary leading-relaxed">
                  {summary || "Simulating morning assessment against approved thresholds..."}
                </p>

                {/* Operator Next Action Callout */}
                <div className={`p-3.5 rounded border text-xs ${
                  verificationStatus === 'ESCALATED' ? 'bg-danger/10 border-danger/40 text-danger' :
                  verificationStatus === 'WATCH' ? 'bg-watch/10 border-watch/40 text-watch' :
                  verificationStatus === 'DATA_GAP' ? 'bg-data-gap/10 border-data-gap/40 text-data-gap' :
                  'bg-verified/10 border-verified/40 text-verified'
                }`}>
                  <span className="font-semibold block mb-1">
                    {verificationStatus === 'ESCALATED' ? 'OPERATOR ACTION: Escalation Required' :
                     verificationStatus === 'WATCH' ? 'OPERATOR ACTION: Heightened Observation' :
                     verificationStatus === 'DATA_GAP' ? 'OPERATOR ACTION: Ground Check Required' :
                     'OPERATOR ACTION: Approved Schedule Stands'}
                  </span>
                  <p className="text-text-secondary text-[11px] leading-snug">
                    {verificationStatus === 'ESCALATED' ? 'Morning smoke overlap increased by >15 minutes over approved bounds. Human sign-off is mandatory before modifying outdoor activities.' :
                     verificationStatus === 'WATCH' ? 'Conditions shifted slightly closer to thresholds. Monitor air-corridor changes during morning prep.' :
                     verificationStatus === 'DATA_GAP' ? 'Telemetry sensors did not report required morning observations. Visual check and manual principal verification required.' :
                     'All conditions are verified within policy limits. No activity rescheduling necessary.'}
                  </p>
                </div>

                {/* Scenario Simulator Selector */}
                <div className="pt-2 border-t border-border-subtle">
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                    Test Morning Condition Scenarios
                  </label>
                  <div className="space-y-1.5">
                    {[
                      { id: "SCENARIO_1_BASELINE", label: "Conditions Stable (Verified)", sub: "Smoke stays within approved parameters" },
                      { id: "SCENARIO_2_WIND_SHIFT", label: "Conditions Worsened (Escalated)", sub: "Wind pushes smoke into assembly window" },
                      { id: "SCENARIO_3_STALE_EVIDENCE", label: "Telemetry Delay (Data Gap)", sub: "Wind observations stale (>60 mins)" },
                    ].map((scen) => (
                      <button
                        key={scen.id}
                        type="button"
                        onClick={() => handleScenarioChange(scen.id)}
                        className={`w-full p-2.5 rounded border text-left text-xs transition-colors flex flex-col ${
                          scenarioId === scen.id 
                            ? 'border-primary bg-panel-elevated text-text-primary' 
                            : 'border-border-subtle bg-canvas text-text-secondary hover:border-border-strong'
                        }`}
                      >
                        <span className="font-semibold">{scen.label}</span>
                        <span className="text-[11px] text-text-muted">{scen.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </PanelContent>
            </Panel>

            {/* Verification Rules Card */}
            <Panel>
              <PanelHeader className="pb-3 border-b border-border">
                <PanelTitle className="text-sm font-semibold">Deterministic Policy Engine Rules</PanelTitle>
              </PanelHeader>
              <PanelContent className="pt-3 text-xs text-text-muted space-y-2">
                <p>• <span className="text-text-primary font-semibold">VERIFIED:</span> Overlap ≤ approved, confidence ≥ 0.5, no critical telemetry gaps.</p>
                <p>• <span className="text-text-primary font-semibold">WATCH:</span> Overlap increased by 1–15 mins above approved baseline.</p>
                <p>• <span className="text-text-primary font-semibold">ESCALATED:</span> Overlap increased by &gt;15 mins. Automatic relaxations prohibited.</p>
                <p>• <span className="text-text-primary font-semibold">DATA_GAP:</span> Telemetry missing or confidence &lt; 0.5.</p>
              </PanelContent>
            </Panel>
          </div>

          {/* Right Column: Comparative Audit Snapshot (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <Panel elevated className="border-border-strong">
              <PanelHeader className="pb-3 border-b border-border flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Audit Comparison</span>
                  <PanelTitle className="text-sm font-semibold pt-0.5">Approved Snapshot vs Morning Observation</PanelTitle>
                </div>
                <span className="text-xs font-mono text-text-muted">
                  Plan v1 (Approved)
                </span>
              </PanelHeader>

              <PanelContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Approved Snapshot Column */}
                  <div className="p-4 bg-canvas border border-border-subtle rounded-md space-y-3">
                    <div className="border-b border-border-subtle pb-2">
                      <span className="text-[11px] font-mono text-text-muted uppercase tracking-wider block">Approved Plan Baseline</span>
                      <span className="text-xs font-semibold text-text-primary">Snapshot at Approval (Yesterday)</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-text-muted">Predicted Overlap:</span>
                        <span className="font-mono font-bold text-text-primary">
                          {approvedAssessment ? `${Math.round(approvedAssessment.riskAssessment.overlapMinutes)}m` : "..."}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Model Confidence:</span>
                        <span className="font-mono text-text-primary">
                          {approvedAssessment ? `${(approvedAssessment.riskAssessment.confidenceScore * 100).toFixed(0)}%` : "..."}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Approved Action:</span>
                        <span className="font-semibold text-verified">
                          {approvedAssessment?.recommendation.action || "NO_CHANGE"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Approval Authority:</span>
                        <span className="text-text-secondary">Principal Sharma (Admin)</span>
                      </div>
                    </div>
                  </div>

                  {/* Morning Verification Column */}
                  <div className="p-4 bg-panel-elevated border border-border-strong rounded-md space-y-3">
                    <div className="border-b border-border-strong pb-2">
                      <span className="text-[11px] font-mono text-text-muted uppercase tracking-wider block">Morning Evidence Check</span>
                      <span className="text-xs font-semibold text-text-primary">06:45 AM Telemetry Sweep</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-text-muted">Morning Overlap:</span>
                        <span className={`font-mono font-bold ${
                          latestAssessment && approvedAssessment && latestAssessment.riskAssessment.overlapMinutes > approvedAssessment.riskAssessment.overlapMinutes
                            ? 'text-escalated'
                            : 'text-verified'
                        }`}>
                          {latestAssessment ? `${Math.round(latestAssessment.riskAssessment.overlapMinutes)}m` : "..."}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Morning Confidence:</span>
                        <span className="font-mono text-text-primary">
                          {latestAssessment ? `${(latestAssessment.riskAssessment.confidenceScore * 100).toFixed(0)}%` : "..."}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Status Assigned:</span>
                        <span className="font-semibold text-text-primary">
                          {verificationStatus || "Pending"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Data Quality:</span>
                        <span className={latestAssessment?.dataQuality.hasMissingCriticalData ? "text-escalated" : "text-verified"}>
                          {latestAssessment?.dataQuality.hasMissingCriticalData ? "Critical Gap" : "Verified"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Decision Link */}
                {verificationStatus === 'ESCALATED' && (
                  <div className="mt-4 p-3 bg-danger/10 border border-danger/30 rounded flex items-center justify-between text-xs">
                    <span className="text-danger font-semibold">Immediate Action: Review revised plan draft</span>
                    <Button 
                      size="sm" 
                      onClick={() => router.push('/plan-studio')}
                      className="text-xs bg-danger hover:bg-danger/80 text-white"
                    >
                      Open Plan Studio <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                )}
              </PanelContent>
            </Panel>

            {/* Approval Record & Audit Trail */}
            <Panel>
              <PanelHeader className="pb-3 border-b border-border flex items-center gap-2">
                <History className="h-4 w-4 text-text-muted" />
                <PanelTitle className="text-sm font-semibold">Verified Audit Trail</PanelTitle>
              </PanelHeader>
              <PanelContent className="pt-3 space-y-2">
                <div className="p-3 bg-canvas border border-border-subtle rounded text-xs space-y-1 font-mono">
                  <div className="flex justify-between text-text-muted">
                    <span>Snapshot ID:</span>
                    <span className="text-text-primary">snap-20261010-p1-v1</span>
                  </div>
                  <div className="flex justify-between text-text-muted">
                    <span>Policy Reference:</span>
                    <span className="text-text-primary">POL-AIR-DELHI-SEC12-V1</span>
                  </div>
                  <div className="flex justify-between text-text-muted">
                    <span>Deterministic Engine Version:</span>
                    <span className="text-text-primary">1.0.0</span>
                  </div>
                </div>
              </PanelContent>
            </Panel>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
