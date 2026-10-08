import { AppShell } from "@/components/layout/app-shell";

export default function PlanGuard() {
  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <header>
          <h1 className="text-display-lg text-text-primary mb-2">PlanGuard</h1>
          <p className="text-body-md text-text-secondary">Morning Verification.</p>
        </header>
      </div>
    </AppShell>
  );
}
