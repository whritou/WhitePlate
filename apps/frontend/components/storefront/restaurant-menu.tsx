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
  const { startLanguageChange, cart, orderRound, locked, changeCart } =
    checkoutState
  const checkoutView = step === "checkout"
  const price = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: menu.currency,
  })
  const names = new Intl.DisplayNames([locale], { type: "language" })

  return (
    <main className="mx-auto min-h-svh max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
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
          <p className="mt-5 text-sm text-muted-foreground">
            {t("menuDescription")}
          </p>

          <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="grid gap-10" lang={menu.locale}>
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

                  <ul className="divide-y divide-border">
                    {category.products.map((product) => (
                      <li key={product.id} className="py-5">
                        <div className="flex items-start justify-between gap-5">
                          <div className="min-w-0">
                            <h3 className="font-medium">{product.name}</h3>

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
              onNewOrder={checkoutState.startNewOrder}
              onContinue={() =>
                router.push({
                  pathname: "/",
                  query: { menuLocale: menu.locale, step: "checkout" },
                })
              }
            />
          </div>
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
