"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base: 6px radius per design system. No pill shapes.
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all duration-150 outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 active:translate-y-px disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:     "bg-primary text-primary-foreground hover:opacity-90",
        outline:     "border-border bg-card text-foreground hover:bg-muted",
        secondary:   "bg-muted text-muted-foreground hover:bg-muted/80 border-border",
        ghost:       "text-foreground hover:bg-muted border-transparent",
        destructive: "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/15",
        link:        "text-primary underline-offset-4 hover:underline border-transparent px-0",
      },
      size: {
        default: "h-8 gap-1.5 px-3",
        xs:      "h-6 gap-1 px-2 text-xs rounded-sm [&_svg:not([class*='size-'])]:size-3",
        sm:      "h-7 gap-1 px-2.5 text-sm [&_svg:not([class*='size-'])]:size-3.5",
        lg:      "h-9 gap-2 px-4 text-base",
        icon:    "size-8",
        "icon-xs": "size-6 rounded-sm [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
