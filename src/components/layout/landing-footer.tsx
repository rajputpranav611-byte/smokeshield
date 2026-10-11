import Link from "next/link";
import { ShieldCheck, ArrowRight } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="w-full border-t border-border-subtle bg-canvas text-text-secondary mt-20">
      <div className="mx-auto max-w-[1400px] px-6 py-12 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 pb-12 border-b border-border-subtle">
          {/* Brand & Description (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-verified"></span>
              <span className="font-display font-bold text-lg text-text-primary tracking-tight">SmokeShield</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-panel-elevated border border-border-strong text-text-muted">
                v1.0 Operations
              </span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed max-w-sm">
              Environmental operations decision system for schools and facilities. Converts satellite thermal observations and atmospheric wind vectors into explainable, policy-bounded activity schedules.
            </p>
            <div className="text-[11px] font-mono text-text-muted">
              Primary Facility: Delhi Public School, Sector 12
            </div>
          </div>

          {/* Core Operations Navigation (3 cols) */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-primary">
              Operations Console
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  Command Center <ArrowRight className="h-3 w-3 text-text-muted" />
                </Link>
              </li>
              <li>
                <Link href="/air-corridor" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  Air Corridor Map <ArrowRight className="h-3 w-3 text-text-muted" />
                </Link>
              </li>
              <li>
                <Link href="/plan-studio" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  Plan Studio (What-If) <ArrowRight className="h-3 w-3 text-text-muted" />
                </Link>
              </li>
              <li>
                <Link href="/plan-guard" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  PlanGuard Verification <ArrowRight className="h-3 w-3 text-text-muted" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Intelligence & Data Sources (4 cols) */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-primary">
              Evidence & Telemetry
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/evidence" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  Evidence Telemetry Audit <ArrowRight className="h-3 w-3 text-text-muted" />
                </Link>
              </li>
              <li>
                <Link href="/replay" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  Deterministic Replay Lab <ArrowRight className="h-3 w-3 text-text-muted" />
                </Link>
              </li>
              <li className="pt-1 text-[11px] text-text-muted">
                Telemetry Sources: NASA FIRMS (VIIRS/MODIS) • Open-Meteo GFS Wind • CPCB Ground Stations (Monitor Status)
              </li>
            </ul>
          </div>
        </div>

        {/* Environmental Data Limitations & Disclaimers */}
        <div className="pt-8 space-y-4">
          <div className="p-4 rounded-md bg-panel border border-border-strong/70 text-xs text-text-muted space-y-2">
            <div className="flex items-center gap-2 text-text-primary font-semibold">
              <ShieldCheck className="h-4 w-4 text-verified" />
              <span>Environmental Decision Support Notice</span>
            </div>
            <p className="leading-relaxed text-[11px]">
              SmokeShield provides deterministic decision-support recommendations based on available satellite radiometric thermal observations and atmospheric wind projections. It is designed to assist school administrators with precautionary scheduling; it does not replace statutory emergency management authorities, physical sensory checks, or regulatory directives. No guarantee of ambient safety is warranted.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-text-muted pt-4">
            <p>© 2026 SmokeShield. Deterministic Environmental Operations Console.</p>
            <p className="font-mono text-[11px] mt-2 sm:mt-0">
              Deterministic Engine v1.0.0 • Strict Data Provenance Enforced
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
