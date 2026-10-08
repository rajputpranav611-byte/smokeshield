import * as React from "react"
import { cn } from "@/lib/utils"

const EvidenceCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col gap-2 p-4 rounded-md border border-border-subtle bg-canvas",
      className
    )}
    {...props}
  />
))
EvidenceCard.displayName = "EvidenceCard"

const EvidenceHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center justify-between", className)}
    {...props}
  />
))
EvidenceHeader.displayName = "EvidenceHeader"

const EvidenceSource = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn("text-xs font-semibold uppercase tracking-wider text-text-secondary", className)}
    {...props}
  />
))
EvidenceSource.displayName = "EvidenceSource"

const EvidenceTime = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn("text-xs font-mono text-text-muted", className)}
    {...props}
  />
))
EvidenceTime.displayName = "EvidenceTime"

const EvidenceContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-text-primary mt-1", className)}
    {...props}
  />
))
EvidenceContent.displayName = "EvidenceContent"

export { EvidenceCard, EvidenceHeader, EvidenceSource, EvidenceTime, EvidenceContent }
