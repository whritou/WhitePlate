import { Shape, Region, Field, ToolbarShapes, SkeletonCard } from "./primitives"

export function OverviewSkeleton() {
  return (
    <>
      <Region name="overview-header" className="flex flex-wrap items-end justify-between gap-4">
        <Shape className="h-10 w-72 max-w-full" />

        <ToolbarShapes count={3} />
      </Region>

      <Region name="overview-organizations" className="grid gap-4">
        <Shape className="h-8 w-52 max-w-full" />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <SkeletonCard key={index} className="min-h-36 content-between" lines={2} />
          ))}
        </div>
      </Region>

      <Region name="overview-restaurants" className="grid gap-4">
        <Shape className="h-8 w-48 max-w-full" />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <SkeletonCard key={index} className="min-h-32 content-between" lines={1} />
          ))}
        </div>
      </Region>
    </>
  )
}

export function OrganizationSignUpSkeleton() {
  return (
    <Region name="organization-signup-card" className="grid gap-6">
      <header className="grid gap-3">
        <Shape className="h-4 w-28" />

        <Shape className="h-10 w-72 max-w-full" />

        <Shape className="h-4 w-full max-w-lg" />

        <Shape className="h-4 w-4/5 max-w-lg" />
      </header>

      <div className="mt-8 grid gap-5">
        <Field width="w-48" />

        <Field width="w-32" />

        <Field width="w-40" />

        <Field width="w-36" />

        <Shape className="h-11 w-48 max-w-full" />
      </div>
    </Region>
  )
}

export function RestaurantCreateSkeleton() {
  return (
    <>
      <Region name="restaurant-back-link">
        <Shape className="h-11 w-28" />
      </Region>

      <Region name="restaurant-card" className="mt-6 grid gap-6 border bg-background p-6">
        <Region name="restaurant-header" className="grid gap-3">
          <Shape className="h-10 w-64 max-w-full" />

          <Shape className="h-4 w-full max-w-xl" />

          <Shape className="h-4 w-4/5 max-w-xl" />
        </Region>

        <Region name="restaurant-fields" className="grid gap-5">
          <Field width="w-40" />

          <Field width="w-32" />

          <Field width="w-48" />

          <Field width="w-36" />

          <Field width="w-32" />

          <Region name="restaurant-submit">
            <Shape className="h-11 w-48 max-w-full" />
          </Region>
        </Region>
      </Region>
    </>
  )
}
