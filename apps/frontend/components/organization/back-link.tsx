import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { ArrowLeft } from "lucide-react"

export function BackLink({
  label,
  className,
}: {
  label: string
  className?: string
}) {
  return (
    <Link
      href="/organization"
      className={cn(
        "inline-flex min-h-11 max-w-full min-w-0 items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid",
        className
      )}
    >
      <ArrowLeft aria-hidden="true" className="size-4 shrink-0" />

      <span>{label}</span>
    </Link>
  )
}
