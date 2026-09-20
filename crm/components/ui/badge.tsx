import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-zinc-900 text-white font-bold hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200",
        secondary:
          "border-zinc-200 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:border-[#242428] dark:bg-[#141416] dark:text-zinc-300 dark:hover:bg-[#1e1e22]",
        destructive:
          "border-red-200 bg-red-100 text-red-700 dark:border-transparent dark:bg-red-950/60 dark:text-red-300 dark:border-red-800/60",
        outline: "text-zinc-700 border-zinc-300 dark:text-zinc-300 dark:border-zinc-700",
        success:
          "border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/60 dark:text-emerald-400 font-semibold",
        warning:
          "border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/50 dark:text-amber-300 font-semibold",
        purple:
          "border-purple-200 bg-purple-100 text-purple-800 dark:border-purple-800/60 dark:bg-purple-950/60 dark:text-purple-300 font-semibold",
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

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge }
