import { OrderDashboard } from "@/components/orders/order-dashboard"
import { StaffInviteDialog } from "@/components/workspace/team/invitations/staff-invite-dialog"
import { Link } from "@/i18n/navigation"
import { OrganizationTeamDirectory } from "@/components/workspace/team/members/organization-team-directory"
import { notFound } from "next/navigation"
import { getLocale, getTranslations } from "next-intl/server"
import { WorkspaceShell } from "@/components/workspace/shared/workspace-shell"
import { OrganizationOverview } from "@/components/workspace/overview/organization-overview"
import { RestaurantSettings } from "@/components/workspace/settings/restaurants/restaurant-settings"
import { LiveSettings } from "@/components/workspace/settings/live-settings"
import { OrganizationSettingsForm } from "@/components/workspace/settings/organization/organization-settings-form"
import { LiveStudio } from "@/components/workspace/studio/appearance/live-studio"
import { AnalyticsPage } from "@/components/demo/workspace/analytics/page"
import { MissingFeatureNotice } from "@/components/workspace/shared/missing-feature-notice"
import { LiveDashboard } from "@/components/workspace/dashboard/live-dashboard"
import { RestaurantMenu } from "@/components/storefront/restaurant-menu"
import { OrderTracking } from "@/components/storefront/order-tracking"
import type { SearchParams } from "@/types/navigation"
import { themeAppearance } from "@/lib/validation/theme-appearance"
import {
  establishment,
  storeProductFixture,
  storeThemeFixture,
} from "./fixture-data"
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
  const parity = await getTranslations("LiveParity")
  const userId = query.user === "b" ? "fixture-b" : "fixture-a"

  if (query.view === "tracking")
    return (
      <OrderTracking
        orderId="44444444-4444-4444-8444-444444444444"
        name="Maison Verte"
        theme={storeThemeFixture(query)}
        restaurantSlug="maison-verte"
      />
    )

  if (query.view === "store")
    return (
      <>
        <Link
          href="/live-workspace-test?view=store&step=checkout"
          className="block border-b p-2 text-xs"
        >
          Fixture checkout
        </Link>

        <RestaurantMenu
          step={query.step === "checkout" ? "checkout" : "shop"}
          theme={storeThemeFixture(query)}
          restaurantSlug="maison-verte"
          menu={{
            tenantId,
            restaurantName: "Maison Verte",
            restaurantDescription: "Cuisine de saison",
            currency: "EUR",
            establishment,
            locale: "fr",
            defaultLocale: "fr",
            availableLocales: ["fr", "en"],
            categories: [
              {
                id: "c1",
                name: "Entrées",
                sortOrder: 0,
                products: [storeProductFixture(query)],
              },
              {
                id: "c2",
                name: "Boissons",
                sortOrder: 1,
                products: [],
              },
            ],
          }}
        />
      </>
    )

  return (
    <WorkspaceShell
      organizations={[organization]}
      restaurants={[
        {
          id: tenantId,
          name: organization.name,
          role: "Manager",
          organizationId: organization.id,
          subdomain: "maisonverte",
          permissions: [
            "orders.manage",
            "kitchen.display",
            "catalog.manage",
            "discounts.manage",
            "analytics.view",
            "storefront.manage",
            "staff.manage",
            "billing.manage",
          ],
        },
      ]}
    >
      <p className="border-b bg-secondary px-6 py-2 text-xs">
        Development fixture · No authentication bypass on production routes
      </p>

      {query.view === "overview" ? (
        <OrganizationOverview
          organizations={[organization]}
          organizationId={organization.id}
          restaurants={[
            {
              id: tenantId,
              name: "Maison Verte Restaurant",
              role: "Manager",
              organizationId: organization.id,
              permissions: [
                "orders.manage",
                "kitchen.display",
                "catalog.manage",
                "discounts.manage",
                "analytics.view",
                "storefront.manage",
                "staff.manage",
                "billing.manage",
              ],
            },
          ]}
        />
      ) : query.view === "restaurant-settings" ? (
        <RestaurantSettings
          userId={userId}
          initial={null}
          legalProfile={null}
          emailSettings={null}
          section="establishment"
          restaurant={{
            id: tenantId,
            name: "Maison Verte",
            role: "Manager",
            subdomain: "maisonverte",
            permissions: [
              "storefront.manage",
              "catalog.manage",
              "orders.manage",
              "billing.manage",
            ],
          }}
        />
      ) : query.view === "team" ? (
        <main className="min-w-0 bg-background px-6 pt-8 pb-12">
          {await OrganizationTeamDirectory({
            organizationId: organization.id,
            roleGrants: null,
            roleOptions: [
              { role: "Manager", name: "Manager", builtInKey: "Manager" },
              { role: "Kitchen", name: "Kitchen staff", builtInKey: "Kitchen" },
              {
                role: "Accountant",
                name: "Accountant",
                builtInKey: "Accountant",
              },
            ],
            isOrganizationOwner: false,
            heading: (
              <div>
                <p className="label-mono text-muted-foreground">
                  {organization.name}
                </p>

                <h1 className="mt-1 font-display text-4xl font-bold">
                  {parity("staffTitle")}
                </h1>
              </div>
            ),
            action: (
              <StaffInviteDialog
                organizationId={organization.id}
                restaurants={[{ id: tenantId, name: organization.name }]}
                roleOptions={[
                  { role: "Manager", name: "Manager", builtInKey: "Manager" },
                  {
                    role: "Kitchen",
                    name: "Kitchen staff",
                    builtInKey: "Kitchen",
                  },
                  {
                    role: "Accountant",
                    name: "Accountant",
                    builtInKey: "Accountant",
                  },
                ]}
              />
            ),
            members: [
              {
                role: "RestaurantManager",
                email: "manager@example.test",
                tenantId,
                tenantName: organization.name,
              },
            ],
            invitations: [
              {
                id: "44444444-4444-4444-8444-444444444444",
                role: "KitchenStaff",
                email: "invite@example.test",
                tenantId,
                tenantName: organization.name,
                status: "Pending",
                expiresAt: "2026-10-20T12:00:00Z",
              },
            ],
          })}
        </main>
      ) : query.view === "studio" ? (
        <LiveStudio
          key={`${userId}:${tenantId}`}
          userId={userId}
          tenantId={tenantId}
          restaurantName={organization.name}
          initialTheme={
            query.theme === "parity"
              ? { theme: themeAppearance(storeThemeFixture(query)), version: 1 }
              : undefined
          }
          initialData={{ assets: [], storageAvailable: false }}
        />
      ) : query.view === "analytics" ? (
        <>
          <MissingFeatureNotice />

          <AnalyticsPage />
        </>
      ) : query.view === "orders" ? (
        <main className="mx-auto min-h-[70vh] w-full max-w-[1600px] min-w-0 px-6 py-8">
          <OrderDashboard
            userId={userId}
            tenantId={tenantId}
            tenantName={organization.name}
            role="Manager"
            permissions={["orders.manage", "kitchen.display"]}
            locale={await getLocale()}
            selectedStatus={null}
            cursor={null}
            loadError={null}
            hubUrl={null}
            page={{
              nextCursor: null,
              serverTime: "2026-10-10T18:00:00Z",
              items: [
                {
                  id: "44444444-4444-4444-8444-444444444444",
                  customerName: "Ada",
                  currency: "EUR",
                  menuLocale: "en",
                  total: 19.25,
                  status: "Pending",
                  version: 1,
                  createdAt: "2026-10-10T18:00:00Z",
                  lines: [
                    {
                      productId: "33333333-3333-4333-8333-333333333333",
                      productName: "Soupe du potager",
                      quantity: 2,
                      options: [],
                    },
                  ],
                },
              ],
            }}
          />
        </main>
      ) : query.view === "dashboard" ? (
        await LiveDashboard({
          userId,
          tenantId,
          tenantName: organization.name,
          role: "OrganizationOwner",
          permissions: [
            "orders.manage",
            "kitchen.display",
            "catalog.manage",
            "discounts.manage",
            "analytics.view",
            "storefront.manage",
            "staff.manage",
            "billing.manage",
          ],
          locale: await getLocale(),
          selectedStatus: null,
          cursor: null,
          page: {
            nextCursor: null,
            serverTime: "2026-10-10T18:00:00Z",
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
          loadError: null,
          hubUrl: null,
        })
      ) : (
        <LiveSettings
          key={`${userId}:${organization.id}`}
          userId={userId}
          organization={organization}
        >
          <OrganizationSettingsForm
            showLifecycle={false}
            organizationId={organization.id}
            organizationName={organization.name}
            organizationActive
          />
        </LiveSettings>
      )}
    </WorkspaceShell>
  )
}
