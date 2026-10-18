import type {
  WorkspaceLoadingPage,
  WorkspacePageSkeletonProps,
} from "@/types/workspace-loading"
import { AnalyticsSkeleton } from "./skeletons/analytics"
import { CatalogSkeleton, MenuLanguagesSkeleton } from "./skeletons/catalog"
import { DashboardSkeleton } from "./skeletons/dashboard"
import { OrderHistorySkeleton, OrdersSkeleton } from "./skeletons/orders"
import {
  OrganizationSettingsSkeleton,
  RestaurantSettingsSkeleton,
} from "./skeletons/settings"
import {
  OrganizationSignUpSkeleton,
  OverviewSkeleton,
  RestaurantCreateSkeleton,
} from "./skeletons/overview"
import { TeamSkeleton } from "./skeletons/team"
import { ThemingSkeleton } from "./skeletons/studio"
function pageContainerClass(page: WorkspaceLoadingPage) {
  switch (page) {
    case "overview":
      return "live-page grid gap-8"
    case "analytics":
    case "dashboard":
      return "mx-auto max-w-[1600px] min-w-0 px-6 pb-12"
    case "team":
      return "min-w-0 bg-background px-6 pt-8 pb-12"
    case "settings":
      return "live-settings min-w-0 bg-background"
    case "restaurantSettings":
      return "live-page grid gap-6"
    case "orders":
      return "mx-auto min-h-[70vh] w-full max-w-[1600px] min-w-0 px-6 py-8"
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
    case "organizationSignUp":
      return <OrganizationSignUpSkeleton />
  }
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
