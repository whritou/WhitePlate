import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex max-w-full min-w-0 shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-center text-base font-medium whitespace-normal transition-colors duration-(--duration-feedback) ease-(--ease-interface) outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid disabled:pointer-events-none disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100 aria-disabled:bg-muted aria-disabled:text-muted-foreground aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        unstyled: "",
        default:
          "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-hover active:brightness-90",
        outline:
          "border-input bg-card text-foreground hover:border-input hover:bg-muted active:bg-surface-variant aria-expanded:bg-muted",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-surface-variant active:border-brand-text active:bg-surface-dim aria-expanded:bg-surface-variant",
        ghost:
          "text-foreground hover:bg-surface-variant active:border-brand-text active:bg-surface-dim aria-expanded:bg-surface-variant",
        destructive:
          "bg-destructive-muted text-destructive hover:border-destructive active:border-destructive active:ring-2 active:ring-destructive",
        link: "text-brand-text underline underline-offset-4 hover:underline active:decoration-2",
      },
      size: {
        default: "min-h-11 gap-2 px-4 py-2",
        xs: "min-h-11 gap-1 px-3 py-2 text-sm",
        sm: "min-h-11 gap-2 px-3 py-2 text-sm",
        lg: "min-h-12 gap-2 px-5 py-3",
        icon: "size-11",
        "icon-xs": "size-11",
        "icon-sm": "size-11",
        "icon-lg": "size-12",
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
