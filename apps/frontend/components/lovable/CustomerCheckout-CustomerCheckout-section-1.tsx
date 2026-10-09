"use client"
import { useCustomerCheckoutView } from "./CustomerCheckout-CustomerCheckout-context"
import { CustomerCheckoutSection2 } from "./CustomerCheckout-CustomerCheckout-section-2"
import { CustomerCheckoutSection3 } from "./CustomerCheckout-CustomerCheckout-section-3"
export function CustomerCheckoutSection1() {
  const { onPlace, preview, name, pickup, notes, subtotal, discount, total } =
    useCustomerCheckoutView()

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!preview)
          onPlace?.({
            name: name.trim(),
            pickup: pickup === "asap" ? "As soon as possible" : pickup,
            notes: notes.trim(),
            subtotal,
            discount,
            total,
          })
      }}
      className="grid items-start gap-10 md:grid-cols-[1.15fr_1fr]"
    >
      <CustomerCheckoutSection2 />

      <CustomerCheckoutSection3 />
    </form>
  )
}
