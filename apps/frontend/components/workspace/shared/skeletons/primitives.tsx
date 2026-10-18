import type { ReactNode } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export function Shape({ className }: { className: string }) {
  return <Skeleton className={cn("rounded-none", className)} />
}

export function Region({
  name,
  className,
  children,
}: {
  name: string
  className?: string
  children: ReactNode
}) {
  return (
    <section data-skeleton-region={name} className={className}>
      {children}
    </section>
  )
}

export function Lines({ count = 2 }: { count?: number }) {
  return (
    <div className="grid gap-3">
      {Array.from({ length: count }, (_, index) => (
        <Shape
          key={index}
          className={index === count - 1 ? "h-4 w-3/5" : "h-4 w-full"}
        />
      ))}
    </div>
  )
}

export function Field({ width = "w-40" }: { width?: string }) {
  return (
    <div className="grid min-w-0 gap-2">
      <Shape className={cn("h-4 max-w-full", width)} />

      <Shape className="h-11 w-full" />
    </div>
  )
}

export function ToolbarShapes({ count = 2 }: { count?: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: count }, (_, index) => (
        <Shape key={index} className="h-11 w-32 max-w-full" />
      ))}
    </div>
  )
}

export function SkeletonCard({
  className = "",
  lines = 2,
}: {
  className?: string
  lines?: number
}) {
  return (
    <div className={cn("grid gap-4 border bg-background p-5", className)}>
      <Shape className="h-5 w-2/5" />

      <Lines count={lines} />
    </div>
  )
}

export function TableSkeleton({
  rows,
  columns,
}: {
  rows: number
  columns: number
}) {
  const columnLayout =
    columns === 4 ? "sm:grid-cols-4" : "sm:grid-cols-4 xl:grid-cols-6"

  return (
    <div className="min-w-0 overflow-hidden border">
      <div className={cn("grid grid-cols-2 gap-4 border-b bg-secondary p-3", columnLayout)}>
        {Array.from({ length: columns }, (_, index) => (
          <Shape key={index} className="h-4 w-3/4 max-w-full" />
        ))}
      </div>

      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className={cn("grid grid-cols-2 gap-4 border-b p-3 last:border-b-0", columnLayout)}>
          {Array.from({ length: columns }, (_, column) => (
            <Shape key={column} className={cn("h-5 max-w-full", column === 0 ? "w-4/5" : "w-2/3")} />
          ))}
        </div>
      ))}
    </div>
  )
}
