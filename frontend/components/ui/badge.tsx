import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  // Base: 4px radius, no pill shape. Compact, inline, precise.
  "group/badge inline-flex h-[20px] w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-sm border px-2 py-px text-[11px] font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default:     "bg-primary text-primary-foreground border-transparent",
        secondary:   "bg-muted text-muted-foreground border-border",
        destructive: "bg-destructive/10 text-destructive border-destructive/20",
        outline:     "border-border text-foreground bg-transparent",
        ghost:       "border-transparent text-muted-foreground hover:bg-muted",
        link:        "border-transparent text-primary underline-offset-4 hover:underline",
        // Semantic status variants
        review:      "bg-[hsl(var(--status-review-bg))] text-[hsl(var(--status-review-fg))] border-[hsl(var(--status-review-border))]",
        resolved:    "bg-[hsl(var(--status-resolved-bg))] text-[hsl(var(--status-resolved-fg))] border-[hsl(var(--status-resolved-border))]",
        correct:     "bg-[hsl(var(--status-correct-bg))] text-[hsl(var(--status-correct-fg))] border-[hsl(var(--status-correct-border))]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
