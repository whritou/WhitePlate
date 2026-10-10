"use client"

import { Clock3, MapPin, CreditCard } from "lucide-react"
import { useTranslations } from "next-intl"
import { Copy } from "@/components/lovable/copy"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DEFAULT_THEME } from "@/lib/lovable/storeTheme"
import type { GuestCheckoutController } from "@/types/checkout"
import { Receipt } from "./receipt"

export function LiveCheckout({
  state,
  name,
  price,
  estimate,
  onBack,
  onNewOrder,
}: {
  state: GuestCheckoutController
  name: string
  price: Intl.NumberFormat
  estimate: string
  onBack: () => void
  onNewOrder: () => void
}) {
  const c = useTranslations("Checkout")
  const v = useTranslations("LovableLive")

  if (state.receipt)
    return (
      <section className="customer-rounded mx-auto my-8 max-w-2xl border p-6">
        <Receipt receipt={state.receipt} trackingToken={state.trackingToken} />

        <Button className="mt-6" onClick={onNewOrder}>
          {c("newOrder")}
        </Button>
      </section>
    )

  return (
    <div className="mx-auto max-w-[1120px] py-8">
      <Button variant="ghost" onClick={onBack} disabled={state.locked}>
        {c("backToMenu")}
      </Button>

      <h2 className="my-6 text-3xl font-bold">{c("checkoutTitle")}</h2>

      <form
        onSubmit={state.checkout}
        aria-busy={state.submitting}
        className="live-checkout-layout grid items-start gap-10 md:grid-cols-[1.15fr_1fr]"
      >
        <div className="space-y-8">
          <section>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <MapPin size={20} className="text-primary" />
              <Copy>Collect at</Copy> {name}
            </h3>

            <p className="text-sm text-muted-foreground">
              {v("checkoutUnavailable")}
            </p>
          </section>

          <section className="border-t pt-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <Clock3 size={20} className="text-primary" />

              {v("pickup")}
            </h3>

            <fieldset disabled className="grid gap-3 opacity-70">
              <Label className="customer-rounded flex items-center gap-3 border p-4">
                <Input
                  type="radio"
                  checked
                  readOnly
                  className="size-4 min-h-0 w-4"
                />

                <span>
                  <Copy>As soon as possible</Copy>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    <Copy>Usually ready in</Copy> {DEFAULT_THEME.prepTime}
                  </span>
                </span>
              </Label>

              <Label className="customer-rounded flex items-center gap-3 border p-4">
                <Input
                  type="radio"
                  checked={false}
                  readOnly
                  className="size-4 min-h-0 w-4"
                />
                <Copy>Choose a time</Copy>
              </Label>
            </fieldset>
          </section>

          <section className="border-t pt-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <Copy>Your details</Copy>
            </h3>

            <fieldset
              disabled={state.locked || state.cart.length === 0}
              className="grid gap-4"
            >
              <Label className="grid gap-2" htmlFor="customer-name">
                {c("customerName")}

                <Input
                  id="customer-name"
                  name="customerName"
                  autoComplete="name"
                  maxLength={200}
                  required
                  value={state.customerName}
                  onChange={(event) =>
                    state.changeCustomerName(event.target.value)
                  }
                />
              </Label>

              <div className="grid gap-4">
                <Label className="grid gap-2">
                  <Copy>Email</Copy>
                  <Input
                    disabled
                    placeholder="client@example.test"
                    type="email"
                  />
                </Label>

                <Label className="grid gap-2">
                  <Copy>Phone number</Copy>
                  <Input disabled placeholder="+33 6 00 00 00 00" type="tel" />
                </Label>
              </div>

              <Label className="grid gap-2">
                <span>
                  <Copy>Order notes </Copy>
                  <span className="font-normal text-muted-foreground">
                    <Copy>(optional)</Copy>
                  </span>
                </span>

                <Textarea disabled rows={2} maxLength={500} />
              </Label>
            </fieldset>
          </section>

          <section className="border-t pt-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <CreditCard size={20} className="text-primary" />
              <Copy>Payment</Copy>
            </h3>

            <div className="customer-rounded border border-primary bg-secondary p-4">
              <p className="text-sm font-semibold">{v("paymentPending")}</p>

              <p className="mt-2 text-sm text-muted-foreground">
                {v("paymentUnavailable")}
              </p>
            </div>
          </section>
        </div>

        <aside className="border-t pt-6 md:border-t-0 md:border-l md:pt-0 md:pl-8">
          <h3 className="mb-5 text-lg font-bold">{c("cartTitle")}</h3>

          {state.cart.length === 0 ? (
            <p className="text-sm text-muted-foreground">{c("emptyCart")}</p>
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
                        {c("quantity")}

                        <Input
                          className="w-20"
                          type="number"
                          min={1}
                          max={99}
                          step={1}
                          value={item.quantity}
                          disabled={state.locked}
                          aria-label={c("quantityFor", {
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
                        aria-label={c("removeProduct", {
                          product: product?.name ?? "",
                        })}
                        onClick={() =>
                          state.changeCart({ ...item, quantity: 0 })
                        }
                      >
                        {c("remove")}
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          <Label className="mt-4 grid gap-2 text-sm" htmlFor="discount-code">
            {c("discountCode")}

            <Input
              id="discount-code"
              name="discountCode"
              maxLength={64}
              disabled={state.locked}
              value={state.discountCode}
              onChange={(event) => state.changeDiscountCode(event.target.value)}
            />
          </Label>

          <div className="mt-5 flex justify-between border-t pt-5 font-bold">
            <span>{c("estimatedSubtotal")}</span>

            <span>{estimate}</span>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">{c("priceNote")}</p>

          {state.error && (
            <Alert variant="destructive" role="alert" className="mt-4">
              <AlertDescription>{c(`errors.${state.error}`)}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="mt-5 w-full"
            disabled={
              state.submitting ||
              state.changingLanguage ||
              state.cart.length === 0
            }
          >
            {state.submitting
              ? c("placingOrder")
              : state.error === "unavailable"
                ? c("retryOrder")
                : c("placeOrder")}
          </Button>

          {state.submitting && (
            <p role="status" className="mt-2 text-sm">
              {c("placingOrder")}
            </p>
          )}
        </aside>
      </form>
    </div>
  )
}
