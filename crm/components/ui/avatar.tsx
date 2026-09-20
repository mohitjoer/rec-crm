import * as React from "react"
import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-[#141418] border border-zinc-200 dark:border-[#26262d] text-xs font-bold text-zinc-900 dark:text-white items-center justify-center shadow-inner transition-colors",
      className
    )}
    {...props}
  />
))
Avatar.displayName = "Avatar"

const AvatarFallback = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center font-bold text-zinc-700 dark:text-zinc-300",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarFallback }
