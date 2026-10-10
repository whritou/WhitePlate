import { notFound } from "next/navigation"
import { getLocale } from "next-intl/server"
import { WorkspaceShell } from "@/components/organization/workspace-shell"
import { LiveSettings } from "@/components/organization/live-settings"
import { OrganizationSettingsForm } from "@/components/organization/organization-settings-form"
import { LiveStudio } from "@/components/organization/live-studio"
import { AnalyticsPage } from "@/components/lovable/pages/analytics"
import { MissingFeatureNotice } from "@/components/organization/missing-feature-notice"
import { LiveDashboard } from "@/components/organization/live-dashboard"
import { RestaurantMenu } from "@/components/storefront/restaurant-menu"
import type { SearchParams } from "@/types/navigation"
export const dynamic = "force-dynamic"

const organization = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Maison Verte",
  isActive: true,
}
const tenantId = "22222222-2222-4222-8222-222222222222"

export default async function LiveWorkspaceFixture({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  if (process.env.NODE_ENV === "production") notFound()

  const query = await searchParams
  const userId = query.user === "b" ? "fixture-b" : "fixture-a"

  if (query.view === "store")
    return (
      <RestaurantMenu
        step={query.step === "checkout" ? "checkout" : "shop"}
        menu={{
          tenantId,
          restaurantName: "Maison Verte",
          restaurantDescription: "Cuisine de saison",
          currency: "EUR",
          locale: "fr",
          defaultLocale: "fr",
          availableLocales: ["fr", "en"],
          categories: [
            {
              id: "c1",
              name: "Entrées",
              sortOrder: 0,
              products: [
                {
                  id: "33333333-3333-4333-8333-333333333333",
                  name: "Burrata & tomates anciennes",
                  description: "Basilic et tomates",
                  basePrice: 11,
                  isAvailable: true,
                  optionGroups: [],
                },
              ],
            },
          ],
        }}
      />
    )

  return (
    <WorkspaceShell
      organizations={[organization]}
      restaurants={[{ id: tenantId, name: organization.name, role: "Manager" }]}
    >
      <p className="border-b bg-secondary px-6 py-2 text-xs">
        Development fixture · No authentication bypass on production routes
      </p>

      {query.view === "studio" ? (
        <LiveStudio
          key={`${userId}:${tenantId}`}
          userId={userId}
          tenantId={tenantId}
          restaurantName={organization.name}
          initialData={{ assets: [], storageAvailable: false }}
        />
      ) : query.view === "analytics" ? (
        <>
          <MissingFeatureNotice />

          <AnalyticsPage />
        </>
      ) : query.view === "dashboard" ? (
        await LiveDashboard({
          name: organization.name,
          tenantId,
          locale: await getLocale(),
          page: {
            nextCursor: null,
            items: [
              {
                id: "44444444-4444-4444-8444-444444444444",
                customerName: "Client fixture",
                currency: "EUR",
                menuLocale: "fr",
                total: 11,
                status: "Pending",
                version: 1,
                createdAt: "2026-10-10T10:00:00Z",
                lines: [
                  {
                    productId: "33333333-3333-4333-8333-333333333333",
                    productName: "Burrata",
                    quantity: 1,
                    options: [],
                  },
                ],
              },
            ],
          },
        })
      ) : (
        <LiveSettings
          key={`${userId}:${organization.id}`}
          userId={userId}
          organization={organization}
        >
          <OrganizationSettingsForm
            organizationId={organization.id}
            organizationName={organization.name}
            organizationActive
          />
        </LiveSettings>
      )}
    </WorkspaceShell>
  )
}
