import { AppShell } from "@/components/layout/app-shell";

export default function Evidence() {
  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <header>
          <h1 className="text-display-lg text-text-primary mb-2">Evidence</h1>
          <p className="text-body-md text-text-secondary">Forensic and telemetry breakdown.</p>
        </header>
      </div>
    </AppShell>
  );
}
