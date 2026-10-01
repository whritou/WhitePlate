import { Alert } from "@/components/ui/alert"
import { Card } from "@/components/ui/card"
import { getTranslations } from "next-intl/server"
import { headers } from "next/headers"
import { Suspense } from "react"
import { getPublicMenu } from "@/lib/api/public-storefront"
import { Link } from "@/i18n/navigation"
import { RestaurantMenu } from "@/components/storefront/restaurant-menu"

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ menuLocale?: string }>
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
  searchParams: Promise<{ menuLocale?: string }>
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
  searchParams: Promise<{ menuLocale?: string }>
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
      <RestaurantMenu key={storefront.menu.tenantId} menu={storefront.menu} />
    )
  if (storefront.kind === "unavailable") {
    const storefrontT = await getTranslations("Storefront")
    return (
      <main className="mx-auto flex min-h-svh max-w-3xl items-center px-5 py-16">
        <Alert
          variant="destructive"
          role="alert"
          className="w-full rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          {storefrontT("unavailable")}
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
        <Card className="rounded-3xl border border-border bg-card p-8 shadow-sm sm:p-12">
          <p className="text-sm font-medium text-primary">WhitePlate</p>
          <h1 className="mt-3 max-w-xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
            {t("description")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/sign-up"
              className="inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {t("getStarted")}
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex h-11 items-center rounded-lg border border-border bg-background px-5 text-sm font-medium text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {t("signIn")}
            </Link>
          </div>
        </Card>
        <p className="font-mono text-xs text-muted-foreground">
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
