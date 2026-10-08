"use client";

import { Bell, MapPin, ShieldCheck, UserCircle } from "lucide-react";

export function TopCommandBar() {
  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-border-subtle bg-canvas/80 backdrop-blur-md px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 justify-between items-center">
        {/* Left Side: Location */}
        <div className="flex items-center gap-2 text-sm text-text-primary">
          <MapPin className="h-4 w-4 text-text-muted" />
          <span className="font-semibold">Delhi Public School, Sector 12</span>
        </div>

        {/* Center: PlanGuard Status */}
        <div className="hidden sm:flex items-center gap-2 bg-panel-elevated border border-border-strong px-4 py-1.5 rounded-full">
          <ShieldCheck className="h-4 w-4 text-verified" />
          <span className="text-sm font-semibold text-text-primary">PlanGuard: Verified</span>
          <span className="text-xs text-text-muted font-mono ml-2">Updated 07:02 AM</span>
        </div>

        {/* Right Side: Actions & Profile */}
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <button type="button" className="-m-2.5 p-2.5 text-text-muted hover:text-text-primary transition-colors relative">
            <span className="sr-only">View notifications</span>
            <Bell className="h-5 w-5" aria-hidden="true" />
            <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-watch"></span>
          </button>

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-border-strong" aria-hidden="true" />

          {/* Profile */}
          <button type="button" className="-m-1.5 flex items-center p-1.5 hover:bg-panel rounded-md transition-colors">
            <span className="sr-only">Open user menu</span>
            <UserCircle className="h-8 w-8 text-text-secondary" aria-hidden="true" />
            <span className="hidden lg:flex lg:items-center">
              <span className="ml-4 text-sm font-semibold leading-6 text-text-primary" aria-hidden="true">
                Principal Sharma
              </span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
