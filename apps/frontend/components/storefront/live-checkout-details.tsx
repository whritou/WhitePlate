"use client"

import { Clock3, CreditCard, MapPin } from "lucide-react"
import { useTranslations } from "next-intl"
import { Copy } from "@/components/shared/translated-copy"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { PublicEstablishment } from "@/types/establishment-settings"
import type { GuestCheckoutController } from "@/types/checkout"
import { CollectionInformation } from "./collection-information"

export function LiveCheckoutDetails({
  state,
  name,
  establishment,
}: {
  state: GuestCheckoutController
  name: string
  establishment?: PublicEstablishment | null
}) {
  const checkout = useTranslations("Checkout")
  const live = useTranslations("LovableLive")

  return (
    <div className="grid min-w-0 gap-8">
      <section className="customer-rounded grid min-w-0 gap-4 border p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <MapPin size={20} className="text-primary" />
          <Copy>Collect at</Copy> {name}
        </h2>

        {establishment ? (
          <CollectionInformation establishment={establishment} />
        ) : (
          <p className="text-sm text-muted-foreground">
            {live("checkoutUnavailable")}
          </p>
        )}
      </section>

      <section className="grid gap-4 border-t pt-6">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Clock3 size={20} className="text-primary" />

          {live("pickup")}
        </h2>

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
                {live("checkoutUnavailable")}
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

      <section className="grid gap-4 border-t pt-6">
        <h2 className="text-lg font-bold">
          <Copy>Your details</Copy>
        </h2>

        <fieldset
          disabled={state.locked || state.cart.length === 0}
          className="grid gap-4"
        >
          <Label className="grid gap-2" htmlFor="customer-name">
            {checkout("customerName")}

            <Input
              id="customer-name"
              name="customerName"
              autoComplete="name"
              maxLength={200}
              required
              value={state.customerName}
              onChange={(event) => state.changeCustomerName(event.target.value)}
            />
          </Label>

          <div className="grid gap-4 sm:grid-cols-2">
            <Label className="grid gap-2">
              <Copy>Email</Copy>
              <Input disabled placeholder="client@example.test" type="email" />
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

      <section className="grid gap-4 border-t pt-6">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <CreditCard size={20} className="text-primary" />
          <Copy>Payment</Copy>
        </h2>

        <div className="customer-rounded border border-primary bg-secondary p-4">
          <p className="text-sm font-semibold">{live("paymentPending")}</p>

          <p className="mt-2 text-sm text-muted-foreground">
            {live("paymentUnavailable")}
          </p>
        </div>
      </section>
    </div>
  )
}
