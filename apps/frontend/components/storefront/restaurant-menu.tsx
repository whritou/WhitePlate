"use client"

import { useLocale } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { useGuestCheckout } from "@/hooks/use-guest-checkout"
import { publishedStoreTheme } from "@/lib/lovable/storeTheme"
import { getStorefrontMenuHref } from "@/lib/storefront-preview-routing"
import { GuestCheckoutProvider } from "./guest-checkout-provider"
import { LiveStorefront } from "./live-storefront"
import { LiveCheckout } from "./live-checkout"
import { LiveCustomerShell } from "./live-customer-shell"
import type { StorefrontMenu } from "@/types/storefront"
import type { StoreTheme } from "@/types/lovable/storeTheme"
import { customerAddressLines } from "@/lib/collection-presentation"

export function RestaurantMenu(props: {
  menu: StorefrontMenu
  theme?: StoreTheme
  step: "shop" | "checkout"
  restaurantSlug?: string
}) {
  return (
    <GuestCheckoutProvider tenantId={props.menu.tenantId}>
      <RestaurantMenuContent {...props} />
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
  theme?: StoreTheme
  step: "shop" | "checkout"
  restaurantSlug?: string
}) {
  const locale = useLocale()
  const router = useRouter()
  const state = useGuestCheckout(menu, restaurantSlug)
  const currentTheme = theme ?? publishedStoreTheme(menu.restaurantName, null)
  const goTo = (next: "shop" | "checkout") =>
    router.push(getStorefrontMenuHref(restaurantSlug, menu.locale, next), {
      locale,
    })

  if (step === "shop")
    return (
      <div className="lovable-surface h-dvh min-h-screen">
        <LiveStorefront
          menu={menu}
          theme={currentTheme}
          state={state}
          restaurantSlug={restaurantSlug}
          onCheckout={() => goTo("checkout")}
        />
      </div>
    )

  const price = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: menu.currency,
  })

  return (
    <LiveCustomerShell
      name={menu.restaurantName}
      theme={{
        ...currentTheme,
        address: menu.establishment
          ? customerAddressLines(menu.establishment, locale).join(", ")
          : currentTheme.address,
        phone: menu.establishment?.phone ?? currentTheme.phone,
      }}
      restaurantSlug={restaurantSlug}
      homeHref={getStorefrontMenuHref(restaurantSlug, menu.locale)}
      showCover
    >
      <main>
        <LiveCheckout
          state={state}
          theme={currentTheme}
          name={menu.restaurantName}
          establishment={menu.establishment}
          restaurantSlug={restaurantSlug}
          price={price}
          onBack={() => goTo("shop")}
          onNewOrder={() => {
            state.startNewOrder()
            goTo("shop")
          }}
        />
      </main>
    </LiveCustomerShell>
  )
}
