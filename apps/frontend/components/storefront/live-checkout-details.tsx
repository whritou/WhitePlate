"use client"

import { Clock3, MapPin } from "lucide-react"
import { useTranslations } from "next-intl"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckoutEmailUpdates } from "./checkout-email-updates"
import { CheckoutPickupSelector } from "./checkout-pickup-selector"
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
  const { pickupRushBufferMinutes } = state

  return (
    <div className="grid min-w-0 gap-8">
      <section className="customer-rounded grid min-w-0 gap-4 border p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <MapPin size={20} className="text-primary" />

          {checkout("collectionAt", { name })}
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

        <fieldset disabled={state.locked || state.cart.length === 0}>
          <CheckoutPickupSelector
            pickupSlots={state.pickupSlots}
            pickupSlotsLoading={state.pickupSlotsLoading}
            pickupAvailabilityState={state.pickupAvailabilityState}
            selectedPickupAt={state.selectedPickupAt}
            changePickupAt={state.changePickupAt}
          />
        </fieldset>

        {pickupRushBufferMinutes > 0 && (
          <p role="status" className="text-sm text-muted-foreground">
            {checkout("rushBufferNotice", {
              minutes: pickupRushBufferMinutes,
            })}
          </p>
        )}
      </section>

      <section className="grid gap-4 border-t pt-6">
        <h2 className="text-lg font-bold">{checkout("customerDetails")}</h2>

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

          <CheckoutEmailUpdates
            customerEmail={state.customerEmail}
            emailUpdatesConsented={state.emailUpdatesConsented}
            analyticsConsented={state.analyticsConsented ?? false}
            changeCustomerEmail={state.changeCustomerEmail}
            changeEmailUpdatesConsent={state.changeEmailUpdatesConsent}
            changeAnalyticsConsent={state.changeAnalyticsConsent}
          />
        </fieldset>
      </section>

      <section className="grid gap-4 border-t pt-6">
        <p role="note" className="text-sm text-muted-foreground">
          {live("paymentUnavailable")}
        </p>
      </section>
    </div>
  )
}
