"use client"
import { Copy } from "@/components/shared/translated-copy"
import { Link } from "@/components/demo/shared/navigation"
import { ArrowRight, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/lovable-button"
import { CustomerShell } from "@/components/storefront/demo/shared/customer-shell"
import { useCustomerCheckoutView } from "./context"
import { CustomerCheckoutSection1 } from "./section-1"
export function CustomerCheckoutView() {
  const { t, cart, preview, binding } = useCustomerCheckoutView()

  if (binding && !cart.lines.length)
    return (
      <div className="py-16 text-center">
        <ShoppingBag className="mx-auto mb-5 h-10 w-10 text-primary" />

        <h1 className="text-3xl font-bold">
          <Copy>Your basket is empty</Copy>
        </h1>

        <p className="mt-3 text-muted-foreground">
          <Copy>Something delicious is waiting on the menu.</Copy>
        </p>

        <Button type="button" className="mt-6" onClick={binding.onEdit}>
          <Copy>Browse menu</Copy>
          <ArrowRight />
        </Button>
      </div>
    )

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

  const content = (
    <>
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
    </>
  )

  return binding ? (
    content
  ) : (
    <CustomerShell t={t} preview={preview}>
      {content}
    </CustomerShell>
  )
}
