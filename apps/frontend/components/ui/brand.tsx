import { UtensilsCrossed } from "lucide-react"
import { cn } from "@/lib/utils"

export function Brand({
  className,
  compactOnMobile = false,
}: {
  className?: string
  compactOnMobile?: boolean
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-3 font-heading text-xl font-bold tracking-tight",
        className
      )}
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
        <UtensilsCrossed aria-hidden="true" className="size-5" />
      </span>
      <span className={cn(compactOnMobile && "hidden sm:inline")}>
        WhitePlate
      </span>
    </span>
  )
}
