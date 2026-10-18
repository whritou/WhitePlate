import { Shape, Region, Field, ToolbarShapes, SkeletonCard } from "./primitives"
import { cn } from "@/lib/utils"

export function OrganizationSettingsSkeleton() {
  return (
    <>
      <Region name="settings-header" className="flex flex-wrap items-end justify-between gap-6 px-6 pt-8 pb-6">
        <div className="grid gap-2">
          <Shape className="h-4 w-40" />

          <Shape className="h-10 w-48" />
        </div>
      </Region>

      <div className="grid gap-6 px-6 pb-12 lg:grid-cols-[240px_1fr]">
        <Region name="settings-sections" className="grid h-fit grid-cols-2 border sm:grid-cols-3 lg:grid-cols-1">
          {Array.from({ length: 7 }, (_, index) => (
            <div key={index} className={cn("grid gap-2 px-4 py-3", index ? "border-t" : "")}>
              <Shape className="h-5 w-32 max-w-full" />

              <Shape className="hidden h-3 w-40 max-w-full lg:block" />
            </div>
          ))}
        </Region>

        <div className="min-w-0 space-y-6">
          <Region name="settings-fields" className="grid gap-5 border bg-card p-6">
            <div className="grid gap-2 border-b pb-5">
              <Shape className="h-8 w-64 max-w-full" />

              <Shape className="h-4 w-48 max-w-full" />
            </div>

            <div className="flex items-center gap-4 border-b pb-5">
              <Shape className="size-16 shrink-0" />

              <div className="grid min-w-0 flex-1 gap-2">
                <Shape className="h-5 w-48 max-w-full" />

                <Shape className="h-4 w-64 max-w-full" />
              </div>
            </div>

            <Field width="w-40" />

            <Field width="w-48" />

            <div className="grid gap-5 sm:grid-cols-2">
              <Field width="w-32" />

              <Field width="w-32" />
            </div>

            <Region name="settings-submit">
              <Shape className="h-11 w-48 max-w-full" />
            </Region>
          </Region>

          <Region name="settings-archive">
            <SkeletonCard className="min-h-36" lines={2} />
          </Region>
        </div>
      </div>
    </>
  )
}

export function RestaurantSettingsSkeleton() {
  return (
    <>
      <Region name="restaurant-settings-header">
        <Shape className="h-4 w-48 max-w-full" />

        <Shape className="mt-2 h-10 w-64 max-w-full" />
      </Region>

      <Region name="restaurant-settings-layout" className="grid min-w-0 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <div className="hidden h-fit border lg:grid">
          {Array.from({ length: 5 }, (_, index) => (
            <Shape key={index} className="h-12 w-full border-b last:border-b-0" />
          ))}
        </div>

        <div className="grid min-w-0 gap-5">
          <Field width="w-36" />

          <Region name="restaurant-settings-fields" className="grid gap-5 border p-6">
            <Field width="w-40" />

            <Field width="w-32" />

            <Field width="w-48" />

            <Field width="w-36" />

            <ToolbarShapes />
          </Region>

          <SkeletonCard className="min-h-40" lines={2} />
        </div>
      </Region>
    </>
  )
}
