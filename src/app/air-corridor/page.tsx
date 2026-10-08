import { AppShell } from "@/components/layout/app-shell";

export default function AirCorridor() {
  return (
    <AppShell>
      <div className="flex flex-col gap-8 h-[calc(100vh-12rem)]">
        <header>
          <h1 className="text-display-lg text-text-primary mb-2">Air Corridor</h1>
          <p className="text-body-md text-text-secondary">Map View Placeholder.</p>
        </header>
        <div className="flex-1 rounded-lg border border-border-strong bg-panel flex items-center justify-center">
          <p className="text-text-muted">MapLibre and R3F visualization will go here.</p>
        </div>
      </div>
    </AppShell>
  );
}
