"use client"

import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import {
  SourceButton,
  SourceSelect,
  SourceOption,
} from "@/components/ui/lovable-controls"
import { CustomerRestaurantInfo } from "./customer-restaurant-info"
import {
  customerAddressLines,
  summarizeHours,
} from "@/lib/collection-presentation"
import { StorefrontProvider } from "./demo/storefront/context"
import { useStorefrontModel } from "./demo/storefront/model"
import { StorefrontView } from "./demo/storefront/view"
import {
  customerMenu,
  customerCart,
} from "@/lib/checkout/customer-presentation"
import { getStorefrontMenuHref } from "@/lib/storefront-preview-routing"
import { cartItemKey } from "@/lib/checkout/cart"
import type { GuestCheckoutController } from "@/types/checkout"
import type { StorefrontMenu } from "@/types/storefront"
import type { StoreTheme } from "@/types/lovable/storeTheme"
import type { Product } from "@/types/lovable/menu"

export function LiveStorefront({
  menu,
  theme,
  state,
  restaurantSlug,
  onCheckout,
}: {
  menu: StorefrontMenu
  theme: StoreTheme
  state: GuestCheckoutController
  restaurantSlug?: string
  onCheckout: () => void
}) {
  const text = useTranslations("Storefront")
  const checkout = useTranslations("Checkout")
  const collection = useTranslations("CollectionInformation")
  const hours = useTranslations("OpeningHours")
  const tracking = useTranslations("OrderTracking")
  const locale = useLocale()
  const router = useRouter()
  const presentation = customerMenu(menu, restaurantSlug, text)
  const cart = customerCart(
    presentation,
    state.cart,
    state.discountCode,
    menu.locale
  )
  const model = useStorefrontModel({
    t: { ...theme, tagline: menu.restaurantDescription ?? "" },
    menu: presentation,
    preview: true,
  })
  const count = cart.lines.reduce((sum, line) => sum + line.qty, 0)
  const subtotal = cart.lines.reduce(
    (sum, line) => sum + line.unit * line.qty,
    0
  )
  const change = (id: string, delta: number) => {
    if (state.locked) return

    const item = state.cart.find((item) => cartItemKey(item) === id)

    if (item && item.quantity + delta <= 99)
      state.changeCart({ ...item, quantity: item.quantity + delta })
  }

  const add = (
    product: Product,
    _picks: string[],
    _unit: number,
    qty = 1,
    optionIds: string[] = []
  ) => {
    if (state.locked) return

    const current = state.cart.find(
      (item) =>
        cartItemKey(item) === cartItemKey({ productId: product.id, optionIds })
    )

    state.changeCart({
      productId: product.id,
      quantity: Math.min(99, (current?.quantity ?? 0) + qty),
      optionIds,
    })
  }

  return (
    <StorefrontProvider
      model={{
        ...model,
        lang: menu.locale,
        lines: cart.lines,
        count,
        subtotal,
        total: subtotal,
        money: (value) =>
          menu.currency === "EUR"
            ? `€${value.toFixed(2)}`
            : new Intl.NumberFormat(locale, {
                style: "currency",
                currency: menu.currency,
              }).format(value),
        disc: null,
        applied: state.discountCode,
        setApplied: (value) =>
          state.changeDiscountCode(
            typeof value === "function" ? value(state.discountCode) : value
          ),
        qtyOf: (id) =>
          state.cart
            .filter((item) => item.productId === id)
            .reduce((sum, item) => sum + item.quantity, 0),
        add,
        change,
        quickRemove: (id) => {
          const last = state.cart.findLast((item) => item.productId === id)

          if (last) change(cartItemKey(last), -1)
        },
        quickAdd: (product) => {
          if (state.locked) return
          if (product.options.length) model.setOpen(product)
          else add(product, [], product.p)
        },
        binding: {
          locked: state.locked,
          onCheckout,
          discountNote: state.discountCode ? (
            <p className="text-xs text-muted-foreground">
              {checkout("priceNote")}
            </p>
          ) : null,
          restaurantInfo: menu.establishment ? (
            <CustomerRestaurantInfo
              label={collection("title")}
              items={[
                {
                  label: collection("addressLabel"),
                  content:
                    customerAddressLines(menu.establishment, locale).join(
                      ", "
                    ) || collection("missingAddress"),
                },
                {
                  label: collection("hoursLabel"),
                  content: summarizeHours(
                    menu.establishment.openingHours,
                    locale,
                    hours("closed"),
                    hours("notConfigured")
                  ),
                },
                {
                  label: collection("phoneLabel"),
                  content: menu.establishment.phone ? (
                    <a
                      href={`tel:${menu.establishment.phone.replace(/\s/g, "")}`}
                    >
                      {menu.establishment.phone}
                    </a>
                  ) : (
                    collection("notProvided")
                  ),
                },
              ]}
            />
          ) : null,
          bannerBadge: (
            <p
              className="inline-block px-2 py-1 text-xs font-bold tracking-widest uppercase"
              style={{
                background: theme.accent,
                color: theme.text,
                borderRadius: model.r,
              }}
            >
              {tracking("clickCollect")}
            </p>
          ),
          headerActions: (
            <div className="flex max-w-full flex-wrap items-center gap-2">
              {menu.availableLocales.length > 1 && (
                <SourceSelect
                  value={menu.locale}
                  disabled={state.locked}
                  aria-label={text("menuLanguage")}
                  className="px-2 py-2 text-sm font-bold uppercase"
                  style={{
                    border: `1px solid ${model.line}`,
                    borderRadius: model.r,
                    background: theme.bg,
                    color: theme.text,
                  }}
                  onChange={(event) =>
                    state.startLanguageChange(() =>
                      router.replace(
                        getStorefrontMenuHref(
                          restaurantSlug,
                          event.target.value
                        ),
                        { locale, scroll: false }
                      )
                    )
                  }
                >
                  {menu.availableLocales.map((language) => (
                    <SourceOption key={language} value={language}>
                      {language.toUpperCase()}
                    </SourceOption>
                  ))}
                </SourceSelect>
              )}

              <SourceButton
                onClick={() => model.setCartOpen(true)}
                disabled={!model.cartLoaded || state.locked}
                className="px-4 py-2 text-sm font-bold"
                style={{
                  background: theme.primary,
                  color: theme.bg,
                  borderRadius: model.r,
                }}
              >
                {model.u("basket")} · {count}
              </SourceButton>
            </div>
          ),
        },
      }}
    >
      <StorefrontView />
    </StorefrontProvider>
  )
}
