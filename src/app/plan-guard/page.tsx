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
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Eye,
  FileText,
  History,
  HelpCircle,
  Info,
  RefreshCw,
  ShieldAlert,
  Sliders,
  TrendingDown,
  TrendingUp,
  UserCheck
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
  const [copied, setCopied] = useState(false);

  // Decision Time Machine interactive alternatives state
  const [selectedAltId, setSelectedAltId] = useState<string>("baseline");
  const [evaluatingAlt, setEvaluatingAlt] = useState<boolean>(false);
  const [altResults, setAltResults] = useState<Record<string, { overlap: number; action: string }>>({});

  // Human approval simulation for revised plan draft
  const [revisedApproved, setRevisedApproved] = useState<boolean>(false);
  const [approverNotes, setApproverNotes] = useState<string>("");

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
        locationType: "OUTDOOR" as const
      }
    ]
  };

  // Run real evaluation for alternative schedules against the currently selected scenario
  const evaluateAlternatives = async (activeScenario: string) => {
    setEvaluatingAlt(true);
    try {
      const alternatives = [
        { id: "delay_11am", sTime: "11:00", eTime: "12:00", loc: "OUTDOOR" as const },
        { id: "shift_afternoon", sTime: "13:30", eTime: "14:30", loc: "OUTDOOR" as const },
        { id: "move_indoor", sTime: "08:00", eTime: "09:00", loc: "INDOOR" as const },
      ];

      const resultsMap: Record<string, { overlap: number; action: string }> = {};

      for (const alt of alternatives) {
        const sParts = alt.sTime.split(":");
        const eParts = alt.eTime.split(":");
        const sDate = new Date(Date.UTC(2026, 9, 11, parseInt(sParts[0]), parseInt(sParts[1])));
        const eDate = new Date(Date.UTC(2026, 9, 11, parseInt(eParts[0]), parseInt(eParts[1])));

        const res = await fetch("/api/assessment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            school,
            operationalPlan: {
              ...operationalPlan,
              activities: [
                {
                  id: `alt-${alt.id}`,
                  name: "Morning Assembly & PE (Alternative)",
                  startTime: sDate.toISOString(),
                  endTime: eDate.toISOString(),
                  locationType: alt.loc
                }
              ]
            },
            mode: "REPLAY",
            referenceTime: "2026-10-11T06:45:00Z",
            scenarioId: activeScenario
          })
        });

        if (res.ok) {
          const data = await res.json();
          resultsMap[alt.id] = {
            overlap: Math.round(data.riskAssessment.overlapMinutes),
            action: data.recommendation.action
          };
        }
      }

      setAltResults(resultsMap);
    } catch (err) {
      console.error("Alternative evaluation failed:", err);
    } finally {
      setEvaluatingAlt(false);
    }
  };

  const runVerification = async (selectedScenario: string) => {
    setLoading(true);
    setRevisedApproved(false);
    setSelectedAltId("baseline");

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

      // Trigger recalculation of alternative schedules
      evaluateAlternatives(selectedScenario);

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
          evaluateAlternatives("SCENARIO_1_BASELINE");
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScenarioChange = (newScenario: string) => {
    setScenarioId(newScenario);
    runVerification(newScenario);
  };

  const generateReceiptText = () => {
    if (!latestAssessment || !approvedAssessment) return "";
    const evidenceList = latestAssessment.riskAssessment.evidenceIds.join(", ") || "None";
    const freshnessText = latestAssessment.evidence.weather
      ? `${latestAssessment.evidence.weather.freshnessMinutes}m (IMD/Open-Meteo)`
      : "Unavailable";
    const altChoiceText = selectedAltId === "delay_11am"
      ? `Shift to 11:00 AM (Predicted overlap reduced to ${altResults.delay_11am?.overlap ?? 0}m)`
      : selectedAltId === "move_indoor"
      ? "Move Indoors (Bypasses outdoor corridor; indoor filtration assumed)"
      : "Maintain 08:00 AM Baseline";

    return `=======================================================
SMOKESHIELD OPERATIONAL DECISION RECEIPT
=======================================================
Facility Name:          ${school.name}
Operational Policy:     POL-AIR-DELHI-SEC12-V1
Scheduled Activity:     Morning Assembly & PE (08:00 - 09:00 AM, Outdoor)
Approved Baseline:      Plan v1 (Snapshot: snap-20261010-p1-v1)
Snapshot Timestamp:     2026-10-10 20:00 UTC (Yesterday Evening)
Morning Verification:   2026-10-11 06:45 UTC (Pre-Opening Sweep)
Execution Mode:         DETERMINISTIC REPLAY (Scenario: ${scenarioId})

-------------------------------------------------------
DETERMINATION & EVIDENCE DELTA
-------------------------------------------------------
PlanGuard Verdict:      ${verificationStatus}
Determination Rule:     ${
  verificationStatus === 'ESCALATED' ? 'Overlap delta > +15 min above approved baseline. Human sign-off required.' :
  verificationStatus === 'WATCH' ? 'Overlap delta between +1 and +15 min. Heightened prep monitoring active.' :
  verificationStatus === 'DATA_GAP' ? 'Critical telemetry missing/stale or confidence < 50%. Manual ground check required.' :
  'Conditions remain within approved bounds. Approved precautions retained.'
}
Approved Overlap:       ${Math.round(approvedAssessment.riskAssessment.overlapMinutes)} min
Morning Modeled Overlap:${Math.round(latestAssessment.riskAssessment.overlapMinutes)} min
Net Overlap Delta:      ${Math.round(latestAssessment.riskAssessment.overlapMinutes - approvedAssessment.riskAssessment.overlapMinutes) > 0 ? "+" : ""}${Math.round(latestAssessment.riskAssessment.overlapMinutes - approvedAssessment.riskAssessment.overlapMinutes)} min
Model Confidence Score: ${(latestAssessment.riskAssessment.confidenceScore * 100).toFixed(0)}%
Weather Freshness:      ${freshnessText}
Contributing Evidence:  ${evidenceList}
Critical Sensor Status: ${latestAssessment.dataQuality.hasMissingCriticalData ? "CRITICAL GAP DETECTED (Data Stale/Missing)" : "Nominal"}

-------------------------------------------------------
DECISION TIME MACHINE & HUMAN ACCOUNTABILITY
-------------------------------------------------------
Alternative Evaluated:  ${altChoiceText}
Human Approval Status:  ${
  verificationStatus === 'ESCALATED'
    ? (revisedApproved ? "APPROVED (Draft v2 Enacted by Principal)" : "PENDING HUMAN REVIEW (Action Required)")
    : "NOT REQUIRED (Original Approved Baseline Stands)"
}
Sign-Off Authority:     Principal Sharma (Simulated Demo Role: Principal)
Approver Notes:         ${approverNotes || "Standard morning verification workflow"}

-------------------------------------------------------
OPERATIONAL LIMITATIONS & CONSERVATIVE PRINCIPLES
-------------------------------------------------------
1. NASA FIRMS detections indicate candidate thermal anomalies, not certified smoke at the school.
2. Modeled corridor overlap does not guarantee safety. Local PM2.5 ground sensors are unconfigured.
3. Improving conditions retain approved precautions; the system never automatically cancels mitigations.
4. Missing or stale evidence is never treated as evidence of safety.

=======================================================
End of Decision Receipt • Generated for Local Operations
=======================================================`;
  };

  const handleCopySummary = () => {
    const text = generateReceiptText();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadReceipt = () => {
    const text = generateReceiptText();
    if (!text) return;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `smokeshield-decision-receipt-${scenarioId.toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const appOverlap = approvedAssessment ? Math.round(approvedAssessment.riskAssessment.overlapMinutes) : 0;
  const latOverlap = latestAssessment ? Math.round(latestAssessment.riskAssessment.overlapMinutes) : 0;
  const overlapDelta = latOverlap - appOverlap;
  const appConfidence = approvedAssessment ? Math.round(approvedAssessment.riskAssessment.confidenceScore * 100) : 0;
  const latConfidence = latestAssessment ? Math.round(latestAssessment.riskAssessment.confidenceScore * 100) : 0;

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Section A: Morning Decision Header */}
        <div className="flex flex-col gap-3 border-b border-border pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-mono font-semibold tracking-wider uppercase text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                  Morning Decision Simulator
                </span>
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
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-panel-elevated border border-border-strong text-text-muted">
                  DETERMINISTIC REPLAY
                </span>
              </div>
              <p className="text-body-sm text-text-secondary mt-1">
                Facility: <span className="font-semibold text-text-primary">{school.name}</span> •
                Yesterday&apos;s approved plan is verified against fresh 06:45 AM morning evidence before school opens.
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

          {/* Operational Scope & Timestamps Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-2.5 bg-panel border border-border-subtle rounded-md text-xs font-mono">
            <div>
              <span className="text-text-muted block text-[10px] uppercase">Approved Activity</span>
              <span className="text-text-primary font-semibold">Morning Assembly (08:00–09:00)</span>
            </div>
            <div>
              <span className="text-text-muted block text-[10px] uppercase">Approved Snapshot</span>
              <span className="text-text-primary">Yesterday 20:00 UTC</span>
            </div>
            <div>
              <span className="text-text-muted block text-[10px] uppercase">Morning Sweep</span>
              <span className="text-text-primary">Today 06:45 UTC</span>
            </div>
            <div>
              <span className="text-text-muted block text-[10px] uppercase">Telemetry State</span>
              <span className="text-text-secondary">
                {latestAssessment?.isSimulation ? "Deterministic Fixture" : "Live Feed"}
              </span>
            </div>
          </div>
        </div>

        {/* Local Demonstration Notice */}
        <div className="flex items-start gap-3 p-3 bg-panel-elevated border border-border-strong rounded-md text-xs text-text-secondary">
          <Info className="h-4 w-4 text-info shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-text-primary">Demonstration Environment (Offline Replay Engine): </span>
            This interactive console executes the identical deterministic PlanGuard comparison engine locally without connecting to live AWS infrastructure. AWS Cognito authentication and EventBridge automated 06:45 cron execution are deployed in SAM IaC, but not invoked in this local demo mode.
          </div>
        </div>

        {/* Section B: Morning Decision Timeline (Before-and-After Signature Visual) */}
        <Panel elevated className="border-border-strong">
          <PanelHeader className="pb-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <PanelTitle className="text-sm font-semibold">Operational Decision Lifecycle: Before &amp; After Timeline</PanelTitle>
            </div>
            <span className="text-[11px] font-mono text-text-muted">
              OBSERVE → APPROVE → MORNING REASSESS → VERIFY
            </span>
          </PanelHeader>

          <PanelContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Step 1: Yesterday Evening */}
              <div className="p-3 bg-canvas border border-border-subtle rounded-md space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-text-muted">1. Evening Baseline</span>
                  <span className="text-[10px] font-mono text-text-muted">20:00 UTC</span>
                </div>
                <div className="text-xs font-semibold text-text-primary">Plan v1 Approved</div>
                <div className="text-[11px] text-text-secondary">
                  Modeled overlap: <span className="font-mono font-bold text-text-primary">{appOverlap}m</span>. Human sign-off recorded under snapshot <span className="font-mono text-text-muted">snap-20261010-p1-v1</span>.
                </div>
              </div>

              {/* Step 2: Overnight Telemetry Sweep */}
              <div className="p-3 bg-canvas border border-border-subtle rounded-md space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-text-muted">2. Morning Telemetry</span>
                  <span className="text-[10px] font-mono text-text-muted">06:45 UTC</span>
                </div>
                <div className="text-xs font-semibold text-text-primary">Observation Sweep</div>
                <div className="text-[11px] text-text-secondary">
                  NASA FIRMS satellite thermal feed + IMD wind vectors evaluated for school corridor.
                </div>
              </div>

              {/* Step 3: Reassessment Delta */}
              <div className="p-3 bg-panel-elevated border border-border-strong rounded-md space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-text-muted">3. Engine Comparison</span>
                  <span className="text-[10px] font-mono text-text-muted">Δ Overlap</span>
                </div>
                <div className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                  {overlapDelta > 0 ? (
                    <span className="text-escalated flex items-center gap-1 font-mono">
                      <TrendingUp className="h-3.5 w-3.5" /> +{overlapDelta}m Worsened
                    </span>
                  ) : overlapDelta < 0 ? (
                    <span className="text-verified flex items-center gap-1 font-mono">
                      <TrendingDown className="h-3.5 w-3.5" /> {Math.abs(overlapDelta)}m Cleared
                    </span>
                  ) : (
                    <span className="text-text-secondary font-mono">0m No Delta</span>
                  )}
                </div>
                <div className="text-[11px] text-text-secondary">
                  Morning overlap: <span className="font-mono font-bold text-text-primary">{latOverlap}m</span> (Confidence: {latConfidence}%).
                </div>
              </div>

              {/* Step 4: PlanGuard Determination */}
              <div className={`p-3 rounded-md space-y-1 border ${
                verificationStatus === 'ESCALATED' ? 'bg-danger/10 border-danger/40' :
                verificationStatus === 'WATCH' ? 'bg-watch/10 border-watch/40' :
                verificationStatus === 'DATA_GAP' ? 'bg-data-gap/10 border-data-gap/40' :
                'bg-verified/10 border-verified/40'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-text-muted">4. PlanGuard Verdict</span>
                  <span className="text-[10px] font-mono font-bold text-text-primary">{verificationStatus}</span>
                </div>
                <div className="text-xs font-semibold text-text-primary">
                  {verificationStatus === 'ESCALATED' ? 'Escalation Triggered' :
                   verificationStatus === 'WATCH' ? 'Monitoring Required' :
                   verificationStatus === 'DATA_GAP' ? 'Ground Check Mandatory' :
                   'Approved Plan Verified'}
                </div>
                <div className="text-[11px] text-text-secondary">
                  {verificationStatus === 'ESCALATED' ? 'Material increase requires revised draft.' :
                   verificationStatus === 'DATA_GAP' ? 'Uncertainty prevents auto-verification.' :
                   'Precaution stands; no auto-cancellation.'}
                </div>
              </div>
            </div>
          </PanelContent>
        </Panel>

        {/* Section C: Evidence-Change Explanation (What Changed?) */}
        <Panel elevated className="border-border-strong">
          <PanelHeader className="pb-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <PanelTitle className="text-sm font-semibold">What Changed? Deterministic Evidence Audit</PanelTitle>
            </div>
            <span className="text-xs font-mono text-text-muted">
              Snapshot vs 06:45 Telemetry
            </span>
          </PanelHeader>

          <PanelContent className="pt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border-subtle text-text-muted uppercase text-[10px] font-mono">
                    <th className="pb-2 font-semibold">Evidence Parameter</th>
                    <th className="pb-2 font-semibold">Approved Baseline (Yesterday)</th>
                    <th className="pb-2 font-semibold">Morning Assessment (06:45 AM)</th>
                    <th className="pb-2 font-semibold">Observed Delta</th>
                    <th className="pb-2 font-semibold">Provenance &amp; Source</th>
                    <th className="pb-2 font-semibold">Operational Significance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {/* Row 1: Overlap Minutes */}
                  <tr>
                    <td className="py-2.5 font-semibold text-text-primary">Modeled Overlap Window</td>
                    <td className="py-2.5 font-mono text-text-secondary">{appOverlap} min</td>
                    <td className="py-2.5 font-mono font-bold text-text-primary">{latOverlap} min</td>
                    <td className="py-2.5 font-mono">
                      {overlapDelta > 0 ? (
                        <span className="text-escalated font-bold">+{overlapDelta} min (Worsened)</span>
                      ) : overlapDelta < 0 ? (
                        <span className="text-verified font-bold">{overlapDelta} min (Cleared)</span>
                      ) : (
                        <span className="text-text-muted">0 min (Unchanged)</span>
                      )}
                    </td>
                    <td className="py-2.5 text-text-secondary font-mono text-[11px]">
                      Deterministic Replay • {scenarioId}
                    </td>
                    <td className="py-2.5 text-text-secondary text-[11px]">
                      {overlapDelta > 15 ? "Exceeds 15m threshold; triggers mandatory escalation." :
                       overlapDelta > 0 ? "Increased slightly within 15m watch envelope." :
                       overlapDelta < 0 ? "Conditions cleared; precautions retained without auto-relaxing." :
                       "Conditions agree with approved envelope."}
                    </td>
                  </tr>

                  {/* Row 2: Model Confidence */}
                  <tr>
                    <td className="py-2.5 font-semibold text-text-primary">Engine Confidence Score</td>
                    <td className="py-2.5 font-mono text-text-secondary">{appConfidence}%</td>
                    <td className="py-2.5 font-mono font-bold text-text-primary">{latConfidence}%</td>
                    <td className="py-2.5 font-mono">
                      {latConfidence < appConfidence ? (
                        <span className="text-data-gap font-bold">-{appConfidence - latConfidence}% (Reduced)</span>
                      ) : (
                        <span className="text-text-muted">0%</span>
                      )}
                    </td>
                    <td className="py-2.5 text-text-secondary font-mono text-[11px]">
                      Multi-sensor corroboration
                    </td>
                    <td className="py-2.5 text-text-secondary text-[11px]">
                      {latConfidence < 50 ? "Below 50% confidence floor; forces DATA_GAP status." : "Confidence sufficient for automated evaluation."}
                    </td>
                  </tr>

                  {/* Row 3: Telemetry Quality */}
                  <tr>
                    <td className="py-2.5 font-semibold text-text-primary">Critical Sensor Completeness</td>
                    <td className="py-2.5 text-verified font-semibold">100% Complete</td>
                    <td className="py-2.5">
                      {latestAssessment?.dataQuality.hasMissingCriticalData ? (
                        <span className="text-data-gap font-semibold">Telemetry Delay (&gt;60m stale)</span>
                      ) : (
                        <span className="text-verified font-semibold">Nominal</span>
                      )}
                    </td>
                    <td className="py-2.5 font-mono text-text-muted">
                      {latestAssessment?.dataQuality.hasMissingCriticalData ? "Stale input penalty" : "No gaps"}
                    </td>
                    <td className="py-2.5 text-text-secondary font-mono text-[11px]">
                      Open-Meteo &amp; NASA FIRMS
                    </td>
                    <td className="py-2.5 text-text-secondary text-[11px]">
                      {latestAssessment?.dataQuality.hasMissingCriticalData
                        ? "Missing evidence is NOT treated as safety. Human ground check required."
                        : "All critical environmental inputs available."}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </PanelContent>
        </Panel>

        {/* Workspace: 12-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Morning Verification Outcome & Four Scenarios (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Primary Status Card */}
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
                     'All conditions are verified within policy limits. No activity rescheduling necessary. Approved precautions remain active.'}
                  </p>
                </div>

                {/* Section E: Four Scenario Challenges */}
                <div className="pt-2 border-t border-border-subtle">
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                    Test Morning Verification Scenarios
                  </label>
                  <div className="space-y-1.5">
                    {[
                      {
                        id: "SCENARIO_1_BASELINE",
                        label: "1. Unchanged Conditions (Verified)",
                        sub: "Morning smoke & wind match approved envelope (60m = 60m)"
                      },
                      {
                        id: "SCENARIO_6_ESCALATION",
                        label: "2. Worsening Conditions (Escalated)",
                        sub: "Overnight fire flare (+30m overlap); triggers revised plan requirement"
                      },
                      {
                        id: "SCENARIO_7_IMPROVED_CONDITIONS",
                        label: "3. Improving Conditions (Verified / Retained)",
                        sub: "Corridor cleared (0m overlap); approved precaution safely retained"
                      },
                      {
                        id: "SCENARIO_3_STALE_EVIDENCE",
                        label: "4. Stale / Missing Telemetry (Data Gap)",
                        sub: "Wind data stale (>60m); confidence drops below 50% floor"
                      },
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

          {/* Right Column: Comparative Audit, Decision Time Machine, and Approval (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Comparative Audit Snapshot */}
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
                          {appOverlap}m
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Model Confidence:</span>
                        <span className="font-mono text-text-primary">
                          {appConfidence}%
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
                        <span className="text-text-secondary">Principal Sharma (Demo Role: Principal)</span>
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
                          latOverlap > appOverlap ? 'text-escalated' : 'text-verified'
                        }`}>
                          {latOverlap}m
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Morning Confidence:</span>
                        <span className="font-mono text-text-primary">
                          {latConfidence}%
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

                {/* Bottom Escalation Banner */}
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

            {/* Section F: Decision Time Machine (Operational Alternative Comparison) */}
            <Panel elevated className="border-border-strong">
              <PanelHeader className="pb-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-primary" />
                  <PanelTitle className="text-sm font-semibold">Decision Time Machine: Compare Operational Alternatives</PanelTitle>
                </div>
                <span className="text-xs font-mono text-text-muted">
                  What-If Engine Recalculation
                </span>
              </PanelHeader>

              <PanelContent className="pt-4 space-y-4">
                <p className="text-xs text-text-secondary leading-relaxed">
                  Test viable alternative decisions against the active morning environmental evidence. Each option runs genuinely through the deterministic assessment engine.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Option 1: Baseline */}
                  <div
                    onClick={() => setSelectedAltId("baseline")}
                    className={`p-3 rounded border text-xs cursor-pointer transition-colors ${
                      selectedAltId === "baseline"
                        ? "border-primary bg-panel-elevated"
                        : "border-border-subtle bg-canvas hover:border-border-strong"
                    }`}
                  >
                    <div className="font-semibold text-text-primary">1. Maintain 08:00 AM</div>
                    <div className="text-[11px] text-text-muted mt-0.5">Original outdoor assembly</div>
                    <div className="mt-2 text-[11px] font-mono">
                      Overlap: <span className="font-bold text-text-primary">{latOverlap}m</span>
                    </div>
                    <span className="inline-block mt-2 text-[10px] font-mono text-text-muted">
                      Original Plan
                    </span>
                  </div>

                  {/* Option 2: Delay to 11:00 AM */}
                  <div
                    onClick={() => setSelectedAltId("delay_11am")}
                    className={`p-3 rounded border text-xs cursor-pointer transition-colors ${
                      selectedAltId === "delay_11am"
                        ? "border-primary bg-panel-elevated"
                        : "border-border-subtle bg-canvas hover:border-border-strong"
                    }`}
                  >
                    <div className="font-semibold text-text-primary">2. Shift to 11:00 AM</div>
                    <div className="text-[11px] text-text-muted mt-0.5">Outdoor assembly postponed</div>
                    <div className="mt-2 text-[11px] font-mono">
                      Overlap: <span className="font-bold text-verified">
                        {evaluatingAlt ? "..." : `${altResults.delay_11am?.overlap ?? 0}m`}
                      </span>
                    </div>
                    <span className="inline-block mt-2 text-[10px] font-mono text-verified">
                      {latOverlap > 0 && !evaluatingAlt ? `-${latOverlap - (altResults.delay_11am?.overlap ?? 0)}m Reduction` : "Evaluated"}
                    </span>
                  </div>

                  {/* Option 3: Move Indoor */}
                  <div
                    onClick={() => setSelectedAltId("move_indoor")}
                    className={`p-3 rounded border text-xs cursor-pointer transition-colors ${
                      selectedAltId === "move_indoor"
                        ? "border-primary bg-panel-elevated"
                        : "border-border-subtle bg-canvas hover:border-border-strong"
                    }`}
                  >
                    <div className="font-semibold text-text-primary">3. Move Indoors</div>
                    <div className="text-[11px] text-text-muted mt-0.5">Auditorium / Gymnasium</div>
                    <div className="mt-2 text-[11px] font-mono">
                      Corridor Overlap: <span className="font-bold text-verified">0m</span>
                    </div>
                    <span className="inline-block mt-2 text-[10px] font-mono text-text-secondary">
                      Zero Outdoor Exposure
                    </span>
                  </div>
                </div>

                {/* Selected Alternative Impact Callout */}
                <div className="p-3 bg-canvas border border-border-subtle rounded text-xs space-y-1">
                  <span className="font-semibold text-text-primary block">
                    Modeled Assessment for Selected Choice:
                  </span>
                  <p className="text-text-secondary text-[11px] leading-relaxed">
                    {selectedAltId === "baseline" &&
                      `Maintaining the 08:00 AM outdoor assembly leaves the facility subject to ${latOverlap} minutes of modeled smoke corridor overlap. Human review required if status is ESCALATED.`}
                    {selectedAltId === "delay_11am" &&
                      `Postponing to 11:00 AM reduces predicted corridor overlap to ${altResults.delay_11am?.overlap ?? 0} minutes based on diurnal dispersion and forecasted wind velocity.`}
                    {selectedAltId === "move_indoor" &&
                      "Moving PE and assembly indoors bypasses the outdoor corridor calculation entirely. Note: Indoor air filtration efficiency is an operational assumption requiring physical facility verification."}
                  </p>
                </div>
              </PanelContent>
            </Panel>

            {/* Section G: Challenge This Decision (Uncertainty & Limitation Inspection) */}
            <Panel elevated className="border-border-strong">
              <PanelHeader className="pb-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-watch" />
                  <PanelTitle className="text-sm font-semibold">Challenge This Decision: Visible Uncertainty &amp; Limits</PanelTitle>
                </div>
                <span className="text-xs font-mono text-text-muted">
                  Truth-in-Engineering
                </span>
              </PanelHeader>

              <PanelContent className="pt-4 space-y-3">
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-panel-elevated border border-border-subtle rounded flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-watch shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-text-primary block">1. Modeled Influence Window vs Ground Air Quality</span>
                      <p className="text-text-secondary text-[11px] mt-0.5 leading-snug">
                        Calculations represent candidate smoke trajectories based on satellite thermal detections (NASA FIRMS) and meteorological vectors. They are modeled projections, not certified physical ground measurements.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-panel-elevated border border-border-subtle rounded flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-info shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-text-primary block">2. Local Sensor Coverage &amp; Ground Truth</span>
                      <p className="text-text-secondary text-[11px] mt-0.5 leading-snug">
                        Local low-cost PM2.5 sensors are not configured for this facility. Telemetry reflects regional meteorological and orbital satellite sweeps. Physical observation by on-site staff remains indispensable.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-panel-elevated border border-border-subtle rounded flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-danger shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-text-primary block">3. Improving Conditions Safety Guardrail</span>
                      <p className="text-text-secondary text-[11px] mt-0.5 leading-snug">
                        If morning conditions clear, PlanGuard retains approved precautions by policy. The system will never silently relax outdoor restrictions without an affirmative human decision.
                      </p>
                    </div>
                  </div>
                </div>
              </PanelContent>
            </Panel>

            {/* Section H: Human Decision and Approval (Principal Sign-Off Interface) */}
            <Panel elevated className="border-border-strong">
              <PanelHeader className="pb-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary" />
                  <PanelTitle className="text-sm font-semibold">Human Decision &amp; Approval Gateway</PanelTitle>
                </div>
                <span className="text-xs font-mono text-text-muted">
                  Principal Role (Simulated Demo Authority)
                </span>
              </PanelHeader>

              <PanelContent className="pt-4 space-y-4">
                <p className="text-xs text-text-secondary leading-relaxed">
                  SmokeShield assists human judgment; it never makes autonomous schedule decisions. When conditions worsen or require amendment, an authorized administrator must explicitly record approval.
                </p>

                {verificationStatus === 'ESCALATED' ? (
                  <div className="p-4 bg-danger/10 border border-danger/30 rounded-md space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-danger">Revised Schedule Draft Awaiting Approval</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-danger/20 text-danger">
                        {revisedApproved ? "APPROVED (v2)" : "PENDING HUMAN REVIEW"}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-secondary leading-normal">
                      Morning smoke overlap increased by +30m. The proposed draft shifts outdoor activities to 11:00 AM (or indoors) to avoid peak modeled corridor influence.
                    </p>

                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Optional approval note (e.g., Confirmed with sports director)"
                        value={approverNotes}
                        onChange={(e) => setApproverNotes(e.target.value)}
                        className="w-full bg-canvas border border-border-strong rounded p-2 text-xs text-text-primary focus:border-primary focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={revisedApproved}
                          onClick={() => setRevisedApproved(true)}
                          className="text-xs bg-danger hover:bg-danger/80 text-white flex items-center gap-1.5"
                        >
                          <Check className="h-3.5 w-3.5" />
                          {revisedApproved ? "Revised Plan Approved (Draft v2 Enacted)" : "Authorize Revised Plan (Principal Sharma)"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : verificationStatus === 'DATA_GAP' ? (
                  <div className="p-4 bg-data-gap/10 border border-data-gap/30 rounded-md space-y-2">
                    <span className="text-xs font-semibold text-data-gap block">Telemetry Gap Override Protocol</span>
                    <p className="text-[11px] text-text-secondary leading-normal">
                      Critical meteorological sensors failed to report fresh observations. Automation is halted. The principal must verify ground conditions visually and record a manual determination.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-verified/10 border border-verified/30 rounded-md space-y-1">
                    <span className="text-xs font-semibold text-verified block">Approved Baseline Stands</span>
                    <p className="text-[11px] text-text-secondary leading-normal">
                      Plan v1 remains verified within approved environmental limits. No revised sign-off required.
                    </p>
                  </div>
                )}
              </PanelContent>
            </Panel>

            {/* Section I: Verified Audit Trail & Morning Summary */}
            <Panel>
              <PanelHeader className="pb-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-text-muted" />
                  <PanelTitle className="text-sm font-semibold">Verified Audit Trail &amp; Decision Summary</PanelTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopySummary}
                    className="text-xs flex items-center gap-1.5"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-verified" /> : <Copy className="h-3.5 w-3.5 text-text-muted" />}
                    {copied ? "Copied" : "Copy Summary"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadReceipt}
                    className="text-xs flex items-center gap-1.5"
                  >
                    <Download className="h-3.5 w-3.5 text-text-muted" />
                    Download Receipt (.txt)
                  </Button>
                </div>
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
                  <div className="flex justify-between text-text-muted">
                    <span>Execution Context:</span>
                    <span className="text-text-primary">Local Replay Engine (Offline Hackathon Demo)</span>
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
