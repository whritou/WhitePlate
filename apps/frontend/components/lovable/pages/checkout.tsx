"use client"
import { Copy } from "@/components/lovable/copy"
import { useNavigate } from "@/components/lovable/navigation"
import { useState } from "react"
import { CustomerCheckout } from "@/components/lovable/CustomerCheckout"
import { useStoreTheme } from "@/hooks/lovable/use-store-theme"
import { saveCustomerOrder, useCustomerCart } from "@/lib/lovable/customerOrder"
export function CheckoutPage() {
  const { theme, menu } = useStoreTheme()
  const { cart, update, loaded } = useCustomerCart()
  const navigate = useNavigate()
  const [error, setError] = useState("")

  if (!loaded)
    return (
      <div className="p-8" role="status">
        <Copy>Loading checkout…</Copy>
      </div>
    )

  return (
    <>
      <Copy>
        {error && (
          <p role="alert" className="bg-destructive p-3 text-background">
            <Copy>{error}</Copy>
          </p>
        )}
      </Copy>

      <CustomerCheckout
        t={theme}
        menu={menu}
        cart={cart}
        onChange={update}
        onPlace={(details) => {
          const id = `WP-${crypto.randomUUID().slice(0, 8).toUpperCase()}`

          if (
            !saveCustomerOrder({
              ...details,
              id,
              lines: cart.lines,
              lang: cart.lang,
              createdAt: new Date().toISOString(),
            })
          ) {
            setError(
              "Your order could not be saved in this browser. Please try again."
            )

            return
          }

          navigate({ to: "/track/$orderId", params: { orderId: id } })
        }}
      />
    </>
  )
}
