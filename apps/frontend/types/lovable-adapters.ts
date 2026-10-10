import type { ComponentProps, ReactNode } from "react"
import type { Button } from "@/components/ui/button"

export type LovableButtonProps = Omit<
  ComponentProps<typeof Button>,
  "variant" | "render"
> & {
  asChild?: boolean
  variant?:
    | "default"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "destructive"
    | "heroPrimary"
    | "heroSecondary"
  children?: ReactNode
}
