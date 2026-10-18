import { Skeleton } from "@/components/ui/skeleton"

export function OrderKanbanSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5"
    >
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="grid content-start gap-3">
          <div className="flex items-center justify-between border-b px-1 py-3">
            <Skeleton className="h-5 w-28 rounded-none" />
            <Skeleton className="h-6 w-8 rounded-none" />
          </div>

          {Array.from({ length: 2 }, (_, card) => (
            <div key={card} className="grid gap-3 border bg-background p-4">
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-5 w-28 rounded-none" />
                <Skeleton className="h-6 w-16 rounded-none" />
              </div>
              <Skeleton className="h-4 w-2/3 rounded-none" />
              <Skeleton className="h-4 w-1/2 rounded-none" />
              <Skeleton className="h-10 w-full rounded-none" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
