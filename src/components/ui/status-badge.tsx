import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-pill border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 uppercase tracking-wider",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-canvas",
        verified:
          "border-transparent bg-verified/20 text-verified border border-verified/50",
        watch:
          "border-transparent bg-watch/20 text-watch border border-watch/50",
        escalated:
          "border-transparent bg-escalated/20 text-escalated border border-escalated/50",
        danger:
          "border-transparent bg-danger/20 text-danger border border-danger/50",
        "data-gap":
          "border-transparent bg-data-gap/20 text-data-gap border border-data-gap/50",
        info:
          "border-transparent bg-info/20 text-info border border-info/50",
        outline: "text-text-primary border-border-strong",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function StatusBadge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { StatusBadge, badgeVariants }
