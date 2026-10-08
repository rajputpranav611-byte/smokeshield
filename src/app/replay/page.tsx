import { AppShell } from "@/components/layout/app-shell";

export default function Replay() {
  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <header>
          <h1 className="text-display-lg text-text-primary mb-2">Replay</h1>
          <p className="text-body-md text-text-secondary">Historical simulation.</p>
        </header>
      </div>
    </AppShell>
  );
}
