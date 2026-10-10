"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { EvidenceCard, EvidenceHeader, EvidenceSource, EvidenceTime, EvidenceContent } from "@/components/ui/evidence";
import { EnvironmentalAssessment } from "@/domain/assessment";
import { useRouter } from "next/navigation";

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
            id: "s1", name: "Replay School", latitude: 0, longitude: 0, timezone: "UTC", operationalPolicyReference: "P1"
          },
          operationalPlan: {
            id: "p1", schoolId: "s1", version: 1, createdAt: new Date().toISOString(), status: "APPROVED", policyVersion: "1",
            activities: [
              { id: "a1", name: "Outdoor Assembly", startTime: new Date(new Date().getTime() + 3600000).toISOString(), endTime: new Date(new Date().getTime() + 7200000).toISOString(), locationType: "OUTDOOR" }
            ]
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
          <p className="text-text-muted">Loading Command Center data...</p>
        </div>
      </AppShell>
    );
  }

  if (error || !assessment) {
    return (
      <AppShell>
        <div className="flex flex-col gap-4 p-8 border border-red-900 bg-red-950/20 rounded-lg">
          <h2 className="text-red-500 font-bold">Error Loading Data</h2>
          <p className="text-red-400">{error || "Unknown error"}</p>
        </div>
      </AppShell>
    );
  }

  const fires = assessment.evidence.fires || [];
  const weather = assessment.evidence.weather;

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <header>
          <h1 className="text-display-lg text-text-primary mb-2">Command Center</h1>
          <p className="text-body-md text-text-secondary">Environmental operations and active plans. {assessment.isSimulation ? "(Replay Mode)" : ""}</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 flex flex-col gap-6">

            <Panel elevated className="border-primary/50">
              <PanelHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <StatusBadge variant={assessment.recommendation.action === "NO_CHANGE" ? "verified" : "escalated"} className="mb-2">
                    {assessment.recommendation.action}
                  </StatusBadge>
                  <PanelTitle className="text-heading-lg">{assessment.recommendation.rationale}</PanelTitle>
                </div>
                <Button variant="default" onClick={() => router.push('/plan-studio')}>Modify Plan</Button>
              </PanelHeader>
              <PanelContent>
                <div className="flex gap-8 border-t border-border-strong pt-4 mt-2">
                  <div>
                    <p className="text-label text-text-muted mb-1">CONFIDENCE</p>
                    <p className="text-body-md text-text-primary">{(assessment.riskAssessment.confidenceScore * 100).toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="text-label text-text-muted mb-1">OVERLAP MINUTES</p>
                    <p className="text-body-md text-primary font-semibold">{assessment.riskAssessment.overlapMinutes} mins</p>
                  </div>
                </div>
              </PanelContent>
            </Panel>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Panel>
                <PanelHeader>
                  <PanelTitle>Environmental Evidence</PanelTitle>
                </PanelHeader>
                <PanelContent className="flex flex-col gap-4">
                  {fires.map((f, i) => (
                    <EvidenceCard key={i}>
                      <EvidenceHeader>
                        <EvidenceSource>NASA FIRMS ({f.source})</EvidenceSource>
                        <EvidenceTime>Observed: {new Date(f.observedAt).toLocaleTimeString()}</EvidenceTime>
                      </EvidenceHeader>
                      <EvidenceContent>
                        Fire anomaly detected at {f.latitude}, {f.longitude}. Confidence: {f.confidence}%
                      </EvidenceContent>
                    </EvidenceCard>
                  ))}

                  {weather ? (
                    <EvidenceCard>
                      <EvidenceHeader>
                        <EvidenceSource>Weather ({weather.source})</EvidenceSource>
                        <EvidenceTime>Observed: {new Date(weather.observedAt).toLocaleTimeString()}</EvidenceTime>
                      </EvidenceHeader>
                      <EvidenceContent>
                        Wind {weather.windSpeed}km/h at {weather.windDirection}°.
                      </EvidenceContent>
                    </EvidenceCard>
                  ) : (
                    <div className="p-4 bg-gray-900 border border-gray-800 rounded">
                      <p className="text-text-muted">No weather evidence provided.</p>
                    </div>
                  )}
                </PanelContent>
              </Panel>

              <Panel>
                <PanelHeader>
                  <PanelTitle>Potential Smoke-Influence Corridor</PanelTitle>
                </PanelHeader>
                <PanelContent>
                  <div className="bg-panel-darker rounded border border-border-strong p-4 flex flex-col gap-2 items-center justify-center text-center h-[200px]">
                    <p className="text-text-secondary text-sm">Modeled corridor based on deterministic risk engine</p>
                    <p className="text-text-muted text-xs mb-4">Not a directly measured smoke plume.</p>
                    <StatusBadge variant={assessment.riskAssessment.overlapMinutes > 0 ? "escalated" : "verified"}>
                      {assessment.riskAssessment.overlapMinutes > 0 ? "Corridor Intersects Activity" : "No Intersection"}
                    </StatusBadge>
                  </div>
                </PanelContent>
              </Panel>
            </div>

          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
            <Panel>
              <PanelHeader>
                <PanelTitle>Data Health</PanelTitle>
              </PanelHeader>
              <PanelContent className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-text-secondary">NASA FIRMS</span>
                  <StatusBadge variant={assessment.providerStatuses.fire === "SUCCESS" ? "verified" : "data-gap"}>{assessment.providerStatuses.fire}</StatusBadge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-text-secondary">Weather</span>
                  <StatusBadge variant={assessment.providerStatuses.weather === "SUCCESS" ? "verified" : "data-gap"}>{assessment.providerStatuses.weather}</StatusBadge>
                </div>
                {assessment.dataQuality.hasMissingCriticalData && (
                  <div className="mt-2 p-3 bg-red-950/30 border border-red-900 rounded">
                    <p className="text-red-400 text-sm">Data Gap: {assessment.dataQuality.notes.join(", ")}</p>
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
