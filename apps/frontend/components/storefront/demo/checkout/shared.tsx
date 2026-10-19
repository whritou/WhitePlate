"use client"
import { Copy } from "@/components/shared/translated-copy"
import { tx } from "@/lib/lovable/menu"
import type { CustomerOrder } from "@/lib/lovable/customerOrder"
export function OrderItems({
  order,
  money = (value: number) => `€${value.toFixed(2)}`,
}: {
  order: Pick<CustomerOrder, "lines" | "lang">
  money?: (value: number) => string
}) {
  return (
    <ul className="divide-y divide-border">
      {order.lines.map((l) => (
        <li key={l.key} className="flex gap-3 py-4">
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
              <Copy>{l.qty}</Copy> × {tx(l.product, "n", order.lang)}
            </p>

            <Copy>
              {l.picks.length > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  <Copy>{l.picks.join(" · ")}</Copy>
                </p>
              )}
            </Copy>
          </div>

          <span className="shrink-0 text-sm font-semibold">
            <Copy>{money(l.qty * l.unit)}</Copy>
          </span>
        </li>
      ))}
    </ul>
  )
}
