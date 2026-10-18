import { Shape, Region, ToolbarShapes, SkeletonCard } from "./primitives"

export function AnalyticsSkeleton() {
  return (
    <>
      <Region name="analytics-header" className="flex flex-wrap items-end justify-between gap-4 px-6 pt-8 pb-6">
        <div className="grid gap-3">
          <Shape className="h-4 w-44" />

          <Shape className="h-10 w-56 max-w-full" />
        </div>

        <ToolbarShapes count={4} />
      </Region>

      <div className="space-y-6 px-6 pb-12">
        <Region name="analytics-metrics" className="grid grid-cols-2 gap-px border bg-foreground md:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="grid min-h-36 content-start gap-3 bg-background p-5">
              <Shape className="h-4 w-2/3" />

              <Shape className="mt-1 h-9 w-1/2" />

              <Shape className="h-4 w-2/5" />
            </div>
          ))}
        </Region>

        <Region name="analytics-trend" className="border bg-background">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3">
            <Shape className="h-6 w-48 max-w-full" />

            <ToolbarShapes />
          </div>

          <Shape className="h-72 w-full p-4" />
        </Region>

        <Region name="analytics-breakdowns" className="grid gap-6 lg:grid-cols-3">
          <SkeletonCard className="min-h-80 lg:col-span-2" lines={5} />

          <SkeletonCard className="min-h-80" lines={4} />
        </Region>
      </div>
    </>
  )
}
