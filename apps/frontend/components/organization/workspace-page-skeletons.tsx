import type { ReactNode } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { OrderKanbanSkeleton } from "@/components/orders/order-kanban-skeleton"
import { cn } from "@/lib/utils"
import type {
  WorkspaceLoadingPage,
  WorkspacePageSkeletonProps,
} from "@/types/workspace-loading"

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
        <Skeleton
          key={index}
          className={index === count - 1 ? "h-4 w-3/5" : "h-4 w-full"}
        />
      ))}
    </div>
  )
}

function CardSkeleton({
  className = "",
  lines = 2,
}: {
  className?: string
  lines?: number
}) {
  return (
    <div
      className={`grid gap-4 rounded-lg border border-border bg-card p-5 ${className}`}
    >
      <Skeleton className="h-5 w-2/5" />

      <Lines count={lines} />
    </div>
  )
}

function HeaderSkeleton({ region = "page-header" }: { region?: string }) {
  return (
    <Region name={region} className="grid gap-4">
      <div className="grid max-w-2xl gap-3">
        <Skeleton className="h-4 w-40" />

        <Skeleton className="h-9 w-64 max-w-full" />

        <Lines />
      </div>
    </Region>
  )
}

export function WorkspacePageSkeleton({
  page,
  label,
}: WorkspacePageSkeletonProps) {
  return (
    <>
      <p role="status" aria-live="polite" className="sr-only">
        {label}
      </p>

      <main
        aria-busy="true"
        data-skeleton-page={page}
        className={cn(
          "mx-auto min-h-[70vh] p-4 sm:p-6 lg:p-8",
          page === "orders" || page === "orderHistory"
            ? "w-full max-w-none"
            : page === "catalog" || page === "menuLanguages"
              ? "w-full max-w-[100rem] min-w-0"
              : page === "restaurant"
                ? "max-w-2xl"
                : page === "team" || page === "settings"
                  ? "max-w-3xl"
                  : "max-w-5xl"
        )}
      >
        <div aria-hidden="true" className="grid gap-6">
          {renderPageSkeleton(page)}
        </div>
      </main>
    </>
  )
}

function renderPageSkeleton(page: WorkspaceLoadingPage) {
  switch (page) {
    case "organizationSignUp":
      return <OrganizationSignUpSkeleton />
    case "team":
      return <TeamSkeleton />
    case "restaurant":
      return <RestaurantSkeleton />
    case "catalog":
      return <CatalogSkeleton />
    case "menuLanguages":
      return <MenuLanguagesSkeleton />
    case "settings":
      return <SettingsSkeleton />
    case "orders":
      return <OrdersSkeleton />
    case "orderHistory":
      return <OrderHistorySkeleton />
  }
}

function OrganizationSignUpSkeleton() {
  return (
    <Region name="organization-signup-card">
      <CardSkeleton className="min-h-96 p-6 sm:p-10" lines={3} />
    </Region>
  )
}

function TeamSkeleton() {
  return (
    <>
      <Region name="team-back-link">
        <Skeleton className="h-10 w-36 max-w-full rounded-md" />
      </Region>

      <Region
        name="team-card"
        className="mt-6 grid gap-6 rounded-lg border border-border bg-card p-6 sm:p-10"
      >
        <Region name="team-header" className="grid gap-3">
          <Skeleton className="h-4 w-40" />

          <Skeleton className="h-9 w-64 max-w-full" />

          <Lines />
        </Region>

        <Region name="team-actions" className="mt-6">
          <Skeleton className="h-11 w-52 max-w-full rounded-lg" />
        </Region>

        <Region name="team-restaurants" className="mt-8 grid min-w-0 gap-3">
          <Skeleton className="h-6 w-48 max-w-full" />

          <div className="grid min-w-0 gap-2 sm:grid-cols-2">
            {Array.from({ length: 2 }, (_, index) => (
              <div
                key={index}
                className="grid min-w-0 gap-3 rounded-lg border border-border px-4 py-3"
              >
                <Skeleton className="h-4 w-2/3 max-w-full" />

                <div className="flex min-w-0 flex-wrap gap-x-4 gap-y-2">
                  <Skeleton className="h-4 w-36 max-w-full" />

                  <Skeleton className="h-4 w-28 max-w-full" />
                </div>
              </div>
            ))}
          </div>
        </Region>

        <Region name="team-directory" className="mt-8">
          <div className="grid gap-5 lg:grid-cols-2">
            <Region name="team-roster">
              <CardSkeleton className="min-h-48" lines={4} />
            </Region>

            <Region name="team-invitations">
              <CardSkeleton className="min-h-48" lines={4} />
            </Region>
          </div>
        </Region>

        <Region name="team-invitation-form" className="mt-8 grid gap-3">
          <Skeleton className="h-6 w-48 max-w-full" />

          <Skeleton className="h-4 w-full max-w-xl" />

          <div className="mt-1 grid gap-5">
            {[0, 1, 2].map((index) => (
              <div key={index} className="grid gap-2">
                <Skeleton className="h-4 w-32 max-w-full" />

                <Skeleton className="h-11 w-full rounded-md" />
              </div>
            ))}

            <Skeleton className="h-11 w-48 max-w-full rounded-lg" />
          </div>
        </Region>
      </Region>
    </>
  )
}

function RestaurantSkeleton() {
  return (
    <>
      <Region name="restaurant-back-link">
        <Skeleton className="h-10 w-20 max-w-full rounded-md" />
      </Region>

      <Region
        name="restaurant-card"
        className="mt-6 grid gap-6 rounded-lg border border-border bg-card p-6 sm:p-10"
      >
        <Region name="restaurant-header" className="grid gap-3">
          <Skeleton className="h-9 w-64 max-w-full" />

          <Skeleton className="h-4 w-full max-w-xl" />
        </Region>

        <Region name="restaurant-fields" className="grid gap-5">
          <div className="grid gap-2">
            <Skeleton className="h-4 w-32 max-w-full" />

            <Skeleton className="h-11 w-full rounded-md" />
          </div>

          <div className="grid gap-2">
            <Skeleton className="h-4 w-36 max-w-full" />

            <Skeleton className="h-11 w-full rounded-md" />

            <Skeleton className="h-4 w-full max-w-md" />
          </div>

          <div className="grid gap-2">
            <Skeleton className="h-4 w-28 max-w-full" />

            <Skeleton className="h-11 w-full rounded-md" />
          </div>

          <Region name="restaurant-submit">
            <Skeleton className="h-11 w-44 max-w-full rounded-lg" />
          </Region>
        </Region>
      </Region>
    </>
  )
}

function CatalogSkeleton() {
  return (
    <>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)]">
        <HeaderSkeleton region="catalog-header" />

        <Region name="catalog-tabs" className="flex flex-wrap gap-2">
          <Skeleton className="h-12 w-28" />

          <Skeleton className="h-12 w-28" />

          <Skeleton className="h-12 w-28" />
        </Region>
      </div>

      <Region
        name="catalog-list"
        className="grid items-start gap-6 lg:grid-cols-[14rem_minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,1fr)]"
      >
        <div className="grid gap-5">
          <Region name="catalog-categories">
            <CardSkeleton className="min-h-80" lines={5} />
          </Region>

          <Region name="catalog-products">
            <CardSkeleton className="min-h-48" lines={3} />
          </Region>
        </div>

        <div className="grid gap-6">
          <Region name="catalog-editor">
            <CardSkeleton className="min-h-96" lines={8} />
          </Region>

          <Region name="catalog-options">
            <CardSkeleton className="min-h-48" lines={4} />
          </Region>
        </div>
      </Region>
    </>
  )
}

function MenuLanguagesSkeleton() {
  return (
    <>
      <HeaderSkeleton region="languages-header" />

      <Region name="languages-settings">
        <CardSkeleton className="min-h-36" lines={2} />
      </Region>

      <Region name="languages-translations">
        <CardSkeleton className="min-h-96" lines={8} />
      </Region>
    </>
  )
}

function SettingsSkeleton() {
  return (
    <>
      <Region name="settings-back-link">
        <Skeleton className="h-10 w-36 max-w-full rounded-md" />
      </Region>

      <Region
        name="settings-card"
        className="mt-6 grid gap-6 rounded-lg border border-border bg-card p-6 sm:p-10"
      >
        <Region name="settings-header" className="grid gap-3">
          <Skeleton className="h-9 w-64 max-w-full" />

          <Skeleton className="h-4 w-full max-w-xl" />
        </Region>

        <Region name="settings-fields" className="grid gap-4">
          <div className="grid gap-2">
            <Skeleton className="h-4 w-36 max-w-full" />

            <Skeleton className="h-11 w-full rounded-md" />
          </div>

          <Region name="settings-submit">
            <Skeleton className="h-11 w-48 max-w-full rounded-lg" />
          </Region>
        </Region>

        <Region name="settings-archive" className="mt-2 grid gap-3">
          <Skeleton className="h-6 w-36 max-w-full" />

          <Lines count={1} />

          <Skeleton className="h-11 w-48 max-w-full rounded-lg" />
        </Region>
      </Region>
    </>
  )
}

function OrdersSkeleton() {
  return (
    <>
      <Region name="orders-header" className="grid gap-4">
        <div className="grid gap-3">
          <Skeleton className="h-4 w-40" />

          <Skeleton className="h-9 w-64 max-w-full" />

          <Lines />
        </div>

        <Skeleton className="h-4 w-36" />
      </Region>

      <Region name="orders-filters" className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-12 w-28 rounded-md" />
        ))}
      </Region>

      <Region name="orders-list" className="grid gap-4">
        <OrderKanbanSkeleton />
      </Region>
    </>
  )
}

function OrderHistorySkeleton() {
  return (
    <>
      <HeaderSkeleton region="order-history-header" />

      <Region name="order-history-filters">
        <CardSkeleton className="min-h-48" lines={3} />
      </Region>

      <Region name="order-history-table">
        <CardSkeleton className="min-h-96" lines={8} />
      </Region>
    </>
  )
}
