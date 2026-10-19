"use client"

import { fixtureReceipt } from "./fixture-receipt"
import { useLocale, useTranslations } from "next-intl"
import { Storefront } from "@/components/storefront/demo/storefront/storefront"
import { RestaurantMenu } from "@/components/storefront/restaurant-menu"
import { customerMenu } from "@/lib/checkout/customer-presentation"
import { STORE_THEME_PARITY_FIXTURE } from "../live-workspace-test/fixture-data"
import type { StorefrontMenu } from "@/types/storefront"
import { useEffect, useState } from "react"
import { CustomerCheckout } from "@/components/storefront/demo/checkout/checkout"
import { CustomerTracking } from "@/components/storefront/demo/tracking/customer-tracking"
import { OrderTracking } from "@/components/storefront/order-tracking"
import {
  GuestCheckoutProvider,
  useGuestCheckoutStore,
} from "@/components/storefront/guest-checkout-provider"
import { useGuestCheckout } from "@/hooks/use-guest-checkout"
import { LiveCustomerShell } from "@/components/storefront/live-customer-shell"
import { LiveCheckout } from "@/components/storefront/live-checkout"
import { customerCart } from "@/lib/checkout/customer-presentation"
import type { StoreTheme } from "@/types/lovable/storeTheme"
import { customerAddressLines } from "@/lib/collection-presentation"
import { CustomerPickupLocation } from "@/components/storefront/customer-pickup-location"
import { CurrentCollectionInformation } from "@/components/storefront/current-collection-information"

export function ParityFixture({
  reference,
  screen,
  pricing = false,
}: {
  reference: boolean
  screen?: string
  pricing?: boolean
}) {
  const locale = useLocale()
  const hours = useTranslations("OpeningHours")
  const checkout = useTranslations("Checkout")
  const food = useTranslations("Storefront")
  const menu: StorefrontMenu = {
    tenantId: "22222222-2222-4222-8222-222222222222",
    restaurantName: "Maison Verte",
    restaurantDescription: "",
    currency: "EUR",
    locale,
    defaultLocale: locale,
    availableLocales: ["fr", "en"],
    establishment: {
      name: "Maison Verte",
      phone: "+33123456789",
      addressLine1: "12 rue de la Roquette",
      addressLine2: null,
      postalCode: "75011",
      city: "Paris",
      region: null,
      countryCode: "FR",
      latitude: null,
      longitude: null,
      timeZone: "Europe/Paris",
      pickupInstruction: null,
      pickupLocale: "fr",
      openingHours: null,
    },
    categories: [
      {
        id: "starters",
        name: "Entrées",
        sortOrder: 0,
        products: [
          {
            id: "33333333-3333-4333-8333-333333333333",
            name: "Burrata",
            description: "Basilic et tomates",
            basePrice: 11,
            containsAllergens: ["milk"],
            isAvailable: true,
            photos: [
              {
                id: "77777777-7777-4777-8777-777777777777",
                width: 640,
                height: 480,
                bytes: 1024,
              },
            ],
            optionGroups: [
              {
                id: "side",
                name: "Accompagnement",
                minimumSelections: 1,
                maximumSelections: 1,
                options: [
                  {
                    id: "88888888-8888-4888-8888-888888888888",
                    name: "Pommes de terre",
                    priceAdjustment: 0.5,
                  },
                  {
                    id: "66666666-6666-4666-8666-666666666666",
                    name: "Salade",
                    priceAdjustment: 1,
                  },
                ],
              },
            ],
          },
          {
            id: "44444444-4444-4444-8444-444444444444",
            name: "Tiramisu",
            description: "Mascarpone, espresso",
            basePrice: 7,
            isAvailable: true,
            photos: [],
            optionGroups: [],
          },
        ],
      },
    ],
  }
  const theme = {
    ...STORE_THEME_PARITY_FIXTURE,
    showBanner: false,
    showRestaurantInfo: false,
    address: screen
      ? customerAddressLines(menu.establishment!, locale).join(", ")
      : "",
    phone: screen ? (menu.establishment!.phone ?? "") : "",
    hours: screen ? hours("notConfigured") : "",
  }
  const cart = customerCart(
    customerMenu(menu),
    [
      {
        productId: menu.categories[0].products[0].id,
        quantity: 1,
        optionIds: ["66666666-6666-4666-8666-666666666666"],
      },
      {
        productId: menu.categories[0].products[1].id,
        quantity: 1,
        optionIds: [],
      },
    ],
    "",
    locale
  )

  if (screen === "tracking" || screen === "confirmation")
    return (
      <div className="lovable-surface">
        {reference ? (
          <CustomerTracking
            t={theme}
            binding={
              screen === "confirmation"
                ? {
                    stage: 0,
                    statusLabel: checkout("status.Pending"),
                    heading: checkout("orderConfirmed"),
                    description: "Alex Martin",
                    pickup: "12:30",
                    headerActions: null,
                    location: (
                      <CustomerPickupLocation
                        name={menu.restaurantName}
                        orderId="55555555-5555-4555-8555-555555555555"
                      >
                        <CurrentCollectionInformation
                          locale={locale}
                          customer
                          muted
                        />
                      </CustomerPickupLocation>
                    ),
                  }
                : undefined
            }
            order={{
              id: "55555555-5555-4555-8555-555555555555",
              name: "",
              lines: cart.lines,
              subtotal: 19,
              discount: 0,
              total: 19,
              pickup: "2026-10-18T10:30:00Z",
              notes: "",
              createdAt: "2026-10-18T10:00:00Z",
              lang: locale,
            }}
            preview
          />
        ) : screen === "confirmation" ? (
          <GuestCheckoutProvider tenantId={menu.tenantId}>
            <LiveCheckoutFixture theme={theme} menu={menu} confirmed />
          </GuestCheckoutProvider>
        ) : (
          <OrderTracking
            orderId="55555555-5555-4555-8555-555555555555"
            name="Maison Verte"
            theme={theme}
            menu={menu}
          />
        )}
      </div>
    )
  if (screen === "checkout")
    return (
      <div className="lovable-surface">
        {reference ? (
          <ReferenceCheckout theme={theme} menu={menu} pricing={pricing} />
        ) : (
          <GuestCheckoutProvider tenantId={menu.tenantId}>
            <LiveCheckoutFixture theme={theme} menu={menu} />
          </GuestCheckoutProvider>
        )}
      </div>
    )

  return (
    <div className="lovable-surface h-dvh min-h-screen">
      {reference ? (
        <Storefront
          t={theme}
          menu={customerMenu(menu, undefined, food)}
          preview
        />
      ) : (
        <RestaurantMenu menu={menu} theme={theme} step="shop" />
      )}
    </div>
  )
}

function ReferenceCheckout({
  theme,
  menu,
  pricing,
}: {
  theme: StoreTheme
  menu: StorefrontMenu
  pricing: boolean
}) {
  const source = customerMenu(menu)

  if (pricing) {
    source.categories.forEach((category) =>
      category.items.forEach((product) => {
        product.tax = 10
      })
    )
    source.discounts = [
      {
        id: "save",
        code: "SAVE",
        type: "fixed",
        value: 2,
        min: 0,
        expires: "",
        active: true,
      },
    ]
  }

  const [cart, setCart] = useState(() =>
    customerCart(
      source,
      menu.categories[0].products.map((product, index) => ({
        productId: product.id,
        quantity: 1,
        optionIds: index === 0 ? ["66666666-6666-4666-8666-666666666666"] : [],
      })),
      "",
      menu.locale
    )
  )

  return (
    <CustomerCheckout
      t={theme}
      menu={source}
      cart={cart}
      onChange={setCart}
      preview
    />
  )
}

function LiveCheckoutFixture({
  theme,
  menu,
  confirmed = false,
}: {
  theme: StoreTheme
  menu: StorefrontMenu
  confirmed?: boolean
}) {
  const state = useGuestCheckout(menu)
  const change = useGuestCheckoutStore((state) => state.changeCart)
  const setReceipt = useGuestCheckoutStore((state) => state.setReceipt)
  const setAttempt = useGuestCheckoutStore((state) => state.setAttempt)

  useEffect(() => {
    menu.categories[0].products.forEach((product, index) =>
      change({
        productId: product.id,
        quantity: 1,
        optionIds: index === 0 ? ["66666666-6666-4666-8666-666666666666"] : [],
      })
    )
    if (confirmed) {
      setAttempt({
        key: "fixture-attempt",
        input: {
          customerName: "Alex Martin",
          customerEmail: "",
          emailUpdatesConsented: false,
          discountCode: null,
          menuLocale: menu.locale,
          trackingToken: "a".repeat(43),
          items: [],
        },
      })
      setReceipt(fixtureReceipt(menu))
    }
  }, [change, menu, confirmed, setReceipt, setAttempt])

  return (
    <LiveCustomerShell theme={theme} showCover>
      <LiveCheckout
        state={state}
        theme={theme}
        establishment={menu.establishment}
        name={menu.restaurantName}
        price={
          new Intl.NumberFormat(menu.locale, {
            style: "currency",
            currency: "EUR",
          })
        }
        onBack={() => {}}
        onNewOrder={() => {}}
      />
    </LiveCustomerShell>
  )
}
