"use client"

import { ArrowRight } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import type { PublicEstablishment } from "@/types/establishment-settings"
import type { GuestCheckoutController } from "@/types/checkout"
import { LiveCheckoutDetails } from "./live-checkout-details"
import { Receipt } from "./receipt"

export function LiveCheckout({
  state,
  name,
  establishment,
  restaurantSlug,
  price,
  estimate,
  onBack,
  onNewOrder,
}: {
  state: GuestCheckoutController
  name: string
  establishment?: PublicEstablishment | null
  restaurantSlug?: string
  price: Intl.NumberFormat
  estimate: string
  onBack: () => void
  onNewOrder: () => void
}) {
  const checkout = useTranslations("Checkout")
  const tracking = useTranslations("OrderTracking")
  const locale = useLocale()

  if (state.receipt)
    return (
      <div className="mx-auto max-w-5xl py-8">
        <Receipt
          receipt={state.receipt}
          trackingToken={state.trackingToken}
          restaurantSlug={restaurantSlug}
        />

        <div className="mt-8 flex justify-end">
          <Button onClick={onNewOrder}>{checkout("newOrder")}</Button>
        </div>
      </div>
    )

  return (
    <div className="mx-auto max-w-5xl py-8">
      <Button variant="ghost" onClick={onBack} disabled={state.locked}>
        {checkout("backToMenu")}
      </Button>

      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-2 text-sm font-semibold text-primary">
            {tracking("clickCollect")}
          </p>

          <h1 className="text-3xl font-bold">{checkout("checkoutTitle")}</h1>
        </div>

        <ol
          aria-label={checkout("checkoutTitle")}
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <li>{checkout("cartTitle")}</li>

          <ArrowRight size={14} aria-hidden="true" />

          <li aria-current="step" className="font-semibold text-foreground">
            {checkout("checkoutTitle")}
          </li>
        </ol>
      </div>

      <form
        onSubmit={state.checkout}
        aria-busy={state.submitting}
        className="live-checkout-layout customer-two-column grid min-w-0 items-start gap-10"
      >
        <LiveCheckoutDetails
          state={state}
          name={name}
          establishment={establishment}
        />

        <aside className="customer-summary min-w-0 border-t pt-6">
          <h2 className="mb-5 text-lg font-bold">{checkout("cartTitle")}</h2>

          {state.cart.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {checkout("emptyCart")}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {state.cart.map((item) => {
                const product = state.products.find(
                  (candidate) => candidate.id === item.productId
                )
                const options =
                  product?.optionGroups
                    .flatMap((group) => group.options)
                    .filter((option) => item.optionIds.includes(option.id)) ??
                  []
                const amount =
                  ((product?.basePrice ?? 0) +
                    options.reduce(
                      (sum, option) => sum + option.priceAdjustment,
                      0
                    )) *
                  item.quantity

                return (
                  <li key={item.productId} className="py-4 first:pt-0">
                    <div className="flex justify-between gap-4 text-sm font-bold">
                      <span>{product?.name}</span>

                      <span>{price.format(amount)}</span>
                    </div>

                    {options.length > 0 && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {options.map((option) => option.name).join(", ")}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <Label className="flex items-center gap-2 text-xs">
                        {checkout("quantity")}

                        <Input
                          className="w-20"
                          type="number"
                          min={1}
                          max={99}
                          step={1}
                          value={item.quantity}
                          disabled={state.locked}
                          aria-label={checkout("quantityFor", {
                            product: product?.name ?? "",
                          })}
                          onChange={(event) => {
                            const quantity = Number(event.target.value)

                            if (
                              Number.isInteger(quantity) &&
                              quantity >= 1 &&
                              quantity <= 99
                            )
                              state.changeCart({ ...item, quantity })
                          }}
                        />
                      </Label>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={state.locked}
                        aria-label={checkout("removeProduct", {
                          product: product?.name ?? "",
                        })}
                        onClick={() =>
                          state.changeCart({ ...item, quantity: 0 })
                        }
                      >
                        {checkout("remove")}
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          <Label className="mt-4 grid gap-2 text-sm" htmlFor="discount-code">
            {checkout("discountCode")}

            <Input
              id="discount-code"
              name="discountCode"
              maxLength={64}
              disabled={state.locked}
              value={state.discountCode}
              onChange={(event) => state.changeDiscountCode(event.target.value)}
            />
          </Label>

          <Label className="mt-4 grid gap-2 text-sm" htmlFor="pickup-time">
            {checkout("pickupTime")}

            <NativeSelect
              id="pickup-time"
              value={state.selectedPickupAt}
              onChange={(event) =>
                state.changePickupAt(event.currentTarget.value)
              }
              disabled={
                state.locked ||
                state.pickupSlotsLoading ||
                state.pickupSlots.length === 0
              }
            >
              <NativeSelectOption value="asap">
                {checkout("asapPickup")}
              </NativeSelectOption>

              {state.pickupSlots.map((slot) => (
                <NativeSelectOption key={slot.startsAt} value={slot.startsAt}>
                  {new Intl.DateTimeFormat(locale, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    timeZone: slot.timeZone,
                    timeZoneName: "shortOffset",
                  }).format(new Date(slot.startsAt))}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Label>

          {state.pickupSlots.length === 0 && !state.pickupSlotsLoading && (
            <p role="status" className="mt-2 text-sm text-muted-foreground">
              {checkout(
                state.pickupAvailabilityState === "schedule_not_configured"
                  ? "scheduleNotConfigured"
                  : "noPickupSlots"
              )}
            </p>
          )}

          <div className="mt-5 flex justify-between border-t pt-5 font-bold">
            <span>{checkout("estimatedSubtotal")}</span>

            <span>{estimate}</span>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            {checkout("priceNote")}
          </p>

          {state.error && (
            <Alert variant="destructive" role="alert" className="mt-4">
              <AlertDescription>
                {checkout(`errors.${state.error}`)}
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="mt-5 w-full"
            disabled={
              state.submitting ||
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
          </Button>

          {state.submitting && (
            <p role="status" className="mt-2 text-sm">
              {checkout("placingOrder")}
            </p>
          )}
        </aside>
      </form>
    </div>
  )
}
