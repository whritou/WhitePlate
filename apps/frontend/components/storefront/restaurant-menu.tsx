"use client"

import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { useGuestCheckout } from "@/hooks/use-guest-checkout"
import { useRouter } from "@/i18n/navigation"
import type { StorefrontMenu } from "@/types/storefront"
import { useLocale, useTranslations } from "next-intl"
import { CheckoutPanel } from "./checkout-panel"
import { GuestCheckoutProvider } from "./guest-checkout-provider"
import { ProductOrdering } from "./product-ordering"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

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
    <main className="mx-auto min-h-svh max-w-6xl px-4 py-8 pb-24 sm:px-6 lg:px-8 lg:py-12 lg:pb-12">
      <header className="flex flex-wrap items-end justify-between gap-5 border-b border-border pb-6">
        <div>
          <p className="text-sm font-medium text-primary">
            {t("clickCollect")}
          </p>

          <h1 className="mt-2 text-[2rem] font-semibold tracking-tight sm:text-[2.5rem]">
            {menu.restaurantName}
          </h1>
        </div>

        {!checkoutView && (
          <div className="grid gap-1.5">
            <Label
              htmlFor="menu-language"
              className="font-medium text-muted-foreground"
            >
              {t("menuLanguage")}
            </Label>

            <NativeSelect
              id="menu-language"
              value={menu.locale}
              disabled={locked}
              className="w-full"
              selectClassName="w-full"

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
      </header>

      {checkoutView ? (
        <CheckoutPanel
          checkoutState={checkoutState}
          mode="checkout"
          onNewOrder={() => {
            checkoutState.startNewOrder()
            router.push({ pathname: "/", query: { menuLocale: menu.locale } })
          }}
          onBack={() =>
            router.push({
              pathname: "/",
              query: { menuLocale: menu.locale },
            })
          }
        />
      ) : (
        <>
          {menu.restaurantDescription && (
            <p
              className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground"
              lang={menu.locale}
            >
              {menu.restaurantDescription}
            </p>
          )}

          <nav
            aria-label={t("menuSections")}
            className="sticky top-0 z-20 -mx-4 mt-6 overflow-x-auto border-y border-border bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
          >
            <ul className="flex w-max gap-2">
              {menu.categories.map((category) => (
                <li key={category.id}>
                  <a
                    className="inline-flex min-h-10 items-center rounded-full border border-border px-4 text-sm font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    href={`#category-${category.id}`}
                  >
                    {category.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="grid min-w-0 gap-10" lang={menu.locale}>
              {menu.categories.length === 0 && (
                <p className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
                  {t("emptyMenu")}
                </p>
              )}

              {menu.categories.map((category) => (
                <section
                  key={category.id}
                  aria-labelledby={`category-${category.id}`}
                >
                  <h2
                    id={`category-${category.id}`}
                    className="border-b border-border pb-3 text-xl font-semibold tracking-tight"
                  >
                    {category.name}
                  </h2>

                  {category.products.length === 0 && (
                    <p className="pt-4 text-sm text-muted-foreground">
                      {t("emptyCategory")}
                    </p>
                  )}

                  <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                    {category.products.map((product) => (
                      <li
                        key={product.id}
                        className="flex min-w-0 flex-col rounded-lg border border-border bg-card p-4 sm:p-5"
                      >
                        <div className="flex flex-1 items-start justify-between gap-4">
                          <div className="min-w-0">
                            <h3 className="font-semibold">{product.name}</h3>

                            {product.description && (
                              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                {product.description}
                              </p>
                            )}

                            {!product.isAvailable && (
                              <p className="mt-2 text-sm text-muted-foreground">
                                {t("unavailableProduct")}
                              </p>
                            )}
                          </div>

                          <span className="shrink-0 text-base font-semibold tabular-nums">
                            {price.format(product.basePrice)}
                          </span>
                        </div>

                        {product.isAvailable && (
                          <ProductOrdering
                            key={`${product.id}-${orderRound}`}
                            product={product}
                            item={cart.find(
                              (item) => item.productId === product.id
                            )}
                            locked={locked}
                            price={price}
                            onSave={changeCart}
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>

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

          <Dialog>
            <DialogTrigger
              disabled={cart.length === 0 || locked}
              render={
                <Button
                  type="button"
                  size="lg"
                  className="fixed inset-x-4 bottom-4 z-30 flex min-h-14 justify-between shadow-lg lg:hidden"
                />
              }
            >
              <span>{t("viewCart", { count: itemCount })}</span>

              <span className="tabular-nums">{price.format(estimate)}</span>
            </DialogTrigger>

            <DialogContent className="max-w-lg">
              <header className="shrink-0 border-b border-border p-5">
                <DialogTitle className="text-xl font-semibold">
                  {t("cartTitle")}
                </DialogTitle>

                <DialogDescription className="mt-1">
                  {t("cartCount", { count: itemCount })}
                </DialogDescription>
              </header>

              <div className="min-h-0 overflow-y-auto p-4 sm:p-5">
                <CheckoutPanel
                  checkoutState={checkoutState}
                  mode="cart"
                  estimatedSubtotal={price.format(estimate)}
                  onNewOrder={checkoutState.startNewOrder}
                  onContinue={() => {
                    router.push({
                      pathname: "/",
                      query: { menuLocale: menu.locale, step: "checkout" },
                    })
                  }}
                />
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </main>
  )
}

function languageName(names: Intl.DisplayNames, locale: string) {
  try {
    return names.of(locale) ?? locale
  } catch {
    return locale
  }
}
