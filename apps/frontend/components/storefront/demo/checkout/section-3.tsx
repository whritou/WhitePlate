"use client"
import { Copy } from "@/components/shared/translated-copy"
import { SourceInput } from "@/components/ui/lovable-controls"
import { Link } from "@/components/demo/shared/navigation"
import { ArrowRight, Check, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/lovable-button"
import { tx } from "@/lib/lovable/menu"
import { useCustomerCheckoutView } from "./context"
import { useTranslations } from "next-intl"
export function CustomerCheckoutSection3() {
  const checkout = useTranslations("Checkout")
  const {
    cart,
    onChange,
    preview,
    code,
    setCode,
    codeError,
    subtotal,
    discountResult,
    discount,
    total,
    taxAmount,
    quantity,
    apply,
    binding,
  } = useCustomerCheckoutView()

  const money = binding?.money ?? ((value: number) => `€${value.toFixed(2)}`)

  return (
    <aside className="customer-summary min-w-0 border-t pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">
          <Copy>Your order</Copy>
        </h2>

        <Copy>
          {!preview && (
            <Button asChild variant="link" className="h-auto px-0">
              <Link to="/store">
                <Copy>Edit basket</Copy>
              </Link>
            </Button>
          )}
        </Copy>
      </div>

      <ul className="divide-y divide-border">
        {cart.lines.map((l) => (
          <li key={l.key} className="flex gap-3 py-5">
            <Copy>
              {l.product.images[0] && (
                <img
                  src={l.product.images[0]}
                  alt=""
                  className="customer-rounded h-16 w-16 shrink-0 object-cover"
                />
              )}
            </Copy>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">
                {tx(l.product, "n", cart.lang)}
              </p>

              <Copy>
                {l.picks.length > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    <Copy>{l.picks.join(" · ")}</Copy>
                  </p>
                )}
              </Copy>

              <div className="mt-3 flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  aria-label={`Remove one ${l.product.n}`}
                  onClick={() => quantity(l.key, -1)}
                  disabled={binding?.locked}
                >
                  <Minus />
                </Button>

                <span className="w-4 text-center text-sm">
                  <Copy>{l.qty}</Copy>
                </span>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  aria-label={`Add one ${l.product.n}`}
                  onClick={() => quantity(l.key, 1)}
                  disabled={binding?.locked || l.qty >= 99}
                >
                  <Plus />
                </Button>
              </div>
            </div>

            <span className="shrink-0 text-sm font-semibold">
              <Copy>{money(l.unit * l.qty)}</Copy>
            </span>
          </li>
        ))}
      </ul>

      <div className="flex gap-2 border-t pt-5">
        <SourceInput
          aria-label="Discount code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Discount code"
          disabled={binding?.locked}
        />

        <Button
          type="button"
          variant="secondary"
          className="h-auto"
          onClick={apply}
          disabled={binding?.locked}
        >
          <Copy>Apply</Copy>
        </Button>
      </div>

      <Copy>
        {codeError && (
          <p role="alert" className="mt-2 text-sm text-destructive">
            <Copy>{codeError}</Copy>
          </p>
        )}
      </Copy>

      <Copy>
        {discountResult && !discountResult.ok && (
          <p role="alert" className="mt-2 text-sm text-destructive">
            <Copy>{discountResult.msg}</Copy>
          </p>
        )}
      </Copy>

      <Copy>
        {discountResult?.ok && (
          <p className="mt-2 flex items-center justify-between text-sm text-primary">
            <span>
              <Check size={14} className="mr-1 inline" />
              <Copy>{cart.code}</Copy> <Copy> applied</Copy>
            </span>

            <Button
              type="button"
              variant="link"
              className="h-auto p-0"
              onClick={() => {
                onChange({ ...cart, code: "" })
                setCode("")
              }}
            >
              <Copy>Remove</Copy>
            </Button>
          </p>
        )}
      </Copy>

      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <dt>
            <Copy>Subtotal</Copy>
          </dt>

          <dd>
            <Copy>{money(subtotal)}</Copy>
          </dd>
        </div>

        <Copy>
          {discount > 0 && (
            <div className="flex justify-between text-primary">
              <dt>
                <Copy>Discount</Copy>
              </dt>

              <dd>
                −<Copy>{money(discount)}</Copy>
              </dd>
            </div>
          )}
        </Copy>

        <div className="flex justify-between text-muted-foreground">
          <dt>
            <Copy>Pickup</Copy>
          </dt>

          <dd>
            <Copy>Free</Copy>
          </dd>
        </div>

        {(binding?.taxAmount ?? taxAmount) > 0 && (
          <div className="flex justify-between text-muted-foreground">
            <dt>{checkout("quoteTax")}</dt>

            <dd>{money(binding?.taxAmount ?? taxAmount)}</dd>
          </div>
        )}

        <div className="flex justify-between border-t pt-4 text-xl font-bold">
          <dt>
            <Copy>Total</Copy>
          </dt>

          <dd>
            <Copy>{money(total)}</Copy>
          </dd>
        </div>
      </dl>

      <p className="mt-2 text-xs text-muted-foreground">
        {binding?.priceNote ?? <Copy>Taxes included</Copy>}
      </p>

      {binding ? (
        binding.footer
      ) : (
        <>
          <Button
            type={preview ? "button" : "submit"}
            disabled={preview}
            className="mt-6 h-12 w-full whitespace-normal"
          >
            <Copy>Place demo order · €</Copy>
            <Copy>{total.toFixed(2)}</Copy> <ArrowRight />
          </Button>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            <Copy>Demo only · No charge · No restaurant notification</Copy>
          </p>
        </>
      )}
    </aside>
  )
}
