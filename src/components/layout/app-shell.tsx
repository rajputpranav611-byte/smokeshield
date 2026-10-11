import { Sidebar } from "./sidebar";
import { TopCommandBar } from "./top-command-bar";
import { MobileNav } from "./mobile-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-[248px] flex flex-col min-h-screen">
        <TopCommandBar />
        <main className="flex-1 pb-16 lg:pb-0">
          <div className="mx-auto max-w-[1600px] p-6 lg:p-8">
            {children}
          </div>
        </main>
        {/* Compact Operational Status Footer for AppShell */}
        <footer className="border-t border-border-subtle bg-canvas/80 px-6 py-3 hidden lg:block text-[11px] text-text-muted">
          <div className="mx-auto max-w-[1600px] flex items-center justify-between font-mono">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-verified"></span>
              <span className="text-text-secondary">Node: DPS Sector 12</span>
              <span>•</span>
              <span>Risk Engine: v1.0.0</span>
            </div>
            <div>
              <span>NASA FIRMS + Open-Meteo Telemetry • Deterministic Operations</span>
            </div>
          </div>
        </footer>
      </div>
      <MobileNav />
    </div>
  );
}
