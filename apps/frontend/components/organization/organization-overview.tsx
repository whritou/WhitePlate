import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Link } from "@/i18n/navigation"
import type { Organization } from "@/types/organization"
import type { RestaurantMembership } from "@/types/orders"
import { OrganizationArchiveAction } from "./organization-archive-action"

export function OrganizationOverview({
  organizations,
  restaurants,
  organizationId,
}: {
  organizations: Organization[] | null
  restaurants: RestaurantMembership[]
  organizationId?: string
}) {
  const t = useTranslations("Auth")
  const v = useTranslations("LiveWorkspace")
  const organization = organizations?.find((item) => item.id === organizationId)
  const visibleRestaurants = organization
    ? restaurants.filter((item) => item.organizationId === organization.id)
    : restaurants

  if (organizationId && !organization)
    return (
      <main className="live-page">
        <Alert variant="destructive">
          <AlertDescription>{t("serviceError")}</AlertDescription>
        </Alert>
      </main>
    )

  return (
    <main className="live-page grid gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl font-bold">
          {organization?.name ?? t("organizationsHeading")}
        </h1>

        <div className="flex flex-wrap gap-3">
          {organization ? (
            <>
              <Button
                nativeButton={false}
                role="link"
                render={
                  <Link
                    href={`/organization/team?organizationId=${organization.id}`}
                  />
                }
              >
                {t("manageTeamAction")}
              </Button>

              <Button
                variant="outline"
                nativeButton={false}
                role="link"
                render={
                  <Link
                    href={`/organization/settings?organizationId=${organization.id}`}
                  />
                }
              >
                {t("organizationSettingsAction")}
              </Button>

              <Button
                variant="outline"
                nativeButton={false}
                role="link"
                disabled={!organization.isActive}
                render={
                  <Link
                    href={`/organization/restaurants/new?organizationId=${organization.id}`}
                  />
                }
              >
                {t("createRestaurantAction")}
              </Button>
            </>
          ) : (
            <Button
              nativeButton={false}
              role="link"
              render={<Link href="/organization/sign-up" />}
            >
              {t("newOrganizationAction")}
            </Button>
          )}
        </div>
      </header>

      {!organization &&
        (organizations === null ? (
          <Alert variant="destructive">
            <AlertDescription>{t("serviceError")}</AlertDescription>
          </Alert>
        ) : organizations.length > 0 ? (
          <section className="grid gap-4">
            <h2 className="font-display text-2xl font-bold">
              {v("organizations")}
            </h2>

            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {organizations.map((item) => (
                <li key={item.id}>
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle>{item.name}</CardTitle>
                    </CardHeader>

                    <CardContent className="grid gap-3">
                      {!item.isActive && (
                        <>
                          <p className="text-sm text-muted-foreground">
                            {t("organizationArchived")}
                          </p>

                          <OrganizationArchiveAction
                            organizationId={item.id}
                            active={false}
                            compact
                          />
                        </>
                      )}

                      <Button
                        variant="outline"
                        nativeButton={false}
                        role="link"
                        render={
                          <Link
                            href={`/organization?organizationId=${item.id}`}
                          />
                        }
                      >
                        {v("openOrganization")}
                      </Button>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <p className="text-muted-foreground">
            {t("noOrganizationsDescription")}
          </p>
        ))}

      <section className="grid gap-4">
        <h2 className="font-display text-2xl font-bold">{v("restaurants")}</h2>

        {visibleRestaurants.length ? (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleRestaurants.map((restaurant) => (
              <li key={restaurant.id}>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>{restaurant.name}</CardTitle>
                  </CardHeader>

                  <CardContent>
                    <Button
                      nativeButton={false}
                      role="link"
                      render={
                        <Link
                          href={`/organization/${restaurant.role === "Kitchen" ? "orders" : "dashboard"}?tenantId=${restaurant.id}`}
                        />
                      }
                    >
                      {v("openRestaurant")}
                    </Button>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">{v("noRestaurants")}</p>
        )}
      </section>
    </main>
  )
}
