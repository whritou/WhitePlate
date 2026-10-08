"use client"

import { CheckoutIllustration } from "@/components/redesign/checkout-illustration"
import { RestaurantIdentity } from "@/components/redesign/restaurant-identity"
import { CustomerShell } from "@/components/redesign/customer-shell"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { useGuestCheckout } from "@/hooks/use-guest-checkout"
import { useRouter } from "@/i18n/navigation"
import type { StorefrontMenu } from "@/types/storefront"
import { useLocale, useTranslations } from "next-intl"
import { CheckoutPanel } from "./checkout-panel"
import { GuestCheckoutProvider } from "./guest-checkout-provider"
import { MenuProductCard } from "./menu-product-card"

export function RestaurantMenu({
  menu,
  step,
}: {
  menu: StorefrontMenu
  step: "shop" | "checkout"
}) {
  return (
    <GuestCheckoutProvider tenantId={menu.tenantId}>
      <RestaurantMenuContent menu={menu} step={step} />
    </GuestCheckoutProvider>
  )
}

function RestaurantMenuContent({
  menu,
  step,
}: {
  menu: StorefrontMenu
  step: "shop" | "checkout"
}) {
  const t = useTranslations("Storefront")
  const locale = useLocale()
  const router = useRouter()
  const checkoutState = useGuestCheckout(menu)
  const {
    startLanguageChange,
    cart,
    orderRound,
    locked,
    changeCart,
    products,
  } = checkoutState
  const checkoutView = step === "checkout"
  const price = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: menu.currency,
  })
  const names = new Intl.DisplayNames([locale], { type: "language" })
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const estimate = cart.reduce((sum, item) => {
    const product = products.find(
      (candidate) => candidate.id === item.productId
    )
    const adjustments =
      product?.optionGroups
        .flatMap((group) => group.options)
        .filter((option) => item.optionIds.includes(option.id))
        .reduce((total, option) => total + option.priceAdjustment, 0) ?? 0

    return sum + ((product?.basePrice ?? 0) + adjustments) * item.quantity
  }, 0)

  return (
    <CustomerShell>
      <main className="min-h-svh bg-background pb-24">
        <RestaurantIdentity
          name={menu.restaurantName}
          description={menu.restaurantDescription}
        >
          {menu.availableLocales.length > 1 && (
            <div className="grid gap-xs">
              <Label
                htmlFor="menu-language"
                className="text-xs text-muted-foreground"
              >
                {t("menuLanguage")}
              </Label>

              <NativeSelect
                id="menu-language"
                value={menu.locale}
                disabled={locked}
                className="w-full"
                selectClassName="min-w-40"
                onChange={(event) =>
                  startLanguageChange(() =>
                    router.replace(
                      {
                        pathname: "/",
                        query: { menuLocale: event.target.value },
                      },
                      { scroll: false }
                    )
                  )
                }
              >
                {menu.availableLocales.map((language) => (
                  <NativeSelectOption
                    key={language}
                    value={language}
                    lang={language}
                  >
                    {languageName(names, language)} ({language})
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          )}
        </RestaurantIdentity>

        <div className="mx-auto max-w-[var(--container-storefront)] px-[var(--gutter-mobile)] tablet:px-[var(--gutter)]">
          {checkoutView ? (
            <div className="mx-auto mt-8 grid max-w-6xl items-start gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
              <CheckoutIllustration />

              <CheckoutPanel
                checkoutState={checkoutState}
                mode="checkout"
                onNewOrder={() => {
                  checkoutState.startNewOrder()
                  router.push({
                    pathname: "/",
                    query: { menuLocale: menu.locale },
                  })
                }}
                onBack={() =>
                  router.push({
                    pathname: "/",
                    query: { menuLocale: menu.locale },
                  })
                }
              />
            </div>
          ) : (
            <>
              {menu.categories.length > 0 && (
                <nav
                  aria-label={t("menuSections")}
                  className="sticky top-20 z-20 -mx-[var(--gutter-mobile)] mt-md overflow-x-auto border-y border-border bg-background/95 px-[var(--gutter-mobile)] py-sm backdrop-blur tablet:-mx-[var(--gutter)] tablet:px-[var(--gutter)]"
                >
                  <ul className="flex w-max gap-sm">
                    {menu.categories.map((category) => (
                      <li key={category.id}>
                        <a
                          className="inline-flex min-h-11 items-center rounded-full border border-border bg-card px-md text-label-md whitespace-nowrap text-foreground transition-colors hover:border-primary hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none"
                          href={`#category-${category.id}`}
                        >
                          {category.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}

              <div className="mt-xl grid items-start gap-xl desktop:grid-cols-[minmax(0,1fr)_22rem]">
                <div
                  className="grid min-w-0 content-start gap-xl"
                  lang={menu.locale}
                >
                  {menu.categories.length === 0 && (
                    <Card size="sm" className="border-dashed">
                      <CardContent className="p-lg text-body-md text-muted-foreground">
                        {t("emptyMenu")}
                      </CardContent>
                    </Card>
                  )}

                  {menu.categories.map((category) => (
                    <section
                      key={category.id}
                      aria-labelledby={`category-${category.id}`}
                      className="grid gap-md"
                    >
                      <h2
                        id={`category-${category.id}`}
                        className="scroll-mt-28 font-heading text-headline-md tracking-tight"
                      >
                        {category.name}
                      </h2>

                      {category.products.length === 0 ? (
                        <p className="text-body-sm text-muted-foreground">
                          {t("emptyCategory")}
                        </p>
                      ) : (
                        <ul className="grid items-stretch gap-md tablet:grid-cols-2">
                          {category.products.map((product, imageIndex) => (
                            <li key={product.id} className="min-w-0">
                              <MenuProductCard
                                product={product}
                                imageIndex={imageIndex}
                                item={cart.find(
                                  (item) => item.productId === product.id
                                )}
                                locked={locked}
                                orderRound={orderRound}
                                price={price}
                                onSave={changeCart}
                              />
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>
                  ))}
                </div>

                <aside className="hidden desktop:block">
                  <CheckoutPanel
                    checkoutState={checkoutState}
                    mode="cart"
                    estimatedSubtotal={price.format(estimate)}
                    onNewOrder={checkoutState.startNewOrder}
                    onContinue={() =>
                      router.push({
                        pathname: "/",
                        query: { menuLocale: menu.locale, step: "checkout" },
                      })
                    }
                  />
                </aside>
              </div>

              <Dialog>
                <DialogTrigger
                  disabled={cart.length === 0 || locked}
                  render={
                    <Button
                      type="button"
                      size="lg"
                      className="fixed inset-x-4 bottom-4 z-30 flex min-h-14 justify-between shadow-lg desktop:hidden"
                    />
                  }
                >
                  <span>{t("viewCart", { count: itemCount })}</span>

                  <span className="tabular-nums">{price.format(estimate)}</span>
                </DialogTrigger>

                <DialogContent className="max-w-lg">
                  <header className="shrink-0 border-b border-border p-md">
                    <DialogTitle className="font-heading text-headline-sm">
                      {t("cartTitle")}
                    </DialogTitle>

                    <DialogDescription className="mt-xs">
                      {t("cartCount", { count: itemCount })}
                    </DialogDescription>
                  </header>

                  <div className="min-h-0 overflow-y-auto p-md">
                    <CheckoutPanel
                      checkoutState={checkoutState}
                      mode="cart"
                      estimatedSubtotal={price.format(estimate)}
                      onNewOrder={checkoutState.startNewOrder}
                      onContinue={() =>
                        router.push({
                          pathname: "/",
                          query: { menuLocale: menu.locale, step: "checkout" },
                        })
                      }
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </main>
    </CustomerShell>
  )
}

function languageName(names: Intl.DisplayNames, locale: string) {
  try {
    return names.of(locale) ?? locale
  } catch {
    return locale
  }
}
