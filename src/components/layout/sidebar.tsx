"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Wind, 
  CalendarDays, 
  ShieldCheck, 
  Search, 
  History,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Command Center", href: "/", icon: LayoutDashboard },
  { name: "Air Corridor", href: "/air-corridor", icon: Wind },
  { name: "Plan Studio", href: "/plan-studio", icon: CalendarDays },
  { name: "PlanGuard", href: "/plan-guard", icon: ShieldCheck },
  { name: "Evidence", href: "/evidence", icon: Search },
  { name: "Replay", href: "/replay", icon: History },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-[248px] lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-border-subtle bg-canvas px-6 pb-4">
        <div className="flex h-16 shrink-0 items-center">
          <span className="text-primary font-display font-bold text-xl tracking-tight">SmokeShield</span>
        </div>
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <div className="text-xs font-semibold leading-6 text-text-muted uppercase tracking-wider mb-2">
                Operations
              </div>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        pathname === item.href
                          ? "bg-panel text-primary"
                          : "text-text-secondary hover:bg-panel hover:text-text-primary",
                        "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors"
                      )}
                    >
                      <item.icon
                        className={cn(
                          pathname === item.href ? "text-primary" : "text-text-muted group-hover:text-text-primary",
                          "h-5 w-5 shrink-0"
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
            
            <li className="mt-auto">
              <div className="flex items-center gap-x-3 text-sm font-semibold leading-6 text-text-secondary">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-panel border border-border-subtle">
                  <Activity className="h-4 w-4 text-info" />
                </div>
                <div>
                  <div className="text-xs text-text-muted">System Status</div>
                  <div className="text-text-primary">All Systems Nominal</div>
                </div>
              </div>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
