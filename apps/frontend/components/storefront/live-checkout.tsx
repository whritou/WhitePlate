"use client"

import { useLocale, useTranslations } from "next-intl"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/lovable-button"
import { CustomerCheckoutProvider } from "./demo/checkout/context"
import { useCustomerCheckoutModel } from "./demo/checkout/model"
import { CustomerCheckoutView } from "./demo/checkout/view"
import {
  customerMenu,
  customerCart,
} from "@/lib/checkout/customer-presentation"
import { DEFAULT_THEME } from "@/lib/lovable/storeTheme"
import { AnalyticsWithdrawalForm } from "./analytics-withdrawal-form"
import { Link } from "@/i18n/navigation"
import type { PublicEstablishment } from "@/types/establishment-settings"
import type { GuestCheckoutController } from "@/types/checkout"
import type { StoreTheme } from "@/types/lovable/storeTheme"
import { LiveCheckoutDetails } from "./live-checkout-details"
import { Receipt } from "./receipt"
import { ArrowRight } from "lucide-react"
import { cartItemKey } from "@/lib/checkout/cart"
import { useOrderQuote } from "@/hooks/use-order-quote"
import { Copy } from "@/components/shared/translated-copy"

export function LiveCheckout({
  state,
  name,
  theme = DEFAULT_THEME,
  establishment,
  restaurantSlug,
  price,
  onBack,
  onNewOrder,
}: {
  state: GuestCheckoutController
  name: string
  theme?: StoreTheme
  establishment?: PublicEstablishment | null
  restaurantSlug?: string
  price: Intl.NumberFormat
  onBack: () => void
  onNewOrder: () => void
}) {
  const checkout = useTranslations("Checkout")
  const locale = useLocale()
  const quote = useOrderQuote(
    state.tenantId,
    {
      menuLocale: state.menuLocale,
      discountCode: state.discountCode || null,
      items: state.cart,
    },
    !state.receipt && !state.locked,
    restaurantSlug
  )
  const quoteReady = !!quote.data && !quote.isFetching && !quote.isError
  const menu = customerMenu(
    {
      tenantId: "",
      restaurantName: name,
      restaurantDescription: null,
      currency: "EUR",
      locale,
      defaultLocale: locale,
      availableLocales: [locale],
      categories: [
        { id: "menu", name: "", sortOrder: 0, products: state.products },
      ],
    },
    restaurantSlug
  )
  const cart = customerCart(menu, state.cart, state.discountCode, locale)
  const model = useCustomerCheckoutModel({
    t: theme,
    menu,
    cart,
    onChange: () => {},
    preview: true,
  })

  if (state.receipt)
    return (
      <>
        <Receipt
          receipt={state.receipt}
          trackingToken={state.trackingToken}
          restaurantSlug={restaurantSlug}
          restaurantPhone={establishment?.phone}
          theme={theme}
          name={name}
          products={state.products}
          notes={state.orderNotes}
        />

        <div className="mt-8 border-t pt-6">
          <AnalyticsWithdrawalForm tenantId={state.receipt.tenantId} />

          <Link
            className="mt-3 inline-flex min-h-11 items-center text-sm text-primary underline-offset-4 hover:underline"
            href={`/analytics-privacy/${state.receipt.tenantId}`}
          >
            {checkout("analyticsPrivacyLink")}
          </Link>
        </div>

        <div className="mt-8 flex justify-end">
          <Button onClick={onNewOrder}>{checkout("newOrder")}</Button>
        </div>
      </>
    )

  return (
    <CustomerCheckoutProvider
      model={{
        ...model,
        quantity: (id, delta) => {
          if (state.locked) return

          const item = state.cart.find((item) => cartItemKey(item) === id)

          if (item && item.quantity + delta <= 99)
            state.changeCart({ ...item, quantity: item.quantity + delta })
        },
        onChange: (cart) => {
          if (!state.locked) {
            state.changeDiscountCode(cart.code)
            model.setCode(cart.code)
          }
        },
        codeError: "",
        discountResult:
          state.discountCode && quoteReady
            ? { ok: true, amount: quote.data!.discountAmount, msg: "" }
            : null,
        subtotal: quote.data?.subtotal ?? model.subtotal,
        discount: quote.data?.discountAmount ?? 0,
        total: quote.data?.total ?? model.subtotal,
        apply: () => state.changeDiscountCode(model.code.trim().toUpperCase()),
        binding: {
          taxAmount: quote.data?.taxAmount,
          money: (value) =>
            !quoteReady && !state.locked
              ? "—"
              : price.resolvedOptions().currency === "EUR"
                ? `€${value.toFixed(2)}`
                : price.format(value),
          locked: state.locked,
          onEdit: onBack,
          onSubmit: (event) => {
            if (quoteReady || state.locked) return state.checkout(event)
            event.preventDefault()
          },
          details: (
            <LiveCheckoutDetails
              state={state}
              name={name}
              establishment={establishment}
            />
          ),
          priceNote: <Copy>Taxes included</Copy>,
          footer: (
            <>
              {quote.isFetching && !state.locked && (
                <p role="status" className="mt-2 text-sm">
                  {checkout("quoteLoading")}
                </p>
              )}

              {quote.isError && !state.locked && (
                <div role="alert" className="mt-4 text-sm text-destructive">
                  <p>
                    {checkout(
                      quote.error.message === "invalid"
                        ? "quoteInvalid"
                        : "quoteUnavailable"
                    )}
                  </p>

                  <Button
                    type="button"
                    variant="link"
                    className="h-auto px-0"
                    onClick={() => quote.refetch()}
                  >
                    {checkout("quoteRetry")}
                  </Button>
                </div>
              )}

              {state.error && (
                <Alert variant="destructive" role="alert" className="mt-4">
                  <AlertDescription>
                    {checkout(`errors.${state.error}`)}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="mt-6 h-12 w-full whitespace-normal"
                disabled={
                  state.submitting ||
                  (!quoteReady && !state.locked) ||
                  state.changingLanguage ||
                  state.cart.length === 0 ||
                  state.pickupSlotsLoading ||
                  state.pickupSlots.length === 0
                }
              >
                {state.submitting
                  ? checkout("placingOrder")
                  : state.error === "unavailable"
                    ? checkout("retryOrder")
                    : checkout("placeOrder")}

                <ArrowRight />
              </Button>

              {state.submitting && (
                <p role="status" className="mt-2 text-sm">
                  {checkout("placingOrder")}
                </p>
              )}
            </>
          ),
        },
      }}
    >
      <CustomerCheckoutView />
    </CustomerCheckoutProvider>
  )
}
