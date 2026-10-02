"use client"

import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { OrderReceipt } from "@/types/checkout"
import { useLocale, useTranslations } from "next-intl"

export function Receipt({ receipt }: { receipt: OrderReceipt }) {
  const t = useTranslations("Checkout")
  const price = new Intl.NumberFormat(useLocale(), {
    style: "currency",
    currency: receipt.currency,
  })

  return (
    <section
      aria-labelledby="cart-heading"
      lang={receipt.menuLocale ?? undefined}
    >
      <CardHeader className="px-0">
        <CardTitle>
          <h2 id="cart-heading" className="text-xl font-semibold" role="status">
            {t("orderConfirmed")}
          </h2>
        </CardTitle>

        <p className="mt-2 text-sm">{receipt.customerName}</p>

        <CardDescription className="mt-1 break-all">
          {t("orderReference", { id: receipt.id })}
        </CardDescription>

        <p className="mt-2 text-sm text-muted-foreground">
          {t(`status.${receipt.status}`)}
        </p>
      </CardHeader>

      <CardContent className="px-0">
        <ul className="mt-5 divide-y divide-border">
          {receipt.lines.map((line) => (
            <li key={line.productId} className="py-3">
              <div className="flex justify-between gap-3 text-sm">
                <span>
                  {line.quantity} × {line.productName}
                </span>

                <span className="tabular-nums">{price.format(line.total)}</span>
              </div>

              {line.options.length > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {line.options.map((option) => option.name).join(", ")}
                </p>
              )}
            </li>
          ))}
        </ul>

        <dl className="mt-4 grid gap-2 border-t border-border pt-4 text-sm">
          {[
            [t("subtotal"), receipt.subtotal],
            [
              t("discount"),
              receipt.discountAmount === 0 ? 0 : -receipt.discountAmount,
            ],
            [t("tax"), receipt.taxAmount],
            [t("total"), receipt.total],
          ].map(([label, amount]) => (
            <div
              key={String(label)}
              className="flex justify-between gap-3 last:mt-1 last:text-base last:font-semibold"
            >
              <dt>{label}</dt>

              <dd className="tabular-nums">{price.format(Number(amount))}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </section>
  )
}
