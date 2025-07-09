import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const loadingVariants = cva(
  "animate-spin rounded-full border-b-2",
  {
    variants: {
      variant: {
        default: "border-blue-600",
        primary: "border-purple-600", 
        white: "border-white",
      },
      size: {
        sm: "h-4 w-4",
        default: "h-8 w-8",
        lg: "h-12 w-12",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface LoadingProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loadingVariants> {
  text?: string
}

const Loading = React.forwardRef<HTMLDivElement, LoadingProps>(
  ({ className, variant, size, text, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center justify-center", className)}
      {...props}
    >
      <div className={cn(loadingVariants({ variant, size }))} />
      {text && <span className="ml-3 text-gray-600">{text}</span>}
    </div>
  )
)
Loading.displayName = "Loading"

const LoadingDots = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex justify-center space-x-1", className)}
    {...props}
  >
    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce delay-100"></div>
    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-200"></div>
  </div>
))
LoadingDots.displayName = "LoadingDots"

export { Loading, LoadingDots } 