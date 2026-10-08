import { AppShell } from "@/components/layout/app-shell";
import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Timeline, TimelineItem, TimelineDot, TimelineTime, TimelineTitle, TimelineContent } from "@/components/ui/timeline";
import { EvidenceCard, EvidenceHeader, EvidenceSource, EvidenceTime, EvidenceContent } from "@/components/ui/evidence";

export default function Home() {
  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <header>
          <h1 className="text-display-lg text-text-primary mb-2">Command Center</h1>
          <p className="text-body-md text-text-secondary">Environmental operations and active plans.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Plan Status - Elevated Panel */}
            <Panel elevated className="border-primary/50">
              <PanelHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <StatusBadge variant="verified" className="mb-2">Verified Plan</StatusBadge>
                  <PanelTitle className="text-heading-lg">Morning Assembly Shifted</PanelTitle>
                </div>
                <Button variant="default">Review Plan</Button>
              </PanelHeader>
              <PanelContent>
                <div className="flex gap-8 border-t border-border-strong pt-4 mt-2">
                  <div>
                    <p className="text-label text-text-muted mb-1">ORIGINAL SCHEDULE</p>
                    <p className="text-body-md text-text-secondary line-through">08:30 AM</p>
                  </div>
                  <div>
                    <p className="text-label text-text-muted mb-1">APPROVED SCHEDULE</p>
                    <p className="text-body-md text-primary font-semibold">10:00 AM</p>
                  </div>
                </div>
              </PanelContent>
            </Panel>

            {/* Timelines and Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Panel>
                <PanelHeader>
                  <PanelTitle>Event Timeline</PanelTitle>
                </PanelHeader>
                <PanelContent>
                  <Timeline>
                    <TimelineItem>
                      <TimelineDot active />
                      <TimelineTime>07:02 AM</TimelineTime>
                      <TimelineTitle>PlanGuard Verification</TimelineTitle>
                      <TimelineContent>Conditions match approved plan boundaries.</TimelineContent>
                    </TimelineItem>
                    <TimelineItem>
                      <TimelineDot />
                      <TimelineTime>06:31 AM</TimelineTime>
                      <TimelineTitle>Principal Approval</TimelineTitle>
                      <TimelineContent>Assembly moved to 10:00 AM.</TimelineContent>
                    </TimelineItem>
                    <TimelineItem>
                      <TimelineDot />
                      <TimelineTime>06:14 AM</TimelineTime>
                      <TimelineTitle>Risk Escalation</TimelineTitle>
                      <TimelineContent>New fire detections upwind.</TimelineContent>
                    </TimelineItem>
                  </Timeline>
                </PanelContent>
              </Panel>

              <Panel>
                <PanelHeader>
                  <PanelTitle>Environmental Evidence</PanelTitle>
                </PanelHeader>
                <PanelContent className="flex flex-col gap-4">
                  <EvidenceCard>
                    <EvidenceHeader>
                      <EvidenceSource>NASA FIRMS</EvidenceSource>
                      <EvidenceTime>Updated 5m ago</EvidenceTime>
                    </EvidenceHeader>
                    <EvidenceContent>
                      7 active thermal anomalies detected 15km SE.
                    </EvidenceContent>
                  </EvidenceCard>
                  
                  <EvidenceCard>
                    <EvidenceHeader>
                      <EvidenceSource>IMD Weather</EvidenceSource>
                      <EvidenceTime>Updated 12m ago</EvidenceTime>
                    </EvidenceHeader>
                    <EvidenceContent>
                      Wind shift to SE at 12 km/h.
                    </EvidenceContent>
                  </EvidenceCard>
                </PanelContent>
              </Panel>
            </div>

          </div>

          {/* Right Sidebar Area */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <Panel>
              <PanelHeader>
                <PanelTitle>Data Health</PanelTitle>
              </PanelHeader>
              <PanelContent className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-text-secondary">NASA FIRMS</span>
                  <StatusBadge variant="verified">Live</StatusBadge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-text-secondary">IMD Weather</span>
                  <StatusBadge variant="verified">Live</StatusBadge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-text-secondary">CPCB AQI</span>
                  <StatusBadge variant="data-gap">Stale</StatusBadge>
                </div>
              </PanelContent>
            </Panel>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
