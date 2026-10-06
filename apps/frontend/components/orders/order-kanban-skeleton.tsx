import { Skeleton } from "@/components/ui/skeleton"

export function OrderKanbanSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-4"
    >
      {Array.from({ length: 5 }, (_, index) => (
        <div
          key={index}
          className="grid gap-4 rounded-lg border border-border bg-muted p-3"
        >
          <Skeleton className="h-12 w-full" />

          <div className="grid min-h-48 gap-4 rounded-lg border border-border bg-card p-5">
            <Skeleton className="h-5 w-32" />

            <Skeleton className="h-4 w-40" />

            <Skeleton className="h-5 w-full" />

            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
