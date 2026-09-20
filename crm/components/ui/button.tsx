import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-xs font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 shadow-sm",
        destructive: "bg-red-600 text-white hover:bg-red-700 dark:bg-red-900 dark:text-red-100 dark:hover:bg-red-800",
        outline: "border border-zinc-300 dark:border-zinc-700/80 bg-transparent hover:bg-zinc-100 text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-white dark:text-zinc-300",
        secondary: "bg-zinc-100 text-zinc-800 hover:bg-zinc-200 border border-zinc-200 dark:bg-[#141416] dark:text-zinc-200 dark:hover:bg-[#1f1f24] dark:border-[#242428]",
        ghost: "hover:bg-zinc-100 hover:text-zinc-900 text-zinc-600 dark:hover:bg-zinc-800/80 dark:hover:text-white dark:text-zinc-400",
        link: "text-zinc-900 dark:text-zinc-100 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-lg px-3",
        lg: "h-11 rounded-2xl px-8 text-sm font-bold",
        icon: "h-9 w-9 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
