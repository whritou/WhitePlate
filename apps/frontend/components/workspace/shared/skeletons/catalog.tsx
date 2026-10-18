import { Shape, Region, ToolbarShapes, SkeletonCard } from "./primitives"

export function CatalogHeader({ languages = false }: { languages?: boolean }) {
  return (
    <>
      <Region name={languages ? "languages-header" : "catalog-header"} className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-3">
        <Shape className="h-7 w-48 max-w-full" />

        <div className="flex flex-wrap items-center gap-3">
          <Shape className="h-4 w-24" />

          <Shape className="h-4 w-52 max-w-full" />
        </div>
      </Region>

      <Region name="catalog-tabs" className="flex flex-wrap items-center justify-between gap-3 border-b px-6">
        <div className="flex flex-wrap">
          {Array.from({ length: 4 }, (_, index) => (
            <Shape key={index} className="h-12 w-32 border-b-2 border-transparent" />
          ))}
        </div>

        <ToolbarShapes />
      </Region>
    </>
  )
}

export function CatalogSkeleton() {
  return (
    <>
      <CatalogHeader />

      <Region name="catalog-list" className="grid min-w-0 gap-6 p-6">
        <div className="grid min-w-0 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className="grid content-start gap-2 border p-4">
            <Shape className="mb-2 h-6 w-36" />

            {Array.from({ length: 5 }, (_, index) => (
              <Shape key={index} className="h-11 w-full" />
            ))}

            <Shape className="mt-3 h-10 w-full" />
          </div>

          <div className="grid min-w-0 content-start gap-4">
            <Region name="catalog-actions" className="flex flex-wrap items-center justify-between gap-3">
              <Shape className="h-8 w-48 max-w-full" />

              <ToolbarShapes count={3} />
            </Region>

            <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
              <div className="grid content-start gap-3">
                {Array.from({ length: 5 }, (_, index) => (
                  <div key={index} className="flex min-w-0 items-center gap-3 border p-3">
                    <Shape className="size-16 shrink-0" />

                    <div className="grid min-w-0 flex-1 gap-2">
                      <Shape className="h-5 w-3/5" />

                      <Shape className="h-4 w-2/5" />
                    </div>

                    <Shape className="h-9 w-20" />
                  </div>
                ))}
              </div>

              <Region name="catalog-editor">
                <SkeletonCard className="min-h-96" lines={6} />
              </Region>
            </div>
          </div>
        </div>
      </Region>
    </>
  )
}

export function MenuLanguagesSkeleton() {
  return (
    <>
      <CatalogHeader languages />

      <Region name="languages-settings" className="mx-auto grid max-w-5xl gap-6 p-6">
        <Shape className="h-8 w-52 max-w-full" />

        <SkeletonCard className="min-h-36" lines={2} />

        <SkeletonCard className="min-h-36" lines={2} />

        <Region name="languages-translations">
          <SkeletonCard className="min-h-[28rem]" lines={8} />
        </Region>
      </Region>
    </>
  )
}
