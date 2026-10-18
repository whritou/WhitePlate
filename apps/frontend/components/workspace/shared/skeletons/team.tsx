import { Shape, Region, ToolbarShapes, TableSkeleton } from "./primitives"
import { cn } from "@/lib/utils"

export function TeamSkeleton() {
  return (
    <div className="live-team-directory min-w-0">
      <Region name="team-header" className="mb-6 flex flex-wrap items-end justify-between gap-6">
        <div className="grid gap-2">
          <Shape className="h-4 w-40" />

          <Shape className="h-10 w-52 max-w-full" />
        </div>

        <div className="ml-auto flex max-w-full flex-wrap items-end gap-4">
          <Region name="team-summary" className="grid grid-cols-3 border">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className={cn("grid gap-2 px-5 py-3", index ? "border-l" : "")}>
                <Shape className="h-4 w-16" />

                <Shape className="h-7 w-10" />
              </div>
            ))}
          </Region>

          <Shape className="h-11 w-40 max-w-full" />
        </div>
      </Region>

      <Region name="team-directory" className="min-w-0">
        <div className="flex flex-wrap border-b">
          {["members", "invitations", "roles", "activity"].map((tab) => (
            <Shape key={tab} className="h-12 w-36 border-b-2 border-transparent" />
          ))}
        </div>

        <Region name="team-members" className="grid gap-5 pt-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <Shape className="h-11 w-72 max-w-full" />

            <ToolbarShapes />
          </div>

          <TableSkeleton rows={5} columns={4} />
        </Region>
      </Region>
    </div>
  )
}
