import type { ReactNode } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { OrderKanbanSkeleton } from "@/components/orders/order-kanban-skeleton"
import { cn } from "@/lib/utils"
import type {
  WorkspaceLoadingPage,
  WorkspacePageSkeletonProps,
} from "@/types/workspace-loading"

function Shape({ className }: { className: string }) {
  return <Skeleton className={cn("rounded-none", className)} />
}

function Region({
  name,
  className,
  children,
}: {
  name: string
  className?: string
  children: ReactNode
}) {
  return (
    <section data-skeleton-region={name} className={className}>
      {children}
    </section>
  )
}

function Lines({ count = 2 }: { count?: number }) {
  return (
    <div className="grid gap-3">
      {Array.from({ length: count }, (_, index) => (
        <Shape
          key={index}
          className={index === count - 1 ? "h-4 w-3/5" : "h-4 w-full"}
        />
      ))}
    </div>
  )
}

function Field({ width = "w-40" }: { width?: string }) {
  return (
    <div className="grid min-w-0 gap-2">
      <Shape className={cn("h-4 max-w-full", width)} />
      <Shape className="h-11 w-full" />
    </div>
  )
}

function ToolbarShapes({ count = 2 }: { count?: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: count }, (_, index) => (
        <Shape key={index} className="h-11 w-32 max-w-full" />
      ))}
    </div>
  )
}

function SkeletonCard({
  className = "",
  lines = 2,
}: {
  className?: string
  lines?: number
}) {
  return (
    <div className={cn("grid gap-4 border bg-background p-5", className)}>
      <Shape className="h-5 w-2/5" />
      <Lines count={lines} />
    </div>
  )
}

export function WorkspacePageSkeleton({
  page,
  label,
}: WorkspacePageSkeletonProps) {
  return (
    <main
      aria-busy="true"
      data-skeleton-page={page}
      className={pageContainerClass(page)}
    >
      <p role="status" aria-live="polite" className="sr-only">
        {label}
      </p>
      <div aria-hidden="true">{renderPageSkeleton(page)}</div>
    </main>
  )
}

function pageContainerClass(page: WorkspaceLoadingPage) {
  switch (page) {
    case "overview":
      return "live-page grid gap-8"
    case "analytics":
      return "mx-auto max-w-[1600px] min-w-0 px-6 pb-12"
    case "dashboard":
      return "mx-auto max-w-[1600px] min-w-0 px-6 pb-12"
    case "team":
      return "min-w-0 bg-background px-6 pt-8 pb-12"
    case "settings":
      return "live-settings min-w-0 bg-background"
    case "restaurantSettings":
      return "live-page grid gap-6"
    case "orders":
      return "live-page grid gap-5 w-full max-w-none"
    case "orderHistory":
      return "live-history mx-auto grid min-h-[70vh] w-full max-w-[1600px] min-w-0 gap-5 px-6 py-8"
    case "theming":
      return "flex h-screen min-w-0 flex-col bg-background"
    case "catalog":
    case "menuLanguages":
      return "w-full min-w-0"
    case "organizationSignUp":
      return "live-create-page mx-auto min-h-[70vh] max-w-3xl px-6 py-8"
    case "restaurant":
      return "live-create-page mx-auto min-h-[70vh] max-w-3xl px-6 py-8"
  }
}

function renderPageSkeleton(page: WorkspaceLoadingPage) {
  switch (page) {
    case "overview":
      return <OverviewSkeleton />
    case "analytics":
      return <AnalyticsSkeleton />
    case "dashboard":
      return <DashboardSkeleton />
    case "organizationSignUp":
      return <OrganizationSignUpSkeleton />
    case "team":
      return <TeamSkeleton />
    case "restaurant":
      return <RestaurantCreateSkeleton />
    case "catalog":
      return <CatalogSkeleton />
    case "menuLanguages":
      return <MenuLanguagesSkeleton />
    case "settings":
      return <OrganizationSettingsSkeleton />
    case "restaurantSettings":
      return <RestaurantSettingsSkeleton />
    case "orders":
      return <OrdersSkeleton />
    case "orderHistory":
      return <OrderHistorySkeleton />
    case "theming":
      return <ThemingSkeleton />
  }
}

function OverviewSkeleton() {
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

function AnalyticsSkeleton() {
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

function DashboardSkeleton() {
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

function OrganizationSignUpSkeleton() {
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

function TeamSkeleton() {
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

function RestaurantCreateSkeleton() {
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

function CatalogHeader({ languages = false }: { languages?: boolean }) {
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

function CatalogSkeleton() {
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

function MenuLanguagesSkeleton() {
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

function OrganizationSettingsSkeleton() {
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

function RestaurantSettingsSkeleton() {
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

function OrdersSkeleton() {
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

function OrderHistorySkeleton() {
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

function ThemingSkeleton() {
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

function TableSkeleton({
  rows,
  columns,
}: {
  rows: number
  columns: number
}) {
  const columnLayout =
    columns === 4 ? "sm:grid-cols-4" : "sm:grid-cols-4 xl:grid-cols-6"

  return (
    <div className="min-w-0 overflow-hidden border">
      <div className={cn("grid grid-cols-2 gap-4 border-b bg-secondary p-3", columnLayout)}>
        {Array.from({ length: columns }, (_, index) => (
          <Shape key={index} className="h-4 w-3/4 max-w-full" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className={cn("grid grid-cols-2 gap-4 border-b p-3 last:border-b-0", columnLayout)}>
          {Array.from({ length: columns }, (_, column) => (
            <Shape key={column} className={cn("h-5 max-w-full", column === 0 ? "w-4/5" : "w-2/3")} />
          ))}
        </div>
      ))}
    </div>
  )
}
