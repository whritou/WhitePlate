"use client"

import { Check, Clock3, CreditCard, MapPin } from "lucide-react"
import { useTranslations } from "next-intl"
import { CustomerContactFields } from "./customer-contact-fields"
import { CheckoutEmailUpdates } from "./checkout-email-updates"
import { CheckoutPickupSelector } from "./checkout-pickup-selector"
import type { PublicEstablishment } from "@/types/establishment-settings"
import type { GuestCheckoutController } from "@/types/checkout"
import { CollectionInformation } from "./collection-information"
import { Copy } from "@/components/shared/translated-copy"

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
  const { pickupRushBufferMinutes } = state

  return (
    <div className="min-w-0 space-y-8">
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <MapPin size={20} className="text-primary" />

          {checkout("collectionAt", { name })}
        </h2>

        {establishment ? (
          <CollectionInformation establishment={establishment} customer />
        ) : (
          <p className="text-sm text-muted-foreground">
            {checkout("collectionUnavailable")}
          </p>
        )}
      </section>

      <section className="border-t pt-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <Clock3 size={20} className="text-primary" />

          <Copy>Pickup time</Copy>
        </h2>

        <fieldset disabled={state.locked || state.cart.length === 0}>
          <CheckoutPickupSelector
            customer
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

      <section className="border-t pt-6">
        <h2 className="mb-4 text-lg font-bold">
          {checkout("customerDetails")}
        </h2>

        <fieldset
          disabled={state.locked || state.cart.length === 0}
          className="grid gap-4"
        >
          <CustomerContactFields
            name={state.customerName}
            setName={state.changeCustomerName}
            email={state.customerEmail}
            setEmail={state.changeCustomerEmail}
            phone={state.customerPhone}
            setPhone={state.changeCustomerPhone}
            notes={state.orderNotes}
            setNotes={state.changeOrderNotes}
            emailControls={
              <CheckoutEmailUpdates
                customerEmail={state.customerEmail}
                emailUpdatesConsented={state.emailUpdatesConsented}
                analyticsConsented={state.analyticsConsented ?? false}
                changeCustomerEmail={state.changeCustomerEmail}
                changeEmailUpdatesConsent={state.changeEmailUpdatesConsent}
                changeAnalyticsConsent={state.changeAnalyticsConsent}
              />
            }
          />
        </fieldset>
      </section>

      <section className="border-t pt-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <CreditCard size={20} className="text-primary" />

          {checkout("paymentTitle")}
        </h2>

        <div className="customer-rounded border border-primary bg-secondary p-4">
          <p className="flex items-center justify-between text-sm font-semibold">
            {checkout("paymentAtCollection")}

            <Check size={16} className="text-primary" />
          </p>

          <p role="note" className="mt-2 text-sm text-muted-foreground">
            {checkout("paymentDescription")}
          </p>
        </div>
      </section>
    </div>
  )
}
