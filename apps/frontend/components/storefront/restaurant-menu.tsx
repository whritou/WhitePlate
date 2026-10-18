"use client"

import { LiveCheckout } from "./live-checkout"
import { LiveRestaurantIdentity as RestaurantIdentity } from "./live-restaurant-identity"
import { LiveCustomerShell as CustomerShell } from "./live-customer-shell"
import { LiveStoreActions } from "./live-store-actions"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"

import { useGuestCheckout } from "@/hooks/use-guest-checkout"
import { useRouter } from "@/i18n/navigation"
import { useState } from "react"
import type { StorefrontMenu } from "@/types/storefront"
import type { StoreTheme } from "@/types/lovable/storeTheme"
import { useLocale, useTranslations } from "next-intl"
import { CheckoutPanel } from "./checkout-panel"
import { GuestCheckoutProvider } from "./guest-checkout-provider"
import { MenuProductCard } from "./menu-product-card"
import { CollectionInformation } from "./collection-information"
import { Button } from "@/components/ui/button"
import { publishedStoreTheme } from "@/lib/lovable/storeTheme"
import { getStorefrontMenuHref } from "@/lib/storefront-preview-routing"

export function RestaurantMenu({
  menu,
  theme,
  step,
  restaurantSlug,
}: {
  menu: StorefrontMenu
  theme?: StoreTheme
  step: "shop" | "checkout"
  restaurantSlug?: string
}) {
  const currentTheme = theme ?? publishedStoreTheme(menu.restaurantName, null)

  return (
    <GuestCheckoutProvider tenantId={menu.tenantId}>
      <RestaurantMenuContent
        menu={menu}
        theme={currentTheme}
        step={step}
        restaurantSlug={restaurantSlug}
      />
    </GuestCheckoutProvider>
  )
}

function RestaurantMenuContent({
  menu,
  theme,
  step,
  restaurantSlug,
}: {
  menu: StorefrontMenu
  theme: StoreTheme
  step: "shop" | "checkout"
  restaurantSlug?: string
}) {
  const t = useTranslations("Storefront")
  const locale = useLocale()
  const router = useRouter()
  const checkoutState = useGuestCheckout(menu, restaurantSlug)
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const { cart, orderRound, locked, changeCart, products } = checkoutState
  const checkoutView = step === "checkout"
  const selectedCategoryExists = menu.categories.some(
    (category) => category.id === activeCategoryId
  )
  const visibleCategories = selectedCategoryExists
    ? menu.categories.filter((category) => category.id === activeCategoryId)
    : menu.categories
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
        theme={theme}
        restaurantSlug={restaurantSlug}
        homeHref={getStorefrontMenuHref(restaurantSlug, menu.locale)}
        showCover={checkoutView}
        stickyHeader={!checkoutView}
        headerActions={
          <LiveStoreActions
            menu={menu}
            restaurantSlug={restaurantSlug}
            checkoutState={checkoutState}
            count={itemCount}
            amount={price.format(estimate)}
            checkoutView={checkoutView}
          />
        }
      >
        <main
          className={`min-h-[60vh] bg-background ${checkoutView ? "" : "pb-24"}`}
        >
          {!checkoutView && (
            <RestaurantIdentity
              name={menu.restaurantName}
              description={menu.restaurantDescription}
              theme={theme}
            />
          )}

          <div className="mx-auto w-full px-6">
            {checkoutView ? (
              <LiveCheckout
                state={checkoutState}
                name={menu.restaurantName}
                establishment={menu.establishment}
                restaurantSlug={restaurantSlug}
                price={price}
                estimate={price.format(estimate)}
                onNewOrder={() => {
                  checkoutState.startNewOrder()
                  router.push(
                    getStorefrontMenuHref(restaurantSlug, menu.locale),
                    { locale }
                  )
                }}
                onBack={() =>
                  router.push(
                    getStorefrontMenuHref(restaurantSlug, menu.locale),
                    { locale }
                  )
                }
              />
            ) : (
              <>
                {theme.showRestaurantInfo && menu.establishment && (
                  <CollectionInformation
                    establishment={menu.establishment}
                    compact
                  />
                )}

                {menu.categories.length > 0 && (
                  <nav
                    aria-label={t("menuSections")}
                    className="-mx-6 mt-4 overflow-x-auto px-6 py-4"
                  >
                    <ul className="flex w-max gap-2">
                      <li>
                        <Button
                          type="button"
                          size="sm"
                          variant={
                            selectedCategoryExists ? "outline" : "default"
                          }
                          aria-pressed={!selectedCategoryExists}
                          className="min-h-11 whitespace-nowrap"
                          onClick={() => setActiveCategoryId(null)}
                        >
                          {t("allCategories")}
                        </Button>
                      </li>

                      {menu.categories.map((category) => (
                        <li key={category.id}>
                          <Button
                            type="button"
                            size="sm"
                            variant={
                              activeCategoryId === category.id
                                ? "default"
                                : "outline"
                            }
                            aria-pressed={activeCategoryId === category.id}
                            className="min-h-11 whitespace-nowrap"
                            onClick={() => setActiveCategoryId(category.id)}
                          >
                            {category.name}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </nav>
                )}

                <div className="mt-4 grid items-start gap-6">
                  <div
                    className="grid min-w-0 content-start gap-[var(--customer-gap)]"
                    lang={menu.locale}
                  >
                    {menu.categories.length === 0 && (
                      <Card size="sm" className="border-dashed">
                        <CardContent className="p-lg text-body-md text-muted-foreground">
                          {t("emptyMenu")}
                        </CardContent>
                      </Card>
                    )}

                    {visibleCategories.map((category) => (
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
                          <ul
                            className={`items-stretch gap-[var(--customer-gap)] ${theme.layout === "grid" ? "customer-product-grid grid" : "flex flex-col"}`}
                          >
                            {category.products.map((product, imageIndex) => (
                              <li key={product.id} className="min-w-0">
                                <MenuProductCard
                                  product={product}
                                  restaurantSlug={restaurantSlug}
                                  layout={theme.layout}
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
                        router.push(
                          getStorefrontMenuHref(
                            restaurantSlug,
                            menu.locale,
                            "checkout"
                          ),
                          { locale }
                        )
                      }
                    />
                  </div>
                </DialogContent>
              </>
            )}
          </div>

          {!checkoutView && itemCount > 0 && (
            <DialogTrigger
              render={
                <Button className="sticky bottom-4 z-10 mx-6 flex w-[calc(100%-3rem)] items-center justify-between" />
              }
            >
              <span>
                {t("cartCount", { count: itemCount })} ·{" "}
                {price.format(estimate)}
              </span>

              <span>{t("cartTitle")} →</span>
            </DialogTrigger>
          )}
        </main>
      </CustomerShell>
    </Dialog>
  )
}
