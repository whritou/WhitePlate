import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import type { RestaurantMembership } from "@/types/orders"

export function RestaurantSettings({
  restaurant,
}: {
  restaurant: RestaurantMembership
}) {
  const t = useTranslations("LiveWorkspace")
  const a = useTranslations("Auth")

  return (
    <main className="live-page grid gap-6">
      <header>
        <p className="label-mono text-muted-foreground">{restaurant.name}</p>

        <h1 className="mt-1 font-display text-4xl font-bold">
          {t("restaurantSettings")}
        </h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{t("restaurantIdentity")}</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">{a("name")}</dt>

              <dd className="font-semibold">{restaurant.name}</dd>
            </div>

            <div>
              <dt className="text-sm text-muted-foreground">
                {t("subdomain")}
              </dt>

              <dd className="font-semibold">{restaurant.subdomain ?? "—"}</dd>
            </div>
          </dl>

          <p className="text-sm text-muted-foreground">
            {t("restaurantSettingsScope")}
          </p>

          <div className="flex flex-wrap gap-3">
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
                <Link href={`/organization/shop?tenantId=${restaurant.id}`} />
              }
            >
              {t("visitShop")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
