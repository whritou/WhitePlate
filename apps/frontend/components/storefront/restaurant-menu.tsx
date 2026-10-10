"use client"

import { CheckoutIllustration } from "@/components/redesign/checkout-illustration"
import { LiveRestaurantIdentity as RestaurantIdentity } from "./live-restaurant-identity"
import { LiveCustomerShell as CustomerShell } from "./live-customer-shell"
import { LiveStoreActions } from "./live-store-actions"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"

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
  const { cart, orderRound, locked, changeCart, products } = checkoutState
  const checkoutView = step === "checkout"
  const price = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: menu.currency,
  })

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
    <Dialog>
      <CustomerShell
        name={menu.restaurantName}
        headerActions={
          <LiveStoreActions
            menu={menu}
            checkoutState={checkoutState}
            count={itemCount}
            amount={price.format(estimate)}
            checkoutView={checkoutView}
          />
        }
      >
        <main className="min-h-svh bg-background pb-24">
          <RestaurantIdentity
            name={menu.restaurantName}
            description={menu.restaurantDescription}
          />

          <div className="mx-auto w-full px-6">
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
                    className="sticky top-0 z-20 -mx-6 mt-4 overflow-x-auto border-y border-border bg-background px-6 py-3"
                  >
                    <ul className="flex w-max gap-sm">
                      {menu.categories.map((category) => (
                        <li key={category.id}>
                          <a
                            className="inline-flex min-h-11 items-center rounded-full border border-border bg-card px-md text-label-md whitespace-nowrap text-foreground transition-colors hover:border-input hover:bg-surface-variant focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:border-primary active:bg-surface-dim motion-reduce:transition-none"
                            href={`#category-${category.id}`}
                          >
                            {category.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                )}

                <div className="mt-4 grid items-start gap-6">
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
                          <ul className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                </div>

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
              </>
            )}
          </div>
        </main>
      </CustomerShell>
    </Dialog>
  )
}
