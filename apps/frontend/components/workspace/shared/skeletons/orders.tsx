import { Shape, Region, Field, ToolbarShapes, TableSkeleton } from "./primitives"
import { OrderKanbanSkeleton } from "@/components/orders/order-kanban-skeleton"
import { cn } from "@/lib/utils"

export function OrdersSkeleton() {
  return (
    <>
      <Region name="orders-header" className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Shape className="h-4 w-40" />

            <Shape className="h-6 w-28" />
          </div>

          <Shape className="h-10 w-64 max-w-full" />

          <Shape className="h-4 w-full max-w-2xl" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Region name="orders-summary" className="grid grid-cols-3 border">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className={cn("grid gap-2 px-5 py-3", index ? "border-l" : "")}>
                <Shape className="h-4 w-20" />

                <Shape className="h-7 w-10" />
              </div>
            ))}
          </Region>
        </div>

        <Shape className="h-11 w-40" />
      </Region>

      <Region name="orders-realtime-toolbar" className="flex flex-wrap items-center justify-between gap-3">
        <Shape className="h-8 w-72 max-w-full" />

        <Shape className="h-11 w-36" />
      </Region>

      <Region name="orders-filters" className="grid gap-5">
        <div className="flex flex-wrap border-b">
          {Array.from({ length: 6 }, (_, index) => (
            <Shape key={index} className="h-12 w-28 border-b-2 border-transparent" />
          ))}
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            <Shape className="h-11 w-72 max-w-full" />

            <Shape className="h-11 w-44" />
          </div>

          <Shape className="h-5 w-32" />
        </div>
      </Region>

      <Region name="orders-list">
        <OrderKanbanSkeleton />
      </Region>
    </>
  )
}

export function OrderHistorySkeleton() {
  return (
    <>
      <Region name="order-history-header">
        <Shape className="h-4 w-48" />

        <Shape className="mt-2 h-10 w-64 max-w-full" />

        <Shape className="mt-2 h-4 w-full max-w-2xl" />
      </Region>

      <Region name="order-history-summary" className="grid gap-3">
        <div className="grid border sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className={cn("grid gap-3 border-b p-4 sm:border-r sm:border-b-0", index === 2 ? "sm:border-r-0" : "")}>
              <Shape className="h-4 w-28" />

              <Shape className="h-8 w-32 max-w-full" />
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Shape className="h-4 w-56 max-w-full" />

          <Shape className="h-11 w-36" />
        </div>
      </Region>

      <Region name="order-history-filters" className="grid gap-4 border p-5 sm:grid-cols-2 lg:grid-cols-4">
        <Field width="w-24" />

        <Field width="w-32" />

        <Field width="w-28" />

        <Field width="w-32" />

        <Shape className="h-11 w-36" />
      </Region>

      <Region name="order-history-table" className="grid gap-4 border p-4 sm:p-6">
        <Shape className="h-7 w-48 max-w-full" />

        <TableSkeleton rows={5} columns={6} />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Shape className="h-4 w-32" />

          <ToolbarShapes count={3} />
        </div>
      </Region>
    </>
  )
}
