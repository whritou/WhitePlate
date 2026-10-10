"use client"
import { Copy } from "@/components/lovable/copy"
import {
  SourceInput,
  SourceTextarea,
  SourceSelect,
  SourceOption,
  SourceLabel,
} from "@/components/ui/lovable-controls"
import { Check, Clock3, CreditCard, MapPin } from "lucide-react"
import { useCustomerCheckoutView } from "./CustomerCheckout-CustomerCheckout-context"
export function CustomerCheckoutSection2() {
  const {
    t,
    name,
    setName,
    email,
    setEmail,
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

        <SourceLabel className="customer-rounded flex cursor-pointer items-start gap-3 border p-4">
          <SourceInput
            type="radio"
            name="pickup"
            checked={pickup === "asap"}
            onChange={() => setPickup("asap")}
            className="mt-1"
          />

          <span>
            <span className="block text-sm font-semibold">
              <Copy>As soon as possible</Copy>
            </span>

            <span className="text-sm text-muted-foreground">
              <Copy>Usually ready in </Copy>

              <Copy>{t.prepTime}</Copy>
            </span>
          </span>
        </SourceLabel>

        <SourceLabel className="customer-rounded mt-3 flex cursor-pointer items-center gap-3 border p-4">
          <SourceInput
            type="radio"
            name="pickup"
            checked={pickup !== "asap"}
            onChange={() => {
              if (slots[0]) setPickup(slots[0])
            }}
          />

          <span className="text-sm font-semibold">
            <Copy>Choose a time</Copy>
          </span>
        </SourceLabel>

        <Copy>
          {pickup !== "asap" && (
            <SourceLabel className="mt-3 block text-sm">
              <span className="mb-2 block">
                <Copy>Collection time</Copy>
              </span>

              <SourceSelect
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
              >
                <Copy>
                  {slots.map((slot) => (
                    <SourceOption key={slot} value={slot}>
                      <Copy>
                        {new Date(slot).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Copy>
                    </SourceOption>
                  ))}
                </Copy>
              </SourceSelect>
            </SourceLabel>
          )}
        </Copy>
      </section>

      <section className="border-t pt-6">
        <h2 className="mb-4 text-lg font-bold">
          <Copy>Your details</Copy>
        </h2>

        <div className="space-y-4">
          <SourceLabel className="block text-sm font-medium">
            <span className="mb-2 block">
              <Copy>Full name</Copy>
            </span>

            <SourceInput
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              placeholder="Your name"
            />
          </SourceLabel>

          <SourceLabel className="block text-sm font-medium">
            <span className="mb-2 block">
              <Copy>Email</Copy>
            </span>

            <SourceInput
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
            />
          </SourceLabel>

          <SourceLabel className="block text-sm font-medium">
            <span className="mb-2 block">
              <Copy>Phone number</Copy>
            </span>

            <SourceInput
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              placeholder="Your phone number"
            />
          </SourceLabel>

          <SourceLabel className="block text-sm font-medium">
            <span className="mb-2 block">
              <Copy>Order notes </Copy>

              <span className="font-normal text-muted-foreground">
                <Copy>(optional)</Copy>
              </span>
            </span>

            <SourceTextarea
              rows={2}
              maxLength={500}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything the kitchen should know?"
            />
          </SourceLabel>
        </div>
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
