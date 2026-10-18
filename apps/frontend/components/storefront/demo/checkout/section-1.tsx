"use client"
import { useCustomerCheckoutView } from "./context"
import { CustomerCheckoutSection2 } from "./section-2"
import { CustomerCheckoutSection3 } from "./section-3"
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
      className="customer-two-column grid min-w-0 items-start gap-10"
    >
      <CustomerCheckoutSection2 />

      <CustomerCheckoutSection3 />
    </form>
  )
}
