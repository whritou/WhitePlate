import { Shape, Region, Field, ToolbarShapes } from "./primitives"

export function ThemingSkeleton() {
  return (
    <>
      <Region name="theming-toolbar" className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-3">
        <Shape className="h-7 w-48" />

        <div className="flex flex-wrap items-center gap-3">
          <ToolbarShapes count={2} />

          <ToolbarShapes count={3} />
        </div>
      </Region>

      <Region name="theming-editor" className="grid min-h-0 flex-1 gap-6 overflow-auto p-6 xl:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.4fr)]">
        <div className="grid content-start gap-5">
          <Shape className="h-8 w-48 max-w-full" />

          <Shape className="h-4 w-full" />

          <Shape className="h-4 w-4/5" />

          <div className="grid gap-4 border p-5">
            {Array.from({ length: 5 }, (_, index) => (
              <Field key={index} width="w-32" />
            ))}
          </div>

          <ToolbarShapes count={3} />
        </div>

        <div className="grid min-h-[34rem] content-start gap-4 border p-5">
          <div className="flex items-center justify-between gap-4 border-b pb-4">
            <Shape className="h-7 w-48 max-w-full" />

            <ToolbarShapes count={2} />
          </div>

          <Shape className="aspect-[4/3] w-full" />
        </div>
      </Region>
    </>
  )
}
