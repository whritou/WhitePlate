"use client"

import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import type { Restaurant } from "@/types/organization"
import type { ApiResult } from "@/types/api"
import type { StripeConnectOverviewEntry } from "@/types/stripe-connect"

export function StripeConnectOrganizationOverview({
  restaurants,
  stripeOverview,
}: {
  restaurants?: ApiResult<Restaurant[]>
  stripeOverview?: StripeConnectOverviewEntry[]
}) {
  const t = useTranslations("StripeConnect")

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("organizationOverview.title")}</CardTitle>

        <CardDescription>
          {t("organizationOverview.description")}
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-4">
        {!restaurants?.ok || !restaurants.data ? (
          <Alert variant="destructive" role="alert">
            <AlertDescription>
              {t("organizationOverview.unavailable")}
            </AlertDescription>
          </Alert>
        ) : restaurants.data.length === 0 ? (
          <p className="border p-4 text-sm text-muted-foreground">
            {t("organizationOverview.empty")}
          </p>
        ) : (
          <ul className="grid gap-3">
            {restaurants.data.map((restaurant) => {
              const status = stripeOverview?.find(
                (item) => item.restaurantId === restaurant.id
              )?.status

              return (
                <li
                  key={restaurant.id}
                  className="flex flex-wrap items-center justify-between gap-4 border p-4"
                >
                  <div className="grid gap-1" role="status">
                    <h3 className="font-display text-lg font-bold">
                      {restaurant.name}
                    </h3>

                    <p>
                      {status
                        ? t(`connection.${status.connectionState}`)
                        : t("unavailable")}
                    </p>

                    {status && (
                      <p className="text-sm text-muted-foreground">
                        {t("mode", { mode: t(`modes.${status.mode}`) })}
                      </p>
                    )}

                    {status?.connectionState === "connected" && (
                      <p className="text-sm text-muted-foreground">
                        {t("readinessLabel", {
                          state: t(`readiness.${status.readinessState}`),
                        })}
                      </p>
                    )}
                  </div>

                  <Button
                    nativeButton={false}
                    role="link"
                    variant="outline"
                    render={
                      <Link
                        href={`/organization/restaurant-settings?tenantId=${restaurant.id}&section=payments`}
                      />
                    }
                  >
                    {t("organizationOverview.openSettings")}
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
