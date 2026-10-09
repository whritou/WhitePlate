"use client"

import Image from "next/image"
import { Printer, RotateCcw, ShoppingBag, PiggyBank } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import { calculateDemoOrder } from "@/lib/checkout/demo-order"
import { useDemo } from "./demo-provider"

export function TrackingBag() {
  const t = useTranslations("Redesign")
  const locale = useLocale()
  const demo = useDemo()
  const items = demo.receipt?.items ?? demo.cart
  const totals =
    demo.receipt ?? calculateDemoOrder(demo.products, items, demo.discountCode)
  const price = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
  })

  return (
    <Card className="gap-6 border-0 p-6 shadow-sm sm:p-8">
      <CardHeader className="flex items-center justify-between p-0">
        <div>
          <p className="mb-2 text-xs font-semibold text-brand-text">
            {t("orderSummary")}
          </p>

          <CardTitle>
            <h2 className="text-xl">{t("bagContent")} (#WP-1049)</h2>
          </CardTitle>
        </div>

        <Badge variant="neutral">
          <ShoppingBag aria-hidden="true" />

          {t("items", {
            count: items.reduce((sum, item) => sum + item.quantity, 0),
          })}
        </Badge>
      </CardHeader>

      <CardContent className="grid gap-6 p-0">
        <ul className="grid gap-5">
          {items.map((item) => {
            const product = demo.products.find(
              (candidate) => candidate.id === item.productId
            )!

            return (
              <li key={item.productId} className="flex items-start gap-3">
                <Image
                  src={product.image}
                  alt=""
                  width={64}
                  height={64}
                  className="size-16 rounded-md object-cover"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2 text-sm">
                    <strong>
                      {item.quantity}× {product.name}
                    </strong>

                    <span className="shrink-0 tabular-nums">
                      {price.format(item.quantity * product.basePrice)}
                    </span>
                  </div>

                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                    {product.description}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>

        <div className="grid gap-3 rounded-lg bg-muted p-4 text-sm">
          <p className="flex justify-between text-muted-foreground">
            <span>{t("subtotal")}</span>

            <span>{price.format(totals.subtotal)}</span>
          </p>

          <p className="flex justify-between text-success">
            <span>{t("directDiscount")}</span>

            <span>−{price.format(totals.discount)}</span>
          </p>

          <p className="flex justify-between text-muted-foreground">
            <span>{t("estimatedTax")}</span>

            <span>{price.format(totals.tax)}</span>
          </p>

          <p className="flex justify-between border-t border-border pt-3 text-lg font-bold">
            <span>{t("totalPaid")}</span>

            <span>{price.format(totals.total)}</span>
          </p>

          <p className="text-right text-xs text-muted-foreground">
            {t("simulatedPayment")}
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-md bg-secondary p-4">
          <PiggyBank aria-hidden="true" className="size-9 text-brand-text" />

          <div>
            <strong className="text-sm">{t("savedToday")}</strong>

            <p className="mt-1 text-xs text-muted-foreground">
              {t("noMarkup")}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer aria-hidden="true" />

            {t("downloadReceipt")}
          </Button>

          <Button
            nativeButton={false}
            render={<Link href="/demo" />}
            onClick={demo.resetOrder}
            className="bg-obsidian text-white hover:bg-obsidian/90"
          >
            <RotateCcw aria-hidden="true" />

            {t("orderAgain")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
