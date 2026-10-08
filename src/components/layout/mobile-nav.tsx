"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Wind, 
  CalendarDays, 
  ShieldCheck,
  MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Home", href: "/", icon: LayoutDashboard },
  { name: "Map", href: "/air-corridor", icon: Wind },
  { name: "Plan", href: "/plan-studio", icon: CalendarDays },
  { name: "Guard", href: "/plan-guard", icon: ShieldCheck },
  { name: "More", href: "/evidence", icon: MoreHorizontal },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-canvas border-t border-border-subtle pb-safe">
      <div className="grid h-full w-full grid-cols-5 mx-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.name === "More" && (pathname === "/evidence" || pathname === "/replay"));
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className="inline-flex flex-col items-center justify-center px-5 hover:bg-panel transition-colors group"
            >
              <item.icon
                className={cn(
                  "w-6 h-6 mb-1",
                  isActive ? "text-primary" : "text-text-muted group-hover:text-text-secondary"
                )}
                aria-hidden="true"
              />
              <span 
                className={cn(
                  "text-[10px] font-semibold uppercase tracking-wider",
                  isActive ? "text-primary" : "text-text-muted group-hover:text-text-secondary"
                )}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
