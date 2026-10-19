"use client"
import { CustomerPickupChoices } from "../../customer-pickup-choices"
import { CustomerContactFields } from "../../customer-contact-fields"
import { CheckoutEmailUpdates } from "../../checkout-email-updates"
import { Copy } from "@/components/shared/translated-copy"
import { Check, Clock3, CreditCard, MapPin } from "lucide-react"
import { useCustomerCheckoutView } from "./context"
export function CustomerCheckoutSection2() {
  const {
    t,
    name,
    setName,
    email,
    setEmail,
    emailUpdatesConsented,
    setEmailUpdatesConsented,
    analyticsConsented,
    setAnalyticsConsented,
    phone,
    setPhone,
    pickup,
    setPickup,
    slots,
    notes,
    setNotes,
  } = useCustomerCheckoutView()

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <MapPin size={20} className="text-primary" />{" "}
          <Copy> Collect at </Copy>
          <Copy>{t.name}</Copy>
        </h2>

        <p className="text-sm">
          <Copy>{t.address}</Copy>
        </p>

        <p className="mt-2 text-sm text-muted-foreground">
          <Copy>{t.hours}</Copy>
        </p>
      </section>

      <section className="border-t pt-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <Clock3 size={20} className="text-primary" />{" "}
          <Copy> Pickup time</Copy>
        </h2>

        <CustomerPickupChoices
          value={pickup}
          onChange={setPickup}
          slots={slots.map((slot) => ({
            value: slot,
            label: new Date(slot).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          }))}
          asapDescription={
            <>
              <Copy>Usually ready in </Copy>
              <Copy>{t.prepTime}</Copy>
            </>
          }
        />
      </section>

      <section className="border-t pt-6">
        <h2 className="mb-4 text-lg font-bold">
          <Copy>Your details</Copy>
        </h2>

        <CustomerContactFields
          name={name}
          setName={setName}
          email={email}
          setEmail={setEmail}
          phone={phone}
          setPhone={setPhone}
          notes={notes}
          setNotes={setNotes}
          emailControls={
            <CheckoutEmailUpdates
              customerEmail={email}
              changeCustomerEmail={setEmail}
              emailUpdatesConsented={emailUpdatesConsented}
              changeEmailUpdatesConsent={setEmailUpdatesConsented}
              analyticsConsented={analyticsConsented}
              changeAnalyticsConsent={setAnalyticsConsented}
            />
          }
        />
      </section>

      <section className="border-t pt-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <CreditCard size={20} className="text-primary" />{" "}
          <Copy> Payment</Copy>
        </h2>

        <div className="customer-rounded border border-primary bg-secondary p-4">
          <p className="flex items-center justify-between text-sm font-semibold">
            <Copy>Demo checkout </Copy>

            <Check size={16} className="text-primary" />
          </p>

          <p className="mt-2 text-sm text-muted-foreground">
            <Copy>
              No payment will be taken. This order will not be sent to the
              restaurant.
            </Copy>
          </p>
        </div>
      </section>
    </div>
  )
}
