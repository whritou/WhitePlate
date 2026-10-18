import { Shape, Region, Lines, ToolbarShapes, SkeletonCard, TableSkeleton } from "./primitives"
import { cn } from "@/lib/utils"

export function DashboardSkeleton() {
  return (
    <div className="grid gap-7">
      <Region name="dashboard-header" className="flex flex-wrap items-end justify-between gap-5 py-8">
        <div className="grid gap-3">
          <Shape className="h-4 w-40" />

          <Shape className="h-10 w-64 max-w-full" />
        </div>

        <ToolbarShapes />
      </Region>

      <Region name="dashboard-metrics" className="grid grid-cols-2 border-y sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className={cn("grid gap-3 border-b py-6 pe-6 xl:border-b-0", index ? "xl:border-s xl:ps-6" : "")}>
            <Shape className="h-4 w-2/3" />

            <Shape className="h-10 w-1/3" />

            <Shape className="h-4 w-1/2" />
          </div>
        ))}
      </Region>

      <Region name="dashboard-kitchen-connections" className="grid min-w-0 gap-8 py-8 xl:grid-cols-[1.55fr_1fr]">
        <div className="grid gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Shape className="h-8 w-40" />

            <Shape className="h-4 w-36" />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <SkeletonCard key={index} className="min-h-32" lines={2} />
            ))}
          </div>

          <div className="flex items-center justify-between gap-4 border-y py-4">
            <Shape className="h-12 w-64 max-w-full" />

            <Shape className="h-10 w-28" />
          </div>
        </div>

        <div className="grid content-start gap-5 xl:border-s xl:ps-8">
          <div className="flex items-center justify-between gap-3">
            <Shape className="h-8 w-40" />

            <Shape className="h-7 w-32" />
          </div>

          <SkeletonCard className="min-h-48" lines={3} />

          <SkeletonCard className="min-h-32" lines={2} />
        </div>
      </Region>

      <Region name="dashboard-latest-orders-storefront" className="grid min-w-0 gap-8 border-t pt-7 xl:grid-cols-[1.55fr_1fr]">
        <div className="grid gap-5">
          <div className="flex items-center justify-between gap-3">
            <Shape className="h-8 w-48" />

            <Shape className="h-9 w-24" />
          </div>

          <TableSkeleton rows={4} columns={4} />
        </div>

        <div className="grid content-start gap-4 xl:border-s xl:ps-8">
          <Shape className="h-8 w-40" />

          <div className="grid grid-cols-2 gap-3">
            <Shape className="aspect-[2/1] w-full" />

            <Shape className="aspect-[2/1] w-full" />
          </div>

          <Shape className="h-6 w-48 max-w-full" />

          <Lines count={2} />

          <ToolbarShapes />
        </div>
      </Region>
    </div>
  )
}
