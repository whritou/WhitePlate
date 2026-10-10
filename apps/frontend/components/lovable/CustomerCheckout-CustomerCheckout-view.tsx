"use client"
import { Copy } from "@/components/lovable/copy"
import { Link } from "@/components/lovable/navigation"
import { ArrowRight, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/lovable-button"
import { CustomerShell } from "@/components/lovable/CustomerShell"
import { useCustomerCheckoutView } from "./CustomerCheckout-CustomerCheckout-context"
import { CustomerCheckoutSection1 } from "./CustomerCheckout-CustomerCheckout-section-1"
export function CustomerCheckoutView() {
  const { t, cart, preview } = useCustomerCheckoutView()

  if (!cart.lines.length)
    return (
      <CustomerShell t={t} preview={preview}>
        <div className="py-16 text-center">
          <ShoppingBag className="mx-auto mb-5 h-10 w-10 text-primary" />

          <h1 className="text-3xl font-bold">
            <Copy>Your basket is empty</Copy>
          </h1>

          <p className="mt-3 text-muted-foreground">
            <Copy>Something delicious is waiting on the menu.</Copy>
          </p>

          <Button asChild className="mt-6">
            <Link to="/store">
              <Copy>Browse menu </Copy>

              <ArrowRight />
            </Link>
          </Button>
        </div>
      </CustomerShell>
    )

  return (
    <CustomerShell t={t} preview={preview}>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mb-2 text-sm font-semibold text-primary">
            <Copy>Click & collect</Copy>
          </p>

          <h1 className="text-3xl font-bold">
            <Copy>Checkout</Copy>
          </h1>
        </div>

        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShoppingBag size={16} /> <Copy> Basket </Copy>
          <ArrowRight size={14} />{" "}
          <span className="font-semibold text-foreground">
            <Copy>Checkout</Copy>
          </span>
        </span>
      </div>

      <CustomerCheckoutSection1 />
    </CustomerShell>
  )
}
