import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import Link from "next/link"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white hover:bg-blue-700",
        primary: "bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5",
        secondary: "bg-purple-600 text-white hover:bg-purple-700",
        success: "bg-green-600 text-white hover:bg-green-700",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
        ghost: "text-gray-700 hover:bg-gray-100",
        link: "text-blue-600 underline-offset-4 hover:underline",
      },
      size: {
        default: "px-4 py-2",
        sm: "px-3 py-1 text-xs",
        lg: "px-6 py-3",
        xl: "px-8 py-4 text-base",
        icon: "h-10 w-10",
      },
      rounded: {
        default: "rounded-lg",
        xl: "rounded-xl",
        full: "rounded-full",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      rounded: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export interface LinkButtonProps
  extends React.ComponentProps<typeof Link>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, rounded, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, rounded, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

const LinkButton = React.forwardRef<
  React.ElementRef<typeof Link>,
  LinkButtonProps
>(({ className, variant, size, rounded, asChild = false, ...props }, ref) => {
  return (
    <Link
      className={cn(buttonVariants({ variant, size, rounded, className }))}
      ref={ref}
      {...props}
    />
  )
})
LinkButton.displayName = "LinkButton"

export { Button, LinkButton, buttonVariants } 