import { RestaurantMenu } from "@/components/storefront/restaurant-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import { getPublicMenu } from "@/lib/api/public-storefront"
import { getTranslations } from "next-intl/server"
import { headers } from "next/headers"
import { Suspense } from "react"

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ menuLocale?: string; step?: string }>
}) {
  const [t, query, requestHeaders] = await Promise.all([
    getTranslations("HomePage"),
    searchParams,
    headers(),
  ])
  const storefront = await getPublicMenu(
    requestHeaders.get("host"),
    query.menuLocale
  )

  return storefront.kind === "menu"
    ? {
        title: storefront.menu.restaurantName,
        description: t("storefrontDescription", {
          restaurant: storefront.menu.restaurantName,
        }),
      }
    : { title: t("title"), description: t("description") }
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ menuLocale?: string; step?: string }>
}) {
  const storefrontT = await getTranslations("Storefront")

  return (
    <Suspense fallback={<MenuLoading copy={storefrontT("loadingMenu")} />}>
      <PageContent searchParams={searchParams} />
    </Suspense>
  )
}

async function PageContent({
  searchParams,
}: {
  searchParams: Promise<{ menuLocale?: string; step?: string }>
}) {
  const [t, query, requestHeaders] = await Promise.all([
    getTranslations("HomePage"),
    searchParams,
    headers(),
  ])
  const storefront = await getPublicMenu(
    requestHeaders.get("host"),
    query.menuLocale
  )

  if (storefront.kind === "menu")
    return (
      <RestaurantMenu
        key={storefront.menu.tenantId}
        menu={storefront.menu}
        step={query.step === "checkout" ? "checkout" : "shop"}
      />
    )
  if (storefront.kind === "unavailable") {
    const storefrontT = await getTranslations("Storefront")

    return (
      <main className="mx-auto flex min-h-svh max-w-3xl items-center px-5 py-16">
        <Alert variant="destructive" role="alert" className="w-full">
          <AlertDescription>{storefrontT("unavailable")}</AlertDescription>
        </Alert>
      </main>
    )
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-6 py-12">
      <div className="flex w-full max-w-3xl min-w-0 flex-col gap-8">
        <nav className="flex gap-3" aria-label={t("languageSelector")}>
          <Link href="/" locale="en" lang="en">
            {t("english")}
          </Link>

          <Link href="/" locale="fr" lang="fr">
            {t("french")}
          </Link>
        </nav>

        <Card className="p-6 sm:p-10">
          <CardHeader className="px-0">
            <p className="text-sm font-medium text-primary">WhitePlate</p>

            <CardTitle>
              <h1 className="mt-3 max-w-xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                {t("title")}
              </h1>
            </CardTitle>

            <CardDescription className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
              {t("description")}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-0">
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"

                nativeButton={false}
                render={<Link href="/sign-up" />}
              >
                {t("getStarted")}
              </Button>

              <Button
                size="lg"
                variant="outline"

                nativeButton={false}
                render={<Link href="/sign-in" />}
              >
                {t("signIn")}
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground">
          {t("themeHint", { key: "d" })}
        </p>
      </div>
    </main>
  )
}

function MenuLoading({ copy }: { copy: string }) {
  return (
    <main
      aria-busy="true"
      className="mx-auto min-h-svh max-w-4xl px-5 py-10 sm:px-8 sm:py-14"
    >
      <p role="status" className="mb-5 text-sm text-muted-foreground">
        {copy}
      </p>

      <div aria-hidden="true" className="motion-safe:animate-pulse">
        <header className="flex items-end justify-between gap-5 border-b border-border pb-6">
          <div className="grid gap-3">
            <div className="h-3 w-20 rounded bg-muted" />

            <div className="h-9 w-64 max-w-full rounded bg-muted" />
          </div>

          <div className="h-9 w-40 rounded-md bg-muted" />
        </header>

        <div className="mt-10 grid gap-10">
          {[0, 1].map((category) => (
            <section key={category} className="grid gap-5">
              <div className="h-7 w-48 rounded bg-muted" />

              {[0, 1, 2].map((product) => (
                <div
                  key={product}
                  className="grid gap-3 border-b border-border pb-5"
                >
                  <div className="h-5 w-56 max-w-full rounded bg-muted" />

                  <div className="h-4 w-80 max-w-full rounded bg-muted" />
                </div>
              ))}
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}
