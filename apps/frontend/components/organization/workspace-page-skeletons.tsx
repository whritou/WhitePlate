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

function HeaderSkeleton({
  back = false,
  region = "page-header",
}: {
  back?: boolean
  region?: string
}) {
  return (
    <Region name={region} className="grid gap-4">
      {back && <Skeleton className="h-4 w-36" />}

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
      <HeaderSkeleton back region="team-header" />

      <Region name="team-actions">
        <Skeleton className="h-10 w-44 rounded-lg" />
      </Region>

      <Region name="team-restaurants" className="grid gap-3">
        <Skeleton className="h-6 w-48" />

        <div className="grid gap-2 sm:grid-cols-2">
          <CardSkeleton
            className="flex grid-cols-[1fr_auto] items-center"
            lines={0}
          />

          <CardSkeleton
            className="flex grid-cols-[1fr_auto] items-center"
            lines={0}
          />
        </div>
      </Region>

      <Region name="team-roster">
        <CardSkeleton className="min-h-48" lines={3} />
      </Region>

      <Region name="team-invitations">
        <CardSkeleton className="min-h-48" lines={3} />
      </Region>

      <Region name="team-invitation-form">
        <CardSkeleton className="min-h-72" lines={4} />
      </Region>
    </>
  )
}

function RestaurantSkeleton() {
  return (
    <>
      <Region name="restaurant-header" className="grid gap-4">
        <Skeleton className="h-4 w-32" />

        <CardSkeleton className="min-h-32" lines={2} />
      </Region>

      <Region
        name="restaurant-fields"
        className="grid gap-5 rounded-lg border border-border bg-card p-6"
      >
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="grid gap-2">
            <Skeleton className="h-4 w-32" />

            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        ))}
      </Region>

      <Region name="restaurant-submit">
        <Skeleton className="h-10 w-44 rounded-lg" />
      </Region>
    </>
  )
}

function CatalogSkeleton() {
  return (
    <>
      <HeaderSkeleton back region="catalog-header" />

      <Region name="catalog-category-form">
        <CardSkeleton className="min-h-36" lines={2} />
      </Region>

      <Region name="catalog-product-form">
        <CardSkeleton className="min-h-60" lines={4} />
      </Region>

      <Region name="catalog-list" className="grid gap-6">
        <CardSkeleton className="min-h-52" lines={4} />

        <CardSkeleton className="min-h-52" lines={4} />
      </Region>
    </>
  )
}

function MenuLanguagesSkeleton() {
  return (
    <>
      <HeaderSkeleton back region="languages-header" />

      <Region name="languages-settings">
        <CardSkeleton className="min-h-48" lines={3} />
      </Region>

      <Region name="languages-translations" className="grid gap-4">
        <CardSkeleton className="min-h-40" lines={3} />

        <CardSkeleton className="min-h-40" lines={3} />
      </Region>
    </>
  )
}

function SettingsSkeleton() {
  return (
    <>
      <HeaderSkeleton back />

      <Region name="settings-header">
        <CardSkeleton className="min-h-32" lines={2} />
      </Region>

      <Region name="settings-fields" className="grid gap-5">
        <Skeleton className="h-4 w-36" />

        <Skeleton className="h-10 w-full rounded-md" />
      </Region>

      <Region name="settings-submit">
        <Skeleton className="h-10 w-40 rounded-lg" />
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
