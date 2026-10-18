"use client"

import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Link, useRouter } from "@/i18n/navigation"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import type { RestaurantMembership } from "@/types/orders"
import type {
  EstablishmentRead,
  RestaurantSettingsSection,
  TenantLegalProfile,
} from "@/types/establishment-settings"
import type { OrderEmailSettings } from "@/types/order-email-settings"
import type { StripeConnectStatus } from "@/types/stripe-connect"
import { EstablishmentEditor } from "./establishment-editor"
import { RestaurantLegalProfileEditor } from "./restaurant-legal-profile-editor"
import { PickupSchedulingEditor } from "./pickup-scheduling-editor"
import { OrderEmailSettingsEditor } from "./order-email-settings-editor"
import { StripeConnectPanel } from "./stripe-connect-panel"

export function RestaurantSettings({
  restaurant,
  userId,
  initial,
  legalProfile,
  emailSettings,
  section,
  stripeConnectStatus,
  stripeConnectCallbackOutcome,
}: {
  restaurant: RestaurantMembership
  userId: string
  initial: EstablishmentRead | null
  legalProfile: TenantLegalProfile | null
  emailSettings: OrderEmailSettings | null
  section: RestaurantSettingsSection
  stripeConnectStatus?: StripeConnectStatus | null
  stripeConnectCallbackOutcome?: string
}) {
  const t = useTranslations("LiveWorkspace")
  const a = useTranslations("Auth")
  const legal = useTranslations("RestaurantLegal")
  const router = useRouter()
  const canManageStorefront =
    restaurant.permissions.includes("storefront.manage")
  const canManageOrders = restaurant.permissions.includes("orders.manage")
  const canManageBilling = restaurant.permissions.includes("billing.manage")
  const sections: { id: RestaurantSettingsSection; label: string }[] = [
    ...(canManageStorefront
      ? [
          {
            id: "establishment" as const,
            label: t("establishmentSettingsCategory"),
          },
          { id: "legal" as const, label: t("legalSettingsCategory") },
          { id: "hours" as const, label: t("openingHoursCategory") },
          { id: "pickup" as const, label: t("pickupSchedulingCategory") },
        ]
      : []),
    ...(canManageOrders
      ? [
          {
            id: "notifications" as const,
            label: t("notificationsSettingsCategory"),
          },
        ]
      : []),
    ...(canManageBilling
      ? [{ id: "payments" as const, label: t("paymentSettings") }]
      : []),
  ]

  function navigate(next: RestaurantSettingsSection) {
    router.push(
      `/organization/restaurant-settings?tenantId=${restaurant.id}&section=${next}`
    )
  }

  return (
    <main className="live-page grid gap-6">
      <header>
        <p className="label-mono text-muted-foreground">{restaurant.name}</p>

        <h1 className="mt-1 font-display text-4xl font-bold">
          {t("restaurantSettings")}
        </h1>
      </header>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside
          className="hidden h-fit border lg:sticky lg:top-6 lg:block"
          aria-label={t("settingsSections")}
        >
          <nav className="grid">
            {sections.map((item) => (
              <Link
                key={item.id}
                href={`/organization/restaurant-settings?tenantId=${restaurant.id}&section=${item.id}`}
                aria-current={section === item.id ? "page" : undefined}
                className={`min-h-12 border-b px-4 py-3 text-sm font-semibold ${section === item.id ? "bg-foreground text-background" : "hover:bg-secondary"}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="grid min-w-0 gap-5">
          <Label
            htmlFor="restaurant-settings-category"
            className="grid gap-2 lg:hidden"
          >
            {t("settingsSections")}

            <NativeSelect
              id="restaurant-settings-category"
              value={section}
              onChange={(event) =>
                navigate(event.currentTarget.value as RestaurantSettingsSection)
              }
            >
              {sections.map((item) => (
                <NativeSelectOption key={item.id} value={item.id}>
                  {item.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Label>

          {section === "establishment" && (
            <>
              <EstablishmentEditor
                tenantId={restaurant.id}
                userId={userId}
                initial={initial}
                section="establishment"
              />

              <Card>
                <CardHeader>
                  <CardTitle>{t("restaurantIdentity")}</CardTitle>
                </CardHeader>

                <CardContent className="grid gap-4">
                  <dl className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm text-muted-foreground">
                        {a("name")}
                      </dt>

                      <dd className="font-semibold">{restaurant.name}</dd>
                    </div>

                    <div>
                      <dt className="text-sm text-muted-foreground">
                        {t("subdomain")}
                      </dt>

                      <dd className="font-semibold">
                        {restaurant.subdomain ?? "—"}
                      </dd>
                    </div>
                  </dl>

                  <div className="flex flex-wrap gap-3">
                    {restaurant.permissions.includes("catalog.manage") && (
                      <Button
                        nativeButton={false}
                        role="link"
                        render={
                          <Link
                            href={`/organization/catalog?view=translations&tenantId=${restaurant.id}`}
                          />
                        }
                      >
                        {a("editMenuLanguages")}
                      </Button>
                    )}

                    {restaurant.permissions.includes("catalog.manage") && (
                      <Button
                        variant="outline"
                        nativeButton={false}
                        role="link"
                        render={
                          <Link
                            href={`/organization/catalog?tenantId=${restaurant.id}`}
                          />
                        }
                      >
                        {a("editCatalog")}
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      nativeButton={false}
                      role="link"
                      render={
                        <Link
                          href={`/organization/theming?tenantId=${restaurant.id}`}
                        />
                      }
                    >
                      {t("openStudio")}
                    </Button>

                    <Button
                      variant="outline"
                      nativeButton={false}
                      role="link"
                      render={
                        <Link
                          href={`/organization/shop?tenantId=${restaurant.id}`}
                        />
                      }
                    >
                      {t("visitShop")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {section === "legal" && (
            <>
              <header>
                <h2 className="font-display text-2xl font-bold">
                  {legal("title")}
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  {legal("description")}
                </p>
              </header>

              <RestaurantLegalProfileEditor
                tenantId={restaurant.id}
                initial={legalProfile}
              />
            </>
          )}

          {section === "hours" && (
            <EstablishmentEditor
              tenantId={restaurant.id}
              userId={userId}
              initial={initial}
              section="hours"
            />
          )}

          {section === "pickup" && (
            <PickupSchedulingEditor
              tenantId={restaurant.id}
              initial={initial?.settings ?? null}
              onSaved={async () => {
                router.refresh()
              }}
            />
          )}

          {section === "notifications" && (
            <OrderEmailSettingsEditor
              tenantId={restaurant.id}
              restaurantName={restaurant.name}
              initial={emailSettings}
            />
          )}

          {section === "payments" && (
            <StripeConnectPanel
              tenantId={restaurant.id}
              role={restaurant.role}
              initialStatus={stripeConnectStatus ?? null}
              callbackOutcome={stripeConnectCallbackOutcome}
            />
          )}
        </div>
      </div>
    </main>
  )
}
