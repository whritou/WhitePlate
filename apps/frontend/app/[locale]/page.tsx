import { headers } from "next/headers"
import { getLocale, getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { getPublicMenu, type StorefrontMenu } from "@/lib/api/public-storefront"

export async function generateMetadata({ searchParams }: {
  searchParams: Promise<{ menuLocale?: string }>
}) {
  const [t, query, requestHeaders] = await Promise.all([
    getTranslations("HomePage"), searchParams, headers(),
  ])
  const storefront = await getPublicMenu(requestHeaders.get("host"), query.menuLocale)
  return storefront.kind === "menu"
    ? { title: storefront.menu.restaurantName, description: t("storefrontDescription", { restaurant: storefront.menu.restaurantName }) }
    : { title: t("title"), description: t("description") }
}

export default async function Page({ searchParams }: {
  searchParams: Promise<{ menuLocale?: string }>
}) {
  const [t, uiLocale, query, requestHeaders] = await Promise.all([
    getTranslations("HomePage"), getLocale(), searchParams, headers(),
  ])
  const storefront = await getPublicMenu(requestHeaders.get("host"), query.menuLocale)
  if (storefront.kind === "menu") {
    const storefrontT = await getTranslations("Storefront")
    return <RestaurantMenu menu={storefront.menu} uiLocale={uiLocale} copy={{
      menuLanguage: storefrontT("menuLanguage"),
      changeLanguage: storefrontT("changeLanguage"),
      menuDescription: storefrontT("menuDescription"),
      emptyMenu: storefrontT("emptyMenu"),
      emptyCategory: storefrontT("emptyCategory"),
      unavailableProduct: storefrontT("unavailableProduct"),
    }} />
  }
  if (storefront.kind === "unavailable") {
    const storefrontT = await getTranslations("Storefront")
    return <main className="mx-auto flex min-h-svh max-w-3xl items-center px-5 py-16">
      <p role="alert" className="w-full rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{storefrontT("unavailable")}</p>
    </main>
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
        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm sm:p-12">
          <p className="text-sm font-medium text-primary">WhitePlate</p>
          <h1 className="mt-3 max-w-xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">{t("title")}</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">{t("description")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/sign-up" className="inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">{t("getStarted")}</Link>
            <Link href="/sign-in" className="inline-flex h-11 items-center rounded-lg border border-border bg-background px-5 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">{t("signIn")}</Link>
          </div>
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          {t("themeHint", { key: "d" })}
        </p>
      </div>
    </main>
  )
}

function RestaurantMenu({ menu, uiLocale, copy }: {
  menu: StorefrontMenu
  uiLocale: string
  copy: {
    menuLanguage: string
    changeLanguage: string
    menuDescription: string
    emptyMenu: string
    emptyCategory: string
    unavailableProduct: string
  }
}) {
  const price = new Intl.NumberFormat(uiLocale, { style: "currency", currency: menu.currency })
  const languageNames = new Intl.DisplayNames([uiLocale], { type: "language" })
  return <main className="mx-auto min-h-svh max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
    <header className="flex flex-wrap items-end justify-between gap-5 border-b border-border pb-6">
      <div><p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">WhitePlate</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{menu.restaurantName}</h1>
      </div>
      <form action={`/${uiLocale}`} method="get" className="grid gap-1.5">
        <label htmlFor="menu-language" className="text-xs font-medium text-muted-foreground">{copy.menuLanguage}</label>
        <select id="menu-language" name="menuLocale" defaultValue={menu.locale}
          className="h-9 min-w-40 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/30">
          {menu.availableLocales.map((locale) => <option key={locale} value={locale} lang={locale}>
            {getLanguageName(languageNames, locale)} ({locale})
          </option>)}
        </select>
        <Button type="submit" variant="outline" size="sm" className="justify-self-start">{copy.changeLanguage}</Button>
      </form>
    </header>
    <p className="mt-5 text-sm text-muted-foreground">{copy.menuDescription}</p>
    {menu.categories.length === 0 ? <p className="mt-10 rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">{copy.emptyMenu}</p> :
      <div className="mt-9 grid gap-10">
        {menu.categories.map((category) => <section key={category.id} aria-labelledby={`category-${category.id}`}>
          <h2 id={`category-${category.id}`} className="border-b border-border pb-3 text-xl font-semibold tracking-tight">{category.name}</h2>
          {category.products.length === 0 ? <p className="pt-4 text-sm text-muted-foreground">{copy.emptyCategory}</p> :
            <ul className="divide-y divide-border">
              {category.products.map((product) => <li key={product.id} className="py-5">
                <div className="flex flex-wrap items-start justify-between gap-x-5 gap-y-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium">{product.name}</h3>
                      {!product.isAvailable && <span className="rounded-sm bg-muted px-2 py-0.5 text-xs text-muted-foreground">{copy.unavailableProduct}</span>}
                    </div>
                    {product.description && <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{product.description}</p>}
                  </div>
                  <span className="shrink-0 text-sm font-medium tabular-nums">{price.format(product.basePrice)}</span>
                </div>
                {product.optionGroups.length > 0 && <ul className="mt-4 grid gap-3 border-l border-border pl-4">
                  {product.optionGroups.map((group) => <li key={group.id}>
                    <p className="text-sm font-medium">{group.name}</p>
                    <ul className="mt-1 grid gap-1 text-sm text-muted-foreground">
                      {group.options.map((option) => <li key={option.id} className="flex justify-between gap-3">
                        <span>{option.name}</span><span className="tabular-nums">{option.priceAdjustment === 0 ? "" : `+${price.format(option.priceAdjustment)}`}</span>
                      </li>)}
                    </ul>
                  </li>)}
                </ul>}
              </li>)}
            </ul>}
        </section>)}
      </div>}
  </main>
}

function getLanguageName(names: Intl.DisplayNames, locale: string) {
  try {
    return names.of(locale) ?? locale
  } catch {
    return locale
  }
}
