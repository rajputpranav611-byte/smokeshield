import * as React from "react"
import { cn } from "@/lib/utils"

const Timeline = React.forwardRef<
  HTMLOListElement,
  React.HTMLAttributes<HTMLOListElement>
>(({ className, ...props }, ref) => (
  <ol ref={ref} className={cn("relative border-l border-border-strong ml-3", className)} {...props} />
))
Timeline.displayName = "Timeline"

const TimelineItem = React.forwardRef<
  HTMLLIElement,
  React.HTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("mb-6 ml-6", className)} {...props} />
))
TimelineItem.displayName = "TimelineItem"

const TimelineDot = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & { active?: boolean }
>(({ className, active, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      "absolute flex items-center justify-center w-3 h-3 rounded-full -left-1.5 ring-4 ring-background",
      active ? "bg-primary" : "bg-border-strong",
      className
    )}
    {...props}
  />
))
TimelineDot.displayName = "TimelineDot"

const TimelineTime = React.forwardRef<
  HTMLTimeElement,
  React.HTMLAttributes<HTMLTimeElement>
>(({ className, ...props }, ref) => (
  <time
    ref={ref}
    className={cn("mb-1 text-sm font-mono font-normal leading-none text-text-muted", className)}
    {...props}
  />
))
TimelineTime.displayName = "TimelineTime"

const TimelineTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn("text-base font-semibold text-text-primary", className)} {...props} />
))
TimelineTitle.displayName = "TimelineTitle"

const TimelineContent = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("mb-4 text-sm font-normal text-text-secondary mt-2", className)} {...props} />
))
TimelineContent.displayName = "TimelineContent"

export { Timeline, TimelineItem, TimelineDot, TimelineTime, TimelineTitle, TimelineContent }
